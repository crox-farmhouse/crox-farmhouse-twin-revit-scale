import type * as THREE from 'three';
import { UsdStageRuntimeController } from '../../usd/stage-runtime.ts';
import type { PropertySceneLayers } from '../scene-content.ts';
import type { RenderInvalidator } from './viewer-types.ts';

export interface ViewerUsdRuntimeHost {
  readonly scene: THREE.Scene;
  readonly layers: PropertySceneLayers;
  readonly invalidator: RenderInvalidator;
  isCeilingCutaway(): boolean;
  setCeilingCutaway(cutaway: boolean): void;
  /** Before a zone is replaced from USDA: batches must be dissolved. */
  onBeforeZoneLoad(): void;
  /** After a zone was rebuilt from USDA: re-tag, rebind and re-batch. */
  onZoneLoaded(canBatch: boolean): void;
  /** Batching allowed / disallowed by stage edits. */
  onSyncBatchState(shouldBatch: boolean): void;
}

/** Builds the OpenUSD stage runtime (zone sublayers, variants, live edits). */
export function createViewerUsdRuntime(host: ViewerUsdRuntimeHost): UsdStageRuntimeController {
  const runtime: UsdStageRuntimeController = new UsdStageRuntimeController({
    scene: host.scene,
    firstFloorMeshGroup: host.layers.firstFloorMeshGroup,
    groundFloorCeilingGroup: host.layers.groundFloorCeilingGroup,
    ceilingMeshGroup: host.layers.ceilingMeshGroup,
    cutawayWallGroups: host.layers.cutawayWallGroups,
    initialCeilingCutaway: host.isCeilingCutaway(),
    onRoofCutawayChanged: (cutaway) => {
      if (host.isCeilingCutaway() !== cutaway) host.setCeilingCutaway(cutaway);
    },
    onBeforeZoneLoadFromUsda: () => host.onBeforeZoneLoad(),
    onZoneLoadedFromUsda: () => host.onZoneLoaded(runtime.canUseStaticBatching()),
    onSyncBatchState: (shouldBatch) => host.onSyncBatchState(shouldBatch),
  });
  runtime.subscribe(() => {
    host.invalidator.invalidateShadows();
    host.invalidator.requestRender();
  });
  return runtime;
}
