import { describe, expect, it } from 'vitest';
import type { GraphicsTier, GraphicsTierSettings } from '../../core/types/twin-ux.ts';
import { PerformanceGovernor } from './performance-governor.ts';

interface Harness {
  readonly governor: PerformanceGovernor;
  readonly applied: GraphicsTierSettings[];
  readonly toasts: string[];
  readonly autoTiers: GraphicsTier[];
  /** Feeds `count` moving frames of `dtMs`, advancing the fake clock. */
  frames(count: number, dtMs: number, moving?: boolean): void;
  advance(ms: number): void;
}

function createHarness(initialTier: GraphicsTier, devicePixelRatio: number): Harness {
  let clock = 0;
  const applied: GraphicsTierSettings[] = [];
  const toasts: string[] = [];
  const autoTiers: GraphicsTier[] = [];
  const governor = new PerformanceGovernor({
    applyTier: (s) => applied.push(s),
    onToast: (m) => toasts.push(m),
    onAutoTierChange: (t) => autoTiers.push(t),
    devicePixelRatio,
    initialTier,
    now: () => clock,
    persistMode: false,
  });
  return {
    governor,
    applied,
    toasts,
    autoTiers,
    frames(count, dtMs, moving = true) {
      for (let i = 0; i < count; i += 1) {
        clock += dtMs;
        governor.recordFrame(dtMs, moving);
      }
    },
    advance(ms) {
      clock += ms;
    },
  };
}

describe('PerformanceGovernor', () => {
  it('applies the initial tier immediately', () => {
    const h = createHarness('high', 2);
    expect(h.applied).toHaveLength(1);
    expect(h.applied[0]).toMatchObject({ tier: 'high', pixelRatio: 1.5 });
    expect(h.governor.getMode()).toBe('auto');
  });

  it('holds the startup-estimated tier and pixel ratio constant across slow and fast frames', () => {
    const h = createHarness('high', 2);
    h.frames(200, 30);
    expect(h.governor.hasPendingChange()).toBe(false);
    h.governor.notifyCameraIdle();
    expect(h.applied).toHaveLength(1);
    expect(h.governor.getActiveSettings()).toMatchObject({ tier: 'high', pixelRatio: 1.5 });
    expect(h.toasts).toEqual([]);
    expect(h.autoTiers).toEqual([]);

    h.frames(1400, 8);
    expect(h.governor.hasPendingChange()).toBe(false);
    h.governor.notifyCameraIdle();
    expect(h.applied).toHaveLength(1);
    expect(h.governor.getActiveSettings()).toMatchObject({ tier: 'high', pixelRatio: 1.5 });
  });

  it('ignores frames while the camera is idle and hitch frames', () => {
    const h = createHarness('high', 2);
    h.frames(300, 30, false);
    h.frames(300, 400);
    expect(h.governor.hasPendingChange()).toBe(false);
    expect(h.governor.getStats().p95Ms).toBe(0);
  });

  it('never adapts in a pinned manual mode', () => {
    const h = createHarness('high', 2);
    h.governor.setMode('ultra');
    expect(h.governor.getActiveTier()).toBe('ultra');
    h.frames(300, 50);
    expect(h.governor.hasPendingChange()).toBe(false);
    h.governor.setMode('auto');
    expect(h.governor.getActiveTier()).toBe('high');
  });

  it('reports fps and p95 from the rolling window', () => {
    const h = createHarness('high', 2);
    h.frames(40, 16);
    const stats = h.governor.getStats();
    expect(stats.p95Ms).toBe(16);
    expect(stats.fps).toBeCloseTo(62.5, 5);
    expect(stats.tier).toBe('high');
  });

  it('re-applies the tier when the device pixel ratio changes', () => {
    const h = createHarness('ultra', 2);
    h.governor.setDevicePixelRatio(1);
    expect(h.governor.getActiveSettings()).toMatchObject({ tier: 'ultra', pixelRatio: 1 });
  });
});
