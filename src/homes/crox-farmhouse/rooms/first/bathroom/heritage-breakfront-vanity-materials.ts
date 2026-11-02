import * as THREE from 'three';

export interface HeritageSmokedOakPalette {
  readonly verticalGrain: THREE.MeshPhysicalMaterial;
  readonly horizontalGrain: THREE.MeshPhysicalMaterial;
  readonly panelField: THREE.MeshPhysicalMaterial;
  readonly shadowReveal: THREE.MeshStandardMaterial;
}

export interface HeritageVanityMaterialSuite {
  readonly oak: HeritageSmokedOakPalette;
  readonly taupeMarble: THREE.MeshPhysicalMaterial;
  readonly reededMirrorBrass: THREE.MeshStandardMaterial;
  readonly floralKnobBrass: THREE.MeshStandardMaterial;
  readonly mirrorGlass: THREE.MeshPhysicalMaterial;
  readonly mirrorBevelGlass: THREE.MeshPhysicalMaterial;
  readonly pleatedSageShade: THREE.MeshStandardMaterial;
  readonly warmCandleBulb: THREE.MeshStandardMaterial;
  readonly boiserieMoulding: THREE.MeshStandardMaterial;
  readonly deepPileBathMat: THREE.MeshPhysicalMaterial;
  readonly deepPileBathMatHem: THREE.MeshPhysicalMaterial;
  readonly bathMatContactShadow: THREE.MeshBasicMaterial;
}

let cachedSuite: HeritageVanityMaterialSuite | null = null;

function clampByte(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
}

function hash2D(ix: number, iy: number, seed: number): number {
  let h = (ix * 374761393 + iy * 668265263 + seed * 1442695041) | 0;
  h = ((h ^ (h >>> 13)) * 1274126177) | 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function periodicNoise2D(u: number, v: number, freqU: number, freqV: number, seed: number): number {
  const x = ((u % 1) + 1) % 1 * freqU;
  const y = ((v % 1) + 1) % 1 * freqV;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = smoothstep(x - x0);
  const ty = smoothstep(y - y0);

  const ix0 = ((x0 % freqU) + freqU) % freqU;
  const ix1 = (ix0 + 1) % freqU;
  const iy0 = ((y0 % freqV) + freqV) % freqV;
  const iy1 = (iy0 + 1) % freqV;

  const n00 = hash2D(ix0, iy0, seed);
  const n10 = hash2D(ix1, iy0, seed);
  const n01 = hash2D(ix0, iy1, seed);
  const n11 = hash2D(ix1, iy1, seed);

  const nx0 = n00 + (n10 - n00) * tx;
  const nx1 = n01 + (n11 - n01) * tx;
  return nx0 + (nx1 - nx0) * ty;
}

function periodicFbm2D(
  u: number,
  v: number,
  baseFreqU: number,
  baseFreqV: number,
  octaves: number,
  seed: number
): number {
  let sum = 0;
  let amp = 0.5;
  let norm = 0;
  let fu = baseFreqU;
  let fv = baseFreqV;
  for (let i = 0; i < octaves; i++) {
    sum += amp * periodicNoise2D(u, v, fu, fv, seed + i * 977);
    norm += amp;
    amp *= 0.5;
    fu *= 2;
    fv *= 2;
  }
  return sum / norm;
}

function makeDataTexture(
  data: Uint8Array,
  w: number,
  h: number,
  name: string,
  srgb: boolean,
  repeatU = 1,
  repeatV = 1
): THREE.DataTexture {
  const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  tex.name = name;
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatU, repeatV);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.anisotropy = 8;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates weathered smoked medium-dark brown-taupe European oak textures (`~#58493e` – `#69584a`
 * midtones, `#463930` deep earlywood pores & moulding crevices, and `#7b6a5c` silvery-taupe
 * cathedral grain & open-pore highlights, zero orange/red tint — matching `ref1.jpg` & `ref3.jpg`).
 * When `vertical = true`, wood fibers run along `v` (`+Y` in Three.js BoxGeometry vertical faces).
 */
function buildSmokedOakMaps(vertical: boolean): {
  colorMap: THREE.DataTexture;
  bumpMap: THREE.DataTexture;
  roughnessMap: THREE.DataTexture;
} {
  const w = 1024;
  const h = 1024;
  const colorData = new Uint8Array(w * h * 4);
  const bumpData = new Uint8Array(w * h * 4);
  const roughData = new Uint8Array(w * h * 4);

  for (let py = 0; py < h; py++) {
    const vRaw = py / h;
    for (let px = 0; px < w; px++) {
      const uRaw = px / w;
      const across = vertical ? uRaw : vRaw;
      const along = vertical ? vRaw : uRaw;

      const drift = periodicFbm2D(across, along, 3, 2, 3, 31013) - 0.5;
      const cathedral =
        Math.sin((across * 13.0 + drift * 1.55 + Math.sin(along * Math.PI * 2) * 0.12) * Math.PI * 2) *
          0.5 +
        0.5;
      const fineFiber = periodicNoise2D(across, along, 180, 36, 31193);
      const vesselNoise = periodicNoise2D(across, along, 240, 44, 31337);
      const silverPore = Math.pow(Math.max(0, vesselNoise - 0.54) / 0.46, 1.55);
      const darkVessel = Math.pow(Math.max(0, 0.39 - vesselNoise) / 0.39, 1.7);
      const rayFleck = Math.pow(periodicNoise2D(across, along, 96, 16, 31721), 3.4);

      // Warm weathered smoked medium-dark brown-taupe oak: calibrated for Room 17's warm 2700K
      // lighting + ACESFilmic tone mapping so rendered cabinetry lands ~17% lighter than espresso
      // right at `#645447`–`#705e50` (deep crevices `#463930`, silvery-taupe grain `#7b6a5c`, zero orange cast):
      const baseR = 76 + (cathedral - 0.5) * 14 + (fineFiber - 0.5) * 12;
      const baseG = 66 + (cathedral - 0.5) * 12.5 + (fineFiber - 0.5) * 10.8;
      const baseB = 58 + (cathedral - 0.5) * 11.5 + (fineFiber - 0.5) * 9.8;

      // Crisp open-pore silvery-taupe grain highlights (#7b6a5c) + #463930 deep earlywood pores
      const r = baseR + silverPore * 29 + rayFleck * 13 - darkVessel * 22;
      const g = baseG + silverPore * 27 + rayFleck * 12 - darkVessel * 20;
      const b = baseB + silverPore * 25 + rayFleck * 11 - darkVessel * 18;

      const idx = (py * w + px) * 4;
      colorData[idx] = clampByte(r);
      colorData[idx + 1] = clampByte(g);
      colorData[idx + 2] = clampByte(b);
      colorData[idx + 3] = 255;

      const bump = clampByte(138 + (fineFiber - 0.5) * 40 - darkVessel * 66 - silverPore * 36);
      bumpData[idx] = bump;
      bumpData[idx + 1] = bump;
      bumpData[idx + 2] = bump;
      bumpData[idx + 3] = 255;

      const rough = clampByte(116 + darkVessel * 38 + silverPore * 22 + (0.5 - fineFiber) * 16);
      roughData[idx] = rough;
      roughData[idx + 1] = rough;
      roughData[idx + 2] = rough;
      roughData[idx + 3] = 255;
    }
  }

  const tag = vertical ? 'vertical' : 'horizontal';
  return {
    colorMap: makeDataTexture(colorData, w, h, `heritage.smokedOak.${tag}.color`, true, 1.15, 1.15),
    bumpMap: makeDataTexture(bumpData, w, h, `heritage.smokedOak.${tag}.bump`, false, 1.15, 1.15),
    roughnessMap: makeDataTexture(
      roughData,
      w,
      h,
      `heritage.smokedOak.${tag}.roughness`,
      false,
      1.15,
      1.15
    ),
  };
}

/**
 * Procedural `1024×1024` honed/satin Grigio-Taupe / Smoked Emperador veined marble
 * matching `ref1.jpg`, `ref2.jpg`, `ref3.jpg`: rich warm taupe-grey breccia matrix (`#645a52` – `#786d64`)
 * laced with crisp branching creamy-white `#efeae2` calcite veins & `#463f3a` mineral pockets.
 */
function buildTaupeMarbleMaterial(): THREE.MeshPhysicalMaterial {
  const size = 1024;
  const colorData = new Uint8Array(size * size * 4);
  const bumpData = new Uint8Array(size * size * 4);
  const roughData = new Uint8Array(size * size * 4);

  for (let py = 0; py < size; py++) {
    const v = py / size;
    for (let px = 0; px < size; px++) {
      const u = px / size;

      const wx = periodicFbm2D(u, v, 4, 4, 5, 41117) - 0.5;
      const wy = periodicFbm2D(u, v, 4, 4, 5, 41389) - 0.5;
      const wx2 = periodicFbm2D(u + 0.37, v + 0.19, 10, 10, 4, 41611) - 0.5;
      const wy2 = periodicFbm2D(u + 0.11, v + 0.63, 10, 10, 4, 41893) - 0.5;

      const breccia = periodicFbm2D(u + wx * 0.28, v + wy * 0.28, 5, 5, 4, 42131);
      const fineMottle = periodicFbm2D(u + wx2 * 0.14, v + wy2 * 0.14, 16, 16, 3, 42407);

      // Branching mineral vein networks (sharp ridged-multifractal style calcite veins!)
      const pA = ((u + wx * 0.42 + wx2 * 0.11) * 2.0 + (v + wy * 0.42 + wy2 * 0.11) * 1.0) * Math.PI * 2;
      const pB = ((u + wx * 0.32 - wx2 * 0.09) * 1.0 - (v + wy * 0.35 + wy2 * 0.09) * 3.0 + 0.9) * Math.PI * 2;
      const pC = ((u + wx2 * 0.25) * 4.0 + (v + wy2 * 0.25) * 3.0 + 1.8) * Math.PI * 2;

      const rA = 1 - Math.abs(Math.sin(pA * 0.5));
      const rB = 1 - Math.abs(Math.sin(pB * 0.5));
      const rC = 1 - Math.abs(Math.sin(pC * 0.5));

      const sharpVein1 = Math.pow(Math.max(0, rA), 34) * (0.65 + 0.35 * fineMottle);
      const sharpVein2 = Math.pow(Math.max(0, rB), 42) * 0.85;
      const fineCapillary = Math.pow(Math.max(0, rC), 52) * 0.58;
      const brecciaHalo = Math.pow(Math.max(0, rA), 7.5) * 0.22 * Math.max(0, fineMottle - 0.25);
      const darkStylolite = Math.pow(Math.max(0, 1 - Math.abs(Math.cos(pB * 0.5))), 38) * 0.72;

      const whiteMix = Math.min(1, sharpVein1 + sharpVein2 + fineCapillary + brecciaHalo);
      const umberPocket = Math.max(0, 0.54 - breccia) * 1.45;

      // Rich Grigio-Taupe stone matrix (#6d625a -> #48403b pockets -> #efe9e0 calcite veins)
      let r = 110 + (fineMottle - 0.5) * 22 - umberPocket * 34 - darkStylolite * 32;
      let g = 99 + (fineMottle - 0.5) * 20 - umberPocket * 31 - darkStylolite * 29;
      let b = 91 + (fineMottle - 0.5) * 18 - umberPocket * 28 - darkStylolite * 27;

      r = r + (240 - r) * whiteMix;
      g = g + (234 - g) * whiteMix;
      b = b + (225 - b) * whiteMix;

      const idx = (py * size + px) * 4;
      colorData[idx] = clampByte(r);
      colorData[idx + 1] = clampByte(g);
      colorData[idx + 2] = clampByte(b);
      colorData[idx + 3] = 255;

      const bump = clampByte(128 + whiteMix * 18 - darkStylolite * 26 + (fineMottle - 0.5) * 12);
      bumpData[idx] = bump;
      bumpData[idx + 1] = bump;
      bumpData[idx + 2] = bump;
      bumpData[idx + 3] = 255;

      const rough = clampByte(68 + (1 - fineMottle) * 22 + darkStylolite * 26 - whiteMix * 12);
      roughData[idx] = rough;
      roughData[idx + 1] = rough;
      roughData[idx + 2] = rough;
      roughData[idx + 3] = 255;
    }
  }

  return new THREE.MeshPhysicalMaterial({
    name: 'heritage.grigioTaupeMarble',
    color: 0xffffff,
    map: makeDataTexture(colorData, size, size, 'heritage.grigioTaupeMarble.color', true, 1, 1),
    bumpMap: makeDataTexture(bumpData, size, size, 'heritage.grigioTaupeMarble.bump', false, 1, 1),
    bumpScale: 0.0008,
    roughnessMap: makeDataTexture(
      roughData,
      size,
      size,
      'heritage.grigioTaupeMarble.roughness',
      false,
      1,
      1
    ),
    roughness: 0.27,
    metalness: 0.0,
    clearcoat: 0.24,
    clearcoatRoughness: 0.2,
  });
}

/**
 * Gathered sage-celadon linen/silk pleated empire shade texture (`ref1.jpg` & `ref3.jpg`),
 * complete with the woven decorative geometric ribbon trim near the bottom hem.
 */
function buildPleatedSageShadeMaterial(): THREE.MeshStandardMaterial {
  const w = 512;
  const h = 256;
  const data = new Uint8Array(w * h * 4);

  for (let py = 0; py < h; py++) {
    const v = py / h; // 0 = bottom hem, 1 = top ring
    for (let px = 0; px < w; px++) {
      const u = px / w;
      const slub = periodicNoise2D(u, v, 128, 48, 51131) - 0.5;
      const pleatMicro = Math.sin(u * 88 * Math.PI * 2) * 0.5 + 0.5;

      // Sage-celadon woven linen (#7c958b)
      let r = 123 + slub * 10 + (pleatMicro - 0.5) * 7;
      let g = 149 + slub * 10 + (pleatMicro - 0.5) * 8;
      let b = 139 + slub * 9 + (pleatMicro - 0.5) * 7;

      // Woven decorative ribbon border near bottom hem (v in [0.065, 0.205]) matching ref3.jpg!
      if (v >= 0.065 && v <= 0.205) {
        const bandT = (v - 0.065) / 0.14;
        const edgePiping = bandT < 0.12 || bandT > 0.88;
        const diamond =
          Math.abs(((u * 36) % 1) - 0.5) + Math.abs(bandT - 0.5) < 0.42;
        if (edgePiping) {
          r = 198 + slub * 8;
          g = 204 + slub * 8;
          b = 192 + slub * 8;
        } else if (diamond) {
          r = 95 + slub * 8;
          g = 121 + slub * 8;
          b = 113 + slub * 8;
        } else {
          r = 166 + slub * 8;
          g = 180 + slub * 8;
          b = 171 + slub * 8;
        }
      }

      const idx = (py * w + px) * 4;
      data[idx] = clampByte(r);
      data[idx + 1] = clampByte(g);
      data[idx + 2] = clampByte(b);
      data[idx + 3] = 255;
    }
  }

  return new THREE.MeshStandardMaterial({
    name: 'heritage.pleatedSageCeladonShade',
    color: 0xffffff,
    map: makeDataTexture(data, w, h, 'heritage.pleatedSageCeladonShade.color', true, 1, 1),
    emissive: new THREE.Color(0xffd394),
    emissiveIntensity: 0.24,
    roughness: 0.72,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
}


/**
 * Procedural `512×512` high-pile 100% cotton cut-tuft `Dove Grey` bath mat material
 * (`John Lewis Micro-Fresh Extra Large Deep Pile Bath Mat, Dove Grey, Code 60029302 / SKU 238474741, p4852123`,
 * earthy mid-tone pebble / sage-taupe `#8C948B`–`#90988D`: `#868E85`–`#8F978D` midtone in texture space,
 * `#6B736A` deep cut-pile tuft shadows, `#A3ABA1` soft cotton tuft tips, `roughness: 0.96`, plus a soft
 * feathered perimeter floor contact shadow under the `20mm` cotton edge).
 */
function buildDeepPileDoveGreyBathMatMaterials(): {
  pile: THREE.MeshPhysicalMaterial;
  hem: THREE.MeshPhysicalMaterial;
  contactShadow: THREE.MeshBasicMaterial;
} {
  const size = 512;
  const heightField = new Float32Array(size * size);
  const colorData = new Uint8Array(size * size * 4);
  const bumpData = new Uint8Array(size * size * 4);
  const roughData = new Uint8Array(size * size * 4);
  const normalData = new Uint8Array(size * size * 4);

  const cellsX = 76;
  const cellsY = 76;

  for (let py = 0; py < size; py++) {
    const v = py / size;
    const cyFloat = v * cellsY;
    const cy0 = Math.floor(cyFloat);
    for (let px = 0; px < size; px++) {
      const u = px / size;
      const cxFloat = u * cellsX;
      const cx0 = Math.floor(cxFloat);

      // Dense 100% cotton cut-tuft pile clusters
      let bestD2 = 999;
      let secondD2 = 999;
      let bestTone = 0.5;
      for (let dy = -1; dy <= 1; dy++) {
        const iy = ((cy0 + dy) % cellsY + cellsY) % cellsY;
        for (let dx = -1; dx <= 1; dx++) {
          const ix = ((cx0 + dx) % cellsX + cellsX) % cellsX;
          const jx = (hash2D(ix, iy, 61001) - 0.5) * 0.84;
          const jy = (hash2D(ix, iy, 61213) - 0.5) * 0.84;
          const rx = cx0 + dx + 0.5 + jx - cxFloat;
          const ry = cy0 + dy + 0.5 + jy - cyFloat;
          const d2 = rx * rx + ry * ry;
          if (d2 < bestD2) {
            secondD2 = bestD2;
            bestD2 = d2;
            bestTone = hash2D(ix, iy, 61547);
          } else if (d2 < secondD2) {
            secondD2 = d2;
          }
        }
      }

      const d = Math.sqrt(bestD2);
      const edgeGap = Math.max(0, Math.sqrt(secondD2) - d);
      const crown = Math.max(0, 1 - Math.pow(Math.min(1, d / 0.62), 1.55));
      const crevice = 1 - Math.min(1, edgeGap / 0.28);
      const cottonFiber = periodicNoise2D(u, v, 240, 240, 61909) - 0.5;
      const napDrift = periodicFbm2D(u, v, 6, 6, 3, 62233) - 0.5;

      const hVal = Math.max(
        0,
        Math.min(1, crown * 0.82 - crevice * 0.28 + cottonFiber * 0.17 + napDrift * 0.15 + 0.16)
      );
      heightField[py * size + px] = hVal;

      // Sampled Official John Lewis `Dove Grey` (Code 60029302 / p4852123) swatch:
      // Calibrated for Room 17's warm illumination + ACESFilmic so rendered pile lands right at
      // `#8C948B`–`#90988D` earthy pebble / sage-taupe (`L* ≈ 61`) with `#6B736A` tuft shadows & `#A3ABA1` tips:
      const tuftVar = (bestTone - 0.5) * 12 + napDrift * 9 + cottonFiber * 7;
      const r = 82 + hVal * 53 + tuftVar;
      const g = 88 + hVal * 54 + tuftVar;
      const b = 86 + hVal * 53 + tuftVar * 0.97;

      const idx = (py * size + px) * 4;
      colorData[idx] = clampByte(r);
      colorData[idx + 1] = clampByte(g);
      colorData[idx + 2] = clampByte(b);
      colorData[idx + 3] = 255;

      const bump = clampByte(hVal * 255);
      bumpData[idx] = bump;
      bumpData[idx + 1] = bump;
      bumpData[idx + 2] = bump;
      bumpData[idx + 3] = 255;

      const rough = clampByte(253 - hVal * 12);
      roughData[idx] = rough;
      roughData[idx + 1] = rough;
      roughData[idx + 2] = rough;
      roughData[idx + 3] = 255;
    }
  }

  const strength = 4.2;
  for (let py = 0; py < size; py++) {
    const pyPrev = (py - 1 + size) % size;
    const pyNext = (py + 1) % size;
    for (let px = 0; px < size; px++) {
      const pxPrev = (px - 1 + size) % size;
      const pxNext = (px + 1) % size;
      const dX = (heightField[py * size + pxNext]! - heightField[py * size + pxPrev]!) * strength;
      const dY = (heightField[pyNext * size + px]! - heightField[pyPrev * size + px]!) * strength;
      const nx = -dX;
      const ny = -dY;
      const nz = 1.0;
      const invLen = 1 / Math.hypot(nx, ny, nz);
      const idx = (py * size + px) * 4;
      normalData[idx] = clampByte((nx * invLen * 0.5 + 0.5) * 255);
      normalData[idx + 1] = clampByte((ny * invLen * 0.5 + 0.5) * 255);
      normalData[idx + 2] = clampByte((nz * invLen * 0.5 + 0.5) * 255);
      normalData[idx + 3] = 255;
    }
  }

  const pileColor = makeDataTexture(
    colorData,
    size,
    size,
    'heritage.johnLewisDeepPileDoveGrey.color',
    true,
    2.8,
    2.8
  );
  const pileNormal = makeDataTexture(
    normalData,
    size,
    size,
    'heritage.johnLewisDeepPileDoveGrey.normal',
    false,
    2.8,
    2.8
  );
  const pileBump = makeDataTexture(
    bumpData,
    size,
    size,
    'heritage.johnLewisDeepPileDoveGrey.bump',
    false,
    2.8,
    2.8
  );
  const pileRough = makeDataTexture(
    roughData,
    size,
    size,
    'heritage.johnLewisDeepPileDoveGrey.roughness',
    false,
    2.8,
    2.8
  );

  // Woven 100% cotton bound edge tape in matching Dove Grey (#7B837A)
  const hemW = 128;
  const hemData = new Uint8Array(hemW * hemW * 4);
  for (let py = 0; py < hemW; py++) {
    const v = py / hemW;
    for (let px = 0; px < hemW; px++) {
      const u = px / hemW;
      const weave =
        (Math.sin(u * 48 * Math.PI * 2) * 0.5 + 0.5) * 0.5 +
        (Math.sin(v * 48 * Math.PI * 2) * 0.5 + 0.5) * 0.5;
      const slub = periodicNoise2D(u, v, 32, 32, 62911) - 0.5;
      const idx = (py * hemW + px) * 4;
      hemData[idx] = clampByte(96 + (weave - 0.5) * 11 + slub * 8);
      hemData[idx + 1] = clampByte(102 + (weave - 0.5) * 11 + slub * 8);
      hemData[idx + 2] = clampByte(100 + (weave - 0.5) * 10 + slub * 7);
      hemData[idx + 3] = 255;
    }
  }

  // Soft perimeter grounding floor contact shadow for the 140 × 70cm mat (+32mm feather margin per side)
  const shW = 192;
  const shH = 384;
  const shData = new Uint8Array(shW * shH * 4);
  const matHalfX = 0.35;
  const matHalfZ = 0.7;
  const shadowMargin = 0.036;
  const planeSpanX = (matHalfX + shadowMargin) * 2; // 0.772m
  const planeSpanZ = (matHalfZ + shadowMargin) * 2; // 1.472m
  const cornerR = 0.008;

  for (let py = 0; py < shH; py++) {
    const lz = ((py + 0.5) / shH - 0.5) * planeSpanZ;
    for (let px = 0; px < shW; px++) {
      const lx = ((px + 0.5) / shW - 0.5) * planeSpanX;
      const qx = Math.abs(lx) - (matHalfX - cornerR);
      const qz = Math.abs(lz) - (matHalfZ - cornerR);
      const outDist =
        Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0) - cornerR;

      let alpha = 0;
      if (outDist <= 0) {
        alpha = 0.52;
      } else if (outDist < shadowMargin) {
        const t = 1 - outDist / shadowMargin;
        alpha = 0.42 * Math.pow(smoothstep(t), 1.55);
      }

      const idx = (py * shW + px) * 4;
      // Warm limestone-umbra shadow tint (#35312B) so contact shadow grounds the 20mm cotton edge cleanly
      shData[idx] = 53;
      shData[idx + 1] = 49;
      shData[idx + 2] = 43;
      shData[idx + 3] = clampByte(alpha * 255);
    }
  }

  const shadowTex = new THREE.DataTexture(shData, shW, shH, THREE.RGBAFormat);
  shadowTex.name = 'heritage.johnLewisDeepPileDoveGrey.contactShadow';
  shadowTex.colorSpace = THREE.SRGBColorSpace;
  shadowTex.wrapS = THREE.ClampToEdgeWrapping;
  shadowTex.wrapT = THREE.ClampToEdgeWrapping;
  shadowTex.magFilter = THREE.LinearFilter;
  shadowTex.minFilter = THREE.LinearFilter;
  shadowTex.needsUpdate = true;

  return {
    pile: new THREE.MeshPhysicalMaterial({
      name: 'heritage.johnLewisDeepPileDoveGrey',
      color: 0xffffff,
      vertexColors: true,
      map: pileColor,
      normalMap: pileNormal,
      normalScale: new THREE.Vector2(1.55, 1.55),
      bumpMap: pileBump,
      bumpScale: 0.0085,
      roughnessMap: pileRough,
      roughness: 0.96,
      metalness: 0.0,
      envMapIntensity: 0.45,
      sheen: 0.14,
      sheenRoughness: 0.96,
      sheenColor: new THREE.Color(0x9aa199),
    }),
    hem: new THREE.MeshPhysicalMaterial({
      name: 'heritage.johnLewisDeepPileDoveGreyHem',
      color: 0xffffff,
      map: makeDataTexture(hemData, hemW, hemW, 'heritage.johnLewisDeepPileDoveGreyHem.color', true, 8, 8),
      roughness: 0.95,
      metalness: 0.0,
      sheen: 0.18,
      sheenRoughness: 0.95,
      sheenColor: new THREE.Color(0x9aa298),
    }),
    contactShadow: new THREE.MeshBasicMaterial({
      name: 'heritage.johnLewisDeepPileDoveGreyContactShadow',
      color: 0xffffff,
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -2,
    }),
  };
}

export function getHeritageVanityMaterialSuite(): HeritageVanityMaterialSuite {
  if (cachedSuite) return cachedSuite;

  const vertOak = buildSmokedOakMaps(true);
  const horizOak = buildSmokedOakMaps(false);

  const verticalGrain = new THREE.MeshPhysicalMaterial({
    name: 'heritage.smokedDarkOak.vertical',
    color: 0xffffff,
    map: vertOak.colorMap,
    bumpMap: vertOak.bumpMap,
    bumpScale: 0.0024,
    roughnessMap: vertOak.roughnessMap,
    roughness: 0.56,
    metalness: 0.0,
    envMapIntensity: 0.55,
    clearcoat: 0.05,
    clearcoatRoughness: 0.56,
  });

  const horizontalGrain = new THREE.MeshPhysicalMaterial({
    name: 'heritage.smokedDarkOak.horizontal',
    color: 0xffffff,
    map: horizOak.colorMap,
    bumpMap: horizOak.bumpMap,
    bumpScale: 0.0024,
    roughnessMap: horizOak.roughnessMap,
    roughness: 0.56,
    metalness: 0.0,
    envMapIntensity: 0.55,
    clearcoat: 0.05,
    clearcoatRoughness: 0.56,
  });

  const panelField = new THREE.MeshPhysicalMaterial({
    name: 'heritage.smokedDarkOak.panelField',
    color: 0xf5f3f1,
    map: vertOak.colorMap,
    bumpMap: vertOak.bumpMap,
    bumpScale: 0.0026,
    roughnessMap: vertOak.roughnessMap,
    roughness: 0.58,
    metalness: 0.0,
    envMapIntensity: 0.52,
    clearcoat: 0.04,
    clearcoatRoughness: 0.58,
  });

  const shadowReveal = new THREE.MeshStandardMaterial({
    name: 'heritage.smokedDarkOak.shadowReveal',
    color: 0x2c231d,
    roughness: 0.76,
    metalness: 0.0,
  });

  cachedSuite = {
    oak: {
      verticalGrain,
      horizontalGrain,
      panelField,
      shadowReveal,
    },
    taupeMarble: buildTaupeMarbleMaterial(),
    reededMirrorBrass: new THREE.MeshStandardMaterial({
      name: 'heritage.reededChampagneBrass',
      color: 0xceb079,
      roughness: 0.27,
      metalness: 0.85,
    }),
    floralKnobBrass: new THREE.MeshStandardMaterial({
      name: 'heritage.floralRosetteBrass',
      color: 0xc9a96d,
      roughness: 0.3,
      metalness: 0.84,
    }),
    mirrorGlass: new THREE.MeshPhysicalMaterial({
      name: 'heritage.mirrorPlateSilver',
      color: 0xf3f5f6,
      metalness: 0.96,
      roughness: 0.035,
      clearcoat: 1.0,
      clearcoatRoughness: 0.025,
    }),
    mirrorBevelGlass: new THREE.MeshPhysicalMaterial({
      name: 'heritage.mirrorBevelSilver',
      color: 0xe9edf0,
      metalness: 0.92,
      roughness: 0.07,
      clearcoat: 1.0,
      clearcoatRoughness: 0.04,
    }),
    pleatedSageShade: buildPleatedSageShadeMaterial(),
    warmCandleBulb: new THREE.MeshStandardMaterial({
      name: 'heritage.sconceWarmCandleGlow',
      color: 0xfff4df,
      emissive: new THREE.Color(0xffcf87),
      emissiveIntensity: 1.45,
      roughness: 0.25,
    }),
    boiserieMoulding: new THREE.MeshStandardMaterial({
      name: 'heritage.wimborneWhiteBoiserie',
      color: 0xf7f4ec,
      roughness: 0.42,
      metalness: 0.02,
    }),
    ...(() => {
      const bathMatMats = buildDeepPileDoveGreyBathMatMaterials();
      return {
        deepPileBathMat: bathMatMats.pile,
        deepPileBathMatHem: bathMatMats.hem,
        bathMatContactShadow: bathMatMats.contactShadow,
      };
    })(),
  };

  return cachedSuite;
}

/**
 * Projects world-or-local box UVs onto any marble `BufferGeometry` so veins flow naturally across
 * horizontal decks, moulded front/side bullnoses, basin cutout walls, and vertical S-curve splashbacks.
 */
export function applyMarbleWorldUVs(
  geo: THREE.BufferGeometry,
  uvPerMeter = 1.05,
  uOffset = 0,
  vOffset = 0
): THREE.BufferGeometry {
  const nonIdx = geo.index ? geo.toNonIndexed() : geo;
  nonIdx.computeVertexNormals();
  const pos = nonIdx.getAttribute('position') as THREE.BufferAttribute;
  const norm = nonIdx.getAttribute('normal') as THREE.BufferAttribute;
  const uvs = new Float32Array(pos.count * 2);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const nx = Math.abs(norm.getX(i));
    const ny = Math.abs(norm.getY(i));
    const nz = Math.abs(norm.getZ(i));

    let u: number;
    let v: number;
    if (ny >= nx && ny >= nz) {
      // Horizontal countertop deck / underside: flow main length along Z, depth along X
      u = z * uvPerMeter + uOffset;
      v = x * uvPerMeter + vOffset;
    } else if (nx >= nz) {
      // East-facing splashback & front bullnose: flow length along Z, height along Y
      u = z * uvPerMeter + uOffset;
      v = y * uvPerMeter + vOffset;
    } else {
      // North/South end returns & step cheeks: flow depth along X, height along Y
      u = x * uvPerMeter + uOffset;
      v = y * uvPerMeter + vOffset;
    }
    uvs[i * 2] = u;
    uvs[i * 2 + 1] = v;
  }

  nonIdx.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  nonIdx.computeBoundingBox();
  nonIdx.computeBoundingSphere();
  return nonIdx;
}
