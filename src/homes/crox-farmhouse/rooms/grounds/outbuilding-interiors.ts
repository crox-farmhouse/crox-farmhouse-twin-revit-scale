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
 * Issue #4 ("Remove this glas window and replace with a double height glass door"
 * at `[-16.431, 0.87, 17.617]`, `outbuildings.gymGarageViewingWindow.glass`):
 * 1. Replaces the half-height viewing window with a **Full-Height ("Double Height") Architectural Glazed Double Door
 *    & Sidelight Screen (`outbuildings.gymGarageGlassDoor`)** extending from the Gym floor (`y = baseY0 = -0.60m`)
 *    all the way up to `y = 1.78m` (`2.38m` full-height span) across `v = 0.88m..3.52m` (`2.64m` wide, centered at
 *    `v = 2.20m` right at the annotated hit point `v = 2.139m`), with two interactive hinged full-height glass doors
 *    (`ctx.interactions.registerHingedDoor`) and flanked by full-height glazed sidelights.
 * 2. Adds profiled skirting boards (`outbuildings.gym.skirting`) around the interior perimeter of the GYM, stopping
 *    cleanly at the full-height glass double door (`v = 0.88..3.52m`) and the Gym-to-Shower-Room door (`v = 4.18..4.94m`).
 */
export function buildGymOakDoorAndSkirting(
  ctx: SceneBuilderContext,
  groundGroup: THREE.Group,
  baseY0: number,
  wallT: number,
  uGymEnd: number,
  partT: number,
  vWestRangeSouth: number,
  skirtingMat: THREE.Material
): void {
  const lightOakFrameMat = new THREE.MeshStandardMaterial({
    color: 0xc2986b, // Warm light European oak joinery & threshold step
    roughness: 0.42,
    metalness: 0.04,
  });
  const lightOakTrimMat = new THREE.MeshStandardMaterial({
    color: 0xb28759, // Chamfered light oak architrave moulding
    roughness: 0.46,
    metalness: 0.04,
  });
  const satinBlackMullionMat = new THREE.MeshStandardMaterial({
    color: 0x1e2228, // Slim architectural satin-anthracite steel glazing mullions, stiles & rails
    roughness: 0.34,
    metalness: 0.68,
  });
  const brushedSteelHardwareMat = new THREE.MeshStandardMaterial({
    color: 0xd8dfe6, // Brushed stainless pull handles, hinges & threshold plate
    roughness: 0.22,
    metalness: 0.88,
  });
  const viewingGlassMat = new THREE.MeshStandardMaterial({
    color: 0xdcf0f7, // Crystal-clear low-iron toughened acoustic safety glass
    roughness: 0.06,
    metalness: 0.14,
    transparent: true,
    opacity: 0.22,
  });

  // ---------------------------------------------------------------------------
  // 1. Full-Height ("Double Height") 2.64m x 2.38m Glazed Double Door & Sidelight Screen
  //    (`outbuildings.gymGarageGlassDoor`, `u = 5.77..5.97m, v = 0.88..3.52m, y = baseY0 (-0.60m) .. +1.78m`)
  // ---------------------------------------------------------------------------
  const screenUMid = uGymEnd + partT * 0.5; // 5.87m
  const screenVMin = 0.88;
  const screenVMax = 3.52;
  const screenVMid = (screenVMin + screenVMax) * 0.5; // 2.20m (right at hit point v = 2.139m!)
  const screenW = screenVMax - screenVMin; // 2.64m wide
  const screenH = 2.38; // Full height from `baseY0 = -0.60m` up to `y = +1.78m` (`2.38m` tall!)
  const jambT = 0.034;
  const archW = 0.062;
  const archT = 0.018;
  const thresholdStepH = 0.1; // Bridges `baseY0 = -0.60m` (Gym) up to `garageFloorTopY = -0.50m` (Garage)

  const glassDoorScreenGroup = new THREE.Group();
  glassDoorScreenGroup.name = 'outbuildings.gymGarageGlassDoor';
  glassDoorScreenGroup.userData.zone = 'courtyard';
  glassDoorScreenGroup.position.set(screenUMid, baseY0, screenVMid);
  groundGroup.add(glassDoorScreenGroup);

  // Solid European Oak & Brushed-Stainless Threshold Step (`y = 0..0.10m` above `baseY0`)
  const thresholdStep = new THREE.Mesh(
    new THREE.BoxGeometry(partT + 0.04, thresholdStepH, screenW),
    lightOakFrameMat
  );
  thresholdStep.name = 'outbuildings.gymGarageGlassDoor.threshold';
  thresholdStep.position.set(0, thresholdStepH * 0.5, 0);
  thresholdStep.receiveShadow = true;
  glassDoorScreenGroup.add(thresholdStep);

  const thresholdSillPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.006, screenW - jambT * 2),
    brushedSteelHardwareMat
  );
  thresholdSillPlate.position.set(0, thresholdStepH + 0.003, 0);
  glassDoorScreenGroup.add(thresholdSillPlate);

  // Full-depth outer frame jamb linings (North & South) and top head lining
  for (const sideZ of [-1, 1] as const) {
    const jamb = new THREE.Mesh(
      new THREE.BoxGeometry(partT + 0.01, screenH - thresholdStepH, jambT),
      satinBlackMullionMat
    );
    jamb.position.set(
      0,
      thresholdStepH + (screenH - thresholdStepH) * 0.5,
      sideZ * (screenW * 0.5 - jambT * 0.5)
    );
    jamb.castShadow = true;
    jamb.receiveShadow = true;
    glassDoorScreenGroup.add(jamb);
  }
  const headLining = new THREE.Mesh(
    new THREE.BoxGeometry(partT + 0.01, jambT, screenW),
    satinBlackMullionMat
  );
  headLining.position.set(0, screenH - jambT * 0.5, 0);
  glassDoorScreenGroup.add(headLining);

  // Moulded perimeter architraves on both the GYM (`-u`) and Garage (`+u`) wall faces
  for (const sideX of [-1, 1] as const) {
    const xFace = sideX * (partT * 0.5 + archT * 0.5);
    for (const sideZ of [-1, 1] as const) {
      const archLeg = new THREE.Mesh(
        new THREE.BoxGeometry(archT, screenH + archW - thresholdStepH, archW),
        lightOakTrimMat
      );
      archLeg.position.set(
        xFace,
        thresholdStepH + (screenH + archW - thresholdStepH) * 0.5,
        sideZ * (screenW * 0.5 + archW * 0.5 - 0.012)
      );
      glassDoorScreenGroup.add(archLeg);
    }
    const archHeader = new THREE.Mesh(
      new THREE.BoxGeometry(archT, archW, screenW + archW * 2 - 0.024),
      lightOakTrimMat
    );
    archHeader.position.set(xFace, screenH + archW * 0.5 - 0.006, 0);
    glassDoorScreenGroup.add(archHeader);
  }

  // Clear opening above threshold (`clearH = 2.246m`, `clearW = 2.572m`):
  // - North Fixed Full-Height Glazed Sidelight (`z = -1.286m .. -0.78m`, width `0.506m`)
  // - Central Full-Height Interactive Double Glass Doors (`z = -0.78m .. +0.78m`, width `1.56m`, two `0.774m` leaves)
  // - South Fixed Full-Height Glazed Sidelight (`z = +0.78m .. +1.286m`, width `0.506m`)
  const clearBottomY = thresholdStepH; // 0.10m
  const clearTopY = screenH - jambT; // 2.346m
  const clearH = clearTopY - clearBottomY; // 2.246m
  const clearMidY = clearBottomY + clearH * 0.5;
  const doorOpeningHalfW = 0.78;
  const mullionW = 0.036;
  const mullionD = 0.064;

  // 2 Full-Height Vertical Structural Mullion Posts at `z = ±0.78m` flanking the double doors
  for (const sideZ of [-1, 1] as const) {
    const postZ = sideZ * (doorOpeningHalfW + mullionW * 0.5);
    const mullionPost = new THREE.Mesh(
      new THREE.BoxGeometry(mullionD, clearH, mullionW),
      satinBlackMullionMat
    );
    mullionPost.position.set(0, clearMidY, postZ);
    mullionPost.castShadow = true;
    glassDoorScreenGroup.add(mullionPost);

    // Fixed Full-Height Sidelight between `postZ` and outer jamb (`±(screenW * 0.5 - jambT)`)
    const sidelightInnerZ = sideZ * (doorOpeningHalfW + mullionW);
    const sidelightOuterZ = sideZ * (screenW * 0.5 - jambT);
    const sidelightW = Math.abs(sidelightOuterZ - sidelightInnerZ);
    const sidelightMidZ = (sidelightInnerZ + sidelightOuterZ) * 0.5;

    for (const railY of [clearBottomY + 0.018, clearTopY - 0.018, clearBottomY + clearH * 0.34, clearBottomY + clearH * 0.67] as const) {
      const hBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.044, 0.024, sidelightW),
        satinBlackMullionMat
      );
      hBar.position.set(0, railY, sidelightMidZ);
      glassDoorScreenGroup.add(hBar);
    }

    const sidelightGlass = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, clearH - 0.036, sidelightW - 0.012),
      viewingGlassMat
    );
    sidelightGlass.name = 'outbuildings.gymGarageGlassDoor.sidelightGlass';
    sidelightGlass.position.set(0, clearMidY, sidelightMidZ);
    glassDoorScreenGroup.add(sidelightGlass);
  }

  // Two Interactive Full-Height ("Double Height") Glazed Door Leaves (`northLeaf` & `southLeaf`)
  const leafW = doorOpeningHalfW - 0.004; // 0.776m per leaf
  const leafH = clearH - 0.008; // 2.238m tall!
  const leafT = 0.044;
  const stileW = 0.046;

  for (const [sideZ, leafName] of [
    [-1, 'outbuildings.gymGarageGlassDoor.northLeaf'],
    [1, 'outbuildings.gymGarageGlassDoor.southLeaf'],
  ] as const) {
    // Hinge pivot at the outer mullion post (`z = sideZ * (doorOpeningHalfW - 0.004)`)
    const hingeZ = sideZ * (doorOpeningHalfW - 0.004);
    const leafPivot = new THREE.Group();
    leafPivot.name = leafName;
    leafPivot.position.set(0, clearMidY, hingeZ);
    glassDoorScreenGroup.add(leafPivot);

    // Center of leaf relative to `hingeZ` is `-sideZ * (leafW * 0.5)`
    const leafCenterRelZ = -sideZ * (leafW * 0.5);

    // Outer hinge stile & inner meeting stile
    for (const stileRelZ of [
      -sideZ * (stileW * 0.5),
      -sideZ * (leafW - stileW * 0.5),
    ] as const) {
      const stile = new THREE.Mesh(
        new THREE.BoxGeometry(leafT, leafH, stileW),
        satinBlackMullionMat
      );
      stile.position.set(0, 0, stileRelZ);
      stile.castShadow = true;
      leafPivot.add(stile);
    }

    // Top rail, bottom kick rail, and 2 slender Crittall horizontal glazing bars matching the sidelights
    for (const [railRelY, railH] of [
      [-leafH * 0.5 + 0.032, 0.064],
      [leafH * 0.5 - 0.024, 0.048],
      [-leafH * 0.5 + leafH * 0.34, 0.022],
      [-leafH * 0.5 + leafH * 0.67, 0.022],
    ] as const) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(leafT, railH, leafW - stileW * 2),
        satinBlackMullionMat
      );
      rail.position.set(0, railRelY, leafCenterRelZ);
      rail.castShadow = true;
      leafPivot.add(rail);
    }

    // Full-Height Toughened Acoustic Glass Pane (`outbuildings.gymGarageGlassDoor.glass` & legacy alias `.gymGarageViewingWindow.glass`)
    const doorGlass = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, leafH - 0.11, leafW - stileW * 2 + 0.008),
      viewingGlassMat
    );
    doorGlass.name = 'outbuildings.gymGarageGlassDoor.glass';
    doorGlass.position.set(0, 0.004, leafCenterRelZ);
    leafPivot.add(doorGlass);

    // Issue #4 ("black handles" at `[-16.448, 0.523, 17.616]`, `outbuildings.gymGarageGlassDoor.glass`):
    // Long vertical architectural matte-black anodized pull handles on both the GYM (`-x`) and Garage (`+x`) faces
    const handleRelZ = -sideZ * (leafW - stileW - 0.028);
    for (const faceX of [-1, 1] as const) {
      const pullBar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.011, 0.011, 0.52, 14),
        satinBlackMullionMat
      );
      pullBar.name = 'outbuildings.gymGarageGlassDoor.handle';
      pullBar.position.set(faceX * (leafT * 0.5 + 0.026), -0.06, handleRelZ);
      leafPivot.add(pullBar);

      for (const standY of [-0.22, 0.1] as const) {
        const standoff = new THREE.Mesh(
          new THREE.CylinderGeometry(0.008, 0.008, 0.028, 10),
          satinBlackMullionMat
        );
        standoff.name = 'outbuildings.gymGarageGlassDoor.handleStandoff';
        standoff.rotation.z = Math.PI / 2;
        standoff.position.set(faceX * (leafT * 0.5 + 0.013), standY, handleRelZ);
        leafPivot.add(standoff);
      }
    }

    // Register interactive hinged door so clicking either full-height glass leaf swings it smoothly open!
    ctx.interactions.registerHingedDoor(
      glassDoorScreenGroup,
      leafPivot,
      new THREE.Vector3(0, 0, 0),
      'y',
      sideZ * Math.PI * 0.48
    );
  }

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
  // Segmented skirting along the GYM East partition wall (`u = 5.77m`), stopping cleanly at
  // the full-height glass double door (`v = 0.88..3.52m`) and the Gym-to-Shower-Room door (`v = 4.18..4.94m`)!
  addSkirtingAlongV(vInnerNorth, 0.82, uGymEnd, -1);
  addSkirtingAlongV(3.58, 4.12, uGymEnd, -1);
  addSkirtingAlongV(5.0, vInnerSouth, uGymEnd, -1);

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
  garageFloorTopY: number,
  ctx?: SceneBuilderContext
): void {
  const benchGroup = new THREE.Group();
  benchGroup.name = 'outbuildings.garage.toolBench';
  // Spans `v = 1.34m..5.41m` (`totalW = 4.07m`, centered at `v = 3.375m`) along the Garage East Wall (`u = 12.07m`):
  // - North Section (`v = 1.34m..2.86m`, `localX = +0.515m..+2.035m`, width `1.52m`, height `2.16m`):
  //   Issue #1 ("There is a gap here" at `[-9.565, -0.69, 16.38]`) &
  //   Issue #2 ("Have a double stainless steel full height cupboard here. It can go higher than currently.
  //   Inside will be storage for ladders, paint etc everything you wan tout of the way. One will have shelving the other full height."
  //   at `[-10.269, -0.134, 17.336]`):
  //   Butts 100% flush against the `v = 1.18..1.34m` pass-through door wall pier with zero gap, and rises `2.16m` high
  //   (`y = -0.50m..+1.66m`), featuring two interactive full-height brushed 304 stainless-steel doors (`registerHingedDoor`)
  //   opening to reveal a full-height ladder/tool compartment on the right (North) and a 5-tier shelved paint & hardware
  //   storage compartment on the left (South)!
  // - South Section (`v = 2.86m..5.41m`, `localX = -2.035m..+0.515m`, width `2.55m`):
  //   Recessed Butcher-Block Workbench & 5-Tier Brushed 304 Stainless-Steel Drawer Banks (`Issue #3`), wrapping 90 degrees
  //   around the SE corner (`v = 5.41m`) onto the Garage South wall (`u = 10.12m..12.04m`) with continuous lower drawer banks
  //   (`Issue #3: "No need for open section keep the drawers"`) and a wall-mounted 32-inch 16:9 monitor (`Issue #4`)!
  benchGroup.position.set(12.41, garageFloorTopY, 3.375);
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
  const ledStripMat = new THREE.MeshStandardMaterial({
    color: 0xf4f9ff,
    emissive: new THREE.Color(0xd8eeff),
    emissiveIntensity: 2.6,
    roughness: 0.16,
  });

  const totalW = 4.07; // `localX = -2.035m..+2.035m` (`v = 5.41m..1.34m`)
  const benchSpanW = 2.55; // `localX = -2.035m..+0.515m` (`v = 5.41m..2.86m`)
  const benchCenterX = -2.035 + benchSpanW * 0.5; // -0.76m
  const tallCupboardW = 1.52; // `localX = +0.515m..+2.035m` (`v = 2.86m..1.34m`)
  const tallCupboardCenterX = 0.515 + tallCupboardW * 0.5; // +1.275m
  const tallCupboardH = 2.16; // Rises to `y = 1.66m` world (`27cm` taller than the workbench upper cabinets!)
  const benchD = 0.74;
  const cabinetH = 0.86;
  const topT = 0.052;
  const worktopY = cabinetH + topT;
  const frontZ = -benchD * 0.5 + 0.012;

  // ---------------------------------------------------------------------------
  // 1. Recessed Alcove Jamb Linings (`outbuildings.garage.toolBench.alcoveEnclosure`)
  // ---------------------------------------------------------------------------
  const alcoveGroup = new THREE.Group();
  alcoveGroup.name = 'outbuildings.garage.toolBench.alcoveEnclosure';
  alcoveGroup.userData.isArchitecturalShell = true;
  benchGroup.add(alcoveGroup);

  const northJambLining = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, tallCupboardH, 0.73),
    alcovePlasterMat
  );
  northJambLining.userData.isArchitecturalShell = true;
  northJambLining.position.set(totalW * 0.5 + 0.008, tallCupboardH * 0.5, 0.025);
  northJambLining.castShadow = true;
  northJambLining.receiveShadow = true;
  alcoveGroup.add(northJambLining);

  const southJambLining = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, tallCupboardH, 0.73),
    alcovePlasterMat
  );
  southJambLining.userData.isArchitecturalShell = true;
  southJambLining.position.set(-totalW * 0.5 - 0.008, tallCupboardH * 0.5, 0.025);
  southJambLining.castShadow = true;
  southJambLining.receiveShadow = true;
  alcoveGroup.add(southJambLining);

  // ---------------------------------------------------------------------------
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
  tcPlinth.position.set(0, tcPlinthH * 0.5, 0.02);
  tallCupboardGroup.add(tcPlinth);

  // Dark-anthracite steel cabinet carcass (back wall, top cap, bottom deck, left/right outer walls, central divider)
  // matching the lower drawer bank carcass (`anthraciteSteelMat`)
  const tcBackWall = new THREE.Mesh(
    new THREE.BoxGeometry(tallCupboardW, tallCupboardH - tcPlinthH, tcWallT),
    anthraciteSteelMat
  );
  tcBackWall.position.set(0, tcPlinthH + (tallCupboardH - tcPlinthH) * 0.5, benchD * 0.5 - tcWallT * 0.5);
  tcBackWall.castShadow = true;
  tcBackWall.receiveShadow = true;
  tallCupboardGroup.add(tcBackWall);

  const tcBottomDeck = new THREE.Mesh(
    new THREE.BoxGeometry(tallCupboardW - tcWallT * 2, tcWallT, benchD - 0.03),
    brushedStainlessMat
  );
  tcBottomDeck.position.set(0, tcPlinthH + tcWallT * 0.5, 0.005);
  tcBottomDeck.receiveShadow = true;
  tallCupboardGroup.add(tcBottomDeck);

  const tcTopCap = new THREE.Mesh(
    new THREE.BoxGeometry(tallCupboardW, tcTopCapH, benchD - 0.02),
    anthraciteSteelMat
  );
  tcTopCap.position.set(0, tallCupboardH - tcTopCapH * 0.5, 0.01);
  tcTopCap.castShadow = true;
  tallCupboardGroup.add(tcTopCap);

  // Left (`-0.749m`), Center Divider (`0.0m`), and Right (`+0.749m`) vertical carcass walls + 22mm dark-anthracite front stiles
  for (const wallX of [-tallCupboardW * 0.5 + tcWallT * 0.5, 0, tallCupboardW * 0.5 - tcWallT * 0.5] as const) {
    const vWall = new THREE.Mesh(
      new THREE.BoxGeometry(tcWallT, tcInnerH, benchD - 0.04),
      anthraciteSteelMat
    );
    vWall.position.set(wallX, tcInnerBaseY + tcInnerH * 0.5, 0.01);
    vWall.castShadow = true;
    vWall.receiveShadow = true;
    tallCupboardGroup.add(vWall);

    const frontStile = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, tallCupboardH - tcPlinthH, 0.016),
      anthraciteSteelMat
    );
    frontStile.position.set(wallX, tcPlinthH + (tallCupboardH - tcPlinthH) * 0.5, frontZ + 0.004);
    tallCupboardGroup.add(frontStile);
  }

  // Interior LED strip lights along the top of both compartments
  for (const compX of [-tallCupboardW * 0.25, tallCupboardW * 0.25] as const) {
    const innerLed = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.012, 0.028),
      ledStripMat
    );
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
    colorBand.position.set(px, tcPlinthH + tcWallT + h * 0.55, pz);
    tallCupboardGroup.add(colorBand);

    const rimLid = new THREE.Mesh(
      new THREE.CylinderGeometry(r + 0.004, r + 0.004, 0.016, 18),
      aluminumTrimMat
    );
    rimLid.position.set(px, tcPlinthH + tcWallT + h + 0.006, pz);
    tallCupboardGroup.add(rimLid);
  }

  // Paint roller tray & yellow/white sheepskin roller on right side of Tier 1
  const rollerTray = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.055, 0.34),
    dewaltBlackMat
  );
  rollerTray.position.set(leftBayX + 0.22, tcPlinthH + tcWallT + 0.028, 0.02);
  tallCupboardGroup.add(rollerTray);

  const rollerSleeve = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.028, 0.18, 14),
    paintWhiteMat
  );
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
    canCyl.position.set(ax, 0.89 + 0.0825, az);
    tallCupboardGroup.add(canCyl);

    const canCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.031, 0.031, 0.042, 14),
      capMat
    );
    canCap.position.set(ax, 0.89 + 0.186, az);
    tallCupboardGroup.add(canCap);
  }

  const oilJug = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.24, 0.19),
    dewaltYellowMat
  );
  oilJug.position.set(leftBayX + 0.20, 0.89 + 0.12, -0.04);
  tallCupboardGroup.add(oilJug);

  for (let tapeIdx = 0; tapeIdx < 3; tapeIdx++) {
    const tapeRoll = new THREE.Mesh(
      new THREE.TorusGeometry(0.048, 0.016, 10, 18),
      tapeIdx === 0 ? wd40BlueMat : paintWhiteMat
    );
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
    crateBox.position.set(cx, 1.69 + 0.11, -0.01);
    tallCupboardGroup.add(crateBox);

    const crateLid = new THREE.Mesh(
      new THREE.BoxGeometry(0.30, 0.024, 0.43),
      dewaltYellowMat
    );
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
    frontStile.position.set(-0.04, ladderH * 0.5, sz * (ladderSpanZ * 0.5));
    frontStile.castShadow = true;
    stepLadderGroup.add(frontStile);

    const rearLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, ladderH * 0.94, 0.038),
      aluminumTrimMat
    );
    rearLeg.position.set(0.05, (ladderH * 0.94) * 0.5, sz * (ladderSpanZ * 0.46));
    stepLadderGroup.add(rearLeg);

    // Non-slip black/yellow rubber feet
    const footCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.036, 0.06),
      dewaltYellowMat
    );
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
    stileRail.position.set(sx, extLadderH * 0.5, 0);
    stileRail.castShadow = true;
    extLadderGroup.add(stileRail);

    const stabilizerCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.038, 0.04, 0.076),
      rockerSwitchMat
    );
    stabilizerCap.position.set(sx, 0.02, 0);
    extLadderGroup.add(stabilizerCap);
  }
  for (let rung = 0; rung < 7; rung++) {
    const rungMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.28, 10),
      aluminumTrimMat
    );
    rungMesh.rotation.z = Math.PI / 2;
    rungMesh.position.set(0, 0.22 + rung * 0.26, 0);
    extLadderGroup.add(rungMesh);
  }

  // 3) Long Workshop Push Broom & 1200mm Box-Beam Spirit Level clipped in the front-left of the full-height bay
  const broomHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.013, 0.013, 1.56, 10),
    butcherEdgeMat
  );
  broomHandle.position.set(rightBayX - 0.25, tcPlinthH + 0.86, -0.14);
  tallCupboardGroup.add(broomHandle);

  const broomHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.065, 0.34),
    dewaltYellowMat
  );
  broomHead.position.set(rightBayX - 0.25, tcPlinthH + 0.055, -0.14);
  tallCupboardGroup.add(broomHead);

  const tallLevel = new THREE.Mesh(
    new THREE.BoxGeometry(0.026, 1.22, 0.058),
    dewaltYellowMat
  );
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
    tallHandle.position.set(handleOffsetX, -0.10, -0.012);
    doorGroup.add(tallHandle);

    const handleLabelStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.007, 0.16, 0.004),
      dewaltBlackMat
    );
    handleLabelStrip.position.set(handleOffsetX, -0.10, -0.025);
    doorGroup.add(handleLabelStrip);

    // Cylinder key lock above handle matching the drawer stacks
    const doorLock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.026, 12),
      aluminumTrimMat
    );
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

  // ---------------------------------------------------------------------------
  // 3. East-Wall Workbench Lower Cabinet Carcass, Plinth & Brushed 304 Stainless-Steel Drawers
  //    (`localX = -2.035m..+0.515m`, `benchSpanW = 2.55m`, `v = 2.86m..5.41m` — Issue #3!)
  // ---------------------------------------------------------------------------
  const carcass = new THREE.Mesh(
    new THREE.BoxGeometry(benchSpanW - 0.02, cabinetH - 0.05, benchD - 0.04),
    anthraciteSteelMat
  );
  carcass.position.set(benchCenterX, 0.05 + (cabinetH - 0.05) * 0.5, 0.01);
  carcass.castShadow = true;
  carcass.receiveShadow = true;
  benchGroup.add(carcass);

  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(benchSpanW - 0.04, 0.05, benchD - 0.08),
    dewaltBlackMat
  );
  plinth.position.set(benchCenterX, 0.025, 0.02);
  benchGroup.add(plinth);

  const postPositionsX = [
    -1.295,
    -0.695,
    -0.095,
    0.505,
  ] as const;
  for (const mx of postPositionsX) {
    const stile = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, cabinetH - 0.05, 0.016),
      anthraciteSteelMat
    );
    stile.position.set(mx, 0.05 + (cabinetH - 0.05) * 0.5, frontZ + 0.004);
    benchGroup.add(stile);
  }

  for (const fx of [-1.95, -1.295, -0.695, -0.095, 0.505] as const) {
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

  const eastDrawerW = 0.578;
  const eastDrawerBanks = [-0.995, -0.395, 0.205] as const;
  const fiveTierHeights = [0.085, 0.105, 0.135, 0.185, 0.22] as const;

  for (const cx of eastDrawerBanks) {
    let cursorY = cabinetH - 0.025;

    const keyLock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.026, 12),
      aluminumTrimMat
    );
    keyLock.rotation.x = Math.PI / 2;
    keyLock.position.set(cx + eastDrawerW * 0.5 - 0.032, cabinetH - 0.048, frontZ - 0.004);
    benchGroup.add(keyLock);

    for (let dIdx = 0; dIdx < fiveTierHeights.length; dIdx++) {
      const dh = fiveTierHeights[dIdx]!;
      const dy = cursorY - dh * 0.5;
      const drawerFront = new THREE.Mesh(
        new THREE.BoxGeometry(eastDrawerW, dh - 0.007, 0.02),
        brushedStainlessMat
      );
      drawerFront.name = 'outbuildings.garage.toolBench.drawer';
      drawerFront.position.set(cx, dy, frontZ);
      drawerFront.castShadow = true;
      drawerFront.receiveShadow = true;
      benchGroup.add(drawerFront);

      const pullBar = new THREE.Mesh(
        new THREE.BoxGeometry(eastDrawerW - 0.024, 0.016, 0.026),
        aluminumTrimMat
      );
      pullBar.position.set(cx, dy + dh * 0.5 - 0.015, frontZ - 0.012);
      benchGroup.add(pullBar);

      const labelStrip = new THREE.Mesh(
        new THREE.BoxGeometry(eastDrawerW * 0.42, 0.007, 0.004),
        dewaltBlackMat
      );
      labelStrip.position.set(cx, dy + dh * 0.5 - 0.015, frontZ - 0.025);
      benchGroup.add(labelStrip);

      cursorY -= dh;
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Laminated Hardwood Butcher-Block Worktop, Pegboard & Upper Cabinets (`benchSpanW = 2.55m`)
  //    - Issue #4 ("Height of this section should match the cupboards" at `[-9.737, 1.207, 18.647]`):
  //      `worktopY (0.912m) + pegboardH (0.76m) + upperCabH (0.488m) = 2.160m === tallCupboardH`!
  // ---------------------------------------------------------------------------
  const topD = 0.78;
  const butcherTop = new THREE.Mesh(
    new THREE.BoxGeometry(benchSpanW, topT, topD),
    butcherBlockMat
  );
  butcherTop.name = 'outbuildings.garage.toolBench.butcherBlockTop';
  butcherTop.position.set(benchCenterX, cabinetH + topT * 0.5, 0);
  butcherTop.castShadow = true;
  butcherTop.receiveShadow = true;
  benchGroup.add(butcherTop);

  const bullnoseRadius = topT * 0.5;
  const frontBullnose = new THREE.Mesh(
    new THREE.CylinderGeometry(bullnoseRadius, bullnoseRadius, benchSpanW, 16),
    butcherBlockMat
  );
  frontBullnose.name = 'outbuildings.garage.toolBench.butcherBlockTop';
  frontBullnose.rotation.z = Math.PI / 2;
  frontBullnose.position.set(benchCenterX, cabinetH + topT * 0.5, -topD * 0.5);
  frontBullnose.castShadow = true;
  frontBullnose.receiveShadow = true;
  benchGroup.add(frontBullnose);

  const southEndCap = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, topT + 0.002, topD + 0.012),
    butcherEdgeMat
  );
  southEndCap.position.set(-totalW * 0.5 - 0.004, cabinetH + topT * 0.5, 0);
  southEndCap.castShadow = true;
  benchGroup.add(southEndCap);

  const upstandH = 0.032;
  const upstandT = 0.012;
  const rearUpstand = new THREE.Mesh(
    new THREE.BoxGeometry(benchSpanW, upstandH, upstandT),
    brushedStainlessMat
  );
  rearUpstand.position.set(benchCenterX, worktopY + upstandH * 0.5, benchD * 0.5 - upstandT * 0.5);
  benchGroup.add(rearUpstand);

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

  const pegboardH = 0.76;
  const pegboard = new THREE.Mesh(
    new THREE.BoxGeometry(benchSpanW - 0.02, pegboardH, 0.024),
    anthraciteSteelMat
  );
  pegboard.name = 'outbuildings.garage.toolBench.pegboard';
  pegboard.position.set(benchCenterX, worktopY + pegboardH * 0.5, benchD * 0.5 - 0.02);
  benchGroup.add(pegboard);

  const powerStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.78, 0.062, 0.036),
    aluminumTrimMat
  );
  powerStrip.name = 'outbuildings.garage.toolBench.powerStrip';
  powerStrip.position.set(-0.48, worktopY + 0.11, benchD * 0.5 - 0.045);
  benchGroup.add(powerStrip);

  for (let s = 0; s < 6; s++) {
    const sx = -0.73 + s * 0.1;
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

  const upperCabH = tallCupboardH - (worktopY + pegboardH); // 0.488m (total height = 2.160m === tallCupboardH)
  const upperCabD = 0.34;
  const upperCab = new THREE.Mesh(
    new THREE.BoxGeometry(benchSpanW - 0.02, upperCabH, upperCabD),
    anthraciteSteelMat
  );
  upperCab.position.set(
    benchCenterX,
    worktopY + pegboardH + upperCabH * 0.5,
    benchD * 0.5 - upperCabD * 0.5
  );
  upperCab.castShadow = true;
  benchGroup.add(upperCab);

  const upperDoorW = 0.81;
  for (const ux of [-1.59, -0.76, 0.07] as const) {
    const upperDoor = new THREE.Mesh(
      new THREE.BoxGeometry(upperDoorW, upperCabH - 0.03, 0.02),
      brushedStainlessMat
    );
    upperDoor.name = 'outbuildings.garage.toolBench.drawer';
    upperDoor.position.set(
      ux,
      worktopY + pegboardH + upperCabH * 0.5,
      benchD * 0.5 - upperCabD - 0.008
    );
    upperDoor.castShadow = true;
    upperDoor.receiveShadow = true;
    benchGroup.add(upperDoor);

    const upperPull = new THREE.Mesh(
      new THREE.BoxGeometry(upperDoorW - 0.04, 0.016, 0.026),
      aluminumTrimMat
    );
    upperPull.position.set(
      ux,
      worktopY + pegboardH + 0.034,
      benchD * 0.5 - upperCabD - 0.022
    );
    benchGroup.add(upperPull);

    const upperLabelStrip = new THREE.Mesh(
      new THREE.BoxGeometry(upperDoorW * 0.42, 0.007, 0.004),
      dewaltBlackMat
    );
    upperLabelStrip.position.set(
      ux,
      worktopY + pegboardH + 0.034,
      benchD * 0.5 - upperCabD - 0.035
    );
    benchGroup.add(upperLabelStrip);
  }

  const ledTaskBar = new THREE.Mesh(
    new THREE.BoxGeometry(benchSpanW - 0.08, 0.014, 0.038),
    ledStripMat
  );
  ledTaskBar.position.set(benchCenterX, worktopY + pegboardH - 0.007, benchD * 0.5 - upperCabD + 0.05);
  benchGroup.add(ledTaskBar);

  // ---------------------------------------------------------------------------
  // 5. Shower-Room Front Cabinet & Workstation Section (`outbuildings.garage.toolBench.southWing`)
  //    - Issue #3 ("Move this section of cabinet to in front of the shower room" at `[-11.363, 0.412, 20.06]`,
  //      `outbuildings.garage.toolBench.southWing.butcherBlockTop`):
  //      Moved from the SE corner (`u = 10.12..12.04m, v = 5.04m`) to sit directly in front of the Shower Room's
  //      North wall (`v = 3.85m`, spanning `u = 6.91m..8.85m`, centered at `u = 7.88m, v = 3.48m`, which in
  //      `benchGroup` local coordinates `(12.41, y, 3.375, rotY = +Math.PI/2)` is `localX = -0.105m, localZ = -4.53m`),
  //      facing North (`-v`) toward the West Garage Double Door while leaving the Garage-to-Shower-Room door (`u = 6.07..6.83m`) clear!
  //    - Full-depth Dark-Anthracite Steel Lower Cabinet Carcass, Plinth, Stiles & 3 Banks of 5-Tier
  //      Brushed 304 Stainless-Steel Drawers (`outbuildings.garage.toolBench.southWing.drawer`) underneath,
  //      plus the Wall-Mounted 32-Inch (`16:9`) Monitor on the Shower Room North wall behind it!
  // ---------------------------------------------------------------------------
  const southReturnL = 1.92; // Spans `u = 6.91m..8.85m` directly in front of the Shower Room North wall (`v = 3.85m`)
  const southWingGroup = new THREE.Group();
  southWingGroup.name = 'outbuildings.garage.toolBench.southWing';
  southWingGroup.position.set(
    -0.105, // localX = -0.105m -> v = 3.48m (`v = 3.11..3.85m`, flush against the `v = 3.85m` Shower Room North wall!)
    0,
    -4.53 // localZ = -4.53m -> u = 7.88m (`u = 6.91..8.85m`)
  );
  southWingGroup.rotation.y = -Math.PI / 2;
  benchGroup.add(southWingGroup);

  // Issue #3: Full-Depth Lower Cabinet Carcass, Plinth & 3 Banks of 5-Tier Brushed 304 Stainless Drawers
  const southCarcass = new THREE.Mesh(
    new THREE.BoxGeometry(southReturnL - 0.02, cabinetH - 0.05, benchD - 0.04),
    anthraciteSteelMat
  );
  southCarcass.position.set(0.01, 0.05 + (cabinetH - 0.05) * 0.5, 0.01);
  southCarcass.castShadow = true;
  southCarcass.receiveShadow = true;
  southWingGroup.add(southCarcass);

  const southPlinth = new THREE.Mesh(
    new THREE.BoxGeometry(southReturnL - 0.04, 0.05, benchD - 0.08),
    dewaltBlackMat
  );
  southPlinth.position.set(0.01, 0.025, 0.02);
  southWingGroup.add(southPlinth);

  const southPostPositionsX = [-0.94, -0.31, 0.31, 0.94] as const;
  for (const sx of southPostPositionsX) {
    const sStile = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, cabinetH - 0.05, 0.016),
      anthraciteSteelMat
    );
    sStile.position.set(sx, 0.05 + (cabinetH - 0.05) * 0.5, frontZ + 0.004);
    southWingGroup.add(sStile);

    for (const sz of [-benchD * 0.5 + 0.07, benchD * 0.5 - 0.07]) {
      const sFootPad = new THREE.Mesh(
        new THREE.CylinderGeometry(0.036, 0.038, 0.014, 14),
        dewaltBlackMat
      );
      sFootPad.position.set(sx, 0.007, sz);
      southWingGroup.add(sFootPad);

      const sFootLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.024, 0.028, 0.042, 12),
        aluminumTrimMat
      );
      sFootLeg.position.set(sx, 0.031, sz);
      southWingGroup.add(sFootLeg);
    }
  }

  const southDrawerW = 0.602;
  for (const scx of [-0.625, 0.0, 0.625] as const) {
    let cursorY = cabinetH - 0.025;

    const sKeyLock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.026, 12),
      aluminumTrimMat
    );
    sKeyLock.rotation.x = Math.PI / 2;
    sKeyLock.position.set(scx + southDrawerW * 0.5 - 0.032, cabinetH - 0.048, frontZ - 0.004);
    southWingGroup.add(sKeyLock);

    for (let dIdx = 0; dIdx < fiveTierHeights.length; dIdx++) {
      const dh = fiveTierHeights[dIdx]!;
      const dy = cursorY - dh * 0.5;
      const sDrawerFront = new THREE.Mesh(
        new THREE.BoxGeometry(southDrawerW, dh - 0.007, 0.02),
        brushedStainlessMat
      );
      sDrawerFront.name = 'outbuildings.garage.toolBench.southWing.drawer';
      sDrawerFront.position.set(scx, dy, frontZ);
      sDrawerFront.castShadow = true;
      sDrawerFront.receiveShadow = true;
      southWingGroup.add(sDrawerFront);

      const sPullBar = new THREE.Mesh(
        new THREE.BoxGeometry(southDrawerW - 0.024, 0.016, 0.026),
        aluminumTrimMat
      );
      sPullBar.position.set(scx, dy + dh * 0.5 - 0.015, frontZ - 0.012);
      southWingGroup.add(sPullBar);

      const sLabelStrip = new THREE.Mesh(
        new THREE.BoxGeometry(southDrawerW * 0.42, 0.007, 0.004),
        dewaltBlackMat
      );
      sLabelStrip.position.set(scx, dy + dh * 0.5 - 0.015, frontZ - 0.025);
      southWingGroup.add(sLabelStrip);

      cursorY -= dh;
    }
  }

  // Continuous 52mm End-Grain Hardwood Butcher-Block Return Worktop (`1.94m x 0.052m x 0.78m`)
  const southButcherTop = new THREE.Mesh(
    new THREE.BoxGeometry(southReturnL + 0.02, topT, topD),
    butcherBlockMat
  );
  southButcherTop.name = 'outbuildings.garage.toolBench.southWing.butcherBlockTop';
  southButcherTop.position.set(0.01, cabinetH + topT * 0.5, 0);
  southButcherTop.castShadow = true;
  southButcherTop.receiveShadow = true;
  southWingGroup.add(southButcherTop);

  const southFrontBullnose = new THREE.Mesh(
    new THREE.CylinderGeometry(bullnoseRadius, bullnoseRadius, southReturnL + 0.02, 16),
    butcherBlockMat
  );
  southFrontBullnose.rotation.z = Math.PI / 2;
  southFrontBullnose.position.set(0.01, cabinetH + topT * 0.5, -topD * 0.5);
  southFrontBullnose.castShadow = true;
  southWingGroup.add(southFrontBullnose);

  const southRearUpstand = new THREE.Mesh(
    new THREE.BoxGeometry(southReturnL + 0.02, upstandH, upstandT),
    brushedStainlessMat
  );
  southRearUpstand.position.set(0.01, worktopY + upstandH * 0.5, benchD * 0.5 - upstandT * 0.5);
  southWingGroup.add(southRearUpstand);

  // Tidy Dark-Anthracite Back Wall Panel (`outbuildings.garage.toolBench.southWing.pegboard`) flush against the Garage South wall (`+sz`)
  const southPegboard = new THREE.Mesh(
    new THREE.BoxGeometry(southReturnL, pegboardH, 0.022),
    anthraciteSteelMat
  );
  southPegboard.name = 'outbuildings.garage.toolBench.southWing.pegboard';
  southPegboard.position.set(0, worktopY + pegboardH * 0.5, benchD * 0.5 - 0.015);
  southWingGroup.add(southPegboard);

  // Issue #4 ("Smaller screen, only needs to be 32 inch not ultra wide." at `[-11.234, 0.819, 20.361]`):
  // Wall-Mounted 32-Inch (`16:9` aspect ratio, `0.70m x 0.39m` active display, `0.72m x 0.41m` bezel) Computer Monitor
  const monCanvas = document.createElement('canvas');
  monCanvas.width = 512;
  monCanvas.height = 288;
  const mCtx = monCanvas.getContext('2d');
  if (mCtx) {
    const bg = mCtx.createLinearGradient(0, 0, 512, 288);
    bg.addColorStop(0, '#0d1520');
    bg.addColorStop(1, '#162436');
    mCtx.fillStyle = bg;
    mCtx.fillRect(0, 0, 512, 288);

    // Top telemetry status header
    mCtx.fillStyle = '#1e324a';
    mCtx.fillRect(0, 0, 512, 36);
    mCtx.fillStyle = '#4fc3f7';
    mCtx.font = 'bold 15px sans-serif';
    mCtx.fillText('PORSCHE 992.2 TURBO S // PIWIS IV DIAGNOSTICS', 16, 23);

    // Left panel: Dyno / Boost & Tire pressure cards
    mCtx.strokeStyle = '#2b4c6f';
    mCtx.lineWidth = 2;
    mCtx.strokeRect(16, 52, 228, 216);
    mCtx.fillStyle = '#8ab4f8';
    mCtx.font = 'bold 14px sans-serif';
    mCtx.fillText('TWIN-TURBO FLAT-6 TELEMETRY', 28, 78);

    mCtx.strokeStyle = '#00e676';
    mCtx.lineWidth = 3;
    mCtx.beginPath();
    mCtx.moveTo(28, 220);
    mCtx.bezierCurveTo(80, 212, 120, 118, 175, 108);
    mCtx.lineTo(230, 102);
    mCtx.stroke();

    // Right panel: 3D wireframe / system gauges
    mCtx.strokeStyle = '#2b4c6f';
    mCtx.lineWidth = 2;
    mCtx.strokeRect(260, 52, 236, 216);
    for (let g = 0; g < 3; g++) {
      const gx = 306 + g * 72;
      mCtx.strokeStyle = g === 1 ? '#ffb300' : '#29b6f6';
      mCtx.lineWidth = 4;
      mCtx.beginPath();
      mCtx.arc(gx, 132, 24, Math.PI * 0.75, Math.PI * 2.25);
      mCtx.stroke();
    }
    mCtx.fillStyle = '#b0bec5';
    mCtx.font = '13px monospace';
    mCtx.fillText('BATTERY: 14.2V  |  OIL: 90C', 276, 206);
    mCtx.fillText('PCCB TORQUE SPEC: 600 Nm', 276, 234);
  }
  const monTex = new THREE.CanvasTexture(monCanvas);
  monTex.colorSpace = THREE.SRGBColorSpace;

  const monitorGroup = new THREE.Group();
  monitorGroup.name = 'outbuildings.garage.toolBench.southWing.monitor';
  monitorGroup.position.set(-0.04, worktopY + 0.35, benchD * 0.5 - 0.085);
  southWingGroup.add(monitorGroup);

  // Articulated VESA wall-mount bracket attached to the back panel
  const vesaWallPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.12, 0.018),
    dewaltBlackMat
  );
  vesaWallPlate.position.set(0, 0, 0.062);
  monitorGroup.add(vesaWallPlate);

  const vesaArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.045, 0.072),
    anthraciteSteelMat
  );
  vesaArm.position.set(0, 0, 0.03);
  monitorGroup.add(vesaArm);

  // 32-inch 16:9 Bezel Chassis (`0.72m wide x 0.41m high x 0.022m deep`)
  const monitorChassis = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.41, 0.022),
    dewaltBlackMat
  );
  monitorChassis.castShadow = true;
  monitorGroup.add(monitorChassis);

  const monitorScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.70, 0.39),
    new THREE.MeshStandardMaterial({
      map: monTex,
      emissiveMap: monTex,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.65,
      roughness: 0.18,
      metalness: 0.05,
    })
  );
  monitorScreen.name = 'outbuildings.garage.toolBench.southWing.monitor.screen';
  monitorScreen.rotation.y = Math.PI; // Faces `-sz` (North into the Garage!)
  monitorScreen.position.set(0, 0, -0.012);
  monitorGroup.add(monitorScreen);

  // Desk Mat, Wireless Mechanical Keyboard & Mouse on the Butcher-Block Desk under the 32-Inch Monitor
  const deskMat = new THREE.Mesh(
    new THREE.BoxGeometry(0.64, 0.004, 0.30),
    dewaltBlackMat
  );
  deskMat.position.set(-0.04, worktopY + 0.002, -0.06);
  southWingGroup.add(deskMat);

  const keyboardBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.35, 0.014, 0.125),
    aluminumTrimMat
  );
  keyboardBody.position.set(-0.09, worktopY + 0.011, -0.05);
  southWingGroup.add(keyboardBody);

  const mouseBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.062, 0.024, 0.105),
    dewaltBlackMat
  );
  mouseBody.position.set(0.16, worktopY + 0.015, -0.05);
  southWingGroup.add(mouseBody);

  // A. Heavy Cast-Iron Engineer's Bench Vice mounted cleanly at the West front corner of the South Return Wing
  const viceGroup = new THREE.Group();
  viceGroup.name = 'outbuildings.garage.toolBench.vice';
  viceGroup.position.set(-0.68, worktopY, -0.24);
  southWingGroup.add(viceGroup);

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

  // Procedural DeWALT 18V XR 5.0Ah Li-Ion Battery Side Decal Texture
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
  const dewaltBattDecalMat = new THREE.MeshStandardMaterial({
    map: battDecalTex,
    roughness: 0.32,
    metalness: 0.12,
  });

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
  sawBase.position.set(0, 0.024, 0);
  sawBase.castShadow = true;
  sawGroup.add(sawBase);

  // Mitre detents scale ring & red pointer at front of rotary table
  const mitreScaleRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.232, 0.236, 0.012, 28, 1, false, Math.PI * 0.6, Math.PI * 0.8),
    dewaltBlackMat
  );
  mitreScaleRing.position.set(0, 0.038, 0);
  sawGroup.add(mitreScaleRing);

  for (const sideX of [-1, 1] as const) {
    const extWing = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.044, 0.16),
      castAluminumMat
    );
    extWing.position.set(sideX * 0.25, 0.022, 0.02);
    extWing.castShadow = true;
    sawGroup.add(extWing);

    // Sliding workpiece support rails extending from side wings
    for (const rz of [-0.04, 0.08] as const) {
      const extRail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.006, 0.09, 10),
        hssSteelBitMat
      );
      extRail.rotation.z = Math.PI / 2;
      extRail.position.set(sideX * 0.32, 0.026, rz);
      sawGroup.add(extRail);
    }
  }

  const kerfPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.056, 0.004, 0.34),
    dewaltYellowMat
  );
  kerfPlate.position.set(0, 0.049, -0.02);
  sawGroup.add(kerfPlate);

  const kerfSlot = new THREE.Mesh(
    new THREE.BoxGeometry(0.006, 0.005, 0.29),
    dewaltBlackMat
  );
  kerfSlot.position.set(0, 0.05, -0.02);
  sawGroup.add(kerfSlot);

  const mitreArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.068, 0.032, 0.16),
    castAluminumMat
  );
  mitreArm.position.set(0, 0.026, -0.22);
  sawGroup.add(mitreArm);

  const mitreLockKnob = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.018, 0.055, 14),
    dewaltYellowMat
  );
  mitreLockKnob.rotation.x = Math.PI / 2;
  mitreLockKnob.position.set(0, 0.032, -0.31);
  sawGroup.add(mitreLockKnob);

  const mitreDetentTrigger = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, 0.018, 0.035),
    redAccentMat
  );
  mitreDetentTrigger.position.set(0, 0.048, -0.28);
  sawGroup.add(mitreDetentTrigger);

  const fenceBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 0.078, 0.032),
    dewaltBlackMat
  );
  fenceBar.position.set(0, 0.086, 0.068);
  sawGroup.add(fenceBar);

  // Rear bevel quadrant arch & linear slide carriage pillar
  const bevelArch = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.085, 0.036, 20, 1, false, 0, Math.PI),
    castAluminumMat
  );
  bevelArch.rotation.y = Math.PI / 2;
  bevelArch.position.set(0, 0.095, 0.185);
  sawGroup.add(bevelArch);

  // Hold-down material screw clamp on left fence
  const clampPost = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.13, 10),
    dewaltBlackMat
  );
  clampPost.position.set(-0.18, 0.11, 0.09);
  sawGroup.add(clampPost);

  const clampArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.014, 0.095),
    castAluminumMat
  );
  clampArm.position.set(-0.18, 0.165, 0.05);
  sawGroup.add(clampArm);

  const clampPad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.01, 12),
    dewaltYellowMat
  );
  clampPad.position.set(-0.18, 0.13, 0.01);
  sawGroup.add(clampPad);

  for (const rx of [-0.036, 0.036]) {
    const slideRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.013, 0.013, 0.36, 14),
      hssSteelBitMat
    );
    slideRod.rotation.x = Math.PI / 2;
    slideRod.position.set(rx, 0.175, 0.045);
    sawGroup.add(slideRod);
  }

  const railCarriage = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.062, 0.075),
    dewaltBlackMat
  );
  railCarriage.position.set(0, 0.175, 0.19);
  sawGroup.add(railCarriage);

  const sawBlade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.145, 0.145, 0.005, 32),
    hssSteelBitMat
  );
  sawBlade.rotation.z = Math.PI / 2;
  sawBlade.position.set(0, 0.2, -0.015);
  sawGroup.add(sawBlade);

  const bladeArborWasher = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.028, 0.014, 16),
    dewaltBlackMat
  );
  bladeArborWasher.rotation.z = Math.PI / 2;
  bladeArborWasher.position.set(-0.006, 0.2, -0.015);
  sawGroup.add(bladeArborWasher);

  // XPS shadow cut-line LED module at front of upper blade guard
  const xpsLightModule = new THREE.Mesh(
    new THREE.BoxGeometry(0.032, 0.026, 0.042),
    dewaltBlackMat
  );
  xpsLightModule.position.set(0, 0.295, -0.15);
  sawGroup.add(xpsLightModule);

  const bladeGuard = new THREE.Mesh(
    new THREE.CylinderGeometry(0.158, 0.158, 0.044, 24, 1, false, 0, Math.PI * 1.22),
    dewaltYellowMat
  );
  bladeGuard.rotation.z = Math.PI / 2;
  bladeGuard.position.set(0, 0.21, -0.015);
  bladeGuard.castShadow = true;
  sawGroup.add(bladeGuard);

  // Clear polycarbonate lower retracting blade guard
  const lowerClearGuard = new THREE.Mesh(
    new THREE.CylinderGeometry(0.152, 0.152, 0.036, 20, 1, false, Math.PI * 1.1, Math.PI * 0.85),
    clearShieldMat
  );
  lowerClearGuard.rotation.z = Math.PI / 2;
  lowerClearGuard.position.set(0, 0.195, -0.015);
  sawGroup.add(lowerClearGuard);

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

  // Ergonomic D-handle with red safety trigger switch
  const sawHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.048, 0.038, 0.15),
    dewaltBlackMat
  );
  sawHandle.position.set(0.02, 0.33, -0.09);
  sawHandle.rotation.x = 0.32;
  sawGroup.add(sawHandle);

  const dHandleLoop = new THREE.Mesh(
    new THREE.BoxGeometry(0.095, 0.028, 0.034),
    dewaltYellowMat
  );
  dHandleLoop.position.set(0.02, 0.355, -0.155);
  sawGroup.add(dHandleLoop);

  const dHandleTrigger = new THREE.Mesh(
    new THREE.BoxGeometry(0.055, 0.014, 0.022),
    redAccentMat
  );
  dHandleTrigger.position.set(0.02, 0.332, -0.145);
  sawGroup.add(dHandleTrigger);

  const dustBag = new THREE.Mesh(
    new THREE.CylinderGeometry(0.032, 0.044, 0.16, 14),
    dewaltYellowMat
  );
  dustBag.rotation.x = -Math.PI * 0.38;
  dustBag.position.set(0, 0.27, 0.16);
  sawGroup.add(dustBag);

  const dustNozzle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.024, 0.05, 12),
    dewaltBlackMat
  );
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
  grinderPedestal.position.set(0, 0.021, 0);
  grinderGroup.add(grinderPedestal);

  // Integrated front water quench tray + power toggle switch
  const quenchTray = new THREE.Mesh(
    new THREE.BoxGeometry(0.075, 0.024, 0.042),
    castAluminumMat
  );
  quenchTray.position.set(0, 0.014, -0.092);
  grinderGroup.add(quenchTray);

  const switchPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.052, 0.026, 0.012),
    dewaltYellowMat
  );
  switchPlate.position.set(0, 0.028, -0.076);
  grinderGroup.add(switchPlate);

  const rockerButton = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.014, 0.008),
    redAccentMat
  );
  rockerButton.position.set(0, 0.028, -0.084);
  grinderGroup.add(rockerButton);

  const grinderMotor = new THREE.Mesh(
    new THREE.CylinderGeometry(0.072, 0.072, 0.17, 20),
    dewaltYellowMat
  );
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
    coolingFin.rotation.z = Math.PI / 2;
    coolingFin.position.set(fx, 0.12, 0);
    grinderGroup.add(coolingFin);
  }

  const grinderBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.088, 0.034),
    dewaltBadgeMat
  );
  grinderBadge.position.set(0, 0.125, -0.074);
  grinderGroup.add(grinderBadge);

  for (const sideX of [-1, 1] as const) {
    const wheelGuard = new THREE.Mesh(
      new THREE.CylinderGeometry(0.098, 0.098, 0.044, 22),
      dewaltBlackMat
    );
    wheelGuard.rotation.z = Math.PI / 2;
    wheelGuard.position.set(sideX * 0.13, 0.12, 0);
    wheelGuard.castShadow = true;
    grinderGroup.add(wheelGuard);

    const abrasiveWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.085, 0.028, 22),
      sideX < 0 ? aluminumTrimMat : castAluminumMat
    );
    abrasiveWheel.rotation.z = Math.PI / 2;
    abrasiveWheel.position.set(sideX * 0.13, 0.12, -0.014);
    grinderGroup.add(abrasiveWheel);

    const toolRest = new THREE.Mesh(
      new THREE.BoxGeometry(0.042, 0.008, 0.048),
      castAluminumMat
    );
    toolRest.position.set(sideX * 0.13, 0.085, -0.095);
    grinderGroup.add(toolRest);

    const sparkArrestor = new THREE.Mesh(
      new THREE.BoxGeometry(0.038, 0.022, 0.018),
      dewaltYellowMat
    );
    sparkArrestor.position.set(sideX * 0.13, 0.175, -0.068);
    grinderGroup.add(sparkArrestor);

    const shieldBracket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.045, 8),
      hssSteelBitMat
    );
    shieldBracket.rotation.x = 0.4;
    shieldBracket.position.set(sideX * 0.13, 0.185, -0.075);
    grinderGroup.add(shieldBracket);

    const eyeShield = new THREE.Mesh(
      new THREE.BoxGeometry(0.062, 0.052, 0.006),
      clearShieldMat
    );
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
  agUnit.position.set(-0.08, 0, -0.04);
  agUnit.rotation.y = 0.42;
  grinderSanderGroup.add(agUnit);

  const agBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.03, 0.19, 16),
    dewaltYellowMat
  );
  agBody.rotation.z = Math.PI / 2;
  agBody.position.set(0, 0.046, 0);
  agBody.castShadow = true;
  agUnit.add(agBody);

  const agPaddleSwitch = new THREE.Mesh(
    new THREE.BoxGeometry(0.075, 0.01, 0.018),
    dewaltBlackMat
  );
  agPaddleSwitch.position.set(0.02, 0.022, 0);
  agUnit.add(agPaddleSwitch);

  const agBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.072, 0.022),
    dewaltBadgeMat
  );
  agBadge.rotation.x = -Math.PI / 2;
  agBadge.position.set(0, 0.076, 0);
  agUnit.add(agBadge);

  const agTailGrip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.024, 0.08, 16),
    dewaltBlackMat
  );
  agTailGrip.rotation.z = Math.PI / 2;
  agTailGrip.position.set(0.115, 0.046, 0);
  agUnit.add(agTailGrip);

  const agGearHead = new THREE.Mesh(
    new THREE.CylinderGeometry(0.034, 0.036, 0.052, 16),
    castAluminumMat
  );
  agGearHead.position.set(-0.105, 0.046, 0);
  agUnit.add(agGearHead);

  const spindleLockButton = new THREE.Mesh(
    new THREE.CylinderGeometry(0.007, 0.007, 0.01, 10),
    redAccentMat
  );
  spindleLockButton.position.set(-0.105, 0.075, 0);
  agUnit.add(spindleLockButton);

  const agGuard = new THREE.Mesh(
    new THREE.CylinderGeometry(0.068, 0.068, 0.018, 20, 1, false, 0, Math.PI * 1.1),
    dewaltBlackMat
  );
  agGuard.position.set(-0.105, 0.022, 0);
  agUnit.add(agGuard);

  const agDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.062, 0.062, 0.004, 24),
    hssSteelBitMat
  );
  agDisc.position.set(-0.105, 0.018, 0);
  agUnit.add(agDisc);

  const agLockNut = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.016, 0.008, 14),
    dewaltBlackMat
  );
  agLockNut.position.set(-0.105, 0.015, 0);
  agUnit.add(agLockNut);

  const agSideHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.011, 0.11, 12),
    dewaltBlackMat
  );
  agSideHandle.rotation.x = Math.PI / 2;
  agSideHandle.position.set(-0.105, 0.046, -0.072);
  agUnit.add(agSideHandle);

  const sanderUnit = new THREE.Group();
  sanderUnit.position.set(0.12, 0, 0.05);
  sanderUnit.rotation.y = -0.28;
  grinderSanderGroup.add(sanderUnit);

  const sandingPad = new THREE.Mesh(
    new THREE.CylinderGeometry(0.062, 0.062, 0.014, 22),
    dewaltBlackMat
  );
  sandingPad.position.set(0, 0.007, 0);
  sanderUnit.add(sandingPad);

  const sandingDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.061, 0.061, 0.003, 22),
    redAccentMat
  );
  sandingDisc.position.set(0, 0.0015, 0);
  sanderUnit.add(sandingDisc);

  const sanderHousing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.052, 0.088, 18),
    dewaltYellowMat
  );
  sanderHousing.position.set(0, 0.058, 0);
  sanderHousing.castShadow = true;
  sanderUnit.add(sanderHousing);

  const sanderPalmCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.043, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
    dewaltBlackMat
  );
  sanderPalmCap.position.set(0, 0.098, 0);
  sanderUnit.add(sanderPalmCap);

  // Dust collection canister & filter bag at rear of random orbit sander
  const sanderDustBox = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.028, 0.085, 14),
    dewaltBlackMat
  );
  sanderDustBox.rotation.x = Math.PI / 2;
  sanderDustBox.position.set(0, 0.032, -0.072);
  sanderUnit.add(sanderDustBox);

  const sanderBattery = new THREE.Mesh(
    new THREE.BoxGeometry(0.068, 0.042, 0.085),
    dewaltBlackMat
  );
  sanderBattery.position.set(0, 0.052, 0.062);
  sanderUnit.add(sanderBattery);

  const sanderBattCap = new THREE.Mesh(
    new THREE.BoxGeometry(0.066, 0.016, 0.082),
    dewaltYellowMat
  );
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
  tstakCase.position.set(0.12, 0.0675, 0.16);
  tstakCase.castShadow = true;
  drillsGroup.add(tstakCase);

  const tstakLidAccent = new THREE.Mesh(
    new THREE.BoxGeometry(0.29, 0.016, 0.19),
    dewaltYellowMat
  );
  tstakLidAccent.position.set(0.12, 0.138, 0.16);
  drillsGroup.add(tstakLidAccent);

  // Top interlocking stacking ribs & recessed clear organizer compartments on TSTAK lid
  for (const rx of [0.01, 0.12, 0.23] as const) {
    const lidRib = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.008, 0.175),
      dewaltBlackMat
    );
    lidRib.position.set(rx, 0.148, 0.16);
    drillsGroup.add(lidRib);
  }

  // Twin yellow heavy-duty folding front metal/polymer latches + bi-material carry handle
  for (const lx of [0.03, 0.21] as const) {
    const frontLatch = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.044, 0.014),
      dewaltYellowMat
    );
    frontLatch.position.set(lx, 0.105, 0.048);
    drillsGroup.add(frontLatch);

    const sideClip = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.048, 0.042),
      dewaltYellowMat
    );
    sideClip.position.set(lx < 0.12 ? -0.044 : 0.284, 0.072, 0.16);
    drillsGroup.add(sideClip);
  }

  const tstakHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.022, 0.032),
    dewaltYellowMat
  );
  tstakHandle.position.set(0.12, 0.072, 0.036);
  drillsGroup.add(tstakHandle);

  const tstakBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.14, 0.05),
    dewaltBadgeMat
  );
  tstakBadge.rotation.x = -Math.PI / 2;
  tstakBadge.position.set(0.12, 0.153, 0.16);
  drillsGroup.add(tstakBadge);

  // 2. DeWALT DCB132 Dual-Port 18V XR Fast Charger (`x = -0.18m, z = 0.13m`)
  const chargerDock = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.058, 0.165),
    dewaltBlackMat
  );
  chargerDock.position.set(-0.18, 0.029, 0.13);
  chargerDock.castShadow = true;
  drillsGroup.add(chargerDock);

  const chargerYellowTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.242, 0.016, 0.044),
    dewaltYellowMat
  );
  chargerYellowTrim.position.set(-0.18, 0.05, 0.065);
  drillsGroup.add(chargerYellowTrim);

  const chargerFrontBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.095, 0.028),
    dewaltBadgeMat
  );
  chargerFrontBadge.rotation.x = -Math.PI * 0.35;
  chargerFrontBadge.position.set(-0.18, 0.059, 0.065);
  drillsGroup.add(chargerFrontBadge);

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

    const redRelease = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.012, 0.014),
      redAccentMat
    );
    redRelease.position.set(bx, 0.092, 0.07);
    drillsGroup.add(redRelease);

    const chargeLed = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.006, 0.008),
      greenLedMat
    );
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
    battFootBumper.position.set(0, 0.006, 0);
    battFootBumper.castShadow = true;
    drillUnit.add(battFootBumper);

    const battBlackCore = new THREE.Mesh(
      new THREE.BoxGeometry(0.078, 0.032, 0.118),
      dewaltBlackMat
    );
    battBlackCore.position.set(0, 0.026, 0);
    battBlackCore.castShadow = true;
    drillUnit.add(battBlackCore);

    // Left & right procedural `DeWALT 18V XR 5.0Ah` battery side decals
    for (const sideX of [-1, 1] as const) {
      const battDecal = new THREE.Mesh(
        new THREE.PlaneGeometry(0.104, 0.034),
        dewaltBattDecalMat
      );
      battDecal.rotation.y = sideX * (Math.PI / 2);
      battDecal.position.set(sideX * 0.0395, 0.028, 0);
      drillUnit.add(battDecal);
    }

    const battYellowRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.076, 0.018, 0.112),
      dewaltYellowMat
    );
    battYellowRail.position.set(0, 0.051, 0);
    drillUnit.add(battYellowRail);

    // Red spring-loaded battery release latch button at front of pack (`-z`)
    const battReleaseLatch = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.014, 0.016),
      redAccentMat
    );
    battReleaseLatch.position.set(0, 0.048, -0.054);
    drillUnit.add(battReleaseLatch);

    // Rear 3-LED green state-of-charge fuel gauge on back of battery (`+z`)
    for (const lx of [-0.012, 0, 0.012] as const) {
      const socLed = new THREE.Mesh(
        new THREE.BoxGeometry(0.007, 0.005, 0.004),
        greenLedMat
      );
      socLed.position.set(lx, 0.028, 0.059);
      drillUnit.add(socLed);
    }

    // Tool foot base flare + stainless steel belt hook + magnetic bit holder
    const footFlare = new THREE.Mesh(
      new THREE.BoxGeometry(0.058, 0.022, 0.088),
      dewaltYellowMat
    );
    footFlare.position.set(0, 0.068, 0.005);
    drillUnit.add(footFlare);

    const beltHook = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.028, 0.046),
      hssSteelBitMat
    );
    beltHook.position.set(-0.034, 0.064, 0.005);
    drillUnit.add(beltHook);

    // 3B. Ergonomic Contoured Pistol Grip with TPE Rubber Overmold Ribs & Variable-Speed Trigger
    const grip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.019, 0.022, 0.125, 16),
      dewaltYellowMat
    );
    grip.position.set(0, 0.122, 0.012);
    grip.rotation.x = -0.18;
    grip.castShadow = true;
    drillUnit.add(grip);

    const gripRubberBack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0205, 0.0235, 0.092, 16),
      dewaltBlackMat
    );
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
      gripRib.rotation.x = Math.PI / 2 - 0.18;
      gripRib.position.set(0, ribY, 0.018 - (ribY - 0.122) * 0.18);
      drillUnit.add(gripRib);
    }

    // Variable-speed curved index trigger + red forward/reverse push-bar
    const triggerSwitch = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, 0.028, 0.022),
      dewaltBlackMat
    );
    triggerSwitch.position.set(0, 0.154, -0.012);
    triggerSwitch.rotation.x = 0.22;
    drillUnit.add(triggerSwitch);

    const fwdRevSwitch = new THREE.Mesh(
      new THREE.BoxGeometry(0.044, 0.009, 0.012),
      redAccentMat
    );
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
      sideBadge.rotation.y = sideX * (Math.PI / 2);
      sideBadge.position.set(sideX * 0.0345, barrelY + 0.004, barrelZ - 0.01);
      drillUnit.add(sideBadge);

      for (let v = 0; v < 4; v++) {
        const gill = new THREE.Mesh(
          new THREE.BoxGeometry(0.004, 0.022, 0.006),
          dewaltBlackMat
        );
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
    speedSelector.position.set(0, barrelY + 0.034, barrelZ - 0.01);
    drillUnit.add(speedSelector);

    // Sculpted rear black rubber overmold endcap dome
    const rearCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.031, 0.034, 0.026, 20),
      dewaltBlackMat
    );
    rearCap.rotation.x = Math.PI / 2;
    rearCap.position.set(0, barrelY, barrelZ + bodyLen * 0.5 + 0.012);
    drillUnit.add(rearCap);

    const rearDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.031, 16, 12),
      dewaltBlackMat
    );
    rearDome.scale.set(1, 1, 0.45);
    rearDome.position.set(0, barrelY, barrelZ + bodyLen * 0.5 + 0.024);
    drillUnit.add(rearDome);

    if (isHammerDrill) {
      // 3D-A. DeWALT DCD996 Hammer Drill: Torque-Clutch Collar, 2-Stage Metal Gearbox, Keyless Chuck & HSS Twist Drill Bit
      const clutchCollar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.031, 0.033, 0.026, 18),
        dewaltBlackMat
      );
      clutchCollar.rotation.x = Math.PI / 2;
      clutchCollar.position.set(0, barrelY, barrelZ - bodyLen * 0.5 - 0.012);
      drillUnit.add(clutchCollar);

      const gearCaseNose = new THREE.Mesh(
        new THREE.CylinderGeometry(0.024, 0.029, 0.028, 18),
        castAluminumMat
      );
      gearCaseNose.rotation.x = Math.PI / 2;
      gearCaseNose.position.set(0, barrelY, barrelZ - bodyLen * 0.5 - 0.038);
      drillUnit.add(gearCaseNose);

      const keylessChuck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.022, 0.044, 16),
        dewaltBlackMat
      );
      keylessChuck.rotation.x = Math.PI / 2;
      keylessChuck.position.set(0, barrelY, barrelZ - bodyLen * 0.5 - 0.072);
      drillUnit.add(keylessChuck);

      const chuckFrontRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.0155, 0.0022, 8, 16),
        redAccentMat
      );
      chuckFrontRing.position.set(0, barrelY, barrelZ - bodyLen * 0.5 - 0.092);
      drillUnit.add(chuckFrontRing);

      // Helical HSS twist drill bit (`r = 0.0035m, len = 0.078m`) protruding from chuck jaws
      const twistBit = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0032, 0.0035, 0.078, 10),
        hssSteelBitMat
      );
      twistBit.rotation.x = Math.PI / 2;
      twistBit.position.set(0, barrelY, barrelZ - bodyLen * 0.5 - 0.13);
      drillUnit.add(twistBit);

      // Side 360° auxiliary handle with clamp collar
      const auxCollar = new THREE.Mesh(
        new THREE.TorusGeometry(0.028, 0.005, 10, 18),
        dewaltBlackMat
      );
      auxCollar.position.set(0, barrelY, barrelZ - bodyLen * 0.5 - 0.032);
      drillUnit.add(auxCollar);

      const auxHandle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.012, 0.125, 12),
        dewaltBlackMat
      );
      auxHandle.rotation.z = Math.PI / 2;
      auxHandle.position.set(-0.082, barrelY, barrelZ - bodyLen * 0.5 - 0.032);
      drillUnit.add(auxHandle);

      const auxEndCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.014, 12),
        dewaltYellowMat
      );
      auxEndCap.rotation.z = Math.PI / 2;
      auxEndCap.position.set(-0.148, barrelY, barrelZ - bodyLen * 0.5 - 0.032);
      drillUnit.add(auxEndCap);
    } else {
      // 3D-B. DeWALT DCF887 Impact Driver: Cast-Aluminium Anvil Nose, Tri-LED Halo Ring, 1/4" Hex Collet & PZ2 Torsion Bit
      const impactNose = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.032, 0.034, 16),
        castAluminumMat
      );
      impactNose.rotation.x = Math.PI / 2;
      impactNose.position.set(0, barrelY, barrelZ - bodyLen * 0.5 - 0.016);
      drillUnit.add(impactNose);

      // Tri-LED worklight halo ring on front of impact nose
      const triLedHalo = new THREE.Mesh(
        new THREE.TorusGeometry(0.018, 0.003, 8, 16),
        worklightLedMat
      );
      triLedHalo.position.set(0, barrelY, barrelZ - bodyLen * 0.5 - 0.033);
      drillUnit.add(triLedHalo);

      const hexCollet = new THREE.Mesh(
        new THREE.CylinderGeometry(0.011, 0.013, 0.022, 12),
        dewaltBlackMat
      );
      hexCollet.rotation.x = Math.PI / 2;
      hexCollet.position.set(0, barrelY, barrelZ - bodyLen * 0.5 - 0.042);
      drillUnit.add(hexCollet);

      // Black-oxide PZ2 torsion driver bit with yellow torsion band
      const pz2Bit = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0028, 0.0032, 0.05, 6),
        blackOxideBitMat
      );
      pz2Bit.rotation.x = Math.PI / 2;
      pz2Bit.position.set(0, barrelY, barrelZ - bodyLen * 0.5 - 0.072);
      drillUnit.add(pz2Bit);

      const torsionBand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0036, 0.0036, 0.012, 10),
        dewaltYellowMat
      );
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
    wrench.position.set(wx, worktopY + 0.36, pegZ);
    benchGroup.add(wrench);
  }
  for (let sIdx = 0; sIdx < 10; sIdx++) {
    const sx = -0.95 + sIdx * 0.056;
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
    new THREE.BoxGeometry(0.76, 0.05, 0.022),
    dewaltYellowMat
  );
  spiritLevel.position.set(0.02, worktopY + 0.45, pegZ);
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
  mezzanineFloorY: number,
  sharedLightOakMat?: THREE.Material,
  firstFloorGroup?: THREE.Group
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

  // Issue #4 ("In cutaway mode dont show this landing when looking at the ground floor" at `[-0.388, 1.545, 18.162]`,
  // `outbuildings.barn.spiralStaircase.topLanding`):
  // Attach the Mezzanine-level top landing platform (`topLanding`, `landingApron`, `landingEastFascia`, `topNewel`)
  // to `firstFloorGroup` so it hides automatically when viewing the ground floor in cutaway mode!
  const topLandingGroup = new THREE.Group();
  topLandingGroup.name = 'outbuildings.barn.spiralStaircase.topLandingGroup';
  if (firstFloorGroup) {
    topLandingGroup.position.set(centerU, barnLowerFloorY, centerV);
    firstFloorGroup.add(topLandingGroup);
  } else {
    stairGroup.add(topLandingGroup);
  }

  // Issue #2 ("Same material on all of the stairs, and flooring (lighter oak" at `[-0.7, 1.545, 18.308]`):
  // Share the exact `lightJoineryOakMat` lighter oak material across all spiral staircase treads, landing,
  // central column, outer stringer, handrail, and the Mezzanine flooring & Stable stairs!
  const oakTex = createAmericanWhiteOakTexture();
  const fallbackLightOakMat = new THREE.MeshStandardMaterial({
    map: oakTex,
    color: 0xe6cda8,
    roughness: 0.42,
    metalness: 0.03,
  });
  const oakTreadMat: THREE.Material = sharedLightOakMat ?? fallbackLightOakMat;
  const oakHandrailMat: THREE.Material = sharedLightOakMat ?? fallbackLightOakMat;
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

  // Issue #1 ("These bannisters and ballistrages look too much lilke bamboo, it should be oak"):
  // Single continuous turned solid European oak center column with zero segmented bamboo rings!
  const totalColumnH = totalRise + 1.02;
  const columnShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(columnRadius, columnRadius, totalColumnH, 32),
    oakHandrailMat
  );
  columnShaft.name = 'outbuildings.barn.spiralStaircase.centerColumn';
  columnShaft.position.set(0, totalColumnH * 0.5, 0);
  columnShaft.castShadow = true;
  columnShaft.receiveShadow = true;
  columnGroup.add(columnShaft);

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
  // Issue #1 ("Bannisters a bit messed up here" at `[-0.935, 2.521, 18.902]` -> `(u = 21.208m, y = 2.521m, v = 4.735m)`):
  // Set `thetaEnd = Math.PI * 0.82` (`147.6°`, `z = +0.447m, v = 4.947m`) so the 12 helical treads, outer stringer,
  // glass banister panels, and handrail climb monotonically around the South-West curve directly into the shared
  // top landing newel post at `(u = 21.12m, v = 4.85m)` (`x = -0.96m, z = +0.35m`) with zero backward S-kink!
  const thetaStart = -Math.PI * 0.65;
  const thetaEnd = Math.PI * 0.82;
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
  {
    const pos = treadGeo.attributes.position;
    const uv = treadGeo.attributes.uv;
    if (pos && uv) {
      for (let k = 0; k < pos.count; k++) {
        uv.setXY(k, pos.getX(k) * 0.5, pos.getZ(k) * 0.5);
      }
      uv.needsUpdate = true;
    }
  }

  // Issue #2 ("LED light strips underneath each tread" at `[0.439, 0.429, 18.46]`, `outbuildings.barn.spiralStaircase.tread`):
  // Recessed warm 2700K linear LED light strip + anodized aluminium diffuser channel routed into the underside of every tread!
  const treadLedMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e0,
    emissive: new THREE.Color(0xffc668),
    emissiveIntensity: 2.35,
    roughness: 0.18,
    metalness: 0.04,
  });
  const ledChannelMat = new THREE.MeshStandardMaterial({
    color: 0x26292e,
    roughness: 0.38,
    metalness: 0.72,
  });
  const ledStripLen = outerRadius - columnRadius - 0.11; // ~0.685m radial strip length
  const ledRadialCenter = columnRadius + 0.055 + ledStripLen * 0.5;
  const ledLeadingAngle = -halfSweep * 0.62; // Positioned near the leading underside nosing of each fan tread
  const ledChannelGeo = new THREE.BoxGeometry(ledStripLen, 0.008, 0.022);
  const ledDiffuserGeo = new THREE.BoxGeometry(ledStripLen - 0.012, 0.005, 0.014);

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

    // Recessed under-tread LED channel & warm glowing LED strip along the leading edge of the tread underside
    const ledHolder = new THREE.Group();
    ledHolder.rotation.y = -ledLeadingAngle;
    stepContainer.add(ledHolder);

    const ledChannel = new THREE.Mesh(ledChannelGeo, ledChannelMat);
    ledChannel.position.set(ledRadialCenter, -0.003, 0);
    ledHolder.add(ledChannel);

    const ledStrip = new THREE.Mesh(ledDiffuserGeo, treadLedMat);
    ledStrip.name = 'outbuildings.barn.spiralStaircase.treadLedStrip';
    ledStrip.position.set(ledRadialCenter, -0.006, 0);
    ledHolder.add(ledStrip);
  }

  // Warm vertical illumination PointLights along the spiral staircase column for under-tread LED wash
  for (const [lIdx, ly] of [
    [1, totalRise * 0.35],
    [2, totalRise * 0.78],
  ] as const) {
    const stairGlowLight = new THREE.PointLight(0xffc668, 1.15, 3.2, 1.6);
    stairGlowLight.name = `outbuildings.barn.spiralStaircase.treadLedLight.${lIdx}`;
    stairGlowLight.position.set(0, ly, 0);
    stairGroup.add(stairGlowLight);
  }

  // ---------------------------------------------------------------------------
  // 3. Issue #1 ("THis piece of landing should be the same floor as the rest of the mezzanine,
  //    continuous too not a separate piece." at `[-0.72, 1.545, 18.335]`):
  //    The top landing sector (`u = 21.14..22.04m, v = 3.56..4.94m`) is now extruded directly as part
  //    of the single continuous `outbuildings.firstFloor.westRoomSlab` floor mesh in `outbuildings-and-barns.ts`
  //    (using `mezzaninePlankFloorMat` and continuous world-space plank UVs), eliminating any separate landing piece or seam!
  // ---------------------------------------------------------------------------

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
  const handrailHeightAboveTread = 0.86;
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

  // Smooth tangent transition from `thetaEnd = 147.6°` (`x = -0.705, z = +0.447`) directly into the shared
  // top landing newel post at `(x = -0.96, z = +0.35)` (`u = 21.12m, v = 4.85m, y = mezzanineFloorY + 0.86m`)
  handrailCurvePoints.push(
    new THREE.Vector3(-0.83, totalRise + handrailHeightAboveTread, 0.39),
    new THREE.Vector3(-0.96, totalRise + handrailHeightAboveTread, 0.35)
  );

  const handrailCurve = new THREE.CatmullRomCurve3(handrailCurvePoints);
  const handrailTubeGeo = new THREE.TubeGeometry(handrailCurve, 120, 0.026, 16, false);
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

  // Shared top landing turned cylindrical newel post at `(-0.96, z = 0.35)` -> `(u = 21.12m, v = 4.85m)`
  const topNewelH = 0.92;
  const topNewel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.034, 0.038, topNewelH, 20),
    oakHandrailMat
  );
  topNewel.name = 'outbuildings.barn.spiralStaircase.newelPost';
  topNewel.position.set(-0.96, totalRise + topNewelH * 0.5, 0.35);
  topNewel.castShadow = true;
  topLandingGroup.add(topNewel);

  const topNewelCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.042, 16, 12),
    oakHandrailMat
  );
  topNewelCap.position.set(-0.96, totalRise + topNewelH + 0.014, 0.35);
  topLandingGroup.add(topNewelCap);

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

  // Top landing return glass banister panel bridging along the tangent from `(-0.705, 0.447)` to the shared newel post `(-0.96, 0.35)`
  const topReturnGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.23, 0.74, glassThickR),
    glassBanisterMat
  );
  topReturnGlass.name = 'outbuildings.barn.spiralStaircase.glassBanister';
  topReturnGlass.position.set(-0.832, totalRise + 0.45, 0.398);
  topReturnGlass.rotation.y = -0.363;
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

  // Issue #4 ("Maybe we move this foam wall left slightly so the golf sim is enclosed and you can walk freely in and out"
  // at `[-7.953, 0.342, 15.426]`):
  // Shifted the North side wall of the Golf Simulator South ("left" when looking at the simulator from the Barn)
  // from `v = 0.615m` to `v = 1.52m` (`v = 1.52m..5.095m`, `clearW = 3.575m`, centered at `v = 3.3075m`) so the Golf Simulator
  // is 100% enclosed on all 3 sides while leaving a dedicated, unobstructed `1.10m`-wide hallway (`v = 0.282m..1.38m`)
  // on the North side to walk freely between the Garage and the Barn!
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
    new THREE.BoxGeometry(0.08, frameTrimW, clearW),
    velvetFrameMat
  );
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

  // Issue #3 ("Trackman and projector seem to be inside the wall" at `[-6.981, 2.651, 17.826]`, `outbuildings.barn.golfSimulator.trackmanIO`):
  // Mount both the 4K Short-Throw Laser Projector (`x = -1.04m`, `u = 14.16m`) and the TrackMan iO Launch Monitor (`x = -0.52m`, `u = 14.68m`)
  // cleanly inside the simulator enclosure ceiling (`localY = 2.58m` & `2.62m`, `worldY = 2.24m` & `2.28m`), completely clear of the
  // `u = 14.96..15.20m` (`x = -0.24..0.00m`) Store/Barn brick cross-wall, with compact ceiling mount stems terminating flush against
  // the simulator's acoustic ceiling baffles (`localY = 2.82m`) so nothing protrudes through the wall or simulator roof lid!
  const projectorGroup = new THREE.Group();
  projectorGroup.name = 'outbuildings.barn.golfSimulator.projector';
  projectorGroup.position.set(-1.04, 2.58, 0);
  simCeilingGroup.add(projectorGroup);

  const dropPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 0.24, 12),
    projectorBodyMat
  );
  dropPole.position.set(0, 0.12, 0);
  projectorGroup.add(dropPole);

  const projectorMountFlange = new THREE.Mesh(
    new THREE.CylinderGeometry(0.068, 0.068, 0.014, 16),
    projectorBodyMat
  );
  projectorMountFlange.position.set(0, 0.233, 0);
  projectorGroup.add(projectorMountFlange);

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
  tmGroup.position.set(-0.52, 2.62, 0);
  simCeilingGroup.add(tmGroup);

  const tmDropTube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.20, 12),
    projectorBodyMat
  );
  tmDropTube.position.set(0, 0.10, 0);
  tmGroup.add(tmDropTube);

  const tmMountFlange = new THREE.Mesh(
    new THREE.CylinderGeometry(0.062, 0.062, 0.014, 16),
    projectorBodyMat
  );
  tmMountFlange.position.set(0, 0.193, 0);
  tmGroup.add(tmMountFlange);

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

  // ---------------------------------------------------------------------------
  // Issue #5 ("Add a callaway tour golf bag here" at `[-6.028, -0.306, 19.306]` ->
  // Outbuilding `(u = 16.099m, y = -0.306m, v = 4.701m)` -> `simGroup` local `(0.90, 0.034, 1.48)`):
  // High-LOD Callaway Tour Staff Golf Bag & 14-Club Set (`outbuildings.barn.golfSimulator.callawayTourBag`)
  // ---------------------------------------------------------------------------
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
  bagGroup.position.set(0.9, 0.034, 1.48);
  bagGroup.rotation.y = -0.45;
  simGroup.add(bagGroup);

  const bagTiltGroup = new THREE.Group();
  bagTiltGroup.rotation.z = 0.05;
  bagGroup.add(bagTiltGroup);

  const baseBoot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.138, 0.132, 0.075, 24),
    tourBlackTrimMat
  );
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
    pipingBand.position.set(0.115, 0.46, sideZ * 0.115);
    bagTiltGroup.add(pipingBand);
  }

  const frontBallPocket = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.36, 0.18),
    tourWhitePanelMat
  );
  frontBallPocket.position.set(-0.125, 0.28, 0);
  frontBallPocket.castShadow = true;
  bagTiltGroup.add(frontBallPocket);

  const upperValuablesPocket = new THREE.Mesh(
    new THREE.BoxGeometry(0.085, 0.22, 0.16),
    tourNavyLeatherMat
  );
  upperValuablesPocket.position.set(-0.118, 0.61, 0);
  upperValuablesPocket.castShadow = true;
  bagTiltGroup.add(upperValuablesPocket);

  const rearApparelPocket = new THREE.Mesh(
    new THREE.BoxGeometry(0.115, 0.64, 0.19),
    tourNavyLeatherMat
  );
  rearApparelPocket.position.set(0.128, 0.44, 0);
  rearApparelPocket.castShadow = true;
  bagTiltGroup.add(rearApparelPocket);

  const tourShoulderStrap = new THREE.Mesh(
    new THREE.BoxGeometry(0.048, 0.54, 0.095),
    tourBlueAccentMat
  );
  tourShoulderStrap.position.set(0.195, 0.52, 0);
  tourShoulderStrap.rotation.z = -0.14;
  tourShoulderStrap.castShadow = true;
  bagTiltGroup.add(tourShoulderStrap);

  const grabHandle = new THREE.Mesh(
    new THREE.TorusGeometry(0.055, 0.013, 10, 18, Math.PI),
    tourBlackTrimMat
  );
  grabHandle.rotation.z = -Math.PI / 2;
  grabHandle.position.set(0.135, 0.78, 0);
  bagTiltGroup.add(grabHandle);

  const topCuffTorus = new THREE.Mesh(
    new THREE.TorusGeometry(0.126, 0.022, 14, 28),
    tourBlackTrimMat
  );
  topCuffTorus.rotation.x = Math.PI / 2;
  topCuffTorus.position.set(0, 0.865, 0);
  bagTiltGroup.add(topCuffTorus);

  for (const divX of [-0.045, 0.045] as const) {
    const divBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.03, 0.23),
      tourBlackTrimMat
    );
    divBar.position.set(divX, 0.865, 0);
    bagTiltGroup.add(divBar);
  }
  const centerLengthDiv = new THREE.Mesh(
    new THREE.BoxGeometry(0.23, 0.03, 0.012),
    tourBlackTrimMat
  );
  centerLengthDiv.position.set(0, 0.865, 0);
  bagTiltGroup.add(centerLengthDiv);

  const towelRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.024, 0.004, 10, 18),
    chromeClubMat
  );
  towelRing.position.set(-0.04, 0.82, -0.145);
  bagTiltGroup.add(towelRing);

  const golfTowel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.036, 0.42, 12),
    tourWhitePanelMat
  );
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
  for (const [wx, wz, topY, headR, headH] of woodSpecs) {
    const shaftLen = topY - 0.82;
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.005, shaftLen, 10),
      graphiteShaftMat
    );
    shaft.position.set(wx, 0.82 + shaftLen * 0.5, wz);
    bagTiltGroup.add(shaft);

    const sockNeck = new THREE.Mesh(
      new THREE.CylinderGeometry(headR * 0.58, headR * 0.45, 0.11, 14),
      tourNavyLeatherMat
    );
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
  for (const [ix, iz, iTopY, iRotY] of ironPositions) {
    const sLen = iTopY - 0.82;
    const ironShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.0045, sLen, 8),
      chromeClubMat
    );
    ironShaft.position.set(ix, 0.82 + sLen * 0.5, iz);
    bagTiltGroup.add(ironShaft);

    const ironHeadGroup = new THREE.Group();
    ironHeadGroup.position.set(ix, iTopY, iz);
    ironHeadGroup.rotation.y = iRotY;
    bagTiltGroup.add(ironHeadGroup);

    const hosel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.0055, 0.032, 10),
      chromeClubMat
    );
    hosel.position.set(0, 0.01, 0);
    ironHeadGroup.add(hosel);

    const bladeHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.032, 0.068),
      chromeClubMat
    );
    bladeHead.name = 'outbuildings.barn.golfSimulator.callawayTourBag.iron';
    bladeHead.position.set(-0.008, 0.024, 0.028);
    bladeHead.rotation.x = -0.28;
    bladeHead.rotation.z = 0.32;
    bladeHead.castShadow = true;
    ironHeadGroup.add(bladeHead);
  }

  const putterShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0055, 0.005, 0.18, 10),
    chromeClubMat
  );
  putterShaft.position.set(-0.092, 0.91, 0.012);
  bagTiltGroup.add(putterShaft);

  const putterHeadcover = new THREE.Mesh(
    new THREE.BoxGeometry(0.056, 0.042, 0.092),
    tourBlueAccentMat
  );
  putterHeadcover.position.set(-0.105, 1.005, 0.012);
  putterHeadcover.castShadow = true;
  bagTiltGroup.add(putterHeadcover);

  // ---------------------------------------------------------------------------
  // Issue #7 ("computer monitor for golf sim here" at `[-5.071, 0.365, 19.955]`,
  // Surface Normal `[-0.086, 0, -0.996]` -> Outbuilding `(u = 17.00m, y = 0.365m, v = 5.429m)`):
  // Wall-Mounted TrackMan Golf Simulator Control Computer Monitor & Console (`outbuildings.barn.golfSimulator.controlMonitor`)
  // mounted on the interior North-facing (`-z`) face of the Barn South Wall (`v = 5.415m`) right next to the Golf Simulator bay!
  // ---------------------------------------------------------------------------
  const controlGroup = new THREE.Group();
  controlGroup.name = 'outbuildings.barn.golfSimulator.controlMonitor';
  controlGroup.position.set(17.0, 0, 5.415);
  controlGroup.rotation.y = Math.PI; // Local `+z` projects North (`-v`) into the Barn!
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

  // 1. Floating Solid-Oak & Matte-Anthracite Control Console Shelf at `y = 0.365m` (exact hit elevation!)
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
  shelfFrontTrim.position.set(0, shelfY, shelfD + 0.002);
  controlGroup.add(shelfFrontTrim);

  // Concealed steel wall brackets supporting the floating console shelf
  for (const bx of [-0.26, 0.26] as const) {
    const bracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.11, 0.22),
      consoleAnthraciteMat
    );
    bracket.position.set(bx, shelfY - 0.068, 0.11);
    controlGroup.add(bracket);
  }

  // Dark micro-woven desk mat + Wireless Mechanical Keyboard + Precision Mouse + Brushed-Aluminium TrackMan Control Dial Puck
  const deskPad = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.004, 0.21),
    velvetFrameMat
  );
  deskPad.position.set(0, shelfY + shelfH * 0.5 + 0.002, 0.145);
  controlGroup.add(deskPad);

  const kbChassis = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.012, 0.115),
    consoleAluminumMat
  );
  kbChassis.position.set(-0.08, shelfY + shelfH * 0.5 + 0.01, 0.145);
  kbChassis.rotation.x = 0.06;
  kbChassis.castShadow = true;
  controlGroup.add(kbChassis);

  for (let row = 0; row < 5; row++) {
    const keyRow = new THREE.Mesh(
      new THREE.BoxGeometry(0.295, 0.005, 0.014),
      consoleAnthraciteMat
    );
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
  simMouse.position.set(0.16, shelfY + shelfH * 0.5 + 0.014, 0.145);
  simMouse.castShadow = true;
  controlGroup.add(simMouse);

  const rotaryPuck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.03, 0.018, 20),
    consoleAluminumMat
  );
  rotaryPuck.position.set(-0.29, shelfY + shelfH * 0.5 + 0.011, 0.145);
  controlGroup.add(rotaryPuck);

  const rotaryRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.028, 0.003, 8, 20),
    trackManOrangeMat
  );
  rotaryRing.rotation.x = Math.PI / 2;
  rotaryRing.position.set(-0.29, shelfY + shelfH * 0.5 + 0.019, 0.145);
  controlGroup.add(rotaryRing);

  // 2. Compact Matte-Black Custom Sim PC / TrackMan Processing Unit mounted on wall cradle below shelf (`y = 0.08..0.30m`)
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
  pcOrangeStrip.position.set(0, 0.24, 0.127);
  controlGroup.add(pcOrangeStrip);

  // Braided HDMI / Cat6 cable management conduit rising from shelf to monitor
  const cableConduit = new THREE.Mesh(
    new THREE.BoxGeometry(0.036, 0.34, 0.016),
    consoleAnthraciteMat
  );
  cableConduit.position.set(0, 0.51, 0.008);
  controlGroup.add(cableConduit);

  // 3. Articulated Heavy-Duty VESA Wall Arm & 27-Inch 16:9 Touchscreen Control Monitor (`y = 0.68m`, `0.62m W x 0.36m H`)
  const tmCtrlCanvas = document.createElement('canvas');
  tmCtrlCanvas.width = 512;
  tmCtrlCanvas.height = 288;
  const tmCtx = tmCtrlCanvas.getContext('2d');
  if (tmCtx) {
    const bg = tmCtx.createLinearGradient(0, 0, 0, 288);
    bg.addColorStop(0, '#0f1722');
    bg.addColorStop(1, '#182434');
    tmCtx.fillStyle = bg;
    tmCtx.fillRect(0, 0, 512, 288);

    // TrackMan Orange Top Header Bar
    tmCtx.fillStyle = '#ff6b00';
    tmCtx.fillRect(0, 0, 512, 34);
    tmCtx.fillStyle = '#ffffff';
    tmCtx.font = 'bold 16px sans-serif';
    tmCtx.fillText('TRACKMAN iO // SHOT ANALYSIS & COURSE CONTROL', 16, 23);

    // Left 3D Fairway Dispersion & Trajectory View
    tmCtx.fillStyle = '#1b3d28';
    tmCtx.fillRect(14, 46, 268, 156);
    tmCtx.strokeStyle = '#2e6b44';
    tmCtx.lineWidth = 1.5;
    tmCtx.strokeRect(14, 46, 268, 156);

    // Tracer arc
    tmCtx.strokeStyle = '#ff6b00';
    tmCtx.lineWidth = 3.5;
    tmCtx.beginPath();
    tmCtx.moveTo(148, 194);
    tmCtx.quadraticCurveTo(132, 62, 146, 76);
    tmCtx.stroke();

    // Right Telemetry Data Tiles
    const metrics: ReadonlyArray<readonly [string, string, number, number]> = [
      ['CLUB SPEED', '114.2 mph', 296, 46],
      ['BALL SPEED', '169.8 mph', 404, 46],
      ['SMASH FACTOR', '1.49', 296, 126],
      ['LAUNCH ANGLE', '11.8 deg', 404, 126],
      ['SPIN RATE', '2,380 rpm', 14, 212],
      ['CARRY', '286.4 yds', 180, 212],
      ['TOTAL', '308.1 yds', 346, 212],
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
      tmCtx.font = 'bold 17px monospace';
      tmCtx.fillText(val, mx + 8, my + 48);
    }
  }
  const tmCtrlTex = new THREE.CanvasTexture(tmCtrlCanvas);
  tmCtrlTex.colorSpace = THREE.SRGBColorSpace;

  const monMountPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.12, 0.016),
    consoleAnthraciteMat
  );
  monMountPlate.position.set(0, 0.68, 0.008);
  controlGroup.add(monMountPlate);

  const monArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.045, 0.085),
    consoleAnthraciteMat
  );
  monArm.position.set(0, 0.68, 0.052);
  controlGroup.add(monArm);

  const monHeadGroup = new THREE.Group();
  monHeadGroup.position.set(0, 0.68, 0.095);
  monHeadGroup.rotation.x = -0.06; // Tilted slightly toward the standing player
  controlGroup.add(monHeadGroup);

  const monBezel = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.36, 0.022),
    consoleAnthraciteMat
  );
  monBezel.name = 'outbuildings.barn.golfSimulator.controlMonitor';
  monBezel.castShadow = true;
  monHeadGroup.add(monBezel);

  const monDisplay = new THREE.Mesh(
    new THREE.PlaneGeometry(0.596, 0.336),
    new THREE.MeshStandardMaterial({
      map: tmCtrlTex,
      emissiveMap: tmCtrlTex,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.55,
      roughness: 0.18,
      metalness: 0.05,
    })
  );
  monDisplay.name = 'outbuildings.barn.golfSimulator.controlMonitor.screen';
  monDisplay.position.set(0, 0, 0.012);
  monHeadGroup.add(monDisplay);
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
  // Shifted to `u = 10.48m` on the Garage South wall (`u = 8.92m..12.04m` East bay, freed up by moving `southWing`
  // to in front of the Shower Room) so it does not overlap the new Shower Room (`u = 5.97m..8.92m`)!
  rackGroup.position.set(10.48, garageFloorTopY + 0.706, 5.415);
  rackGroup.rotation.y = Math.PI;
  rackGroup.scale.set(0.76, 0.76, 0.76);
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

/**
 * Generates the metallic silver & charcoal `TECHNOGYM` brand badge texture
 * for the Run Personal side rails and front motor cover hood.
 */
function createTechnogymBadgeTexture(): THREE.CanvasTexture {
  const w = 256;
  const h = 80;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#d8dde4';
  ctx.beginPath();
  ctx.roundRect(6, 10, w - 12, h - 20, 8);
  ctx.fill();

  ctx.fillStyle = '#181b20';
  ctx.beginPath();
  ctx.roundRect(12, 16, w - 24, h - 32, 5);
  ctx.fill();

  ctx.fillStyle = '#eef2f7';
  ctx.font = '900 28px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TECHNOGYM', w * 0.5, h * 0.5 + 1);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates the textured elastomer running belt texture (`512x1024`) for the Technogym Run Personal,
 * including fine diamond-grip micro-weave and the two horizontal silver/white segmented pace-marker
 * stripes near the rear of the running surface (`media_1791211838942_1b3a987a.png`).
 */
function createTechnogymBeltTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#24272c';
  ctx.fillRect(0, 0, w, h);

  // Subtle longitudinal track wear sheen down the center of the belt
  const trackGrad = ctx.createLinearGradient(0, 0, w, 0);
  trackGrad.addColorStop(0, 'rgba(15, 17, 20, 0.35)');
  trackGrad.addColorStop(0.2, 'rgba(48, 53, 60, 0.12)');
  trackGrad.addColorStop(0.5, 'rgba(62, 68, 76, 0.18)');
  trackGrad.addColorStop(0.8, 'rgba(48, 53, 60, 0.12)');
  trackGrad.addColorStop(1, 'rgba(15, 17, 20, 0.35)');
  ctx.fillStyle = trackGrad;
  ctx.fillRect(0, 0, w, h);

  // Fine high-grip elastomer diamond micro-texture
  for (let y = 0; y < h; y += 4) {
    for (let x = 0; x < w; x += 4) {
      const n = Math.sin(x * 17.3 + y * 31.7) * 43758.5453;
      const f = n - Math.floor(n);
      ctx.fillStyle = f > 0.5 ? 'rgba(255, 255, 255, 0.045)' : 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(x, y, 2, 2);
    }
  }

  // Signature twin horizontal segmented silver-grey pace marker bands near rear of belt
  const segXs = [
    [68, 34],
    [118, 58],
    [194, 124],
    [336, 58],
    [410, 34],
  ] as const;
  for (const bandY of [718, 756] as const) {
    ctx.fillStyle = '#b8bec7';
    for (const [sx, sw] of segXs) {
      ctx.fillRect(sx, bandY, sw, 14);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/**
 * Generates the 21.5" Full-HD Technogym Live touchscreen UI texture (`1024x640`)
 * matching `media_1791211838942_1b3a987a.png`:
 * - Dark tempered-glass bezel frame with top status header
 * - 2x3 grid of Technogym Live workout tiles (Yellow Studio Session, Dark Routines,
 *   Alpine Mountain Outdoor Trail, Bright Coach Studio, Red Canyon HIIT, Custom Metrics)
 * - Prominent emerald-green `START` button centered at the bottom.
 */
function createTechnogymLiveScreenTexture(): THREE.CanvasTexture {
  const w = 1024;
  const h = 640;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // 1. Tempered black glass outer bezel
  ctx.fillStyle = '#14171c';
  ctx.fillRect(0, 0, w, h);

  // Inner active LCD viewport (`x = 56..968, y = 44..596`)
  const vx = 56;
  const vy = 44;
  const vw = w - 112;
  const vh = h - 88;
  ctx.fillStyle = '#20242b';
  ctx.beginPath();
  ctx.roundRect(vx, vy, vw, vh, 10);
  ctx.fill();

  // Top status bar
  ctx.fillStyle = '#9aa3b0';
  ctx.font = '700 18px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('TECHNOGYM LIVE', vx + 24, vy + 32);

  // Top-right user profile & connectivity icons
  ctx.fillStyle = '#d5dce6';
  ctx.beginPath();
  ctx.arc(vx + vw - 38, vy + 26, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#20242b';
  ctx.font = '700 14px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('AM', vx + vw - 38, vy + 31);

  // 2x3 Workout Tile Grid
  const gridX = vx + 24;
  const gridY = vy + 52;
  const colW = 278;
  const rowH = 192;
  const gap = 16;

  // Tile (0, 0): Golden Studio Trainer Session
  {
    const tx = gridX;
    const ty = gridY;
    const g = ctx.createLinearGradient(tx, ty, tx + colW, ty + rowH);
    g.addColorStop(0, '#c89b28');
    g.addColorStop(0.6, '#eab938');
    g.addColorStop(1, '#8c6514');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(tx, ty, colW, rowH, 8);
    ctx.fill();

    // Trainer figure silhouette
    ctx.fillStyle = '#1f232a';
    ctx.beginPath();
    ctx.arc(tx + colW * 0.62, ty + 68, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(tx + colW * 0.48, ty + 94, 76, 86, 18);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 20px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SESSIONS', tx + 18, ty + rowH - 22);
  }

  // Tile (1, 0): Dark Charcoal Routines Card
  {
    const tx = gridX + colW + gap;
    const ty = gridY;
    const g = ctx.createLinearGradient(tx, ty, tx, ty + rowH);
    g.addColorStop(0, '#323842');
    g.addColorStop(1, '#1d2127');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(tx, ty, colW, rowH, 8);
    ctx.fill();

    ctx.strokeStyle = '#f5c400';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(tx + colW * 0.5, ty + 82, 36, -Math.PI * 0.4, Math.PI * 1.25);
    ctx.stroke();

    ctx.fillStyle = '#eef2f6';
    ctx.font = '800 20px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ROUTINES', tx + colW * 0.5, ty + rowH - 22);
  }

  // Tile (2, 0): Alpine Mountain Outdoor Landscape
  {
    const tx = gridX + (colW + gap) * 2;
    const ty = gridY;
    const sky = ctx.createLinearGradient(tx, ty, tx, ty + rowH);
    sky.addColorStop(0, '#1e88e5');
    sky.addColorStop(0.55, '#81d4fa');
    sky.addColorStop(0.56, '#2e6b4e');
    sky.addColorStop(1, '#1b4332');
    ctx.fillStyle = sky;
    ctx.beginPath();
    ctx.roundRect(tx, ty, colW, rowH, 8);
    ctx.fill();

    // Snow-capped mountain peaks
    ctx.fillStyle = '#e8f1f8';
    ctx.beginPath();
    ctx.moveTo(tx + 24, ty + 115);
    ctx.lineTo(tx + 96, ty + 42);
    ctx.lineTo(tx + 158, ty + 98);
    ctx.lineTo(tx + 212, ty + 52);
    ctx.lineTo(tx + colW - 16, ty + 115);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 20px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('OUTDOORS', tx + 18, ty + rowH - 22);
  }

  // Tile (0, 1): Bright Studio Card
  {
    const tx = gridX;
    const ty = gridY + rowH + gap;
    const g = ctx.createLinearGradient(tx, ty, tx + colW, ty + rowH);
    g.addColorStop(0, '#e8ecf2');
    g.addColorStop(1, '#b8c2d0');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(tx, ty, colW, rowH, 8);
    ctx.fill();

    ctx.fillStyle = '#252a32';
    ctx.beginPath();
    ctx.arc(tx + 88, ty + 76, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(tx + 68, ty + 102, 42, 64);

    ctx.fillStyle = '#181c22';
    ctx.font = '800 20px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('COACH', tx + 18, ty + rowH - 22);
  }

  // Tile (1, 1): Terracotta / Coral HIIT Canyon Card
  {
    const tx = gridX + colW + gap;
    const ty = gridY + rowH + gap;
    const g = ctx.createLinearGradient(tx, ty, tx + colW, ty + rowH);
    g.addColorStop(0, '#e06d53');
    g.addColorStop(0.5, '#c84b31');
    g.addColorStop(1, '#7a2818');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.roundRect(tx, ty, colW, rowH, 8);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 20px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('INTENSITY', tx + 18, ty + rowH - 22);
  }

  // Tile (2, 1): 2x2 Custom Metric Target Buttons
  {
    const tx = gridX + (colW + gap) * 2;
    const ty = gridY + rowH + gap;
    const subW = (colW - 12) * 0.5;
    const subH = (rowH - 12) * 0.5;
    const labels = ['TIME', 'DIST', 'KCAL', 'BPM'] as const;
    const colors = ['#4fc3f7', '#ffb74d', '#81c784', '#e57373'] as const;
    for (let i = 0; i < 4; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = tx + col * (subW + 12);
      const by = ty + row * (subH + 12);
      ctx.fillStyle = '#2b3038';
      ctx.beginPath();
      ctx.roundRect(bx, by, subW, subH, 6);
      ctx.fill();

      ctx.strokeStyle = colors[i]!;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(bx + 32, by + subH * 0.5, 14, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#dce2ea';
      ctx.font = '700 16px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(labels[i]!, bx + 56, by + subH * 0.5 + 6);
    }
  }

  // Bottom bar with signature emerald-green `START` button (`media_1791211838942_1b3a987a.png`)
  const btnW = 168;
  const btnH = 54;
  const btnX = (w - btnW) * 0.5;
  const btnY = vy + vh - 68;
  ctx.fillStyle = '#22b55b';
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 8);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 22px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('START', w * 0.5, btnY + btnH * 0.5 + 1);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Builds the **Technogym Run Personal** treadmill (designed by Antonio Citterio) in the GYM
 * (`outbuildings.gym.technogymRunPersonal`), matching the uploaded reference photo
 * (`media_1791211838942_1b3a987a.png`):
 * - Dimensions: `2.01m` long (`z = -1.005..+1.005m`) x `0.80m` wide (`x = -0.40..+0.40m`) x `1.47m` high (`y = 0..1.47m`)
 * - Matte charcoal side foot rails with non-slip ribbed tread inlays, rounded rear roller caps, and `TECHNOGYM` badges
 * - `1.45m x 0.51m` elastomer running belt with silver segmented pace-marker stripes
 * - Sculpted two-tone front motor hood with flush silver `TECHNOGYM` badge
 * - Iconic mirror-polished cast-aluminium triangular A-frame side uprights (`ExtrudeGeometry` with triangular `.holes` window)
 *   rising seamlessly into the tilted 21.5" console side cheeks
 * - Closed-loop soft-touch black ergonomic side handrails + polished chrome front heart-rate crossbar, dual bottle holders,
 *   and red emergency safety key clip
 * - 21.5" Full-HD tempered-glass **Technogym Live** touchscreen console.
 */
export function buildGymTechnogymRunPersonal(
  groundGroup: THREE.Group,
  gymFloorY: number
): void {
  const runGroup = new THREE.Group();
  runGroup.name = 'outbuildings.gym.technogymRunPersonal';
  runGroup.userData.zone = 'courtyard';
  // Placed in the GYM (`u = 3.10m, v = 3.55m`) facing East (`+u`, `rotation.y = Math.PI / 2`)
  // toward the panoramic 3.40m Garage viewing window so the runner looks straight through to the Porsche 992.2 Turbo S!
  // Issue #6 ("Move this clloser to the wall and slightly to the right to make getting to toilet easier"
  // at `[-18.144, -0.392, 19.851]`, `outbuildings.gym.technogymRunPersonal.runningBelt`):
  // Moved closer to the South wall (`v = 4.32m`, tucking the front nose near `v = 5.30m`) and slightly to the right/West
  // (`u = 3.68m`), opening a wide, unobstructed 1.80m walkway to the Gym-to-Shower/Toilet Room door!
  runGroup.position.set(3.88, gymFloorY, 4.32);
  runGroup.rotation.y = -0.0015;
  groundGroup.add(runGroup);

  const matteCharcoalMat = new THREE.MeshStandardMaterial({
    color: 0x1e2126,
    roughness: 0.44,
    metalness: 0.18,
  });
  const darkAnthraciteMat = new THREE.MeshStandardMaterial({
    color: 0x2a2e35,
    roughness: 0.36,
    metalness: 0.32,
  });
  const nonSlipRubberMat = new THREE.MeshStandardMaterial({
    color: 0x15171b,
    roughness: 0.78,
    metalness: 0.06,
  });
  const softTouchGripMat = new THREE.MeshStandardMaterial({
    color: 0x1b1e23,
    roughness: 0.56,
    metalness: 0.1,
  });
  const polishedCastAluMat = new THREE.MeshStandardMaterial({
    color: 0xf2f6fa,
    roughness: 0.07,
    metalness: 0.96,
  });
  const brushedSteelMat = new THREE.MeshStandardMaterial({
    color: 0xd0d6de,
    roughness: 0.24,
    metalness: 0.88,
  });
  const emergencyRedMat = new THREE.MeshStandardMaterial({
    color: 0xe52420,
    roughness: 0.3,
    metalness: 0.1,
  });
  const runningBeltMat = new THREE.MeshStandardMaterial({
    map: createTechnogymBeltTexture(),
    roughness: 0.68,
    metalness: 0.06,
  });
  const technogymBadgeMat = new THREE.MeshStandardMaterial({
    map: createTechnogymBadgeTexture(),
    roughness: 0.25,
    metalness: 0.75,
  });
  const screenDisplayMat = new THREE.MeshStandardMaterial({
    map: createTechnogymLiveScreenTexture(),
    emissive: new THREE.Color(0xffffff),
    emissiveMap: createTechnogymLiveScreenTexture(),
    emissiveIntensity: 0.32,
    roughness: 0.12,
    metalness: 0.15,
  });
  const darkBezelGlassMat = new THREE.MeshStandardMaterial({
    color: 0x101318,
    roughness: 0.08,
    metalness: 0.35,
  });

  // ---------------------------------------------------------------------------
  // 1. Base Sub-Frame, Rear Adjustable Leveling Feet & Front Transport Wheels
  // ---------------------------------------------------------------------------
  const subFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.64, 0.075, 1.72),
    nonSlipRubberMat
  );
  subFrame.position.set(0, 0.078, -0.02);
  subFrame.castShadow = true;
  subFrame.receiveShadow = true;
  runGroup.add(subFrame);

  // Rear leveling feet (`z = -0.60m, x = ±0.30m`) visible beneath the side rails in the reference photo
  for (const sideX of [-1, 1] as const) {
    const footPad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.044, 0.048, 0.016, 18),
      nonSlipRubberMat
    );
    footPad.position.set(sideX * 0.3, 0.008, -0.6);
    runGroup.add(footPad);

    const footStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.055, 12),
       matteCharcoalMat
    );
    footStem.position.set(sideX * 0.3, 0.04, -0.6);
    runGroup.add(footStem);

    // Front transport roller wheel (`z = +0.84m, x = ±0.325m`)
    const frontWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.026, 16),
      nonSlipRubberMat
    );
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(sideX * 0.325, 0.034, 0.84);
    runGroup.add(frontWheel);

    const wheelAxlePin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.032, 10),
      brushedSteelMat
    );
    wheelAxlePin.rotation.z = Math.PI / 2;
    wheelAxlePin.position.set(sideX * 0.325, 0.034, 0.84);
    runGroup.add(wheelAxlePin);
  }

  // ---------------------------------------------------------------------------
  // 2. Running Belt (`0.51m x 1.45m`) & Front/Rear Crowned Steel Rollers
  // ---------------------------------------------------------------------------
  const beltDeck = new THREE.Mesh(
    new THREE.BoxGeometry(0.52, 0.088, 1.44),
    runningBeltMat
  );
  beltDeck.name = 'outbuildings.gym.technogymRunPersonal.runningBelt';
  beltDeck.position.set(0, 0.152, -0.24);
  beltDeck.castShadow = true;
  beltDeck.receiveShadow = true;
  runGroup.add(beltDeck);

  for (const rz of [-0.955, 0.475] as const) {
    const roller = new THREE.Mesh(
      new THREE.CylinderGeometry(0.043, 0.043, 0.518, 20),
      runningBeltMat
    );
    roller.rotation.z = Math.PI / 2;
    roller.position.set(0, 0.152, rz);
    runGroup.add(roller);
  }

  // ---------------------------------------------------------------------------
  // 3. Left & Right Sculpted Side Foot Rails, Non-Slip Treads & `TECHNOGYM` Badges
  // ---------------------------------------------------------------------------
  const railW = 0.132;
  const railX = 0.332; // Outer edge at `0.332 + 0.066 = 0.398m` (`0.796m` total deck width)

  for (const sideX of [-1, 1] as const) {
    const sx = sideX * railX;

    // Main side rail beam (`z = -0.94..+0.46m, y = 0.065..0.214m`)
    const sideRail = new THREE.Mesh(
      new THREE.BoxGeometry(railW, 0.148, 1.4),
      matteCharcoalMat
    );
    sideRail.name = 'outbuildings.gym.technogymRunPersonal.sideRail';
    sideRail.position.set(sx, 0.14, -0.24);
    sideRail.castShadow = true;
    sideRail.receiveShadow = true;
    runGroup.add(sideRail);

    // Rounded rear end-cap wrapping `-z` end (`z = -0.94m`)
    const rearCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.074, 0.074, railW, 20),
      darkAnthraciteMat
    );
    rearCap.rotation.z = Math.PI / 2;
    rearCap.position.set(sx, 0.14, -0.94);
    rearCap.castShadow = true;
    runGroup.add(rearCap);

    // 2 recessed black socket bolts on the outer rear end-cap face (matching photo)
    for (const bz of [-0.96, -0.92] as const) {
      const capBolt = new THREE.Mesh(
        new THREE.CylinderGeometry(0.007, 0.007, 0.006, 10),
        nonSlipRubberMat
      );
      capBolt.rotation.z = Math.PI / 2;
      capBolt.position.set(sx + sideX * (railW * 0.5 + 0.001), 0.135, bz);
      runGroup.add(capBolt);
    }

    // Textured non-slip rubber foot strip along the top of the side rail (`z = -0.82..+0.36m`)
    const treadStrip = new THREE.Mesh(
      new THREE.BoxGeometry(railW - 0.022, 0.008, 1.18),
      nonSlipRubberMat
    );
    treadStrip.position.set(sx, 0.216, -0.23);
    runGroup.add(treadStrip);

    // Longitudinal grip ribs on the foot tread
    for (const ribOffset of [-0.036, -0.018, 0, 0.018, 0.036] as const) {
      const rib = new THREE.Mesh(
        new THREE.BoxGeometry(0.006, 0.004, 1.14),
        matteCharcoalMat
      );
      rib.position.set(sx + ribOffset, 0.221, -0.23);
      runGroup.add(rib);
    }

    // `TECHNOGYM` Side Rail Badge (`z = -0.68m, y = 0.138m`)
    const badge = new THREE.Mesh(
      new THREE.BoxGeometry(0.004, 0.042, 0.138),
      technogymBadgeMat
    );
    badge.position.set(sx + sideX * (railW * 0.5 + 0.001), 0.138, -0.68);
    if (sideX < 0) {
      badge.rotation.y = Math.PI;
    }
    runGroup.add(badge);
  }

  // ---------------------------------------------------------------------------
  // 4. Sculpted Two-Tone Front Motor Shroud Hood (`z = +0.46..+0.99m`)
  // ---------------------------------------------------------------------------
  const motorBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.792, 0.135, 0.52),
    matteCharcoalMat
  );
  motorBase.name = 'outbuildings.gym.technogymRunPersonal.motorHood';
  motorBase.position.set(0, 0.145, 0.72);
  motorBase.castShadow = true;
  motorBase.receiveShadow = true;
  runGroup.add(motorBase);

  // Rounded front bumper nose at `z = +0.98m`
  const frontNose = new THREE.Mesh(
    new THREE.CylinderGeometry(0.058, 0.048, 0.79, 18),
    matteCharcoalMat
  );
  frontNose.rotation.z = Math.PI / 2;
  frontNose.position.set(0, 0.165, 0.975);
  runGroup.add(frontNose);

  // Sloped satin-anthracite upper motor deck lid (`z = +0.45..+0.95m, y = 0.21..0.265m`)
  const motorUpperCover = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.048, 0.49),
    darkAnthraciteMat
  );
  motorUpperCover.name = 'outbuildings.gym.technogymRunPersonal.motorHood';
  motorUpperCover.position.set(0, 0.228, 0.705);
  motorUpperCover.rotation.x = 0.055;
  motorUpperCover.castShadow = true;
  motorUpperCover.receiveShadow = true;
  runGroup.add(motorUpperCover);

  // Center silver `TECHNOGYM` motor-hood badge (`z = +0.52m, y = 0.248m`)
  const hoodBadge = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.006, 0.036),
    technogymBadgeMat
  );
  hoodBadge.position.set(0, 0.246, 0.53);
  hoodBadge.rotation.x = -0.15;
  runGroup.add(hoodBadge);

  // ---------------------------------------------------------------------------
  // 5. Iconic Antonio Citterio Mirror-Polished Cast-Aluminium A-Frame Uprights
  //    (`outbuildings.gym.technogymRunPersonal.polishedFrame`)
  // ---------------------------------------------------------------------------
  // Build the exact side-view silhouette of the A-frame base truss + raked console arm
  // in 2D `(x2d = z, y2d = y)` with the rounded triangular cutout hole at the base!
  const createCitterioUprightGeometry = (thickness: number): THREE.ExtrudeGeometry => {
    const outer = new THREE.Shape();
    // Start at rear base of A-frame (`z = 0.45m, y = 0.205m`)
    outer.moveTo(0.45, 0.205);
    // Base bar forward to front toe of A-frame (`z = 0.955m, y = 0.225m`)
    outer.lineTo(0.955, 0.225);
    outer.quadraticCurveTo(0.975, 0.23, 0.962, 0.265);
    // Front leg of A-frame rising backward to the mid-waist apex (`z = 0.71m, y = 0.72m`)
    outer.lineTo(0.715, 0.71);
    // Continue up the raked upper arm front edge to console top (`z = 0.65m, y = 1.455m`)
    outer.lineTo(0.515, 1.15);
    outer.lineTo(0.685, 1.445);
    outer.quadraticCurveTo(0.695, 1.465, 0.665, 1.468);
    // Console side cheek top & back edge descending to console neck (`z = 0.415m, y = 1.14m`)
    outer.lineTo(0.635, 1.455);
    outer.lineTo(0.41, 1.145);
    outer.quadraticCurveTo(0.395, 1.12, 0.425, 1.08);
    // Upper arm rear edge down to mid-joint stub (`y = 0.865m`)
    outer.lineTo(0.555, 0.875);
    // Short horizontal rearward socket stub where the lower black handrail loop joins (`z = 0.42m, y = 0.82..0.865m`)
    outer.lineTo(0.42, 0.862);
    outer.lineTo(0.42, 0.818);
    outer.lineTo(0.585, 0.822);
    // Rear leg of A-frame descending from waist (`z = 0.615m, y = 0.72m`) to rear base (`z = 0.45m, y = 0.205m`)
    outer.lineTo(0.618, 0.71);
    outer.lineTo(0.442, 0.24);
    outer.quadraticCurveTo(0.435, 0.205, 0.45, 0.205);

    // Triangular cutout window through the lower A-frame truss
    const hole = new THREE.Path();
    hole.moveTo(0.535, 0.26);
    hole.lineTo(0.875, 0.275);
    hole.quadraticCurveTo(0.89, 0.28, 0.878, 0.305);
    hole.lineTo(0.682, 0.625);
    hole.quadraticCurveTo(0.665, 0.65, 0.65, 0.622);
    hole.lineTo(0.518, 0.285);
    hole.quadraticCurveTo(0.512, 0.26, 0.535, 0.26);
    outer.holes.push(hole);

    const geo = new THREE.ExtrudeGeometry(outer, {
      depth: thickness,
      bevelEnabled: true,
      bevelThickness: 0.004,
      bevelSize: 0.004,
      bevelSegments: 3,
      curveSegments: 16,
    });
    // Rotate so 2D `(x2d, y2d)` maps to 3D `(z, y)` and extrusion `z2d` maps along `x`!
    // Specifically: `rotateY(-Math.PI / 2)` maps `(x, y, z) -> (-z, y, x)`.
    // Wait: if we want `x2d -> +z` and `y2d -> +y`, then `rotateY(-Math.PI / 2)` maps `x2d` to `+z`!
    geo.rotateY(-Math.PI / 2);
    return geo;
  };

  const outerAluGeo = createCitterioUprightGeometry(0.022);
  const innerCoreGeo = createCitterioUprightGeometry(0.018);

  for (const sideX of [-1, 1] as const) {
    // Mirror-polished cast aluminium outer upright plate (`x = ±0.376m`)
    const aluUpright = new THREE.Mesh(outerAluGeo, polishedCastAluMat);
    aluUpright.name = 'outbuildings.gym.technogymRunPersonal.polishedFrame';
    aluUpright.position.set(sideX > 0 ? 0.386 : -0.364, 0, 0);
    aluUpright.castShadow = true;
    aluUpright.receiveShadow = true;
    runGroup.add(aluUpright);

    // Dark matte-anthracite inner structural backing (`x = ±0.356m`) visible on the inside of the far upright
    const innerCore = new THREE.Mesh(innerCoreGeo, matteCharcoalMat);
    innerCore.position.set(sideX > 0 ? 0.366 : -0.348, 0, 0);
    innerCore.castShadow = true;
    runGroup.add(innerCore);
  }

  // ---------------------------------------------------------------------------
  // 6. Closed-Loop Soft-Touch Ergonomic Side Handrails & Front Heart-Rate Crossbar
  //    (`outbuildings.gym.technogymRunPersonal.handrails`)
  // ---------------------------------------------------------------------------
  for (const sideX of [-1, 1] as const) {
    const hx = sideX * 0.366;
    const loopCurve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(hx, 1.115, 0.415),
        new THREE.Vector3(hx, 1.07, 0.12),
        new THREE.Vector3(hx, 1.03, -0.15),
        new THREE.Vector3(hx, 1.0, -0.195),
        new THREE.Vector3(hx, 0.92, -0.202),
        new THREE.Vector3(hx, 0.855, -0.192),
        new THREE.Vector3(hx, 0.838, -0.14),
        new THREE.Vector3(hx, 0.84, 0.15),
        new THREE.Vector3(hx, 0.84, 0.422),
      ],
      false,
      'catmullrom',
      0.22
    );
    const handrailLoop = new THREE.Mesh(
      new THREE.TubeGeometry(loopCurve, 44, 0.021, 16, false),
      softTouchGripMat
    );
    handrailLoop.name = 'outbuildings.gym.technogymRunPersonal.handrails';
    handrailLoop.castShadow = true;
    runGroup.add(handrailLoop);

    // Polished chrome ferrule collars at the upper and lower frame joints
    for (const [cy, cz, rx] of [
      [1.115, 0.415, 0.15],
      [0.84, 0.422, 0],
    ] as const) {
      const collar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0225, 0.0225, 0.024, 16),
        polishedCastAluMat
      );
      collar.rotation.x = Math.PI / 2 + rx;
      collar.position.set(hx, cy, cz);
      runGroup.add(collar);
    }
  }

  // Front Horizontal Polished Chrome Heart-Rate Grip Crossbar (`x = -0.35..+0.35m, y = 1.105m, z = +0.365m`)
  const frontCrossbar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.019, 0.019, 0.71, 20),
    polishedCastAluMat
  );
  frontCrossbar.name = 'outbuildings.gym.technogymRunPersonal.handrails';
  frontCrossbar.rotation.z = Math.PI / 2;
  frontCrossbar.position.set(0, 1.105, 0.365);
  frontCrossbar.castShadow = true;
  runGroup.add(frontCrossbar);

  // Hand-pulse contact sensor sleeves & black insulator rings on the front crossbar
  for (const sideX of [-1, 1] as const) {
    const sensorSleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0205, 0.0205, 0.11, 16),
      brushedSteelMat
    );
    sensorSleeve.rotation.z = Math.PI / 2;
    sensorSleeve.position.set(sideX * 0.165, 1.105, 0.365);
    runGroup.add(sensorSleeve);

    for (const ringOffset of [-0.06, 0.06] as const) {
      const insulatorRing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.021, 0.021, 0.012, 16),
        nonSlipRubberMat
      );
      insulatorRing.rotation.z = Math.PI / 2;
      insulatorRing.position.set(sideX * 0.165 + ringOffset, 1.105, 0.365);
      runGroup.add(insulatorRing);
    }

    // Integrated dark-anthracite bottle / accessory holder cups behind the crossbar (`x = ±0.245m, y = 1.095m, z = +0.435m`)
    const cupHolder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.038, 0.085, 18),
      matteCharcoalMat
    );
    cupHolder.position.set(sideX * 0.245, 1.095, 0.435);
    runGroup.add(cupHolder);
  }

  // Console Bridge Tray & Red Emergency Stop Safety Key (`x = 0, y = 1.148m, z = +0.415m`)
  const consoleBridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.71, 0.038, 0.095),
    matteCharcoalMat
  );
  consoleBridge.position.set(0, 1.138, 0.425);
  runGroup.add(consoleBridge);

  const safetyStopClip = new THREE.Mesh(
    new THREE.BoxGeometry(0.044, 0.034, 0.042),
    emergencyRedMat
  );
  safetyStopClip.name = 'outbuildings.gym.technogymRunPersonal.emergencyStop';
  safetyStopClip.position.set(0, 1.158, 0.402);
  safetyStopClip.rotation.x = -0.35;
  runGroup.add(safetyStopClip);

  // ---------------------------------------------------------------------------
  // 7. 21.5" Technogym Live Full-HD Tempered-Glass Touchscreen Console
  //    (`outbuildings.gym.technogymRunPersonal.console`)
  // ---------------------------------------------------------------------------
  const consoleGroup = new THREE.Group();
  consoleGroup.name = 'outbuildings.gym.technogymRunPersonal.console';
  consoleGroup.position.set(0, 1.295, 0.545);
  // Tilted toward the runner (`-Z` is toward the runner, so `rotation.x = +0.62` tilts the `-Z` front face upward toward the runner!)
  consoleGroup.rotation.x = 0.62;
  runGroup.add(consoleGroup);

  const consoleW = 0.728;
  const consoleH = 0.425;
  const consoleD = 0.044;

  // Rear dark-anodized aluminium console shell
  const consoleBack = new THREE.Mesh(
    new THREE.BoxGeometry(consoleW, consoleH, consoleD),
    darkAnthraciteMat
  );
  consoleBack.castShadow = true;
  consoleGroup.add(consoleBack);

  // Polished cast-aluminium side trim cheeks hugging the left and right edges of the console
  for (const sideX of [-1, 1] as const) {
    const sideTrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, consoleH + 0.004, consoleD + 0.006),
      polishedCastAluMat
    );
    sideTrim.position.set(sideX * (consoleW * 0.5 + 0.005), 0, 0);
    consoleGroup.add(sideTrim);
  }

  // Edge-to-edge black tempered glass front bezel (`-z` face facing the runner)
  const bezelGlass = new THREE.Mesh(
    new THREE.BoxGeometry(consoleW - 0.008, consoleH - 0.008, 0.006),
    darkBezelGlassMat
  );
  bezelGlass.position.set(0, 0, -consoleD * 0.5 - 0.002);
  consoleGroup.add(bezelGlass);

  // Active 21.5" Technogym Live Touchscreen Display (`outbuildings.gym.technogymRunPersonal.screen`)
  const screenMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(consoleW - 0.028, consoleH - 0.028),
    screenDisplayMat
  );
  screenMesh.name = 'outbuildings.gym.technogymRunPersonal.screen';
  screenMesh.rotation.y = Math.PI; // Face `-Z` toward the runner on the belt!
  screenMesh.position.set(0, 0, -consoleD * 0.5 - 0.006);
  consoleGroup.add(screenMesh);
}

/**
 * Generates a high-resolution (`512x512`) solid-color **Nike Pro Bumper Plate** face texture
 * (`450mm` IWF competition/training specification) with solid vibrant urethane color, raised outer
 * collar ring shading, two opposing Nike Swooshes, bold `NIKE` wordmark, and weight numerals (`LB` / `KG`).
 */
function createNikeProBumperPlateTexture(
  weightLb: number,
  weightKg: number,
  baseHex: string,
  darkRimHex: string,
  textHex: string
): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size * 0.5;
  const cy = size * 0.5;

  // Solid base fill
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  // Subtle recessed inner dish vs raised outer lip ring & center hub boss
  ctx.strokeStyle = darkRimHex;
  ctx.lineWidth = 26;
  ctx.beginPath();
  ctx.arc(cx, cy, 228, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 206, 0, Math.PI * 2);
  ctx.stroke();

  // Inner moulded ring around steel hub
  ctx.strokeStyle = darkRimHex;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, 88, 0, Math.PI * 2);
  ctx.stroke();

  // Draw Nike Swoosh helper
  const drawSwoosh = (x: number, y: number, rot: number, scale: number): void => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    ctx.fillStyle = textHex;
    ctx.beginPath();
    ctx.moveTo(-24, -14);
    ctx.quadraticCurveTo(-38, 16, -15, 22);
    ctx.quadraticCurveTo(8, 27, 38, -14);
    ctx.quadraticCurveTo(-2, 10, -15, 5);
    ctx.quadraticCurveTo(-26, 0, -24, -14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // Top & Bottom Nike Swooshes (matching `media_1791212146142_7b2838ce.png`)
  drawSwoosh(cx, cy - 146, 0, 1.15);
  drawSwoosh(cx, cy + 146, Math.PI, 1.15);

  // Left & Right bold weight markings (`45 LB` / `20 KG`)
  ctx.fillStyle = textHex;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Right side (`+x`): weight in LB
  ctx.save();
  ctx.translate(cx + 146, cy);
  ctx.font = '900 44px Impact, Arial Black, sans-serif';
  ctx.fillText(String(weightLb), 0, -14);
  ctx.font = '800 22px Arial, sans-serif';
  ctx.fillText('LB', 0, 20);
  ctx.restore();

  // Left side (`-x`): weight in KG + NIKE
  ctx.save();
  ctx.translate(cx - 146, cy);
  ctx.font = '900 38px Impact, Arial Black, sans-serif';
  ctx.fillText(String(weightKg), 0, -14);
  ctx.font = '800 20px Arial, sans-serif';
  ctx.fillText('KG', 0, 18);
  ctx.restore();

  // Stainless steel center hub ring in texture center
  const hubGrad = ctx.createRadialGradient(cx - 12, cy - 12, 6, cx, cy, 76);
  hubGrad.addColorStop(0, '#f4f7fb');
  hubGrad.addColorStop(0.65, '#c8d0da');
  hubGrad.addColorStop(1, '#8c949e');
  ctx.fillStyle = hubGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 74, 0, Math.PI * 2);
  ctx.fill();

  // Dark center 50mm Olympic collar bore
  ctx.fillStyle = '#181b20';
  ctx.beginPath();
  ctx.arc(cx, cy, 38, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates the vertical `NIKE EST. 1972` white stencil decal texture for the front upright
 * of the Nike Strength Squat Cage (`media_1791212146142_7b2838ce.png`).
 */
function createNikeUprightStencilTexture(): THREE.CanvasTexture {
  const w = 128;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#1a1d21';
  ctx.fillRect(0, 0, w, h);

  // Vertical laser-cut Westside hole dots along the center line
  ctx.fillStyle = '#0b0d0f';
  for (let y = 260; y < h - 16; y += 22) {
    ctx.beginPath();
    ctx.arc(w * 0.5, y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bold vertical white `NIKE` + `EST. 1972` stencil near the top (`y = 40..230`)
  ctx.save();
  ctx.translate(w * 0.5, 135);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#f0f4f8';
  ctx.font = '900 52px Impact, Arial Black, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('NIKE', 0, -10);
  ctx.font = '700 15px Arial, sans-serif';
  ctx.fillText('EST. 1972', 0, 26);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Builds the **Nike Strength Squat Cage / Power Rack, Nike Flat Workout Bench, Crimson-Red Nike
 * Olympic Barbell, and Solid-Color Nike Pro Bumper Plates** (`outbuildings.gym.nikeSquatRack`),
 * matching `media_1791212146142_7b2838ce.png` with solid-color Pro competition bumper plates:
 * - Red (`55 LB / 25 KG`, `#c62828`)
 * - Blue (`45 LB / 20 KG`, `#1554ad`)
 * - Yellow (`35 LB / 15 KG`, `#e6a810`)
 * - Green (`25 LB / 10 KG`, `#1b7a3e`)
 * - Black (`10 LB / 5 KG`, `#1e2228`)
 */
export function buildGymNikeSquatRack(
  groundGroup: THREE.Group,
  gymFloorY: number
): void {
  const rackGroup = new THREE.Group();
  rackGroup.name = 'outbuildings.gym.nikeSquatRack';
  rackGroup.userData.zone = 'courtyard';
  // Positioned in the Gym South-West bay (`u = 1.52m, v = 4.02m`) facing North (`-v`, `rotation.y = Math.PI`),
  // shifted forward away from the South wall (`v = 5.43m`) so a spotter can comfortably stand behind the rack!
  rackGroup.position.set(1.52, gymFloorY, 4.02);
  rackGroup.rotation.y = Math.PI;
  groundGroup.add(rackGroup);

  const powderBlackSteelMat = new THREE.MeshStandardMaterial({
    color: 0x1a1d21,
    roughness: 0.44,
    metalness: 0.58,
  });
  const uhmwPlasticMat = new THREE.MeshStandardMaterial({
    color: 0x121417,
    roughness: 0.72,
    metalness: 0.08,
  });
  const zincBoltMat = new THREE.MeshStandardMaterial({
    color: 0xe2e7ee,
    roughness: 0.18,
    metalness: 0.92,
  });
  const chromeHubMat = new THREE.MeshStandardMaterial({
    color: 0xdce2ea,
    roughness: 0.16,
    metalness: 0.94,
  });
  const blackOxideSleeveMat = new THREE.MeshStandardMaterial({
    color: 0x22262b,
    roughness: 0.3,
    metalness: 0.82,
  });
  const crimsonCerakoteShaftMat = new THREE.MeshStandardMaterial({
    color: 0xd13224,
    roughness: 0.34,
    metalness: 0.42,
  });
  const whiteDecalMat = new THREE.MeshStandardMaterial({
    color: 0xf4f7fa,
    roughness: 0.3,
    metalness: 0.1,
  });
  const benchPadVinylMat = new THREE.MeshStandardMaterial({
    color: 0x181a1e,
    roughness: 0.52,
    metalness: 0.06,
  });
  const uprightStencilMat = new THREE.MeshStandardMaterial({
    map: createNikeUprightStencilTexture(),
    roughness: 0.44,
    metalness: 0.55,
  });

  // Solid-Color Nike Pro Bumper Plate Specs (IWF Competition Color Coding)
  interface ProPlateSpec {
    readonly weightLb: number;
    readonly weightKg: number;
    readonly radius: number;
    readonly thickness: number;
    readonly sideMat: THREE.MeshStandardMaterial;
    readonly faceMat: THREE.MeshStandardMaterial;
  }

  const makeProPlateSpec = (
    weightLb: number,
    weightKg: number,
    thickness: number,
    colorHex: number,
    baseCss: string,
    darkRimCss: string,
    textCss: string
  ): ProPlateSpec => {
    const faceTex = createNikeProBumperPlateTexture(
      weightLb,
      weightKg,
      baseCss,
      darkRimCss,
      textCss
    );
    return {
      weightLb,
      weightKg,
      radius: 0.225, // 450mm IWF standard diameter
      thickness,
      sideMat: new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.48,
        metalness: 0.05,
      }),
      faceMat: new THREE.MeshStandardMaterial({
        map: faceTex,
        roughness: 0.46,
        metalness: 0.06,
      }),
    };
  };

  const plate10LbBlack = makeProPlateSpec(10, 5, 0.028, 0x1e2228, '#1e2228', '#101216', '#f2f5f8');
  const plate25LbGreen = makeProPlateSpec(25, 10, 0.044, 0x1b7a3e, '#1b7a3e', '#115228', '#f4f8f5');
  const plate35LbYellow = makeProPlateSpec(35, 15, 0.056, 0xe6a810, '#e6a810', '#b07d08', '#15181c');
  const plate45LbBlue = makeProPlateSpec(45, 20, 0.066, 0x1554ad, '#1554ad', '#0d3875', '#f4f8ff');
  const plate55LbRed = makeProPlateSpec(55, 25, 0.076, 0xc62828, '#c62828', '#8a1818', '#fff5f5');

  // Helper to spawn a single solid-color Nike Pro Bumper Plate whose axis is along `X`
  const addProBumperPlateOnAxisX = (
    parent: THREE.Object3D,
    spec: ProPlateSpec,
    xCenter: number,
    yCenter: number,
    zCenter: number,
    name: string
  ): void => {
    const pGroup = new THREE.Group();
    pGroup.name = name;
    pGroup.position.set(xCenter, yCenter, zCenter);
    parent.add(pGroup);

    // CylinderGeometry material groups: `[side, top (+Y), bottom (-Y)]`
    const plateMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(spec.radius, spec.radius, spec.thickness, 32),
      [spec.sideMat, spec.faceMat, spec.faceMat]
    );
    plateMesh.rotation.z = Math.PI / 2;
    plateMesh.castShadow = true;
    plateMesh.receiveShadow = true;
    pGroup.add(plateMesh);

    // Raised Competition Stainless-Steel Center Hub Insert (`r = 0.068m`)
    const steelHub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.068, spec.thickness + 0.003, 24),
      chromeHubMat
    );
    steelHub.rotation.z = Math.PI / 2;
    pGroup.add(steelHub);
  };

  // ---------------------------------------------------------------------------
  // 1. Base Stabilizer Skids, Rear Crossmember, Gusset Plates & Molded End Boots
  // ---------------------------------------------------------------------------
  const uprightSize = 0.075; // 3"x3" (75mm) 11-gauge steel posts
  const rackHalfW = 0.56; // Center-to-center X span = 1.12m (`1.20m` outer width)
  const zRearUpright = -0.34;
  const zFrontUpright = 0.34;
  const zSkidBack = -0.44;
  const zSkidFront = 0.82;
  const skidLen = zSkidFront - zSkidBack; // 1.26m
  const skidCenterZ = (zSkidBack + zSkidFront) * 0.5; // +0.19m
  const rackH = 2.24;

  for (const sideX of [-1, 1] as const) {
    const ux = sideX * rackHalfW;

    // Long bottom floor stabilizer rail (`75mm x 75mm x 1.26m`)
    const baseSkid = new THREE.Mesh(
      new THREE.BoxGeometry(uprightSize, uprightSize, skidLen),
      powderBlackSteelMat
    );
    baseSkid.position.set(ux, uprightSize * 0.5, skidCenterZ);
    baseSkid.castShadow = true;
    baseSkid.receiveShadow = true;
    rackGroup.add(baseSkid);

    // Sloped black polymer front end boot (`z = +0.82..+0.91m`) matching reference photo
    const frontBoot = new THREE.Mesh(
      new THREE.BoxGeometry(uprightSize + 0.016, uprightSize + 0.006, 0.11),
      uhmwPlasticMat
    );
    frontBoot.position.set(ux, uprightSize * 0.48, zSkidFront + 0.035);
    frontBoot.rotation.x = 0.18;
    rackGroup.add(frontBoot);

    // Floor anchor foot flanges under rear and front uprights
    for (const fz of [zRearUpright, zFrontUpright] as const) {
      const floorPlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.145, 0.008, 0.145),
        powderBlackSteelMat
      );
      floorPlate.position.set(ux, 0.004, fz);
      rackGroup.add(floorPlate);
    }

    // Rear Upright (`z = -0.34m, y = 0.075..2.20m`)
    const rearPost = new THREE.Mesh(
      new THREE.BoxGeometry(uprightSize, rackH - 0.04, uprightSize),
      powderBlackSteelMat
    );
    rearPost.name = 'outbuildings.gym.nikeSquatRack.upright';
    rearPost.position.set(ux, (rackH - 0.04) * 0.5 + 0.04, zRearUpright);
    rearPost.castShadow = true;
    rearPost.receiveShadow = true;
    rackGroup.add(rearPost);

    // Front Upright (`z = +0.34m, y = 0.075..2.24m`)
    const frontPost = new THREE.Mesh(
      new THREE.BoxGeometry(uprightSize, rackH, uprightSize),
      powderBlackSteelMat
    );
    frontPost.name = 'outbuildings.gym.nikeSquatRack.upright';
    frontPost.position.set(ux, rackH * 0.5 + 0.02, zFrontUpright);
    frontPost.castShadow = true;
    frontPost.receiveShadow = true;
    rackGroup.add(frontPost);

    // Vertical `NIKE EST. 1972` graphic panel near the top of the front-left upright (`sideX = -1`)
    if (sideX === -1) {
      const stencilPlaques = new THREE.Mesh(
        new THREE.PlaneGeometry(uprightSize - 0.004, 0.36),
        uprightStencilMat
      );
      stencilPlaques.position.set(ux, 1.88, zFrontUpright + uprightSize * 0.5 + 0.001);
      rackGroup.add(stencilPlaques);
    }

    // Upper Side Crossmember connecting Rear and Front Uprights (`y = 2.13m`)
    const topSideCross = new THREE.Mesh(
      new THREE.BoxGeometry(uprightSize, uprightSize, zFrontUpright - zRearUpright - uprightSize),
      powderBlackSteelMat
    );
    topSideCross.position.set(ux, 2.13, 0);
    topSideCross.castShadow = true;
    rackGroup.add(topSideCross);

    // Triangular Gusset Plates & Silver Hex Bolts at base & top joints
    for (const gz of [zRearUpright, zFrontUpright] as const) {
      const gusset = new THREE.Mesh(
        new THREE.BoxGeometry(uprightSize + 0.012, 0.16, 0.16),
        powderBlackSteelMat
      );
      gusset.position.set(ux, 0.12, gz + (gz > 0 ? 0.05 : -0.05));
      gusset.rotation.x = Math.PI / 4;
      rackGroup.add(gusset);

      for (const by of [0.11, 0.18, 2.09, 2.16] as const) {
        const bolt = new THREE.Mesh(
          new THREE.CylinderGeometry(0.007, 0.007, uprightSize + 0.022, 6),
          zincBoltMat
        );
        bolt.rotation.z = Math.PI / 2;
        bolt.position.set(ux, by, gz);
        rackGroup.add(bolt);
      }
    }
  }

  // Rear Bottom & Rear Upper Crossmembers (`x = -0.56..+0.56m, z = -0.34m`)
  for (const cy of [0.06, 2.09] as const) {
    const rearCross = new THREE.Mesh(
      new THREE.BoxGeometry(rackHalfW * 2 - uprightSize, uprightSize, uprightSize),
      powderBlackSteelMat
    );
    rearCross.position.set(0, cy, zRearUpright);
    rearCross.castShadow = true;
    rackGroup.add(rearCross);
  }

  // Front Upper Knurled Pull-Up Bar (`32mm` tube at `y = 2.16m, z = +0.34m`)
  const pullupBar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.016, rackHalfW * 2 - uprightSize, 20),
    powderBlackSteelMat
  );
  pullupBar.name = 'outbuildings.gym.nikeSquatRack.pullupBar';
  pullupBar.rotation.z = Math.PI / 2;
  pullupBar.position.set(0, 2.16, zFrontUpright);
  pullupBar.castShadow = true;
  rackGroup.add(pullupBar);

  // ---------------------------------------------------------------------------
  // 2. 8 Bolt-On Weight Storage Horns & Solid-Color Nike Pro Bumper Plates
  // ---------------------------------------------------------------------------
  const hornTiers = [
    { y: 1.76, spec: plate10LbBlack, count: 2 },
    { y: 1.28, spec: plate25LbGreen, count: 2 },
    { y: 0.78, spec: plate35LbYellow, count: 2 },
    { y: 0.28, spec: plate55LbRed, count: 1 },
  ] as const;

  for (const sideX of [-1, 1] as const) {
    const outerUprightFaceX = sideX * (rackHalfW + uprightSize * 0.5);
    for (const tier of hornTiers) {
      // Mounting flange plate on rear upright with 2 silver hex bolts
      const hornFlange = new THREE.Mesh(
        new THREE.BoxGeometry(0.012, 0.13, 0.068),
        powderBlackSteelMat
      );
      hornFlange.position.set(outerUprightFaceX + sideX * 0.006, tier.y, zRearUpright);
      rackGroup.add(hornFlange);

      for (const dy of [-0.042, 0.042] as const) {
        const hBolt = new THREE.Mesh(
          new THREE.CylinderGeometry(0.006, 0.006, 0.02, 6),
          zincBoltMat
        );
        hBolt.rotation.z = Math.PI / 2;
        hBolt.position.set(outerUprightFaceX + sideX * 0.012, tier.y + dy, zRearUpright);
        rackGroup.add(hBolt);
      }

      // Rubber donut bumper stop against the flange
      const rubberStop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.036, 0.036, 0.018, 16),
        uhmwPlasticMat
      );
      rubberStop.rotation.z = Math.PI / 2;
      rubberStop.position.set(outerUprightFaceX + sideX * 0.02, tier.y, zRearUpright);
      rackGroup.add(rubberStop);

      // 49mm black UHMW weight storage pin (`0.26m` long)
      const hornLen = 0.26;
      const hornPin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.024, 0.024, hornLen, 18),
        uhmwPlasticMat
      );
      hornPin.rotation.z = Math.PI / 2;
      hornPin.position.set(outerUprightFaceX + sideX * (0.02 + hornLen * 0.5), tier.y, zRearUpright);
      hornPin.castShadow = true;
      rackGroup.add(hornPin);

      // Stack the Solid-Color Nike Pro Bumper Plates onto the storage horn!
      let offsetFromStop = 0.032;
      for (let c = 0; c < tier.count; c++) {
        const px =
          outerUprightFaceX +
          sideX * (offsetFromStop + tier.spec.thickness * 0.5);
        addProBumperPlateOnAxisX(
          rackGroup,
          tier.spec,
          px,
          tier.y,
          zRearUpright,
          `outbuildings.gym.nikeSquatRack.proBumperPlate.${tier.spec.weightLb}lb`
        );
        offsetFromStop += tier.spec.thickness + 0.006;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Heavy-Duty J-Cups, Crimson-Red Nike Olympic Barbell & Loaded Pro Plates
  // ---------------------------------------------------------------------------
  const barY = 1.29;
  const barZ = zFrontUpright + uprightSize * 0.5 + 0.048;

  for (const sideX of [-1, 1] as const) {
    const ux = sideX * rackHalfW;
    // J-cup vertical backplate + lower hook cradle + front lip
    const jBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.082, 0.17, 0.016),
      uhmwPlasticMat
    );
    jBack.position.set(ux, barY + 0.02, zFrontUpright + uprightSize * 0.5 + 0.008);
    rackGroup.add(jBack);

    const jBottom = new THREE.Mesh(
      new THREE.BoxGeometry(0.082, 0.018, 0.082),
      uhmwPlasticMat
    );
    jBottom.position.set(ux, barY - 0.028, barZ);
    rackGroup.add(jBottom);

    const jFrontLip = new THREE.Mesh(
      new THREE.BoxGeometry(0.082, 0.052, 0.016),
      uhmwPlasticMat
    );
    jFrontLip.position.set(ux, barY - 0.01, barZ + 0.038);
    rackGroup.add(jFrontLip);
  }

  // Crimson-Red Cerakote 20kg Nike Olympic Barbell (`2.20m` total length)
  const barbellGroup = new THREE.Group();
  barbellGroup.name = 'outbuildings.gym.nikeSquatRack.barbell';
  barbellGroup.position.set(0, barY, barZ);
  rackGroup.add(barbellGroup);

  // 28.5mm Crimson-Red Cerakote Shaft (`1.31m` inner shaft length)
  const barShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0145, 0.0145, 1.31, 20),
    crimsonCerakoteShaftMat
  );
  barShaft.rotation.z = Math.PI / 2;
  barShaft.castShadow = true;
  barbellGroup.add(barShaft);

  // Center white Nike logo band on the crimson barbell shaft
  const centerLogoBand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0149, 0.0149, 0.065, 18),
    whiteDecalMat
  );
  centerLogoBand.rotation.z = Math.PI / 2;
  barbellGroup.add(centerLogoBand);

  // Left & Right 50mm Black-Oxide Loadable Olympic Sleeves + Loaded Solid-Color Pro Plates (45 LB Blue + 25 LB Green per side!)
  for (const sideX of [-1, 1] as const) {
    // Sleeve collar shoulder (`x = ±0.668m`)
    const collarFlange = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.036, 0.028, 20),
      blackOxideSleeveMat
    );
    collarFlange.rotation.z = Math.PI / 2;
    collarFlange.position.set(sideX * 0.668, 0, 0);
    barbellGroup.add(collarFlange);

    // 50mm rotating sleeve (`0.415m` long)
    const sleeveLen = 0.415;
    const sleeve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0248, 0.0248, sleeveLen, 20),
      blackOxideSleeveMat
    );
    sleeve.rotation.z = Math.PI / 2;
    sleeve.position.set(sideX * (0.682 + sleeveLen * 0.5), 0, 0);
    sleeve.castShadow = true;
    barbellGroup.add(sleeve);

    // Crimson red end-cap on sleeve tip
    const endCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.023, 0.023, 0.008, 16),
      crimsonCerakoteShaftMat
    );
    endCap.rotation.z = Math.PI / 2;
    endCap.position.set(sideX * (0.682 + sleeveLen + 0.002), 0, 0);
    barbellGroup.add(endCap);

    // Load 1x Solid Blue 45 LB (20 KG) Pro Plate + 1x Solid Green 25 LB (10 KG) Pro Plate onto each sleeve!
    const blueX = sideX * (0.684 + plate45LbBlue.thickness * 0.5);
    addProBumperPlateOnAxisX(
      barbellGroup,
      plate45LbBlue,
      blueX,
      0,
      0,
      'outbuildings.gym.nikeSquatRack.proBumperPlate.45lb'
    );

    const greenX =
      sideX *
      (0.684 + plate45LbBlue.thickness + 0.004 + plate25LbGreen.thickness * 0.5);
    addProBumperPlateOnAxisX(
      barbellGroup,
      plate25LbGreen,
      greenX,
      0,
      0,
      'outbuildings.gym.nikeSquatRack.proBumperPlate.25lb'
    );

    // Olympic Lock-Jaw Barbell Collar outside the green plate
    const lockCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.042, 0.038, 18),
      uhmwPlasticMat
    );
    lockCollar.rotation.z = Math.PI / 2;
    lockCollar.position.set(
      sideX *
        (0.684 +
          plate45LbBlue.thickness +
          plate25LbGreen.thickness +
          0.028),
      0,
      0
    );
    barbellGroup.add(lockCollar);
  }

  // ---------------------------------------------------------------------------
  // 4. Nike Strength Flat Competition Workout Bench (`outbuildings.gym.nikeSquatRack.bench`)
  //    (Positioned in front of the rack, angled slightly matching `media_1791212146142_7b2838ce.png`)
  // ---------------------------------------------------------------------------
  const benchGroup = new THREE.Group();
  benchGroup.name = 'outbuildings.gym.nikeSquatRack.bench';
  benchGroup.position.set(0.18, 0, 0.86);
  benchGroup.rotation.y = 0.06;
  rackGroup.add(benchGroup);

  const padL = 1.22;
  const padW = 0.305;
  const padT = 0.068;
  const benchH = 0.44;

  // Cushioned matte-black competition bench pad (`y = 0.406..0.474m`)
  const benchPad = new THREE.Mesh(
    new THREE.BoxGeometry(padW, padT, padL),
    benchPadVinylMat
  );
  benchPad.name = 'outbuildings.gym.nikeSquatRack.bench.pad';
  benchPad.position.set(0, benchH - padT * 0.5, 0);
  benchPad.castShadow = true;
  benchPad.receiveShadow = true;
  benchGroup.add(benchPad);

  // Horizontal steel spine under the pad (`75mm x 50mm`)
  const benchSpine = new THREE.Mesh(
    new THREE.BoxGeometry(0.068, 0.052, padL - 0.14),
    powderBlackSteelMat
  );
  benchSpine.position.set(0, benchH - padT - 0.026, 0);
  benchSpine.castShadow = true;
  benchGroup.add(benchSpine);

  // Rear vertical support post (`z = -0.38m`) + wide rear stabilizer T-foot (`0.48m` wide) with transport wheels
  const rearBenchPost = new THREE.Mesh(
    new THREE.BoxGeometry(0.075, benchH - padT - 0.06, 0.075),
    powderBlackSteelMat
  );
  rearBenchPost.position.set(0, (benchH - padT) * 0.5, -0.38);
  rearBenchPost.castShadow = true;
  benchGroup.add(rearBenchPost);

  const rearBenchFoot = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.062, 0.095),
    powderBlackSteelMat
  );
  rearBenchFoot.position.set(0, 0.031, -0.38);
  rearBenchFoot.castShadow = true;
  benchGroup.add(rearBenchFoot);

  for (const sideX of [-1, 1] as const) {
    const bootCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.072, 0.11),
      uhmwPlasticMat
    );
    bootCap.position.set(sideX * 0.21, 0.036, -0.38);
    benchGroup.add(bootCap);

    const rearWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.024, 16),
      uhmwPlasticMat
    );
    rearWheel.rotation.z = Math.PI / 2;
    rearWheel.position.set(sideX * 0.14, 0.032, -0.45);
    benchGroup.add(rearWheel);
  }

  // Raked front tripod post (`z = +0.44m`) with rubber foot pad and vertical knurled transport handle
  const frontBenchPost = new THREE.Mesh(
    new THREE.BoxGeometry(0.075, benchH - padT - 0.02, 0.075),
    powderBlackSteelMat
  );
  frontBenchPost.position.set(0, (benchH - padT) * 0.5, 0.44);
  frontBenchPost.rotation.x = -0.14;
  frontBenchPost.castShadow = true;
  benchGroup.add(frontBenchPost);

  const frontFootPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.022, 0.16),
    uhmwPlasticMat
  );
  frontFootPlate.position.set(0, 0.011, 0.465);
  benchGroup.add(frontFootPlate);

  // Knurled stainless front transport handle projecting from the front leg (`media_1791212146142_7b2838ce.png`)
  const frontHandleGrip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.013, 0.013, 0.18, 16),
    chromeHubMat
  );
  frontHandleGrip.position.set(0, 0.16, 0.525);
  frontHandleGrip.rotation.x = -0.14;
  benchGroup.add(frontHandleGrip);

  for (const hy of [0.085, 0.235] as const) {
    const handleBracket = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.012, 0.055),
      powderBlackSteelMat
    );
    handleBracket.position.set(0, hy, 0.495);
    benchGroup.add(handleBracket);
  }
}

/**
 * Generates a realistic silvered architectural mirror glass texture (`512x1024`)
 * with subtle diagonal specular reflection gradients and bevelled perimeter edge highlights.
 */
function createGymMirrorGlassTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#cfdbe6');
  grad.addColorStop(0.28, '#e8f0f7');
  grad.addColorStop(0.48, '#f7fbff');
  grad.addColorStop(0.55, '#d5e1ec');
  grad.addColorStop(0.82, '#e4edf5');
  grad.addColorStop(1, '#c4d2df');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle diagonal architectural reflection bands
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.18);
  ctx.lineTo(w, h * 0.04);
  ctx.lineTo(w, h * 0.22);
  ctx.lineTo(0, h * 0.36);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.62);
  ctx.lineTo(w, h * 0.48);
  ctx.lineTo(w, h * 0.56);
  ctx.lineTo(0, h * 0.70);
  ctx.closePath();
  ctx.fill();

  // Crisp 12px bevelled glass border highlight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, w - 20, h - 20);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Creates a sculpted botanical leaf blade `THREE.BufferGeometry` with a central midrib fold,
 * parabolic longitudinal arch, and organic elliptic leaf silhouette (never a squashed sphere!).
 */
function createSculptedBotanicalLeafGeometry(
  length: number,
  maxWidth: number,
  archDrop: number,
  cupDepth: number
): THREE.BufferGeometry {
  const segU = 8;
  const segV = 14;
  const geo = new THREE.PlaneGeometry(maxWidth, length, segU, segV);
  geo.translate(0, length * 0.5, 0);

  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const t = Math.max(0, Math.min(1, y / length)); // 0 at stem base, 1 at leaf tip
    const s = x / (maxWidth * 0.5 || 1); // -1..+1 across width

    // Natural elliptic/lanceolate leaf width envelope (narrow petiole base, broad belly, pointed tip)
    const widthProfile = Math.sin(Math.pow(t, 0.75) * Math.PI) * (1 - 0.12 * t);
    const nx = x * widthProfile;

    // Parabolic forward arch (`+z`) as `t` approaches the tip, plus V-cupping across `s`
    const archZ = Math.pow(t, 1.65) * archDrop - Math.abs(s) * cupDepth * widthProfile;
    const ny = y - Math.pow(t, 2.1) * archDrop * 0.32;

    pos.setXYZ(i, nx, ny, archZ);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds the Gym's architectural **Full-Height Backlit Mirrors, Layered Task & Warm Ambient Lighting,
 * Conditioning/Hydration Zone, and Lush Indoor Botanical Planters**:
 * - `outbuildings.gym.wallMirrors`:
 *   - 3-Bay Full-Height Backlit Mirror Wall on the South-East Wall (`u = 3.22..5.50m, v = 5.40m`)
 *   - Full-Height Backlit Form Mirror behind the Nike Squat Cage on the South-West Wall (`u = 0.62..2.42m, v = 5.40m`)
 *   - Full-Height Free-Weight Mirror on the West Wall (`u = 0.305m, v = 2.48..3.88m`)
 * - `outbuildings.gym.lighting`:
 *   - Task Lighting (`4000K` neutral-white): 4 suspended linear ceiling task luminaires (`groundCeilingGroup`) +
 *     7 directional cylindrical wall/mirror task spotlights + 2 crisp `THREE.PointLight`s
 *   - Ambient Lighting (`2700K–3000K` warm golden glow): Perimeter eave grazing LED cove strips along North & South walls,
 *     recessed warm LED halo backlighting behind all 3 mirror walls, 2 brass & alabaster pilaster sconces (`u = 2.86m`),
 *     and 2 warm ambient `THREE.PointLight`s
 * - `outbuildings.gym.plants`:
 *   - SW Corner (`u = 0.56m, v = 5.05m`): Tall sculpted *Strelitzia nicolai* (Bird of Paradise Palm) in ribbed charcoal planter
 *   - SE Corner (`u = 5.42m, v = 5.05m`): Sculpted *Sansevieria* (Architectural Snake Plant) in fluted limestone planter
 *   - NW Corner (`u = 0.56m, v = 0.62m`): Lush *Monstera deliciosa* in turned oak-legged ceramic planter
 * - `outbuildings.gym.hydrationBench`:
 *   - Slatted European Oak & Matte-Black Steel Towel/Hydration Bench (`u = 5.38m, v = 0.72m`) + Stretching Mat & Kettlebells.
 */
export function buildGymMirrorsLightingAndPlants(
  groundGroup: THREE.Group,
  groundCeilingGroup: THREE.Group,
  gymFloorY: number
): void {
  void groundCeilingGroup;
  const mirrorGroup = new THREE.Group();
  mirrorGroup.name = 'outbuildings.gym.wallMirrors';
  mirrorGroup.userData.zone = 'courtyard';
  groundGroup.add(mirrorGroup);

  const mirrorGlassMat = new THREE.MeshStandardMaterial({
    map: createGymMirrorGlassTexture(),
    color: 0xeaf2fa,
    roughness: 0.03,
    metalness: 0.94,
  });
  const blackAnodizedFrameMat = new THREE.MeshStandardMaterial({
    color: 0x181b20,
    roughness: 0.34,
    metalness: 0.72,
  });
  const warmHaloLedMat = new THREE.MeshStandardMaterial({
    color: 0xfff0d6,
    emissive: new THREE.Color(0xffb866),
    emissiveIntensity: 2.5,
    roughness: 0.18,
  });
  const taskWhiteLedMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0xfff4e0),
    emissiveIntensity: 3.2,
    roughness: 0.14,
  });
  const brushedBrassMat = new THREE.MeshStandardMaterial({
    color: 0xc8a464,
    roughness: 0.28,
    metalness: 0.84,
  });

  // Helper to create an arched 2D shape (`width = archW`, total `height = totalH` centered vertically at `y = 0`)
  const makeArchShape = (archW: number, totalH: number): THREE.Shape => {
    const r = archW * 0.5;
    const yBot = -totalH * 0.5;
    const ySpring = totalH * 0.5 - r;
    const s = new THREE.Shape();
    s.moveTo(-r, yBot);
    s.lineTo(r, yBot);
    s.lineTo(r, ySpring);
    s.absarc(0, ySpring, r, 0, Math.PI, false);
    s.lineTo(-r, yBot);
    return s;
  };

  // Helper to create an arched perimeter frame / halo ring (`outerW, outerH` minus `innerW, innerH`)
  const makeArchRingGeometry = (
    outerW: number,
    outerH: number,
    borderT: number,
    depthZ: number
  ): THREE.ExtrudeGeometry => {
    const outer = makeArchShape(outerW, outerH);
    const innerW = outerW - borderT * 2;
    const innerH = outerH - borderT * 2;
    const rIn = innerW * 0.5;
    const yBotIn = -innerH * 0.5;
    const ySpringIn = innerH * 0.5 - rIn;
    const hole = new THREE.Path();
    hole.moveTo(-rIn, yBotIn);
    hole.lineTo(rIn, yBotIn);
    hole.lineTo(rIn, ySpringIn);
    hole.absarc(0, ySpringIn, rIn, 0, Math.PI, false);
    hole.lineTo(-rIn, yBotIn);
    outer.holes.push(hole);

    const geo = new THREE.ExtrudeGeometry(outer, {
      depth: depthZ,
      bevelEnabled: false,
      curveSegments: 24,
    });
    geo.translate(0, 0, -depthZ * 0.5);
    return geo;
  };

  // Helper to create an arched mirror glass pane with normalized [0..1] UVs
  const makeArchGlassGeometry = (archW: number, totalH: number, depthZ: number): THREE.BufferGeometry => {
    const shape = makeArchShape(archW - 0.016, totalH - 0.016);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: depthZ,
      bevelEnabled: false,
      curveSegments: 24,
    });
    geo.translate(0, 0, -depthZ * 0.5);
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    if (pos && uv) {
      for (let i = 0; i < pos.count; i++) {
        const u = (pos.getX(i) + archW * 0.5) / archW;
        const v = (pos.getY(i) + totalH * 0.5) / totalH;
        uv.setXY(i, u, v);
      }
      uv.needsUpdate = true;
    }
    return geo;
  };

  // Issue #2 ("I think the window is actually here, swap the mirror and window. Make the windows more like arches with a bit of separation between them with some backlighting behind"):
  // Builds a row of individual, separated full-height Arched Mirrors with warm 2700K LED halo backlighting behind each arch!
  const addBacklitArchedMirrorSet = (
    name: string,
    cx: number,
    cy: number,
    cz: number,
    rotY: number,
    archW: number,
    archH: number,
    gapBetweenArches: number,
    numArches: number
  ): void => {
    const mAssy = new THREE.Group();
    mAssy.name = name;
    mAssy.position.set(cx, cy, cz);
    mAssy.rotation.y = rotY;
    mirrorGroup.add(mAssy);

    const haloRingGeo = makeArchRingGeometry(archW + 0.036, archH + 0.036, 0.022, 0.01);
    const frameRingGeo = makeArchRingGeometry(archW, archH, 0.02, 0.028);
    const glassGeo = makeArchGlassGeometry(archW, archH, 0.01);

    const stepX = archW + gapBetweenArches;
    const startX = -((numArches - 1) * stepX) * 0.5;

    for (let b = 0; b < numArches; b++) {
      const bx = startX + b * stepX;
      const archUnit = new THREE.Group();
      archUnit.name = `${name}.arch.${b + 1}`;
      archUnit.position.set(bx, 0, 0.012);
      mAssy.add(archUnit);

      // 1. Warm 2700K Arched LED Halo Backlighting glowing onto the wall/brick behind each separated arch
      const haloMesh = new THREE.Mesh(haloRingGeo, warmHaloLedMat);
      haloMesh.name = `${name}.backlight.${b + 1}`;
      haloMesh.position.set(0, 0, -0.01);
      archUnit.add(haloMesh);

      // 2. Clean Uninterrupted Arched Silvered Mirror Glass Pane (no internal grid lines)
      const glassPane = new THREE.Mesh(glassGeo, mirrorGlassMat);
      glassPane.name = `${name}.glass.${b + 1}`;
      glassPane.position.set(0, 0, 0.002);
      archUnit.add(glassPane);

      // 3. Slim Matte-Black Anodized Steel Arched Outer Perimeter Frame
      const archFrame = new THREE.Mesh(frameRingGeo, blackAnodizedFrameMat);
      archFrame.position.set(0, 0, 0.006);
      archFrame.castShadow = true;
      archUnit.add(archFrame);

      // 4. Dedicated Overhead Picture/Task Light Bar above each arch
      const taskBarHousing = new THREE.Mesh(
        new THREE.BoxGeometry(archW * 0.62, 0.022, 0.044),
        blackAnodizedFrameMat
      );
      taskBarHousing.position.set(0, archH * 0.5 + 0.052, 0.036);
      archUnit.add(taskBarHousing);

      const taskBarDiffuser = new THREE.Mesh(
        new THREE.BoxGeometry(archW * 0.58, 0.008, 0.028),
        taskWhiteLedMat
      );
      taskBarDiffuser.position.set(0, archH * 0.5 + 0.039, 0.036);
      archUnit.add(taskBarDiffuser);
    }
  };

  // Issue #1 ("make each mirror bigger so there are less of them overall" at `[-17.086, 0.791, 20.943]`, `outbuildings.gym.wallMirrors.southEast.glass.1`):
  // Each arched mirror is significantly wider (`0.92m..1.08m` vs `0.56m`) and taller (`1.76m` vs `1.62m`), reducing the total count from 7 small mirrors to 4 grand architectural statement mirrors!
  const mirrorCenterY = gymFloorY + 1.18; // Spans `y = gymFloorY + 0.30 .. gymFloorY + 2.06m` (`1.76m` tall)
  const mirrorH = 1.76;

  // 1A. 2 Large Separated Backlit Arched Mirrors on the South-East Exposed Brick Wall (`u = 3.22..5.30m, v = 5.405m`, facing North `-v`)
  addBacklitArchedMirrorSet(
    'outbuildings.gym.wallMirrors.southEast',
    4.26,
    mirrorCenterY,
    5.405,
    Math.PI,
    0.92,
    mirrorH,
    0.22,
    2
  );

  // 1B. 1 Grand Wide Backlit Arched Mirror on the South-West Exposed Brick Wall behind the Squat Cage (`u = 0.98..2.06m, v = 5.405m`, facing North `-v`)
  addBacklitArchedMirrorSet(
    'outbuildings.gym.wallMirrors.southWest',
    1.52,
    mirrorCenterY,
    5.405,
    Math.PI,
    1.08,
    mirrorH,
    0,
    1
  );

  // 1C. 1 Grand Wide Backlit Arched Mirror on the West Wall Free-Weight Zone (`u = 0.305m, centerV = 1.76m`, facing East `+u`)
  addBacklitArchedMirrorSet(
    'outbuildings.gym.wallMirrors.westWall',
    0.305,
    mirrorCenterY,
    1.76,
    Math.PI / 2,
    1.04,
    mirrorH,
    0,
    1
  );

  // ---------------------------------------------------------------------------
  // 2. Layered Task Lighting & Warm Ambient Lighting (`outbuildings.gym.lighting`)
  // ---------------------------------------------------------------------------
  const lightingGroup = new THREE.Group();
  lightingGroup.name = 'outbuildings.gym.lighting';
  lightingGroup.userData.zone = 'courtyard';
  groundGroup.add(lightingGroup);

  // 2A. Warm 2700K Perimeter Eave Grazing LED Cove Strips along the North (`v = 0.305m`) & South (`v = 5.405m`) walls
  for (const [u0, u1, vPos] of [
    [0.36, 2.66, 0.302],
    [0.36, 2.66, 5.408],
    [3.06, 5.68, 5.408],
  ] as const) {
    const coveLen = u1 - u0;
    const coveMidU = (u0 + u1) * 0.5;
    const coveChannel = new THREE.Mesh(
      new THREE.BoxGeometry(coveLen, 0.022, 0.028),
      blackAnodizedFrameMat
    );
    coveChannel.position.set(coveMidU, 1.88, vPos);
    lightingGroup.add(coveChannel);

    const coveStrip = new THREE.Mesh(
      new THREE.BoxGeometry(coveLen - 0.02, 0.012, 0.018),
      warmHaloLedMat
    );
    coveStrip.name = 'outbuildings.gym.lighting.ambientEaveCove';
    coveStrip.position.set(coveMidU, 1.894, vPos);
    lightingGroup.add(coveStrip);
  }

  // 2B. 2 Designer Brushed-Brass & Alabaster Up/Down Wall Sconces on the North (`v = 0.45m`) & South (`v = 5.26m`) Brick Pilasters (`u = 2.86m`)
  for (const [sv, rotY] of [
    [0.452, 0],
    [5.258, Math.PI],
  ] as const) {
    const sconceGroup = new THREE.Group();
    sconceGroup.name = 'outbuildings.gym.lighting.wallSconce';
    sconceGroup.position.set(2.86, gymFloorY + 1.52, sv);
    sconceGroup.rotation.y = rotY;
    lightingGroup.add(sconceGroup);

    const backplate = new THREE.Mesh(
      new THREE.BoxGeometry(0.085, 0.22, 0.016),
      brushedBrassMat
    );
    backplate.position.set(0, 0, 0.008);
    sconceGroup.add(backplate);

    const alabasterTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.28, 16),
      warmHaloLedMat
    );
    alabasterTube.position.set(0, 0, 0.048);
    sconceGroup.add(alabasterTube);

    for (const ringY of [-0.08, 0.08] as const) {
      const brassRing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.036, 0.036, 0.018, 16),
        brushedBrassMat
      );
      brassRing.position.set(0, ringY, 0.048);
      sconceGroup.add(brassRing);
    }
  }

  // 2C. 4 Overhead Suspended Linear Task Luminaires (`y = 2.02m`)
  // Issue #4: Overhead lights stay visible in cutaway mode at low opacity (`0.34..0.38`)
  const ceilingTaskGroup = new THREE.Group();
  ceilingTaskGroup.name = 'outbuildings.gym.lighting.ceilingTaskBattens';
  lightingGroup.add(ceilingTaskGroup);

  const battenCutawayFrameMat = new THREE.MeshStandardMaterial({
    color: 0x1e2228,
    roughness: 0.34,
    metalness: 0.78,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });
  const battenCutawayDiffuserMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfff5e4,
    emissiveIntensity: 1.95,
    roughness: 0.16,
    metalness: 0.02,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });

  for (const cu of [1.52, 4.18] as const) {
    for (const cv of [1.75, 3.85] as const) {
      const battenHousing = new THREE.Mesh(
        new THREE.BoxGeometry(1.68, 0.036, 0.058),
        battenCutawayFrameMat
      );
      battenHousing.position.set(cu, 2.02, cv);
      ceilingTaskGroup.add(battenHousing);

      const battenDiffuser = new THREE.Mesh(
        new THREE.BoxGeometry(1.64, 0.014, 0.044),
        battenCutawayDiffuserMat
      );
      battenDiffuser.position.set(cu, 2.0, cv);
      ceilingTaskGroup.add(battenDiffuser);

      // Twin suspension rods rising to the vaulted ceiling slope
      for (const du of [-0.68, 0.68] as const) {
        const suspRod = new THREE.Mesh(
          new THREE.CylinderGeometry(0.004, 0.004, 0.42, 8),
          battenCutawayFrameMat
        );
        suspRod.position.set(cu + du, 2.24, cv);
        ceilingTaskGroup.add(suspRod);
      }
    }
  }

  // 2D. Task & Warm Ambient PointLights inside the Gym
  const westTaskLight = new THREE.PointLight(0xfff4e2, 2.6, 8.5, 1.4);
  westTaskLight.position.set(1.52, 1.75, 2.65);
  lightingGroup.add(westTaskLight);

  const eastTaskLight = new THREE.PointLight(0xfff4e2, 2.6, 8.5, 1.4);
  eastTaskLight.position.set(4.15, 1.75, 3.15);
  lightingGroup.add(eastTaskLight);

  const warmAmbientLight = new THREE.PointLight(0xffc680, 1.5, 6.5, 1.5);
  warmAmbientLight.position.set(2.86, 1.25, 4.65);
  lightingGroup.add(warmAmbientLight);

  // ---------------------------------------------------------------------------
  // 3. Lush Sculpted Botanical Indoor Gym Plants (`outbuildings.gym.plants`)
  // ---------------------------------------------------------------------------
  const plantsGroup = new THREE.Group();
  plantsGroup.name = 'outbuildings.gym.plants';
  plantsGroup.userData.zone = 'courtyard';
  groundGroup.add(plantsGroup);

  const charcoalPlanterMat = new THREE.MeshStandardMaterial({
    color: 0x282c32,
    roughness: 0.68,
    metalness: 0.08,
  });
  const limestonePlanterMat = new THREE.MeshStandardMaterial({
    color: 0xd8d0c2,
    roughness: 0.74,
    metalness: 0.04,
  });
  const pottingSoilMat = new THREE.MeshStandardMaterial({
    color: 0x261d16,
    roughness: 0.92,
  });
  const pebbleMat = new THREE.MeshStandardMaterial({
    color: 0x8a847c,
    roughness: 0.65,
  });
  const deepEmeraldLeafMat = new THREE.MeshStandardMaterial({
    color: 0x1e4d28,
    roughness: 0.42,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });
  const midBotanicalLeafMat = new THREE.MeshStandardMaterial({
    color: 0x2d6a38,
    roughness: 0.38,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });
  const freshYoungLeafMat = new THREE.MeshStandardMaterial({
    color: 0x438246,
    roughness: 0.36,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });
  const woodyStemMat = new THREE.MeshStandardMaterial({
    color: 0x3b4d28,
    roughness: 0.64,
  });

  // Helper to build a lush multi-stem architectural indoor plant in a stoneware floor planter
  const addSculptedGymPlanter = (
    name: string,
    uPos: number,
    vPos: number,
    potMat: THREE.Material,
    potRTop: number,
    potRBot: number,
    potH: number,
    leafCount: number,
    leafLen: number,
    leafW: number,
    archDrop: number
  ): void => {
    const pGroup = new THREE.Group();
    pGroup.name = name;
    pGroup.position.set(uPos, gymFloorY, vPos);
    plantsGroup.add(pGroup);

    // Stoneware planter pot body + rolled rim collar + soil disc + river pebbles
    const potBody = new THREE.Mesh(
      new THREE.CylinderGeometry(potRTop, potRBot, potH, 24),
      potMat
    );
    potBody.position.set(0, potH * 0.5, 0);
    potBody.castShadow = true;
    potBody.receiveShadow = true;
    pGroup.add(potBody);

    const potRim = new THREE.Mesh(
      new THREE.TorusGeometry(potRTop - 0.008, 0.014, 12, 24),
      potMat
    );
    potRim.rotation.x = Math.PI / 2;
    potRim.position.set(0, potH - 0.006, 0);
    pGroup.add(potRim);

    const soilDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(potRTop - 0.018, potRTop - 0.018, 0.02, 20),
      pottingSoilMat
    );
    soilDisc.position.set(0, potH - 0.025, 0);
    pGroup.add(soilDisc);

    for (let p = 0; p < 7; p++) {
      const ang = (p / 7) * Math.PI * 2;
      const rad = potRTop * 0.48;
      const pebble = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.018, 1),
        pebbleMat
      );
      pebble.scale.set(1.2, 0.55, 0.95);
      pebble.position.set(Math.cos(ang) * rad, potH - 0.012, Math.sin(ang) * rad);
      pGroup.add(pebble);
    }

    // Sculpted botanical leaf blades radiating from multi-tiered petioles
    const leafGeo = createSculptedBotanicalLeafGeometry(leafLen, leafW, archDrop, 0.022);
    const leafMats = [deepEmeraldLeafMat, midBotanicalLeafMat, freshYoungLeafMat] as const;

    for (let i = 0; i < leafCount; i++) {
      const tier = i / leafCount; // 0 = outer lower leaves, 1 = inner tall crown leaves
      const azimuth = i * 2.39996 + uPos * 1.3; // Golden angle spiral distribution
      const stemH = 0.16 + tier * 0.38;
      const tiltOut = 0.22 + (1 - tier) * 0.48;
      const scale = 0.78 + tier * 0.34;

      const stemHolder = new THREE.Group();
      stemHolder.position.set(
        Math.cos(azimuth) * (potRTop * 0.24 * (1 - tier * 0.5)),
        potH - 0.02,
        Math.sin(azimuth) * (potRTop * 0.24 * (1 - tier * 0.5))
      );
      stemHolder.rotation.y = azimuth;
      pGroup.add(stemHolder);

      // Petiole stem rising and arching outward
      const petiole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.01, stemH, 8),
        woodyStemMat
      );
      petiole.position.set(0, stemH * 0.5 * Math.cos(tiltOut * 0.5), stemH * 0.5 * Math.sin(tiltOut * 0.5));
      petiole.rotation.x = tiltOut * 0.5;
      petiole.castShadow = true;
      stemHolder.add(petiole);

      // Sculpted leaf blade attached at top of petiole
      const leafMesh = new THREE.Mesh(leafGeo, leafMats[i % leafMats.length]!);
      leafMesh.position.set(0, stemH * Math.cos(tiltOut * 0.5), stemH * Math.sin(tiltOut * 0.5));
      leafMesh.rotation.x = tiltOut;
      leafMesh.scale.setScalar(scale);
      leafMesh.castShadow = true;
      leafMesh.receiveShadow = true;
      stemHolder.add(leafMesh);
    }
  };

  // 3A. SW Corner (`u = 0.58m, v = 4.98m`, flanking the West side of the Squat Rack): Tall Strelitzia nicolai (Bird of Paradise)
  addSculptedGymPlanter(
    'outbuildings.gym.plants.swBirdOfParadise',
    0.58,
    4.98,
    charcoalPlanterMat,
    0.21,
    0.16,
    0.42,
    14,
    0.68,
    0.22,
    0.24
  );

  // 3B. Issue #5 ("move this plant out of the way" at `[-16.943, 0.117, 19.252]`, `outbuildings.gym.plants.seSnakePlant`):
  // Moved away from the Gym-to-Shower/Toilet Room doorway to sit neatly against the central South brick pilaster (`u = 2.86m, v = 5.08m`)!
  addSculptedGymPlanter(
    'outbuildings.gym.plants.seSnakePlant',
    2.86,
    5.08,
    limestonePlanterMat,
    0.19,
    0.15,
    0.38,
    16,
    0.56,
    0.11,
    0.06
  );

  // 3C. NW Corner (`u = 0.56m, v = 0.62m`, beside the Nike Grind Dumbbell Rack under the windows): Lush Monstera deliciosa
  addSculptedGymPlanter(
    'outbuildings.gym.plants.nwMonstera',
    0.56,
    0.62,
    limestonePlanterMat,
    0.19,
    0.14,
    0.36,
    13,
    0.48,
    0.24,
    0.22
  );

  // 3D. Slatted European Oak & Matte-Black Steel Towel / Hydration Console Bench in NE Corner (`u = 5.44m, v = 0.72m`)
  const benchConsole = new THREE.Group();
  benchConsole.name = 'outbuildings.gym.hydrationBench';
  benchConsole.position.set(5.44, gymFloorY, 0.72);
  plantsGroup.add(benchConsole);

  const oakSlatMat = new THREE.MeshStandardMaterial({
    color: 0xb88c5a,
    roughness: 0.42,
    metalness: 0.04,
  });
  const whiteTowelMat = new THREE.MeshStandardMaterial({
    color: 0xf4f2ed,
    roughness: 0.85,
  });

  const consoleTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.032, 0.72),
    oakSlatMat
  );
  consoleTop.position.set(0, 0.46, 0);
  consoleTop.castShadow = true;
  consoleTop.receiveShadow = true;
  benchConsole.add(consoleTop);

  for (const sz of [-0.31, 0.31] as const) {
    const legFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.44, 0.032),
      blackAnodizedFrameMat
    );
    legFrame.position.set(0, 0.22, sz);
    legFrame.castShadow = true;
    benchConsole.add(legFrame);
  }

  // 3 Rolled white cotton gym towels on top of the bench
  for (const [ty, tz] of [
    [0.515, -0.18],
    [0.515, -0.06],
    [0.59, -0.12],
  ] as const) {
    const towelRoll = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.042, 0.24, 16),
      whiteTowelMat
    );
    towelRoll.rotation.z = Math.PI / 2;
    towelRoll.position.set(0, ty, tz);
    towelRoll.castShadow = true;
    benchConsole.add(towelRoll);
  }

  // Tabletop ceramic succulent/fern pot on the North end of the hydration bench (`z = +0.16m`)
  addSculptedGymPlanter(
    'outbuildings.gym.plants.neBenchPlant',
    5.44,
    0.88,
    charcoalPlanterMat,
    0.09,
    0.07,
    0.16,
    9,
    0.22,
    0.08,
    0.09
  );
  const nePlant = plantsGroup.getObjectByName('outbuildings.gym.plants.neBenchPlant');
  if (nePlant) {
    nePlant.position.y = gymFloorY + 0.476;
  }
}

/**
 * Generates a large-format Calacatta Gold & Honed Limestone porcelain tile texture (`512x512`)
 * with warm alabaster stone veins and fine grout lines for the Garage/Gym Shower Room & WC.
 */
function createShowerRoomCalacattaTileTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#f2ede4';
  ctx.fillRect(0, 0, size, size);

  // Subtle marble veining across each 256x256 tile
  for (let v = 0; v < 26; v++) {
    const x0 = ((v * 97) % size);
    const y0 = ((v * 53) % size);
    ctx.strokeStyle =
      v % 3 === 0 ? 'rgba(182, 162, 134, 0.22)' : 'rgba(145, 148, 154, 0.18)';
    ctx.lineWidth = 1.2 + (v % 3) * 0.8;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.bezierCurveTo(
      x0 + 64,
      y0 + 28,
      x0 + 112,
      y0 - 24,
      x0 + 178,
      y0 + 42
    );
    ctx.stroke();
  }

  // 2x2 large-format porcelain tile grout grid
  ctx.strokeStyle = 'rgba(168, 160, 148, 0.55)';
  ctx.lineWidth = 3;
  for (const g of [0, 256]) {
    ctx.beginPath();
    ctx.moveTo(g, 0);
    ctx.lineTo(g, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, g);
    ctx.lineTo(size, g);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  return tex;
}

/**
 * Issue #1 ("We need to fit a small shower room and toilet in this back corner."
 * at `[-13.364, -0.5, 19.781]` -> Outbuilding `(u = 8.74m, y = -0.50m, v = 4.56m)`) &
 * Issue #5 ("Entrance to shower room ideally from both gym and garage, or just from 1"
 * at `[-15.934, -0.5, 19.899]` -> Outbuilding `(u = 6.17m, y = -0.50m, v = 4.46m)`):
 *
 * Builds the **Small Shower Room & Toilet (`outbuildings.garage.showerRoom`)** in the South-West back corner
 * of the Garage (`u = 5.97m..8.92m, v = 3.85m..5.43m`, `2.95m` wide x `1.58m` deep) with **dual entrances from
 * BOTH the Gym AND the Garage**:
 * 1. **Gym Entrance Door (`outbuildings.garage.showerRoom.gymDoor`, `u = 5.77..5.97m, v = 4.18..4.94m`)**:
 *    4-panel solid European oak door with oak step threshold (`gymFloorY = -0.588m` -> `garageFloorTopY = -0.50m`),
 *    brushed-brass lever handles, privacy thumbturn, and interactive hinge (`ctx.interactions.registerHingedDoor`).
 * 2. **Garage Entrance Door (`outbuildings.garage.showerRoom.garageDoor`, `v = 3.85..3.97m, u = 6.07..6.83m`)**:
 *    4-panel solid European oak door on the West side of the Shower Room North wall (`v = 3.85m`, clear to the West
 *    of the moved `southWing` cabinet at `u = 6.91..8.85m`), with interactive hinge (`ctx.interactions.registerHingedDoor`).
 * 3. **Partition Walls (`v = 3.85..3.97m` North wall & `u = 8.80..8.92m` East wall) + Cutaway Ceiling Lid**:
 *    Full-height (`y = -0.50m..1.94m`) insulated stud partition walls on `groundGroup` (so they stay at full height
 *    in cutaway mode and back the moved `southWing` cabinet & 32" monitor!) + a cutaway-aware ceiling lid with
 *    recessed LED downlights & extractor fan on `groundCeilingGroup`.
 * 4. **Interior Fixtures**:
 *    - Honed stone-tiled floor slab (`u = 5.97..8.80m, v = 3.97..5.43m, y = -0.492m`),
 *    - **Walk-In Wet-Room Shower (`outbuildings.garage.showerRoom.shower`, `u = 7.92..8.80m, v = 3.97..5.43m`)**
 *      in the East bay right at Issue #1's hit point `(u = 8.74m, v = 4.56m)`: low-profile stone-resin tray with
 *      brushed-brass linear drain, full-height Calacatta marble wall tiling, frameless 10mm glass screen (`u = 7.92m,
 *      v = 3.97..4.82m`), 300mm brushed-brass overhead rainfall shower head, thermostatic mixer & hand wand, and
 *      recessed illuminated bottle niche,
 *    - **Wall-Hung Rimless Ceramic Toilet & Concealed Cistern (`outbuildings.garage.showerRoom.toilet`)** on the
 *      South wall (`u = 7.42m, v = 5.42m`, facing North `-v`) with oak cistern shelf & brass dual-flush plate,
 *    - **Fluted-Oak & Carrara-Marble Vanity Basin + Backlit Round Brass Mirror (`outbuildings.garage.showerRoom.vanity`)**
 *      on the North wall (`u = 7.38m, v = 3.97m`, facing South `+v`),
 *    - **Brushed-Brass Heated Ladder Towel Rail (`outbuildings.garage.showerRoom.heatedTowelRail`)** on the South-West
 *      wall (`u = 6.45m, v = 5.39m`).
 */
export function buildGarageShowerRoom(
  ctx: SceneBuilderContext,
  groundGroup: THREE.Group,
  groundCeilingGroup: THREE.Group,
  garageFloorTopY: number,
  gymFloorY: number,
  eaveTopY: number
): void {
  const roomGroup = new THREE.Group();
  roomGroup.name = 'outbuildings.garage.showerRoom';
  roomGroup.userData.zone = 'study';
  groundGroup.add(roomGroup);

  const wallPlasterMat = new THREE.MeshStandardMaterial({
    color: 0xf2ede2,
    roughness: 0.84,
    metalness: 0.02,
  });
  const calacattaTileMat = new THREE.MeshStandardMaterial({
    map: createShowerRoomCalacattaTileTexture(),
    color: 0xffffff,
    roughness: 0.24,
    metalness: 0.05,
  });
  const floorStoneTileMat = new THREE.MeshStandardMaterial({
    color: 0xd8d0c4,
    roughness: 0.48,
    metalness: 0.04,
  });
  const lightOakDoorMat = new THREE.MeshStandardMaterial({
    color: 0xc2986b,
    roughness: 0.42,
    metalness: 0.04,
  });
  const darkOakRecessMat = new THREE.MeshStandardMaterial({
    color: 0xa87e51,
    roughness: 0.46,
    metalness: 0.04,
  });
  const brushedBrassMat = new THREE.MeshStandardMaterial({
    color: 0xc8a464,
    roughness: 0.24,
    metalness: 0.86,
  });
  const ceramicWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf8f9fa,
    roughness: 0.14,
    metalness: 0.06,
  });
  const showerGlassMat = new THREE.MeshStandardMaterial({
    color: 0xdcf2f9,
    roughness: 0.05,
    metalness: 0.12,
    transparent: true,
    opacity: 0.26,
    side: THREE.DoubleSide,
  });
  const mirrorSilverMat = new THREE.MeshStandardMaterial({
    map: createGymMirrorGlassTexture(),
    color: 0xeef5fc,
    roughness: 0.03,
    metalness: 0.94,
  });
  const warmDownlightLedMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e4,
    emissive: new THREE.Color(0xffc878),
    emissiveIntensity: 2.6,
    roughness: 0.15,
  });

  const uMin = 5.97;
  const uEastInner = 8.8;
  const uMax = 8.92; // 0.12m thick East partition wall
  const vNorthOuter = 3.85;
  const vNorthInner = 3.97; // 0.12m thick North partition wall
  const vSouthInner = 5.43;
  const partWallT = 0.12;
  const wallH = eaveTopY - garageFloorTopY; // 2.44m (-0.50m to +1.94m)
  const wallMidY = garageFloorTopY + wallH * 0.5;
  const doorOpeningH = 1.98;
  // ---------------------------------------------------------------------------
  // 1. Shower Room Partition Walls (`groundGroup`, full height to `eaveTopY = 1.94m`)
  //    Issue #4 ("This layout feels very tight, maybe remove the garage entrance to make it better"
  //    at `[-14.835, -0.492, 20.209]`, `outbuildings.garage.showerRoom.tiledFloor`):
  //    Removed the Garage-side doorway on the North wall so the North partition wall (`v = 3.85..3.97m`)
  //    is a continuous, solid full-height wall across `u = 5.97..8.92m`, freeing the entire North-West
  //    interior wall for a spacious staggered Vanity + Toilet + Walk-In Shower layout accessed from the Gym!
  // ---------------------------------------------------------------------------
  const northMainSpanU = uMax - uMin; // 2.95m (`u = 5.97..8.92m`)
  const northMainWall = new THREE.Mesh(
    new THREE.BoxGeometry(northMainSpanU, wallH, partWallT),
    wallPlasterMat
  );
  northMainWall.name = 'outbuildings.garage.showerRoom.northWall';
  northMainWall.userData.isArchitecturalShell = true;
  northMainWall.position.set(uMin + northMainSpanU * 0.5, wallMidY, (vNorthOuter + vNorthInner) * 0.5);
  northMainWall.castShadow = true;
  northMainWall.receiveShadow = true;
  roomGroup.add(northMainWall);

  // 1B. East Partition Wall (`u = 8.80..8.92m, v = 3.97..5.43m, y = -0.50..1.94m`)
  const eastWallSpanV = vSouthInner - vNorthInner; // 1.46m
  const eastWall = new THREE.Mesh(
    new THREE.BoxGeometry(partWallT, wallH, eastWallSpanV),
    wallPlasterMat
  );
  eastWall.name = 'outbuildings.garage.showerRoom.eastWall';
  eastWall.userData.isArchitecturalShell = true;
  eastWall.position.set((uEastInner + uMax) * 0.5, wallMidY, (vNorthInner + vSouthInner) * 0.5);
  eastWall.castShadow = true;
  eastWall.receiveShadow = true;
  roomGroup.add(eastWall);

  // 1C. Interior Calacatta Marble Porcelain Tile Wall Linings (`y = -0.49..1.92m`)
  const tileWallH = wallH - 0.03;
  const tileWallMidY = garageFloorTopY + 0.01 + tileWallH * 0.5;

  // North interior tiled lining across the full 2.815m interior North wall (`u = 5.98..8.795m, v = 3.974m`)
  const northTileLining = new THREE.Mesh(
    new THREE.BoxGeometry(2.815, tileWallH, 0.008),
    calacattaTileMat
  );
  northTileLining.name = 'outbuildings.garage.showerRoom.northTileWall';
  northTileLining.position.set(7.3875, tileWallMidY, vNorthInner + 0.004);
  northTileLining.receiveShadow = true;
  roomGroup.add(northTileLining);

  // East interior tiled lining (`u = 8.796m, v = 3.975..5.425m`)
  const eastTileLining = new THREE.Mesh(
    new THREE.BoxGeometry(0.008, tileWallH, 1.45),
    calacattaTileMat
  );
  eastTileLining.name = 'outbuildings.garage.showerRoom.eastTileWall';
  eastTileLining.position.set(uEastInner - 0.004, tileWallMidY, 4.7);
  eastTileLining.receiveShadow = true;
  roomGroup.add(eastTileLining);

  // South interior tiled lining (`u = 5.98..8.795m, v = 5.424m`)
  const southTileLining = new THREE.Mesh(
    new THREE.BoxGeometry(2.815, tileWallH, 0.008),
    calacattaTileMat
  );
  southTileLining.name = 'outbuildings.garage.showerRoom.southTileWall';
  southTileLining.position.set(7.3875, tileWallMidY, vSouthInner - 0.004);
  southTileLining.receiveShadow = true;
  roomGroup.add(southTileLining);

  // ---------------------------------------------------------------------------
  // 2. Honed Travertine / Limestone Tiled Floor Slab (`outbuildings.garage.showerRoom.tiledFloor`)
  // ---------------------------------------------------------------------------
  const floorW = uEastInner - uMin; // 2.83m
  const floorD = vSouthInner - vNorthInner; // 1.46m
  const floorSlab = new THREE.Mesh(
    new THREE.BoxGeometry(floorW, 0.008, floorD),
    floorStoneTileMat
  );
  floorSlab.name = 'outbuildings.garage.showerRoom.tiledFloor';
  floorSlab.position.set(uMin + floorW * 0.5, garageFloorTopY + 0.004, vNorthInner + floorD * 0.5);
  floorSlab.receiveShadow = true;
  roomGroup.add(floorSlab);

  // ---------------------------------------------------------------------------
  // 3. Helper to Build Interactive 4-Panel Solid European Oak Doors (Gym Entrance & Garage Entrance)
  // ---------------------------------------------------------------------------
  const buildOakShowerDoor = (
    doorGroupName: string,
    frameCenterU: number,
    frameCenterV: number,
    frameDepthT: number,
    openingW: number,
    axis: 'u' | 'v', // 'v' = wall runs along V (Gym-to-Shower door at u = 5.87m), 'u' = wall runs along U (Garage-to-Shower door at v = 3.91m)
    hingeSign: 1 | -1,
    openAngle: number
  ): void => {
    const dAssy = new THREE.Group();
    dAssy.name = `${doorGroupName}Frame`;
    dAssy.position.set(frameCenterU, garageFloorTopY, frameCenterV);
    if (axis === 'u') {
      dAssy.rotation.y = Math.PI / 2; // Rotate so local X is across wall thickness and local Z is along opening width!
    }
    roomGroup.add(dAssy);

    const jambT = 0.028;
    const archW = 0.056;
    const archT = 0.016;

    // Jambs & Head Lining
    for (const sideZ of [-1, 1] as const) {
      const jamb = new THREE.Mesh(
        new THREE.BoxGeometry(frameDepthT + 0.008, doorOpeningH, jambT),
        lightOakDoorMat
      );
      jamb.position.set(0, doorOpeningH * 0.5, sideZ * (openingW * 0.5 - jambT * 0.5));
      dAssy.add(jamb);
    }
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(frameDepthT + 0.008, jambT, openingW),
      lightOakDoorMat
    );
    head.position.set(0, doorOpeningH - jambT * 0.5, 0);
    dAssy.add(head);

    // Moulded architraves on both faces
    for (const faceX of [-1, 1] as const) {
      const xPos = faceX * (frameDepthT * 0.5 + archT * 0.5);
      for (const sideZ of [-1, 1] as const) {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(archT, doorOpeningH + archW, archW),
          darkOakRecessMat
        );
        leg.position.set(xPos, (doorOpeningH + archW) * 0.5, sideZ * (openingW * 0.5 + archW * 0.5 - 0.01));
        dAssy.add(leg);
      }
      const topArch = new THREE.Mesh(
        new THREE.BoxGeometry(archT, archW, openingW + archW * 2 - 0.02),
        darkOakRecessMat
      );
      topArch.position.set(xPos, doorOpeningH + archW * 0.5 - 0.005, 0);
      dAssy.add(topArch);
    }

    // Interactive 4-Panel Solid Oak Door Leaf
    const leafW = openingW - jambT * 2 - 0.006; // 0.698m
    const leafH = doorOpeningH - jambT - 0.012; // 1.94m
    const leafT = 0.042;
    const hingeZ = hingeSign * (leafW * 0.5);

    const leafPivot = new THREE.Group();
    leafPivot.name = doorGroupName;
    leafPivot.position.set(0, 0.008 + leafH * 0.5, hingeZ);
    dAssy.add(leafPivot);

    const leafCenterZ = -hingeSign * (leafW * 0.5);
    const leafCore = new THREE.Mesh(
      new THREE.BoxGeometry(leafT - 0.012, leafH, leafW),
      darkOakRecessMat
    );
    leafCore.name = doorGroupName;
    leafCore.position.set(0, 0, leafCenterZ);
    leafCore.castShadow = true;
    leafCore.receiveShadow = true;
    leafPivot.add(leafCore);

    const stileW = 0.095;
    for (const sz of [-leafW * 0.5 + stileW * 0.5, leafW * 0.5 - stileW * 0.5] as const) {
      const stile = new THREE.Mesh(
        new THREE.BoxGeometry(leafT, leafH, stileW),
        lightOakDoorMat
      );
      stile.position.set(0, 0, leafCenterZ + sz);
      stile.castShadow = true;
      leafPivot.add(stile);
    }
    for (const [ry, rh] of [
      [-leafH * 0.5 + 0.09, 0.18],
      [-0.12, 0.13],
      [leafH * 0.5 - 0.06, 0.12],
    ] as const) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(leafT, rh, leafW - stileW * 2),
        lightOakDoorMat
      );
      rail.position.set(0, ry, leafCenterZ);
      leafPivot.add(rail);
    }

    // Brushed-brass lever handles & bathroom privacy thumbturn rose on both faces
    const handleZ = leafCenterZ - hingeSign * (leafW * 0.5 - 0.055);
    for (const faceX of [-1, 1] as const) {
      const rose = new THREE.Mesh(
        new THREE.CylinderGeometry(0.026, 0.026, 0.008, 16),
        brushedBrassMat
      );
      rose.rotation.z = Math.PI / 2;
      rose.position.set(faceX * (leafT * 0.5 + 0.004), -0.05, handleZ);
      leafPivot.add(rose);

      const lever = new THREE.Mesh(
        new THREE.BoxGeometry(0.014, 0.016, 0.115),
        brushedBrassMat
      );
      lever.position.set(
        faceX * (leafT * 0.5 + 0.038),
        -0.05,
        handleZ + hingeSign * 0.042
      );
      leafPivot.add(lever);

      const thumbRose = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.008, 14),
        brushedBrassMat
      );
      thumbRose.rotation.z = Math.PI / 2;
      thumbRose.position.set(faceX * (leafT * 0.5 + 0.004), -0.14, handleZ);
      leafPivot.add(thumbRose);
    }

    ctx.interactions.registerHingedDoor(
      dAssy,
      leafPivot,
      new THREE.Vector3(0, 0, 0),
      'y',
      openAngle
    );
  };

  // Entrance #1: Gym-to-Shower-Room Door (`u = 5.87m, v = 4.18..4.94m`, width `0.76m`) + Solid Oak Threshold Step
  const gymStepH = garageFloorTopY - gymFloorY; // ~0.088m
  const gymThreshold = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, Math.max(0.02, gymStepH), 0.76),
    lightOakDoorMat
  );
  gymThreshold.name = 'outbuildings.garage.showerRoom.gymThreshold';
  gymThreshold.position.set(5.87, gymFloorY + Math.max(0.02, gymStepH) * 0.5, 4.56);
  gymThreshold.receiveShadow = true;
  roomGroup.add(gymThreshold);

  // Single Gym-to-Shower-Room Entrance Door (`u = 5.87m, v = 4.18..4.94m`, width `0.76m`),
  // hinged on the South jamb so it opens cleanly without crowding the interior vanity!
  buildOakShowerDoor(
    'outbuildings.garage.showerRoom.gymDoor',
    5.87,
    4.56,
    0.2,
    0.76,
    'v',
    1,
    Math.PI * 0.46
  );

  // ---------------------------------------------------------------------------
  // 4. Walk-In Wet-Room Shower Enclosure (`outbuildings.garage.showerRoom.shower`, `u = 7.92..8.80m, v = 3.97..5.43m`)
  //    Issue #1 ("Flip the shower entry around, improve the mesh of this toilet / shower fixture"
  //    at `[-14.615, -0.064, 20.352]`, `outbuildings.garage.showerRoom.toilet.seat`):
  //    - Flipped the frameless walk-in glass screen (`screenSpanV = 0.84m`), wall channel, floor channel,
  //      and overhead stabilizer bar to the **South half (`z = -0.13m .. +0.71m`, anchored to the South wall
  //      at `z = +halfD - 0.01 = +0.71m`)**, leaving the **North half (`z = -0.73m .. -0.13m`, `v = 3.97..4.57m`)**
  //      wide open as the walk-in shower entry — directly aligned with the Gym door (`v = 4.18..4.94m`) and
  //      completely clear of the Toilet (`u = 7.56m, v = 4.74..5.42m`)!
  //    - Mirrored the deluge rainfall head, thermostatic mixer, and linear drain to the sheltered South zone
  //      (`z = +0.22m`), with the adjustable hand-shower slide rail (`z = -0.04m`), catenary braided brass hose,
  //      and recessed illuminated niche (`z = -0.32m`) with 3 amber apothecary pump bottles on the East wall.
  // ---------------------------------------------------------------------------
  const showerGroup = new THREE.Group();
  showerGroup.name = 'outbuildings.garage.showerRoom.shower';
  showerGroup.position.set(8.36, garageFloorTopY + 0.008, 4.7);
  roomGroup.add(showerGroup);

  const halfD = 0.72;
  const darkGunmetalMat = new THREE.MeshStandardMaterial({
    color: 0x262a30,
    roughness: 0.34,
    metalness: 0.78,
  });
  const amberGlassMat = new THREE.MeshStandardMaterial({
    color: 0x8d4014,
    roughness: 0.14,
    metalness: 0.08,
    transparent: true,
    opacity: 0.88,
  });
  const frostedHolderGlassMat = new THREE.MeshStandardMaterial({
    color: 0xeef5f8,
    roughness: 0.38,
    metalness: 0.05,
    transparent: true,
    opacity: 0.78,
  });
  const waterSurfaceMat = new THREE.MeshStandardMaterial({
    color: 0xd4eef7,
    roughness: 0.06,
    metalness: 0.12,
    transparent: true,
    opacity: 0.76,
  });

  // Low-profile honed stone-resin wet-room tray (`0.86m x 1.44m`)
  const showerTray = new THREE.Mesh(
    new THREE.BoxGeometry(0.86, 0.026, 1.44),
    ceramicWhiteMat
  );
  showerTray.name = 'outbuildings.garage.showerRoom.shower.tray';
  showerTray.position.set(0, 0.013, 0);
  showerTray.receiveShadow = true;
  showerGroup.add(showerTray);

  // Frameless 10mm Low-Iron Toughened Glass Walk-In Shower Screen anchored to the SOUTH Wall (`z = +0.71m`)
  // Spans `z = -0.13m .. +0.71m` (centered at `z = +halfD - 0.01 - screenSpanV * 0.5 = +0.29m`),
  // leaving the North half (`z = -0.73m .. -0.13m`) completely open as the walk-in entry!
  const screenSpanV = 0.84;
  const screenH = 2.0;
  const screenCenterZ = halfD - 0.01 - screenSpanV * 0.5; // +0.29m
  const showerScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, screenH, screenSpanV),
    showerGlassMat
  );
  showerScreen.name = 'outbuildings.garage.showerRoom.showerScreen';
  showerScreen.position.set(-0.43, screenH * 0.5 + 0.01, screenCenterZ);
  showerGroup.add(showerScreen);

  // Slim Brushed-Brass U-Channel Wall Profile (on South wall `z = +halfD - 0.018`), Floor Profile & Overhead Support Bar (`z = -0.09m`)
  const wallChannel = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, screenH, 0.022),
    brushedBrassMat
  );
  wallChannel.name = 'outbuildings.garage.showerRoom.shower.glassScreen';
  wallChannel.position.set(-0.43, screenH * 0.5 + 0.01, halfD - 0.018);
  showerGroup.add(wallChannel);

  const floorChannel = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.018, screenSpanV),
    brushedBrassMat
  );
  floorChannel.position.set(-0.43, 0.015, screenCenterZ);
  showerGroup.add(floorChannel);

  const supportArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.009, 0.86, 14),
    brushedBrassMat
  );
  supportArm.rotation.z = Math.PI / 2;
  supportArm.position.set(0, screenH - 0.04, halfD - 0.01 - screenSpanV + 0.04);
  showerGroup.add(supportArm);

  // High-LOD Brushed-Brass Shower Fixture Assembly (`outbuildings.garage.showerRoom.showerFixture`)
  const showerFixtureGroup = new THREE.Group();
  showerFixtureGroup.name = 'outbuildings.garage.showerRoom.showerFixture';
  showerGroup.add(showerFixtureGroup);

  // 4A. Slotted Brushed-Brass Linear Floor Drain Channel (`0.065m x 0.004m x 0.68m`) in the sheltered South zone (`z = +0.22m`)
  const drainTrough = new THREE.Mesh(
    new THREE.BoxGeometry(0.072, 0.004, 0.69),
    darkGunmetalMat
  );
  drainTrough.position.set(0.32, 0.0265, 0.22);
  showerFixtureGroup.add(drainTrough);

  const linearDrain = new THREE.Mesh(
    new THREE.BoxGeometry(0.058, 0.005, 0.67),
    brushedBrassMat
  );
  linearDrain.position.set(0.32, 0.028, 0.22);
  showerFixtureGroup.add(linearDrain);

  for (const sx of [-0.016, 0, 0.016] as const) {
    const drainSlot = new THREE.Mesh(
      new THREE.BoxGeometry(0.005, 0.006, 0.62),
      darkGunmetalMat
    );
    drainSlot.position.set(0.32 + sx, 0.0285, 0.22);
    showerFixtureGroup.add(drainSlot);
  }

  // 4B. Concealed Thermostatic Mixer Valve Backplate, Knurled Dials & Diverter Button (`z = +0.22m`)
  const mixerBezel = new THREE.Mesh(
    new THREE.BoxGeometry(0.008, 0.24, 0.12),
    darkGunmetalMat
  );
  mixerBezel.position.set(0.431, 1.12, 0.22);
  showerFixtureGroup.add(mixerBezel);

  const mixerPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.225, 0.108),
    brushedBrassMat
  );
  mixerPlate.position.set(0.427, 1.12, 0.22);
  showerFixtureGroup.add(mixerPlate);

  for (const dy of [-0.06, 0.06] as const) {
    const indexRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.006, 20),
      darkGunmetalMat
    );
    indexRing.rotation.z = Math.PI / 2;
    indexRing.position.set(0.42, 1.12 + dy, 0.22);
    showerFixtureGroup.add(indexRing);

    const dial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.024, 0.038, 20),
      brushedBrassMat
    );
    dial.rotation.z = Math.PI / 2;
    dial.position.set(0.404, 1.12 + dy, 0.22);
    showerFixtureGroup.add(dial);

    const dialPin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.026, 10),
      brushedBrassMat
    );
    dialPin.position.set(0.396, 1.12 + dy + 0.022, 0.22);
    showerFixtureGroup.add(dialPin);
  }

  // Central push-button diverter between temperature and flow dials
  const diverterButton = new THREE.Mesh(
    new THREE.CylinderGeometry(0.011, 0.011, 0.022, 16),
    brushedBrassMat
  );
  diverterButton.rotation.z = Math.PI / 2;
  diverterButton.position.set(0.414, 1.12, 0.22);
  showerFixtureGroup.add(diverterButton);

  // 4C. Exposed Vertical Brass Riser Pipe (`y = 1.12..2.06m, z = +0.22m`), Elbow & Overhead Deluge Arm
  const riserPipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.011, 0.011, 0.94, 16),
    brushedBrassMat
  );
  riserPipe.position.set(0.412, 1.59, 0.22);
  showerFixtureGroup.add(riserPipe);

  for (const wy of [1.34, 1.88] as const) {
    const wallStandoff = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.036, 12),
      brushedBrassMat
    );
    wallStandoff.rotation.z = Math.PI / 2;
    wallStandoff.position.set(0.422, wy, 0.22);
    showerFixtureGroup.add(wallStandoff);
  }

  const showerArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.42, 16),
    brushedBrassMat
  );
  showerArm.rotation.z = Math.PI / 2;
  showerArm.position.set(0.21, 2.06, 0.22);
  showerFixtureGroup.add(showerArm);

  const armWallFlange = new THREE.Mesh(
    new THREE.CylinderGeometry(0.028, 0.028, 0.012, 18),
    brushedBrassMat
  );
  armWallFlange.rotation.z = Math.PI / 2;
  armWallFlange.position.set(0.424, 2.06, 0.22);
  showerFixtureGroup.add(armWallFlange);

  // 4D. Ultra-Slim 300mm (`r = 0.15m`) Deluge Rainfall Rose with Ball-Joint Boss & Concentric Nozzle Rings (`z = +0.22m`)
  const swivelBoss = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.028, 0.032, 18),
    brushedBrassMat
  );
  swivelBoss.position.set(0.01, 2.042, 0.22);
  showerFixtureGroup.add(swivelBoss);

  const rainfallRose = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 0.012, 32),
    brushedBrassMat
  );
  rainfallRose.name = 'outbuildings.garage.showerRoom.rainfallHead';
  rainfallRose.position.set(0.01, 2.022, 0.22);
  rainfallRose.castShadow = true;
  showerFixtureGroup.add(rainfallRose);

  const nozzleFacePlate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.142, 0.142, 0.004, 32),
    darkGunmetalMat
  );
  nozzleFacePlate.name = 'outbuildings.garage.showerRoom.shower.rainfallHead';
  nozzleFacePlate.position.set(0.01, 2.015, 0.22);
  showerFixtureGroup.add(nozzleFacePlate);

  for (const nr of [0.042, 0.084, 0.124] as const) {
    const nozzleRing = new THREE.Mesh(
      new THREE.TorusGeometry(nr, 0.0025, 8, 28),
      brushedBrassMat
    );
    nozzleRing.rotation.x = Math.PI / 2;
    nozzleRing.position.set(0.01, 2.013, 0.22);
    showerFixtureGroup.add(nozzleRing);
  }

  // 4E. Adjustable Brass Slide Rail (`z = -0.04m`), Microphone Hand Wand & Catenary Flexible Braided Hose (`TubeGeometry`)
  const riserRail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.009, 0.68, 14),
    brushedBrassMat
  );
  riserRail.position.set(0.398, 1.38, -0.04);
  showerFixtureGroup.add(riserRail);

  for (const ry of [1.06, 1.70] as const) {
    const railPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.04, 12),
      brushedBrassMat
    );
    railPost.rotation.z = Math.PI / 2;
    railPost.position.set(0.415, ry, -0.04);
    showerFixtureGroup.add(railPost);
  }

  const sliderClamp = new THREE.Mesh(
    new THREE.BoxGeometry(0.032, 0.036, 0.044),
    brushedBrassMat
  );
  sliderClamp.position.set(0.388, 1.42, -0.04);
  showerFixtureGroup.add(sliderClamp);

  const handWand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.011, 0.21, 16),
    brushedBrassMat
  );
  handWand.rotation.z = 0.22;
  handWand.position.set(0.372, 1.48, -0.04);
  showerFixtureGroup.add(handWand);

  const wandNozzleCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0142, 0.0142, 0.008, 16),
    darkGunmetalMat
  );
  wandNozzleCap.rotation.z = 0.22;
  wandNozzleCap.position.set(0.35, 1.578, -0.04);
  showerFixtureGroup.add(wandNozzleCap);

  // Smooth 5-point catenary flexible braided-brass shower hose (`THREE.TubeGeometry`)
  const hoseCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.412, 1.01, 0.22),
    new THREE.Vector3(0.395, 0.82, 0.16),
    new THREE.Vector3(0.382, 0.74, 0.08),
    new THREE.Vector3(0.378, 0.96, 0.0),
    new THREE.Vector3(0.388, 1.37, -0.04),
  ]);
  const showerHose = new THREE.Mesh(
    new THREE.TubeGeometry(hoseCurve, 28, 0.0075, 10, false),
    brushedBrassMat
  );
  showerFixtureGroup.add(showerHose);

  // 4F. Recessed Brass-Trimmed Illuminated Bottle Niche on East Shower Wall (`z = -0.32m, y = 1.22m`) + 3 Apothecary Pump Bottles
  const nicheBack = new THREE.Mesh(
    new THREE.BoxGeometry(0.008, 0.30, 0.42),
    darkGunmetalMat
  );
  nicheBack.position.set(0.428, 1.22, -0.32);
  showerFixtureGroup.add(nicheBack);

  const nicheFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.026, 0.32, 0.44),
    brushedBrassMat
  );
  nicheFrame.position.set(0.42, 1.22, -0.32);
  showerFixtureGroup.add(nicheFrame);

  const nicheLedStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.008, 0.40),
    warmDownlightLedMat
  );
  nicheLedStrip.position.set(0.418, 1.365, -0.32);
  showerFixtureGroup.add(nicheLedStrip);

  for (const bz of [-0.43, -0.32, -0.21] as const) {
    const bottleBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.125, 16),
      amberGlassMat
    );
    bottleBody.position.set(0.412, 1.135, bz);
    showerFixtureGroup.add(bottleBody);

    const bottleLabel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0285, 0.0285, 0.058, 16),
      ceramicWhiteMat
    );
    bottleLabel.position.set(0.412, 1.132, bz);
    showerFixtureGroup.add(bottleLabel);

    const pumpCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.013, 0.028, 12),
      darkGunmetalMat
    );
    pumpCollar.position.set(0.412, 1.21, bz);
    showerFixtureGroup.add(pumpCollar);

    const pumpSpout = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.006, 0.008),
      darkGunmetalMat
    );
    pumpSpout.position.set(0.402, 1.222, bz);
    showerFixtureGroup.add(pumpSpout);
  }

  // ---------------------------------------------------------------------------
  // 5. High-LOD Wall-Hung Rimless D-Shaped Ceramic Toilet & Concealed Cistern (`outbuildings.garage.showerRoom.toilet`)
  //    Staggered along the South Wall (`u = 7.56m, v = 5.42m`, facing North `-v`, clear of the flipped shower entry!).
  // ---------------------------------------------------------------------------
  const toiletGroup = new THREE.Group();
  toiletGroup.name = 'outbuildings.garage.showerRoom.toilet';
  toiletGroup.position.set(7.56, garageFloorTopY + 0.008, vSouthInner - 0.01);
  toiletGroup.rotation.y = Math.PI; // Local `+z` projects North (`-v`) into the room!
  roomGroup.add(toiletGroup);

  // 5A. Half-height tiled concealed cistern boxing (`0.54m W x 1.08m H x 0.16m D`) + solid oak shelf + brass trim strip
  const cisternBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 1.08, 0.16),
    calacattaTileMat
  );
  cisternBox.name = 'outbuildings.garage.showerRoom.toilet.cisternBox';
  cisternBox.position.set(0, 0.54, 0.08);
  cisternBox.castShadow = true;
  cisternBox.receiveShadow = true;
  toiletGroup.add(cisternBox);

  const cisternBrassTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.546, 0.008, 0.166),
    brushedBrassMat
  );
  cisternBrassTrim.position.set(0, 1.082, 0.082);
  toiletGroup.add(cisternBrassTrim);

  const cisternOakShelf = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.026, 0.18),
    lightOakDoorMat
  );
  cisternOakShelf.position.set(0, 1.098, 0.085);
  cisternOakShelf.castShadow = true;
  toiletGroup.add(cisternOakShelf);

  // 5B. Brushed-Brass Dual-Flush Actuator Plate (`0.22m x 0.145m`) with Bevelled Bezel & Tactile Circular Buttons
  const flushBezel = new THREE.Mesh(
    new THREE.BoxGeometry(0.228, 0.152, 0.006),
    darkGunmetalMat
  );
  flushBezel.position.set(0, 0.94, 0.162);
  toiletGroup.add(flushBezel);

  const flushPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.218, 0.142, 0.01),
    brushedBrassMat
  );
  flushPlate.name = 'outbuildings.garage.showerRoom.toilet.flushPlate';
  flushPlate.position.set(0, 0.94, 0.166);
  toiletGroup.add(flushPlate);

  for (const [bx, br] of [
    [-0.038, 0.026],
    [0.038, 0.018],
  ] as const) {
    const btnRecess = new THREE.Mesh(
      new THREE.CylinderGeometry(br + 0.003, br + 0.003, 0.006, 20),
      darkGunmetalMat
    );
    btnRecess.rotation.x = Math.PI / 2;
    btnRecess.position.set(bx, 0.94, 0.17);
    toiletGroup.add(btnRecess);

    const flushBtn = new THREE.Mesh(
      new THREE.CylinderGeometry(br, br, 0.008, 20),
      brushedBrassMat
    );
    flushBtn.rotation.x = Math.PI / 2;
    flushBtn.position.set(bx, 0.94, 0.173);
    toiletGroup.add(flushBtn);
  }

  // 5C. Sculpted Multi-Part D-Shaped Wall-Hung Rimless Ceramic WC Pan (`outbuildings.garage.showerRoom.toilet.pan`)
  const toiletRearShroud = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.31, 0.24),
    ceramicWhiteMat
  );
  toiletRearShroud.position.set(0, 0.245, 0.28);
  toiletRearShroud.castShadow = true;
  toiletRearShroud.receiveShadow = true;
  toiletGroup.add(toiletRearShroud);

  // Lower tapered ceramic trap skirt
  const lowerTrapSkirt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.165, 0.125, 0.27, 28),
    ceramicWhiteMat
  );
  lowerTrapSkirt.scale.set(1.0, 1.0, 1.34);
  lowerTrapSkirt.position.set(0, 0.215, 0.43);
  lowerTrapSkirt.castShadow = true;
  lowerTrapSkirt.receiveShadow = true;
  toiletGroup.add(lowerTrapSkirt);

  // Upper rimless D-shaped ceramic bowl shell
  const toiletBowl = new THREE.Mesh(
    new THREE.CylinderGeometry(0.188, 0.165, 0.14, 32),
    ceramicWhiteMat
  );
  toiletBowl.name = 'outbuildings.garage.showerRoom.toilet.pan';
  toiletBowl.scale.set(1.0, 1.0, 1.36);
  toiletBowl.position.set(0, 0.34, 0.44);
  toiletBowl.castShadow = true;
  toiletBowl.receiveShadow = true;
  toiletGroup.add(toiletBowl);

  // Molded rimless upper ceramic lip collar
  const bowlRimTorus = new THREE.Mesh(
    new THREE.TorusGeometry(0.166, 0.022, 14, 32),
    ceramicWhiteMat
  );
  bowlRimTorus.rotation.x = Math.PI / 2;
  bowlRimTorus.scale.set(1.0, 1.36, 0.55);
  bowlRimTorus.position.set(0, 0.402, 0.44);
  toiletGroup.add(bowlRimTorus);

  // Recessed inner bowl cavity & translucent water surface disc (`y = 0.318m`)
  const innerBowlWell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.146, 0.088, 0.125, 24),
    floorStoneTileMat
  );
  innerBowlWell.scale.set(1.0, 1.0, 1.32);
  innerBowlWell.position.set(0, 0.342, 0.44);
  toiletGroup.add(innerBowlWell);

  const waterSurfaceDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.092, 0.092, 0.006, 24),
    waterSurfaceMat
  );
  waterSurfaceDisc.scale.set(1.0, 1.0, 1.28);
  waterSurfaceDisc.position.set(0, 0.318, 0.44);
  toiletGroup.add(waterSurfaceDisc);

  // Concealed wall-mounting side bolt caps in brushed brass
  for (const sx of [-0.182, 0.182] as const) {
    const boltCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.008, 14),
      brushedBrassMat
    );
    boltCap.rotation.z = Math.PI / 2;
    boltCap.position.set(sx, 0.22, 0.24);
    toiletGroup.add(boltCap);
  }

  // 5D. Sculpted Ergonomic Open-Ring Soft-Close Seat (`outbuildings.garage.showerRoom.toilet.seat`) + Raised Soft-Close Lid (`lid`)
  const toiletSeatRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.156, 0.03, 16, 32),
    ceramicWhiteMat
  );
  toiletSeatRing.name = 'outbuildings.garage.showerRoom.toilet.seat';
  toiletSeatRing.rotation.x = Math.PI / 2;
  toiletSeatRing.scale.set(1.0, 1.36, 0.42);
  toiletSeatRing.position.set(0, 0.418, 0.445);
  toiletSeatRing.castShadow = true;
  toiletGroup.add(toiletSeatRing);

  const seatRearBridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.355, 0.022, 0.135),
    ceramicWhiteMat
  );
  seatRearBridge.name = 'outbuildings.garage.showerRoom.toilet.seat';
  seatRearBridge.position.set(0, 0.418, 0.26);
  seatRearBridge.castShadow = true;
  toiletGroup.add(seatRearBridge);

  // 4 rubber seat bumpers underneath the open-ring seat + twin brushed-brass soft-close hinge pillars
  for (const sx of [-0.135, 0.135] as const) {
    for (const bz of [0.34, 0.52] as const) {
      const bumper = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.006, 0.032),
        darkGunmetalMat
      );
      bumper.position.set(sx, 0.406, bz);
      toiletGroup.add(bumper);
    }
  }
  for (const hx of [-0.11, 0.11] as const) {
    const hingePillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.028, 14),
      brushedBrassMat
    );
    hingePillar.position.set(hx, 0.426, 0.21);
    toiletGroup.add(hingePillar);
  }

  // Contoured soft-close ceramic-white lid (`outbuildings.garage.showerRoom.toilet.lid`) hinged open against the cistern
  const toiletLid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.186, 0.186, 0.018, 28),
    ceramicWhiteMat
  );
  toiletLid.name = 'outbuildings.garage.showerRoom.toilet.lid';
  toiletLid.scale.set(1.0, 1.0, 1.36);
  toiletLid.rotation.x = 1.42;
  toiletLid.position.set(0, 0.65, 0.205);
  toiletLid.castShadow = true;
  toiletGroup.add(toiletLid);

  // 5E. Wall-Mounted Brushed-Brass & Frosted-Glass Toilet Brush Holder (`x = -0.34m`) + Toilet Roll Holder (`x = +0.34m`)
  const brushBracket = new THREE.Mesh(
    new THREE.BoxGeometry(0.028, 0.028, 0.075),
    brushedBrassMat
  );
  brushBracket.position.set(-0.34, 0.20, 0.04);
  toiletGroup.add(brushBracket);

  const brushCollarRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.046, 0.006, 10, 20),
    brushedBrassMat
  );
  brushCollarRing.rotation.x = Math.PI / 2;
  brushCollarRing.position.set(-0.34, 0.20, 0.095);
  toiletGroup.add(brushCollarRing);

  const brushFrostedCup = new THREE.Mesh(
    new THREE.CylinderGeometry(0.044, 0.04, 0.14, 20),
    frostedHolderGlassMat
  );
  brushFrostedCup.position.set(-0.34, 0.19, 0.095);
  toiletGroup.add(brushFrostedCup);

  const brushHandleRod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.006, 0.006, 0.22, 12),
    brushedBrassMat
  );
  brushHandleRod.position.set(-0.34, 0.31, 0.095);
  toiletGroup.add(brushHandleRod);

  const rollBackplate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.024, 0.008, 16),
    brushedBrassMat
  );
  rollBackplate.rotation.x = Math.PI / 2;
  rollBackplate.position.set(0.35, 0.64, 0.004);
  toiletGroup.add(rollBackplate);

  const rollHolderArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.018, 0.085),
    brushedBrassMat
  );
  rollHolderArm.position.set(0.35, 0.64, 0.045);
  toiletGroup.add(rollHolderArm);

  const paperRoll = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.11, 20),
    ceramicWhiteMat
  );
  paperRoll.rotation.z = Math.PI / 2;
  paperRoll.position.set(0.35, 0.61, 0.075);
  toiletGroup.add(paperRoll);

  const rollCore = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.02, 0.114, 16),
    darkOakRecessMat
  );
  rollCore.rotation.z = Math.PI / 2;
  rollCore.position.set(0.35, 0.61, 0.075);
  toiletGroup.add(rollCore);

  // ---------------------------------------------------------------------------
  // 6. Fluted-Oak & Carrara-Marble Wall-Hung Vanity Basin + Backlit Mirror (`outbuildings.garage.showerRoom.vanity`)
  //    Positioned on the solid North-West Wall (`u = 6.66m, v = 3.98m`, facing South `+v`) where the removed
  //    Garage door used to be, staggered cleanly West of the Toilet (`u = 7.56m`)!
  // ---------------------------------------------------------------------------
  const vanityGroup = new THREE.Group();
  vanityGroup.name = 'outbuildings.garage.showerRoom.vanity';
  vanityGroup.position.set(6.66, garageFloorTopY + 0.008, vNorthInner + 0.01);
  roomGroup.add(vanityGroup);

  const vanityW = 0.58;
  const vanityD = 0.36;
  const vanityH = 0.44;
  const vanityCabinet = new THREE.Mesh(
    new THREE.BoxGeometry(vanityW, vanityH, vanityD),
    lightOakDoorMat
  );
  vanityCabinet.name = 'outbuildings.garage.showerRoom.vanity.cabinet';
  vanityCabinet.position.set(0, 0.4 + vanityH * 0.5, vanityD * 0.5);
  vanityCabinet.castShadow = true;
  vanityCabinet.receiveShadow = true;
  vanityGroup.add(vanityCabinet);

  // Vertical fluted oak ribs across the front drawer face (`z = vanityD + 0.004m`)
  for (let r = -8; r <= 8; r++) {
    const fluteRib = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, vanityH - 0.03, 0.008),
      darkOakRecessMat
    );
    fluteRib.position.set(r * 0.031, 0.4 + vanityH * 0.5, vanityD + 0.004);
    vanityGroup.add(fluteRib);
  }

  // Brushed-brass knurled drawer pull bar
  const vanityPull = new THREE.Mesh(
    new THREE.CylinderGeometry(0.007, 0.007, 0.24, 12),
    brushedBrassMat
  );
  vanityPull.rotation.z = Math.PI / 2;
  vanityPull.position.set(0, 0.76, vanityD + 0.022);
  vanityGroup.add(vanityPull);

  // Carrara Marble Countertop (`0.60m x 0.028m x 0.38m`) + Oval Ceramic Countertop Vessel Basin
  const marbleTop = new THREE.Mesh(
    new THREE.BoxGeometry(vanityW + 0.02, 0.028, vanityD + 0.02),
    calacattaTileMat
  );
  marbleTop.position.set(0, 0.854, (vanityD + 0.02) * 0.5);
  marbleTop.castShadow = true;
  vanityGroup.add(marbleTop);

  const vesselBasin = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19, 0.155, 0.125, 28),
    ceramicWhiteMat
  );
  vesselBasin.name = 'outbuildings.garage.showerRoom.vanity.basin';
  vesselBasin.scale.set(1.18, 1.0, 0.78);
  vesselBasin.position.set(0, 0.93, 0.2);
  vesselBasin.castShadow = true;
  vanityGroup.add(vesselBasin);

  // Brushed-Brass Tall Monobloc Basin Mixer Tap (`y = 0.87..1.09m, z = 0.06m`)
  const tapStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.02, 0.21, 16),
    brushedBrassMat
  );
  tapStem.position.set(0, 0.97, 0.065);
  vanityGroup.add(tapStem);

  const tapSpout = new THREE.Mesh(
    new THREE.CylinderGeometry(0.011, 0.011, 0.13, 12),
    brushedBrassMat
  );
  tapSpout.rotation.x = Math.PI / 2 + 0.18;
  tapSpout.position.set(0, 1.055, 0.12);
  vanityGroup.add(tapSpout);

  // Circular Backlit Brushed-Brass Vanity Mirror (`r = 0.29m, y = 1.44m`)
  const mirrorHalo = new THREE.Mesh(
    new THREE.CylinderGeometry(0.305, 0.305, 0.008, 32),
    warmDownlightLedMat
  );
  mirrorHalo.rotation.x = Math.PI / 2;
  mirrorHalo.position.set(0, 1.44, 0.008);
  vanityGroup.add(mirrorHalo);

  const mirrorRim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.29, 0.29, 0.022, 32),
    brushedBrassMat
  );
  mirrorRim.rotation.x = Math.PI / 2;
  mirrorRim.position.set(0, 1.44, 0.016);
  vanityGroup.add(mirrorRim);

  const mirrorGlass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.278, 0.278, 0.006, 32),
    mirrorSilverMat
  );
  mirrorGlass.name = 'outbuildings.garage.showerRoom.vanity.mirror';
  mirrorGlass.rotation.x = Math.PI / 2;
  mirrorGlass.position.set(0, 1.44, 0.026);
  vanityGroup.add(mirrorGlass);

  // ---------------------------------------------------------------------------
  // 7. Brushed-Brass Heated Ladder Towel Rail (`outbuildings.garage.showerRoom.heatedTowelRail`)
  //    Mounted on the South-West Wall (`u = 6.45m, v = 5.39m`)
  // ---------------------------------------------------------------------------
  const towelRailGroup = new THREE.Group();
  towelRailGroup.name = 'outbuildings.garage.showerRoom.heatedTowelRail';
  towelRailGroup.position.set(6.45, garageFloorTopY + 0.65, vSouthInner - 0.045);
  roomGroup.add(towelRailGroup);

  for (const sx of [-0.22, 0.22] as const) {
    const upright = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.96, 14),
      brushedBrassMat
    );
    upright.position.set(sx, 0.48, 0);
    towelRailGroup.add(upright);
  }
  for (let barIdx = 0; barIdx < 8; barIdx++) {
    const crossBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.44, 12),
      brushedBrassMat
    );
    crossBar.rotation.z = Math.PI / 2;
    crossBar.position.set(0, 0.08 + barIdx * 0.115, 0.012);
    towelRailGroup.add(crossBar);
  }

  // ---------------------------------------------------------------------------
  // 8. Cutaway-Aware Shower Room Ceiling Lid & Warm LED Downlights (`groundCeilingGroup`)
  //    Hides automatically when viewing the Ground Floor in Cutaway Mode (`ceilingCutaway = true`)!
  // ---------------------------------------------------------------------------
  const ceilingGroup = new THREE.Group();
  ceilingGroup.name = 'outbuildings.garage.showerRoom.ceilingLid';
  groundCeilingGroup.add(ceilingGroup);

  const ceilingLid = new THREE.Mesh(
    new THREE.BoxGeometry(uMax - uMin, 0.06, vSouthInner - vNorthOuter),
    wallPlasterMat
  );
  ceilingLid.name = 'outbuildings.garage.showerRoom.ceilingLid';
  ceilingLid.position.set(
    (uMin + uMax) * 0.5,
    eaveTopY - 0.03,
    (vNorthOuter + vSouthInner) * 0.5
  );
  ceilingGroup.add(ceilingLid);

  const showerDownlightBezelMat = new THREE.MeshStandardMaterial({
    color: 0xc29858,
    roughness: 0.28,
    metalness: 0.84,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });
  const showerDownlightLensMat = new THREE.MeshStandardMaterial({
    color: 0xfff8eb,
    emissive: 0xffe4b8,
    emissiveIntensity: 1.9,
    roughness: 0.16,
    metalness: 0.02,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });
  for (const du of [6.65, 8.15] as const) {
    const downlightBezel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.048, 0.048, 0.012, 18),
      showerDownlightBezelMat
    );
    downlightBezel.position.set(du, eaveTopY - 0.062, 4.7);
    roomGroup.add(downlightBezel);

    const downlightLens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.038, 0.038, 0.014, 18),
      showerDownlightLensMat
    );
    downlightLens.position.set(du, eaveTopY - 0.063, 4.7);
    roomGroup.add(downlightLens);
  }

  // Warm 3000K PointLight inside the Shower Room
  const showerRoomLight = new THREE.PointLight(0xfff1dc, 2.2, 5.2, 1.5);
  showerRoomLight.position.set(7.45, eaveTopY - 0.22, 4.7);
  roomGroup.add(showerRoomLight);
}

