import * as THREE from 'three';
import { afterEach, describe, expect, it } from 'vitest';
import { derivePbrNormalAndRoughnessMaps } from './pbr-surface-maps.ts';
import {
  createGraniteSettLPathTextures,
  createHerringboneTerracottaQuarryTileTextures,
  createImperialBrickTextures,
  createWelshSlateRoofTextures,
} from './procedural-textures.ts';
import { clearTextureRegistryCache } from './texture-registry.ts';

interface PixelCanvasBuffer {
  width: number;
  height: number;
  readonly pixels: Uint8ClampedArray;
  getContext(type: '2d'): {
    createImageData(w: number, h: number): { data: Uint8ClampedArray; width: number; height: number };
    getImageData(
      x: number,
      y: number,
      w: number,
      h: number
    ): { data: Uint8ClampedArray; width: number; height: number };
    putImageData(img: { data: Uint8ClampedArray }, x: number, y: number): void;
  };
}

function createPixelCanvasStub(
  width: number,
  height: number,
  fillHeightFn?: (x: number, y: number) => number
): PixelCanvasBuffer {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const h = fillHeightFn ? fillHeightFn(x, y) : 128;
      const idx = (y * width + x) * 4;
      pixels[idx] = h;
      pixels[idx + 1] = h;
      pixels[idx + 2] = h;
      pixels[idx + 3] = 255;
    }
  }
  return {
    width,
    height,
    pixels,
    getContext() {
      return {
        createImageData(w: number, h: number) {
          return { data: new Uint8ClampedArray(w * h * 4), width: w, height: h };
        },
        getImageData(_x: number, _y: number, w: number, h: number) {
          return { data: pixels, width: w, height: h };
        },
        putImageData(img: { data: Uint8ClampedArray }) {
          pixels.set(img.data);
        },
      };
    },
  };
}

function createLightweightRecordingCanvasStub(): {
  width: number;
  height: number;
  readonly log: string[];
  getContext(type: string): unknown;
} {
  const log: string[] = [];
  const noopProxy: unknown = new Proxy(
    {},
    {
      get(_target, prop) {
        return (...args: unknown[]) => {
          log.push(`${String(prop)}(${args.length})`);
          return noopProxy;
        };
      },
      set(_target, prop, value) {
        const valStr =
          typeof value === 'string' || typeof value === 'number' ? String(value) : 'obj';
        log.push(`${String(prop)}=${valStr}`);
        return true;
      },
    }
  );
  return {
    width: 256,
    height: 256,
    log,
    getContext() {
      return noopProxy;
    },
  };
}

describe('derivePbrNormalAndRoughnessMaps', () => {
  afterEach(() => {
    clearTextureRegistryCache();
  });

  it('computes tangent-space Sobel normals and height/slope-correlated roughness on pixel canvases', () => {
    const prevDoc = (globalThis as { document?: unknown }).document;
    const createdCanvases: PixelCanvasBuffer[] = [];
    (globalThis as { document?: unknown }).document = {
      createElement(tag: string) {
        if (tag === 'canvas') {
          const c = createPixelCanvasStub(16, 16);
          createdCanvases.push(c);
          return c;
        }
        return {};
      },
    };

    try {
      // Create a 16x16 height map with a recessed mortar channel (y <= 6: height = 24)
      // and a raised stone ramp (y > 6: height increases with x from 140 to 236).
      const heightCanvas = createPixelCanvasStub(16, 16, (x, y) => {
        if (y <= 6) return 24;
        return Math.min(255, 140 + x * 6);
      });

      const { normalMap, roughnessMap } = derivePbrNormalAndRoughnessMaps(
        'unit-test:sobel-brick:16',
        heightCanvas as unknown as HTMLCanvasElement,
        {
          normalStrength: 4.0,
          mortarThreshold: 0.24,
          mortarRoughness: 0.98,
          surfaceRoughnessMin: 0.64,
          surfaceRoughnessMax: 0.86,
          microGrainRoughness: 0.0,
        }
      );

      expect(normalMap.colorSpace).toBe(THREE.NoColorSpace);
      expect(roughnessMap.colorSpace).toBe(THREE.NoColorSpace);
      expect(normalMap.anisotropy).toBe(8);
      expect(roughnessMap.anisotropy).toBe(8);
      expect(createdCanvases.length).toBe(2);

      const normalPixels = createdCanvases[0]!.pixels;
      const roughnessPixels = createdCanvases[1]!.pixels;

      // Center of flat recessed mortar (x=8, y=3): 2+ texels away from y=0 wrap and y=7 step, so normal is (128, 128, 255)
      const flatIdx = (3 * 16 + 8) * 4;
      expect(normalPixels[flatIdx]).toBe(128);
      expect(normalPixels[flatIdx + 1]).toBe(128);
      expect(normalPixels[flatIdx + 2]).toBe(255);

      // Sloped stone crown (x=8, y=11): height increases to the right (+x), so normal tilts left (nx < 0 -> R < 128)
      const rampIdx = (11 * 16 + 8) * 4;
      expect(normalPixels[rampIdx]!).toBeLessThan(120);
      expect(normalPixels[rampIdx + 2]!).toBeGreaterThan(150);

      // Recessed mortar roughness at (x=8, y=3) should be noticeably higher (more matte) than raised stone crown at (x=8, y=11)
      const mortarRoughByte = roughnessPixels[flatIdx]!;
      const crownRoughByte = roughnessPixels[rampIdx]!;
      expect(mortarRoughByte).toBeGreaterThan(crownRoughByte + 30);
    } finally {
      (globalThis as { document?: unknown }).document = prevDoc;
    }
  });

  it('fast-paths headless recording canvas stubs and memoizes brick, slate, and cobble PBR maps', () => {
    const prevDoc = (globalThis as { document?: unknown }).document;
    (globalThis as { document?: unknown }).document = {
      createElement() {
        return createLightweightRecordingCanvasStub();
      },
    };

    try {
      const brickA = createImperialBrickTextures();
      const brickB = createImperialBrickTextures();
      expect(brickA.normalMap).toBe(brickB.normalMap);
      expect(brickA.roughnessMap).toBe(brickB.roughnessMap);
      expect(brickA.normalMap.colorSpace).toBe(THREE.NoColorSpace);
      expect(brickA.roughnessMap.colorSpace).toBe(THREE.NoColorSpace);

      const slate = createWelshSlateRoofTextures();
      expect(slate.normalMap.colorSpace).toBe(THREE.NoColorSpace);
      expect(slate.roughnessMap.colorSpace).toBe(THREE.NoColorSpace);

      const cobble = createGraniteSettLPathTextures();
      expect(cobble.normalMap.colorSpace).toBe(THREE.NoColorSpace);
      expect(cobble.roughnessMap.colorSpace).toBe(THREE.NoColorSpace);

      const quarry = createHerringboneTerracottaQuarryTileTextures();
      expect(quarry.normalMap.colorSpace).toBe(THREE.NoColorSpace);
      expect(quarry.roughnessMap.colorSpace).toBe(THREE.NoColorSpace);
    } finally {
      (globalThis as { document?: unknown }).document = prevDoc;
    }
  });
});
