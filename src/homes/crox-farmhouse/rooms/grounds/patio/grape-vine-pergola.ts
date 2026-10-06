import * as THREE from 'three';
import type { PatioAndGrapeVinePergolaKit } from '../patio-and-grape-vine-pergola.ts';
import {
  type BotanicalShrubKit,
  createDryStoneWallTextures,
} from './patio-textures-and-shrubs.ts';
import type {
  LowBrickRetainingWallKit,
  RaisedFlagstonePatioKit,
} from './raised-flagstone-patio.ts';

export interface GrapeVinePergolaKit {
  readonly pergMaxX: number;
  readonly pergMinZ: number;
  readonly pergMaxZ: number;
  readonly dryStoneWallMat: THREE.MeshStandardMaterial;
  readonly dryStoneCopingMat: THREE.MeshStandardMaterial;
  readonly applyDryStoneWallUVs: (
    geo: THREE.BoxGeometry,
    ox: number,
    oy: number,
    oz: number,
    tileW?: number,
    tileH?: number
  ) => THREE.BoxGeometry;
  readonly addDryStoneReliefCourses: (
    parent: THREE.Object3D,
    axis: 'x' | 'z',
    spanMin: number,
    spanMax: number,
    fixedCoord: number,
    wallThickness: number,
    baseY: number,
    topY: number,
    seedOffset: number
  ) => void;
  readonly grapeSunlitGreenMat: THREE.MeshStandardMaterial;
}

export function buildGrapeVinePergola(
  scene: THREE.Scene,
  kit: PatioAndGrapeVinePergolaKit,
  retainingWallKit: LowBrickRetainingWallKit,
  shrubKit: BotanicalShrubKit,
  flagstonePatioKit: RaisedFlagstonePatioKit
): GrapeVinePergolaKit {
  const { structuralOakMat } = kit;
  const { brickWallMat, applyCourtyardBrickUVs } = retainingWallKit;
  const {
    soilMat,
    sageFoliageMat,
    deepGreenFoliageMat,
    brightShrubGreenMat,
    whiteBloomMat,
    blushBloomMat,
    lavenderBloomMat,
    geraniumRedBloomMat,
    addSculptedBotanicalShrub,
  } = shrubKit;
  const {
    yorkstonePatioTextures,
    rivenYorkstonePatioMat,
    applyPatioFlagstoneUVs,
    zincPotMat,
    creamPotMat,
    potMat,
  } = flagstonePatioKit;

  // =========================================================================
  // 6. ENLARGED & 2-STEP RAISED WALLED GRAPE-VINE PERGOLA DINING COURT
  //    (X = +6.82m..+11.85m, Z = -0.95m..+7.20m, Floor raised +0.32m via 2 steps!)
  //    - Issue #13 ("This is actually a dry stone wall (see pictures" at `[8.095, 1.293, 10.789]`):
  //      South wall (`Z = +7.20m`) converted to authentic unmortared Dry Stone Wall with 3D relief courses!
  //    - Issue #16 ("Dry stone wall here too" at `[11.504, 0.902, 8.169]`):
  //      East wall (`X = +11.85m`) & North wall (`Z = -0.95m`) & stone bench ledges built with Dry Stone Wall
  //      material, world-space `applyDryStoneWallUVs`, and 3D split-stone relief courses!
  //    - Issue #17 ("More grapes, they are dark colored grapes" at `[8.275, 2.97, 8.561]`):
  //      36 lush hanging dark purple-black Pinot Noir / Black Muscat grape clusters across the pergola canopy!
  // =========================================================================
  const pergolaGroup = new THREE.Group();
  pergolaGroup.name = 'courtyard.grapeVinePergola';
  const pergMinX = 6.82;
  const pergMaxX = 11.85;
  const pergMinZ = -0.95;
  const pergMaxZ = 7.2;
  const pergFloorY = 0.32;
  const pergWallH = 2.24;
  const pergWallTotalH = pergFloorY + pergWallH;
  const pergBeamY = pergFloorY + 2.32;
  const pergRafterY = pergFloorY + 2.44;

  const dryStoneTextures = createDryStoneWallTextures();
  const dryStoneWallMat = new THREE.MeshStandardMaterial({
    color: 0xd8c8b0,
    map: dryStoneTextures.colorMap,
    bumpMap: dryStoneTextures.bumpMap,
    bumpScale: 0.038,
    roughness: 0.88,
    metalness: 0.02,
  });
  const dryStoneReliefMat = new THREE.MeshStandardMaterial({
    color: 0xccb99e,
    map: dryStoneTextures.colorMap,
    bumpMap: dryStoneTextures.bumpMap,
    bumpScale: 0.04,
    roughness: 0.9,
    metalness: 0.02,
  });
  const dryStoneCopingMat = new THREE.MeshStandardMaterial({
    color: 0xc2b298,
    map: yorkstonePatioTextures.colorMap,
    bumpMap: yorkstonePatioTextures.bumpMap,
    bumpScale: 0.03,
    roughness: 0.84,
    metalness: 0.03,
  });

  const applyDryStoneWallUVs = (
    geo: THREE.BoxGeometry,
    ox: number,
    oy: number,
    oz: number,
    tileW = 1.6,
    tileH = 0.85
  ): THREE.BoxGeometry => {
    const pos = geo.attributes.position;
    const norm = geo.attributes.normal;
    const uv = geo.attributes.uv;
    if (!pos || !norm || !uv) return geo;
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
        uv.setXY(i, wx / tileW, wz / tileW);
      }
    }
    uv.needsUpdate = true;
    return geo;
  };

  const addDryStoneReliefCourses = (
    parent: THREE.Object3D,
    axis: 'x' | 'z',
    spanMin: number,
    spanMax: number,
    fixedCoord: number,
    wallThickness: number,
    baseY: number,
    topY: number,
    seedOffset: number
  ): void => {
    const reliefGroup = new THREE.Group();
    reliefGroup.name = 'courtyard.grapeVinePergola.dryStoneRelief';

    const courseYs: number[] = [];
    for (let y = baseY + 0.16; y <= topY - 0.14; y += 0.28) {
      courseYs.push(y);
    }

    for (let r = 0; r < courseYs.length; r++) {
      const cy = courseYs[r]!;
      const slabH = 0.09 + ((r + seedOffset) % 3) * 0.022;
      let cursor = spanMin + 0.08 + (r % 2) * 0.18;
      let idx = 0;
      while (cursor < spanMax - 0.22) {
        const sHash = Math.abs(Math.sin((r * 31 + idx * 17 + seedOffset) * 19.7));
        const slabLen = Math.min(spanMax - 0.08 - cursor, 0.26 + sHash * 0.34);
        if (slabLen < 0.16) break;
        const mid = cursor + slabLen * 0.5;
        const proudDepth = wallThickness + 0.026 + (idx % 3) * 0.008;

        const bw = axis === 'x' ? slabLen : proudDepth;
        const bd = axis === 'x' ? proudDepth : slabLen;
        const px = axis === 'x' ? mid : fixedCoord;
        const pz = axis === 'x' ? fixedCoord : mid;

        const stoneCourse = new THREE.Mesh(
          applyDryStoneWallUVs(new THREE.BoxGeometry(bw, slabH, bd), px, cy, pz),
          (r + idx) % 2 === 0 ? dryStoneWallMat : dryStoneReliefMat
        );
        if (!stoneCourse.name) stoneCourse.name = 'courtyard.grapeVinePergola.stoneCourse';
        stoneCourse.position.set(px, cy, pz);
        stoneCourse.castShadow = true;
        stoneCourse.receiveShadow = true;
        reliefGroup.add(stoneCourse);

        cursor += slabLen + 0.05 + (idx % 2) * 0.04;
        idx++;
      }
    }

    let cCursor = spanMin - 0.02;
    let cIdx = 0;
    while (cCursor < spanMax - 0.05) {
      const cLen = Math.min(spanMax + 0.02 - cCursor, 0.38 + ((cIdx * 13 + seedOffset) % 5) * 0.06);
      if (cLen < 0.12) break;
      const cMid = cCursor + cLen * 0.5;
      const cH = 0.058 + (cIdx % 3) * 0.008;
      const cOverhang = wallThickness + 0.075 + (cIdx % 2) * 0.014;
      const cw = axis === 'x' ? cLen - 0.012 : cOverhang;
      const cd = axis === 'x' ? cOverhang : cLen - 0.012;
      const cx = axis === 'x' ? cMid : fixedCoord;
      const cz = axis === 'x' ? fixedCoord : cMid;

      const copingStone = new THREE.Mesh(
        applyDryStoneWallUVs(new THREE.BoxGeometry(cw, cH, cd), cx, topY + 0.032, cz),
        dryStoneCopingMat
      );
      if (!copingStone.name) copingStone.name = 'courtyard.grapeVinePergola.copingStone';
      copingStone.position.set(cx, topY + 0.032, cz);
      copingStone.castShadow = true;
      copingStone.receiveShadow = true;
      reliefGroup.add(copingStone);

      cCursor += cLen;
      cIdx++;
    }

    parent.add(reliefGroup);
  };

  const boundaryStepNorthWall = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(1.54, 2.1, 0.24), 6.05, 1.05, -1.92),
    brickWallMat
  );
  if (!boundaryStepNorthWall.name) boundaryStepNorthWall.name = 'courtyard.grapeVinePergola.boundaryStepNorthWall';
  boundaryStepNorthWall.position.set(6.05, 1.05, -1.92);
  boundaryStepNorthWall.castShadow = true;
  pergolaGroup.add(boundaryStepNorthWall);

  const boundaryStepEastReturn = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(0.24, 2.25, 1.02), pergMinX, 1.125, -1.45),
    brickWallMat
  );
  if (!boundaryStepEastReturn.name) boundaryStepEastReturn.name = 'courtyard.grapeVinePergola.boundaryStepEastReturn';
  boundaryStepEastReturn.position.set(pergMinX, 1.125, -1.45);
  boundaryStepEastReturn.castShadow = true;
  pergolaGroup.add(boundaryStepEastReturn);

  const plinthMidX = (pergMinX + pergMaxX) * 0.5;
  const plinthMidY = (pergFloorY - 0.14) * 0.5;
  const plinthMidZ = (pergMinZ + pergMaxZ) * 0.5;
  const pergolaRetainingPlinth = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(pergMaxX - pergMinX + 0.16, pergFloorY + 0.06, pergMaxZ - pergMinZ + 0.16),
      plinthMidX,
      plinthMidY,
      plinthMidZ
    ),
    dryStoneWallMat
  );
  if (!pergolaRetainingPlinth.name) pergolaRetainingPlinth.name = 'courtyard.grapeVinePergola.pergolaRetainingPlinth';
  pergolaRetainingPlinth.position.set(plinthMidX, plinthMidY, plinthMidZ);
  pergolaRetainingPlinth.receiveShadow = true;
  pergolaGroup.add(pergolaRetainingPlinth);

  const pergolaCourtFloor = new THREE.Mesh(
    applyPatioFlagstoneUVs(
      new THREE.BoxGeometry(pergMaxX - pergMinX + 0.2, 0.08, pergMaxZ - pergMinZ + 0.2),
      plinthMidX,
      pergFloorY - 0.04,
      plinthMidZ,
      1.85,
      1.85
    ),
    rivenYorkstonePatioMat
  );
  pergolaCourtFloor.name = 'courtyard.grapeVinePergola.floor';
  pergolaCourtFloor.position.set(plinthMidX, pergFloorY - 0.04, plinthMidZ);
  pergolaCourtFloor.receiveShadow = true;
  pergolaGroup.add(pergolaCourtFloor);

  for (let s = 0; s < 2; s++) {
    const stepTopY = (s + 1) * 0.16;
    const stepH = 0.16;
    const stepY = stepTopY - stepH * 0.5;

    const wnX = pergMinX + (s - 0.5) * 0.26;
    const westNorthStep = new THREE.Mesh(
      applyDryStoneWallUVs(new THREE.BoxGeometry(0.28, stepH, 1.8), wnX, stepY, 2.65),
      dryStoneCopingMat
    );
    if (!westNorthStep.name) westNorthStep.name = 'courtyard.grapeVinePergola.westNorthStep';
    westNorthStep.position.set(wnX, stepY, 2.65);
    westNorthStep.castShadow = true;
    westNorthStep.receiveShadow = true;
    pergolaGroup.add(westNorthStep);

    const westSouthStep = new THREE.Mesh(
      applyDryStoneWallUVs(new THREE.BoxGeometry(0.28, stepH, 1.15), wnX, stepY, 6.42),
      dryStoneCopingMat
    );
    if (!westSouthStep.name) westSouthStep.name = 'courtyard.grapeVinePergola.westSouthStep';
    westSouthStep.position.set(wnX, stepY, 6.42);
    westSouthStep.castShadow = true;
    westSouthStep.receiveShadow = true;
    pergolaGroup.add(westSouthStep);

    const egX = pergMaxX + (0.5 + (1 - s)) * 0.3;
    const eastGardenStep = new THREE.Mesh(
      applyDryStoneWallUVs(new THREE.BoxGeometry(0.32, stepH, 1.5), egX, stepY, 2.6),
      dryStoneCopingMat
    );
    if (!eastGardenStep.name) eastGardenStep.name = 'courtyard.grapeVinePergola.eastGardenStep';
    eastGardenStep.position.set(egX, stepY, 2.6);
    eastGardenStep.castShadow = true;
    eastGardenStep.receiveShadow = true;
    pergolaGroup.add(eastGardenStep);
  }

  const northWallSpanX = pergMaxX - pergMinX;
  const northWallMidX = (pergMinX + pergMaxX) * 0.5;
  const northStoneWall = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(northWallSpanX, pergWallTotalH, 0.28),
      northWallMidX,
      pergWallTotalH * 0.5,
      pergMinZ
    ),
    dryStoneWallMat
  );
  if (!northStoneWall.name) northStoneWall.name = 'courtyard.grapeVinePergola.northStoneWall';
  northStoneWall.position.set(northWallMidX, pergWallTotalH * 0.5, pergMinZ);
  northStoneWall.castShadow = true;
  northStoneWall.receiveShadow = true;
  pergolaGroup.add(northStoneWall);

  const northStoneCoping = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(northWallSpanX + 0.06, 0.06, 0.34),
      northWallMidX,
      pergWallTotalH + 0.03,
      pergMinZ
    ),
    dryStoneCopingMat
  );
  if (!northStoneCoping.name) northStoneCoping.name = 'courtyard.grapeVinePergola.northStoneCoping';
  northStoneCoping.position.set(northWallMidX, pergWallTotalH + 0.03, pergMinZ);
  northStoneCoping.castShadow = true;
  pergolaGroup.add(northStoneCoping);
  addDryStoneReliefCourses(
    pergolaGroup,
    'x',
    pergMinX + 0.22,
    pergMaxX - 0.16,
    pergMinZ,
    0.28,
    pergFloorY,
    pergWallTotalH,
    11
  );

  const eastStoneBenchBase = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(0.34, 0.38, 3.5),
      pergMaxX - 0.3,
      pergFloorY + 0.19,
      5.25
    ),
    dryStoneWallMat
  );
  if (!eastStoneBenchBase.name) eastStoneBenchBase.name = 'courtyard.grapeVinePergola.eastStoneBenchBase';
  eastStoneBenchBase.position.set(pergMaxX - 0.3, pergFloorY + 0.19, 5.25);
  eastStoneBenchBase.castShadow = true;
  eastStoneBenchBase.receiveShadow = true;
  pergolaGroup.add(eastStoneBenchBase);

  const eastStoneBenchSlab = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(0.38, 0.05, 3.56),
      pergMaxX - 0.3,
      pergFloorY + 0.405,
      5.25
    ),
    dryStoneCopingMat
  );
  if (!eastStoneBenchSlab.name) eastStoneBenchSlab.name = 'courtyard.grapeVinePergola.eastStoneBenchSlab';
  eastStoneBenchSlab.position.set(pergMaxX - 0.3, pergFloorY + 0.405, 5.25);
  eastStoneBenchSlab.castShadow = true;
  pergolaGroup.add(eastStoneBenchSlab);

  const southStoneBenchBase = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(3.45, 0.36, 0.34),
      9.65,
      pergFloorY + 0.18,
      pergMaxZ - 0.28
    ),
    dryStoneWallMat
  );
  if (!southStoneBenchBase.name) southStoneBenchBase.name = 'courtyard.grapeVinePergola.southStoneBenchBase';
  southStoneBenchBase.position.set(9.65, pergFloorY + 0.18, pergMaxZ - 0.28);
  southStoneBenchBase.castShadow = true;
  southStoneBenchBase.receiveShadow = true;
  pergolaGroup.add(southStoneBenchBase);

  const southStoneBenchSlab = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(3.52, 0.05, 0.38),
      9.65,
      pergFloorY + 0.385,
      pergMaxZ - 0.28
    ),
    dryStoneCopingMat
  );
  if (!southStoneBenchSlab.name) southStoneBenchSlab.name = 'courtyard.grapeVinePergola.southStoneBenchSlab';
  southStoneBenchSlab.position.set(9.65, pergFloorY + 0.385, pergMaxZ - 0.28);
  southStoneBenchSlab.castShadow = true;
  pergolaGroup.add(southStoneBenchSlab);

  const cobaltBluePotMat = new THREE.MeshStandardMaterial({
    color: 0x1d4e89,
    roughness: 0.28,
    metalness: 0.14,
  });

  for (const [pz, r, h, pMat, bMat] of [
    [3.75, 0.16, 0.26, creamPotMat, whiteBloomMat],
    [4.75, 0.12, 0.22, zincPotMat, lavenderBloomMat],
    [5.75, 0.13, 0.24, potMat, geraniumRedBloomMat],
    [6.65, 0.11, 0.2, zincPotMat, whiteBloomMat],
  ] as const) {
    const ledgePot = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.76, h, 12), pMat);
    if (!ledgePot.name) ledgePot.name = 'courtyard.grapeVinePergola.ledgePot';
    ledgePot.position.set(pergMaxX - 0.28, pergFloorY + 0.43 + h / 2, pz);
    ledgePot.castShadow = true;
    pergolaGroup.add(ledgePot);

    addSculptedBotanicalShrub(
      pergolaGroup,
      pergMaxX - 0.28,
      pergFloorY + 0.43 + h + r * 0.48,
      pz,
      r * 1.22,
      r * 0.96,
      r * 1.22,
      sageFoliageMat,
      bMat,
      deepGreenFoliageMat
    );
  }

  for (const [zMin, zMax, seedOff] of [
    [pergMinZ, 1.85, 23],
    [3.35, pergMaxZ, 41],
  ] as const) {
    const segD = zMax - zMin;
    const segMidZ = (zMin + zMax) * 0.5;
    const eastStoneWall = new THREE.Mesh(
      applyDryStoneWallUVs(
        new THREE.BoxGeometry(0.28, pergWallTotalH, segD),
        pergMaxX,
        pergWallTotalH * 0.5,
        segMidZ
      ),
      dryStoneWallMat
    );
    eastStoneWall.name = 'courtyard.grapeVinePergola.eastDryStoneWall';
    eastStoneWall.position.set(pergMaxX, pergWallTotalH * 0.5, segMidZ);
    eastStoneWall.castShadow = true;
    eastStoneWall.receiveShadow = true;
    pergolaGroup.add(eastStoneWall);

    const eastStoneCoping = new THREE.Mesh(
      applyDryStoneWallUVs(
        new THREE.BoxGeometry(0.34, 0.06, segD + 0.06),
        pergMaxX,
        pergWallTotalH + 0.03,
        segMidZ
      ),
      dryStoneCopingMat
    );
    if (!eastStoneCoping.name) eastStoneCoping.name = 'courtyard.grapeVinePergola.eastStoneCoping';
    eastStoneCoping.position.set(pergMaxX, pergWallTotalH + 0.03, segMidZ);
    eastStoneCoping.castShadow = true;
    pergolaGroup.add(eastStoneCoping);

    addDryStoneReliefCourses(
      pergolaGroup,
      'z',
      zMin + 0.08,
      zMax - 0.08,
      pergMaxX,
      0.28,
      pergFloorY,
      pergWallTotalH,
      seedOff
    );
  }

  const southWallSpanX = pergMaxX - pergMinX;
  const southWallMidX = (pergMinX + pergMaxX) * 0.5;
  const southPergolaBrickWall = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(southWallSpanX, pergWallTotalH, 0.28),
      southWallMidX,
      pergWallTotalH * 0.5,
      pergMaxZ
    ),
    dryStoneWallMat
  );
  southPergolaBrickWall.name = 'courtyard.grapeVinePergola.southBrickWall';
  southPergolaBrickWall.position.set(southWallMidX, pergWallTotalH * 0.5, pergMaxZ);
  southPergolaBrickWall.castShadow = true;
  southPergolaBrickWall.receiveShadow = true;
  pergolaGroup.add(southPergolaBrickWall);

  const southPergolaBrickCoping = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(southWallSpanX + 0.06, 0.06, 0.34),
      southWallMidX,
      pergWallTotalH + 0.03,
      pergMaxZ
    ),
    dryStoneCopingMat
  );
  if (!southPergolaBrickCoping.name) southPergolaBrickCoping.name = 'courtyard.grapeVinePergola.southPergolaBrickCoping';
  southPergolaBrickCoping.position.set(southWallMidX, pergWallTotalH + 0.03, pergMaxZ);
  southPergolaBrickCoping.castShadow = true;
  pergolaGroup.add(southPergolaBrickCoping);

  addDryStoneReliefCourses(
    pergolaGroup,
    'x',
    pergMinX + 0.22,
    pergMaxX - 0.14,
    pergMaxZ,
    0.28,
    0.16,
    pergWallTotalH,
    59
  );

  const southAlleyHerbBedKerb = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(southWallSpanX, 0.26, 0.14),
      southWallMidX,
      0.06,
      pergMaxZ + 0.44
    ),
    dryStoneWallMat
  );
  if (!southAlleyHerbBedKerb.name) southAlleyHerbBedKerb.name = 'courtyard.grapeVinePergola.southAlleyHerbBedKerb';
  southAlleyHerbBedKerb.position.set(southWallMidX, 0.06, pergMaxZ + 0.44);
  southAlleyHerbBedKerb.castShadow = true;
  pergolaGroup.add(southAlleyHerbBedKerb);

  const southAlleyHerbSoil = new THREE.Mesh(
    new THREE.BoxGeometry(southWallSpanX - 0.08, 0.2, 0.32),
    soilMat
  );
  if (!southAlleyHerbSoil.name) southAlleyHerbSoil.name = 'courtyard.grapeVinePergola.southAlleyHerbSoil';
  southAlleyHerbSoil.position.set(southWallMidX, 0.04, pergMaxZ + 0.26);
  pergolaGroup.add(southAlleyHerbSoil);

  for (let hx = pergMinX + 0.38; hx <= pergMaxX - 0.38; hx += 0.68) {
    const isEven = Math.round(hx * 2) % 2 === 0;
    addSculptedBotanicalShrub(
      pergolaGroup,
      hx,
      0.24,
      pergMaxZ + 0.26,
      0.32,
      0.26,
      0.24,
      isEven ? sageFoliageMat : deepGreenFoliageMat,
      isEven ? lavenderBloomMat : whiteBloomMat,
      brightShrubGreenMat
    );
  }

  for (const [px, pz, pw, pd] of [
    [pergMinX, pergMinZ, 0.38, 0.38],
    [pergMinX, 1.55, 0.38, 0.38],
    [pergMinX, 3.75, 0.38, 0.38],
    [pergMinX, 5.65, 0.38, 0.38],
    [pergMinX, pergMaxZ, 0.38, 0.38],
  ] as const) {
    const pier = new THREE.Mesh(
      applyDryStoneWallUVs(
        new THREE.BoxGeometry(pw, pergWallTotalH, pd),
        px,
        pergWallTotalH * 0.5,
        pz
      ),
      dryStoneWallMat
    );
    if (!pier.name) pier.name = 'courtyard.grapeVinePergola.pier';
    pier.position.set(px, pergWallTotalH * 0.5, pz);
    pier.castShadow = true;
    pier.receiveShadow = true;
    pergolaGroup.add(pier);

    const pierCap = new THREE.Mesh(
      applyDryStoneWallUVs(
        new THREE.BoxGeometry(pw + 0.06, 0.06, pd + 0.06),
        px,
        pergWallTotalH + 0.03,
        pz
      ),
      dryStoneCopingMat
    );
    if (!pierCap.name) pierCap.name = 'courtyard.grapeVinePergola.pierCap';
    pierCap.position.set(px, pergWallTotalH + 0.03, pz);
    pierCap.castShadow = true;
    pergolaGroup.add(pierCap);
  }

  for (const [wz, wd] of [
    [0.3, 2.12],
    [4.7, 1.52],
  ] as const) {
    const dwarfWall = new THREE.Mesh(
      applyDryStoneWallUVs(new THREE.BoxGeometry(0.26, 0.38, wd), pergMinX, pergFloorY + 0.19, wz),
      dryStoneWallMat
    );
    if (!dwarfWall.name) dwarfWall.name = 'courtyard.grapeVinePergola.dwarfWall';
    dwarfWall.position.set(pergMinX, pergFloorY + 0.19, wz);
    dwarfWall.castShadow = true;
    dwarfWall.receiveShadow = true;
    pergolaGroup.add(dwarfWall);

    const dwarfCoping = new THREE.Mesh(
      applyDryStoneWallUVs(new THREE.BoxGeometry(0.32, 0.05, wd + 0.04), pergMinX, pergFloorY + 0.405, wz),
      dryStoneCopingMat
    );
    if (!dwarfCoping.name) dwarfCoping.name = 'courtyard.grapeVinePergola.dwarfCoping';
    dwarfCoping.position.set(pergMinX, pergFloorY + 0.405, wz);
    dwarfCoping.castShadow = true;
    pergolaGroup.add(dwarfCoping);
  }

  for (const [px, pz, rTop, rBot, h, pMat, fMat, bMat] of [
    [7.18, 1.15, 0.19, 0.13, 0.34, cobaltBluePotMat, brightShrubGreenMat, whiteBloomMat],
    [7.16, 4.15, 0.19, 0.13, 0.34, cobaltBluePotMat, deepGreenFoliageMat, lavenderBloomMat],
    [7.18, 4.75, 0.16, 0.11, 0.28, potMat, sageFoliageMat, geraniumRedBloomMat],
    [7.16, 5.25, 0.15, 0.11, 0.26, zincPotMat, brightShrubGreenMat, whiteBloomMat],
    [7.18, 5.5, 0.18, 0.13, 0.32, potMat, sageFoliageMat, blushBloomMat],
  ] as const) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 14), pMat);
    if (!pot.name) pot.name = 'courtyard.grapeVinePergola.pot';
    pot.position.set(px, pergFloorY + h / 2, pz);
    pot.castShadow = true;
    pot.receiveShadow = true;
    pergolaGroup.add(pot);

    addSculptedBotanicalShrub(
      pergolaGroup,
      px,
      pergFloorY + h + rTop * 0.55,
      pz,
      rTop * 1.22,
      rTop * 1.05,
      rTop * 1.22,
      fMat,
      bMat,
      deepGreenFoliageMat
    );
  }

  const beamSpanX = pergMaxX - pergMinX + 0.52;
  const beamMidX = (pergMinX + pergMaxX) / 2;
  for (const bz of [pergMinZ, 1.55, 3.75, 5.65, pergMaxZ]) {
    const mainBeam = new THREE.Mesh(
      new THREE.BoxGeometry(beamSpanX, 0.15, 0.14),
      structuralOakMat
    );
    if (!mainBeam.name) mainBeam.name = 'courtyard.grapeVinePergola.mainBeam';
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
    if (!rafter.name) rafter.name = 'courtyard.grapeVinePergola.rafter';
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
    if (!batten.name) batten.name = 'courtyard.grapeVinePergola.batten';
    batten.position.set(beamMidX, pergRafterY + 0.08, bz);
    pergolaGroup.add(batten);
  }

  const festoonCordMat = new THREE.MeshStandardMaterial({ color: 0x232528, roughness: 0.6 });
  const festoonBulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff5d6,
    emissive: 0xffb84d,
    emissiveIntensity: 0.55,
    roughness: 0.2,
  });
  const festoonBulbGeo = new THREE.SphereGeometry(0.024, 8, 8);
  for (const fz of [0.45, 2.55, 4.65, 6.45]) {
    const cordPts: THREE.Vector3[] = [];
    for (let s = 0; s <= 12; s++) {
      const t = s / 12;
      const fx = pergMinX + 0.25 + t * (pergMaxX - pergMinX - 0.5);
      const sag = Math.sin(t * Math.PI * 4) * 0.06;
      const fy = pergBeamY - 0.06 - Math.abs(sag);
      cordPts.push(new THREE.Vector3(fx, fy, fz));
      if (s > 0 && s < 12) {
        const bulb = new THREE.Mesh(festoonBulbGeo, festoonBulbMat);
        if (!bulb.name) bulb.name = 'courtyard.grapeVinePergola.bulb';
        bulb.position.set(fx, fy - 0.028, fz);
        pergolaGroup.add(bulb);
      }
    }
    const cordMesh = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cordPts), 24, 0.004, 5, false),
      festoonCordMat
    );
    if (!cordMesh.name) cordMesh.name = 'courtyard.grapeVinePergola.cord';
    pergolaGroup.add(cordMesh);
  }

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

  const darkPurpleGrapeMat1 = new THREE.MeshStandardMaterial({
    color: 0x221229,
    roughness: 0.32,
    metalness: 0.06,
  });
  const darkPurpleGrapeMat2 = new THREE.MeshStandardMaterial({
    color: 0x2e1736,
    roughness: 0.32,
    metalness: 0.06,
  });
  const darkPurpleGrapeMat3 = new THREE.MeshStandardMaterial({
    color: 0x180d20,
    roughness: 0.32,
    metalness: 0.06,
  });
  const darkGrapeMats: ReadonlyArray<THREE.Material> = [
    darkPurpleGrapeMat1,
    darkPurpleGrapeMat2,
    darkPurpleGrapeMat3,
  ];
  const grapePeduncleStemMat = new THREE.MeshStandardMaterial({
    color: 0x4f4428,
    roughness: 0.82,
    metalness: 0.02,
  });

  const vineTrunkPaths: ReadonlyArray<{
    readonly radius: number;
    readonly pts: ReadonlyArray<readonly [number, number, number]>;
  }> = [
    {
      radius: 0.042,
      pts: [
        [8.65, pergFloorY, 6.98],
        [8.58, pergFloorY + 0.85, 6.96],
        [8.72, pergFloorY + 1.65, 6.97],
        [8.66, pergBeamY - 0.02, 6.82],
        [8.55, pergRafterY + 0.04, 4.15],
        [8.42, pergRafterY + 0.05, 1.45],
        [8.35, pergRafterY + 0.02, -0.65],
      ],
    },
    {
      radius: 0.038,
      pts: [
        [10.65, pergFloorY, 6.98],
        [10.72, pergFloorY + 0.88, 6.96],
        [10.58, pergFloorY + 1.72, 6.97],
        [10.66, pergBeamY, 6.8],
        [10.45, pergRafterY + 0.04, 4.1],
        [10.25, pergRafterY + 0.05, 1.35],
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
    if (!trunkMesh.name) trunkMesh.name = 'courtyard.grapeVinePergola.trunk';
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
    if (!spray.name) spray.name = 'courtyard.grapeVinePergola.spray';
    spray.position.set(gx, gy, gz);
    spray.rotation.set((f3 - 0.5) * 0.55, f1 * Math.PI * 2, (f2 - 0.5) * 0.55);
    spray.scale.set(scale, scale, scale);
    spray.castShadow = true;
    spray.receiveShadow = true;
    pergolaGroup.add(spray);
  }

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
    if (!trailingSpray.name) trailingSpray.name = 'courtyard.grapeVinePergola.trailingSpray';
    trailingSpray.position.set(gx, gy, gz);
    trailingSpray.rotation.set(0.65 + f1 * 0.5, t * Math.PI * 4, (f2 - 0.5) * 0.6);
    trailingSpray.scale.set(scale, scale, scale);
    trailingSpray.castShadow = true;
    pergolaGroup.add(trailingSpray);
  }

  // Issue #17 ("More grapes, they are dark colored grapes" at `[8.275, 2.97, 8.561]`):
  // 36 full 24-berry conical pendant clusters of dark purple-black grapes across 5 tiers with woody peduncle stems!
  const grapeBerryGeo = new THREE.SphereGeometry(0.0175, 7, 7);
  const grapePeduncleGeo = new THREE.CylinderGeometry(0.0035, 0.0055, 0.085, 6);

  const addGrapeBunch = (gx: number, gy: number, gz: number, isDark = true): void => {
    const bunchGroup = new THREE.Group();
    bunchGroup.name = 'courtyard.grapeVinePergola.grapeBunch';
    bunchGroup.position.set(gx, gy, gz);

    const peduncle = new THREE.Mesh(grapePeduncleGeo, grapePeduncleStemMat);
    if (!peduncle.name) peduncle.name = 'courtyard.grapeVinePergola.peduncle';
    peduncle.position.set(0, 0.036, 0);
    bunchGroup.add(peduncle);

    const tierCounts: ReadonlyArray<number> = [7, 6, 5, 4, 2];
    const tierRadii: ReadonlyArray<number> = [0.038, 0.033, 0.026, 0.019, 0.009];
    let berryIdx = isDark ? 0 : 1;

    for (let tier = 0; tier < tierCounts.length; tier++) {
      const count = tierCounts[tier]!;
      const ringR = tierRadii[tier]!;
      const tierY = -tier * 0.024;
      for (let k = 0; k < count; k++) {
        const ang = (k / count) * Math.PI * 2 + tier * 0.68;
        const bMat = darkGrapeMats[(berryIdx + tier + k) % darkGrapeMats.length]!;
        const berry = new THREE.Mesh(grapeBerryGeo, bMat);
        if (!berry.name) berry.name = 'courtyard.grapeVinePergola.berry';
        berry.position.set(
          Math.cos(ang) * ringR,
          tierY + ((k % 2) - 0.5) * 0.004,
          Math.sin(ang) * ringR
        );
        berry.scale.set(1.0, 1.08, 1.0);
        bunchGroup.add(berry);
        berryIdx++;
      }
    }

    pergolaGroup.add(bunchGroup);
  };

  const bunchPositions: ReadonlyArray<readonly [number, number, number, boolean]> = [
    [7.25, pergBeamY - 0.11, -0.35, true],
    [8.35, pergBeamY - 0.12, -0.25, true],
    [9.55, pergBeamY - 0.10, -0.15, true],
    [10.85, pergBeamY - 0.13, 0.15, true],
    [7.45, pergBeamY - 0.12, 0.75, true],
    [8.65, pergBeamY - 0.14, 0.95, true],
    [9.95, pergBeamY - 0.11, 1.05, true],
    [11.15, pergBeamY - 0.12, 1.25, true],
    [7.85, pergBeamY - 0.12, 1.55, true],
    [9.15, pergBeamY - 0.13, 1.85, true],
    [10.35, pergBeamY - 0.12, 1.95, true],
    [7.35, pergBeamY - 0.11, 2.35, true],
    [8.45, pergBeamY - 0.14, 2.55, true],
    [9.65, pergBeamY - 0.12, 2.65, true],
    [10.95, pergBeamY - 0.13, 2.85, true],
    [7.55, pergBeamY - 0.11, 3.25, true],
    [8.25, pergBeamY - 0.12, 3.45, true],
    [8.95, pergBeamY - 0.14, 3.55, true],
    [9.85, pergBeamY - 0.11, 3.45, true],
    [10.75, pergBeamY - 0.13, 3.65, true],
    [7.65, pergBeamY - 0.12, 4.05, true],
    [8.38, pergBeamY - 0.10, 4.25, true],
    [8.88, pergBeamY - 0.13, 4.42, true],
    [9.48, pergBeamY - 0.12, 4.35, true],
    [10.25, pergBeamY - 0.14, 4.20, true],
    [11.10, pergBeamY - 0.11, 4.45, true],
    [7.48, pergBeamY - 0.13, 4.85, true],
    [8.18, pergBeamY - 0.11, 4.95, true],
    [8.68, pergBeamY - 0.12, 5.05, true],
    [9.35, pergBeamY - 0.14, 5.15, true],
    [10.65, pergBeamY - 0.13, 5.15, true],
    [7.75, pergBeamY - 0.12, 5.65, true],
    [8.55, pergBeamY - 0.11, 5.85, true],
    [9.75, pergBeamY - 0.13, 5.95, true],
    [8.85, pergBeamY - 0.12, 6.55, true],
    [10.45, pergBeamY - 0.14, 6.62, true],
  ];
  for (const [bx, by, bz, isDark] of bunchPositions) {
    addGrapeBunch(bx, by, bz, isDark);
  }

  const diningSetGroup = new THREE.Group();
  diningSetGroup.name = 'courtyard.grapeVinePergola.diningSet';
  diningSetGroup.position.set(9.35, pergFloorY, 3.55);

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
    if (!slat.name) slat.name = 'courtyard.grapeVinePergola.slat';
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
    if (!sideApron.name) sideApron.name = 'courtyard.grapeVinePergola.sideApron';
    sideApron.position.set(sideX, tableH - 0.055, 0);
    sideApron.castShadow = true;
    diningSetGroup.add(sideApron);
  }
  for (const endZ of [-tableD / 2 + 0.04, tableD / 2 - 0.04]) {
    const endApron = new THREE.Mesh(
      new THREE.BoxGeometry(tableW - 0.12, 0.075, 0.032),
      pergolaTeakMat
    );
    if (!endApron.name) endApron.name = 'courtyard.grapeVinePergola.endApron';
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
      if (!leg.name) leg.name = 'courtyard.grapeVinePergola.leg';
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
    if (!seat.name) seat.name = 'courtyard.grapeVinePergola.seat';
    seat.position.set(0, 0.45, 0);
    seat.castShadow = true;
    seat.receiveShadow = true;
    chair.add(seat);

    const crestRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.54, 0.055, 0.032),
      pergolaTeakMat
    );
    if (!crestRail.name) crestRail.name = 'courtyard.grapeVinePergola.crestRail';
    crestRail.position.set(0, 0.88, -0.22);
    crestRail.castShadow = true;
    chair.add(crestRail);

    for (let b = -3; b <= 3; b++) {
      const backSlat = new THREE.Mesh(
        new THREE.BoxGeometry(0.042, 0.4, 0.018),
        pergolaTeakMat
      );
      if (!backSlat.name) backSlat.name = 'courtyard.grapeVinePergola.backSlat';
      backSlat.position.set(b * 0.068, 0.66, -0.22);
      backSlat.castShadow = true;
      chair.add(backSlat);
    }

    for (const sx of [-0.24, 0.24]) {
      const fLeg = new THREE.Mesh(
        new THREE.BoxGeometry(0.042, 0.64, 0.042),
        pergolaTeakMat
      );
      if (!fLeg.name) fLeg.name = 'courtyard.grapeVinePergola.fLeg';
      fLeg.position.set(sx, 0.32, 0.21);
      fLeg.castShadow = true;
      chair.add(fLeg);

      const rLeg = new THREE.Mesh(
        new THREE.BoxGeometry(0.042, 0.9, 0.042),
        pergolaTeakMat
      );
      if (!rLeg.name) rLeg.name = 'courtyard.grapeVinePergola.rLeg';
      rLeg.position.set(sx, 0.45, -0.22);
      rLeg.castShadow = true;
      chair.add(rLeg);

      const arm = new THREE.Mesh(
        new THREE.BoxGeometry(0.052, 0.03, 0.48),
        pergolaTeakMat
      );
      if (!arm.name) arm.name = 'courtyard.grapeVinePergola.arm';
      arm.position.set(sx, 0.64, 0.0);
      arm.castShadow = true;
      chair.add(arm);
    }

    diningSetGroup.add(chair);
  }

  pergolaGroup.add(diningSetGroup);
  scene.add(pergolaGroup);

  return {
    pergMaxX,
    pergMinZ,
    pergMaxZ,
    dryStoneWallMat,
    dryStoneCopingMat,
    applyDryStoneWallUVs,
    addDryStoneReliefCourses,
    grapeSunlitGreenMat,
  };
}
