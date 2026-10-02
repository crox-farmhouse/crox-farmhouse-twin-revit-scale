import * as THREE from 'three';
import { buildMitredWallSkirtingGeometry } from '../../../../engine/geometry/index.ts';
import { buildLeafieldSuperKingBed } from './leafield-super-king-bed.ts';
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
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'antiqueOakSkirtingMat' | 'floorTopY' | 'oakFloorMat' | 'upperWallTopY' | 'wardrobeMat' | 'warmRoomPlasterMat'> &
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
    floorTopY,
    oakFloorMat,
    upperWallTopY,
    wardrobeMat,
    warmRoomPlasterMat,
  } = kit;
  // =========================================================================
  // 1. MAIN BEDROOM (5.00m x 4.55m / 16'5" x 14'11")
  //    Directly above Family Room: X = -4.64m..-9.56m, Z = -2.50m..+2.40m
  // =========================================================================
  addFirstFloorSlab(-9.68, -4.52, -2.64, 2.54, oakFloorMat);

  // East Cross-Wall of Main Bedroom (X = -4.64m..-4.40m, Z = -2.78m..+2.68m)
  addUpperInteriorWall(-4.63, floorTopY, 3.08, 1.585, 0.02, 1.53, warmRoomPlasterMat, {
    skipSkirting: true,
  });
  addUpperExteriorBrickWall(-4.64, -4.4, -2.78, 2.68, 3.08, upperWallTopY, 'west', {
    skipSkirting: true,
  });

  // North Exterior Brick Wall of Main Bedroom (Z = -2.78m..-2.50m, X = -9.56m..-4.40m) with casement window
  // Skirting is emitted below via `mainBedroom.perimeterMitredSkirting` for 45°-mitred corners
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
    { skipSkirting: true }
  );

  // South Courtyard Exterior Brick Wall of Main Bedroom (Z = +2.40m..+2.68m, X = -9.56m..-4.40m)
  // Aligned 100% collinearly with Ground Floor Family Room South wall (Z = 2.40m..2.68m) and Upper Passage South wall (Issue #2)!
  addUpperBrickWallAlongXWithWindow(
    -9.56,
    -4.4,
    2.4,
    2.68,
    -6.85,
    1.55,
    2.92,
    3.94,
    'north',
    3,
    { skipSkirting: true }
  );

  const collarCeilingY = 4.52;

  // =========================================================================
  // FULL-WIDTH BANK OF 4 BUILT-IN SHAKER WARDROBES ALONG THE EAST WALL
  // (`X = -5.26m..-4.64m, Z = -2.50m..+2.40m`, facing West `-X` into Main Bedroom)
  // Issues #1 & #8: Continuous full-height Shaker wardrobe carcass (`wardrobeMat`) and
  // 8 ceiling-height Shaker doors (raked outer doors under the North/South skeilings +
  // full-height central doors under the 4.52m collar ceiling) rising all the way to the ceiling!
  // =========================================================================
  {
    const eastWardGroup = new THREE.Group();
    eastWardGroup.name = 'mainBedroom.eastWardrobes';
    const wardD = 0.62; // X = -5.26m .. -4.64m

    const getVaultCeilingYAtZ = (z: number): number => {
      if (z < -1.15) {
        return (
          upperWallTopY +
          ((z - -2.5) / (-1.15 - -2.5)) * (collarCeilingY - upperWallTopY)
        );
      }
      if (z > 1.05) {
        return (
          collarCeilingY -
          ((z - 1.05) / (2.4 - 1.05)) * (collarCeilingY - upperWallTopY)
        );
      }
      return collarCeilingY;
    };

    // Full-height vaulted wardrobe carcass (`Y = floorTopY..collarCeilingY`, `Z = -2.50m..+2.40m`)
    const carcassShape = new THREE.Shape();
    carcassShape.moveTo(-2.5, floorTopY);
    carcassShape.lineTo(2.4, floorTopY);
    carcassShape.lineTo(2.4, upperWallTopY + 0.02);
    carcassShape.lineTo(1.05, collarCeilingY + 0.015);
    carcassShape.lineTo(-1.15, collarCeilingY + 0.015);
    carcassShape.lineTo(-2.5, upperWallTopY + 0.02);
    carcassShape.closePath();
    const carcassGeo = new THREE.ExtrudeGeometry(carcassShape, {
      depth: wardD,
      bevelEnabled: false,
    });
    carcassGeo.rotateY(-Math.PI / 2);
    carcassGeo.translate(-4.64, 0, 0);
    const carcass = new THREE.Mesh(carcassGeo, wardrobeMat);
    carcass.name = 'mainBedroom.eastWardrobes.carcass';
    carcass.castShadow = true;
    carcass.receiveShadow = true;
    eastWardGroup.add(carcass);

    // Raked Shaker crown cornice moulding following the vaulted ceiling profile along the front of the wardrobes (`X = -5.28m..-5.24m`)
    for (const [z0, y0, z1, y1] of [
      [-2.5, upperWallTopY + 0.008, -1.15, collarCeilingY],
      [-1.15, collarCeilingY, 1.05, collarCeilingY],
      [1.05, collarCeilingY, 2.4, upperWallTopY + 0.008],
    ] as const) {
      const segLen = Math.hypot(z1 - z0, y1 - y0);
      const segAngle = Math.atan2(y1 - y0, z1 - z0);
      const corniceSeg = new THREE.Mesh(
        new THREE.BoxGeometry(0.036, 0.044, segLen + 0.02),
        wardrobeMat
      );
      corniceSeg.name = 'mainBedroom.eastWardrobes.cornice';
      corniceSeg.position.set(-5.26 - 0.008, (y0 + y1) / 2 - 0.02, (z0 + z1) / 2);
      corniceSeg.rotation.x = -segAngle;
      corniceSeg.castShadow = true;
      eastWardGroup.add(corniceSeg);
    }

    // 8 ceiling-height Shaker wardrobe doors (4 pairs of double doors) aligned with the vaulted ceiling segments:
    // - Bay 0 (Doors 1 & 2): Z = -2.44m .. -1.15m (raked under North skeiling)
    // - Bays 1 & 2 (Doors 3..6): Z = -1.15m .. +1.05m (full-height under 4.52m flat collar)
    // - Bay 3 (Doors 7 & 8): Z = +1.05m .. +2.34m (raked under South skeiling)
    const doorIntervals: ReadonlyArray<readonly [number, number]> = [
      [-2.44, -1.801],
      [-1.789, -1.156],
      [-1.144, -0.604],
      [-0.592, -0.056],
      [-0.044, 0.492],
      [0.504, 1.044],
      [1.056, 1.689],
      [1.701, 2.34],
    ];
    const doorBaseY = floorTopY + 0.15;
    const corniceClearance = 0.042;
    for (let i = 0; i < doorIntervals.length; i++) {
      const [z0, z1] = doorIntervals[i];
      const doorW = z1 - z0;
      const doorZ = (z0 + z1) / 2;
      const hLeft = getVaultCeilingYAtZ(z0) - corniceClearance - doorBaseY;
      const hRight = getVaultCeilingYAtZ(z1) - corniceClearance - doorBaseY;
      const maxDoorH = Math.max(hLeft, hRight);
      addShakerWardrobeDoor(eastWardGroup, {
        x: -5.273,
        y: doorBaseY + maxDoorH / 2,
        z: doorZ,
        width: doorW,
        height: maxDoorH,
        heightLeft: hLeft,
        heightRight: hRight,
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
    skipCap: true,
  });
  addUpperInteriorWall(-9.68, floorTopY, upperWallTopY, 2.2, 0.24, 0.4, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });
  addUpperInteriorWall(-9.68, floorTopY + doorH, upperWallTopY, 1.55, 0.24, 0.9, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });

  // Continuous 45°-mitred 146mm antique oak skirting around the entire Main Bedroom perimeter
  // (from North door architrave `Z = 1.018m` -> NW corner -> NE wardrobe corner -> SE wardrobe corner -> SW corner -> South door architrave `Z = 2.082m`)
  {
    const mainBedPerimeterSkirt = new THREE.Mesh(
      buildMitredWallSkirtingGeometry(
        [
          [-9.56, 1.018],
          [-9.56, -2.5],
          [-5.26, -2.5],
          [-5.26, 2.4],
          [-9.56, 2.4],
          [-9.56, 2.082],
        ],
        floorTopY
      ),
      antiqueOakSkirtingMat
    );
    mainBedPerimeterSkirt.name = 'mainBedroom.perimeterMitredSkirting';
    mainBedPerimeterSkirt.userData.isArchitecturalShell = true;
    mainBedPerimeterSkirt.castShadow = true;
    mainBedPerimeterSkirt.receiveShadow = true;
    scene.add(mainBedPerimeterSkirt);
  }
  addUpperInteractiveDoor('z', -9.68, 0.24, 1.55, 0.9, Math.PI * 0.48);

  // Issue #5, #9 & #10: Full-Span Trapezoidal Upper Gable Extensions on the West (X = -9.68m) and East (X = -4.64m..-4.61m) Cross-Walls (Y = 4.16m..4.52m)
  // Using `rotateY(-Math.PI / 2)` so Shape X maps directly to `+z_ew` (`-2.50m..+2.40m` at `Y = 4.16m` pitching to `-1.15m..+1.05m` at `Y = 4.52m`) with zero gap or exterior Z-fighting!
  for (const [gableMaxX, gableDepth, gableName] of [
    [-9.56, 0.24, 'mainBedroom.westWallUpperGable'],
    [-4.61, 0.03, 'mainBedroom.eastWallUpperGable'],
  ] as const) {
    const gableShape = new THREE.Shape();
    gableShape.moveTo(-2.5, upperWallTopY);
    gableShape.lineTo(2.4, upperWallTopY);
    gableShape.lineTo(1.05, collarCeilingY);
    gableShape.lineTo(-1.15, collarCeilingY);
    gableShape.closePath();
    const gableGeo = new THREE.ExtrudeGeometry(gableShape, {
      depth: gableDepth,
      bevelEnabled: false,
    });
    gableGeo.rotateY(-Math.PI / 2);
    gableGeo.translate(gableMaxX, 0, 0);
    const gableMesh = new THREE.Mesh(gableGeo, warmRoomPlasterMat);
    gableMesh.name = gableName;
    gableMesh.userData.isArchitecturalShell = true;
    gableMesh.castShadow = true;
    gableMesh.receiveShadow = true;
    scene.add(gableMesh);
  }

  // Issues #2 & #3: The Cotswold Company "Leafield Washed Oak Super King Size Bed" & bedside tables
  // against the East face (`X_ew = -9.56m`) of the Main Bedroom West Cross-Wall (`media_1790946394645.jpg`, `media_1790946401209.jpg`, `media_1790946407558.png`)
  buildLeafieldSuperKingBed(scene, floorTopY);
}
