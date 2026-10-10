import * as THREE from 'three';
import { derivePbrNormalAndRoughnessMaps } from '../../../../../engine/textures/pbr-surface-maps.ts';
import { getOrCreateCachedTexture } from '../../../../../engine/textures/texture-registry.ts';

/**
 * High-resolution (`1024x1024`) Riven Weathered Yorkstone & Buff Flagstone Paving Texture
 * + Relief Bump Map (`Issue #11` & `Issue #12`) with random-ashlar rectangular stone courses,
 * natural lichen/moss joints, warm buff/grey/honey stone variations, and riven sedimentary ripples.
 */
export function createRivenYorkstonePatioTextures(): {
  readonly colorMap: THREE.CanvasTexture;
  readonly bumpMap: THREE.CanvasTexture;
  readonly normalMap: THREE.CanvasTexture;
  readonly roughnessMap: THREE.CanvasTexture;
} {
  const { colorMap, bumpMap } = getOrCreateCachedTexture(
    'riven-yorkstone-patio:1024:1x1',
    () => {
      const size = 1024;
      const colorCanvas = document.createElement('canvas');
      colorCanvas.width = size;
      colorCanvas.height = size;
      const cCtx = colorCanvas.getContext('2d')!;

      const bumpCanvas = document.createElement('canvas');
      bumpCanvas.width = size;
      bumpCanvas.height = size;
      const bCtx = bumpCanvas.getContext('2d')!;

      cCtx.fillStyle = '#5e584c';
      cCtx.fillRect(0, 0, size, size);
      bCtx.fillStyle = '#141414';
      bCtx.fillRect(0, 0, size, size);

      const hash = (n: number): number => {
        const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
        return x - Math.floor(x);
      };

      const yorkstonePalette: ReadonlyArray<readonly [number, number, number]> = [
        [176, 162, 138],
        [162, 154, 140],
        [186, 168, 138],
        [152, 146, 135],
        [170, 155, 129],
        [158, 152, 134],
        [181, 164, 142],
        [146, 138, 126],
      ];

      const courseHeights = [176, 152, 192, 164, 184, 156];
      let curY = 0;
      const jointPx = 7;

      for (let row = 0; row < courseHeights.length; row++) {
        const ch = courseHeights[row]!;
        const slabWidths =
          row % 3 === 0
            ? [268, 212, 304, 240]
            : row % 3 === 1
              ? [196, 284, 224, 320]
              : [312, 208, 260, 244];

        let curX = 0;
        for (let col = 0; col < slabWidths.length; col++) {
          const sw = slabWidths[col]!;
          const seed = row * 97 + col * 31 + 13;
          const pal = yorkstonePalette[Math.floor(hash(seed) * yorkstonePalette.length)]!;
          const delta = Math.round((hash(seed + 1) - 0.5) * 18);
          const warm = Math.round((hash(seed + 2) - 0.5) * 10);
          const rBase = Math.max(95, Math.min(215, pal[0] + delta + warm));
          const gBase = Math.max(90, Math.min(208, pal[1] + delta));
          const bBase = Math.max(80, Math.min(195, pal[2] + delta - warm));

          const sx = curX + jointPx * 0.5;
          const sy = curY + jointPx * 0.5;
          const w = sw - jointPx;
          const h = ch - jointPx;

          const grad = cCtx.createLinearGradient(sx, sy, sx + w, sy + h);
          grad.addColorStop(0, `rgb(${rBase + 8}, ${gBase + 7}, ${bBase + 5})`);
          grad.addColorStop(0.55, `rgb(${rBase}, ${gBase}, ${bBase})`);
          grad.addColorStop(1, `rgb(${rBase - 10}, ${gBase - 9}, ${bBase - 8})`);
          cCtx.fillStyle = grad;
          cCtx.fillRect(sx, sy, w, h);

          cCtx.strokeStyle = `rgba(${Math.min(235, rBase + 22)}, ${Math.min(228, gBase + 20)}, ${Math.min(210, bBase + 16)}, 0.48)`;
          cCtx.lineWidth = 2.5;
          cCtx.strokeRect(sx + 1.5, sy + 1.5, w - 3, h - 3);

          const slabBump = Math.round(165 + (hash(seed + 3) - 0.5) * 44);
          bCtx.fillStyle = `rgb(${slabBump}, ${slabBump}, ${slabBump})`;
          bCtx.fillRect(sx, sy, w, h);

          for (let py = sy + 3; py < sy + h - 3; py += 4) {
            const relY = (py - sy) / h;
            for (let px = sx + 3; px < sx + w - 3; px += 4) {
              const relX = (px - sx) / w;
              const ripple =
                Math.sin(relX * Math.PI * 5 + relY * 8 + seed) * 6 +
                Math.cos(relY * Math.PI * 6 - relX * 4 + seed * 0.7) * 5;
              const grain = (hash(px * 13 + py * 29 + seed) - 0.5) * 11;
              const edgeDist = Math.min(relX, 1 - relX, relY, 1 - relY);
              const lichen = edgeDist < 0.09 && hash(px * 7 + py * 19 + seed) > 0.65 ? -14 : 0;

              const pr = Math.max(85, Math.min(228, Math.round(rBase + ripple + grain + lichen)));
              const pg = Math.max(82, Math.min(222, Math.round(gBase + ripple + grain + (lichen ? -4 : 0))));
              const pb = Math.max(72, Math.min(208, Math.round(bBase + ripple + grain + (lichen ? -18 : 0))));
              cCtx.fillStyle = `rgb(${pr}, ${pg}, ${pb})`;
              cCtx.fillRect(px, py, 4, 4);

              const bv = Math.max(
                95,
                Math.min(248, Math.round(slabBump + ripple * 1.9 + grain * 0.9 - (edgeDist < 0.04 ? 28 : 0)))
              );
              bCtx.fillStyle = `rgb(${bv}, ${bv}, ${bv})`;
              bCtx.fillRect(px, py, 4, 4);
            }
          }

          curX += sw;
        }
        curY += ch;
      }

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
    }
  );

  const { normalMap, roughnessMap } = derivePbrNormalAndRoughnessMaps(
    'riven-yorkstone-patio:pbr:1024:1x1',
    bumpMap.image as HTMLCanvasElement,
    {
      normalStrength: 3.4,
      mortarThreshold: 0.25,
      mortarRoughness: 0.98,
      surfaceRoughnessMin: 0.64,
      surfaceRoughnessMax: 0.88,
      microGrainRoughness: 0.05,
    }
  );

  return { colorMap, bumpMap, normalMap, roughnessMap };
}

/**
 * High-resolution (`512x512`) 45-degree Herringbone Reclaimed Red-Brick Paving Texture
 * + Relief Bump Map (`Issue #12`: "Herr" at `[-2.819, 0.09, 7.666]`, `courtyard.rattanPatioSlab`).
 */
export function createHerringboneBrickPatioTextures(): {
  readonly colorMap: THREE.CanvasTexture;
  readonly bumpMap: THREE.CanvasTexture;
  readonly normalMap: THREE.CanvasTexture;
  readonly roughnessMap: THREE.CanvasTexture;
} {
  const { colorMap, bumpMap } = getOrCreateCachedTexture(
    'herringbone-brick-patio:512:1x1',
    () => {
      const size = 512;
      const colorCanvas = document.createElement('canvas');
      colorCanvas.width = size;
      colorCanvas.height = size;
      const cCtx = colorCanvas.getContext('2d')!;

      const bumpCanvas = document.createElement('canvas');
      bumpCanvas.width = size;
      bumpCanvas.height = size;
      const bCtx = bumpCanvas.getContext('2d')!;

      cCtx.fillStyle = '#b9ab93';
      cCtx.fillRect(0, 0, size, size);
      bCtx.fillStyle = '#181818';
      bCtx.fillRect(0, 0, size, size);

      const brickPalette: ReadonlyArray<readonly [number, number, number]> = [
        [164, 82, 62],
        [148, 72, 54],
        [176, 94, 68],
        [132, 66, 54],
        [156, 86, 66],
      ];

      const step = 32;
      const brickL = step * 2 - 4;
      const brickW = step - 4;

      for (let gy = -4; gy < 20; gy++) {
        for (let gx = -4; gx < 20; gx++) {
          const seed = ((gx * 73 + gy * 139) & 0xffff);
          const pal = brickPalette[seed % brickPalette.length]!;
          const shift = ((seed >> 3) % 17) - 8;
          const r = Math.max(85, Math.min(205, pal[0] + shift));
          const g = Math.max(45, Math.min(135, pal[1] + Math.round(shift * 0.6)));
          const b = Math.max(38, Math.min(115, pal[2] + Math.round(shift * 0.5)));
          const isHoriz = ((gx + gy) & 1) === 0;

          const cx = gx * step;
          const cy = gy * step;

          cCtx.save();
          cCtx.translate(cx, cy);
          cCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          if (isHoriz) {
            cCtx.fillRect(2, 2, brickL, brickW);
            cCtx.strokeStyle = `rgba(${Math.min(220, r + 24)}, ${Math.min(155, g + 18)}, ${Math.min(130, b + 14)}, 0.45)`;
            cCtx.strokeRect(3, 3, brickL - 2, brickW - 2);
          } else {
            cCtx.fillRect(2, 2, brickW, brickL);
            cCtx.strokeStyle = `rgba(${Math.min(220, r + 24)}, ${Math.min(155, g + 18)}, ${Math.min(130, b + 14)}, 0.45)`;
            cCtx.strokeRect(3, 3, brickW - 2, brickL - 2);
          }
          cCtx.restore();

          const bv = 185 + ((seed >> 5) % 45);
          bCtx.save();
          bCtx.translate(cx, cy);
          bCtx.fillStyle = `rgb(${bv}, ${bv}, ${bv})`;
          if (isHoriz) {
            bCtx.fillRect(2, 2, brickL, brickW);
          } else {
            bCtx.fillRect(2, 2, brickW, brickL);
          }
          bCtx.restore();
        }
      }

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
    }
  );

  const { normalMap, roughnessMap } = derivePbrNormalAndRoughnessMaps(
    'herringbone-brick-patio:pbr:512:1x1',
    bumpMap.image as HTMLCanvasElement,
    {
      normalStrength: 3.4,
      mortarThreshold: 0.25,
      mortarRoughness: 0.98,
      surfaceRoughnessMin: 0.68,
      surfaceRoughnessMax: 0.9,
      microGrainRoughness: 0.05,
    }
  );

  return { colorMap, bumpMap, normalMap, roughnessMap };
}

/**
 * High-resolution (`1024x512`) English Cotswold / Chilterns Unmortared Dry Stone Wall Texture
 * + Deep Crevice Bump Map (`Issue #13`, `Issue #14`, `Issue #16`) with stacked flat irregular
 * warm honey-buff ironstone, grey-brown ragstone, and weathered limestone slabs with deep shadow crevices.
 */
export function createDryStoneWallTextures(): {
  readonly colorMap: THREE.CanvasTexture;
  readonly bumpMap: THREE.CanvasTexture;
  readonly normalMap: THREE.CanvasTexture;
  readonly roughnessMap: THREE.CanvasTexture;
} {
  const { colorMap, bumpMap } = getOrCreateCachedTexture(
    'dry-stone-wall:1024x512:1x1',
    () => {
      const width = 1024;
      const height = 512;
      const colorCanvas = document.createElement('canvas');
      colorCanvas.width = width;
      colorCanvas.height = height;
      const cCtx = colorCanvas.getContext('2d')!;

      const bumpCanvas = document.createElement('canvas');
      bumpCanvas.width = width;
      bumpCanvas.height = height;
      const bCtx = bumpCanvas.getContext('2d')!;

      cCtx.fillStyle = '#231d17';
      cCtx.fillRect(0, 0, width, height);
      bCtx.fillStyle = '#0a0a0a';
      bCtx.fillRect(0, 0, width, height);

      const hash = (n: number): number => {
        const x = Math.sin(n * 91.7 + 197.3) * 43758.5453;
        return x - Math.floor(x);
      };

      const dryStonePalette: ReadonlyArray<readonly [number, number, number]> = [
        [186, 158, 120],
        [168, 146, 118],
        [152, 138, 122],
        [194, 168, 132],
        [138, 126, 112],
        [175, 152, 122],
        [146, 136, 116],
        [162, 134, 104],
      ];

      const courseHeights = [52, 42, 48, 38, 54, 44, 46, 40, 50, 46, 52];
      let curY = 0;

      for (let row = 0; row < courseHeights.length; row++) {
        const ch = courseHeights[row]!;
        const staggerPx = Math.round(hash(row * 37 + 5) * 90);
        let curX = -staggerPx;
        let col = 0;

        while (curX < width) {
          const seed = row * 173 + col * 29 + 19;
          const rem = width - curX;
          const targetW = Math.round(88 + hash(seed) * 118);
          const sw = rem < 150 ? rem : targetW;

          const pal = dryStonePalette[Math.floor(hash(seed + 1) * dryStonePalette.length)]!;
          const shift = Math.round((hash(seed + 2) - 0.5) * 24);
          const warm = Math.round((hash(seed + 3) - 0.5) * 14);
          const rBase = Math.max(82, Math.min(220, pal[0] + shift + warm));
          const gBase = Math.max(76, Math.min(205, pal[1] + shift));
          const bBase = Math.max(64, Math.min(182, pal[2] + shift - warm));

          const padX = 3.5;
          const padY = 3.0;
          const sx = curX + padX;
          const sy = curY + padY;
          const w = Math.max(12, sw - padX * 2);
          const h = Math.max(10, ch - padY * 2);

          const traceDryStonePoly = (ctx: CanvasRenderingContext2D, inset = 0): void => {
            const x0 = sx + inset;
            const y0 = sy + inset;
            const x1 = sx + w - inset;
            const y1 = sy + h - inset;
            const j = (k: number): number => (hash(seed + k * 13) - 0.5) * 3.6;
            const chf = Math.min(7, h * 0.22);

            ctx.beginPath();
            ctx.moveTo(x0 + chf + j(1), y0 + j(2));
            ctx.lineTo(x0 + w * 0.5 + j(3), y0 + j(4) * 0.7);
            ctx.lineTo(x1 - chf + j(5), y0 + j(6));
            ctx.lineTo(x1 + j(7), y0 + chf + j(8));
            ctx.lineTo(x1 + j(9), y1 - chf + j(10));
            ctx.lineTo(x1 - chf + j(11), y1 + j(12));
            ctx.lineTo(x0 + w * 0.5 + j(13), y1 + j(14) * 0.7);
            ctx.lineTo(x0 + chf + j(15), y1 + j(16));
            ctx.lineTo(x0 + j(17), y1 - chf + j(18));
            ctx.lineTo(x0 + j(19), y0 + chf + j(20));
            ctx.closePath();
          };

          const grad = cCtx.createLinearGradient(sx, sy, sx, sy + h);
          grad.addColorStop(0, `rgb(${Math.min(235, rBase + 22)}, ${Math.min(220, gBase + 19)}, ${Math.min(198, bBase + 15)})`);
          grad.addColorStop(0.28, `rgb(${rBase + 6}, ${gBase + 5}, ${bBase + 3})`);
          grad.addColorStop(0.78, `rgb(${rBase - 6}, ${gBase - 6}, ${bBase - 5})`);
          grad.addColorStop(1, `rgb(${Math.max(48, rBase - 34)}, ${Math.max(42, gBase - 30)}, ${Math.max(35, bBase - 26)})`);

          cCtx.save();
          traceDryStonePoly(cCtx, 0);
          cCtx.fillStyle = grad;
          cCtx.fill();
          cCtx.clip();

          for (let sLine = 0; sLine < 3; sLine++) {
            const ly = sy + (0.25 + sLine * 0.24 + (hash(seed + 30 + sLine) - 0.5) * 0.1) * h;
            cCtx.strokeStyle =
              sLine % 2 === 0
                ? `rgba(42, 34, 26, 0.28)`
                : `rgba(${Math.min(242, rBase + 28)}, ${Math.min(228, gBase + 24)}, ${Math.min(205, bBase + 18)}, 0.25)`;
            cCtx.lineWidth = 1.4;
            cCtx.beginPath();
            cCtx.moveTo(sx, ly);
            cCtx.lineTo(sx + w * 0.5, ly + (hash(seed + 40 + sLine) - 0.5) * 3);
            cCtx.lineTo(sx + w, ly + (hash(seed + 50 + sLine) - 0.5) * 3);
            cCtx.stroke();
          }

          const speckCount = Math.floor((w * h) / 70);
          for (let sp = 0; sp < speckCount; sp++) {
            const px = sx + hash(seed + sp * 7 + 100) * w;
            const py = sy + hash(seed + sp * 11 + 200) * h;
            const isDark = sp % 2 === 0;
            cCtx.fillStyle = isDark
              ? `rgba(48, 39, 30, 0.22)`
              : `rgba(${Math.min(245, rBase + 32)}, ${Math.min(232, gBase + 28)}, ${Math.min(210, bBase + 22)}, 0.24)`;
            cCtx.fillRect(px, py, 2.5, 2.0);
          }
          cCtx.restore();

          const baseBump = Math.round(145 + hash(seed + 9) * 85);
          bCtx.save();
          traceDryStonePoly(bCtx, 0);
          bCtx.fillStyle = `rgb(${Math.max(55, baseBump - 65)}, ${Math.max(55, baseBump - 65)}, ${Math.max(55, baseBump - 65)})`;
          bCtx.fill();

          traceDryStonePoly(bCtx, 2.5);
          bCtx.fillStyle = `rgb(${baseBump}, ${baseBump}, ${baseBump})`;
          bCtx.fill();

          traceDryStonePoly(bCtx, 5.0);
          const crownBump = Math.min(252, baseBump + 24);
          bCtx.fillStyle = `rgb(${crownBump}, ${crownBump}, ${crownBump})`;
          bCtx.fill();
          bCtx.restore();

          if (curX < 0) {
            cCtx.save();
            cCtx.translate(width, 0);
            traceDryStonePoly(cCtx, 0);
            cCtx.fillStyle = grad;
            cCtx.fill();
            cCtx.restore();

            bCtx.save();
            bCtx.translate(width, 0);
            traceDryStonePoly(bCtx, 0);
            bCtx.fillStyle = `rgb(${baseBump}, ${baseBump}, ${baseBump})`;
            bCtx.fill();
            bCtx.restore();
          }

          curX += sw;
          col++;
        }
        curY += ch;
      }

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
    }
  );

  const { normalMap, roughnessMap } = derivePbrNormalAndRoughnessMaps(
    'dry-stone-wall:pbr:1024x512:1x1',
    bumpMap.image as HTMLCanvasElement,
    {
      normalStrength: 4.2,
      mortarThreshold: 0.28,
      mortarRoughness: 0.99,
      surfaceRoughnessMin: 0.7,
      surfaceRoughnessMax: 0.92,
      microGrainRoughness: 0.06,
    }
  );

  return { colorMap, bumpMap, normalMap, roughnessMap };
}

/**
 * High-resolution (`512x512`) Botanical Shrub Foliage Leaf Texture + Relief Bump Map (`Issue #11`)
 * with overlapping serrated botanical leaves, sunlit leaf veins, and deep under-canopy shadows.
 */
export function createBotanicalShrubFoliageTextures(): {
  readonly colorMap: THREE.CanvasTexture;
  readonly bumpMap: THREE.CanvasTexture;
} {
  return getOrCreateCachedTexture('botanical-shrub-foliage:512:1x1', () => {
    const size = 512;
    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = size;
    colorCanvas.height = size;
    const cCtx = colorCanvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = size;
    bumpCanvas.height = size;
    const bCtx = bumpCanvas.getContext('2d')!;

    cCtx.fillStyle = '#6d7868';
    cCtx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#181818';
    bCtx.fillRect(0, 0, size, size);

    const hash = (n: number): number => {
      const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };

    for (let i = 0; i < 680; i++) {
      const cx = hash(i * 13 + 1) * size;
      const cy = hash(i * 17 + 2) * size;
      const angle = hash(i * 23 + 3) * Math.PI * 2;
      const leafL = 14 + hash(i * 29 + 4) * 18;
      const leafW = 7 + hash(i * 31 + 5) * 9;
      const layerT = i / 680;
      const lum = Math.round(135 + layerT * 108 + (hash(i * 37 + 6) - 0.5) * 24);
      const r = Math.max(85, Math.min(252, lum - 6));
      const g = Math.max(95, Math.min(255, lum + 8));
      const b = Math.max(78, Math.min(242, lum - 12));
      const bumpVal = Math.max(35, Math.min(250, Math.round(60 + layerT * 185)));

      for (const [ox, oy] of [
        [0, 0],
        [cx < 28 ? size : cx > size - 28 ? -size : 0, cy < 28 ? size : cy > size - 28 ? -size : 0],
      ] as const) {
        cCtx.save();
        cCtx.translate(cx + ox, cy + oy);
        cCtx.rotate(angle);
        cCtx.beginPath();
        cCtx.moveTo(-leafL * 0.5, 0);
        cCtx.quadraticCurveTo(0, -leafW * 0.65, leafL * 0.5, 0);
        cCtx.quadraticCurveTo(0, leafW * 0.65, -leafL * 0.5, 0);
        cCtx.closePath();
        cCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        cCtx.fill();
        cCtx.strokeStyle = `rgba(38, 48, 34, 0.35)`;
        cCtx.lineWidth = 1.0;
        cCtx.stroke();

        cCtx.strokeStyle = `rgba(${Math.min(255, r + 28)}, ${Math.min(255, g + 28)}, ${Math.min(255, b + 20)}, 0.48)`;
        cCtx.lineWidth = 0.9;
        cCtx.beginPath();
        cCtx.moveTo(-leafL * 0.42, 0);
        cCtx.lineTo(leafL * 0.42, 0);
        cCtx.stroke();
        cCtx.restore();

        bCtx.save();
        bCtx.translate(cx + ox, cy + oy);
        bCtx.rotate(angle);
        bCtx.beginPath();
        bCtx.moveTo(-leafL * 0.5, 0);
        bCtx.quadraticCurveTo(0, -leafW * 0.65, leafL * 0.5, 0);
        bCtx.quadraticCurveTo(0, leafW * 0.65, -leafL * 0.5, 0);
        bCtx.closePath();
        bCtx.fillStyle = `rgb(${bumpVal}, ${bumpVal}, ${bumpVal})`;
        bCtx.fill();
        bCtx.restore();

        if (ox === 0 && oy === 0 && !(cx < 28 || cx > size - 28 || cy < 28 || cy > size - 28)) {
          break;
        }
      }
    }

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

/**
 * Creates a displaced multi-tuft botanical foliage lobe geometry (`IcosahedronGeometry` detail 2
 * with radial leaf-cluster displacement & spherical UV mapping — NEVER a bare `SphereGeometry(1)`!).
 */
export function createBotanicalFoliageLobeGeometry(seed: number): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(1, 2);
  const pos = geo.attributes.position;
  if (!pos) return geo;

  const uvs: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const vz = pos.getZ(i);
    const len = Math.hypot(vx, vy, vz) || 1;
    const nx = vx / len;
    const ny = vy / len;
    const nz = vz / len;

    const tuft1 = Math.sin(nx * 5.2 + ny * 4.1 + seed * 1.7) * Math.cos(nz * 5.4 - ny * 3.3 + seed);
    const tuft2 = Math.sin(nz * 8.5 - nx * 7.2 + seed * 2.3) * 0.5;
    const crownLift = ny > 0 ? 1.0 + ny * 0.08 : 1.0 + ny * 0.14;
    const disp = (0.88 + tuft1 * 0.14 + tuft2 * 0.08) * crownLift;

    pos.setXYZ(i, nx * disp, ny * disp, nz * disp);

    const u = 0.5 + Math.atan2(nz, nx) / (Math.PI * 2);
    const v = 0.5 + Math.asin(Math.max(-1, Math.min(1, ny))) / Math.PI;
    uvs.push(u * 2.2, v * 2.2);
  }
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates a 3D radiating botanical leaf-frond spray geometry (10 angled diamond/ovate leaf blades)
 * to layer around sculpted shrubs and pots so silhouettes have crisp individual leaf geometry.
 */
export function createBotanicalLeafSprayGeometry(): THREE.BufferGeometry {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const vTmp = new THREE.Vector3();

  for (let b = 0; b < 10; b++) {
    const yaw = (b / 10) * Math.PI * 2 + (b % 2) * 0.22;
    const pitch = 0.25 + (b % 3) * 0.22;
    const roll = ((b % 2) - 0.5) * 0.28;
    const scale = 0.85 + (b % 3) * 0.16;
    const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch, yaw, roll, 'YXZ'));
    const baseV = positions.length / 3;

    const bladePts: ReadonlyArray<readonly [number, number, number, number, number]> = [
      [0.0, 0.0, 0.0, 0.5, 0.0],
      [-0.048, 0.012, 0.075, 0.0, 0.45],
      [0.048, 0.012, 0.075, 1.0, 0.45],
      [-0.036, -0.008, 0.145, 0.15, 0.82],
      [0.036, -0.008, 0.145, 0.85, 0.82],
      [0.0, -0.022, 0.195, 0.5, 1.0],
    ];

    for (const [lx, ly, lz, u, v] of bladePts) {
      vTmp.set(lx * scale, ly * scale, lz * scale).applyQuaternion(quat);
      positions.push(vTmp.x, vTmp.y, vTmp.z);
      uvs.push(u, v);
    }

    indices.push(
      baseV + 0, baseV + 1, baseV + 2,
      baseV + 1, baseV + 3, baseV + 2,
      baseV + 2, baseV + 3, baseV + 4,
      baseV + 3, baseV + 5, baseV + 4
    );
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export interface BotanicalShrubKit {
  readonly botanicalFoliageTextures: {
    readonly colorMap: THREE.CanvasTexture;
    readonly bumpMap: THREE.CanvasTexture;
  };
  readonly soilMat: THREE.MeshStandardMaterial;
  readonly woodyStemMat: THREE.MeshStandardMaterial;
  readonly sageFoliageMat: THREE.MeshStandardMaterial;
  readonly deepGreenFoliageMat: THREE.MeshStandardMaterial;
  readonly goldenChoisyaMat: THREE.MeshStandardMaterial;
  readonly brightShrubGreenMat: THREE.MeshStandardMaterial;
  readonly whiteBloomMat: THREE.MeshStandardMaterial;
  readonly blushBloomMat: THREE.MeshStandardMaterial;
  readonly lavenderBloomMat: THREE.MeshStandardMaterial;
  readonly geraniumRedBloomMat: THREE.MeshStandardMaterial;
  readonly botanicalLobeGeos: ReadonlyArray<THREE.BufferGeometry>;
  readonly addSculptedBotanicalShrub: (
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    rx: number,
    ry: number,
    rz: number,
    foliageMat: THREE.Material,
    flowerMat?: THREE.Material,
    secondaryFoliageMat?: THREE.Material
  ) => THREE.Group;
}

export function createBotanicalShrubKit(): BotanicalShrubKit {
  // =========================================================================
  // 2. HIGH-LOD BOTANICAL FOLIAGE TEXTURES, SCULPTED SHRUB HELPER & POT MATERIALS (Issue #11)
  // =========================================================================
  const botanicalFoliageTextures = createBotanicalShrubFoliageTextures();
  const soilMat = new THREE.MeshStandardMaterial({
    color: 0x3b2b1e,
    roughness: 0.96,
  });
  const woodyStemMat = new THREE.MeshStandardMaterial({
    color: 0x5c4632,
    roughness: 0.88,
    metalness: 0.02,
  });
  const sageFoliageMat = new THREE.MeshStandardMaterial({
    color: 0x68865c,
    map: botanicalFoliageTextures.colorMap,
    bumpMap: botanicalFoliageTextures.bumpMap,
    bumpScale: 0.028,
    roughness: 0.8,
    side: THREE.DoubleSide,
  });
  const deepGreenFoliageMat = new THREE.MeshStandardMaterial({
    color: 0x385e32,
    map: botanicalFoliageTextures.colorMap,
    bumpMap: botanicalFoliageTextures.bumpMap,
    bumpScale: 0.03,
    roughness: 0.76,
    side: THREE.DoubleSide,
  });
  const goldenChoisyaMat = new THREE.MeshStandardMaterial({
    color: 0xd4c438,
    map: botanicalFoliageTextures.colorMap,
    bumpMap: botanicalFoliageTextures.bumpMap,
    bumpScale: 0.026,
    roughness: 0.7,
    side: THREE.DoubleSide,
  });
  const brightShrubGreenMat = new THREE.MeshStandardMaterial({
    color: 0x52823f,
    map: botanicalFoliageTextures.colorMap,
    bumpMap: botanicalFoliageTextures.bumpMap,
    bumpScale: 0.028,
    roughness: 0.74,
    side: THREE.DoubleSide,
  });
  const whiteBloomMat = new THREE.MeshStandardMaterial({
    color: 0xf4efe4,
    roughness: 0.72,
  });
  const blushBloomMat = new THREE.MeshStandardMaterial({
    color: 0xd99ca5,
    roughness: 0.76,
  });
  const lavenderBloomMat = new THREE.MeshStandardMaterial({
    color: 0x7b58a6,
    roughness: 0.74,
  });
  const geraniumRedBloomMat = new THREE.MeshStandardMaterial({
    color: 0xc8372d,
    roughness: 0.72,
  });

  const botanicalLobeGeos: ReadonlyArray<THREE.BufferGeometry> = [
    createBotanicalFoliageLobeGeometry(1.1),
    createBotanicalFoliageLobeGeometry(2.7),
    createBotanicalFoliageLobeGeometry(4.3),
    createBotanicalFoliageLobeGeometry(6.9),
  ];
  const botanicalLeafSprayGeo = createBotanicalLeafSprayGeometry();
  const woodyBranchGeo = new THREE.CylinderGeometry(0.014, 0.026, 1.0, 7);
  const flowerPanicleConeGeo = new THREE.ConeGeometry(0.042, 0.11, 7);
  const flowerFloretsGeo = new THREE.DodecahedronGeometry(0.036, 0);

  const addSculptedBotanicalShrub = (
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    rx: number,
    ry: number,
    rz: number,
    foliageMat: THREE.Material,
    flowerMat?: THREE.Material,
    secondaryFoliageMat?: THREE.Material
  ): THREE.Group => {
    const shrubGroup = new THREE.Group();
    shrubGroup.name = 'courtyard.patioBorderPlant';
    shrubGroup.position.set(x, y, z);

    const altMat = secondaryFoliageMat ?? foliageMat;
    const stemH = Math.max(0.18, ry * 0.95);

    const stemOffsets: ReadonlyArray<readonly [number, number, number, number]> = [
      [-rx * 0.16, -rz * 0.12, 0.22, -0.18],
      [rx * 0.18, -rz * 0.1, -0.24, -0.16],
      [-rx * 0.12, rz * 0.16, 0.18, 0.22],
      [rx * 0.15, rz * 0.14, -0.2, 0.2],
      [0.0, 0.0, 0.05, -0.06],
    ];
    for (const [sx, sz, rotZ, rotX] of stemOffsets) {
      const stem = new THREE.Mesh(woodyBranchGeo, woodyStemMat);
      if (!stem.name) stem.name = 'courtyard.patioBorderPlant.stem';
      stem.scale.set(1.0, stemH, 1.0);
      stem.position.set(sx, -ry * 0.35, sz);
      stem.rotation.set(rotX, 0, rotZ);
      stem.castShadow = true;
      shrubGroup.add(stem);
    }

    const lobeLayout: ReadonlyArray<readonly [number, number, number, number, number, number]> = [
      [0.0, 0.06, 0.0, 0.62, 0.64, 0.62],
      [-0.38, -0.04, 0.24, 0.48, 0.46, 0.48],
      [0.4, -0.02, 0.22, 0.46, 0.48, 0.46],
      [-0.36, -0.03, -0.26, 0.47, 0.45, 0.47],
      [0.38, -0.04, -0.25, 0.48, 0.44, 0.48],
      [0.0, 0.26, 0.04, 0.5, 0.44, 0.5],
      [-0.48, -0.14, -0.02, 0.42, 0.38, 0.44],
      [0.48, -0.12, 0.02, 0.44, 0.38, 0.42],
      [0.02, -0.06, 0.44, 0.45, 0.4, 0.42],
    ];
    for (let i = 0; i < lobeLayout.length; i++) {
      const [lx, ly, lz, sx, sy, sz] = lobeLayout[i]!;
      const lobeGeo = botanicalLobeGeos[i % botanicalLobeGeos.length]!;
      const lobe = new THREE.Mesh(lobeGeo, i % 2 === 0 ? foliageMat : altMat);
      if (!lobe.name) lobe.name = 'courtyard.patioBorderPlant.lobe';
      lobe.position.set(lx * rx, ly * ry, lz * rz);
      lobe.scale.set(sx * rx, sy * ry, sz * rz);
      lobe.rotation.set(i * 0.7, i * 1.3, i * 0.5);
      lobe.castShadow = true;
      lobe.receiveShadow = true;
      shrubGroup.add(lobe);
    }

    const sprayRingCount = 8;
    const avgR = (rx + rz) * 0.5;
    for (let s = 0; s < sprayRingCount; s++) {
      const ang = (s / sprayRingCount) * Math.PI * 2 + 0.3;
      const ringFactor = s % 2 === 0 ? 0.68 : 0.52;
      const liftY = (s % 2 === 0 ? -0.04 : 0.24) * ry;
      const spray = new THREE.Mesh(
        botanicalLeafSprayGeo,
        s % 2 === 0 ? foliageMat : altMat
      );
      if (!spray.name) spray.name = 'courtyard.patioBorderPlant.spray';
      spray.position.set(
        Math.cos(ang) * rx * ringFactor,
        liftY,
        Math.sin(ang) * rz * ringFactor
      );
      spray.rotation.set(0.32 + (s % 3) * 0.14, -ang + Math.PI * 0.5, ((s % 2) - 0.5) * 0.25);
      const sprayScale = Math.max(0.55, avgR * 1.45);
      spray.scale.set(sprayScale, sprayScale, sprayScale);
      spray.castShadow = true;
      shrubGroup.add(spray);
    }

    if (flowerMat) {
      const panicleCount = 14;
      for (let f = 0; f < panicleCount; f++) {
        const ringT = f < 9 ? f / 9 : (f - 9) / 5;
        const ang = ringT * Math.PI * 2 + f * 0.45;
        const rad = f < 9 ? 0.66 : 0.32;
        const fx = Math.cos(ang) * rx * rad;
        const fz = Math.sin(ang) * rz * rad;
        const fy = (f < 9 ? 0.22 + (f % 3) * 0.09 : 0.48 + (f % 2) * 0.08) * ry;

        const panicle = new THREE.Mesh(
          f % 2 === 0 ? flowerPanicleConeGeo : flowerFloretsGeo,
          flowerMat
        );
        if (!panicle.name) panicle.name = 'courtyard.patioBorderPlant.panicle';
        const fScale = Math.max(0.7, avgR * 1.55);
        panicle.scale.set(fScale, fScale * 1.15, fScale);
        panicle.position.set(fx, fy, fz);
        panicle.rotation.set(Math.sin(ang) * 0.35, ang, -Math.cos(ang) * 0.35);
        panicle.castShadow = true;
        shrubGroup.add(panicle);
      }
    }

    parent.add(shrubGroup);
    return shrubGroup;
  };

  return {
    botanicalFoliageTextures,
    soilMat,
    woodyStemMat,
    sageFoliageMat,
    deepGreenFoliageMat,
    goldenChoisyaMat,
    brightShrubGreenMat,
    whiteBloomMat,
    blushBloomMat,
    lavenderBloomMat,
    geraniumRedBloomMat,
    botanicalLobeGeos,
    addSculptedBotanicalShrub,
  };
}
