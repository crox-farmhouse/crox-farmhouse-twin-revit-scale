/**
 * Procedural texture generators barrel module.
 *
 * Re-exports all domain-specific procedural texture generators and the
 * deterministic canvas/texture memoization registry.
 */
export {
  clearTextureRegistryCache,
  getOrCreateCachedCanvas,
  getOrCreateCachedCanvasPair,
  getOrCreateCachedTexture,
} from './texture-registry.ts';

export {
  createCementTexture,
  createCourtyardStoneTexture,
  createGraniteSettArcTexture,
  createGraniteSettDepthMapTexture,
  createGraniteSettLPathTextures,
  createHerringboneTerracottaQuarryTileTextures,
  createMarbleBacksplashTexture,
  createStoneTileTexture,
} from './stone-and-tile-textures.ts';

export {
  createImperialBrickTextures,
  createWelshSlateRoofTexture,
  createWelshSlateRoofTextures,
} from './roof-and-brick-textures.ts';

export {
  createBraidedCableTexture,
  createBrushedStainlessTexture,
  createDriftwoodTexture,
  createEngineeredOakFloorTextures,
  createNaturalOakJoineryTextures,
  createPolishedChromeTexture,
} from './timber-and-metal-textures.ts';

export {
  createHawaiiArtworkTexture,
  createRadialGlowTexture,
  createTVArtGalleryTextures,
  createTVOffTexture,
  createWovenWoolCarpetTextures,
} from './furnishing-and-art-textures.ts';
