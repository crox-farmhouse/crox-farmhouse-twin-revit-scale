import { buildAngledWallSegment } from '../../../../engine/geometry/index.ts';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import type { createFirstFloorMaterials } from '../../structure/first-floor-materials.ts';
import type { createFirstFloorShellKit } from '../../structure/first-floor-shell-kit.ts';

/**
 * Bedroom 3 (`bedroom3`).
 */
export function buildBedroom3(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'antiqueOakSkirtingMat' | 'brassMat' | 'floorTopY' | 'oakFloorMat' | 'timberDoorMat' | 'upperWallTopY' | 'wallCapMat' | 'warmRoomPlasterMat'> &
    Pick<ReturnType<typeof createFirstFloorShellKit>, 'addFirstFloorSlab' | 'addUpperBrickWallAlongZWithWindow' | 'addUpperInteractiveDoor' | 'addUpperInteriorWall' | 'doorH'>
): void {
  const { firstFloorMeshGroup: scene, interactions } = ctx;
  const {
    addFirstFloorSlab,
    addUpperBrickWallAlongZWithWindow,
    addUpperInteractiveDoor,
    addUpperInteriorWall,
    antiqueOakSkirtingMat,
    brassMat,
    doorH,
    floorTopY,
    oakFloorMat,
    timberDoorMat,
    upperWallTopY,
    wallCapMat,
    warmRoomPlasterMat,
  } = kit;
  // =========================================================================
  // 6. BEDROOM 3 (4.00m x 3.85m / 13'1" x 12'8")
  //    Directly above Sitting Room: X = -18.25m..-22.19m, Z = +4.30m..+8.15m
  // =========================================================================
  addFirstFloorSlab(-22.19, -18.25, 4.3, 8.15, oakFloorMat);

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

  // East Corridor Partition Wall of Bedroom 3 (0.15m thick at X = -18.25m, Z = +4.30m..+8.15m)
  // Collinear with the Walk-In Shower East wall (`X = -18.25m`) so the West Wing Corridor is ~1.05m wide (Issue #6)
  // with continuous skirting along the Corridor face (Issue #8) and doorway at the South end (Z = +7.42m)
  buildAngledWallSegment(scene, interactions, {
    start: [-18.25, 4.3],
    end: [-18.25, 8.15],
    thickness: 0.15,
    topY: upperWallTopY,
    frontFloorY: floorTopY,
    backFloorY: floorTopY,
    wallMaterial: warmRoomPlasterMat,
    capMaterial: wallCapMat,
    skirtingMaterial: antiqueOakSkirtingMat,
    addFrontSkirting: true, // East (`+X`) face in the Corridor
    addBackSkirting: true,  // West (`-X`) face inside Bedroom 3
    openings: [
      {
        id: 'bedroom3Door',
        kind: 'hinged-door',
        uCenter: 3.12, // Z = +7.42m
        width: 0.84,
        doorHeight: doorH,
        lowerFloorY: floorTopY,
        upperFloorY: floorTopY,
        architraveMaterial: antiqueOakSkirtingMat,
        doorLeafMaterial: timberDoorMat,
        hardwareMaterial: brassMat,
        hingeSide: 'left',
        openAngle: -Math.PI * 0.48,
        initialOpenProgress: 0.2,
      },
    ],
  });

  // South Chimney Breast in Bedroom 3 (X = -19.85m, Z = +7.925m)
  addUpperInteriorWall(-19.85, floorTopY, upperWallTopY, 7.925, 1.2, 0.45, warmRoomPlasterMat);

  // South Load-Bearing Cross-Wall between Bedroom 3 / Upper Corridor and Bedroom 4
  // (0.24m thick, Z = +8.15m..+8.39m, X = -17.23m..-22.19m) with doorway centered in the Corridor at X = -17.71m
  addUpperInteriorWall(-20.175, floorTopY, upperWallTopY, 8.27, 4.03, 0.24, warmRoomPlasterMat);
  addUpperInteriorWall(-17.71, floorTopY + doorH, upperWallTopY, 8.27, 0.9, 0.24, warmRoomPlasterMat);
  addUpperInteractiveDoor('x', 8.27, 0.24, -17.71, 0.9, Math.PI * 0.48);
}
