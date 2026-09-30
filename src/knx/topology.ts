import type {
  BuildingDefinition,
  BuildingId,
  FloorDefinition,
  KNXPhysicalDeviceDefinition,
  RoomZoneDefinition,
  RoomZoneId,
} from '../types/topology.ts';

/**
 * Crox Farmhouse (Tur Langton) Multi-Building, Multi-Floor & Multi-Zone Topology Registry.
 *
 * KNX Area & Line Architecture:
 * - Area 1: Crox Farmhouse Main House
 *   - Line 1.1: Ground Floor (Kitchen, Sitting/Dining, Utility, Hallway, Snug)
 *   - Line 1.2: First Floor & Attic (Bedrooms, Bathrooms, Landing)
 * - Area 2: The Annex
 *   - Line 2.1: Annex Ground & First Floor (Annex Living, Kitchenette, Bedroom, En-Suite)
 * - Area 3: Exterior & Courtyard Grounds
 *   - Line 3.1 (or routed via 1.1.20): Cobbled Courtyard, Driveway & Garden Lighting
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

export const ROOM_ZONES: Readonly<Partial<Record<RoomZoneId, RoomZoneDefinition>>> & {
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
    nightWalkRule: {
      sensorGa: '1/4/1',
      levels: {
        bifoldUplights: 10,
        spotlights: 10,
        underCabinet: 20,
        aboveCabinet: 20,
      },
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
    nightWalkRule: {
      sensorGa: '1/4/3',
      levels: {
        utilitySpotlights: 15,
      },
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
      minX: -9.6,
      maxX: -4.6,
      minY: -0.95,
      maxY: 2.26,
      minZ: -2.06,
      maxZ: 2.54,
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
      minX: -12.85,
      maxX: -9.75,
      minY: -0.95,
      maxY: 2.26,
      minZ: -2.06,
      maxZ: 2.54,
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
      minX: -17.1,
      maxX: -13.0,
      minY: -0.35,
      maxY: 2.26,
      minZ: -2.06,
      maxZ: 2.94,
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
    name: 'Study & South Lobby (3.20m × 3.10m)',
    shortName: 'Study',
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
      minY: 2.02,
      maxY: 4.36,
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
      maxY: 4.36,
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
      maxY: 4.36,
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
      maxY: 4.36,
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
      maxY: 4.36,
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
      maxY: 4.36,
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
};

export const KNX_PHYSICAL_DEVICES: readonly KNXPhysicalDeviceDefinition[] = [
  {
    pa: '1.1.1',
    name: 'ETS6 / KNXnet/IP Tunneling Interface',
    buildingId: 'mainHouse',
    floorId: 'ground',
    zoneId: 'kitchen',
    role: 'ipGateway',
    maskVersion: '0x091A',
    description: 'KNXnet/IP Tunneling & Routing Interface bridging Digital Twin <-> TP1 Bus',
  },
  {
    pa: '1.1.2',
    name: 'Gemini AI Voice & Natural-Language KNX Bridge',
    buildingId: 'mainHouse',
    floorId: 'ground',
    zoneId: 'kitchen',
    role: 'aiBridge',
    maskVersion: '0x07B0',
    description: 'AI Assistant KNX Endpoint for multi-room scene recall & natural-language dimming',
  },
  {
    pa: '1.1.10',
    name: 'Corston Antique Brass 2-Way Toggle Switches (x4)',
    buildingId: 'mainHouse',
    floorId: 'ground',
    zoneId: 'kitchen',
    role: 'wallSwitch',
    maskVersion: '0x07B0',
    description: '4-location 2-way retractive toggle switches controlling Kitchen & Sitting scenes',
  },
  {
    pa: '1.1.11',
    name: 'Corston Utility Room Toggle Switch',
    buildingId: 'mainHouse',
    floorId: 'ground',
    zoneId: 'utility',
    role: 'wallSwitch',
    maskVersion: '0x07B0',
    description: 'Single-gang Antique Brass toggle switch inside Utility Room doorway',
  },
  {
    pa: '1.1.12',
    name: 'Kitchen Ceiling Flush PIR Presence & Lux Sensor',
    buildingId: 'mainHouse',
    floorId: 'ground',
    zoneId: 'kitchen',
    role: 'pirLuxSensor',
    maskVersion: '0x07B0',
    description: '360° flush ceiling PIR occupancy + ambient lux sensor (GA 1/4/1, 1/4/2, 1/4/4)',
  },
  {
    pa: '1.1.13',
    name: 'Utility Room Ceiling Flush PIR Presence Sensor',
    buildingId: 'mainHouse',
    floorId: 'ground',
    zoneId: 'utility',
    role: 'pirLuxSensor',
    maskVersion: '0x07B0',
    description: '360° flush ceiling PIR occupancy sensor in Utility Room (GA 1/4/3)',
  },
  {
    pa: '1.1.14',
    name: 'Bifold Pier 2-Gang Switch (G2 Courtyard)',
    buildingId: 'courtyardGrounds',
    floorId: 'exterior',
    zoneId: 'courtyard',
    role: 'wallSwitch',
    maskVersion: '0x07B0',
    description: 'Gang 2 of the South Bifold Pier Corston switch controlling Courtyard Festoons & Lamp Post',
  },
  {
    pa: '1.1.15',
    name: 'Corston Dining Room Toggle Switch',
    buildingId: 'mainHouse',
    floorId: 'ground',
    zoneId: 'familyRoom',
    role: 'wallSwitch',
    maskVersion: '0x07B0',
    description: 'Single-gang Antique Brass toggle switch controlling Dining Room pendant, downlights & lamps (GA 1/1/10, 1/2/10)',
  },
  {
    pa: '1.1.16',
    name: 'Corston Boot Lobby & Cloakroom WC Toggle Switch',
    buildingId: 'mainHouse',
    floorId: 'ground',
    zoneId: 'bootLobby',
    role: 'wallSwitch',
    maskVersion: '0x07B0',
    description: 'Single-gang Antique Brass toggle switch inside Boot Lobby controlling pendant & WC light (GA 1/1/11, 1/2/11)',
  },
  {
    pa: '1.1.17',
    name: 'Corston Staircase Hall Toggle Switch',
    buildingId: 'mainHouse',
    floorId: 'ground',
    zoneId: 'hall',
    role: 'wallSwitch',
    maskVersion: '0x07B0',
    description: 'Single-gang Antique Brass toggle switch by Staircase Hall controlling Hall lantern pendant (GA 1/1/12, 1/2/12)',
  },
  {
    pa: '1.1.18',
    name: 'Corston Front Room Toggle Switch',
    buildingId: 'mainHouse',
    floorId: 'ground',
    zoneId: 'livingRoom',
    role: 'wallSwitch',
    maskVersion: '0x07B0',
    description: 'Single-gang Antique Brass toggle switch inside Front Room doorway controlling central pendant & sconces (GA 1/1/13, 1/2/13)',
  },
  {
    pa: '1.1.19',
    name: 'Corston Front Entrance Hall Toggle Switch',
    buildingId: 'mainHouse',
    floorId: 'ground',
    zoneId: 'entranceHall',
    role: 'wallSwitch',
    maskVersion: '0x07B0',
    description: 'Single-gang Antique Brass toggle switch inside West Front Door controlling Entrance Hall lantern (GA 1/1/14, 1/2/14)',
  },
  {
    pa: '1.1.20',
    name: '16-Channel Ground Floor KNX Universal Dimming Actuator',
    buildingId: 'mainHouse',
    floorId: 'ground',
    zoneId: 'kitchen',
    role: 'dimmingActuator',
    maskVersion: '0x07B0',
    description: 'DIN-rail 16-channel phase/24V-PWM dimming actuator for Ground Floor & Courtyard circuits (Ch 1..16)',
  },
  {
    pa: '1.1.21',
    name: 'Corston Living Room Toggle Switch',
    buildingId: 'mainHouse',
    floorId: 'ground',
    zoneId: 'sittingRoom',
    role: 'wallSwitch',
    maskVersion: '0x07B0',
    description: 'Single-gang Antique Brass toggle switch inside Living Room doorway controlling central pendant & hearth lamps (GA 1/1/15, 1/2/15)',
  },
  {
    pa: '1.1.22',
    name: 'KNX Motorized Front Car Gate Controller (24V Dual-Leaf Rams)',
    buildingId: 'courtyardGrounds',
    floorId: 'exterior',
    zoneId: 'courtyard',
    role: 'gateController',
    maskVersion: '0x07B0',
    description: 'Synchronized 10s dual-leaf swing gate actuator for Front Car Entrance (GA 1/5/1 & 1/5/2)',
  },
  {
    pa: '1.1.23',
    name: 'Corston Study & South Lobby Toggle Switch',
    buildingId: 'mainHouse',
    floorId: 'ground',
    zoneId: 'study',
    role: 'wallSwitch',
    maskVersion: '0x07B0',
    description: 'Single-gang Antique Brass toggle switch in Study controlling opal globe pendant (GA 1/1/16, 1/2/16)',
  },
  {
    pa: '1.1.25',
    name: 'Wine Cellar Ceiling Flush PIR Presence Sensor',
    buildingId: 'mainHouse',
    floorId: 'ground',
    zoneId: 'bootLobby',
    role: 'pirLuxSensor',
    maskVersion: '0x07B0',
    description: '360° flush ceiling PIR occupancy sensor switching the Wine Cellar shelf LEDs (GA 1/4/5)',
  },
  {
    pa: '1.1.26',
    name: 'Cloakroom WC Ceiling Flush PIR Presence Sensor',
    buildingId: 'mainHouse',
    floorId: 'ground',
    zoneId: 'bootLobby',
    role: 'pirLuxSensor',
    maskVersion: '0x07B0',
    description: '360° flush ceiling PIR occupancy sensor switching the Cloakroom WC downlight (GA 1/4/6)',
  },
  {
    pa: '1.2.10',
    name: 'Corston Main Bedroom Toggle Switch',
    buildingId: 'mainHouse',
    floorId: 'first',
    zoneId: 'mainBedroom',
    role: 'wallSwitch',
    maskVersion: '0x07B0',
    description: 'Single-gang Antique Brass toggle switch inside Main Bedroom doorway (GA 2/1/1, 2/2/1)',
  },
  {
    pa: '1.2.11',
    name: 'Corston Family Bathroom Toggle Switch',
    buildingId: 'mainHouse',
    floorId: 'first',
    zoneId: 'familyBathroom',
    role: 'wallSwitch',
    maskVersion: '0x07B0',
    description: 'Single-gang Antique Brass toggle switch outside/inside Principal Family Bathroom (GA 2/1/2, 2/2/2)',
  },
  {
    pa: '1.2.12',
    name: 'Corston First Floor Landing Toggle Switch',
    buildingId: 'mainHouse',
    floorId: 'first',
    zoneId: 'upperLanding',
    role: 'wallSwitch',
    maskVersion: '0x07B0',
    description: 'Single-gang Antique Brass toggle switch at top of stairs controlling Upper Landing pendants (GA 2/1/3, 2/2/3)',
  },
  {
    pa: '1.2.13',
    name: 'Corston Bedroom 2 Toggle Switch',
    buildingId: 'mainHouse',
    floorId: 'first',
    zoneId: 'bedroom2',
    role: 'wallSwitch',
    maskVersion: '0x07B0',
    description: 'Single-gang Antique Brass toggle switch inside Bedroom 2 doorway (GA 2/1/4, 2/2/4)',
  },
  {
    pa: '1.2.14',
    name: 'Corston Bedroom 3 Toggle Switch',
    buildingId: 'mainHouse',
    floorId: 'first',
    zoneId: 'bedroom3',
    role: 'wallSwitch',
    maskVersion: '0x07B0',
    description: 'Single-gang Antique Brass toggle switch inside Bedroom 3 doorway (GA 2/1/5, 2/2/5)',
  },
  {
    pa: '1.2.15',
    name: 'Corston Bedroom 4 Toggle Switch',
    buildingId: 'mainHouse',
    floorId: 'first',
    zoneId: 'bedroom4',
    role: 'wallSwitch',
    maskVersion: '0x07B0',
    description: 'Single-gang Antique Brass toggle switch inside Bedroom 4 doorway (GA 2/1/6, 2/2/6)',
  },
  {
    pa: '1.2.20',
    name: '6-Channel First Floor KNX Universal Dimming Actuator',
    buildingId: 'mainHouse',
    floorId: 'first',
    zoneId: 'upperLanding',
    role: 'dimmingActuator',
    maskVersion: '0x07B0',
    description: 'DIN-rail 6-channel phase dimming actuator on TP1 Line 1.2 for First Floor bedrooms, bathroom & landing (Ch 17..22)',
  },
];

/**
 * Returns the interior RoomZoneDefinition containing world point (x, y, z), if any.
 * Used by the 3D camera engine to automatically restore ceilings/walls when the camera
 * enters any interior room across the Main House or Annex.
 */
export function findInteriorRoomZoneAtPoint(
  x: number,
  y: number,
  z: number,
  extraZones: readonly RoomZoneDefinition[] = []
): RoomZoneDefinition | undefined {
  const allZones = [
    ...Object.values(ROOM_ZONES).filter((z): z is RoomZoneDefinition => z !== undefined),
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

export function isPointInsideAnyInteriorRoom(
  x: number,
  y: number,
  z: number,
  extraZones: readonly RoomZoneDefinition[] = []
): boolean {
  return findInteriorRoomZoneAtPoint(x, y, z, extraZones) !== undefined;
}
