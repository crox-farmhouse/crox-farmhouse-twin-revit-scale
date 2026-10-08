/**
 * Adapter: `api.lighting.zones` over the KNX controller.
 *
 * - Native: when the controller implements {@link KnxZoneBus} (knx-lighting
 *   branch), zones, scenes, Full/Night/Off, presence and push-buttons come
 *   straight from it.
 * - Derived: on older controllers we build one zone per room from the circuit
 *   table + room manifest, scenes from the home's per-room presets (or the
 *   central scene table for rooms that recall it), and emulate the zone
 *   objects with plain circuit levels.
 */
import type { CircuitConfig, CircuitId, CircuitLevels } from '../core/types/knx.ts';
import {
  isKnxZoneBus,
  LIGHTING_LAYER_LABELS,
  LIGHTING_LAYER_ORDER,
  type KnxZoneBus,
  type KnxZoneCircuit,
  type KnxZoneState,
  type LightingLayerKind,
} from '../core/types/knx-zones.ts';
import type { RoomZoneId } from '../core/types/topology.ts';
import type { KNXPropertyBusController } from '../integrations/knx/emulator.ts';
import type { HudRoomScene } from '../core/types/home-hud.ts';
import type { RoomManifestEntry, RoomSceneControl } from '../core/types/twin-ux.ts';
import type {
  TwinLightingLayer,
  TwinLightingZone,
  TwinPresenceDetector,
  TwinZoneCircuit,
  TwinZoneLightingApi,
  TwinZoneSwitch,
  Unsubscribe,
} from './twin-api.ts';

/** The legacy controller surface the derived model needs. */
export type ZoneLegacyBus = Pick<
  KNXPropertyBusController,
  | 'getTargetLevels'
  | 'setCircuitLevel'
  | 'recallScene'
  | 'getActiveSceneIndex'
  | 'getScenes'
  | 'getKitchenMotionDetected'
  | 'getUtilityMotionDetected'
  | 'getRoomMotionSensors'
  | 'getRoomMotionDetected'
  | 'subscribe'
>;

export interface ZoneLightingDeps {
  readonly circuits: readonly CircuitConfig[];
  readonly manifest: readonly RoomManifestEntry[];
  getManifest(zoneId: RoomZoneId): RoomManifestEntry | undefined;
  getLevelScenes(zoneId: RoomZoneId): readonly HudRoomScene[];
  roomLabel(zoneId: RoomZoneId): string;
  /** PA + label used as the telegram source for UI-originated zone commands. */
  readonly uiSourcePa: string;
}

const NIGHT_LEVEL_PCT = 5;
const LEVEL_TOLERANCE = 1.5;

/** Best-effort fitting type from a circuit's id + names (derived model only). */
export function inferLayerKind(c: Pick<KnxZoneCircuit, 'id' | 'name' | 'shortName' | 'kind'>): LightingLayerKind {
  if (c.kind) return c.kind;
  const t = `${c.id} ${c.name} ${c.shortName}`.toLowerCase();
  if (/festoon|lamp ?post|external|balcony|courtyard|garden/.test(t)) return 'exterior';
  if (/lamps?5a|5v lamp|5a lamp|\blamps?\b/.test(t)) return 'lamps';
  if (/picture/.test(t)) return 'picture';
  if (/pendant/.test(t)) return 'pendants';
  if (/uplight/.test(t)) return 'uplights';
  if (/sconce|wall/.test(t)) return 'wall';
  if (/cabinet|bench|task|desk/.test(t)) return 'task';
  if (/cove/.test(t)) return 'cove';
  if (/shelf|bookcase|joinery/.test(t)) return 'shelf';
  if (/batten|high ?bay|bays/.test(t)) return 'battens';
  if (/downlight/.test(t)) return 'downlights';
  if (/spot/.test(t)) return 'spots';
  if (/fairy|halo|ring|feature|pool table/.test(t)) return 'feature';
  if (/led|strip/.test(t)) return 'strip';
  return 'downlights';
}

function toTwinCircuit(c: KnxZoneCircuit, manifestDimmable: boolean | undefined): TwinZoneCircuit {
  return {
    id: c.id,
    label: c.shortName || c.name,
    kind: inferLayerKind(c),
    dimmable: c.dimmable ?? manifestDimmable ?? true,
  };
}

function groupLayers(circuits: readonly TwinZoneCircuit[]): readonly TwinLightingLayer[] {
  const layers: TwinLightingLayer[] = [];
  for (const kind of LIGHTING_LAYER_ORDER) {
    const members = circuits.filter((c) => c.kind === kind);
    if (members.length > 0) layers.push({ kind, label: LIGHTING_LAYER_LABELS[kind], circuits: members });
  }
  return layers;
}

function stripScenePrefix(label: string): string {
  return label.replace(/^S\d+\s*/, '');
}

function levelOf(levels: Readonly<Partial<Record<CircuitId, number>>>, id: CircuitId): number {
  return levels[id] ?? 0;
}

/** Internal per-zone record for the derived model. */
interface DerivedZone {
  readonly zone: TwinLightingZone;
  readonly scenes: readonly DerivedScene[];
}

interface DerivedScene {
  readonly levels: Readonly<Partial<Record<CircuitId, number>>>;
  /** Set for central-table scenes (recalled on the bus rather than as levels). */
  readonly central?: RoomSceneControl;
}

export function createZoneLightingApi(
  knx: ZoneLegacyBus | (ZoneLegacyBus & KnxZoneBus),
  deps: ZoneLightingDeps
): TwinZoneLightingApi {
  const subscribe = (listener: () => void): Unsubscribe =>
    knx.subscribe((event) => {
      if (event.type === 'stateChange') listener();
    });
  return isKnxZoneBus(knx) ? createNative(knx, deps, subscribe) : createDerived(knx, deps, subscribe);
}

function manifestDimmableLookup(deps: ZoneLightingDeps): (id: CircuitId) => boolean | undefined {
  const map = new Map<string, boolean>();
  for (const entry of deps.manifest) for (const l of entry.lights) map.set(l.circuitId, l.dimmable);
  return (id) => map.get(id);
}

function createNative(
  bus: KnxZoneBus,
  deps: ZoneLightingDeps,
  subscribe: (listener: () => void) => Unsubscribe
): TwinZoneLightingApi {
  const dimmableOf = manifestDimmableLookup(deps);
  let cache: readonly TwinLightingZone[] | null = null;
  const zones = (): readonly TwinLightingZone[] => {
    if (cache) return cache;
    const byId = new Map(bus.getCircuits().map((c) => [c.id, c] as const));
    cache = bus.getZones().map((z) => {
      const circuits = z.circuits.flatMap((id) => {
        const c = byId.get(id);
        return c ? [toTwinCircuit(c, dimmableOf(id))] : [];
      });
      return {
        id: z.id,
        name: z.name,
        circuitIds: z.circuits,
        layers: groupLayers(circuits),
        scenes: z.scenes.map((s, index) => ({ index, id: s.id, label: stripScenePrefix(s.label) })),
      };
    });
    return cache;
  };
  const location = (zoneId: RoomZoneId): string => `${deps.roomLabel(zoneId)} (app)`;
  return {
    source: () => 'knx',
    list: zones,
    get: (zoneId) => zones().find((z) => z.id === zoneId),
    getState: (zoneId) => bus.getZoneState(zoneId),
    recallScene: (zoneId, index) => bus.recallZoneScene(zoneId, index, deps.uiSourcePa, location(zoneId)),
    setFull: (zoneId) => bus.setZoneFull(zoneId, deps.uiSourcePa, location(zoneId)),
    setNight: (zoneId) => bus.enterZoneNight(zoneId, deps.uiSourcePa, location(zoneId)),
    setOff: (zoneId) => bus.setZoneOff(zoneId, deps.uiSourcePa),
    onStateChanged: subscribe,
    presenceDetectors: (zoneId) =>
      bus
        .getPresenceDetectors()
        .filter((d) => zoneId === undefined || d.zoneId === zoneId)
        .map((d): TwinPresenceDetector => {
          const st = bus.getPresenceState(d.pa);
          return { pa: d.pa, name: d.name, zoneId: d.zoneId, detected: st.detected, lastSeenSimSec: st.lastSeenSimSec };
        }),
    switches: (zoneId) =>
      bus
        .getPushButtons()
        .filter((b) => zoneId === undefined || b.mountedInZoneId === zoneId)
        .map(
          (b): TwinZoneSwitch => ({
            pa: b.pa,
            name: b.name,
            location: b.location,
            mountedInZoneId: b.mountedInZoneId,
            gangs: b.gangs.map((g) => ({
              gang: g.gang,
              zoneId: g.zoneId,
              label: g.label,
              ledOn: bus.getZoneState(g.zoneId).mode !== 'off',
            })),
          })
        ),
  };
}

function createDerived(
  knx: ZoneLegacyBus,
  deps: ZoneLightingDeps,
  subscribe: (listener: () => void) => Unsubscribe
): TwinZoneLightingApi {
  const dimmableOf = manifestDimmableLookup(deps);
  const centralScenes = knx.getScenes();

  const zoneOrder: RoomZoneId[] = [];
  const seen = new Set<RoomZoneId>();
  for (const e of deps.manifest) {
    if (!seen.has(e.zoneId)) {
      seen.add(e.zoneId);
      zoneOrder.push(e.zoneId);
    }
  }
  for (const c of deps.circuits) {
    if (!seen.has(c.zoneId)) {
      seen.add(c.zoneId);
      zoneOrder.push(c.zoneId);
    }
  }

  const derived = new Map<RoomZoneId, DerivedZone>();
  for (const zoneId of zoneOrder) {
    const circuits = deps.circuits.filter((c) => c.zoneId === zoneId).map((c) => toTwinCircuit(c, dimmableOf(c.id)));
    if (circuits.length === 0) continue;
    const entry = deps.getManifest(zoneId);
    const centralCtl = entry?.scenes ?? [];
    const scenes: DerivedScene[] = [];
    const labels: { id: string; label: string }[] = [];
    if (centralCtl.length > 0) {
      for (const ctl of centralCtl) {
        const preset = centralScenes.find((p) => p.index === ctl.sceneNumber);
        scenes.push({ levels: preset?.levels ?? {}, central: ctl });
        labels.push({ id: ctl.id, label: ctl.label });
      }
    } else {
      for (const s of deps.getLevelScenes(zoneId)) {
        scenes.push({ levels: s.levels });
        labels.push({ id: s.id, label: stripScenePrefix(s.label) });
      }
    }
    derived.set(zoneId, {
      zone: {
        id: zoneId,
        name: deps.roomLabel(zoneId),
        circuitIds: circuits.map((c) => c.id),
        layers: groupLayers(circuits),
        scenes: labels.map((l, index) => ({ index, ...l })),
      },
      scenes,
    });
  }
  const zoneList: readonly TwinLightingZone[] = [...derived.values()].map((d) => d.zone);

  const applyZone = (zoneId: RoomZoneId, levelFor: (c: TwinZoneCircuit) => number): void => {
    const d = derived.get(zoneId);
    if (!d) return;
    for (const layer of d.zone.layers) for (const c of layer.circuits) knx.setCircuitLevel(c.id, levelFor(c));
  };

  const matches = (zone: TwinLightingZone, target: Readonly<CircuitLevels>, levels: Readonly<Partial<Record<CircuitId, number>>>, onlyListed: boolean): boolean =>
    zone.circuitIds.every((id) => {
      if (onlyListed && levels[id] === undefined) return true;
      return Math.abs((target[id] ?? 0) - levelOf(levels, id)) <= LEVEL_TOLERANCE;
    });

  const getState = (zoneId: RoomZoneId): KnxZoneState => {
    const d = derived.get(zoneId);
    if (!d) return { mode: 'off', sceneIndex: null };
    const target = knx.getTargetLevels();
    const values = d.zone.circuitIds.map((id) => target[id] ?? 0);
    if (values.every((v) => v <= 0)) return { mode: 'off', sceneIndex: null };
    const active = knx.getActiveSceneIndex();
    for (let i = 0; i < d.scenes.length; i++) {
      const s = d.scenes[i];
      if (s.central && s.central.sceneNumber !== active) continue;
      if (matches(d.zone, target, s.levels, s.central !== undefined)) return { mode: 'scene', sceneIndex: i };
    }
    if (values.every((v) => v >= 100 - LEVEL_TOLERANCE)) return { mode: 'full', sceneIndex: null };
    if (values.every((v) => v <= NIGHT_LEVEL_PCT + LEVEL_TOLERANCE)) return { mode: 'night', sceneIndex: null };
    return { mode: 'manual', sceneIndex: null };
  };

  const presenceDetectors = (zoneId?: RoomZoneId): readonly TwinPresenceDetector[] => {
    const list: TwinPresenceDetector[] = [
      { pa: 'kitchen-pir', name: 'Kitchen presence', zoneId: 'kitchen', detected: knx.getKitchenMotionDetected(), lastSeenSimSec: null },
      { pa: 'utility-pir', name: 'Utility presence', zoneId: 'utility', detected: knx.getUtilityMotionDetected(), lastSeenSimSec: null },
      ...knx.getRoomMotionSensors().map((s) => ({
        pa: s.pa,
        name: s.name,
        zoneId: s.zoneId,
        detected: knx.getRoomMotionDetected(s.id),
        lastSeenSimSec: null,
      })),
    ];
    return zoneId === undefined ? list : list.filter((d) => d.zoneId === zoneId);
  };

  return {
    source: () => 'derived',
    list: () => zoneList,
    get: (zoneId) => derived.get(zoneId)?.zone,
    getState,
    recallScene: (zoneId, index) => {
      const s = derived.get(zoneId)?.scenes[index];
      if (!s) return;
      if (s.central) {
        knx.recallScene(s.central.sceneNumber, s.central.pa);
        return;
      }
      applyZone(zoneId, (c) => Math.round(levelOf(s.levels, c.id)));
    },
    setFull: (zoneId) => applyZone(zoneId, () => 100),
    setNight: (zoneId) => applyZone(zoneId, (c) => (c.dimmable ? NIGHT_LEVEL_PCT : 0)),
    setOff: (zoneId) => applyZone(zoneId, () => 0),
    onStateChanged: subscribe,
    presenceDetectors,
    switches: () => [],
  };
}
