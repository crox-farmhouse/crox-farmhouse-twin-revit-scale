import * as THREE from 'three';
import {
  addCasedArchitravePortal,
  buildMitredWallSkirtingGeometry,
} from '../../../../../engine/geometry/swept-moulding.ts';
import { buildWindowRomanBlind } from '../../../../../objects/decor/roman-blind.ts';
import type { SceneBuilderContext } from '../../../../../core/types/scene.ts';
import type { DiningRoomKit } from '../dining-room.ts';
import type { DiningRoomSharedMaterials } from './walk-in-cupboard-and-north-wall.ts';

export function buildDiningCeilingRugAndSouthWall(
  ctx: SceneBuilderContext,
  kit: DiningRoomKit,
  mats: DiningRoomSharedMaterials
): void {
  const { cutawayWallGroups, groundFloorCeilingGroup, interactions, lightGroups, scene } = ctx;
  const {
    antiqueOakSkirtingMat,
    applyWorldSpaceBrickUVs,
    brassMat,
    courtyardDoorMat,
    courtyardDoorRecessMat,
    exteriorBrickMat,
    oakMat,
    skirtingMat,
    stoneSillMat,
    tagCutawayWall,
    wallCapMat,
    wallH,
    windowFrameMat,
    windowGlassMat,
  } = kit;
  const { crispWhiteWallMat, whiteJoistMat } = mats;
  // 1G. Main Oak Structural Cross-Beam (Z = -0.85m), Exposed Oak Ceiling Joists (Y = wallH - 0.07m)
  //     & 6 KNX Recessed Warm-Dim Ceiling Downlights (Channel 10: familyRoomSpots, GA 1/1/10 — PH-53..56)
  // The signature Main Structural Oak Cross-Beam spanning East-West at Z = -0.85m
  // Bears onto the Walk-in Cupboard East structural wall (X = -7.895m, East face -7.82m) and East Chimney Breast North pier (X = -4.64m)
  const mainCreamBeam = new THREE.Mesh(
    new THREE.BoxGeometry(3.22, 0.18, 0.2),
    oakMat
  );
  mainCreamBeam.name = 'familyRoom.ceilingBeam.main';
  mainCreamBeam.position.set(-6.23, wallH - 0.13, -0.85);
  mainCreamBeam.castShadow = true;
  mainCreamBeam.receiveShadow = true;
  groundFloorCeilingGroup.add(mainCreamBeam);

  // North-South Chimney Breast Trimmer Beam along the West face (X = -5.01m) of the East Masonry Chimney Breast (Z = -0.85m..+0.85m)
  // Carries the hearth trimming between `mainCreamBeam` (Z = -0.85m) and the South alcove joist header (Z = +0.85m)
  const chimneyTrimmerBeam = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.14, 1.82),
    oakMat
  );
  chimneyTrimmerBeam.name = 'familyRoom.ceilingBeam.chimneyTrimmer';
  chimneyTrimmerBeam.position.set(-5.01, wallH - 0.1, 0.0);
  chimneyTrimmerBeam.castShadow = true;
  chimneyTrimmerBeam.receiveShadow = true;
  groundFloorCeilingGroup.add(chimneyTrimmerBeam);

  // White plasterboard ceiling backing above the exposed joists (in groundFloorCeilingGroup so it hides when looking from above in Ground Floor mode and appears when inside at eye level!)
  const familyCeilingBacking = new THREE.Mesh(
    new THREE.BoxGeometry(4.92, 0.04, 4.85),
    whiteJoistMat
  );
  if (!familyCeilingBacking.name) familyCeilingBacking.name = 'familyRoom.southWall.familyCeilingBacking';
  familyCeilingBacking.position.set(-7.1, wallH - 0.01, -0.075);
  familyCeilingBacking.receiveShadow = true;
  groundFloorCeilingGroup.add(familyCeilingBacking);

  // 11 Exposed Natural Timber Oak Ceiling Joists running North-South across the Dining Room, Snug Bay & Walk-in Cupboard:
  // - Bays j = 0..3 (jx = -9.32m..-8.00m): Bear onto the Walk-in Cupboard South partition wall (Z = -0.515m, South face -0.44m)
  //   and the South exterior brick wall (Z = +2.40m), with matching North-bay joists inside the Walk-in Cupboard (Z = -2.50m..-0.57m).
  // - Bays j = 4..9 (jx = -7.56m..-5.36m): Span continuously from the North exterior brick wall (Z = -2.50m) over `mainCreamBeam` (Z = -0.85m)
  //   to the South exterior brick wall (Z = +2.40m).
  // - Bay j = 10 (jx = -4.92m, aligned with East Chimney Breast X = -4.96m..-4.64m, Z = -0.85m..+0.85m):
  //   Trimmed cleanly into a South alcove joist (Z = +0.84m..+2.42m) and a North Snug alcove joist (Z = -2.50m..-0.84m)
  //   bearing against the masonry chimney piers instead of passing through the flue!
  for (let j = 0; j < 11; j++) {
    const jx = -9.32 + j * 0.44;
    const isCupboardBay = jx <= -7.85;
    const isChimneyBay = jx >= -4.98;
    const minJoistZ = isCupboardBay ? -0.46 : isChimneyBay ? 0.84 : -2.5;
    const maxJoistZ = 2.42;
    const joistLen = maxJoistZ - minJoistZ;
    const joist = new THREE.Mesh(
      new THREE.BoxGeometry(0.075, 0.1, joistLen),
      oakMat
    );
    joist.name = `familyRoom.ceilingJoist.${j + 1}`;
    joist.position.set(jx, wallH - 0.07, (minJoistZ + maxJoistZ) / 2);
    joist.castShadow = true;
    joist.receiveShadow = true;
    groundFloorCeilingGroup.add(joist);

    if (isCupboardBay) {
      const cupMinZ = -2.5;
      const cupMaxZ = -0.57;
      const cupJoist = new THREE.Mesh(
        new THREE.BoxGeometry(0.075, 0.1, cupMaxZ - cupMinZ),
        oakMat
      );
      cupJoist.name = `familyRoom.walkInCupboard.ceilingJoist.${j + 1}`;
      cupJoist.position.set(jx, wallH - 0.07, (cupMinZ + cupMaxZ) / 2);
      cupJoist.castShadow = true;
      cupJoist.receiveShadow = true;
      groundFloorCeilingGroup.add(cupJoist);
    } else if (isChimneyBay) {
      const snugMinZ = -2.5;
      const snugMaxZ = -0.84;
      const snugJoist = new THREE.Mesh(
        new THREE.BoxGeometry(0.075, 0.1, snugMaxZ - snugMinZ),
        oakMat
      );
      snugJoist.name = `familyRoom.ceilingJoist.${j + 1}.north`;
      snugJoist.position.set(jx, wallH - 0.07, (snugMinZ + snugMaxZ) / 2);
      snugJoist.castShadow = true;
      snugJoist.receiveShadow = true;
      groundFloorCeilingGroup.add(snugJoist);
    }
  }

  // 6 KNX Recessed Ceiling Downlights between the Joists (circuitId: 'familyRoomSpots', Ch 10)
  // Issue #4: Overhead lights stay visible in cutaway mode at low opacity (`0.32..0.42`)
  const famSpotBezelMat = new THREE.MeshStandardMaterial({
    color: 0xf7f5f0,
    roughness: 0.55,
    metalness: 0.05,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  });
  const famSpotEmissiveMat = new THREE.MeshStandardMaterial({
    color: 0xfff4dc,
    emissive: new THREE.Color(0xffaa44),
    emissiveIntensity: 2.8,
    roughness: 0.15,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
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
      famSpotBezelMat
    );
    if (!bezel.name) bezel.name = 'familyRoom.southWall.bezel';
    spotGroup.add(bezel);

    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.036, 0.014, 14),
      famSpotEmissiveMat
    );
    if (!lens.name) lens.name = 'familyRoom.southWall.lens';
    lens.position.set(0, -0.002, 0);
    spotGroup.add(lens);

    interactions.registerLightFixture(spotGroup, 'familyRoomSpots');
    scene.add(spotGroup);
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
      if (!endBinding.name) endBinding.name = 'familyRoom.southWall.endBinding';
      endBinding.position.set(endSign * (runnerW * 0.5 + 0.004), 0.001, 0);
      endBinding.receiveShadow = true;
      runnerGroup.add(endBinding);

      const sideBinding = new THREE.Mesh(
        new THREE.BoxGeometry(runnerW, 0.0085, 0.012),
        sergedBindingMat
      );
      if (!sideBinding.name) sideBinding.name = 'familyRoom.southWall.sideBinding';
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

  // Weathered oak threshold & reclaimed Yorkstone doorstep at the Dining Room Exterior Courtyard Door (X = -8.78m)
  const diningExtDoorThreshold = new THREE.Mesh(
    new THREE.BoxGeometry(diningDoorWidth + 0.06, 0.036, 0.33),
    oakMat
  );
  if (!diningExtDoorThreshold.name) diningExtDoorThreshold.name = 'familyRoom.southWall.diningExtDoorThreshold';
  diningExtDoorThreshold.position.set(diningDoorCenterX, 0.018, 2.49);
  diningExtDoorThreshold.receiveShadow = true;
  scene.add(diningExtDoorThreshold);

  const diningExtDoorstep = new THREE.Mesh(
    new THREE.BoxGeometry(diningDoorWidth + 0.24, 0.055, 0.36),
    stoneSillMat
  );
  if (!diningExtDoorstep.name) diningExtDoorstep.name = 'familyRoom.southWall.diningExtDoorstep';
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
      if (!m.name) m.name = 'familyRoom.southWall.m';
      m.position.set(cx, cy, cz);
      m.castShadow = true;
      m.receiveShadow = true;
      southCutGroup.add(m);
    };

    // Brick piers & lintels around the Dining Room Exterior Door (X = -9.24m..-8.32m) and 3-pane Window (X = -7.34m..-5.66m)
    addSouthBrickPiece(-9.56, diningDoorLeft, 0, wallH);
    addSouthBrickPiece(diningDoorLeft, diningDoorRight, headY, wallH);
    addSouthBrickPiece(diningDoorRight, diningWinLeft, 0, wallH);
    addSouthBrickPiece(diningWinRight, -4.4, 0, wallH);
    addSouthBrickPiece(diningWinLeft, diningWinRight, 0, sillY);
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
      if (!southSkirt.name) southSkirt.name = 'familyRoom.southWall.southSkirt';
      southSkirt.castShadow = true;
      southSkirt.receiveShadow = true;
      scene.add(southSkirt);
    }

    const southCap = new THREE.Mesh(
      new THREE.BoxGeometry(5.17, 0.025, 0.288),
      wallCapMat
    );
    if (!southCap.name) southCap.name = 'familyRoom.southWall.southCap';
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
    if (!lowerPanel.name) lowerPanel.name = 'familyRoom.southWall.lowerPanel';
    lowerPanel.position.set(0, -leafH / 2 + lowerPanelH / 2, 0);
    lowerPanel.castShadow = true;
    lowerPanel.receiveShadow = true;
    diningExtDoorObj.add(lowerPanel);

    // Recessed Shaker moulding on lower door panel
    const lowerRecess = new THREE.Mesh(
      new THREE.BoxGeometry(leafW - 0.22, lowerPanelH - 0.22, 0.06),
      courtyardDoorRecessMat
    );
    if (!lowerRecess.name) lowerRecess.name = 'familyRoom.southWall.lowerRecess';
    lowerRecess.position.set(0, -leafH / 2 + lowerPanelH / 2, 0);
    diningExtDoorObj.add(lowerRecess);

    // Full-height outer stiles & top/middle rails framing the 4-pane glazed upper window
    const upperH = leafH - lowerPanelH;
    for (const sx of [-leafW / 2 + 0.058, leafW / 2 - 0.058] as const) {
      const stile = new THREE.Mesh(
        new THREE.BoxGeometry(0.116, leafH, 0.056),
        courtyardDoorMat
      );
      if (!stile.name) stile.name = 'familyRoom.southWall.stile';
      stile.position.set(sx, 0, 0);
      stile.castShadow = true;
      diningExtDoorObj.add(stile);
    }
    const midLockRail = new THREE.Mesh(
      new THREE.BoxGeometry(leafW, 0.11, 0.056),
      courtyardDoorMat
    );
    if (!midLockRail.name) midLockRail.name = 'familyRoom.southWall.midLockRail';
    midLockRail.position.set(0, -leafH / 2 + lowerPanelH, 0);
    midLockRail.castShadow = true;
    diningExtDoorObj.add(midLockRail);

    const topDoorRail = new THREE.Mesh(
      new THREE.BoxGeometry(leafW, 0.11, 0.056),
      courtyardDoorMat
    );
    if (!topDoorRail.name) topDoorRail.name = 'familyRoom.southWall.topDoorRail';
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
    if (!doorGlass.name) doorGlass.name = 'familyRoom.southWall.doorGlass';
    doorGlass.position.set(0, glassCenterY, 0);
    diningExtDoorObj.add(doorGlass);

    const vMuntin = new THREE.Mesh(
      new THREE.BoxGeometry(0.026, glassH, 0.036),
      courtyardDoorMat
    );
    if (!vMuntin.name) vMuntin.name = 'familyRoom.southWall.vMuntin';
    vMuntin.position.set(0, glassCenterY, 0);
    diningExtDoorObj.add(vMuntin);

    const hMuntin = new THREE.Mesh(
      new THREE.BoxGeometry(glassW, 0.026, 0.036),
      courtyardDoorMat
    );
    if (!hMuntin.name) hMuntin.name = 'familyRoom.southWall.hMuntin';
    hMuntin.position.set(0, glassCenterY, 0);
    diningExtDoorObj.add(hMuntin);

    // Brass lever handle & lock escutcheon at lock rail height on both faces
    const handlePlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.042, 0.15, 0.072),
      brassMat
    );
    if (!handlePlate.name) handlePlate.name = 'familyRoom.southWall.handlePlate';
    handlePlate.position.set(leafW / 2 - 0.06, -0.04, 0);
    diningExtDoorObj.add(handlePlate);

    for (const hz of [-0.052, 0.052] as const) {
      const lever = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.018, 0.018),
        brassMat
      );
      if (!lever.name) lever.name = 'familyRoom.southWall.lever';
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
    if (!extSill.name) extSill.name = 'familyRoom.southWall.extSill';
    extSill.position.set(diningWinCenterX, sillY - 0.02, 2.5775);
    southCutGroup.add(extSill);

    const intSill = new THREE.Mesh(
      new THREE.BoxGeometry(diningWinWidth + 0.08, 0.03, 0.18),
      skirtingMat
    );
    if (!intSill.name) intSill.name = 'familyRoom.southWall.intSill';
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
      if (!revealJamb.name) revealJamb.name = 'familyRoom.southWall.revealJamb';
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
    if (!revealHead.name) revealHead.name = 'familyRoom.southWall.revealHead';
    revealHead.position.set(diningWinCenterX, headY - 0.005, 2.4225);
    revealHead.receiveShadow = true;
    southCutGroup.add(revealHead);

    for (let i = 0; i <= 3; i++) {
      const mx = diningWinLeft + (i / 3) * diningWinWidth;
      const mullion = new THREE.Mesh(
        new THREE.BoxGeometry(0.045, winH, 0.11),
        windowFrameMat
      );
      if (!mullion.name) mullion.name = 'familyRoom.southWall.mullion';
      mullion.position.set(mx, cy, 2.49);
      southCutGroup.add(mullion);
    }
    for (const ry of [sillY + 0.027, sillY + winH * 0.52, headY - 0.027]) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(diningWinWidth, 0.04, 0.1),
        windowFrameMat
      );
      if (!rail.name) rail.name = 'familyRoom.southWall.rail';
      rail.position.set(diningWinCenterX, ry, 2.49);
      southCutGroup.add(rail);
    }
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(diningWinWidth - 0.06, winH - 0.08, 0.016),
      windowGlassMat
    );
    if (!glass.name) glass.name = 'familyRoom.southWall.glass';
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

}
