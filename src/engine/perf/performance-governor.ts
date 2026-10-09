import type {
  GraphicsMode,
  GraphicsTier,
  GraphicsTierSettings,
} from '../../core/types/twin-ux.ts';
import { getTierSettings, withPixelRatio } from './tier-settings.ts';

export const GRAPHICS_MODE_STORAGE_KEY = 'crox_twin_graphics_mode_v1';
export const QUALITY_REDUCED_TOAST = 'Graphics quality reduced for smoother navigation';

/** Rolling window length for moving-camera frame samples. */
const WINDOW_MS = 2000;
/** Minimum sample count before reporting p95 / fps. */
const MIN_WINDOW_SAMPLES = 20;
/** Frames longer than this are treated as tab-switch / shader-compile hitches and ignored. */
const MAX_VALID_FRAME_MS = 250;

export interface PerformanceGovernorOptions {
  readonly applyTier: (settings: GraphicsTierSettings) => void;
  readonly onToast?: (message: string) => void;
  /** Called when `auto` tier is updated (e.g. startup benchmark). */
  readonly onAutoTierChange?: (tier: GraphicsTier) => void;
  readonly devicePixelRatio: number;
  readonly initialTier: GraphicsTier;
  /** Clock override (milliseconds) for deterministic unit tests. */
  readonly now?: () => number;
  /** Set `false` in unit tests to skip `localStorage`. Defaults to `true`. */
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

/**
 * Estimates graphics quality at startup (or honours a user-pinned tier) and holds
 * that quality constant throughout the session while tracking moving-camera FPS / p95
 * telemetry for the Settings panel.
 */
export class PerformanceGovernor {
  private readonly applyTierFn: (settings: GraphicsTierSettings) => void;
  private readonly onAutoTierChange?: (tier: GraphicsTier) => void;
  private readonly now: () => number;
  private readonly persistMode: boolean;

  private devicePixelRatio: number;
  private mode: GraphicsMode = 'auto';
  private autoTier: GraphicsTier;
  private active: GraphicsTierSettings;

  private samples: FrameSample[] = [];
  private lastWindowP95 = 0;
  private lastWindowAvg = 0;

  public constructor(opts: PerformanceGovernorOptions) {
    this.applyTierFn = opts.applyTier;
    this.onAutoTierChange = opts.onAutoTierChange;
    this.devicePixelRatio = opts.devicePixelRatio > 0 ? opts.devicePixelRatio : 1;
    this.autoTier = opts.initialTier;
    this.now = opts.now ?? (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));
    this.persistMode = opts.persistMode ?? true;

    const stored = this.readStoredMode();
    if (stored) this.mode = stored;

    const tier = this.mode === 'auto' ? this.autoTier : this.mode;
    this.active = getTierSettings(tier, this.devicePixelRatio);
    this.applyTierFn(this.active);
  }

  /** Switches between `auto` and a pinned tier. Applied immediately (explicit user action). */
  public setMode(mode: GraphicsMode): void {
    this.mode = mode;
    this.writeStoredMode(mode);
    this.resetMeasurements();

    const tier = mode === 'auto' ? this.autoTier : mode;
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
   * Replaces the startup auto tier (e.g. when a startup benchmark finishes). Applied immediately in
   * `auto` mode; remembered for later in manual modes.
   */
  public setAutoTier(tier: GraphicsTier): void {
    this.autoTier = tier;
    this.onAutoTierChange?.(tier);
    if (this.mode !== 'auto' || tier === this.active.tier) return;
    this.resetMeasurements();
    this.commit(getTierSettings(tier, this.devicePixelRatio));
  }

  /** Updates the device DPR (e.g. window moved to another monitor) and re-applies the current tier. */
  public setDevicePixelRatio(devicePixelRatio: number): void {
    if (!(devicePixelRatio > 0) || devicePixelRatio === this.devicePixelRatio) return;
    this.devicePixelRatio = devicePixelRatio;
    this.commit(withPixelRatio(this.active, this.active.pixelRatio, devicePixelRatio));
  }

  /** Records one rendered frame for FPS / p95 telemetry. Quality tier stays constant. */
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
  }

  /** Retained for API compatibility; quality never changes mid-session. */
  public notifyCameraIdle(): void {
    // No-op: quality is estimated once at startup and held constant.
  }

  /** Always false: quality is estimated once at startup and held constant. */
  public hasPendingChange(): boolean {
    return false;
  }

  public getStats(): PerformanceGovernorStats {
    return {
      fps: this.lastWindowAvg > 0 ? 1000 / this.lastWindowAvg : 0,
      p95Ms: this.lastWindowP95,
      tier: this.active.tier,
      pixelRatio: this.active.pixelRatio,
    };
  }

  private commit(settings: GraphicsTierSettings): void {
    this.active = settings;
    this.applyTierFn(settings);
  }

  private resetMeasurements(): void {
    this.samples = [];
  }

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

function isGraphicsMode(v: string | null): v is GraphicsMode {
  return v === 'auto' || v === 'low' || v === 'medium' || v === 'high' || v === 'ultra';
}

function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[idx]!;
}
