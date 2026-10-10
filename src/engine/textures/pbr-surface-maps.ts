import * as THREE from 'three';
import { getOrCreateCachedCanvasPair } from './texture-registry.ts';

export interface PbrSurfaceMapOptions {
  /** Multiplier applied to Sobel height derivatives when constructing tangent-space normals. */
  readonly normalStrength?: number;
  /** Whether horizontal UV coordinates wrap seamlessly (`THREE.RepeatWrapping`). Default: `true`. */
  readonly wrapS?: boolean;
  /** Whether vertical UV coordinates wrap seamlessly (`THREE.RepeatWrapping`). Default: `true`. */
  readonly wrapT?: boolean;
  /** Normalized height `[0..1]` below which texels are treated as recessed mortar/grout joints. */
  readonly mortarThreshold?: number;
  /** Normalized roughness multiplier `[0..1]` inside recessed mortar/grout joints. */
  readonly mortarRoughness?: number;
  /** Normalized roughness multiplier `[0..1]` on raised, weathered stone/brick crowns. */
  readonly surfaceRoughnessMin?: number;
  /** Normalized roughness multiplier `[0..1]` along pitted edges and chamfer bevels. */
  readonly surfaceRoughnessMax?: number;
  /** High-frequency deterministic mineral micro-roughness amplitude. */
  readonly microGrainRoughness?: number;
}

function isRecordingCanvasStub(canvas: HTMLCanvasElement): boolean {
  return (
    typeof canvas === 'object' &&
    canvas !== null &&
    'log' in canvas &&
    Array.isArray((canvas as unknown as { readonly log?: unknown }).log)
  );
}

/**
 * Synthesizes a tangent-space RGB `normalMap` (via a multi-scale 3x3 Sobel + 5x5 bevel filter)
 * and a height/slope-correlated `roughnessMap` (matte recessed mortar vs. lower-roughness
 * weathered stone/clay crowns) from a procedural grayscale height `HTMLCanvasElement`.
 */
export function derivePbrNormalAndRoughnessMaps(
  key: string,
  heightCanvas: HTMLCanvasElement,
  options: PbrSurfaceMapOptions = {}
): {
  readonly normalMap: THREE.CanvasTexture;
  readonly roughnessMap: THREE.CanvasTexture;
} {
  const width = Math.max(1, heightCanvas.width);
  const height = Math.max(1, heightCanvas.height);
  const normalStrength = options.normalStrength ?? 3.2;
  const wrapS = options.wrapS ?? true;
  const wrapT = options.wrapT ?? true;
  const mortarThreshold = options.mortarThreshold ?? 0.24;
  const mortarRoughness = options.mortarRoughness ?? 1.0;
  const surfaceRoughnessMin = options.surfaceRoughnessMin ?? 0.66;
  const surfaceRoughnessMax = options.surfaceRoughnessMax ?? 0.9;
  const microGrainRoughness = options.microGrainRoughness ?? 0.05;

  const [normalCanvas, roughnessCanvas] = getOrCreateCachedCanvasPair(
    `${key}:pbr-nr`,
    width,
    height,
    (nCtx, rCtx) => {
      if (isRecordingCanvasStub(heightCanvas)) {
        nCtx.fillStyle = `normalMap:${key}:s=${normalStrength}`;
        nCtx.drawImage(heightCanvas, 0, 0);
        rCtx.fillStyle = `roughnessMap:${key}:m=${mortarThreshold}:${mortarRoughness}:${surfaceRoughnessMin}:${surfaceRoughnessMax}`;
        rCtx.drawImage(heightCanvas, 0, 0);
        return;
      }

      const hCtx = heightCanvas.getContext('2d');
      if (!hCtx) return;

      const srcPixels = hCtx.getImageData(0, 0, width, height).data;
      const total = width * height;
      const heights = new Float32Array(total);
      for (let i = 0; i < total; i++) {
        heights[i] = srcPixels[i * 4]! * (1 / 255);
      }

      const normalImg = nCtx.createImageData(width, height);
      const roughImg = rCtx.createImageData(width, height);
      const nData = normalImg.data;
      const rData = roughImg.data;

      const coordX = (x: number): number =>
        wrapS ? ((x % width) + width) % width : Math.max(0, Math.min(width - 1, x));
      const coordY = (y: number): number =>
        wrapT ? ((y % height) + height) % height : Math.max(0, Math.min(height - 1, y));

      const invCrownSpan = 1 / Math.max(0.05, 1 - mortarThreshold);

      for (let y = 0; y < height; y++) {
        const ym1 = coordY(y - 1) * width;
        const y0 = y * width;
        const yp1 = coordY(y + 1) * width;
        const ym2 = coordY(y - 2) * width;
        const yp2 = coordY(y + 2) * width;

        for (let x = 0; x < width; x++) {
          const xm1 = coordX(x - 1);
          const xp1 = coordX(x + 1);
          const xm2 = coordX(x - 2);
          const xp2 = coordX(x + 2);

          const tl = heights[ym1 + xm1]!;
          const tc = heights[ym1 + x]!;
          const tr = heights[ym1 + xp1]!;
          const ml = heights[y0 + xm1]!;
          const mc = heights[y0 + x]!;
          const mr = heights[y0 + xp1]!;
          const bl = heights[yp1 + xm1]!;
          const bc = heights[yp1 + x]!;
          const br = heights[yp1 + xp1]!;

          // 3x3 Sobel gradient + 2-texel wide bevel support for rounded masonry/cobble arrises
          const sobelX = (tr + 2 * mr + br - (tl + 2 * ml + bl)) * 0.125;
          const sobelY = (bl + 2 * bc + br - (tl + 2 * tc + tr)) * 0.125;
          const wideX = (heights[y0 + xp2]! - heights[y0 + xm2]!) * 0.25;
          const wideY = (heights[yp2 + x]! - heights[ym2 + x]!) * 0.25;

          const dX = sobelX * 0.72 + wideX * 0.28;
          const dY = sobelY * 0.72 + wideY * 0.28;

          // Canvas Y points down (-V in Three.js UV space with flipY=true), so:
          // nx = -dH/dx, ny = +dH/dy
          const nx = -dX * normalStrength;
          const ny = dY * normalStrength;
          const nz = 1.0;
          const invLen = 1.0 / Math.hypot(nx, ny, nz);

          const outIdx = (y0 + x) * 4;
          nData[outIdx] = Math.max(0, Math.min(255, Math.round((nx * invLen * 0.5 + 0.5) * 255)));
          nData[outIdx + 1] = Math.max(
            0,
            Math.min(255, Math.round((ny * invLen * 0.5 + 0.5) * 255))
          );
          nData[outIdx + 2] = Math.max(
            128,
            Math.min(255, Math.round((nz * invLen * 0.5 + 0.5) * 255))
          );
          nData[outIdx + 3] = 255;

          // Roughness synthesis: recessed mortar beds stay matte (`mortarRoughness`),
          // while raised stone/brick crowns have lower roughness (`surfaceRoughnessMin`)
          // so grazing sunlight and warm sconces catch the rounded tops of cobbles and bricks.
          let rough: number;
          if (mc < mortarThreshold) {
            rough = mortarRoughness;
          } else {
            const tCrown = Math.min(1, (mc - mortarThreshold) * invCrownSpan);
            const slopeMag = Math.min(1, Math.hypot(dX, dY) * 3.0);
            const baseRough =
              surfaceRoughnessMax -
              tCrown * (surfaceRoughnessMax - surfaceRoughnessMin) +
              slopeMag * 0.06;
            const grainHash = (((x * 37 + y * 59) ^ (x * 13 + y * 7)) & 63) * (1 / 63) - 0.5;
            rough = Math.max(
              0.08,
              Math.min(1.0, baseRough + grainHash * microGrainRoughness)
            );
          }

          const rByte = Math.max(0, Math.min(255, Math.round(rough * 255)));
          rData[outIdx] = rByte;
          rData[outIdx + 1] = rByte;
          rData[outIdx + 2] = rByte;
          rData[outIdx + 3] = 255;
        }
      }

      nCtx.putImageData(normalImg, 0, 0);
      rCtx.putImageData(roughImg, 0, 0);
    }
  );

  const normalMap = new THREE.CanvasTexture(normalCanvas);
  normalMap.wrapS = wrapS ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  normalMap.wrapT = wrapT ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  normalMap.colorSpace = THREE.NoColorSpace;
  normalMap.anisotropy = 8;

  const roughnessMap = new THREE.CanvasTexture(roughnessCanvas);
  roughnessMap.wrapS = wrapS ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  roughnessMap.wrapT = wrapT ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  roughnessMap.colorSpace = THREE.NoColorSpace;
  roughnessMap.anisotropy = 8;

  return { normalMap, roughnessMap };
}
