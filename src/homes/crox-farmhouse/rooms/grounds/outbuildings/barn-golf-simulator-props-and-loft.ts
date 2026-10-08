import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../../types/scene.ts';
import {
  createForgedIronBladeGeometry,
  GOLF_SIM_SHOT_PROFILES,
  renderTrackManWidescreenShotState,
  type BarnGolfSimulatorEnclosureHandles,
} from './barn-golf-simulator-enclosure.ts';

let cachedPineFloorTextures: {
  readonly colorTex: THREE.CanvasTexture;
  readonly bumpTex: THREE.CanvasTexture;
} | null = null;
let cachedCallawayPanelTexture: THREE.CanvasTexture | null = null;
let cachedTrackManControlScreenTexture: THREE.CanvasTexture | null = null;
let cachedTrackManControlScreenCanvas: HTMLCanvasElement | null = null;

function getPlainUnvarnishedPineFloorTextures(
  loftLenU: number,
  loftSpanV: number
): {
  readonly colorTex: THREE.CanvasTexture;
  readonly bumpTex: THREE.CanvasTexture;
} {
  if (cachedPineFloorTextures) {
    return cachedPineFloorTextures;
  }
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 512;
  const ctx2d = c.getContext('2d');
  const b = document.createElement('canvas');
  b.width = 512;
  b.height = 512;
  const bCtx = b.getContext('2d');

  if (ctx2d && bCtx) {
    ctx2d.fillStyle = '#decba8';
    ctx2d.fillRect(0, 0, 512, 512);
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, 512, 512);

    const numBoards = 6;
    const boardH = 512 / numBoards;
    const boardPalette = ['#e4d3b3', '#dac6a2', '#e0cead', '#d6c19b', '#e6d6b8', '#dcc8a5'];

    for (let row = 0; row < numBoards; row++) {
      const y0 = row * boardH;
      ctx2d.fillStyle = boardPalette[row % boardPalette.length]!;
      ctx2d.fillRect(0, y0, 512, boardH);

      for (let s = 0; s < 42; s++) {
        const gy = y0 + ((s + 0.5) / 42) * boardH;
        const wave = Math.sin(s * 1.7 + row * 2.3) * 0.5 + 0.5;
        ctx2d.strokeStyle =
          wave > 0.5
            ? 'rgba(196, 170, 128, 0.28)'
            : 'rgba(245, 234, 212, 0.24)';
        ctx2d.lineWidth = 1.2;
        ctx2d.beginPath();
        ctx2d.moveTo(0, gy);
        ctx2d.bezierCurveTo(
          170,
          gy + Math.sin(row + s) * 1.6,
          340,
          gy - Math.cos(row + s) * 1.6,
          512,
          gy
        );
        ctx2d.stroke();
      }

      for (let k = 0; k < 2; k++) {
        const kx = ((row * 137 + k * 241 + 65) % 450) + 30;
        const ky = y0 + boardH * (0.28 + ((row + k) % 2) * 0.42);
        const krx = 7 + ((row + k) % 3) * 2.5;
        const kry = 3.5 + ((row * k) % 2) * 1.5;

        ctx2d.strokeStyle = 'rgba(182, 152, 110, 0.45)';
        ctx2d.lineWidth = 1.4;
        ctx2d.beginPath();
        ctx2d.ellipse(kx, ky, krx * 1.6, kry * 1.45, 0, 0, Math.PI * 2);
        ctx2d.stroke();

        ctx2d.fillStyle = 'rgba(148, 114, 74, 0.62)';
        ctx2d.beginPath();
        ctx2d.ellipse(kx, ky, krx, kry, 0, 0, Math.PI * 2);
        ctx2d.fill();
      }

      ctx2d.fillStyle = '#9a8466';
      ctx2d.fillRect(0, y0, 512, 2.2);
      bCtx.fillStyle = '#2e2e2e';
      bCtx.fillRect(0, y0, 512, 2.5);

      const buttX = ((row * 193 + 85) % 420) + 45;
      ctx2d.fillStyle = '#a38d6e';
      ctx2d.fillRect(buttX, y0, 1.8, boardH);
      bCtx.fillStyle = '#404040';
      bCtx.fillRect(buttX, y0, 2.0, boardH);
    }
  }

  const colorTex = new THREE.CanvasTexture(c);
  colorTex.colorSpace = THREE.SRGBColorSpace;
  colorTex.wrapS = THREE.RepeatWrapping;
  colorTex.wrapT = THREE.RepeatWrapping;
  colorTex.repeat.set(loftLenU / 2.2, loftSpanV / 1.2);

  const bumpTex = new THREE.CanvasTexture(b);
  bumpTex.wrapS = THREE.RepeatWrapping;
  bumpTex.wrapT = THREE.RepeatWrapping;
  bumpTex.repeat.set(loftLenU / 2.2, loftSpanV / 1.2);

  cachedPineFloorTextures = { colorTex, bumpTex };
  return cachedPineFloorTextures;
}

function createCallawayPanelTexture(): THREE.CanvasTexture {
  if (cachedCallawayPanelTexture) {
    return cachedCallawayPanelTexture;
  }
  const callawayCanvas = document.createElement('canvas');
  callawayCanvas.width = 512;
  callawayCanvas.height = 512;
  const cCtx = callawayCanvas.getContext('2d')!;
  cCtx.fillStyle = '#f4f6f9';
  cCtx.fillRect(0, 0, 512, 512);
  cCtx.fillStyle = '#0d1b33';
  cCtx.fillRect(0, 0, 512, 76);
  cCtx.fillRect(0, 420, 512, 92);
  cCtx.fillStyle = '#1864ab';
  cCtx.beginPath();
  cCtx.moveTo(0, 110);
  cCtx.lineTo(512, 68);
  cCtx.lineTo(512, 108);
  cCtx.lineTo(0, 148);
  cCtx.closePath();
  cCtx.fill();
  cCtx.fillStyle = '#d4af37';
  cCtx.fillRect(0, 412, 512, 8);
  cCtx.strokeStyle = '#0d1b33';
  cCtx.lineWidth = 14;
  cCtx.beginPath();
  cCtx.moveTo(206, 210);
  cCtx.lineTo(256, 174);
  cCtx.lineTo(306, 210);
  cCtx.stroke();
  cCtx.fillStyle = '#0d1b33';
  cCtx.font = 'italic 900 66px Georgia, Times New Roman, serif';
  cCtx.textAlign = 'center';
  cCtx.textBaseline = 'middle';
  cCtx.fillText('Callaway', 256, 272);
  cCtx.fillStyle = '#1864ab';
  cCtx.font = 'bold 26px Arial, sans-serif';
  cCtx.fillText('PARADYM  Ai  SMOKE', 256, 344);

  const callawayPanelTex = new THREE.CanvasTexture(callawayCanvas);
  callawayPanelTex.colorSpace = THREE.SRGBColorSpace;
  cachedCallawayPanelTexture = callawayPanelTex;
  return callawayPanelTex;
}

export function renderTrackManControlScreenShotState(
  shotIndex: number,
  flightProgress: number
): void {
  if (!cachedTrackManControlScreenCanvas) return;
  const tmCtx = cachedTrackManControlScreenCanvas.getContext('2d');
  if (!tmCtx) return;

  const shot =
    GOLF_SIM_SHOT_PROFILES[
      ((shotIndex % GOLF_SIM_SHOT_PROFILES.length) +
        GOLF_SIM_SHOT_PROFILES.length) %
        GOLF_SIM_SHOT_PROFILES.length
    ]!;
  const p = Math.max(0, Math.min(1, flightProgress));

  const bg = tmCtx.createLinearGradient(0, 0, 0, 288);
  bg.addColorStop(0, '#0f1722');
  bg.addColorStop(1, '#182434');
  tmCtx.fillStyle = bg;
  tmCtx.fillRect(0, 0, 512, 288);

  // TrackMan Orange Top Header Bar
  tmCtx.fillStyle = '#ff6b00';
  tmCtx.fillRect(0, 0, 512, 34);
  tmCtx.fillStyle = '#ffffff';
  tmCtx.font = 'bold 14px sans-serif';
  tmCtx.fillText(`TRACKMAN iO // ${shot.clubName}`, 14, 22);

  // Left 3D Fairway Dispersion & Trajectory View
  tmCtx.fillStyle = '#1b3d28';
  tmCtx.fillRect(14, 46, 268, 156);
  tmCtx.strokeStyle = '#2e6b44';
  tmCtx.lineWidth = 1.5;
  tmCtx.strokeRect(14, 46, 268, 156);

  // Fairway centerline & target green circle
  tmCtx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  tmCtx.lineWidth = 1;
  tmCtx.beginPath();
  tmCtx.moveTo(148, 196);
  tmCtx.lineTo(148, 52);
  tmCtx.stroke();

  const endX = 148 + shot.endOffsetXFrac * 420;
  const endY = 74 + shot.endOffsetYFrac * 240;
  const ctrlX = 148 + shot.ctrlOffsetXFrac * 480;
  const ctrlY = 44 + (shot.ctrlApexYFrac - 0.18) * 160;

  tmCtx.strokeStyle = 'rgba(120, 235, 150, 0.45)';
  tmCtx.lineWidth = 1.5;
  tmCtx.beginPath();
  tmCtx.arc(endX, endY, 12, 0, Math.PI * 2);
  tmCtx.stroke();

  if (p > 0.005) {
    const steps = 28;
    const maxStep = Math.max(1, Math.round(steps * p));
    tmCtx.strokeStyle = '#ff6b00';
    tmCtx.lineWidth = 3.5;
    tmCtx.beginPath();
    let ballX = 148;
    let ballY = 194;
    for (let i = 0; i <= maxStep; i++) {
      const t = (i / steps) * Math.min(1, p / 0.84);
      const inv = 1 - t;
      const bx = inv * inv * 148 + 2 * inv * t * ctrlX + t * t * endX;
      const by = inv * inv * 194 + 2 * inv * t * ctrlY + t * t * endY;
      if (i === 0) tmCtx.moveTo(bx, by);
      else tmCtx.lineTo(bx, by);
      ballX = bx;
      ballY = by;
    }
    tmCtx.stroke();

    tmCtx.fillStyle = '#ffffff';
    tmCtx.beginPath();
    tmCtx.arc(ballX, ballY, 4.2, 0, Math.PI * 2);
    tmCtx.fill();
  }

  const carryVal =
    p >= 0.98
      ? shot.carryYds.toFixed(1)
      : (shot.carryYds * Math.min(1, p / 0.84)).toFixed(1);
  const totalVal =
    p >= 0.98
      ? shot.totalYds.toFixed(1)
      : (shot.totalYds * p).toFixed(1);

  // Right Telemetry Data Tiles
  const metrics: ReadonlyArray<readonly [string, string, number, number]> = [
    ['CLUB SPEED', `${shot.clubSpeedMph.toFixed(1)} mph`, 296, 46],
    ['BALL SPEED', `${shot.ballSpeedMph.toFixed(1)} mph`, 404, 46],
    ['SMASH FACTOR', shot.smashFactor, 296, 126],
    ['LAUNCH ANGLE', `${shot.launchAngleDeg.toFixed(1)} deg`, 404, 126],
    ['SPIN RATE', `${shot.spinRateRpm} rpm`, 14, 212],
    ['CARRY', `${carryVal} yds`, 180, 212],
    ['TOTAL', `${totalVal} yds`, 346, 212],
  ];
  for (const [label, val, mx, my] of metrics) {
    const tileW = my > 200 ? 152 : 96;
    const tileH = 66;
    tmCtx.fillStyle = '#1e2c3e';
    tmCtx.fillRect(mx, my, tileW, tileH);
    tmCtx.strokeStyle = '#324863';
    tmCtx.lineWidth = 1.5;
    tmCtx.strokeRect(mx, my, tileW, tileH);
    tmCtx.fillStyle = '#90a4ae';
    tmCtx.font = 'bold 10px sans-serif';
    tmCtx.fillText(label, mx + 8, my + 18);
    tmCtx.fillStyle = '#ff9100';
    tmCtx.font = 'bold 16px monospace';
    tmCtx.fillText(val, mx + 8, my + 48);
  }

  if (cachedTrackManControlScreenTexture) {
    cachedTrackManControlScreenTexture.needsUpdate = true;
  }
}

function createTrackManControlScreenTexture(): THREE.CanvasTexture {
  if (cachedTrackManControlScreenTexture) {
    return cachedTrackManControlScreenTexture;
  }
  const tmCtrlCanvas = document.createElement('canvas');
  tmCtrlCanvas.width = 512;
  tmCtrlCanvas.height = 288;
  cachedTrackManControlScreenCanvas = tmCtrlCanvas;
  const tmCtrlTex = new THREE.CanvasTexture(tmCtrlCanvas);
  tmCtrlTex.colorSpace = THREE.SRGBColorSpace;
  cachedTrackManControlScreenTexture = tmCtrlTex;
  renderTrackManControlScreenShotState(1, 1.0);
  return tmCtrlTex;
}

export function buildBarnGolfSimulatorPropsAndLoft(
  groundGroup: THREE.Group,
  uWallMax: number,
  barnWestFloorY: number,
  plasterMat: THREE.Material,
  enclosure: BarnGolfSimulatorEnclosureHandles,
  interactions?: SceneBuilderContext['interactions']
): {
  readonly ladderGroup: THREE.Group;
  readonly controlGroup: THREE.Group;
} {
  const {
    simGroup,
    simCeilingGroup,
    simCenterV,
    wallBoxH,
    frontLenX,
    velvetFrameMat,
    trackManOrangeMat,
    impactScreenMat,
    screenTex,
    artworkTex,
    ledDiffuserMat,
    statusSignFaceMat,
    statusBeaconRedMat,
    rearFairwayTurf,
    screenMesh,
    hingeAssy,
    foldingMatGroup,
    teedBall,
    clubSwingPivot,
    launchStreakMesh,
    screenImpactRing,
  } = enclosure;

  const loftLenU = 2.69; // u = 12.31m .. 15.00m (butts flush against the West face of the 200mm steel header beam at u = 15.00m!)
  const loftSpanV = 4.188; // v = 1.24m .. 5.428m (0.96m North corridor v = 0.28m..1.24m)
  const localLoftX = 13.655 - uWallMax; // -1.545m
  const localLoftZ = 3.334 - simCenterV; // -0.045m
  const loftSubfloorH = 0.072; // y = 2.52m .. 2.592m
  const loftOakDeckH = 0.018; // y = 2.592m .. 2.610m (exact top surface y = 2.61m!)

  const storeRoofLid = new THREE.Mesh(
    new THREE.BoxGeometry(loftLenU, loftSubfloorH, loftSpanV),
    plasterMat
  );
  storeRoofLid.name = 'outbuildings.barn.golfSimulator.roofLid';
  storeRoofLid.userData.isArchitecturalShell = true;
  storeRoofLid.position.set(localLoftX, wallBoxH + loftSubfloorH * 0.5, localLoftZ);
  storeRoofLid.castShadow = true;
  storeRoofLid.receiveShadow = true;
  simCeilingGroup.add(storeRoofLid);

  const { colorTex: pineColorTex, bumpTex: pineBumpTex } =
    getPlainUnvarnishedPineFloorTextures(loftLenU, loftSpanV);
  const plainUnvarnishedPineFloorMat = new THREE.MeshStandardMaterial({
    color: 0xf5efe2,
    map: pineColorTex,
    bumpMap: pineBumpTex,
    bumpScale: 0.0035,
    roughness: 0.84,
    metalness: 0.0,
  });

  const loftOakTrimMat = new THREE.MeshStandardMaterial({
    color: 0xd6c19b,
    roughness: 0.78,
    metalness: 0.0,
  });
  const loftSteelMat = new THREE.MeshStandardMaterial({
    color: 0x1e2228,
    roughness: 0.34,
    metalness: 0.72,
  });

  const loftOakFloorDeck = new THREE.Mesh(
    new THREE.BoxGeometry(loftLenU, loftOakDeckH, loftSpanV),
    plainUnvarnishedPineFloorMat
  );
  loftOakFloorDeck.name = 'outbuildings.store.loftFloor';
  loftOakFloorDeck.userData.isArchitecturalShell = true;
  loftOakFloorDeck.position.set(
    localLoftX,
    wallBoxH + loftSubfloorH + loftOakDeckH * 0.5,
    localLoftZ
  );
  loftOakFloorDeck.castShadow = true;
  loftOakFloorDeck.receiveShadow = true;
  simCeilingGroup.add(loftOakFloorDeck);

  const northLoftEdgeZ = 1.24 - simCenterV; // -1.94m
  const loftNorthFascia = new THREE.Mesh(
    new THREE.BoxGeometry(loftLenU, loftSubfloorH + loftOakDeckH, 0.02),
    loftOakTrimMat
  );
  loftNorthFascia.name = 'outbuildings.store.loftFloor.nosing';
  loftNorthFascia.position.set(
    localLoftX,
    wallBoxH + (loftSubfloorH + loftOakDeckH) * 0.5,
    northLoftEdgeZ + 0.008
  );
  loftNorthFascia.castShadow = true;
  simCeilingGroup.add(loftNorthFascia);

  const loftTopLocalY = wallBoxH + loftSubfloorH + loftOakDeckH; // 2.95m (world y = 2.61m)
  const guardRailH = 0.91; // Part K compliant >= 900mm internal loft guardrail height
  const guardZ = northLoftEdgeZ + 0.035; // v = 1.215m
  for (const [segName, xMin, xMax] of [
    ['west', 12.34 - uWallMax, 13.92 - uWallMax],
    ['east', 14.50 - uWallMax, 14.94 - uWallMax],
  ] as const) {
    const segLen = xMax - xMin;
    const segMidX = (xMin + xMax) * 0.5;
    const topRail = new THREE.Mesh(
      new THREE.BoxGeometry(segLen + 0.03, 0.038, 0.048),
      loftOakTrimMat
    );
    topRail.name = `outbuildings.store.loftGuardrail.${segName}`;
    topRail.position.set(segMidX, loftTopLocalY + guardRailH, guardZ);
    topRail.castShadow = true;
    simCeilingGroup.add(topRail);

    const midKneeRail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, segLen, 10),
      loftSteelMat
    );
    midKneeRail.name = `outbuildings.store.loftGuardrail.${segName}.kneeRail`;
    midKneeRail.rotation.z = Math.PI / 2;
    midKneeRail.position.set(segMidX, loftTopLocalY + guardRailH * 0.52, guardZ);
    simCeilingGroup.add(midKneeRail);

    const postXList =
      segName === 'west'
        ? [xMin + 0.02, (xMin + xMax) * 0.5, xMax - 0.02]
        : [xMin + 0.02, xMax - 0.02];
    for (const [postIdx, px] of postXList.entries()) {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.034, guardRailH, 0.034),
        loftSteelMat
      );
      post.name = `outbuildings.store.loftGuardrail.${segName}.post.${postIdx + 1}`;
      post.position.set(px, loftTopLocalY + guardRailH * 0.5, guardZ);
      post.castShadow = true;
      simCeilingGroup.add(post);
    }
  }

  // Issue #1 ("add some led lights on both sides of the roof" at `[-8.356, 2.61, 19.463]`, `outbuildings.store.loftFloor`):
  // Architectural Linear LED Batten / Strip Lights mounted along BOTH sides (North slope & South slope)
  // of the Store Loft pitched roof (`u = 12.48m..14.79m`, `localLoftX = -1.565m`), tilted parallel to the
  // 27.65° (`0.4826 rad`) roof slopes!
  const loftRoofLedGroup = new THREE.Group();
  loftRoofLedGroup.name = 'outbuildings.store.loftRoofLedLights';
  loftRoofLedGroup.userData.zone = 'courtyard';
  simCeilingGroup.add(loftRoofLedGroup);

  const ledChannelMat = new THREE.MeshStandardMaterial({
    color: 0x22262c,
    roughness: 0.34,
    metalness: 0.74,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });
  const ledBrassEndcapMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.26,
    metalness: 0.84,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });
  const ledWarmDiffuserMat = new THREE.MeshStandardMaterial({
    color: 0xfffaf0,
    emissive: new THREE.Color(0xffe1a8),
    emissiveIntensity: 2.35,
    roughness: 0.16,
    metalness: 0.02,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });

  const roofPitchRad = Math.atan2(4.269 - 2.92, 2.575); // 0.4826 rad (27.65°)
  const battenLenU = 2.26; // spans u = 12.505m .. 14.765m across the 2.65m Store Loft bay
  const roofSlopeLeds: ReadonlyArray<{
    readonly sideName: 'north' | 'south';
    readonly localY: number;
    readonly localZ: number;
    readonly rotX: number;
  }> = [
    // Issue #1 ("only 1 light on each side up here 4 is overkill" at `[-9.258, 2.61, 18.314]`):
    // 1 linear LED batten centered on the North roof slope and 1 centered on the South roof slope.
    { sideName: 'north', localY: 3.96, localZ: 1.72 - simCenterV, rotX: roofPitchRad },
    { sideName: 'south', localY: 3.96, localZ: 3.99 - simCenterV, rotX: -roofPitchRad },
  ];

  for (const spec of roofSlopeLeds) {
    const batten = new THREE.Group();
    batten.name = `outbuildings.store.loftRoofLedLights.${spec.sideName}`;
    batten.position.set(localLoftX, spec.localY, spec.localZ);
    batten.rotation.x = spec.rotX;
    loftRoofLedGroup.add(batten);

    const extrusionHousing = new THREE.Mesh(
      new THREE.BoxGeometry(battenLenU, 0.022, 0.038),
      ledChannelMat
    );
    extrusionHousing.name = `outbuildings.store.loftRoofLedLights.${spec.sideName}.housing`;
    extrusionHousing.position.set(0, 0.008, 0);
    batten.add(extrusionHousing);

    const opalDiffuser = new THREE.Mesh(
      new THREE.BoxGeometry(battenLenU - 0.016, 0.014, 0.03),
      ledWarmDiffuserMat
    );
    opalDiffuser.name = `outbuildings.store.loftRoofLedLights.${spec.sideName}.diffuser`;
    opalDiffuser.position.set(0, -0.004, 0);
    batten.add(opalDiffuser);

    for (const endSign of [-1, 1] as const) {
      const endCap = new THREE.Mesh(
        new THREE.BoxGeometry(0.01, 0.026, 0.042),
        ledBrassEndcapMat
      );
      endCap.name = `outbuildings.store.loftRoofLedLights.${spec.sideName}.endCap.${endSign < 0 ? 'west' : 'east'}`;
      endCap.position.set(endSign * (battenLenU * 0.5 + 0.002), 0.006, 0);
      batten.add(endCap);
    }
  }

  for (const [lightTag, lz] of [
    ['northLight', 1.75 - simCenterV],
    ['southLight', 3.96 - simCenterV],
  ] as const) {
    const roofLedLight = new THREE.PointLight(0xffe6b8, 1.45, 4.8, 1.5);
    roofLedLight.name = `outbuildings.store.loftRoofLedLights.${lightTag}`;
    roofLedLight.position.set(localLoftX, 3.72, lz);
    loftRoofLedGroup.add(roofLedLight);
  }

  // 9 Clear Polypropylene Latching Storage Tote Boxes Full of Stuff (`outbuildings.store.loftStorageBoxes`)
  const loftStorageGroup = new THREE.Group();
  loftStorageGroup.name = 'outbuildings.store.loftStorageBoxes';
  loftStorageGroup.position.set(0, loftTopLocalY, 0);
  simCeilingGroup.add(loftStorageGroup);

  const clearToteTubMat = new THREE.MeshStandardMaterial({
    color: 0xeaf2f8,
    roughness: 0.14,
    metalness: 0.04,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const frostedLidMat = new THREE.MeshStandardMaterial({
    color: 0xf0f4f8,
    roughness: 0.28,
    metalness: 0.04,
    transparent: true,
    opacity: 0.72,
  });
  const blueLatchMat = new THREE.MeshStandardMaterial({
    color: 0x1e4d7b,
    roughness: 0.36,
    metalness: 0.12,
  });
  const slateLatchMat = new THREE.MeshStandardMaterial({
    color: 0x2c343f,
    roughness: 0.38,
    metalness: 0.15,
  });
  const labelWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xfaf8f2,
    roughness: 0.65,
    metalness: 0.0,
  });

  // Materials for items packed visibly inside the clear storage boxes
  const itemCrimsonMat = new THREE.MeshStandardMaterial({ color: 0xc92a2a, roughness: 0.35, metalness: 0.25 });
  const itemGoldMat = new THREE.MeshStandardMaterial({ color: 0xe6b422, roughness: 0.28, metalness: 0.65 });
  const itemEmeraldMat = new THREE.MeshStandardMaterial({ color: 0x2b6e3f, roughness: 0.55, metalness: 0.1 });
  const itemNavyFabricMat = new THREE.MeshStandardMaterial({ color: 0x1d3557, roughness: 0.85, metalness: 0.02 });
  const itemCreamKnitMat = new THREE.MeshStandardMaterial({ color: 0xe9e2d0, roughness: 0.88, metalness: 0.0 });
  const itemOchreMat = new THREE.MeshStandardMaterial({ color: 0xd97724, roughness: 0.62, metalness: 0.05 });
  const itemTealMat = new THREE.MeshStandardMaterial({ color: 0x2a9d8f, roughness: 0.58, metalness: 0.06 });
  const itemCardboardMat = new THREE.MeshStandardMaterial({ color: 0xb88b58, roughness: 0.78, metalness: 0.02 });
  const itemCharcoalCableMat = new THREE.MeshStandardMaterial({ color: 0x22262b, roughness: 0.48, metalness: 0.2 });

  const addClearStorageBox = (
    boxId: number,
    lx: number,
    ly: number,
    lz: number,
    rotY: number,
    w: number,
    h: number,
    d: number,
    contentKind: 'xmas' | 'linens' | 'books' | 'camping' | 'cables' | 'sports',
    useBlueLatches = true
  ): void => {
    const boxGrp = new THREE.Group();
    boxGrp.name = `outbuildings.store.loftStorageBox.${boxId}`;
    boxGrp.position.set(lx, ly, lz);
    boxGrp.rotation.y = rotY;
    loftStorageGroup.add(boxGrp);

    const wallThick = 0.008;
    const lidH = 0.024;
    const tubH = h - lidH;

    // 1. Packed Interior Contents (tagged lodTier: 'high', lodMaxDistance: 12)
    const contentsGrp = new THREE.Group();
    contentsGrp.name = `outbuildings.store.loftStorageBox.${boxId}.contents`;
    contentsGrp.userData = { lodTier: 'high', lodMaxDistance: 12 };
    contentsGrp.position.set(0, wallThick, 0);
    boxGrp.add(contentsGrp);

    const inW = w - 0.05;
    const inD = d - 0.05;
    const inH = tubH - 0.025;

    if (contentKind === 'xmas') {
      const feltBase = new THREE.Mesh(
        new THREE.BoxGeometry(inW * 0.92, inH * 0.34, inD * 0.9),
        itemEmeraldMat
      );
      feltBase.name = `outbuildings.store.loftStorageBox.${boxId}.contents.feltBase`;
      feltBase.userData = { lodTier: 'high', lodMaxDistance: 12 };
      feltBase.position.set(0, inH * 0.17, 0);
      contentsGrp.add(feltBase);

      const wreath = new THREE.Mesh(
        new THREE.TorusGeometry(Math.min(inW, inD) * 0.28, 0.036, 10, 18),
        itemEmeraldMat
      );
      wreath.name = `outbuildings.store.loftStorageBox.${boxId}.contents.wreath`;
      wreath.userData = { lodTier: 'high', lodMaxDistance: 12 };
      wreath.rotation.x = Math.PI / 2 - 0.18;
      wreath.position.set(-inW * 0.14, inH * 0.52, 0.01);
      contentsGrp.add(wreath);

      const baubleCoords: ReadonlyArray<readonly [number, number, number, THREE.Material]> = [
        [0.12, 0.48, -0.08, itemCrimsonMat],
        [0.18, 0.54, 0.04, itemGoldMat],
        [0.08, 0.58, 0.09, itemCrimsonMat],
        [-0.08, 0.62, -0.09, itemGoldMat],
        [-0.18, 0.50, 0.09, itemCrimsonMat],
        [0.02, 0.66, -0.02, itemGoldMat],
      ];
      for (const [bIdx, [bx, byFrac, bz, bMat]] of baubleCoords.entries()) {
        const bauble = new THREE.Mesh(
          new THREE.SphereGeometry(0.034, 12, 10),
          bMat
        );
        bauble.name = `outbuildings.store.loftStorageBox.${boxId}.contents.bauble.${bIdx + 1}`;
        bauble.userData = { lodTier: 'high', lodMaxDistance: 12 };
        bauble.position.set(bx, inH * byFrac, bz);
        contentsGrp.add(bauble);
      }
    } else if (contentKind === 'linens') {
      const layerMats = [itemNavyFabricMat, itemCreamKnitMat, itemCrimsonMat, itemTealMat] as const;
      for (let l = 0; l < 4; l++) {
        const lh = (inH * 0.84) / 4;
        const leftStack = new THREE.Mesh(
          new THREE.BoxGeometry(inW * 0.46, lh - 0.006, inD * 0.86),
          layerMats[l % layerMats.length]!
        );
        leftStack.name = `outbuildings.store.loftStorageBox.${boxId}.contents.linenStackLeft.${l + 1}`;
        leftStack.userData = { lodTier: 'high', lodMaxDistance: 12 };
        leftStack.position.set(-inW * 0.23, (l + 0.5) * lh, 0);
        contentsGrp.add(leftStack);

        const rightStack = new THREE.Mesh(
          new THREE.BoxGeometry(inW * 0.46, lh - 0.006, inD * 0.86),
          layerMats[(l + 1) % layerMats.length]!
        );
        rightStack.name = `outbuildings.store.loftStorageBox.${boxId}.contents.linenStackRight.${l + 1}`;
        rightStack.userData = { lodTier: 'high', lodMaxDistance: 12 };
        rightStack.position.set(inW * 0.23, (l + 0.5) * lh, 0);
        contentsGrp.add(rightStack);
      }
    } else if (contentKind === 'books') {
      const bookMats = [itemNavyFabricMat, itemCrimsonMat, itemCardboardMat, itemEmeraldMat, itemOchreMat, itemCreamKnitMat] as const;
      for (let b = 0; b < 7; b++) {
        const bw = (inW * 0.52) / 7;
        const bh = inH * (0.68 + (b % 3) * 0.08);
        const book = new THREE.Mesh(
          new THREE.BoxGeometry(bw - 0.005, bh, inD * 0.78),
          bookMats[b % bookMats.length]!
        );
        book.name = `outbuildings.store.loftStorageBox.${boxId}.contents.book.${b + 1}`;
        book.userData = { lodTier: 'high', lodMaxDistance: 12 };
        book.position.set(-inW * 0.44 + (b + 0.5) * bw, bh * 0.5, 0);
        contentsGrp.add(book);
      }
      for (let s = 0; s < 3; s++) {
        const album = new THREE.Mesh(
          new THREE.BoxGeometry(inW * 0.38, inH * 0.22, inD * 0.82),
          bookMats[(s + 2) % bookMats.length]!
        );
        album.name = `outbuildings.store.loftStorageBox.${boxId}.contents.album.${s + 1}`;
        album.userData = { lodTier: 'high', lodMaxDistance: 12 };
        album.position.set(inW * 0.24, (s + 0.5) * (inH * 0.24), 0);
        contentsGrp.add(album);
      }
    } else if (contentKind === 'camping') {
      const sleepingBag = new THREE.Mesh(
        new THREE.CylinderGeometry(inD * 0.28, inD * 0.28, inW * 0.56, 16),
        itemTealMat
      );
      sleepingBag.name = `outbuildings.store.loftStorageBox.${boxId}.contents.sleepingBag`;
      sleepingBag.userData = { lodTier: 'high', lodMaxDistance: 12 };
      sleepingBag.rotation.z = Math.PI / 2;
      sleepingBag.position.set(-inW * 0.16, inD * 0.28, -inD * 0.14);
      contentsGrp.add(sleepingBag);

      const gearPouch = new THREE.Mesh(
        new THREE.BoxGeometry(inW * 0.36, inH * 0.58, inD * 0.48),
        itemOchreMat
      );
      gearPouch.name = `outbuildings.store.loftStorageBox.${boxId}.contents.gearPouch`;
      gearPouch.userData = { lodTier: 'high', lodMaxDistance: 12 };
      gearPouch.position.set(inW * 0.24, inH * 0.29, 0.03);
      contentsGrp.add(gearPouch);

      const ropeCoil = new THREE.Mesh(
        new THREE.TorusGeometry(0.068, 0.022, 10, 16),
        itemCreamKnitMat
      );
      ropeCoil.name = `outbuildings.store.loftStorageBox.${boxId}.contents.ropeCoil`;
      ropeCoil.userData = { lodTier: 'high', lodMaxDistance: 12 };
      ropeCoil.rotation.x = Math.PI / 2;
      ropeCoil.position.set(-inW * 0.12, inH * 0.66, inD * 0.18);
      contentsGrp.add(ropeCoil);
    } else if (contentKind === 'cables') {
      const subBox = new THREE.Mesh(
        new THREE.BoxGeometry(inW * 0.44, inH * 0.52, inD * 0.78),
        itemCardboardMat
      );
      subBox.name = `outbuildings.store.loftStorageBox.${boxId}.contents.hardwareBox`;
      subBox.userData = { lodTier: 'high', lodMaxDistance: 12 };
      subBox.position.set(-inW * 0.22, inH * 0.26, 0);
      contentsGrp.add(subBox);

      const whiteCarton = new THREE.Mesh(
        new THREE.BoxGeometry(inW * 0.38, inH * 0.44, inD * 0.52),
        itemCreamKnitMat
      );
      whiteCarton.name = `outbuildings.store.loftStorageBox.${boxId}.contents.adapterCarton`;
      whiteCarton.userData = { lodTier: 'high', lodMaxDistance: 12 };
      whiteCarton.position.set(inW * 0.22, inH * 0.22, -inD * 0.12);
      contentsGrp.add(whiteCarton);

      for (const [cIdx, [cx, cy, cz, cMat]] of (
        [
          [inW * 0.18, inH * 0.58, 0.04, itemCharcoalCableMat],
          [-inW * 0.16, inH * 0.64, -0.03, itemCharcoalCableMat],
          [0.02, inH * 0.72, 0.06, blueLatchMat],
        ] as const
      ).entries()) {
        const coil = new THREE.Mesh(
          new THREE.TorusGeometry(0.065, 0.018, 10, 16),
          cMat
        );
        coil.name = `outbuildings.store.loftStorageBox.${boxId}.contents.cableCoil.${cIdx + 1}`;
        coil.userData = { lodTier: 'high', lodMaxDistance: 12 };
        coil.rotation.x = Math.PI / 2 + 0.15;
        coil.position.set(cx, cy, cz);
        contentsGrp.add(coil);
      }
    } else {
      const duffle = new THREE.Mesh(
        new THREE.BoxGeometry(inW * 0.54, inH * 0.52, inD * 0.76),
        itemNavyFabricMat
      );
      duffle.name = `outbuildings.store.loftStorageBox.${boxId}.contents.duffleBag`;
      duffle.userData = { lodTier: 'high', lodMaxDistance: 12 };
      duffle.position.set(-inW * 0.16, inH * 0.26, 0);
      contentsGrp.add(duffle);

      const orangeKit = new THREE.Mesh(
        new THREE.BoxGeometry(inW * 0.32, inH * 0.48, inD * 0.64),
        itemOchreMat
      );
      orangeKit.name = `outbuildings.store.loftStorageBox.${boxId}.contents.sportsKit`;
      orangeKit.userData = { lodTier: 'high', lodMaxDistance: 12 };
      orangeKit.position.set(inW * 0.26, inH * 0.24, 0);
      contentsGrp.add(orangeKit);

      for (const [bIdx, [bx, bz]] of (
        [
          [-0.08, -0.05],
          [0.02, 0.06],
          [0.12, -0.02],
        ] as const
      ).entries()) {
        const ball = new THREE.Mesh(
          new THREE.SphereGeometry(0.032, 12, 10),
          itemGoldMat
        );
        ball.name = `outbuildings.store.loftStorageBox.${boxId}.contents.ball.${bIdx + 1}`;
        ball.userData = { lodTier: 'high', lodMaxDistance: 12 };
        ball.position.set(bx, inH * 0.62, bz);
        contentsGrp.add(ball);
      }
    }

    // 2. Clear Polypropylene Tote Tub Body (`outbuildings.store.loftStorageBox.tub`)
    const tubMesh = new THREE.Mesh(
      new THREE.BoxGeometry(w, tubH, d),
      clearToteTubMat
    );
    tubMesh.name = 'outbuildings.store.loftStorageBox.tub';
    tubMesh.position.set(0, tubH * 0.5, 0);
    tubMesh.castShadow = true;
    tubMesh.receiveShadow = true;
    boxGrp.add(tubMesh);

    // 3. Snap-On Frosted Polypropylene Lid & Twin Side Clip Latches
    const lidMesh = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.014, lidH, d + 0.014),
      frostedLidMat
    );
    lidMesh.name = 'outbuildings.store.loftStorageBox.lid';
    lidMesh.position.set(0, tubH + lidH * 0.5, 0);
    lidMesh.castShadow = true;
    lidMesh.receiveShadow = true;
    boxGrp.add(lidMesh);

    const latchMat = useBlueLatches ? blueLatchMat : slateLatchMat;
    for (const sideX of [-1, 1] as const) {
      const clipLatch = new THREE.Mesh(
        new THREE.BoxGeometry(0.016, 0.044, d * 0.36),
        latchMat
      );
      clipLatch.name = 'outbuildings.store.loftStorageBox.latch';
      clipLatch.position.set(sideX * (w * 0.5 + 0.008), tubH, 0);
      boxGrp.add(clipLatch);
    }

    // Front adhesive white content label sticker
    const labelSticker = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.34, 0.056, 0.003),
      labelWhiteMat
    );
    labelSticker.name = `outbuildings.store.loftStorageBox.${boxId}.label`;
    labelSticker.userData = { lodTier: 'high', lodMaxDistance: 12 };
    labelSticker.position.set(0, tubH * 0.58, -d * 0.5 - 0.002);
    boxGrp.add(labelSticker);
  };

  addClearStorageBox(1, -0.58, 0.0, -1.07, -Math.PI / 2 + 0.04, 0.58, 0.34, 0.40, 'xmas', true);
  addClearStorageBox(2, -0.58, 0.34, -1.07, -Math.PI / 2 - 0.03, 0.54, 0.30, 0.38, 'linens', true);
  addClearStorageBox(3, -0.60, 0.0, -0.37, -Math.PI / 2 - 0.02, 0.58, 0.34, 0.40, 'books', false);
  addClearStorageBox(4, -0.60, 0.34, -0.37, -Math.PI / 2 + 0.05, 0.52, 0.28, 0.36, 'cables', false);
  addClearStorageBox(5, -0.58, 0.0, 0.33, -Math.PI / 2 + 0.03, 0.62, 0.36, 0.42, 'camping', true);
  addClearStorageBox(6, -0.72, 0.0, 1.43, Math.PI - 0.06, 0.60, 0.34, 0.40, 'linens', true);
  addClearStorageBox(7, -0.72, 0.34, 1.43, Math.PI + 0.04, 0.54, 0.30, 0.38, 'sports', true);
  addClearStorageBox(8, -1.78, 0.0, 1.68, Math.PI + 0.03, 0.58, 0.34, 0.40, 'cables', false);
  addClearStorageBox(9, -2.42, 0.0, 1.66, Math.PI - 0.04, 0.58, 0.34, 0.40, 'books', true);

  // High-LOD Callaway Tour Staff Golf Bag & 14-Club Set (`outbuildings.barn.golfSimulator.callawayTourBag`)
  const callawayPanelTex = createCallawayPanelTexture();

  const tourWhitePanelMat = new THREE.MeshStandardMaterial({
    map: callawayPanelTex,
    color: 0xffffff,
    roughness: 0.34,
    metalness: 0.08,
  });
  const tourNavyLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x0d1b33,
    roughness: 0.42,
    metalness: 0.1,
  });
  const tourBlackTrimMat = new THREE.MeshStandardMaterial({
    color: 0x17191d,
    roughness: 0.56,
    metalness: 0.08,
  });
  const tourBlueAccentMat = new THREE.MeshStandardMaterial({
    color: 0x1864ab,
    roughness: 0.32,
    metalness: 0.22,
  });
  const chromeClubMat = new THREE.MeshStandardMaterial({
    color: 0xe6ecf2,
    roughness: 0.14,
    metalness: 0.92,
  });
  const graphiteShaftMat = new THREE.MeshStandardMaterial({
    color: 0x262a30,
    roughness: 0.28,
    metalness: 0.64,
  });

  const bagGroup = new THREE.Group();
  bagGroup.name = 'outbuildings.barn.golfSimulator.callawayTourBag';
  bagGroup.position.set(0.9, 0.034, 1.68);
  bagGroup.rotation.y = -0.45;
  simGroup.add(bagGroup);

  const bagTiltGroup = new THREE.Group();
  bagTiltGroup.name = 'outbuildings.barn.golfSimulator.callawayTourBag.tiltFrame';
  bagTiltGroup.rotation.z = 0.05;
  bagGroup.add(bagTiltGroup);

  const baseBoot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.138, 0.132, 0.075, 24),
    tourBlackTrimMat
  );
  baseBoot.name = 'outbuildings.barn.golfSimulator.callawayTourBag.baseBoot';
  baseBoot.position.set(0, 0.0375, 0);
  baseBoot.castShadow = true;
  baseBoot.receiveShadow = true;
  bagTiltGroup.add(baseBoot);

  const bagCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.132, 0.126, 0.79, 28),
    tourNavyLeatherMat
  );
  bagCore.name = 'outbuildings.barn.golfSimulator.callawayTourBag';
  bagCore.position.set(0, 0.465, 0);
  bagCore.castShadow = true;
  bagCore.receiveShadow = true;
  bagTiltGroup.add(bagCore);

  for (const sideZ of [-1, 1] as const) {
    const sideBelly = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.68, 0.095),
      tourWhitePanelMat
    );
    sideBelly.name = 'outbuildings.barn.golfSimulator.callawayTourBag';
    sideBelly.position.set(0.01, 0.46, sideZ * 0.092);
    sideBelly.rotation.y = sideZ * 0.08;
    sideBelly.castShadow = true;
    sideBelly.receiveShadow = true;
    bagTiltGroup.add(sideBelly);

    const pipingBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.68, 12),
      tourBlueAccentMat
    );
    pipingBand.name = `outbuildings.barn.golfSimulator.callawayTourBag.piping.${sideZ < 0 ? 'left' : 'right'}`;
    pipingBand.position.set(0.115, 0.46, sideZ * 0.115);
    bagTiltGroup.add(pipingBand);
  }

  const frontBallPocket = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.36, 0.18),
    tourWhitePanelMat
  );
  frontBallPocket.name = 'outbuildings.barn.golfSimulator.callawayTourBag.frontBallPocket';
  frontBallPocket.position.set(-0.125, 0.28, 0);
  frontBallPocket.castShadow = true;
  bagTiltGroup.add(frontBallPocket);

  const upperValuablesPocket = new THREE.Mesh(
    new THREE.BoxGeometry(0.085, 0.22, 0.16),
    tourNavyLeatherMat
  );
  upperValuablesPocket.name = 'outbuildings.barn.golfSimulator.callawayTourBag.valuablesPocket';
  upperValuablesPocket.position.set(-0.118, 0.61, 0);
  upperValuablesPocket.castShadow = true;
  bagTiltGroup.add(upperValuablesPocket);

  const rearApparelPocket = new THREE.Mesh(
    new THREE.BoxGeometry(0.115, 0.64, 0.19),
    tourNavyLeatherMat
  );
  rearApparelPocket.name = 'outbuildings.barn.golfSimulator.callawayTourBag.apparelPocket';
  rearApparelPocket.position.set(0.128, 0.44, 0);
  rearApparelPocket.castShadow = true;
  bagTiltGroup.add(rearApparelPocket);

  const tourShoulderStrap = new THREE.Mesh(
    new THREE.BoxGeometry(0.048, 0.54, 0.095),
    tourBlueAccentMat
  );
  tourShoulderStrap.name = 'outbuildings.barn.golfSimulator.callawayTourBag.shoulderStrap';
  tourShoulderStrap.position.set(0.195, 0.52, 0);
  tourShoulderStrap.rotation.z = -0.14;
  tourShoulderStrap.castShadow = true;
  bagTiltGroup.add(tourShoulderStrap);

  const grabHandle = new THREE.Mesh(
    new THREE.TorusGeometry(0.055, 0.013, 10, 18, Math.PI),
    tourBlackTrimMat
  );
  grabHandle.name = 'outbuildings.barn.golfSimulator.callawayTourBag.grabHandle';
  grabHandle.rotation.z = -Math.PI / 2;
  grabHandle.position.set(0.135, 0.78, 0);
  bagTiltGroup.add(grabHandle);

  const topCuffTorus = new THREE.Mesh(
    new THREE.TorusGeometry(0.126, 0.022, 14, 28),
    tourBlackTrimMat
  );
  topCuffTorus.name = 'outbuildings.barn.golfSimulator.callawayTourBag.topCuff';
  topCuffTorus.rotation.x = Math.PI / 2;
  topCuffTorus.position.set(0, 0.865, 0);
  bagTiltGroup.add(topCuffTorus);

  for (const [dIdx, divX] of ([-0.045, 0.045] as const).entries()) {
    const divBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.03, 0.23),
      tourBlackTrimMat
    );
    divBar.name = `outbuildings.barn.golfSimulator.callawayTourBag.divider.${dIdx + 1}`;
    divBar.userData = { lodTier: 'high', lodMaxDistance: 12 };
    divBar.position.set(divX, 0.865, 0);
    bagTiltGroup.add(divBar);
  }
  const centerLengthDiv = new THREE.Mesh(
    new THREE.BoxGeometry(0.23, 0.03, 0.012),
    tourBlackTrimMat
  );
  centerLengthDiv.name = 'outbuildings.barn.golfSimulator.callawayTourBag.dividerCenter';
  centerLengthDiv.userData = { lodTier: 'high', lodMaxDistance: 12 };
  centerLengthDiv.position.set(0, 0.865, 0);
  bagTiltGroup.add(centerLengthDiv);

  const towelRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.024, 0.004, 10, 18),
    chromeClubMat
  );
  towelRing.name = 'outbuildings.barn.golfSimulator.callawayTourBag.towelRing';
  towelRing.userData = { lodTier: 'high', lodMaxDistance: 12 };
  towelRing.position.set(-0.04, 0.82, -0.145);
  bagTiltGroup.add(towelRing);

  const golfTowel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.036, 0.42, 12),
    tourWhitePanelMat
  );
  golfTowel.name = 'outbuildings.barn.golfSimulator.callawayTourBag.towel';
  golfTowel.position.set(-0.04, 0.59, -0.155);
  golfTowel.rotation.x = -0.06;
  golfTowel.castShadow = true;
  bagTiltGroup.add(golfTowel);

  const woodSpecs: ReadonlyArray<readonly [number, number, number, number, number]> = [
    [0.055, -0.045, 1.21, 0.056, 0.16],
    [0.062, 0.045, 1.15, 0.044, 0.14],
    [0.012, 0.065, 1.11, 0.04, 0.13],
    [0.015, -0.065, 1.07, 0.034, 0.11],
  ];
  for (const [wIdx, [wx, wz, topY, headR, headH]] of woodSpecs.entries()) {
    const shaftLen = topY - 0.82;
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.005, shaftLen, 10),
      graphiteShaftMat
    );
    shaft.name = `outbuildings.barn.golfSimulator.callawayTourBag.woodShaft.${wIdx + 1}`;
    shaft.position.set(wx, 0.82 + shaftLen * 0.5, wz);
    bagTiltGroup.add(shaft);

    const sockNeck = new THREE.Mesh(
      new THREE.CylinderGeometry(headR * 0.58, headR * 0.45, 0.11, 14),
      tourNavyLeatherMat
    );
    sockNeck.name = `outbuildings.barn.golfSimulator.callawayTourBag.headcoverSock.${wIdx + 1}`;
    sockNeck.position.set(wx, topY - headH - 0.03, wz);
    bagTiltGroup.add(sockNeck);

    const headcoverBody = new THREE.Mesh(
      new THREE.CylinderGeometry(headR * 0.88, headR, headH, 18),
      tourWhitePanelMat
    );
    headcoverBody.name = 'outbuildings.barn.golfSimulator.callawayTourBag.headcover';
    headcoverBody.position.set(wx + 0.012, topY - headH * 0.5, wz);
    headcoverBody.rotation.z = -0.22;
    headcoverBody.castShadow = true;
    bagTiltGroup.add(headcoverBody);

    const headcoverCrown = new THREE.Mesh(
      new THREE.SphereGeometry(headR * 0.88, 16, 12),
      tourBlueAccentMat
    );
    headcoverCrown.name = `outbuildings.barn.golfSimulator.callawayTourBag.headcoverCrown.${wIdx + 1}`;
    headcoverCrown.scale.set(1.15, 0.65, 1);
    headcoverCrown.position.set(wx + 0.022, topY - 0.01, wz);
    bagTiltGroup.add(headcoverCrown);
  }

  const ironPositions: ReadonlyArray<readonly [number, number, number, number]> = [
    [-0.035, -0.068, 1.04, 0.35],
    [-0.048, -0.025, 1.025, 0.12],
    [-0.042, 0.025, 1.01, -0.18],
    [-0.032, 0.068, 0.995, -0.42],
    [-0.078, -0.052, 0.98, 0.28],
    [-0.086, -0.012, 0.965, 0.05],
    [-0.084, 0.032, 0.95, -0.22],
    [-0.068, 0.065, 0.935, -0.48],
    [-0.095, -0.032, 0.92, 0.15],
  ];
  const sharedBagIronBladeGeo = createForgedIronBladeGeometry(
    0.074,
    0.015,
    0.042,
    0.0052,
    0.0095
  );
  const sharedBagHoselElbowGeo = new THREE.SphereGeometry(0.006, 12, 10);
  sharedBagHoselElbowGeo.computeBoundingSphere();

  for (const [iIdx, [ix, iz, iTopY, iRotY]] of ironPositions.entries()) {
    const sLen = iTopY - 0.82;
    const ironShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.0045, sLen, 8),
      chromeClubMat
    );
    ironShaft.name = `outbuildings.barn.golfSimulator.callawayTourBag.ironShaft.${iIdx + 1}`;
    ironShaft.position.set(ix, 0.82 + sLen * 0.5, iz);
    bagTiltGroup.add(ironShaft);

    const ironHeadGroup = new THREE.Group();
    ironHeadGroup.name = `outbuildings.barn.golfSimulator.callawayTourBag.ironHeadGroup.${iIdx + 1}`;
    ironHeadGroup.position.set(ix, iTopY, iz);
    ironHeadGroup.rotation.y = iRotY;
    bagTiltGroup.add(ironHeadGroup);

    const hosel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0058, 0.0052, 0.028, 12),
      chromeClubMat
    );
    hosel.name = `outbuildings.barn.golfSimulator.callawayTourBag.ironHosel.${iIdx + 1}`;
    hosel.userData = { lodTier: 'high', lodMaxDistance: 12 };
    hosel.position.set(0, 0.012, 0);
    ironHeadGroup.add(hosel);

    const hoselElbow = new THREE.Mesh(sharedBagHoselElbowGeo, chromeClubMat);
    hoselElbow.name = `outbuildings.barn.golfSimulator.callawayTourBag.ironHoselElbow.${iIdx + 1}`;
    hoselElbow.userData = { lodTier: 'high', lodMaxDistance: 12 };
    hoselElbow.position.set(0, 0.025, 0);
    ironHeadGroup.add(hoselElbow);

    const bladeHead = new THREE.Mesh(sharedBagIronBladeGeo, chromeClubMat);
    bladeHead.name = 'outbuildings.barn.golfSimulator.callawayTourBag.iron';
    bladeHead.position.set(0, 0.025, 0);
    bladeHead.rotation.order = 'YXZ';
    bladeHead.rotation.set(
      -0.34 - (iIdx % 4) * 0.06,
      -Math.PI * 0.5,
      Math.PI - 0.36
    );
    bladeHead.castShadow = true;
    ironHeadGroup.add(bladeHead);
  }

  const putterShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0055, 0.005, 0.18, 10),
    chromeClubMat
  );
  putterShaft.name = 'outbuildings.barn.golfSimulator.callawayTourBag.putterShaft';
  putterShaft.position.set(-0.092, 0.91, 0.012);
  bagTiltGroup.add(putterShaft);

  const putterHeadcover = new THREE.Mesh(
    new THREE.BoxGeometry(0.056, 0.042, 0.092),
    tourBlueAccentMat
  );
  putterHeadcover.name = 'outbuildings.barn.golfSimulator.callawayTourBag.putterHeadcover';
  putterHeadcover.position.set(-0.105, 1.005, 0.012);
  putterHeadcover.castShadow = true;
  bagTiltGroup.add(putterHeadcover);

  // Wall-Mounted Bespoke Matte-Anthracite Steel & Solid European Oak Loft Access Ladder (`outbuildings.store.loftLadder`)
  const ladderGroup = new THREE.Group();
  ladderGroup.name = 'outbuildings.store.loftLadder';
  ladderGroup.userData.zone = 'courtyard';
  ladderGroup.position.set(14.21, barnWestFloorY, 1.24);
  groundGroup.add(ladderGroup);

  const ladderClimbH = 2.95; // From hallway floor y = -0.34m to flat loft floor y = +2.61m
  const ladderSpanU = 0.44;  // Stile center-to-center width (`u = 13.99m .. 14.43m`)
  const ladderStileZ = -0.095; // Stands 9.5cm proud into the hallway (`v = 1.085m`)

  for (const sideX of [-1, 1] as const) {
    const sideLabel = sideX < 0 ? 'west' : 'east';
    const sx = sideX * (ladderSpanU * 0.5);

    const stileMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.026, ladderClimbH, 0.054),
      loftSteelMat
    );
    stileMesh.name = 'outbuildings.store.loftLadder.stile';
    stileMesh.position.set(sx, ladderClimbH * 0.5, ladderStileZ);
    stileMesh.castShadow = true;
    stileMesh.receiveShadow = true;
    ladderGroup.add(stileMesh);

    const footPad = new THREE.Mesh(
      new THREE.BoxGeometry(0.044, 0.016, 0.072),
      velvetFrameMat
    );
    footPad.name = `outbuildings.store.loftLadder.footPad.${sideLabel}`;
    footPad.position.set(sx, 0.008, ladderStileZ);
    ladderGroup.add(footPad);

    for (const [bIdx, bracketY] of ([0.22, 1.52, 2.72] as const).entries()) {
      const standOffArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.024, 0.036, Math.abs(ladderStileZ)),
        loftSteelMat
      );
      standOffArm.name = `outbuildings.store.loftLadder.standOffArm.${sideLabel}.${bIdx + 1}`;
      standOffArm.position.set(sx, bracketY, ladderStileZ * 0.5);
      ladderGroup.add(standOffArm);

      const wallFlange = new THREE.Mesh(
        new THREE.BoxGeometry(0.064, 0.076, 0.008),
        loftSteelMat
      );
      wallFlange.name = `outbuildings.store.loftLadder.wallFlange.${sideLabel}.${bIdx + 1}`;
      wallFlange.position.set(sx, bracketY, -0.004);
      ladderGroup.add(wallFlange);
    }

    const hoopPts = [
      new THREE.Vector3(sx, ladderClimbH, ladderStileZ),
      new THREE.Vector3(sx, ladderClimbH + 0.44, ladderStileZ),
      new THREE.Vector3(sx, ladderClimbH + 0.62, ladderStileZ + 0.06),
      new THREE.Vector3(sx, ladderClimbH + 0.62, 0.11),
      new THREE.Vector3(sx, ladderClimbH + 0.44, 0.16),
      new THREE.Vector3(sx, ladderClimbH, 0.16),
    ];
    const hoopCurve = new THREE.CatmullRomCurve3(hoopPts);
    const hoopMesh = new THREE.Mesh(
      new THREE.TubeGeometry(hoopCurve, 28, 0.015, 12, false),
      loftSteelMat
    );
    hoopMesh.name = 'outbuildings.store.loftLadder.grabRail';
    hoopMesh.castShadow = true;
    ladderGroup.add(hoopMesh);

    const loftDeckFlange = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.01, 14),
      loftSteelMat
    );
    loftDeckFlange.name = `outbuildings.store.loftLadder.loftDeckFlange.${sideLabel}`;
    loftDeckFlange.position.set(sx, ladderClimbH + 0.005, 0.16);
    ladderGroup.add(loftDeckFlange);
  }

  const numLadderRungs = 10;
  for (let r = 1; r <= numLadderRungs; r++) {
    const rungLocalY = r * 0.272;
    const rungMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, ladderSpanU - 0.016, 16),
      loftOakTrimMat
    );
    rungMesh.name = 'outbuildings.store.loftLadder.rung';
    rungMesh.rotation.z = Math.PI / 2;
    rungMesh.position.set(0, rungLocalY, ladderStileZ);
    rungMesh.castShadow = true;
    rungMesh.receiveShadow = true;
    ladderGroup.add(rungMesh);
  }

  let registeredMatDoorId: string | undefined;
  if (interactions) {
    interactions.registerClickableObject(ladderGroup, { isClimbableLadder: true });
    const { matDoorId } = interactions.registerFoldingGolfMat(
      simGroup,
      foldingMatGroup,
      new THREE.Vector3(0, 0, 0),
      bagGroup,
      new THREE.Vector3(-frontLenX, 0.034, 0),
      0,
      (isFolded) => {
        const nextTex = isFolded ? artworkTex : screenTex;
        impactScreenMat.map = nextTex;
        impactScreenMat.emissiveMap = nextTex;
        impactScreenMat.emissiveIntensity = isFolded ? 0.26 : 0.44;
        impactScreenMat.needsUpdate = true;

        // Turn the Golf Simulator bay LED rings & cove strips completely OFF when the mat is retracted!
        ledDiffuserMat.emissiveIntensity = isFolded ? 0.0 : 2.2;
        ledDiffuserMat.color.setHex(isFolded ? 0x2a2d34 : 0xfff3dc);
        ledDiffuserMat.needsUpdate = true;

        trackManOrangeMat.emissiveIntensity = isFolded ? 0.0 : 0.25;
        trackManOrangeMat.color.setHex(isFolded ? 0x4a2810 : 0xff6b00);
        trackManOrangeMat.needsUpdate = true;

        statusSignFaceMat.emissiveIntensity = isFolded ? 0.0 : 1.35;
        statusSignFaceMat.needsUpdate = true;
        statusBeaconRedMat.emissiveIntensity = isFolded ? 0.0 : 2.2;
        statusBeaconRedMat.color.setHex(isFolded ? 0x2a1414 : 0xff2418);
        statusBeaconRedMat.needsUpdate = true;
      }
    );
    registeredMatDoorId = matDoorId;
    interactions.registerClickableObject(rearFairwayTurf, { interactableId: matDoorId });
    interactions.registerClickableObject(screenMesh, { interactableId: matDoorId });
    for (const child of simGroup.children) {
      if (child.name.startsWith('outbuildings.barn.golfSimulator.turfMat.rearFixed')) {
        interactions.registerClickableObject(child, { interactableId: matDoorId });
      }
    }
    for (const child of hingeAssy.children) {
      interactions.registerClickableObject(child, { interactableId: matDoorId });
    }
  }

  // Wall-Mounted TrackMan Golf Simulator Control Computer Monitor & Console (`outbuildings.barn.golfSimulator.controlMonitor`)
  const controlGroup = new THREE.Group();
  controlGroup.name = 'outbuildings.barn.golfSimulator.controlMonitor';
  controlGroup.position.set(17.60, 0, 5.415);
  controlGroup.rotation.y = Math.PI;
  groundGroup.add(controlGroup);

  const consoleOakMat = new THREE.MeshStandardMaterial({
    color: 0xb88958,
    roughness: 0.42,
    metalness: 0.04,
  });
  const consoleAnthraciteMat = new THREE.MeshStandardMaterial({
    color: 0x1e2228,
    roughness: 0.34,
    metalness: 0.52,
  });
  const consoleAluminumMat = new THREE.MeshStandardMaterial({
    color: 0xd0d6de,
    roughness: 0.24,
    metalness: 0.86,
  });

  const shelfY = 0.365;
  const shelfW = 0.72;
  const shelfH = 0.032;
  const shelfD = 0.28;

  const consoleShelf = new THREE.Mesh(
    new THREE.BoxGeometry(shelfW, shelfH, shelfD),
    consoleOakMat
  );
  consoleShelf.name = 'outbuildings.barn.golfSimulator.controlMonitor.shelf';
  consoleShelf.position.set(0, shelfY, shelfD * 0.5);
  consoleShelf.castShadow = true;
  consoleShelf.receiveShadow = true;
  controlGroup.add(consoleShelf);

  const shelfFrontTrim = new THREE.Mesh(
    new THREE.BoxGeometry(shelfW + 0.004, 0.01, 0.008),
    consoleAnthraciteMat
  );
  shelfFrontTrim.name = 'outbuildings.barn.golfSimulator.controlMonitor.shelfTrim';
  shelfFrontTrim.position.set(0, shelfY, shelfD + 0.002);
  controlGroup.add(shelfFrontTrim);

  for (const [bIdx, bx] of ([-0.26, 0.26] as const).entries()) {
    const bracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.11, 0.22),
      consoleAnthraciteMat
    );
    bracket.name = `outbuildings.barn.golfSimulator.controlMonitor.shelfBracket.${bIdx + 1}`;
    bracket.position.set(bx, shelfY - 0.068, 0.11);
    controlGroup.add(bracket);
  }

  const deskPad = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.004, 0.21),
    velvetFrameMat
  );
  deskPad.name = 'outbuildings.barn.golfSimulator.controlMonitor.deskPad';
  deskPad.position.set(0, shelfY + shelfH * 0.5 + 0.002, 0.145);
  controlGroup.add(deskPad);

  const kbChassis = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.012, 0.115),
    consoleAluminumMat
  );
  kbChassis.name = 'outbuildings.barn.golfSimulator.controlMonitor.keyboard';
  kbChassis.userData = { lodTier: 'high', lodMaxDistance: 12 };
  kbChassis.position.set(-0.08, shelfY + shelfH * 0.5 + 0.01, 0.145);
  kbChassis.rotation.x = 0.06;
  kbChassis.castShadow = true;
  controlGroup.add(kbChassis);

  for (let row = 0; row < 5; row++) {
    const keyRow = new THREE.Mesh(
      new THREE.BoxGeometry(0.295, 0.005, 0.014),
      consoleAnthraciteMat
    );
    keyRow.name = `outbuildings.barn.golfSimulator.controlMonitor.keyboardRow.${row + 1}`;
    keyRow.userData = { lodTier: 'high', lodMaxDistance: 12 };
    keyRow.position.set(
      -0.08,
      shelfY + shelfH * 0.5 + 0.017,
      0.105 + row * 0.02
    );
    controlGroup.add(keyRow);
  }

  const simMouse = new THREE.Mesh(
    new THREE.BoxGeometry(0.058, 0.022, 0.098),
    consoleAnthraciteMat
  );
  simMouse.name = 'outbuildings.barn.golfSimulator.controlMonitor.mouse';
  simMouse.userData = { lodTier: 'high', lodMaxDistance: 12 };
  simMouse.position.set(0.16, shelfY + shelfH * 0.5 + 0.014, 0.145);
  simMouse.castShadow = true;
  controlGroup.add(simMouse);

  const rotaryPuck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.03, 0.018, 20),
    consoleAluminumMat
  );
  rotaryPuck.name = 'outbuildings.barn.golfSimulator.controlMonitor.rotaryDial';
  rotaryPuck.userData = { lodTier: 'high', lodMaxDistance: 12 };
  rotaryPuck.position.set(-0.29, shelfY + shelfH * 0.5 + 0.011, 0.145);
  controlGroup.add(rotaryPuck);

  const rotaryRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.028, 0.003, 8, 20),
    trackManOrangeMat
  );
  rotaryRing.name = 'outbuildings.barn.golfSimulator.controlMonitor.rotaryDialRing';
  rotaryRing.userData = { lodTier: 'high', lodMaxDistance: 12 };
  rotaryRing.rotation.x = Math.PI / 2;
  rotaryRing.position.set(-0.29, shelfY + shelfH * 0.5 + 0.019, 0.145);
  controlGroup.add(rotaryRing);

  const pcChassis = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.22, 0.115),
    consoleAnthraciteMat
  );
  pcChassis.name = 'outbuildings.barn.golfSimulator.controlMonitor.pcUnit';
  pcChassis.position.set(0, 0.18, 0.068);
  pcChassis.castShadow = true;
  controlGroup.add(pcChassis);

  const pcOrangeStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.008, 0.006),
    trackManOrangeMat
  );
  pcOrangeStrip.name = 'outbuildings.barn.golfSimulator.controlMonitor.pcUnit.accentStrip';
  pcOrangeStrip.position.set(0, 0.24, 0.127);
  controlGroup.add(pcOrangeStrip);

  const cableConduit = new THREE.Mesh(
    new THREE.BoxGeometry(0.036, 0.34, 0.016),
    consoleAnthraciteMat
  );
  cableConduit.name = 'outbuildings.barn.golfSimulator.controlMonitor.cableConduit';
  cableConduit.position.set(0, 0.51, 0.008);
  controlGroup.add(cableConduit);

  const tmCtrlTex = createTrackManControlScreenTexture();

  const monMountPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.12, 0.016),
    consoleAnthraciteMat
  );
  monMountPlate.name = 'outbuildings.barn.golfSimulator.controlMonitor.vesaPlate';
  monMountPlate.position.set(0, 0.68, 0.008);
  controlGroup.add(monMountPlate);

  const monArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.045, 0.085),
    consoleAnthraciteMat
  );
  monArm.name = 'outbuildings.barn.golfSimulator.controlMonitor.vesaArm';
  monArm.position.set(0, 0.68, 0.052);
  controlGroup.add(monArm);

  const monHeadGroup = new THREE.Group();
  monHeadGroup.name = 'outbuildings.barn.golfSimulator.controlMonitor.headGroup';
  monHeadGroup.position.set(0, 0.68, 0.095);
  monHeadGroup.rotation.x = -0.06;
  controlGroup.add(monHeadGroup);

  const monBezel = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.36, 0.022),
    consoleAnthraciteMat
  );
  monBezel.name = 'outbuildings.barn.golfSimulator.controlMonitor';
  monBezel.castShadow = true;
  monHeadGroup.add(monBezel);

  const monDisplayMat = new THREE.MeshStandardMaterial({
    map: tmCtrlTex,
    emissiveMap: tmCtrlTex,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.55,
    roughness: 0.18,
    metalness: 0.05,
  });
  monDisplayMat.userData = { isDynamicGolfScreen: true };

  const monDisplay = new THREE.Mesh(
    new THREE.PlaneGeometry(0.596, 0.336),
    monDisplayMat
  );
  monDisplay.name = 'outbuildings.barn.golfSimulator.controlMonitor.screen';
  monDisplay.position.set(0, 0, 0.012);
  monHeadGroup.add(monDisplay);

  if (interactions) {
    interactions.registerGolfSimulatorShot({
      clubSwingPivot,
      teedBall,
      screenMesh,
      launchStreakMesh,
      screenImpactRing,
      clickableTargets: [bagGroup, clubSwingPivot],
      matDoorId: registeredMatDoorId,
      onUpdateScreens: (shotIdx, progress) => {
        renderTrackManWidescreenShotState(shotIdx, progress);
        renderTrackManControlScreenShotState(shotIdx, progress);
      },
    });
  }

  return { ladderGroup, controlGroup };
}
