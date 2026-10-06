import * as THREE from 'three';
import { createDriftwoodTexture } from '../../../../../engine/textures/procedural-textures.ts';
import { prepGeo, tagHighLod } from './kitchen-joinery-shared.ts';

// Wide, shallow lathe-turned stoneware pedestal bowl profile
const bowlProfile: THREE.Vector2[] = [
  new THREE.Vector2(0.0, 0.0),
  new THREE.Vector2(0.076, 0.0),
  new THREE.Vector2(0.072, 0.014),
  new THREE.Vector2(0.062, 0.028),
  new THREE.Vector2(0.112, 0.048),
  new THREE.Vector2(0.152, 0.074),
  new THREE.Vector2(0.168, 0.104),
  new THREE.Vector2(0.162, 0.112),
  new THREE.Vector2(0.153, 0.105),
  new THREE.Vector2(0.136, 0.075),
  new THREE.Vector2(0.095, 0.05),
  new THREE.Vector2(0.045, 0.038),
  new THREE.Vector2(0.0, 0.035),
];

function createCenteredBananaGeometry(): THREE.BufferGeometry {
  const lenSegs = 14;
  const radSegs = 6;
  const halfSpanX = 0.074;
  const archRiseY = 0.028;
  const maxR = 0.0145;

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= lenSegs; i++) {
    const u = i / lenSegs;
    const t = u * 2 - 1; // [-1, +1]
    const cx = t * halfSpanX;
    const cy = t * t * archRiseY;
    const cz = (1 - t * t) * 0.005;

    // Tangent along the spine to orient the cross-section ring
    const dx = halfSpanX;
    const dy = 2 * t * archRiseY;
    const tLen = Math.hypot(dx, dy) || 1;
    const nx = -dy / tLen;
    const ny = dx / tLen;

    // Taper radius smoothly at both tips, with a short stem neck at t -> +1
    const profile =
      t > 0.82
        ? 0.24
        : Math.max(0.18, Math.cos(t * 0.44 * Math.PI));
    const r = maxR * profile;

    for (let j = 0; j <= radSegs; j++) {
      const v = j / radSegs;
      const theta = v * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      const px = cx + nx * (r * sinT);
      const py = cy + ny * (r * sinT);
      const pz = cz + r * 0.92 * cosT;

      positions.push(px, py, pz);
      uvs.push(u, v);
    }
  }

  const ringStride = radSegs + 1;
  for (let i = 0; i < lenSegs; i++) {
    for (let j = 0; j < radSegs; j++) {
      const a = i * ringStride + j;
      const b = (i + 1) * ringStride + j;
      const c = (i + 1) * ringStride + (j + 1);
      const d = i * ringStride + (j + 1);
      indices.push(a, b, d, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

const grapeRadius = 0.0105;

// Shared geometries for the Stoneware Fruit Bowl & Fruit Contents
const sharedPedestalBowlGeo = prepGeo(new THREE.LatheGeometry(bowlProfile, 28));
const sharedAppleGeo = prepGeo(new THREE.SphereGeometry(0.034, 16, 12));
const sharedFruitStemGeo = prepGeo(new THREE.CylinderGeometry(0.0018, 0.0012, 0.014, 6));
const sharedOrangeGeo = prepGeo(new THREE.SphereGeometry(0.035, 16, 12));
const sharedLemonGeo = prepGeo(new THREE.SphereGeometry(0.027, 14, 12));
const sharedPearBulbGeo = prepGeo(new THREE.SphereGeometry(0.03, 14, 12));
const sharedPearNeckGeo = prepGeo(new THREE.ConeGeometry(0.023, 0.04, 14));
const sharedBananaGeo = createCenteredBananaGeometry();
const sharedBananaCrownGeo = prepGeo(new THREE.CylinderGeometry(0.007, 0.009, 0.022, 8));
const sharedGrapeGeo = prepGeo(new THREE.SphereGeometry(grapeRadius, 10, 8));

// Shared geometries for the 3 Cox & Cox Weathered Oak Counter Stools
const sharedStoolSeatApronGeo = prepGeo(new THREE.BoxGeometry(0.31, 0.036, 0.2));
const sharedStoolSaddleCenterGeo = prepGeo(new THREE.BoxGeometry(0.18, 0.038, 0.285));
const sharedStoolSaddleWingGeo = prepGeo(new THREE.BoxGeometry(0.155, 0.04, 0.285));
const sharedStoolLegGeo = prepGeo(new THREE.BoxGeometry(0.036, 0.665, 0.036));
const sharedStoolFrontBackRungGeo = prepGeo(new THREE.BoxGeometry(0.365, 0.024, 0.024));
const sharedStoolSideRungGeo = prepGeo(new THREE.BoxGeometry(0.024, 0.024, 0.245));

export function buildIslandFruitBowlAndCounterStools(islandGroup: THREE.Group): void {
  // Sculpted Artisan Stoneware Pedestal Fruit Bowl on the Island Worktop (x = +0.95m, z = +0.02m)
  const fruitBowlGroup = new THREE.Group();
  fruitBowlGroup.name = 'kitchen.island.fruitBowl';
  fruitBowlGroup.position.set(0.95, 0.954, 0.02);
  fruitBowlGroup.userData = { lodTier: 2, zoneId: 'kitchen' };

  const bowlCeramicMat = new THREE.MeshStandardMaterial({
    name: 'IslandStonewareFruitBowlMat',
    color: 0xf0ece2,
    roughness: 0.26,
    metalness: 0.04,
  });
  const stemWoodMat = new THREE.MeshStandardMaterial({
    name: 'FruitStemWoodMat',
    color: 0x3d291a,
    roughness: 0.82,
  });
  const redAppleMat = new THREE.MeshStandardMaterial({
    name: 'RedAppleMat',
    color: 0xb82924,
    roughness: 0.22,
    metalness: 0.02,
  });
  const greenAppleMat = new THREE.MeshStandardMaterial({
    name: 'GreenAppleMat',
    color: 0x6f9e38,
    roughness: 0.25,
    metalness: 0.02,
  });
  const orangeCitrusMat = new THREE.MeshStandardMaterial({
    name: 'ValenciaOrangeMat',
    color: 0xe8741e,
    roughness: 0.36,
    metalness: 0.02,
  });
  const lemonMat = new THREE.MeshStandardMaterial({
    name: 'AmalfiLemonMat',
    color: 0xf2ca27,
    roughness: 0.32,
    metalness: 0.02,
  });
  const pearMat = new THREE.MeshStandardMaterial({
    name: 'ConferencePearMat',
    color: 0x9aa83a,
    roughness: 0.34,
    metalness: 0.02,
  });
  const bananaMat = new THREE.MeshStandardMaterial({
    name: 'RipeBananaMat',
    color: 0xebd138,
    roughness: 0.38,
    metalness: 0.01,
  });
  const grapeMat = new THREE.MeshStandardMaterial({
    name: 'BurgundyGrapeMat',
    color: 0x3d1c38,
    roughness: 0.24,
    metalness: 0.03,
  });

  const bowlMesh = new THREE.Mesh(sharedPedestalBowlGeo, bowlCeramicMat);
  bowlMesh.name = 'kitchen.island.fruitBowl.pedestalBowl';
  bowlMesh.castShadow = true;
  bowlMesh.receiveShadow = true;
  bowlMesh.userData = { lodTier: 2, zoneId: 'kitchen' };
  fruitBowlGroup.add(bowlMesh);

  // Helper returning the exact inner concave surface height of the bowl at radial distance `r`
  const getBowlInnerSurfaceY = (r: number): number => {
    if (r <= 0.045) return 0.035 + (r / 0.045) * (0.038 - 0.035);
    if (r <= 0.095) return 0.038 + ((r - 0.045) / 0.05) * (0.05 - 0.038);
    if (r <= 0.136) return 0.05 + ((r - 0.095) / 0.041) * (0.075 - 0.05);
    if (r <= 0.153) return 0.075 + ((r - 0.136) / 0.017) * (0.105 - 0.075);
    return 0.112;
  };

  // 1. Apples (Red & Granny Smith Green) with woody stems seated directly on the bowl floor
  const appleSpecs: ReadonlyArray<{
    readonly pos: readonly [number, number, number];
    readonly rot: readonly [number, number, number];
    readonly isGreen: boolean;
  }> = [
    { pos: [-0.048, 0.071, 0.036], rot: [0.18, 0.4, -0.15], isGreen: false },
    { pos: [0.054, 0.072, 0.032], rot: [-0.14, -0.3, 0.22], isGreen: true },
    { pos: [-0.008, 0.068, -0.008], rot: [0.08, 0.2, 0.12], isGreen: false },
    { pos: [-0.064, 0.074, -0.032], rot: [-0.22, 0.5, 0.18], isGreen: true },
  ];
  for (let i = 0; i < appleSpecs.length; i++) {
    const spec = appleSpecs[i]!;
    const apple = new THREE.Group();
    apple.name = `kitchen.island.fruitBowl.apple.${i + 1}`;
    apple.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
    apple.rotation.set(spec.rot[0], spec.rot[1], spec.rot[2]);
    tagHighLod(apple, 12);

    const body = new THREE.Mesh(
      sharedAppleGeo,
      spec.isGreen ? greenAppleMat : redAppleMat
    );
    body.name = `kitchen.island.fruitBowl.appleBody.${i + 1}`;
    body.scale.set(1.0, 0.9, 1.0);
    body.castShadow = true;
    body.receiveShadow = true;
    tagHighLod(body, 12);
    apple.add(body);

    const stem = new THREE.Mesh(sharedFruitStemGeo, stemWoodMat);
    stem.name = `kitchen.island.fruitBowl.appleStem.${i + 1}`;
    stem.position.set(0, 0.032, 0);
    tagHighLod(stem, 12);
    apple.add(stem);

    fruitBowlGroup.add(apple);
  }

  // 2. Valencia Oranges seated in the bowl
  const orangePositions: ReadonlyArray<readonly [number, number, number]> = [
    [0.062, 0.074, -0.038],
    [0.004, 0.073, 0.064],
    [-0.016, 0.073, -0.062],
  ];
  for (let i = 0; i < orangePositions.length; i++) {
    const [ox, oy, oz] = orangePositions[i]!;
    const orange = new THREE.Mesh(sharedOrangeGeo, orangeCitrusMat);
    orange.name = `kitchen.island.fruitBowl.orange.${i + 1}`;
    orange.scale.set(1.0, 0.95, 1.0);
    orange.position.set(ox, oy, oz);
    orange.castShadow = true;
    orange.receiveShadow = true;
    tagHighLod(orange, 12);
    fruitBowlGroup.add(orange);
  }

  // 3. Amalfi Lemons (prolate citrus ellipsoids nestled between the apples and oranges)
  const lemonSpecs: ReadonlyArray<{
    readonly pos: readonly [number, number, number];
    readonly rot: readonly [number, number, number];
  }> = [
    { pos: [0.088, 0.078, -0.002], rot: [0.15, 0.65, -0.28] },
    { pos: [-0.032, 0.095, 0.042], rot: [-0.2, -0.45, 0.24] },
  ];
  for (let i = 0; i < lemonSpecs.length; i++) {
    const spec = lemonSpecs[i]!;
    const lemon = new THREE.Mesh(sharedLemonGeo, lemonMat);
    lemon.name = `kitchen.island.fruitBowl.lemon.${i + 1}`;
    lemon.scale.set(1.34, 0.88, 0.88);
    lemon.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
    lemon.rotation.set(spec.rot[0], spec.rot[1], spec.rot[2]);
    lemon.castShadow = true;
    lemon.receiveShadow = true;
    tagHighLod(lemon, 12);
    fruitBowlGroup.add(lemon);
  }

  // 4. Conference Pears (compound lower bulb + tapered neck + stem resting on the base layer)
  const pearSpecs: ReadonlyArray<{
    readonly pos: readonly [number, number, number];
    readonly rot: readonly [number, number, number];
  }> = [
    { pos: [0.034, 0.082, -0.006], rot: [0.35, 0.25, -0.42] },
    { pos: [-0.052, 0.082, -0.002], rot: [-0.28, -0.35, 0.48] },
  ];
  for (let i = 0; i < pearSpecs.length; i++) {
    const spec = pearSpecs[i]!;
    const pear = new THREE.Group();
    pear.name = `kitchen.island.fruitBowl.pear.${i + 1}`;
    pear.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
    pear.rotation.set(spec.rot[0], spec.rot[1], spec.rot[2]);
    tagHighLod(pear, 12);

    const bulb = new THREE.Mesh(sharedPearBulbGeo, pearMat);
    bulb.name = `kitchen.island.fruitBowl.pearBulb.${i + 1}`;
    bulb.scale.set(1.0, 0.92, 1.0);
    bulb.castShadow = true;
    tagHighLod(bulb, 12);
    pear.add(bulb);

    const neck = new THREE.Mesh(sharedPearNeckGeo, pearMat);
    neck.name = `kitchen.island.fruitBowl.pearNeck.${i + 1}`;
    neck.position.set(0, 0.023, 0);
    neck.castShadow = true;
    tagHighLod(neck, 12);
    pear.add(neck);

    const stem = new THREE.Mesh(sharedFruitStemGeo, stemWoodMat);
    stem.name = `kitchen.island.fruitBowl.pearStem.${i + 1}`;
    stem.position.set(0, 0.044, 0);
    tagHighLod(stem, 12);
    pear.add(stem);

    fruitBowlGroup.add(pear);
  }

  // 5. Curved Hand of Ripe Bananas whose belly origin (0, 0, 0) rests directly on the fruit below
  const bananaSpecs: ReadonlyArray<{
    readonly pos: readonly [number, number, number];
    readonly rot: readonly [number, number, number];
  }> = [
    { pos: [0.012, 0.095, -0.018], rot: [0.08, 0.32, -0.04] },
    { pos: [0.022, 0.097, -0.002], rot: [0.02, 0.46, -0.05] },
    { pos: [0.028, 0.094, 0.014], rot: [-0.06, 0.6, -0.06] },
  ];
  for (let b = 0; b < bananaSpecs.length; b++) {
    const spec = bananaSpecs[b]!;
    const banana = new THREE.Mesh(sharedBananaGeo, bananaMat);
    banana.name = `kitchen.island.fruitBowl.banana.${b + 1}`;
    banana.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
    banana.rotation.set(spec.rot[0], spec.rot[1], spec.rot[2]);
    banana.castShadow = true;
    banana.receiveShadow = true;
    tagHighLod(banana, 12);
    fruitBowlGroup.add(banana);
  }

  // Shared woody crown joining the stem tips of the 3 bananas
  const bananaCrown = new THREE.Mesh(sharedBananaCrownGeo, stemWoodMat);
  bananaCrown.name = 'kitchen.island.fruitBowl.bananaCrown';
  bananaCrown.position.set(0.082, 0.12, -0.032);
  bananaCrown.rotation.set(0.25, 0.45, -0.55);
  bananaCrown.castShadow = true;
  tagHighLod(bananaCrown, 12);
  fruitBowlGroup.add(bananaCrown);

  // 6. Bunch of Burgundy Grapes nestled inside the front-left bowl pocket
  const rawGrapeCoords: ReadonlyArray<readonly [number, number, number]> = [
    [-0.078, 0.082, 0.042],
    [-0.092, 0.084, 0.032],
    [-0.088, 0.085, 0.052],
    [-0.104, 0.088, 0.044],
    [-0.098, 0.089, 0.062],
    [-0.076, 0.086, 0.062],
    [-0.112, 0.092, 0.032],
    [-0.112, 0.094, 0.052],
    [-0.084, 0.098, 0.044],
    [-0.096, 0.101, 0.038],
    [-0.094, 0.102, 0.054],
    [-0.106, 0.104, 0.046],
    [-0.082, 0.099, 0.058],
    [-0.09, 0.112, 0.046],
  ];
  for (let g = 0; g < rawGrapeCoords.length; g++) {
    const [gx, rawGy, gz] = rawGrapeCoords[g]!;
    const r = Math.hypot(gx, gz);
    const minSafeY = getBowlInnerSurfaceY(r + grapeRadius) + grapeRadius + 0.002;
    const gy = Math.max(rawGy, minSafeY);
    const grape = new THREE.Mesh(sharedGrapeGeo, grapeMat);
    grape.name = `kitchen.island.fruitBowl.grape.${g + 1}`;
    grape.position.set(gx, gy, gz);
    grape.castShadow = true;
    grape.receiveShadow = true;
    tagHighLod(grape, 12);
    fruitBowlGroup.add(grape);
  }

  islandGroup.add(fruitBowlGroup);

  // Cox & Cox Weathered Oak Counter Stools — natural weathered oak with sculpted saddle seat,
  // 4 splayed tapered oak legs, and staggered horizontal footrest rungs (backless)
  const weatheredOakMat = new THREE.MeshStandardMaterial({
    map: createDriftwoodTexture(),
    color: 0xc8b8a0,
    roughness: 0.72,
    metalness: 0.02,
  });

  // 3 Counter Stools tucked under the 390mm overhang (to the right of the flush Wine Cooler pier)
  const stoolXCoords = [-0.48, 0.38, 1.24] as const;
  const legSpecs: ReadonlyArray<readonly [number, number, string]> = [
    [-1, -1, 'backLeft'],
    [1, -1, 'backRight'],
    [-1, 1, 'frontLeft'],
    [1, 1, 'frontRight'],
  ];

  for (let sIdx = 0; sIdx < stoolXCoords.length; sIdx++) {
    const sx = stoolXCoords[sIdx]!;
    const stoolPrefix = `kitchen.island.counterStool_${sIdx + 1}`;
    const stool = new THREE.Group();
    stool.name = stoolPrefix;
    stool.position.set(sx, 0, 0.66);

    // Under-seat solid oak apron frame
    const seatApron = new THREE.Mesh(sharedStoolSeatApronGeo, weatheredOakMat);
    seatApron.name = `${stoolPrefix}.seatApron`;
    seatApron.position.set(0, 0.642, 0);
    stool.add(seatApron);

    // Contoured carved Weathered Oak Saddle Seat (dipped center + raised left/right wings, no backrest)
    const saddleCenter = new THREE.Mesh(sharedStoolSaddleCenterGeo, weatheredOakMat);
    saddleCenter.name = `${stoolPrefix}.saddleCenter`;
    saddleCenter.position.set(0, 0.668, 0);
    saddleCenter.castShadow = true;
    saddleCenter.receiveShadow = true;
    stool.add(saddleCenter);

    for (const side of [-1, 1] as const) {
      const saddleWing = new THREE.Mesh(sharedStoolSaddleWingGeo, weatheredOakMat);
      saddleWing.name = `${stoolPrefix}.saddleWing.${side < 0 ? 'left' : 'right'}`;
      saddleWing.position.set(side * 0.142, 0.678, 0);
      saddleWing.rotation.z = side * 0.13; // Gently dished saddle curvature
      saddleWing.castShadow = true;
      saddleWing.receiveShadow = true;
      stool.add(saddleWing);
    }

    // 4 Splayed tapered Weathered Oak legs (angled outward in X and Z)
    for (const [sxSign, szSign, legName] of legSpecs) {
      const leg = new THREE.Mesh(sharedStoolLegGeo, weatheredOakMat);
      leg.name = `${stoolPrefix}.leg.${legName}`;
      leg.position.set(sxSign * 0.172, 0.328, szSign * 0.112);
      leg.rotation.z = sxSign * 0.1;
      leg.rotation.x = -szSign * 0.08;
      leg.castShadow = true;
      stool.add(leg);
    }

    // Front & Back horizontal oak footrest rungs (higher at y = 0.24m)
    for (const rz of [-0.122, 0.122] as const) {
      const fbRung = new THREE.Mesh(sharedStoolFrontBackRungGeo, weatheredOakMat);
      fbRung.name = `${stoolPrefix}.footrestRung.${rz < 0 ? 'back' : 'front'}`;
      fbRung.position.set(0, 0.24, rz);
      fbRung.castShadow = true;
      tagHighLod(fbRung, 12);
      stool.add(fbRung);
    }

    // Left & Right horizontal oak side stretchers (staggered slightly lower at y = 0.19m)
    for (const rx of [-0.188, 0.188] as const) {
      const sideRung = new THREE.Mesh(sharedStoolSideRungGeo, weatheredOakMat);
      sideRung.name = `${stoolPrefix}.sideStretcher.${rx < 0 ? 'left' : 'right'}`;
      sideRung.position.set(rx, 0.19, 0);
      sideRung.castShadow = true;
      tagHighLod(sideRung, 12);
      stool.add(sideRung);
    }

    islandGroup.add(stool);
  }
}
