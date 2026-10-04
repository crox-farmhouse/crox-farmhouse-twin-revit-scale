import * as THREE from 'three';

/**
 * Generates a 512x512 procedural Ocean Blue Metallic (`#0d2d4a` -> `#1e5688`)
 * automotive basecoat + micro-pearl flake texture.
 */
function createOceanBlueMetallicTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#0a2540');
  grad.addColorStop(0.35, '#123a63');
  grad.addColorStop(0.55, '#1a4c7e');
  grad.addColorStop(0.78, '#11355a');
  grad.addColorStop(1, '#092038');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const img = ctx.getImageData(0, 0, size, size);
  const data = img.data;
  for (let i = 0; i < size * size; i++) {
    const idx = i * 4;
    const h1 = Math.sin(i * 12.9898 + 4.1) * 43758.5453;
    const f1 = h1 - Math.floor(h1);
    const sparkle = (f1 - 0.5) * 7;
    data[idx] = Math.max(6, Math.min(80, Math.round(data[idx]! + sparkle * 0.7)));
    data[idx + 1] = Math.max(24, Math.min(135, Math.round(data[idx + 1]! + sparkle * 1.0)));
    data[idx + 2] = Math.max(48, Math.min(195, Math.round(data[idx + 2]! + sparkle * 1.3)));
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

  ctx.fillStyle = '#383c42';
  ctx.fillRect(0, 0, size, size);

  for (let r = 80; r < 245; r += 2) {
    ctx.strokeStyle = r % 4 === 0 ? 'rgba(95, 102, 110, 0.45)' : 'rgba(38, 42, 46, 0.45)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.fillStyle = '#141619';
  const numSpiralArms = 30;
  for (let a = 0; a < numSpiralArms; a++) {
    const baseAngle = (a / numSpiralArms) * Math.PI * 2;
    for (let h = 0; h < 5; h++) {
      const rad = 112 + h * 28;
      const ang = baseAngle + h * 0.048;
      const hx = cx + Math.cos(ang) * rad;
      const hy = cy + Math.sin(ang) * rad;
      ctx.beginPath();
      ctx.arc(hx, hy, 3.6, 0, Math.PI * 2);
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
  ctx.fillStyle = '#c8aa6e';
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

  ctx.fillStyle = '#8b1e22';
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
  grad.addColorStop(0, 'rgba(6, 8, 12, 0.82)');
  grad.addColorStop(0.58, 'rgba(8, 11, 16, 0.62)');
  grad.addColorStop(0.84, 'rgba(10, 14, 20, 0.24)');
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
 * Evaluates a piecewise Catmull-Rom / Hermite spline through sorted `(x, y)` control knots.
 */
function evalSpline(x: number, knots: readonly (readonly [number, number])[]): number {
  if (x <= knots[0]![0]) return knots[0]![1];
  const last = knots[knots.length - 1]!;
  if (x >= last[0]) return last[1];

  for (let i = 0; i < knots.length - 1; i++) {
    const k0 = knots[i]!;
    const k1 = knots[i + 1]!;
    if (x >= k0[0] && x <= k1[0]) {
      const u = (x - k0[0]) / Math.max(1e-6, k1[0] - k0[0]);
      const km1 = knots[Math.max(0, i - 1)]!;
      const kp2 = knots[Math.min(knots.length - 1, i + 2)]!;
      const m0 = ((k1[1] - km1[1]) / Math.max(1e-5, k1[0] - km1[0])) * (k1[0] - k0[0]);
      const m1 = ((kp2[1] - k0[1]) / Math.max(1e-5, kp2[0] - k0[0])) * (k1[0] - k0[0]);
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

// ============================================================================
// AUTHENTIC PORSCHE 911 (992.2) TURBO S LONGITUDINAL FEATURE CURVES
// (`x = -2.265m` front splitter tip to `x = +2.255m` rear bumper tip, `L = 4.52m`)
// ============================================================================

/**
 * 1. Centerline profile `yCenter(x)`:
 *    - Low front splitter & shark-sloped front bumper (`x = -2.265..-1.95m`)
 *    - Sunken central Porsche 911 frunk hood (`x = -1.95..-0.82m`, rising from `0.48m` to `0.75m`)
 *    - Steeply raked windshield (`x = -0.82..-0.18m`, rising from `0.75m` to `1.265m`)
 *    - Iconic parabolic 911 flyline roof crown (`y = 1.300m` at `x = 0.02m`)
 *    - Continuous fastback rear screen & slatted engine decklid (`x = 0.25..1.90m`, sloping to `0.855m`)
 *    - Integrated rear ducktail lip (`y = 0.87m` at `x = 2.08m`) & rear bumper tail (`x = 2.255m`).
 */
const CENTERLINE_Y_KNOTS: readonly (readonly [number, number])[] = [
  [-2.265, 0.235],
  [-2.22, 0.34],
  [-2.10, 0.445],
  [-1.92, 0.525],
  [-1.65, 0.605],
  [-1.30, 0.685],
  [-0.95, 0.738],
  [-0.82, 0.755], // Windshield cowl base
  [-0.60, 0.965],
  [-0.36, 1.158],
  [-0.16, 1.268], // Windshield top header
  [0.04, 1.300], // Roof peak
  [0.32, 1.272],
  [0.65, 1.188],
  [1.02, 1.062],
  [1.38, 0.938],
  [1.56, 0.888], // Base of rear glass / start of decklid grille
  [1.86, 0.852],
  [2.08, 0.868], // Integrated ducktail lip
  [2.19, 0.785], // Recessed taillight bar channel
  [2.255, 0.560], // Rear bumper nose
];

/**
 * 2. Fender / Shoulder Beltline Height `yShoulder(x)`:
 *    - Notice how in a real Porsche 911, over the front fenders (`x = -2.00..-0.85m`),
 *      the round front fender pontoons (`yShoulder`) rise **5.5cm–6.5cm HIGHER** than the sunken central frunk hood!
 *    - Along the doors (`x = -0.60..+0.40m`), the beltline stays completely horizontal and taut (`y = 0.775m`) —
 *      NEVER oscillating up and down with the wheel cutout!
 *    - Behind the doors (`x = +0.45..+1.55m`), the shoulder rises gently into the muscular 911 rear haunch (`y = 0.852m`).
 */
const SHOULDER_Y_KNOTS: readonly (readonly [number, number])[] = [
  [-2.265, 0.235],
  [-2.18, 0.375],
  [-2.02, 0.505],
  [-1.82, 0.635], // Oval headlight center (`34°` pontoon slope)
  [-1.55, 0.748],
  [-1.25, 0.792], // Peak of rounded 911 front fender pontoon over front wheel
  [-0.90, 0.782],
  [-0.50, 0.772], // Door beltline (flat & horizontal!)
  [0.00, 0.772],
  [0.42, 0.785],
  [0.82, 0.838], // Rear haunch kick-up
  [1.20, 0.856], // Peak of widebody rear haunch over rear wheel
  [1.62, 0.842],
  [1.98, 0.825],
  [2.18, 0.755],
  [2.255, 0.540],
];

/**
 * 3. Plan-View Outer Body Half-Width `zBodyMax(x)`:
 *    - Rounded front nose cone (`x = -2.265..-1.75m`)
 *    - Wide front fenders (`z = 0.915m` across `x = -1.55..-0.95m`)
 *    - Subtle Coke-bottle door waist pinch (`z = 0.858m` at `x = -0.05m`)
 *    - Dramatic **992.2 Turbo S Widebody Rear Haunches** (`z = 0.955m`, `1.91m` total width across `x = +0.85..+1.55m`!)
 *    - Tapered rear bumper tail (`z = 0.835m` at `x = +2.16m`).
 */
const BODY_WIDTH_Z_KNOTS: readonly (readonly [number, number])[] = [
  [-2.265, 0.36],
  [-2.22, 0.58],
  [-2.10, 0.765],
  [-1.90, 0.865],
  [-1.55, 0.912],
  [-1.25, 0.918], // Front wheel arch crown (`1.836m` width)
  [-0.90, 0.895],
  [-0.45, 0.862],
  [-0.05, 0.858], // Taut door waist
  [0.35, 0.878],
  [0.75, 0.942], // Turbo S widebody rear haunch flare
  [1.20, 0.956], // Rear wheel arch crown (`1.912m` widebody width!)
  [1.60, 0.938],
  [1.95, 0.885],
  [2.16, 0.820],
  [2.255, 0.640],
];

/**
 * 4. Plan-View Teardrop Cabin Greenhouse / Hood-Edge Half-Width `zCrown(x)`:
 *    - Ahead of windshield (`x < -0.82m`), this traces the inner edge of the raised front fender pontoon (`z = 0.48m`),
 *    - Along the cabin (`x = -0.82..+1.55m`), this traces the **teardrop roof rail & rear glass width**:
 *      `z = 0.63m` at A-pillar base -> `0.535m` at roof peak -> tapering to `0.41m` at the rear decklid!
 *      This narrow teardrop greenhouse sitting inside the `0.956m` wide rear haunches creates the signature
 *      broad horizontal Porsche 911 rear shoulder shelf!
 */
const CROWN_WIDTH_Z_KNOTS: readonly (readonly [number, number])[] = [
  [-2.265, 0.18],
  [-2.10, 0.36],
  [-1.80, 0.45],
  [-1.30, 0.52],
  [-0.82, 0.625], // Base of A-pillar
  [-0.45, 0.575],
  [-0.15, 0.542], // Top of windshield
  [0.15, 0.532], // Roof crown width
  [0.55, 0.505],
  [0.98, 0.465], // Pointed tip of 911 side spear window
  [1.45, 0.425], // Rear glass base
  [1.88, 0.415], // Engine decklid grille width
  [2.12, 0.480],
  [2.255, 0.360],
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
 * at longitudinal station `x` (`-2.265m .. +2.255m`).
 *
 * Notice how the cross-section is divided into:
 * - `j = 0 .. 14`: Centerline (`z = 0`) to Crown/Pontoon Crease (`z = zCrown`),
 * - `j = 14 .. 26`: Greenhouse Tumblehome / Front Pontoon Crown (`z = zCrown` to Shoulder `z = zShoulder`),
 * - `j = 26 .. 40`: Outer Fender & Door Flank (`yShoulder` down to `yArchCut`, keeping upper flank lines horizontal!),
 * - `j = 40 .. 44`: Lower Rocker Tuck-Under (`z` tucking inward at the bottom sill).
 */
function sampleMonocoqueHalfProfile(x: number, nv: number): [number, number][] {
  const yCenter = evalSpline(x, CENTERLINE_Y_KNOTS);
  const yShoulder = evalSpline(x, SHOULDER_Y_KNOTS);
  const zMax = evalSpline(x, BODY_WIDTH_Z_KNOTS);
  const zCrown = Math.min(zMax * 0.82, evalSpline(x, CROWN_WIDTH_Z_KNOTS));

  // Base sill height (low and level between the wheels, rising slightly at nose splitter & rear diffuser)
  const frontApproach = smoothstep(-1.60, -2.265, x);
  const rearDeparture = smoothstep(1.58, 2.255, x);
  const yBaseSill = 0.125 + frontApproach * 0.045 + rearDeparture * 0.085;
  const yArchCut = sampleWheelArchCutoutY(x, yBaseSill);

  // Determine how much of the station is in the front hood (`x < -0.82`), cabin (`-0.82..1.52`), or rear deck (`x > 1.52`)
  const hoodWeight = 1 - smoothstep(-0.92, -0.72, x);
  const cabinWeight = smoothstep(-0.84, -0.58, x) * (1 - smoothstep(1.35, 1.68, x));

  // Side intercooler intake recess on the Turbo S rear fender leading flank (`x = 0.56..0.90m, y = 0.52..0.72m`)
  const intakeLongitudinal =
    smoothstep(0.54, 0.64, x) * (1 - smoothstep(0.78, 0.92, x));

  const pts: [number, number][] = [];
  for (let j = 0; j <= nv; j++) {
    const v = j / nv;
    let y = 0;
    let z = 0;

    if (v <= 0.32) {
      // Zone 1 (`v = 0 .. 0.32`): Centerline (`z = 0`) to Roof Rail / Hood Crease (`z = zCrown`)
      const u = v / 0.32;
      z = u * zCrown;
      // Gentle transverse roof crown camber in cabin, flat sunken hood in front
      const camber = cabinWeight * 0.022 * (1 - u * u) - hoodWeight * 0.008 * Math.sin(u * Math.PI);
      y = yCenter + camber;
    } else if (v <= 0.58) {
      // Zone 2 (`v = 0.32 .. 0.58`):
      // - Ahead of windshield (`hoodWeight > 0.5`): rises UP from the sunken hood edge into the rounded 911 front fender pontoon!
      // - Along cabin (`cabinWeight > 0.5`): slopes DOWN down the side glass / pillars onto the wide horizontal 911 shoulder shelf!
      const u = (v - 0.32) / 0.26;
      // In the cabin/rear haunch, create the classic Porsche 911 concave transition from sloped glass to wide horizontal haunch shelf
      const shelfBlend = smoothstep(0.0, 1.0, u);
      const glassSlopeU = Math.min(1, u * 1.45);
      const yCabinTransition = lerp(
        yCenter,
        yShoulder,
        0.72 * glassSlopeU + 0.28 * shelfBlend * shelfBlend
      );
      // Over the front fenders, create a plump parabolic pontoon arch peaking at `u = 0.62`
      const pontoonArch = hoodWeight * 0.026 * Math.sin(u * Math.PI);
      y = lerp(yCenter, yShoulder, shelfBlend) * (1 - cabinWeight) + yCabinTransition * cabinWeight + pontoonArch;
      z = lerp(zCrown, zMax * 0.94, Math.pow(u, 0.85));
    } else if (v <= 0.90) {
      // Zone 3 (`v = 0.58 .. 0.90`): Upper & Lower Body Side Flank (`yShoulder` down to `yArchCut`)
      // CRITICAL: To prevent Hot-Wheels rollercoaster distortion over the wheels, compute the undisturbed
      // horizontal body flank height `yFlankNominal` between `yShoulder` and `yBaseSill`, and then smoothly
      // clamp the lower edge up to `yArchCut` ONLY where the circular wheel arch cuts into the lower fender!
      const u = (v - 0.58) / 0.32;
      const yFlankNominal = lerp(yShoulder, yBaseSill + 0.035, u);
      const yClampedMin = yArchCut + 0.025 + (1 - u) * 0.045;
      y = Math.max(yFlankNominal, lerp(yShoulder, yClampedMin, u));

      // Convex barrel curvature of the Porsche 911 side fender & door flank
      const flankBelly = Math.sin(u * Math.PI * 0.82);
      z = lerp(zMax * 0.94, zMax * 0.96, u) + flankBelly * 0.042;

      // Carve the 992.2 Turbo S side intercooler intake pocket (`u = 0.25..0.68`)
      if (intakeLongitudinal > 0.01) {
        const intakeV = smoothstep(0.20, 0.35, u) * (1 - smoothstep(0.58, 0.74, u));
        z -= intakeLongitudinal * intakeV * 0.048;
      }
    } else {
      // Zone 4 (`v = 0.90 .. 1.00`): Wheel-Arch Lip / Rocker Sill Tuck-Under
      const u = (v - 0.90) / 0.10;
      const yTop = Math.max(lerp(yShoulder, yBaseSill + 0.035, 1.0), yArchCut + 0.025);
      y = lerp(yTop, yArchCut, u);
      // Over the wheels (`yArchCut > yBaseSill + 0.02`), tuck only `1.8cm` inward to form a crisp fender arch lip;
      // along the doors (`yArchCut === yBaseSill`), tuck `5.5cm` inward for the lower rocker sill.
      const isWheelArch = smoothstep(yBaseSill + 0.01, yBaseSill + 0.12, yArchCut);
      const tuckIn = lerp(0.055, 0.018, isWheelArch);
      z = zMax * 0.96 - u * tuckIn;
    }

    pts.push([y, Math.max(0, z)]);
  }

  return pts;
}

/**
 * Builds the unified, water-tight, smooth-shaded monocoque body shell (`outbuildings.garage.porsche992TurboS.bodyShell`)
 * by lofting `nx` longitudinal stations (`x = -2.265m .. +2.255m`) across `2 * nv + 1` welded cross-section vertices.
 */
function createUnifiedPorsche992BodyGeometry(): THREE.BufferGeometry {
  const nx = 112;
  const nv = 44;
  const xMin = -2.265;
  const xMax = 2.255;
  const rowStride = nv * 2 + 1;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= nx; i++) {
    const t = i / nx;
    // Cosine-clustered sampling near the front nose and rear bumper for smooth compound curvature
    const shapedT = 0.5 - 0.5 * Math.cos(t * Math.PI);
    const x = lerp(xMin, xMax, lerp(t, shapedT, 0.35));
    const halfPts = sampleMonocoqueHalfProfile(x, nv);

    // Subtle plan-view nose & tail wrap-around curvature: outer fender tips sweep slightly rearward at the nose (`x < -1.95`)
    // and slightly forward at the tail (`x > 2.05`) so the front and rear bumpers curve organically in 3D!
    const noseWrap = smoothstep(-1.85, -2.265, x);
    const tailWrap = smoothstep(1.95, 2.255, x);

    // Left side (`z < 0`, from `j = nv` down to `j = 1`), Centerline (`j = 0`), Right side (`z > 0`, `j = 1 .. nv`)
    for (let k = -nv; k <= nv; k++) {
      const j = Math.abs(k);
      const signZ = k < 0 ? -1 : k > 0 ? 1 : 0;
      const [py, pzAbs] = halfPts[j]!;
      const pz = signZ * pzAbs;

      const zNorm = pzAbs / 0.96;
      const xShift = noseWrap * zNorm * zNorm * 0.14 - tailWrap * zNorm * zNorm * 0.09;
      const vx = x + xShift;

      positions.push(vx, py, pz);
      uvs.push((vx - xMin) / (xMax - xMin), (pz + 0.96) / 1.92);
    }
  }

  for (let i = 0; i < nx; i++) {
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
 * Builds a flush-fitting compound-curved surface patch offset by `normalOffset` from the monocoque body shell
 * over `[xStart..xEnd]` and cross-section parameter `[vStart..vEnd]`.
 */
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

        const noseWrap = smoothstep(-1.85, -2.265, x);
        const tailWrap = smoothstep(1.95, 2.255, x);
        const zNorm = Math.abs(pz) / 0.96;
        const vx = x + noseWrap * zNorm * zNorm * 0.14 - tailWrap * zNorm * zNorm * 0.09;

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
      const py = Math.max(0.125, yAxle + sn * rArch);
      const pxOut = xAxle - c * (rArch + lipWidth);
      const pyOut = Math.max(0.125, yAxle + sn * (rArch + lipWidth));

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
 * Michelin Pilot Sport 4S tire, 420mm/390mm PCCB cross-drilled carbon-ceramic rotor, and Speed Yellow caliper.
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

  // 1. Michelin Pilot Sport 4S Tire Assembly (Tread Cylinder + Rounded Sidewall Shoulders)
  const treadW = tireWidth * 0.78;
  const treadCyl = new THREE.Mesh(
    new THREE.CylinderGeometry(tireRadius, tireRadius, treadW, 36, 1, false),
    materials.tireRubberMat
  );
  treadCyl.rotation.x = Math.PI / 2;
  treadCyl.castShadow = true;
  treadCyl.receiveShadow = true;
  cornerGroup.add(treadCyl);

  const sidewallTubeR = (tireRadius - rimRadius) * 0.52;
  const sidewallMajorR = rimRadius + sidewallTubeR * 0.95;
  for (const side of [-1, 1] as const) {
    const shoulderTorus = new THREE.Mesh(
      new THREE.TorusGeometry(sidewallMajorR, sidewallTubeR, 16, 36),
      materials.tireRubberMat
    );
    shoulderTorus.scale.set(1, 1, 0.58);
    shoulderTorus.position.set(0, 0, side * (treadW * 0.44));
    cornerGroup.add(shoulderTorus);
  }

  // 2. Dark Turbonite Inner Alloy Wheel Barrel & Outer Diamond-Turned Lip Flange
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(rimRadius, rimRadius * 0.96, tireWidth * 0.84, 32, 1, true),
    materials.turboniteBarrelMat
  );
  barrel.rotation.x = Math.PI / 2;
  cornerGroup.add(barrel);

  const outerFaceZ = signZ * (tireWidth * 0.36);
  const rimLipRing = new THREE.Mesh(
    new THREE.TorusGeometry(rimRadius, 0.011, 12, 36),
    materials.diamondCutAlloyMat
  );
  rimLipRing.scale.set(1, 1, 0.65);
  rimLipRing.position.set(0, 0, outerFaceZ);
  cornerGroup.add(rimLipRing);

  // 3. 992.2 Turbo S Exclusive Design 5-Twin-Spoke (10-blade) Forged Wheel Face
  const hubRadius = 0.062;
  const spokeLen = rimRadius - hubRadius - 0.006;
  const spokeMidR = hubRadius + spokeLen * 0.5;
  for (let p = 0; p < 5; p++) {
    const pairAngle = (p / 5) * Math.PI * 2;
    for (const bladeOffset of [-0.14, 0.14] as const) {
      const ang = pairAngle + bladeOffset;
      const spoke = new THREE.Mesh(
        new THREE.BoxGeometry(0.022, spokeLen, 0.018),
        materials.diamondCutAlloyMat
      );
      spoke.position.set(
        Math.cos(ang) * spokeMidR,
        Math.sin(ang) * spokeMidR,
        outerFaceZ - signZ * 0.016
      );
      spoke.rotation.z = ang - Math.PI / 2;
      spoke.rotation.x = signZ * 0.11;
      cornerGroup.add(spoke);
    }
  }

  // 4. Forged Center-Lock Hub & Porsche Crest Cap
  const hubCyl = new THREE.Mesh(
    new THREE.CylinderGeometry(hubRadius, hubRadius * 1.06, 0.045, 24),
    materials.turboniteBarrelMat
  );
  hubCyl.rotation.x = Math.PI / 2;
  hubCyl.position.set(0, 0, outerFaceZ - signZ * 0.028);
  cornerGroup.add(hubCyl);

  const centerLockNut = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.04, 0.024, 12),
    materials.centerLockMat
  );
  centerLockNut.rotation.x = Math.PI / 2;
  centerLockNut.position.set(0, 0, outerFaceZ - signZ * 0.008);
  cornerGroup.add(centerLockNut);

  const crestCap = new THREE.Mesh(
    new THREE.CircleGeometry(0.022, 16),
    materials.crestMat
  );
  crestCap.position.set(0, 0, outerFaceZ + signZ * 0.005);
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
  rotorMesh.position.set(0, 0, outerFaceZ - signZ * 0.068);
  cornerGroup.add(rotorMesh);

  // 10-Piston Front / 4-Piston Rear Porsche Speed Yellow Monobloc Caliper
  const caliperAngle = isFront ? 0.35 : Math.PI - 0.35;
  const caliperR = rotorR - 0.028;
  const caliperGroup = new THREE.Group();
  caliperGroup.name = 'outbuildings.garage.porsche992TurboS.pccbCaliper';
  caliperGroup.position.set(
    Math.cos(caliperAngle) * caliperR,
    Math.sin(caliperAngle) * caliperR,
    outerFaceZ - signZ * 0.065
  );
  caliperGroup.rotation.z = caliperAngle;
  cornerGroup.add(caliperGroup);

  const caliperBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.072, isFront ? 0.195 : 0.155, 0.068),
    materials.pccbYellowCaliperMat
  );
  caliperGroup.add(caliperBody);
}

/**
 * Issue #1 ("Park this straiight. It looks nothing like a 911, looks like a hotwheels car." at `[-13.726, 0.705, 17.787]`):
 * Builds an authentic, showroom-grade 3D model of a **Porsche 911 (992.2) Turbo S Coupé in Ocean Blue Metallic**
 * (`outbuildings.garage.porsche992TurboS`, `userData.zone = 'study'`) parked **100% straight** in the West Garage bay
 * (`u = 7.40m, y = garageFloorTopY, v = 2.86m, rotation.y = -Math.PI / 2`), facing straight North (`-v`) toward the
 * West Garage Double Coach Doors (`u = 6.08..8.72m`).
 */
export function buildPorsche992TurboS(
  groundGroup: THREE.Group,
  garageFloorTopY: number
): void {
  const carGroup = new THREE.Group();
  carGroup.name = 'outbuildings.garage.porsche992TurboS';
  carGroup.userData.zone = 'study';
  // Parked 100% straight in the West Garage bay (`u = 7.40m`), facing straight North (`-v`, `rotation.y = -Math.PI / 2`)
  // toward the Garage West Double Door (`u = 6.08..8.72m, v = 0.28m`)!
  carGroup.position.set(7.4, garageFloorTopY, 2.86);
  carGroup.rotation.y = -Math.PI / 2;
  groundGroup.add(carGroup);

  // ---------------------------------------------------------------------------
  // Materials
  // ---------------------------------------------------------------------------
  const oceanBlueTex = createOceanBlueMetallicTexture();
  const oceanBlueBodyMat = new THREE.MeshStandardMaterial({
    color: 0x164672,
    map: oceanBlueTex,
    roughness: 0.15,
    metalness: 0.76,
    side: THREE.DoubleSide,
  });

  const satinBlackAeroMat = new THREE.MeshStandardMaterial({
    color: 0x181b20,
    roughness: 0.38,
    metalness: 0.35,
    side: THREE.DoubleSide,
  });

  const glossBlackTrimMat = new THREE.MeshStandardMaterial({
    color: 0x0e1014,
    roughness: 0.12,
    metalness: 0.55,
    side: THREE.DoubleSide,
  });

  const turboniteMat = new THREE.MeshStandardMaterial({
    color: 0x4a4e54,
    roughness: 0.26,
    metalness: 0.78,
  });

  const tintedGlassMat = new THREE.MeshStandardMaterial({
    color: 0x0d1520,
    roughness: 0.05,
    metalness: 0.32,
    transparent: true,
    opacity: 0.74,
    side: THREE.DoubleSide,
  });

  const clearLensMat = new THREE.MeshStandardMaterial({
    color: 0xeaf4ff,
    roughness: 0.04,
    metalness: 0.15,
    transparent: true,
    opacity: 0.42,
  });

  const ledDrlMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0xf0f7ff),
    emissiveIntensity: 2.2,
    roughness: 0.1,
  });

  const crimsonTaillightMat = new THREE.MeshStandardMaterial({
    color: 0xff1a22,
    emissive: new THREE.Color(0xff1118),
    emissiveIntensity: 2.1,
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
    color: 0x17191c,
    roughness: 0.76,
    metalness: 0.06,
  });

  const diamondCutAlloyMat = new THREE.MeshStandardMaterial({
    color: 0xdce2ea,
    roughness: 0.16,
    metalness: 0.92,
  });

  const pccbRotorMat = new THREE.MeshStandardMaterial({
    map: createPccbRotorTexture(),
    color: 0xffffff,
    roughness: 0.34,
    metalness: 0.68,
  });

  const pccbYellowCaliperMat = new THREE.MeshStandardMaterial({
    color: 0xf5c400, // Porsche Speed Yellow PCCB
    roughness: 0.22,
    metalness: 0.28,
  });

  const crestMat = new THREE.MeshStandardMaterial({
    map: createPorscheCrestTexture(),
    transparent: true,
    roughness: 0.25,
    metalness: 0.65,
  });

  const titaniumExhaustMat = new THREE.MeshStandardMaterial({
    color: 0x9aa2ad,
    roughness: 0.2,
    metalness: 0.9,
  });

  const slateLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x262a30,
    roughness: 0.62,
    metalness: 0.05,
  });

  const chalkLeatherMat = new THREE.MeshStandardMaterial({
    color: 0xd6d2c8,
    roughness: 0.58,
    metalness: 0.04,
  });

  // ---------------------------------------------------------------------------
  // 0. Soft Ambient Occlusion Contact Shadow Pad + Flat Aerodynamic Undertray
  // ---------------------------------------------------------------------------
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(4.82, 2.18),
    new THREE.MeshBasicMaterial({
      map: createUnderCarShadowTexture(),
      transparent: true,
      depthWrite: false,
    })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.set(0, 0.003, 0);
  carGroup.add(shadowPlane);

  const undertray = new THREE.Mesh(
    new THREE.BoxGeometry(4.28, 0.045, 1.58),
    satinBlackAeroMat
  );
  undertray.position.set(0, 0.135, 0);
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

  // Sculpted Lower Side Rocker Skirts (`x = -0.86m .. +0.80m`) with Turbo S aerodynamic rear kick-up
  for (const sideZ of [-1, 1] as const) {
    const rockerSkirt = new THREE.Mesh(
      new THREE.BoxGeometry(1.66, 0.036, 0.065),
      satinBlackAeroMat
    );
    rockerSkirt.position.set(-0.03, 0.132, sideZ * 0.845);
    carGroup.add(rockerSkirt);
  }

  // ---------------------------------------------------------------------------
  // 2. Flush Compound-Curved Glazing (`outbuildings.garage.porsche992TurboS.glazing`):
  //    - Curved Front Windshield (`x = -0.81m .. -0.15m`)
  //    - Fastback Heated Rear Screen (`x = +0.52m .. +1.52m`)
  //    - Iconic Porsche 911 Parabolic Spear Side Windows (`DLO`, `x = -0.56m .. +0.98m`)
  // ---------------------------------------------------------------------------
  const glazingGroup = new THREE.Group();
  glazingGroup.name = 'outbuildings.garage.porsche992TurboS.glazing';
  carGroup.add(glazingGroup);

  // Front Windshield (flush conformal patch with thin satin-black ceramic frit border)
  const windshieldBorderGeo = createConformalBodyPatchGeometry(
    -0.82,
    -0.14,
    () => 0.0,
    () => 0.305,
    24,
    24,
    0.0025,
    false
  );
  const windshieldBorderMesh = new THREE.Mesh(windshieldBorderGeo, glossBlackTrimMat);
  glazingGroup.add(windshieldBorderMesh);

  const windshieldGlassGeo = createConformalBodyPatchGeometry(
    -0.78,
    -0.18,
    () => 0.0,
    () => 0.285,
    24,
    24,
    0.0042,
    false
  );
  const windshieldGlassMesh = new THREE.Mesh(windshieldGlassGeo, tintedGlassMat);
  windshieldGlassMesh.name = 'outbuildings.garage.porsche992TurboS.glazing';
  glazingGroup.add(windshieldGlassMesh);

  // Fastback Rear Window (`x = +0.52m .. +1.50m`)
  const rearGlassBorderGeo = createConformalBodyPatchGeometry(
    0.50,
    1.52,
    () => 0.0,
    () => 0.295,
    24,
    22,
    0.0025,
    false
  );
  const rearGlassBorderMesh = new THREE.Mesh(rearGlassBorderGeo, glossBlackTrimMat);
  glazingGroup.add(rearGlassBorderMesh);

  const rearGlassGeo = createConformalBodyPatchGeometry(
    0.54,
    1.48,
    () => 0.0,
    () => 0.275,
    24,
    22,
    0.0042,
    false
  );
  const rearGlassMesh = new THREE.Mesh(rearGlassGeo, tintedGlassMat);
  rearGlassMesh.name = 'outbuildings.garage.porsche992TurboS.glazing';
  glazingGroup.add(rearGlassMesh);

  // Iconic Porsche 911 Teardrop Spear Side Windows (`DLO`, `x = -0.58m .. +0.98m`):
  // Notice how the upper edge follows the parabolic roof arch (`vTop(x)`) and the lower edge stays along the horizontal
  // door beltline (`vBot(x)`) before curving up to meet `vTop(x)` in a crisp point at `x = +0.98m`!
  const dloVTop = (x: number): number => {
    const u = Math.max(0, Math.min(1, (x - -0.58) / (0.98 - -0.58)));
    return 0.34 + 0.17 * Math.pow(u, 1.35);
  };
  const dloVBot = (x: number): number => {
    const u = Math.max(0, Math.min(1, (x - -0.58) / (0.98 - -0.58)));
    const rearPinch = smoothstep(0.62, 1.0, u);
    return lerp(0.545, 0.51, rearPinch);
  };

  const sideWindowTrimGeo = createConformalBodyPatchGeometry(
    -0.59,
    0.99,
    (x) => Math.max(0.32, dloVTop(x) - 0.016),
    (x) => Math.min(0.565, dloVBot(x) + 0.014),
    36,
    14,
    0.0025,
    true
  );
  const sideWindowTrimMesh = new THREE.Mesh(sideWindowTrimGeo, glossBlackTrimMat);
  glazingGroup.add(sideWindowTrimMesh);

  const sideWindowGlassGeo = createConformalBodyPatchGeometry(
    -0.56,
    0.96,
    dloVTop,
    dloVBot,
    34,
    14,
    0.0042,
    true
  );
  const sideWindowGlassMesh = new THREE.Mesh(sideWindowGlassGeo, tintedGlassMat);
  sideWindowGlassMesh.name = 'outbuildings.garage.porsche992TurboS.glazing';
  glazingGroup.add(sideWindowGlassMesh);

  // B-Pillar internal vertical glass division strip at `x = +0.28m`
  const bPillarGeo = createConformalBodyPatchGeometry(
    0.255,
    0.295,
    dloVTop,
    dloVBot,
    4,
    10,
    0.005,
    true
  );
  glazingGroup.add(new THREE.Mesh(bPillarGeo, glossBlackTrimMat));

  // ---------------------------------------------------------------------------
  // 3. Detailed 992.2 Interior Cabin (`outbuildings.garage.porsche992TurboS.interior`)
  // ---------------------------------------------------------------------------
  const interiorGroup = new THREE.Group();
  interiorGroup.name = 'outbuildings.garage.porsche992TurboS.interior';
  carGroup.add(interiorGroup);

  // Dashboard cowling & central Sport Chrono stopwatch pod (`x = -0.52m, y = 0.82m`)
  const dashCowling = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.16, 1.12),
    slateLeatherMat
  );
  dashCowling.position.set(-0.52, 0.74, 0);
  interiorGroup.add(dashCowling);

  const chronoPod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.042, 0.055, 16),
    slateLeatherMat
  );
  chronoPod.rotation.z = Math.PI / 2;
  chronoPod.position.set(-0.48, 0.83, 0);
  interiorGroup.add(chronoPod);

  // RHD GT Sport Steering Wheel (`z = +0.34m` for UK Crox Farmhouse)
  const steeringWheel = new THREE.Mesh(
    new THREE.TorusGeometry(0.155, 0.018, 12, 24),
    slateLeatherMat
  );
  steeringWheel.rotation.y = Math.PI / 2;
  steeringWheel.rotation.z = -0.32;
  steeringWheel.position.set(-0.28, 0.76, 0.34);
  interiorGroup.add(steeringWheel);

  // Two 18-Way Adaptive Sport Seats Plus in two-tone Slate Grey & Chalk leather
  for (const seatZ of [-0.34, 0.34] as const) {
    const seatBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.11, 0.44),
      slateLeatherMat
    );
    seatBase.position.set(0.02, 0.42, seatZ);
    interiorGroup.add(seatBase);

    const seatBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.56, 0.42),
      slateLeatherMat
    );
    seatBack.position.set(0.24, 0.72, seatZ);
    seatBack.rotation.z = -0.24;
    interiorGroup.add(seatBack);

    const seatCenterInsert = new THREE.Mesh(
      new THREE.BoxGeometry(0.115, 0.42, 0.26),
      chalkLeatherMat
    );
    seatCenterInsert.position.set(0.232, 0.69, seatZ);
    seatCenterInsert.rotation.z = -0.24;
    interiorGroup.add(seatCenterInsert);
  }

  // ---------------------------------------------------------------------------
  // 4. 992.2 Facelift Front Fascia, Active Vertical Cooling Louvres, PAA Front Splitter
  //    & Iconic 34°-Raked Oval 4-Point HD-Matrix LED Headlights
  // ---------------------------------------------------------------------------
  // Deployed PAA Front Chin Splitter (`outbuildings.garage.porsche992TurboS.frontSpoiler`)
  const splitterPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 24; i++) {
    const u = (i / 24) * 2 - 1; // -1 .. +1
    const z = u * 0.84;
    const x = -2.275 + u * u * 0.19;
    splitterPts.push(new THREE.Vector3(x, 0.122, z));
  }
  const splitterCurve = new THREE.CatmullRomCurve3(splitterPts);
  const frontSplitter = new THREE.Mesh(
    new THREE.TubeGeometry(splitterCurve, 32, 0.022, 10, false),
    satinBlackAeroMat
  );
  frontSplitter.scale.set(1.6, 0.65, 1.0);
  frontSplitter.name = 'outbuildings.garage.porsche992TurboS.frontSpoiler';
  carGroup.add(frontSplitter);

  // 992.2 Front Bumper Intake Aperture & 5 Vertical Active Cooling Flaps per side (`outbuildings.garage.porsche992TurboS.frontActiveLouvres`)
  const frontIntakesGroup = new THREE.Group();
  frontIntakesGroup.name = 'outbuildings.garage.porsche992TurboS.frontActiveLouvres';
  carGroup.add(frontIntakesGroup);

  const centerFrontGrille = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.115, 0.62),
    satinBlackAeroMat
  );
  centerFrontGrille.position.set(-2.24, 0.215, 0);
  frontIntakesGroup.add(centerFrontGrille);

  for (const sideZ of [-1, 1] as const) {
    const outerPod = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, 0.145, 0.34),
      satinBlackAeroMat
    );
    outerPod.position.set(-2.19, 0.235, sideZ * 0.54);
    outerPod.rotation.y = -sideZ * 0.24;
    frontIntakesGroup.add(outerPod);

    // 5 signature 992.2 vertical active aerodynamic cooling flaps per outer intake
    for (let f = 0; f < 5; f++) {
      const fz = sideZ * (0.41 + f * 0.062);
      const fx = -2.225 + Math.abs(fz) * 0.09;
      const flap = new THREE.Mesh(
        new THREE.BoxGeometry(0.032, 0.125, 0.012),
        turboniteMat
      );
      flap.name = 'outbuildings.garage.porsche992TurboS.frontActiveLouvres';
      flap.position.set(fx, 0.235, fz);
      flap.rotation.y = -sideZ * 0.22;
      frontIntakesGroup.add(flap);
    }
  }

  // Front UK Number Plate (`992 TBS` on white plate)
  const frontPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.088, 0.40),
    new THREE.MeshStandardMaterial({
      map: createUkNumberPlateTexture(false),
      roughness: 0.25,
    })
  );
  frontPlate.position.set(-2.266, 0.265, 0);
  carGroup.add(frontPlate);

  // Stuttgart Porsche Crest on Front Hood Nose (`x = -1.96m, y = 0.515m, z = 0`)
  const hoodCrest = new THREE.Mesh(
    new THREE.PlaneGeometry(0.052, 0.064),
    crestMat
  );
  hoodCrest.position.set(-1.96, 0.518, 0);
  hoodCrest.rotation.y = -Math.PI / 2;
  hoodCrest.rotation.z = -1.22;
  carGroup.add(hoodCrest);

  // Iconic Oval 992.2 HD-Matrix 4-Point LED Headlights (`outbuildings.garage.porsche992TurboS.headlight`)
  // Recessed cleanly into the `34°`-sloped front fender pontoons (`x = -1.83m, y = 0.625m, z = ±0.675m`)
  for (const sideZ of [-1, 1] as const) {
    const hlGroup = new THREE.Group();
    hlGroup.name = 'outbuildings.garage.porsche992TurboS.headlight';
    hlGroup.position.set(-1.825, 0.622, sideZ * 0.675);
    // Align with the 34° front fender pontoon slope and outward plan curvature
    hlGroup.rotation.order = 'YZX';
    hlGroup.rotation.y = -sideZ * 0.18;
    hlGroup.rotation.z = 0.96; // Tilted along the 34° pontoon slope
    hlGroup.rotation.x = sideZ * 0.12;
    carGroup.add(hlGroup);

    // Dark gunmetal elliptical headlight bucket housing
    const hlBucket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.115, 0.105, 0.028, 28),
      glossBlackTrimMat
    );
    hlBucket.scale.set(1.38, 1.0, 0.92);
    hlBucket.name = 'outbuildings.garage.porsche992TurboS.headlight';
    hlGroup.add(hlBucket);

    // Turbonite outer bezel ring
    const hlRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.112, 0.009, 12, 28),
      turboniteMat
    );
    hlRing.rotation.x = Math.PI / 2;
    hlRing.scale.set(1.38, 0.92, 1.0);
    hlRing.position.set(0, 0.012, 0);
    hlGroup.add(hlRing);

    // Central HD-Matrix projector lens barrel
    const matrixProjector = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.042, 0.022, 20),
      turboniteMat
    );
    matrixProjector.position.set(0.01, 0.012, 0);
    hlGroup.add(matrixProjector);

    // 4 Signature Porsche 4-Point Horizontal LED DRL Light Blades
    for (const [dx, dz] of [
      [-0.048, -0.042],
      [-0.048, 0.042],
      [0.056, -0.038],
      [0.056, 0.038],
    ] as const) {
      const drlBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.038, 0.012, 0.012),
        ledDrlMat
      );
      drlBar.position.set(dx, 0.018, dz);
      hlGroup.add(drlBar);
    }

    // Flush curved clear polycarbonate headlight lens cover
    const lensDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.114, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.42),
      clearLensMat
    );
    lensDome.scale.set(1.38, 0.34, 0.92);
    lensDome.position.set(0, 0.008, 0);
    hlGroup.add(lensDome);
  }

  // ---------------------------------------------------------------------------
  // 5. Sculpted Side Mirrors, Flush Door Handles & 992.2 Turbo S Rear Quarter Side Intakes
  // ---------------------------------------------------------------------------
  for (const sideZ of [-1, 1] as const) {
    // Aerodynamic door mirror (`x = -0.44m, y = 0.81m, z = ±0.92m`)
    const mirrorGroup = new THREE.Group();
    mirrorGroup.position.set(-0.44, 0.79, sideZ * 0.86);
    carGroup.add(mirrorGroup);

    const mirrorStalk = new THREE.Mesh(
      new THREE.BoxGeometry(0.085, 0.048, 0.075),
      satinBlackAeroMat
    );
    mirrorStalk.position.set(0, 0.015, sideZ * 0.03);
    mirrorStalk.rotation.x = sideZ * 0.38;
    mirrorGroup.add(mirrorStalk);

    const mirrorCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.058, 18, 14),
      oceanBlueBodyMat
    );
    mirrorCap.scale.set(1.45, 0.72, 1.15);
    mirrorCap.position.set(0.02, 0.038, sideZ * 0.075);
    mirrorGroup.add(mirrorCap);

    // Flush pop-out door handle (`x = +0.16m, y = 0.72m, z = ±0.862m`)
    const doorHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.145, 0.022, 0.016),
      oceanBlueBodyMat
    );
    doorHandle.position.set(0.16, 0.715, sideZ * 0.862);
    carGroup.add(doorHandle);

    // 992.2 Turbo S Side Intercooler Air Intake Scoop (`outbuildings.garage.porsche992TurboS.sideIntake`)
    // Set into the leading flare of the widebody rear haunches (`x = +0.72m, y = 0.62m, z = ±0.905m`)
    const sideIntakeGroup = new THREE.Group();
    sideIntakeGroup.name = 'outbuildings.garage.porsche992TurboS.sideIntake';
    sideIntakeGroup.position.set(0.72, 0.625, sideZ * 0.905);
    sideIntakeGroup.rotation.y = sideZ * 0.19;
    carGroup.add(sideIntakeGroup);

    const intakePocket = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.165, 0.048),
      glossBlackTrimMat
    );
    intakePocket.name = 'outbuildings.garage.porsche992TurboS.sideIntake';
    sideIntakeGroup.add(intakePocket);

    const intakeSplitterVane = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.014, 0.056),
      oceanBlueBodyMat
    );
    intakeSplitterVane.position.set(0.01, 0, sideZ * 0.008);
    sideIntakeGroup.add(intakeSplitterVane);
  }

  // ---------------------------------------------------------------------------
  // 6. 992.2 Rear Engine Decklid Grille, Low-Profile Sculpted Active Turbo S Rear Wing,
  //    Full-Width Recessed Crimson LED Taillight Bar & Quad/Oval Titanium Exhaust
  // ---------------------------------------------------------------------------
  // Slatted Rear Engine Decklid Grille (`outbuildings.garage.porsche992TurboS.rearDecklidGrille`, `x = 1.54..1.88m`)
  const decklidGrilleGroup = new THREE.Group();
  decklidGrilleGroup.name = 'outbuildings.garage.porsche992TurboS.rearDecklidGrille';
  decklidGrilleGroup.position.set(1.71, 0.872, 0);
  decklidGrilleGroup.rotation.z = -0.11;
  carGroup.add(decklidGrilleGroup);

  const grilleBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.018, 0.82),
    glossBlackTrimMat
  );
  grilleBase.name = 'outbuildings.garage.porsche992TurboS.rearDecklidGrille';
  decklidGrilleGroup.add(grilleBase);

  for (let s = -6; s <= 6; s++) {
    if (s === 0) continue;
    const slat = new THREE.Mesh(
      new THREE.BoxGeometry(0.30, 0.024, 0.008),
      Math.abs(s) === 1 ? crimsonTaillightMat : turboniteMat
    );
    slat.position.set(0, 0.006, s * 0.058);
    decklidGrilleGroup.add(slat);
  }

  // Sculpted Low-Profile 992.2 Turbo S Active Rear Spoiler (`outbuildings.garage.porsche992TurboS.rearWing`)
  // Sitting cleanly just 4.2cm above the integrated ducktail lip (`x = 1.90..2.18m, y = 0.922m`) on short inboard hydraulic rams!
  const rearWingGroup = new THREE.Group();
  rearWingGroup.name = 'outbuildings.garage.porsche992TurboS.rearWing';
  carGroup.add(rearWingGroup);

  // Curved aerofoil blade following the rear plan-view contour
  const wingCurvePts: THREE.Vector3[] = [];
  for (let i = 0; i <= 24; i++) {
    const u = (i / 24) * 2 - 1; // -1 .. +1
    const z = u * 0.72;
    const x = 2.04 - u * u * 0.085;
    const y = 0.922 + Math.abs(u) * 0.012;
    wingCurvePts.push(new THREE.Vector3(x, y, z));
  }
  const wingCurve = new THREE.CatmullRomCurve3(wingCurvePts);
  const wingBladeMesh = new THREE.Mesh(
    new THREE.TubeGeometry(wingCurve, 32, 0.048, 14, false),
    oceanBlueBodyMat
  );
  // Flatten vertically into a sleek 2.4cm-thick, 22cm-chord aerofoil wing blade!
  wingBladeMesh.scale.set(2.2, 0.24, 1.0);
  wingBladeMesh.position.set(-2.04 * 1.2, 0.922 * 0.76, 0);
  wingBladeMesh.name = 'outbuildings.garage.porsche992TurboS.rearWing';
  wingBladeMesh.castShadow = true;
  wingBladeMesh.receiveShadow = true;
  rearWingGroup.add(wingBladeMesh);

  // Short inboard hydraulic PAA wing rams (`z = ±0.36m`)
  for (const sideZ of [-1, 1] as const) {
    const ram = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.022, 0.055, 12),
      satinBlackAeroMat
    );
    ram.position.set(2.01, 0.892, sideZ * 0.36);
    rearWingGroup.add(ram);
  }

  // Full-Width Recessed Crimson LED Taillight Bar (`outbuildings.garage.porsche992TurboS.taillightBar`, `x = 2.18m, y = 0.765m`)
  const taillightGroup = new THREE.Group();
  taillightGroup.name = 'outbuildings.garage.porsche992TurboS.taillightBar';
  carGroup.add(taillightGroup);

  const tailCurvePts: THREE.Vector3[] = [];
  for (let i = 0; i <= 28; i++) {
    const u = (i / 28) * 2 - 1;
    const z = u * 0.815;
    const x = 2.195 - u * u * 0.105;
    tailCurvePts.push(new THREE.Vector3(x, 0.768, z));
  }
  const tailCurve = new THREE.CatmullRomCurve3(tailCurvePts);

  const tailHousing = new THREE.Mesh(
    new THREE.TubeGeometry(tailCurve, 32, 0.028, 12, false),
    glossBlackTrimMat
  );
  tailHousing.scale.set(1.0, 0.85, 1.0);
  taillightGroup.add(tailHousing);

  const tailLedBlade = new THREE.Mesh(
    new THREE.TubeGeometry(tailCurve, 36, 0.011, 10, false),
    crimsonTaillightMat
  );
  tailLedBlade.name = 'outbuildings.garage.porsche992TurboS.taillightBar';
  tailLedBlade.position.set(0.012, 0, 0);
  taillightGroup.add(tailLedBlade);

  const tailSmokedLens = new THREE.Mesh(
    new THREE.TubeGeometry(tailCurve, 32, 0.022, 12, false),
    smokedRedLensMat
  );
  tailSmokedLens.position.set(0.008, 0, 0);
  taillightGroup.add(tailSmokedLens);

  // Rear UK Number Plate (`992 TBS` on yellow acrylic plate at `x = 2.252m, y = 0.44m`)
  const rearPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.095, 0.42),
    new THREE.MeshStandardMaterial({
      map: createUkNumberPlateTexture(true),
      roughness: 0.24,
    })
  );
  rearPlate.position.set(2.252, 0.44, 0);
  carGroup.add(rearPlate);

  // Sculpted Rear Venturi Diffuser & 992.2 Turbo S Oval/Quad Titanium Sport Exhaust (`outbuildings.garage.porsche992TurboS.exhaust`)
  const exhaustGroup = new THREE.Group();
  exhaustGroup.name = 'outbuildings.garage.porsche992TurboS.exhaust';
  carGroup.add(exhaustGroup);

  const rearDiffuserValance = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.195, 1.52),
    satinBlackAeroMat
  );
  rearDiffuserValance.position.set(2.19, 0.255, 0);
  exhaustGroup.add(rearDiffuserValance);

  // 4 Vertical aerodynamic diffuser strakes
  for (const sz of [-0.32, -0.11, 0.11, 0.32] as const) {
    const strake = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.14, 0.014),
      satinBlackAeroMat
    );
    strake.position.set(2.21, 0.22, sz);
    exhaustGroup.add(strake);
  }

  // Twin Large Oval Porsche Turbo S Titanium Sport Exhaust Tailpipes (`z = ±0.54m`)
  for (const sideZ of [-1, 1] as const) {
    const tailpipeOuter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.056, 0.058, 0.11, 24, 1, true),
      titaniumExhaustMat
    );
    tailpipeOuter.name = 'outbuildings.garage.porsche992TurboS.exhaust';
    tailpipeOuter.rotation.z = Math.PI / 2;
    tailpipeOuter.scale.set(0.76, 1.0, 1.38);
    tailpipeOuter.position.set(2.22, 0.245, sideZ * 0.54);
    exhaustGroup.add(tailpipeOuter);

    const tailpipeCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.09, 20),
      glossBlackTrimMat
    );
    tailpipeCore.rotation.z = Math.PI / 2;
    tailpipeCore.scale.set(0.74, 1.0, 1.34);
    tailpipeCore.position.set(2.21, 0.245, sideZ * 0.54);
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
