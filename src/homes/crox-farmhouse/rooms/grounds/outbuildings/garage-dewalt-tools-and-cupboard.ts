import * as THREE from 'three';
import { createBrushedStainlessSteelMaterial } from './shared-geometry-and-materials.ts';
import type { SceneBuilderContext } from '../../../../../engine/viewer/scene-types.ts';

let cachedDeWaltLogoTexture: THREE.CanvasTexture | null = null;

/**
 * Generates a crisp DeWALT black-and-yellow brand badge texture (`#febd17` & `#141619`).
 */
export function createDeWaltLogoTexture(): THREE.CanvasTexture {
  if (cachedDeWaltLogoTexture) return cachedDeWaltLogoTexture;
  const w = 256;
  const h = 96;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#febd17';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#141619';
  ctx.fillRect(10, 10, w - 20, h - 20);

  ctx.fillStyle = '#febd17';
  ctx.fillRect(16, 16, w - 32, 5);
  ctx.fillRect(16, h - 21, w - 32, 5);

  ctx.font = '900 40px Impact, Arial Black, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('DeWALT', w * 0.5, h * 0.5 + 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedDeWaltLogoTexture = tex;
  return tex;
}


let cachedDeWaltBatteryDecalTexture: THREE.CanvasTexture | null = null;

/**
 * Generates and memoizes a DeWALT 18V XR 5.0Ah Li-Ion battery side decal texture.
 */
export function createDeWaltBatteryDecalTexture(): THREE.CanvasTexture {
  if (cachedDeWaltBatteryDecalTexture) return cachedDeWaltBatteryDecalTexture;
  const battDecalCanvas = document.createElement('canvas');
  battDecalCanvas.width = 256;
  battDecalCanvas.height = 96;
  const bCtx = battDecalCanvas.getContext('2d');
  if (bCtx) {
    bCtx.fillStyle = '#181a1d';
    bCtx.fillRect(0, 0, 256, 96);
    bCtx.fillStyle = '#febd17';
    bCtx.fillRect(0, 0, 256, 26);
    bCtx.fillStyle = '#111315';
    bCtx.font = 'bold 18px sans-serif';
    bCtx.fillText('DeWALT  XR', 12, 19);
    bCtx.fillStyle = '#febd17';
    bCtx.font = 'bold 30px sans-serif';
    bCtx.fillText('18V', 12, 62);
    bCtx.fillStyle = '#ffffff';
    bCtx.font = 'bold 22px sans-serif';
    bCtx.fillText('5.0Ah LI-ION', 82, 60);
    bCtx.fillStyle = '#d32f2f';
    bCtx.fillRect(12, 74, 232, 8);
  }
  const battDecalTex = new THREE.CanvasTexture(battDecalCanvas);
  battDecalTex.colorSpace = THREE.SRGBColorSpace;
  cachedDeWaltBatteryDecalTexture = battDecalTex;
  return battDecalTex;
}

/**
 * Builds the Double Stainless-Steel Full-Height Utility & Workshop Storage Cupboard
 * (`outbuildings.garage.toolBench.tallCupboard`) with 5-tier shelved paint/hardware storage,
 * full-height ladder/tool compartment, and interactive outward-opening doors.
 */
export function buildGarageTallStorageCupboard(
  benchGroup: THREE.Group,
  ctx?: SceneBuilderContext
): THREE.Group {
  const anthraciteSteelMat = new THREE.MeshStandardMaterial({
    color: 0x22262c,
    roughness: 0.38,
    metalness: 0.68,
  });
  const brushedStainlessMat = createBrushedStainlessSteelMaterial();
  const aluminumTrimMat = new THREE.MeshStandardMaterial({
    color: 0xe0e5ec,
    roughness: 0.2,
    metalness: 0.92,
  });
  const butcherEdgeMat = new THREE.MeshStandardMaterial({
    color: 0x9e6b3b,
    roughness: 0.42,
    metalness: 0.04,
  });
  const dewaltYellowMat = new THREE.MeshStandardMaterial({
    color: 0xfebd17,
    roughness: 0.3,
    metalness: 0.16,
  });
  const dewaltBlackMat = new THREE.MeshStandardMaterial({
    color: 0x181a1d,
    roughness: 0.74,
    metalness: 0.12,
  });
  const rockerSwitchMat = new THREE.MeshStandardMaterial({
    color: 0xd32f2f,
    roughness: 0.35,
    metalness: 0.15,
  });
  const ledStripMat = new THREE.MeshStandardMaterial({
    color: 0xf4f9ff,
    emissive: new THREE.Color(0xd8eeff),
    emissiveIntensity: 2.6,
    roughness: 0.16,
  });

  const tallCupboardW = 1.52;
  const tallCupboardCenterX = 0.515 + tallCupboardW * 0.5;
  const tallCupboardH = 2.16;
  const benchD = 0.74;
  const frontZ = -benchD * 0.5 + 0.012;

  // 2. Issue #2 & Issue #3: Double Stainless-Steel Full-Height Utility & Workshop Storage Cupboard
  //    (`outbuildings.garage.toolBench.tallCupboard`, `localX = +0.515m..+2.035m`, `v = 1.34m..2.86m`, `h = 2.16m`)
  //    - Left/South Bay (`localX = +0.535m..+1.265m`): 5-Tier Heavy-Duty Shelving for Paint Tins, Rollers, Aerosols & Bins
  //    - Right/North Bay (`localX = +1.285m..+2.015m`): Full-Height Storage for Step Ladder, Extension Ladder, Spirit Level & Broom
  //    - Issue #3 ("These shuld open outwards and match the same style as the drawers"):
  //      Dark-anthracite steel outer carcass & 22mm vertical frame stiles with flush Brushed 304 Stainless-Steel
  //      doors, anodized-aluminum pull bars with black grip/label inlays, cylinder key locks, and outward (-Z) hinge swing!
  // ---------------------------------------------------------------------------
  const tallCupboardGroup = new THREE.Group();
  tallCupboardGroup.name = 'outbuildings.garage.toolBench.tallCupboard';
  tallCupboardGroup.position.set(tallCupboardCenterX, 0, 0);
  benchGroup.add(tallCupboardGroup);

  const tcWallT = 0.022;
  const tcPlinthH = 0.05;
  const tcTopCapH = 0.032;
  const tcInnerH = tallCupboardH - tcPlinthH - tcTopCapH;
  const tcInnerBaseY = tcPlinthH;
  const tcInnerTopY = tallCupboardH - tcTopCapH;

  // Recessed dark-anthracite plinth matching the workbench plinth (`h = 0.05m`)
  const tcPlinth = new THREE.Mesh(
    new THREE.BoxGeometry(tallCupboardW - 0.02, tcPlinthH, benchD - 0.08),
    dewaltBlackMat
  );
  tcPlinth.name = 'outbuildings.garage.toolBench.tallCupboard.plinth';
  tcPlinth.position.set(0, tcPlinthH * 0.5, 0.02);
  tallCupboardGroup.add(tcPlinth);

  // Dark-anthracite steel cabinet carcass (back wall, top cap, bottom deck, left/right outer walls, central divider)
  // matching the lower drawer bank carcass (`anthraciteSteelMat`)
  const tcBackWall = new THREE.Mesh(
    new THREE.BoxGeometry(tallCupboardW, tallCupboardH - tcPlinthH, tcWallT),
    anthraciteSteelMat
  );
  tcBackWall.name = 'outbuildings.garage.toolBench.tallCupboard.backWall';
  tcBackWall.position.set(0, tcPlinthH + (tallCupboardH - tcPlinthH) * 0.5, benchD * 0.5 - tcWallT * 0.5);
  tcBackWall.castShadow = true;
  tcBackWall.receiveShadow = true;
  tallCupboardGroup.add(tcBackWall);

  const tcBottomDeck = new THREE.Mesh(
    new THREE.BoxGeometry(tallCupboardW - tcWallT * 2, tcWallT, benchD - 0.03),
    brushedStainlessMat
  );
  tcBottomDeck.name = 'outbuildings.garage.toolBench.tallCupboard.bottomDeck';
  tcBottomDeck.position.set(0, tcPlinthH + tcWallT * 0.5, 0.005);
  tcBottomDeck.receiveShadow = true;
  tallCupboardGroup.add(tcBottomDeck);

  const tcTopCap = new THREE.Mesh(
    new THREE.BoxGeometry(tallCupboardW, tcTopCapH, benchD - 0.02),
    anthraciteSteelMat
  );
  tcTopCap.name = 'outbuildings.garage.toolBench.tallCupboard.topCap';
  tcTopCap.position.set(0, tallCupboardH - tcTopCapH * 0.5, 0.01);
  tcTopCap.castShadow = true;
  tallCupboardGroup.add(tcTopCap);

  // Left (`-0.749m`), Center Divider (`0.0m`), and Right (`+0.749m`) vertical carcass walls + 22mm dark-anthracite front stiles
  for (const wallX of [-tallCupboardW * 0.5 + tcWallT * 0.5, 0, tallCupboardW * 0.5 - tcWallT * 0.5] as const) {
    const vWall = new THREE.Mesh(
      new THREE.BoxGeometry(tcWallT, tcInnerH, benchD - 0.04),
      anthraciteSteelMat
    );
    vWall.name = 'outbuildings.garage.toolBench.tallCupboard.carcassWall';
    vWall.position.set(wallX, tcInnerBaseY + tcInnerH * 0.5, 0.01);
    vWall.castShadow = true;
    vWall.receiveShadow = true;
    tallCupboardGroup.add(vWall);

    const frontStile = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, tallCupboardH - tcPlinthH, 0.016),
      anthraciteSteelMat
    );
    frontStile.name = 'outbuildings.garage.toolBench.tallCupboard.frontStile';
    frontStile.position.set(wallX, tcPlinthH + (tallCupboardH - tcPlinthH) * 0.5, frontZ + 0.004);
    tallCupboardGroup.add(frontStile);
  }

  // Interior LED strip lights along the top of both compartments
  for (const compX of [-tallCupboardW * 0.25, tallCupboardW * 0.25] as const) {
    const innerLed = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.012, 0.028),
      ledStripMat
    );
    innerLed.name = 'outbuildings.garage.toolBench.tallCupboard.innerLedStrip';
    innerLed.userData.lodTier = 'high';
    innerLed.userData.lodMaxDistance = 12;
    innerLed.position.set(compX, tcInnerTopY - 0.01, -0.12);
    tallCupboardGroup.add(innerLed);
  }

  // ---------------------------------------------------------------------------
  // 2A. Left / South Compartment (`compX = -0.375m`): 5-Tier Shelved Storage for Paint, Rollers, Oil & Hardware
  // ---------------------------------------------------------------------------
  const leftBayX = -tallCupboardW * 0.25; // -0.38m
  const shelfW = tallCupboardW * 0.5 - tcWallT * 1.6; // ~0.72m
  const shelfD = benchD - 0.08; // 0.66m
  const shelfHeights = [0.48, 0.88, 1.28, 1.68] as const;

  for (const sy of shelfHeights) {
    const shelfMesh = new THREE.Mesh(
      new THREE.BoxGeometry(shelfW, 0.022, shelfD),
      brushedStainlessMat
    );
    shelfMesh.name = 'outbuildings.garage.toolBench.tallCupboard.shelf';
    shelfMesh.position.set(leftBayX, sy, 0.02);
    shelfMesh.castShadow = true;
    shelfMesh.receiveShadow = true;
    tallCupboardGroup.add(shelfMesh);
  }

  const paintWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf4f3ee, roughness: 0.35, metalness: 0.1 });
  const paintSageMat = new THREE.MeshStandardMaterial({ color: 0x6f8271, roughness: 0.38, metalness: 0.12 });
  const paintNavyMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.36, metalness: 0.15 });
  const paintOchreMat = new THREE.MeshStandardMaterial({ color: 0xd9822b, roughness: 0.38, metalness: 0.12 });
  const paintCrimsonMat = new THREE.MeshStandardMaterial({ color: 0xb83227, roughness: 0.36, metalness: 0.14 });
  const wd40BlueMat = new THREE.MeshStandardMaterial({ color: 0x0055a5, roughness: 0.28, metalness: 0.35 });

  // Tier 1 (Floor Deck `y = 0.08m`): Three large 5L & 2.5L Trade Paint Buckets + Paint Roller Tray & Roller
  for (const [px, pz, r, h, lidMat] of [
    [leftBayX - 0.21, -0.06, 0.105, 0.24, paintWhiteMat],
    [leftBayX + 0.02, -0.08, 0.105, 0.24, paintSageMat],
    [leftBayX - 0.09, 0.15, 0.095, 0.22, paintNavyMat],
  ] as const) {
    const bucketBody = new THREE.Mesh(
      new THREE.CylinderGeometry(r, r * 0.92, h, 18),
      paintWhiteMat
    );
    bucketBody.name = 'outbuildings.garage.toolBench.tallCupboard.paintTin';
    bucketBody.position.set(px, tcPlinthH + tcWallT + h * 0.5, pz);
    bucketBody.castShadow = true;
    tallCupboardGroup.add(bucketBody);

    const colorBand = new THREE.Mesh(
      new THREE.CylinderGeometry(r + 0.002, r * 0.96 + 0.002, h * 0.42, 18),
      lidMat
    );
    colorBand.name = 'outbuildings.garage.toolBench.tallCupboard.paintBucketBand';
    colorBand.userData.lodTier = 'high';
    colorBand.userData.lodMaxDistance = 12;
    colorBand.position.set(px, tcPlinthH + tcWallT + h * 0.55, pz);
    tallCupboardGroup.add(colorBand);

    const rimLid = new THREE.Mesh(
      new THREE.CylinderGeometry(r + 0.004, r + 0.004, 0.016, 18),
      aluminumTrimMat
    );
    rimLid.name = 'outbuildings.garage.toolBench.tallCupboard.paintBucketLid';
    rimLid.userData.lodTier = 'high';
    rimLid.userData.lodMaxDistance = 12;
    rimLid.position.set(px, tcPlinthH + tcWallT + h + 0.006, pz);
    tallCupboardGroup.add(rimLid);
  }

  // Paint roller tray & yellow/white sheepskin roller on right side of Tier 1
  const rollerTray = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.055, 0.34),
    dewaltBlackMat
  );
  rollerTray.name = 'outbuildings.garage.toolBench.tallCupboard.paintRollerTray';
  rollerTray.userData.lodTier = 'high';
  rollerTray.userData.lodMaxDistance = 12;
  rollerTray.position.set(leftBayX + 0.22, tcPlinthH + tcWallT + 0.028, 0.02);
  tallCupboardGroup.add(rollerTray);

  const rollerSleeve = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.028, 0.18, 14),
    paintWhiteMat
  );
  rollerSleeve.name = 'outbuildings.garage.toolBench.tallCupboard.paintRollerSleeve';
  rollerSleeve.userData.lodTier = 'high';
  rollerSleeve.userData.lodMaxDistance = 12;
  rollerSleeve.rotation.z = Math.PI / 2;
  rollerSleeve.position.set(leftBayX + 0.22, tcPlinthH + tcWallT + 0.072, -0.04);
  tallCupboardGroup.add(rollerSleeve);

  // Tier 2 (`y = 0.48m`): Six 1L Metal Decorator Paint & Wood-Varnish Tins + Brushes
  for (const [tIdx, tx, tz, tinMat] of [
    [0, leftBayX - 0.24, -0.10, paintSageMat],
    [1, leftBayX - 0.08, -0.10, paintOchreMat],
    [2, leftBayX + 0.08, -0.10, paintNavyMat],
    [3, leftBayX + 0.24, -0.10, paintCrimsonMat],
    [4, leftBayX - 0.16, 0.08, paintWhiteMat],
    [5, leftBayX + 0.02, 0.08, butcherEdgeMat],
  ] as const) {
    const tinH = 0.145 - (tIdx % 2) * 0.015;
    const tinR = 0.058;
    const tinCan = new THREE.Mesh(
      new THREE.CylinderGeometry(tinR, tinR, tinH, 16),
      aluminumTrimMat
    );
    tinCan.name = 'outbuildings.garage.toolBench.tallCupboard.paintTin';
    tinCan.position.set(tx, 0.49 + tinH * 0.5, tz);
    tinCan.castShadow = true;
    tallCupboardGroup.add(tinCan);

    const tinLabel = new THREE.Mesh(
      new THREE.CylinderGeometry(tinR + 0.0015, tinR + 0.0015, tinH * 0.58, 16),
      tinMat
    );
    tinLabel.name = 'outbuildings.garage.toolBench.tallCupboard.paintTinLabel';
    tinLabel.userData.lodTier = 'high';
    tinLabel.userData.lodMaxDistance = 12;
    tinLabel.position.set(tx, 0.49 + tinH * 0.5, tz);
    tallCupboardGroup.add(tinLabel);
  }

  // Tier 3 (`y = 0.88m`): WD-40 Aerosol Cans, Silicone Spray, 5L Golden Motor Oil Jug & Masking Tape Rolls
  for (const [ax, az, aMat, capMat] of [
    [leftBayX - 0.25, -0.12, wd40BlueMat, rockerSwitchMat],
    [leftBayX - 0.16, -0.12, wd40BlueMat, rockerSwitchMat],
    [leftBayX - 0.07, -0.12, dewaltBlackMat, dewaltYellowMat],
    [leftBayX + 0.02, -0.12, paintCrimsonMat, paintWhiteMat],
  ] as const) {
    const canCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.165, 14),
      aMat
    );
    canCyl.name = 'outbuildings.garage.toolBench.tallCupboard.aerosolCan';
    canCyl.userData.lodTier = 'high';
    canCyl.userData.lodMaxDistance = 12;
    canCyl.position.set(ax, 0.89 + 0.0825, az);
    tallCupboardGroup.add(canCyl);

    const canCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.031, 0.031, 0.042, 14),
      capMat
    );
    canCap.name = 'outbuildings.garage.toolBench.tallCupboard.aerosolCanCap';
    canCap.userData.lodTier = 'high';
    canCap.userData.lodMaxDistance = 12;
    canCap.position.set(ax, 0.89 + 0.186, az);
    tallCupboardGroup.add(canCap);
  }

  const oilJug = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.24, 0.19),
    dewaltYellowMat
  );
  oilJug.name = 'outbuildings.garage.toolBench.tallCupboard.motorOilJug';
  oilJug.userData.lodTier = 'high';
  oilJug.userData.lodMaxDistance = 12;
  oilJug.position.set(leftBayX + 0.20, 0.89 + 0.12, -0.04);
  tallCupboardGroup.add(oilJug);

  for (let tapeIdx = 0; tapeIdx < 3; tapeIdx++) {
    const tapeRoll = new THREE.Mesh(
      new THREE.TorusGeometry(0.048, 0.016, 10, 18),
      tapeIdx === 0 ? wd40BlueMat : paintWhiteMat
    );
    tapeRoll.name = 'outbuildings.garage.toolBench.tallCupboard.maskingTapeRoll';
    tapeRoll.userData.lodTier = 'high';
    tapeRoll.userData.lodMaxDistance = 12;
    tapeRoll.rotation.x = Math.PI / 2;
    tapeRoll.position.set(leftBayX - 0.12, 0.91 + tapeIdx * 0.032, 0.10);
    tallCupboardGroup.add(tapeRoll);
  }

  // Tier 4 (`y = 1.28m`): 3 Modular Workshop Parts & Fastener Storage Bins
  for (const [bIdx, bx] of [
    [0, leftBayX - 0.22],
    [1, leftBayX],
    [2, leftBayX + 0.22],
  ] as const) {
    const binBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.19, 0.18, 0.36),
      bIdx === 1 ? dewaltYellowMat : rockerSwitchMat
    );
    binBox.name = 'outbuildings.garage.toolBench.tallCupboard.storageBin';
    binBox.position.set(bx, 1.29 + 0.09, -0.02);
    binBox.castShadow = true;
    tallCupboardGroup.add(binBox);
  }

  // Tier 5 (`y = 1.68m`): 2 Heavy-Duty Lidded Polypropylene Bulk Storage Crates
  for (const cx of [leftBayX - 0.16, leftBayX + 0.16] as const) {
    const crateBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.29, 0.22, 0.42),
      dewaltBlackMat
    );
    crateBox.name = 'outbuildings.garage.toolBench.tallCupboard.bulkCrateBox';
    crateBox.position.set(cx, 1.69 + 0.11, -0.01);
    tallCupboardGroup.add(crateBox);

    const crateLid = new THREE.Mesh(
      new THREE.BoxGeometry(0.30, 0.024, 0.43),
      dewaltYellowMat
    );
    crateLid.name = 'outbuildings.garage.toolBench.tallCupboard.bulkCrateLid';
    crateLid.position.set(cx, 1.69 + 0.23, -0.01);
    tallCupboardGroup.add(crateLid);
  }

  // ---------------------------------------------------------------------------
  // 2B. Right / North Compartment (`compX = +0.38m`): Full-Height Storage for Ladders, Levels & Long Tools
  // ---------------------------------------------------------------------------
  const rightBayX = tallCupboardW * 0.25; // +0.38m

  // 1) Folding Aluminium 6-Step A-Frame Workshop Step Ladder (`outbuildings.garage.toolBench.tallCupboard.stepLadder`)
  const stepLadderGroup = new THREE.Group();
  stepLadderGroup.name = 'outbuildings.garage.toolBench.tallCupboard.stepLadder';
  stepLadderGroup.position.set(rightBayX + 0.14, tcPlinthH + tcWallT, 0.02);
  stepLadderGroup.rotation.z = 0.07; // Leaned neatly inside the right compartment
  tallCupboardGroup.add(stepLadderGroup);

  const ladderH = 1.82;
  const ladderSpanZ = 0.38;
  for (const sz of [-1, 1] as const) {
    const frontStile = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, ladderH, 0.052),
      aluminumTrimMat
    );
    frontStile.name = 'outbuildings.garage.toolBench.tallCupboard.stepLadder.frontStile';
    frontStile.position.set(-0.04, ladderH * 0.5, sz * (ladderSpanZ * 0.5));
    frontStile.castShadow = true;
    stepLadderGroup.add(frontStile);

    const rearLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, ladderH * 0.94, 0.038),
      aluminumTrimMat
    );
    rearLeg.name = 'outbuildings.garage.toolBench.tallCupboard.stepLadder.rearLeg';
    rearLeg.position.set(0.05, (ladderH * 0.94) * 0.5, sz * (ladderSpanZ * 0.46));
    stepLadderGroup.add(rearLeg);

    // Non-slip black/yellow rubber feet
    const footCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.036, 0.06),
      dewaltYellowMat
    );
    footCap.name = 'outbuildings.garage.toolBench.tallCupboard.stepLadder.rubberFootCap';
    footCap.userData.lodTier = 'high';
    footCap.userData.lodMaxDistance = 12;
    footCap.position.set(-0.04, 0.018, sz * (ladderSpanZ * 0.5));
    stepLadderGroup.add(footCap);
  }

  // 6 Ribbed Aluminium Treads + Top Yellow Platform Cap
  for (let r = 0; r < 6; r++) {
    const ry = 0.24 + r * 0.25;
    const stepTread = new THREE.Mesh(
      new THREE.BoxGeometry(0.085, 0.018, ladderSpanZ - 0.02),
       r === 5 ? dewaltYellowMat : aluminumTrimMat
    );
    stepTread.name = 'outbuildings.garage.toolBench.tallCupboard.stepLadder.tread';
    stepTread.position.set(-0.02, ry, 0);
    stepLadderGroup.add(stepTread);
  }

  // 2) 2-Section Telescopic Aluminium Extension Ladder (`outbuildings.garage.toolBench.tallCupboard.extensionLadder`)
  const extLadderGroup = new THREE.Group();
  extLadderGroup.name = 'outbuildings.garage.toolBench.tallCupboard.extensionLadder';
  extLadderGroup.position.set(rightBayX - 0.14, tcPlinthH + tcWallT, 0.06);
  tallCupboardGroup.add(extLadderGroup);

  const extLadderH = 1.94;
  for (const sx of [-0.14, 0.14] as const) {
    const stileRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, extLadderH, 0.064),
      aluminumTrimMat
    );
    stileRail.name = 'outbuildings.garage.toolBench.tallCupboard.extensionLadder.stileRail';
    stileRail.position.set(sx, extLadderH * 0.5, 0);
    stileRail.castShadow = true;
    extLadderGroup.add(stileRail);

    const stabilizerCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.038, 0.04, 0.076),
      rockerSwitchMat
    );
    stabilizerCap.name = 'outbuildings.garage.toolBench.tallCupboard.extensionLadder.stabilizerCap';
    stabilizerCap.userData.lodTier = 'high';
    stabilizerCap.userData.lodMaxDistance = 12;
    stabilizerCap.position.set(sx, 0.02, 0);
    extLadderGroup.add(stabilizerCap);
  }
  for (let rung = 0; rung < 7; rung++) {
    const rungMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.28, 10),
      aluminumTrimMat
    );
    rungMesh.name = 'outbuildings.garage.toolBench.tallCupboard.extensionLadder.rung';
    rungMesh.rotation.z = Math.PI / 2;
    rungMesh.position.set(0, 0.22 + rung * 0.26, 0);
    extLadderGroup.add(rungMesh);
  }

  // 3) Long Workshop Push Broom & 1200mm Box-Beam Spirit Level clipped in the front-left of the full-height bay
  const broomHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.013, 0.013, 1.56, 10),
    butcherEdgeMat
  );
  broomHandle.name = 'outbuildings.garage.toolBench.tallCupboard.pushBroomHandle';
  broomHandle.position.set(rightBayX - 0.25, tcPlinthH + 0.86, -0.14);
  tallCupboardGroup.add(broomHandle);

  const broomHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.065, 0.34),
    dewaltYellowMat
  );
  broomHead.name = 'outbuildings.garage.toolBench.tallCupboard.pushBroomHead';
  broomHead.position.set(rightBayX - 0.25, tcPlinthH + 0.055, -0.14);
  tallCupboardGroup.add(broomHead);

  const tallLevel = new THREE.Mesh(
    new THREE.BoxGeometry(0.026, 1.22, 0.058),
    dewaltYellowMat
  );
  tallLevel.name = 'outbuildings.garage.toolBench.tallCupboard.boxBeamSpiritLevel';
  tallLevel.position.set(rightBayX - 0.29, tcPlinthH + 0.64, 0.12);
  tallCupboardGroup.add(tallLevel);

  // ---------------------------------------------------------------------------
  // 2C. Two Interactive Full-Height Brushed 304 Stainless-Steel Doors (`doorLeft` & `doorRight`)
  //     - Issue #3 ("These shuld open outwards and match the same style as the drawers"):
  //       Flush Brushed 304 Stainless-Steel slabs (`brushedStainlessMat`) with anodized-aluminum pull bars,
  //       dark-anthracite grip/label inlay strips, cylinder key locks, and outward (`-Z`) hinge swing!
  // ---------------------------------------------------------------------------
  const tcDoorW = tallCupboardW * 0.5 - 0.024; // 0.736m each
  const tcDoorH = tallCupboardH - tcPlinthH - tcTopCapH - 0.008; // 2.070m tall
  const tcDoorCenterY = tcPlinthH + tcDoorH * 0.5 + 0.004;
  const tcDoorT = 0.02;

  for (const [sideSign, doorName] of [
    [-1, 'outbuildings.garage.toolBench.tallCupboard.doorLeft'],
    [1, 'outbuildings.garage.toolBench.tallCupboard.doorRight'],
  ] as const) {
    const doorCX = sideSign * (tcDoorW * 0.5 + 0.006);
    const doorGroup = new THREE.Group();
    doorGroup.name = doorName;
    doorGroup.position.set(doorCX, tcDoorCenterY, frontZ);
    tallCupboardGroup.add(doorGroup);

    const doorSlab = new THREE.Mesh(
      new THREE.BoxGeometry(tcDoorW, tcDoorH, tcDoorT),
      brushedStainlessMat
    );
    doorSlab.name = 'outbuildings.garage.toolBench.drawer';
    doorSlab.castShadow = true;
    doorSlab.receiveShadow = true;
    doorGroup.add(doorSlab);

    // Matching anodized-aluminum pull bar with black grip/label inlay strip near the center meeting stile
    const handleOffsetX = -sideSign * (tcDoorW * 0.5 - 0.042);
    const tallHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.36, 0.026),
      aluminumTrimMat
    );
    tallHandle.name = 'outbuildings.garage.toolBench.tallCupboard.doorPullHandle';
    tallHandle.userData.lodTier = 'high';
    tallHandle.userData.lodMaxDistance = 12;
    tallHandle.position.set(handleOffsetX, -0.10, -0.012);
    doorGroup.add(tallHandle);

    const handleLabelStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.007, 0.16, 0.004),
      dewaltBlackMat
    );
    handleLabelStrip.name = 'outbuildings.garage.toolBench.tallCupboard.doorLabelStrip';
    handleLabelStrip.userData.lodTier = 'high';
    handleLabelStrip.userData.lodMaxDistance = 12;
    handleLabelStrip.position.set(handleOffsetX, -0.10, -0.025);
    doorGroup.add(handleLabelStrip);

    // Cylinder key lock above handle matching the drawer stacks
    const doorLock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.026, 12),
      aluminumTrimMat
    );
    doorLock.name = 'outbuildings.garage.toolBench.tallCupboard.doorKeyLock';
    doorLock.userData.lodTier = 'high';
    doorLock.userData.lodMaxDistance = 12;
    doorLock.rotation.x = Math.PI / 2;
    doorLock.position.set(handleOffsetX, 0.14, -0.004);
    doorGroup.add(doorLock);

    // Register interactive hinged door so clicking swings it OUTWARDS (`-Z` in `benchGroup`) into the Garage!
    if (ctx) {
      const hingeOffsetX = sideSign * (tcDoorW * 0.5 - 0.012);
      ctx.interactions.registerHingedDoor(
        tallCupboardGroup,
        doorGroup,
        new THREE.Vector3(hingeOffsetX, 0, -0.008),
        'y',
        -sideSign * Math.PI * 0.62
      );
    }
  }


  return tallCupboardGroup;
}

/**
 * Builds the DeWALT 18V XR / 54V FLEXVOLT power tools and pegboard hand-tool suite
 * across the East-Wall Workbench and South-Wing Workstation.
 */
export function buildGarageDeWaltPowerTools(
  benchGroup: THREE.Group,
  southWingGroup: THREE.Group
): void {
  const aluminumTrimMat = new THREE.MeshStandardMaterial({
    color: 0xe0e5ec,
    roughness: 0.2,
    metalness: 0.92,
  });
  const dewaltYellowMat = new THREE.MeshStandardMaterial({
    color: 0xfebd17,
    roughness: 0.3,
    metalness: 0.16,
  });
  const dewaltBlackMat = new THREE.MeshStandardMaterial({
    color: 0x181a1d,
    roughness: 0.74,
    metalness: 0.12,
  });
  const dewaltBadgeMat = new THREE.MeshStandardMaterial({
    map: createDeWaltLogoTexture(),
    roughness: 0.28,
    metalness: 0.15,
  });
  const castAluminumMat = new THREE.MeshStandardMaterial({
    color: 0xc8cfd8,
    roughness: 0.28,
    metalness: 0.85,
  });
  const greenLedMat = new THREE.MeshStandardMaterial({
    color: 0x00e676,
    emissive: new THREE.Color(0x00e676),
    emissiveIntensity: 1.8,
    roughness: 0.2,
  });
  const clearShieldMat = new THREE.MeshStandardMaterial({
    color: 0xe8f4f8,
    roughness: 0.12,
    metalness: 0.05,
    transparent: true,
    opacity: 0.48,
  });
  const dewaltBattDecalMat = new THREE.MeshStandardMaterial({
    map: createDeWaltBatteryDecalTexture(),
    roughness: 0.32,
    metalness: 0.12,
  });
  const benchD = 0.74;
  const cabinetH = 0.86;
  const topT = 0.052;
  const worktopY = cabinetH + topT;

  const redAccentMat = new THREE.MeshStandardMaterial({
    color: 0xd32f2f,
    roughness: 0.35,
    metalness: 0.15,
  });
  const hssSteelBitMat = new THREE.MeshStandardMaterial({
    color: 0xdce2e8,
    roughness: 0.18,
    metalness: 0.92,
  });
  const blackOxideBitMat = new THREE.MeshStandardMaterial({
    color: 0x22262b,
    roughness: 0.28,
    metalness: 0.85,
  });
  const worklightLedMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0xe3f2fd),
    emissiveIntensity: 1.8,
    roughness: 0.15,
  });

  // B. DeWALT DWS780 305mm Double-Bevel Sliding Compound Mitre Saw (`x = -0.82m, z = -0.02m`)
  const sawGroup = new THREE.Group();
  sawGroup.name = 'outbuildings.garage.toolBench.mitreSaw';
  sawGroup.position.set(-0.82, worktopY, -0.02);
  benchGroup.add(sawGroup);

  const sawBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.24, 0.048, 28),
    castAluminumMat
  );
  sawBase.name = 'outbuildings.garage.toolBench.mitreSaw.rotaryBase';
  sawBase.position.set(0, 0.024, 0);
  sawBase.castShadow = true;
  sawGroup.add(sawBase);

  // Mitre detents scale ring & red pointer at front of rotary table
  const mitreScaleRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.232, 0.236, 0.012, 28, 1, false, Math.PI * 0.6, Math.PI * 0.8),
    dewaltBlackMat
  );
  mitreScaleRing.name = 'outbuildings.garage.toolBench.mitreSaw.mitreScaleRing';
  mitreScaleRing.userData.lodTier = 'high';
  mitreScaleRing.userData.lodMaxDistance = 12;
  mitreScaleRing.position.set(0, 0.038, 0);
  sawGroup.add(mitreScaleRing);

  for (const sideX of [-1, 1] as const) {
    const extWing = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.044, 0.16),
      castAluminumMat
    );
    extWing.name = 'outbuildings.garage.toolBench.mitreSaw.extensionWing';
    extWing.position.set(sideX * 0.25, 0.022, 0.02);
    extWing.castShadow = true;
    sawGroup.add(extWing);

    // Sliding workpiece support rails extending from side wings
    for (const rz of [-0.04, 0.08] as const) {
      const extRail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.006, 0.09, 10),
        hssSteelBitMat
      );
      extRail.name = 'outbuildings.garage.toolBench.mitreSaw.supportRail';
      extRail.userData.lodTier = 'high';
      extRail.userData.lodMaxDistance = 12;
      extRail.rotation.z = Math.PI / 2;
      extRail.position.set(sideX * 0.32, 0.026, rz);
      sawGroup.add(extRail);
    }
  }

  const kerfPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.056, 0.004, 0.34),
    dewaltYellowMat
  );
  kerfPlate.name = 'outbuildings.garage.toolBench.mitreSaw.kerfPlate';
  kerfPlate.userData.lodTier = 'high';
  kerfPlate.userData.lodMaxDistance = 12;
  kerfPlate.position.set(0, 0.049, -0.02);
  sawGroup.add(kerfPlate);

  const kerfSlot = new THREE.Mesh(
    new THREE.BoxGeometry(0.006, 0.005, 0.29),
    dewaltBlackMat
  );
  kerfSlot.name = 'outbuildings.garage.toolBench.mitreSaw.kerfSlot';
  kerfSlot.userData.lodTier = 'high';
  kerfSlot.userData.lodMaxDistance = 12;
  kerfSlot.position.set(0, 0.05, -0.02);
  sawGroup.add(kerfSlot);

  const mitreArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.068, 0.032, 0.16),
    castAluminumMat
  );
  mitreArm.name = 'outbuildings.garage.toolBench.mitreSaw.mitreArm';
  mitreArm.position.set(0, 0.026, -0.22);
  sawGroup.add(mitreArm);

  const mitreLockKnob = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.018, 0.055, 14),
    dewaltYellowMat
  );
  mitreLockKnob.name = 'outbuildings.garage.toolBench.mitreSaw.mitreLockKnob';
  mitreLockKnob.userData.lodTier = 'high';
  mitreLockKnob.userData.lodMaxDistance = 12;
  mitreLockKnob.rotation.x = Math.PI / 2;
  mitreLockKnob.position.set(0, 0.032, -0.31);
  sawGroup.add(mitreLockKnob);

  const mitreDetentTrigger = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, 0.018, 0.035),
    redAccentMat
  );
  mitreDetentTrigger.name = 'outbuildings.garage.toolBench.mitreSaw.mitreDetentTrigger';
  mitreDetentTrigger.userData.lodTier = 'high';
  mitreDetentTrigger.userData.lodMaxDistance = 12;
  mitreDetentTrigger.position.set(0, 0.048, -0.28);
  sawGroup.add(mitreDetentTrigger);

  const fenceBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 0.078, 0.032),
    dewaltBlackMat
  );
  fenceBar.name = 'outbuildings.garage.toolBench.mitreSaw.fenceBar';
  fenceBar.position.set(0, 0.086, 0.068);
  sawGroup.add(fenceBar);

  // Rear bevel quadrant arch & linear slide carriage pillar
  const bevelArch = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.085, 0.036, 20, 1, false, 0, Math.PI),
    castAluminumMat
  );
  bevelArch.name = 'outbuildings.garage.toolBench.mitreSaw.bevelArch';
  bevelArch.rotation.y = Math.PI / 2;
  bevelArch.position.set(0, 0.095, 0.185);
  sawGroup.add(bevelArch);

  // Hold-down material screw clamp on left fence
  const clampPost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.13, 10),
    dewaltBlackMat
  );
  clampPost.name = 'outbuildings.garage.toolBench.mitreSaw.clampPost';
  clampPost.userData.lodTier = 'high';
  clampPost.userData.lodMaxDistance = 12;
  clampPost.position.set(-0.18, 0.11, 0.09);
  sawGroup.add(clampPost);

  const clampArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.014, 0.095),
    castAluminumMat
  );
  clampArm.name = 'outbuildings.garage.toolBench.mitreSaw.clampArm';
  clampArm.userData.lodTier = 'high';
  clampArm.userData.lodMaxDistance = 12;
  clampArm.position.set(-0.18, 0.165, 0.05);
  sawGroup.add(clampArm);

  const clampPad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.01, 12),
    dewaltYellowMat
  );
  clampPad.name = 'outbuildings.garage.toolBench.mitreSaw.clampPad';
  clampPad.userData.lodTier = 'high';
  clampPad.userData.lodMaxDistance = 12;
  clampPad.position.set(-0.18, 0.13, 0.01);
  sawGroup.add(clampPad);

  for (const rx of [-0.036, 0.036]) {
    const slideRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.013, 0.013, 0.36, 14),
      hssSteelBitMat
    );
    slideRod.name = 'outbuildings.garage.toolBench.mitreSaw.slideRod';
    slideRod.rotation.x = Math.PI / 2;
    slideRod.position.set(rx, 0.175, 0.045);
    sawGroup.add(slideRod);
  }

  const railCarriage = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.062, 0.075),
    dewaltBlackMat
  );
  railCarriage.name = 'outbuildings.garage.toolBench.mitreSaw.railCarriage';
  railCarriage.position.set(0, 0.175, 0.19);
  sawGroup.add(railCarriage);

  const sawBlade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.145, 0.145, 0.005, 32),
    hssSteelBitMat
  );
  sawBlade.name = 'outbuildings.garage.toolBench.mitreSaw.sawBlade';
  sawBlade.rotation.z = Math.PI / 2;
  sawBlade.position.set(0, 0.2, -0.015);
  sawGroup.add(sawBlade);

  const bladeArborWasher = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.028, 0.014, 16),
    dewaltBlackMat
  );
  bladeArborWasher.name = 'outbuildings.garage.toolBench.mitreSaw.arborWasher';
  bladeArborWasher.userData.lodTier = 'high';
  bladeArborWasher.userData.lodMaxDistance = 12;
  bladeArborWasher.rotation.z = Math.PI / 2;
  bladeArborWasher.position.set(-0.006, 0.2, -0.015);
  sawGroup.add(bladeArborWasher);

  // XPS shadow cut-line LED module at front of upper blade guard
  const xpsLightModule = new THREE.Mesh(
    new THREE.BoxGeometry(0.032, 0.026, 0.042),
    dewaltBlackMat
  );
  xpsLightModule.name = 'outbuildings.garage.toolBench.mitreSaw.xpsLightModule';
  xpsLightModule.userData.lodTier = 'high';
  xpsLightModule.userData.lodMaxDistance = 12;
  xpsLightModule.position.set(0, 0.295, -0.15);
  sawGroup.add(xpsLightModule);

  const bladeGuard = new THREE.Mesh(
    new THREE.CylinderGeometry(0.158, 0.158, 0.044, 24, 1, false, 0, Math.PI * 1.22),
    dewaltYellowMat
  );
  bladeGuard.name = 'outbuildings.garage.toolBench.mitreSaw.upperBladeGuard';
  bladeGuard.rotation.z = Math.PI / 2;
  bladeGuard.position.set(0, 0.21, -0.015);
  bladeGuard.castShadow = true;
  sawGroup.add(bladeGuard);

  // Clear polycarbonate lower retracting blade guard
  const lowerClearGuard = new THREE.Mesh(
    new THREE.CylinderGeometry(0.152, 0.152, 0.036, 20, 1, false, Math.PI * 1.1, Math.PI * 0.85),
    clearShieldMat
  );
  lowerClearGuard.name = 'outbuildings.garage.toolBench.mitreSaw.lowerClearGuard';
  lowerClearGuard.rotation.z = Math.PI / 2;
  lowerClearGuard.position.set(0, 0.195, -0.015);
  sawGroup.add(lowerClearGuard);

  const sawBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.11, 0.042),
    dewaltBadgeMat
  );
  sawBadge.name = 'outbuildings.garage.toolBench.mitreSaw.brandBadge';
  sawBadge.userData.lodTier = 'high';
  sawBadge.userData.lodMaxDistance = 12;
  sawBadge.rotation.y = -Math.PI / 2;
  sawBadge.position.set(-0.024, 0.24, -0.015);
  sawGroup.add(sawBadge);

  const sawMotor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.062, 0.062, 0.16, 18),
    dewaltYellowMat
  );
  sawMotor.name = 'outbuildings.garage.toolBench.mitreSaw.motorHousing';
  sawMotor.rotation.z = Math.PI / 2;
  sawMotor.position.set(0.105, 0.245, -0.015);
  sawMotor.castShadow = true;
  sawGroup.add(sawMotor);

  const sawMotorEndCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.056, 0.045, 18),
    dewaltBlackMat
  );
  sawMotorEndCap.name = 'outbuildings.garage.toolBench.mitreSaw.motorEndCap';
  sawMotorEndCap.rotation.z = Math.PI / 2;
  sawMotorEndCap.position.set(0.195, 0.245, -0.015);
  sawGroup.add(sawMotorEndCap);

  // Ergonomic D-handle with red safety trigger switch
  const sawHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.048, 0.038, 0.15),
    dewaltBlackMat
  );
  sawHandle.name = 'outbuildings.garage.toolBench.mitreSaw.handleArm';
  sawHandle.position.set(0.02, 0.33, -0.09);
  sawHandle.rotation.x = 0.32;
  sawGroup.add(sawHandle);

  const dHandleLoop = new THREE.Mesh(
    new THREE.BoxGeometry(0.095, 0.028, 0.034),
    dewaltYellowMat
  );
  dHandleLoop.name = 'outbuildings.garage.toolBench.mitreSaw.dHandleGrip';
  dHandleLoop.position.set(0.02, 0.355, -0.155);
  sawGroup.add(dHandleLoop);

  const dHandleTrigger = new THREE.Mesh(
    new THREE.BoxGeometry(0.055, 0.014, 0.022),
    redAccentMat
  );
  dHandleTrigger.name = 'outbuildings.garage.toolBench.mitreSaw.safetyTrigger';
  dHandleTrigger.userData.lodTier = 'high';
  dHandleTrigger.userData.lodMaxDistance = 12;
  dHandleTrigger.position.set(0.02, 0.332, -0.145);
  sawGroup.add(dHandleTrigger);

  const dustBag = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.044, 0.16, 14),
    dewaltYellowMat
  );
  dustBag.name = 'outbuildings.garage.toolBench.mitreSaw.dustBag';
  dustBag.rotation.x = -Math.PI * 0.38;
  dustBag.position.set(0, 0.27, 0.16);
  sawGroup.add(dustBag);

  const dustNozzle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.024, 0.05, 12),
    dewaltBlackMat
  );
  dustNozzle.name = 'outbuildings.garage.toolBench.mitreSaw.dustNozzle';
  dustNozzle.userData.lodTier = 'high';
  dustNozzle.userData.lodMaxDistance = 12;
  dustNozzle.rotation.x = -Math.PI * 0.38;
  dustNozzle.position.set(0, 0.24, 0.09);
  sawGroup.add(dustNozzle);

  // C. DeWALT DW752 Heavy-Duty Twin-Wheel Bench Grinder (`x = -0.22m, z = -0.06m`)
  const grinderGroup = new THREE.Group();
  grinderGroup.name = 'outbuildings.garage.toolBench.benchGrinder';
  grinderGroup.position.set(-0.22, worktopY, -0.06);
  benchGroup.add(grinderGroup);

  const grinderPedestal = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.042, 0.15),
    dewaltBlackMat
  );
  grinderPedestal.name = 'outbuildings.garage.toolBench.benchGrinder.pedestalBase';
  grinderPedestal.position.set(0, 0.021, 0);
  grinderGroup.add(grinderPedestal);

  // Integrated front water quench tray + power toggle switch
  const quenchTray = new THREE.Mesh(
    new THREE.BoxGeometry(0.075, 0.024, 0.042),
    castAluminumMat
  );
  quenchTray.name = 'outbuildings.garage.toolBench.benchGrinder.quenchTray';
  quenchTray.userData.lodTier = 'high';
  quenchTray.userData.lodMaxDistance = 12;
  quenchTray.position.set(0, 0.014, -0.092);
  grinderGroup.add(quenchTray);

  const switchPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.052, 0.026, 0.012),
    dewaltYellowMat
  );
  switchPlate.name = 'outbuildings.garage.toolBench.benchGrinder.switchPlate';
  switchPlate.userData.lodTier = 'high';
  switchPlate.userData.lodMaxDistance = 12;
  switchPlate.position.set(0, 0.028, -0.076);
  grinderGroup.add(switchPlate);

  const rockerButton = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.014, 0.008),
    redAccentMat
  );
  rockerButton.name = 'outbuildings.garage.toolBench.benchGrinder.rockerSwitch';
  rockerButton.userData.lodTier = 'high';
  rockerButton.userData.lodMaxDistance = 12;
  rockerButton.position.set(0, 0.028, -0.084);
  grinderGroup.add(rockerButton);

  const grinderMotor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.072, 0.072, 0.17, 20),
    dewaltYellowMat
  );
  grinderMotor.name = 'outbuildings.garage.toolBench.benchGrinder.motorBarrel';
  grinderMotor.rotation.z = Math.PI / 2;
  grinderMotor.position.set(0, 0.12, 0);
  grinderMotor.castShadow = true;
  grinderGroup.add(grinderMotor);

  // Cast cooling fins around the induction motor barrel
  for (const fx of [-0.055, -0.035, 0.035, 0.055] as const) {
    const coolingFin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 0.006, 20),
      dewaltBlackMat
    );
    coolingFin.name = 'outbuildings.garage.toolBench.benchGrinder.coolingFin';
    coolingFin.userData.lodTier = 'high';
    coolingFin.userData.lodMaxDistance = 12;
    coolingFin.rotation.z = Math.PI / 2;
    coolingFin.position.set(fx, 0.12, 0);
    grinderGroup.add(coolingFin);
  }

  const grinderBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.088, 0.034),
    dewaltBadgeMat
  );
  grinderBadge.name = 'outbuildings.garage.toolBench.benchGrinder.brandBadge';
  grinderBadge.userData.lodTier = 'high';
  grinderBadge.userData.lodMaxDistance = 12;
  grinderBadge.position.set(0, 0.125, -0.074);
  grinderGroup.add(grinderBadge);

  for (const sideX of [-1, 1] as const) {
    const wheelGuard = new THREE.Mesh(
      new THREE.CylinderGeometry(0.098, 0.098, 0.044, 22),
      dewaltBlackMat
    );
    wheelGuard.name = 'outbuildings.garage.toolBench.benchGrinder.wheelGuard';
    wheelGuard.rotation.z = Math.PI / 2;
    wheelGuard.position.set(sideX * 0.13, 0.12, 0);
    wheelGuard.castShadow = true;
    grinderGroup.add(wheelGuard);

    const abrasiveWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.085, 0.028, 22),
      sideX < 0 ? aluminumTrimMat : castAluminumMat
    );
    abrasiveWheel.name = 'outbuildings.garage.toolBench.benchGrinder.abrasiveWheel';
    abrasiveWheel.rotation.z = Math.PI / 2;
    abrasiveWheel.position.set(sideX * 0.13, 0.12, -0.014);
    grinderGroup.add(abrasiveWheel);

    const toolRest = new THREE.Mesh(
      new THREE.BoxGeometry(0.042, 0.008, 0.048),
      castAluminumMat
    );
    toolRest.name = 'outbuildings.garage.toolBench.benchGrinder.toolRest';
    toolRest.userData.lodTier = 'high';
    toolRest.userData.lodMaxDistance = 12;
    toolRest.position.set(sideX * 0.13, 0.085, -0.095);
    grinderGroup.add(toolRest);

    const sparkArrestor = new THREE.Mesh(
      new THREE.BoxGeometry(0.038, 0.022, 0.018),
      dewaltYellowMat
    );
    sparkArrestor.name = 'outbuildings.garage.toolBench.benchGrinder.sparkArrestor';
    sparkArrestor.userData.lodTier = 'high';
    sparkArrestor.userData.lodMaxDistance = 12;
    sparkArrestor.position.set(sideX * 0.13, 0.175, -0.068);
    grinderGroup.add(sparkArrestor);

    const shieldBracket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.045, 8),
      hssSteelBitMat
    );
    shieldBracket.name = 'outbuildings.garage.toolBench.benchGrinder.eyeShieldBracket';
    shieldBracket.userData.lodTier = 'high';
    shieldBracket.userData.lodMaxDistance = 12;
    shieldBracket.rotation.x = 0.4;
    shieldBracket.position.set(sideX * 0.13, 0.185, -0.075);
    grinderGroup.add(shieldBracket);

    const eyeShield = new THREE.Mesh(
      new THREE.BoxGeometry(0.062, 0.052, 0.006),
      clearShieldMat
    );
    eyeShield.name = 'outbuildings.garage.toolBench.benchGrinder.eyeShield';
    eyeShield.userData.lodTier = 'high';
    eyeShield.userData.lodMaxDistance = 12;
    eyeShield.rotation.x = -0.35;
    eyeShield.position.set(sideX * 0.13, 0.198, -0.088);
    grinderGroup.add(eyeShield);
  }

  // D. DeWALT DWE4257 125mm Angle Grinder & DeWALT DCW210 18V XR Random Orbit Sander (`x = +0.22m, z = -0.10m`)
  const grinderSanderGroup = new THREE.Group();
  grinderSanderGroup.name = 'outbuildings.garage.toolBench.angleGrinderAndSander';
  grinderSanderGroup.position.set(0.22, worktopY, -0.1);
  benchGroup.add(grinderSanderGroup);

  const agUnit = new THREE.Group();
  agUnit.name = 'outbuildings.garage.toolBench.angleGrinderAndSander.angleGrinder';
  agUnit.position.set(-0.08, 0, -0.04);
  agUnit.rotation.y = 0.42;
  grinderSanderGroup.add(agUnit);

  const agBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.03, 0.19, 16),
    dewaltYellowMat
  );
  agBody.name = 'outbuildings.garage.toolBench.angleGrinderAndSander.angleGrinder.motorBody';
  agBody.rotation.z = Math.PI / 2;
  agBody.position.set(0, 0.046, 0);
  agBody.castShadow = true;
  agUnit.add(agBody);

  const agPaddleSwitch = new THREE.Mesh(
    new THREE.BoxGeometry(0.075, 0.01, 0.018),
    dewaltBlackMat
  );
  agPaddleSwitch.name = 'outbuildings.garage.toolBench.angleGrinderAndSander.angleGrinder.paddleSwitch';
  agPaddleSwitch.userData.lodTier = 'high';
  agPaddleSwitch.userData.lodMaxDistance = 12;
  agPaddleSwitch.position.set(0.02, 0.022, 0);
  agUnit.add(agPaddleSwitch);

  const agBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.072, 0.022),
    dewaltBadgeMat
  );
  agBadge.name = 'outbuildings.garage.toolBench.angleGrinderAndSander.angleGrinder.brandBadge';
  agBadge.userData.lodTier = 'high';
  agBadge.userData.lodMaxDistance = 12;
  agBadge.rotation.x = -Math.PI / 2;
  agBadge.position.set(0, 0.076, 0);
  agUnit.add(agBadge);

  const agTailGrip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.024, 0.08, 16),
    dewaltBlackMat
  );
  agTailGrip.name = 'outbuildings.garage.toolBench.angleGrinderAndSander.angleGrinder.tailGrip';
  agTailGrip.rotation.z = Math.PI / 2;
  agTailGrip.position.set(0.115, 0.046, 0);
  agUnit.add(agTailGrip);

  const agGearHead = new THREE.Mesh(
    new THREE.CylinderGeometry(0.034, 0.036, 0.052, 16),
    castAluminumMat
  );
  agGearHead.name = 'outbuildings.garage.toolBench.angleGrinderAndSander.angleGrinder.gearHead';
  agGearHead.position.set(-0.105, 0.046, 0);
  agUnit.add(agGearHead);

  const spindleLockButton = new THREE.Mesh(
    new THREE.CylinderGeometry(0.007, 0.007, 0.01, 10),
    redAccentMat
  );
  spindleLockButton.name = 'outbuildings.garage.toolBench.angleGrinderAndSander.angleGrinder.spindleLockButton';
  spindleLockButton.userData.lodTier = 'high';
  spindleLockButton.userData.lodMaxDistance = 12;
  spindleLockButton.position.set(-0.105, 0.075, 0);
  agUnit.add(spindleLockButton);

  const agGuard = new THREE.Mesh(
    new THREE.CylinderGeometry(0.068, 0.068, 0.018, 20, 1, false, 0, Math.PI * 1.1),
    dewaltBlackMat
  );
  agGuard.name = 'outbuildings.garage.toolBench.angleGrinderAndSander.angleGrinder.discGuard';
  agGuard.position.set(-0.105, 0.022, 0);
  agUnit.add(agGuard);

  const agDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.062, 0.062, 0.004, 24),
    hssSteelBitMat
  );
  agDisc.name = 'outbuildings.garage.toolBench.angleGrinderAndSander.angleGrinder.cuttingDisc';
  agDisc.position.set(-0.105, 0.018, 0);
  agUnit.add(agDisc);

  const agLockNut = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.016, 0.008, 14),
    dewaltBlackMat
  );
  agLockNut.name = 'outbuildings.garage.toolBench.angleGrinderAndSander.angleGrinder.lockNut';
  agLockNut.userData.lodTier = 'high';
  agLockNut.userData.lodMaxDistance = 12;
  agLockNut.position.set(-0.105, 0.015, 0);
  agUnit.add(agLockNut);

  const agSideHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.011, 0.11, 12),
    dewaltBlackMat
  );
  agSideHandle.name = 'outbuildings.garage.toolBench.angleGrinderAndSander.angleGrinder.sideHandle';
  agSideHandle.rotation.x = Math.PI / 2;
  agSideHandle.position.set(-0.105, 0.046, -0.072);
  agUnit.add(agSideHandle);

  const sanderUnit = new THREE.Group();
  sanderUnit.name = 'outbuildings.garage.toolBench.angleGrinderAndSander.randomOrbitSander';
  sanderUnit.position.set(0.12, 0, 0.05);
  sanderUnit.rotation.y = -0.28;
  grinderSanderGroup.add(sanderUnit);

  const sandingDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.061, 0.061, 0.003, 22),
    redAccentMat
  );
  sandingDisc.name = 'outbuildings.garage.toolBench.angleGrinderAndSander.randomOrbitSander.sandingDisc';
  sandingDisc.userData.lodTier = 'high';
  sandingDisc.userData.lodMaxDistance = 12;
  sandingDisc.position.set(0, 0.0055, 0);
  sanderUnit.add(sandingDisc);

  const sandingPad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.062, 0.062, 0.012, 22),
    dewaltBlackMat
  );
  sandingPad.name = 'outbuildings.garage.toolBench.angleGrinderAndSander.randomOrbitSander.sandingPad';
  sandingPad.position.set(0, 0.017, 0);
  sanderUnit.add(sandingPad);

  const sanderHousing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.052, 0.088, 18),
    dewaltYellowMat
  );
  sanderHousing.name = 'outbuildings.garage.toolBench.angleGrinderAndSander.randomOrbitSander.motorHousing';
  sanderHousing.position.set(0, 0.071, 0);
  sanderHousing.castShadow = true;
  sanderUnit.add(sanderHousing);

  const sanderPalmCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.043, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
    dewaltBlackMat
  );
  sanderPalmCap.name = 'outbuildings.garage.toolBench.angleGrinderAndSander.randomOrbitSander.palmGripCap';
  sanderPalmCap.position.set(0, 0.111, 0);
  sanderUnit.add(sanderPalmCap);

  // Dust collection canister & filter bag at rear of random orbit sander
  const sanderDustBox = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.028, 0.085, 14),
    dewaltBlackMat
  );
  sanderDustBox.name = 'outbuildings.garage.toolBench.angleGrinderAndSander.randomOrbitSander.dustCanister';
  sanderDustBox.rotation.x = Math.PI / 2;
  sanderDustBox.position.set(0, 0.032, -0.072);
  sanderUnit.add(sanderDustBox);

  const sanderBattery = new THREE.Mesh(
    new THREE.BoxGeometry(0.068, 0.042, 0.085),
    dewaltBlackMat
  );
  sanderBattery.name = 'outbuildings.garage.toolBench.angleGrinderAndSander.randomOrbitSander.batteryPack';
  sanderBattery.position.set(0, 0.052, 0.062);
  sanderUnit.add(sanderBattery);

  const sanderBattCap = new THREE.Mesh(
    new THREE.BoxGeometry(0.066, 0.016, 0.082),
    dewaltYellowMat
  );
  sanderBattCap.name = 'outbuildings.garage.toolBench.angleGrinderAndSander.randomOrbitSander.batteryRail';
  sanderBattCap.userData.lodTier = 'high';
  sanderBattCap.userData.lodMaxDistance = 12;
  sanderBattCap.position.set(0, 0.078, 0.062);
  sanderUnit.add(sanderBattCap);

  // E. High-LOD DeWALT DCB132 Dual-Port 18V XR Charger + DeWALT DCD996 Brushless Hammer Drill,
  //    DCF887 Brushless Impact Driver & TSTAK Case (`outbuildings.garage.toolBench.cordlessDrills`)
  //    Issue #2 ("Improve the mesh of the powertools" at `[-13.835, 0.466, 18.605]`):
  const drillsGroup = new THREE.Group();
  drillsGroup.name = 'outbuildings.garage.toolBench.cordlessDrills';
  drillsGroup.position.set(0.58, worktopY, -0.06);
  southWingGroup.add(drillsGroup);

  // 1. DeWALT TSTAK Heavy-Duty Interlocking Kit Box (`x = 0.12m, z = 0.16m`)
  const tstakCase = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.135, 0.22),
    dewaltBlackMat
  );
  tstakCase.name = 'outbuildings.garage.toolBench.cordlessDrills.tstakCase';
  tstakCase.position.set(0.12, 0.0675, 0.16);
  tstakCase.castShadow = true;
  drillsGroup.add(tstakCase);

  const tstakLidAccent = new THREE.Mesh(
    new THREE.BoxGeometry(0.29, 0.016, 0.19),
    dewaltYellowMat
  );
  tstakLidAccent.name = 'outbuildings.garage.toolBench.cordlessDrills.tstakLidAccent';
  tstakLidAccent.position.set(0.12, 0.138, 0.16);
  drillsGroup.add(tstakLidAccent);

  // Top interlocking stacking ribs & recessed clear organizer compartments on TSTAK lid
  for (const rx of [0.01, 0.12, 0.23] as const) {
    const lidRib = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.008, 0.175),
      dewaltBlackMat
    );
    lidRib.name = 'outbuildings.garage.toolBench.cordlessDrills.tstakLidRib';
    lidRib.userData.lodTier = 'high';
    lidRib.userData.lodMaxDistance = 12;
    lidRib.position.set(rx, 0.148, 0.16);
    drillsGroup.add(lidRib);
  }

  // Twin yellow heavy-duty folding front metal/polymer latches + bi-material carry handle
  for (const lx of [0.03, 0.21] as const) {
    const frontLatch = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.044, 0.014),
      dewaltYellowMat
    );
    frontLatch.name = 'outbuildings.garage.toolBench.cordlessDrills.tstakFrontLatch';
    frontLatch.userData.lodTier = 'high';
    frontLatch.userData.lodMaxDistance = 12;
    frontLatch.position.set(lx, 0.105, 0.048);
    drillsGroup.add(frontLatch);

    const sideClip = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.048, 0.042),
      dewaltYellowMat
    );
    sideClip.name = 'outbuildings.garage.toolBench.cordlessDrills.tstakSideClip';
    sideClip.userData.lodTier = 'high';
    sideClip.userData.lodMaxDistance = 12;
    sideClip.position.set(lx < 0.12 ? -0.044 : 0.284, 0.072, 0.16);
    drillsGroup.add(sideClip);
  }

  const tstakHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.022, 0.032),
    dewaltYellowMat
  );
  tstakHandle.name = 'outbuildings.garage.toolBench.cordlessDrills.tstakCarryHandle';
  tstakHandle.userData.lodTier = 'high';
  tstakHandle.userData.lodMaxDistance = 12;
  tstakHandle.position.set(0.12, 0.072, 0.036);
  drillsGroup.add(tstakHandle);

  const tstakBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.14, 0.05),
    dewaltBadgeMat
  );
  tstakBadge.name = 'outbuildings.garage.toolBench.cordlessDrills.tstakBadge';
  tstakBadge.userData.lodTier = 'high';
  tstakBadge.userData.lodMaxDistance = 12;
  tstakBadge.rotation.x = -Math.PI / 2;
  tstakBadge.position.set(0.12, 0.153, 0.16);
  drillsGroup.add(tstakBadge);

  // 2. DeWALT DCB132 Dual-Port 18V XR Fast Charger (`x = -0.18m, z = 0.13m`)
  const chargerDock = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.058, 0.165),
    dewaltBlackMat
  );
  chargerDock.name = 'outbuildings.garage.toolBench.cordlessDrills.dualPortCharger';
  chargerDock.position.set(-0.18, 0.029, 0.13);
  chargerDock.castShadow = true;
  drillsGroup.add(chargerDock);

  const chargerYellowTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.242, 0.016, 0.044),
    dewaltYellowMat
  );
  chargerYellowTrim.name = 'outbuildings.garage.toolBench.cordlessDrills.chargerYellowTrim';
  chargerYellowTrim.position.set(-0.18, 0.05, 0.065);
  drillsGroup.add(chargerYellowTrim);

  const chargerFrontBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.095, 0.028),
    dewaltBadgeMat
  );
  chargerFrontBadge.name = 'outbuildings.garage.toolBench.cordlessDrills.chargerBadge';
  chargerFrontBadge.userData.lodTier = 'high';
  chargerFrontBadge.userData.lodMaxDistance = 12;
  chargerFrontBadge.rotation.x = -Math.PI * 0.35;
  chargerFrontBadge.position.set(-0.18, 0.059, 0.065);
  drillsGroup.add(chargerFrontBadge);

  for (const bx of [-0.235, -0.125]) {
    const batteryBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.078, 0.038, 0.112),
      dewaltBlackMat
    );
    batteryBase.name = 'outbuildings.garage.toolBench.cordlessDrills.chargingBatteryBase';
    batteryBase.position.set(bx, 0.068, 0.125);
    drillsGroup.add(batteryBase);

    const batteryCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.076, 0.022, 0.108),
      dewaltYellowMat
    );
    batteryCap.name = 'outbuildings.garage.toolBench.cordlessDrills.chargingBatteryCap';
    batteryCap.position.set(bx, 0.096, 0.125);
    drillsGroup.add(batteryCap);

    const redRelease = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.012, 0.014),
      redAccentMat
    );
    redRelease.name = 'outbuildings.garage.toolBench.cordlessDrills.chargingBatteryLatch';
    redRelease.userData.lodTier = 'high';
    redRelease.userData.lodMaxDistance = 12;
    redRelease.position.set(bx, 0.092, 0.07);
    drillsGroup.add(redRelease);

    const chargeLed = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.006, 0.008),
      greenLedMat
    );
    chargeLed.name = 'outbuildings.garage.toolBench.cordlessDrills.chargeStatusLed';
    chargeLed.userData.lodTier = 'high';
    chargeLed.userData.lodMaxDistance = 12;
    chargeLed.position.set(bx, 0.059, 0.052);
    drillsGroup.add(chargeLed);
  }

  // 3. Sculpted DeWALT DCD996 18V XR Brushless 3-Speed Hammer Drill (`dx = -0.08m`) &
  //    DeWALT DCF887 18V XR Brushless 3-Speed Impact Driver (`dx = +0.12m`)
  for (const [dx, dz, yaw, bodyLen, isHammerDrill] of [
    [-0.08, -0.08, -0.32, 0.175, true],
    [0.12, -0.06, -0.52, 0.128, false],
  ] as const) {
    const drillUnit = new THREE.Group();
    drillUnit.name = isHammerDrill
      ? 'outbuildings.garage.toolBench.cordlessDrills.hammerDrill'
      : 'outbuildings.garage.toolBench.cordlessDrills.impactDriver';
    drillUnit.position.set(dx, 0, dz);
    drillUnit.rotation.y = yaw;
    drillsGroup.add(drillUnit);

    // 3A. Multi-Part 18V 5.0Ah XR Li-Ion Slide Battery Pack (`y = 0..0.062m`)
    const battFootBumper = new THREE.Mesh(
      new THREE.BoxGeometry(0.082, 0.012, 0.124),
      dewaltBlackMat
    );
    battFootBumper.name = `${drillUnit.name}.batteryFootBumper`;
    battFootBumper.position.set(0, 0.006, 0);
    battFootBumper.castShadow = true;
    drillUnit.add(battFootBumper);

    const battBlackCore = new THREE.Mesh(
      new THREE.BoxGeometry(0.078, 0.032, 0.118),
      dewaltBlackMat
    );
    battBlackCore.name = `${drillUnit.name}.batteryCore`;
    battBlackCore.position.set(0, 0.026, 0);
    battBlackCore.castShadow = true;
    drillUnit.add(battBlackCore);

    // Left & right procedural `DeWALT 18V XR 5.0Ah` battery side decals
    for (const sideX of [-1, 1] as const) {
      const battDecal = new THREE.Mesh(
        new THREE.PlaneGeometry(0.104, 0.034),
        dewaltBattDecalMat
      );
      battDecal.name = `${drillUnit.name}.batteryDecal`;
      battDecal.userData.lodTier = 'high';
      battDecal.userData.lodMaxDistance = 12;
      battDecal.rotation.y = sideX * (Math.PI / 2);
      battDecal.position.set(sideX * 0.0395, 0.028, 0);
      drillUnit.add(battDecal);
    }

    const battYellowRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.076, 0.018, 0.112),
      dewaltYellowMat
    );
    battYellowRail.name = `${drillUnit.name}.batterySlideRail`;
    battYellowRail.position.set(0, 0.051, 0);
    drillUnit.add(battYellowRail);

    // Red spring-loaded battery release latch button at front of pack (`-z`)
    const battReleaseLatch = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.014, 0.016),
      redAccentMat
    );
    battReleaseLatch.name = `${drillUnit.name}.batteryReleaseLatch`;
    battReleaseLatch.userData.lodTier = 'high';
    battReleaseLatch.userData.lodMaxDistance = 12;
    battReleaseLatch.position.set(0, 0.048, -0.054);
    drillUnit.add(battReleaseLatch);

    // Rear 3-LED green state-of-charge fuel gauge on back of battery (`+z`)
    for (const lx of [-0.012, 0, 0.012] as const) {
      const socLed = new THREE.Mesh(
        new THREE.BoxGeometry(0.007, 0.005, 0.004),
        greenLedMat
      );
      socLed.name = `${drillUnit.name}.batteryFuelGaugeLed`;
      socLed.userData.lodTier = 'high';
      socLed.userData.lodMaxDistance = 12;
      socLed.position.set(lx, 0.028, 0.059);
      drillUnit.add(socLed);
    }

    // Tool foot base flare + stainless steel belt hook + magnetic bit holder
    const footFlare = new THREE.Mesh(
      new THREE.BoxGeometry(0.058, 0.022, 0.088),
      dewaltYellowMat
    );
    footFlare.name = `${drillUnit.name}.footBaseFlare`;
    footFlare.position.set(0, 0.068, 0.005);
    drillUnit.add(footFlare);

    const beltHook = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.028, 0.046),
      hssSteelBitMat
    );
    beltHook.name = `${drillUnit.name}.beltHook`;
    beltHook.userData.lodTier = 'high';
    beltHook.userData.lodMaxDistance = 12;
    beltHook.position.set(-0.034, 0.064, 0.005);
    drillUnit.add(beltHook);

    // 3B. Ergonomic Contoured Pistol Grip with TPE Rubber Overmold Ribs & Variable-Speed Trigger
    const grip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.019, 0.022, 0.125, 16),
      dewaltYellowMat
    );
    grip.name = `${drillUnit.name}.pistolGrip`;
    grip.position.set(0, 0.122, 0.012);
    grip.rotation.x = -0.18;
    grip.castShadow = true;
    drillUnit.add(grip);

    const gripRubberBack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0205, 0.0235, 0.092, 16),
      dewaltBlackMat
    );
    gripRubberBack.name = `${drillUnit.name}.gripRubberOvermold`;
    gripRubberBack.position.set(0, 0.122, 0.016);
    gripRubberBack.rotation.x = -0.18;
    drillUnit.add(gripRubberBack);

    // 5 tactile horizontal black TPE grip ribs along the handle
    for (let r = 0; r < 5; r++) {
      const ribY = 0.09 + r * 0.016;
      const gripRib = new THREE.Mesh(
        new THREE.TorusGeometry(0.021, 0.0025, 8, 16),
        dewaltBlackMat
      );
      gripRib.name = `${drillUnit.name}.gripTactileRib`;
      gripRib.userData.lodTier = 'high';
      gripRib.userData.lodMaxDistance = 12;
      gripRib.rotation.x = Math.PI / 2 - 0.18;
      gripRib.position.set(0, ribY, 0.018 - (ribY - 0.122) * 0.18);
      drillUnit.add(gripRib);
    }

    // Variable-speed curved index trigger + red forward/reverse push-bar
    const triggerSwitch = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, 0.028, 0.022),
      dewaltBlackMat
    );
    triggerSwitch.name = `${drillUnit.name}.triggerSwitch`;
    triggerSwitch.userData.lodTier = 'high';
    triggerSwitch.userData.lodMaxDistance = 12;
    triggerSwitch.position.set(0, 0.154, -0.012);
    triggerSwitch.rotation.x = 0.22;
    drillUnit.add(triggerSwitch);

    const fwdRevSwitch = new THREE.Mesh(
      new THREE.BoxGeometry(0.044, 0.009, 0.012),
      redAccentMat
    );
    fwdRevSwitch.name = `${drillUnit.name}.forwardReverseBar`;
    fwdRevSwitch.userData.lodTier = 'high';
    fwdRevSwitch.userData.lodMaxDistance = 12;
    fwdRevSwitch.position.set(0, 0.172, -0.004);
    drillUnit.add(fwdRevSwitch);

    // 3C. Sculpted Brushless Motor Barrel Housing, Cooling Vents, Side Badges & Top Speed Selector
    const barrelY = 0.202;
    const barrelZ = -0.008;
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.034, 0.034, bodyLen, 20),
      dewaltYellowMat
    );
    barrel.name = 'outbuildings.garage.toolBench.cordlessDrills';
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, barrelY, barrelZ);
    barrel.castShadow = true;
    drillUnit.add(barrel);

    // Side DeWALT badges & 4 recessed black motor cooling gill slots on each side of the barrel
    for (const sideX of [-1, 1] as const) {
      const sideBadge = new THREE.Mesh(
        new THREE.PlaneGeometry(0.068, 0.024),
        dewaltBadgeMat
      );
      sideBadge.name = `${drillUnit.name}.brandBadge`;
      sideBadge.userData.lodTier = 'high';
      sideBadge.userData.lodMaxDistance = 12;
      sideBadge.rotation.y = sideX * (Math.PI / 2);
      sideBadge.position.set(sideX * 0.0345, barrelY + 0.004, barrelZ - 0.01);
      drillUnit.add(sideBadge);

      for (let v = 0; v < 4; v++) {
        const gill = new THREE.Mesh(
          new THREE.BoxGeometry(0.004, 0.022, 0.006),
          dewaltBlackMat
        );
        gill.name = `${drillUnit.name}.coolingGill`;
        gill.userData.lodTier = 'high';
        gill.userData.lodMaxDistance = 12;
        gill.position.set(
          sideX * 0.033,
          barrelY,
          barrelZ + bodyLen * 0.22 + v * 0.011
        );
        gill.rotation.x = 0.25;
        drillUnit.add(gill);
      }
    }

    // Top red 3-speed mechanical slide switch
    const speedSelector = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.008, 0.032),
      redAccentMat
    );
    speedSelector.name = `${drillUnit.name}.speedSelectorSwitch`;
    speedSelector.userData.lodTier = 'high';
    speedSelector.userData.lodMaxDistance = 12;
    speedSelector.position.set(0, barrelY + 0.034, barrelZ - 0.01);
    drillUnit.add(speedSelector);

    // Sculpted rear black rubber overmold endcap dome
    const rearCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.031, 0.034, 0.026, 20),
      dewaltBlackMat
    );
    rearCap.name = `${drillUnit.name}.rearEndcap`;
    rearCap.rotation.x = Math.PI / 2;
    rearCap.position.set(0, barrelY, barrelZ + bodyLen * 0.5 + 0.012);
    drillUnit.add(rearCap);

    const rearDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.031, 16, 12),
      dewaltBlackMat
    );
    rearDome.name = `${drillUnit.name}.rearEndcapDome`;
    rearDome.scale.set(1, 1, 0.45);
    rearDome.position.set(0, barrelY, barrelZ + bodyLen * 0.5 + 0.024);
    drillUnit.add(rearDome);

    if (isHammerDrill) {
      // 3D-A. DeWALT DCD996 Hammer Drill: Torque-Clutch Collar, 2-Stage Metal Gearbox, Keyless Chuck & HSS Twist Drill Bit
      const clutchCollar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.031, 0.033, 0.026, 18),
        dewaltBlackMat
      );
      clutchCollar.name = `${drillUnit.name}.torqueClutchCollar`;
      clutchCollar.rotation.x = Math.PI / 2;
      clutchCollar.position.set(0, barrelY, barrelZ - bodyLen * 0.5 - 0.012);
      drillUnit.add(clutchCollar);

      const gearCaseNose = new THREE.Mesh(
        new THREE.CylinderGeometry(0.024, 0.029, 0.028, 18),
        castAluminumMat
      );
      gearCaseNose.name = `${drillUnit.name}.metalGearboxNose`;
      gearCaseNose.rotation.x = Math.PI / 2;
      gearCaseNose.position.set(0, barrelY, barrelZ - bodyLen * 0.5 - 0.038);
      drillUnit.add(gearCaseNose);

      const keylessChuck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.022, 0.044, 16),
        dewaltBlackMat
      );
      keylessChuck.name = `${drillUnit.name}.keylessChuck`;
      keylessChuck.rotation.x = Math.PI / 2;
      keylessChuck.position.set(0, barrelY, barrelZ - bodyLen * 0.5 - 0.072);
      drillUnit.add(keylessChuck);

      const chuckFrontRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.0155, 0.0022, 8, 16),
        redAccentMat
      );
      chuckFrontRing.name = `${drillUnit.name}.chuckFrontRing`;
      chuckFrontRing.userData.lodTier = 'high';
      chuckFrontRing.userData.lodMaxDistance = 12;
      chuckFrontRing.position.set(0, barrelY, barrelZ - bodyLen * 0.5 - 0.092);
      drillUnit.add(chuckFrontRing);

      // Helical HSS twist drill bit (`r = 0.0035m, len = 0.078m`) protruding from chuck jaws
      const twistBit = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0032, 0.0035, 0.078, 10),
        hssSteelBitMat
      );
      twistBit.name = `${drillUnit.name}.hssTwistBit`;
      twistBit.userData.lodTier = 'high';
      twistBit.userData.lodMaxDistance = 12;
      twistBit.rotation.x = Math.PI / 2;
      twistBit.position.set(0, barrelY, barrelZ - bodyLen * 0.5 - 0.13);
      drillUnit.add(twistBit);

      // Side 360° auxiliary handle with clamp collar
      const auxCollar = new THREE.Mesh(
        new THREE.TorusGeometry(0.028, 0.005, 10, 18),
        dewaltBlackMat
      );
      auxCollar.name = `${drillUnit.name}.auxHandleCollar`;
      auxCollar.userData.lodTier = 'high';
      auxCollar.userData.lodMaxDistance = 12;
      auxCollar.position.set(0, barrelY, barrelZ - bodyLen * 0.5 - 0.032);
      drillUnit.add(auxCollar);

      const auxHandle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.012, 0.125, 12),
        dewaltBlackMat
      );
      auxHandle.name = `${drillUnit.name}.auxSideHandle`;
      auxHandle.rotation.z = Math.PI / 2;
      auxHandle.position.set(-0.082, barrelY, barrelZ - bodyLen * 0.5 - 0.032);
      drillUnit.add(auxHandle);

      const auxEndCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.014, 12),
        dewaltYellowMat
      );
      auxEndCap.name = `${drillUnit.name}.auxHandleEndCap`;
      auxEndCap.userData.lodTier = 'high';
      auxEndCap.userData.lodMaxDistance = 12;
      auxEndCap.rotation.z = Math.PI / 2;
      auxEndCap.position.set(-0.148, barrelY, barrelZ - bodyLen * 0.5 - 0.032);
      drillUnit.add(auxEndCap);
    } else {
      // 3D-B. DeWALT DCF887 Impact Driver: Cast-Aluminium Anvil Nose, Tri-LED Halo Ring, 1/4" Hex Collet & PZ2 Torsion Bit
      const impactNose = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.032, 0.034, 16),
        castAluminumMat
      );
      impactNose.name = `${drillUnit.name}.anvilNose`;
      impactNose.rotation.x = Math.PI / 2;
      impactNose.position.set(0, barrelY, barrelZ - bodyLen * 0.5 - 0.016);
      drillUnit.add(impactNose);

      // Tri-LED worklight halo ring on front of impact nose
      const triLedHalo = new THREE.Mesh(
        new THREE.TorusGeometry(0.018, 0.003, 8, 16),
        worklightLedMat
      );
      triLedHalo.name = `${drillUnit.name}.triLedHaloRing`;
      triLedHalo.userData.lodTier = 'high';
      triLedHalo.userData.lodMaxDistance = 12;
      triLedHalo.position.set(0, barrelY, barrelZ - bodyLen * 0.5 - 0.033);
      drillUnit.add(triLedHalo);

      const hexCollet = new THREE.Mesh(
        new THREE.CylinderGeometry(0.011, 0.013, 0.022, 12),
        dewaltBlackMat
      );
      hexCollet.name = `${drillUnit.name}.hexCollet`;
      hexCollet.userData.lodTier = 'high';
      hexCollet.userData.lodMaxDistance = 12;
      hexCollet.rotation.x = Math.PI / 2;
      hexCollet.position.set(0, barrelY, barrelZ - bodyLen * 0.5 - 0.042);
      drillUnit.add(hexCollet);

      // Black-oxide PZ2 torsion driver bit with yellow torsion band
      const pz2Bit = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0028, 0.0032, 0.05, 6),
        blackOxideBitMat
      );
      pz2Bit.name = `${drillUnit.name}.pz2TorsionBit`;
      pz2Bit.userData.lodTier = 'high';
      pz2Bit.userData.lodMaxDistance = 12;
      pz2Bit.rotation.x = Math.PI / 2;
      pz2Bit.position.set(0, barrelY, barrelZ - bodyLen * 0.5 - 0.072);
      drillUnit.add(pz2Bit);

      const torsionBand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0036, 0.0036, 0.012, 10),
        dewaltYellowMat
      );
      torsionBand.name = `${drillUnit.name}.torsionBitBand`;
      torsionBand.userData.lodTier = 'high';
      torsionBand.userData.lodMaxDistance = 12;
      torsionBand.rotation.x = Math.PI / 2;
      torsionBand.position.set(0, barrelY, barrelZ - bodyLen * 0.5 - 0.068);
      drillUnit.add(torsionBand);
    }
  }

  // F. Organized Hand Tools on East-Wall Pegboard (`localX = -1.95m..+0.45m`)
  const pegZ = benchD * 0.5 - 0.038;
  for (let wIdx = 0; wIdx < 12; wIdx++) {
    const wx = -1.85 + wIdx * 0.058;
    const wLen = 0.12 + wIdx * 0.014;
    const wrench = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, wLen, 0.006),
      aluminumTrimMat
    );
    wrench.name = 'outbuildings.garage.toolBench.pegboard.combinationWrench';
    wrench.userData.lodTier = 'high';
    wrench.userData.lodMaxDistance = 12;
    wrench.position.set(wx, worktopY + 0.36, pegZ);
    benchGroup.add(wrench);
  }
  for (let sIdx = 0; sIdx < 10; sIdx++) {
    const sx = -0.95 + sIdx * 0.056;
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.01, 0.088, 10),
      sIdx % 2 === 0 ? dewaltYellowMat : dewaltBlackMat
    );
    handle.name = 'outbuildings.garage.toolBench.pegboard.screwdriverHandle';
    handle.userData.lodTier = 'high';
    handle.userData.lodMaxDistance = 12;
    handle.position.set(sx, worktopY + 0.42, pegZ);
    benchGroup.add(handle);

    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.003, 0.105, 8),
      aluminumTrimMat
    );
    shaft.name = 'outbuildings.garage.toolBench.pegboard.screwdriverShaft';
    shaft.userData.lodTier = 'high';
    shaft.userData.lodMaxDistance = 12;
    shaft.position.set(sx, worktopY + 0.33, pegZ);
    benchGroup.add(shaft);
  }
  const spiritLevel = new THREE.Mesh(
    new THREE.BoxGeometry(0.76, 0.05, 0.022),
    dewaltYellowMat
  );
  spiritLevel.name = 'outbuildings.garage.toolBench.pegboard.spiritLevel';
  spiritLevel.position.set(0.02, worktopY + 0.45, pegZ);
  benchGroup.add(spiritLevel);
}
