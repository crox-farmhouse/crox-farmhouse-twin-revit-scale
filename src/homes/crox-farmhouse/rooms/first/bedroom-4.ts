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
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'antiqueOakSkirtingMat' | 'floorBaseY' | 'floorTopY' | 'oakFloorMat' | 'upperWallTopY' | 'wallCapMat' | 'wardrobeMat' | 'warmRoomPlasterMat' | 'windowFrameMat'> &
    Pick<ReturnType<typeof createFirstFloorShellKit>, 'addFirstFloorSlab' | 'addShakerWardrobeDoor' | 'addUpperBedroomChimneyBreastWithFireplace' | 'addUpperBrickWallAlongZWithWindow' | 'addUpperExteriorBrickWall' | 'addUpperInteriorWall' | 'tagUpperCutawayWall'>
): void {
  const { firstFloorMeshGroup: scene } = ctx;
  const {
    addFirstFloorSlab,
    addShakerWardrobeDoor,
    addUpperBedroomChimneyBreastWithFireplace,
    addUpperBrickWallAlongZWithWindow,
    addUpperExteriorBrickWall,
    antiqueOakSkirtingMat,
    floorBaseY,
    floorTopY,
    oakFloorMat,
    tagUpperCutawayWall,
    upperWallTopY,
    wallCapMat,
    wardrobeMat,
    warmRoomPlasterMat,
  } = kit;

  const collarCeilingY = 4.52;

  // =========================================================================
  // 7. BEDROOM 4 (4.95m x 3.20m / 16'3" x 10'6")
  //    Directly above Study & Study Lobby: X = -17.25m..-22.19m, Z = +8.39m..+11.49m
  // =========================================================================
  addFirstFloorSlab(-22.33, -17.15, 8.27, 11.63, oakFloorMat);

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

  // South Exterior Brick Gable Wall of Bedroom 4 (Z = +11.49m..+11.77m, X = -22.47m..-17.11m, Y = 1.88m..4.16m)
  // Interior plaster lining is built below as a single full-height vaulted polygon (`Y = 2.08m..4.52m`) so there is zero horizontal split line at Y = 4.16m!
  addUpperExteriorBrickWall(-22.47, -17.11, 11.49, 11.77, floorBaseY - 0.12, upperWallTopY, 'north', {
    skipSkirting: true,
  });

  // Issue #6 & #7: Single one-piece full-height vaulted interior plaster wall (`Y = 2.08m..4.52m`, `Z = 11.476m..11.50m`)
  // + upper gable backing (`Y = 4.16m..4.545m`, `Z = 11.49m..11.73m`, `collarEastX = -18.62m`) with 3-segment cutaway cap!
  {
    const collarEastX = -18.62;
    const southGableDescriptor = {
      axis: 'z' as const,
      coord: 11.63,
      minSpan: -22.47,
      maxSpan: -17.11,
      floor: 'first' as const,
    };

    // 1. One-piece full-height interior plaster lining (`Y = floorTopY..collarCeilingY`, `Z = 11.476m..11.50m`)
    const southInteriorPlasterShape = new THREE.Shape();
    southInteriorPlasterShape.moveTo(-22.25, floorTopY);
    southInteriorPlasterShape.lineTo(-17.22, floorTopY);
    southInteriorPlasterShape.lineTo(-17.22, upperWallTopY + 0.025);
    southInteriorPlasterShape.lineTo(collarEastX, collarCeilingY + 0.025);
    southInteriorPlasterShape.lineTo(-20.85, collarCeilingY + 0.025);
    southInteriorPlasterShape.lineTo(-22.25, upperWallTopY + 0.025);
    southInteriorPlasterShape.closePath();
    const southInteriorPlasterGeo = new THREE.ExtrudeGeometry(southInteriorPlasterShape, {
      depth: 0.024,
      bevelEnabled: false,
    });
    southInteriorPlasterGeo.translate(0, 0, 11.476);
    const southUpperGable = new THREE.Mesh(southInteriorPlasterGeo, warmRoomPlasterMat);
    southUpperGable.name = 'bedroom4.southWallUpperGable';
    southUpperGable.userData.isArchitecturalShell = true;
    southUpperGable.castShadow = true;
    southUpperGable.receiveShadow = true;
    tagUpperCutawayWall(southUpperGable, southGableDescriptor);
    scene.add(southUpperGable);

    // 2. Upper gable structural backing (`Y = 4.16m..4.545m`, `Z = 11.49m..11.73m`)
    const southGableBackingShape = new THREE.Shape();
    southGableBackingShape.moveTo(-22.25, upperWallTopY);
    southGableBackingShape.lineTo(-17.22, upperWallTopY);
    southGableBackingShape.lineTo(-17.22, upperWallTopY + 0.025);
    southGableBackingShape.lineTo(collarEastX, collarCeilingY + 0.025);
    southGableBackingShape.lineTo(-20.85, collarCeilingY + 0.025);
    southGableBackingShape.lineTo(-22.25, upperWallTopY + 0.025);
    southGableBackingShape.closePath();
    const southGableBackingGeo = new THREE.ExtrudeGeometry(southGableBackingShape, {
      depth: 0.24,
      bevelEnabled: false,
    });
    southGableBackingGeo.translate(0, 0, 11.49);
    const southGableBacking = new THREE.Mesh(southGableBackingGeo, warmRoomPlasterMat);
    southGableBacking.name = 'bedroom4.southWallUpperGable.backing';
    southGableBacking.userData.isArchitecturalShell = true;
    southGableBacking.castShadow = true;
    southGableBacking.receiveShadow = true;
    tagUpperCutawayWall(southGableBacking, southGableDescriptor);
    scene.add(southGableBacking);

    for (const [x0, y0, x1, y1] of [
      [-22.25, upperWallTopY, -20.85, collarCeilingY],
      [-20.85, collarCeilingY, collarEastX, collarCeilingY],
      [collarEastX, collarCeilingY, -17.22, upperWallTopY],
    ] as const) {
      const segLen = Math.hypot(x1 - x0, y1 - y0);
      const segAngle = Math.atan2(y1 - y0, x1 - x0);
      const capMesh = new THREE.Mesh(
        new THREE.BoxGeometry(segLen + 0.01, 0.025, 0.244),
        wallCapMat
      );
      capMesh.userData.isArchitecturalShell = true;
      capMesh.position.set((x0 + x1) / 2, (y0 + y1) / 2 + 0.012, 11.61);
      capMesh.rotation.z = segAngle;
      tagUpperCutawayWall(capMesh, southGableDescriptor);
      scene.add(capMesh);
    }
  }

  // Issue #2: Bedroom 4 South Chimney Breast rising cleanly to the 4.52m collar ceiling with compact 1800s black cast-iron fireplace & small black hearth
  addUpperBedroomChimneyBreastWithFireplace(scene, {
    namePrefix: 'bedroom4.southChimneyBreast',
    zone: 'bedroom4',
    x: -19.85,
    z: 11.29,
    width: 1.2,
    depth: 0.4,
    floorY: floorTopY,
    topY: collarCeilingY,
  });

  // East Courtyard Exterior Brick Wall of Bedroom 4 (X = -17.39m..-17.11m, Z = +8.15m..+11.77m, Y = 2.00m..4.16m)
  addUpperExteriorBrickWall(-17.39, -17.11, 8.15, 11.77, floorBaseY, upperWallTopY, 'west', {
    skipSkirting: true,
  });

  // Issue #7 & #8: Full-Height Vaulted 3-Door Shaker Built-In Wardrobe along the South Gable Wall East of the Chimney Breast
  // (`X = -19.25m..-17.39m, Z = +10.85m..+11.49m`), rising all the way to Bedroom 4's vaulted ceiling (`Y = 4.52m` collar + East skeiling).
  // `collarEastX = -18.62m` aligns with the exact dividing stile between `door_1` and `door_2`, so `door_1` is 100% flat-topped
  // and `door_2`/`door_3` are 100% sloped, with a single one-piece ExtrudeGeometry cornice that never intersects `door_1.rail`!
  {
    const cupGroup = new THREE.Group();
    cupGroup.name = 'bedroom4.southEastCupboards';
    const cupMinX = -19.25;
    const cupMaxX = -17.39;
    const collarEastX = -18.62;
    const skeilingEastX = -17.22;
    const cupD = 0.62; // Z = +10.86m .. +11.48m

    const getVaultCeilingYAtX = (wx: number): number => {
      if (wx <= collarEastX) return collarCeilingY;
      const t = (wx - collarEastX) / (skeilingEastX - collarEastX);
      return collarCeilingY - t * (collarCeilingY - upperWallTopY);
    };

    // Full-height vaulted wardrobe carcass (`Y = floorTopY..getVaultCeilingYAtX(x)`)
    const carcassShape = new THREE.Shape();
    carcassShape.moveTo(cupMinX + 0.01, floorTopY);
    carcassShape.lineTo(cupMaxX - 0.01, floorTopY);
    carcassShape.lineTo(cupMaxX - 0.01, getVaultCeilingYAtX(cupMaxX - 0.01));
    carcassShape.lineTo(collarEastX, collarCeilingY);
    carcassShape.lineTo(cupMinX + 0.01, collarCeilingY);
    carcassShape.closePath();
    const carcassGeo = new THREE.ExtrudeGeometry(carcassShape, {
      depth: cupD,
      bevelEnabled: false,
    });
    carcassGeo.translate(0, 0, 10.86);
    const carcass = new THREE.Mesh(carcassGeo, wardrobeMat);
    carcass.name = 'bedroom4.southEastCupboards.carcass';
    carcass.castShadow = true;
    carcass.receiveShadow = true;
    cupGroup.add(carcass);

    // Single one-piece moulded Shaker top crown cornice (`Z = 10.825m..10.865m`) following the horizontal collar (`-19.25m..-18.62m`) and East skeiling (`-18.62m..-17.39m`)
    const corniceH = 0.044;
    const eastTopY = getVaultCeilingYAtX(cupMaxX);
    const corniceShape = new THREE.Shape();
    corniceShape.moveTo(cupMinX, collarCeilingY - corniceH);
    corniceShape.lineTo(collarEastX, collarCeilingY - corniceH);
    corniceShape.lineTo(cupMaxX, eastTopY - corniceH);
    corniceShape.lineTo(cupMaxX, eastTopY);
    corniceShape.lineTo(collarEastX, collarCeilingY);
    corniceShape.lineTo(cupMinX, collarCeilingY);
    corniceShape.closePath();
    const corniceGeo = new THREE.ExtrudeGeometry(corniceShape, {
      depth: 0.04,
      bevelEnabled: false,
    });
    corniceGeo.translate(0, 0, 10.825);
    const corniceSeg = new THREE.Mesh(corniceGeo, wardrobeMat);
    corniceSeg.name = 'bedroom4.southEastCupboards.cornice';
    corniceSeg.castShadow = true;
    corniceSeg.receiveShadow = true;
    cupGroup.add(corniceSeg);

    // Three full-height vaulted Shaker wardrobe doors (`door_1`, `door_2`, `door_3`) rising cleanly 2mm below the one-piece cornice (Issue #7 & #8)
    const numDoors = 3;
    const totalDoorSpan = 1.78; // X = -19.21m .. -17.43m
    const bayW = totalDoorSpan / numDoors;
    const doorBaseY = floorTopY + 0.15;
    const corniceClearance = 0.046;
    const handleSides = ['right', 'left', 'left'] as const;

    for (let i = 0; i < numDoors; i++) {
      const doorWidth = bayW - 0.012;
      const doorCenterX = -19.21 + bayW * (i + 0.5);
      const xLeft = doorCenterX - doorWidth / 2;
      const xRight = doorCenterX + doorWidth / 2;
      const hLeft = getVaultCeilingYAtX(xLeft) - corniceClearance - doorBaseY;
      const hRight = getVaultCeilingYAtX(xRight) - corniceClearance - doorBaseY;
      const maxDoorH = Math.max(hLeft, hRight);

      addShakerWardrobeDoor(cupGroup, {
        x: doorCenterX,
        y: doorBaseY + maxDoorH / 2,
        z: 10.847,
        width: doorWidth,
        height: maxDoorH,
        heightLeft: hLeft,
        heightRight: hRight,
        alongZ: false,
        normalSign: -1,
        handleSide: handleSides[i],
        namePrefix: `bedroom4.southEastCupboards.door_${i + 1}`,
      });
    }

    scene.add(cupGroup);
  }

  // Issue #2, #4, #5 & #7: Continuous 45°-mitred skirting along Bedroom 4 North-East Pier (`Z = 8.39m`), East Wall, South Alcove Cupboards,
  // Chimney Breast, and SW Alcove, terminating cleanly against the East (`X = -19.57m`) and West (`X = -20.13m`) jambs of the compact 1800s black fireplace!
  {
    const eastWallSlope = (-17.25 - -16.82) / (11.77 - 2.4);
    const getEastInnerX = (wz: number): number =>
      -16.82 + eastWallSlope * (wz - 2.4) - 0.14;

    for (const [skirtName, path] of [
      [
        'bedroom4.southWallMitredSkirting',
        [
          [-17.276, 8.39],
          [getEastInnerX(8.39), 8.39],
          [getEastInnerX(10.85), 10.85],
          [-19.25, 10.85],
          [-19.25, 11.09],
          [-19.57, 11.09],
        ] as const,
      ],
      [
        'bedroom4.southWestWallMitredSkirting',
        [
          [-20.13, 11.09],
          [-20.45, 11.09],
          [-20.45, 11.476],
          [-22.19, 11.476],
        ] as const,
      ],
    ] as const) {
      const skirtMesh = new THREE.Mesh(
        buildMitredWallSkirtingGeometry(path, floorTopY),
        antiqueOakSkirtingMat
      );
      skirtMesh.name = skirtName;
      skirtMesh.userData.isArchitecturalShell = true;
      skirtMesh.castShadow = true;
      skirtMesh.receiveShadow = true;
      scene.add(skirtMesh);
    }
  }
}
