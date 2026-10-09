import * as THREE from 'three';
import type { EnvPresetConfig } from './env-presets.ts';

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function configureEquirect(tex: THREE.Texture): void {
  tex.colorSpace = THREE.LinearSRGBColorSpace;
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.flipY = true;
  tex.needsUpdate = true;
}

/**
 * Bakes a small Float32 equirectangular English-countryside sky (gradient dome, horizon glow, soft
 * cloud bands, hedgerow silhouette, sun / moon disc at the preset's HDR sun position) so frame 0
 * has a plausible sky and IBL before the 2K `.hdr` streams in.
 */
export function bakeProceduralSky(cfg: EnvPresetConfig, width = 512, height = 256): THREE.DataTexture {
  const zenithCol = new THREE.Color(cfg.skyZenith);
  const horizonCol = new THREE.Color(cfg.skyHorizon);
  const glowCol = new THREE.Color(cfg.horizonGlow);
  const pastureCol = new THREE.Color(cfg.groundPasture);
  const groundCol = new THREE.Color(cfg.groundBounce);
  const sunCol = new THREE.Color(cfg.sunOrbColor);
  const tmpCol = new THREE.Color();

  const data = new Float32Array(width * height * 4);
  const sunU = cfg.hdrSunU;
  const sunV = cfg.hdrSunV;
  const sunPeak = cfg.sunOrbPeak;

  for (let y = 0; y < height; y++) {
    // Row 0 is the zenith (flipY = true).
    const vTop = y / (height - 1);
    const elevation = (0.5 - vTop) * Math.PI;

    for (let x = 0; x < width; x++) {
      const u = x / width;
      const az = u * Math.PI * 2;
      const hedgerowH =
        0.012 +
        0.008 * Math.sin(az * 5.0 + 0.7) +
        0.005 * Math.cos(az * 13.0 - 1.2) +
        0.003 * Math.sin(az * 29.0 + 2.1);

      const du = Math.min(Math.abs(u - sunU), 1 - Math.abs(u - sunU));
      const dv = vTop - sunV;
      const sunDist = Math.hypot(du * 2.0, dv);

      if (elevation >= 0) {
        const ny = Math.sin(elevation);
        tmpCol.copy(horizonCol).lerp(zenithCol, Math.pow(ny, 0.52));
        const glowFactor = Math.exp(-sunDist * 3.2) * (1 - ny * 0.65);
        tmpCol.lerp(glowCol, Math.min(0.85, glowFactor));
        const cloudWave =
          0.5 + 0.3 * Math.sin(az * 6.0 + ny * 9.0) + 0.2 * Math.cos(az * 15.0 - ny * 14.0);
        const cloudBand = smoothstep(0.06, 0.35, ny) * (1 - smoothstep(0.55, 0.92, ny));
        tmpCol.lerp(glowCol, Math.max(0, cloudWave - 0.45) * cloudBand * 0.45);
        if (ny < hedgerowH) {
          tmpCol.lerp(groundCol, smoothstep(hedgerowH, hedgerowH * 0.35, ny) * 0.82);
        }
        const disc = Math.exp(-sunDist * sunDist * 1400.0) * sunPeak;
        const corona = Math.exp(-sunDist * 9.5) * (sunPeak * 0.14);
        tmpCol.r += sunCol.r * (disc + corona);
        tmpCol.g += sunCol.g * (disc + corona);
        tmpCol.b += sunCol.b * (disc + corona);
      } else {
        tmpCol.copy(pastureCol).lerp(groundCol, smoothstep(0.0, 0.38, Math.sin(-elevation)));
      }

      const idx = (y * width + x) * 4;
      data[idx] = tmpCol.r;
      data[idx + 1] = tmpCol.g;
      data[idx + 2] = tmpCol.b;
      data[idx + 3] = 1.0;
    }
  }

  const tex = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, THREE.FloatType);
  configureEquirect(tex);
  return tex;
}

/** Background (visible skybox) and IBL source panoramas prepared from one loaded `.hdr`. */
export interface PreparedHdr {
  readonly background: THREE.Texture;
  readonly envSource: THREE.DataTexture;
  /** Average linear radiance of the meadow band just below the horizon (what the 3D ground fades into). */
  readonly horizonGround: THREE.Color;
}

/**
 * Prepares a loaded 2K HDR in place:
 *  - blends the lower hemisphere into a smooth pasture ground so the tripod-distorted near grass is
 *    not visible beneath the estate in top-down views;
 *  - optionally deepens the twilight zenith (`zenithDarkening`);
 *  - soft-knee clamps the sun disc separately for the skybox and the IBL source (the shadowed
 *    directional sun light replaces the disc in the IBL, avoiding double sun and fireflies).
 */
export function prepareHdrPanorama(loadedTex: THREE.DataTexture, cfg: EnvPresetConfig): PreparedHdr | null {
  const img = loadedTex.image as { width: number; height: number; data: Float32Array } | undefined;
  if (!img?.data) return null;

  const W = img.width;
  const H = img.height;
  const bgData = img.data;
  const envData = new Float32Array(bgData.length);

  // Sample the distant meadow band just below the horizon to build the nadir ground.
  const yBand0 = Math.floor(H * 0.525);
  const yBand1 = Math.floor(H * 0.540);
  const colR = new Float32Array(W);
  const colG = new Float32Array(W);
  const colB = new Float32Array(W);
  let avgR = 0;
  let avgG = 0;
  let avgB = 0;
  const bandRows = Math.max(1, yBand1 - yBand0);
  for (let x = 0; x < W; x++) {
    let sr = 0;
    let sg = 0;
    let sb = 0;
    for (let y = yBand0; y < yBand1; y++) {
      const i = (y * W + x) * 4;
      sr += Math.min(bgData[i]!, 2.0);
      sg += Math.min(bgData[i + 1]!, 2.0);
      sb += Math.min(bgData[i + 2]!, 2.0);
    }
    colR[x] = sr / bandRows;
    colG[x] = sg / bandRows;
    colB[x] = sb / bandRows;
    avgR += colR[x]!;
    avgG += colG[x]!;
    avgB += colB[x]!;
  }
  avgR /= W;
  avgG /= W;
  avgB /= W;

  // Horizontal box blur so the ground transition is smooth.
  const smoothR = new Float32Array(W);
  const smoothG = new Float32Array(W);
  const smoothB = new Float32Array(W);
  const blurRadius = 24;
  const inv = 1 / (blurRadius * 2 + 1);
  for (let x = 0; x < W; x++) {
    let sr = 0;
    let sg = 0;
    let sb = 0;
    for (let dx = -blurRadius; dx <= blurRadius; dx++) {
      const xw = (x + dx + W) % W;
      sr += colR[xw]!;
      sg += colG[xw]!;
      sb += colB[xw]!;
    }
    smoothR[x] = sr * inv;
    smoothG[x] = sg * inv;
    smoothB[x] = sb * inv;
  }

  const yNadirStart = Math.floor(H * 0.542);
  const yNadirFull = Math.floor(H * 0.66);
  const kneeBg = cfg.hdrMaxClampBg;
  const kneeEnv = cfg.hdrMaxClampEnv;
  const sunCol = new THREE.Color(cfg.sunOrbColor);
  const relocateDaySun = cfg.hdrSunV <= 0.18;

  for (let y = 0; y < H; y++) {
    const vTop = y / (H - 1);
    const nadirBlend = y > yNadirStart ? smoothstep(yNadirStart, yNadirFull, y) : 0;
    const deepNadirMix = y > yNadirStart ? smoothstep(yNadirStart, H - 1, y) * 0.72 : 0;
    const zenithFactor =
      cfg.zenithDarkening > 0 && vTop < 0.48 ? smoothstep(0.48, 0.05, vTop) * cfg.zenithDarkening : 0;

    // Sample clean ambient sky away from the photographed sun column on this row for inpainting
    const cleanX = Math.floor(((cfg.hdrSunU + 0.32) % 1.0) * W);
    const cleanIdx = (y * W + cleanX) * 4;
    const rowCleanR = Math.min(bgData[cleanIdx]!, 2.2);
    const rowCleanG = Math.min(bgData[cleanIdx + 1]!, 2.2);
    const rowCleanB = Math.min(bgData[cleanIdx + 2]!, 2.4);

    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      let r = bgData[i]!;
      let g = bgData[i + 1]!;
      let b = bgData[i + 2]!;

      if (relocateDaySun && vTop < 0.46) {
        const u = x / W;
        const du = Math.min(Math.abs(u - cfg.hdrSunU), 1 - Math.abs(u - cfg.hdrSunU));
        // Soft-heal the low photographed ~27° sun orb at v ≈ 0.35 into the surrounding sky
        const oldDv = vTop - 0.35;
        const oldDist = Math.hypot(du * 1.8, oldDv);
        if (oldDist < 0.14) {
          const heal = 1 - smoothstep(0.02, 0.14, oldDist);
          r = r * (1 - heal * 0.88) + rowCleanR * (heal * 0.88);
          g = g * (1 - heal * 0.88) + rowCleanG * (heal * 0.88);
          b = b * (1 - heal * 0.88) + rowCleanB * (heal * 0.88);
        }
        // Paint the high overhead sun disc + corona at (cfg.hdrSunU, cfg.hdrSunV)
        const newDv = vTop - cfg.hdrSunV;
        const newDist = Math.hypot(du * 1.35, newDv);
        const disc = Math.exp(-newDist * newDist * 1400.0) * cfg.sunOrbPeak;
        const corona = Math.exp(-newDist * 11.0) * (cfg.sunOrbPeak * 0.15);
        r += sunCol.r * (disc + corona);
        g += sunCol.g * (disc + corona);
        b += sunCol.b * (disc + corona);
      }

      if (zenithFactor > 0) {
        // Deeper indigo dome: pull red/green down more than blue.
        r *= 1 - zenithFactor * 1.0;
        g *= 1 - zenithFactor * 0.8;
        b *= 1 - zenithFactor * 0.5;
      }

      if (nadirBlend > 0) {
        const pr = smoothR[x]! * (1 - deepNadirMix) + avgR * 0.65 * deepNadirMix;
        const pg = smoothG[x]! * (1 - deepNadirMix) + avgG * 0.65 * deepNadirMix;
        const pb = smoothB[x]! * (1 - deepNadirMix) + avgB * 0.65 * deepNadirMix;
        r = r * (1 - nadirBlend) + pr * nadirBlend;
        g = g * (1 - nadirBlend) + pg * nadirBlend;
        b = b * (1 - nadirBlend) + pb * nadirBlend;
      }

      const peak = Math.max(r, g, b);
      const sBg = peak > kneeBg ? kneeBg / peak : 1;
      bgData[i] = r * sBg;
      bgData[i + 1] = g * sBg;
      bgData[i + 2] = b * sBg;
      bgData[i + 3] = 1.0;

      const sEnv = peak > kneeEnv ? kneeEnv / peak : 1;
      envData[i] = r * sEnv;
      envData[i + 1] = g * sEnv;
      envData[i + 2] = b * sEnv;
      envData[i + 3] = 1.0;
    }
  }

  configureEquirect(loadedTex);
  const envSource = new THREE.DataTexture(envData, W, H, THREE.RGBAFormat, THREE.FloatType);
  configureEquirect(envSource);
  return { background: loadedTex, envSource, horizonGround: new THREE.Color(avgR, avgG, avgB) };
}
