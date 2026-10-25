import * as THREE from 'three';
import {
  buildMitredWallSkirtingGeometry,
  buildSweptMouldingGeometry,
  createCrownCorniceProfile,
} from '../../../../engine/geometry/index.ts';
import { buildLeafieldSuperKingBed } from './leafield-super-king-bed.ts';
import type { SceneBuilderContext } from '../../../../engine/viewer/scene-types.ts';
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
 * Main Bedroom (`mainBedroom`) walls, chimney breast and built-in wardrobes.
 *
 * Extracted verbatim from `buildMainHouseFirstFloorAndRoof` (first-floor-rooms.ts). Statement order and
 * geometry are unchanged; shared locals flow in via `kit` and out via the return value.
 */
export function buildMainBedroom(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'antiqueOakSkirtingMat' | 'brassMat' | 'exteriorBrickMat' | 'floorTopY' | 'oakFloorMat' | 'upperWallTopY' | 'wardrobeMat' | 'warmRoomPlasterMat'> &
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
    brassMat,
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
  {
    const idx = scene.children.length;
    addFirstFloorSlab(-9.68, -4.52, -2.64, 2.54, oakFloorMat);
    ensureNamedAddedChildren(scene, idx, 'mainBedroom.floorSlab');
  }

  // East Cross-Wall of Main Bedroom (X = -4.64m..-4.40m, Z = -2.78m..+2.68m)
  // `skipCap: true` so the lower brick wall merges seamlessly into `mainBedroom.eastWallBrickGable` (`Y = 4.16m..5.065m`)!
  const northEavesY = 3.69; // 1.18m cottage eaves spring height above 2.51m FFL (Survey2Plan: 1.175m)
  const southEavesY = 3.76; // 1.25m eaves spring height above 2.51m FFL clearing Win 1749749 top architrave
  {
    const idx0 = scene.children.length;
    addUpperInteriorWall(-4.63, floorTopY, northEavesY, 1.585, 0.02, 1.53, warmRoomPlasterMat, {
      skipSkirting: true,
      skipCap: true,
    });
    ensureNamedAddedChildren(scene, idx0, 'mainBedroom.eastWallInteriorLining');

    const idx1 = scene.children.length;
    addUpperExteriorBrickWall(-4.64, -4.4, -2.5, 2.4, 3.08, upperWallTopY, 'west', {
      skipSkirting: true,
      skipCap: true,
    });
    ensureNamedAddedChildren(scene, idx1, 'mainBedroom.eastExteriorBrickWall');
  }

  // North Exterior Brick Wall of Main Bedroom (Z = -2.78m..-2.50m, X = -9.56m..-4.40m) with Survey2Plan cottage casement window (Win 1757552: 0.88m x 0.70m, low 270mm cottage sill above 2.51m FFL)
  // Skirting is emitted below via `mainBedroom.perimeterMitredSkirting` for 45°-mitred corners
  {
    const idx = scene.children.length;
    addUpperBrickWallAlongXWithWindow(
      -9.56,
      -4.4,
      -2.78,
      -2.5,
      -6.85,
      0.88,
      2.78,
      3.48,
      'south',
      2,
      { skipSkirting: true, minSillY: 2.74, windowFamily: 'doubleCasement' }
    );
    ensureNamedAddedChildren(scene, idx, 'mainBedroom.northExteriorWall');
  }

  // South Courtyard Exterior Brick Wall of Main Bedroom (Z = +2.40m..+2.68m, X = -9.56m..-4.40m)
  // Calibrated to Survey2Plan Win 1749749 (1.36m x 0.72m 3-light casement, low 455mm sill at Y = 2.965m directly above the 2.958m bespoke Shaker window seat J-M02)!
  {
    const idx = scene.children.length;
    addUpperBrickWallAlongXWithWindow(
      -9.56,
      -4.4,
      2.4,
      2.68,
      -7.41,
      1.36,
      2.965,
      3.685,
      'north',
      3,
      {
        skipSkirting: true,
        minSillY: 2.92,
        skipUnderApron: true,
        windowFamily: 'tripleTopHungCentre',
      }
    );
    ensureNamedAddedChildren(scene, idx, 'mainBedroom.southExteriorWall');
  }

  // Survey2Plan `Ceil 1608703`: Vaulted collar ceiling in the Main Bedroom (`collarCeilingY = 5.065m`, `2.555m` clear height
  // above the `2.51m` stepped-up floor, springing from authentic low `1.18m–1.25m` cottage eaves!)
  const collarCeilingY = 5.065;
  const collarNorthZ = -1.0;
  const collarSouthZ = 1.2;

  // =========================================================================
  // FULL-WIDTH BANK OF 4 BUILT-IN SHAKER WARDROBES ALONG THE EAST WALL
  // (`X = -5.26m..-4.64m, Z = -2.50m..+2.40m`, facing West `-X` into Main Bedroom)
  // Continuous full-height Shaker wardrobe carcass (`wardrobeMat`) and
  // 8 ceiling-height Shaker doors (raked outer doors under the low North/South skeilings +
  // full-height central doors under the 5.065m collar ceiling) rising all the way to the ceiling!
  // =========================================================================
  {
    const eastWardGroup = new THREE.Group();
    eastWardGroup.name = 'mainBedroom.eastWardrobes';
    const wardD = 0.62; // X = -5.26m .. -4.64m

    const getVaultCeilingYAtZ = (z: number): number => {
      if (z < collarNorthZ) {
        return (
          northEavesY +
          ((z - -2.5) / (collarNorthZ - -2.5)) * (collarCeilingY - northEavesY)
        );
      }
      if (z > collarSouthZ) {
        return (
          collarCeilingY -
          ((z - collarSouthZ) / (2.4 - collarSouthZ)) * (collarCeilingY - southEavesY)
        );
      }
      return collarCeilingY;
    };

    // Full-height vaulted wardrobe carcass (`Y = floorTopY..collarCeilingY`, `Z = -2.50m..+2.40m`)
    const carcassShape = new THREE.Shape();
    carcassShape.moveTo(-2.5, floorTopY);
    carcassShape.lineTo(2.4, floorTopY);
    carcassShape.lineTo(2.4, southEavesY - 0.002);
    carcassShape.lineTo(collarSouthZ, collarCeilingY - 0.002);
    carcassShape.lineTo(collarNorthZ, collarCeilingY - 0.002);
    carcassShape.lineTo(-2.5, northEavesY - 0.002);
    carcassShape.closePath();
    const carcassGeo = new THREE.ExtrudeGeometry(carcassShape, {
      depth: wardD - 0.018,
      bevelEnabled: false,
    });
    carcassGeo.rotateY(-Math.PI / 2);
    carcassGeo.translate(-4.658, 0, 0);
    carcassGeo.computeBoundingSphere();
    const carcass = new THREE.Mesh(carcassGeo, wardrobeMat);
    carcass.name = 'mainBedroom.eastWardrobes.carcass';
    carcass.castShadow = true;
    carcass.receiveShadow = true;
    eastWardGroup.add(carcass);

    // Swept 45°-mitred Shaker Cyma/Cavetto crown cornice moulding following the vaulted ceiling profile along X = -5.26m
    {
      const corniceProfile = createCrownCorniceProfile(0.042, 0.046);
      const cornicePath: ReadonlyArray<readonly [number, number]> = [
        [-2.5, northEavesY - 0.006],
        [collarNorthZ, collarCeilingY - 0.006],
        [collarSouthZ, collarCeilingY - 0.006],
        [2.4, southEavesY - 0.006],
      ];
      const corniceGeo = buildSweptMouldingGeometry(
        corniceProfile,
        cornicePath,
        (z, y, d) => new THREE.Vector3(-5.26 - d, y, z),
        6
      );
      const corniceMesh = new THREE.Mesh(corniceGeo, wardrobeMat);
      corniceMesh.name = 'mainBedroom.eastWardrobes.cornice';
      corniceMesh.castShadow = true;
      corniceMesh.receiveShadow = true;
      eastWardGroup.add(corniceMesh);
    }

    // 8 ceiling-height Shaker wardrobe doors (4 pairs of double doors) aligned with the vaulted ceiling segments:
    // - Doors 1 & 2: Z = -2.44m .. -1.006m (deeply raked under low 1.18m North skeiling!)
    // - Doors 3..6: Z = -0.994m .. +1.194m (full-height under 5.065m flat collar)
    // - Doors 7 & 8: Z = +1.206m .. +2.34m (raked under low 1.25m South skeiling; Door 8 is counter-mounted above the J-M02 South Window Seat!)
    const doorIntervals: ReadonlyArray<readonly [number, number]> = [
      [-2.44, -1.729],
      [-1.717, -1.006],
      [-0.994, -0.456],
      [-0.444, 0.094],
      [0.106, 0.644],
      [0.656, 1.194],
      [1.206, 1.767],
      [1.779, 2.34],
    ];
    const fullDoorBaseY = floorTopY + 0.15;
    const aboveSeatDoorBaseY = floorTopY + 0.468; // 2.808m: 20mm clear above the 2.788m window-seat squab cushion
    const corniceClearance = 0.046;
    for (let i = 0; i < doorIntervals.length; i++) {
      const [z0, z1] = doorIntervals[i]!;
      const doorW = z1 - z0;
      const doorZ = (z0 + z1) / 2;
      const effDoorBaseY = i === 7 ? aboveSeatDoorBaseY : fullDoorBaseY;
      const hLeft = getVaultCeilingYAtZ(z0) - corniceClearance - effDoorBaseY;
      const hRight = getVaultCeilingYAtZ(z1) - corniceClearance - effDoorBaseY;
      const maxDoorH = Math.max(hLeft, hRight);
      const dIdx = eastWardGroup.children.length;
      addShakerWardrobeDoor(eastWardGroup, {
        x: -5.273,
        y: effDoorBaseY + maxDoorH / 2,
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
      ensureNamedAddedChildren(
        eastWardGroup,
        dIdx,
        `mainBedroom.eastWardrobe.door_${i + 1}`,
        true
      );
    }

    // In-frame Shaker lower fascia panel below Door 8 across Z = 1.779m..1.96m where visible North of the window seat
    {
      const lowerFillerH = aboveSeatDoorBaseY - fullDoorBaseY - 0.008;
      const lowerFillerW = 1.96 - 1.779;
      const lowerFillerGeo = new THREE.BoxGeometry(0.024, lowerFillerH, lowerFillerW);
      lowerFillerGeo.computeBoundingSphere();
      const lowerFiller = new THREE.Mesh(lowerFillerGeo, wardrobeMat);
      lowerFiller.name = 'mainBedroom.eastWardrobe.seatJunctionFascia';
      lowerFiller.position.set(-5.272, fullDoorBaseY + lowerFillerH * 0.5, (1.779 + 1.96) * 0.5);
      lowerFiller.castShadow = true;
      lowerFiller.receiveShadow = true;
      eastWardGroup.add(lowerFiller);
    }

    scene.add(eastWardGroup);
  }

  // =========================================================================
  // BESPOKE FULL-LENGTH SHAKER WINDOW SEAT & STORAGE BENCH (`J-M02`)
  // Spans the entire 4.30m clear South Courtyard window wall (`X = -9.56m..-5.26m`,
  // `Z = 1.96m..2.40m`), with 6 in-frame Shaker storage bays, Solid European Oak
  // bullnose bench top, tailored piped oatmeal-linen squab cushion & scatter cushions!
  // =========================================================================
  {
    const seatMinX = -9.56;
    const seatMaxX = -5.26;
    const seatSpanX = seatMaxX - seatMinX; // 4.30m full wall-to-wardrobe clear span
    const seatCenterX = (seatMinX + seatMaxX) * 0.5; // -7.41m (exact window centerline!)
    const wallInnerZ = 2.4;
    const carcassDepthZ = 0.44;
    const carcassFrontZ = wallInnerZ - carcassDepthZ; // 1.96m (5mm South of Z = 1.955m door architrave!)
    const plinthH = 0.084;
    const lidThick = 0.026;
    const carcassH = 0.40 - plinthH - lidThick; // 0.290m
    const carcassBotY = floorTopY + plinthH; // 2.424m
    const lidBotY = carcassBotY + carcassH; // 2.714m
    const lidTopY = lidBotY + lidThick; // 2.740m

    const windowSeatGroup = new THREE.Group();
    windowSeatGroup.name = 'mainBedroom.windowSeatJoinery';
    windowSeatGroup.userData.zone = 'mainBedroom';
    windowSeatGroup.userData.tradeCategory = 'joinery';

    // 1. Recessed shadow-gap Shaker plinth (`Z = 1.986m..2.40m`)
    const plinthDepthZ = carcassDepthZ - 0.026;
    const plinthGeo = new THREE.BoxGeometry(seatSpanX, plinthH, plinthDepthZ);
    plinthGeo.computeBoundingSphere();
    const plinthMesh = new THREE.Mesh(plinthGeo, wardrobeMat);
    plinthMesh.name = 'mainBedroom.windowSeatJoinery.plinth';
    plinthMesh.position.set(
      seatCenterX,
      floorTopY + plinthH * 0.5,
      wallInnerZ - plinthDepthZ * 0.5
    );
    plinthMesh.castShadow = true;
    plinthMesh.receiveShadow = true;
    windowSeatGroup.add(plinthMesh);

    // 2. Main 6-bay Shaker bench carcass (`Z = 1.96m..2.40m`)
    const carcassGeo = new THREE.BoxGeometry(seatSpanX, carcassH, carcassDepthZ);
    carcassGeo.computeBoundingSphere();
    const carcassMesh = new THREE.Mesh(carcassGeo, wardrobeMat);
    carcassMesh.name = 'mainBedroom.windowSeatJoinery.carcass';
    carcassMesh.position.set(
      seatCenterX,
      carcassBotY + carcassH * 0.5,
      wallInnerZ - carcassDepthZ * 0.5
    );
    carcassMesh.castShadow = true;
    carcassMesh.receiveShadow = true;
    windowSeatGroup.add(carcassMesh);

    // 3. In-frame Shaker rails, 7 vertical stiles, 6 recessed flat panels & aged-brass cabinet knobs
    const frameProjZ = 0.016;
    const railH = 0.046;
    const stileW = 0.052;
    for (const [railTag, ry] of [
      ['bottomRail', carcassBotY + railH * 0.5],
      ['topRail', lidBotY - railH * 0.5],
    ] as const) {
      const railGeo = new THREE.BoxGeometry(seatSpanX, railH, frameProjZ);
      railGeo.computeBoundingSphere();
      const railMesh = new THREE.Mesh(railGeo, wardrobeMat);
      railMesh.name = `mainBedroom.windowSeatJoinery.${railTag}`;
      railMesh.position.set(seatCenterX, ry, carcassFrontZ - frameProjZ * 0.5);
      railMesh.castShadow = true;
      railMesh.receiveShadow = true;
      windowSeatGroup.add(railMesh);
    }

    const bayCount = 6;
    const innerPanelH = carcassH - railH * 2;
    const innerPanelMidY = carcassBotY + carcassH * 0.5;
    const clearWidthBetweenStiles = seatSpanX - stileW * (bayCount + 1);
    const singleBayClearW = clearWidthBetweenStiles / bayCount;

    for (let s = 0; s <= bayCount; s++) {
      const sx = seatMinX + stileW * 0.5 + s * (singleBayClearW + stileW);
      const stileGeo = new THREE.BoxGeometry(stileW, innerPanelH + 0.002, frameProjZ);
      stileGeo.computeBoundingSphere();
      const stileMesh = new THREE.Mesh(stileGeo, wardrobeMat);
      stileMesh.name = `mainBedroom.windowSeatJoinery.stile.${s + 1}`;
      stileMesh.position.set(sx, innerPanelMidY, carcassFrontZ - frameProjZ * 0.5);
      stileMesh.castShadow = true;
      stileMesh.receiveShadow = true;
      windowSeatGroup.add(stileMesh);
    }

    const panelFrameW = 0.044;
    for (let b = 0; b < bayCount; b++) {
      const bayCenterX =
        seatMinX + stileW + singleBayClearW * 0.5 + b * (singleBayClearW + stileW);
      const doorLeafW = singleBayClearW - 0.006;
      const doorLeafH = innerPanelH - 0.006;

      // In-frame Shaker drawer/cupboard surround stiles & rails (proud by 11mm inside the 16mm carcass frame)
      for (const [subTag, subW, subH, dx, dy] of [
        ['top', doorLeafW, panelFrameW, 0, doorLeafH * 0.5 - panelFrameW * 0.5],
        ['bottom', doorLeafW, panelFrameW, 0, -doorLeafH * 0.5 + panelFrameW * 0.5],
        [
          'left',
          panelFrameW,
          doorLeafH - panelFrameW * 2,
          -doorLeafW * 0.5 + panelFrameW * 0.5,
          0,
        ],
        [
          'right',
          panelFrameW,
          doorLeafH - panelFrameW * 2,
          doorLeafW * 0.5 - panelFrameW * 0.5,
          0,
        ],
      ] as const) {
        const subGeo = new THREE.BoxGeometry(subW, subH, 0.011);
        subGeo.computeBoundingSphere();
        const subMesh = new THREE.Mesh(subGeo, wardrobeMat);
        subMesh.name = `mainBedroom.windowSeatJoinery.bay_${b + 1}.${subTag}`;
        subMesh.position.set(
          bayCenterX + dx,
          innerPanelMidY + dy,
          carcassFrontZ - 0.0055
        );
        subMesh.castShadow = true;
        subMesh.receiveShadow = true;
        windowSeatGroup.add(subMesh);
      }

      // Aged-brass turned Shaker pull knob with backplate rose on each storage bay
      const knobGeo = new THREE.SphereGeometry(0.013, 12, 10);
      knobGeo.computeBoundingSphere();
      const knobMesh = new THREE.Mesh(knobGeo, brassMat);
      knobMesh.name = `mainBedroom.windowSeatJoinery.knob.${b + 1}`;
      knobMesh.userData.lodTier = 'high';
      knobMesh.userData.lodMaxDistance = 12;
      knobMesh.scale.set(1, 1, 0.78);
      knobMesh.position.set(
        bayCenterX,
        innerPanelMidY + doorLeafH * 0.16,
        carcassFrontZ - 0.022
      );
      windowSeatGroup.add(knobMesh);
    }

    // 4. Solid European Oak Bullnose Bench Top (`Y = 2.714m..2.740m`, stopped 20mm East of `-9.56m` at the front lip so it clears the 20mm door architrave!)
    const lidMinX = seatMinX + 0.02;
    const lidSpanX = seatMaxX - lidMinX;
    const lidNosingZ = 0.022; // Overhangs to Z = 1.938m
    const lidShape = new THREE.Shape();
    lidShape.moveTo(0, 0);
    lidShape.lineTo(carcassDepthZ + lidNosingZ - 0.012, 0);
    lidShape.quadraticCurveTo(
      carcassDepthZ + lidNosingZ,
      0,
      carcassDepthZ + lidNosingZ,
      lidThick * 0.5
    );
    lidShape.quadraticCurveTo(
      carcassDepthZ + lidNosingZ,
      lidThick,
      carcassDepthZ + lidNosingZ - 0.012,
      lidThick
    );
    lidShape.lineTo(0, lidThick);
    lidShape.closePath();

    const lidGeo = new THREE.ExtrudeGeometry(lidShape, {
      depth: lidSpanX,
      bevelEnabled: false,
      curveSegments: 6,
    });
    lidGeo.translate(0, 0, -lidSpanX * 0.5);
    lidGeo.rotateY(Math.PI / 2); // Maps +x shape projection to -Z (North into room) and z depth to +X
    lidGeo.computeVertexNormals();
    lidGeo.computeBoundingSphere();
    const seatBoard = new THREE.Mesh(lidGeo, antiqueOakSkirtingMat);
    seatBoard.name = 'mainBedroom.windowSeatJoinery.oakBenchTop';
    seatBoard.position.set((lidMinX + seatMaxX) * 0.5, lidBotY, wallInnerZ);
    seatBoard.castShadow = true;
    seatBoard.receiveShadow = true;
    windowSeatGroup.add(seatBoard);

    scene.add(windowSeatGroup);

    // 5. Tailored Piped Oatmeal-Linen Upholstered Squab Cushion (`Y = 2.740m..2.788m`) & Scatter Cushions
    const cushionGroup = new THREE.Group();
    cushionGroup.name = 'mainBedroom.windowSeatCushions';
    cushionGroup.userData.zone = 'mainBedroom';
    cushionGroup.userData.tradeCategory = 'decor';

    const oatmealLinenMat = new THREE.MeshStandardMaterial({
      color: 0xdfd6c5,
      roughness: 0.9,
      metalness: 0.01,
    });
    const linenPipingMat = new THREE.MeshStandardMaterial({
      color: 0xc2b6a1,
      roughness: 0.86,
      metalness: 0.01,
    });
    const sageScatterMat = new THREE.MeshStandardMaterial({
      color: 0x9aa493,
      roughness: 0.88,
      metalness: 0.01,
    });
    const warmHerringboneScatterMat = new THREE.MeshStandardMaterial({
      color: 0xc8b9a2,
      roughness: 0.9,
      metalness: 0.01,
    });

    const squabMinX = seatMinX + 0.024;
    const squabMaxX = seatMaxX - 0.012;
    const squabSpanX = squabMaxX - squabMinX;
    const squabCenterX = (squabMinX + squabMaxX) * 0.5;
    const squabDepthZ = 0.444;
    const squabH = 0.048;
    const squabBackZ = wallInnerZ - 0.006;

    const squabProfile = new THREE.Shape();
    squabProfile.moveTo(0.012, 0);
    squabProfile.lineTo(squabDepthZ - 0.018, 0);
    squabProfile.quadraticCurveTo(squabDepthZ, 0, squabDepthZ, squabH * 0.48);
    squabProfile.quadraticCurveTo(
      squabDepthZ,
      squabH,
      squabDepthZ - 0.02,
      squabH
    );
    squabProfile.quadraticCurveTo(
      squabDepthZ * 0.5,
      squabH + 0.005,
      0.014,
      squabH
    );
    squabProfile.quadraticCurveTo(0, squabH, 0, squabH * 0.5);
    squabProfile.quadraticCurveTo(0, 0, 0.012, 0);
    squabProfile.closePath();

    const squabGeo = new THREE.ExtrudeGeometry(squabProfile, {
      depth: squabSpanX,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.006,
      bevelSegments: 3,
      curveSegments: 8,
    });
    squabGeo.translate(0, 0, -squabSpanX * 0.5);
    squabGeo.rotateY(Math.PI / 2);
    squabGeo.computeVertexNormals();
    squabGeo.computeBoundingSphere();

    const squabMesh = new THREE.Mesh(squabGeo, oatmealLinenMat);
    squabMesh.name = 'mainBedroom.windowSeatCushions.squab';
    squabMesh.position.set(squabCenterX, lidTopY, squabBackZ);
    squabMesh.castShadow = true;
    squabMesh.receiveShadow = true;
    cushionGroup.add(squabMesh);

    // Top & bottom tailored piping welt cords along the front bullnose edge of the squab cushion
    for (const [weltTag, wy] of [
      ['lowerWelt', lidTopY + 0.005],
      ['upperWelt', lidTopY + squabH - 0.003],
    ] as const) {
      const weltGeo = new THREE.CylinderGeometry(0.0045, 0.0045, squabSpanX, 10);
      weltGeo.rotateZ(Math.PI / 2);
      weltGeo.computeBoundingSphere();
      const weltMesh = new THREE.Mesh(weltGeo, linenPipingMat);
      weltMesh.name = `mainBedroom.windowSeatCushions.${weltTag}`;
      weltMesh.userData.lodTier = 'high';
      weltMesh.userData.lodMaxDistance = 14;
      weltMesh.position.set(squabCenterX, wy, squabBackZ - squabDepthZ + 0.006);
      cushionGroup.add(weltMesh);
    }

    // 4 plump scatter cushions flanking the 1.46m South Courtyard window (`X = -8.14m..-6.68m`) so the oak sill & architrave remain 100% clear!
    const scatterGeo = new THREE.SphereGeometry(0.19, 16, 14);
    scatterGeo.scale(1.05, 0.92, 0.42);
    scatterGeo.computeBoundingSphere();
    const scatterSpecs = [
      ['westOuter', -9.18, 2.24, 0.22, -0.18, sageScatterMat],
      ['westInner', -8.52, 2.26, 0.08, -0.24, warmHerringboneScatterMat],
      ['eastInner', -6.30, 2.26, -0.08, -0.24, warmHerringboneScatterMat],
      ['eastOuter', -5.64, 2.24, -0.22, -0.18, sageScatterMat],
    ] as const;
    for (const [scTag, scX, scZ, rotY, rotX, scMat] of scatterSpecs) {
      const scMesh = new THREE.Mesh(scatterGeo, scMat);
      scMesh.name = `mainBedroom.windowSeatCushions.scatter.${scTag}`;
      scMesh.position.set(scX, lidTopY + squabH + 0.145, scZ);
      scMesh.rotation.set(rotX, rotY, 0);
      scMesh.castShadow = true;
      scMesh.receiveShadow = true;
      cushionGroup.add(scMesh);
    }

    scene.add(cushionGroup);
  }

  // West Load-Bearing Cross-Wall between Main Bedroom (Y = 2.51m) and Family Bathroom / Upper Passage (Y = 2.16m)
  // Calibrated to Survey2Plan cottage doorway `Door 1685966` (`width = 0.82m`, `centerZ = 1.48m` -> `Z = 1.07m..1.89m`, `doorH = 1.66m` above `2.51m` FFL / `1.835m` above mid-step)
  const passageFloorTopY = 2.16;
  const mainBedDoorH = 1.66;
  const westCrossWallEavesY = 3.86; // Seals cleanly to BOTH Family Bathroom 3.86m eaves (West) & Main Bedroom 3.69m/3.76m eaves (East)
  {
    const idx0 = scene.children.length;
    addUpperInteriorWall(-9.68, passageFloorTopY, westCrossWallEavesY, -0.715, 0.24, 3.57, warmRoomPlasterMat, {
      skipSkirting: true,
      skipCap: true,
    });
    ensureNamedAddedChildren(scene, idx0, 'mainBedroom.westCrossWall.northPier');

    const idx1 = scene.children.length;
    addUpperInteriorWall(-9.68, passageFloorTopY, westCrossWallEavesY, 2.145, 0.24, 0.51, warmRoomPlasterMat, {
      skipSkirting: true,
      skipCap: true,
    });
    ensureNamedAddedChildren(scene, idx1, 'mainBedroom.westCrossWall.southPier');

    const idx2 = scene.children.length;
    addUpperInteriorWall(-9.68, floorTopY + mainBedDoorH, 4.24, 1.48, 0.24, 0.82, warmRoomPlasterMat, {
      skipSkirting: true,
      skipCap: true,
    });
    ensureNamedAddedChildren(scene, idx2, 'mainBedroom.westCrossWall.doorLintel');
  }

  // Continuous 45°-mitred 146mm Solid European Oak skirting around the Main Bedroom perimeter
  // (from North door architrave `Z = 1.005m` -> NW corner -> NE wardrobe corner -> SE window-seat junction `Z = 1.96m`)
  {
    const mainBedPerimeterSkirtGeo = buildMitredWallSkirtingGeometry(
      [
        [-9.56, 1.005],
        [-9.56, -2.5],
        [-5.26, -2.5],
        [-5.26, 1.96],
      ],
      floorTopY
    );
    mainBedPerimeterSkirtGeo.computeBoundingSphere();
    const mainBedPerimeterSkirt = new THREE.Mesh(
      mainBedPerimeterSkirtGeo,
      antiqueOakSkirtingMat
    );
    mainBedPerimeterSkirt.name = 'mainBedroom.perimeterMitredSkirting';
    mainBedPerimeterSkirt.userData.isArchitecturalShell = true;
    mainBedPerimeterSkirt.castShadow = true;
    mainBedPerimeterSkirt.receiveShadow = true;
    scene.add(mainBedPerimeterSkirt);
  }
  {
    const idx = scene.children.length;
    addUpperInteractiveDoor('z', -9.68, 0.24, 1.48, 0.82, Math.PI * 0.48, {
      frontFloorY: floorTopY,
      backFloorY: passageFloorTopY,
      doorFloorY: floorTopY,
      doorH: mainBedDoorH,
      architraveWidth: 0.065,
      jambInset: 0.01,
    });
    ensureNamedAddedChildren(scene, idx, 'mainBedroom.entranceDoor');
  }

  // Survey2Plan `Stair 1867816`: 2-Riser (+0.35m = 2 × 175mm) Solid European Oak Threshold Stair (`mainBedroom.thresholdStep`)
  // stepping up from the Upper South Passage (`Y = 2.160m`) -> mid-step (`Y = 2.335m`) -> Main Bedroom floor (`Y = 2.510m`)!
  {
    const stepGroup = new THREE.Group();
    stepGroup.name = 'mainBedroom.thresholdStep';
    stepGroup.userData.zone = 'mainBedroom';
    stepGroup.userData.isArchitecturalShell = true;

    const stepSpanZ = 0.8;
    const totalRise = floorTopY - passageFloorTopY; // 0.350m
    const singleRise = totalRise * 0.5; // 0.175m
    const midStepTopY = passageFloorTopY + singleRise; // 2.335m
    const treadThick = 0.028;
    const riserH = singleRise - treadThick; // 0.147m

    // Step 1 (Lower step in Upper South Passage: X = -9.98m..-9.74m, top at Y = 2.335m)
    const lowerRiserGeo = new THREE.BoxGeometry(0.24, riserH, stepSpanZ);
    lowerRiserGeo.computeBoundingSphere();
    const lowerRiser = new THREE.Mesh(lowerRiserGeo, antiqueOakSkirtingMat);
    lowerRiser.name = 'mainBedroom.thresholdStep.lowerRiser';
    lowerRiser.position.set(-9.86, passageFloorTopY + riserH * 0.5, 1.48);
    lowerRiser.castShadow = true;
    lowerRiser.receiveShadow = true;
    stepGroup.add(lowerRiser);

    const lowerTreadGeo = new THREE.BoxGeometry(0.256, treadThick, stepSpanZ + 0.016);
    lowerTreadGeo.computeBoundingSphere();
    const lowerTread = new THREE.Mesh(lowerTreadGeo, oakFloorMat);
    lowerTread.name = 'mainBedroom.thresholdStep.lowerTread';
    lowerTread.position.set(-9.858, midStepTopY - treadThick * 0.5, 1.48);
    lowerTread.castShadow = true;
    lowerTread.receiveShadow = true;
    stepGroup.add(lowerTread);

    // Step 2 (Upper threshold step inside cased reveal: X = -9.74m..-9.684m, top at Y = 2.510m)
    const stepRiserGeo = new THREE.BoxGeometry(0.056, riserH, stepSpanZ);
    stepRiserGeo.computeBoundingSphere();
    const stepRiser = new THREE.Mesh(stepRiserGeo, antiqueOakSkirtingMat);
    stepRiser.name = 'mainBedroom.thresholdStep.riser';
    stepRiser.position.set(-9.712, midStepTopY + riserH * 0.5, 1.48);
    stepRiser.castShadow = true;
    stepRiser.receiveShadow = true;
    stepGroup.add(stepRiser);

    const stepTreadGeo = new THREE.BoxGeometry(0.058, treadThick, stepSpanZ);
    stepTreadGeo.computeBoundingSphere();
    const stepTread = new THREE.Mesh(stepTreadGeo, oakFloorMat);
    stepTread.name = 'mainBedroom.thresholdStep.tread';
    stepTread.position.set(-9.713, floorTopY - treadThick * 0.5, 1.48);
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
    bullnoseGeo.computeBoundingSphere();

    const lowerBullnose = new THREE.Mesh(bullnoseGeo, antiqueOakSkirtingMat);
    lowerBullnose.name = 'mainBedroom.thresholdStep.lowerBullnose';
    lowerBullnose.userData.lodTier = 'high';
    lowerBullnose.userData.lodMaxDistance = 12;
    lowerBullnose.position.set(-9.986, midStepTopY - 0.014, 1.48);
    lowerBullnose.castShadow = true;
    lowerBullnose.receiveShadow = true;
    stepGroup.add(lowerBullnose);

    const stepBullnose = new THREE.Mesh(bullnoseGeo, antiqueOakSkirtingMat);
    stepBullnose.name = 'mainBedroom.thresholdStep.bullnose';
    stepBullnose.userData.lodTier = 'high';
    stepBullnose.userData.lodMaxDistance = 12;
    stepBullnose.position.set(-9.742, floorTopY - 0.014, 1.48);
    stepBullnose.castShadow = true;
    stepBullnose.receiveShadow = true;
    stepGroup.add(stepBullnose);

    scene.add(stepGroup);
  }

  // Full-Span Trapezoidal Upper Gable Extensions on the West (X = -9.68m) Cross-Wall
  // and East Exterior Brick Gable Wall (`X = -4.64m..-4.40m, Y = 4.16m..5.065m`)
  {
    const westGableShape = new THREE.Shape();
    westGableShape.moveTo(-2.5, westCrossWallEavesY);
    westGableShape.lineTo(1.07, westCrossWallEavesY);
    westGableShape.lineTo(1.07, 4.24);
    westGableShape.lineTo(1.89, 4.24);
    westGableShape.lineTo(1.89, westCrossWallEavesY);
    westGableShape.lineTo(2.4, westCrossWallEavesY);
    westGableShape.lineTo(collarSouthZ, collarCeilingY);
    westGableShape.lineTo(collarNorthZ, collarCeilingY);
    westGableShape.closePath();

    // 1. West interior cross-wall upper gable (`X = -9.80m..-9.56m`, `warmRoomPlasterMat`)
    const westGableGeo = new THREE.ExtrudeGeometry(westGableShape, {
      depth: 0.24,
      bevelEnabled: false,
    });
    westGableGeo.rotateY(-Math.PI / 2);
    westGableGeo.translate(-9.56, 0, 0);
    westGableGeo.computeBoundingSphere();
    const westGableMesh = new THREE.Mesh(westGableGeo, warmRoomPlasterMat);
    westGableMesh.name = 'mainBedroom.westWallUpperGable';
    westGableMesh.userData.isArchitecturalShell = true;
    westGableMesh.castShadow = true;
    westGableMesh.receiveShadow = true;
    scene.add(westGableMesh);

    // 2. East exterior brick gable wall (`X = -4.64m..-4.40m, Y = 4.16m..5.065m`, `exteriorBrickMat`)
    const eastGableCutawayDesc = {
      axis: 'x' as const,
      coord: -4.52,
      minSpan: -2.78,
      maxSpan: 2.68,
      floor: 'first' as const,
    };
    const eastBrickShape = new THREE.Shape();
    eastBrickShape.moveTo(-2.5, upperWallTopY);
    eastBrickShape.lineTo(2.4, upperWallTopY);
    eastBrickShape.lineTo(1.18, collarCeilingY);
    eastBrickShape.lineTo(-1.28, collarCeilingY);
    eastBrickShape.closePath();
    const eastBrickGableGeo = new THREE.ExtrudeGeometry(eastBrickShape, {
      depth: 0.24,
      bevelEnabled: false,
    });
    eastBrickGableGeo.rotateY(-Math.PI / 2);
    eastBrickGableGeo.translate(-4.4, 0, 0);
    applyWorldSpaceBrickUVs(eastBrickGableGeo, 0, 0, 0);
    eastBrickGableGeo.computeBoundingSphere();
    const eastBrickGable = new THREE.Mesh(eastBrickGableGeo, exteriorBrickMat);
    eastBrickGable.name = 'mainBedroom.eastWallBrickGable';
    eastBrickGable.userData.isArchitecturalShell = true;
    eastBrickGable.castShadow = true;
    eastBrickGable.receiveShadow = true;
    tagUpperCutawayWall(eastBrickGable, eastGableCutawayDesc);
    scene.add(eastBrickGable);

    // 3. East interior plaster lining (`X = -4.654m..-4.64m, Y = northEavesY..collarCeilingY`, `warmRoomPlasterMat`)
    const eastPlasterShape = new THREE.Shape();
    eastPlasterShape.moveTo(-2.5, northEavesY);
    eastPlasterShape.lineTo(2.4, southEavesY);
    eastPlasterShape.lineTo(collarSouthZ, collarCeilingY);
    eastPlasterShape.lineTo(collarNorthZ, collarCeilingY);
    eastPlasterShape.closePath();
    const eastPlasterGableGeo = new THREE.ExtrudeGeometry(eastPlasterShape, {
      depth: 0.014,
      bevelEnabled: false,
    });
    eastPlasterGableGeo.rotateY(-Math.PI / 2);
    eastPlasterGableGeo.translate(-4.64, 0, 0);
    eastPlasterGableGeo.computeBoundingSphere();
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
