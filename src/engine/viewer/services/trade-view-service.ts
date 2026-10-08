import type * as THREE from 'three';
import type { TradeView } from '../../../core/types/twin-ux.ts';
import { TradeViewController, classifyScene } from '../../trade-views/index.ts';
import { Emitter } from '../../util/emitter.ts';
import type { RenderInvalidator } from './viewer-types.ts';

/** Trade (owner / architect / builder / electrician / plumber) view state. */
export class TradeViewService {
  public readonly changed = new Emitter<[view: TradeView]>();
  public readonly controller: TradeViewController;
  private readonly invalidator: RenderInvalidator;
  private view: TradeView = 'owner';

  public constructor(scene: THREE.Scene, invalidator: RenderInvalidator) {
    this.invalidator = invalidator;
    // Tag every renderable before batching so merged batches stay single-category.
    classifyScene([scene]);
    this.controller = new TradeViewController({
      roots: [scene],
      requestRender: () => invalidator.requestRender(),
      invalidateShadows: () => invalidator.invalidateShadows(),
    });
    this.controller.captureServicePoints();
  }

  public getView(): TradeView {
    return this.view;
  }

  public setView(view: TradeView): void {
    if (view === this.view) return;
    this.view = view;
    this.controller.setView(view);
    this.changed.emit(view);
    this.invalidator.requestRender();
  }

  /** CSV schedule of service points (sockets, switches, sanitaryware, …) for a trade. */
  public exportServiceSchedule(view: TradeView = this.view): string {
    return this.controller.exportServiceScheduleCsv(view);
  }
}
