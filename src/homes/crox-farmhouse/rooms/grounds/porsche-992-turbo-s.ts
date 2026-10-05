import * as THREE from 'three';

/**
 * Generates a 512x512 procedural Porsche Ocean Blue Metallic (`#15436e` -> `#2d74b3`)
 * automotive basecoat + fine metallic pearl micro-flake texture.
 */
function createOceanBlueMetallicTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#143f6b');
  grad.addColorStop(0.32, '#1f5a94');
  grad.addColorStop(0.54, '#2b72b5');
  grad.addColorStop(0.76, '#1c538a');
  grad.addColorStop(1, '#123962');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const img = ctx.getImageData(0, 0, size, size);
  const data = img.data;
  for (let i = 0; i < size * size; i++) {
    const idx = i * 4;
    const h1 = Math.sin(i * 12.9898 + 4.1) * 43758.5453;
    const f1 = h1 - Math.floor(h1);
    const sparkle = (f1 - 0.5) * 10;
    data[idx] = Math.max(14, Math.min(120, Math.round(data[idx]! + sparkle * 0.7)));
    data[idx + 1] = Math.max(48, Math.min(185, Math.round(data[idx + 1]! + sparkle * 1.0)));
    data[idx + 2] = Math.max(88, Math.min(245, Math.round(data[idx + 2]! + sparkle * 1.3)));
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

/**
 * Generates a radial cross-drilled carbon-ceramic brake rotor texture (`420mm` / `390mm` PCCB).
 */
function createPccbRotorTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size * 0.5;
  const cy = size * 0.5;

  ctx.fillStyle = '#525862';
  ctx.fillRect(0, 0, size, size);

  for (let r = 80; r < 245; r += 2) {
    ctx.strokeStyle = r % 4 === 0 ? 'rgba(135, 144, 155, 0.45)' : 'rgba(52, 56, 62, 0.45)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = '#181b20';
  const numSpiralArms = 30;
  for (let a = 0; a < numSpiralArms; a++) {
    const baseAngle = (a / numSpiralArms) * Math.PI * 2;
    for (let h = 0; h < 5; h++) {
      const rad = 112 + h * 28;
      const ang = baseAngle + h * 0.048;
      const hx = cx + Math.cos(ang) * rad;
      const hy = cy + Math.sin(ang) * rad;
      ctx.beginPath();
      ctx.arc(hx, hy, 3.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates a crisp UK registration plate (`992 TBS`) texture.
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

  ctx.strokeStyle = '#1a1d21';
  ctx.lineWidth = 6;
  ctx.strokeRect(5, 5, w - 10, h - 10);

  ctx.fillStyle = '#0d3b8c';
  ctx.fillRect(8, 8, 46, h - 16);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('UK', 31, h * 0.62);

  ctx.fillStyle = '#111317';
  ctx.font = 'bold 68px "Arial Narrow", Impact, sans-serif';
  ctx.fillText('992 TBS', w * 0.54, h * 0.54);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates a Stuttgart Porsche Crest shield texture.
 */
function createPorscheCrestTexture(): THREE.CanvasTexture {
  const w = 128;
  const h = 160;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#d4b475';
  ctx.beginPath();
  ctx.moveTo(w * 0.12, h * 0.08);
  ctx.lineTo(w * 0.88, h * 0.08);
  ctx.lineTo(w * 0.86, h * 0.56);
  ctx.quadraticCurveTo(w * 0.82, h * 0.84, w * 0.5, h * 0.95);
  ctx.quadraticCurveTo(w * 0.18, h * 0.84, w * 0.14, h * 0.56);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#1c1915';
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.fillStyle = '#9b2226';
  ctx.fillRect(w * 0.5, h * 0.16, w * 0.3, h * 0.28);
  ctx.fillRect(w * 0.2, h * 0.48, w * 0.3, h * 0.28);

  ctx.fillStyle = '#141414';
  ctx.fillRect(w * 0.36, h * 0.34, w * 0.28, h * 0.3);

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
  const grad = ctx.createRadialGradient(w * 0.5, h * 0.5, 16, w * 0.5, h * 0.5, w * 0.48);
  grad.addColorStop(0, 'rgba(6, 8, 12, 0.80)');
  grad.addColorStop(0.56, 'rgba(8, 11, 16, 0.58)');
  grad.addColorStop(0.84, 'rgba(10, 14, 20, 0.20)');
  grad.addColorStop(1, 'rgba(10, 14, 20, 0.0)');
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
      const m0 = ((k1[1] - km1[1]) / Math.max(1e-5, k1[0] - km1[0])) * dx * 0.85;
      const m1 = ((kp2[1] - k0[1]) / Math.max(1e-5, kp2[0] - k0[0])) * dx * 0.85;
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
 * Plan-view wrap-around shift `xWrapShift(x, z)`:
 * Curves the outer front bumper corners slightly rearward (`+x`) and outer rear bumper corners
 * slightly forward (`-x`) so the nose and tail are rounded in plan view.
 */
function getPlanWrapShiftX(x: number, z: number): number {
  const noseWrap = smoothstep(-1.82, -2.24, x);
  const tailWrap = smoothstep(1.78, 2.24, x);
  const zNorm = Math.min(1.15, Math.abs(z) / 0.92);
  // Generous 18cm plan-view wrap at the rear corners so the 911 tail rounds smoothly into the widebody rear haunches!
  return noseWrap * zNorm * zNorm * 0.14 - tailWrap * zNorm * zNorm * 0.18;
}

// ============================================================================
// AUTHENTIC PORSCHE 911 (992.2) TURBO S LONGITUDINAL FEATURE CURVES
// (`x = -2.24m` front bumper nose to `x = +2.24m` rear bumper tail, `L = 4.48m`,
//  wheelbase `2.45m`: front axle at `x = -1.25m`, rear axle at `x = +1.20m`)
// ============================================================================

/**
 * 1. Centerline profile `yCenter(x)`:
 *    - Upright front bumper fascia (`x = -2.24..-2.12m`, rising from `0.15m` chin to `0.50m` nose crown)
 *    - Gently-sloped sunken Porsche 911 frunk hood (`x = -2.12..-0.92m`, `y = 0.50m -> 0.82m`)
 *    - Sleek raked windshield (`x = -0.92..-0.28m`, `y = 0.82m -> 1.242m`)
 *    - Low, elongated **911 Coupé Flyline Roof Crown** (`x = -0.28..+0.32m`, peaking at `1.268m`)
 *    - Continuous, taut **911 Fastback Rear Window & Slatted Engine Decklid** (`x = +0.32..+2.06m`, sloping
 *      smoothly all the way down to `0.802m` at the trailing ducktail edge!)
 *    - Recessed full-width LED taillight visor step (`x = 2.13m, y = 0.725m`)
 *    - Swelling muscular 992.2 lower rear bumper (`x = 2.23m, y = 0.56m` -> `x = 2.24m, y = 0.36m`)
 *      tucking cleanly under to the rear valance (`x = 2.20m, y = 0.18m`).
 */
const CENTERLINE_Y_KNOTS: readonly (readonly [number, number])[] = [
  [-2.24, 0.21],
  [-2.21, 0.36],
  [-2.14, 0.495],
  [-1.95, 0.575],
  [-1.65, 0.675],
  [-1.30, 0.762],
  [-0.94, 0.818], // Windshield cowl base
  [-0.75, 0.945],
  [-0.50, 1.125],
  [-0.28, 1.242], // Top of windshield header
  [-0.04, 1.268], // Smooth, low 911 roof crown
  [0.24, 1.248],
  [0.55, 1.182], // Start of rear fastback glass
  [0.92, 1.075],
  [1.28, 0.962],
  [1.54, 0.888], // Base of rear window / start of slatted engine decklid
  [1.84, 0.828], // Rear of decklid grille / base of active spoiler
  [2.06, 0.802], // Integrated ducktail trailing lip above taillight visor
  [2.14, 0.722], // Recessed full-width taillight bar visor slot
  [2.22, 0.565], // Upper crown of lower rear bumper below taillight bar
  [2.24, 0.355], // Lower rear bumper face
];

/**
 * 2. Fender / Door Beltline / Rear Haunch Shoulder Height `yShoulder(x)`:
 *    - Raised round 911 front fender pontoons (`x = -2.08..-1.00m`)
 *    - Horizontal door beltline (`y = 0.855m..0.865m` across `x = -0.90..+0.42m`)
 *    - Muscular 992.2 Turbo S rear quarter haunch cresting over the rear wheel (`y = 0.888m` at `x = 1.15m`)
 *      and then **sloping smoothly and organically downward** along the rear overhang (`0.835m` at `x = 1.56m` ->
 *      `0.762m` at `x = 1.95m` -> `0.712m` at the wrap-around taillight visor `x = 2.14m`), eliminating the boxy trunk look!
 */
const SHOULDER_Y_KNOTS: readonly (readonly [number, number])[] = [
  [-2.24, 0.21],
  [-2.20, 0.37],
  [-2.10, 0.535],
  [-1.92, 0.665],
  [-1.65, 0.778],
  [-1.25, 0.848], // Crest of front fender pontoon over front wheel
  [-0.90, 0.852],
  [-0.40, 0.858], // Taut horizontal door beltline
  [0.10, 0.865],
  [0.48, 0.878],
  [0.85, 0.892], // Muscular Turbo S rear haunch shoulder
  [1.18, 0.888], // Crest over rear wheel
  [1.56, 0.835], // Smooth downward teardrop taper behind rear wheel!
  [1.92, 0.768],
  [2.08, 0.738],
  [2.14, 0.708], // Wrap-around taillight visor channel
  [2.22, 0.545], // Swelling lower rear bumper shoulder
  [2.24, 0.345],
];

/**
 * 3. Plan-View Outer Body Half-Width `zBodyMax(x)`:
 *    - Widebody rear haunches (`z = 0.958m` at `x = 1.20m`) tapering gracefully into the rounded 911 tail (`z = 0.76m` at `x = 2.24m`).
 */
const BODY_WIDTH_Z_KNOTS: readonly (readonly [number, number])[] = [
  [-2.24, 0.62],
  [-2.18, 0.74],
  [-2.04, 0.835],
  [-1.78, 0.892],
  [-1.45, 0.915],
  [-1.25, 0.918], // Front wheel arch crown (`1.836m` width)
  [-0.90, 0.896],
  [-0.45, 0.868],
  [-0.05, 0.862], // Taut Coke-bottle door waist
  [0.35, 0.885],
  [0.75, 0.946], // Widebody rear haunch flare
  [1.20, 0.958], // Rear wheel arch crown (`1.916m` widebody width!)
  [1.58, 0.932],
  [1.90, 0.875],
  [2.12, 0.815],
  [2.24, 0.755],
];

/**
 * 4. Plan-View Teardrop Cabin Greenhouse / Hood-Edge Half-Width `zCrown(x)`:
 */
const CROWN_WIDTH_Z_KNOTS: readonly (readonly [number, number])[] = [
  [-2.24, 0.34],
  [-2.08, 0.44],
  [-1.75, 0.49],
  [-1.25, 0.54],
  [-0.92, 0.645],
  [-0.55, 0.605],
  [-0.25, 0.568],
  [0.10, 0.558],
  [0.50, 0.525],
  [0.96, 0.475],
  [1.45, 0.425], // Narrow teardrop rear glass base creating broad 911 rear haunch shelves!
  [1.85, 0.405],
  [2.08, 0.440],
  [2.24, 0.420],
];

/**
 * Evaluates the circular wheel-arch cutout height `yArch(x)` around the front (`x = -1.25m`)
 * and rear (`x = +1.20m`) axles.
 */
function sampleWheelArchCutoutY(x: number, yBaseSill: number): number {
  const frontDx = x - -1.25;
  const frontR = 0.362;
  if (Math.abs(frontDx) < frontR) {
    const archY = 0.338 + Math.sqrt(Math.max(0, frontR * frontR - frontDx * frontDx));
    return Math.max(yBaseSill, archY);
  }

  const rearDx = x - 1.20;
  const rearR = 0.382;
  if (Math.abs(rearDx) < rearR) {
    const archY = 0.354 + Math.sqrt(Math.max(0, rearR * rearR - rearDx * rearDx));
    return Math.max(yBaseSill, archY);
  }

  return yBaseSill;
}

/**
 * Computes a single cross-section profile (`nv + 1` points from `z = 0` centerline to lower rocker sill)
 * at longitudinal station `x` (`-2.24m .. +2.24m`).
 */
function sampleMonocoqueHalfProfile(x: number, nv: number): [number, number][] {
  const yCenter = evalSpline(x, CENTERLINE_Y_KNOTS);
  const yShoulder = evalSpline(x, SHOULDER_Y_KNOTS);
  const zMax = evalSpline(x, BODY_WIDTH_Z_KNOTS);
  const zCrown = Math.min(zMax * 0.82, evalSpline(x, CROWN_WIDTH_Z_KNOTS));

  const frontApproach = smoothstep(-1.62, -2.24, x);
  const rearDeparture = smoothstep(1.56, 2.24, x);
  const yBaseSill = 0.13 + frontApproach * 0.035 + rearDeparture * 0.055;
  const yArchCut = sampleWheelArchCutoutY(x, yBaseSill);

  const hoodWeight = 1 - smoothstep(-0.98, -0.78, x);
  const cabinWeight = smoothstep(-0.92, -0.62, x) * (1 - smoothstep(1.42, 1.85, x));

  // Side intercooler intake recess on the Turbo S rear fender leading flank (`x = 0.56..0.90m`)
  const intakeLongitudinal =
    smoothstep(0.54, 0.64, x) * (1 - smoothstep(0.78, 0.92, x));

  const pts: [number, number][] = [];
  for (let j = 0; j <= nv; j++) {
    const v = j / nv;
    let y = 0;
    let z = 0;

    if (v <= 0.32) {
      const u = v / 0.32;
      z = u * zCrown;
      const camber =
        cabinWeight * 0.018 * (1 - u * u) - hoodWeight * 0.012 * Math.sin(u * Math.PI);
      y = yCenter + camber;
    } else if (v <= 0.58) {
      const u = (v - 0.32) / 0.26;
      const shelfBlend = smoothstep(0.0, 1.0, u);
      const glassSlopeU = Math.min(1, u * 1.38);
      const yCabinTransition = lerp(
        yCenter,
        yShoulder,
        0.74 * glassSlopeU + 0.26 * shelfBlend * shelfBlend
      );
      const pontoonArch = hoodWeight * 0.022 * Math.sin(u * Math.PI);
      y =
        lerp(yCenter, yShoulder, shelfBlend) * (1 - cabinWeight) +
        yCabinTransition * cabinWeight +
        pontoonArch;
      z = lerp(zCrown, zMax * 0.94, Math.pow(u, 0.85));
    } else if (v <= 0.90) {
      const u = (v - 0.58) / 0.32;
      const yFlankNominal = lerp(yShoulder, yBaseSill + 0.035, u);
      const yClampedMin = yArchCut + 0.022 + (1 - u) * 0.04;
      y = Math.max(yFlankNominal, lerp(yShoulder, yClampedMin, u));

      const flankBelly = Math.sin(u * Math.PI * 0.82);
      z = lerp(zMax * 0.94, zMax * 0.96, u) + flankBelly * 0.038;

      if (intakeLongitudinal > 0.01) {
        const intakeV = smoothstep(0.20, 0.35, u) * (1 - smoothstep(0.58, 0.74, u));
        z -= intakeLongitudinal * intakeV * 0.048;
      }
    } else {
      const u = (v - 0.90) / 0.10;
      const yTop = Math.max(lerp(yShoulder, yBaseSill + 0.035, 1.0), yArchCut + 0.022);
      y = lerp(yTop, yArchCut, u);
      const isWheelArch = smoothstep(yBaseSill + 0.01, yBaseSill + 0.12, yArchCut);
      const tuckIn = lerp(0.055, 0.018, isWheelArch);
      z = zMax * 0.96 - u * tuckIn;
    }

    pts.push([y, Math.max(0, z)]);
  }

  return pts;
}

function sampleLateralSurfaceZAtXY(x: number, yTarget: number): number {
  const halfPts = sampleMonocoqueHalfProfile(x, 64);
  let bestZ = halfPts[20]![1];
  let bestDiff = 1e9;
  // Search across the tumblehome / upper flank region (`j = 16 .. 42`) where `y` decreases monotonically
  for (let j = 16; j < 44; j++) {
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
 * Builds the Porsche 911 Teardrop Side Window (`DLO`) mesh directly from exact side-view `(x, y)` curves:
 * - Raked front A-pillar (`x = -0.82m..-0.30m`)
 * - Smooth parabolic 911 roof-rail arch (`x = -0.30m..+0.96m`, peaking at `y = 1.205m`)
 * - Horizontal door beltline sill (`y = 0.872m` from `x = -0.80m` to `x = +0.42m`) curving upward at the rear
 *   quarter panel (`x = +0.42m..+0.96m`) into the iconic 911 spear point at `(x = +0.96m, y = 0.945m)`!
 */
function createSideWindowDloGeometry(
  marginX: number,
  marginY: number,
  outwardZOffset: number
): THREE.BufferGeometry {
  const xStart = -0.82 - marginX;
  const xEnd = 0.96 + marginX * 1.2;
  const segX = 44;
  const segY = 14;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const evalDloTopY = (x: number): number => {
    if (x < -0.30) {
      // Straight/gently-curved A-pillar parallel to windshield
      const u = Math.max(0, Math.min(1, (x - -0.82) / (-0.30 - -0.82)));
      return lerp(0.875, 1.195, Math.pow(u, 0.92)) + marginY;
    }
    // Parabolic 911 roof rail arch from `x = -0.30m` (`1.195m`), peaking at `x = -0.05m` (`1.212m`),
    // and sweeping down to the rear spear tip at `x = +0.96m` (`0.945m`)
    const u = Math.max(0, Math.min(1, (x - -0.30) / (0.96 - -0.30)));
    const arch = 1.195 + 0.045 * Math.sin(u * Math.PI * 0.65) - 0.25 * Math.pow(u, 1.55);
    return arch + marginY;
  };

  const evalDloBotY = (x: number): number => {
    // Horizontal along the door top (`0.872m` -> `0.882m`), then sweeping upward into the C-pillar spear point (`0.945m`)
    const u = Math.max(0, Math.min(1, (x - -0.82) / (0.96 - -0.82)));
    const rearSweep = smoothstep(0.62, 1.0, u);
    return lerp(0.872, 0.885, u) + rearSweep * 0.060 - marginY;
  };

  for (const sideZ of [-1, 1] as const) {
    const baseVertex = positions.length / 3;
    for (let ix = 0; ix <= segX; ix++) {
      const tx = ix / segX;
      // Cosine cluster near front and rear corners for crisp spear points
      const shapedTx = 0.5 - 0.5 * Math.cos(tx * Math.PI);
      const x = lerp(xStart, xEnd, lerp(tx, shapedTx, 0.55));
      const yBot = evalDloBotY(x);
      const yTop = Math.max(yBot + 0.004, evalDloTopY(x));

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
 * Builds the unified, water-tight, smooth-shaded monocoque body shell (`outbuildings.garage.porsche992TurboS.bodyShell`).
 */
function createUnifiedPorsche992BodyGeometry(): THREE.BufferGeometry {
  const nx = 116;
  const nv = 44;
  const xMin = -2.24;
  const xMax = 2.24;
  const rowStride = nv * 2 + 1;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= nx; i++) {
    const t = i / nx;
    const shapedT = 0.5 - 0.5 * Math.cos(t * Math.PI);
    const x = lerp(xMin, xMax, lerp(t, shapedT, 0.35));
    const halfPts = sampleMonocoqueHalfProfile(x, nv);

    for (let k = -nv; k <= nv; k++) {
      const j = Math.abs(k);
      const signZ = k < 0 ? -1 : k > 0 ? 1 : 0;
      const [py, pzAbs] = halfPts[j]!;
      const pz = signZ * pzAbs;
      const vx = x + getPlanWrapShiftX(x, pz);

      positions.push(vx, py, pz);
      uvs.push((vx - xMin) / (xMax - xMin), (pz + 0.96) / 1.92);
    }
  }

  // Add 2 extra water-tight rear-bumper lower wrap stations (`i = nx + 1` vertical lower bumper face at `y = 0.24m`,
  // and `i = nx + 2` tucked-under rear valance sill at `x = 2.16m, y = 0.185m`) so the rear of the car is 100% closed!
  const lastHalfPts = sampleMonocoqueHalfProfile(xMax, nv);
  for (const [extraX, targetCenterY, tuckScaleZ] of [
    [2.235, 0.235, 0.97],
    [2.165, 0.185, 0.91],
  ] as const) {
    for (let k = -nv; k <= nv; k++) {
      const j = Math.abs(k);
      const signZ = k < 0 ? -1 : k > 0 ? 1 : 0;
      const vFrac = j / nv;
      const [, pzOrig] = lastHalfPts[j]!;
      const pz = signZ * pzOrig * tuckScaleZ;
      const py = lerp(targetCenterY, 0.185, Math.pow(vFrac, 0.75));
      const vx = extraX + getPlanWrapShiftX(extraX, pz);

      positions.push(vx, py, pz);
      uvs.push(1.0, (pz + 0.96) / 1.92);
    }
  }

  const totalStations = nx + 2;
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

function createConformalBodyPatchGeometry(
  xStart: number,
  xEnd: number,
  vStartFunc: (x: number) => number,
  vEndFunc: (x: number) => number,
  segX: number,
  segV: number,
  outwardOffset: number,
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
      const halfPts = sampleMonocoqueHalfProfile(x, nv);
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
        const py = lerp(p0[0], p1[0], frac) + outwardOffset * 0.85;
        const pz = sign * (lerp(p0[1], p1[1], frac) + outwardOffset * 0.65);
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
 * Builds an elliptical conformal patch on the front fender pontoon (`(xCenter, vCenter)`)
 * so the 992.2 oval headlights lie 100% flush with the fender curvature and never stick out!
 */
function createConformalEllipticalHeadlightPatch(
  xCenter: number,
  vCenter: number,
  radiusX: number,
  radiusV: number,
  outwardOffset: number,
  sideZ: 1 | -1
): THREE.BufferGeometry {
  const nv = 64;
  const rings = 8;
  const sectors = 28;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r <= rings; r++) {
    const fracR = r / rings;
    for (let s = 0; s <= sectors; s++) {
      const ang = (s / sectors) * Math.PI * 2;
      const x = xCenter + Math.cos(ang) * radiusX * fracR;
      const v = Math.max(0.02, Math.min(0.88, vCenter + Math.sin(ang) * radiusV * fracR));

      const halfPts = sampleMonocoqueHalfProfile(x, nv);
      const fIdx = v * nv;
      const j0 = Math.floor(fIdx);
      const j1 = Math.min(nv, j0 + 1);
      const frac = fIdx - j0;
      const p0 = halfPts[j0]!;
      const p1 = halfPts[j1]!;

      // Dome profile rises slightly (`8mm`) in the center of the lens while the perimeter (`fracR = 1`) is flush (`2mm`)
      const domeLift = outwardOffset + (1 - fracR * fracR) * 0.006;
      const py = lerp(p0[0], p1[0], frac) + domeLift * 0.88;
      const pz = sideZ * (lerp(p0[1], p1[1], frac) + domeLift * 0.48);
      const vx = x + getPlanWrapShiftX(x, pz) - domeLift * 0.25;

      positions.push(vx, py, pz);
      uvs.push(0.5 + 0.5 * fracR * Math.cos(ang), 0.5 + 0.5 * fracR * Math.sin(ang));
    }
  }

  const stride = sectors + 1;
  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < sectors; s++) {
      const a = r * stride + s;
      const b = (r + 1) * stride + s;
      const c = (r + 1) * stride + s + 1;
      const d = r * stride + s + 1;
      if (sideZ > 0) {
        indices.push(a, c, b, a, d, c);
      } else {
        indices.push(a, b, c, a, c, d);
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
 * Builds a cylindrical wheel-arch lip & dark inner wheelhouse liner around a wheel opening.
 */
function buildWheelArchFenderLipAndLiner(
  parent: THREE.Group,
  xAxle: number,
  yAxle: number,
  rArch: number,
  zOuter: number,
  bodyMat: THREE.Material,
  linerMat: THREE.Material
): void {
  const segs = 32;
  const lipPositions: number[] = [];
  const lipIndices: number[] = [];
  const linerPositions: number[] = [];
  const linerIndices: number[] = [];

  const lipWidth = 0.022;
  const linerDepthZ = 0.34;

  for (const sideZ of [-1, 1] as const) {
    const lipBase = lipPositions.length / 3;
    const linerBase = linerPositions.length / 3;

    for (let s = 0; s <= segs; s++) {
      const ang = -0.12 + (s / segs) * (Math.PI + 0.24);
      const c = Math.cos(ang);
      const sn = Math.sin(ang);
      const px = xAxle - c * rArch;
      const py = Math.max(0.13, yAxle + sn * rArch);
      const pxOut = xAxle - c * (rArch + lipWidth);
      const pyOut = Math.max(0.13, yAxle + sn * (rArch + lipWidth));

      const zRim = sideZ * zOuter;
      const zIn = sideZ * (zOuter - 0.028);
      const zDeep = sideZ * (zOuter - linerDepthZ);

      lipPositions.push(pxOut, pyOut, zRim, px, py, zIn);
      linerPositions.push(px, py, zIn, px * 0.98 + xAxle * 0.02, Math.max(0.12, py - 0.02), zDeep);
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
  const lipMesh = new THREE.Mesh(lipGeo, bodyMat);
  lipMesh.name = 'outbuildings.garage.porsche992TurboS.fenderLip';
  lipMesh.castShadow = true;
  lipMesh.receiveShadow = true;
  parent.add(lipMesh);

  const linerGeo = new THREE.BufferGeometry();
  linerGeo.setAttribute('position', new THREE.Float32BufferAttribute(linerPositions, 3));
  linerGeo.setIndex(linerIndices);
  linerGeo.computeVertexNormals();
  const linerMesh = new THREE.Mesh(linerGeo, linerMat);
  parent.add(linerMesh);
}

/**
 * Builds a single high-LOD 20"/21" Porsche 992.2 Turbo S Exclusive Design Forged Center-Lock Wheel,
 * Michelin Pilot Sport 4S tire (OPEN-ENDED tread cylinder so the wheel spokes, PCCB rotor & Speed Yellow
 * brake caliper are 100% visible!), 420mm/390mm PCCB cross-drilled carbon-ceramic rotor, and Speed Yellow caliper.
 */
function buildPorscheTurboSWheelCorner(
  parent: THREE.Group,
  x: number,
  y: number,
  z: number,
  tireRadius: number,
  rimRadius: number,
  tireWidth: number,
  isLeft: boolean,
  isFront: boolean,
  materials: {
    tireRubberMat: THREE.Material;
    diamondCutAlloyMat: THREE.Material;
    turboniteBarrelMat: THREE.Material;
    pccbRotorMat: THREE.Material;
    pccbYellowCaliperMat: THREE.Material;
    centerLockMat: THREE.Material;
    crestMat: THREE.Material;
  }
): void {
  const signZ = isLeft ? -1 : 1;
  const cornerGroup = new THREE.Group();
  cornerGroup.name = 'outbuildings.garage.porsche992TurboS.wheel';
  cornerGroup.position.set(x, y, z);
  parent.add(cornerGroup);

  // 1. Michelin Pilot Sport 4S Tire Assembly:
  //    CRITICAL: `openEnded = true` so solid circular cylinder end-caps NEVER cover the forged wheel spokes or PCCB brakes!
  const treadW = tireWidth * 0.82;
  const treadCyl = new THREE.Mesh(
    new THREE.CylinderGeometry(tireRadius, tireRadius, treadW, 36, 1, true),
    materials.tireRubberMat
  );
  treadCyl.rotation.x = Math.PI / 2;
  treadCyl.castShadow = true;
  treadCyl.receiveShadow = true;
  cornerGroup.add(treadCyl);

  const sidewallTubeR = (tireRadius - rimRadius) * 0.55;
  const sidewallMajorR = rimRadius + sidewallTubeR * 0.92;
  for (const side of [-1, 1] as const) {
    const shoulderTorus = new THREE.Mesh(
      new THREE.TorusGeometry(sidewallMajorR, sidewallTubeR, 16, 36),
      materials.tireRubberMat
    );
    shoulderTorus.scale.set(1, 1, 0.55);
    shoulderTorus.position.set(0, 0, side * (treadW * 0.46));
    cornerGroup.add(shoulderTorus);
  }

  // 2. Dark Turbonite Inner Alloy Wheel Barrel, Recessed Back-Plate & Outer Diamond-Turned Lip Flange
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(rimRadius, rimRadius * 0.96, tireWidth * 0.82, 32, 1, true),
    materials.turboniteBarrelMat
  );
  barrel.rotation.x = Math.PI / 2;
  cornerGroup.add(barrel);

  const innerWheelBackDisk = new THREE.Mesh(
    new THREE.CircleGeometry(rimRadius * 0.96, 28),
    materials.turboniteBarrelMat
  );
  innerWheelBackDisk.position.set(0, 0, -signZ * (tireWidth * 0.36));
  if (!isLeft) innerWheelBackDisk.rotation.y = Math.PI;
  cornerGroup.add(innerWheelBackDisk);

  const outerFaceZ = signZ * (tireWidth * 0.42);
  const rimLipRing = new THREE.Mesh(
    new THREE.TorusGeometry(rimRadius, 0.012, 14, 36),
    materials.diamondCutAlloyMat
  );
  rimLipRing.scale.set(1, 1, 0.65);
  rimLipRing.position.set(0, 0, outerFaceZ);
  cornerGroup.add(rimLipRing);

  // 3. 992.2 Turbo S Exclusive Design 5-Twin-Spoke (10-blade) Forged Wheel Face
  const hubRadius = 0.058;
  const spokeLen = rimRadius - hubRadius - 0.004;
  const spokeMidR = hubRadius + spokeLen * 0.5;
  for (let p = 0; p < 5; p++) {
    const pairAngle = (p / 5) * Math.PI * 2;
    for (const bladeOffset of [-0.145, 0.145] as const) {
      const ang = pairAngle + bladeOffset;
      const spoke = new THREE.Mesh(
        new THREE.BoxGeometry(0.022, spokeLen, 0.02),
        materials.diamondCutAlloyMat
      );
      spoke.position.set(
        Math.cos(ang) * spokeMidR,
        Math.sin(ang) * spokeMidR,
        outerFaceZ - signZ * 0.014
      );
      spoke.rotation.z = ang - Math.PI / 2;
      spoke.rotation.x = signZ * 0.12;
      cornerGroup.add(spoke);
    }
  }

  // 4. Forged Center-Lock Hub & Porsche Crest Cap
  const hubCyl = new THREE.Mesh(
    new THREE.CylinderGeometry(hubRadius, hubRadius * 1.08, 0.044, 24),
    materials.turboniteBarrelMat
  );
  hubCyl.rotation.x = Math.PI / 2;
  hubCyl.position.set(0, 0, outerFaceZ - signZ * 0.026);
  cornerGroup.add(hubCyl);

  const centerLockNut = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.039, 0.026, 12),
    materials.centerLockMat
  );
  centerLockNut.rotation.x = Math.PI / 2;
  centerLockNut.position.set(0, 0, outerFaceZ - signZ * 0.006);
  cornerGroup.add(centerLockNut);

  const crestCap = new THREE.Mesh(
    new THREE.CircleGeometry(0.022, 16),
    materials.crestMat
  );
  crestCap.position.set(0, 0, outerFaceZ + signZ * 0.008);
  if (isLeft) crestCap.rotation.y = Math.PI;
  cornerGroup.add(crestCap);

  // 5. PCCB 420mm Front / 390mm Rear Cross-Drilled Carbon-Ceramic Brake Rotor & Speed Yellow Caliper
  const rotorR = isFront ? 0.205 : 0.192;
  const rotorMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(rotorR, rotorR, 0.026, 32),
    materials.pccbRotorMat
  );
  rotorMesh.name = 'outbuildings.garage.porsche992TurboS.pccbRotor';
  rotorMesh.rotation.x = Math.PI / 2;
  rotorMesh.position.set(0, 0, outerFaceZ - signZ * 0.056);
  cornerGroup.add(rotorMesh);

  // 10-Piston Front / 4-Piston Rear Porsche Speed Yellow Monobloc Caliper
  const caliperAngle = isFront ? 0.32 : Math.PI - 0.32;
  const caliperR = rotorR - 0.026;
  const caliperGroup = new THREE.Group();
  caliperGroup.name = 'outbuildings.garage.porsche992TurboS.pccbCaliper';
  caliperGroup.position.set(
    Math.cos(caliperAngle) * caliperR,
    Math.sin(caliperAngle) * caliperR,
    outerFaceZ - signZ * 0.048
  );
  caliperGroup.rotation.z = caliperAngle;
  cornerGroup.add(caliperGroup);

  const caliperBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.074, isFront ? 0.195 : 0.155, 0.068),
    materials.pccbYellowCaliperMat
  );
  caliperGroup.add(caliperBody);
}

/**
 * Builds an authentic, showroom-grade 3D model of a **Porsche 911 (992.2) Turbo S Coupé in Ocean Blue Metallic**
 * (`outbuildings.garage.porsche992TurboS`, `userData.zone = 'study'`) parked **100% straight** in the East Garage bay
 * (`u = 10.44m, y = garageFloorTopY, v = 2.86m, rotation.y = -Math.PI / 2`), facing straight North (`-v`) toward the
 * East Garage Double Coach Doors (`u = 9.12..11.76m`) per Issue #2 ("Move the car to this side" at `[-11.137, -0.5, 18.79]`).
 */
export function buildPorsche992TurboS(
  groundGroup: THREE.Group,
  garageFloorTopY: number
): void {
  const carGroup = new THREE.Group();
  carGroup.name = 'outbuildings.garage.porsche992TurboS';
  carGroup.userData.zone = 'study';
  carGroup.position.set(10.44, garageFloorTopY, 2.86);
  carGroup.rotation.y = -Math.PI / 2;
  groundGroup.add(carGroup);

  // ---------------------------------------------------------------------------
  // Materials
  // ---------------------------------------------------------------------------
  const oceanBlueTex = createOceanBlueMetallicTexture();
  // Balanced metalness (`0.42`) & clearcoat sheen so the rich Porsche Ocean Blue Metallic colour
  // gleams under the cool-white garage LEDs instead of appearing pitch black without an envMap!
  const oceanBlueBodyMat = new THREE.MeshStandardMaterial({
    color: 0x22649e,
    map: oceanBlueTex,
    emissive: new THREE.Color(0x06192e),
    emissiveIntensity: 0.26,
    roughness: 0.2,
    metalness: 0.42,
    side: THREE.DoubleSide,
  });

  const satinBlackAeroMat = new THREE.MeshStandardMaterial({
    color: 0x1a1e24,
    roughness: 0.42,
    metalness: 0.28,
    side: THREE.DoubleSide,
  });

  const glossBlackTrimMat = new THREE.MeshStandardMaterial({
    color: 0x101318,
    roughness: 0.16,
    metalness: 0.42,
    side: THREE.DoubleSide,
  });

  const turboniteMat = new THREE.MeshStandardMaterial({
    color: 0x5c626b,
    roughness: 0.26,
    metalness: 0.72,
  });

  const tintedGlassMat = new THREE.MeshStandardMaterial({
    color: 0x1a2c3e,
    roughness: 0.08,
    metalness: 0.18,
    transparent: true,
    opacity: 0.58,
    side: THREE.DoubleSide,
  });

  const clearLensMat = new THREE.MeshStandardMaterial({
    color: 0xeaf4ff,
    roughness: 0.06,
    metalness: 0.12,
    transparent: true,
    opacity: 0.44,
    side: THREE.DoubleSide,
  });

  const ledDrlMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0xf0f8ff),
    emissiveIntensity: 2.6,
    roughness: 0.1,
  });

  const crimsonTaillightMat = new THREE.MeshStandardMaterial({
    color: 0xff1a22,
    emissive: new THREE.Color(0xff1118),
    emissiveIntensity: 2.2,
    roughness: 0.14,
  });

  const smokedRedLensMat = new THREE.MeshStandardMaterial({
    color: 0x4a080c,
    roughness: 0.08,
    metalness: 0.2,
    transparent: true,
    opacity: 0.65,
  });

  const tireRubberMat = new THREE.MeshStandardMaterial({
    color: 0x1a1d21,
    roughness: 0.76,
    metalness: 0.06,
    side: THREE.DoubleSide,
  });

  const diamondCutAlloyMat = new THREE.MeshStandardMaterial({
    color: 0xe6ecf4,
    emissive: new THREE.Color(0x181c22),
    emissiveIntensity: 0.18,
    roughness: 0.18,
    metalness: 0.78,
  });

  const pccbRotorMat = new THREE.MeshStandardMaterial({
    map: createPccbRotorTexture(),
    color: 0xffffff,
    roughness: 0.34,
    metalness: 0.58,
  });

  const pccbYellowCaliperMat = new THREE.MeshStandardMaterial({
    color: 0xf7c800, // Porsche Speed Yellow PCCB
    emissive: new THREE.Color(0x3a2e00),
    emissiveIntensity: 0.2,
    roughness: 0.22,
    metalness: 0.24,
  });

  const crestMat = new THREE.MeshStandardMaterial({
    map: createPorscheCrestTexture(),
    transparent: true,
    roughness: 0.25,
    metalness: 0.55,
  });

  const titaniumExhaustMat = new THREE.MeshStandardMaterial({
    color: 0xb2bac6,
    roughness: 0.2,
    metalness: 0.82,
  });

  const slateLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x2c3138,
    roughness: 0.58,
    metalness: 0.05,
  });

  const chalkLeatherMat = new THREE.MeshStandardMaterial({
    color: 0xdad6cc,
    roughness: 0.54,
    metalness: 0.04,
  });

  // ---------------------------------------------------------------------------
  // 0. Soft Ambient Occlusion Contact Shadow Pad + Plan-Conformal Undertray
  // ---------------------------------------------------------------------------
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(4.76, 2.12),
    new THREE.MeshBasicMaterial({
      map: createUnderCarShadowTexture(),
      transparent: true,
      depthWrite: false,
    })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.set(0, 0.003, 0);
  carGroup.add(shadowPlane);

  // Undertray tucked cleanly inside the wheelbase & bumper overhang (`3.65m x 1.32m`) so zero corners stick out!
  const undertray = new THREE.Mesh(
    new THREE.BoxGeometry(3.65, 0.036, 1.32),
    satinBlackAeroMat
  );
  undertray.position.set(0, 0.145, 0);
  carGroup.add(undertray);

  // ---------------------------------------------------------------------------
  // 1. Unified Smooth Monocoque 992.2 Widebody Shell (`outbuildings.garage.porsche992TurboS.bodyShell`)
  // ---------------------------------------------------------------------------
  const bodyShellGeo = createUnifiedPorsche992BodyGeometry();
  const bodyShellMesh = new THREE.Mesh(bodyShellGeo, oceanBlueBodyMat);
  bodyShellMesh.name = 'outbuildings.garage.porsche992TurboS.bodyShell';
  bodyShellMesh.castShadow = true;
  bodyShellMesh.receiveShadow = true;
  carGroup.add(bodyShellMesh);

  // Front (`x = -1.25m`) and Rear (`x = +1.20m`) Cylindrical Fender Arch Lip Flanges & Wheelhouse Liners
  buildWheelArchFenderLipAndLiner(
    carGroup,
    -1.25,
    0.338,
    0.362,
    0.885,
    oceanBlueBodyMat,
    satinBlackAeroMat
  );
  buildWheelArchFenderLipAndLiner(
    carGroup,
    1.20,
    0.354,
    0.382,
    0.922,
    oceanBlueBodyMat,
    satinBlackAeroMat
  );

  // Sculpted Lower Side Rocker Skirts (`x = -0.84m .. +0.78m`)
  for (const sideZ of [-1, 1] as const) {
    const rockerSkirt = new THREE.Mesh(
      new THREE.BoxGeometry(1.62, 0.034, 0.055),
      satinBlackAeroMat
    );
    rockerSkirt.position.set(-0.03, 0.138, sideZ * 0.835);
    carGroup.add(rockerSkirt);
  }

  // ---------------------------------------------------------------------------
  // 2. Flush Compound-Curved Glazing (`outbuildings.garage.porsche992TurboS.glazing`):
  //    - Curved Front Windshield (`x = -0.92m .. -0.28m`)
  //    - Fastback Heated Rear Screen (`x = +0.48m .. +1.52m`)
  //    - Iconic Porsche 911 Parabolic Spear Side Windows (`DLO`, `x = -0.82m .. +0.96m`)
  // ---------------------------------------------------------------------------
  const glazingGroup = new THREE.Group();
  glazingGroup.name = 'outbuildings.garage.porsche992TurboS.glazing';
  carGroup.add(glazingGroup);

  // Front Windshield (flush conformal patch with thin satin-black ceramic frit border)
  const windshieldBorderGeo = createConformalBodyPatchGeometry(
    -0.92,
    -0.26,
    () => 0.0,
    () => 0.295,
    24,
    24,
    0.0025,
    false
  );
  glazingGroup.add(new THREE.Mesh(windshieldBorderGeo, glossBlackTrimMat));

  const windshieldGlassGeo = createConformalBodyPatchGeometry(
    -0.88,
    -0.30,
    () => 0.0,
    () => 0.275,
    24,
    24,
    0.0042,
    false
  );
  const windshieldGlassMesh = new THREE.Mesh(windshieldGlassGeo, tintedGlassMat);
  windshieldGlassMesh.name = 'outbuildings.garage.porsche992TurboS.glazing';
  glazingGroup.add(windshieldGlassMesh);

  // Fastback Rear Window (`x = +0.48m .. +1.52m`)
  const rearGlassBorderGeo = createConformalBodyPatchGeometry(
    0.46,
    1.54,
    () => 0.0,
    () => 0.285,
    24,
    22,
    0.0025,
    false
  );
  glazingGroup.add(new THREE.Mesh(rearGlassBorderGeo, glossBlackTrimMat));

  const rearGlassGeo = createConformalBodyPatchGeometry(
    0.50,
    1.50,
    () => 0.0,
    () => 0.265,
    24,
    22,
    0.0042,
    false
  );
  const rearGlassMesh = new THREE.Mesh(rearGlassGeo, tintedGlassMat);
  rearGlassMesh.name = 'outbuildings.garage.porsche992TurboS.glazing';
  glazingGroup.add(rearGlassMesh);

  // Iconic Porsche 911 Teardrop Spear Side Windows (`DLO`, built from exact 2D side-view `(x, y)` curves!)
  const sideWindowTrimGeo = createSideWindowDloGeometry(0.018, 0.014, 0.0028);
  glazingGroup.add(new THREE.Mesh(sideWindowTrimGeo, glossBlackTrimMat));

  const sideWindowGlassGeo = createSideWindowDloGeometry(0.0, 0.0, 0.0045);
  const sideWindowGlassMesh = new THREE.Mesh(sideWindowGlassGeo, tintedGlassMat);
  sideWindowGlassMesh.name = 'outbuildings.garage.porsche992TurboS.glazing';
  glazingGroup.add(sideWindowGlassMesh);

  // ---------------------------------------------------------------------------
  // 3. Detailed 992.2 Interior Cabin (`outbuildings.garage.porsche992TurboS.interior`)
  // ---------------------------------------------------------------------------
  const interiorGroup = new THREE.Group();
  interiorGroup.name = 'outbuildings.garage.porsche992TurboS.interior';
  carGroup.add(interiorGroup);

  const dashCowling = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.16, 1.12),
    slateLeatherMat
  );
  dashCowling.position.set(-0.56, 0.80, 0);
  interiorGroup.add(dashCowling);

  const chronoPod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.042, 0.055, 16),
    slateLeatherMat
  );
  chronoPod.rotation.z = Math.PI / 2;
  chronoPod.position.set(-0.52, 0.89, 0);
  interiorGroup.add(chronoPod);

  // RHD GT Sport Steering Wheel (`z = +0.34m` for UK Crox Farmhouse)
  const steeringWheel = new THREE.Mesh(
    new THREE.TorusGeometry(0.155, 0.018, 12, 24),
    slateLeatherMat
  );
  steeringWheel.rotation.y = Math.PI / 2;
  steeringWheel.rotation.z = -0.32;
  steeringWheel.position.set(-0.32, 0.83, 0.34);
  interiorGroup.add(steeringWheel);

  // Two 18-Way Adaptive Sport Seats Plus in two-tone Slate Grey & Chalk leather
  for (const seatZ of [-0.34, 0.34] as const) {
    const seatBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.11, 0.44),
      slateLeatherMat
    );
    seatBase.position.set(0.0, 0.46, seatZ);
    interiorGroup.add(seatBase);

    const seatBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.56, 0.42),
      slateLeatherMat
    );
    seatBack.position.set(0.22, 0.76, seatZ);
    seatBack.rotation.z = -0.24;
    interiorGroup.add(seatBack);

    const seatCenterInsert = new THREE.Mesh(
      new THREE.BoxGeometry(0.115, 0.42, 0.26),
      chalkLeatherMat
    );
    seatCenterInsert.position.set(0.212, 0.73, seatZ);
    seatCenterInsert.rotation.z = -0.24;
    interiorGroup.add(seatCenterInsert);
  }

  // ---------------------------------------------------------------------------
  // 4. 992.2 Facelift Front Fascia, Plan-Curved Active Vertical Cooling Louvres,
  //    PAA Front Chin Splitter & Conformal 4-Point HD-Matrix LED Headlights
  // ---------------------------------------------------------------------------
  // Deployed PAA Front Chin Splitter (`outbuildings.garage.porsche992TurboS.frontSpoiler`)
  // Follows the exact plan-view wrap curve `getPlanWrapShiftX` so it never sticks out at the corners!
  const splitterPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 28; i++) {
    const u = (i / 28) * 2 - 1; // -1 .. +1
    const z = u * 0.78;
    const x = -2.245 + getPlanWrapShiftX(-2.24, z);
    splitterPts.push(new THREE.Vector3(x, 0.132, z));
  }
  const splitterCurve = new THREE.CatmullRomCurve3(splitterPts);
  const frontSplitter = new THREE.Mesh(
    new THREE.TubeGeometry(splitterCurve, 32, 0.018, 10, false),
    satinBlackAeroMat
  );
  frontSplitter.scale.set(1.3, 0.65, 1.0);
  frontSplitter.position.set(2.245 * 0.3, 0.132 * 0.35, 0);
  frontSplitter.name = 'outbuildings.garage.porsche992TurboS.frontSpoiler';
  carGroup.add(frontSplitter);

  // 992.2 Front Bumper Intake Aperture & 5 Vertical Active Cooling Flaps per side (`outbuildings.garage.porsche992TurboS.frontActiveLouvres`)
  // Curved along `getPlanWrapShiftX(-2.22, z)` so every intake pod and vertical flap sits flush inside the front bumper nose!
  const frontIntakesGroup = new THREE.Group();
  frontIntakesGroup.name = 'outbuildings.garage.porsche992TurboS.frontActiveLouvres';
  carGroup.add(frontIntakesGroup);

  const frontGrillePts: THREE.Vector3[] = [];
  for (let i = 0; i <= 24; i++) {
    const u = (i / 24) * 2 - 1;
    const z = u * 0.68;
    const x = -2.225 + getPlanWrapShiftX(-2.22, z);
    frontGrillePts.push(new THREE.Vector3(x, 0.215, z));
  }
  const frontGrilleCurve = new THREE.CatmullRomCurve3(frontGrillePts);
  const frontIntakeRecess = new THREE.Mesh(
    new THREE.TubeGeometry(frontGrilleCurve, 28, 0.055, 10, false),
    glossBlackTrimMat
  );
  frontIntakeRecess.scale.set(0.45, 1.0, 1.0);
  frontIntakeRecess.position.set(-2.225 * 0.55, 0, 0);
  frontIntakesGroup.add(frontIntakeRecess);

  for (const sideZ of [-1, 1] as const) {
    // 5 signature 992.2 vertical active aerodynamic cooling flaps per outer intake, following the curved bumper face
    for (let f = 0; f < 5; f++) {
      const fz = sideZ * (0.34 + f * 0.068);
      const fx = -2.23 + getPlanWrapShiftX(-2.22, fz);
      const flap = new THREE.Mesh(
        new THREE.BoxGeometry(0.024, 0.105, 0.01),
        turboniteMat
      );
      flap.name = 'outbuildings.garage.porsche992TurboS.frontActiveLouvres';
      flap.position.set(fx, 0.215, fz);
      flap.rotation.y = -sideZ * 0.26;
      frontIntakesGroup.add(flap);
    }
  }

  // Front UK Number Plate (`992 TBS` on white plate, flush on the front nose at `x = -2.242m, y = 0.305m`)
  const frontPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.01, 0.082, 0.38),
    new THREE.MeshStandardMaterial({
      map: createUkNumberPlateTexture(false),
      roughness: 0.25,
    })
  );
  frontPlate.position.set(-2.242, 0.305, 0);
  carGroup.add(frontPlate);

  // Stuttgart Porsche Crest on Front Hood Nose (`x = -2.02m, y = 0.548m, z = 0`)
  const hoodCrest = new THREE.Mesh(
    new THREE.PlaneGeometry(0.05, 0.062),
    crestMat
  );
  hoodCrest.position.set(-2.02, 0.548, 0);
  hoodCrest.rotation.y = -Math.PI / 2;
  hoodCrest.rotation.z = -1.28;
  carGroup.add(hoodCrest);

  // Iconic Oval 992.2 HD-Matrix 4-Point LED Headlights (`outbuildings.garage.porsche992TurboS.headlight`)
  // Built with `createConformalEllipticalHeadlightPatch` directly on the front fender pontoon (`x = -1.88m, v = 0.49`)
  // so they conform 100% flush to the 3D fender surface and NEVER stick out!
  for (const sideZ of [-1, 1] as const) {
    const hlGroup = new THREE.Group();
    hlGroup.name = 'outbuildings.garage.porsche992TurboS.headlight';
    carGroup.add(hlGroup);

    // 1. Dark gunmetal conformal elliptical housing bezel
    const bezelGeo = createConformalEllipticalHeadlightPatch(-1.88, 0.49, 0.185, 0.095, 0.0025, sideZ);
    const bezelMesh = new THREE.Mesh(bezelGeo, glossBlackTrimMat);
    bezelMesh.name = 'outbuildings.garage.porsche992TurboS.headlight';
    hlGroup.add(bezelMesh);

    // 2. Inner Turbonite reflector bowl patch
    const innerGeo = createConformalEllipticalHeadlightPatch(-1.88, 0.49, 0.155, 0.078, 0.004, sideZ);
    hlGroup.add(new THREE.Mesh(innerGeo, turboniteMat));

    // 3. 4 Signature Porsche 4-Point Horizontal LED DRL Light Blades positioned on the exact pontoon surface
    const halfPtsMid = sampleMonocoqueHalfProfile(-1.88, 64);
    const basePt = halfPtsMid[Math.round(0.49 * 64)]!;
    const baseZ = sideZ * basePt[1];
    const baseX = -1.88 + getPlanWrapShiftX(-1.88, baseZ);
    const baseY = basePt[0];

    for (const [dx, dy, dz] of [
      [-0.045, -0.016, -0.036],
      [-0.045, -0.012, 0.036],
      [0.048, 0.022, -0.034],
      [0.048, 0.026, 0.034],
    ] as const) {
      const drlBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.044, 0.01, 0.014),
        ledDrlMat
      );
      drlBar.position.set(baseX + dx, baseY + dy + 0.008, baseZ + sideZ * 0.008 + dz * sideZ);
      drlBar.rotation.z = 0.42;
      drlBar.rotation.y = -sideZ * 0.18;
      hlGroup.add(drlBar);
    }

    // 4. Flush conformal clear polycarbonate headlight lens cover
    const lensGeo = createConformalEllipticalHeadlightPatch(-1.88, 0.49, 0.175, 0.088, 0.0065, sideZ);
    const lensMesh = new THREE.Mesh(lensGeo, clearLensMat);
    hlGroup.add(lensMesh);
  }

  // ---------------------------------------------------------------------------
  // 5. Sculpted Side Mirrors, Flush Door Handles & 992.2 Turbo S Rear Quarter Side Intakes
  // ---------------------------------------------------------------------------
  for (const sideZ of [-1, 1] as const) {
    // Aerodynamic door mirror (`x = -0.48m, y = 0.86m, z = ±0.86m`)
    const mirrorGroup = new THREE.Group();
    mirrorGroup.position.set(-0.48, 0.855, sideZ * 0.855);
    carGroup.add(mirrorGroup);

    const mirrorStalk = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.042, 0.07),
      satinBlackAeroMat
    );
    mirrorStalk.position.set(0, 0.014, sideZ * 0.028);
    mirrorStalk.rotation.x = sideZ * 0.36;
    mirrorGroup.add(mirrorStalk);

    const mirrorCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.056, 18, 14),
      oceanBlueBodyMat
    );
    mirrorCap.scale.set(1.42, 0.68, 1.12);
    mirrorCap.position.set(0.02, 0.036, sideZ * 0.072);
    mirrorGroup.add(mirrorCap);

    // Flush pop-out door handle (`x = +0.14m, y = 0.78m, z = ±0.868m`)
    const doorHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.145, 0.022, 0.014),
      oceanBlueBodyMat
    );
    doorHandle.position.set(0.14, 0.785, sideZ * 0.868);
    carGroup.add(doorHandle);

    // 992.2 Turbo S Side Intercooler Air Intake Scoop (`outbuildings.garage.porsche992TurboS.sideIntake`)
    // Set flush into the leading flare of the widebody rear haunches (`x = +0.72m, y = 0.66m, z = ±0.905m`)
    const sideIntakeGroup = new THREE.Group();
    sideIntakeGroup.name = 'outbuildings.garage.porsche992TurboS.sideIntake';
    sideIntakeGroup.position.set(0.72, 0.665, sideZ * 0.905);
    sideIntakeGroup.rotation.y = sideZ * 0.19;
    carGroup.add(sideIntakeGroup);

    const intakePocket = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.155, 0.042),
      glossBlackTrimMat
    );
    intakePocket.name = 'outbuildings.garage.porsche992TurboS.sideIntake';
    sideIntakeGroup.add(intakePocket);

    const intakeSplitterVane = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.014, 0.05),
      oceanBlueBodyMat
    );
    intakeSplitterVane.position.set(0.01, 0, sideZ * 0.006);
    sideIntakeGroup.add(intakeSplitterVane);
  }

  // ---------------------------------------------------------------------------
  // 6. Conformal 992.2 Rear Engine Decklid Grille, Sculpted Active Turbo S Rear Wing
  //    with Side Winglets, Wrap-Around Recessed Taillight Visor & Conformal Rear Diffuser
  // ---------------------------------------------------------------------------
  // A. Conformal Slatted Rear Engine Decklid Grille (`outbuildings.garage.porsche992TurboS.rearDecklidGrille`, `x = 1.54..1.86m`)
  const decklidGrilleGroup = new THREE.Group();
  decklidGrilleGroup.name = 'outbuildings.garage.porsche992TurboS.rearDecklidGrille';
  carGroup.add(decklidGrilleGroup);

  const decklidBaseGeo = createConformalBodyPatchGeometry(
    1.54,
    1.86,
    () => 0.0,
    () => 0.255,
    12,
    18,
    0.0028,
    false
  );
  const decklidBaseMesh = new THREE.Mesh(decklidBaseGeo, glossBlackTrimMat);
  decklidBaseMesh.name = 'outbuildings.garage.porsche992TurboS.rearDecklidGrille';
  decklidGrilleGroup.add(decklidBaseMesh);

  // 9 longitudinal vertical intake slats + twin subtle central third-brake-light strips conformal to the decklid slope
  for (let s = -5; s <= 5; s++) {
    if (s === 0) continue;
    const isBrakeStrip = Math.abs(s) === 1;
    const zPos = isBrakeStrip ? s * 0.022 : s * 0.068;
    const yStart = evalSpline(1.56, CENTERLINE_Y_KNOTS) + 0.008;
    const yEnd = evalSpline(1.84, CENTERLINE_Y_KNOTS) + 0.008;
    const slatLen = Math.hypot(1.84 - 1.56, yEnd - yStart);
    const slatPitch = Math.atan2(yEnd - yStart, 1.84 - 1.56);
    const slat = new THREE.Mesh(
      new THREE.BoxGeometry(slatLen, isBrakeStrip ? 0.012 : 0.01, isBrakeStrip ? 0.008 : 0.006),
      isBrakeStrip ? crimsonTaillightMat : turboniteMat
    );
    slat.position.set(1.70, (yStart + yEnd) * 0.5, zPos);
    slat.rotation.z = slatPitch;
    decklidGrilleGroup.add(slat);
  }

  // B. Authentic 992.2 Turbo S Active Rear Spoiler with Upturned Side Winglets (`outbuildings.garage.porsche992TurboS.rearWing`)
  //    Built as a custom 3D swept aerofoil BufferGeometry that conforms to the plan-view curve and transverse camber of the 911 tail!
  const rearWingGroup = new THREE.Group();
  rearWingGroup.name = 'outbuildings.garage.porsche992TurboS.rearWing';
  carGroup.add(rearWingGroup);

  {
    const spanSegs = 36;
    const chordSegs = 12;
    const halfSpanZ = 0.66;
    const wingPositions: number[] = [];
    const wingIndices: number[] = [];

    // Airfoil cross-section `(uChord = 0..1` around upper and lower surfaces)
    for (let iz = 0; iz <= spanSegs; iz++) {
      const tz = (iz / spanSegs) * 2 - 1; // -1 .. +1 across width
      const z = tz * halfSpanZ;
      const absTz = Math.abs(tz);

      // Plan-view sweep & chord taper
      const chord = lerp(0.22, 0.165, absTz * absTz);
      const xLead = 1.86 + getPlanWrapShiftX(2.02, z) + absTz * absTz * 0.04;
      // Height follows the rear decklid camber (`0.848m` center, curving down at outer tips and kicking up at the outer 8% winglets!)
      const wingletKick = smoothstep(0.86, 1.0, absTz) * 0.026;
      const yBase = 0.848 - absTz * absTz * 0.028 + wingletKick;

      for (let ic = 0; ic <= chordSegs; ic++) {
        const theta = (ic / chordSegs) * Math.PI * 2;
        const cFrac = 0.5 - 0.5 * Math.cos(theta); // 0 at leading edge, 1 at trailing edge
        const isUpper = theta <= Math.PI;
        const thickness = 0.022 * Math.sin(Math.pow(cFrac, 0.65) * Math.PI);
        const camberPitch = -cFrac * 0.012 + Math.sin(cFrac * Math.PI) * 0.008;

        const px = xLead + cFrac * chord;
        const py = yBase + camberPitch + (isUpper ? thickness * 0.65 : -thickness * 0.35);
        wingPositions.push(px, py, z);
      }
    }

    const cStride = chordSegs + 1;
    for (let iz = 0; iz < spanSegs; iz++) {
      for (let ic = 0; ic < chordSegs; ic++) {
        const a = iz * cStride + ic;
        const b = (iz + 1) * cStride + ic;
        const c = (iz + 1) * cStride + ic + 1;
        const d = iz * cStride + ic + 1;
        wingIndices.push(a, c, b, a, d, c);
      }
    }

    const wingGeo = new THREE.BufferGeometry();
    wingGeo.setAttribute('position', new THREE.Float32BufferAttribute(wingPositions, 3));
    wingGeo.setIndex(wingIndices);
    wingGeo.computeVertexNormals();

    const wingBladeMesh = new THREE.Mesh(wingGeo, oceanBlueBodyMat);
    wingBladeMesh.name = 'outbuildings.garage.porsche992TurboS.rearWing';
    wingBladeMesh.castShadow = true;
    wingBladeMesh.receiveShadow = true;
    rearWingGroup.add(wingBladeMesh);

    // Short twin inboard hydraulic rams (`z = ±0.34m`) connecting the active wing to the decklid
    for (const sideZ of [-1, 1] as const) {
      const ram = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.018, 0.048, 12),
        satinBlackAeroMat
      );
      ram.position.set(1.95, 0.818, sideZ * 0.34);
      rearWingGroup.add(ram);
    }
  }

  // C. Full-Width Wrap-Around Recessed 992.2 LED Taillight Visor & Lightbar (`outbuildings.garage.porsche992TurboS.taillightBar`)
  //    Wraps around the rear quarter panels (`z = ±0.79m, x = 1.98m`) to the center tail (`x = 2.155m, y = 0.722m`)!
  const taillightGroup = new THREE.Group();
  taillightGroup.name = 'outbuildings.garage.porsche992TurboS.taillightBar';
  carGroup.add(taillightGroup);

  const tailCurvePts: THREE.Vector3[] = [];
  for (let i = 0; i <= 32; i++) {
    const u = (i / 32) * 2 - 1;
    const z = u * 0.79;
    const x = 2.155 + getPlanWrapShiftX(2.15, z) - Math.pow(Math.abs(u), 2.2) * 0.045;
    const y = 0.722 - u * u * 0.012;
    tailCurvePts.push(new THREE.Vector3(x, y, z));
  }
  const tailCurve = new THREE.CatmullRomCurve3(tailCurvePts);

  // Dark recessed visor channel surround
  const tailVisorSlot = new THREE.Mesh(
    new THREE.TubeGeometry(tailCurve, 36, 0.028, 12, false),
    glossBlackTrimMat
  );
  tailVisorSlot.scale.set(1.0, 0.78, 1.0);
  taillightGroup.add(tailVisorSlot);

  // Continuous glowing crimson-red 3D LED light strip
  const tailLedBlade = new THREE.Mesh(
    new THREE.TubeGeometry(tailCurve, 40, 0.0095, 10, false),
    crimsonTaillightMat
  );
  tailLedBlade.name = 'outbuildings.garage.porsche992TurboS.taillightBar';
  tailLedBlade.position.set(0.016, 0.004, 0);
  taillightGroup.add(tailLedBlade);

  // Signature 992.2 outer 4-point LED rear brake light segments at left and right corners (`z = ±0.62..0.75m`)
  for (const sideZ of [-1, 1] as const) {
    for (const zOff of [0.63, 0.71] as const) {
      const bz = sideZ * zOff;
      const uNorm = bz / 0.79;
      const bx = 2.155 + getPlanWrapShiftX(2.15, bz) - Math.pow(Math.abs(uNorm), 2.2) * 0.045 + 0.018;
      const by = 0.722 - uNorm * uNorm * 0.012 - 0.012;
      const brakeSeg = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.008, 0.048),
        crimsonTaillightMat
      );
      brakeSeg.position.set(bx, by, bz);
      brakeSeg.rotation.y = sideZ * 0.34;
      taillightGroup.add(brakeSeg);
    }
  }

  const tailSmokedLens = new THREE.Mesh(
    new THREE.TubeGeometry(tailCurve, 36, 0.021, 12, false),
    smokedRedLensMat
  );
  tailSmokedLens.scale.set(1.0, 0.75, 1.0);
  tailSmokedLens.position.set(0.01, 0, 0);
  taillightGroup.add(tailSmokedLens);

  // D. 992.2 Turbo S Outer Rear Bumper Intercooler Air-Outlet Vents (`z = ±0.71m, y = 0.42m`)
  for (const sideZ of [-1, 1] as const) {
    const vz = sideZ * 0.705;
    const vx = 2.215 + getPlanWrapShiftX(2.22, vz);
    const outletGroup = new THREE.Group();
    outletGroup.position.set(vx, 0.43, vz);
    outletGroup.rotation.y = sideZ * 0.42;
    carGroup.add(outletGroup);

    const outletRecess = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.135, 0.095),
      glossBlackTrimMat
    );
    outletGroup.add(outletRecess);

    for (const vaneY of [-0.035, 0.0, 0.035] as const) {
      const vane = new THREE.Mesh(
        new THREE.BoxGeometry(0.038, 0.008, 0.088),
        satinBlackAeroMat
      );
      vane.position.set(0.003, vaneY, 0);
      outletGroup.add(vane);
    }
  }

  // E. Conformal Lower Rear Valance / Venturi Diffuser, Recessed UK Number Plate & Quad/Oval Titanium Exhaust (`outbuildings.garage.porsche992TurboS.exhaust`)
  const exhaustGroup = new THREE.Group();
  exhaustGroup.name = 'outbuildings.garage.porsche992TurboS.exhaust';
  carGroup.add(exhaustGroup);

  // Build the satin-black lower rear bumper diffuser insert as a conformal curved surface sheet (`y = 0.195..0.415m, z = -0.64..+0.64m`)
  {
    const dCols = 28;
    const dRows = 8;
    const dPos: number[] = [];
    const dIdx: number[] = [];
    for (let r = 0; r <= dRows; r++) {
      const ty = r / dRows; // 0 at bottom (0.195m), 1 at top (0.415m)
      const py = lerp(0.195, 0.415, ty);
      const baseX = lerp(2.195, 2.242, Math.sin(ty * Math.PI * 0.65));
      // Taper width slightly toward top of valance trapezoid
      const halfW = lerp(0.65, 0.58, ty);
      for (let c = 0; c <= dCols; c++) {
        const tz = (c / dCols) * 2 - 1;
        const pz = tz * halfW;
        const px = baseX + getPlanWrapShiftX(2.22, pz) + 0.004;
        dPos.push(px, py, pz);
      }
    }
    const dStride = dCols + 1;
    for (let r = 0; r < dRows; r++) {
      for (let c = 0; c < dCols; c++) {
        const a = r * dStride + c;
        const b = (r + 1) * dStride + c;
        const d = (r + 1) * dStride + c + 1;
        const e = r * dStride + c + 1;
        dIdx.push(a, d, b, a, e, d);
      }
    }
    const valanceGeo = new THREE.BufferGeometry();
    valanceGeo.setAttribute('position', new THREE.Float32BufferAttribute(dPos, 3));
    valanceGeo.setIndex(dIdx);
    valanceGeo.computeVertexNormals();
    const valanceMesh = new THREE.Mesh(valanceGeo, satinBlackAeroMat);
    exhaustGroup.add(valanceMesh);
  }

  // Rear UK Number Plate (`992 TBS` on yellow acrylic plate set cleanly into the central rear bumper recess at `y = 0.35m`)
  const rearPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.086, 0.39),
    new THREE.MeshStandardMaterial({
      map: createUkNumberPlateTexture(true),
      roughness: 0.24,
    })
  );
  rearPlate.position.set(2.246, 0.35, 0);
  carGroup.add(rearPlate);

  // 4 Vertical aerodynamic diffuser strakes tucked cleanly under the center of the rear valance
  for (const sz of [-0.26, -0.09, 0.09, 0.26] as const) {
    const sx = 2.205 + getPlanWrapShiftX(2.22, sz);
    const strake = new THREE.Mesh(
      new THREE.BoxGeometry(0.085, 0.095, 0.012),
      satinBlackAeroMat
    );
    strake.position.set(sx, 0.225, sz);
    exhaustGroup.add(strake);
  }

  // Twin Large Oval Porsche Turbo S Titanium Sport Exhaust Tailpipes (`z = ±0.48m, y = 0.255m`)
  for (const sideZ of [-1, 1] as const) {
    const ez = sideZ * 0.48;
    const ex = 2.212 + getPlanWrapShiftX(2.22, ez);
    const tailpipeOuter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.054, 0.09, 24, 1, true),
      titaniumExhaustMat
    );
    tailpipeOuter.name = 'outbuildings.garage.porsche992TurboS.exhaust';
    tailpipeOuter.rotation.z = Math.PI / 2;
    tailpipeOuter.rotation.y = sideZ * 0.18;
    tailpipeOuter.scale.set(0.74, 1.0, 1.38);
    tailpipeOuter.position.set(ex, 0.255, ez);
    exhaustGroup.add(tailpipeOuter);

    const tailpipeCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.046, 0.046, 0.075, 20),
      glossBlackTrimMat
    );
    tailpipeCore.rotation.z = Math.PI / 2;
    tailpipeCore.rotation.y = sideZ * 0.18;
    tailpipeCore.scale.set(0.72, 1.0, 1.34);
    tailpipeCore.position.set(ex - 0.006, 0.255, ez);
    exhaustGroup.add(tailpipeCore);
  }

  // ---------------------------------------------------------------------------
  // 7. Staggered 20"/21" Turbo S Exclusive Design Center-Lock Wheels & PCCB Brakes
  // ---------------------------------------------------------------------------
  const wheelMaterials = {
    tireRubberMat,
    diamondCutAlloyMat,
    turboniteBarrelMat: satinBlackAeroMat,
    pccbRotorMat,
    pccbYellowCaliperMat,
    centerLockMat: turboniteMat,
    crestMat,
  };

  // Front Left & Right (`255/35 ZR20`, `tireR = 0.338m, rimR = 0.258m, width = 0.265m` at `x = -1.25m, z = ±0.785m`)
  buildPorscheTurboSWheelCorner(carGroup, -1.25, 0.338, -0.785, 0.338, 0.258, 0.265, true, true, wheelMaterials);
  buildPorscheTurboSWheelCorner(carGroup, -1.25, 0.338, 0.785, 0.338, 0.258, 0.265, false, true, wheelMaterials);

  // Rear Left & Right (`315/30 ZR21`, `tireR = 0.356m, rimR = 0.274m, width = 0.325m` at `x = +1.20m, z = ±0.805m`)
  buildPorscheTurboSWheelCorner(carGroup, 1.20, 0.356, -0.805, 0.356, 0.274, 0.325, true, false, wheelMaterials);
  buildPorscheTurboSWheelCorner(carGroup, 1.20, 0.356, 0.805, 0.356, 0.274, 0.325, false, false, wheelMaterials);
}
