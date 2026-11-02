import * as THREE from 'three';
import type {
  BathroomMetalMaterialPalette,
  BrasswareFinishCode,
} from './bathroom-spec-types.ts';

/**
 * Reusable PBR materials and pure in-memory `THREE.DataTexture` procedural surface maps
 * for the Main House bathroom sanitaryware & brassware collection.
 *
 * Uses `Uint8Array` RGBA `DataTexture` buffers exclusively (zero DOM `document` access)
 * so materials work identically in browser WebGL, Node Vitest suites, and headless
 * snapshot/USD tooling.
 */

export type WcSeatFinish = 'glossWhite' | 'antiqueOak' | 'walnut' | 'darkOak';

export interface BurnishedCopperMaterialPalette {
  readonly shell: THREE.MeshPhysicalMaterial;
  readonly plinth: THREE.MeshPhysicalMaterial;
}

export interface PaintedCabinetMaterialPalette {
  readonly cabinet: THREE.MeshPhysicalMaterial;
  readonly accentReveal: THREE.MeshStandardMaterial;
}

function clampByte(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
}

/** Deterministic 2D integer hash in `[0, 1]`, periodic over `(periodX, periodY)` for seamless tiling. */
function hash2DPeriodic(ix: number, iy: number, periodX: number, periodY: number, seed: number): number {
  const wx = ((ix % periodX) + periodX) % periodX;
  const wy = ((iy % periodY) + periodY) % periodY;
  let h = (wx * 374761393 + wy * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = h ^ (h >>> 16);
  return (h >>> 0) / 4294967295;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Seamless tileable 2D value noise in `[0, 1]` over `[0..1) x [0..1)` UV coordinates. */
function seamlessNoise2D(u: number, v: number, freqX: number, freqY: number, seed: number): number {
  const x = u * freqX;
  const y = v * freqY;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = smoothstep(x - x0);
  const fy = smoothstep(y - y0);

  const n00 = hash2DPeriodic(x0, y0, freqX, freqY, seed);
  const n10 = hash2DPeriodic(x0 + 1, y0, freqX, freqY, seed);
  const n01 = hash2DPeriodic(x0, y0 + 1, freqX, freqY, seed);
  const n11 = hash2DPeriodic(x0 + 1, y0 + 1, freqX, freqY, seed);

  const nx0 = n00 + (n10 - n00) * fx;
  const nx1 = n01 + (n11 - n01) * fx;
  return nx0 + (nx1 - nx0) * fy;
}

function seamlessFbm2D(u: number, v: number, baseFreq: number, octaves: number, seed: number): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let freq = baseFreq;
  for (let o = 0; o < octaves; o++) {
    sum += amp * seamlessNoise2D(u, v, freq, freq, seed + o * 97);
    norm += amp;
    amp *= 0.5;
    freq *= 2;
  }
  return norm > 0 ? sum / norm : 0.5;
}

function configureDataTexture(
  data: Uint8Array<ArrayBuffer>,
  width: number,
  height: number,
  name: string,
  srgb: boolean,
  repeatX = 1,
  repeatY = 1
): THREE.DataTexture {
  const tex = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.name = name;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

// ---------------------------------------------------------------------------
// Cached Procedural DataTextures
// ---------------------------------------------------------------------------

let brushedMetalMapsCache: {
  readonly roughnessMap: THREE.DataTexture;
  readonly bumpMap: THREE.DataTexture;
} | null = null;

function getBrushedMetalMaps(): {
  readonly roughnessMap: THREE.DataTexture;
  readonly bumpMap: THREE.DataTexture;
} {
  if (brushedMetalMapsCache) return brushedMetalMapsCache;
  const w = 128;
  const h = 128;
  const roughData = new Uint8Array(w * h * 4);
  const bumpData = new Uint8Array(w * h * 4);

  for (let y = 0; y < h; y++) {
    const v = y / h;
    const rowGrain = hash2DPeriodic(0, y, 1, h, 401);
    const fineBand = Math.sin(v * Math.PI * 44) * 0.5 + 0.5;
    for (let x = 0; x < w; x++) {
      const u = x / w;
      // Directional horizontal lathe/brush streaks with subtle longitudinal modulation
      const streak = seamlessNoise2D(u, v, 4, 64, 719);
      const micro = seamlessNoise2D(u, v, 16, 128, 1231);
      const brushVal = 0.52 * streak + 0.28 * rowGrain + 0.20 * micro;

      // Keep roughness multiplier high (218..255) so material.roughness sets exact mean finish
      const rByte = clampByte(220 + brushVal * 35);
      const bByte = clampByte(112 + (brushVal - 0.5) * 72 + (fineBand - 0.5) * 18);

      const idx = (y * w + x) * 4;
      roughData[idx] = rByte;
      roughData[idx + 1] = rByte;
      roughData[idx + 2] = rByte;
      roughData[idx + 3] = 255;

      bumpData[idx] = bByte;
      bumpData[idx + 1] = bByte;
      bumpData[idx + 2] = bByte;
      bumpData[idx + 3] = 255;
    }
  }

  brushedMetalMapsCache = {
    roughnessMap: configureDataTexture(roughData, w, h, 'bathroom.brushedMetal.roughness', false, 2, 2),
    bumpMap: configureDataTexture(bumpData, w, h, 'bathroom.brushedMetal.bump', false, 2, 2),
  };
  return brushedMetalMapsCache;
}

let knurlBumpMapCache: THREE.DataTexture | null = null;

/**
 * Fine 45-degree cross-hatched diamond knurling heightmap for Perrin & Rowe
 * Armstrong signature industrial collars, nuts & handshower grips.
 */
function getDiamondKnurlBumpMap(): THREE.DataTexture {
  if (knurlBumpMapCache) return knurlBumpMapCache;
  const w = 128;
  const h = 128;
  const data = new Uint8Array(w * h * 4);
  const cellsU = 32; // circumferential diamond pitch
  const cellsV = 8; // axial diamond pitch

  for (let y = 0; y < h; y++) {
    const v = (y / h) * cellsV;
    for (let x = 0; x < w; x++) {
      const u = (x / w) * cellsU;
      // 45° opposing helical V-grooves forming crisp raised diamond pyramids
      const d1 = Math.abs(((u + v) % 1 + 1) % 1 - 0.5) * 2; // 0 in groove, 1 on ridge
      const d2 = Math.abs(((u - v) % 1 + 1) % 1 - 0.5) * 2;
      const pyramid = Math.min(d1, d2);
      const sharpened = Math.pow(pyramid, 0.78);
      const byte = clampByte(24 + sharpened * 224);

      const idx = (y * w + x) * 4;
      data[idx] = byte;
      data[idx + 1] = byte;
      data[idx + 2] = byte;
      data[idx + 3] = 255;
    }
  }

  knurlBumpMapCache = configureDataTexture(data, w, h, 'bathroom.diamondKnurl.bump', false, 2, 1);
  return knurlBumpMapCache;
}

let mirostoneMapsCache: {
  readonly colorMap: THREE.DataTexture;
  readonly roughnessMap: THREE.DataTexture;
} | null = null;

/**
 * Veined Quartz / Mirostone (`MWFT SN`) procedural stone surface:
 * soft warm alabaster/off-white quartz matrix with delicate branching Carrara grey-taupe veining.
 */
function getMirostoneQuartzMaps(): {
  readonly colorMap: THREE.DataTexture;
  readonly roughnessMap: THREE.DataTexture;
} {
  if (mirostoneMapsCache) return mirostoneMapsCache;
  const w = 256;
  const h = 256;
  const colorData = new Uint8Array(w * h * 4);
  const roughData = new Uint8Array(w * h * 4);

  for (let y = 0; y < h; y++) {
    const v = y / h;
    for (let x = 0; x < w; x++) {
      const u = x / w;

      // Domain-warped diagonal mineral veins
      const warpX = seamlessFbm2D(u, v, 3, 4, 5101) - 0.5;
      const warpY = seamlessFbm2D(u, v, 3, 4, 6203) - 0.5;
      const wu = u + warpX * 0.22;
      const wv = v + warpY * 0.22;

      // Primary lazy diagonal quartz vein ribbon
      const phase1 = (wu * 1.5 + wv * 1.0) * Math.PI * 2;
      const ridge1 = 1 - Math.abs(Math.sin(phase1 * 0.5 + warpX * 2.1));
      const vein1 = Math.pow(Math.max(0, ridge1), 16);

      // Delicate secondary capillary vein
      const phase2 = (wu * 2.0 - wv * 1.5 + 0.37) * Math.PI * 2;
      const ridge2 = 1 - Math.abs(Math.sin(phase2 * 0.5 + warpY * 2.6));
      const vein2 = Math.pow(Math.max(0, ridge2), 24) * 0.65;

      // Subtle mineral clouding & fine quartz crystal grain
      const cloud = seamlessFbm2D(u, v, 5, 3, 7309);
      const speckle = seamlessNoise2D(u, v, 64, 64, 8419);

      const veinWeight = Math.min(1, vein1 * 0.85 + vein2);

      // Warm alabaster base (#f6f4ee) -> soft warm grey-taupe vein (#beb7ab)
      const baseR = 246 + (cloud - 0.5) * 6 + (speckle - 0.5) * 4;
      const baseG = 244 + (cloud - 0.5) * 6 + (speckle - 0.5) * 4;
      const baseB = 238 + (cloud - 0.5) * 7 + (speckle - 0.5) * 4;

      const r = clampByte(baseR * (1 - veinWeight) + 188 * veinWeight);
      const g = clampByte(baseG * (1 - veinWeight) + 182 * veinWeight);
      const b = clampByte(baseB * (1 - veinWeight) + 172 * veinWeight);

      const roughByte = clampByte(228 + veinWeight * 24 + (speckle - 0.5) * 10);

      const idx = (y * w + x) * 4;
      colorData[idx] = r;
      colorData[idx + 1] = g;
      colorData[idx + 2] = b;
      colorData[idx + 3] = 255;

      roughData[idx] = roughByte;
      roughData[idx + 1] = roughByte;
      roughData[idx + 2] = roughByte;
      roughData[idx + 3] = 255;
    }
  }

  mirostoneMapsCache = {
    colorMap: configureDataTexture(colorData, w, h, 'bathroom.mirostoneQuartz.color', true, 1, 1),
    roughnessMap: configureDataTexture(roughData, w, h, 'bathroom.mirostoneQuartz.roughness', false, 1, 1),
  };
  return mirostoneMapsCache;
}

const woodGrainMapsCache = new Map<'antiqueOak' | 'walnut', {
  readonly colorMap: THREE.DataTexture;
  readonly bumpMap: THREE.DataTexture;
}>();

function getWoodSeatMaps(variant: 'antiqueOak' | 'walnut'): {
  readonly colorMap: THREE.DataTexture;
  readonly bumpMap: THREE.DataTexture;
} {
  const cached = woodGrainMapsCache.get(variant);
  if (cached) return cached;

  const w = 128;
  const h = 128;
  const colorData = new Uint8Array(w * h * 4);
  const bumpData = new Uint8Array(w * h * 4);
  const isWalnut = variant === 'walnut';
  const baseRgb = isWalnut ? [96, 64, 44] : [156, 110, 68];

  for (let y = 0; y < h; y++) {
    const v = y / h;
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const cathedral = seamlessFbm2D(u, v, 3, 3, isWalnut ? 9103 : 9209);
      const fiber = seamlessNoise2D(u, v, 6, 64, isWalnut ? 9311 : 9413);
      const ring = Math.sin((v * 14 + cathedral * 2.4) * Math.PI * 2) * 0.5 + 0.5;
      const delta = (ring - 0.5) * 26 + (fiber - 0.5) * 16;

      const idx = (y * w + x) * 4;
      colorData[idx] = clampByte(baseRgb[0]! + delta);
      colorData[idx + 1] = clampByte(baseRgb[1]! + delta * 0.82);
      colorData[idx + 2] = clampByte(baseRgb[2]! + delta * 0.65);
      colorData[idx + 3] = 255;

      const bVal = clampByte(132 + (fiber - 0.5) * 48 + (ring - 0.5) * 22);
      bumpData[idx] = bVal;
      bumpData[idx + 1] = bVal;
      bumpData[idx + 2] = bVal;
      bumpData[idx + 3] = 255;
    }
  }

  const maps = {
    colorMap: configureDataTexture(colorData, w, h, `bathroom.wcSeat.${variant}.color`, true, 2, 2),
    bumpMap: configureDataTexture(bumpData, w, h, `bathroom.wcSeat.${variant}.bump`, false, 2, 2),
  };
  woodGrainMapsCache.set(variant, maps);
  return maps;
}

let cabinetBrushBumpCache: THREE.DataTexture | null = null;
function getPaintedTimberBumpMap(): THREE.DataTexture {
  if (cabinetBrushBumpCache) return cabinetBrushBumpCache;
  const w = 128;
  const h = 128;
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const v = y / h;
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const grain = seamlessNoise2D(u, v, 8, 64, 5501);
      const pore = seamlessNoise2D(u, v, 16, 96, 5623);
      const byte = clampByte(128 + (grain - 0.5) * 34 + (pore - 0.5) * 20);
      const idx = (y * w + x) * 4;
      data[idx] = byte;
      data[idx + 1] = byte;
      data[idx + 2] = byte;
      data[idx + 3] = 255;
    }
  }
  cabinetBrushBumpCache = configureDataTexture(data, w, h, 'bathroom.paintedJoinery.bump', false, 2, 2);
  return cabinetBrushBumpCache;
}

let tissueCrepeBumpCache: THREE.DataTexture | null = null;
function getTissueCrepeBumpMap(): THREE.DataTexture {
  if (tissueCrepeBumpCache) return tissueCrepeBumpCache;
  const w = 64;
  const h = 64;
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const v = y / h;
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const emboss = seamlessNoise2D(u, v, 32, 32, 7717);
      const byte = clampByte(128 + (emboss - 0.5) * 64);
      const idx = (y * w + x) * 4;
      data[idx] = byte;
      data[idx + 1] = byte;
      data[idx + 2] = byte;
      data[idx + 3] = 255;
    }
  }
  tissueCrepeBumpCache = configureDataTexture(data, w, h, 'bathroom.tissueCrepe.bump', false, 3, 2);
  return tissueCrepeBumpCache;
}

// ---------------------------------------------------------------------------
// Cached Sanitaryware & Brassware Materials
// ---------------------------------------------------------------------------

const brassPaletteCache = new Map<BrasswareFinishCode, BathroomMetalMaterialPalette>();
let darkShadowMatCache: THREE.MeshStandardMaterial | null = null;

function getSharedDarkShadowMaterial(): THREE.MeshStandardMaterial {
  if (!darkShadowMatCache) {
    darkShadowMatCache = new THREE.MeshStandardMaterial({
      name: 'bathroom.darkShadowRecess',
      color: 0x1a1917,
      roughness: 0.72,
      metalness: 0.18,
    });
  }
  return darkShadowMatCache;
}

/**
 * Returns the cached PBR metal palette (`primary`, `knurled`, `darkShadow`) for a
 * Perrin & Rowe / coordinated metalware finish code (`'SB'`, `'PF'`, `'BR'`).
 */
export function getBathroomBrassMaterials(finish: BrasswareFinishCode): BathroomMetalMaterialPalette {
  const existing = brassPaletteCache.get(finish);
  if (existing) return existing;

  const brushed = getBrushedMetalMaps();
  const knurlBump = getDiamondKnurlBumpMap();
  const darkShadow = getSharedDarkShadowMaterial();

  let primary: THREE.MeshPhysicalMaterial;
  let knurled: THREE.MeshPhysicalMaterial;

  switch (finish) {
    case 'SB': {
      // Satin Brass — Perrin & Rowe unlacquered living brushed aged brass
      primary = new THREE.MeshPhysicalMaterial({
        name: 'bathroom.brass.SB.primary',
        color: 0xb89146,
        metalness: 0.88,
        roughness: 0.33,
        roughnessMap: brushed.roughnessMap,
        bumpMap: brushed.bumpMap,
        bumpScale: 0.0007,
        clearcoat: 0.05,
        clearcoatRoughness: 0.28,
      });
      knurled = new THREE.MeshPhysicalMaterial({
        name: 'bathroom.brass.SB.knurled',
        color: 0xb48c42,
        metalness: 0.88,
        roughness: 0.41,
        bumpMap: knurlBump,
        bumpScale: 0.0025,
        clearcoat: 0.04,
        clearcoatRoughness: 0.34,
      });
      break;
    }
    case 'PF': {
      // Pewter — Perrin & Rowe brushed nickel / warm pewter
      primary = new THREE.MeshPhysicalMaterial({
        name: 'bathroom.brass.PF.primary',
        color: 0xb5b3ac,
        metalness: 0.90,
        roughness: 0.29,
        roughnessMap: brushed.roughnessMap,
        bumpMap: brushed.bumpMap,
        bumpScale: 0.0006,
        clearcoat: 0.06,
        clearcoatRoughness: 0.24,
      });
      knurled = new THREE.MeshPhysicalMaterial({
        name: 'bathroom.brass.PF.knurled',
        color: 0xaeaca5,
        metalness: 0.90,
        roughness: 0.37,
        bumpMap: knurlBump,
        bumpScale: 0.0025,
        clearcoat: 0.04,
        clearcoatRoughness: 0.30,
      });
      break;
    }
    case 'BR': {
      // Polished Brass — Perrin & Rowe unlacquered mirror-bright solid brass
      primary = new THREE.MeshPhysicalMaterial({
        name: 'bathroom.brass.BR.primary',
        color: 0xe0b958,
        metalness: 0.96,
        roughness: 0.11,
        clearcoat: 0.18,
        clearcoatRoughness: 0.08,
      });
      knurled = new THREE.MeshPhysicalMaterial({
        name: 'bathroom.brass.BR.knurled',
        color: 0xd9b150,
        metalness: 0.95,
        roughness: 0.19,
        bumpMap: knurlBump,
        bumpScale: 0.0025,
        clearcoat: 0.12,
        clearcoatRoughness: 0.14,
      });
      break;
    }
  }

  const palette: BathroomMetalMaterialPalette = { primary, knurled, darkShadow };
  brassPaletteCache.set(finish, palette);
  return palette;
}

let vitreousChinaCache: THREE.MeshPhysicalMaterial | null = null;
/** High-fire glazed English Vitreous China (`Lefroy Brooks Charterhouse` WC & `RUB-W` basin). */
export function getVitreousChinaMaterial(): THREE.MeshPhysicalMaterial {
  if (!vitreousChinaCache) {
    vitreousChinaCache = new THREE.MeshPhysicalMaterial({
      name: 'bathroom.vitreousChina',
      color: 0xf7f6f2,
      metalness: 0.0,
      roughness: 0.10,
      clearcoat: 0.85,
      clearcoatRoughness: 0.07,
      reflectivity: 0.65,
    });
  }
  return vitreousChinaCache;
}

let acrymiteWhiteCache: THREE.MeshPhysicalMaterial | null = null;
/** Crisp gloss-white reinforced `Acrymite` interior shell of the BC Designs Boat Bath. */
export function getAcrymiteWhiteMaterial(): THREE.MeshPhysicalMaterial {
  if (!acrymiteWhiteCache) {
    acrymiteWhiteCache = new THREE.MeshPhysicalMaterial({
      name: 'bathroom.acrymiteGlossWhite',
      color: 0xfafaf7,
      metalness: 0.0,
      roughness: 0.08,
      clearcoat: 0.92,
      clearcoatRoughness: 0.05,
      reflectivity: 0.7,
    });
  }
  return acrymiteWhiteCache;
}

let burnishedCopperColorMapCache: THREE.DataTexture | null = null;

function getBurnishedCopperColorMap(): THREE.DataTexture {
  if (burnishedCopperColorMapCache) return burnishedCopperColorMapCache;
  const w = 256;
  const h = 256;
  const colorData = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const v = y / h;
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const cloud = seamlessFbm2D(u, v, 3, 3, 2111);
      const sweep = seamlessNoise2D(u, v, 5, 18, 4099);
      // Barely-there warm tonal depth (±3%) so specular copper mirror sheen stays crisp and glossy
      const warmShift = (cloud - 0.5) * 14 + (sweep - 0.5) * 5;
      const idx = (y * w + x) * 4;
      colorData[idx] = clampByte(250 + warmShift * 0.85);
      colorData[idx + 1] = clampByte(247 + warmShift * 0.95);
      colorData[idx + 2] = clampByte(244 + warmShift * 1.05);
      colorData[idx + 3] = 255;
    }
  }
  burnishedCopperColorMapCache = configureDataTexture(
    colorData,
    w,
    h,
    'bathroom.burnishedCopper.color',
    true,
    2,
    1
  );
  return burnishedCopperColorMapCache;
}

let copperMaterialsCache: BurnishedCopperMaterialPalette | null = null;
/** High-lustre burnished mirror-copper exterior hull & warm polished copper plinth for BC Designs Boat Bath. */
export function getBurnishedCopperMaterials(): BurnishedCopperMaterialPalette {
  if (copperMaterialsCache) return copperMaterialsCache;
  const colorModMap = getBurnishedCopperColorMap();
  const shell = new THREE.MeshPhysicalMaterial({
    name: 'bathroom.copperBurnishedShell',
    color: 0xb96539,
    map: colorModMap,
    metalness: 0.90,
    roughness: 0.13,
    clearcoat: 0.42,
    clearcoatRoughness: 0.08,
  });
  const plinth = new THREE.MeshPhysicalMaterial({
    name: 'bathroom.copperPatinatedPlinth',
    color: 0xa4562e,
    map: colorModMap,
    metalness: 0.90,
    roughness: 0.13,
    clearcoat: 0.42,
    clearcoatRoughness: 0.08,
  });
  copperMaterialsCache = { shell, plinth };
  return copperMaterialsCache;
}

let mirostoneMaterialCache: THREE.MeshPhysicalMaterial | null = null;
/** Veined Quartz / Mirostone (`MWFT SN`) 20mm vanity countertop & rear splashback upstand. */
export function getMirostoneQuartzMaterial(): THREE.MeshPhysicalMaterial {
  if (!mirostoneMaterialCache) {
    const maps = getMirostoneQuartzMaps();
    mirostoneMaterialCache = new THREE.MeshPhysicalMaterial({
      name: 'bathroom.mirostoneQuartzMWFTSN',
      color: 0xffffff,
      map: maps.colorMap,
      roughnessMap: maps.roughnessMap,
      metalness: 0.0,
      roughness: 0.20,
      clearcoat: 0.35,
      clearcoatRoughness: 0.12,
    });
  }
  return mirostoneMaterialCache;
}

const wcSeatMatCache = new Map<WcSeatFinish, THREE.MeshPhysicalMaterial>();
export function getWcSeatMaterial(seatFinish: WcSeatFinish): THREE.MeshPhysicalMaterial {
  const existing = wcSeatMatCache.get(seatFinish);
  if (existing) return existing;

  let mat: THREE.MeshPhysicalMaterial;
  if (seatFinish === 'glossWhite') {
    mat = new THREE.MeshPhysicalMaterial({
      name: 'bathroom.wcSeat.glossWhite',
      color: 0xf8f7f3,
      metalness: 0.0,
      roughness: 0.11,
      clearcoat: 0.82,
      clearcoatRoughness: 0.08,
    });
  } else if (seatFinish === 'darkOak') {
    const darkOak = getDarkOakVeneerMaterials();
    const seatColorMap = darkOak.veneer.map!.clone();
    seatColorMap.name = 'bathroom.wcSeat.darkOak.color';
    seatColorMap.repeat.set(1, 1);
    seatColorMap.needsUpdate = true;
    const seatBumpMap = darkOak.veneer.bumpMap!.clone();
    seatBumpMap.name = 'bathroom.wcSeat.darkOak.bump';
    seatBumpMap.repeat.set(1, 1);
    seatBumpMap.needsUpdate = true;
    const seatRoughMap = darkOak.veneer.roughnessMap!.clone();
    seatRoughMap.name = 'bathroom.wcSeat.darkOak.roughness';
    seatRoughMap.repeat.set(1, 1);
    seatRoughMap.needsUpdate = true;
    mat = new THREE.MeshPhysicalMaterial({
      name: 'bathroom.wcSeat.darkOak',
      color: 0xffffff,
      map: seatColorMap,
      bumpMap: seatBumpMap,
      bumpScale: 0.0007,
      roughnessMap: seatRoughMap,
      metalness: 0.0,
      roughness: 0.34,
      clearcoat: 0.38,
      clearcoatRoughness: 0.2,
    });
  } else {
    const maps = getWoodSeatMaps(seatFinish);
    mat = new THREE.MeshPhysicalMaterial({
      name: `bathroom.wcSeat.${seatFinish}`,
      color: 0xffffff,
      map: maps.colorMap,
      bumpMap: maps.bumpMap,
      bumpScale: 0.0009,
      metalness: 0.0,
      roughness: seatFinish === 'walnut' ? 0.28 : 0.33,
      clearcoat: 0.42,
      clearcoatRoughness: 0.18,
    });
  }
  wcSeatMatCache.set(seatFinish, mat);
  return mat;
}

let wcWaterMatCache: THREE.MeshPhysicalMaterial | null = null;
export function getWcWaterSealMaterial(): THREE.MeshPhysicalMaterial {
  if (!wcWaterMatCache) {
    wcWaterMatCache = new THREE.MeshPhysicalMaterial({
      name: 'bathroom.wcWaterSeal',
      color: 0xdceef2,
      metalness: 0.0,
      roughness: 0.04,
      transmission: 0.35,
      transparent: true,
      opacity: 0.74,
      ior: 1.333,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
    });
  }
  return wcWaterMatCache;
}

let tissuePaperMatCache: THREE.MeshStandardMaterial | null = null;
let cardboardCoreMatCache: THREE.MeshStandardMaterial | null = null;

export function getTissuePaperMaterial(): THREE.MeshStandardMaterial {
  if (!tissuePaperMatCache) {
    tissuePaperMatCache = new THREE.MeshStandardMaterial({
      name: 'bathroom.ivoryTissuePaper',
      color: 0xf6f2e8,
      roughness: 0.86,
      metalness: 0.0,
      bumpMap: getTissueCrepeBumpMap(),
      bumpScale: 0.0012,
      side: THREE.DoubleSide,
    });
  }
  return tissuePaperMatCache;
}

export function getCardboardCoreMaterial(): THREE.MeshStandardMaterial {
  if (!cardboardCoreMatCache) {
    cardboardCoreMatCache = new THREE.MeshStandardMaterial({
      name: 'bathroom.tissueCardboardCore',
      color: 0xb59874,
      roughness: 0.88,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });
  }
  return cardboardCoreMatCache;
}

const cabinetMatCache = new Map<string, PaintedCabinetMaterialPalette>();
/** Heritage eggshell painted timber & shadow-reveal accent materials for In-Frame Shaker cabinetry. */
export function getPaintedShakerCabinetMaterials(
  cabinetColorHex: number,
  frameAccentColorHex?: number
): PaintedCabinetMaterialPalette {
  const derivedAccentHex =
    frameAccentColorHex ??
    new THREE.Color(cabinetColorHex).multiplyScalar(0.68).getHex();
  const key = `${cabinetColorHex.toString(16)}:${derivedAccentHex.toString(16)}`;
  const cached = cabinetMatCache.get(key);
  if (cached) return cached;

  const bump = getPaintedTimberBumpMap();
  const cabinet = new THREE.MeshPhysicalMaterial({
    name: `bathroom.campdenShakerPaint.${cabinetColorHex.toString(16)}`,
    color: cabinetColorHex,
    roughness: 0.42,
    metalness: 0.0,
    bumpMap: bump,
    bumpScale: 0.0005,
    clearcoat: 0.08,
    clearcoatRoughness: 0.45,
  });
  const accentReveal = new THREE.MeshStandardMaterial({
    name: `bathroom.campdenShakerReveal.${derivedAccentHex.toString(16)}`,
    color: derivedAccentHex,
    roughness: 0.56,
    metalness: 0.0,
  });

  const palette: PaintedCabinetMaterialPalette = { cabinet, accentReveal };
  cabinetMatCache.set(key, palette);
  return palette;
}

// ---------------------------------------------------------------------------
// Shared Geometry & Scene-Graph Invariant Helpers
// ---------------------------------------------------------------------------

/** Ensures `computeBoundingSphere()` is called on every constructed `BufferGeometry`. */
export function prepGeo<T extends THREE.BufferGeometry>(geo: T): T {
  if (!geo.attributes['normal']) {
    geo.computeVertexNormals();
  }
  geo.computeBoundingSphere();
  return geo;
}

/**
 * Enforces all sanitaryware scene-graph invariants across `root`:
 * - `root.userData.tradeCategory` set cleanly (`'sanitary'` or `'plumbing'`).
 * - Every `BufferGeometry` has a valid `boundingSphere`.
 * - Fine-detail meshes (`boundingSphere.radius < 0.08`) receive `lodTier = 'high'`
 *   and `lodMaxDistance = 12` with `castShadow = false`.
 */
export function finalizeSanitaryGroup(
  root: THREE.Group,
  defaultTradeCategory: 'sanitary' | 'plumbing'
): THREE.Group {
  if (!root.userData['tradeCategory']) {
    root.userData['tradeCategory'] = defaultTradeCategory;
  }
  root.traverse((node) => {
    if ((node instanceof THREE.Mesh || node instanceof THREE.Group) && !node.name) {
      node.name = `${root.name}.part`;
    }
    if (node instanceof THREE.Mesh) {
      const geo = node.geometry as THREE.BufferGeometry;
      if (!geo.boundingSphere) {
        geo.computeBoundingSphere();
      }
      const radius = geo.boundingSphere?.radius ?? 0;
      node.receiveShadow = true;
      if (radius < 0.08) {
        node.userData['lodTier'] = 'high';
        node.userData['lodMaxDistance'] = 12;
        node.castShadow = false;
      } else {
        node.castShadow = true;
      }
    }
  });
  return root;
}

// ---------------------------------------------------------------------------
// Bespoke Master Bathroom Dark Oak Veneer, Carrara Marble & Waffle Textiles
// ---------------------------------------------------------------------------

export interface DarkOakVeneerMaterialPalette {
  readonly veneer: THREE.MeshPhysicalMaterial;
  readonly panelField: THREE.MeshPhysicalMaterial;
  readonly shadowReveal: THREE.MeshStandardMaterial;
}

let darkOakVeneerCache: DarkOakVeneerMaterialPalette | null = null;

/**
 * Rich smoked dark-stained European oak veneer PBR palette (matching Emily's Slide 3 vanity):
 * deep umber-espresso heartwood (#3e2c1e .. #523b29) with warm bronze-brown cathedral grain,
 * open-pore bump relief, and hand-rubbed satin lacquer sheen (~0.46 roughness).
 */
export function getDarkOakVeneerMaterials(): DarkOakVeneerMaterialPalette {
  if (darkOakVeneerCache) return darkOakVeneerCache;

  const w = 256;
  const h = 256;
  const colorData = new Uint8Array(w * h * 4);
  const bumpData = new Uint8Array(w * h * 4);
  const roughData = new Uint8Array(w * h * 4);

  for (let y = 0; y < h; y++) {
    const v = y / h;
    for (let x = 0; x < w; x++) {
      const u = x / w;
      // Straight-grained quarter-sawn fumed/smoked English oak (#38281d .. #463325):
      // fine longitudinal vessel pores along v with minimal lateral drift and delicate medullary rays.
      const subtleDrift = seamlessFbm2D(u, v, 2, 2, 14107);
      const fineFiber = seamlessNoise2D(u, v, 36, 128, 14221);
      const openPore = seamlessNoise2D(u, v, 56, 96, 14519);
      const medullary = seamlessNoise2D(u, v, 44, 16, 14347);
      const straightRing =
        Math.sin((u * 22.0 + (subtleDrift - 0.5) * 0.55) * Math.PI * 2) * 0.5 + 0.5;
      const poreGroove = Math.pow(Math.max(0, 1 - openPore * 1.15), 2.4);
      const rayFleck = Math.pow(medullary, 3.2);

      const grainLift =
        (straightRing - 0.5) * 9 +
        (fineFiber - 0.5) * 11 -
        poreGroove * 13 +
        rayFleck * 7;
      const idx = (y * w + x) * 4;
      colorData[idx] = clampByte(63 + grainLift * 0.98);
      colorData[idx + 1] = clampByte(45 + grainLift * 0.76);
      colorData[idx + 2] = clampByte(33 + grainLift * 0.56);
      colorData[idx + 3] = 255;

      const bByte = clampByte(132 + (fineFiber - 0.5) * 36 - poreGroove * 44);
      bumpData[idx] = bByte;
      bumpData[idx + 1] = bByte;
      bumpData[idx + 2] = bByte;
      bumpData[idx + 3] = 255;

      const rByte = clampByte(218 + poreGroove * 26 + (1 - fineFiber) * 10);
      roughData[idx] = rByte;
      roughData[idx + 1] = rByte;
      roughData[idx + 2] = rByte;
      roughData[idx + 3] = 255;
    }
  }

  const colorMap = configureDataTexture(colorData, w, h, 'bathroom.darkOakVeneer.color', true, 1.5, 1.5);
  const bumpMap = configureDataTexture(bumpData, w, h, 'bathroom.darkOakVeneer.bump', false, 1.5, 1.5);
  const roughnessMap = configureDataTexture(roughData, w, h, 'bathroom.darkOakVeneer.roughness', false, 1.5, 1.5);

  const veneer = new THREE.MeshPhysicalMaterial({
    name: 'bathroom.darkOakVeneer',
    color: 0xffffff,
    map: colorMap,
    bumpMap,
    bumpScale: 0.0014,
    roughnessMap,
    roughness: 0.47,
    metalness: 0.0,
    clearcoat: 0.14,
    clearcoatRoughness: 0.38,
  });

  const panelField = new THREE.MeshPhysicalMaterial({
    name: 'bathroom.darkOakVeneer.panelField',
    color: 0xf4ece4,
    map: colorMap,
    bumpMap,
    bumpScale: 0.0016,
    roughnessMap,
    roughness: 0.50,
    metalness: 0.0,
    clearcoat: 0.12,
    clearcoatRoughness: 0.42,
  });

  const shadowReveal = new THREE.MeshStandardMaterial({
    name: 'bathroom.darkOakVeneer.shadowReveal',
    color: 0x22170f,
    roughness: 0.68,
    metalness: 0.0,
  });

  darkOakVeneerCache = { veneer, panelField, shadowReveal };
  return darkOakVeneerCache;
}

let honedCarraraCache: THREE.MeshPhysicalMaterial | null = null;

/**
 * Honed Italian Bianco Carrara marble countertop & shaped heritage splashback upstand
 * (cool-warm alabaster white ground with feathery soft grey mineral veins).
 */
export function getHonedCarraraMarbleMaterial(): THREE.MeshPhysicalMaterial {
  if (honedCarraraCache) return honedCarraraCache;

  const w = 256;
  const h = 256;
  const colorData = new Uint8Array(w * h * 4);
  const roughData = new Uint8Array(w * h * 4);

  for (let y = 0; y < h; y++) {
    const v = y / h;
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const wx = seamlessFbm2D(u, v, 3, 4, 15101) - 0.5;
      const wy = seamlessFbm2D(u, v, 3, 4, 15217) - 0.5;
      const p1 = ((u + wx * 0.28) * 2.0 + (v + wy * 0.28) * 1.0) * Math.PI * 2;
      const p2 = ((u + wx * 0.22) * 3.0 - (v + wy * 0.22) * 2.0 + 0.41) * Math.PI * 2;
      const veinPrimary = Math.pow(Math.max(0, 1 - Math.abs(Math.sin(p1 * 0.5 + wx * 2.4))), 11);
      const veinFine = Math.pow(Math.max(0, 1 - Math.abs(Math.sin(p2 * 0.5 + wy * 3.0))), 20) * 0.72;
      const cloud = seamlessFbm2D(u, v, 5, 3, 15331);
      const wVein = Math.min(1, veinPrimary * 0.82 + veinFine + Math.max(0, cloud - 0.58) * 0.35);

      const baseR = 243 + (cloud - 0.5) * 8;
      const baseG = 242 + (cloud - 0.5) * 8;
      const baseB = 239 + (cloud - 0.5) * 8;

      const idx = (y * w + x) * 4;
      colorData[idx] = clampByte(baseR * (1 - wVein) + 162 * wVein);
      colorData[idx + 1] = clampByte(baseG * (1 - wVein) + 165 * wVein);
      colorData[idx + 2] = clampByte(baseB * (1 - wVein) + 170 * wVein);
      colorData[idx + 3] = 255;

      const rByte = clampByte(224 + wVein * 24);
      roughData[idx] = rByte;
      roughData[idx + 1] = rByte;
      roughData[idx + 2] = rByte;
      roughData[idx + 3] = 255;
    }
  }

  honedCarraraCache = new THREE.MeshPhysicalMaterial({
    name: 'bathroom.honedCarraraMarble',
    color: 0xffffff,
    map: configureDataTexture(colorData, w, h, 'bathroom.honedCarrara.color', true, 1.4, 1.0),
    roughnessMap: configureDataTexture(roughData, w, h, 'bathroom.honedCarrara.roughness', false, 1.4, 1.0),
    roughness: 0.24,
    metalness: 0.0,
    clearcoat: 0.28,
    clearcoatRoughness: 0.18,
  });
  return honedCarraraCache;
}

let zelligeShowerTileCache: THREE.MeshPhysicalMaterial | null = null;

/**
 * Artisan glazed warm-cream vertical zellige ceramic wall tile material for the enlarged
 * Master Bathroom walk-in shower (matching Slide 3 middle-left swatch).
 */
export function getZelligeCreamWallTileMaterial(): THREE.MeshPhysicalMaterial {
  if (zelligeShowerTileCache) return zelligeShowerTileCache;

  const w = 256;
  const h = 256;
  const colorData = new Uint8Array(w * h * 4);
  const bumpData = new Uint8Array(w * h * 4);
  const cols = 8; // ~75mm narrow vertical tile pitch
  const rows = 4; // ~150mm vertical tile height

  for (let y = 0; y < h; y++) {
    const v = y / h;
    const ry = v * rows;
    const rowIdx = Math.floor(ry);
    const fy = ry - rowIdx;
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const cx = u * cols;
      const colIdx = Math.floor(cx);
      const fx = cx - colIdx;

      const groutX = Math.min(fx, 1 - fx) * (w / cols);
      const groutY = Math.min(fy, 1 - fy) * (h / rows);
      const groutMask = smoothstep(Math.min(1, Math.min(groutX, groutY) / 2.1));

      const tileTone = hash2DPeriodic(colIdx, rowIdx, cols, rows, 16111) - 0.5;
      const handRipple = seamlessFbm2D(u, v, 16, 3, 16223) - 0.5;

      const tileR = 235 + tileTone * 11 + handRipple * 7;
      const tileG = 230 + tileTone * 10 + handRipple * 7;
      const tileB = 219 + tileTone * 10 + handRipple * 6;

      const idx = (y * w + x) * 4;
      colorData[idx] = clampByte(208 * (1 - groutMask) + tileR * groutMask);
      colorData[idx + 1] = clampByte(203 * (1 - groutMask) + tileG * groutMask);
      colorData[idx + 2] = clampByte(193 * (1 - groutMask) + tileB * groutMask);
      colorData[idx + 3] = 255;

      const pillow = Math.sin(fx * Math.PI) * Math.sin(fy * Math.PI);
      const bByte = clampByte(64 * (1 - groutMask) + (142 + pillow * 36 + handRipple * 32) * groutMask);
      bumpData[idx] = bByte;
      bumpData[idx + 1] = bByte;
      bumpData[idx + 2] = bByte;
      bumpData[idx + 3] = 255;
    }
  }

  zelligeShowerTileCache = new THREE.MeshPhysicalMaterial({
    name: 'bathroom.zelligeCreamWallTile',
    color: 0xffffff,
    map: configureDataTexture(colorData, w, h, 'bathroom.zelligeCream.color', true, 2.2, 3.2),
    bumpMap: configureDataTexture(bumpData, w, h, 'bathroom.zelligeCream.bump', false, 2.2, 3.2),
    bumpScale: 0.0018,
    roughness: 0.19,
    metalness: 0.0,
    clearcoat: 0.68,
    clearcoatRoughness: 0.14,
  });
  return zelligeShowerTileCache;
}

let bathroomTextilesCache: {
  readonly ivoryWaffleRobe: THREE.MeshStandardMaterial;
  readonly oatmealWaffleRobe: THREE.MeshStandardMaterial;
  readonly stripedRailTowel: THREE.MeshStandardMaterial;
} | null = null;

/**
 * Tactile honeycomb waffle-weave cotton-linen bathrobe materials & woven ticking-stripe
 * bath towel material (matching Slide 3 right-hand towel rail & #12 hanging robes).
 */
export function getBathroomTextileMaterials(): {
  readonly ivoryWaffleRobe: THREE.MeshStandardMaterial;
  readonly oatmealWaffleRobe: THREE.MeshStandardMaterial;
  readonly stripedRailTowel: THREE.MeshStandardMaterial;
} {
  if (bathroomTextilesCache) return bathroomTextilesCache;

  const w = 128;
  const h = 128;
  const waffleBumpData = new Uint8Array(w * h * 4);
  const stripeColorData = new Uint8Array(w * h * 4);

  for (let y = 0; y < h; y++) {
    const v = y / h;
    // Horizontal woven taupe-grey stripes on warm ivory cotton (matching Slide 3 towel rail photo)
    const stripeCycle = (v * 18) % 1;
    const isStripe = stripeCycle > 0.30 && stripeCycle < 0.56 ? 1 : 0;
    const slub = seamlessNoise2D(0.5, v, 4, 64, 17107) - 0.5;
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const cellX = Math.abs(((u * 32) % 1) - 0.5) * 2;
      const cellY = Math.abs(((v * 32) % 1) - 0.5) * 2;
      const waffle = Math.max(cellX, cellY);
      const yarn = seamlessNoise2D(u, v, 64, 64, 17209) - 0.5;
      const bByte = clampByte(92 + waffle * 124 + yarn * 26);

      const idx = (y * w + x) * 4;
      waffleBumpData[idx] = bByte;
      waffleBumpData[idx + 1] = bByte;
      waffleBumpData[idx + 2] = bByte;
      waffleBumpData[idx + 3] = 255;

      const creamR = 242 + yarn * 8 + slub * 6;
      const creamG = 238 + yarn * 8 + slub * 6;
      const creamB = 229 + yarn * 8 + slub * 6;
      const stripeR = 160 + yarn * 10;
      const stripeG = 156 + yarn * 10;
      const stripeB = 149 + yarn * 10;
      // Leave crisp solid cream borders near top/bottom hem
      const inBand = v > 0.08 && v < 0.92 ? isStripe : 0;
      stripeColorData[idx] = clampByte(creamR * (1 - inBand) + stripeR * inBand);
      stripeColorData[idx + 1] = clampByte(creamG * (1 - inBand) + stripeG * inBand);
      stripeColorData[idx + 2] = clampByte(creamB * (1 - inBand) + stripeB * inBand);
      stripeColorData[idx + 3] = 255;
    }
  }

  const waffleBump = configureDataTexture(waffleBumpData, w, h, 'bathroom.waffleLinen.bump', false, 4, 6);
  const stripeMap = configureDataTexture(stripeColorData, w, h, 'bathroom.stripedTowel.color', true, 1, 2);

  bathroomTextilesCache = {
    ivoryWaffleRobe: new THREE.MeshStandardMaterial({
      name: 'bathroom.waffleRobe.warmIvory',
      color: 0xe2d7c5,
      bumpMap: waffleBump,
      bumpScale: 0.0028,
      roughness: 0.89,
      metalness: 0.0,
      side: THREE.DoubleSide,
    }),
    oatmealWaffleRobe: new THREE.MeshStandardMaterial({
      name: 'bathroom.waffleRobe.naturalOatmeal',
      color: 0xd2c4ae,
      bumpMap: waffleBump,
      bumpScale: 0.0028,
      roughness: 0.90,
      metalness: 0.0,
      side: THREE.DoubleSide,
    }),
    stripedRailTowel: new THREE.MeshStandardMaterial({
      name: 'bathroom.stripedCottonTowel',
      color: 0xffffff,
      map: stripeMap,
      bumpMap: waffleBump,
      bumpScale: 0.0018,
      roughness: 0.87,
      metalness: 0.0,
      side: THREE.DoubleSide,
    }),
  };
  return bathroomTextilesCache;
}
