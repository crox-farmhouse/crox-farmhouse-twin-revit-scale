import * as THREE from 'three';
import { addCasedArchitravePortal, buildMitredWallSkirtingGeometry } from '../../../../engine/geometry/swept-moulding.ts';
import { buildWindowRomanBlind } from '../../../../objects/decor/roman-blind.ts';
import { buildFlutedBrassPictureLight } from '../../../../objects/fixtures/fluted-brass-picture-light.ts';
import { buildBootRoomHeatingManifold } from '../../../../objects/fixtures/hydronic-manifold.ts';
import { buildDiningRoomWestWallSideboard, buildWalkInCupboardRoadBikes } from '../../../../objects/furniture/dining-sideboard-and-road-bikes.ts';
import type { CutawayWallDescriptor, SceneBuilderContext } from '../../../../types/scene.ts';
import type { createGroundFloorMaterials } from '../../structure/ground-floor-materials.ts';
import type { createGroundFloorShellKit } from '../../structure/ground-floor-shell-kit.ts';

/**
 * Dining Room (`familyRoom`) with walk-in cupboard, snug alcove, east fireplace, dining table and step down to the next hallway.
 *
 * Extracted verbatim from `buildMainHouseGroundFloorRooms` (ground-floor-rooms.ts). Statement order and
 * geometry are unchanged; shared locals flow in via `kit` and out via the return value.
 */
export function buildDiningRoom(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createGroundFloorMaterials>, 'antiqueOakSkirtingMat' | 'applyWorldSpaceFloorUVs' | 'brassMat' | 'castIronMat' | 'ceramicWhiteMat' | 'courtyardDoorMat' | 'courtyardDoorRecessMat' | 'doorH' | 'doorLintelH' | 'doorLintelY' | 'engineeredOakFloorMat' | 'exteriorBrickMat' | 'herringboneTerracottaQuarryMat' | 'oakMat' | 'skirtingMat' | 'stoneSillMat' | 'tagCutawayWall' | 'wallCapMat' | 'wallH' | 'windowFrameMat' | 'windowGlassMat'> &
    Pick<ReturnType<typeof createGroundFloorShellKit>, 'addBrickWallAlongXWithWindow' | 'addExteriorBrickWall' | 'addInteractiveInteriorDoor' | 'addInteriorWall' | 'applyWorldSpaceBrickUVs'>
) {
  const { cutawayWallGroups, groundFloorCeilingGroup, interactions, interactiveMeshes, lightGroups, scene } = ctx;
  const {
    addBrickWallAlongXWithWindow,
    addExteriorBrickWall,
    addInteractiveInteriorDoor,
    addInteriorWall,
    antiqueOakSkirtingMat,
    applyWorldSpaceBrickUVs,
    applyWorldSpaceFloorUVs,
    brassMat,
    castIronMat,
    ceramicWhiteMat,
    courtyardDoorMat,
    courtyardDoorRecessMat,
    doorH,
    doorLintelH,
    doorLintelY,
    engineeredOakFloorMat,
    exteriorBrickMat,
    herringboneTerracottaQuarryMat,
    oakMat,
    skirtingMat,
    stoneSillMat,
    tagCutawayWall,
    wallCapMat,
    wallH,
    windowFrameMat,
    windowGlassMat,
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
    color: 0xf3efe6,
    roughness: 0.84,
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
  familyFloor.position.set(-7.1, -0.04, -0.075);
  familyFloor.receiveShadow = true;
  scene.add(familyFloor);

  // Flush herringbone terracotta floor continuation through the open Kitchen <-> Dining Room portal (X = -4.64m..-4.40m, Z = +0.85m..+1.99m)
  const familyPortalFloor = new THREE.Mesh(
    applyWorldSpaceFloorUVs(new THREE.BoxGeometry(0.24, 0.08, 1.14), -4.52, 1.42, 0.85, 0.85),
    herringboneTerracottaQuarryMat
  );
  familyPortalFloor.position.set(-4.52, -0.04, 1.42);
  familyPortalFloor.receiveShadow = true;
  scene.add(familyPortalFloor);

  // 1B. North Exterior Brick Wall (0.28m thick, Z = -2.50m..-2.78m, X = -9.56m..-4.40m):
  //     - West section across Walk-in Cupboard (X = -9.56m..-7.82m) with small 1-pane cottage window at X = -8.68m
  //     - East section across Snug Alcove (X = -7.82m..-4.40m) with 2-pane cottage window at X = -6.22m (PH-54, PH-55)
  addBrickWallAlongXWithWindow(
    -9.56,
    -7.82,
    -2.78,
    -2.5,
    -8.68,
    0.66,
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
    2
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
  snugNorthLeft.position.set(-7.34, wallH / 2, -2.49);
  snugNorthLeft.receiveShadow = true;
  tagCutawayWall(snugNorthLeft, snugNorthCutaway);
  scene.add(snugNorthLeft);

  const snugNorthRight = new THREE.Mesh(
    new THREE.BoxGeometry(0.94, wallH, 0.018),
    snugSlateBlueMat
  );
  snugNorthRight.position.set(-5.11, wallH / 2, -2.49);
  snugNorthRight.receiveShadow = true;
  tagCutawayWall(snugNorthRight, snugNorthCutaway);
  scene.add(snugNorthRight);

  const snugNorthBelowWin = new THREE.Mesh(
    new THREE.BoxGeometry(1.28, 0.88, 0.018),
    snugSlateBlueMat
  );
  snugNorthBelowWin.position.set(-6.22, 0.44, -2.49);
  snugNorthBelowWin.receiveShadow = true;
  tagCutawayWall(snugNorthBelowWin, snugNorthCutaway);
  scene.add(snugNorthBelowWin);

  const snugNorthAboveWin = new THREE.Mesh(
    new THREE.BoxGeometry(1.28, wallH - 1.86, 0.018),
    snugSlateBlueMat
  );
  snugNorthAboveWin.position.set(-6.22, 1.86 + (wallH - 1.86) / 2, -2.49);
  snugNorthAboveWin.receiveShadow = true;
  tagCutawayWall(snugNorthAboveWin, snugNorthCutaway);
  scene.add(snugNorthAboveWin);

  // White splayed interior window sill board & reveal for the North Snug window (PH-54, PH-55)
  const snugWinSillBoard = new THREE.Mesh(
    new THREE.BoxGeometry(1.38, 0.032, 0.18),
    skirtingMat
  );
  snugWinSillBoard.position.set(-6.22, 0.88, -2.45);
  snugWinSillBoard.receiveShadow = true;
  tagCutawayWall(snugWinSillBoard, snugNorthCutaway);
  scene.add(snugWinSillBoard);

  // Two small decorative ornaments on the North window sill (PH-54, PH-55)
  for (const [ox, oh, rad] of [
    [-6.46, 0.14, 0.042],
    [-5.96, 0.11, 0.036],
  ] as const) {
    const ornament = new THREE.Mesh(
      new THREE.CylinderGeometry(rad * 0.7, rad, oh, 12),
      ceramicWhiteMat
    );
    ornament.position.set(ox, 0.896 + oh / 2, -2.44);
    ornament.castShadow = true;
    tagCutawayWall(ornament, snugNorthCutaway);
    scene.add(ornament);
  }

  // Issue #3: Roman blind on the Snug North window (X = -6.22m, Z = -2.48m)
  buildWindowRomanBlind(scene, tagCutawayWall, {
    name: 'familyRoom.northWindow.romanBlind',
    zone: 'familyRoom',
    centerX: -6.22,
    width: 1.28,
    railY: 1.815,
    bottomY: 1.46,
    wallFaceZ: -2.48,
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
  addInteriorWall(-7.895, wallH / 2, -1.47, 0.15, wallH, 2.06, cupboardLightWallMat);
  // Warm light-colored painted wall lining on the West (-X = -7.97m, Cupboard interior) face (Z = -2.49m..-0.59m)
  const cupboardEastWallWestLining = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, wallH, 1.9),
    cupboardLightWallMat
  );
  cupboardEastWallWestLining.name = 'familyRoom.walkInCupboard.eastWallLining';
  cupboardEastWallWestLining.position.set(-7.972, wallH / 2, -1.54);
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
    picGroup.position.set(-7.979, 1.3, picZ);
    picGroup.rotation.y = -Math.PI / 2; // Facing West (-X) into the Walk-In Cupboard

    const frameW = 0.44;
    const frameH = 0.36;
    const frameMesh = new THREE.Mesh(
      new THREE.BoxGeometry(frameW, frameH, 0.022),
      oakMat
    );
    frameMesh.name = `familyRoom.walkInCupboard.eastWallPicture.${picIdx}.frame`;
    frameMesh.castShadow = true;
    frameMesh.receiveShadow = true;
    picGroup.add(frameMesh);

    const mountMesh = new THREE.Mesh(
      new THREE.BoxGeometry(frameW - 0.05, frameH - 0.05, 0.025),
      ceramicWhiteMat
    );
    picGroup.add(mountMesh);

    const artMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(frameW - 0.12, frameH - 0.12),
      new THREE.MeshStandardMaterial({
        map: makeCupboardPrintTexture(variant),
        roughness: 0.42,
      })
    );
    artMesh.name = `familyRoom.walkInCupboard.eastWallPicture.${picIdx}.canvas`;
    artMesh.position.z = 0.014;
    picGroup.add(artMesh);

    scene.add(picGroup);
  }

  // Deep Slate-Blue lining on the East (+X, Snug) face of the Cupboard wall (X = -7.812m, Z = -2.50m..-0.44m)
  const snugWestWallLining = new THREE.Mesh(
    new THREE.BoxGeometry(0.016, wallH, 2.06),
    snugSlateBlueMat
  );
  snugWestWallLining.position.set(-7.812, wallH / 2, -1.47);
  snugWestWallLining.receiveShadow = true;
  scene.add(snugWestWallLining);

  // South partition wall of Walk-in Cupboard shifted South +0.34m to Z = -0.515m (X = -9.56m..-7.82m, Issues #2–#9) with Cupboard Door at X = -8.72m
  addInteriorWall(-9.345, wallH / 2, -0.515, 0.43, wallH, 0.15, crispWhiteWallMat);
  addInteriorWall(-8.065, wallH / 2, -0.515, 0.49, wallH, 0.15, crispWhiteWallMat);
  addInteriorWall(-8.72, doorLintelY, -0.515, 0.82, doorLintelH, 0.15, crispWhiteWallMat);
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
    const cupMaxZ = -0.585;
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
  // (Issue #10: extended +0.34m South to span wall-to-wall Z = -2.49m..-0.59m, full width 1.90m, X = -9.55m..-9.07m)
  const cupboardBenchGroup = new THREE.Group();
  cupboardBenchGroup.name = 'familyRoom.walkInCupboard.bootBench';

  const benchFullW = 1.9;
  const benchCenterZ = -1.54;
  const benchDepth = 0.48;
  const benchCenterX = -9.31;
  const builtInJoineryMat = new THREE.MeshStandardMaterial({
    color: 0xe6e1d6,
    roughness: 0.48,
    metalness: 0.02,
  });

  // Recessed Shaker front plinth base (Y = 0..0.07m)
  const benchPlinth = new THREE.Mesh(
    new THREE.BoxGeometry(benchDepth - 0.03, 0.07, benchFullW),
    builtInJoineryMat
  );
  benchPlinth.position.set(benchCenterX - 0.015, 0.035, benchCenterZ);
  benchPlinth.receiveShadow = true;
  cupboardBenchGroup.add(benchPlinth);

  // Lower carcass floor deck above plinth (Y = 0.07m..0.094m)
  const benchBottomDeck = new THREE.Mesh(
    new THREE.BoxGeometry(benchDepth - 0.01, 0.024, benchFullW),
    builtInJoineryMat
  );
  benchBottomDeck.position.set(benchCenterX - 0.005, 0.082, benchCenterZ);
  benchBottomDeck.receiveShadow = true;
  cupboardBenchGroup.add(benchBottomDeck);

  // 6 vertical built-in Shaker cubby dividers across the 1.90m bench (5 cubby bays)
  for (const dz of [-2.476, -2.102, -1.728, -1.352, -0.978, -0.604] as const) {
    const divider = new THREE.Mesh(
      new THREE.BoxGeometry(benchDepth - 0.015, 0.37, 0.026),
      builtInJoineryMat
    );
    divider.position.set(benchCenterX - 0.008, 0.275, dz);
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

  // Built-in tall side cheeks framing the bench & coat alcove against the North and South walls (Y = 0.50m..1.84m)
  for (const cz of [-2.478, -0.602] as const) {
    const sideCheek = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 1.34, 0.024),
      builtInJoineryMat
    );
    sideCheek.position.set(-9.39, 1.17, cz);
    sideCheek.castShadow = true;
    sideCheek.receiveShadow = true;
    cupboardBenchGroup.add(sideCheek);
  }

  // Full-width Tongue-and-Groove (T&G) painted wainscoting backrest panelling on the West wall (Y = 0.50m..1.82m)
  const tgBackPanel = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 1.32, benchFullW),
    builtInJoineryMat
  );
  tgBackPanel.position.set(-9.542, 1.16, benchCenterZ);
  tgBackPanel.receiveShadow = true;
  cupboardBenchGroup.add(tgBackPanel);

  for (let g = 0; g <= 14; g++) {
    const gz = -2.43 + g * 0.127;
    const vGroove = new THREE.Mesh(
      new THREE.BoxGeometry(0.005, 1.28, 0.005),
      wallCapMat
    );
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
      sole.position.set(-9.28, shelfY + 0.01, sz + offsetZ);
      cupboardBenchGroup.add(sole);

      const vamp = new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.062, 0.08),
        sMat
      );
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
    lightGroups.familyRoomSpots.emissives.push(coatLedMat);

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

    ctx.addGlowPool('familyRoomSpots', -8.92, 0.008, benchCenterZ, 1.25, 0.28);
  }

  // 4 woven storage baskets on the extended upper built-in hat shelf
  for (const bz of [-2.22, -1.77, -1.31, -0.86] as const) {
    const basket = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.18, 0.34),
      wickerBasketMat
    );
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
    backplate.rotation.z = Math.PI / 2;
    backplate.position.set(-9.506, 1.56, pz);
    cupboardBenchGroup.add(backplate);

    const lowerPeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.006, 0.055, 8),
      brassMat
    );
    lowerPeg.rotation.z = Math.PI / 2 - 0.35;
    lowerPeg.position.set(-9.482, 1.55, pz);
    cupboardBenchGroup.add(lowerPeg);

    const upperPeg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.006, 0.075, 8),
      brassMat
    );
    upperPeg.rotation.z = Math.PI / 2 - 0.55;
    upperPeg.position.set(-9.475, 1.585, pz);
    cupboardBenchGroup.add(upperPeg);

    const pegTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.009, 8, 8),
      brassMat
    );
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
      stormPlacket.position.set(0.056, -0.08 - placketH * 0.5, 0);
      stormPlacket.castShadow = true;
      coatGroup.add(stormPlacket);

      for (let b = 0; b < 5; b++) {
        const snapY = -0.13 - b * ((placketH - 0.1) / 4);
        const brassSnap = new THREE.Mesh(
          new THREE.CylinderGeometry(0.0055, 0.0055, 0.005, 10),
          brassMat
        );
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
        bellowsPocket.position.set(0.048, pocketY, pocketZ);
        bellowsPocket.rotation.y = -sideZ * 0.18;
        bellowsPocket.castShadow = true;
        coatGroup.add(bellowsPocket);

        const pocketFlap = new THREE.Mesh(
          new THREE.BoxGeometry(0.028, 0.038, 0.082),
          cfg.mat
        );
        pocketFlap.position.set(0.051, pocketY + 0.056, pocketZ);
        pocketFlap.rotation.y = -sideZ * 0.18;
        coatGroup.add(pocketFlap);

        const flapSnap = new THREE.Mesh(
          new THREE.CylinderGeometry(0.0048, 0.0048, 0.005, 10),
          brassMat
        );
        flapSnap.rotation.z = Math.PI / 2;
        flapSnap.position.set(0.065, pocketY + 0.046, pocketZ);
        coatGroup.add(flapSnap);

        // Upper angled handwarmer welt trim
        const handwarmerWelt = new THREE.Mesh(
          new THREE.BoxGeometry(0.018, 0.095, 0.018),
          cfg.mat
        );
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
        upperArm.scale.set(0.82, 1, 1.05);
        upperArm.position.set(0.006, -0.12, 0);
        upperArm.rotation.z = -0.06;
        upperArm.castShadow = true;
        sleeveGroup.add(upperArm);

        const elbowJoint = new THREE.Mesh(
          new THREE.SphereGeometry(0.032, 12, 10),
          cfg.mat
        );
        elbowJoint.scale.set(0.82, 1, 1.02);
        elbowJoint.position.set(0.014, -0.245, 0);
        sleeveGroup.add(elbowJoint);

        const forearm = new THREE.Mesh(
          new THREE.CylinderGeometry(0.032, 0.027, 0.24, 14),
          cfg.mat
        );
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
    toggleDolly.rotation.x = Math.PI / 2;
    toggleDolly.position.set(tx, 0, 0.01);
    toggleDolly.userData = famSwitchPlate.userData;
    famSwitchGroup.add(toggleDolly);
    interactiveMeshes.push(toggleDolly);
  }
  scene.add(famSwitchGroup);

  // 1D. East Wall of Snug Alcove (X = -4.645m, Z = -2.50m..-0.85m) — Deep Slate-Blue Lining,
  //     Flush 42-inch Samsung The Frame QLED TV & NE Corner Indoor Floor Plant (Issue #10 & #12)
  const snugEastWallLining = new THREE.Mesh(
    new THREE.BoxGeometry(0.016, wallH, 1.65),
    snugSlateBlueMat
  );
  snugEastWallLining.position.set(-4.648, wallH / 2, -1.675);
  snugEastWallLining.receiveShadow = true;
  scene.add(snugEastWallLining);

  // Antique-profiled oak skirting board with 45° mitred corner around the SE Walk-in Cupboard corner & Snug West wall
  const snugSkirtWest = new THREE.Mesh(
    buildMitredWallSkirtingGeometry([
      [-8.248, -0.438],
      [-7.804, -0.438],
      [-7.804, -2.482],
    ]),
    antiqueOakSkirtingMat
  );
  snugSkirtWest.name = 'familyRoom.snugWestSkirting';
  snugSkirtWest.receiveShadow = true;
  scene.add(snugSkirtWest);

  // 42-inch Samsung The Frame QLED Art Mode TV flush-mounted on the East Snug Wall (X = -4.668m, Y = 1.34m, Z = -1.62m — Issue #12)
  // Official 42" / 43" Frame dimensions: 969mm W x 558mm H x 25mm D with magnetic warm oak bezel & museum mat passepartout
  const snugTvGroup = new THREE.Group();
  snugTvGroup.name = 'familyRoom.frameTv42';
  snugTvGroup.position.set(-4.668, 1.34, -1.62);
  snugTvGroup.rotation.y = -Math.PI / 2; // Flush against East Snug wall facing West (-X)

  const frameTvW = 0.969;
  const frameTvH = 0.558;
  const frameTvD = 0.025;
  const frameBezelW = 0.022;

  // Slim charcoal chassis backing flush against the wall
  const snugTvChassis = new THREE.Mesh(
    new THREE.BoxGeometry(frameTvW - 0.016, frameTvH - 0.016, frameTvD - 0.004),
    castIronMat
  );
  snugTvChassis.name = 'familyRoom.frameTv42.chassis';
  snugTvChassis.position.set(0, 0, -0.002);
  snugTvChassis.castShadow = true;
  snugTvGroup.add(snugTvChassis);

  // Customizable 4-sided magnetic warm oak picture-frame bezel (top, bottom, left, right rails)
  for (const [bx, by, bw, bh] of [
    [0, frameTvH * 0.5 - frameBezelW * 0.5, frameTvW, frameBezelW],
    [0, -frameTvH * 0.5 + frameBezelW * 0.5, frameTvW, frameBezelW],
    [-frameTvW * 0.5 + frameBezelW * 0.5, 0, frameBezelW, frameTvH - frameBezelW * 2],
    [frameTvW * 0.5 - frameBezelW * 0.5, 0, frameBezelW, frameTvH - frameBezelW * 2],
  ] as const) {
    const bezelBar = new THREE.Mesh(
      new THREE.BoxGeometry(bw, bh, frameTvD),
      antiqueOakSkirtingMat
    );
    bezelBar.name = 'familyRoom.frameTv42.bezel';
    bezelBar.position.set(bx, by, 0);
    bezelBar.castShadow = true;
    snugTvGroup.add(bezelBar);
  }

  // Warm off-white museum passepartout mat board inside the oak bezel
  const snugTvMatBoard = new THREE.Mesh(
    new THREE.PlaneGeometry(frameTvW - frameBezelW * 2, frameTvH - frameBezelW * 2),
    ceramicWhiteMat
  );
  snugTvMatBoard.name = 'familyRoom.frameTv42.passepartout';
  snugTvMatBoard.position.set(0, 0, frameTvD * 0.5 - 0.001);
  snugTvGroup.add(snugTvMatBoard);

  // Anti-reflective matte QLED Art Mode display canvas inside the passepartout mat
  const snugTvArtCanvas = document.createElement('canvas');
  snugTvArtCanvas.width = 256;
  snugTvArtCanvas.height = 144;
  const snugArtCtx = snugTvArtCanvas.getContext('2d');
  if (snugArtCtx) {
    const skyGrad = snugArtCtx.createLinearGradient(0, 0, 0, 88);
    skyGrad.addColorStop(0, '#c2d0d8');
    skyGrad.addColorStop(1, '#ede5d5');
    snugArtCtx.fillStyle = skyGrad;
    snugArtCtx.fillRect(0, 0, 256, 144);
    snugArtCtx.fillStyle = '#6c7c66';
    snugArtCtx.beginPath();
    snugArtCtx.moveTo(0, 88);
    snugArtCtx.quadraticCurveTo(75, 64, 155, 82);
    snugArtCtx.quadraticCurveTo(210, 92, 256, 74);
    snugArtCtx.lineTo(256, 144);
    snugArtCtx.lineTo(0, 144);
    snugArtCtx.fill();
    snugArtCtx.fillStyle = '#485842';
    snugArtCtx.beginPath();
    snugArtCtx.moveTo(0, 108);
    snugArtCtx.quadraticCurveTo(115, 92, 256, 114);
    snugArtCtx.lineTo(256, 144);
    snugArtCtx.lineTo(0, 144);
    snugArtCtx.fill();
  }
  const snugTvArtTex = new THREE.CanvasTexture(snugTvArtCanvas);
  snugTvArtTex.colorSpace = THREE.SRGBColorSpace;
  const snugTvScreenMat = new THREE.MeshStandardMaterial({
    map: snugTvArtTex,
    emissive: 0xfff6e5,
    emissiveMap: snugTvArtTex,
    emissiveIntensity: 0.14,
    roughness: 0.42,
    metalness: 0.04,
  });
  const snugTvScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(frameTvW - 0.16, frameTvH - 0.14),
    snugTvScreenMat
  );
  snugTvScreen.name = 'familyRoom.frameTv42.screen';
  snugTvScreen.position.set(0, 0, frameTvD * 0.5);
  snugTvGroup.add(snugTvScreen);
  scene.add(snugTvGroup);

  // Lush Architectural Indoor Corner Floor Plant in the NE corner of the Dining Room
  // (Issue #10: High-LOD multi-trunk Ficus lyrata with LatheGeometry stoneware pot on oak stand,
  //  CatmullRomCurve3 branching woody trunks & petioles, and 3D sculpted arched fiddle leaves at X = -5.02m, Z = -2.14m)
  const nePlantGroup = new THREE.Group();
  nePlantGroup.name = 'familyRoom.neCornerPlant';
  nePlantGroup.userData.zone = 'familyRoom';
  nePlantGroup.position.set(-5.02, 0, -2.14);

  const planterStonewareMat = new THREE.MeshStandardMaterial({
    color: 0xd8cebc,
    roughness: 0.56,
    metalness: 0.03,
    side: THREE.DoubleSide,
  });
  const plantSoilMat = new THREE.MeshStandardMaterial({
    color: 0x281e15,
    roughness: 0.94,
  });
  const plantStemWoodMat = new THREE.MeshStandardMaterial({
    color: 0x4e3b29,
    roughness: 0.82,
  });
  const petioleGreenMat = new THREE.MeshStandardMaterial({
    color: 0x435e35,
    roughness: 0.58,
  });

  // Procedural 256x256 Ficus lyrata leaf venation CanvasTexture (dark glossy green with pale-olive midrib & lateral veins)
  const makeFicusLeafTexture = (isFresh: boolean): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 256, 0, 0);
      if (isFresh) {
        grad.addColorStop(0, '#2e582c');
        grad.addColorStop(0.5, '#3b6d36');
        grad.addColorStop(1, '#497f40');
      } else {
        grad.addColorStop(0, '#1e3d20');
        grad.addColorStop(0.5, '#274d29');
        grad.addColorStop(1, '#315d33');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);

      // Central midrib vein (runs from bottom v=0 to tip v=1)
      ctx.strokeStyle = isFresh ? 'rgba(168, 198, 118, 0.72)' : 'rgba(138, 172, 96, 0.62)';
      ctx.lineCap = 'round';
      for (let s = 0; s < 8; s++) {
        const y0 = 256 - s * 30;
        const y1 = Math.max(12, 256 - (s + 1) * 30);
        ctx.lineWidth = Math.max(1.2, 5.2 - s * 0.55);
        ctx.beginPath();
        ctx.moveTo(128, y0);
        ctx.lineTo(128, y1);
        ctx.stroke();
      }

      // Alternating pinnate lateral veins arching toward leaf margins
      for (let v = 0; v < 7; v++) {
        const startY = 232 - v * 30;
        const reachX = 88 + (v > 3 ? 18 : -Math.abs(v - 2) * 8);
        ctx.lineWidth = Math.max(1.0, 2.6 - v * 0.2);
        for (const dir of [-1, 1] as const) {
          ctx.beginPath();
          ctx.moveTo(128, startY);
          ctx.quadraticCurveTo(
            128 + dir * reachX * 0.55,
            startY - 10,
            128 + dir * reachX,
            startY - 26
          );
          ctx.stroke();
        }
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };

  const foliageDeepMat = new THREE.MeshStandardMaterial({
    map: makeFicusLeafTexture(false),
    roughness: 0.36,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });
  const foliageFreshMat = new THREE.MeshStandardMaterial({
    map: makeFicusLeafTexture(true),
    roughness: 0.32,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  // 1. Turned Oak 3-Legged Mid-Century Plant Stand Base (Y = 0..0.09m)
  const standGroup = new THREE.Group();
  standGroup.name = 'familyRoom.neCornerPlant.stand';
  for (let l = 0; l < 3; l++) {
    const legAngle = (l * Math.PI * 2) / 3 + 0.25;
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.012, 0.14, 12),
      oakMat
    );
    leg.position.set(Math.cos(legAngle) * 0.165, 0.07, Math.sin(legAngle) * 0.165);
    leg.rotation.z = -Math.cos(legAngle) * 0.08;
    leg.rotation.x = Math.sin(legAngle) * 0.08;
    leg.castShadow = true;
    standGroup.add(leg);

    const crossbar = new THREE.Mesh(
      new THREE.BoxGeometry(0.17, 0.022, 0.022),
      oakMat
    );
    crossbar.position.set(Math.cos(legAngle) * 0.082, 0.052, Math.sin(legAngle) * 0.082);
    crossbar.rotation.y = -legAngle;
    standGroup.add(crossbar);
  }
  nePlantGroup.add(standGroup);

  // 2. Sculpted LatheGeometry Ceramic Stoneware Planter Pot with curved belly & rolled lip (Y = 0.055..0.415m)
  const potProfilePoints: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.055),
    new THREE.Vector2(0.135, 0.055),
    new THREE.Vector2(0.155, 0.09),
    new THREE.Vector2(0.185, 0.17),
    new THREE.Vector2(0.202, 0.27),
    new THREE.Vector2(0.198, 0.365),
    new THREE.Vector2(0.208, 0.398),
    new THREE.Vector2(0.204, 0.415),
    new THREE.Vector2(0.184, 0.415),
    new THREE.Vector2(0.182, 0.382),
  ];
  const nePlanterPot = new THREE.Mesh(
    new THREE.LatheGeometry(potProfilePoints, 32),
    planterStonewareMat
  );
  nePlanterPot.name = 'familyRoom.neCornerPlant.pot';
  nePlanterPot.castShadow = true;
  nePlanterPot.receiveShadow = true;
  nePlantGroup.add(nePlanterPot);

  // Decorative subtle horizontal stoneware throwing rings around the pot belly
  for (const ringY of [0.22, 0.29, 0.35] as const) {
    const potRib = new THREE.Mesh(
      new THREE.TorusGeometry(0.198, 0.0045, 8, 32),
      planterStonewareMat
    );
    potRib.rotation.x = Math.PI / 2;
    potRib.position.set(0, ringY, 0);
    nePlantGroup.add(potRib);
  }

  // Dark organic soil bed & smooth river pebbles at Y = 0.39m
  const neSoilBed = new THREE.Mesh(
    new THREE.CylinderGeometry(0.182, 0.178, 0.024, 24),
    plantSoilMat
  );
  neSoilBed.name = 'familyRoom.neCornerPlant.soil';
  neSoilBed.position.set(0, 0.388, 0);
  nePlantGroup.add(neSoilBed);

  const pebbleMat = new THREE.MeshStandardMaterial({
    color: 0x8b8274,
    roughness: 0.68,
  });
  for (let p = 0; p < 12; p++) {
    const pa = p * 2.39996;
    const pr = 0.045 + (p % 4) * 0.032;
    const pebble = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), pebbleMat);
    pebble.scale.set(1.2, 0.48, 0.95);
    pebble.position.set(Math.cos(pa) * pr, 0.401, Math.sin(pa) * pr);
    pebble.rotation.y = pa;
    nePlantGroup.add(pebble);
  }

  // 3. Sculpted 3D Ficus Lyrata (Fiddle-Leaf Fig) Leaf Blade Geometry builder
  //    Produces a violin-shaped leaf with basal lobes, pinched waist, broad apical lobe,
  //    longitudinal arch, transverse V-cupping, and ruffled margins.
  const createFicusLeafGeometry = (width: number, length: number, archAmount: number): THREE.BufferGeometry => {
    const segU = 12;
    const segV = 18;
    const geo = new THREE.PlaneGeometry(1, 1, segU, segV);
    const pos = geo.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < pos.count; i++) {
      // u in [-1, +1] across leaf width; v in [0, 1] from petiole base (0) to leaf tip (1)
      const u = pos.getX(i) * 2;
      const v = pos.getY(i) + 0.5;

      // Violin / fiddle-leaf silhouette profile along v
      const baseTaper = Math.pow(Math.sin(Math.min(1, v * 1.04) * Math.PI), 0.62);
      const violinMod =
        1.0 +
        0.34 * Math.exp(-Math.pow((v - 0.74) / 0.2, 2)) - // Broad upper apical paddle lobe
        0.22 * Math.exp(-Math.pow((v - 0.38) / 0.13, 2)) + // Pinched fiddle waist
        0.14 * Math.exp(-Math.pow((v - 0.16) / 0.11, 2)); // Cordate basal lobes
      const halfW = 0.5 * width * baseTaper * violinMod;

      const x = u * halfW;
      const z = v * length;

      // Longitudinal downward arch + transverse V-cupping + subtle margin ruffle
      const archY = Math.sin(v * Math.PI * 0.82) * 0.042 - Math.pow(v, 1.85) * archAmount;
      const cupY = Math.pow(Math.abs(u), 1.45) * 0.022 * Math.sin(v * Math.PI);
      const ruffleY =
        Math.pow(Math.abs(u), 2.0) *
        Math.sin(v * Math.PI * 4.5 + (u >= 0 ? 0.4 : -0.4)) *
        0.009 *
        Math.sin(v * Math.PI);
      // Slight raised central midrib ridge
      const midribY = Math.exp(-Math.pow(u * 6.5, 2)) * 0.0045 * (1 - v * 0.6);

      pos.setXYZ(i, x, archY + cupY + ruffleY + midribY, z);
    }

    geo.computeVertexNormals();
    return geo;
  };

  // 4. Four Organic S-Curved Woody Trunks & Secondary Branches (`CatmullRomCurve3` + `TubeGeometry`)
  const trunkCurves: THREE.CatmullRomCurve3[] = [
    // Main tall central-northwest leader trunk (reaches Y = 1.48m)
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, 0.38, 0.0),
      new THREE.Vector3(-0.02, 0.66, 0.015),
      new THREE.Vector3(0.015, 0.96, -0.02),
      new THREE.Vector3(-0.035, 1.24, 0.025),
      new THREE.Vector3(-0.06, 1.46, 0.045),
    ]),
    // Secondary southwest-leaning branch (reaches Y = 1.24m)
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.025, 0.38, 0.02),
      new THREE.Vector3(-0.075, 0.64, 0.065),
      new THREE.Vector3(-0.135, 0.92, 0.11),
      new THREE.Vector3(-0.18, 1.2, 0.145),
    ]),
    // Secondary northeast-leaning branch (reaches Y = 1.32m)
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.025, 0.38, -0.015),
      new THREE.Vector3(0.07, 0.68, -0.05),
      new THREE.Vector3(0.115, 0.98, -0.095),
      new THREE.Vector3(0.15, 1.28, -0.125),
    ]),
    // Lower southeast fork branch (reaches Y = 1.06m)
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.01, 0.48, 0.01),
      new THREE.Vector3(0.065, 0.68, 0.06),
      new THREE.Vector3(0.12, 0.88, 0.115),
      new THREE.Vector3(0.155, 1.05, 0.15),
    ]),
  ];

  trunkCurves.forEach((curve, idx) => {
    const radius = idx === 0 ? 0.016 : idx === 3 ? 0.011 : 0.0135;
    const trunkMesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 20, radius, 10, false),
      plantStemWoodMat
    );
    trunkMesh.name = `familyRoom.neCornerPlant.trunk.${idx + 1}`;
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    nePlantGroup.add(trunkMesh);
  });

  // 5. 22 Sculpted Ficus Lyrata Leaves connected via curved petioles directly to the 4 woody trunks
  const leafSpecs: ReadonlyArray<{
    readonly trunkIdx: number;
    readonly t: number;
    readonly yaw: number;
    readonly pitch: number;
    readonly roll: number;
    readonly w: number;
    readonly l: number;
    readonly arch: number;
    readonly fresh: boolean;
  }> = [
    // Trunk 0 (main leader) leaves from mid-canopy up to apical crown
    { trunkIdx: 0, t: 0.36, yaw: 0.2, pitch: 0.32, roll: 0.08, w: 0.18, l: 0.29, arch: 0.08, fresh: false },
    { trunkIdx: 0, t: 0.48, yaw: 2.3, pitch: 0.28, roll: -0.06, w: 0.19, l: 0.31, arch: 0.075, fresh: false },
    { trunkIdx: 0, t: 0.60, yaw: 4.4, pitch: 0.22, roll: 0.05, w: 0.20, l: 0.32, arch: 0.07, fresh: false },
    { trunkIdx: 0, t: 0.72, yaw: 1.1, pitch: 0.16, roll: -0.05, w: 0.19, l: 0.30, arch: 0.065, fresh: true },
    { trunkIdx: 0, t: 0.83, yaw: 3.4, pitch: 0.08, roll: 0.04, w: 0.18, l: 0.28, arch: 0.055, fresh: true },
    { trunkIdx: 0, t: 0.93, yaw: 5.5, pitch: -0.05, roll: -0.04, w: 0.16, l: 0.25, arch: 0.045, fresh: true },
    { trunkIdx: 0, t: 1.0, yaw: 1.8, pitch: -0.22, roll: 0.0, w: 0.14, l: 0.22, arch: 0.035, fresh: true },
    { trunkIdx: 0, t: 1.0, yaw: 4.9, pitch: -0.18, roll: 0.0, w: 0.15, l: 0.23, arch: 0.038, fresh: true },

    // Trunk 1 (SW branch) leaves
    { trunkIdx: 1, t: 0.38, yaw: 2.8, pitch: 0.38, roll: -0.08, w: 0.18, l: 0.29, arch: 0.085, fresh: false },
    { trunkIdx: 1, t: 0.56, yaw: 4.8, pitch: 0.30, roll: 0.07, w: 0.19, l: 0.31, arch: 0.075, fresh: false },
    { trunkIdx: 1, t: 0.75, yaw: 1.4, pitch: 0.18, roll: -0.05, w: 0.18, l: 0.28, arch: 0.065, fresh: true },
    { trunkIdx: 1, t: 0.92, yaw: 3.6, pitch: 0.06, roll: 0.04, w: 0.17, l: 0.26, arch: 0.05, fresh: true },
    { trunkIdx: 1, t: 1.0, yaw: 2.2, pitch: -0.14, roll: 0.0, w: 0.15, l: 0.24, arch: 0.04, fresh: true },

    // Trunk 2 (NE branch) leaves
    { trunkIdx: 2, t: 0.35, yaw: 5.8, pitch: 0.36, roll: 0.06, w: 0.18, l: 0.29, arch: 0.085, fresh: false },
    { trunkIdx: 2, t: 0.55, yaw: 1.7, pitch: 0.28, roll: -0.07, w: 0.19, l: 0.30, arch: 0.075, fresh: false },
    { trunkIdx: 2, t: 0.74, yaw: 3.9, pitch: 0.18, roll: 0.05, w: 0.18, l: 0.29, arch: 0.065, fresh: true },
    { trunkIdx: 2, t: 0.91, yaw: 0.5, pitch: 0.05, roll: -0.04, w: 0.17, l: 0.26, arch: 0.05, fresh: true },
    { trunkIdx: 2, t: 1.0, yaw: 5.1, pitch: -0.16, roll: 0.0, w: 0.15, l: 0.23, arch: 0.04, fresh: true },

    // Trunk 3 (SE lower branch) leaves
    { trunkIdx: 3, t: 0.42, yaw: 0.9, pitch: 0.40, roll: 0.08, w: 0.17, l: 0.28, arch: 0.085, fresh: false },
    { trunkIdx: 3, t: 0.68, yaw: 3.1, pitch: 0.28, roll: -0.06, w: 0.18, l: 0.29, arch: 0.075, fresh: false },
    { trunkIdx: 3, t: 0.88, yaw: 5.3, pitch: 0.15, roll: 0.05, w: 0.17, l: 0.26, arch: 0.06, fresh: true },
    { trunkIdx: 3, t: 1.0, yaw: 1.2, pitch: -0.08, roll: 0.0, w: 0.15, l: 0.23, arch: 0.045, fresh: true },
  ];

  leafSpecs.forEach((spec, idx) => {
    const nodePos = trunkCurves[spec.trunkIdx].getPoint(spec.t);
    const petioleLen = 0.065;
    const outDirX = Math.sin(spec.yaw);
    const outDirZ = Math.cos(spec.yaw);
    const leafBasePos = new THREE.Vector3(
      nodePos.x + outDirX * petioleLen,
      nodePos.y + 0.024,
      nodePos.z + outDirZ * petioleLen
    );

    // Curved green petiole stalk connecting the woody trunk node directly to the leaf blade base
    const petioleCurve = new THREE.CatmullRomCurve3([
      nodePos,
      new THREE.Vector3(
        (nodePos.x + leafBasePos.x) * 0.5,
        nodePos.y + 0.018,
        (nodePos.z + leafBasePos.z) * 0.5
      ),
      leafBasePos,
    ]);
    const petioleMesh = new THREE.Mesh(
      new THREE.TubeGeometry(petioleCurve, 6, 0.0042, 6, false),
      petioleGreenMat
    );
    petioleMesh.castShadow = true;
    nePlantGroup.add(petioleMesh);

    const leafHolder = new THREE.Group();
    leafHolder.name = `familyRoom.neCornerPlant.leaf.${idx + 1}`;
    leafHolder.position.copy(leafBasePos);
    leafHolder.rotation.order = 'YXZ';
    leafHolder.rotation.y = spec.yaw;
    leafHolder.rotation.x = spec.pitch;
    leafHolder.rotation.z = spec.roll;

    const leafBlade = new THREE.Mesh(
      createFicusLeafGeometry(spec.w, spec.l, spec.arch),
      spec.fresh ? foliageFreshMat : foliageDeepMat
    );
    leafBlade.castShadow = true;
    leafBlade.receiveShadow = true;
    leafHolder.add(leafBlade);
    nePlantGroup.add(leafHolder);
  });

  // Warm-white micro-LED fairy lights on fine copper wire spiralling up each trunk through the canopy,
  // on the Dining Room KNX circuit (bulbs are a single InstancedMesh to keep draw calls low).
  {
    const fairyWireMat = new THREE.MeshStandardMaterial({
      color: 0x8a5a32,
      roughness: 0.4,
      metalness: 0.7,
    });
    const fairyBulbMat = new THREE.MeshStandardMaterial({
      color: 0xfff2d2,
      emissive: 0xffb04a,
      emissiveIntensity: 3.2,
      roughness: 0.2,
    });
    fairyBulbMat.userData.baseEmissiveIntensity = 3.2;
    lightGroups.diningFairyLights.emissives.push(fairyBulbMat);

    const bulbPositions: THREE.Vector3[] = [];
    trunkCurves.forEach((curve, idx) => {
      const samples = 36;
      const turns = idx === 0 ? 3.5 : 2.5;
      const phase = idx * 1.7;
      const wirePoints: THREE.Vector3[] = [];
      for (let k = 0; k <= samples; k++) {
        const f = k / samples;
        const t = 0.22 + 0.78 * f;
        const p = curve.getPoint(t);
        const angle = phase + f * turns * Math.PI * 2;
        const r = 0.045 + 0.085 * f;
        const pt = new THREE.Vector3(p.x + Math.cos(angle) * r, p.y, p.z + Math.sin(angle) * r);
        wirePoints.push(pt);
        if (k % 2 === 1) bulbPositions.push(pt);
      }
      const wire = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wirePoints), samples * 3, 0.0011, 4, false),
        fairyWireMat
      );
      wire.name = `familyRoom.neCornerPlant.fairyLights.wire.${idx + 1}`;
      nePlantGroup.add(wire);
    });

    const fairyBulbs = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.0055, 6, 5),
      fairyBulbMat,
      bulbPositions.length
    );
    fairyBulbs.name = 'familyRoom.neCornerPlant.fairyLights.bulbs';
    const bulbMatrix = new THREE.Matrix4();
    bulbPositions.forEach((pt, i) => {
      bulbMatrix.makeTranslation(pt.x, pt.y, pt.z);
      fairyBulbs.setMatrixAt(i, bulbMatrix);
    });
    fairyBulbs.instanceMatrix.needsUpdate = true;
    nePlantGroup.add(fairyBulbs);
    interactions.registerLightFixture(fairyBulbs, 'diningFairyLights');
    ctx.addGlowPool('diningFairyLights', -4.92, 0.012, -2.18, 0.72, 0.18);
  }
  scene.add(nePlantGroup);

  // Framed Black-and-White Family Portrait on the West Slate-Blue Alcove Wall
  // (X = -7.79m, Y = 1.349m, Z = -1.48m — PH-54, PH-55, PH-56; lowered ΔY = -0.151m per Issue #1)
  const bwFrameGroup = new THREE.Group();
  bwFrameGroup.name = 'familyRoom.alcovePortrait';
  bwFrameGroup.userData.zone = 'familyRoom';
  bwFrameGroup.position.set(-7.79, 1.349, -1.48);
  bwFrameGroup.rotation.y = Math.PI / 2;

  const distressedFrameMat = new THREE.MeshStandardMaterial({
    color: 0x9b8e7e,
    roughness: 0.62,
  });
  const bwOuterFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.64, 0.5, 0.028),
    distressedFrameMat
  );
  bwOuterFrame.castShadow = true;
  bwFrameGroup.add(bwOuterFrame);

  const bwMount = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.42, 0.032),
    ceramicWhiteMat
  );
  bwFrameGroup.add(bwMount);

  const bwPhotoMat = new THREE.MeshStandardMaterial({
    color: 0x424448,
    roughness: 0.35,
  });
  const bwPhoto = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.26, 0.035),
    bwPhotoMat
  );
  bwFrameGroup.add(bwPhoto);
  scene.add(bwFrameGroup);

  // 1F. White-Plastered East Chimney Breast & Recessed Fireplace Alcove
  //     (Issue #12 & Issue #4: X = -4.96m..-4.64m, centered at X = -4.80m, Z = -0.85m..+0.85m so the South pier
  //      is 100% flush with the Z = +0.85m North jamb of the Kitchen <-> Dining Room portal)
  //     Extends all the way up to Y = 3.00m (flush with the Kitchen cross-wall and continuing into the 1st Floor stack!)
  const chimneyStackGroundH = 3.0;
  const addChimneyWallBlock = (
    cx: number,
    cy: number,
    cz: number,
    w: number,
    h: number,
    d: number
  ): THREE.Mesh => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), crispWhiteWallMat);
    mesh.position.set(cx, cy, cz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  };

  // Left (North) chimney pier (Z = -0.85m..-0.44m, depth 0.41m, width 0.32m)
  addChimneyWallBlock(-4.8, chimneyStackGroundH / 2, -0.645, 0.32, chimneyStackGroundH, 0.41);
  // Right (South) chimney pier (Z = +0.40m..+0.85m, depth 0.45m, width 0.32m — flush with Kitchen portal North jamb at Z = +0.85m)
  addChimneyWallBlock(-4.8, chimneyStackGroundH / 2, 0.625, 0.32, chimneyStackGroundH, 0.45);
  // Upper chimney breast lintel wall above the recessed fireplace opening (Y = 1.26m..3.00m, Z = -0.44m..+0.40m)
  addChimneyWallBlock(
    -4.8,
    1.26 + (chimneyStackGroundH - 1.26) / 2,
    -0.02,
    0.32,
    chimneyStackGroundH - 1.26,
    0.84
  );
  // Seamless plaster jamb lining across X = -4.64m..-4.40m on the North portal reveal (Z = +0.85m)
  addChimneyWallBlock(-4.52, chimneyStackGroundH / 2, 0.851, 0.24, chimneyStackGroundH, 0.004);

  // White-plastered back wall of the fireplace alcove integrated flush at X = -4.64m (Y = 0..1.26m, Z = -0.44m..+0.40m)
  const alcoveBackWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, 1.26, 0.84),
    crispWhiteWallMat
  );
  alcoveBackWall.position.set(-4.652, 0.63, -0.02);
  alcoveBackWall.receiveShadow = true;
  scene.add(alcoveBackWall);

  // Issue #2: Round Mirror (`familyRoom.eastFireplaceMirror`) on the West face of the East Fireplace Chimney Breast
  // Centered at X = -4.96m, Y = 1.72m, Z = -0.02m (facing West -X into the Dining Room)
  {
    const mirrorGroup = new THREE.Group();
    mirrorGroup.name = 'familyRoom.eastFireplaceMirror';
    mirrorGroup.userData.zone = 'familyRoom';
    mirrorGroup.position.set(-4.96, 1.72, -0.02);
    mirrorGroup.rotation.y = -Math.PI / 2; // Local +Z projects West (-X) into the Dining Room

    const mirrorFrameMat = new THREE.MeshStandardMaterial({
      color: 0x6b5235, // Aged antique bronze-brass frame
      roughness: 0.32,
      metalness: 0.78,
    });
    const mirrorGlassMat = new THREE.MeshStandardMaterial({
      color: 0xe6edf2,
      roughness: 0.04,
      metalness: 0.94,
    });
    const mirrorBackMat = new THREE.MeshStandardMaterial({
      color: 0x2a2622,
      roughness: 0.78,
    });

    const outerR = 0.31;
    const innerR = 0.282;

    // Circular backing board
    const backDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(outerR - 0.006, outerR - 0.006, 0.008, 40),
      mirrorBackMat
    );
    backDisc.name = 'familyRoom.eastFireplaceMirror.backing';
    backDisc.rotation.x = Math.PI / 2;
    backDisc.position.set(0, 0, 0.004);
    mirrorGroup.add(backDisc);

    // Deep spun aged-brass cylinder rim band
    const rimBand = new THREE.Mesh(
      new THREE.CylinderGeometry(outerR, outerR, 0.028, 40, 1, true),
      mirrorFrameMat
    );
    rimBand.name = 'familyRoom.eastFireplaceMirror.rimBand';
    rimBand.rotation.x = Math.PI / 2;
    rimBand.position.set(0, 0, 0.014);
    rimBand.castShadow = true;
    mirrorGroup.add(rimBand);

    // Front moulded circular frame ring
    const frontRing = new THREE.Mesh(
      new THREE.TorusGeometry((outerR + innerR) * 0.5, (outerR - innerR) * 0.52, 16, 44),
      mirrorFrameMat
    );
    frontRing.name = 'familyRoom.eastFireplaceMirror.frame';
    frontRing.position.set(0, 0, 0.024);
    frontRing.castShadow = true;
    mirrorGroup.add(frontRing);

    // Inner bevelled sight-edge bead
    const innerBead = new THREE.Mesh(
      new THREE.TorusGeometry(innerR, 0.0045, 10, 44),
      brassMat
    );
    innerBead.name = 'familyRoom.eastFireplaceMirror.bezel';
    innerBead.position.set(0, 0, 0.021);
    mirrorGroup.add(innerBead);

    // Reflective bevelled round mirror glass disc
    const glassDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(innerR, innerR, 0.006, 40),
      mirrorGlassMat
    );
    glassDisc.name = 'familyRoom.eastFireplaceMirror.glass';
    glassDisc.rotation.x = Math.PI / 2;
    glassDisc.position.set(0, 0, 0.016);
    mirrorGroup.add(glassDisc);

    scene.add(mirrorGroup);
  }

  // Issues #4 & #5: Continuous 45°-mitred antique oak skirting board wrapping cleanly around:
  //   - Snug East wall (`X = -4.656m, Z = -2.482m..-0.85m`)
  //   - Left (North) chimney pier North return (`Z = -0.85m`), West face (`X = -4.96m`), and North alcove reveal (`Z = -0.44m`)
  //   - Fireplace alcove back wall (`X = -4.664m, Z = -0.44m..+0.40m`)
  //   - Right (South) chimney pier South alcove reveal (`Z = +0.40m`), West face (`X = -4.96m`), and South portal jamb (`Z = +0.852m, X = -4.96m..-4.40m`)
  //   - Kitchen West wall return (`X = -4.40m, Z = +0.852m..+0.53m` up to the Integrated Fridge-Freezer)
  const eastChimneySkirting = new THREE.Mesh(
    buildMitredWallSkirtingGeometry([
      [-4.656, -2.482],
      [-4.656, -0.85],
      [-4.96, -0.85],
      [-4.96, -0.44],
      [-4.664, -0.44],
      [-4.664, 0.4],
      [-4.96, 0.4],
      [-4.96, 0.852],
      [-4.4, 0.852],
      [-4.4, 0.53],
    ]),
    antiqueOakSkirtingMat
  );
  eastChimneySkirting.name = 'familyRoom.eastChimneySkirting';
  eastChimneySkirting.castShadow = true;
  eastChimneySkirting.receiveShadow = true;
  scene.add(eastChimneySkirting);

  // Issue #9: Herringbone terracotta quarry tile floor (`familyFloor`) extends continuously
  // right into the fireplace hearth alcove with no separate hearth slab or material change.

  // Issue #13 & Issue #4: Interior Plastered Wall Pier on the South Jamb of the Open Kitchen Portal
  // (X = -4.64m..-4.40m, Z = +1.99m..+2.35m — flush with the Kitchen South interior wall at Z = +1.99m!)
  addChimneyWallBlock(-4.52, chimneyStackGroundH / 2, 2.17, 0.24, chimneyStackGroundH, 0.36);

  // 1G. Main Oak Structural Cross-Beam (Z = -0.85m), Exposed Oak Ceiling Joists (Y = wallH - 0.07m)
  //     & 6 KNX Recessed Warm-Dim Ceiling Downlights (Channel 10: familyRoomSpots, GA 1/1/10 — PH-53..56)
  // The signature Main Structural Oak Cross-Beam spanning East-West at Z = -0.85m
  const mainCreamBeam = new THREE.Mesh(
    new THREE.BoxGeometry(3.18, 0.18, 0.2),
    oakMat
  );
  mainCreamBeam.name = 'familyRoom.ceilingBeam.main';
  mainCreamBeam.position.set(-6.23, wallH - 0.13, -0.85);
  mainCreamBeam.castShadow = true;
  mainCreamBeam.receiveShadow = true;
  groundFloorCeilingGroup.add(mainCreamBeam);

  // White plasterboard ceiling backing above the exposed joists (in groundFloorCeilingGroup so it hides when looking from above in Ground Floor mode and appears when inside at eye level!)
  const familyCeilingBacking = new THREE.Mesh(
    new THREE.BoxGeometry(5.2, 0.04, 5.18),
    whiteJoistMat
  );
  familyCeilingBacking.position.set(-7.04, wallH - 0.01, -0.075);
  familyCeilingBacking.receiveShadow = true;
  groundFloorCeilingGroup.add(familyCeilingBacking);

  // 11 Exposed Natural Timber Oak Ceiling Joists running North-South (Z = -2.50m..+2.35m) across the Dining Room (Issue #9)
  for (let j = 0; j < 11; j++) {
    const jx = -9.32 + j * 0.44;
    const isSnugX = jx > -7.8;
    const minJoistZ = isSnugX ? -2.48 : -0.82;
    const joistLen = 2.34 - minJoistZ;
    const joist = new THREE.Mesh(
      new THREE.BoxGeometry(0.075, 0.1, joistLen),
      oakMat
    );
    joist.name = `familyRoom.ceilingJoist.${j + 1}`;
    joist.position.set(jx, wallH - 0.07, (minJoistZ + 2.34) / 2);
    joist.castShadow = true;
    joist.receiveShadow = true;
    groundFloorCeilingGroup.add(joist);
  }

  // 6 KNX Recessed Ceiling Downlights between the Joists (circuitId: 'familyRoomSpots', Ch 10)
  const famSpotEmissiveMat = new THREE.MeshStandardMaterial({
    color: 0xfff4dc,
    emissive: new THREE.Color(0xffaa44),
    emissiveIntensity: 2.8,
    roughness: 0.15,
  });
  lightGroups.familyRoomSpots.emissives.push(famSpotEmissiveMat);

  const famSpotCoords: ReadonlyArray<readonly [number, number]> = [
    [-6.95, -1.65],
    [-5.55, -1.65],
    [-8.45, 0.25],
    [-6.65, 0.25],
    [-8.45, 1.45],
    [-6.65, 1.45],
  ];
  for (const [sx, sz] of famSpotCoords) {
    const spotGroup = new THREE.Group();
    spotGroup.position.set(sx, wallH - 0.035, sz);

    const bezel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.052, 0.012, 16),
      whiteJoistMat
    );
    spotGroup.add(bezel);

    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.036, 0.014, 14),
      famSpotEmissiveMat
    );
    lens.position.set(0, -0.002, 0);
    spotGroup.add(lens);

    interactions.registerLightFixture(spotGroup, 'familyRoomSpots');
    groundFloorCeilingGroup.add(spotGroup);
    ctx.addGlowPool('familyRoomSpots', sx, 0.012, sz, 1.15, 0.26);
  }

  // Consolidated downlight fill for the 6 recessed spots (one PointLight on the scene root rather than six;
  // replaces the light previously thrown by the removed Dining Table pendant).
  const famSpotFill = new THREE.PointLight(0xffb866, 8.5, 6.5, 1.35);
  famSpotFill.userData.baseIntensity = 8.5;
  famSpotFill.position.set(-7.1, wallH - 0.35, 0.1);
  scene.add(famSpotFill);
  lightGroups.familyRoomSpots.lights.push(famSpotFill);

  // Issue #8 & Ruggable Update: Morris & Co. Pimpernel Vintage Blush Tufted Runner Rug (`familyRoom.southRunnerRug`)
  // along the South walkway section of the Dining Room (centered at Z = 1.634m, spanning X = -8.85m..-5.65m, width 0.86m)
  // Ref: https://ruggable.co.uk/products/morris-and-co-pimpernel-vintage-blush-tufted-rug
  {
    const createDiningRunnerRugTextures = (): {
      readonly colorMap: THREE.CanvasTexture;
      readonly bumpMap: THREE.CanvasTexture;
    } => {
      const rw = 768;
      const rh = 256;
      const cCanvas = document.createElement('canvas');
      cCanvas.width = rw;
      cCanvas.height = rh;
      const cCtx = cCanvas.getContext('2d')!;

      const bCanvas = document.createElement('canvas');
      bCanvas.width = rw;
      bCanvas.height = rh;
      const bCtx = bCanvas.getContext('2d')!;

      // 1. Morris & Co. Pimpernel Vintage Blush Beige ground field (muted warm sage-grey & parchment beige)
      cCtx.fillStyle = '#b7b3a7';
      cCtx.fillRect(0, 0, rw, rh);

      // Subtle mottled vintage wash across the ground field
      for (let gx = 40; gx < rw; gx += 95) {
        const gGrad = cCtx.createRadialGradient(gx, rh * 0.5, 8, gx, rh * 0.5, 85);
        gGrad.addColorStop(0, 'rgba(228, 216, 202, 0.24)');
        gGrad.addColorStop(0.6, 'rgba(198, 172, 164, 0.12)');
        gGrad.addColorStop(1, 'rgba(183, 179, 167, 0)');
        cCtx.fillStyle = gGrad;
        cCtx.fillRect(0, 0, rw, rh);
      }

      // 2. Ornate Arts & Crafts Multi-Band Floral Border (cream, vintage blush, sage-grey & warm beige)
      // Outer serged cream-beige selvedge
      cCtx.strokeStyle = '#dfd5c5';
      cCtx.lineWidth = 10;
      cCtx.strokeRect(5, 5, rw - 10, rh - 10);

      // Main Vintage Blush & Dusty Rose floral guard band
      cCtx.strokeStyle = '#c9978c';
      cCtx.lineWidth = 18;
      cCtx.strokeRect(18, 18, rw - 36, rh - 36);

      // Fine warm cream & sage-grey inner/outer guard rules framing the border
      cCtx.strokeStyle = '#efe7d8';
      cCtx.lineWidth = 2.5;
      cCtx.strokeRect(10, 10, rw - 20, rh - 20);
      cCtx.strokeRect(27, 27, rw - 54, rh - 54);

      cCtx.strokeStyle = '#7d8476';
      cCtx.lineWidth = 3;
      cCtx.strokeRect(32, 32, rw - 64, rh - 64);

      // Repeating small cream & sage floral rosettes along the top/bottom and left/right Vintage Blush border band
      const drawBorderRosette = (bx: number, by: number): void => {
        cCtx.fillStyle = '#f2eadb';
        for (let a = 0; a < 4; a++) {
          const ang = (a * Math.PI) / 2;
          cCtx.beginPath();
          cCtx.arc(bx + Math.cos(ang) * 4.2, by + Math.sin(ang) * 4.2, 2.8, 0, Math.PI * 2);
          cCtx.fill();
        }
        cCtx.fillStyle = '#7e8677';
        cCtx.beginPath();
        cCtx.arc(bx - 6.5, by, 2, 0, Math.PI * 2);
        cCtx.arc(bx + 6.5, by, 2, 0, Math.PI * 2);
        cCtx.fill();
        cCtx.fillStyle = '#b37167';
        cCtx.beginPath();
        cCtx.arc(bx, by, 2.4, 0, Math.PI * 2);
        cCtx.fill();
      };
      for (let bx = 28; bx <= rw - 28; bx += 22) {
        drawBorderRosette(bx, 18);
        drawBorderRosette(bx, rh - 18);
      }
      for (let by = 40; by <= rh - 40; by += 22) {
        drawBorderRosette(18, by);
        drawBorderRosette(rw - 18, by);
      }

      // 3. William Morris "Pimpernel" (1876) Bilateral Symmetrical Scrolling Vines, Large Blush Tulips & Pimpernel Blossoms
      cCtx.save();
      cCtx.beginPath();
      cCtx.rect(35, 35, rw - 70, rh - 70);
      cCtx.clip();

      // Helper to draw a large Morris & Co. ruffled Vintage Blush & Cream Tulip/Poppy bloom
      const drawPimpernelTulip = (tx: number, ty: number, dirX: -1 | 1, dirY: -1 | 1): void => {
        cCtx.save();
        cCtx.translate(tx, ty);
        cCtx.scale(dirX, dirY);
        cCtx.rotate(0.32);

        // Outer ruffled dusty-rose petals (#c78c82)
        cCtx.fillStyle = '#c78c82';
        for (const [px, py, rx, ry, rot] of [
          [-14, -4, 16, 10, -0.45],
          [14, -4, 16, 10, 0.45],
          [0, -14, 14, 16, 0],
          [-10, 10, 13, 9, -0.8],
          [10, 10, 13, 9, 0.8],
        ] as const) {
          cCtx.beginPath();
          cCtx.ellipse(px, py, rx, ry, rot, 0, Math.PI * 2);
          cCtx.fill();
        }

        // Inner soft vintage blush & warm cream layered petals (#e4bfb5 & #f3ebdc)
        cCtx.fillStyle = '#e4bfb5';
        for (const [px, py, rx, ry, rot] of [
          [-9, -3, 11, 7, -0.35],
          [9, -3, 11, 7, 0.35],
          [0, -9, 9.5, 11, 0],
        ] as const) {
          cCtx.beginPath();
          cCtx.ellipse(px, py, rx, ry, rot, 0, Math.PI * 2);
          cCtx.fill();
        }

        // Delicate cream scalloped petal tips & deep rose-terracotta calyx heart
        cCtx.fillStyle = '#f4ecde';
        cCtx.beginPath();
        cCtx.ellipse(0, -11, 6, 5, 0, 0, Math.PI * 2);
        cCtx.ellipse(-8, -4, 5, 4, -0.4, 0, Math.PI * 2);
        cCtx.ellipse(8, -4, 5, 4, 0.4, 0, Math.PI * 2);
        cCtx.fill();

        cCtx.fillStyle = '#a46359';
        cCtx.beginPath();
        cCtx.arc(0, 3, 5.5, 0, Math.PI * 2);
        cCtx.fill();
        cCtx.fillStyle = '#e8d59e';
        for (let s = -2; s <= 2; s++) {
          cCtx.beginPath();
          cCtx.arc(s * 2.2, -1 - Math.abs(s) * 0.5, 1.2, 0, Math.PI * 2);
          cCtx.fill();
        }
        cCtx.restore();
      };

      // Helper to draw a 5-petalled cream & blush Scarlet Pimpernel star blossom
      const drawSmallPimpernelFlower = (fx: number, fy: number, radius: number): void => {
        cCtx.fillStyle = '#f3ebdd';
        for (let p = 0; p < 5; p++) {
          const a = (p * Math.PI * 2) / 5 - Math.PI / 2;
          cCtx.beginPath();
          cCtx.ellipse(
            fx + Math.cos(a) * radius * 0.58,
            fy + Math.sin(a) * radius * 0.58,
            radius * 0.48,
            radius * 0.34,
            a,
            0,
            Math.PI * 2
          );
          cCtx.fill();
        }
        cCtx.fillStyle = '#c48379';
        cCtx.beginPath();
        cCtx.arc(fx, fy, radius * 0.28, 0, Math.PI * 2);
        cCtx.fill();
      };

      // Helper to draw scrolling sage-grey & cream willow/acanthus leaves along an S-vine
      const drawWillowSpray = (sx: number, sy: number, dirX: -1 | 1, dirY: -1 | 1): void => {
        cCtx.save();
        cCtx.translate(sx, sy);
        cCtx.scale(dirX, dirY);

        // Interlocking S-curve main vine stem in sage-grey & warm cream highlight
        cCtx.strokeStyle = '#788272';
        cCtx.lineWidth = 4.2;
        cCtx.lineCap = 'round';
        cCtx.beginPath();
        cCtx.moveTo(-48, 38);
        cCtx.bezierCurveTo(-18, 34, -10, -28, 32, -32);
        cCtx.stroke();

        // Coiling secondary tendril
        cCtx.strokeStyle = '#929987';
        cCtx.lineWidth = 2.6;
        cCtx.beginPath();
        cCtx.moveTo(-12, 4);
        cCtx.bezierCurveTo(18, 28, 44, 8, 26, -16);
        cCtx.stroke();

        // Serrated sage-grey & parchment-cream willow leaves along the vine
        for (const [lx, ly, lrot, col] of [
          [-32, 26, -0.5, '#7c8675'],
          [-18, 14, -0.9, '#989e8c'],
          [-6, -8, -1.1, '#dfd6c5'],
          [10, -22, -0.4, '#7c8675'],
          [24, 14, 0.5, '#989e8c'],
          [38, -6, 1.1, '#dfd6c5'],
        ] as const) {
          cCtx.fillStyle = col;
          cCtx.beginPath();
          cCtx.ellipse(lx, ly, 12, 4.2, lrot, 0, Math.PI * 2);
          cCtx.fill();
        }
        cCtx.restore();
      };

      // 6 symmetrical Morris & Co. Pimpernel repeat bays along the runner length
      const numBays = 6;
      const fieldX0 = 42;
      const fieldW = rw - 84;
      const bayW = fieldW / numBays;
      const cy = rh * 0.5;

      for (let b = 0; b < numBays; b++) {
        const bx = fieldX0 + (b + 0.5) * bayW;
        const mirrorX: -1 | 1 = b % 2 === 0 ? 1 : -1;

        // Upper & lower mirrored scrolling willow/acanthus vine sprays
        drawWillowSpray(bx, cy - 36, mirrorX, 1);
        drawWillowSpray(bx, cy + 36, mirrorX, -1);

        // Large paired Vintage Blush Tulips curving symmetrically above & below the centerline
        drawPimpernelTulip(bx + mirrorX * 16, cy - 40, mirrorX, 1);
        drawPimpernelTulip(bx + mirrorX * 16, cy + 40, mirrorX, -1);

        // Central diamond-scroll medallion knot of cream & blush pimpernel blossoms
        drawSmallPimpernelFlower(bx - mirrorX * 26, cy, 11);
        drawSmallPimpernelFlower(bx + mirrorX * 28, cy - 12, 8.5);
        drawSmallPimpernelFlower(bx + mirrorX * 28, cy + 12, 8.5);
        drawSmallPimpernelFlower(bx - mirrorX * 8, cy - 52, 8);
        drawSmallPimpernelFlower(bx - mirrorX * 8, cy + 52, 8);
      }

      cCtx.restore();

      // 4. Soft 7mm Ruggable Tufted All-in-One pile micro-texture & vintage distressed patina
      const cImg = cCtx.getImageData(0, 0, rw, rh);
      const bImg = bCtx.createImageData(rw, rh);
      const cData = cImg.data;
      const bData = bImg.data;

      for (let y = 0; y < rh; y++) {
        for (let x = 0; x < rw; x++) {
          const idx = (y * rw + x) * 4;
          // Fine tufted loop-pile grain + subtle vintage abrash fade
          const tuft =
            Math.sin(x * 2.7 + (y % 3) * 1.1) * 4.5 +
            Math.cos(y * 2.9 + (x % 3) * 0.9) * 4.5;
          const abrash = Math.sin(x * 0.045 + y * 0.02) * 3.5;
          const delta = tuft + abrash;

          cData[idx] = Math.max(0, Math.min(255, cData[idx]! + delta));
          cData[idx + 1] = Math.max(0, Math.min(255, cData[idx + 1]! + delta * 0.96));
          cData[idx + 2] = Math.max(0, Math.min(255, cData[idx + 2]! + delta * 0.92));

          const bumpVal = Math.max(0, Math.min(255, Math.round(128 + tuft * 9)));
          bData[idx] = bumpVal;
          bData[idx + 1] = bumpVal;
          bData[idx + 2] = bumpVal;
          bData[idx + 3] = 255;
        }
      }
      cCtx.putImageData(cImg, 0, 0);
      bCtx.putImageData(bImg, 0, 0);

      const colorMap = new THREE.CanvasTexture(cCanvas);
      colorMap.colorSpace = THREE.SRGBColorSpace;
      colorMap.anisotropy = 8;
      const bumpMap = new THREE.CanvasTexture(bCanvas);
      return { colorMap, bumpMap };
    };

    const runnerTex = createDiningRunnerRugTextures();
    const runnerMat = new THREE.MeshStandardMaterial({
      map: runnerTex.colorMap,
      bumpMap: runnerTex.bumpMap,
      bumpScale: 0.0045,
      roughness: 0.88,
      metalness: 0.01,
    });

    const runnerGroup = new THREE.Group();
    runnerGroup.name = 'familyRoom.southRunnerRug';
    runnerGroup.userData.zone = 'familyRoom';
    runnerGroup.position.set(-7.25, 0.005, 1.634);

    const runnerW = 3.05; // Ruggable 75 x 305 cm runner length along East-West walkway
    const runnerD = 0.78; // Ruggable runner width along North-South

    // Built-in non-slip dark grey rubberized backing pad under the 7mm Tufted All-in-One rug
    const nonSlipBackingMat = new THREE.MeshStandardMaterial({
      color: 0x262523,
      roughness: 0.92,
      metalness: 0.01,
    });
    const nonSlipPad = new THREE.Mesh(
      new THREE.BoxGeometry(runnerW - 0.016, 0.003, runnerD - 0.016),
      nonSlipBackingMat
    );
    nonSlipPad.name = 'familyRoom.southRunnerRug.nonSlipPad';
    nonSlipPad.position.set(0, -0.003, 0);
    nonSlipPad.receiveShadow = true;
    runnerGroup.add(nonSlipPad);

    const runnerBody = new THREE.Mesh(
      new THREE.BoxGeometry(runnerW, 0.008, runnerD),
      runnerMat
    );
    runnerBody.name = 'familyRoom.southRunnerRug.body';
    runnerBody.position.set(0, 0.001, 0);
    runnerBody.receiveShadow = true;
    runnerBody.castShadow = true;
    runnerGroup.add(runnerBody);

    // Serged Vintage Blush Beige bound edge trim around all 4 sides of the Ruggable Tufted runner
    const sergedBindingMat = new THREE.MeshStandardMaterial({
      color: 0xdccfbe,
      roughness: 0.86,
      metalness: 0.01,
    });
    for (const endSign of [-1, 1] as const) {
      const endBinding = new THREE.Mesh(
        new THREE.BoxGeometry(0.012, 0.0085, runnerD + 0.008),
        sergedBindingMat
      );
      endBinding.position.set(endSign * (runnerW * 0.5 + 0.004), 0.001, 0);
      endBinding.receiveShadow = true;
      runnerGroup.add(endBinding);

      const sideBinding = new THREE.Mesh(
        new THREE.BoxGeometry(runnerW, 0.0085, 0.012),
        sergedBindingMat
      );
      sideBinding.position.set(0, 0.001, endSign * (runnerD * 0.5 + 0.004));
      sideBinding.receiveShadow = true;
      runnerGroup.add(sideBinding);
    }

    scene.add(runnerGroup);
  }

  // 1H. South Exterior Brick Wall of Dining Room (0.28m thick, Z = +2.35m..+2.63m, X = -9.56m..-4.64m):
  //     - 3-pane cottage casement window on the right/East (centered at X = -6.50m, width 1.68m)
  //     - Exterior Courtyard Door slightly to the left when looking from outside (centered at X = -8.78m, width 0.92m),
  //       opening directly into the SW corner of the Dining Room (PH-53, PH-56, Photo 1 & Floorplan!)
  const diningWinCenterX = -6.5;
  const diningWinWidth = 1.68;
  const diningWinLeft = diningWinCenterX - diningWinWidth / 2;   // -7.34m
  const diningWinRight = diningWinCenterX + diningWinWidth / 2;  // -5.66m
  const diningDoorCenterX = -8.78;
  const diningDoorWidth = 0.92;
  const diningDoorLeft = diningDoorCenterX - diningDoorWidth / 2;  // -9.24m
  const diningDoorRight = diningDoorCenterX + diningDoorWidth / 2; // -8.32m

  // Low 0.18m base plinth on either side of the Dining Room Exterior Courtyard Door (`X = -9.56m..-9.24m` and `X = -8.32m..-4.40m`)
  addExteriorBrickWall(-9.56, diningDoorLeft, 2.35, 2.63, 0, 0.18, 'north');
  addExteriorBrickWall(diningDoorRight, -4.4, 2.35, 2.63, 0, 0.18, 'north');

  // Weathered oak threshold & reclaimed Yorkstone doorstep at the Dining Room Exterior Courtyard Door (X = -8.78m)
  const diningExtDoorThreshold = new THREE.Mesh(
    new THREE.BoxGeometry(diningDoorWidth + 0.06, 0.036, 0.33),
    oakMat
  );
  diningExtDoorThreshold.position.set(diningDoorCenterX, 0.018, 2.49);
  diningExtDoorThreshold.receiveShadow = true;
  scene.add(diningExtDoorThreshold);

  const diningExtDoorstep = new THREE.Mesh(
    new THREE.BoxGeometry(diningDoorWidth + 0.24, 0.055, 0.36),
    stoneSillMat
  );
  diningExtDoorstep.position.set(diningDoorCenterX, -0.012, 2.79);
  diningExtDoorstep.castShadow = true;
  diningExtDoorstep.receiveShadow = true;
  scene.add(diningExtDoorstep);

  {
    const southCutGroup = new THREE.Group();
    const sillY = 0.76;
    const headY = 1.88;

    const addSouthBrickPiece = (minX: number, maxX: number, y0: number, y1: number): void => {
      const w = maxX - minX;
      const h = y1 - y0;
      const cx = (minX + maxX) / 2;
      const cy = (y0 + y1) / 2;
      const cz = 2.49;
      const geo = new THREE.BoxGeometry(w, h, 0.28);
      applyWorldSpaceBrickUVs(geo, cx, cy, cz);
      const mats: THREE.Material[] = [
        exteriorBrickMat,
        exteriorBrickMat,
        exteriorBrickMat,
        exteriorBrickMat,
        exteriorBrickMat,
        crispWhiteWallMat,
      ];
      const m = new THREE.Mesh(geo, mats);
      m.position.set(cx, cy, cz);
      m.castShadow = true;
      m.receiveShadow = true;
      southCutGroup.add(m);
    };

    // Brick piers & lintels around the Dining Room Exterior Door (X = -9.24m..-8.32m) and 3-pane Window (X = -7.34m..-5.66m)
    addSouthBrickPiece(-9.56, diningDoorLeft, 0.18, wallH);
    addSouthBrickPiece(diningDoorLeft, diningDoorRight, headY, wallH);
    addSouthBrickPiece(diningDoorRight, diningWinLeft, 0.18, wallH);
    addSouthBrickPiece(diningWinRight, -4.4, 0.18, wallH);
    addSouthBrickPiece(diningWinLeft, diningWinRight, 0.18, sillY);
    addSouthBrickPiece(diningWinLeft, diningWinRight, headY, wallH);

    // Consistent 45°-mitred antique oak skirting board along the Dining Room South interior face (Z = 2.35m)
    // and wrapping cleanly around the South Portal Pier (X = -4.64m..-4.40m, Z = +1.99m..+2.35m)
    for (const skirtPath of [
      [
        [diningDoorLeft - 0.062, 2.35],
        [-9.56, 2.35],
      ],
      [
        [-4.4, 1.99],
        [-4.64, 1.99],
        [-4.64, 2.35],
        [diningDoorRight + 0.062, 2.35],
      ],
    ] as const) {
      const southSkirt = new THREE.Mesh(
        buildMitredWallSkirtingGeometry(skirtPath),
        antiqueOakSkirtingMat
      );
      southSkirt.castShadow = true;
      southSkirt.receiveShadow = true;
      scene.add(southSkirt);
    }

    const southCap = new THREE.Mesh(
      new THREE.BoxGeometry(5.17, 0.025, 0.288),
      wallCapMat
    );
    southCap.position.set(-6.98, wallH + 0.012, 2.49);
    southCutGroup.add(southCap);

    // Dining Room Exterior Door Frame (45°-mitred ogee/torus architrave) & Interactive Cottage/Courtyard Door Leaf (X = -8.78m, Z = +2.49m)
    addCasedArchitravePortal(southCutGroup, {
      axis: 'x',
      wallCoord: 2.49,
      wallThickness: 0.28,
      openingCenter: diningDoorCenterX,
      openingWidth: diningDoorWidth,
      frontFloorY: 0,
      backFloorY: 0,
      headY,
      material: antiqueOakSkirtingMat,
      jambInset: 0.03,
      headInset: 0.034,
      namePrefix: 'diningRoom.courtyardDoor',
    });

    // Interactive Half-Glazed Farmhouse Courtyard Door Leaf (Issue #2: matching the 4-pane glazed upper window & Shaker lower panel of the other courtyard door)
    const leafW = diningDoorWidth - 0.058;
    const leafH = headY - 0.068;
    const diningExtDoorObj = new THREE.Group();
    diningExtDoorObj.position.set(diningDoorCenterX, 0.035 + leafH / 2, 2.49);

    // Lower solid Shaker panel section (bottom 0.86m of door)
    const lowerPanelH = 0.86;
    const lowerPanel = new THREE.Mesh(
      new THREE.BoxGeometry(leafW, lowerPanelH, 0.054),
      courtyardDoorMat
    );
    lowerPanel.position.set(0, -leafH / 2 + lowerPanelH / 2, 0);
    lowerPanel.castShadow = true;
    lowerPanel.receiveShadow = true;
    diningExtDoorObj.add(lowerPanel);

    // Recessed Shaker moulding on lower door panel
    const lowerRecess = new THREE.Mesh(
      new THREE.BoxGeometry(leafW - 0.22, lowerPanelH - 0.22, 0.06),
      courtyardDoorRecessMat
    );
    lowerRecess.position.set(0, -leafH / 2 + lowerPanelH / 2, 0);
    diningExtDoorObj.add(lowerRecess);

    // Full-height outer stiles & top/middle rails framing the 4-pane glazed upper window
    const upperH = leafH - lowerPanelH;
    for (const sx of [-leafW / 2 + 0.058, leafW / 2 - 0.058] as const) {
      const stile = new THREE.Mesh(
        new THREE.BoxGeometry(0.116, leafH, 0.056),
        courtyardDoorMat
      );
      stile.position.set(sx, 0, 0);
      stile.castShadow = true;
      diningExtDoorObj.add(stile);
    }
    const midLockRail = new THREE.Mesh(
      new THREE.BoxGeometry(leafW, 0.11, 0.056),
      courtyardDoorMat
    );
    midLockRail.position.set(0, -leafH / 2 + lowerPanelH, 0);
    midLockRail.castShadow = true;
    diningExtDoorObj.add(midLockRail);

    const topDoorRail = new THREE.Mesh(
      new THREE.BoxGeometry(leafW, 0.11, 0.056),
      courtyardDoorMat
    );
    topDoorRail.position.set(0, leafH / 2 - 0.055, 0);
    topDoorRail.castShadow = true;
    diningExtDoorObj.add(topDoorRail);

    // Upper glass pane + Georgian cross muntins
    const glassW = leafW - 0.18;
    const glassH = upperH - 0.08;
    const glassCenterY = leafH / 2 - 0.055 - glassH / 2;
    const doorGlass = new THREE.Mesh(
      new THREE.BoxGeometry(glassW, glassH, 0.016),
      windowGlassMat
    );
    doorGlass.position.set(0, glassCenterY, 0);
    diningExtDoorObj.add(doorGlass);

    const vMuntin = new THREE.Mesh(
      new THREE.BoxGeometry(0.026, glassH, 0.036),
      courtyardDoorMat
    );
    vMuntin.position.set(0, glassCenterY, 0);
    diningExtDoorObj.add(vMuntin);

    const hMuntin = new THREE.Mesh(
      new THREE.BoxGeometry(glassW, 0.026, 0.036),
      courtyardDoorMat
    );
    hMuntin.position.set(0, glassCenterY, 0);
    diningExtDoorObj.add(hMuntin);

    // Brass lever handle & lock escutcheon at lock rail height on both faces
    const handlePlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.042, 0.15, 0.072),
      brassMat
    );
    handlePlate.position.set(leafW / 2 - 0.06, -0.04, 0);
    diningExtDoorObj.add(handlePlate);

    for (const hz of [-0.052, 0.052] as const) {
      const lever = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.018, 0.018),
        brassMat
      );
      lever.position.set(leafW / 2 - 0.1, -0.02, hz);
      diningExtDoorObj.add(lever);
    }

    southCutGroup.add(diningExtDoorObj);
    interactions.registerHingedDoor(
      southCutGroup,
      diningExtDoorObj,
      new THREE.Vector3(-leafW / 2, 0, 0),
      'y',
      -Math.PI * 0.46,
      0
    );

    // Exterior stone sill & interior white window board + plastered reveal linings for the 3-pane Dining Room Window (X = -6.50m)
    const extSill = new THREE.Mesh(
      new THREE.BoxGeometry(diningWinWidth + 0.12, 0.065, 0.195),
      stoneSillMat
    );
    extSill.position.set(diningWinCenterX, sillY - 0.02, 2.5775);
    southCutGroup.add(extSill);

    const intSill = new THREE.Mesh(
      new THREE.BoxGeometry(diningWinWidth + 0.08, 0.03, 0.18),
      skirtingMat
    );
    intSill.position.set(diningWinCenterX, sillY + 0.01, 2.41);
    intSill.receiveShadow = true;
    southCutGroup.add(intSill);

    const winH = headY - sillY;
    const cy = sillY + winH / 2;
    for (const sideX of [-1, 1] as const) {
      const revealJamb = new THREE.Mesh(
        new THREE.BoxGeometry(0.012, winH, 0.145),
        crispWhiteWallMat
      );
      revealJamb.position.set(
        diningWinCenterX + sideX * (diningWinWidth * 0.5 - 0.005),
        cy,
        2.4225
      );
      revealJamb.receiveShadow = true;
      southCutGroup.add(revealJamb);
    }
    const revealHead = new THREE.Mesh(
      new THREE.BoxGeometry(diningWinWidth, 0.012, 0.145),
      crispWhiteWallMat
    );
    revealHead.position.set(diningWinCenterX, headY - 0.005, 2.4225);
    revealHead.receiveShadow = true;
    southCutGroup.add(revealHead);

    for (let i = 0; i <= 3; i++) {
      const mx = diningWinLeft + (i / 3) * diningWinWidth;
      const mullion = new THREE.Mesh(
        new THREE.BoxGeometry(0.045, winH, 0.11),
        windowFrameMat
      );
      mullion.position.set(mx, cy, 2.49);
      southCutGroup.add(mullion);
    }
    for (const ry of [sillY + 0.027, sillY + winH * 0.52, headY - 0.027]) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(diningWinWidth, 0.04, 0.1),
        windowFrameMat
      );
      rail.position.set(diningWinCenterX, ry, 2.49);
      southCutGroup.add(rail);
    }
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(diningWinWidth - 0.06, winH - 0.08, 0.016),
      windowGlassMat
    );
    glass.position.set(diningWinCenterX, cy, 2.49);
    southCutGroup.add(glass);

    // Issue #5: Roman blind on the Dining Room South window (X = -6.50m, Z = 2.35m)
    buildWindowRomanBlind(scene, tagCutawayWall, {
      name: 'familyRoom.southWindow.romanBlind',
      zone: 'familyRoom',
      centerX: diningWinCenterX,
      width: diningWinWidth,
      railY: headY - 0.035,
      bottomY: headY - 0.39,
      wallFaceZ: 2.35,
      facingZ: -1,
      parentGroup: southCutGroup,
    });

    cutawayWallGroups.southWest.add(southCutGroup);
  }

  // Issue #9: Removed pineSideboardGroup & wickerBasket under the South Window

  // Neptune Wycombe Extending Dining Table (WYC-TAB-210-EXT: 210cm x 100cm x 75cm -> extends to 286cm 10-person mode when clicked!)
  // & 6 / 10 Natural Pale Oak Spindle-Back Chairs with Woven Rush/Paper-Cord Seats (matching media_1790538918078.jpg)
  // Issue #1: Moved to [-6.55, 0, -0.607]
  // Issue #10: Clicking the dining table toggles between 6-person standard mode and 10-person extended mode!
  const wycombeGroup = new THREE.Group();
  wycombeGroup.name = 'familyRoom.neptuneWycombeDiningTable';
  wycombeGroup.userData = {
    zone: 'familyRoom',
    zoneId: 'familyRoom',
    lodTier: 1,
  };
  wycombeGroup.position.set(-6.55, 0, -0.607);

  // Natural pale weathered/blonde oak finish across the entire table and chairs (media_1790538918078.jpg)
  const wycombeNaturalOakMat = new THREE.MeshStandardMaterial({
    color: 0xc2a682,
    roughness: 0.52,
    metalness: 0.02,
  });
  const wycombeOakSeamMat = new THREE.MeshStandardMaterial({
    color: 0x9a7d5a,
    roughness: 0.62,
    metalness: 0.02,
  });
  // Woven natural paper-cord / rush seat material + soft oatmeal linen table runner
  const wycombeWovenCordMat = new THREE.MeshStandardMaterial({
    color: 0xd4be96,
    roughness: 0.82,
    metalness: 0.01,
  });
  const wycombeCushionMat = new THREE.MeshStandardMaterial({
    color: 0xe6dfd1,
    roughness: 0.78,
  });

  const createRoundedTabletopGeometry = (halfW: number, minZ: number, maxZ: number): THREE.ExtrudeGeometry => {
    const cornerR = 0.045;
    const topThick = 0.032; // Y = 0.718m..0.750m (above 0.630m..0.718m apron)
    const topShape = new THREE.Shape();
    // Shape 2D (x, y) maps after rotateX(-Math.PI / 2) to (x, z = -y)
    const minY = -maxZ;
    const maxY = -minZ;
    topShape.moveTo(-halfW + cornerR, minY);
    topShape.lineTo(halfW - cornerR, minY);
    topShape.absarc(halfW - cornerR, minY + cornerR, cornerR, -Math.PI / 2, 0, false);
    topShape.lineTo(halfW, maxY - cornerR);
    topShape.absarc(halfW - cornerR, maxY - cornerR, cornerR, 0, Math.PI / 2, false);
    topShape.lineTo(-halfW + cornerR, maxY);
    topShape.absarc(-halfW + cornerR, maxY - cornerR, cornerR, Math.PI / 2, Math.PI, false);
    topShape.lineTo(-halfW, minY + cornerR);
    topShape.absarc(-halfW + cornerR, minY + cornerR, cornerR, Math.PI, Math.PI * 1.5, false);
    topShape.closePath();

    const geo = new THREE.ExtrudeGeometry(topShape, {
      depth: topThick,
      bevelEnabled: true,
      bevelThickness: 0.003,
      bevelSize: 0.003,
      bevelSegments: 2,
      curveSegments: 12,
    });
    geo.rotateX(-Math.PI / 2);
    return geo;
  };

  // 1A. Standard 6-person Tabletop: Length = 2.10m (Z = -1.05m..+1.05m), Width = 1.00m (X = -0.50m..+0.50m)
  const wycombeTopSlab = new THREE.Mesh(
    createRoundedTabletopGeometry(0.5, -1.05, 1.05),
    wycombeNaturalOakMat
  );
  wycombeTopSlab.name = 'familyRoom.neptuneWycombeDiningTable.tabletop';
  wycombeTopSlab.position.set(0, 0.718, 0);
  wycombeTopSlab.castShadow = true;
  wycombeTopSlab.receiveShadow = true;
  wycombeGroup.add(wycombeTopSlab);

  // 1B. Extended 10-person Tabletop: Length = 2.86m (Z = -1.05m..+1.81m, extending South into the open dining bay)
  const wycombeExtendedTopSlab = new THREE.Mesh(
    createRoundedTabletopGeometry(0.5, -1.05, 1.81),
    wycombeNaturalOakMat
  );
  wycombeExtendedTopSlab.name = 'familyRoom.neptuneWycombeDiningTable.extendedTabletop';
  wycombeExtendedTopSlab.position.set(0, 0.718, 0);
  wycombeExtendedTopSlab.castShadow = true;
  wycombeExtendedTopSlab.receiveShadow = true;
  wycombeExtendedTopSlab.visible = false;
  wycombeGroup.add(wycombeExtendedTopSlab);

  // 2 transverse extension leaf seam lines (Number Of Leaves: 2)
  const leafSeams: THREE.Mesh[] = [];
  for (const leafSeamZ of [-0.225, 0.225] as const) {
    const leafSeam = new THREE.Mesh(
      new THREE.BoxGeometry(0.992, 0.034, 0.003),
      wycombeOakSeamMat
    );
    leafSeam.position.set(0, 0.734, leafSeamZ);
    wycombeGroup.add(leafSeam);
    leafSeams.push(leafSeam);
  }

  // Subtle longitudinal wide-plank oak joint lines along the tabletop
  const plankSeams: THREE.Mesh[] = [];
  for (const plankSeamX of [-0.3, -0.1, 0.1, 0.3] as const) {
    const plankSeam = new THREE.Mesh(
      new THREE.BoxGeometry(0.002, 0.002, 2.08),
      wycombeOakSeamMat
    );
    plankSeam.position.set(plankSeamX, 0.7505, 0);
    wycombeGroup.add(plankSeam);
    plankSeams.push(plankSeam);
  }

  // 2. Undertable Apron Frame: Undertable Height = 63cm (0.630m clear legroom below apron -> Y = 0.630m..0.718m, height = 0.088m)
  const apronH = 0.088;
  const apronMidY = 0.63 + apronH / 2; // 0.674m (bottom at exact Y = 0.630m!)
  const wycombeApron = new THREE.Mesh(
    new THREE.BoxGeometry(0.84, apronH, 1.88),
    wycombeNaturalOakMat
  );
  wycombeApron.name = 'familyRoom.neptuneWycombeDiningTable.apron';
  wycombeApron.position.set(0, apronMidY, 0);
  wycombeApron.castShadow = true;
  wycombeApron.receiveShadow = true;
  wycombeGroup.add(wycombeApron);

  // 3. 4 Splayed, Smoothly Tapered Cylindrical Natural Oak Legs at the corners (matching media_1790538918078.jpg)
  const southLegs: THREE.Mesh[] = [];
  for (const [signX, signZ] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ] as const) {
    const topX = signX * 0.395;
    const topZ = signZ * 0.905;
    const botX = signX * 0.445; // Subtle ~4° outward splay in X & Z
    const botZ = signZ * 0.955;
    const topY = 0.712;
    const dx = botX - topX;
    const dz = botZ - topZ;
    const legLen = Math.hypot(dx, topY, dz);

    const legShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.019, legLen, 16),
      wycombeNaturalOakMat
    );
    legShaft.name = 'familyRoom.neptuneWycombeDiningTable.leg';
    legShaft.position.set((topX + botX) / 2, topY / 2, (topZ + botZ) / 2);
    legShaft.rotation.z = signX * 0.07;
    legShaft.rotation.x = -signZ * 0.07;
    legShaft.castShadow = true;
    legShaft.receiveShadow = true;
    wycombeGroup.add(legShaft);
    if (signZ === 1) {
      southLegs.push(legShaft);
    }
  }

  // Helper to build a Neptune Wycombe Natural Oak Spindle-Back Dining Chair with Woven Paper-Cord Seat
  const buildWycombeChair = (cIdx: number, cx: number, cz: number, rotY: number): THREE.Group => {
    const chair = new THREE.Group();
    chair.name = `familyRoom.neptuneWycombeDiningTable.chair.${cIdx}`;
    chair.position.set(cx, 0, cz);
    chair.rotation.y = rotY;

    // 4 Cylindrical Oak Seat Frame Rails surrounding the woven rush/paper-cord seat (Y = 0.448m)
    for (const sz of [-0.185, 0.185] as const) {
      const fbRail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.014, 0.42, 12),
        wycombeNaturalOakMat
      );
      fbRail.rotation.z = Math.PI / 2;
      fbRail.position.set(0, 0.448, sz);
      fbRail.castShadow = true;
      chair.add(fbRail);
    }
    for (const sx of [-0.205, 0.205] as const) {
      const sideRail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.014, 0.38, 12),
        wycombeNaturalOakMat
      );
      sideRail.rotation.x = Math.PI / 2;
      sideRail.position.set(sx, 0.448, 0);
      sideRail.castShadow = true;
      chair.add(sideRail);
    }

    // Woven natural paper-cord / rush seat pad with envelope-weave quadrants (Y = 0.445m..0.474m)
    const rushSeat = new THREE.Mesh(
      new THREE.BoxGeometry(0.405, 0.028, 0.375),
      wycombeWovenCordMat
    );
    rushSeat.name = `familyRoom.neptuneWycombeDiningTable.chair.${cIdx}.seat`;
    rushSeat.position.set(0, 0.458, 0);
    rushSeat.castShadow = true;
    rushSeat.receiveShadow = true;
    chair.add(rushSeat);

    // Subtle diagonal envelope-weave seam lines across the rush seat
    for (const diagAngle of [0.74, -0.74] as const) {
      const weaveSeam = new THREE.Mesh(
        new THREE.BoxGeometry(0.52, 0.003, 0.004),
        wycombeOakSeamMat
      );
      weaveSeam.rotation.y = diagAngle;
      weaveSeam.position.set(0, 0.473, 0);
      chair.add(weaveSeam);
    }

    // Front tapered cylindrical oak legs (slightly splayed)
    for (const signX of [-1, 1] as const) {
      const fLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.011, 0.46, 12),
        wycombeNaturalOakMat
      );
      fLeg.position.set(signX * 0.208, 0.228, 0.188);
      fLeg.rotation.z = signX * 0.035;
      fLeg.rotation.x = 0.03;
      fLeg.castShadow = true;
      chair.add(fLeg);

      // Rear lower leg segment (floor up to seat rail at Z = -0.185)
      const rLegLower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.012, 0.46, 12),
        wycombeNaturalOakMat
      );
      rLegLower.position.set(signX * 0.202, 0.228, -0.192);
      rLegLower.rotation.z = signX * 0.025;
      rLegLower.rotation.x = -0.035;
      rLegLower.castShadow = true;
      chair.add(rLegLower);

      // Continuous raked rear back stile rising from seat rail (Y = 0.45m) to top crest rail (Y = 0.90m)
      const backStile = new THREE.Mesh(
        new THREE.CylinderGeometry(0.013, 0.016, 0.465, 12),
        wycombeNaturalOakMat
      );
      backStile.position.set(signX * 0.198, 0.675, -0.208);
      backStile.rotation.x = -0.1;
      backStile.castShadow = true;
      chair.add(backStile);

      // Side stretcher rail (Y = 0.165m)
      const sideStretcher = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0085, 0.0085, 0.375, 10),
        wycombeNaturalOakMat
      );
      sideStretcher.rotation.x = Math.PI / 2;
      sideStretcher.position.set(signX * 0.205, 0.165, 0);
      chair.add(sideStretcher);
    }

    // Front, rear & central H-stretcher rails
    for (const [stY, stZ, stW] of [
      [0.195, 0.188, 0.41],
      [0.195, -0.192, 0.4],
      [0.165, -0.01, 0.41],
    ] as const) {
      const crossStretcher = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0085, 0.0085, stW, 10),
        wycombeNaturalOakMat
      );
      crossStretcher.rotation.z = Math.PI / 2;
      crossStretcher.position.set(0, stY, stZ);
      chair.add(crossStretcher);
    }

    // Lower horizontal spindle-back rail above the seat (Y = 0.525m)
    const lowerBackRail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.39, 10),
      wycombeNaturalOakMat
    );
    lowerBackRail.rotation.z = Math.PI / 2;
    lowerBackRail.position.set(0, 0.525, -0.193);
    chair.add(lowerBackRail);

    // Gently curved steam-bent oak top crest rail (Y = 0.895m, matching media_1790538918078.jpg)
    const crestCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.205, 0.89, -0.222),
      new THREE.Vector3(0, 0.902, -0.242),
      new THREE.Vector3(0.205, 0.89, -0.222)
    );
    const crestRail = new THREE.Mesh(
      new THREE.TubeGeometry(crestCurve, 16, 0.018, 12, false),
      wycombeNaturalOakMat
    );
    crestRail.scale.set(1, 1.35, 0.72);
    crestRail.position.set(0, -0.31, -0.06);
    crestRail.castShadow = true;
    chair.add(crestRail);

    // 6 slender turned vertical oak spindles spanning from lowerBackRail (Y = 0.525m) to crestRail (Y = 0.895m)
    for (const spx of [-0.145, -0.087, -0.029, 0.029, 0.087, 0.145] as const) {
      const zCurveOff = (1 - (spx / 0.195) * (spx / 0.195)) * 0.012;
      const spindle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0055, 0.0065, 0.375, 10),
        wycombeNaturalOakMat
      );
      spindle.position.set(spx, 0.708, -0.21 - zCurveOff);
      spindle.rotation.x = -0.1;
      spindle.castShadow = true;
      chair.add(spindle);
    }

    return chair;
  };

  // 4. 6 Primary Neptune Wycombe Dining Chairs (2 on West, 2 on East, 1 at North head, 1 at South foot)
  const chairLayout6: ReadonlyArray<readonly [number, number, number]> = [
    [-0.4, -0.52, Math.PI / 2],
    [-0.4, 0.52, Math.PI / 2],
    [0.4, -0.52, -Math.PI / 2],
    [0.4, 0.52, -Math.PI / 2],
    [0, -0.95, 0],
    [0, 0.95, Math.PI],
  ];
  const chairLayout10Primary: ReadonlyArray<readonly [number, number, number]> = [
    [-0.4, -0.67, Math.PI / 2],
    [-0.4, 0.03, Math.PI / 2],
    [0.4, -0.67, -Math.PI / 2],
    [0.4, 0.03, -Math.PI / 2],
    [0, -0.95, 0],
    [0, 1.71, Math.PI],
  ];
  const chairLayout10Extra: ReadonlyArray<readonly [number, number, number]> = [
    [-0.4, 0.73, Math.PI / 2],
    [-0.4, 1.43, Math.PI / 2],
    [0.4, 0.73, -Math.PI / 2],
    [0.4, 1.43, -Math.PI / 2],
  ];

  const primaryChairs: THREE.Group[] = [];
  for (let cIdx = 0; cIdx < chairLayout6.length; cIdx++) {
    const [cx, cz, rotY] = chairLayout6[cIdx]!;
    const chair = buildWycombeChair(cIdx + 1, cx, cz, rotY);
    wycombeGroup.add(chair);
    primaryChairs.push(chair);
  }

  // Linen runner, ceramic vase centerpiece, brass candlesticks & place settings
  const wycombeRunner = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.005, 1.48),
    wycombeCushionMat
  );
  wycombeRunner.name = 'familyRoom.neptuneWycombeDiningTable.runner';
  wycombeRunner.position.set(0, 0.753, 0);
  wycombeGroup.add(wycombeRunner);

  const wycombeVase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.075, 0.22, 16),
    ceramicWhiteMat
  );
  wycombeVase.name = 'familyRoom.neptuneWycombeDiningTable.centerpieceVase';
  wycombeVase.position.set(0, 0.865, 0);
  wycombeVase.castShadow = true;
  wycombeGroup.add(wycombeVase);

  const foliageSprayMat = new THREE.MeshStandardMaterial({
    color: 0x4b6344,
    roughness: 0.76,
    metalness: 0.02,
  });
  const foliageSprays: Array<{ readonly mesh: THREE.Mesh; readonly baseZ: number }> = [];
  for (const [fx, fy, fz, r] of [
    [-0.03, 0.99, -0.02, 0.055],
    [0.035, 1.01, 0.02, 0.05],
    [0, 1.03, -0.01, 0.048],
  ] as const) {
    const spray = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 10), foliageSprayMat);
    spray.position.set(fx, fy, fz);
    wycombeGroup.add(spray);
    foliageSprays.push({ mesh: spray, baseZ: fz });
  }

  // Pair of brass candlesticks with ivory taper candles flanking the centerpiece vase
  const candlestickMeshes: Array<{ readonly mesh: THREE.Mesh; readonly baseZ: number }> = [];
  for (const csz of [-0.36, 0.36] as const) {
    const holderBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.042, 0.11, 14),
      brassMat
    );
    holderBase.position.set(0, 0.808, csz);
    holderBase.castShadow = true;
    wycombeGroup.add(holderBase);
    candlestickMeshes.push({ mesh: holderBase, baseZ: csz });

    const taperCandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.011, 0.18, 10),
      ceramicWhiteMat
    );
    taperCandle.position.set(0, 0.95, csz);
    taperCandle.castShadow = true;
    wycombeGroup.add(taperCandle);
    candlestickMeshes.push({ mesh: taperCandle, baseZ: csz });
  }

  // Complete Table Place Settings (woven rattan charger mat, stoneware dinner & side plates, folded linen napkin, stainless cutlery & crystal wine/water glasses)
  const placematMat = new THREE.MeshStandardMaterial({
    color: 0x967853,
    roughness: 0.84,
    metalness: 0.02,
  });
  const stonewarePlateMat = new THREE.MeshStandardMaterial({
    color: 0xf4f1ea,
    roughness: 0.24,
    metalness: 0.04,
  });
  const stonewareRimMat = new THREE.MeshStandardMaterial({
    color: 0xd9d2c5,
    roughness: 0.34,
    metalness: 0.04,
  });
  const cutlerySilverMat = new THREE.MeshStandardMaterial({
    color: 0xd8dde2,
    roughness: 0.18,
    metalness: 0.88,
  });
  const crystalGlassMat = new THREE.MeshStandardMaterial({
    color: 0xeef6fa,
    roughness: 0.08,
    metalness: 0.12,
    transparent: true,
    opacity: 0.52,
  });
  const napkinLinenMat = new THREE.MeshStandardMaterial({
    color: 0xc8bfa8,
    roughness: 0.82,
    metalness: 0.01,
  });

  const buildPlaceSetting = (pIdx: number, px: number, pz: number, pRotY: number): THREE.Group => {
    const placeGrp = new THREE.Group();
    placeGrp.name = `familyRoom.neptuneWycombeDiningTable.placeSetting.${pIdx}`;
    placeGrp.position.set(px, 0.75, pz);
    placeGrp.rotation.y = pRotY;

    // Woven round seagrass/rattan placemat
    const matMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.165, 0.165, 0.005, 24),
      placematMat
    );
    matMesh.position.set(0, 0.0025, 0);
    matMesh.receiveShadow = true;
    placeGrp.add(matMesh);

    // Dinner plate (27cm) + starter/salad plate (20cm)
    const dinnerPlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.135, 0.11, 0.014, 24),
      stonewarePlateMat
    );
    dinnerPlate.name = `familyRoom.neptuneWycombeDiningTable.plate.${pIdx}`;
    dinnerPlate.position.set(0, 0.012, 0);
    dinnerPlate.castShadow = true;
    dinnerPlate.receiveShadow = true;
    placeGrp.add(dinnerPlate);

    const saladPlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.098, 0.08, 0.012, 24),
      stonewareRimMat
    );
    saladPlate.position.set(0, 0.023, 0);
    saladPlate.castShadow = true;
    placeGrp.add(saladPlate);

    // Folded linen napkin with brass napkin ring resting on top of the starter plate
    const napkin = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.014, 0.14),
      napkinLinenMat
    );
    napkin.rotation.y = 0.18;
    napkin.position.set(0, 0.035, 0);
    napkin.castShadow = true;
    placeGrp.add(napkin);

    // Stainless steel fork (left, X = -0.175m) & dinner knife + spoon (right, X = +0.175m, +0.205m)
    const fork = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.004, 0.185),
      cutlerySilverMat
    );
    fork.position.set(-0.175, 0.004, 0);
    placeGrp.add(fork);

    const knife = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.004, 0.205),
      cutlerySilverMat
    );
    knife.position.set(0.175, 0.004, 0);
    placeGrp.add(knife);

    // Stemmed crystal wine glass & water tumbler at top-right of the plate
    const glassBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.004, 14),
      crystalGlassMat
    );
    glassBase.position.set(0.14, 0.003, 0.13);
    placeGrp.add(glassBase);

    const glassStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.075, 8),
      crystalGlassMat
    );
    glassStem.position.set(0.14, 0.042, 0.13);
    placeGrp.add(glassStem);

    const wineBowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.034, 0.018, 0.082, 16),
      crystalGlassMat
    );
    wineBowl.name = `familyRoom.neptuneWycombeDiningTable.wineGlass.${pIdx}`;
    wineBowl.position.set(0.14, 0.115, 0.13);
    wineBowl.castShadow = true;
    placeGrp.add(wineBowl);

    const waterTumbler = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.026, 0.095, 16),
      crystalGlassMat
    );
    waterTumbler.position.set(0.075, 0.048, 0.155);
    waterTumbler.castShadow = true;
    placeGrp.add(waterTumbler);

    return placeGrp;
  };

  const placeSettingCoords6: ReadonlyArray<readonly [number, number, number]> = [
    [-0.31, -0.52, Math.PI / 2],  // West North
    [-0.31, 0.52, Math.PI / 2],   // West South
    [0.31, -0.52, -Math.PI / 2],  // East North
    [0.31, 0.52, -Math.PI / 2],   // East South
    [0, -0.84, 0],                // North Head
    [0, 0.84, Math.PI],           // South Foot
  ];
  const placeSettingCoords10Primary: ReadonlyArray<readonly [number, number, number]> = [
    [-0.31, -0.67, Math.PI / 2],
    [-0.31, 0.03, Math.PI / 2],
    [0.31, -0.67, -Math.PI / 2],
    [0.31, 0.03, -Math.PI / 2],
    [0, -0.84, 0],
    [0, 1.6, Math.PI],
  ];
  const placeSettingCoords10Extra: ReadonlyArray<readonly [number, number, number]> = [
    [-0.31, 0.73, Math.PI / 2],
    [-0.31, 1.43, Math.PI / 2],
    [0.31, 0.73, -Math.PI / 2],
    [0.31, 1.43, -Math.PI / 2],
  ];

  const primaryPlaceSettings: THREE.Group[] = [];
  for (let pIdx = 0; pIdx < placeSettingCoords6.length; pIdx++) {
    const [px, pz, pRotY] = placeSettingCoords6[pIdx]!;
    const placeGrp = buildPlaceSetting(pIdx + 1, px, pz, pRotY);
    wycombeGroup.add(placeGrp);
    primaryPlaceSettings.push(placeGrp);
  }

  // Extra 4 chairs (chair.7..10) and 4 place settings (placeSetting.7..10) for 10-person extended mode
  const extendedSeatsGroup = new THREE.Group();
  extendedSeatsGroup.name = 'familyRoom.neptuneWycombeDiningTable.extendedSeats';
  extendedSeatsGroup.visible = false;
  for (let i = 0; i < chairLayout10Extra.length; i++) {
    const [cx, cz, rotY] = chairLayout10Extra[i]!;
    extendedSeatsGroup.add(buildWycombeChair(7 + i, cx, cz, rotY));
  }
  for (let i = 0; i < placeSettingCoords10Extra.length; i++) {
    const [px, pz, pRotY] = placeSettingCoords10Extra[i]!;
    extendedSeatsGroup.add(buildPlaceSetting(7 + i, px, pz, pRotY));
  }
  wycombeGroup.add(extendedSeatsGroup);

  // Interactive click toggle between 6-person standard mode (2.10m) and 10-person extended mode (2.86m)
  let isDiningTableExtended = false;
  interactions.registerToggleCallback(
    wycombeGroup,
    () => {
      isDiningTableExtended = !isDiningTableExtended;
      const extCenterZ = isDiningTableExtended ? 0.38 : 0;

      wycombeTopSlab.visible = !isDiningTableExtended;
      wycombeExtendedTopSlab.visible = isDiningTableExtended;
      extendedSeatsGroup.visible = isDiningTableExtended;

      wycombeApron.scale.z = isDiningTableExtended ? 2.64 / 1.88 : 1;
      wycombeApron.position.z = extCenterZ;

      wycombeRunner.scale.z = isDiningTableExtended ? 2.24 / 1.48 : 1;
      wycombeRunner.position.z = extCenterZ;

      wycombeVase.position.z = extCenterZ;
      for (const sp of foliageSprays) {
        sp.mesh.position.z = sp.baseZ + extCenterZ;
      }
      for (const cs of candlestickMeshes) {
        cs.mesh.position.z = cs.baseZ + extCenterZ;
      }

      leafSeams[0]!.position.z = isDiningTableExtended ? -0.15 : -0.225;
      leafSeams[1]!.position.z = isDiningTableExtended ? 0.91 : 0.225;
      for (const ps of plankSeams) {
        ps.scale.z = isDiningTableExtended ? 2.84 / 2.08 : 1;
        ps.position.z = extCenterZ;
      }

      const southLegZ = (0.905 + 0.955) / 2 + (isDiningTableExtended ? 0.76 : 0);
      for (const sLeg of southLegs) {
        sLeg.position.z = southLegZ;
      }

      const targetChairCoords = isDiningTableExtended ? chairLayout10Primary : chairLayout6;
      for (let i = 0; i < primaryChairs.length; i++) {
        const [cx, cz, rotY] = targetChairCoords[i]!;
        primaryChairs[i]!.position.set(cx, 0, cz);
        primaryChairs[i]!.rotation.y = rotY;
      }

      const targetPlaceCoords = isDiningTableExtended ? placeSettingCoords10Primary : placeSettingCoords6;
      for (let i = 0; i < primaryPlaceSettings.length; i++) {
        const [px, pz, pRotY] = targetPlaceCoords[i]!;
        primaryPlaceSettings[i]!.position.set(px, 0.75, pz);
        primaryPlaceSettings[i]!.rotation.y = pRotY;
      }

      wycombeGroup.updateMatrixWorld(true);
    },
    [wycombeGroup]
  );

  scene.add(wycombeGroup);

  // 1J. West Load-Bearing Cross-Wall between Dining Room (Y = 0.00m) and Next Hallway (Y = -0.30m)
  //     (0.24m thick, X = -9.56m..-9.80m, center X = -9.68m):
  //     - Solid wall from Z = -2.50m to Z = +1.35m (length 3.85m, center Z = -0.575m)
  //     - Open Walk-Through Opening with Solid Oak Cased Architrave (NO door!) right near the South exterior wall
  //       at Z = +1.35m..+2.25m (center Z = +1.80m, width 0.90m — matching Photo 6 & PH-56!)
  //     - 30cm (0.30m) Step Down inside the opening into the next hallway (Y = -0.30m)
  //     - Small 15cm South corner nib from Z = +2.25m to Z = +2.40m (length 0.15m, center Z = +2.325m)
  const lowerFloorY = -0.3; // 30cm lower interior floor level from the next hallway onwards
  const lowerWallH = wallH - lowerFloorY; // 2.58m (from Y = -0.30m to Y = 2.28m)
  const lowerWallMidY = (lowerFloorY + wallH) / 2; // 0.99m
  const lowerDoorLintelH = wallH - (lowerFloorY + doorH); // 0.60m
  const lowerDoorLintelY = lowerFloorY + doorH + lowerDoorLintelH / 2; // 1.98m

  addInteriorWall(-9.68, lowerWallMidY, -0.575, 0.24, lowerWallH, 3.85, crispWhiteWallMat);
  addInteriorWall(-9.68, doorLintelY, 1.8, 0.24, doorLintelH, 0.9, crispWhiteWallMat);
  addInteriorWall(-9.68, lowerWallMidY, 2.325, 0.24, lowerWallH, 0.15, crispWhiteWallMat);

  // Framed Botanical & Architectural Picture on the solid West wall of the Dining Room
  // (Issue #8 & Issue #2: at X = -9.552m, Y = 1.486m above the West wall sideboard, Z = +0.28m)
  const westPicGroup = new THREE.Group();
  westPicGroup.name = 'familyRoom.westWallPicture';
  westPicGroup.userData.zone = 'familyRoom';
  westPicGroup.position.set(-9.552, 1.486, 0.28);
  westPicGroup.rotation.y = Math.PI / 2; // Flush on West wall facing East (+X) into Dining Room

  const wpW = 0.64;
  const wpH = 0.52;
  const wpD = 0.028;
  const wpRail = 0.034;

  for (const [rx, ry, rw, rh] of [
    [0, wpH / 2 - wpRail / 2, wpW, wpRail],
    [0, -wpH / 2 + wpRail / 2, wpW, wpRail],
    [-wpW / 2 + wpRail / 2, 0, wpRail, wpH - wpRail * 2],
    [wpW / 2 - wpRail / 2, 0, wpRail, wpH - wpRail * 2],
  ] as const) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(rw, rh, wpD),
      antiqueOakSkirtingMat
    );
    rail.position.set(rx, ry, 0);
    rail.castShadow = true;
    rail.receiveShadow = true;
    westPicGroup.add(rail);
  }

  const wpMount = new THREE.Mesh(
    new THREE.BoxGeometry(wpW - wpRail * 2, wpH - wpRail * 2, 0.016),
    ceramicWhiteMat
  );
  wpMount.position.set(0, 0, 0.002);
  westPicGroup.add(wpMount);

  const wpCanvas = document.createElement('canvas');
  wpCanvas.width = 320;
  wpCanvas.height = 256;
  const wpCtx = wpCanvas.getContext('2d');
  if (wpCtx) {
    wpCtx.fillStyle = '#f3ede0';
    wpCtx.fillRect(0, 0, 320, 256);
    wpCtx.strokeStyle = '#a89a84';
    wpCtx.lineWidth = 2;
    wpCtx.strokeRect(18, 18, 284, 220);

    // Warm heritage architectural & botanical study illustration
    const bgGrad = wpCtx.createLinearGradient(28, 28, 28, 228);
    bgGrad.addColorStop(0, '#d8e0dc');
    bgGrad.addColorStop(0.65, '#e8dfd0');
    bgGrad.addColorStop(1, '#9ba488');
    wpCtx.fillStyle = bgGrad;
    wpCtx.fillRect(28, 28, 264, 200);

    // Georgian farmhouse elevation sketch in warm terracotta & slate
    wpCtx.fillStyle = '#9e5a44';
    wpCtx.fillRect(96, 118, 128, 72);
    wpCtx.fillStyle = '#485056';
    wpCtx.beginPath();
    wpCtx.moveTo(86, 118);
    wpCtx.lineTo(160, 76);
    wpCtx.lineTo(234, 118);
    wpCtx.closePath();
    wpCtx.fill();

    // Windows & doorway details
    wpCtx.fillStyle = '#f5f0e6';
    for (const wx of [112, 152, 192] as const) {
      wpCtx.fillRect(wx, 128, 16, 22);
    }
    wpCtx.fillRect(112, 160, 16, 24);
    wpCtx.fillRect(192, 160, 16, 24);
    wpCtx.fillStyle = '#5c4028';
    wpCtx.fillRect(152, 158, 16, 32);

    // Flanking cypress & oak foliage
    wpCtx.fillStyle = '#485f44';
    for (const [fx, fy, fr] of [
      [68, 156, 28],
      [252, 152, 30],
      [268, 168, 22],
    ] as const) {
      wpCtx.beginPath();
      wpCtx.arc(fx, fy, fr, 0, Math.PI * 2);
      wpCtx.fill();
    }
  }
  const wpTex = new THREE.CanvasTexture(wpCanvas);
  wpTex.colorSpace = THREE.SRGBColorSpace;
  const wpArtPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(wpW - 0.16, wpH - 0.14),
    new THREE.MeshStandardMaterial({ map: wpTex, roughness: 0.45 })
  );
  wpArtPlane.name = 'familyRoom.westWallPicture.canvas';
  wpArtPlane.position.set(0, 0, 0.012);
  westPicGroup.add(wpArtPlane);
  scene.add(westPicGroup);

  // Fluted antique-brass picture light over the picture on the West wall (separately controllable on diningPictureLight circuit)
  {
    const diningPictureLightGlowMat = new THREE.MeshStandardMaterial({
      color: 0xffefb8,
      emissive: 0xffae24,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });
    diningPictureLightGlowMat.userData.baseEmissiveIntensity = 2.2;
    lightGroups.diningPictureLight.emissives.push(diningPictureLightGlowMat);

    const diningPictureLight = buildFlutedBrassPictureLight(
      {
        brass: new THREE.MeshStandardMaterial({ color: 0x9e7b3e, roughness: 0.28, metalness: 0.84 }),
        darkBrass: new THREE.MeshStandardMaterial({ color: 0x6e5326, roughness: 0.36, metalness: 0.78 }),
        glow: diningPictureLightGlowMat,
      },
      { name: 'familyRoom.westWallPictureLight', zone: 'familyRoom', shadeWidth: 0.42 }
    );
    // Picture top edge is at Y = 1.746m; backplate sits 0.10m above top frame rail at Y = 1.846m.
    diningPictureLight.position.set(-9.56, 1.846, 0.28);
    diningPictureLight.rotation.y = Math.PI / 2;
    scene.add(diningPictureLight);
    interactions.registerLightFixture(diningPictureLight, 'diningPictureLight');
  }

  // Issue #6 & Issue #1: Bespoke Country Sideboard on the Dining Room West Wall with Luxury Reed Diffuser (left/North) & Potted Plant (right/South)
  buildDiningRoomWestWallSideboard(scene);

  // Warm accent glow pool for the West wall picture light (`diningPictureLight` circuit; Dining Room already has 2 PointLights)
  ctx.addGlowPool('diningPictureLight', -9.2, lowerFloorY + 0.006, 0.28, 0.95, 0.22);

  // Issue #16: 2 High-End Carbon Road Bikes Hanging Vertically on the East Wall of the Walk-In Cupboard
  buildWalkInCupboardRoadBikes(scene);

  // 45°-mitred ogee/torus Solid Oak Cased Architrave around the Open Walk-Through Opening (Z = +1.35m..+2.25m)
  addCasedArchitravePortal(scene, {
    axis: 'z',
    wallCoord: -9.68,
    wallThickness: 0.24,
    openingCenter: 1.8,
    openingWidth: 0.9,
    frontFloorY: 0,
    backFloorY: lowerFloorY,
    headY: doorH,
    material: antiqueOakSkirtingMat,
    namePrefix: 'diningRoom.bootLobbyPortal',
  });

  // 30cm (0.30m) Step Down from Dining Room (Y = 0.00m) into the Boot Lobby (Y = -0.30m) at X = -9.56m..-9.99m, Z = +1.35m..+2.25m:
  // 1. Upper threshold slab, recessed oak riser & half-round bullnose nosing at X = -9.56m..-9.725m (top at Y = 0.00m, riser down to Y = -0.15m)
  const upperThresholdStep = new THREE.Mesh(
    applyWorldSpaceFloorUVs(new THREE.BoxGeometry(0.165, 0.032, 0.92), -9.6425, 1.8, 0.85, 0.85),
    [
      oakMat,
      oakMat,
      herringboneTerracottaQuarryMat,
      oakMat,
      oakMat,
      oakMat,
    ]
  );
  upperThresholdStep.name = 'familyRoom.thresholdStep.upper';
  upperThresholdStep.position.set(-9.6425, -0.016, 1.8);
  upperThresholdStep.castShadow = true;
  upperThresholdStep.receiveShadow = true;
  scene.add(upperThresholdStep);

  const upperThresholdRiser = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.118, 0.92),
    oakMat
  );
  upperThresholdRiser.name = 'familyRoom.thresholdStep.upperRiser';
  upperThresholdRiser.position.set(-9.635, -0.091, 1.8);
  upperThresholdRiser.castShadow = true;
  upperThresholdRiser.receiveShadow = true;
  scene.add(upperThresholdRiser);

  const upperBullnoseGeo = new THREE.CylinderGeometry(
    0.016,
    0.016,
    0.9,
    16,
    1,
    false,
    Math.PI,
    Math.PI
  );
  upperBullnoseGeo.rotateX(Math.PI / 2);
  const upperThresholdNosing = new THREE.Mesh(upperBullnoseGeo, oakMat);
  upperThresholdNosing.name = 'familyRoom.thresholdStep.upperBullnose';
  upperThresholdNosing.position.set(-9.725, -0.016, 1.8);
  upperThresholdNosing.castShadow = true;
  upperThresholdNosing.receiveShadow = true;
  scene.add(upperThresholdNosing);

  // 2. Intermediate rounded-corner bullnose oak step tread & recessed rounded vertical riser (15cm down at Y = -0.15m, X = -9.71m..-10.02m)
  //    Issue #3: Extends all the way to the South exterior wall on the right (Z = 2.40m) and overlaps further on the left (Z = 1.18m).
  {
    const treadH = 0.032; // Top flush at Y = -0.15m, bottom at Y = -0.182m
    const bullnoseR = treadH * 0.5; // 16mm half-round bullnose radius
    const cornerR = 0.095; // 95mm horizontal rounding radius on the projecting NW corner
    const xEast = -9.71;
    const xWest = -10.02;
    const zNorth = 1.18;
    const zSouth = 2.4;

    const buildRoundedStepFootprintShape = (inset: number): THREE.Shape => {
      const xW = xWest + inset;
      const zN = zNorth + inset;
      const zS = zSouth;
      const rC = Math.max(0.02, cornerR - inset);
      // Shape in (X, -Z) so ExtrudeGeometry rotated by -PI/2 around X puts +extrude along +Y and shape Y along +Z
      const shape = new THREE.Shape();
      shape.moveTo(xEast, -zN);
      shape.lineTo(xW + rC, -zN);
      shape.absarc(xW + rC, -(zN + rC), rC, Math.PI * 0.5, Math.PI, false);
      shape.lineTo(xW, -zS);
      shape.lineTo(xEast, -zS);
      shape.closePath();
      return shape;
    };

    const buildExtrudedStepSlab = (
      inset: number,
      heightY: number,
      bottomY: number
    ): THREE.BufferGeometry => {
      const geo = new THREE.ExtrudeGeometry(buildRoundedStepFootprintShape(inset), {
        depth: heightY,
        bevelEnabled: false,
        curveSegments: 18,
      });
      geo.rotateX(-Math.PI / 2);
      geo.translate(0, bottomY, 0);

      // Apply world-space oak plank UVs on the top face so the engineered oak grain matches the Boot Lobby floor
      const pos = geo.attributes.position;
      const uv = geo.attributes.uv;
      if (pos && uv) {
        for (let i = 0; i < pos.count; i++) {
          const wx = pos.getX(i);
          const wy = pos.getY(i);
          const wz = pos.getZ(i);
          if (wy > bottomY + heightY - 0.002) {
            uv.setXY(i, wx / 4.4, wz / 1.76);
          } else {
            uv.setXY(i, (wz - zNorth) / 1.2, (wy - bottomY) / 0.4);
          }
        }
        uv.needsUpdate = true;
      }
      geo.computeVertexNormals();
      return geo;
    };

    // Rounded-corner tread board (Y = -0.182m..-0.150m): group 0 = top/bottom caps (`engineeredOakFloorMat`), group 1 = side walls (`oakMat`)
    const midTreadGeo = buildExtrudedStepSlab(0, treadH, -0.15 - treadH);
    const midStepDown = new THREE.Mesh(midTreadGeo, [
      engineeredOakFloorMat,
      oakMat,
    ]);
    midStepDown.name = 'familyRoom.thresholdStep.mid';
    midStepDown.castShadow = true;
    midStepDown.receiveShadow = true;
    scene.add(midStepDown);

    // Recessed rounded-corner vertical oak riser (Y = -0.300m..-0.182m, inset 14mm behind the bullnose overhang)
    const midRiserGeo = buildExtrudedStepSlab(0.014, 0.15 - treadH, -0.3);
    const midStepRiser = new THREE.Mesh(midRiserGeo, oakMat);
    midStepRiser.name = 'familyRoom.thresholdStep.midRiser';
    midStepRiser.castShadow = true;
    midStepRiser.receiveShadow = true;
    scene.add(midStepRiser);

    // Continuous rounded bullnose nosing tube wrapping around the North return, rounded NW corner,
    // and West front edge all the way to the South exterior wall (Y = -0.166m, radius = 16mm)
    const nosingPts: THREE.Vector3[] = [];
    const nosingY = -0.15 - bullnoseR;
    const xWallFace = -9.795;
    const cxCorner = xWest + cornerR;
    const czNorth = zNorth + cornerR;

    // North straight return from wall face (-9.795) to start of NW corner
    for (let s = 0; s <= 3; s++) {
      const u = s / 3;
      nosingPts.push(
        new THREE.Vector3(xWallFace + (cxCorner - xWallFace) * u, nosingY, zNorth)
      );
    }
    // NW rounded corner arc (90°)
    const arcSteps = 12;
    for (let s = 1; s <= arcSteps; s++) {
      const theta = (s / arcSteps) * (Math.PI * 0.5);
      nosingPts.push(
        new THREE.Vector3(
          cxCorner - cornerR * Math.sin(theta),
          nosingY,
          czNorth - cornerR * Math.cos(theta)
        )
      );
    }
    // West straight front edge running all the way to the South exterior wall (zSouth = 2.40m)
    for (let s = 1; s <= 8; s++) {
      const u = s / 8;
      nosingPts.push(
        new THREE.Vector3(xWest, nosingY, czNorth + (zSouth - czNorth) * u)
      );
    }

    const nosingCurve = new THREE.CatmullRomCurve3(nosingPts, false, 'centripetal', 0.1);
    const midStepNosing = new THREE.Mesh(
      new THREE.TubeGeometry(nosingCurve, 44, bullnoseR, 16, false),
      engineeredOakFloorMat
    );
    midStepNosing.name = 'familyRoom.thresholdStep.midBullnose';
    midStepNosing.castShadow = true;
    midStepNosing.receiveShadow = true;
    scene.add(midStepNosing);
  }

  return {
    lowerDoorLintelH,
    lowerDoorLintelY,
    lowerFloorY,
    lowerWallH,
    lowerWallMidY,
  };
}
