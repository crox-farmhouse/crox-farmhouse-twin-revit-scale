import * as THREE from 'three';
import {
  addCasedArchitravePortal,
  buildMitredWallSkirtingGeometry,
} from '../../../../engine/geometry/swept-moulding.ts';
import { buildWindowRomanBlind } from '../../../../objects/decor/roman-blind.ts';
import type { CutawayWallDescriptor, SceneBuilderContext } from '../../../../types/scene.ts';
import type { createGroundFloorMaterials } from '../../structure/ground-floor-materials.ts';
import type { createGroundFloorShellKit } from '../../structure/ground-floor-shell-kit.ts';
import type { buildDiningRoom } from './dining-room.ts';
import { buildUnderCounterWineCooler } from './kitchen-island.ts';

/**
 * Middle Boot Lobby (`bootLobby`), store, cloakroom WC and wine cellar.
 *
 * Extracted verbatim from `buildMainHouseGroundFloorRooms` (ground-floor-rooms.ts). Statement order and
 * geometry are unchanged; shared locals flow in via `kit` and out via the return value.
 */
export function buildBootLobby(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createGroundFloorMaterials>, 'antiqueOakSkirtingMat' | 'applyWorldSpaceFloorUVs' | 'brassMat' | 'ceramicWhiteMat' | 'doorH' | 'engineeredOakFloorMat' | 'oakMat' | 'skirtingMat' | 'tagCutawayWall' | 'wallH' | 'warmRoomPlasterMat'> &
    Pick<ReturnType<typeof createGroundFloorShellKit>, 'addBrickWallAlongXWithWindow' | 'addInteractiveInteriorDoor' | 'addInteriorWall'> &
    Pick<ReturnType<typeof buildDiningRoom>, 'lowerDoorLintelH' | 'lowerDoorLintelY' | 'lowerFloorY' | 'lowerWallH' | 'lowerWallMidY'>
): void {
  const { groundFloorCeilingGroup, interactions, lightGroups, scene } = ctx;
  const {
    addBrickWallAlongXWithWindow,
    addInteractiveInteriorDoor,
    addInteriorWall,
    antiqueOakSkirtingMat,
    applyWorldSpaceFloorUVs,
    brassMat,
    ceramicWhiteMat,
    doorH,
    engineeredOakFloorMat,
    lowerDoorLintelH,
    lowerDoorLintelY,
    lowerFloorY,
    lowerWallH,
    lowerWallMidY,
    oakMat,
    skirtingMat,
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
    applyWorldSpaceFloorUVs(
      new THREE.BoxGeometry(3.25, 0.08, 4.9),
      -11.425,
      -0.05,
      1 / 4.4,
      1 / 1.76
    ),
    engineeredOakFloorMat
  );
  bootLobbyFloor.name = 'bootLobby.floor';
  bootLobbyFloor.position.set(-11.425, lowerFloorY - 0.04, -0.05);
  bootLobbyFloor.receiveShadow = true;
  scene.add(bootLobbyFloor);

  // North Exterior Brick Wall across East Cloakroom WC (X = -11.45m..-9.56m) and West Store/Cupboard (X = -12.81m..-11.45m)
  addBrickWallAlongXWithWindow(
    -11.45,
    -9.56,
    -2.78,
    -2.5,
    -10.62,
    0.85,
    0.98,
    1.86,
    'south',
    2
  );
  addBrickWallAlongXWithWindow(
    -12.81,
    -11.45,
    -2.78,
    -2.5,
    -12.14,
    0.76,
    0.79,
    1.6,
    'south',
    2
  );

  // Face-fixed linen Roman blind over the Downstairs Cloakroom WC North window (X = -12.14m, lowered to sillY = 0.79m..1.60m — Issue #10)
  buildWindowRomanBlind(scene, tagCutawayWall, {
    name: 'bootLobby.downstairsWc.northWindow.romanBlind',
    zone: 'bootLobby',
    centerX: -12.14,
    width: 0.56,
    railY: 1.555,
    bottomY: 1.22,
    wallFaceZ: -2.5,
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
      buildMitredWallSkirtingGeometry(path, lowerFloorY),
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

    // Outer stepped frame rails (top, bottom, north, south)
    for (const [ry, rz, rw, rh] of [
      [picH * 0.5 - railW * 0.5, 0, picW, railW],
      [-picH * 0.5 + railW * 0.5, 0, picW, railW],
      [0, -picW * 0.5 + railW * 0.5, railW, picH - railW * 2],
      [0, picW * 0.5 - railW * 0.5, railW, picH - railW * 2],
    ] as const) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(frameD, rh, rw),
        frameMouldingMat
      );
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
      new THREE.BoxGeometry(0.012, innerH, innerW),
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
      new THREE.PlaneGeometry(canvasW, canvasH),
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
    const brassSlip = new THREE.Mesh(
      new THREE.BoxGeometry(0.013, canvasH + 0.012, canvasW + 0.012),
      brassMat
    );
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
      new THREE.BoxGeometry(
        wineLeafW - wineStileW * 2 + 0.008,
        wineLeafH - wineRailH * 2 + 0.008,
        0.014
      ),
      wineGlassMat
    );
    glassPane.name = 'bootLobby.wineCellarGlassDoor.glass';
    wineDoorObj.add(glassPane);

    // Solid antique oak perimeter stiles, top/bottom rails & glazing bars matching the oak architrave (Issue #3)
    for (const side of [-1, 1] as const) {
      const stile = new THREE.Mesh(
        new THREE.BoxGeometry(wineStileW, wineLeafH, 0.046),
        antiqueOakSkirtingMat
      );
      stile.position.set(side * (wineLeafW / 2 - wineStileW / 2), 0, 0);
      stile.castShadow = true;
      stile.receiveShadow = true;
      wineDoorObj.add(stile);
    }
    for (const [ry, rh] of [
      [wineLeafH / 2 - wineRailH / 2, wineRailH],
      [-wineLeafH / 2 + wineRailH * 0.7, wineRailH * 1.4],
    ] as const) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(wineLeafW - wineStileW * 2, rh, 0.046),
        antiqueOakSkirtingMat
      );
      rail.position.set(0, ry, 0);
      rail.castShadow = true;
      rail.receiveShadow = true;
      wineDoorObj.add(rail);
    }
    // Two solid oak horizontal glazing bars
    for (const barY of [-0.32, 0.34]) {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(wineLeafW - wineStileW * 2, 0.026, 0.032),
        antiqueOakSkirtingMat
      );
      bar.position.set(0, barY, 0);
      wineDoorObj.add(bar);
    }

    // Long vertical aged-brass pull handles on both faces
    const handleX = wineLeafW / 2 - wineStileW * 0.5;
    for (const zSide of [-1, 1] as const) {
      const pullBar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.009, 0.009, 0.38, 12),
        brassMat
      );
      pullBar.position.set(handleX, -0.04, zSide * 0.038);
      wineDoorObj.add(pullBar);
      for (const standY of [-0.19, 0.11]) {
        const standoff = new THREE.Mesh(
          new THREE.CylinderGeometry(0.007, 0.007, 0.022, 10),
          brassMat
        );
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

  // Downstairs Toilet / Cloakroom WC inside the West Room
  // (Issue #11 & Issue #15: darker heritage painted walls, warm honed Carrara marble tiled floor, substantial marble-topped Shaker vanity unit, and cozy low-glare lighting)
  // Room bounds: X = -12.81m..-11.465m, Z = -2.50m..-0.25m, Y = lowerFloorY = -0.30m
  {
    const wcGroup = new THREE.Group();
    wcGroup.name = 'bootLobby.downstairsWc';
    wcGroup.userData.zone = 'bootLobby';

    // Procedural warm honed Carrara marble texture for the WC floor tiles & vanity countertop (Issue #15: toned down from bright white)
    const marbleCanvas = document.createElement('canvas');
    marbleCanvas.width = 512;
    marbleCanvas.height = 512;
    const mCtx = marbleCanvas.getContext('2d');
    if (mCtx) {
      mCtx.fillStyle = '#cbc4b8';
      mCtx.fillRect(0, 0, 512, 512);

      // Soft cloudy mineral variations
      for (const [cx, cy, r, alpha] of [
        [120, 140, 160, 0.08],
        [360, 220, 180, 0.07],
        [220, 400, 150, 0.08],
      ] as const) {
        const grad = mCtx.createRadialGradient(cx, cy, 10, cx, cy, r);
        grad.addColorStop(0, `rgba(115, 118, 122, ${alpha})`);
        grad.addColorStop(1, 'rgba(203, 196, 184, 0)');
        mCtx.fillStyle = grad;
        mCtx.fillRect(0, 0, 512, 512);
      }

      // Delicate diagonal Carrara grey veining
      mCtx.strokeStyle = 'rgba(105, 110, 116, 0.36)';
      mCtx.lineWidth = 2.2;
      for (let v = 0; v < 7; v++) {
        mCtx.beginPath();
        const startX = (v * 83) % 512;
        mCtx.moveTo(startX, 0);
        mCtx.bezierCurveTo(
          (startX + 90) % 512,
          170,
          (startX + 40) % 512,
          340,
          (startX + 140) % 512,
          512
        );
        mCtx.stroke();
      }

      // 4x4 large-format honed marble tile grout grid
      mCtx.strokeStyle = 'rgba(140, 135, 127, 0.58)';
      mCtx.lineWidth = 2;
      for (const g of [128, 256, 384] as const) {
        mCtx.beginPath();
        mCtx.moveTo(g, 0);
        mCtx.lineTo(g, 512);
        mCtx.moveTo(0, g);
        mCtx.lineTo(512, g);
        mCtx.stroke();
      }
    }
    const wcMarbleTex = new THREE.CanvasTexture(marbleCanvas);
    wcMarbleTex.colorSpace = THREE.SRGBColorSpace;
    wcMarbleTex.wrapS = THREE.RepeatWrapping;
    wcMarbleTex.wrapT = THREE.RepeatWrapping;
    wcMarbleTex.repeat.set(1.5, 2.5);

    const wcMarbleFloorMat = new THREE.MeshStandardMaterial({
      map: wcMarbleTex,
      roughness: 0.44,
      metalness: 0.03,
    });
    const wcMarbleCounterMat = new THREE.MeshStandardMaterial({
      map: wcMarbleTex,
      roughness: 0.32,
      metalness: 0.04,
    });

    // Honed Carrara Marble Tiled Floor covering the entire Downstairs WC room (X = -12.81m..-11.465m, Z = -2.50m..-0.25m)
    const wcMarbleFloor = new THREE.Mesh(
      new THREE.BoxGeometry(1.345, 0.012, 2.25),
      wcMarbleFloorMat
    );
    wcMarbleFloor.name = 'bootLobby.downstairsWc.marbleFloor';
    wcMarbleFloor.position.set(-12.1375, lowerFloorY + 0.004, -1.375);
    wcMarbleFloor.receiveShadow = true;
    wcGroup.add(wcMarbleFloor);

    // Darker heritage painted walls (deep Farrow & Ball Hague Blue / Railings slate-charcoal #253338) on all 4 WC interior faces
    const wcDarkWallMat = new THREE.MeshStandardMaterial({
      color: 0x253338,
      roughness: 0.6,
      metalness: 0.03,
    });

    // West interior wall lining (X = -12.80m, Z = -2.49m..-0.25m)
    const wcWestDarkWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, lowerWallH, 2.24),
      wcDarkWallMat
    );
    wcWestDarkWall.name = 'bootLobby.downstairsWc.westWall';
    wcWestDarkWall.position.set(-12.8, lowerWallMidY, -1.37);
    wcWestDarkWall.receiveShadow = true;
    wcGroup.add(wcWestDarkWall);

    // East interior partition wall lining (X = -11.472m, Z = -2.49m..-0.25m)
    const wcEastDarkWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, lowerWallH, 2.24),
      wcDarkWallMat
    );
    wcEastDarkWall.name = 'bootLobby.downstairsWc.eastWall';
    wcEastDarkWall.position.set(-11.472, lowerWallMidY, -1.37);
    wcEastDarkWall.receiveShadow = true;
    wcGroup.add(wcEastDarkWall);

    // South interior wall lining around the WC door (Z = -0.258m, door at X = -12.54m..-11.70m)
    for (const [sx, sw] of [
      [-12.67, 0.26],
      [-11.585, 0.23],
    ] as const) {
      const southPierLining = new THREE.Mesh(
        new THREE.BoxGeometry(sw, lowerWallH, 0.016),
        wcDarkWallMat
      );
      southPierLining.position.set(sx, lowerWallMidY, -0.258);
      southPierLining.receiveShadow = true;
      wcGroup.add(southPierLining);
    }
    const wcSouthDoorHeaderLining = new THREE.Mesh(
      new THREE.BoxGeometry(0.84, lowerDoorLintelH, 0.016),
      wcDarkWallMat
    );
    wcSouthDoorHeaderLining.position.set(-12.12, lowerDoorLintelY, -0.258);
    wcGroup.add(wcSouthDoorHeaderLining);

    // North exterior wall dark lining around the WC window (X = -12.52m..-11.76m, Y = 0.79m..1.60m), tagged with tagCutawayWall
    const wcNorthCutaway: CutawayWallDescriptor = {
      axis: 'z',
      coord: -2.64,
      minSpan: -12.81,
      maxSpan: -11.45,
      floor: 'ground',
    };
    for (const [nx, ny, nw, nh] of [
      [-12.665, lowerWallMidY, 0.29, lowerWallH],
      [-11.615, lowerWallMidY, 0.29, lowerWallH],
      [-12.14, (lowerFloorY + 0.79) / 2, 0.76, 0.79 - lowerFloorY],
      [-12.14, (1.6 + wallH) / 2, 0.76, wallH - 1.6],
    ] as const) {
      const northLining = new THREE.Mesh(
        new THREE.BoxGeometry(nw, nh, 0.016),
        wcDarkWallMat
      );
      northLining.position.set(nx, ny, -2.49);
      northLining.receiveShadow = true;
      tagCutawayWall(northLining, wcNorthCutaway);
      wcGroup.add(northLining);
    }

    // 1. Much More Substantial Floor-Standing Bespoke Period Shaker Vanity Unit on the West wall (Issue #11)
    //    (0.48m deep E-W x 0.84m tall x 0.86m wide N-S, centered at Z = -0.88m, X = -12.80m..-12.32m)
    const vanityCabinetMat = new THREE.MeshStandardMaterial({
      color: 0x3b443c, // rich deep heritage olive-charcoal joinery
      roughness: 0.48,
      metalness: 0.04,
    });
    const vanityTrimMat = new THREE.MeshStandardMaterial({
      color: 0x2d352e,
      roughness: 0.52,
      metalness: 0.04,
    });
    const wcMirrorCanvas = document.createElement('canvas');
    wcMirrorCanvas.width = 256;
    wcMirrorCanvas.height = 384;
    const wmCtx = wcMirrorCanvas.getContext('2d');
    if (wmCtx) {
      const mGrad = wmCtx.createLinearGradient(0, 0, 256, 384);
      mGrad.addColorStop(0, '#eef4f7');
      mGrad.addColorStop(0.38, '#d8e3e8');
      mGrad.addColorStop(0.7, '#f7f1e6');
      mGrad.addColorStop(1, '#c5d1d8');
      wmCtx.fillStyle = mGrad;
      wmCtx.fillRect(0, 0, 256, 384);

      // Soft warm reflection of opposite East wall sconces & bevelled specular sheen
      for (const [gx, gy] of [
        [78, 150],
        [185, 150],
      ] as const) {
        const sGlow = wmCtx.createRadialGradient(gx, gy, 4, gx, gy, 58);
        sGlow.addColorStop(0, 'rgba(255, 244, 214, 0.85)');
        sGlow.addColorStop(0.45, 'rgba(255, 218, 158, 0.32)');
        sGlow.addColorStop(1, 'rgba(255, 218, 158, 0)');
        wmCtx.fillStyle = sGlow;
        wmCtx.fillRect(0, 0, 256, 384);
      }
      wmCtx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      wmCtx.lineWidth = 5;
      wmCtx.strokeRect(10, 10, 236, 364);
    }
    const wcMirrorTex = new THREE.CanvasTexture(wcMirrorCanvas);
    wcMirrorTex.colorSpace = THREE.SRGBColorSpace;
    const mirrorGlassMat = new THREE.MeshStandardMaterial({
      map: wcMirrorTex,
      emissive: 0xd8d2c6,
      emissiveMap: wcMirrorTex,
      emissiveIntensity: 0.1,
      roughness: 0.12,
      metalness: 0.18,
    });

    const vanityZ = -0.88;
    const vanityW = 0.86; // N-S width along Z
    const vanityD = 0.48; // E-W depth along X
    const vanityCarcassH = 0.80;

    // Moulded base plinth (Y = lowerFloorY..lowerFloorY + 0.085m)
    const vanityPlinth = new THREE.Mesh(
      new THREE.BoxGeometry(vanityD - 0.02, 0.085, vanityW + 0.016),
      vanityTrimMat
    );
    vanityPlinth.position.set(-12.8 + (vanityD - 0.02) / 2, lowerFloorY + 0.0425, vanityZ);
    vanityPlinth.castShadow = true;
    vanityPlinth.receiveShadow = true;
    wcGroup.add(vanityPlinth);

    // Main floor-standing Shaker vanity cabinet carcass (Y = lowerFloorY + 0.08m..0.80m)
    const vanityCab = new THREE.Mesh(
      new THREE.BoxGeometry(vanityD, vanityCarcassH - 0.08, vanityW),
      vanityCabinetMat
    );
    vanityCab.name = 'bootLobby.downstairsWc.vanityCabinet';
    vanityCab.position.set(-12.8 + vanityD / 2, lowerFloorY + 0.44, vanityZ);
    vanityCab.castShadow = true;
    vanityCab.receiveShadow = true;
    wcGroup.add(vanityCab);

    // Framed corner pilasters & 2 recessed Shaker panelled doors on the East (+X) front face
    for (const sideZ of [-1, 1] as const) {
      const doorZ = vanityZ + sideZ * 0.2;
      const shakerDoorFrame = new THREE.Mesh(
        new THREE.BoxGeometry(0.022, 0.62, 0.37),
        vanityTrimMat
      );
      shakerDoorFrame.position.set(-12.8 + vanityD + 0.008, lowerFloorY + 0.44, doorZ);
      shakerDoorFrame.castShadow = true;
      wcGroup.add(shakerDoorFrame);

      const shakerDoorPanel = new THREE.Mesh(
        new THREE.BoxGeometry(0.014, 0.5, 0.26),
        vanityCabinetMat
      );
      shakerDoorPanel.position.set(-12.8 + vanityD + 0.015, lowerFloorY + 0.44, doorZ);
      wcGroup.add(shakerDoorPanel);

      // Aged brass cabinet knob on each Shaker door
      const doorKnob = new THREE.Mesh(
        new THREE.SphereGeometry(0.015, 12, 12),
        brassMat
      );
      doorKnob.position.set(
        -12.8 + vanityD + 0.032,
        lowerFloorY + 0.52,
        vanityZ + sideZ * 0.048
      );
      wcGroup.add(doorKnob);
    }

    // Thick Honed Carrara Marble Countertop Slab (0.51m deep x 0.042m thick x 0.90m wide) + 0.11m Marble Backsplash Upstand
    const basinSlab = new THREE.Mesh(
      new THREE.BoxGeometry(vanityD + 0.03, 0.042, vanityW + 0.04),
      wcMarbleCounterMat
    );
    basinSlab.name = 'bootLobby.downstairsWc.sinkBasin';
    basinSlab.position.set(-12.8 + (vanityD + 0.03) / 2, lowerFloorY + 0.821, vanityZ);
    basinSlab.castShadow = true;
    basinSlab.receiveShadow = true;
    wcGroup.add(basinSlab);

    const marbleUpstand = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, 0.11, vanityW + 0.04),
      wcMarbleCounterMat
    );
    marbleUpstand.position.set(-12.8 + 0.012, lowerFloorY + 0.897, vanityZ);
    marbleUpstand.castShadow = true;
    wcGroup.add(marbleUpstand);

    // Undermounted glazed white porcelain sink basin bowl & brass waste plug
    const basinRim = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.016, 0.52),
      ceramicWhiteMat
    );
    basinRim.position.set(-12.8 + 0.28, lowerFloorY + 0.843, vanityZ);
    wcGroup.add(basinRim);

    const basinWell = new THREE.Mesh(
      new THREE.BoxGeometry(0.27, 0.018, 0.46),
      new THREE.MeshStandardMaterial({ color: 0xdfe3e6, roughness: 0.14, metalness: 0.06 })
    );
    basinWell.position.set(-12.8 + 0.28, lowerFloorY + 0.846, vanityZ);
    wcGroup.add(basinWell);

    // Traditional Perrin & Rowe style aged-brass bridge mixer tap with crosshead hot/cold valves
    const tapStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.02, 0.16, 14),
      brassMat
    );
    tapStem.position.set(-12.8 + 0.085, lowerFloorY + 0.92, vanityZ);
    wcGroup.add(tapStem);

    const tapSpout = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.018, 0.02),
      brassMat
    );
    tapSpout.position.set(-12.8 + 0.145, lowerFloorY + 0.99, vanityZ);
    wcGroup.add(tapSpout);

    for (const valveZ of [vanityZ - 0.11, vanityZ + 0.11] as const) {
      const valveBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.018, 0.065, 12),
        brassMat
      );
      valveBody.position.set(-12.8 + 0.085, lowerFloorY + 0.875, valveZ);
      wcGroup.add(valveBody);

      const crossBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.052, 0.01, 0.052),
        brassMat
      );
      crossBar.position.set(-12.8 + 0.085, lowerFloorY + 0.91, valveZ);
      wcGroup.add(crossBar);
    }

    // Substantial Architectural Aged-Brass Framed Wall Mirror above the vanity (0.72m wide x 0.88m tall)
    // With Warm 2700K Perimeter LED Backlighting ONLY on the West wall + 2 Heritage Brass Wall Sconces on the opposite East wall (Issue #7 & Issue #15)
    const mirrorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.88, 0.72),
      brassMat
    );
    mirrorFrame.name = 'bootLobby.downstairsWc.mirrorFrame';
    mirrorFrame.position.set(-12.8 + 0.024, lowerFloorY + 1.44, vanityZ);
    mirrorFrame.castShadow = true;
    wcGroup.add(mirrorFrame);

    const mirrorSurface = new THREE.Mesh(
      new THREE.BoxGeometry(0.01, 0.82, 0.66),
      mirrorGlassMat
    );
    mirrorSurface.name = 'bootLobby.downstairsWc.mirror';
    mirrorSurface.position.set(-12.8 + 0.036, lowerFloorY + 1.44, vanityZ);
    wcGroup.add(mirrorSurface);

    // Concealed Warm 2700K Perimeter LED Backlight Frame + Soft Wall-Wash Halo behind the WC Mirror (Issue #7 & Issue #15: toned down)
    const wcMirrorLedMat = new THREE.MeshStandardMaterial({
      color: 0xfff3d6,
      emissive: 0xffb85c,
      emissiveIntensity: 1.15,
      roughness: 0.2,
    });
    const wcMirrorHaloMat = new THREE.MeshStandardMaterial({
      color: 0xffdfa8,
      emissive: 0xffb85c,
      emissiveIntensity: 0.65,
      roughness: 0.65,
      transparent: true,
      opacity: 0.36,
    });
    // WC mirror backlight + sconces are on their own PIR-controlled circuit (WC PIR 1.1.26)
    lightGroups.cloakroomWcLights.emissives.push(wcMirrorLedMat, wcMirrorHaloMat);

    // 4-sided warm LED diffuser strips tucked behind the outer edge of the brass mirror frame (X = -12.79m)
    const mirrorCenterY = lowerFloorY + 1.44;
    for (const [dy, dz, stripH, stripD] of [
      [0.435, 0, 0.014, 0.71],  // Top LED bar
      [-0.435, 0, 0.014, 0.71], // Bottom LED bar
      [0, -0.355, 0.86, 0.014], // North vertical LED bar
      [0, 0.355, 0.86, 0.014],  // South vertical LED bar
    ] as const) {
      const ledBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.014, stripH, stripD),
        wcMirrorLedMat
      );
      ledBar.name = 'bootLobby.downstairsWc.mirrorLedStrip';
      ledBar.position.set(-12.8 + 0.009, mirrorCenterY + dy, vanityZ + dz);
      wcGroup.add(ledBar);
    }

    // Soft warm perimeter halo wash on the West wall right behind the mirror
    for (const [dy, dz, haloH, haloD] of [
      [0.47, 0, 0.065, 0.82],
      [-0.47, 0, 0.065, 0.82],
      [0, -0.39, 0.98, 0.065],
      [0, 0.39, 0.98, 0.065],
    ] as const) {
      const haloStrip = new THREE.Mesh(
        new THREE.BoxGeometry(0.004, haloH, haloD),
        wcMirrorHaloMat
      );
      haloStrip.name = 'bootLobby.downstairsWc.mirrorLedHalo';
      haloStrip.position.set(-12.8 + 0.003, mirrorCenterY + dy, vanityZ + dz);
      wcGroup.add(haloStrip);
    }

    // Issue #7 & Issue #15: No wall lights on the West vanity side (only mirror backlighting);
    // 2 Heritage Aged-Brass & Fluted Opal-Glass Wall Sconces mounted on the opposite East partition wall (X = -11.48m, dirX = -1)
    const wcSconceShadeMat = new THREE.MeshStandardMaterial({
      color: 0xfff5e0,
      emissive: 0xffb85c,
      emissiveIntensity: 1.05,
      roughness: 0.35,
      side: THREE.DoubleSide,
    });
    wcSconceShadeMat.userData.baseEmissiveIntensity = 1.05;
    const wcSconceBulbMat = new THREE.MeshStandardMaterial({
      color: 0xfff9eb,
      emissive: 0xffc470,
      emissiveIntensity: 1.4,
      roughness: 0.15,
    });
    wcSconceBulbMat.userData.baseEmissiveIntensity = 1.4;
    lightGroups.cloakroomWcLights.emissives.push(wcSconceShadeMat, wcSconceBulbMat);

    // Soft fill from the two opal sconces (parented to the scene root, never to a cutaway group)
    const wcFillLight = new THREE.PointLight(0xffcf94, 3.2, 3.2, 1.8);
    wcFillLight.userData.baseIntensity = 3.2;
    wcFillLight.position.set(-11.75, lowerFloorY + 1.45, -1.33);
    scene.add(wcFillLight);
    lightGroups.cloakroomWcLights.lights.push(wcFillLight);

    for (const [sIdx, wallX, sconceY, sconceZ, dirX] of [
      [1, -11.48, 1.32, -1.78, -1], // North East-wall sconce
      [2, -11.48, 1.32, -0.88, -1], // South East-wall sconce opposite vanity mirror
    ] as const) {
      const sconceGrp = new THREE.Group();
      sconceGrp.name = `bootLobby.downstairsWc.wallSconce.${sIdx}`;
      sconceGrp.position.set(wallX, sconceY, sconceZ);

      // Stepped circular aged-brass wall backplate
      const backplate = new THREE.Mesh(
        new THREE.CylinderGeometry(0.052, 0.056, 0.014, 18),
        brassMat
      );
      backplate.name = `bootLobby.downstairsWc.wallSconce.${sIdx}.backplate`;
      backplate.rotation.z = Math.PI / 2;
      backplate.position.set(dirX * 0.007, 0, 0);
      backplate.castShadow = true;
      sconceGrp.add(backplate);

      // Curved brass horizontal arm & knurled gallery cup holder
      const arm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.009, 0.095, 12),
        brassMat
      );
      arm.rotation.z = Math.PI / 2;
      arm.position.set(dirX * 0.052, -0.012, 0);
      sconceGrp.add(arm);

      const riser = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.011, 0.045, 14),
        brassMat
      );
      riser.position.set(dirX * 0.095, 0.01, 0);
      sconceGrp.add(riser);

      // Fluted opal-glass cylinder/tulip shade + warm glowing filament bulb
      const shade = new THREE.Mesh(
        new THREE.CylinderGeometry(0.044, 0.036, 0.145, 18, 1, true),
        wcSconceShadeMat
      );
      shade.name = `bootLobby.downstairsWc.wallSconce.${sIdx}.shade`;
      shade.position.set(dirX * 0.095, 0.095, 0);
      shade.castShadow = true;
      sconceGrp.add(shade);

      const bulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 12, 12),
        wcSconceBulbMat
      );
      bulb.name = `bootLobby.downstairsWc.wallSconce.${sIdx}.bulb`;
      bulb.position.set(dirX * 0.095, 0.085, 0);
      sconceGrp.add(bulb);

      wcGroup.add(sconceGrp);
    }

    // 2. High-LOD Traditional Edwardian Low-Level Vitreous China Toilet (`bootLobby.downstairsWc`, Issue #4)
    //    Burlington / Thomas Crapper style traditional WC at X = -12.80m, Z = -1.92m, facing East (+X):
    //    - Sculpted stepped Edwardian pedestal base with brass floor-fixing dome bolts & rear ceramic outlet shroud
    //    - Hollow LatheGeometry glazed vitreous china pan bowl with traditional stepped box-rim, visible inner well & water seal
    //    - Contoured open oval Solid Heritage Walnut toilet seat ring with Aged-Brass pillar bar hinges
    //    - Traditional stepped-cornice vitreous china cistern mounted on ornate cast-brass wall brackets
    //    - Cranked Aged-Brass & White-Porcelain torpedo flush lever + exposed 38mm brass flush pipe & 15mm brass supply pipe
    const toiletZ = -1.92;
    const panCenterX = -12.8 + 0.455; // -12.345m

    const vitreousChinaMat = new THREE.MeshStandardMaterial({
      color: 0xf6f5f0,
      roughness: 0.11,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    const innerBowlGlazeMat = new THREE.MeshStandardMaterial({
      color: 0xe6eaec,
      roughness: 0.08,
      metalness: 0.06,
      side: THREE.DoubleSide,
    });
    const waterSealMat = new THREE.MeshStandardMaterial({
      color: 0xd4edf4,
      roughness: 0.04,
      metalness: 0.12,
      transparent: true,
      opacity: 0.78,
    });
    const walnutSeatMat = new THREE.MeshStandardMaterial({
      color: 0x5c3a21, // Rich satin-lacquered heritage American walnut / antique oak seat
      roughness: 0.28,
      metalness: 0.04,
    });

    // 2A. Stepped Edwardian Vitreous China Pedestal Base & Rear S/P-Trap Outlet Shroud
    const pedestalFootPts = [
      new THREE.Vector2(0.001, 0.0),
      new THREE.Vector2(0.148, 0.0),
      new THREE.Vector2(0.146, 0.018),
      new THREE.Vector2(0.132, 0.028),
      new THREE.Vector2(0.126, 0.046),
      new THREE.Vector2(0.106, 0.068),
      new THREE.Vector2(0.098, 0.145),
      new THREE.Vector2(0.112, 0.188),
    ];
    const wcPanPedestal = new THREE.Mesh(
      new THREE.LatheGeometry(pedestalFootPts, 24),
      vitreousChinaMat
    );
    wcPanPedestal.name = 'bootLobby.downstairsWc.toiletPedestal';
    wcPanPedestal.position.set(panCenterX - 0.015, lowerFloorY + 0.01, toiletZ);
    wcPanPedestal.scale.set(1.26, 1.0, 0.88);
    wcPanPedestal.castShadow = true;
    wcPanPedestal.receiveShadow = true;
    wcGroup.add(wcPanPedestal);

    // Aged-brass floor-fixing dome screw caps on the North & South flanges of the pedestal foot
    for (const boltSideZ of [-1, 1] as const) {
      const floorBolt = new THREE.Mesh(
        new THREE.SphereGeometry(0.011, 10, 10),
        brassMat
      );
      floorBolt.position.set(panCenterX - 0.015, lowerFloorY + 0.026, toiletZ + boltSideZ * 0.116);
      wcGroup.add(floorBolt);
    }

    // Issue #9: Boxed-out painted plasterboard waste/soil pipe casing (`bootLobby.downstairsWc.wastePipeBoxing`)
    // on the West wall (`X = -12.80m`):
    // - Vertical full-height stack boxing at Z = -1.64m..-1.32m (centered at Z = -1.48m between the Shaker vanity
    //   at Z = -1.31m and the WC cistern at Z = -1.69m, X = -12.80m..-12.60m, Y = lowerFloorY..wallH)
    // - Low horizontal soil/waste pipe boxing ledge from the vertical stack (Z = -1.64m) North behind the toilet pan
    //   to the North wall (Z = -2.482m, X = -12.80m..-12.62m, Y = lowerFloorY..lowerFloorY + 0.38m)
    const wastePipeBoxingGroup = new THREE.Group();
    wastePipeBoxingGroup.name = 'bootLobby.downstairsWc.wastePipeBoxing';

    const vertStackBoxing = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, lowerWallH, 0.32),
      wcDarkWallMat
    );
    vertStackBoxing.name = 'bootLobby.downstairsWc.wastePipeBoxing.verticalStack';
    vertStackBoxing.position.set(-12.7, lowerWallMidY, -1.48);
    vertStackBoxing.castShadow = true;
    vertStackBoxing.receiveShadow = true;
    wastePipeBoxingGroup.add(vertStackBoxing);

    const horizSoilBoxing = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.36, 0.842),
      wcDarkWallMat
    );
    horizSoilBoxing.name = 'bootLobby.downstairsWc.wastePipeBoxing.horizontalDuct';
    horizSoilBoxing.position.set(-12.71, lowerFloorY + 0.18, -2.061);
    horizSoilBoxing.castShadow = true;
    horizSoilBoxing.receiveShadow = true;
    wastePipeBoxingGroup.add(horizSoilBoxing);

    const horizBoxingCapShelf = new THREE.Mesh(
      new THREE.BoxGeometry(0.194, 0.022, 0.846),
      vanityCabinetMat
    );
    horizBoxingCapShelf.name = 'bootLobby.downstairsWc.wastePipeBoxing.capShelf';
    horizBoxingCapShelf.position.set(-12.703, lowerFloorY + 0.371, -2.061);
    horizBoxingCapShelf.castShadow = true;
    horizBoxingCapShelf.receiveShadow = true;
    wastePipeBoxingGroup.add(horizBoxingCapShelf);

    // 45-degree mitred 146mm antique oak skirting wrapping the waste-pipe boxing base
    const boxSkirt = new THREE.Mesh(
      buildMitredWallSkirtingGeometry(
        [
          [-12.62, -2.482],
          [-12.62, -1.64],
          [-12.6, -1.64],
          [-12.6, -1.32],
          [-12.8, -1.32],
        ],
        lowerFloorY
      ),
      antiqueOakSkirtingMat
    );
    boxSkirt.name = 'bootLobby.downstairsWc.wastePipeBoxing.skirting';
    boxSkirt.castShadow = true;
    boxSkirt.receiveShadow = true;
    wastePipeBoxingGroup.add(boxSkirt);
    wcGroup.add(wastePipeBoxingGroup);

    // Rear horizontal porcelain soil-pipe shroud & stepped wall collar into the horizontal waste-pipe boxing (X = -12.62m)
    const soilPipeShroud = new THREE.Mesh(
      new THREE.CylinderGeometry(0.056, 0.058, 0.22, 16),
      vitreousChinaMat
    );
    soilPipeShroud.rotation.z = Math.PI / 2;
    soilPipeShroud.position.set(-12.62 + 0.11, lowerFloorY + 0.185, toiletZ);
    soilPipeShroud.castShadow = true;
    wcGroup.add(soilPipeShroud);

    const soilWallCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.076, 0.08, 0.026, 18),
      vitreousChinaMat
    );
    soilWallCollar.rotation.z = Math.PI / 2;
    soilWallCollar.position.set(-12.62 + 0.013, lowerFloorY + 0.185, toiletZ);
    wcGroup.add(soilWallCollar);

    // 2B. Hollow Lathe-Sculpted Traditional Flared Box-Rim Vitreous China Pan Bowl
    const bowlProfilePts = [
      new THREE.Vector2(0.001, 0.175), // Bottom of water trap well
      new THREE.Vector2(0.068, 0.18),  // Inner trap floor
      new THREE.Vector2(0.112, 0.172), // Outer lower bowl transition from pedestal
      new THREE.Vector2(0.146, 0.235), // Swelling outer belly of Edwardian bowl
      new THREE.Vector2(0.174, 0.315), // Upper outer bowl flare
      new THREE.Vector2(0.182, 0.365), // Neck beneath stepped Edwardian box-rim
      new THREE.Vector2(0.198, 0.376), // Lower lip of traditional projecting flushing rim
      new THREE.Vector2(0.202, 0.398), // Outer crest of porcelain flushing rim
      new THREE.Vector2(0.192, 0.406), // Top glazed rim surface
      new THREE.Vector2(0.154, 0.404), // Inner rim overhang
      new THREE.Vector2(0.148, 0.382), // Under-rim flushing channel
      new THREE.Vector2(0.132, 0.315), // Sloping inner porcelain bowl wall
      new THREE.Vector2(0.088, 0.235), // Lower inner bowl taper
      new THREE.Vector2(0.064, 0.192), // Inner water trap well wall
      new THREE.Vector2(0.001, 0.188), // Inner center well bottom
    ];
    const wcPanBowl = new THREE.Mesh(
      new THREE.LatheGeometry(bowlProfilePts, 28),
      vitreousChinaMat
    );
    wcPanBowl.name = 'bootLobby.downstairsWc.toiletPan';
    wcPanBowl.position.set(panCenterX, lowerFloorY, toiletZ);
    wcPanBowl.scale.set(1.18, 1.0, 0.95);
    wcPanBowl.castShadow = true;
    wcPanBowl.receiveShadow = true;
    wcGroup.add(wcPanBowl);

    // Inner glazed well & translucent water seal surface inside the open bowl (visible from overhead!)
    const innerWellLiner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.138, 0.068, 0.16, 24, 1, true),
      innerBowlGlazeMat
    );
    innerWellLiner.position.set(panCenterX, lowerFloorY + 0.285, toiletZ);
    innerWellLiner.scale.set(1.16, 1.0, 0.93);
    wcGroup.add(innerWellLiner);

    const waterSealDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.086, 0.072, 0.008, 22),
      waterSealMat
    );
    waterSealDisc.name = 'bootLobby.downstairsWc.waterSeal';
    waterSealDisc.position.set(panCenterX - 0.01, lowerFloorY + 0.224, toiletZ);
    waterSealDisc.scale.set(1.15, 1.0, 0.92);
    wcGroup.add(waterSealDisc);

    // Rear porcelain hinge-deck shelf & flush-pipe inlet horn at the back of the pan
    const rearPanDeck = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.048, 0.25),
      vitreousChinaMat
    );
    rearPanDeck.position.set(panCenterX - 0.185, lowerFloorY + 0.38, toiletZ);
    rearPanDeck.castShadow = true;
    wcGroup.add(rearPanDeck);

    const rearInletHorn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.044, 0.07, 16),
      vitreousChinaMat
    );
    rearInletHorn.rotation.z = Math.PI / 2;
    rearInletHorn.position.set(panCenterX - 0.255, lowerFloorY + 0.382, toiletZ);
    wcGroup.add(rearInletHorn);

    // 2C. Open Contoured Solid Heritage Walnut Toilet Seat Ring & Aged-Brass Pillar Bar Hinges
    const wcSeat = new THREE.Mesh(
      new THREE.TorusGeometry(0.164, 0.027, 18, 36),
      walnutSeatMat
    );
    wcSeat.name = 'bootLobby.downstairsWc.toiletSeat';
    wcSeat.rotation.x = Math.PI / 2;
    wcSeat.position.set(panCenterX + 0.006, lowerFloorY + 0.418, toiletZ);
    wcSeat.scale.set(1.17, 0.95, 0.36);
    wcSeat.castShadow = true;
    wcSeat.receiveShadow = true;
    wcGroup.add(wcSeat);

    // Rear walnut seat bridge block & aged-brass pillar bar hinges
    const walnutHingeBlock = new THREE.Mesh(
      new THREE.BoxGeometry(0.052, 0.018, 0.21),
      walnutSeatMat
    );
    walnutHingeBlock.position.set(panCenterX - 0.175, lowerFloorY + 0.418, toiletZ);
    walnutHingeBlock.castShadow = true;
    wcGroup.add(walnutHingeBlock);

    for (const hingeSideZ of [-1, 1] as const) {
      const hingePillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.015, 0.034, 12),
        brassMat
      );
      hingePillar.position.set(panCenterX - 0.182, lowerFloorY + 0.418, toiletZ + hingeSideZ * 0.078);
      wcGroup.add(hingePillar);
    }
    const hingeCrossBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.18, 12),
      brassMat
    );
    hingeCrossBar.rotation.x = Math.PI / 2;
    hingeCrossBar.position.set(panCenterX - 0.182, lowerFloorY + 0.426, toiletZ);
    wcGroup.add(hingeCrossBar);

    // 2D. Traditional Low/Mid-Level Stepped Cornice Vitreous China Cistern (`bootLobby.downstairsWc.cistern`)
    //     Mounted on the West wall (X = -12.80m, Y = lowerFloorY + 0.74m..1.06m) with ornate brass wall brackets
    //     and connected via an exposed 38mm Aged-Brass L-bend flush pipe!
    const cisternCenterX = -12.8 + 0.11; // -12.69m
    const cisternBaseY = lowerFloorY + 0.73;
    const cisternH = 0.31;
    const cisternW = 0.46; // N-S width along Z
    const cisternD = 0.20; // E-W depth along X

    // Stepped lower moulding & main vitreous china cistern tank
    const cisternLowerSkirt = new THREE.Mesh(
      new THREE.BoxGeometry(cisternD - 0.016, 0.028, cisternW - 0.02),
      vitreousChinaMat
    );
    cisternLowerSkirt.position.set(cisternCenterX - 0.005, cisternBaseY + 0.014, toiletZ);
    cisternLowerSkirt.castShadow = true;
    wcGroup.add(cisternLowerSkirt);

    const wcCistern = new THREE.Mesh(
      new THREE.BoxGeometry(cisternD, cisternH - 0.028, cisternW),
      vitreousChinaMat
    );
    wcCistern.name = 'bootLobby.downstairsWc.cistern';
    wcCistern.position.set(cisternCenterX, cisternBaseY + 0.028 + (cisternH - 0.028) / 2, toiletZ);
    wcCistern.castShadow = true;
    wcCistern.receiveShadow = true;
    wcGroup.add(wcCistern);

    // Classic Edwardian recessed front panel & oval ceramic maker's badge on the East (+X) face of the cistern
    const cisternFrontPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.19, 0.36),
      vitreousChinaMat
    );
    cisternFrontPanel.position.set(cisternCenterX + cisternD / 2 + 0.004, cisternBaseY + 0.165, toiletZ);
    wcGroup.add(cisternFrontPanel);

    const makerBadgeRim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.008, 16),
      brassMat
    );
    makerBadgeRim.rotation.z = Math.PI / 2;
    makerBadgeRim.position.set(cisternCenterX + cisternD / 2 + 0.011, cisternBaseY + 0.17, toiletZ);
    makerBadgeRim.scale.set(1.0, 1.35, 0.72);
    wcGroup.add(makerBadgeRim);

    // Stepped overhanging architectural bell-top porcelain cistern lid + central finial boss
    const cisternCorniceStep = new THREE.Mesh(
      new THREE.BoxGeometry(cisternD + 0.022, 0.024, cisternW + 0.026),
      vitreousChinaMat
    );
    cisternCorniceStep.position.set(cisternCenterX + 0.004, cisternBaseY + cisternH + 0.012, toiletZ);
    cisternCorniceStep.castShadow = true;
    wcGroup.add(cisternCorniceStep);

    const cisternLid = new THREE.Mesh(
      new THREE.BoxGeometry(cisternD + 0.006, 0.022, cisternW + 0.008),
      vitreousChinaMat
    );
    cisternLid.name = 'bootLobby.downstairsWc.cisternLid';
    cisternLid.position.set(cisternCenterX + 0.002, cisternBaseY + cisternH + 0.034, toiletZ);
    cisternLid.castShadow = true;
    wcGroup.add(cisternLid);

    // Ornate pierced cast-brass wall support brackets beneath the cistern (North & South sides)
    for (const brkSideZ of [-1, 1] as const) {
      const brkZ = toiletZ + brkSideZ * 0.155;
      const wallLeg = new THREE.Mesh(
        new THREE.BoxGeometry(0.016, 0.13, 0.024),
        brassMat
      );
      wallLeg.position.set(-12.8 + 0.014, cisternBaseY - 0.055, brkZ);
      wcGroup.add(wallLeg);

      const topArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.165, 0.014, 0.022),
        brassMat
      );
      topArm.position.set(-12.8 + 0.09, cisternBaseY - 0.004, brkZ);
      wcGroup.add(topArm);

      const scrollStrut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.006, 0.16, 10),
        brassMat
      );
      scrollStrut.rotation.z = -0.82;
      scrollStrut.position.set(-12.8 + 0.075, cisternBaseY - 0.055, brkZ);
      wcGroup.add(scrollStrut);
    }

    // 2E. Traditional Aged-Brass Cranked Flush Lever with Turned White Ceramic Torpedo Handle
    const leverZ = toiletZ + 0.155;
    const leverY = cisternBaseY + 0.235;
    const leverFulcrum = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.022, 0.026, 14),
      brassMat
    );
    leverFulcrum.rotation.z = Math.PI / 2;
    leverFulcrum.position.set(cisternCenterX + cisternD / 2 + 0.016, leverY, leverZ);
    wcGroup.add(leverFulcrum);

    const leverArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0055, 0.0055, 0.075, 10),
      brassMat
    );
    leverArm.rotation.x = Math.PI / 2;
    leverArm.rotation.z = -0.22;
    leverArm.position.set(cisternCenterX + cisternD / 2 + 0.032, leverY - 0.008, leverZ + 0.032);
    wcGroup.add(leverArm);

    const ceramicTorpedoHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.009, 0.068, 14),
      vitreousChinaMat
    );
    ceramicTorpedoHandle.name = 'bootLobby.downstairsWc.flushLever';
    ceramicTorpedoHandle.rotation.x = Math.PI / 2;
    ceramicTorpedoHandle.position.set(cisternCenterX + cisternD / 2 + 0.036, leverY - 0.014, leverZ + 0.078);
    ceramicTorpedoHandle.castShadow = true;
    wcGroup.add(ceramicTorpedoHandle);

    const handleFinial = new THREE.Mesh(
      new THREE.SphereGeometry(0.009, 10, 10),
      brassMat
    );
    handleFinial.position.set(cisternCenterX + cisternD / 2 + 0.036, leverY - 0.014, leverZ + 0.114);
    wcGroup.add(handleFinial);

    // 2F. Exposed 38mm Aged-Brass Flush Pipe, Shroud Collars & 15mm Brass Cold Supply Pipe
    const flushPipeX = -12.8 + 0.125; // -12.675m
    const cisternNut = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.026, 14),
      brassMat
    );
    cisternNut.position.set(flushPipeX, cisternBaseY - 0.012, toiletZ);
    wcGroup.add(cisternNut);

    // Continuous 38mm brass L-bend flush pipe from cistern base down to Y = lowerFloorY + 0.382m and East into pan horn
    const flushPipeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(flushPipeX, cisternBaseY, toiletZ),
      new THREE.Vector3(flushPipeX, lowerFloorY + 0.43, toiletZ),
      new THREE.Vector3(flushPipeX + 0.02, lowerFloorY + 0.385, toiletZ),
      new THREE.Vector3(panCenterX - 0.24, lowerFloorY + 0.382, toiletZ),
    ]);
    const flushPipeMesh = new THREE.Mesh(
      new THREE.TubeGeometry(flushPipeCurve, 20, 0.019, 14, false),
      brassMat
    );
    flushPipeMesh.name = 'bootLobby.downstairsWc.flushPipe';
    flushPipeMesh.castShadow = true;
    wcGroup.add(flushPipeMesh);

    // Stepped brass compression collar where flush pipe enters rear porcelain pan horn
    const panPipeCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.032, 0.024, 14),
      brassMat
    );
    panPipeCollar.rotation.z = Math.PI / 2;
    panPipeCollar.position.set(panCenterX - 0.282, lowerFloorY + 0.382, toiletZ);
    wcGroup.add(panPipeCollar);

    // 15mm aged-brass water supply pipe rising from the top of the horizontal waste-pipe boxing on the North side of the cistern
    const supplyPipeX = -12.8 + 0.085;
    const supplyPipeZ = toiletZ - 0.165;
    const supplyPipeBaseY = lowerFloorY + 0.382;
    const supplyPipe = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, cisternBaseY - supplyPipeBaseY, 10),
      brassMat
    );
    supplyPipe.position.set(supplyPipeX, (supplyPipeBaseY + cisternBaseY) / 2, supplyPipeZ);
    wcGroup.add(supplyPipe);

    const supplyFloorRose = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.024, 0.012, 12),
      brassMat
    );
    supplyFloorRose.position.set(supplyPipeX, supplyPipeBaseY + 0.006, supplyPipeZ);
    wcGroup.add(supplyFloorRose);

    // 2G. Matching Heritage Aged-Brass Wall-Mounted Toilet Roll Holder on the North wall (`Z = -2.476m`)
    const rollHolderGroup = new THREE.Group();
    rollHolderGroup.name = 'bootLobby.downstairsWc.toiletRollHolder';
    rollHolderGroup.position.set(-12.32, lowerFloorY + 0.68, -2.476);
    for (const postX of [-0.072, 0.072] as const) {
      const wallRose = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.024, 0.01, 14),
        brassMat
      );
      wallRose.rotation.x = Math.PI / 2;
      wallRose.position.set(postX, 0, 0.005);
      rollHolderGroup.add(wallRose);

      const postArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.007, 0.009, 0.078, 12),
        brassMat
      );
      postArm.rotation.x = Math.PI / 2;
      postArm.position.set(postX, 0, 0.044);
      rollHolderGroup.add(postArm);
    }
    const rollSpindle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.156, 12),
      brassMat
    );
    rollSpindle.rotation.z = Math.PI / 2;
    rollSpindle.position.set(0, 0, 0.078);
    rollHolderGroup.add(rollSpindle);

    const tissueRoll = new THREE.Mesh(
      new THREE.CylinderGeometry(0.054, 0.054, 0.11, 20),
      new THREE.MeshStandardMaterial({ color: 0xf7f5f0, roughness: 0.85, metalness: 0.01 })
    );
    tissueRoll.rotation.z = Math.PI / 2;
    tissueRoll.position.set(0, 0, 0.078);
    tissueRoll.castShadow = true;
    rollHolderGroup.add(tissueRoll);

    tagCutawayWall(rollHolderGroup, wcNorthCutaway);
    wcGroup.add(rollHolderGroup);

    scene.add(wcGroup);
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
      new THREE.BoxGeometry(0.018, counterHeight, rackSpanZ),
      cellarOakMat
    );
    lowerBackBoard.position.set(rackWestX + 0.01, lowerFloorY + counterHeight / 2, rackCenterZ);
    wineCellarGroup.add(lowerBackBoard);

    //    - Upper back panel ONLY on the first 2 tall bays at the South start (b = 2, 3: Z = -1.37m..-0.38m, Y = 0.84m..2.18m)
    const upperTallH = rackHeight - counterHeight;
    const upperBackBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, upperTallH, tallSpanZ),
      cellarOakMat
    );
    upperBackBoard.position.set(
      rackWestX + 0.01,
      lowerFloorY + counterHeight + upperTallH / 2,
      tallCenterZ
    );
    wineCellarGroup.add(upperBackBoard);

    // 2. 5 Vertical Oak Bay Dividers along Z:
    //    - i = 0, 1 (North end bays): ground-level height only (counterHeight = 0.84m)
    //    - i = 2, 3, 4 (South start bays): full tall height (rackHeight = 2.18m)
    for (let i = 0; i <= bayCount; i++) {
      const bz = rackMinZ + (i / bayCount) * rackSpanZ;
      const uHeight = i >= 2 ? rackHeight : counterHeight;
      const upright = new THREE.Mesh(
        new THREE.BoxGeometry(rackDepth, uHeight, 0.028),
        cellarOakMat
      );
      upright.name = 'bootLobby.wineCellar.upright';
      upright.position.set(rackWestX + rackDepth / 2, lowerFloorY + uHeight / 2, bz);
      upright.castShadow = true;
      upright.receiveShadow = true;
      wineCellarGroup.add(upright);
    }

    // 3. Full-length ground-level horizontal oak shelves across all 4 bays:
    //    base plinth (0.06m), mid crate shelf (0.42m), and continuous solid oak counter top (0.84m)
    for (const sy of [0.06, 0.42, counterHeight]) {
      const isCounter = Math.abs(sy - counterHeight) < 0.01;
      const shelfD = isCounter ? counterDepth : rackDepth;
      const shelfH = isCounter ? 0.036 : 0.024;
      const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(shelfD, shelfH, rackSpanZ + 0.02),
        cellarOakMat
      );
      shelf.name = 'bootLobby.wineCellar.shelf';
      shelf.position.set(rackWestX + shelfD / 2, lowerFloorY + sy, rackCenterZ);
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      wineCellarGroup.add(shelf);
    }

    // 4. Upper horizontal shelves ONLY on the 2 tall start units (b = 2, 3, Z = -1.37m..-0.38m):
    //    mid-divider above criss-cross rack (1.35m), upper bottle shelf (1.86m), and top cornice (2.14m)
    for (const sy of [1.35, 1.86, 2.14]) {
      const tallShelf = new THREE.Mesh(
        new THREE.BoxGeometry(rackDepth, 0.024, tallSpanZ + 0.02),
        cellarOakMat
      );
      tallShelf.name = 'bootLobby.wineCellar.tallShelf';
      tallShelf.position.set(rackWestX + rackDepth / 2, lowerFloorY + sy, tallCenterZ);
      tallShelf.castShadow = true;
      tallShelf.receiveShadow = true;
      wineCellarGroup.add(tallShelf);
    }

    // Issue #5: Integrated Warm Cabinet LED Strip Lighting throughout the Wine Cellar shelving & criss-cross wine racks!
    // A. Full-length horizontal LED strips under the counter overhang (0.818m) and lower crate shelf (0.404m)
    for (const [ledY, ledX] of [
      [counterHeight - 0.022, rackWestX + counterDepth - 0.028],
      [0.404, rackWestX + rackDepth - 0.028],
    ] as const) {
      const lowerLedStrip = new THREE.Mesh(
        new THREE.BoxGeometry(0.014, 0.008, rackSpanZ - 0.05),
        warmLedStripMat
      );
      lowerLedStrip.name = 'bootLobby.wineCellar.ledStrip.lower';
      lowerLedStrip.position.set(ledX, lowerFloorY + ledY, rackCenterZ);
      wineCellarGroup.add(lowerLedStrip);
    }

    // B. Dual (front-lip + rear-backboard) warm LED strips under every upper shelf in the 2 tall criss-cross bays (b = 2, 3)
    for (const sy of [1.334, 1.844, 2.124] as const) {
      for (const lx of [rackWestX + 0.036, rackWestX + rackDepth - 0.026] as const) {
        const tallShelfLed = new THREE.Mesh(
          new THREE.BoxGeometry(0.014, 0.009, tallSpanZ - 0.04),
          warmLedStripMat
        );
        tallShelfLed.name = 'bootLobby.wineCellar.ledStrip.upper';
        tallShelfLed.position.set(lx, lowerFloorY + sy, tallCenterZ);
        wineCellarGroup.add(tallShelfLed);
      }
    }

    // C. Vertical recessed warm LED strips along the inner side cheeks of each tall criss-cross wine rack bay (b = 2, 3)
    for (const b of [2, 3] as const) {
      const bayCenterZ = rackMinZ + (b + 0.5) * bayWidth;
      for (const sideSign of [-1, 1] as const) {
        const vertLed = new THREE.Mesh(
          new THREE.BoxGeometry(0.012, 1.25, 0.009),
          warmLedStripMat
        );
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
    for (let b = 0; b < bayCount; b++) {
      const bayMidZ = rackMinZ + ((b + 0.5) / bayCount) * rackSpanZ;
      const crateW = bayWidth - 0.06;
      for (const cy of [0.22, 0.58]) {
        const crate = new THREE.Mesh(
          new THREE.BoxGeometry(rackDepth - 0.05, 0.24, crateW),
          cellarCrateOakMat
        );
        crate.name = 'bootLobby.wineCellar.crate';
        crate.position.set(rackWestX + rackDepth / 2, lowerFloorY + cy, bayMidZ);
        crate.castShadow = true;
        wineCellarGroup.add(crate);
      }
    }

    // Shared horizontal wine bottle geometries (necks pointing East +X on West wall)
    const bottleBodyGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.205, 10);
    bottleBodyGeo.rotateZ(Math.PI / 2);
    const bottleNeckGeo = new THREE.CylinderGeometry(0.013, 0.021, 0.082, 10);
    bottleNeckGeo.rotateZ(Math.PI / 2);
    const bottleLabelGeo = new THREE.BoxGeometry(0.088, 0.011, 0.046);

    const addHorizontalBottleEast = (bx: number, by: number, bz: number, isAmber: boolean): void => {
      const bBody = new THREE.Mesh(
        bottleBodyGeo,
        isAmber ? burgundyAmberGlassMat : bordeauxGreenGlassMat
      );
      bBody.position.set(bx + 0.135, by, bz);
      bBody.castShadow = true;
      wineCellarGroup.add(bBody);

      const bNeck = new THREE.Mesh(bottleNeckGeo, brassMat);
      bNeck.position.set(bx + 0.268, by, bz);
      wineCellarGroup.add(bNeck);

      const bLabel = new THREE.Mesh(bottleLabelGeo, wineLabelMat);
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
    const slatGeo = new THREE.BoxGeometry(rackDepth - 0.024, 0.014, diagLen);
    const halfDiagGeo = new THREE.BoxGeometry(rackDepth - 0.024, 0.014, diagLen * 0.5);

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
      const cradleBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.014, 0.014, innerBayW - 0.02),
        cellarSteelMat
      );
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
      new THREE.BoxGeometry(northReturnMaxX - rackWestX, 0.036, northReturnDepth + 0.03),
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
      new THREE.BoxGeometry(northReturnSpanX - 0.04, 0.008, 0.014),
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
      new THREE.BoxGeometry(leftCubbySpanX, counterHeight, 0.018),
      cellarOakMat
    );
    northBackPanel.position.set(leftCubbyMidX, lowerFloorY + counterHeight / 2, northWallZ + 0.01);
    wineCellarGroup.add(northBackPanel);

    for (const px of [northReturnMinX + 0.014, northReturnMaxX - 0.014, -10.466] as const) {
      const returnCheek = new THREE.Mesh(
        new THREE.BoxGeometry(0.028, counterHeight - 0.02, northReturnDepth),
        cellarOakMat
      );
      returnCheek.name = 'bootLobby.wineCellar.cornerPanel';
      returnCheek.position.set(px, lowerFloorY + (counterHeight - 0.02) / 2, northReturnMidZ);
      returnCheek.castShadow = true;
      returnCheek.receiveShadow = true;
      wineCellarGroup.add(returnCheek);
    }

    // Corner open oak cubby shelves on the left of the wine cooler (X = -10.961m..-10.48m)
    for (const sy of [0.06, 0.42] as const) {
      const cornerShelf = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.024, northReturnDepth - 0.02),
        cellarOakMat
      );
      cornerShelf.position.set(-10.72, lowerFloorY + sy, northReturnMidZ);
      wineCellarGroup.add(cornerShelf);
    }

    // Issue #11: Reuse the exact Kitchen Island Under-Counter Wine Cooler (`buildUnderCounterWineCooler`)
    // Centered at X = -10.15m (spanning X = -10.45m..-9.85m, 0.60m wide) underneath the North wrap-around counter,
    // with a matching oak base kick-plinth (`Y = lowerFloorY..lowerFloorY + 0.06m`) and zero coplanar dithering
    const coolerKickPlinth = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.06, 0.34),
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
  // 2-pane Georgian Casement Window centered at X = -11.65m (above the courtyard wooden bench, Photo 1 & Photo 6 right)
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

  // Wide White Internal Windowsill Shelf under the Boot Lobby South Window (Issue #8: radiator removed)
  const bootWindowSillShelf = new THREE.Mesh(
    new THREE.BoxGeometry(1.32, 0.032, 0.24),
    skirtingMat
  );
  bootWindowSillShelf.position.set(-11.65, 0.84, 2.34);
  bootWindowSillShelf.castShadow = true;
  tagCutawayWall(bootWindowSillShelf, {
    axis: 'z',
    coord: 2.54,
    minSpan: -12.81,
    maxSpan: -9.56,
    floor: 'ground',
  });
  scene.add(bootWindowSillShelf);

  // Face-fixed linen Roman blind over the Boot Lobby South window (X = -11.65m)
  buildWindowRomanBlind(scene, tagCutawayWall, {
    name: 'bootLobby.southWindow.romanBlind',
    zone: 'bootLobby',
    centerX: -11.65,
    width: 1.18,
    railY: 1.815,
    bottomY: 1.46,
    wallFaceZ: 2.4,
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
    new THREE.BoxGeometry(3.54, 0.04, 5.18),
    bootLobbyCeilingWhiteMat
  );
  bootLobbyCeilingBacking.name = 'bootLobby.ceilingBacking';
  bootLobbyCeilingBacking.position.set(-11.31, wallH - 0.005, -0.075);
  bootLobbyCeilingBacking.receiveShadow = true;
  groundFloorCeilingGroup.add(bootLobbyCeilingBacking);

  // Exposed Natural Oak North-South Ceiling Joists in the Boot Lobby & WC:
  // Spans the shorter 2.50m North-South distance between the Z = -0.175m load-bearing partition wall and
  // the Z = +2.40m South exterior brick wall, embedding cleanly into the ceiling backing and both walls (Issue #1)!
  for (let bx = -12.585; bx <= -10.005; bx += 0.43) {
    const bootJoist = new THREE.Mesh(
      new THREE.BoxGeometry(0.085, 0.11, 2.58),
      oakMat
    );
    bootJoist.name = 'bootLobby.ceilingJoist';
    bootJoist.position.set(bx, wallH - 0.065, 1.15);
    bootJoist.castShadow = true;
    groundFloorCeilingGroup.add(bootJoist);

    // Matching North-bay ceiling joists in the Downstairs WC & Wine Cellar (X = -11.65m..-9.80m, Z = -2.50m..-0.15m)
    if (bx >= -11.55) {
      const wcJoist = new THREE.Mesh(
        new THREE.BoxGeometry(0.085, 0.11, 2.36),
        oakMat
      );
      wcJoist.name = 'wc.ceilingJoist';
      wcJoist.position.set(bx, wallH - 0.065, -1.35);
      wcJoist.castShadow = true;
      groundFloorCeilingGroup.add(wcJoist);
    }
  }
}
