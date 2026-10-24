import * as THREE from 'three';
import {
  addCasedArchitravePortal,
  buildMitredWallSkirtingGeometry,
} from '../../../../../engine/geometry/swept-moulding.ts';
import { buildWindowRomanBlind } from '../../../../../objects/decor/roman-blind.ts';
import type { SceneBuilderContext } from '../../../../../engine/viewer/scene-types.ts';
import type { createGroundFloorMaterials } from '../../../structure/ground-floor-materials.ts';
import type { createGroundFloorShellKit } from '../../../structure/ground-floor-shell-kit.ts';
import type { buildDiningRoom } from '../dining-room.ts';
import { buildUnderCounterWineCooler } from '../kitchen-island.ts';

function createSharedGeo<T extends THREE.BufferGeometry>(geo: T): T {
  geo.computeBoundingSphere();
  return geo;
}

function tagHighLod<T extends THREE.Object3D>(obj: T, maxDistance = 12): T {
  obj.userData.lodTier = 'high';
  obj.userData.lodMaxDistance = maxDistance;
  return obj;
}

export type BootRoomBenchAndLockersKit = Pick<
  ReturnType<typeof createGroundFloorMaterials>,
  | 'antiqueOakSkirtingMat'
  | 'applyWorldSpaceFloorUVs'
  | 'brassMat'
  | 'doorH'
  | 'engineeredOakFloorMat'
  | 'oakMat'
  | 'skirtingMat'
  | 'tagCutawayWall'
  | 'wallH'
  | 'warmRoomPlasterMat'
> &
  Pick<
    ReturnType<typeof createGroundFloorShellKit>,
    'addBrickWallAlongXWithWindow' | 'addInteractiveInteriorDoor' | 'addInteriorWall'
  > &
  Pick<
    ReturnType<typeof buildDiningRoom>,
    'lowerDoorLintelH' | 'lowerDoorLintelY' | 'lowerFloorY' | 'lowerWallH' | 'lowerWallMidY'
  >;

/**
 * Boot Lobby (`bootLobby`) floor, walls, framed country artwork, wine cellar glass door,
 * bespoke oak & dark-steel wine cellar shelving/racks/cooler, south window sill & ceiling joists.
 */
export function buildBootRoomBenchAndLockers(
  ctx: SceneBuilderContext,
  kit: BootRoomBenchAndLockersKit
): void {
  const { groundFloorCeilingGroup, interactions, lightGroups, scene } = ctx;
  const {
    addBrickWallAlongXWithWindow,
    addInteractiveInteriorDoor,
    addInteriorWall,
    antiqueOakSkirtingMat,
    applyWorldSpaceFloorUVs,
    brassMat,
    doorH,
    engineeredOakFloorMat,
    lowerDoorLintelH,
    lowerDoorLintelY,
    lowerFloorY,
    lowerWallH,
    lowerWallMidY,
    oakMat,
    tagCutawayWall,
    wallH,
    warmRoomPlasterMat,
  } = kit;

  // =========================================================================
  // 2. MIDDLE BOOT LOBBY, STORE (2.25m x 1.48m) & CLOAKROOM WC
  //    X = -9.80m..-13.05m (spanning continuously across the X = -12.81m..-13.05m doorway threshold into Hall — Issue #12),
  //    Z = -2.50m..+2.40m (Floor at Y = -0.30m, engineered timber oak continuous with Hall at identical scale)
  // =========================================================================
  const bootLobbyFloor = new THREE.Mesh(
    createSharedGeo(
      applyWorldSpaceFloorUVs(
        new THREE.BoxGeometry(3.25, 0.08, 4.9),
        -11.425,
        -0.05,
        1 / 4.4,
        1 / 1.76
      )
    ),
    engineeredOakFloorMat
  );
  bootLobbyFloor.name = 'bootLobby.floor';
  bootLobbyFloor.position.set(-11.425, lowerFloorY - 0.04, -0.05);
  bootLobbyFloor.receiveShadow = true;
  scene.add(bootLobbyFloor);

  // North Exterior Brick Wall across East Wine Cellar (X = -11.45m..-9.56m) and West Cloakroom WC (X = -12.81m..-11.45m)
  // Calibrated to Survey2Plan narrow heritage North slit casement windows (Win 1529400 = 0.54m & Win 1530340 = 0.58m)
  addBrickWallAlongXWithWindow(
    -11.45,
    -9.56,
    -2.78,
    -2.5,
    -10.62,
    0.54,
    1.02,
    1.82,
    'south',
    1
  );
  addBrickWallAlongXWithWindow(
    -12.81,
    -11.45,
    -2.78,
    -2.5,
    -12.14,
    0.58,
    0.79,
    1.6,
    'south',
    1,
    { trimFaceOffset: 0.018 }
  );

  // Face-fixed linen Roman blind over the Downstairs Cloakroom WC North window (X = -12.14m, lowered to sillY = 0.79m..1.60m — Issue #10)
  buildWindowRomanBlind(scene, tagCutawayWall, {
    name: 'bootLobby.downstairsWc.northWindow.romanBlind',
    zone: 'bootLobby',
    centerX: -12.14,
    width: 0.58,
    railY: 1.555,
    bottomY: 1.22,
    wallFaceZ: -2.462,
    facingZ: 1,
    cutawayWall: {
      axis: 'z',
      coord: -2.64,
      minSpan: -12.81,
      maxSpan: -11.45,
      floor: 'ground',
    },
  });

  // Partition wall between West Store/Cupboard (X = -12.81m..-11.39m) and East Cloakroom WC (X = -11.39m..-9.80m):
  // 0.15m thick centered at X = -11.39m, Z = -2.50m..-0.10m (directly aligned with the center pier & sconce between the two equal-sized doors!)
  addInteriorWall(-11.39, lowerWallMidY, -1.3, 0.15, lowerWallH, 2.4, warmRoomPlasterMat, {
    skirtingSides: [-1],
    skirtingMin: -2.5,
    skirtingMax: -0.258,
  });

  // North Wall of Boot Lobby / South Wall of Downstairs WC & Wine Cellar (0.15m thick at Z = -0.175m, X = -9.80m..-12.81m):
  // - West pier (X = -12.81m..-12.54m, width 0.27m, center X = -12.675m)
  // - Left Door — Downstairs WC Door (centered at X = -12.12m, width 0.84m, X = -12.54m..-11.70m)
  // - Center Pier with Wall Sconce (X = -11.70m..-10.84m, width 0.86m, center X = -11.27m)
  // - Right Door — Wine Cellar Glass Door (Issue #14: shifted right to X = -10.42m, width 0.84m, X = -10.84m..-10.00m so it clears the X = -10.935m Wine Cellar cupboards!)
  // - East return pier (X = -10.00m..-9.80m, width 0.20m, center X = -9.90m) meeting the solid East cross-wall (X = -9.80m)
  addInteriorWall(-12.675, lowerWallMidY, -0.175, 0.27, lowerWallH, 0.15, warmRoomPlasterMat, {
    skipSkirting: true,
  });
  addInteriorWall(-11.27, lowerWallMidY, -0.175, 0.86, lowerWallH, 0.15, warmRoomPlasterMat, {
    skipSkirting: true,
  });
  addInteriorWall(-9.9, lowerWallMidY, -0.175, 0.2, lowerWallH, 0.15, warmRoomPlasterMat, {
    skipSkirting: true,
  });
  addInteriorWall(-12.12, lowerDoorLintelY, -0.175, 0.84, lowerDoorLintelH, 0.15, warmRoomPlasterMat, {
    skipSkirting: true,
  });
  addInteriorWall(-10.42, lowerDoorLintelY, -0.175, 0.84, lowerDoorLintelH, 0.15, warmRoomPlasterMat, {
    skipSkirting: true,
  });

  // 45°-mitred 146mm antique-profiled oak skirting boards along the Boot Lobby West cross-wall, North piers & East cross-wall (Issue #14)
  for (const [skirtName, path] of [
    [
      'bootLobby.northWestCornerSkirting',
      [
        [-12.81, 1.218],
        [-12.81, -0.1],
        [-12.622, -0.1],
      ] as const,
    ],
    [
      'bootLobby.northCenterPierSkirting',
      [
        [-11.618, -0.1],
        [-10.922, -0.1],
      ] as const,
    ],
    [
      'bootLobby.northEastCornerSkirting',
      [
        [-9.918, -0.1],
        [-9.8, -0.1],
        [-9.8, 1.258],
      ] as const,
    ],
  ] as const) {
    const skirtMesh = new THREE.Mesh(
      createSharedGeo(buildMitredWallSkirtingGeometry(path, lowerFloorY)),
      antiqueOakSkirtingMat
    );
    skirtMesh.name = skirtName;
    skirtMesh.userData.isArchitecturalShell = true;
    skirtMesh.castShadow = true;
    skirtMesh.receiveShadow = true;
    scene.add(skirtMesh);
  }

  // Issue #4: Framed Country Artwork (`bootLobby.westWallPicture`) on the East (+X = -12.81m) face of the Boot Lobby West Cross-Wall
  // centered at [-12.81, 0.95, 0.55] (between the WC wall at Z = -0.10m and the Entrance Hall doorway at Z = 1.30m)
  {
    const picGroup = new THREE.Group();
    picGroup.name = 'bootLobby.westWallPicture';
    picGroup.userData.zone = 'bootLobby';
    picGroup.position.set(-12.81, 0.95, 0.55);

    const picW = 0.62; // Width along Z
    const picH = 0.50; // Height along Y
    const frameD = 0.024;
    const railW = 0.032;

    const frameMouldingMat = new THREE.MeshStandardMaterial({
      color: 0x3b2d20, // Aged dark walnut & antique bronze gallery frame
      roughness: 0.42,
      metalness: 0.18,
    });
    const matBoardMat = new THREE.MeshStandardMaterial({
      color: 0xf4efe4, // Warm archival cream mount board
      roughness: 0.82,
      metalness: 0.01,
    });

    // Shared horizontal and vertical frame rail geometries
    const horizRailGeo = createSharedGeo(new THREE.BoxGeometry(frameD, railW, picW));
    const vertRailGeo = createSharedGeo(new THREE.BoxGeometry(frameD, picH - railW * 2, railW));

    // Outer stepped frame rails (top, bottom, north, south)
    for (const [ry, rz, isHoriz] of [
      [picH * 0.5 - railW * 0.5, 0, true],
      [-picH * 0.5 + railW * 0.5, 0, true],
      [0, -picW * 0.5 + railW * 0.5, false],
      [0, picW * 0.5 - railW * 0.5, false],
    ] as const) {
      const rail = new THREE.Mesh(isHoriz ? horizRailGeo : vertRailGeo, frameMouldingMat);
      rail.name = 'bootLobby.westWallPicture.frame';
      rail.position.set(frameD * 0.5, ry, rz);
      rail.castShadow = true;
      rail.receiveShadow = true;
      picGroup.add(rail);
    }

    // Inner aged-brass sight-edge slip fillet
    const innerW = picW - railW * 2;
    const innerH = picH - railW * 2;
    const matBack = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.012, innerH, innerW)),
      matBoardMat
    );
    matBack.name = 'bootLobby.westWallPicture.mat';
    matBack.position.set(0.006, 0, 0);
    picGroup.add(matBack);

    // Painterly English country farmhouse & Chilterns meadow landscape canvas texture
    const createBootLobbyArtTexture = (): THREE.CanvasTexture => {
      const cw = 384;
      const ch = 300;
      const canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      const pCtx = canvas.getContext('2d')!;

      // Warm golden-hour sky gradient
      const skyGrad = pCtx.createLinearGradient(0, 0, 0, ch * 0.58);
      skyGrad.addColorStop(0, '#c8d6dc');
      skyGrad.addColorStop(0.55, '#e6dcc8');
      skyGrad.addColorStop(1, '#f2dfb8');
      pCtx.fillStyle = skyGrad;
      pCtx.fillRect(0, 0, cw, ch);

      // Soft rolling distant Chiltern hills
      pCtx.fillStyle = '#8b9682';
      pCtx.beginPath();
      pCtx.moveTo(0, ch * 0.56);
      pCtx.bezierCurveTo(cw * 0.28, ch * 0.44, cw * 0.62, ch * 0.52, cw, ch * 0.46);
      pCtx.lineTo(cw, ch);
      pCtx.lineTo(0, ch);
      pCtx.closePath();
      pCtx.fill();

      // Midground olive-green & russet country pasture
      const fieldGrad = pCtx.createLinearGradient(0, ch * 0.52, 0, ch);
      fieldGrad.addColorStop(0, '#6d7a58');
      fieldGrad.addColorStop(0.5, '#586443');
      fieldGrad.addColorStop(1, '#3f472e');
      pCtx.fillStyle = fieldGrad;
      pCtx.beginPath();
      pCtx.moveTo(0, ch * 0.62);
      pCtx.bezierCurveTo(cw * 0.35, ch * 0.54, cw * 0.7, ch * 0.64, cw, ch * 0.56);
      pCtx.lineTo(cw, ch);
      pCtx.lineTo(0, ch);
      pCtx.closePath();
      pCtx.fill();

      // Winding country lane in warm ochre/limestone
      pCtx.fillStyle = '#cbb692';
      pCtx.beginPath();
      pCtx.moveTo(cw * 0.48, ch * 0.58);
      pCtx.quadraticCurveTo(cw * 0.42, ch * 0.78, cw * 0.18, ch);
      pCtx.lineTo(cw * 0.38, ch);
      pCtx.quadraticCurveTo(cw * 0.52, ch * 0.78, cw * 0.53, ch * 0.58);
      pCtx.closePath();
      pCtx.fill();

      // Brick & stone farmhouse gable nestled among mature oak trees
      pCtx.fillStyle = '#a86448';
      pCtx.fillRect(cw * 0.54, ch * 0.49, cw * 0.14, ch * 0.09);
      pCtx.fillStyle = '#543c30';
      pCtx.beginPath();
      pCtx.moveTo(cw * 0.53, ch * 0.49);
      pCtx.lineTo(cw * 0.61, ch * 0.43);
      pCtx.lineTo(cw * 0.69, ch * 0.49);
      pCtx.closePath();
      pCtx.fill();

      // Mature oak tree canopies on left and right
      for (const [tx, ty, tr, col] of [
        [cw * 0.22, ch * 0.48, 38, '#3c4a2e'],
        [cw * 0.28, ch * 0.45, 32, '#4f5e3c'],
        [cw * 0.76, ch * 0.47, 34, '#38462b'],
        [cw * 0.82, ch * 0.50, 28, '#52613e'],
      ] as const) {
        pCtx.fillStyle = col;
        pCtx.beginPath();
        pCtx.arc(tx, ty, tr, 0, Math.PI * 2);
        pCtx.fill();
      }

      const tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    const canvasW = innerW - 0.09;
    const canvasH = innerH - 0.09;
    const artCanvas = new THREE.Mesh(
      createSharedGeo(new THREE.PlaneGeometry(canvasW, canvasH)),
      new THREE.MeshStandardMaterial({
        map: createBootLobbyArtTexture(),
        roughness: 0.38,
        metalness: 0.02,
      })
    );
    artCanvas.name = 'bootLobby.westWallPicture.canvas';
    artCanvas.rotation.y = Math.PI / 2; // Facing East (+X) into Boot Lobby
    artCanvas.position.set(0.014, 0, 0);
    picGroup.add(artCanvas);

    // Brass sight-edge bevel around the painting aperture
    const brassSlip = tagHighLod(
      new THREE.Mesh(
        createSharedGeo(new THREE.BoxGeometry(0.013, canvasH + 0.012, canvasW + 0.012)),
        brassMat
      )
    );
    brassSlip.name = 'bootLobby.westWallPicture.brassSlip';
    brassSlip.position.set(0.007, 0, 0);
    picGroup.add(brassSlip);

    tagCutawayWall(picGroup, {
      axis: 'x',
      coord: -12.885,
      minSpan: -2.5,
      maxSpan: 2.4,
      floor: 'ground',
    });

    scene.add(picGroup);
  }

  // Left Door: Downstairs Toilet (WC) Door centered on the West WC Room (X = -12.12m, width 0.84m)
  addInteractiveInteriorDoor(
    'bootLobbyCupboardDoor',
    'Downstairs WC Door',
    'x',
    -0.175,
    0.15,
    -12.12,
    0.84,
    0
  );

  // Right Door (Issue #3, #14 & #15): Full-height Solid Oak Framed Glass Door to the Wine Cellar
  // Moved slightly to the right (X = -10.42m, width 0.84m) so it does not clip the Wine Cellar cupboards at X = -10.935m
  {
    const wineDoorCenter = -10.42;
    const wineDoorWallZ = -0.175;
    const wineDoorWidth = 0.84;
    const wineGlassMat = new THREE.MeshStandardMaterial({
      color: 0xd8e6ec,
      roughness: 0.06,
      metalness: 0.12,
      transparent: true,
      opacity: 0.28,
    });

    const wineFrameGroup = new THREE.Group();
    wineFrameGroup.name = 'bootLobby.wineCellarGlassDoor.frame';
    addCasedArchitravePortal(wineFrameGroup, {
      axis: 'x',
      wallCoord: wineDoorWallZ,
      wallThickness: 0.15,
      openingCenter: wineDoorCenter,
      openingWidth: wineDoorWidth,
      frontFloorY: lowerFloorY,
      backFloorY: lowerFloorY,
      headY: lowerFloorY + doorH,
      material: antiqueOakSkirtingMat,
      namePrefix: 'bootLobby.wineCellarGlassDoor',
    });
    scene.add(wineFrameGroup);

    const wineLeafW = wineDoorWidth - 0.04;
    const wineLeafH = doorH - 0.02;
    const wineStileW = 0.068;
    const wineRailH = 0.078;
    const wineDoorObj = new THREE.Group();
    wineDoorObj.name = 'bootLobby.wineCellarGlassDoor';
    wineDoorObj.position.set(wineDoorCenter, lowerFloorY + doorH / 2, wineDoorWallZ);

    // Full-height clear tempered glass pane
    const glassPane = new THREE.Mesh(
      createSharedGeo(
        new THREE.BoxGeometry(
          wineLeafW - wineStileW * 2 + 0.008,
          wineLeafH - wineRailH * 2 + 0.008,
          0.014
        )
      ),
      wineGlassMat
    );
    glassPane.name = 'bootLobby.wineCellarGlassDoor.glass';
    wineDoorObj.add(glassPane);

    // Solid antique oak perimeter stiles, top/bottom rails & glazing bars matching the oak architrave (Issue #3)
    const wineStileGeo = createSharedGeo(new THREE.BoxGeometry(wineStileW, wineLeafH, 0.046));
    for (const side of [-1, 1] as const) {
      const stile = new THREE.Mesh(wineStileGeo, antiqueOakSkirtingMat);
      stile.name = `bootLobby.wineCellarGlassDoor.stile.${side < 0 ? 'west' : 'east'}`;
      stile.position.set(side * (wineLeafW / 2 - wineStileW / 2), 0, 0);
      stile.castShadow = true;
      stile.receiveShadow = true;
      wineDoorObj.add(stile);
    }
    for (const [ry, rh, rName] of [
      [wineLeafH / 2 - wineRailH / 2, wineRailH, 'top'],
      [-wineLeafH / 2 + wineRailH * 0.7, wineRailH * 1.4, 'bottom'],
    ] as const) {
      const rail = new THREE.Mesh(
        createSharedGeo(new THREE.BoxGeometry(wineLeafW - wineStileW * 2, rh, 0.046)),
        antiqueOakSkirtingMat
      );
      rail.name = `bootLobby.wineCellarGlassDoor.rail.${rName}`;
      rail.position.set(0, ry, 0);
      rail.castShadow = true;
      rail.receiveShadow = true;
      wineDoorObj.add(rail);
    }
    // Two solid oak horizontal glazing bars
    const glazingBarGeo = createSharedGeo(
      new THREE.BoxGeometry(wineLeafW - wineStileW * 2, 0.026, 0.032)
    );
    for (const [bIdx, barY] of ([-0.32, 0.34] as const).entries()) {
      const bar = new THREE.Mesh(glazingBarGeo, antiqueOakSkirtingMat);
      bar.name = `bootLobby.wineCellarGlassDoor.glazingBar.${bIdx + 1}`;
      bar.position.set(0, barY, 0);
      wineDoorObj.add(bar);
    }

    // Long vertical aged-brass pull handles on both faces
    const handleX = wineLeafW / 2 - wineStileW * 0.5;
    const pullBarGeo = createSharedGeo(new THREE.CylinderGeometry(0.009, 0.009, 0.38, 12));
    const standoffGeo = createSharedGeo(new THREE.CylinderGeometry(0.007, 0.007, 0.022, 10));
    for (const zSide of [-1, 1] as const) {
      const faceTag = zSide < 0 ? 'north' : 'south';
      const pullBar = tagHighLod(new THREE.Mesh(pullBarGeo, brassMat));
      pullBar.name = `bootLobby.wineCellarGlassDoor.pullHandle.${faceTag}`;
      pullBar.position.set(handleX, -0.04, zSide * 0.038);
      wineDoorObj.add(pullBar);
      for (const [sIdx, standY] of ([-0.19, 0.11] as const).entries()) {
        const standoff = tagHighLod(new THREE.Mesh(standoffGeo, brassMat));
        standoff.name = `bootLobby.wineCellarGlassDoor.handleStandoff.${faceTag}.${sIdx + 1}`;
        standoff.rotation.x = Math.PI / 2;
        standoff.position.set(handleX, standY, zSide * 0.026);
        wineDoorObj.add(standoff);
      }
    }

    scene.add(wineDoorObj);
    interactions.registerHingedDoor(
      scene,
      wineDoorObj,
      new THREE.Vector3(-wineLeafW / 2, 0, 0),
      'y',
      0,
      0
    );
  }

  // Bespoke Oak & Dark-Steel Wine Cellar Shelving inside the East Room (Issue #16 & Issue #1:
  // - First 2 units at the start (South entrance bays, Z = -1.37m..-0.38m): full-height tall units (2.18m) with criss-cross diamond oak wine racks
  // - End 2 units (North bays, Z = -2.46m..-1.37m): ground-level base counter units only (0.84m high)
  // - Corner wrap-around unit along the North wall (X = -11.315m..-9.82m, Z = -2.48m..-2.08m) with a built-in glass-door Wine Cooler underneath)
  {
    const wineCellarGroup = new THREE.Group();
    wineCellarGroup.name = 'bootLobby.wineCellar.shelving';
    wineCellarGroup.userData.zone = 'bootLobby';

    const cellarOakMat = new THREE.MeshStandardMaterial({
      color: 0x7a5230,
      roughness: 0.52,
      metalness: 0.04,
    });
    const cellarCrateOakMat = new THREE.MeshStandardMaterial({
      color: 0x9b7148,
      roughness: 0.62,
      metalness: 0.03,
    });
    const cellarSteelMat = new THREE.MeshStandardMaterial({
      color: 0x24272a,
      roughness: 0.38,
      metalness: 0.72,
    });
    const bordeauxGreenGlassMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a24,
      roughness: 0.12,
      metalness: 0.15,
    });
    const burgundyAmberGlassMat = new THREE.MeshStandardMaterial({
      color: 0x4a2c14,
      roughness: 0.14,
      metalness: 0.15,
    });
    const wineLabelMat = new THREE.MeshStandardMaterial({
      color: 0xf2ead8,
      roughness: 0.75,
      metalness: 0.02,
    });
    const warmLedStripMat = new THREE.MeshStandardMaterial({
      color: 0xffeab8,
      emissive: 0xffa834,
      emissiveIntensity: 2.6,
      roughness: 0.18,
    });
    // Shelf LED strips are on their own PIR-controlled circuit (Wine Cellar PIR 1.1.25)
    lightGroups.wineCellarLeds.emissives.push(warmLedStripMat);

    // Warm wash from the shelf LED strips across the racks (parented to the scene root)
    const cellarLedWashLight = new THREE.PointLight(0xffb454, 2.4, 2.8, 1.8);
    cellarLedWashLight.userData.baseIntensity = 2.4;
    cellarLedWashLight.position.set(-10.72, lowerFloorY + 1.2, -1.2);
    scene.add(cellarLedWashLight);
    lightGroups.wineCellarLeds.lights.push(cellarLedWashLight);

    // West Partition Wall Main Wine Rack Unit (against X = -11.315m, facing East +X, spanning Z = -2.36m..-0.38m)
    const rackWestX = -11.315;
    const rackDepth = 0.34;
    const counterDepth = 0.38;
    const rackMinZ = -2.36;
    const rackMaxZ = -0.38;
    const rackSpanZ = rackMaxZ - rackMinZ; // 1.98m across 4 bays (0.495m per bay)
    const rackCenterZ = (rackMinZ + rackMaxZ) / 2;
    const bayCount = 4;
    const bayWidth = rackSpanZ / bayCount; // 0.495m
    const tallMinZ = rackMinZ + 2 * bayWidth; // -1.37m (South 2 bays b = 2, 3 are tall; North 2 bays b = 0, 1 are ground-level)
    const tallSpanZ = rackMaxZ - tallMinZ; // 0.99m
    const tallCenterZ = (tallMinZ + rackMaxZ) / 2; // -0.875m
    const counterHeight = 0.84;
    const rackHeight = 2.18;

    // 1. Solid oak back panels:
    //    - Ground-level back panel across all 4 West-wall bays (Y = 0..0.84m)
    const lowerBackBoard = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.018, counterHeight, rackSpanZ)),
      cellarOakMat
    );
    lowerBackBoard.name = 'bootLobby.wineCellar.lowerBackBoard';
    lowerBackBoard.position.set(rackWestX + 0.01, lowerFloorY + counterHeight / 2, rackCenterZ);
    wineCellarGroup.add(lowerBackBoard);

    //    - Upper back panel ONLY on the first 2 tall bays at the South start (b = 2, 3: Z = -1.37m..-0.38m, Y = 0.84m..2.18m)
    const upperTallH = rackHeight - counterHeight;
    const upperBackBoard = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.018, upperTallH, tallSpanZ)),
      cellarOakMat
    );
    upperBackBoard.name = 'bootLobby.wineCellar.upperBackBoard';
    upperBackBoard.position.set(
      rackWestX + 0.01,
      lowerFloorY + counterHeight + upperTallH / 2,
      tallCenterZ
    );
    wineCellarGroup.add(upperBackBoard);

    // 2. 5 Vertical Oak Bay Dividers along Z:
    //    - i = 0, 1 (North end bays): ground-level height only (counterHeight = 0.84m)
    //    - i = 2, 3, 4 (South start bays): full tall height (rackHeight = 2.18m)
    const shortUprightGeo = createSharedGeo(new THREE.BoxGeometry(rackDepth, counterHeight, 0.028));
    const tallUprightGeo = createSharedGeo(new THREE.BoxGeometry(rackDepth, rackHeight, 0.028));
    for (let i = 0; i <= bayCount; i++) {
      const bz = rackMinZ + (i / bayCount) * rackSpanZ;
      const isTall = i >= 2;
      const uHeight = isTall ? rackHeight : counterHeight;
      const upright = new THREE.Mesh(isTall ? tallUprightGeo : shortUprightGeo, cellarOakMat);
      upright.name = 'bootLobby.wineCellar.upright';
      upright.position.set(rackWestX + rackDepth / 2, lowerFloorY + uHeight / 2, bz);
      upright.castShadow = true;
      upright.receiveShadow = true;
      wineCellarGroup.add(upright);
    }

    // 3. Full-length ground-level horizontal oak shelves across all 4 bays:
    //    base plinth (0.06m), mid crate shelf (0.42m), and continuous solid oak counter top (0.84m)
    const baseShelfGeo = createSharedGeo(new THREE.BoxGeometry(rackDepth, 0.024, rackSpanZ + 0.02));
    const counterShelfGeo = createSharedGeo(
      new THREE.BoxGeometry(counterDepth, 0.036, rackSpanZ + 0.02)
    );
    for (const sy of [0.06, 0.42, counterHeight]) {
      const isCounter = Math.abs(sy - counterHeight) < 0.01;
      const shelfD = isCounter ? counterDepth : rackDepth;
      const shelf = new THREE.Mesh(isCounter ? counterShelfGeo : baseShelfGeo, cellarOakMat);
      shelf.name = 'bootLobby.wineCellar.shelf';
      shelf.position.set(rackWestX + shelfD / 2, lowerFloorY + sy, rackCenterZ);
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      wineCellarGroup.add(shelf);
    }

    // 4. Upper horizontal shelves ONLY on the 2 tall start units (b = 2, 3, Z = -1.37m..-0.38m):
    //    mid-divider above criss-cross rack (1.35m), upper bottle shelf (1.86m), and top cornice (2.14m)
    const tallShelfGeo = createSharedGeo(new THREE.BoxGeometry(rackDepth, 0.024, tallSpanZ + 0.02));
    for (const sy of [1.35, 1.86, 2.14]) {
      const tallShelf = new THREE.Mesh(tallShelfGeo, cellarOakMat);
      tallShelf.name = 'bootLobby.wineCellar.tallShelf';
      tallShelf.position.set(rackWestX + rackDepth / 2, lowerFloorY + sy, tallCenterZ);
      tallShelf.castShadow = true;
      tallShelf.receiveShadow = true;
      wineCellarGroup.add(tallShelf);
    }

    // Issue #5: Integrated Warm Cabinet LED Strip Lighting throughout the Wine Cellar shelving & criss-cross wine racks!
    // A. Full-length horizontal LED strips under the counter overhang (0.818m) and lower crate shelf (0.404m)
    const lowerLedGeo = createSharedGeo(new THREE.BoxGeometry(0.014, 0.008, rackSpanZ - 0.05));
    for (const [ledY, ledX] of [
      [counterHeight - 0.022, rackWestX + counterDepth - 0.028],
      [0.404, rackWestX + rackDepth - 0.028],
    ] as const) {
      const lowerLedStrip = new THREE.Mesh(lowerLedGeo, warmLedStripMat);
      lowerLedStrip.name = 'bootLobby.wineCellar.ledStrip.lower';
      lowerLedStrip.position.set(ledX, lowerFloorY + ledY, rackCenterZ);
      wineCellarGroup.add(lowerLedStrip);
    }

    // B. Dual (front-lip + rear-backboard) warm LED strips under every upper shelf in the 2 tall criss-cross bays (b = 2, 3)
    const tallShelfLedGeo = createSharedGeo(new THREE.BoxGeometry(0.014, 0.009, tallSpanZ - 0.04));
    for (const sy of [1.334, 1.844, 2.124] as const) {
      for (const lx of [rackWestX + 0.036, rackWestX + rackDepth - 0.026] as const) {
        const tallShelfLed = new THREE.Mesh(tallShelfLedGeo, warmLedStripMat);
        tallShelfLed.name = 'bootLobby.wineCellar.ledStrip.upper';
        tallShelfLed.position.set(lx, lowerFloorY + sy, tallCenterZ);
        wineCellarGroup.add(tallShelfLed);
      }
    }

    // C. Vertical recessed warm LED strips along the inner side cheeks of each tall criss-cross wine rack bay (b = 2, 3)
    const vertLedGeo = createSharedGeo(new THREE.BoxGeometry(0.012, 1.25, 0.009));
    for (const b of [2, 3] as const) {
      const bayCenterZ = rackMinZ + (b + 0.5) * bayWidth;
      for (const sideSign of [-1, 1] as const) {
        const vertLed = new THREE.Mesh(vertLedGeo, warmLedStripMat);
        vertLed.name = 'bootLobby.wineCellar.ledStrip.vertical';
        vertLed.position.set(
          rackWestX + 0.034,
          lowerFloorY + 1.49,
          bayCenterZ + sideSign * (bayWidth * 0.5 - 0.022)
        );
        wineCellarGroup.add(vertLed);
      }
    }

    // 5. Wooden Bordeaux wine cases in the lower cubbies across all 4 West-wall bays (Y = 0.22m and 0.58m)
    const crateW = bayWidth - 0.06;
    const crateGeo = createSharedGeo(new THREE.BoxGeometry(rackDepth - 0.05, 0.24, crateW));
    for (let b = 0; b < bayCount; b++) {
      const bayMidZ = rackMinZ + ((b + 0.5) / bayCount) * rackSpanZ;
      for (const cy of [0.22, 0.58]) {
        const crate = new THREE.Mesh(crateGeo, cellarCrateOakMat);
        crate.name = 'bootLobby.wineCellar.crate';
        crate.position.set(rackWestX + rackDepth / 2, lowerFloorY + cy, bayMidZ);
        crate.castShadow = true;
        wineCellarGroup.add(crate);
      }
    }

    // Shared horizontal wine bottle geometries (necks pointing East +X on West wall)
    const bottleBodyGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.205, 10);
    bottleBodyGeo.rotateZ(Math.PI / 2);
    createSharedGeo(bottleBodyGeo);
    const bottleNeckGeo = new THREE.CylinderGeometry(0.013, 0.021, 0.082, 10);
    bottleNeckGeo.rotateZ(Math.PI / 2);
    createSharedGeo(bottleNeckGeo);
    const bottleLabelGeo = createSharedGeo(new THREE.BoxGeometry(0.088, 0.011, 0.046));

    const addHorizontalBottleEast = (bx: number, by: number, bz: number, isAmber: boolean): void => {
      const bBody = tagHighLod(
        new THREE.Mesh(bottleBodyGeo, isAmber ? burgundyAmberGlassMat : bordeauxGreenGlassMat)
      );
      bBody.name = 'bootLobby.wineCellar.bottle.body';
      bBody.position.set(bx + 0.135, by, bz);
      bBody.castShadow = true;
      wineCellarGroup.add(bBody);

      const bNeck = tagHighLod(new THREE.Mesh(bottleNeckGeo, brassMat));
      bNeck.name = 'bootLobby.wineCellar.bottle.neck';
      bNeck.position.set(bx + 0.268, by, bz);
      wineCellarGroup.add(bNeck);

      const bLabel = tagHighLod(new THREE.Mesh(bottleLabelGeo, wineLabelMat));
      bLabel.name = 'bootLobby.wineCellar.bottle.label';
      bLabel.position.set(bx + 0.145, by + 0.031, bz);
      wineCellarGroup.add(bLabel);
    };

    // 6. Issue #1: Criss-Cross Diamond Oak Wine Racks inside the 2 Tall Units at the Start (South bays b = 2, 3)
    //    Two stacked criss-cross diamond sections per tall bay:
    //    - Lower diamond section: Y = 0.86m..1.34m (height 0.48m, inner width 0.467m)
    //    - Upper diamond section: Y = 1.37m..1.85m (height 0.48m, inner width 0.467m)
    const innerBayW = bayWidth - 0.028; // 0.467m
    const sectionH = 0.48;
    const diagLen = Math.hypot(innerBayW, sectionH) - 0.012;
    const diagAngle = Math.atan2(sectionH, innerBayW);
    const slatGeo = createSharedGeo(new THREE.BoxGeometry(rackDepth - 0.024, 0.014, diagLen));
    const halfDiagGeo = createSharedGeo(
      new THREE.BoxGeometry(rackDepth - 0.024, 0.014, diagLen * 0.5)
    );
    const cradleBarGeo = createSharedGeo(new THREE.BoxGeometry(0.014, 0.014, innerBayW - 0.02));

    for (const b of [2, 3] as const) {
      const bayCenterZ = rackMinZ + (b + 0.5) * bayWidth;
      for (const secMidY of [1.10, 1.61] as const) {
        // Main X-diagonal slats crossing the center of the cubby
        for (const sign of [-1, 1] as const) {
          const mainDiag = new THREE.Mesh(slatGeo, cellarOakMat);
          mainDiag.name = 'bootLobby.wineCellar.crissCrossRack';
          mainDiag.position.set(rackWestX + rackDepth / 2, lowerFloorY + secMidY, bayCenterZ);
          mainDiag.rotation.x = sign * diagAngle;
          mainDiag.castShadow = true;
          mainDiag.receiveShadow = true;
          wineCellarGroup.add(mainDiag);
        }

        // Sub-grid parallel diamond lattice slats forming 9 diamond bottle pockets per section
        for (const [zOff, yOff, sign] of [
          [-innerBayW * 0.25, sectionH * 0.25, 1],
          [innerBayW * 0.25, -sectionH * 0.25, 1],
          [-innerBayW * 0.25, -sectionH * 0.25, -1],
          [innerBayW * 0.25, sectionH * 0.25, -1],
        ] as const) {
          const subDiag = new THREE.Mesh(halfDiagGeo, cellarOakMat);
          subDiag.name = 'bootLobby.wineCellar.crissCrossRack';
          subDiag.position.set(
            rackWestX + rackDepth / 2,
            lowerFloorY + secMidY + yOff,
            bayCenterZ + zOff
          );
          subDiag.rotation.x = sign * diagAngle;
          subDiag.castShadow = true;
          subDiag.receiveShadow = true;
          wineCellarGroup.add(subDiag);
        }

        // Stock wine bottles inside the diamond cubbies of the criss-cross rack
        for (const [bzOff, byOff, idx] of [
          [0, -0.15, 0],
          [-0.115, -0.04, 1],
          [0.115, -0.04, 2],
          [0, 0.06, 3],
          [-0.115, 0.14, 4],
          [0.115, 0.14, 5],
        ] as const) {
          if ((b + idx + Math.round(secMidY * 10)) % 6 === 0) continue;
          addHorizontalBottleEast(
            rackWestX,
            lowerFloorY + secMidY + byOff,
            bayCenterZ + bzOff,
            (b + idx) % 2 === 0
          );
        }
      }

      // Top shelf bottle row (Y = 1.86m..2.14m) in the 2 tall start bays
      const cradleBar = tagHighLod(new THREE.Mesh(cradleBarGeo, cellarSteelMat));
      cradleBar.name = 'bootLobby.wineCellar.bottleCradleBar';
      cradleBar.position.set(rackWestX + rackDepth - 0.035, lowerFloorY + 1.892, bayCenterZ);
      wineCellarGroup.add(cradleBar);

      for (let k = 0; k < 4; k++) {
        const bz = bayCenterZ - 0.15 + k * 0.1;
        addHorizontalBottleEast(rackWestX, lowerFloorY + 1.912, bz, (b + k) % 3 === 0);
      }
    }

    // =========================================================================
    // 7. Issue #1: Corner Wrap-Around Oak Counter Unit along the North Wall
    //    (X = -11.315m..-9.82m, Z = -2.48m..-2.08m, height = counterHeight = 0.84m)
    //    with a Built-In Under-Counter Glass-Door Wine Cooler underneath!
    // =========================================================================
    const northReturnMinX = rackWestX + rackDepth; // -10.975m (starts flush at East face of West unit)
    const northReturnMaxX = -9.82;
    const northReturnSpanX = northReturnMaxX - northReturnMinX; // 1.155m
    const northReturnMidX = (northReturnMinX + northReturnMaxX) / 2; // -10.3975m
    const northWallZ = -2.48;
    const northReturnDepth = 0.38;
    const northReturnMidZ = northWallZ + northReturnDepth / 2; // -2.29m

    // Corner filler counter slab bridging Z = -2.48m..-2.36m at the NW corner + North wall return counter top
    const northCounterTop = new THREE.Mesh(
      createSharedGeo(
        new THREE.BoxGeometry(northReturnMaxX - rackWestX, 0.036, northReturnDepth + 0.03)
      ),
      cellarOakMat
    );
    northCounterTop.name = 'bootLobby.wineCellar.cornerCounterTop';
    northCounterTop.position.set(
      (rackWestX + northReturnMaxX) / 2,
      lowerFloorY + counterHeight,
      northReturnMidZ + 0.015
    );
    northCounterTop.castShadow = true;
    northCounterTop.receiveShadow = true;
    wineCellarGroup.add(northCounterTop);

    // Warm LED strip under the North wrap-around counter front overhang
    const northCounterLed = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(northReturnSpanX - 0.04, 0.008, 0.014)),
      warmLedStripMat
    );
    northCounterLed.name = 'bootLobby.wineCellar.ledStrip.northCounter';
    northCounterLed.position.set(
      northReturnMidX,
      lowerFloorY + counterHeight - 0.022,
      northWallZ + northReturnDepth - 0.018
    );
    wineCellarGroup.add(northCounterLed);

    ctx.addGlowPool('wineCellarLeds', -10.85, lowerFloorY + 0.006, -1.15, 1.45, 0.24);

    // North return oak back panel restricted to the left open cubby bay (X = -10.975m..-10.466m)
    // so it never overlaps coplanarly with the recessed wine cooler cavity back wall
    const leftCubbySpanX = -10.466 - northReturnMinX; // 0.509m
    const leftCubbyMidX = (northReturnMinX + -10.466) / 2; // -10.7205m
    const northBackPanel = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(leftCubbySpanX, counterHeight, 0.018)),
      cellarOakMat
    );
    northBackPanel.name = 'bootLobby.wineCellar.northBackPanel';
    northBackPanel.position.set(leftCubbyMidX, lowerFloorY + counterHeight / 2, northWallZ + 0.01);
    wineCellarGroup.add(northBackPanel);

    const returnCheekGeo = createSharedGeo(
      new THREE.BoxGeometry(0.028, counterHeight - 0.02, northReturnDepth)
    );
    for (const px of [northReturnMinX + 0.014, northReturnMaxX - 0.014, -10.466] as const) {
      const returnCheek = new THREE.Mesh(returnCheekGeo, cellarOakMat);
      returnCheek.name = 'bootLobby.wineCellar.cornerPanel';
      returnCheek.position.set(px, lowerFloorY + (counterHeight - 0.02) / 2, northReturnMidZ);
      returnCheek.castShadow = true;
      returnCheek.receiveShadow = true;
      wineCellarGroup.add(returnCheek);
    }

    // Corner open oak cubby shelves on the left of the wine cooler (X = -10.961m..-10.48m)
    const cornerShelfGeo = createSharedGeo(
      new THREE.BoxGeometry(0.48, 0.024, northReturnDepth - 0.02)
    );
    for (const sy of [0.06, 0.42] as const) {
      const cornerShelf = new THREE.Mesh(cornerShelfGeo, cellarOakMat);
      cornerShelf.name = 'bootLobby.wineCellar.cornerShelf';
      cornerShelf.position.set(-10.72, lowerFloorY + sy, northReturnMidZ);
      wineCellarGroup.add(cornerShelf);
    }

    // Issue #11: Reuse the exact Kitchen Island Under-Counter Wine Cooler (`buildUnderCounterWineCooler`)
    // Centered at X = -10.15m (spanning X = -10.45m..-9.85m, 0.60m wide) underneath the North wrap-around counter,
    // with a matching oak base kick-plinth (`Y = lowerFloorY..lowerFloorY + 0.06m`) and zero coplanar dithering
    const coolerKickPlinth = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.6, 0.06, 0.34)),
      cellarOakMat
    );
    coolerKickPlinth.name = 'bootLobby.wineCellar.wineCooler.plinth';
    coolerKickPlinth.position.set(-10.15, lowerFloorY + 0.03, -2.29);
    coolerKickPlinth.castShadow = true;
    coolerKickPlinth.receiveShadow = true;
    wineCellarGroup.add(coolerKickPlinth);

    buildUnderCounterWineCooler(wineCellarGroup, -10.15, -2.1, interactions, {
      groupName: 'bootLobby.wineCellar.wineCooler',
      yOffset: lowerFloorY - 0.04,
    });

    scene.add(wineCellarGroup);
  }

  // South Exterior Brick Wall of Boot Lobby (0.28m thick, Z = +2.40m..+2.68m, X = -9.56m..-12.81m):
  // 2-pane Georgian Casement Window centered at X = -11.65m with Solid European Oak bullnose window board & 75mm architrave
  addBrickWallAlongXWithWindow(
    -12.81,
    -9.56,
    2.4,
    2.68,
    -11.65,
    1.18,
    0.84,
    1.86,
    'north',
    2
  );

  // Face-fixed linen Roman blind over the Boot Lobby South window (X = -11.65m)
  buildWindowRomanBlind(scene, tagCutawayWall, {
    name: 'bootLobby.southWindow.romanBlind',
    zone: 'bootLobby',
    centerX: -11.65,
    width: 1.18,
    railY: 1.815,
    bottomY: 1.46,
    wallFaceZ: 2.38,
    facingZ: -1,
    cutawayWall: {
      axis: 'z',
      coord: 2.54,
      minSpan: -12.81,
      maxSpan: -9.56,
      floor: 'ground',
    },
  });

  // White-painted plasterboard ceiling backing across Boot Lobby, Under-Stairs Store & Cloakroom WC between the oak joists
  const bootLobbyCeilingWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf7f5f0,
    roughness: 0.88,
    metalness: 0.01,
  });
  const bootLobbyCeilingBacking = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(3.54, 0.032, 5.18)),
    bootLobbyCeilingWhiteMat
  );
  bootLobbyCeilingBacking.name = 'bootLobby.ceilingBacking';
  bootLobbyCeilingBacking.position.set(-11.31, wallH, -0.075);
  bootLobbyCeilingBacking.receiveShadow = true;
  groundFloorCeilingGroup.add(bootLobbyCeilingBacking);

  // Exposed Natural Oak North-South Ceiling Joists in the Boot Lobby & WC:
  // Spans the shorter 2.50m North-South distance between the Z = -0.175m load-bearing partition wall and
  // the Z = +2.40m South exterior brick wall, embedding cleanly into the ceiling backing and both walls (Issue #1)!
  const bootJoistGeo = createSharedGeo(new THREE.BoxGeometry(0.085, 0.11, 2.58));
  const wcJoistGeo = createSharedGeo(new THREE.BoxGeometry(0.085, 0.11, 2.36));
  for (let bx = -12.585; bx <= -10.005; bx += 0.43) {
    const bootJoist = new THREE.Mesh(bootJoistGeo, oakMat);
    bootJoist.name = 'bootLobby.ceilingJoist';
    bootJoist.position.set(bx, wallH - 0.065, 1.15);
    bootJoist.castShadow = true;
    groundFloorCeilingGroup.add(bootJoist);

    // Matching North-bay ceiling joists in the Downstairs WC & Wine Cellar (X = -11.65m..-9.80m, Z = -2.50m..-0.15m)
    if (bx >= -11.55) {
      const wcJoist = new THREE.Mesh(wcJoistGeo, oakMat);
      wcJoist.name = 'wc.ceilingJoist';
      wcJoist.position.set(bx, wallH - 0.065, -1.35);
      wcJoist.castShadow = true;
      groundFloorCeilingGroup.add(wcJoist);
    }
  }
}
