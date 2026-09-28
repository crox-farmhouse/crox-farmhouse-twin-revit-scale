import type { SceneBuilderContext } from '../../../../types/scene.ts';
import type { createFirstFloorMaterials } from '../../structure/first-floor-materials.ts';
import type { createFirstFloorShellKit } from '../../structure/first-floor-shell-kit.ts';

/**
 * Bedroom 3 (`bedroom3`).
 *
 * Extracted verbatim from `buildMainHouseFirstFloorAndRoof` (first-floor-rooms.ts). Statement order and
 * geometry are unchanged; shared locals flow in via `kit` and out via the return value.
 */
export function buildBedroom3(
  _ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'floorTopY' | 'oakFloorMat' | 'upperWallTopY' | 'warmRoomPlasterMat'> &
    Pick<ReturnType<typeof createFirstFloorShellKit>, 'addFirstFloorSlab' | 'addUpperBrickWallAlongZWithWindow' | 'addUpperInteractiveDoor' | 'addUpperInteriorWall' | 'doorH'>
): void {
  const {
    addFirstFloorSlab,
    addUpperBrickWallAlongZWithWindow,
    addUpperInteractiveDoor,
    addUpperInteriorWall,
    doorH,
    floorTopY,
    oakFloorMat,
    upperWallTopY,
    warmRoomPlasterMat,
  } = kit;
  // =========================================================================
  // 6. BEDROOM 3 (4.00m x 3.85m / 13'1" x 12'8")
  //    Directly above Sitting Room: X = -18.84m..-22.19m, Z = +4.30m..+8.15m
  // =========================================================================
  addFirstFloorSlab(-22.19, -18.84, 4.3, 8.15, oakFloorMat);

  // West Front Exterior Brick Wall of Bedroom 3 (X = -22.47m..-22.19m, Z = +4.30m..+8.39m)
  // With 2-pane Georgian casement window centered at Z = +5.92m (directly above Sitting Room bay — Photo 2!)
  addUpperBrickWallAlongZWithWindow(
    -22.47,
    -22.19,
    4.3,
    8.39,
    5.92,
    1.35,
    2.92,
    3.94,
    'east',
    2
  );

  // East Corridor Partition Wall of Bedroom 3 (0.15m thick at X = -18.915m, Z = +4.30m..+8.15m)
  // With doorway at Z = +5.15m
  addUpperInteriorWall(-18.915, floorTopY, upperWallTopY, 4.5, 0.15, 0.4, warmRoomPlasterMat);
  addUpperInteriorWall(-18.915, floorTopY, upperWallTopY, 6.875, 0.15, 2.55, warmRoomPlasterMat);
  addUpperInteriorWall(-18.915, floorTopY + doorH, upperWallTopY, 5.15, 0.15, 0.9, warmRoomPlasterMat);
  addUpperInteractiveDoor('z', -18.915, 0.15, 5.15, 0.9, -Math.PI * 0.48);

  // South Chimney Breast in Bedroom 3 (X = -19.85m, Z = +7.925m)
  addUpperInteriorWall(-19.85, floorTopY, upperWallTopY, 7.925, 1.2, 0.45, warmRoomPlasterMat);

  // South Load-Bearing Cross-Wall between Bedroom 3 / Upper Corridor and Bedroom 4
  // (0.24m thick, Z = +8.15m..+8.39m, X = -17.39m..-22.19m) with doorway at X = -18.12m
  addUpperInteriorWall(-17.53, floorTopY, upperWallTopY, 8.27, 0.28, 0.24, warmRoomPlasterMat);
  addUpperInteriorWall(-20.38, floorTopY, upperWallTopY, 8.27, 3.62, 0.24, warmRoomPlasterMat);
  addUpperInteriorWall(-18.12, floorTopY + doorH, upperWallTopY, 8.27, 0.9, 0.24, warmRoomPlasterMat);
  addUpperInteractiveDoor('x', 8.27, 0.24, -18.12, 0.9, Math.PI * 0.48);
}
