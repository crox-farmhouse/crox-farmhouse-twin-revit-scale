import type { CircuitId, ScenePreset, ZoneScenePreset } from '../../../core/types/knx.ts';
import type { RoomZoneId } from '../../../core/types/topology.ts';
import type { KnxLightingZone } from '../../../integrations/knx/project.ts';
import { CROX_CENTRAL_SCENES } from './central-scenes.ts';
import { zoneGroupAddresses } from './ga-plan.ts';

type Levels = Partial<Record<CircuitId, number>>;

function scene(id: string, label: string, levels: Levels): ZoneScenePreset {
  return { id, label, levels };
}

function centralLevels(index: number): Levels {
  const preset: ScenePreset | undefined = CROX_CENTRAL_SCENES[index];
  return preset ? { ...preset.levels } : {};
}

interface ZoneSpec {
  readonly id: RoomZoneId;
  readonly name: string;
  readonly aliases?: readonly string[];
  readonly circuits: readonly CircuitId[];
  readonly scenes: readonly ZoneScenePreset[];
  readonly nightLevels: Levels;
}

/**
 * Lighting design per zone: layered circuits, stored scenes (stepped by short presses on
 * the zone's wall toggles, in this order) and the night-object levels (3–5 %).
 */
const ZONE_SPECS: readonly ZoneSpec[] = [
  {
    id: 'kitchen',
    name: 'Kitchen',
    aliases: ['kitchen', 'dining kitchen', 'island', 'open plan'],
    circuits: ['islandPendants', 'spotlights', 'underCabinet', 'aboveCabinet', 'sittingPendants', 'bifoldUplights'],
    scenes: [
      scene('bright', 'Bright', { islandPendants: 100, spotlights: 100, underCabinet: 100, aboveCabinet: 90, sittingPendants: 85, bifoldUplights: 70 }),
      scene('cook', 'Cook', centralLevels(0)),
      scene('dine', 'Dine', centralLevels(1)),
      scene('relax', 'Relax', centralLevels(2)),
      scene('movie', 'Movie', { islandPendants: 0, spotlights: 0, underCabinet: 15, aboveCabinet: 30, sittingPendants: 20, bifoldUplights: 35 }),
      scene('night', 'Night', { islandPendants: 0, spotlights: 0, underCabinet: 12, aboveCabinet: 18, sittingPendants: 0, bifoldUplights: 10 }),
    ],
    nightLevels: { spotlights: 4, underCabinet: 5, aboveCabinet: 5, bifoldUplights: 3 },
  },
  {
    id: 'sitting',
    name: 'Kitchen sitting area',
    aliases: ['sitting area', 'kitchen sitting area', 'snug', 'bifold area'],
    circuits: ['sittingPendants', 'bifoldUplights'],
    scenes: [
      scene('bright', 'Bright', { sittingPendants: 100, bifoldUplights: 80 }),
      scene('evening', 'Evening', { sittingPendants: 70, bifoldUplights: 60 }),
      scene('tv', 'TV', { sittingPendants: 25, bifoldUplights: 40 }),
      scene('glow', 'Glow', { sittingPendants: 0, bifoldUplights: 30 }),
    ],
    nightLevels: { bifoldUplights: 4 },
  },
  {
    id: 'utility',
    name: 'Utility room',
    aliases: ['utility', 'utility room', 'laundry'],
    circuits: ['utilitySpotlights'],
    scenes: [
      scene('bright', 'Bright', { utilitySpotlights: 100 }),
      scene('task', 'Task', { utilitySpotlights: 70 }),
      scene('low', 'Low', { utilitySpotlights: 30 }),
    ],
    nightLevels: { utilitySpotlights: 5 },
  },
  {
    id: 'familyRoom',
    name: 'Dining room',
    aliases: ['dining room', 'dining', 'family room'],
    circuits: ['familyRoomSpots', 'diningPendant', 'diningPictureLight', 'diningFairyLights', 'walkInCupboardLeds'],
    scenes: [
      scene('bright', 'Bright', { familyRoomSpots: 100, diningPendant: 100, diningPictureLight: 90, diningFairyLights: 100 }),
      scene('entertaining', 'Entertaining', { familyRoomSpots: 85, diningPendant: 90, diningPictureLight: 85, diningFairyLights: 100 }),
      scene('dine', 'Dine', { familyRoomSpots: 20, diningPendant: 75, diningPictureLight: 90, diningFairyLights: 100 }),
      scene('cosy', 'Cosy', { familyRoomSpots: 0, diningPendant: 35, diningPictureLight: 70, diningFairyLights: 100 }),
    ],
    nightLevels: { familyRoomSpots: 3, diningFairyLights: 5 },
  },
  {
    id: 'bootLobby',
    name: 'Boot lobby & cloakroom',
    aliases: ['boot lobby', 'boot room', 'cloakroom', 'back door'],
    circuits: ['bootLobbyPendant', 'wineCellarLeds', 'cloakroomWcLights'],
    scenes: [
      scene('bright', 'Bright', { bootLobbyPendant: 100, wineCellarLeds: 100, cloakroomWcLights: 100 }),
      scene('welcome', 'Welcome', { bootLobbyPendant: 65, wineCellarLeds: 100, cloakroomWcLights: 0 }),
      scene('night', 'Night glow', { bootLobbyPendant: 25, wineCellarLeds: 0, cloakroomWcLights: 0 }),
    ],
    nightLevels: { bootLobbyPendant: 5 },
  },
  {
    id: 'hall',
    name: 'Staircase hall',
    aliases: ['hall', 'staircase', 'stairs', 'stair hall'],
    circuits: ['hallPendant', 'hallStairLeds', 'hallBeamLeds', 'hallLamps5A'],
    scenes: [
      scene('bright', 'Bright', { hallPendant: 100, hallStairLeds: 80, hallBeamLeds: 70, hallLamps5A: 80 }),
      scene('evening', 'Evening', { hallPendant: 60, hallStairLeds: 60, hallBeamLeds: 60, hallLamps5A: 80 }),
      scene('night', 'Night', { hallPendant: 15, hallStairLeds: 30, hallBeamLeds: 20, hallLamps5A: 0 }),
    ],
    nightLevels: { hallStairLeds: 5 },
  },
  {
    id: 'livingRoom',
    name: 'Living room',
    aliases: ['living room', 'front room', 'cinema', 'cinema room', 'lounge'],
    circuits: ['frontRoomPendant', 'livingRoomShelfLeds', 'livingRoomTvBacklight'],
    scenes: [
      scene('bright', 'Bright', { frontRoomPendant: 100, livingRoomShelfLeds: 70, livingRoomTvBacklight: 0 }),
      scene('evening', 'Evening', { frontRoomPendant: 80, livingRoomShelfLeds: 70, livingRoomTvBacklight: 0 }),
      scene('relax', 'Relax', { frontRoomPendant: 55, livingRoomShelfLeds: 50, livingRoomTvBacklight: 20 }),
      scene('movie', 'Movie', { frontRoomPendant: 15, livingRoomShelfLeds: 25, livingRoomTvBacklight: 60 }),
    ],
    nightLevels: { livingRoomShelfLeds: 4 },
  },
  {
    id: 'entranceHall',
    name: 'Entrance hall',
    aliases: ['entrance hall', 'front hall', 'hallway', 'front door'],
    circuits: ['entranceHallPendant', 'entranceHallUplights'],
    scenes: [
      scene('welcome', 'Welcome', { entranceHallPendant: 100, entranceHallUplights: 85 }),
      scene('evening', 'Evening', { entranceHallPendant: 60, entranceHallUplights: 65 }),
      scene('uplights', 'Uplights only', { entranceHallPendant: 0, entranceHallUplights: 45 }),
    ],
    nightLevels: { entranceHallUplights: 5 },
  },
  {
    id: 'sittingRoom',
    name: 'Sitting room',
    aliases: ['sitting room', 'front sitting room', 'fireside'],
    circuits: ['livingRoomPendant', 'sittingRoomLamps5A', 'sittingRoomShelfLeds'],
    scenes: [
      scene('bright', 'Bright', { livingRoomPendant: 100, sittingRoomLamps5A: 80, sittingRoomShelfLeds: 70 }),
      scene('reading', 'Reading', { livingRoomPendant: 55, sittingRoomLamps5A: 100, sittingRoomShelfLeds: 40 }),
      scene('fireside', 'Fireside', { livingRoomPendant: 25, sittingRoomLamps5A: 80, sittingRoomShelfLeds: 60 }),
      scene('cosy', 'Cosy', { livingRoomPendant: 0, sittingRoomLamps5A: 55, sittingRoomShelfLeds: 45 }),
    ],
    nightLevels: { sittingRoomShelfLeds: 4 },
  },
  {
    id: 'study',
    name: 'Plant room',
    aliases: ['plant room', 'study', 'plant'],
    circuits: ['studyPendant'],
    scenes: [
      scene('bright', 'Bright', { studyPendant: 100 }),
      scene('service', 'Service', { studyPendant: 70 }),
      scene('low', 'Low', { studyPendant: 30 }),
    ],
    nightLevels: { studyPendant: 5 },
  },
  {
    id: 'mainBedroom',
    name: 'Main bedroom',
    aliases: ['main bedroom', 'master bedroom', 'bedroom 1', 'our bedroom'],
    circuits: ['mainBedroomPendant'],
    scenes: [
      scene('bright', 'Bright', { mainBedroomPendant: 100 }),
      scene('relax', 'Relax', { mainBedroomPendant: 55 }),
      scene('bedtime', 'Bedtime', { mainBedroomPendant: 20 }),
    ],
    nightLevels: { mainBedroomPendant: 3 },
  },
  {
    id: 'familyBathroom',
    name: 'Family bathroom',
    aliases: ['family bathroom', 'bathroom', 'main bathroom'],
    circuits: ['familyBathroomPendant'],
    scenes: [
      scene('bright', 'Morning', { familyBathroomPendant: 100 }),
      scene('soak', 'Soak', { familyBathroomPendant: 45 }),
      scene('night', 'Night', { familyBathroomPendant: 15 }),
    ],
    nightLevels: { familyBathroomPendant: 5 },
  },
  {
    id: 'upperLanding',
    name: 'Landing',
    aliases: ['landing', 'upstairs landing', 'upper landing', 'top of the stairs'],
    circuits: ['upperLandingPendant', 'upperLandingSconces'],
    scenes: [
      scene('bright', 'Bright', { upperLandingPendant: 100, upperLandingSconces: 80 }),
      scene('evening', 'Evening', { upperLandingPendant: 50, upperLandingSconces: 70 }),
      scene('night', 'Night', { upperLandingPendant: 0, upperLandingSconces: 25 }),
    ],
    nightLevels: { upperLandingSconces: 5 },
  },
  ...(['bedroom2', 'bedroom3', 'bedroom4'] as const).map((id, i): ZoneSpec => {
    const circuit: CircuitId = id === 'bedroom2' ? 'bedroom2Pendant' : id === 'bedroom3' ? 'bedroom3Pendant' : 'bedroom4Pendant';
    const n = i + 2;
    return {
      id,
      name: `Bedroom ${n}`,
      aliases: [`bedroom ${n}`, `bedroom ${['two', 'three', 'four'][i]}`],
      circuits: [circuit],
      scenes: [
        scene('bright', 'Bright', { [circuit]: 100 }),
        scene('evening', 'Evening', { [circuit]: 55 }),
        scene('bedtime', 'Bedtime', { [circuit]: 20 }),
      ],
      nightLevels: { [circuit]: 3 },
    };
  }),
  {
    id: 'courtyard',
    name: 'Courtyard',
    aliases: ['courtyard', 'garden', 'outside', 'exterior', 'pergola'],
    circuits: ['courtyardFestoons', 'reclaimedLampPost', 'pergolaFestoons', 'stableExternalWallLights'],
    scenes: [
      scene('warm', 'Warm welcome', { courtyardFestoons: 85, reclaimedLampPost: 90, pergolaFestoons: 80, stableExternalWallLights: 70 }),
      scene('party', 'Party', { courtyardFestoons: 100, reclaimedLampPost: 100, pergolaFestoons: 100, stableExternalWallLights: 80 }),
      scene('festoons', 'Festoons only', { courtyardFestoons: 95, reclaimedLampPost: 0, pergolaFestoons: 90, stableExternalWallLights: 0 }),
      scene('lampPost', 'Lamp post only', { courtyardFestoons: 0, reclaimedLampPost: 95, pergolaFestoons: 0, stableExternalWallLights: 40 }),
    ],
    nightLevels: { reclaimedLampPost: 5, stableExternalWallLights: 5 },
  },
  {
    id: 'outbuildingGym',
    name: 'Gym',
    aliases: ['gym', 'wellness studio', 'workout room'],
    circuits: ['gymSpotsAndBattens', 'gymWallAndCoveLights', 'gymMirrorBacklights', 'gymCoveLeds', 'gymTrussSpots'],
    scenes: [
      scene('workout', 'Workout', { gymSpotsAndBattens: 100, gymWallAndCoveLights: 80, gymMirrorBacklights: 80, gymCoveLeds: 70, gymTrussSpots: 100 }),
      scene('yoga', 'Yoga', { gymSpotsAndBattens: 30, gymWallAndCoveLights: 80, gymMirrorBacklights: 50, gymCoveLeds: 80, gymTrussSpots: 0 }),
      scene('recovery', 'Recovery', { gymSpotsAndBattens: 0, gymWallAndCoveLights: 45, gymMirrorBacklights: 30, gymCoveLeds: 60, gymTrussSpots: 0 }),
    ],
    nightLevels: { gymCoveLeds: 4 },
  },
  {
    id: 'outbuildingGarage',
    name: 'Garage',
    aliases: ['garage', 'workshop', 'car port'],
    circuits: ['garageHighBayLights', 'garageBenchAndShower', 'garageShowerLights', 'garageTrussSpots'],
    scenes: [
      scene('workshop', 'Workshop', { garageHighBayLights: 100, garageBenchAndShower: 100, garageShowerLights: 80, garageTrussSpots: 100 }),
      scene('bays', 'Bays only', { garageHighBayLights: 100, garageTrussSpots: 60 }),
      scene('bench', 'Bench', { garageBenchAndShower: 100, garageTrussSpots: 40 }),
      scene('security', 'Security', { garageBenchAndShower: 25 }),
    ],
    nightLevels: { garageBenchAndShower: 5 },
  },
  {
    id: 'outbuildingStore',
    name: 'Store',
    aliases: ['store', 'garden store', 'barn corridor'],
    circuits: ['storeLoftLeds'],
    scenes: [
      scene('bright', 'Bright', { storeLoftLeds: 100 }),
      scene('low', 'Low', { storeLoftLeds: 40 }),
    ],
    nightLevels: { storeLoftLeds: 5 },
  },
  {
    id: 'outbuildingBarn',
    name: 'Barn',
    aliases: ['barn', 'golf room', 'games room', 'pool room', 'bar', 'rest of the barn'],
    circuits: ['barnTrussAndSimHalo', 'golfSimHalo', 'barnCoveLeds', 'barnWallSconces', 'barnStairLeds', 'barnPoolTableLight', 'barnPictureLights', 'barnBarsAndLamps5A'],
    scenes: [
      scene('bright', 'Bright', { barnTrussAndSimHalo: 100, golfSimHalo: 80, barnCoveLeds: 80, barnWallSconces: 80, barnStairLeds: 70, barnPoolTableLight: 90, barnPictureLights: 80, barnBarsAndLamps5A: 80 }),
      scene('golf', 'Golf', { barnTrussAndSimHalo: 30, golfSimHalo: 100, barnCoveLeds: 40, barnWallSconces: 40, barnStairLeds: 40, barnPoolTableLight: 30, barnPictureLights: 40, barnBarsAndLamps5A: 50 }),
      scene('social', 'Social', { barnTrussAndSimHalo: 45, golfSimHalo: 30, barnCoveLeds: 85, barnWallSconces: 80, barnStairLeds: 60, barnPoolTableLight: 90, barnPictureLights: 80, barnBarsAndLamps5A: 95 }),
      scene('lounge', 'Pool & lounge', { barnTrussAndSimHalo: 20, barnCoveLeds: 70, barnWallSconces: 70, barnStairLeds: 50, barnPoolTableLight: 80, barnPictureLights: 70, barnBarsAndLamps5A: 80 }),
      scene('movie', 'Movie', { golfSimHalo: 15, barnCoveLeds: 30, barnWallSconces: 20, barnStairLeds: 30, barnPictureLights: 20, barnBarsAndLamps5A: 20 }),
    ],
    nightLevels: { barnStairLeds: 5, barnCoveLeds: 4 },
  },
  {
    id: 'outbuildingMezzanine',
    name: 'Mezzanine lounge',
    aliases: ['mezzanine', 'mezz', 'retro lounge', 'gaming room'],
    circuits: ['mezzanineDownlights', 'mezzanineSconcesAndAmbient', 'mezzanineLamps5A', 'mezzanineBookcaseLight'],
    scenes: [
      scene('bright', 'Bright', { mezzanineDownlights: 100, mezzanineSconcesAndAmbient: 80, mezzanineLamps5A: 90, mezzanineBookcaseLight: 80 }),
      scene('reading', 'Reading', { mezzanineDownlights: 60, mezzanineSconcesAndAmbient: 90, mezzanineLamps5A: 100, mezzanineBookcaseLight: 100 }),
      scene('game', 'Game', { mezzanineSconcesAndAmbient: 40, mezzanineLamps5A: 85, mezzanineBookcaseLight: 30 }),
      scene('movie', 'Movie', { mezzanineSconcesAndAmbient: 15, mezzanineLamps5A: 40 }),
      scene('lamps', 'Lamps only', { mezzanineLamps5A: 65 }),
    ],
    nightLevels: { mezzanineLamps5A: 4 },
  },
  {
    id: 'outbuildingStableOffice',
    name: 'Office',
    aliases: ['office', 'stable office', 'home office'],
    circuits: ['stableOfficeSpotlights', 'stableOfficeWallsAndLamps5A', 'stableCloakroomLights', 'stableOfficeLamps5A'],
    scenes: [
      scene('bright', 'Bright', { stableOfficeSpotlights: 100, stableOfficeWallsAndLamps5A: 85, stableCloakroomLights: 80, stableOfficeLamps5A: 80 }),
      scene('work', 'Work', { stableOfficeSpotlights: 75, stableOfficeWallsAndLamps5A: 60, stableOfficeLamps5A: 90 }),
      scene('focus', 'Focus', { stableOfficeSpotlights: 40, stableOfficeWallsAndLamps5A: 90, stableOfficeLamps5A: 100 }),
      scene('evening', 'Evening', { stableOfficeWallsAndLamps5A: 65, stableOfficeLamps5A: 70 }),
    ],
    nightLevels: { stableOfficeWallsAndLamps5A: 4 },
  },
  {
    id: 'outbuildingStableSuite',
    name: 'Guest suite',
    aliases: ['guest suite', 'stable suite', 'guest bedroom', 'stable bedroom'],
    circuits: ['stableSuiteDownlights', 'stableSuiteLamps5A', 'stableEnsuiteLights', 'stableBalconyLights'],
    scenes: [
      scene('bright', 'Bright', { stableSuiteDownlights: 95, stableSuiteLamps5A: 85, stableEnsuiteLights: 90, stableBalconyLights: 0 }),
      scene('relax', 'Relax & balcony', { stableSuiteDownlights: 40, stableSuiteLamps5A: 90, stableEnsuiteLights: 40, stableBalconyLights: 70 }),
      scene('bedtime', 'Bedtime', { stableSuiteDownlights: 0, stableSuiteLamps5A: 45, stableEnsuiteLights: 15, stableBalconyLights: 0 }),
    ],
    nightLevels: { stableEnsuiteLights: 5 },
  },
];

/** Every lighting zone of the Crox Farmhouse with GA-plan central objects. */
export const CROX_LIGHTING_ZONES: readonly KnxLightingZone[] = ZONE_SPECS.map((spec) => ({
  ...spec,
  ga: zoneGroupAddresses(spec.id),
}));

/** Zone scenes keyed by zone (room panel / HUD view of `CROX_LIGHTING_ZONES`). */
export const CROX_ZONE_SCENES: Readonly<Partial<Record<RoomZoneId, readonly ZoneScenePreset[]>>> =
  Object.fromEntries(CROX_LIGHTING_ZONES.map((z) => [z.id, z.scenes]));
