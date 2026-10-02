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
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'antiqueOakSkirtingMat' | 'exteriorBrickMat' | 'floorTopY' | 'oakFloorMat' | 'upperWallTopY' | 'wardrobeMat' | 'warmRoomPlasterMat'> &
    Pick<ReturnType<typeof createFirstFloorShellKit>, 'addFirstFloorSlab' | 'addShakerWardrobeDoor' | 'addUpperBrickWallAlongXWithWindow' | 'addUpperExteriorBrickWall' | 'addUpperInteractiveDoor' | 'addUpperInteriorWall' | 'applyWorldSpaceBrickUVs' | 'tagUpperCutawayWall'>
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
    applyWorldSpaceBrickUVs,
    exteriorBrickMat,
    floorTopY,
    oakFloorMat,
    tagUpperCutawayWall,
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
  // `skipCap: true` so the lower brick wall merges seamlessly into `mainBedroom.eastWallBrickGable` (`Y = 4.16m..5.02m`)!
  addUpperInteriorWall(-4.63, floorTopY, 3.08, 1.585, 0.02, 1.53, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });
  addUpperExteriorBrickWall(-4.64, -4.4, -2.78, 2.68, 3.08, upperWallTopY, 'west', {
    skipSkirting: true,
    skipCap: true,
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
    3.04,
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
    3.04,
    3.94,
    'north',
    3,
    { skipSkirting: true }
  );

  // Issue #1: High vaulted collar ceiling in the Main Bedroom (`collarCeilingY = 5.02m`, +0.50m higher than the
  // 4.52m landing/bathroom ceiling, following the roof line across `Z = -1.15m..+1.05m` and giving 2.68m headroom above the 2.34m floor!)
  const collarCeilingY = 5.02;
  const collarNorthZ = -1.15;
  const collarSouthZ = 1.05;

  // =========================================================================
  // FULL-WIDTH BANK OF 4 BUILT-IN SHAKER WARDROBES ALONG THE EAST WALL
  // (`X = -5.26m..-4.64m, Z = -2.50m..+2.40m`, facing West `-X` into Main Bedroom)
  // Issues #1 & #8: Continuous full-height Shaker wardrobe carcass (`wardrobeMat`) and
  // 8 ceiling-height Shaker doors (raked outer doors under the North/South skeilings +
  // full-height central doors under the 5.02m collar ceiling) rising all the way to the ceiling!
  // =========================================================================
  {
    const eastWardGroup = new THREE.Group();
    eastWardGroup.name = 'mainBedroom.eastWardrobes';
    const wardD = 0.62; // X = -5.26m .. -4.64m

    const getVaultCeilingYAtZ = (z: number): number => {
      if (z < collarNorthZ) {
        return (
          upperWallTopY +
          ((z - -2.5) / (collarNorthZ - -2.5)) * (collarCeilingY - upperWallTopY)
        );
      }
      if (z > collarSouthZ) {
        return (
          collarCeilingY -
          ((z - collarSouthZ) / (2.4 - collarSouthZ)) * (collarCeilingY - upperWallTopY)
        );
      }
      return collarCeilingY;
    };

    // Full-height vaulted wardrobe carcass (`Y = floorTopY..collarCeilingY`, `Z = -2.50m..+2.40m`)
    const carcassShape = new THREE.Shape();
    carcassShape.moveTo(-2.5, floorTopY);
    carcassShape.lineTo(2.4, floorTopY);
    carcassShape.lineTo(2.4, upperWallTopY + 0.02);
    carcassShape.lineTo(collarSouthZ, collarCeilingY + 0.015);
    carcassShape.lineTo(collarNorthZ, collarCeilingY + 0.015);
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
      [-2.5, upperWallTopY + 0.008, collarNorthZ, collarCeilingY],
      [collarNorthZ, collarCeilingY, collarSouthZ, collarCeilingY],
      [collarSouthZ, collarCeilingY, 2.4, upperWallTopY + 0.008],
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
    // - Doors 1 & 2: Z = -2.44m .. -1.156m (raked under North skeiling)
    // - Doors 3..6: Z = -1.144m .. +1.044m (full-height under 5.02m flat collar)
    // - Doors 7 & 8: Z = +1.056m .. +2.34m (raked under South skeiling)
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

  // West Load-Bearing Cross-Wall between Main Bedroom (Y = 2.34m) and Family Bathroom / Upper Passage (Y = 2.16m)
  // Solid wall piers start at passageFloorTopY = 2.16m so the West (-X) face in the Family Bathroom & Upper Passage reaches their 2.16m floor!
  const passageFloorTopY = 2.16;
  const mainBedDoorH = 1.72;
  addUpperInteriorWall(-9.68, passageFloorTopY, upperWallTopY, -0.7, 0.24, 3.6, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });
  addUpperInteriorWall(-9.68, passageFloorTopY, upperWallTopY, 2.2, 0.24, 0.4, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });
  addUpperInteriorWall(-9.68, floorTopY + mainBedDoorH, upperWallTopY, 1.55, 0.24, 0.9, warmRoomPlasterMat, {
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
  addUpperInteractiveDoor('z', -9.68, 0.24, 1.55, 0.9, Math.PI * 0.48, {
    frontFloorY: floorTopY,
    backFloorY: passageFloorTopY,
    doorFloorY: floorTopY,
    doorH: mainBedDoorH,
  });

  // Issue #1: 18cm (+0.18m) Solid Antique Oak Threshold Step-Up (`mainBedroom.thresholdStep`)
  // at the Main Bedroom doorway (`X_ew = -9.80m..-9.56m, Z_ew = 1.10m..2.00m`) stepping up from the
  // Upper South Passage (`Y = 2.16m`) onto the Main Bedroom floor (`Y = 2.34m`)
  {
    const stepGroup = new THREE.Group();
    stepGroup.name = 'mainBedroom.thresholdStep';
    stepGroup.userData.zone = 'mainBedroom';
    stepGroup.userData.isArchitecturalShell = true;

    const stepSpanZ = 0.864;
    const stepRiserH = floorTopY - passageFloorTopY - 0.028; // 0.152m
    const stepRiser = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, stepRiserH, stepSpanZ),
      antiqueOakSkirtingMat
    );
    stepRiser.name = 'mainBedroom.thresholdStep.riser';
    stepRiser.position.set(-9.73, passageFloorTopY + stepRiserH * 0.5, 1.55);
    stepRiser.castShadow = true;
    stepRiser.receiveShadow = true;
    stepGroup.add(stepRiser);

    const stepTread = new THREE.Mesh(
      new THREE.BoxGeometry(0.244, 0.028, stepSpanZ),
      oakFloorMat
    );
    stepTread.name = 'mainBedroom.thresholdStep.tread';
    stepTread.position.set(-9.678, floorTopY - 0.014, 1.55);
    stepTread.castShadow = true;
    stepTread.receiveShadow = true;
    stepGroup.add(stepTread);

    const bullnoseGeo = new THREE.CylinderGeometry(
      0.014,
      0.014,
      stepSpanZ,
      16,
      1,
      false,
      Math.PI,
      Math.PI
    );
    bullnoseGeo.rotateX(Math.PI / 2);
    const stepBullnose = new THREE.Mesh(bullnoseGeo, antiqueOakSkirtingMat);
    stepBullnose.name = 'mainBedroom.thresholdStep.bullnose';
    stepBullnose.position.set(-9.8, floorTopY - 0.014, 1.55);
    stepBullnose.castShadow = true;
    stepBullnose.receiveShadow = true;
    stepGroup.add(stepBullnose);

    scene.add(stepGroup);
  }

  // Issue #5, #9, #10 & Issue #1: Full-Span Trapezoidal Upper Gable Extensions on the West (X = -9.68m) Cross-Wall
  // and East Exterior Brick Gable Wall (X = -4.64m..-4.40m, Y = 4.16m..5.02m, matching Bedroom 2's full-height brick gable in cutout view!)
  {
    const gableShape = new THREE.Shape();
    gableShape.moveTo(-2.5, upperWallTopY);
    gableShape.lineTo(2.4, upperWallTopY);
    gableShape.lineTo(collarSouthZ, collarCeilingY);
    gableShape.lineTo(collarNorthZ, collarCeilingY);
    gableShape.closePath();

    // 1. West interior cross-wall upper gable (`X = -9.80m..-9.56m`, `warmRoomPlasterMat`)
    const westGableGeo = new THREE.ExtrudeGeometry(gableShape, {
      depth: 0.24,
      bevelEnabled: false,
    });
    westGableGeo.rotateY(-Math.PI / 2);
    westGableGeo.translate(-9.56, 0, 0);
    const westGableMesh = new THREE.Mesh(westGableGeo, warmRoomPlasterMat);
    westGableMesh.name = 'mainBedroom.westWallUpperGable';
    westGableMesh.userData.isArchitecturalShell = true;
    westGableMesh.castShadow = true;
    westGableMesh.receiveShadow = true;
    scene.add(westGableMesh);

    // 2. East exterior brick gable wall (`X = -4.64m..-4.40m, Y = 4.16m..5.02m`, `exteriorBrickMat`)
    //    Goes all the way to the 5.02m vaulted ceiling top in cutout view (`firstFloorMeshGroup`), just like `bedroom2.northWallBrickGable`!
    const eastGableCutawayDesc = {
      axis: 'x' as const,
      coord: -4.52,
      minSpan: -2.78,
      maxSpan: 2.68,
      floor: 'first' as const,
    };
    const eastBrickGableGeo = new THREE.ExtrudeGeometry(gableShape, {
      depth: 0.24,
      bevelEnabled: false,
    });
    eastBrickGableGeo.rotateY(-Math.PI / 2);
    eastBrickGableGeo.translate(-4.4, 0, 0);
    applyWorldSpaceBrickUVs(eastBrickGableGeo, 0, 0, 0);
    const eastBrickGable = new THREE.Mesh(eastBrickGableGeo, exteriorBrickMat);
    eastBrickGable.name = 'mainBedroom.eastWallBrickGable';
    eastBrickGable.userData.isArchitecturalShell = true;
    eastBrickGable.castShadow = true;
    eastBrickGable.receiveShadow = true;
    tagUpperCutawayWall(eastBrickGable, eastGableCutawayDesc);
    scene.add(eastBrickGable);

    // 3. East interior plaster lining (`X = -4.654m..-4.64m, Y = 4.16m..5.02m`, `warmRoomPlasterMat`)
    const eastPlasterGableGeo = new THREE.ExtrudeGeometry(gableShape, {
      depth: 0.014,
      bevelEnabled: false,
    });
    eastPlasterGableGeo.rotateY(-Math.PI / 2);
    eastPlasterGableGeo.translate(-4.64, 0, 0);
    const eastPlasterGable = new THREE.Mesh(eastPlasterGableGeo, warmRoomPlasterMat);
    eastPlasterGable.name = 'mainBedroom.eastWallUpperGable';
    eastPlasterGable.userData.isArchitecturalShell = true;
    eastPlasterGable.castShadow = true;
    eastPlasterGable.receiveShadow = true;
    tagUpperCutawayWall(eastPlasterGable, eastGableCutawayDesc);
    scene.add(eastPlasterGable);
  }

  // Issues #2 & #3: The Cotswold Company "Leafield Washed Oak Super King Size Bed" & bedside tables
  // against the East face (`X_ew = -9.56m`) of the Main Bedroom West Cross-Wall (`media_1790946394645.jpg`, `media_1790946401209.jpg`, `media_1790946407558.png`)
  buildLeafieldSuperKingBed(scene, floorTopY);
}
