import { render, type JSX } from 'preact';
import { devStore } from '../dev-store.ts';

export function UsdQuickStats(): JSX.Element {
  const summary = devStore.usdParametricSummary.value;
  const cubeStr = summary.cubeCount.toLocaleString();
  const cylStr = summary.cylinderCount.toLocaleString();
  const sphStr = String(summary.sphereCount);

  return (
    <>
      <div className="usd-stat-cell">
        <span className="usd-stat-label">
          PARAMETRIC PRIMS ({summary.parametricPct}%)
        </span>
        <span className="usd-stat-val">
          {cubeStr} Cube · {cylStr} Cyl · {sphStr} Sph
        </span>
      </div>
      <div className="usd-stat-cell">
        <span className="usd-stat-label">RUNTIME .USDA SOURCE OF TRUTH</span>
        <span className="usd-stat-val" style={{ color: '#34d399' }}>
          {summary.usdaZoneCount} / {summary.sublayerCount} Zones Loaded from .usda
        </span>
      </div>
    </>
  );
}

export function mountUsdQuickStats(container: HTMLElement): void {
  render(<UsdQuickStats />, container);
}
