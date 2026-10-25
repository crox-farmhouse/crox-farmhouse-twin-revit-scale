import * as THREE from 'three';
import type { PatioAndGrapeVinePergolaKit } from '../patio-and-grape-vine-pergola.ts';
import type { GrapeVinePergolaKit } from './grape-vine-pergola.ts';
import type { BotanicalShrubKit } from './patio-textures-and-shrubs.ts';
import type {
  LowBrickRetainingWallKit,
  RaisedFlagstonePatioKit,
} from './raised-flagstone-patio.ts';

export function buildWalledVegetableGarden(
  scene: THREE.Scene,
  kit: PatioAndGrapeVinePergolaKit,
  retainingWallKit: LowBrickRetainingWallKit,
  shrubKit: BotanicalShrubKit,
  flagstonePatioKit: RaisedFlagstonePatioKit,
  pergolaKit: GrapeVinePergolaKit
): void {
  const { structuralOakMat, glassMat } = kit;
  const { brickWallMat, applyCourtyardBrickUVs, weatheredBenchMat } = retainingWallKit;
  const { soilMat, deepGreenFoliageMat, brightShrubGreenMat, botanicalLobeGeos } = shrubKit;
  const { potMat } = flagstonePatioKit;
  const {
    pergMaxX,
    pergMinZ,
    pergMaxZ,
    dryStoneWallMat,
    dryStoneCopingMat,
    applyDryStoneWallUVs,
    addDryStoneReliefCourses,
    grapeSunlitGreenMat,
  } = pergolaKit;

  // =========================================================================
  // 7. WALLED VEGETABLE GARDEN & GLAZED GREENHOUSE EAST OF THE PERGOLA
  //    - Issue #14 ("Fix thiis texture" at `[11.845, 0.882, 11.281]`):
  //      Converted the Vegetable Garden perimeter walls (`vegSouthWall`, `vegNorthWall`, `vegEastWall`)
  //      and coping stones to `dryStoneWallMat` / `dryStoneCopingMat` with `applyDryStoneWallUVs` on EVERY mesh!
  //    - Issue #15 ("Fix the join on this corner" at `[16.857, 0.478, 11.745]`):
  //      Fixed the SE corner `(17.65, 7.20)` and NE corner `(17.65, -0.95)` wall & coping spans so they meet
  //      in a clean, flush, zero-overlap corner join, plus dressed dry-stone corner quoin piers!
  // =========================================================================
  const vegGardenGroup = new THREE.Group();
  vegGardenGroup.name = 'courtyard.vegetableGardenAndGreenhouse';
  // Survey2Plan Floor 1906995: East Walled Garden raised terrace at +0.710m above Kitchen FFL!
  const vegFloorY = 0.71;
  vegGardenGroup.position.y = vegFloorY;

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

  const vegWestX = pergMaxX; // 11.85m
  const vegEastX = 17.65;
  const vegNorthZ = pergMinZ; // -0.95m
  const vegSouthZ = pergMaxZ; // +7.20m
  const vegSpanZ = vegSouthZ - vegNorthZ; // 8.15m
  const vegMidZ = (vegNorthZ + vegSouthZ) * 0.5; // +3.125m

  // Continuous dry-stone retaining plinth (`y = -0.880..-0.084m` local -> `-0.170..+0.626m` world)
  // grounding the +0.710m raised East Walled Garden cleanly below the gravel pad and East of the Pergola wall!
  const plinthStartX = vegWestX + 0.15;
  const plinthEndX = vegEastX + 0.2;
  const plinthSpanX = plinthEndX - plinthStartX;
  const plinthCenterX = (plinthStartX + plinthEndX) * 0.5;
  const vegRetainingPlinth = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(plinthSpanX, 0.796, vegSpanZ + 0.28),
      plinthCenterX,
      vegFloorY - 0.482,
      vegMidZ
    ),
    dryStoneWallMat
  );
  vegRetainingPlinth.name = 'courtyard.vegetableGarden.retainingPlinth';
  vegRetainingPlinth.position.set(plinthCenterX, -0.482, vegMidZ);
  vegRetainingPlinth.castShadow = true;
  vegRetainingPlinth.receiveShadow = true;
  vegGardenGroup.add(vegRetainingPlinth);

  const gravelStartX = vegWestX + 0.15;
  const gravelEndX = vegEastX - 0.125;
  const vegGardenGravelPad = new THREE.Mesh(
    new THREE.BoxGeometry(gravelEndX - gravelStartX, 0.08, vegSpanZ - 0.25),
    gravelPathMat
  );
  vegGardenGravelPad.name = 'courtyard.vegetableGarden.gravelFloor';
  vegGardenGravelPad.position.set((gravelStartX + gravelEndX) * 0.5, -0.04, vegMidZ);
  vegGardenGravelPad.receiveShadow = true;
  vegGardenGroup.add(vegGardenGravelPad);

  const horizWallStartX = vegWestX + 0.175; // 12.025m (5mm East of Pergola coping)
  const horizWallEndX = vegEastX - 0.154; // 17.496m (4mm West of corner quoin pier)
  const horizLenX = horizWallEndX - horizWallStartX;
  const horizCenterX = (horizWallStartX + horizWallEndX) * 0.5;
  const northWallH = 1.95;
  const southEastWallH = 0.96;

  const vegNorthWall = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(horizLenX, northWallH, 0.24),
      horizCenterX,
      northWallH * 0.5,
      vegNorthZ
    ),
    dryStoneWallMat
  );
  vegNorthWall.name = 'courtyard.vegetableGarden.northWall';
  vegNorthWall.position.set(horizCenterX, northWallH * 0.5, vegNorthZ);
  vegNorthWall.castShadow = true;
  vegNorthWall.receiveShadow = true;
  vegGardenGroup.add(vegNorthWall);

  const vegNorthCoping = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(horizLenX, 0.055, 0.30),
      horizCenterX,
      northWallH + 0.0315,
      vegNorthZ
    ),
    dryStoneCopingMat
  );
  if (!vegNorthCoping.name) vegNorthCoping.name = 'courtyard.vegetableGarden.vegNorthCoping';
  vegNorthCoping.position.set(horizCenterX, northWallH + 0.0315, vegNorthZ);
  vegNorthCoping.castShadow = true;
  vegGardenGroup.add(vegNorthCoping);

  const vegSouthWall = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(horizLenX, southEastWallH, 0.24),
      horizCenterX,
      southEastWallH * 0.5,
      vegSouthZ
    ),
    dryStoneWallMat
  );
  vegSouthWall.name = 'courtyard.vegetableGarden.southWall';
  vegSouthWall.position.set(horizCenterX, southEastWallH * 0.5, vegSouthZ);
  vegSouthWall.castShadow = true;
  vegSouthWall.receiveShadow = true;
  vegGardenGroup.add(vegSouthWall);

  const vegSouthCoping = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(horizLenX, 0.055, 0.30),
      horizCenterX,
      southEastWallH + 0.0315,
      vegSouthZ
    ),
    dryStoneCopingMat
  );
  if (!vegSouthCoping.name) vegSouthCoping.name = 'courtyard.vegetableGarden.vegSouthCoping';
  vegSouthCoping.position.set(horizCenterX, southEastWallH + 0.0315, vegSouthZ);
  vegSouthCoping.castShadow = true;
  vegGardenGroup.add(vegSouthCoping);

  addDryStoneReliefCourses(
    vegGardenGroup,
    'x',
    horizWallStartX + 0.06,
    vegEastX - 0.18,
    vegSouthZ,
    0.24,
    0.08,
    southEastWallH,
    73
  );

  const eastLenZ = (vegSouthZ - 0.154) - (vegNorthZ + 0.154);
  const vegEastWall = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(0.24, southEastWallH, eastLenZ),
      vegEastX,
      southEastWallH * 0.5,
      vegMidZ
    ),
    dryStoneWallMat
  );
  vegEastWall.name = 'courtyard.vegetableGarden.eastWall';
  vegEastWall.position.set(vegEastX, southEastWallH * 0.5, vegMidZ);
  vegEastWall.castShadow = true;
  vegEastWall.receiveShadow = true;
  vegGardenGroup.add(vegEastWall);

  const eastCopingLenZ = eastLenZ;
  const vegEastCoping = new THREE.Mesh(
    applyDryStoneWallUVs(
      new THREE.BoxGeometry(0.30, 0.055, eastCopingLenZ),
      vegEastX,
      southEastWallH + 0.0315,
      vegMidZ
    ),
    dryStoneCopingMat
  );
  if (!vegEastCoping.name) vegEastCoping.name = 'courtyard.vegetableGarden.vegEastCoping';
  vegEastCoping.position.set(vegEastX, southEastWallH + 0.0315, vegMidZ);
  vegEastCoping.castShadow = true;
  vegGardenGroup.add(vegEastCoping);

  addDryStoneReliefCourses(
    vegGardenGroup,
    'z',
    vegNorthZ + 0.22,
    vegSouthZ - 0.22,
    vegEastX,
    0.24,
    0.08,
    southEastWallH,
    89
  );

  for (const [qx, qz, qh] of [
    [vegEastX, vegSouthZ, 1.12],
    [vegEastX, vegNorthZ, 2.04],
  ] as const) {
    const quoinPier = new THREE.Mesh(
      applyDryStoneWallUVs(new THREE.BoxGeometry(0.30, qh, 0.30), qx, qh * 0.5, qz),
      dryStoneWallMat
    );
    quoinPier.name = 'courtyard.vegetableGarden.cornerQuoinPier';
    quoinPier.position.set(qx, qh * 0.5, qz);
    quoinPier.castShadow = true;
    quoinPier.receiveShadow = true;
    vegGardenGroup.add(quoinPier);

    const quoinCap = new THREE.Mesh(
      applyDryStoneWallUVs(new THREE.BoxGeometry(0.36, 0.065, 0.36), qx, qh + 0.0365, qz),
      dryStoneCopingMat
    );
    if (!quoinCap.name) quoinCap.name = 'courtyard.vegetableGarden.quoinCap';
    quoinCap.position.set(qx, qh + 0.0365, qz);
    quoinCap.castShadow = true;
    vegGardenGroup.add(quoinCap);
  }

  const greenhouseGroup = new THREE.Group();
  greenhouseGroup.name = 'courtyard.greenhouse';
  greenhouseGroup.position.set(15.85, 0.004, 2.17);
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

  for (const [bx, bz, bw, bd] of [
    [-ghHalfW, 0, 0.12, ghD],
    [ghHalfW, 0, 0.12, ghD],
    [0, -ghD * 0.5, ghW - 0.128, 0.12],
    [-0.818, ghD * 0.5, 0.836, 0.12],
    [0.818, ghD * 0.5, 0.836, 0.12],
  ] as const) {
    const dwarfBase = new THREE.Mesh(
      applyCourtyardBrickUVs(new THREE.BoxGeometry(bw, ghBrickH, bd), bx, ghBrickH * 0.5, bz),
      brickWallMat
    );
    if (!dwarfBase.name) dwarfBase.name = 'courtyard.vegetableGarden.dwarfBase';
    dwarfBase.position.set(bx, ghBrickH * 0.5, bz);
    dwarfBase.castShadow = true;
    dwarfBase.receiveShadow = true;
    greenhouseGroup.add(dwarfBase);
  }

  const ghWallGlassH = ghEaveH - ghBrickH;
  const ghSideClearH = ghWallGlassH - 0.028;
  const ghSideMidY = ghBrickH + 0.004 + ghSideClearH * 0.5;
  for (const sideX of [-1, 1]) {
    const sideGlass = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, ghSideClearH, ghD - 0.08),
      glassMat
    );
    if (!sideGlass.name) sideGlass.name = 'courtyard.vegetableGarden.sideGlass';
    sideGlass.position.set(sideX * ghHalfW, ghSideMidY, 0);
    greenhouseGroup.add(sideGlass);

    const eaveBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.04, ghD + 0.04),
      aluminumFrameMat
    );
    if (!eaveBar.name) eaveBar.name = 'courtyard.vegetableGarden.eaveBar';
    eaveBar.position.set(sideX * ghHalfW, ghEaveH, 0);
    greenhouseGroup.add(eaveBar);

    for (let gz = -ghD * 0.5; gz <= ghD * 0.5 + 0.01; gz += 0.64) {
      const mullion = new THREE.Mesh(
        new THREE.BoxGeometry(0.032, ghSideClearH, 0.032),
        aluminumFrameMat
      );
      if (!mullion.name) mullion.name = 'courtyard.vegetableGarden.mullion';
      mullion.position.set(sideX * ghHalfW, ghSideMidY, gz);
      greenhouseGroup.add(mullion);
    }

    const roofGlass = new THREE.Mesh(
      new THREE.BoxGeometry(ghSlopeLen - 0.06, 0.014, ghD - 0.06),
      glassMat
    );
    if (!roofGlass.name) roofGlass.name = 'courtyard.vegetableGarden.roofGlass';
    roofGlass.position.set(
      sideX * (ghHalfW * 0.5),
      ghEaveH + ghSlopeRise * 0.5,
      0
    );
    roofGlass.rotation.z = -sideX * ghPitch;
    greenhouseGroup.add(roofGlass);

    for (let gz = -ghD * 0.5; gz <= ghD * 0.5 + 0.01; gz += 0.64) {
      const roofBar = new THREE.Mesh(
        new THREE.BoxGeometry(ghSlopeLen - 0.02, 0.032, 0.032),
        aluminumFrameMat
      );
      if (!roofBar.name) roofBar.name = 'courtyard.vegetableGarden.roofBar';
      roofBar.position.set(
        sideX * (ghHalfW * 0.5),
        ghEaveH + ghSlopeRise * 0.5,
        gz
      );
      roofBar.rotation.z = -sideX * ghPitch;
      greenhouseGroup.add(roofBar);
    }
  }

  const ghRidgeBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.055, ghD + 0.06),
    aluminumFrameMat
  );
  if (!ghRidgeBar.name) ghRidgeBar.name = 'courtyard.vegetableGarden.ghRidgeBar';
  ghRidgeBar.position.set(0, ghRidgeH + 0.012, 0);
  greenhouseGroup.add(ghRidgeBar);

  for (const endZ of [-ghD * 0.5, ghD * 0.5]) {
    const endGlass = new THREE.Mesh(
      new THREE.BoxGeometry(ghW - 0.14, ghSideClearH, 0.014),
      glassMat
    );
    if (!endGlass.name) endGlass.name = 'courtyard.vegetableGarden.endGlass';
    endGlass.position.set(0, ghSideMidY, endZ);
    greenhouseGroup.add(endGlass);

    for (const gx of [-0.65, -0.36, 0.36, 0.65]) {
      const isDoorStile = endZ > 0 && Math.abs(gx) < 0.5;
      const stileBot = isDoorStile ? 0.0 : ghBrickH + 0.004;
      const stileTop = ghEaveH - 0.024;
      const stileH = stileTop - stileBot;
      const stile = new THREE.Mesh(
        new THREE.BoxGeometry(0.032, stileH, 0.036),
        aluminumFrameMat
      );
      if (!stile.name) stile.name = 'courtyard.vegetableGarden.stile';
      stile.position.set(gx, (stileBot + stileTop) * 0.5, endZ);
      greenhouseGroup.add(stile);
    }
  }

  for (const sideX of [-0.88, 0.88]) {
    const stagingBench = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.035, ghD - 0.32),
      weatheredBenchMat
    );
    if (!stagingBench.name) stagingBench.name = 'courtyard.vegetableGarden.stagingBench';
    stagingBench.position.set(sideX, 0.78, 0);
    greenhouseGroup.add(stagingBench);

    for (let pz = -1.1; pz <= 1.1; pz += 0.55) {
      const ghPot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11, 0.08, 0.18, 10),
        potMat
      );
      if (!ghPot.name) ghPot.name = 'courtyard.vegetableGarden.ghPot';
      ghPot.position.set(sideX, 0.892, pz);
      greenhouseGroup.add(ghPot);

      const tomatoFoliage = new THREE.Mesh(botanicalLobeGeos[1]!, brightShrubGreenMat);
      if (!tomatoFoliage.name) tomatoFoliage.name = 'courtyard.vegetableGarden.tomatoFoliage';
      tomatoFoliage.scale.set(0.18, 0.28, 0.18);
      tomatoFoliage.position.set(sideX, 1.12, pz);
      greenhouseGroup.add(tomatoFoliage);
    }
  }

  vegGardenGroup.add(greenhouseGroup);

  const bedW = 1.65;
  const bedD = 1.35;
  const bedH = 0.32;
  const vegBedCenters: ReadonlyArray<readonly [number, number, boolean]> = [
    [13.15, 0.15, false],
    [13.15, 2.05, true],
    [13.15, 4.10, false],
    [15.85, 4.35, true],
    [13.15, 5.95, true],
    [15.85, 5.95, false],
  ];

  for (const [bx, bz, hasBeanWigwam] of vegBedCenters) {
    const bedGroup = new THREE.Group();
    bedGroup.position.set(bx, 0.004, bz);

    for (const sz of [-bedD * 0.5 + 0.05, bedD * 0.5 - 0.05]) {
      const sleeperFB = new THREE.Mesh(
        new THREE.BoxGeometry(bedW, bedH, 0.1),
        structuralOakMat
      );
      if (!sleeperFB.name) sleeperFB.name = 'courtyard.vegetableGarden.sleeperFB';
      sleeperFB.position.set(0, bedH * 0.5, sz);
      sleeperFB.castShadow = true;
      sleeperFB.receiveShadow = true;
      bedGroup.add(sleeperFB);
    }
    for (const sx of [-bedW * 0.5 + 0.05, bedW * 0.5 - 0.05]) {
      const sleeperLR = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, bedH - 0.008, bedD - 0.208),
        structuralOakMat
      );
      if (!sleeperLR.name) sleeperLR.name = 'courtyard.vegetableGarden.sleeperLR';
      sleeperLR.position.set(sx, bedH * 0.5, 0);
      sleeperLR.castShadow = true;
      sleeperLR.receiveShadow = true;
      bedGroup.add(sleeperLR);
    }

    const soilFillH = bedH - 0.048;
    const soilFill = new THREE.Mesh(
      new THREE.BoxGeometry(bedW - 0.208, soilFillH, bedD - 0.208),
      soilMat
    );
    if (!soilFill.name) soilFill.name = 'courtyard.vegetableGarden.soilFill';
    soilFill.position.set(0, 0.004 + soilFillH * 0.5, 0);
    soilFill.receiveShadow = true;
    bedGroup.add(soilFill);

    for (const rx of [-0.46, 0.0, 0.46]) {
      for (const rz of [-0.36, 0.0, 0.36]) {
        const lobeIdx = Math.abs(Math.round((rx + rz) * 10)) % botanicalLobeGeos.length;
        const cropMound = new THREE.Mesh(
          botanicalLobeGeos[lobeIdx]!,
          (lobeIdx & 1) === 0 ? brightShrubGreenMat : deepGreenFoliageMat
        );
        if (!cropMound.name) cropMound.name = 'courtyard.vegetableGarden.cropMound';
        cropMound.scale.set(0.21, 0.16, 0.21);
        cropMound.position.set(rx, bedH + 0.08, rz);
        cropMound.castShadow = true;
        bedGroup.add(cropMound);
      }
    }

    if (hasBeanWigwam) {
      for (let c = 0; c < 6; c++) {
        const ang = (c / 6) * Math.PI * 2;
        const cane = new THREE.Mesh(
          new THREE.CylinderGeometry(0.01, 0.014, 1.55, 6),
          weatheredBenchMat
        );
        if (!cane.name) cane.name = 'courtyard.vegetableGarden.cane';
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
      if (!vineClimber.name) vineClimber.name = 'courtyard.vegetableGarden.vineClimber';
      vineClimber.position.set(0, bedH + 0.62, 0);
      vineClimber.castShadow = true;
      bedGroup.add(vineClimber);
    }

    vegGardenGroup.add(bedGroup);
  }

  scene.add(vegGardenGroup);
}
