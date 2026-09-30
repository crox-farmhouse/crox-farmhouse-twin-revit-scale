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

  // East Cross-Wall of Main Bedroom (X = -4.64m..-4.40m, Z = -2.78m..+2.63m)
  // Below Y = 3.00m, kitchen-shell-and-utility.ts and dining-room.ts already build the full cross-wall (Z = -2.50m..+2.35m),
  // so we add the Main Bedroom interior East lining & oak skirting from floorTopY to 3.08m (Z = +0.82m..+2.35m South of the chimney breast),
  // and then the full East brick wall from Y = 3.08m (above the Kitchen ceiling slab) to upperWallTopY (4.16m) above the Kitchen eaves!
  addUpperInteriorWall(-4.63, floorTopY, 3.08, 1.585, 0.02, 1.53, warmRoomPlasterMat);
  addUpperExteriorBrickWall(-4.64, -4.4, -2.78, 2.63, 3.08, upperWallTopY, 'west');

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

  const collarCeilingY = 4.52;

  // East Chimney Breast in Main Bedroom continuing directly above the Dining Room Chimney Breast
  // (X = -4.96m..-4.64m, Z = -0.85m..+0.82m, width 0.32m, depth 1.67m, rising from floorBaseY = 2.06m to collarCeilingY = 4.52m — Issue #5 & Issue #12)
  addUpperInteriorWall(-4.8, floorBaseY, collarCeilingY, -0.015, 0.32, 1.67, warmRoomPlasterMat);

  // =========================================================================
  // FULL-WIDTH BANK OF 4 BUILT-IN SHAKER WARDROBES ALONG THE EAST WALL
  // (`X = -5.26m..-4.64m, Z = -2.46m..+2.31m`, facing West `-X` into Main Bedroom)
  // Matching `ff_rotated_3d_axes.png`: a continuous run of 4 built-in double
  // wardrobes along the entire East wall of the Main Bedroom.
  // =========================================================================
  {
    const eastWardGroup = new THREE.Group();
    eastWardGroup.name = 'mainBedroom.eastWardrobes';
    const wardD = 0.62; // X = -5.26m .. -4.64m
    const wardH = upperWallTopY - floorTopY;
    const totalZ = 4.74; // Z = -2.44m .. +2.30m
    const centerZ = -0.07;
    const centerX = -4.95;

    const carcass = new THREE.Mesh(
      new THREE.BoxGeometry(wardD, wardH, totalZ),
      wardrobeMat
    );
    carcass.position.set(centerX, floorTopY + wardH / 2, centerZ);
    carcass.castShadow = true;
    carcass.receiveShadow = true;
    eastWardGroup.add(carcass);

    // 8 Shaker wardrobe doors (4 pairs of double doors) along the West face (`X = -5.27m`)
    const doorW = (totalZ - 0.24) / 8;
    const doorLeafH = wardH - 0.22;
    for (let i = 0; i < 8; i++) {
      const doorZ = -2.44 + 0.12 + doorW / 2 + i * (doorW + 0.015);
      const doorPanel = new THREE.Mesh(
        new THREE.BoxGeometry(0.022, doorLeafH, doorW - 0.015),
        wardrobeMat
      );
      doorPanel.position.set(-5.27, floorTopY + 0.11 + doorLeafH / 2, doorZ);
      doorPanel.castShadow = true;
      eastWardGroup.add(doorPanel);
    }

    scene.add(eastWardGroup);
  }

  // West Load-Bearing Cross-Wall between Main Bedroom and Family Bathroom / Upper Passage (0.24m thick, X = -9.56m..-9.80m)
  // Doorway at Z = +1.55m (with 2 oak steps UP into Main Bedroom as marked 'UP' on the First Floor plan!)
  addUpperInteriorWall(-9.68, floorTopY, upperWallTopY, -0.7, 0.24, 3.6, warmRoomPlasterMat);
  addUpperInteriorWall(-9.68, floorTopY, upperWallTopY, 2.18, 0.24, 0.36, warmRoomPlasterMat);
  addUpperInteriorWall(-9.68, floorTopY + doorH, upperWallTopY, 1.55, 0.24, 0.9, warmRoomPlasterMat);
  addUpperInteractiveDoor('z', -9.68, 0.24, 1.55, 0.9, Math.PI * 0.48);

  // Oak Step Threshold (`UP` steps at the Main Bedroom entrance doorway `X = -9.68m, Z = +1.55m`)
  {
    const stepMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.045, 0.88),
      oakFloorMat
    );
    stepMesh.name = 'mainBedroom.entranceStep';
    stepMesh.position.set(-9.68, floorTopY + 0.0225, 1.55);
    stepMesh.receiveShadow = true;
    scene.add(stepMesh);
  }

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
