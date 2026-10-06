import { render, type JSX } from 'preact';
import { twinStore } from '../../state/twin-store.ts';

export function TwinStatusBadge(): JSX.Element {
  const isWalk = twinStore.walkthroughActive.value;
  const floorLabel = twinStore.floorModeLabel.value;
  const onCount = twinStore.activeCircuitsCount.value;
  const totalCount = twinStore.totalCircuitsCount.value;
  const tgCount = twinStore.telegramCount.value;
  const sunClock = twinStore.formattedSunTime.value;
  const fps = twinStore.fpsCount.value;
  const focusLabel = twinStore.focusedApplianceLabel.value;

  return (
    <div
      className="twin-status-badge"
      role="status"
      aria-live="polite"
      title={`Focus: ${focusLabel} · Sun: ${sunClock}`}
    >
      <div className="twin-status-badge-group">
        <span className={`twin-status-pill${isWalk ? ' is-active' : ''}`}>
          {isWalk ? `1P · ${fps} FPS` : floorLabel}
        </span>
        <span className="twin-status-pill">
          {onCount}/{totalCount} CH
        </span>
      </div>
      <div className="twin-status-badge-group">
        <span className="twin-status-pill">{sunClock}</span>
        <span className="twin-status-pill">{tgCount} TG</span>
      </div>
    </div>
  );
}

export function mountTwinStatusBadge(container: HTMLElement): void {
  render(<TwinStatusBadge />, container);
}
