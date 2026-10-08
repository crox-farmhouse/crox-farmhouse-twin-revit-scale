import type { GraphicsMode, GraphicsTier, GraphicsTierSettings } from '../../types/twin-ux.ts';
import { percentile } from './benchmark.ts';
import {
  compareTiers,
  getTierPixelRatioRange,
  getTierSettings,
  isGraphicsTier,
  stepTier,
  withPixelRatio,
} from './tier-settings.ts';

export const GRAPHICS_MODE_STORAGE_KEY = 'crox_twin_graphics_mode_v1';

/** Rolling sample window (ms of wall-clock time while the camera is moving). */
const WINDOW_MS = 2000;
/** Minimum samples in the window before p95 is trusted. */
const MIN_WINDOW_SAMPLES = 20;
/** Frame deltas above this are hitches (tab switch, GC, shader compile) and are ignored. */
const MAX_VALID_FRAME_MS = 250;

const STEP_DOWN_P95_MS = 22;
const STEP_DOWN_SUSTAIN_MS = 3000;
/** p95 above this is so far off budget that 0.1 resolution steps would take too long: drop a tier. */
const SEVERE_P95_MS = 45;
const STEP_UP_P95_MS = 12;
const STEP_UP_SUSTAIN_MS = 10000;
const MIN_MS_BETWEEN_UPGRADES = 8000;
const PIXEL_RATIO_STEP = 0.1;

/** After stepping down from a tier, block returning to it for this long (doubles per repeat). */
const TIER_BLOCK_BASE_MS = 30000;
const TIER_BLOCK_MAX_MS = 300000;

export const QUALITY_REDUCED_TOAST = 'Quality adjusted for smooth performance';

export interface PerformanceGovernorOptions {
  /** Applies concrete settings (pixel ratio, post, shadows, LOD). Must never change lighting. */
  readonly applyTier: (settings: GraphicsTierSettings) => void;
  readonly onToast?: (msg: string) => void;
  readonly devicePixelRatio: number;
  /** Tier used for `auto` mode at startup (from heuristics / benchmark / cache). */
  readonly initialTier: GraphicsTier;
  /** Notified when the auto governor settles on a new tier (e.g. to update the perf cache). */
  readonly onAutoTierChange?: (tier: GraphicsTier) => void;
  /** Injectable clock for tests. Defaults to `performance.now()`. */
  readonly now?: () => number;
  /** Set false to skip `localStorage` persistence of the mode (tests). */
  readonly persistMode?: boolean;
}

export interface PerformanceGovernorStats {
  readonly fps: number;
  readonly p95Ms: number;
  readonly tier: GraphicsTier;
  readonly pixelRatio: number;
}

interface FrameSample {
  readonly t: number;
  readonly dt: number;
}

interface PendingChange {
  readonly settings: GraphicsTierSettings;
  readonly direction: 'down' | 'up';
}

function isGraphicsMode(value: unknown): value is GraphicsMode {
  return value === 'auto' || isGraphicsTier(value);
}

/**
 * Runtime graphics auto-tune ("governor").
 *
 * - Samples frame times only while the camera moves (idle scenes do not redraw).
 * - Rolling 2 s window; p95 > 22 ms sustained for 3 s of motion → step down (pixel ratio in 0.1 steps
 *   to the tier minimum, then the next lower tier; p95 > 45 ms skips straight to the lower tier). p95 < 12 ms sustained for 10 s → step up (pixel
 *   ratio back to the tier max, then the next tier), at most once per 8 s, and never back into a tier
 *   that recently failed (exponential back-off).
 * - Decisions are queued and only applied from {@link notifyCameraIdle}, never mid-drag.
 * - Manual modes pin the tier; the governor then never adapts.
 * - Never touches lighting: it only emits {@link GraphicsTierSettings}.
 */
export class PerformanceGovernor {
  private readonly applyTierFn: (settings: GraphicsTierSettings) => void;
  private readonly onToast?: (msg: string) => void;
  private readonly onAutoTierChange?: (tier: GraphicsTier) => void;
  private readonly now: () => number;
  private readonly persistMode: boolean;
  private devicePixelRatio: number;

  private mode: GraphicsMode = 'auto';
  private autoTier: GraphicsTier;
  private active: GraphicsTierSettings;
  private pending: PendingChange | null = null;

  private samples: FrameSample[] = [];
  private lastWindowP95 = 0;
  private lastWindowAvg = 0;
  private slowAccumMs = 0;
  private fastAccumMs = 0;
  private lastChangeMs = Number.NEGATIVE_INFINITY;
  private readonly tierBlockedUntil = new Map<GraphicsTier, number>();
  private readonly tierBlockMs = new Map<GraphicsTier, number>();

  public constructor(opts: PerformanceGovernorOptions) {
    this.applyTierFn = opts.applyTier;
    this.onToast = opts.onToast;
    this.onAutoTierChange = opts.onAutoTierChange;
    this.now = opts.now ?? (() => performance.now());
    this.persistMode = opts.persistMode ?? true;
    this.devicePixelRatio = opts.devicePixelRatio > 0 ? opts.devicePixelRatio : 1;
    this.autoTier = opts.initialTier;

    const stored = this.readStoredMode();
    if (stored) this.mode = stored;

    const tier = this.mode === 'auto' ? this.autoTier : this.mode;
    this.active = getTierSettings(tier, this.devicePixelRatio);
    this.applyTierFn(this.active);
  }

  // -------------------------------------------------------------------------
  // Mode
  // -------------------------------------------------------------------------

  /** Switches between `auto` and a pinned tier. Applied immediately (explicit user action). */
  public setMode(mode: GraphicsMode): void {
    this.mode = mode;
    this.writeStoredMode(mode);
    this.pending = null;
    this.resetMeasurements();

    const tier = mode === 'auto' ? this.autoTier : mode;
    if (mode === 'auto') {
      // Clear back-off so a user explicitly re-enabling auto gets a fresh evaluation.
      this.tierBlockedUntil.clear();
      this.tierBlockMs.clear();
    }
    this.commit(getTierSettings(tier, this.devicePixelRatio));
  }

  public getMode(): GraphicsMode {
    return this.mode;
  }

  public getActiveTier(): GraphicsTier {
    return this.active.tier;
  }

  public getActiveSettings(): GraphicsTierSettings {
    return this.active;
  }

  /**
   * Replaces the auto tier (e.g. when a deferred startup benchmark finishes). Applied immediately in
   * `auto` mode; remembered for later in manual modes.
   */
  public setAutoTier(tier: GraphicsTier): void {
    this.autoTier = tier;
    if (this.mode !== 'auto' || tier === this.active.tier) return;
    this.pending = null;
    this.resetMeasurements();
    this.commit(getTierSettings(tier, this.devicePixelRatio));
  }

  /** Updates the device DPR (e.g. window moved to another monitor) and re-applies the current tier. */
  public setDevicePixelRatio(devicePixelRatio: number): void {
    if (!(devicePixelRatio > 0) || devicePixelRatio === this.devicePixelRatio) return;
    this.devicePixelRatio = devicePixelRatio;
    this.pending = null;
    this.commit(withPixelRatio(this.active, this.active.pixelRatio, devicePixelRatio));
  }

  // -------------------------------------------------------------------------
  // Sampling
  // -------------------------------------------------------------------------

  /** Records one rendered frame. Only frames rendered while the camera moves are measured. */
  public recordFrame(dtMs: number, cameraMoving: boolean): void {
    if (!cameraMoving || !(dtMs > 0) || dtMs > MAX_VALID_FRAME_MS) return;

    const t = this.now();
    this.samples.push({ t, dt: dtMs });
    const cutoff = t - WINDOW_MS;
    let drop = 0;
    while (drop < this.samples.length && this.samples[drop]!.t < cutoff) drop += 1;
    if (drop > 0) this.samples.splice(0, drop);

    if (this.samples.length < MIN_WINDOW_SAMPLES) return;

    const dts = this.samples.map((s) => s.dt);
    this.lastWindowP95 = percentile(dts, 0.95);
    this.lastWindowAvg = dts.reduce((sum, d) => sum + d, 0) / dts.length;

    if (this.mode !== 'auto' || this.pending) return;

    // Sustain timers accumulate moving time only, so idle gaps neither count nor reset them.
    if (this.lastWindowP95 > STEP_DOWN_P95_MS) {
      this.slowAccumMs += dtMs;
      this.fastAccumMs = 0;
    } else if (this.lastWindowP95 < STEP_UP_P95_MS) {
      this.fastAccumMs += dtMs;
      this.slowAccumMs = 0;
    } else {
      // Hysteresis band (12–22 ms): hold steady.
      this.slowAccumMs = 0;
      this.fastAccumMs = 0;
    }

    if (this.slowAccumMs >= STEP_DOWN_SUSTAIN_MS) {
      this.queueStepDown();
    } else if (
      this.fastAccumMs >= STEP_UP_SUSTAIN_MS &&
      t - this.lastChangeMs >= MIN_MS_BETWEEN_UPGRADES
    ) {
      this.queueStepUp(t);
    }
  }

  /** Call when the camera comes to rest; applies any queued quality change. */
  public notifyCameraIdle(): void {
    const change = this.pending;
    if (!change) return;
    this.pending = null;
    if (this.mode !== 'auto') return;

    const prevTier = this.active.tier;
    this.commit(change.settings);
    this.resetMeasurements();

    if (change.settings.tier !== prevTier) {
      this.autoTier = change.settings.tier;
      this.onAutoTierChange?.(change.settings.tier);
    }
    if (change.direction === 'down') this.onToast?.(QUALITY_REDUCED_TOAST);
  }

  /** True when a change is queued and waiting for the camera to settle. */
  public hasPendingChange(): boolean {
    return this.pending !== null;
  }

  public getStats(): PerformanceGovernorStats {
    return {
      fps: this.lastWindowAvg > 0 ? 1000 / this.lastWindowAvg : 0,
      p95Ms: this.lastWindowP95,
      tier: this.active.tier,
      pixelRatio: this.active.pixelRatio,
    };
  }

  // -------------------------------------------------------------------------
  // Decisions
  // -------------------------------------------------------------------------

  private queueStepDown(): void {
    const cur = this.active;
    const range = getTierPixelRatioRange(cur.tier, this.devicePixelRatio);
    const nextRatio = Math.round((cur.pixelRatio - PIXEL_RATIO_STEP) * 100) / 100;
    const severe = this.lastWindowP95 > SEVERE_P95_MS;

    if (!severe && nextRatio >= range.min - 1e-6) {
      this.pending = {
        settings: withPixelRatio(cur, nextRatio, this.devicePixelRatio),
        direction: 'down',
      };
    } else if (cur.tier !== 'low') {
      const lower = stepTier(cur.tier, -1);
      this.blockTier(cur.tier);
      this.pending = { settings: getTierSettings(lower, this.devicePixelRatio), direction: 'down' };
    } else {
      // Already at the floor; nothing left to reduce.
      this.slowAccumMs = 0;
    }
  }

  private queueStepUp(nowMs: number): void {
    const cur = this.active;
    const range = getTierPixelRatioRange(cur.tier, this.devicePixelRatio);
    const nextRatio = Math.round((cur.pixelRatio + PIXEL_RATIO_STEP) * 100) / 100;

    if (cur.pixelRatio < range.max - 1e-6) {
      this.pending = {
        settings: withPixelRatio(cur, Math.min(range.max, nextRatio), this.devicePixelRatio),
        direction: 'up',
      };
      return;
    }

    const higher = stepTier(cur.tier, 1);
    const blockedUntil = this.tierBlockedUntil.get(higher) ?? Number.NEGATIVE_INFINITY;
    if (compareTiers(higher, cur.tier) <= 0 || nowMs < blockedUntil) {
      this.fastAccumMs = 0;
      return;
    }
    // Enter the higher tier at its lowest resolution; later upgrades raise the ratio.
    const base = getTierSettings(higher, this.devicePixelRatio);
    const minRatio = getTierPixelRatioRange(higher, this.devicePixelRatio).min;
    this.pending = {
      settings: withPixelRatio(base, minRatio, this.devicePixelRatio),
      direction: 'up',
    };
  }

  private blockTier(tier: GraphicsTier): void {
    const prev = this.tierBlockMs.get(tier);
    const duration = prev === undefined ? TIER_BLOCK_BASE_MS : Math.min(TIER_BLOCK_MAX_MS, prev * 2);
    this.tierBlockMs.set(tier, duration);
    this.tierBlockedUntil.set(tier, this.now() + duration);
  }

  private commit(settings: GraphicsTierSettings): void {
    this.active = settings;
    this.lastChangeMs = this.now();
    this.applyTierFn(settings);
  }

  private resetMeasurements(): void {
    this.samples = [];
    this.slowAccumMs = 0;
    this.fastAccumMs = 0;
  }

  // -------------------------------------------------------------------------
  // Persistence
  // -------------------------------------------------------------------------

  private readStoredMode(): GraphicsMode | null {
    if (!this.persistMode) return null;
    try {
      const raw = localStorage.getItem(GRAPHICS_MODE_STORAGE_KEY);
      return isGraphicsMode(raw) ? raw : null;
    } catch {
      return null;
    }
  }

  private writeStoredMode(mode: GraphicsMode): void {
    if (!this.persistMode) return;
    try {
      localStorage.setItem(GRAPHICS_MODE_STORAGE_KEY, mode);
    } catch {
      // Storage unavailable; mode lasts for this session only.
    }
  }
}
