import * as THREE from 'three';
import type { LightGroupMap, BifoldPanelRef, ZoneIndicatorMaterials } from '../scene-types.ts';
import type { RoomLodController } from '../../lod/lod-manager.ts';
import { SceneBatchOptimizer } from '../../rendering/scene-batch-optimizer.ts';
import type { TradeViewController } from '../../trade-views/index.ts';
import type { CutawayController } from '../../cutaway/cutaway-controller.ts';
import type { PropertySceneLayers, RoomSwitchLedBinding } from '../scene-content.ts';
import type { ViewerRenderer } from './viewer-renderer.ts';

export interface StaticSceneServiceHost {
  readonly scene: THREE.Scene;
  readonly layers: PropertySceneLayers;
  readonly renderer: ViewerRenderer;
  readonly lodController: RoomLodController;
  readonly lightGroups: LightGroupMap;
  readonly indicatorMats: ZoneIndicatorMaterials;
  readonly roomSwitchLedMats: readonly RoomSwitchLedBinding[];
  /** Shared, live array (mutated on USD zone reloads) — passed by reference. */
  readonly interactiveMeshes: THREE.Object3D[];
  readonly bifoldPanels: readonly BifoldPanelRef[];
  readonly tradeViews: TradeViewController;
  readonly cutaways: CutawayController;
  /** Objects that move at runtime and must stay unbatched / auto-updated. */
  collectDynamicObjects(target: Set<THREE.Object3D>): void;
}

/** Shadow casters smaller than this world radius are not worth a shadow (m). */
const MIN_SHADOW_CASTER_RADIUS_M = 0.25;
const MAX_ANISOTROPY = 8;

/**
 * Static-scene optimisation: draw-call batching (`SceneBatchOptimizer`) and
 * matrix freezing / texture anisotropy / small-caster culling.
 */
export class StaticSceneService {
  public readonly batchOptimizer: SceneBatchOptimizer;
  private readonly host: StaticSceneServiceHost;

  public constructor(host: StaticSceneServiceHost) {
    this.host = host;
    this.batchOptimizer = new SceneBatchOptimizer({
      layers: host.layers,
      lodController: host.lodController,
      lightGroups: host.lightGroups,
      indicatorMats: host.indicatorMats,
      roomSwitchLedMats: host.roomSwitchLedMats,
      interactiveMeshes: host.interactiveMeshes,
      bifoldPanels: host.bifoldPanels,
      getDynamicObjects: () => {
        const dynamicObjects = new Set<THREE.Object3D>();
        host.collectDynamicObjects(dynamicObjects);
        return dynamicObjects;
      },
      onBeforeBatchChange: () => {
        host.tradeViews.suspend();
      },
      onAfterBatchChange: () => {
        host.cutaways.collectDynamicCutawayWalls();
        host.tradeViews.resume();
      },
    });
  }

  /**
   * Freezes world matrices of everything static, raises texture anisotropy and
   * drops shadows from tiny casters.
   */
  public freezeStaticMatrices(): void {
    const { scene } = this.host;
    scene.updateMatrixWorld(true);
    scene.matrixWorldAutoUpdate = false;
    const dynamicObjects = new Set<THREE.Object3D>();
    this.host.collectDynamicObjects(dynamicObjects);

    const maxAnisotropy = Math.min(MAX_ANISOTROPY, this.host.renderer.getMaxAnisotropy());
    const seenMaterials = new Set<THREE.Material>();

    scene.traverse((obj) => {
      if (obj !== scene && !dynamicObjects.has(obj)) {
        obj.matrixAutoUpdate = false;
      }
      if (!(obj instanceof THREE.Mesh)) return;
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (const mat of mats) {
        if (!mat || seenMaterials.has(mat)) continue;
        seenMaterials.add(mat);
        const stdMat = mat as THREE.MeshStandardMaterial;
        for (const tex of [stdMat.map, stdMat.normalMap, stdMat.roughnessMap, stdMat.bumpMap]) {
          if (tex && tex.anisotropy < maxAnisotropy) {
            tex.anisotropy = maxAnisotropy;
            tex.needsUpdate = true;
          }
        }
      }

      if (obj.castShadow) {
        if (!obj.geometry.boundingSphere) obj.geometry.computeBoundingSphere();
        const sphere = obj.geometry.boundingSphere;
        if (sphere) {
          const maxScale = Math.max(Math.abs(obj.scale.x), Math.abs(obj.scale.y), Math.abs(obj.scale.z));
          if (sphere.radius * maxScale < MIN_SHADOW_CASTER_RADIUS_M) obj.castShadow = false;
        }
      }
    });
  }
}
