import type * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../../engine/viewer/scene-types.ts';
import {
  buildStableUpperEnsuiteBathroom,
  createCarraraMarbleTileTexture,
  createRakedVYExtrusion,
  type StableUpperEnsuiteSharedKit,
} from './stable-upper-ensuite-bathroom.ts';
import {
  buildStableUpperBedroomFurniture,
  createBedroomWovenRugTexture,
} from './stable-upper-bedroom-furniture.ts';

export {
  buildStableUpperEnsuiteBathroom,
  buildStableUpperBedroomFurniture,
  createCarraraMarbleTileTexture,
  createBedroomWovenRugTexture,
  createRakedVYExtrusion,
  type StableUpperEnsuiteSharedKit,
};

export function buildStableUpperEnsuite(
  firstFloorGroup: THREE.Group,
  stableUpperFloorY: number,
  stableUpperTopY: number,
  lightJoineryOakMat: THREE.Material,
  warmRoomPlasterMat: THREE.Material,
  windowGlassMat: THREE.Material,
  _roofGroup?: THREE.Group,
  ctx?: SceneBuilderContext
): void {
  const sharedKit = buildStableUpperEnsuiteBathroom(
    firstFloorGroup,
    stableUpperFloorY,
    stableUpperTopY,
    lightJoineryOakMat,
    warmRoomPlasterMat,
    windowGlassMat,
    _roofGroup,
    ctx
  );
  buildStableUpperBedroomFurniture(
    firstFloorGroup,
    stableUpperFloorY,
    lightJoineryOakMat,
    warmRoomPlasterMat,
    sharedKit
  );
}
