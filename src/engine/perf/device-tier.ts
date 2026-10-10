import type * as THREE from 'three';
import type { WebGPURenderer } from 'three/webgpu';
import type { GraphicsTier } from '../../core/types/twin-ux.ts';
import { compareTiers } from './tier-settings.ts';

/** Hardware signals collected once at boot. */
export interface DeviceProfile {
  /** Unmasked GPU renderer string when available (e.g. `ANGLE (NVIDIA, GeForce RTX 3070 ...)`). */
  readonly gpuRenderer: string;
  readonly gpuVendor: string;
  /** Logical CPU cores (`navigator.hardwareConcurrency`), 0 when unknown. */
  readonly hardwareConcurrency: number;
  /** Approximate RAM in GB (`navigator.deviceMemory`), null when unsupported. */
  readonly deviceMemoryGb: number | null;
  readonly devicePixelRatio: number;
  readonly isMobile: boolean;
  readonly isTouch: boolean;
  readonly maxTextureSize: number;
  readonly isWebGL2: boolean;
}

interface NavigatorUaData {
  readonly mobile?: boolean;
}

type ExtendedNavigator = Navigator & {
  readonly deviceMemory?: number;
  readonly userAgentData?: NavigatorUaData;
};

interface WebGpuAdapterInfoLike {
  readonly description?: string;
  readonly device?: string;
  readonly vendor?: string;
  readonly architecture?: string;
}

interface WebGpuDeviceLike {
  readonly adapterInfo?: WebGpuAdapterInfoLike;
  readonly limits?: {
    readonly maxTextureDimension2D?: number;
  };
}

interface RendererBackendLike {
  readonly isWebGPUBackend?: boolean;
  readonly isWebGLBackend?: boolean;
  readonly device?: WebGpuDeviceLike | null;
  readonly gl?: WebGLRenderingContext | WebGL2RenderingContext | null;
}

function isWebGlContext(ctx: unknown): ctx is WebGLRenderingContext | WebGL2RenderingContext {
  return (
    typeof ctx === 'object' &&
    ctx !== null &&
    'getParameter' in ctx &&
    typeof (ctx as WebGLRenderingContext).getParameter === 'function' &&
    'getExtension' in ctx &&
    typeof (ctx as WebGLRenderingContext).getExtension === 'function'
  );
}

function readStringParam(gl: WebGLRenderingContext | WebGL2RenderingContext, param: number): string {
  try {
    const value: unknown = gl.getParameter(param);
    return typeof value === 'string' ? value : '';
  } catch {
    return '';
  }
}

function readNumberParam(gl: WebGLRenderingContext | WebGL2RenderingContext, param: number): number {
  try {
    const value: unknown = gl.getParameter(param);
    return typeof value === 'number' ? value : 0;
  } catch {
    return 0;
  }
}

function detectMobile(nav: ExtendedNavigator | null): boolean {
  if (!nav) return false;
  if (typeof nav.userAgentData?.mobile === 'boolean' && nav.userAgentData.mobile) return true;
  const ua = nav.userAgent || '';
  if (/Android|iPhone|iPad|iPod|Mobile|Silk|Kindle|Opera Mini|IEMobile/i.test(ua)) return true;
  // iPadOS 13+ reports a desktop Mac user agent but has multi-touch.
  return /Macintosh/.test(ua) && (nav.maxTouchPoints || 0) > 1;
}

/** Collects GPU and device signals used to pick an initial graphics tier. */
export function detectDeviceProfile(
  renderer: WebGPURenderer | THREE.WebGLRenderer
): DeviceProfile {
  const backend = (renderer as { readonly backend?: RendererBackendLike }).backend;
  let gl: WebGLRenderingContext | WebGL2RenderingContext | null = backend?.gl ?? null;
  if (!gl && !backend?.isWebGPUBackend) {
    try {
      const ctx: unknown = renderer.getContext();
      if (isWebGlContext(ctx)) {
        gl = ctx;
      }
    } catch {
      gl = null;
    }
  }

  let gpuRenderer = '';
  let gpuVendor = '';
  let maxTextureSize = 8192;
  let isWebGL2 = true;

  if (gl) {
    try {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        gpuRenderer = readStringParam(gl, debugInfo.UNMASKED_RENDERER_WEBGL);
        gpuVendor = readStringParam(gl, debugInfo.UNMASKED_VENDOR_WEBGL);
      }
    } catch {
      // Extension unavailable; fall back to standard parameters below.
    }
    // Firefox deprecates the extension but returns the sanitized renderer from RENDERER directly.
    if (!gpuRenderer) gpuRenderer = readStringParam(gl, gl.RENDERER);
    if (!gpuVendor) gpuVendor = readStringParam(gl, gl.VENDOR);
    maxTextureSize = readNumberParam(gl, gl.MAX_TEXTURE_SIZE) || 8192;
    if ('capabilities' in renderer && renderer.capabilities) {
      isWebGL2 = Boolean(renderer.capabilities.isWebGL2);
    }
  } else {
    const info = backend?.device?.adapterInfo;
    const parts = [info?.description, info?.device, info?.architecture].filter(
      (part): part is string => typeof part === 'string' && part.trim().length > 0
    );
    gpuRenderer = parts.join(' ').trim() || 'WebGPU Hardware Adapter';
    gpuVendor =
      typeof info?.vendor === 'string' && info.vendor.trim().length > 0
        ? info.vendor.trim()
        : 'WebGPU';
    const limitTex = backend?.device?.limits?.maxTextureDimension2D;
    maxTextureSize = typeof limitTex === 'number' && limitTex > 0 ? limitTex : 8192;
    isWebGL2 = true;
  }

  const nav: ExtendedNavigator | null = typeof navigator !== 'undefined' ? navigator : null;
  const deviceMemory = nav?.deviceMemory;
  const isTouch =
    (nav?.maxTouchPoints ?? 0) > 0 ||
    (typeof window !== 'undefined' && 'ontouchstart' in window);

  return {
    gpuRenderer,
    gpuVendor,
    hardwareConcurrency: nav?.hardwareConcurrency ?? 0,
    deviceMemoryGb: typeof deviceMemory === 'number' && deviceMemory > 0 ? deviceMemory : null,
    devicePixelRatio:
      typeof window !== 'undefined' && window.devicePixelRatio > 0 ? window.devicePixelRatio : 1,
    isMobile: detectMobile(nav),
    isTouch,
    maxTextureSize,
    isWebGL2,
  };
}

/** Stable cache key for a device (GPU string + DPR bucket). */
export function getDeviceCacheKey(profile: DeviceProfile): string {
  const gpu = (profile.gpuRenderer || 'unknown-gpu').trim().toLowerCase();
  return `${gpu}|dpr${Math.round(profile.devicePixelRatio * 4) / 4}`;
}

interface GpuRule {
  readonly pattern: RegExp;
  readonly tier: GraphicsTier;
}

/** First match wins. Order from most specific to most generic. */
const GPU_RULES: readonly GpuRule[] = [
  // Software rasterizers.
  { pattern: /swiftshader|llvmpipe|softpipe|software|basic render|mesa offscreen/i, tier: 'low' },
  // Flagship discrete GPUs.
  { pattern: /rtx\s*(30[6-9]0|40[6-9]0|50[6-9]0|a[4-6]000)|radeon\s*rx\s*(6[7-9]|7[7-9]|9[0-9])\d\d/i, tier: 'ultra' },
  { pattern: /apple\s*m\d+\s*(pro|max|ultra)/i, tier: 'ultra' },
  // Strong discrete / Apple silicon.
  { pattern: /apple\s*m\d+/i, tier: 'high' },
  { pattern: /\brtx\b|quadro|titan|gtx\s*(10[5-8]0|16[5-6]0)|tesla|nvidia\s*a\d{2,3}/i, tier: 'high' },
  { pattern: /radeon\s*(rx|pro)\b/i, tier: 'high' },
  { pattern: /intel.*\barc\b/i, tier: 'high' },
  // Mid-range.
  { pattern: /gtx|geforce|nvidia/i, tier: 'medium' },
  { pattern: /iris\s*\(?r?\)?\s*xe/i, tier: 'medium' },
  { pattern: /radeon.*(vega|graphics|680m|780m|890m)/i, tier: 'medium' },
  { pattern: /adreno.*\b(6|7|8)\d\d\b/i, tier: 'medium' },
  { pattern: /apple\s*gpu/i, tier: 'medium' },
  // Weak integrated / mobile GPUs.
  { pattern: /intel.*(uhd|hd\s*graphics|iris)|intel\(r\)\s*(uhd|hd)/i, tier: 'low' },
  { pattern: /\bmali\b|powervr|adreno|videocore|tegra|radeon\s*r[2-7]\b/i, tier: 'low' },
];

function minTier(a: GraphicsTier, b: GraphicsTier): GraphicsTier {
  return compareTiers(a, b) <= 0 ? a : b;
}

/** Tier implied by the GPU string alone, or null when the GPU is not recognised. */
export function classifyGpu(gpuRenderer: string): GraphicsTier | null {
  for (const rule of GPU_RULES) {
    if (rule.pattern.test(gpuRenderer)) return rule.tier;
  }
  return null;
}

/**
 * Heuristic initial tier from hardware signals only. The startup benchmark refines this.
 *
 * - Software rasterizers, Intel UHD/HD/Iris (non-Xe), Mali, PowerVR, Adreno < 600 → low.
 * - Apple M-series, RTX, Radeon RX/Pro, Intel Arc → high; flagship RTX/RX/M Pro/Max → ultra.
 * - Unknown GPUs default to medium.
 * - Device caps: mobile / ≤4 GB RAM / ≤4 cores → at most medium; ≤2 GB RAM / ≤2 cores /
 *   max texture size < 4096 → low. Ultra additionally requires ≥8 cores on desktop.
 */
export function estimateInitialTier(profile: DeviceProfile): GraphicsTier {
  const gpuTier = classifyGpu(profile.gpuRenderer);
  let tier: GraphicsTier = gpuTier ?? 'medium';

  // Safari on macOS masks every GPU as "Apple GPU", and Chrome/Safari WebGPU often masks
  // adapterInfo.device/description while reporting "WebGPU Hardware Adapter" or vendor "apple"/"nvidia"/"amd".
  if (
    !profile.isMobile &&
    !profile.isTouch &&
    gpuTier === null &&
    (/apple\s*gpu|webgpu\s*hardware\s*adapter/i.test(profile.gpuRenderer) ||
      /^(apple|nvidia|amd)\b/i.test(profile.gpuVendor))
  ) {
    tier = 'high';
  } else if (/apple\s*gpu/i.test(profile.gpuRenderer) && !profile.isMobile && !profile.isTouch) {
    tier = 'high';
  }

  const cores = profile.hardwareConcurrency;
  const memory = profile.deviceMemoryGb;

  if (profile.isMobile) tier = minTier(tier, 'medium');
  if (memory !== null && memory <= 4) tier = minTier(tier, 'medium');
  if (cores > 0 && cores <= 4) tier = minTier(tier, 'medium');
  if (tier === 'ultra' && cores > 0 && cores < 8) tier = 'high';

  if (memory !== null && memory <= 2) tier = 'low';
  if (cores > 0 && cores <= 2) tier = 'low';
  if (profile.maxTextureSize > 0 && profile.maxTextureSize < 4096) tier = 'low';

  return tier;
}
