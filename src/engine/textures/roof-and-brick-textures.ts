import * as THREE from 'three';
import {
  getOrCreateCachedCanvasPair,
  getOrCreateCachedTexture,
} from './texture-registry.ts';

export function createWelshSlateRoofTextures(): {
  readonly colorMap: THREE.CanvasTexture;
  readonly bumpMap: THREE.CanvasTexture;
} {
  return getOrCreateCachedTexture('welsh-slate-roof', () => {
    const size = 1024;
    const [colorCanvas, bumpCanvas] = getOrCreateCachedCanvasPair(
      'welsh-slate-roof',
      size,
      size,
      (cCtx, bCtx) => {
      const hash01 = (n: number): number => {
        const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
        return s - Math.floor(s);
      };

      // Deep slate shadow bed for perp joints & under-tail recesses
      cCtx.fillStyle = '#1e2329';
      cCtx.fillRect(0, 0, size, size);

      bCtx.fillStyle = '#121212';
      bCtx.fillRect(0, 0, size, size);

      // 16 horizontal slate courses across 1024px (64px per exposed gauge course)
      // 8 slates across 1024px (128px per slate width) in traditional 50% broken-bond double-lap slating
      const numRows = 16;
      const numCols = 8;
      const courseH = size / numRows; // 64px
      const tileW = size / numCols;   // 128px

      // Authentic North Wales (Penrhyn Heather-Blue & Ffestiniog Dark Blue-Grey) slate mineral palette
      const slatePalette: ReadonlyArray<readonly [number, number, number]> = [
        [58, 66, 76],   // Classic Ffestiniog blue-grey
        [66, 74, 85],   // Weathered silver-blue slate
        [52, 59, 68],   // Deep quarry wet-blue slate
        [64, 68, 79],   // Penrhyn subtle heather-blue
        [71, 79, 90],   // Sunlit pale dove-slate
        [55, 62, 72],   // Mid blue-charcoal slate
        [61, 66, 75],   // Muted steel-grey slate
        [48, 55, 64],   // Dark riven basal slate
        [68, 73, 82],   // Warm weathered slate grey
        [59, 68, 78],   // Sea-mist Welsh slate
      ];

      for (let row = 0; row < numRows; row++) {
        const y0 = row * courseH;
        const stagger = (row % 2) * (tileW * 0.5);

        for (let col = -1; col <= numCols; col++) {
          const colMod = ((col % numCols) + numCols) % numCols;
          const seed = row * 53 + colMod * 29 + 17;

          const baseRgb = slatePalette[seed % slatePalette.length] ?? [58, 66, 76];
          const toneDelta = Math.round((hash01(seed * 13 + 3) - 0.5) * 16);
          const plumShift = Math.round((hash01(seed * 19 + 7) - 0.5) * 6);
          const sr = Math.max(34, Math.min(115, baseRgb[0] + toneDelta + plumShift));
          const sg = Math.max(38, Math.min(122, baseRgb[1] + toneDelta));
          const sb = Math.max(44, Math.min(134, baseRgb[2] + toneDelta - plumShift));

          // Slight per-slate tail drop jitter & perp-joint width for authentic hand-dressed roof slating
          const perpGap = 3.2;
          const tailJitter = (hash01(seed * 23 + 11) - 0.5) * 1.8;
          const chamfer = 4.5 + hash01(seed * 31 + 5) * 3.5; // Traditional dressed corner shoulder chamfer at tail
          const xLeft = col * tileW + stagger + perpGap * 0.5;
          const sW = tileW - perpGap;
          const sH = courseH - 2.2 + tailJitter;

          // Sawtooth course elevation in bump map (upper head of slate is lower, bottom tail is raised proud)
          const slateBumpBias = Math.round((hash01(seed * 37 + 9) - 0.5) * 24);
          const headBump = Math.max(70, Math.min(175, 118 + slateBumpBias));
          const tailBump = Math.max(165, Math.min(252, 224 + slateBumpBias));

          // Trace hand-dressed slate with slightly irregular riven bottom edge & chamfered tail corners
          const traceSlatePath = (ctx: CanvasRenderingContext2D, ox: number, oy: number, w: number, h: number): void => {
            const midWave1 = (hash01(seed * 41 + 1) - 0.5) * 1.4;
            const midWave2 = (hash01(seed * 43 + 2) - 0.5) * 1.4;
            ctx.beginPath();
            ctx.moveTo(ox, oy);
            ctx.lineTo(ox + w, oy);
            ctx.lineTo(ox + w, oy + h - chamfer);
            ctx.lineTo(ox + w - chamfer, oy + h);
            ctx.lineTo(ox + w * 0.66, oy + h + midWave2);
            ctx.lineTo(ox + w * 0.33, oy + h + midWave1);
            ctx.lineTo(ox + chamfer, oy + h);
            ctx.lineTo(ox, oy + h - chamfer);
            ctx.closePath();
          };

          // 1. Base slate body with down-slope weather & sky reflection gradient
          const bodyGrad = cCtx.createLinearGradient(xLeft, y0, xLeft, y0 + sH);
          bodyGrad.addColorStop(0.0, `rgb(${Math.max(28, sr - 10)}, ${Math.max(32, sg - 10)}, ${Math.max(38, sb - 9)})`);
          bodyGrad.addColorStop(0.22, `rgb(${sr}, ${sg}, ${sb})`);
          bodyGrad.addColorStop(0.82, `rgb(${Math.min(130, sr + 7)}, ${Math.min(138, sg + 8)}, ${Math.min(148, sb + 9)})`);
          bodyGrad.addColorStop(1.0, `rgb(${Math.min(142, sr + 12)}, ${Math.min(150, sg + 13)}, ${Math.min(162, sb + 14)})`);
          cCtx.fillStyle = bodyGrad;
          traceSlatePath(cCtx, xLeft, y0, sW, sH);
          cCtx.fill();

          // Stepped sawtooth ramp in bumpMap
          const bumpGrad = bCtx.createLinearGradient(xLeft, y0, xLeft, y0 + sH);
          bumpGrad.addColorStop(0.0, `rgb(${headBump}, ${headBump}, ${headBump})`);
          bumpGrad.addColorStop(0.88, `rgb(${tailBump - 12}, ${tailBump - 12}, ${tailBump - 12})`);
          bumpGrad.addColorStop(1.0, `rgb(${tailBump}, ${tailBump}, ${tailBump})`);
          bCtx.fillStyle = bumpGrad;
          traceSlatePath(bCtx, xLeft, y0, sW, sH);
          bCtx.fill();

          // 2. Natural riven metamorphic cleavage layers (curved foliated mineral steps across the slate face)
          const numCleavageSteps = 4;
          for (let st = 0; st < numCleavageSteps; st++) {
            const fracY = 0.18 + st * 0.21 + (hash01(seed * 47 + st) - 0.5) * 0.08;
            const cy = y0 + fracY * sH;
            const stepH = 6 + hash01(seed * 53 + st) * 10;
            const isLightStep = (st + seed) % 2 === 0;
            cCtx.fillStyle = isLightStep
              ? 'rgba(210, 222, 236, 0.055)'
              : 'rgba(18, 22, 28, 0.065)';
            cCtx.fillRect(xLeft + 3, cy, sW - 6, stepH);

            // Cleavage terrace ridge in bumpMap
            const ridgeLum = isLightStep ? Math.min(255, tailBump + 10) : Math.max(50, headBump - 12);
            bCtx.fillStyle = `rgb(${ridgeLum}, ${ridgeLum}, ${ridgeLum})`;
            bCtx.fillRect(xLeft + 3, cy, sW - 6, 2.2);
          }

          // 3. Fine diagonal metamorphic mineral grain & quartz micro-vein
          cCtx.save();
          traceSlatePath(cCtx, xLeft, y0, sW, sH);
          cCtx.clip();
          for (let g = 0; g < 9; g++) {
            const gx0 = xLeft - 10 + hash01(seed * 59 + g * 7) * (sW + 20);
            const gy0 = y0 + hash01(seed * 61 + g * 11) * sH;
            const gLen = 22 + hash01(seed * 67 + g * 13) * 38;
            cCtx.strokeStyle = g % 2 === 0
              ? 'rgba(225, 235, 245, 0.048)'
              : 'rgba(16, 20, 25, 0.055)';
            cCtx.lineWidth = 1.2;
            cCtx.beginPath();
            cCtx.moveTo(gx0, gy0);
            cCtx.lineTo(gx0 + gLen, gy0 + (hash01(seed + g) - 0.5) * 8);
            cCtx.stroke();
          }

          // Occasional delicate pale-green / warm-gold crustose lichen colony (~22% of slates)
          if (hash01(seed * 71 + 19) < 0.22) {
            const lx = xLeft + 18 + hash01(seed * 73) * Math.max(12, sW - 36);
            const ly = y0 + 16 + hash01(seed * 79) * Math.max(10, sH - 28);
            const lr = 7 + hash01(seed * 83) * 9;
            const isGoldLichen = hash01(seed * 89) < 0.35;
            cCtx.fillStyle = isGoldLichen
              ? 'rgba(168, 152, 96, 0.14)'
              : 'rgba(136, 148, 130, 0.13)';
            cCtx.beginPath();
            cCtx.ellipse(lx, ly, lr * 1.3, lr * 0.75, 0.25, 0, Math.PI * 2);
            cCtx.fill();
          }
          cCtx.restore();

          // 4. Chiseled hand-dressed riven bevel highlight along the bottom tail & side edges of each slate
          cCtx.strokeStyle = 'rgba(205, 218, 232, 0.22)';
          cCtx.lineWidth = 1.3;
          cCtx.beginPath();
          cCtx.moveTo(xLeft + 1, y0 + 2);
          cCtx.lineTo(xLeft + 1, y0 + sH - chamfer);
          cCtx.lineTo(xLeft + chamfer, y0 + sH - 0.8);
          cCtx.lineTo(xLeft + sW - chamfer, y0 + sH - 0.8);
          cCtx.lineTo(xLeft + sW - 1, y0 + sH - chamfer);
          cCtx.stroke();
        }

        // 5. Crisp double-lap course shadow right below the tail of the upper slate course (`y0 .. y0 + 9`)
        const headShadow = cCtx.createLinearGradient(0, y0, 0, y0 + 10);
        headShadow.addColorStop(0.0, 'rgba(12, 15, 20, 0.82)');
        headShadow.addColorStop(0.45, 'rgba(18, 22, 28, 0.42)');
        headShadow.addColorStop(1.0, 'rgba(24, 29, 36, 0.0)');
        cCtx.fillStyle = headShadow;
        cCtx.fillRect(0, y0, size, 10);

        // Sharp recessed step drop at the course overlap line in bumpMap
        bCtx.fillStyle = '#181818';
        bCtx.fillRect(0, y0, size, 3);
      }
      }
    );

    const colorMap = new THREE.CanvasTexture(colorCanvas);
    colorMap.wrapS = THREE.RepeatWrapping;
    colorMap.wrapT = THREE.RepeatWrapping;
    colorMap.repeat.set(7.5, 3.2);
    colorMap.colorSpace = THREE.SRGBColorSpace;
    colorMap.anisotropy = 8;

    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.RepeatWrapping;
    bumpMap.repeat.set(7.5, 3.2);
    bumpMap.anisotropy = 8;

    return { colorMap, bumpMap };
  });
}

export function createWelshSlateRoofTexture(): THREE.CanvasTexture {
  return createWelshSlateRoofTextures().colorMap;
}

export function createImperialBrickTextures(): {
  readonly colorMap: THREE.CanvasTexture;
  readonly bumpMap: THREE.CanvasTexture;
} {
  return getOrCreateCachedTexture('imperial-brick', () => {
    const [colorCanvas, bumpCanvas] = getOrCreateCachedCanvasPair(
      'imperial-brick',
      512,
      512,
      (cCtx, bCtx) => {
      // Deterministic hash in [0, 1) for repeatable organic randomness
      const hash01 = (n: number): number => {
        const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
        return s - Math.floor(s);
      };

      // 1. Weathered lime-sand & grit mortar bed in colorMap & recessed uneven mortar joints in bumpMap
      cCtx.fillStyle = '#cabba0';
      cCtx.fillRect(0, 0, 512, 512);

      bCtx.fillStyle = '#181818';
      bCtx.fillRect(0, 0, 512, 512);

      for (let y = 0; y < 512; y += 3) {
        for (let x = 0; x < 512; x += 3) {
          // Periodic mod-512 coordinates so mortar grain is 100% seamless across tile boundaries
          const mx = x % 512;
          const my = y % 512;
          const h1 = hash01(mx * 17 + my * 31);
          const h2 = hash01(mx * 43 + my * 13 + 7);
          const d = Math.round((h1 - 0.5) * 24);
          const warmShift = Math.round((h2 - 0.5) * 10);
          cCtx.fillStyle = `rgb(${202 + d + warmShift}, ${188 + d}, ${161 + d - warmShift})`;
          cCtx.fillRect(x, y, 3, 3);

          // Subtle coarse sand/lime aggregate grit in mortar bump map
          const mb = Math.round(18 + h1 * 22);
          bCtx.fillStyle = `rgb(${mb}, ${mb}, ${mb})`;
          bCtx.fillRect(x, y, 3, 3);
        }
      }

      // Handmade English Imperial Multi-Stock Brick palette (~20% more rustic variation:
      // sun-baked terracotta, weathered russet, smoky kiln-flashed sienna, earthy buff-red, and dark vitrified clinker headers)
      const stretcherPalette: ReadonlyArray<readonly [number, number, number]> = [
        [162, 72, 53],  // Classic warm imperial red
        [176, 82, 57],  // Terracotta orange-red
        [142, 59, 43],  // Deep kiln red
        [186, 94, 64],  // Warm sandy orange-red
        [152, 67, 49],  // Weathered farmhouse red
        [168, 76, 55],  // Rich clay red
        [131, 53, 40],  // Dark russet red
        [181, 87, 60],  // Brighter handmade clay
        [124, 54, 43],  // Over-fired smoky brown-red
        [170, 88, 63],  // Weathered earthy ochre-red
        [146, 68, 52],  // Muted dusty rose-umber
        [190, 96, 66],  // Sun-bleached salmon-terracotta
      ];
      const headerPalette: ReadonlyArray<readonly [number, number, number]> = [
        [120, 56, 45],  // Vitrified plum/clinker header
        [142, 63, 47],  // Deep burnt header
        [158, 72, 53],  // Classic red header
        [108, 49, 41],  // Dark kiln-flashed charcoal-plum header
        [134, 64, 50],  // Weathered ash-glazed header
        [172, 80, 56],  // Warm orange-red header
      ];

      // 16 courses across 512px -> each course is 32px tall (representing 83mm Imperial course height: 73mm brick + 10mm lime mortar)
      // Flemish bond pattern per course: alternating Stretcher + Header + mortar = 128px repeating unit (4 units per 512px)
      const numCourses = 16;
      const courseH = 512 / numCourses; // 32px
      const mortarH = 4.8;
      const brickH = courseH - mortarH; // 27.2px
      const unitW = 128;
      const stretcherW = 81;
      const headerW = 38;
      const mortarW = 4.5;

      // Traces an irregular hand-moulded clay brick polygon with subtle wavy top/bottom arris & rounded corners
      const traceRusticBrickPath = (
        ctx: CanvasRenderingContext2D,
        bx: number,
        by: number,
        bw: number,
        bh: number,
        seed: number,
        inset = 0
      ): void => {
        const xL = bx + inset;
        const xR = bx + bw - inset;
        const yT = by + inset;
        const yB = by + bh - inset;
        const wSpan = xR - xL;
        const hSpan = yB - yT;
        const c = Math.max(1.2, 2.8 - inset * 0.5);

        const tWave1 = (hash01(seed * 11 + 1) - 0.5) * 1.8;
        const tWave2 = (hash01(seed * 11 + 2) - 0.5) * 1.8;
        const bWave1 = (hash01(seed * 11 + 3) - 0.5) * 1.8;
        const bWave2 = (hash01(seed * 11 + 4) - 0.5) * 1.8;
        const lWave = (hash01(seed * 11 + 5) - 0.5) * 1.4;
        const rWave = (hash01(seed * 11 + 6) - 0.5) * 1.4;

        ctx.beginPath();
        ctx.moveTo(xL + c, yT);
        ctx.lineTo(xL + wSpan * 0.35, yT + tWave1);
        ctx.lineTo(xL + wSpan * 0.68, yT + tWave2);
        ctx.lineTo(xR - c, yT);
        ctx.quadraticCurveTo(xR, yT, xR, yT + c);
        ctx.lineTo(xR + rWave, yT + hSpan * 0.5);
        ctx.lineTo(xR, yB - c);
        ctx.quadraticCurveTo(xR, yB, xR - c, yB);
        ctx.lineTo(xL + wSpan * 0.65, yB + bWave2);
        ctx.lineTo(xL + wSpan * 0.32, yB + bWave1);
        ctx.lineTo(xL + c, yB);
        ctx.quadraticCurveTo(xL, yB, xL, yB - c);
        ctx.lineTo(xL + lWave, yT + hSpan * 0.5);
        ctx.lineTo(xL, yT + c);
        ctx.quadraticCurveTo(xL, yT, xL + c, yT);
        ctx.closePath();
      };

      const drawBrick = (
        x0: number,
        y0: number,
        w: number,
        h: number,
        rgb: readonly [number, number, number],
        seed: number
      ): void => {
        const [r, g, b] = rgb;
        // Stronger per-brick tonal & saturation jitter (~20% more rustic)
        const delta = Math.round((hash01(seed * 19 + 3) - 0.5) * 26);
        const warmTint = Math.round((hash01(seed * 31 + 9) - 0.5) * 12);
        const br = Math.max(38, Math.min(238, r + delta + warmTint));
        const bg = Math.max(28, Math.min(212, g + Math.round(delta * 0.68)));
        const bb = Math.max(22, Math.min(195, b + Math.round(delta * 0.48) - Math.round(warmTint * 0.4)));

        // Subtle handmade dimensional jitter in position & size
        const jitterX = (hash01(seed * 23 + 5) - 0.5) * 1.8;
        const jitterY = (hash01(seed * 29 + 7) - 0.5) * 1.6;
        const jitterW = (hash01(seed * 37 + 11) - 0.5) * 2.2;
        const jitterH = (hash01(seed * 41 + 13) - 0.5) * 1.8;
        const effY = y0 + jitterY;
        const effW = w + jitterW;
        const effH = h + jitterH;

        // Draw wrapped across X = 0..512 so horizontal tiling is 100% seamless
        for (const wrapOffsetX of [-512, 0, 512]) {
          const bx = x0 + jitterX + wrapOffsetX;
          if (bx + effW < -2 || bx > 514) continue;

          // 1. Base handmade clay brick body with irregular hand-moulded arris
          cCtx.fillStyle = `rgb(${br}, ${bg}, ${bb})`;
          traceRusticBrickPath(cCtx, bx, effY, effW, effH, seed, 0);
          cCtx.fill();

          // 2. Kiln-flashing / coal-fired scorch patch on ~45% of bricks for authentic period character
          const flashRoll = hash01(seed * 47 + 17);
          if (flashRoll < 0.45) {
            const fx = bx + effW * (0.2 + 0.6 * hash01(seed * 53 + 1));
            const fy = effY + effH * (0.25 + 0.5 * hash01(seed * 59 + 2));
            const fr = Math.max(10, effW * (0.28 + 0.25 * hash01(seed * 61 + 3)));
            const grad = cCtx.createRadialGradient(fx, fy, 1, fx, fy, fr);
            if (flashRoll < 0.26) {
              // Dark vitrified kiln-burn / soot kiss mark
              grad.addColorStop(0, 'rgba(38, 22, 18, 0.34)');
              grad.addColorStop(1, 'rgba(38, 22, 18, 0)');
            } else {
              // Warm oxidized terracotta / sandy clay bloom
              grad.addColorStop(0, 'rgba(224, 132, 82, 0.28)');
              grad.addColorStop(1, 'rgba(224, 132, 82, 0)');
            }
            cCtx.fillStyle = grad;
            traceRusticBrickPath(cCtx, bx, effY, effW, effH, seed, 0.5);
            cCtx.fill();
          }

          // 3. Top edge warm sunlight catch & bottom edge weathered shadow
          cCtx.fillStyle = 'rgba(255, 235, 210, 0.13)';
          cCtx.fillRect(bx + 2.5, effY + 1, effW - 5, 2);
          cCtx.fillStyle = 'rgba(32, 16, 10, 0.20)';
          cCtx.fillRect(bx + 2.5, effY + effH - 2.6, effW - 5, 2.2);

          // 4. Natural handmade clay face mottling, sand-creased folds & occasional lime mortar smudge
          for (let py = 3; py < effH - 3; py += 5) {
            for (let px = 4; px < effW - 4; px += 7) {
              const cellHash = hash01(px * 23 + py * 41 + seed * 13);
              const m = Math.round((cellHash - 0.5) * 28);
              const patchW = 5 + Math.round(hash01(px * 17 + seed) * 4);
              const patchH = 3 + Math.round(hash01(py * 19 + seed) * 3);
              cCtx.fillStyle = `rgb(${Math.max(30, Math.min(245, br + m))}, ${Math.max(24, Math.min(220, bg + Math.round(m * 0.72)))}, ${Math.max(20, Math.min(205, bb + Math.round(m * 0.52)))})`;
              cCtx.fillRect(bx + px, effY + py, patchW, patchH);
            }
          }

          // Occasional subtle weathered lime-wash / mortar kiss along the brick edge (~28% of bricks)
          if (hash01(seed * 67 + 23) < 0.28) {
            const sx = bx + 3 + hash01(seed * 71) * Math.max(4, effW - 16);
            const sy = effY + (hash01(seed * 73) < 0.5 ? 1 : effH - 5);
            cCtx.fillStyle = 'rgba(212, 198, 174, 0.26)';
            cCtx.fillRect(sx, sy, 6 + hash01(seed * 79) * 8, 3.2);
          }

          // 5. Bump Map: Stronger per-brick relief variation, rounded arris & sand-creased surface pitting
          const bumpBias = Math.round((hash01(seed * 17 + 5) - 0.5) * 38);
          const edgeLum = Math.max(80, Math.min(185, 130 + bumpBias));
          const faceLum = Math.max(172, Math.min(252, 222 + bumpBias));

          bCtx.fillStyle = `rgb(${edgeLum}, ${edgeLum}, ${edgeLum})`;
          traceRusticBrickPath(bCtx, bx, effY, effW, effH, seed, 0);
          bCtx.fill();

          bCtx.fillStyle = `rgb(${faceLum}, ${faceLum}, ${faceLum})`;
          traceRusticBrickPath(bCtx, bx, effY, effW, effH, seed, 2.2);
          bCtx.fill();

          // Handmade sand-crease & surface pitting in bump map
          const creaseLum = Math.max(130, faceLum - 32);
          const creaseY = effY + effH * (0.38 + 0.24 * hash01(seed * 83));
          bCtx.fillStyle = `rgb(${creaseLum}, ${creaseLum}, ${creaseLum})`;
          bCtx.fillRect(bx + 5, creaseY, effW - 10, 2.2);

          for (let p = 0; p < 5; p++) {
            const pitX = bx + 4 + hash01(seed * 89 + p * 7) * Math.max(4, effW - 12);
            const pitY = effY + 4 + hash01(seed * 97 + p * 11) * Math.max(4, effH - 10);
            const pitLum = Math.max(120, faceLum - Math.round(18 + hash01(seed + p) * 26));
            bCtx.fillStyle = `rgb(${pitLum}, ${pitLum}, ${pitLum})`;
            bCtx.fillRect(pitX, pitY, 4, 3);
          }
        }
      };

      for (let row = 0; row < numCourses; row++) {
        // Slight per-course mortar bed undulation (periodic across 16 courses)
        const courseWaveY = Math.sin((row / numCourses) * Math.PI * 4) * 0.45;
        const y0 = row * courseH + mortarH * 0.5 + courseWaveY;
        // In Flemish bond, odd courses shift by half a repeating unit (64px)
        const rowShift = (row % 2) * (unitW * 0.5);

        for (let u = 0; u < 4; u++) {
          const baseX = u * unitW + rowShift;
          const seed1 = row * 37 + u * 13 + 7;
          const stretcherRgb =
            stretcherPalette[Math.abs(seed1 * 7 + row * 3) % stretcherPalette.length] ?? [162, 72, 53];
          drawBrick(baseX, y0, stretcherW, brickH, stretcherRgb, seed1);

          const headerX = baseX + stretcherW + mortarW;
          const seed2 = row * 53 + u * 29 + 19;
          const headerRgb =
            headerPalette[Math.abs(seed2 * 5 + row * 11) % headerPalette.length] ?? [136, 62, 48];
          drawBrick(headerX, y0, headerW, brickH, headerRgb, seed2);
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
