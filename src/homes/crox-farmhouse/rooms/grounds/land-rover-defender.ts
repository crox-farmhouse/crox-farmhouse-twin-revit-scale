import * as THREE from 'three';

/**
 * Generates a 512x512 procedural Land Rover Santorini Black Metallic (`#0d0f13` deep obsidian base
 * with fine `#1e242d` and `#2c3542` metallic micro-flake sheen) automotive paint texture.
 */
function createSantoriniBlackMetallicTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#0d0f13');
  grad.addColorStop(0.28, '#151920');
  grad.addColorStop(0.52, '#1e242d');
  grad.addColorStop(0.76, '#14181f');
  grad.addColorStop(1, '#0b0d11');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const img = ctx.getImageData(0, 0, size, size);
  const data = img.data;
  for (let i = 0; i < size * size; i++) {
    const idx = i * 4;
    const h1 = Math.sin(i * 12.9898 + 7.3) * 43758.5453;
    const f1 = h1 - Math.floor(h1);
    const h2 = Math.sin(i * 78.233 + 1.9) * 19341.1234;
    const f2 = h2 - Math.floor(h2);
    const flake = (f1 - 0.5) * 14 + (f2 > 0.86 ? 12 : 0);
    data[idx] = Math.max(8, Math.min(68, Math.round(data[idx]! + flake * 0.85)));
    data[idx + 1] = Math.max(10, Math.min(78, Math.round(data[idx + 1]! + flake * 0.95)));
    data[idx + 2] = Math.max(14, Math.min(92, Math.round(data[idx + 2]! + flake * 1.15)));
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return tex;
}

/**
 * Generates a 256x256 procedural diamond-pattern chequer-plate texture for the L663 Defender
 * bonnet tread plates and side rock-slider step pads.
 */
function createDiamondChequerPlateTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#181c22';
  ctx.fillRect(0, 0, size, size);

  const step = 16;
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const isAlt = ((x / step + y / step) & 1) === 1;
      ctx.save();
      ctx.translate(x + step * 0.5, y + step * 0.5);
      ctx.rotate(isAlt ? Math.PI / 4 : -Math.PI / 4);

      ctx.fillStyle = '#2d333d';
      ctx.beginPath();
      ctx.ellipse(0, 0, step * 0.34, step * 0.13, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#404854';
      ctx.beginPath();
      ctx.ellipse(-1, -1, step * 0.24, step * 0.07, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  return tex;
}

/**
 * Generates a crisp Satin Black / Shadow Atlas `D E F E N D E R` bonnet edge lettering texture.
 */
function createDefenderBonnetLetteringTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = 64;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, w, h);

  // Subtle dark metallic backing shadow + crisp anthracite/silver-edged Black Pack lettering
  ctx.font = 'bold 36px "Arial Black", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const chars = ['D', 'E', 'F', 'E', 'N', 'D', 'E', 'R'];
  const spacing = w / (chars.length + 1);
  for (let i = 0; i < chars.length; i++) {
    const cx = spacing * (i + 1);
    const cy = h * 0.52;
    ctx.strokeStyle = '#4a5362';
    ctx.lineWidth = 3.5;
    ctx.strokeText(chars[i]!, cx, cy);
    ctx.fillStyle = '#14171c';
    ctx.fillText(chars[i]!, cx, cy);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates the iconic oval Land Rover badge texture (Black Pack dark anthracite/emerald oval with silver script).
 */
function createLandRoverOvalBadgeTexture(): THREE.CanvasTexture {
  const w = 256;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, w, h);

  // Outer chrome/satin silver oval ring
  ctx.fillStyle = '#0d261c';
  ctx.strokeStyle = '#c8d0dc';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.5, w * 0.45, h * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = '#788496';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(w * 0.5, h * 0.5, w * 0.41, h * 0.37, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#e6ecf5';
  ctx.font = 'bold 26px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('LAND', w * 0.5, h * 0.36);
  ctx.fillText('ROVER', w * 0.5, h * 0.66);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates a crisp UK registration plate (`DEF 110X`) texture (white front / yellow rear).
 */
function createUkNumberPlateTexture(isRearYellow: boolean): THREE.CanvasTexture {
  const w = 512;
  const h = 112;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = isRearYellow ? '#f2b705' : '#f4f6f8';
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#15181c';
  ctx.lineWidth = 6;
  ctx.strokeRect(5, 5, w - 10, h - 10);

  ctx.fillStyle = '#0d3b8c';
  ctx.fillRect(8, 8, 48, h - 16);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('UK', 32, h * 0.62);

  ctx.fillStyle = '#111317';
  ctx.font = 'bold 64px "Arial Narrow", Impact, sans-serif';
  ctx.fillText('DEF 110X', w * 0.55, h * 0.54);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates a ventilated 380mm steel brake rotor texture with radial cooling slots.
 */
function createVentilatedSteelRotorTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size * 0.5;
  const cy = size * 0.5;

  ctx.fillStyle = '#7a828e';
  ctx.fillRect(0, 0, size, size);

  for (let r = 76; r < 246; r += 2) {
    ctx.strokeStyle = r % 4 === 0 ? 'rgba(182, 190, 202, 0.5)' : 'rgba(72, 78, 88, 0.45)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Dark central hat & radial ventilation grooves
  ctx.fillStyle = '#22262d';
  ctx.beginPath();
  ctx.arc(cx, cy, 88, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#262b33';
  ctx.lineWidth = 3.2;
  const slots = 24;
  for (let s = 0; s < slots; s++) {
    const a0 = (s / slots) * Math.PI * 2;
    const a1 = a0 + 0.14;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a0) * 102, cy + Math.sin(a0) * 102);
    ctx.lineTo(cx + Math.cos(a1) * 232, cy + Math.sin(a1) * 232);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates a Goodyear Wrangler All-Terrain Adventure sidewall + shoulder lug texture.
 */
function createAllTerrainTireSidewallTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size * 0.5;
  const cy = size * 0.5;

  ctx.fillStyle = '#181b1f';
  ctx.fillRect(0, 0, size, size);

  // Subtle concentric sidewall ribs
  for (const r of [156, 168, 212, 224]) {
    ctx.strokeStyle = '#252a30';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 36 aggressive outer shoulder tread lugs around perimeter
  const lugs = 36;
  for (let i = 0; i < lugs; i++) {
    const ang = (i / lugs) * Math.PI * 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(ang);
    ctx.fillStyle = i % 2 === 0 ? '#242930' : '#1f242a';
    ctx.fillRect(218, -7, 32, 14);
    ctx.restore();
  }

  // Subtle moulded sidewall lettering arcs ("GOODYEAR WRANGLER ALL-TERRAIN ADVENTURE 275/45 R22")
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = '#383f49';
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.textAlign = 'center';
  const topText = 'GOODYEAR WRANGLER ALL-TERRAIN';
  for (let i = 0; i < topText.length; i++) {
    const a = -Math.PI * 0.78 + i * 0.056;
    ctx.save();
    ctx.rotate(a);
    ctx.fillText(topText[i]!, 0, -188);
    ctx.restore();
  }
  const botText = '275/45 R22 112W M+S DEFENDER';
  for (let i = 0; i < botText.length; i++) {
    const a = Math.PI * 0.22 + i * 0.056;
    ctx.save();
    ctx.rotate(a);
    ctx.fillText(botText[i]!, 0, -188);
    ctx.restore();
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates a soft radial under-chassis ambient occlusion contact shadow texture.
 */
function createUnderCarShadowTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, w, h);
  const grad = ctx.createRadialGradient(w * 0.5, h * 0.5, 22, w * 0.5, h * 0.5, w * 0.49);
  grad.addColorStop(0, 'rgba(5, 7, 10, 0.86)');
  grad.addColorStop(0.58, 'rgba(7, 9, 14, 0.64)');
  grad.addColorStop(0.85, 'rgba(9, 12, 18, 0.24)');
  grad.addColorStop(1, 'rgba(9, 12, 18, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Evaluates a piecewise monotone-clamped cubic Hermite spline through sorted `(x, y)` control knots
 * so there is zero overshoot between stations.
 */
function evalSpline(x: number, knots: readonly (readonly [number, number])[]): number {
  if (x <= knots[0]![0]) return knots[0]![1];
  const last = knots[knots.length - 1]!;
  if (x >= last[0]) return last[1];

  for (let i = 0; i < knots.length - 1; i++) {
    const k0 = knots[i]!;
    const k1 = knots[i + 1]!;
    if (x >= k0[0] && x <= k1[0]) {
      const dx = Math.max(1e-6, k1[0] - k0[0]);
      const u = (x - k0[0]) / dx;
      const km1 = knots[Math.max(0, i - 1)]!;
      const kp2 = knots[Math.min(knots.length - 1, i + 2)]!;
      const m0 = ((k1[1] - km1[1]) / Math.max(1e-5, k1[0] - km1[0])) * dx * 0.8;
      const m1 = ((kp2[1] - k0[1]) / Math.max(1e-5, kp2[0] - k0[0])) * dx * 0.8;
      const u2 = u * u;
      const u3 = u2 * u;
      const h00 = 2 * u3 - 3 * u2 + 1;
      const h10 = u3 - 2 * u2 + u;
      const h01 = -2 * u3 + 3 * u2;
      const h11 = u3 - u2;
      return h00 * k0[1] + h10 * m0 + h01 * k1[1] + h11 * m1;
    }
  }
  return last[1];
}

/**
 * Plan-view wrap-around shift `getPlanWrapShiftX(x, z)`:
 * Captures the L663 Defender's bevelled front fascia corners (`+x` wrap at outer `z`)
 * and curved plan-view rear quarter corners (`-x` wrap into the Kamm tail).
 */
function getPlanWrapShiftX(x: number, z: number): number {
  const noseWrap = smoothstep(-1.95, -2.38, x);
  const tailWrap = smoothstep(1.98, 2.36, x);
  const zNorm = Math.min(1.12, Math.abs(z) / 0.96);
  const zCurve = Math.pow(zNorm, 2.2);
  return noseWrap * zCurve * 0.115 - tailWrap * zCurve * 0.095;
}

// ============================================================================
// AUTHENTIC LAND ROVER DEFENDER 110 (L663 V8 CARPATHIAN / BLACK PACK) CURVES
// (`x = -2.38m` front bumper face to `x = +2.36m` rear tailgate face, `4.758m` body
//  length, `+2.62m` over rear spare wheel; wheelbase `3.022m` with front axle at
//  `x = -1.51m` and rear axle at `x = +1.51m`; roof crown at `y = 1.967m`)
// ============================================================================

/**
 * 1. Centerline elevation profile `CENTERLINE_Y_KNOTS`:
 *    - Upright front skid pan & bumper face (`x = -2.38m..-2.31m`, rising from `0.33m` to `1.14m`)
 *    - Sculpted clamshell bonnet with central V8 power dome (`x = -2.31m..-0.92m`, `y = 1.15m..1.25m`)
 *    - Upright raked L663 windshield (`x = -0.92m..-0.44m`, `y = 1.25m..1.93m`)
 *    - Flat, commanding Defender safari roof crown (`x = -0.44m..+2.18m`, `y = 1.955m..1.967m`)
 *    - Vertical cut-off Kamm rear tailgate (`x = +2.28m..+2.36m`, dropping cleanly to the rear skid pan at `y = 0.34m`).
 */
const CENTERLINE_Y_KNOTS: readonly (readonly [number, number])[] = [
  [-2.38, 0.33],
  [-2.36, 0.62],
  [-2.33, 0.96],
  [-2.29, 1.145], // Leading edge of clamshell bonnet
  [-2.14, 1.192],
  [-1.82, 1.218],
  [-1.36, 1.236],
  [-0.94, 1.246], // Base of windshield cowl
  [-0.78, 1.48],
  [-0.58, 1.78],
  [-0.44, 1.928], // Top of windshield header
  [-0.22, 1.958],
  [0.45, 1.967], // Peak of Defender 110 roof crown
  [1.35, 1.965],
  [2.08, 1.954],
  [2.26, 1.928], // Rear roof header above tailgate glass
  [2.32, 1.56],
  [2.35, 1.22], // Base of rear tailgate window / waist line
  [2.36, 0.72], // Vertical Kamm tailgate lower face
];

/**
 * 2. Horizontal Defender Barrel Waist Shoulder Line `SHOULDER_Y_KNOTS`:
 *    Runs continuously at `y ≈ 1.24m` from the clamshell bonnet edge across the doors
 *    to the vertical rear corner pillars (`x = +2.35m`).
 */
const SHOULDER_Y_KNOTS: readonly (readonly [number, number])[] = [
  [-2.38, 0.33],
  [-2.35, 0.64],
  [-2.31, 1.02],
  [-2.24, 1.145],
  [-1.95, 1.205],
  [-1.51, 1.232], // Above front wheel arch
  [-0.92, 1.242], // Front A-pillar waist
  [0.0, 1.244], // Mid-door horizontal barrel waist
  [0.95, 1.245],
  [1.51, 1.245], // Above rear wheel arch
  [2.15, 1.242],
  [2.32, 1.232], // Rear corner pillar waist
  [2.35, 0.88],
  [2.36, 0.62],
];

/**
 * 3. Plan-View Outer Body Half-Width `BODY_WIDTH_Z_KNOTS`:
 *    Captures the muscular `2.008m` (`z = ±1.004m`) Defender wheel-arch fenders and taut barrel flanks.
 */
const BODY_WIDTH_Z_KNOTS: readonly (readonly [number, number])[] = [
  [-2.38, 0.78],
  [-2.32, 0.88],
  [-2.14, 0.945],
  [-1.82, 0.988],
  [-1.51, 1.002], // Muscular front wheel arch flare (`2.004m` width)
  [-1.12, 0.972],
  [-0.75, 0.956],
  [0.0, 0.954], // Door flank width
  [0.82, 0.962],
  [1.18, 0.988],
  [1.51, 1.004], // Muscular rear wheel arch flare (`2.008m` width)
  [1.88, 0.985],
  [2.20, 0.945],
  [2.36, 0.885],
];

/**
 * 4. Plan-View Roof Cantrail & Bonnet Crown Half-Width `CROWN_WIDTH_Z_KNOTS`:
 */
const CROWN_WIDTH_Z_KNOTS: readonly (readonly [number, number])[] = [
  [-2.38, 0.56],
  [-2.24, 0.68],
  [-1.85, 0.74],
  [-1.35, 0.77],
  [-0.92, 0.785], // Windshield base half-width
  [-0.48, 0.735], // Windshield header half-width
  [0.20, 0.732], // Flat floating roof cantrail half-width
  [1.20, 0.728],
  [2.05, 0.715],
  [2.28, 0.695],
  [2.36, 0.66],
];

/**
 * Evaluates the squared-off circular wheel-arch cutout height `yArch(x)` around the
 * front (`x = -1.51m`) and rear (`x = +1.51m`) axles.
 */
function sampleWheelArchCutoutY(x: number, yBaseSill: number): number {
  const rArch = 0.448;
  const yCenterArch = 0.415;

  for (const xAxle of [-1.51, 1.51] as const) {
    const dx = x - xAxle;
    if (Math.abs(dx) < rArch) {
      // Slightly squared-off super-circular Defender arch profile (`exponent = 2.35`)
      const u = Math.min(1, Math.abs(dx) / rArch);
      const archRise = rArch * Math.pow(Math.max(0, 1 - Math.pow(u, 2.35)), 1 / 2.2);
      return Math.max(yBaseSill, yCenterArch + archRise);
    }
  }
  return yBaseSill;
}

/**
 * Computes a single cross-section half-profile (`nv + 1` points from `z = 0` centerline to lower rocker sill)
 * at longitudinal station `x` (`-2.38m .. +2.36m`).
 */
function sampleDefenderHalfProfile(x: number, nv: number): [number, number][] {
  const yCenter = evalSpline(x, CENTERLINE_Y_KNOTS);
  const yShoulder = evalSpline(x, SHOULDER_Y_KNOTS);
  const zMax = evalSpline(x, BODY_WIDTH_Z_KNOTS);
  const zCrown = Math.min(zMax * 0.84, evalSpline(x, CROWN_WIDTH_Z_KNOTS));

  const frontApproach = smoothstep(-1.88, -2.38, x);
  const rearDeparture = smoothstep(1.88, 2.36, x);
  const yBaseSill = 0.25 + frontApproach * 0.08 + rearDeparture * 0.09;
  const yArchCut = sampleWheelArchCutoutY(x, yBaseSill);

  const bonnetWeight =
    smoothstep(-2.28, -2.08, x) * (1 - smoothstep(-1.02, -0.88, x));
  const cabinWeight =
    smoothstep(-0.92, -0.52, x) * (1 - smoothstep(2.24, 2.35, x));

  // Muscular fender blister weight around front (`x = -1.51m`) and rear (`x = +1.51m`) wheel arches
  const frontBlister = Math.exp(-Math.pow((x - -1.51) / 0.52, 2));
  const rearBlister = Math.exp(-Math.pow((x - 1.51) / 0.54, 2));
  const archBlister = Math.max(frontBlister, rearBlister);

  const pts: [number, number][] = [];
  for (let j = 0; j <= nv; j++) {
    const v = j / nv;
    let y = 0;
    let z = 0;

    if (v <= 0.30) {
      // Region 1: Roof crown / Windshield / Sculpted Clamshell Bonnet with V8 Power Dome
      const u = v / 0.30;
      z = u * zCrown;
      const roofCamber = cabinWeight * 0.014 * (1 - u * u);
      // Central raised V8 bonnet dome (`u < 0.58`) stepping down into the bonnet valley channel (`u ≈ 0.65..0.85`)
      const domeStep = 1 - smoothstep(0.48, 0.68, u);
      const valleyDip =
        smoothstep(0.56, 0.68, u) * (1 - smoothstep(0.74, 0.88, u));
      const bonnetSculpt = bonnetWeight * (domeStep * 0.026 - valleyDip * 0.012);
      y = yCenter + roofCamber + bonnetSculpt;
    } else if (v <= 0.56) {
      // Region 2: Upright Tumblehome Greenhouse & Iconic Horizontal Defender Barrel Shoulder Shelf
      const u = (v - 0.30) / 0.26;
      // Near `u = 0.82..1.0`, flatten slightly into the horizontal Defender shoulder chamfer
      const shoulderShelf = smoothstep(0.78, 0.98, u);
      const glassSlopeU = Math.min(1, u * 1.15);
      const yGreenhouse = lerp(
        yCenter,
        yShoulder + 0.015,
        0.86 * glassSlopeU + 0.14 * shoulderShelf
      );
      const yBonnetFender = lerp(yCenter, yShoulder, smoothstep(0, 1, u));
      y = lerp(yBonnetFender, yGreenhouse, cabinWeight);

      // Greenhouse tumblehome widens from `zCrown` (`~0.73m`) to the outer waist shoulder (`zMax * 0.955`)
      const shelfFlare = smoothstep(0.74, 1.0, u) * 0.032;
      z = lerp(zCrown, zMax * 0.925, Math.pow(u, 0.88)) + shelfFlare;
    } else if (v <= 0.90) {
      // Region 3: Muscular Lower Body Side Flank & Squared Fender Blister
      const u = (v - 0.56) / 0.34;
      const yFlankNominal = lerp(yShoulder, yBaseSill + 0.04, u);
      const yClampedMin = yArchCut + 0.024 + (1 - u) * 0.045;
      y = Math.max(yFlankNominal, lerp(yShoulder, yClampedMin, u));

      // Barrel side profile with prominent squared wheel-arch flare
      const barrelCurve = Math.sin(u * Math.PI * 0.86) * 0.026;
      const blisterOut = archBlister * smoothstep(0.08, 0.55, u) * 0.022;
      z = lerp(zMax * 0.955, zMax * 0.975, u) + barrelCurve + blisterOut;
    } else {
      // Region 4: Lower Rocker Sill & Wheel-Arch Lip Return Flange
      const u = (v - 0.90) / 0.10;
      const yTop = Math.max(lerp(yShoulder, yBaseSill + 0.04, 1.0), yArchCut + 0.024);
      y = lerp(yTop, yArchCut, u);
      const isWheelArch = smoothstep(yBaseSill + 0.015, yBaseSill + 0.14, yArchCut);
      const tuckIn = lerp(0.055, 0.018, isWheelArch);
      z = zMax * 0.975 - u * tuckIn;
    }

    pts.push([y, Math.max(0, z)]);
  }

  return pts;
}

/**
 * Samples the lateral outer surface `z(x, y)` on the Defender body shell for conformal side glazing & trim.
 */
function sampleLateralSurfaceZAtXY(x: number, yTarget: number): number {
  const halfPts = sampleDefenderHalfProfile(x, 64);
  let bestZ = halfPts[22]![1];
  let bestDiff = 1e9;
  for (let j = 16; j < 56; j++) {
    const [y0, z0] = halfPts[j]!;
    const [y1, z1] = halfPts[j + 1]!;
    const yMaxSeg = Math.max(y0, y1);
    const yMinSeg = Math.min(y0, y1);
    if (yTarget <= yMaxSeg && yTarget >= yMinSeg) {
      const t = Math.abs(y0 - y1) > 1e-5 ? (yTarget - y0) / (y1 - y0) : 0;
      return lerp(z0, z1, t);
    }
    const diff = Math.abs(y0 - yTarget);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestZ = z0;
    }
  }
  return bestZ;
}

/**
 * Builds the unified, water-tight, high-density parametric lofted L663 Land Rover Defender 110
 * monocoque body shell (`courtyard.landRoverDefender.bodyShell`) across 96 longitudinal stations
 * and 97 transverse profile points per station (`computeVertexNormals()`).
 */
function createUnifiedDefender110BodyGeometry(): THREE.BufferGeometry {
  const nx = 96; // >= 56 longitudinal stations
  const nv = 48; // 97 transverse profile points per station (>= 44)
  const xMin = -2.38;
  const xMax = 2.36;
  const rowStride = nv * 2 + 1;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Add 1 front lower skid-pan closure station so the front chin is 100% water-tight
  const firstHalfPts = sampleDefenderHalfProfile(xMin, nv);
  for (let k = -nv; k <= nv; k++) {
    const j = Math.abs(k);
    const signZ = k < 0 ? -1 : k > 0 ? 1 : 0;
    const [, pzOrig] = firstHalfPts[j]!;
    const pz = signZ * pzOrig * 0.92;
    const py = 0.28;
    const vx = -2.32 + getPlanWrapShiftX(xMin, pz);
    positions.push(vx, py, pz);
    uvs.push(0.0, (pz + 1.0) / 2.0);
  }

  for (let i = 0; i <= nx; i++) {
    const t = i / nx;
    const shapedT = 0.5 - 0.5 * Math.cos(t * Math.PI);
    const x = lerp(xMin, xMax, lerp(t, shapedT, 0.28));
    const halfPts = sampleDefenderHalfProfile(x, nv);

    for (let k = -nv; k <= nv; k++) {
      const j = Math.abs(k);
      const signZ = k < 0 ? -1 : k > 0 ? 1 : 0;
      const [py, pzAbs] = halfPts[j]!;
      const pz = signZ * pzAbs;
      const vx = x + getPlanWrapShiftX(x, pz);

      positions.push(vx, py, pz);
      uvs.push((vx - xMin) / (xMax - xMin), (pz + 1.0) / 2.0);
    }
  }

  // Add 2 rear lower bumper / valance closure stations so the vertical Kamm tail is 100% water-tight
  const lastHalfPts = sampleDefenderHalfProfile(xMax, nv);
  for (const [extraX, targetCenterY, tuckScaleZ] of [
    [2.35, 0.36, 0.96],
    [2.26, 0.29, 0.9],
  ] as const) {
    for (let k = -nv; k <= nv; k++) {
      const j = Math.abs(k);
      const signZ = k < 0 ? -1 : k > 0 ? 1 : 0;
      const vFrac = j / nv;
      const [, pzOrig] = lastHalfPts[j]!;
      const pz = signZ * pzOrig * tuckScaleZ;
      const py = lerp(targetCenterY, 0.29, Math.pow(vFrac, 0.75));
      const vx = extraX + getPlanWrapShiftX(extraX, pz);

      positions.push(vx, py, pz);
      uvs.push(1.0, (pz + 1.0) / 2.0);
    }
  }

  const totalStations = nx + 3;
  for (let i = 0; i < totalStations; i++) {
    const r0 = i * rowStride;
    const r1 = (i + 1) * rowStride;
    for (let c = 0; c < rowStride - 1; c++) {
      const a = r0 + c;
      const b = r1 + c;
      const d = r1 + c + 1;
      const e = r0 + c + 1;
      indices.push(a, b, d, a, d, e);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds a conformal surface patch directly over the parametric Defender monocoque `(x, v)` domain.
 */
function createConformalDefenderPatchGeometry(
  xStart: number,
  xEnd: number,
  vStartFunc: (x: number) => number,
  vEndFunc: (x: number) => number,
  segX: number,
  segV: number,
  outwardOffsetY: number,
  outwardOffsetZ: number,
  mirrorBothSides: boolean
): THREE.BufferGeometry {
  const nv = 64;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const sides = mirrorBothSides ? ([-1, 1] as const) : ([1] as const);

  for (const sideZ of sides) {
    const baseVertex = positions.length / 3;
    for (let ix = 0; ix <= segX; ix++) {
      const tx = ix / segX;
      const x = lerp(xStart, xEnd, tx);
      const halfPts = sampleDefenderHalfProfile(x, nv);
      const v0 = vStartFunc(x);
      const v1 = vEndFunc(x);

      for (let iv = 0; iv <= segV; iv++) {
        const tv = iv / segV;
        const v = mirrorBothSides ? lerp(v0, v1, tv) : lerp(-v1, v1, tv);
        const absV = Math.abs(v);
        const sign = mirrorBothSides ? sideZ : v < 0 ? -1 : 1;

        const fIdx = Math.min(nv - 1e-4, Math.max(0, absV * nv));
        const j0 = Math.floor(fIdx);
        const j1 = Math.min(nv, j0 + 1);
        const frac = fIdx - j0;

        const p0 = halfPts[j0]!;
        const p1 = halfPts[j1]!;
        const py = lerp(p0[0], p1[0], frac) + outwardOffsetY;
        const pz = sign * (lerp(p0[1], p1[1], frac) + outwardOffsetZ);
        const vx = x + getPlanWrapShiftX(x, pz);

        positions.push(vx, py, pz);
        uvs.push(tx, tv);
      }
    }

    const stride = segV + 1;
    for (let ix = 0; ix < segX; ix++) {
      for (let iv = 0; iv < segV; iv++) {
        const a = baseVertex + ix * stride + iv;
        const b = baseVertex + (ix + 1) * stride + iv;
        const c = baseVertex + (ix + 1) * stride + iv + 1;
        const d = baseVertex + ix * stride + iv + 1;
        if (sideZ > 0 || !mirrorBothSides) {
          indices.push(a, b, c, a, c, d);
        } else {
          indices.push(a, c, b, a, d, c);
        }
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds a conformal lateral panel or side window on one or both sides of the Defender greenhouse/flank.
 */
function createConformalLateralWindowOrPanelGeometry(
  xStart: number,
  xEnd: number,
  yBotFunc: (x: number) => number,
  yTopFunc: (x: number) => number,
  segX: number,
  segY: number,
  outwardZOffset: number,
  sides: readonly (-1 | 1)[] = [-1, 1]
): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (const sideZ of sides) {
    const baseVertex = positions.length / 3;
    for (let ix = 0; ix <= segX; ix++) {
      const tx = ix / segX;
      const x = lerp(xStart, xEnd, tx);
      const yBot = yBotFunc(x);
      const yTop = Math.max(yBot + 0.005, yTopFunc(x));

      for (let iy = 0; iy <= segY; iy++) {
        const ty = iy / segY;
        const py = lerp(yBot, yTop, ty);
        const zSurf = sampleLateralSurfaceZAtXY(x, py);
        const pz = sideZ * (zSurf + outwardZOffset);
        const vx = x + getPlanWrapShiftX(x, pz);

        positions.push(vx, py, pz);
        uvs.push(tx, ty);
      }
    }

    const stride = segY + 1;
    for (let ix = 0; ix < segX; ix++) {
      for (let iy = 0; iy < segY; iy++) {
        const a = baseVertex + ix * stride + iy;
        const b = baseVertex + (ix + 1) * stride + iy;
        const c = baseVertex + (ix + 1) * stride + iy + 1;
        const d = baseVertex + ix * stride + iy + 1;
        if (sideZ > 0) {
          indices.push(a, c, b, a, d, c);
        } else {
          indices.push(a, b, c, a, c, d);
        }
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Builds the squared-off L663 Narvik Gloss Black wheel-arch cladding lip and deep inner wheelhouse liner
 * around the front (`x = -1.51m`) and rear (`x = +1.51m`) axles.
 */
function buildDefenderWheelArchCladdingAndLiner(
  parent: THREE.Group,
  xAxle: number,
  yAxle: number,
  rArch: number,
  zOuter: number,
  claddingMat: THREE.Material,
  linerMat: THREE.Material
): void {
  const segs = 36;
  const lipPositions: number[] = [];
  const lipIndices: number[] = [];
  const linerPositions: number[] = [];
  const linerIndices: number[] = [];

  const lipWidth = 0.046; // Bold L663 Defender Black Pack squared arch eyebrow cladding
  const linerDepthZ = 0.38;

  for (const sideZ of [-1, 1] as const) {
    const lipBase = lipPositions.length / 3;
    const linerBase = linerPositions.length / 3;

    for (let s = 0; s <= segs; s++) {
      const ang = -0.08 + (s / segs) * (Math.PI + 0.16);
      const c = Math.cos(ang);
      const sn = Math.sin(ang);
      // Slight super-ellipse squaring at top of Defender wheel arch
      const sqFactor = 1 + 0.06 * Math.sin(ang * 2) * Math.sin(ang);
      const rIn = rArch * sqFactor;
      const rOut = (rArch + lipWidth) * sqFactor;

      const px = xAxle - c * rIn;
      const py = Math.max(0.25, yAxle + sn * rIn);
      const pxOut = xAxle - c * rOut;
      const pyOut = Math.max(0.25, yAxle + sn * rOut);

      const zRim = sideZ * (zOuter + 0.012);
      const zIn = sideZ * (zOuter - 0.024);
      const zDeep = sideZ * (zOuter - linerDepthZ);

      lipPositions.push(pxOut, pyOut, zRim, px, py, zIn);
      linerPositions.push(
        px,
        py,
        zIn,
        px * 0.97 + xAxle * 0.03,
        Math.max(0.24, py - 0.02),
        zDeep
      );
    }

    for (let s = 0; s < segs; s++) {
      const a = lipBase + s * 2;
      const b = a + 1;
      const c = a + 2;
      const d = a + 3;
      if (sideZ > 0) {
        lipIndices.push(a, b, d, a, d, c);
      } else {
        lipIndices.push(a, d, b, a, c, d);
      }

      const la = linerBase + s * 2;
      const lb = la + 1;
      const lc = la + 2;
      const ld = la + 3;
      if (sideZ > 0) {
        linerIndices.push(la, lb, ld, la, ld, lc);
      } else {
        linerIndices.push(la, ld, lb, la, lc, ld);
      }
    }
  }

  const lipGeo = new THREE.BufferGeometry();
  lipGeo.setAttribute('position', new THREE.Float32BufferAttribute(lipPositions, 3));
  lipGeo.setIndex(lipIndices);
  lipGeo.computeVertexNormals();
  const lipMesh = new THREE.Mesh(lipGeo, claddingMat);
  lipMesh.name = 'courtyard.landRoverDefender.wheelArchCladding';
  lipMesh.castShadow = true;
  lipMesh.receiveShadow = true;
  parent.add(lipMesh);

  const linerGeo = new THREE.BufferGeometry();
  linerGeo.setAttribute('position', new THREE.Float32BufferAttribute(linerPositions, 3));
  linerGeo.setIndex(linerIndices);
  linerGeo.computeVertexNormals();
  const linerMesh = new THREE.Mesh(linerGeo, linerMat);
  linerMesh.name = 'courtyard.landRoverDefender.wheelhouseLiner';
  parent.add(linerMesh);
}

/**
 * Builds a 22-Inch Land Rover Style 5098 5-Spoke Gloss Black Forged Alloy Wheel & Goodyear Wrangler
 * All-Terrain Adventure Tire (`tireR = 0.405m, width = 0.285m`).
 * Can be mounted on any of the 4 road corners (with 380mm ventilated brake rotor & 6-piston/4-piston
 * Xenon Blue V8 brake caliper) or on the rear tailgate spare wheel carrier (`isSpare = true`).
 */
function buildDefenderStyle5098WheelAssembly(
  parent: THREE.Group,
  meshName: string,
  tireRadius: number,
  rimRadius: number,
  tireWidth: number,
  isLeft: boolean,
  isFront: boolean,
  isSpare: boolean,
  materials: {
    tireRubberMat: THREE.Material;
    tireSidewallMat: THREE.Material;
    narvikGlossBlackMat: THREE.Material;
    satinAnthraciteMat: THREE.Material;
    steelRotorMat: THREE.Material;
    xenonBlueCaliperMat: THREE.Material;
    chromeLugMat: THREE.Material;
    landRoverBadgeMat: THREE.Material;
  }
): THREE.Group {
  const signZ = isLeft ? -1 : 1;
  const wheelGroup = new THREE.Group();
  wheelGroup.name = meshName;
  parent.add(wheelGroup);

  // 1. Goodyear Wrangler All-Terrain Adventure Tire Tread Cylinder (`openEnded = true` so wheel spokes & brakes are 100% visible)
  const treadW = tireWidth * 0.80;
  const treadCyl = new THREE.Mesh(
    new THREE.CylinderGeometry(tireRadius, tireRadius, treadW, 40, 1, true),
    materials.tireRubberMat
  );
  treadCyl.rotation.x = Math.PI / 2;
  treadCyl.castShadow = true;
  treadCyl.receiveShadow = true;
  wheelGroup.add(treadCyl);

  // Sculpted 3D All-Terrain Shoulder Tread Blocks around both outer edges of the tire crown
  const numShoulderBlocks = 30;
  const blockRadius = tireRadius - 0.008;
  for (let i = 0; i < numShoulderBlocks; i++) {
    const ang = (i / numShoulderBlocks) * Math.PI * 2;
    const bx = Math.cos(ang) * blockRadius;
    const by = Math.sin(ang) * blockRadius;
    for (const side of [-1, 1] as const) {
      const lug = new THREE.Mesh(
        new THREE.BoxGeometry(0.036, 0.016, 0.048),
        materials.tireRubberMat
      );
      lug.position.set(bx, by, side * (treadW * 0.44));
      lug.rotation.z = ang + Math.PI / 2;
      wheelGroup.add(lug);
    }
  }

  // Moulded All-Terrain Sidewall Torus Rings (`rimRadius -> tireRadius`)
  const sidewallTubeR = (tireRadius - rimRadius) * 0.56;
  const sidewallMajorR = rimRadius + sidewallTubeR * 0.92;
  for (const side of [-1, 1] as const) {
    const sidewallTorus = new THREE.Mesh(
      new THREE.TorusGeometry(sidewallMajorR, sidewallTubeR, 16, 40),
      materials.tireSidewallMat
    );
    sidewallTorus.scale.set(1, 1, 0.52);
    sidewallTorus.position.set(0, 0, side * (treadW * 0.46));
    wheelGroup.add(sidewallTorus);
  }

  // 2. 22" Style 5098 Gloss Black Forged Alloy Wheel Barrel & Rim Flange
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(rimRadius, rimRadius * 0.95, tireWidth * 0.80, 36, 1, true),
    materials.narvikGlossBlackMat
  );
  barrel.rotation.x = Math.PI / 2;
  wheelGroup.add(barrel);

  const innerWheelBackDisk = new THREE.Mesh(
    new THREE.CircleGeometry(rimRadius * 0.94, 32),
    materials.satinAnthraciteMat
  );
  innerWheelBackDisk.position.set(0, 0, -signZ * (tireWidth * 0.34));
  if (!isLeft) innerWheelBackDisk.rotation.y = Math.PI;
  wheelGroup.add(innerWheelBackDisk);

  const outerFaceZ = signZ * (tireWidth * 0.41);
  const rimLipRing = new THREE.Mesh(
    new THREE.TorusGeometry(rimRadius, 0.014, 14, 40),
    materials.narvikGlossBlackMat
  );
  rimLipRing.scale.set(1, 1, 0.65);
  rimLipRing.position.set(0, 0, outerFaceZ);
  wheelGroup.add(rimLipRing);

  // 3. 22" Land Rover Style 5098 5-Spoke Gloss Black Forged Alloy Spokes (5 sculpted split/chamfered spokes)
  const hubRadius = 0.072;
  const spokeLen = rimRadius - hubRadius - 0.006;
  const spokeMidR = hubRadius + spokeLen * 0.5;
  for (let s = 0; s < 5; s++) {
    const spokeAngle = (s / 5) * Math.PI * 2 + Math.PI / 10;
    const spokeGroup = new THREE.Group();
    spokeGroup.position.set(
      Math.cos(spokeAngle) * spokeMidR,
      Math.sin(spokeAngle) * spokeMidR,
      outerFaceZ - signZ * 0.015
    );
    spokeGroup.rotation.z = spokeAngle - Math.PI / 2;
    spokeGroup.rotation.x = signZ * 0.09;
    wheelGroup.add(spokeGroup);

    // Central muscular spoke beam
    const mainBeam = new THREE.Mesh(
      new THREE.BoxGeometry(0.056, spokeLen, 0.026),
      materials.narvikGlossBlackMat
    );
    spokeGroup.add(mainBeam);

    // Twin chamfered outer ribs flanking each Style 5098 spoke
    for (const ribSide of [-1, 1] as const) {
      const rib = new THREE.Mesh(
        new THREE.BoxGeometry(0.016, spokeLen * 0.94, 0.032),
        materials.satinAnthraciteMat
      );
      rib.position.set(ribSide * 0.026, 0, signZ * 0.003);
      rib.rotation.z = -ribSide * 0.045;
      spokeGroup.add(rib);
    }

    // Recessed central pocket groove along spoke face
    const spokePocket = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, spokeLen * 0.72, 0.030),
      materials.narvikGlossBlackMat
    );
    spokePocket.position.set(0, 0, -signZ * 0.002);
    spokeGroup.add(spokePocket);
  }

  // 4. Center Hub, 5 Chrome Lug Bolts & Land Rover Oval Center Cap
  const hubCyl = new THREE.Mesh(
    new THREE.CylinderGeometry(hubRadius, hubRadius * 1.08, 0.048, 28),
    materials.narvikGlossBlackMat
  );
  hubCyl.rotation.x = Math.PI / 2;
  hubCyl.position.set(0, 0, outerFaceZ - signZ * 0.024);
  wheelGroup.add(hubCyl);

  for (let b = 0; b < 5; b++) {
    const boltAng = (b / 5) * Math.PI * 2;
    const lugBolt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0085, 0.0085, 0.022, 10),
      materials.chromeLugMat
    );
    lugBolt.rotation.x = Math.PI / 2;
    lugBolt.position.set(
      Math.cos(boltAng) * 0.048,
      Math.sin(boltAng) * 0.048,
      outerFaceZ - signZ * 0.006
    );
    wheelGroup.add(lugBolt);
  }

  const centerCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.034, 0.036, 0.016, 24),
    materials.narvikGlossBlackMat
  );
  centerCap.rotation.x = Math.PI / 2;
  centerCap.position.set(0, 0, outerFaceZ + signZ * 0.002);
  wheelGroup.add(centerCap);

  const badgeDisk = new THREE.Mesh(
    new THREE.CircleGeometry(0.028, 20),
    materials.landRoverBadgeMat
  );
  badgeDisk.position.set(0, 0, outerFaceZ + signZ * 0.011);
  if (isLeft) badgeDisk.rotation.y = Math.PI;
  wheelGroup.add(badgeDisk);

  // 5. Road-Corner Ventilated 380mm Steel Brake Disc Rotor + 6-Piston Front / 4-Piston Rear V8 Brake Caliper
  if (!isSpare) {
    const rotorR = isFront ? 0.195 : 0.185;
    const rotorMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(rotorR, rotorR, 0.028, 36),
      materials.steelRotorMat
    );
    rotorMesh.name = 'courtyard.landRoverDefender.brakeRotor';
    rotorMesh.rotation.x = Math.PI / 2;
    rotorMesh.position.set(0, 0, outerFaceZ - signZ * 0.062);
    wheelGroup.add(rotorMesh);

    const caliperAngle = isFront ? 0.35 : Math.PI - 0.35;
    const caliperR = rotorR - 0.028;
    const caliperGroup = new THREE.Group();
    caliperGroup.name = 'courtyard.landRoverDefender.brakeCaliper';
    caliperGroup.position.set(
      Math.cos(caliperAngle) * caliperR,
      Math.sin(caliperAngle) * caliperR,
      outerFaceZ - signZ * 0.054
    );
    caliperGroup.rotation.z = caliperAngle;
    wheelGroup.add(caliperGroup);

    const caliperBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.078, isFront ? 0.195 : 0.155, 0.072),
      materials.xenonBlueCaliperMat
    );
    caliperBody.name = 'courtyard.landRoverDefender.brakeCaliper';
    caliperGroup.add(caliperBody);

    const caliperBridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.084, isFront ? 0.145 : 0.115, 0.042),
      materials.narvikGlossBlackMat
    );
    caliperBridge.position.set(0.008, 0, 0);
    caliperGroup.add(caliperBridge);
  }

  return wheelGroup;
}

/**
 * Builds an extraordinary, showroom-grade, ultra-accurate 3D model of a
 * **Black Land Rover Defender 110 (L663 V8 Carpathian / Black Pack Edition in Santorini Black Metallic)**
 * (`courtyard.landRoverDefender`, `userData.zone = 'courtyard'`) parked on the cobbled courtyard
 * at world `[-12.538, -0.353, 6.565]`.
 */
export function buildLandRoverDefender(
  scene: THREE.Scene,
  getCourtyardGroundY?: (wx: number, wz: number) => number
): void {
  const defenderGroup = new THREE.Group();
  defenderGroup.name = 'courtyard.landRoverDefender';
  defenderGroup.userData.zone = 'courtyard';

  // ---------------------------------------------------------------------------
  // Placement, Orientation & Graded Courtyard Cobble Terrain Alignment
  // ---------------------------------------------------------------------------
  const worldCenterX = -12.538;
  const worldCenterZ = 6.565;
  const yaw = -0.145; // Front nose (-x) faces West-Southwest toward Courtyard Driveway Gate

  // Sample exact cobbled courtyard ground height at center, front/rear axles, and left/right tracks.
  // Fallback uses `-0.353` at `(-12.538, 6.565)` with the courtyard surface normal `[-0.068, 0.996, 0.058]`.
  const sampleGroundY = (wx: number, wz: number): number => {
    if (getCourtyardGroundY) {
      const gy = getCourtyardGroundY(wx, wz);
      if (Number.isFinite(gy)) return gy;
    }
    return -0.353 - (-0.068 * (wx - worldCenterX) + 0.058 * (wz - worldCenterZ)) / 0.996;
  };

  const toWorldXZ = (localX: number, localZ: number): [number, number] => {
    const cosY = Math.cos(yaw);
    const sinY = Math.sin(yaw);
    return [
      worldCenterX + localX * cosY + localZ * sinY,
      worldCenterZ - localX * sinY + localZ * cosY,
    ];
  };

  const yCenterGround = sampleGroundY(worldCenterX, worldCenterZ);
  const [frontAxleWX, frontAxleWZ] = toWorldXZ(-1.51, 0);
  const [rearAxleWX, rearAxleWZ] = toWorldXZ(1.51, 0);
  const [leftTrackWX, leftTrackWZ] = toWorldXZ(0, -0.86);
  const [rightTrackWX, rightTrackWZ] = toWorldXZ(0, 0.86);

  const yFrontAxle = sampleGroundY(frontAxleWX, frontAxleWZ);
  const yRearAxle = sampleGroundY(rearAxleWX, rearAxleWZ);
  const yLeftTrack = sampleGroundY(leftTrackWX, leftTrackWZ);
  const yRightTrack = sampleGroundY(rightTrackWX, rightTrackWZ);

  const wheelContactAvgY =
    0.25 * (yFrontAxle + yRearAxle + yLeftTrack + yRightTrack);
  const baseGroundY = 0.5 * (yCenterGround + wheelContactAvgY);

  // Pitch (`rotation.z`) and Roll (`rotation.x`) in `'YXZ'` Euler order so all 4 tires sit 100% flush on the cobbles
  const pitchZ = Math.atan2(yRearAxle - yFrontAxle, 3.022);
  const rollX = Math.atan2(yLeftTrack - yRightTrack, 1.72);

  defenderGroup.rotation.order = 'YXZ';
  defenderGroup.position.set(worldCenterX, baseGroundY, worldCenterZ);
  defenderGroup.rotation.set(rollX, yaw, pitchZ);
  scene.add(defenderGroup);

  // ---------------------------------------------------------------------------
  // 1. Santorini Black Metallic Paint & Satin Carpathian / Narvik Black Trim Palette
  // ---------------------------------------------------------------------------
  const santoriniBlackTex = createSantoriniBlackMetallicTexture();
  const santoriniBlackBodyMat = new THREE.MeshStandardMaterial({
    color: 0x16191f,
    map: santoriniBlackTex,
    emissive: new THREE.Color(0x05070a),
    emissiveIntensity: 0.22,
    roughness: 0.18,
    metalness: 0.48,
    side: THREE.DoubleSide,
  });

  const narvikGlossBlackMat = new THREE.MeshStandardMaterial({
    color: 0x0c0e12,
    emissive: new THREE.Color(0x030406),
    emissiveIntensity: 0.14,
    roughness: 0.12,
    metalness: 0.55,
    side: THREE.DoubleSide,
  });

  const satinAnthraciteMat = new THREE.MeshStandardMaterial({
    color: 0x282d35,
    emissive: new THREE.Color(0x06080b),
    emissiveIntensity: 0.15,
    roughness: 0.36,
    metalness: 0.62,
    side: THREE.DoubleSide,
  });

  const chequerPlateTex = createDiamondChequerPlateTexture();
  const chequerPlateMat = new THREE.MeshStandardMaterial({
    color: 0x242932,
    map: chequerPlateTex,
    roughness: 0.42,
    metalness: 0.54,
    side: THREE.DoubleSide,
  });

  const tintedPrivacyGlassMat = new THREE.MeshStandardMaterial({
    color: 0x121c26,
    roughness: 0.06,
    metalness: 0.22,
    transparent: true,
    opacity: 0.56,
    side: THREE.DoubleSide,
  });

  const clearPolycarbonateLensMat = new THREE.MeshStandardMaterial({
    color: 0xe8f2ff,
    roughness: 0.05,
    metalness: 0.14,
    transparent: true,
    opacity: 0.42,
    side: THREE.DoubleSide,
  });

  const smokedLensMat = new THREE.MeshStandardMaterial({
    color: 0x1a1216,
    roughness: 0.08,
    metalness: 0.24,
    transparent: true,
    opacity: 0.62,
    side: THREE.DoubleSide,
  });

  const ledHaloWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0xf2f8ff),
    emissiveIntensity: 2.5,
    roughness: 0.08,
  });

  const ledCrimsonRedMat = new THREE.MeshStandardMaterial({
    color: 0xff1c22,
    emissive: new THREE.Color(0xff161c),
    emissiveIntensity: 2.4,
    roughness: 0.12,
  });

  const ledAmberPipMat = new THREE.MeshStandardMaterial({
    color: 0xffa018,
    emissive: new THREE.Color(0xff8800),
    emissiveIntensity: 1.8,
    roughness: 0.15,
  });

  const tireRubberMat = new THREE.MeshStandardMaterial({
    color: 0x181b20,
    roughness: 0.78,
    metalness: 0.06,
    side: THREE.DoubleSide,
  });

  const tireSidewallMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: createAllTerrainTireSidewallTexture(),
    roughness: 0.72,
    metalness: 0.08,
  });

  const steelRotorMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: createVentilatedSteelRotorTexture(),
    roughness: 0.28,
    metalness: 0.72,
  });

  const xenonBlueCaliperMat = new THREE.MeshStandardMaterial({
    color: 0x1278c4, // Land Rover Defender V8 Xenon Blue / Black caliper contrast
    emissive: new THREE.Color(0x041e38),
    emissiveIntensity: 0.24,
    roughness: 0.22,
    metalness: 0.38,
  });

  const chromeLugMat = new THREE.MeshStandardMaterial({
    color: 0xd8e0ec,
    roughness: 0.18,
    metalness: 0.85,
  });

  const landRoverBadgeMat = new THREE.MeshStandardMaterial({
    map: createLandRoverOvalBadgeTexture(),
    transparent: true,
    roughness: 0.2,
    metalness: 0.45,
  });

  const ebonyWindsorLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x1c2026,
    roughness: 0.56,
    metalness: 0.06,
  });

  const magnesiumCrossBeamMat = new THREE.MeshStandardMaterial({
    color: 0x3b424e,
    roughness: 0.34,
    metalness: 0.68,
  });

  // ---------------------------------------------------------------------------
  // 8. Under-Vehicle Contact Shadow Pad & Heavy-Duty Off-Road Chassis Undertray
  // ---------------------------------------------------------------------------
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(5.18, 2.32),
    new THREE.MeshBasicMaterial({
      map: createUnderCarShadowTexture(),
      transparent: true,
      depthWrite: false,
    })
  );
  shadowPlane.name = 'courtyard.landRoverDefender.contactShadow';
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.set(0.05, 0.004, 0);
  defenderGroup.add(shadowPlane);

  const chassisUndertray = new THREE.Mesh(
    new THREE.BoxGeometry(4.12, 0.055, 1.56),
    narvikGlossBlackMat
  );
  chassisUndertray.name = 'courtyard.landRoverDefender.undertray';
  chassisUndertray.position.set(0, 0.265, 0);
  defenderGroup.add(chassisUndertray);

  // ---------------------------------------------------------------------------
  // 2. Smoothly Lofted Parametric L663 Defender 110 Monocoque Body Shell
  // ---------------------------------------------------------------------------
  const bodyShellGeo = createUnifiedDefender110BodyGeometry();
  const bodyShellMesh = new THREE.Mesh(bodyShellGeo, santoriniBlackBodyMat);
  bodyShellMesh.name = 'courtyard.landRoverDefender.bodyShell';
  bodyShellMesh.castShadow = true;
  bodyShellMesh.receiveShadow = true;
  defenderGroup.add(bodyShellMesh);

  // Contrast Narvik Gloss Black Floating Roof Cap (`x = -0.44m..+2.24m, y = 1.88m..1.968m`)
  const floatingRoofCapGeo = createConformalDefenderPatchGeometry(
    -0.44,
    2.24,
    () => 0.0,
    () => 0.31,
    36,
    24,
    0.0025,
    0.002,
    false
  );
  const floatingRoofCapMesh = new THREE.Mesh(floatingRoofCapGeo, narvikGlossBlackMat);
  floatingRoofCapMesh.name = 'courtyard.landRoverDefender.floatingRoof';
  floatingRoofCapMesh.castShadow = true;
  floatingRoofCapMesh.receiveShadow = true;
  defenderGroup.add(floatingRoofCapMesh);

  // Prominent Horizontal Defender Barrel Waist Shoulder Trim Moulding (`y ≈ 1.24m, z = ±0.96m`)
  const waistShoulderStripGeo = createConformalDefenderPatchGeometry(
    -2.20,
    2.30,
    () => 0.525,
    () => 0.565,
    48,
    4,
    0.0022,
    0.0025,
    true
  );
  const waistShoulderStripMesh = new THREE.Mesh(waistShoulderStripGeo, narvikGlossBlackMat);
  waistShoulderStripMesh.name = 'courtyard.landRoverDefender.waistShoulderLine';
  defenderGroup.add(waistShoulderStripMesh);

  // Lower Door & Quarter Protective Narvik Black Cladding Panels (`x = -1.04m..+1.04m, y = 0.28m..0.52m`)
  for (const sideZ of [-1, 1] as const) {
    const lowerDoorCladding = new THREE.Mesh(
      new THREE.BoxGeometry(2.04, 0.21, 0.022),
      narvikGlossBlackMat
    );
    lowerDoorCladding.position.set(0.0, 0.39, sideZ * 0.958);
    defenderGroup.add(lowerDoorCladding);
  }

  // Squared-Off Muscular Wheel Arch Cladding Flanges & Dark Wheelhouse Liners (`x = -1.51m` front, `x = +1.51m` rear)
  buildDefenderWheelArchCladdingAndLiner(
    defenderGroup,
    -1.51,
    0.415,
    0.442,
    0.968,
    narvikGlossBlackMat,
    satinAnthraciteMat
  );
  buildDefenderWheelArchCladdingAndLiner(
    defenderGroup,
    1.51,
    0.415,
    0.442,
    0.972,
    narvikGlossBlackMat,
    satinAnthraciteMat
  );

  // Twin Outer Black Diamond-Pattern Chequer-Plate Bonnet Tread Plates (`courtyard.landRoverDefender.bonnetChequerPlate`)
  const bonnetChequerGroup = new THREE.Group();
  bonnetChequerGroup.name = 'courtyard.landRoverDefender.bonnetChequerPlate';
  defenderGroup.add(bonnetChequerGroup);

  const bonnetChequerPatchGeo = createConformalDefenderPatchGeometry(
    -2.16,
    -1.08,
    () => 0.205,
    () => 0.295,
    24,
    8,
    0.0045,
    0.002,
    true
  );
  const bonnetChequerMesh = new THREE.Mesh(bonnetChequerPatchGeo, chequerPlateMat);
  bonnetChequerMesh.name = 'courtyard.landRoverDefender.bonnetChequerPlate';
  bonnetChequerMesh.castShadow = true;
  bonnetChequerMesh.receiveShadow = true;
  bonnetChequerGroup.add(bonnetChequerMesh);

  // ---------------------------------------------------------------------------
  // 3. Iconic L663 Defender Signature Exterior Features
  // ---------------------------------------------------------------------------
  // A. Floating C-Pillar "Signature Graphic" Panel (`courtyard.landRoverDefender.signatureGraphic`)
  //    on both sides (`x = +0.98m..+1.52m, y = 1.26m..1.86m, z = ±0.88m`) in satin anthracite/black
  //    with the recessed square accessory mount boss.
  const signatureGraphicGroup = new THREE.Group();
  signatureGraphicGroup.name = 'courtyard.landRoverDefender.signatureGraphic';
  defenderGroup.add(signatureGraphicGroup);

  const sigPanelGeo = createConformalLateralWindowOrPanelGeometry(
    0.98,
    1.52,
    () => 1.265,
    () => 1.855,
    14,
    12,
    0.0065,
    [-1, 1]
  );
  const sigPanelMesh = new THREE.Mesh(sigPanelGeo, satinAnthraciteMat);
  sigPanelMesh.name = 'courtyard.landRoverDefender.signatureGraphic';
  sigPanelMesh.castShadow = true;
  signatureGraphicGroup.add(sigPanelMesh);

  for (const sideZ of [-1, 1] as const) {
    const zBoss = sideZ * (sampleLateralSurfaceZAtXY(1.25, 1.56) + 0.01);
    const bossFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.145, 0.145, 0.012),
      narvikGlossBlackMat
    );
    bossFrame.position.set(1.25, 1.56, zBoss);
    bossFrame.rotation.x = -sideZ * 0.16;
    signatureGraphicGroup.add(bossFrame);

    const bossCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.095, 0.095, 0.016),
      satinAnthraciteMat
    );
    bossCap.position.set(1.25, 1.56, zBoss + sideZ * 0.003);
    bossCap.rotation.x = -sideZ * 0.16;
    signatureGraphicGroup.add(bossCap);
  }

  // B. Iconic Defender Alpine Roof Light Windows (`courtyard.landRoverDefender.alpineLight`)
  //    curved into the left and right upper roof cantrails (`x = +0.65m..+2.10m, y = 1.88m..1.95m, z = ±0.76m`),
  //    plus longitudinal black roof rails and panoramic sliding glass sunroof (`x = -0.35m..+1.35m, y = 1.965m`).
  const alpineLightGroup = new THREE.Group();
  alpineLightGroup.name = 'courtyard.landRoverDefender.alpineLight';
  defenderGroup.add(alpineLightGroup);

  const alpineBezelGeo = createConformalDefenderPatchGeometry(
    0.63,
    2.12,
    () => 0.285,
    () => 0.348,
    24,
    8,
    0.0038,
    0.0038,
    true
  );
  alpineLightGroup.add(new THREE.Mesh(alpineBezelGeo, narvikGlossBlackMat));

  const alpineGlassGeo = createConformalDefenderPatchGeometry(
    0.65,
    2.10,
    () => 0.292,
    () => 0.340,
    24,
    8,
    0.0052,
    0.0052,
    true
  );
  const alpineGlassMesh = new THREE.Mesh(alpineGlassGeo, tintedPrivacyGlassMat);
  alpineGlassMesh.name = 'courtyard.landRoverDefender.alpineLight';
  alpineLightGroup.add(alpineGlassMesh);

  // Panoramic Sliding Glass Sunroof (`x = -0.35m..+1.35m, y = 1.965m`)
  const sunroofFrameGeo = createConformalDefenderPatchGeometry(
    -0.37,
    1.37,
    () => 0.0,
    () => 0.225,
    24,
    16,
    0.004,
    0.002,
    false
  );
  alpineLightGroup.add(new THREE.Mesh(sunroofFrameGeo, narvikGlossBlackMat));

  const sunroofGlassGeo = createConformalDefenderPatchGeometry(
    -0.35,
    1.35,
    () => 0.0,
    () => 0.212,
    24,
    16,
    0.0058,
    0.002,
    false
  );
  const sunroofGlassMesh = new THREE.Mesh(sunroofGlassGeo, tintedPrivacyGlassMat);
  sunroofGlassMesh.name = 'courtyard.landRoverDefender.sunroof';
  alpineLightGroup.add(sunroofGlassMesh);

  // Longitudinal Expedition Narvik Black Roof Rails (`x = -0.32m..+2.14m, y = 1.985m, z = ±0.64m`)
  for (const sideZ of [-1, 1] as const) {
    const railBar = new THREE.Mesh(
      new THREE.BoxGeometry(2.44, 0.026, 0.036),
      narvikGlossBlackMat
    );
    railBar.position.set(0.91, 1.984, sideZ * 0.635);
    railBar.castShadow = true;
    alpineLightGroup.add(railBar);

    for (const stanchionX of [-0.26, 0.88, 2.06] as const) {
      const stanchion = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.032, 0.042),
        satinAnthraciteMat
      );
      stanchion.position.set(stanchionX, 1.964, sideZ * 0.635);
      alpineLightGroup.add(stanchion);
    }
  }

  // Roof-Mounted Shark-Fin / ClearSight Rear-View Camera Antenna Pod (`x = +1.96m, y = 1.995m, z = 0`)
  const clearSightFin = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.058, 0.044),
    narvikGlossBlackMat
  );
  clearSightFin.position.set(1.96, 1.982, 0);
  alpineLightGroup.add(clearSightFin);

  // C. Exterior Side-Mounted Gear Carrier Box (`courtyard.landRoverDefender.sideGearCarrier`)
  //    on the right/rear quarter (`x = +1.15m..+1.78m, y = 1.32m..1.76m, z = +0.93m`) in aerodynamic
  //    gloss Santorini Black with Land Rover oval badge & latch.
  const gearCarrierGroup = new THREE.Group();
  gearCarrierGroup.name = 'courtyard.landRoverDefender.sideGearCarrier';
  gearCarrierGroup.position.set(1.465, 1.54, 0.93);
  defenderGroup.add(gearCarrierGroup);

  // Mounting bracket rails connecting the carrier box to the right C-pillar / rear quarter glass
  const carrierBracket = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 0.36, 0.065),
    satinAnthraciteMat
  );
  carrierBracket.position.set(0, 0, -0.055);
  gearCarrierGroup.add(carrierBracket);

  // Sculpted aerodynamic Santorini Black outer shell (`0.63m x 0.44m x 0.14m`) with bevelled outer lid
  const carrierMainBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.63, 0.44, 0.115),
    santoriniBlackBodyMat
  );
  carrierMainBox.name = 'courtyard.landRoverDefender.sideGearCarrier';
  carrierMainBox.castShadow = true;
  carrierMainBox.receiveShadow = true;
  gearCarrierGroup.add(carrierMainBox);

  const carrierOuterLid = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.39, 0.042),
    narvikGlossBlackMat
  );
  carrierOuterLid.position.set(0, 0, 0.058);
  carrierOuterLid.castShadow = true;
  gearCarrierGroup.add(carrierOuterLid);

  // Horizontal aerodynamic speed-rib & Shadow Atlas latch + Land Rover oval badge on carrier lid
  const carrierSpeedRib = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 0.032, 0.014),
    satinAnthraciteMat
  );
  carrierSpeedRib.position.set(0, -0.04, 0.082);
  gearCarrierGroup.add(carrierSpeedRib);

  const carrierLatch = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.095, 0.016),
    satinAnthraciteMat
  );
  carrierLatch.position.set(-0.21, 0.02, 0.081);
  gearCarrierGroup.add(carrierLatch);

  const carrierBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.068, 0.034),
    landRoverBadgeMat
  );
  carrierBadge.position.set(0.16, -0.10, 0.082);
  gearCarrierGroup.add(carrierBadge);

  // D. Raised Roof-Height Safari Snorkel / Raised Air Intake (`courtyard.landRoverDefender.raisedAirIntake`)
  //    on the left A-pillar (`x = -0.92m, y = 1.26m..1.94m, z = -0.92m`).
  const snorkelGroup = new THREE.Group();
  snorkelGroup.name = 'courtyard.landRoverDefender.raisedAirIntake';
  defenderGroup.add(snorkelGroup);

  // Lower fender intake plenum box mounted cleanly to left fender vent (`x = -0.98m, y = 1.18m, z = -0.965m`)
  const snorkelBasePlenum = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.11, 0.056),
    satinAnthraciteMat
  );
  snorkelBasePlenum.name = 'courtyard.landRoverDefender.raisedAirIntake';
  snorkelBasePlenum.position.set(-0.98, 1.19, -0.965);
  snorkelBasePlenum.castShadow = true;
  snorkelGroup.add(snorkelBasePlenum);

  // Swept 3D tubular riser hugging the left A-pillar (`x = -0.92m..-0.48m, y = 1.24m..1.94m, z = -0.94m..-0.79m`)
  const snorkelCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.96, 1.22, -0.965),
    new THREE.Vector3(-0.91, 1.32, -0.945),
    new THREE.Vector3(-0.76, 1.58, -0.885),
    new THREE.Vector3(-0.56, 1.86, -0.815),
    new THREE.Vector3(-0.48, 1.94, -0.795),
  ]);
  const snorkelRiser = new THREE.Mesh(
    new THREE.TubeGeometry(snorkelCurve, 24, 0.034, 12, false),
    narvikGlossBlackMat
  );
  snorkelRiser.name = 'courtyard.landRoverDefender.raisedAirIntake';
  snorkelRiser.scale.set(1.15, 1.0, 0.78);
  snorkelRiser.castShadow = true;
  snorkelGroup.add(snorkelRiser);

  // Forward-facing roof-level ram-air intake head with slatted grille at `(-0.48m, 1.955m, -0.795m)`
  const snorkelHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.145, 0.072, 0.068),
    narvikGlossBlackMat
  );
  snorkelHead.position.set(-0.50, 1.955, -0.795);
  snorkelHead.castShadow = true;
  snorkelGroup.add(snorkelHead);

  const snorkelGrilleFace = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.056, 0.054),
    satinAnthraciteMat
  );
  snorkelGrilleFace.position.set(-0.574, 1.955, -0.795);
  snorkelGroup.add(snorkelGrilleFace);

  // E. Fender Side Vents behind the front wheel arches (`x = -0.98m, y = 0.96m..1.14m, z = ±0.97m`) with vertical black louvres
  for (const sideZ of [-1, 1] as const) {
    const fenderVentGroup = new THREE.Group();
    fenderVentGroup.name = 'courtyard.landRoverDefender.fenderSideVent';
    fenderVentGroup.position.set(-0.98, 1.05, sideZ * 0.965);
    defenderGroup.add(fenderVentGroup);

    const ventFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.165, 0.185, 0.018),
      satinAnthraciteMat
    );
    fenderVentGroup.add(ventFrame);

    for (const lx of [-0.045, 0.0, 0.045] as const) {
      const louvre = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.15, 0.024),
        narvikGlossBlackMat
      );
      louvre.position.set(lx, 0, sideZ * 0.003);
      louvre.rotation.y = sideZ * 0.25;
      fenderVentGroup.add(louvre);
    }
  }

  // ---------------------------------------------------------------------------
  // 4. L663 Front Fascia, Matrix LED Semicircular "Halo" Headlights & DEFENDER Badging
  // ---------------------------------------------------------------------------
  // A. Multi-Slot Narvik Black Front Grille (`courtyard.landRoverDefender.frontGrille`)
  const frontGrilleGroup = new THREE.Group();
  frontGrilleGroup.name = 'courtyard.landRoverDefender.frontGrille';
  defenderGroup.add(frontGrilleGroup);

  // Recessed dark radiator cavity behind grille (`x = -2.355m, y = 0.98m, z = -0.48m..+0.48m`)
  const grilleCavity = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.23, 0.96),
    narvikGlossBlackMat
  );
  grilleCavity.name = 'courtyard.landRoverDefender.frontGrille';
  grilleCavity.position.set(-2.355, 0.985, 0);
  frontGrilleGroup.add(grilleCavity);

  // Plan-curved horizontal intake bars & oval slot apertures across the L663 grille
  for (const barY of [1.085, 1.02, 0.955, 0.89] as const) {
    const barPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 20; i++) {
      const u = (i / 20) * 2 - 1;
      const z = u * 0.48;
      const x = -2.372 + getPlanWrapShiftX(-2.36, z);
      barPts.push(new THREE.Vector3(x, barY, z));
    }
    const barCurve = new THREE.CatmullRomCurve3(barPts);
    const barMesh = new THREE.Mesh(
      new THREE.TubeGeometry(barCurve, 24, 0.014, 8, false),
      barY === 1.02 ? satinAnthraciteMat : narvikGlossBlackMat
    );
    barMesh.scale.set(1.2, 0.75, 1.0);
    frontGrilleGroup.add(barMesh);
  }

  // Vertical grille dividers creating the signature Defender rectangular intake slots
  for (const divZ of [-0.47, -0.24, 0.0, 0.24, 0.47] as const) {
    const dx = -2.368 + getPlanWrapShiftX(-2.36, divZ);
    const divider = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, 0.21, 0.018),
      narvikGlossBlackMat
    );
    divider.position.set(dx, 0.985, divZ);
    frontGrilleGroup.add(divider);
  }

  // Green/Black Land Rover Oval Badge on right side of front grille (`x = -2.378m, y = 1.015m, z = -0.34m`)
  const frontOvalBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.088, 0.044),
    landRoverBadgeMat
  );
  frontOvalBadge.position.set(-2.378 + getPlanWrapShiftX(-2.36, -0.34), 1.015, -0.34);
  frontOvalBadge.rotation.y = -Math.PI / 2 - 0.08;
  frontGrilleGroup.add(frontOvalBadge);

  // Bold Satin Black `D E F E N D E R` Bonnet Edge Lettering (`CanvasTexture` at `x = -2.32m, y = 1.15m`)
  const bonnetLetteringPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(0.68, 0.078),
    new THREE.MeshStandardMaterial({
      map: createDefenderBonnetLetteringTexture(),
      transparent: true,
      roughness: 0.28,
      metalness: 0.52,
    })
  );
  bonnetLetteringPlane.name = 'courtyard.landRoverDefender.bonnetLettering';
  bonnetLetteringPlane.position.set(-2.318, 1.148, 0);
  bonnetLetteringPlane.rotation.y = -Math.PI / 2;
  bonnetLetteringPlane.rotation.z = -0.38;
  frontGrilleGroup.add(bonnetLetteringPlane);

  // B. L663 Matrix LED Headlights (`courtyard.landRoverDefender.headlight`)
  //    at `(x = -2.33m, y = 0.98m, z = ±0.72m)`: recessed rectangular bevelled smoked housing
  //    containing the unmistakable glowing warm-white semicircular lower LED Halo ring +
  //    twin horizontal outer LED signature pips (`emissive: 0xf2f8ff, emissiveIntensity: 2.5`)
  //    and clear polycarbonate outer lens.
  for (const sideZ of [-1, 1] as const) {
    const hlGroup = new THREE.Group();
    hlGroup.name = 'courtyard.landRoverDefender.headlight';
    const hz = sideZ * 0.72;
    const hx = -2.335 + getPlanWrapShiftX(-2.35, hz);
    hlGroup.position.set(hx, 0.985, hz);
    hlGroup.rotation.y = sideZ * 0.22; // Follow plan-view bevel of front fascia corner
    defenderGroup.add(hlGroup);

    // Bevelled rectangular smoked housing box (`0.08m deep x 0.22m high x 0.34m wide`)
    const housingBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.075, 0.215, 0.34),
      narvikGlossBlackMat
    );
    housingBox.name = 'courtyard.landRoverDefender.headlight';
    hlGroup.add(housingBox);

    // Satin Anthracite inner projector bezel surround
    const innerBezel = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.185, 0.31),
      satinAnthraciteMat
    );
    innerBezel.position.set(-0.008, 0, 0);
    hlGroup.add(innerBezel);

    // Central bi-LED projector lens sphere inside the halo ring
    const projectorDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.052, 20, 16),
      clearPolycarbonateLensMat
    );
    projectorDome.scale.set(0.55, 1.0, 1.0);
    projectorDome.position.set(-0.028, 0.008, -sideZ * 0.025);
    hlGroup.add(projectorDome);

    // Unmistakable L663 Glowing Warm-White Semicircular Lower LED Halo Ring + Upper Cropped Brow Bar
    const haloSemiRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.072, 0.0095, 14, 32, Math.PI * 1.18),
      ledHaloWhiteMat
    );
    haloSemiRing.name = 'courtyard.landRoverDefender.headlight';
    haloSemiRing.rotation.y = -Math.PI / 2;
    haloSemiRing.rotation.x = Math.PI + 0.28; // Lower semicircle cradle (`U` shape)
    haloSemiRing.position.set(-0.038, 0.012, -sideZ * 0.025);
    hlGroup.add(haloSemiRing);

    const haloUpperChordBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.012, 0.135),
      ledHaloWhiteMat
    );
    haloUpperChordBar.position.set(-0.038, 0.042, -sideZ * 0.025);
    hlGroup.add(haloUpperChordBar);

    // Twin Horizontal Outer LED Signature Pips flanking the halo ring
    for (const pipZOff of [0.078, 0.125] as const) {
      const ledPip = new THREE.Mesh(
        new THREE.BoxGeometry(0.014, 0.018, 0.034),
        ledHaloWhiteMat
      );
      ledPip.position.set(-0.038, 0.005, sideZ * pipZOff);
      hlGroup.add(ledPip);
    }

    // Clear polycarbonate outer headlight lens cover
    const outerClearLens = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.205, 0.332),
      clearPolycarbonateLensMat
    );
    outerClearLens.position.set(-0.042, 0, 0);
    hlGroup.add(outerClearLens);
  }

  // C. Lower Front Bumper & Shadow Atlas Skid Pan (`courtyard.landRoverDefender.frontBumper`)
  const frontBumperGroup = new THREE.Group();
  frontBumperGroup.name = 'courtyard.landRoverDefender.frontBumper';
  defenderGroup.add(frontBumperGroup);

  // Plan-curved Shadow Atlas / Satin Anthracite lower front bumper crossbeam (`y = 0.52m..0.82m`)
  const fBumperPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 28; i++) {
    const u = (i / 28) * 2 - 1;
    const z = u * 0.90;
    const x = -2.375 + getPlanWrapShiftX(-2.37, z);
    fBumperPts.push(new THREE.Vector3(x, 0.64, z));
  }
  const fBumperCurve = new THREE.CatmullRomCurve3(fBumperPts);
  const fBumperBeam = new THREE.Mesh(
    new THREE.TubeGeometry(fBumperCurve, 32, 0.13, 12, false),
    satinAnthraciteMat
  );
  fBumperBeam.name = 'courtyard.landRoverDefender.frontBumper';
  fBumperBeam.scale.set(0.55, 1.15, 1.0);
  fBumperBeam.position.set(-2.375 * 0.45, 0, 0);
  fBumperBeam.castShadow = true;
  frontBumperGroup.add(fBumperBeam);

  // Sculpted Shadow Atlas Front Skid Pan (`x = -2.39m..-2.05m, y = 0.29m..0.52m, z = -0.58m..+0.58m`)
  // with 4 recessed bash-plate slots
  const frontSkidPan = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.24, 1.14),
    satinAnthraciteMat
  );
  frontSkidPan.name = 'courtyard.landRoverDefender.frontBumper';
  frontSkidPan.position.set(-2.27, 0.40, 0);
  frontSkidPan.rotation.z = 0.52;
  frontSkidPan.castShadow = true;
  frontBumperGroup.add(frontSkidPan);

  for (const slotZ of [-0.36, -0.12, 0.12, 0.36] as const) {
    const bashSlot = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.045, 0.12),
      narvikGlossBlackMat
    );
    bashSlot.position.set(-2.345, 0.39, slotZ);
    bashSlot.rotation.z = 0.52;
    frontBumperGroup.add(bashSlot);
  }

  // Twin Recessed Front LED Fog Lamps (`z = ±0.74m, y = 0.56m`) + Front Radar Module + Tow Recovery Eyes
  for (const sideZ of [-1, 1] as const) {
    const fz = sideZ * 0.74;
    const fx = -2.37 + getPlanWrapShiftX(-2.37, fz);
    const fogHousing = new THREE.Mesh(
      new THREE.BoxGeometry(0.042, 0.068, 0.145),
      narvikGlossBlackMat
    );
    fogHousing.position.set(fx - 0.01, 0.56, fz);
    fogHousing.rotation.y = sideZ * 0.24;
    frontBumperGroup.add(fogHousing);

    const fogLampLed = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.028, 0.088),
      ledHaloWhiteMat
    );
    fogLampLed.position.set(fx - 0.026, 0.56, fz);
    fogLampLed.rotation.y = sideZ * 0.24;
    frontBumperGroup.add(fogLampLed);

    // Heavy-duty front recovery tow eye loop (`z = ±0.46m, y = 0.33m`)
    const towEye = new THREE.Mesh(
      new THREE.TorusGeometry(0.032, 0.009, 10, 20),
      narvikGlossBlackMat
    );
    towEye.position.set(-2.375, 0.33, sideZ * 0.46);
    frontBumperGroup.add(towEye);
  }

  // Central ACC Front Radar Module (`x = -2.392m, y = 0.49m, z = 0`)
  const frontRadarModule = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.085, 0.14),
    narvikGlossBlackMat
  );
  frontRadarModule.position.set(-2.392, 0.49, 0);
  frontBumperGroup.add(frontRadarModule);

  // White UK Front Registration Plate (`"DEF 110X"`, `x = -2.402m, y = 0.64m, z = 0`)
  const frontUkPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.095, 0.44),
    new THREE.MeshStandardMaterial({
      map: createUkNumberPlateTexture(false),
      roughness: 0.24,
    })
  );
  frontUkPlate.name = 'courtyard.landRoverDefender.frontNumberPlate';
  frontUkPlate.position.set(-2.402, 0.64, 0);
  frontBumperGroup.add(frontUkPlate);

  // ---------------------------------------------------------------------------
  // 5. Vertical Kamm Tailgate, Full-Size Rear-Mounted 22" Spare Wheel & Quad-Square LED Taillights
  // ---------------------------------------------------------------------------
  const rearTailgateGroup = new THREE.Group();
  rearTailgateGroup.name = 'courtyard.landRoverDefender.tailgate';
  defenderGroup.add(rearTailgateGroup);

  // Exposed Heavy-Duty Right-Side Exterior Tailgate Hinges (`x = +2.362m, z = +0.66m, y = 0.88m & 1.18m`)
  for (const hingeY of [0.88, 1.18] as const) {
    const hingeBlock = new THREE.Mesh(
      new THREE.BoxGeometry(0.042, 0.056, 0.145),
      narvikGlossBlackMat
    );
    hingeBlock.position.set(2.358, hingeY, 0.64);
    rearTailgateGroup.add(hingeBlock);

    const hingePin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.072, 12),
      satinAnthraciteMat
    );
    hingePin.position.set(2.374, hingeY, 0.70);
    rearTailgateGroup.add(hingePin);
  }

  // Left-Side Tailgate Handle, Recessed Yellow UK Rear Number Plate (`"DEF 110X"`) & Red/Black `V8` Badge
  const tailgateGrabHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.032, 0.038, 0.165),
    narvikGlossBlackMat
  );
  tailgateGrabHandle.position.set(2.368, 0.96, -0.56);
  rearTailgateGroup.add(tailgateGrabHandle);

  const rearPlatePlinth = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.135, 0.48),
    narvikGlossBlackMat
  );
  rearPlatePlinth.position.set(2.362, 0.75, -0.44);
  rearTailgateGroup.add(rearPlatePlinth);

  const rearUkPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.095, 0.44),
    new THREE.MeshStandardMaterial({
      map: createUkNumberPlateTexture(true),
      roughness: 0.24,
    })
  );
  rearUkPlate.name = 'courtyard.landRoverDefender.rearNumberPlate';
  rearUkPlate.position.set(2.374, 0.75, -0.44);
  rearTailgateGroup.add(rearUkPlate);

  // Carpathian Edition Red-Accented `V8` Rear Tailgate Badge (`x = +2.368m, y = 0.60m, z = -0.58m`)
  const v8BadgeBack = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.036, 0.082),
    ledCrimsonRedMat
  );
  v8BadgeBack.position.set(2.365, 0.60, -0.58);
  rearTailgateGroup.add(v8BadgeBack);

  const v8BadgeFace = new THREE.Mesh(
    new THREE.BoxGeometry(0.015, 0.028, 0.072),
    narvikGlossBlackMat
  );
  v8BadgeFace.position.set(2.367, 0.60, -0.58);
  rearTailgateGroup.add(v8BadgeFace);

  // B. Tailgate-Mounted Full-Size 22" 5-Spoke Gloss Black Spare Wheel (`courtyard.landRoverDefender.spareWheel`)
  //    centered at `(x = +2.49m, y = 1.06m, z = 0)` with axle along X (`rotation.y = Math.PI / 2`)
  const spareWheelMountBracket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.14, 0.14, 20),
    narvikGlossBlackMat
  );
  spareWheelMountBracket.rotation.z = Math.PI / 2;
  spareWheelMountBracket.position.set(2.39, 1.06, 0);
  defenderGroup.add(spareWheelMountBracket);

  const wheelMatBundle = {
    tireRubberMat,
    tireSidewallMat,
    narvikGlossBlackMat,
    satinAnthraciteMat,
    steelRotorMat,
    xenonBlueCaliperMat,
    chromeLugMat,
    landRoverBadgeMat,
  };

  const spareWheelGroup = buildDefenderStyle5098WheelAssembly(
    defenderGroup,
    'courtyard.landRoverDefender.spareWheel',
    0.405,
    0.282,
    0.285,
    false,
    false,
    true,
    wheelMatBundle
  );
  spareWheelGroup.position.set(2.49, 1.06, 0);
  spareWheelGroup.rotation.y = Math.PI / 2; // Outer 5-spoke face points rearward (+X)!

  // Gloss Black Land Rover Defender Spare Wheel Centre Hub Cover Disc
  const spareCenterCover = new THREE.Mesh(
    new THREE.CylinderGeometry(0.115, 0.122, 0.028, 28),
    santoriniBlackBodyMat
  );
  spareCenterCover.rotation.x = Math.PI / 2;
  spareCenterCover.position.set(0, 0, 0.122);
  spareWheelGroup.add(spareCenterCover);

  const spareCenterBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.076, 0.038),
    landRoverBadgeMat
  );
  spareCenterBadge.position.set(0, 0, 0.137);
  spareWheelGroup.add(spareCenterBadge);

  // C. Signature L663 Recessed Smoked Quad-Square LED Taillights (`courtyard.landRoverDefender.taillight`)
  //    (`x = +2.35m, y = 0.88m..1.22m, z = ±0.83m`): stacked twin glowing crimson-red square LED ring cubes
  //    (`emissive: 0xff161c, emissiveIntensity: 2.4`) + outer vertical indicator pips per side.
  for (const sideZ of [-1, 1] as const) {
    const tlGroup = new THREE.Group();
    tlGroup.name = 'courtyard.landRoverDefender.taillight';
    const tz = sideZ * 0.83;
    const tx = 2.345 + getPlanWrapShiftX(2.35, tz);
    tlGroup.position.set(tx, 1.05, tz);
    tlGroup.rotation.y = -sideZ * 0.16;
    defenderGroup.add(tlGroup);

    // Recessed Narvik Black vertical taillight bezel pocket (`y = 0.88m..1.22m`, height `0.34m`)
    const bezelPocket = new THREE.Mesh(
      new THREE.BoxGeometry(0.048, 0.35, 0.165),
      narvikGlossBlackMat
    );
    bezelPocket.name = 'courtyard.landRoverDefender.taillight';
    tlGroup.add(bezelPocket);

    // Stacked Twin Glowing Crimson-Red Square LED Ring Cubes (`yOff = -0.078m` lower cube, `+0.078m` upper cube)
    for (const yCubeOff of [-0.078, 0.078] as const) {
      const cubeGroup = new THREE.Group();
      cubeGroup.position.set(0.018, yCubeOff, -sideZ * 0.018);
      tlGroup.add(cubeGroup);

      // 4 glowing red bars forming the rounded-square L663 3D taillight ring
      const ringHalf = 0.036;
      const barThick = 0.011;
      for (const barY of [-ringHalf, ringHalf] as const) {
        const hBar = new THREE.Mesh(
          new THREE.BoxGeometry(0.018, barThick, ringHalf * 2 + barThick),
          ledCrimsonRedMat
        );
        hBar.name = 'courtyard.landRoverDefender.taillight';
        hBar.position.set(0, barY, 0);
        cubeGroup.add(hBar);
      }
      for (const barZ of [-ringHalf, ringHalf] as const) {
        const vBar = new THREE.Mesh(
          new THREE.BoxGeometry(0.018, ringHalf * 2 - barThick, barThick),
          ledCrimsonRedMat
        );
        vBar.name = 'courtyard.landRoverDefender.taillight';
        vBar.position.set(0, 0, barZ);
        cubeGroup.add(vBar);
      }

      // Smoked dark inner cube core + flush smoked polycarbonate lens
      const innerCore = new THREE.Mesh(
        new THREE.BoxGeometry(0.014, 0.052, 0.052),
        narvikGlossBlackMat
      );
      cubeGroup.add(innerCore);

      const cubeLens = new THREE.Mesh(
        new THREE.BoxGeometry(0.008, 0.092, 0.092),
        smokedLensMat
      );
      cubeLens.position.set(0.01, 0, 0);
      cubeGroup.add(cubeLens);
    }

    // Outer Vertical Indicator & Reverse LED Pips flanking the quad-square taillight cubes
    for (const pipYOff of [-0.078, 0.0, 0.078] as const) {
      const pipMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.044, 0.022),
        pipYOff === 0.0 ? ledAmberPipMat : ledCrimsonRedMat
      );
      pipMesh.position.set(0.018, pipYOff, sideZ * 0.056);
      tlGroup.add(pipMesh);
    }
  }

  // High-Mounted Third LED Brake Light Strip above rear tailgate glass (`x = +2.29m, y = 1.91m, z = 0`)
  const chmslStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.018, 0.42),
    ledCrimsonRedMat
  );
  chmslStrip.position.set(2.295, 1.912, 0);
  defenderGroup.add(chmslStrip);

  // D. Defender V8 Quad Exhaust Tailpipes (`courtyard.landRoverDefender.exhaust`)
  //    flanking the rear Shadow Atlas skid diffuser (`x = +2.32m, y = 0.34m, z = ±0.58m`)
  //    plus heavy-duty rear recovery tow loop.
  const exhaustGroup = new THREE.Group();
  exhaustGroup.name = 'courtyard.landRoverDefender.exhaust';
  defenderGroup.add(exhaustGroup);

  // Rear Shadow Atlas Bumper & Skid Diffuser (`x = +2.33m, y = 0.34m..0.54m, z = -0.88m..+0.88m`)
  const rBumperPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 28; i++) {
    const u = (i / 28) * 2 - 1;
    const z = u * 0.88;
    const x = 2.345 + getPlanWrapShiftX(2.35, z);
    rBumperPts.push(new THREE.Vector3(x, 0.47, z));
  }
  const rBumperCurve = new THREE.CatmullRomCurve3(rBumperPts);
  const rBumperBeam = new THREE.Mesh(
    new THREE.TubeGeometry(rBumperCurve, 32, 0.105, 12, false),
    satinAnthraciteMat
  );
  rBumperBeam.scale.set(0.55, 1.1, 1.0);
  rBumperBeam.position.set(2.345 * 0.45, 0, 0);
  rBumperBeam.castShadow = true;
  exhaustGroup.add(rBumperBeam);

  const rearSkidDiffuser = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.16, 1.06),
    satinAnthraciteMat
  );
  rearSkidDiffuser.position.set(2.28, 0.36, 0);
  rearSkidDiffuser.rotation.z = -0.35;
  exhaustGroup.add(rearSkidDiffuser);

  // Heavy-Duty Rear Recovery Tow Loop (`x = +2.36m, y = 0.35m, z = 0`)
  const rearTowMount = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.065, 0.14),
    narvikGlossBlackMat
  );
  rearTowMount.position.set(2.345, 0.36, 0);
  exhaustGroup.add(rearTowMount);

  const rearTowLoop = new THREE.Mesh(
    new THREE.TorusGeometry(0.036, 0.011, 12, 22),
    narvikGlossBlackMat
  );
  rearTowLoop.position.set(2.382, 0.345, 0);
  exhaustGroup.add(rearTowLoop);

  // Defender V8 Quad Exhaust Tailpipes (`z = ±0.54m & ±0.64m` centered at `x = +2.32m, y = 0.34m, z = ±0.58m`)
  for (const sideZ of [-1, 1] as const) {
    for (const pipeZ of [0.535, 0.625] as const) {
      const pz = sideZ * pipeZ;
      const px = 2.32 + getPlanWrapShiftX(2.34, pz);
      const outerTip = new THREE.Mesh(
        new THREE.CylinderGeometry(0.038, 0.04, 0.12, 24, 1, true),
        satinAnthraciteMat
      );
      outerTip.name = 'courtyard.landRoverDefender.exhaust';
      outerTip.rotation.z = Math.PI / 2 - 0.08;
      outerTip.position.set(px, 0.34, pz);
      exhaustGroup.add(outerTip);

      const innerCore = new THREE.Mesh(
        new THREE.CylinderGeometry(0.032, 0.032, 0.095, 20),
        narvikGlossBlackMat
      );
      innerCore.rotation.z = Math.PI / 2 - 0.08;
      innerCore.position.set(px - 0.008, 0.34, pz);
      exhaustGroup.add(innerCore);
    }
  }

  // ---------------------------------------------------------------------------
  // 6. 4× 22-Inch Style 5098 5-Spoke Gloss Black Wheels, All-Terrain Tires & V8 Brakes
  // ---------------------------------------------------------------------------
  // Front Left & Right (`x = -1.51m, y = 0.405m, z = ±0.86m`, `tireR = 0.405m, width = 0.285m`)
  const flWheel = buildDefenderStyle5098WheelAssembly(
    defenderGroup,
    'courtyard.landRoverDefender.wheel',
    0.405,
    0.282,
    0.285,
    true,
    true,
    false,
    wheelMatBundle
  );
  flWheel.position.set(-1.51, 0.405, -0.86);

  const frWheel = buildDefenderStyle5098WheelAssembly(
    defenderGroup,
    'courtyard.landRoverDefender.wheel',
    0.405,
    0.282,
    0.285,
    false,
    true,
    false,
    wheelMatBundle
  );
  frWheel.position.set(-1.51, 0.405, 0.86);

  // Rear Left & Right (`x = +1.51m, y = 0.405m, z = ±0.86m`, `tireR = 0.405m, width = 0.285m`)
  const rlWheel = buildDefenderStyle5098WheelAssembly(
    defenderGroup,
    'courtyard.landRoverDefender.wheel',
    0.405,
    0.282,
    0.285,
    true,
    false,
    false,
    wheelMatBundle
  );
  rlWheel.position.set(1.51, 0.405, -0.86);

  const rrWheel = buildDefenderStyle5098WheelAssembly(
    defenderGroup,
    'courtyard.landRoverDefender.wheel',
    0.405,
    0.282,
    0.285,
    false,
    false,
    false,
    wheelMatBundle
  );
  rrWheel.position.set(1.51, 0.405, 0.86);

  // ---------------------------------------------------------------------------
  // 7. Conformal Glazing, Exterior Mirrors, Door Handles, Rock-Slider Side Steps &
  //    Detailed L663 4-Door Cabin Interior (`courtyard.landRoverDefender.interior`)
  // ---------------------------------------------------------------------------
  const glazingGroup = new THREE.Group();
  glazingGroup.name = 'courtyard.landRoverDefender.glazing';
  defenderGroup.add(glazingGroup);

  // A. Conformal Flush Front Windshield (`x = -0.92m..-0.44m`) with Narvik Black A-Pillar Surround
  const windshieldBorderGeo = createConformalDefenderPatchGeometry(
    -0.93,
    -0.43,
    () => 0.0,
    () => 0.305,
    20,
    24,
    0.0028,
    0.0028,
    false
  );
  glazingGroup.add(new THREE.Mesh(windshieldBorderGeo, narvikGlossBlackMat));

  const windshieldGlassGeo = createConformalDefenderPatchGeometry(
    -0.90,
    -0.46,
    () => 0.0,
    () => 0.286,
    20,
    24,
    0.0046,
    0.0046,
    false
  );
  const windshieldMesh = new THREE.Mesh(windshieldGlassGeo, tintedPrivacyGlassMat);
  windshieldMesh.name = 'courtyard.landRoverDefender.glazing';
  glazingGroup.add(windshieldMesh);

  // B. Conformal Flush Side Glazing (Front Door Window, Rear Door Window, and Rear Quarter Cargo Glass)
  //    with Gloss Black B/C/D Pillar Surround from `x = -0.84m` to `x = +2.28m`, `y = 1.26m..1.85m`
  const sidePillarSurroundGeo = createConformalLateralWindowOrPanelGeometry(
    -0.86,
    2.30,
    (x) => (x < -0.52 ? lerp(1.26, 1.255, (x - -0.86) / 0.34) : 1.255),
    (x) =>
      x < -0.45
        ? lerp(1.32, 1.865, Math.max(0, (x - -0.86) / 0.41))
        : 1.865,
    40,
    14,
    0.0028,
    [-1, 1]
  );
  glazingGroup.add(new THREE.Mesh(sidePillarSurroundGeo, narvikGlossBlackMat));

  // Front Door Windows (`x = -0.82m..-0.02m`)
  const frontDoorGlassGeo = createConformalLateralWindowOrPanelGeometry(
    -0.82,
    -0.02,
    () => 1.27,
    (x) =>
      x < -0.45
        ? lerp(1.33, 1.845, Math.max(0, (x - -0.82) / 0.37))
        : 1.845,
    18,
    12,
    0.0048,
    [-1, 1]
  );
  glazingGroup.add(new THREE.Mesh(frontDoorGlassGeo, tintedPrivacyGlassMat));

  // Rear Passenger Door Windows (`x = +0.06m..+0.94m`)
  const rearDoorGlassGeo = createConformalLateralWindowOrPanelGeometry(
    0.06,
    0.94,
    () => 1.27,
    () => 1.845,
    16,
    12,
    0.0048,
    [-1, 1]
  );
  glazingGroup.add(new THREE.Mesh(rearDoorGlassGeo, tintedPrivacyGlassMat));

  // Rear Quarter Cargo Windows (`x = +1.54m..+2.26m`, behind the C-pillar Signature Graphic)
  const rearQuarterGlassGeo = createConformalLateralWindowOrPanelGeometry(
    1.54,
    2.26,
    () => 1.27,
    () => 1.845,
    14,
    12,
    0.0048,
    [-1, 1]
  );
  glazingGroup.add(new THREE.Mesh(rearQuarterGlassGeo, tintedPrivacyGlassMat));

  // Heated Rear Tailgate Window (`x = +2.28m..+2.35m, y = 1.27m..1.86m, z = -0.68m..+0.68m`)
  const rearTailgateGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.58, 1.34),
    tintedPrivacyGlassMat
  );
  rearTailgateGlass.name = 'courtyard.landRoverDefender.glazing';
  rearTailgateGlass.position.set(2.318, 1.56, 0);
  rearTailgateGlass.rotation.z = 0.095;
  glazingGroup.add(rearTailgateGlass);

  // C. 4 Flush Body-Color Door Handles (`x = -0.18m` front doors, `x = +0.62m` rear doors) &
  //    Sculpted Twin-Arm Defender Wing Mirrors (`x = -0.74m, y = 1.28m, z = ±0.98m`) with puddle-light housings
  for (const sideZ of [-1, 1] as const) {
    for (const handleX of [-0.18, 0.62] as const) {
      const handleRecess = new THREE.Mesh(
        new THREE.BoxGeometry(0.175, 0.042, 0.012),
        narvikGlossBlackMat
      );
      handleRecess.position.set(handleX, 1.155, sideZ * 0.952);
      defenderGroup.add(handleRecess);

      const handleBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.165, 0.028, 0.026),
        santoriniBlackBodyMat
      );
      handleBar.position.set(handleX, 1.155, sideZ * 0.964);
      handleBar.castShadow = true;
      defenderGroup.add(handleBar);
    }

    // Sculpted Twin-Arm L663 Wing Mirror (`x = -0.74m, y = 1.28m, z = ±0.98m`)
    const mirrorGroup = new THREE.Group();
    mirrorGroup.name = 'courtyard.landRoverDefender.wingMirror';
    mirrorGroup.position.set(-0.74, 1.28, sideZ * 0.94);
    defenderGroup.add(mirrorGroup);

    for (const armY of [-0.018, 0.018] as const) {
      const twinArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.068, 0.018, 0.095),
        narvikGlossBlackMat
      );
      twinArm.position.set(0, armY, sideZ * 0.042);
      mirrorGroup.add(twinArm);
    }

    const mirrorHousing = new THREE.Mesh(
      new THREE.BoxGeometry(0.115, 0.145, 0.185),
      santoriniBlackBodyMat
    );
    mirrorHousing.position.set(0.02, 0.025, sideZ * 0.115);
    mirrorHousing.castShadow = true;
    mirrorGroup.add(mirrorHousing);

    const mirrorGlassFace = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.125, 0.165),
      tintedPrivacyGlassMat
    );
    mirrorGlassFace.position.set(0.074, 0.025, sideZ * 0.115);
    mirrorGroup.add(mirrorGlassFace);

    const puddleLight = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.008, 0.045),
      ledHaloWhiteMat
    );
    puddleLight.position.set(0.015, -0.046, sideZ * 0.085);
    mirrorGroup.add(puddleLight);
  }

  // D. Tubular Satin-Black Rock-Slider Side Steps (`x = -0.95m..+0.95m, y = 0.26m, z = ±0.96m`)
  //    with diamond chequer-plate step pads
  for (const sideZ of [-1, 1] as const) {
    const sideStepGroup = new THREE.Group();
    sideStepGroup.name = 'courtyard.landRoverDefender.sideStep';
    defenderGroup.add(sideStepGroup);

    const sliderTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 1.90, 18),
      satinAnthraciteMat
    );
    sliderTube.rotation.z = Math.PI / 2;
    sliderTube.position.set(0.0, 0.26, sideZ * 0.975);
    sliderTube.castShadow = true;
    sideStepGroup.add(sliderTube);

    const stepPad = new THREE.Mesh(
      new THREE.BoxGeometry(1.82, 0.018, 0.11),
      chequerPlateMat
    );
    stepPad.position.set(0.0, 0.285, sideZ * 0.945);
    stepPad.receiveShadow = true;
    sideStepGroup.add(stepPad);

    for (const bracketX of [-0.78, 0.0, 0.78] as const) {
      const bracket = new THREE.Mesh(
        new THREE.BoxGeometry(0.085, 0.045, 0.16),
        narvikGlossBlackMat
      );
      bracket.position.set(bracketX, 0.255, sideZ * 0.89);
      sideStepGroup.add(bracket);
    }
  }

  // E. Detailed L663 4-Door Cabin Interior (`courtyard.landRoverDefender.interior`)
  const interiorGroup = new THREE.Group();
  interiorGroup.name = 'courtyard.landRoverDefender.interior';
  defenderGroup.add(interiorGroup);

  // Cabin floor & center console tunnel
  const cabinFloor = new THREE.Mesh(
    new THREE.BoxGeometry(2.65, 0.04, 1.56),
    narvikGlossBlackMat
  );
  cabinFloor.position.set(0.45, 0.48, 0);
  interiorGroup.add(cabinFloor);

  const centerConsole = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.38, 0.34),
    ebonyWindsorLeatherMat
  );
  centerConsole.position.set(-0.26, 0.72, 0);
  interiorGroup.add(centerConsole);

  // Signature L663 Exposed Magnesium Cross-Car Structural Dashboard Beam (`x = -0.64m, y = 1.18m, z = -0.78m..+0.78m`)
  // with `DEFENDER` debossed end caps & open storage shelf
  const dashUpperShelf = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.16, 1.52),
    ebonyWindsorLeatherMat
  );
  dashUpperShelf.position.set(-0.68, 1.18, 0);
  interiorGroup.add(dashUpperShelf);

  const magnesiumBeam = new THREE.Mesh(
    new THREE.BoxGeometry(0.085, 0.105, 1.58),
    magnesiumCrossBeamMat
  );
  magnesiumBeam.name = 'courtyard.landRoverDefender.interior';
  magnesiumBeam.position.set(-0.56, 1.16, 0);
  interiorGroup.add(magnesiumBeam);

  for (const sideZ of [-1, 1] as const) {
    const endCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.12, 0.024),
      satinAnthraciteMat
    );
    endCap.position.set(-0.56, 1.16, sideZ * 0.795);
    interiorGroup.add(endCap);

    // Grab handle on cross-car beam
    const grabHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 0.095, 0.032),
      magnesiumCrossBeamMat
    );
    grabHandle.position.set(-0.51, 1.18, sideZ * 0.68);
    interiorGroup.add(grabHandle);
  }

  // 11.4" Curved Pivi Pro Central Touchscreen (`x = -0.58m, y = 1.22m, z = 0`)
  const piviScreenBezel = new THREE.Mesh(
    new THREE.BoxGeometry(0.026, 0.175, 0.295),
    narvikGlossBlackMat
  );
  piviScreenBezel.position.set(-0.54, 1.21, 0);
  piviScreenBezel.rotation.z = -0.18;
  interiorGroup.add(piviScreenBezel);

  const piviScreenDisplay = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.155, 0.275),
    new THREE.MeshStandardMaterial({
      color: 0x162436,
      emissive: new THREE.Color(0x0c2440),
      emissiveIntensity: 0.75,
      roughness: 0.1,
    })
  );
  piviScreenDisplay.position.set(-0.525, 1.21, 0);
  piviScreenDisplay.rotation.z = -0.18;
  interiorGroup.add(piviScreenDisplay);

  // Interactive Driver Display Cluster & RHD 4-Spoke Defender Steering Wheel (`z = +0.40m` for UK Crox Farmhouse)
  const driverCluster = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.14, 0.32),
    narvikGlossBlackMat
  );
  driverCluster.position.set(-0.58, 1.23, 0.40);
  interiorGroup.add(driverCluster);

  const steeringColumn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.048, 0.24, 14),
    narvikGlossBlackMat
  );
  steeringColumn.rotation.z = Math.PI / 2 - 0.32;
  steeringColumn.position.set(-0.46, 1.18, 0.40);
  interiorGroup.add(steeringColumn);

  const steeringWheelGroup = new THREE.Group();
  steeringWheelGroup.position.set(-0.36, 1.22, 0.40);
  steeringWheelGroup.rotation.z = -0.32;
  interiorGroup.add(steeringWheelGroup);

  const steeringRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.185, 0.022, 12, 28),
    ebonyWindsorLeatherMat
  );
  steeringRim.rotation.y = Math.PI / 2;
  steeringWheelGroup.add(steeringRim);

  const steeringHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.068, 0.068, 0.036, 18),
    ebonyWindsorLeatherMat
  );
  steeringHub.rotation.z = Math.PI / 2;
  steeringWheelGroup.add(steeringHub);

  // 4-Spoke Magnesium Defender Steering Wheel Spokes
  for (const spokeAng of [-0.42, 0.42, Math.PI - 0.42, Math.PI + 0.42] as const) {
    const swSpoke = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, 0.115, 0.028),
      magnesiumCrossBeamMat
    );
    swSpoke.position.set(0, Math.sin(spokeAng) * 0.11, Math.cos(spokeAng) * 0.11);
    swSpoke.rotation.x = -spokeAng + Math.PI / 2;
    steeringWheelGroup.add(swSpoke);
  }

  // Ebony Windsor Leather Front Seats (`x = -0.22m, z = ±0.40m`)
  for (const seatZ of [-0.40, 0.40] as const) {
    const fSeatGroup = new THREE.Group();
    fSeatGroup.position.set(-0.22, 0.68, seatZ);
    interiorGroup.add(fSeatGroup);

    const seatCushion = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.14, 0.48),
      ebonyWindsorLeatherMat
    );
    fSeatGroup.add(seatCushion);

    const seatBackrest = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.64, 0.46),
      ebonyWindsorLeatherMat
    );
    seatBackrest.position.set(0.20, 0.36, 0);
    seatBackrest.rotation.z = -0.18;
    fSeatGroup.add(seatBackrest);

    const headrest = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.21, 0.24),
      ebonyWindsorLeatherMat
    );
    headrest.position.set(0.26, 0.76, 0);
    headrest.rotation.z = -0.12;
    fSeatGroup.add(headrest);
  }

  // 60:40 Second-Row Ebony Windsor Leather Bench Seats (`x = +0.68m, z = -0.66m..+0.66m`)
  const secondRowGroup = new THREE.Group();
  secondRowGroup.position.set(0.68, 0.70, 0);
  interiorGroup.add(secondRowGroup);

  // 60% Left-Center Bench Section (`z = -0.66m..+0.12m`) & 40% Right Section (`z = +0.14m..+0.66m`)
  for (const [secZ, secWidth] of [
    [-0.27, 0.78],
    [0.40, 0.52],
  ] as const) {
    const benchCushion = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.14, secWidth),
      ebonyWindsorLeatherMat
    );
    benchCushion.position.set(0, 0, secZ);
    secondRowGroup.add(benchCushion);

    const benchBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.58, secWidth - 0.02),
      ebonyWindsorLeatherMat
    );
    benchBack.position.set(0.19, 0.32, secZ);
    benchBack.rotation.z = -0.16;
    secondRowGroup.add(benchBack);
  }

  for (const hrZ of [-0.46, 0.0, 0.46] as const) {
    const rearHeadrest = new THREE.Mesh(
      new THREE.BoxGeometry(0.10, 0.18, 0.22),
      ebonyWindsorLeatherMat
    );
    rearHeadrest.position.set(0.24, 0.68, hrZ);
    secondRowGroup.add(rearHeadrest);
  }

  // Ensure every object in `defenderGroup` carries `userData.zone = 'courtyard'`
  defenderGroup.traverse((obj) => {
    obj.userData.zone = 'courtyard';
  });
}
