import * as THREE from 'three';

/**
 * Creates a procedural brushed "Washed Oak" texture matching The Cotswold Company
 * Leafield Washed Oak collection (pale lime-washed warm golden-taupe oak grain).
 */
function createWashedOakTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#b99d7a';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 180; i++) {
      const y = (i * 1.43) % 256;
      const isLightPore = i % 3 === 0;
      ctx.strokeStyle = isLightPore
        ? 'rgba(232, 220, 202, 0.24)'
        : 'rgba(136, 106, 74, 0.18)';
      ctx.lineWidth = isLightPore ? 1.1 : 1.6;
      ctx.beginPath();
      ctx.moveTo(0, y);
      const wave = Math.sin(i * 0.37) * 3.5;
      ctx.bezierCurveTo(85, y + wave, 170, y - wave, 256, y);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Creates the warm cream & caramel-ochre pinstriped quilted throw texture
 * seen folded across the upper-middle of the bed in `media_1790946394645.jpg`.
 */
function createStripedQuiltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#e7d9c4';
    ctx.fillRect(0, 0, 256, 256);

    // Fine warm caramel/tan ticking pinstripes running across the throw
    for (let y = 0; y < 256; y += 6) {
      ctx.fillStyle = 'rgba(168, 128, 88, 0.55)';
      ctx.fillRect(0, y, 256, 2.2);
      ctx.fillStyle = 'rgba(246, 238, 225, 0.45)';
      ctx.fillRect(0, y + 3, 256, 1.5);
    }

    // Subtle quilted channel stitching
    ctx.strokeStyle = 'rgba(132, 98, 66, 0.25)';
    ctx.lineWidth = 1.2;
    for (let x = 16; x < 256; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Creates a deep charcoal-slate waffle/tufted quilted bedspread texture & bump map
 * matching the middle dark quilted throw in `media_1790946394645.jpg`.
 */
function createCharcoalWaffleQuiltTexture(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = 256;
  colorCanvas.height = 256;
  const cCtx = colorCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 256;
  bumpCanvas.height = 256;
  const bCtx = bumpCanvas.getContext('2d');

  const cell = 16;
  if (cCtx && bCtx) {
    cCtx.fillStyle = '#484f57';
    cCtx.fillRect(0, 0, 256, 256);

    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, 256, 256);

    for (let gx = 0; gx < 256; gx += cell) {
      for (let gy = 0; gy < 256; gy += cell) {
        // Puffy quilted pillow cell
        const grad = bCtx.createRadialGradient(
          gx + cell * 0.5,
          gy + cell * 0.5,
          1,
          gx + cell * 0.5,
          gy + cell * 0.5,
          cell * 0.65
        );
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.75, '#a8a8a8');
        grad.addColorStop(1, '#282828');
        bCtx.fillStyle = grad;
        bCtx.fillRect(gx, gy, cell, cell);

        // Subtle highlight/shadow in color map
        cCtx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        cCtx.fillRect(gx + 2, gy + 2, cell - 4, cell - 4);
        cCtx.strokeStyle = 'rgba(28, 32, 38, 0.42)';
        cCtx.lineWidth = 1.4;
        cCtx.strokeRect(gx + 0.5, gy + 0.5, cell - 1, cell - 1);
      }
    }
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(3.5, 6.5);
  map.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(3.5, 6.5);

  return { map, bumpMap };
}

/**
 * Creates the Indian block-print botanical floral eiderdown quilt texture with
 * an integrated multi-band geometric border along the hanging edges (`media_1790946394645.jpg`).
 */
function createBotanicalEiderdownTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Warm ecru/oatmeal quilted cotton ground
    ctx.fillStyle = '#eae0ce';
    ctx.fillRect(0, 0, 512, 512);

    // Fine vertical kantha/quilted running-stitch lines
    ctx.strokeStyle = 'rgba(165, 148, 124, 0.32)';
    ctx.lineWidth = 1;
    for (let x = 6; x < 512; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }

    // Dense trailing block-print botanical vine & marigold/peony pattern across the field
    const step = 44;
    for (let gx = 28; gx < 484; gx += step) {
      for (let gy = 28; gy < 484; gy += step) {
        const ox = gx + ((Math.floor(gy / step) % 2) * 18 - 9);
        const oy = gy;

        // Curving leafy vine stems
        ctx.strokeStyle = '#55664e';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(ox - 14, oy + 14);
        ctx.quadraticCurveTo(ox - 2, oy, ox + 12, oy - 13);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(ox + 12, oy + 12);
        ctx.quadraticCurveTo(ox + 2, oy + 2, ox - 10, oy - 11);
        ctx.stroke();

        // Sage & olive block-printed leaves
        ctx.fillStyle = '#687b5e';
        for (const [lx, ly, ang] of [
          [-8, 5, -0.5],
          [7, -2, 0.5],
          [-6, -7, -0.8],
          [8, 7, 0.7],
        ] as const) {
          ctx.beginPath();
          ctx.ellipse(ox + lx, oy + ly, 6.5, 3.0, ang, 0, Math.PI * 2);
          ctx.fill();
        }

        // Terracotta-rose & warm ochre-gold botanical flower heads
        const isRose = (Math.floor(gx / step) + Math.floor(gy / step)) % 2 === 0;
        ctx.fillStyle = isRose ? '#b4684e' : '#c69250';
        for (let p = 0; p < 6; p++) {
          const a = (p / 6) * Math.PI * 2;
          ctx.beginPath();
          ctx.ellipse(
            ox + Math.cos(a) * 5.2,
            oy - 4 + Math.sin(a) * 5.2,
            4.2,
            2.6,
            a,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
        ctx.fillStyle = isRose ? '#d8a968' : '#9c523c';
        ctx.beginPath();
        ctx.arc(ox, oy - 4, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Decorative multi-band Indian block-print border along the hanging edges:
    // Left skirt (y near 0), Right skirt (y near 512), and Foot drape (x near 512)
    const drawBorderStrip = (
      x0: number,
      y0: number,
      w: number,
      h: number,
      horizontal: boolean
    ): void => {
      // Outer warm terracotta-tan framing bands
      ctx.fillStyle = '#c48c64';
      ctx.fillRect(x0, y0, w, h);

      // Inner pale sage-blue & cream geometric block-print vine band
      const inset = 6;
      ctx.fillStyle = '#7e8f88';
      if (horizontal) {
        ctx.fillRect(x0, y0 + inset, w, h - inset * 2);
        ctx.fillStyle = '#efe5d4';
        for (let bx = x0 + 8; bx < x0 + w - 8; bx += 14) {
          ctx.beginPath();
          ctx.arc(bx, y0 + h * 0.5, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillRect(x0 + inset, y0, w - inset * 2, h);
        ctx.fillStyle = '#efe5d4';
        for (let by = y0 + 8; by < y0 + h - 8; by += 14) {
          ctx.beginPath();
          ctx.arc(x0 + w * 0.5, by, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    // Border bands near v = 0 (y = 14..42), v = 1 (y = 470..498), and foot edge u = 1 (x = 466..498)
    drawBorderStrip(0, 12, 512, 28, true);
    drawBorderStrip(0, 472, 512, 28, true);
    drawBorderStrip(468, 12, 30, 488, false);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Creates the mocha/taupe houndstooth check texture for the front-left scatter cushion
 * (`media_1790946394645.jpg`).
 */
function createHoundstoothCushionTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ede4d5';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#5a4d41';
    const step = 8;
    for (let x = 0; x < 128; x += step) {
      for (let y = 0; y < 128; y += step) {
        ctx.fillRect(x, y, step * 0.55, step * 0.55);
        ctx.fillRect(x + step * 0.35, y + step * 0.35, step * 0.35, step * 0.25);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2.5);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Creates the cream & dark-olive embroidered leaf-vine stripe texture for the
 * front-right scatter cushion in `media_1790946394645.jpg`.
 */
function createLeafStripeCushionTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#eae0cf';
    ctx.fillRect(0, 0, 256, 256);

    for (const sx of [52, 128, 204]) {
      // Flanking woven charcoal/olive pinstripes
      ctx.fillStyle = '#474b42';
      ctx.fillRect(sx - 18, 0, 2.5, 256);
      ctx.fillRect(sx + 16, 0, 2.5, 256);

      // Central stem
      ctx.fillRect(sx - 1, 0, 2, 256);

      // Opposite pairs of embroidered dark-olive leaves climbing the stripe
      for (let y = 14; y < 256; y += 22) {
        ctx.beginPath();
        ctx.ellipse(sx - 7, y, 6.5, 3.2, -0.55, 0, Math.PI * 2);
        ctx.ellipse(sx + 7, y - 4, 6.5, 3.2, 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

interface DrapedBedLayerOptions {
  /** Start X in bedGroup local coords (head side) */
  readonly xStart: number;
  /** End X in bedGroup local coords (foot side) */
  readonly xEnd: number;
  /** Normal offset outward from the master mattress/side-rail drape envelope */
  readonly shellOffset: number;
  /** Thickness (loft) of the quilted/filled textile layer */
  readonly loftThickness: number;
  /** Bottom Y of the hanging side skirt hems */
  readonly sideHemY: number;
  /** Outward Z flare at the bottom of the hanging side skirt */
  readonly sideFlareZ: number;
  /** Number of natural drapery waves along X on the hanging side skirts */
  readonly sideWaveCount: number;
  /** Amplitude of natural drapery waves along the side skirts */
  readonly sideWaveAmp: number;
  /** Phase offset for side drapery waves */
  readonly wavePhaseOffset?: number;
  /** Whether the layer curves down over the foot shoulder of the mattress */
  readonly drapeOverFoot?: boolean;
  /** Whether the head edge (u = 0) has a plump folded-over turn-down roll */
  readonly headRolledFold?: boolean;
  readonly segU?: number;
  readonly segV?: number;
}

/**
 * Generates a continuous, thick 3D draped textile layer (duvet, quilted throw, or eiderdown)
 * evaluated as an offset shell around a master mattress-and-side-rail drape surface.
 * This guarantees:
 * 1. Smooth C1 shoulder rolls over both sides of the mattress and down over the oak side rails (`|z| > 0.955m`).
 * 2. Zero intersection or Z-fighting between stacked layers (`duvet`, `stripedFold`, `charcoalThrow`, `floralQuilt`).
 * 3. Softly tucked/rolled leading and trailing edges (`u = 0` and `u = 1`) so layers never float like boxes.
 */
function createDrapedBedLayerGeometry(
  opts: DrapedBedLayerOptions
): THREE.BufferGeometry {
  const {
    xStart,
    xEnd,
    shellOffset,
    loftThickness,
    sideHemY,
    sideFlareZ,
    sideWaveCount,
    sideWaveAmp,
    wavePhaseOffset = 0,
    drapeOverFoot = false,
    headRolledFold = false,
    segU = 44,
    segV = 72,
  } = opts;

  const topHalfWidthZ = 0.855;
  const shoulderRadius = 0.098; // Exits shoulder at |z| = 0.953m, y = 0.468m (cleanly outside sideRailCap at |z| = 0.948m, y = 0.431m)
  const centerTopY = 0.598;
  const crownArchY = 0.032;
  const vRollStart = 0.46;
  const vShoulder = 0.60;

  // Evaluates the base master surface + outward normal at (u, v), then applies shellOffset
  const sampleLayerMidSurface = (u: number, v: number): THREE.Vector3 => {
    const absV = Math.abs(v);
    const signV = v < 0 ? -1 : 1;

    let x = THREE.MathUtils.lerp(xStart, xEnd, u);

    // Foot-end mattress shoulder roll (tucking neatly behind the oak footboard at x = 2.076m)
    let footDropY = 0;
    let cornerWaterfallFlareZ = 0;
    let cornerWaterfallDropY = 0;
    const footShoulderX = 1.88;
    if (drapeOverFoot && x > footShoulderX) {
      const ft = Math.min(1, (x - footShoulderX) / Math.max(0.05, xEnd - footShoulderX));
      const footCurve = ft * ft * (3 - 2 * ft);
      footDropY = 0.145 * footCurve;
      x += Math.sin(ft * Math.PI) * 0.008;

      // Flared waterfall corner fold at the two foot corners (`media_1790946394645.jpg` foreground)
      if (absV > vRollStart) {
        const st = (absV - vRollStart) / (1 - vRollStart);
        const cornerWeight = ft * st;
        cornerWaterfallFlareZ =
          cornerWeight * (0.042 + 0.018 * Math.sin(st * Math.PI));
        cornerWaterfallDropY = cornerWeight * 0.048;
      }
    }

    // Subtle organic linen billow across the top of the bed
    const topBillowY =
      0.0035 *
      Math.sin(u * Math.PI * 3.0 + wavePhaseOffset) *
      Math.cos((v / vShoulder) * Math.PI * 1.5) *
      Math.max(0, 1 - absV / vShoulder);

    const shoulderTopY = centerTopY - crownArchY - footDropY * 0.32;

    let baseZMag: number;
    let baseY: number;
    let normY: number;
    let normZMag: number;

    if (absV <= vRollStart) {
      const tv = absV / vRollStart; // 0..1 across flat/crowned top
      baseZMag = tv * topHalfWidthZ;
      const crownProfile = 1 - tv * tv;
      baseY =
        shoulderTopY +
        crownArchY * crownProfile -
        footDropY * 0.68 * (1 - 0.3 * tv) +
        topBillowY;

      // Approximate normal in (Y, |Z|) plane
      const dyDz = (-2 * crownArchY * tv) / topHalfWidthZ;
      const len = Math.hypot(1, dyDz);
      normY = 1 / len;
      normZMag = -dyDz / len;
    } else if (absV <= vShoulder) {
      // Smooth 90° quarter-circle shoulder roll over the edge of the mattress
      const tr = (absV - vRollStart) / (vShoulder - vRollStart); // 0..1
      const ang = tr * (Math.PI * 0.47);
      baseZMag = topHalfWidthZ + Math.sin(ang) * shoulderRadius;
      baseY =
        shoulderTopY -
        (1 - Math.cos(ang)) * shoulderRadius -
        footDropY * (0.68 - 0.48 * tr);
      normY = Math.cos(ang);
      normZMag = Math.sin(ang);
    } else {
      // Hanging vertical/flared side skirt from shoulder exit down to sideHemY
      const ts = (absV - vShoulder) / (1 - vShoulder); // 0..1 down the skirt
      const maxAng = Math.PI * 0.47;
      const shoulderExitZ = topHalfWidthZ + Math.sin(maxAng) * shoulderRadius;
      const shoulderExitY =
        shoulderTopY -
        (1 - Math.cos(maxAng)) * shoulderRadius -
        footDropY * 0.2;

      const wavePhase =
        u * Math.PI * 2 * sideWaveCount +
        wavePhaseOffset +
        (signV < 0 ? 0.3 : 1.6);
      const waveOffsetZ =
        (Math.sin(wavePhase) * 0.68 + Math.cos(wavePhase * 1.5) * 0.32) *
        sideWaveAmp *
        Math.pow(ts, 1.15);

      const skirtFlareCurve = ts * (0.35 + 0.65 * ts);
      baseZMag =
        shoulderExitZ +
        sideFlareZ * skirtFlareCurve +
        waveOffsetZ +
        cornerWaterfallFlareZ;

      const targetHemY =
        sideHemY -
        cornerWaterfallDropY +
        Math.sin(wavePhase) * 0.007 * ts;
      baseY = THREE.MathUtils.lerp(shoulderExitY, targetHemY, ts);

      normY = Math.cos(maxAng) * (1 - ts) + 0.12 * ts;
      normZMag = Math.sin(maxAng);
      const nLen = Math.hypot(normY, normZMag);
      normY /= nLen;
      normZMag /= nLen;
    }

    // Gently tuck the leading/trailing edges (u near 0 or 1) by 4mm and add optional rolled fold swell
    const edgeTuck =
      u < 0.035
        ? -0.004 * (1 - u / 0.035)
        : !drapeOverFoot && u > 0.965
          ? -0.004 * ((u - 0.965) / 0.035)
          : 0;
    const headFoldSwell =
      headRolledFold && u < 0.11
        ? Math.sin((u / 0.11) * Math.PI) * 0.007
        : 0;

    const totalOffset = shellOffset + edgeTuck + headFoldSwell;
    const finalY = baseY + normY * totalOffset;
    const finalZ = signV * (baseZMag + normZMag * totalOffset);

    return new THREE.Vector3(x, finalY, finalZ);
  };

  const cols = segU + 1;
  const rows = segV + 1;
  const midGrid: THREE.Vector3[] = new Array(cols * rows);
  const normGrid: THREE.Vector3[] = new Array(cols * rows);

  for (let iu = 0; iu <= segU; iu++) {
    const u = iu / segU;
    for (let iv = 0; iv <= segV; iv++) {
      const v = (iv / segV) * 2 - 1;
      midGrid[iu * rows + iv] = sampleLayerMidSurface(u, v);
    }
  }

  // Compute smooth mid-surface normals via central differences
  const dU = new THREE.Vector3();
  const dV = new THREE.Vector3();
  for (let iu = 0; iu <= segU; iu++) {
    const iuPrev = Math.max(0, iu - 1);
    const iuNext = Math.min(segU, iu + 1);
    for (let iv = 0; iv <= segV; iv++) {
      const ivPrev = Math.max(0, iv - 1);
      const ivNext = Math.min(segV, iv + 1);
      dU.subVectors(midGrid[iuNext * rows + iv], midGrid[iuPrev * rows + iv]);
      dV.subVectors(midGrid[iu * rows + ivNext], midGrid[iu * rows + ivPrev]);
      const n = new THREE.Vector3().crossVectors(dV, dU).normalize();
      normGrid[iu * rows + iv] = n;
    }
  }

  const halfLoft = loftThickness * 0.5;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const getEdgePillowFactor = (u: number, v: number): number => {
    const distU = Math.min(u, 1 - u);
    const distV = 1 - Math.abs(v);
    const fu = Math.min(1, distU / 0.05);
    const fv = Math.min(1, distV / 0.04);
    const f = Math.min(fu, fv);
    return 0.22 + 0.78 * Math.sin(f * (Math.PI * 0.5));
  };

  // 1. Outer/Top surface (index 0 .. cols*rows - 1)
  for (let iu = 0; iu <= segU; iu++) {
    const u = iu / segU;
    for (let iv = 0; iv <= segV; iv++) {
      const v = (iv / segV) * 2 - 1;
      const idx = iu * rows + iv;
      const p = midGrid[idx];
      const n = normGrid[idx];
      const h = halfLoft * getEdgePillowFactor(u, v);
      positions.push(p.x + n.x * h, p.y + n.y * h, p.z + n.z * h);
      uvs.push(u, iv / segV);
    }
  }

  // 2. Inner/Bottom surface (index cols*rows .. 2*cols*rows - 1)
  const botOffset = cols * rows;
  for (let iu = 0; iu <= segU; iu++) {
    const u = iu / segU;
    for (let iv = 0; iv <= segV; iv++) {
      const v = (iv / segV) * 2 - 1;
      const idx = iu * rows + iv;
      const p = midGrid[idx];
      const n = normGrid[idx];
      const h = halfLoft * getEdgePillowFactor(u, v);
      positions.push(p.x - n.x * h, p.y - n.y * h, p.z - n.z * h);
      uvs.push(u, iv / segV);
    }
  }

  for (let iu = 0; iu < segU; iu++) {
    for (let iv = 0; iv < segV; iv++) {
      const a = iu * rows + iv;
      const b = a + 1;
      const c = (iu + 1) * rows + iv;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
      indices.push(
        botOffset + a,
        botOffset + c,
        botOffset + b,
        botOffset + b,
        botOffset + c,
        botOffset + d
      );
    }
  }

  for (let iv = 0; iv < segV; iv++) {
    const t0 = iv;
    const t1 = iv + 1;
    const b0 = botOffset + iv;
    const b1 = botOffset + iv + 1;
    indices.push(t0, b0, t1, t1, b0, b1);

    const ft0 = segU * rows + iv;
    const ft1 = ft0 + 1;
    const fb0 = botOffset + ft0;
    const fb1 = botOffset + ft1;
    indices.push(ft0, ft1, fb0, ft1, fb1, fb0);
  }

  for (let iu = 0; iu < segU; iu++) {
    const t0 = iu * rows;
    const t1 = (iu + 1) * rows;
    const b0 = botOffset + t0;
    const b1 = botOffset + t1;
    indices.push(t0, t1, b0, t1, b1, b0);

    const st0 = iu * rows + segV;
    const st1 = (iu + 1) * rows + segV;
    const sb0 = botOffset + st0;
    const sb1 = botOffset + st1;
    indices.push(st0, sb0, st1, st1, sb0, sb1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

/**
 * Creates a plump, realistic feather pillow geometry with pinched knife-edge seams,
 * tapered corners, subtle central head indentation, and optional Oxford flange border.
 */
function createSculptedPillowGeometry(
  thicknessX: number,
  heightY: number,
  widthZ: number,
  flangeSize = 0.0
): THREE.BufferGeometry {
  const segU = 24;
  const segV = 20;
  const geo = new THREE.BoxGeometry(thicknessX, heightY, widthZ, 12, segV, segU);
  const pos = geo.attributes.position;
  const halfX = thicknessX / 2;
  const halfY = heightY / 2;
  const halfZ = widthZ / 2;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const nx = halfX > 0 ? x / halfX : 0; // -1..1 front-to-back
    const ny = halfY > 0 ? y / halfY : 0; // -1..1 bottom-to-top
    const nz = halfZ > 0 ? z / halfZ : 0; // -1..1 left-to-right

    // Pinched knife-edge pillow envelope: thickness in X tapers smoothly to a pinched seam at |ny|=1 or |nz|=1
    const cosY = Math.cos(ny * Math.PI * 0.5);
    const cosZ = Math.cos(nz * Math.PI * 0.5);
    const plumpEnvelope = Math.pow(Math.max(0, cosY * cosZ), 0.58);

    // Optional flat Oxford flange rim around the outer edge
    const edgeDist = Math.max(Math.abs(ny), Math.abs(nz));
    const flangeFactor =
      flangeSize > 0 && edgeDist > 0.84
        ? 0.14
        : 0.12 + 0.88 * plumpEnvelope;

    // Classic pinched-corner dog-ear flare & gentle top-center Karate-chop / lounge dimple
    const cornerFlare = 1 + 0.045 * (ny * ny * nz * nz);
    const centerDimpleX =
      nx > 0
        ? -0.012 * Math.exp(-(ny * ny * 3.5 + nz * nz * 4.0))
        : 0;
    const topCreaseY =
      ny > 0.3
        ? -0.008 * Math.exp(-(nz * nz * 6.0)) * ((ny - 0.3) / 0.7)
        : 0;

    const sx = x * flangeFactor + centerDimpleX;
    const sy = y * cornerFlare + topCreaseY;
    const sz = z * cornerFlare;

    pos.setXYZ(i, sx, sy, sz);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

/**
 * Helper to create a softly crowned, pillowed 3D mattress/headboard cushion geometry
 * with rounded edges and smooth normals.
 */
function createSculptedSoftBoxGeometry(
  widthX: number,
  heightY: number,
  depthZ: number,
  segX = 16,
  segY = 10,
  segZ = 20,
  crownY = 0.018
): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(widthX, heightY, depthZ, segX, segY, segZ);
  const pos = geo.attributes.position;
  const halfX = widthX / 2;
  const halfY = heightY / 2;
  const halfZ = depthZ / 2;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    const nx = halfX > 0 ? x / halfX : 0;
    const ny = halfY > 0 ? y / halfY : 0;
    const nz = halfZ > 0 ? z / halfZ : 0;

    const domeXZ = Math.max(0, 1 - 0.65 * (nx * nx * 0.85 + nz * nz * 0.85));
    const edgeRound = 1 - 0.08 * Math.pow(nx * nx * nz * nz, 2);

    const sx = x * edgeRound;
    const sz = z * edgeRound;
    let sy = y;
    if (ny > 0) {
      sy += ny * crownY * domeXZ;
    }
    pos.setXYZ(i, sx, sy, sz);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

/**
 * Builds The Cotswold Company "Leafield Washed Oak Super King Size Bed"
 * (`mainBedroom.leafieldSuperKingBed`) and matching Leafield Washed Oak bedside tables
 * against the Main Bedroom West Cross-Wall (`X_ew = -9.56m`), facing East (`+X_ew`).
 *
 * Reference photos:
 * - `media_1790946394645.jpg` (overall styled bed with padded linen headboard, fluted arch crest & layered draped bedding)
 * - `media_1790946401209.jpg` (close-up of carved acorn finial, routed fluted corner post & arched fluted fanlight crest)
 * - `media_1790946407558.png` (side profile showing shouldered arch headboard, panelled footboard & turned tapered legs)
 */
export function buildLeafieldSuperKingBed(
  scene: THREE.Object3D,
  floorTopY: number
): void {
  const bedGroup = new THREE.Group();
  bedGroup.name = 'mainBedroom.leafieldSuperKingBed';
  bedGroup.userData.zone = 'mainBedroom';
  // Headboard back rests against the East face of the West cross-wall (X_ew = -9.56m, skirting at -9.54m),
  // centered at Z_ew = -0.55m (spanning Z_ew = -1.51m .. +0.41m, clear of the doorway at Z_ew = +1.10m..+2.00m)
  bedGroup.position.set(-9.545, floorTopY, -0.55);

  const washedOakTex = createWashedOakTexture();
  const washedOakMat = new THREE.MeshStandardMaterial({
    map: washedOakTex,
    color: 0xffffff,
    roughness: 0.46,
    metalness: 0.03,
  });
  const washedOakDarkMat = new THREE.MeshStandardMaterial({
    map: washedOakTex,
    color: 0xdccbb4,
    roughness: 0.54,
    metalness: 0.03,
  });
  const oatmealLinenMat = new THREE.MeshStandardMaterial({
    color: 0xdfd6c7, // Softly padded natural oatmeal woven linen headboard upholstery
    roughness: 0.86,
    metalness: 0.01,
  });
  const oatmealPipingMat = new THREE.MeshStandardMaterial({
    color: 0xd1c6b4,
    roughness: 0.82,
    metalness: 0.01,
  });

  // Super King dimensions:
  // Total width along Z = 1.92m (halfW = 0.96m), Total length along +X = 2.14m, Headboard crest height = 1.35m
  const postSize = 0.068;
  const postZ = 0.926; // Outer faces at ±0.96m, inner faces at ±0.892m
  const innerSpanZ = (postZ - postSize / 2) * 2; // 1.784m
  const headX = 0.038;
  const footX = 2.095;
  const legTopY = 0.245;
  const railBottomY = 0.245;
  const railTopY = 0.415;
  const railHeight = railTopY - railBottomY; // 0.17m

  // =========================================================================
  // 1. TURNED & TAPERED GUSTAVIAN LEGS (4 Corner Legs + 2 Center Support Legs)
  // =========================================================================
  const legProfilePts: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.016, 0.0),
    new THREE.Vector2(0.017, 0.022),
    new THREE.Vector2(0.021, 0.028), // Lower ankle ring bead
    new THREE.Vector2(0.018, 0.035),
    new THREE.Vector2(0.027, 0.208), // Smooth Gustavian taper
    new THREE.Vector2(0.032, 0.218), // Turned upper ring collar
    new THREE.Vector2(0.029, 0.228),
    new THREE.Vector2(0.031, legTopY),
    new THREE.Vector2(0.0, legTopY),
  ];
  const turnedLegGeo = new THREE.LatheGeometry(legProfilePts, 16);

  for (const [lx, lz, legTag] of [
    [headX, -postZ, 'headLeft'],
    [headX, postZ, 'headRight'],
    [footX, -postZ, 'footLeft'],
    [footX, postZ, 'footRight'],
    [(headX + footX) * 0.5, -postZ, 'midLeft'],
    [(headX + footX) * 0.5, postZ, 'midRight'],
  ] as const) {
    const leg = new THREE.Mesh(turnedLegGeo, washedOakMat);
    leg.name = `mainBedroom.leafieldSuperKingBed.leg.${legTag}`;
    leg.position.set(lx, 0, lz);
    leg.castShadow = true;
    leg.receiveShadow = true;
    bedGroup.add(leg);
  }

  // =========================================================================
  // 2. HEADBOARD CORNER POSTS WITH ROUTED FLUTED GROOVES & CARVED ACORN FINIALS
  //    (`media_1790946401209.jpg` close-up)
  // =========================================================================
  const headPostBottomY = legTopY;
  const headPostTopY = 1.292;
  const headPostH = headPostTopY - headPostBottomY;

  for (const sideSign of [-1, 1] as const) {
    const pz = sideSign * postZ;
    const postMesh = new THREE.Mesh(
      new THREE.BoxGeometry(postSize, headPostH, postSize),
      washedOakMat
    );
    postMesh.name = `mainBedroom.leafieldSuperKingBed.headPost.${sideSign < 0 ? 'north' : 'south'}`;
    postMesh.position.set(headX, headPostBottomY + headPostH / 2, pz);
    postMesh.castShadow = true;
    postMesh.receiveShadow = true;
    bedGroup.add(postMesh);

    const sideLabel = sideSign < 0 ? 'north' : 'south';
    // Pair of vertical routed groove flutes on the front (+X) face of each headboard post (`media_1790946401209.jpg`)
    for (const [fIdx, gzOff] of [[-0.011, 1], [0.011, 2]] as const) {
      const frontFlute = new THREE.Mesh(
        new THREE.BoxGeometry(0.004, headPostH - 0.14, 0.008),
        washedOakDarkMat
      );
      frontFlute.name = `mainBedroom.leafieldSuperKingBed.headPost.${sideLabel}.flute.${gzOff}`;
      frontFlute.userData.lodTier = 'high';
      frontFlute.userData.lodMaxDistance = 12;
      frontFlute.position.set(
        headX + postSize / 2 + 0.0005,
        headPostBottomY + headPostH / 2 + 0.02,
        pz + fIdx
      );
      bedGroup.add(frontFlute);
    }

    // Stepped square moulded necking collar atop each headboard post (`y = 1.292m..1.310m`)
    const postCollar = new THREE.Mesh(
      new THREE.BoxGeometry(postSize + 0.012, 0.018, postSize + 0.012),
      washedOakMat
    );
    postCollar.name = `mainBedroom.leafieldSuperKingBed.headPost.${sideLabel}.collar`;
    postCollar.position.set(headX, headPostTopY + 0.009, pz);
    postCollar.castShadow = true;
    bedGroup.add(postCollar);

    // Carved Oak Acorn Finial (`y = 1.310m..1.368m` — `media_1790946401209.jpg`)
    const finialBaseCup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.016, 0.016, 16),
      washedOakDarkMat
    );
    finialBaseCup.name = `mainBedroom.leafieldSuperKingBed.headPost.${sideLabel}.finialBaseCup`;
    finialBaseCup.position.set(headX, headPostTopY + 0.026, pz);
    finialBaseCup.castShadow = true;
    bedGroup.add(finialBaseCup);

    const acornBody = new THREE.Mesh(
      new THREE.SphereGeometry(0.023, 16, 14),
      washedOakMat
    );
    acornBody.name = `mainBedroom.leafieldSuperKingBed.headPost.${sideLabel}.acornBody`;
    acornBody.scale.set(1, 1.32, 1);
    acornBody.position.set(headX, headPostTopY + 0.048, pz);
    acornBody.castShadow = true;
    bedGroup.add(acornBody);

    const acornPip = new THREE.Mesh(
      new THREE.SphereGeometry(0.006, 10, 8),
      washedOakMat
    );
    acornPip.name = `mainBedroom.leafieldSuperKingBed.headPost.${sideLabel}.acornPip`;
    acornPip.userData.lodTier = 'high';
    acornPip.userData.lodMaxDistance = 12;
    acornPip.position.set(headX, headPostTopY + 0.078, pz);
    bedGroup.add(acornPip);
  }

  // =========================================================================
  // 3. SWEEPING ARCHED & SHOULDERED FLUTED FANLIGHT CREST RAIL
  //    (`media_1790946401209.jpg` & `media_1790946407558.png`)
  // =========================================================================
  const halfInnerZ = innerSpanZ / 2; // 0.892m
  const shoulderZ = 0.76;
  const sampleCrestTopY = (z: number): number => {
    const az = Math.abs(z);
    if (az >= shoulderZ) {
      const t = (az - shoulderZ) / (halfInnerZ - shoulderZ);
      return 1.234 - 0.026 * Math.sin(t * (Math.PI / 2));
    }
    const u = az / shoulderZ;
    return 1.242 + 0.076 * (1 - u * u);
  };

  {
    const crestShape = new THREE.Shape();
    const transomBaseY = 1.125;
    crestShape.moveTo(-halfInnerZ, transomBaseY);
    crestShape.lineTo(halfInnerZ, transomBaseY);
    const numSamples = 48;
    for (let i = 0; i <= numSamples; i++) {
      const z = THREE.MathUtils.lerp(halfInnerZ, -halfInnerZ, i / numSamples);
      crestShape.lineTo(z, sampleCrestTopY(z));
    }
    crestShape.closePath();

    const crestGeo = new THREE.ExtrudeGeometry(crestShape, {
      depth: 0.036,
      bevelEnabled: false,
    });
    crestGeo.rotateY(Math.PI / 2);
    crestGeo.translate(headX - 0.018, 0, 0);
    const crestBackMesh = new THREE.Mesh(crestGeo, washedOakMat);
    crestBackMesh.name = 'mainBedroom.leafieldSuperKingBed.archedCrestPanel';
    crestBackMesh.castShadow = true;
    crestBackMesh.receiveShadow = true;
    bedGroup.add(crestBackMesh);
  }

  {
    const capThicknessY = 0.024;
    const capShape = new THREE.Shape();
    const numSamples = 52;
    for (let i = 0; i <= numSamples; i++) {
      const z = THREE.MathUtils.lerp(-halfInnerZ, halfInnerZ, i / numSamples);
      const yTop = sampleCrestTopY(z) + 0.004;
      if (i === 0) capShape.moveTo(z, yTop);
      else capShape.lineTo(z, yTop);
    }
    for (let i = numSamples; i >= 0; i--) {
      const z = THREE.MathUtils.lerp(-halfInnerZ, halfInnerZ, i / numSamples);
      const yBot = sampleCrestTopY(z) - capThicknessY;
      capShape.lineTo(z, yBot);
    }
    capShape.closePath();

    const capGeo = new THREE.ExtrudeGeometry(capShape, {
      depth: 0.056,
      bevelEnabled: false,
    });
    capGeo.rotateY(Math.PI / 2);
    capGeo.translate(headX - 0.026, 0, 0);
    const crestCapMesh = new THREE.Mesh(capGeo, washedOakMat);
    crestCapMesh.name = 'mainBedroom.leafieldSuperKingBed.archedCrestCap';
    crestCapMesh.castShadow = true;
    crestCapMesh.receiveShadow = true;
    bedGroup.add(crestCapMesh);
  }

  const fluteBottomY = 1.166;
  const numFlutes = 53;
  for (let i = 0; i < numFlutes; i++) {
    const fz = THREE.MathUtils.lerp(
      -halfInnerZ + 0.022,
      halfInnerZ - 0.022,
      i / (numFlutes - 1)
    );
    const fluteTopY = sampleCrestTopY(fz) - 0.022;
    const fluteH = Math.max(0.02, fluteTopY - fluteBottomY);
    const reed = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0065, 0.0065, fluteH, 8),
      washedOakDarkMat
    );
    reed.name = `mainBedroom.leafieldSuperKingBed.crestFlute.${i + 1}`;
    reed.userData.lodTier = 'high';
    reed.userData.lodMaxDistance = 12;
    reed.scale.set(0.55, 1, 1);
    reed.position.set(headX + 0.019, fluteBottomY + fluteH / 2, fz);
    reed.castShadow = true;
    reed.receiveShadow = true;
    bedGroup.add(reed);
  }

  const crestTransomRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.052, 0.043, innerSpanZ),
    washedOakMat
  );
  crestTransomRail.name = 'mainBedroom.leafieldSuperKingBed.crestTransomRail';
  crestTransomRail.position.set(headX, 1.1465, 0);
  crestTransomRail.castShadow = true;
  crestTransomRail.receiveShadow = true;
  bedGroup.add(crestTransomRail);

  // =========================================================================
  // 4. UPHOLSTERED OATMEAL LINEN PADDED HEADBOARD PANEL (`y = 0.54m..1.125m`)
  // =========================================================================
  const headBackPanel = new THREE.Mesh(
    new THREE.BoxGeometry(0.026, 0.85, innerSpanZ),
    washedOakMat
  );
  headBackPanel.name = 'mainBedroom.leafieldSuperKingBed.headBackPanel';
  headBackPanel.position.set(headX - 0.008, 0.7, 0);
  headBackPanel.castShadow = true;
  bedGroup.add(headBackPanel);

  const linenPanelH = 0.575;
  const linenPanelW = innerSpanZ - 0.012;
  const linenPadGeo = createSculptedSoftBoxGeometry(
    0.046,
    linenPanelH,
    linenPanelW,
    6,
    14,
    28,
    0.012
  );
  const linenPadMesh = new THREE.Mesh(linenPadGeo, oatmealLinenMat);
  linenPadMesh.name = 'mainBedroom.leafieldSuperKingBed.upholsteredHeadboardPanel';
  linenPadMesh.position.set(headX + 0.016, 0.545 + linenPanelH / 2, 0);
  linenPadMesh.castShadow = true;
  linenPadMesh.receiveShadow = true;
  bedGroup.add(linenPadMesh);

  for (const [wTag, py] of [['bottom', 0.552], ['top', 1.116]] as const) {
    const hWelt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0045, 0.0045, linenPanelW, 8),
      oatmealPipingMat
    );
    hWelt.name = `mainBedroom.leafieldSuperKingBed.headboardWelt.${wTag}`;
    hWelt.userData.lodTier = 'high';
    hWelt.userData.lodMaxDistance = 12;
    hWelt.rotation.x = Math.PI / 2;
    hWelt.position.set(headX + 0.036, py, 0);
    bedGroup.add(hWelt);
  }
  for (const pzSign of [-1, 1] as const) {
    const vWelt = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0045, 0.0045, linenPanelH - 0.01, 8),
      oatmealPipingMat
    );
    vWelt.name = `mainBedroom.leafieldSuperKingBed.headboardWelt.${pzSign < 0 ? 'north' : 'south'}`;
    vWelt.userData.lodTier = 'high';
    vWelt.userData.lodMaxDistance = 12;
    vWelt.position.set(
      headX + 0.036,
      0.545 + linenPanelH / 2,
      pzSign * (linenPanelW / 2 - 0.004)
    );
    bedGroup.add(vWelt);
  }

  const lowerHeadRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.044, 0.285, innerSpanZ),
    washedOakMat
  );
  lowerHeadRail.name = 'mainBedroom.leafieldSuperKingBed.lowerHeadRail';
  lowerHeadRail.position.set(headX, 0.4025, 0);
  lowerHeadRail.castShadow = true;
  bedGroup.add(lowerHeadRail);

  // =========================================================================
  // 5. SIDE RAILS, FOOTBOARD CORNER BLOCKS & PANELLED FOOTBOARD (`media_1790946407558.png`)
  // =========================================================================
  const sideRailLen = footX - headX - postSize;
  const sideRailCenterX = (headX + footX) / 2;

  for (const sideSign of [-1, 1] as const) {
    const sz = sideSign * postZ;
    const sideRail = new THREE.Mesh(
      new THREE.BoxGeometry(sideRailLen, railHeight, 0.036),
      washedOakMat
    );
    sideRail.name = `mainBedroom.leafieldSuperKingBed.sideRail.${sideSign < 0 ? 'north' : 'south'}`;
    sideRail.position.set(sideRailCenterX, railBottomY + railHeight / 2, sz);
    sideRail.castShadow = true;
    sideRail.receiveShadow = true;
    bedGroup.add(sideRail);

    const sideRailCap = new THREE.Mesh(
      new THREE.BoxGeometry(sideRailLen, 0.018, 0.048),
      washedOakMat
    );
    sideRailCap.name = `mainBedroom.leafieldSuperKingBed.sideRailCap.${sideSign < 0 ? 'north' : 'south'}`;
    sideRailCap.position.set(sideRailCenterX, railTopY + 0.007, sz);
    sideRailCap.castShadow = true;
    bedGroup.add(sideRailCap);
  }

  const footPostH = 0.188;
  for (const sideSign of [-1, 1] as const) {
    const fz = sideSign * postZ;
    const footPost = new THREE.Mesh(
      new THREE.BoxGeometry(postSize, footPostH, postSize),
      washedOakMat
    );
    footPost.name = `mainBedroom.leafieldSuperKingBed.footPost.${sideSign < 0 ? 'north' : 'south'}`;
    footPost.position.set(footX, railBottomY + footPostH / 2, fz);
    footPost.castShadow = true;
    footPost.receiveShadow = true;
    bedGroup.add(footPost);

    const footSideLabel = sideSign < 0 ? 'north' : 'south';
    const footPostCap = new THREE.Mesh(
      new THREE.BoxGeometry(postSize + 0.01, 0.016, postSize + 0.01),
      washedOakMat
    );
    footPostCap.name = `mainBedroom.leafieldSuperKingBed.footPost.${footSideLabel}.cap`;
    footPostCap.position.set(footX, railBottomY + footPostH + 0.008, fz);
    footPostCap.castShadow = true;
    bedGroup.add(footPostCap);

    for (const [fIdx, gzOff] of [[-0.011, 1], [0.011, 2]] as const) {
      const footFlute = new THREE.Mesh(
        new THREE.BoxGeometry(0.004, footPostH - 0.04, 0.008),
        washedOakDarkMat
      );
      footFlute.name = `mainBedroom.leafieldSuperKingBed.footPost.${footSideLabel}.flute.${gzOff}`;
      footFlute.userData.lodTier = 'high';
      footFlute.userData.lodMaxDistance = 12;
      footFlute.position.set(
        footX + postSize / 2 + 0.0005,
        railBottomY + footPostH / 2,
        fz + fIdx
      );
      bedGroup.add(footFlute);
    }
  }

  const footboardCore = new THREE.Mesh(
    new THREE.BoxGeometry(0.038, railHeight, innerSpanZ),
    washedOakMat
  );
  footboardCore.name = 'mainBedroom.leafieldSuperKingBed.footboard';
  footboardCore.position.set(footX, railBottomY + railHeight / 2, 0);
  footboardCore.castShadow = true;
  footboardCore.receiveShadow = true;
  bedGroup.add(footboardCore);

  for (const [rTag, ry] of [['bottom', railBottomY + 0.024], ['top', railTopY - 0.024]] as const) {
    const fbHoriRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.048, 0.044, innerSpanZ),
      washedOakMat
    );
    fbHoriRail.name = `mainBedroom.leafieldSuperKingBed.footboard.rail.${rTag}`;
    fbHoriRail.position.set(footX + 0.004, ry, 0);
    fbHoriRail.castShadow = true;
    bedGroup.add(fbHoriRail);
  }
  for (const [sTag, rz] of [
    ['north', -innerSpanZ / 2 + 0.04],
    ['center', 0],
    ['south', innerSpanZ / 2 - 0.04],
  ] as const) {
    const fbStile = new THREE.Mesh(
      new THREE.BoxGeometry(0.048, railHeight, 0.075),
      washedOakMat
    );
    fbStile.name = `mainBedroom.leafieldSuperKingBed.footboard.stile.${sTag}`;
    fbStile.position.set(footX + 0.004, railBottomY + railHeight / 2, rz);
    fbStile.castShadow = true;
    bedGroup.add(fbStile);
  }
  const footboardCap = new THREE.Mesh(
    new THREE.BoxGeometry(0.056, 0.018, innerSpanZ + 0.01),
    washedOakMat
  );
  footboardCap.name = 'mainBedroom.leafieldSuperKingBed.footboard.cap';
  footboardCap.position.set(footX, railTopY + 0.008, 0);
  footboardCap.castShadow = true;
  bedGroup.add(footboardCap);

  // =========================================================================
  // 6. SCULPTED DRAPED SUPER KING DUVET, STRIPED QUILT FOLD, CHARCOAL WAFFLE
  //    BEDSPREAD, BOTANICAL WATERFALL EIDERDOWN & PINCHED FEATHER PILLOWS
  //    (`media_1790946394645.jpg`)
  // =========================================================================
  const ivorySheetMat = new THREE.MeshStandardMaterial({
    color: 0xf4efe6,
    roughness: 0.84,
    metalness: 0.01,
  });
  const duckEggDuvetMat = new THREE.MeshStandardMaterial({
    color: 0xc5ccc8, // Soft duck-egg / pale sage-grey washed linen duvet (`media_1790946394645.jpg`)
    roughness: 0.88,
    metalness: 0.01,
  });
  const stripedQuiltMat = new THREE.MeshStandardMaterial({
    map: createStripedQuiltTexture(),
    color: 0xffffff,
    roughness: 0.85,
    metalness: 0.01,
  });
  const charcoalWaffleTex = createCharcoalWaffleQuiltTexture();
  const charcoalQuiltMat = new THREE.MeshStandardMaterial({
    map: charcoalWaffleTex.map,
    bumpMap: charcoalWaffleTex.bumpMap,
    bumpScale: 0.012,
    color: 0xffffff,
    roughness: 0.86,
    metalness: 0.02,
  });
  const slateBlueLinenMat = new THREE.MeshStandardMaterial({
    color: 0x6f7f8c, // Muted slate-blue Oxford linen pillow
    roughness: 0.86,
    metalness: 0.01,
  });
  const houndstoothCushionMat = new THREE.MeshStandardMaterial({
    map: createHoundstoothCushionTexture(),
    color: 0xffffff,
    roughness: 0.85,
    metalness: 0.01,
  });
  const botanicalEiderdownMat = new THREE.MeshStandardMaterial({
    map: createBotanicalEiderdownTexture(),
    color: 0xffffff,
    roughness: 0.86,
    metalness: 0.01,
  });
  const leafStripeCushionMat = new THREE.MeshStandardMaterial({
    map: createLeafStripeCushionTexture(),
    color: 0xffffff,
    roughness: 0.85,
    metalness: 0.01,
  });

  // 6A. Fitted Super King Mattress (`1.70m W × 1.88m L`, `y = 0.34m..0.555m`)
  //     Visible at the head end (`x = 0.08m..0.46m`) under the pillows; stays cleanly inside the draped duvet shoulder!
  const mattressGeo = createSculptedSoftBoxGeometry(
    1.88,
    0.215,
    1.7,
    24,
    8,
    24,
    0.014
  );
  const mattressMesh = new THREE.Mesh(mattressGeo, ivorySheetMat);
  mattressMesh.name = 'mainBedroom.leafieldSuperKingBed.mattress';
  mattressMesh.position.set(1.02, 0.448, 0);
  mattressMesh.castShadow = true;
  mattressMesh.receiveShadow = true;
  bedGroup.add(mattressMesh);

  // 6B. Layer 1 — Draped Pale Duck-Egg / Sage Linen Duvet (`x = 0.44m..2.04m`, `shellOffset = 0.000m`)
  //     Crowns softly across the bed and drapes smoothly over the left & right mattress shoulders
  //     down over the oak side rails to `y = 0.255m` with natural linen folds (`media_1790946394645.jpg` left!)
  const duvetGeo = createDrapedBedLayerGeometry({
    xStart: 0.44,
    xEnd: 2.04,
    shellOffset: 0.0,
    loftThickness: 0.022,
    sideHemY: 0.255,
    sideFlareZ: 0.024,
    sideWaveCount: 3.5,
    sideWaveAmp: 0.009,
    wavePhaseOffset: 0.0,
    drapeOverFoot: true,
    headRolledFold: true,
    segU: 48,
    segV: 72,
  });
  const duvetMesh = new THREE.Mesh(duvetGeo, duckEggDuvetMat);
  duvetMesh.name = 'mainBedroom.leafieldSuperKingBed.duvet';
  duvetMesh.castShadow = true;
  duvetMesh.receiveShadow = true;
  bedGroup.add(duvetMesh);

  // 6C. Layer 2 — Warm Cream & Caramel Pinstriped Quilted Throw Fold (`x = 0.78m..1.52m`, `shellOffset = +0.014m`)
  //     Wraps continuously over the duvet and cascades down both sides (`media_1790946394645.jpg` center-left!)
  const stripedFoldGeo = createDrapedBedLayerGeometry({
    xStart: 0.78,
    xEnd: 1.52,
    shellOffset: 0.014,
    loftThickness: 0.013,
    sideHemY: 0.23,
    sideFlareZ: 0.028,
    sideWaveCount: 2.0,
    sideWaveAmp: 0.008,
    wavePhaseOffset: 0.7,
    drapeOverFoot: false,
    headRolledFold: true,
    segU: 34,
    segV: 68,
  });
  const stripedFoldMesh = new THREE.Mesh(stripedFoldGeo, stripedQuiltMat);
  stripedFoldMesh.name = 'mainBedroom.leafieldSuperKingBed.sheetTurnDown';
  stripedFoldMesh.castShadow = true;
  stripedFoldMesh.receiveShadow = true;
  bedGroup.add(stripedFoldMesh);

  // 6D. Layer 3 — Deep Slate-Charcoal Waffle-Quilted Bedspread (`x = 0.94m..1.96m`, `shellOffset = +0.025m`)
  //     Drapes over the striped quilt and hangs down both sides to `y = 0.205m` with 3D waffle quilting!
  const charcoalThrowGeo = createDrapedBedLayerGeometry({
    xStart: 0.94,
    xEnd: 1.96,
    shellOffset: 0.025,
    loftThickness: 0.014,
    sideHemY: 0.205,
    sideFlareZ: 0.032,
    sideWaveCount: 3.0,
    sideWaveAmp: 0.009,
    wavePhaseOffset: 1.4,
    drapeOverFoot: false,
    headRolledFold: true,
    segU: 40,
    segV: 72,
  });
  const charcoalThrowMesh = new THREE.Mesh(charcoalThrowGeo, charcoalQuiltMat);
  charcoalThrowMesh.name = 'mainBedroom.leafieldSuperKingBed.charcoalBedspread';
  charcoalThrowMesh.castShadow = true;
  charcoalThrowMesh.receiveShadow = true;
  bedGroup.add(charcoalThrowMesh);

  // 6E. Layer 4 — Botanical Block-Print Floral Eiderdown Quilt at the Foot (`x = 1.30m..2.055m`, `shellOffset = +0.036m`)
  //     Drapes across the foot third of the bed, down both sides, AND over the foot shoulder with
  //     flared waterfall corner folds hanging beside the footboard posts (`media_1790946394645.jpg` foreground!)
  const floralQuiltGeo = createDrapedBedLayerGeometry({
    xStart: 1.3,
    xEnd: 2.055,
    shellOffset: 0.036,
    loftThickness: 0.015,
    sideHemY: 0.185,
    sideFlareZ: 0.038,
    sideWaveCount: 2.5,
    sideWaveAmp: 0.011,
    wavePhaseOffset: 2.1,
    drapeOverFoot: true,
    headRolledFold: true,
    segU: 44,
    segV: 76,
  });
  const floralQuiltMesh = new THREE.Mesh(floralQuiltGeo, botanicalEiderdownMat);
  floralQuiltMesh.name = 'mainBedroom.leafieldSuperKingBed.botanicalEiderdown';
  floralQuiltMesh.castShadow = true;
  floralQuiltMesh.receiveShadow = true;
  bedGroup.add(floralQuiltMesh);

  // 6F. Sculpted Pinched-Seam Feather Pillows & Scatter Cushions against the Headboard (`media_1790946394645.jpg`)
  const backPillowGeo = createSculptedPillowGeometry(0.19, 0.42, 0.78, 0.0);
  const oxfordPillowGeo = createSculptedPillowGeometry(0.18, 0.43, 0.78, 0.035);
  const scatterCushionGeo = createSculptedPillowGeometry(0.15, 0.34, 0.48, 0.0);
  const lumbarCushionGeo = createSculptedPillowGeometry(0.14, 0.27, 0.62, 0.0);

  for (const [pIdx, pz, matMid] of [
    [1, -0.44, duckEggDuvetMat],
    [2, 0.44, slateBlueLinenMat],
  ] as const) {
    // Back sleeping pillow (Ivory)
    const backPillow = new THREE.Mesh(backPillowGeo, ivorySheetMat);
    backPillow.name = `mainBedroom.leafieldSuperKingBed.pillow.back.${pIdx}`;
    backPillow.position.set(0.175, 0.72, pz);
    backPillow.rotation.z = 0.24;
    backPillow.castShadow = true;
    backPillow.receiveShadow = true;
    bedGroup.add(backPillow);

    // Middle Oxford-edge linen pillow (Duck-egg left / Slate-blue right)
    const midPillow = new THREE.Mesh(oxfordPillowGeo, matMid);
    midPillow.name = `mainBedroom.leafieldSuperKingBed.pillow.mid.${pIdx}`;
    midPillow.position.set(0.305, 0.71, pz);
    midPillow.rotation.z = 0.32;
    midPillow.castShadow = true;
    midPillow.receiveShadow = true;
    bedGroup.add(midPillow);
  }

  // Front row of 3 styled scatter/lumbar cushions (`media_1790946394645.jpg`)
  const leftScatter = new THREE.Mesh(scatterCushionGeo, houndstoothCushionMat);
  leftScatter.name = 'mainBedroom.leafieldSuperKingBed.cushion.left';
  leftScatter.position.set(0.435, 0.695, -0.25);
  leftScatter.rotation.z = 0.38;
  leftScatter.rotation.y = 0.05;
  leftScatter.castShadow = true;
  leftScatter.receiveShadow = true;
  bedGroup.add(leftScatter);

  const rightScatter = new THREE.Mesh(scatterCushionGeo, leafStripeCushionMat);
  rightScatter.name = 'mainBedroom.leafieldSuperKingBed.cushion.right';
  rightScatter.position.set(0.435, 0.695, 0.27);
  rightScatter.rotation.z = 0.38;
  rightScatter.rotation.y = -0.05;
  rightScatter.castShadow = true;
  rightScatter.receiveShadow = true;
  bedGroup.add(rightScatter);

  const centerLumbar = new THREE.Mesh(lumbarCushionGeo, botanicalEiderdownMat);
  centerLumbar.name = 'mainBedroom.leafieldSuperKingBed.cushion.center';
  centerLumbar.position.set(0.545, 0.665, -0.22);
  centerLumbar.rotation.z = 0.44;
  centerLumbar.rotation.y = 0.04;
  centerLumbar.castShadow = true;
  centerLumbar.receiveShadow = true;
  bedGroup.add(centerLumbar);

  // =========================================================================
  // 7. PAIR OF MATCHING LEAFIELD WASHED OAK BEDSIDE TABLES & CERAMIC LAMPS
  //    Flanking the bed at local Z = ±1.27m (World Z_ew = -1.82m and +0.72m)
  // =========================================================================
  const ceramicLampMat = new THREE.MeshStandardMaterial({
    color: 0xe6dfd3,
    roughness: 0.38,
    metalness: 0.04,
  });
  const lampShadeMat = new THREE.MeshStandardMaterial({
    color: 0xf3ece0,
    roughness: 0.78,
    metalness: 0.01,
    side: THREE.DoubleSide,
  });
  const agedBrassKnobMat = new THREE.MeshStandardMaterial({
    color: 0x9b7e46,
    roughness: 0.32,
    metalness: 0.82,
  });

  for (const [sideTag, tz] of [
    ['north', -1.27],
    ['south', 1.27],
  ] as const) {
    const nsGroup = new THREE.Group();
    nsGroup.name = `mainBedroom.leafieldBedsideTable.${sideTag}`;
    nsGroup.position.set(0.22, 0, tz);

    const nsW = 0.48; // along Z
    const nsD = 0.38; // along X
    const nsBodyBottomY = 0.24;
    const nsBodyTopY = 0.6;
    const nsBodyH = nsBodyTopY - nsBodyBottomY;

    for (const [legTag, lx, lz] of [
      ['backLeft', -nsD / 2 + 0.035, -nsW / 2 + 0.035],
      ['frontLeft', nsD / 2 - 0.035, -nsW / 2 + 0.035],
      ['backRight', -nsD / 2 + 0.035, nsW / 2 - 0.035],
      ['frontRight', nsD / 2 - 0.035, nsW / 2 - 0.035],
    ] as const) {
      const nsLeg = new THREE.Mesh(turnedLegGeo, washedOakMat);
      nsLeg.name = `${nsGroup.name}.leg.${legTag}`;
      nsLeg.scale.set(0.76, 1, 0.76);
      nsLeg.position.set(lx, 0, lz);
      nsLeg.castShadow = true;
      nsGroup.add(nsLeg);
    }

    const nsCarcass = new THREE.Mesh(
      new THREE.BoxGeometry(nsD, nsBodyH, nsW),
      washedOakMat
    );
    nsCarcass.name = `${nsGroup.name}.carcass`;
    nsCarcass.position.set(0, nsBodyBottomY + nsBodyH / 2, 0);
    nsCarcass.castShadow = true;
    nsCarcass.receiveShadow = true;
    nsGroup.add(nsCarcass);

    const nsTop = new THREE.Mesh(
      new THREE.BoxGeometry(nsD + 0.024, 0.024, nsW + 0.024),
      washedOakMat
    );
    nsTop.name = `${nsGroup.name}.top`;
    nsTop.position.set(0, nsBodyTopY + 0.012, 0);
    nsTop.castShadow = true;
    nsTop.receiveShadow = true;
    nsGroup.add(nsTop);

    for (const [dTag, dy] of [['bottom', 0.335], ['top', 0.505]] as const) {
      const drawerFront = new THREE.Mesh(
        new THREE.BoxGeometry(0.016, 0.135, nsW - 0.06),
        washedOakDarkMat
      );
      drawerFront.name = `${nsGroup.name}.drawer.${dTag}.front`;
      drawerFront.position.set(nsD / 2 + 0.004, dy, 0);
      drawerFront.castShadow = true;
      nsGroup.add(drawerFront);

      const knob = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 10, 8),
        agedBrassKnobMat
      );
      knob.name = `${nsGroup.name}.drawer.${dTag}.knob`;
      knob.userData.lodTier = 'high';
      knob.userData.lodMaxDistance = 12;
      knob.position.set(nsD / 2 + 0.02, dy, 0);
      nsGroup.add(knob);
    }

    const lampBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.078, 0.21, 16),
      ceramicLampMat
    );
    lampBase.name = `${nsGroup.name}.lamp.base`;
    lampBase.position.set(0, nsBodyTopY + 0.024 + 0.105, 0);
    lampBase.castShadow = true;
    nsGroup.add(lampBase);

    const lampShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.095, 0.145, 0.17, 20, 1, true),
      lampShadeMat
    );
    lampShade.name = `${nsGroup.name}.lamp.shade`;
    lampShade.position.set(0, nsBodyTopY + 0.024 + 0.28, 0);
    lampShade.castShadow = true;
    nsGroup.add(lampShade);

    bedGroup.add(nsGroup);
  }

  scene.add(bedGroup);
}
