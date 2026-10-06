import * as THREE from 'three';
import type { PropertyScene } from '../../engine/scene/property-scene.ts';
import type { AnnotationKind, SceneAnnotationRecord } from '../../types/scene.ts';
import type { ProjectedPinScreenCoord } from './annotator-types.ts';

const ORTHO_FRUSTUM_HALF_HEIGHT = 12;

/**
 * Direct 60 Hz GPU-composited `translate3d(x, y, 0)` screen-space pin projector.
 * Bypasses VDOM diffing during camera orbit/walkthrough by mutating element
 * `style.transform` directly with zero per-frame heap allocations.
 */
export class AnnotatorPinsOverlayRenderer {
  private readonly scene: PropertyScene;
  private readonly onSelectPin: (id: number) => void;
  private readonly overlayEl: HTMLElement;
  private readonly pinElements = new Map<number, HTMLButtonElement>();

  private records: readonly SceneAnnotationRecord[] = [];
  private selectedId: number | null = null;

  private readonly scratchPerspCam = new THREE.PerspectiveCamera(45, 1, 0.1, 250);
  private readonly scratchOrthoCam = new THREE.OrthographicCamera(-12, 12, 12, -12, 0.1, 250);
  private readonly scratchVec = new THREE.Vector3();

  public constructor(scene: PropertyScene, onSelectPin: (id: number) => void) {
    this.scene = scene;
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

    this.scene.onViewChanged(() => {
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
    const width = window.innerWidth || 1;
    const height = window.innerHeight || 1;
    const aspect = width / height;
    const view = this.scene.getViewState();

    let activeCamera: THREE.Camera;
    if (view.isOrthographic) {
      this.scratchOrthoCam.left = -ORTHO_FRUSTUM_HALF_HEIGHT * aspect;
      this.scratchOrthoCam.right = ORTHO_FRUSTUM_HALF_HEIGHT * aspect;
      this.scratchOrthoCam.top = ORTHO_FRUSTUM_HALF_HEIGHT;
      this.scratchOrthoCam.bottom = -ORTHO_FRUSTUM_HALF_HEIGHT;
      this.scratchOrthoCam.zoom = view.orthoZoom;
      this.scratchOrthoCam.position.copy(view.cameraPosition);
      this.scratchOrthoCam.up.set(0, 0, -1);
      this.scratchOrthoCam.lookAt(view.target);
      this.scratchOrthoCam.updateProjectionMatrix();
      this.scratchOrthoCam.updateMatrixWorld(true);
      activeCamera = this.scratchOrthoCam;
    } else {
      const fov = this.scene.isWalkthroughMode()
        ? this.scene.getWalkthrough().getBaseFov()
        : 45;
      this.scratchPerspCam.fov = fov;
      this.scratchPerspCam.aspect = aspect;
      this.scratchPerspCam.position.copy(view.cameraPosition);
      this.scratchPerspCam.up.set(0, 1, 0);
      this.scratchPerspCam.lookAt(view.target);
      this.scratchPerspCam.updateProjectionMatrix();
      this.scratchPerspCam.updateMatrixWorld(true);
      activeCamera = this.scratchPerspCam;
    }

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
      this.scratchVec.set(wx, wy, wz).project(activeCamera);

      const visible =
        this.scratchVec.z >= -1 &&
        this.scratchVec.z <= 1 &&
        this.scratchVec.x >= -1.05 &&
        this.scratchVec.x <= 1.05 &&
        this.scratchVec.y >= -1.05 &&
        this.scratchVec.y <= 1.05;

      const screenX = (this.scratchVec.x * 0.5 + 0.5) * width;
      const screenY = (-this.scratchVec.y * 0.5 + 0.5) * height;

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
