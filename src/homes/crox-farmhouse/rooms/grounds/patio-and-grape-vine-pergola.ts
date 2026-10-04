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
 * Builds:
 * 1. **South of the Kitchen (`X = -4.52m..+5.35m, Z = +3.84m..+7.35m`): Raised Limestone Flagstone Patio & Cottage Shrub Bank (Issue #5)**:
 *    - Removed the previous owner's rattan corner sofa (`Issue #5`).
 *    - Low reclaimed red-brick retaining kerb wall along `Z = +3.84m` with step-through openings, planted North perennial/Hydrangea border,
 *      Campagna Lion-Head Urn, and Old Reclaimed Yorkstone Grindstone (`Photo 9`).
 *    - Black wrought-iron vertical-spindle boundary railing along `X = -4.52m`, weathered timber garden bench facing the main courtyard (`Photo 5`),
 *      and lush multi-layered South & East cottage shrub bank (`Choisya ternata 'Sundance'`, multi-stem `Viburnum` tree, and evergreen mounds, `Photos 9, 10, 11`).
 *
 * 2. **Behind & South-East of the Kitchen (`X = +5.65m..+11.55m, Z = -1.15m..+7.35m`): Enlarged, 2-Step Raised Walled Grape-Vine Pergola (`Issues #2 & #10`)**:
 *    - Enlarged to span `5.90m x 8.50m` so its South red-brick wall reaches `Z = +7.35m` (world `[7.44, -0.012, 10.574]`, `Issue #2`).
 *    - Raised inside by **2 stone steps (`pergFloorY = +0.32m`, `Issue #10`)** with 2 stone steps at the West entrance, South-West wrought-iron gate,
 *      and East vegetable-garden opening, raising the pergola floor, walls, piers, oak beams, grape-vine canopy, and teak dining set `+0.32m` higher overall.
 *
 * 3. **Through the Pergola (`X = +8.50m..+16.20m, Z = -4.60m..+3.80m`, world `[11.959, 0, 3.104]`): Vegetable Garden & Glazed Greenhouse (`Issue #11`)**:
 *    - Pitched-roof aluminum & clear-glass Greenhouse (`2.60m x 3.20m`) with low brick base and interior staging benches (`media_1791117139446_c727cd76.jpg`).
 *    - Walled Kitchen Vegetable Garden with gravel paths, 6 timber-sleeper raised vegetable beds, leafy crops, and bamboo runner-bean wigwams (`media_1791117124804_7f8fb9b7.jpg`).
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

  // West section of the low brick retaining wall: X = -4.52m to -1.75m (width 2.77m)
  const lowBrickWallWest = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(2.77, 0.24, 0.22), -3.135, 0.11, 3.84),
    brickWallMat
  );
  lowBrickWallWest.position.set(-3.135, 0.11, 3.84);
  lowBrickWallWest.castShadow = true;
  lowBrickWallWest.receiveShadow = true;
  scene.add(lowBrickWallWest);

  const lowBrickCopingWest = new THREE.Mesh(
    new THREE.BoxGeometry(2.81, 0.048, 0.25),
    blueBrickCopingMat
  );
  lowBrickCopingWest.position.set(-3.135, 0.254, 3.84);
  lowBrickCopingWest.castShadow = true;
  lowBrickCopingWest.receiveShadow = true;
  scene.add(lowBrickCopingWest);

  // Middle section of the low brick retaining wall retaining the North flower/Urn bed: X = -0.45m to +2.45m (width 2.90m, Photo 9 right!)
  const lowBrickWallMid = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(2.9, 0.24, 0.22), 1.0, 0.11, 3.84),
    brickWallMat
  );
  lowBrickWallMid.position.set(1.0, 0.11, 3.84);
  lowBrickWallMid.castShadow = true;
  lowBrickWallMid.receiveShadow = true;
  scene.add(lowBrickWallMid);

  const lowBrickCopingMid = new THREE.Mesh(
    new THREE.BoxGeometry(2.94, 0.048, 0.25),
    blueBrickCopingMat
  );
  lowBrickCopingMid.position.set(1.0, 0.254, 3.84);
  lowBrickCopingMid.castShadow = true;
  lowBrickCopingMid.receiveShadow = true;
  scene.add(lowBrickCopingMid);

  // East section of the low brick retaining wall: X = +3.75m to +5.25m (width 1.50m)
  const lowBrickWallEast = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(1.5, 0.24, 0.22), 4.5, 0.11, 3.84),
    brickWallMat
  );
  lowBrickWallEast.position.set(4.5, 0.11, 3.84);
  lowBrickWallEast.castShadow = true;
  lowBrickWallEast.receiveShadow = true;
  scene.add(lowBrickWallEast);

  const lowBrickCopingEast = new THREE.Mesh(
    new THREE.BoxGeometry(1.54, 0.048, 0.25),
    blueBrickCopingMat
  );
  lowBrickCopingEast.position.set(4.5, 0.254, 3.84);
  lowBrickCopingEast.castShadow = true;
  lowBrickCopingEast.receiveShadow = true;
  scene.add(lowBrickCopingEast);

  // Stone threshold steps in the two walk-through openings (X = -1.75m..-0.45m and X = +2.45m..+3.75m)
  for (const stepX of [-1.1, 3.1]) {
    const thresholdStep = new THREE.Mesh(
      new THREE.BoxGeometry(1.3, 0.12, 0.28),
      limestoneEdgingMat
    );
    thresholdStep.position.set(stepX, 0.03, 3.84);
    thresholdStep.receiveShadow = true;
    scene.add(thresholdStep);
  }

  // Square Red-Brick Corner Pier at the NW (-4.52, +3.84) corner of the Patio
  const cornerPier = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(0.38, 0.56, 0.38), -4.52, 0.26, 3.84),
    brickWallMat
  );
  cornerPier.position.set(-4.52, 0.26, 3.84);
  cornerPier.castShadow = true;
  cornerPier.receiveShadow = true;
  scene.add(cornerPier);

  const cornerPierCap = new THREE.Mesh(
    new THREE.BoxGeometry(0.44, 0.07, 0.44),
    limestoneEdgingMat
  );
  cornerPierCap.position.set(-4.52, 0.575, 3.84);
  cornerPierCap.castShadow = true;
  scene.add(cornerPierCap);

  // West Return of the Low Brick Retaining Wall separating the Raised Patio
  // from the Main Cobbled Courtyard (X = -4.52m, Z = +3.84m..+6.85m, Photo 5 & 9)
  const lowBrickReturnWest = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(0.22, 0.28, 3.02), -4.52, 0.08, 5.34),
    brickWallMat
  );
  lowBrickReturnWest.position.set(-4.52, 0.08, 5.34);
  lowBrickReturnWest.castShadow = true;
  lowBrickReturnWest.receiveShadow = true;
  scene.add(lowBrickReturnWest);

  const lowBrickReturnCopingWest = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.048, 3.06),
    blueBrickCopingMat
  );
  lowBrickReturnCopingWest.position.set(-4.52, 0.244, 5.34);
  lowBrickReturnCopingWest.castShadow = true;
  lowBrickReturnCopingWest.receiveShadow = true;
  scene.add(lowBrickReturnCopingWest);

  // Black Wrought-Iron Boundary Railings along the West Return of the Patio (X = -4.52m, Z = +4.05m..+6.75m, Photo 5 & 9)
  const wroughtIronMat = new THREE.MeshStandardMaterial({
    color: 0x1c1e22,
    roughness: 0.44,
    metalness: 0.72,
  });
  for (const railY of [0.48, 0.82]) {
    const railBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.025, 2.72),
      wroughtIronMat
    );
    railBar.position.set(-4.52, railY, 5.4);
    railBar.castShadow = true;
    scene.add(railBar);
  }
  for (let rz = 4.08; rz <= 6.74; rz += 0.24) {
    const spindle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.62, 6),
      wroughtIronMat
    );
    spindle.position.set(-4.52, 0.56, rz);
    spindle.castShadow = true;
    scene.add(spindle);
  }

  // Weathered Timber Garden Bench & Rusted Cast-Iron Fire-Bowl Planter along the West side of the Patio
  // facing the main cobbled courtyard (X = -4.84m, Z = +5.40m, Photo 5 center!)
  const westPatioBenchGroup = new THREE.Group();
  westPatioBenchGroup.name = 'courtyard.rattanPatioWestBench';
  westPatioBenchGroup.position.set(-4.84, -0.14, 5.4);
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

  // Rusted Cast-Iron Circular Fire-Bowl Planter on a low ring stand (X = -5.05m, Z = +6.62m, Photo 5 center-left)
  const rustedBowlMat = new THREE.MeshStandardMaterial({
    color: 0x6e3b28,
    roughness: 0.84,
    metalness: 0.28,
  });
  const fireBowlStand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.3, 0.14, 16),
    wroughtIronMat
  );
  fireBowlStand.position.set(-5.05, -0.11, 6.62);
  scene.add(fireBowlStand);
  const fireBowl = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 18, 12, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5),
    rustedBowlMat
  );
  fireBowl.scale.set(1.0, 0.52, 1.0);
  fireBowl.position.set(-5.05, 0.14, 6.62);
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
  // 3. SOUTH OF KITCHEN: RAISED RIVEN FLAGSTONE PATIO TERRACE & COTTAGE SHRUB BANK
  //    (Issue #5: "Look closer at the pictures for how this section should be, remove the sofa thats the previous owners.")
  // =========================================================================
  const limestoneSlabTex = createCourtyardStoneTexture();
  const limestoneSlabMat = new THREE.MeshStandardMaterial({
    map: limestoneSlabTex,
    roughness: 0.78,
    metalness: 0.04,
  });

  // Raised Limestone Flagstone Patio Slab (`X = -4.40m..+3.85m, Z = +3.95m..+6.68m`, raised +0.08m above the cobble path, Photo 9!)
  // No rattan sofa is placed here (Issue #5: "remove the sofa thats the previous owners").
  const rattanPatioSlab = new THREE.Mesh(
    new THREE.BoxGeometry(8.25, 0.16, 2.73),
    limestoneSlabMat
  );
  rattanPatioSlab.name = 'courtyard.rattanPatioSlab';
  rattanPatioSlab.position.set(-0.275, 0.01, 5.315);
  rattanPatioSlab.receiveShadow = true;
  scene.add(rattanPatioSlab);

  // Stepped Red-Brick Retaining Wall & Mulched Shrub Bank wrapping the South (`Z = +6.68m..+7.35m`)
  // and East (`X = +3.85m..+5.25m`) borders of the Raised Patio Terrace (Photos 9, 10, 11!)
  const patioSouthBrickWall = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(9.75, 0.28, 0.18), 0.42, 0.05, 7.32),
    brickWallMat
  );
  patioSouthBrickWall.position.set(0.42, 0.05, 7.32);
  patioSouthBrickWall.castShadow = true;
  patioSouthBrickWall.receiveShadow = true;
  scene.add(patioSouthBrickWall);

  const patioSouthBrickCoping = new THREE.Mesh(
    new THREE.BoxGeometry(9.8, 0.045, 0.22),
    brickSoldierCopingMat
  );
  patioSouthBrickCoping.position.set(0.42, 0.21, 7.32);
  patioSouthBrickCoping.castShadow = true;
  scene.add(patioSouthBrickCoping);

  const patioSouthSoilBed = new THREE.Mesh(
    new THREE.BoxGeometry(9.5, 0.2, 0.68),
    soilMat
  );
  patioSouthSoilBed.position.set(0.35, 0.04, 6.95);
  patioSouthSoilBed.receiveShadow = true;
  scene.add(patioSouthSoilBed);

  const patioEastBrickWall = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(0.18, 0.28, 3.45), 5.26, 0.05, 5.62),
    brickWallMat
  );
  patioEastBrickWall.position.set(5.26, 0.05, 5.62);
  patioEastBrickWall.castShadow = true;
  patioEastBrickWall.receiveShadow = true;
  scene.add(patioEastBrickWall);

  const patioEastSoilBed = new THREE.Mesh(
    new THREE.BoxGeometry(1.32, 0.2, 3.3),
    soilMat
  );
  patioEastSoilBed.position.set(4.52, 0.04, 5.6);
  patioEastSoilBed.receiveShadow = true;
  scene.add(patioEastSoilBed);

  const clumpSphereGeo = new THREE.SphereGeometry(1, 14, 12);
  const bloomSphereGeo = new THREE.SphereGeometry(0.055, 8, 8);

  // 1) Golden-Yellow Choisya ternata 'Sundance' Shrub in the SW/West border (Photo 9 center-left & Photo 5)
  for (const [dx, dy, dz, rx, ry, rz] of [
    [-3.65, 0.44, 6.62, 0.62, 0.48, 0.56],
    [-3.12, 0.38, 6.78, 0.48, 0.4, 0.46],
    [-4.05, 0.4, 6.25, 0.46, 0.38, 0.44],
  ] as const) {
    const choisyaMound = new THREE.Mesh(clumpSphereGeo, goldenChoisyaMat);
    choisyaMound.scale.set(rx, ry, rz);
    choisyaMound.position.set(dx, dy, dz);
    choisyaMound.castShadow = true;
    choisyaMound.receiveShadow = true;
    scene.add(choisyaMound);
  }

  // 2) Multi-Stem Dome-Crowned Ornamental Shrub / Small Tree on the South Patio Bank (`X = -1.95m, Z = +6.85m` -- Photo 9 center-left!)
  for (const [sx, sz, rotZ, rotX] of [
    [-2.08, 6.78, 0.16, -0.08],
    [-1.92, 6.88, -0.14, 0.1],
    [-1.82, 6.82, 0.09, 0.14],
    [-2.0, 6.92, -0.06, -0.12],
  ] as const) {
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.034, 1.05, 8),
      structuralOakMat
    );
    stem.position.set(sx, 0.54, sz);
    stem.rotation.set(rotX, 0, rotZ);
    stem.castShadow = true;
    scene.add(stem);
  }
  for (const [cx, cy, cz, rx, ry, rz] of [
    [-1.95, 1.15, 6.85, 0.78, 0.48, 0.68],
    [-2.45, 1.04, 6.75, 0.56, 0.4, 0.52],
    [-1.42, 1.06, 6.88, 0.58, 0.42, 0.54],
  ] as const) {
    const canopy = new THREE.Mesh(clumpSphereGeo, sageFoliageMat);
    canopy.scale.set(rx, ry, rz);
    canopy.position.set(cx, cy, cz);
    canopy.castShadow = true;
    canopy.receiveShadow = true;
    scene.add(canopy);
  }

  // 3) Large Rounded Bright-Green Bush on the South-Center Bank & Lush East Shrub Bank (`X = -0.15m..+4.85m`, Photos 9, 10, 11!)
  for (const [bx, by, bz, rx, ry, rz, mat] of [
    [-0.15, 0.58, 6.78, 0.76, 0.58, 0.68, brightShrubGreenMat],
    [0.52, 0.48, 6.88, 0.56, 0.44, 0.52, deepGreenFoliageMat],
    [1.85, 0.52, 6.92, 0.64, 0.48, 0.56, sageFoliageMat],
    [3.15, 0.56, 6.95, 0.68, 0.52, 0.58, brightShrubGreenMat],
    [4.35, 0.62, 6.75, 0.72, 0.56, 0.64, deepGreenFoliageMat],
    [4.55, 0.58, 5.55, 0.66, 0.52, 0.62, sageFoliageMat],
    [4.48, 0.54, 4.45, 0.58, 0.46, 0.54, brightShrubGreenMat],
  ] as const) {
    const bankBush = new THREE.Mesh(clumpSphereGeo, mat);
    bankBush.scale.set(rx, ry, rz);
    bankBush.position.set(bx, by, bz);
    bankBush.castShadow = true;
    bankBush.receiveShadow = true;
    scene.add(bankBush);
  }

  // 4) North Border Perennials & Hydrangea Bed just inside the low brick wall (`X = -0.35m..+2.35m, Z = +4.35m` -- Photo 9 foreground!)
  for (const [px, pz, r, h, mat] of [
    [-3.85, 4.22, 0.36, 0.32, sageFoliageMat],
    [-2.95, 4.24, 0.38, 0.34, deepGreenFoliageMat],
    [-0.15, 4.32, 0.42, 0.36, sageFoliageMat],
    [0.55, 4.45, 0.52, 0.44, deepGreenFoliageMat],
    [1.25, 4.48, 0.56, 0.48, brightShrubGreenMat],
    [1.95, 4.36, 0.46, 0.38, deepGreenFoliageMat],
  ] as const) {
    const clump = new THREE.Mesh(clumpSphereGeo, mat);
    clump.scale.set(r, h, r * 0.92);
    clump.position.set(px, h * 0.55 + 0.06, pz);
    clump.castShadow = true;
    scene.add(clump);
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
  const creamPotMat = new THREE.MeshStandardMaterial({
    color: 0xd8cfc0,
    roughness: 0.52,
    metalness: 0.06,
  });
  const potMat = new THREE.MeshStandardMaterial({ color: 0xa45a3f, roughness: 0.75 });

  // Cluster of pots along the North Urn Bed & South Brick Corner (matching Photo 9 foreground & bottom-left!)
  for (const [px, pz, rTop, rBot, potH, pMat, cMat, hasWhiteBlooms, hasRedBlooms] of [
    [2.28, 4.18, 0.23, 0.16, 0.38, darkGlazedPotMat, deepGreenFoliageMat, true, false], // Large dark-glazed pot with white flowers on right of Photo 9!
    [1.52, 4.15, 0.16, 0.13, 0.3, zincPotMat, sageFoliageMat, false, false],
    [1.18, 4.12, 0.14, 0.1, 0.24, potMat, brightShrubGreenMat, false, true],
    [0.82, 7.08, 0.18, 0.13, 0.3, creamPotMat, brightShrubGreenMat, false, false], // Cream pot at South brick step in Photo 9 bottom-left!
  ] as const) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, potH, 14), pMat);
    pot.position.set(px, potH / 2 + 0.08, pz);
    pot.castShadow = true;
    pot.receiveShadow = true;
    scene.add(pot);

    const foliage = new THREE.Mesh(clumpSphereGeo, cMat);
    foliage.scale.set(rTop * 1.18, rTop * 0.96, rTop * 1.18);
    foliage.position.set(px, potH + rTop * 0.6 + 0.08, pz);
    foliage.castShadow = true;
    scene.add(foliage);

    if (hasWhiteBlooms || hasRedBlooms) {
      const bMat = hasWhiteBlooms ? whiteBloomMat : geraniumRedBloomMat;
      for (const [bx, by, bz] of [
        [-0.06, potH + rTop * 1.1 + 0.08, 0.04],
        [0.07, potH + rTop * 1.14 + 0.08, -0.04],
        [0.0, potH + rTop * 1.22 + 0.08, 0.02],
      ] as const) {
        const bloom = new THREE.Mesh(bloomSphereGeo, bMat);
        bloom.position.set(px + bx, by, pz + bz);
        scene.add(bloom);
      }
    }
  }

  // =========================================================================
  // 4. DECORATIVE TROPHY / CUP PLANTER WITH SCULPTED LION HEADS (Campagna / Medici Urn)
  //    & OLD RECLAIMED YORKSTONE GRINDSTONE IN THE NORTH BORDER (Photo 9 foreground!)
  // =========================================================================
  buildLionHeadTrophyUrn(scene, 1.88, 4.48, deepGreenFoliageMat, whiteBloomMat, blushBloomMat);
  buildOldGrindstone(scene, 0.62, 4.28, structuralOakMat);

  // =========================================================================
  // 5. PAIR OF CLIPPED BAY LEAF TOPIARY TREES BY UTILITY SPLIT STABLE DOOR
  //    & CLIMBING GREEN IVY ON THE KITCHEN SOUTH BRICK PIER (Photos 1, 3, 9)
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
  // 6. ENLARGED & 2-STEP RAISED WALLED GRAPE-VINE PERGOLA DINING COURT
  //    (X = +5.65m..+11.55m, Z = -1.15m..+7.35m, Floor raised +0.32m via 2 steps!)
  //    - Issue #2 ("Pergola is much larger, comes out to about here" at `[7.44, -0.012, 10.574]`):
  //      Extends South all the way to Z = +7.35m (world `[7.44, -0.012, 10.574]`) so its South red-brick wall
  //      lines up with the South edge of the Patio shrub bank along the cobbled alleyway (`Photo 10` right)!
  //    - Issue #10 ("The inside of the pergola is slightly raised, 2 steps up, so its higher overall" at `[8.146, 0, 3.912]`):
  //      Interior flagstone floor is raised +0.32m (`2 x 0.16m` steps up), with 2 stone steps at the West entrance,
  //      South-West wrought-iron gate, and East vegetable garden opening, and all walls, piers, beams, vines & furniture
  //      raised +0.32m higher overall!
  // =========================================================================
  const pergolaGroup = new THREE.Group();
  pergolaGroup.name = 'courtyard.grapeVinePergola';
  const pergMinX = 5.65;
  const pergMaxX = 11.55;
  const pergMinZ = -1.15;
  const pergMaxZ = 7.35;
  const pergFloorY = 0.32; // 2 steps up (2 x 0.16m risers = +0.32m above the cobble path!)
  const pergWallH = 2.24; // Wall height above the raised pergola floor (top at Y = +2.56m)
  const pergWallTotalH = pergFloorY + pergWallH; // 2.56m from base Y = 0.00m
  const pergBeamY = pergFloorY + 2.32; // 2.64m
  const pergRafterY = pergFloorY + 2.44; // 2.76m

  // Coursed Honey-Buff Fieldstone / Limestone Rubble Material for the North & East Walls & Plinth (Photo 8 left)
  const fieldstoneWallMat = new THREE.MeshStandardMaterial({
    color: 0xc8b598,
    map: limestoneSlabTex,
    roughness: 0.88,
    metalness: 0.02,
  });

  // Solid Raised Retaining Plinth & Riven Limestone Flagstone Court Floor (`Y = -0.12m..+0.32m`, Issue #10!)
  const pergolaRetainingPlinth = new THREE.Mesh(
    new THREE.BoxGeometry(pergMaxX - pergMinX + 0.16, pergFloorY + 0.06, pergMaxZ - pergMinZ + 0.16),
    fieldstoneWallMat
  );
  pergolaRetainingPlinth.position.set(
    (pergMinX + pergMaxX) * 0.5,
    (pergFloorY - 0.14) * 0.5,
    (pergMinZ + pergMaxZ) * 0.5
  );
  pergolaRetainingPlinth.receiveShadow = true;
  pergolaGroup.add(pergolaRetainingPlinth);

  const pergolaCourtFloor = new THREE.Mesh(
    new THREE.BoxGeometry(pergMaxX - pergMinX + 0.2, 0.08, pergMaxZ - pergMinZ + 0.2),
    limestoneSlabMat
  );
  pergolaCourtFloor.name = 'courtyard.grapeVinePergola.floor';
  pergolaCourtFloor.position.set(
    (pergMinX + pergMaxX) * 0.5,
    pergFloorY - 0.04,
    (pergMinZ + pergMaxZ) * 0.5
  );
  pergolaCourtFloor.receiveShadow = true;
  pergolaGroup.add(pergolaCourtFloor);

  // Issue #10: 2 Reclaimed Stone Steps (`Step 1` at Y = 0.00..0.16m, `Step 2` at Y = 0.16..0.32m)
  // at the West Entrance (from the Kitchen/East Cobble Path), South-West Wrought-Iron Gate, and East Vegetable Garden Opening!
  for (let s = 0; s < 2; s++) {
    const stepTopY = (s + 1) * 0.16;
    const stepH = 0.16;
    // 1. West Colonnade Entrance Steps (`X = pergMinX - (2 - s) * 0.30`, `Z = +1.60m..+3.60m`)
    const westStep = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, stepH, 2.05),
      limestoneEdgingMat
    );
    westStep.position.set(pergMinX - (1.5 - s) * 0.3, stepTopY - stepH * 0.5, 2.6);
    westStep.castShadow = true;
    westStep.receiveShadow = true;
    pergolaGroup.add(westStep);

    // 2. South-West Wrought-Iron Gate Steps from the Cobbled Alleyway (`X = +6.05m..+7.15m`, `Z = pergMaxZ + (1.5 - s) * 0.30m`)
    const southGateStep = new THREE.Mesh(
      new THREE.BoxGeometry(1.12, stepH, 0.32),
      limestoneEdgingMat
    );
    southGateStep.position.set(6.6, stepTopY - stepH * 0.5, pergMaxZ + (1.5 - s) * 0.3);
    southGateStep.castShadow = true;
    southGateStep.receiveShadow = true;
    pergolaGroup.add(southGateStep);

    // 3. East Opening Steps down into the Vegetable Garden & Greenhouse (`X = pergMaxX + (0.5 + s) * 0.30m`, `Z = +0.25m..+1.75m`)
    const eastGardenStep = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, stepH, 1.5),
      limestoneEdgingMat
    );
    eastGardenStep.position.set(pergMaxX + (0.5 + (1 - s)) * 0.3, stepTopY - stepH * 0.5, 1.0);
    eastGardenStep.castShadow = true;
    eastGardenStep.receiveShadow = true;
    pergolaGroup.add(eastGardenStep);
  }

  // 6a. North Coursed Fieldstone Wall (Z = -1.15m, X = +5.65m..+11.55m, with 1.25m gateway opening at X = +8.85m..+10.10m to the Greenhouse!)
  for (const [xMin, xMax] of [
    [pergMinX, 8.85],
    [10.1, pergMaxX],
  ] as const) {
    const segW = xMax - xMin;
    const segMidX = (xMin + xMax) * 0.5;
    const northStoneWall = new THREE.Mesh(
      new THREE.BoxGeometry(segW, pergWallTotalH, 0.28),
      fieldstoneWallMat
    );
    northStoneWall.position.set(segMidX, pergWallTotalH * 0.5, pergMinZ);
    northStoneWall.castShadow = true;
    northStoneWall.receiveShadow = true;
    pergolaGroup.add(northStoneWall);

    const northStoneCoping = new THREE.Mesh(
      new THREE.BoxGeometry(segW + 0.06, 0.06, 0.34),
      limestoneEdgingMat
    );
    northStoneCoping.position.set(segMidX, pergWallTotalH + 0.03, pergMinZ);
    northStoneCoping.castShadow = true;
    pergolaGroup.add(northStoneCoping);
  }

  // Projecting Low Interior Stone Bench Ledge along the East & North Stone Walls (seated on pergFloorY = +0.32m, Photo 8 left!)
  const eastStoneBenchBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.38, 4.2),
    fieldstoneWallMat
  );
  eastStoneBenchBase.position.set(pergMaxX - 0.3, pergFloorY + 0.19, 4.35);
  eastStoneBenchBase.castShadow = true;
  eastStoneBenchBase.receiveShadow = true;
  pergolaGroup.add(eastStoneBenchBase);

  const eastStoneBenchSlab = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.05, 4.26),
    limestoneEdgingMat
  );
  eastStoneBenchSlab.position.set(pergMaxX - 0.3, pergFloorY + 0.405, 4.35);
  eastStoneBenchSlab.castShadow = true;
  pergolaGroup.add(eastStoneBenchSlab);

  const cobaltBluePotMat = new THREE.MeshStandardMaterial({
    color: 0x1d4e89,
    roughness: 0.28,
    metalness: 0.14,
  });

  for (const [pz, r, h, pMat] of [
    [2.65, 0.16, 0.26, creamPotMat],
    [3.85, 0.12, 0.22, zincPotMat],
    [5.15, 0.13, 0.24, potMat],
    [6.15, 0.11, 0.2, zincPotMat],
  ] as const) {
    const ledgePot = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.76, h, 12), pMat);
    ledgePot.position.set(pergMaxX - 0.28, pergFloorY + 0.43 + h / 2, pz);
    ledgePot.castShadow = true;
    pergolaGroup.add(ledgePot);

    const ledgePlant = new THREE.Mesh(clumpSphereGeo, sageFoliageMat);
    ledgePlant.scale.set(r * 1.2, r * 0.95, r * 1.2);
    ledgePlant.position.set(pergMaxX - 0.28, pergFloorY + 0.43 + h + r * 0.45, pz);
    pergolaGroup.add(ledgePlant);
  }

  // 6b. East Coursed Fieldstone Wall (X = +11.55m, Z = -1.15m..+7.35m) with a 1.50m walk-through opening (Z = +0.25m..+1.75m) to the Vegetable Garden!
  for (const [zMin, zMax] of [
    [pergMinZ, 0.25],
    [1.75, pergMaxZ],
  ] as const) {
    const segD = zMax - zMin;
    const segMidZ = (zMin + zMax) * 0.5;
    const eastStoneWall = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, pergWallTotalH, segD),
      fieldstoneWallMat
    );
    eastStoneWall.position.set(pergMaxX, pergWallTotalH * 0.5, segMidZ);
    eastStoneWall.castShadow = true;
    eastStoneWall.receiveShadow = true;
    pergolaGroup.add(eastStoneWall);

    const eastStoneCoping = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.06, segD + 0.06),
      limestoneEdgingMat
    );
    eastStoneCoping.position.set(pergMaxX, pergWallTotalH + 0.03, segMidZ);
    eastStoneCoping.castShadow = true;
    pergolaGroup.add(eastStoneCoping);
  }

  // 6c. South Tall Reclaimed Red-Brick Wall (Z = +7.35m, X = +7.22m..+11.55m, top at Y = +2.56m -- Photo 8 back & Photo 10 right!)
  const southWallSpanX = pergMaxX - 7.22;
  const southWallMidX = (7.22 + pergMaxX) * 0.5;
  const southPergolaBrickWall = new THREE.Mesh(
    applyCourtyardBrickUVs(
      new THREE.BoxGeometry(southWallSpanX, pergWallTotalH, 0.26),
      southWallMidX,
      pergWallTotalH * 0.5,
      pergMaxZ
    ),
    brickWallMat
  );
  southPergolaBrickWall.name = 'courtyard.grapeVinePergola.southBrickWall';
  southPergolaBrickWall.position.set(southWallMidX, pergWallTotalH * 0.5, pergMaxZ);
  southPergolaBrickWall.castShadow = true;
  southPergolaBrickWall.receiveShadow = true;
  pergolaGroup.add(southPergolaBrickWall);

  const southPergolaBrickCoping = new THREE.Mesh(
    new THREE.BoxGeometry(southWallSpanX + 0.06, 0.06, 0.32),
    limestoneEdgingMat
  );
  southPergolaBrickCoping.position.set(southWallMidX, pergWallTotalH + 0.03, pergMaxZ);
  southPergolaBrickCoping.castShadow = true;
  pergolaGroup.add(southPergolaBrickCoping);

  // Exterior South Raised Brick Herb & Flower Border along the outer South face of the Pergola Wall facing the Cobbled Alleyway (Photo 10 right!)
  const southAlleyHerbBedKerb = new THREE.Mesh(
    applyCourtyardBrickUVs(
      new THREE.BoxGeometry(southWallSpanX, 0.26, 0.12),
      southWallMidX,
      0.06,
      pergMaxZ + 0.44
    ),
    brickWallMat
  );
  southAlleyHerbBedKerb.position.set(southWallMidX, 0.06, pergMaxZ + 0.44);
  southAlleyHerbBedKerb.castShadow = true;
  pergolaGroup.add(southAlleyHerbBedKerb);

  const southAlleyHerbSoil = new THREE.Mesh(
    new THREE.BoxGeometry(southWallSpanX - 0.08, 0.2, 0.32),
    soilMat
  );
  southAlleyHerbSoil.position.set(southWallMidX, 0.04, pergMaxZ + 0.26);
  pergolaGroup.add(southAlleyHerbSoil);

  for (let hx = 7.55; hx <= 11.25; hx += 0.62) {
    const herbMound = new THREE.Mesh(
      clumpSphereGeo,
      Math.round(hx * 2) % 2 === 0 ? sageFoliageMat : deepGreenFoliageMat
    );
    herbMound.scale.set(0.32, 0.26, 0.24);
    herbMound.position.set(hx, 0.22, pergMaxZ + 0.26);
    herbMound.castShadow = true;
    pergolaGroup.add(herbMound);
  }

  // 6d. Ornate Black Wrought-Iron Scrollwork Garden Gate in the South-West Gateway (X = +6.15m..+7.05m, Z = +7.35m -- Photo 8 back-right!)
  const ironGateGroup = new THREE.Group();
  ironGateGroup.name = 'courtyard.grapeVinePergola.wroughtIronGate';
  ironGateGroup.position.set(6.6, pergFloorY + 0.02, pergMaxZ);
  const gateW = 0.88;
  const gateH = 1.86;
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

  // 6e. Red-Brick Support Piers along the West Open Colonnade (X = +5.65m) & South Gate Jamb (Photo 8 right & media_1791117139446_c727cd76.jpg)
  for (const [px, pz, pw, pd] of [
    [pergMinX, pergMinZ, 0.38, 0.38], // NW Corner Brick Pier
    [pergMinX, 1.45, 0.38, 0.38],     // West-North Entrance Pier
    [pergMinX, 3.75, 0.38, 0.38],     // West-Center Entrance Pier
    [pergMinX, 5.65, 0.38, 0.38],     // West-South Pier
    [pergMinX, pergMaxZ, 0.38, 0.38], // SW Gate Brick Pier
    [7.22, pergMaxZ, 0.36, 0.36],     // South Gate East Jamb Pier
  ] as const) {
    const pier = new THREE.Mesh(
      applyCourtyardBrickUVs(
        new THREE.BoxGeometry(pw, pergWallTotalH, pd),
        px,
        pergWallTotalH * 0.5,
        pz
      ),
      brickWallMat
    );
    pier.position.set(px, pergWallTotalH * 0.5, pz);
    pier.castShadow = true;
    pier.receiveShadow = true;
    pergolaGroup.add(pier);

    const pierCap = new THREE.Mesh(
      new THREE.BoxGeometry(pw + 0.06, 0.06, pd + 0.06),
      limestoneEdgingMat
    );
    pierCap.position.set(px, pergWallTotalH + 0.03, pz);
    pierCap.castShadow = true;
    pergolaGroup.add(pierCap);
  }

  // Low Brick Dwarf Walls between the West Piers (`X = +5.65m`, leaving the 2-step West entrance open at `Z = +1.65m..+3.55m`)
  for (const [wz, wd] of [
    [0.15, 2.22],
    [4.7, 1.52],
    [6.5, 1.34],
  ] as const) {
    const dwarfWall = new THREE.Mesh(
      applyCourtyardBrickUVs(new THREE.BoxGeometry(0.24, 0.38, wd), pergMinX, pergFloorY + 0.19, wz),
      brickWallMat
    );
    dwarfWall.position.set(pergMinX, pergFloorY + 0.19, wz);
    dwarfWall.castShadow = true;
    dwarfWall.receiveShadow = true;
    pergolaGroup.add(dwarfWall);

    const dwarfCoping = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.05, wd + 0.04),
      limestoneEdgingMat
    );
    dwarfCoping.position.set(pergMinX, pergFloorY + 0.405, wz);
    pergolaGroup.add(dwarfCoping);
  }

  // Cobalt-Blue Glazed Ceramic Pots & Terracotta Pots on the raised pergola floor inside the West Piers (Photo 8 right!)
  for (const [px, pz, rTop, rBot, h, pMat, fMat] of [
    [6.02, 1.15, 0.19, 0.13, 0.34, cobaltBluePotMat, brightShrubGreenMat],
    [6.0, 4.15, 0.19, 0.13, 0.34, cobaltBluePotMat, deepGreenFoliageMat],
    [6.02, 4.75, 0.16, 0.11, 0.28, potMat, sageFoliageMat],
    [6.0, 5.35, 0.15, 0.11, 0.26, zincPotMat, brightShrubGreenMat],
    [6.02, 6.25, 0.18, 0.13, 0.32, potMat, sageFoliageMat],
  ] as const) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 14), pMat);
    pot.position.set(px, pergFloorY + h / 2, pz);
    pot.castShadow = true;
    pot.receiveShadow = true;
    pergolaGroup.add(pot);

    const bush = new THREE.Mesh(clumpSphereGeo, fMat);
    bush.scale.set(rTop * 1.2, rTop * 1.05, rTop * 1.2);
    bush.position.set(px, pergFloorY + h + rTop * 0.55, pz);
    bush.castShadow = true;
    pergolaGroup.add(bush);
  }

  // 6f. Heavy Weathered-Oak Overhead Pergola Beams, Cross-Rafters & Vine Battens (raised +0.32m to Y = 2.64m..2.84m -- Photo 8 top)
  const beamSpanX = pergMaxX - pergMinX + 0.52;
  const beamMidX = (pergMinX + pergMaxX) / 2;
  for (const bz of [pergMinZ, 1.45, 3.75, 5.65, pergMaxZ]) {
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
  for (let rx = pergMinX; rx <= pergMaxX + 0.05; rx += 0.59) {
    const rafter = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.13, rafterSpanZ),
      structuralOakMat
    );
    rafter.position.set(rx, pergRafterY, rafterMidZ);
    rafter.castShadow = true;
    rafter.receiveShadow = true;
    pergolaGroup.add(rafter);
  }

  for (let bz = pergMinZ + 0.5; bz <= pergMaxZ - 0.35; bz += 0.85) {
    const batten = new THREE.Mesh(
      new THREE.BoxGeometry(beamSpanX - 0.12, 0.036, 0.045),
      structuralOakMat
    );
    batten.position.set(beamMidX, pergRafterY + 0.08, bz);
    pergolaGroup.add(batten);
  }

  // 6g. Festoon Café Globe String Lights draped across the Raised Pergola Rafters (Photo 8 top)
  const festoonCordMat = new THREE.MeshStandardMaterial({ color: 0x232528, roughness: 0.6 });
  const festoonBulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff5d6,
    emissive: 0xffb84d,
    emissiveIntensity: 0.55,
    roughness: 0.2,
  });
  const festoonBulbGeo = new THREE.SphereGeometry(0.024, 8, 8);
  for (const fz of [0.35, 2.55, 4.75, 6.35]) {
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

  // 6h. Gnarled Woody Grape-Vine Trunks & Cordons + High-LOD 5-Lobed Botanical Grape-Vine Leaf Canopy
  //     (Vitis vinifera) + Pendant Grape Clusters across the enlarged 5.90m x 8.50m pergola (Photos 1, 5, 8, 10)
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
        [8.45, pergFloorY, 7.12],
        [8.38, pergFloorY + 0.85, 7.1],
        [8.52, pergFloorY + 1.65, 7.11],
        [8.46, pergBeamY - 0.02, 6.95],
        [8.35, pergRafterY + 0.04, 4.25],
        [8.22, pergRafterY + 0.05, 1.35],
        [8.15, pergRafterY + 0.02, -0.85],
      ],
    },
    {
      radius: 0.038,
      pts: [
        [10.35, pergFloorY, 7.12],
        [10.42, pergFloorY + 0.88, 7.1],
        [10.28, pergFloorY + 1.72, 7.11],
        [10.36, pergBeamY, 6.92],
        [10.15, pergRafterY + 0.04, 4.15],
        [9.95, pergRafterY + 0.05, 1.25],
        [9.82, pergRafterY + 0.02, -0.88],
      ],
    },
    {
      radius: 0.036,
      pts: [
        [5.88, pergFloorY, 3.78],
        [5.92, pergFloorY + 0.88, 3.75],
        [5.86, pergFloorY + 1.72, 3.8],
        [5.95, pergBeamY, 3.68],
        [6.85, pergRafterY + 0.04, 2.85],
        [6.75, pergRafterY + 0.03, 0.25],
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

  // Dense Overhead Grape-Vine Canopy Blanketing the Enlarged Pergola Rafters (Photos 1, 5, 8, 10)
  for (let i = 0; i < 220; i++) {
    const h1 = Math.sin((i + 17) * 12.9898) * 43758.5453;
    const f1 = h1 - Math.floor(h1);
    const h2 = Math.sin((i + 17) * 78.233) * 19341.123;
    const f2 = h2 - Math.floor(h2);
    const h3 = Math.sin((i + 17) * 39.425) * 27183.456;
    const f3 = h3 - Math.floor(h3);

    const gx = pergMinX - 0.18 + f1 * (pergMaxX - pergMinX + 0.42);
    const gz = pergMinZ - 0.15 + f2 * (pergMaxZ - pergMinZ + 0.45);
    const gy = pergRafterY + 0.02 + f3 * 0.24;
    const scale = 1.2 + (i % 4) * 0.24;

    const spray = new THREE.Mesh(grapeSprayGeo, grapeCanopyMats[i % 3]!);
    spray.position.set(gx, gy, gz);
    spray.rotation.set((f3 - 0.5) * 0.55, f1 * Math.PI * 2, (f2 - 0.5) * 0.55);
    spray.scale.set(scale, scale, scale);
    spray.castShadow = true;
    spray.receiveShadow = true;
    pergolaGroup.add(spray);
  }

  // Trailing Grape-Vine Shoots Cascading Over the South Brick Wall (Photo 10 right!)
  // and Over the West Piers (Photo 8 right & media_1791117139446_c727cd76.jpg!)
  for (let i = 0; i < 84; i++) {
    const t = i / 84;
    const h1 = Math.sin((i + 91) * 19.13) * 31415.926;
    const f1 = h1 - Math.floor(h1);
    const h2 = Math.sin((i + 91) * 53.71) * 27182.818;
    const f2 = h2 - Math.floor(h2);

    let gx = 0;
    let gy = 0;
    let gz = 0;
    if (i < 34) {
      gx = 6.85 + (i / 34) * 4.65;
      gy = pergFloorY + 1.68 + f1 * 0.78;
      gz = pergMaxZ + 0.14 + f2 * 0.16;
    } else if (i < 66) {
      gx = pergMinX - 0.12 + f2 * 0.24;
      gy = pergFloorY + 1.48 + f1 * 0.96;
      gz = pergMinZ + ((i - 34) / 32) * (pergMaxZ - pergMinZ);
    } else {
      gx = pergMinX + ((i - 66) / 18) * (pergMaxX - pergMinX);
      gy = pergFloorY + 1.82 + f1 * 0.62;
      gz = pergMinZ - 0.12 + f2 * 0.2;
    }

    const scale = 1.1 + (i % 3) * 0.22;
    const trailingSpray = new THREE.Mesh(grapeSprayGeo, grapeCanopyMats[(i + 1) % 3]!);
    trailingSpray.position.set(gx, gy, gz);
    trailingSpray.rotation.set(0.65 + f1 * 0.5, t * Math.PI * 4, (f2 - 0.5) * 0.6);
    trailingSpray.scale.set(scale, scale, scale);
    trailingSpray.castShadow = true;
    pergolaGroup.add(trailingSpray);
  }

  // Pendant Clusters of Grapes hanging beneath the Raised Pergola Rafters (Photo 8 top)
  const grapeBerryGeo = new THREE.SphereGeometry(0.016, 6, 6);
  const bunchPositions: ReadonlyArray<readonly [number, number, number, boolean]> = [
    [7.35, pergBeamY - 0.12, 1.25, true],
    [8.45, pergBeamY - 0.14, 2.35, false],
    [9.35, pergBeamY - 0.11, 3.45, true],
    [8.05, pergBeamY - 0.13, 4.65, true],
    [9.85, pergBeamY - 0.12, 1.85, false],
    [10.15, pergBeamY - 0.14, 5.15, true],
    [7.25, pergBeamY - 0.12, 5.45, false],
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

  // 6i. Slatted Weathered-Teak Outdoor Dining Table & 6 Slatted Teak Armchairs
  //     Centered on the +0.32m Raised Pergola Floor at (X = +8.65m, Y = +0.32m, Z = +3.35m -- Photo 8 center!)
  const diningSetGroup = new THREE.Group();
  diningSetGroup.name = 'courtyard.grapeVinePergola.diningSet';
  diningSetGroup.position.set(8.65, pergFloorY, 3.35);

  const pergolaTeakMat = new THREE.MeshStandardMaterial({
    color: 0x91795e,
    roughness: 0.7,
    metalness: 0.03,
  });

  const tableW = 0.98;
  const tableD = 2.08;
  const tableH = 0.75;

  for (let s = -4; s <= 4; s++) {
    const slat = new THREE.Mesh(
      new THREE.BoxGeometry(0.092, 0.028, tableD - 0.08),
      pergolaTeakMat
    );
    slat.position.set(s * 0.104, tableH - 0.014, 0);
    slat.castShadow = true;
    slat.receiveShadow = true;
    diningSetGroup.add(slat);
  }
  for (const sideX of [-tableW / 2 + 0.04, tableW / 2 - 0.04]) {
    const sideApron = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.075, tableD - 0.12),
      pergolaTeakMat
    );
    sideApron.position.set(sideX, tableH - 0.055, 0);
    sideApron.castShadow = true;
    diningSetGroup.add(sideApron);
  }
  for (const endZ of [-tableD / 2 + 0.04, tableD / 2 - 0.04]) {
    const endApron = new THREE.Mesh(
      new THREE.BoxGeometry(tableW - 0.12, 0.075, 0.032),
      pergolaTeakMat
    );
    endApron.position.set(0, tableH - 0.055, endZ);
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
    [-0.78, -0.52, Math.PI / 2],
    [-0.78, 0.52, Math.PI / 2],
    [0.78, -0.52, -Math.PI / 2],
    [0.78, 0.52, -Math.PI / 2],
    [0.0, -1.32, 0],
    [0.0, 1.32, Math.PI],
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

  // =========================================================================
  // 7. WALLED VEGETABLE GARDEN & GLAZED GREENHOUSE THROUGH THE PERGOLA
  //    (Issue #11: "Vegetable garden & greenhouse through here" at `[11.959, 0, 3.104]`)
  //    - Pitched-Roof Aluminum & Glass Greenhouse (`2.60m x 3.20m`) just North of the pergola (`X = +9.45m, Z = -3.05m`,
  //      visible in `media_1791117139446_c727cd76.jpg` and `media_1791117140254_b92da505.jpg`!)
  //    - Walled Vegetable Garden (`X = +11.65m..+16.20m, Z = -3.60m..+3.60m`, centered right at world `[11.959, 0, 3.104]`
  //      = `x_ew = +12.44m, z_ew = -0.90m`, visible in `media_1791117124804_7f8fb9b7.jpg` bottom-right!)
  // =========================================================================
  const vegGardenGroup = new THREE.Group();
  vegGardenGroup.name = 'courtyard.vegetableGardenAndGreenhouse';

  const gravelPathMat = new THREE.MeshStandardMaterial({
    color: 0xc2b59e,
    roughness: 0.92,
    metalness: 0.02,
  });
  const aluminumFrameMat = new THREE.MeshStandardMaterial({
    color: 0xbac2c8,
    roughness: 0.34,
    metalness: 0.68,
  });

  // 7a. Gravel / Pea-Shingle Kitchen Garden Floor (`X = +8.20m..+16.20m, Z = -4.55m..+3.65m`)
  const vegGardenGravelPad = new THREE.Mesh(
    new THREE.BoxGeometry(8.0, 0.08, 8.2),
    gravelPathMat
  );
  vegGardenGravelPad.name = 'courtyard.vegetableGarden.gravelFloor';
  vegGardenGravelPad.position.set(12.2, -0.04, -0.45);
  vegGardenGravelPad.receiveShadow = true;
  vegGardenGroup.add(vegGardenGravelPad);

  // Low Reclaimed Brick & Stone Enclosure Wall around the Vegetable Garden (`X = +11.55m..+16.20m`)
  for (const [wx, wz, ww, wd] of [
    [13.88, -4.55, 4.65, 0.24], // North garden wall
    [13.88, 3.65, 4.65, 0.24],  // South garden wall
    [16.2, -0.45, 0.24, 8.2],   // East garden boundary wall with gate gap
  ] as const) {
    const gWall = new THREE.Mesh(
      applyCourtyardBrickUVs(new THREE.BoxGeometry(ww, 0.92, wd), wx, 0.46, wz),
      brickWallMat
    );
    gWall.position.set(wx, 0.46, wz);
    gWall.castShadow = true;
    gWall.receiveShadow = true;
    vegGardenGroup.add(gWall);

    const gCoping = new THREE.Mesh(
      new THREE.BoxGeometry(ww + 0.04, 0.045, wd + 0.04),
      limestoneEdgingMat
    );
    gCoping.position.set(wx, 0.94, wz);
    vegGardenGroup.add(gCoping);
  }

  // 7b. Pitched-Roof Aluminum & Clear-Glass Greenhouse (`2.60m W x 3.20m D`, Eave 1.58m, Ridge 2.34m)
  //     Positioned at (`X = +9.50m, Z = -2.95m`, visible in `media_1791117139446_c727cd76.jpg`!)
  const greenhouseGroup = new THREE.Group();
  greenhouseGroup.name = 'courtyard.greenhouse';
  greenhouseGroup.position.set(9.5, 0.0, -2.95);

  const ghW = 2.6;
  const ghD = 3.2;
  const ghBrickH = 0.42;
  const ghEaveH = 1.58;
  const ghRidgeH = 2.34;
  const ghSlopeRise = ghRidgeH - ghEaveH;
  const ghHalfW = ghW * 0.5;
  const ghSlopeLen = Math.hypot(ghHalfW, ghSlopeRise);
  const ghPitch = Math.atan2(ghSlopeRise, ghHalfW);

  // Low brick dwarf base walls around the greenhouse (leaving South entrance doorway open at X = -0.38..+0.38)
  for (const [bx, bz, bw, bd] of [
    [-ghHalfW, 0, 0.12, ghD],
    [ghHalfW, 0, 0.12, ghD],
    [0, -ghD * 0.5, ghW, 0.12],
    [-0.82, ghD * 0.5, 0.96, 0.12],
    [0.82, ghD * 0.5, 0.96, 0.12],
  ] as const) {
    const dwarfBase = new THREE.Mesh(
      new THREE.BoxGeometry(bw, ghBrickH, bd),
      brickWallMat
    );
    dwarfBase.position.set(bx, ghBrickH * 0.5, bz);
    dwarfBase.castShadow = true;
    dwarfBase.receiveShadow = true;
    greenhouseGroup.add(dwarfBase);
  }

  // Side glass walls (`X = ±ghHalfW`) & North/South glass gables
  const ghWallGlassH = ghEaveH - ghBrickH;
  for (const sideX of [-1, 1]) {
    const sideGlass = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, ghWallGlassH, ghD - 0.08),
      glassMat
    );
    sideGlass.position.set(sideX * ghHalfW, ghBrickH + ghWallGlassH * 0.5, 0);
    greenhouseGroup.add(sideGlass);

    const eaveBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.04, ghD + 0.04),
      aluminumFrameMat
    );
    eaveBar.position.set(sideX * ghHalfW, ghEaveH, 0);
    greenhouseGroup.add(eaveBar);

    for (let gz = -ghD * 0.5; gz <= ghD * 0.5 + 0.01; gz += 0.64) {
      const mullion = new THREE.Mesh(
        new THREE.BoxGeometry(0.032, ghWallGlassH, 0.032),
        aluminumFrameMat
      );
      mullion.position.set(sideX * ghHalfW, ghBrickH + ghWallGlassH * 0.5, gz);
      greenhouseGroup.add(mullion);
    }

    // Pitched glass roof slope + aluminum roof rafters
    const roofGlass = new THREE.Mesh(
      new THREE.BoxGeometry(ghSlopeLen, 0.016, ghD - 0.06),
      glassMat
    );
    roofGlass.position.set(
      sideX * (ghHalfW * 0.5),
      ghEaveH + ghSlopeRise * 0.5,
      0
    );
    roofGlass.rotation.z = -sideX * ghPitch;
    greenhouseGroup.add(roofGlass);

    for (let gz = -ghD * 0.5; gz <= ghD * 0.5 + 0.01; gz += 0.64) {
      const roofBar = new THREE.Mesh(
        new THREE.BoxGeometry(ghSlopeLen + 0.04, 0.032, 0.032),
        aluminumFrameMat
      );
      roofBar.position.set(
        sideX * (ghHalfW * 0.5),
        ghEaveH + ghSlopeRise * 0.5,
        gz
      );
      roofBar.rotation.z = -sideX * ghPitch;
      greenhouseGroup.add(roofBar);
    }
  }

  // Aluminum ridge bar & South sliding glass door frame
  const ghRidgeBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.055, ghD + 0.06),
    aluminumFrameMat
  );
  ghRidgeBar.position.set(0, ghRidgeH, 0);
  greenhouseGroup.add(ghRidgeBar);

  for (const endZ of [-ghD * 0.5, ghD * 0.5]) {
    const endGlass = new THREE.Mesh(
      new THREE.BoxGeometry(ghW - 0.08, ghWallGlassH, 0.016),
      glassMat
    );
    endGlass.position.set(0, ghBrickH + ghWallGlassH * 0.5, endZ);
    greenhouseGroup.add(endGlass);

    for (const gx of [-0.65, -0.36, 0.36, 0.65]) {
      const stile = new THREE.Mesh(
        new THREE.BoxGeometry(0.032, ghEaveH, 0.036),
        aluminumFrameMat
      );
      stile.position.set(gx, ghEaveH * 0.5, endZ);
      greenhouseGroup.add(stile);
    }
  }

  // Interior potting staging benches & tomato plants inside the Greenhouse
  for (const sideX of [-0.88, 0.88]) {
    const stagingBench = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.035, ghD - 0.32),
      weatheredBenchMat
    );
    stagingBench.position.set(sideX, 0.78, 0);
    greenhouseGroup.add(stagingBench);

    for (let pz = -1.1; pz <= 1.1; pz += 0.55) {
      const ghPot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.08, 0.18, 10),
        potMat
      );
      ghPot.position.set(sideX, 0.89, pz);
      greenhouseGroup.add(ghPot);

      const tomatoFoliage = new THREE.Mesh(clumpSphereGeo, brightShrubGreenMat);
      tomatoFoliage.scale.set(0.18, 0.28, 0.18);
      tomatoFoliage.position.set(sideX, 1.12, pz);
      greenhouseGroup.add(tomatoFoliage);
    }
  }

  vegGardenGroup.add(greenhouseGroup);

  // 7c. 6 Oak-Sleeper Raised Vegetable Beds (`2.05m x 1.12m x 0.32m`) in a 2 x 3 Kitchen Garden Grid
  //     at `X = +12.85m` and `+15.10m`, `Z = -2.85m, -0.45m, +1.95m` (right at `[11.959, 0, 3.104]`, Issue #11!)
  const bedW = 1.85;
  const bedD = 1.65;
  const bedH = 0.32;
  const vegBedCenters: ReadonlyArray<readonly [number, number, boolean]> = [
    [12.75, -2.75, false],
    [14.95, -2.75, true],
    [12.75, -0.45, true],
    [14.95, -0.45, false],
    [12.75, 1.85, false],
    [14.95, 1.85, true],
  ];

  for (const [bx, bz, hasBeanWigwam] of vegBedCenters) {
    const bedGroup = new THREE.Group();
    bedGroup.position.set(bx, 0, bz);

    // Timber sleeper perimeter walls
    for (const sz of [-bedD * 0.5 + 0.05, bedD * 0.5 - 0.05]) {
      const sleeperFB = new THREE.Mesh(
        new THREE.BoxGeometry(bedW, bedH, 0.1),
        structuralOakMat
      );
      sleeperFB.position.set(0, bedH * 0.5, sz);
      sleeperFB.castShadow = true;
      sleeperFB.receiveShadow = true;
      bedGroup.add(sleeperFB);
    }
    for (const sx of [-bedW * 0.5 + 0.05, bedW * 0.5 - 0.05]) {
      const sleeperLR = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, bedH, bedD - 0.2),
        structuralOakMat
      );
      sleeperLR.position.set(sx, bedH * 0.5, 0);
      sleeperLR.castShadow = true;
      sleeperLR.receiveShadow = true;
      bedGroup.add(sleeperLR);
    }

    // Dark organic compost soil fill
    const soilFill = new THREE.Mesh(
      new THREE.BoxGeometry(bedW - 0.18, bedH - 0.04, bedD - 0.18),
      soilMat
    );
    soilFill.position.set(0, (bedH - 0.04) * 0.5, 0);
    soilFill.receiveShadow = true;
    bedGroup.add(soilFill);

    // Rows of leafy green vegetables (cabbages, kale, courgettes, lettuces)
    for (const rx of [-0.52, 0.0, 0.52]) {
      for (const rz of [-0.48, 0.0, 0.48]) {
        const cropMound = new THREE.Mesh(
          clumpSphereGeo,
          (Math.round((rx + rz) * 10) & 1) === 0 ? brightShrubGreenMat : deepGreenFoliageMat
        );
        cropMound.scale.set(0.22, 0.16, 0.22);
        cropMound.position.set(rx, bedH + 0.08, rz);
        cropMound.castShadow = true;
        bedGroup.add(cropMound);
      }
    }

    // Bamboo cane runner-bean / sweet-pea wigwam trellis on alternating beds
    if (hasBeanWigwam) {
      for (let c = 0; c < 6; c++) {
        const ang = (c / 6) * Math.PI * 2;
        const cane = new THREE.Mesh(
          new THREE.CylinderGeometry(0.01, 0.014, 1.55, 6),
          weatheredBenchMat
        );
        cane.position.set(Math.cos(ang) * 0.22, bedH + 0.72, Math.sin(ang) * 0.22);
        cane.rotation.z = Math.cos(ang) * 0.18;
        cane.rotation.x = -Math.sin(ang) * 0.18;
        cane.castShadow = true;
        bedGroup.add(cane);
      }
      const vineClimber = new THREE.Mesh(
        new THREE.ConeGeometry(0.32, 1.15, 8),
        grapeSunlitGreenMat
      );
      vineClimber.position.set(0, bedH + 0.62, 0);
      vineClimber.castShadow = true;
      bedGroup.add(vineClimber);
    }

    vegGardenGroup.add(bedGroup);
  }

  scene.add(vegGardenGroup);
}
