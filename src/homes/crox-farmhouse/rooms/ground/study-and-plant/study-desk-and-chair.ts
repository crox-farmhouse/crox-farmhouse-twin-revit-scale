import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../../types/scene.ts';
import type { createGroundFloorMaterials } from '../../../structure/ground-floor-materials.ts';
import type { defineTier2Levels } from '../../../structure/tier2-levels.ts';

function createSharedGeo<T extends THREE.BufferGeometry>(geo: T): T {
  geo.computeBoundingSphere();
  return geo;
}

function tagHighLod<T extends THREE.Object3D>(obj: T, maxDistance = 12): T {
  obj.userData.lodTier = 'high';
  obj.userData.lodMaxDistance = maxDistance;
  return obj;
}

export type StudyDeskAndChairKit = Pick<
  ReturnType<typeof createGroundFloorMaterials>,
  'antiqueOakSkirtingMat' | 'brassMat' | 'castIronMat'
> &
  Pick<ReturnType<typeof defineTier2Levels>, 'tier2FloorY'>;

/**
 * Study L-shaped solid antique oak corner desk, 3-drawer Shaker pedestal,
 * sculpted saddle-leather & steam-bent oak executive swivel chair, and duplex colour laser printer.
 */
export function buildStudyDeskAndChair(
  _ctx: SceneBuilderContext,
  kit: StudyDeskAndChairKit
): {
  deskGroup: THREE.Group;
  deskH: number;
} {
  const { antiqueOakSkirtingMat, brassMat, castIronMat, tier2FloorY } = kit;

  const deskGroup = new THREE.Group();
  deskGroup.name = 'study.southWallDesk';
  deskGroup.userData.zone = 'study';

  const deskPedestalMat = new THREE.MeshStandardMaterial({
    color: 0xdad4c8, // Matching heritage painted Shaker joinery
    roughness: 0.48,
    metalness: 0.02,
  });
  const deskDrawerTrimMat = new THREE.MeshStandardMaterial({
    color: 0xcbc4b6,
    roughness: 0.52,
  });

  const deskMinX = -22.18;
  const deskMaxX = -19.44;
  const deskW = deskMaxX - deskMinX; // 2.74m long along South wall (reaching West wall at X = -22.18m)
  const deskCenterX = (deskMinX + deskMaxX) / 2; // -20.81m
  const deskD = 0.64;
  const deskCenterZ = 11.48 - deskD / 2; // 11.16m (spans Z = 10.84m..11.48m)
  const deskH = 0.76;

  // 1. Primary South-Wall Solid Antique Oak Worktop Slab (2.74m W x 0.042m H x 0.64m D)
  const oakWorktop = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(deskW, 0.042, deskD)),
    antiqueOakSkirtingMat
  );
  oakWorktop.name = 'study.southWallDesk.oakWorktop';
  oakWorktop.position.set(deskCenterX, tier2FloorY + deskH - 0.021, deskCenterZ);
  oakWorktop.castShadow = true;
  oakWorktop.receiveShadow = true;
  deskGroup.add(oakWorktop);

  // Solid oak upstand rail along the back South wall edge of the worktop
  const oakUpstand = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(deskW, 0.055, 0.022)),
    antiqueOakSkirtingMat
  );
  oakUpstand.name = 'study.southWallDesk.southOakUpstand';
  oakUpstand.position.set(deskCenterX, tier2FloorY + deskH + 0.026, 11.468);
  deskGroup.add(oakUpstand);

  // 2. Issue #14 & Issue #1: L-Shaped Corner Desk West-Wall Return Leg shortened to Z = 9.58m..10.84m
  //    (1.26m span instead of 1.66m) to provide generous servicing clearance in front of the West Viessmann Boiler
  const returnMinZ = 9.58;
  const returnMaxZ = 10.84;
  const returnLenZ = returnMaxZ - returnMinZ; // 1.26m running North along West wall
  const returnCenterZ = (returnMinZ + returnMaxZ) * 0.5; // 10.21m
  const returnCenterX = -22.18 + deskD * 0.5; // -21.86m

  const westReturnWorktop = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(deskD, 0.042, returnLenZ)),
    antiqueOakSkirtingMat
  );
  westReturnWorktop.name = 'study.southWallDesk.westReturnWorktop';
  westReturnWorktop.position.set(returnCenterX, tier2FloorY + deskH - 0.021, returnCenterZ);
  westReturnWorktop.castShadow = true;
  westReturnWorktop.receiveShadow = true;
  deskGroup.add(westReturnWorktop);

  // Solid oak upstand rail along the West wall edge (X = -22.17m, Z = 9.58m..11.46m)
  const westOakUpstand = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.022, 0.055, 1.88)),
    antiqueOakSkirtingMat
  );
  westOakUpstand.name = 'study.southWallDesk.westOakUpstand';
  westOakUpstand.position.set(-22.168, tier2FloorY + deskH + 0.026, 10.52);
  deskGroup.add(westOakUpstand);

  // 3. Issue #15 & Issue #1: Single 3-Drawer Shaker Pedestal at the North end of the shortened West L-Desk Return
  //    (X = -21.86m, Z = 9.85m, facing East +X) + recessed corner support leg so the entire under-desk area
  //    is one large uninterrupted open kneehole space!
  const pedW = 0.52;
  const pedH = deskH - 0.042; // 0.718m
  const pedD = deskD - 0.03; // 0.61m
  const pedZ = 9.85;
  const pedestal = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(pedD, pedH, pedW)),
    deskPedestalMat
  );
  pedestal.name = 'study.southWallDesk.pedestal.1';
  pedestal.position.set(returnCenterX - 0.01, tier2FloorY + pedH / 2, pedZ);
  pedestal.castShadow = true;
  pedestal.receiveShadow = true;
  deskGroup.add(pedestal);

  // 3 graduated Shaker drawer fronts on the East (+X) face of the North-West pedestal + aged brass cup pulls
  const cupPullGeo = createSharedGeo(new THREE.BoxGeometry(0.018, 0.028, 0.082));
  for (const [dIdx, dy, dh] of [
    [1, 0.6, 0.16],
    [2, 0.4, 0.2],
    [3, 0.17, 0.23],
  ] as const) {
    const drawerFront = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.022, dh, pedW - 0.04)),
      deskDrawerTrimMat
    );
    drawerFront.name = `study.southWallDesk.pedestal.1.drawer.${dIdx}`;
    drawerFront.position.set(returnCenterX + pedD / 2, tier2FloorY + dy, pedZ);
    drawerFront.castShadow = true;
    deskGroup.add(drawerFront);

    const cupPull = tagHighLod(
      new THREE.Mesh(cupPullGeo, brassMat)
    );
    cupPull.name = `study.southWallDesk.pedestal.1.drawer.${dIdx}.cupPull`;
    cupPull.position.set(returnCenterX + pedD / 2 + 0.016, tier2FloorY + dy, pedZ);
    deskGroup.add(cupPull);
  }

  // Discreet Shaker corner support panel against the SW wall corner (X = -22.12m, Z = 11.42m)
  const swCornerPost = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.09, pedH, 0.09)),
    deskPedestalMat
  );
  swCornerPost.name = 'study.southWallDesk.swCornerPost';
  swCornerPost.position.set(-22.12, tier2FloorY + pedH / 2, 11.42);
  deskGroup.add(swCornerPost);

  // Issue #8: High-LOD Sculpted Ergonomic Saddle-Leather & Steam-Bent Oak Executive Swivel Desk Chair
  // Positioned in the open L-desk corner bay at [-21.05, tier2FloorY, 10.48] (hit point [-20.913, -0.1, 10.449])
  // Issue #7: NO computer monitor / screen on the Study desk!
  const chairGroup = new THREE.Group();
  chairGroup.name = 'study.southWallDesk.chair';
  chairGroup.userData.zone = 'study';
  chairGroup.position.set(-21.05, tier2FloorY, 10.48);
  chairGroup.rotation.y = 0.35;

  const leatherTanMat = new THREE.MeshStandardMaterial({
    color: 0x7c4e2e, // Warm cognac full-grain aniline saddle leather
    roughness: 0.42,
    metalness: 0.04,
  });
  const leatherStitchWeltMat = new THREE.MeshStandardMaterial({
    color: 0x5c361c, // Darker burnished leather piping / welt seam
    roughness: 0.48,
    metalness: 0.03,
  });
  const bentOakShellMat = new THREE.MeshStandardMaterial({
    color: 0x6b4728, // Moulded steam-bent walnut/oak outer shell
    roughness: 0.36,
    metalness: 0.05,
  });
  const brushedAlumChairMat = new THREE.MeshStandardMaterial({
    color: 0x2c3036, // Gunmetal / dark brushed cast aluminum base & arm supports
    roughness: 0.28,
    metalness: 0.78,
  });

  // 1. Sculpted Waterfall Seat Cushion + Bent-Oak Under-Pan + Perimeter Welt Seam (Y = 0.46m..0.52m)
  const seatUnderPan = new THREE.Mesh(
    createSharedGeo(new THREE.CylinderGeometry(0.245, 0.22, 0.028, 24)),
    bentOakShellMat
  );
  seatUnderPan.name = 'study.southWallDesk.chair.seatPan';
  seatUnderPan.scale.set(1.06, 1, 1.02);
  seatUnderPan.position.set(0, 0.448, 0.01);
  seatUnderPan.castShadow = true;
  chairGroup.add(seatUnderPan);

  const chairSeatCushion = new THREE.Mesh(
    createSharedGeo(new THREE.SphereGeometry(0.255, 24, 16)),
    leatherTanMat
  );
  chairSeatCushion.name = 'study.southWallDesk.chair.seatCushion';
  chairSeatCushion.scale.set(1.04, 0.24, 0.98);
  chairSeatCushion.position.set(0, 0.478, 0.01);
  chairSeatCushion.castShadow = true;
  chairSeatCushion.receiveShadow = true;
  chairGroup.add(chairSeatCushion);

  // Rolled waterfall front thigh bolster along the front (+Z) edge of the seat
  const waterfallFrontBolster = new THREE.Mesh(
    createSharedGeo(new THREE.CylinderGeometry(0.036, 0.036, 0.42, 16)),
    leatherTanMat
  );
  waterfallFrontBolster.name = 'study.southWallDesk.chair.waterfallFront';
  waterfallFrontBolster.rotation.z = Math.PI / 2;
  waterfallFrontBolster.scale.set(1, 1, 1.18);
  waterfallFrontBolster.position.set(0, 0.472, 0.225);
  waterfallFrontBolster.castShadow = true;
  chairGroup.add(waterfallFrontBolster);

  // Subtle side seat bolsters (left & right) for contoured bucket-seat ergonomics
  const sideBolsterGeo = createSharedGeo(new THREE.CylinderGeometry(0.028, 0.032, 0.36, 14));
  for (const sideX of [-0.215, 0.215] as const) {
    const sideBolster = new THREE.Mesh(
      sideBolsterGeo,
      leatherTanMat
    );
    sideBolster.name = `study.southWallDesk.chair.sideBolster.${sideX < 0 ? 'left' : 'right'}`;
    sideBolster.rotation.x = Math.PI / 2;
    sideBolster.position.set(sideX, 0.488, 0.0);
    sideBolster.castShadow = true;
    chairGroup.add(sideBolster);
  }

  // Stitched leather perimeter welt piping around the seat cushion
  const seatWelt = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.TorusGeometry(0.238, 0.009, 10, 28)),
      leatherStitchWeltMat
    )
  );
  seatWelt.name = 'study.southWallDesk.chair.seatWelt';
  seatWelt.rotation.x = Math.PI / 2;
  seatWelt.scale.set(1.05, 0.98, 1);
  seatWelt.position.set(0, 0.486, 0.01);
  chairGroup.add(seatWelt);

  // 2. Contoured Lumbar & Ribbed Leather Backrest + Steam-Bent Oak Outer Shell + Headrest Bolster
  const backrestPivot = new THREE.Group();
  backrestPivot.name = 'study.southWallDesk.chair.backrest';
  backrestPivot.position.set(0, 0.48, -0.205);
  backrestPivot.rotation.x = -0.14; // Ergonomic 8° recline angle (tilted back toward -Z)

  // Curved steam-bent oak outer shell backing the leather upholstery
  const outerWoodBackShell = new THREE.Mesh(
    createSharedGeo(
      new THREE.CylinderGeometry(0.225, 0.24, 0.56, 24, 1, false, -Math.PI * 0.38, Math.PI * 0.76)
    ),
    bentOakShellMat
  );
  outerWoodBackShell.name = 'study.southWallDesk.chair.backShell';
  outerWoodBackShell.scale.set(1.06, 1, 0.42);
  outerWoodBackShell.position.set(0, 0.29, -0.095);
  outerWoodBackShell.castShadow = true;
  outerWoodBackShell.receiveShadow = true;
  backrestPivot.add(outerWoodBackShell);

  // Main upholstered leather backrest core
  const backLeatherCore = new THREE.Mesh(
    createSharedGeo(new THREE.SphereGeometry(0.235, 22, 18)),
    leatherTanMat
  );
  backLeatherCore.name = 'study.southWallDesk.chair.backCore';
  backLeatherCore.scale.set(0.98, 1.22, 0.24);
  backLeatherCore.position.set(0, 0.29, 0.0);
  backLeatherCore.castShadow = true;
  backLeatherCore.receiveShadow = true;
  backrestPivot.add(backLeatherCore);

  // 4 horizontal channeled/tufted leather lumbar & thoracic cushions (Eames Soft Pad / executive style)
  const channelRoll39Geo = createSharedGeo(new THREE.CylinderGeometry(0.052, 0.052, 0.39, 16));
  for (const [ribIdx, ribY, ribW, ribDepthZ] of [
    [0, 0.09, 0.39, 0.026], // Lower lumbar support bolster
    [1, 0.21, 0.40, 0.022], // Mid-back cushion channel
    [2, 0.33, 0.39, 0.020], // Upper thoracic cushion channel
    [3, 0.46, 0.36, 0.028], // Integrated top headrest pillow bolster
  ] as const) {
    const channelRoll = new THREE.Mesh(
      ribW === 0.39 ? channelRoll39Geo : createSharedGeo(new THREE.CylinderGeometry(0.052, 0.052, ribW, 16)),
      leatherTanMat
    );
    channelRoll.name = `study.southWallDesk.chair.backCushion.${ribIdx}`;
    channelRoll.rotation.z = Math.PI / 2;
    channelRoll.scale.set(1.08, 1, 0.56);
    channelRoll.position.set(0, ribY, ribDepthZ);
    channelRoll.castShadow = true;
    channelRoll.receiveShadow = true;
    backrestPivot.add(channelRoll);
  }

  // Cast-aluminum spine-bar connecting the under-seat tilt mechanism up to the oak back shell
  const spineBracketVert = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.058, 0.28, 0.022)),
      brushedAlumChairMat
    )
  );
  spineBracketVert.name = 'study.southWallDesk.chair.spineBracket';
  spineBracketVert.position.set(0, 0.11, -0.048);
  spineBracketVert.castShadow = true;
  backrestPivot.add(spineBracketVert);

  chairGroup.add(backrestPivot);

  // 3. Sculpted Cast-Aluminum Loop Armrests with Padded Saddle-Leather Arm Pads (Left & Right)
  const armUprightGeo = createSharedGeo(new THREE.CylinderGeometry(0.014, 0.018, 0.21, 14));
  const armUnderSparGeo = createSharedGeo(new THREE.CylinderGeometry(0.013, 0.013, 0.09, 12));
  const armRearLoopGeo = createSharedGeo(new THREE.CylinderGeometry(0.012, 0.012, 0.18, 12));
  const armLeatherPadGeo = createSharedGeo(new THREE.CylinderGeometry(0.026, 0.026, 0.25, 16));
  for (const side of [-1, 1] as const) {
    const armX = side * 0.255;
    const sideKey = side < 0 ? 'left' : 'right';

    // Swept vertical aluminum arm upright rising from under the seat pan
    const armUpright = new THREE.Mesh(
      armUprightGeo,
      brushedAlumChairMat
    );
    armUpright.name = 'study.southWallDesk.chair.armUpright';
    armUpright.position.set(armX, 0.565, -0.02);
    armUpright.rotation.z = -side * 0.08;
    armUpright.castShadow = true;
    chairGroup.add(armUpright);

    // Horizontal under-seat aluminum mounting spar connecting arm upright to seat pan
    const armUnderSpar = tagHighLod(
      new THREE.Mesh(armUnderSparGeo, brushedAlumChairMat)
    );
    armUnderSpar.name = `study.southWallDesk.chair.armUnderSpar.${sideKey}`;
    armUnderSpar.rotation.z = Math.PI / 2;
    armUnderSpar.position.set(side * 0.21, 0.455, -0.02);
    chairGroup.add(armUnderSpar);

    // Rear loop bar connecting armrest into backrest frame
    const armRearLoop = tagHighLod(
      new THREE.Mesh(armRearLoopGeo, brushedAlumChairMat)
    );
    armRearLoop.name = `study.southWallDesk.chair.armRearLoop.${sideKey}`;
    armRearLoop.rotation.x = Math.PI / 2 - 0.18;
    armRearLoop.position.set(armX, 0.645, -0.11);
    chairGroup.add(armRearLoop);

    // Contoured padded saddle-leather arm pad on top of the loop
    const armLeatherPad = new THREE.Mesh(
      armLeatherPadGeo,
      leatherTanMat
    );
    armLeatherPad.name = 'study.southWallDesk.chair.armPad';
    armLeatherPad.rotation.x = Math.PI / 2;
    armLeatherPad.scale.set(1.15, 1, 0.55);
    armLeatherPad.position.set(armX, 0.668, 0.015);
    armLeatherPad.castShadow = true;
    chairGroup.add(armLeatherPad);
  }

  // 4. Synchronized Under-Seat Tilt Mechanism Box, Tension Cylinder & Height-Adjustment Paddle Lever
  const tiltMechBox = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.16, 0.058, 0.19)),
    brushedAlumChairMat
  );
  tiltMechBox.name = 'study.southWallDesk.chair.tiltMechanism';
  tiltMechBox.position.set(0, 0.408, -0.01);
  tiltMechBox.castShadow = true;
  chairGroup.add(tiltMechBox);

  const tensionKnob = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.022, 0.026, 0.075, 14)),
      brushedAlumChairMat
    )
  );
  tensionKnob.name = 'study.southWallDesk.chair.tensionKnob';
  tensionKnob.rotation.x = 0.45;
  tensionKnob.position.set(0, 0.365, 0.055);
  chairGroup.add(tensionKnob);

  const heightLeverRod = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.005, 0.005, 0.16, 10)),
      brushedAlumChairMat
    )
  );
  heightLeverRod.name = 'study.southWallDesk.chair.heightLeverRod';
  heightLeverRod.rotation.z = Math.PI / 2 - 0.12;
  heightLeverRod.position.set(0.14, 0.405, 0.03);
  chairGroup.add(heightLeverRod);

  const heightLeverPaddle = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.048, 0.012, 0.032)),
      leatherStitchWeltMat
    )
  );
  heightLeverPaddle.name = 'study.southWallDesk.chair.heightLeverPaddle';
  heightLeverPaddle.position.set(0.22, 0.395, 0.03);
  chairGroup.add(heightLeverPaddle);

  // 5. Two-Stage Telescoping Pneumatic Gas-Lift Column
  const gasLiftOuterShroud = new THREE.Mesh(
    createSharedGeo(new THREE.CylinderGeometry(0.028, 0.032, 0.19, 18)),
    brushedAlumChairMat
  );
  gasLiftOuterShroud.name = 'study.southWallDesk.chair.columnOuter';
  gasLiftOuterShroud.position.set(0, 0.175, -0.01);
  gasLiftOuterShroud.castShadow = true;
  chairGroup.add(gasLiftOuterShroud);

  const gasLiftInnerPiston = new THREE.Mesh(
    createSharedGeo(new THREE.CylinderGeometry(0.019, 0.019, 0.16, 16)),
    brushedAlumChairMat
  );
  gasLiftInnerPiston.name = 'study.southWallDesk.chair.columnInner';
  gasLiftInnerPiston.position.set(0, 0.31, -0.01);
  gasLiftInnerPiston.castShadow = true;
  chairGroup.add(gasLiftInnerPiston);

  const baseHubCollar = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.048, 0.056, 0.055, 20)),
      brushedAlumChairMat
    )
  );
  baseHubCollar.name = 'study.southWallDesk.chair.baseHubCollar';
  baseHubCollar.position.set(0, 0.088, -0.01);
  chairGroup.add(baseHubCollar);

  // 6. Sculpted 5-Star Tapered Cast-Aluminum Base & 5 Twin-Wheel Hooded Casters
  const starArmGeo = createSharedGeo(new THREE.CylinderGeometry(0.016, 0.026, 0.29, 12));
  const casterBossGeo = createSharedGeo(new THREE.CylinderGeometry(0.016, 0.015, 0.032, 12));
  const casterHoodGeo = createSharedGeo(
    new THREE.CylinderGeometry(0.024, 0.024, 0.038, 14, 1, false, 0, Math.PI)
  );
  const casterWheelGeo = createSharedGeo(new THREE.CylinderGeometry(0.024, 0.024, 0.009, 16));
  for (let leg = 0; leg < 5; leg++) {
    const a = (leg * Math.PI * 2) / 5;

    const starLegGroup = new THREE.Group();
    starLegGroup.name = `study.southWallDesk.chair.starLeg.${leg + 1}`;
    starLegGroup.position.set(0, 0, -0.01);
    starLegGroup.rotation.y = a;

    // Tapered arched aluminum star leg sweeping from the central hub out to radius 0.30m
    const starArm = new THREE.Mesh(
      starArmGeo,
      brushedAlumChairMat
    );
    starArm.name = 'study.southWallDesk.chair.starArm';
    starArm.rotation.x = Math.PI / 2 + 0.11;
    starArm.scale.set(0.85, 1, 1.15);
    starArm.position.set(0, 0.072, 0.155);
    starArm.castShadow = true;
    starLegGroup.add(starArm);

    // Vertical caster socket Boss at the tip of the star arm (Z = 0.29m)
    const casterBoss = tagHighLod(
      new THREE.Mesh(casterBossGeo, brushedAlumChairMat)
    );
    casterBoss.name = `study.southWallDesk.chair.casterBoss.${leg + 1}`;
    casterBoss.position.set(0, 0.048, 0.29);
    starLegGroup.add(casterBoss);

    // Hooded twin-wheel caster assembly seated cleanly on the floor (Y = 0..0.048m)
    const casterHood = tagHighLod(
      new THREE.Mesh(casterHoodGeo, castIronMat)
    );
    casterHood.name = `study.southWallDesk.chair.casterHood.${leg + 1}`;
    casterHood.rotation.z = Math.PI / 2;
    casterHood.position.set(0, 0.026, 0.296);
    starLegGroup.add(casterHood);

    for (const wheelX of [-0.014, 0.014] as const) {
      const wheel = tagHighLod(
        new THREE.Mesh(casterWheelGeo, castIronMat)
      );
      wheel.name = 'study.southWallDesk.chair.casterWheel';
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wheelX, 0.024, 0.298);
      wheel.castShadow = true;
      starLegGroup.add(wheel);
    }

    chairGroup.add(starLegGroup);
  }
  deskGroup.add(chairGroup);

  return { deskGroup, deskH };
}

/**
 * Compact Duplex Colour Laser Printer (`study.laserPrinter`) on the West Return Worktop.
 */
export function buildStudyLaserPrinter(
  ctx: SceneBuilderContext,
  kit: Pick<StudyDeskAndChairKit, 'brassMat' | 'tier2FloorY'>,
  deskH: number
): void {
  const { scene } = ctx;
  const { brassMat, tier2FloorY } = kit;

  const laserPrinterGroup = new THREE.Group();
  laserPrinterGroup.name = 'study.laserPrinter';
  laserPrinterGroup.userData.zone = 'study';
  const deskSurfaceY = tier2FloorY + deskH; // 0.16m
  laserPrinterGroup.position.set(-21.873, deskSurfaceY, 9.849);
  laserPrinterGroup.rotation.y = Math.PI / 2; // Front (+Z in local space) faces East (+X) into the Study

  const printerShellLightMat = new THREE.MeshStandardMaterial({
    color: 0xe6e3dc, // Warm office off-white / putty ABS polymer chassis
    roughness: 0.42,
    metalness: 0.04,
  });
  const printerAccentDarkMat = new THREE.MeshStandardMaterial({
    color: 0x26292e, // Matte charcoal-anthracite output bin & front accent panel
    roughness: 0.48,
    metalness: 0.12,
  });
  const printerPaperMat = new THREE.MeshStandardMaterial({
    color: 0xfbfaf6, // Crisp white A4 80gsm bond paper
    roughness: 0.65,
  });
  const printerLedGreenMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x22c55e,
    emissiveIntensity: 0.85,
    roughness: 0.2,
  });

  const prW = 0.398; // 398mm wide (along Z in world when rotated +90°)
  const prD = 0.404; // 404mm deep (along X in world, fitting cleanly on the 0.64m-deep West return worktop)

  // 1. Lower Main Printer Chassis & 250-Sheet Paper Cassette Drawer (y = 0..0.095m)
  const lowerBase = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(prW, 0.095, prD)),
    printerShellLightMat
  );
  lowerBase.name = 'study.laserPrinter.lowerBase';
  lowerBase.position.set(0, 0.0475, 0);
  lowerBase.castShadow = true;
  lowerBase.receiveShadow = true;
  laserPrinterGroup.add(lowerBase);

  // Front 250-sheet paper cassette drawer face + recessed finger pull cavity
  const paperTrayFront = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(prW - 0.024, 0.076, 0.012)),
    printerShellLightMat
  );
  paperTrayFront.name = 'study.laserPrinter.paperTray';
  paperTrayFront.position.set(0, 0.046, prD * 0.5 + 0.003);
  paperTrayFront.castShadow = true;
  laserPrinterGroup.add(paperTrayFront);

  const trayHandleRecess = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.11, 0.022, 0.01)),
      printerAccentDarkMat
    )
  );
  trayHandleRecess.name = 'study.laserPrinter.paperTray.handleRecess';
  trayHandleRecess.position.set(0, 0.046, prD * 0.5 + 0.006);
  laserPrinterGroup.add(trayHandleRecess);

  // 2. Mid-Body Fuser & Toner Cartridge Access Enclosure (y = 0.095..0.225m)
  const midBody = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(prW, 0.13, prD - 0.008)),
    printerShellLightMat
  );
  midBody.name = 'study.laserPrinter.midBody';
  midBody.position.set(0, 0.16, -0.002);
  midBody.castShadow = true;
  midBody.receiveShadow = true;
  laserPrinterGroup.add(midBody);

  // Front multi-purpose manual feed bypass door & anthracite accent band
  const manualFeedDoor = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(prW - 0.05, 0.092, 0.01)),
    printerAccentDarkMat
  );
  manualFeedDoor.name = 'study.laserPrinter.manualFeedDoor';
  manualFeedDoor.position.set(0, 0.158, prD * 0.5 - 0.002);
  laserPrinterGroup.add(manualFeedDoor);

  // Metallic brand badge on front door
  const brandBadge = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.054, 0.012, 0.004)),
      brassMat
    )
  );
  brandBadge.name = 'study.laserPrinter.brandBadge';
  brandBadge.position.set(0, 0.182, prD * 0.5 + 0.003);
  laserPrinterGroup.add(brandBadge);

  // 3. Sculpted Top Deck with Recessed Dark-Anthracite Face-Down Output Bin & Side Cheeks (y = 0.225..0.274m)
  const sideCheekW = 0.068;
  const topSideCheekGeo = createSharedGeo(new THREE.BoxGeometry(sideCheekW, 0.049, prD - 0.012));
  for (const sideSign of [-1, 1] as const) {
    const topSideCheek = new THREE.Mesh(
      topSideCheekGeo,
      printerShellLightMat
    );
    topSideCheek.name = `study.laserPrinter.topSideCheek.${sideSign < 0 ? 'left' : 'right'}`;
    topSideCheek.position.set(
      sideSign * (prW * 0.5 - sideCheekW * 0.5),
      0.2495,
      -0.004
    );
    topSideCheek.castShadow = true;
    laserPrinterGroup.add(topSideCheek);
  }

  // Rear top deck bridge behind the recessed output bin
  const rearTopDeck = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(prW - sideCheekW * 2, 0.049, 0.12)),
    printerShellLightMat
  );
  rearTopDeck.name = 'study.laserPrinter.rearTopDeck';
  rearTopDeck.position.set(0, 0.2495, -prD * 0.5 + 0.064);
  rearTopDeck.castShadow = true;
  laserPrinterGroup.add(rearTopDeck);

  // Recessed dark-anthracite angled output bin tray floor
  const outputBinFloor = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(prW - sideCheekW * 2 - 0.004, 0.012, prD - 0.14)),
    printerAccentDarkMat
  );
  outputBinFloor.name = 'study.laserPrinter.outputBin';
  outputBinFloor.position.set(0, 0.232, 0.045);
  outputBinFloor.rotation.x = 0.08;
  laserPrinterGroup.add(outputBinFloor);

  // Flip-up paper stop lip at the front of the output tray
  const paperStopLip = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.11, 0.024, 0.006)),
      printerAccentDarkMat
    )
  );
  paperStopLip.name = 'study.laserPrinter.paperStopLip';
  paperStopLip.position.set(0, 0.246, prD * 0.5 - 0.045);
  paperStopLip.rotation.x = -0.35;
  laserPrinterGroup.add(paperStopLip);

  // Freshly printed A4 sheets resting in the top output tray
  const printedSheet = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.21, 0.003, 0.265)),
    printerPaperMat
  );
  printedSheet.name = 'study.laserPrinter.printedSheet';
  printedSheet.position.set(0, 0.24, 0.035);
  printedSheet.rotation.x = 0.08;
  laserPrinterGroup.add(printedSheet);

  // 4. Tilt-Up Colour Touchscreen Control Panel on the Front-Right Cheek + Emerald Ready LED
  const controlPanelGroup = new THREE.Group();
  controlPanelGroup.name = 'study.laserPrinter.controlPanel';
  controlPanelGroup.position.set(
    prW * 0.5 - sideCheekW * 0.5,
    0.276,
    prD * 0.5 - 0.068
  );
  controlPanelGroup.rotation.x = 0.48; // Tilted toward operator

  const panelBezel = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.058, 0.008, 0.088)),
      printerAccentDarkMat
    )
  );
  panelBezel.name = 'study.laserPrinter.controlPanel.bezel';
  controlPanelGroup.add(panelBezel);

  const lcdScreen = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.042, 0.002, 0.052)),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.45,
        roughness: 0.18,
      })
    )
  );
  lcdScreen.name = 'study.laserPrinter.controlPanel.lcdScreen';
  lcdScreen.position.set(0, 0.0045, -0.006);
  controlPanelGroup.add(lcdScreen);

  const readyLed = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.003, 0.003, 0.003, 12)),
      printerLedGreenMat
    )
  );
  readyLed.name = 'study.laserPrinter.controlPanel.readyLed';
  readyLed.position.set(0.016, 0.0045, 0.032);
  controlPanelGroup.add(readyLed);

  laserPrinterGroup.add(controlPanelGroup);

  // 5. Side Ventilation Louver Slots on left & right flanks
  const ventSlotGeo = createSharedGeo(new THREE.BoxGeometry(0.004, 0.008, 0.14));
  for (const sideSign of [-1, 1] as const) {
    const sideKey = sideSign < 0 ? 'left' : 'right';
    for (let v = 0; v < 5; v++) {
      const ventSlot = tagHighLod(
        new THREE.Mesh(ventSlotGeo, printerAccentDarkMat)
      );
      ventSlot.name = `study.laserPrinter.ventSlot.${sideKey}.${v + 1}`;
      ventSlot.position.set(
        sideSign * (prW * 0.5 + 0.001),
        0.135 + v * 0.016,
        -0.06
      );
      laserPrinterGroup.add(ventSlot);
    }
  }

  scene.add(laserPrinterGroup);
}
