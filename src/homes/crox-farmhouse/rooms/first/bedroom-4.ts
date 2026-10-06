import * as THREE from 'three';
import { buildKingCastIronBed } from './king-cast-iron-bed.ts';
import { buildMitredWallSkirtingGeometry } from '../../../../engine/geometry/index.ts';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import type { createFirstFloorMaterials } from '../../structure/first-floor-materials.ts';
import type { createFirstFloorShellKit } from '../../structure/first-floor-shell-kit.ts';

function ensureNamedAddedChildren(
  parent: THREE.Object3D,
  startIdx: number,
  prefix: string,
  tagSmallDetails = false
): void {
  let meshCount = 0;
  let groupCount = 0;
  for (let i = startIdx; i < parent.children.length; i++) {
    const child = parent.children[i]!;
    child.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        if (!node.name) {
          meshCount += 1;
          node.name = `${prefix}.mesh_${meshCount}`;
        }
        const geo = node.geometry as THREE.BufferGeometry | undefined;
        if (geo && !geo.boundingSphere) {
          geo.computeBoundingSphere();
        }
        if (
          tagSmallDetails &&
          !node.userData?.isArchitecturalShell &&
          !node.userData?.isCutawayWall &&
          geo?.boundingSphere &&
          geo.boundingSphere.radius < 0.08
        ) {
          node.userData.lodTier = 'high';
          node.userData.lodMaxDistance = 12;
        }
      } else if (node instanceof THREE.Group && !node.name) {
        groupCount += 1;
        node.name = groupCount === 1 && node === child ? prefix : `${prefix}.group_${groupCount}`;
      }
    });
  }
}

/**
 * Bedroom 4 (`bedroom4`).
 */
export function buildBedroom4(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'antiqueOakSkirtingMat' | 'exteriorBrickMat' | 'floorBaseY' | 'floorTopY' | 'oakFloorMat' | 'upperWallTopY' | 'wallCapMat' | 'wardrobeMat' | 'warmRoomPlasterMat' | 'windowFrameMat'> &
    Pick<ReturnType<typeof createFirstFloorShellKit>, 'addFirstFloorSlab' | 'addShakerWardrobeDoor' | 'addUpperBedroomChimneyBreastWithFireplace' | 'addUpperBrickWallAlongZWithWindow' | 'addUpperExteriorBrickWall' | 'addUpperInteriorWall' | 'applyWorldSpaceBrickUVs' | 'tagUpperCutawayWall'>
): void {
  const { firstFloorMeshGroup: scene } = ctx;
  const {
    addFirstFloorSlab,
    addShakerWardrobeDoor,
    addUpperBedroomChimneyBreastWithFireplace,
    addUpperBrickWallAlongZWithWindow,
    addUpperExteriorBrickWall,
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

  const collarCeilingY = 5.02;

  // =========================================================================
  // 7. BEDROOM 4 (4.95m x 3.20m / 16'3" x 10'6")
  //    Directly above Study & Study Lobby: X = -17.25m..-22.19m, Z = +8.39m..+11.49m
  // =========================================================================
  {
    const idx = scene.children.length;
    addFirstFloorSlab(-22.33, -17.15, 8.27, 11.63, oakFloorMat);
    ensureNamedAddedChildren(scene, idx, 'bedroom4.floorSlab');
  }

  // West Front Exterior Brick Wall of Bedroom 4 (X = -22.47m..-22.19m, Z = +8.39m..+11.49m, Y = 2.06m..4.16m)
  // Stops at Z = +11.49m so the South Gable Wall (Z = +11.49m..+11.77m) owns the SW corner with zero coplanar overlap/dithering (Issue #4)!
  {
    const idx = scene.children.length;
    addUpperBrickWallAlongZWithWindow(
      -22.47,
      -22.19,
      8.39,
      11.49,
      9.94,
      1.35,
      2.92,
      3.94,
      'east',
      3,
      { skipSkirting: true }
    );
    ensureNamedAddedChildren(scene, idx, 'bedroom4.westExteriorWall');
  }

  // South Exterior Brick Gable Wall of Bedroom 4 (Z = +11.49m..+11.77m, X = -22.47m..-17.377m, Y = 2.06m..4.16m)
  // Starts at Y = 2.06m (exact top of Ground Floor Study South wall) and stops at X = -17.377m where the rounded bullnose SE corner begins (Issues #4 & #5)!
  {
    const idx = scene.children.length;
    addUpperExteriorBrickWall(-22.47, -17.377, 11.49, 11.77, 2.06, upperWallTopY, 'north', {
      skipSkirting: true,
      skipCap: true,
    });
    ensureNamedAddedChildren(scene, idx, 'bedroom4.southExteriorWall');
  }

  // Issue #6, #7 & #8: Single one-piece full-height vaulted interior plaster wall (`Y = 2.08m..5.02m`, `Z = 11.476m..11.49m`)
  // + full-thickness exterior brick gable (`bedroom4.southWallBrickGable`, `Y = 4.16m..5.02m`, `Z = 11.49m..11.77m`, `collarEastX = -18.62m`)
  // going all the way up to the 5.02m vaulted ceiling top in cutout view (`firstFloorMeshGroup`), just like Bedroom 2!
  {
    const collarEastX = -18.62;
    const southGableDescriptor = {
      axis: 'z' as const,
      coord: 11.63,
      minSpan: -22.47,
      maxSpan: -17.097,
      floor: 'first' as const,
    };

    // 1. One-piece full-height interior plaster lining (`Y = floorTopY..collarCeilingY`, `Z = 11.476m..11.49m`)
    const southInteriorPlasterShape = new THREE.Shape();
    southInteriorPlasterShape.moveTo(-22.19, floorTopY);
    southInteriorPlasterShape.lineTo(-17.22, floorTopY);
    southInteriorPlasterShape.lineTo(-17.22, upperWallTopY);
    southInteriorPlasterShape.lineTo(collarEastX, collarCeilingY);
    southInteriorPlasterShape.lineTo(-20.85, collarCeilingY);
    southInteriorPlasterShape.lineTo(-22.19, upperWallTopY);
    southInteriorPlasterShape.closePath();
    const southInteriorPlasterGeo = new THREE.ExtrudeGeometry(southInteriorPlasterShape, {
      depth: 0.014,
      bevelEnabled: false,
    });
    southInteriorPlasterGeo.translate(0, 0, 11.476);
    southInteriorPlasterGeo.computeBoundingSphere();
    const southUpperGable = new THREE.Mesh(southInteriorPlasterGeo, warmRoomPlasterMat);
    southUpperGable.name = 'bedroom4.southWallUpperGable';
    southUpperGable.userData.isArchitecturalShell = true;
    southUpperGable.castShadow = true;
    southUpperGable.receiveShadow = true;
    tagUpperCutawayWall(southUpperGable, southGableDescriptor);
    scene.add(southUpperGable);

    // 2. Full-thickness exterior brick gable wall (`Y = 4.16m..5.02m`, `Z = 11.49m..11.77m`, spanning full width `-22.47m..-17.11m` at eaves)
    const southBrickGableShape = new THREE.Shape();
    southBrickGableShape.moveTo(-22.47, upperWallTopY);
    southBrickGableShape.lineTo(-17.11, upperWallTopY);
    southBrickGableShape.lineTo(collarEastX, collarCeilingY);
    southBrickGableShape.lineTo(-20.99, collarCeilingY);
    southBrickGableShape.closePath();
    const southBrickGableGeo = new THREE.ExtrudeGeometry(southBrickGableShape, {
      depth: 0.28,
      bevelEnabled: false,
    });
    southBrickGableGeo.translate(0, 0, 11.49);
    applyWorldSpaceBrickUVs(southBrickGableGeo, 0, 0, 0);
    southBrickGableGeo.computeBoundingSphere();
    const southBrickGable = new THREE.Mesh(southBrickGableGeo, exteriorBrickMat);
    southBrickGable.name = 'bedroom4.southWallBrickGable';
    southBrickGable.userData.isArchitecturalShell = true;
    southBrickGable.castShadow = true;
    southBrickGable.receiveShadow = true;
    tagUpperCutawayWall(southBrickGable, southGableDescriptor);
    scene.add(southBrickGable);
  }

  // Issue #2 & #8: Bedroom 4 South Chimney Breast rising cleanly to the 5.02m collar ceiling (`Z = 11.09m..11.476m` flush against `southWallUpperGable` with zero overlap)
  {
    const idx = scene.children.length;
    addUpperBedroomChimneyBreastWithFireplace(scene, {
      namePrefix: 'bedroom4.southChimneyBreast',
      zone: 'bedroom4',
      x: -19.85,
      z: 11.283,
      width: 1.2,
      depth: 0.386,
      floorY: floorTopY,
      topY: collarCeilingY,
    });
    ensureNamedAddedChildren(scene, idx, 'bedroom4.southChimneyBreast');
  }

  // East Courtyard Exterior Brick Wall of Bedroom 4 (X = -17.39m..-17.11m, Z = +8.15m..+11.49m, Y = 2.06m..4.16m)
  // Stops at Z = +11.49m (`X = -17.377m..-17.097m`) where it joins the rounded bullnose SE exterior brick corner with zero overlap (Issue #5)!
  {
    const idx = scene.children.length;
    addUpperExteriorBrickWall(-17.39, -17.11, 8.15, 11.49, 2.06, upperWallTopY, 'west', {
      skipSkirting: true,
    });
    ensureNamedAddedChildren(scene, idx, 'bedroom4.eastExteriorWall');
  }

  // Issue #5: Rounded Bullnose South-East Exterior Brick Corner on First Floor (`r = 0.28m`, centered at `X = -17.377m, Z = +11.49m`, `Y = 2.06m..4.16m`)
  {
    const cornerPivotX = -17.377;
    const cornerPivotZ = 11.49;
    const cornerR = 0.28;
    const cornerBotY = 2.06;
    const cornerH = upperWallTopY - cornerBotY;
    const seCornerShape = new THREE.Shape();
    seCornerShape.moveTo(0, 0);
    seCornerShape.lineTo(0, -cornerR);
    seCornerShape.absarc(0, 0, cornerR, -Math.PI / 2, 0, false);
    seCornerShape.lineTo(0, 0);
    seCornerShape.closePath();

    const seCornerGeo = new THREE.ExtrudeGeometry(seCornerShape, {
      depth: cornerH,
      bevelEnabled: false,
      curveSegments: 24,
    });
    seCornerGeo.rotateX(-Math.PI / 2);
    seCornerGeo.translate(cornerPivotX, cornerBotY, cornerPivotZ);

    const pos = seCornerGeo.attributes.position;
    const norm = seCornerGeo.attributes.normal;
    const uv = seCornerGeo.attributes.uv;
    if (pos && norm && uv) {
      for (let i = 0; i < pos.count; i++) {
        const wx = pos.getX(i);
        const wy = pos.getY(i);
        const wz = pos.getZ(i);
        const ny = Math.abs(norm.getY(i));
        if (ny > 0.7) {
          uv.setXY(i, wx / 1.35, wz / 1.2);
        } else {
          const theta = Math.atan2(
            Math.max(0, wx - cornerPivotX),
            Math.max(0, wz - cornerPivotZ)
          );
          uv.setXY(i, (cornerPivotX + theta * cornerR) / 1.35, wy / 1.2);
        }
      }
      uv.needsUpdate = true;
    }
    seCornerGeo.computeBoundingSphere();

    const seCornerDesc = {
      axis: 'z' as const,
      coord: 11.63,
      minSpan: -22.47,
      maxSpan: -17.097,
      floor: 'first' as const,
    };
    const seCornerMesh = new THREE.Mesh(seCornerGeo, exteriorBrickMat);
    seCornerMesh.name = 'bedroom4.southEastRoundedBrickCorner';
    seCornerMesh.userData.isArchitecturalShell = true;
    seCornerMesh.castShadow = true;
    seCornerMesh.receiveShadow = true;
    tagUpperCutawayWall(seCornerMesh, seCornerDesc);
    scene.add(seCornerMesh);
  }

  // Issue #7 & #8: Full-Height Vaulted 3-Door Shaker Built-In Wardrobe along the South Gable Wall East of the Chimney Breast
  // (`X = -19.25m..-17.34m, Z = +10.85m..+11.476m`), extending all the way into the sheared East Courtyard Wall (`X = -17.348m..-17.376m`) so zero gap exists at the wardrobe edge!
  {
    const cupGroup = new THREE.Group();
    cupGroup.name = 'bedroom4.southEastCupboards';
    const cupMinX = -19.25;
    const cupMaxX = -17.34; // Extends 8mm past getEastInnerX(10.85) = -17.3478m into the sheared East wall so zero gap is visible!
    const eastWallFrontX = -17.348; // Exact interior face of the sheared East Courtyard Wall at Z = 10.85m
    const collarEastX = -18.62;
    const skeilingEastX = -17.22;
    const cupD = 0.626; // Z = +10.85m (flush behind skirting) .. +11.476m (flush against South wall)

    const getVaultCeilingYAtX = (wx: number): number => {
      if (wx <= collarEastX) return collarCeilingY;
      const t = (wx - collarEastX) / (skeilingEastX - collarEastX);
      return collarCeilingY - t * (collarCeilingY - upperWallTopY);
    };

    // Full-height vaulted wardrobe carcass (`X = -19.25m..-17.34m`, stepping down to `upperWallTopY` inside the East brick wall for `x > -17.348m`)
    const carcassShape = new THREE.Shape();
    carcassShape.moveTo(cupMinX, floorTopY);
    carcassShape.lineTo(cupMaxX, floorTopY);
    carcassShape.lineTo(cupMaxX, upperWallTopY);
    carcassShape.lineTo(eastWallFrontX, upperWallTopY);
    carcassShape.lineTo(eastWallFrontX, getVaultCeilingYAtX(eastWallFrontX));
    carcassShape.lineTo(collarEastX, collarCeilingY);
    carcassShape.lineTo(cupMinX, collarCeilingY);
    carcassShape.closePath();
    const carcassGeo = new THREE.ExtrudeGeometry(carcassShape, {
      depth: cupD,
      bevelEnabled: false,
    });
    carcassGeo.translate(0, 0, 10.85);
    carcassGeo.computeBoundingSphere();
    const carcass = new THREE.Mesh(carcassGeo, wardrobeMat);
    carcass.name = 'bedroom4.southEastCupboards.carcass';
    carcass.castShadow = true;
    carcass.receiveShadow = true;
    cupGroup.add(carcass);

    // Single one-piece moulded Shaker top crown cornice (`Z = 10.825m..10.865m`) from the chimney breast (`X = -19.25m`) to the East wall (`X = -17.348m`)
    const corniceH = 0.044;
    const eastTopY = getVaultCeilingYAtX(eastWallFrontX);
    const corniceShape = new THREE.Shape();
    corniceShape.moveTo(cupMinX, collarCeilingY - corniceH);
    corniceShape.lineTo(collarEastX, collarCeilingY - corniceH);
    corniceShape.lineTo(eastWallFrontX, eastTopY - corniceH);
    corniceShape.lineTo(eastWallFrontX, eastTopY);
    corniceShape.lineTo(collarEastX, collarCeilingY);
    corniceShape.lineTo(cupMinX, collarCeilingY);
    corniceShape.closePath();
    const corniceGeo = new THREE.ExtrudeGeometry(corniceShape, {
      depth: 0.04,
      bevelEnabled: false,
    });
    corniceGeo.translate(0, 0, 10.825);
    corniceGeo.computeBoundingSphere();
    const corniceSeg = new THREE.Mesh(corniceGeo, wardrobeMat);
    corniceSeg.name = 'bedroom4.southEastCupboards.cornice';
    corniceSeg.castShadow = true;
    corniceSeg.receiveShadow = true;
    cupGroup.add(corniceSeg);

    // Three full-height vaulted Shaker wardrobe doors (`door_1`, `door_2`, `door_3`) spanning `X = -19.21m..-17.39m`
    const numDoors = 3;
    const totalDoorSpan = 1.82; // X = -19.21m .. -17.39m (leaves a 4cm scribe stile against both the chimney breast and East wall)
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

      const dIdx = cupGroup.children.length;
      addShakerWardrobeDoor(cupGroup, {
        x: doorCenterX,
        y: doorBaseY + maxDoorH / 2,
        z: 10.842,
        width: doorWidth,
        height: maxDoorH,
        heightLeft: hLeft,
        heightRight: hRight,
        alongZ: false,
        normalSign: -1,
        handleSide: handleSides[i],
        namePrefix: `bedroom4.southEastCupboards.door_${i + 1}`,
      });
      ensureNamedAddedChildren(
        cupGroup,
        dIdx,
        `bedroom4.southEastCupboards.door_${i + 1}`,
        true
      );
    }

    scene.add(cupGroup);
  }

  // Issue #2, #4, #5 & #7: Continuous 45°-mitred skirting along Bedroom 4 North-East Pier (`Z = 8.39m`), East Wall, South Alcove Cupboards,
  // Chimney Breast, SW Alcove, West Wall, and North Wall up to the door architrave (`X = -18.224m`)!
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
          [-22.19, 8.39],
          [-18.224, 8.39],
        ] as const,
      ],
    ] as const) {
      const skirtGeo = buildMitredWallSkirtingGeometry(path, floorTopY);
      skirtGeo.computeBoundingSphere();
      const skirtMesh = new THREE.Mesh(skirtGeo, antiqueOakSkirtingMat);
      skirtMesh.name = skirtName;
      skirtMesh.userData.isArchitecturalShell = true;
      skirtMesh.castShadow = true;
      skirtMesh.receiveShadow = true;
      scene.add(skirtMesh);
    }
  }

  // King Size Cast-Iron & Aged-Brass Bedstead against the North Wall (`Z = +8.39m`) facing South
  buildKingCastIronBed(scene, {
    name: 'bedroom4.kingCastIronBed',
    zone: 'bedroom4',
    position: [-20.2, floorTopY, 8.41],
    rotationY: -Math.PI / 2,
    palette: 'warmOatmealTerracotta',
  });
}
