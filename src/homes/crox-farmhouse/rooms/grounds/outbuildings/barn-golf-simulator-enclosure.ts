import * as THREE from 'three';

let cachedTrackManWidescreenTexture: THREE.CanvasTexture | null = null;
let cachedGolfAstroturfTextures: {
  fairwayMap: THREE.CanvasTexture;
  hittingMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} | null = null;
let cachedFoldingMatOakFloorTextures: {
  readonly oakMap: THREE.CanvasTexture;
  readonly oakBumpMap: THREE.CanvasTexture;
} | null = null;
let cachedGolfSimArtworkTexture: THREE.CanvasTexture | null = null;
let cachedGolfStatusSignTexture: THREE.CanvasTexture | null = null;

/**
 * Generates a Widescreen (`16:10` / `4.48m x 2.80m`) TrackMan iO Virtual Golf 3 (VG3)
 * championship course projection texture featuring signature TrackMan Orange (`#ff6b00`)
 * telemetry data tiles, minimap, layered mountain ridges, botanical pine & oak tree line,
 * contoured fairway striping, water reflections, and sunlit championship green.
 */
export function createTrackManWidescreenTexture(): THREE.CanvasTexture {
  if (cachedTrackManWidescreenTexture) {
    return cachedTrackManWidescreenTexture;
  }
  const w = 1280;
  const h = 800;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // 1. Crisp summer sky gradient with warm horizon haze
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.48);
  skyGrad.addColorStop(0, '#2a62b5');
  skyGrad.addColorStop(0.5, '#649ed6');
  skyGrad.addColorStop(0.85, '#b8d7f2');
  skyGrad.addColorStop(1, '#dcebf8');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h * 0.5);

  // Layered soft cumulus clouds across the wide horizon
  for (const [cx, cy, rx, ry, alpha] of [
    [210, 118, 125, 28, 0.72],
    [285, 108, 90, 34, 0.82],
    [620, 134, 110, 24, 0.68],
    [680, 126, 78, 28, 0.76],
    [930, 102, 138, 26, 0.74],
    [1015, 92, 96, 32, 0.84],
  ] as const) {
    const cGrad = ctx.createLinearGradient(cx, cy - ry, cx, cy + ry);
    cGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    cGrad.addColorStop(0.7, `rgba(242, 247, 252, ${alpha * 0.88})`);
    cGrad.addColorStop(1, `rgba(195, 212, 230, ${alpha * 0.55})`);
    ctx.fillStyle = cGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Distant atmospheric mountain ridges & layered pine/oak woodland tree line
  ctx.fillStyle = '#5c7f99';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.46);
  for (let x = 0; x <= w; x += 24) {
    const ridgeH =
      Math.sin(x * 0.006 + 0.4) * 34 +
      Math.cos(x * 0.015 - 0.8) * 18 +
      Math.sin(x * 0.032) * 8;
    ctx.lineTo(x, h * 0.41 - Math.max(0, ridgeH));
  }
  ctx.lineTo(w, h * 0.48);
  ctx.lineTo(0, h * 0.48);
  ctx.closePath();
  ctx.fill();

  // Midground forested hills
  ctx.fillStyle = '#2d5938';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.47);
  for (let x = 0; x <= w; x += 20) {
    const hillH =
      Math.sin(x * 0.012 + 1.2) * 24 +
      Math.cos(x * 0.035) * 14 +
      Math.sin(x * 0.08) * 6;
    ctx.lineTo(x, h * 0.435 - Math.abs(hillH));
  }
  ctx.lineTo(w, h * 0.52);
  ctx.lineTo(0, h * 0.52);
  ctx.closePath();
  ctx.fill();

  // Detailed multi-tiered pine & broadleaf tree silhouettes along the woodland margin
  for (let i = 0; i < 68; i++) {
    const tx = (i / 67) * w;
    // Leave a natural fairway vista corridor around the central green (`w * 0.42..0.60`)
    const centerGap = Math.exp(-Math.pow((tx - w * 0.51) / (w * 0.14), 2));
    const baseTreeY = h * 0.455 - (1 - centerGap * 0.55) * (12 + Math.abs(Math.sin(i * 1.9)) * 22);
    const treeH = (26 + (i % 5) * 9) * (1 - centerGap * 0.42);

    // Trunk
    ctx.fillStyle = '#3b2d22';
    ctx.fillRect(tx - 1.5, baseTreeY - treeH * 0.25, 3, treeH * 0.35);

    if (i % 3 === 0) {
      // Layered coniferous pine tiers
      for (let tier = 0; tier < 4; tier++) {
        const ty = baseTreeY - treeH * (0.22 + tier * 0.2);
        const tw = (treeH * 0.48) * (1 - tier * 0.18);
        ctx.fillStyle = tier % 2 === 0 ? '#1b4226' : '#265432';
        ctx.beginPath();
        ctx.moveTo(tx, ty - treeH * 0.28);
        ctx.lineTo(tx - tw, ty);
        ctx.lineTo(tx + tw, ty);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      // Multi-lobe oak/broadleaf crown with sunlit top highlight & lower shadow
      const crownR = treeH * 0.36;
      const cy = baseTreeY - treeH * 0.55;
      for (const [ox, oy, rScale, col] of [
        [-crownR * 0.45, crownR * 0.15, 0.78, '#1a3d22'],
        [crownR * 0.45, crownR * 0.12, 0.82, '#214a2b'],
        [0, 0, 0.95, '#2b5c34'],
        [-crownR * 0.2, -crownR * 0.28, 0.72, '#3c7342'],
      ] as const) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.ellipse(tx + ox, cy + oy, crownR * rScale, crownR * rScale * 0.82, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // 3. Widescreen Rough & Contoured Mowed Fairway Perspective
  const roughGrad = ctx.createLinearGradient(0, h * 0.44, 0, h);
  roughGrad.addColorStop(0, '#3a7532');
  roughGrad.addColorStop(0.5, '#31652a');
  roughGrad.addColorStop(1, '#22491d');
  ctx.fillStyle = roughGrad;
  ctx.fillRect(0, h * 0.44, w, h * 0.56);

  const fwGrad = ctx.createLinearGradient(0, h * 0.46, 0, h);
  fwGrad.addColorStop(0, '#59aa46');
  fwGrad.addColorStop(0.6, '#4b983a');
  fwGrad.addColorStop(1, '#3c822d');
  ctx.fillStyle = fwGrad;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(w * 0.12, h);
  ctx.quadraticCurveTo(w * 0.26, h * 0.68, w * 0.35, h * 0.48);
  ctx.lineTo(w * 0.69, h * 0.48);
  ctx.quadraticCurveTo(w * 0.76, h * 0.68, w * 0.88, h);
  ctx.closePath();
  ctx.fill();
  ctx.clip();

  // Clipped diagonal & horizontal mowed fairway stripes
  for (let s = 0; s < 14; s++) {
    if (s % 2 === 0) continue;
    const y0 = h * 0.48 + (s / 14) * (h * 0.52);
    const y1 = h * 0.48 + ((s + 1) / 14) * (h * 0.52);
    ctx.fillStyle = 'rgba(148, 228, 112, 0.17)';
    ctx.fillRect(w * 0.1, y0, w * 0.8, y1 - y0);
  }
  ctx.restore();

  // Water hazard pond on left with stone/turf bank & sky reflections
  ctx.fillStyle = '#5c5242';
  ctx.beginPath();
  ctx.ellipse(w * 0.2, h * 0.578, 168, 41, -0.06, 0, Math.PI * 2);
  ctx.fill();

  const waterGrad = ctx.createLinearGradient(w * 0.08, h * 0.52, w * 0.36, h * 0.64);
  waterGrad.addColorStop(0, '#16467d');
  waterGrad.addColorStop(0.6, '#2673ba');
  waterGrad.addColorStop(1, '#4896dc');
  ctx.fillStyle = waterGrad;
  ctx.beginPath();
  ctx.ellipse(w * 0.2, h * 0.58, 164, 37, -0.06, 0, Math.PI * 2);
  ctx.fill();

  // Shimmering water surface ripples
  ctx.strokeStyle = 'rgba(210, 238, 255, 0.35)';
  ctx.lineWidth = 1.4;
  for (let r = 0; r < 9; r++) {
    const ry = h * 0.555 + r * 5.5;
    ctx.beginPath();
    ctx.moveTo(w * 0.11 + (r % 3) * 14, ry);
    ctx.lineTo(w * 0.27 - (r % 2) * 18, ry);
    ctx.stroke();
  }

  // Sculpted white sand bunkers with grass lip overhang & inner shadow gradient
  for (const [bx, by, brx, bry, ang] of [
    [w * 0.35, h * 0.51, 72, 18, -0.12],
    [w * 0.68, h * 0.52, 84, 21, 0.15],
    [w * 0.62, h * 0.47, 54, 14, -0.05],
  ] as const) {
    ctx.fillStyle = '#5c4d36';
    ctx.beginPath();
    ctx.ellipse(bx, by - 3.5, brx + 4.5, bry + 4.5, ang, 0, Math.PI * 2);
    ctx.fill();

    const sandGrad = ctx.createLinearGradient(bx, by - bry, bx, by + bry);
    sandGrad.addColorStop(0, '#d8ccb4');
    sandGrad.addColorStop(0.45, '#f4ecdc');
    sandGrad.addColorStop(1, '#e6dcc6');
    ctx.fillStyle = sandGrad;
    ctx.beginPath();
    ctx.ellipse(bx, by, brx, bry, ang, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Putting Green, Apron Collar, Pin Flag & TrackMan Orange Ball-Flight Tracer
  ctx.fillStyle = '#52b43d';
  ctx.beginPath();
  ctx.ellipse(w * 0.51, h * 0.49, 166, 30, 0, 0, Math.PI * 2);
  ctx.fill();

  const greenGrad = ctx.createLinearGradient(w * 0.38, h * 0.47, w * 0.64, h * 0.51);
  greenGrad.addColorStop(0, '#6cd152');
  greenGrad.addColorStop(0.5, '#7ae060');
  greenGrad.addColorStop(1, '#5ec446');
  ctx.fillStyle = greenGrad;
  ctx.beginPath();
  ctx.ellipse(w * 0.51, h * 0.49, 155, 26, 0, 0, Math.PI * 2);
  ctx.fill();

  const pinX = w * 0.52;
  const pinBaseY = h * 0.485;
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.ellipse(pinX, pinBaseY, 5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.8;
  ctx.beginPath();
  ctx.moveTo(pinX, pinBaseY);
  ctx.lineTo(pinX, pinBaseY - 76);
  ctx.stroke();

  ctx.fillStyle = '#ff6b00'; // TrackMan Orange Flag
  ctx.beginPath();
  ctx.moveTo(pinX, pinBaseY - 76);
  ctx.lineTo(pinX + 32, pinBaseY - 64);
  ctx.lineTo(pinX, pinBaseY - 52);
  ctx.closePath();
  ctx.fill();

  // Signature TrackMan Orange (#ff6b00) 3D shot tracer curve
  ctx.strokeStyle = '#ff6b00';
  ctx.lineWidth = 4.0;
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h * 0.92);
  ctx.quadraticCurveTo(w * 0.48, h * 0.18, pinX - 8, pinBaseY - 2);
  ctx.stroke();

  // 5. Authentic TrackMan Virtual Golf 3 Bottom Widescreen Telemetry Dock & Top-Left Brand Pill
  ctx.fillStyle = 'rgba(18, 20, 24, 0.86)';
  ctx.fillRect(28, 22, 220, 44);
  ctx.fillStyle = '#ff6b00';
  ctx.fillRect(28, 22, 8, 44);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('TRACKMAN iO', 48, 50);

  // Bottom 6-tile TrackMan Orange & Dark Slate Data Bar
  const barY = h - 88;
  const barH = 68;
  ctx.fillStyle = 'rgba(16, 18, 22, 0.88)';
  ctx.fillRect(40, barY, w - 80, barH);
  ctx.fillStyle = '#ff6b00';
  ctx.fillRect(40, barY, w - 80, 4);

  const tmTiles = [
    ['CLUB SPEED', '94.2', 'MPH'],
    ['BALL SPEED', '136.8', 'MPH'],
    ['SMASH FACTOR', '1.45', ''],
    ['LAUNCH ANGLE', '15.8', 'DEG'],
    ['SPIN RATE', '6,180', 'RPM'],
    ['CARRY', '184.5', 'YDS'],
    ['TOTAL', '196.2', 'YDS'],
  ] as const;

  const tileW = (w - 80) / tmTiles.length;
  ctx.textAlign = 'center';
  for (let i = 0; i < tmTiles.length; i++) {
    const [label, val, unit] = tmTiles[i]!;
    const cx = 40 + (i + 0.5) * tileW;
    ctx.fillStyle = '#9aa5b1';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(label, cx, barY + 21);
    ctx.fillStyle = i >= 5 ? '#ff6b00' : '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(val, cx, barY + 48);
    if (unit) {
      ctx.fillStyle = '#7b8794';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(unit, cx, barY + 62);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedTrackManWidescreenTexture = tex;
  return tex;
}

/**
 * Generates rich, high-resolution (`1024x1024`) procedural **Synthetic Golf Astroturf & Putting Green Turf Textures**.
 */
export function createGolfAstroturfTextures(): {
  fairwayMap: THREE.CanvasTexture;
  hittingMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  if (cachedGolfAstroturfTextures) {
    return cachedGolfAstroturfTextures;
  }
  const size = 1024;

  const fwCanvas = document.createElement('canvas');
  fwCanvas.width = size;
  fwCanvas.height = size;
  const fwCtx = fwCanvas.getContext('2d')!;

  fwCtx.fillStyle = '#1f592c';
  fwCtx.fillRect(0, 0, size, size);

  const numStripes = 8;
  const stripeW = size / numStripes;
  for (let s = 0; s < numStripes; s++) {
    fwCtx.fillStyle = s % 2 === 0 ? 'rgba(56, 130, 70, 0.16)' : 'rgba(20, 61, 29, 0.14)';
    fwCtx.fillRect(s * stripeW, 0, stripeW, size);
  }

  const borderW = 54;
  fwCtx.strokeStyle = 'rgba(20, 56, 26, 0.42)';
  fwCtx.lineWidth = borderW;
  fwCtx.strokeRect(borderW * 0.5, borderW * 0.5, size - borderW, size - borderW);

  const hitSize = 512;
  const hitCanvas = document.createElement('canvas');
  hitCanvas.width = hitSize;
  hitCanvas.height = hitSize;
  const hitCtx = hitCanvas.getContext('2d')!;
  hitCtx.fillStyle = '#194a23';
  hitCtx.fillRect(0, 0, hitSize, hitSize);

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = hitSize;
  bumpCanvas.height = hitSize;
  const bumpCtx = bumpCanvas.getContext('2d')!;
  const bumpImg = bumpCtx.createImageData(hitSize, hitSize);
  const bData = bumpImg.data;

  for (let y = 0; y < hitSize; y++) {
    for (let x = 0; x < hitSize; x++) {
      const idx = (y * hitSize + x) * 4;
      const h1 = Math.sin(x * 19.173 + y * 83.419) * 43758.5453;
      const f1 = h1 - Math.floor(h1);
      const h2 = Math.sin(x * 61.91 + y * 27.13) * 19283.713;
      const f2 = h2 - Math.floor(h2);
      const val = Math.max(0, Math.min(255, Math.round(90 + f1 * 110 + (f2 - 0.5) * 50)));
      bData[idx] = val;
      bData[idx + 1] = val;
      bData[idx + 2] = val;
      bData[idx + 3] = 255;
    }
  }
  bumpCtx.putImageData(bumpImg, 0, 0);

  const bladeColors = [
    '#143d1d',
    '#1f592c',
    '#276b36',
    '#2e783d',
    '#388246',
    '#1b4f26',
  ] as const;

  fwCtx.lineWidth = 1.6;
  for (let i = 0; i < 18000; i++) {
    const h1 = Math.sin(i * 12.9898 + 1.7) * 43758.5453;
    const f1 = h1 - Math.floor(h1);
    const h2 = Math.sin(i * 78.233 + 3.1) * 29183.127;
    const f2 = h2 - Math.floor(h2);
    const h3 = Math.sin(i * 41.137 + 7.3) * 17391.831;
    const f3 = h3 - Math.floor(h3);

    const bx = f1 * size;
    const by = f2 * size;
    const ang = f3 * Math.PI * 2;
    const bladeLen = 4.0 + (i % 5) * 1.4;
    fwCtx.strokeStyle = bladeColors[i % bladeColors.length]!;
    fwCtx.beginPath();
    fwCtx.moveTo(bx, by);
    fwCtx.lineTo(bx + Math.cos(ang) * bladeLen, by + Math.sin(ang) * bladeLen);
    fwCtx.stroke();
  }

  fwCtx.strokeStyle = 'rgba(235, 245, 238, 0.32)';
  fwCtx.lineWidth = 3;
  fwCtx.beginPath();
  fwCtx.moveTo(size * 0.22, size * 0.5);
  fwCtx.lineTo(size * 0.78, size * 0.5);
  fwCtx.stroke();

  fwCtx.beginPath();
  fwCtx.arc(size * 0.22, size * 0.5, 16, 0, Math.PI * 2);
  fwCtx.stroke();

  hitCtx.lineWidth = 1.8;
  for (let i = 0; i < 8000; i++) {
    const h1 = Math.sin(i * 17.391 + 2.3) * 43758.5453;
    const f1 = h1 - Math.floor(h1);
    const h2 = Math.sin(i * 63.719 + 5.9) * 29183.127;
    const f2 = h2 - Math.floor(h2);
    const h3 = Math.sin(i * 29.817 + 1.1) * 17391.831;
    const f3 = h3 - Math.floor(h3);

    const bx = f1 * hitSize;
    const by = f2 * hitSize;
    const ang = f3 * Math.PI * 2;
    const bladeLen = 4.5 + (i % 4) * 1.6;
    hitCtx.strokeStyle = bladeColors[(i + 1) % bladeColors.length]!;
    hitCtx.beginPath();
    hitCtx.moveTo(bx, by);
    hitCtx.lineTo(bx + Math.cos(ang) * bladeLen, by + Math.sin(ang) * bladeLen);
    hitCtx.stroke();
  }

  const fairwayMap = new THREE.CanvasTexture(fwCanvas);
  fairwayMap.colorSpace = THREE.SRGBColorSpace;
  fairwayMap.wrapS = THREE.RepeatWrapping;
  fairwayMap.wrapT = THREE.RepeatWrapping;
  fairwayMap.repeat.set(3, 4);

  const hittingMap = new THREE.CanvasTexture(hitCanvas);
  hittingMap.colorSpace = THREE.SRGBColorSpace;
  hittingMap.wrapS = THREE.RepeatWrapping;
  hittingMap.wrapT = THREE.RepeatWrapping;
  hittingMap.repeat.set(2, 4);

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(6, 8);

  cachedGolfAstroturfTextures = { fairwayMap, hittingMap, bumpMap };
  return cachedGolfAstroturfTextures;
}

/**
 * Generates a high-resolution (`1024x1024`) Wide-Plank Seasoned European Oak Wooden Floor texture
 * and plank-joint bump map for the **back side** of the hinged folding Golf Simulator mat
 * (`outbuildings.barn.golfSimulator.turfMat.woodenBackSide`).
 */
export function createFoldingMatOakFloorTextures(): {
  readonly oakMap: THREE.CanvasTexture;
  readonly oakBumpMap: THREE.CanvasTexture;
} {
  if (cachedFoldingMatOakFloorTextures) {
    return cachedFoldingMatOakFloorTextures;
  }
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  ctx.fillStyle = '#b78a58';
  ctx.fillRect(0, 0, size, size);
  bCtx.fillStyle = '#888888';
  bCtx.fillRect(0, 0, size, size);

  const numPlanks = 8;
  const plankH = size / numPlanks;
  const plankTones = [
    '#bc8f5c',
    '#ae8150',
    '#c49764',
    '#b58856',
    '#a97c4c',
    '#bf9260',
    '#b28553',
    '#c19462',
  ] as const;

  for (let p = 0; p < numPlanks; p++) {
    const y0 = p * plankH;
    ctx.fillStyle = plankTones[p % plankTones.length]!;
    ctx.fillRect(0, y0, size, plankH);

    // Fine longitudinal oak wood-grain fibers & medullary rays
    for (let g = 0; g < 44; g++) {
      const gy = y0 + ((g + 0.5) / 44) * plankH;
      const wave = Math.sin(g * 1.7 + p * 2.3) * 3.5;
      ctx.strokeStyle = g % 3 === 0 ? 'rgba(92, 60, 30, 0.16)' : 'rgba(218, 178, 130, 0.12)';
      ctx.lineWidth = 1.2 + (g % 3) * 0.6;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(size * 0.33, gy + wave, size * 0.66, gy - wave, size, gy);
      ctx.stroke();
    }

    // Subtle oak cathedral heartwood rings
    const knotX = ((p * 293 + 140) % (size - 240)) + 120;
    const knotY = y0 + plankH * (0.38 + (p % 3) * 0.12);
    for (let r = 1; r <= 5; r++) {
      ctx.strokeStyle = 'rgba(86, 54, 26, 0.13)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(knotX, knotY, r * 26, r * 6.5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Staggered butt-joint header seam per plank
    const jointX = ((p * 379 + 210) % (size - 180)) + 90;
    ctx.strokeStyle = '#5a3b1e';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(jointX, y0 + 1);
    ctx.lineTo(jointX, y0 + plankH - 1);
    ctx.stroke();

    bCtx.strokeStyle = '#222222';
    bCtx.lineWidth = 4.0;
    bCtx.beginPath();
    bCtx.moveTo(jointX, y0 + 1);
    bCtx.lineTo(jointX, y0 + plankH - 1);
    bCtx.stroke();

    // Longitudinal V-groove shadow seam between planks
    ctx.fillStyle = '#53361b';
    ctx.fillRect(0, y0, size, 3);
    ctx.fillStyle = 'rgba(235, 198, 152, 0.28)';
    ctx.fillRect(0, y0 + 3, size, 2);

    bCtx.fillStyle = '#181818';
    bCtx.fillRect(0, y0, size, 4);
  }

  const oakMap = new THREE.CanvasTexture(canvas);
  oakMap.colorSpace = THREE.SRGBColorSpace;
  oakMap.wrapS = THREE.RepeatWrapping;
  oakMap.wrapT = THREE.RepeatWrapping;
  oakMap.repeat.set(2, 3);

  const oakBumpMap = new THREE.CanvasTexture(bumpCanvas);
  oakBumpMap.wrapS = THREE.RepeatWrapping;
  oakBumpMap.wrapT = THREE.RepeatWrapping;
  oakBumpMap.repeat.set(2, 3);

  cachedFoldingMatOakFloorTextures = { oakMap, oakBumpMap };
  return cachedFoldingMatOakFloorTextures;
}

/**
 * Generates a high-resolution (`1024x720`) Widescreen Gallery Fine-Art Landscape Canvas texture
 * displayed on the Golf Simulator screen (`outbuildings.barn.golfSimulator.screen`) when the
 * hinged floor mat is folded closed ("when hinge is closed, screen changes to artwork").
 */
export function createGolfSimArtworkTexture(): THREE.CanvasTexture {
  if (cachedGolfSimArtworkTexture) {
    return cachedGolfSimArtworkTexture;
  }
  const w = 1152;
  const h = 720;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // 1. Outer gallery linen passepartout mat & warm antique-brass sight-edge fillet
  ctx.fillStyle = '#dfd8ca';
  ctx.fillRect(0, 0, w, h);

  const pad = 42;
  ctx.strokeStyle = '#9a7844';
  ctx.lineWidth = 6;
  ctx.strokeRect(pad - 4, pad - 4, w - (pad - 4) * 2, h - (pad - 4) * 2);

  ctx.save();
  ctx.beginPath();
  ctx.rect(pad, pad, w - pad * 2, h - pad * 2);
  ctx.clip();

  // 2. Golden-hour atmospheric Highland & Chilterns pastoral sky gradient
  const skyGrad = ctx.createLinearGradient(0, pad, 0, h * 0.62);
  skyGrad.addColorStop(0.0, '#1f3147');
  skyGrad.addColorStop(0.28, '#3d556e');
  skyGrad.addColorStop(0.58, '#8c6d58');
  skyGrad.addColorStop(0.82, '#d89a5b');
  skyGrad.addColorStop(1.0, '#f3c77e');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(pad, pad, w - pad * 2, h * 0.62);

  // Warm setting sun glow
  const sunX = w * 0.64;
  const sunY = h * 0.44;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, 260);
  sunGlow.addColorStop(0.0, 'rgba(255, 244, 206, 0.92)');
  sunGlow.addColorStop(0.35, 'rgba(246, 188, 108, 0.48)');
  sunGlow.addColorStop(1.0, 'rgba(246, 188, 108, 0.0)');
  ctx.fillStyle = sunGlow;
  ctx.fillRect(pad, pad, w - pad * 2, h - pad * 2);

  // Painterly sunlit cumulus & stratus cloud layers
  for (let c = 0; c < 18; c++) {
    const cx = pad + ((c * 173 + 90) % (w - pad * 2));
    const cy = pad + 55 + (c % 5) * 44;
    const rw = 90 + (c % 4) * 45;
    const rh = 18 + (c % 3) * 9;
    const cGrad = ctx.createLinearGradient(cx, cy - rh, cx, cy + rh);
    cGrad.addColorStop(0, 'rgba(252, 224, 178, 0.42)');
    cGrad.addColorStop(1, 'rgba(92, 74, 82, 0.24)');
    ctx.fillStyle = cGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Layered distant mist-shrouded mountain & hill ridges
  const ridgeLayers: ReadonlyArray<{
    readonly baseY: number;
    readonly amp: number;
    readonly freq: number;
    readonly phase: number;
    readonly colorTop: string;
    readonly colorBot: string;
  }> = [
    { baseY: h * 0.50, amp: 58, freq: 0.0055, phase: 0.4, colorTop: '#4e5869', colorBot: '#394252' },
    { baseY: h * 0.57, amp: 46, freq: 0.0072, phase: 1.9, colorTop: '#3e4a44', colorBot: '#29332e' },
    { baseY: h * 0.64, amp: 34, freq: 0.0095, phase: 3.4, colorTop: '#36442f', colorBot: '#222d1e' },
  ];

  for (const r of ridgeLayers) {
    const rGrad = ctx.createLinearGradient(0, r.baseY - r.amp, 0, h - pad);
    rGrad.addColorStop(0, r.colorTop);
    rGrad.addColorStop(1, r.colorBot);
    ctx.fillStyle = rGrad;
    ctx.beginPath();
    ctx.moveTo(pad, h - pad);
    for (let x = pad; x <= w - pad; x += 8) {
      const y =
        r.baseY -
        Math.sin(x * r.freq + r.phase) * r.amp -
        Math.cos(x * r.freq * 2.1 - r.phase) * (r.amp * 0.36);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w - pad, h - pad);
    ctx.closePath();
    ctx.fill();
  }

  // 4. Tranquil reflective Highland loch / river bend across mid-ground (`y = 0.66h .. 0.80h`)
  const waterTopY = h * 0.66;
  const waterBotY = h * 0.81;
  const waterGrad = ctx.createLinearGradient(0, waterTopY, 0, waterBotY);
  waterGrad.addColorStop(0.0, '#d89b5e');
  waterGrad.addColorStop(0.45, '#7c6a58');
  waterGrad.addColorStop(1.0, '#2a393d');
  ctx.fillStyle = waterGrad;
  ctx.fillRect(pad, waterTopY, w - pad * 2, waterBotY - waterTopY);

  // Shimmering golden water reflections
  for (let i = 0; i < 42; i++) {
    const ry = waterTopY + 6 + (i / 42) * (waterBotY - waterTopY - 12);
    const rx = sunX - 140 + Math.sin(i * 3.7) * 85;
    const rw = 45 + (i % 5) * 28;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255, 232, 175, 0.38)' : 'rgba(42, 58, 64, 0.32)';
    ctx.fillRect(rx, ry, rw, 2.2);
  }

  // 5. Foreground heather & golden meadow banks + ancient Scots pine / oak silhouettes
  ctx.fillStyle = '#242f1d';
  ctx.beginPath();
  ctx.moveTo(pad, h - pad);
  ctx.lineTo(pad, h * 0.72);
  ctx.quadraticCurveTo(w * 0.28, h * 0.75, w * 0.46, h * 0.82);
  ctx.quadraticCurveTo(w * 0.72, h * 0.76, w - pad, h * 0.70);
  ctx.lineTo(w - pad, h - pad);
  ctx.closePath();
  ctx.fill();

  // Warm golden-ochre meadow highlights
  for (let m = 0; m < 160; m++) {
    const mx = pad + ((m * 97) % (w - pad * 2));
    const my = h * 0.76 + ((m * 53) % Math.round(h * 0.18));
    ctx.fillStyle = m % 3 === 0 ? 'rgba(186, 134, 62, 0.28)' : 'rgba(64, 82, 44, 0.34)';
    ctx.fillRect(mx, my, 18 + (m % 4) * 7, 3.5);
  }

  // Sculpted tree silhouettes on left and right banks
  const treeClusters: ReadonlyArray<readonly [number, number, number]> = [
    [pad + 115, h * 0.74, 1.15],
    [pad + 195, h * 0.76, 0.88],
    [w - pad - 145, h * 0.73, 1.05],
    [w - pad - 85, h * 0.75, 0.78],
  ];
  for (const [tx, ty, scale] of treeClusters) {
    ctx.strokeStyle = '#181f14';
    ctx.lineWidth = 7 * scale;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(tx - 6 * scale, ty - 65 * scale, tx + 4 * scale, ty - 135 * scale);
    ctx.stroke();

    for (const [ox, oy, rx, ry] of [
      [0, -145, 58, 34],
      [-34, -122, 42, 26],
      [36, -118, 44, 28],
      [-12, -168, 46, 26],
    ] as const) {
      ctx.fillStyle = '#1a2416';
      ctx.beginPath();
      ctx.ellipse(tx + ox * scale, ty + oy * scale, rx * scale, ry * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Subtle woven oil-canvas texture overlay
  ctx.strokeStyle = 'rgba(255, 248, 232, 0.035)';
  ctx.lineWidth = 1;
  for (let y = pad; y < h - pad; y += 6) {
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(w - pad, y);
    ctx.stroke();
  }

  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  cachedGolfSimArtworkTexture = tex;
  return tex;
}

export function createGolfStatusSignTexture(): THREE.CanvasTexture {
  if (cachedGolfStatusSignTexture) {
    return cachedGolfStatusSignTexture;
  }
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 256;
  signCanvas.height = 96;
  const sCtx = signCanvas.getContext('2d');
  if (sCtx) {
    sCtx.fillStyle = '#181a1f';
    sCtx.fillRect(0, 0, 256, 96);
    sCtx.strokeStyle = '#c59b58';
    sCtx.lineWidth = 5;
    sCtx.strokeRect(4, 4, 248, 88);
    sCtx.fillStyle = '#ff3b30';
    sCtx.font = 'bold 30px sans-serif';
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    sCtx.fillText('GOLF SIM', 128, 36);
    sCtx.fillStyle = '#f4f6f9';
    sCtx.font = 'bold 18px sans-serif';
    sCtx.fillText('IN PLAY', 128, 68);
  }
  const signTex = new THREE.CanvasTexture(signCanvas);
  signTex.colorSpace = THREE.SRGBColorSpace;
  cachedGolfStatusSignTexture = signTex;
  return signTex;
}

export interface BarnGolfSimulatorEnclosureHandles {
  readonly simGroup: THREE.Group;
  readonly simCeilingGroup: THREE.Group;
  readonly simCenterV: number;
  readonly clearW: number;
  readonly clearH: number;
  readonly wallBoxH: number;
  readonly frontLenX: number;
  readonly velvetFrameMat: THREE.MeshStandardMaterial;
  readonly projectorBodyMat: THREE.MeshStandardMaterial;
  readonly trackManOrangeMat: THREE.MeshStandardMaterial;
  readonly impactScreenMat: THREE.MeshStandardMaterial;
  readonly screenTex: THREE.CanvasTexture;
  readonly artworkTex: THREE.CanvasTexture;
  readonly statusSignFaceMat: THREE.MeshStandardMaterial;
  readonly statusBeaconRedMat: THREE.MeshStandardMaterial;
  readonly rearFairwayTurf: THREE.Mesh;
  readonly screenMesh: THREE.Mesh;
  readonly hingeAssy: THREE.Group;
  readonly foldingMatGroup: THREE.Group;
}

export function buildBarnGolfSimulatorEnclosure(
  groundGroup: THREE.Group,
  _uWallMin: number,
  uWallMax: number,
  barnWestFloorY: number,
  _plasterMat: THREE.Material,
  groundCeilingGroup?: THREE.Group
): BarnGolfSimulatorEnclosureHandles {
  const simCenterV = 3.355; // Centered on v = 1.33m..5.38m (clearW = 4.05m, leaving a 0.96m Part M/B North corridor v = 0.28m..1.24m!)
  const simGroup = new THREE.Group();
  simGroup.name = 'outbuildings.barn.golfSimulator';
  simGroup.position.set(uWallMax, barnWestFloorY, simCenterV);
  groundGroup.add(simGroup);

  const simCeilingGroup = new THREE.Group();
  simCeilingGroup.name = 'outbuildings.barn.golfSimulator.ceiling';
  simCeilingGroup.position.set(uWallMax, barnWestFloorY, simCenterV);
  (groundCeilingGroup ?? groundGroup).add(simCeilingGroup);

  const clearW = 4.05; // 13'3.5" Widescreen enclosure width (v = 1.33m..5.38m, reclaiming the 26cm South dead void!)
  const clearH = 2.85; // 9'4" (2.85m) official TrackMan iO minimum enclosure ceiling height
  const recessDepthU = 2.16;

  // Procedural Upholstered Acoustic Impact Foam micro-suede texture & bevelled cushion bump map
  const foamCanvas = document.createElement('canvas');
  foamCanvas.width = 256;
  foamCanvas.height = 256;
  const fCtx = foamCanvas.getContext('2d');
  const foamBumpCanvas = document.createElement('canvas');
  foamBumpCanvas.width = 256;
  foamBumpCanvas.height = 256;
  const fbCtx = foamBumpCanvas.getContext('2d');
  if (fCtx && fbCtx) {
    fCtx.fillStyle = '#1e2126';
    fCtx.fillRect(0, 0, 256, 256);
    fbCtx.fillStyle = '#d8d8d8';
    fbCtx.fillRect(0, 0, 256, 256);

    // Subtle bevelled cushion border pillowing on bump map
    const borderGrad = fbCtx.createRadialGradient(128, 128, 60, 128, 128, 175);
    borderGrad.addColorStop(0, '#ffffff');
    borderGrad.addColorStop(0.78, '#dcdcdc');
    borderGrad.addColorStop(1, '#585858');
    fbCtx.fillStyle = borderGrad;
    fbCtx.fillRect(0, 0, 256, 256);

    // Fine open-cell acoustic foam / suede micro-texture
    for (let y = 0; y < 256; y += 2) {
      for (let x = 0; x < 256; x += 2) {
        const n = ((x * 73 + y * 151 + ((x * y) & 31)) % 29) - 14;
        const v = 30 + Math.round(n * 0.45);
        fCtx.fillStyle = `rgb(${v}, ${v + 3}, ${v + 7})`;
        fCtx.fillRect(x, y, 2, 2);
      }
    }
  }
  const foamColorTex = new THREE.CanvasTexture(foamCanvas);
  foamColorTex.wrapS = THREE.RepeatWrapping;
  foamColorTex.wrapT = THREE.RepeatWrapping;
  foamColorTex.colorSpace = THREE.SRGBColorSpace;
  const foamBumpTex = new THREE.CanvasTexture(foamBumpCanvas);
  foamBumpTex.wrapS = THREE.RepeatWrapping;
  foamBumpTex.wrapT = THREE.RepeatWrapping;

  const acousticBaffleMat = new THREE.MeshStandardMaterial({
    map: foamColorTex,
    bumpMap: foamBumpTex,
    bumpScale: 0.012,
    color: 0xffffff,
    roughness: 0.92,
    metalness: 0.02,
  });
  const velvetFrameMat = new THREE.MeshStandardMaterial({
    color: 0x111316,
    roughness: 0.9,
    metalness: 0.03,
  });

  const { fairwayMap, hittingMap, bumpMap } = createGolfAstroturfTextures();
  const fairwayTurfMat = new THREE.MeshStandardMaterial({
    map: fairwayMap,
    bumpMap,
    bumpScale: 0.018,
    color: 0xffffff,
    roughness: 0.82,
    metalness: 0.02,
  });
  const hittingStripMat = new THREE.MeshStandardMaterial({
    map: hittingMap,
    bumpMap,
    bumpScale: 0.022,
    color: 0xffffff,
    roughness: 0.86,
    metalness: 0.02,
  });
  const stanceSurroundMat = new THREE.MeshStandardMaterial({
    color: 0x22252a,
    roughness: 0.84,
    metalness: 0.04,
  });
  const screenTex = createTrackManWidescreenTexture();
  const artworkTex = createGolfSimArtworkTexture();
  const impactScreenMat = new THREE.MeshStandardMaterial({
    map: screenTex,
    emissiveMap: screenTex,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.44,
    roughness: 0.65,
    metalness: 0.02,
  });
  impactScreenMat.userData = { isDynamicGolfScreen: true };
  const projectorBodyMat = new THREE.MeshStandardMaterial({
    color: 0x212429,
    roughness: 0.34,
    metalness: 0.58,
  });
  const trackManOrangeMat = new THREE.MeshStandardMaterial({
    color: 0xff6b00,
    emissive: new THREE.Color(0xff5500),
    emissiveIntensity: 0.25,
    roughness: 0.3,
    metalness: 0.2,
  });
  const golfBallMat = new THREE.MeshStandardMaterial({
    color: 0xf8f9fa,
    roughness: 0.22,
    metalness: 0.05,
  });

  const wallBoxH = clearH + 0.01;

  // Continuous Matte-Obsidian Acoustic Backing Substrate across the Ceiling and Both Side Walls
  // so ZERO white plaster ever bleeds through the shadow seams between the padded foam cushions!
  const ceilingFoamSubstrate = new THREE.Mesh(
    new THREE.BoxGeometry(recessDepthU, 0.018, clearW),
    velvetFrameMat
  );
  ceilingFoamSubstrate.name = 'outbuildings.barn.golfSimulator.ceilingFoamSubstrate';
  ceilingFoamSubstrate.position.set(-recessDepthU * 0.5, clearH - 0.009, 0);
  ceilingFoamSubstrate.receiveShadow = true;
  simGroup.add(ceilingFoamSubstrate);

  for (const sideZ of [-1, 1] as const) {
    const sideLabel = sideZ < 0 ? 'north' : 'south';
    const sideFoamSubstrate = new THREE.Mesh(
      new THREE.BoxGeometry(recessDepthU, clearH, 0.016),
      velvetFrameMat
    );
    sideFoamSubstrate.name = `outbuildings.barn.golfSimulator.sideFoamSubstrate.${sideLabel}`;
    sideFoamSubstrate.position.set(
      -recessDepthU * 0.5,
      clearH * 0.5,
      sideZ * (clearW * 0.5 - 0.010)
    );
    simGroup.add(sideFoamSubstrate);
  }

  // 6 Columns × 3 Rows of Bevelled Padded Acoustic Foam Side Panels + 6×4 Grid of Padded Foam Ceiling Panels
  // Attached directly to `simGroup` so the padded foam ceiling & walls remain a cohesive 3D bay in all views!
  const numBaffleCols = 6;
  const numSideRows = 3;
  const numCeilColsZ = 4;
  const foamDepthX = recessDepthU - 0.14; // Spans x = -2.02m (screen plane) to x = 0.00m (portal)
  const baffleColW = foamDepthX / numBaffleCols;
  const sideRowH = (clearH - 0.08) / numSideRows;
  const ceilTileW = (clearW - 0.10) / numCeilColsZ;

  for (let c = 0; c < numBaffleCols; c++) {
    const bx = -recessDepthU + 0.14 + (c + 0.5) * baffleColW;

    for (const sideZ of [-1, 1] as const) {
      const sideLabel = sideZ < 0 ? 'north' : 'south';
      for (let r = 0; r < numSideRows; r++) {
        const by = 0.04 + (r + 0.5) * sideRowH;
        const sideBaffle = new THREE.Mesh(
          new THREE.BoxGeometry(baffleColW - 0.01, sideRowH - 0.01, 0.052),
          acousticBaffleMat
        );
        sideBaffle.name = `outbuildings.barn.golfSimulator.sideBaffle.${sideLabel}.${c + 1}.${r + 1}`;
        sideBaffle.position.set(bx, by, sideZ * (clearW * 0.5 - 0.032));
        sideBaffle.castShadow = true;
        sideBaffle.receiveShadow = true;
        simGroup.add(sideBaffle);
      }
    }

    for (let cz = 0; cz < numCeilColsZ; cz++) {
      const bz = -(clearW - 0.10) * 0.5 + (cz + 0.5) * ceilTileW;
      const ceilBaffle = new THREE.Mesh(
        new THREE.BoxGeometry(baffleColW - 0.01, 0.056, ceilTileW - 0.01),
        acousticBaffleMat
      );
      ceilBaffle.name = `outbuildings.barn.golfSimulator.ceilingBaffle.${c + 1}.${cz + 1}`;
      ceilBaffle.position.set(bx, clearH - 0.034, bz);
      ceilBaffle.castShadow = true;
      ceilBaffle.receiveShadow = true;
      simGroup.add(ceilBaffle);
    }
  }

  // Upholstered Corner Foam Bolsters along Top-North, Top-South, Bottom-North & Bottom-South junctions
  for (const sideZ of [-1, 1] as const) {
    const sideLabel = sideZ < 0 ? 'north' : 'south';
    const topBolster = new THREE.Mesh(
      new THREE.BoxGeometry(foamDepthX, 0.058, 0.058),
      velvetFrameMat
    );
    topBolster.name = `outbuildings.barn.golfSimulator.cornerBolster.top.${sideLabel}`;
    topBolster.position.set(
      -recessDepthU + 0.14 + foamDepthX * 0.5,
      clearH - 0.029,
      sideZ * (clearW * 0.5 - 0.029)
    );
    simGroup.add(topBolster);

    const bottomBolster = new THREE.Mesh(
      new THREE.BoxGeometry(foamDepthX, 0.044, 0.058),
      velvetFrameMat
    );
    bottomBolster.name = `outbuildings.barn.golfSimulator.cornerBolster.bottom.${sideLabel}`;
    bottomBolster.position.set(
      -recessDepthU + 0.14 + foamDepthX * 0.5,
      0.022,
      sideZ * (clearW * 0.5 - 0.029)
    );
    simGroup.add(bottomBolster);
  }

  const frameTrimW = 0.075;
  const portalTrimBottomY = 0.038;
  const portalTrimH = clearH - portalTrimBottomY;
  for (const sideZ of [-1, 1] as const) {
    const sideTrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.068, portalTrimH, frameTrimW),
      velvetFrameMat
    );
    sideTrim.name = `outbuildings.barn.golfSimulator.portalTrim.${sideZ < 0 ? 'north' : 'south'}`;
    sideTrim.position.set(
      -0.032,
      portalTrimBottomY + portalTrimH * 0.5,
      sideZ * (clearW * 0.5 - frameTrimW * 0.5)
    );
    simGroup.add(sideTrim);
  }
  const topTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.068, frameTrimW, clearW),
    velvetFrameMat
  );
  topTrim.name = 'outbuildings.barn.golfSimulator.portalTrim.top';
  topTrim.position.set(-0.032, clearH - frameTrimW * 0.5, 0);
  simGroup.add(topTrim);

  // Issue #1 ("add an LED ring around the inside" at `[-8.083, 0.197, 16.157]`, `sideBaffle.north.4.1`):
  // Recessed Architectural Warm-White (3000K) LED Halo Rings (`outbuildings.barn.golfSimulator.ledRing`)
  // framing the interior perimeter of the simulator bay:
  //   1. Mid-Bay Recessed Perimeter LED Ring (`x = -1.01m`, recessed into the central acoustic baffle channel
  //      right at `sideBaffle.*.4.*`, running up the North wall, across the ceiling, and down the South wall + flush floor edge),
  //   2. Inner Portal Perimeter LED Ring (`x = -0.072m`, framing the inside of the front portal opening),
  //   3. Upper Corner Cove LED Strips (`x = -1.96m .. -0.072m`) along the North & South top bolster shadow gaps.
  const ledRingGroup = new THREE.Group();
  ledRingGroup.name = 'outbuildings.barn.golfSimulator.ledRing';
  simGroup.add(ledRingGroup);

  const ledChannelHousingMat = new THREE.MeshStandardMaterial({
    color: 0x16181d,
    roughness: 0.36,
    metalness: 0.72,
  });
  const ledDiffuserMat = new THREE.MeshStandardMaterial({
    color: 0xfff3dc,
    emissive: new THREE.Color(0xffd9a0),
    emissiveIntensity: 2.2,
    roughness: 0.18,
    metalness: 0.04,
  });

  const ringLoops: ReadonlyArray<{
    readonly id: string;
    readonly ringX: number;
    readonly wallZ: number;
    readonly topY: number;
    readonly botY: number;
  }> = [
    {
      id: 'midBay',
      ringX: -recessDepthU + 0.14 + foamDepthX * 0.5, // -0.94m (exact central baffle seam between col 3 & col 4!)
      wallZ: clearW * 0.5 - 0.056,
      topY: clearH - 0.060,
      botY: 0.040,
    },
    {
      id: 'portalInner',
      ringX: -0.070,
      wallZ: clearW * 0.5 - 0.064,
      topY: clearH - 0.068,
      botY: 0.040,
    },
  ];

  for (const loop of ringLoops) {
    const vertH = loop.topY - loop.botY;
    const vertMidY = (loop.botY + loop.topY) * 0.5;
    const horizSpanZ = loop.wallZ * 2;

    // North & South vertical LED ring legs
    for (const sideZ of [-1, 1] as const) {
      const sideLabel = sideZ < 0 ? 'north' : 'south';
      const vHousing = new THREE.Mesh(
        new THREE.BoxGeometry(0.022, vertH + 0.016, 0.014),
        ledChannelHousingMat
      );
      vHousing.name = `outbuildings.barn.golfSimulator.ledRing.${loop.id}.${sideLabel}.housing`;
      vHousing.position.set(loop.ringX, vertMidY, sideZ * (loop.wallZ + 0.004));
      ledRingGroup.add(vHousing);

      const vDiffuser = new THREE.Mesh(
        new THREE.BoxGeometry(0.014, vertH, 0.010),
        ledDiffuserMat
      );
      vDiffuser.name = `outbuildings.barn.golfSimulator.ledRing.${loop.id}.${sideLabel}`;
      vDiffuser.position.set(loop.ringX, vertMidY, sideZ * loop.wallZ);
      ledRingGroup.add(vDiffuser);
    }

    // Top ceiling horizontal LED ring leg
    const tHousing = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, 0.014, horizSpanZ + 0.016),
      ledChannelHousingMat
    );
    tHousing.name = `outbuildings.barn.golfSimulator.ledRing.${loop.id}.top.housing`;
    tHousing.position.set(loop.ringX, loop.topY + 0.004, 0);
    ledRingGroup.add(tHousing);

    const tDiffuser = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.010, horizSpanZ),
      ledDiffuserMat
    );
    tDiffuser.name = `outbuildings.barn.golfSimulator.ledRing.${loop.id}.top`;
    tDiffuser.position.set(loop.ringX, loop.topY, 0);
    ledRingGroup.add(tDiffuser);

  }

  // Longitudinal Upper Ceiling Cove LED Strips connecting the Screen frame (`x = -1.98m`) to the Portal (`x = -0.07m`)
  // (No floor-level LED strips per user request!)
  const coveSpanX = (-0.070) - (-recessDepthU + 0.16);
  const coveMidX = ((-0.070) + (-recessDepthU + 0.16)) * 0.5;
  for (const sideZ of [-1, 1] as const) {
    const sideLabel = sideZ < 0 ? 'north' : 'south';
    const upperCove = new THREE.Mesh(
      new THREE.BoxGeometry(coveSpanX, 0.010, 0.010),
      ledDiffuserMat
    );
    upperCove.name = `outbuildings.barn.golfSimulator.ledRing.cove.top.${sideLabel}`;
    upperCove.position.set(coveMidX, clearH - 0.060, sideZ * (clearW * 0.5 - 0.058));
    ledRingGroup.add(upperCove);
  }

  // True 16:10 Widescreen Active Impact Screen (`3.95m W × 2.47m H = 1.599:1 = 16:10`)
  // with a 300mm Padded Acoustic Foam Upper Pelmet (`y = 2.55m..2.85m`) & Bottom Velvet Bolster (`y = 0..0.04m`)!
  const screenW = clearW - 0.1; // 3.95m (12'11.5")
  const screenH = 2.47; // 2.47m (8'1.2" -> 3.95 / 2.47 = 1.60:1 = 16:10 Widescreen!)
  const screenBottomY = 0.04;
  const screenCenterY = screenBottomY + screenH * 0.5; // 1.275m
  const screenTopY = screenBottomY + screenH; // 2.51m

  const screenMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(screenW, screenH),
    impactScreenMat
  );
  screenMesh.name = 'outbuildings.barn.golfSimulator.screen';
  screenMesh.rotation.y = Math.PI / 2;
  screenMesh.position.set(-recessDepthU + 0.14, screenCenterY, 0);
  simGroup.add(screenMesh);

  const screenBacking = new THREE.Mesh(
    new THREE.PlaneGeometry(clearW - 0.02, clearH - 0.02),
    velvetFrameMat
  );
  screenBacking.name = 'outbuildings.barn.golfSimulator.screen.backing';
  screenBacking.rotation.y = -Math.PI / 2;
  screenBacking.position.set(-recessDepthU + 0.12, clearH * 0.5, 0);
  simGroup.add(screenBacking);

  // Bottom Velvet Ball-Stop Bolster (`y = 0.00m..0.042m`) & Left/Right Velvet Tension Stiles
  const screenBottomBolster = new THREE.Mesh(
    new THREE.BoxGeometry(0.048, 0.042, clearW - 0.08),
    velvetFrameMat
  );
  screenBottomBolster.name = 'outbuildings.barn.golfSimulator.screen.bottomBolster';
  screenBottomBolster.position.set(-recessDepthU + 0.148, 0.021, 0);
  simGroup.add(screenBottomBolster);

  // Horizontal Black Velvet Tension Bar (`y = 2.51m..2.555m`) & 4-Panel Padded Foam Upper Pelmet (`y = 2.555m..2.85m`)
  const screenTopVelvetBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.048, 0.045, clearW - 0.08),
    velvetFrameMat
  );
  screenTopVelvetBar.name = 'outbuildings.barn.golfSimulator.screen.topTensionBar';
  screenTopVelvetBar.position.set(-recessDepthU + 0.148, screenTopY + 0.0225, 0);
  simGroup.add(screenTopVelvetBar);

  const pelmetH = clearH - (screenTopY + 0.045) - 0.03; // Padded foam header panels below ceiling baffles
  for (let cz = 0; cz < numCeilColsZ; cz++) {
    const bz = -(clearW - 0.10) * 0.5 + (cz + 0.5) * ceilTileW;
    const pelmetTile = new THREE.Mesh(
      new THREE.BoxGeometry(0.068, pelmetH - 0.008, ceilTileW - 0.01),
      acousticBaffleMat
    );
    pelmetTile.name = `outbuildings.barn.golfSimulator.screenUpperPelmet.${cz + 1}`;
    pelmetTile.position.set(
      -recessDepthU + 0.165,
      screenTopY + 0.045 + pelmetH * 0.5,
      bz
    );
    pelmetTile.castShadow = true;
    pelmetTile.receiveShadow = true;
    simGroup.add(pelmetTile);
  }

  // ===========================================================================
  // Issue #1: Slim 25mm x 15mm x 3mm Low-Profile Aluminium Channel Tracks (`z = ±1.05m`),
  //           Underside Polyurethane Rollers & Small Subtle Cam-Lift Lever Behind the Hitting Area
  // ===========================================================================
  const deckOuterW = clearW - 0.22; // 3.83m in building-regs fork (`3.83 - 0.028 = 3.802m` turf width)
  const trackZPositions = [-1.05, 1.05] as const; // North (`z = -1.05m`) & South (`z = +1.05m`) slim 25mm channels
  const channelOuterW = 0.025; // 25.4mm (1") slim off-the-shelf Aluminium Channel width
  const channelOuterH = 0.015; // 15.9mm (5/8") low-profile channel height
  const channelWallT = 0.003;  // 3.2mm (1/8") wall thickness (`19mm` clear internal roller trough)
  const trackSlotW = 0.027;    // Slim 27mm slot through the Inside Mat (`1mm` clearance per side)
  const liftHeightY = 0.036;   // 36mm vertical cam-lift so the Sliding Mat lifts clear of the 34mm Inside Mat!

  const turfStartX = -recessDepthU + 0.16; // -2.00m
  const rearTurfEndX = -0.002; // Butts flush against `frontTurfStartX = +0.002m` at `x = 0`
  const rearLenX = rearTurfEndX - turfStartX; // 1.998m
  const rearCenterX = (turfStartX + rearTurfEndX) * 0.5; // -1.001m

  const frontTurfStartX = 0.002;
  const frontLenX = 1.960;
  const turfEndX = frontTurfStartX + frontLenX; // +1.962m
  const frontCenterX = (frontTurfStartX + turfEndX) * 0.5; // +0.982m
  const outsideTrackEndX = turfEndX + 0.068; // +2.030m (peeks out 68mm behind the mat on the tiles, right beside the small lever!)

  const centerStripW = (Math.abs(trackZPositions[0]) - trackSlotW * 0.5) * 2; // 2.073m (`z = -1.0365..+1.0365m`)
  const outerWingW = (deckOuterW - 0.028) * 0.5 - (Math.abs(trackZPositions[1]) + trackSlotW * 0.5); // 0.8375m
  const outerWingCenterZ = Math.abs(trackZPositions[1]) + trackSlotW * 0.5 + outerWingW * 0.5; // 1.482m

  // 1. Fixed Inside Putting Mat (`rearFairwayTurf`, `x = -2.00m .. -0.002m`, `yTop = 0.034m`)
  //    Split around two slim 27mm slots at `z = ±1.05m` so the 2 Inside Tracks run subtly THROUGH the inside mat!
  const rearSurroundCenter = new THREE.Mesh(
    new THREE.BoxGeometry(rearLenX, 0.028, centerStripW),
    stanceSurroundMat
  );
  rearSurroundCenter.name = 'outbuildings.barn.golfSimulator.turfMat.rearSurround';
  rearSurroundCenter.position.set(rearCenterX, 0.014, 0);
  rearSurroundCenter.receiveShadow = true;
  simGroup.add(rearSurroundCenter);

  const rearFairwayTurf = new THREE.Mesh(
    new THREE.BoxGeometry(rearLenX - 0.016, 0.034, centerStripW),
    fairwayTurfMat
  );
  rearFairwayTurf.name = 'outbuildings.barn.golfSimulator.turfMat.rearFixed';
  rearFairwayTurf.position.set(rearCenterX, 0.017, 0);
  rearFairwayTurf.receiveShadow = true;
  simGroup.add(rearFairwayTurf);

  for (const sideSign of [-1, 1] as const) {
    const sideTag = sideSign < 0 ? 'northWing' : 'southWing';
    const rearWingSurround = new THREE.Mesh(
      new THREE.BoxGeometry(rearLenX, 0.028, outerWingW + 0.014),
      stanceSurroundMat
    );
    rearWingSurround.name = `outbuildings.barn.golfSimulator.turfMat.rearSurround.${sideTag}`;
    rearWingSurround.position.set(rearCenterX, 0.014, sideSign * outerWingCenterZ);
    rearWingSurround.receiveShadow = true;
    simGroup.add(rearWingSurround);

    const rearWingTurf = new THREE.Mesh(
      new THREE.BoxGeometry(rearLenX - 0.016, 0.034, outerWingW),
      fairwayTurfMat
    );
    rearWingTurf.name = `outbuildings.barn.golfSimulator.turfMat.rearFixed.${sideTag}`;
    rearWingTurf.position.set(rearCenterX, 0.017, sideSign * outerWingCenterZ);
    rearWingTurf.receiveShadow = true;
    simGroup.add(rearWingTurf);
  }

  for (const [cupIdx, [cupX, cupZ]] of (
    [
      [-0.38, -0.78],
      [-0.38, 0.78],
    ] as const
  ).entries()) {
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.054, 0.054, 0.036, 16),
      velvetFrameMat
    );
    cup.name = `outbuildings.barn.golfSimulator.turfMat.puttingCup.${cupIdx + 1}`;
    cup.position.set(cupX, 0.019, cupZ);
    simGroup.add(cup);
  }

  // ===========================================================================
  // 2. Slim 25mm x 15mm x 3mm Aluminium U-Channel Track System (Limestone Powder-Coated on Tiles)
  //    with Sub-Floor Concealed Torque Shaft & 245mm Ergonomic Rear Lever
  // ===========================================================================
  const aluChannelMat = new THREE.MeshStandardMaterial({
    color: 0x5c646e,
    roughness: 0.32,
    metalness: 0.82,
  });
  const aluTroughFloorMat = new THREE.MeshStandardMaterial({
    color: 0x2a2f36,
    roughness: 0.42,
    metalness: 0.72,
  });
  // Warm Cotswold Limestone matte architectural powder-coat (`RAL 1013 / Limestone #cfc5b3`) for the tile tracks!
  const limestonePowderCoatMat = new THREE.MeshStandardMaterial({
    color: 0xcfc5b3,
    roughness: 0.58,
    metalness: 0.14,
  });
  const limestoneTroughFloorMat = new THREE.MeshStandardMaterial({
    color: 0xbab09e,
    roughness: 0.64,
    metalness: 0.16,
  });
  const hingeSteelMat = new THREE.MeshStandardMaterial({
    color: 0x262b32,
    roughness: 0.36,
    metalness: 0.8,
  });
  const rollerPolyMat = new THREE.MeshStandardMaterial({
    color: 0x323842,
    roughness: 0.4,
    metalness: 0.15,
  });
  const neoprenePadMat = new THREE.MeshStandardMaterial({
    color: 0x181a1e,
    roughness: 0.88,
    metalness: 0.04,
  });

  const hingeAssy = new THREE.Group();
  hingeAssy.name = 'outbuildings.barn.golfSimulator.trackSystem';
  hingeAssy.position.set(0, 0, 0);
  simGroup.add(hingeAssy);

  // Helper to build a slim `25mm x 15mm x 3mm` (`1" x 5/8" x 1/8"`) low-profile Aluminium U-Channel
  const populateSlimAluminiumUChannel = (
    targetGroup: THREE.Group,
    prefix: string,
    lengthX: number,
    wallMat: THREE.Material,
    floorMat: THREE.Material
  ): void => {
    const webMesh = new THREE.Mesh(
      new THREE.BoxGeometry(lengthX, channelWallT, channelOuterW),
      floorMat
    );
    webMesh.name = `${prefix}.web3mm`;
    webMesh.position.set(0, channelWallT * 0.5, 0);
    webMesh.receiveShadow = true;
    targetGroup.add(webMesh);

    const flangeOffsetZ = (channelOuterW - channelWallT) * 0.5; // 0.011m (`19mm` clear internal trough)
    for (const [flangeTag, fz] of [
      ['innerFlange', -flangeOffsetZ],
      ['outerFlange', flangeOffsetZ],
    ] as const) {
      const flangeMesh = new THREE.Mesh(
        new THREE.BoxGeometry(lengthX, channelOuterH, channelWallT),
        wallMat
      );
      flangeMesh.name = `${prefix}.${flangeTag}`;
      flangeMesh.position.set(0, channelOuterH * 0.5, fz);
      flangeMesh.receiveShadow = true;
      targetGroup.add(flangeMesh);
    }
  };

  // 2A. 2 Slim Inside `25x15x3mm` Aluminium Channels (`insideTrack.north/.south`) running FLUSH through the Inside Mat
  //     Top edges of the channel sit flush with the `34mm` Inside Mat (`y = +0.019m .. +0.034m`, running bed at `y = +0.022m`)!
  const insideTrackBaseY = 0.034 - channelOuterH; // 0.019m (so top of 15mm channel is flush at `y = 0.034m`!)
  const insideTrackGroup = new THREE.Group();
  insideTrackGroup.name = 'outbuildings.barn.golfSimulator.trackSystem.insideTrack';
  hingeAssy.add(insideTrackGroup);

  for (const sideSign of [-1, 1] as const) {
    const sideTag = sideSign < 0 ? 'north' : 'south';
    const tz = sideSign * Math.abs(trackZPositions[1]);
    const inTrack = new THREE.Group();
    inTrack.name = `outbuildings.barn.golfSimulator.trackSystem.insideTrack.${sideTag}`;
    inTrack.position.set(rearCenterX, insideTrackBaseY, tz);
    insideTrackGroup.add(inTrack);

    const subBearer = new THREE.Mesh(
      new THREE.BoxGeometry(rearLenX, insideTrackBaseY, channelOuterW - 0.002),
      hingeSteelMat
    );
    subBearer.name = `outbuildings.barn.golfSimulator.trackSystem.insideTrack.${sideTag}.subBearer`;
    subBearer.position.set(0, -insideTrackBaseY * 0.5, 0);
    inTrack.add(subBearer);

    populateSlimAluminiumUChannel(
      inTrack,
      `outbuildings.barn.golfSimulator.trackSystem.insideTrack.${sideTag}`,
      rearLenX,
      aluChannelMat,
      aluTroughFloorMat
    );

    const rearStop = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.012, 0.018),
      neoprenePadMat
    );
    rearStop.name = `outbuildings.barn.golfSimulator.trackSystem.insideTrack.${sideTag}.rearStop`;
    rearStop.position.set(-rearLenX * 0.5 + 0.012, channelWallT + 0.006, 0);
    inTrack.add(rearStop);
  }

  // 2B. Flush Inset Floor Slot Liners & Sub-Floor Parallel Cam Linkages under the 2 Outside Tracks
  //     When lowered (`trackLiftSmooth = 0`), the tracks and cam linkages retract INTO the floor slot (`y <= +0.0012m`)
  //     so they sit 100% FLUSH with the limestone tiles instead of sitting on top of the floor!
  const outsideTrackLenX = outsideTrackEndX - frontTurfStartX; // 2.028m (`x = +0.002m .. +2.030m`)
  const outsideTrackCenterX = (frontTurfStartX + outsideTrackEndX) * 0.5; // +1.016m
  const insetFlushRimY = 0.0012; // 1.2mm flush sight-line in the limestone tiles (avoids z-fighting with y = 0 floor slab)
  const outsideTrackLoweredBaseY = -channelOuterH + insetFlushRimY; // -0.0138m (recessed inside the floor slot when lowered!)

  const tileBaseGroup = new THREE.Group();
  tileBaseGroup.name = 'outbuildings.barn.golfSimulator.trackSystem.tileMountingBase';
  hingeAssy.add(tileBaseGroup);

  const camStationsX = [0.24, 0.82, 1.40, 1.96] as const;
  const camLinkArmLen = 0.036;

  for (const sideSign of [-1, 1] as const) {
    const sideTag = sideSign < 0 ? 'north' : 'south';
    const tz = sideSign * Math.abs(trackZPositions[1]);

    // Flush inset floor slot shadow liner at `y = +0.0005m` (visible inside the 19mm trough between the flush channel lips)
    const tileSolePlate = new THREE.Mesh(
      new THREE.BoxGeometry(outsideTrackLenX, 0.001, channelOuterW - channelWallT * 2),
      limestoneTroughFloorMat
    );
    tileSolePlate.name = `outbuildings.barn.golfSimulator.trackSystem.tileBase.${sideTag}`;
    tileSolePlate.position.set(outsideTrackCenterX, 0.0005, tz);
    tileSolePlate.receiveShadow = true;
    tileBaseGroup.add(tileSolePlate);

    for (let cIdx = 0; cIdx < camStationsX.length; cIdx++) {
      const cx = camStationsX[cIdx]!;
      const camLinkPivot = new THREE.Group();
      camLinkPivot.name = `outbuildings.barn.golfSimulator.trackSystem.camLink.${sideTag}.${cIdx + 1}`;
      camLinkPivot.userData = { isGolfTrackCamLink: true };
      // Pivots from inside the sub-floor slot (`y = -0.012m`) so it is completely hidden below the floor when flush!
      camLinkPivot.position.set(cx - 0.016, -0.012, tz);
      tileBaseGroup.add(camLinkPivot);

      for (const lz of [-0.011, 0.011] as const) {
        const linkArm = new THREE.Mesh(
          new THREE.BoxGeometry(camLinkArmLen, 0.007, 0.004),
          limestonePowderCoatMat
        );
        linkArm.name = `outbuildings.barn.golfSimulator.trackSystem.camLink.${sideTag}.${cIdx + 1}.arm.${lz < 0 ? 'inner' : 'outer'}`;
        linkArm.position.set(camLinkArmLen * 0.5, 0, lz);
        camLinkPivot.add(linkArm);
      }
    }
  }

  // Sub-Floor Concealed 16mm Synchronizing Torque Shaft (`y = -0.018m`, recessed in a steel sleeve beneath the limestone tiles
  // extending to the Barn South Wall so the lever sits right beside the wall and ZERO crossmember bar is visible!)
  const leverX = 1.94; // Behind the hitting area (`x = +1.12m`), at the rear South-East corner of the mat
  const leverZ = 5.43 - simCenterV - 0.065; // Tucked 65mm from the Barn South Wall (`v = 5.43m`), completely out of the floor!
  const syncTorqueShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, Math.abs(trackZPositions[0]) + leverZ, 12),
    hingeSteelMat
  );
  syncTorqueShaft.name = 'outbuildings.barn.golfSimulator.trackSystem.syncTorqueShaft';
  syncTorqueShaft.rotation.x = Math.PI / 2;
  syncTorqueShaft.position.set(leverX, -0.018, (leverZ - Math.abs(trackZPositions[0])) * 0.5);
  syncTorqueShaft.visible = false; // Concealed beneath the limestone tile floor screed!
  tileBaseGroup.add(syncTorqueShaft);

  // 2C. 2 Slim Inset Outside `25x15x3mm` Limestone Powder-Coated Channels (`outsideTrack.north/.south`)
  //     - When flush (`trackLiftSmooth = 0`): recessed at `y = -0.0138m .. +0.0012m` so the top lips sit FLUSH with the limestone tiles!
  //     - When lifted (`trackLiftSmooth = 1`): rises out of the floor slot to match the Inside Track height!
  const outsideTrackLiftGroup = new THREE.Group();
  outsideTrackLiftGroup.name = 'outbuildings.barn.golfSimulator.trackSystem.outsideTrack';
  outsideTrackLiftGroup.userData = {
    isGolfOutsideTrackLiftGroup: true,
    liftHeightY,
  };
  outsideTrackLiftGroup.position.set(0, 0, 0);
  hingeAssy.add(outsideTrackLiftGroup);

  for (const sideSign of [-1, 1] as const) {
    const sideTag = sideSign < 0 ? 'north' : 'south';
    const tz = sideSign * Math.abs(trackZPositions[1]);
    const outTrack = new THREE.Group();
    outTrack.name = `outbuildings.barn.golfSimulator.trackSystem.outsideTrack.${sideTag}`;
    outTrack.position.set(outsideTrackCenterX, outsideTrackLoweredBaseY, tz);
    outsideTrackLiftGroup.add(outTrack);

    populateSlimAluminiumUChannel(
      outTrack,
      `outbuildings.barn.golfSimulator.trackSystem.outsideTrack.${sideTag}`,
      outsideTrackLenX,
      limestonePowderCoatMat,
      limestoneTroughFloorMat
    );

    const frontEndCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, channelOuterH, channelOuterW),
      limestonePowderCoatMat
    );
    frontEndCap.name = `outbuildings.barn.golfSimulator.trackSystem.outsideTrack.${sideTag}.frontEndCap`;
    frontEndCap.position.set(outsideTrackLenX * 0.5 - 0.006, channelOuterH * 0.5, 0);
    outTrack.add(frontEndCap);
  }

  // 2D. Ergonomic 245mm (9.6") Over-Centre Cam-Lift Lever (`outbuildings.barn.golfSimulator.trackSystem.liftLever`)
  //     Rising through a flush limestone-powder-coated floor escutcheon plate tucked right against the Barn South Wall (`65mm` off the wall)!
  const leverBaseGroup = new THREE.Group();
  leverBaseGroup.name = 'outbuildings.barn.golfSimulator.trackSystem.liftLever.base';
  leverBaseGroup.position.set(leverX, 0, leverZ);
  hingeAssy.add(leverBaseGroup);

  // Flush 2mm floor slot escutcheon plate (`y = 0..0.002m`)
  const leverPlinth = new THREE.Mesh(
    new THREE.BoxGeometry(0.076, 0.002, 0.032),
    limestonePowderCoatMat
  );
  leverPlinth.name = 'outbuildings.barn.golfSimulator.trackSystem.liftLever.plinth';
  leverPlinth.position.set(0, 0.001, 0);
  leverBaseGroup.add(leverPlinth);

  const quadrantPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.052, 0.0015, 0.008),
    aluTroughFloorMat
  );
  quadrantPlate.name = 'outbuildings.barn.golfSimulator.trackSystem.liftLever.quadrant';
  quadrantPlate.position.set(0, 0.0018, 0);
  leverBaseGroup.add(quadrantPlate);

  const leverPivot = new THREE.Group();
  leverPivot.name = 'outbuildings.barn.golfSimulator.trackSystem.liftLever';
  leverPivot.userData = {
    isGolfTrackLiftLeverPivot: true,
    loweredAngleZ: -0.46, // Forward/low when lowered flush
    liftedAngleZ: 0.68,   // Pulled back over-centre when lifted
  };
  leverPivot.position.set(0, 0.002, 0);
  leverPivot.rotation.z = -0.46;
  leverBaseGroup.add(leverPivot);

  const leverHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.009, 0.016, 14),
    limestonePowderCoatMat
  );
  leverHub.name = 'outbuildings.barn.golfSimulator.trackSystem.liftLever.hub';
  leverHub.rotation.x = Math.PI / 2;
  leverPivot.add(leverHub);

  // 245mm (`9.6"`) solid 11mm-diameter lever arm (powder-coated limestone to match the tile tracks)
  const leverArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0055, 0.0065, 0.245, 12),
    limestonePowderCoatMat
  );
  leverArm.name = 'outbuildings.barn.golfSimulator.trackSystem.liftLever.arm';
  leverArm.position.set(0, 0.1225, 0);
  leverArm.castShadow = true;
  leverPivot.add(leverArm);

  // 76mm-wide x Ø18mm matte-charcoal ergonomic cylindrical T-grip pointing inward (`-z`) away from the South wall
  const leverGrip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.009, 0.076, 14),
    neoprenePadMat
  );
  leverGrip.name = 'outbuildings.barn.golfSimulator.trackSystem.liftLever.handle';
  leverGrip.rotation.x = Math.PI / 2;
  leverGrip.position.set(0, 0.245, -0.014);
  leverGrip.castShadow = true;
  leverPivot.add(leverGrip);

  // ===========================================================================
  // 3. Unbroken One-Piece Sliding Stance & Hitting Mat (`foldingMatGroup`, `x = +0.002m .. +1.962m`)
  //    - Top surface is 100% clean, continuous green turf (`yTop = 0.034m` when lowered flush) with ZERO plates or slots on top!
  //    - 8 low-profile underside roller brackets & 16 Ø18mm polyurethane rollers are mounted underneath the mat
  //      and run inside the 2 slim 25mm channels below!
  // ===========================================================================
  const foldingMatGroup = new THREE.Group();
  foldingMatGroup.name = 'outbuildings.barn.golfSimulator.turfMat.foldingLeaf';
  foldingMatGroup.position.set(frontCenterX, 0.017, 0);
  simGroup.add(foldingMatGroup);

  const fullSlidingTurfW = deckOuterW - 0.028; // 3.802m continuous unbroken width

  const frontSurroundBase = new THREE.Mesh(
    new THREE.BoxGeometry(frontLenX, 0.028, deckOuterW),
    stanceSurroundMat
  );
  frontSurroundBase.name = 'outbuildings.barn.golfSimulator.turfMat.frontSurround';
  frontSurroundBase.position.set(0, -0.003, 0);
  frontSurroundBase.castShadow = true;
  frontSurroundBase.receiveShadow = true;
  foldingMatGroup.add(frontSurroundBase);

  const frontFairwayTurf = new THREE.Mesh(
    new THREE.BoxGeometry(frontLenX - 0.016, 0.020, fullSlidingTurfW),
    fairwayTurfMat
  );
  frontFairwayTurf.name = 'outbuildings.barn.golfSimulator.turfMat';
  frontFairwayTurf.position.set(0, 0.007, 0);
  frontFairwayTurf.castShadow = true;
  frontFairwayTurf.receiveShadow = true;
  foldingMatGroup.add(frontFairwayTurf);

  // 8 Concealed Underside Roller Carriages (`rollerCarriage.1..8`) & 16 Ø18mm Polyurethane Rollers (`roller.1..16`)
  // Mounted entirely to the UNDERSIDE of the Sliding Mat (`y < 0` in `foldingMatGroup` local coordinates) so nothing appears on top of the mat!
  const bogieRelXs = [-0.78, -0.26, 0.26, 0.78] as const;
  const rollerRadius = 0.009; // Ø18mm low-profile polyurethane roller wheel inside the 19mm channel trough
  const rollerGeo = new THREE.CylinderGeometry(rollerRadius, rollerRadius, 0.015, 14);
  rollerGeo.rotateX(Math.PI / 2);
  rollerGeo.computeBoundingSphere();

  const axleGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.018, 10);
  axleGeo.rotateX(Math.PI / 2);
  axleGeo.computeBoundingSphere();

  let bogieIdx = 0;
  let rollerIdx = 0;
  for (const sideSign of [-1, 1] as const) {
    const tz = sideSign * Math.abs(trackZPositions[1]);
    for (const bx of bogieRelXs) {
      bogieIdx++;
      const bogieGroup = new THREE.Group();
      bogieGroup.name = `outbuildings.barn.golfSimulator.turfMat.rollerCarriage.${bogieIdx}`;
      bogieGroup.position.set(bx, 0, tz);
      foldingMatGroup.add(bogieGroup);

      for (const [cheekTag, cz] of [
        ['innerCheek', -0.008],
        ['outerCheek', 0.008],
      ] as const) {
        const cheek = new THREE.Mesh(
          new THREE.BoxGeometry(0.056, 0.012, 0.0025),
          hingeSteelMat
        );
        cheek.name = `outbuildings.barn.golfSimulator.turfMat.rollerCarriage.${bogieIdx}.${cheekTag}`;
        cheek.position.set(0, -0.006, cz);
        bogieGroup.add(cheek);
      }

      for (const wx of [-0.016, 0.016] as const) {
        rollerIdx++;
        const wheelGroup = new THREE.Group();
        wheelGroup.name = `outbuildings.barn.golfSimulator.turfMat.roller.${rollerIdx}`;
        wheelGroup.userData = {
          isGolfMatTrackRoller: true,
          rollerRadius,
        };
        wheelGroup.position.set(wx, -0.005, 0);
        bogieGroup.add(wheelGroup);

        const tireMesh = new THREE.Mesh(rollerGeo, rollerPolyMat);
        tireMesh.name = `outbuildings.barn.golfSimulator.turfMat.roller.${rollerIdx}.tire`;
        wheelGroup.add(tireMesh);

        const axlePin = new THREE.Mesh(axleGeo, aluChannelMat);
        axlePin.name = `outbuildings.barn.golfSimulator.turfMat.roller.${rollerIdx}.axle`;
        wheelGroup.add(axlePin);
      }
    }
  }

  // Centered Replaceable Fiberbuilt / Divot-Action Hitting Strip & Bezel (`z = 0`, dead center on target line!)
  const hittingX = 1.12;
  const hittingRelX = hittingX - frontCenterX;

  const hittingBezel = new THREE.Mesh(
    new THREE.BoxGeometry(0.388, 0.023, 0.968),
    hingeSteelMat
  );
  hittingBezel.name = 'outbuildings.barn.golfSimulator.hittingStrip.bezel';
  hittingBezel.position.set(hittingRelX, 0.0065, 0);
  foldingMatGroup.add(hittingBezel);

  const hittingStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.024, 0.94),
    hittingStripMat
  );
  hittingStrip.name = 'outbuildings.barn.golfSimulator.hittingStrip';
  hittingStrip.position.set(hittingRelX, 0.007, 0);
  hittingStrip.receiveShadow = true;
  foldingMatGroup.add(hittingStrip);

  const rubberTee = new THREE.Mesh(
    new THREE.CylinderGeometry(0.007, 0.014, 0.016, 10),
    golfBallMat
  );
  rubberTee.name = 'outbuildings.barn.golfSimulator.hittingStrip.rubberTee';
  rubberTee.userData = { lodTier: 'high', lodMaxDistance: 12 };
  rubberTee.position.set(hittingRelX, 0.024, 0);
  foldingMatGroup.add(rubberTee);

  const teedBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.016, 14, 12),
    golfBallMat
  );
  teedBall.name = 'outbuildings.barn.golfSimulator.hittingStrip.teedBall';
  teedBall.userData = { lodTier: 'high', lodMaxDistance: 12 };
  teedBall.position.set(hittingRelX, 0.036, 0);
  teedBall.castShadow = true;
  foldingMatGroup.add(teedBall);

  const ballTray = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.016, 0.42),
    stanceSurroundMat
  );
  ballTray.name = 'outbuildings.barn.golfSimulator.ballTray';
  ballTray.position.set(hittingRelX, 0.021, -0.78);
  foldingMatGroup.add(ballTray);

  for (let b = 0; b < 5; b++) {
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.016, 12, 10),
      golfBallMat
    );
    ball.name = `outbuildings.barn.golfSimulator.ballTray.ball.${b + 1}`;
    ball.userData = { lodTier: 'high', lodMaxDistance: 12 };
    ball.position.set(hittingRelX, 0.033, -0.92 + b * 0.07);
    foldingMatGroup.add(ball);
  }

  // 4. High-Mounted Purlin-to-Purlin Structural Steel Rigging Crossbar (`outbuildings.barn.golfSimulator.overheadCrossbar`),
  //    BenQ LK936ST 4K UHD Laser Golf Projector & Rear-Zone TrackMan iO Launch Monitor
  //    - Fixed high up in the vaulted roof space directly between the North and South longitudinal oak roof purlins
  //      (`outbuildings.roofTrusses.purlin.4.north` at `v = 1.5675m` and `purlin.4.south` at `v = 4.1425m`,
  //       `world y = 3.5093m` -> `local y = 3.8493m`, span = `2.575m` / 8'5.4"!).
  //    - Heavy matte-black steel timber-beam saddle brackets (`148mm × 148mm`) wrap around both 130mm × 130mm oak purlins
  //      with coach bolts and diagonal knee gussets supporting the horizontal `60mm × 60mm` steel crossbar at `x = +1.68m, y = 3.8493m`.
  //    - Both the BenQ LK936ST (`x = +1.68m, y = 2.94m`, `3.70m` throw distance = `TR 0.843:1`) and the TrackMan iO
  //      (`x = +1.44m, y = 3.12m` on a forward outrigger arm) hang cleanly from the high purlin crossbar!
  const crossbarX = 1.68;
  const purlinWorldY = 2.92 + (2.575 * ((4.84 - 3.24) / 3.055) - 0.01) * 0.5 - 0.08; // 3.5093m exact oak purlin centerline
  const crossbarY = purlinWorldY - barnWestFloorY; // 3.8493m above the -0.34m West Barn floor!
  const northPurlinV = 2.855 - 5.15 * 0.25; // 1.5675m exact North oak purlin V
  const southPurlinV = 2.855 + 5.15 * 0.25; // 4.1425m exact South oak purlin V
  const crossbarSpanV = southPurlinV - northPurlinV; // 2.575m purlin-to-purlin span
  const crossbarMidZ = (northPurlinV + southPurlinV) * 0.5 - simCenterV; // 2.855 - 3.355 = -0.50m

  const crossbarGroup = new THREE.Group();
  crossbarGroup.name = 'outbuildings.barn.golfSimulator.overheadCrossbar';
  crossbarGroup.position.set(crossbarX, crossbarY, 0);
  simGroup.add(crossbarGroup);

  // Main horizontal 60mm × 60mm structural steel RHS box-section beam spanning between the North & South oak purlins
  const crossbarBeam = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.06, crossbarSpanV - 0.12),
    hingeSteelMat
  );
  crossbarBeam.name = 'outbuildings.barn.golfSimulator.overheadCrossbar.beam';
  crossbarBeam.position.set(0, 0, crossbarMidZ);
  crossbarBeam.castShadow = true;
  crossbarBeam.receiveShadow = true;
  crossbarGroup.add(crossbarBeam);

  // Upper cable management conduit channel along the top of the steel crossbar
  const crossbarCableTray = new THREE.Mesh(
    new THREE.BoxGeometry(0.036, 0.022, crossbarSpanV - 0.16),
    projectorBodyMat
  );
  crossbarCableTray.name = 'outbuildings.barn.golfSimulator.overheadCrossbar.cableTray';
  crossbarCableTray.position.set(0, 0.041, crossbarMidZ);
  crossbarGroup.add(crossbarCableTray);

  // Wrap-around wrought-iron / powder-coated steel Purlin Saddle Clamps & Gussets bolted around the North & South 130mm × 130mm oak purlins
  for (const [sideLabel, purlinV, dirZ] of [
    ['north', northPurlinV, 1],
    ['south', southPurlinV, -1],
  ] as const) {
    const purlinLocalZ = purlinV - simCenterV;
    const bracketGrp = new THREE.Group();
    bracketGrp.name = `outbuildings.barn.golfSimulator.overheadCrossbar.purlinBracket.${sideLabel}`;
    bracketGrp.position.set(0, 0, purlinLocalZ);
    crossbarGroup.add(bracketGrp);

    // Full wrap-around steel box stirrup (`148mm × 148mm × 148mm`) embracing the 130mm × 130mm oak purlin
    const purlinStirrupCollar = new THREE.Mesh(
      new THREE.BoxGeometry(0.148, 0.148, 0.148),
      hingeSteelMat
    );
    purlinStirrupCollar.name = `outbuildings.barn.golfSimulator.overheadCrossbar.purlinBracket.${sideLabel}.stirrup`;
    purlinStirrupCollar.castShadow = true;
    bracketGrp.add(purlinStirrupCollar);

    // Inner socket boss where the 60mm × 60mm steel crossbar welds into the purlin stirrup
    const socketCollar = new THREE.Mesh(
      new THREE.BoxGeometry(0.084, 0.084, 0.048),
      projectorBodyMat
    );
    socketCollar.name = `outbuildings.barn.golfSimulator.overheadCrossbar.purlinBracket.${sideLabel}.collar`;
    socketCollar.position.set(0, 0, dirZ * 0.088);
    bracketGrp.add(socketCollar);

    // Diagonal steel web gusset bracing the crossbar underside to the bottom of the purlin stirrup
    const lowerGusset = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, 0.085, 0.11),
      hingeSteelMat
    );
    lowerGusset.name = `outbuildings.barn.golfSimulator.overheadCrossbar.purlinBracket.${sideLabel}.gusset`;
    lowerGusset.position.set(0, -0.048, dirZ * 0.095);
    lowerGusset.rotation.x = dirZ * 0.52;
    bracketGrp.add(lowerGusset);

    for (const [bIdx, [bx, by]] of (
      [
        [-0.045, 0.045],
        [0.045, 0.045],
        [-0.045, -0.045],
        [0.045, -0.045],
      ] as const
    ).entries()) {
      const coachBolt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 0.162, 8),
        aluChannelMat
      );
      coachBolt.name = `outbuildings.barn.golfSimulator.overheadCrossbar.purlinBracket.${sideLabel}.bolt.${bIdx + 1}`;
      coachBolt.userData = { lodTier: 'high', lodMaxDistance: 14 };
      coachBolt.rotation.x = Math.PI / 2;
      coachBolt.position.set(bx, by, 0);
      bracketGrp.add(coachBolt);
    }
  }

  // BenQ LK936ST 4K UHD Laser Golf Projector suspended from the purlin crossbar at `(x = +1.68m, y = 2.94m, z = 0)`
  const projectorY = 2.94;
  const projectorDropH = crossbarY - projectorY; // 0.909m rigid drop column from the purlin crossbar!

  const projectorGroup = new THREE.Group();
  projectorGroup.name = 'outbuildings.barn.golfSimulator.projector';
  projectorGroup.position.set(crossbarX, projectorY, 0);
  simGroup.add(projectorGroup);

  const projectorCrossbarClamp = new THREE.Mesh(
    new THREE.BoxGeometry(0.092, 0.092, 0.14),
    projectorBodyMat
  );
  projectorCrossbarClamp.name = 'outbuildings.barn.golfSimulator.projector.mountFlange';
  projectorCrossbarClamp.position.set(0, projectorDropH, 0);
  projectorGroup.add(projectorCrossbarClamp);

  const dropPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, projectorDropH, 14),
    projectorBodyMat
  );
  dropPole.name = 'outbuildings.barn.golfSimulator.projector.dropPole';
  dropPole.position.set(0, projectorDropH * 0.5, 0);
  dropPole.castShadow = true;
  projectorGroup.add(dropPole);

  const projectorPoleCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.036, 0.048, 14),
    hingeSteelMat
  );
  projectorPoleCollar.name = 'outbuildings.barn.golfSimulator.projector.poleCollar';
  projectorPoleCollar.userData = { lodTier: 'high', lodMaxDistance: 14 };
  projectorPoleCollar.position.set(0, projectorDropH * 0.48, 0);
  projectorGroup.add(projectorPoleCollar);

  // BenQ LK936ST Chassis (`351mm D × 166mm H × 416mm W`, subtle downward pitch + vertical lens shift toward screen)
  const projTiltZ = 0.09;
  const projectorChassis = new THREE.Mesh(
    new THREE.BoxGeometry(0.351, 0.166, 0.416),
    projectorBodyMat
  );
  projectorChassis.name = 'outbuildings.barn.golfSimulator.projector.chassis';
  projectorChassis.rotation.z = projTiltZ;
  projectorChassis.castShadow = true;
  projectorGroup.add(projectorChassis);

  // BenQ LK936ST signature metallic gold-anodized motorized zoom lens ring & recessed barrel
  const benqGoldRingMat = new THREE.MeshStandardMaterial({
    color: 0xc89d54,
    roughness: 0.28,
    metalness: 0.84,
  });
  const projectorGoldRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.052, 0.052, 0.038, 20),
    benqGoldRingMat
  );
  projectorGoldRing.name = 'outbuildings.barn.golfSimulator.projector.lensGoldRing';
  projectorGoldRing.userData = { lodTier: 'high', lodMaxDistance: 16 };
  projectorGoldRing.rotation.z = Math.PI / 2 + projTiltZ;
  projectorGoldRing.position.set(-0.178, -0.014, 0.035);
  projectorGroup.add(projectorGoldRing);

  const lensMat = new THREE.MeshStandardMaterial({
    color: 0xe0f7fa,
    emissive: new THREE.Color(0x90caf9),
    emissiveIntensity: 1.8,
    roughness: 0.12,
  });
  const projectorLens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.044, 0.044, 0.042, 20),
    lensMat
  );
  projectorLens.name = 'outbuildings.barn.golfSimulator.projector.lens';
  projectorLens.rotation.z = Math.PI / 2 + projTiltZ;
  projectorLens.position.set(-0.184, -0.015, 0.035);
  projectorGroup.add(projectorLens);

  // Official Spec-Compliant Overhead Launch Monitor (`trackmanIO`):
  // Mounted `0.90m` (`35.4"`) IN FRONT of the teed ball (`hittingX = 1.12m` -> `tmX = +0.22m`)
  // at `tmY = 2.78m` (`9' 1.5"` above floor / `9' 0"` above hitting mat) on a rigid steel outrigger bracket
  // bolted to the portal header (`x = -0.03m`), angled backward (`tmTiltZ = -0.28`) toward the hitting strip!
  const tmX = hittingX - 0.90; // +0.22m (exact 0.90m / 35.4" forward of the teed ball!)
  const tmY = 2.78;
  const outriggerBackX = -0.25; // Cantilevers from the portal header at x = -0.03m to tmX = +0.22m
  const outriggerRiseY = 0.06;

  const tmGroup = new THREE.Group();
  tmGroup.name = 'outbuildings.barn.golfSimulator.trackmanIO';
  tmGroup.position.set(tmX, tmY, 0);
  simGroup.add(tmGroup);

  const tmMountFlange = new THREE.Mesh(
    new THREE.BoxGeometry(0.048, 0.068, 0.088),
    projectorBodyMat
  );
  tmMountFlange.name = 'outbuildings.barn.golfSimulator.trackmanIO.mountFlange';
  tmMountFlange.position.set(outriggerBackX, outriggerRiseY, 0);
  tmGroup.add(tmMountFlange);

  // Rigid horizontal steel outrigger boom (`32mm × 44mm`) cantilevered from the portal header (`x = -0.03m`) to `tmX = +0.22m`
  const tmOutriggerBoom = new THREE.Mesh(
    new THREE.BoxGeometry(Math.abs(outriggerBackX) + 0.02, 0.032, 0.044),
    hingeSteelMat
  );
  tmOutriggerBoom.name = 'outbuildings.barn.golfSimulator.trackmanIO.outriggerBoom';
  tmOutriggerBoom.position.set(outriggerBackX * 0.5, outriggerRiseY, 0);
  tmOutriggerBoom.castShadow = true;
  tmGroup.add(tmOutriggerBoom);

  const tmDropTube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, outriggerRiseY + 0.02, 12),
    projectorBodyMat
  );
  tmDropTube.name = 'outbuildings.barn.golfSimulator.trackmanIO.dropTube';
  tmDropTube.position.set(0, outriggerRiseY * 0.5, 0);
  tmDropTube.castShadow = true;
  tmGroup.add(tmDropTube);

  // Tilted toward the golfer (`-0.28 rad` around Z so `+x,-y` radar/optical cameras look back at the hitting strip `x = +1.12m`)
  const tmTiltZ = -0.28;
  const tmCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.072, 0.34),
    projectorBodyMat
  );
  tmCore.name = 'outbuildings.barn.golfSimulator.trackmanIO.core';
  tmCore.rotation.z = tmTiltZ;
  tmCore.castShadow = true;
  tmGroup.add(tmCore);

  for (const sideZ of [-1, 1] as const) {
    const sideLabel = sideZ < 0 ? 'north' : 'south';
    const tmWing = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.058, 0.16),
      projectorBodyMat
    );
    tmWing.name = `outbuildings.barn.golfSimulator.trackmanIO.wing.${sideLabel}`;
    tmWing.position.set(0.01, -0.004, sideZ * 0.22);
    tmWing.rotation.z = tmTiltZ;
    tmWing.rotation.y = -sideZ * 0.16;
    tmWing.castShadow = true;
    tmGroup.add(tmWing);

    const camGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.012, 14),
      velvetFrameMat
    );
    camGlass.name = `outbuildings.barn.golfSimulator.trackmanIO.cameraLens.${sideLabel}`;
    camGlass.rotation.z = tmTiltZ;
    camGlass.position.set(0.02, -0.036, sideZ * 0.2);
    tmGroup.add(camGlass);
  }

  const tmOrangeAccent = new THREE.Mesh(
    new THREE.BoxGeometry(0.268, 0.016, 0.56),
    trackManOrangeMat
  );
  tmOrangeAccent.name = 'outbuildings.barn.golfSimulator.trackmanIO.orangeAccent';
  tmOrangeAccent.position.set(0, 0.028, 0);
  tmOrangeAccent.rotation.z = tmTiltZ;
  tmGroup.add(tmOrangeAccent);

  // 5. Illuminated "GOLF SIM" Status Sign & Red Indicator Lights
  const signTex = createGolfStatusSignTexture();
  const statusSignFaceMat = new THREE.MeshStandardMaterial({
    map: signTex,
    emissiveMap: signTex,
    emissive: new THREE.Color(0xff2a20),
    emissiveIntensity: 1.35,
    roughness: 0.25,
    metalness: 0.1,
  });
  statusSignFaceMat.userData = { isDynamicGolfStatusLight: true };

  const statusBeaconRedMat = new THREE.MeshStandardMaterial({
    color: 0xff2418,
    emissive: new THREE.Color(0xff1810),
    emissiveIntensity: 2.2,
    roughness: 0.18,
    metalness: 0.08,
  });
  statusBeaconRedMat.userData = { isDynamicGolfStatusLight: true };

  // 'GOLF BAY IN USE' status signs removed per user request

  return {
    simGroup,
    simCeilingGroup,
    simCenterV,
    clearW,
    clearH,
    wallBoxH,
    frontLenX,
    velvetFrameMat,
    projectorBodyMat,
    trackManOrangeMat,
    impactScreenMat,
    screenTex,
    artworkTex,
    statusSignFaceMat,
    statusBeaconRedMat,
    rearFairwayTurf,
    screenMesh,
    hingeAssy,
    foldingMatGroup,
  };
}
