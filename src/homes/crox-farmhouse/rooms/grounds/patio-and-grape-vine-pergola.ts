import * as THREE from 'three';
import {
  createCourtyardStoneTexture,
  createImperialBrickTextures,
} from '../../../../engine/textures/procedural-textures.ts';

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

/**
 * Builds the South-East Courtyard Terrace immediately South of the Kitchen Cobble Path (`Z = +3.73m`),
 * split into two distinct zones matching the aerial & courtyard reference photos (`Photos 1, 5, 8, 10, 11, 12`):
 *
 * 1. **West Half (`X = -4.52m..+0.20m, Z = +3.84m..+7.55m`): Raised Rattan Sofa Lounge Patio**:
 *    - Low reclaimed red-brick retaining wall topped with dark slate-grey/blue engineering brick coping (`Photo 12` right)
 *      and the square red-brick NW corner pier (`-4.52, +3.84`) with stepped stone pyramid cap (`Photos 1, 5, 12`).
 *    - Black wrought-iron boundary railings along the West return (`X = -4.52m`), weathered timber garden bench
 *      at `(-4.84, +5.65)` facing the main cobbled courtyard (`Photo 5` center), and rusted cast-iron circular
 *      fire-bowl planter on a low ring stand at `(-5.05, +6.92)` (`Photo 5` center-left).
 *    - Raised riven flagstone patio bordered along the East (`X = +0.18m`) & South (`Z = +7.50m`) by a reclaimed red-brick kerb (`Photo 12`).
 *    - L-shaped woven charcoal rattan corner sofa & square glass-topped rattan coffee table (`Photos 1 & 12`).
 *    - Perimeter planting: golden-yellow `Choisya` bush (`NW` corner), multi-stem pale sage ornamental shrub/tree (`W` border),
 *      rounded bright-green bush (`SW` corner), and the `SE` corner Hydrangea + 5-pot cluster (dark glazed pot, fluted stone
 *      urn, grey zinc cylinder pot, and 2 terracotta red-geranium pots, `Photo 12` foreground).
 *
 * 2. **East Half (`X = +0.35m..+5.55m, Z = +3.84m..+8.35m`): Walled Grape-Vine Pergola Dining Court**:
 *    - Riven flagstone court floor (`X = +0.32m..+5.56m, Z = +3.73m..+8.42m`).
 *    - **East Wall (`X = +5.42m`)**: Coursed honey-buff fieldstone/limestone wall (`2.22m` high) with a `1.10m`-wide
 *      garden walk-through opening (`Z = +5.45m..+6.55m`, `Photo 8` left & `Photo 1` right) and an interior low projecting
 *      stone bench ledge (`0.42m` high, `Photo 8` bottom-left) holding grey & terracotta pots.
 *    - **South Wall (`Z = +8.35m`)**: Tall reclaimed red-brick wall (`2.22m` high) with stone coping (`Photo 8` back & `Photo 10` right),
 *      an open gateway at the West end (`X = +0.67m..+1.57m`) fitted with an **ornate black wrought-iron scrollwork garden gate**
 *      (`Photo 8` back-right), and an exterior South raised brick herb/flower border facing the cobbled alleyway (`Photo 10` right).
 *    - **West & North Red-Brick Support Piers** (`(0.48, 3.84)`, `(0.48, 6.10)`, `(0.48, 8.35)`, `(1.76, 8.35)`, `(1.76, 3.84)`, `(5.42, 3.84)`)
 *      with cobalt-blue glazed ceramic pots & terracotta pots (`Photo 8` right).
 *    - **Heavy Weathered-Oak Overhead Pergola Beams & Rafters (`Y = 2.26m..2.48m`)** + **Festoon Café Globe String Lights** (`Photo 8` top).
 *    - **Gnarled Woody Grape-Vine Trunks (`Vitis vinifera`)**, high-LOD 5-lobed palmate grape-vine leaf canopy blanketing the rafters
 *      and cascading over the South brick wall & West piers (`Photos 1, 8, 10, 11, 12`), and pendant grape clusters.
 *    - **Slatted Weathered-Teak Rectangular Outdoor Dining Table & 6 Slatted Teak Armchairs** centered at `(3.05, 6.05)` (`Photo 8` center).
 */
export function buildPatioAndGrapeVinePergola(
  scene: THREE.Scene,
  southWallGroup: THREE.Group,
  kit: PatioAndGrapeVinePergolaKit
): void {
  const {
    limestoneEdgingMat,
    structuralOakMat,
    glassMat,
    buildLionHeadTrophyUrn,
    buildOldGrindstone,
  } = kit;

  // =========================================================================
  // 1. LOW BRICK RETAINING WALL & THRESHOLD PIERS ALONG THE KITCHEN COBBLE PATH (Z = +3.84m)
  // =========================================================================
  const courtyardBrickTextures = createImperialBrickTextures();
  const brickWallMat = new THREE.MeshStandardMaterial({
    color: 0xd8c6bc,
    map: courtyardBrickTextures.colorMap,
    bumpMap: courtyardBrickTextures.bumpMap,
    bumpScale: 0.018,
    roughness: 0.88,
  });
  const brickSoldierCopingMat = new THREE.MeshStandardMaterial({
    color: 0x945743,
    roughness: 0.82,
  });
  const blueBrickCopingMat = new THREE.MeshStandardMaterial({
    color: 0x484d56,
    roughness: 0.74,
    metalness: 0.05,
  });
  const applyCourtyardBrickUVs = (
    geo: THREE.BoxGeometry,
    ox: number,
    oy: number,
    oz: number
  ): THREE.BoxGeometry => {
    const pos = geo.attributes.position;
    const norm = geo.attributes.normal;
    const uv = geo.attributes.uv;
    if (!pos || !norm || !uv) return geo;
    const tileW = 1.35;
    const tileH = 1.2;
    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i) + ox;
      const wy = pos.getY(i) + oy;
      const wz = pos.getZ(i) + oz;
      const nx = Math.abs(norm.getX(i));
      const ny = Math.abs(norm.getY(i));
      const nz = Math.abs(norm.getZ(i));
      if (nz >= nx && nz >= ny) {
        uv.setXY(i, wx / tileW, wy / tileH);
      } else if (nx >= nz && nx >= ny) {
        uv.setXY(i, wz / tileW, wy / tileH);
      } else {
        uv.setXY(i, wx / tileW, wz / tileH);
      }
    }
    uv.needsUpdate = true;
    return geo;
  };

  // West section of the low brick retaining wall bordering the Raised Rattan Patio: X = -4.52m to +0.20m (width 4.72m, Photo 12 right)
  const lowBrickWallWest = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(4.72, 0.24, 0.22), -2.16, 0.11, 3.84),
    brickWallMat
  );
  lowBrickWallWest.position.set(-2.16, 0.11, 3.84);
  lowBrickWallWest.castShadow = true;
  lowBrickWallWest.receiveShadow = true;
  scene.add(lowBrickWallWest);

  const lowBrickCopingWest = new THREE.Mesh(
    new THREE.BoxGeometry(4.76, 0.048, 0.25),
    blueBrickCopingMat
  );
  lowBrickCopingWest.position.set(-2.16, 0.254, 3.84);
  lowBrickCopingWest.castShadow = true;
  lowBrickCopingWest.receiveShadow = true;
  scene.add(lowBrickCopingWest);

  // Square Red-Brick Corner Pier with Stepped Stone Pyramid Cap at the NW Corner of the Rattan Patio
  // (X = -4.52m, Z = +3.84m -- visible on the right of Photo 12 and center of Photo 1 & 5!)
  const westCornerPier = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(0.38, 0.56, 0.38), -4.52, 0.26, 3.84),
    brickWallMat
  );
  westCornerPier.position.set(-4.52, 0.26, 3.84);
  westCornerPier.castShadow = true;
  westCornerPier.receiveShadow = true;
  scene.add(westCornerPier);

  const westCornerPierCap = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.07, 0.44),
    limestoneEdgingMat
  );
  westCornerPierCap.position.set(-4.52, 0.575, 3.84);
  westCornerPierCap.castShadow = true;
  scene.add(westCornerPierCap);

  // West Return of the Low Brick Retaining Wall separating the Raised Rattan Patio
  // from the Main Cobbled Courtyard (X = -4.52m, Z = +3.84m..+7.48m, Photo 5 & 12)
  const lowBrickReturnWest = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(0.22, 0.28, 3.64), -4.52, 0.08, 5.66),
    brickWallMat
  );
  lowBrickReturnWest.position.set(-4.52, 0.08, 5.66);
  lowBrickReturnWest.castShadow = true;
  lowBrickReturnWest.receiveShadow = true;
  scene.add(lowBrickReturnWest);

  const lowBrickReturnCopingWest = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.048, 3.66),
    blueBrickCopingMat
  );
  lowBrickReturnCopingWest.position.set(-4.52, 0.244, 5.66);
  lowBrickReturnCopingWest.castShadow = true;
  lowBrickReturnCopingWest.receiveShadow = true;
  scene.add(lowBrickReturnCopingWest);

  // Black Wrought-Iron Boundary Railings along the West Return of the Rattan Patio (X = -4.52m, Z = +4.10m..+7.35m, Photo 5 center)
  const wroughtIronMat = new THREE.MeshStandardMaterial({
    color: 0x1c1e22,
    roughness: 0.44,
    metalness: 0.72,
  });
  for (const railY of [0.48, 0.82]) {
    const railBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.025, 3.28),
      wroughtIronMat
    );
    railBar.position.set(-4.52, railY, 5.72);
    railBar.castShadow = true;
    scene.add(railBar);
  }
  for (let rz = 4.12; rz <= 7.36; rz += 0.27) {
    const spindle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.62, 6),
      wroughtIronMat
    );
    spindle.position.set(-4.52, 0.56, rz);
    spindle.castShadow = true;
    scene.add(spindle);
  }

  // Weathered Timber Garden Bench & Rusted Cast-Iron Fire-Bowl Planter along the West side of the Rattan Patio
  // facing the main cobbled courtyard (X = -4.84m, Z = +5.65m, Photo 5 center!)
  const westPatioBenchGroup = new THREE.Group();
  westPatioBenchGroup.name = 'courtyard.rattanPatioWestBench';
  westPatioBenchGroup.position.set(-4.84, -0.14, 5.65);
  westPatioBenchGroup.rotation.y = -Math.PI / 2;
  const weatheredBenchMat = new THREE.MeshStandardMaterial({
    color: 0x8a755c,
    roughness: 0.76,
    metalness: 0.03,
  });
  const westBenchSeat = new THREE.Mesh(
    new THREE.BoxGeometry(1.22, 0.042, 0.46),
    weatheredBenchMat
  );
  westBenchSeat.position.set(0, 0.42, 0.02);
  westBenchSeat.castShadow = true;
  westPatioBenchGroup.add(westBenchSeat);
  const westBenchBack = new THREE.Mesh(
    new THREE.BoxGeometry(1.22, 0.4, 0.038),
    weatheredBenchMat
  );
  westBenchBack.position.set(0, 0.64, -0.2);
  westBenchBack.rotation.x = -0.08;
  westBenchBack.castShadow = true;
  westPatioBenchGroup.add(westBenchBack);
  for (const sx of [-0.57, 0.57]) {
    const fLeg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.56, 0.05), weatheredBenchMat);
    fLeg.position.set(sx, 0.28, 0.22);
    westPatioBenchGroup.add(fLeg);
    const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.84, 0.05), weatheredBenchMat);
    rLeg.position.set(sx, 0.42, -0.2);
    westPatioBenchGroup.add(rLeg);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.038, 0.48), weatheredBenchMat);
    arm.position.set(sx, 0.56, 0.01);
    westPatioBenchGroup.add(arm);
  }
  scene.add(westPatioBenchGroup);

  // Rusted Cast-Iron Circular Fire-Bowl Planter on a low ring stand (X = -5.05m, Z = +6.92m, Photo 5 center-left)
  const rustedBowlMat = new THREE.MeshStandardMaterial({
    color: 0x6e3b28,
    roughness: 0.84,
    metalness: 0.28,
  });
  const fireBowlStand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.3, 0.14, 16),
    wroughtIronMat
  );
  fireBowlStand.position.set(-5.05, -0.11, 6.92);
  scene.add(fireBowlStand);
  const fireBowl = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 18, 12, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5),
    rustedBowlMat
  );
  fireBowl.scale.set(1.0, 0.52, 1.0);
  fireBowl.position.set(-5.05, 0.14, 6.92);
  fireBowl.castShadow = true;
  scene.add(fireBowl);

  // =========================================================================
  // 2. SHARED BOTANICAL FOLIAGE & POT MATERIALS
  // =========================================================================
  const soilMat = new THREE.MeshStandardMaterial({
    color: 0x3b2b1e,
    roughness: 0.96,
  });
  const sageFoliageMat = new THREE.MeshStandardMaterial({
    color: 0x56704c,
    roughness: 0.84,
  });
  const deepGreenFoliageMat = new THREE.MeshStandardMaterial({
    color: 0x2e4d29,
    roughness: 0.8,
  });
  const goldenChoisyaMat = new THREE.MeshStandardMaterial({
    color: 0xc8b82e,
    roughness: 0.72,
  });
  const brightShrubGreenMat = new THREE.MeshStandardMaterial({
    color: 0x456e35,
    roughness: 0.76,
  });
  const whiteBloomMat = new THREE.MeshStandardMaterial({
    color: 0xf2ece0,
    roughness: 0.75,
  });
  const blushBloomMat = new THREE.MeshStandardMaterial({
    color: 0xd99ca5,
    roughness: 0.78,
  });
  const geraniumRedBloomMat = new THREE.MeshStandardMaterial({
    color: 0xc8372d,
    roughness: 0.72,
  });

  // =========================================================================
  // 3. WEST HALF: RAISED RIVEN FLAGSTONE PATIO, BRICK KERB & PERIMETER SHRUBS
  //    (X = -4.52m..+0.20m, Z = +3.95m..+7.55m -- Photos 1, 5, 12)
  // =========================================================================
  const limestoneSlabTex = createCourtyardStoneTexture();
  const limestoneSlabMat = new THREE.MeshStandardMaterial({
    map: limestoneSlabTex,
    roughness: 0.78,
    metalness: 0.04,
  });

  const rattanPatioSlab = new THREE.Mesh(
    new THREE.BoxGeometry(4.54, 0.14, 3.5),
    limestoneSlabMat
  );
  rattanPatioSlab.name = 'courtyard.rattanPatioSlab';
  rattanPatioSlab.position.set(-2.15, -0.02, 5.7);
  rattanPatioSlab.receiveShadow = true;
  scene.add(rattanPatioSlab);

  // Reclaimed Red-Brick Kerb Edging along the East (X = +0.18m) & South (Z = +7.50m) borders of the Rattan Patio (Photo 12 foreground)
  const rattanEastBrickKerb = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(0.14, 0.15, 3.62), 0.18, -0.01, 5.72),
    brickSoldierCopingMat
  );
  rattanEastBrickKerb.position.set(0.18, -0.01, 5.72);
  rattanEastBrickKerb.castShadow = true;
  rattanEastBrickKerb.receiveShadow = true;
  scene.add(rattanEastBrickKerb);

  const rattanSouthBrickKerb = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(4.78, 0.15, 0.14), -2.15, -0.01, 7.5),
    brickSoldierCopingMat
  );
  rattanSouthBrickKerb.position.set(-2.15, -0.01, 7.5);
  rattanSouthBrickKerb.castShadow = true;
  rattanSouthBrickKerb.receiveShadow = true;
  scene.add(rattanSouthBrickKerb);

  const clumpSphereGeo = new THREE.SphereGeometry(1, 14, 12);
  const bloomSphereGeo = new THREE.SphereGeometry(0.055, 8, 8);

  // 1) Golden-Yellow Choisya ternata 'Sundance' Shrub in the NW corner right behind the brick corner pier (Photo 12 right-center & Photo 1)
  for (const [dx, dy, dz, rx, ry, rz] of [
    [-3.82, 0.34, 4.35, 0.48, 0.38, 0.44],
    [-3.42, 0.3, 4.28, 0.38, 0.32, 0.36],
    [-4.12, 0.32, 4.52, 0.36, 0.34, 0.38],
  ] as const) {
    const choisyaMound = new THREE.Mesh(clumpSphereGeo, goldenChoisyaMat);
    choisyaMound.scale.set(rx, ry, rz);
    choisyaMound.position.set(dx, dy, dz);
    choisyaMound.castShadow = true;
    choisyaMound.receiveShadow = true;
    scene.add(choisyaMound);
  }

  // 2) Multi-Stem Pale Sage/Olive Ornamental Shrub / Small Tree on the West border (X = -4.15m, Z = +5.55m -- Photo 12 back-right & Photo 1)
  for (const [sx, sz, rotZ, rotX] of [
    [-4.18, 5.48, 0.14, -0.08],
    [-4.1, 5.62, -0.12, 0.1],
    [-4.22, 5.68, 0.08, 0.14],
  ] as const) {
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.028, 0.95, 8),
      structuralOakMat
    );
    stem.position.set(sx, 0.48, sz);
    stem.rotation.set(rotX, 0, rotZ);
    stem.castShadow = true;
    scene.add(stem);
  }
  for (const [cx, cy, cz, rx, ry, rz] of [
    [-4.15, 1.05, 5.55, 0.56, 0.42, 0.54],
    [-3.88, 0.96, 5.38, 0.42, 0.34, 0.42],
    [-4.25, 0.98, 5.82, 0.44, 0.36, 0.44],
  ] as const) {
    const canopy = new THREE.Mesh(clumpSphereGeo, sageFoliageMat);
    canopy.scale.set(rx, ry, rz);
    canopy.position.set(cx, cy, cz);
    canopy.castShadow = true;
    canopy.receiveShadow = true;
    scene.add(canopy);
  }

  // 3) Rounded Bright-Green Evergreen Shrub in the SW corner of the Rattan Patio (X = -3.98m, Z = +7.02m -- Photo 12 back-left & Photo 1)
  for (const [bx, by, bz, rx, ry, rz] of [
    [-3.98, 0.38, 7.02, 0.52, 0.42, 0.48],
    [-3.62, 0.32, 7.18, 0.38, 0.32, 0.36],
  ] as const) {
    const swBush = new THREE.Mesh(clumpSphereGeo, brightShrubGreenMat);
    swBush.scale.set(rx, ry, rz);
    swBush.position.set(bx, by, bz);
    swBush.castShadow = true;
    swBush.receiveShadow = true;
    scene.add(swBush);
  }

  // 4) North Border Perennials along the inside of the low brick wall (X = -2.85m..-0.35m, Z = +4.22m -- Photo 12 right)
  for (const [px, pz, r, h, mat] of [
    [-2.75, 4.22, 0.34, 0.28, sageFoliageMat],
    [-1.95, 4.24, 0.36, 0.32, deepGreenFoliageMat],
    [-1.15, 4.22, 0.32, 0.28, brightShrubGreenMat],
    [-0.42, 4.24, 0.34, 0.3, sageFoliageMat],
  ] as const) {
    const clump = new THREE.Mesh(clumpSphereGeo, mat);
    clump.scale.set(r, h, r * 0.88);
    clump.position.set(px, h * 0.48, pz);
    clump.castShadow = true;
    scene.add(clump);
  }

  // 5) SE Corner Hydrangea Bush & 5-Pot Cluster along the East/South corner of the Rattan Patio (Photo 12 foreground left!)
  for (const [hx, hy, hz, rx, ry, rz] of [
    [-0.68, 0.36, 7.08, 0.48, 0.38, 0.44],
    [-0.32, 0.34, 7.22, 0.42, 0.34, 0.38],
  ] as const) {
    const hydrangea = new THREE.Mesh(clumpSphereGeo, deepGreenFoliageMat);
    hydrangea.scale.set(rx, ry, rz);
    hydrangea.position.set(hx, hy, hz);
    hydrangea.castShadow = true;
    hydrangea.receiveShadow = true;
    scene.add(hydrangea);
  }

  const darkGlazedPotMat = new THREE.MeshStandardMaterial({
    color: 0x2f2622,
    roughness: 0.34,
    metalness: 0.12,
  });
  const zincPotMat = new THREE.MeshStandardMaterial({
    color: 0x7a8086,
    roughness: 0.56,
    metalness: 0.24,
  });
  const potMat = new THREE.MeshStandardMaterial({ color: 0xa45a3f, roughness: 0.75 });

  for (const [px, pz, rTop, rBot, potH, pMat, cMat, hasRedBlooms] of [
    [-0.32, 6.42, 0.22, 0.15, 0.36, darkGlazedPotMat, brightShrubGreenMat, false],
    [0.18, 6.62, 0.16, 0.14, 0.32, zincPotMat, sageFoliageMat, false],
    [0.2, 7.04, 0.15, 0.11, 0.26, potMat, deepGreenFoliageMat, true],
    [-0.02, 7.32, 0.14, 0.1, 0.24, potMat, deepGreenFoliageMat, true],
  ] as const) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, potH, 14), pMat);
    pot.position.set(px, potH / 2 + 0.04, pz);
    pot.castShadow = true;
    pot.receiveShadow = true;
    scene.add(pot);

    const foliage = new THREE.Mesh(clumpSphereGeo, cMat);
    foliage.scale.set(rTop * 1.15, rTop * 0.95, rTop * 1.15);
    foliage.position.set(px, potH + rTop * 0.55, pz);
    foliage.castShadow = true;
    scene.add(foliage);

    if (hasRedBlooms) {
      for (const [bx, by, bz] of [
        [-0.05, potH + rTop * 1.05, 0.03],
        [0.06, potH + rTop * 1.1, -0.04],
        [0.0, potH + rTop * 1.18, 0.01],
      ] as const) {
        const bloom = new THREE.Mesh(bloomSphereGeo, geraniumRedBloomMat);
        bloom.position.set(px + bx, by, pz + bz);
        scene.add(bloom);
      }
    }
  }

  // =========================================================================
  // 4. DECORATIVE TROPHY / CUP PLANTER WITH SCULPTED LION HEADS (Campagna / Medici Urn)
  //    & OLD RECLAIMED YORKSTONE GRINDSTONE (Photos 11 & 12)
  // =========================================================================
  buildLionHeadTrophyUrn(scene, 0.18, 6.08, deepGreenFoliageMat, whiteBloomMat, blushBloomMat);
  buildOldGrindstone(scene, 0.32, 4.18, structuralOakMat);

  // =========================================================================
  // 5. PAIR OF CLIPPED BAY LEAF TOPIARY TREES BY UTILITY SPLIT STABLE DOOR
  //    & CLIMBING GREEN IVY ON THE KITCHEN SOUTH BRICK PIER (Photos 1, 3, 11)
  // =========================================================================
  const bayLeafDarkMat = new THREE.MeshStandardMaterial({
    color: 0x2d4d2a,
    roughness: 0.62,
    metalness: 0.04,
  });
  const bayLeafMidMat = new THREE.MeshStandardMaterial({
    color: 0x3b6136,
    roughness: 0.58,
    metalness: 0.04,
  });
  const utilityBayTreePositions: ReadonlyArray<readonly [number, number]> = [
    [5.85, -0.58], // Flanking South side of Utility Split Stable Exit Door
    [5.85, -2.15], // Flanking North side of Utility Split Stable Exit Door
  ];
  for (const [bx, bz] of utilityBayTreePositions) {
    const bayPot = new THREE.Mesh(
      new THREE.CylinderGeometry(0.185, 0.135, 0.31, 14),
      potMat
    );
    bayPot.position.set(bx, 0.155, bz);
    bayPot.castShadow = true;
    bayPot.receiveShadow = true;
    scene.add(bayPot);

    const bayPotRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.185, 0.016, 8, 16),
      potMat
    );
    bayPotRim.rotation.x = Math.PI / 2;
    bayPotRim.position.set(bx, 0.302, bz);
    scene.add(bayPotRim);

    const baySoil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.17, 0.02, 12),
      soilMat
    );
    baySoil.position.set(bx, 0.295, bz);
    scene.add(baySoil);

    const bayStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.022, 0.52, 8),
      structuralOakMat
    );
    bayStem.position.set(bx, 0.56, bz);
    bayStem.castShadow = true;
    scene.add(bayStem);

    const bayCrownCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 14, 12),
      bayLeafDarkMat
    );
    bayCrownCore.scale.set(1.0, 1.06, 1.0);
    bayCrownCore.position.set(bx, 0.96, bz);
    bayCrownCore.castShadow = true;
    bayCrownCore.receiveShadow = true;
    scene.add(bayCrownCore);

    const lobeOffsets: ReadonlyArray<readonly [number, number, number, number]> = [
      [0.08, 0.05, 0.07, 0.12],
      [-0.08, 0.04, 0.06, 0.115],
      [0.06, 0.06, -0.08, 0.115],
      [-0.07, 0.03, -0.07, 0.12],
      [0.0, 0.1, 0.0, 0.13],
      [0.1, -0.04, 0.0, 0.11],
      [-0.1, -0.04, 0.0, 0.11],
    ];
    for (let i = 0; i < lobeOffsets.length; i++) {
      const [lx, ly, lz, lr] = lobeOffsets[i]!;
      const lobe = new THREE.Mesh(
        new THREE.DodecahedronGeometry(lr, 0),
        i % 2 === 0 ? bayLeafMidMat : bayLeafDarkMat
      );
      lobe.position.set(bx + lx, 0.96 + ly, bz + lz);
      lobe.castShadow = true;
      scene.add(lobe);
    }
  }

  const pierIvyGeo = new THREE.DodecahedronGeometry(1, 0);
  for (let i = 0; i < 18; i++) {
    const t = i / 17;
    const y = 0.25 + t * 2.55;
    const spreadX = (Math.sin(i * 4.7) * 0.5) * 0.44 * (1 - t * 0.25);
    const r = 0.11 + (i % 3) * 0.025;
    const ivyLeaf = new THREE.Mesh(
      pierIvyGeo,
      i % 2 === 0 ? bayLeafDarkMat : bayLeafMidMat
    );
    ivyLeaf.scale.set(r * 1.15, r, 0.06);
    ivyLeaf.position.set(1.15 + spreadX, y, 2.3);
    southWallGroup.add(ivyLeaf);
  }

  // =========================================================================
  // 6. L-SHAPED CHARCOAL WOVEN RATTAN OUTDOOR CORNER SOFA & SQUARE COFFEE TABLE
  //    ON THE WEST RAISED FLAGSTONE PATIO (X = -2.25m, Z = +5.65m -- Photos 1 & 12)
  // =========================================================================
  const rattanGroup = new THREE.Group();
  rattanGroup.name = 'courtyard.rattanCornerSofa';
  rattanGroup.position.set(-2.25, 0.05, 5.65);

  const charcoalRattanMat = new THREE.MeshStandardMaterial({
    color: 0x2c2e32,
    roughness: 0.76,
    metalness: 0.06,
  });
  const outdoorCushionMat = new THREE.MeshStandardMaterial({
    color: 0xd8d5ce,
    roughness: 0.82,
    metalness: 0.02,
  });
  const outdoorAccentPillowMat = new THREE.MeshStandardMaterial({
    color: 0x56636e,
    roughness: 0.78,
  });

  const sofaNorthBase = new THREE.Mesh(
    new THREE.BoxGeometry(2.24, 0.28, 0.84),
    charcoalRattanMat
  );
  sofaNorthBase.position.set(0, 0.16, -0.62);
  sofaNorthBase.castShadow = true;
  sofaNorthBase.receiveShadow = true;
  rattanGroup.add(sofaNorthBase);

  const sofaNorthBack = new THREE.Mesh(
    new THREE.BoxGeometry(2.24, 0.46, 0.14),
    charcoalRattanMat
  );
  sofaNorthBack.position.set(0, 0.53, -0.97);
  sofaNorthBack.castShadow = true;
  rattanGroup.add(sofaNorthBack);

  const sofaNorthEastArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.38, 0.84),
    charcoalRattanMat
  );
  sofaNorthEastArm.position.set(1.05, 0.49, -0.62);
  sofaNorthEastArm.castShadow = true;
  rattanGroup.add(sofaNorthEastArm);

  const sofaWestBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.84, 0.28, 1.34),
    charcoalRattanMat
  );
  sofaWestBase.position.set(-0.7, 0.16, 0.47);
  sofaWestBase.castShadow = true;
  sofaWestBase.receiveShadow = true;
  rattanGroup.add(sofaWestBase);

  const sofaWestBack = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.46, 2.04),
    charcoalRattanMat
  );
  sofaWestBack.position.set(-1.05, 0.53, 0.04);
  sofaWestBack.castShadow = true;
  rattanGroup.add(sofaWestBack);

  const sofaSouthArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.84, 0.38, 0.14),
    charcoalRattanMat
  );
  sofaSouthArm.position.set(-0.7, 0.49, 1.07);
  sofaSouthArm.castShadow = true;
  rattanGroup.add(sofaSouthArm);

  for (const cx of [-0.65, 0.0, 0.65]) {
    const seatCushion = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.11, 0.68),
      outdoorCushionMat
    );
    seatCushion.position.set(cx, 0.355, -0.55);
    seatCushion.castShadow = true;
    seatCushion.receiveShadow = true;
    rattanGroup.add(seatCushion);

    const backCushion = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.32, 0.13),
      outdoorCushionMat
    );
    backCushion.position.set(cx, 0.56, -0.83);
    backCushion.rotation.x = 0.12;
    backCushion.castShadow = true;
    rattanGroup.add(backCushion);
  }

  for (const cz of [0.1, 0.7]) {
    const seatCushion = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.11, 0.58),
      outdoorCushionMat
    );
    seatCushion.position.set(-0.63, 0.355, cz);
    seatCushion.castShadow = true;
    seatCushion.receiveShadow = true;
    rattanGroup.add(seatCushion);

    const backCushion = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.32, 0.56),
      outdoorCushionMat
    );
    backCushion.position.set(-0.9, 0.56, cz);
    backCushion.rotation.z = -0.12;
    backCushion.castShadow = true;
    rattanGroup.add(backCushion);
  }

  for (const [px, pz, rotY] of [
    [-0.82, -0.76, 0.78],
    [0.82, -0.72, -0.45],
    [-0.76, 0.84, 1.2],
  ] as const) {
    const pillow = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.28, 0.1),
      outdoorAccentPillowMat
    );
    pillow.position.set(px, 0.54, pz);
    pillow.rotation.y = rotY;
    pillow.castShadow = true;
    rattanGroup.add(pillow);
  }

  // Matching Square Woven Charcoal Rattan Coffee Table / Ottoman (Photo 12 center)
  const rattanTableBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, 0.36, 0.88),
    charcoalRattanMat
  );
  rattanTableBase.position.set(0.24, 0.18, 0.34);
  rattanTableBase.castShadow = true;
  rattanTableBase.receiveShadow = true;
  rattanGroup.add(rattanTableBase);

  const rattanTableGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.84, 0.018, 0.84),
    glassMat
  );
  rattanTableGlass.position.set(0.24, 0.37, 0.34);
  rattanGroup.add(rattanTableGlass);

  scene.add(rattanGroup);

  // =========================================================================
  // 7. EAST HALF: WALLED GRAPE-VINE PERGOLA DINING COURT, BRICK & FIELDSTONE WALLS,
  //    WROUGHT-IRON SCROLLWORK GATE, TEAK DINING TABLE & 6 CHAIRS, AND LUSH
  //    VITIS VINIFERA GRAPE-VINE CANOPY (X = +0.35m..+5.55m, Z = +3.73m..+8.35m -- Photos 1, 8, 10, 11, 12)
  // =========================================================================
  const pergolaGroup = new THREE.Group();
  pergolaGroup.name = 'courtyard.grapeVinePergola';
  const pergMinX = 0.48;
  const pergMaxX = 5.42;
  const pergMinZ = 3.84;
  const pergMaxZ = 8.35;
  const pergWallH = 2.22;
  const pergBeamY = 2.3;
  const pergRafterY = 2.42;

  const pergolaCourtFloor = new THREE.Mesh(
    new THREE.BoxGeometry(5.24, 0.11, 4.69),
    limestoneSlabMat
  );
  pergolaCourtFloor.name = 'courtyard.grapeVinePergola.floor';
  pergolaCourtFloor.position.set(2.94, -0.055, 6.075);
  pergolaCourtFloor.receiveShadow = true;
  pergolaGroup.add(pergolaCourtFloor);

  // Coursed Honey-Buff Fieldstone / Limestone Rubble Material for the East Wall (Photo 8 left & Photo 1 right)
  const fieldstoneWallMat = new THREE.MeshStandardMaterial({
    color: 0xc8b598,
    map: limestoneSlabTex,
    roughness: 0.88,
    metalness: 0.02,
  });

  // East Coursed Fieldstone Wall (X = +5.42m, Z = +3.84m..+8.35m) with a 1.10m garden walk-through opening (Z = +5.45m..+6.55m, Photo 8 left)
  const eastStoneWallNorth = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, pergWallH, 1.61),
    fieldstoneWallMat
  );
  eastStoneWallNorth.position.set(pergMaxX, pergWallH / 2, 4.645);
  eastStoneWallNorth.castShadow = true;
  eastStoneWallNorth.receiveShadow = true;
  pergolaGroup.add(eastStoneWallNorth);

  const eastStoneCopingNorth = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.06, 1.65),
    limestoneEdgingMat
  );
  eastStoneCopingNorth.position.set(pergMaxX, pergWallH + 0.03, 4.645);
  eastStoneCopingNorth.castShadow = true;
  pergolaGroup.add(eastStoneCopingNorth);

  const eastStoneWallSouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, pergWallH, 1.8),
    fieldstoneWallMat
  );
  eastStoneWallSouth.position.set(pergMaxX, pergWallH / 2, 7.45);
  eastStoneWallSouth.castShadow = true;
  eastStoneWallSouth.receiveShadow = true;
  pergolaGroup.add(eastStoneWallSouth);

  const eastStoneCopingSouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.06, 1.84),
    limestoneEdgingMat
  );
  eastStoneCopingSouth.position.set(pergMaxX, pergWallH + 0.03, 7.45);
  eastStoneCopingSouth.castShadow = true;
  pergolaGroup.add(eastStoneCopingSouth);

  // Projecting Low Interior Stone Bench Ledge along the North-East Stone Wall (X = +5.12m, Z = +4.02m..+5.38m, Photo 8 bottom-left)
  const eastStoneBenchBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.38, 1.34),
    fieldstoneWallMat
  );
  eastStoneBenchBase.position.set(pergMaxX - 0.3, 0.19, 4.68);
  eastStoneBenchBase.castShadow = true;
  eastStoneBenchBase.receiveShadow = true;
  pergolaGroup.add(eastStoneBenchBase);

  const eastStoneBenchSlab = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.05, 1.38),
    limestoneEdgingMat
  );
  eastStoneBenchSlab.position.set(pergMaxX - 0.3, 0.405, 4.68);
  eastStoneBenchSlab.castShadow = true;
  pergolaGroup.add(eastStoneBenchSlab);

  for (const [pz, r, h, pMat] of [
    [4.24, 0.11, 0.2, zincPotMat],
    [4.68, 0.12, 0.22, potMat],
    [5.12, 0.1, 0.18, zincPotMat],
  ] as const) {
    const ledgePot = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.76, h, 12), pMat);
    ledgePot.position.set(pergMaxX - 0.28, 0.43 + h / 2, pz);
    ledgePot.castShadow = true;
    pergolaGroup.add(ledgePot);

    const ledgePlant = new THREE.Mesh(clumpSphereGeo, sageFoliageMat);
    ledgePlant.scale.set(r * 1.15, r * 0.95, r * 1.15);
    ledgePlant.position.set(pergMaxX - 0.28, 0.43 + h + r * 0.45, pz);
    pergolaGroup.add(ledgePlant);
  }

  // South Tall Reclaimed Red-Brick Wall (Z = +8.35m, X = +1.72m..+5.55m, height = 2.22m -- Photo 8 back & Photo 10 right)
  const southPergolaBrickWall = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(3.83, pergWallH, 0.26), 3.635, pergWallH / 2, pergMaxZ),
    brickWallMat
  );
  southPergolaBrickWall.name = 'courtyard.grapeVinePergola.southBrickWall';
  southPergolaBrickWall.position.set(3.635, pergWallH / 2, pergMaxZ);
  southPergolaBrickWall.castShadow = true;
  southPergolaBrickWall.receiveShadow = true;
  pergolaGroup.add(southPergolaBrickWall);

  const southPergolaBrickCoping = new THREE.Mesh(
    new THREE.BoxGeometry(3.89, 0.06, 0.32),
    limestoneEdgingMat
  );
  southPergolaBrickCoping.position.set(3.635, pergWallH + 0.03, pergMaxZ);
  southPergolaBrickCoping.castShadow = true;
  pergolaGroup.add(southPergolaBrickCoping);

  // Exterior South Raised Brick Herb & Flower Border along the outer South face of the Pergola Wall facing the Cobbled Alleyway (Photo 10 right!)
  const southAlleyHerbBedKerb = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(3.8, 0.26, 0.12), 3.64, 0.06, pergMaxZ + 0.44),
    brickWallMat
  );
  southAlleyHerbBedKerb.position.set(3.64, 0.06, pergMaxZ + 0.44);
  southAlleyHerbBedKerb.castShadow = true;
  pergolaGroup.add(southAlleyHerbBedKerb);

  const southAlleyHerbSoil = new THREE.Mesh(
    new THREE.BoxGeometry(3.72, 0.2, 0.32),
    soilMat
  );
  southAlleyHerbSoil.position.set(3.64, 0.04, pergMaxZ + 0.26);
  pergolaGroup.add(southAlleyHerbSoil);

  for (let hx = 2.05; hx <= 5.25; hx += 0.62) {
    const herbMound = new THREE.Mesh(
      clumpSphereGeo,
      Math.round(hx * 2) % 2 === 0 ? sageFoliageMat : deepGreenFoliageMat
    );
    herbMound.scale.set(0.32, 0.26, 0.24);
    herbMound.position.set(hx, 0.22, pergMaxZ + 0.26);
    herbMound.castShadow = true;
    pergolaGroup.add(herbMound);
  }

  // Ornate Black Wrought-Iron Scrollwork Garden Gate in the South-West Gateway (X = +0.67m..+1.57m, Z = +8.35m -- Photo 8 back-right!)
  const ironGateGroup = new THREE.Group();
  ironGateGroup.name = 'courtyard.grapeVinePergola.wroughtIronGate';
  ironGateGroup.position.set(1.12, 0.02, pergMaxZ);
  const gateW = 0.88;
  const gateH = 1.82;
  for (const gx of [-gateW / 2, gateW / 2]) {
    const stile = new THREE.Mesh(new THREE.BoxGeometry(0.032, gateH, 0.032), wroughtIronMat);
    stile.position.set(gx, gateH / 2, 0);
    stile.castShadow = true;
    ironGateGroup.add(stile);
  }
  for (const gy of [0.12, 0.92, gateH - 0.08]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(gateW, 0.026, 0.026), wroughtIronMat);
    rail.position.set(0, gy, 0);
    rail.castShadow = true;
    ironGateGroup.add(rail);
  }
  for (let bx = -0.33; bx <= 0.34; bx += 0.11) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, gateH - 0.14, 6), wroughtIronMat);
    bar.position.set(bx, gateH / 2 + 0.02, 0);
    bar.castShadow = true;
    ironGateGroup.add(bar);
    if (Math.abs(bx) < 0.3) {
      const scroll = new THREE.Mesh(new THREE.TorusGeometry(0.044, 0.006, 6, 12), wroughtIronMat);
      scroll.position.set(bx, 1.34, 0);
      ironGateGroup.add(scroll);
    }
  }
  const gateCrest = new THREE.Mesh(
    new THREE.TorusGeometry(gateW * 0.42, 0.012, 8, 18, Math.PI),
    wroughtIronMat
  );
  gateCrest.position.set(0, gateH - 0.08, 0);
  ironGateGroup.add(gateCrest);
  pergolaGroup.add(ironGateGroup);

  // Red-Brick Support Piers along the West & North Open Sides of the Grape-Vine Pergola (Photo 8 right & Photo 12 left)
  for (const [px, pz, pw, pd] of [
    [pergMinX, pergMinZ, 0.38, 0.38],
    [pergMinX, 6.1, 0.38, 0.38],
    [pergMinX, pergMaxZ, 0.38, 0.38],
    [1.76, pergMaxZ, 0.36, 0.36],
    [1.76, pergMinZ, 0.36, 0.36],
    [pergMaxX, pergMinZ, 0.38, 0.38],
  ] as const) {
    const pier = new THREE.Mesh(
      applyCourtyardBrickUVs(new THREE.BoxGeometry(pw, pergWallH, pd), px, pergWallH / 2, pz),
      brickWallMat
    );
    pier.position.set(px, pergWallH / 2, pz);
    pier.castShadow = true;
    pier.receiveShadow = true;
    pergolaGroup.add(pier);

    const pierCap = new THREE.Mesh(
      new THREE.BoxGeometry(pw + 0.06, 0.06, pd + 0.06),
      limestoneEdgingMat
    );
    pierCap.position.set(px, pergWallH + 0.03, pz);
    pierCap.castShadow = true;
    pergolaGroup.add(pierCap);
  }

  for (const [wx, ww] of [
    [1.12, 0.92],
    [4.77, 1.3],
  ] as const) {
    const dwarfWall = new THREE.Mesh(
      applyCourtyardBrickUVs(new THREE.BoxGeometry(ww, 0.38, 0.24), wx, 0.19, pergMinZ),
      brickWallMat
    );
    dwarfWall.position.set(wx, 0.19, pergMinZ);
    dwarfWall.castShadow = true;
    dwarfWall.receiveShadow = true;
    pergolaGroup.add(dwarfWall);

    const dwarfCoping = new THREE.Mesh(
      new THREE.BoxGeometry(ww + 0.04, 0.05, 0.28),
      limestoneEdgingMat
    );
    dwarfCoping.position.set(wx, 0.405, pergMinZ);
    pergolaGroup.add(dwarfCoping);
  }

  // Cobalt-Blue Glazed Ceramic Pots & Terracotta Pots clustered around the West & North Pergola Brick Piers (Photo 8 right!)
  const cobaltBluePotMat = new THREE.MeshStandardMaterial({
    color: 0x1d4e89,
    roughness: 0.28,
    metalness: 0.14,
  });
  for (const [px, pz, rTop, rBot, h, pMat, fMat] of [
    [0.82, 6.28, 0.19, 0.13, 0.34, cobaltBluePotMat, brightShrubGreenMat],
    [0.78, 5.76, 0.16, 0.11, 0.28, potMat, sageFoliageMat],
    [0.84, 4.18, 0.18, 0.12, 0.32, cobaltBluePotMat, deepGreenFoliageMat],
    [2.08, 4.16, 0.17, 0.12, 0.3, potMat, brightShrubGreenMat],
    [4.42, 4.18, 0.18, 0.13, 0.32, potMat, sageFoliageMat],
  ] as const) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 14), pMat);
    pot.position.set(px, h / 2, pz);
    pot.castShadow = true;
    pot.receiveShadow = true;
    pergolaGroup.add(pot);

    const bush = new THREE.Mesh(clumpSphereGeo, fMat);
    bush.scale.set(rTop * 1.2, rTop * 1.05, rTop * 1.2);
    bush.position.set(px, h + rTop * 0.55, pz);
    bush.castShadow = true;
    pergolaGroup.add(bush);
  }

  // Heavy Weathered-Oak Overhead Pergola Beams, Cross-Rafters & Vine Battens (Y = 2.26m..2.48m -- Photo 8 top)
  const beamSpanX = pergMaxX - pergMinX + 0.52;
  const beamMidX = (pergMinX + pergMaxX) / 2;
  for (const bz of [pergMinZ, 6.1, pergMaxZ]) {
    const mainBeam = new THREE.Mesh(
      new THREE.BoxGeometry(beamSpanX, 0.15, 0.14),
      structuralOakMat
    );
    mainBeam.position.set(beamMidX, pergBeamY, bz);
    mainBeam.castShadow = true;
    mainBeam.receiveShadow = true;
    pergolaGroup.add(mainBeam);
  }

  const rafterSpanZ = pergMaxZ - pergMinZ + 0.56;
  const rafterMidZ = (pergMinZ + pergMaxZ) / 2;
  for (let rx = pergMinX; rx <= pergMaxX + 0.05; rx += 0.6175) {
    const rafter = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.13, rafterSpanZ),
      structuralOakMat
    );
    rafter.position.set(rx, pergRafterY, rafterMidZ);
    rafter.castShadow = true;
    rafter.receiveShadow = true;
    pergolaGroup.add(rafter);
  }

  for (let bz = pergMinZ + 0.45; bz <= pergMaxZ - 0.35; bz += 0.76) {
    const batten = new THREE.Mesh(
      new THREE.BoxGeometry(beamSpanX - 0.12, 0.036, 0.045),
      structuralOakMat
    );
    batten.position.set(beamMidX, pergRafterY + 0.08, bz);
    pergolaGroup.add(batten);
  }

  // Festoon Café Globe String Lights draped across the Pergola Rafters (Photo 8 top)
  const festoonCordMat = new THREE.MeshStandardMaterial({ color: 0x232528, roughness: 0.6 });
  const festoonBulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff5d6,
    emissive: 0xffb84d,
    emissiveIntensity: 0.55,
    roughness: 0.2,
  });
  const festoonBulbGeo = new THREE.SphereGeometry(0.024, 8, 8);
  for (const fz of [4.85, 6.05, 7.25]) {
    const cordPts: THREE.Vector3[] = [];
    for (let s = 0; s <= 12; s++) {
      const t = s / 12;
      const fx = pergMinX + 0.25 + t * (pergMaxX - pergMinX - 0.5);
      const sag = Math.sin(t * Math.PI * 4) * 0.06;
      const fy = pergBeamY - 0.06 - Math.abs(sag);
      cordPts.push(new THREE.Vector3(fx, fy, fz));
      if (s > 0 && s < 12) {
        const bulb = new THREE.Mesh(festoonBulbGeo, festoonBulbMat);
        bulb.position.set(fx, fy - 0.028, fz);
        pergolaGroup.add(bulb);
      }
    }
    const cordMesh = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cordPts), 24, 0.004, 5, false),
      festoonCordMat
    );
    pergolaGroup.add(cordMesh);
  }

  // Gnarled Woody Grape-Vine Trunks & Cordons + High-LOD 5-Lobed Botanical Grape-Vine Leaf Canopy
  // (Vitis vinifera) + Pendant Grape Clusters (Photos 1, 8, 10, 11, 12)
  const vineBarkMat = new THREE.MeshStandardMaterial({
    color: 0x543e2b,
    roughness: 0.9,
    metalness: 0.02,
  });
  const grapeDeepGreenMat = new THREE.MeshStandardMaterial({
    color: 0x2d5224,
    roughness: 0.66,
    metalness: 0.03,
    side: THREE.DoubleSide,
  });
  const grapeSunlitGreenMat = new THREE.MeshStandardMaterial({
    color: 0x467332,
    roughness: 0.62,
    metalness: 0.03,
    side: THREE.DoubleSide,
  });
  const grapeFreshLimeMat = new THREE.MeshStandardMaterial({
    color: 0x628f3c,
    roughness: 0.58,
    metalness: 0.03,
    side: THREE.DoubleSide,
  });
  const ripeGrapeMat = new THREE.MeshStandardMaterial({
    color: 0x422b4a,
    roughness: 0.36,
    metalness: 0.08,
  });
  const greenGrapeMat = new THREE.MeshStandardMaterial({
    color: 0x7ea148,
    roughness: 0.38,
    metalness: 0.06,
  });

  const vineTrunkPaths: ReadonlyArray<{
    readonly radius: number;
    readonly pts: ReadonlyArray<readonly [number, number, number]>;
  }> = [
    {
      radius: 0.042,
      pts: [
        [2.75, 0.0, 8.16],
        [2.68, 0.75, 8.14],
        [2.82, 1.55, 8.15],
        [2.76, 2.28, 8.05],
        [2.65, 2.46, 6.65],
        [2.52, 2.48, 4.95],
        [2.45, 2.45, 3.85],
      ],
    },
    {
      radius: 0.038,
      pts: [
        [4.35, 0.0, 8.16],
        [4.42, 0.82, 8.14],
        [4.28, 1.62, 8.15],
        [4.36, 2.32, 8.02],
        [4.15, 2.47, 6.45],
        [3.95, 2.48, 4.75],
        [3.82, 2.44, 3.78],
      ],
    },
    {
      radius: 0.034,
      pts: [
        [0.68, 0.0, 6.12],
        [0.72, 0.85, 6.08],
        [0.66, 1.68, 6.14],
        [0.74, 2.34, 6.05],
        [1.45, 2.47, 5.85],
        [1.35, 2.46, 4.25],
      ],
    },
  ];
  for (const trunk of vineTrunkPaths) {
    const curve = new THREE.CatmullRomCurve3(
      trunk.pts.map(([x, y, z]) => new THREE.Vector3(x, y, z))
    );
    const trunkMesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 24, trunk.radius, 7, false),
      vineBarkMat
    );
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    pergolaGroup.add(trunkMesh);
  }

  const createGrapeVineLeafSprayGeometry = (): THREE.BufferGeometry => {
    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];

    const addPalmateGrapeLeaf = (
      ox: number,
      oy: number,
      oz: number,
      scale: number,
      yaw: number,
      pitch: number,
      roll: number
    ): void => {
      const baseV = positions.length / 3;
      const quat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(pitch, yaw, roll, 'YXZ')
      );
      const vTmp = new THREE.Vector3();

      const pts: ReadonlyArray<readonly [number, number, number]> = [
        [0.0, 0.0, 0.0],
        [0.0, -0.025, 0.18],
        [-0.08, 0.01, -0.05],
        [-0.16, -0.015, 0.03],
        [-0.09, 0.005, 0.06],
        [-0.13, -0.02, 0.13],
        [0.08, 0.01, -0.05],
        [0.16, -0.015, 0.03],
        [0.09, 0.005, 0.06],
        [0.13, -0.02, 0.13],
        [0.0, 0.018, 0.08],
      ];

      for (const [lx, ly, lz] of pts) {
        vTmp.set(lx * scale, ly * scale, lz * scale).applyQuaternion(quat);
        positions.push(ox + vTmp.x, oy + vTmp.y, oz + vTmp.z);
        normals.push(0, 1, 0);
      }

      const tris: ReadonlyArray<readonly [number, number, number]> = [
        [0, 2, 3],
        [0, 3, 10],
        [3, 4, 10],
        [4, 5, 10],
        [5, 1, 10],
        [0, 10, 7],
        [0, 7, 6],
        [10, 8, 7],
        [10, 9, 8],
        [10, 1, 9],
      ];
      for (const [a, b, c] of tris) {
        indices.push(baseV + a, baseV + b, baseV + c);
      }
    };

    addPalmateGrapeLeaf(0.0, 0.03, 0.0, 1.15, 0.0, 0.18, 0.0);
    addPalmateGrapeLeaf(-0.09, 0.01, 0.06, 1.05, 0.85, 0.28, -0.22);
    addPalmateGrapeLeaf(0.09, 0.01, 0.06, 1.05, -0.85, 0.28, 0.22);
    addPalmateGrapeLeaf(-0.08, -0.01, -0.07, 1.0, 2.25, 0.34, -0.18);
    addPalmateGrapeLeaf(0.08, -0.01, -0.07, 1.0, -2.25, 0.34, 0.18);
    addPalmateGrapeLeaf(0.0, -0.02, -0.1, 0.95, 3.14, 0.42, 0.0);
    addPalmateGrapeLeaf(0.02, 0.05, 0.04, 0.9, 0.45, -0.15, 0.12);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  };

  const grapeSprayGeo = createGrapeVineLeafSprayGeometry();
  const grapeCanopyMats = [grapeDeepGreenMat, grapeSunlitGreenMat, grapeFreshLimeMat];

  // Dense Overhead Grape-Vine Canopy Blanketing the Pergola Rafters (Photos 1, 8, 10, 11, 12)
  for (let i = 0; i < 165; i++) {
    const h1 = Math.sin((i + 17) * 12.9898) * 43758.5453;
    const f1 = h1 - Math.floor(h1);
    const h2 = Math.sin((i + 17) * 78.233) * 19341.123;
    const f2 = h2 - Math.floor(h2);
    const h3 = Math.sin((i + 17) * 39.425) * 27183.456;
    const f3 = h3 - Math.floor(h3);

    const gx = pergMinX - 0.18 + f1 * (pergMaxX - pergMinX + 0.42);
    const gz = pergMinZ - 0.15 + f2 * (pergMaxZ - pergMinZ + 0.45);
    const gy = pergRafterY + 0.02 + f3 * 0.24;
    const scale = 1.15 + (i % 4) * 0.22;

    const spray = new THREE.Mesh(grapeSprayGeo, grapeCanopyMats[i % 3]!);
    spray.position.set(gx, gy, gz);
    spray.rotation.set((f3 - 0.5) * 0.55, f1 * Math.PI * 2, (f2 - 0.5) * 0.55);
    spray.scale.set(scale, scale, scale);
    spray.castShadow = true;
    spray.receiveShadow = true;
    pergolaGroup.add(spray);
  }

  // Trailing Grape-Vine Shoots Cascading Over the South Brick Wall (Photo 10 right!),
  // Over the West Edge toward the Rattan Patio (Photos 11 & 12 left!), and Down the Brick Piers (Photo 8 right!)
  for (let i = 0; i < 68; i++) {
    const t = i / 68;
    const h1 = Math.sin((i + 91) * 19.13) * 31415.926;
    const f1 = h1 - Math.floor(h1);
    const h2 = Math.sin((i + 91) * 53.71) * 27182.818;
    const f2 = h2 - Math.floor(h2);

    let gx = 0;
    let gy = 0;
    let gz = 0;
    if (i < 28) {
      gx = 1.55 + (i / 28) * 3.95;
      gy = 1.68 + f1 * 0.78;
      gz = pergMaxZ + 0.14 + f2 * 0.16;
    } else if (i < 50) {
      gx = pergMinX - 0.12 + f2 * 0.24;
      gy = 1.48 + f1 * 0.96;
      gz = pergMinZ + ((i - 28) / 22) * (pergMaxZ - pergMinZ);
    } else {
      gx = pergMinX + ((i - 50) / 18) * (pergMaxX - pergMinX);
      gy = 1.82 + f1 * 0.62;
      gz = pergMinZ - 0.12 + f2 * 0.2;
    }

    const scale = 1.05 + (i % 3) * 0.22;
    const trailingSpray = new THREE.Mesh(grapeSprayGeo, grapeCanopyMats[(i + 1) % 3]!);
    trailingSpray.position.set(gx, gy, gz);
    trailingSpray.rotation.set(0.65 + f1 * 0.5, t * Math.PI * 4, (f2 - 0.5) * 0.6);
    trailingSpray.scale.set(scale, scale, scale);
    trailingSpray.castShadow = true;
    pergolaGroup.add(trailingSpray);
  }

  // Pendant Clusters of Grapes hanging beneath the Pergola Rafters (Photo 8 top)
  const grapeBerryGeo = new THREE.SphereGeometry(0.016, 6, 6);
  const bunchPositions: ReadonlyArray<readonly [number, number, number, boolean]> = [
    [2.15, 2.18, 5.15, true],
    [2.85, 2.16, 5.65, false],
    [3.55, 2.19, 6.25, true],
    [2.45, 2.17, 6.85, true],
    [3.95, 2.18, 5.35, false],
    [4.25, 2.16, 6.95, true],
    [1.65, 2.18, 6.35, false],
  ];
  for (const [bx, by, bz, isRipe] of bunchPositions) {
    const bMat = isRipe ? ripeGrapeMat : greenGrapeMat;
    for (let row = 0; row < 4; row++) {
      const ringR = (4 - row) * 0.011;
      const count = Math.max(1, 5 - row);
      for (let k = 0; k < count; k++) {
        const ang = (k / count) * Math.PI * 2 + row * 0.7;
        const berry = new THREE.Mesh(grapeBerryGeo, bMat);
        berry.position.set(
          bx + Math.cos(ang) * ringR,
          by - row * 0.024,
          bz + Math.sin(ang) * ringR
        );
        pergolaGroup.add(berry);
      }
    }
  }

  // Slatted Weathered-Teak Outdoor Dining Table & 6 Slatted Teak Armchairs
  // Centered under the Walled Grape-Vine Pergola at (X = +3.05m, Z = +6.05m -- Photo 8 center!)
  const diningSetGroup = new THREE.Group();
  diningSetGroup.name = 'courtyard.grapeVinePergola.diningSet';
  diningSetGroup.position.set(3.05, 0.0, 6.05);

  const pergolaTeakMat = new THREE.MeshStandardMaterial({
    color: 0x91795e,
    roughness: 0.7,
    metalness: 0.03,
  });

  const tableW = 2.08;
  const tableD = 0.98;
  const tableH = 0.75;

  for (let s = -4; s <= 4; s++) {
    const slat = new THREE.Mesh(
      new THREE.BoxGeometry(tableW - 0.08, 0.028, 0.092),
      pergolaTeakMat
    );
    slat.position.set(0, tableH - 0.014, s * 0.104);
    slat.castShadow = true;
    slat.receiveShadow = true;
    diningSetGroup.add(slat);
  }
  for (const sideZ of [-tableD / 2 + 0.04, tableD / 2 - 0.04]) {
    const sideApron = new THREE.Mesh(
      new THREE.BoxGeometry(tableW - 0.12, 0.075, 0.032),
      pergolaTeakMat
    );
    sideApron.position.set(0, tableH - 0.055, sideZ);
    sideApron.castShadow = true;
    diningSetGroup.add(sideApron);
  }
  for (const endX of [-tableW / 2 + 0.04, tableW / 2 - 0.04]) {
    const endApron = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.075, tableD - 0.12),
      pergolaTeakMat
    );
    endApron.position.set(endX, tableH - 0.055, 0);
    endApron.castShadow = true;
    diningSetGroup.add(endApron);
  }
  for (const lx of [-tableW / 2 + 0.06, tableW / 2 - 0.06]) {
    for (const lz of [-tableD / 2 + 0.06, tableD / 2 - 0.06]) {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.068, tableH - 0.02, 0.068),
        pergolaTeakMat
      );
      leg.position.set(lx, (tableH - 0.02) / 2, lz);
      leg.castShadow = true;
      diningSetGroup.add(leg);
    }
  }

  const chairConfigs: ReadonlyArray<readonly [number, number, number]> = [
    [-0.52, -0.78, 0],
    [0.52, -0.78, 0],
    [-0.52, 0.78, Math.PI],
    [0.52, 0.78, Math.PI],
    [-1.32, 0.0, Math.PI / 2],
    [1.32, 0.0, -Math.PI / 2],
  ];
  for (let c = 0; c < chairConfigs.length; c++) {
    const [cx, cz, rotY] = chairConfigs[c]!;
    const chair = new THREE.Group();
    chair.position.set(cx, 0, cz);
    chair.rotation.y = rotY;

    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.034, 0.48),
      pergolaTeakMat
    );
    seat.position.set(0, 0.45, 0);
    seat.castShadow = true;
    seat.receiveShadow = true;
    chair.add(seat);

    const crestRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.54, 0.055, 0.032),
      pergolaTeakMat
    );
    crestRail.position.set(0, 0.88, -0.22);
    crestRail.castShadow = true;
    chair.add(crestRail);

    for (let b = -3; b <= 3; b++) {
      const backSlat = new THREE.Mesh(
        new THREE.BoxGeometry(0.042, 0.4, 0.018),
        pergolaTeakMat
      );
      backSlat.position.set(b * 0.068, 0.66, -0.22);
      backSlat.castShadow = true;
      chair.add(backSlat);
    }

    for (const sx of [-0.24, 0.24]) {
      const fLeg = new THREE.Mesh(
        new THREE.BoxGeometry(0.042, 0.64, 0.042),
        pergolaTeakMat
      );
      fLeg.position.set(sx, 0.32, 0.21);
      fLeg.castShadow = true;
      chair.add(fLeg);

      const rLeg = new THREE.Mesh(
        new THREE.BoxGeometry(0.042, 0.9, 0.042),
        pergolaTeakMat
      );
      rLeg.position.set(sx, 0.45, -0.22);
      rLeg.castShadow = true;
      chair.add(rLeg);

      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(0.052, 0.03, 0.48),
        pergolaTeakMat
      );
      arm.position.set(sx, 0.64, 0.0);
      arm.castShadow = true;
      chair.add(arm);
    }

    diningSetGroup.add(chair);
  }

  pergolaGroup.add(diningSetGroup);
  scene.add(pergolaGroup);
}
