import {
  activeTool,
  closeTopOverlay,
  helpOpen,
  openHelp,
  settingsOpen,
} from '../../state/shell-store.ts';
import type { ShellController } from './shell-controller.ts';

function isTypingTarget(el: Element | null): boolean {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return el instanceof HTMLElement && el.isContentEditable;
}

/**
 * Global keyboard shortcuts for the shell:
 * F recenter · 1/2/3 floors · W walk · M measure · N note · ? help · Esc close/back.
 * Walk-mode movement keys are left to the walkthrough controller.
 */
export function bindShellKeyboard(ctl: ShellController): void {
  window.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (isTypingTarget(document.activeElement)) {
      if (e.key === 'Escape' && document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      return;
    }
    const { scene } = ctl.deps;
    const walking = scene.isWalkthroughMode();

    if (e.key === 'Escape') {
      if (closeTopOverlay()) {
        e.preventDefault();
        return;
      }
      if (activeTool.value !== 'orbit') {
        ctl.setTool('orbit');
      }
      return;
    }

    if (e.key === '?') {
      e.preventDefault();
      if (helpOpen.value) closeTopOverlay();
      else openHelp(0);
      return;
    }

    // Modal dialogs swallow the remaining shortcuts.
    if (helpOpen.value || settingsOpen.value || e.repeat) return;

    // In walk mode WASD/F/C/Space belong to the walkthrough controller.
    if (walking) return;

    switch (e.code) {
      case 'KeyF':
        e.preventDefault();
        ctl.recenter();
        break;
      case 'Digit1':
        ctl.setFloor('ground');
        break;
      case 'Digit2':
        ctl.setFloor('first');
        break;
      case 'Digit3':
        ctl.setFloor('all');
        break;
      case 'KeyW':
        e.preventDefault();
        if (document.activeElement instanceof HTMLButtonElement) document.activeElement.blur();
        ctl.setViewMode('walk');
        break;
      case 'KeyM':
        e.preventDefault();
        ctl.toggleTool('measure');
        break;
      case 'KeyN':
        e.preventDefault();
        ctl.toggleTool('note');
        break;
      default:
        break;
    }
  });
}
