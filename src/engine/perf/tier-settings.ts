import type { GraphicsTier, GraphicsTierSettings } from '../../core/types/twin-ux.ts';

/** Tiers ordered from cheapest to most expensive. */
export const GRAPHICS_TIER_ORDER: readonly GraphicsTier[] = ['low', 'medium', 'high', 'ultra'];

export function isGraphicsTier(value: unknown): value is GraphicsTier {
  return value === 'low' || value === 'medium' || value === 'high' || value === 'ultra';
}

/** Returns the tier `delta` steps away from `tier`, clamped to the valid range. */
export function stepTier(tier: GraphicsTier, delta: number): GraphicsTier {
  const idx = GRAPHICS_TIER_ORDER.indexOf(tier);
  const next = Math.max(0, Math.min(GRAPHICS_TIER_ORDER.length - 1, idx + Math.round(delta)));
  return GRAPHICS_TIER_ORDER[next]!;
}

/** Signed comparison of two tiers (negative if `a` is cheaper than `b`). */
export function compareTiers(a: GraphicsTier, b: GraphicsTier): number {
  return GRAPHICS_TIER_ORDER.indexOf(a) - GRAPHICS_TIER_ORDER.indexOf(b);
}

export interface PixelRatioRange {
  readonly min: number;
  readonly max: number;
}

function sanitizeDpr(devicePixelRatio: number): number {
  return Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
}

function roundRatio(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Allowed render pixel-ratio range for a tier. The runtime governor lowers resolution in 0.1 steps
 * within this range before dropping a whole tier.
 *
 * | Tier   | min                | max            |
 * | :----- | :----------------- | :------------- |
 * | low    | 0.75               | min(DPR, 1.0)  |
 * | medium | 0.85               | 1.0            |
 * | high   | 1.0                | min(DPR, 1.5)  |
 * | ultra  | min(max, 1.25)     | min(DPR, 2.0)  |
 */
export function getTierPixelRatioRange(
  tier: GraphicsTier,
  devicePixelRatio: number
): PixelRatioRange {
  const dpr = sanitizeDpr(devicePixelRatio);
  switch (tier) {
    case 'low': {
      const max = Math.max(0.75, Math.min(dpr, 1.0));
      return { min: 0.75, max: roundRatio(max) };
    }
    case 'medium':
      return { min: 0.85, max: 1.0 };
    case 'high': {
      const max = Math.max(1.0, Math.min(dpr, 1.5));
      return { min: 1.0, max: roundRatio(max) };
    }
    case 'ultra': {
      const max = Math.max(1.0, Math.min(dpr, 2.0));
      return { min: roundRatio(Math.min(max, 1.25)), max: roundRatio(max) };
    }
  }
}

/** Clamps a pixel ratio into the tier's allowed range. */
export function clampPixelRatioForTier(
  tier: GraphicsTier,
  pixelRatio: number,
  devicePixelRatio: number
): number {
  const range = getTierPixelRatioRange(tier, devicePixelRatio);
  return roundRatio(Math.max(range.min, Math.min(range.max, pixelRatio)));
}

interface TierFeatureRow {
  readonly postProcessing: boolean;
  readonly ambientOcclusion: boolean;
  readonly bloom: boolean;
  readonly sharpen: boolean;
  readonly shadowMapSize: 1024 | 2048 | 4096;
  readonly lodDistanceScale: number;
  readonly highDetailMaxDistance: number;
  readonly pointLightBudget: number;
}

/** Plan section 2.2 tier table. Lighting intensities are intentionally absent. */
const TIER_TABLE: Readonly<Record<GraphicsTier, TierFeatureRow>> = {
  low: {
    postProcessing: false,
    ambientOcclusion: false,
    bloom: false,
    sharpen: false,
    shadowMapSize: 1024,
    lodDistanceScale: 0.6,
    highDetailMaxDistance: 6,
    pointLightBudget: 8,
  },
  medium: {
    postProcessing: true,
    ambientOcclusion: true,
    bloom: false,
    sharpen: false,
    shadowMapSize: 2048,
    lodDistanceScale: 0.85,
    highDetailMaxDistance: 10,
    pointLightBudget: 16,
  },
  high: {
    postProcessing: true,
    ambientOcclusion: true,
    bloom: false,
    sharpen: true,
    shadowMapSize: 2048,
    lodDistanceScale: 1.0,
    highDetailMaxDistance: 12,
    pointLightBudget: 24,
  },
  ultra: {
    postProcessing: true,
    ambientOcclusion: true,
    bloom: true,
    sharpen: true,
    shadowMapSize: 4096,
    lodDistanceScale: 1.3,
    highDetailMaxDistance: 18,
    pointLightBudget: 32,
  },
};

/**
 * Concrete render settings for `tier`. `pixelRatio` is the top of the tier's range; the governor may
 * lower it via {@link withPixelRatio}.
 */
export function getTierSettings(
  tier: GraphicsTier,
  devicePixelRatio: number
): GraphicsTierSettings {
  const row = TIER_TABLE[tier];
  return {
    tier,
    pixelRatio: getTierPixelRatioRange(tier, devicePixelRatio).max,
    postProcessing: row.postProcessing,
    ambientOcclusion: row.ambientOcclusion,
    bloom: row.bloom,
    sharpen: row.sharpen,
    shadowMapSize: row.shadowMapSize,
    lodDistanceScale: row.lodDistanceScale,
    highDetailMaxDistance: row.highDetailMaxDistance,
  };
}

/** Returns a copy of `settings` with the pixel ratio clamped into the tier's range. */
export function withPixelRatio(
  settings: GraphicsTierSettings,
  pixelRatio: number,
  devicePixelRatio: number
): GraphicsTierSettings {
  return {
    ...settings,
    pixelRatio: clampPixelRatioForTier(settings.tier, pixelRatio, devicePixelRatio),
  };
}

/**
 * Fixed number of shadow-free point lights the batch optimizer may keep active for a tier.
 * The budget is a fixed count per tier (never adapted per-frame) so lighting stays consistent.
 */
export function getPointLightBudget(tier: GraphicsTier): number {
  return TIER_TABLE[tier].pointLightBudget;
}
