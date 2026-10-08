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

/**
 * Binds the collapse toggle of a legacy HUD section header. The legacy panels now
 * live inside the developer drawer, so their headers are static (no dragging).
 */
export function bindCollapsibleHudSection(
  hudSection: HTMLElement,
  hudHeader: HTMLElement,
  hudCollapseBtn: HTMLButtonElement
): void {
  hudHeader.classList.add('is-static');
  hudCollapseBtn.addEventListener('click', (e: MouseEvent) => {
    e.stopPropagation();
    hudSection.classList.toggle('is-collapsed');
  });
}
