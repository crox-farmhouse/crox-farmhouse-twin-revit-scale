import type { SceneBuilderContext } from '../../../engine/viewer/scene-types.ts';
import type { createGroundFloorMaterials } from './ground-floor-materials.ts';

/**
 * Tier-2 floor level constants (Y = -0.60m) for the front hallway, front rooms, study and plant room.
 *
 * Extracted verbatim from `buildMainHouseGroundFloorRooms` (ground-floor-rooms.ts). Statement order and
 * geometry are unchanged; shared locals flow in via `kit` and out via the return value.
 */
export function defineTier2Levels(
  _ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createGroundFloorMaterials>, 'frontWallH' | 'wallH'>
) {
  const {
    frontWallH,
    wallH,
  } = kit;
  // Survey2Plan Floor 1596581: Front Entrance Hallway (`Rm 10`) steps down -195mm from GF Hall (-0.30m -> -0.495m),
  // with -105mm threshold steps down into Front/Cinema Room (`Rm 9`, -0.60m) and Sitting Room (`Rm 11`, -0.60m).
  const entranceHallFloorY = -0.495;
  // Tier 2 elevation constants (Y = -0.60m for Front Room, Sitting Room, Study & Plant Room)
  const tier2FloorY = -0.6;
  const tier2WallH = wallH - tier2FloorY; // 2.66m (from Y = -0.60m to Y = 2.06m for Study / Plant Room)
  const tier2WallMidY = (tier2FloorY + wallH) / 2; // 0.73m
  const frontTier2WallH = frontWallH - tier2FloorY; // 2.225m (from Y = -0.60m to Y = 1.625m for the front 2 rooms — Issue #1)
  const frontTier2WallMidY = (tier2FloorY + frontWallH) / 2;
  // Survey2Plan Ceil 1621697: Plant Room (`Rm 12B`) clear ceiling height is 1.98m above -0.60m floor (world Y = 1.38m)
  const plantRoomCeilingY = tier2FloorY + 1.98;

  return {
    entranceHallFloorY,
    frontTier2WallH,
    frontTier2WallMidY,
    plantRoomCeilingY,
    tier2FloorY,
    tier2WallH,
    tier2WallMidY,
  };
}
