import * as THREE from 'three';

/**
 * Generates a procedural 512x512 Ocean Blue Metallic (`#0d2d4a` base with `#1a4d78` & `#286699`
 * metallic pearl micro-flecks and clearcoat depth gradient) texture for the Porsche 911 (992.2) Turbo S.
 */
function createOceanBlueMetallicTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // 1. Deep midnight-ocean blue metallic base gradient
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0.0, '#0a233b');
  grad.addColorStop(0.35, '#0d2d4a');
  grad.addColorStop(0.55, '#133b60');
  grad.addColorStop(0.8, '#0d2d4a');
  grad.addColorStop(1.0, '#081e33');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // 2. Subtle clearcoat sheen bands
  const sheen = ctx.createRadialGradient(
    size * 0.42,
    size * 0.38,
    size * 0.05,
    size * 0.5,
    size * 0.5,
    size * 0.65
  );
  sheen.addColorStop(0.0, 'rgba(56, 128, 192, 0.22)');
  sheen.addColorStop(0.5, 'rgba(26, 77, 120, 0.10)');
  sheen.addColorStop(1.0, 'rgba(8, 26, 44, 0.18)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, size, size);

  // 3. Deterministic metallic pearl micro-flecks (#1a4d78, #286699, #3b82bd, #09223a)
  const flakeColors = [
    'rgba(26, 77, 120, 0.45)',
    'rgba(40, 102, 153, 0.42)',
    'rgba(62, 134, 194, 0.32)',
    'rgba(14, 48, 80, 0.48)',
    'rgba(90, 165, 225, 0.22)',
  ];
  for (let i = 0; i < 5200; i++) {
    const s1 = Math.sin(i * 12.9898 + 1.7) * 43758.5453;
    const f1 = s1 - Math.floor(s1);
    const s2 = Math.sin(i * 78.233 + 3.1) * 29183.127;
    const f2 = s2 - Math.floor(s2);
    const s3 = Math.sin(i * 41.137 + 0.9) * 19381.419;
    const f3 = s3 - Math.floor(s3);

    const x = f1 * size;
    const y = f2 * size;
    const r = 0.45 + f3 * 1.15;
    ctx.fillStyle = flakeColors[i % flakeColors.length]!;
    ctx.fillRect(x, y, r, r);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

/**
 * Generates a 2x2 diagonal twill carbon-fiber weave texture for Porsche Exclusive Manufaktur
 * carbon trim, side intake blades, seatbacks, and active aero elements.
 */
function createCarbonFiberTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#14171c';
  ctx.fillRect(0, 0, size, size);

  const cell = 8;
  for (let y = 0; y < size; y += cell) {
    for (let x = 0; x < size; x += cell) {
      const diag = ((x / cell + y / cell) % 4 + 4) % 4;
      ctx.fillStyle = diag < 2 ? '#232830' : '#15181e';
      ctx.fillRect(x, y, cell * 0.5, cell);
      ctx.fillStyle = diag < 2 ? '#1a1e24' : '#2b313b';
      ctx.fillRect(x + cell * 0.5, y, cell * 0.5, cell);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  return tex;
}

/**
 * Generates the Porsche Turbonite & Gold Stuttgart Crest shield texture for the front hood and center-locks.
 */
function createPorscheCrestTexture(): THREE.CanvasTexture {
  const w = 128;
  const h = 160;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, w, h);

  // Shield outline in warm Porsche Turbonite/Gold
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(w * 0.14, h * 0.08);
  ctx.lineTo(w * 0.86, h * 0.08);
  ctx.lineTo(w * 0.84, h * 0.56);
  ctx.quadraticCurveTo(w * 0.8, h * 0.84, w * 0.5, h * 0.95);
  ctx.quadraticCurveTo(w * 0.2, h * 0.84, w * 0.16, h * 0.56);
  ctx.closePath();

  ctx.fillStyle = '#c8b48a';
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#3a352c';
  ctx.stroke();
  ctx.clip();

  // Quadrants (red/black stripes & antler quadrants)
  ctx.fillStyle = '#181a1d';
  ctx.fillRect(w * 0.5, h * 0.16, w * 0.4, h * 0.36);
  ctx.fillRect(w * 0.1, h * 0.52, w * 0.4, h * 0.42);

  ctx.fillStyle = '#8b1e24';
  for (let s = 0; s < 3; s++) {
    ctx.fillRect(w * 0.5 + s * 14, h * 0.16, 7, h * 0.36);
    ctx.fillRect(w * 0.14 + s * 14, h * 0.52, 7, h * 0.42);
  }

  // Top PORSCHE banner
  ctx.fillStyle = '#181a1d';
  ctx.fillRect(w * 0.12, h * 0.08, w * 0.76, h * 0.11);
  ctx.fillStyle = '#d9c8a0';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PORSCHE', w * 0.5, h * 0.135);

  // Central Stuttgart horse shield
  ctx.fillStyle = '#d8c598';
  ctx.fillRect(w * 0.36, h * 0.36, w * 0.28, h * 0.32);
  ctx.strokeStyle = '#181a1d';
  ctx.lineWidth = 2;
  ctx.strokeRect(w * 0.36, h * 0.36, w * 0.28, h * 0.32);

  // Rearing horse silhouette
  ctx.fillStyle = '#141619';
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.52, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates a radial cross-drilled Porsche Ceramic Composite Brake (PCCB) disc rotor texture.
 */
function createPccbRotorTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size * 0.5;
  const cy = size * 0.5;

  ctx.fillStyle = '#484d54';
  ctx.fillRect(0, 0, size, size);

  // Radial ceramic friction ring gradient
  const rad = ctx.createRadialGradient(cx, cy, size * 0.16, cx, cy, size * 0.49);
  rad.addColorStop(0.0, '#1e2126');
  rad.addColorStop(0.28, '#282c32');
  rad.addColorStop(0.32, '#626870');
  rad.addColorStop(0.65, '#727882');
  rad.addColorStop(0.92, '#5c626b');
  rad.addColorStop(1.0, '#383c42');
  ctx.fillStyle = rad;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.49, 0, Math.PI * 2);
  ctx.fill();

  // Concentric micro-grooves on carbon-ceramic face
  ctx.strokeStyle = 'rgba(40, 44, 50, 0.35)';
  ctx.lineWidth = 1;
  for (let r = size * 0.24; r < size * 0.47; r += 3.5) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Curved spirals of cross-drilled PCCB ventilation holes
  const numSpirals = 30;
  const holesPerSpiral = 6;
  ctx.fillStyle = '#121417';
  for (let s = 0; s < numSpirals; s++) {
    const baseAngle = (s / numSpirals) * Math.PI * 2;
    for (let h = 0; h < holesPerSpiral; h++) {
      const frac = (h + 0.5) / holesPerSpiral;
      const r = size * (0.25 + frac * 0.21);
      const ang = baseAngle + frac * 0.26;
      const hx = cx + Math.cos(ang) * r;
      const hy = cy + Math.sin(ang) * r;
      ctx.beginPath();
      ctx.arc(hx, hy, 3.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Aluminum rotor hat mounting bobbins
  ctx.fillStyle = '#9aa2ad';
  for (let b = 0; b < 10; b++) {
    const ang = (b / 10) * Math.PI * 2;
    const bx = cx + Math.cos(ang) * (size * 0.22);
    const by = cy + Math.sin(ang) * (size * 0.22);
    ctx.beginPath();
    ctx.arc(bx, by, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates a Michelin Pilot Sport 4S sidewall texture with subtle rib pattern and sizing.
 */
function createTireSidewallTexture(sizeLabel: string): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size * 0.5;
  const cy = size * 0.5;

  ctx.fillStyle = '#17191d';
  ctx.fillRect(0, 0, size, size);

  const grad = ctx.createRadialGradient(cx, cy, size * 0.25, cx, cy, size * 0.5);
  grad.addColorStop(0.0, '#101215');
  grad.addColorStop(0.65, '#1e2126');
  grad.addColorStop(0.88, '#262a30');
  grad.addColorStop(1.0, '#15171b');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.5, 0, Math.PI * 2);
  ctx.fill();

  // Fine radial sidewall knurling
  ctx.strokeStyle = 'rgba(255,255,255,0.035)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 180; i++) {
    const a = (i / 180) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * size * 0.34, cy + Math.sin(a) * size * 0.34);
    ctx.lineTo(cx + Math.cos(a) * size * 0.44, cy + Math.sin(a) * size * 0.44);
    ctx.stroke();
  }

  // Moulded sidewall markings
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = 'rgba(180, 186, 194, 0.32)';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MICHELIN   PILOT SPORT 4S', 0, -size * 0.38);
  ctx.rotate(Math.PI);
  ctx.fillText(sizeLabel + '   N0', 0, -size * 0.38);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates UK front (white) and rear (yellow) registration plate textures (`992 TBS`).
 */
function createUkRegistrationPlateTexture(reg: string, isRear: boolean): THREE.CanvasTexture {
  const w = 512;
  const h = 112;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Reflective white or yellow acrylic plate backing
  ctx.fillStyle = isRear ? '#f2c318' : '#f4f6f9';
  ctx.fillRect(0, 0, w, h);

  // Subtle dark acrylic border
  ctx.strokeStyle = '#181a1e';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, w - 8, h - 8);

  // Left UK blue Euro-band
  ctx.fillStyle = '#003399';
  ctx.fillRect(8, 8, 52, h - 16);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('UK', 34, h * 0.68);

  // Mini Union Jack emblem above UK
  ctx.fillStyle = '#c8102e';
  ctx.fillRect(20, 22, 28, 16);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 22, 28, 16);

  // Registration characters
  ctx.fillStyle = '#111317';
  ctx.font = '900 68px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(reg, w * 0.54, h * 0.53);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates the rear Turbonite `P O R S C H E` and `911 turbo S` script badge texture.
 */
function createRearModelScriptTexture(text: string, fontSize: number): THREE.CanvasTexture {
  const w = 512;
  const h = 96;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#b8b2a6'; // Porsche Turbonite satin metallic hue
  ctx.font = `italic 900 ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, w * 0.5, h * 0.5);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates the 992.2 12.6-inch curved 5-tube digital instrument cluster texture.
 */
function createCurvedInstrumentClusterTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = 160;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#090c10';
  ctx.fillRect(0, 0, w, h);

  const dialPositions = [68, 152, 256, 360, 444];
  const dialRadii = [34, 42, 58, 42, 34];
  for (let i = 0; i < 5; i++) {
    const dx = dialPositions[i]!;
    const r = dialRadii[i]!;
    ctx.beginPath();
    ctx.arc(dx, h * 0.52, r, 0, Math.PI * 2);
    ctx.fillStyle = '#11161e';
    ctx.fill();
    ctx.lineWidth = i === 2 ? 3.5 : 2;
    ctx.strokeStyle = i === 2 ? '#e5c100' : '#4a627a';
    ctx.stroke();
  }

  // Center rev counter text
  ctx.fillStyle = '#f4f7fa';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('0', 256, h * 0.52);
  ctx.fillStyle = '#f5c400';
  ctx.font = 'italic bold 11px sans-serif';
  ctx.fillText('turbo S', 256, h * 0.72);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates the 10.9-inch Porsche Communication Management (PCM) central screen texture.
 */
function createPcmScreenTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0b1017';
  ctx.fillRect(0, 0, w, h);

  // Left navigation sidebar
  ctx.fillStyle = '#141c27';
  ctx.fillRect(0, 0, 88, h);

  // Map / telemetry cards
  ctx.fillStyle = '#162231';
  ctx.fillRect(104, 18, 190, h - 36);
  ctx.fillRect(308, 18, 188, h - 36);

  ctx.strokeStyle = '#2d6fa3';
  ctx.lineWidth = 2;
  ctx.strokeRect(104, 18, 190, h - 36);
  ctx.strokeRect(308, 18, 188, h - 36);

  ctx.fillStyle = '#e8eff7';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('PORSCHE 992.2 TURBO S', 122, 48);
  ctx.fillStyle = '#4da6ff';
  ctx.font = '13px sans-serif';
  ctx.fillText('PAA Aero: Sport Plus', 122, 76);
  ctx.fillText('PCCB Temp: Optimal', 122, 102);
  ctx.fillText('Navigation: Crox Farmhouse', 324, 48);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Generates a soft radial ambient occlusion contact shadow texture under the 992.2 chassis.
 */
function createContactShadowTexture(): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.scale(1.0, 0.5);
  const grad = ctx.createRadialGradient(w * 0.5, h, w * 0.08, w * 0.5, h, w * 0.49);
  grad.addColorStop(0.0, 'rgba(6, 10, 15, 0.78)');
  grad.addColorStop(0.55, 'rgba(8, 12, 18, 0.58)');
  grad.addColorStop(0.82, 'rgba(10, 15, 22, 0.24)');
  grad.addColorStop(1.0, 'rgba(10, 15, 22, 0.0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(w * 0.5, h, w * 0.49, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Smooth Hermite step helper `t in [0, 1]`. */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Evaluates a single half-side cross-section profile (`19` points from bottom center `z = 0`
 * out around the lower sill, wheel arch/flank, widebody haunch shoulder, and up to the hood/beltline/decklid edge)
 * at longitudinal station `x` (`-2.26m` front bumper tip to `+2.24m` rear bumper tip).
 */
function sampleOuterBodyHalfProfile(x: number): Array<{ y: number; z: number }> {
  // 1. Planform outer width `zMax(x)` capturing the 992.2 Turbo S silhouette:
  //    - Front bumper nose taper (`x = -2.26..-1.88`)
  //    - Front fender width `z = 0.91m` over front axle (`x = -1.25m`)
  //    - Subtle waist pinch `z = 0.855m` at the doors (`x = -0.35..+0.35m`)
  //    - Dramatic 992.2 Turbo S widebody rear haunches `z = 0.95m` (`1.90m` width) over rear axle (`x = +0.75..+1.65m`)
  //    - Rear bumper corner taper (`x = +1.70..+2.24m`)
  let zFlank = 0.88;
  if (x < -1.85) {
    const u = Math.max(0, Math.min(1, (x - -2.26) / 0.41));
    zFlank = 0.24 + 0.65 * Math.pow(u, 0.52);
  } else if (x < -0.75) {
    const frontBulge = Math.exp(-Math.pow((x - -1.25) / 0.42, 2));
    zFlank = 0.865 + 0.048 * frontBulge; // peaks at 0.913m
  } else if (x < 0.45) {
    const waist = Math.sin(((x - -0.75) / 1.2) * Math.PI);
    zFlank = 0.868 - 0.024 * waist; // pinches to 0.844m at doors
  } else if (x < 1.72) {
    const rise = smoothstep(0.45, 0.88, x);
    const haunchPeak = Math.exp(-Math.pow((x - 1.22) / 0.46, 2));
    zFlank = 0.868 + 0.068 * rise + 0.018 * haunchPeak; // peaks at 0.954m (1.908m widebody!)
  } else {
    const u = Math.max(0, Math.min(1, (2.24 - x) / 0.52));
    zFlank = 0.28 + (0.925 - 0.28) * Math.pow(u, 0.56);
  }

  // 2. Wheel arch cutout height at front axle (`x = -1.25m, r = 0.368m`) & rear axle (`x = +1.20m, r = 0.388m`)
  let ySill = 0.135;
  if (x < -1.72) {
    ySill = 0.13 + 0.02 * smoothstep(-1.95, -2.26, x);
  } else if (x > 1.72) {
    ySill = 0.15 + 0.07 * smoothstep(1.75, 2.24, x);
  }

  const dxFront = x - -1.25;
  const rFront = 0.368;
  let archLiftFront = 0;
  let archFlareFront = 0;
  if (Math.abs(dxFront) < rFront) {
    archLiftFront = Math.sqrt(Math.max(0, rFront * rFront - dxFront * dxFront));
    archFlareFront = 0.016 * (archLiftFront / rFront);
  }

  const dxRear = x - 1.2;
  const rRear = 0.388;
  let archLiftRear = 0;
  let archFlareRear = 0;
  if (Math.abs(dxRear) < rRear) {
    archLiftRear = Math.sqrt(Math.max(0, rRear * rRear - dxRear * dxRear));
    archFlareRear = 0.018 * (archLiftRear / rRear);
  }

  const yArchRim = Math.max(ySill, 0.335 + archLiftFront, 0.352 + archLiftRear);
  const zOuterMax = zFlank + archFlareFront + archFlareRear;

  // 3. Fender pontoon / shoulder height `yShoulder(x)` and inner beltline/hood edge `(yInner, zInner)`
  //    Captures the raised 911 front fender pontoons (`y = 0.78m` over front axle) and muscular rear haunch shelf (`y = 0.87m`)
  let yShoulder = 0.78;
  if (x < -1.85) {
    const u = Math.max(0, Math.min(1, (x - -2.26) / 0.41));
    yShoulder = 0.43 + 0.25 * Math.pow(u, 0.65);
  } else if (x < -0.8) {
    const base = 0.68 + 0.12 * smoothstep(-1.85, -0.8, x);
    const pontoonCrest = 0.058 * Math.exp(-Math.pow((x - -1.32) / 0.38, 2));
    yShoulder = base + pontoonCrest;
  } else if (x < 0.45) {
    yShoulder = 0.8 + 0.035 * smoothstep(-0.8, 0.45, x);
  } else if (x < 1.65) {
    const haunchCrest = 0.045 * Math.exp(-Math.pow((x - 1.15) / 0.42, 2));
    yShoulder = 0.835 + haunchCrest - 0.025 * smoothstep(1.25, 1.65, x);
  } else {
    yShoulder = 0.84 - 0.08 * smoothstep(1.65, 2.24, x);
  }

  // Inner edge where outer fender/haunch meets the hood/cabin beltline/rear decklid
  let zInner = 0.56;
  if (x < -1.85) {
    const u = Math.max(0, Math.min(1, (x - -2.26) / 0.41));
    zInner = 0.12 + 0.4 * Math.pow(u, 0.6);
  } else if (x < -0.8) {
    zInner = 0.52 + 0.14 * smoothstep(-1.85, -0.8, x);
  } else if (x < 0.5) {
    zInner = 0.66 - 0.04 * smoothstep(-0.8, 0.5, x);
  } else if (x < 1.65) {
    zInner = 0.62 - 0.12 * smoothstep(0.5, 1.65, x);
  } else {
    const u = Math.max(0, Math.min(1, (2.24 - x) / 0.59));
    zInner = 0.14 + 0.36 * Math.pow(u, 0.65);
  }

  // Recessed hood/beltline height at `zInner` (lower than `yShoulder` in front to form the 911 pontoon valley!)
  let yInner = yShoulder;
  if (x > -1.92 && x < -0.82) {
    const pontoonValley = 0.048 * Math.sin(((x - -1.92) / 1.1) * Math.PI);
    yInner = yShoulder - pontoonValley;
  } else if (x >= -0.82 && x < 1.55) {
    yInner = yShoulder + 0.018;
  } else if (x >= 1.55) {
    // Ducktail kick-up at `x = 1.98..2.16m`
    const ducktail = 0.045 * Math.exp(-Math.pow((x - 2.08) / 0.14, 2));
    yInner = yShoulder + ducktail;
  }

  // Side intercooler intake indent on the leading edge of the rear widebody haunch (`x = 0.54..0.96m`)
  let intakeIndent = 0;
  if (x > 0.52 && x < 0.98) {
    intakeIndent = 0.055 * Math.sin(((x - 0.52) / 0.46) * Math.PI);
  }

  // Construct 16 smooth transverse points from underbody center (`z = 0`) up to `(yInner, zInner)`
  const pts: Array<{ y: number; z: number }> = [
    { y: 0.135, z: 0.0 },
    { y: 0.135, z: zOuterMax * 0.35 },
    { y: 0.138, z: zOuterMax * 0.68 },
    { y: yArchRim, z: zOuterMax * 0.92 },
    { y: yArchRim + (yShoulder - yArchRim) * 0.08, z: zOuterMax * 0.985 },
    { y: yArchRim + (yShoulder - yArchRim) * 0.22, z: zOuterMax },
    { y: yArchRim + (yShoulder - yArchRim) * 0.38, z: zOuterMax - intakeIndent * 0.45 },
    { y: yArchRim + (yShoulder - yArchRim) * 0.54, z: zOuterMax * 0.992 - intakeIndent },
    { y: yArchRim + (yShoulder - yArchRim) * 0.7, z: zOuterMax * 0.965 - intakeIndent * 0.6 },
    { y: yArchRim + (yShoulder - yArchRim) * 0.84, z: zOuterMax * 0.91 },
    { y: yShoulder - 0.012, z: zInner + (zOuterMax - zInner) * 0.68 },
    { y: yShoulder, z: zInner + (zOuterMax - zInner) * 0.45 },
    { y: yShoulder * 0.6 + yInner * 0.4, z: zInner + (zOuterMax - zInner) * 0.22 },
    { y: yInner, z: zInner },
    { y: yInner - 0.004, z: zInner * 0.93 },
    { y: yInner - 0.032, z: zInner * 0.86 },
  ];
  return pts;
}

/**
 * Builds a stitched lofted `THREE.BufferGeometry` from a 2D grid of `stations[i][j]` (`(x, y, z)`).
 */
function buildLoftedGridGeometry(
  grid: Array<Array<{ x: number; y: number; z: number }>>
): THREE.BufferGeometry {
  const numStations = grid.length;
  const numCols = grid[0]!.length;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < numStations; i++) {
    const u = i / (numStations - 1);
    const row = grid[i]!;
    for (let j = 0; j < numCols; j++) {
      const v = j / (numCols - 1);
      const p = row[j]!;
      positions.push(p.x, p.y, p.z);
      uvs.push(u, v);
    }
  }

  for (let i = 0; i < numStations - 1; i++) {
    for (let j = 0; j < numCols - 1; j++) {
      const a = i * numCols + j;
      const b = (i + 1) * numCols + j;
      const c = (i + 1) * numCols + (j + 1);
      const d = i * numCols + (j + 1);
      indices.push(a, b, c);
      indices.push(a, c, d);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Evaluates the classic Porsche 911 (992.2) parabolic roofline / fastback flyline height `yRoof(x)`
 * and half-width `zRoof(x)` from the base of the windshield (`x = -0.82m`) to the rear decklid (`x = +1.54m`).
 */
function sampleFlylineRoof(x: number): { y: number; z: number } {
  let y = 0.77;
  if (x <= -0.16) {
    // Steeply raked curved 992 windshield (`x = -0.82..-0.16m`, `y = 0.77..1.275m`)
    const t = Math.max(0, Math.min(1, (x - -0.82) / 0.66));
    y = 0.77 + 0.505 * Math.pow(t, 0.78);
  } else if (x <= 0.14) {
    // Crown of the 911 roof (`y = 1.30m` peak at `x = 0.04m`)
    const t = (x - -0.16) / 0.3;
    y = 1.275 + 0.025 * Math.sin(t * Math.PI);
  } else {
    // Signature continuous 911 fastback parabolic flyline (`x = 0.14..1.54m`, `y = 1.28..0.86m`)
    const t = Math.max(0, Math.min(1, (x - 0.14) / 1.4));
    y = 1.28 - 0.42 * Math.pow(t, 1.18);
  }

  // Greenhouse roof rail half-width tapers from `0.64m` at A-pillar base to `0.56m` at roof crown and `0.48m` at rear screen base
  const tAll = Math.max(0, Math.min(1, (x - -0.82) / 2.36));
  const z = 0.64 - 0.16 * Math.pow(tAll, 0.9);
  return { y, z };
}

/**
 * Builds a single high-LOD staggered 992.2 Turbo S Exclusive Design 5-Twin-Spoke Center-Lock wheel,
 * Michelin Pilot Sport 4S tire, cross-drilled PCCB carbon-ceramic rotor, and Porsche Speed Yellow
 * monobloc brake caliper.
 */
function buildTurboSWheelAssembly(
  tireRadius: number,
  tireWidth: number,
  rimRadius: number,
  rotorRadius: number,
  sideZ: -1 | 1,
  isFront: boolean,
  materials: {
    tireRubberMat: THREE.Material;
    sidewallMat: THREE.Material;
    machinedAlloyMat: THREE.Material;
    turboniteBarrelMat: THREE.Material;
    pccbRotorMat: THREE.Material;
    pccbYellowMat: THREE.Material;
    crestCapMat: THREE.Material;
    darkMetalMat: THREE.Material;
  }
): THREE.Group {
  const wheelAssembly = new THREE.Group();
  wheelAssembly.name = 'outbuildings.garage.porsche992TurboS.wheel';

  // 1. Sculpted Michelin Pilot Sport 4S Tire Profile (LatheGeometry around Y axis, rotated to Z axis)
  const hw = tireWidth * 0.5;
  const innerR = rimRadius;
  const shoulderR = tireRadius - 0.018;
  const lathePts: THREE.Vector2[] = [
    new THREE.Vector2(innerR, -hw * 0.88),
    new THREE.Vector2(innerR + (tireRadius - innerR) * 0.45, -hw * 0.98),
    new THREE.Vector2(shoulderR, -hw * 0.95),
    new THREE.Vector2(tireRadius, -hw * 0.72),
    // Circumferential rain grooves across the tread face
    new THREE.Vector2(tireRadius, -hw * 0.36),
    new THREE.Vector2(tireRadius - 0.005, -hw * 0.32),
    new THREE.Vector2(tireRadius, -hw * 0.28),
    new THREE.Vector2(tireRadius, -hw * 0.04),
    new THREE.Vector2(tireRadius - 0.005, 0),
    new THREE.Vector2(tireRadius, hw * 0.04),
    new THREE.Vector2(tireRadius, hw * 0.28),
    new THREE.Vector2(tireRadius - 0.005, hw * 0.32),
    new THREE.Vector2(tireRadius, hw * 0.36),
    new THREE.Vector2(tireRadius, hw * 0.72),
    new THREE.Vector2(shoulderR, hw * 0.95),
    new THREE.Vector2(innerR + (tireRadius - innerR) * 0.45, hw * 0.98),
    new THREE.Vector2(innerR, hw * 0.88),
  ];
  const tireGeom = new THREE.LatheGeometry(lathePts, 44);
  tireGeom.rotateX(Math.PI / 2);
  const tireMesh = new THREE.Mesh(tireGeom, materials.tireRubberMat);
  tireMesh.name = 'outbuildings.garage.porsche992TurboS.wheel';
  tireMesh.castShadow = true;
  tireMesh.receiveShadow = true;
  wheelAssembly.add(tireMesh);

  // Outer sidewall lettering ring
  const sidewallRing = new THREE.Mesh(
    new THREE.RingGeometry(innerR + 0.004, tireRadius - 0.012, 40),
    materials.sidewallMat
  );
  sidewallRing.position.z = sideZ * (hw * 0.96);
  if (sideZ < 0) {
    sidewallRing.rotation.y = Math.PI;
  }
  wheelAssembly.add(sidewallRing);

  // 2. Dark Turbonite / Anthracite Forged Inner Wheel Barrel & Outer Machined Rim Lip
  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(rimRadius - 0.006, rimRadius - 0.006, tireWidth * 0.84, 36, 1, true),
    materials.turboniteBarrelMat
  );
  barrel.rotation.x = Math.PI / 2;
  wheelAssembly.add(barrel);

  const outerLip = new THREE.Mesh(
    new THREE.TorusGeometry(rimRadius - 0.005, 0.011, 14, 40),
    materials.machinedAlloyMat
  );
  outerLip.position.z = sideZ * (hw * 0.82);
  wheelAssembly.add(outerLip);

  // 3. 992.2 Turbo S Exclusive Design 5-Twin-Spoke Forged Wheel Face (`10` angled sculpted blades in 5 twin pairs)
  const hubZ = sideZ * (hw * 0.72);
  const rimZ = sideZ * (hw * 0.81);
  const spokeLen = rimRadius - 0.056;
  for (let p = 0; p < 5; p++) {
    const pairAngle = (p / 5) * Math.PI * 2;
    for (const twinOffset of [-0.145, 0.145]) {
      const ang = pairAngle + twinOffset;
      const spokeGroup = new THREE.Group();
      spokeGroup.rotation.z = ang;

      // Primary diamond-turned machined face blade
      const faceBlade = new THREE.Mesh(
        new THREE.BoxGeometry(0.022, spokeLen, 0.016),
        materials.machinedAlloyMat
      );
      faceBlade.position.set(0, 0.05 + spokeLen * 0.5, (hubZ + rimZ) * 0.5);
      faceBlade.rotation.x = sideZ * -0.14;
      spokeGroup.add(faceBlade);

      // Dark Turbonite recessed side pocket on each spoke
      const spokePocket = new THREE.Mesh(
        new THREE.BoxGeometry(0.032, spokeLen * 0.94, 0.018),
        materials.turboniteBarrelMat
      );
      spokePocket.position.set(0, 0.05 + spokeLen * 0.5, (hubZ + rimZ) * 0.5 - sideZ * 0.006);
      spokePocket.rotation.x = sideZ * -0.14;
      spokeGroup.add(spokePocket);

      wheelAssembly.add(spokeGroup);
    }
  }

  // 4. Forged Center-Lock Hub & Central Locking Nut with Porsche Crest Cap
  const centerHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.068, 0.076, 0.045, 24),
    materials.turboniteBarrelMat
  );
  centerHub.rotation.x = Math.PI / 2;
  centerHub.position.z = hubZ - sideZ * 0.01;
  wheelAssembly.add(centerHub);

  const centerLockNut = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.048, 0.028, 12),
    materials.darkMetalMat
  );
  centerLockNut.rotation.x = Math.PI / 2;
  centerLockNut.position.z = hubZ + sideZ * 0.012;
  wheelAssembly.add(centerLockNut);

  const crestCap = new THREE.Mesh(
    new THREE.CircleGeometry(0.03, 20),
    materials.crestCapMat
  );
  crestCap.position.z = hubZ + sideZ * 0.027;
  if (sideZ < 0) {
    crestCap.rotation.y = Math.PI;
  }
  wheelAssembly.add(crestCap);

  // 5. Porsche Ceramic Composite Brake (PCCB) 420mm Front / 390mm Rear Cross-Drilled Carbon-Ceramic Disc Rotor
  const rotorDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(rotorRadius, rotorRadius, 0.034, 36),
    materials.pccbRotorMat
  );
  rotorDisc.name = 'outbuildings.garage.porsche992TurboS.pccbRotor';
  rotorDisc.rotation.x = Math.PI / 2;
  rotorDisc.position.z = sideZ * (hw * 0.34);
  wheelAssembly.add(rotorDisc);

  // 6. Iconic Porsche Speed Yellow (`#f5c400`) 10-Piston Front / 4-Piston Rear Monobloc Brake Caliper
  const caliperGroup = new THREE.Group();
  caliperGroup.name = 'outbuildings.garage.porsche992TurboS.pccbCaliper';
  // Front calipers mounted towards the rear of the front disc (`+x`), rear calipers towards the front (`-x`)
  const caliperAngle = isFront ? 0.15 : Math.PI - 0.18;
  const calR = rotorRadius - 0.028;
  caliperGroup.position.set(
    Math.cos(caliperAngle) * calR,
    Math.sin(caliperAngle) * calR,
    sideZ * (hw * 0.38)
  );
  caliperGroup.rotation.z = caliperAngle;

  const calH = isFront ? 0.21 : 0.165;
  const calBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.088, calH, 0.086),
    materials.pccbYellowMat
  );
  calBody.name = 'outbuildings.garage.porsche992TurboS.pccbCaliper';
  calBody.castShadow = true;
  caliperGroup.add(calBody);

  const calBridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.068, calH * 0.82, 0.092),
    materials.pccbYellowMat
  );
  calBridge.name = 'outbuildings.garage.porsche992TurboS.pccbCaliper';
  calBridge.position.x = 0.012;
  caliperGroup.add(calBridge);

  wheelAssembly.add(caliperGroup);

  return wheelAssembly;
}

/**
 * Issue #1 ("Porsche 992.2 Turbo S in ocean Blue metalic here, DO a really good job on the turbo S"
 * at `[-15.013, -0.5, 18.708]` -> Outbuilding local `(u = 7.198m, y = -0.50m, v = 3.336m)` on `outbuildings.garage.resinFloor`):
 * Builds a showroom-grade, high-LOD 3D model of a **Porsche 911 (992.2) Turbo S Coupé in Ocean Blue Metallic**
 * (`outbuildings.garage.porsche992TurboS`) parked on the Garage poured resin floor (`y = garageFloorTopY = -0.50m`).
 */
export function buildPorsche992TurboS(
  groundGroup: THREE.Group,
  garageFloorTopY: number
): void {
  const carGroup = new THREE.Group();
  carGroup.name = 'outbuildings.garage.porsche992TurboS';
  carGroup.userData.zone = 'study';
  // Positioned so the nose/hood covers `(u = 7.20m, v = 3.34m)` right at the user's hit point `[-15.013, -0.5, 18.708]`,
  // angled toward the West coach doors (`rotation.y = -0.24`) with generous walk-around clearance to the East tool bench (`u = 12.04m`).
  carGroup.position.set(7.95, garageFloorTopY, 2.95);
  carGroup.rotation.y = -0.24;
  groundGroup.add(carGroup);

  // ---------------------------------------------------------------------------
  // 1. Automotive Materials & Procedural Textures
  // ---------------------------------------------------------------------------
  const oceanBlueTex = createOceanBlueMetallicTexture();
  const oceanBlueBodyMat = new THREE.MeshStandardMaterial({
    color: 0x123a5e,
    map: oceanBlueTex,
    roughness: 0.14,
    metalness: 0.78,
    side: THREE.DoubleSide,
  });

  const carbonWeaveTex = createCarbonFiberTexture();
  const glossCarbonMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: carbonWeaveTex,
    roughness: 0.18,
    metalness: 0.35,
    side: THREE.DoubleSide,
  });

  const turboniteMat = new THREE.MeshStandardMaterial({
    color: 0x4c4a46, // Signature Porsche 992.2 Turbo S 'Turbonite' satin metallic gunmetal-pewter
    roughness: 0.28,
    metalness: 0.82,
    side: THREE.DoubleSide,
  });

  const glossBlackTrimMat = new THREE.MeshStandardMaterial({
    color: 0x101318,
    roughness: 0.15,
    metalness: 0.45,
    side: THREE.DoubleSide,
  });

  const satinBlackUnderbodyMat = new THREE.MeshStandardMaterial({
    color: 0x12151a,
    roughness: 0.72,
    metalness: 0.18,
    side: THREE.DoubleSide,
  });

  const glazingMat = new THREE.MeshStandardMaterial({
    color: 0x111a24,
    roughness: 0.06,
    metalness: 0.25,
    transparent: true,
    opacity: 0.52,
    side: THREE.DoubleSide,
  });

  const headlightDomeMat = new THREE.MeshStandardMaterial({
    color: 0xdceeff,
    roughness: 0.05,
    metalness: 0.15,
    transparent: true,
    opacity: 0.38,
    side: THREE.DoubleSide,
  });

  const matrixLedMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0xf4f8ff),
    emissiveIntensity: 1.6,
    roughness: 0.12,
  });

  const taillightBladeMat = new THREE.MeshStandardMaterial({
    color: 0xff2226,
    emissive: new THREE.Color(0xff1418),
    emissiveIntensity: 1.85,
    roughness: 0.15,
  });

  const smokedRedLensMat = new THREE.MeshStandardMaterial({
    color: 0x55080c,
    roughness: 0.08,
    metalness: 0.2,
    transparent: true,
    opacity: 0.55,
  });

  const thirdBrakeLightMat = new THREE.MeshStandardMaterial({
    color: 0xff2020,
    emissive: new THREE.Color(0xff1818),
    emissiveIntensity: 1.5,
    roughness: 0.2,
  });

  const turnSignalAmberMat = new THREE.MeshStandardMaterial({
    color: 0xffaa00,
    emissive: new THREE.Color(0xff9900),
    emissiveIntensity: 0.9,
    roughness: 0.2,
  });

  const mirrorGlassMat = new THREE.MeshStandardMaterial({
    color: 0xd8e4f0,
    roughness: 0.04,
    metalness: 0.96,
  });

  const titaniumExhaustMat = new THREE.MeshStandardMaterial({
    color: 0x8e959e,
    roughness: 0.22,
    metalness: 0.92,
    side: THREE.DoubleSide,
  });

  const burntTitaniumInnerMat = new THREE.MeshStandardMaterial({
    color: 0x4b5d78,
    roughness: 0.28,
    metalness: 0.88,
    side: THREE.DoubleSide,
  });

  const slateLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x232830,
    roughness: 0.58,
    metalness: 0.06,
  });

  const chalkLeatherMat = new THREE.MeshStandardMaterial({
    color: 0xd5d2cb, // Porsche Crayon / Chalk Club Leather contrast
    roughness: 0.52,
    metalness: 0.04,
  });

  const crestMat = new THREE.MeshStandardMaterial({
    map: createPorscheCrestTexture(),
    roughness: 0.22,
    metalness: 0.65,
    transparent: true,
  });

  const pccbYellowMat = new THREE.MeshStandardMaterial({
    color: 0xf5c400, // Iconic Porsche Speed Yellow PCCB calipers
    roughness: 0.22,
    metalness: 0.25,
  });

  // ---------------------------------------------------------------------------
  // 2. Contact Shadow Pad on Garage Resin Floor (`y = 0.002m`)
  // ---------------------------------------------------------------------------
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(4.85, 2.24),
    new THREE.MeshBasicMaterial({
      map: createContactShadowTexture(),
      transparent: true,
      depthWrite: false,
    })
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.set(0, 0.002, 0);
  carGroup.add(shadowPlane);

  // ---------------------------------------------------------------------------
  // 3. Smoothly Lofted Multi-Section 3D Widebody 992.2 Body Shell (`>= 48` stations)
  // ---------------------------------------------------------------------------
  const bodyGroup = new THREE.Group();
  bodyGroup.name = 'outbuildings.garage.porsche992TurboS.bodyShell';
  carGroup.add(bodyGroup);

  const numStations = 60;
  const xMin = -2.26;
  const xMax = 2.24;
  const leftOuterGrid: Array<Array<{ x: number; y: number; z: number }>> = [];
  const rightOuterGrid: Array<Array<{ x: number; y: number; z: number }>> = [];

  for (let i = 0; i < numStations; i++) {
    const frac = i / (numStations - 1);
    const x = xMin + frac * (xMax - xMin);
    const halfPts = sampleOuterBodyHalfProfile(x);

    const leftRow: Array<{ x: number; y: number; z: number }> = [];
    const rightRow: Array<{ x: number; y: number; z: number }> = [];
    for (let j = 0; j < halfPts.length; j++) {
      const pt = halfPts[j]!;
      leftRow.push({ x, y: pt.y, z: -pt.z });
      rightRow.push({ x, y: pt.y, z: pt.z });
    }
    leftOuterGrid.push(leftRow);
    rightOuterGrid.push(rightRow);
  }

  const leftFlankMesh = new THREE.Mesh(
    buildLoftedGridGeometry(leftOuterGrid),
    oceanBlueBodyMat
  );
  leftFlankMesh.name = 'outbuildings.garage.porsche992TurboS.bodyShell';
  leftFlankMesh.castShadow = true;
  leftFlankMesh.receiveShadow = true;
  bodyGroup.add(leftFlankMesh);

  const rightFlankMesh = new THREE.Mesh(
    buildLoftedGridGeometry(rightOuterGrid),
    oceanBlueBodyMat
  );
  rightFlankMesh.name = 'outbuildings.garage.porsche992TurboS.bodyShell';
  rightFlankMesh.castShadow = true;
  rightFlankMesh.receiveShadow = true;
  bodyGroup.add(rightFlankMesh);

  // B. Lofted Sunken 992 Front Hood (Frunk Lid) & Front Bumper Center (`x = -2.26m..-0.80m`)
  //    Features the classic sunken central Porsche 911 hood depression and twin longitudinal hood creases
  const hoodStations = 26;
  const hoodCols = 25;
  const hoodGrid: Array<Array<{ x: number; y: number; z: number }>> = [];
  for (let i = 0; i < hoodStations; i++) {
    const u = i / (hoodStations - 1);
    const x = -2.26 + u * (-0.8 - -2.26);
    const halfPts = sampleOuterBodyHalfProfile(x);
    const innerEdge = halfPts[halfPts.length - 3]!;
    const zEdge = innerEdge.z;
    const yEdge = innerEdge.y;

    // Central hood profile is slightly recessed relative to `yEdge`, with twin creases at `|z| = 0.62 * zEdge`
    const recessDepth = x > -1.92 ? 0.022 * Math.sin(((x - -1.92) / 1.12) * Math.PI) : 0;
    const row: Array<{ x: number; y: number; z: number }> = [];
    for (let j = 0; j < hoodCols; j++) {
      const s = (j / (hoodCols - 1)) * 2 - 1; // -1..+1
      const absS = Math.abs(s);
      const z = s * zEdge;
      const creaseLift =
        x > -1.88 ? 0.009 * Math.exp(-Math.pow((absS - 0.64) / 0.12, 2)) : 0;
      const centerDip = recessDepth * (1 - Math.pow(absS, 2.2));
      const noseCrown = x < -1.88 ? 0.015 * (1 - absS * absS) : 0;
      const y = yEdge - centerDip + creaseLift + noseCrown;
      row.push({ x, y, z });
    }
    hoodGrid.push(row);
  }
  const frontHoodMesh = new THREE.Mesh(
    buildLoftedGridGeometry(hoodGrid),
    oceanBlueBodyMat
  );
  frontHoodMesh.name = 'outbuildings.garage.porsche992TurboS.bodyShell';
  frontHoodMesh.castShadow = true;
  frontHoodMesh.receiveShadow = true;
  bodyGroup.add(frontHoodMesh);

  // Recessed dark frunk shutlines (`x = -1.90m..-0.86m, z = ±0.48m`)
  const shutlinePoints: THREE.Vector3[] = [];
  for (let i = 0; i <= 20; i++) {
    const u = i / 20;
    const sx = -0.86 - u * 1.04;
    const sz = -0.54 + u * 0.12;
    const sy = 0.62 + (1 - u) * 0.145;
    shutlinePoints.push(new THREE.Vector3(sx, sy, sz));
  }
  for (let i = 0; i <= 12; i++) {
    const s = -1 + (i / 12) * 2;
    shutlinePoints.push(new THREE.Vector3(-1.9 - (1 - s * s) * 0.03, 0.618, s * 0.42));
  }
  for (let i = 20; i >= 0; i--) {
    const u = i / 20;
    const sx = -0.86 - u * 1.04;
    const sz = 0.54 - u * 0.12;
    const sy = 0.62 + (1 - u) * 0.145;
    shutlinePoints.push(new THREE.Vector3(sx, sy, sz));
  }
  const frunkShutlineCurve = new THREE.CatmullRomCurve3(shutlinePoints);
  const frunkShutline = new THREE.Mesh(
    new THREE.TubeGeometry(frunkShutlineCurve, 48, 0.0035, 6, false),
    glossBlackTrimMat
  );
  bodyGroup.add(frunkShutline);

  // C. Lofted Rear Decklid, Integrated Ducktail Base & Rear Bumper Center (`x = +1.46m..+2.24m`)
  const rearStations = 22;
  const rearCols = 25;
  const rearGrid: Array<Array<{ x: number; y: number; z: number }>> = [];
  for (let i = 0; i < rearStations; i++) {
    const u = i / (rearStations - 1);
    const x = 1.46 + u * (2.24 - 1.46);
    const halfPts = sampleOuterBodyHalfProfile(x);
    const innerEdge = halfPts[halfPts.length - 3]!;
    const zEdge = innerEdge.z;
    const yEdge = innerEdge.y;

    const row: Array<{ x: number; y: number; z: number }> = [];
    for (let j = 0; j < rearCols; j++) {
      const s = (j / (rearCols - 1)) * 2 - 1;
      const absS = Math.abs(s);
      const z = s * zEdge;
      const crown = 0.018 * (1 - absS * absS);
      row.push({ x, y: yEdge + crown, z });
    }
    rearGrid.push(row);
  }
  const rearDeckMesh = new THREE.Mesh(
    buildLoftedGridGeometry(rearGrid),
    oceanBlueBodyMat
  );
  rearDeckMesh.name = 'outbuildings.garage.porsche992TurboS.bodyShell';
  rearDeckMesh.castShadow = true;
  rearDeckMesh.receiveShadow = true;
  bodyGroup.add(rearDeckMesh);

  // Vertical Rear Bumper Tail Facia & Recessed Lightbar Channel (`x = 2.16m..2.24m`)
  const rearTailGrid: Array<Array<{ x: number; y: number; z: number }>> = [];
  const tailYLevels = [0.16, 0.34, 0.52, 0.71, 0.74, 0.78, 0.84];
  const tailXOffsets = [2.21, 2.25, 2.26, 2.23, 2.16, 2.17, 2.2];
  for (let r = 0; r < tailYLevels.length; r++) {
    const ty = tailYLevels[r]!;
    const tx = tailXOffsets[r]!;
    const row: Array<{ x: number; y: number; z: number }> = [];
    for (let j = 0; j <= 28; j++) {
      const s = (j / 28) * 2 - 1;
      const zSpan = 0.86 - 0.06 * smoothstep(0.65, 0.84, ty);
      const tz = s * zSpan;
      const curveX = tx - 0.14 * Math.pow(Math.abs(s), 2.1);
      row.push({ x: curveX, y: ty, z: tz });
    }
    rearTailGrid.push(row);
  }
  const rearBumperFaceMesh = new THREE.Mesh(
    buildLoftedGridGeometry(rearTailGrid),
    oceanBlueBodyMat
  );
  rearBumperFaceMesh.name = 'outbuildings.garage.porsche992TurboS.bodyShell';
  rearBumperFaceMesh.castShadow = true;
  rearBumperFaceMesh.receiveShadow = true;
  bodyGroup.add(rearBumperFaceMesh);

  // D. Classic 911 Parabolic Flyline Roof Arches (A-Pillars -> Roof Rails -> Fastback C-Pillars)
  //    & Contoured Central Roof Panel (`x = -0.18m..+0.90m`)
  for (const sideZ of [-1, 1] as const) {
    const railPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 32; i++) {
      const u = i / 32;
      const rx = -0.82 + u * (1.54 - -0.82);
      const { y: ry, z: rz } = sampleFlylineRoof(rx);
      railPts.push(new THREE.Vector3(rx, ry, sideZ * rz));
    }
    const railCurve = new THREE.CatmullRomCurve3(railPts);
    const roofArch = new THREE.Mesh(
      new THREE.TubeGeometry(railCurve, 44, 0.036, 12, false),
      oceanBlueBodyMat
    );
    roofArch.name = 'outbuildings.garage.porsche992TurboS.bodyShell';
    roofArch.scale.set(1, 0.72, 1.35);
    roofArch.castShadow = true;
    bodyGroup.add(roofArch);

    // Sculpted C-Pillar Fastback Sail Panel (`x = 0.75m..1.52m`) blending roof arch into widebody haunch
    const sailGrid: Array<Array<{ x: number; y: number; z: number }>> = [];
    for (let i = 0; i <= 14; i++) {
      const u = i / 14;
      const sx = 0.72 + u * (1.52 - 0.72);
      const { y: topY, z: topZ } = sampleFlylineRoof(sx);
      const botY = 0.84 + 0.02 * (1 - u);
      const botZ = 0.68 - 0.14 * u;
      const row: Array<{ x: number; y: number; z: number }> = [];
      for (let j = 0; j <= 6; j++) {
        const v = j / 6;
        row.push({
          x: sx,
          y: botY + (topY - botY) * v,
          z: sideZ * (botZ + (topZ - botZ) * v),
        });
      }
      sailGrid.push(row);
    }
    const sailMesh = new THREE.Mesh(
      buildLoftedGridGeometry(sailGrid),
      oceanBlueBodyMat
    );
    sailMesh.name = 'outbuildings.garage.porsche992TurboS.bodyShell';
    sailMesh.castShadow = true;
    bodyGroup.add(sailMesh);
  }

  // Contoured Central Roof Panel (`x = -0.18m..+0.92m`) with twin longitudinal 992 roof beads
  const roofGrid: Array<Array<{ x: number; y: number; z: number }>> = [];
  for (let i = 0; i <= 22; i++) {
    const u = i / 22;
    const rx = -0.18 + u * (0.92 - -0.18);
    const { y: railY, z: railZ } = sampleFlylineRoof(rx);
    const row: Array<{ x: number; y: number; z: number }> = [];
    for (let j = 0; j <= 20; j++) {
      const s = (j / 20) * 2 - 1;
      const absS = Math.abs(s);
      const rz = s * (railZ - 0.015);
      const dome = 0.024 * (1 - absS * absS);
      const bead = 0.005 * Math.exp(-Math.pow((absS - 0.58) / 0.1, 2));
      row.push({ x: rx, y: railY + dome + bead, z: rz });
    }
    roofGrid.push(row);
  }
  const roofPanelMesh = new THREE.Mesh(
    buildLoftedGridGeometry(roofGrid),
    oceanBlueBodyMat
  );
  roofPanelMesh.name = 'outbuildings.garage.porsche992TurboS.bodyShell';
  roofPanelMesh.castShadow = true;
  roofPanelMesh.receiveShadow = true;
  bodyGroup.add(roofPanelMesh);

  // Sculpted Front Bumper Wrap Fascia (`x = -2.27m..-1.88m`, `y = 0.13..0.52m`)
  const frontFasciaGrid: Array<Array<{ x: number; y: number; z: number }>> = [];
  const frontYLevels = [0.13, 0.19, 0.39, 0.44, 0.51];
  const frontXOffsets = [-2.255, -2.23, -2.235, -2.265, -2.21];
  for (let r = 0; r < frontYLevels.length; r++) {
    const fy = frontYLevels[r]!;
    const fx = frontXOffsets[r]!;
    const row: Array<{ x: number; y: number; z: number }> = [];
    for (let j = 0; j <= 28; j++) {
      const s = (j / 28) * 2 - 1;
      const zSpan = 0.85 - 0.05 * smoothstep(0.35, 0.52, fy);
      const fz = s * zSpan;
      const curveX = fx + 0.34 * Math.pow(Math.abs(s), 1.95);
      row.push({ x: curveX, y: fy, z: fz });
    }
    frontFasciaGrid.push(row);
  }
  const frontBumperFaceMesh = new THREE.Mesh(
    buildLoftedGridGeometry(frontFasciaGrid),
    oceanBlueBodyMat
  );
  frontBumperFaceMesh.name = 'outbuildings.garage.porsche992TurboS.bodyShell';
  frontBumperFaceMesh.castShadow = true;
  frontBumperFaceMesh.receiveShadow = true;
  bodyGroup.add(frontBumperFaceMesh);

  // Gloss-black Daylight Opening (DLO) 911 Spear Window Surround Trim & Door Shutlines
  for (const sideZ of [-1, 1] as const) {
    const dloPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 20; i++) {
      const u = i / 20;
      const gx = -0.7 + u * (0.99 - -0.7);
      const { y: topY, z: topZ } = sampleFlylineRoof(gx);
      const spearPinch = smoothstep(0.42, 0.99, gx);
      dloPts.push(new THREE.Vector3(gx, topY - 0.025 * spearPinch, sideZ * (topZ + 0.008)));
    }
    for (let i = 20; i >= 0; i--) {
      const u = i / 20;
      const gx = -0.7 + u * (0.99 - -0.7);
      const spearPinch = smoothstep(0.42, 0.99, gx);
      const botY = 0.805 + 0.045 * u + 0.11 * spearPinch;
      const botZ = 0.76 - 0.08 * u;
      dloPts.push(new THREE.Vector3(gx, botY, sideZ * (botZ + 0.006)));
    }
    const dloCurve = new THREE.CatmullRomCurve3(dloPts, true);
    const dloTrim = new THREE.Mesh(
      new THREE.TubeGeometry(dloCurve, 64, 0.009, 8, true),
      glossBlackTrimMat
    );
    bodyGroup.add(dloTrim);

    // Door panel shutline curve (`x = -0.60m..+0.36m`)
    const doorSeamPts = [
      new THREE.Vector3(-0.58, 0.79, sideZ * 0.858),
      new THREE.Vector3(-0.6, 0.48, sideZ * 0.868),
      new THREE.Vector3(-0.56, 0.19, sideZ * 0.862),
      new THREE.Vector3(0.34, 0.19, sideZ * 0.858),
      new THREE.Vector3(0.38, 0.48, sideZ * 0.856),
      new THREE.Vector3(0.32, 0.82, sideZ * 0.842),
    ];
    const doorSeam = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(doorSeamPts), 32, 0.003, 6, false),
      glossBlackTrimMat
    );
    bodyGroup.add(doorSeam);
  }

  // Interior overhead rearview mirror & dome console (`x = -0.28m, y = 1.21m, z = 0`)
  const rearViewMirror = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.052, 0.21),
    glossBlackTrimMat
  );
  rearViewMirror.position.set(-0.3, 1.2, 0);
  bodyGroup.add(rearViewMirror);

  // E. Dark Acoustic Wheelhouse Arch Liners, Cabin Floor Tub & Aerodynamic Flat Underbody
  const underbodyPan = new THREE.Mesh(
    new THREE.BoxGeometry(4.36, 0.03, 1.56),
    satinBlackUnderbodyMat
  );
  underbodyPan.position.set(-0.01, 0.14, 0);
  bodyGroup.add(underbodyPan);

  for (const [ax, archR, archW] of [
    [-1.25, 0.362, 0.34],
    [1.2, 0.382, 0.38],
  ] as const) {
    for (const sideZ of [-1, 1] as const) {
      const archDrum = new THREE.Mesh(
        new THREE.CylinderGeometry(archR, archR, archW, 28, 1, false, 0, Math.PI),
        satinBlackUnderbodyMat
      );
      archDrum.rotation.x = Math.PI / 2;
      archDrum.rotation.y = Math.PI / 2;
      archDrum.position.set(ax, 0.34, sideZ * 0.74);
      bodyGroup.add(archDrum);
    }
  }

  // Sculpted Lower Rocker Side Skirts (`y = 0.12..0.22m`) with Turbo S aerodynamic rear kick-ups
  for (const sideZ of [-1, 1] as const) {
    const skirt = new THREE.Mesh(
      new THREE.BoxGeometry(1.56, 0.055, 0.065),
      glossBlackTrimMat
    );
    skirt.position.set(-0.02, 0.155, sideZ * 0.865);
    bodyGroup.add(skirt);

    const skirtWinglet = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.11, 0.045),
      glossCarbonMat
    );
    skirtWinglet.position.set(0.68, 0.185, sideZ * 0.895);
    skirtWinglet.rotation.y = sideZ * 0.14;
    bodyGroup.add(skirtWinglet);
  }

  // ---------------------------------------------------------------------------
  // 4. Sculpted 992.2 Turbo S Side Intercooler Air Intakes (`outbuildings.garage.porsche992TurboS.sideIntake`)
  // ---------------------------------------------------------------------------
  const sideIntakeGroup = new THREE.Group();
  sideIntakeGroup.name = 'outbuildings.garage.porsche992TurboS.sideIntake';
  carGroup.add(sideIntakeGroup);

  for (const sideZ of [-1, 1] as const) {
    const scoopUnit = new THREE.Group();
    scoopUnit.name = 'outbuildings.garage.porsche992TurboS.sideIntake';
    scoopUnit.position.set(0.74, 0.62, sideZ * 0.905);
    scoopUnit.rotation.y = sideZ * 0.16;

    // Dark recessed intercooler duct throat
    const ductRecess = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.21, 0.065),
      satinBlackUnderbodyMat
    );
    scoopUnit.add(ductRecess);

    // Sculpted gloss-carbon outer air scoop surround lip
    const outerCowl = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.23, 0.042),
      glossCarbonMat
    );
    outerCowl.position.set(0.02, 0, sideZ * 0.018);
    scoopUnit.add(outerCowl);

    // Twin horizontal aerodynamic splitter vanes inside the side intake
    for (const vy of [-0.038, 0.038]) {
      const vane = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.012, 0.072),
        turboniteMat
      );
      vane.position.set(-0.01, vy, sideZ * 0.012);
      scoopUnit.add(vane);
    }

    sideIntakeGroup.add(scoopUnit);
  }

  // ---------------------------------------------------------------------------
  // 5. 992.2 Facelift Front Fascia, Active Vertical Cooling Flaps, PAA Lip & 4-Point HD-Matrix Headlights
  // ---------------------------------------------------------------------------
  // A. PAA Deployed Pneumatic Front Lip Spoiler (`outbuildings.garage.porsche992TurboS.frontSpoiler`)
  const frontSpoilerGroup = new THREE.Group();
  frontSpoilerGroup.name = 'outbuildings.garage.porsche992TurboS.frontSpoiler';
  carGroup.add(frontSpoilerGroup);

  const chinPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 28; i++) {
    const s = (i / 28) * 2 - 1;
    const z = s * 0.84;
    const x = -2.275 + 0.26 * Math.pow(Math.abs(s), 1.9);
    chinPts.push(new THREE.Vector3(x, 0.118, z));
  }
  const chinCurve = new THREE.CatmullRomCurve3(chinPts);
  const chinLip = new THREE.Mesh(
    new THREE.TubeGeometry(chinCurve, 36, 0.024, 10, false),
    glossCarbonMat
  );
  chinLip.name = 'outbuildings.garage.porsche992TurboS.frontSpoiler';
  chinLip.scale.set(1.8, 0.65, 1.0);
  frontSpoilerGroup.add(chinLip);

  // Embossed `turbo S` badge strip on the front lip center
  const frontLipBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.24, 0.028),
    new THREE.MeshStandardMaterial({
      map: createRearModelScriptTexture('turbo S', 48),
      transparent: true,
      roughness: 0.3,
    })
  );
  frontLipBadge.rotation.y = -Math.PI / 2;
  frontLipBadge.rotation.z = -0.15;
  frontLipBadge.position.set(-2.295, 0.122, 0);
  frontSpoilerGroup.add(frontLipBadge);

  // B. 992.2 Facelift Active Vertical Cooling Flaps (`outbuildings.garage.porsche992TurboS.frontActiveLouvres`)
  const activeLouvresGroup = new THREE.Group();
  activeLouvresGroup.name = 'outbuildings.garage.porsche992TurboS.frontActiveLouvres';
  carGroup.add(activeLouvresGroup);

  // Central lower radiator intake & ACC radar dome (`z = -0.32..+0.32m`)
  const centerIntakeRecess = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.165, 0.64),
    satinBlackUnderbodyMat
  );
  centerIntakeRecess.position.set(-2.22, 0.24, 0);
  activeLouvresGroup.add(centerIntakeRecess);

  const radarDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.044, 16, 12),
    glossBlackTrimMat
  );
  radarDome.scale.set(0.55, 0.85, 1.0);
  radarDome.position.set(-2.26, 0.21, 0);
  activeLouvresGroup.add(radarDome);

  // Left & Right 992.2 Outer Bumper Intakes with 5 Signature Vertical Active Aerodynamic Cooling Louvres per side
  for (const sideZ of [-1, 1] as const) {
    const podGroup = new THREE.Group();
    podGroup.name = 'outbuildings.garage.porsche992TurboS.frontActiveLouvres';
    podGroup.position.set(-2.16, 0.285, sideZ * 0.56);
    podGroup.rotation.y = sideZ * 0.32;

    const podHousing = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.205, 0.38),
      satinBlackUnderbodyMat
    );
    podGroup.add(podHousing);

    const podFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.152, 0.22, 0.4),
      turboniteMat
    );
    podFrame.position.x = 0.01;
    podGroup.add(podFrame);

    // 5 vertical active cooling flaps per side in satin Turbonite/anthracite
    for (let f = 0; f < 5; f++) {
      const fz = -0.14 + f * 0.07;
      const flap = new THREE.Mesh(
        new THREE.BoxGeometry(0.065, 0.175, 0.016),
        turboniteMat
      );
      flap.name = 'outbuildings.garage.porsche992TurboS.frontActiveLouvres';
      flap.position.set(-0.048, 0, fz);
      flap.rotation.y = sideZ * 0.24; // Angled open for active cooling
      podGroup.add(flap);
    }

    activeLouvresGroup.add(podGroup);
  }

  // Front UK Registration Plate (`"992 TBS"` on white acrylic at `x = -2.275m, y = 0.27m`)
  const frontPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.105, 0.48),
    new THREE.MeshStandardMaterial({
      map: createUkRegistrationPlateTexture('992 TBS', false),
      roughness: 0.2,
      metalness: 0.08,
    })
  );
  frontPlate.position.set(-2.272, 0.285, 0);
  carGroup.add(frontPlate);

  // Porsche Stuttgart Crest on Front Hood (`x = -1.96m, y = 0.618m, z = 0`)
  const hoodCrest = new THREE.Mesh(
    new THREE.PlaneGeometry(0.056, 0.068),
    crestMat
  );
  hoodCrest.rotation.x = -Math.PI / 2;
  hoodCrest.rotation.y = -0.26;
  hoodCrest.rotation.z = -Math.PI / 2;
  hoodCrest.position.set(-1.96, 0.616, 0);
  carGroup.add(hoodCrest);

  // C. Iconic Oval 992.2 HD-Matrix LED 4-Point Headlights (`outbuildings.garage.porsche992TurboS.headlight`)
  const headlightsGroup = new THREE.Group();
  headlightsGroup.name = 'outbuildings.garage.porsche992TurboS.headlight';
  carGroup.add(headlightsGroup);

  for (const sideZ of [-1, 1] as const) {
    const hlUnit = new THREE.Group();
    hlUnit.name = 'outbuildings.garage.porsche992TurboS.headlight';
    hlUnit.position.set(-1.82, 0.655, sideZ * 0.685);
    // Raked back along the sloped 911 front fender pontoon crown
    hlUnit.rotation.z = 0.56;
    hlUnit.rotation.y = sideZ * 0.18;

    // Dark gunmetal oval internal bezel bucket
    const bezelBucket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.145, 0.132, 0.045, 28),
      glossBlackTrimMat
    );
    bezelBucket.scale.set(1.38, 1.0, 0.92);
    hlUnit.add(bezelBucket);

    // Central HD-Matrix high-output projector module
    const matrixCore = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.058, 0.052, 20),
      turboniteMat
    );
    matrixCore.position.y = 0.012;
    hlUnit.add(matrixCore);

    const projectorLens = new THREE.Mesh(
      new THREE.SphereGeometry(0.042, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.5),
      matrixLedMat
    );
    projectorLens.position.y = 0.025;
    hlUnit.add(projectorLens);

    // 4 Signature Porsche glowing warm-white LED daytime running light (DRL) bars
    for (const [lx, lz] of [
      [-0.085, -0.058],
      [-0.085, 0.058],
      [0.082, -0.058],
      [0.082, 0.058],
    ] as const) {
      const drlBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.058, 0.016, 0.022),
        matrixLedMat
      );
      drlBar.name = 'outbuildings.garage.porsche992TurboS.headlight';
      drlBar.position.set(lx, 0.028, lz);
      hlUnit.add(drlBar);
    }

    // Clear angled polycarbonate aerodynamic lens dome (`opacity: 0.38`)
    const clearDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.146, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.48),
      headlightDomeMat
    );
    clearDome.name = 'outbuildings.garage.porsche992TurboS.headlight';
    clearDome.scale.set(1.38, 0.42, 0.92);
    clearDome.position.y = 0.016;
    hlUnit.add(clearDome);

    headlightsGroup.add(hlUnit);
  }

  // ---------------------------------------------------------------------------
  // 6. Tinted Compound-Curved Glazing, Frameless Doors & Aero Side Mirrors (`outbuildings.garage.porsche992TurboS.glazing`)
  // ---------------------------------------------------------------------------
  const glazingGroup = new THREE.Group();
  glazingGroup.name = 'outbuildings.garage.porsche992TurboS.glazing';
  carGroup.add(glazingGroup);

  // A. Compound-Curved Front Windshield (`x = -0.82m..-0.16m`)
  const wsGrid: Array<Array<{ x: number; y: number; z: number }>> = [];
  for (let i = 0; i <= 16; i++) {
    const u = i / 16;
    const wx = -0.82 + u * (-0.16 - -0.82);
    const { y: railY, z: railZ } = sampleFlylineRoof(wx);
    const row: Array<{ x: number; y: number; z: number }> = [];
    for (let j = 0; j <= 20; j++) {
      const s = (j / 20) * 2 - 1;
      const wz = s * (railZ - 0.02);
      const bowX = -0.065 * (1 - s * s) * Math.sin(u * Math.PI * 0.85);
      const bowY = 0.022 * (1 - s * s);
      row.push({ x: wx + bowX, y: railY + bowY, z: wz });
    }
    wsGrid.push(row);
  }
  const windshieldMesh = new THREE.Mesh(
    buildLoftedGridGeometry(wsGrid),
    glazingMat
  );
  windshieldMesh.name = 'outbuildings.garage.porsche992TurboS.glazing';
  glazingGroup.add(windshieldMesh);

  // Dual aero windshield wiper blades at the base of the windshield (`x = -0.80m`)
  for (const wz of [-0.26, 0.18]) {
    const wiper = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.014, 0.46),
      glossBlackTrimMat
    );
    wiper.position.set(-0.81, 0.785, wz);
    wiper.rotation.y = 0.14;
    glazingGroup.add(wiper);
  }

  // B. Frameless Left/Right Door Windows & Iconic 911 Rear Quarter Spear Windows (`x = -0.68m..+0.96m`)
  for (const sideZ of [-1, 1] as const) {
    const sideGlassGrid: Array<Array<{ x: number; y: number; z: number }>> = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const gx = -0.68 + u * (0.98 - -0.68);
      const { y: topY, z: topZ } = sampleFlylineRoof(gx);
      // Iconic 911 spear window taper at the rear (`x > 0.45m`)
      const spearPinch = smoothstep(0.42, 0.98, gx);
      const botY = 0.805 + 0.045 * u + 0.11 * spearPinch;
      const effTopY = topY - 0.03 * spearPinch;
      const botZ = 0.76 - 0.08 * u;

      const row: Array<{ x: number; y: number; z: number }> = [];
      for (let j = 0; j <= 8; j++) {
        const v = j / 8;
        const gy = botY + (effTopY - botY) * v;
        const gz = sideZ * (botZ + (topZ - botZ) * v + 0.012 * Math.sin(v * Math.PI));
        row.push({ x: gx, y: gy, z: gz });
      }
      sideGlassGrid.push(row);
    }
    const sideWindowMesh = new THREE.Mesh(
      buildLoftedGridGeometry(sideGlassGrid),
      glazingMat
    );
    sideWindowMesh.name = 'outbuildings.garage.porsche992TurboS.glazing';
    glazingGroup.add(sideWindowMesh);

    // Internal B-pillar divider bar at `x = +0.26m`
    const bPillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.042, 0.44, 0.022),
      glossBlackTrimMat
    );
    bPillar.position.set(0.26, 1.04, sideZ * 0.64);
    bPillar.rotation.x = sideZ * -0.28;
    glazingGroup.add(bPillar);

    // Flush pop-out Ocean Blue door handles (`x = 0.16m, y = 0.73m, z = ±0.855m`)
    const doorHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.165, 0.028, 0.022),
      oceanBlueBodyMat
    );
    doorHandle.position.set(0.16, 0.73, sideZ * 0.858);
    bodyGroup.add(doorHandle);

    // Sculpted Twin-Stalk Porsche Sport Aero Side Mirrors (`x = -0.46m, y = 0.84m, z = ±0.93m`)
    const mirrorGroup = new THREE.Group();
    mirrorGroup.position.set(-0.46, 0.83, sideZ * 0.83);

    const lowerStalk = new THREE.Mesh(
      new THREE.BoxGeometry(0.085, 0.022, 0.095),
      glossBlackTrimMat
    );
    lowerStalk.position.set(0, -0.015, sideZ * 0.045);
    lowerStalk.rotation.x = sideZ * 0.25;
    mirrorGroup.add(lowerStalk);

    const mirrorCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.068, 18, 14),
      oceanBlueBodyMat
    );
    mirrorCap.scale.set(1.45, 0.72, 1.15);
    mirrorCap.position.set(0.02, 0.015, sideZ * 0.105);
    mirrorGroup.add(mirrorCap);

    const mirrorFace = new THREE.Mesh(
      new THREE.CircleGeometry(0.052, 16),
      mirrorGlassMat
    );
    mirrorFace.scale.set(1.2, 0.75, 1.0);
    mirrorFace.rotation.y = Math.PI / 2;
    mirrorFace.position.set(0.082, 0.015, sideZ * 0.105);
    mirrorGroup.add(mirrorFace);

    const mirrorTurnLed = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.008, 0.075),
      turnSignalAmberMat
    );
    mirrorTurnLed.position.set(-0.02, 0.012, sideZ * 0.115);
    mirrorGroup.add(mirrorTurnLed);

    bodyGroup.add(mirrorGroup);
  }

  // C. Compound-Curved Heated Rear Glass Screen (`x = +0.90m..+1.52m`)
  const rearGlassGrid: Array<Array<{ x: number; y: number; z: number }>> = [];
  for (let i = 0; i <= 14; i++) {
    const u = i / 14;
    const rx = 0.9 + u * (1.52 - 0.9);
    const { y: railY, z: railZ } = sampleFlylineRoof(rx);
    const row: Array<{ x: number; y: number; z: number }> = [];
    for (let j = 0; j <= 18; j++) {
      const s = (j / 18) * 2 - 1;
      const rz = s * (railZ - 0.025);
      const dome = 0.018 * (1 - s * s);
      row.push({ x: rx, y: railY + dome, z: rz });
    }
    rearGlassGrid.push(row);
  }
  const rearScreenMesh = new THREE.Mesh(
    buildLoftedGridGeometry(rearGlassGrid),
    glazingMat
  );
  rearScreenMesh.name = 'outbuildings.garage.porsche992TurboS.glazing';
  glazingGroup.add(rearScreenMesh);

  // ---------------------------------------------------------------------------
  // 7. Detailed 992.2 Interior Cabin (`outbuildings.garage.porsche992TurboS.interior`)
  // ---------------------------------------------------------------------------
  const interiorGroup = new THREE.Group();
  interiorGroup.name = 'outbuildings.garage.porsche992TurboS.interior';
  carGroup.add(interiorGroup);

  // Dark anthracite carpeted cabin tub floor, inner door cards & rear parcel shelf
  const cabinTubFloor = new THREE.Mesh(
    new THREE.BoxGeometry(1.75, 0.04, 1.32),
    slateLeatherMat
  );
  cabinTubFloor.position.set(0.12, 0.24, 0);
  interiorGroup.add(cabinTubFloor);

  for (const sideZ of [-1, 1] as const) {
    const doorCard = new THREE.Mesh(
      new THREE.BoxGeometry(1.18, 0.52, 0.045),
      slateLeatherMat
    );
    doorCard.position.set(-0.1, 0.52, sideZ * 0.68);
    interiorGroup.add(doorCard);

    const doorTrimStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.92, 0.028, 0.052),
      chalkLeatherMat
    );
    doorTrimStrip.position.set(-0.1, 0.64, sideZ * 0.67);
    interiorGroup.add(doorTrimStrip);
  }

  // Central PDK Transmission Tunnel & Metallic Shift Selector (`z = 0`)
  const centerTunnel = new THREE.Mesh(
    new THREE.BoxGeometry(1.38, 0.24, 0.24),
    slateLeatherMat
  );
  centerTunnel.position.set(0.02, 0.38, 0);
  interiorGroup.add(centerTunnel);

  const consoleCarbonTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.022, 0.21),
    glossCarbonMat
  );
  consoleCarbonTop.position.set(-0.24, 0.51, 0);
  consoleCarbonTop.rotation.z = -0.12;
  interiorGroup.add(consoleCarbonTop);

  // Compact 992 PDK Braun-style metallic shift selector nub
  const pdkShifter = new THREE.Mesh(
    new THREE.BoxGeometry(0.048, 0.055, 0.032),
    turboniteMat
  );
  pdkShifter.position.set(-0.26, 0.545, 0);
  pdkShifter.rotation.z = -0.2;
  interiorGroup.add(pdkShifter);

  // Wide Horizontal 992.2 Dashboard Shelf (`x = -0.82m..-0.44m`)
  const dashUpperShelf = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.16, 1.32),
    slateLeatherMat
  );
  dashUpperShelf.position.set(-0.62, 0.74, 0);
  interiorGroup.add(dashUpperShelf);

  const dashChalkAccent = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.045, 1.28),
    chalkLeatherMat
  );
  dashChalkAccent.position.set(-0.44, 0.73, 0);
  interiorGroup.add(dashChalkAccent);

  // Signature Sport Chrono Stopwatch Dial on Top Center of Dashboard (`x = -0.54m, y = 0.85m, z = 0`)
  const chronoPod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.044, 0.048, 0.068, 20),
    slateLeatherMat
  );
  chronoPod.rotation.z = Math.PI / 2 - 0.18;
  chronoPod.position.set(-0.54, 0.845, 0);
  interiorGroup.add(chronoPod);

  const chronoFace = new THREE.Mesh(
    new THREE.CircleGeometry(0.038, 20),
    pccbYellowMat
  );
  chronoFace.rotation.y = Math.PI / 2;
  chronoFace.position.set(-0.504, 0.848, 0);
  interiorGroup.add(chronoFace);

  // 10.9-inch Porsche Communication Management (PCM) Central Touchscreen (`x = -0.45m, y = 0.72m, z = 0`)
  const pcmScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.26, 0.135),
    new THREE.MeshStandardMaterial({
      map: createPcmScreenTexture(),
      emissive: new THREE.Color(0x1a334d),
      emissiveIntensity: 0.45,
      roughness: 0.15,
    })
  );
  pcmScreen.rotation.y = Math.PI / 2;
  pcmScreen.rotation.z = -0.18;
  pcmScreen.position.set(-0.425, 0.715, 0);
  interiorGroup.add(pcmScreen);

  // RHD (UK Crox Farmhouse!) 992.2 Curved Digital Instrument Cluster & GT Sport Steering Wheel (`z = +0.35m`)
  const clusterScreen = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.11, 24, 1, true, -0.65, 1.3),
    new THREE.MeshStandardMaterial({
      map: createCurvedInstrumentClusterTexture(),
      emissive: new THREE.Color(0x22384f),
      emissiveIntensity: 0.55,
      roughness: 0.18,
      side: THREE.DoubleSide,
    })
  );
  clusterScreen.rotation.z = -0.22;
  clusterScreen.rotation.y = Math.PI / 2;
  clusterScreen.position.set(-0.66, 0.795, 0.35);
  interiorGroup.add(clusterScreen);

  // GT Sport Steering Wheel (`x = -0.38m, y = 0.77m, z = +0.35m`)
  const wheelColGroup = new THREE.Group();
  wheelColGroup.position.set(-0.38, 0.765, 0.35);
  wheelColGroup.rotation.z = -0.34;

  const steeringCol = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.042, 0.18, 16),
    slateLeatherMat
  );
  steeringCol.rotation.z = Math.PI / 2;
  steeringCol.position.x = -0.09;
  wheelColGroup.add(steeringCol);

  const steeringRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.165, 0.021, 14, 32),
    slateLeatherMat
  );
  steeringRim.rotation.y = Math.PI / 2;
  wheelColGroup.add(steeringRim);

  // Yellow 12-o'clock top-center marker ring & rotary Sport Chrono drive-mode dial
  const topMarker = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.022, 0.045),
    pccbYellowMat
  );
  topMarker.position.set(0, 0.165, 0);
  wheelColGroup.add(topMarker);

  const airbagBoss = new THREE.Mesh(
    new THREE.CylinderGeometry(0.058, 0.058, 0.035, 20),
    slateLeatherMat
  );
  airbagBoss.rotation.z = Math.PI / 2;
  wheelColGroup.add(airbagBoss);

  const modeDial = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.022, 14),
    turboniteMat
  );
  modeDial.rotation.z = Math.PI / 2;
  modeDial.position.set(0.016, -0.068, 0.072);
  wheelColGroup.add(modeDial);

  interiorGroup.add(wheelColGroup);

  // Two 18-Way Adaptive Sport Seats Plus (`x = -0.04m, z = ±0.35m`) in Slate Grey & Chalk/Crayon Club Leather
  for (const seatZ of [-0.35, 0.35]) {
    const seatGroup = new THREE.Group();
    seatGroup.name = 'outbuildings.garage.porsche992TurboS.interior';
    seatGroup.position.set(-0.02, 0.28, seatZ);

    // Lower seat cushion & Chalk quilted center insert
    const cushionBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.095, 0.46),
      slateLeatherMat
    );
    cushionBase.position.set(-0.04, 0.06, 0);
    cushionBase.rotation.z = 0.08;
    seatGroup.add(cushionBase);

    const cushionCenter = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.025, 0.28),
      chalkLeatherMat
    );
    cushionCenter.position.set(-0.04, 0.105, 0);
    cushionCenter.rotation.z = 0.08;
    seatGroup.add(cushionCenter);

    // High lateral thigh bolsters
    for (const bz of [-0.2, 0.2]) {
      const thighBolster = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.068, 0.075),
        slateLeatherMat
      );
      thighBolster.position.set(-0.04, 0.12, bz);
      thighBolster.rotation.z = 0.08;
      seatGroup.add(thighBolster);
    }

    // Sculpted reclined backrest with integrated Porsche 911 headrest & carbon-fiber rear shell
    const backrestGroup = new THREE.Group();
    backrestGroup.position.set(0.16, 0.1, 0);
    backrestGroup.rotation.z = -0.26;

    const backShell = new THREE.Mesh(
      new THREE.BoxGeometry(0.085, 0.62, 0.44),
      glossCarbonMat
    );
    backShell.position.set(0.02, 0.31, 0);
    backrestGroup.add(backShell);

    const backPad = new THREE.Mesh(
      new THREE.BoxGeometry(0.075, 0.58, 0.32),
      chalkLeatherMat
    );
    backPad.position.set(-0.015, 0.3, 0);
    backrestGroup.add(backPad);

    for (const bz of [-0.19, 0.19]) {
      const shoulderBolster = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.54, 0.085),
        slateLeatherMat
      );
      shoulderBolster.position.set(-0.02, 0.28, bz);
      backrestGroup.add(shoulderBolster);
    }

    const headrest = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 16, 12),
      slateLeatherMat
    );
    headrest.scale.set(0.65, 1.25, 1.15);
    headrest.position.set(-0.01, 0.66, 0);
    backrestGroup.add(headrest);

    seatGroup.add(backrestGroup);
    interiorGroup.add(seatGroup);
  }

  // Two Compact 911 Rear `+2` Bucket Seats (`x = +0.68m, z = ±0.28m`)
  for (const rz of [-0.28, 0.28]) {
    const rearSeat = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.08, 0.34),
      slateLeatherMat
    );
    rearSeat.position.set(0.66, 0.36, rz);
    interiorGroup.add(rearSeat);

    const rearBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.075, 0.38, 0.32),
      chalkLeatherMat
    );
    rearBack.position.set(0.82, 0.54, rz);
    rearBack.rotation.z = -0.14;
    interiorGroup.add(rearBack);
  }

  // ---------------------------------------------------------------------------
  // 8. 992.2 Rear Engine Decklid Grille, Active Dual-Plane PAA Turbo S Wing, Lightbar & Quad Titanium Exhaust
  // ---------------------------------------------------------------------------
  // A. Rear Decklid Grille (`outbuildings.garage.porsche992TurboS.rearDecklidGrille`)
  const decklidGrilleGroup = new THREE.Group();
  decklidGrilleGroup.name = 'outbuildings.garage.porsche992TurboS.rearDecklidGrille';
  decklidGrilleGroup.position.set(1.7, 0.855, 0);
  decklidGrilleGroup.rotation.z = -0.12;
  carGroup.add(decklidGrilleGroup);

  const grilleBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.024, 0.88),
    glossBlackTrimMat
  );
  decklidGrilleGroup.add(grilleBase);

  // 9 Vertical intake slats per side + central twin vertical LED third brake light strips
  for (let s = -9; s <= 9; s++) {
    if (s === 0) continue;
    const isBrakeLight = Math.abs(s) === 1;
    const slat = new THREE.Mesh(
      new THREE.BoxGeometry(0.31, isBrakeLight ? 0.022 : 0.016, isBrakeLight ? 0.014 : 0.008),
      isBrakeLight ? thirdBrakeLightMat : turboniteMat
    );
    slat.name = 'outbuildings.garage.porsche992TurboS.rearDecklidGrille';
    slat.position.set(0, 0.014, s * 0.044);
    decklidGrilleGroup.add(slat);
  }

  // B. Porsche Active Aerodynamics (PAA) Dual-Plane Turbo S Rear Wing (`outbuildings.garage.porsche992TurboS.rearWing`)
  const rearWingGroup = new THREE.Group();
  rearWingGroup.name = 'outbuildings.garage.porsche992TurboS.rearWing';
  carGroup.add(rearWingGroup);

  // Sculpted lower ducktail spoiler base (`x = 2.04m, y = 0.84m`)
  const ducktailBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.045, 1.32),
    oceanBlueBodyMat
  );
  ducktailBase.name = 'outbuildings.garage.porsche992TurboS.rearWing';
  ducktailBase.position.set(2.02, 0.835, 0);
  ducktailBase.rotation.z = 0.14;
  rearWingGroup.add(ducktailBase);

  // Twin hydraulic telescopic wing struts (`z = ±0.42m`)
  for (const sz of [-0.42, 0.42]) {
    const outerStrut = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.026, 0.11, 14),
      glossBlackTrimMat
    );
    outerStrut.position.set(1.98, 0.89, sz);
    outerStrut.rotation.z = -0.18;
    rearWingGroup.add(outerStrut);

    const innerPiston = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.09, 12),
      titaniumExhaustMat
    );
    innerPiston.position.set(1.99, 0.925, sz);
    innerPiston.rotation.z = -0.18;
    rearWingGroup.add(innerPiston);
  }

  // Deployed Upper Curved Aerofoil Wing Blade (`width = 1.48m` at `x = 2.00m, y = 0.965m`)
  const wingGrid: Array<Array<{ x: number; y: number; z: number }>> = [];
  for (let i = 0; i <= 10; i++) {
    const u = i / 10; // chord from leading edge to trailing edge
    const chord = 0.28;
    const row: Array<{ x: number; y: number; z: number }> = [];
    for (let j = 0; j <= 28; j++) {
      const s = (j / 28) * 2 - 1;
      const wz = s * 0.74;
      const sweepX = 1.88 + u * chord - 0.08 * Math.pow(Math.abs(s), 1.8);
      const camberY = 0.955 + 0.022 * Math.sin(u * Math.PI) + 0.028 * u;
      row.push({ x: sweepX, y: camberY, z: wz });
    }
    wingGrid.push(row);
  }
  const upperWingBlade = new THREE.Mesh(
    buildLoftedGridGeometry(wingGrid),
    oceanBlueBodyMat
  );
  upperWingBlade.name = 'outbuildings.garage.porsche992TurboS.rearWing';
  upperWingBlade.castShadow = true;
  rearWingGroup.add(upperWingBlade);

  // Carbon-fiber Gurney flap along the trailing edge + upturned Turbo S side winglets/endplates (`z = ±0.74m`)
  const gurneyFlap = new THREE.Mesh(
    new THREE.BoxGeometry(0.032, 0.022, 1.46),
    glossCarbonMat
  );
  gurneyFlap.name = 'outbuildings.garage.porsche992TurboS.rearWing';
  gurneyFlap.position.set(2.12, 0.985, 0);
  rearWingGroup.add(gurneyFlap);

  for (const sideZ of [-1, 1] as const) {
    const endplate = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.068, 0.022),
      oceanBlueBodyMat
    );
    endplate.name = 'outbuildings.garage.porsche992TurboS.rearWing';
    endplate.position.set(1.96, 0.975, sideZ * 0.74);
    endplate.rotation.x = sideZ * -0.28;
    rearWingGroup.add(endplate);
  }

  // C. Continuous 3D Full-Width LED Taillight Bar (`outbuildings.garage.porsche992TurboS.taillightBar`)
  const taillightGroup = new THREE.Group();
  taillightGroup.name = 'outbuildings.garage.porsche992TurboS.taillightBar';
  carGroup.add(taillightGroup);

  const lightbarPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 32; i++) {
    const s = (i / 32) * 2 - 1;
    const z = s * 0.82;
    const x = 2.2 - 0.135 * Math.pow(Math.abs(s), 2.05);
    lightbarPts.push(new THREE.Vector3(x, 0.755, z));
  }
  const lightbarCurve = new THREE.CatmullRomCurve3(lightbarPts);

  // Glowing crimson-red 3D LED light blade (`emissive: 0xff1418, emissiveIntensity: 1.85`)
  const ledBladeMesh = new THREE.Mesh(
    new THREE.TubeGeometry(lightbarCurve, 44, 0.012, 10, false),
    taillightBladeMat
  );
  ledBladeMesh.name = 'outbuildings.garage.porsche992TurboS.taillightBar';
  taillightGroup.add(ledBladeMesh);

  // Translucent smoked-red outer lens cover
  const lensCoverMesh = new THREE.Mesh(
    new THREE.TubeGeometry(lightbarCurve, 44, 0.022, 12, false),
    smokedRedLensMat
  );
  lensCoverMesh.name = 'outbuildings.garage.porsche992TurboS.taillightBar';
  lensCoverMesh.scale.set(0.85, 1.15, 1.0);
  taillightGroup.add(lensCoverMesh);

  // 4-point rear LED brake light segments at left and right outer corners (`z = ±0.64..0.78m`)
  for (const sideZ of [-1, 1] as const) {
    for (let seg = 0; seg < 4; seg++) {
      const sz = sideZ * (0.62 + seg * 0.048);
      const sx = 2.205 - 0.135 * Math.pow(Math.abs(sz / 0.82), 2.05);
      const quadSeg = new THREE.Mesh(
        new THREE.BoxGeometry(0.024, 0.026, 0.032),
        taillightBladeMat
      );
      quadSeg.name = 'outbuildings.garage.porsche992TurboS.taillightBar';
      quadSeg.position.set(sx, 0.755, sz);
      taillightGroup.add(quadSeg);
    }
  }

  // `P O R S C H E` & `911 turbo S` Turbonite rear script badges (`x = 2.22m, y = 0.71m` and `y = 0.65m`)
  const porscheLetters = new THREE.Mesh(
    new THREE.PlaneGeometry(0.52, 0.042),
    new THREE.MeshStandardMaterial({
      map: createRearModelScriptTexture('P  O  R  S  C  H  E', 38),
      transparent: true,
      roughness: 0.25,
      metalness: 0.75,
    })
  );
  porscheLetters.rotation.y = Math.PI / 2;
  porscheLetters.position.set(2.222, 0.722, 0);
  taillightGroup.add(porscheLetters);

  const turboSBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.32, 0.048),
    new THREE.MeshStandardMaterial({
      map: createRearModelScriptTexture('911 turbo S', 46),
      transparent: true,
      roughness: 0.25,
      metalness: 0.75,
    })
  );
  turboSBadge.rotation.y = Math.PI / 2;
  turboSBadge.position.set(2.248, 0.655, 0);
  taillightGroup.add(turboSBadge);

  // Rear UK Number Plate (`"992 TBS"` on yellow acrylic plate at `x = 2.26m, y = 0.43m`)
  const rearPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.11, 0.51),
    new THREE.MeshStandardMaterial({
      map: createUkRegistrationPlateTexture('992 TBS', true),
      roughness: 0.2,
      metalness: 0.08,
    })
  );
  rearPlate.position.set(2.258, 0.435, 0);
  carGroup.add(rearPlate);

  // Rear bumper side intercooler outlet vents (`x = 2.14m, y = 0.46m, z = ±0.76m`)
  for (const sideZ of [-1, 1] as const) {
    const rearOutlet = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.17, 0.16),
      satinBlackUnderbodyMat
    );
    rearOutlet.position.set(2.14, 0.45, sideZ * 0.74);
    rearOutlet.rotation.y = sideZ * -0.42;
    carGroup.add(rearOutlet);
  }

  // D. Rear Venturi Diffuser & 992.2 Turbo S Titanium Sport Exhaust Tailpipes (`outbuildings.garage.porsche992TurboS.exhaust`)
  const exhaustGroup = new THREE.Group();
  exhaustGroup.name = 'outbuildings.garage.porsche992TurboS.exhaust';
  carGroup.add(exhaustGroup);

  const diffuserShell = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.175, 1.48),
    glossBlackTrimMat
  );
  diffuserShell.name = 'outbuildings.garage.porsche992TurboS.exhaust';
  diffuserShell.position.set(2.15, 0.235, 0);
  exhaustGroup.add(diffuserShell);

  // 6 Vertical aerodynamic venturi strake fins across the central diffuser
  for (const fz of [-0.36, -0.22, -0.08, 0.08, 0.22, 0.36]) {
    const strake = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.155, 0.016),
      turboniteMat
    );
    strake.name = 'outbuildings.garage.porsche992TurboS.exhaust';
    strake.position.set(2.17, 0.22, fz);
    exhaustGroup.add(strake);
  }

  // Signature Porsche Turbo S Oval / Quad Titanium Sport Exhaust Tailpipes (`z = ±0.54m`)
  for (const sideZ of [-1, 1] as const) {
    const pipeCluster = new THREE.Group();
    pipeCluster.name = 'outbuildings.garage.porsche992TurboS.exhaust';
    pipeCluster.position.set(2.2, 0.235, sideZ * 0.54);
    pipeCluster.rotation.y = sideZ * -0.14;

    // Sculpted outer titanium oval surround bezel
    const outerOval = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.072, 0.14, 24, 1, true),
      titaniumExhaustMat
    );
    outerOval.name = 'outbuildings.garage.porsche992TurboS.exhaust';
    outerOval.rotation.z = Math.PI / 2;
    outerOval.scale.set(0.76, 1.0, 1.65);
    pipeCluster.add(outerOval);

    // Twin inner burnt-titanium exhaust barrels inside each oval housing
    for (const innerZ of [-0.046, 0.046]) {
      const innerPipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.038, 0.04, 0.15, 20, 1, true),
        burntTitaniumInnerMat
      );
      innerPipe.name = 'outbuildings.garage.porsche992TurboS.exhaust';
      innerPipe.rotation.z = Math.PI / 2;
      innerPipe.position.set(0.008, 0, innerZ);
      pipeCluster.add(innerPipe);

      const darkBore = new THREE.Mesh(
        new THREE.CylinderGeometry(0.034, 0.034, 0.12, 16),
        satinBlackUnderbodyMat
      );
      darkBore.rotation.z = Math.PI / 2;
      darkBore.position.set(-0.01, 0, innerZ);
      pipeCluster.add(darkBore);
    }

    exhaustGroup.add(pipeCluster);
  }

  // ---------------------------------------------------------------------------
  // 9. Staggered 20"/21" Turbo S Exclusive Design Center-Lock Wheels & Yellow PCCB Ceramic Brakes
  // ---------------------------------------------------------------------------
  const tireRubberMat = new THREE.MeshStandardMaterial({
    color: 0x16181c,
    roughness: 0.82,
    metalness: 0.06,
  });
  const frontSidewallMat = new THREE.MeshStandardMaterial({
    map: createTireSidewallTexture('255/35 ZR 20'),
    roughness: 0.72,
    metalness: 0.05,
  });
  const rearSidewallMat = new THREE.MeshStandardMaterial({
    map: createTireSidewallTexture('315/30 ZR 21'),
    roughness: 0.72,
    metalness: 0.05,
  });
  const machinedAlloyMat = new THREE.MeshStandardMaterial({
    color: 0xdce2ea,
    roughness: 0.16,
    metalness: 0.94,
  });
  const pccbRotorMat = new THREE.MeshStandardMaterial({
    map: createPccbRotorTexture(),
    roughness: 0.34,
    metalness: 0.68,
  });

  // Front Left & Right (`255/35 ZR20`, `tireR = 0.340m, width = 0.265m` at `x = -1.25m, y = 0.340m, z = ±0.80m`)
  for (const sideZ of [-1, 1] as const) {
    const frontWheel = buildTurboSWheelAssembly(
      0.34,
      0.265,
      0.254, // 20-inch rim radius
      0.21, // 420mm PCCB front rotor radius
      sideZ,
      true,
      {
        tireRubberMat,
        sidewallMat: frontSidewallMat,
        machinedAlloyMat,
        turboniteBarrelMat: turboniteMat,
        pccbRotorMat,
        pccbYellowMat,
        crestCapMat: crestMat,
        darkMetalMat: glossBlackTrimMat,
      }
    );
    frontWheel.position.set(-1.25, 0.34, sideZ * 0.795);
    // Subtle 4-degree dynamic showroom front wheel turn
    frontWheel.rotation.y = 0.07;
    carGroup.add(frontWheel);
  }

  // Rear Left & Right (`315/30 ZR21`, `tireR = 0.358m, width = 0.325m` at `x = +1.20m, y = 0.358m, z = ±0.82m`)
  for (const sideZ of [-1, 1] as const) {
    const rearWheel = buildTurboSWheelAssembly(
      0.358,
      0.325,
      0.267, // 21-inch rim radius
      0.195, // 390mm PCCB rear rotor radius
      sideZ,
      false,
      {
        tireRubberMat,
        sidewallMat: rearSidewallMat,
        machinedAlloyMat,
        turboniteBarrelMat: turboniteMat,
        pccbRotorMat,
        pccbYellowMat,
        crestCapMat: crestMat,
        darkMetalMat: glossBlackTrimMat,
      }
    );
    rearWheel.position.set(1.2, 0.358, sideZ * 0.81);
    carGroup.add(rearWheel);
  }

  // Ensure all objects inside `carGroup` inherit `userData.zone = 'study'` to match `outbuildings.garage.resinFloor`
  carGroup.traverse((obj) => {
    obj.userData.zone = 'study';
  });
}
