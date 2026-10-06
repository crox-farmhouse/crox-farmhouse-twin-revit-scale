import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import {
  createBrushedStainlessTexture,
  createCementTexture,
  createDriftwoodTexture,
  createGraniteSettLPathTextures,
} from '../../../../engine/textures/procedural-textures.ts';
import { buildPatioAndGrapeVinePergola } from '../grounds/patio-and-grape-vine-pergola.ts';

function prepGeo<T extends THREE.BufferGeometry>(geo: T): T {
  geo.computeBoundingSphere();
  return geo;
}

function tagHighLod(obj: THREE.Object3D, maxDistance = 14): void {
  obj.userData.lodTier = 'high';
  obj.userData.lodMaxDistance = maxDistance;
}

// ============================================================================
// Shared BufferGeometries for Sitting Area, Bifolds, Trophy Urns & Grindstone
// ============================================================================
const sharedChairSeatGeo = prepGeo(new THREE.BoxGeometry(0.78, 0.16, 0.76));
const sharedChairBaseFrameGeo = prepGeo(new THREE.BoxGeometry(0.82, 0.05, 0.8));
const sharedChairBackGeo = prepGeo(new THREE.BoxGeometry(0.76, 0.48, 0.16));
const sharedChairPillowGeo = prepGeo(new THREE.BoxGeometry(0.38, 0.26, 0.1));
const sharedChairArmGeo = prepGeo(new THREE.BoxGeometry(0.078, 0.044, 0.78));
const sharedChairFrontLegGeo = prepGeo(new THREE.CylinderGeometry(0.025, 0.019, 0.62, 10));
const sharedChairBackLegGeo = prepGeo(new THREE.CylinderGeometry(0.025, 0.019, 0.58, 10));

const sharedOakUprightGeo = prepGeo(new THREE.BoxGeometry(0.24, 2.48, 0.29));
const sharedOakPegGeo = prepGeo(new THREE.CylinderGeometry(0.012, 0.012, 0.31, 8));

const southWinW = 2.5;
const southWinH = 2.46;
const numWindowPanes = 3;
const paneW = southWinW / numWindowPanes;
const sharedSouthWinStileGeo = prepGeo(new THREE.BoxGeometry(0.054, southWinH, 0.058));
const sharedSouthWinRailGeo = prepGeo(new THREE.BoxGeometry(paneW, 0.062, 0.058));
const sharedSouthWinGlassGeo = prepGeo(
  new THREE.BoxGeometry(paneW - 0.108, southWinH - 0.124, 0.016)
);

const numBifoldLeaves = 4;
const bifoldTotalWidth = 3.02;
const bifoldLeafW = bifoldTotalWidth / numBifoldLeaves;
const bifoldLeafH = 2.46;
const sharedBifoldStileGeo = prepGeo(new THREE.BoxGeometry(0.054, bifoldLeafH, 0.058));
const sharedBifoldRailTopGeo = prepGeo(new THREE.BoxGeometry(bifoldLeafW, 0.058, 0.058));
const sharedBifoldRailBotGeo = prepGeo(new THREE.BoxGeometry(bifoldLeafW, 0.068, 0.058));
const sharedBifoldGlassGeo = prepGeo(
  new THREE.BoxGeometry(bifoldLeafW - 0.09, bifoldLeafH - 0.11, 0.012)
);
const sharedBifoldHingeKnuckleGeo = prepGeo(
  new THREE.CylinderGeometry(0.007, 0.007, 0.065, 8)
);

const sharedUrnPlinthLowerGeo = prepGeo(new THREE.BoxGeometry(0.42, 0.09, 0.42));
const sharedUrnPlinthUpperGeo = prepGeo(new THREE.BoxGeometry(0.34, 0.07, 0.34));
const sharedUrnSocleFootGeo = prepGeo(new THREE.CylinderGeometry(0.11, 0.165, 0.09, 16));
const sharedUrnStemKnopGeo = prepGeo(new THREE.TorusGeometry(0.115, 0.026, 10, 16));
const sharedUrnStemNeckGeo = prepGeo(new THREE.CylinderGeometry(0.135, 0.095, 0.11, 16));
const sharedUrnCupLowerCalixGeo = prepGeo(new THREE.CylinderGeometry(0.25, 0.135, 0.14, 16));
const sharedUrnCupMidCordonGeo = prepGeo(new THREE.TorusGeometry(0.255, 0.018, 10, 20));
const sharedUrnCupMainBodyGeo = prepGeo(new THREE.CylinderGeometry(0.305, 0.245, 0.24, 20));
const sharedUrnCupLipRimGeo = prepGeo(new THREE.TorusGeometry(0.315, 0.028, 12, 24));
const sharedUrnTrophyHandleGeo = prepGeo(
  new THREE.TorusGeometry(0.115, 0.02, 10, 18, Math.PI * 1.25)
);
const sharedLionManeRuffGeo = prepGeo(new THREE.TorusGeometry(0.058, 0.022, 10, 14));
const sharedLionSkullGeo = prepGeo(new THREE.SphereGeometry(0.052, 12, 10));
const sharedLionMuzzleGeo = prepGeo(new THREE.BoxGeometry(0.048, 0.044, 0.045));
const sharedLionBrowGeo = prepGeo(new THREE.BoxGeometry(0.056, 0.018, 0.032));
const sharedLionMouthRingGeo = prepGeo(new THREE.TorusGeometry(0.028, 0.006, 8, 14));
const sharedUrnPlantCrownGeo = prepGeo(new THREE.SphereGeometry(0.28, 14, 12));
const sharedUrnBloomGeo = prepGeo(new THREE.SphereGeometry(0.045, 8, 8));

const sharedGrindstoneBeamGeo = prepGeo(new THREE.BoxGeometry(0.86, 0.14, 0.075));
const sharedGrindstoneLegGeo = prepGeo(new THREE.BoxGeometry(0.07, 0.26, 0.07));
const sharedGrindstoneWheelGeo = prepGeo(new THREE.CylinderGeometry(0.36, 0.36, 0.13, 28));
const sharedGrindstoneRingInnerGeo = prepGeo(new THREE.TorusGeometry(0.16, 0.006, 6, 24));
const sharedGrindstoneRingOuterGeo = prepGeo(new THREE.TorusGeometry(0.26, 0.006, 6, 24));
const sharedGrindstoneAxlePlateGeo = prepGeo(new THREE.BoxGeometry(0.11, 0.11, 0.16));
const sharedGrindstoneSpindleGeo = prepGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.34, 10));
const sharedGrindstoneCrankArmGeo = prepGeo(new THREE.BoxGeometry(0.022, 0.16, 0.016));
const sharedGrindstoneCrankHandleGeo = prepGeo(new THREE.CylinderGeometry(0.014, 0.014, 0.09, 8));

export function buildSittingAreaAndOakBifolds(ctx: SceneBuilderContext): void {
  const { scene, bifoldPanels, cutawayWallGroups, interactions } = ctx;
  const southWallGroup = cutawayWallGroups.southWest;

  const rugMat = new THREE.MeshStandardMaterial({
    color: 0xc8beae,
    roughness: 0.92,
  });
  const rug = new THREE.Mesh(prepGeo(new THREE.BoxGeometry(2.35, 0.015, 1.8)), rugMat);
  rug.name = 'sitting.wovenRug';
  rug.position.set(3.45, 0.008, 0.68);
  rug.receiveShadow = true;
  scene.add(rug);

  const linenMat = new THREE.MeshStandardMaterial({
    color: 0xdad3c5,
    roughness: 0.78,
  });
  const cushionAccentMat = new THREE.MeshStandardMaterial({
    color: 0x2a455c,
    roughness: 0.75,
  });
  // Washed-out, sun-bleached driftwood finish for the armchairs
  const chairDriftwoodMat = new THREE.MeshStandardMaterial({
    map: createDriftwoodTexture(),
    color: 0xb5aba0,
    roughness: 0.84,
    metalness: 0.02,
  });

  const chairConfigs: ReadonlyArray<{
    readonly name: string;
    readonly x: number;
    readonly z: number;
    readonly rotY: number;
  }> = [
    { name: 'sitting.armchairLeft', x: 2.7, z: 0.34, rotY: 0.35 },
    { name: 'sitting.armchairRight', x: 4.2, z: 0.34, rotY: -0.35 },
  ];

  for (const cfg of chairConfigs) {
    const chair = new THREE.Group();
    chair.name = cfg.name;
    chair.position.set(cfg.x, 0, cfg.z);
    chair.rotation.y = cfg.rotY;

    const seat = new THREE.Mesh(sharedChairSeatGeo, linenMat);
    seat.name = `${cfg.name}.seatCushion`;
    seat.position.set(0, 0.4, 0);
    seat.castShadow = true;
    seat.receiveShadow = true;
    chair.add(seat);

    const baseFrame = new THREE.Mesh(sharedChairBaseFrameGeo, chairDriftwoodMat);
    baseFrame.name = `${cfg.name}.baseFrame`;
    baseFrame.position.set(0, 0.29, 0);
    chair.add(baseFrame);

    const back = new THREE.Mesh(sharedChairBackGeo, linenMat);
    back.name = `${cfg.name}.backrestCushion`;
    back.position.set(0, 0.66, -0.31);
    back.rotation.x = -0.14;
    back.castShadow = true;
    chair.add(back);

    const pillow = new THREE.Mesh(sharedChairPillowGeo, cushionAccentMat);
    pillow.name = `${cfg.name}.accentPillow`;
    pillow.position.set(0, 0.56, -0.2);
    pillow.rotation.x = -0.22;
    chair.add(pillow);

    for (const [side, sideTag] of [
      [-1, 'Left'],
      [1, 'Right'],
    ] as const) {
      // Driftwood armrest tilted slightly upwards towards the front (+Z)
      const arm = new THREE.Mesh(sharedChairArmGeo, chairDriftwoodMat);
      arm.name = `${cfg.name}.armrest${sideTag}`;
      arm.position.set(side * 0.41, 0.555, 0.01);
      arm.rotation.x = -0.15;
      arm.castShadow = true;
      chair.add(arm);

      // Angled front leg
      const frontLeg = new THREE.Mesh(sharedChairFrontLegGeo, chairDriftwoodMat);
      frontLeg.name = `${cfg.name}.frontLeg${sideTag}`;
      frontLeg.position.set(side * 0.415, 0.295, 0.33);
      frontLeg.rotation.x = -0.28;
      frontLeg.rotation.z = -side * 0.05;
      frontLeg.castShadow = true;
      chair.add(frontLeg);

      // Angled rear leg
      const backLeg = new THREE.Mesh(sharedChairBackLegGeo, chairDriftwoodMat);
      backLeg.name = `${cfg.name}.backLeg${sideTag}`;
      backLeg.position.set(side * 0.415, 0.265, -0.34);
      backLeg.rotation.x = 0.34;
      backLeg.rotation.z = -side * 0.05;
      backLeg.castShadow = true;
      chair.add(backLeg);
    }

    scene.add(chair);
  }

  // Modern architectural cast-cement coffee table (monolithic drum plinth + thick slab top)
  const coffeeTable = new THREE.Group();
  coffeeTable.name = 'sitting.coffeeTable';
  coffeeTable.position.set(3.45, 0, 1.101);

  const cementTex = createCementTexture();
  const cementMat = new THREE.MeshStandardMaterial({
    map: cementTex,
    bumpMap: cementTex,
    bumpScale: 0.003,
    color: 0xd8d4cc,
    roughness: 0.88,
    metalness: 0.03,
  });
  const cementShadowPlinthMat = new THREE.MeshStandardMaterial({
    map: cementTex,
    color: 0x827f78,
    roughness: 0.92,
    metalness: 0.04,
  });

  // Recessed dark shadow-gap floor plinth
  const tablePlinth = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.24, 0.24, 0.035, 32)),
    cementShadowPlinthMat
  );
  tablePlinth.name = 'sitting.coffeeTable.shadowPlinth';
  tablePlinth.position.set(0, 0.0175, 0);
  tablePlinth.receiveShadow = true;
  coffeeTable.add(tablePlinth);

  // Monolithic cylindrical cast-cement drum base
  const tableDrumBase = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.285, 0.295, 0.305, 36)),
    cementMat
  );
  tableDrumBase.name = 'sitting.coffeeTable.drumBase';
  tableDrumBase.position.set(0, 0.185, 0);
  tableDrumBase.castShadow = true;
  tableDrumBase.receiveShadow = true;
  coffeeTable.add(tableDrumBase);

  // Thick cast-cement slab top with subtle bottom bevel collar
  const tableUnderBevel = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.375, 0.34, 0.022, 36)),
    cementMat
  );
  tableUnderBevel.name = 'sitting.coffeeTable.underBevelCollar';
  tableUnderBevel.position.set(0, 0.348, 0);
  coffeeTable.add(tableUnderBevel);

  const tableTop = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.375, 0.375, 0.075, 36)),
    cementMat
  );
  tableTop.name = 'sitting.coffeeTable.slabTop';
  tableTop.position.set(0, 0.396, 0);
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  coffeeTable.add(tableTop);

  const book = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.2, 0.028, 0.15)),
    new THREE.MeshStandardMaterial({ color: 0x324b61, roughness: 0.6 })
  );
  book.name = 'sitting.coffeeTable.artBook';
  book.position.set(-0.06, 0.448, 0.03);
  book.rotation.y = 0.28;
  tagHighLod(book);
  coffeeTable.add(book);

  const mug = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.036, 0.032, 0.075, 12)),
    new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.25 })
  );
  mug.name = 'sitting.coffeeTable.ceramicMug';
  mug.position.set(0.11, 0.463, -0.05);
  tagHighLod(mug);
  coffeeTable.add(mug);

  scene.add(coffeeTable);

  // =========================================================================
  // 4 WIDER WHITE BIFOLD DOORS FRAMED BY A LARGE, THICK OAK MANTLE & OAK UPRIGHTS
  // (Set in the 0.28m-thick South wall at Z = +1.99m..+2.27m, center Z = +2.13m)
  // =========================================================================
  const structuralOakMat = new THREE.MeshStandardMaterial({
    color: 0x8a6038,
    roughness: 0.56,
    metalness: 0.05,
  });
  const darkOakPegMat = new THREE.MeshStandardMaterial({
    color: 0x5c3d20,
    roughness: 0.65,
  });
  const whiteBifoldFrameMat = new THREE.MeshStandardMaterial({
    color: 0xf4f1ea,
    roughness: 0.32,
    metalness: 0.06,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xbad8f5,
    transparent: true,
    opacity: 0.18,
    roughness: 0.1,
    metalness: 0.2,
  });
  const brushedStainlessTex = createBrushedStainlessTexture();
  const bifoldHardwareMat = new THREE.MeshStandardMaterial({
    map: brushedStainlessTex,
    bumpMap: brushedStainlessTex,
    bumpScale: 0.003,
    color: 0xc8c5be,
    roughness: 0.28,
    metalness: 0.48,
  });

  // Large, thick structural Oak Mantle (Lintel Beam) spanning across the top of the bifold opening
  const oakMantle = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(3.56, 0.26, 0.3)),
    structuralOakMat
  );
  oakMantle.name = 'sitting.bifolds.oakMantle';
  oakMantle.position.set(3.19, 2.61, 2.13);
  oakMantle.castShadow = true;
  oakMantle.receiveShadow = true;
  southWallGroup.add(oakMantle);

  // Large, thick structural Oak Uprights (Posts) on either side of the 4 white bifold doors
  let bifoldPegIdx = 0;
  for (const [uprightX, sideTag] of [
    [1.56, 'Left'],
    [4.82, 'Right'],
  ] as const) {
    const oakUpright = new THREE.Mesh(sharedOakUprightGeo, structuralOakMat);
    oakUpright.name = `sitting.bifolds.oakUpright${sideTag}`;
    oakUpright.position.set(uprightX, 1.24, 2.13);
    oakUpright.castShadow = true;
    oakUpright.receiveShadow = true;
    southWallGroup.add(oakUpright);

    // Traditional timber-frame oak pegs at the mortise-and-tenon joint between upright and mantle
    for (const dx of [-0.05, 0.05]) {
      const peg = new THREE.Mesh(sharedOakPegGeo, darkOakPegMat);
      peg.name = `sitting.bifolds.oakPeg_${bifoldPegIdx++}`;
      peg.rotation.x = Math.PI / 2;
      peg.position.set(uprightX + dx, 2.55, 2.13);
      tagHighLod(peg);
      southWallGroup.add(peg);
    }
  }

  // Thick Oak Threshold Sill at the base of the 4 white bifold doors
  const sill = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(3.06, 0.035, 0.26)),
    structuralOakMat
  );
  sill.name = 'sitting.bifolds.oakThresholdSill';
  sill.position.set(3.19, 0.017, 2.12);
  southWallGroup.add(sill);

  // =========================================================================
  // LARGE 2.5M-WIDE 3-PANE FULL-HEIGHT WINDOW NEXT TO THE BIFOLDS (X = -1.68m to +0.82m, center X = -0.43m)
  // =========================================================================
  const southWinCenterX = -0.43;

  // Matching thick structural Oak Mantel (lintel beam) above the 3-pane full-height window
  const southWinOakMantle = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(southWinW + 0.54, 0.26, 0.3)),
    structuralOakMat
  );
  southWinOakMantle.name = 'sitting.southWindow.oakMantle';
  southWinOakMantle.position.set(southWinCenterX, 2.61, 2.13);
  southWinOakMantle.castShadow = true;
  southWinOakMantle.receiveShadow = true;
  southWallGroup.add(southWinOakMantle);

  // Matching thick structural Oak Upstands (left & right posts at X = -1.80m and X = +0.94m)
  let winPegIdx = 0;
  for (const [winUprightX, sideTag] of [
    [southWinCenterX - southWinW * 0.5 - 0.12, 'Left'],
    [southWinCenterX + southWinW * 0.5 + 0.12, 'Right'],
  ] as const) {
    const winOakUpright = new THREE.Mesh(sharedOakUprightGeo, structuralOakMat);
    winOakUpright.name = `sitting.southWindow.oakUpright${sideTag}`;
    winOakUpright.position.set(winUprightX, 1.24, 2.13);
    winOakUpright.castShadow = true;
    winOakUpright.receiveShadow = true;
    southWallGroup.add(winOakUpright);

    // Traditional timber-frame oak pegs at the mortise-and-tenon joint
    for (const dx of [-0.05, 0.05]) {
      const peg = new THREE.Mesh(sharedOakPegGeo, darkOakPegMat);
      peg.name = `sitting.southWindow.oakPeg_${winPegIdx++}`;
      peg.rotation.x = Math.PI / 2;
      peg.position.set(winUprightX + dx, 2.55, 2.13);
      tagHighLod(peg);
      southWallGroup.add(peg);
    }
  }

  // Matching Oak Threshold Sill at the base of the 3-pane full-height window
  const southWinSill = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(southWinW + 0.06, 0.035, 0.26)),
    structuralOakMat
  );
  southWinSill.name = 'sitting.southWindow.oakSill';
  southWinSill.position.set(southWinCenterX, 0.017, 2.12);
  southWallGroup.add(southWinSill);

  // 3 Full-Height Glazed Window Panes (each ~0.833m wide x 2.46m tall)
  const winStartX = southWinCenterX - southWinW * 0.5;

  for (let p = 0; p < numWindowPanes; p++) {
    const paneCenterX = winStartX + p * paneW + paneW * 0.5;
    const panePrefix = `sitting.southWindow.pane_${p}`;
    const paneGroup = new THREE.Group();
    paneGroup.name = panePrefix;
    paneGroup.position.set(paneCenterX, 1.25, 2.12);

    for (const [side, sideTag] of [
      [-1, 'stileLeft'],
      [1, 'stileRight'],
    ] as const) {
      const stile = new THREE.Mesh(sharedSouthWinStileGeo, whiteBifoldFrameMat);
      stile.name = `${panePrefix}.${sideTag}`;
      stile.position.set(side * (paneW * 0.5 - 0.027), 0, 0);
      stile.castShadow = true;
      paneGroup.add(stile);
    }

    for (const [vSide, railTag] of [
      [-1, 'railBottom'],
      [1, 'railTop'],
    ] as const) {
      const rail = new THREE.Mesh(sharedSouthWinRailGeo, whiteBifoldFrameMat);
      rail.name = `${panePrefix}.${railTag}`;
      rail.position.set(0, vSide * (southWinH * 0.5 - 0.031), 0);
      rail.castShadow = true;
      paneGroup.add(rail);
    }

    const glass = new THREE.Mesh(sharedSouthWinGlassGeo, glassMat);
    glass.name = `${panePrefix}.glassPane`;
    paneGroup.add(glass);

    southWallGroup.add(paneGroup);
  }

  // 4 Wider White Bifold Door Panes (totalWidth = 3.02m -> each pane is 0.755m wide, spanning X = +1.68m..+4.70m)
  const startX = 1.68;
  const hingeKnuckleYs = [-0.85, 0.0, 0.85] as const;

  for (let i = 0; i < numBifoldLeaves; i++) {
    const leafPrefix = `sitting.bifolds.leaf_${i}`;
    const panelPivot = new THREE.Group();
    panelPivot.name = leafPrefix;
    const closedX = startX + i * bifoldLeafW + bifoldLeafW / 2;
    panelPivot.position.set(closedX, 1.25, 2.12);

    const stileLeft = new THREE.Mesh(sharedBifoldStileGeo, whiteBifoldFrameMat);
    stileLeft.name = `${leafPrefix}.stileLeft`;
    stileLeft.position.set(-bifoldLeafW / 2 + 0.027, 0, 0);
    panelPivot.add(stileLeft);

    const stileRight = new THREE.Mesh(sharedBifoldStileGeo, whiteBifoldFrameMat);
    stileRight.name = `${leafPrefix}.stileRight`;
    stileRight.position.set(bifoldLeafW / 2 - 0.027, 0, 0);
    panelPivot.add(stileRight);

    const railTop = new THREE.Mesh(sharedBifoldRailTopGeo, whiteBifoldFrameMat);
    railTop.name = `${leafPrefix}.railTop`;
    railTop.position.set(0, bifoldLeafH / 2 - 0.029, 0);
    panelPivot.add(railTop);

    const railBot = new THREE.Mesh(sharedBifoldRailBotGeo, whiteBifoldFrameMat);
    railBot.name = `${leafPrefix}.railBottom`;
    railBot.position.set(0, -bifoldLeafH / 2 + 0.034, 0);
    panelPivot.add(railBot);

    const glassPane = new THREE.Mesh(sharedBifoldGlassGeo, glassMat);
    glassPane.name = `${leafPrefix}.glassPane`;
    panelPivot.add(glassPane);

    // 3 Brushed stainless steel bifold concertina hinge knuckles along the leaf stile
    for (let h = 0; h < hingeKnuckleYs.length; h++) {
      const knuckle = new THREE.Mesh(sharedBifoldHingeKnuckleGeo, bifoldHardwareMat);
      knuckle.name = `${leafPrefix}.hingeKnuckle_${h}`;
      knuckle.position.set(bifoldLeafW / 2 - 0.004, hingeKnuckleYs[h], -0.026);
      tagHighLod(knuckle);
      panelPivot.add(knuckle);
    }

    // Clicking any bifold door frame or glass pane toggles the 4-leaf concertina bifold doors
    interactions.registerBifoldDoor(panelPivot);

    const indexFromRight = numBifoldLeaves - 1 - i;
    southWallGroup.add(panelPivot);
    bifoldPanels.push({
      group: panelPivot,
      closedX,
      openX: indexFromRight,
      dir: indexFromRight % 2 === 0 ? 1 : -1,
    });
  }

  // =========================================================================
  // 1. COBBLED PATH RUNNING ALONGSIDE THE HOUSE
  // =========================================================================
  const { colorMap: graniteSettTex, depthMap: graniteSettDepthTex } =
    createGraniteSettLPathTextures();

  const graniteSettMat = new THREE.MeshStandardMaterial({
    map: graniteSettTex,
    bumpMap: graniteSettDepthTex,
    bumpScale: 0.036,
    roughness: 0.82,
    metalness: 0.06,
  });
  const graniteSettTopReliefMat = new THREE.MeshStandardMaterial({
    map: graniteSettTex,
    bumpMap: graniteSettDepthTex,
    bumpScale: 0.036,
    displacementMap: graniteSettDepthTex,
    displacementScale: 0.009,
    displacementBias: -0.0045,
    roughness: 0.82,
    metalness: 0.06,
  });

  const applyWorldSpaceCobbleLPathUVs = (
    geo: THREE.BufferGeometry,
    cx: number,
    cz: number,
    isHorizontalPlane: boolean
  ): THREE.BufferGeometry => {
    const posAttr = geo.attributes.position;
    const uvAttr = geo.attributes.uv;
    if (posAttr && uvAttr) {
      const worldMinX = -4.64;
      const worldSpanX = 11.38;
      const worldMinZ = -2.78;
      const worldSpanZ = 10.13;

      for (let i = 0; i < posAttr.count; i++) {
        const lx = posAttr.getX(i);
        const ly = posAttr.getY(i);
        const lz = posAttr.getZ(i);
        const wx = cx + lx;
        const wz = isHorizontalPlane ? cz - ly : cz + lz;
        const u = (wx - worldMinX) / worldSpanX;
        const v = 1 - (wz - worldMinZ) / worldSpanZ;
        uvAttr.setXY(i, u, v);
      }
      uvAttr.needsUpdate = true;
    }
    return prepGeo(geo);
  };

  const limestoneEdgingMat = new THREE.MeshStandardMaterial({
    color: 0xc9bfa8,
    roughness: 0.78,
  });

  // South cobblestone path in front of Kitchen
  const granitePath = new THREE.Mesh(
    applyWorldSpaceCobbleLPathUVs(
      new THREE.BoxGeometry(9.92, 0.105, 1.46),
      0.32,
      3.0,
      false
    ),
    graniteSettMat
  );
  granitePath.name = 'courtyard.southCobblePath';
  granitePath.userData.isArchitecturalShell = true;
  granitePath.position.set(0.32, -0.064, 3.0);
  granitePath.receiveShadow = true;
  scene.add(granitePath);

  const granitePathReliefTop = new THREE.Mesh(
    applyWorldSpaceCobbleLPathUVs(
      new THREE.PlaneGeometry(9.92, 1.46, 160, 24),
      0.32,
      3.0,
      true
    ),
    graniteSettTopReliefMat
  );
  granitePathReliefTop.name = 'courtyard.southCobblePathReliefTop';
  granitePathReliefTop.userData.isArchitecturalShell = true;
  granitePathReliefTop.rotation.x = -Math.PI / 2;
  granitePathReliefTop.position.set(0.32, -0.01, 3.0);
  granitePathReliefTop.receiveShadow = true;
  scene.add(granitePathReliefTop);

  // East cobblestone path running from the Utility Room Split Stable Exit Door past the Kitchen East Window
  const eastCobblePath = new THREE.Mesh(
    applyWorldSpaceCobbleLPathUVs(
      new THREE.BoxGeometry(1.46, 0.105, 5.58),
      6.01,
      0.94,
      false
    ),
    graniteSettMat
  );
  eastCobblePath.name = 'kitchen.courtyard.eastCobblePath';
  eastCobblePath.position.set(6.01, -0.064, 0.94);
  eastCobblePath.receiveShadow = true;
  scene.add(eastCobblePath);

  const eastCobblePathReliefTop = new THREE.Mesh(
    applyWorldSpaceCobbleLPathUVs(
      new THREE.PlaneGeometry(1.46, 5.58, 24, 90),
      6.01,
      0.94,
      true
    ),
    graniteSettTopReliefMat
  );
  eastCobblePathReliefTop.name = 'kitchen.courtyard.eastCobblePathReliefTop';
  eastCobblePathReliefTop.rotation.x = -Math.PI / 2;
  eastCobblePathReliefTop.position.set(6.01, -0.01, 0.94);
  eastCobblePathReliefTop.receiveShadow = true;
  scene.add(eastCobblePathReliefTop);

  // Southern continuation of the cobbled path between the Patio Shrub Bank and the Pergola
  const pergolaWestCobblePath = new THREE.Mesh(
    applyWorldSpaceCobbleLPathUVs(
      new THREE.BoxGeometry(1.46, 0.105, 3.52),
      6.01,
      5.49,
      false
    ),
    graniteSettMat
  );
  pergolaWestCobblePath.name = 'courtyard.pergolaWestCobblePath';
  pergolaWestCobblePath.userData.isArchitecturalShell = true;
  pergolaWestCobblePath.position.set(6.01, -0.064, 5.49);
  pergolaWestCobblePath.receiveShadow = true;
  scene.add(pergolaWestCobblePath);

  const pergolaWestCobblePathReliefTop = new THREE.Mesh(
    applyWorldSpaceCobbleLPathUVs(
      new THREE.PlaneGeometry(1.46, 3.52, 24, 58),
      6.01,
      5.49,
      true
    ),
    graniteSettTopReliefMat
  );
  pergolaWestCobblePathReliefTop.name = 'courtyard.pergolaWestCobblePathReliefTop';
  pergolaWestCobblePathReliefTop.userData.isArchitecturalShell = true;
  pergolaWestCobblePathReliefTop.rotation.x = -Math.PI / 2;
  pergolaWestCobblePathReliefTop.position.set(6.01, -0.01, 5.49);
  pergolaWestCobblePathReliefTop.receiveShadow = true;
  scene.add(pergolaWestCobblePathReliefTop);

  // Limestone border kerb segments along the outer East edge
  const kerbSpans = [
    [-1.85, 1.72],
    [3.58, 5.75],
  ] as const;
  for (let i = 0; i < kerbSpans.length; i++) {
    const [zMin, zMax] = kerbSpans[i];
    const segLen = zMax - zMin;
    const eastPathOuterKerb = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(0.08, 0.115, segLen)),
      limestoneEdgingMat
    );
    eastPathOuterKerb.name = `kitchen.courtyard.eastPathOuterKerb_${i}`;
    eastPathOuterKerb.position.set(6.78, -0.056, (zMin + zMax) * 0.5);
    eastPathOuterKerb.receiveShadow = true;
    scene.add(eastPathOuterKerb);
  }

  const eastPathNorthKerb = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(1.54, 0.115, 0.08)),
    limestoneEdgingMat
  );
  eastPathNorthKerb.name = 'kitchen.courtyard.eastPathNorthKerb';
  eastPathNorthKerb.position.set(6.05, -0.056, -1.89);
  eastPathNorthKerb.receiveShadow = true;
  scene.add(eastPathNorthKerb);

  // Reclaimed Yorkstone doorstep threshold directly outside the Utility Room Split Stable Exit Door
  const utilityDoorStep = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.36, 0.055, 1.06)),
    limestoneEdgingMat
  );
  utilityDoorStep.name = 'utility.exteriorDoorStep';
  utilityDoorStep.position.set(5.46, -0.012, -1.365);
  utilityDoorStep.castShadow = true;
  utilityDoorStep.receiveShadow = true;
  scene.add(utilityDoorStep);

  // =========================================================================
  // 2. RAISED RATTAN SOFA LOUNGE PATIO (WEST) & WALLED GRAPE-VINE PERGOLA
  // =========================================================================
  buildPatioAndGrapeVinePergola(scene, southWallGroup, {
    limestoneEdgingMat,
    structuralOakMat,
    glassMat,
    buildLionHeadTrophyUrn,
    buildOldGrindstone,
  });
}

let lionUrnInstanceCounter = 0;

/**
 * Builds the decorative Trophy / Cup Planter (Campagna / Medici Urn) with 4 sculpted Lion Heads,
 * twin scrolled trophy handles, fluted pedestal foot, and overflowing cottage planting.
 */
function buildLionHeadTrophyUrn(
  scene: THREE.Scene,
  x: number,
  z: number,
  foliageMat: THREE.Material,
  whiteBloomMat: THREE.Material,
  blushBloomMat: THREE.Material
): void {
  const urnPrefix = `kitchen.courtyard.lionHeadUrn_${lionUrnInstanceCounter++}`;
  const urnGroup = new THREE.Group();
  urnGroup.name = urnPrefix;
  urnGroup.position.set(x, 0, z);

  const weatheredStoneUrnMat = new THREE.MeshStandardMaterial({
    color: 0xd2c9b8,
    roughness: 0.68,
    metalness: 0.08,
  });
  const lionReliefMat = new THREE.MeshStandardMaterial({
    color: 0xc4baa6,
    roughness: 0.62,
    metalness: 0.12,
  });
  const bronzeRingMat = new THREE.MeshStandardMaterial({
    color: 0x5e4b36,
    roughness: 0.42,
    metalness: 0.72,
  });

  // 1. Stepped classical square plinth base (Y = 0..0.16m)
  const plinthLower = new THREE.Mesh(sharedUrnPlinthLowerGeo, weatheredStoneUrnMat);
  plinthLower.name = `${urnPrefix}.plinthLower`;
  plinthLower.position.set(0, 0.045, 0);
  plinthLower.castShadow = true;
  plinthLower.receiveShadow = true;
  urnGroup.add(plinthLower);

  const plinthUpper = new THREE.Mesh(sharedUrnPlinthUpperGeo, weatheredStoneUrnMat);
  plinthUpper.name = `${urnPrefix}.plinthUpper`;
  plinthUpper.position.set(0, 0.125, 0);
  plinthUpper.castShadow = true;
  plinthUpper.receiveShadow = true;
  urnGroup.add(plinthUpper);

  // 2. Fluted Trophy Pedestal Foot & Stem (Y = 0.16..0.38m)
  const socleFoot = new THREE.Mesh(sharedUrnSocleFootGeo, weatheredStoneUrnMat);
  socleFoot.name = `${urnPrefix}.socleFoot`;
  socleFoot.position.set(0, 0.205, 0);
  urnGroup.add(socleFoot);

  const stemKnop = new THREE.Mesh(sharedUrnStemKnopGeo, weatheredStoneUrnMat);
  stemKnop.name = `${urnPrefix}.stemKnop`;
  stemKnop.rotation.x = Math.PI / 2;
  stemKnop.position.set(0, 0.27, 0);
  urnGroup.add(stemKnop);

  const stemNeck = new THREE.Mesh(sharedUrnStemNeckGeo, weatheredStoneUrnMat);
  stemNeck.name = `${urnPrefix}.stemNeck`;
  stemNeck.position.set(0, 0.33, 0);
  urnGroup.add(stemNeck);

  // 3. Gadrooned Lower Trophy Cup Bowl & Flared Upper Chalice Body (Y = 0.38..0.78m)
  const cupLowerCalix = new THREE.Mesh(sharedUrnCupLowerCalixGeo, weatheredStoneUrnMat);
  cupLowerCalix.name = `${urnPrefix}.cupLowerCalix`;
  cupLowerCalix.position.set(0, 0.45, 0);
  cupLowerCalix.castShadow = true;
  urnGroup.add(cupLowerCalix);

  const cupMidCordon = new THREE.Mesh(sharedUrnCupMidCordonGeo, weatheredStoneUrnMat);
  cupMidCordon.name = `${urnPrefix}.cupMidCordon`;
  cupMidCordon.rotation.x = Math.PI / 2;
  cupMidCordon.position.set(0, 0.52, 0);
  urnGroup.add(cupMidCordon);

  const cupMainBody = new THREE.Mesh(sharedUrnCupMainBodyGeo, weatheredStoneUrnMat);
  cupMainBody.name = `${urnPrefix}.cupMainBody`;
  cupMainBody.position.set(0, 0.64, 0);
  cupMainBody.castShadow = true;
  cupMainBody.receiveShadow = true;
  urnGroup.add(cupMainBody);

  // Rolled classical Egg-and-Dart Trophy Lip Rim (Y = 0.77m)
  const cupLipRim = new THREE.Mesh(sharedUrnCupLipRimGeo, weatheredStoneUrnMat);
  cupLipRim.name = `${urnPrefix}.cupLipRim`;
  cupLipRim.rotation.x = Math.PI / 2;
  cupLipRim.position.set(0, 0.765, 0);
  cupLipRim.castShadow = true;
  urnGroup.add(cupLipRim);

  // 4. Twin Trophy Cup Handles on Left & Right Sides (-X and +X)
  for (const [side, sideTag] of [
    [-1, 'Left'],
    [1, 'Right'],
  ] as const) {
    const trophyHandle = new THREE.Mesh(sharedUrnTrophyHandleGeo, lionReliefMat);
    trophyHandle.name = `${urnPrefix}.trophyHandle${sideTag}`;
    trophyHandle.position.set(side * 0.275, 0.61, 0);
    trophyHandle.rotation.z = side > 0 ? -Math.PI * 0.55 : Math.PI * 0.55;
    trophyHandle.castShadow = true;
    tagHighLod(trophyHandle);
    urnGroup.add(trophyHandle);
  }

  // 5. Four Sculpted Relief Lion Heads around the Trophy Cup Belly (0, 90, 180, 270 deg)
  for (let a = 0; a < 4; a++) {
    const angle = (a * Math.PI) / 2;
    const lionPrefix = `${urnPrefix}.lionHead_${a}`;
    const lionHead = new THREE.Group();
    lionHead.name = lionPrefix;
    const radiusOnCup = 0.278;
    lionHead.position.set(
      Math.sin(angle) * radiusOnCup,
      0.635,
      Math.cos(angle) * radiusOnCup
    );
    lionHead.rotation.y = angle;
    tagHighLod(lionHead);

    // Sculpted Lion Mane Medallion Ruff
    const maneRuff = new THREE.Mesh(sharedLionManeRuffGeo, lionReliefMat);
    maneRuff.name = `${lionPrefix}.maneRuff`;
    tagHighLod(maneRuff);
    lionHead.add(maneRuff);

    // Lion Cranium & Brow Boss
    const lionSkull = new THREE.Mesh(sharedLionSkullGeo, lionReliefMat);
    lionSkull.name = `${lionPrefix}.skull`;
    lionSkull.scale.set(1.05, 1.12, 0.75);
    lionSkull.position.set(0, 0.008, 0.018);
    tagHighLod(lionSkull);
    lionHead.add(lionSkull);

    // Protruding Lion Snout / Muzzle & Jaws
    const lionMuzzle = new THREE.Mesh(sharedLionMuzzleGeo, lionReliefMat);
    lionMuzzle.name = `${lionPrefix}.muzzle`;
    lionMuzzle.position.set(0, -0.01, 0.042);
    tagHighLod(lionMuzzle);
    lionHead.add(lionMuzzle);

    // Sculpted Nose Bridge & Brow Ridge
    const lionBrow = new THREE.Mesh(sharedLionBrowGeo, lionReliefMat);
    lionBrow.name = `${lionPrefix}.browRidge`;
    lionBrow.position.set(0, 0.024, 0.04);
    tagHighLod(lionBrow);
    lionHead.add(lionBrow);

    // Classical Ring held in the Lion's Mouth
    const mouthRing = new THREE.Mesh(sharedLionMouthRingGeo, bronzeRingMat);
    mouthRing.name = `${lionPrefix}.mouthRing`;
    mouthRing.position.set(0, -0.042, 0.052);
    mouthRing.rotation.x = 0.18;
    tagHighLod(mouthRing);
    lionHead.add(mouthRing);

    urnGroup.add(lionHead);
  }

  // 6. Lush Boxwood Dome, Geraniums & Trailing Ivy planted inside the Trophy Cup
  const plantCrown = new THREE.Mesh(sharedUrnPlantCrownGeo, foliageMat);
  plantCrown.name = `${urnPrefix}.plantCrown`;
  plantCrown.scale.set(1.08, 0.78, 1.08);
  plantCrown.position.set(0, 0.86, 0);
  plantCrown.castShadow = true;
  urnGroup.add(plantCrown);

  const bloomConfigs = [
    [-0.11, 1.02, 0.08, true],
    [0.12, 1.01, -0.07, false],
    [0.02, 1.06, 0.02, true],
    [-0.08, 0.99, -0.11, false],
    [0.14, 0.98, 0.1, true],
  ] as const;
  for (let b = 0; b < bloomConfigs.length; b++) {
    const [bx, by, bz, isWhite] = bloomConfigs[b];
    const bloom = new THREE.Mesh(
      sharedUrnBloomGeo,
      isWhite ? whiteBloomMat : blushBloomMat
    );
    bloom.name = `${urnPrefix}.bloom_${b}`;
    bloom.position.set(bx, by, bz);
    tagHighLod(bloom);
    urnGroup.add(bloom);
  }

  scene.add(urnGroup);
}

let grindstoneInstanceCounter = 0;

/**
 * Builds an authentic reclaimed Farmhouse Yorkstone / Millstone Grit Grindstone wheel
 * with concentric stone dressing grooves, central eye hole, and rusted wrought-iron axle spindle.
 */
function buildOldGrindstone(
  scene: THREE.Scene,
  x: number,
  z: number,
  timberMat: THREE.Material
): void {
  const gsPrefix = `kitchen.courtyard.oldGrindstone_${grindstoneInstanceCounter++}`;
  const grindstoneGroup = new THREE.Group();
  grindstoneGroup.name = gsPrefix;
  grindstoneGroup.position.set(x, 0, z);
  grindstoneGroup.rotation.y = 0.28;

  const gritstoneMat = new THREE.MeshStandardMaterial({
    color: 0xa89d88,
    roughness: 0.9,
    metalness: 0.04,
  });
  const gritstoneDarkBandMat = new THREE.MeshStandardMaterial({
    color: 0x8e8370,
    roughness: 0.92,
  });
  const rustedIronMat = new THREE.MeshStandardMaterial({
    color: 0x3d2e26,
    roughness: 0.65,
    metalness: 0.75,
  });

  // Low weathered timber/stone cradle stand supporting the grindstone wheel
  for (const [sideZ, sideTag] of [
    [-0.11, 'North'],
    [0.11, 'South'],
  ] as const) {
    const beam = new THREE.Mesh(sharedGrindstoneBeamGeo, timberMat);
    beam.name = `${gsPrefix}.cradleBeam${sideTag}`;
    beam.position.set(0, 0.22, sideZ);
    beam.castShadow = true;
    beam.receiveShadow = true;
    grindstoneGroup.add(beam);
  }
  let legIdx = 0;
  for (const legX of [-0.36, 0.36]) {
    for (const legZ of [-0.11, 0.11]) {
      const leg = new THREE.Mesh(sharedGrindstoneLegGeo, timberMat);
      leg.name = `${gsPrefix}.cradleLeg_${legIdx++}`;
      leg.position.set(legX, 0.13, legZ);
      leg.castShadow = true;
      grindstoneGroup.add(leg);
    }
  }

  // Thick circular Millstone / Grindstone Wheel (radius 0.36m, thickness 0.13m)
  const wheelThickness = 0.13;
  const wheelCenterY = 0.42;

  const stoneWheel = new THREE.Mesh(sharedGrindstoneWheelGeo, gritstoneMat);
  stoneWheel.name = `${gsPrefix}.stoneWheel`;
  stoneWheel.rotation.x = Math.PI / 2;
  stoneWheel.position.set(0, wheelCenterY, 0);
  stoneWheel.castShadow = true;
  stoneWheel.receiveShadow = true;
  grindstoneGroup.add(stoneWheel);

  // Concentric dressed stone tooling rings on both faces of the grindstone
  let ringIdx = 0;
  for (const faceZ of [-wheelThickness / 2 - 0.002, wheelThickness / 2 + 0.002]) {
    for (const ringGeo of [sharedGrindstoneRingInnerGeo, sharedGrindstoneRingOuterGeo]) {
      const dressingRing = new THREE.Mesh(ringGeo, gritstoneDarkBandMat);
      dressingRing.name = `${gsPrefix}.dressingRing_${ringIdx++}`;
      dressingRing.position.set(0, wheelCenterY, faceZ);
      tagHighLod(dressingRing);
      grindstoneGroup.add(dressingRing);
    }
  }

  // Central square iron axle plate (eye boss) and rusted wrought-iron spindle + crank handle
  const axleEyePlate = new THREE.Mesh(sharedGrindstoneAxlePlateGeo, rustedIronMat);
  axleEyePlate.name = `${gsPrefix}.axleEyePlate`;
  axleEyePlate.position.set(0, wheelCenterY, 0);
  tagHighLod(axleEyePlate);
  grindstoneGroup.add(axleEyePlate);

  const ironSpindle = new THREE.Mesh(sharedGrindstoneSpindleGeo, rustedIronMat);
  ironSpindle.name = `${gsPrefix}.ironSpindle`;
  ironSpindle.rotation.x = Math.PI / 2;
  ironSpindle.position.set(0, wheelCenterY, 0);
  ironSpindle.castShadow = true;
  tagHighLod(ironSpindle);
  grindstoneGroup.add(ironSpindle);

  // Forged iron hand-crank arm on the front of the grindstone spindle
  const crankArm = new THREE.Mesh(sharedGrindstoneCrankArmGeo, rustedIronMat);
  crankArm.name = `${gsPrefix}.crankArm`;
  crankArm.position.set(0, wheelCenterY - 0.065, 0.175);
  tagHighLod(crankArm);
  grindstoneGroup.add(crankArm);

  const crankHandle = new THREE.Mesh(sharedGrindstoneCrankHandleGeo, rustedIronMat);
  crankHandle.name = `${gsPrefix}.crankHandle`;
  crankHandle.rotation.x = Math.PI / 2;
  crankHandle.position.set(0, wheelCenterY - 0.135, 0.215);
  tagHighLod(crankHandle);
  grindstoneGroup.add(crankHandle);

  scene.add(grindstoneGroup);
}
