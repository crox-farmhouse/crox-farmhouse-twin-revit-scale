import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import type { createFirstFloorMaterials } from '../../structure/first-floor-materials.ts';
import type { createFirstFloorShellKit } from '../../structure/first-floor-shell-kit.ts';

/**
 * Bedroom 4 (`bedroom4`).
 *
 * Extracted verbatim from `buildMainHouseFirstFloorAndRoof` (first-floor-rooms.ts). Statement order and
 * geometry are unchanged; shared locals flow in via `kit` and out via the return value.
 */
export function buildBedroom4(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'floorBaseY' | 'floorTopY' | 'oakFloorMat' | 'upperWallTopY' | 'wardrobeMat' | 'warmRoomPlasterMat' | 'windowFrameMat'> &
    Pick<ReturnType<typeof createFirstFloorShellKit>, 'addFirstFloorSlab' | 'addUpperBrickWallAlongZWithWindow' | 'addUpperExteriorBrickWall' | 'addUpperInteriorWall' | 'tagUpperCutawayWall'>
): void {
  const { firstFloorMeshGroup: scene } = ctx;
  const {
    addFirstFloorSlab,
    addUpperBrickWallAlongZWithWindow,
    addUpperExteriorBrickWall,
    addUpperInteriorWall,
    floorBaseY,
    floorTopY,
    oakFloorMat,
    upperWallTopY,
    wardrobeMat,
    warmRoomPlasterMat,
  } = kit;
  // =========================================================================
  // 7. BEDROOM 4 (4.95m x 3.20m / 16'3" x 10'6")
  //    Directly above Study & Study Lobby: X = -17.25m..-22.19m, Z = +8.39m..+11.49m
  // =========================================================================
  addFirstFloorSlab(-22.19, -17.25, 8.39, 11.49, oakFloorMat);

  // West Front Exterior Brick Wall of Bedroom 4 (X = -22.47m..-22.19m, Z = +8.39m..+11.77m)
  // With 3-pane Georgian casement window centered at Z = +9.94m (rightmost upper window on West front facade in Photo 2!)
  addUpperBrickWallAlongZWithWindow(
    -22.47,
    -22.19,
    8.39,
    11.77,
    9.94,
    1.35,
    2.92,
    3.94,
    'east',
    3
  );

  // South Exterior Brick Gable Wall of Bedroom 4 (Z = +11.49m..+11.77m, X = -22.47m..-17.11m, Y = 2.06m..4.16m)
  // Flush continuous exterior brickwork with Chimney Breast projecting INSIDE Bedroom 4 immediately West of the SE cupboards
  addUpperExteriorBrickWall(-22.47, -17.11, 11.49, 11.77, floorBaseY, upperWallTopY, 'north');
  addUpperInteriorWall(-19.15, floorTopY, upperWallTopY, 11.29, 1.15, 0.4, warmRoomPlasterMat);

  // East Courtyard Exterior Brick Wall of Bedroom 4 (X = -17.39m..-17.11m, Z = +8.15m..+11.77m, Y = 2.06m..4.16m)
  addUpperExteriorBrickWall(-17.39, -17.11, 8.15, 11.77, floorBaseY, upperWallTopY, 'west');

  // Two side-by-side Built-In Cupboards in the South-East corner of Bedroom 4 (`X = -18.25m..-17.39m, Z = +9.65m..+11.49m`)
  // Leaving the North-East doorway corner (`Z = +8.39m..+9.65m`) completely clear for the Bedroom 4 entrance door!
  {
    const cupGroup = new THREE.Group();
    cupGroup.name = 'bedroom4.eastCupboards';
    const cupH = upperWallTopY - floorTopY;
    const cupD = 0.84; // X = -18.23m .. -17.39m
    const cupSpanZ = 1.82; // Z = +9.66m .. +11.48m
    const centerX = -17.81;
    const centerZ = 10.57;

    // North end return wall of the built-in cupboards at Z = +9.65m
    addUpperInteriorWall(centerX, floorTopY, upperWallTopY, 9.65, cupD, 0.12, warmRoomPlasterMat);

    // Central dividing partition between the two SE cupboards at Z = +10.57m
    addUpperInteriorWall(centerX, floorTopY, upperWallTopY, centerZ, cupD, 0.08, warmRoomPlasterMat);

    // Main cupboard carcass
    const carcass = new THREE.Mesh(
      new THREE.BoxGeometry(cupD - 0.04, cupH, cupSpanZ - 0.06),
      wardrobeMat
    );
    carcass.position.set(centerX, floorTopY + cupH / 2, centerZ);
    carcass.castShadow = true;
    carcass.receiveShadow = true;
    cupGroup.add(carcass);

    // Two full-height Shaker cupboard doors on the West face (`X = -18.23m`) opening West (`-X`) into Bedroom 4
    const doorW = (cupSpanZ - 0.18) / 2;
    const doorLeafH = cupH - 0.22;
    for (let i = 0; i < 2; i++) {
      const doorZ = 9.74 + doorW / 2 + i * (doorW + 0.08);
      const doorPanel = new THREE.Mesh(
        new THREE.BoxGeometry(0.022, doorLeafH, doorW - 0.02),
        wardrobeMat
      );
      doorPanel.position.set(-18.23, floorTopY + 0.11 + doorLeafH / 2, doorZ);
      doorPanel.castShadow = true;
      cupGroup.add(doorPanel);
    }

    scene.add(cupGroup);
  }
}
