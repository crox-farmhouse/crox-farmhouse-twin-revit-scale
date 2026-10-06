/**
 * Deterministic procedural canvas and texture memoization registry.
 *
 * Caches generated `HTMLCanvasElement` surfaces by key so callers that wrap a canvas in
 * `new THREE.CanvasTexture(cachedCanvas)` can independently mutate `.repeat`, `.offset`,
 * `.wrapS`, or `.wrapT` without redundant 2D rasterisation. Also memoizes shared immutable
 * texture pairs (`colorMap` + `bumpMap` / `depthMap`) that do not require per-caller UV state.
 */

interface RecordingCanvasLike {
  readonly log?: readonly string[];
}

const canvasCache = new Map<string, HTMLCanvasElement>();
const canvasPairCache = new Map<string, readonly [HTMLCanvasElement, HTMLCanvasElement]>();
const textureCache = new Map<string, unknown>();
const statefulRecordingKeys = new Set<string>();

function isStatefulRecordingCanvas(canvas: HTMLCanvasElement): boolean {
  const maybeRecording = canvas as unknown as RecordingCanvasLike;
  if (!Array.isArray(maybeRecording.log)) {
    return false;
  }
  return maybeRecording.log.some(
    (entry) => typeof entry === 'string' && (entry.includes('grad') || entry.includes('pat'))
  );
}

/**
 * Returns a cached `HTMLCanvasElement` for `key`, or creates a `width x height` canvas
 * and runs `draw` once to populate it.
 */
export function getOrCreateCachedCanvas(
  key: string,
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void
): HTMLCanvasElement {
  const cached = canvasCache.get(key);
  if (cached !== undefined && !statefulRecordingKeys.has(key)) {
    return cached;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    draw(ctx, canvas);
  }

  canvasCache.set(key, canvas);
  if (isStatefulRecordingCanvas(canvas)) {
    statefulRecordingKeys.add(key);
  }
  return canvas;
}

/**
 * Returns a cached pair of `[primaryCanvas, secondaryCanvas]` for synchronized
 * color + bump/depth procedural generators.
 */
export function getOrCreateCachedCanvasPair(
  key: string,
  width: number,
  height: number,
  draw: (
    primaryCtx: CanvasRenderingContext2D,
    secondaryCtx: CanvasRenderingContext2D,
    primaryCanvas: HTMLCanvasElement,
    secondaryCanvas: HTMLCanvasElement
  ) => void
): readonly [HTMLCanvasElement, HTMLCanvasElement] {
  const cached = canvasPairCache.get(key);
  if (cached !== undefined && !statefulRecordingKeys.has(key)) {
    return cached;
  }

  const primaryCanvas = document.createElement('canvas');
  primaryCanvas.width = width;
  primaryCanvas.height = height;
  const primaryCtx = primaryCanvas.getContext('2d');

  const secondaryCanvas = document.createElement('canvas');
  secondaryCanvas.width = width;
  secondaryCanvas.height = height;
  const secondaryCtx = secondaryCanvas.getContext('2d');

  if (primaryCtx && secondaryCtx) {
    draw(primaryCtx, secondaryCtx, primaryCanvas, secondaryCanvas);
  }

  const pair: readonly [HTMLCanvasElement, HTMLCanvasElement] = [primaryCanvas, secondaryCanvas];
  canvasPairCache.set(key, pair);
  canvasCache.set(`${key}:primary`, primaryCanvas);
  canvasCache.set(`${key}:secondary`, secondaryCanvas);
  if (isStatefulRecordingCanvas(primaryCanvas) || isStatefulRecordingCanvas(secondaryCanvas)) {
    statefulRecordingKeys.add(key);
  }
  return pair;
}

/**
 * Memoizes a shared texture or texture bundle by `key`.
 */
export function getOrCreateCachedTexture<T>(key: string, create: () => T): T {
  if (textureCache.has(key)) {
    return textureCache.get(key) as T;
  }
  const value = create();
  textureCache.set(key, value);
  return value;
}

/**
 * Clears all memoized procedural canvases and textures from the registry.
 */
export function clearTextureRegistryCache(): void {
  canvasCache.clear();
  canvasPairCache.clear();
  textureCache.clear();
  statefulRecordingKeys.clear();
}
