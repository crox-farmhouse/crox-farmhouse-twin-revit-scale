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
  // Flush continuous exterior brickwork with Chimney Breast projecting INSIDE Bedroom 4 (X = -20.45m..-19.25m, rising to collarCeilingY = 4.52m)
  addUpperExteriorBrickWall(-22.47, -17.11, 11.49, 11.77, floorBaseY - 0.12, upperWallTopY, 'north', {
    skipSkirting: true,
  });

  // Issue #6 & #7: Full-span vaulted upper gable on Bedroom 4 South Wall (Y = 4.14m..4.545m),
  // overlapping 2cm into the lower wall and 2.5cm into the vaulted ceiling slab with a 3-segment cutaway cap to prevent directional shadow-map light leakage!
  {
    const southGableDescriptor = {
      axis: 'z' as const,
      coord: 11.63,
      minSpan: -22.47,
      maxSpan: -17.11,
      floor: 'first' as const,
    };
    const southGableShape = new THREE.Shape();
    southGableShape.moveTo(-22.25, upperWallTopY - 0.02);
    southGableShape.lineTo(-17.22, upperWallTopY - 0.02);
    southGableShape.lineTo(-17.22, upperWallTopY + 0.025);
    southGableShape.lineTo(-18.75, collarCeilingY + 0.025);
    southGableShape.lineTo(-20.85, collarCeilingY + 0.025);
    southGableShape.lineTo(-22.25, upperWallTopY + 0.025);
    southGableShape.closePath();
    const southGableGeo = new THREE.ExtrudeGeometry(southGableShape, {
      depth: 0.24,
      bevelEnabled: false,
    });
    southGableGeo.translate(0, 0, 11.49);
    const southUpperGable = new THREE.Mesh(southGableGeo, warmRoomPlasterMat);
    southUpperGable.name = 'bedroom4.southWallUpperGable';
    southUpperGable.userData.isArchitecturalShell = true;
    southUpperGable.castShadow = true;
    southUpperGable.receiveShadow = true;
    tagUpperCutawayWall(southUpperGable, southGableDescriptor);
    scene.add(southUpperGable);

    for (const [x0, y0, x1, y1] of [
      [-22.25, upperWallTopY, -20.85, collarCeilingY],
      [-20.85, collarCeilingY, -18.75, collarCeilingY],
      [-18.75, collarCeilingY, -17.22, upperWallTopY],
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

  // Bedroom 4 South Chimney Breast rising cleanly to the 4.52m collar ceiling
  addUpperInteriorWall(-19.85, floorTopY, collarCeilingY, 11.29, 1.2, 0.4, warmRoomPlasterMat, {
    skipSkirting: true,
  });
  const bed4ChimneyCap = new THREE.Mesh(
    new THREE.BoxGeometry(1.204, 0.025, 0.404),
    wallCapMat
  );
  bed4ChimneyCap.userData.isArchitecturalShell = true;
  bed4ChimneyCap.position.set(-19.85, collarCeilingY + 0.012, 11.29);
  scene.add(bed4ChimneyCap);

  // East Courtyard Exterior Brick Wall of Bedroom 4 (X = -17.39m..-17.11m, Z = +8.15m..+11.77m, Y = 2.00m..4.16m)
  addUpperExteriorBrickWall(-17.39, -17.11, 8.15, 11.77, floorBaseY, upperWallTopY, 'west', {
    skipSkirting: true,
  });

  // Issue #8: Full-Height Vaulted 3-Door Shaker Built-In Wardrobe along the South Gable Wall East of the Chimney Breast
  // (`X = -19.25m..-17.39m, Z = +10.85m..+11.49m`), rising all the way to Bedroom 4's vaulted ceiling (`Y = 4.52m` collar + East skeiling)
  {
    const cupGroup = new THREE.Group();
    cupGroup.name = 'bedroom4.southEastCupboards';
    const cupMinX = -19.25;
    const cupMaxX = -17.39;
    const collarEastX = -18.75;
    const skeilingEastX = -17.22;
    const cupD = 0.62; // Z = +10.86m .. +11.48m
    const centerZ = 11.17;

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

    // 2-segment moulded Shaker top crown cornice following the horizontal collar (`-19.25m..-18.75m`) and East skeiling (`-18.75m..-17.39m`)
    const corniceH = 0.044;
    for (const [x0, x1] of [
      [cupMinX, collarEastX],
      [collarEastX, cupMaxX],
    ] as const) {
      const y0 = getVaultCeilingYAtX(x0);
      const y1 = getVaultCeilingYAtX(x1);
      const segLen = Math.hypot(x1 - x0, y1 - y0);
      const segAngle = Math.atan2(y1 - y0, x1 - x0);
      const corniceSeg = new THREE.Mesh(
        new THREE.BoxGeometry(segLen + 0.008, corniceH, cupD + 0.024),
        wardrobeMat
      );
      corniceSeg.name = 'bedroom4.southEastCupboards.cornice';
      corniceSeg.position.set(
        (x0 + x1) / 2,
        (y0 + y1) / 2 - corniceH / 2,
        centerZ - 0.008
      );
      corniceSeg.rotation.z = segAngle;
      corniceSeg.castShadow = true;
      corniceSeg.receiveShadow = true;
      cupGroup.add(corniceSeg);
    }

    // Three full-height vaulted Shaker wardrobe doors (`door_1`, `door_2`, `door_3`) rising right up to the vaulted ceiling (Issue #8)
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

  // Issue #4, #5 & #7: Continuous 45°-mitred skirting along Bedroom 4 North-East Pier (`Z = 8.39m`), East Wall, South Alcove Cupboards, Chimney Breast, and SW Alcove
  {
    const eastWallSlope = (-17.25 - -16.82) / (11.77 - 2.4);
    const getEastInnerX = (wz: number): number =>
      -16.82 + eastWallSlope * (wz - 2.4) - 0.14;

    const bed4SouthMitredSkirt = new THREE.Mesh(
      buildMitredWallSkirtingGeometry(
        [
          [-17.276, 8.39],
          [getEastInnerX(8.39), 8.39],
          [getEastInnerX(10.85), 10.85],
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
    bed4SouthMitredSkirt.userData.isArchitecturalShell = true;
    bed4SouthMitredSkirt.castShadow = true;
    bed4SouthMitredSkirt.receiveShadow = true;
    scene.add(bed4SouthMitredSkirt);
  }
}
