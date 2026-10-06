import * as THREE from 'three';
import {
  getOrCreateCachedCanvas,
  getOrCreateCachedCanvasPair,
  getOrCreateCachedTexture,
} from './texture-registry.ts';

export function createBraidedCableTexture(): THREE.CanvasTexture {
  const canvas = getOrCreateCachedCanvas('braided-cable', 64, 128, (ctx) => {
    // Charcoal-black woven textile base
    ctx.fillStyle = '#181a1d';
    ctx.fillRect(0, 0, 64, 128);

    // Interlocking diagonal off-white & black braided fabric strands
    ctx.strokeStyle = '#ece9e2';
    ctx.lineWidth = 4;
    for (let y = -64; y < 192; y += 12) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(64, y + 48);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(64, y + 6);
      ctx.lineTo(0, y + 54);
      ctx.stroke();
    }

    // Re-weave black cross-over checks for authentic braided flex look
    ctx.fillStyle = '#181a1d';
    for (let y = 0; y < 128; y += 12) {
      for (let x = 0; x < 64; x += 16) {
        const offset = (y / 12) % 2 === 0 ? 0 : 8;
        ctx.fillRect(x + offset, y, 5, 5);
      }
    }
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 18);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createDriftwoodTexture(): THREE.CanvasTexture {
  const canvas = getOrCreateCachedCanvas('driftwood', 256, 256, (ctx) => {
    // Sun-bleached, washed-out silver-taupe driftwood base
    ctx.fillStyle = '#aba193';
    ctx.fillRect(0, 0, 256, 256);

    // Weathered linear grain streaks in pale ash, chalky grey, and muted taupe
    for (let y = 0; y < 256; y += 2) {
      const wave = Math.sin(y * 0.09) * 6 + Math.cos(y * 0.23) * 3;
      const tone = 166 + Math.round(wave) + ((y * 13) % 14) - 7;
      ctx.fillStyle = `rgb(${tone + 5}, ${tone + 1}, ${tone - 6})`;
      ctx.fillRect(0, y, 256, 2);
    }

    // Chalky sun-bleached mineral pores along the wood grain
    ctx.strokeStyle = 'rgba(226, 220, 210, 0.32)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 42; i++) {
      const y = (i * 19) % 256;
      const x0 = (i * 37) % 180;
      const len = 35 + ((i * 29) % 65);
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 + len, y + ((i % 3) - 1));
      ctx.stroke();
    }
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createBrushedStainlessTexture(): THREE.CanvasTexture {
  return getOrCreateCachedTexture('brushed-stainless', () => {
    const canvas = getOrCreateCachedCanvas('brushed-stainless', 256, 256, (ctx) => {
      // Warm-neutral satin stainless steel base gradient (zero blue tint)
      const baseGrad = ctx.createLinearGradient(0, 0, 256, 256);
      baseGrad.addColorStop(0.0, '#a8a59e');
      baseGrad.addColorStop(0.28, '#c8c5be');
      baseGrad.addColorStop(0.5, '#9e9b95');
      baseGrad.addColorStop(0.76, '#d2cfc8');
      baseGrad.addColorStop(1.0, '#aba8a1');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, 256, 256);

      // Dense, crisp horizontal brushed stainless steel grain lines
      for (let y = 0; y < 256; y++) {
        const hash = (y * 29 + ((y * y) % 17)) % 16;
        const isLight = hash < 8;
        const alpha = 0.04 + (hash % 7) * 0.022;
        ctx.fillStyle = isLight
          ? `rgba(248, 245, 238, ${alpha})`
          : `rgba(58, 56, 52, ${alpha})`;
        ctx.fillRect(0, y, 256, 1);

        // Interrupted fine abrasive brush streaks along each horizontal pass
        for (let s = 0; s < 5; s++) {
          const sx = ((y * 43 + s * 67) % 220);
          const sw = 18 + ((y * 19 + s * 31) % 36);
          ctx.fillStyle =
            (y + s) % 2 === 0
              ? 'rgba(255, 252, 246, 0.11)'
              : 'rgba(46, 44, 41, 0.10)';
          ctx.fillRect(sx, y, sw, 1);
        }
      }
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}

export function createPolishedChromeTexture(): THREE.CanvasTexture {
  return getOrCreateCachedTexture('polished-chrome', () => {
    const canvas = getOrCreateCachedCanvas('polished-chrome', 256, 256, (ctx) => {
      // Smooth, high-luster mirror chrome gradient (NO brushed lines, NO blue tint)
      const mirrorGrad = ctx.createLinearGradient(0, 0, 256, 256);
      mirrorGrad.addColorStop(0.0, '#62605c');
      mirrorGrad.addColorStop(0.18, '#b8b5ae');
      mirrorGrad.addColorStop(0.32, '#f6f3ec');
      mirrorGrad.addColorStop(0.45, '#54524e');
      mirrorGrad.addColorStop(0.62, '#c8c5be');
      mirrorGrad.addColorStop(0.78, '#faf7f0');
      mirrorGrad.addColorStop(0.9, '#8c8983');
      mirrorGrad.addColorStop(1.0, '#5c5a56');
      ctx.fillStyle = mirrorGrad;
      ctx.fillRect(0, 0, 256, 256);

      // Soft secondary cross-reflection band for curved & flat mirror surfaces
      const crossGrad = ctx.createLinearGradient(0, 256, 256, 0);
      crossGrad.addColorStop(0.0, 'rgba(38, 36, 34, 0.18)');
      crossGrad.addColorStop(0.48, 'rgba(255, 252, 245, 0.24)');
      crossGrad.addColorStop(0.55, 'rgba(32, 30, 28, 0.20)');
      crossGrad.addColorStop(1.0, 'rgba(245, 242, 235, 0.15)');
      ctx.fillStyle = crossGrad;
      ctx.fillRect(0, 0, 256, 256);
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}

export function createEngineeredOakFloorTextures(): {
  readonly colorMap: THREE.CanvasTexture;
  readonly bumpMap: THREE.CanvasTexture;
} {
  return getOrCreateCachedTexture('engineered-oak-floor', () => {
    const size = 1024;
    const [colorCanvas, bumpCanvas] = getOrCreateCachedCanvasPair(
      'engineered-oak-floor',
      size,
      size,
      (cCtx, bCtx) => {
      // Knot & Grain "Old Farmhouse" natural oiled Heritage oak palette — shifted slightly darker & richer
      // so under Three.js room/sun lighting it reads as warm aged farmhouse oak rather than pale blonde
      const oakPlankPalette: ReadonlyArray<readonly [number, number, number]> = [
        [172, 132, 93],  // Rich Old Farmhouse honeyed oak (#ac845d)
        [164, 125, 87],  // Warm weathered taupe-amber oak (#a47d57)
        [178, 138, 98],  // Natural oiled farmhouse oak (#b28a62)
        [158, 119, 82],  // Deeper heartwood Heritage oak (#9e7752)
        [182, 143, 103], // Warm sunlit oiled oak (#b68f67)
        [168, 129, 90],  // Balanced aged farmhouse oak (#a8815a)
        [161, 122, 84],  // Warm rustic medium-dark oak (#a17a54)
        [175, 135, 96],  // Golden-umber brushed oak (#af8760)
      ];

      const clampByte = (v: number): number => Math.max(0, Math.min(255, Math.round(v)));

      // World tile = 4.40m (X) x 1.76m (Z):
      // - 8 courses of 128px = 220mm (0.22m) wide planks (8 * 0.22m = 1.76m)
      // - Full-length plank = 512px = 2200mm (2.20m) long (2 * 2.20m = 4.40m)
      // - Packs include ~20% cut lengths: 6 of 8 rows have two full 2200mm (512px) planks;
      //   2 of 8 rows (rows 2 & 6) split one 2200mm plank into two cut lengths (4 cut boards / 18 total = 22%).
      const numRows = 8;
      const rowH = size / numRows; // 128px = 220mm
      const rowJointLayouts: ReadonlyArray<ReadonlyArray<number>> = [
        [0, 512, size],               // Row 0: two full 2200mm planks (joints at 0m, 2.20m)
        [0, 320, 832, size],          // Row 1: two full 2200mm planks staggered by 1.375m
        [0, 144, 451, 656, size],     // Row 2: one full 2200mm plank + two cut lengths (1320mm + 880mm)
        [0, 416, 928, size],          // Row 3: two full 2200mm planks staggered by 1.79m
        [0, 192, 704, size],          // Row 4: two full 2200mm planks staggered by 0.825m
        [0, 464, 976, size],          // Row 5: two full 2200mm planks staggered by 1.99m
        [0, 240, 470, 752, size],     // Row 6: one full 2200mm plank + two cut lengths (990mm + 1210mm)
        [0, 96, 608, size],           // Row 7: two full 2200mm planks staggered by 0.41m
      ];

      for (let row = 0; row < numRows; row++) {
        const y0 = row * rowH;
        const joints = rowJointLayouts[row] ?? [0, 512, size];

        for (let seg = 0; seg < joints.length - 1; seg++) {
          const xStart = joints[seg] ?? 0;
          const xEnd = joints[seg + 1] ?? size;
          const segW = xEnd - xStart;
          if (segW <= 1) continue;

          // Ensure left-edge and right-edge wrapped segments of the same plank share identical identity
          const wrapsSeam = joints[1] !== 512;
          const plankId = wrapsSeam && seg === joints.length - 2 ? 0 : seg;
          const seed = row * 37 + plankId * 23 + 13;
          const [baseR, baseG, baseB] =
            oakPlankPalette[Math.abs(seed) % oakPlankPalette.length] ?? [168, 129, 90];

          // 1. Base plank fill + handcrafted undulated surface shading across plank width & length
          cCtx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
          cCtx.fillRect(xStart, y0, segW, rowH);

          const bumpBase = 198 + (((seed * 13) % 10) - 5);
          bCtx.fillStyle = `rgb(${bumpBase}, ${bumpBase}, ${bumpBase})`;
          bCtx.fillRect(xStart, y0, segW, rowH);

          // Soft cross-plank crown & sapwood/heartwood tonal gradient
          const plankGrad = cCtx.createLinearGradient(0, y0, 0, y0 + rowH);
          const edgeShift = (seed & 1) === 0 ? 5 : -5;
          const centerShift = -Math.round(edgeShift * 0.55);
          plankGrad.addColorStop(
            0,
            `rgba(${clampByte(baseR + edgeShift)}, ${clampByte(baseG + edgeShift)}, ${clampByte(baseB + Math.round(edgeShift * 0.85))}, 0.32)`
          );
          plankGrad.addColorStop(
            0.5,
            `rgba(${clampByte(baseR + centerShift)}, ${clampByte(baseG + centerShift)}, ${clampByte(baseB + Math.round(centerShift * 0.85))}, 0.24)`
          );
          plankGrad.addColorStop(
            1,
            `rgba(${clampByte(baseR - edgeShift)}, ${clampByte(baseG - edgeShift)}, ${clampByte(baseB - Math.round(edgeShift * 0.85))}, 0.32)`
          );
          cCtx.fillStyle = plankGrad;
          cCtx.fillRect(xStart, y0, segW, rowH);

          // 2. Sparse, natural knots: only ~4 subtle knots across the entire 18-plank (7.74 m²) tile!
          interface KnotSpec {
            readonly kx: number;
            readonly ky: number;
            readonly rx: number;
            readonly ry: number;
            readonly angle: number;
          }
          const knots: KnotSpec[] = [];
          const hasSingleKnot =
            segW >= 260 &&
            ((row === 1 && seg === 1) ||
              (row === 3 && seg === 1) ||
              (row === 5 && seg === 1) ||
              (row === 7 && seg === 1));
          if (hasSingleKnot) {
            const kHash = seed * 31 + 17;
            const marginX = 72;
            const usableW = Math.max(32, segW - marginX * 2);
            const kx = xStart + marginX + Math.floor((((kHash * 73) & 0x7fffffff) % usableW));
            const ky = y0 + 28 + Math.floor((((kHash * 41) & 0x7fffffff) % (rowH - 56)));
            const rx = 6.5 + ((kHash * 19) % 4); // Subtle 6.5..9.5px knot
            const ry = 3.2 + ((kHash * 11) % 2.2); // 3.2..5.0px
            const angle = (((kHash % 7) - 3) * 0.035);
            knots.push({ kx, ky, rx, ry, angle });
          }

          // 3. Heavily Brushed longitudinal woodgrain fibers & cathedral heartwood arches
          const cathedralCenterY = y0 + rowH * (0.32 + ((seed % 5) * 0.09));
          const numFibers = 76;
          const stepX = 16;

          for (let f = 0; f < numFibers; f++) {
            const t = (f + 0.5) / numFibers;
            const baseY = y0 + 2 + t * (rowH - 4);
            const distFromCathedral = (baseY - cathedralCenterY) / (rowH * 0.5);

            // Alternate between deep brushed earlywood pore grooves and raised oiled latewood ridges
            const fiberWave =
              Math.sin(f * 0.85 + seed * 0.4) * 6.0 +
              Math.cos(f * 1.9 + seed * 1.1) * 4.2 +
              Math.sin(distFromCathedral * Math.PI * 2.0) * 6.5;
            const isDarkPore = fiberWave < -2.5;
            const isLightRidge = fiberWave > 4.5;

            const dR = Math.round(fiberWave * 1.15 - (isDarkPore ? 6 : 0) + (isLightRidge ? 4 : 0));
            const dG = Math.round(fiberWave * 1.2 - (isDarkPore ? 7 : 0) + (isLightRidge ? 4 : 0));
            const dB = Math.round(fiberWave * 1.05 - (isDarkPore ? 6 : 0) + (isLightRidge ? 3 : 0));

            cCtx.strokeStyle = `rgba(${clampByte(baseR + dR)}, ${clampByte(baseG + dG)}, ${clampByte(baseB + dB)}, ${isDarkPore ? 0.58 : isLightRidge ? 0.44 : 0.32})`;
            cCtx.lineWidth = isDarkPore ? 1.45 : 1.15;

            const bVal = clampByte(
              bumpBase + (isDarkPore ? -36 : isLightRidge ? 22 : Math.round(fiberWave * 2.0))
            );
            bCtx.strokeStyle = `rgb(${bVal}, ${bVal}, ${bVal})`;
            bCtx.lineWidth = isDarkPore ? 1.45 : 1.1;

            cCtx.beginPath();
            bCtx.beginPath();
            for (let px = xStart; px <= xEnd; px += stepX) {
              const worldX = wrapsSeam && seg === joints.length - 2 ? px - size : px;
              // Undulated cathedral arch wave along the 2200mm plank length
              let gy =
                baseY +
                Math.sin(worldX * 0.0085 + seed * 0.7) * distFromCathedral * 6.0 +
                Math.cos(worldX * 0.021 + f * 0.18 + seed) * 1.5;

              // Deflect fiber smoothly around any knot in this plank
              for (const knot of knots) {
                const dx = px - knot.kx;
                const dy = baseY - knot.ky;
                const sigmaX = knot.rx * 3.0;
                const sigmaY = knot.ry * 3.4;
                const gauss = Math.exp(-(dx * dx) / (2 * sigmaX * sigmaX) - (dy * dy) / (2 * sigmaY * sigmaY));
                if (gauss > 0.01) {
                  const dir = dy >= 0 ? 1 : -1;
                  gy += dir * gauss * (knot.ry * 1.25);
                }
              }

              gy = Math.max(y0 + 1.5, Math.min(y0 + rowH - 1.5, gy));
              if (px === xStart) {
                cCtx.moveTo(px, gy);
                bCtx.moveTo(px, gy);
              } else {
                cCtx.lineTo(px, gy);
                bCtx.lineTo(px, gy);
              }
            }
            cCtx.stroke();
            bCtx.stroke();
          }

          // 4. Render subtle Heritage knot (when present on this plank)
          for (const knot of knots) {
            cCtx.save();
            cCtx.translate(knot.kx, knot.ky);
            cCtx.rotate(knot.angle);

            // Soft warm amber-brown grain halo
            const haloGrad = cCtx.createRadialGradient(
              0,
              0,
              knot.ry * 0.25,
              0,
              0,
              knot.rx * 1.45
            );
            haloGrad.addColorStop(0, 'rgba(68, 45, 25, 0.72)');
            haloGrad.addColorStop(0.45, 'rgba(102, 70, 42, 0.45)');
            haloGrad.addColorStop(0.8, `rgba(${clampByte(baseR - 20)}, ${clampByte(baseG - 22)}, ${clampByte(baseB - 18)}, 0.22)`);
            haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            cCtx.fillStyle = haloGrad;
            cCtx.beginPath();
            cCtx.ellipse(0, 0, knot.rx * 1.45, knot.ry * 1.5, 0, 0, Math.PI * 2);
            cCtx.fill();

            // Dark filled knot core
            cCtx.fillStyle = '#422b19';
            cCtx.beginPath();
            cCtx.ellipse(0, 0, knot.rx * 0.62, knot.ry * 0.65, 0, 0, Math.PI * 2);
            cCtx.fill();

            cCtx.fillStyle = '#2d1c0f';
            cCtx.beginPath();
            cCtx.ellipse(0, 0, knot.rx * 0.34, knot.ry * 0.36, 0, 0, Math.PI * 2);
            cCtx.fill();
            cCtx.restore();

            // Subtle knot bump relief
            bCtx.save();
            bCtx.translate(knot.kx, knot.ky);
            bCtx.rotate(knot.angle);
            bCtx.fillStyle = '#686868';
            bCtx.beginPath();
            bCtx.ellipse(0, 0, knot.rx * 0.6, knot.ry * 0.62, 0, 0, Math.PI * 2);
            bCtx.fill();
            bCtx.restore();
          }

          // 5. Balanced bevelled header end-joint V-groove at xStart (if > 0)
          if (xStart > 0) {
            cCtx.fillStyle = 'rgba(92, 62, 36, 0.36)';
            cCtx.fillRect(xStart - 1.1, y0, 2.2, rowH);
            cCtx.fillStyle = 'rgba(66, 43, 24, 0.82)';
            cCtx.fillRect(xStart - 0.7, y0, 1.4, rowH);
            cCtx.fillStyle = 'rgba(222, 188, 148, 0.28)';
            cCtx.fillRect(xStart + 0.8, y0, 1.1, rowH);

            bCtx.fillStyle = '#484848';
            bCtx.fillRect(xStart - 0.8, y0, 1.6, rowH);
          }
        }

        // 6. Balanced bevelled long-edge V-groove between wide 220mm planks
        cCtx.fillStyle = 'rgba(92, 62, 36, 0.4)';
        cCtx.fillRect(0, y0, size, 2.6);
        cCtx.fillStyle = 'rgba(64, 42, 23, 0.86)';
        cCtx.fillRect(0, y0, size, 1.75);
        cCtx.fillStyle = 'rgba(224, 190, 150, 0.3)';
        cCtx.fillRect(0, y0 + 2.0, size, 1.3);

        bCtx.fillStyle = '#404040';
        bCtx.fillRect(0, y0, size, 1.9);
      }
      }
    );

    const colorMap = new THREE.CanvasTexture(colorCanvas);
    colorMap.wrapS = THREE.RepeatWrapping;
    colorMap.wrapT = THREE.RepeatWrapping;
    colorMap.colorSpace = THREE.SRGBColorSpace;
    colorMap.anisotropy = 8;

    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.RepeatWrapping;
    bumpMap.anisotropy = 8;

    return { colorMap, bumpMap };
  });
}
