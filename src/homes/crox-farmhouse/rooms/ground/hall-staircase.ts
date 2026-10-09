import * as THREE from 'three';
import {
  buildSweptMouldingGeometry,
  createSkirtingCapProfile,
} from '../../../../engine/geometry/swept-moulding.ts';
import {
  createNaturalOakJoineryTextures,
  createWovenWoolCarpetTextures,
} from '../../../../engine/textures/procedural-textures.ts';
import { buildUnderstairsHeatingManifold } from '../../../../objects/fixtures/hydronic-manifold.ts';
import type { SceneBuilderContext } from '../../../../engine/viewer/scene-types.ts';
import type { createGroundFloorMaterials } from '../../structure/ground-floor-materials.ts';
import type { createGroundFloorShellKit } from '../../structure/ground-floor-shell-kit.ts';
import type { buildDiningRoom } from './dining-room.ts';
import type { buildHall } from './hall.ts';

function createSharedGeo<T extends THREE.BufferGeometry>(geo: T): T {
  geo.computeBoundingSphere();
  return geo;
}

function tagHighLod<T extends THREE.Object3D>(obj: T, maxDistance = 12): T {
  obj.userData.lodTier = 'high';
  obj.userData.lodMaxDistance = maxDistance;
  return obj;
}

/**
 * Quarter-turn oak staircase, balustrades and hanging newel in the Stair Hall.
 *
 * Extracted verbatim from `buildMainHouseGroundFloorRooms` (ground-floor-rooms.ts). Statement order and
 * geometry are unchanged; shared locals flow in via `kit` and out via the return value.
 */
export function buildHallStaircase(
  ctx: SceneBuilderContext,
  kit: Pick<
    ReturnType<typeof createGroundFloorMaterials>,
    | 'antiqueOakSkirtingMat'
    | 'brassMat'
    | 'castIronMat'
    | 'exteriorBrickMat'
    | 'oakMat'
    | 'skirtingMat'
    | 'tagCutawayWall'
    | 'wallH'
    | 'warmRoomPlasterMat'
  > &
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
  lightGroups.hallStairLeds.emissives.push(stepLightLensMat);

  const stepLightBezelGeo = createSharedGeo(new THREE.BoxGeometry(0.058, 0.042, 0.008));
  const stepLightHoodGeo = createSharedGeo(new THREE.BoxGeometry(0.052, 0.014, 0.014));
  const stepLightLensGeo = createSharedGeo(new THREE.BoxGeometry(0.044, 0.022, 0.006));

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
    const bezel = tagHighLod(new THREE.Mesh(stepLightBezelGeo, brassMat));
    bezel.name = `${name}.bezel`;
    bezel.castShadow = true;
    unit.add(bezel);

    // Angled brass eyelid hood shielding upward glare and directing warm light across the tread
    const hood = tagHighLod(new THREE.Mesh(stepLightHoodGeo, brassMat));
    hood.name = `${name}.hood`;
    hood.position.set(0, 0.01, outSign * 0.005);
    hood.rotation.x = -outSign * 0.28;
    unit.add(hood);

    // Warm LED diffuser window
    const lens = tagHighLod(new THREE.Mesh(stepLightLensGeo, stepLightLensMat));
    lens.name = `${name}.lens`;
    lens.position.set(0, -0.004, outSign * 0.003);
    unit.add(lens);

    ctx.interactions.registerLightFixture(unit, 'hallStairLeds');
    return unit;
  };

  // Issue #16: Woven Herringbone Wool Stair Runner Carpet texture matching the upstairs wool carpet at identical 0.5 m^-1 world UV scale
  const stairWoolCarpetTextures = createWovenWoolCarpetTextures();
  const stairCarpetMat = new THREE.MeshStandardMaterial({
    name: 'upstairsWovenWoolCarpet',
    map: stairWoolCarpetTextures.colorMap,
    bumpMap: stairWoolCarpetTextures.bumpMap,
    bumpScale: 0.0025,
    color: 0xf7f2e8, // Lighter warm creamy-oatmeal herringbone woven wool runner carpet matching upstairs
    roughness: 0.9,
    metalness: 0.01,
  });
  const applyWorldSpaceCarpetUVs = (
    geo: THREE.BufferGeometry,
    cx: number,
    cy: number,
    cz: number
  ): THREE.BufferGeometry => {
    const pos = geo.getAttribute('position');
    const norm = geo.getAttribute('normal');
    const uv = geo.getAttribute('uv');
    if (pos && norm && uv) {
      for (let i = 0; i < pos.count; i++) {
        const wx = pos.getX(i) + cx;
        const wy = pos.getY(i) + cy;
        const wz = pos.getZ(i) + cz;
        const ny = Math.abs(norm.getY(i));
        const nx = Math.abs(norm.getX(i));
        if (ny >= 0.5) {
          uv.setXY(i, wx * 0.5, wz * 0.5);
        } else if (nx > 0.5) {
          uv.setXY(i, (wx + wy) * 0.5, wz * 0.5);
        } else {
          uv.setXY(i, wx * 0.5, (wz + wy) * 0.5);
        }
      }
      uv.needsUpdate = true;
    }
    geo.computeBoundingSphere();
    return geo;
  };
  const stairRunnerBorderMat = new THREE.MeshStandardMaterial({
    color: 0x3d352e, // Dark charcoal-umber cotton tape border binding along both edges of the runner
    roughness: 0.85,
  });

  const lowerRiserH = 0.19; // 6 risers * 0.19m = 1.14m (from lowerFloorY = -0.30m to quarterLandingY = +0.84m)
  const quarterLandingY = lowerFloorY + 6 * lowerRiserH; // +0.84m (1.14m above the -0.30m Hall floor)
  const runnerW = 0.52; // Central runner width (leaving exposed antique oak margins on both sides)
  const runnerBorderW = 0.024;
  const lowerRunnerCenterX = -17.08;

  // Shared geometries across lower/upper stair risers, borders, stair rods, and spindles
  const lowerBorderRiserGeo = createSharedGeo(
    new THREE.BoxGeometry(runnerBorderW, lowerRiserH, 0.009)
  );
  const stairRodGeo = createSharedGeo(
    new THREE.CylinderGeometry(0.0055, 0.0055, runnerW + runnerBorderW * 2 + 0.05, 12)
  );
  // Issue #13: Stripped natural European oak for bannister handrails, shoe rails & detailed newel posts,
  // paired with slender 16mm square matt black wrought/cast iron spindles
  const naturalOakJoineryTex = createNaturalOakJoineryTextures();
  const strippedBannisterOakMat = new THREE.MeshStandardMaterial({
    map: naturalOakJoineryTex.colorMap,
    bumpMap: naturalOakJoineryTex.bumpMap,
    bumpScale: 0.0035,
    color: 0xd8c3a5,
    roughness: 0.56,
    metalness: 0.02,
  });
  const blackIronSpindleMat = new THREE.MeshStandardMaterial({
    color: 0x1a1d20,
    roughness: 0.42,
    metalness: 0.72,
  });
  const spindleGeo = createSharedGeo(new THREE.BoxGeometry(0.016, 0.71, 0.016));
  const spindleBaseShoeGeo = createSharedGeo(new THREE.BoxGeometry(0.026, 0.014, 0.026));
  const spindleCollarGeo = createSharedGeo(new THREE.BoxGeometry(0.024, 0.024, 0.024));

  // 1A. Step 1: Wide Bullnose / Curtail Bottom Step in front of the Bottom Newel Post (Z = -0.36m..-0.58m, Y = -0.30m..-0.11m)
  const step1TopY = lowerFloorY + lowerRiserH; // -0.11m
  const step1Carriage = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.99, lowerRiserH - 0.026, 0.22)),
    skirtingMat
  );
  step1Carriage.name = 'hall.stairs.step1.carriage';
  step1Carriage.position.set(-17.105, lowerFloorY + (lowerRiserH - 0.026) * 0.5, -0.47);
  step1Carriage.castShadow = true;
  step1Carriage.receiveShadow = true;
  stairGroup.add(step1Carriage);

  const step1Tread = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(1.0, 0.028, 0.24)),
    antiqueOakSkirtingMat
  );
  step1Tread.name = 'hall.stairs.step1.tread';
  step1Tread.position.set(-17.1, step1TopY - 0.014, -0.46);
  step1Tread.castShadow = true;
  step1Tread.receiveShadow = true;
  stairGroup.add(step1Tread);

  // Curved Bullnose Right End on Step 1 wrapping around the East side of the Bottom Newel Post (X = -16.61m, Z = -0.47m)
  const bullnoseRiser = new THREE.Mesh(
    createSharedGeo(new THREE.CylinderGeometry(0.11, 0.11, lowerRiserH - 0.026, 20)),
    skirtingMat
  );
  bullnoseRiser.name = 'hall.stairs.step1.bullnoseRiser';
  bullnoseRiser.position.set(-16.61, lowerFloorY + (lowerRiserH - 0.026) * 0.5, -0.47);
  bullnoseRiser.castShadow = true;
  bullnoseRiser.receiveShadow = true;
  stairGroup.add(bullnoseRiser);

  const bullnoseTreadCap = new THREE.Mesh(
    createSharedGeo(new THREE.CylinderGeometry(0.122, 0.122, 0.028, 20)),
    antiqueOakSkirtingMat
  );
  bullnoseTreadCap.name = 'hall.stairs.step1.bullnoseTreadCap';
  bullnoseTreadCap.position.set(-16.61, step1TopY - 0.014, -0.46);
  bullnoseTreadCap.castShadow = true;
  bullnoseTreadCap.receiveShadow = true;
  stairGroup.add(bullnoseTreadCap);

  // Step 1 Central Runner Carpet (tread + riser + border binding + brass stair rod at base of Step 2 riser)
  const step1RunnerTread = new THREE.Mesh(
    applyWorldSpaceCarpetUVs(
      new THREE.BoxGeometry(runnerW, 0.008, 0.244),
      lowerRunnerCenterX,
      step1TopY + 0.004,
      -0.46
    ),
    stairCarpetMat
  );
  step1RunnerTread.name = 'hall.stairs.runner.step1Tread';
  step1RunnerTread.position.set(lowerRunnerCenterX, step1TopY + 0.004, -0.46);
  step1RunnerTread.receiveShadow = true;
  stairGroup.add(step1RunnerTread);

  const step1RunnerRiser = new THREE.Mesh(
    applyWorldSpaceCarpetUVs(
      new THREE.BoxGeometry(runnerW, lowerRiserH, 0.008),
      lowerRunnerCenterX,
      lowerFloorY + lowerRiserH * 0.5,
      -0.356
    ),
    stairCarpetMat
  );
  step1RunnerRiser.name = 'hall.stairs.runner.step1Riser';
  step1RunnerRiser.position.set(lowerRunnerCenterX, lowerFloorY + lowerRiserH * 0.5, -0.356);
  step1RunnerRiser.receiveShadow = true;
  stairGroup.add(step1RunnerRiser);

  const step1BorderTreadGeo = createSharedGeo(new THREE.BoxGeometry(runnerBorderW, 0.009, 0.246));
  for (const side of [-1, 1] as const) {
    const sideTag = side < 0 ? 'west' : 'east';
    const borderX = lowerRunnerCenterX + side * (runnerW * 0.5 + runnerBorderW * 0.5);
    const borderTread = new THREE.Mesh(step1BorderTreadGeo, stairRunnerBorderMat);
    borderTread.name = `hall.stairs.runner.step1BorderTread.${sideTag}`;
    borderTread.position.set(borderX, step1TopY + 0.0045, -0.46);
    stairGroup.add(borderTread);

    const borderRiser = new THREE.Mesh(lowerBorderRiserGeo, stairRunnerBorderMat);
    borderRiser.name = `hall.stairs.runner.step1BorderRiser.${sideTag}`;
    borderRiser.position.set(borderX, lowerFloorY + lowerRiserH * 0.5, -0.355);
    stairGroup.add(borderRiser);
  }

  // 1B. Steps 2..5: 4 Straight Oak-Treaded Risers with Central Runner Carpet climbing North (-Z) from Z = -0.58m to Z = -1.62m
  const lowerFlightTreadDepth = 0.26; // 4 * 0.26m = 1.04m (from Z = -0.58m to Z = -1.62m)
  const stepW = 0.93; // X = -17.60m..-16.67m (tucked cleanly into West cross-wall behind 22mm stringer)
  const stepCenterX = -17.6 + stepW * 0.5; // -17.135m
  const lowerOakTreadGeo = createSharedGeo(
    new THREE.BoxGeometry(stepW, 0.028, lowerFlightTreadDepth + 0.02)
  );
  const lowerBorderTreadGeo = createSharedGeo(
    new THREE.BoxGeometry(runnerBorderW, 0.009, lowerFlightTreadDepth + 0.024)
  );

  for (let s = 1; s < 5; s++) {
    const stepTopY = lowerFloorY + (s + 1) * lowerRiserH;
    const stepBotY = lowerFloorY + s * lowerRiserH;
    const stepCenterZ = -0.58 - (s - 0.5) * lowerFlightTreadDepth;
    const riserFaceZ = -0.58 - (s - 1) * lowerFlightTreadDepth;

    const riserCarriage = new THREE.Mesh(
      createSharedGeo(
        new THREE.BoxGeometry(stepW, stepTopY - lowerFloorY - 0.026, lowerFlightTreadDepth)
      ),
      skirtingMat
    );
    riserCarriage.name = `hall.stairs.step${s + 1}.carriage`;
    riserCarriage.position.set(
      stepCenterX,
      (lowerFloorY + stepTopY - 0.026) * 0.5,
      stepCenterZ
    );
    riserCarriage.castShadow = true;
    riserCarriage.receiveShadow = true;
    stairGroup.add(riserCarriage);

    const oakTread = new THREE.Mesh(lowerOakTreadGeo, antiqueOakSkirtingMat);
    oakTread.name = `hall.stairs.step${s + 1}.tread`;
    oakTread.position.set(stepCenterX, stepTopY - 0.014, stepCenterZ + 0.008);
    oakTread.castShadow = true;
    oakTread.receiveShadow = true;
    stairGroup.add(oakTread);

    // Central Runner Carpet on Riser + Tread (Issue #16)
    const runnerRiser = new THREE.Mesh(
      applyWorldSpaceCarpetUVs(
        new THREE.BoxGeometry(runnerW, lowerRiserH, 0.008),
        lowerRunnerCenterX,
        stepBotY + lowerRiserH * 0.5,
        riserFaceZ + 0.004
      ),
      stairCarpetMat
    );
    runnerRiser.name = `hall.stairs.runner.step${s + 1}Riser`;
    runnerRiser.position.set(lowerRunnerCenterX, stepBotY + lowerRiserH * 0.5, riserFaceZ + 0.004);
    runnerRiser.receiveShadow = true;
    stairGroup.add(runnerRiser);

    const runnerTread = new THREE.Mesh(
      applyWorldSpaceCarpetUVs(
        new THREE.BoxGeometry(runnerW, 0.008, lowerFlightTreadDepth + 0.024),
        lowerRunnerCenterX,
        stepTopY + 0.004,
        stepCenterZ + 0.008
      ),
      stairCarpetMat
    );
    runnerTread.name = `hall.stairs.runner.step${s + 1}Tread`;
    runnerTread.position.set(lowerRunnerCenterX, stepTopY + 0.004, stepCenterZ + 0.008);
    runnerTread.receiveShadow = true;
    stairGroup.add(runnerTread);

    for (const side of [-1, 1] as const) {
      const sideTag = side < 0 ? 'west' : 'east';
      const borderX = lowerRunnerCenterX + side * (runnerW * 0.5 + runnerBorderW * 0.5);
      const borderRiser = new THREE.Mesh(lowerBorderRiserGeo, stairRunnerBorderMat);
      borderRiser.name = `hall.stairs.runner.step${s + 1}BorderRiser.${sideTag}`;
      borderRiser.position.set(borderX, stepBotY + lowerRiserH * 0.5, riserFaceZ + 0.0045);
      stairGroup.add(borderRiser);

      const borderTread = new THREE.Mesh(lowerBorderTreadGeo, stairRunnerBorderMat);
      borderTread.name = `hall.stairs.runner.step${s + 1}BorderTread.${sideTag}`;
      borderTread.position.set(borderX, stepTopY + 0.0045, stepCenterZ + 0.008);
      stairGroup.add(borderTread);
    }

    // Antique Brass Stair Rod in the riser crease
    const stairRod = tagHighLod(new THREE.Mesh(stairRodGeo, brassMat));
    stairRod.name = `hall.stairs.stairRod.${s}`;
    stairRod.rotation.z = Math.PI * 0.5;
    stairRod.position.set(lowerRunnerCenterX, stepBotY + 0.012, riserFaceZ + 0.012);
    stairRod.castShadow = true;
    stairGroup.add(stairRod);
  }

  // 1C. Step 6 / NW Quarter-Turn Landing in the NW corner (X = -17.55m..-16.66m, Z = -1.62m..-2.50m, top Y = +0.84m)
  //     Hollowed inside to form the Understairs Service Cupboard housing the Secondary 8-Port UFH Manifold (`hall.understairsManifold`)
  const ceilingWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf7f5f0,
    roughness: 0.86,
    metalness: 0.01,
  });
  const carriageFullH = quarterLandingY - lowerFloorY - 0.026;
  const carriageSoffit = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.89, 0.06, 0.88)),
    ceilingWhiteMat
  );
  carriageSoffit.name = 'hall.stairs.quarterLanding.soffit';
  carriageSoffit.position.set(-17.105, quarterLandingY - 0.056, -2.06);
  carriageSoffit.castShadow = true;
  carriageSoffit.receiveShadow = true;
  stairGroup.add(carriageSoffit);

  // South, North, and West interior plaster walls of the Understairs Cupboard
  for (const [wIdx, [wx, wz, ww, wd]] of (
    [
      [-17.105, -1.635, 0.89, 0.03], // South partition wall under Step 6 riser
      [-17.105, -2.485, 0.89, 0.03], // North back wall lining
      [-17.515, -2.06, 0.06, 0.88], // West wall lining (mounting surface for hall.understairsManifold)
    ] as const
  ).entries()) {
    const cupWall = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(ww, carriageFullH, wd)),
      warmRoomPlasterMat
    );
    cupWall.name = `hall.stairs.understairsCupboard.wall.${wIdx + 1}`;
    cupWall.position.set(wx, (lowerFloorY + quarterLandingY - 0.026) * 0.5, wz);
    cupWall.castShadow = true;
    cupWall.receiveShadow = true;
    stairGroup.add(cupWall);
  }

  // Secondary 8-Port Hydronic UFH Manifold inside the Understairs Cupboard
  buildUnderstairsHeatingManifold(scene, lowerFloorY, brassMat, castIronMat);

  // Solid Antique Oak Quarter-Landing Deck with Step 6 Riser Runner & L-Turn Runner Pad (Issue #16)
  const quarterLandingOakDeck = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.9, 0.028, 0.88)),
    antiqueOakSkirtingMat
  );
  quarterLandingOakDeck.name = 'hall.stairs.quarterLanding.oakDeck';
  quarterLandingOakDeck.position.set(-17.1, quarterLandingY - 0.014, -2.06);
  quarterLandingOakDeck.receiveShadow = true;
  stairGroup.add(quarterLandingOakDeck);

  // Step 6 Riser Runner & Brass Stair Rod at Z = -1.62m
  const step6RunnerRiser = new THREE.Mesh(
    applyWorldSpaceCarpetUVs(
      new THREE.BoxGeometry(runnerW, lowerRiserH, 0.008),
      lowerRunnerCenterX,
      quarterLandingY - lowerRiserH * 0.5,
      -1.616
    ),
    stairCarpetMat
  );
  step6RunnerRiser.name = 'hall.stairs.runner.step6Riser';
  step6RunnerRiser.position.set(
    lowerRunnerCenterX,
    quarterLandingY - lowerRiserH * 0.5,
    -1.616
  );
  stairGroup.add(step6RunnerRiser);

  for (const side of [-1, 1] as const) {
    const sideTag = side < 0 ? 'west' : 'east';
    const borderX = lowerRunnerCenterX + side * (runnerW * 0.5 + runnerBorderW * 0.5);
    const borderRiser = new THREE.Mesh(lowerBorderRiserGeo, stairRunnerBorderMat);
    borderRiser.name = `hall.stairs.runner.step6BorderRiser.${sideTag}`;
    borderRiser.position.set(borderX, quarterLandingY - lowerRiserH * 0.5, -1.615);
    stairGroup.add(borderRiser);
  }

  const step6StairRod = tagHighLod(new THREE.Mesh(stairRodGeo, brassMat));
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
    applyWorldSpaceCarpetUVs(
      new THREE.BoxGeometry(runnerW, 0.008, 0.71),
      lowerRunnerCenterX,
      quarterLandingY + 0.004,
      -1.975
    ),
    stairCarpetMat
  );
  landingRunnerNS.name = 'hall.stairs.runner.quarterLanding';
  landingRunnerNS.position.set(lowerRunnerCenterX, quarterLandingY + 0.004, -1.975);
  landingRunnerNS.receiveShadow = true;
  stairGroup.add(landingRunnerNS);

  const landingRunnerWE = new THREE.Mesh(
    applyWorldSpaceCarpetUVs(
      new THREE.BoxGeometry(0.46, 0.008, runnerW),
      -16.87,
      quarterLandingY + 0.004,
      -2.075
    ),
    stairCarpetMat
  );
  landingRunnerWE.name = 'hall.stairs.runner.quarterLandingEast';
  landingRunnerWE.position.set(-16.87, quarterLandingY + 0.004, -2.075);
  landingRunnerWE.receiveShadow = true;
  stairGroup.add(landingRunnerWE);

  // Border binding on Quarter-Landing L-Turn Runner
  const landingBorderWest = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(runnerBorderW, 0.009, 0.72)),
    stairRunnerBorderMat
  );
  landingBorderWest.name = 'hall.stairs.runner.quarterLandingBorderWest';
  landingBorderWest.position.set(
    lowerRunnerCenterX - (runnerW * 0.5 + runnerBorderW * 0.5),
    quarterLandingY + 0.0045,
    -1.98
  );
  stairGroup.add(landingBorderWest);

  const landingBorderNorth = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.72, 0.009, runnerBorderW)),
    stairRunnerBorderMat
  );
  landingBorderNorth.name = 'hall.stairs.runner.quarterLandingBorderNorth';
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
      createSharedGeo(new THREE.BoxGeometry(0.048, plankH, Math.abs(spandrelStepZ) - 0.005)),
      skirtingMat
    );
    plank.name = `hall.stairs.spandrelPlank.${p + 1}`;
    plank.position.set(-16.64, botY + plankH * 0.5, pz);
    plank.castShadow = true;
    plank.receiveShadow = true;
    stairGroup.add(plank);
  }

  const spandrelBaseRail = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.06, 0.095, 1.18)),
    skirtingMat
  );
  spandrelBaseRail.name = 'hall.stairs.spandrelBaseRail';
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
    createSharedGeo(new THREE.BoxGeometry(0.022, 1.0, 0.64)),
    skirtingMat
  );
  cupboardDoorFrame.name = 'hall.stairs.understairsCupboardDoor.panel';
  cupboardDoorFrame.castShadow = true;
  cupboardDoorFrame.receiveShadow = true;
  cupboardDoorLeaf.add(cupboardDoorFrame);

  const cupboardHingeGeo = createSharedGeo(new THREE.BoxGeometry(0.014, 0.022, 0.09));
  for (const [hIdx, hy] of ([-0.28, 0.28] as const).entries()) {
    const cHinge = tagHighLod(new THREE.Mesh(cupboardHingeGeo, castIronMat));
    cHinge.name = `hall.stairs.understairsCupboardDoor.hinge.${hIdx + 1}`;
    cHinge.position.set(0.014, hy, -0.26);
    cupboardDoorLeaf.add(cHinge);
  }
  const cupboardKnob = tagHighLod(
    new THREE.Mesh(createSharedGeo(new THREE.SphereGeometry(0.016, 10, 10)), castIronMat)
  );
  cupboardKnob.name = 'hall.stairs.understairsCupboardDoor.knob';
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
    // Rotate +90° around Y so shape X (-zStart..-zEnd) maps to world zStart..zEnd
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
    createSharedGeo(beamGeo);
    const mesh = new THREE.Mesh(beamGeo, mat);
    mesh.name = 'hall.stairs.plumbBeam';
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  const lowerStringer = buildPlumbZBeam(
    -0.54,
    -1.62,
    -0.05,
    0.145,
    0.79,
    0.985,
    0.058,
    -16.64,
    skirtingMat
  );
  lowerStringer.name = 'hall.stairs.lowerStringer';
  stairGroup.add(lowerStringer);

  // Stripped-oak stringer shoe rail / capping along the top of the lower stringer (Issue #13)
  const lowerStringerShoeRail = buildPlumbZBeam(
    -0.54,
    -1.62,
    0.135,
    0.162,
    0.975,
    1.002,
    0.064,
    -16.64,
    strippedBannisterOakMat
  );
  lowerStringerShoeRail.name = 'hall.stairs.lowerStringer.shoeRail';
  stairGroup.add(lowerStringerShoeRail);

  // Issue #5 & Issue #1: Seasoned Oak Wall Stringer (`antiqueOakSkirtingMat`) matching the exact 22mm + 17mm
  // stepped ogee/torus skirting profile, coming lower along the steps (95mm board / 125mm cap above nosings)
  // and finishing with a clean mitred transition at `u = 2.409m` (`Z = -0.09m`) into the horizontal Hall West wall skirting!
  {
    const westWallStringerGroup = new THREE.Group();
    westWallStringerGroup.name = 'hall.stairs.westWallStringer';
    westWallStringerGroup.position.set(-17.55, 0, -2.5);
    westWallStringerGroup.rotation.y = hallFrontRoomCrossWallFrame.rotationY;

    const westWallLen = hallFrontRoomCrossWallFrame.length;
    const landingTurnU = 0.845;
    const bottomMitreU = 2.409;
    const skirtBoardH = 0.122;

    // Unified 22mm-thick oak stringer & West wall skirting board (`u = 0..westWallLen`, `z = -0.142m..-0.12m`)
    const westStrShape = new THREE.Shape();
    westStrShape.moveTo(0, quarterLandingY - 0.02);
    westStrShape.lineTo(0, quarterLandingY + skirtBoardH);
    westStrShape.lineTo(landingTurnU, quarterLandingY + skirtBoardH);
    westStrShape.lineTo(bottomMitreU, lowerFloorY + skirtBoardH);
    westStrShape.lineTo(westWallLen, lowerFloorY + skirtBoardH);
    westStrShape.lineTo(westWallLen, lowerFloorY);
    westStrShape.lineTo(landingTurnU, lowerFloorY);
    westStrShape.lineTo(landingTurnU, quarterLandingY - 0.02);
    westStrShape.closePath();

    const westStrGeo = new THREE.ExtrudeGeometry(westStrShape, {
      depth: 0.022,
      bevelEnabled: false,
    });
    westStrGeo.translate(0, 0, -0.142);
    createSharedGeo(westStrGeo);
    const westWallStringerMesh = new THREE.Mesh(westStrGeo, antiqueOakSkirtingMat);
    westWallStringerMesh.name = 'hall.stairs.westWallStringer.board';
    westWallStringerMesh.castShadow = true;
    westWallStringerMesh.receiveShadow = true;
    westWallStringerGroup.add(westWallStringerMesh);

    // Stepped ogee/torus oak skirting cap swept continuously along the Quarter Landing, sloped West wall
    // stringer, and horizontal Hall West wall skirting, mitred at both kinks (`z = -0.12m - d`).
    const westCapGeo = createSharedGeo(
      buildSweptMouldingGeometry(
        createSkirtingCapProfile(),
        [
          [0, quarterLandingY + skirtBoardH],
          [landingTurnU, quarterLandingY + skirtBoardH],
          [bottomMitreU, lowerFloorY + skirtBoardH],
          [westWallLen, lowerFloorY + skirtBoardH],
        ],
        (a, y, d) => new THREE.Vector3(a, y, -0.12 - d)
      )
    );
    const westWallStringerCap = new THREE.Mesh(westCapGeo, antiqueOakSkirtingMat);
    westWallStringerCap.name = 'hall.stairs.westWallStringer.cap';
    westWallStringerCap.castShadow = true;
    westWallStringerCap.receiveShadow = true;
    westWallStringerGroup.add(westWallStringerCap);

    // 4 Recessed Warm LED Step Lights set into the Oak West Wall Stringer above Steps 2..5, on the hall KNX
    // circuit (so they idle at the hall night-dim level after dark), each casting a small warm tread pool.
    westWallStringerGroup.updateMatrix();
    for (let sl = 0; sl < 4; sl++) {
      const stepIdx = sl + 1; // Steps 2, 3, 4, 5
      const treadTopY = lowerFloorY + (stepIdx + 1) * lowerRiserH;
      const treadCenterZ = -0.58 - (stepIdx - 0.5) * lowerFlightTreadDepth;
      // Convert local Z to local `u` along `hallFrontRoomCrossWallFrame`
      const uLight = ((treadCenterZ - -2.5) / 4.9) * hallFrontRoomCrossWallFrame.length;
      const yLight = treadTopY + 0.055;

      westWallStringerGroup.add(
        buildStepLightUnit(`hall.stairs.stepLight.${sl + 1}`, uLight, yLight, -0.143, -1)
      );
      const poolCenter = new THREE.Vector3(uLight, treadTopY, -0.142 - 0.2).applyMatrix4(
        westWallStringerGroup.matrix
      );
      ctx.addGlowPool('hallStairLeds', poolCenter.x, treadTopY + 0.004, poolCenter.z, 0.17, 0.34);
    }

    stairGroup.add(westWallStringerGroup);
  }

  // Helper to add tasteful stripped-oak English joinery details to a Hall Staircase newel post
  const addStairNewelDetails = (
    prefix: string,
    cx: number,
    cz: number,
    plinthBaseY: number,
    lowerCollarY: number,
    upperCollarY: number,
    capBaseY: number
  ): void => {
    const plinth = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.106, 0.068, 0.106)),
      strippedBannisterOakMat
    );
    plinth.name = `${prefix}.basePlinth`;
    plinth.position.set(cx, plinthBaseY + 0.034, cz);
    plinth.castShadow = true;
    stairGroup.add(plinth);

    const plinthLedge = tagHighLod(
      new THREE.Mesh(
        createSharedGeo(new THREE.BoxGeometry(0.1, 0.014, 0.1)),
        strippedBannisterOakMat
      )
    );
    plinthLedge.name = `${prefix}.basePlinthLedge`;
    plinthLedge.position.set(cx, plinthBaseY + 0.075, cz);
    stairGroup.add(plinthLedge);

    const collarGeo = createSharedGeo(new THREE.BoxGeometry(0.1, 0.022, 0.1));
    const lowerCollar = tagHighLod(new THREE.Mesh(collarGeo, strippedBannisterOakMat));
    lowerCollar.name = `${prefix}.lowerShaftCollar`;
    lowerCollar.position.set(cx, lowerCollarY, cz);
    stairGroup.add(lowerCollar);

    const upperCollar = tagHighLod(new THREE.Mesh(collarGeo, strippedBannisterOakMat));
    upperCollar.name = `${prefix}.upperShaftCollar`;
    upperCollar.position.set(cx, upperCollarY, cz);
    stairGroup.add(upperCollar);

    const stileH = Math.max(0.12, upperCollarY - lowerCollarY - 0.022);
    const stileGeo = createSharedGeo(new THREE.BoxGeometry(0.018, stileH, 0.018));
    for (const [idx, [ox, oz]] of (
      [
        [-0.04, -0.04],
        [0.04, -0.04],
        [-0.04, 0.04],
        [0.04, 0.04],
      ] as const
    ).entries()) {
      const stile = tagHighLod(new THREE.Mesh(stileGeo, strippedBannisterOakMat));
      stile.name = `${prefix}.shaftStile.${idx + 1}`;
      stile.position.set(cx + ox, (lowerCollarY + upperCollarY) * 0.5, cz + oz);
      stairGroup.add(stile);
    }

    // Moulded necking ring / shadow-gap collar just below the newel cap
    const neckRing = tagHighLod(
      new THREE.Mesh(
        createSharedGeo(new THREE.BoxGeometry(0.108, 0.018, 0.108)),
        strippedBannisterOakMat
      )
    );
    neckRing.name = `${prefix}.neckRing`;
    neckRing.position.set(cx, capBaseY - 0.024, cz);
    neckRing.castShadow = true;
    stairGroup.add(neckRing);

    // Stepped low-profile bevelled pyramid cap crown
    const capCrown = tagHighLod(
      new THREE.Mesh(
        createSharedGeo(new THREE.BoxGeometry(0.102, 0.012, 0.102)),
        strippedBannisterOakMat
      )
    );
    capCrown.name = `${prefix}.capCrown`;
    capCrown.position.set(cx, capBaseY + 0.03, cz);
    stairGroup.add(capCrown);

    const capApex = tagHighLod(
      new THREE.Mesh(
        createSharedGeo(new THREE.BoxGeometry(0.076, 0.01, 0.076)),
        strippedBannisterOakMat
      )
    );
    capApex.name = `${prefix}.capApex`;
    capApex.position.set(cx, capBaseY + 0.041, cz);
    stairGroup.add(capApex);
  };

  // Stripped-Oak Bottom Newel Post standing cleanly on Step 1 (X = -16.64m, Z = -0.54m, Y = -0.11m..+0.93m — Issue #13)
  const bottomNewelH = 1.04;
  const bottomNewel = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.092, bottomNewelH, 0.092)),
    strippedBannisterOakMat
  );
  bottomNewel.name = 'hall.stairs.bottomNewel';
  bottomNewel.position.set(-16.64, step1TopY + bottomNewelH * 0.5, -0.54);
  bottomNewel.castShadow = true;
  stairGroup.add(bottomNewel);

  const bottomNewelCap = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.122, 0.024, 0.122)),
    strippedBannisterOakMat
  );
  bottomNewelCap.name = 'hall.stairs.bottomNewel.cap';
  bottomNewelCap.position.set(-16.64, step1TopY + bottomNewelH + 0.012, -0.54);
  stairGroup.add(bottomNewelCap);

  addStairNewelDetails(
    'hall.stairs.bottomNewel',
    -16.64,
    -0.54,
    step1TopY,
    step1TopY + 0.24,
    step1TopY + bottomNewelH - 0.12,
    step1TopY + bottomNewelH
  );

  // Sloped Stripped-Oak Lower Handrail with contoured top rail + recessed moulded under-fillet (Issue #13)
  const lowerHandrail = buildPlumbZBeam(
    -0.54,
    -1.62,
    0.834,
    0.878,
    1.674,
    1.718,
    0.068,
    -16.64,
    strippedBannisterOakMat
  );
  lowerHandrail.name = 'hall.stairs.lowerHandrail';
  stairGroup.add(lowerHandrail);

  const lowerHandrailFillet = tagHighLod(
    buildPlumbZBeam(
      -0.54,
      -1.62,
      0.818,
      0.834,
      1.658,
      1.674,
      0.052,
      -16.64,
      strippedBannisterOakMat
    )
  );
  lowerHandrailFillet.name = 'hall.stairs.lowerHandrail.underFillet';
  stairGroup.add(lowerHandrailFillet);

  // 7 Slender 16mm Matt Black Wrought/Cast Iron Balusters (Spindles) + base shoes & central forged collar knuckles (Issue #13)
  const lowerPitchAngle = Math.atan2(lowerStringerDy, lowerStringerDz);
  for (let b = 0; b < 7; b++) {
    const bt = (b + 0.5) / 7;
    const bz = -0.62 - bt * 0.92;
    const tZ = (-0.54 - bz) / lowerStringerDz;
    const strY = 0.145 + tZ * lowerStringerDy;
    const railY = 0.83 + tZ * lowerStringerDy;
    const midY = (strY + railY) * 0.5;
    const baluster = new THREE.Mesh(spindleGeo, blackIronSpindleMat);
    baluster.name = `hall.stairs.lowerSpindle.${b + 1}`;
    baluster.position.set(-16.64, midY, bz);
    baluster.castShadow = true;
    stairGroup.add(baluster);

    const baseShoe = tagHighLod(new THREE.Mesh(spindleBaseShoeGeo, blackIronSpindleMat));
    baseShoe.name = `hall.stairs.lowerSpindle.${b + 1}.baseShoe`;
    baseShoe.position.set(-16.64, strY + 0.008, bz);
    baseShoe.rotation.x = lowerPitchAngle;
    stairGroup.add(baseShoe);

    const collarKnuckle = tagHighLod(new THREE.Mesh(spindleCollarGeo, blackIronSpindleMat));
    collarKnuckle.name = `hall.stairs.lowerSpindle.${b + 1}.collarKnuckle`;
    collarKnuckle.position.set(-16.64, midY, bz);
    stairGroup.add(collarKnuckle);
  }

  // 2. Intermediate Corner Stripped-Oak Newel Post at the Quarter-Landing Turn (X = -16.64m, Z = -1.63m — Issue #13)
  const cornerNewelBottomY = 0.58;
  const cornerNewelTopY = 1.76;
  const cornerNewelH = cornerNewelTopY - cornerNewelBottomY;
  const cornerNewel = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.092, cornerNewelH, 0.096)),
    strippedBannisterOakMat
  );
  cornerNewel.name = 'hall.stairs.cornerNewel';
  cornerNewel.position.set(-16.64, (cornerNewelBottomY + cornerNewelTopY) * 0.5, -1.63);
  cornerNewel.castShadow = true;
  stairGroup.add(cornerNewel);

  const cornerNewelCap = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.124, 0.024, 0.128)),
    strippedBannisterOakMat
  );
  cornerNewelCap.name = 'hall.stairs.cornerNewel.cap';
  cornerNewelCap.position.set(-16.64, cornerNewelTopY + 0.012, -1.63);
  stairGroup.add(cornerNewelCap);

  addStairNewelDetails(
    'hall.stairs.cornerNewel',
    -16.64,
    -1.63,
    quarterLandingY,
    quarterLandingY + 0.18,
    cornerNewelTopY - 0.12,
    cornerNewelTopY
  );

  const cornerNewelDropNeck = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.106, 0.016, 0.11)),
      strippedBannisterOakMat
    )
  );
  cornerNewelDropNeck.name = 'hall.stairs.cornerNewel.dropNeckRing';
  cornerNewelDropNeck.position.set(-16.64, cornerNewelBottomY + 0.018, -1.63);
  stairGroup.add(cornerNewelDropNeck);

  const cornerNewelDropCap = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.12, 0.022, 0.124)),
    strippedBannisterOakMat
  );
  cornerNewelDropCap.name = 'hall.stairs.cornerNewel.dropCap';
  cornerNewelDropCap.position.set(-16.64, cornerNewelBottomY - 0.011, -1.63);
  stairGroup.add(cornerNewelDropCap);

  const cornerNewelDropPendant = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.088, 0.016, 0.092)),
      strippedBannisterOakMat
    )
  );
  cornerNewelDropPendant.name = 'hall.stairs.cornerNewel.dropPendant';
  cornerNewelDropPendant.position.set(-16.64, cornerNewelBottomY - 0.03, -1.63);
  stairGroup.add(cornerNewelDropPendant);

  // 3. Upper Flight turning 90° East (+X) along the North wall (Z = -2.49m..-1.66m, X = -16.64m..-15.36m)
  //    Rises from quarterLandingY = +0.84m to First Floor Landing floorTopY = +2.16m (6 risers of 0.22m = 1.32m)
  const upperBalustradeEndX = -15.5;
  const upperEndX = -15.36;
  const upperOpenSteps = 5;
  const upperStepRun = (upperBalustradeEndX - -16.64) / upperOpenSteps; // 1.14 / 5 = 0.228m
  const upperStepRise = 0.22; // 6 * 0.22m = 1.32m (from Y = 0.84m to Y = 2.16m flush with First Floor Landing!)

  const upperCarriageShape = new THREE.Shape();
  upperCarriageShape.moveTo(-16.64, 0.755);
  upperCarriageShape.lineTo(-16.64, quarterLandingY);
  for (let i = 0; i < upperOpenSteps; i++) {
    const sx0 = -16.64 + i * upperStepRun;
    const sx1 = -16.64 + (i + 1) * upperStepRun;
    const sy1 = quarterLandingY + (i + 1) * upperStepRise;
    upperCarriageShape.lineTo(sx0, sy1);
    upperCarriageShape.lineTo(sx1, sy1);
  }
  // Top landing arrival step flush with First Floor Landing (X = -15.50m..-15.36m, Y = 2.16m)
  // Underside stays 15mm clear above openSlopedSoffit and stops at X = -15.38m below the 28mm nosing so it never Z-fights at X = -15.36m (Issue #5)
  const topStepY = quarterLandingY + (upperOpenSteps + 1) * upperStepRise; // 2.16m = floorTopY
  upperCarriageShape.lineTo(upperBalustradeEndX, topStepY);
  upperCarriageShape.lineTo(upperEndX, topStepY);
  upperCarriageShape.lineTo(upperEndX, topStepY - 0.028);
  upperCarriageShape.lineTo(upperEndX - 0.022, topStepY - 0.028);
  upperCarriageShape.lineTo(upperEndX - 0.022, topStepY - 0.115);
  upperCarriageShape.closePath();

  const upperCarriageGeo = new THREE.ExtrudeGeometry(upperCarriageShape, {
    depth: 0.826,
    bevelEnabled: false,
  });
  upperCarriageGeo.translate(0, 0, -2.486);
  createSharedGeo(upperCarriageGeo);
  // Solid Antique Oak upper stair treads & risers flanking the central runner carpet (Issue #16)
  const upperCarriageMesh = new THREE.Mesh(upperCarriageGeo, antiqueOakSkirtingMat);
  upperCarriageMesh.name = 'hall.stairs.upperCarriage';
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
  applyWorldSpaceCarpetUVs(upperRunnerGeo, 0, 0, 0);
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
    createSharedGeo(borderGeo);
    const borderMesh = new THREE.Mesh(borderGeo, stairRunnerBorderMat);
    borderMesh.name = `hall.stairs.runner.upperFlightBorder.${side < 0 ? 'north' : 'south'}`;
    stairGroup.add(borderMesh);
  }

  for (let i = 0; i < upperOpenSteps; i++) {
    const rodX = -16.64 + i * upperStepRun - 0.01;
    const rodY = quarterLandingY + i * upperStepRise + 0.012;
    const upperRod = tagHighLod(new THREE.Mesh(stairRodGeo, brassMat));
    upperRod.name = `hall.stairs.upperStairRod.${i + 1}`;
    upperRod.rotation.x = Math.PI * 0.5;
    upperRod.position.set(rodX, rodY, -2.075);
    stairGroup.add(upperRod);
  }

  // Smooth Painted-White Sloped Soffit Underside Panel + Vertical Arrival Fascia beneath the Upper Flight (Issue #4 & Issue #5)
  // Extruded over Z = -2.488m..-1.655m (clear of stairExposedBrickNorth at Z = -2.490m) with zero LED strip line!
  const soffitShape = new THREE.Shape();
  soffitShape.moveTo(-16.64, 0.69);
  soffitShape.lineTo(-16.64, 0.74);
  soffitShape.lineTo(upperEndX - 0.02, topStepY - 0.13);
  soffitShape.lineTo(upperEndX - 0.02, topStepY - 0.028);
  soffitShape.lineTo(upperEndX, topStepY - 0.028);
  soffitShape.lineTo(upperEndX, topStepY - 0.18);
  soffitShape.closePath();
  const soffitGeo = new THREE.ExtrudeGeometry(soffitShape, {
    depth: 0.833,
    bevelEnabled: false,
  });
  soffitGeo.translate(0, 0, -2.488);
  createSharedGeo(soffitGeo);
  const openSlopedSoffit = new THREE.Mesh(soffitGeo, ceilingWhiteMat);
  openSlopedSoffit.name = 'hall.stairs.upperSoffit';
  openSlopedSoffit.receiveShadow = true;
  stairGroup.add(openSlopedSoffit);

  // Issue #4: Mitered Closed White Outer Stringer on the South (+Z = -1.64m) face of the Upper Flight (X = -16.59m..-15.41m)
  // Matches the exact upper flight pitch up to the First Floor Landing slab at X = -15.36m
  const upperBalustradeJoinX = -15.41;
  const upperSpanDeltaY = ((upperBalustradeJoinX - -16.59) * upperStepRise) / upperStepRun;
  const upperStrShape = new THREE.Shape();
  upperStrShape.moveTo(-16.59, 0.78);
  upperStrShape.lineTo(-16.59, 0.975);
  upperStrShape.lineTo(upperBalustradeJoinX, 0.975 + upperSpanDeltaY);
  upperStrShape.lineTo(upperBalustradeJoinX, 0.78 + upperSpanDeltaY);
  upperStrShape.closePath();
  const upperStrGeo = new THREE.ExtrudeGeometry(upperStrShape, {
    depth: 0.056,
    bevelEnabled: false,
  });
  upperStrGeo.translate(0, 0, -1.668);
  createSharedGeo(upperStrGeo);
  const upperStringer = new THREE.Mesh(upperStrGeo, skirtingMat);
  upperStringer.name = 'hall.stairs.upperStringer';
  upperStringer.castShadow = true;
  stairGroup.add(upperStringer);

  // Stripped-oak shoe rail / capping along the top edge of the upper stringer (Issue #13)
  const upperShoeShape = new THREE.Shape();
  upperShoeShape.moveTo(-16.59, 0.966);
  upperShoeShape.lineTo(-16.59, 0.992);
  upperShoeShape.lineTo(upperBalustradeJoinX, 0.992 + upperSpanDeltaY);
  upperShoeShape.lineTo(upperBalustradeJoinX, 0.966 + upperSpanDeltaY);
  upperShoeShape.closePath();
  const upperShoeGeo = new THREE.ExtrudeGeometry(upperShoeShape, {
    depth: 0.062,
    bevelEnabled: false,
  });
  upperShoeGeo.translate(0, 0, -1.671);
  createSharedGeo(upperShoeGeo);
  const upperStringerShoeRail = new THREE.Mesh(upperShoeGeo, strippedBannisterOakMat);
  upperStringerShoeRail.name = 'hall.stairs.upperStringer.shoeRail';
  upperStringerShoeRail.castShadow = true;
  stairGroup.add(upperStringerShoeRail);

  // Issue #13: Parallel Mitered Stripped-Oak Upper Handrail with contoured top rail + recessed under-fillet along Z = -1.64m
  const upperRailShape = new THREE.Shape();
  upperRailShape.moveTo(-16.59, 1.674);
  upperRailShape.lineTo(-16.59, 1.718);
  upperRailShape.lineTo(upperBalustradeJoinX, 1.718 + upperSpanDeltaY);
  upperRailShape.lineTo(upperBalustradeJoinX, 1.674 + upperSpanDeltaY);
  upperRailShape.closePath();
  const upperRailGeo = new THREE.ExtrudeGeometry(upperRailShape, {
    depth: 0.068,
    bevelEnabled: false,
  });
  upperRailGeo.translate(0, 0, -1.674);
  createSharedGeo(upperRailGeo);
  const upperHandrail = new THREE.Mesh(upperRailGeo, strippedBannisterOakMat);
  upperHandrail.name = 'hall.stairs.upperHandrail';
  upperHandrail.castShadow = true;
  stairGroup.add(upperHandrail);

  const upperFilletShape = new THREE.Shape();
  upperFilletShape.moveTo(-16.59, 1.658);
  upperFilletShape.lineTo(-16.59, 1.674);
  upperFilletShape.lineTo(upperBalustradeJoinX, 1.674 + upperSpanDeltaY);
  upperFilletShape.lineTo(upperBalustradeJoinX, 1.658 + upperSpanDeltaY);
  upperFilletShape.closePath();
  const upperFilletGeo = new THREE.ExtrudeGeometry(upperFilletShape, {
    depth: 0.052,
    bevelEnabled: false,
  });
  upperFilletGeo.translate(0, 0, -1.666);
  createSharedGeo(upperFilletGeo);
  const upperHandrailFillet = tagHighLod(
    new THREE.Mesh(upperFilletGeo, strippedBannisterOakMat)
  );
  upperHandrailFillet.name = 'hall.stairs.upperHandrail.underFillet';
  stairGroup.add(upperHandrailFillet);

  // 7 Slender 16mm Matt Black Wrought/Cast Iron Balusters (Spindles) + base shoes & central forged collar knuckles (Issue #13)
  const upperPitchAngle = Math.atan2(upperStepRise, upperStepRun);
  for (let ub = 0; ub < 7; ub++) {
    const ut = (ub + 0.5) / 7;
    const bx = -16.59 + ut * (upperBalustradeJoinX - -16.59);
    const bBottomY = 0.975 + ut * upperSpanDeltaY;
    const bTopY = 1.665 + ut * upperSpanDeltaY;
    const midY = (bBottomY + bTopY) * 0.5;
    const baluster = new THREE.Mesh(spindleGeo, blackIronSpindleMat);
    baluster.name = `hall.stairs.upperSpindle.${ub + 1}`;
    baluster.position.set(bx, midY, -1.64);
    baluster.castShadow = true;
    stairGroup.add(baluster);

    const baseShoe = tagHighLod(new THREE.Mesh(spindleBaseShoeGeo, blackIronSpindleMat));
    baseShoe.name = `hall.stairs.upperSpindle.${ub + 1}.baseShoe`;
    baseShoe.position.set(bx, bBottomY + 0.008, -1.64);
    baseShoe.rotation.z = upperPitchAngle;
    stairGroup.add(baseShoe);

    const collarKnuckle = tagHighLod(new THREE.Mesh(spindleCollarGeo, blackIronSpindleMat));
    collarKnuckle.name = `hall.stairs.upperSpindle.${ub + 1}.collarKnuckle`;
    collarKnuckle.position.set(bx, midY, -1.64);
    stairGroup.add(collarKnuckle);
  }

  // Signature Hanging Stripped-Oak Newel Post with Detailed Drop-Pendant Finial at X = -15.38m, Z = -1.64m (Issue #13)
  // Anchors the top of the Upper Flight handrail & stringer directly into the First Floor Landing gallery rail (Y = 1.76m..3.12m)
  const hangingPostBottomY = 1.76;
  const hangingPostTopY = topStepY + 0.96;
  const hangingPostH = hangingPostTopY - hangingPostBottomY;
  const hangingPostPendant = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.088, hangingPostH, 0.088)),
    strippedBannisterOakMat
  );
  hangingPostPendant.name = 'hall.stairs.hangingNewelPost';
  hangingPostPendant.position.set(
    -15.38,
    (hangingPostBottomY + hangingPostTopY) * 0.5,
    -1.64
  );
  hangingPostPendant.castShadow = true;
  stairGroup.add(hangingPostPendant);

  const hangingPostDropNeck = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.104, 0.016, 0.104)),
      strippedBannisterOakMat
    )
  );
  hangingPostDropNeck.name = 'hall.stairs.hangingNewelPost.dropNeckRing';
  hangingPostDropNeck.position.set(-15.38, hangingPostBottomY + 0.018, -1.64);
  stairGroup.add(hangingPostDropNeck);

  const hangingPostCap = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.118, 0.022, 0.118)),
    strippedBannisterOakMat
  );
  hangingPostCap.name = 'hall.stairs.hangingNewelPost.cap';
  hangingPostCap.position.set(-15.38, hangingPostBottomY - 0.011, -1.64);
  stairGroup.add(hangingPostCap);

  const hangingPostPendantStep = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.092, 0.014, 0.092)),
      strippedBannisterOakMat
    )
  );
  hangingPostPendantStep.name = 'hall.stairs.hangingNewelPost.pendantStep';
  hangingPostPendantStep.position.set(-15.38, hangingPostBottomY - 0.029, -1.64);
  stairGroup.add(hangingPostPendantStep);

  const hangingPostPendantTip = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.064, 0.014, 0.064)),
      strippedBannisterOakMat
    )
  );
  hangingPostPendantTip.name = 'hall.stairs.hangingNewelPost.pendantTip';
  hangingPostPendantTip.position.set(-15.38, hangingPostBottomY - 0.043, -1.64);
  stairGroup.add(hangingPostPendantTip);

  // White-Plastered Ceiling Stairwell Trimmer Fascia & Apron along the First Floor gallery edge (X = -15.36m, Z = -1.65m..-0.58m)
  // Leaves the Upper Flight arrival threshold (Z = -2.50m..-1.65m at X = -15.36m, Y = 2.16m) 100% open!
  const trimmerTopY = topStepY - 0.002;
  const trimmerH = trimmerTopY - 1.92;
  const stairwellEastTrimmer = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.052, trimmerH, 1.07)),
    ceilingWhiteMat
  );
  stairwellEastTrimmer.name = 'hall.stairs.eastTrimmer';
  stairwellEastTrimmer.position.set(-15.36, 1.92 + trimmerH / 2, -1.115);
  stairwellEastTrimmer.castShadow = true;
  stairGroup.add(stairwellEastTrimmer);

  // Issue #5, Issue #1 & Issue #2: Continuous Seasoned Oak Wall Stringer (`antiqueOakSkirtingMat`) wrapping along the North Wall
  // across the Quarter Landing (X = -17.43m..-16.84m, Y = 0.84m..0.986m), climbing up the North Exposed Brick Wall
  // alongside the second span of stairs (X = -16.84m..-15.50m, rising to Y = topStepY + 0.146m), and continuing seamlessly
  // horizontally across the First Floor Landing North Wall all the way to X = -13.05m!
  {
    const skirtBoardH = 0.122;
    const northTurnX = -16.84;
    const landingNorthEndX = -13.05;

    const northStrShape = new THREE.Shape();
    northStrShape.moveTo(-17.43, quarterLandingY - 0.02);
    northStrShape.lineTo(-17.43, quarterLandingY + skirtBoardH);
    northStrShape.lineTo(northTurnX, quarterLandingY + skirtBoardH);
    northStrShape.lineTo(upperBalustradeEndX, topStepY + skirtBoardH);
    northStrShape.lineTo(landingNorthEndX, topStepY + skirtBoardH);
    northStrShape.lineTo(landingNorthEndX, topStepY);
    northStrShape.lineTo(upperEndX, topStepY);
    northStrShape.lineTo(upperEndX, topStepY - 0.04);
    northStrShape.lineTo(-16.64, quarterLandingY - 0.04);
    northStrShape.closePath();

    const northStrGeo = new THREE.ExtrudeGeometry(northStrShape, {
      depth: 0.022,
      bevelEnabled: false,
    });
    northStrGeo.translate(0, 0, -2.5);
    createSharedGeo(northStrGeo);
    const northWallStringer = new THREE.Mesh(northStrGeo, antiqueOakSkirtingMat);
    northWallStringer.name = 'hall.stairs.northWallStringer.board';
    northWallStringer.castShadow = true;
    northWallStringer.receiveShadow = true;
    stairGroup.add(northWallStringer);

    // Stepped ogee/torus oak skirting cap swept along the North Quarter-Landing, Upper-Flight Stringer, and First Floor Landing top edge,
    // mitred where the landing run turns up the second flight and where it levels out across the First Floor landing.
    const northCapGeo = createSharedGeo(
      buildSweptMouldingGeometry(
        createSkirtingCapProfile(),
        [
          [-17.43, quarterLandingY + skirtBoardH],
          [northTurnX, quarterLandingY + skirtBoardH],
          [upperBalustradeEndX, topStepY + skirtBoardH],
          [landingNorthEndX, topStepY + skirtBoardH],
        ],
        (a, y, d) => new THREE.Vector3(a, y, -2.5 + d)
      )
    );
    const northWallStringerCap = new THREE.Mesh(northCapGeo, antiqueOakSkirtingMat);
    northWallStringerCap.name = 'hall.stairs.northWallStringer.cap';
    northWallStringerCap.castShadow = true;
    northWallStringerCap.receiveShadow = true;
    stairGroup.add(northWallStringerCap);

    // Step lights continue up the stairs: one on the Quarter Landing and one above each Upper Flight tread,
    // set into the North stringer board face (Z = -2.478m) and facing South (+Z) across the treads.
    const northBoardFaceZ = -2.478;
    const landingLightX = -17.14;
    stairGroup.add(
      buildStepLightUnit(
        'hall.stairs.stepLight.landing',
        landingLightX,
        quarterLandingY + 0.055,
        northBoardFaceZ + 0.001,
        1
      )
    );
    ctx.addGlowPool(
      'hallStairLeds',
      landingLightX,
      quarterLandingY + 0.004,
      northBoardFaceZ + 0.2,
      0.17,
      0.34
    );
    for (let i = 0; i < upperOpenSteps; i++) {
      const treadCenterX = -16.64 + (i + 0.5) * upperStepRun;
      const treadTopY = quarterLandingY + (i + 1) * upperStepRise;
      stairGroup.add(
        buildStepLightUnit(
          `hall.stairs.stepLight.upper.${i + 1}`,
          treadCenterX,
          treadTopY + 0.055,
          northBoardFaceZ + 0.001,
          1
        )
      );
      ctx.addGlowPool(
        'hallStairLeds',
        treadCenterX,
        treadTopY + 0.004,
        northBoardFaceZ + 0.2,
        0.15,
        0.34
      );
    }
  }

  // North Wall Polygonal Brick Panel above the Quarter Landing and Upper Flight Oak Stringer
  // (Issue #15: West Cross-Wall Exposed Brick Panel at [-17.436, 1.547, -1.857] removed!)
  const brickNorthShape = new THREE.Shape();
  brickNorthShape.moveTo(-17.48, quarterLandingY + 0.142);
  brickNorthShape.lineTo(-16.84, quarterLandingY + 0.142);
  brickNorthShape.lineTo(upperBalustradeEndX, topStepY + 0.142);
  brickNorthShape.lineTo(-17.48, topStepY + 0.142);
  brickNorthShape.closePath();
  const stairExposedBrickNorthGeo = new THREE.ExtrudeGeometry(brickNorthShape, {
    depth: 0.012,
    bevelEnabled: false,
  });
  stairExposedBrickNorthGeo.translate(0, 0, -2.502);
  applyWorldSpaceBrickUVs(stairExposedBrickNorthGeo, 0, 0, 0);
  createSharedGeo(stairExposedBrickNorthGeo);
  const stairExposedBrickNorth = new THREE.Mesh(stairExposedBrickNorthGeo, exteriorBrickMat);
  stairExposedBrickNorth.name = 'hall.stairs.northExposedBrick';
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

  // Exposed Natural Oak Timber Ceiling Spine Beam & Joists in Entrance Hall (Issue #7: aligned with shifted hallSpinePost at Z = +0.46m)
  // Spans X = -17.68m..-13.00m, bearing into the angled West Cross-Wall and East Cross-Wall / hallSpinePost!
  const hallSpineBeam = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(4.68, 0.18, 0.19)),
    oakMat
  );
  hallSpineBeam.name = 'hall.spineBeam';
  hallSpineBeam.position.set(-15.34, wallH - 0.14, 0.46);
  hallSpineBeam.castShadow = true;
  hallSpineBeam.receiveShadow = true;
  groundFloorCeilingGroup.add(hallSpineBeam);

  // North-South Ceiling Trimmer Beam along the stairwell gallery edge (X = -15.36m, Z = -2.50m..+0.46m):
  // Spans continuously from the North exterior brick wall (Z = -2.50m) over `hangingNewelPost` (Z = -1.64m)
  // right into `hallSpineBeam` (Z = +0.46m), supporting both the upper landing arrival edge and the stairwell void!
  const hallStairTrimmerBeam = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.16, 0.16, 2.98)),
    oakMat
  );
  hallStairTrimmerBeam.name = 'hall.stairTrimmerBeam';
  hallStairTrimmerBeam.position.set(-15.36, wallH - 0.12, -1.02);
  hallStairTrimmerBeam.castShadow = true;
  groundFloorCeilingGroup.add(hallStairTrimmerBeam);

  // Painted-white plasterboard ceiling backing above the Main Hall oak joists (Issue #3, wrapping around the open stairwell void)
  const hallSouthCeilingBacking = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(4.84, 0.036, 3.12)),
    ceilingWhiteMat
  );
  hallSouthCeilingBacking.name = 'hall.ceilingBacking.south';
  hallSouthCeilingBacking.position.set(-15.45, wallH - 0.005, 0.98);
  hallSouthCeilingBacking.receiveShadow = true;
  groundFloorCeilingGroup.add(hallSouthCeilingBacking);

  const hallNorthEastCeilingBacking = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(2.3, 0.036, 2.1)),
    ceilingWhiteMat
  );
  hallNorthEastCeilingBacking.name = 'hall.ceilingBacking.northEast';
  hallNorthEastCeilingBacking.position.set(-14.2, wallH - 0.005, -1.61);
  hallNorthEastCeilingBacking.receiveShadow = true;
  groundFloorCeilingGroup.add(hallNorthEastCeilingBacking);

  // Exposed Natural Oak North-South Ceiling Joists South of the Spine Beam (Z = +0.46m..+2.42m, bearing into `hallSpineBeam` and the Z = +2.40m South exterior brick wall!)
  const southJoistGeo = createSharedGeo(new THREE.BoxGeometry(0.095, 0.11, 1.96));
  for (let jx = -17.35; jx <= -13.25; jx += 0.44) {
    const joist = new THREE.Mesh(southJoistGeo, oakMat);
    joist.name = 'hall.ceilingJoist.south';
    joist.position.set(jx, wallH - 0.07, 1.44);
    joist.castShadow = true;
    groundFloorCeilingGroup.add(joist);
  }
  // Exposed Natural Oak Ceiling Joists North of the Spine Beam (Z = -2.50m..+0.46m, X = -14.98m..-13.66m between `hallStairTrimmerBeam` and the Hall Inglenook Chimney Breast!)
  const northJoistGeo = createSharedGeo(new THREE.BoxGeometry(0.095, 0.11, 2.96));
  for (let jx = -14.98; jx <= -13.65; jx += 0.44) {
    const northJoist = new THREE.Mesh(northJoistGeo, oakMat);
    northJoist.name = 'hall.ceilingJoist.north';
    northJoist.position.set(jx, wallH - 0.07, -1.02);
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

  const spkW = 0.138;
  const spkH = 0.218;
  const spkD = 0.198;
  const spkFootGeo = createSharedGeo(new THREE.CylinderGeometry(0.01, 0.01, 0.005, 10));
  const spkCabBodyGeo = createSharedGeo(new THREE.BoxGeometry(spkW, spkH - 0.014, spkD - 0.012));
  const spkCabWrapGeo = createSharedGeo(new THREE.BoxGeometry(spkW - 0.014, spkH, spkD - 0.012));
  const spkBaffleGeo = createSharedGeo(new THREE.BoxGeometry(spkW - 0.01, spkH - 0.01, 0.014));
  const spkWooferRingGeo = createSharedGeo(new THREE.TorusGeometry(0.046, 0.0038, 10, 24));
  const spkWooferConeGeo = createSharedGeo(new THREE.CylinderGeometry(0.043, 0.018, 0.013, 20));
  const spkTweeterRingGeo = createSharedGeo(new THREE.TorusGeometry(0.02, 0.003, 10, 20));
  const spkTweeterDomeGeo = createSharedGeo(new THREE.SphereGeometry(0.0115, 12, 10));
  const spkBadgeGeo = createSharedGeo(new THREE.BoxGeometry(0.02, 0.007, 0.002));

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

    // 4 low-profile acoustic isolation rubber feet (5mm tall)
    for (const [fIdx, [fx, fz]] of (
      [
        [-0.048, -0.075],
        [0.048, -0.075],
        [-0.048, 0.075],
        [0.048, 0.075],
      ] as const
    ).entries()) {
      const foot = tagHighLod(new THREE.Mesh(spkFootGeo, spkBaffleMat));
      foot.name = `${spkName}.foot.${fIdx + 1}`;
      foot.position.set(fx, 0.0025, fz);
      spkGroup.add(foot);
    }

    // Rounded-edge cabinet body (main core + chamfered top/bottom/side wrap)
    const cabBody = new THREE.Mesh(spkCabBodyGeo, spkWalnutCabinetMat);
    cabBody.name = `${spkName}.cabinet`;
    cabBody.position.set(0, 0.005 + spkH * 0.5, 0.006);
    cabBody.castShadow = true;
    cabBody.receiveShadow = true;
    spkGroup.add(cabBody);

    const cabTopBot = new THREE.Mesh(spkCabWrapGeo, spkWalnutCabinetMat);
    cabTopBot.name = `${spkName}.cabinetWrap`;
    cabTopBot.position.set(0, 0.005 + spkH * 0.5, 0.006);
    spkGroup.add(cabTopBot);

    // Satin dark front baffle plate facing local -Z
    const frontBaffle = new THREE.Mesh(spkBaffleGeo, spkBaffleMat);
    frontBaffle.name = `${spkName}.baffle`;
    frontBaffle.position.set(0, 0.005 + spkH * 0.5, -spkD * 0.5 + 0.007);
    frontBaffle.castShadow = true;
    spkGroup.add(frontBaffle);

    const baffleFrontZ = -spkD * 0.5 - 0.001;

    // 100mm Mid/Bass Driver (lower center of baffle) + brushed metal trim ring
    const wooferRing = tagHighLod(new THREE.Mesh(spkWooferRingGeo, spkTrimRingMat));
    wooferRing.name = `${spkName}.wooferRing`;
    wooferRing.position.set(0, 0.092, baffleFrontZ);
    spkGroup.add(wooferRing);

    const wooferCone = tagHighLod(new THREE.Mesh(spkWooferConeGeo, spkConeMat));
    wooferCone.name = `${spkName}.wooferCone`;
    wooferCone.rotation.x = Math.PI / 2;
    wooferCone.position.set(0, 0.092, baffleFrontZ + 0.004);
    spkGroup.add(wooferCone);

    // 22mm Decoupled High-Frequency Dome Tweeter (upper baffle) + trim ring
    const tweeterRing = tagHighLod(new THREE.Mesh(spkTweeterRingGeo, spkTrimRingMat));
    tweeterRing.name = `${spkName}.tweeterRing`;
    tweeterRing.position.set(0, 0.174, baffleFrontZ);
    spkGroup.add(tweeterRing);

    const tweeterDome = tagHighLod(new THREE.Mesh(spkTweeterDomeGeo, spkConeMat));
    tweeterDome.name = `${spkName}.tweeterDome`;
    tweeterDome.scale.set(1, 1, 0.45);
    tweeterDome.position.set(0, 0.174, baffleFrontZ - 0.002);
    spkGroup.add(tweeterDome);

    // Signature small silver Q Acoustics logo badge at bottom center of front baffle
    const qBadge = tagHighLod(new THREE.Mesh(spkBadgeGeo, spkTrimRingMat));
    qBadge.name = `${spkName}.badge`;
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
