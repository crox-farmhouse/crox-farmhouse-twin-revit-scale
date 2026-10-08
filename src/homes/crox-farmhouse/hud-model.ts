import type { CircuitConfig } from '../../core/types/knx.ts';
import { CROX_CIRCUITS } from './knx/circuits.ts';
import { ROOM_ZONES } from './knx/rooms.ts';
import { CROX_LIGHTING_ZONES, CROX_ZONE_SCENES as CROX_KNX_ZONE_SCENES } from './knx/zones.ts';
import type { FocusRoom } from '../../engine/rooms/focus-controller.ts';
import type { RoomZoneDefinition, RoomZoneId } from '../../core/types/topology.ts';
import type { HomeHudModel, HudFloor, HudRoom, HudRoomScene } from '../../core/types/home-hud.ts';

const MAIN_HOUSE_FLOORS = ['ground', 'first'] as const;

/** Zone scenes (wall-toggle scene order) keyed by zone — see knx/zones.ts. */
export const CROX_ZONE_SCENES: Readonly<Partial<Record<RoomZoneId, readonly HudRoomScene[]>>> =
  CROX_KNX_ZONE_SCENES;

function zoneCircuits(zoneId: RoomZoneId): readonly CircuitConfig[] {
  const zone = CROX_LIGHTING_ZONES.find((z) => z.id === zoneId);
  if (!zone) return CROX_CIRCUITS.filter((c) => c.zoneId === zoneId);
  return zone.circuits
    .map((id) => CROX_CIRCUITS.find((c) => c.id === id))
    .filter((c): c is CircuitConfig => c !== undefined);
}

function definedZones(): RoomZoneDefinition[] {
  return Object.values(ROOM_ZONES).filter((z): z is RoomZoneDefinition => z !== undefined);
}

function toHudRoom(z: RoomZoneDefinition): HudRoom {
  return {
    zoneId: z.id,
    name: z.name,
    shortName: z.shortName,
    floorId: z.floorId,
    isInterior: z.isInterior,
    bounds: z.bounds,
    circuits: zoneCircuits(z.id),
    scenes: CROX_ZONE_SCENES[z.id],
  };
}

/** Rooms the focus controller can resolve the camera target into. */
export function createCroxFarmhouseFocusRooms(): readonly FocusRoom[] {
  return definedZones().map((z) => ({
    zoneId: z.id,
    floorId: z.floorId,
    isInterior: z.isInterior,
    bounds: z.bounds,
  }));
}

/** HUD model for Crox Farmhouse: main-house + outbuilding floors, rooms, grounds and circuits. */
export function createCroxFarmhouseHudModel(): HomeHudModel {
  const rooms = definedZones().map(toHudRoom);
  const byId = new Map<RoomZoneId, HudRoom>(rooms.map((r) => [r.zoneId, r]));

  const floors: HudFloor[] = MAIN_HOUSE_FLOORS.map((floorId) => ({
    floorId,
    name: floorId === 'ground' ? 'Ground Floor' : 'First Floor',
    rooms: rooms.filter((r) => r.isInterior && r.floorId === floorId),
  }));

  return {
    homeName: 'Crox Farmhouse',
    floors,
    exteriorRooms: rooms.filter((r) => !r.isInterior),
    circuits: CROX_CIRCUITS,
    getRoom: (zoneId) => byId.get(zoneId),
  };
}
