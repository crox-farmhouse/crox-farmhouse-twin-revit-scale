import type { RoomZoneDefinition, RoomZoneId } from '../../../core/types/topology.ts';
import type {
  KnxCoverageVolume,
  KnxPresenceDetectorDevice,
  KnxPresenceLegacyBinding,
  KnxPushButtonDevice,
  KnxPushButtonGang,
} from '../../../integrations/knx/project.ts';
import {
  EAST_WING_LOCAL_ZONE_IDS,
  eastWingRectToWorldPolygon,
  eastWingToWorldXZ,
  outbuildingRectToWorldPolygon,
  outbuildingToWorldXZ,
} from './east-wing-frame.ts';
import { presenceGa, ZONE_GA_SLOTS } from './ga-plan.ts';
import { AUTHORED_ROOM_ZONES } from './rooms.ts';

/** Push-button long-press threshold (ETS "time between short and long operation"). */
export const CROX_LONG_PRESS_MS = 600;
/** Presence detector hold time (s) — night mode switches off after this long without movement. */
export const CROX_PRESENCE_HOLD_TIME_SEC = 60;
/** Hold time used by the interactive demo (`?knxDemo` / `setPresenceHoldTimeOverride`). */
export const CROX_DEMO_PRESENCE_HOLD_TIME_SEC = 12;

function gangs(...entries: readonly (readonly [RoomZoneId, string])[]): KnxPushButtonGang[] {
  return entries.map(([zoneId, label], i) => ({ gang: i + 1, zoneId, label }));
}

function button(
  pa: string,
  name: string,
  mountedInZoneId: RoomZoneId,
  location: string,
  g: KnxPushButtonGang[]
): KnxPushButtonDevice {
  return { pa, name, mountedInZoneId, location, gangs: g, params: { longPressMs: CROX_LONG_PRESS_MS } };
}

/**
 * Every Corston toggle (KNX push-button interface behind a brass dolly plate). Each plate is
 * its own bus device; multi-gang plates send to several zones. Meshes carry `switchPa` +
 * `switchGang` + `zoneSceneSwitchZoneId` matching these rows (verified by tools/knx).
 */
export const CROX_PUSH_BUTTONS: readonly KnxPushButtonDevice[] = [
  // ---- Main house ground floor (line 1.1) ----
  button('1.1.10', 'Kitchen entrance 2-gang', 'kitchen', 'Kitchen — hall door (west)', gangs(['kitchen', 'Kitchen'], ['sitting', 'Sitting area'])),
  button('1.1.30', 'Kitchen AGA wall', 'kitchen', 'Kitchen — left of AGA (north wall)', gangs(['kitchen', 'Kitchen'])),
  button('1.1.14', 'Bifold pier 2-gang', 'kitchen', 'Kitchen — south bifold pier', gangs(['kitchen', 'Kitchen'], ['courtyard', 'Courtyard'])),
  button('1.1.31', 'Sitting area east wall', 'sitting', 'Sitting area — east wall', gangs(['sitting', 'Sitting area'])),
  button('1.1.11', 'Utility door (kitchen side)', 'kitchen', 'Utility doorway — kitchen side', gangs(['utility', 'Utility'])),
  button('1.1.32', 'Utility door (utility side)', 'utility', 'Utility doorway — utility side', gangs(['utility', 'Utility'])),
  button('1.1.15', 'Dining room entrance', 'familyRoom', 'Dining room — doorway', gangs(['familyRoom', 'Dining room'])),
  button('1.1.33', 'Dining room second entrance', 'familyRoom', 'Dining room — second doorway', gangs(['familyRoom', 'Dining room'])),
  button('1.1.16', 'Boot lobby', 'bootLobby', 'Boot lobby — inside back door', gangs(['bootLobby', 'Boot lobby'])),
  button('1.1.17', 'Stair foot 2-gang', 'hall', 'Staircase hall — east wall by boot-lobby door (stair foot)', gangs(['hall', 'Hall'], ['upperLanding', 'Landing'])),
  button('1.1.18', 'Living room', 'livingRoom', 'Living room — east wall by hallway door', gangs(['livingRoom', 'Living room'])),
  button('1.1.19', 'Entrance hall', 'entranceHall', 'Front entrance hall — south wall by front door', gangs(['entranceHall', 'Entrance hall'])),
  button('1.1.21', 'Sitting room', 'sittingRoom', 'Sitting room — north wall by hallway door', gangs(['sittingRoom', 'Sitting room'])),
  button('1.1.23', 'Plant room', 'study', 'Plant Room — partition wall', gangs(['study', 'Plant room'])),
  // ---- Main house first floor (line 1.2) ----
  button('1.2.10', 'Main bedroom', 'mainBedroom', 'Main bedroom — doorway', gangs(['mainBedroom', 'Main bedroom'])),
  button('1.2.11', 'Family bathroom', 'familyBathroom', 'Family bathroom — doorway', gangs(['familyBathroom', 'Bathroom'])),
  button('1.2.12', 'Stair head 2-gang', 'upperLanding', 'Landing — top of stairs', gangs(['upperLanding', 'Landing'], ['hall', 'Hall'])),
  button('1.2.13', 'Bedroom 2', 'bedroom2', 'Bedroom 2 — doorway', gangs(['bedroom2', 'Bedroom 2'])),
  button('1.2.14', 'Bedroom 3', 'bedroom3', 'Bedroom 3 — doorway', gangs(['bedroom3', 'Bedroom 3'])),
  button('1.2.15', 'Bedroom 4', 'bedroom4', 'Bedroom 4 — doorway', gangs(['bedroom4', 'Bedroom 4'])),
  // ---- Outbuildings (line 2.1) ----
  button('2.1.40', 'Gym courtyard entry (west)', 'outbuildingGym', 'Gym — courtyard screen west pier', gangs(['outbuildingGym', 'Gym'])),
  button('2.1.41', 'Gym courtyard entry (east)', 'outbuildingGym', 'Gym — courtyard screen east pier', gangs(['outbuildingGym', 'Gym'])),
  button('2.1.42', 'Gym to garage doors', 'outbuildingGym', 'Gym — east partition by garage glass doors', gangs(['outbuildingGym', 'Gym'], ['outbuildingGarage', 'Garage'])),
  button('2.1.43', 'Gym shower door', 'outbuildingGym', 'Gym — by shower-room door', gangs(['outbuildingGym', 'Gym'])),
  button('2.1.44', 'Garage west bay', 'outbuildingGarage', 'Garage — west bay pier', gangs(['outbuildingGarage', 'Garage'])),
  button('2.1.45', 'Garage central pier', 'outbuildingGarage', 'Garage — central pier between doors', gangs(['outbuildingGarage', 'Garage'])),
  button('2.1.46', 'Garage east bay', 'outbuildingGarage', 'Garage — east bay pier', gangs(['outbuildingGarage', 'Garage'])),
  button('2.1.47', 'Garage to gym doors', 'outbuildingGarage', 'Garage — west wall by gym glass doors', gangs(['outbuildingGarage', 'Garage'], ['outbuildingGym', 'Gym'])),
  button('2.1.48', 'Shower room entry', 'outbuildingGarage', 'Garage shower room — entry pier', gangs(['outbuildingGarage', 'Garage'])),
  button('2.1.49', 'Store courtyard door', 'outbuildingStore', 'Store — courtyard door latch jamb', gangs(['outbuildingStore', 'Store'])),
  button('2.1.50', 'Store to barn portal 2-gang', 'outbuildingStore', 'Store corridor — east end by barn portal', gangs(['outbuildingStore', 'Store'], ['outbuildingBarn', 'Barn'])),
  button('2.1.51', 'Barn west entry 2-gang', 'outbuildingBarn', 'Barn — west portal from store corridor', gangs(['outbuildingBarn', 'Barn'], ['outbuildingMezzanine', 'Mezzanine'])),
  button('2.1.52', 'Barn courtyard door 2-gang', 'outbuildingBarn', 'Barn — north courtyard door', gangs(['outbuildingBarn', 'Barn'], ['outbuildingMezzanine', 'Mezzanine'])),
  button('2.1.53', 'Golf sim console', 'outbuildingBarn', 'Barn — golf sim & viewing bar steps', gangs(['outbuildingBarn', 'Barn'])),
  button('2.1.54', 'Sunken lounge steps', 'outbuildingBarn', 'Barn — sunken pool lounge steps (north)', gangs(['outbuildingBarn', 'Barn'])),
  button('2.1.55', 'Spiral stair foot 2-gang', 'outbuildingBarn', 'Barn — spiral stair base', gangs(['outbuildingBarn', 'Barn'], ['outbuildingMezzanine', 'Mezzanine'])),
  button('2.1.56', 'Barn to office door', 'outbuildingBarn', 'Barn — by glass door to office', gangs(['outbuildingBarn', 'Barn'], ['outbuildingStableOffice', 'Office'])),
  button('2.1.57', 'Mezzanine stair head 2-gang', 'outbuildingMezzanine', 'Mezzanine — stair landing & suite steps', gangs(['outbuildingMezzanine', 'Mezzanine'], ['outbuildingBarn', 'Barn'])),
  button('2.1.58', 'Mezzanine sofa wall 2-gang', 'outbuildingMezzanine', 'Mezzanine — south wall by sofa', gangs(['outbuildingMezzanine', 'Mezzanine'], ['outbuildingBarn', 'Barn'])),
  button('2.1.59', 'Office west door', 'outbuildingStableOffice', 'Office — west door from barn', gangs(['outbuildingStableOffice', 'Office'], ['outbuildingBarn', 'Barn'])),
  button('2.1.60', 'Office courtyard door', 'outbuildingStableOffice', 'Office — north courtyard door', gangs(['outbuildingStableOffice', 'Office'])),
  button('2.1.61', 'Office cloakroom door', 'outbuildingStableOffice', 'Office — by cloakroom WC door', gangs(['outbuildingStableOffice', 'Office'])),
  button('2.1.62', 'Office patio doors 2-gang', 'outbuildingStableOffice', 'Office — east patio doors', gangs(['outbuildingStableOffice', 'Office'], ['courtyard', 'Garden'])),
  button('2.1.63', 'Guest suite entry', 'outbuildingStableSuite', 'Guest suite — entry portal from mezzanine', gangs(['outbuildingStableSuite', 'Guest suite'])),
  button('2.1.64', 'Ensuite door', 'outbuildingStableSuite', 'Guest suite — ensuite door', gangs(['outbuildingStableSuite', 'Guest suite'])),
  button('2.1.65', 'Bedside west', 'outbuildingStableSuite', 'Guest suite — bedside (west)', gangs(['outbuildingStableSuite', 'Guest suite'])),
  button('2.1.66', 'Bedside east', 'outbuildingStableSuite', 'Guest suite — bedside (east)', gangs(['outbuildingStableSuite', 'Guest suite'])),
  button('2.1.67', 'Balcony doors', 'outbuildingStableSuite', 'Guest suite — balcony doors', gangs(['outbuildingStableSuite', 'Guest suite'])),
];

// ---------------------------------------------------------------------------------------
// Presence detectors
// ---------------------------------------------------------------------------------------

type Poly = readonly (readonly [number, number])[];

function roomPolygon(zoneId: RoomZoneId, inset = 0.05): Poly {
  const z: RoomZoneDefinition | undefined = AUTHORED_ROOM_ZONES[zoneId];
  if (!z) throw new Error(`Unknown room ${zoneId}`);
  const b = z.bounds;
  if (EAST_WING_LOCAL_ZONE_IDS.includes(zoneId)) {
    return eastWingRectToWorldPolygon(b.minX + inset, b.maxX - inset, b.minZ + inset, b.maxZ - inset);
  }
  return [
    [b.minX + inset, b.minZ + inset],
    [b.maxX - inset, b.minZ + inset],
    [b.maxX - inset, b.maxZ - inset],
    [b.minX + inset, b.maxZ - inset],
  ];
}

function centroid(poly: Poly): [number, number] {
  let x = 0;
  let z = 0;
  for (const [px, pz] of poly) {
    x += px;
    z += pz;
  }
  return [x / poly.length, z / poly.length];
}

const GROUND_FEET: readonly [number, number] = [-1.1, 1.6];
const FIRST_FEET: readonly [number, number] = [1.8, 4.6];

interface DetectorSpec {
  readonly pa: string;
  readonly name: string;
  readonly zoneId: RoomZoneId;
  readonly polygon: Poly;
  readonly feet: readonly [number, number];
  /** Ceiling (or wall) mount point; defaults to the polygon centroid at `mountY`. */
  readonly mount: readonly [number, number, number];
  readonly gaOrdinal: number;
  readonly legacy?: KnxPresenceLegacyBinding;
  readonly holdTimeSec?: number;
}

function detector(spec: DetectorSpec): KnxPresenceDetectorDevice {
  const main = ZONE_GA_SLOTS[spec.zoneId]?.[0] ?? 1;
  const coverage: KnxCoverageVolume = { polygon: spec.polygon, minY: spec.feet[0], maxY: spec.feet[1] };
  return {
    pa: spec.pa,
    name: spec.name,
    zoneId: spec.zoneId,
    gaPresence: spec.legacy?.kind === 'kitchen'
      ? '1/4/1'
      : spec.legacy?.kind === 'utility'
        ? '1/4/3'
        : spec.legacy?.kind === 'room'
          ? spec.legacy.sensorId === 'wineCellar' ? '1/4/5' : '1/4/6'
          : presenceGa(main, spec.gaOrdinal),
    position: { x: spec.mount[0], y: spec.mount[1], z: spec.mount[2] },
    coverage,
    params: { holdTimeSec: spec.holdTimeSec ?? CROX_PRESENCE_HOLD_TIME_SEC, luxThreshold: 100 },
    ...(spec.legacy ? { legacy: spec.legacy } : {}),
  };
}

/** Ceiling PIR in the middle of a room (mount height = authored ceiling). */
function roomPir(
  pa: string,
  name: string,
  zoneId: RoomZoneId,
  feet: readonly [number, number],
  mountY: number,
  gaOrdinal: number,
  offset: readonly [number, number] = [0, 0]
): KnxPresenceDetectorDevice {
  const polygon = roomPolygon(zoneId);
  const [cx, cz] = centroid(polygon);
  return detector({ pa, name, zoneId, polygon, feet, mount: [cx + offset[0], mountY, cz + offset[1]], gaOrdinal });
}

function ewMount(x: number, y: number, z: number): [number, number, number] {
  const [wx, wz] = eastWingToWorldXZ(x, z);
  return [wx, y, wz];
}

function obPir(
  pa: string,
  name: string,
  zoneId: RoomZoneId,
  rect: readonly [number, number, number, number],
  feet: readonly [number, number],
  mountY: number,
  gaOrdinal: number,
  /** Builder-frame (u, v) mount point when the rectangle centre sits under an obstruction. */
  mountUv?: readonly [number, number]
): KnxPresenceDetectorDevice {
  const polygon = outbuildingRectToWorldPolygon(rect[0], rect[1], rect[2], rect[3]);
  const [mu, mv] = mountUv ?? [(rect[0] + rect[1]) / 2, (rect[2] + rect[3]) / 2];
  const [mx, mz] = outbuildingToWorldXZ(mu, mv);
  return detector({ pa, name, zoneId, polygon, feet, mount: [mx, mountY, mz], gaOrdinal });
}

const kitchenPoly = roomPolygon('kitchen');
const utilityPoly = roomPolygon('utility');

/** Every presence detector, one or more per lighting zone. */
export const CROX_PRESENCE_DETECTORS: readonly KnxPresenceDetectorDevice[] = [
  // ---- Ground floor (legacy devices keep their PAs / GAs) ----
  detector({ pa: '1.1.12', name: 'Kitchen PIR & lux', zoneId: 'kitchen', polygon: kitchenPoly, feet: GROUND_FEET, mount: ewMount(0.67, 2.98, 0.65), gaOrdinal: 0, legacy: { kind: 'kitchen' } }),
  detector({ pa: '1.1.13', name: 'Utility PIR', zoneId: 'utility', polygon: utilityPoly, feet: GROUND_FEET, mount: ewMount(3.5, 2.98, -1.45), gaOrdinal: 0, legacy: { kind: 'utility' } }),
  detector({ pa: '1.1.25', name: 'Wine cellar PIR', zoneId: 'bootLobby', polygon: eastWingRectToWorldPolygon(-11.2, -9.6, -2.0, -0.5), feet: GROUND_FEET, mount: ewMount(-10.45, 2.24, -1.25), gaOrdinal: 0, legacy: { kind: 'room', sensorId: 'wineCellar' }, holdTimeSec: 30 }),
  detector({ pa: '1.1.26', name: 'Cloakroom WC PIR', zoneId: 'bootLobby', polygon: eastWingRectToWorldPolygon(-12.95, -11.3, -2.0, -0.6), feet: GROUND_FEET, mount: ewMount(-12.14, 2.24, -1.35), gaOrdinal: 0, legacy: { kind: 'room', sensorId: 'cloakroomWc' }, holdTimeSec: 30 }),
  detector({ pa: '1.1.24', name: 'Plant room PIR (wall)', zoneId: 'study', polygon: roomPolygon('study'), feet: [-1.1, 1.4], mount: [-17.5, 1.27, 9.92], gaOrdinal: 10 }),
  roomPir('1.1.61', 'Sitting area PIR', 'sitting', GROUND_FEET, 3.0, 2),
  roomPir('1.1.62', 'Dining room PIR', 'familyRoom', GROUND_FEET, 2.03, 4, [0.6, 0.6]),
  roomPir('1.1.63', 'Boot lobby PIR', 'bootLobby', GROUND_FEET, 2.044, 5, [0, 1.2]),
  roomPir('1.1.64', 'Staircase hall PIR', 'hall', GROUND_FEET, 2.037, 6, [0.8, 0.8]),
  roomPir('1.1.65', 'Living room PIR', 'livingRoom', [-1.1, 1.4], 1.601, 7, [0.7, 0.7]),
  roomPir('1.1.66', 'Entrance hall PIR', 'entranceHall', [-1.1, 1.4], 1.599, 8, [1.2, 0]),
  roomPir('1.1.67', 'Sitting room PIR', 'sittingRoom', [-1.1, 1.4], 1.601, 9, [0.7, 0.7]),
  // ---- First floor ----
  roomPir('1.2.60', 'Main bedroom PIR', 'mainBedroom', FIRST_FEET, 4.677, 1, [0, 1.2]),
  roomPir('1.2.61', 'Family bathroom PIR', 'familyBathroom', FIRST_FEET, 4.52, 2, [0, 0.2]),
  roomPir('1.2.62', 'Landing PIR', 'upperLanding', FIRST_FEET, 4.52, 3, [0, -2.0]),
  roomPir('1.2.63', 'Bedroom 2 PIR', 'bedroom2', FIRST_FEET, 5.02, 4, [0.6, 0.6]),
  roomPir('1.2.64', 'Bedroom 3 PIR', 'bedroom3', FIRST_FEET, 5.02, 5, [0.6, 0.6]),
  roomPir('1.2.65', 'Bedroom 4 PIR', 'bedroom4', FIRST_FEET, 5.02, 6, [0.6, 0.6]),
  // ---- Courtyard (wall-mounted external PIR on the bifold pier) ----
  detector({
    pa: '1.1.68',
    name: 'Courtyard external PIR',
    zoneId: 'courtyard',
    polygon: [[-16.95, 2.9], [6.2, 6.0], [6.2, 13.4], [-16.25, 15.4], [-22.3, 15.85], [-22.3, 11.75], [-16.95, 11.75]],
    feet: [-1.0, 1.5],
    mount: ewMount(1.25, 2.6, 2.75),
    gaOrdinal: 1,
  }),
  // ---- Outbuildings (u/v builder frame rectangles; floors: gym -0.59, garage -0.5, store -0.34,
  //      barn -0.68/-0.34, mezzanine 1.54, office -0.44, suite 2.08) ----
  obPir('2.1.80', 'Gym PIR', 'outbuildingGym', [0.3, 5.75, 0.3, 5.4], [-1.0, 1.2], 3.044, 1),
  obPir('2.1.81', 'Garage PIR', 'outbuildingGarage', [6.0, 12.05, 0.3, 5.4], [-1.0, 1.2], 3.044, 2),
  obPir('2.1.82', 'Store PIR', 'outbuildingStore', [12.1, 15.2, 0.3, 5.4], [-0.8, 1.2], 3.297, 3, [14.2, 1.0]),
  obPir('2.1.83', 'Barn PIR (golf & bar)', 'outbuildingBarn', [15.2, 23.0, 0.3, 5.4], [-1.1, 1.1], 1.395, 4),
  obPir('2.1.84', 'Mezzanine PIR', 'outbuildingMezzanine', [18.8, 23.0, 0.3, 5.4], [1.2, 3.6], 4.109, 5),
  obPir('2.1.85', 'Office PIR', 'outbuildingStableOffice', [23.25, 31.55, 0.3, 5.4], [-0.9, 1.5], 1.96, 6),
  obPir('2.1.86', 'Guest suite PIR', 'outbuildingStableSuite', [23.4, 28.75, 0.3, 5.4], [1.7, 4.2], 4.666, 7),
];
