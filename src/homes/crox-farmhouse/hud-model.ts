import { CIRCUITS } from '../../knx/constants.ts';
import { ROOM_ZONES } from '../../knx/topology.ts';
import type { FocusRoom } from '../../engine/focus/focus-controller.ts';
import type { RoomZoneDefinition, RoomZoneId } from '../../types/topology.ts';
import type { HomeHudModel, HudFloor, HudRoom, HudRoomScene } from '../../ui/focus/hud-model.ts';

const MAIN_HOUSE_FLOORS = ['ground', 'first'] as const;

export const CROX_ZONE_SCENES: Readonly<Partial<Record<RoomZoneId, readonly HudRoomScene[]>>> = {
  familyRoom: [
    {
      id: 'entertaining',
      label: 'S1 Entertaining',
      levels: {
        familyRoomSpots: 85,
        diningPendant: 90,
        diningPictureLight: 85,
        diningFairyLights: 100,
      },
    },
    {
      id: 'dining',
      label: 'S2 Dining',
      levels: {
        familyRoomSpots: 20,
        diningPendant: 75,
        diningPictureLight: 90,
        diningFairyLights: 100,
      },
    },
    {
      id: 'cosy',
      label: 'S3 Cosy',
      levels: {
        familyRoomSpots: 0,
        diningPendant: 35,
        diningPictureLight: 70,
        diningFairyLights: 100,
      },
    },
  ],
  bootLobby: [
    { id: 'bright', label: 'S1 Bright', levels: { bootLobbyPendant: 100, wineCellarLeds: 85, cloakroomWcLights: 90 } },
    { id: 'welcome', label: 'S2 Welcome', levels: { bootLobbyPendant: 65, wineCellarLeds: 70, cloakroomWcLights: 75 } },
    { id: 'night', label: 'S3 Night Glow', levels: { bootLobbyPendant: 25, wineCellarLeds: 40, cloakroomWcLights: 30 } },
  ],
  hall: [
    { id: 'bright', label: 'S1 Bright', levels: { hallPendant: 100 } },
    { id: 'evening', label: 'S2 Evening', levels: { hallPendant: 65 } },
    { id: 'night', label: 'S3 Night', levels: { hallPendant: 25 } },
  ],
  livingRoom: [
    { id: 'bright', label: 'S1 Bright', levels: { frontRoomPendant: 100 } },
    { id: 'cinema', label: 'S2 Cinema', levels: { frontRoomPendant: 45 } },
    { id: 'late', label: 'S3 Late Glow', levels: { frontRoomPendant: 20 } },
  ],
  entranceHall: [
    { id: 'welcome', label: 'S1 Welcome', levels: { entranceHallPendant: 100, entranceHallUplights: 85 } },
    { id: 'evening', label: 'S2 Evening', levels: { entranceHallPendant: 60, entranceHallUplights: 65 } },
    { id: 'uplights', label: 'S3 Uplights Only', levels: { entranceHallPendant: 0, entranceHallUplights: 45 } },
  ],
  sittingRoom: [
    { id: 'bright', label: 'S1 Bright', levels: { livingRoomPendant: 100 } },
    { id: 'fireside', label: 'S2 Fireside & 5V Lamp', levels: { livingRoomPendant: 65 } },
    { id: 'cosy', label: 'S3 Cosy 5V Lamp', levels: { livingRoomPendant: 30 } },
  ],
  study: [
    { id: 'work', label: 'S1 Desk Work', levels: { studyPendant: 100 } },
    { id: 'reading', label: 'S2 Reading', levels: { studyPendant: 65 } },
    { id: 'late', label: 'S3 Late Study', levels: { studyPendant: 30 } },
  ],
  mainBedroom: [
    { id: 'bright', label: 'S1 Bright', levels: { mainBedroomPendant: 100 } },
    { id: 'relax', label: 'S2 Relax & 5V Lamps', levels: { mainBedroomPendant: 60 } },
    { id: 'bedtime', label: 'S3 Bedtime 5V Lamps', levels: { mainBedroomPendant: 25 } },
  ],
  familyBathroom: [
    { id: 'bright', label: 'S1 Morning', levels: { familyBathroomPendant: 100 } },
    { id: 'bath', label: 'S2 Soak & Relax', levels: { familyBathroomPendant: 50 } },
    { id: 'night', label: 'S3 Night Spa', levels: { familyBathroomPendant: 20 } },
  ],
  upperLanding: [
    { id: 'bright', label: 'S1 Bright', levels: { upperLandingPendant: 100 } },
    { id: 'evening', label: 'S2 Evening', levels: { upperLandingPendant: 60 } },
    { id: 'night', label: 'S3 Night', levels: { upperLandingPendant: 20 } },
  ],
  bedroom2: [
    { id: 'bright', label: 'S1 Bright', levels: { bedroom2Pendant: 100 } },
    { id: 'evening', label: 'S2 Evening', levels: { bedroom2Pendant: 60 } },
    { id: 'bedtime', label: 'S3 Bedtime 5V Lamps', levels: { bedroom2Pendant: 25 } },
  ],
  bedroom3: [
    { id: 'bright', label: 'S1 Bright', levels: { bedroom3Pendant: 100 } },
    { id: 'evening', label: 'S2 Evening', levels: { bedroom3Pendant: 60 } },
    { id: 'bedtime', label: 'S3 Bedtime 5V Lamp', levels: { bedroom3Pendant: 25 } },
  ],
  bedroom4: [
    { id: 'bright', label: 'S1 Bright', levels: { bedroom4Pendant: 100 } },
    { id: 'evening', label: 'S2 Evening', levels: { bedroom4Pendant: 60 } },
    { id: 'bedtime', label: 'S3 Bedtime 5V Lamps', levels: { bedroom4Pendant: 25 } },
  ],
  outbuildingGym: [
    {
      id: 'workout',
      label: 'S1 Workout',
      levels: { gymSpotsAndBattens: 100, gymWallAndCoveLights: 85 },
    },
    {
      id: 'yoga',
      label: 'S2 Yoga & Mobility',
      levels: { gymSpotsAndBattens: 35, gymWallAndCoveLights: 80 },
    },
    {
      id: 'recovery',
      label: 'S3 Warm Recovery',
      levels: { gymSpotsAndBattens: 0, gymWallAndCoveLights: 45 },
    },
  ],
  outbuildingGarage: [
    {
      id: 'workshop',
      label: 'S1 Workshop & Bench',
      levels: { garageHighBayLights: 100, garageBenchAndShower: 100 },
    },
    {
      id: 'showroom',
      label: 'S2 992 Showroom',
      levels: { garageHighBayLights: 75, garageBenchAndShower: 45 },
    },
    {
      id: 'nightbay',
      label: 'S3 Night Security',
      levels: { garageHighBayLights: 20, garageBenchAndShower: 35 },
    },
  ],
  outbuildingBarn: [
    {
      id: 'golfSocial',
      label: 'S1 Golf & Social',
      levels: { barnTrussAndSimHalo: 95, barnBarsAndLamps5A: 85 },
    },
    {
      id: 'cocktailBar',
      label: 'S2 Cocktail & Pool',
      levels: { barnTrussAndSimHalo: 55, barnBarsAndLamps5A: 95 },
    },
    {
      id: 'lateLounge',
      label: 'S3 5V Lamps Lounge',
      levels: { barnTrussAndSimHalo: 22, barnBarsAndLamps5A: 65 },
    },
  ],
  outbuildingMezzanine: [
    {
      id: 'retroGaming',
      label: 'S1 90s Gaming',
      levels: { mezzanineSconcesAndAmbient: 45, mezzanineLamps5A: 90 },
    },
    {
      id: 'readingTasks',
      label: 'S2 Reading & Tasks',
      levels: { mezzanineSconcesAndAmbient: 90, mezzanineLamps5A: 100 },
    },
    {
      id: 'chill5vLamps',
      label: 'S3 5V Lamps Only',
      levels: { mezzanineSconcesAndAmbient: 0, mezzanineLamps5A: 65 },
    },
  ],
  outbuildingStableOffice: [
    {
      id: 'brightWork',
      label: 'S1 Bright Office',
      levels: { stableOfficeSpotlights: 100, stableOfficeWallsAndLamps5A: 85 },
    },
    {
      id: 'focusWallGlow',
      label: 'S2 Focus & Wall Glow',
      levels: { stableOfficeSpotlights: 55, stableOfficeWallsAndLamps5A: 90 },
    },
    {
      id: 'evening5vLamps',
      label: 'S3 Wall & 5V Lamps',
      levels: { stableOfficeSpotlights: 0, stableOfficeWallsAndLamps5A: 70 },
    },
  ],
  outbuildingStableSuite: [
    {
      id: 'suiteMorning',
      label: 'S1 Bright Suite',
      levels: { stableSuiteDownlights: 95, stableSuiteLamps5A: 85 },
    },
    {
      id: 'suiteRelax',
      label: 'S2 Relax & Balcony',
      levels: { stableSuiteDownlights: 55, stableSuiteLamps5A: 90 },
    },
    {
      id: 'bedtime5vLamps',
      label: 'S3 Bedtime 5V Lamps',
      levels: { stableSuiteDownlights: 0, stableSuiteLamps5A: 45 },
    },
  ],
};

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
    circuits: CIRCUITS,
    getRoom: (zoneId) => byId.get(zoneId),
  };
}
