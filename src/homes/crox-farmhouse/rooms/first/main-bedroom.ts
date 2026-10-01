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
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'antiqueOakSkirtingMat' | 'floorBaseY' | 'floorTopY' | 'oakFloorMat' | 'upperWallTopY' | 'wardrobeMat' | 'warmRoomPlasterMat'> &
    Pick<ReturnType<typeof createFirstFloorShellKit>, 'addFirstFloorSlab' | 'addShakerWardrobeDoor' | 'addUpperBrickWallAlongXWithWindow' | 'addUpperExteriorBrickWall' | 'addUpperInteractiveDoor' | 'addUpperInteriorWall' | 'doorH'>
): void {
  const { firstFloorMeshGroup: scene } = ctx;
  const {
    addFirstFloorSlab,
    addShakerWardrobeDoor,
    addUpperBrickWallAlongXWithWindow,
    addUpperExteriorBrickWall,
    addUpperInteractiveDoor,
    addUpperInteriorWall,
    antiqueOakSkirtingMat,
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

  // East Cross-Wall of Main Bedroom (X = -4.64m..-4.40m, Z = -2.78m..+2.63m)
  addUpperInteriorWall(-4.63, floorTopY, 3.08, 1.585, 0.02, 1.53, warmRoomPlasterMat, {
    skipSkirting: true,
  });
  addUpperExteriorBrickWall(-4.64, -4.4, -2.78, 2.63, 3.08, upperWallTopY, 'west', {
    skipSkirting: true,
  });

  // North Exterior Brick Wall of Main Bedroom (Z = -2.78m..-2.50m, X = -9.56m..-4.40m) with casement window
  // Skirting clamped to [-9.56, -5.26] between West cross-wall and East built-in wardrobes
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
    2,
    { skirtingMin: -9.56, skirtingMax: -5.26 }
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
    3,
    { skirtingMin: -9.56, skirtingMax: -5.26 }
  );

  const collarCeilingY = 4.52;

  // East Chimney Breast in Main Bedroom continuing directly above the Dining Room Chimney Breast
  // (X = -4.96m..-4.64m, Z = -0.85m..+0.82m, width 0.32m, depth 1.67m, rising from floorBaseY = 2.06m to collarCeilingY = 4.52m — Issue #5 & Issue #12)
  addUpperInteriorWall(-4.8, floorBaseY, collarCeilingY, -0.015, 0.32, 1.67, warmRoomPlasterMat, {
    skipSkirting: true,
  });

  // =========================================================================
  // FULL-WIDTH BANK OF 4 BUILT-IN SHAKER WARDROBES ALONG THE EAST WALL
  // (`X = -5.26m..-4.64m, Z = -2.50m..+2.35m`, facing West `-X` into Main Bedroom)
  // Matching `ff_rotated_3d_axes.png`: a continuous run of 4 built-in double
  // wardrobes along the entire East wall of the Main Bedroom.
  // =========================================================================
  {
    const eastWardGroup = new THREE.Group();
    eastWardGroup.name = 'mainBedroom.eastWardrobes';
    const wardD = 0.62; // X = -5.26m .. -4.64m
    const wardH = upperWallTopY - floorTopY;
    const totalZ = 4.85; // Z = -2.50m .. +2.35m
    const centerZ = -0.075;
    const centerX = -4.95;

    const carcass = new THREE.Mesh(
      new THREE.BoxGeometry(wardD, wardH, totalZ),
      wardrobeMat
    );
    carcass.position.set(centerX, floorTopY + wardH / 2, centerZ);
    carcass.castShadow = true;
    carcass.receiveShadow = true;
    eastWardGroup.add(carcass);

    // Continuous antique oak skirting plinth + top cap along the front face (`X = -5.26m`) of the East wardrobes
    const wardSkirt = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, 0.122, totalZ),
      antiqueOakSkirtingMat
    );
    wardSkirt.position.set(-5.26 - 0.009, floorTopY + 0.061, centerZ);
    wardSkirt.receiveShadow = true;
    eastWardGroup.add(wardSkirt);

    const wardSkirtCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, 0.024, totalZ),
      antiqueOakSkirtingMat
    );
    wardSkirtCap.position.set(-5.26 - 0.006, floorTopY + 0.134, centerZ);
    wardSkirtCap.receiveShadow = true;
    eastWardGroup.add(wardSkirtCap);

    // 8 Shaker wardrobe doors (4 pairs of double doors) along the West face (`X = -5.273m`)
    const doorW = (totalZ - 0.24) / 8;
    const doorLeafH = wardH - 0.24;
    for (let i = 0; i < 8; i++) {
      const doorZ = -2.5 + 0.12 + doorW / 2 + i * (doorW + 0.015);
      addShakerWardrobeDoor(eastWardGroup, {
        x: -5.273,
        y: floorTopY + 0.15 + doorLeafH / 2,
        z: doorZ,
        width: doorW - 0.012,
        height: doorLeafH,
        alongZ: true,
        normalSign: -1,
        handleSide: i % 2 === 0 ? 'right' : 'left',
        namePrefix: `mainBedroom.eastWardrobe.door_${i + 1}`,
      });
    }

    scene.add(eastWardGroup);
  }

  // West Load-Bearing Cross-Wall between Main Bedroom and Family Bathroom / Upper Passage (0.24m thick, X = -9.56m..-9.80m)
  // Doorway at Z = +1.55m
  addUpperInteriorWall(-9.68, floorTopY, upperWallTopY, -0.7, 0.24, 3.6, warmRoomPlasterMat, {
    skipSkirting: true,
  });
  addUpperInteriorWall(-9.68, floorTopY, upperWallTopY, 2.2, 0.24, 0.4, warmRoomPlasterMat, {
    skipSkirting: true,
  });
  addUpperInteriorWall(-9.68, floorTopY + doorH, upperWallTopY, 1.55, 0.24, 0.9, warmRoomPlasterMat, {
    skipSkirting: true,
  });
  // Clean skirting segments on both sides of the X = -9.68m Cross-Wall (Issue #2 & Issue #7: zero protruding ends!)
  for (const [sideSign, z0, z1] of [
    [-1, -2.5, -0.01],   // West face inside Family Bathroom (North of Recessed Cupboard)
    [-1, 2.082, 2.4],    // West face inside Upper South Passage (South of Doorway up to Z = 2.40m South wall!)
    [1, -2.5, 1.018],    // East face inside Main Bedroom (North of Doorway)
    [1, 2.082, 2.35],    // East face inside Main Bedroom (South of Doorway up to Z = 2.35m South wall!)
  ] as const) {
    const sD = z1 - z0;
    const sCz = (z0 + z1) / 2;
    const skirt = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, 0.122, sD),
      antiqueOakSkirtingMat
    );
    skirt.position.set(-9.68 + sideSign * (0.12 + 0.009), floorTopY + 0.061, sCz);
    skirt.receiveShadow = true;
    scene.add(skirt);
    const skirtCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, 0.024, sD),
      antiqueOakSkirtingMat
    );
    skirtCap.position.set(-9.68 + sideSign * (0.12 + 0.006), floorTopY + 0.134, sCz);
    skirtCap.receiveShadow = true;
    scene.add(skirtCap);
  }
  addUpperInteractiveDoor('z', -9.68, 0.24, 1.55, 0.9, Math.PI * 0.48);

  // Issue #5: Trapezoidal Upper Gable Extensions on the West (X = -9.68m) and East (X = -4.52m) Cross-Walls (Y = 4.16m..4.52m)
  for (const [gableX, gableName] of [
    [-9.68, 'mainBedroom.westWallUpperGable'],
    [-4.52, 'mainBedroom.eastWallUpperGable'],
  ] as const) {
    const gableShape = new THREE.Shape();
    gableShape.moveTo(-1.9, upperWallTopY);
    gableShape.lineTo(1.8, upperWallTopY);
    gableShape.lineTo(1.05, collarCeilingY);
    gableShape.lineTo(-1.15, collarCeilingY);
    gableShape.closePath();
    const gableGeo = new THREE.ExtrudeGeometry(gableShape, {
      depth: 0.24,
      bevelEnabled: false,
    });
    gableGeo.rotateY(Math.PI / 2);
    gableGeo.translate(gableX - 0.12, 0, 0);
    const gableMesh = new THREE.Mesh(gableGeo, warmRoomPlasterMat);
    gableMesh.name = gableName;
    gableMesh.castShadow = true;
    gableMesh.receiveShadow = true;
    scene.add(gableMesh);
  }
}
