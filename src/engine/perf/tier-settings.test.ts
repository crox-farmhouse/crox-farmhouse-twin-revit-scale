import { describe, expect, it } from 'vitest';
import {
  GRAPHICS_TIER_ORDER,
  clampPixelRatioForTier,
  compareTiers,
  getPointLightBudget,
  getTierPixelRatioRange,
  getTierSettings,
  isGraphicsTier,
  stepTier,
  withPixelRatio,
} from './tier-settings.ts';

describe('tier-settings', () => {
  it('orders and steps tiers with clamping', () => {
    expect(GRAPHICS_TIER_ORDER).toEqual(['low', 'medium', 'high', 'ultra']);
    expect(stepTier('low', -1)).toBe('low');
    expect(stepTier('low', 1)).toBe('medium');
    expect(stepTier('high', 5)).toBe('ultra');
    expect(compareTiers('low', 'ultra')).toBeLessThan(0);
    expect(compareTiers('high', 'high')).toBe(0);
    expect(isGraphicsTier('medium')).toBe(true);
    expect(isGraphicsTier('auto')).toBe(false);
  });

  it('derives pixel-ratio ranges from the device pixel ratio', () => {
    expect(getTierPixelRatioRange('low', 3)).toEqual({ min: 0.75, max: 1 });
    expect(getTierPixelRatioRange('medium', 3)).toEqual({ min: 0.85, max: 1 });
    expect(getTierPixelRatioRange('high', 3)).toEqual({ min: 1, max: 1.5 });
    expect(getTierPixelRatioRange('ultra', 3)).toEqual({ min: 1.25, max: 2 });
    expect(getTierPixelRatioRange('ultra', 1)).toEqual({ min: 1, max: 1 });
    // Invalid DPR falls back to 1.
    expect(getTierPixelRatioRange('high', Number.NaN)).toEqual({ min: 1, max: 1 });
  });

  it('builds tier settings at the top of the range', () => {
    const low = getTierSettings('low', 2);
    expect(low).toMatchObject({ tier: 'low', pixelRatio: 1, postProcessing: false, shadowMapSize: 1024 });
    const ultra = getTierSettings('ultra', 2);
    expect(ultra).toMatchObject({ tier: 'ultra', pixelRatio: 2, bloom: true, shadowMapSize: 4096 });
  });

  it('clamps pixel ratios into the tier range', () => {
    expect(clampPixelRatioForTier('high', 3, 2)).toBe(1.5);
    expect(clampPixelRatioForTier('high', 0.2, 2)).toBe(1);
    const lowered = withPixelRatio(getTierSettings('ultra', 2), 1.4, 2);
    expect(lowered.pixelRatio).toBe(1.4);
    expect(lowered.tier).toBe('ultra');
  });

  it('gives higher tiers a larger fixed point-light budget', () => {
    const budgets = GRAPHICS_TIER_ORDER.map(getPointLightBudget);
    expect([...budgets].sort((a, b) => a - b)).toEqual(budgets);
    expect(new Set(budgets).size).toBe(budgets.length);
  });
});
