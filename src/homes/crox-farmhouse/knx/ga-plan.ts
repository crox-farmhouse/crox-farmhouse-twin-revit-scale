import type { RoomZoneId } from '../../../core/types/topology.ts';
import type { KnxZoneGroupAddresses } from '../../../integrations/knx/project.ts';

/**
 * Crox Farmhouse group-address plan (3-level, ETS style).
 *
 * Main groups (building / floor):
 *   0 Central (whole-site objects)  1 House ground floor  2 House first floor
 *   3 Outbuildings (gym, garage, store, barn, mezzanine, stable)  4 HVAC  5 Exterior
 * Middle groups (function, identical under every main group):
 *   0 central objects · 1 channel switch (1.001) · 2 channel brightness (5.001)
 *   3 channel brightness status (5.001) · 4 sensors (presence 1.018, lux 9.004, media)
 *   5 gates & media · 6 zone control · 7 zone feedback
 * 3-level addressing only allows middle groups 0–7, so each zone owns a block of sub groups:
 *   middle 6, sub 4·n+0 scene (17.001/18.001) · 4·n+1 night object (1.001)
 *             · 4·n+2 full-on (1.001) · 4·n+3 relative dimming (3.007)
 *   middle 7, sub 2·n+0 scene status (17.001) · 2·n+1 zone on/off status (1.001)
 * where n is the zone ordinal within its main group (1-based).
 * Sub group for middle 1–3: actuator channel number.
 */
export const GA_MAIN_NAMES: Readonly<Record<number, string>> = {
  0: 'Central',
  1: 'House ground floor',
  2: 'House first floor',
  3: 'Outbuildings',
  4: 'HVAC',
  5: 'Exterior',
};

export const GA_MIDDLE_NAMES: Readonly<Record<number, string>> = {
  0: 'Central objects',
  1: 'Switching',
  2: 'Brightness value',
  3: 'Brightness status',
  4: 'Sensors',
  5: 'Gates & media',
  6: 'Zone control (scene / night / full / dim)',
  7: 'Zone feedback (scene status / on-off status)',
};

/** Zone → [main group, zone ordinal] in GA-plan order. */
export const ZONE_GA_SLOTS: Readonly<Partial<Record<RoomZoneId, readonly [number, number]>>> = {
  kitchen: [1, 1],
  sitting: [1, 2],
  utility: [1, 3],
  familyRoom: [1, 4],
  bootLobby: [1, 5],
  hall: [1, 6],
  livingRoom: [1, 7],
  entranceHall: [1, 8],
  sittingRoom: [1, 9],
  study: [1, 10],
  mainBedroom: [2, 1],
  familyBathroom: [2, 2],
  upperLanding: [2, 3],
  bedroom2: [2, 4],
  bedroom3: [2, 5],
  bedroom4: [2, 6],
  outbuildingGym: [3, 1],
  outbuildingGarage: [3, 2],
  outbuildingStore: [3, 3],
  outbuildingBarn: [3, 4],
  outbuildingMezzanine: [3, 5],
  outbuildingStableOffice: [3, 6],
  outbuildingStableSuite: [3, 7],
  courtyard: [5, 1],
};

export function zoneGroupAddresses(zoneId: RoomZoneId): KnxZoneGroupAddresses {
  const slot = ZONE_GA_SLOTS[zoneId];
  if (!slot) {
    throw new Error(`No GA slot for zone ${zoneId}`);
  }
  const [main, n] = slot;
  return {
    scene: `${main}/6/${4 * n}`,
    night: `${main}/6/${4 * n + 1}`,
    full: `${main}/6/${4 * n + 2}`,
    dim: `${main}/6/${4 * n + 3}`,
    sceneStatus: `${main}/7/${2 * n}`,
    status: `${main}/7/${2 * n + 1}`,
  };
}

/** Presence output GA of the n-th detector on a main group (`main/4/(20+n)`). */
export function presenceGa(main: number, ordinal: number): string {
  return `${main}/4/${20 + ordinal}`;
}
