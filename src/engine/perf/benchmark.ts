import type * as THREE from 'three';
import type { GraphicsTier } from '../../core/types/twin-ux.ts';
import {
  detectDeviceProfile,
  estimateInitialTier,
  getDeviceCacheKey,
  type DeviceProfile,
} from './device-tier.ts';
import { compareTiers, isGraphicsTier, stepTier } from './tier-settings.ts';

export interface BenchmarkResult {
  readonly avgMs: number;
  readonly p95Ms: number;
}

export interface StartupBenchmarkOptions {
  /** Renders one frame. `t` is normalized benchmark progress in [0, 1] (use it to drive a camera path). */
  readonly renderFrame: (t: number) => void;
  readonly durationMs?: number;
}

const DEFAULT_DURATION_MS = 1500;
const WARMUP_FRAMES = 4;
/** Deltas above this are treated as hitches (tab switch, shader compile) and discarded. */
const MAX_VALID_DELTA_MS = 250;

/** p-th percentile (0..1) of an unsorted list. Returns 0 for an empty list. */
export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[idx]!;
}

/**
 * Renders `renderFrame` under requestAnimationFrame for ~1.5 s and measures rAF-to-rAF deltas.
 * rAF deltas include GPU time (the compositor cannot present a frame before the GPU finishes it),
 * without stalling the pipeline with `gl.finish()`. Note deltas are vsync-quantized, so values at or
 * near the display refresh interval mean "fast enough", not an exact GPU cost.
 */
export function runStartupBenchmark(opts: StartupBenchmarkOptions): Promise<BenchmarkResult> {
  const durationMs = Math.max(200, opts.durationMs ?? DEFAULT_DURATION_MS);
  if (typeof requestAnimationFrame !== 'function') {
    return Promise.resolve({ avgMs: 0, p95Ms: 0 });
  }

  return new Promise<BenchmarkResult>((resolve) => {
    const deltas: number[] = [];
    let startMs = -1;
    let lastMs = -1;
    let frame = 0;

    const step = (nowMs: number): void => {
      if (startMs < 0) startMs = nowMs;
      const elapsed = nowMs - startMs;
      if (lastMs >= 0 && frame > WARMUP_FRAMES) {
        const delta = nowMs - lastMs;
        if (delta > 0 && delta < MAX_VALID_DELTA_MS) deltas.push(delta);
      }
      lastMs = nowMs;
      frame += 1;

      if (elapsed >= durationMs) {
        const avgMs = deltas.length ? deltas.reduce((s, d) => s + d, 0) / deltas.length : 0;
        resolve({ avgMs, p95Ms: percentile(deltas, 0.95) });
        return;
      }

      try {
        opts.renderFrame(Math.min(1, elapsed / durationMs));
      } catch {
        // A failed frame must not hang the loading screen; keep sampling.
      }
      requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  });
}

/**
 * Refines a heuristic tier with benchmark frame times (rendered at the heuristic tier).
 * Drops one tier when p95 > 26 ms and two when p95 > 45 ms. Upgrades only `medium` → `high` when the
 * run held a steady refresh rate (p95 < 17.5 ms); `low` estimates come from known weak GPUs and are
 * never upgraded, and `ultra` is never reached from a benchmark alone because rAF is vsync-capped.
 */
export function tierFromBenchmark(estimate: GraphicsTier, result: BenchmarkResult): GraphicsTier {
  if (result.p95Ms <= 0) return estimate;
  if (result.p95Ms > 45) return stepTier(estimate, -2);
  if (result.p95Ms > 26) return stepTier(estimate, -1);
  if (estimate === 'medium' && result.p95Ms < 17.5 && result.avgMs < 17.5) return 'high';
  return estimate;
}

// ---------------------------------------------------------------------------
// localStorage cache (`crox_twin_perf_v1`), keyed by GPU string.
// ---------------------------------------------------------------------------

export const PERF_CACHE_STORAGE_KEY = 'crox_twin_perf_v1';

export interface CachedPerfEntry {
  readonly tier: GraphicsTier;
  readonly avgMs: number;
  readonly p95Ms: number;
  /** Epoch ms when the entry was written. */
  readonly savedAt: number;
}

type PerfCache = Record<string, CachedPerfEntry>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readCache(): PerfCache {
  try {
    const raw = localStorage.getItem(PERF_CACHE_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return {};
    const out: PerfCache = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (
        isRecord(value) &&
        isGraphicsTier(value.tier) &&
        typeof value.avgMs === 'number' &&
        typeof value.p95Ms === 'number' &&
        typeof value.savedAt === 'number'
      ) {
        out[key] = {
          tier: value.tier,
          avgMs: value.avgMs,
          p95Ms: value.p95Ms,
          savedAt: value.savedAt,
        };
      }
    }
    return out;
  } catch {
    return {};
  }
}

function writeCache(cache: PerfCache): void {
  try {
    localStorage.setItem(PERF_CACHE_STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Storage disabled or full; the benchmark simply re-runs next visit.
  }
}

export function readCachedPerf(cacheKey: string): CachedPerfEntry | null {
  return readCache()[cacheKey] ?? null;
}

export function writeCachedPerf(cacheKey: string, entry: CachedPerfEntry): void {
  const cache = readCache();
  cache[cacheKey] = entry;
  writeCache(cache);
}

/** Updates only the cached tier (e.g. after the auto governor settles on a different tier). */
export function updateCachedTier(cacheKey: string, tier: GraphicsTier): void {
  const prev = readCachedPerf(cacheKey);
  writeCachedPerf(cacheKey, {
    tier,
    avgMs: prev?.avgMs ?? 0,
    p95Ms: prev?.p95Ms ?? 0,
    savedAt: Date.now(),
  });
}

export interface InitialTierResolution {
  readonly tier: GraphicsTier;
  readonly profile: DeviceProfile;
  readonly cacheKey: string;
  readonly heuristicTier: GraphicsTier;
  /** Null when the cached result was reused or the benchmark was skipped. */
  readonly benchmark: BenchmarkResult | null;
  readonly fromCache: boolean;
}

export interface ResolveInitialTierOptions {
  readonly renderer: THREE.WebGLRenderer;
  /**
   * Optional benchmark frame callback. Called with the heuristic tier first so the caller can apply
   * those settings before rendering. Omit to skip the benchmark and use heuristics only.
   */
  readonly prepareBenchmark?: (heuristicTier: GraphicsTier) => void;
  readonly renderFrame?: (t: number) => void;
  readonly durationMs?: number;
}

/**
 * Full boot flow: detect device → reuse cached tier for this GPU, or estimate + benchmark → cache.
 */
export async function resolveInitialTier(
  opts: ResolveInitialTierOptions
): Promise<InitialTierResolution> {
  const profile = detectDeviceProfile(opts.renderer);
  const cacheKey = getDeviceCacheKey(profile);
  const heuristicTier = estimateInitialTier(profile);

  const cached = readCachedPerf(cacheKey);
  if (cached) {
    return { tier: cached.tier, profile, cacheKey, heuristicTier, benchmark: null, fromCache: true };
  }

  if (!opts.renderFrame) {
    return { tier: heuristicTier, profile, cacheKey, heuristicTier, benchmark: null, fromCache: false };
  }

  opts.prepareBenchmark?.(heuristicTier);
  const benchmark = await runStartupBenchmark({
    renderFrame: opts.renderFrame,
    durationMs: opts.durationMs,
  });
  let tier = tierFromBenchmark(heuristicTier, benchmark);
  // Never exceed what the hardware heuristics allow by more than one step.
  if (compareTiers(tier, stepTier(heuristicTier, 1)) > 0) tier = stepTier(heuristicTier, 1);

  writeCachedPerf(cacheKey, {
    tier,
    avgMs: benchmark.avgMs,
    p95Ms: benchmark.p95Ms,
    savedAt: Date.now(),
  });
  return { tier, profile, cacheKey, heuristicTier, benchmark, fromCache: false };
}
