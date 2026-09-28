import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import type { createFirstFloorMaterials } from '../../structure/first-floor-materials.ts';
import type { createFirstFloorShellKit } from '../../structure/first-floor-shell-kit.ts';

/**
 * Main Bedroom (`mainBedroom`) walls, chimney breast and built-in wardrobes.
 *
 * Extracted verbatim from `buildMainHouseFirstFloorAndRoof` (first-floor-rooms.ts). Statement order and
 * geometry are unchanged; shared locals flow in via `kit` and out via the return value.
 */
export function buildMainBedroom(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'floorBaseY' | 'floorTopY' | 'oakFloorMat' | 'upperWallTopY' | 'wardrobeMat' | 'warmRoomPlasterMat'> &
    Pick<ReturnType<typeof createFirstFloorShellKit>, 'addFirstFloorSlab' | 'addUpperBrickWallAlongXWithWindow' | 'addUpperExteriorBrickWall' | 'addUpperInteractiveDoor' | 'addUpperInteriorWall' | 'doorH'>
): void {
  const { firstFloorMeshGroup: scene } = ctx;
  const {
    addFirstFloorSlab,
    addUpperBrickWallAlongXWithWindow,
    addUpperExteriorBrickWall,
    addUpperInteractiveDoor,
    addUpperInteriorWall,
    doorH,
    floorBaseY,
    floorTopY,
    oakFloorMat,
    upperWallTopY,
    wardrobeMat,
    warmRoomPlasterMat,
  } = kit;
  // =========================================================================
  // 1. MAIN BEDROOM (5.00m x 4.55m / 16'5" x 14'11")
  //    Directly above Family Room: X = -4.64m..-9.56m, Z = -2.50m..+2.35m
  // =========================================================================
  addFirstFloorSlab(-9.56, -4.64, -2.5, 2.35, oakFloorMat);

  // East Exterior Brick Cross-Wall of Main Bedroom (X = -4.64m..-4.40m, Z = -2.78m..+2.63m)
  // Below Y = 3.00m, shell-and-utility.ts already builds the Kitchen/Family Room cross-wall (Z = -2.50m..+1.99m),
  // so we only add the South step-out return (Z = +1.99m..+2.63m) from floorBaseY to 3.00m,
  // and then the full East brick wall from Y = 3.00m to upperWallTopY (4.38m) above the Kitchen eaves!
  addUpperExteriorBrickWall(-4.68, -4.4, 1.99, 2.63, floorBaseY, 3.0, 'west');
  addUpperExteriorBrickWall(-4.64, -4.4, -2.78, 2.63, 3.0, upperWallTopY, 'west');

  // North Exterior Brick Wall of Main Bedroom (Z = -2.78m..-2.50m, X = -9.56m..-4.40m) with casement window
  addUpperBrickWallAlongXWithWindow(
    -9.56,
    -4.4,
    -2.78,
    -2.5,
    -6.35,
    1.25,
    2.96,
    3.94,
    'south',
    2
  );

  // South Courtyard Exterior Brick Wall of Main Bedroom (Z = +2.35m..+2.63m, X = -9.56m..-4.40m)
  // With 3-pane Georgian casement window centered at X = -6.85m (directly above Family Room window, Photo 1)
  addUpperBrickWallAlongXWithWindow(
    -9.56,
    -4.4,
    2.35,
    2.63,
    -6.85,
    1.55,
    2.92,
    3.94,
    'north',
    3
  );

  // East Chimney Breast in Main Bedroom continuing directly above the Dining Room Chimney Breast
  // (X = -4.96m..-4.64m, Z = -0.85m..+0.82m, width 0.32m, depth 1.67m, rising from floorBaseY = 2.06m to upperWallTopY = 4.16m — Issue #12)
  addUpperInteriorWall(-4.8, floorBaseY, upperWallTopY, -0.015, 0.32, 1.67, warmRoomPlasterMat);

  // Full-width bank of built-in Shaker Wardrobes along the North wall of Main Bedroom (floorplan X = -4.64m..-9.56m, Z = -2.50m..-1.88m)
  // Flanking the North window (X = -6.35m): East wardrobe bay (X = -4.64m..-5.65m) & West 3-bay wardrobe bank (X = -7.05m..-9.56m)
  for (const [minWx, maxWx] of [
    [-5.65, -4.64],
    [-9.56, -7.05],
  ] as const) {
    const ww = maxWx - minWx;
    const wcx = (minWx + maxWx) / 2;
    const wardBody = new THREE.Mesh(
      new THREE.BoxGeometry(ww, 1.92, 0.62),
      wardrobeMat
    );
    wardBody.position.set(wcx, floorTopY + 0.96, -2.19);
    wardBody.castShadow = true;
    wardBody.receiveShadow = true;
    scene.add(wardBody);
  }

  // South-West Corner Cupboard in Main Bedroom (X = -8.65m..-9.56m, Z = +0.10m..+1.05m)
  addUpperInteriorWall(-8.65, floorTopY, upperWallTopY, 0.575, 0.15, 0.95, warmRoomPlasterMat);
  addUpperInteriorWall(-9.105, floorTopY, upperWallTopY, 0.1, 0.91, 0.15, warmRoomPlasterMat);
  addUpperInteriorWall(-9.105, floorTopY, upperWallTopY, 1.05, 0.91, 0.15, warmRoomPlasterMat);

  // West Load-Bearing Cross-Wall between Main Bedroom and Family Bathroom / Upper Passage (0.24m thick, X = -9.56m..-9.80m)
  // Doorway at Z = +1.55m (with 2 oak steps UP into Main Bedroom as marked 'UP' on the First Floor plan!)
  addUpperInteriorWall(-9.68, floorTopY, upperWallTopY, -0.7, 0.24, 3.6, warmRoomPlasterMat);
  addUpperInteriorWall(-9.68, floorTopY, upperWallTopY, 2.18, 0.24, 0.36, warmRoomPlasterMat);
  addUpperInteriorWall(-9.68, floorTopY + doorH, upperWallTopY, 1.55, 0.24, 0.9, warmRoomPlasterMat);
  addUpperInteractiveDoor('z', -9.68, 0.24, 1.55, 0.9, Math.PI * 0.48);
}
