import * as THREE from 'three';
import { createEngineeredOakFloorTextures, createHerringboneTerracottaQuarryTileTextures, createImperialBrickTextures, createNaturalOakJoineryTextures } from '../../../engine/textures/procedural-textures.ts';
import {
  createVitoriaRossoChequerboardTextures,
  VITORIA_CHEQUER_REPEAT_M,
} from '../../../engine/textures/vitoria-chequerboard-tiles.ts';
import type { CutawayWallDescriptor } from '../../../core/types/scene.ts';
import type { SceneBuilderContext } from '../../../engine/viewer/scene-types.ts';

/**
 * Continuous ~7.62° (`-0.13299` rad) angle of the Main East-West Wing (`Cinema Room`, `Hall`,
 * `Boot Lobby`, `Dining Room`, `Kitchen`, `Sitting`, `Utility`, `Upper Landing`, `Family Bathroom`,
 * `Main Bedroom`) relative to the West Front Facade (`X = -22.19m`):
 * - The Cinema Room South wall, Hall Step-Up Portal wall, and Hall/Boot Lobby/Dining Room South
 *   exterior brick wall all share a single 100% collinear `0.28m`-thick wall line (`z_ew = 2.40m..2.68m`,
 *   centreline `z_ew = 2.54m`) with ZERO kink and ZERO step from `X = -22.19m` to `x_ew = -4.64m`.
 * - At `X = -22.19m` (Front Door), the wall centreline is at `Z = 1.905m` (South face `Z = 2.045m`).
 * - At `X = -16.92m` (East end of Front Entrance Hallway), the wall centreline is at `Z = 2.610m`
 *   (South face `Z = 2.750m`), giving an exact `80cm` (`0.800m`) clear hallway width against the
 *   Sitting Room North wall (`Z = 3.550m`).
 * - The North exterior brick wall (`z_ew = -2.78m..-2.50m`, centreline `z_ew = -2.64m`) is also a
 *   single 100% collinear straight line (`-7.62°`) from `X = -22.47m` all the way to the Kitchen (`x_ew = +3.50m`).
 */
export const MAIN_EAST_WING_SLOPE = 0.705 / 5.27;
export const MAIN_EAST_WING_ROTATION_Y = -Math.atan2(0.705, 5.27);

const EAST_WING_COS = Math.cos(MAIN_EAST_WING_ROTATION_Y);
const EAST_WING_SIN = Math.sin(MAIN_EAST_WING_ROTATION_Y);

/**
 * World-space translation `[ox, oy, oz]` applied after rotating `eastWingCtx` by `MAIN_EAST_WING_ROTATION_Y`
 * so that local `(x_ew = -16.92, z_ew = 2.54)` maps to world `(-16.92, 2.610)` (South face at `Z = 2.750m`).
 */
export const MAIN_EAST_WING_OFFSET: readonly [number, number, number] = [
  -16.92 - (-16.92 * EAST_WING_COS + 2.54 * EAST_WING_SIN),
  0,
  2.61 - (16.92 * EAST_WING_SIN + 2.54 * EAST_WING_COS),
];

export const MAIN_EAST_WING_Z_SHIFT = 0.07;

/** Transforms a local East-West Wing point `(x_ew, y, z_ew)` into a world-space `THREE.Vector3`. */
export function transformEastWingPoint(x: number, y: number, z: number): THREE.Vector3 {
  return new THREE.Vector3(
    x * EAST_WING_COS + z * EAST_WING_SIN + MAIN_EAST_WING_OFFSET[0],
    y + MAIN_EAST_WING_OFFSET[1],
    -x * EAST_WING_SIN + z * EAST_WING_COS + MAIN_EAST_WING_OFFSET[2]
  );
}

/** Transforms a local East-West Wing point `(x_ew, y, z_ew)` into a world-space `[x, y, z]` tuple. */
export function transformEastWingTuple(
  x: number,
  y: number,
  z: number
): [number, number, number] {
  return [
    x * EAST_WING_COS + z * EAST_WING_SIN + MAIN_EAST_WING_OFFSET[0],
    y + MAIN_EAST_WING_OFFSET[1],
    -x * EAST_WING_SIN + z * EAST_WING_COS + MAIN_EAST_WING_OFFSET[2],
  ];
}

/** Returns the world `Z` coordinate of the East-West Wing South exterior brick face (`z_ew = 2.68m`) at world `wx`. */
export function getEastWingSouthWallZ(wx: number): number {
  return 2.75 + (wx - -16.92) * MAIN_EAST_WING_SLOPE;
}


/**
 * Shared ground-floor architectural materials (plaster, brick, oak, stone, glazing, paint palette).
 *
 * Extracted verbatim from `buildMainHouseGroundFloorRooms` (ground-floor-rooms.ts). Statement order and
 * geometry are unchanged; shared locals flow in via `kit` and out via the return value.
 */
export function createGroundFloorMaterials(
  _ctx: SceneBuilderContext
) {
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
  // Farrow & Ball "Cord" No. 16 — warm earthy corded-string yellow-stone neutral for the Sitting Room walls (Issue #14)
  const farrowAndBallCordMat = new THREE.MeshStandardMaterial({
    color: 0xcfc2a6,
    roughness: 0.86,
    metalness: 0.02,
  });
  // Farrow & Ball "Pantalon" No. 221 — dark moody olive-brown / umber for the Cinema Room walls (media_1790587491808.png)
  const farrowAndBallPantalonMat = new THREE.MeshStandardMaterial({
    color: 0x52493c,
    roughness: 0.85,
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

  // Dedicated single-clay-brick material for individual modelled bricks (voussoir soldier bricks & hearth border bricks)
  // so a 16-course multi-brick texture is never squashed onto a single 65mm brick!
  const singleClayBrickMat = new THREE.MeshStandardMaterial({
    color: 0x9e4733,
    roughness: 0.84,
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

  // Natural raw-effect matte-satin European oak for all wall skirting boards, architraves, interior doors & beams
  // (matching reference photo media_1791557597873_0dec7400.jpg — pale muted sandy-taupe oak without Danish-oil orange cast)
  const naturalOakJoineryTextures = createNaturalOakJoineryTextures();
  const antiqueOakSkirtingMat = new THREE.MeshStandardMaterial({
    map: naturalOakJoineryTextures.colorMap,
    bumpMap: naturalOakJoineryTextures.bumpMap,
    bumpScale: 0.0035,
    color: 0xf5efe6,
    roughness: 0.64,
    metalness: 0.02,
  });

  const timberDoorMat = new THREE.MeshStandardMaterial({
    map: naturalOakJoineryTextures.colorMap,
    bumpMap: naturalOakJoineryTextures.bumpMap,
    bumpScale: 0.0035,
    color: 0xf7f1e8,
    roughness: 0.62,
    metalness: 0.02,
  });

  // Crisp warm architectural white exterior paint finish for all Courtyard & Outbuilding Doors (Issue #2: "Make all of the doors white")
  const courtyardDoorMat = new THREE.MeshStandardMaterial({
    color: 0xf2eee4,
    roughness: 0.42,
    metalness: 0.04,
  });
  const courtyardDoorRecessMat = new THREE.MeshStandardMaterial({
    color: 0xd8d2c5,
    roughness: 0.46,
    metalness: 0.04,
  });

  const frontDoorMat = new THREE.MeshStandardMaterial({
    color: 0x24302c,
    roughness: 0.36,
    metalness: 0.08,
  });

  const oakMat = new THREE.MeshStandardMaterial({
    map: naturalOakJoineryTextures.colorMap,
    bumpMap: naturalOakJoineryTextures.bumpMap,
    bumpScale: 0.0035,
    color: 0xf2ebe0,
    roughness: 0.64,
    metalness: 0.02,
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

  const castIronMat = new THREE.MeshStandardMaterial({
    color: 0x1c1e21,
    roughness: 0.46,
    metalness: 0.68,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc59b58,
    roughness: 0.26,
    metalness: 0.86,
  });

  const ceramicWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf7f7f5,
    roughness: 0.16,
    metalness: 0.06,
  });

  // Sealed herringbone terracotta quarry tile floor material (Dining Room)
  const herringboneQuarryTextures = createHerringboneTerracottaQuarryTileTextures();
  const herringboneTerracottaQuarryMat = new THREE.MeshStandardMaterial({
    map: herringboneQuarryTextures.colorMap,
    bumpMap: herringboneQuarryTextures.bumpMap,
    bumpScale: 0.006,
    roughness: 0.42, // Sealed satin wax sheen on traditional terracotta quarry tiles
    metalness: 0.04,
  });

  // Knot & Grain "The Heritage Supreme Plank" (Grade: Heritage, Colour: Old Farmhouse, Heavily Brushed, Oil)
  const engineeredOakTextures = createEngineeredOakFloorTextures();
  const engineeredOakFloorMat = new THREE.MeshStandardMaterial({
    map: engineeredOakTextures.colorMap,
    bumpMap: engineeredOakTextures.bumpMap,
    bumpScale: 0.005,
    roughness: 0.58,
    metalness: 0.02,
  });

  // Fayrouz "Vitoria Classic Rosso" 30cm x 30cm matt marble-effect porcelain chequerboard,
  // laid on the diagonal (Front Entrance Hallway).
  const vitoriaChequerTextures = createVitoriaRossoChequerboardTextures();
  const vitoriaChequerTileMat = new THREE.MeshStandardMaterial({
    map: vitoriaChequerTextures.colorMap,
    bumpMap: vitoriaChequerTextures.bumpMap,
    bumpScale: 0.004,
    roughness: 0.52,
    metalness: 0.03,
  });
  const vitoriaChequerUvScale = 1 / VITORIA_CHEQUER_REPEAT_M;

  // Applies planar world-space UVs (wx * scaleX, wz * scaleZ) to a BoxGeometry floor slab
  // so BoxGeometry floors and buildPolygonalFloorSlab floors share 100% identical scale and alignment!
  const applyWorldSpaceFloorUVs = (
    geo: THREE.BoxGeometry,
    offsetX: number,
    offsetZ: number,
    scaleX: number,
    scaleZ: number = scaleX
  ): THREE.BoxGeometry => {
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    if (!pos || !uv) return geo;
    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i) + offsetX;
      const wz = pos.getZ(i) + offsetZ;
      uv.setXY(i, wx * scaleX, wz * scaleZ);
    }
    uv.needsUpdate = true;
    return geo;
  };

  // Traditional period farmhouse Ground Floor ceiling height (2.06m / 6'9"),
  // noticeably lower than the modern 3.00m vaulted Kitchen extension (Issues #1, #4, #11).
  const wallH = 2.06;
  // Issue #1: Reduced ceiling height in the front 2 rooms (Front Room & Sitting Room + Front Entrance Hallway,
  // floor at Y = -0.60m -> ceiling at Y = +1.625m, total room height = 2.225m) so the Sitting Room fireplace has
  // 17 courses of bricks on the lower pier, 7 courses above the opening to the white lintel, and 1 course above the lintel!
  const frontWallH = 1.625;
  const doorH = 1.9;
  const doorLintelH = wallH - doorH;
  const doorLintelY = doorH + doorLintelH / 2;

  const tagCutawayWall = (
    obj: THREE.Object3D,
    cutawayWall: CutawayWallDescriptor
  ): void => {
    obj.userData = {
      ...obj.userData,
      isCutawayWall: true,
      cutawayWall,
    };
  };

  return {
    antiqueOakSkirtingMat,
    applyWorldSpaceFloorUVs,
    brassMat,
    castIronMat,
    ceramicWhiteMat,
    courtyardDoorMat,
    courtyardDoorRecessMat,
    doorH,
    doorLintelH,
    doorLintelY,
    engineeredOakFloorMat,
    exteriorBrickMat,
    farrowAndBallCordMat,
    farrowAndBallPantalonMat,
    frontDoorMat,
    frontWallH,
    herringboneTerracottaQuarryMat,
    oakMat,
    plasterMat,
    singleClayBrickMat,
    skirtingMat,
    stoneSillMat,
    tagCutawayWall,
    timberDoorMat,
    vitoriaChequerTileMat,
    vitoriaChequerUvScale,
    wallCapMat,
    wallH,
    warmRoomPlasterMat,
    windowFrameMat,
    windowGlassMat,
  };
}
