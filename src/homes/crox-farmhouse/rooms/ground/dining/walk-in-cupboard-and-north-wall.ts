import * as THREE from 'three';
import { buildWindowRomanBlind } from '../../../../../objects/decor/roman-blind.ts';
import { buildBootRoomHeatingManifold } from '../../../../../objects/fixtures/hydronic-manifold.ts';
import type { CutawayWallDescriptor } from '../../../../../core/types/scene.ts';
import type { SceneBuilderContext } from '../../../../../engine/viewer/scene-types.ts';
import type { DiningRoomKit } from '../dining-room.ts';

export interface DiningRoomSharedMaterials {
  readonly crispWhiteWallMat: THREE.MeshStandardMaterial;
  readonly snugSlateBlueMat: THREE.MeshStandardMaterial;
  readonly whiteJoistMat: THREE.MeshStandardMaterial;
}

export function buildWalkInCupboardAndNorthWall(
  ctx: SceneBuilderContext,
  kit: DiningRoomKit
): DiningRoomSharedMaterials {
  const { interactions, interactiveMeshes, lightGroups, scene } = ctx;
  const {
    addBrickWallAlongXWithWindow,
    addInteractiveInteriorDoor,
    addInteriorWall,
    antiqueOakSkirtingMat,
    applyWorldSpaceFloorUVs,
    brassMat,
    castIronMat,
    ceramicWhiteMat,
    doorLintelH,
    doorLintelY,
    herringboneTerracottaQuarryMat,
    oakMat,
    tagCutawayWall,
    wallCapMat,
    wallH,
  } = kit;
  // =========================================================================
  // 1. FAMILY ROOM / DINING ROOM (4.92m x 4.85m / 16'2" x 15'11")
  //    X = -4.64m..-9.56m, Z = -2.50m..+2.35m
  //    Photo-accurate build from PH-53, PH-54, PH-55, PH-56 & East Wing Floorplan:
  //    - Dark riven charcoal-slate flagstone floor (continuing into Boot Lobby)
  //    - NW Walk-in Cupboard (X = -9.56m..-7.82m, Z = -2.50m..-0.85m) with North cottage window,
  //      internal shelving, interactive 4-panel white door & 2-gang brass KNX light switch (PA 1.1.15)
  //    - Deep Slate-Blue Snug / TV Alcove (X = -7.82m..-4.64m, Z = -2.50m..-0.85m) with North 2-pane
  //      cottage window, dark anthracite column radiator, 50" wall-mounted TV, NE oak lamp table,
  //      pale-grey L-shaped corner sofa + scatter cushions + square ottoman, framed B&W portrait & floor lamp
  //    - White-plastered East Chimney Breast (X = -5.28m..-4.64m, Z = -0.85m..+0.82m) with square-edged
  //      recessed white fireplace opening, vintage brass-bound oak blanket trunk, potted plant & panoramic print
  //    - Main cream structural cross-beam (Z = -0.85m), exposed white ceiling joists & 6 KNX downlights (Ch 10)
  //    - South Courtyard wall with 3-pane cottage window, interactive reclaimed pine sideboard & wicker basket
  //    - West wall with open portal to Boot Lobby (Z = -0.78m..+0.14m) & boarded cottage door with rim lock
  // =========================================================================

  // Family Room Materials matching PH-53..56
  const crispWhiteWallMat = new THREE.MeshStandardMaterial({
    color: 0xe6e1d6,
    roughness: 0.86,
    metalness: 0.02,
  });
  const snugSlateBlueMat = new THREE.MeshStandardMaterial({
    color: 0x3d4e57,
    roughness: 0.82,
    metalness: 0.03,
  });
  const whiteJoistMat = new THREE.MeshStandardMaterial({
    color: 0xf7f5f0,
    roughness: 0.62,
    metalness: 0.02,
  });
  const wickerBasketMat = new THREE.MeshStandardMaterial({
    color: 0x9c7a52,
    roughness: 0.88,
    metalness: 0.02,
  });

  // 1A. Dining Room (Family Room) Herringbone Terracotta Sealed Quarry Tile Floor (same floor & scale as Entrance Hallway)
  const familyFloor = new THREE.Mesh(
    applyWorldSpaceFloorUVs(new THREE.BoxGeometry(4.92, 0.08, 4.85), -7.1, -0.075, 0.85, 0.85),
    herringboneTerracottaQuarryMat
  );
  if (!familyFloor.name) familyFloor.name = 'familyRoom.walkInCupboard.familyFloor';
  familyFloor.position.set(-7.1, -0.04, -0.075);
  familyFloor.receiveShadow = true;
  scene.add(familyFloor);

  // Issue #1: Dining Room herringbone terracotta floor (`familyFloor`) terminates cleanly at the X = -4.64m threshold
  // (halfway along the right-hand pillar X = -4.40m..-4.96m), where the Kitchen stone floor (`kitchen.portalFloor`) meets it.

  // 1B. North Exterior Brick Wall (0.28m thick, Z = -2.50m..-2.78m, X = -9.56m..-4.40m):
  //     - West section across Walk-in Cupboard (X = -9.56m..-7.82m) with small 1-pane cottage window at X = -8.68m
  //     - East section across Snug Alcove (X = -7.82m..-4.40m) with 2-pane cottage window at X = -6.22m (PH-54, PH-55)
  addBrickWallAlongXWithWindow(
    -9.56,
    -7.82,
    -2.78,
    -2.5,
    -8.68,
    0.54,
    1.04,
    1.84,
    'south',
    1
  );
  addBrickWallAlongXWithWindow(
    -7.82,
    -4.4,
    -2.78,
    -2.5,
    -6.22,
    1.28,
    0.88,
    1.86,
    'south',
    2,
    { trimFaceOffset: 0.019 }
  );

  // Deep Slate-Blue interior wall lining on the North wall of the Snug (X = -7.82m..-4.64m, Z = -2.49m)
  // framing the North cottage window (X = -6.86m..-5.58m, Y = 0.88m..1.86m — Issue #4: tagged with tagCutawayWall)
  const snugNorthCutaway: CutawayWallDescriptor = {
    axis: 'z',
    coord: -2.64,
    minSpan: -7.82,
    maxSpan: -4.4,
    floor: 'ground',
  };
  const snugNorthLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.96, wallH, 0.018),
    snugSlateBlueMat
  );
  if (!snugNorthLeft.name) snugNorthLeft.name = 'familyRoom.walkInCupboard.snugNorthLeft';
  snugNorthLeft.position.set(-7.34, wallH / 2, -2.49);
  snugNorthLeft.receiveShadow = true;
  tagCutawayWall(snugNorthLeft, snugNorthCutaway);
  scene.add(snugNorthLeft);

  const snugNorthRight = new THREE.Mesh(
    new THREE.BoxGeometry(0.94, wallH, 0.018),
    snugSlateBlueMat
  );
  if (!snugNorthRight.name) snugNorthRight.name = 'familyRoom.walkInCupboard.snugNorthRight';
  snugNorthRight.position.set(-5.11, wallH / 2, -2.49);
  snugNorthRight.receiveShadow = true;
  tagCutawayWall(snugNorthRight, snugNorthCutaway);
  scene.add(snugNorthRight);

  const snugNorthBelowWin = new THREE.Mesh(
    new THREE.BoxGeometry(1.28, 0.88, 0.018),
    snugSlateBlueMat
  );
  if (!snugNorthBelowWin.name) snugNorthBelowWin.name = 'familyRoom.walkInCupboard.snugNorthBelowWin';
  snugNorthBelowWin.position.set(-6.22, 0.44, -2.49);
  snugNorthBelowWin.receiveShadow = true;
  tagCutawayWall(snugNorthBelowWin, snugNorthCutaway);
  scene.add(snugNorthBelowWin);

  const snugNorthAboveWin = new THREE.Mesh(
    new THREE.BoxGeometry(1.28, wallH - 1.86, 0.018),
    snugSlateBlueMat
  );
  if (!snugNorthAboveWin.name) snugNorthAboveWin.name = 'familyRoom.walkInCupboard.snugNorthAboveWin';
  snugNorthAboveWin.position.set(-6.22, 1.86 + (wallH - 1.86) / 2, -2.49);
  snugNorthAboveWin.receiveShadow = true;
  tagCutawayWall(snugNorthAboveWin, snugNorthCutaway);
  scene.add(snugNorthAboveWin);

  // Two small decorative ornaments seated on the Solid European Oak North window board (PH-54, PH-55)
  for (const [ox, oh, rad] of [
    [-6.46, 0.14, 0.042],
    [-5.96, 0.11, 0.036],
  ] as const) {
    const ornament = new THREE.Mesh(
      new THREE.CylinderGeometry(rad * 0.7, rad, oh, 12),
      ceramicWhiteMat
    );
    if (!ornament.name) ornament.name = 'familyRoom.walkInCupboard.ornament';
    ornament.position.set(ox, 0.904 + oh / 2, -2.455);
    ornament.castShadow = true;
    tagCutawayWall(ornament, snugNorthCutaway);
    scene.add(ornament);
  }

  // Issue #3: Roman blind on the Snug North window (X = -6.22m, Z = -2.46m proud of Solid Oak architrave)
  buildWindowRomanBlind(scene, tagCutawayWall, {
    name: 'familyRoom.northWindow.romanBlind',
    zone: 'familyRoom',
    centerX: -6.22,
    width: 1.28,
    railY: 1.815,
    bottomY: 1.46,
    wallFaceZ: -2.46,
    facingZ: 1,
    cutawayWall: snugNorthCutaway,
  });

  // (North Snug radiator removed per Issue #13)

  // 1C. Walk-in Corner Cupboard / Bootroom in NW Corner (X = -9.56m..-7.82m, Z = -2.50m..-0.515m — Issues #2–#10)
  // Issue #5: Paint the Walk-in Cupboard East partition wall a warm light heritage cream color and hang framed pictures on its West (-X = -7.97m) face
  const cupboardLightWallMat = new THREE.MeshStandardMaterial({
    color: 0xf4efe4, // Warm light heritage stone/cream paint
    roughness: 0.78,
  });
  // East partition wall of Walk-in Cupboard (X = -7.895m, Z = -2.50m..-0.44m)
  addInteriorWall(-7.895, wallH / 2, -1.47, 0.15, wallH, 2.06, cupboardLightWallMat, {
    skipSkirting: true,
  });
  // Warm light-colored painted wall lining on the West (-X = -7.97m, Cupboard interior) face (Z = -2.49m..-0.59m)
  const cupboardEastWallWestLining = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, wallH - 0.01, 1.9),
    cupboardLightWallMat
  );
  cupboardEastWallWestLining.name = 'familyRoom.walkInCupboard.eastWallLining';
  cupboardEastWallWestLining.position.set(-7.972, (wallH + 0.01) / 2, -1.54);
  cupboardEastWallWestLining.receiveShadow = true;
  cupboardEastWallWestLining.userData.cutawayWall = {
    axis: 'x',
    coord: -7.895,
    minSpan: -2.5,
    maxSpan: -0.44,
    floor: 'ground',
  };
  scene.add(cupboardEastWallWestLining);

  // Issue #5: Framed Country Botanical & Architectural Prints mounted on the West (-X = -7.978m) face of the Walk-In Cupboard East wall
  const makeCupboardPrintTexture = (variant: 'botanical' | 'estate'): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 192;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#f6f1e6';
      ctx.fillRect(0, 0, 256, 192);
      ctx.strokeStyle = '#c9bda8';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, 236, 172);

      if (variant === 'botanical') {
        // Pressed English fern & meadow wildflower botanical watercolour plate
        ctx.strokeStyle = '#3d5a3c';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(128, 162);
        ctx.quadraticCurveTo(122, 98, 134, 34);
        ctx.stroke();

        for (let i = 0; i < 6; i++) {
          const py = 144 - i * 18;
          const span = 38 - i * 4;
          for (const dir of [-1, 1] as const) {
            ctx.fillStyle = i % 2 === 0 ? '#4d6f49' : '#638458';
            ctx.beginPath();
            ctx.ellipse(128 + dir * (span * 0.55), py - 4, span * 0.45, 7, dir * -0.35, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        // Soft ochre/rose blossom buds at apex
        for (const [bx, by] of [
          [134, 34],
          [116, 46],
          [146, 48],
        ] as const) {
          ctx.fillStyle = '#c87d65';
          ctx.beginPath();
          ctx.arc(bx, by, 6, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Georgian Country Farmhouse elevation architectural ink & wash sketch
        ctx.fillStyle = '#dde5ea';
        ctx.fillRect(22, 22, 212, 82);
        ctx.fillStyle = '#8fa382';
        ctx.fillRect(22, 104, 212, 66);

        // Farmhouse gable & brick facade
        ctx.fillStyle = '#b86b52';
        ctx.fillRect(68, 66, 120, 56);
        ctx.fillStyle = '#5a4d46';
        ctx.beginPath();
        ctx.moveTo(60, 66);
        ctx.lineTo(128, 38);
        ctx.lineTo(196, 66);
        ctx.closePath();
        ctx.fill();

        // Sash windows & front door
        ctx.fillStyle = '#f2ede2';
        for (const wx of [82, 106, 142, 166] as const) {
          ctx.fillRect(wx, 76, 12, 16);
          ctx.fillRect(wx, 98, 12, 18);
        }
        ctx.fillStyle = '#36453b';
        ctx.fillRect(122, 96, 12, 26);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };

  for (const [picIdx, picZ, variant] of [
    [1, -1.98, 'botanical'],
    [2, -1.08, 'estate'],
  ] as const) {
    const picGroup = new THREE.Group();
    picGroup.name = `familyRoom.walkInCupboard.eastWallPicture.${picIdx}`;
    picGroup.userData.zone = 'familyRoom';
    picGroup.userData.cutawayWall = {
      axis: 'x',
      coord: -7.895,
      minSpan: -2.5,
      maxSpan: -0.44,
      floor: 'ground',
    };
    picGroup.position.set(-7.982, 1.3, picZ);
    picGroup.rotation.y = -Math.PI / 2; // Facing West (-X) into the Walk-In Cupboard

    const frameW = 0.44;
    const frameH = 0.36;
    const railW = 0.025;
    for (const [rSuffix, rx, ry, rw, rh] of [
      ['', 0, frameH * 0.5 - railW * 0.5, frameW, railW],
      ['.bottom', 0, -frameH * 0.5 + railW * 0.5, frameW, railW],
      ['.left', -frameW * 0.5 + railW * 0.5, 0, railW, frameH - railW * 2],
      ['.right', frameW * 0.5 - railW * 0.5, 0, railW, frameH - railW * 2],
    ] as const) {
      const frameMesh = new THREE.Mesh(
        new THREE.BoxGeometry(rw, rh, 0.02),
        oakMat
      );
      frameMesh.name = `familyRoom.walkInCupboard.eastWallPicture.${picIdx}.frame${rSuffix}`;
      frameMesh.position.set(rx, ry, 0.01);
      frameMesh.castShadow = true;
      frameMesh.receiveShadow = true;
      picGroup.add(frameMesh);
    }

    const mountMesh = new THREE.Mesh(
      new THREE.BoxGeometry(frameW - railW * 2, frameH - railW * 2, 0.008),
      ceramicWhiteMat
    );
    if (!mountMesh.name) mountMesh.name = 'familyRoom.walkInCupboard.mount';
    mountMesh.position.set(0, 0, 0.006);
    picGroup.add(mountMesh);

    const artMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(frameW - 0.12, frameH - 0.12),
      new THREE.MeshStandardMaterial({
        map: makeCupboardPrintTexture(variant),
        roughness: 0.42,
      })
    );
    artMesh.name = `familyRoom.walkInCupboard.eastWallPicture.${picIdx}.canvas`;
    artMesh.position.z = 0.0145;
    picGroup.add(artMesh);

    scene.add(picGroup);
  }

  // Deep Slate-Blue lining on the East (+X, Snug) face of the Cupboard wall (X = -7.812m, Z = -2.50m..-0.44m)
  const snugWestWallLining = new THREE.Mesh(
    new THREE.BoxGeometry(0.016, wallH, 2.06),
    snugSlateBlueMat
  );
  if (!snugWestWallLining.name) snugWestWallLining.name = 'familyRoom.walkInCupboard.snugWestWallLining';
  snugWestWallLining.position.set(-7.812, wallH / 2, -1.47);
  snugWestWallLining.receiveShadow = true;
  scene.add(snugWestWallLining);

  // South partition wall of Walk-in Cupboard shifted South +0.34m to Z = -0.515m (X = -9.56m..-7.97m, Issues #2–#9) with Cupboard Door at X = -8.72m
  addInteriorWall(-9.345, wallH / 2, -0.515, 0.43, wallH, 0.15, crispWhiteWallMat, {
    skipSkirting: true,
  });
  addInteriorWall(-8.14, wallH / 2, -0.515, 0.34, wallH, 0.15, crispWhiteWallMat, {
    skipSkirting: true,
  });
  addInteriorWall(-8.72, doorLintelY, -0.515, 0.82, doorLintelH, 0.15, crispWhiteWallMat, {
    skipSkirting: true,
  });
  addInteractiveInteriorDoor(
    'familyCupboardDoor',
    'Dining Room Walk-in Cupboard Door',
    'x',
    -0.515,
    0.15,
    -8.72,
    0.82,
    Math.PI * 0.48
  );

  // Issue #6: Victorian Black & White Checkerboard Tile Floor (`familyRoom.walkInCupboard.checkerTileFloor`)
  // covering the entire Walk-In Cupboard interior (X = -9.555m..-7.97m, Z = -2.495m..-0.585m, right at [-8.589, 0, -1.368]!)
  {
    const createWalkInCheckerboardTileTextures = (): {
      readonly colorMap: THREE.CanvasTexture;
      readonly bumpMap: THREE.CanvasTexture;
    } => {
      const size = 512;
      const cCanvas = document.createElement('canvas');
      cCanvas.width = size;
      cCanvas.height = size;
      const cCtx = cCanvas.getContext('2d')!;

      const bCanvas = document.createElement('canvas');
      bCanvas.width = size;
      bCanvas.height = size;
      const bCtx = bCanvas.getContext('2d')!;

      const tilesPerSide = 8; // 8x8 checkerboard grid per repeat
      const tilePx = size / tilesPerSide;
      const groutPx = 2.5;

      // Grout base
      cCtx.fillStyle = '#9e998e';
      cCtx.fillRect(0, 0, size, size);
      bCtx.fillStyle = '#404040';
      bCtx.fillRect(0, 0, size, size);

      for (let ty = 0; ty < tilesPerSide; ty++) {
        for (let tx = 0; tx < tilesPerSide; tx++) {
          const isBlack = (tx + ty) % 2 === 0;
          // Subtle natural stone/encaustic variation per tile
          const jitter = (((tx * 17 + ty * 31) % 7) - 3) * 2;
          if (isBlack) {
            const v = 30 + jitter;
            cCtx.fillStyle = `rgb(${v}, ${v + 1}, ${v + 3})`;
          } else {
            const v = 240 + jitter;
            cCtx.fillStyle = `rgb(${v}, ${v - 3}, ${v - 9})`;
          }
          cCtx.fillRect(
            tx * tilePx + groutPx * 0.5,
            ty * tilePx + groutPx * 0.5,
            tilePx - groutPx,
            tilePx - groutPx
          );

          bCtx.fillStyle = '#d8d8d8';
          bCtx.fillRect(
            tx * tilePx + groutPx,
            ty * tilePx + groutPx,
            tilePx - groutPx * 2,
            tilePx - groutPx * 2
          );
        }
      }

      const colorMap = new THREE.CanvasTexture(cCanvas);
      colorMap.wrapS = THREE.RepeatWrapping;
      colorMap.wrapT = THREE.RepeatWrapping;
      colorMap.repeat.set(1.6, 1.9);
      colorMap.colorSpace = THREE.SRGBColorSpace;

      const bumpMap = new THREE.CanvasTexture(bCanvas);
      bumpMap.wrapS = THREE.RepeatWrapping;
      bumpMap.wrapT = THREE.RepeatWrapping;
      bumpMap.repeat.set(1.6, 1.9);

      return { colorMap, bumpMap };
    };

    const checkerTex = createWalkInCheckerboardTileTextures();
    const checkerFloorMat = new THREE.MeshStandardMaterial({
      map: checkerTex.colorMap,
      bumpMap: checkerTex.bumpMap,
      bumpScale: 0.0025,
      roughness: 0.42,
      metalness: 0.04,
    });

    const cupMinX = -9.555;
    const cupMaxX = -7.97;
    const cupMinZ = -2.495;
    const cupMaxZ = -0.602;
    const checkerFloorMesh = new THREE.Mesh(
      new THREE.BoxGeometry(cupMaxX - cupMinX, 0.006, cupMaxZ - cupMinZ),
      checkerFloorMat
    );
    checkerFloorMesh.name = 'familyRoom.walkInCupboard.checkerTileFloor';
    checkerFloorMesh.userData.zone = 'familyRoom';
    checkerFloorMesh.position.set(
      (cupMinX + cupMaxX) * 0.5,
      0.003,
      (cupMinZ + cupMaxZ) * 0.5
    );
    checkerFloorMesh.receiveShadow = true;
    scene.add(checkerFloorMesh);

    // Aged brass threshold bar across the Walk-In Cupboard doorway (X = -9.13m..-8.31m, Z = -0.585m)
    const doorwayBrassStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 0.007, 0.024),
      brassMat
    );
    doorwayBrassStrip.name = 'familyRoom.walkInCupboard.thresholdStrip';
    doorwayBrassStrip.position.set(-8.72, 0.0035, -0.585);
    doorwayBrassStrip.receiveShadow = true;
    scene.add(doorwayBrassStrip);
  }

  // Full-Width Built-In Boot Bench & Shaker Mudroom Joinery along the West wall of the Walk-in Cupboard
  // (Issue #10: extended +0.34m South to span wall-to-wall Z = -2.49m..-0.61m, full width 1.88m, X = -9.55m..-9.07m)
  const cupboardBenchGroup = new THREE.Group();
  cupboardBenchGroup.name = 'familyRoom.walkInCupboard.bootBench';

  const benchFullW = 1.88;
  const benchCenterZ = -1.55;
  const benchDepth = 0.48;
  const benchCenterX = -9.31;
  const builtInJoineryMat = new THREE.MeshStandardMaterial({
    color: 0xe6e1d6,
    roughness: 0.48,
    metalness: 0.02,
  });

  // Recessed Shaker front plinth base (Y = 0.008m..0.070m above checkerTileFloor)
  const benchPlinth = new THREE.Mesh(
    new THREE.BoxGeometry(benchDepth - 0.03, 0.062, benchFullW),
    builtInJoineryMat
  );
  if (!benchPlinth.name) benchPlinth.name = 'familyRoom.walkInCupboard.benchPlinth';
  benchPlinth.position.set(benchCenterX - 0.015, 0.039, benchCenterZ);
  benchPlinth.receiveShadow = true;
  cupboardBenchGroup.add(benchPlinth);

  // Lower carcass floor deck above plinth (Y = 0.07m..0.094m)
  const benchBottomDeck = new THREE.Mesh(
    new THREE.BoxGeometry(benchDepth - 0.01, 0.024, benchFullW),
    builtInJoineryMat
  );
  if (!benchBottomDeck.name) benchBottomDeck.name = 'familyRoom.walkInCupboard.benchBottomDeck';
  benchBottomDeck.position.set(benchCenterX - 0.005, 0.082, benchCenterZ);
  benchBottomDeck.receiveShadow = true;
  cupboardBenchGroup.add(benchBottomDeck);

  // 6 vertical built-in Shaker cubby dividers across the 1.88m bench (5 cubby bays)
  for (const dz of [-2.476, -2.104, -1.732, -1.36, -0.988, -0.618] as const) {
    const divider = new THREE.Mesh(
      new THREE.BoxGeometry(benchDepth - 0.015, 0.366, 0.026),
      builtInJoineryMat
    );
    if (!divider.name) divider.name = 'familyRoom.walkInCupboard.divider';
    divider.position.set(benchCenterX - 0.008, 0.277, dz);
    divider.castShadow = true;
    divider.receiveShadow = true;
    cupboardBenchGroup.add(divider);
  }

  // Intermediate oak shoe shelf across the 5 cubby bays (Y = 0.255m)
  const midShoeShelf = new THREE.Mesh(
    new THREE.BoxGeometry(benchDepth - 0.04, 0.022, benchFullW - 0.04),
    antiqueOakSkirtingMat
  );
  midShoeShelf.name = 'familyRoom.walkInCupboard.shoeRackSlat';
  midShoeShelf.position.set(benchCenterX - 0.01, 0.255, benchCenterZ);
  midShoeShelf.castShadow = true;
  midShoeShelf.receiveShadow = true;
  cupboardBenchGroup.add(midShoeShelf);

  // Full-width solid antique oak bench seat top slab with overhanging bullnose front edge (Y = 0.46m..0.502m)
  const benchTop = new THREE.Mesh(
    new THREE.BoxGeometry(benchDepth + 0.02, 0.042, benchFullW),
    antiqueOakSkirtingMat
  );
  benchTop.name = 'familyRoom.walkInCupboard.benchSeat';
  benchTop.position.set(benchCenterX + 0.01, 0.481, benchCenterZ);
  benchTop.castShadow = true;
  benchTop.receiveShadow = true;
  cupboardBenchGroup.add(benchTop);

  // Built-in tall side cheeks framing the bench & coat alcove against the North and South walls (Y = 0.502m..1.804m)
  for (const cz of [-2.478, -0.622] as const) {
    const sideCheek = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 1.302, 0.024),
      builtInJoineryMat
    );
    if (!sideCheek.name) sideCheek.name = 'familyRoom.walkInCupboard.sideCheek';
    sideCheek.position.set(-9.39, 1.153, cz);
    sideCheek.castShadow = true;
    sideCheek.receiveShadow = true;
    cupboardBenchGroup.add(sideCheek);
  }

  // Full-width Tongue-and-Groove (T&G) painted wainscoting backrest panelling on the West wall (Y = 0.502m..1.804m)
  const tgBackPanel = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 1.302, benchFullW),
    builtInJoineryMat
  );
  if (!tgBackPanel.name) tgBackPanel.name = 'familyRoom.walkInCupboard.tgBackPanel';
  tgBackPanel.position.set(-9.542, 1.153, benchCenterZ);
  tgBackPanel.receiveShadow = true;
  cupboardBenchGroup.add(tgBackPanel);

  for (let g = 0; g <= 14; g++) {
    const gz = -2.43 + g * 0.127;
    const vGroove = new THREE.Mesh(
      new THREE.BoxGeometry(0.005, 1.28, 0.005),
      wallCapMat
    );
    if (!vGroove.name) vGroove.name = 'familyRoom.walkInCupboard.vGroove';
    vGroove.position.set(-9.531, 1.16, gz);
    cupboardBenchGroup.add(vGroove);
  }

  // Pairs of boots and shoes stored neatly inside the 5 built-in cubbies
  const bootLeatherDarkMat = new THREE.MeshStandardMaterial({
    color: 0x3b2a1e,
    roughness: 0.55,
  });
  const bootOliveWellieMat = new THREE.MeshStandardMaterial({
    color: 0x354230,
    roughness: 0.42,
  });
  const shoeTanSuedeMat = new THREE.MeshStandardMaterial({
    color: 0x8a5d3b,
    roughness: 0.72,
  });

  for (const [sz, sMat, shelfY] of [
    [-2.29, bootOliveWellieMat, 0.095],
    [-1.915, bootLeatherDarkMat, 0.095],
    [-1.54, shoeTanSuedeMat, 0.266],
    [-1.165, bootLeatherDarkMat, 0.266],
    [-0.79, bootOliveWellieMat, 0.095],
  ] as const) {
    for (const offsetZ of [-0.055, 0.055] as const) {
      const sole = new THREE.Mesh(
        new THREE.BoxGeometry(0.24, 0.02, 0.085),
        castIronMat
      );
      if (!sole.name) sole.name = 'familyRoom.walkInCupboard.sole';
      sole.position.set(-9.28, shelfY + 0.01, sz + offsetZ);
      cupboardBenchGroup.add(sole);

      const vamp = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.062, 0.08),
        sMat
      );
      if (!vamp.name) vamp.name = 'familyRoom.walkInCupboard.vamp';
      vamp.position.set(-9.27, shelfY + 0.048, sz + offsetZ);
      vamp.castShadow = true;
      cupboardBenchGroup.add(vamp);
    }
  }

  // Full-width Solid Oak Coat Peg Rail & Upper Built-In Hat Shelf (Y = 1.56m..1.82m, Z = -2.49m..-0.59m)
  const pegRailBoard = new THREE.Mesh(
    new THREE.BoxGeometry(0.026, 0.105, benchFullW - 0.04),
    antiqueOakSkirtingMat
  );
  pegRailBoard.name = 'familyRoom.walkInCupboard.coatPegRail';
  pegRailBoard.position.set(-9.522, 1.56, benchCenterZ);
  pegRailBoard.castShadow = true;
  cupboardBenchGroup.add(pegRailBoard);

  const upperHatShelf = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.032, benchFullW),
    antiqueOakSkirtingMat
  );
  if (!upperHatShelf.name) upperHatShelf.name = 'familyRoom.walkInCupboard.upperHatShelf';
  upperHatShelf.position.set(-9.39, 1.82, benchCenterZ);
  upperHatShelf.castShadow = true;
  upperHatShelf.receiveShadow = true;
  cupboardBenchGroup.add(upperHatShelf);

  // Issue #7: Recessed Warm LED Lighting Strip (`familyRoom.walkInCupboard.coatLedStrip`) at the top
  // shining down onto the hanging country coats (underneath `upperHatShelf` at Y = 1.798m & along the upper valence at Y = 1.663m)
  {
    const coatLedMat = new THREE.MeshStandardMaterial({
      color: 0xffecc0,
      emissive: 0xffb244,
      emissiveIntensity: 2.8,
      roughness: 0.16,
    });
    lightGroups.walkInCupboardLeds.emissives.push(coatLedMat);

    // Anodized brass extruded aluminium LED profile channel under the front of the upper hat shelf (X = -9.32m, Y = 1.80m)
    const ledChannelHousing = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, 0.012, benchFullW - 0.05),
      brassMat
    );
    ledChannelHousing.name = 'familyRoom.walkInCupboard.coatLedStrip.housing';
    ledChannelHousing.position.set(-9.32, 1.801, benchCenterZ);
    cupboardBenchGroup.add(ledChannelHousing);

    const coatLedDiffuser = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.008, benchFullW - 0.06),
      coatLedMat
    );
    coatLedDiffuser.name = 'familyRoom.walkInCupboard.coatLedStrip';
    coatLedDiffuser.position.set(-9.32, 1.795, benchCenterZ);
    cupboardBenchGroup.add(coatLedDiffuser);

    // Secondary wall-wash LED strip tucked under the rear of the hat shelf / above the coat peg rail (X = -9.515m, Y = 1.663m, right at hit point [-9.529, 1.663, -1.54]!)
    const wallWashLed = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, 0.01, benchFullW - 0.06),
      coatLedMat
    );
    wallWashLed.name = 'familyRoom.walkInCupboard.coatLedStrip.wallWash';
    wallWashLed.position.set(-9.512, 1.663, benchCenterZ);
    cupboardBenchGroup.add(wallWashLed);

    ctx.addGlowPool('walkInCupboardLeds', -8.92, 0.008, benchCenterZ, 1.25, 0.28);
  }

  // 4 woven storage baskets on the extended upper built-in hat shelf
  for (const bz of [-2.22, -1.77, -1.31, -0.86] as const) {
    const basket = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.18, 0.34),
      wickerBasketMat
    );
    if (!basket.name) basket.name = 'familyRoom.walkInCupboard.basket';
    basket.position.set(-9.38, 1.926, bz);
    basket.castShadow = true;
    cupboardBenchGroup.add(basket);
  }

  // 7 antique brass double coat pegs along the extended West wall rail + high-LOD hanging country coats (Issues #9 & #10)
  const coatWoolOliveMat = new THREE.MeshStandardMaterial({
    color: 0x384534,
    roughness: 0.72,
    metalness: 0.04,
  });
  const coatNavyWaxMat = new THREE.MeshStandardMaterial({
    color: 0x222e3c,
    roughness: 0.62,
    metalness: 0.05,
  });
  const coatCamelMat = new THREE.MeshStandardMaterial({
    color: 0x9b7852,
    roughness: 0.84,
    metalness: 0.02,
  });
  const coatCorduroyCollarMat = new THREE.MeshStandardMaterial({
    color: 0x432f21,
    roughness: 0.88,
    metalness: 0.01,
  });
  const coatTartanLiningMat = new THREE.MeshStandardMaterial({
    color: 0x543c2c,
    roughness: 0.86,
  });
  const coatConfigs: ReadonlyArray<{
    readonly mat: THREE.Material;
    readonly collarMat: THREE.Material;
    readonly hasHood: boolean;
    readonly lengthH: number;
    readonly yawTilt: number;
  } | null> = [
    {
      mat: coatWoolOliveMat,
      collarMat: coatCorduroyCollarMat,
      hasHood: true,
      lengthH: 0.74,
      yawTilt: 0.06,
    },
    null,
    {
      mat: coatNavyWaxMat,
      collarMat: coatCorduroyCollarMat,
      hasHood: false,
      lengthH: 0.7,
      yawTilt: -0.05,
    },
    null,
    {
      mat: coatCamelMat,
      collarMat: coatTartanLiningMat,
      hasHood: true,
      lengthH: 0.78,
      yawTilt: 0.04,
    },
    null,
    {
      mat: coatWoolOliveMat,
      collarMat: coatTartanLiningMat,
      hasHood: false,
      lengthH: 0.72,
      yawTilt: -0.04,
    },
  ];

  for (let p = 0; p < 7; p++) {
    const pz = -2.32 + p * 0.26;
    const backplate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.008, 10),
      brassMat
    );
    if (!backplate.name) backplate.name = 'familyRoom.walkInCupboard.backplate';
    backplate.rotation.z = Math.PI / 2;
    backplate.position.set(-9.506, 1.56, pz);
    cupboardBenchGroup.add(backplate);

    const lowerPeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.006, 0.055, 8),
      brassMat
    );
    if (!lowerPeg.name) lowerPeg.name = 'familyRoom.walkInCupboard.lowerPeg';
    lowerPeg.rotation.z = Math.PI / 2 - 0.35;
    lowerPeg.position.set(-9.482, 1.55, pz);
    cupboardBenchGroup.add(lowerPeg);

    const upperPeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.006, 0.075, 8),
      brassMat
    );
    if (!upperPeg.name) upperPeg.name = 'familyRoom.walkInCupboard.upperPeg';
    upperPeg.rotation.z = Math.PI / 2 - 0.55;
    upperPeg.position.set(-9.475, 1.585, pz);
    cupboardBenchGroup.add(upperPeg);

    const pegTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.009, 8, 8),
      brassMat
    );
    if (!pegTip.name) pegTip.name = 'familyRoom.walkInCupboard.pegTip';
    pegTip.position.set(-9.445, 1.605, pz);
    cupboardBenchGroup.add(pegTip);

    const cfg = coatConfigs[p];
    if (cfg) {
      const coatGroup = new THREE.Group();
      coatGroup.name = `familyRoom.walkInCupboard.coat.${p}`;
      coatGroup.position.set(-9.435, 1.54, pz);
      coatGroup.rotation.y = cfg.yawTilt;

      // 1. Corduroy storm collar & neck loop hooked over the peg (Y = -0.05..+0.04m relative to peg)
      const collarStand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.042, 0.056, 0.078, 16),
        cfg.collarMat
      );
      if (!collarStand.name) collarStand.name = 'familyRoom.walkInCupboard.collarStand';
      collarStand.scale.set(0.78, 1, 1.15);
      collarStand.position.set(0, -0.01, 0);
      collarStand.castShadow = true;
      coatGroup.add(collarStand);

      // Folded lapel wings flanking the collar
      for (const sideZ of [-1, 1] as const) {
        const lapel = new THREE.Mesh(
          new THREE.BoxGeometry(0.022, 0.095, 0.048),
          cfg.collarMat
        );
        if (!lapel.name) lapel.name = 'familyRoom.walkInCupboard.lapel';
        lapel.position.set(0.032, -0.055, sideZ * 0.034);
        lapel.rotation.x = sideZ * 0.18;
        lapel.rotation.z = -0.15;
        coatGroup.add(lapel);
      }

      // Optional draped storm hood resting behind the collar
      if (cfg.hasHood) {
        const hoodDrape = new THREE.Mesh(
          new THREE.SphereGeometry(0.068, 14, 12),
          cfg.mat
        );
        if (!hoodDrape.name) hoodDrape.name = 'familyRoom.walkInCupboard.hoodDrape';
        hoodDrape.scale.set(0.72, 1.25, 0.95);
        hoodDrape.position.set(-0.028, -0.06, 0);
        hoodDrape.castShadow = true;
        coatGroup.add(hoodDrape);
      }

      // 2. Sculpted shoulder yoke across the upper coat (Y = -0.09..-0.16m)
      const shoulderYoke = new THREE.Mesh(
        new THREE.SphereGeometry(0.135, 18, 14),
        cfg.mat
      );
      if (!shoulderYoke.name) shoulderYoke.name = 'familyRoom.walkInCupboard.shoulderYoke';
      shoulderYoke.scale.set(0.48, 0.52, 1.08);
      shoulderYoke.position.set(0.008, -0.105, 0);
      shoulderYoke.castShadow = true;
      shoulderYoke.receiveShadow = true;
      coatGroup.add(shoulderYoke);

      // 3. Upper & lower sculpted coat torso with natural A-line flare and vertical drape pleats
      const torsoH = cfg.lengthH;
      const torsoBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.068, 0.102, torsoH, 20),
        cfg.mat
      );
      if (!torsoBody.name) torsoBody.name = 'familyRoom.walkInCupboard.torsoBody';
      torsoBody.scale.set(0.62, 1, 1.28);
      torsoBody.position.set(0.01, -0.07 - torsoH * 0.5, 0);
      torsoBody.castShadow = true;
      torsoBody.receiveShadow = true;
      coatGroup.add(torsoBody);

      // Soft vertical fabric drape folds flanking the front and back
      for (const foldZ of [-0.065, 0.065] as const) {
        const drapeFold = new THREE.Mesh(
          new THREE.CylinderGeometry(0.024, 0.036, torsoH * 0.92, 12),
          cfg.mat
        );
        if (!drapeFold.name) drapeFold.name = 'familyRoom.walkInCupboard.drapeFold';
        drapeFold.scale.set(0.75, 1, 0.95);
        drapeFold.position.set(0.028, -0.09 - torsoH * 0.46, foldZ);
        drapeFold.castShadow = true;
        coatGroup.add(drapeFold);
      }

      // 4. Full-length front storm placket & 5 aged-brass press-stud snaps
      const placketH = torsoH - 0.04;
      const stormPlacket = new THREE.Mesh(
        new THREE.BoxGeometry(0.014, placketH, 0.038),
        cfg.mat
      );
      if (!stormPlacket.name) stormPlacket.name = 'familyRoom.walkInCupboard.stormPlacket';
      stormPlacket.position.set(0.056, -0.08 - placketH * 0.5, 0);
      stormPlacket.castShadow = true;
      coatGroup.add(stormPlacket);

      for (let b = 0; b < 5; b++) {
        const snapY = -0.13 - b * ((placketH - 0.1) / 4);
        const brassSnap = new THREE.Mesh(
          new THREE.CylinderGeometry(0.0055, 0.0055, 0.005, 10),
          brassMat
        );
        if (!brassSnap.name) brassSnap.name = 'familyRoom.walkInCupboard.brassSnap';
        brassSnap.rotation.z = Math.PI / 2;
        brassSnap.position.set(0.064, snapY, 0);
        coatGroup.add(brassSnap);
      }

      // 5. Two lower bellows cartridge pockets with buttoned storm flaps + upper handwarmer welt pockets
      for (const sideZ of [-1, 1] as const) {
        const pocketZ = sideZ * 0.068;
        const pocketY = -0.07 - torsoH * 0.7;

        const bellowsPocket = new THREE.Mesh(
          new THREE.BoxGeometry(0.024, 0.135, 0.078),
          cfg.mat
        );
        if (!bellowsPocket.name) bellowsPocket.name = 'familyRoom.walkInCupboard.bellowsPocket';
        bellowsPocket.position.set(0.048, pocketY, pocketZ);
        bellowsPocket.rotation.y = -sideZ * 0.18;
        bellowsPocket.castShadow = true;
        coatGroup.add(bellowsPocket);

        const pocketFlap = new THREE.Mesh(
          new THREE.BoxGeometry(0.028, 0.038, 0.082),
          cfg.mat
        );
        if (!pocketFlap.name) pocketFlap.name = 'familyRoom.walkInCupboard.pocketFlap';
        pocketFlap.position.set(0.051, pocketY + 0.056, pocketZ);
        pocketFlap.rotation.y = -sideZ * 0.18;
        coatGroup.add(pocketFlap);

        const flapSnap = new THREE.Mesh(
          new THREE.CylinderGeometry(0.0048, 0.0048, 0.005, 10),
          brassMat
        );
        if (!flapSnap.name) flapSnap.name = 'familyRoom.walkInCupboard.flapSnap';
        flapSnap.rotation.z = Math.PI / 2;
        flapSnap.position.set(0.065, pocketY + 0.046, pocketZ);
        coatGroup.add(flapSnap);

        // Upper angled handwarmer welt trim
        const handwarmerWelt = new THREE.Mesh(
          new THREE.BoxGeometry(0.018, 0.095, 0.018),
          cfg.mat
        );
        if (!handwarmerWelt.name) handwarmerWelt.name = 'familyRoom.walkInCupboard.handwarmerWelt';
        handwarmerWelt.position.set(0.048, -0.07 - torsoH * 0.36, sideZ * 0.058);
        handwarmerWelt.rotation.x = sideZ * 0.22;
        coatGroup.add(handwarmerWelt);
      }

      // 6. Articulated left & right hanging sleeves (upper arm + forward-angled forearm + storm cuff)
      for (const sideZ of [-1, 1] as const) {
        const sleeveGroup = new THREE.Group();
        sleeveGroup.position.set(0.012, -0.115, sideZ * 0.118);
        sleeveGroup.rotation.x = sideZ * 0.06;

        const upperArm = new THREE.Mesh(
          new THREE.CylinderGeometry(0.036, 0.033, 0.26, 14),
          cfg.mat
        );
        if (!upperArm.name) upperArm.name = 'familyRoom.walkInCupboard.upperArm';
        upperArm.scale.set(0.82, 1, 1.05);
        upperArm.position.set(0.006, -0.12, 0);
        upperArm.rotation.z = -0.06;
        upperArm.castShadow = true;
        sleeveGroup.add(upperArm);

        const elbowJoint = new THREE.Mesh(
          new THREE.SphereGeometry(0.032, 12, 10),
          cfg.mat
        );
        if (!elbowJoint.name) elbowJoint.name = 'familyRoom.walkInCupboard.elbowJoint';
        elbowJoint.scale.set(0.82, 1, 1.02);
        elbowJoint.position.set(0.014, -0.245, 0);
        sleeveGroup.add(elbowJoint);

        const forearm = new THREE.Mesh(
          new THREE.CylinderGeometry(0.032, 0.027, 0.24, 14),
          cfg.mat
        );
        if (!forearm.name) forearm.name = 'familyRoom.walkInCupboard.forearm';
        forearm.scale.set(0.82, 1, 1.02);
        forearm.position.set(0.026, -0.355, -sideZ * 0.012);
        forearm.rotation.z = -0.1;
        forearm.rotation.x = -sideZ * 0.08;
        forearm.castShadow = true;
        sleeveGroup.add(forearm);

        const cuffTrim = new THREE.Mesh(
          new THREE.CylinderGeometry(0.028, 0.028, 0.032, 14),
          cfg.collarMat
        );
        if (!cuffTrim.name) cuffTrim.name = 'familyRoom.walkInCupboard.cuffTrim';
        cuffTrim.scale.set(0.82, 1, 1.02);
        cuffTrim.position.set(0.037, -0.465, -sideZ * 0.02);
        cuffTrim.rotation.z = -0.1;
        sleeveGroup.add(cuffTrim);

        coatGroup.add(sleeveGroup);
      }

      cupboardBenchGroup.add(coatGroup);
    }
  }

  scene.add(cupboardBenchGroup);

  // Manifold B: 4-Port East Wing Secondary Hydronic UFH Manifold (`familyRoom.bootRoomManifold`)
  // mounted on the East wall of the Boot Room (`X = -7.98m, Y = 0.00m, Z = -1.95m`, facing West `-X`)
  // inside a bespoke Boxed-In Shaker Manifold Cupboard (`familyRoom.bootRoomManifoldCupboard`)
  buildBootRoomHeatingManifold(
    scene,
    0,
    brassMat,
    castIronMat,
    antiqueOakSkirtingMat,
    (doorGroup, doorLeaf, hingeOffset, axis, openAngle) =>
      interactions.registerHingedDoor(doorGroup, doorLeaf, hingeOffset, axis, openAngle)
  );

  // Interactive 2-Gang Brass KNX Light Switch on the South face of the Walk-in Cupboard wall
  // (X = -8.04m, Y = 1.32m, Z = -0.432m — shifted +0.34m South with the cupboard wall)
  const famSwitchGroup = new THREE.Group();
  famSwitchGroup.position.set(-8.04, 1.32, -0.432);
  const famSwitchPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.088, 0.088, 0.012),
    brassMat
  );
  if (!famSwitchPlate.name) famSwitchPlate.name = 'familyRoom.walkInCupboard.famSwitchPlate';
  famSwitchPlate.castShadow = true;
  famSwitchPlate.userData = {
    circuitId: 'familyRoomSpots',
    switchPa: '1.1.15',
    switchLocation: 'Dining Room Cupboard Wall',
    zoneId: 'familyRoom',
  };
  famSwitchGroup.add(famSwitchPlate);
  interactiveMeshes.push(famSwitchPlate);

  for (const tx of [-0.018, 0.018]) {
    const toggleDolly = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.007, 0.022, 8),
      brassMat
    );
    if (!toggleDolly.name) toggleDolly.name = 'familyRoom.walkInCupboard.toggleDolly';
    toggleDolly.rotation.x = Math.PI / 2;
    toggleDolly.position.set(tx, 0, 0.01);
    toggleDolly.userData = famSwitchPlate.userData;
    famSwitchGroup.add(toggleDolly);
    interactiveMeshes.push(toggleDolly);
  }
  scene.add(famSwitchGroup);


  return {
    crispWhiteWallMat,
    snugSlateBlueMat,
    whiteJoistMat,
  };
}
