import * as THREE from 'three';
import {
  getOrCreateCachedCanvas,
  getOrCreateCachedCanvasPair,
  getOrCreateCachedTexture,
} from './texture-registry.ts';

export function createStoneTileTexture(): THREE.CanvasTexture {
  const canvas = getOrCreateCachedCanvas('stone-tile', 512, 512, (ctx) => {
    // Lighter-colored pale silver/off-white grout lines (#e2e4e6)
    ctx.fillStyle = '#e2e4e6';
    ctx.fillRect(0, 0, 512, 512);

    // 2x2 grid per 1.20m x 1.20m tile repeat -> exact 60cm x 60cm large-format square tiles
    const rows = 2;
    const cols = 2;
    const w = 512 / cols;
    const h = 512 / rows;
    const groutHalf = 2.5; // crisp 5px light grout joint

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tx = c * w + groutHalf;
        const ty = r * h + groutHalf;
        const tw = w - groutHalf * 2;
        const th = h - groutHalf * 2;

        // Light grey poured concrete / micro-cement base tone
        const baseShade = 194 + ((r * 5 + c * 9) % 6) - 3;
        ctx.fillStyle = `rgb(${baseShade}, ${baseShade + 2}, ${baseShade + 5})`;
        ctx.fillRect(tx, ty, tw, th);

        // Subtle trowelled cement clouding & mineral aggregate texture within each 60x60 tile
        for (let py = ty + 4; py < ty + th - 8; py += 12) {
          for (let px = tx + 4; px < tx + tw - 8; px += 12) {
            const hash = ((px * 23 + py * 41 + r * 17 + c * 31) % 15) - 7;
            const s = baseShade + hash;
            ctx.fillStyle = `rgba(${s}, ${s + 2}, ${s + 4}, 0.32)`;
            ctx.fillRect(px, py, 14, 14);
          }
        }

        // Fine cement aggregate speckles (tiny light and dark mineral grains)
        for (let i = 0; i < 45; i++) {
          const sx = tx + 8 + ((i * 53 + r * 29 + c * 71) % Math.floor(tw - 16));
          const sy = ty + 8 + ((i * 79 + r * 43 + c * 19) % Math.floor(th - 16));
          ctx.fillStyle =
            i % 2 === 0 ? 'rgba(228, 232, 236, 0.25)' : 'rgba(155, 160, 166, 0.22)';
          ctx.fillRect(sx, sy, 2.5, 2.5);
        }
      }
    }
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  // 10.20m / 1.20m = 8.5 repeats X (17 x 60cm tiles); 5.25m / 1.20m = 4.375 repeats Z (8.75 x 60cm tiles)
  tex.repeat.set(8.5, 4.375);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createCourtyardStoneTexture(): THREE.CanvasTexture {
  const canvas = getOrCreateCachedCanvas('courtyard-stone', 512, 512, (ctx) => {
    // Warm sandy-buff lime mortar joints between limestone slabs
    ctx.fillStyle = '#b8ae9c';
    ctx.fillRect(0, 0, 512, 512);

    // Traditional random-coursed English riven limestone flagstone layout
    const slabs: ReadonlyArray<readonly [number, number, number, number]> = [
      // Course 1
      [4, 4, 196, 120],
      [206, 4, 148, 120],
      [360, 4, 148, 120],
      // Course 2
      [4, 130, 132, 124],
      [142, 130, 212, 124],
      [360, 130, 148, 124],
      // Course 3
      [4, 260, 224, 118],
      [234, 260, 132, 118],
      [372, 260, 136, 118],
      // Course 4
      [4, 384, 158, 124],
      [168, 384, 176, 124],
      [350, 384, 158, 124],
    ];

    const limestonePalette = [
      [206, 198, 182], // Warm Cotswold / Lincolnshire honey-buff limestone
      [196, 190, 178], // Pale dove-buff limestone
      [212, 204, 188], // Cream-buff flagstone
      [188, 184, 174], // Weathered silver-buff limestone
      [202, 193, 176], // Warm sandy limestone
    ];

    slabs.forEach(([x, y, bw, bh], i) => {
      const base = limestonePalette[i % limestonePalette.length] ?? [202, 194, 180];
      const delta = ((i * 13) % 10) - 5;
      const r = base[0] + delta;
      const g = base[1] + delta;
      const b = base[2] + delta;

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x, y, bw, bh);

      // Subtle natural riven stone surface mottling
      for (let sy = y + 6; sy < y + bh - 8; sy += 14) {
        for (let sx = x + 6; sx < x + bw - 8; sx += 18) {
          const n = (((sx * 19 + sy * 37 + i * 7) % 12) - 6);
          ctx.fillStyle = `rgba(${r + n}, ${g + n}, ${b + n}, 0.35)`;
          ctx.fillRect(sx, sy, 14, 10);
        }
      }

      // Chiseled edge highlight along each limestone slab
      ctx.strokeStyle = 'rgba(255, 250, 240, 0.28)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 1, y + 1, bw - 2, bh - 2);
    });
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5.5, 2.2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createGraniteSettArcTexture(): THREE.CanvasTexture {
  const canvas = getOrCreateCachedCanvas('granite-sett-arc', 512, 256, (ctx) => {
    // Warm sandy-colored lime/sand mortar pointing base
    ctx.fillStyle = '#cbb894';
    ctx.fillRect(0, 0, 512, 256);

    // Subtle sandy grain variation in the mortar pointing (periodic across 512x256)
    for (let y = 0; y < 256; y += 4) {
      for (let x = 0; x < 512; x += 4) {
        const delta = (((x % 512) * 17 + (y % 256) * 31) % 14) - 7;
        ctx.fillStyle = `rgb(${203 + delta}, ${184 + delta}, ${148 + delta})`;
        ctx.fillRect(x, y, 4, 4);
      }
    }

    // Mixture of old weathered granite cobble colors (silver-grey, blue-grey, rose/pink granite, buff, charcoal)
    const granitePalette = [
      '#7d8186',
      '#6c737b',
      '#8f7b74',
      '#928879',
      '#62666c',
      '#86898e',
      '#7f6d67',
      '#74797e',
      '#9b8f80',
      '#5b6066',
    ];

    // 100% 2D-periodic coursed granite setts (18 courses across 512px, 8 rows across 256px)
    // so world-space (X, Z) UV mapping wraps around corners as a single continuous seamless texture.
    const numCourses = 18;
    const numRows = 8;
    const courseStepX = 512 / numCourses; // 28.44px
    const cobbleStepY = 256 / numRows;    // 32.0px (exact integer divisor of 256px)
    const arcAmp = 14;

    for (let c = -2; c <= numCourses + 2; c++) {
      const cMod = ((c % numCourses) + numCourses) % numCourses;
      const baseCourseX = c * courseStepX;
      const staggerY = (cMod % 2) * (cobbleStepY * 0.5);

      for (let s = -2; s <= numRows + 2; s++) {
        const sMod = ((s % numRows) + numRows) % numRows;
        const yMid = s * cobbleStepY + staggerY;
        if (yMid < -32 || yMid > 288) continue;

        // Smoothly periodic wave across 256px so v=0 and v=1 match in both position and tangent angle
        const wavePhase = (2 * Math.PI * yMid) / 256;
        const arcOffsetX = arcAmp * 0.5 * (1 - Math.cos(wavePhase));
        const xMid = baseCourseX - arcOffsetX + courseStepX * 0.5;
        const tangentAngle = Math.atan(((arcAmp * Math.PI) / 256) * Math.sin(wavePhase));

        const colorIdx =
          Math.abs((cMod * 17 + sMod * 11 + 7) % granitePalette.length);
        const baseColor = granitePalette[colorIdx] ?? '#7d8186';

        const cobbleW = courseStepX - 4.6; // ~23.8px
        const cobbleH = cobbleStepY - 4.6; // ~27.4px

        ctx.save();
        ctx.translate(xMid, yMid);
        ctx.rotate(tangentAngle);

        const rx = -cobbleW * 0.5;
        const ry = -cobbleH * 0.5;
        const cornerR = 3.5;

        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.roundRect(rx, ry, cobbleW, cobbleH, cornerR);
        ctx.fill();

        // Subtle weathered top highlight & dark granite crystal speckle
        ctx.strokeStyle = 'rgba(255, 248, 235, 0.18)';
        ctx.lineWidth = 1.1;
        ctx.stroke();

        ctx.fillStyle = 'rgba(30, 32, 36, 0.12)';
        ctx.fillRect(rx + 3, ry + 4, 3, 3);
        ctx.fillRect(rx + cobbleW - 7, ry + cobbleH - 8, 3, 3);

        ctx.restore();
      }
    }
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createMarbleBacksplashTexture(): THREE.CanvasTexture {
  const canvas = getOrCreateCachedCanvas('marble-backsplash', 512, 192, (ctx) => {
    // Warm Carrara / Calacatta marble base
    const bg = ctx.createLinearGradient(0, 0, 512, 192);
    bg.addColorStop(0, '#f4f1ea');
    bg.addColorStop(0.5, '#faf8f4');
    bg.addColorStop(1, '#eeeae0');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 192);

    // Soft cloudy mineral wash
    for (let i = 0; i < 12; i++) {
      const cx = (i * 47) % 512;
      const cy = (i * 31) % 192;
      const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 75);
      g.addColorStop(0, 'rgba(195, 190, 182, 0.16)');
      g.addColorStop(1, 'rgba(195, 190, 182, 0.0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 512, 192);
    }

    // Organic diagonal grey-taupe marble veins across the slab
    const veins: ReadonlyArray<readonly [number, number, number, number, number, number, number, string]> = [
      [15, 180, 110, 110, 210, 55, 1.8, 'rgba(148, 144, 138, 0.42)'],
      [95, 190, 175, 125, 270, 20, 1.1, 'rgba(165, 158, 148, 0.32)'],
      [180, 170, 260, 95, 360, 30, 2.1, 'rgba(140, 136, 130, 0.45)'],
      [230, 140, 310, 85, 410, 15, 1.0, 'rgba(175, 162, 142, 0.28)'],
      [320, 185, 395, 115, 495, 45, 1.7, 'rgba(146, 142, 136, 0.38)'],
      [50, 90, 145, 50, 240, 12, 0.9, 'rgba(156, 152, 146, 0.28)'],
      [370, 150, 430, 95, 505, 70, 1.1, 'rgba(162, 155, 145, 0.3)'],
    ];

    for (const [x0, y0, cx, cy, x1, y1, width, color] of veins) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(cx, cy, x1, y1);
      ctx.stroke();
    }
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createCementTexture(): THREE.CanvasTexture {
  const canvas = getOrCreateCachedCanvas('cement', 256, 256, (ctx) => {
    // Modern architectural cast-cement neutral grey base
    ctx.fillStyle = '#9a9892';
    ctx.fillRect(0, 0, 256, 256);

    // Soft organic trowel / formwork clouding
    for (let i = 0; i < 18; i++) {
      const cx = (i * 53) % 256;
      const cy = (i * 41) % 256;
      const r = 36 + ((i * 19) % 44);
      const isLight = i % 2 === 0;
      const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, r);
      grad.addColorStop(
        0,
        isLight ? 'rgba(182, 180, 174, 0.22)' : 'rgba(122, 120, 115, 0.20)'
      );
      grad.addColorStop(1, 'rgba(154, 152, 146, 0.0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 256);
    }

    // Fine cast-concrete aggregate & micro-pinhole pores
    for (let y = 0; y < 256; y += 4) {
      for (let x = 0; x < 256; x += 4) {
        const hash = (x * 29 + y * 47) % 19;
        if (hash === 0) {
          ctx.fillStyle = 'rgba(104, 102, 98, 0.35)';
          ctx.fillRect(x, y, 2, 2);
        } else if (hash === 1) {
          ctx.fillStyle = 'rgba(192, 190, 184, 0.28)';
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createGraniteSettDepthMapTexture(): THREE.CanvasTexture {
  return createGraniteSettLPathTextures().depthMap;
}

export function createGraniteSettLPathTextures(): {
  readonly colorMap: THREE.CanvasTexture;
  readonly depthMap: THREE.CanvasTexture;
} {
  return getOrCreateCachedTexture('granite-sett-lpath', () => {
    // World-space bounds of the T-shaped cobblestone path around the Kitchen, Patio & Pergola:
    // X: -4.64m to +6.74m (span 11.38m)
    // Z: -2.78m to +7.35m (span 10.13m — covers North Utility door at -2.78m, South Kitchen path at 2.27..3.73m,
    //                      and the full South branch between the Patio and Pergola down to Z = +7.35m, Issue #2!)
    const worldMinX = -4.64;
    const worldSpanX = 11.38;
    const worldMinZ = -2.78;
    const worldSpanZ = 10.13;

    const width = 1600;
    const height = 1424; // Matches 11.38 : 10.13 aspect ratio (~140.6 px/m in both X and Z)
    const pxPerMeterX = width / worldSpanX;
    const pxPerMeterZ = height / worldSpanZ;
    const pxPerMeter = (pxPerMeterX + pxPerMeterZ) * 0.5;

    const [colorCanvas, depthCanvas] = getOrCreateCachedCanvasPair(
      'granite-sett-lpath',
      width,
      height,
      (cCtx, dCtx) => {
      const hash01 = (n: number): number => {
        const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
        return s - Math.floor(s);
      };

      // 1. Weathered sandy-lime mortar bed with organic earth/moss patina variation & recessed mortar depth
      cCtx.fillStyle = '#c6b38e';
      cCtx.fillRect(0, 0, width, height);

      dCtx.fillStyle = '#141414';
      dCtx.fillRect(0, 0, width, height);

      for (let y = 0; y < height; y += 4) {
        for (let x = 0; x < width; x += 4) {
          const h1 = hash01(x * 17 + y * 31);
          const h2 = hash01(x * 41 + y * 19 + 11);
          const macro =
            Math.sin(x * 0.012 + y * 0.009) * 6 +
            Math.cos(x * 0.021 - y * 0.017) * 5;
          const delta = Math.round((h1 - 0.5) * 18 + macro);
          // Occasional subtle mossy/earthy joint patina (~14% of mortar cells)
          const mossShift = h2 > 0.86 ? 12 : 0;
          const mr = Math.max(145, Math.min(225, 198 + delta - mossShift));
          const mg = Math.max(135, Math.min(210, 179 + delta + Math.round(mossShift * 0.4)));
          const mb = Math.max(105, Math.min(180, 142 + delta - mossShift));
          cCtx.fillStyle = `rgb(${mr}, ${mg}, ${mb})`;
          cCtx.fillRect(x, y, 4, 4);

          const dv = Math.max(8, Math.min(36, 20 + Math.round(delta * 0.65)));
          dCtx.fillStyle = `rgb(${dv}, ${dv}, ${dv})`;
          dCtx.fillRect(x, y, 4, 4);
        }
      }

      const granitePalette: ReadonlyArray<readonly [number, number, number]> = [
        [125, 129, 134], // Weathered silver-grey granite
        [108, 115, 123], // Blue-grey Leicestershire sett
        [143, 123, 116], // Warm porphyry rose-grey
        [146, 136, 121], // Buff-taupe weathered gritstone
        [98, 102, 108],  // Dark charcoal-slate sett
        [134, 137, 142], // Pale quartz-grey granite
        [127, 109, 103], // Earthy brown-rose granite
        [116, 121, 126], // Mid steel-grey granite
        [155, 143, 128], // Warm honey-sandstone sett
        [91, 96, 102],   // Deep basalt-grey sett
        [138, 128, 118], // Weathered warm greige
        [112, 106, 100], // Smoked umber-grey sett
      ];

      // Helper to trace an organic, hand-cleaved granite sett contour (8-point irregular chamfered polygon)
      const traceOrganicCobblePath = (
        ctx: CanvasRenderingContext2D,
        w: number,
        h: number,
        seed: number,
        inset = 0
      ): void => {
        const hw = Math.max(2, w * 0.5 - inset);
        const hh = Math.max(2, h * 0.5 - inset);
        const cTL = Math.min(hw * 0.45, hh * 0.45, 2.2 + hash01(seed + 1) * 2.6);
        const cTR = Math.min(hw * 0.45, hh * 0.45, 2.2 + hash01(seed + 2) * 2.6);
        const cBR = Math.min(hw * 0.45, hh * 0.45, 2.2 + hash01(seed + 3) * 2.6);
        const cBL = Math.min(hw * 0.45, hh * 0.45, 2.2 + hash01(seed + 4) * 2.6);
        const skewT = (hash01(seed + 5) - 0.5) * 1.6;
        const skewB = (hash01(seed + 6) - 0.5) * 1.6;
        const skewL = (hash01(seed + 7) - 0.5) * 1.4;
        const skewR = (hash01(seed + 8) - 0.5) * 1.4;

        ctx.beginPath();
        ctx.moveTo(-hw + cTL, -hh + skewT * 0.4);
        ctx.lineTo(0, -hh - skewT * 0.5);
        ctx.lineTo(hw - cTR, -hh + skewT * 0.3);
        ctx.quadraticCurveTo(hw, -hh, hw + skewR * 0.3, -hh + cTR);
        ctx.lineTo(hw - skewR * 0.4, 0);
        ctx.lineTo(hw + skewR * 0.2, hh - cBR);
        ctx.quadraticCurveTo(hw, hh, hw - cBR, hh + skewB * 0.3);
        ctx.lineTo(0, hh - skewB * 0.5);
        ctx.lineTo(-hw + cBL, hh + skewB * 0.4);
        ctx.quadraticCurveTo(-hw, hh, -hw + skewL * 0.3, hh - cBL);
        ctx.lineTo(-hw - skewL * 0.4, 0);
        ctx.lineTo(-hw + skewL * 0.2, -hh + cTL);
        ctx.quadraticCurveTo(-hw, -hh, -hw + cTL, -hh + skewT * 0.4);
        ctx.closePath();
      };

      const drawSingleGraniteSett = (
        wx: number,
        wz: number,
        totalAngle: number,
        baseCobbleW: number,
        baseCobbleH: number,
        seed: number
      ): void => {
        // Organic per-stone position, angle & dimensional jitter (Issue #1: natural hand-laid look)
        const jitterS = (hash01(seed * 13 + 1) - 0.5) * 0.009;
        const jitterU = (hash01(seed * 17 + 2) - 0.5) * 0.008;
        const cxPx = (wx + jitterS - worldMinX) * pxPerMeterX;
        const cyPx = (wz + jitterU - worldMinZ) * pxPerMeterZ;
        if (cxPx < -24 || cxPx > width + 24 || cyPx < -24 || cyPx > height + 24) {
          return;
        }

        const angleJitter = (hash01(seed * 19 + 3) - 0.5) * 0.095;
        const wScale = 0.88 + hash01(seed * 23 + 4) * 0.24;
        const hScale = 0.90 + hash01(seed * 29 + 5) * 0.20;
        const cobbleW = Math.max(9, baseCobbleW * wScale);
        const cobbleH = Math.max(9, baseCobbleH * hScale);

        const [r0, g0, b0] =
          granitePalette[Math.abs(seed * 7) % granitePalette.length] ?? [125, 129, 134];
        // Macro spatial weathering + per-stone tonal variation
        const macroTone =
          Math.sin(wx * 1.15 + wz * 0.95) * 8 +
          Math.cos(wx * 0.65 - wz * 1.35) * 6;
        const stoneDelta = Math.round((hash01(seed * 31 + 6) - 0.5) * 24 + macroTone);
        const warmShift = Math.round((hash01(seed * 37 + 7) - 0.5) * 10);
        const cr = Math.max(55, Math.min(205, r0 + stoneDelta + warmShift));
        const cg = Math.max(55, Math.min(200, g0 + stoneDelta));
        const cb = Math.max(55, Math.min(198, b0 + stoneDelta - warmShift));
        const cobbleHeightBias = Math.round((hash01(seed * 41 + 8) - 0.5) * 34);

        // Draw cobble in Color Map
        cCtx.save();
        cCtx.translate(cxPx, cyPx);
        cCtx.rotate(totalAngle + angleJitter);

        // 1. Dark mortar-edge perimeter rim
        cCtx.fillStyle = `rgb(${Math.max(40, cr - 22)}, ${Math.max(40, cg - 22)}, ${Math.max(40, cb - 22)})`;
        traceOrganicCobblePath(cCtx, cobbleW, cobbleH, seed, 0);
        cCtx.fill();

        // 2. Riven granite body with natural diagonal mineral gradient
        const grad = cCtx.createLinearGradient(
          -cobbleW * 0.5,
          -cobbleH * 0.5,
          cobbleW * 0.5,
          cobbleH * 0.5
        );
        grad.addColorStop(
          0,
          `rgb(${Math.min(225, cr + 12)}, ${Math.min(220, cg + 11)}, ${Math.min(218, cb + 10)})`
        );
        grad.addColorStop(0.55, `rgb(${cr}, ${cg}, ${cb})`);
        grad.addColorStop(
          1,
          `rgb(${Math.max(42, cr - 14)}, ${Math.max(42, cg - 14)}, ${Math.max(42, cb - 14)})`
        );
        cCtx.fillStyle = grad;
        traceOrganicCobblePath(cCtx, cobbleW, cobbleH, seed, 1.1);
        cCtx.fill();

        // 3. Natural quartz/feldspar mineral speckles & riven cleavage facets
        for (let k = 0; k < 3; k++) {
          const sx = (hash01(seed * 43 + k * 7) - 0.5) * (cobbleW * 0.55);
          const sy = (hash01(seed * 47 + k * 11) - 0.5) * (cobbleH * 0.55);
          const isLightSpeck = (seed + k) % 2 === 0;
          cCtx.fillStyle = isLightSpeck
            ? 'rgba(245, 238, 225, 0.16)'
            : 'rgba(28, 30, 34, 0.16)';
          cCtx.fillRect(sx - 1.5, sy - 1.5, 3, 2.5);
        }

        cCtx.strokeStyle = 'rgba(255, 248, 235, 0.16)';
        cCtx.lineWidth = 0.9;
        cCtx.stroke();
        cCtx.restore();

        // Draw cobble in 3D Depth Map
        dCtx.save();
        dCtx.translate(cxPx, cyPx);
        dCtx.rotate(totalAngle + angleJitter);

        const rings: ReadonlyArray<readonly [number, number]> = [
          [0.0, 92],
          [1.3, 152],
          [2.6, 204],
          [4.2, 236],
        ];
        for (const [inset, baseLum] of rings) {
          const lum = Math.max(42, Math.min(255, baseLum + cobbleHeightBias));
          dCtx.fillStyle = `rgb(${lum}, ${lum}, ${lum})`;
          traceOrganicCobblePath(dCtx, cobbleW, cobbleH, seed, inset);
          dCtx.fill();
        }
        dCtx.restore();
      };

      // Path geometry & continuous repeating arc parameters in meters:
      const pathW = 1.46;
      const numRows = 8;
      const cobbleStepU = pathW / numRows; // 0.1825m across path width
      const courseStep = 0.1437559;        // 0.1438m per arc course along path
      const arcPivotR = 1.18;
      const baseCobbleW = (courseStep - 0.026) * pxPerMeter;
      const baseCobbleH = (cobbleStepU - 0.026) * pxPerMeter;

      // 1) Continuous North-to-South East Cobble Path (X = +5.28m..+6.74m, Z = -2.78m..+7.35m)
      //    Runs smoothly from the Utility Room door (Z = -1.85m) past the Kitchen East window
      //    AND straight South between the Patio East brick wall (X = +5.20m) and Pergola (X = +6.82m)
      //    with zero corner distortion and zero UV clamping at [5.633, -0.01, 6.632] (Issue #2)!
      for (let c = -22; c <= 54; c++) {
        const staggerU = (Math.abs(c) % 2) * (cobbleStepU * 0.5);
        for (let s = 0; s < numRows; s++) {
          const u = (s + 0.5) * cobbleStepU + (staggerU - cobbleStepU * 0.25) * 0.55;
          const du = u - pathW * 0.5;
          const clampedDu = Math.max(-arcPivotR + 0.15, Math.min(arcPivotR - 0.15, du));
          const arcBow = arcPivotR - Math.sqrt(arcPivotR * arcPivotR - clampedDu * clampedDu);
          const arcTangentAngle = Math.asin(clampedDu / arcPivotR);

          const wx = 5.28 + u;
          const wz = c * courseStep - arcBow;
          if (wz < -2.85 || wz > 7.42) continue;

          const seed = (c + 64) * 37 + (s + 12) * 19 + 101;
          drawSingleGraniteSett(
            wx,
            wz,
            -Math.PI * 0.5 + arcTangentAngle,
            baseCobbleW,
            baseCobbleH,
            seed
          );
        }
      }

      // 2) South Cobble Path in front of the Kitchen Bifold Doors (X = -4.64m..+5.28m, Z = +2.27m..+3.73m)
      //    Meets the East Cobble Path cleanly along the X = +5.28m threshold line!
      for (let c = -72; c <= 38; c++) {
        const staggerU = (Math.abs(c) % 2) * (cobbleStepU * 0.5);
        for (let s = 0; s < numRows; s++) {
          const u = (s + 0.5) * cobbleStepU + (staggerU - cobbleStepU * 0.25) * 0.55;
          const du = u - pathW * 0.5;
          const clampedDu = Math.max(-arcPivotR + 0.15, Math.min(arcPivotR - 0.15, du));
          const arcBow = arcPivotR - Math.sqrt(arcPivotR * arcPivotR - clampedDu * clampedDu);
          const arcTangentAngle = Math.asin(clampedDu / arcPivotR);

          const wx = c * courseStep - arcBow;
          const wz = 2.27 + u;
          // Stop cleanly at X = 5.26m so it never overlaps the continuous East path (X = 5.28..6.74m)
          if (wx < -4.75 || wx > 5.24) continue;

          const seed = (c + 128) * 41 + (s + 16) * 23 + 17;
          drawSingleGraniteSett(wx, wz, arcTangentAngle, baseCobbleW, baseCobbleH, seed);
        }
      }
      }
    );

    const colorMap = new THREE.CanvasTexture(colorCanvas);
    colorMap.wrapS = THREE.ClampToEdgeWrapping;
    colorMap.wrapT = THREE.ClampToEdgeWrapping;
    colorMap.colorSpace = THREE.SRGBColorSpace;
    colorMap.anisotropy = 8;

    const depthMap = new THREE.CanvasTexture(depthCanvas);
    depthMap.wrapS = THREE.ClampToEdgeWrapping;
    depthMap.wrapT = THREE.ClampToEdgeWrapping;
    depthMap.anisotropy = 8;

    return { colorMap, depthMap };
  });
}

export function createHerringboneTerracottaQuarryTileTextures(): {
  readonly colorMap: THREE.CanvasTexture;
  readonly bumpMap: THREE.CanvasTexture;
} {
  return getOrCreateCachedTexture('herringbone-terracotta-quarry', () => {
    const size = 512;
    const [colorCanvas, bumpCanvas] = getOrCreateCachedCanvasPair(
      'herringbone-terracotta-quarry',
      size,
      size,
      (cCtx, bCtx) => {
      // Dark charcoal-earth / lime-ash grout bed between sealed terracotta quarry tiles
      cCtx.fillStyle = '#3d332c';
      cCtx.fillRect(0, 0, size, size);

      bCtx.fillStyle = '#181818';
      bCtx.fillRect(0, 0, size, size);

      // Muted, naturally aged Staffordshire & reclaimed farmhouse terracotta quarry tile palette (Issue #11: slightly lower saturation)
      const quarryPalette: ReadonlyArray<readonly [number, number, number]> = [
        [142, 84, 64],  // Muted sealed terracotta clay
        [132, 77, 58],  // Deep kiln-fired quarry russet
        [150, 91, 68],  // Warm muted sienna clay
        [124, 72, 55],  // Earthy russet brown-red
        [145, 86, 65],  // Soft heritage terracotta
        [136, 80, 61],  // Mid farmhouse weathered clay
        [118, 69, 53],  // Toasted kiln-edge umber-russet
        [154, 94, 71],  // Sunlit sealed warm clay
        [129, 76, 58],  // Aged iron-oxide earth
        [139, 82, 62],  // Traditional muted quarry tile
      ];

      // Exact 45-degree orthogonal herringbone grid with period 12 in (u, v) -> 100% seamless across 512x512
      const periodUV = 12;
      const stepPx = size / periodUV; // 42.6667px in (x+y) and (y-x)
      const tileUnitPx = stepPx / Math.SQRT2; // ~30.17px per tile width
      const groutPx = 2.4;

      const drawRotatedTile = (
        iu0: number,
        iv0: number,
        spanU: number,
        spanV: number
      ): void => {
        // Periodic tile indices modulo 12 guarantee seamless wrap across 0..512
        const pu = ((iu0 % periodUV) + periodUV) % periodUV;
        const pv = ((iv0 % periodUV) + periodUV) % periodUV;
        const seed = pu * 37 + pv * 53 + spanU * 19;
        const [baseR, baseG, baseB] =
          quarryPalette[Math.abs(seed) % quarryPalette.length] ?? [152, 70, 47];
        const delta = ((seed * 17) % 14) - 7;
        const r = Math.max(40, Math.min(225, baseR + delta));
        const g = Math.max(25, Math.min(185, baseG + Math.round(delta * 0.65)));
        const b = Math.max(20, Math.min(165, baseB + Math.round(delta * 0.5)));

        const centerU = iu0 + spanU * 0.5;
        const centerV = iv0 + spanV * 0.5;
        const cx = (centerU - centerV) * (stepPx * 0.5);
        const cy = (centerU + centerV) * (stepPx * 0.5);

        const wPx = spanU * tileUnitPx - groutPx;
        const hPx = spanV * tileUnitPx - groutPx;

        if (
          cx + Math.max(wPx, hPx) < -16 ||
          cx - Math.max(wPx, hPx) > size + 16 ||
          cy + Math.max(wPx, hPx) < -16 ||
          cy - Math.max(wPx, hPx) > size + 16
        ) {
          return;
        }

        // Color Map: Sealed terracotta quarry tile with subtle kiln edge shading & satin wax sheen
        cCtx.save();
        cCtx.translate(cx, cy);
        cCtx.rotate(Math.PI * 0.25);

        // Subtle darker kiln-baked perimeter rim on each handmade quarry tile
        cCtx.fillStyle = `rgb(${Math.max(30, r - 14)}, ${Math.max(20, g - 10)}, ${Math.max(15, b - 8)})`;
        cCtx.beginPath();
        cCtx.roundRect(-wPx * 0.5, -hPx * 0.5, wPx, hPx, 2.2);
        cCtx.fill();

        // Warm sealed terracotta center body
        const bodyGrad = cCtx.createLinearGradient(-wPx * 0.5, -hPx * 0.5, wPx * 0.5, hPx * 0.5);
        bodyGrad.addColorStop(0.0, `rgb(${Math.min(235, r + 6)}, ${Math.min(195, g + 4)}, ${Math.min(175, b + 3)})`);
        bodyGrad.addColorStop(0.5, `rgb(${r}, ${g}, ${b})`);
        bodyGrad.addColorStop(1.0, `rgb(${Math.max(35, r - 8)}, ${Math.max(22, g - 6)}, ${Math.max(18, b - 5)})`);
        cCtx.fillStyle = bodyGrad;
        cCtx.beginPath();
        cCtx.roundRect(-wPx * 0.5 + 1.5, -hPx * 0.5 + 1.5, wPx - 3, hPx - 3, 1.6);
        cCtx.fill();

        // Subtle bevel edge highlight along top-left arris
        cCtx.strokeStyle = 'rgba(255, 224, 196, 0.16)';
        cCtx.lineWidth = 1.0;
        cCtx.strokeRect(-wPx * 0.5 + 1.2, -hPx * 0.5 + 1.2, wPx - 2.4, hPx - 2.4);
        cCtx.restore();

        // Bump Map: Cushioned quarry tile profile above recessed grout
        const bumpBias = ((seed * 23) % 18) - 9;
        const rimLum = Math.max(110, Math.min(190, 150 + bumpBias));
        const faceLum = Math.max(195, Math.min(252, 228 + bumpBias));

        bCtx.save();
        bCtx.translate(cx, cy);
        bCtx.rotate(Math.PI * 0.25);

        bCtx.fillStyle = `rgb(${rimLum}, ${rimLum}, ${rimLum})`;
        bCtx.beginPath();
        bCtx.roundRect(-wPx * 0.5, -hPx * 0.5, wPx, hPx, 2.2);
        bCtx.fill();

        bCtx.fillStyle = `rgb(${faceLum}, ${faceLum}, ${faceLum})`;
        bCtx.beginPath();
        bCtx.roundRect(-wPx * 0.5 + 2.0, -hPx * 0.5 + 2.0, wPx - 4.0, hPx - 4.0, 1.4);
        bCtx.fill();
        bCtx.restore();
      };

      for (let iv = -16; iv <= 28; iv++) {
        for (let iu = -16; iu <= 28; iu++) {
          const m = ((iu - iv) % 6 + 6) % 6;
          if (m === 0) {
            // Horizontal 3:1 quarry tile in (u, v) space
            drawRotatedTile(iu, iv, 3, 1);
          } else if (m === 5) {
            // Vertical 1:3 quarry tile in (u, v) space
            drawRotatedTile(iu, iv, 1, 3);
          }
        }
      }
      }
    );

    const colorMap = new THREE.CanvasTexture(colorCanvas);
    colorMap.wrapS = THREE.RepeatWrapping;
    colorMap.wrapT = THREE.RepeatWrapping;
    colorMap.colorSpace = THREE.SRGBColorSpace;

    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.RepeatWrapping;

    return { colorMap, bumpMap };
  });
}
