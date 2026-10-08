import type { TwinCameraApi } from '../../app/twin-api.ts';
import type { AnnotationKind, SceneAnnotationRecord } from '../../core/types/scene.ts';
import type { ProjectedPinScreenCoord } from './annotator-types.ts';

/**
 * Direct 60 Hz GPU-composited `translate3d(x, y, 0)` screen-space pin projector.
 * Bypasses VDOM diffing during camera orbit/walkthrough by mutating element
 * `style.transform` directly (projection is delegated to `TwinCameraApi`).
 */
export class AnnotatorPinsOverlayRenderer {
  private readonly camera: TwinCameraApi;
  private readonly onSelectPin: (id: number) => void;
  private readonly overlayEl: HTMLElement;
  private readonly pinElements = new Map<number, HTMLButtonElement>();

  private records: readonly SceneAnnotationRecord[] = [];
  private selectedId: number | null = null;

  public constructor(camera: TwinCameraApi, onSelectPin: (id: number) => void) {
    this.camera = camera;
    this.onSelectPin = onSelectPin;

    const existing = document.getElementById('annotator-pins-overlay');
    if (existing) {
      this.overlayEl = existing;
    } else {
      const container = document.createElement('div');
      container.id = 'annotator-pins-overlay';
      container.className = 'annotator-pins-overlay';
      container.setAttribute('aria-hidden', 'true');
      const appEl = document.getElementById('app') ?? document.body;
      appEl.appendChild(container);
      this.overlayEl = container;
    }

    this.camera.onViewChanged(() => {
      if (this.records.length > 0) {
        this.projectPinsToScreen();
      }
    });

    window.addEventListener('resize', () => {
      if (this.records.length > 0) {
        this.projectPinsToScreen();
      }
    });
  }

  public syncRecords(
    records: readonly SceneAnnotationRecord[],
    selectedId: number | null
  ): void {
    this.records = records;
    this.selectedId = selectedId;

    const activeIds = new Set<number>();
    for (const rec of records) {
      activeIds.add(rec.id);
      let btn = this.pinElements.get(rec.id);
      if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.addEventListener('click', (e: MouseEvent) => {
          e.stopPropagation();
          this.onSelectPin(rec.id);
        });
        this.pinElements.set(rec.id, btn);
        this.overlayEl.appendChild(btn);
      }

      const kind: AnnotationKind = rec.kind ?? 'pin';
      const isSelected = rec.id === selectedId;
      btn.className = `annotator-screen-pin kind-${kind}${isSelected ? ' is-selected' : ''}`;
      if (kind === 'measure' && rec.measurement) {
        btn.textContent = `#${rec.id} · ${rec.measurement.distanceM.toFixed(2)}m`;
      } else if (kind === 'move' && rec.objectTransform) {
        btn.textContent = `#${rec.id} · ${rec.objectTransform.targetName}`;
      } else {
        btn.textContent = `#${rec.id}`;
      }
      btn.title = rec.note.trim() || `${rec.roomName} (#${rec.id})`;
    }

    for (const [id, el] of this.pinElements.entries()) {
      if (!activeIds.has(id)) {
        el.remove();
        this.pinElements.delete(id);
      }
    }

    if (records.length > 0) {
      this.projectPinsToScreen();
    }
  }

  public projectPinsToScreen(): readonly ProjectedPinScreenCoord[] {
    const results: ProjectedPinScreenCoord[] = [];
    for (const rec of this.records) {
      const btn = this.pinElements.get(rec.id);
      if (!btn) continue;

      let [wx, wy, wz] = rec.worldPoint;
      if (rec.kind === 'measure' && rec.measurement) {
        const { startPoint, endPoint } = rec.measurement;
        wx = (startPoint[0] + endPoint[0]) * 0.5;
        wy = (startPoint[1] + endPoint[1]) * 0.5;
        wz = (startPoint[2] + endPoint[2]) * 0.5;
      } else if (rec.kind === 'move' && rec.objectTransform) {
        [wx, wy, wz] = rec.objectTransform.newWorldCenter;
      }
      const { x: screenX, y: screenY, visible } = this.camera.projectToScreen([wx, wy, wz]);

      btn.hidden = !visible;
      if (visible) {
        btn.style.transform = `translate3d(${screenX.toFixed(1)}px, ${screenY.toFixed(1)}px, 0)`;
      }

      results.push({
        id: rec.id,
        kind: rec.kind ?? 'pin',
        x: screenX,
        y: screenY,
        visible,
      });
    }

    return results;
  }

  public getSelectedPinId(): number | null {
    return this.selectedId;
  }
}
