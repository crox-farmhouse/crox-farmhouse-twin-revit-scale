import type { ScenePreset } from '../../../core/types/knx.ts';

/**
 * Legacy 8-slot scene table stored in the ground-floor actuator (1.1.20) for the open-plan
 * kitchen: S1–S3 are also the kitchen zone's Cook / Dine / Relax scenes; S4–S8 are recalled
 * by the AI assistant and the UI.
 */

export const CROX_CENTRAL_SCENES: readonly ScenePreset[] = [
  // === 3 Toggle Switch Scenes (cycled by the 4x Corston 2-Way Switches 1.1.10) ===
  {
    index: 0,
    number: 1,
    code: 'SCENE 1',
    name: 'Cooking',
    shortLabel: 'S1 Cooking',
    isSwitchScene: true,
    levels: {
      islandPendants: 88,
      sittingPendants: 40,
      bifoldUplights: 60,
      spotlights: 95,
      underCabinet: 100,
      aboveCabinet: 80,
    },
  },
  {
    index: 1,
    number: 2,
    code: 'SCENE 2',
    name: 'Dining',
    shortLabel: 'S2 Dining',
    isSwitchScene: true,
    levels: {
      islandPendants: 95,
      sittingPendants: 15,
      bifoldUplights: 0,
      spotlights: 5,
      underCabinet: 35,
      aboveCabinet: 35,
    },
    outdoorLevels: {
      courtyardFestoons: 40,
      reclaimedLampPost: 60,
    },
    auxiliaryLevels: {
      utilitySpotlights: 15,
      familyRoomSpots: 0,
    },
  },
  {
    index: 2,
    number: 3,
    code: 'SCENE 3',
    name: 'Lounge',
    shortLabel: 'S3 Lounge',
    isSwitchScene: true,
    levels: {
      islandPendants: 28,
      sittingPendants: 95,
      bifoldUplights: 100,
      spotlights: 0,
      underCabinet: 40,
      aboveCabinet: 65,
    },
  },
  // === Extended Scenes (available to AI Voice/Text Assistant 1.1.2 & UI) ===
  {
    index: 3,
    number: 4,
    code: 'SCENE 4',
    name: 'Morning Coffee',
    shortLabel: 'S4 Coffee',
    isSwitchScene: false,
    levels: {
      islandPendants: 65,
      sittingPendants: 35,
      bifoldUplights: 40,
      spotlights: 25,
      underCabinet: 85,
      aboveCabinet: 70,
    },
    outdoorLevels: {
      courtyardFestoons: 0,
      reclaimedLampPost: 0,
    },
  },
  {
    index: 4,
    number: 5,
    code: 'SCENE 5',
    name: 'Cocktail Party',
    shortLabel: 'S5 Party',
    isSwitchScene: false,
    levels: {
      islandPendants: 80,
      sittingPendants: 90,
      bifoldUplights: 100,
      spotlights: 15,
      underCabinet: 70,
      aboveCabinet: 90,
    },
    outdoorLevels: {
      courtyardFestoons: 95,
      reclaimedLampPost: 90,
    },
  },
  {
    index: 5,
    number: 6,
    code: 'SCENE 6',
    name: 'Wine & Intimate',
    shortLabel: 'S6 Wine',
    isSwitchScene: false,
    levels: {
      islandPendants: 18,
      sittingPendants: 45,
      bifoldUplights: 65,
      spotlights: 0,
      underCabinet: 22,
      aboveCabinet: 40,
    },
    outdoorLevels: {
      courtyardFestoons: 55,
      reclaimedLampPost: 75,
    },
  },
  {
    index: 6,
    number: 7,
    code: 'SCENE 7',
    name: 'Courtyard Glow',
    shortLabel: 'S7 Courtyard',
    isSwitchScene: false,
    levels: {
      islandPendants: 0,
      sittingPendants: 25,
      bifoldUplights: 100,
      spotlights: 0,
      underCabinet: 30,
      aboveCabinet: 45,
    },
    outdoorLevels: {
      courtyardFestoons: 100,
      reclaimedLampPost: 100,
    },
  },
  {
    index: 7,
    number: 8,
    code: 'SCENE 8',
    name: 'Baking & Detail',
    shortLabel: 'S8 Baking',
    isSwitchScene: false,
    levels: {
      islandPendants: 100,
      sittingPendants: 70,
      bifoldUplights: 75,
      spotlights: 100,
      underCabinet: 100,
      aboveCabinet: 100,
    },
  },
];
