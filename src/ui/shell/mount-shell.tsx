import { effect } from '@preact/signals';
import { render } from 'preact';
import {
  devMode,
  guestMode,
  hasSeenHelp,
  isMobile,
  navigatorOpen,
  openHelp,
  readStoredGraphicsMode,
  roomPanelOpen,
  setDevMode,
} from '../../state/shell-store.ts';
import { twinStore } from '../../state/twin-store.ts';
import { readShareStateFromLocation } from '../../state/url-state.ts';
import { AppShell } from './AppShell.tsx';
import { bindShellKeyboard } from './keyboard.ts';
import { ShellController, type ShellDeps } from './shell-controller.ts';

/** Reflects shell state as body classes so CSS can gate legacy/developer UI. */
function bindBodyClasses(): void {
  const body = document.body;
  effect(() => {
    body.classList.toggle('is-dev-mode', devMode.value);
  });
  effect(() => {
    body.classList.toggle('is-guest', guestMode.value);
  });
  effect(() => {
    body.classList.toggle('is-mobile', isMobile.value);
  });
  effect(() => {
    body.classList.toggle('has-nav', navigatorOpen.value && !isMobile.value);
  });
  effect(() => {
    body.classList.toggle('has-panel', roomPanelOpen.value && !isMobile.value);
  });
}

/** Docks the annotator inspector (note editor / measure readout) above the tool dock. */
function bindAnnotatorInspector(): void {
  const panel = document.getElementById('annotator-panel');
  if (!panel) return;
  effect(() => {
    const visible = twinStore.annotatorActive.value || twinStore.selectedAnnotationId.value !== null;
    panel.classList.toggle('is-open', visible);
    document.body.classList.toggle('is-annotating', twinStore.annotatorActive.value);
  });
}

/**
 * Mounts the Preact app shell (top bar, room navigator, room panel, tool dock,
 * settings, developer drawer, help) and applies URL state (`?dev=`, `?v=`).
 */
export function mountAppShell(deps: ShellDeps, root: HTMLElement): ShellController {
  const params = new URLSearchParams(window.location.search);
  const devParam = params.get('dev');
  if (devParam === '1') setDevMode(true);
  else if (devParam === '0') setDevMode(false);

  const ctl = new ShellController(deps);
  ctl.init();

  const share = readShareStateFromLocation();
  if (share) {
    guestMode.value = share.guest;
  } else {
    const storedMode = readStoredGraphicsMode();
    if (storedMode && storedMode !== deps.scene.getGraphicsMode()) ctl.setGraphicsMode(storedMode);
  }

  bindBodyClasses();
  bindAnnotatorInspector();
  bindShellKeyboard(ctl);
  render(<AppShell ctl={ctl} />, root);

  if (share) ctl.applyShareState(share);
  if (!hasSeenHelp()) {
    window.setTimeout(() => openHelp(0), 600);
  }
  return ctl;
}
