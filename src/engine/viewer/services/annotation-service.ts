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

  public constructor(host: AnnotationServiceHost) {
    this.host = host;
    this.controller = new SceneAnnotationController(host);
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
   * Enables / disables authoring. Editing needs unbatched, individually
   * movable meshes; leaving re-batches (when allowed) and refreezes matrices.
   */
  public setActive(enabled: boolean): void {
    const { host } = this;
    if (enabled) {
      host.unbatchAll();
      host.refreshView();
      host.freezeStaticMatrices();
    }
    this.controller.setAnnotationMode(enabled);
    if (!enabled && host.canUseStaticBatching()) {
      host.captureFurnitureColliders();
      host.optimizeBatches();
      host.refreshView();
      host.freezeStaticMatrices();
    }
    host.invalidateObstacleCache();
    host.invalidateShadows();
    host.requestRender();
  }

  public toggleActive(): boolean {
    this.setActive(!this.controller.isAnnotationMode());
    return this.controller.isAnnotationMode();
  }

  /** Re-applies persisted move / rotate annotations to their target objects. */
  public reapplySavedMoves(records: readonly SceneAnnotationRecord[]): void {
    const { host } = this;
    host.unbatchAll();
    this.controller.reapplySavedMoveAnnotations(records);
    if (!this.controller.isAnnotationMode() && host.canUseStaticBatching()) {
      host.captureFurnitureColliders();
      host.optimizeBatches();
    }
    host.invalidateObstacleCache();
    host.freezeStaticMatrices();
  }
}
