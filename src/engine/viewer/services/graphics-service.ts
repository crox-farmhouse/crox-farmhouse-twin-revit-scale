import type { GraphicsMode, GraphicsTierSettings } from '../../../core/types/twin-ux.ts';
import type { EnvironmentLighting } from '../../lighting/environment-lighting.ts';
import type { RoomLodController } from '../../lod/lod-manager.ts';
import {
  PerformanceGovernor,
  detectDeviceProfile,
  estimateInitialTier,
  getDeviceCacheKey,
  getPointLightBudget,
  readCachedPerf,
  updateCachedTier,
  type PerformanceGovernorStats,
} from '../../perf/index.ts';
import type {
  GraphicsQualityPreset,
  GraphicsSettingsState,
} from '../../rendering/post-processing-pipeline.ts';
import type { SceneBatchOptimizer } from '../../rendering/scene-batch-optimizer.ts';
import { Emitter } from '../../util/emitter.ts';
import type { ViewerRenderer } from './viewer-renderer.ts';

export interface GraphicsServiceHost {
  readonly renderer: ViewerRenderer;
  readonly environment: EnvironmentLighting;
  readonly lodController: RoomLodController;
  readonly batchOptimizer: SceneBatchOptimizer;
  /** Re-evaluates cutaways / LOD for the current view after a tier change. */
  refreshView(): void;
}

/**
 * Graphics quality: the auto-tuning `PerformanceGovernor` (persisted mode,
 * cached per-GPU tier), post-processing presets and FPS stats.
 */
export class GraphicsService {
  /** Short user-facing messages such as automatic quality step-downs. */
  public readonly toast = new Emitter<[message: string]>();
  private readonly host: GraphicsServiceHost;
  private readonly governor: PerformanceGovernor;

  public constructor(host: GraphicsServiceHost) {
    this.host = host;
    // Performance auto-tune: cached tier for this GPU, else a device heuristic.
    const deviceProfile = detectDeviceProfile(host.renderer.renderer);
    const perfCacheKey = getDeviceCacheKey(deviceProfile);
    const initialTier = estimateInitialTier(deviceProfile);
    void readCachedPerf;
    void perfCacheKey;
    this.governor = new PerformanceGovernor({
      devicePixelRatio: deviceProfile.devicePixelRatio,
      initialTier,
      applyTier: (settings) => this.applyTier(settings),
      onToast: (message) => this.toast.emit(message),
      onAutoTierChange: (tier) => updateCachedTier(perfCacheKey, tier),
    });
  }

  public getMode(): GraphicsMode {
    return this.governor.getMode();
  }

  public setMode(mode: GraphicsMode): void {
    this.governor.setMode(mode);
    this.host.renderer.requestRender();
  }

  /** Live FPS / tier stats (O(1): last governor window). */
  public getStats(): PerformanceGovernorStats {
    return this.governor.getStats();
  }

  public getSettings(): GraphicsSettingsState {
    return this.host.renderer.post.getSettings();
  }

  public setQualityPreset(preset: GraphicsQualityPreset): void {
    this.host.renderer.post.setQualityPreset(preset);
    this.host.renderer.requestRender();
  }

  public cycleQualityPreset(): GraphicsQualityPreset {
    const next = this.host.renderer.post.cycleQualityPreset();
    this.host.renderer.requestRender();
    return next;
  }

  public isMotionBlurEnabled(): boolean {
    return this.host.renderer.post.isMotionBlurEnabled();
  }

  public toggleMotionBlur(): boolean {
    const next = this.host.renderer.post.toggleMotionBlur();
    this.host.renderer.requestRender();
    return next;
  }

  public setDevicePixelRatio(ratio: number): void {
    this.governor.setDevicePixelRatio(ratio);
  }

  /** Feeds a rendered frame's duration to the governor. */
  public recordFrame(dtMs: number, cameraMoving: boolean): void {
    this.governor.recordFrame(dtMs, cameraMoving);
  }

  /** Applies a pending tier change once the camera is idle. */
  public notifyIdle(): void {
    if (this.governor.hasPendingChange()) this.governor.notifyCameraIdle();
  }

  private applyTier(settings: GraphicsTierSettings): void {
    const { renderer, environment, lodController, batchOptimizer } = this.host;
    renderer.post.applyTierSettings(settings);
    environment.setShadowMapSize(settings.shadowMapSize);
    lodController.setDistanceScale(settings.lodDistanceScale);
    lodController.setHighDetailMaxDistance(settings.highDetailMaxDistance);
    const budget = settings.tier === 'ultra' ? Infinity : getPointLightBudget(settings.tier);
    batchOptimizer.setPointLightBudget(budget);
    this.host.refreshView();
    renderer.invalidateShadows();
    renderer.requestRender();
  }
}
