import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../types/scene.ts';

/**
 * Generates the authentic light pebble-grey (`#d6d8db`) Nike Grind recycled footwear rubber texture
 * matching the uploaded Nike Grind Dumbbell reference photos: a light cool grey/off-white rubber matrix
 * speckled with fine black, dark-charcoal, cobalt-blue, crimson-red, ochre-yellow, and white granules,
 * plus the recessed rectangular black Nike Swoosh badge and bold weight numerals on the hex facets.
 */
function createNikeGrindLightGreyHexTexture(weightLb: number): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // 1. Light cool pebble-grey Nike Grind rubber base (#d5d7da)
  ctx.fillStyle = '#d5d7da';
  ctx.fillRect(0, 0, w, h);

  // Subtle moulded rubber surface grain
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const n = Math.sin(x * 19.13 + y * 47.71) * 43758.5453;
      const f = n - Math.floor(n);
      if (f > 0.65) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
        ctx.fillRect(x, y, 2, 2);
      } else if (f < 0.35) {
        ctx.fillStyle = 'rgba(155, 160, 168, 0.14)';
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }

  // 2. Authentic multicolour recycled sneaker crumb flecks (predominantly black/charcoal, plus blue, red, yellow, white)
  const fleckPalette = [
    '#141619', // Carbon black crumb (most frequent)
    '#282c32', // Dark charcoal crumb
    '#141619', // Carbon black crumb
    '#5a6068', // Mid slate crumb
    '#1a66cc', // Hyper Cobalt blue fleck
    '#c82820', // Crimson red fleck
    '#e0a010', // Ochre yellow fleck
    '#f4f6f8', // White EVA fleck
    '#141619', // Carbon black crumb
  ];

  for (let i = 0; i < 2400; i++) {
    const h1 = Math.sin(i * 12.9898 + weightLb * 0.7) * 43758.5453;
    const f1 = h1 - Math.floor(h1);
    const h2 = Math.sin(i * 78.233 + weightLb * 1.3) * 29183.127;
    const f2 = h2 - Math.floor(h2);
    const h3 = Math.sin(i * 39.425 + 5.1) * 17391.831;
    const f3 = h3 - Math.floor(h3);

    const x = f1 * w;
    const y = f2 * h;
    const r = 0.7 + f3 * 2.2;
    ctx.fillStyle = fleckPalette[i % fleckPalette.length]!;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.6 + f1 * 0.6), f2 * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Draw recessed rectangular badge + bold black Nike Swoosh on the top-facing hex facet (`u ≈ 0.25`)
  //    and recessed rectangular badge + bold black weight numerals (`10`..`50`) on the opposite facet (`u ≈ 0.75`)
  const drawRecessedBox = (cx: number, cy: number, bw: number, bh: number): void => {
    ctx.fillStyle = 'rgba(185, 188, 194, 0.55)';
    ctx.fillRect(cx - bw * 0.5, cy - bh * 0.5, bw, bh);
    ctx.strokeStyle = 'rgba(130, 134, 140, 0.75)';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - bw * 0.5, cy - bh * 0.5, bw, bh);
  };

  // Facet A (`cx = w * 0.25, cy = h * 0.5`): Black Nike Swoosh
  const sx = w * 0.25;
  const sy = h * 0.5;
  drawRecessedBox(sx, sy, 68, 86);
  ctx.save();
  ctx.translate(sx, sy);
  ctx.fillStyle = '#111315';
  ctx.beginPath();
  ctx.moveTo(-18, -14);
  ctx.quadraticCurveTo(-28, 12, -12, 18);
  ctx.quadraticCurveTo(4, 22, 26, -12);
  ctx.quadraticCurveTo(-2, 8, -12, 4);
  ctx.quadraticCurveTo(-20, 0, -18, -14);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Facet B (`cx = w * 0.75, cy = h * 0.5`): Bold Black Weight Numeral
  const nx = w * 0.75;
  const ny = h * 0.5;
  drawRecessedBox(nx, ny, 72, 88);
  ctx.save();
  ctx.translate(nx, ny);
  ctx.fillStyle = '#111315';
  ctx.font = '900 42px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(weightLb), 0, 2);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/**
 * Generates the triangular lower side-gusset plate texture with the laser-cut Nike Swoosh
 * above bold stencilled `NIKE` lettering (`media_1791145079438_8999d4b6.jpg`).
 */
function createNikeSideGussetTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1d1f23';
  ctx.fillRect(0, 0, size, size);

  // Subtle laser-cut Swoosh + stencilled NIKE logo in light background contrast
  ctx.fillStyle = '#dcdfe4';
  ctx.beginPath();
  ctx.moveTo(106, 134);
  ctx.quadraticCurveTo(94, 152, 108, 156);
  ctx.quadraticCurveTo(124, 160, 158, 136);
  ctx.quadraticCurveTo(122, 150, 111, 146);
  ctx.quadraticCurveTo(104, 144, 106, 134);
  ctx.closePath();
  ctx.fill();

  ctx.font = '900 38px Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NIKE', 128, 198);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Builds a softly bevelled/chamfered 6-sided hexagonal Nike Grind dumbbell head geometry
 * matching the rounded hex profile in `media_1791145088611_e622634c.png`.
 */
function createBevelledHexHeadGeometry(radius: number, length: number): THREE.BufferGeometry {
  // 4-ring bevelled hexagonal prism along Y (`-length/2 .. +length/2`) rotated to Z
  const radialSegs = 6;
  const rings = [
    { y: -length * 0.5, rScale: 0.84 },
    { y: -length * 0.5 + length * 0.14, rScale: 1.0 },
    { y: length * 0.5 - length * 0.14, rScale: 1.0 },
    { y: length * 0.5, rScale: 0.84 },
  ] as const;

  const geo = new THREE.CylinderGeometry(radius, radius, length, radialSegs, 3, false);
  const pos = geo.attributes.position;
  if (pos) {
    for (let i = 0; i < pos.count; i++) {
      const py = pos.getY(i);
      const px = pos.getX(i);
      const pz = pos.getZ(i);
      const rCurr = Math.hypot(px, pz);
      if (rCurr > 1e-4) {
        // Identify closest ring
        let scale = 1.0;
        if (Math.abs(py) > length * 0.42) {
          scale = rings[0].rScale;
        }
        pos.setX(i, px * scale);
        pos.setZ(i, pz * scale);
      }
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  }
  return geo;
}

/**
 * Issue #4 ("Make this floor less tesselated / repeated" at `[-11.439, -0.5, 17.001]`, `outbuildings.garage.resinFloor`):
 * Generates a monolithic, non-repeating `1024x1024` self-levelling poured polyurethane/epoxy workshop resin floor
 * texture (`#888d92`) mapped `1:1` across the entire garage slab (`tex.repeat.set(1, 1)`) with zero periodic grid waves
 * and ultra-fine, barely perceptible mineral micro-speckle.
 */
export function createPouredResinFloorMaterial(): THREE.MeshStandardMaterial {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const img = ctx.createImageData(size, size);
  const data = img.data;
  for (let y = 0; y < size; y++) {
    const uy = y / size - 0.5;
    for (let x = 0; x < size; x++) {
      const ux = x / size - 0.5;
      const idx = (y * size + x) * 4;
      // Gentle, non-repeating monolithic radial ambient grading across the whole garage slab
      const radialLift = (0.35 - (ux * ux + uy * uy)) * 4.5;
      // Ultra-subtle aperiodic micro-quartz resin grain (±1.5 RGB values)
      const h = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const f = h - Math.floor(h);
      const microFleck = (f - 0.5) * 2.6;

      const base = 137 + radialLift + microFleck;
      data[idx] = Math.max(122, Math.min(152, Math.round(base - 2)));
      data[idx + 1] = Math.max(126, Math.min(156, Math.round(base)));
      data[idx + 2] = Math.max(130, Math.min(160, Math.round(base + 3)));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(1, 1);

  return new THREE.MeshStandardMaterial({
    map: tex,
    color: 0xffffff,
    roughness: 0.24,
    metalness: 0.06,
  });
}

/**
 * Generates a Widescreen (`16:10` / `4.48m x 2.80m`) TrackMan iO Virtual Golf 3 (VG3)
 * championship course projection texture featuring signature TrackMan Orange (`#ff6b00`)
 * telemetry data tiles, minimap, layered mountain ridges, botanical pine & oak tree line,
 * contoured fairway striping, water reflections, and sunlit championship green.
 */
function createTrackManWidescreenTexture(): THREE.CanvasTexture {
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
  return tex;
}

/**
 * Issue #2 ("Change this for an oak door. Add skirting board in this room" at `[-16.62, 0.075, 16.684]`):
 * 1. Builds a high-LOD Solid European Oak 4-Panel Internal Door (`outbuildings.doorPivot.GymGarageInternal`)
 *    with a full-depth moulded oak door frame & architraves at `u = 5.77..5.97m, v = 1.25..2.15m`.
 * 2. Adds continuous profiled skirting boards (`outbuildings.gym.skirting`) around the interior perimeter
 *    of the GYM (`u = 0.28..5.77m, v = 0.28..5.43m, y = -0.60m`), wrapping cleanly around the brick pilasters
 *    and stopping neatly at the North glazed screen and East oak door architrave.
 */
export function buildGymOakDoorAndSkirting(
  _ctx: SceneBuilderContext,
  groundGroup: THREE.Group,
  baseY0: number,
  wallT: number,
  uGymEnd: number,
  partT: number,
  vWestRangeSouth: number,
  skirtingMat: THREE.Material
): void {
  // Issue #9 ("Remove the door here and replace with large wide glass window so you can see into the garage"
  // at `[-16.479, 0.414, 18.327]`):
  // Replaces the hinged internal door with a panoramic `3.40m x 1.40m` Architectural Glazed Viewing Window
  // (`outbuildings.gymGarageViewingWindow`) spanning `v = 1.15m..4.55m, y = baseY0 + 0.72m .. baseY0 + 2.12m`
  // in the GYM-to-Garage partition wall (`u = 5.77..5.97m`) so you have a clear view from the GYM straight into the Garage!
  const lightOakFrameMat = new THREE.MeshStandardMaterial({
    color: 0xc2986b, // Warm light European oak joinery
    roughness: 0.42,
    metalness: 0.04,
  });
  const lightOakTrimMat = new THREE.MeshStandardMaterial({
    color: 0xb28759, // Chamfered light oak sill & architrave moulding
    roughness: 0.46,
    metalness: 0.04,
  });
  const satinBlackMullionMat = new THREE.MeshStandardMaterial({
    color: 0x1e2228, // Slim architectural satin-anthracite steel glazing mullions & gasket beads
    roughness: 0.34,
    metalness: 0.68,
  });
  const viewingGlassMat = new THREE.MeshStandardMaterial({
    color: 0xdcf0f7, // Crystal-clear low-iron toughened acoustic viewing glass
    roughness: 0.06,
    metalness: 0.14,
    transparent: true,
    opacity: 0.2,
  });

  // ---------------------------------------------------------------------------
  // 1. Panoramic 3.40m x 1.40m Glazed Viewing Window (`outbuildings.gymGarageViewingWindow`)
  // ---------------------------------------------------------------------------
  const winUMid = uGymEnd + partT * 0.5; // 5.87m
  const winVMin = 1.15;
  const winVMax = 4.55;
  const winVMid = (winVMin + winVMax) * 0.5; // 2.85m
  const winW = winVMax - winVMin; // 3.40m wide
  const sillRelY = 0.72; // Sill height above GYM floor (`baseY0`)
  const winH = 1.4; // 1.40m tall viewing window (`y = baseY0 + 0.72m .. baseY0 + 2.12m`)
  const jambT = 0.032;
  const archW = 0.062;
  const archT = 0.018;

  const viewingWinGroup = new THREE.Group();
  viewingWinGroup.name = 'outbuildings.gymGarageViewingWindow';
  viewingWinGroup.position.set(winUMid, baseY0 + sillRelY, winVMid);
  groundGroup.add(viewingWinGroup);

  // Full-depth light-oak jamb linings (North & South) and top head lining
  for (const sideZ of [-1, 1] as const) {
    const jamb = new THREE.Mesh(
      new THREE.BoxGeometry(partT + 0.01, winH, jambT),
      lightOakFrameMat
    );
    jamb.position.set(0, winH * 0.5, sideZ * (winW * 0.5 - jambT * 0.5));
    jamb.castShadow = true;
    jamb.receiveShadow = true;
    viewingWinGroup.add(jamb);
  }
  const headLining = new THREE.Mesh(
    new THREE.BoxGeometry(partT + 0.01, jambT, winW),
    lightOakFrameMat
  );
  headLining.position.set(0, winH - jambT * 0.5, 0);
  viewingWinGroup.add(headLining);

  // Projecting bullnose solid light-oak window sill board + under-sill apron moulding on both GYM & Garage sides
  const sillBoardD = partT + 0.072; // Projects 36mm proud on both GYM and Garage faces
  const sillBoardH = 0.036;
  const sillBoardW = winW + archW * 2 + 0.04;
  const sillBoard = new THREE.Mesh(
    new THREE.BoxGeometry(sillBoardD, sillBoardH, sillBoardW),
    lightOakFrameMat
  );
  sillBoard.name = 'outbuildings.gymGarageViewingWindow.sill';
  sillBoard.position.set(0, sillBoardH * 0.5, 0);
  sillBoard.castShadow = true;
  sillBoard.receiveShadow = true;
  viewingWinGroup.add(sillBoard);

  for (const sideX of [-1, 1] as const) {
    const noseCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(sillBoardH * 0.5, sillBoardH * 0.5, sillBoardW, 12),
      lightOakFrameMat
    );
    noseCyl.rotation.x = Math.PI / 2;
    noseCyl.position.set(sideX * (sillBoardD * 0.5), sillBoardH * 0.5, 0);
    viewingWinGroup.add(noseCyl);

    const apron = new THREE.Mesh(
      new THREE.BoxGeometry(archT, 0.048, winW + archW * 2 - 0.02),
      lightOakTrimMat
    );
    apron.position.set(sideX * (partT * 0.5 + archT * 0.5), -0.024, 0);
    viewingWinGroup.add(apron);
  }

  // Moulded light-oak architraves framing the sides and top on both the GYM (`-u`) and Garage (`+u`) wall faces
  for (const sideX of [-1, 1] as const) {
    const xFace = sideX * (partT * 0.5 + archT * 0.5);
    for (const sideZ of [-1, 1] as const) {
      const archLeg = new THREE.Mesh(
        new THREE.BoxGeometry(archT, winH + archW - sillBoardH, archW),
        lightOakTrimMat
      );
      archLeg.position.set(
        xFace,
        sillBoardH + (winH + archW - sillBoardH) * 0.5,
        sideZ * (winW * 0.5 + archW * 0.5 - 0.012)
      );
      viewingWinGroup.add(archLeg);
    }
    const archHeader = new THREE.Mesh(
      new THREE.BoxGeometry(archT, archW, winW + archW * 2 - 0.024),
      lightOakTrimMat
    );
    archHeader.position.set(xFace, winH + archW * 0.5 - 0.006, 0);
    viewingWinGroup.add(archHeader);
  }

  // Inner satin-anthracite peripheral glazing sub-frame & 2 slim vertical mullions (3 wide panoramic bays)
  const clearInnerW = winW - jambT * 2;
  const clearInnerH = winH - sillBoardH - jambT;
  const innerCenterY = sillBoardH + clearInnerH * 0.5;
  const subFrameT = 0.026;
  const subFrameD = 0.056;

  for (const sideY of [-1, 1] as const) {
    const hBar = new THREE.Mesh(
      new THREE.BoxGeometry(subFrameD, subFrameT, clearInnerW),
      satinBlackMullionMat
    );
    hBar.position.set(0, innerCenterY + sideY * (clearInnerH * 0.5 - subFrameT * 0.5), 0);
    viewingWinGroup.add(hBar);
  }
  for (const sideZ of [-1, 1] as const) {
    const vBar = new THREE.Mesh(
      new THREE.BoxGeometry(subFrameD, clearInnerH - subFrameT * 2, subFrameT),
      satinBlackMullionMat
    );
    vBar.position.set(0, innerCenterY, sideZ * (clearInnerW * 0.5 - subFrameT * 0.5));
    viewingWinGroup.add(vBar);
  }

  // 2 slim intermediate vertical mullions dividing the 3.40m span into 3 panoramic 1.09m bays
  for (const mulZ of [-clearInnerW / 6, clearInnerW / 6] as const) {
    const mullion = new THREE.Mesh(
      new THREE.BoxGeometry(0.048, clearInnerH - subFrameT * 2, 0.032),
      satinBlackMullionMat
    );
    mullion.position.set(0, innerCenterY, mulZ);
    mullion.castShadow = true;
    viewingWinGroup.add(mullion);
  }

  // Crystal-clear architectural safety glass pane (`outbuildings.gymGarageViewingWindow.glass`)
  const glassPane = new THREE.Mesh(
    new THREE.BoxGeometry(0.016, clearInnerH - subFrameT * 2, clearInnerW - subFrameT * 2),
    viewingGlassMat
  );
  glassPane.name = 'outbuildings.gymGarageViewingWindow.glass';
  glassPane.position.set(0, innerCenterY, 0);
  viewingWinGroup.add(glassPane);

  // ---------------------------------------------------------------------------
  // 2. Profiled Architectural Skirting Boards around the GYM (`outbuildings.gym.skirting`)
  // ---------------------------------------------------------------------------
  const skirtingGroup = new THREE.Group();
  skirtingGroup.name = 'outbuildings.gym.skirting';
  skirtingGroup.userData.isArchitecturalShell = true;
  groundGroup.add(skirtingGroup);

  const skirtBaseH = 0.118;
  const skirtCapH = 0.024;
  const skirtBaseT = 0.02;
  const skirtCapT = 0.014;
  const vInnerNorth = wallT; // 0.28m
  const vInnerSouth = vWestRangeSouth - wallT; // 5.43m

  const addSkirtingAlongU = (u0: number, u1: number, vWallFace: number, inwardSignV: 1 | -1): void => {
    const lenU = u1 - u0;
    if (lenU <= 0.01) return;
    const midU = (u0 + u1) * 0.5;
    const baseMesh = new THREE.Mesh(
      new THREE.BoxGeometry(lenU, skirtBaseH, skirtBaseT),
      skirtingMat
    );
    baseMesh.position.set(
      midU,
      baseY0 + skirtBaseH * 0.5,
      vWallFace + inwardSignV * (skirtBaseT * 0.5)
    );
    baseMesh.receiveShadow = true;
    skirtingGroup.add(baseMesh);

    const capMesh = new THREE.Mesh(
      new THREE.BoxGeometry(lenU, skirtCapH, skirtCapT),
      skirtingMat
    );
    capMesh.position.set(
      midU,
      baseY0 + skirtBaseH + skirtCapH * 0.5,
      vWallFace + inwardSignV * (skirtCapT * 0.5)
    );
    skirtingGroup.add(capMesh);
  };

  const addSkirtingAlongV = (v0: number, v1: number, uWallFace: number, inwardSignU: 1 | -1): void => {
    const lenV = v1 - v0;
    if (lenV <= 0.01) return;
    const midV = (v0 + v1) * 0.5;
    const baseMesh = new THREE.Mesh(
      new THREE.BoxGeometry(skirtBaseT, skirtBaseH, lenV),
      skirtingMat
    );
    baseMesh.position.set(
      uWallFace + inwardSignU * (skirtBaseT * 0.5),
      baseY0 + skirtBaseH * 0.5,
      midV
    );
    baseMesh.receiveShadow = true;
    skirtingGroup.add(baseMesh);

    const capMesh = new THREE.Mesh(
      new THREE.BoxGeometry(skirtCapT, skirtCapH, lenV),
      skirtingMat
    );
    capMesh.position.set(
      uWallFace + inwardSignU * (skirtCapT * 0.5),
      baseY0 + skirtBaseH + skirtCapH * 0.5,
      midV
    );
    skirtingGroup.add(capMesh);
  };

  addSkirtingAlongV(vInnerNorth, vInnerSouth, wallT, 1);
  // Continuous uninterrupted skirting along the entire GYM East partition wall (`u = 5.77m`) below the viewing window!
  addSkirtingAlongV(vInnerNorth, vInnerSouth, uGymEnd, -1);

  addSkirtingAlongU(wallT, 2.71, vInnerNorth, 1);
  addSkirtingAlongV(vInnerNorth, vInnerNorth + 0.16 + skirtBaseT, 2.71, -1);
  addSkirtingAlongU(2.71 - skirtBaseT, 3.01 + skirtBaseT, vInnerNorth + 0.16, 1);
  addSkirtingAlongV(vInnerNorth, vInnerNorth + 0.16 + skirtBaseT, 3.01, 1);
  addSkirtingAlongU(5.45, uGymEnd, vInnerNorth, 1);

  addSkirtingAlongU(wallT, 2.71, vInnerSouth, -1);
  addSkirtingAlongV(vInnerSouth - 0.16 - skirtBaseT, vInnerSouth, 2.71, -1);
  addSkirtingAlongU(2.71 - skirtBaseT, 3.01 + skirtBaseT, vInnerSouth - 0.16, -1);
  addSkirtingAlongV(vInnerSouth - 0.16 - skirtBaseT, vInnerSouth, 3.01, 1);
  addSkirtingAlongU(3.01, uGymEnd, vInnerSouth, -1);
}

/**
 * Issue #3 ("Nike grind dumbell rack here" at `[-21.015, -0.123, 16.156]` + 2 Uploaded Reference Photos):
 * Builds the exact 3-Tier Commercial Nike Grind Hex Dumbbell Rack (`outbuildings.gym.nikeGrindDumbbellRack`)
 * shown in the user's photos:
 * - Matte-black powder-coated steel 3-tier A-frame with angled front C-channel columns, rear support legs,
 *   bolted dual-angle-iron trays, rubber end-cap foot boots, and triangular lower side gusset plates
 *   with the laser-cut Nike Swoosh + `NIKE` stencil.
 * - 10 Graduated Pairs (20 dumbbells total) of light pebble-grey speckled Nike Grind Rounded-Hex Dumbbells:
 *   - Top Tier (4 pairs): `5`, `10`, `15`, `20` lb
 *   - Middle Tier (3 pairs): `25`, `30`, `35` lb
 *   - Bottom Tier (3 pairs): `40`, `45`, `50` lb
 *   Each dumbbell features softly bevelled light-grey speckled Nike Grind hex heads with the black Nike Swoosh
 *   on the front head and bold black weight numbers on the rear head, joined by a contoured barrel chrome handle.
 */
export function buildNikeGrindDumbbellRack(
  groundGroup: THREE.Group,
  baseY0: number
): void {
  const rackGroup = new THREE.Group();
  rackGroup.name = 'outbuildings.gym.nikeGrindDumbbellRack';
  rackGroup.position.set(1.49, baseY0, 0.62);
  groundGroup.add(rackGroup);

  const frameSteelMat = new THREE.MeshStandardMaterial({
    color: 0x1c1e22, // Matte black powder-coated steel rack frame
    roughness: 0.42,
    metalness: 0.62,
  });
  const rubberBootMat = new THREE.MeshStandardMaterial({
    color: 0x121417,
    roughness: 0.78,
    metalness: 0.06,
  });
  const chromeBoltMat = new THREE.MeshStandardMaterial({
    color: 0xe2e6ec, // Polished chrome handle & stainless hex bolts
    roughness: 0.16,
    metalness: 0.94,
  });
  const knurledGripMat = new THREE.MeshStandardMaterial({
    color: 0xbec4cc, // Matte diamond-knurled grip bands on the contoured handle
    roughness: 0.44,
    metalness: 0.84,
  });
  const sideGussetMat = new THREE.MeshStandardMaterial({
    map: createNikeSideGussetTexture(),
    roughness: 0.45,
    metalness: 0.55,
  });

  const rackW = 1.44;
  const rackD = 0.58;
  const rackH = 0.88;

  // 1. Left & Right Matte-Black Steel A-Frame Side Uprights, Rubber Foot Boots & Triangular `NIKE` Side Gussets
  for (const sideX of [-1, 1] as const) {
    const ux = sideX * (rackW * 0.5 - 0.032);

    // Base stabilizer foot rail (`0.58m` deep) + moulded black rubber front/back end boots
    const baseSkid = new THREE.Mesh(
      new THREE.BoxGeometry(0.052, 0.042, rackD - 0.06),
      frameSteelMat
    );
    baseSkid.position.set(ux, 0.025, 0);
    baseSkid.castShadow = true;
    baseSkid.receiveShadow = true;
    rackGroup.add(baseSkid);

    for (const bootZ of [-rackD * 0.5 + 0.035, rackD * 0.5 - 0.035]) {
      const boot = new THREE.Mesh(
        new THREE.BoxGeometry(0.076, 0.052, 0.082),
        rubberBootMat
      );
      boot.position.set(ux, 0.026, bootZ);
      rackGroup.add(boot);
    }

    // Main front/top sloped C-channel upright column (raking backward from front base to top tier)
    const frontLegLen = Math.hypot(rackH - 0.04, 0.28);
    const frontLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.056, frontLegLen, 0.068),
      frameSteelMat
    );
    frontLeg.position.set(ux, rackH * 0.5 + 0.01, 0.03);
    frontLeg.rotation.x = -0.31; // Slopes up and toward `-Z` (rear)
    frontLeg.castShadow = true;
    rackGroup.add(frontLeg);

    // Rear support leg rising from rear foot to the upper/middle column
    const rearLegLen = Math.hypot(rackH * 0.82, 0.16);
    const rearLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.052, rearLegLen, 0.062),
      frameSteelMat
    );
    rearLeg.position.set(ux, rackH * 0.42 + 0.01, -0.14);
    rearLeg.rotation.x = 0.14;
    rearLeg.castShadow = true;
    rackGroup.add(rearLeg);

    // Lower Triangular Side Gusset Plate with Laser-Cut Nike Swoosh & Stencilled `NIKE` Logo (Photo 1)
    const gusset = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.34, 0.24),
      sideGussetMat
    );
    gusset.position.set(ux + sideX * 0.024, 0.19, 0.09);
    rackGroup.add(gusset);
  }

  // 2. Three Angled Steel Dumbbell Shelf Tiers (Bottom: 3 pairs, Middle: 3 pairs, Top: 4 pairs — Photo 1)
  const tierSpecs = [
    {
      id: 'bottom',
      y: 0.22,
      z: 0.08,
      weights: [40, 45, 50] as const,
      radii: [0.084, 0.088, 0.092] as const,
      lengths: [0.092, 0.096, 0.1] as const,
    },
    {
      id: 'middle',
      y: 0.53,
      z: -0.01,
      weights: [25, 30, 35] as const,
      radii: [0.072, 0.076, 0.08] as const,
      lengths: [0.078, 0.082, 0.086] as const,
    },
    {
      id: 'top',
      y: 0.83,
      z: -0.1,
      weights: [5, 10, 15, 20] as const,
      radii: [0.048, 0.055, 0.062, 0.068] as const,
      lengths: [0.056, 0.062, 0.068, 0.074] as const,
    },
  ] as const;

  // Contoured barrel handle profile (`LatheGeometry` around Y)
  const handlePoints = [
    new THREE.Vector2(0.0135, -0.066),
    new THREE.Vector2(0.0155, -0.042),
    new THREE.Vector2(0.0172, 0.0),
    new THREE.Vector2(0.0155, 0.042),
    new THREE.Vector2(0.0135, 0.066),
  ];
  const barrelHandleGeo = new THREE.LatheGeometry(handlePoints, 14);
  barrelHandleGeo.rotateX(Math.PI / 2); // Align handle axis along local Z

  const traySpanX = rackW - 0.11;

  for (let tIdx = 0; tIdx < tierSpecs.length; tIdx++) {
    const tier = tierSpecs[tIdx]!;
    const trayGroup = new THREE.Group();
    trayGroup.position.set(0, tier.y, tier.z);
    trayGroup.rotation.x = 0.22; // Forward downward presentation tilt matching Photo 1
    rackGroup.add(trayGroup);

    // Front & Rear Black Angle-Iron Cradle Rails + End Mounting Brackets with Silver Hex Bolts
    for (const railZ of [-0.115, 0.115] as const) {
      const railBar = new THREE.Mesh(
        new THREE.BoxGeometry(traySpanX, 0.022, 0.042),
        frameSteelMat
      );
      railBar.position.set(0, 0, railZ);
      railBar.castShadow = true;
      railBar.receiveShadow = true;
      trayGroup.add(railBar);

      const railLip = new THREE.Mesh(
        new THREE.BoxGeometry(traySpanX, 0.036, 0.012),
        frameSteelMat
      );
      railLip.position.set(0, 0.016, railZ + (railZ > 0 ? 0.018 : -0.018));
      trayGroup.add(railLip);
    }

    // Bolted end-flanges with silver hex bolts at left and right ends of each shelf
    for (const sideX of [-1, 1] as const) {
      const flange = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.048, 0.28),
        frameSteelMat
      );
      flange.position.set(sideX * (traySpanX * 0.5 - 0.008), -0.008, 0);
      trayGroup.add(flange);

      const hexBolt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.006, 0.014, 6),
        chromeBoltMat
      );
      hexBolt.position.set(sideX * (traySpanX * 0.5 - 0.022), 0.012, 0.125);
      trayGroup.add(hexBolt);
    }

    // Populate the pairs of Light-Grey Speckled Nike Grind Hex Dumbbells across the tier
    const numPairs = tier.weights.length;
    const totalDumbbells = numPairs * 2;
    const slotW = (traySpanX - 0.04) / totalDumbbells;

    for (let p = 0; p < numPairs; p++) {
      const weightLb = tier.weights[p]!;
      const headR = tier.radii[p]!;
      const headLen = tier.lengths[p]!;
      const headGeo = createBevelledHexHeadGeometry(headR, headLen);
      const headMat = new THREE.MeshStandardMaterial({
        map: createNikeGrindLightGreyHexTexture(weightLb),
        roughness: 0.72,
        metalness: 0.03,
      });

      for (let d = 0; d < 2; d++) {
        const slotIdx = p * 2 + d;
        const dbX = -traySpanX * 0.5 + 0.02 + (slotIdx + 0.5) * slotW;
        const dbY = 0.012 + headR * 0.866;

        const dbGroup = new THREE.Group();
        dbGroup.name = `outbuildings.gym.nikeGrindDumbbell.${weightLb}lb.${d + 1}`;
        dbGroup.position.set(dbX, dbY, 0);
        trayGroup.add(dbGroup);

        // Ergonomic contoured chrome barrel handle with knurled center bands
        const handleMesh = new THREE.Mesh(barrelHandleGeo, chromeBoltMat);
        handleMesh.castShadow = true;
        dbGroup.add(handleMesh);

        for (const kz of [-0.032, 0.0, 0.032]) {
          const knurlBand = new THREE.Mesh(
            new THREE.CylinderGeometry(0.0168, 0.0168, 0.018, 12),
            knurledGripMat
          );
          knurlBand.rotation.x = Math.PI / 2;
          knurlBand.position.set(0, 0, kz);
          dbGroup.add(knurlBand);
        }

        // Front (`+Z`) and Rear (`-Z`) Light-Grey Speckled Nike Grind Bevelled Hex Heads
        const handleHalfSpan = 0.064;
        for (const endZ of [-1, 1] as const) {
          const hexHead = new THREE.Mesh(headGeo, headMat);
          hexHead.rotation.x = Math.PI / 2;
          // Rotate front head so the Nike Swoosh facet (`u ≈ 0.25`) faces up, and rear head so the weight numeral (`u ≈ 0.75`) faces up!
          hexHead.rotation.y = endZ > 0 ? 0 : Math.PI;
          hexHead.position.set(0, 0, endZ * (handleHalfSpan + headLen * 0.5 - 0.004));
          hexHead.castShadow = true;
          hexHead.receiveShadow = true;
          dbGroup.add(hexHead);
        }
      }
    }
  }
}

/**
 * Generates a realistic brushed 304 stainless-steel horizontal grain texture (`#dce1e7`)
 * with fine linear satin abrasion lines and subtle specular sheen variation.
 */
function createBrushedStainlessSteelMaterial(): THREE.MeshStandardMaterial {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#d8dde3');
  grad.addColorStop(0.45, '#eef2f6');
  grad.addColorStop(0.75, '#cfd5dc');
  grad.addColorStop(1, '#e3e8ee');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Fine horizontal brushed 304 stainless grain lines
  for (let y = 0; y < h; y++) {
    const n = Math.sin(y * 19.73) * 43758.5453;
    const f = n - Math.floor(n);
    ctx.fillStyle =
      f > 0.5
        ? `rgba(255, 255, 255, ${(f - 0.5) * 0.22})`
        : `rgba(110, 120, 132, ${(0.5 - f) * 0.22})`;
    ctx.fillRect(0, y, w, 1);
  }

  for (let i = 0; i < 650; i++) {
    const h1 = Math.sin(i * 12.9898) * 43758.5453;
    const f1 = h1 - Math.floor(h1);
    const h2 = Math.sin(i * 78.233) * 29183.127;
    const f2 = h2 - Math.floor(h2);
    const sx = f1 * w;
    const sy = f2 * h;
    const len = 28 + (i % 65);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.12)' : 'rgba(90,98,108,0.12)';
    ctx.fillRect(sx, sy, len, 1);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;

  return new THREE.MeshStandardMaterial({
    map: tex,
    color: 0xdce1e7,
    roughness: 0.24,
    metalness: 0.88,
  });
}

/**
 * Generates a high-resolution multi-stave finger-jointed rock-maple & European-oak
 * laminated butcher-block worktop texture with realistic stave tone variation,
 * finger-joint butt seams, medullary ray grain, and satin tung-oil finish.
 */
function createButcherBlockTexture(): THREE.CanvasTexture {
  const w = 1024;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const staveColors = [
    '#c89662',
    '#bc8650',
    '#d2a16d',
    '#b37c46',
    '#c5915b',
    '#d6a673',
    '#ba834d',
    '#cf9d68',
    '#ad7640',
    '#c28e58',
  ] as const;

  const numStaves = 18;
  const staveH = h / numStaves;

  for (let s = 0; s < numStaves; s++) {
    const y0 = s * staveH;
    // 2 or 3 finger-jointed stave segments along the 3.16m length
    const joint1 = Math.round(w * (0.28 + ((s * 37) % 41) * 0.011));
    const joint2 = Math.round(w * (0.66 + ((s * 53) % 27) * 0.01));
    const segBounds = [0, joint1, joint2, w] as const;

    for (let seg = 0; seg < 3; seg++) {
      const x0 = segBounds[seg]!;
      const x1 = segBounds[seg + 1]!;
      const segW = x1 - x0;
      const baseColor = staveColors[(s * 3 + seg * 5) % staveColors.length]!;

      ctx.fillStyle = baseColor;
      ctx.fillRect(x0, y0, segW, staveH + 0.5);

      // Subtle longitudinal wood grain fibers within each stave segment
      for (let g = 0; g < 16; g++) {
        const gy = y0 + ((g + 0.5) / 16) * staveH;
        ctx.strokeStyle =
          g % 2 === 0 ? 'rgba(85, 48, 18, 0.10)' : 'rgba(255, 228, 190, 0.08)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(x0, gy);
        for (let gx = x0; gx <= x1; gx += 32) {
          const wave = Math.sin(gx * 0.025 + s * 1.7 + g * 0.6) * 1.6;
          ctx.lineTo(gx, gy + wave);
        }
        ctx.stroke();
      }

      // Finger-joint vertical micro-zig-zag seam at segment boundary
      if (seg > 0) {
        ctx.strokeStyle = 'rgba(72, 40, 14, 0.42)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        for (let fy = y0; fy <= y0 + staveH; fy += 3.5) {
          const zig = ((Math.round((fy - y0) / 3.5) % 2) - 0.5) * 3.2;
          if (fy === y0) ctx.moveTo(x0 + zig, fy);
          else ctx.lineTo(x0 + zig, fy);
        }
        ctx.stroke();
      }
    }

    // Crisp horizontal stave glue-line shadow
    ctx.fillStyle = 'rgba(68, 38, 14, 0.36)';
    ctx.fillRect(0, y0, w, 1.2);
  }

  // Subtle warm tung-oil sheen vignette
  const sheen = ctx.createLinearGradient(0, 0, 0, h);
  sheen.addColorStop(0, 'rgba(255, 245, 225, 0.06)');
  sheen.addColorStop(0.5, 'rgba(255, 250, 240, 0.10)');
  sheen.addColorStop(1, 'rgba(60, 35, 12, 0.08)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, w, h);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

/**
 * Generates a crisp DeWALT black-and-yellow brand badge texture (`#febd17` & `#141619`).
 */
function createDeWaltLogoTexture(): THREE.CanvasTexture {
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
  return tex;
}

/**
 * Issue #4 ("Shift this right over" at `[-11.294, 0.045, 19.729]`) &
 * Issue #5 ("Put it against this wall and cut it in to make use of the dead space behind, make it slightly longer"
 * at `[-10.226, -0.27, 17.512]` -> Outbuilding `(u = 12.07m, y = -0.27m, v = 2.555m)`, `-u` West face of Garage East Wall):
 * Builds a `3.88m` 5-Bay Heavy-Duty Commercial Stainless-Steel & Laminated Butcher-Block Workshop Tool Bench
 * (`outbuildings.garage.toolBench`) recessed into the Garage East Wall (`u = 12.07..12.31m`) and utilizing the
 * dead space behind (`u = 12.31..12.82m` on the West side of the Store room behind the Golf Simulator), featuring:
 * - Recessed Alcove Lining Enclosure (`outbuildings.garage.toolBench.alcoveEnclosure`) with plasterboard inner jambs,
 *   soffit head lining, and a plastered studwork back & side housing box on the Store room side
 * - Brushed 304 stainless-steel drawer fronts & cabinet doors across 5 bays (`3.88m` total width, `bayCenters = [-1.51, -0.755, 0.0, 0.755, 1.51]`)
 * - Multi-stave finger-jointed hardwood butcher-block worktop assembly (`3.88m x 0.052m x 0.78m`) with bullnose front edge,
 *   30mm brushed stainless perimeter upstand lip, and inlaid magnetic stainless parts tray
 * - Full suite of recognizable **DeWALT 18V XR / 54V FLEXVOLT** (`#febd17` yellow & `#181a1d` matte black) power tools
 *   spread across the `3.88m` workbench.
 */
export function buildGarageToolBench(
  groundGroup: THREE.Group,
  garageFloorTopY: number
): void {
  const benchGroup = new THREE.Group();
  benchGroup.name = 'outbuildings.garage.toolBench';
  // Positioned along the Garage East Wall (`u = 12.07m`, centered at `v = 3.16m` spanning `v = 1.22..5.10m`).
  // With `rotation.y = Math.PI / 2`, local `-Z` (the front of the drawers & tools) faces `-u` (West into the Garage at `u = 12.04m`)
  // and local `+Z` (the back of the bench, pegboard & alcove housing) recesses East (`+u`) into the wall cutout (`u = 12.07..12.31m`)
  // and Store room dead space (`u = 12.31..12.82m`)!
  benchGroup.position.set(12.41, garageFloorTopY, 3.16);
  benchGroup.rotation.y = Math.PI / 2;
  groundGroup.add(benchGroup);

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
  const butcherBlockMat = new THREE.MeshStandardMaterial({
    map: createButcherBlockTexture(),
    color: 0xffffff,
    roughness: 0.36,
    metalness: 0.04,
  });
  const butcherEdgeMat = new THREE.MeshStandardMaterial({
    color: 0x9e6b3b,
    roughness: 0.42,
    metalness: 0.04,
  });
  const viceCastIronMat = new THREE.MeshStandardMaterial({
    color: 0x2b3e50,
    roughness: 0.44,
    metalness: 0.74,
  });
  const alcovePlasterMat = new THREE.MeshStandardMaterial({
    color: 0xf2ede2,
    roughness: 0.86,
    metalness: 0.02,
  });
  // Authentic DeWALT Industrial Yellow (#febd17) & Matte Black (#181a1d)
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
  const rockerSwitchMat = new THREE.MeshStandardMaterial({
    color: 0xd32f2f,
    roughness: 0.35,
    metalness: 0.15,
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

  // Longer 5-bay commercial workbench (`totalW = 3.88m`, spanning `v = 1.22..5.10m`)
  const totalW = 3.88;
  const benchD = 0.74;
  const cabinetH = 0.86;
  const topT = 0.052;
  const worktopY = cabinetH + topT;

  // ---------------------------------------------------------------------------
  // Recessed Alcove Jamb Linings (`outbuildings.garage.toolBench.alcoveEnclosure`)
  // ---------------------------------------------------------------------------
  const alcoveGroup = new THREE.Group();
  alcoveGroup.name = 'outbuildings.garage.toolBench.alcoveEnclosure';
  alcoveGroup.userData.isArchitecturalShell = true;
  benchGroup.add(alcoveGroup);

  const alcoveH = 1.92;
  const alcoveHalfW = totalW * 0.5 + 0.02; // 1.96m (matches v = 1.20..5.12m cutout)
  for (const sideX of [-1, 1] as const) {
    const jambLining = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, alcoveH, 0.73),
      alcovePlasterMat
    );
    jambLining.userData.isArchitecturalShell = true;
    jambLining.position.set(sideX * (alcoveHalfW - 0.008), alcoveH * 0.5, 0.025);
    jambLining.castShadow = true;
    jambLining.receiveShadow = true;
    alcoveGroup.add(jambLining);
  }


  // ---------------------------------------------------------------------------
  // 5-Bay Cabinet Carcass, Plinth & Brushed 304 Stainless-Steel Drawers (`totalW = 3.88m`)
  // ---------------------------------------------------------------------------
  const carcass = new THREE.Mesh(
    new THREE.BoxGeometry(totalW - 0.04, cabinetH - 0.05, benchD - 0.04),
    anthraciteSteelMat
  );
  carcass.position.set(0, 0.05 + (cabinetH - 0.05) * 0.5, 0.01);
  carcass.castShadow = true;
  carcass.receiveShadow = true;
  benchGroup.add(carcass);

  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(totalW - 0.08, 0.05, benchD - 0.08),
    dewaltBlackMat
  );
  plinth.position.set(0, 0.025, 0.02);
  benchGroup.add(plinth);

  const frontZ = -benchD * 0.5 + 0.012;
  const postPositionsX = [
    -totalW * 0.5 + 0.025,
    -1.1325,
    -0.3775,
    0.3775,
    1.1325,
    totalW * 0.5 - 0.025,
  ] as const;
  for (const mx of postPositionsX) {
    const stile = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, cabinetH - 0.05, 0.016),
      anthraciteSteelMat
    );
    stile.position.set(mx, 0.05 + (cabinetH - 0.05) * 0.5, frontZ + 0.004);
    benchGroup.add(stile);
  }

  for (const fx of postPositionsX) {
    for (const fz of [-benchD * 0.5 + 0.07, benchD * 0.5 - 0.07]) {
      const footPad = new THREE.Mesh(
        new THREE.CylinderGeometry(0.036, 0.038, 0.014, 14),
        dewaltBlackMat
      );
      footPad.position.set(fx, 0.007, fz);
      benchGroup.add(footPad);

      const footLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.024, 0.028, 0.042, 12),
        aluminumTrimMat
      );
      footLeg.position.set(fx, 0.031, fz);
      benchGroup.add(footLeg);
    }
  }

  const drawerW = 0.735;
  const bayCenters = [-1.51, -0.755, 0.0, 0.755, 1.51] as const;
  const bankSpecs = [
    {
      cx: bayCenters[0],
      w: drawerW,
      drawerHeights: [0.085, 0.105, 0.135, 0.185, 0.22] as const,
    },
    {
      cx: bayCenters[1],
      w: drawerW,
      drawerHeights: [0.085, 0.105, 0.135, 0.185, 0.22] as const,
    },
    {
      cx: bayCenters[2],
      w: drawerW,
      drawerHeights: [0.085, 0.105, 0.135, 0.185, 0.22] as const,
    },
    {
      cx: bayCenters[3],
      w: drawerW,
      drawerHeights: [0.085, 0.105, 0.135, 0.185, 0.22] as const,
    },
    {
      cx: bayCenters[4],
      w: drawerW,
      drawerHeights: [0.095, 0.135] as const,
    },
  ] as const;

  for (const bank of bankSpecs) {
    let cursorY = cabinetH - 0.025;

    const keyLock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.026, 12),
      aluminumTrimMat
    );
    keyLock.rotation.x = Math.PI / 2;
    keyLock.position.set(bank.cx + bank.w * 0.5 - 0.032, cabinetH - 0.048, frontZ - 0.004);
    benchGroup.add(keyLock);

    for (let dIdx = 0; dIdx < bank.drawerHeights.length; dIdx++) {
      const dh = bank.drawerHeights[dIdx]!;
      const dy = cursorY - dh * 0.5;
      const drawerFront = new THREE.Mesh(
        new THREE.BoxGeometry(bank.w, dh - 0.007, 0.02),
        brushedStainlessMat
      );
      drawerFront.name = 'outbuildings.garage.toolBench.drawer';
      drawerFront.position.set(bank.cx, dy, frontZ);
      drawerFront.castShadow = true;
      drawerFront.receiveShadow = true;
      benchGroup.add(drawerFront);

      const pullBar = new THREE.Mesh(
        new THREE.BoxGeometry(bank.w - 0.024, 0.016, 0.026),
        aluminumTrimMat
      );
      pullBar.position.set(bank.cx, dy + dh * 0.5 - 0.015, frontZ - 0.012);
      benchGroup.add(pullBar);

      const labelStrip = new THREE.Mesh(
        new THREE.BoxGeometry(bank.w * 0.42, 0.007, 0.004),
        dewaltBlackMat
      );
      labelStrip.position.set(bank.cx, dy + dh * 0.5 - 0.015, frontZ - 0.025);
      benchGroup.add(labelStrip);

      cursorY -= dh;
    }
  }

  for (const sideX of [-1, 1] as const) {
    const doorW = 0.362;
    const doorPanel = new THREE.Mesh(
      new THREE.BoxGeometry(doorW, 0.495, 0.02),
      brushedStainlessMat
    );
    doorPanel.name = 'outbuildings.garage.toolBench.drawer';
    doorPanel.position.set(1.51 + sideX * (doorW * 0.5 + 0.004), 0.325, frontZ);
    doorPanel.castShadow = true;
    doorPanel.receiveShadow = true;
    benchGroup.add(doorPanel);

    const vHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.15, 0.026),
      aluminumTrimMat
    );
    vHandle.position.set(1.51 + sideX * 0.032, 0.42, frontZ - 0.012);
    benchGroup.add(vHandle);
  }

  // ---------------------------------------------------------------------------
  // Multi-Part Laminated Hardwood Butcher-Block Worktop Assembly (`3.88m x 0.052m x 0.78m`)
  // ---------------------------------------------------------------------------
  const topD = 0.78;
  const butcherTop = new THREE.Mesh(
    new THREE.BoxGeometry(totalW, topT, topD),
    butcherBlockMat
  );
  butcherTop.name = 'outbuildings.garage.toolBench.butcherBlockTop';
  butcherTop.position.set(0, cabinetH + topT * 0.5, 0);
  butcherTop.castShadow = true;
  butcherTop.receiveShadow = true;
  benchGroup.add(butcherTop);

  const bullnoseRadius = topT * 0.5;
  const frontBullnose = new THREE.Mesh(
    new THREE.CylinderGeometry(bullnoseRadius, bullnoseRadius, totalW, 16),
    butcherBlockMat
  );
  frontBullnose.name = 'outbuildings.garage.toolBench.butcherBlockTop';
  frontBullnose.rotation.z = Math.PI / 2;
  frontBullnose.position.set(0, cabinetH + topT * 0.5, -topD * 0.5);
  frontBullnose.castShadow = true;
  frontBullnose.receiveShadow = true;
  benchGroup.add(frontBullnose);

  for (const sideX of [-1, 1] as const) {
    const endCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, topT + 0.002, topD + 0.012),
      butcherEdgeMat
    );
    endCap.position.set(sideX * (totalW * 0.5 + 0.004), cabinetH + topT * 0.5, 0);
    endCap.castShadow = true;
    benchGroup.add(endCap);

    const cornerBracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, topT + 0.004, 0.065),
      brushedStainlessMat
    );
    cornerBracket.position.set(
      sideX * (totalW * 0.5 - 0.026),
      cabinetH + topT * 0.5,
      -topD * 0.5 + 0.022
    );
    benchGroup.add(cornerBracket);
  }

  const upstandH = 0.032;
  const upstandT = 0.012;
  const rearUpstand = new THREE.Mesh(
    new THREE.BoxGeometry(totalW, upstandH, upstandT),
    brushedStainlessMat
  );
  rearUpstand.position.set(0, worktopY + upstandH * 0.5, benchD * 0.5 - upstandT * 0.5);
  benchGroup.add(rearUpstand);

  for (const sideX of [-1, 1] as const) {
    const sideUpstand = new THREE.Mesh(
      new THREE.BoxGeometry(upstandT, upstandH, benchD * 0.65),
      brushedStainlessMat
    );
    sideUpstand.position.set(
      sideX * (totalW * 0.5 - upstandT * 0.5),
      worktopY + upstandH * 0.5,
      benchD * 0.5 - (benchD * 0.65) * 0.5
    );
    benchGroup.add(sideUpstand);
  }

  const magTrayGroup = new THREE.Group();
  magTrayGroup.position.set(-1.24, worktopY, -0.22);
  benchGroup.add(magTrayGroup);

  const trayRim = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.01, 0.18),
    brushedStainlessMat
  );
  trayRim.position.set(0, 0.005, 0);
  magTrayGroup.add(trayRim);

  const trayWell = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.006, 0.14),
    anthraciteSteelMat
  );
  trayWell.position.set(0, 0.008, 0);
  magTrayGroup.add(trayWell);

  for (let s = 0; s < 6; s++) {
    const socket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008 + s * 0.0012, 0.008 + s * 0.0012, 0.028, 12),
      aluminumTrimMat
    );
    socket.position.set(-0.08 + s * 0.032, 0.024, -0.03);
    magTrayGroup.add(socket);
  }

  const pegboardH = 0.64;
  const pegboard = new THREE.Mesh(
    new THREE.BoxGeometry(totalW - 0.04, pegboardH, 0.024),
    anthraciteSteelMat
  );
  pegboard.name = 'outbuildings.garage.toolBench.pegboard';
  pegboard.position.set(0, worktopY + pegboardH * 0.5, benchD * 0.5 - 0.02);
  benchGroup.add(pegboard);

  const powerStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.062, 0.036),
    aluminumTrimMat
  );
  powerStrip.name = 'outbuildings.garage.toolBench.powerStrip';
  powerStrip.position.set(0.0, worktopY + 0.11, benchD * 0.5 - 0.045);
  benchGroup.add(powerStrip);

  for (let s = 0; s < 6; s++) {
    const sx = -0.25 + s * 0.1;
    const socketFace = new THREE.Mesh(
      new THREE.BoxGeometry(0.048, 0.044, 0.008),
      dewaltBlackMat
    );
    socketFace.position.set(sx, worktopY + 0.11, benchD * 0.5 - 0.065);
    benchGroup.add(socketFace);

    const redSwitch = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.018, 0.01),
      rockerSwitchMat
    );
    redSwitch.position.set(sx + 0.016, worktopY + 0.12, benchD * 0.5 - 0.068);
    benchGroup.add(redSwitch);
  }

  const upperCabH = 0.34;
  const upperCabD = 0.32;
  const upperCab = new THREE.Mesh(
    new THREE.BoxGeometry(totalW - 0.04, upperCabH, upperCabD),
    anthraciteSteelMat
  );
  upperCab.position.set(
    0,
    worktopY + pegboardH + upperCabH * 0.5,
    benchD * 0.5 - upperCabD * 0.5
  );
  upperCab.castShadow = true;
  benchGroup.add(upperCab);

  for (const ux of bayCenters) {
    const upperDoor = new THREE.Mesh(
      new THREE.BoxGeometry(drawerW, upperCabH - 0.03, 0.018),
      brushedStainlessMat
    );
    upperDoor.name = 'outbuildings.garage.toolBench.drawer';
    upperDoor.position.set(
      ux,
      worktopY + pegboardH + upperCabH * 0.5,
      benchD * 0.5 - upperCabD - 0.008
    );
    benchGroup.add(upperDoor);

    const upperPull = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.014, 0.022),
      aluminumTrimMat
    );
    upperPull.position.set(
      ux,
      worktopY + pegboardH + 0.035,
      benchD * 0.5 - upperCabD - 0.022
    );
    benchGroup.add(upperPull);
  }

  const ledStripMat = new THREE.MeshStandardMaterial({
    color: 0xf4f9ff,
    emissive: new THREE.Color(0xd8eeff),
    emissiveIntensity: 2.6,
    roughness: 0.16,
  });
  const ledTaskBar = new THREE.Mesh(
    new THREE.BoxGeometry(3.7, 0.014, 0.038),
    ledStripMat
  );
  ledTaskBar.position.set(0, worktopY + pegboardH - 0.007, benchD * 0.5 - upperCabD + 0.05);
  benchGroup.add(ledTaskBar);

  // ---------------------------------------------------------------------------
  // Authentic DeWALT 18V XR / 54V FLEXVOLT Suite spread across the `3.88m` worktop
  // ---------------------------------------------------------------------------

  // A. Heavy Cast-Iron Engineer's Bench Vice (`x = -1.66m, z = -0.24m`)
  const viceGroup = new THREE.Group();
  viceGroup.name = 'outbuildings.garage.toolBench.vice';
  viceGroup.position.set(-1.66, worktopY, -0.24);
  benchGroup.add(viceGroup);

  const viceBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.088, 0.098, 0.028, 16),
    viceCastIronMat
  );
  viceBase.position.set(0, 0.014, 0);
  viceGroup.add(viceBase);

  const fixedJaw = new THREE.Mesh(
    new THREE.BoxGeometry(0.135, 0.145, 0.095),
    viceCastIronMat
  );
  fixedJaw.position.set(0, 0.092, 0.02);
  fixedJaw.castShadow = true;
  viceGroup.add(fixedJaw);

  const slidingJaw = new THREE.Mesh(
    new THREE.BoxGeometry(0.135, 0.125, 0.078),
    viceCastIronMat
  );
  slidingJaw.position.set(0, 0.086, -0.088);
  slidingJaw.castShadow = true;
  viceGroup.add(slidingJaw);

  const viceSlideBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.054, 0.048, 0.23),
    aluminumTrimMat
  );
  viceSlideBar.position.set(0, 0.065, -0.02);
  viceGroup.add(viceSlideBar);

  const leadScrewHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.06, 12),
    aluminumTrimMat
  );
  leadScrewHub.rotation.x = Math.PI / 2;
  leadScrewHub.position.set(0, 0.075, -0.148);
  viceGroup.add(leadScrewHub);

  const tommyBar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.006, 0.18, 10),
    aluminumTrimMat
  );
  tommyBar.rotation.z = 0.45;
  tommyBar.position.set(0, 0.075, -0.168);
  viceGroup.add(tommyBar);

  // B. DeWALT DWS780 305mm Double-Bevel Sliding Compound Mitre Saw (`x = -0.68m, z = -0.02m`)
  const sawGroup = new THREE.Group();
  sawGroup.name = 'outbuildings.garage.toolBench.mitreSaw';
  sawGroup.position.set(-0.68, worktopY, -0.02);
  benchGroup.add(sawGroup);

  const sawBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.24, 0.048, 24),
    castAluminumMat
  );
  sawBase.position.set(0, 0.024, 0);
  sawBase.castShadow = true;
  sawGroup.add(sawBase);

  for (const sideX of [-1, 1] as const) {
    const extWing = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.044, 0.16),
      castAluminumMat
    );
    extWing.position.set(sideX * 0.25, 0.022, 0.02);
    extWing.castShadow = true;
    sawGroup.add(extWing);
  }

  const kerfPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.056, 0.004, 0.34),
    dewaltYellowMat
  );
  kerfPlate.position.set(0, 0.049, -0.02);
  sawGroup.add(kerfPlate);

  const mitreArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.068, 0.032, 0.16),
    castAluminumMat
  );
  mitreArm.position.set(0, 0.026, -0.22);
  sawGroup.add(mitreArm);

  const mitreLockKnob = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.018, 0.055, 12),
    dewaltYellowMat
  );
  mitreLockKnob.rotation.x = Math.PI / 2;
  mitreLockKnob.position.set(0, 0.032, -0.31);
  sawGroup.add(mitreLockKnob);

  const fenceBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 0.078, 0.032),
    dewaltBlackMat
  );
  fenceBar.position.set(0, 0.086, 0.068);
  sawGroup.add(fenceBar);

  for (const rx of [-0.036, 0.036]) {
    const slideRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.013, 0.013, 0.36, 12),
      aluminumTrimMat
    );
    slideRod.rotation.x = Math.PI / 2;
    slideRod.position.set(rx, 0.175, 0.045);
    sawGroup.add(slideRod);
  }

  const sawBlade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.145, 0.145, 0.005, 28),
    aluminumTrimMat
  );
  sawBlade.rotation.z = Math.PI / 2;
  sawBlade.position.set(0, 0.2, -0.015);
  sawGroup.add(sawBlade);

  const bladeGuard = new THREE.Mesh(
    new THREE.CylinderGeometry(0.158, 0.158, 0.044, 24, 1, false, 0, Math.PI * 1.22),
    dewaltYellowMat
  );
  bladeGuard.rotation.z = Math.PI / 2;
  bladeGuard.position.set(0, 0.21, -0.015);
  bladeGuard.castShadow = true;
  sawGroup.add(bladeGuard);

  const sawBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.11, 0.042),
    dewaltBadgeMat
  );
  sawBadge.rotation.y = -Math.PI / 2;
  sawBadge.position.set(-0.024, 0.24, -0.015);
  sawGroup.add(sawBadge);

  const sawMotor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.062, 0.062, 0.16, 18),
    dewaltYellowMat
  );
  sawMotor.rotation.z = Math.PI / 2;
  sawMotor.position.set(0.105, 0.245, -0.015);
  sawMotor.castShadow = true;
  sawGroup.add(sawMotor);

  const sawMotorEndCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.056, 0.045, 18),
    dewaltBlackMat
  );
  sawMotorEndCap.rotation.z = Math.PI / 2;
  sawMotorEndCap.position.set(0.195, 0.245, -0.015);
  sawGroup.add(sawMotorEndCap);

  const sawHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.048, 0.038, 0.15),
    dewaltBlackMat
  );
  sawHandle.position.set(0.02, 0.33, -0.09);
  sawHandle.rotation.x = 0.32;
  sawGroup.add(sawHandle);

  const dustBag = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.044, 0.16, 12),
    dewaltYellowMat
  );
  dustBag.rotation.x = -Math.PI * 0.38;
  dustBag.position.set(0, 0.27, 0.16);
  sawGroup.add(dustBag);

  // C. DeWALT DW752 Heavy-Duty Twin-Wheel Bench Grinder (`x = +0.12m, z = -0.06m`)
  const grinderGroup = new THREE.Group();
  grinderGroup.name = 'outbuildings.garage.toolBench.benchGrinder';
  grinderGroup.position.set(0.12, worktopY, -0.06);
  benchGroup.add(grinderGroup);

  const grinderPedestal = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.042, 0.15),
    dewaltBlackMat
  );
  grinderPedestal.position.set(0, 0.021, 0);
  grinderGroup.add(grinderPedestal);

  const switchPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.052, 0.026, 0.012),
    dewaltYellowMat
  );
  switchPlate.position.set(0, 0.022, -0.078);
  grinderGroup.add(switchPlate);

  const grinderMotor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.072, 0.072, 0.17, 18),
    dewaltYellowMat
  );
  grinderMotor.rotation.z = Math.PI / 2;
  grinderMotor.position.set(0, 0.12, 0);
  grinderMotor.castShadow = true;
  grinderGroup.add(grinderMotor);

  const grinderBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.088, 0.034),
    dewaltBadgeMat
  );
  grinderBadge.position.set(0, 0.125, -0.073);
  grinderGroup.add(grinderBadge);

  for (const sideX of [-1, 1] as const) {
    const wheelGuard = new THREE.Mesh(
      new THREE.CylinderGeometry(0.098, 0.098, 0.044, 20),
      dewaltBlackMat
    );
    wheelGuard.rotation.z = Math.PI / 2;
    wheelGuard.position.set(sideX * 0.13, 0.12, 0);
    wheelGuard.castShadow = true;
    grinderGroup.add(wheelGuard);

    const abrasiveWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.085, 0.028, 20),
      aluminumTrimMat
    );
    abrasiveWheel.rotation.z = Math.PI / 2;
    abrasiveWheel.position.set(sideX * 0.13, 0.12, -0.014);
    grinderGroup.add(abrasiveWheel);

    const toolRest = new THREE.Mesh(
      new THREE.BoxGeometry(0.038, 0.008, 0.045),
      aluminumTrimMat
    );
    toolRest.position.set(sideX * 0.13, 0.085, -0.095);
    grinderGroup.add(toolRest);

    const eyeShield = new THREE.Mesh(
      new THREE.BoxGeometry(0.056, 0.048, 0.006),
      clearShieldMat
    );
    eyeShield.rotation.x = -0.35;
    eyeShield.position.set(sideX * 0.13, 0.195, -0.085);
    grinderGroup.add(eyeShield);
  }

  // D. DeWALT DWE4257 125mm Angle Grinder & DeWALT DCW210 18V XR Random Orbit Sander (`x = +0.78m, z = -0.10m`)
  const grinderSanderGroup = new THREE.Group();
  grinderSanderGroup.name = 'outbuildings.garage.toolBench.angleGrinderAndSander';
  grinderSanderGroup.position.set(0.78, worktopY, -0.1);
  benchGroup.add(grinderSanderGroup);

  const agUnit = new THREE.Group();
  agUnit.position.set(-0.1, 0, -0.04);
  agUnit.rotation.y = 0.42;
  grinderSanderGroup.add(agUnit);

  const agBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.03, 0.19, 14),
    dewaltYellowMat
  );
  agBody.rotation.z = Math.PI / 2;
  agBody.position.set(0, 0.046, 0);
  agBody.castShadow = true;
  agUnit.add(agBody);

  const agTailGrip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.024, 0.08, 14),
    dewaltBlackMat
  );
  agTailGrip.rotation.z = Math.PI / 2;
  agTailGrip.position.set(0.115, 0.046, 0);
  agUnit.add(agTailGrip);

  const agGearHead = new THREE.Mesh(
    new THREE.CylinderGeometry(0.034, 0.036, 0.052, 14),
    castAluminumMat
  );
  agGearHead.position.set(-0.105, 0.046, 0);
  agUnit.add(agGearHead);

  const agGuard = new THREE.Mesh(
    new THREE.CylinderGeometry(0.068, 0.068, 0.018, 18, 1, false, 0, Math.PI * 1.1),
    dewaltBlackMat
  );
  agGuard.position.set(-0.105, 0.022, 0);
  agUnit.add(agGuard);

  const agDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.062, 0.062, 0.004, 20),
    anthraciteSteelMat
  );
  agDisc.position.set(-0.105, 0.018, 0);
  agUnit.add(agDisc);

  const agSideHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.011, 0.11, 10),
    dewaltBlackMat
  );
  agSideHandle.rotation.x = Math.PI / 2;
  agSideHandle.position.set(-0.105, 0.046, -0.072);
  agUnit.add(agSideHandle);

  const sanderUnit = new THREE.Group();
  sanderUnit.position.set(0.13, 0, 0.05);
  sanderUnit.rotation.y = -0.28;
  grinderSanderGroup.add(sanderUnit);

  const sandingPad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.062, 0.062, 0.014, 18),
    dewaltBlackMat
  );
  sandingPad.position.set(0, 0.007, 0);
  sanderUnit.add(sandingPad);

  const sanderHousing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.052, 0.088, 16),
    dewaltYellowMat
  );
  sanderHousing.position.set(0, 0.058, 0);
  sanderHousing.castShadow = true;
  sanderUnit.add(sanderHousing);

  const sanderPalmCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.043, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
    dewaltBlackMat
  );
  sanderPalmCap.position.set(0, 0.098, 0);
  sanderUnit.add(sanderPalmCap);

  const sanderBattery = new THREE.Mesh(
    new THREE.BoxGeometry(0.068, 0.046, 0.085),
    dewaltYellowMat
  );
  sanderBattery.position.set(0, 0.052, 0.062);
  sanderUnit.add(sanderBattery);

  // E. DeWALT DCB132 Dual-Port 18V XR Charger + DeWALT DCD996 Hammer Drill, DCF887 Impact Driver & TSTAK Case (`x = +1.46m`)
  const drillsGroup = new THREE.Group();
  drillsGroup.name = 'outbuildings.garage.toolBench.cordlessDrills';
  drillsGroup.position.set(1.46, worktopY, -0.06);
  benchGroup.add(drillsGroup);

  const tstakCase = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.135, 0.22),
    dewaltBlackMat
  );
  tstakCase.position.set(0.14, 0.0675, 0.16);
  tstakCase.castShadow = true;
  drillsGroup.add(tstakCase);

  const tstakLidAccent = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.016, 0.18),
    dewaltYellowMat
  );
  tstakLidAccent.position.set(0.14, 0.138, 0.16);
  drillsGroup.add(tstakLidAccent);

  const tstakBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.14, 0.05),
    dewaltBadgeMat
  );
  tstakBadge.position.set(0.14, 0.072, 0.049);
  drillsGroup.add(tstakBadge);

  const chargerDock = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.058, 0.165),
    dewaltBlackMat
  );
  chargerDock.position.set(-0.18, 0.029, 0.13);
  chargerDock.castShadow = true;
  drillsGroup.add(chargerDock);

  const chargerYellowTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.242, 0.014, 0.04),
    dewaltYellowMat
  );
  chargerYellowTrim.position.set(-0.18, 0.048, 0.065);
  drillsGroup.add(chargerYellowTrim);

  for (const bx of [-0.235, -0.125]) {
    const batteryBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.078, 0.038, 0.112),
      dewaltBlackMat
    );
    batteryBase.position.set(bx, 0.068, 0.125);
    drillsGroup.add(batteryBase);

    const batteryCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.076, 0.022, 0.108),
      dewaltYellowMat
    );
    batteryCap.position.set(bx, 0.096, 0.125);
    drillsGroup.add(batteryCap);

    const chargeLed = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.006, 0.008),
      greenLedMat
    );
    chargeLed.position.set(bx, 0.059, 0.052);
    drillsGroup.add(chargeLed);
  }

  for (const [dx, dz, yaw, bodyLen, isHammerDrill] of [
    [-0.08, -0.08, -0.32, 0.185, true],
    [0.14, -0.06, -0.52, 0.135, false],
  ] as const) {
    const drillUnit = new THREE.Group();
    drillUnit.position.set(dx, 0, dz);
    drillUnit.rotation.y = yaw;
    drillsGroup.add(drillUnit);

    const battBlack = new THREE.Mesh(
      new THREE.BoxGeometry(0.078, 0.036, 0.118),
      dewaltBlackMat
    );
    battBlack.position.set(0, 0.018, 0);
    battBlack.castShadow = true;
    drillUnit.add(battBlack);

    const battYellow = new THREE.Mesh(
      new THREE.BoxGeometry(0.076, 0.018, 0.114),
      dewaltYellowMat
    );
    battYellow.position.set(0, 0.045, 0);
    drillUnit.add(battYellow);

    const grip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.019, 0.022, 0.13, 12),
      dewaltYellowMat
    );
    grip.position.set(0, 0.112, 0.01);
    grip.rotation.x = -0.18;
    grip.castShadow = true;
    drillUnit.add(grip);

    const gripRubber = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.023, 0.085, 12),
      dewaltBlackMat
    );
    gripRubber.position.set(0, 0.112, 0.014);
    gripRubber.rotation.x = -0.18;
    drillUnit.add(gripRubber);

    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.034, 0.034, bodyLen, 16),
      dewaltYellowMat
    );
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.192, -0.01);
    barrel.castShadow = true;
    drillUnit.add(barrel);

    const rearCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.028, 0.028, 16),
      dewaltBlackMat
    );
    rearCap.rotation.x = Math.PI / 2;
    rearCap.position.set(0, 0.192, -0.01 + bodyLen * 0.5 + 0.012);
    drillUnit.add(rearCap);

    const noseCone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.032, 0.032, 14),
      castAluminumMat
    );
    noseCone.rotation.x = Math.PI / 2;
    noseCone.position.set(0, 0.192, -0.01 - bodyLen * 0.5 - 0.014);
    drillUnit.add(noseCone);

    const chuck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.022, isHammerDrill ? 0.048 : 0.028, 12),
      dewaltBlackMat
    );
    chuck.rotation.x = Math.PI / 2;
    chuck.position.set(
      0,
      0.192,
      -0.01 - bodyLen * 0.5 - (isHammerDrill ? 0.048 : 0.036)
    );
    drillUnit.add(chuck);

    if (isHammerDrill) {
      const auxHandle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.013, 0.011, 0.12, 10),
        dewaltBlackMat
      );
      auxHandle.rotation.z = Math.PI / 2;
      auxHandle.position.set(-0.075, 0.192, -0.01 - bodyLen * 0.5 - 0.012);
      drillUnit.add(auxHandle);
    }
  }

  // F. Organized Hand Tools on Pegboard (`3.84m` width, with DeWALT Yellow & Black accents)
  const pegZ = benchD * 0.5 - 0.038;
  for (let wIdx = 0; wIdx < 12; wIdx++) {
    const wx = -1.55 + wIdx * 0.058;
    const wLen = 0.12 + wIdx * 0.014;
    const wrench = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, wLen, 0.006),
      aluminumTrimMat
    );
    wrench.position.set(wx, worktopY + 0.36, pegZ);
    benchGroup.add(wrench);
  }
  for (let sIdx = 0; sIdx < 10; sIdx++) {
    const sx = -0.52 + sIdx * 0.056;
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.01, 0.088, 10),
      sIdx % 2 === 0 ? dewaltYellowMat : dewaltBlackMat
    );
    handle.position.set(sx, worktopY + 0.42, pegZ);
    benchGroup.add(handle);

    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.003, 0.105, 8),
      aluminumTrimMat
    );
    shaft.position.set(sx, worktopY + 0.33, pegZ);
    benchGroup.add(shaft);
  }
  const spiritLevel = new THREE.Mesh(
    new THREE.BoxGeometry(1.12, 0.05, 0.022),
    dewaltYellowMat
  );
  spiritLevel.position.set(0.88, worktopY + 0.45, pegZ);
  benchGroup.add(spiritLevel);
}

export const buildGarageWorkshopToolBench = buildGarageToolBench;

/**
 * Generates a realistic clear-lacquered Solid American White Oak wood-grain texture
 * (`#9c744f` / `#8c6440`) with fine quarter-sawn medullary rays and warm cathedral grain lines
 * for the Haldane UK bespoke wooden spiral staircase.
 */
function createAmericanWhiteOakTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const baseGrad = ctx.createLinearGradient(0, 0, w, h);
  baseGrad.addColorStop(0, '#d8b58a');
  baseGrad.addColorStop(0.5, '#cda77b');
  baseGrad.addColorStop(1, '#c29a6d');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 180; i++) {
    const y0 = (i / 180) * h;
    ctx.strokeStyle =
      i % 3 === 0
        ? 'rgba(68, 42, 18, 0.14)'
        : i % 3 === 1
          ? 'rgba(235, 200, 155, 0.09)'
          : 'rgba(92, 58, 28, 0.10)';
    ctx.lineWidth = 1.2 + (i % 3) * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y0);
    for (let x = 0; x <= w; x += 32) {
      const wave =
        Math.sin(x * 0.018 + i * 0.7) * 3.5 +
        Math.cos(x * 0.045 - i * 1.1) * 1.4;
      ctx.lineTo(x, y0 + wave);
    }
    ctx.stroke();
  }

  for (let r = 0; r < 140; r++) {
    const h1 = Math.sin(r * 12.9898) * 43758.5453;
    const f1 = h1 - Math.floor(h1);
    const h2 = Math.sin(r * 78.233) * 29183.127;
    const f2 = h2 - Math.floor(h2);
    ctx.fillStyle = 'rgba(225, 190, 145, 0.11)';
    ctx.fillRect(f1 * w, f2 * h, 18 + (r % 24), 2.2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Issue #2 ("Remove the ladder" at `[-3.328, 1.428, 18.92]`) &
 * Issue #3 ("Spiral staircase here https://haldaneuk.com/projects/wooden-spiral-staircase/"
 * at `[-0.025, 1.428, 18.785]` -> Outbuilding `(u = 22.124m, y = 1.428m, v = 4.696m)` in the SE corner of the Barn):
 * Builds a showroom-quality **Haldane UK Bespoke Freestanding Solid American White Oak Spiral Staircase**
 * (`outbuildings.barn.spiralStaircase`) centered at `(centerU = 22.08m, centerV = 4.50m)`, rising from
 * `barnLowerFloorY = -0.70m` to `mezzanineFloorY = 1.54m` (`totalRise = 2.24m`), complete with:
 * - Turned Solid American White Oak Central Column (`outbuildings.barn.spiralStaircase.centerColumn`, `170mm` diameter)
 *   with stacked turned drum spacers, shadow V-grooves, steel/oak base plinth, and turned oak top newel finial
 * - 12 Bespoke Fan-Shaped Solid American White Oak Treads (`outbuildings.barn.spiralStaircase.tread`) built with
 *   `THREE.ExtrudeGeometry` bullnose fan sectors and sculpted solid-oak underneath support brackets
 * - Custom Solid Oak Quadrant Top Landing Platform (`outbuildings.barn.spiralStaircase.topLanding`) at `y = 2.24m`
 *   bridging from the center column to the Mezzanine landing edge (`u = 21.14m, v = 3.56..4.95m`)
 * - Continuous Helical Laminated Solid-Oak Outer Stringer Ribbon (`outbuildings.barn.spiralStaircase.outerStringer`)
 *   tying the outer tips of the treads together (`r = 0.875m`, `4–5cm` clear of the Barn South & East walls)
 * - Continuous Helical Solid American White Oak Handrail (`outbuildings.barn.spiralStaircase.handrail`) with a classic
 *   Haldane UK **scrolled horizontal bullnose volute curl** at the bottom entry and turned balusters (`outbuildings.barn.spiralStaircase.spindle`).
 */
export function buildBarnSpiralStaircase(
  groundGroup: THREE.Group,
  barnLowerFloorY: number,
  mezzanineFloorY: number
): void {
  const centerU = 22.08;
  const centerV = 4.5;
  const totalRise = mezzanineFloorY - barnLowerFloorY; // 2.24m (-0.70m to +1.54m)
  const numSteps = 12;
  const riserH = totalRise / numSteps; // 0.1867m per step
  const innerRadius = 0.082;
  const columnRadius = 0.085; // 170mm diameter turned oak central column
  const outerRadius = 0.88; // Spans u = 21.20..22.96m (4cm clear of u=23.00m wall) & v = 3.62..5.38m (5cm clear of v=5.43m wall)

  const stairGroup = new THREE.Group();
  stairGroup.name = 'outbuildings.barn.spiralStaircase';
  stairGroup.position.set(centerU, barnLowerFloorY, centerV);
  groundGroup.add(stairGroup);

  const oakTex = createAmericanWhiteOakTexture();
  const oakTreadMat = new THREE.MeshStandardMaterial({
    map: oakTex,
    color: 0xd6b48c,
    roughness: 0.4,
    metalness: 0.03,
  });
  const oakHandrailMat = new THREE.MeshStandardMaterial({
    map: oakTex,
    color: 0xcaa67c,
    roughness: 0.36,
    metalness: 0.04,
  });
  const agedBronzeMat = new THREE.MeshStandardMaterial({
    color: 0x46382b,
    roughness: 0.34,
    metalness: 0.78,
  });
  const baseFlangeMat = new THREE.MeshStandardMaterial({
    color: 0x23272d,
    roughness: 0.38,
    metalness: 0.74,
  });

  // ---------------------------------------------------------------------------
  // 1. Central Turned American White Oak Column (`outbuildings.barn.spiralStaircase.centerColumn`)
  // ---------------------------------------------------------------------------
  const columnGroup = new THREE.Group();
  columnGroup.name = 'outbuildings.barn.spiralStaircase.centerColumn';
  stairGroup.add(columnGroup);

  const steelBaseFlange = new THREE.Mesh(
    new THREE.CylinderGeometry(0.165, 0.175, 0.018, 28),
    baseFlangeMat
  );
  steelBaseFlange.position.set(0, 0.009, 0);
  steelBaseFlange.receiveShadow = true;
  columnGroup.add(steelBaseFlange);

  const oakBasePlinth = new THREE.Mesh(
    new THREE.CylinderGeometry(columnRadius + 0.018, columnRadius + 0.042, 0.068, 28),
    oakHandrailMat
  );
  oakBasePlinth.name = 'outbuildings.barn.spiralStaircase.centerColumn';
  oakBasePlinth.position.set(0, 0.048, 0);
  oakBasePlinth.castShadow = true;
  oakBasePlinth.receiveShadow = true;
  columnGroup.add(oakBasePlinth);

  const totalColumnH = totalRise + 1.02;
  const numDrums = numSteps + 5;
  const drumPitchH = totalColumnH / numDrums;
  for (let d = 0; d < numDrums; d++) {
    const dy = (d + 0.5) * drumPitchH;
    const drumMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(columnRadius, columnRadius, drumPitchH - 0.008, 28),
      oakHandrailMat
    );
    drumMesh.name = 'outbuildings.barn.spiralStaircase.centerColumn';
    drumMesh.position.set(0, dy, 0);
    drumMesh.castShadow = true;
    drumMesh.receiveShadow = true;
    columnGroup.add(drumMesh);

    const shadowNeck = new THREE.Mesh(
      new THREE.CylinderGeometry(columnRadius - 0.006, columnRadius - 0.006, 0.01, 24),
      agedBronzeMat
    );
    shadowNeck.position.set(0, (d + 1) * drumPitchH, 0);
    columnGroup.add(shadowNeck);
  }

  const capitalCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(columnRadius + 0.022, columnRadius + 0.008, 0.042, 28),
    oakHandrailMat
  );
  capitalCollar.position.set(0, totalColumnH + 0.021, 0);
  columnGroup.add(capitalCollar);

  const topFinial = new THREE.Mesh(
    new THREE.SphereGeometry(columnRadius + 0.014, 24, 18),
    oakHandrailMat
  );
  topFinial.name = 'outbuildings.barn.spiralStaircase.centerColumn';
  topFinial.scale.set(1, 1.18, 1);
  topFinial.position.set(0, totalColumnH + 0.1, 0);
  topFinial.castShadow = true;
  columnGroup.add(topFinial);

  // ---------------------------------------------------------------------------
  // 2. 12 Bespoke Fan-Shaped Solid American White Oak Treads (`outbuildings.barn.spiralStaircase.tread`)
  // ---------------------------------------------------------------------------
  const thetaStart = -Math.PI * 0.65;
  const thetaEnd = Math.PI * 0.96;
  const treadSweep = 0.42;
  const treadThickness = 0.036;

  const fanShape = new THREE.Shape();
  const halfSweep = treadSweep * 0.5;
  const arcSegs = 18;
  fanShape.moveTo(innerRadius * Math.cos(-halfSweep), -innerRadius * Math.sin(-halfSweep));
  fanShape.lineTo(outerRadius * Math.cos(-halfSweep), -outerRadius * Math.sin(-halfSweep));
  for (let s = 1; s <= arcSegs; s++) {
    const a = -halfSweep + (s / arcSegs) * treadSweep;
    fanShape.lineTo(outerRadius * Math.cos(a), -outerRadius * Math.sin(a));
  }
  fanShape.lineTo(innerRadius * Math.cos(halfSweep), -innerRadius * Math.sin(halfSweep));
  for (let s = arcSegs - 1; s >= 0; s--) {
    const a = -halfSweep + (s / arcSegs) * treadSweep;
    fanShape.lineTo(innerRadius * Math.cos(a), -innerRadius * Math.sin(a));
  }
  fanShape.closePath();

  const treadGeo = new THREE.ExtrudeGeometry(fanShape, {
    depth: treadThickness,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 3,
  });
  treadGeo.rotateX(-Math.PI / 2);

  for (let i = 0; i < numSteps; i++) {
    const frac = i / (numSteps - 1);
    const theta = thetaStart + frac * (thetaEnd - thetaStart);
    const treadTopY = (i + 1) * riserH;
    const treadBaseY = treadTopY - treadThickness;

    const stepContainer = new THREE.Group();
    stepContainer.position.set(0, treadBaseY, 0);
    stepContainer.rotation.y = -theta;
    stairGroup.add(stepContainer);

    const treadMesh = new THREE.Mesh(treadGeo, oakTreadMat);
    treadMesh.name = 'outbuildings.barn.spiralStaircase.tread';
    treadMesh.castShadow = true;
    treadMesh.receiveShadow = true;
    stepContainer.add(treadMesh);

    const spineBracket = new THREE.Mesh(
      new THREE.BoxGeometry(outerRadius - columnRadius - 0.08, 0.044, 0.052),
      oakHandrailMat
    );
    spineBracket.position.set(
      columnRadius + (outerRadius - columnRadius - 0.08) * 0.5,
      -0.022,
      0
    );
    spineBracket.castShadow = true;
    stepContainer.add(spineBracket);
  }

  // ---------------------------------------------------------------------------
  // 3. Custom Solid Oak Quadrant Top Landing Platform (`outbuildings.barn.spiralStaircase.topLanding`)
  // ---------------------------------------------------------------------------
  const landingShape = new THREE.Shape();
  landingShape.moveTo(-columnRadius, -0.06);
  landingShape.lineTo(-outerRadius, -0.45);
  landingShape.lineTo(-0.94, -0.45);
  landingShape.lineTo(-0.94, 0.94);
  landingShape.lineTo(-0.08, 0.94);
  landingShape.lineTo(-columnRadius * 0.7, columnRadius * 0.7);
  landingShape.closePath();

  const landingDepth = 0.044;
  const landingGeo = new THREE.ExtrudeGeometry(landingShape, {
    depth: landingDepth,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 3,
  });
  landingGeo.rotateX(-Math.PI / 2);

  const topLandingMesh = new THREE.Mesh(landingGeo, oakTreadMat);
  topLandingMesh.name = 'outbuildings.barn.spiralStaircase.topLanding';
  topLandingMesh.position.set(0, totalRise - landingDepth, 0);
  topLandingMesh.castShadow = true;
  topLandingMesh.receiveShadow = true;
  stairGroup.add(topLandingMesh);

  const landingApron = new THREE.Mesh(
    new THREE.BoxGeometry(0.86, 0.11, 0.028),
    oakHandrailMat
  );
  landingApron.position.set(-0.48, totalRise - 0.065, 0.22);
  landingApron.rotation.y = -0.46;
  stairGroup.add(landingApron);

  // ---------------------------------------------------------------------------
  // 4. Curved Helical Laminated Solid-Oak Outer Stringer Ribbon (`outbuildings.barn.spiralStaircase.outerStringer`)
  // ---------------------------------------------------------------------------
  const stringerGroup = new THREE.Group();
  stringerGroup.name = 'outbuildings.barn.spiralStaircase.outerStringer';
  stairGroup.add(stringerGroup);

  const stringerRadius = outerRadius - 0.006;
  const stringerThetaMin = thetaStart - halfSweep * 0.85;
  const stringerThetaMax = thetaEnd + halfSweep * 0.55;
  const stringerSegs = 64;
  const stringerHalfH = 0.115;
  const stringerThickR = 0.028;

  const strPositions: number[] = [];
  const strNormals: number[] = [];
  const strUvs: number[] = [];
  const strIndices: number[] = [];

  const pushQuad = (
    p0: readonly [number, number, number],
    p1: readonly [number, number, number],
    p2: readonly [number, number, number],
    p3: readonly [number, number, number],
    nx: number,
    ny: number,
    nz: number,
    u0: number,
    u1: number
  ): void => {
    const base = strPositions.length / 3;
    strPositions.push(
      p0[0], p0[1], p0[2],
      p1[0], p1[1], p1[2],
      p2[0], p2[1], p2[2],
      p3[0], p3[1], p3[2]
    );
    for (let k = 0; k < 4; k++) {
      strNormals.push(nx, ny, nz);
    }
    strUvs.push(u0, 0, u1, 0, u1, 1, u0, 1);
    strIndices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };

  const rIn = stringerRadius - stringerThickR * 0.5;
  const rOut = stringerRadius + stringerThickR * 0.5;
  const yStringerStart = riserH * 0.65;
  const yStringerEnd = totalRise - 0.02;

  for (let s = 0; s < stringerSegs; s++) {
    const t0 = s / stringerSegs;
    const t1 = (s + 1) / stringerSegs;
    const a0 = stringerThetaMin + t0 * (stringerThetaMax - stringerThetaMin);
    const a1 = stringerThetaMin + t1 * (stringerThetaMax - stringerThetaMin);
    const yc0 = yStringerStart + t0 * (yStringerEnd - yStringerStart);
    const yc1 = yStringerStart + t1 * (yStringerEnd - yStringerStart);

    const c0 = Math.cos(a0);
    const s0 = Math.sin(a0);
    const c1 = Math.cos(a1);
    const s1 = Math.sin(a1);
    const cm = Math.cos((a0 + a1) * 0.5);
    const sm = Math.sin((a0 + a1) * 0.5);

    const outBot0: [number, number, number] = [rOut * c0, yc0 - stringerHalfH, rOut * s0];
    const outBot1: [number, number, number] = [rOut * c1, yc1 - stringerHalfH, rOut * s1];
    const outTop1: [number, number, number] = [rOut * c1, yc1 + stringerHalfH, rOut * s1];
    const outTop0: [number, number, number] = [rOut * c0, yc0 + stringerHalfH, rOut * s0];

    const inBot0: [number, number, number] = [rIn * c0, yc0 - stringerHalfH, rIn * s0];
    const inBot1: [number, number, number] = [rIn * c1, yc1 - stringerHalfH, rIn * s1];
    const inTop1: [number, number, number] = [rIn * c1, yc1 + stringerHalfH, rIn * s1];
    const inTop0: [number, number, number] = [rIn * c0, yc0 + stringerHalfH, rIn * s0];

    pushQuad(outBot0, outBot1, outTop1, outTop0, cm, 0, sm, t0 * 6, t1 * 6);
    pushQuad(inBot1, inBot0, inTop0, inTop1, -cm, 0, -sm, t0 * 6, t1 * 6);
    pushQuad(inTop0, outTop0, outTop1, inTop1, 0, 1, 0, t0 * 6, t1 * 6);
    pushQuad(outBot0, inBot0, inBot1, outBot1, 0, -1, 0, t0 * 6, t1 * 6);
  }

  const stringerRibbonGeo = new THREE.BufferGeometry();
  stringerRibbonGeo.setAttribute('position', new THREE.Float32BufferAttribute(strPositions, 3));
  stringerRibbonGeo.setAttribute('normal', new THREE.Float32BufferAttribute(strNormals, 3));
  stringerRibbonGeo.setAttribute('uv', new THREE.Float32BufferAttribute(strUvs, 2));
  stringerRibbonGeo.setIndex(strIndices);

  const stringerRibbonMesh = new THREE.Mesh(stringerRibbonGeo, oakHandrailMat);
  stringerRibbonMesh.name = 'outbuildings.barn.spiralStaircase.outerStringer';
  stringerRibbonMesh.castShadow = true;
  stringerRibbonMesh.receiveShadow = true;
  stringerGroup.add(stringerRibbonMesh);

  for (const yOffset of [-stringerHalfH, stringerHalfH] as const) {
    const beadPts: THREE.Vector3[] = [];
    for (let s = 0; s <= 40; s++) {
      const t = s / 40;
      const a = stringerThetaMin + t * (stringerThetaMax - stringerThetaMin);
      const yc = yStringerStart + t * (yStringerEnd - yStringerStart) + yOffset;
      beadPts.push(new THREE.Vector3(rOut * Math.cos(a), yc, rOut * Math.sin(a)));
    }
    const beadCurve = new THREE.CatmullRomCurve3(beadPts);
    const beadMesh = new THREE.Mesh(
      new THREE.TubeGeometry(beadCurve, 56, 0.011, 10, false),
      oakHandrailMat
    );
    beadMesh.name = 'outbuildings.barn.spiralStaircase.outerStringer';
    stringerGroup.add(beadMesh);
  }

  // ---------------------------------------------------------------------------
  // 5. Continuous Helical Solid American White Oak Handrail (`outbuildings.barn.spiralStaircase.handrail`)
  //    & Curved Toughened Glass Banister Panels (`outbuildings.barn.spiralStaircase.glassBanister` — Issue #3!)
  // ---------------------------------------------------------------------------
  const glassBanisterMat = new THREE.MeshStandardMaterial({
    color: 0xd8eef5,
    roughness: 0.06,
    metalness: 0.12,
    transparent: true,
    opacity: 0.34,
    side: THREE.DoubleSide,
  });
  const glassEdgeTintMat = new THREE.MeshStandardMaterial({
    color: 0x8fd4c1,
    roughness: 0.14,
    metalness: 0.18,
    transparent: true,
    opacity: 0.62,
  });
  const stainlessClampMat = new THREE.MeshStandardMaterial({
    color: 0xd8dde4,
    roughness: 0.2,
    metalness: 0.9,
  });

  const handrailRadius = 0.835;
  const handrailHeightAboveTread = 0.94;
  const handrailCurvePoints: THREE.Vector3[] = [];

  const voluteCenterTheta = thetaStart - 0.11;
  const voluteCenterR = handrailRadius - 0.065;
  const voluteY = riserH + handrailHeightAboveTread - 0.04;
  const voluteCenterX = voluteCenterR * Math.cos(voluteCenterTheta);
  const voluteCenterZ = voluteCenterR * Math.sin(voluteCenterTheta);

  for (let v = 0; v < 6; v++) {
    const vt = v / 5;
    const spiralAng = voluteCenterTheta + Math.PI * 1.35 * (1 - vt);
    const spiralR = 0.018 + vt * 0.062;
    handrailCurvePoints.push(
      new THREE.Vector3(
        voluteCenterX + spiralR * Math.cos(spiralAng),
        voluteY - (1 - vt) * 0.015,
        voluteCenterZ + spiralR * Math.sin(spiralAng)
      )
    );
  }

  const climbSamples = 32;
  for (let k = 0; k <= climbSamples; k++) {
    const t = k / climbSamples;
    const a = thetaStart + t * (thetaEnd - thetaStart);
    const treadY = riserH + t * (totalRise - riserH);
    handrailCurvePoints.push(
      new THREE.Vector3(
        handrailRadius * Math.cos(a),
        treadY + handrailHeightAboveTread,
        handrailRadius * Math.sin(a)
      )
    );
  }

  handrailCurvePoints.push(
    new THREE.Vector3(-0.88, totalRise + 0.96, 0.34),
    new THREE.Vector3(-0.92, totalRise + 0.96, 0.44)
  );

  const handrailCurve = new THREE.CatmullRomCurve3(handrailCurvePoints);
  const handrailTubeGeo = new THREE.TubeGeometry(handrailCurve, 120, 0.028, 16, false);
  const handrailMesh = new THREE.Mesh(handrailTubeGeo, oakHandrailMat);
  handrailMesh.name = 'outbuildings.barn.spiralStaircase.handrail';
  handrailMesh.castShadow = true;
  handrailMesh.receiveShadow = true;
  stairGroup.add(handrailMesh);

  const voluteEyeCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.038, 0.034, 0.048, 20),
    oakHandrailMat
  );
  voluteEyeCap.name = 'outbuildings.barn.spiralStaircase.handrail';
  voluteEyeCap.position.set(voluteCenterX, voluteY - 0.008, voluteCenterZ);
  voluteEyeCap.castShadow = true;
  stairGroup.add(voluteEyeCap);

  const bottomNewelBaseY = riserH * 0.85;
  const bottomNewelH = voluteY - bottomNewelBaseY;
  const bottomNewel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.042, bottomNewelH, 20),
    oakHandrailMat
  );
  bottomNewel.name = 'outbuildings.barn.spiralStaircase.newelPost';
  bottomNewel.position.set(
    voluteCenterX,
    bottomNewelBaseY + bottomNewelH * 0.5,
    voluteCenterZ
  );
  bottomNewel.castShadow = true;
  stairGroup.add(bottomNewel);

  const topNewelH = 1.02;
  const topNewel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.044, topNewelH, 20),
    oakHandrailMat
  );
  topNewel.name = 'outbuildings.barn.spiralStaircase.newelPost';
  topNewel.position.set(-0.92, totalRise + topNewelH * 0.5 - 0.02, 0.44);
  topNewel.castShadow = true;
  stairGroup.add(topNewel);

  const topNewelCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.048, 18, 14),
    oakHandrailMat
  );
  topNewelCap.position.set(-0.92, totalRise + topNewelH + 0.015, 0.44);
  stairGroup.add(topNewelCap);

  // Issue #3 ("Glass banniesters (see the link I sent)" at `[0.916, 0.734, 19.272]`):
  // Build 6 Curved Helical Toughened Clear Glass Balustrade Panels (`outbuildings.barn.spiralStaircase.glassBanister`)
  // rising from the outer oak stringer/treads (`r = handrailRadius = 0.835m`) up into the underside of the helical
  // solid American white oak handrail, secured with brushed stainless-steel cylindrical glass stand-off clamps (`glassClamp`)!
  const numGlassPanels = 6;
  const panelGapRad = 0.018;
  const totalThetaSpan = thetaEnd - thetaStart;
  const glassThickR = 0.014;
  const gRIn = handrailRadius - glassThickR * 0.5;
  const gROut = handrailRadius + glassThickR * 0.5;

  for (let p = 0; p < numGlassPanels; p++) {
    const tPanel0 = p / numGlassPanels;
    const tPanel1 = (p + 1) / numGlassPanels;
    const aPanelStart = thetaStart + tPanel0 * totalThetaSpan + panelGapRad * 0.5;
    const aPanelEnd = thetaStart + tPanel1 * totalThetaSpan - panelGapRad * 0.5;

    const panelSegs = 16;
    const gPositions: number[] = [];
    const gNormals: number[] = [];
    const gUvs: number[] = [];
    const gIndices: number[] = [];

    const pushGlassQuad = (
      p0: readonly [number, number, number],
      p1: readonly [number, number, number],
      p2: readonly [number, number, number],
      p3: readonly [number, number, number],
      nx: number,
      ny: number,
      nz: number,
      u0: number,
      u1: number
    ): void => {
      const base = gPositions.length / 3;
      gPositions.push(
        p0[0], p0[1], p0[2],
        p1[0], p1[1], p1[2],
        p2[0], p2[1], p2[2],
        p3[0], p3[1], p3[2]
      );
      for (let k = 0; k < 4; k++) {
        gNormals.push(nx, ny, nz);
      }
      gUvs.push(u0, 0, u1, 0, u1, 1, u0, 1);
      gIndices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    };

    for (let s = 0; s < panelSegs; s++) {
      const s0 = s / panelSegs;
      const s1 = (s + 1) / panelSegs;
      const a0 = aPanelStart + s0 * (aPanelEnd - aPanelStart);
      const a1 = aPanelStart + s1 * (aPanelEnd - aPanelStart);
      const gt0 = (a0 - thetaStart) / totalThetaSpan;
      const gt1 = (a1 - thetaStart) / totalThetaSpan;

      const yBot0 = riserH * 0.72 + gt0 * (totalRise - riserH * 0.72) + 0.04;
      const yBot1 = riserH * 0.72 + gt1 * (totalRise - riserH * 0.72) + 0.04;
      const yTop0 = riserH + gt0 * (totalRise - riserH) + handrailHeightAboveTread - 0.022;
      const yTop1 = riserH + gt1 * (totalRise - riserH) + handrailHeightAboveTread - 0.022;

      const c0 = Math.cos(a0);
      const sn0 = Math.sin(a0);
      const c1 = Math.cos(a1);
      const sn1 = Math.sin(a1);
      const cm = Math.cos((a0 + a1) * 0.5);
      const snm = Math.sin((a0 + a1) * 0.5);

      const outBot0: [number, number, number] = [gROut * c0, yBot0, gROut * sn0];
      const outBot1: [number, number, number] = [gROut * c1, yBot1, gROut * sn1];
      const outTop1: [number, number, number] = [gROut * c1, yTop1, gROut * sn1];
      const outTop0: [number, number, number] = [gROut * c0, yTop0, gROut * sn0];

      const inBot0: [number, number, number] = [gRIn * c0, yBot0, gRIn * sn0];
      const inBot1: [number, number, number] = [gRIn * c1, yBot1, gRIn * sn1];
      const inTop1: [number, number, number] = [gRIn * c1, yTop1, gRIn * sn1];
      const inTop0: [number, number, number] = [gRIn * c0, yTop0, gRIn * sn0];

      pushGlassQuad(outBot0, outBot1, outTop1, outTop0, cm, 0, snm, s0, s1);
      pushGlassQuad(inBot1, inBot0, inTop0, inTop1, -cm, 0, -snm, s0, s1);
      pushGlassQuad(inTop0, outTop0, outTop1, inTop1, 0, 1, 0, s0, s1);
      pushGlassQuad(outBot0, inBot0, inBot1, outBot1, 0, -1, 0, s0, s1);
    }

    const glassGeo = new THREE.BufferGeometry();
    glassGeo.setAttribute('position', new THREE.Float32BufferAttribute(gPositions, 3));
    glassGeo.setAttribute('normal', new THREE.Float32BufferAttribute(gNormals, 3));
    glassGeo.setAttribute('uv', new THREE.Float32BufferAttribute(gUvs, 2));
    glassGeo.setIndex(gIndices);

    const glassPanelMesh = new THREE.Mesh(glassGeo, glassBanisterMat);
    glassPanelMesh.name = 'outbuildings.barn.spiralStaircase.glassBanister';
    stairGroup.add(glassPanelMesh);

    // Polished green-tinted vertical toughened glass edge strips at start and end of each curved glass panel
    for (const edgeAng of [aPanelStart, aPanelEnd] as const) {
      const gt = (edgeAng - thetaStart) / totalThetaSpan;
      const yBot = riserH * 0.72 + gt * (totalRise - riserH * 0.72) + 0.04;
      const yTop = riserH + gt * (totalRise - riserH) + handrailHeightAboveTread - 0.022;
      const edgeH = yTop - yBot;
      const edgeStrip = new THREE.Mesh(
        new THREE.BoxGeometry(glassThickR, edgeH, 0.005),
        glassEdgeTintMat
      );
      edgeStrip.position.set(
        handrailRadius * Math.cos(edgeAng),
        yBot + edgeH * 0.5,
        handrailRadius * Math.sin(edgeAng)
      );
      edgeStrip.rotation.y = -edgeAng;
      stairGroup.add(edgeStrip);
    }

    // 4 Brushed Stainless-Steel Cylindrical Glass Stand-Off Spigot Clamps per curved glass panel (2 bottom stringer + 2 top handrail)
    for (const clampFrac of [0.18, 0.82] as const) {
      const ca = aPanelStart + clampFrac * (aPanelEnd - aPanelStart);
      const gt = (ca - thetaStart) / totalThetaSpan;
      const yBotClamp = riserH * 0.72 + gt * (totalRise - riserH * 0.72) + 0.075;
      const yTopClamp = riserH + gt * (totalRise - riserH) + handrailHeightAboveTread - 0.065;

      for (const cy of [yBotClamp, yTopClamp] as const) {
        const clampMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.016, 0.016, 0.036, 14),
          stainlessClampMat
        );
        clampMesh.name = 'outbuildings.barn.spiralStaircase.glassClamp';
        clampMesh.position.set(
          handrailRadius * Math.cos(ca),
          cy,
          handrailRadius * Math.sin(ca)
        );
        clampMesh.rotation.z = Math.PI / 2;
        clampMesh.rotation.y = -ca;
        stairGroup.add(clampMesh);
      }
    }
  }

  // Top landing return glass banister panel bridging from the spiral curve end to the top landing newel post (`z = 0.06..0.42m`)
  const topReturnGlass = new THREE.Mesh(
    new THREE.BoxGeometry(glassThickR, 0.84, 0.36),
    glassBanisterMat
  );
  topReturnGlass.name = 'outbuildings.barn.spiralStaircase.glassBanister';
  topReturnGlass.position.set(-0.88, totalRise + 0.48, 0.24);
  topReturnGlass.rotation.y = -0.14;
  stairGroup.add(topReturnGlass);
}

/**
 * Issue #9 ("Better texture on the astroturf" at `[-6.711, -0.306, 16.014]`, `outbuildings.barn.golfSimulator.turfMat`):
 * Generates rich, high-resolution (`1024x1024`) procedural **Synthetic Golf Astroturf & Putting Green Turf Textures**:
 * - Dense multi-directional micro-blade thatch noise (thousands of short crisp grass-blade strokes in layered
 *   emerald `#1f592c`, lush turf green `#276b36`, deep root shadow `#143d1d`, and sunlit tip highlights `#388246`),
 * - Subtle cross-mowed fairway stripes & putting apron fringe collar border around the perimeter,
 * - Subtle inlaid white putting alignment line & cup target ring toward the screen,
 * - Matching high-frequency fiber-pile `bumpMap` (`bumpScale: 0.018`) so the astroturf catches the overhead spotlights
 *   with realistic short-pile synthetic turf texture.
 */
function createGolfAstroturfTextures(): {
  fairwayMap: THREE.CanvasTexture;
  hittingMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
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

  return { fairwayMap, hittingMap, bumpMap };
}

/**
 * Issue #6 ("When in cutaway mode hide the top of the mezzanine / ceiling when looking at the ground floor"),
 * Issue #9 ("Better texture on the astroturf" at `[-6.711, -0.306, 16.014]`, `outbuildings.barn.golfSimulator.turfMat`), &
 * Issue #10 (Pin on top of `outbuildings.barn.golfSimulator` at `[-8.437, 2.56, 15.397]`):
 * Builds a Widescreen (`4.48m` wide x `2.80m` tall, `16:10` Widescreen aspect ratio) **TrackMan iO**
 * Indoor Golf Simulator Bay (`outbuildings.barn.golfSimulator`) cut into the Store/Barn cross-wall
 * (`u = 14.96..15.20m, v = 0.615..5.095m`) and backing **`2.16m`** into the Store room (`u = 13.04..15.20m`), complete with:
 * - Dedicated ceiling sub-group (`outbuildings.barn.golfSimulator.ceiling`) attached to `groundCeilingGroup ?? groundGroup`
 *   containing `storeRoofLid` and the ceiling acoustic baffles (`ceilBaffle`) so they hide automatically in Ground-Floor Cutaway mode!
 * - High-resolution procedural Synthetic Golf Astroturf & Putting Green textures (`createGolfAstroturfTextures()`) with
 *   fiber-pile bump mapping (`bumpScale: 0.018`) on `outbuildings.barn.golfSimulator.turfMat` and `outbuildings.barn.golfSimulator.hittingStrip`.
 */
export function buildBarnGolfSimulator(
  groundGroup: THREE.Group,
  arg2: number,
  arg3: number,
  arg4?: number | THREE.Group,
  arg5?: THREE.Material | THREE.Group,
  arg6?: THREE.Group
): void {
  const isFiveArgCall = typeof arg4 === 'number';
  const uWallMin = isFiveArgCall ? arg2 : 14.96;
  const uWallMax = isFiveArgCall ? arg3 : 15.2;
  const barnWestFloorY = isFiveArgCall ? arg4 : -0.34;
  const plasterMat: THREE.Material =
    isFiveArgCall && arg5 instanceof THREE.Material
      ? arg5
      : new THREE.MeshStandardMaterial({
          color: 0xf2ede2,
          roughness: 0.86,
          metalness: 0.02,
        });
  const groundCeilingGroup: THREE.Group | undefined =
    arg6 ??
    (arg4 instanceof THREE.Group ? arg4 : undefined) ??
    (arg5 instanceof THREE.Group ? arg5 : undefined);

  const simGroup = new THREE.Group();
  simGroup.name = 'outbuildings.barn.golfSimulator';
  simGroup.position.set(uWallMax, barnWestFloorY, 2.855);
  groundGroup.add(simGroup);

  const simCeilingGroup = new THREE.Group();
  simCeilingGroup.name = 'outbuildings.barn.golfSimulator.ceiling';
  simCeilingGroup.position.set(uWallMax, barnWestFloorY, 2.855);
  (groundCeilingGroup ?? groundGroup).add(simCeilingGroup);

  const clearW = 4.48;
  const clearH = 2.8;
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
  const impactScreenMat = new THREE.MeshStandardMaterial({
    map: screenTex,
    emissiveMap: screenTex,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.44,
    roughness: 0.65,
    metalness: 0.02,
  });
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
  const storeBackWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, clearH + 0.1, clearW + 0.18),
    plasterMat
  );
  storeBackWall.userData.isArchitecturalShell = true;
  storeBackWall.position.set(-recessDepthU - 0.045, (clearH + 0.1) * 0.5, 0);
  storeBackWall.castShadow = true;
  storeBackWall.receiveShadow = true;
  simGroup.add(storeBackWall);

  for (const sideZ of [-1, 1] as const) {
    const storeSideWall = new THREE.Mesh(
      new THREE.BoxGeometry(storeBoxDepth, clearH + 0.1, 0.09),
      plasterMat
    );
    storeSideWall.userData.isArchitecturalShell = true;
    storeSideWall.position.set(
      -wallT - storeBoxDepth * 0.5,
      (clearH + 0.1) * 0.5,
      sideZ * (clearW * 0.5 + 0.045)
    );
    storeSideWall.castShadow = true;
    storeSideWall.receiveShadow = true;
    simGroup.add(storeSideWall);
  }

  const storeRoofLid = new THREE.Mesh(
    new THREE.BoxGeometry(storeBoxDepth + 0.09, 0.09, clearW + 0.18),
    plasterMat
  );
  storeRoofLid.name = 'outbuildings.barn.golfSimulator.roofLid';
  storeRoofLid.userData.isArchitecturalShell = true;
  storeRoofLid.position.set(-wallT - (storeBoxDepth + 0.09) * 0.5, clearH + 0.055, 0);
  simCeilingGroup.add(storeRoofLid);

  const numBaffleCols = 6;
  const baffleColW = recessDepthU / numBaffleCols;
  for (let c = 0; c < numBaffleCols; c++) {
    const bx = -recessDepthU + (c + 0.5) * baffleColW;

    for (const sideZ of [-1, 1] as const) {
      const sideBaffle = new THREE.Mesh(
        new THREE.BoxGeometry(baffleColW - 0.015, clearH - 0.04, 0.055),
        acousticBaffleMat
      );
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
  for (const sideZ of [-1, 1] as const) {
    const sideTrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, clearH + frameTrimW, frameTrimW),
      velvetFrameMat
    );
    sideTrim.position.set(0.01, (clearH + frameTrimW) * 0.5, sideZ * (clearW * 0.5 + frameTrimW * 0.3));
    simGroup.add(sideTrim);
  }
  const topTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, frameTrimW, clearW + frameTrimW * 1.6),
    velvetFrameMat
  );
  topTrim.position.set(0.01, clearH + frameTrimW * 0.3, 0);
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
  screenBacking.rotation.y = -Math.PI / 2;
  screenBacking.position.set(-recessDepthU + 0.12, clearH * 0.5, 0);
  simGroup.add(screenBacking);

  const turfStartX = -recessDepthU + 0.12;
  const turfEndX = 1.82;
  const totalTurfLenX = turfEndX - turfStartX;
  const turfCenterX = (turfStartX + turfEndX) * 0.5;

  const surroundBase = new THREE.Mesh(
    new THREE.BoxGeometry(totalTurfLenX + 0.08, 0.028, clearW),
    stanceSurroundMat
  );
  surroundBase.position.set(turfCenterX, 0.014, 0);
  surroundBase.receiveShadow = true;
  simGroup.add(surroundBase);

  const fairwayTurf = new THREE.Mesh(
    new THREE.BoxGeometry(totalTurfLenX, 0.034, clearW - 0.08),
    fairwayTurfMat
  );
  fairwayTurf.name = 'outbuildings.barn.golfSimulator.turfMat';
  fairwayTurf.position.set(turfCenterX, 0.017, 0);
  fairwayTurf.receiveShadow = true;
  simGroup.add(fairwayTurf);

  for (const [cupX, cupZ] of [
    [-0.35, -0.95],
    [-0.35, 0.95],
  ] as const) {
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.054, 0.054, 0.036, 16),
      velvetFrameMat
    );
    cup.position.set(cupX, 0.019, cupZ);
    simGroup.add(cup);
  }

  const hittingX = 1.12;
  const hittingStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.038, 1.04),
    hittingStripMat
  );
  hittingStrip.name = 'outbuildings.barn.golfSimulator.hittingStrip';
  hittingStrip.position.set(hittingX, 0.02, 0);
  hittingStrip.receiveShadow = true;
  simGroup.add(hittingStrip);

  const rubberTee = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.016, 0.042, 10),
    golfBallMat
  );
  rubberTee.position.set(hittingX, 0.048, 0);
  simGroup.add(rubberTee);

  const teedBall = new THREE.Mesh(
    new THREE.SphereGeometry(0.0213, 14, 12),
    golfBallMat
  );
  teedBall.position.set(hittingX, 0.088, 0);
  teedBall.castShadow = true;
  simGroup.add(teedBall);

  const ballTray = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.028, 0.42),
    stanceSurroundMat
  );
  ballTray.position.set(hittingX, 0.044, -0.78);
  simGroup.add(ballTray);

  for (let b = 0; b < 5; b++) {
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.0213, 12, 10),
      golfBallMat
    );
    ball.position.set(hittingX, 0.068, -0.92 + b * 0.07);
    simGroup.add(ball);
  }

  const projectorGroup = new THREE.Group();
  projectorGroup.name = 'outbuildings.barn.golfSimulator.projector';
  projectorGroup.position.set(0.28, 2.74, 0);
  simCeilingGroup.add(projectorGroup);

  const dropPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 1.68, 12),
    projectorBodyMat
  );
  dropPole.position.set(0, 0.84, 0);
  projectorGroup.add(dropPole);

  const projectorChassis = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.14, 0.44),
    projectorBodyMat
  );
  projectorChassis.rotation.z = 0.18;
  projectorChassis.castShadow = true;
  projectorGroup.add(projectorChassis);

  const lensMat = new THREE.MeshStandardMaterial({
    color: 0xe0f7fa,
    emissive: new THREE.Color(0x90caf9),
    emissiveIntensity: 1.8,
    roughness: 0.12,
  });
  const projectorLens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.044, 0.044, 0.03, 16),
    lensMat
  );
  projectorLens.rotation.z = Math.PI / 2 + 0.18;
  projectorLens.position.set(-0.195, -0.025, 0);
  projectorGroup.add(projectorLens);

  const tmGroup = new THREE.Group();
  tmGroup.name = 'outbuildings.barn.golfSimulator.trackmanIO';
  tmGroup.position.set(0.92, 2.98, 0);
  simCeilingGroup.add(tmGroup);

  const tmDropTube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 1.44, 12),
    projectorBodyMat
  );
  tmDropTube.position.set(0, 0.72, 0);
  tmGroup.add(tmDropTube);

  const tmCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.26, 0.072, 0.34),
    projectorBodyMat
  );
  tmCore.rotation.z = -0.18;
  tmCore.castShadow = true;
  tmGroup.add(tmCore);

  for (const sideZ of [-1, 1] as const) {
    const tmWing = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.058, 0.16),
      projectorBodyMat
    );
    tmWing.position.set(0.01, -0.004, sideZ * 0.22);
    tmWing.rotation.z = -0.18;
    tmWing.rotation.y = -sideZ * 0.16;
    tmWing.castShadow = true;
    tmGroup.add(tmWing);

    const camGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.026, 0.012, 14),
      velvetFrameMat
    );
    camGlass.position.set(0.02, -0.036, sideZ * 0.2);
    tmGroup.add(camGlass);
  }

  const tmOrangeAccent = new THREE.Mesh(
    new THREE.BoxGeometry(0.268, 0.016, 0.56),
    trackManOrangeMat
  );
  tmOrangeAccent.position.set(0, 0.028, 0);
  tmOrangeAccent.rotation.z = -0.18;
  tmGroup.add(tmOrangeAccent);
}

/**
 * Generates a crisp STIHL orange-and-black brand badge texture (`#f37021` & `#141619`).
 */
function createStihlBadgeTexture(): THREE.CanvasTexture {
  const w = 256;
  const h = 96;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f37021';
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(10, 10, w - 20, h - 20);

  ctx.fillStyle = '#141619';
  ctx.font = 'italic 900 48px Impact, Arial Black, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('STIHL', w * 0.5, h * 0.5 + 3);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates a realistic STIHL Rollomatic ES Light guide bar texture (`#e4e8ec`)
 * with dark grey edge rails, orange stripe accents, and stencilled `STIHL` lettering.
 */
function createStihlGuideBarTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#dfe4ea');
  grad.addColorStop(0.5, '#eef2f6');
  grad.addColorStop(1, '#d2d8e0');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Hardened steel guide-bar perimeter rail border
  ctx.strokeStyle = '#4a525d';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, w - 10, h - 10);

  // Signature STIHL orange & black graphic stripes on the guide bar
  ctx.fillStyle = '#f37021';
  ctx.fillRect(42, 22, w - 96, 12);
  ctx.fillStyle = '#181a1e';
  ctx.fillRect(42, h - 34, w - 96, 10);

  ctx.fillStyle = '#181a1e';
  ctx.font = 'italic 900 44px Impact, Arial Black, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('STIHL', w * 0.48, h * 0.52);

  // Sprocket nose rivet dots
  ctx.fillStyle = '#5a626e';
  for (const [rx, ry] of [
    [w - 48, 34],
    [w - 30, 52],
    [w - 30, 76],
    [w - 48, 94],
  ] as const) {
    ctx.beginPath();
    ctx.arc(rx, ry, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Issue #6 (Pin at `[-12.462, -0.5, 19.84]` in front of the Garage South Wall) &
 * Issue #7 ("Stihl chainsaws / hedgetrimmers on the wall here" at `[-11.233, 0.427, 20.485]`,
 * Garage South Wall at `u = 10.81m, y = 0.427m, v = 5.43m`):
 * Mounts a high-LOD **STIHL Forestry & Groundskeeping Wall Storage Rack (`outbuildings.garage.stihlWallRack`)**
 * on the interior North face of the Garage South Wall (`v = 5.41m`, centered at `u = 10.25m` spanning `u = 8.95..11.55m`),
 * featuring:
 * - Powder-coated anthracite steel slotted wall rail system & STIHL orange rubber-coated wall cradle brackets
 * - **STIHL MS 500i 20" Petrol Forestry Chainsaw** (`outbuildings.garage.stihlWallRack.chainsawMS500i`)
 * - **STIHL MSA 220 C-B 14" Cordless Chainsaw** (`outbuildings.garage.stihlWallRack.chainsawMSA220`)
 * - **STIHL HS 82 R 30" Professional Petrol Hedge Trimmer** (`outbuildings.garage.stihlWallRack.hedgeTrimmerHS82`)
 * - **STIHL HLA 86 Long-Reach Telescopic Pole Hedge Trimmer** (`outbuildings.garage.stihlWallRack.poleHedgeTrimmerHLA86`)
 * - **STIHL BGA 200 Cordless Leaf Blower** (`outbuildings.garage.stihlWallRack.leafBlowerBGA200`)
 * - **Upper Shelf with STIHL AL 500 Dual Battery Charger, 2 STIHL AP 300 S Batteries, STIHL Forestry Helmet & Visor, and MotoMix Combi Can**
 */
export function buildGarageStihlWallRack(
  groundGroup: THREE.Group,
  garageFloorTopY: number
): void {
  const rackGroup = new THREE.Group();
  rackGroup.name = 'outbuildings.garage.stihlWallRack';
  // Mounted on the North face (`-v`) of the Garage South Wall (`v = 5.428m`), centered at `u = 10.25m`.
  // With `rotation.y = Math.PI`, local `+Z` protrudes North (`-v`) into the Garage and local `+X` runs West (`-u`).
  rackGroup.position.set(10.25, garageFloorTopY, 5.415);
  rackGroup.rotation.y = Math.PI;
  groundGroup.add(rackGroup);

  const stihlOrangeMat = new THREE.MeshStandardMaterial({
    color: 0xf37021, // Authentic STIHL Orange
    roughness: 0.28,
    metalness: 0.12,
  });
  const stihlLightGreyMat = new THREE.MeshStandardMaterial({
    color: 0xdadfe5, // Authentic STIHL Light Grey magnesium/polymer crankcase housing
    roughness: 0.36,
    metalness: 0.18,
  });
  const stihlBlackMat = new THREE.MeshStandardMaterial({
    color: 0x191c20, // Matte black handles, shrouds & bumper spikes
    roughness: 0.68,
    metalness: 0.14,
  });
  const rackSteelMat = new THREE.MeshStandardMaterial({
    color: 0x242830, // Powder-coated anthracite wall rack steel
    roughness: 0.38,
    metalness: 0.72,
  });
  const bladeSteelMat = new THREE.MeshStandardMaterial({
    color: 0xcfd6df, // Hardened chrome-vanadium shear blades & saw chain teeth
    roughness: 0.22,
    metalness: 0.88,
  });
  const stihlBadgeMat = new THREE.MeshStandardMaterial({
    map: createStihlBadgeTexture(),
    roughness: 0.26,
    metalness: 0.12,
  });
  const guideBarMat = new THREE.MeshStandardMaterial({
    map: createStihlGuideBarTexture(),
    roughness: 0.28,
    metalness: 0.65,
  });
  const fuelTankMat = new THREE.MeshStandardMaterial({
    color: 0xf5f0e1,
    roughness: 0.32,
    metalness: 0.05,
    transparent: true,
    opacity: 0.84,
  });
  const greenLedMat = new THREE.MeshStandardMaterial({
    color: 0x00e676,
    emissive: new THREE.Color(0x00e676),
    emissiveIntensity: 2.0,
    roughness: 0.2,
  });
  const meshVisorMat = new THREE.MeshStandardMaterial({
    color: 0x1e2226,
    roughness: 0.55,
    metalness: 0.45,
    transparent: true,
    opacity: 0.82,
  });

  const rackW = 2.48; // Spans u = 9.01m .. 11.49m right across hit point u = 10.81m and pin u = 9.81m

  // ---------------------------------------------------------------------------
  // 1. Anthracite Steel Wall Mounting Rails, Perforated Backboard & Upper Accessory Shelf
  // ---------------------------------------------------------------------------
  const backboard = new THREE.Mesh(
    new THREE.BoxGeometry(rackW, 1.18, 0.016),
    rackSteelMat
  );
  backboard.position.set(0, 1.08, 0.008);
  backboard.castShadow = true;
  backboard.receiveShadow = true;
  rackGroup.add(backboard);

  // Signature STIHL orange top header stripe & brand sign plate across the top of the wall rack
  const headerStripe = new THREE.Mesh(
    new THREE.BoxGeometry(rackW, 0.055, 0.022),
    stihlOrangeMat
  );
  headerStripe.position.set(0, 1.64, 0.012);
  rackGroup.add(headerStripe);

  const headerSign = new THREE.Mesh(
    new THREE.PlaneGeometry(0.32, 0.11),
    stihlBadgeMat
  );
  headerSign.position.set(0, 1.64, 0.025);
  rackGroup.add(headerSign);

  // Horizontal heavy-duty steel mounting rails (`y = 0.62m, 1.02m, 1.42m`)
  for (const ry of [0.62, 1.02, 1.42] as const) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(rackW - 0.04, 0.042, 0.028),
      rackSteelMat
    );
    rail.position.set(0, ry, 0.022);
    rail.castShadow = true;
    rackGroup.add(rail);

    const orangeInlay = new THREE.Mesh(
      new THREE.BoxGeometry(rackW - 0.06, 0.01, 0.032),
      stihlOrangeMat
    );
    orangeInlay.position.set(0, ry, 0.023);
    rackGroup.add(orangeInlay);
  }

  // Vertical slotted stanchions
  for (const sx of [-1.16, -0.58, 0.0, 0.58, 1.16] as const) {
    const stanchion = new THREE.Mesh(
      new THREE.BoxGeometry(0.034, 1.14, 0.024),
      rackSteelMat
    );
    stanchion.position.set(sx, 1.06, 0.018);
    rackGroup.add(stanchion);
  }

  // ---------------------------------------------------------------------------
  // 2. Helper to build a High-LOD STIHL Chainsaw (`MS 500i` 20" & `MSA 220 C-B` 14")
  // ---------------------------------------------------------------------------
  const addStihlChainsaw = (
    name: string,
    mountX: number,
    mountY: number,
    barLen: number,
    isCordless: boolean
  ): void => {
    const sawGroup = new THREE.Group();
    sawGroup.name = name;
    sawGroup.position.set(mountX, mountY, 0.14);
    // Slight downward display presentation angle along the wall
    sawGroup.rotation.z = -0.08;
    rackGroup.add(sawGroup);

    // Wall cradle hook bracket holding the chainsaw rear handle & crankcase
    for (const hx of [-0.14, 0.06] as const) {
      const hookArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.024, 0.028, 0.16),
        stihlOrangeMat
      );
      hookArm.position.set(hx, -0.095, -0.06);
      sawGroup.add(hookArm);

      const hookTip = new THREE.Mesh(
        new THREE.BoxGeometry(0.024, 0.048, 0.022),
        stihlBlackMat
      );
      hookTip.position.set(hx, -0.075, 0.018);
      sawGroup.add(hookTip);
    }

    // Light-grey magnesium crankcase & clutch cover (`x = -0.14..+0.08m`)
    const crankcase = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.165, 0.155),
      stihlLightGreyMat
    );
    crankcase.position.set(-0.04, 0.0, 0);
    crankcase.castShadow = true;
    crankcase.receiveShadow = true;
    sawGroup.add(crankcase);

    // Signature STIHL Orange rounded top cylinder shroud / motor cowling
    const topShroud = new THREE.Mesh(
      new THREE.BoxGeometry(0.235, 0.115, 0.165),
      stihlOrangeMat
    );
    topShroud.position.set(-0.045, 0.095, 0);
    topShroud.castShadow = true;
    sawGroup.add(topShroud);

    const shroudCrown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.078, 0.082, 0.22, 16),
      stihlOrangeMat
    );
    shroudCrown.rotation.z = Math.PI / 2;
    shroudCrown.position.set(-0.045, 0.135, 0);
    shroudCrown.scale.set(1, 1, 0.65);
    sawGroup.add(shroudCrown);

    // Front STIHL badge plate on recoil starter / side cover
    const sideBadge = new THREE.Mesh(
      new THREE.PlaneGeometry(0.11, 0.042),
      stihlBadgeMat
    );
    sideBadge.position.set(-0.04, 0.03, 0.084);
    sawGroup.add(sideBadge);

    // Two captive stainless bar nuts on the sprocket cover
    for (const nx of [0.015, 0.052] as const) {
      const barNut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.011, 0.011, 0.018, 6),
        bladeSteelMat
      );
      barNut.rotation.x = Math.PI / 2;
      barNut.position.set(nx, -0.01, 0.082);
      sawGroup.add(barNut);
    }

    if (isCordless) {
      // STIHL AP 300 S Lithium-Ion Battery Pack slotted into the top-rear chamber with glowing green LEDs
      const apBattery = new THREE.Mesh(
        new THREE.BoxGeometry(0.095, 0.125, 0.115),
        stihlBlackMat
      );
      apBattery.position.set(-0.14, 0.06, 0);
      sawGroup.add(apBattery);

      const apOrangeCap = new THREE.Mesh(
        new THREE.BoxGeometry(0.092, 0.028, 0.112),
        stihlOrangeMat
      );
      apOrangeCap.position.set(-0.14, 0.13, 0);
      sawGroup.add(apOrangeCap);

      const ledBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.032, 0.008, 0.006),
        greenLedMat
      );
      ledBar.position.set(-0.14, 0.095, 0.058);
      sawGroup.add(ledBar);
    } else {
      // Translucent fuel tank window + toolless flip-up fuel & chain-oil caps + recoil starter T-handle
      const fuelWindow = new THREE.Mesh(
        new THREE.BoxGeometry(0.085, 0.075, 0.148),
        fuelTankMat
      );
      fuelWindow.position.set(-0.135, -0.035, 0);
      sawGroup.add(fuelWindow);

      for (const cy of [-0.02, 0.055] as const) {
        const flipCap = new THREE.Mesh(
          new THREE.CylinderGeometry(0.022, 0.022, 0.014, 14),
          stihlBlackMat
        );
        flipCap.rotation.x = Math.PI / 2;
        flipCap.position.set(-0.11, cy, 0.078);
        sawGroup.add(flipCap);

        const capOrangeHalf = new THREE.Mesh(
          new THREE.BoxGeometry(0.036, 0.014, 0.018),
          stihlOrangeMat
        );
        capOrangeHalf.position.set(-0.11, cy, 0.082);
        sawGroup.add(capOrangeHalf);
      }

      // ElastoStart recoil starter pull handle
      const pullGrip = new THREE.Mesh(
        new THREE.BoxGeometry(0.058, 0.022, 0.024),
        stihlBlackMat
      );
      pullGrip.position.set(-0.07, 0.09, 0.092);
      sawGroup.add(pullGrip);
    }

    // Rear Throttle Handle, Trigger, Orange Lockout Lever & Lower Hand Guard Loop (`x = -0.28..-0.14m`)
    const rearHandleTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.02, 0.16, 12),
      stihlBlackMat
    );
    rearHandleTop.rotation.z = Math.PI / 2 - 0.18;
    rearHandleTop.position.set(-0.21, 0.015, 0);
    rearHandleTop.castShadow = true;
    sawGroup.add(rearHandleTop);

    const rearTriggerOrange = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.018, 0.022),
      stihlOrangeMat
    );
    rearTriggerOrange.position.set(-0.19, -0.008, 0);
    sawGroup.add(rearTriggerOrange);

    const rearSkidBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.17, 0.024, 0.075),
      stihlLightGreyMat
    );
    rearSkidBase.position.set(-0.21, -0.072, 0);
    sawGroup.add(rearSkidBase);

    const rearEndBoot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.095, 10),
      stihlOrangeMat
    );
    rearEndBoot.position.set(-0.285, -0.028, 0);
    sawGroup.add(rearEndBoot);

    // Front Wrap-Around Tubular Handlebar & Matte-Black Inertia Chain-Brake Hand Guard
    const wrapBarTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.013, 0.013, 0.185, 12),
      stihlBlackMat
    );
    wrapBarTop.rotation.x = Math.PI / 2;
    wrapBarTop.position.set(-0.01, 0.195, -0.01);
    sawGroup.add(wrapBarTop);

    const wrapBarSide = new THREE.Mesh(
      new THREE.CylinderGeometry(0.013, 0.013, 0.25, 12),
      stihlBlackMat
    );
    wrapBarSide.position.set(-0.01, 0.075, -0.095);
    sawGroup.add(wrapBarSide);

    const chainBrakeFlag = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, 0.145, 0.135),
      stihlBlackMat
    );
    chainBrakeFlag.position.set(0.058, 0.145, 0.01);
    chainBrakeFlag.rotation.z = -0.26;
    chainBrakeFlag.castShadow = true;
    sawGroup.add(chainBrakeFlag);

    // Front metal bumper dogs (felling spikes)
    for (const sy of [-0.045, -0.01, 0.025, 0.06] as const) {
      const dogTooth = new THREE.Mesh(
        new THREE.ConeGeometry(0.012, 0.038, 4),
        bladeSteelMat
      );
      dogTooth.rotation.z = -Math.PI / 2;
      dogTooth.position.set(0.082, sy, 0.025);
      sawGroup.add(dogTooth);
    }

    // STIHL Rollomatic ES Light Guide Bar (`barLen`) + Rounded Sprocket Nose + 3D Saw Chain Teeth
    const barH = 0.086;
    const barT = 0.008;
    const barCenterX = 0.07 + barLen * 0.5;

    const guideBar = new THREE.Mesh(
      new THREE.BoxGeometry(barLen - barH * 0.5, barH, barT),
      guideBarMat
    );
    guideBar.name = `${name}.guideBar`;
    guideBar.position.set(barCenterX - barH * 0.25, 0.005, 0.032);
    guideBar.castShadow = true;
    sawGroup.add(guideBar);

    const barNose = new THREE.Mesh(
      new THREE.CylinderGeometry(barH * 0.5, barH * 0.5, barT, 20),
      guideBarMat
    );
    barNose.rotation.x = Math.PI / 2;
    barNose.position.set(0.07 + barLen - barH * 0.5, 0.005, 0.032);
    sawGroup.add(barNose);

    // 3D Steel Saw-Chain Cutter Links around top and bottom edges of the guide bar
    const numTeethPerSide = Math.round(barLen / 0.028);
    const toothGeo = new THREE.BoxGeometry(0.014, 0.012, 0.012);
    for (let t = 0; t < numTeethPerSide; t++) {
      const tx = 0.09 + (t / numTeethPerSide) * (barLen - 0.045);
      for (const sideY of [-1, 1] as const) {
        const tooth = new THREE.Mesh(toothGeo, bladeSteelMat);
        tooth.position.set(tx, 0.005 + sideY * (barH * 0.5 + 0.005), 0.032);
        tooth.rotation.z = sideY * 0.24;
        sawGroup.add(tooth);
      }
    }
  };

  // Mount STIHL MS 500i 20" Forestry Chainsaw (`x = -0.58m, y = 1.18m`, i.e. `u = 10.83m, worldY = +0.68m` right above hit point!)
  addStihlChainsaw(
    'outbuildings.garage.stihlWallRack.chainsawMS500i',
    -0.58,
    1.18,
    0.5,
    false
  );

  // Mount STIHL MSA 220 C-B 14" Compact Cordless Chainsaw (`x = -0.54m, y = 0.74m`, i.e. `u = 10.79m, worldY = +0.24m`)
  addStihlChainsaw(
    'outbuildings.garage.stihlWallRack.chainsawMSA220',
    -0.54,
    0.74,
    0.36,
    true
  );

  // ---------------------------------------------------------------------------
  // 3. STIHL HS 82 R 30" Professional Petrol Hedge Trimmer (`outbuildings.garage.stihlWallRack.hedgeTrimmerHS82`)
  //    Hung vertically on the center-left of the wall rack (`x = +0.18m, y = 1.32m`, blade pointing down)
  // ---------------------------------------------------------------------------
  const hs82Group = new THREE.Group();
  hs82Group.name = 'outbuildings.garage.stihlWallRack.hedgeTrimmerHS82';
  hs82Group.position.set(0.18, 1.34, 0.13);
  rackGroup.add(hs82Group);

  // Wall hanger fork holding the HS 82 R front loop handle
  for (const hx of [-0.065, 0.065] as const) {
    const fork = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, 0.026, 0.15),
      stihlOrangeMat
    );
    fork.position.set(hx, -0.06, -0.05);
    hs82Group.add(fork);
  }

  // STIHL Orange motor cowling & light-grey gearbox housing
  const hsMotor = new THREE.Mesh(
    new THREE.BoxGeometry(0.19, 0.18, 0.145),
    stihlOrangeMat
  );
  hsMotor.position.set(0, 0.05, 0);
  hsMotor.castShadow = true;
  hs82Group.add(hsMotor);

  const hsGearbox = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.095, 0.12),
    stihlLightGreyMat
  );
  hsGearbox.position.set(0, -0.065, 0);
  hs82Group.add(hsGearbox);

  const hsBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.1, 0.038),
    stihlBadgeMat
  );
  hsBadge.position.set(0, 0.05, 0.075);
  hs82Group.add(hsBadge);

  // Translucent fuel tank & top Rotating Multi-Function Rear Handle (`y = +0.16..+0.28m`)
  const hsTank = new THREE.Mesh(
    new THREE.BoxGeometry(0.13, 0.065, 0.115),
    fuelTankMat
  );
  hsTank.position.set(0.02, 0.155, 0);
  hs82Group.add(hsTank);

  const hsRearGrip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.017, 0.019, 0.17, 12),
    stihlBlackMat
  );
  hsRearGrip.position.set(0, 0.23, 0);
  hsRearGrip.rotation.z = 0.15;
  hs82Group.add(hsRearGrip);

  // Front bail loop handle & translucent/black knuckle guard shield
  const hsBail = new THREE.Mesh(
    new THREE.TorusGeometry(0.088, 0.012, 10, 20, Math.PI),
    stihlBlackMat
  );
  hsBail.rotation.x = Math.PI * 0.35;
  hsBail.position.set(0, -0.04, 0.045);
  hs82Group.add(hsBail);

  const knuckleShield = new THREE.Mesh(
    new THREE.BoxGeometry(0.21, 0.014, 0.11),
    stihlBlackMat
  );
  knuckleShield.position.set(0, -0.105, 0.025);
  hs82Group.add(knuckleShield);

  // 75cm (30") Double-Sided Reciprocating Hedge Trimmer Cutter Bar with 32 3D Offset Shear Teeth!
  const hsBladeLen = 0.74;
  const hsSpine = new THREE.Mesh(
    new THREE.BoxGeometry(0.032, hsBladeLen, 0.012),
    guideBarMat
  );
  hsSpine.name = 'outbuildings.garage.stihlWallRack.hedgeTrimmerHS82.cutterBar';
  hsSpine.position.set(0, -0.11 - hsBladeLen * 0.5, 0.01);
  hsSpine.castShadow = true;
  hs82Group.add(hsSpine);

  const shearToothGeo = new THREE.BoxGeometry(0.088, 0.014, 0.005);
  const numShearPairs = 18;
  for (let s = 0; s < numShearPairs; s++) {
    const ty = -0.15 - (s / numShearPairs) * (hsBladeLen - 0.07);
    const toothBar = new THREE.Mesh(shearToothGeo, bladeSteelMat);
    toothBar.position.set(0, ty, 0.008);
    hs82Group.add(toothBar);
  }

  // Aluminium tip protector nose guard at bottom of cutter bar
  const tipGuard = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.024, 0.008, 12),
    stihlOrangeMat
  );
  tipGuard.rotation.x = Math.PI / 2;
  tipGuard.position.set(0, -0.11 - hsBladeLen - 0.01, 0.01);
  hs82Group.add(tipGuard);

  // ---------------------------------------------------------------------------
  // 4. STIHL HLA 86 Long-Reach Telescopic Cordless Pole Hedge Trimmer (`outbuildings.garage.stihlWallRack.poleHedgeTrimmerHLA86`)
  //    Mounted horizontally along the lower wall rail (`y = 0.42m, x = -0.15..+1.15m`)
  // ---------------------------------------------------------------------------
  const hlaGroup = new THREE.Group();
  hlaGroup.name = 'outbuildings.garage.stihlWallRack.poleHedgeTrimmerHLA86';
  hlaGroup.position.set(0.32, 0.44, 0.11);
  rackGroup.add(hlaGroup);

  for (const hx of [-0.55, 0.35] as const) {
    const poleHook = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, 0.036, 0.11),
      stihlOrangeMat
    );
    poleHook.position.set(hx, -0.02, -0.05);
    hlaGroup.add(poleHook);
  }

  // Rear battery powerhead & control handle (`x = -0.78m`)
  const hlaPowerhead = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.13, 0.11),
    stihlOrangeMat
  );
  hlaPowerhead.position.set(-0.78, 0, 0);
  hlaPowerhead.castShadow = true;
  hlaGroup.add(hlaPowerhead);

  const hlaBatt = new THREE.Mesh(
    new THREE.BoxGeometry(0.095, 0.1, 0.095),
    stihlBlackMat
  );
  hlaBatt.position.set(-0.84, 0.02, 0);
  hlaGroup.add(hlaBatt);

  // Square-profile STIHL Orange & Black telescopic drive shaft (`1.18m` long)
  const outerShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.65, 12),
    stihlOrangeMat
  );
  outerShaft.rotation.z = Math.PI / 2;
  outerShaft.position.set(-0.35, 0, 0);
  hlaGroup.add(outerShaft);

  const clampCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.024, 0.065, 12),
    stihlBlackMat
  );
  clampCollar.rotation.z = Math.PI / 2;
  clampCollar.position.set(-0.02, 0, 0);
  hlaGroup.add(clampCollar);

  const innerShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.56, 12),
     bladeSteelMat
  );
  innerShaft.rotation.z = Math.PI / 2;
  innerShaft.position.set(0.26, 0, 0);
  hlaGroup.add(innerShaft);

  // Articulating 115° adjustable knuckle joint & 50cm double-sided hedge trimmer head (`x = +0.54..+1.06m`)
  const knuckleHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.032, 0.052, 16),
    stihlLightGreyMat
  );
  knuckleHub.rotation.x = Math.PI / 2;
  knuckleHub.position.set(0.55, 0, 0);
  hlaGroup.add(knuckleHub);

  const hlaBladeHead = new THREE.Group();
  hlaBladeHead.position.set(0.55, 0, 0);
  hlaBladeHead.rotation.z = 0.24; // Articulated upward angle
  hlaGroup.add(hlaBladeHead);

  const hlaSpine = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.026, 0.01),
    guideBarMat
  );
  hlaSpine.position.set(0.26, 0, 0);
  hlaBladeHead.add(hlaSpine);

  const hlaToothGeo = new THREE.BoxGeometry(0.012, 0.076, 0.005);
  for (let t = 0; t < 13; t++) {
    const tx = 0.04 + t * 0.036;
    const tooth = new THREE.Mesh(hlaToothGeo, bladeSteelMat);
    tooth.position.set(tx, 0, 0);
    hlaBladeHead.add(tooth);
  }

  // ---------------------------------------------------------------------------
  // 5. STIHL BGA 200 Handheld Cordless Leaf Blower (`outbuildings.garage.stihlWallRack.leafBlowerBGA200`)
  //    Mounted on the right side of the rack (`x = +0.76m, y = 1.02m`)
  // ---------------------------------------------------------------------------
  const blowerGroup = new THREE.Group();
  blowerGroup.name = 'outbuildings.garage.stihlWallRack.leafBlowerBGA200';
  blowerGroup.position.set(0.76, 1.04, 0.13);
  blowerGroup.rotation.z = -1.18;
  rackGroup.add(blowerGroup);

  const turbineScroll = new THREE.Mesh(
    new THREE.CylinderGeometry(0.095, 0.095, 0.13, 18),
    stihlOrangeMat
  );
  turbineScroll.rotation.x = Math.PI / 2;
  turbineScroll.castShadow = true;
  blowerGroup.add(turbineScroll);

  const intakeGrille = new THREE.Mesh(
    new THREE.CylinderGeometry(0.072, 0.072, 0.136, 16),
    stihlBlackMat
  );
  intakeGrille.rotation.x = Math.PI / 2;
  blowerGroup.add(intakeGrille);

  const blowerHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.016, 0.18, 10),
    stihlBlackMat
  );
  blowerGroup.add(blowerHandle);
  blowerHandle.rotation.z = Math.PI / 2;
  blowerHandle.position.set(0.04, 0.115, 0);

  const blowerTube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.046, 0.48, 16),
    stihlBlackMat
  );
  blowerTube.rotation.z = -Math.PI / 2;
  blowerTube.position.set(0.28, -0.02, 0);
  blowerTube.castShadow = true;
  blowerGroup.add(blowerTube);

  const nozzleRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.038, 0.038, 0.028, 16),
    bladeSteelMat
  );
  nozzleRing.rotation.z = Math.PI / 2;
  nozzleRing.position.set(0.51, -0.02, 0);
  blowerGroup.add(nozzleRing);

  // ---------------------------------------------------------------------------
  // 6. Upper Wall Shelf (`y = 1.44m, x = +0.55m..+1.16m`) with STIHL AL 500 Dual Charger,
  //    STIHL Forestry Safety Helmet + Mesh Visor + Ear Defenders, and STIHL MotoMix Combi Can
  // ---------------------------------------------------------------------------
  const shelfGroup = new THREE.Group();
  shelfGroup.name = 'outbuildings.garage.stihlWallRack.accessories';
  shelfGroup.position.set(0.78, 1.44, 0.14);
  rackGroup.add(shelfGroup);

  const shelfPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.76, 0.022, 0.26),
    rackSteelMat
  );
  shelfPlate.castShadow = true;
  shelfPlate.receiveShadow = true;
  shelfGroup.add(shelfPlate);

  // A. STIHL AL 500 High-Speed Battery Charger with 2 AP 300 S Batteries (`x = -0.22m`)
  const chargerBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.065, 0.18),
    stihlLightGreyMat
  );
  chargerBase.position.set(-0.22, 0.043, 0);
  chargerBase.castShadow = true;
  shelfGroup.add(chargerBase);

  for (const bx of [-0.275, -0.165] as const) {
    const battBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.082, 0.11, 0.11),
      stihlBlackMat
    );
    battBody.position.set(bx, 0.11, 0);
    shelfGroup.add(battBody);

    const battTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.024, 0.108),
      stihlOrangeMat
    );
    battTop.position.set(bx, 0.172, 0);
    shelfGroup.add(battTop);

    const chargeLed = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.008, 0.006),
      greenLedMat
    );
    chargeLed.position.set(bx, 0.052, 0.092);
    shelfGroup.add(chargeLed);
  }

  // B. STIHL Dynamic Forestry Safety Helmet with Face Mesh Visor & Ear Defenders (`x = +0.06m`)
  const helmetGroup = new THREE.Group();
  helmetGroup.position.set(0.06, 0.02, 0.02);
  shelfGroup.add(helmetGroup);

  const helmetDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.115, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
    stihlOrangeMat
  );
  helmetDome.position.set(0, 0.04, 0);
  helmetDome.castShadow = true;
  helmetGroup.add(helmetDome);

  const helmetPeak = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.012, 0.075),
    stihlBlackMat
  );
  helmetPeak.position.set(0, 0.042, 0.11);
  helmetPeak.rotation.x = 0.22;
  helmetGroup.add(helmetPeak);

  const faceVisor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.118, 0.112, 0.11, 16, 1, true, -Math.PI * 0.38, Math.PI * 0.76),
    meshVisorMat
  );
  faceVisor.rotation.y = Math.PI;
  faceVisor.position.set(0, -0.01, 0.015);
  helmetGroup.add(faceVisor);

  for (const sideX of [-1, 1] as const) {
    const earMuff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.036, 14),
      stihlOrangeMat
    );
    earMuff.rotation.z = Math.PI / 2;
    earMuff.position.set(sideX * 0.125, 0.01, 0);
    helmetGroup.add(earMuff);
  }

  // C. STIHL Twin-Chamber Fuel & Chain-Oil Combi Can (`x = +0.26m`)
  const combiCan = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.22, 0.19),
    stihlOrangeMat
  );
  combiCan.position.set(0.27, 0.12, 0);
  combiCan.castShadow = true;
  shelfGroup.add(combiCan);

  const spout = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.02, 0.11, 10),
    stihlBlackMat
  );
  spout.rotation.z = -0.35;
  spout.position.set(0.24, 0.26, 0.03);
  shelfGroup.add(spout);
}
