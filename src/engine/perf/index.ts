export {
  classifyGpu,
  detectDeviceProfile,
  estimateInitialTier,
  getDeviceCacheKey,
  type DeviceProfile,
} from './device-tier.ts';
export {
  GRAPHICS_TIER_ORDER,
  clampPixelRatioForTier,
  compareTiers,
  getPointLightBudget,
  getTierPixelRatioRange,
  getTierSettings,
  isGraphicsTier,
  stepTier,
  withPixelRatio,
  type PixelRatioRange,
} from './tier-settings.ts';
export {
  PERF_CACHE_STORAGE_KEY,
  percentile,
  readCachedPerf,
  resolveInitialTier,
  runStartupBenchmark,
  tierFromBenchmark,
  updateCachedTier,
  writeCachedPerf,
  type BenchmarkResult,
  type CachedPerfEntry,
  type InitialTierResolution,
  type ResolveInitialTierOptions,
  type StartupBenchmarkOptions,
} from './benchmark.ts';
export {
  GRAPHICS_MODE_STORAGE_KEY,
  PerformanceGovernor,
  QUALITY_REDUCED_TOAST,
  type PerformanceGovernorOptions,
  type PerformanceGovernorStats,
} from './performance-governor.ts';
