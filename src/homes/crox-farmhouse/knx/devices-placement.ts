import * as THREE from 'three';
import type { CircuitId } from '../../../core/types/knx.ts';
import type { RoomZoneId } from '../../../core/types/topology.ts';
import type { SceneBuilderContext } from '../../../engine/viewer/scene-types.ts';
import type { KnxPushButtonDevice } from '../../../integrations/knx/project.ts';
import type { CorstonToggleGangSpec } from '../../../objects/fixtures/corston-toggle-switch.ts';
import { buildKnxPresenceDetector } from '../../../objects/fixtures/knx-presence-detector.ts';
import { CROX_PRESENCE_DETECTORS, CROX_PUSH_BUTTONS } from './devices.ts';
import { AUTHORED_ROOM_ZONES } from './rooms.ts';
import { CROX_LIGHTING_ZONES } from './zones.ts';

/**
 * Where every Crox KNX push-button plate and presence detector lives in the 3D model, and the
 * glue that turns `CROX_PUSH_BUTTONS` rows into gang specs for the generic Corston fixture.
 *
 * Plates are built by the room builders listed in {@link CROX_PLATE_PLACEMENTS} (they call
 * `buildRoomCorstonToggleSwitch` / `buildWallKNXSwitch` / `buildUtilityKNXSwitch`, which resolve
 * gangs here by PA). Presence detectors without a legacy mesh are built here in world space by
 * {@link buildCroxKnxPresenceDetectors}. Exact world positions are read back from the built scene
 * with {@link collectCroxKnxDeviceWorldPositions} (used by tools/knx audits).
 */

export type CroxDeviceFrame = 'eastWing' | 'world' | 'outbuilding';

export interface CroxPlatePlacement {
  /** Builder function that places the plate. */
  readonly builtBy: string;
  /** Coordinate frame the builder authors the plate in. */
  readonly frame: CroxDeviceFrame;
  /** Visibility layer the plate is parented to. */
  readonly parent: 'scene' | 'firstFloor' | 'cutaway.southWest' | 'cutaway.north' | 'cutaway.east';
}

const GROUND_ROOMS = 'buildGroundFloorPendantsAndSwitches';
const FIRST_ROOMS = 'buildFirstFloorPendantsAndSwitches';
const KITCHEN_WALL = 'buildWallKNXSwitch';
const UTILITY_DOOR = 'buildUtilityKNXSwitch';
const OUTBUILDINGS = 'buildOutbuildingCorstonZoneSwitches';

/** Builder + frame for every plate in `CROX_PUSH_BUTTONS`. */
export const CROX_PLATE_PLACEMENTS: Readonly<Record<string, CroxPlatePlacement>> = {
  '1.1.10': { builtBy: KITCHEN_WALL, frame: 'eastWing', parent: 'cutaway.southWest' },
  '1.1.30': { builtBy: KITCHEN_WALL, frame: 'eastWing', parent: 'cutaway.north' },
  '1.1.14': { builtBy: KITCHEN_WALL, frame: 'eastWing', parent: 'cutaway.southWest' },
  '1.1.31': { builtBy: KITCHEN_WALL, frame: 'eastWing', parent: 'cutaway.east' },
  '1.1.11': { builtBy: UTILITY_DOOR, frame: 'eastWing', parent: 'scene' },
  '1.1.32': { builtBy: UTILITY_DOOR, frame: 'eastWing', parent: 'scene' },
  '1.1.15': { builtBy: GROUND_ROOMS, frame: 'eastWing', parent: 'scene' },
  '1.1.33': { builtBy: GROUND_ROOMS, frame: 'eastWing', parent: 'scene' },
  '1.1.16': { builtBy: GROUND_ROOMS, frame: 'eastWing', parent: 'scene' },
  '1.1.17': { builtBy: GROUND_ROOMS, frame: 'eastWing', parent: 'scene' },
  '1.1.18': { builtBy: GROUND_ROOMS, frame: 'eastWing', parent: 'scene' },
  '1.1.19': { builtBy: GROUND_ROOMS, frame: 'world', parent: 'scene' },
  '1.1.21': { builtBy: GROUND_ROOMS, frame: 'world', parent: 'scene' },
  '1.1.23': { builtBy: GROUND_ROOMS, frame: 'world', parent: 'scene' },
  '1.2.10': { builtBy: FIRST_ROOMS, frame: 'eastWing', parent: 'firstFloor' },
  '1.2.11': { builtBy: FIRST_ROOMS, frame: 'eastWing', parent: 'firstFloor' },
  '1.2.12': { builtBy: FIRST_ROOMS, frame: 'eastWing', parent: 'firstFloor' },
  '1.2.13': { builtBy: FIRST_ROOMS, frame: 'world', parent: 'firstFloor' },
  '1.2.14': { builtBy: FIRST_ROOMS, frame: 'world', parent: 'firstFloor' },
  '1.2.15': { builtBy: FIRST_ROOMS, frame: 'world', parent: 'firstFloor' },
  ...Object.fromEntries(
    CROX_PUSH_BUTTONS.filter((b) => b.pa.startsWith('2.1.')).map((b) => [
      b.pa,
      { builtBy: OUTBUILDINGS, frame: 'outbuilding', parent: 'scene' } satisfies CroxPlatePlacement,
    ]),
  ),
};

/** Presence detectors that already have a bespoke mesh (only tagged with `presenceDetectorPa`). */
export const CROX_LEGACY_PRESENCE_MESH_PAS: readonly string[] = ['1.1.12', '1.1.13', '1.1.24', '1.1.25', '1.1.26'];

const pushButtonByPa: ReadonlyMap<string, KnxPushButtonDevice> = new Map(CROX_PUSH_BUTTONS.map((b) => [b.pa, b]));

export function croxPushButton(pa: string): KnxPushButtonDevice | undefined {
  return pushButtonByPa.get(pa);
}

/** First circuit of a lighting zone (bound to the gang for legacy circuit handlers / LEDs). */
export function croxZoneFirstCircuit(zoneId: RoomZoneId): CircuitId | undefined {
  return CROX_LIGHTING_ZONES.find((z) => z.id === zoneId)?.circuits[0];
}

/** Gang specs for the Corston fixture, or null when the PA is not a known push-button. */
export function croxPushButtonGangs(pa: string): CorstonToggleGangSpec[] | null {
  const device = pushButtonByPa.get(pa);
  if (!device) return null;
  return device.gangs.map((g) => {
    const circuitId = croxZoneFirstCircuit(g.zoneId);
    return { gang: g.gang, zoneId: g.zoneId, label: g.label, ...(circuitId ? { circuitId } : {}) };
  });
}

/**
 * Builds a ceiling / wall presence detector for every `CROX_PRESENCE_DETECTORS` row that has no
 * bespoke mesh. `ctx` must be the unscoped (world-frame) builder context: detector positions are
 * world coordinates; first-floor rooms go into the first-floor layer so floor cutaways hide them.
 */
export function buildCroxKnxPresenceDetectors(ctx: SceneBuilderContext): THREE.Group[] {
  const built: THREE.Group[] = [];
  for (const det of CROX_PRESENCE_DETECTORS) {
    if (CROX_LEGACY_PRESENCE_MESH_PAS.includes(det.pa)) continue;
    const floorId = AUTHORED_ROOM_ZONES[det.zoneId]?.floorId;
    const handle = buildKnxPresenceDetector(ctx, {
      name: `knx.presence.${det.pa.replace(/\./g, '_')}`,
      presenceDetectorPa: det.pa,
      zoneId: det.zoneId,
      x: det.position.x,
      y: det.position.y,
      z: det.position.z,
      parentGroup: floorId === 'first' ? ctx.firstFloorMeshGroup : ctx.scene,
    });
    handle.group.userData.knxDeviceName = det.name;
    built.push(handle.group);
  }
  return built;
}

export interface CroxKnxDeviceWorldPositions {
  readonly pushButtons: ReadonlyMap<string, THREE.Vector3>;
  readonly presenceDetectors: ReadonlyMap<string, THREE.Vector3>;
}

/** Reads every built plate / detector's world position back from the scene graph. */
export function collectCroxKnxDeviceWorldPositions(root: THREE.Object3D): CroxKnxDeviceWorldPositions {
  root.updateMatrixWorld(true);
  const pushButtons = new Map<string, THREE.Vector3>();
  const presenceDetectors = new Map<string, THREE.Vector3>();
  root.traverse((obj) => {
    const plate: unknown = obj.userData.knxPushButtonPa;
    if (typeof plate === 'string' && !pushButtons.has(plate)) {
      pushButtons.set(plate, obj.getWorldPosition(new THREE.Vector3()));
    }
    const pir: unknown = obj.userData.presenceDetectorPa;
    if (typeof pir === 'string' && !presenceDetectors.has(pir) && !(obj instanceof THREE.Mesh)) {
      presenceDetectors.set(pir, obj.getWorldPosition(new THREE.Vector3()));
    }
  });
  return { pushButtons, presenceDetectors };
}
