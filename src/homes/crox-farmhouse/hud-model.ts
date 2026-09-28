import { CIRCUITS } from '../../knx/constants.ts';
import { ROOM_ZONES } from '../../knx/topology.ts';
import type { FocusRoom } from '../../engine/focus/focus-controller.ts';
import type { RoomZoneDefinition, RoomZoneId } from '../../types/topology.ts';
import type { HomeHudModel, HudFloor, HudRoom, HudRoomScene } from '../../ui/focus/hud-model.ts';

const MAIN_HOUSE_FLOORS = ['ground', 'first'] as const;

const DINING_ROOM_SCENES: readonly HudRoomScene[] = [
  {
    id: 'entertaining',
    label: 'Entertaining',
    levels: {
      familyRoomSpots: 85,
      diningPendant: 90,
      diningPictureLight: 85,
      diningFairyLights: 100,
    },
  },
  {
    id: 'dining',
    label: 'Dining',
    levels: {
      familyRoomSpots: 20,
      diningPendant: 75,
      diningPictureLight: 90,
      diningFairyLights: 100,
    },
  },
  {
    id: 'cosy',
    label: 'Cosy',
    levels: {
      familyRoomSpots: 0,
      diningPendant: 35,
      diningPictureLight: 70,
      diningFairyLights: 100,
    },
  },
  {
    id: 'night',
    label: 'Night',
    levels: {
      familyRoomSpots: 0,
      diningPendant: 0,
      diningPictureLight: 20,
      diningFairyLights: 40,
    },
  },
];

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
    circuits: CIRCUITS.filter((c) => c.zoneId === z.id),
    scenes: z.id === 'familyRoom' ? DINING_ROOM_SCENES : undefined,
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

/** HUD model for Crox Farmhouse: main-house floors, rooms, grounds and circuits. */
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
    circuits: CIRCUITS,
    getRoom: (zoneId) => byId.get(zoneId),
  };
}
