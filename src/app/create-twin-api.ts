/**
 * Adapter: builds the UI-facing {@link TwinApi} over the engine's
 * `PropertyScene`, the KNX bus controller and the annotation store.
 *
 * This module is part of the composition root (src/app) and is the only place
 * where the UI facade meets engine / integration / home code.
 */
import type { SceneAnnotationStore } from '../engine/annotation/annotation-system.ts';
import { FocusController } from '../engine/rooms/focus-controller.ts';
import type { PropertyScene } from '../engine/viewer/property-scene.ts';
import type { UfhZoneId, UfhZoneState } from '../engine/viewer/property-scene-profile.ts';
import { CROX_ZONE_SCENES, createCroxFarmhouseFocusRooms } from '../homes/crox-farmhouse/hud-model.ts';
import {
  CROX_ROOM_MANIFEST,
  getRoomManifest,
  ROOM_NAV_TREE,
} from '../homes/crox-farmhouse/room-manifest.ts';
import { CIRCUITS } from '../integrations/knx/constants.ts';
import type { KNXPropertyBusController } from '../integrations/knx/emulator.ts';
import { ROOM_ZONES } from '../integrations/knx/topology.ts';
import type { CircuitId, CircuitLevels } from '../core/types/knx.ts';
import type { FloorViewMode, TimeOfDay, Vec3Tuple } from '../core/types/scene.ts';
import type { RoomBoundingBox, RoomZoneId } from '../core/types/topology.ts';
import type { HudRoomScene } from '../core/types/home-hud.ts';
import type { RoomManifestEntry } from '../core/types/twin-ux.ts';
import type {
  TwinApi,
  TwinRoomHit,
  TwinRoomNavGroup,
  TwinUfhZone,
  TwinViewState,
  Unsubscribe,
} from './twin-api.ts';

/** Home-specific room data the adapter serves through `api.rooms`. */
export interface TwinHomeData {
  readonly manifest: readonly RoomManifestEntry[];
  readonly navTree: readonly TwinRoomNavGroup[];
  getManifest(zoneId: RoomZoneId): RoomManifestEntry | undefined;
  getLevelScenes(zoneId: RoomZoneId): readonly HudRoomScene[];
  getZoneName(zoneId: RoomZoneId): string | undefined;
  getBounds(zoneId: RoomZoneId): RoomBoundingBox | null;
  isInterior(zoneId: RoomZoneId): boolean;
  readonly focus: FocusController;
}

/** Crox Farmhouse room data (manifest, navigator tree, KNX room topology). */
export function createCroxHomeData(): TwinHomeData {
  return {
    manifest: CROX_ROOM_MANIFEST,
    navTree: ROOM_NAV_TREE,
    getManifest: (zoneId) => getRoomManifest(zoneId),
    getLevelScenes: (zoneId) => CROX_ZONE_SCENES[zoneId] ?? [],
    getZoneName: (zoneId) => ROOM_ZONES[zoneId]?.name,
    getBounds: (zoneId) => ROOM_ZONES[zoneId]?.bounds ?? null,
    isInterior: (zoneId) => ROOM_ZONES[zoneId]?.isInterior ?? false,
    focus: new FocusController(createCroxFarmhouseFocusRooms()),
  };
}

export interface TwinRuntimeOptions {
  readonly scene: PropertyScene;
  readonly knx: KNXPropertyBusController;
  readonly annotations: SceneAnnotationStore;
  /** Defaults to Crox Farmhouse data. */
  readonly home?: TwinHomeData;
  /** Physical address used for gate commands (default `1.1.22`). */
  readonly gatePa?: string;
  /** Kitchen Corston switch PA used for whole-house scene recall (default `1.1.10`). */
  readonly kitchenScenePa?: string;
  /** Courtyard switch PA (default `1.1.14`). */
  readonly courtyardSwitchPa?: string;
  /**
   * Generic presence hook: receives the walker's foot position + room (~5 Hz, walkthrough only).
   * Integrations (e.g. a KNX motion bridge) attach here; the runtime itself does nothing with it.
   */
  readonly onWalkthroughPresence?: (pos: Vec3Tuple, zoneId: RoomZoneId | null) => void;
}

export interface TwinRuntime {
  readonly api: TwinApi;
  /** Advances KNX dimming, mirrors live levels into the scene and renders. Call once per frame. */
  tick(dtSeconds: number): void;
  dispose(): void;
}

/** Ambient lux the KNX presence/lux sensor reports for each sky preset. */
export const TIME_OF_DAY_LUX: Readonly<Record<TimeOfDay, number>> = {
  day: 480,
  dusk: 38,
  night: 5,
};

export function luxToTimeOfDay(lux: number): TimeOfDay {
  return lux >= 200 ? 'day' : lux >= 20 ? 'dusk' : 'night';
}

const ZONE_SWITCH_PA_GROUND = '1.1.10';
const ZONE_SWITCH_PA_OUTBUILDINGS = '2.1.10';

function toTuple(v: { readonly x: number; readonly y: number; readonly z: number }): Vec3Tuple {
  return [v.x, v.y, v.z];
}

function clampPct(pct: number): number {
  return Math.round(Math.max(0, Math.min(100, pct)));
}

export function createTwinRuntime(opts: TwinRuntimeOptions): TwinRuntime {
  const { scene, knx, annotations } = opts;
  const home = opts.home ?? createCroxHomeData();
  const gatePa = opts.gatePa ?? '1.1.22';
  const kitchenScenePa = opts.kitchenScenePa ?? '1.1.10';
  const courtyardSwitchPa = opts.courtyardSwitchPa ?? '1.1.14';

  const knownCircuits = new Set<string>(CIRCUITS.map((c) => c.id));
  const isKnownCircuit = (id: string): id is CircuitId => knownCircuits.has(id);
  const levelListeners = new Set<(levels: Readonly<CircuitLevels>) => void>();
  const deviceListeners = new Set<() => void>();
  const disposers: Unsubscribe[] = [];
  const footListeners = new Set<(pos: Vec3Tuple, zoneId: RoomZoneId | null) => void>();
  const FOOT_EMIT_INTERVAL_S = 0.2;
  let footEmitAccum = FOOT_EMIT_INTERVAL_S;
  if (opts.onWalkthroughPresence) footListeners.add(opts.onWalkthroughPresence);

  /** Throttled walkthrough foot-position fan-out (~5 Hz while walking). */
  const stepFootPosition = (dtSeconds: number): void => {
    if (footListeners.size === 0 || !scene.isWalkthroughMode()) {
      footEmitAccum = FOOT_EMIT_INTERVAL_S;
      return;
    }
    footEmitAccum += dtSeconds;
    if (footEmitAccum < FOOT_EMIT_INTERVAL_S) return;
    footEmitAccum = 0;
    const foot = scene.getWalkthrough().getFootPosition();
    const pos = toTuple(foot);
    const zoneId = home.focus.findRoomAt(foot.x, foot.y, foot.z)?.zoneId ?? null;
    for (const l of [...footListeners]) l(pos, zoneId);
  };

  const emitDevices = (): void => {
    for (const l of [...deviceListeners]) l();
  };
  const emitLevels = (): void => {
    const levels = knx.getLiveLevels();
    for (const l of [...levelListeners]) l(levels);
  };

  /** KNX → 3D device mirrors (gates, Frame TV art, motion sensor LEDs). */
  const syncDevicesFromKnx = (): void => {
    scene.setCarGatesOpen(knx.isCarGatesOpen());
    scene.setTVArtState(knx.isTvArtModeActive(), knx.getTvArtIndex());
    scene.setMotionSensorStates(knx.getKitchenMotionDetected(), knx.getUtilityMotionDetected());
  };

  disposers.push(
    knx.subscribe((event) => {
      if (event.type !== 'stateChange') return;
      syncDevicesFromKnx();
      scene.applyKNXLightLevels(knx.getLiveLevels());
      emitLevels();
      emitDevices();
    }),
    scene.onDeviceStateChanged(emitDevices)
  );
  const ufh = scene.getUfhSystem();
  if (ufh) disposers.push(ufh.subscribe(emitDevices));

  syncDevicesFromKnx();
  scene.applyKNXLightLevels(knx.getLiveLevels());

  const roomLabel = (zoneId: RoomZoneId): string =>
    home.getManifest(zoneId)?.label ?? home.getZoneName(zoneId) ?? zoneId;

  const floorForRoom = (zoneId: RoomZoneId): FloorViewMode =>
    home.getManifest(zoneId)?.floor === 'first' ? 'first' : 'ground';

  const toUfhZone = (z: UfhZoneState): TwinUfhZone => {
    const estimate = ufh?.getZoneWarmupEstimate(z.id);
    return {
      id: z.id,
      name: z.name,
      shortName: z.shortName,
      manifoldLabel: z.manifoldLabel,
      roomZones: z.roomZones,
      heatingOn: z.heatingOn,
      targetTempC: z.targetTempC,
      ...(estimate ? { warmupLabel: estimate.formattedDuration } : {}),
    };
  };
  const isUfhZoneId = (id: string): id is UfhZoneId =>
    ufh?.getZones().some((z) => z.id === id) ?? false;

  const viewState = (): TwinViewState => {
    const v = scene.getViewState();
    return {
      cameraPosition: toTuple(v.cameraPosition),
      target: toTuple(v.target),
      isOrthographic: v.isOrthographic,
      orthoZoom: v.orthoZoom,
      floorViewMode: v.floorViewMode,
    };
  };

  const applyLevels = (levels: Readonly<Partial<Record<CircuitId, number>>>): void => {
    for (const c of CIRCUITS) {
      const level = levels[c.id];
      if (level !== undefined) knx.setCircuitLevel(c.id, clampPct(level));
    }
  };

  const api: TwinApi = {
    camera: {
      flyToPreset: (preset) => scene.flyToPreset(preset),
      flyToCameraPose: (pose) => scene.flyToCameraPose(pose),
      flyToRoom: (zoneId) => {
        scene.selectRoom(zoneId);
        const bounds = home.getBounds(zoneId);
        if (bounds) scene.flyToRoomBounds(bounds, floorForRoom(zoneId));
      },
      flyToBounds: (bounds, floor) => scene.flyToRoomBounds(bounds, floor),
      recenter: () => scene.recenterView(),
      getPose: () => scene.getCurrentCameraPoseSnapshot(),
      getViewState: viewState,
      onViewChanged: (listener) => scene.onViewChanged(() => listener(viewState())),
      onSurfaceDoubleClick: (listener) => scene.onSurfaceDoubleClick((p) => listener(toTuple(p))),
      projectToScreen: (p) => scene.projectToScreen(p[0], p[1], p[2]),
    },

    floors: {
      getMode: () => scene.getFloorViewMode(),
      setMode: (mode) => scene.setFloorViewMode(mode),
      isCeilingCutaway: () => scene.isCeilingCutaway(),
      setCeilingCutaway: (cutaway) => {
        if (scene.isCeilingCutaway() !== cutaway) scene.toggleCeilingCutaway();
      },
      toggleCeilingCutaway: () => scene.toggleCeilingCutaway(),
    },

    rooms: {
      getCurrent: () => scene.getCurrentRoomId(),
      onChanged: (listener) => scene.onCurrentRoomChanged(listener),
      select: (zoneId) => scene.selectRoom(zoneId),
      highlight: (zoneId) => scene.highlightRoom(zoneId),
      list: () => home.manifest,
      navTree: () => home.navTree,
      getLevelScenes: (zoneId) => home.getLevelScenes(zoneId),
      isInterior: (zoneId) => home.isInterior(zoneId),
      getManifest: (zoneId) => home.getManifest(zoneId),
      getLabel: roomLabel,
      getBounds: (zoneId) => home.getBounds(zoneId),
      findAt: (point, floorId): TwinRoomHit | null => {
        const room = home.focus.findRoomAt(point[0], point[1], point[2], floorId);
        if (!room) return null;
        return {
          zoneId: room.zoneId,
          label: roomLabel(room.zoneId),
          floorId: room.floorId,
          bounds: room.bounds,
        };
      },
    },

    lighting: {
      circuits: () => CIRCUITS,
      isKnownCircuit,
      getLiveLevels: () => knx.getLiveLevels(),
      getTargetLevels: () => knx.getTargetLevels(),
      toggleCircuit: (id) => knx.toggleCircuit(id),
      setCircuitLevel: (id, pct) => knx.setCircuitLevel(id, clampPct(pct)),
      applyLevels,
      allOff: () => {
        const live = knx.getLiveLevels();
        for (const c of CIRCUITS) {
          if ((live[c.id] ?? 0) > 0) knx.setCircuitLevel(c.id, 0);
        }
      },
      recallScene: (sceneNumber, pa = kitchenScenePa) => knx.recallScene(sceneNumber, pa),
      scenes: () => knx.getScenes(),
      getActiveSceneIndex: () => knx.getActiveSceneIndex(),
      subscribe: (listener) => knx.subscribe(listener),
      onLevelsChanged: (listener) => {
        levelListeners.add(listener);
        return () => {
          levelListeners.delete(listener);
        };
      },
      getTimeOfDay: () => luxToTimeOfDay(knx.getAmbientLux()),
      setTimeOfDay: (tod) => {
        scene.setTimeOfDay(tod);
        knx.setAmbientLux(TIME_OF_DAY_LUX[tod], true);
      },
      getAmbientLux: () => knx.getAmbientLux(),
      setAmbientLux: (lux) => knx.setAmbientLux(lux, true),
      roomMotionSensors: () =>
        knx.getRoomMotionSensors().map((s) => ({
          id: s.id,
          label: s.name,
          occupied: knx.getRoomMotionDetected(s.id),
        })),
      toggleRoomMotion: (id) => knx.toggleRoomMotion(id),
      isRoomNightDimActive: (id) => knx.isRoomNightDimActive(id),
      pressZoneSwitch: (zoneId, direction, longPress = false) => {
        const firstCircuit = knx.getCircuitsForZone(zoneId)[0];
        const pa =
          firstCircuit?.actuatorPa === '2.1.20' ? ZONE_SWITCH_PA_OUTBUILDINGS : ZONE_SWITCH_PA_GROUND;
        const location = `${roomLabel(zoneId)} switch`;
        if (longPress) knx.handleZoneSwitchLongPressHold(zoneId, direction, pa, location);
        else knx.handleZoneSwitchShortPress(zoneId, direction, pa, location);
      },
      getTransport: () => ({ mode: knx.getTransportMode(), status: knx.getTransportStatus() }),
    },

    devices: {
      handleInteractable: (id) => scene.handleInteractableClick(id),
      onChanged: (listener) => {
        deviceListeners.add(listener);
        return () => {
          deviceListeners.delete(listener);
        };
      },
      isGatesOpen: () => knx.isCarGatesOpen(),
      isGatesMoving: () => knx.isCarGatesMoving(),
      getGatesStatusLabel: () => knx.getCarGatesStatusLabel(),
      toggleGates: () => knx.toggleCarGates(gatePa),
      isBifoldsOpen: () => scene.isBifoldsOpen(),
      toggleBifolds: () => scene.toggleBifolds(),
      isTvArtMode: () => knx.isTvArtModeActive(),
      getTvArtTitle: () => knx.getTvArtTitle(),
      cycleTvArt: () => knx.cycleTvArt(true, '1.1.12'),
      isCourtyardLightOn: () => knx.isCourtyardLightOn(),
      getCourtyardModeLabel: () => knx.getCourtyardModeLabel(),
      pressCourtyardSwitch: () => knx.handleCourtyardSwitchShortPress('up', courtyardSwitchPa),
      hasUfh: () => ufh !== null,
      ufhZones: () => (ufh ? ufh.getZones().map(toUfhZone) : []),
      ufhZoneForRoom: (zoneId) => {
        const z = ufh?.getZoneForRoom(zoneId);
        return z ? toUfhZone(z) : undefined;
      },
      toggleUfhZone: (id) => (isUfhZoneId(id) ? scene.toggleUfhZone(id) : false),
      setAllUfhZones: (on) => scene.setAllUfhZones(on),
      isUfhLayerVisible: () => scene.isUfhLayerVisible(),
      setUfhLayerVisible: (visible) => scene.setUfhLayerVisible(visible),
      toggleUfhLayer: () => scene.toggleUfhLayer(),
    },

    graphics: {
      getMode: () => scene.getGraphicsMode(),
      setMode: (mode) => scene.setGraphicsMode(mode),
      getStats: () => scene.getGraphicsStats(),
      onToast: (listener) => scene.onGraphicsToast(listener),
    },

    trades: {
      getView: () => scene.getTradeView(),
      setView: (view) => scene.setTradeView(view),
      onChanged: (listener) => scene.onTradeViewChanged(listener),
      exportServiceSchedule: (view) => scene.exportServiceSchedule(view),
    },

    walkthrough: {
      isActive: () => scene.isWalkthroughMode(),
      enter: (spawnId) => {
        scene.setWalkthroughMode(true, spawnId);
      },
      exit: () => {
        if (scene.isWalkthroughMode()) scene.setWalkthroughMode(false);
      },
      toggle: (spawnId) => scene.toggleWalkthroughMode(spawnId),
      spawns: () =>
        scene.getWalkthroughSpawns().map((s) => ({ id: s.id, label: s.label, zoneId: s.zoneId })),
      teleport: (spawnId) => scene.getWalkthrough().teleportToSpawn(spawnId),
      onChanged: (listener) => scene.getWalkthrough().subscribe(listener),
      onFootPositionChanged: (listener) => {
        footListeners.add(listener);
        return () => {
          footListeners.delete(listener);
        };
      },
    },

    notes: {
      isActive: () => scene.isAnnotationMode(),
      setActive: (enabled) => scene.setAnnotationMode(enabled),
      toggleActive: () => scene.toggleAnnotationMode(),
      getToolMode: () => scene.getAnnotationToolMode(),
      setToolMode: (tool) => scene.setAnnotationToolMode(tool),
      getGizmoMode: () => scene.getGizmoTransformMode(),
      setGizmoMode: (mode) => scene.setGizmoTransformMode(mode),
      getMeasureAxisSnap: () => scene.getMeasureAxisSnap(),
      setMeasureAxisSnap: (enabled) => scene.setMeasureAxisSnap(enabled),
      cancelMeasurement: () => scene.cancelActiveMeasurement(),

      onPick: (listener) => scene.onAnnotationPick(listener),
      onMarkerSelect: (listener) => scene.onAnnotationMarkerSelect(listener),
      onMeasurePreview: (listener) => scene.onMeasurePreviewChange(listener),
      onMeasureComplete: (listener) =>
        scene.onMeasureComplete((startHit, endHit, snappedEndPoint) =>
          listener({ startHit, endHit, snappedEndPoint })
        ),
      onObjectTransform: (listener) =>
        scene.onObjectTransformChange((baseHit, transform, candidates, commitToStore) =>
          listener({ baseHit, transform, candidates, commitToStore })
        ),

      syncMarkers: (records, selectedId) => scene.syncAnnotationMarkers(records, selectedId),
      reapplyMoves: (records) => scene.reapplySavedMoveAnnotations(records),

      detachGizmo: () => scene.detachMoveGizmo(),
      switchMoveCandidate: (uuid) => scene.switchSelectedMoveCandidate(uuid),
      selectMovedObject: (uuid) => scene.selectMovedObjectByUuid(uuid),
      nudgeSelected: (dx, dy, dz, dRotYDeg, dRotXDeg, dRotZDeg) =>
        scene.nudgeSelectedObject(dx, dy, dz, dRotYDeg, dRotXDeg, dRotZDeg),
      setSelectedDelta: (dx, dy, dz, dRotYDeg, dRotXDeg, dRotZDeg) =>
        scene.setSelectedObjectDeltaTransform(dx, dy, dz, dRotYDeg, dRotXDeg, dRotZDeg),
      resetMovedObject: (uuid) => scene.resetMovedObject(uuid),

      getRecords: () => annotations.getRecords(),
      getSelectedId: () => annotations.getSelectedId(),
      getSelectedRecord: () => annotations.getSelectedRecord(),
      subscribe: (listener) => annotations.subscribe(listener),
      select: (id) => annotations.selectAnnotation(id),
      add: (hit, note) => annotations.addAnnotation(hit, note),
      addMeasure: (startHit, endHit, snappedEndPoint, note) =>
        annotations.addMeasureAnnotation(startHit, endHit, snappedEndPoint, note),
      upsertMove: (baseHit, transform, cameraPose) =>
        annotations.upsertMoveAnnotation(baseHit, transform, cameraPose),
      updateTargetMeasurement: (id, target) => annotations.updateTargetMeasurement(id, target),
      updateNote: (id, note) => annotations.updateNote(id, note),
      remove: (id) => annotations.removeAnnotation(id),
      clearAll: () => annotations.clearAll(),
      formatAsUsda: () => annotations.formatAsUsdaOverrideLayer(),
      formatForAgent: () => annotations.formatForAgent(),
    },

    dev: {
      getLodDiagnostics: () => scene.getLodDiagnostics(),
      getLodPolicyMode: () => scene.getLodPolicyMode(),
      setLodPolicyMode: (mode) => scene.setLodPolicyMode(mode),
      getFocusedRoomShortName: () => scene.getFocusedRoomShortName(),
      isMotionBlurEnabled: () => scene.isMotionBlurEnabled(),
      toggleMotionBlur: () => scene.toggleMotionBlur(),
    },
  };

  return {
    api,
    tick: (dtSeconds) => {
      if (knx.stepDimming(dtSeconds)) {
        scene.applyKNXLightLevels(knx.getLiveLevels());
        emitLevels();
      }
      scene.update(dtSeconds);
      stepFootPosition(dtSeconds);
    },
    dispose: () => {
      for (const d of disposers.splice(0)) d();
      levelListeners.clear();
      deviceListeners.clear();
      footListeners.clear();
    },
  };
}
