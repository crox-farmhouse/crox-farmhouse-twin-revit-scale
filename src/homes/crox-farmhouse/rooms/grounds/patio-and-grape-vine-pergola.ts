import type * as THREE from 'three';
import { buildGrapeVinePergola } from './patio/grape-vine-pergola.ts';
import { createBotanicalShrubKit } from './patio/patio-textures-and-shrubs.ts';
import {
  buildLowBrickRetainingWall,
  buildRaisedFlagstonePatio,
} from './patio/raised-flagstone-patio.ts';
import { buildWalledVegetableGarden } from './patio/walled-vegetable-garden.ts';

export interface PatioAndGrapeVinePergolaKit {
  readonly limestoneEdgingMat: THREE.Material;
  readonly structuralOakMat: THREE.Material;
  readonly glassMat: THREE.Material;
  readonly buildLionHeadTrophyUrn: (
    scene: THREE.Scene,
    x: number,
    z: number,
    foliageMat: THREE.Material,
    whiteBloomMat: THREE.Material,
    blushBloomMat: THREE.Material
  ) => void;
  readonly buildOldGrindstone: (
    scene: THREE.Scene,
    x: number,
    z: number,
    oakMat: THREE.Material
  ) => void;
}

export function buildPatioAndGrapeVinePergola(
  scene: THREE.Scene,
  southWallGroup: THREE.Group,
  kit: PatioAndGrapeVinePergolaKit
): void {
  const retainingWallKit = buildLowBrickRetainingWall(scene, kit.limestoneEdgingMat);
  const shrubKit = createBotanicalShrubKit();
  const flagstonePatioKit = buildRaisedFlagstonePatio(
    scene,
    southWallGroup,
    kit,
    retainingWallKit,
    shrubKit
  );
  const pergolaKit = buildGrapeVinePergola(
    scene,
    kit,
    retainingWallKit,
    shrubKit,
    flagstonePatioKit
  );
  buildWalledVegetableGarden(
    scene,
    kit,
    retainingWallKit,
    shrubKit,
    flagstonePatioKit,
    pergolaKit
  );
}
