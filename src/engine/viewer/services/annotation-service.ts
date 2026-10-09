import type {
  LiveMeasurePreviewState,
  SceneAnnotationHit,
  SceneAnnotationRecord,
  SceneObjectTransformAnnotation,
  Vec3Tuple,
} from '../../../core/types/scene.ts';
import {
  SceneAnnotationController,
  type AnnotationControllerHost,
  type MovableTargetCandidate,
} from '../../annotation/annotation-controller.ts';
import { Emitter } from '../../util/emitter.ts';

export interface AnnotationServiceHost extends AnnotationControllerHost {
  /** True when static batching is allowed (no live USD edits pending). */
  canUseStaticBatching(): boolean;
  unbatchAll(): void;
  optimizeBatches(): void;
  freezeStaticMatrices(): void;
  captureFurnitureColliders(): void;
  invalidateObstacleCache(): void;
  /** Re-evaluates cutaways for the current view (force-notifying listeners). */
  refreshView(): void;
}

/**
 * Annotation authoring tools (pin / measure / move-rotate). Wraps the
 * `SceneAnnotationController` with multi-listener events and the batching
 * hand-off needed while objects are editable.
 */
export class AnnotationService {
  public readonly controller: SceneAnnotationController;
  public readonly pick = new Emitter<[hit: SceneAnnotationHit]>();
  public readonly markerSelect = new Emitter<[id: number]>();
  public readonly measurePreview = new Emitter<[state: LiveMeasurePreviewState]>();
  public readonly measureComplete = new Emitter<
    [startHit: SceneAnnotationHit, endHit: SceneAnnotationHit, snappedEndPoint: Vec3Tuple]
  >();
  public readonly objectTransform = new Emitter<
    [
      baseHit: SceneAnnotationHit | null,
      transform: SceneObjectTransformAnnotation | null,
      candidates: readonly MovableTargetCandidate[],
      commitToStore: boolean,
    ]
  >();
  private readonly host: AnnotationServiceHost;
  private unbatchedForTransform = false;

  public constructor(host: AnnotationServiceHost) {
    this.host = host;
    this.controller = new SceneAnnotationController({
      get canvas() {
        return host.canvas;
      },
      get layers() {
        return host.layers;
      },
      get orbitControls() {
        return host.orbitControls;
      },
      getActiveCamera: () => host.getActiveCamera(),
      getCameraPose: () => host.getCameraPose(),
      setRayFromClient: (x, y) => host.setRayFromClient(x, y),
      isExcludedFromPicking: (m) => host.isExcludedFromPicking(m),
      ensureUnbatchedForTransform: () => this.ensureUnbatchedForTransform(),
      requestRender: () => host.requestRender(),
      invalidateShadows: () => host.invalidateShadows(),
    });
    this.controller.setOnAnnotationPick((hit) => this.pick.emit(hit));
    this.controller.setOnAnnotationMarkerSelect((id) => this.markerSelect.emit(id));
    this.controller.setOnMeasurePreviewChange((state) => this.measurePreview.emit(state));
    this.controller.setOnMeasureComplete((a, b, p) => this.measureComplete.emit(a, b, p));
    this.controller.setOnObjectTransformChange((hit, t, candidates, commit) =>
      this.objectTransform.emit(hit, t, candidates, commit)
    );
  }

  public isActive(): boolean {
    return this.controller.isAnnotationMode();
  }

  /**
   * Lazily unbatches static geometry only when the user actually enters `'move'` / `'rotate'`
   * object-transform mode. Standard Note (`'pin'`) and Measure (`'measure'`) modes raycast
   * directly against the AABB-accelerated merged batches with zero unbatching or shader recompilation.
   */
  public ensureUnbatchedForTransform(): void {
    if (this.unbatchedForTransform) return;
    this.unbatchedForTransform = true;
    this.host.unbatchAll();
    this.host.refreshView();
    this.host.freezeStaticMatrices();
  }

  /**
   * Enables / disables authoring. Note (`'pin'`) and Measure (`'measure'`) modes keep static
   * batches intact for instant 0ms activation and 60 FPS raycasting; only `'move'` / `'rotate'`
   * unbatches on demand.
   */
  public setActive(enabled: boolean): void {
    const { host } = this;
    const tool = this.controller.getAnnotationToolMode();
    if (enabled && (tool === 'move' || tool === 'rotate')) {
      this.ensureUnbatchedForTransform();
    }
    this.controller.setAnnotationMode(enabled);
    if (!enabled && this.unbatchedForTransform) {
      this.unbatchedForTransform = false;
      if (host.canUseStaticBatching()) {
        host.captureFurnitureColliders();
        host.optimizeBatches();
        host.refreshView();
        host.freezeStaticMatrices();
      }
      host.invalidateObstacleCache();
      host.invalidateShadows();
    }
    host.requestRender();
  }

  public toggleActive(): boolean {
    this.setActive(!this.controller.isAnnotationMode());
    return this.controller.isAnnotationMode();
  }

  /** Re-applies persisted move / rotate annotations to their target objects. */
  public reapplySavedMoves(records: readonly SceneAnnotationRecord[]): void {
    const hasMoveRecords = records.some((r) => r.kind === 'move' && Boolean(r.objectTransform));
    if (!hasMoveRecords) return;
    const { host } = this;
    host.unbatchAll();
    this.controller.reapplySavedMoveAnnotations(records);
    if (!this.unbatchedForTransform && host.canUseStaticBatching()) {
      host.captureFurnitureColliders();
      host.optimizeBatches();
    }
    host.invalidateObstacleCache();
    host.freezeStaticMatrices();
  }
}
