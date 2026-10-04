import * as THREE from 'three';
import {
  createImperialBrickTextures,
} from '../../../../engine/textures/procedural-textures.ts';

export interface PatioAndGrapeVinePergolaKit {
  readonly limestoneEdgingMat: THREE.Material;
  readonly structuralOakMat: THREE.Material;
  readonly glassMat: THREE.Material;
  readonly buildLionHeadTrophyUrn: (
    scene: THREE.Scene,
    x: number,
    z: number,
    foliageMat: THREE.Material,
    whiteBloomMat: THREE.Material,
    blushBloomMat: THREE.Material
  ) => void;
  readonly buildOldGrindstone: (
    scene: THREE.Scene,
    x: number,
    z: number,
    oakMat: THREE.Material
  ) => void;
}

/**
 * High-resolution (`1024x1024`) Riven Weathered Yorkstone & Buff Flagstone Paving Texture
 * + Relief Bump Map (`Issue #11` & `Issue #12`) with random-ashlar rectangular stone courses,
 * natural lichen/moss joints, warm buff/grey/honey stone variations, and riven sedimentary ripples.
 */
function createRivenYorkstonePatioTextures(): {
  readonly colorMap: THREE.CanvasTexture;
  readonly bumpMap: THREE.CanvasTexture;
} {
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

/**
 * High-resolution (`512x512`) 45-degree Herringbone Reclaimed Red-Brick Paving Texture
 * + Relief Bump Map (`Issue #12`: "Herr" at `[-2.819, 0.09, 7.666]`, `courtyard.rattanPatioSlab`).
 */
function createHerringboneBrickPatioTextures(): {
  readonly colorMap: THREE.CanvasTexture;
  readonly bumpMap: THREE.CanvasTexture;
} {
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

/**
 * High-resolution (`1024x512`) English Cotswold / Chilterns Unmortared Dry Stone Wall Texture
 * + Deep Crevice Bump Map (`Issue #13`, `Issue #14`, `Issue #16`) with stacked flat irregular
 * warm honey-buff ironstone, grey-brown ragstone, and weathered limestone slabs with deep shadow crevices.
 */
function createDryStoneWallTextures(): {
  readonly colorMap: THREE.CanvasTexture;
  readonly bumpMap: THREE.CanvasTexture;
} {
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

/**
 * High-resolution (`512x512`) Botanical Shrub Foliage Leaf Texture + Relief Bump Map (`Issue #11`)
 * with overlapping serrated botanical leaves, sunlit leaf veins, and deep under-canopy shadows.
 */
function createBotanicalShrubFoliageTextures(): {
  readonly colorMap: THREE.CanvasTexture;
  readonly bumpMap: THREE.CanvasTexture;
} {
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
}

/**
 * Creates a displaced multi-tuft botanical foliage lobe geometry (`IcosahedronGeometry` detail 2
 * with radial leaf-cluster displacement & spherical UV mapping — NEVER a bare `SphereGeometry(1)`!).
 */
function createBotanicalFoliageLobeGeometry(seed: number): THREE.BufferGeometry {
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
function createBotanicalLeafSprayGeometry(): THREE.BufferGeometry {
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

export function buildPatioAndGrapeVinePergola(
  scene: THREE.Scene,
  southWallGroup: THREE.Group,
  kit: PatioAndGrapeVinePergolaKit
): void {
  const {
    limestoneEdgingMat,
    structuralOakMat,
    glassMat,
    buildLionHeadTrophyUrn,
    buildOldGrindstone,
  } = kit;

  // =========================================================================
  // 1. LOW BRICK RETAINING WALL & THRESHOLD PIERS ALONG THE KITCHEN COBBLE PATH (Z = +3.84m)
  // =========================================================================
  const courtyardBrickTextures = createImperialBrickTextures();
  const brickWallMat = new THREE.MeshStandardMaterial({
    color: 0xd8c6bc,
    map: courtyardBrickTextures.colorMap,
    bumpMap: courtyardBrickTextures.bumpMap,
    bumpScale: 0.018,
    roughness: 0.88,
  });
  const brickSoldierCopingMat = new THREE.MeshStandardMaterial({
    color: 0x945743,
    map: courtyardBrickTextures.colorMap,
    bumpMap: courtyardBrickTextures.bumpMap,
    bumpScale: 0.014,
    roughness: 0.82,
  });
  const blueBrickCopingMat = new THREE.MeshStandardMaterial({
    color: 0x484d56,
    roughness: 0.74,
    metalness: 0.05,
  });
  const applyCourtyardBrickUVs = (
    geo: THREE.BoxGeometry,
    ox: number,
    oy: number,
    oz: number
  ): THREE.BoxGeometry => {
    const pos = geo.attributes.position;
    const norm = geo.attributes.normal;
    const uv = geo.attributes.uv;
    if (!pos || !norm || !uv) return geo;
    const tileW = 1.35;
    const tileH = 1.2;
    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i) + ox;
      const wy = pos.getY(i) + oy;
      const wz = pos.getZ(i) + oz;
      const nx = Math.abs(norm.getX(i));
      const ny = Math.abs(norm.getY(i));
      const nz = Math.abs(norm.getZ(i));
      if (nz >= nx && nz >= ny) {
        uv.setXY(i, wx / tileW, wy / tileH);
      } else if (nx >= nz && nx >= ny) {
        uv.setXY(i, wz / tileW, wy / tileH);
      } else {
        uv.setXY(i, wx / tileW, wz / tileH);
      }
    }
    uv.needsUpdate = true;
    return geo;
  };

  const lowBrickWallWest = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(2.77, 0.24, 0.22), -3.135, 0.11, 3.84),
    brickWallMat
  );
  lowBrickWallWest.position.set(-3.135, 0.11, 3.84);
  lowBrickWallWest.castShadow = true;
  lowBrickWallWest.receiveShadow = true;
  scene.add(lowBrickWallWest);

  const lowBrickCopingWest = new THREE.Mesh(
    new THREE.BoxGeometry(2.81, 0.048, 0.25),
    blueBrickCopingMat
  );
  lowBrickCopingWest.position.set(-3.135, 0.254, 3.84);
  lowBrickCopingWest.castShadow = true;
  lowBrickCopingWest.receiveShadow = true;
  scene.add(lowBrickCopingWest);

  const lowBrickWallMid = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(2.9, 0.24, 0.22), 1.0, 0.11, 3.84),
    brickWallMat
  );
  lowBrickWallMid.position.set(1.0, 0.11, 3.84);
  lowBrickWallMid.castShadow = true;
  lowBrickWallMid.receiveShadow = true;
  scene.add(lowBrickWallMid);

  const lowBrickCopingMid = new THREE.Mesh(
    new THREE.BoxGeometry(2.94, 0.048, 0.25),
    blueBrickCopingMat
  );
  lowBrickCopingMid.position.set(1.0, 0.254, 3.84);
  lowBrickCopingMid.castShadow = true;
  lowBrickCopingMid.receiveShadow = true;
  scene.add(lowBrickCopingMid);

  const lowBrickWallEast = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(1.5, 0.24, 0.22), 4.5, 0.11, 3.84),
    brickWallMat
  );
  lowBrickWallEast.position.set(4.5, 0.11, 3.84);
  lowBrickWallEast.castShadow = true;
  lowBrickWallEast.receiveShadow = true;
  scene.add(lowBrickWallEast);

  const lowBrickCopingEast = new THREE.Mesh(
    new THREE.BoxGeometry(1.54, 0.048, 0.25),
    blueBrickCopingMat
  );
  lowBrickCopingEast.position.set(4.5, 0.254, 3.84);
  lowBrickCopingEast.castShadow = true;
  lowBrickCopingEast.receiveShadow = true;
  scene.add(lowBrickCopingEast);

  const cornerPier = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(0.38, 0.56, 0.38), -4.52, 0.26, 3.84),
    brickWallMat
  );
  cornerPier.position.set(-4.52, 0.26, 3.84);
  cornerPier.castShadow = true;
  cornerPier.receiveShadow = true;
  scene.add(cornerPier);

  const cornerPierCap = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.07, 0.44),
    limestoneEdgingMat
  );
  cornerPierCap.position.set(-4.52, 0.575, 3.84);
  cornerPierCap.castShadow = true;
  scene.add(cornerPierCap);

  const lowBrickReturnWest = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(0.22, 0.28, 3.4), -4.52, 0.08, 5.54),
    brickWallMat
  );
  lowBrickReturnWest.position.set(-4.52, 0.08, 5.54);
  lowBrickReturnWest.castShadow = true;
  lowBrickReturnWest.receiveShadow = true;
  scene.add(lowBrickReturnWest);

  const lowBrickReturnCopingWest = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.048, 3.44),
    blueBrickCopingMat
  );
  lowBrickReturnCopingWest.position.set(-4.52, 0.244, 5.54);
  lowBrickReturnCopingWest.castShadow = true;
  lowBrickReturnCopingWest.receiveShadow = true;
  scene.add(lowBrickReturnCopingWest);

  const wroughtIronMat = new THREE.MeshStandardMaterial({
    color: 0x1c1e22,
    roughness: 0.44,
    metalness: 0.72,
  });
  for (const railY of [0.48, 0.82]) {
    const railBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.025, 3.12),
      wroughtIronMat
    );
    railBar.position.set(-4.52, railY, 5.61);
    railBar.castShadow = true;
    scene.add(railBar);
  }
  for (let rz = 4.08; rz <= 7.14; rz += 0.24) {
    const spindle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.62, 6),
      wroughtIronMat
    );
    spindle.position.set(-4.52, 0.56, rz);
    spindle.castShadow = true;
    scene.add(spindle);
  }

  const westPatioBenchGroup = new THREE.Group();
  westPatioBenchGroup.name = 'courtyard.rattanPatioWestBench';
  westPatioBenchGroup.position.set(-4.84, -0.14, 5.45);
  westPatioBenchGroup.rotation.y = -Math.PI / 2;
  const weatheredBenchMat = new THREE.MeshStandardMaterial({
    color: 0x8a755c,
    roughness: 0.76,
    metalness: 0.03,
  });
  const westBenchSeat = new THREE.Mesh(
    new THREE.BoxGeometry(1.22, 0.042, 0.46),
    weatheredBenchMat
  );
  westBenchSeat.position.set(0, 0.42, 0.02);
  westBenchSeat.castShadow = true;
  westPatioBenchGroup.add(westBenchSeat);
  const westBenchBack = new THREE.Mesh(
    new THREE.BoxGeometry(1.22, 0.4, 0.038),
    weatheredBenchMat
  );
  westBenchBack.position.set(0, 0.64, -0.2);
  westBenchBack.rotation.x = -0.08;
  westBenchBack.castShadow = true;
  westPatioBenchGroup.add(westBenchBack);
  for (const sx of [-0.57, 0.57]) {
    const fLeg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.56, 0.05), weatheredBenchMat);
    fLeg.position.set(sx, 0.28, 0.22);
    westPatioBenchGroup.add(fLeg);
    const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.84, 0.05), weatheredBenchMat);
    rLeg.position.set(sx, 0.42, -0.2);
    westPatioBenchGroup.add(rLeg);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.038, 0.48), weatheredBenchMat);
    arm.position.set(sx, 0.56, 0.01);
    westPatioBenchGroup.add(arm);
  }
  scene.add(westPatioBenchGroup);

  const rustedBowlMat = new THREE.MeshStandardMaterial({
    color: 0x6e3b28,
    roughness: 0.84,
    metalness: 0.28,
  });
  const fireBowlStand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.3, 0.14, 16),
    wroughtIronMat
  );
  fireBowlStand.position.set(-5.05, -0.11, 6.65);
  scene.add(fireBowlStand);
  const fireBowl = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 18, 12, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5),
    rustedBowlMat
  );
  fireBowl.scale.set(1.0, 0.52, 1.0);
  fireBowl.position.set(-5.05, 0.14, 6.65);
  fireBowl.castShadow = true;
  scene.add(fireBowl);

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

  // =========================================================================
  // 3. SOUTH OF KITCHEN: RAISED RIVEN FLAGSTONE PATIO TERRACE, 3D HERRINGBONE
  //    BRICK BORDER & SCULPTED COTTAGE SHRUB BANK (`Issue #11` & `Issue #12`)
  // =========================================================================
  const yorkstonePatioTextures = createRivenYorkstonePatioTextures();
  const rivenYorkstonePatioMat = new THREE.MeshStandardMaterial({
    color: 0xd8cdb8,
    map: yorkstonePatioTextures.colorMap,
    bumpMap: yorkstonePatioTextures.bumpMap,
    bumpScale: 0.026,
    roughness: 0.8,
    metalness: 0.03,
  });
  const rivenYorkstoneAccentMat = new THREE.MeshStandardMaterial({
    color: 0xcabca4,
    map: yorkstonePatioTextures.colorMap,
    bumpMap: yorkstonePatioTextures.bumpMap,
    bumpScale: 0.028,
    roughness: 0.82,
    metalness: 0.03,
  });

  const herringboneBrickTextures = createHerringboneBrickPatioTextures();
  const herringboneBrickMat = new THREE.MeshStandardMaterial({
    color: 0xdcc8be,
    map: herringboneBrickTextures.colorMap,
    bumpMap: herringboneBrickTextures.bumpMap,
    bumpScale: 0.022,
    roughness: 0.82,
    metalness: 0.03,
  });

  const applyPatioFlagstoneUVs = (
    geo: THREE.BoxGeometry,
    ox: number,
    oy: number,
    oz: number,
    tileW = 1.85,
    tileH = 1.85
  ): THREE.BoxGeometry => {
    const pos = geo.attributes.position;
    const norm = geo.attributes.normal;
    const uv = geo.attributes.uv;
    if (!pos || !norm || !uv) return geo;
    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i) + ox;
      const wy = pos.getY(i) + oy;
      const wz = pos.getZ(i) + oz;
      const nx = Math.abs(norm.getX(i));
      const ny = Math.abs(norm.getY(i));
      const nz = Math.abs(norm.getZ(i));
      if (ny >= nx && ny >= nz) {
        uv.setXY(i, wx / tileW, wz / tileH);
      } else if (nz >= nx && nz >= ny) {
        uv.setXY(i, wx / tileW, wy / tileH);
      } else {
        uv.setXY(i, wz / tileW, wy / tileH);
      }
    }
    uv.needsUpdate = true;
    return geo;
  };

  const rattanPatioSlab = new THREE.Mesh(
    applyPatioFlagstoneUVs(new THREE.BoxGeometry(8.65, 0.16, 3.15), -0.075, 0.01, 5.525, 1.8, 1.8),
    rivenYorkstonePatioMat
  );
  rattanPatioSlab.name = 'courtyard.rattanPatioSlab';
  rattanPatioSlab.position.set(-0.075, 0.01, 5.525);
  rattanPatioSlab.receiveShadow = true;
  scene.add(rattanPatioSlab);

  const patioBrickBorderGroup = new THREE.Group();
  patioBrickBorderGroup.name = 'courtyard.rattanPatioSlab.brickBorder';

  for (const [bx, bz, bw, bd] of [
    [-0.075, 4.05, 8.63, 0.18],
    [-0.075, 7.00, 8.63, 0.18],
    [-4.30, 5.525, 0.18, 2.77],
    [4.15, 5.525, 0.18, 2.77],
    [-1.52, 5.525, 0.16, 2.77],
  ] as const) {
    const borderStrip = new THREE.Mesh(
      applyCourtyardBrickUVs(new THREE.BoxGeometry(bw, 0.014, bd), bx, 0.09, bz),
      brickSoldierCopingMat
    );
    borderStrip.position.set(bx, 0.09, bz);
    borderStrip.receiveShadow = true;
    patioBrickBorderGroup.add(borderStrip);
  }

  const herringboneInlaySlab = new THREE.Mesh(
    applyPatioFlagstoneUVs(new THREE.BoxGeometry(2.54, 0.015, 2.72), -2.90, 0.091, 5.525, 1.35, 1.35),
    herringboneBrickMat
  );
  herringboneInlaySlab.name = 'courtyard.rattanPatioSlab.herringboneInlay';
  herringboneInlaySlab.position.set(-2.90, 0.091, 5.525);
  herringboneInlaySlab.receiveShadow = true;
  patioBrickBorderGroup.add(herringboneInlaySlab);

  const reliefSlabCols = [1.05, 0.88, 1.12, 0.94, 1.08];
  const reliefSlabRows = [0.86, 0.92, 0.84];
  let rZ = 4.18;
  for (let r = 0; r < reliefSlabRows.length; r++) {
    const rowD = reliefSlabRows[r]!;
    let rX = -1.36;
    for (let c = 0; c < reliefSlabCols.length; c++) {
      const colW = reliefSlabCols[c]!;
      const cx = rX + colW * 0.5;
      const cz = rZ + rowD * 0.5;
      const reliefSlab = new THREE.Mesh(
        applyPatioFlagstoneUVs(
          new THREE.BoxGeometry(colW - 0.025, 0.012, rowD - 0.025),
          cx,
          0.091,
          cz,
          1.8,
          1.8
        ),
        (r + c) % 2 === 0 ? rivenYorkstonePatioMat : rivenYorkstoneAccentMat
      );
      reliefSlab.position.set(cx, 0.091, cz);
      reliefSlab.receiveShadow = true;
      patioBrickBorderGroup.add(reliefSlab);
      rX += colW + 0.04;
    }
    rZ += rowD + 0.04;
  }

  for (const stepX of [-1.1, 3.1]) {
    const brickRiser = new THREE.Mesh(
      applyCourtyardBrickUVs(new THREE.BoxGeometry(1.3, 0.11, 0.30), stepX, 0.015, 3.84),
      brickWallMat
    );
    brickRiser.position.set(stepX, 0.015, 3.84);
    brickRiser.castShadow = true;
    brickRiser.receiveShadow = true;
    patioBrickBorderGroup.add(brickRiser);

    const yorkstoneTread = new THREE.Mesh(
      applyPatioFlagstoneUVs(new THREE.BoxGeometry(1.34, 0.036, 0.34), stepX, 0.082, 3.84, 1.5, 1.5),
      rivenYorkstonePatioMat
    );
    yorkstoneTread.position.set(stepX, 0.082, 3.84);
    yorkstoneTread.castShadow = true;
    yorkstoneTread.receiveShadow = true;
    patioBrickBorderGroup.add(yorkstoneTread);
  }
  scene.add(patioBrickBorderGroup);

  const patioSouthBrickWall = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(9.78, 0.28, 0.18), 0.42, 0.05, 7.82),
    brickWallMat
  );
  patioSouthBrickWall.position.set(0.42, 0.05, 7.82);
  patioSouthBrickWall.castShadow = true;
  patioSouthBrickWall.receiveShadow = true;
  scene.add(patioSouthBrickWall);

  const patioSouthBrickCoping = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(9.82, 0.045, 0.22), 0.42, 0.21, 7.82),
    brickSoldierCopingMat
  );
  patioSouthBrickCoping.position.set(0.42, 0.21, 7.82);
  patioSouthBrickCoping.castShadow = true;
  patioSouthBrickCoping.receiveShadow = true;
  scene.add(patioSouthBrickCoping);

  const patioSouthSoilBed = new THREE.Mesh(
    new THREE.BoxGeometry(9.5, 0.2, 0.72),
    soilMat
  );
  patioSouthSoilBed.position.set(0.35, 0.04, 7.42);
  patioSouthSoilBed.receiveShadow = true;
  scene.add(patioSouthSoilBed);

  const patioEastBrickWall = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(0.18, 0.28, 3.98), 5.2, 0.05, 5.84),
    brickWallMat
  );
  patioEastBrickWall.position.set(5.2, 0.05, 5.84);
  patioEastBrickWall.castShadow = true;
  patioEastBrickWall.receiveShadow = true;
  scene.add(patioEastBrickWall);

  const patioEastSoilBed = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.2, 3.85),
    soilMat
  );
  patioEastSoilBed.position.set(4.68, 0.04, 5.84);
  patioEastSoilBed.receiveShadow = true;
  scene.add(patioEastSoilBed);

  for (const [dx, dy, dz, rx, ry, rz] of [
    [-3.65, 0.44, 7.22, 0.62, 0.48, 0.56],
    [-3.12, 0.38, 7.36, 0.48, 0.4, 0.46],
    [-4.05, 0.4, 6.82, 0.46, 0.38, 0.44],
  ] as const) {
    addSculptedBotanicalShrub(
      scene,
      dx,
      dy,
      dz,
      rx,
      ry,
      rz,
      goldenChoisyaMat,
      whiteBloomMat,
      brightShrubGreenMat
    );
  }

  for (const [sx, sz, rotZ, rotX] of [
    [-2.08, 7.35, 0.16, -0.08],
    [-1.92, 7.45, -0.14, 0.1],
    [-1.82, 7.39, 0.09, 0.14],
    [-2.0, 7.48, -0.06, -0.12],
    [-1.62, 7.42, -0.18, 0.07],
    [-2.28, 7.33, 0.21, -0.06],
  ] as const) {
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.036, 1.08, 8),
      woodyStemMat
    );
    stem.position.set(sx, 0.54, sz);
    stem.rotation.set(rotX, 0, rotZ);
    stem.castShadow = true;
    scene.add(stem);
  }
  for (const [cx, cy, cz, rx, ry, rz] of [
    [-1.95, 1.15, 7.42, 0.78, 0.48, 0.68],
    [-2.45, 1.04, 7.32, 0.56, 0.4, 0.52],
    [-1.42, 1.06, 7.45, 0.58, 0.42, 0.54],
  ] as const) {
    addSculptedBotanicalShrub(
      scene,
      cx,
      cy,
      cz,
      rx,
      ry,
      rz,
      sageFoliageMat,
      whiteBloomMat,
      deepGreenFoliageMat
    );
  }

  for (const [bx, by, bz, rx, ry, rz, mat, altMat, bloom] of [
    [-0.15, 0.58, 7.35, 0.76, 0.58, 0.68, brightShrubGreenMat, deepGreenFoliageMat, whiteBloomMat],
    [0.52, 0.48, 7.45, 0.56, 0.44, 0.52, deepGreenFoliageMat, sageFoliageMat, lavenderBloomMat],
    [1.85, 0.52, 7.48, 0.64, 0.48, 0.56, sageFoliageMat, brightShrubGreenMat, whiteBloomMat],
    [3.15, 0.56, 7.5, 0.68, 0.52, 0.58, brightShrubGreenMat, deepGreenFoliageMat, blushBloomMat],
    [4.45, 0.62, 7.32, 0.68, 0.56, 0.58, deepGreenFoliageMat, brightShrubGreenMat, whiteBloomMat],
    [4.68, 0.58, 6.05, 0.54, 0.52, 0.58, sageFoliageMat, deepGreenFoliageMat, lavenderBloomMat],
    [4.65, 0.54, 4.75, 0.52, 0.46, 0.52, brightShrubGreenMat, sageFoliageMat, whiteBloomMat],
  ] as const) {
    addSculptedBotanicalShrub(scene, bx, by, bz, rx, ry, rz, mat, bloom, altMat);
  }

  for (const [px, pz, r, h, mat, altMat, bloom] of [
    [-3.85, 4.22, 0.36, 0.32, sageFoliageMat, deepGreenFoliageMat, lavenderBloomMat],
    [-2.95, 4.24, 0.38, 0.34, deepGreenFoliageMat, brightShrubGreenMat, whiteBloomMat],
    [-0.15, 4.32, 0.42, 0.36, sageFoliageMat, deepGreenFoliageMat, lavenderBloomMat],
    [0.55, 4.45, 0.52, 0.44, deepGreenFoliageMat, brightShrubGreenMat, whiteBloomMat],
    [1.25, 4.48, 0.56, 0.48, brightShrubGreenMat, deepGreenFoliageMat, whiteBloomMat],
    [1.95, 4.36, 0.46, 0.38, deepGreenFoliageMat, sageFoliageMat, blushBloomMat],
  ] as const) {
    addSculptedBotanicalShrub(scene, px, h * 0.55 + 0.08, pz, r, h, r * 0.92, mat, bloom, altMat);
  }

  const darkGlazedPotMat = new THREE.MeshStandardMaterial({
    color: 0x2f2622,
    roughness: 0.34,
    metalness: 0.12,
  });
  const zincPotMat = new THREE.MeshStandardMaterial({
    color: 0x7a8086,
    roughness: 0.56,
    metalness: 0.24,
  });
  const creamPotMat = new THREE.MeshStandardMaterial({
    color: 0xd8cfc0,
    roughness: 0.52,
    metalness: 0.06,
  });
  const potMat = new THREE.MeshStandardMaterial({ color: 0xa45a3f, roughness: 0.75 });

  for (const [px, pz, rTop, rBot, potH, pMat, cMat, bMat] of [
    [2.28, 4.18, 0.23, 0.16, 0.38, darkGlazedPotMat, deepGreenFoliageMat, whiteBloomMat],
    [1.52, 4.15, 0.17, 0.13, 0.31, zincPotMat, sageFoliageMat, lavenderBloomMat],
    [1.18, 4.12, 0.15, 0.11, 0.26, potMat, brightShrubGreenMat, geraniumRedBloomMat],
    [-1.62, 4.16, 0.19, 0.14, 0.32, potMat, deepGreenFoliageMat, whiteBloomMat],
    [3.68, 4.18, 0.19, 0.14, 0.32, potMat, sageFoliageMat, lavenderBloomMat],
    [0.82, 7.62, 0.18, 0.13, 0.3, creamPotMat, brightShrubGreenMat, blushBloomMat],
  ] as const) {
    const potGroup = new THREE.Group();
    potGroup.name = 'courtyard.rattanPatioSlab.plantedPot';
    potGroup.position.set(px, 0.08, pz);

    const pot = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, potH, 16), pMat);
    pot.position.set(0, potH * 0.5, 0);
    pot.castShadow = true;
    pot.receiveShadow = true;
    potGroup.add(pot);

    const potRim = new THREE.Mesh(new THREE.TorusGeometry(rTop, 0.015, 8, 16), pMat);
    potRim.rotation.x = Math.PI * 0.5;
    potRim.position.set(0, potH - 0.012, 0);
    potGroup.add(potRim);

    const potSoil = new THREE.Mesh(new THREE.CylinderGeometry(rTop * 0.9, rTop * 0.9, 0.02, 14), soilMat);
    potSoil.position.set(0, potH - 0.02, 0);
    potGroup.add(potSoil);

    addSculptedBotanicalShrub(
      potGroup,
      0,
      potH + rTop * 0.58,
      0,
      rTop * 1.28,
      rTop * 1.05,
      rTop * 1.28,
      cMat,
      bMat,
      deepGreenFoliageMat
    );

    scene.add(potGroup);
  }

  buildLionHeadTrophyUrn(scene, 1.88, 4.48, deepGreenFoliageMat, whiteBloomMat, blushBloomMat);
  buildOldGrindstone(scene, 0.62, 4.28, structuralOakMat);

  const bayLeafDarkMat = new THREE.MeshStandardMaterial({
    color: 0x2d4d2a,
    map: botanicalFoliageTextures.colorMap,
    bumpMap: botanicalFoliageTextures.bumpMap,
    bumpScale: 0.024,
    roughness: 0.62,
    metalness: 0.04,
  });
  const bayLeafMidMat = new THREE.MeshStandardMaterial({
    color: 0x3b6136,
    map: botanicalFoliageTextures.colorMap,
    bumpMap: botanicalFoliageTextures.bumpMap,
    bumpScale: 0.024,
    roughness: 0.58,
    metalness: 0.04,
  });
  const utilityBayTreePositions: ReadonlyArray<readonly [number, number]> = [
    [5.68, -0.68],
    [5.68, -1.72],
  ];
  for (const [bx, bz] of utilityBayTreePositions) {
    const bayPot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.185, 0.135, 0.31, 14),
      potMat
    );
    bayPot.position.set(bx, 0.155, bz);
    bayPot.castShadow = true;
    bayPot.receiveShadow = true;
    scene.add(bayPot);

    const bayPotRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.185, 0.016, 8, 16),
      potMat
    );
    bayPotRim.rotation.x = Math.PI / 2;
    bayPotRim.position.set(bx, 0.302, bz);
    scene.add(bayPotRim);

    const baySoil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.17, 0.02, 12),
      soilMat
    );
    baySoil.position.set(bx, 0.295, bz);
    scene.add(baySoil);

    const bayStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.022, 0.52, 8),
      structuralOakMat
    );
    bayStem.position.set(bx, 0.56, bz);
    bayStem.castShadow = true;
    scene.add(bayStem);

    const bayCrownCore = new THREE.Mesh(
      botanicalLobeGeos[0]!,
      bayLeafDarkMat
    );
    bayCrownCore.scale.set(0.24, 0.26, 0.24);
    bayCrownCore.position.set(bx, 0.96, bz);
    bayCrownCore.castShadow = true;
    bayCrownCore.receiveShadow = true;
    scene.add(bayCrownCore);

    const lobeOffsets: ReadonlyArray<readonly [number, number, number, number]> = [
      [0.08, 0.05, 0.07, 0.12],
      [-0.08, 0.04, 0.06, 0.115],
      [0.06, 0.06, -0.08, 0.115],
      [-0.07, 0.03, -0.07, 0.12],
      [0.0, 0.1, 0.0, 0.13],
      [0.1, -0.04, 0.0, 0.11],
      [-0.1, -0.04, 0.0, 0.11],
    ];
    for (let i = 0; i < lobeOffsets.length; i++) {
      const [lx, ly, lz, lr] = lobeOffsets[i]!;
      const lobe = new THREE.Mesh(
        botanicalLobeGeos[(i + 1) % botanicalLobeGeos.length]!,
        i % 2 === 0 ? bayLeafMidMat : bayLeafDarkMat
      );
      lobe.scale.set(lr, lr, lr);
      lobe.position.set(bx + lx, 0.96 + ly, bz + lz);
      lobe.castShadow = true;
      scene.add(lobe);
    }
  }

  const pierIvyGeo = new THREE.DodecahedronGeometry(1, 0);
  for (let i = 0; i < 18; i++) {
    const t = i / 17;
    const y = 0.25 + t * 2.55;
    const spreadX = (Math.sin(i * 4.7) * 0.5) * 0.44 * (1 - t * 0.25);
    const r = 0.11 + (i % 3) * 0.025;
    const ivyLeaf = new THREE.Mesh(
      pierIvyGeo,
      i % 2 === 0 ? bayLeafDarkMat : bayLeafMidMat
    );
    ivyLeaf.scale.set(r * 1.15, r, 0.06);
    ivyLeaf.position.set(1.15 + spreadX, y, 2.3);
    southWallGroup.add(ivyLeaf);
  }

  // =========================================================================
  // 6. ENLARGED & 2-STEP RAISED WALLED GRAPE-VINE PERGOLA DINING COURT
  //    (X = +6.82m..+11.85m, Z = -0.95m..+7.20m, Floor raised +0.32m via 2 steps!)
  //    - Issue #13 ("This is actually a dry stone wall (see pictures" at `[8.095, 1.293, 10.789]`):
  //      South wall (`Z = +7.20m`) converted to authentic unmortared Dry Stone Wall with 3D relief courses!
  //    - Issue #16 ("Dry stone wall here too" at `[11.504, 0.902, 8.169]`):
  //      East wall (`X = +11.85m`) & North wall (`Z = -0.95m`) & stone bench ledges built with Dry Stone Wall
  //      material, world-space `applyDryStoneWallUVs`, and 3D split-stone relief courses!
  //    - Issue #17 ("More grapes, they are dark colored grapes" at `[8.275, 2.97, 8.561]`):
  //      36 lush hanging dark purple-black Pinot Noir / Black Muscat grape clusters across the pergola canopy!
  // =========================================================================
  const pergolaGroup = new THREE.Group();
  pergolaGroup.name = 'courtyard.grapeVinePergola';
  const pergMinX = 6.82;
  const pergMaxX = 11.85;
  const pergMinZ = -0.95;
  const pergMaxZ = 7.2;
  const pergFloorY = 0.32;
  const pergWallH = 2.24;
  const pergWallTotalH = pergFloorY + pergWallH;
  const pergBeamY = pergFloorY + 2.32;
  const pergRafterY = pergFloorY + 2.44;

  const dryStoneTextures = createDryStoneWallTextures();
  const dryStoneWallMat = new THREE.MeshStandardMaterial({
    color: 0xd8c8b0,
    map: dryStoneTextures.colorMap,
    bumpMap: dryStoneTextures.bumpMap,
    bumpScale: 0.038,
    roughness: 0.88,
    metalness: 0.02,
  });
  const dryStoneReliefMat = new THREE.MeshStandardMaterial({
    color: 0xccb99e,
    map: dryStoneTextures.colorMap,
    bumpMap: dryStoneTextures.bumpMap,
    bumpScale: 0.04,
    roughness: 0.9,
    metalness: 0.02,
  });
  const dryStoneCopingMat = new THREE.MeshStandardMaterial({
    color: 0xc2b298,
    map: yorkstonePatioTextures.colorMap,
    bumpMap: yorkstonePatioTextures.bumpMap,
    bumpScale: 0.03,
    roughness: 0.84,
    metalness: 0.03,
  });

  const applyDryStoneWallUVs = (
    geo: THREE.BoxGeometry,
    ox: number,
    oy: number,
    oz: number,
    tileW = 1.6,
    tileH = 0.85
  ): THREE.BoxGeometry => {
    const pos = geo.attributes.position;
    const norm = geo.attributes.normal;
    const uv = geo.attributes.uv;
    if (!pos || !norm || !uv) return geo;
    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i) + ox;
      const wy = pos.getY(i) + oy;
      const wz = pos.getZ(i) + oz;
      const nx = Math.abs(norm.getX(i));
      const ny = Math.abs(norm.getY(i));
      const nz = Math.abs(norm.getZ(i));
      if (nz >= nx && nz >= ny) {
        uv.setXY(i, wx / tileW, wy / tileH);
      } else if (nx >= nz && nx >= ny) {
        uv.setXY(i, wz / tileW, wy / tileH);
      } else {
        uv.setXY(i, wx / tileW, wz / tileW);
      }
    }
    uv.needsUpdate = true;
    return geo;
  };

  const addDryStoneReliefCourses = (
    parent: THREE.Object3D,
    axis: 'x' | 'z',
    spanMin: number,
    spanMax: number,
    fixedCoord: number,
    wallThickness: number,
    baseY: number,
    topY: number,
    seedOffset: number
  ): void => {
    const reliefGroup = new THREE.Group();
    reliefGroup.name = 'courtyard.grapeVinePergola.dryStoneRelief';

    const courseYs: number[] = [];
    for (let y = baseY + 0.16; y <= topY - 0.14; y += 0.28) {
      courseYs.push(y);
    }

    for (let r = 0; r < courseYs.length; r++) {
      const cy = courseYs[r]!;
      const slabH = 0.09 + ((r + seedOffset) % 3) * 0.022;
      let cursor = spanMin + 0.08 + (r % 2) * 0.18;
      let idx = 0;
      while (cursor < spanMax - 0.22) {
        const sHash = Math.abs(Math.sin((r * 31 + idx * 17 + seedOffset) * 19.7));
        const slabLen = Math.min(spanMax - 0.08 - cursor, 0.26 + sHash * 0.34);
        if (slabLen < 0.16) break;
        const mid = cursor + slabLen * 0.5;
        const proudDepth = wallThickness + 0.026 + (idx % 3) * 0.008;

        const bw = axis === 'x' ? slabLen : proudDepth;
        const bd = axis === 'x' ? proudDepth : slabLen;
        const px = axis === 'x' ? mid : fixedCoord;
        const pz = axis === 'x' ? fixedCoord : mid;

        const stoneCourse = new THREE.Mesh(
          applyDryStoneWallUVs(new THREE.BoxGeometry(bw, slabH, bd), px, cy, pz),
          (r + idx) % 2 === 0 ? dryStoneWallMat : dryStoneReliefMat
        );
        stoneCourse.position.set(px, cy, pz);
        stoneCourse.castShadow = true;
        stoneCourse.receiveShadow = true;
        reliefGroup.add(stoneCourse);

        cursor += slabLen + 0.05 + (idx % 2) * 0.04;
        idx++;
      }
    }

    let cCursor = spanMin - 0.02;
    let cIdx = 0;
    while (cCursor < spanMax - 0.05) {
      const cLen = Math.min(spanMax + 0.02 - cCursor, 0.38 + ((cIdx * 13 + seedOffset) % 5) * 0.06);
      if (cLen < 0.12) break;
      const cMid = cCursor + cLen * 0.5;
      const cH = 0.058 + (cIdx % 3) * 0.008;
      const cOverhang = wallThickness + 0.075 + (cIdx % 2) * 0.014;
      const cw = axis === 'x' ? cLen - 0.012 : cOverhang;
      const cd = axis === 'x' ? cOverhang : cLen - 0.012;
      const cx = axis === 'x' ? cMid : fixedCoord;
      const cz = axis === 'x' ? fixedCoord : cMid;

      const copingStone = new THREE.Mesh(
        applyDryStoneWallUVs(new THREE.BoxGeometry(cw, cH, cd), cx, topY + 0.032, cz),
        dryStoneCopingMat
      );
      copingStone.position.set(cx, topY + 0.032, cz);
      copingStone.castShadow = true;
      copingStone.receiveShadow = true;
      reliefGroup.add(copingStone);

      cCursor += cLen;
      cIdx++;
    }

    parent.add(reliefGroup);
  };

  const boundaryStepNorthWall = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(1.54, 2.1, 0.24), 6.05, 1.05, -1.92),
    brickWallMat
  );
  boundaryStepNorthWall.position.set(6.05, 1.05, -1.92);
  boundaryStepNorthWall.castShadow = true;
  pergolaGroup.add(boundaryStepNorthWall);

  const boundaryStepEastReturn = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(0.24, 2.25, 1.02), pergMinX, 1.125, -1.45),
    brickWallMat
  );
  boundaryStepEastReturn.position.set(pergMinX, 1.125, -1.45);
  boundaryStepEastReturn.castShadow = true;
  pergolaGroup.add(boundaryStepEastReturn);

  const plinthMidX = (pergMinX + pergMaxX) * 0.5;
  const plinthMidY = (pergFloorY - 0.14) * 0.5;
  const plinthMidZ = (pergMinZ + pergMaxZ) * 0.5;
  const pergolaRetainingPlinth = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(pergMaxX - pergMinX + 0.16, pergFloorY + 0.06, pergMaxZ - pergMinZ + 0.16),
      plinthMidX,
      plinthMidY,
      plinthMidZ
    ),
    dryStoneWallMat
  );
  pergolaRetainingPlinth.position.set(plinthMidX, plinthMidY, plinthMidZ);
  pergolaRetainingPlinth.receiveShadow = true;
  pergolaGroup.add(pergolaRetainingPlinth);

  const pergolaCourtFloor = new THREE.Mesh(
    applyPatioFlagstoneUVs(
      new THREE.BoxGeometry(pergMaxX - pergMinX + 0.2, 0.08, pergMaxZ - pergMinZ + 0.2),
      plinthMidX,
      pergFloorY - 0.04,
      plinthMidZ,
      1.85,
      1.85
    ),
    rivenYorkstonePatioMat
  );
  pergolaCourtFloor.name = 'courtyard.grapeVinePergola.floor';
  pergolaCourtFloor.position.set(plinthMidX, pergFloorY - 0.04, plinthMidZ);
  pergolaCourtFloor.receiveShadow = true;
  pergolaGroup.add(pergolaCourtFloor);

  for (let s = 0; s < 2; s++) {
    const stepTopY = (s + 1) * 0.16;
    const stepH = 0.16;
    const stepY = stepTopY - stepH * 0.5;

    const wnX = pergMinX + (s - 0.5) * 0.26;
    const westNorthStep = new THREE.Mesh(
      applyDryStoneWallUVs(new THREE.BoxGeometry(0.28, stepH, 1.8), wnX, stepY, 2.65),
      dryStoneCopingMat
    );
    westNorthStep.position.set(wnX, stepY, 2.65);
    westNorthStep.castShadow = true;
    westNorthStep.receiveShadow = true;
    pergolaGroup.add(westNorthStep);

    const westSouthStep = new THREE.Mesh(
      applyDryStoneWallUVs(new THREE.BoxGeometry(0.28, stepH, 1.15), wnX, stepY, 6.42),
      dryStoneCopingMat
    );
    westSouthStep.position.set(wnX, stepY, 6.42);
    westSouthStep.castShadow = true;
    westSouthStep.receiveShadow = true;
    pergolaGroup.add(westSouthStep);

    const egX = pergMaxX + (0.5 + (1 - s)) * 0.3;
    const eastGardenStep = new THREE.Mesh(
      applyDryStoneWallUVs(new THREE.BoxGeometry(0.32, stepH, 1.5), egX, stepY, 2.6),
      dryStoneCopingMat
    );
    eastGardenStep.position.set(egX, stepY, 2.6);
    eastGardenStep.castShadow = true;
    eastGardenStep.receiveShadow = true;
    pergolaGroup.add(eastGardenStep);
  }

  const northWallSpanX = pergMaxX - pergMinX;
  const northWallMidX = (pergMinX + pergMaxX) * 0.5;
  const northStoneWall = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(northWallSpanX, pergWallTotalH, 0.28),
      northWallMidX,
      pergWallTotalH * 0.5,
      pergMinZ
    ),
    dryStoneWallMat
  );
  northStoneWall.position.set(northWallMidX, pergWallTotalH * 0.5, pergMinZ);
  northStoneWall.castShadow = true;
  northStoneWall.receiveShadow = true;
  pergolaGroup.add(northStoneWall);

  const northStoneCoping = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(northWallSpanX + 0.06, 0.06, 0.34),
      northWallMidX,
      pergWallTotalH + 0.03,
      pergMinZ
    ),
    dryStoneCopingMat
  );
  northStoneCoping.position.set(northWallMidX, pergWallTotalH + 0.03, pergMinZ);
  northStoneCoping.castShadow = true;
  pergolaGroup.add(northStoneCoping);
  addDryStoneReliefCourses(
    pergolaGroup,
    'x',
    pergMinX + 0.22,
    pergMaxX - 0.16,
    pergMinZ,
    0.28,
    pergFloorY,
    pergWallTotalH,
    11
  );

  const eastStoneBenchBase = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(0.34, 0.38, 3.5),
      pergMaxX - 0.3,
      pergFloorY + 0.19,
      5.25
    ),
    dryStoneWallMat
  );
  eastStoneBenchBase.position.set(pergMaxX - 0.3, pergFloorY + 0.19, 5.25);
  eastStoneBenchBase.castShadow = true;
  eastStoneBenchBase.receiveShadow = true;
  pergolaGroup.add(eastStoneBenchBase);

  const eastStoneBenchSlab = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(0.38, 0.05, 3.56),
      pergMaxX - 0.3,
      pergFloorY + 0.405,
      5.25
    ),
    dryStoneCopingMat
  );
  eastStoneBenchSlab.position.set(pergMaxX - 0.3, pergFloorY + 0.405, 5.25);
  eastStoneBenchSlab.castShadow = true;
  pergolaGroup.add(eastStoneBenchSlab);

  const southStoneBenchBase = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(3.45, 0.36, 0.34),
      9.65,
      pergFloorY + 0.18,
      pergMaxZ - 0.28
    ),
    dryStoneWallMat
  );
  southStoneBenchBase.position.set(9.65, pergFloorY + 0.18, pergMaxZ - 0.28);
  southStoneBenchBase.castShadow = true;
  southStoneBenchBase.receiveShadow = true;
  pergolaGroup.add(southStoneBenchBase);

  const southStoneBenchSlab = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(3.52, 0.05, 0.38),
      9.65,
      pergFloorY + 0.385,
      pergMaxZ - 0.28
    ),
    dryStoneCopingMat
  );
  southStoneBenchSlab.position.set(9.65, pergFloorY + 0.385, pergMaxZ - 0.28);
  southStoneBenchSlab.castShadow = true;
  pergolaGroup.add(southStoneBenchSlab);

  const cobaltBluePotMat = new THREE.MeshStandardMaterial({
    color: 0x1d4e89,
    roughness: 0.28,
    metalness: 0.14,
  });

  for (const [pz, r, h, pMat, bMat] of [
    [3.75, 0.16, 0.26, creamPotMat, whiteBloomMat],
    [4.75, 0.12, 0.22, zincPotMat, lavenderBloomMat],
    [5.75, 0.13, 0.24, potMat, geraniumRedBloomMat],
    [6.65, 0.11, 0.2, zincPotMat, whiteBloomMat],
  ] as const) {
    const ledgePot = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.76, h, 12), pMat);
    ledgePot.position.set(pergMaxX - 0.28, pergFloorY + 0.43 + h / 2, pz);
    ledgePot.castShadow = true;
    pergolaGroup.add(ledgePot);

    addSculptedBotanicalShrub(
      pergolaGroup,
      pergMaxX - 0.28,
      pergFloorY + 0.43 + h + r * 0.48,
      pz,
      r * 1.22,
      r * 0.96,
      r * 1.22,
      sageFoliageMat,
      bMat,
      deepGreenFoliageMat
    );
  }

  for (const [zMin, zMax, seedOff] of [
    [pergMinZ, 1.85, 23],
    [3.35, pergMaxZ, 41],
  ] as const) {
    const segD = zMax - zMin;
    const segMidZ = (zMin + zMax) * 0.5;
    const eastStoneWall = new THREE.Mesh(
      applyDryStoneWallUVs(
        new THREE.BoxGeometry(0.28, pergWallTotalH, segD),
        pergMaxX,
        pergWallTotalH * 0.5,
        segMidZ
      ),
      dryStoneWallMat
    );
    eastStoneWall.name = 'courtyard.grapeVinePergola.eastDryStoneWall';
    eastStoneWall.position.set(pergMaxX, pergWallTotalH * 0.5, segMidZ);
    eastStoneWall.castShadow = true;
    eastStoneWall.receiveShadow = true;
    pergolaGroup.add(eastStoneWall);

    const eastStoneCoping = new THREE.Mesh(
      applyDryStoneWallUVs(
        new THREE.BoxGeometry(0.34, 0.06, segD + 0.06),
        pergMaxX,
        pergWallTotalH + 0.03,
        segMidZ
      ),
      dryStoneCopingMat
    );
    eastStoneCoping.position.set(pergMaxX, pergWallTotalH + 0.03, segMidZ);
    eastStoneCoping.castShadow = true;
    pergolaGroup.add(eastStoneCoping);

    addDryStoneReliefCourses(
      pergolaGroup,
      'z',
      zMin + 0.08,
      zMax - 0.08,
      pergMaxX,
      0.28,
      pergFloorY,
      pergWallTotalH,
      seedOff
    );
  }

  const southWallSpanX = pergMaxX - pergMinX;
  const southWallMidX = (pergMinX + pergMaxX) * 0.5;
  const southPergolaBrickWall = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(southWallSpanX, pergWallTotalH, 0.28),
      southWallMidX,
      pergWallTotalH * 0.5,
      pergMaxZ
    ),
    dryStoneWallMat
  );
  southPergolaBrickWall.name = 'courtyard.grapeVinePergola.southBrickWall';
  southPergolaBrickWall.position.set(southWallMidX, pergWallTotalH * 0.5, pergMaxZ);
  southPergolaBrickWall.castShadow = true;
  southPergolaBrickWall.receiveShadow = true;
  pergolaGroup.add(southPergolaBrickWall);

  const southPergolaBrickCoping = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(southWallSpanX + 0.06, 0.06, 0.34),
      southWallMidX,
      pergWallTotalH + 0.03,
      pergMaxZ
    ),
    dryStoneCopingMat
  );
  southPergolaBrickCoping.position.set(southWallMidX, pergWallTotalH + 0.03, pergMaxZ);
  southPergolaBrickCoping.castShadow = true;
  pergolaGroup.add(southPergolaBrickCoping);

  addDryStoneReliefCourses(
    pergolaGroup,
    'x',
    pergMinX + 0.22,
    pergMaxX - 0.14,
    pergMaxZ,
    0.28,
    0.16,
    pergWallTotalH,
    59
  );

  const southAlleyHerbBedKerb = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(southWallSpanX, 0.26, 0.14),
      southWallMidX,
      0.06,
      pergMaxZ + 0.44
    ),
    dryStoneWallMat
  );
  southAlleyHerbBedKerb.position.set(southWallMidX, 0.06, pergMaxZ + 0.44);
  southAlleyHerbBedKerb.castShadow = true;
  pergolaGroup.add(southAlleyHerbBedKerb);

  const southAlleyHerbSoil = new THREE.Mesh(
    new THREE.BoxGeometry(southWallSpanX - 0.08, 0.2, 0.32),
    soilMat
  );
  southAlleyHerbSoil.position.set(southWallMidX, 0.04, pergMaxZ + 0.26);
  pergolaGroup.add(southAlleyHerbSoil);

  for (let hx = pergMinX + 0.38; hx <= pergMaxX - 0.38; hx += 0.68) {
    const isEven = Math.round(hx * 2) % 2 === 0;
    addSculptedBotanicalShrub(
      pergolaGroup,
      hx,
      0.24,
      pergMaxZ + 0.26,
      0.32,
      0.26,
      0.24,
      isEven ? sageFoliageMat : deepGreenFoliageMat,
      isEven ? lavenderBloomMat : whiteBloomMat,
      brightShrubGreenMat
    );
  }

  for (const [px, pz, pw, pd] of [
    [pergMinX, pergMinZ, 0.38, 0.38],
    [pergMinX, 1.55, 0.38, 0.38],
    [pergMinX, 3.75, 0.38, 0.38],
    [pergMinX, 5.65, 0.38, 0.38],
    [pergMinX, pergMaxZ, 0.38, 0.38],
  ] as const) {
    const pier = new THREE.Mesh(
      applyDryStoneWallUVs(
        new THREE.BoxGeometry(pw, pergWallTotalH, pd),
        px,
        pergWallTotalH * 0.5,
        pz
      ),
      dryStoneWallMat
    );
    pier.position.set(px, pergWallTotalH * 0.5, pz);
    pier.castShadow = true;
    pier.receiveShadow = true;
    pergolaGroup.add(pier);

    const pierCap = new THREE.Mesh(
      applyDryStoneWallUVs(
        new THREE.BoxGeometry(pw + 0.06, 0.06, pd + 0.06),
        px,
        pergWallTotalH + 0.03,
        pz
      ),
      dryStoneCopingMat
    );
    pierCap.position.set(px, pergWallTotalH + 0.03, pz);
    pierCap.castShadow = true;
    pergolaGroup.add(pierCap);
  }

  for (const [wz, wd] of [
    [0.3, 2.12],
    [4.7, 1.52],
  ] as const) {
    const dwarfWall = new THREE.Mesh(
      applyDryStoneWallUVs(new THREE.BoxGeometry(0.26, 0.38, wd), pergMinX, pergFloorY + 0.19, wz),
      dryStoneWallMat
    );
    dwarfWall.position.set(pergMinX, pergFloorY + 0.19, wz);
    dwarfWall.castShadow = true;
    dwarfWall.receiveShadow = true;
    pergolaGroup.add(dwarfWall);

    const dwarfCoping = new THREE.Mesh(
      applyDryStoneWallUVs(new THREE.BoxGeometry(0.32, 0.05, wd + 0.04), pergMinX, pergFloorY + 0.405, wz),
      dryStoneCopingMat
    );
    dwarfCoping.position.set(pergMinX, pergFloorY + 0.405, wz);
    dwarfCoping.castShadow = true;
    pergolaGroup.add(dwarfCoping);
  }

  for (const [px, pz, rTop, rBot, h, pMat, fMat, bMat] of [
    [7.18, 1.15, 0.19, 0.13, 0.34, cobaltBluePotMat, brightShrubGreenMat, whiteBloomMat],
    [7.16, 4.15, 0.19, 0.13, 0.34, cobaltBluePotMat, deepGreenFoliageMat, lavenderBloomMat],
    [7.18, 4.75, 0.16, 0.11, 0.28, potMat, sageFoliageMat, geraniumRedBloomMat],
    [7.16, 5.25, 0.15, 0.11, 0.26, zincPotMat, brightShrubGreenMat, whiteBloomMat],
    [7.18, 5.5, 0.18, 0.13, 0.32, potMat, sageFoliageMat, blushBloomMat],
  ] as const) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 14), pMat);
    pot.position.set(px, pergFloorY + h / 2, pz);
    pot.castShadow = true;
    pot.receiveShadow = true;
    pergolaGroup.add(pot);

    addSculptedBotanicalShrub(
      pergolaGroup,
      px,
      pergFloorY + h + rTop * 0.55,
      pz,
      rTop * 1.22,
      rTop * 1.05,
      rTop * 1.22,
      fMat,
      bMat,
      deepGreenFoliageMat
    );
  }

  const beamSpanX = pergMaxX - pergMinX + 0.52;
  const beamMidX = (pergMinX + pergMaxX) / 2;
  for (const bz of [pergMinZ, 1.55, 3.75, 5.65, pergMaxZ]) {
    const mainBeam = new THREE.Mesh(
      new THREE.BoxGeometry(beamSpanX, 0.15, 0.14),
      structuralOakMat
    );
    mainBeam.position.set(beamMidX, pergBeamY, bz);
    mainBeam.castShadow = true;
    mainBeam.receiveShadow = true;
    pergolaGroup.add(mainBeam);
  }

  const rafterSpanZ = pergMaxZ - pergMinZ + 0.56;
  const rafterMidZ = (pergMinZ + pergMaxZ) / 2;
  for (let rx = pergMinX; rx <= pergMaxX + 0.05; rx += 0.56) {
    const rafter = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.13, rafterSpanZ),
      structuralOakMat
    );
    rafter.position.set(rx, pergRafterY, rafterMidZ);
    rafter.castShadow = true;
    rafter.receiveShadow = true;
    pergolaGroup.add(rafter);
  }

  for (let bz = pergMinZ + 0.55; bz <= pergMaxZ - 0.35; bz += 0.9) {
    const batten = new THREE.Mesh(
      new THREE.BoxGeometry(beamSpanX - 0.12, 0.036, 0.045),
      structuralOakMat
    );
    batten.position.set(beamMidX, pergRafterY + 0.08, bz);
    pergolaGroup.add(batten);
  }

  const festoonCordMat = new THREE.MeshStandardMaterial({ color: 0x232528, roughness: 0.6 });
  const festoonBulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff5d6,
    emissive: 0xffb84d,
    emissiveIntensity: 0.55,
    roughness: 0.2,
  });
  const festoonBulbGeo = new THREE.SphereGeometry(0.024, 8, 8);
  for (const fz of [0.45, 2.55, 4.65, 6.45]) {
    const cordPts: THREE.Vector3[] = [];
    for (let s = 0; s <= 12; s++) {
      const t = s / 12;
      const fx = pergMinX + 0.25 + t * (pergMaxX - pergMinX - 0.5);
      const sag = Math.sin(t * Math.PI * 4) * 0.06;
      const fy = pergBeamY - 0.06 - Math.abs(sag);
      cordPts.push(new THREE.Vector3(fx, fy, fz));
      if (s > 0 && s < 12) {
        const bulb = new THREE.Mesh(festoonBulbGeo, festoonBulbMat);
        bulb.position.set(fx, fy - 0.028, fz);
        pergolaGroup.add(bulb);
      }
    }
    const cordMesh = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cordPts), 24, 0.004, 5, false),
      festoonCordMat
    );
    pergolaGroup.add(cordMesh);
  }

  const vineBarkMat = new THREE.MeshStandardMaterial({
    color: 0x543e2b,
    roughness: 0.9,
    metalness: 0.02,
  });
  const grapeDeepGreenMat = new THREE.MeshStandardMaterial({
    color: 0x2d5224,
    roughness: 0.66,
    metalness: 0.03,
    side: THREE.DoubleSide,
  });
  const grapeSunlitGreenMat = new THREE.MeshStandardMaterial({
    color: 0x467332,
    roughness: 0.62,
    metalness: 0.03,
    side: THREE.DoubleSide,
  });
  const grapeFreshLimeMat = new THREE.MeshStandardMaterial({
    color: 0x628f3c,
    roughness: 0.58,
    metalness: 0.03,
    side: THREE.DoubleSide,
  });

  const darkPurpleGrapeMat1 = new THREE.MeshStandardMaterial({
    color: 0x221229,
    roughness: 0.32,
    metalness: 0.06,
  });
  const darkPurpleGrapeMat2 = new THREE.MeshStandardMaterial({
    color: 0x2e1736,
    roughness: 0.32,
    metalness: 0.06,
  });
  const darkPurpleGrapeMat3 = new THREE.MeshStandardMaterial({
    color: 0x180d20,
    roughness: 0.32,
    metalness: 0.06,
  });
  const darkGrapeMats: ReadonlyArray<THREE.Material> = [
    darkPurpleGrapeMat1,
    darkPurpleGrapeMat2,
    darkPurpleGrapeMat3,
  ];
  const grapePeduncleStemMat = new THREE.MeshStandardMaterial({
    color: 0x4f4428,
    roughness: 0.82,
    metalness: 0.02,
  });

  const vineTrunkPaths: ReadonlyArray<{
    readonly radius: number;
    readonly pts: ReadonlyArray<readonly [number, number, number]>;
  }> = [
    {
      radius: 0.042,
      pts: [
        [8.65, pergFloorY, 6.98],
        [8.58, pergFloorY + 0.85, 6.96],
        [8.72, pergFloorY + 1.65, 6.97],
        [8.66, pergBeamY - 0.02, 6.82],
        [8.55, pergRafterY + 0.04, 4.15],
        [8.42, pergRafterY + 0.05, 1.45],
        [8.35, pergRafterY + 0.02, -0.65],
      ],
    },
    {
      radius: 0.038,
      pts: [
        [10.65, pergFloorY, 6.98],
        [10.72, pergFloorY + 0.88, 6.96],
        [10.58, pergFloorY + 1.72, 6.97],
        [10.66, pergBeamY, 6.8],
        [10.45, pergRafterY + 0.04, 4.1],
        [10.25, pergRafterY + 0.05, 1.35],
        [10.12, pergRafterY + 0.02, -0.68],
      ],
    },
    {
      radius: 0.036,
      pts: [
        [7.05, pergFloorY, 3.78],
        [7.08, pergFloorY + 0.88, 3.75],
        [7.02, pergFloorY + 1.72, 3.8],
        [7.12, pergBeamY, 3.68],
        [7.85, pergRafterY + 0.04, 2.85],
        [7.75, pergRafterY + 0.03, 0.25],
      ],
    },
  ];
  for (const trunk of vineTrunkPaths) {
    const curve = new THREE.CatmullRomCurve3(
      trunk.pts.map(([x, y, z]) => new THREE.Vector3(x, y, z))
    );
    const trunkMesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 24, trunk.radius, 7, false),
      vineBarkMat
    );
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    pergolaGroup.add(trunkMesh);
  }

  const createGrapeVineLeafSprayGeometry = (): THREE.BufferGeometry => {
    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];

    const addPalmateGrapeLeaf = (
      ox: number,
      oy: number,
      oz: number,
      scale: number,
      yaw: number,
      pitch: number,
      roll: number
    ): void => {
      const baseV = positions.length / 3;
      const quat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(pitch, yaw, roll, 'YXZ')
      );
      const vTmp = new THREE.Vector3();

      const pts: ReadonlyArray<readonly [number, number, number]> = [
        [0.0, 0.0, 0.0],
        [0.0, -0.025, 0.18],
        [-0.08, 0.01, -0.05],
        [-0.16, -0.015, 0.03],
        [-0.09, 0.005, 0.06],
        [-0.13, -0.02, 0.13],
        [0.08, 0.01, -0.05],
        [0.16, -0.015, 0.03],
        [0.09, 0.005, 0.06],
        [0.13, -0.02, 0.13],
        [0.0, 0.018, 0.08],
      ];

      for (const [lx, ly, lz] of pts) {
        vTmp.set(lx * scale, ly * scale, lz * scale).applyQuaternion(quat);
        positions.push(ox + vTmp.x, oy + vTmp.y, oz + vTmp.z);
        normals.push(0, 1, 0);
      }

      const tris: ReadonlyArray<readonly [number, number, number]> = [
        [0, 2, 3],
        [0, 3, 10],
        [3, 4, 10],
        [4, 5, 10],
        [5, 1, 10],
        [0, 10, 7],
        [0, 7, 6],
        [10, 8, 7],
        [10, 9, 8],
        [10, 1, 9],
      ];
      for (const [a, b, c] of tris) {
        indices.push(baseV + a, baseV + b, baseV + c);
      }
    };

    addPalmateGrapeLeaf(0.0, 0.03, 0.0, 1.15, 0.0, 0.18, 0.0);
    addPalmateGrapeLeaf(-0.09, 0.01, 0.06, 1.05, 0.85, 0.28, -0.22);
    addPalmateGrapeLeaf(0.09, 0.01, 0.06, 1.05, -0.85, 0.28, 0.22);
    addPalmateGrapeLeaf(-0.08, -0.01, -0.07, 1.0, 2.25, 0.34, -0.18);
    addPalmateGrapeLeaf(0.08, -0.01, -0.07, 1.0, -2.25, 0.34, 0.18);
    addPalmateGrapeLeaf(0.0, -0.02, -0.1, 0.95, 3.14, 0.42, 0.0);
    addPalmateGrapeLeaf(0.02, 0.05, 0.04, 0.9, 0.45, -0.15, 0.12);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  };

  const grapeSprayGeo = createGrapeVineLeafSprayGeometry();
  const grapeCanopyMats = [grapeDeepGreenMat, grapeSunlitGreenMat, grapeFreshLimeMat];

  for (let i = 0; i < 220; i++) {
    const h1 = Math.sin((i + 17) * 12.9898) * 43758.5453;
    const f1 = h1 - Math.floor(h1);
    const h2 = Math.sin((i + 17) * 78.233) * 19341.123;
    const f2 = h2 - Math.floor(h2);
    const h3 = Math.sin((i + 17) * 39.425) * 27183.456;
    const f3 = h3 - Math.floor(h3);

    const gx = pergMinX - 0.18 + f1 * (pergMaxX - pergMinX + 0.42);
    const gz = pergMinZ - 0.12 + f2 * (pergMaxZ - pergMinZ + 0.38);
    const gy = pergRafterY + 0.02 + f3 * 0.24;
    const scale = 1.2 + (i % 4) * 0.24;

    const spray = new THREE.Mesh(grapeSprayGeo, grapeCanopyMats[i % 3]!);
    spray.position.set(gx, gy, gz);
    spray.rotation.set((f3 - 0.5) * 0.55, f1 * Math.PI * 2, (f2 - 0.5) * 0.55);
    spray.scale.set(scale, scale, scale);
    spray.castShadow = true;
    spray.receiveShadow = true;
    pergolaGroup.add(spray);
  }

  for (let i = 0; i < 84; i++) {
    const t = i / 84;
    const h1 = Math.sin((i + 91) * 19.13) * 31415.926;
    const f1 = h1 - Math.floor(h1);
    const h2 = Math.sin((i + 91) * 53.71) * 27182.818;
    const f2 = h2 - Math.floor(h2);

    let gx = 0;
    let gy = 0;
    let gz = 0;
    if (i < 34) {
      gx = pergMinX + 0.15 + (i / 34) * (pergMaxX - pergMinX - 0.3);
      gy = pergFloorY + 1.68 + f1 * 0.78;
      gz = pergMaxZ + 0.14 + f2 * 0.16;
    } else if (i < 66) {
      gx = pergMinX - 0.12 + f2 * 0.24;
      gy = pergFloorY + 1.48 + f1 * 0.96;
      gz = pergMinZ + ((i - 34) / 32) * (pergMaxZ - pergMinZ);
    } else {
      gx = pergMinX + ((i - 66) / 18) * (pergMaxX - pergMinX);
      gy = pergFloorY + 1.82 + f1 * 0.62;
      gz = pergMinZ - 0.08 + f2 * 0.16;
    }

    const scale = 1.1 + (i % 3) * 0.22;
    const trailingSpray = new THREE.Mesh(grapeSprayGeo, grapeCanopyMats[(i + 1) % 3]!);
    trailingSpray.position.set(gx, gy, gz);
    trailingSpray.rotation.set(0.65 + f1 * 0.5, t * Math.PI * 4, (f2 - 0.5) * 0.6);
    trailingSpray.scale.set(scale, scale, scale);
    trailingSpray.castShadow = true;
    pergolaGroup.add(trailingSpray);
  }

  // Issue #17 ("More grapes, they are dark colored grapes" at `[8.275, 2.97, 8.561]`):
  // 36 full 24-berry conical pendant clusters of dark purple-black grapes across 5 tiers with woody peduncle stems!
  const grapeBerryGeo = new THREE.SphereGeometry(0.0175, 7, 7);
  const grapePeduncleGeo = new THREE.CylinderGeometry(0.0035, 0.0055, 0.085, 6);

  const addGrapeBunch = (gx: number, gy: number, gz: number, isDark = true): void => {
    const bunchGroup = new THREE.Group();
    bunchGroup.name = 'courtyard.grapeVinePergola.grapeBunch';
    bunchGroup.position.set(gx, gy, gz);

    const peduncle = new THREE.Mesh(grapePeduncleGeo, grapePeduncleStemMat);
    peduncle.position.set(0, 0.036, 0);
    bunchGroup.add(peduncle);

    const tierCounts: ReadonlyArray<number> = [7, 6, 5, 4, 2];
    const tierRadii: ReadonlyArray<number> = [0.038, 0.033, 0.026, 0.019, 0.009];
    let berryIdx = isDark ? 0 : 1;

    for (let tier = 0; tier < tierCounts.length; tier++) {
      const count = tierCounts[tier]!;
      const ringR = tierRadii[tier]!;
      const tierY = -tier * 0.024;
      for (let k = 0; k < count; k++) {
        const ang = (k / count) * Math.PI * 2 + tier * 0.68;
        const bMat = darkGrapeMats[(berryIdx + tier + k) % darkGrapeMats.length]!;
        const berry = new THREE.Mesh(grapeBerryGeo, bMat);
        berry.position.set(
          Math.cos(ang) * ringR,
          tierY + ((k % 2) - 0.5) * 0.004,
          Math.sin(ang) * ringR
        );
        berry.scale.set(1.0, 1.08, 1.0);
        bunchGroup.add(berry);
        berryIdx++;
      }
    }

    pergolaGroup.add(bunchGroup);
  };

  const bunchPositions: ReadonlyArray<readonly [number, number, number, boolean]> = [
    [7.25, pergBeamY - 0.11, -0.35, true],
    [8.35, pergBeamY - 0.12, -0.25, true],
    [9.55, pergBeamY - 0.10, -0.15, true],
    [10.85, pergBeamY - 0.13, 0.15, true],
    [7.45, pergBeamY - 0.12, 0.75, true],
    [8.65, pergBeamY - 0.14, 0.95, true],
    [9.95, pergBeamY - 0.11, 1.05, true],
    [11.15, pergBeamY - 0.12, 1.25, true],
    [7.85, pergBeamY - 0.12, 1.55, true],
    [9.15, pergBeamY - 0.13, 1.85, true],
    [10.35, pergBeamY - 0.12, 1.95, true],
    [7.35, pergBeamY - 0.11, 2.35, true],
    [8.45, pergBeamY - 0.14, 2.55, true],
    [9.65, pergBeamY - 0.12, 2.65, true],
    [10.95, pergBeamY - 0.13, 2.85, true],
    [7.55, pergBeamY - 0.11, 3.25, true],
    [8.25, pergBeamY - 0.12, 3.45, true],
    [8.95, pergBeamY - 0.14, 3.55, true],
    [9.85, pergBeamY - 0.11, 3.45, true],
    [10.75, pergBeamY - 0.13, 3.65, true],
    [7.65, pergBeamY - 0.12, 4.05, true],
    [8.38, pergBeamY - 0.10, 4.25, true],
    [8.88, pergBeamY - 0.13, 4.42, true],
    [9.48, pergBeamY - 0.12, 4.35, true],
    [10.25, pergBeamY - 0.14, 4.20, true],
    [11.10, pergBeamY - 0.11, 4.45, true],
    [7.48, pergBeamY - 0.13, 4.85, true],
    [8.18, pergBeamY - 0.11, 4.95, true],
    [8.68, pergBeamY - 0.12, 5.05, true],
    [9.35, pergBeamY - 0.14, 5.15, true],
    [10.65, pergBeamY - 0.13, 5.15, true],
    [7.75, pergBeamY - 0.12, 5.65, true],
    [8.55, pergBeamY - 0.11, 5.85, true],
    [9.75, pergBeamY - 0.13, 5.95, true],
    [8.85, pergBeamY - 0.12, 6.55, true],
    [10.45, pergBeamY - 0.14, 6.62, true],
  ];
  for (const [bx, by, bz, isDark] of bunchPositions) {
    addGrapeBunch(bx, by, bz, isDark);
  }

  const diningSetGroup = new THREE.Group();
  diningSetGroup.name = 'courtyard.grapeVinePergola.diningSet';
  diningSetGroup.position.set(9.35, pergFloorY, 3.55);

  const pergolaTeakMat = new THREE.MeshStandardMaterial({
    color: 0x91795e,
    roughness: 0.7,
    metalness: 0.03,
  });

  const tableW = 0.98;
  const tableD = 2.08;
  const tableH = 0.75;

  for (let s = -4; s <= 4; s++) {
    const slat = new THREE.Mesh(
      new THREE.BoxGeometry(0.092, 0.028, tableD - 0.08),
      pergolaTeakMat
    );
    slat.position.set(s * 0.104, tableH - 0.014, 0);
    slat.castShadow = true;
    slat.receiveShadow = true;
    diningSetGroup.add(slat);
  }
  for (const sideX of [-tableW / 2 + 0.04, tableW / 2 - 0.04]) {
    const sideApron = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.075, tableD - 0.12),
      pergolaTeakMat
    );
    sideApron.position.set(sideX, tableH - 0.055, 0);
    sideApron.castShadow = true;
    diningSetGroup.add(sideApron);
  }
  for (const endZ of [-tableD / 2 + 0.04, tableD / 2 - 0.04]) {
    const endApron = new THREE.Mesh(
      new THREE.BoxGeometry(tableW - 0.12, 0.075, 0.032),
      pergolaTeakMat
    );
    endApron.position.set(0, tableH - 0.055, endZ);
    endApron.castShadow = true;
    diningSetGroup.add(endApron);
  }
  for (const lx of [-tableW / 2 + 0.06, tableW / 2 - 0.06]) {
    for (const lz of [-tableD / 2 + 0.06, tableD / 2 - 0.06]) {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.068, tableH - 0.02, 0.068),
        pergolaTeakMat
      );
      leg.position.set(lx, (tableH - 0.02) / 2, lz);
      leg.castShadow = true;
      diningSetGroup.add(leg);
    }
  }

  const chairConfigs: ReadonlyArray<readonly [number, number, number]> = [
    [-0.78, -0.52, Math.PI / 2],
    [-0.78, 0.52, Math.PI / 2],
    [0.78, -0.52, -Math.PI / 2],
    [0.78, 0.52, -Math.PI / 2],
    [0.0, -1.32, 0],
    [0.0, 1.32, Math.PI],
  ];
  for (let c = 0; c < chairConfigs.length; c++) {
    const [cx, cz, rotY] = chairConfigs[c]!;
    const chair = new THREE.Group();
    chair.position.set(cx, 0, cz);
    chair.rotation.y = rotY;

    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.034, 0.48),
      pergolaTeakMat
    );
    seat.position.set(0, 0.45, 0);
    seat.castShadow = true;
    seat.receiveShadow = true;
    chair.add(seat);

    const crestRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.54, 0.055, 0.032),
      pergolaTeakMat
    );
    crestRail.position.set(0, 0.88, -0.22);
    crestRail.castShadow = true;
    chair.add(crestRail);

    for (let b = -3; b <= 3; b++) {
      const backSlat = new THREE.Mesh(
        new THREE.BoxGeometry(0.042, 0.4, 0.018),
        pergolaTeakMat
      );
      backSlat.position.set(b * 0.068, 0.66, -0.22);
      backSlat.castShadow = true;
      chair.add(backSlat);
    }

    for (const sx of [-0.24, 0.24]) {
      const fLeg = new THREE.Mesh(
        new THREE.BoxGeometry(0.042, 0.64, 0.042),
        pergolaTeakMat
      );
      fLeg.position.set(sx, 0.32, 0.21);
      fLeg.castShadow = true;
      chair.add(fLeg);

      const rLeg = new THREE.Mesh(
        new THREE.BoxGeometry(0.042, 0.9, 0.042),
        pergolaTeakMat
      );
      rLeg.position.set(sx, 0.45, -0.22);
      rLeg.castShadow = true;
      chair.add(rLeg);

      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(0.052, 0.03, 0.48),
        pergolaTeakMat
      );
      arm.position.set(sx, 0.64, 0.0);
      arm.castShadow = true;
      chair.add(arm);
    }

    diningSetGroup.add(chair);
  }

  pergolaGroup.add(diningSetGroup);
  scene.add(pergolaGroup);

  // =========================================================================
  // 7. WALLED VEGETABLE GARDEN & GLAZED GREENHOUSE EAST OF THE PERGOLA
  //    - Issue #14 ("Fix thiis texture" at `[11.845, 0.882, 11.281]`):
  //      Converted the Vegetable Garden perimeter walls (`vegSouthWall`, `vegNorthWall`, `vegEastWall`)
  //      and coping stones to `dryStoneWallMat` / `dryStoneCopingMat` with `applyDryStoneWallUVs` on EVERY mesh!
  //    - Issue #15 ("Fix the join on this corner" at `[16.857, 0.478, 11.745]`):
  //      Fixed the SE corner `(17.65, 7.20)` and NE corner `(17.65, -0.95)` wall & coping spans so they meet
  //      in a clean, flush, zero-overlap corner join, plus dressed dry-stone corner quoin piers!
  // =========================================================================
  const vegGardenGroup = new THREE.Group();
  vegGardenGroup.name = 'courtyard.vegetableGardenAndGreenhouse';

  const gravelPathMat = new THREE.MeshStandardMaterial({
    color: 0xc2b59e,
    roughness: 0.92,
    metalness: 0.02,
  });
  const aluminumFrameMat = new THREE.MeshStandardMaterial({
    color: 0xbac2c8,
    roughness: 0.34,
    metalness: 0.68,
  });

  const vegWestX = pergMaxX; // 11.85m
  const vegEastX = 17.65;
  const vegNorthZ = pergMinZ; // -0.95m
  const vegSouthZ = pergMaxZ; // +7.20m
  const vegSpanX = vegEastX - vegWestX; // 5.80m
  const vegSpanZ = vegSouthZ - vegNorthZ; // 8.15m
  const vegMidX = (vegWestX + vegEastX) * 0.5; // 14.75m
  const vegMidZ = (vegNorthZ + vegSouthZ) * 0.5; // +3.125m

  const vegGardenGravelPad = new THREE.Mesh(
    new THREE.BoxGeometry(vegSpanX, 0.08, vegSpanZ),
    gravelPathMat
  );
  vegGardenGravelPad.name = 'courtyard.vegetableGarden.gravelFloor';
  vegGardenGravelPad.position.set(vegMidX, -0.04, vegMidZ);
  vegGardenGravelPad.receiveShadow = true;
  vegGardenGroup.add(vegGardenGravelPad);

  const horizWallStartX = vegWestX + 0.14; // 11.99m
  const horizWallEndX = vegEastX + 0.12;   // 17.77m
  const horizLenX = horizWallEndX - horizWallStartX; // 5.78m
  const horizCenterX = (horizWallStartX + horizWallEndX) * 0.5; // 14.88m
  const northWallH = 1.95;
  const southEastWallH = 0.96;

  const vegNorthWall = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(horizLenX, northWallH, 0.24),
      horizCenterX,
      northWallH * 0.5,
      vegNorthZ
    ),
    dryStoneWallMat
  );
  vegNorthWall.name = 'courtyard.vegetableGarden.northWall';
  vegNorthWall.position.set(horizCenterX, northWallH * 0.5, vegNorthZ);
  vegNorthWall.castShadow = true;
  vegNorthWall.receiveShadow = true;
  vegGardenGroup.add(vegNorthWall);

  const vegNorthCoping = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(horizLenX + 0.02, 0.055, 0.30),
      horizCenterX + 0.01,
      northWallH + 0.028,
      vegNorthZ
    ),
    dryStoneCopingMat
  );
  vegNorthCoping.position.set(horizCenterX + 0.01, northWallH + 0.028, vegNorthZ);
  vegNorthCoping.castShadow = true;
  vegGardenGroup.add(vegNorthCoping);

  const vegSouthWall = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(horizLenX, southEastWallH, 0.24),
      horizCenterX,
      southEastWallH * 0.5,
      vegSouthZ
    ),
    dryStoneWallMat
  );
  vegSouthWall.name = 'courtyard.vegetableGarden.southWall';
  vegSouthWall.position.set(horizCenterX, southEastWallH * 0.5, vegSouthZ);
  vegSouthWall.castShadow = true;
  vegSouthWall.receiveShadow = true;
  vegGardenGroup.add(vegSouthWall);

  const vegSouthCoping = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(horizLenX + 0.02, 0.055, 0.30),
      horizCenterX + 0.01,
      southEastWallH + 0.028,
      vegSouthZ
    ),
    dryStoneCopingMat
  );
  vegSouthCoping.position.set(horizCenterX + 0.01, southEastWallH + 0.028, vegSouthZ);
  vegSouthCoping.castShadow = true;
  vegGardenGroup.add(vegSouthCoping);

  addDryStoneReliefCourses(
    vegGardenGroup,
    'x',
    horizWallStartX + 0.06,
    vegEastX - 0.18,
    vegSouthZ,
    0.24,
    0.08,
    southEastWallH,
    73
  );

  const eastLenZ = (vegSouthZ - 0.12) - (vegNorthZ + 0.12); // 7.91m
  const vegEastWall = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(0.24, southEastWallH, eastLenZ),
      vegEastX,
      southEastWallH * 0.5,
      vegMidZ
    ),
    dryStoneWallMat
  );
  vegEastWall.name = 'courtyard.vegetableGarden.eastWall';
  vegEastWall.position.set(vegEastX, southEastWallH * 0.5, vegMidZ);
  vegEastWall.castShadow = true;
  vegEastWall.receiveShadow = true;
  vegGardenGroup.add(vegEastWall);

  const eastCopingLenZ = (vegSouthZ - 0.15) - (vegNorthZ + 0.15); // 7.85m
  const vegEastCoping = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(0.30, 0.055, eastCopingLenZ),
      vegEastX,
      southEastWallH + 0.028,
      vegMidZ
    ),
    dryStoneCopingMat
  );
  vegEastCoping.position.set(vegEastX, southEastWallH + 0.028, vegMidZ);
  vegEastCoping.castShadow = true;
  vegGardenGroup.add(vegEastCoping);

  addDryStoneReliefCourses(
    vegGardenGroup,
    'z',
    vegNorthZ + 0.22,
    vegSouthZ - 0.22,
    vegEastX,
    0.24,
    0.08,
    southEastWallH,
    89
  );

  for (const [qx, qz, qh] of [
    [vegEastX, vegSouthZ, 1.12],
    [vegEastX, vegNorthZ, 2.04],
  ] as const) {
    const quoinPier = new THREE.Mesh(
      applyDryStoneWallUVs(new THREE.BoxGeometry(0.30, qh, 0.30), qx, qh * 0.5, qz),
      dryStoneWallMat
    );
    quoinPier.name = 'courtyard.vegetableGarden.cornerQuoinPier';
    quoinPier.position.set(qx, qh * 0.5, qz);
    quoinPier.castShadow = true;
    quoinPier.receiveShadow = true;
    vegGardenGroup.add(quoinPier);

    const quoinCap = new THREE.Mesh(
      applyDryStoneWallUVs(new THREE.BoxGeometry(0.36, 0.065, 0.36), qx, qh + 0.032, qz),
      dryStoneCopingMat
    );
    quoinCap.position.set(qx, qh + 0.032, qz);
    quoinCap.castShadow = true;
    vegGardenGroup.add(quoinCap);
  }

  const greenhouseGroup = new THREE.Group();
  greenhouseGroup.name = 'courtyard.greenhouse';
  greenhouseGroup.position.set(15.85, 0.0, 2.17);
  greenhouseGroup.rotation.y = -Math.PI / 2;

  const ghW = 2.6;
  const ghD = 3.2;
  const ghBrickH = 0.42;
  const ghEaveH = 1.58;
  const ghRidgeH = 2.34;
  const ghSlopeRise = ghRidgeH - ghEaveH;
  const ghHalfW = ghW * 0.5;
  const ghSlopeLen = Math.hypot(ghHalfW, ghSlopeRise);
  const ghPitch = Math.atan2(ghSlopeRise, ghHalfW);

  for (const [bx, bz, bw, bd] of [
    [-ghHalfW, 0, 0.12, ghD],
    [ghHalfW, 0, 0.12, ghD],
    [0, -ghD * 0.5, ghW, 0.12],
    [-0.82, ghD * 0.5, 0.96, 0.12],
    [0.82, ghD * 0.5, 0.96, 0.12],
  ] as const) {
    const dwarfBase = new THREE.Mesh(
      applyCourtyardBrickUVs(new THREE.BoxGeometry(bw, ghBrickH, bd), bx, ghBrickH * 0.5, bz),
      brickWallMat
    );
    dwarfBase.position.set(bx, ghBrickH * 0.5, bz);
    dwarfBase.castShadow = true;
    dwarfBase.receiveShadow = true;
    greenhouseGroup.add(dwarfBase);
  }

  const ghWallGlassH = ghEaveH - ghBrickH;
  for (const sideX of [-1, 1]) {
    const sideGlass = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, ghWallGlassH, ghD - 0.08),
      glassMat
    );
    sideGlass.position.set(sideX * ghHalfW, ghBrickH + ghWallGlassH * 0.5, 0);
    greenhouseGroup.add(sideGlass);

    const eaveBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.04, ghD + 0.04),
      aluminumFrameMat
    );
    eaveBar.position.set(sideX * ghHalfW, ghEaveH, 0);
    greenhouseGroup.add(eaveBar);

    for (let gz = -ghD * 0.5; gz <= ghD * 0.5 + 0.01; gz += 0.64) {
      const mullion = new THREE.Mesh(
        new THREE.BoxGeometry(0.032, ghWallGlassH, 0.032),
        aluminumFrameMat
      );
      mullion.position.set(sideX * ghHalfW, ghBrickH + ghWallGlassH * 0.5, gz);
      greenhouseGroup.add(mullion);
    }

    const roofGlass = new THREE.Mesh(
      new THREE.BoxGeometry(ghSlopeLen, 0.016, ghD - 0.06),
      glassMat
    );
    roofGlass.position.set(
      sideX * (ghHalfW * 0.5),
      ghEaveH + ghSlopeRise * 0.5,
      0
    );
    roofGlass.rotation.z = -sideX * ghPitch;
    greenhouseGroup.add(roofGlass);

    for (let gz = -ghD * 0.5; gz <= ghD * 0.5 + 0.01; gz += 0.64) {
      const roofBar = new THREE.Mesh(
        new THREE.BoxGeometry(ghSlopeLen + 0.04, 0.032, 0.032),
        aluminumFrameMat
      );
      roofBar.position.set(
        sideX * (ghHalfW * 0.5),
        ghEaveH + ghSlopeRise * 0.5,
        gz
      );
      roofBar.rotation.z = -sideX * ghPitch;
      greenhouseGroup.add(roofBar);
    }
  }

  const ghRidgeBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.055, ghD + 0.06),
    aluminumFrameMat
  );
  ghRidgeBar.position.set(0, ghRidgeH, 0);
  greenhouseGroup.add(ghRidgeBar);

  for (const endZ of [-ghD * 0.5, ghD * 0.5]) {
    const endGlass = new THREE.Mesh(
      new THREE.BoxGeometry(ghW - 0.08, ghWallGlassH, 0.016),
      glassMat
    );
    endGlass.position.set(0, ghBrickH + ghWallGlassH * 0.5, endZ);
    greenhouseGroup.add(endGlass);

    for (const gx of [-0.65, -0.36, 0.36, 0.65]) {
      const stile = new THREE.Mesh(
        new THREE.BoxGeometry(0.032, ghEaveH, 0.036),
        aluminumFrameMat
      );
      stile.position.set(gx, ghEaveH * 0.5, endZ);
      greenhouseGroup.add(stile);
    }
  }

  for (const sideX of [-0.88, 0.88]) {
    const stagingBench = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.035, ghD - 0.32),
      weatheredBenchMat
    );
    stagingBench.position.set(sideX, 0.78, 0);
    greenhouseGroup.add(stagingBench);

    for (let pz = -1.1; pz <= 1.1; pz += 0.55) {
      const ghPot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.08, 0.18, 10),
        potMat
      );
      ghPot.position.set(sideX, 0.89, pz);
      greenhouseGroup.add(ghPot);

      const tomatoFoliage = new THREE.Mesh(botanicalLobeGeos[1]!, brightShrubGreenMat);
      tomatoFoliage.scale.set(0.18, 0.28, 0.18);
      tomatoFoliage.position.set(sideX, 1.12, pz);
      greenhouseGroup.add(tomatoFoliage);
    }
  }

  vegGardenGroup.add(greenhouseGroup);

  const bedW = 1.65;
  const bedD = 1.35;
  const bedH = 0.32;
  const vegBedCenters: ReadonlyArray<readonly [number, number, boolean]> = [
    [13.15, 0.15, false],
    [13.15, 2.05, true],
    [13.15, 4.10, false],
    [15.85, 4.35, true],
    [13.15, 5.95, true],
    [15.85, 5.95, false],
  ];

  for (const [bx, bz, hasBeanWigwam] of vegBedCenters) {
    const bedGroup = new THREE.Group();
    bedGroup.position.set(bx, 0, bz);

    for (const sz of [-bedD * 0.5 + 0.05, bedD * 0.5 - 0.05]) {
      const sleeperFB = new THREE.Mesh(
        new THREE.BoxGeometry(bedW, bedH, 0.1),
        structuralOakMat
      );
      sleeperFB.position.set(0, bedH * 0.5, sz);
      sleeperFB.castShadow = true;
      sleeperFB.receiveShadow = true;
      bedGroup.add(sleeperFB);
    }
    for (const sx of [-bedW * 0.5 + 0.05, bedW * 0.5 - 0.05]) {
      const sleeperLR = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, bedH, bedD - 0.2),
        structuralOakMat
      );
      sleeperLR.position.set(sx, bedH * 0.5, 0);
      sleeperLR.castShadow = true;
      sleeperLR.receiveShadow = true;
      bedGroup.add(sleeperLR);
    }

    const soilFill = new THREE.Mesh(
      new THREE.BoxGeometry(bedW - 0.18, bedH - 0.04, bedD - 0.18),
      soilMat
    );
    soilFill.position.set(0, (bedH - 0.04) * 0.5, 0);
    soilFill.receiveShadow = true;
    bedGroup.add(soilFill);

    for (const rx of [-0.46, 0.0, 0.46]) {
      for (const rz of [-0.36, 0.0, 0.36]) {
        const lobeIdx = Math.abs(Math.round((rx + rz) * 10)) % botanicalLobeGeos.length;
        const cropMound = new THREE.Mesh(
          botanicalLobeGeos[lobeIdx]!,
          (lobeIdx & 1) === 0 ? brightShrubGreenMat : deepGreenFoliageMat
        );
        cropMound.scale.set(0.21, 0.16, 0.21);
        cropMound.position.set(rx, bedH + 0.08, rz);
        cropMound.castShadow = true;
        bedGroup.add(cropMound);
      }
    }

    if (hasBeanWigwam) {
      for (let c = 0; c < 6; c++) {
        const ang = (c / 6) * Math.PI * 2;
        const cane = new THREE.Mesh(
          new THREE.CylinderGeometry(0.01, 0.014, 1.55, 6),
          weatheredBenchMat
        );
        cane.position.set(Math.cos(ang) * 0.22, bedH + 0.72, Math.sin(ang) * 0.22);
        cane.rotation.z = Math.cos(ang) * 0.18;
        cane.rotation.x = -Math.sin(ang) * 0.18;
        cane.castShadow = true;
        bedGroup.add(cane);
      }
      const vineClimber = new THREE.Mesh(
        new THREE.ConeGeometry(0.32, 1.15, 8),
        grapeSunlitGreenMat
      );
      vineClimber.position.set(0, bedH + 0.62, 0);
      vineClimber.castShadow = true;
      bedGroup.add(vineClimber);
    }

    vegGardenGroup.add(bedGroup);
  }

  scene.add(vegGardenGroup);
}
