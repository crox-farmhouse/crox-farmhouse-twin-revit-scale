import * as THREE from 'three';
import { buildMitredWallSkirtingGeometry } from '../../../../engine/geometry/index.ts';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import type { createFirstFloorMaterials } from '../../structure/first-floor-materials.ts';
import type { createFirstFloorShellKit } from '../../structure/first-floor-shell-kit.ts';

/**
 * Bedroom 4 (`bedroom4`).
 */
export function buildBedroom4(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'antiqueOakSkirtingMat' | 'floorBaseY' | 'floorTopY' | 'oakFloorMat' | 'upperWallTopY' | 'wardrobeMat' | 'warmRoomPlasterMat' | 'windowFrameMat'> &
    Pick<ReturnType<typeof createFirstFloorShellKit>, 'addFirstFloorSlab' | 'addShakerWardrobeDoor' | 'addUpperBrickWallAlongZWithWindow' | 'addUpperExteriorBrickWall' | 'addUpperInteriorWall' | 'tagUpperCutawayWall'>
): void {
  const { firstFloorMeshGroup: scene } = ctx;
  const {
    addFirstFloorSlab,
    addShakerWardrobeDoor,
    addUpperBrickWallAlongZWithWindow,
    addUpperExteriorBrickWall,
    addUpperInteriorWall,
    antiqueOakSkirtingMat,
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
    3,
    { skirtingMin: 8.39, skirtingMax: 11.49 }
  );

  // South Exterior Brick Gable Wall of Bedroom 4 (Z = +11.49m..+11.77m, X = -22.47m..-17.11m, Y = 2.06m..4.16m)
  // Flush continuous exterior brickwork with Chimney Breast projecting INSIDE Bedroom 4 (X = -20.45m..-19.25m)
  addUpperExteriorBrickWall(-22.47, -17.11, 11.49, 11.77, floorBaseY, upperWallTopY, 'north', {
    skipSkirting: true,
  });
  addUpperInteriorWall(-19.85, floorTopY, upperWallTopY, 11.29, 1.2, 0.4, warmRoomPlasterMat, {
    skipSkirting: true,
  });

  // East Courtyard Exterior Brick Wall of Bedroom 4 (X = -17.39m..-17.11m, Z = +8.15m..+11.77m, Y = 2.06m..4.16m)
  // Skirting clamped between North cross-wall (Z = 8.39m) and SE alcove cupboards (Z = 10.85m)
  addUpperExteriorBrickWall(-17.39, -17.11, 8.15, 11.77, floorBaseY, upperWallTopY, 'west', {
    skirtingMin: 8.39,
    skirtingMax: 10.85,
  });

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
    addUpperInteriorWall(centerX, floorTopY, upperWallTopY, centerZ, 0.08, cupD, warmRoomPlasterMat, {
      skipSkirting: true,
    });

    // Main cupboard carcass
    const carcass = new THREE.Mesh(
      new THREE.BoxGeometry(cupSpanX - 0.04, cupH, cupD - 0.04),
      wardrobeMat
    );
    carcass.position.set(centerX, floorTopY + cupH / 2, centerZ);
    carcass.castShadow = true;
    carcass.receiveShadow = true;
    cupGroup.add(carcass);

    // Two full-height Shaker cupboard doors with vertical brass handles on the North face (`Z = +10.847m`) (Issue #8)
    const doorW = (cupSpanX - 0.16) / 2;
    const doorLeafH = cupH - 0.24;
    for (let i = 0; i < 2; i++) {
      const doorX = -19.2 + doorW / 2 + i * (doorW + 0.08);
      addShakerWardrobeDoor(cupGroup, {
        x: doorX,
        y: floorTopY + 0.15 + doorLeafH / 2,
        z: 10.847,
        width: doorW - 0.015,
        height: doorLeafH,
        alongZ: false,
        normalSign: -1,
        handleSide: i === 0 ? 'right' : 'left',
        namePrefix: `bedroom4.southEastCupboards.door_${i + 1}`,
      });
    }

    scene.add(cupGroup);
  }

  // Issue #7: Continuous 45°-mitred skirting along Bedroom 4 South Alcove Cupboards, Chimney Breast, and SW Alcove
  const bed4SouthMitredSkirt = new THREE.Mesh(
    buildMitredWallSkirtingGeometry(
      [
        [-17.36, 10.85],
        [-19.25, 10.85],
        [-19.25, 11.09],
        [-20.45, 11.09],
        [-20.45, 11.49],
        [-22.19, 11.49],
      ],
      floorTopY
    ),
    antiqueOakSkirtingMat
  );
  bed4SouthMitredSkirt.name = 'bedroom4.southWallMitredSkirting';
  bed4SouthMitredSkirt.castShadow = true;
  bed4SouthMitredSkirt.receiveShadow = true;
  scene.add(bed4SouthMitredSkirt);
}
