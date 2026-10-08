import type { JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { devDrawerOpen, devMode, devTab, type DevTab } from '../../state/shell-store.ts';
import { Icon } from './icons.tsx';
import { useShell } from './shell-context.ts';

const TABS: readonly { readonly id: DevTab; readonly label: string }[] = [
  { id: 'smart-home', label: 'Smart home & KNX' },
  { id: 'usd', label: 'OpenUSD' },
  { id: 'diagnostics', label: 'Tools' },
];

/** Moves an existing legacy DOM node (by id) into a container exactly once. */
function useAdoptElement(elementId: string): (host: HTMLDivElement | null) => void {
  const adopted = useRef(false);
  return (host) => {
    if (!host || adopted.current) return;
    const el = document.getElementById(elementId);
    if (el) {
      host.appendChild(el);
      el.hidden = false;
      adopted.current = true;
    }
  };
}

/**
 * Developer drawer. Hosts the legacy controllers' DOM (KNX HUD, OpenUSD stage)
 * so their behaviour is unchanged, but keeps them out of the everyday UI.
 */
export function DevDrawer(): JSX.Element {
  const ctl = useShell();
  const enabled = devMode.value;
  const open = enabled && devDrawerOpen.value;
  const tab = devTab.value;
  const adoptHud = useAdoptElement('hud-panel');
  const adoptUsd = useAdoptElement('usd-stage-panel');
  const [blurOn, setBlurOn] = useState(() => ctl.deps.scene.isMotionBlurEnabled());

  // Leaving developer mode leaves any developer-only tool too.
  useEffect(() => {
    if (!enabled) devDrawerOpen.value = false;
  }, [enabled]);

  return (
    <aside class={`shell-dev shell-glass${open ? ' is-open' : ''}`} aria-label="Developer tools" hidden={!open}>
      <div class="shell-panel-head">
        <span class="shell-panel-title">
          <Icon name="code" size={15} /> Developer
        </span>
        <button
          type="button"
          class="shell-icon-btn shell-icon-btn-sm"
          aria-label="Close developer tools"
          onClick={() => {
            devDrawerOpen.value = false;
          }}
        >
          <Icon name="close" size={16} />
        </button>
      </div>
      <div class="shell-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            class={`shell-tab${tab === t.id ? ' is-active' : ''}`}
            onClick={() => {
              devTab.value = t.id;
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div class="shell-dev-scroll">
        <div class="shell-dev-host" ref={adoptHud} hidden={tab !== 'smart-home'} />
        <div class="shell-dev-host" ref={adoptUsd} hidden={tab !== 'usd'} />
        <div class="shell-dev-host shell-dev-tools" hidden={tab !== 'diagnostics'}>
          <section class="shell-card">
            <div class="shell-card-head">
              <span class="shell-card-title">Object tools</span>
            </div>
            <p class="shell-muted">Move or rotate furniture and fittings; changes are saved as notes.</p>
            <div class="shell-chips">
              <button type="button" class="shell-chip shell-chip-lg" onClick={() => ctl.deps.annotator.activateTool('move')}>
                Move object
              </button>
              <button type="button" class="shell-chip shell-chip-lg" onClick={() => ctl.deps.annotator.activateTool('rotate')}>
                Rotate object
              </button>
              <button type="button" class="shell-chip shell-chip-lg" onClick={() => ctl.downloadNotesUsda()}>
                Export notes as USDA
              </button>
            </div>
          </section>
          <section class="shell-card">
            <div class="shell-card-head">
              <span class="shell-card-title">Rendering</span>
            </div>
            <div class="shell-row">
              <span>Camera motion blur</span>
              <button
                type="button"
                class={`shell-switch${blurOn ? ' is-on' : ''}`}
                role="switch"
                aria-checked={blurOn}
                aria-label="Camera motion blur"
                onClick={() => setBlurOn(ctl.deps.scene.toggleMotionBlur())}
              >
                <span class="shell-switch-knob" />
              </button>
            </div>
            <p class="shell-muted">LOD policy, legacy quality presets and UFH layer live under Smart home &amp; KNX.</p>
          </section>
        </div>
      </div>
    </aside>
  );
}
