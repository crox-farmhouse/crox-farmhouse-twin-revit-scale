import { effect } from '@preact/signals';
import { render, type ComponentType } from 'preact';
import type { TwinApi } from '../../app/twin-api.ts';
import { annotatorActive, selectedAnnotationId } from '../../state/notes-store.ts';
import {
  devMode,
  guestMode,
  isMobile,
  navigatorOpen,
  roomPanelOpen,
  setDevMode,
} from '../../state/shell-store.ts';
import { readShareStateFromLocation } from '../../state/url-state.ts';
import { AnnotatorController } from '../notes/annotator-controller.ts';
import { AppShell } from './AppShell.tsx';
import { bindShellKeyboard } from './keyboard.ts';
import { ShellController } from './shell-controller.ts';

export interface MountShellOptions {
  readonly api: TwinApi;
  /** Developer drawer component (provided by the composition root). */
  readonly devDrawer?: ComponentType;
}

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
    const visible = annotatorActive.value || selectedAnnotationId.value !== null;
    panel.classList.toggle('is-open', visible);
    document.body.classList.toggle('is-annotating', annotatorActive.value);
  });
}

/**
 * Mounts the Preact app shell (top bar, room navigator, room panel, tool dock,
 * settings, developer drawer, help) and applies URL state (`?dev=`, `?v=`).
 */
export function mountAppShell(options: MountShellOptions, root: HTMLElement): ShellController {
  const params = new URLSearchParams(window.location.search);
  const devParam = params.get('dev');
  if (devParam === '1') setDevMode(true);
  else if (devParam === '0') setDevMode(false);

  const notes = new AnnotatorController(options.api);
  const ctl = new ShellController({ api: options.api, notes });
  ctl.init();

  const share = readShareStateFromLocation();
  if (share) guestMode.value = share.guest;

  bindBodyClasses();
  bindAnnotatorInspector();
  bindShellKeyboard(ctl);
  render(<AppShell ctl={ctl} devDrawer={options.devDrawer} />, root);

  if (share) ctl.applyShareState(share);
  return ctl;
}
