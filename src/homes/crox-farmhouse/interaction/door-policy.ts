import {
  symmetricConflicts,
  type DoorPolicy,
} from '../../../engine/interaction/handlers/door-policy.ts';

const UTILITY_STABLE_DOOR_LOWER = 'door:utility.stableDoor.lowerLeafGroup';
const UTILITY_STABLE_DOOR_UPPER = 'door:utility.stableDoor.upperLeafGroup';
const KITCHEN = 'door:kitchen.cabinetry';

/**
 * Crox Farmhouse door behaviour, keyed by stable door ids. Supplied to the interaction registry
 * through `PropertySceneProfile.doorPolicy`. Converted 1:1 from the legacy build-order table
 * (`door-N` numbers noted for reference only — they are not used).
 */
export const CROX_DOOR_POLICY: DoorPolicy = {
  conflicts: symmetricConflicts([
    // Utility stable door (door-1) vs right Miele washer porthole (door-11)
    [UTILITY_STABLE_DOOR_LOWER, ['door:utility.mieleWasherRight.portholeDoor']],
    // Kitchen oak door (door-3) vs utility tall cupboard right doors (door-6/7)
    [
      'door:kitchen.oakDoor.leafGroup',
      ['door:utility.tallCupboard.upperRightDoor', 'door:utility.tallCupboard.lowerRightDoor'],
    ],
    // Freezer door (door-55) vs Neff oven tower doors (door-57..60)
    [
      `${KITCHEN}.west.fridgeFreezerTower.freezerDoor`,
      [
        `${KITCHEN}.west.neffOvenTower.bottomCupboardDoor`,
        `${KITCHEN}.west.neffOvenTower.topOvenDoor`,
        `${KITCHEN}.west.neffOvenTower.mainOvenDoor`,
        `${KITCHEN}.west.neffOvenTower.topCupboardDoor`,
      ],
    ],
    // Corner base doors (door-61 / door-65)
    [`${KITCHEN}.west.baseDoor.north`, [`${KITCHEN}.north.leftBaseDoor.west`]],
    // Corner upper doors (door-63 / door-83)
    [`${KITCHEN}.west.upperDoor.north`, [`${KITCHEN}.north.northWestUpperDoor`]],
    // North left base door (door-66) vs AGA left ovens (door-69/70)
    [
      `${KITCHEN}.north.leftBaseDoor.east`,
      [
        `${KITCHEN}.north.agaRangeCooker.topLeftOven.door`,
        `${KITCHEN}.north.agaRangeCooker.bottomLeftOven.door`,
      ],
    ],
    // Pantry lower right door (door-79) vs thin gap base door (door-80)
    [
      `${KITCHEN}.north.bifoldPantryUnit.lowerDoor.right`,
      [`${KITCHEN}.north.bifoldPantryUnit.thinGapBaseDoor`],
    ],
  ]),
  openAngles: {
    // Dining (family room) courtyard door (door-14): inward to clear the exterior terracotta planter
    'door:groundFloor.eastWing.cutaway.southWest@-9.3,3.6': 1.45,
    // Garage tool-bench tall cupboard left door (door-28)
    'door:outbuildings.garage.toolBench.tallCupboard.doorLeft': -1.35,
    // Boot room manifold cupboard (door-13)
    'door:familyRoom.bootRoomManifoldCupboard.door.leaf': -1.38,
    // Courtyard door X (door-19)
    'door:groundFloor.courtyardDoorX.1.leafGroup': 1.38,
    // Kitchen corner doors (door-65 / door-83)
    [`${KITCHEN}.north.leftBaseDoor.west`]: -1.28,
    [`${KITCHEN}.north.northWestUpperDoor`]: -1.28,
    // Pantry lower right / thin gap doors (door-79 / door-80)
    [`${KITCHEN}.north.bifoldPantryUnit.lowerDoor.right`]: 1.25,
    [`${KITCHEN}.north.bifoldPantryUnit.thinGapBaseDoor`]: 1.15,
  },
  splitLeafPairs: [[UTILITY_STABLE_DOOR_LOWER, UTILITY_STABLE_DOOR_UPPER]],
};
