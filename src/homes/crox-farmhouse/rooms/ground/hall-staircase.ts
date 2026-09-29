import * as THREE from 'three';
import { buildSweptMouldingGeometry, createSkirtingCapProfile } from '../../../../engine/geometry/swept-moulding.ts';
import { buildUnderstairsHeatingManifold } from '../../../../objects/fixtures/hydronic-manifold.ts';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import type { createGroundFloorMaterials } from '../../structure/ground-floor-materials.ts';
import type { createGroundFloorShellKit } from '../../structure/ground-floor-shell-kit.ts';
import type { buildDiningRoom } from './dining-room.ts';
import type { buildHall } from './hall.ts';

/**
 * Quarter-turn oak staircase, balustrades and hanging newel in the Stair Hall.
 *
 * Extracted verbatim from `buildMainHouseGroundFloorRooms` (ground-floor-rooms.ts). Statement order and
 * geometry are unchanged; shared locals flow in via `kit` and out via the return value.
 */
export function buildHallStaircase(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createGroundFloorMaterials>, 'antiqueOakSkirtingMat' | 'brassMat' | 'castIronMat' | 'exteriorBrickMat' | 'oakMat' | 'skirtingMat' | 'tagCutawayWall' | 'wallH' | 'warmRoomPlasterMat'> &
    Pick<ReturnType<typeof createGroundFloorShellKit>, 'applyWorldSpaceBrickUVs'> &
    Pick<ReturnType<typeof buildDiningRoom>, 'lowerFloorY'> &
    Pick<ReturnType<typeof buildHall>, 'hallFrontRoomCrossWallFrame'>
) {
  const { groundFloorCeilingGroup, interactions, lightGroups, scene } = ctx;
  const {
    antiqueOakSkirtingMat,
    applyWorldSpaceBrickUVs,
    brassMat,
    castIronMat,
    exteriorBrickMat,
    hallFrontRoomCrossWallFrame,
    lowerFloorY,
    oakMat,
    skirtingMat,
    tagCutawayWall,
    wallH,
    warmRoomPlasterMat,
  } = kit;
  // (Neptune Wycombe Dining Table moved to Dining Room `familyRoom` per Issue #2)

  // =========================================================================
  // QUARTER-TURN STAIRCASE IN ENTRANCE HALL (PH-47 & PH-48 — media_1790506616992.png)
  // Photo-accurate geometry in the NW corner of Hall (X = -17.48m..-15.36m, Z = -2.50m..-0.36m):
  // - Lower flight (X = -17.48m..-16.64m): 6 risers climbing North (-Z) from Y = -0.30m to NW Quarter Landing (Y = +0.84m)
  //   * Step 1 (Z = -0.36m..-0.58m) is a wide curtail/bullnose bottom step projecting in front of and wrapping
  //     around the square white Bottom Newel Post (X = -16.64m, Z = -0.54m)
  //   * Steps 2..5 (Z = -0.58m..-1.62m) climb beside the sloped white closed stringer + 7 square balusters + parallel handrail
  //   * Step 6 is the NW Quarter-Space Landing (X = -17.48m..-16.64m, Z = -1.62m..-2.50m, top Y = +0.84m)
  // - Vertically-boarded white T&G spandrel wall on the East (+X = -16.64m) face of the lower flight & quarter landing,
  //   with the small white vertically-boarded cottage under-stairs cupboard door at Z = -1.72m..-2.36m (behind left armchair)
  // - Corner Newel Post at (X = -16.64m, Z = -1.62m, Y = +0.62m..+1.64m) where the Lower Handrail terminates and the
  //   Upper Handrail begins just below the flat square newel cap!
  // - Upper flight (X = -16.64m..-15.36m, Z = -2.49m..-1.65m): watertight extruded stair carriage + smooth white plaster
  //   soffit climbing East (+X) from the Quarter Landing (Y = +0.84m) into the First Floor stairwell trimmer at X = -15.36m
  // - 100% Parallel Upper Stringer & Upper Handrail along Z = -1.64m with uniform-height vertical square balusters,
  //   both framing cleanly into the vertical Hanging Newel Post (X = -15.50m, Y = +1.28m..+2.06m) below the ceiling!
  // - Polygonal exposed red brick strictly ABOVE the quarter landing & upper flight (100% smooth plaster below the stairs!)
  // =========================================================================
  const stairGroup = new THREE.Group();
  stairGroup.name = 'hall.stairs';

  // Shared recessed warm LED step light (aged-brass micro-louver bezel + eyelid hood + diffuser), on the hall
  // KNX circuit. `outSign` is the local Z direction the fitting faces out of its stringer board.
  const stepLightLensMat = new THREE.MeshStandardMaterial({
    color: 0xf5e1ba,
    emissive: 0xffa838,
    emissiveIntensity: 1.5,
    roughness: 0.35,
  });
  stepLightLensMat.userData.baseEmissiveIntensity = 1.5;
  lightGroups.hallPendant.emissives.push(stepLightLensMat);
  const buildStepLightUnit = (
    name: string,
    x: number,
    y: number,
    z: number,
    outSign: 1 | -1
  ): THREE.Group => {
    const unit = new THREE.Group();
    unit.name = name;
    unit.position.set(x, y, z);

    // Aged-brass rectangular micro-louver step light bezel (58mm wide x 42mm high)
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.042, 0.008), brassMat);
    bezel.castShadow = true;
    unit.add(bezel);

    // Angled brass eyelid hood shielding upward glare and directing warm light across the tread
    const hood = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.014, 0.014), brassMat);
    hood.position.set(0, 0.01, outSign * 0.005);
    hood.rotation.x = -outSign * 0.28;
    unit.add(hood);

    // Warm LED diffuser window
    const lens = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.022, 0.006), stepLightLensMat);
    lens.name = `${name}.lens`;
    lens.position.set(0, -0.004, outSign * 0.003);
    unit.add(lens);

    ctx.interactions.registerLightFixture(unit, 'hallPendant');
    return unit;
  };

  // Issue #16: Woven Herringbone Wool/Sisal Stair Runner Carpet texture with contrast whipped border binding
  const runnerCanvas = document.createElement('canvas');
  runnerCanvas.width = 256;
  runnerCanvas.height = 256;
  const rCtx = runnerCanvas.getContext('2d');
  if (rCtx) {
    rCtx.fillStyle = '#cfc6b8';
    rCtx.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 4) {
      for (let x = 0; x < 256; x += 8) {
        const zig = ((x / 8 + Math.floor(y / 16)) & 1) === 0;
        rCtx.fillStyle = zig ? '#c2b7a6' : '#dad2c5';
        rCtx.fillRect(x, y, 6, 3);
      }
    }
  }
  const runnerTex = new THREE.CanvasTexture(runnerCanvas);
  runnerTex.wrapS = THREE.RepeatWrapping;
  runnerTex.wrapT = THREE.RepeatWrapping;
  runnerTex.repeat.set(4, 12);
  runnerTex.colorSpace = THREE.SRGBColorSpace;

  const stairCarpetMat = new THREE.MeshStandardMaterial({
    map: runnerTex,
    color: 0xd8d0c5, // Warm oatmeal herringbone woven runner carpet (Issue #16)
    roughness: 0.9,
  });
  const stairRunnerBorderMat = new THREE.MeshStandardMaterial({
    color: 0x3d352e, // Dark charcoal-umber cotton tape border binding along both edges of the runner
    roughness: 0.85,
  });

  const lowerRiserH = 0.19; // 6 risers * 0.19m = 1.14m (from lowerFloorY = -0.30m to quarterLandingY = +0.84m)
  const quarterLandingY = lowerFloorY + 6 * lowerRiserH; // +0.84m (1.14m above the -0.30m Hall floor)
  const runnerW = 0.52; // Central runner width (leaving exposed antique oak margins on both sides)
  const runnerBorderW = 0.024;
  const lowerRunnerCenterX = -17.08;

  // 1A. Step 1: Wide Bullnose / Curtail Bottom Step in front of the Bottom Newel Post (Z = -0.36m..-0.58m, Y = -0.30m..-0.11m)
  const step1TopY = lowerFloorY + lowerRiserH; // -0.11m
  const step1Carriage = new THREE.Mesh(
    new THREE.BoxGeometry(0.94, lowerRiserH - 0.026, 0.22),
    skirtingMat
  );
  step1Carriage.position.set(-17.08, lowerFloorY + (lowerRiserH - 0.026) * 0.5, -0.47);
  step1Carriage.castShadow = true;
  step1Carriage.receiveShadow = true;
  stairGroup.add(step1Carriage);

  const step1Tread = new THREE.Mesh(
    new THREE.BoxGeometry(0.96, 0.028, 0.24),
    antiqueOakSkirtingMat
  );
  step1Tread.position.set(-17.08, step1TopY - 0.014, -0.46);
  step1Tread.castShadow = true;
  step1Tread.receiveShadow = true;
  stairGroup.add(step1Tread);

  // Curved Bullnose Right End on Step 1 wrapping around the East side of the Bottom Newel Post (X = -16.61m, Z = -0.47m)
  const bullnoseRiser = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.11, lowerRiserH - 0.026, 20),
    skirtingMat
  );
  bullnoseRiser.position.set(-16.61, lowerFloorY + (lowerRiserH - 0.026) * 0.5, -0.47);
  bullnoseRiser.castShadow = true;
  bullnoseRiser.receiveShadow = true;
  stairGroup.add(bullnoseRiser);

  const bullnoseTreadCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.122, 0.122, 0.028, 20),
    antiqueOakSkirtingMat
  );
  bullnoseTreadCap.position.set(-16.61, step1TopY - 0.014, -0.46);
  bullnoseTreadCap.castShadow = true;
  bullnoseTreadCap.receiveShadow = true;
  stairGroup.add(bullnoseTreadCap);

  // Step 1 Central Runner Carpet (tread + riser + border binding + brass stair rod at base of Step 2 riser)
  const step1RunnerTread = new THREE.Mesh(
    new THREE.BoxGeometry(runnerW, 0.008, 0.244),
    stairCarpetMat
  );
  step1RunnerTread.name = 'hall.stairs.runner.step1Tread';
  step1RunnerTread.position.set(lowerRunnerCenterX, step1TopY + 0.004, -0.46);
  step1RunnerTread.receiveShadow = true;
  stairGroup.add(step1RunnerTread);

  const step1RunnerRiser = new THREE.Mesh(
    new THREE.BoxGeometry(runnerW, lowerRiserH, 0.008),
    stairCarpetMat
  );
  step1RunnerRiser.name = 'hall.stairs.runner.step1Riser';
  step1RunnerRiser.position.set(lowerRunnerCenterX, lowerFloorY + lowerRiserH * 0.5, -0.356);
  step1RunnerRiser.receiveShadow = true;
  stairGroup.add(step1RunnerRiser);

  for (const side of [-1, 1] as const) {
    const borderX = lowerRunnerCenterX + side * (runnerW * 0.5 + runnerBorderW * 0.5);
    const borderTread = new THREE.Mesh(
      new THREE.BoxGeometry(runnerBorderW, 0.009, 0.246),
      stairRunnerBorderMat
    );
    borderTread.position.set(borderX, step1TopY + 0.0045, -0.46);
    stairGroup.add(borderTread);

    const borderRiser = new THREE.Mesh(
      new THREE.BoxGeometry(runnerBorderW, lowerRiserH, 0.009),
      stairRunnerBorderMat
    );
    borderRiser.position.set(borderX, lowerFloorY + lowerRiserH * 0.5, -0.355);
    stairGroup.add(borderRiser);
  }

  // 1B. Steps 2..5: 4 Straight Oak-Treaded Risers with Central Runner Carpet climbing North (-Z) from Z = -0.58m to Z = -1.62m
  const lowerFlightTreadDepth = 0.26; // 4 * 0.26m = 1.04m (from Z = -0.58m to Z = -1.62m)
  for (let s = 1; s < 5; s++) {
    const stepTopY = lowerFloorY + (s + 1) * lowerRiserH;
    const stepBotY = lowerFloorY + s * lowerRiserH;
    const stepCenterZ = -0.58 - (s - 0.5) * lowerFlightTreadDepth;
    const riserFaceZ = -0.58 - (s - 1) * lowerFlightTreadDepth;
    const stepW = 0.88; // X = -17.55m..-16.67m
    const stepCenterX = -17.55 + stepW * 0.5; // -17.11m

    const riserCarriage = new THREE.Mesh(
      new THREE.BoxGeometry(stepW, stepTopY - lowerFloorY - 0.026, lowerFlightTreadDepth),
      skirtingMat
    );
    riserCarriage.position.set(
      stepCenterX,
      (lowerFloorY + stepTopY - 0.026) * 0.5,
      stepCenterZ
    );
    riserCarriage.castShadow = true;
    riserCarriage.receiveShadow = true;
    stairGroup.add(riserCarriage);

    const oakTread = new THREE.Mesh(
      new THREE.BoxGeometry(stepW, 0.028, lowerFlightTreadDepth + 0.02),
      antiqueOakSkirtingMat
    );
    oakTread.position.set(stepCenterX, stepTopY - 0.014, stepCenterZ + 0.008);
    oakTread.castShadow = true;
    oakTread.receiveShadow = true;
    stairGroup.add(oakTread);

    // Central Runner Carpet on Riser + Tread (Issue #16)
    const runnerRiser = new THREE.Mesh(
      new THREE.BoxGeometry(runnerW, lowerRiserH, 0.008),
      stairCarpetMat
    );
    runnerRiser.name = `hall.stairs.runner.step${s + 1}Riser`;
    runnerRiser.position.set(lowerRunnerCenterX, stepBotY + lowerRiserH * 0.5, riserFaceZ + 0.004);
    runnerRiser.receiveShadow = true;
    stairGroup.add(runnerRiser);

    const runnerTread = new THREE.Mesh(
      new THREE.BoxGeometry(runnerW, 0.008, lowerFlightTreadDepth + 0.024),
      stairCarpetMat
    );
    runnerTread.name = `hall.stairs.runner.step${s + 1}Tread`;
    runnerTread.position.set(lowerRunnerCenterX, stepTopY + 0.004, stepCenterZ + 0.008);
    runnerTread.receiveShadow = true;
    stairGroup.add(runnerTread);

    for (const side of [-1, 1] as const) {
      const borderX = lowerRunnerCenterX + side * (runnerW * 0.5 + runnerBorderW * 0.5);
      const borderRiser = new THREE.Mesh(
        new THREE.BoxGeometry(runnerBorderW, lowerRiserH, 0.009),
        stairRunnerBorderMat
      );
      borderRiser.position.set(borderX, stepBotY + lowerRiserH * 0.5, riserFaceZ + 0.0045);
      stairGroup.add(borderRiser);

      const borderTread = new THREE.Mesh(
        new THREE.BoxGeometry(runnerBorderW, 0.009, lowerFlightTreadDepth + 0.024),
        stairRunnerBorderMat
      );
      borderTread.position.set(borderX, stepTopY + 0.0045, stepCenterZ + 0.008);
      stairGroup.add(borderTread);
    }

    // Antique Brass Stair Rod in the riser crease
    const stairRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0055, 0.0055, runnerW + runnerBorderW * 2 + 0.05, 12),
      brassMat
    );
    stairRod.name = `hall.stairs.stairRod.${s}`;
    stairRod.rotation.z = Math.PI * 0.5;
    stairRod.position.set(lowerRunnerCenterX, stepBotY + 0.012, riserFaceZ + 0.012);
    stairRod.castShadow = true;
    stairGroup.add(stairRod);
  }

  // 1C. Step 6 / NW Quarter-Turn Landing in the NW corner (X = -17.55m..-16.66m, Z = -1.62m..-2.50m, top Y = +0.84m)
  //     Hollowed inside to form the Understairs Service Cupboard housing the Secondary 8-Port UFH Manifold (`hall.understairsManifold`)
  const carriageFullH = quarterLandingY - lowerFloorY - 0.026;
  const carriageSoffit = new THREE.Mesh(
    new THREE.BoxGeometry(0.89, 0.06, 0.88),
    warmRoomPlasterMat
  );
  carriageSoffit.position.set(-17.105, quarterLandingY - 0.056, -2.06);
  carriageSoffit.castShadow = true;
  carriageSoffit.receiveShadow = true;
  stairGroup.add(carriageSoffit);

  // South, North, and West interior plaster walls of the Understairs Cupboard
  for (const [wx, wz, ww, wd] of [
    [-17.105, -1.635, 0.89, 0.03], // South partition wall under Step 6 riser
    [-17.105, -2.485, 0.89, 0.03], // North back wall lining
    [-17.515, -2.06, 0.06, 0.88],  // West wall lining (mounting surface for hall.understairsManifold)
  ] as const) {
    const cupWall = new THREE.Mesh(
      new THREE.BoxGeometry(ww, carriageFullH, wd),
      warmRoomPlasterMat
    );
    cupWall.position.set(wx, (lowerFloorY + quarterLandingY - 0.026) * 0.5, wz);
    cupWall.castShadow = true;
    cupWall.receiveShadow = true;
    stairGroup.add(cupWall);
  }

  // Secondary 8-Port Hydronic UFH Manifold inside the Understairs Cupboard
  buildUnderstairsHeatingManifold(scene, lowerFloorY, brassMat, castIronMat);

  // Solid Antique Oak Quarter-Landing Deck with Step 6 Riser Runner & L-Turn Runner Pad (Issue #16)
  const quarterLandingOakDeck = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.028, 0.88),
    antiqueOakSkirtingMat
  );
  quarterLandingOakDeck.position.set(-17.1, quarterLandingY - 0.014, -2.06);
  quarterLandingOakDeck.receiveShadow = true;
  stairGroup.add(quarterLandingOakDeck);

  // Step 6 Riser Runner & Brass Stair Rod at Z = -1.62m
  const step6RunnerRiser = new THREE.Mesh(
    new THREE.BoxGeometry(runnerW, lowerRiserH, 0.008),
    stairCarpetMat
  );
  step6RunnerRiser.position.set(
    lowerRunnerCenterX,
    quarterLandingY - lowerRiserH * 0.5,
    -1.616
  );
  stairGroup.add(step6RunnerRiser);

  for (const side of [-1, 1] as const) {
    const borderX = lowerRunnerCenterX + side * (runnerW * 0.5 + runnerBorderW * 0.5);
    const borderRiser = new THREE.Mesh(
      new THREE.BoxGeometry(runnerBorderW, lowerRiserH, 0.009),
      stairRunnerBorderMat
    );
    borderRiser.position.set(borderX, quarterLandingY - lowerRiserH * 0.5, -1.615);
    stairGroup.add(borderRiser);
  }

  const step6StairRod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0055, 0.0055, runnerW + runnerBorderW * 2 + 0.05, 12),
    brassMat
  );
  step6StairRod.name = 'hall.stairs.stairRod.5';
  step6StairRod.rotation.z = Math.PI * 0.5;
  step6StairRod.position.set(
    lowerRunnerCenterX,
    quarterLandingY - lowerRiserH + 0.012,
    -1.608
  );
  stairGroup.add(step6StairRod);

  // Quarter-Landing L-Turn Runner Carpet Pad (connecting the N-S lower runner to the W-E upper runner)
  const landingRunnerNS = new THREE.Mesh(
    new THREE.BoxGeometry(runnerW, 0.008, 0.71),
    stairCarpetMat
  );
  landingRunnerNS.name = 'hall.stairs.runner.quarterLanding';
  landingRunnerNS.position.set(lowerRunnerCenterX, quarterLandingY + 0.004, -1.975);
  landingRunnerNS.receiveShadow = true;
  stairGroup.add(landingRunnerNS);

  const landingRunnerWE = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.008, runnerW),
    stairCarpetMat
  );
  landingRunnerWE.position.set(-16.87, quarterLandingY + 0.004, -2.075);
  landingRunnerWE.receiveShadow = true;
  stairGroup.add(landingRunnerWE);

  // Border binding on Quarter-Landing L-Turn Runner
  const landingBorderWest = new THREE.Mesh(
    new THREE.BoxGeometry(runnerBorderW, 0.009, 0.72),
    stairRunnerBorderMat
  );
  landingBorderWest.position.set(
    lowerRunnerCenterX - (runnerW * 0.5 + runnerBorderW * 0.5),
    quarterLandingY + 0.0045,
    -1.98
  );
  stairGroup.add(landingBorderWest);

  const landingBorderNorth = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.009, runnerBorderW),
    stairRunnerBorderMat
  );
  landingBorderNorth.position.set(
    -17.0,
    quarterLandingY + 0.0045,
    -2.075 - (runnerW * 0.5 + runnerBorderW * 0.5)
  );
  stairGroup.add(landingBorderNorth);

  // 1D. Vertically-Boarded White Tongue-and-Groove Spandrel Wall along X = -16.64m (Z = -0.54m..-2.48m)
  //     Top of each vertical T&G plank sits strictly inside the sloped lower stringer (Z = -0.54m..-1.62m)
  //     and under the quarter landing (Z = -1.62m..-2.48m), with an open doorway aperture at Z = -1.72m..-2.36m
  //     for the interactive Understairs Cupboard Door!
  const spandrelPlankCount = 18;
  const spandrelStartZ = -0.54;
  const spandrelEndZ = -2.48;
  const spandrelStepZ = (spandrelEndZ - spandrelStartZ) / spandrelPlankCount;
  const doorBottomY = lowerFloorY;
  const doorTopY = lowerFloorY + 1.0;
  for (let p = 0; p < spandrelPlankCount; p++) {
    const pz = spandrelStartZ + (p + 0.5) * spandrelStepZ;
    const tLower = Math.min(1, Math.max(0, (-0.54 - pz) / 1.08));
    const plankTopY = -0.02 + tLower * 0.84;
    const inDoorSpan = pz < -1.72 && pz > -2.36;
    const botY = inDoorSpan ? doorTopY : doorBottomY;
    const plankH = Math.max(0.02, plankTopY - botY);
    const plank = new THREE.Mesh(
      new THREE.BoxGeometry(0.048, plankH, Math.abs(spandrelStepZ) - 0.005),
      skirtingMat
    );
    plank.position.set(-16.64, botY + plankH * 0.5, pz);
    plank.castShadow = true;
    plank.receiveShadow = true;
    stairGroup.add(plank);
  }

  const spandrelBaseRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.095, 1.18),
    skirtingMat
  );
  spandrelBaseRail.position.set(-16.64, lowerFloorY + 0.048, -1.13);
  stairGroup.add(spandrelBaseRail);

  // Small White Vertically-Boarded Under-Stairs Cupboard Door on the East face of the Quarter-Landing Spandrel
  // (X = -16.61m, Z = -1.72m..-2.36m, Y = -0.30m..+0.70m — interactive hinged door revealing hall.understairsManifold!)
  const cupboardDoorGroup = new THREE.Group();
  cupboardDoorGroup.name = 'hall.stairs.understairsCupboardDoor';
  cupboardDoorGroup.position.set(-16.612, lowerFloorY + 0.5, -2.04);

  const cupboardDoorLeaf = new THREE.Group();
  cupboardDoorLeaf.name = 'hall.stairs.understairsCupboardDoor.leaf';

  const cupboardDoorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 1.0, 0.64),
    skirtingMat
  );
  cupboardDoorFrame.castShadow = true;
  cupboardDoorFrame.receiveShadow = true;
  cupboardDoorLeaf.add(cupboardDoorFrame);

  for (const hy of [-0.28, 0.28]) {
    const cHinge = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.022, 0.09),
      castIronMat
    );
    cHinge.position.set(0.014, hy, -0.26);
    cupboardDoorLeaf.add(cHinge);
  }
  const cupboardKnob = new THREE.Mesh(
    new THREE.SphereGeometry(0.016, 10, 10),
    castIronMat
  );
  cupboardKnob.position.set(0.017, 0.02, 0.26);
  cupboardDoorLeaf.add(cupboardKnob);

  cupboardDoorGroup.add(cupboardDoorLeaf);
  stairGroup.add(cupboardDoorGroup);
  interactions.registerHingedDoor(
    cupboardDoorGroup,
    cupboardDoorLeaf,
    new THREE.Vector3(0, 0, -0.31),
    'y',
    Math.PI * 0.58
  );

  // 1E. Closed White Outer Stringer, Bottom Newel Post, 7 White Spindles & Parallel Lower Handrail (X = -16.64m)
  const lowerStringerDz = 1.08; // Z = -0.54m to -1.62m
  const lowerStringerDy = 0.84; // Y = 0.00m to +0.84m

  // Build plumb-cut lower outer stringer in Y-Z plane extruded across X (-16.669m..-16.611m)
  const buildPlumbZBeam = (
    zStart: number,
    zEnd: number,
    yBotStart: number,
    yTopStart: number,
    yBotEnd: number,
    yTopEnd: number,
    widthX: number,
    centerX: number,
    mat: THREE.Material
  ): THREE.Mesh => {
    const shape = new THREE.Shape();
    shape.moveTo(zStart, yBotStart);
    shape.lineTo(zStart, yTopStart);
    shape.lineTo(zEnd, yTopEnd);
    shape.lineTo(zEnd, yBotEnd);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: widthX,
      bevelEnabled: false,
    });
    // Rotate +90° around Y so shape X (zStart..zEnd) maps to world -Z..+Z:
    // After rotateY(Math.PI / 2): newX = oldZ, newY = oldY, newZ = -oldX.
    // So pass (-zStart, -zEnd) in shape X!
    const zShape = new THREE.Shape();
    zShape.moveTo(-zStart, yBotStart);
    zShape.lineTo(-zStart, yTopStart);
    zShape.lineTo(-zEnd, yTopEnd);
    zShape.lineTo(-zEnd, yBotEnd);
    zShape.closePath();
    const beamGeo = new THREE.ExtrudeGeometry(zShape, {
      depth: widthX,
      bevelEnabled: false,
    });
    beamGeo.rotateY(Math.PI / 2);
    beamGeo.translate(centerX - widthX * 0.5, 0, 0);
    geo.dispose();
    const mesh = new THREE.Mesh(beamGeo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  const lowerStringer = buildPlumbZBeam(
    -0.54,
    -1.62,
    -0.05,
    0.15,
    0.79,
    0.99,
    0.058,
    -16.64,
    skirtingMat
  );
  lowerStringer.name = 'hall.stairs.lowerStringer';
  stairGroup.add(lowerStringer);

  // Issue #5: Seasoned Oak Wall Stringer (`antiqueOakSkirtingMat`) wrapping continuously:
  // 1) Up the West cross-wall alongside the lower flight,
  // 2) Around the West and North walls of the Quarter Landing, and
  // 3) Up the North exposed-brick wall section alongside the second span of stairs!
  // With 4 subtly glowing recessed warm LED step lights (reduced brightness).
  {
    const westWallStringerGroup = new THREE.Group();
    westWallStringerGroup.name = 'hall.stairs.westWallStringer';
    westWallStringerGroup.position.set(-17.55, 0, -2.5);
    westWallStringerGroup.rotation.y = hallFrontRoomCrossWallFrame.rotationY;

    // In `hallFrontRoomCrossWallFrame` local coordinates (`u` from 0 at Z=-2.50m to 4.699 at Z=+2.19m):
    // Quarter landing edge Z = -1.62m -> u = 0.882m, Step 1 front edge Z = -0.36m -> u = 2.144m
    // East wall face is at local z = -0.12m; stringer protrudes 0.036m East to local z = -0.156m.
    const westStrShape = new THREE.Shape();
    westStrShape.moveTo(0.88, quarterLandingY - 0.08);
    westStrShape.lineTo(0.88, quarterLandingY + 0.19);
    westStrShape.lineTo(2.15, lowerFloorY + 0.24);
    westStrShape.lineTo(2.15, lowerFloorY);
    westStrShape.closePath();

    const westStrGeo = new THREE.ExtrudeGeometry(westStrShape, {
      depth: 0.036,
      bevelEnabled: false,
    });
    westStrGeo.translate(0, 0, -0.156);
    const westWallStringerMesh = new THREE.Mesh(westStrGeo, antiqueOakSkirtingMat);
    westWallStringerMesh.name = 'hall.stairs.westWallStringer.board';
    westWallStringerMesh.castShadow = true;
    westWallStringerMesh.receiveShadow = true;
    westWallStringerGroup.add(westWallStringerMesh);

    // Skirting-profile oak capping swept continuously along the landing and sloped West wall stringer top
    // edge, mitred at the landing kink (wall face at local z = -0.12m, projecting towards local -z).
    const westCapGeo = buildSweptMouldingGeometry(
      createSkirtingCapProfile(),
      [
        [0, quarterLandingY + 0.19],
        [0.88, quarterLandingY + 0.19],
        [2.15, lowerFloorY + 0.24],
      ],
      (a, y, d) => new THREE.Vector3(a, y, -0.12 - d)
    );
    const westWallStringerCap = new THREE.Mesh(westCapGeo, antiqueOakSkirtingMat);
    westWallStringerCap.name = 'hall.stairs.westWallStringer.cap';
    westWallStringerCap.castShadow = true;
    westWallStringerGroup.add(westWallStringerCap);

    // Horizontal continuation of the West oak wall stringer & top cap beading along the Quarter Landing (u = 0.00..0.88)
    const landingWestSkirt = new THREE.Mesh(
      new THREE.BoxGeometry(0.88, 0.19, 0.036),
      antiqueOakSkirtingMat
    );
    landingWestSkirt.name = 'hall.stairs.westWallStringer.landingBoard';
    landingWestSkirt.position.set(0.44, quarterLandingY + 0.095, -0.138);
    westWallStringerGroup.add(landingWestSkirt);


    // 4 Recessed Warm LED Step Lights set into the Oak West Wall Stringer above Steps 2..5, on the hall KNX
    // circuit (so they idle at the hall night-dim level after dark), each casting a small warm tread pool.
    westWallStringerGroup.updateMatrix();
    for (let sl = 0; sl < 4; sl++) {
      const stepIdx = sl + 1; // Steps 2, 3, 4, 5
      const treadTopY = lowerFloorY + (stepIdx + 1) * lowerRiserH;
      const treadCenterZ = -0.58 - (stepIdx - 0.5) * lowerFlightTreadDepth;
      // Convert local Z to local `u` along `hallFrontRoomCrossWallFrame`
      const uLight = ((treadCenterZ - -2.5) / 4.9) * hallFrontRoomCrossWallFrame.length;
      const yLight = treadTopY + 0.068;

      westWallStringerGroup.add(
        buildStepLightUnit(`hall.stairs.stepLight.${sl + 1}`, uLight, yLight, -0.157, -1)
      );
      const poolCenter = new THREE.Vector3(uLight, treadTopY, -0.156 - 0.2).applyMatrix4(
        westWallStringerGroup.matrix
      );
      ctx.addGlowPool('hallPendant', poolCenter.x, treadTopY + 0.004, poolCenter.z, 0.17, 0.34);
    }

    stairGroup.add(westWallStringerGroup);
  }

  // Square White Bottom Newel Post standing cleanly on Step 1 (X = -16.64m, Z = -0.54m, Y = -0.11m..+0.63m — PH-47 & PH-48)
  const bottomNewelH = 0.74;
  const bottomNewel = new THREE.Mesh(
    new THREE.BoxGeometry(0.104, bottomNewelH, 0.104),
    skirtingMat
  );
  bottomNewel.name = 'hall.stairs.bottomNewel';
  bottomNewel.position.set(-16.64, step1TopY + bottomNewelH * 0.5, -0.54);
  bottomNewel.castShadow = true;
  stairGroup.add(bottomNewel);

  const bottomNewelCap = new THREE.Mesh(
    new THREE.BoxGeometry(0.128, 0.036, 0.128),
    skirtingMat
  );
  bottomNewelCap.position.set(-16.64, step1TopY + bottomNewelH + 0.018, -0.54);
  stairGroup.add(bottomNewelCap);

  // Sloped White Lower Handrail strictly parallel to the lower stringer (Y = +0.52m..+0.576m at Z = -0.54m -> Y = +1.36m..+1.416m at Z = -1.62m)
  const lowerHandrail = buildPlumbZBeam(
    -0.54,
    -1.62,
    0.52,
    0.576,
    1.36,
    1.416,
    0.068,
    -16.64,
    skirtingMat
  );
  lowerHandrail.name = 'hall.stairs.lowerHandrail';
  stairGroup.add(lowerHandrail);

  // 7 Vertical White Square Balusters (Spindles) spanning strictly between the lower stringer and parallel lower handrail
  for (let b = 0; b < 7; b++) {
    const bt = (b + 0.5) / 7;
    const bz = -0.62 - bt * 0.92;
    const tZ = (-0.54 - bz) / lowerStringerDz;
    const strY = 0.13 + tZ * lowerStringerDy;
    const railY = 0.54 + tZ * lowerStringerDy;
    const bH = railY - strY;
    const baluster = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, bH, 0.03),
      skirtingMat
    );
    baluster.name = `hall.stairs.lowerSpindle.${b + 1}`;
    baluster.position.set(-16.64, (strY + railY) * 0.5, bz);
    baluster.castShadow = true;
    stairGroup.add(baluster);
  }

  // 2. Intermediate Corner White Newel Post at the Quarter-Landing Turn (X = -16.64m, Z = -1.63m)
  //    Rises from a dropped bottom finial at Y = +0.58m (hanging in the open space above the left armchair!)
  //    up to a flat square cap at Y = +1.46m so both the Lower Handrail (Y = 1.36m..1.416m) and the
  //    Upper Handrail (starting at Y = 1.36m..1.416m) frame cleanly into the post at the exact same height (Issue #4, PH-47 & PH-48!)
  const cornerNewelBottomY = 0.58;
  const cornerNewelTopY = 1.46;
  const cornerNewelH = cornerNewelTopY - cornerNewelBottomY;
  const cornerNewel = new THREE.Mesh(
    new THREE.BoxGeometry(0.106, cornerNewelH, 0.112),
    skirtingMat
  );
  cornerNewel.name = 'hall.stairs.cornerNewel';
  cornerNewel.position.set(-16.64, (cornerNewelBottomY + cornerNewelTopY) * 0.5, -1.63);
  cornerNewel.castShadow = true;
  stairGroup.add(cornerNewel);

  const cornerNewelCap = new THREE.Mesh(
    new THREE.BoxGeometry(0.132, 0.036, 0.136),
    skirtingMat
  );
  cornerNewelCap.position.set(-16.64, cornerNewelTopY + 0.018, -1.63);
  stairGroup.add(cornerNewelCap);

  const cornerNewelDropCap = new THREE.Mesh(
    new THREE.BoxGeometry(0.124, 0.028, 0.128),
    skirtingMat
  );
  cornerNewelDropCap.position.set(-16.64, cornerNewelBottomY - 0.014, -1.63);
  stairGroup.add(cornerNewelDropCap);

  // 3. Upper Flight turning 90° East (+X) along the North wall (Z = -2.49m..-1.66m, X = -16.64m..-15.36m)
  //    Rises from quarterLandingY = +0.84m to First Floor Landing floorTopY = +2.16m (6 risers of 0.22m = 1.32m)
  const upperBalustradeEndX = -15.5;
  const upperEndX = -15.36;
  const upperOpenSteps = 5;
  const upperStepRun = (upperBalustradeEndX - -16.64) / upperOpenSteps; // 1.14 / 5 = 0.228m
  const upperStepRise = 0.22; // 6 * 0.22m = 1.32m (from Y = 0.84m to Y = 2.16m flush with First Floor Landing!)

  const upperCarriageShape = new THREE.Shape();
  upperCarriageShape.moveTo(-16.64, 0.73);
  upperCarriageShape.lineTo(-16.64, quarterLandingY);
  for (let i = 0; i < upperOpenSteps; i++) {
    const sx0 = -16.64 + i * upperStepRun;
    const sx1 = -16.64 + (i + 1) * upperStepRun;
    const sy1 = quarterLandingY + (i + 1) * upperStepRise;
    upperCarriageShape.lineTo(sx0, sy1);
    upperCarriageShape.lineTo(sx1, sy1);
  }
  // Top landing arrival step flush with First Floor Landing (X = -15.50m..-15.36m, Y = 2.16m)
  const topStepY = quarterLandingY + (upperOpenSteps + 1) * upperStepRise; // 2.16m = floorTopY
  upperCarriageShape.lineTo(upperBalustradeEndX, topStepY);
  upperCarriageShape.lineTo(upperEndX, topStepY);
  upperCarriageShape.lineTo(upperEndX, topStepY - 0.15);
  upperCarriageShape.closePath();

  const upperCarriageGeo = new THREE.ExtrudeGeometry(upperCarriageShape, {
    depth: 0.83,
    bevelEnabled: false,
  });
  upperCarriageGeo.translate(0, 0, -2.49);
  // Solid Antique Oak upper stair treads & risers flanking the central runner carpet (Issue #16)
  const upperCarriageMesh = new THREE.Mesh(upperCarriageGeo, antiqueOakSkirtingMat);
  upperCarriageMesh.castShadow = true;
  upperCarriageMesh.receiveShadow = true;
  stairGroup.add(upperCarriageMesh);

  // Issue #16: Central Woven Runner Carpet + Contrast Border Binding + Brass Stair Rods on the Upper Flight
  const upperRunnerShape = new THREE.Shape();
  upperRunnerShape.moveTo(-16.648, quarterLandingY);
  for (let i = 0; i < upperOpenSteps; i++) {
    const sx0 = -16.64 + i * upperStepRun;
    const sx1 = -16.64 + (i + 1) * upperStepRun;
    const sy1 = quarterLandingY + (i + 1) * upperStepRise;
    upperRunnerShape.lineTo(sx0 - 0.006, sy1 + 0.006);
    upperRunnerShape.lineTo(sx1 - 0.006, sy1 + 0.006);
  }
  upperRunnerShape.lineTo(upperBalustradeEndX - 0.006, topStepY + 0.006);
  upperRunnerShape.lineTo(upperEndX, topStepY + 0.006);
  upperRunnerShape.lineTo(upperEndX, topStepY - 0.008);
  for (let i = upperOpenSteps - 1; i >= 0; i--) {
    const sx0 = -16.64 + i * upperStepRun;
    const sx1 = -16.64 + (i + 1) * upperStepRun;
    const sy1 = quarterLandingY + (i + 1) * upperStepRise;
    upperRunnerShape.lineTo(sx1 + 0.004, sy1 - 0.004);
    upperRunnerShape.lineTo(sx0 + 0.004, sy1 - 0.004);
  }
  upperRunnerShape.lineTo(-16.636, quarterLandingY);
  upperRunnerShape.closePath();

  const upperRunnerGeo = new THREE.ExtrudeGeometry(upperRunnerShape, {
    depth: runnerW,
    bevelEnabled: false,
  });
  upperRunnerGeo.translate(0, 0, -2.075 - runnerW * 0.5);
  const upperRunnerMesh = new THREE.Mesh(upperRunnerGeo, stairCarpetMat);
  upperRunnerMesh.name = 'hall.stairs.runner.upperFlight';
  upperRunnerMesh.receiveShadow = true;
  stairGroup.add(upperRunnerMesh);

  for (const side of [-1, 1] as const) {
    const borderGeo = new THREE.ExtrudeGeometry(upperRunnerShape, {
      depth: runnerBorderW,
      bevelEnabled: false,
    });
    const borderZ =
      -2.075 + side * (runnerW * 0.5 + runnerBorderW * 0.5) - runnerBorderW * 0.5;
    borderGeo.translate(0, 0, borderZ);
    const borderMesh = new THREE.Mesh(borderGeo, stairRunnerBorderMat);
    stairGroup.add(borderMesh);
  }

  for (let i = 0; i < upperOpenSteps; i++) {
    const rodX = -16.64 + i * upperStepRun - 0.01;
    const rodY = quarterLandingY + i * upperStepRise + 0.012;
    const upperRod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0055, 0.0055, runnerW + runnerBorderW * 2 + 0.05, 12),
      brassMat
    );
    upperRod.name = `hall.stairs.upperStairRod.${i + 1}`;
    upperRod.rotation.x = Math.PI * 0.5;
    upperRod.position.set(rodX, rodY, -2.075);
    stairGroup.add(upperRod);
  }

  // Smooth White-Plastered Sloped Soffit Underside Panel beneath the Upper Flight
  const soffitShape = new THREE.Shape();
  soffitShape.moveTo(-16.64, 0.69);
  soffitShape.lineTo(-16.64, 0.74);
  soffitShape.lineTo(upperEndX, topStepY - 0.13);
  soffitShape.lineTo(upperEndX, topStepY - 0.18);
  soffitShape.closePath();
  const soffitGeo = new THREE.ExtrudeGeometry(soffitShape, {
    depth: 0.84,
    bevelEnabled: false,
  });
  soffitGeo.translate(0, 0, -2.495);
  const openSlopedSoffit = new THREE.Mesh(soffitGeo, warmRoomPlasterMat);
  openSlopedSoffit.name = 'hall.stairs.upperSoffit';
  openSlopedSoffit.receiveShadow = true;
  stairGroup.add(openSlopedSoffit);

  // Recessed warm-white LED strip along the underside of the sloped upper-flight soffit,
  // illuminating the Roland GP-6-PE piano alcove below (on `hallPendant`, low in night mode).
  {
    const soffitLedMat = new THREE.MeshStandardMaterial({
      color: 0xffefb8,
      emissive: 0xffae24,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });
    soffitLedMat.userData.baseEmissiveIntensity = 2.2;
    lightGroups.hallPendant.emissives.push(soffitLedMat);

    const soffitDx = upperEndX - -16.64; // 1.28m
    const soffitDy = topStepY - 0.18 - 0.69; // 1.29m
    const soffitLen = Math.hypot(soffitDx, soffitDy) - 0.08;
    const soffitPitch = Math.atan2(soffitDy, soffitDx);
    const soffitMidX = (-16.64 + upperEndX) * 0.5;
    const soffitMidY = (0.69 + (topStepY - 0.18)) * 0.5;

    const soffitLedGroup = new THREE.Group();
    soffitLedGroup.name = 'hall.stairs.upperSoffit.ledStrip';
    soffitLedGroup.position.set(soffitMidX, soffitMidY, -2.02);
    soffitLedGroup.rotation.z = soffitPitch;

    const housing = new THREE.Mesh(
      new THREE.BoxGeometry(soffitLen + 0.01, 0.009, 0.022),
      brassMat
    );
    housing.name = 'hall.stairs.upperSoffit.ledStrip.housing';
    housing.position.set(0, -0.004, 0);
    soffitLedGroup.add(housing);

    const diffuser = new THREE.Mesh(
      new THREE.BoxGeometry(soffitLen, 0.006, 0.014),
      soffitLedMat
    );
    diffuser.name = 'hall.stairs.upperSoffit.ledStrip.diffuser';
    diffuser.position.set(0, -0.008, 0);
    soffitLedGroup.add(diffuser);

    stairGroup.add(soffitLedGroup);
    interactions.registerLightFixture(soffitLedGroup, 'hallPendant');
    ctx.addGlowPool('hallPendant', soffitMidX, lowerFloorY + 0.006, -2.02, 1.15, 0.24);
  }

  // Issue #4: Mitered Closed White Outer Stringer on the South (+Z = -1.64m) face of the Upper Flight (X = -16.59m..-15.41m)
  // Matches the exact upper flight pitch up to the First Floor Landing slab at X = -15.36m
  const upperBalustradeJoinX = -15.41;
  const upperSpanDeltaY = ((upperBalustradeJoinX - -16.59) * upperStepRise) / upperStepRun;
  const upperStrShape = new THREE.Shape();
  upperStrShape.moveTo(-16.59, 0.78);
  upperStrShape.lineTo(-16.59, 0.98);
  upperStrShape.lineTo(upperBalustradeJoinX, 0.98 + upperSpanDeltaY);
  upperStrShape.lineTo(upperBalustradeJoinX, 0.78 + upperSpanDeltaY);
  upperStrShape.closePath();
  const upperStrGeo = new THREE.ExtrudeGeometry(upperStrShape, {
    depth: 0.056,
    bevelEnabled: false,
  });
  upperStrGeo.translate(0, 0, -1.668);
  const upperStringer = new THREE.Mesh(upperStrGeo, skirtingMat);
  upperStringer.name = 'hall.stairs.upperStringer';
  upperStringer.castShadow = true;
  stairGroup.add(upperStringer);

  // Issue #4: Parallel Mitered White Upper Handrail along Z = -1.64m (X = -16.59m..-15.41m)
  // Starts at Y = 1.36m..1.416m on the East face of `cornerNewel` and climbs to the First Floor gallery newel post
  const upperRailShape = new THREE.Shape();
  upperRailShape.moveTo(-16.59, 1.36);
  upperRailShape.lineTo(-16.59, 1.416);
  upperRailShape.lineTo(upperBalustradeJoinX, 1.416 + upperSpanDeltaY);
  upperRailShape.lineTo(upperBalustradeJoinX, 1.36 + upperSpanDeltaY);
  upperRailShape.closePath();
  const upperRailGeo = new THREE.ExtrudeGeometry(upperRailShape, {
    depth: 0.068,
    bevelEnabled: false,
  });
  upperRailGeo.translate(0, 0, -1.674);
  const upperHandrail = new THREE.Mesh(upperRailGeo, skirtingMat);
  upperHandrail.name = 'hall.stairs.upperHandrail';
  upperHandrail.castShadow = true;
  stairGroup.add(upperHandrail);

  // 7 Full-Height (0.41m) Vertical White Square Balusters (Spindles) between the parallel Upper Stringer & Upper Handrail
  for (let ub = 0; ub < 7; ub++) {
    const ut = (ub + 0.5) / 7;
    const bx = -16.59 + ut * (upperBalustradeJoinX - -16.59);
    const bBottomY = 0.96 + ut * upperSpanDeltaY;
    const bTopY = 1.37 + ut * upperSpanDeltaY;
    const bH = bTopY - bBottomY;
    const baluster = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, bH, 0.03),
      skirtingMat
    );
    baluster.name = `hall.stairs.upperSpindle.${ub + 1}`;
    baluster.position.set(bx, (bBottomY + bTopY) * 0.5, -1.64);
    baluster.castShadow = true;
    stairGroup.add(baluster);
  }

  // Signature Hanging Square White Newel Post with Drop-Pendant Finial at X = -15.38m, Z = -1.64m (PH-47 & PH-48!)
  // Anchors the top of the Upper Flight handrail & stringer directly into the First Floor Landing gallery rail (Y = 1.76m..3.12m)
  const hangingPostBottomY = 1.76;
  const hangingPostTopY = topStepY + 0.96;
  const hangingPostH = hangingPostTopY - hangingPostBottomY;
  const hangingPostPendant = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, hangingPostH, 0.1),
    skirtingMat
  );
  hangingPostPendant.name = 'hall.stairs.hangingNewelPost';
  hangingPostPendant.position.set(
    -15.38,
    (hangingPostBottomY + hangingPostTopY) * 0.5,
    -1.64
  );
  hangingPostPendant.castShadow = true;
  stairGroup.add(hangingPostPendant);

  const hangingPostCap = new THREE.Mesh(
    new THREE.BoxGeometry(0.122, 0.028, 0.122),
    skirtingMat
  );
  hangingPostCap.position.set(-15.38, hangingPostBottomY - 0.014, -1.64);
  stairGroup.add(hangingPostCap);

  // White-Plastered Ceiling Stairwell Trimmer Fascia & Apron along the First Floor gallery edge (X = -15.36m, Z = -1.65m..-0.58m)
  // Leaves the Upper Flight arrival threshold (Z = -2.50m..-1.65m at X = -15.36m, Y = 2.16m) 100% open!
  const trimmerH = topStepY - 1.92;
  const stairwellEastTrimmer = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, trimmerH, 1.07),
    warmRoomPlasterMat
  );
  stairwellEastTrimmer.position.set(-15.36, 1.92 + trimmerH / 2, -1.115);
  stairwellEastTrimmer.castShadow = true;
  stairGroup.add(stairwellEastTrimmer);

  // Issue #5: Continuous Seasoned Oak Wall Stringer (`antiqueOakSkirtingMat`) wrapping along the North Wall
  // across the Quarter Landing (X = -17.53m..-16.64m, Y = 0.84m..1.03m) and climbing up the North Exposed Brick Wall
  // alongside the second span of stairs (X = -16.64m..-15.36m, rising from Y = 1.03m to Y = topStepY + 0.19m)!
  {
    const northStrShape = new THREE.Shape();
    northStrShape.moveTo(-17.53, quarterLandingY - 0.02);
    northStrShape.lineTo(-17.53, quarterLandingY + 0.19);
    northStrShape.lineTo(-16.64, quarterLandingY + 0.19);
    northStrShape.lineTo(upperEndX, topStepY + 0.19);
    northStrShape.lineTo(upperEndX, topStepY - 0.04);
    northStrShape.lineTo(-16.64, quarterLandingY - 0.04);
    northStrShape.closePath();

    const northStrGeo = new THREE.ExtrudeGeometry(northStrShape, {
      depth: 0.038,
      bevelEnabled: false,
    });
    northStrGeo.translate(0, 0, -2.496);
    const northWallStringer = new THREE.Mesh(northStrGeo, antiqueOakSkirtingMat);
    northWallStringer.name = 'hall.stairs.northWallStringer.board';
    northWallStringer.castShadow = true;
    northWallStringer.receiveShadow = true;
    stairGroup.add(northWallStringer);

    // Skirting-profile oak capping swept along the North Quarter-Landing & Brick-Wall Stringer top edge,
    // mitred where the landing run turns up the second flight (wall face Z = -2.496m, projecting +Z).
    const northCapGeo = buildSweptMouldingGeometry(
      createSkirtingCapProfile(),
      [
        [-17.53, quarterLandingY + 0.19],
        [-16.64, quarterLandingY + 0.19],
        [upperEndX, topStepY + 0.19],
      ],
      (a, y, d) => new THREE.Vector3(a, y, -2.496 + d)
    );
    const northWallStringerCap = new THREE.Mesh(northCapGeo, antiqueOakSkirtingMat);
    northWallStringerCap.name = 'hall.stairs.northWallStringer.cap';
    northWallStringerCap.castShadow = true;
    stairGroup.add(northWallStringerCap);

    // Step lights continue up the stairs: one on the Quarter Landing and one above each Upper Flight tread,
    // set into the North stringer board face (Z = -2.458m) and facing South (+Z) across the treads.
    const northBoardFaceZ = -2.458;
    const landingLightX = -17.09;
    stairGroup.add(
      buildStepLightUnit('hall.stairs.stepLight.landing', landingLightX, quarterLandingY + 0.068, northBoardFaceZ + 0.001, 1)
    );
    ctx.addGlowPool('hallPendant', landingLightX, quarterLandingY + 0.004, northBoardFaceZ + 0.2, 0.17, 0.34);
    for (let i = 0; i < upperOpenSteps; i++) {
      const treadCenterX = -16.64 + (i + 0.5) * upperStepRun;
      const treadTopY = quarterLandingY + (i + 1) * upperStepRise;
      stairGroup.add(
        buildStepLightUnit(
          `hall.stairs.stepLight.upper.${i + 1}`,
          treadCenterX,
          treadTopY + 0.064,
          northBoardFaceZ + 0.001,
          1
        )
      );
      ctx.addGlowPool('hallPendant', treadCenterX, treadTopY + 0.004, northBoardFaceZ + 0.2, 0.15, 0.34);
    }
  }

  // North Wall Polygonal Brick Panel above the Quarter Landing and Upper Flight Oak Stringer
  // (Issue #15: West Cross-Wall Exposed Brick Panel at [-17.436, 1.547, -1.857] removed!)
  const brickNorthShape = new THREE.Shape();
  brickNorthShape.moveTo(-17.48, quarterLandingY + 0.2);
  brickNorthShape.lineTo(-16.64, quarterLandingY + 0.2);
  brickNorthShape.lineTo(upperEndX, topStepY + 0.19);
  brickNorthShape.lineTo(upperEndX, topStepY + 0.22);
  brickNorthShape.lineTo(-17.48, topStepY + 0.22);
  brickNorthShape.closePath();
  const stairExposedBrickNorthGeo = new THREE.ExtrudeGeometry(brickNorthShape, {
    depth: 0.02,
    bevelEnabled: false,
  });
  stairExposedBrickNorthGeo.translate(0, 0, -2.498);
  applyWorldSpaceBrickUVs(stairExposedBrickNorthGeo, 0, 0, 0);
  const stairExposedBrickNorth = new THREE.Mesh(stairExposedBrickNorthGeo, exteriorBrickMat);
  stairExposedBrickNorth.receiveShadow = true;
  tagCutawayWall(stairExposedBrickNorth, {
    axis: 'z',
    coord: -2.64,
    minSpan: -17.55,
    maxSpan: -12.81,
    floor: 'ground',
  });
  stairGroup.add(stairExposedBrickNorth);

  scene.add(stairGroup);

  // Exposed Natural Oak Timber Ceiling Spine Beam & Joists in Entrance Hall (Issue #11: lowered with wallH)
  const hallSpineBeam = new THREE.Mesh(
    new THREE.BoxGeometry(4.56, 0.18, 0.19),
    oakMat
  );
  hallSpineBeam.position.set(-15.33, wallH - 0.14, 0.34);
  hallSpineBeam.castShadow = true;
  hallSpineBeam.receiveShadow = true;
  groundFloorCeilingGroup.add(hallSpineBeam);

  // North-South Ceiling Trimmer Beam along the stairwell gallery edge (X = -15.36m, Z = -1.64m..+0.34m)
  const hallStairTrimmerBeam = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.16, 1.98),
    oakMat
  );
  hallStairTrimmerBeam.position.set(-15.36, wallH - 0.12, -0.65);
  hallStairTrimmerBeam.castShadow = true;
  groundFloorCeilingGroup.add(hallStairTrimmerBeam);

  // Plasterboard ceiling backing above the Main Hall oak joists (wrapping around the open stairwell void X = -17.85..-15.36, Z = -2.66..-0.58)
  const hallSouthCeilingBacking = new THREE.Mesh(
    new THREE.BoxGeometry(4.84, 0.036, 3.12),
    warmRoomPlasterMat
  );
  hallSouthCeilingBacking.name = 'hall.ceilingBacking.south';
  hallSouthCeilingBacking.position.set(-15.45, wallH - 0.005, 0.98);
  hallSouthCeilingBacking.receiveShadow = true;
  groundFloorCeilingGroup.add(hallSouthCeilingBacking);

  const hallNorthEastCeilingBacking = new THREE.Mesh(
    new THREE.BoxGeometry(2.36, 0.036, 2.1),
    warmRoomPlasterMat
  );
  hallNorthEastCeilingBacking.name = 'hall.ceilingBacking.northEast';
  hallNorthEastCeilingBacking.position.set(-14.18, wallH - 0.005, -1.61);
  hallNorthEastCeilingBacking.receiveShadow = true;
  groundFloorCeilingGroup.add(hallNorthEastCeilingBacking);

  // Exposed Natural Oak North-South Ceiling Joists South of the Spine Beam (Z = +0.34m..+2.35m — Issue #9)
  for (let jx = -17.35; jx <= -13.25; jx += 0.44) {
    const joist = new THREE.Mesh(
      new THREE.BoxGeometry(0.095, 0.11, 1.98),
      oakMat
    );
    joist.position.set(jx, wallH - 0.07, 1.33);
    joist.castShadow = true;
    groundFloorCeilingGroup.add(joist);
  }
  // Exposed Natural Oak Ceiling Joists North of the Spine Beam (East of Stairwell, X = -15.05m..-13.25m — Issue #9)
  for (let jx = -15.01; jx <= -13.25; jx += 0.44) {
    const northJoist = new THREE.Mesh(
      new THREE.BoxGeometry(0.095, 0.11, 2.82),
      oakMat
    );
    northJoist.position.set(jx, wallH - 0.07, -1.07);
    northJoist.castShadow = true;
    groundFloorCeilingGroup.add(northJoist);
  }

  // Helper to build an authentic Q Acoustics 3010i / 3020i Bookshelf Speaker (used in both Living Room and Sitting Room alcoves — Issues #1, #2, #7)
  const spkWalnutCabinetMat = new THREE.MeshStandardMaterial({
    color: 0x5c3e28, // Q Acoustics English Walnut / Santos Rosewood veneer
    roughness: 0.42,
    metalness: 0.04,
  });
  const spkBaffleMat = new THREE.MeshStandardMaterial({
    color: 0x181a1d, // Satin Anthracite / Carbon Black front baffle
    roughness: 0.34,
    metalness: 0.12,
  });
  const spkConeMat = new THREE.MeshStandardMaterial({
    color: 0x26292e, // C3 Continuous Curved Cone driver diaphragm
    roughness: 0.45,
    metalness: 0.18,
  });
  const spkTrimRingMat = new THREE.MeshStandardMaterial({
    color: 0xd4d2cc, // Brushed aluminum driver trim ring
    roughness: 0.22,
    metalness: 0.72,
  });

  const buildQAcousticsSpeaker = (
    parentGroup: THREE.Group,
    spkName: string,
    spkX: number,
    spkY: number,
    spkZ: number,
    toeInYaw: number
  ): void => {
    const spkGroup = new THREE.Group();
    spkGroup.name = spkName;
    spkGroup.position.set(spkX, spkY, spkZ);
    spkGroup.rotation.y = toeInYaw;

    const spkW = 0.138;
    const spkH = 0.218;
    const spkD = 0.198;

    // 4 low-profile acoustic isolation rubber feet (5mm tall)
    for (const [fx, fz] of [
      [-0.048, -0.075],
      [0.048, -0.075],
      [-0.048, 0.075],
      [0.048, 0.075],
    ] as const) {
      const foot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.01, 0.005, 10),
        spkBaffleMat
      );
      foot.position.set(fx, 0.0025, fz);
      spkGroup.add(foot);
    }

    // Rounded-edge cabinet body (main core + chamfered top/bottom/side wrap)
    const cabBody = new THREE.Mesh(
      new THREE.BoxGeometry(spkW, spkH - 0.014, spkD - 0.012),
      spkWalnutCabinetMat
    );
    cabBody.name = `${spkName}.cabinet`;
    cabBody.position.set(0, 0.005 + spkH * 0.5, 0.006);
    cabBody.castShadow = true;
    cabBody.receiveShadow = true;
    spkGroup.add(cabBody);

    const cabTopBot = new THREE.Mesh(
      new THREE.BoxGeometry(spkW - 0.014, spkH, spkD - 0.012),
      spkWalnutCabinetMat
    );
    cabTopBot.position.set(0, 0.005 + spkH * 0.5, 0.006);
    spkGroup.add(cabTopBot);

    // Satin dark front baffle plate facing local -Z
    const frontBaffle = new THREE.Mesh(
      new THREE.BoxGeometry(spkW - 0.01, spkH - 0.01, 0.014),
      spkBaffleMat
    );
    frontBaffle.name = `${spkName}.baffle`;
    frontBaffle.position.set(0, 0.005 + spkH * 0.5, -spkD * 0.5 + 0.007);
    frontBaffle.castShadow = true;
    spkGroup.add(frontBaffle);

    const baffleFrontZ = -spkD * 0.5 - 0.001;

    // 100mm Mid/Bass Driver (lower center of baffle) + brushed metal trim ring
    const wooferRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.046, 0.0038, 10, 24),
      spkTrimRingMat
    );
    wooferRing.position.set(0, 0.092, baffleFrontZ);
    spkGroup.add(wooferRing);

    const wooferCone = new THREE.Mesh(
      new THREE.CylinderGeometry(0.043, 0.018, 0.013, 20),
      spkConeMat
    );
    wooferCone.rotation.x = Math.PI / 2;
    wooferCone.position.set(0, 0.092, baffleFrontZ + 0.004);
    spkGroup.add(wooferCone);

    // 22mm Decoupled High-Frequency Dome Tweeter (upper baffle) + trim ring
    const tweeterRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.02, 0.003, 10, 20),
      spkTrimRingMat
    );
    tweeterRing.position.set(0, 0.174, baffleFrontZ);
    spkGroup.add(tweeterRing);

    const tweeterDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.0115, 12, 10),
      spkConeMat
    );
    tweeterDome.scale.set(1, 1, 0.45);
    tweeterDome.position.set(0, 0.174, baffleFrontZ - 0.002);
    spkGroup.add(tweeterDome);

    // Signature small silver Q Acoustics logo badge at bottom center of front baffle
    const qBadge = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.007, 0.002),
      spkTrimRingMat
    );
    qBadge.position.set(0, 0.022, baffleFrontZ - 0.001);
    spkGroup.add(qBadge);

    parentGroup.add(spkGroup);
  };

  return {
    buildQAcousticsSpeaker,
    spkConeMat,
    spkTrimRingMat,
  };
}
