import type {
  BuildingDefinition,
  BuildingId,
  FloorDefinition,
  RoomZoneDefinition,
  RoomZoneId,
} from '../../../core/types/topology.ts';
import { EAST_WING_LOCAL_ZONE_IDS, eastWingBoundsToWorld } from './east-wing-frame.ts';

/**
 * Crox Farmhouse (Tur Langton) buildings, floors and room zones.
 *
 * KNX areas / lines: 1.1 main house ground, 1.2 main house first floor, 2.1 outbuildings
 * (gym, garage, store, barn, mezzanine, stable office & suite). All bounds are WORLD-space
 * AABBs; rooms authored in the rotated east-wing frame are converted on load.
 */

export const BUILDINGS: Readonly<Record<BuildingId, BuildingDefinition>> = {
  mainHouse: {
    id: 'mainHouse',
    name: 'Crox Farmhouse (Main House)',
    knxArea: 1,
    description: 'Victorian brick farmhouse main residence in Tur Langton',
  },
  annex: {
    id: 'annex',
    name: 'Crox Farmhouse Annex',
    knxArea: 2,
    description: 'Self-contained annex wing with dedicated KNX TP1 line 2.1',
  },
  courtyardGrounds: {
    id: 'courtyardGrounds',
    name: 'Cobbled Courtyard & Grounds',
    knxArea: 1,
    description: 'South cobbled courtyard, reclaimed Victorian lamp post & exterior grounds',
  },
};

export const FLOORS: readonly FloorDefinition[] = [
  {
    id: 'ground',
    buildingId: 'mainHouse',
    name: 'Main House · Ground Floor',
    elevationY: 0,
    ceilingHeight: 3.0,
    knxLine: '1.1',
  },
  {
    id: 'first',
    buildingId: 'mainHouse',
    name: 'Main House · First Floor',
    elevationY: 2.38,
    ceilingHeight: 2.0,
    knxLine: '1.2',
  },
  {
    id: 'ground',
    buildingId: 'annex',
    name: 'Annex · Ground Floor',
    elevationY: 0,
    ceilingHeight: 2.65,
    knxLine: '2.1',
  },
  {
    id: 'exterior',
    buildingId: 'courtyardGrounds',
    name: 'Courtyard & Exterior Grounds',
    elevationY: 0,
    ceilingHeight: 10.0,
    knxLine: '1.1',
  },
];

/** Room zones as authored (east-wing rooms in the local east-wing frame). */
export const AUTHORED_ROOM_ZONES: Readonly<Partial<Record<RoomZoneId, RoomZoneDefinition>>> & {
  readonly kitchen: RoomZoneDefinition;
  readonly sitting: RoomZoneDefinition;
  readonly utility: RoomZoneDefinition;
  readonly familyRoom: RoomZoneDefinition;
  readonly bootLobby: RoomZoneDefinition;
  readonly hall: RoomZoneDefinition;
  readonly livingRoom: RoomZoneDefinition;
  readonly entranceHall: RoomZoneDefinition;
  readonly sittingRoom: RoomZoneDefinition;
  readonly study: RoomZoneDefinition;
  readonly mainBedroom: RoomZoneDefinition;
  readonly familyBathroom: RoomZoneDefinition;
  readonly upperLanding: RoomZoneDefinition;
  readonly bedroom2: RoomZoneDefinition;
  readonly bedroom3: RoomZoneDefinition;
  readonly bedroom4: RoomZoneDefinition;
  readonly courtyard: RoomZoneDefinition;
} = {
  kitchen: {
    id: 'kitchen',
    name: 'Dining Kitchen & Island (9.40m × 4.49m)',
    shortName: 'Kitchen',
    buildingId: 'mainHouse',
    floorId: 'ground',
    knxAreaLine: '1.1',
    isInterior: true,
    bounds: {
      minX: -4.45,
      maxX: 1.95,
      minY: 0.05,
      maxY: 2.98,
      minZ: -2.06,
      maxZ: 2.54,
    },
  },
  sitting: {
    id: 'sitting',
    name: 'Kitchen Sitting & Bifold Area',
    shortName: 'Sitting Area',
    buildingId: 'mainHouse',
    floorId: 'ground',
    knxAreaLine: '1.1',
    isInterior: true,
    bounds: {
      minX: 1.85,
      maxX: 5.05,
      minY: 0.05,
      maxY: 2.98,
      minZ: -0.31,
      maxZ: 2.54,
    },
  },
  utility: {
    id: 'utility',
    name: 'Utility Room (3.00m × 1.65m)',
    shortName: 'Utility Room',
    buildingId: 'mainHouse',
    floorId: 'ground',
    knxAreaLine: '1.1',
    isInterior: true,
    bounds: {
      minX: 1.95,
      maxX: 5.05,
      minY: 0.05,
      maxY: 2.98,
      minZ: -2.06,
      maxZ: -0.26,
    },
  },
  familyRoom: {
    id: 'familyRoom',
    name: 'Dining Room & Walk-in Cupboard (4.92m × 4.85m)',
    shortName: 'Dining Room',
    buildingId: 'mainHouse',
    floorId: 'ground',
    knxAreaLine: '1.1',
    isInterior: true,
    bounds: {
      minX: -9.85,
      maxX: -4.4,
      minY: -0.95,
      maxY: 2.26,
      minZ: -2.06,
      maxZ: 4.15,
    },
  },
  bootLobby: {
    id: 'bootLobby',
    name: 'Boot Lobby, Store (2.25m × 1.48m) & Cloakroom WC',
    shortName: 'Boot Lobby & WC',
    buildingId: 'mainHouse',
    floorId: 'ground',
    knxAreaLine: '1.1',
    isInterior: true,
    bounds: {
      minX: -13.05,
      maxX: -9.5,
      minY: -0.95,
      maxY: 2.26,
      minZ: -2.06,
      maxZ: 3.55,
    },
  },
  hall: {
    id: 'hall',
    name: 'Main Staircase Hall (4.90m × 4.00m)',
    shortName: 'Hall',
    buildingId: 'mainHouse',
    floorId: 'ground',
    knxAreaLine: '1.1',
    isInterior: true,
    bounds: {
      minX: -17.85,
      maxX: -12.8,
      minY: -0.35,
      maxY: 2.26,
      minZ: -2.06,
      maxZ: 3.25,
    },
  },
  livingRoom: {
    id: 'livingRoom',
    name: 'Living Room & Bay Window (4.90m × 4.47m)',
    shortName: 'Living Room',
    buildingId: 'mainHouse',
    floorId: 'ground',
    knxAreaLine: '1.1',
    isInterior: true,
    bounds: {
      minX: -23.0,
      maxX: -17.5,
      minY: -0.65,
      maxY: 2.26,
      minZ: -2.55,
      maxZ: 2.75,
    },
  },
  entranceHall: {
    id: 'entranceHall',
    name: 'Front Entrance Hall (IN)',
    shortName: 'Entrance Hall',
    buildingId: 'mainHouse',
    floorId: 'ground',
    knxAreaLine: '1.1',
    isInterior: true,
    bounds: {
      minX: -22.25,
      maxX: -16.35,
      minY: -0.65,
      maxY: 2.26,
      minZ: 2.0,
      maxZ: 3.6,
    },
  },
  sittingRoom: {
    id: 'sittingRoom',
    name: 'Front Sitting Room & Bay Window (4.80m × 4.45m)',
    shortName: 'Sitting Room',
    buildingId: 'mainHouse',
    floorId: 'ground',
    knxAreaLine: '1.1',
    isInterior: true,
    bounds: {
      minX: -23.0,
      maxX: -17.1,
      minY: -0.65,
      maxY: 2.26,
      minZ: 3.65,
      maxZ: 8.2,
    },
  },
  study: {
    id: 'study',
    name: 'Plant Room & South Lobby (3.20m × 3.10m)',
    shortName: 'Plant Room',
    buildingId: 'mainHouse',
    floorId: 'ground',
    knxAreaLine: '1.1',
    isInterior: true,
    bounds: {
      minX: -22.25,
      maxX: -17.35,
      minY: -0.65,
      maxY: 2.26,
      minZ: 8.3,
      maxZ: 11.55,
    },
  },
  mainBedroom: {
    id: 'mainBedroom',
    name: 'Main Bedroom (5.00m × 4.55m / 16\'5" × 14\'11")',
    shortName: 'Main Bedroom',
    buildingId: 'mainHouse',
    floorId: 'first',
    knxAreaLine: '1.2',
    isInterior: true,
    bounds: {
      minX: -9.6,
      maxX: -4.6,
      minY: 2.24,
      maxY: 5.05,
      minZ: -2.06,
      maxZ: 2.89,
    },
  },
  familyBathroom: {
    id: 'familyBathroom',
    name: 'Principal Family Bathroom & Upper Passage',
    shortName: 'Family Bathroom',
    buildingId: 'mainHouse',
    floorId: 'first',
    knxAreaLine: '1.2',
    isInterior: true,
    bounds: {
      minX: -12.85,
      maxX: -9.75,
      minY: 2.02,
      maxY: 4.55,
      minZ: -2.06,
      maxZ: 2.94,
    },
  },
  upperLanding: {
    id: 'upperLanding',
    name: 'First Floor Stair Landing (DN) & West Wing Corridor',
    shortName: 'Upper Landing',
    buildingId: 'mainHouse',
    floorId: 'first',
    knxAreaLine: '1.2',
    isInterior: true,
    bounds: {
      minX: -18.6,
      maxX: -13.0,
      minY: 2.02,
      maxY: 4.55,
      minZ: -2.06,
      maxZ: 8.3,
    },
  },
  bedroom2: {
    id: 'bedroom2',
    name: 'Bedroom 2 (5.05m × 3.75m / 16\'7" × 12\'4")',
    shortName: 'Bedroom 2',
    buildingId: 'mainHouse',
    floorId: 'first',
    knxAreaLine: '1.2',
    isInterior: true,
    bounds: {
      minX: -22.25,
      maxX: -17.45,
      minY: 2.02,
      maxY: 5.05,
      minZ: -2.55,
      maxZ: 2.65,
    },
  },
  bedroom3: {
    id: 'bedroom3',
    name: 'Bedroom 3 (4.00m × 3.85m) & Upstairs Shower Room',
    shortName: 'Bedroom 3',
    buildingId: 'mainHouse',
    floorId: 'first',
    knxAreaLine: '1.2',
    isInterior: true,
    bounds: {
      minX: -22.25,
      maxX: -18.55,
      minY: 2.02,
      maxY: 5.05,
      minZ: 2.05,
      maxZ: 8.2,
    },
  },
  bedroom4: {
    id: 'bedroom4',
    name: 'Bedroom 4 (4.95m × 3.20m / 16\'3" × 10\'6")',
    shortName: 'Bedroom 4',
    buildingId: 'mainHouse',
    floorId: 'first',
    knxAreaLine: '1.2',
    isInterior: true,
    bounds: {
      minX: -22.25,
      maxX: -17.35,
      minY: 2.02,
      maxY: 5.05,
      minZ: 8.3,
      maxZ: 11.55,
    },
  },
  courtyard: {
    id: 'courtyard',
    name: 'South Cobbled Courtyard & Split Driveway Gate',
    shortName: 'Courtyard',
    buildingId: 'courtyardGrounds',
    floorId: 'exterior',
    knxAreaLine: '1.1',
    isInterior: false,
    bounds: {
      minX: -22.4,
      maxX: 6.4,
      minY: -0.2,
      maxY: 6.0,
      minZ: 2.74,
      maxZ: 16.2,
    },
  },
  outbuildingGym: {
    id: 'outbuildingGym',
    name: 'Outbuilding Gym & Wellness Studio (5.49m × 5.15m)',
    shortName: 'Gym',
    buildingId: 'annex',
    floorId: 'ground',
    knxAreaLine: '2.1',
    isInterior: true,
    bounds: {
      minX: -22.15,
      maxX: -16.25,
      minY: -0.65,
      maxY: 3.25,
      minZ: 15.75,
      maxZ: 21.4,
    },
  },
  outbuildingGarage: {
    id: 'outbuildingGarage',
    name: 'Garage, Workshop & Shower Room',
    shortName: 'Garage',
    buildingId: 'annex',
    floorId: 'ground',
    knxAreaLine: '2.1',
    isInterior: true,
    bounds: {
      minX: -16.25,
      maxX: -10.05,
      minY: -0.65,
      maxY: 3.25,
      minZ: 14.95,
      maxZ: 20.65,
    },
  },
  outbuildingStore: {
    id: 'outbuildingStore',
    name: 'Garden Store & Barn Corridor',
    shortName: 'Store',
    buildingId: 'annex',
    floorId: 'ground',
    knxAreaLine: '2.1',
    isInterior: true,
    bounds: {
      minX: -10.2,
      maxX: -7.15,
      minY: -0.65,
      maxY: 3.25,
      minZ: 14.95,
      maxZ: 20.4,
    },
  },
  outbuildingBarn: {
    id: 'outbuildingBarn',
    name: 'Main Barn, Bars, Pool Lounge & TrackMan iO Golf Sim',
    shortName: 'Barn & Golf Sim',
    buildingId: 'annex',
    floorId: 'ground',
    knxAreaLine: '2.1',
    isInterior: true,
    bounds: {
      minX: -7.15,
      maxX: 0.9,
      minY: -0.8,
      maxY: 1.5,
      minZ: 14.25,
      maxZ: 19.95,
    },
  },
  outbuildingMezzanine: {
    id: 'outbuildingMezzanine',
    name: 'Barn Mezzanine 1990s Retro Lounge (4.34m × 5.15m)',
    shortName: 'Barn Mezzanine',
    buildingId: 'annex',
    floorId: 'first',
    knxAreaLine: '2.1',
    isInterior: true,
    bounds: {
      minX: -3.65,
      maxX: 0.9,
      minY: 1.5,
      maxY: 4.3,
      minZ: 14.25,
      maxZ: 19.65,
    },
  },
  outbuildingStableOffice: {
    id: 'outbuildingStableOffice',
    name: 'Office & Cloakroom WC (Stable)',
    shortName: 'Office',
    buildingId: 'annex',
    floorId: 'ground',
    knxAreaLine: '2.1',
    isInterior: true,
    bounds: {
      minX: 0.9,
      maxX: 9.45,
      minY: -0.55,
      maxY: 2.02,
      minZ: 13.5,
      maxZ: 19.25,
    },
  },
  outbuildingStableSuite: {
    id: 'outbuildingStableSuite',
    name: 'Stable Upper Guest Suite, Ensuite & East Balcony',
    shortName: 'Stable Suite',
    buildingId: 'annex',
    floorId: 'first',
    knxAreaLine: '2.1',
    isInterior: true,
    bounds: {
      minX: 0.9,
      maxX: 9.75,
      minY: 2.04,
      maxY: 4.75,
      minZ: 13.3,
      maxZ: 19.35,
    },
  },
};

type RoomZoneTable = typeof AUTHORED_ROOM_ZONES;

function toWorldFrame(raw: typeof AUTHORED_ROOM_ZONES): RoomZoneTable {
  const out: Partial<Record<RoomZoneId, RoomZoneDefinition>> = {};
  const zones = Object.values(raw).filter((z): z is RoomZoneDefinition => z !== undefined);
  for (const zone of zones) {
    out[zone.id] = EAST_WING_LOCAL_ZONE_IDS.includes(zone.id)
      ? { ...zone, bounds: eastWingBoundsToWorld(zone.bounds) }
      : zone;
  }
  return out as RoomZoneTable;
}

/** Room zones keyed by id, world-space bounds. */
export const ROOM_ZONES: RoomZoneTable = toWorldFrame(AUTHORED_ROOM_ZONES);

/** Returns the interior room zone containing world point (x, y, z), if any. */
export function findInteriorRoomZoneAtPoint(
  x: number,
  y: number,
  z: number,
  extraZones: readonly RoomZoneDefinition[] = []
): RoomZoneDefinition | undefined {
  const allZones = [
    ...Object.values(ROOM_ZONES).filter((zone): zone is RoomZoneDefinition => zone !== undefined),
    ...extraZones,
  ];
  return allZones.find(
    (zone) =>
      zone.isInterior &&
      !(zone.id === 'upperLanding' && x > -16.95 && z > 2.65) &&
      x >= zone.bounds.minX &&
      x <= zone.bounds.maxX &&
      y >= zone.bounds.minY &&
      y <= zone.bounds.maxY &&
      z >= zone.bounds.minZ &&
      z <= zone.bounds.maxZ
  );
}
