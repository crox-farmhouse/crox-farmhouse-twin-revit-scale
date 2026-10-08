import { batch } from '@preact/signals';
import type { TwinApi, TwinGraphicsStats, TwinUfhZone } from '../../app/twin-api.ts';
import { annotationTool, annotatorActive } from '../../state/notes-store.ts';
import {
  activeTool,
  currentRoomId,
  deviceRevision,
  floorMode,
  graphicsFps,
  graphicsMode,
  graphicsTierLabel,
  guestMode,
  isCompactPhone,
  isMobile,
  liveLevels,
  navigatorOpen,
  noteMeta,
  pruneNoteMeta,
  roomPanelOpen,
  roomSheetSnap,
  touchNavMode,
  type TouchNavMode,
  sectionCut,
  showToast,
  timeOfDay,
  tradeView,
  viewMode,
  type ShellTool,
  type ShellViewMode,
} from '../../state/shell-store.ts';
import { buildShareUrl, isRoomZoneId } from '../../state/url-state.ts';
import type { HudRoomScene } from '../../core/types/home-hud.ts';
import type { CircuitId, CircuitLevels } from '../../core/types/knx.ts';
import type {
  AnnotationToolMode,
  FloorViewMode,
  SceneAnnotationRecord,
  TimeOfDay,
} from '../../core/types/scene.ts';
import type { RoomZoneId } from '../../core/types/topology.ts';
import type {
  GraphicsMode,
  GraphicsTier,
  RoomSceneControl,
  ShareViewState,
  TradeView,
} from '../../core/types/twin-ux.ts';
import { TRADE_VIEW_LABELS } from '../../core/types/twin-ux.ts';
import {
  copyTextWithFallback,
  downloadBlobFile,
  downloadNotesJson,
  downloadNotesUsda,
} from '../notes/notes-export.ts';
import { PROPERTY_NAME } from './room-data.ts';

/** The notes inspector actions the shell drives (implemented by `AnnotatorController`). */
export interface ShellNotesTools {
  activateTool(tool: AnnotationToolMode | null): void;
  focusRecord(id: number): void;
  removeRecord(id: number): void;
}

export interface ShellDeps {
  readonly api: TwinApi;
  readonly notes: ShellNotesTools;
}

const LEVEL_PUSH_INTERVAL_MS = 120;

const TIER_LABELS: Readonly<Record<GraphicsTier, string>> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  ultra: 'Ultra',
};

function formatTier(stats: TwinGraphicsStats): string {
  return TIER_LABELS[stats.tier] ?? stats.tier;
}

/**
 * Imperative glue between the Preact shell and the twin. Components read
 * shell-store signals and call these actions; only this class talks to
 * `TwinApi`, and only through subscriptions (no polling, no engine imports).
 */
export class ShellController {
  public readonly api: TwinApi;
  private readonly notesTools: ShellNotesTools;
  private levelPushTimer: ReturnType<typeof setTimeout> | null = null;
  private lastLevelPush = 0;
  private pendingLevels: Readonly<CircuitLevels> | null = null;
  private panelsBeforeWalk: { readonly navigator: boolean; readonly roomPanel: boolean } | null = null;

  public constructor(deps: ShellDeps) {
    this.api = deps.api;
    this.notesTools = deps.notes;
  }

  /** Subscribes to twin events and seeds the shell signals. */
  public init(): void {
    const { api } = this;

    batch(() => {
      currentRoomId.value = api.rooms.getCurrent();
      tradeView.value = api.trades.getView();
      floorMode.value = api.floors.getMode();
      sectionCut.value = api.floors.isCeilingCutaway();
      graphicsMode.value = api.graphics.getMode();
      liveLevels.value = { ...api.lighting.getLiveLevels() };
      timeOfDay.value = api.lighting.getTimeOfDay();
      viewMode.value = api.walkthrough.isActive() ? 'walk' : '3d';
    });
    this.refreshGraphicsReadout();

    api.rooms.onChanged((zoneId) => {
      currentRoomId.value = zoneId;
    });
    api.trades.onChanged((view) => {
      tradeView.value = view;
    });
    api.camera.onViewChanged((view) => {
      if (floorMode.value !== view.floorViewMode) floorMode.value = view.floorViewMode;
      const cut = api.floors.isCeilingCutaway();
      if (sectionCut.value !== cut) sectionCut.value = cut;
    });
    api.walkthrough.onChanged((walking) => {
      if (walking && viewMode.value !== 'walk') viewMode.value = 'walk';
      else if (!walking && viewMode.value === 'walk') viewMode.value = '3d';
      this.syncImmersivePanels(walking);
    });
    this.syncImmersivePanels(api.walkthrough.isActive());
    api.lighting.onLevelsChanged((levels) => this.pushLiveLevels(levels));
    api.lighting.subscribe((event) => {
      if (event.type !== 'stateChange') return;
      deviceRevision.value += 1;
      const tod = api.lighting.getTimeOfDay();
      if (tod !== timeOfDay.value) timeOfDay.value = tod;
    });
    api.devices.onChanged(() => {
      deviceRevision.value += 1;
    });
    api.graphics.onToast((message) => showToast(message, 3200));

    api.notes.subscribe((records) => {
      pruneNoteMeta(records.map((r) => r.id));
    });

    // Tool state follows the notes inspector (which owns the annotation tools).
    const syncTool = (): void => {
      const tool = annotationTool.value;
      const next: ShellTool = !annotatorActive.value ? 'orbit' : tool === 'measure' ? 'measure' : 'note';
      if (activeTool.value !== next) activeTool.value = next;
    };
    annotatorActive.subscribe(syncTool);
    annotationTool.subscribe(syncTool);

    // Double-click a surface to jump into that room.
    api.camera.onSurfaceDoubleClick((point) => {
      const room = api.rooms.findAt(point);
      if (room) this.selectRoom(room.zoneId);
    });
  }

  /**
   * Walk mode is immersive: collapse the navigator and room panel on entry and
   * restore whatever was open on exit (the walk overlay's room chip replaces them).
   */
  private syncImmersivePanels(walking: boolean): void {
    if (walking && this.panelsBeforeWalk === null) {
      this.panelsBeforeWalk = { navigator: navigatorOpen.value, roomPanel: roomPanelOpen.value };
      batch(() => {
        navigatorOpen.value = false;
        roomPanelOpen.value = false;
      });
    } else if (!walking && this.panelsBeforeWalk !== null) {
      const saved = this.panelsBeforeWalk;
      this.panelsBeforeWalk = null;
      batch(() => {
        navigatorOpen.value = saved.navigator;
        roomPanelOpen.value = saved.roomPanel;
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Rooms
  // ---------------------------------------------------------------------------

  public roomLabel(zoneId: RoomZoneId | null): string {
    return zoneId ? this.api.rooms.getLabel(zoneId) : PROPERTY_NAME;
  }

  public roomLevelScenes(zoneId: RoomZoneId): readonly HudRoomScene[] {
    return this.api.rooms.getLevelScenes(zoneId);
  }

  public highlightRoom(zoneId: RoomZoneId | null): void {
    this.api.rooms.highlight(zoneId);
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------

  public selectRoom(zoneId: RoomZoneId, fly = true): void {
    const { api } = this;
    if (fly) {
      api.camera.flyToRoom(zoneId);
      if (viewMode.value === 'plan') viewMode.value = '3d';
    } else {
      api.rooms.select(zoneId);
    }
    // Mirror immediately in case the engine defers the change notification.
    currentRoomId.value = api.rooms.getCurrent() ?? zoneId;
    if (isMobile.value) {
      navigatorOpen.value = false;
      roomPanelOpen.value = true;
      if (isCompactPhone.value) {
        roomSheetSnap.value = 'peek';
      }
    }
  }

  public setFloor(mode: FloorViewMode): void {
    this.api.floors.setMode(mode);
    floorMode.value = mode;
  }

  public setViewMode(mode: ShellViewMode): void {
    const { api } = this;
    if (mode === 'walk') {
      this.setTool('orbit');
      api.walkthrough.enter();
    } else {
      if (api.walkthrough.isActive()) api.walkthrough.exit();
      const keepFloor = api.floors.getMode();
      if (mode === 'plan') {
        api.camera.setSingleFingerPan(true);
        touchNavMode.value = 'pan';
        api.camera.flyToPreset('top');
      } else if (viewMode.value === 'plan') {
        api.camera.setSingleFingerPan(false);
        touchNavMode.value = 'orbit';
        const room = currentRoomId.value;
        const bounds = room ? api.rooms.getBounds(room) : null;
        if (bounds) api.camera.flyToBounds(bounds, keepFloor);
        else api.camera.flyToPreset('overview');
      }
      if (api.floors.getMode() !== keepFloor) api.floors.setMode(keepFloor);
    }
    viewMode.value = api.walkthrough.isActive() ? 'walk' : mode === 'walk' ? '3d' : mode;
    floorMode.value = api.floors.getMode();
  }

  public recenter(): void {
    if (this.api.walkthrough.isActive()) return;
    this.api.camera.recenter();
  }

  public setTouchNavMode(mode: TouchNavMode): void {
    this.api.camera.setSingleFingerPan(mode === 'pan');
    touchNavMode.value = mode;
  }

  public toggleTouchNavMode(): void {
    const next: TouchNavMode = touchNavMode.value === 'pan' ? 'orbit' : 'pan';
    this.setTouchNavMode(next);
  }

  public isWalking(): boolean {
    return this.api.walkthrough.isActive();
  }

  public setTool(tool: ShellTool): void {
    if (tool !== 'orbit' && this.api.walkthrough.isActive()) this.api.walkthrough.exit();
    this.notesTools.activateTool(tool === 'orbit' ? null : tool === 'measure' ? 'measure' : 'pin');
    activeTool.value = tool;
  }

  public toggleTool(tool: Exclude<ShellTool, 'orbit'>): void {
    this.setTool(activeTool.value === tool ? 'orbit' : tool);
  }

  /** Developer object tools (move / rotate furniture). */
  public activateObjectTool(tool: 'move' | 'rotate'): void {
    this.notesTools.activateTool(tool);
  }

  public toggleSection(): void {
    sectionCut.value = this.api.floors.toggleCeilingCutaway();
  }

  public setTradeView(view: TradeView): void {
    this.api.trades.setView(view);
    tradeView.value = this.api.trades.getView();
  }

  // ---------------------------------------------------------------------------
  // Graphics
  // ---------------------------------------------------------------------------

  /** The engine persists the chosen mode; the shell only mirrors it. */
  public setGraphicsMode(mode: GraphicsMode): void {
    this.api.graphics.setMode(mode);
    graphicsMode.value = this.api.graphics.getMode();
    this.refreshGraphicsReadout();
  }

  public refreshGraphicsReadout(): void {
    const stats = this.api.graphics.getStats();
    graphicsTierLabel.value = formatTier(stats);
    graphicsFps.value = Number.isFinite(stats.fps) && stats.fps > 0 ? stats.fps : null;
  }

  // ---------------------------------------------------------------------------
  // Lights & devices
  // ---------------------------------------------------------------------------

  /** Throttled mirror of KNX live levels into the panel. */
  private pushLiveLevels(levels: Readonly<CircuitLevels>): void {
    this.pendingLevels = levels;
    const now = performance.now();
    const elapsed = now - this.lastLevelPush;
    if (elapsed >= LEVEL_PUSH_INTERVAL_MS) {
      this.flushLevels(now);
      return;
    }
    if (this.levelPushTimer) return;
    this.levelPushTimer = setTimeout(() => {
      this.levelPushTimer = null;
      this.flushLevels(performance.now());
    }, LEVEL_PUSH_INTERVAL_MS - elapsed);
  }

  private flushLevels(now: number): void {
    this.lastLevelPush = now;
    const levels = this.pendingLevels ?? this.api.lighting.getLiveLevels();
    this.pendingLevels = null;
    liveLevels.value = { ...levels };
  }

  public toggleLight(circuitId: string): void {
    if (!this.api.lighting.isKnownCircuit(circuitId)) return;
    this.api.lighting.toggleCircuit(circuitId);
  }

  public setLightLevel(circuitId: string, pct: number): void {
    if (!this.api.lighting.isKnownCircuit(circuitId)) return;
    this.api.lighting.setCircuitLevel(circuitId, Math.round(Math.max(0, Math.min(100, pct))));
  }

  public recallScene(sceneCtl: RoomSceneControl): void {
    this.api.lighting.recallScene(sceneCtl.sceneNumber, sceneCtl.pa);
    showToast(`${sceneCtl.label} scene`);
  }

  public applyLevels(levels: Readonly<Partial<Record<CircuitId, number>>>, label?: string): void {
    this.api.lighting.applyLevels(levels);
    if (label) showToast(label);
  }

  public allLightsOff(): void {
    this.api.lighting.allOff();
    showToast('All lights off');
  }

  /** Whole-house evening mood: kitchen "Lounge" scene + each room's middle preset. */
  public eveningScene(): void {
    const { lighting, rooms } = this.api;
    lighting.recallScene(2);
    const zones = new Set<RoomZoneId>();
    for (const c of lighting.circuits()) zones.add(c.zoneId);
    for (const zoneId of zones) {
      const presets = rooms.getLevelScenes(zoneId);
      const preset = presets[1] ?? presets[0];
      if (preset) lighting.applyLevels(preset.levels);
    }
    showToast('Evening scene');
  }

  public toggleGates(): void {
    const opening = this.api.devices.toggleGates();
    showToast(opening ? 'Gates opening' : 'Gates closing');
  }

  public isGateOpenOrOpening(): boolean {
    return this.api.devices.isGatesOpen();
  }

  public setTimeOfDay(tod: TimeOfDay): void {
    this.api.lighting.setTimeOfDay(tod);
    timeOfDay.value = tod;
  }

  public ufhZoneForRoom(zoneId: RoomZoneId): TwinUfhZone | undefined {
    return this.api.devices.hasUfh() ? this.api.devices.ufhZoneForRoom(zoneId) : undefined;
  }

  public toggleUfhZoneForRoom(zoneId: RoomZoneId): void {
    const zone = this.ufhZoneForRoom(zoneId);
    if (!zone) return;
    this.api.devices.toggleUfhZone(zone.id);
    deviceRevision.value += 1;
  }

  public activateDevice(interactableId: string, label: string): void {
    const handled = this.api.devices.handleInteractable(interactableId);
    if (!handled) showToast(`${label} isn't available right now`);
  }

  // ---------------------------------------------------------------------------
  // Notes
  // ---------------------------------------------------------------------------

  public focusNote(id: number): void {
    this.notesTools.focusRecord(id);
  }

  public deleteNote(id: number): void {
    this.notesTools.removeRecord(id);
  }

  public updateNoteText(id: number, text: string): void {
    this.api.notes.updateNote(id, text);
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
    const { notes } = this.api;
    return notes.formatForAgent() + this.formatTradeAppendix(notes.getRecords());
  }

  public async copyNotesMarkdown(): Promise<void> {
    const ok = await copyTextWithFallback(this.buildNotesMarkdown());
    showToast(ok ? 'Notes copied as Markdown' : 'Could not copy notes');
  }

  public downloadNotesMarkdown(): void {
    downloadBlobFile(this.buildNotesMarkdown(), `crox-notes-${Date.now()}.md`, 'text/markdown;charset=utf-8');
  }

  public downloadNotesJson(): void {
    downloadNotesJson(this.api.notes);
  }

  public downloadNotesUsda(): void {
    downloadNotesUsda(this.api.notes);
  }

  // ---------------------------------------------------------------------------
  // Sharing
  // ---------------------------------------------------------------------------

  public captureShareState(guest = true): ShareViewState {
    const { api } = this;
    const pose = api.camera.getPose();
    const room = api.rooms.getCurrent() ?? currentRoomId.value;
    return {
      cam: pose.position,
      target: pose.target,
      floor: api.floors.getMode(),
      ortho: pose.isOrthographic,
      ...(room ? { room } : {}),
      view: api.trades.getView(),
      guest,
    };
  }

  public async share(): Promise<void> {
    const url = buildShareUrl(this.captureShareState(true));
    const ok = await copyTextWithFallback(url);
    const viewLabel = TRADE_VIEW_LABELS[this.api.trades.getView()];
    showToast(
      ok
        ? `Link copied · opens this view (${viewLabel}) read-only`
        : 'Could not copy the link — check clipboard permissions',
      3600
    );
  }

  /** Applies a decoded `?v=` share state (called once after the scene is ready). */
  public applyShareState(s: ShareViewState): void {
    const { api } = this;
    guestMode.value = s.guest;
    api.trades.setView(s.view);
    tradeView.value = api.trades.getView();
    const room = s.room && isRoomZoneId(s.room) ? s.room : null;
    if (room) {
      api.rooms.select(room);
      currentRoomId.value = api.rooms.getCurrent() ?? room;
    }
    api.camera.flyToCameraPose({
      position: s.cam,
      target: s.target,
      floorViewMode: s.floor,
      ceilingCutaway: api.floors.isCeilingCutaway(),
      isOrthographic: s.ortho,
    });
    floorMode.value = s.floor;
    showToast(
      `Shared view${room ? ` · ${this.roomLabel(room)}` : ''} · ${TRADE_VIEW_LABELS[s.view]}`,
      3200
    );
  }
}
