import type { JSX } from 'preact';
import { useEffect } from 'preact/hooks';
import {
  devMode,
  graphicsFps,
  graphicsMode,
  graphicsTierLabel,
  guestMode,
  setDevMode,
  setUnits,
  settingsOpen,
  units,
} from '../../state/shell-store.ts';
import type { GraphicsMode } from '../../core/types/twin-ux.ts';
import { Icon } from './icons.tsx';
import { useShell } from './shell-context.ts';

const GRAPHICS_OPTIONS: readonly { readonly id: GraphicsMode; readonly label: string; readonly hint: string }[] = [
  { id: 'auto', label: 'Auto (recommended)', hint: 'Adapts quality to keep movement smooth on this device' },
  { id: 'low', label: 'Low', hint: 'Fastest · no post effects' },
  { id: 'medium', label: 'Medium', hint: 'Ambient occlusion · balanced' },
  { id: 'high', label: 'High', hint: 'Sharper image and shadows' },
  { id: 'ultra', label: 'Ultra', hint: 'Every effect · best on a fast GPU' },
];

export const SHORTCUTS: readonly { readonly keys: string; readonly action: string }[] = [
  { keys: 'Drag', action: 'Orbit around the model' },
  { keys: 'Right-drag / Shift-drag', action: 'Pan' },
  { keys: 'Scroll / pinch', action: 'Zoom' },
  { keys: 'Double-click', action: 'Jump into the room you clicked' },
  { keys: 'F', action: 'Recenter on the current room' },
  { keys: '1 / 2 / 3', action: 'Ground / First / All floors' },
  { keys: 'W', action: 'Walk mode (WASD to move, Esc to leave)' },
  { keys: 'M', action: 'Measure tool' },
  { keys: 'N', action: 'Note tool' },
  { keys: '?', action: 'Help' },
  { keys: 'Esc', action: 'Close panels / back to Orbit' },
];

export function SettingsModal(): JSX.Element | null {
  const ctl = useShell();
  const open = settingsOpen.value;

  // Refresh tier / FPS while the dialog is visible.
  useEffect(() => {
    if (!open) return undefined;
    ctl.refreshGraphicsReadout();
    const timer = window.setInterval(() => ctl.refreshGraphicsReadout(), 1000);
    return () => window.clearInterval(timer);
  }, [open, ctl]);

  if (!open) return null;
  const mode = graphicsMode.value;
  const fps = graphicsFps.value;
  const close = (): void => {
    settingsOpen.value = false;
  };

  return (
    <div class="shell-modal-backdrop" onClick={close}>
      <div
        class="shell-modal shell-glass"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shell-settings-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="shell-modal-head">
          <h2 id="shell-settings-title">Settings</h2>
          <button type="button" class="shell-icon-btn" aria-label="Close settings" onClick={close}>
            <Icon name="close" />
          </button>
        </div>

        <div class="shell-modal-body">
          <section class="shell-settings-section">
            <h3>Graphics</h3>
            <p class="shell-muted">
              Current: <strong>{graphicsTierLabel.value || '—'}</strong>
              {fps !== null && <> · {Math.round(fps)} fps</>}
            </p>
            <div class="shell-radio-list" role="radiogroup" aria-label="Graphics quality">
              {GRAPHICS_OPTIONS.map((o) => (
                <label key={o.id} class={`shell-radio${mode === o.id ? ' is-checked' : ''}`}>
                  <input
                    type="radio"
                    name="shell-graphics"
                    value={o.id}
                    checked={mode === o.id}
                    onChange={() => ctl.setGraphicsMode(o.id)}
                  />
                  <span class="shell-radio-text">
                    <span>{o.label}</span>
                    <span class="shell-muted">{o.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section class="shell-settings-section">
            <h3>Units</h3>
            <div class="shell-seg" role="group" aria-label="Units">
              <button
                type="button"
                class={`shell-seg-btn${units.value === 'm' ? ' is-active' : ''}`}
                onClick={() => setUnits('m')}
              >
                Metres
              </button>
              <button
                type="button"
                class={`shell-seg-btn${units.value === 'ftin' ? ' is-active' : ''}`}
                onClick={() => setUnits('ftin')}
              >
                Feet &amp; inches
              </button>
            </div>
          </section>

          <section class="shell-settings-section">
            <h3>Controls</h3>
            <dl class="shell-shortcuts">
              {SHORTCUTS.map((s) => (
                <div key={s.keys} class="shell-shortcut">
                  <dt>
                    <kbd>{s.keys}</kbd>
                  </dt>
                  <dd>{s.action}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section class="shell-settings-section">
            <h3>Developer mode</h3>
            {guestMode.value ? (
              <p class="shell-muted">Not available in shared (read-only) views.</p>
            ) : (
              <label class="shell-toggle-row">
                <span class="shell-radio-text">
                  <span>Show developer tools</span>
                  <span class="shell-muted">OpenUSD stage, KNX bus log &amp; parameters, simulators, diagnostics</span>
                </span>
                <button
                  type="button"
                  class={`shell-switch${devMode.value ? ' is-on' : ''}`}
                  role="switch"
                  aria-checked={devMode.value}
                  aria-label="Developer mode"
                  onClick={() => setDevMode(!devMode.value)}
                >
                  <span class="shell-switch-knob" />
                </button>
              </label>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
