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
  // Flush continuous exterior brickwork with Chimney Breast projecting INSIDE Bedroom 4 (X = -20.45m..-19.25m)
  addUpperExteriorBrickWall(-22.47, -17.11, 11.49, 11.77, floorBaseY, upperWallTopY, 'north');
  addUpperInteriorWall(-19.85, floorTopY, upperWallTopY, 11.29, 1.2, 0.4, warmRoomPlasterMat);

  // East Courtyard Exterior Brick Wall of Bedroom 4 (X = -17.39m..-17.11m, Z = +8.15m..+11.77m, Y = 2.06m..4.16m)
  addUpperExteriorBrickWall(-17.39, -17.11, 8.15, 11.77, floorBaseY, upperWallTopY, 'west');

  // Two side-by-side Built-In Alcove Cupboards along the South Gable Wall East of the Chimney Breast
  // (`X = -19.25m..-17.39m, Z = +10.85m..+11.49m`), opening North (`-Z`) into Bedroom 4
  {
    const cupGroup = new THREE.Group();
    cupGroup.name = 'bedroom4.southEastCupboards';
    const cupH = upperWallTopY - floorTopY;
    const cupSpanX = 1.84; // X = -19.24m .. -17.40m
    const cupD = 0.62; // Z = +10.86m .. +11.48m
    const centerX = -18.32;
    const centerZ = 11.17;

    // Central dividing partition between the two South-East alcove cupboards at X = -18.32m
    addUpperInteriorWall(centerX, floorTopY, upperWallTopY, centerZ, 0.08, cupD, warmRoomPlasterMat);

    // Main cupboard carcass
    const carcass = new THREE.Mesh(
      new THREE.BoxGeometry(cupSpanX - 0.04, cupH, cupD - 0.04),
      wardrobeMat
    );
    carcass.position.set(centerX, floorTopY + cupH / 2, centerZ);
    carcass.castShadow = true;
    carcass.receiveShadow = true;
    cupGroup.add(carcass);

    // Two full-height Shaker cupboard doors on the North face (`Z = +10.85m`) opening North (`-Z`) into Bedroom 4
    const doorW = (cupSpanX - 0.16) / 2;
    const doorLeafH = cupH - 0.22;
    for (let i = 0; i < 2; i++) {
      const doorX = -19.2 + doorW / 2 + i * (doorW + 0.08);
      const doorPanel = new THREE.Mesh(
        new THREE.BoxGeometry(doorW - 0.02, doorLeafH, 0.022),
        wardrobeMat
      );
      doorPanel.position.set(doorX, floorTopY + 0.11 + doorLeafH / 2, 10.85);
      doorPanel.castShadow = true;
      cupGroup.add(doorPanel);
    }

    scene.add(cupGroup);
  }
}
