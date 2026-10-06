import * as THREE from 'three';
import {
  buildBarnMezzanineRetroFurnitureAndTv,
  type RetroLoungeMaterialsKit,
} from './retro-lounge-furniture-and-tv.ts';
import { buildBarnMezzanineRetroShelvesAndConsoles } from './retro-lounge-shelves-and-consoles.ts';

export {
  buildBarnMezzanineRetroFurnitureAndTv,
  buildBarnMezzanineRetroShelvesAndConsoles,
  type RetroLoungeMaterialsKit,
};

export function buildBarnMezzanineRetroLounge(
  firstFloorGroup: THREE.Group,
  mezzanineFloorY: number
): void {
  const loungeGroup = new THREE.Group();
  loungeGroup.name = 'outbuildings.mezzanine.retroLounge';
  loungeGroup.userData.zone = 'courtyard';
  firstFloorGroup.add(loungeGroup);

  const kit = buildBarnMezzanineRetroFurnitureAndTv(loungeGroup, mezzanineFloorY);
  buildBarnMezzanineRetroShelvesAndConsoles(loungeGroup, mezzanineFloorY, kit);

  loungeGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.computeBoundingSphere();
    }
  });
}
