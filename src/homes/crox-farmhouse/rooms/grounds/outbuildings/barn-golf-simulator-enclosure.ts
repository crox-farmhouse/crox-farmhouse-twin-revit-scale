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
  const w = 1024;
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
  uWallMin: number,
  uWallMax: number,
  barnWestFloorY: number,
  plasterMat: THREE.Material,
  groundCeilingGroup?: THREE.Group
): BarnGolfSimulatorEnclosureHandles {
  const simCenterV = 3.22;
  const simGroup = new THREE.Group();
  simGroup.name = 'outbuildings.barn.golfSimulator';
  simGroup.position.set(uWallMax, barnWestFloorY, simCenterV);
  groundGroup.add(simGroup);

  const simCeilingGroup = new THREE.Group();
  simCeilingGroup.name = 'outbuildings.barn.golfSimulator.ceiling';
  simCeilingGroup.position.set(uWallMax, barnWestFloorY, simCenterV);
  (groundCeilingGroup ?? groundGroup).add(simCeilingGroup);

  const clearW = 3.80; // 12'6" TrackMan Widescreen enclosure width (v = 1.32m..5.12m)
  const clearH = 2.85; // 9'4" (2.85m) official TrackMan iO minimum enclosure ceiling height
  const recessDepthU = 2.16;
  const wallT = uWallMax - uWallMin;

  const acousticBaffleMat = new THREE.MeshStandardMaterial({
    color: 0x1a1c20,
    roughness: 0.92,
    metalness: 0.02,
  });
  const velvetFrameMat = new THREE.MeshStandardMaterial({
    color: 0x111316,
    roughness: 0.88,
    metalness: 0.04,
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

  const storeBoxDepth = recessDepthU - wallT;
  const wallBoxH = clearH + 0.01;
  const linerWallH = clearH - 0.004;
  const storeBackWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, linerWallH, clearW + 0.18),
    plasterMat
  );
  storeBackWall.name = 'outbuildings.barn.golfSimulator.enclosureWall.back';
  storeBackWall.userData.isArchitecturalShell = true;
  storeBackWall.position.set(-recessDepthU - 0.045, linerWallH * 0.5, 0);
  storeBackWall.castShadow = true;
  storeBackWall.receiveShadow = true;
  simGroup.add(storeBackWall);

  for (const sideZ of [-1, 1] as const) {
    const storeSideWall = new THREE.Mesh(
      new THREE.BoxGeometry(storeBoxDepth, linerWallH, 0.09),
      plasterMat
    );
    storeSideWall.name = `outbuildings.barn.golfSimulator.enclosureWall.${sideZ < 0 ? 'north' : 'south'}`;
    storeSideWall.userData.isArchitecturalShell = true;
    storeSideWall.position.set(
      -wallT - storeBoxDepth * 0.5,
      linerWallH * 0.5,
      sideZ * (clearW * 0.5 + 0.045)
    );
    storeSideWall.castShadow = true;
    storeSideWall.receiveShadow = true;
    simGroup.add(storeSideWall);
  }

  const numBaffleCols = 6;
  const baffleColW = recessDepthU / numBaffleCols;
  for (let c = 0; c < numBaffleCols; c++) {
    const bx = -recessDepthU + (c + 0.5) * baffleColW;

    for (const sideZ of [-1, 1] as const) {
      const sideBaffle = new THREE.Mesh(
        new THREE.BoxGeometry(baffleColW - 0.015, clearH - 0.04, 0.055),
        acousticBaffleMat
      );
      sideBaffle.name = `outbuildings.barn.golfSimulator.sideBaffle.${sideZ < 0 ? 'north' : 'south'}.${c + 1}`;
      sideBaffle.position.set(bx, clearH * 0.5, sideZ * (clearW * 0.5 - 0.028));
      sideBaffle.castShadow = true;
      sideBaffle.receiveShadow = true;
      simGroup.add(sideBaffle);
    }

    const ceilBaffle = new THREE.Mesh(
      new THREE.BoxGeometry(baffleColW - 0.015, 0.055, clearW - 0.08),
      acousticBaffleMat
    );
    ceilBaffle.name = 'outbuildings.barn.golfSimulator.ceilingBaffle';
    ceilBaffle.position.set(bx, clearH - 0.028, 0);
    simCeilingGroup.add(ceilBaffle);
  }

  const frameTrimW = 0.095;
  const portalTrimBottomY = 0.048;
  const portalTrimH = clearH - portalTrimBottomY;
  for (const sideZ of [-1, 1] as const) {
    const sideTrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, portalTrimH, frameTrimW),
      velvetFrameMat
    );
    sideTrim.name = `outbuildings.barn.golfSimulator.portalTrim.${sideZ < 0 ? 'north' : 'south'}`;
    sideTrim.position.set(
      -0.04,
      portalTrimBottomY + portalTrimH * 0.5,
      sideZ * (clearW * 0.5 - frameTrimW * 0.5)
    );
    simGroup.add(sideTrim);
  }
  const topTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, frameTrimW, clearW),
    velvetFrameMat
  );
  topTrim.name = 'outbuildings.barn.golfSimulator.portalTrim.top';
  topTrim.position.set(-0.04, clearH - frameTrimW * 0.5, 0);
  simCeilingGroup.add(topTrim);

  const screenMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(clearW - 0.1, clearH - 0.08),
    impactScreenMat
  );
  screenMesh.name = 'outbuildings.barn.golfSimulator.screen';
  screenMesh.rotation.y = Math.PI / 2;
  screenMesh.position.set(-recessDepthU + 0.14, clearH * 0.5, 0);
  simGroup.add(screenMesh);

  const screenBacking = new THREE.Mesh(
    new THREE.PlaneGeometry(clearW - 0.06, clearH - 0.04),
    velvetFrameMat
  );
  screenBacking.name = 'outbuildings.barn.golfSimulator.screen.backing';
  screenBacking.rotation.y = -Math.PI / 2;
  screenBacking.position.set(-recessDepthU + 0.12, clearH * 0.5, 0);
  simGroup.add(screenBacking);

  // Clear slot width between `portalTrim.north/.south` is `clearW - 2 * frameTrimW = 3.61m`
  // and between `sideBaffle.north/.south` is `clearW - 0.111 = 3.689m`.
  // Sizing `deckOuterW = clearW - 0.22 = 3.58m` gives 15mm clearance per side through the portal
  // and leaves a 54.5mm mechanical channel per side inside the bay for the gas-strut counterbalances.
  const deckOuterW = clearW - 0.22; // 3.58m
  const trackZPositions = [-1.24, 1.24] as const; // North (`z = -1.24m`) & South (`z = +1.24m`) roller tracks
  const trackSlotW = 0.068; // 68mm clear slot width through the mats for the 54mm C-channel track
  const liftHeightY = 0.036; // 36mm vertical cam-lift so the sliding mat clears the 34mm inside mat when rolling in

  const turfStartX = -recessDepthU + 0.16; // -2.00m
  const rearTurfEndX = -0.002; // Butts flush against `frontTurfStartX = +0.002m` at `x = 0`!
  const rearLenX = rearTurfEndX - turfStartX; // 1.998m
  const rearCenterX = (turfStartX + rearTurfEndX) * 0.5; // -1.001m

  const frontTurfStartX = 0.002;
  const frontLenX = 1.964; // Matches `BoxGeometry(1.932..1.964)` sliding mat span
  const turfEndX = frontTurfStartX + frontLenX; // +1.966m
  const frontCenterX = (frontTurfStartX + turfEndX) * 0.5; // +0.984m
  const outsideTrackEndX = turfEndX + 0.114; // +2.080m on the limestone tiles

  // ===========================================================================
  // 1. Fixed Inside Putting Mat (`rearFairwayTurf`, `x = -2.00m .. -0.002m`, `yTop = 0.034m`)
  //    Split into 3 precision turf sections around `z = -1.24m` and `z = +1.24m` so the
  //    2 Inside Roller Tracks (`insideTrack.north` & `insideTrack.south`) run cleanly THROUGH the inside mat!
  // ===========================================================================
  const rearSurroundBase = new THREE.Mesh(
    new THREE.BoxGeometry(rearLenX + 0.036, 0.028, clearW - 0.06),
    stanceSurroundMat
  );
  rearSurroundBase.name = 'outbuildings.barn.golfSimulator.turfMat.rearSurround';
  rearSurroundBase.position.set(rearCenterX - 0.016, 0.014, 0);
  rearSurroundBase.receiveShadow = true;
  simGroup.add(rearSurroundBase);

  const centerStripW = (Math.abs(trackZPositions[0]) - trackSlotW * 0.5) * 2; // 2.412m (`z = -1.206..+1.206m`)
  const outerWingW = deckOuterW * 0.5 - (Math.abs(trackZPositions[1]) + trackSlotW * 0.5); // 0.516m
  const outerWingCenterZ = Math.abs(trackZPositions[1]) + trackSlotW * 0.5 + outerWingW * 0.5; // 1.532m

  // 1A. Central Fixed Inside Turf Panel (`z = -1.206m .. +1.206m`, `y = 0..0.034m`)
  const rearFairwayTurf = new THREE.Mesh(
    new THREE.BoxGeometry(rearLenX, 0.034, centerStripW),
    fairwayTurfMat
  );
  rearFairwayTurf.name = 'outbuildings.barn.golfSimulator.turfMat.rearFixed';
  rearFairwayTurf.position.set(rearCenterX, 0.017, 0);
  rearFairwayTurf.receiveShadow = true;
  simGroup.add(rearFairwayTurf);

  // 1B. North & South Outer Fixed Inside Turf Wings flanking the 2 Inside Tracks (`z = ±1.532m`)
  for (const sideSign of [-1, 1] as const) {
    const sideTag = sideSign < 0 ? 'northWing' : 'southWing';
    const rearWingTurf = new THREE.Mesh(
      new THREE.BoxGeometry(rearLenX, 0.034, outerWingW),
      fairwayTurfMat
    );
    rearWingTurf.name = `outbuildings.barn.golfSimulator.turfMat.rearFixed.${sideTag}`;
    rearWingTurf.position.set(rearCenterX, 0.017, sideSign * outerWingCenterZ);
    rearWingTurf.receiveShadow = true;
    simGroup.add(rearWingTurf);
  }

  for (const [cupIdx, [cupX, cupZ]] of (
    [
      [-0.35, -0.92],
      [-0.35, 0.92],
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
  // 2. Twin Parallel Linear Roller Tracks (`z = ±1.24m`) & Cam-Lift Lever Mechanism
  //    - 2 Inside Tracks (`insideTrack.north/.south`) running THROUGH the inside mat at `y = +0.036m`
  //    - 2 Outside Tracks (`outsideTrack.north/.south`) on the limestone tiles (`x = +0.002..+2.080m`)
  //      mounted on a parallel-link cam-lift frame controlled by the Small Cam-Lift Lever (`liftLever`):
  //      * When rolled all the way out (`liftProgress = 0`): Outside Tracks sit DOWN (`y = 0`) on the tiles
  //        so the Sliding Mat (`yTop = 0.034m`) sits 100% FLUSH with the Inside Mat (`yTop = 0.034m`).
  //      * When the Small Lever is pulled (`liftProgress = 1`): Outside Tracks lift UP by `+0.036m` to
  //        match the exact height of the Inside Tracks (`y = +0.036m`), allowing the Sliding Mat to roll
  //        effortlessly on its rollers straight back over the Inside Mat!
  // ===========================================================================
  const trackSteelMat = new THREE.MeshStandardMaterial({
    color: 0x2c323b,
    roughness: 0.26,
    metalness: 0.86,
  });
  const trackRailSilverMat = new THREE.MeshStandardMaterial({
    color: 0xb8c0ca,
    roughness: 0.22,
    metalness: 0.9,
  });
  const trackBrassMat = new THREE.MeshStandardMaterial({
    color: 0xc59b58,
    roughness: 0.24,
    metalness: 0.88,
  });
  const rollerPolyMat = new THREE.MeshStandardMaterial({
    color: 0xd96b27,
    roughness: 0.35,
    metalness: 0.12,
  });
  const neoprenePadMat = new THREE.MeshStandardMaterial({
    color: 0x181a1e,
    roughness: 0.88,
    metalness: 0.04,
  });

  // `hingeAssy` serves as the interactive root container for the Track & Cam-Lift Lever System
  const hingeAssy = new THREE.Group();
  hingeAssy.name = 'outbuildings.barn.golfSimulator.trackSystem';
  hingeAssy.position.set(0, 0, 0);
  simGroup.add(hingeAssy);

  // 2A. Fixed Inside Tracks (`insideTrack.north` & `insideTrack.south`) running THROUGH the inside mat
  //     Positioned with their roller running bed at `y = liftHeightY = +0.036m` (supported on steel pedestals
  //     through the 68mm slot in the inside mat) so that when the sliding mat rolls in, its underside clears
  //     the `y = 0.034m` inside mat by 2mm!
  const insideTrackGroup = new THREE.Group();
  insideTrackGroup.name = 'outbuildings.barn.golfSimulator.trackSystem.insideTrack';
  hingeAssy.add(insideTrackGroup);

  for (const sideSign of [-1, 1] as const) {
    const sideTag = sideSign < 0 ? 'north' : 'south';
    const tz = sideSign * Math.abs(trackZPositions[1]);
    const inTrack = new THREE.Group();
    inTrack.name = `outbuildings.barn.golfSimulator.trackSystem.insideTrack.${sideTag}`;
    inTrack.position.set(rearCenterX, 0, tz);
    insideTrackGroup.add(inTrack);

    // Full-length recessed sub-base channel anchored to the bay slab (`y = 0..0.036m`) inside the mat slot
    const supportWeb = new THREE.Mesh(
      new THREE.BoxGeometry(rearLenX, liftHeightY, 0.038),
      trackSteelMat
    );
    supportWeb.name = `outbuildings.barn.golfSimulator.trackSystem.insideTrack.${sideTag}.supportWeb`;
    supportWeb.position.set(0, liftHeightY * 0.5, 0);
    inTrack.add(supportWeb);

    // Raised C-Channel Roller Running Bed at `y = liftHeightY = 0.036m`
    const railBed = new THREE.Mesh(
      new THREE.BoxGeometry(rearLenX, 0.004, 0.054),
      trackRailSilverMat
    );
    railBed.name = `outbuildings.barn.golfSimulator.trackSystem.insideTrack.${sideTag}.railBed`;
    railBed.position.set(0, liftHeightY + 0.002, 0);
    railBed.receiveShadow = true;
    inTrack.add(railBed);

    // Twin vertical guide walls (`z = ±0.024m`, forming a 42mm wide precision roller trough at `y = 0.036..0.052m`)
    for (const [wallTag, wz] of [
      ['innerFlange', -sideSign * 0.024],
      ['outerFlange', sideSign * 0.024],
    ] as const) {
      const flange = new THREE.Mesh(
        new THREE.BoxGeometry(rearLenX, 0.016, 0.006),
        trackSteelMat
      );
      flange.name = `outbuildings.barn.golfSimulator.trackSystem.insideTrack.${sideTag}.${wallTag}`;
      flange.position.set(0, liftHeightY + 0.01, wz);
      flange.castShadow = true;
      inTrack.add(flange);

      const brassLip = new THREE.Mesh(
        new THREE.BoxGeometry(rearLenX, 0.0025, 0.008),
        trackBrassMat
      );
      brassLip.name = `outbuildings.barn.golfSimulator.trackSystem.insideTrack.${sideTag}.${wallTag}.brassLip`;
      brassLip.position.set(0, liftHeightY + 0.019, wz);
      inTrack.add(brassLip);
    }

    // Rear rubber bumper stop at `x = turfStartX + 0.025m`
    const rearBumper = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.018, 0.044),
      neoprenePadMat
    );
    rearBumper.name = `outbuildings.barn.golfSimulator.trackSystem.insideTrack.${sideTag}.rearStop`;
    rearBumper.position.set(-rearLenX * 0.5 + 0.018, liftHeightY + 0.011, 0);
    inTrack.add(rearBumper);
  }

  // 2B. Stationary Tile Base Plates, Synchronizing Cross-Shaft & Pivoting Cam-Lift Rockers on the Limestone Tiles
  const outsideTrackLenX = outsideTrackEndX - frontTurfStartX; // 2.078m (`x = +0.002m .. +2.080m`)
  const outsideTrackCenterX = (frontTurfStartX + outsideTrackEndX) * 0.5; // +1.041m

  const tileBaseGroup = new THREE.Group();
  tileBaseGroup.name = 'outbuildings.barn.golfSimulator.trackSystem.tileMountingBase';
  hingeAssy.add(tileBaseGroup);

  const camStationsX = [0.22, 0.78, 1.34, 1.92] as const;
  const camLinkArmLen = 0.052; // 52mm parallel-link cam arms (`sin(44°) * 0.052 ≈ 0.036m` lift!)

  for (const sideSign of [-1, 1] as const) {
    const sideTag = sideSign < 0 ? 'north' : 'south';
    const tz = sideSign * Math.abs(trackZPositions[1]);

    // Low-profile dark-steel mounting soleplate bolted to the limestone tiles (`y = 0..0.003m`)
    const tileSolePlate = new THREE.Mesh(
      new THREE.BoxGeometry(outsideTrackLenX + 0.02, 0.003, 0.064),
      trackSteelMat
    );
    tileSolePlate.name = `outbuildings.barn.golfSimulator.trackSystem.tileBase.${sideTag}`;
    tileSolePlate.position.set(outsideTrackCenterX, 0.0015, tz);
    tileSolePlate.receiveShadow = true;
    tileBaseGroup.add(tileSolePlate);

    // 4 Pivoting Eccentric Cam-Lift Linkages per track (`userData.isGolfTrackCamLink = true`)
    for (let cIdx = 0; cIdx < camStationsX.length; cIdx++) {
      const cx = camStationsX[cIdx]!;
      const clevisBase = new THREE.Mesh(
        new THREE.BoxGeometry(0.044, 0.008, 0.058),
        trackBrassMat
      );
      clevisBase.name = `outbuildings.barn.golfSimulator.trackSystem.camClevis.${sideTag}.${cIdx + 1}`;
      clevisBase.position.set(cx, 0.005, tz);
      tileBaseGroup.add(clevisBase);

      const camLinkPivot = new THREE.Group();
      camLinkPivot.name = `outbuildings.barn.golfSimulator.trackSystem.camLink.${sideTag}.${cIdx + 1}`;
      camLinkPivot.userData = { isGolfTrackCamLink: true };
      camLinkPivot.position.set(cx - 0.018, 0.006, tz);
      tileBaseGroup.add(camLinkPivot);

      for (const lz of [-0.021, 0.021] as const) {
        const linkArm = new THREE.Mesh(
          new THREE.BoxGeometry(camLinkArmLen, 0.007, 0.005),
          trackBrassMat
        );
        linkArm.name = `outbuildings.barn.golfSimulator.trackSystem.camLink.${sideTag}.${cIdx + 1}.arm.${lz < 0 ? 'inner' : 'outer'}`;
        linkArm.position.set(camLinkArmLen * 0.5, 0, lz);
        camLinkPivot.add(linkArm);
      }
    }
  }

  // Transverse Synchronizing Cam Torque Shaft (`x = +0.22m`, linking North & South outside tracks + lever)
  const syncTorqueShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.007, 0.007, Math.abs(trackZPositions[1]) * 2 + 0.24, 14),
    trackSteelMat
  );
  syncTorqueShaft.name = 'outbuildings.barn.golfSimulator.trackSystem.syncTorqueShaft';
  syncTorqueShaft.rotation.x = Math.PI / 2;
  syncTorqueShaft.position.set(0.22, 0.007, 0.08);
  tileBaseGroup.add(syncTorqueShaft);

  // 2C. Movable Outside Tracks (`outsideTrackLiftGroup`) on the Limestone Tiles
  //     Lifts vertically from `y = 0` (Flush Play Mode) to `y = +0.036m` (Aligned Roll-In Mode, matching `insideTrack`)!
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
    outTrack.position.set(outsideTrackCenterX, 0, tz);
    outsideTrackLiftGroup.add(outTrack);

    // C-Channel Roller Running Bed (`y = 0.002m` when lowered, lifting to `y = 0.038m` to match `insideTrack.railBed`!)
    const railBed = new THREE.Mesh(
      new THREE.BoxGeometry(outsideTrackLenX, 0.004, 0.054),
      trackRailSilverMat
    );
    railBed.name = `outbuildings.barn.golfSimulator.trackSystem.outsideTrack.${sideTag}.railBed`;
    railBed.position.set(0, 0.004, 0);
    railBed.receiveShadow = true;
    outTrack.add(railBed);

    // Twin vertical guide walls (`z = ±0.024m`)
    for (const [wallTag, wz] of [
      ['innerFlange', -sideSign * 0.024],
      ['outerFlange', sideSign * 0.024],
    ] as const) {
      const flange = new THREE.Mesh(
        new THREE.BoxGeometry(outsideTrackLenX, 0.016, 0.006),
        trackSteelMat
      );
      flange.name = `outbuildings.barn.golfSimulator.trackSystem.outsideTrack.${sideTag}.${wallTag}`;
      flange.position.set(0, 0.012, wz);
      flange.castShadow = true;
      outTrack.add(flange);

      const brassLip = new THREE.Mesh(
        new THREE.BoxGeometry(outsideTrackLenX, 0.0025, 0.008),
        trackBrassMat
      );
      brassLip.name = `outbuildings.barn.golfSimulator.trackSystem.outsideTrack.${sideTag}.${wallTag}.brassLip`;
      brassLip.position.set(0, 0.021, wz);
      outTrack.add(brassLip);
    }

    // Front cushioned end-stop & bevelled brass nose cap on the limestone tiles (`x = +2.07m`)
    const frontEndCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.026, 0.02, 0.056),
      trackBrassMat
    );
    frontEndCap.name = `outbuildings.barn.golfSimulator.trackSystem.outsideTrack.${sideTag}.frontEndCap`;
    frontEndCap.position.set(outsideTrackLenX * 0.5 - 0.013, 0.011, 0);
    outTrack.add(frontEndCap);
  }

  // 2D. Small Cam-Lift Lever (`outbuildings.barn.golfSimulator.trackSystem.liftLever`)
  //     Mounted on the limestone tiles beside the South Outside Track (`x = +0.22m, z = +1.38m`).
  //     Throwing the lever lifts the outside tracks up `+36mm` to match the inside tracks, and lowering
  //     it when the mat is rolled all the way out drops the outside tracks back down so the mats sit flush!
  const leverBaseGroup = new THREE.Group();
  leverBaseGroup.name = 'outbuildings.barn.golfSimulator.trackSystem.liftLever.base';
  leverBaseGroup.position.set(0.22, 0, Math.abs(trackZPositions[1]) + 0.14);
  hingeAssy.add(leverBaseGroup);

  const leverPlinth = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.014, 0.072),
    trackSteelMat
  );
  leverPlinth.name = 'outbuildings.barn.golfSimulator.trackSystem.liftLever.plinth';
  leverPlinth.position.set(0, 0.007, 0);
  leverPlinth.castShadow = true;
  leverBaseGroup.add(leverPlinth);

  // Ratchet quadrant arch with "FLUSH" and "LIFT" detent notches
  const quadrantPlate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.048, 0.048, 0.01, 20, 1, false, 0, Math.PI),
    trackBrassMat
  );
  quadrantPlate.name = 'outbuildings.barn.golfSimulator.trackSystem.liftLever.quadrant';
  quadrantPlate.rotation.x = Math.PI / 2;
  quadrantPlate.position.set(0, 0.014, -0.014);
  leverBaseGroup.add(quadrantPlate);

  const leverPivot = new THREE.Group();
  leverPivot.name = 'outbuildings.barn.golfSimulator.trackSystem.liftLever';
  leverPivot.userData = {
    isGolfTrackLiftLeverPivot: true,
    loweredAngleZ: -0.42, // Forward/down when outside track is lowered flush
    liftedAngleZ: 0.72,   // Pulled up/back when outside track is lifted to inside track height
  };
  leverPivot.position.set(0, 0.018, 0);
  leverPivot.rotation.z = -0.42;
  leverBaseGroup.add(leverPivot);

  const leverHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.036, 16),
    trackBrassMat
  );
  leverHub.name = 'outbuildings.barn.golfSimulator.trackSystem.liftLever.hub';
  leverHub.rotation.x = Math.PI / 2;
  leverPivot.add(leverHub);

  const leverArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0065, 0.0085, 0.21, 12),
    trackSteelMat
  );
  leverArm.name = 'outbuildings.barn.golfSimulator.trackSystem.liftLever.arm';
  leverArm.position.set(0, 0.105, 0);
  leverArm.castShadow = true;
  leverPivot.add(leverArm);

  // Ergonomic Brushed-Brass & TrackMan-Orange T-Handle Grip at top of lever
  const leverGrip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.013, 0.013, 0.068, 16),
    trackBrassMat
  );
  leverGrip.name = 'outbuildings.barn.golfSimulator.trackSystem.liftLever.handle';
  leverGrip.rotation.x = Math.PI / 2;
  leverGrip.position.set(0, 0.215, 0.012);
  leverGrip.castShadow = true;
  leverPivot.add(leverGrip);

  const leverReleaseButton = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.014, 12),
    trackManOrangeMat
  );
  leverReleaseButton.name = 'outbuildings.barn.golfSimulator.trackSystem.liftLever.detentButton';
  leverReleaseButton.rotation.x = Math.PI / 2;
  leverReleaseButton.position.set(0, 0.215, 0.048);
  leverPivot.add(leverReleaseButton);

  // ===========================================================================
  // 3. Sliding Stance & Hitting Mat on Rollers (`foldingMatGroup`, `x = +0.002m .. +1.966m`)
  //    - Sits at `yTop = 0.034m` (100% FLUSH with `rearFairwayTurf` at `yTop = 0.034m`) when rolled out!
  //    - Split into 3 turf panels around the 2 roller-track slots (`z = ±1.24m`) and equipped with
  //      8 CNC-machined Roller Carriages (`rollerCarriage.1..8`) & 16 Flanged Polyurethane Rollers
  //      (`roller.1..16`) that visibly run inside the North & South tracks!
  // ===========================================================================
  const foldingOakEdgeMat = new THREE.MeshStandardMaterial({
    color: 0xa6794a,
    roughness: 0.42,
    metalness: 0.04,
  });

  const foldingMatGroup = new THREE.Group();
  foldingMatGroup.name = 'outbuildings.barn.golfSimulator.turfMat.foldingLeaf';
  foldingMatGroup.position.set(frontCenterX, 0.017, 0);
  simGroup.add(foldingMatGroup);

  // 3A. Structural Rigid Aluminium-Honeycomb & Neoprene Base Tray (`y = -0.014m .. +0.006m` in local coords)
  //     Split around `z = ±1.24m` so the 2 tracks and rollers are visible from above and below!
  const centerTray = new THREE.Mesh(
    new THREE.BoxGeometry(frontLenX - 0.008, 0.014, centerStripW),
    trackSteelMat
  );
  centerTray.name = 'outbuildings.barn.golfSimulator.turfMat.lvtCoreSubstrate';
  centerTray.position.set(0, -0.008, 0);
  centerTray.castShadow = true;
  centerTray.receiveShadow = true;
  foldingMatGroup.add(centerTray);

  // 3B. Central Sliding Fairway Turf Panel (`outbuildings.barn.golfSimulator.turfMat`, `yTop = +0.017m` local = `0.034m` world)
  const frontFairwayTurf = new THREE.Mesh(
    new THREE.BoxGeometry(frontLenX, 0.02, centerStripW),
    fairwayTurfMat
  );
  frontFairwayTurf.name = 'outbuildings.barn.golfSimulator.turfMat';
  frontFairwayTurf.position.set(0, 0.007, 0);
  frontFairwayTurf.receiveShadow = true;
  foldingMatGroup.add(frontFairwayTurf);

  // 3C. North & South Outer Sliding Turf Wings (`z = ±1.532m`, flanking the 2 roller tracks)
  for (const sideSign of [-1, 1] as const) {
    const sideTag = sideSign < 0 ? 'northWing' : 'southWing';
    const wingTray = new THREE.Mesh(
      new THREE.BoxGeometry(frontLenX - 0.008, 0.014, outerWingW),
      trackSteelMat
    );
    wingTray.name = `outbuildings.barn.golfSimulator.turfMat.wingTray.${sideTag}`;
    wingTray.position.set(0, -0.008, sideSign * outerWingCenterZ);
    foldingMatGroup.add(wingTray);

    const wingTurf = new THREE.Mesh(
      new THREE.BoxGeometry(frontLenX, 0.02, outerWingW),
      fairwayTurfMat
    );
    wingTurf.name = `outbuildings.barn.golfSimulator.turfMat.${sideTag}`;
    wingTurf.position.set(0, 0.007, sideSign * outerWingCenterZ);
    wingTurf.receiveShadow = true;
    foldingMatGroup.add(wingTurf);

    const sideOakEdge = new THREE.Mesh(
      new THREE.BoxGeometry(frontLenX, 0.032, 0.014),
      foldingOakEdgeMat
    );
    sideOakEdge.name =
      sideSign < 0
        ? 'outbuildings.barn.golfSimulator.turfMat.oakBorder.north'
        : 'outbuildings.barn.golfSimulator.turfMat.oakBorder.south';
    sideOakEdge.position.set(0, 0.0, sideSign * (deckOuterW * 0.5 - 0.007));
    sideOakEdge.receiveShadow = true;
    foldingMatGroup.add(sideOakEdge);
  }

  // 3D. 8 Precision Twin-Wheel Track Roller Bogie Carriages (`rollerCarriage.1..8` & `roller.1..16`)
  //     Mounted along the North (`z = -1.24m`) and South (`z = +1.24m`) track channels of the sliding mat.
  //     Each bogie bridges the center and outer mat sections and carries 2 flanged polyurethane/steel rollers
  //     that ride directly inside the `outsideTrack` and `insideTrack` C-channels!
  const bogieRelXs = [-0.78, -0.26, 0.26, 0.78] as const;
  const rollerRadius = 0.013;
  const rollerGeo = new THREE.CylinderGeometry(rollerRadius, rollerRadius, 0.024, 18);
  rollerGeo.rotateX(Math.PI / 2);
  rollerGeo.computeBoundingSphere();

  const flangeRingGeo = new THREE.CylinderGeometry(rollerRadius + 0.0035, rollerRadius + 0.0035, 0.003, 18);
  flangeRingGeo.rotateX(Math.PI / 2);
  flangeRingGeo.computeBoundingSphere();

  const axleGeo = new THREE.CylinderGeometry(0.0045, 0.0045, 0.042, 12);
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

      // Structural steel/brass top bridge plate spanning across the 68mm track slot (`z = -0.052..+0.052m`)
      const bridgePlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.112, 0.006, 0.104),
        trackBrassMat
      );
      bridgePlate.name = `outbuildings.barn.golfSimulator.turfMat.rollerCarriage.${bogieIdx}.bridgePlate`;
      bridgePlate.position.set(0, 0.011, 0);
      bridgePlate.castShadow = true;
      bogieGroup.add(bridgePlate);

      // Twin side cheek plates dropping down into the track channel (`z = ±0.016m`)
      for (const [cheekTag, cz] of [
        ['innerCheek', -0.016],
        ['outerCheek', 0.016],
      ] as const) {
        const cheek = new THREE.Mesh(
          new THREE.BoxGeometry(0.092, 0.018, 0.004),
          trackSteelMat
        );
        cheek.name = `outbuildings.barn.golfSimulator.turfMat.rollerCarriage.${bogieIdx}.${cheekTag}`;
        cheek.position.set(0, 0.0, cz);
        bogieGroup.add(cheek);
      }

      // Twin Flanged Track Rollers per bogie (`wx = -0.028m` & `+0.028m`), resting on the track railBed (`y = -0.011m` local = `0.006m` world)
      for (const wx of [-0.028, 0.028] as const) {
        rollerIdx++;
        const wheelGroup = new THREE.Group();
        wheelGroup.name = `outbuildings.barn.golfSimulator.turfMat.roller.${rollerIdx}`;
        wheelGroup.userData = {
          isGolfMatTrackRoller: true,
          rollerRadius,
        };
        wheelGroup.position.set(wx, -0.001, 0);
        bogieGroup.add(wheelGroup);

        const tireMesh = new THREE.Mesh(rollerGeo, rollerPolyMat);
        tireMesh.name = `outbuildings.barn.golfSimulator.turfMat.roller.${rollerIdx}.tire`;
        wheelGroup.add(tireMesh);

        const guideFlange = new THREE.Mesh(flangeRingGeo, trackRailSilverMat);
        guideFlange.name = `outbuildings.barn.golfSimulator.turfMat.roller.${rollerIdx}.flange`;
        guideFlange.position.set(0, 0, -sideSign * 0.011);
        wheelGroup.add(guideFlange);

        const axlePin = new THREE.Mesh(axleGeo, trackBrassMat);
        axlePin.name = `outbuildings.barn.golfSimulator.turfMat.roller.${rollerIdx}.axle`;
        wheelGroup.add(axlePin);
      }
    }
  }

  // F. Centered Replaceable Fiberbuilt / Divot-Action Hitting Strip & Steel Bezel (`z = 0`, dead center on target line!)
  const hittingX = 1.12;
  const hittingRelX = hittingX - frontCenterX;

  const hittingBezel = new THREE.Mesh(
    new THREE.BoxGeometry(0.388, 0.023, 0.968),
    trackSteelMat
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


  // 4. Real-Spec BenQ LK936ST 4K UHD Laser Golf Projector & Rear-Zone Overhead Launch Monitor
  //    Positioned BEHIND the golfer/tee (`hittingX = +1.12m`) so neither device can ever be struck by a golf ball:
  //    - Impact Screen (`screenMesh`) is at `x = -2.02m` (`2.77m` active height).
  //    - Teed Ball (`teedBall`) is at `x = +1.12m` (`3.14m` / 10'3.6" ball-to-screen distance).
  //    - Overhead Launch Monitor Sensor (`trackmanIO`) is mounted at `x = +1.52m, y = 2.98m`
  //      (`0.40m` / 16" BEHIND the teed ball, tilted forward `-x` toward the hitting strip, and `0.18m` above
  //       the projector's optical beam so it never casts a shadow on the screen).
  //    - BenQ LK936ST 4K Laser Projector (`5,100 ANSI Lumens`, `0.81–0.89:1` short-throw zoom lens,
  //      `351mm D × 166mm H × 416mm W` chassis) is mounted at `x = +2.03m, y = 2.80m`
  //      (`0.91m` / 3'0" BEHIND the teed ball, giving an exact `4.05m` / 13'3.5" throw distance to the `-2.02m` screen,
  //       matching `TR = 0.822:1` on the native 16:9 DMD array to fill the full `2.77m` screen height!).
  const barnCeilEaveWorldY = 2.92;
  const barnCeilRidgeWorldY = 2.92 + 2.575 * ((4.84 - 3.24) / 3.055); // 4.2686m
  const roofSlopeTan = (barnCeilRidgeWorldY - barnCeilEaveWorldY) / 2.575;
  const roofSlopeAngle = Math.atan(roofSlopeTan);
  const vaultedCeilWorldY =
    barnCeilRidgeWorldY - Math.abs(simCenterV - 2.855) * roofSlopeTan;
  const vaultedCeilLocalY = vaultedCeilWorldY - barnWestFloorY;

  const projectorY = 2.8;
  const projectorDropH = Math.max(0.24, vaultedCeilLocalY - projectorY);

  const projectorGroup = new THREE.Group();
  projectorGroup.name = 'outbuildings.barn.golfSimulator.projector';
  projectorGroup.position.set(2.03, projectorY, 0);
  simCeilingGroup.add(projectorGroup);

  const dropPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.024, projectorDropH, 14),
    projectorBodyMat
  );
  dropPole.name = 'outbuildings.barn.golfSimulator.projector.dropPole';
  dropPole.position.set(0, projectorDropH * 0.5, 0);
  dropPole.castShadow = true;
  projectorGroup.add(dropPole);

  const projectorPoleCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, 0.048, 14),
    trackSteelMat
  );
  projectorPoleCollar.name = 'outbuildings.barn.golfSimulator.projector.poleCollar';
  projectorPoleCollar.userData = { lodTier: 'high', lodMaxDistance: 14 };
  projectorPoleCollar.position.set(0, projectorDropH * 0.45, 0);
  projectorGroup.add(projectorPoleCollar);

  const projectorMountFlange = new THREE.Mesh(
    new THREE.CylinderGeometry(0.078, 0.078, 0.016, 18),
    projectorBodyMat
  );
  projectorMountFlange.name = 'outbuildings.barn.golfSimulator.projector.mountFlange';
  projectorMountFlange.position.set(0, projectorDropH - 0.008, 0);
  projectorMountFlange.rotation.x = simCenterV >= 2.855 ? roofSlopeAngle : -roofSlopeAngle;
  projectorGroup.add(projectorMountFlange);

  // BenQ LK936ST Chassis (`351mm D × 166mm H × 416mm W`, subtle downward pitch + vertical lens shift toward screen)
  const projTiltZ = 0.08;
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

  // Rear-Zone Overhead Launch Monitor (`trackmanIO`) at `x = +1.52m, y = 2.98m` (`0.40m` behind the teed ball!)
  const tmY = 2.98;
  const tmDropH = Math.max(0.2, vaultedCeilLocalY - tmY);

  const tmGroup = new THREE.Group();
  tmGroup.name = 'outbuildings.barn.golfSimulator.trackmanIO';
  tmGroup.position.set(1.52, tmY, 0);
  simCeilingGroup.add(tmGroup);

  const tmDropTube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, tmDropH, 12),
    projectorBodyMat
  );
  tmDropTube.name = 'outbuildings.barn.golfSimulator.trackmanIO.dropTube';
  tmDropTube.position.set(0, tmDropH * 0.5, 0);
  tmDropTube.castShadow = true;
  tmGroup.add(tmDropTube);

  const tmMountFlange = new THREE.Mesh(
    new THREE.CylinderGeometry(0.068, 0.068, 0.014, 16),
    projectorBodyMat
  );
  tmMountFlange.name = 'outbuildings.barn.golfSimulator.trackmanIO.mountFlange';
  tmMountFlange.position.set(0, tmDropH - 0.007, 0);
  tmMountFlange.rotation.x = simCenterV >= 2.855 ? roofSlopeAngle : -roofSlopeAngle;
  tmGroup.add(tmMountFlange);

  // Tilted forward (`+0.26 rad` around Z so `-x,-y` bottom/front cameras look forward at the hitting strip `x = +1.12m`)
  const tmTiltZ = 0.26;
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
    tmWing.position.set(-0.01, -0.004, sideZ * 0.22);
    tmWing.rotation.z = tmTiltZ;
    tmWing.rotation.y = sideZ * 0.16;
    tmWing.castShadow = true;
    tmGroup.add(tmWing);

    const camGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.012, 14),
      velvetFrameMat
    );
    camGlass.name = `outbuildings.barn.golfSimulator.trackmanIO.cameraLens.${sideLabel}`;
    camGlass.rotation.z = tmTiltZ;
    camGlass.position.set(-0.02, -0.036, sideZ * 0.2);
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

  const lintelStatusGroup = new THREE.Group();
  lintelStatusGroup.name = 'outbuildings.barn.golfSimulator.statusSign';
  lintelStatusGroup.position.set(0.012, 2.64 - barnWestFloorY, 1.28 - simCenterV);
  simGroup.add(lintelStatusGroup);

  const statusHousing = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.11, 0.26),
    projectorBodyMat
  );
  statusHousing.name = 'outbuildings.barn.golfSimulator.statusSign';
  lintelStatusGroup.add(statusHousing);

  const statusFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.24, 0.09),
    statusSignFaceMat
  );
  statusFace.name = 'outbuildings.barn.golfSimulator.statusSign.face';
  statusFace.rotation.y = Math.PI / 2;
  statusFace.position.set(0.012, 0, 0);
  lintelStatusGroup.add(statusFace);

  const statusDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 14, 12),
    statusBeaconRedMat
  );
  statusDome.name = 'outbuildings.barn.golfSimulator.statusSign.beacon';
  statusDome.position.set(0.012, 0.068, 0);
  lintelStatusGroup.add(statusDome);

  const garageHallBeaconGroup = new THREE.Group();
  garageHallBeaconGroup.name = 'outbuildings.garage.golfStatusLight';
  garageHallBeaconGroup.position.set(12.06 - uWallMax, 1.80 - barnWestFloorY, 0.78 - simCenterV);
  simGroup.add(garageHallBeaconGroup);

  const garageBeaconBezel = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, 0.085, 0.22),
    projectorBodyMat
  );
  garageBeaconBezel.name = 'outbuildings.garage.golfStatusLight.bezel';
  garageHallBeaconGroup.add(garageBeaconBezel);

  const garageBeaconFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.20, 0.068),
    statusSignFaceMat
  );
  garageBeaconFace.name = 'outbuildings.garage.golfStatusLight.face';
  garageBeaconFace.rotation.y = -Math.PI / 2;
  garageBeaconFace.position.set(-0.013, 0, 0);
  garageHallBeaconGroup.add(garageBeaconFace);

  const garageBeaconLens = new THREE.Mesh(
    new THREE.SphereGeometry(0.018, 14, 12),
    statusBeaconRedMat
  );
  garageBeaconLens.name = 'outbuildings.garage.golfStatusLight.beacon';
  garageBeaconLens.position.set(-0.014, 0.052, 0);
  garageHallBeaconGroup.add(garageBeaconLens);

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
