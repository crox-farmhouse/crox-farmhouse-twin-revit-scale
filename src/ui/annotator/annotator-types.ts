import type { MovableTargetCandidate } from '../../engine/scene/property-scene.ts';
import type {
  AnnotationKind,
  SceneAnnotationHit,
  SceneObjectTransformAnnotation,
} from '../../types/scene.ts';

export function requireAnnotatorEl<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`Required Annotator DOM element #${id} not found`);
  }
  return el as T;
}

export interface ActiveTransformUIState {
  readonly baseHit: SceneAnnotationHit;
  readonly transform: SceneObjectTransformAnnotation;
  readonly candidates: readonly MovableTargetCandidate[];
}

export interface ProjectedPinScreenCoord {
  readonly id: number;
  readonly kind: AnnotationKind;
  readonly x: number;
  readonly y: number;
  readonly visible: boolean;
}
