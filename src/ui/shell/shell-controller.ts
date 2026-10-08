import { batch } from '@preact/signals';
import type { SceneAnnotationStore } from '../../engine/annotation/annotation-system.ts';
import type { FocusController } from '../../engine/rooms/focus-controller.ts';
import type { PropertyScene } from '../../engine/viewer/property-scene.ts';
import type { KNXPropertyBusController } from '../../integrations/knx/index.ts';
import { CIRCUITS } from '../../integrations/knx/constants.ts';
import {
  activeTool,
  currentRoomId,
  deviceRevision,
  floorMode,
  graphicsFps,
  graphicsMode,
  graphicsTierLabel,
  guestMode,
  isMobile,
  liveLevels,
  navigatorOpen,
  noteMeta,
  pruneNoteMeta,
  roomPanelOpen,
  sectionCut,
  showToast,
  storeGraphicsMode,
  timeOfDay,
  tradeView,
  viewMode,
  type ShellTool,
  type ShellViewMode,
} from '../../state/shell-store.ts';
import { twinStore } from '../../state/twin-store.ts';
import { buildShareUrl, isRoomZoneId } from '../../state/url-state.ts';
import type { CircuitId } from '../../core/types/knx.ts';
import type { FloorViewMode, SceneAnnotationRecord, TimeOfDay } from '../../core/types/scene.ts';
import type { RoomZoneId } from '../../core/types/topology.ts';
import type {
  GraphicsMode,
  RoomSceneControl,
  ShareViewState,
  TradeView,
} from '../../core/types/twin-ux.ts';
import { TRADE_VIEW_LABELS } from '../../core/types/twin-ux.ts';
import type { AnnotatorHudController } from '../annotator/annotator-hud.ts';
import {
  copyTextWithFallback,
  downloadBlobFile,
  exportAnnotationsAsJsonFile,
  exportAnnotationsAsUsdaFile,
  formatAnnotationsMarkdownReport,
} from '../annotator/annotator-export.ts';
import { TOD_LUX_MAP, syncEnvironmentButtonsUI } from '../hud/hud-sun-and-weather.ts';
import {
  floorModeForRoom,
  getRoomBounds,
  getRoomLabel,
  getRoomLevelScenes,
  getRoomManifest,
} from './room-data.ts';

/** Hooks back into the legacy (developer-mode) HUD so its readouts stay in sync. */
export interface LegacyHudSync {
  syncFloorModeUI(): void;
  syncWalkthroughUI(): void;
}

export interface ShellDeps {
  readonly scene: PropertyScene;
  readonly knx: KNXPropertyBusController;
  readonly annotations: SceneAnnotationStore;
  readonly annotator: AnnotatorHudController;
  readonly focus: FocusController;
  readonly legacy: LegacyHudSync;
  /** Physical address used for gate commands. */
  readonly gatePa: string;
  /** Physical address of the kitchen Corston switch (whole-house scene recall). */
  readonly kitchenScenePa: string;
}

const LEVEL_PUSH_INTERVAL_MS = 120;

function readOptionalNumber(source: object, key: string): number | null {
  const v: unknown = Reflect.get(source, key);
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function readOptionalString(source: object, key: string): string | null {
  const v: unknown = Reflect.get(source, key);
  return typeof v === 'string' && v.length > 0 ? v : null;
}

function luxToTimeOfDay(lux: number): TimeOfDay {
  return lux >= 200 ? 'day' : lux >= 20 ? 'dusk' : 'night';
}

/**
 * Imperative glue between the Preact shell and the engine/KNX controllers.
 * Components read shell-store signals and call these actions; nothing in the
 * components talks to the scene directly.
 */
export class ShellController {
  public readonly deps: ShellDeps;
  private levelPushTimer: ReturnType<typeof setTimeout> | null = null;
  private lastLevelPush = 0;

  public constructor(deps: ShellDeps) {
    this.deps = deps;
  }

  /** Subscribes to engine/KNX events and seeds the shell signals. */
  public init(): void {
    const { scene, knx, annotations } = this.deps;

    batch(() => {
      currentRoomId.value = scene.getCurrentRoomId();
      tradeView.value = scene.getTradeView();
      floorMode.value = scene.getFloorViewMode();
      sectionCut.value = scene.isCeilingCutaway();
      graphicsMode.value = scene.getGraphicsMode();
      liveLevels.value = { ...knx.getLiveLevels() };
      timeOfDay.value = luxToTimeOfDay(knx.getAmbientLux());
      viewMode.value = scene.isWalkthroughMode() ? 'walk' : '3d';
    });
    this.refreshGraphicsReadout();

    scene.onCurrentRoomChanged((zoneId) => {
      currentRoomId.value = zoneId;
    });
    scene.onTradeViewChanged((view) => {
      tradeView.value = view;
    });
    scene.onViewChanged((view) => {
      if (floorMode.value !== view.floorViewMode) floorMode.value = view.floorViewMode;
      const cut = scene.isCeilingCutaway();
      if (sectionCut.value !== cut) sectionCut.value = cut;
    });
    scene.getWalkthrough().subscribe(() => {
      const walking = scene.isWalkthroughMode();
      if (walking && viewMode.value !== 'walk') viewMode.value = 'walk';
      else if (!walking && viewMode.value === 'walk') viewMode.value = '3d';
    });

    knx.subscribe((event) => {
      if (event.type === 'stateChange') {
        this.pushLiveLevels();
        deviceRevision.value += 1;
        const tod = luxToTimeOfDay(knx.getAmbientLux());
        if (tod !== timeOfDay.value) timeOfDay.value = tod;
      }
    });
    scene.getUfhSystem()?.subscribe(() => {
      deviceRevision.value += 1;
    });

    annotations.subscribe((records) => {
      pruneNoteMeta(records.map((r) => r.id));
    });

    // Tool state follows the annotator (which owns the scene annotation callbacks).
    const syncTool = (): void => {
      const active = twinStore.annotatorActive.value;
      const tool = twinStore.annotationTool.value;
      const next: ShellTool = !active ? 'orbit' : tool === 'measure' ? 'measure' : 'note';
      if (activeTool.value !== next) activeTool.value = next;
    };
    twinStore.annotatorActive.subscribe(syncTool);
    twinStore.annotationTool.subscribe(syncTool);

    // Double-click a surface to jump into that room.
    scene.setOnSurfaceDoubleClick((p) => {
      const room = this.deps.focus.findRoomAt(p.x, p.y, p.z);
      if (room) this.selectRoom(room.zoneId);
    });
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  public selectRoom(zoneId: RoomZoneId, fly = true): void {
    const { scene } = this.deps;
    scene.selectRoom(zoneId);
    // Mirror immediately in case the engine defers the change notification.
    currentRoomId.value = scene.getCurrentRoomId() ?? zoneId;
    if (fly) {
      const entry = getRoomManifest(zoneId);
      const bounds = getRoomBounds(entry?.zoneId ?? zoneId);
      if (bounds) {
        scene.flyToRoomBounds(bounds, entry ? floorModeForRoom(entry) : 'ground');
        if (viewMode.value === 'plan') viewMode.value = '3d';
      }
      this.deps.legacy.syncFloorModeUI();
    }
    if (isMobile.value) navigatorOpen.value = false;
    if (isMobile.value) roomPanelOpen.value = true;
  }

  public setFloor(mode: FloorViewMode): void {
    this.deps.scene.setFloorViewMode(mode);
    floorMode.value = mode;
    this.deps.legacy.syncFloorModeUI();
  }

  public setViewMode(mode: ShellViewMode): void {
    const { scene } = this.deps;
    if (mode === 'walk') {
      this.setTool('orbit');
      scene.setWalkthroughMode(true);
    } else {
      if (scene.isWalkthroughMode()) scene.setWalkthroughMode(false);
      const keepFloor = scene.getFloorViewMode();
      if (mode === 'plan') {
        scene.flyToPreset('top');
      } else if (viewMode.value === 'plan') {
        const room = currentRoomId.value;
        const bounds = room ? getRoomBounds(room) : null;
        if (bounds) scene.flyToRoomBounds(bounds, keepFloor);
        else scene.flyToPreset('overview');
      }
      if (scene.getFloorViewMode() !== keepFloor) scene.setFloorViewMode(keepFloor);
    }
    viewMode.value = scene.isWalkthroughMode() ? 'walk' : mode === 'walk' ? '3d' : mode;
    floorMode.value = scene.getFloorViewMode();
    this.deps.legacy.syncWalkthroughUI();
    this.deps.legacy.syncFloorModeUI();
  }

  public recenter(): void {
    const { scene } = this.deps;
    if (scene.isWalkthroughMode()) return;
    scene.recenterView();
    this.deps.legacy.syncFloorModeUI();
  }

  public setTool(tool: ShellTool): void {
    const { annotator, scene } = this.deps;
    if (tool !== 'orbit' && scene.isWalkthroughMode()) {
      scene.setWalkthroughMode(false);
      this.deps.legacy.syncWalkthroughUI();
    }
    annotator.activateTool(tool === 'orbit' ? null : tool === 'measure' ? 'measure' : 'pin');
    activeTool.value = tool;
  }

  public toggleTool(tool: Exclude<ShellTool, 'orbit'>): void {
    this.setTool(activeTool.value === tool ? 'orbit' : tool);
  }

  public toggleSection(): void {
    sectionCut.value = this.deps.scene.toggleCeilingCutaway();
    this.deps.legacy.syncFloorModeUI();
  }

  public setTradeView(view: TradeView): void {
    this.deps.scene.setTradeView(view);
    tradeView.value = this.deps.scene.getTradeView();
  }

  // ---------------------------------------------------------------------------
  // Graphics
  // ---------------------------------------------------------------------------

  public setGraphicsMode(mode: GraphicsMode): void {
    this.deps.scene.setGraphicsMode(mode);
    graphicsMode.value = this.deps.scene.getGraphicsMode();
    storeGraphicsMode(mode);
    this.refreshGraphicsReadout();
  }

  /** Reads tier/FPS from graphics settings when the engine exposes them. */
  public refreshGraphicsReadout(): void {
    const settings = this.deps.scene.getGraphicsSettings();
    const tier = readOptionalString(settings, 'tier');
    const qualityLabel =
      settings.quality === 'ultra' ? 'Ultra' : settings.quality === 'balanced' ? 'Balanced' : 'Performance';
    graphicsTierLabel.value = tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : qualityLabel;
    graphicsFps.value = readOptionalNumber(settings, 'fps');
  }

  // ---------------------------------------------------------------------------
  // Lights & devices
  // ---------------------------------------------------------------------------

  /** Throttled mirror of KNX live levels into the panel (called from the frame loop too). */
  public pushLiveLevels(): void {
    const now = performance.now();
    const elapsed = now - this.lastLevelPush;
    if (elapsed >= LEVEL_PUSH_INTERVAL_MS) {
      this.lastLevelPush = now;
      liveLevels.value = { ...this.deps.knx.getLiveLevels() };
      return;
    }
    if (this.levelPushTimer) return;
    this.levelPushTimer = setTimeout(() => {
      this.levelPushTimer = null;
      this.lastLevelPush = performance.now();
      liveLevels.value = { ...this.deps.knx.getLiveLevels() };
    }, LEVEL_PUSH_INTERVAL_MS - elapsed);
  }

  public isKnownCircuit(circuitId: string): circuitId is CircuitId {
    return CIRCUITS.some((c) => c.id === circuitId);
  }

  public toggleLight(circuitId: string): void {
    if (!this.isKnownCircuit(circuitId)) return;
    this.deps.knx.toggleCircuit(circuitId);
  }

  public setLightLevel(circuitId: string, pct: number): void {
    if (!this.isKnownCircuit(circuitId)) return;
    this.deps.knx.setCircuitLevel(circuitId, Math.round(Math.max(0, Math.min(100, pct))));
  }

  public recallScene(sceneCtl: RoomSceneControl): void {
    this.deps.knx.recallScene(sceneCtl.sceneNumber, sceneCtl.pa);
    showToast(`${sceneCtl.label} scene`);
  }

  public applyLevels(levels: Readonly<Partial<Record<CircuitId, number>>>, label?: string): void {
    for (const c of CIRCUITS) {
      const level = levels[c.id];
      if (level !== undefined) this.deps.knx.setCircuitLevel(c.id, level);
    }
    if (label) showToast(`${label}`);
  }

  public allLightsOff(): void {
    const live = this.deps.knx.getLiveLevels();
    for (const c of CIRCUITS) {
      if ((live[c.id] ?? 0) > 0) this.deps.knx.setCircuitLevel(c.id, 0);
    }
    showToast('All lights off');
  }

  /** Whole-house evening mood: kitchen "Lounge" scene + each room's middle preset. */
  public eveningScene(): void {
    this.deps.knx.recallScene(2, this.deps.kitchenScenePa);
    const zones = new Set<RoomZoneId>();
    for (const c of CIRCUITS) zones.add(c.zoneId);
    for (const zoneId of zones) {
      const presets = getRoomLevelScenes(zoneId);
      const preset = presets[1] ?? presets[0];
      if (preset) this.applyLevels(preset.levels);
    }
    showToast('Evening scene');
  }

  public toggleGates(): void {
    const opening = this.deps.knx.toggleCarGates(this.deps.gatePa);
    showToast(opening ? 'Gates opening' : 'Gates closing');
  }

  public isGateOpenOrOpening(): boolean {
    return this.deps.knx.isCarGatesOpen();
  }

  public setTimeOfDay(tod: TimeOfDay): void {
    const { scene, knx } = this.deps;
    scene.setTimeOfDay(tod);
    knx.setAmbientLux(TOD_LUX_MAP[tod], true);
    timeOfDay.value = tod;
    syncEnvironmentButtonsUI(knx, scene);
  }

  public toggleUfhZoneForRoom(zoneId: RoomZoneId): void {
    const ufh = this.deps.scene.getUfhSystem();
    const zone = ufh?.getZoneForRoom(zoneId);
    if (!zone) return;
    this.deps.scene.toggleUfhZone(zone.id);
    deviceRevision.value += 1;
  }

  public activateDevice(interactableId: string, label: string): void {
    const handled = this.deps.scene.handleInteractableClick(interactableId);
    if (!handled) showToast(`${label} isn't available right now`);
  }

  // ---------------------------------------------------------------------------
  // Notes
  // ---------------------------------------------------------------------------

  public focusNote(id: number): void {
    this.deps.annotator.focusRecord(id);
  }

  public deleteNote(id: number): void {
    this.deps.annotator.removeRecord(id);
  }

  public updateNoteText(id: number, text: string): void {
    this.deps.annotations.updateNote(id, text);
  }

  private formatTradeAppendix(records: readonly SceneAnnotationRecord[]): string {
    const meta = noteMeta.value;
    const lines: string[] = [];
    for (const r of records) {
      const m = meta[String(r.id)];
      if (!m?.trade && !m?.resolved) continue;
      const trade = m.trade ? TRADE_VIEW_LABELS[m.trade] : 'Unassigned';
      lines.push(`- #${r.id} (${r.roomName}): ${trade}${m.resolved ? ' · resolved' : ' · open'}`);
    }
    return lines.length > 0 ? `\n\n## Trade assignments\n\n${lines.join('\n')}\n` : '';
  }

  public buildNotesMarkdown(): string {
    const { annotations } = this.deps;
    return formatAnnotationsMarkdownReport(annotations) + this.formatTradeAppendix(annotations.getRecords());
  }

  public async copyNotesMarkdown(): Promise<void> {
    const ok = await copyTextWithFallback(this.buildNotesMarkdown());
    showToast(ok ? 'Notes copied as Markdown' : 'Could not copy notes');
  }

  public downloadNotesMarkdown(): void {
    downloadBlobFile(this.buildNotesMarkdown(), `crox-notes-${Date.now()}.md`, 'text/markdown;charset=utf-8');
  }

  public downloadNotesJson(): void {
    exportAnnotationsAsJsonFile(this.deps.annotations);
  }

  public downloadNotesUsda(): void {
    exportAnnotationsAsUsdaFile(this.deps.annotations);
  }

  // ---------------------------------------------------------------------------
  // Sharing
  // ---------------------------------------------------------------------------

  public captureShareState(guest = true): ShareViewState {
    const { scene } = this.deps;
    const pose = scene.getCurrentCameraPoseSnapshot();
    const room = scene.getCurrentRoomId() ?? currentRoomId.value;
    return {
      cam: pose.position,
      target: pose.target,
      floor: scene.getFloorViewMode(),
      ortho: pose.isOrthographic,
      ...(room ? { room } : {}),
      view: scene.getTradeView(),
      guest,
    };
  }

  public async share(): Promise<void> {
    const url = buildShareUrl(this.captureShareState(true));
    const ok = await copyTextWithFallback(url);
    const viewLabel = TRADE_VIEW_LABELS[this.deps.scene.getTradeView()];
    showToast(
      ok
        ? `Link copied · opens this view (${viewLabel}) read-only`
        : 'Could not copy the link — check clipboard permissions',
      3600
    );
  }

  /** Applies a decoded `?v=` share state (called once after the scene is ready). */
  public applyShareState(s: ShareViewState): void {
    const { scene } = this.deps;
    guestMode.value = s.guest;
    scene.setTradeView(s.view);
    tradeView.value = scene.getTradeView();
    if (s.room && isRoomZoneId(s.room)) {
      scene.selectRoom(s.room);
      currentRoomId.value = scene.getCurrentRoomId() ?? s.room;
    }
    scene.flyToCameraPose({
      position: s.cam,
      target: s.target,
      floorViewMode: s.floor,
      ceilingCutaway: scene.isCeilingCutaway(),
      isOrthographic: s.ortho,
    });
    floorMode.value = s.floor;
    this.deps.legacy.syncFloorModeUI();
    showToast(
      `Shared view${s.room ? ` · ${getRoomLabel(s.room)}` : ''} · ${TRADE_VIEW_LABELS[s.view]}`,
      3200
    );
  }
}
