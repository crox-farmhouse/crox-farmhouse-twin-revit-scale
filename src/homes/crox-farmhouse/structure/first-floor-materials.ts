import * as THREE from 'three';
import {
  createCourtyardStoneTexture,
  createImperialBrickTextures,
  createNaturalOakJoineryTextures,
  createTumbledLimestoneFlagstoneTextures,
  createWovenWoolCarpetTextures,
} from '../../../engine/textures/procedural-textures.ts';
import type { SceneBuilderContext } from '../../../engine/viewer/scene-types.ts';

/**
 * Parameterized East Wing Upper Landing / Family Bathroom (Room 17) vaulted skeiling & collar envelope.
 * Centralizes eaves, collar, and ceiling slab clearances so walls, linings, joinery, and roof.ts meet
 * with 0.000mm air gap and update atomically from Revit survey numbers.
 */
export const EAST_WING_BATHROOM_VAULT = {
  northWallZ: -2.5,
  southWallZ: 2.4,
  northPitchBaseZ: -2.52,
  southPitchBaseZ: 2.42,
  northEavesY: 3.33,
  southEavesY: 3.765,
  northPitchDeg: 49.0,
  southPitchDeg: 50.0,
  collarCeilingY: 4.65,
  collarNorthZ: -1.35254,
  collarSouthZ: 1.6574,
  ceilingClearance: 0.005,
  ceilingSlabThickness: 0.03,
  wallTopEmbed: 0.014,
} as const;

export function getEastWingCeilingHeightAtZ(z: number): number {
  const {
    northWallZ,
    southWallZ,
    northEavesY,
    southEavesY,
    collarCeilingY,
    collarNorthZ,
    collarSouthZ,
  } = EAST_WING_BATHROOM_VAULT;
  if (z <= collarNorthZ) {
    const t = (z - northWallZ) / (collarNorthZ - northWallZ);
    return northEavesY + t * (collarCeilingY - northEavesY);
  }
  if (z >= collarSouthZ) {
    const t = (southWallZ - z) / (southWallZ - collarSouthZ);
    return southEavesY + t * (collarCeilingY - southEavesY);
  }
  return collarCeilingY;
}

/**
 * First-floor level constants and shared architectural materials.
 *
 * Extracted verbatim from `buildMainHouseFirstFloorAndRoof` (first-floor-rooms.ts). Statement order and
 * geometry are unchanged; shared locals flow in via `kit` and out via the return value.
 */
export function createFirstFloorMaterials(
  _ctx: SceneBuilderContext
) {
  // Traditional period farmhouse heights (lower than the modern 3.00m vaulted Kitchen extension):
  const floorBaseY = 2.06;    // Underside of First Floor slab (Ground Floor ceiling height = 2.06m / 6'9")
  const floorTopY = 2.16;     // Top of First Floor boarding
  const upperWallTopY = 4.16; // Top of First Floor walls (eaves level of two-storey Main House, 2.00m / 6'7" eaves headroom)

  // =========================================================================
  // Shared Architectural Materials
  // =========================================================================
  const plasterMat = new THREE.MeshStandardMaterial({
    color: 0xe6e0d4,
    roughness: 0.88,
    metalness: 0.02,
  });
  const warmRoomPlasterMat = new THREE.MeshStandardMaterial({
    color: 0xe2dcd0,
    roughness: 0.88,
    metalness: 0.02,
  });

  const {
    colorMap: brickColorTex,
    bumpMap: brickBumpTex,
    roughnessMap: brickRoughnessTex,
  } = createImperialBrickTextures();
  const exteriorBrickMat = new THREE.MeshStandardMaterial({
    map: brickColorTex,
    bumpMap: brickBumpTex,
    bumpScale: 0.022,
    roughnessMap: brickRoughnessTex,
    roughness: 0.86,
    metalness: 0.03,
  });

  const wallCapMat = new THREE.MeshStandardMaterial({
    color: 0x3b352f,
    roughness: 0.8,
  });

  const skirtingMat = new THREE.MeshStandardMaterial({
    color: 0xf4f0e6,
    roughness: 0.48,
    metalness: 0.03,
  });

  // Natural raw-effect matte-satin European oak for all skirting boards, architraves & interior doors
  const naturalOakJoineryTextures = createNaturalOakJoineryTextures();
  const antiqueOakSkirtingMat = new THREE.MeshStandardMaterial({
    map: naturalOakJoineryTextures.colorMap,
    bumpMap: naturalOakJoineryTextures.bumpMap,
    bumpScale: 0.0035,
    color: 0xdcc8ae,
    roughness: 0.62,
    metalness: 0.02,
  });

  const wardrobeMat = new THREE.MeshStandardMaterial({
    color: 0xd8d2c5,
    roughness: 0.52,
    metalness: 0.03,
  });

  const timberDoorMat = new THREE.MeshStandardMaterial({
    map: naturalOakJoineryTextures.colorMap,
    bumpMap: naturalOakJoineryTextures.bumpMap,
    bumpScale: 0.0035,
    color: 0xdcc8ae,
    roughness: 0.62,
    metalness: 0.02,
  });

  const windowFrameMat = new THREE.MeshStandardMaterial({
    name: 'architecturalWhiteWindowFrame',
    color: 0xf7f5f0,
    roughness: 0.34,
    metalness: 0.02,
  });

  const windowGlassMat = new THREE.MeshStandardMaterial({
    color: 0xd8eaf2,
    transparent: true,
    opacity: 0.24,
    roughness: 0.08,
    metalness: 0.15,
    depthWrite: false,
  });

  const stoneSillMat = new THREE.MeshStandardMaterial({
    color: 0xc8c0b2,
    roughness: 0.78,
    metalness: 0.03,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc59b58,
    roughness: 0.26,
    metalness: 0.86,
  });

  const ceramicWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf7f7f5,
    roughness: 0.14,
    metalness: 0.06,
  });

  // Warm creamy-oatmeal natural British wool carpet throughout upstairs matching the stair runner weave
  const woolCarpetTextures = createWovenWoolCarpetTextures();
  const oakFloorMat = new THREE.MeshStandardMaterial({
    name: 'upstairsWovenWoolCarpet',
    map: woolCarpetTextures.colorMap,
    bumpMap: woolCarpetTextures.bumpMap,
    bumpScale: 0.0025,
    color: 0xf7f2e8,
    roughness: 0.9,
    metalness: 0.01,
  });

  const bathStoneTex = createCourtyardStoneTexture();
  bathStoneTex.repeat.set(3.5, 3.5);
  const bathroomTileMat = new THREE.MeshStandardMaterial({
    name: 'bathroomStoneTile',
    map: bathStoneTex,
    bumpMap: bathStoneTex,
    bumpScale: 0.003,
    color: 0xe6e1d8,
    roughness: 0.46,
    metalness: 0.05,
  });

  const limestoneFlagstoneMaps = createTumbledLimestoneFlagstoneTextures();
  const masterLimestoneFloorMat = new THREE.MeshStandardMaterial({
    name: 'masterBathroomLimestoneFlagstone',
    map: limestoneFlagstoneMaps.colorMap,
    normalMap: limestoneFlagstoneMaps.normalMap,
    normalScale: new THREE.Vector2(0.36, 0.36),
    roughnessMap: limestoneFlagstoneMaps.roughnessMap,
    color: 0xffffff,
    roughness: 0.54,
    metalness: 0.02,
  });

  // Farrow & Ball School House White (No. 291) Modern Emulsion — soft, chalky warm stone-white (#e6e1d5)
  const schoolHouseWhiteMat = new THREE.MeshStandardMaterial({
    name: 'farrowAndBallSchoolHouseWhite291',
    color: 0xe6e1d5,
    roughness: 0.84,
    metalness: 0.01,
  });

  // Farrow & Ball Wimborne White (No. 239) Modern Eggshell — warm creamy-white satin bathroom joinery (#f7f4ec)
  const wimborneWhiteJoineryMat = new THREE.MeshStandardMaterial({
    name: 'farrowAndBallWimborneWhite239',
    bumpMap: naturalOakJoineryTextures.bumpMap,
    bumpScale: 0.0007,
    color: 0xf7f4ec,
    roughness: 0.34,
    metalness: 0.02,
  });

  // Farrow & Ball Wimborne White (No. 239) Modern Eggshell — vertical T&G cottage matchboarding & dado/skirting (#f7f4ec)
  const wimborneWhitePanellingMat = new THREE.MeshStandardMaterial({
    name: 'farrowAndBallWimborneWhite239Panelling',
    color: 0xf7f4ec,
    vertexColors: true,
    roughness: 0.34,
    metalness: 0.02,
  });

  return {
    schoolHouseWhiteMat,
    wimborneWhiteJoineryMat,
    wimborneWhitePanellingMat,
    antiqueOakSkirtingMat,
    bathroomTileMat,
    masterLimestoneFloorMat,
    brassMat,
    ceramicWhiteMat,
    exteriorBrickMat,
    floorBaseY,
    floorTopY,
    oakFloorMat,
    plasterMat,
    skirtingMat,
    stoneSillMat,
    timberDoorMat,
    upperWallTopY,
    wallCapMat,
    wardrobeMat,
    warmRoomPlasterMat,
    windowFrameMat,
    windowGlassMat,
  };
}
