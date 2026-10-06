import type { SmartHomeHub } from '../../core/smart-home-hub.ts';
import type { PropertyScene } from '../../engine/scene/property-scene.ts';
import type { KNXPropertyBusController } from '../../knx/emulator.ts';

export function requireElement<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Required HUD DOM element #${id} not found`);
  }
  return el as T;
}

export interface HudSharedContext {
  readonly knx: KNXPropertyBusController;
  readonly scene: PropertyScene;
  readonly hub: SmartHomeHub;
  readonly onFloorModeChanged: () => void;
}

export function bindDraggableHudWindow(
  hudWindow: HTMLElement,
  hudTitlebar: HTMLElement,
  hudCollapseBtn: HTMLButtonElement
): void {
  let isDraggingHud = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  hudCollapseBtn.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation();
    hudWindow.classList.toggle('is-collapsed');
  });

  hudTitlebar.addEventListener('pointerdown', (e: PointerEvent) => {
    if (e.target === hudCollapseBtn) return;
    isDraggingHud = true;
    const rect = hudWindow.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    hudTitlebar.setPointerCapture(e.pointerId);
  });

  hudTitlebar.addEventListener('pointermove', (e: PointerEvent) => {
    if (!isDraggingHud) return;
    const maxX = Math.max(0, window.innerWidth - hudWindow.offsetWidth);
    const maxY = Math.max(0, window.innerHeight - 28);
    const nextLeft = Math.max(0, Math.min(maxX, e.clientX - dragOffsetX));
    const nextTop = Math.max(0, Math.min(maxY, e.clientY - dragOffsetY));
    hudWindow.style.left = `${nextLeft}px`;
    hudWindow.style.top = `${nextTop}px`;
    hudWindow.style.right = 'auto';
  });

  const stopDrag = (): void => {
    isDraggingHud = false;
  };
  hudTitlebar.addEventListener('pointerup', stopDrag);
  hudTitlebar.addEventListener('pointercancel', stopDrag);
}
