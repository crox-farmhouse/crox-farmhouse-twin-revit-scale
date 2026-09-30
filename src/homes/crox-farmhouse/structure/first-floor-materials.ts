import * as THREE from 'three';
import { createCourtyardStoneTexture, createImperialBrickTextures } from '../../../engine/textures/procedural-textures.ts';
import type { SceneBuilderContext } from '../../../types/scene.ts';

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

  const { colorMap: brickColorTex, bumpMap: brickBumpTex } = createImperialBrickTextures();
  const exteriorBrickMat = new THREE.MeshStandardMaterial({
    map: brickColorTex,
    bumpMap: brickBumpTex,
    bumpScale: 0.018,
    roughness: 0.82,
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

  // Antique Oak Skirting Material (Issue #14: all skirting boards antique wood with moulded top cap)
  const antiqueOakSkirtingMat = new THREE.MeshStandardMaterial({
    color: 0x8f6b47,
    roughness: 0.52,
    metalness: 0.04,
  });

  const wardrobeMat = new THREE.MeshStandardMaterial({
    color: 0xd8d2c5,
    roughness: 0.52,
    metalness: 0.03,
  });

  const timberDoorMat = new THREE.MeshStandardMaterial({
    color: 0xdad5cb,
    roughness: 0.45,
    metalness: 0.04,
  });

  const windowFrameMat = new THREE.MeshStandardMaterial({
    color: 0xf2eee4,
    roughness: 0.42,
    metalness: 0.05,
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

  // Issue #9: Upstairs bedrooms, landing & corridor are all carpeted the same as the Living Room (`greyRoomCarpetMat`)
  const oakFloorMat = new THREE.MeshStandardMaterial({
    color: 0xb8b4ae,
    roughness: 0.94,
  });

  const bathStoneTex = createCourtyardStoneTexture();
  bathStoneTex.repeat.set(3.5, 3.5);
  const bathroomTileMat = new THREE.MeshStandardMaterial({
    map: bathStoneTex,
    bumpMap: bathStoneTex,
    bumpScale: 0.003,
    color: 0xe6e1d8,
    roughness: 0.46,
    metalness: 0.05,
  });

  return {
    antiqueOakSkirtingMat,
    bathroomTileMat,
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
