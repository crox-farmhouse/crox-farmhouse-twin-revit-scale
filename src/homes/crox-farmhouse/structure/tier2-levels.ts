import type { SceneBuilderContext } from '../../../core/types/scene.ts';
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
  // Tier 2 elevation constants (another 30cm drop to Y = -0.60m for Front Entrance Hallway, Front Room, Living Room & Plant Room)
  const tier2FloorY = -0.6;
  const tier2WallH = wallH - tier2FloorY; // 2.66m (from Y = -0.60m to Y = 2.06m for Study / Plant Room)
  const tier2WallMidY = (tier2FloorY + wallH) / 2; // 0.73m
  const frontTier2WallH = frontWallH - tier2FloorY; // 2.225m (from Y = -0.60m to Y = 1.625m for the front 2 rooms — Issue #1)
  const frontTier2WallMidY = (tier2FloorY + frontWallH) / 2;

  return {
    frontTier2WallH,
    frontTier2WallMidY,
    tier2FloorY,
    tier2WallH,
    tier2WallMidY,
  };
}
