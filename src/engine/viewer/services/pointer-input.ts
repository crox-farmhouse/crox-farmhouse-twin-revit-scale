import * as THREE from 'three';
import type { InteractiveUserData } from '../../../core/types/scene.ts';
import type { SceneAnnotationController } from '../../annotation/annotation-controller.ts';
import type { UsdIndexedPrimInfo, UsdStageRuntimeController } from '../../usd/stage-runtime.ts';
import { isObjectVisibleInHierarchy } from '../../util/object-utils.ts';
import { Emitter } from '../../util/emitter.ts';
import type { WalkthroughController } from '../../walkthrough/walkthrough-controller.ts';
import type { UfhZoneId } from '../property-scene-profile.ts';
import type { CameraService } from './camera-service.ts';
import type { RenderInvalidator } from './viewer-types.ts';

export interface PointerInputHost {
  readonly canvas: HTMLCanvasElement;
  readonly scene: THREE.Scene;
  readonly firstFloorMeshGroup: THREE.Group;
  readonly camera: CameraService;
  readonly annotations: SceneAnnotationController;
  readonly invalidator: RenderInvalidator;
  /** Shared, live list of clickable device meshes. */
  readonly interactiveMeshes: THREE.Object3D[];
  getWalkthrough(): WalkthroughController;
  getUsdRuntime(): UsdStageRuntimeController;
  isPickExcluded(mesh: THREE.Mesh): boolean;
  handleInteractable(interactableId: string): boolean;
  toggleUfhZone(zoneId: UfhZoneId): void;
  /**
   * Home / integration hook for every device click (KNX switches, sensors, …).
   * `pressDurationMs` is how long the pointer was held (0 for walkthrough "E").
   */
  onObjectInteraction(data: InteractiveUserData, details?: { readonly pressDurationMs: number }): void;
}

/** Max pointer travel between down / up that still counts as a click (px). */
const CLICK_SLOP_PX = 6;
const HOVER_RAYCAST_MS = 50;
const MEASURE_PREVIEW_RAYCAST_MS = 24;

/**
 * Canvas pointer handling: hover cursors, click routing (annotation tools →
 * devices → USD prim inspection) and double-click surface focus.
 */
export class PointerInput {
  public readonly surfaceDoubleClick = new Emitter<[point: THREE.Vector3]>();
  public readonly usdPrimPick = new Emitter<[info: UsdIndexedPrimInfo]>();
  private readonly host: PointerInputHost;
  private pointerDownPos = { x: 0, y: 0 };
  private pointerDownMs = 0;
  private lastHoverRaycastMs = 0;

  public constructor(host: PointerInputHost) {
    this.host = host;
    const { canvas } = host;
    canvas.addEventListener('pointerdown', (e) => {
      this.pointerDownPos = { x: e.clientX, y: e.clientY };
      this.pointerDownMs = performance.now();
    });
    canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
    canvas.addEventListener('pointerup', (e) => this.onPointerUp(e));
    canvas.addEventListener('dblclick', (e) => this.onDoubleClick(e));
  }

  /** Activates a device mesh (click or walkthrough "E" interaction). */
  public triggerInteractiveObject(mesh: THREE.Object3D, pressDurationMs = 0): void {
    const { host } = this;
    const walkthrough = host.getWalkthrough();
    if (this.usdPrimPick.hasListeners()) {
      const primInfo = host.getUsdRuntime().getPrimInfoByMesh(mesh);
      if (primInfo) this.usdPrimPick.emit(primInfo);
    }
    const data = mesh.userData as InteractiveUserData;
    if (data.isClimbableLadder && walkthrough.isActive()) {
      walkthrough.interactWithClimbableLadder();
      host.invalidator.requestRender();
      return;
    }
    if (data.interactableId) host.handleInteractable(data.interactableId);
    if (data.ufhZoneId) host.toggleUfhZone(data.ufhZoneId);
    host.onObjectInteraction(data, { pressDurationMs });
    if (walkthrough.isActive()) walkthrough.refreshPrompt();
    host.invalidator.requestRender();
  }

  private firstVisibleDeviceHit(raycaster: THREE.Raycaster): THREE.Intersection | undefined {
    return raycaster
      .intersectObjects(this.host.interactiveMeshes, false)
      .find((hit) => isObjectVisibleInHierarchy(hit.object));
  }

  private onPointerMove(e: PointerEvent): void {
    const { host } = this;
    const annotations = host.annotations;
    if (host.getWalkthrough().isActive() || annotations.isGizmoDragging()) return;

    // Live 3D measurement rubber-band line preview when waiting for Point B
    if (annotations.isAwaitingMeasureEnd() && e.buttons === 0) {
      const now = performance.now();
      if (now - this.lastHoverRaycastMs < MEASURE_PREVIEW_RAYCAST_MS) return;
      this.lastHoverRaycastMs = now;
      annotations.updateMeasurePreviewAt(e.clientX, e.clientY, e.shiftKey);
      host.canvas.style.cursor = 'crosshair';
      return;
    }

    if (e.buttons !== 0) return;
    if (annotations.isAnnotationMode() || e.shiftKey) {
      host.canvas.style.cursor = annotations.getHoverCursor();
      return;
    }
    const now = performance.now();
    if (now - this.lastHoverRaycastMs < HOVER_RAYCAST_MS) return;
    this.lastHoverRaycastMs = now;

    const raycaster = host.camera.setRayFromClient(e.clientX, e.clientY);
    if (annotations.intersectMarkers(raycaster).length > 0) {
      host.canvas.style.cursor = 'pointer';
      return;
    }
    host.canvas.style.cursor = this.firstVisibleDeviceHit(raycaster) ? 'pointer' : 'grab';
  }

  private onPointerUp(e: PointerEvent): void {
    const { host } = this;
    if (e.button !== 0) return;
    if (host.annotations.isGizmoBusy()) return;
    const dist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
    if (dist > CLICK_SLOP_PX) return;

    const raycaster = host.camera.setRayFromClient(e.clientX, e.clientY);

    // 1-2. Annotation markers and annotation tools take precedence.
    if (host.annotations.handleClick(raycaster, e)) return;

    // 3. Normal interactive object click (doors, switches, lights, gates, etc.)
    const firstHit = this.firstVisibleDeviceHit(raycaster);
    if (firstHit) {
      this.triggerInteractiveObject(firstHit.object, performance.now() - this.pointerDownMs);
      return;
    }

    // 4. OpenUSD Stage Prim Inspection pick on any visible architectural / furniture mesh
    if (!this.usdPrimPick.hasListeners()) return;
    const sceneHits = raycaster.intersectObjects([host.scene, host.firstFloorMeshGroup], true);
    const visibleSceneHit = sceneHits.find(
      (hit) =>
        hit.object instanceof THREE.Mesh &&
        !host.isPickExcluded(hit.object) &&
        isObjectVisibleInHierarchy(hit.object)
    );
    if (!visibleSceneHit) return;
    const primInfo = host.getUsdRuntime().getPrimInfoByMesh(visibleSceneHit.object);
    if (primInfo) this.usdPrimPick.emit(primInfo);
  }

  private onDoubleClick(e: MouseEvent): void {
    const { host } = this;
    if (host.annotations.isAnnotationMode() || e.shiftKey) return;
    const point = host.camera.pickVisibleSurfacePoint(e.clientX, e.clientY);
    // Devices (switches, doors, gates…) already act on single click; don't also refocus.
    const onDevice = this.firstVisibleDeviceHit(host.camera.raycaster) !== undefined;
    if (!point || onDevice) return;
    const walkthrough = host.getWalkthrough();
    if (walkthrough.isActive()) {
      walkthrough.glideToWorldPoint(point);
    } else {
      this.surfaceDoubleClick.emit(point);
    }
  }
}
