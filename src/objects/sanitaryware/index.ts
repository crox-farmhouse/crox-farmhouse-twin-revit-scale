import type { BathroomWallFacing } from './bathroom-spec-types.ts';

export type * from './bathroom-spec-types.ts';

export {
  getAcrymiteWhiteMaterial,
  getBathroomBrassMaterials,
  getBurnishedCopperMaterials,
  getMirostoneQuartzMaterial,
  getPaintedShakerCabinetMaterials,
  getVitreousChinaMaterial,
  getWcSeatMaterial,
} from './bathroom-materials.ts';

export {
  buildArmstrongConcealedShowerSet,
  buildArmstrongDeck3HoleBasinMixer,
  buildArmstrongFreestandingBathMixer,
  buildArmstrongPaperHolder,
  buildArmstrongRobeHook,
  buildArmstrongWallBasinMixer,
  buildPerrinRoweConcealedCisternLever,
  buildPerrinRoweTowelRing,
} from './perrin-rowe-armstrong.ts';

export { buildBcDesignsCopperBoatBath } from './bc-designs-boat-bath.ts';
export { buildLefroyBrooksCharterhouseWc } from './lefroy-brooks-charterhouse-wc.ts';
export { buildLefroyBrooksLaChapellePedestalBasin } from './lefroy-brooks-la-chapelle-basin.ts';
export { buildLefroyBrooksLissaDoonWashstand } from './lefroy-brooks-lissa-doon-washstand.ts';

export function wallFacingToRotY(facing: BathroomWallFacing): number {
  switch (facing) {
    case 'south':
      return 0;
    case 'east':
      return Math.PI / 2;
    case 'north':
      return Math.PI;
    case 'west':
      return -Math.PI / 2;
  }
}
