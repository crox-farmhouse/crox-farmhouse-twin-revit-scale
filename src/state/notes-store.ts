import { computed, signal, type ReadonlySignal, type Signal } from '@preact/signals';
import type { AnnotationToolMode, SceneAnnotationRecord } from '../core/types/scene.ts';

/**
 * Notes / measure tool state, mirrored from the twin by the notes controller
 * (src/ui/notes) so Preact components can render without polling the engine.
 */

export const annotatorActive: Signal<boolean> = signal<boolean>(false);
export const annotationTool: Signal<AnnotationToolMode> = signal<AnnotationToolMode>('pin');
export const annotationsList: Signal<readonly SceneAnnotationRecord[]> =
  signal<readonly SceneAnnotationRecord[]>([]);
export const selectedAnnotationId: Signal<number | null> = signal<number | null>(null);

export interface AnnotationCounts {
  readonly total: number;
  readonly pins: number;
  readonly moves: number;
  readonly measures: number;
}

export const annotationCountsByKind: ReadonlySignal<AnnotationCounts> = computed(() => {
  const list = annotationsList.value;
  let pins = 0;
  let moves = 0;
  let measures = 0;
  for (const r of list) {
    const kind = r.kind ?? 'pin';
    if (kind === 'move') moves += 1;
    else if (kind === 'measure') measures += 1;
    else pins += 1;
  }
  return { total: list.length, pins, moves, measures };
});
