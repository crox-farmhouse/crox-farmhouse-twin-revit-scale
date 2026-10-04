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

  // West Return of the Low Brick Retaining Wall separating the wider Raised Patio
  // from the Main Cobbled Courtyard (X = -4.52m, Z = +3.84m..+7.96m, Issue #6!)
  const lowBrickReturnWest = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(0.22, 0.28, 4.12), -4.52, 0.08, 5.9),
    brickWallMat
  );
  lowBrickReturnWest.position.set(-4.52, 0.08, 5.9);
  lowBrickReturnWest.castShadow = true;
  lowBrickReturnWest.receiveShadow = true;
  scene.add(lowBrickReturnWest);

  const lowBrickReturnCopingWest = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.048, 4.16),
    blueBrickCopingMat
  );
  lowBrickReturnCopingWest.position.set(-4.52, 0.244, 5.9);
  lowBrickReturnCopingWest.castShadow = true;
  lowBrickReturnCopingWest.receiveShadow = true;
  scene.add(lowBrickReturnCopingWest);

  // Black Wrought-Iron Boundary Railings along the West Return of the wider Patio (X = -4.52m, Z = +4.05m..+7.88m, Issue #6)
  const wroughtIronMat = new THREE.MeshStandardMaterial({
    color: 0x1c1e22,
    roughness: 0.44,
    metalness: 0.72,
  });
  for (const railY of [0.48, 0.82]) {
    const railBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.025, 3.84),
      wroughtIronMat
    );
    railBar.position.set(-4.52, railY, 5.96);
    railBar.castShadow = true;
    scene.add(railBar);
  }
  for (let rz = 4.08; rz <= 7.86; rz += 0.24) {
    const spindle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.62, 6),
      wroughtIronMat
    );
    spindle.position.set(-4.52, 0.56, rz);
    spindle.castShadow = true;
    scene.add(spindle);
  }

  // Weathered Timber Garden Bench & Rusted Cast-Iron Fire-Bowl Planter along the West side of the Patio
  // facing the main cobbled courtyard (X = -4.84m, Z = +5.80m, Photo 5 center!)
  const westPatioBenchGroup = new THREE.Group();
  westPatioBenchGroup.name = 'courtyard.rattanPatioWestBench';
  westPatioBenchGroup.position.set(-4.84, -0.14, 5.8);
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

  // Rusted Cast-Iron Circular Fire-Bowl Planter on a low ring stand (X = -5.05m, Z = +7.25m, Photo 5 center-left)
  const rustedBowlMat = new THREE.MeshStandardMaterial({
    color: 0x6e3b28,
    roughness: 0.84,
    metalness: 0.28,
  });
  const fireBowlStand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.3, 0.14, 16),
    wroughtIronMat
  );
  fireBowlStand.position.set(-5.05, -0.11, 7.25);
  scene.add(fireBowlStand);
  const fireBowl = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 18, 12, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5),
    rustedBowlMat
  );
  fireBowl.scale.set(1.0, 0.52, 1.0);
  fireBowl.position.set(-5.05, 0.14, 7.25);
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
  // 3. SOUTH OF KITCHEN: WIDER RAISED RIVEN FLAGSTONE PATIO TERRACE & COTTAGE SHRUB BANK
  //    (Issue #6: "This section is a little wider" at `[-0.413, 0.09, 7.615]`,
  //     Issue #7: "Tis section is narrower" at `[1.502, -0.061, 12.612]`)
  // =========================================================================
  const limestoneSlabTex = createCourtyardStoneTexture();
  const limestoneSlabMat = new THREE.MeshStandardMaterial({
    map: limestoneSlabTex,
    roughness: 0.78,
    metalness: 0.04,
  });

  // Wider Raised Limestone Flagstone Patio Slab (`X = -4.40m..+4.25m, Z = +3.95m..+7.80m`, 8.65m x 3.85m, Issue #6!)
  const rattanPatioSlab = new THREE.Mesh(
    new THREE.BoxGeometry(8.65, 0.16, 3.85),
    limestoneSlabMat
  );
  rattanPatioSlab.name = 'courtyard.rattanPatioSlab';
  rattanPatioSlab.position.set(-0.075, 0.01, 5.875);
  rattanPatioSlab.receiveShadow = true;
  scene.add(rattanPatioSlab);

  // Stepped Red-Brick Retaining Wall & Mulched Shrub Bank wrapping the South (`Z = +7.80m..+8.65m`)
  // and East (`X = +4.25m..+5.26m`) borders of the wider Raised Patio Terrace (Photos 9, 10, 11!)
  const patioSouthBrickWall = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(9.78, 0.28, 0.18), 0.42, 0.05, 8.62),
    brickWallMat
  );
  patioSouthBrickWall.position.set(0.42, 0.05, 8.62);
  patioSouthBrickWall.castShadow = true;
  patioSouthBrickWall.receiveShadow = true;
  scene.add(patioSouthBrickWall);

  const patioSouthBrickCoping = new THREE.Mesh(
    new THREE.BoxGeometry(9.82, 0.045, 0.22),
    brickSoldierCopingMat
  );
  patioSouthBrickCoping.position.set(0.42, 0.21, 8.62);
  patioSouthBrickCoping.castShadow = true;
  patioSouthBrickCoping.receiveShadow = true;
  scene.add(patioSouthBrickCoping);

  const patioSouthSoilBed = new THREE.Mesh(
    new THREE.BoxGeometry(9.5, 0.2, 0.78),
    soilMat
  );
  patioSouthSoilBed.position.set(0.35, 0.04, 8.2);
  patioSouthSoilBed.receiveShadow = true;
  scene.add(patioSouthSoilBed);

  const patioEastBrickWall = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(0.18, 0.28, 4.78), 5.2, 0.05, 6.24),
    brickWallMat
  );
  patioEastBrickWall.position.set(5.2, 0.05, 6.24);
  patioEastBrickWall.castShadow = true;
  patioEastBrickWall.receiveShadow = true;
  scene.add(patioEastBrickWall);

  const patioEastSoilBed = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.2, 4.6),
    soilMat
  );
  patioEastSoilBed.position.set(4.68, 0.04, 6.24);
  patioEastSoilBed.receiveShadow = true;
  scene.add(patioEastSoilBed);

  const clumpSphereGeo = new THREE.SphereGeometry(1, 14, 12);
  const bloomSphereGeo = new THREE.SphereGeometry(0.055, 8, 8);

  // 1) Golden-Yellow Choisya ternata 'Sundance' Shrub in the SW/West border (Photo 9 center-left & Photo 5)
  for (const [dx, dy, dz, rx, ry, rz] of [
    [-3.65, 0.44, 7.92, 0.62, 0.48, 0.56],
    [-3.12, 0.38, 8.08, 0.48, 0.4, 0.46],
    [-4.05, 0.4, 7.45, 0.46, 0.38, 0.44],
  ] as const) {
    const choisyaMound = new THREE.Mesh(clumpSphereGeo, goldenChoisyaMat);
    choisyaMound.scale.set(rx, ry, rz);
    choisyaMound.position.set(dx, dy, dz);
    choisyaMound.castShadow = true;
    choisyaMound.receiveShadow = true;
    scene.add(choisyaMound);
  }

  // 2) Multi-Stem Dome-Crowned Ornamental Shrub / Small Tree on the South Patio Bank (`X = -1.95m, Z = +8.15m` -- Photo 9 center-left!)
  for (const [sx, sz, rotZ, rotX] of [
    [-2.08, 8.08, 0.16, -0.08],
    [-1.92, 8.18, -0.14, 0.1],
    [-1.82, 8.12, 0.09, 0.14],
    [-2.0, 8.22, -0.06, -0.12],
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
    [-1.95, 1.15, 8.15, 0.78, 0.48, 0.68],
    [-2.45, 1.04, 8.05, 0.56, 0.4, 0.52],
    [-1.42, 1.06, 8.18, 0.58, 0.42, 0.54],
  ] as const) {
    const canopy = new THREE.Mesh(clumpSphereGeo, sageFoliageMat);
    canopy.scale.set(rx, ry, rz);
    canopy.position.set(cx, cy, cz);
    canopy.castShadow = true;
    canopy.receiveShadow = true;
    scene.add(canopy);
  }

  // 3) Large Rounded Bright-Green Bush on the South-Center Bank & Lush East Shrub Bank (`X = -0.15m..+4.75m`, Photos 9, 10, 11!)
  for (const [bx, by, bz, rx, ry, rz, mat] of [
    [-0.15, 0.58, 8.08, 0.76, 0.58, 0.68, brightShrubGreenMat],
    [0.52, 0.48, 8.18, 0.56, 0.44, 0.52, deepGreenFoliageMat],
    [1.85, 0.52, 8.22, 0.64, 0.48, 0.56, sageFoliageMat],
    [3.15, 0.56, 8.25, 0.68, 0.52, 0.58, brightShrubGreenMat],
    [4.45, 0.62, 8.05, 0.68, 0.56, 0.58, deepGreenFoliageMat],
    [4.68, 0.58, 6.45, 0.54, 0.52, 0.58, sageFoliageMat],
    [4.65, 0.54, 4.95, 0.52, 0.46, 0.52, brightShrubGreenMat],
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
    [0.82, 8.38, 0.18, 0.13, 0.3, creamPotMat, brightShrubGreenMat, false, false], // Cream pot at South brick step in Photo 9 bottom-left!
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
    [5.68, -0.68], // Flanking South side of Utility Split Stable Exit Door
    [5.68, -1.72], // Flanking North side of Utility Split Stable Exit Door (within the Z = -1.85m boundary, Issue #4!)
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
  //    (X = +6.82m..+11.85m, Z = -0.95m..+8.65m, Floor raised +0.32m via 2 steps!)
  //    - Issue #1 ("There is a path between the house and the pergola" at `[5.387, 0.523, 4.643]`):
  //      Shifted `pergMinX` East to `X = +6.82m` so the `1.46m`-wide cobbled path (`X = +5.28m..+6.74m`)
  //      runs completely clear between the Kitchen/Patio (`X <= +5.26m`) and the West edge of the Pergola (`X = +6.82m`)!
  //    - Issue #2 ("No gate here" at `[5.975, 0.768, 10.532]`):
  //      Removed `courtyard.grapeVinePergola.wroughtIronGate` completely; the South red-brick boundary wall
  //      (`Z = +8.65m`) is a solid continuous wall facing the cobbled alleyway (`Photo 10` right)!
  //    - Issue #3 ("Boundary of house is here, vegetable garden should not go past it" at `[11.899, 0.405, 2.951]`)
  //      & Issue #4 ("Boundary shrinks at this point to edge of pergola" at `[6.488, -0.01, 1.326]`):
  //      The North wall of the Pergola (`Z = -0.95m`, world `Z = 2.95m` at `X = 11.85m`) is the Northern property boundary!
  // =========================================================================
  const pergolaGroup = new THREE.Group();
  pergolaGroup.name = 'courtyard.grapeVinePergola';
  const pergMinX = 6.82;
  const pergMaxX = 11.85;
  const pergMinZ = -0.95;
  const pergMaxZ = 8.65;
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

  // Issue #4: Short North boundary brick wall & gate return at X = +5.28m..+6.82m, Z = -1.85m..-0.95m
  // where the property boundary shrinks from the Utility Room North corner (`Z = -1.85m`) to the North edge of the Pergola (`Z = -0.95m`)!
  const boundaryStepNorthWall = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(1.54, 2.1, 0.24), 6.05, 1.05, -1.92),
    brickWallMat
  );
  boundaryStepNorthWall.position.set(6.05, 1.05, -1.92);
  boundaryStepNorthWall.castShadow = true;
  pergolaGroup.add(boundaryStepNorthWall);

  const boundaryStepEastReturn = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(0.24, 2.25, 1.02), pergMinX, 1.125, -1.45),
    brickWallMat
  );
  boundaryStepEastReturn.position.set(pergMinX, 1.125, -1.45);
  boundaryStepEastReturn.castShadow = true;
  pergolaGroup.add(boundaryStepEastReturn);

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

  // Issue #10 & Issue #1: 2 Reclaimed Stone Steps (`Step 1` at Y = 0.00..0.16m, `Step 2` at Y = 0.16..0.32m)
  // at the two West Colonnade Entrances (flush with `pergMinX` so the `X = +5.28m..+6.74m` cobbled path is 100% clear!)
  // and at the East Vegetable Garden Opening (`X = pergMaxX`)!
  for (let s = 0; s < 2; s++) {
    const stepTopY = (s + 1) * 0.16;
    const stepH = 0.16;
    // 1. West-North Colonnade Entrance Steps (`Z = +1.75m..+3.55m`)
    const westNorthStep = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, stepH, 1.85),
      limestoneEdgingMat
    );
    westNorthStep.position.set(pergMinX - (0.5 - s) * 0.28, stepTopY - stepH * 0.5, 2.65);
    westNorthStep.castShadow = true;
    westNorthStep.receiveShadow = true;
    pergolaGroup.add(westNorthStep);

    // 2. West-South Colonnade Entrance Steps from the Path/Alleyway (`Z = +6.95m..+8.25m`, visible in `media_1791117142949_ea0b0b94.jpg` right!)
    const westSouthStep = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, stepH, 1.3),
      limestoneEdgingMat
    );
    westSouthStep.position.set(pergMinX - (0.5 - s) * 0.28, stepTopY - stepH * 0.5, 7.6);
    westSouthStep.castShadow = true;
    westSouthStep.receiveShadow = true;
    pergolaGroup.add(westSouthStep);

    // 3. East Opening Steps down into the Vegetable Garden & Greenhouse (`X = pergMaxX + (0.5 + (1 - s)) * 0.30m`, `Z = +1.85m..+3.35m`)
    const eastGardenStep = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, stepH, 1.5),
      limestoneEdgingMat
    );
    eastGardenStep.position.set(pergMaxX + (0.5 + (1 - s)) * 0.3, stepTopY - stepH * 0.5, 2.6);
    eastGardenStep.castShadow = true;
    eastGardenStep.receiveShadow = true;
    pergolaGroup.add(eastGardenStep);
  }

  // 6a. Continuous Solid North Coursed Fieldstone Boundary Wall (`Z = -0.95m, X = +6.82m..+11.85m` — Issue #3: "Boundary of house is here"!)
  const northWallSpanX = pergMaxX - pergMinX;
  const northWallMidX = (pergMinX + pergMaxX) * 0.5;
  const northStoneWall = new THREE.Mesh(
    new THREE.BoxGeometry(northWallSpanX, pergWallTotalH, 0.28),
    fieldstoneWallMat
  );
  northStoneWall.position.set(northWallMidX, pergWallTotalH * 0.5, pergMinZ);
  northStoneWall.castShadow = true;
  northStoneWall.receiveShadow = true;
  pergolaGroup.add(northStoneWall);

  const northStoneCoping = new THREE.Mesh(
    new THREE.BoxGeometry(northWallSpanX + 0.06, 0.06, 0.34),
    limestoneEdgingMat
  );
  northStoneCoping.position.set(northWallMidX, pergWallTotalH + 0.03, pergMinZ);
  northStoneCoping.castShadow = true;
  pergolaGroup.add(northStoneCoping);

  // Projecting Low Interior Stone Bench Ledge along the East Stone Wall (seated on pergFloorY = +0.32m, Photo 8 left!)
  const eastStoneBenchBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.38, 4.6),
    fieldstoneWallMat
  );
  eastStoneBenchBase.position.set(pergMaxX - 0.3, pergFloorY + 0.19, 5.85);
  eastStoneBenchBase.castShadow = true;
  eastStoneBenchBase.receiveShadow = true;
  pergolaGroup.add(eastStoneBenchBase);

  const eastStoneBenchSlab = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.05, 4.66),
    limestoneEdgingMat
  );
  eastStoneBenchSlab.position.set(pergMaxX - 0.3, pergFloorY + 0.405, 5.85);
  eastStoneBenchSlab.castShadow = true;
  pergolaGroup.add(eastStoneBenchSlab);

  const cobaltBluePotMat = new THREE.MeshStandardMaterial({
    color: 0x1d4e89,
    roughness: 0.28,
    metalness: 0.14,
  });

  for (const [pz, r, h, pMat] of [
    [3.85, 0.16, 0.26, creamPotMat],
    [5.05, 0.12, 0.22, zincPotMat],
    [6.35, 0.13, 0.24, potMat],
    [7.45, 0.11, 0.2, zincPotMat],
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

  // 6b. East Coursed Fieldstone Wall (X = +11.85m, Z = -0.95m..+8.65m) with a 1.50m walk-through opening (Z = +1.85m..+3.35m) to the Vegetable Garden & Greenhouse!
  for (const [zMin, zMax] of [
    [pergMinZ, 1.85],
    [3.35, pergMaxZ],
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

  // 6c. Continuous Solid South Tall Reclaimed Red-Brick Wall (`Z = +8.65m, X = +6.82m..+11.85m`, top at Y = +2.56m)
  //     (Issue #2: "No gate here" at `[5.975, 0.768, 10.532]` — solid continuous wall with no gate!)
  const southWallSpanX = pergMaxX - pergMinX;
  const southWallMidX = (pergMinX + pergMaxX) * 0.5;
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

  for (let hx = pergMinX + 0.35; hx <= pergMaxX - 0.35; hx += 0.62) {
    const herbMound = new THREE.Mesh(
      clumpSphereGeo,
      Math.round(hx * 2) % 2 === 0 ? sageFoliageMat : deepGreenFoliageMat
    );
    herbMound.scale.set(0.32, 0.26, 0.24);
    herbMound.position.set(hx, 0.22, pergMaxZ + 0.26);
    herbMound.castShadow = true;
    pergolaGroup.add(herbMound);
  }

  // 6d. Red-Brick Support Piers along the West Open Colonnade (`X = +6.82m`, East of the `X = +5.28m..+6.74m` cobbled path — Issue #1!)
  for (const [px, pz, pw, pd] of [
    [pergMinX, pergMinZ, 0.38, 0.38], // NW Corner Brick Pier
    [pergMinX, 1.55, 0.38, 0.38],     // West-North Entrance Pier
    [pergMinX, 3.75, 0.38, 0.38],     // West-Center Entrance Pier
    [pergMinX, 6.75, 0.38, 0.38],     // West-South Entrance Pier (visible in `media_1791117142949_ea0b0b94.jpg` right!)
    [pergMinX, pergMaxZ, 0.38, 0.38], // SW Corner Brick Pier (Photo 10 right!)
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

  // Low Brick Dwarf Walls between the West Piers (`X = +6.82m`, leaving the two West entrances open at `Z = +1.75m..+3.55m` and `Z = +6.95m..+8.45m`)
  for (const [wz, wd] of [
    [0.3, 2.12],
    [5.25, 2.62],
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
    [7.18, 1.15, 0.19, 0.13, 0.34, cobaltBluePotMat, brightShrubGreenMat],
    [7.16, 4.25, 0.19, 0.13, 0.34, cobaltBluePotMat, deepGreenFoliageMat],
    [7.18, 5.15, 0.16, 0.11, 0.28, potMat, sageFoliageMat],
    [7.16, 5.95, 0.15, 0.11, 0.26, zincPotMat, brightShrubGreenMat],
    [7.18, 6.45, 0.18, 0.13, 0.32, potMat, sageFoliageMat],
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
  for (const bz of [pergMinZ, 1.55, 3.75, 6.75, pergMaxZ]) {
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
  for (let rx = pergMinX; rx <= pergMaxX + 0.05; rx += 0.56) {
    const rafter = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.13, rafterSpanZ),
      structuralOakMat
    );
    rafter.position.set(rx, pergRafterY, rafterMidZ);
    rafter.castShadow = true;
    rafter.receiveShadow = true;
    pergolaGroup.add(rafter);
  }

  for (let bz = pergMinZ + 0.55; bz <= pergMaxZ - 0.35; bz += 0.9) {
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
  for (const fz of [0.45, 2.75, 5.15, 7.35]) {
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
  //     (Vitis vinifera) + Pendant Grape Clusters across the pergola (Photos 1, 5, 8, 10)
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
        [8.65, pergFloorY, 8.42],
        [8.58, pergFloorY + 0.85, 8.4],
        [8.72, pergFloorY + 1.65, 8.41],
        [8.66, pergBeamY - 0.02, 8.25],
        [8.55, pergRafterY + 0.04, 4.85],
        [8.42, pergRafterY + 0.05, 1.55],
        [8.35, pergRafterY + 0.02, -0.65],
      ],
    },
    {
      radius: 0.038,
      pts: [
        [10.65, pergFloorY, 8.42],
        [10.72, pergFloorY + 0.88, 8.4],
        [10.58, pergFloorY + 1.72, 8.41],
        [10.66, pergBeamY, 8.22],
        [10.45, pergRafterY + 0.04, 4.75],
        [10.25, pergRafterY + 0.05, 1.45],
        [10.12, pergRafterY + 0.02, -0.68],
      ],
    },
    {
      radius: 0.036,
      pts: [
        [7.05, pergFloorY, 3.78],
        [7.08, pergFloorY + 0.88, 3.75],
        [7.02, pergFloorY + 1.72, 3.8],
        [7.12, pergBeamY, 3.68],
        [7.85, pergRafterY + 0.04, 2.85],
        [7.75, pergRafterY + 0.03, 0.25],
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

  // Dense Overhead Grape-Vine Canopy Blanketing the Pergola Rafters (Photos 1, 5, 8, 10)
  for (let i = 0; i < 220; i++) {
    const h1 = Math.sin((i + 17) * 12.9898) * 43758.5453;
    const f1 = h1 - Math.floor(h1);
    const h2 = Math.sin((i + 17) * 78.233) * 19341.123;
    const f2 = h2 - Math.floor(h2);
    const h3 = Math.sin((i + 17) * 39.425) * 27183.456;
    const f3 = h3 - Math.floor(h3);

    const gx = pergMinX - 0.18 + f1 * (pergMaxX - pergMinX + 0.42);
    const gz = pergMinZ - 0.12 + f2 * (pergMaxZ - pergMinZ + 0.38);
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
      gx = pergMinX + 0.15 + (i / 34) * (pergMaxX - pergMinX - 0.3);
      gy = pergFloorY + 1.68 + f1 * 0.78;
      gz = pergMaxZ + 0.14 + f2 * 0.16;
    } else if (i < 66) {
      gx = pergMinX - 0.12 + f2 * 0.24;
      gy = pergFloorY + 1.48 + f1 * 0.96;
      gz = pergMinZ + ((i - 34) / 32) * (pergMaxZ - pergMinZ);
    } else {
      gx = pergMinX + ((i - 66) / 18) * (pergMaxX - pergMinX);
      gy = pergFloorY + 1.82 + f1 * 0.62;
      gz = pergMinZ - 0.08 + f2 * 0.16;
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
    [7.85, pergBeamY - 0.12, 1.45, true],
    [8.95, pergBeamY - 0.14, 2.75, false],
    [9.85, pergBeamY - 0.11, 3.85, true],
    [8.55, pergBeamY - 0.13, 5.25, true],
    [10.35, pergBeamY - 0.12, 2.05, false],
    [10.65, pergBeamY - 0.14, 5.85, true],
    [7.75, pergBeamY - 0.12, 6.25, false],
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
  //     Centered on the +0.32m Raised Pergola Floor at (X = +9.35m, Y = +0.32m, Z = +4.15m -- Photo 8 center!)
  const diningSetGroup = new THREE.Group();
  diningSetGroup.name = 'courtyard.grapeVinePergola.diningSet';
  diningSetGroup.position.set(9.35, pergFloorY, 4.15);

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
  // 7. WALLED VEGETABLE GARDEN & GLAZED GREENHOUSE EAST OF THE PERGOLA
  //    - Issue #3 ("Boundary of house is here, vegetable garden should not go past it" at `[11.899, 0.405, 2.951]`):
  //      Strictly bounded on the North by `Z = pergMinZ = -0.95m` (never extending North past `Z = -0.95m`!)
  //      and spanning `X = +11.85m..+17.65m, Z = -0.95m..+8.65m` directly East of the Pergola!
  //    - Issue #5 ("Greenhouse goes here" at `[15.837, 0, 6.605]`):
  //      Places the Pitched-Roof Aluminum & Clear-Glass Greenhouse (`2.60m x 3.20m`) right at
  //      local `(X = +15.85m, Z = +2.17m)` = world `[15.837, 0, 6.605]`!
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

  // 7a. Gravel / Pea-Shingle Kitchen Garden Floor (`X = +11.85m..+17.65m, Z = -0.95m..+8.65m`, strictly South of `Z = -0.95m` — Issue #3!)
  const vegMinX = pergMaxX; // 11.85m
  const vegMaxX = 17.65;
  const vegMinZ = pergMinZ; // -0.95m (North house boundary!)
  const vegMaxZ = pergMaxZ; // +8.65m
  const vegSpanX = vegMaxX - vegMinX; // 5.80m
  const vegSpanZ = vegMaxZ - vegMinZ; // 9.60m
  const vegMidX = (vegMinX + vegMaxX) * 0.5; // 14.75m
  const vegMidZ = (vegMinZ + vegMaxZ) * 0.5; // +3.85m

  const vegGardenGravelPad = new THREE.Mesh(
    new THREE.BoxGeometry(vegSpanX, 0.08, vegSpanZ),
    gravelPathMat
  );
  vegGardenGravelPad.name = 'courtyard.vegetableGarden.gravelFloor';
  vegGardenGravelPad.position.set(vegMidX, -0.04, vegMidZ);
  vegGardenGravelPad.receiveShadow = true;
  vegGardenGroup.add(vegGardenGravelPad);

  // Reclaimed Brick & Stone Enclosure Wall around the Vegetable Garden (`Z = -0.95m` North boundary wall, `Z = +8.65m` South wall, `X = +17.65m` East wall)
  for (const [wx, wz, ww, wd, wh] of [
    [vegMidX, vegMinZ, vegSpanX, 0.26, 1.95], // North boundary wall continuing the Pergola's North boundary line (Issue #3!)
    [vegMidX, vegMaxZ, vegSpanX, 0.24, 0.92], // South garden wall
    [vegMaxX, vegMidZ, 0.24, vegSpanZ, 0.92], // East garden boundary wall
  ] as const) {
    const gWall = new THREE.Mesh(
      applyCourtyardBrickUVs(new THREE.BoxGeometry(ww, wh, wd), wx, wh * 0.5, wz),
      brickWallMat
    );
    gWall.position.set(wx, wh * 0.5, wz);
    gWall.castShadow = true;
    gWall.receiveShadow = true;
    vegGardenGroup.add(gWall);

    const gCoping = new THREE.Mesh(
      new THREE.BoxGeometry(ww + 0.04, 0.045, wd + 0.04),
      limestoneEdgingMat
    );
    gCoping.position.set(wx, wh + 0.022, wz);
    vegGardenGroup.add(gCoping);
  }

  // 7b. Pitched-Roof Aluminum & Clear-Glass Greenhouse (`2.60m W x 3.20m D`, Eave 1.58m, Ridge 2.34m)
  //     Positioned right at (`X = +15.85m, Z = +2.17m` = world `[15.837, 0, 6.605]` — Issue #5: "Greenhouse goes here"!)
  const greenhouseGroup = new THREE.Group();
  greenhouseGroup.name = 'courtyard.greenhouse';
  greenhouseGroup.position.set(15.85, 0.0, 2.17);
  greenhouseGroup.rotation.y = -Math.PI / 2;

  const ghW = 2.6;
  const ghD = 3.2;
  const ghBrickH = 0.42;
  const ghEaveH = 1.58;
  const ghRidgeH = 2.34;
  const ghSlopeRise = ghRidgeH - ghEaveH;
  const ghHalfW = ghW * 0.5;
  const ghSlopeLen = Math.hypot(ghHalfW, ghSlopeRise);
  const ghPitch = Math.atan2(ghSlopeRise, ghHalfW);

  // Low brick dwarf base walls around the greenhouse (leaving West entrance doorway open at X = -0.38..+0.38)
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

  // Aluminum ridge bar & sliding glass door frame
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

  // 7c. 6 Oak-Sleeper Raised Vegetable Beds (`1.65m x 1.55m x 0.32m`) inside the Walled Vegetable Garden
  //     (strictly South of `Z = -0.95m` around the Greenhouse at `X = +15.85m, Z = +2.17m` — Issues #3 & #5!)
  const bedW = 1.65;
  const bedD = 1.55;
  const bedH = 0.32;
  const vegBedCenters: ReadonlyArray<readonly [number, number, boolean]> = [
    [13.15, 0.25, false],
    [13.15, 2.35, true],
    [13.15, 4.75, false],
    [15.85, 4.75, true],
    [13.15, 7.05, true],
    [15.85, 7.05, false],
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
    for (const rx of [-0.46, 0.0, 0.46]) {
      for (const rz of [-0.44, 0.0, 0.44]) {
        const cropMound = new THREE.Mesh(
          clumpSphereGeo,
          (Math.round((rx + rz) * 10) & 1) === 0 ? brightShrubGreenMat : deepGreenFoliageMat
        );
        cropMound.scale.set(0.21, 0.16, 0.21);
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
