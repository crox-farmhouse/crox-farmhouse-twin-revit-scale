/**
 * Recording 2D canvas stub for headless scene snapshots.
 *
 * Every property assignment and method call on a CanvasRenderingContext2D is
 * appended to a per-canvas command log, so procedural CanvasTextures can be
 * fingerprinted deterministically without a real rasteriser.
 */
import { createHash } from 'node:crypto';

const CANVAS_TAG = Symbol('recordingCanvas');

interface RecordingCanvas {
  [CANVAS_TAG]: true;
  width: number;
  height: number;
  readonly log: string[];
  readonly style: Record<string, string>;
  getContext(kind: string): unknown;
  toDataURL(): string;
  addEventListener(): void;
  removeEventListener(): void;
}

let nextHandleId = 0;

function fmt(value: unknown): string {
  if (typeof value === 'number') {
    const v = Math.round(value * 1e6) / 1e6;
    return String(Object.is(v, -0) ? 0 : v);
  }
  if (value && typeof value === 'object') {
    if (CANVAS_TAG in value) return `canvas#${getCanvasFingerprint(value) ?? '?'}`;
    const handle = (value as { __handle?: string }).__handle;
    if (handle) return handle;
    const data = (value as { data?: Uint8ClampedArray }).data;
    if (data instanceof Uint8ClampedArray) {
      return `imgdata(${createHash('sha1').update(data).digest('hex').slice(0, 12)})`;
    }
    return JSON.stringify(value);
  }
  return JSON.stringify(value);
}

function createHandle(kind: string, log: string[]): Record<string, unknown> {
  const id = `${kind}${nextHandleId++}`;
  return new Proxy(
    { __handle: id },
    {
      get(target, prop) {
        if (prop === '__handle') return target.__handle;
        return (...args: unknown[]) => {
          log.push(`${id}.${String(prop)}(${args.map(fmt).join(',')})`);
        };
      },
    }
  );
}

function createImageDataLike(w: number, h: number): { width: number; height: number; data: Uint8ClampedArray } {
  return { width: w, height: h, data: new Uint8ClampedArray(Math.max(0, w * h * 4)) };
}

function createContext(canvas: RecordingCanvas): unknown {
  const log = canvas.log;
  const state: Record<string | symbol, unknown> = { canvas };
  return new Proxy(state, {
    set(target, prop, value) {
      log.push(`set ${String(prop)}=${fmt(value)}`);
      target[prop] = value;
      return true;
    },
    get(target, prop) {
      if (prop === 'canvas') return canvas;
      if (prop in target && prop !== 'canvas') return target[prop];
      const name = String(prop);
      return (...args: unknown[]) => {
        log.push(`${name}(${args.map(fmt).join(',')})`);
        switch (name) {
          case 'createLinearGradient':
          case 'createRadialGradient':
          case 'createConicGradient':
            return createHandle('grad', log);
          case 'createPattern':
            return createHandle('pat', log);
          case 'getImageData':
          case 'createImageData':
            return createImageDataLike(Number(args[2] ?? args[0]), Number(args[3] ?? args[1]));
          case 'measureText':
            return { width: String(args[0] ?? '').length * 7 };
          case 'getTransform':
            return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
          case 'isPointInPath':
            return false;
          default:
            return undefined;
        }
      };
    },
  });
}

function createRecordingCanvas(): RecordingCanvas {
  let ctx: unknown = null;
  const canvas: RecordingCanvas = {
    [CANVAS_TAG]: true,
    log: [],
    style: {},
    get width() {
      return this._w;
    },
    set width(v: number) {
      this._w = v;
      this.log.push(`width=${v}`);
    },
    get height() {
      return this._h;
    },
    set height(v: number) {
      this._h = v;
      this.log.push(`height=${v}`);
    },
    getContext(kind: string) {
      if (kind !== '2d') return null;
      if (!ctx) ctx = createContext(canvas);
      return ctx;
    },
    toDataURL() {
      return `data:recording/${getCanvasFingerprint(canvas)}`;
    },
    addEventListener() {},
    removeEventListener() {},
  } as RecordingCanvas & { _w: number; _h: number };
  (canvas as unknown as { _w: number; _h: number })._w = 300;
  (canvas as unknown as { _w: number; _h: number })._h = 150;
  return canvas;
}

/** Returns a stable hash of a recording canvas's full draw log, or null for non-recording images. */
export function getCanvasFingerprint(image: unknown): string | null {
  if (!image || typeof image !== 'object' || !(CANVAS_TAG in image)) return null;
  const c = image as RecordingCanvas;
  return `${c.width}x${c.height}:${createHash('sha1').update(c.log.join('\n')).digest('hex').slice(0, 16)}`;
}

/** Installs a minimal global `document` / `window` sufficient for scene builders to run under Node. */
export function installRecordingCanvasEnvironment(): void {
  const g = globalThis as unknown as Record<string, unknown>;
  g.document = {
    createElement: () => createRecordingCanvas(),
    createElementNS: () => createRecordingCanvas(),
    getElementById: () => null,
  };
  if (!g.window) g.window = g;
  if (!g.self) g.self = g;
  if (!g.devicePixelRatio) g.devicePixelRatio = 1;
}
