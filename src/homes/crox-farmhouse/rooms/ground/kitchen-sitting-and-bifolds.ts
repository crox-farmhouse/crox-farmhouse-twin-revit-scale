import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import {
  createCementTexture,
  createDriftwoodTexture,
  createGraniteSettLPathTextures,
} from '../../../../engine/textures/procedural-textures.ts';
import { buildPatioAndGrapeVinePergola } from '../grounds/patio-and-grape-vine-pergola.ts';

export function buildSittingAreaAndOakBifolds(ctx: SceneBuilderContext): void {
  const { scene, bifoldPanels, cutawayWallGroups, interactions } = ctx;
  const southWallGroup = cutawayWallGroups.southWest;

  const rugMat = new THREE.MeshStandardMaterial({
    color: 0xc8beae,
    roughness: 0.92,
  });
  const rug = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.015, 1.8), rugMat);
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

  const chairConfigs: ReadonlyArray<{ readonly x: number; readonly z: number; readonly rotY: number }> = [
    { x: 2.7, z: 0.34, rotY: 0.35 },
    { x: 4.2, z: 0.34, rotY: -0.35 },
  ];

  for (const cfg of chairConfigs) {
    const chair = new THREE.Group();
    chair.position.set(cfg.x, 0, cfg.z);
    chair.rotation.y = cfg.rotY;

    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.16, 0.76), linenMat);
    seat.position.set(0, 0.4, 0);
    seat.castShadow = true;
    seat.receiveShadow = true;
    chair.add(seat);

    const baseFrame = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.05, 0.8), chairDriftwoodMat);
    baseFrame.position.set(0, 0.29, 0);
    chair.add(baseFrame);

    const back = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.48, 0.16), linenMat);
    back.position.set(0, 0.66, -0.31);
    back.rotation.x = -0.14;
    back.castShadow = true;
    chair.add(back);

    const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.26, 0.1), cushionAccentMat);
    pillow.position.set(0, 0.56, -0.2);
    pillow.rotation.x = -0.22;
    chair.add(pillow);

    for (const side of [-1, 1]) {
      // Driftwood armrest tilted slightly upwards towards the front (+Z)
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.044, 0.78), chairDriftwoodMat);
      arm.position.set(side * 0.41, 0.555, 0.01);
      arm.rotation.x = -0.15; // Raises front (+Z) end of arm higher than back (-Z)
      arm.castShadow = true;
      chair.add(arm);

      // Angled front leg (splayed forward & slightly outward from under the raised front armrest to floor)
      const frontLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.019, 0.62, 10),
        chairDriftwoodMat
      );
      frontLeg.position.set(side * 0.415, 0.295, 0.33);
      frontLeg.rotation.x = -0.28;
      frontLeg.rotation.z = -side * 0.05;
      frontLeg.castShadow = true;
      chair.add(frontLeg);

      // Angled rear leg (raked backward & slightly outward from the rear armrest/backrest to floor)
      const backLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.019, 0.58, 10),
        chairDriftwoodMat
      );
      backLeg.position.set(side * 0.415, 0.265, -0.34);
      backLeg.rotation.x = 0.34;
      backLeg.rotation.z = -side * 0.05;
      backLeg.castShadow = true;
      chair.add(backLeg);
    }

    scene.add(chair);
  }

  // Modern architectural cast-cement coffee table (monolithic drum plinth + thick slab top)
  // Issue #9: Moved 15cm forward (+Z: 0.82 -> 0.97) so it does not clip the lounge chairs
  const coffeeTable = new THREE.Group();
  coffeeTable.name = 'sitting.coffeeTable';
  coffeeTable.position.set(3.45, 0, 1.101);

  // Same cast-concrete material as the 3 concrete pendant lamp shades above the island
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
    new THREE.CylinderGeometry(0.24, 0.24, 0.035, 32),
    cementShadowPlinthMat
  );
  tablePlinth.position.set(0, 0.0175, 0);
  tablePlinth.receiveShadow = true;
  coffeeTable.add(tablePlinth);

  // Monolithic cylindrical cast-cement drum base
  const tableDrumBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.285, 0.295, 0.305, 36),
    cementMat
  );
  tableDrumBase.position.set(0, 0.185, 0);
  tableDrumBase.castShadow = true;
  tableDrumBase.receiveShadow = true;
  coffeeTable.add(tableDrumBase);

  // Thick cast-cement slab top with subtle bottom bevel collar
  const tableUnderBevel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.375, 0.34, 0.022, 36),
    cementMat
  );
  tableUnderBevel.position.set(0, 0.348, 0);
  coffeeTable.add(tableUnderBevel);

  const tableTop = new THREE.Mesh(
    new THREE.CylinderGeometry(0.375, 0.375, 0.075, 36),
    cementMat
  );
  tableTop.position.set(0, 0.396, 0);
  tableTop.castShadow = true;
  tableTop.receiveShadow = true;
  coffeeTable.add(tableTop);

  const book = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.028, 0.15),
    new THREE.MeshStandardMaterial({ color: 0x324b61, roughness: 0.6 })
  );
  book.position.set(-0.06, 0.448, 0.03);
  book.rotation.y = 0.28;
  coffeeTable.add(book);

  const mug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.032, 0.075, 12),
    new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.25 })
  );
  mug.position.set(0.11, 0.463, -0.05);
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

  // Large, thick structural Oak Mantle (Lintel Beam) spanning across the top of the bifold opening
  const oakMantle = new THREE.Mesh(
    new THREE.BoxGeometry(3.56, 0.26, 0.3),
    structuralOakMat
  );
  oakMantle.position.set(3.19, 2.61, 2.13);
  oakMantle.castShadow = true;
  oakMantle.receiveShadow = true;
  southWallGroup.add(oakMantle);

  // Large, thick structural Oak Uprights (Posts) on either side of the 4 white bifold doors
  for (const uprightX of [1.56, 4.82]) {
    const oakUpright = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 2.48, 0.29),
      structuralOakMat
    );
    oakUpright.position.set(uprightX, 1.24, 2.13);
    oakUpright.castShadow = true;
    oakUpright.receiveShadow = true;
    southWallGroup.add(oakUpright);

    // Traditional timber-frame oak pegs at the mortise-and-tenon joint between upright and mantle
    for (const dx of [-0.05, 0.05]) {
      const peg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.31, 8),
        darkOakPegMat
      );
      peg.rotation.x = Math.PI / 2;
      peg.position.set(uprightX + dx, 2.55, 2.13);
      southWallGroup.add(peg);
    }
  }

  // Thick Oak Threshold Sill at the base of the 4 white bifold doors
  const sill = new THREE.Mesh(new THREE.BoxGeometry(3.06, 0.035, 0.26), structuralOakMat);
  sill.position.set(3.19, 0.017, 2.12);
  southWallGroup.add(sill);

  // =========================================================================
  // LARGE 2.5M-WIDE 3-PANE FULL-HEIGHT WINDOW NEXT TO THE BIFOLDS (X = -1.68m to +0.82m, center X = -0.43m)
  // Framed by the same large thick structural Oak Mantel, Oak Upstands & Oak Sill
  // =========================================================================
  const southWinCenterX = -0.43;
  const southWinW = 2.5;
  const southWinH = 2.46;

  // Matching thick structural Oak Mantel (lintel beam) above the 3-pane full-height window
  const southWinOakMantle = new THREE.Mesh(
    new THREE.BoxGeometry(southWinW + 0.54, 0.26, 0.3),
    structuralOakMat
  );
  southWinOakMantle.position.set(southWinCenterX, 2.61, 2.13);
  southWinOakMantle.castShadow = true;
  southWinOakMantle.receiveShadow = true;
  southWallGroup.add(southWinOakMantle);

  // Matching thick structural Oak Upstands (left & right posts at X = -1.80m and X = +0.94m)
  for (const winUprightX of [
    southWinCenterX - southWinW * 0.5 - 0.12,
    southWinCenterX + southWinW * 0.5 + 0.12,
  ]) {
    const winOakUpright = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 2.48, 0.29),
      structuralOakMat
    );
    winOakUpright.position.set(winUprightX, 1.24, 2.13);
    winOakUpright.castShadow = true;
    winOakUpright.receiveShadow = true;
    southWallGroup.add(winOakUpright);

    // Traditional timber-frame oak pegs at the mortise-and-tenon joint
    for (const dx of [-0.05, 0.05]) {
      const peg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.31, 8),
        darkOakPegMat
      );
      peg.rotation.x = Math.PI / 2;
      peg.position.set(winUprightX + dx, 2.55, 2.13);
      southWallGroup.add(peg);
    }
  }

  // Matching Oak Threshold Sill at the base of the 3-pane full-height window
  const southWinSill = new THREE.Mesh(
    new THREE.BoxGeometry(southWinW + 0.06, 0.035, 0.26),
    structuralOakMat
  );
  southWinSill.position.set(southWinCenterX, 0.017, 2.12);
  southWallGroup.add(southWinSill);

  // 3 Full-Height Glazed Window Panes (each ~0.833m wide x 2.46m tall)
  const numWindowPanes = 3;
  const paneW = southWinW / numWindowPanes;
  const winStartX = southWinCenterX - southWinW * 0.5;

  for (let p = 0; p < numWindowPanes; p++) {
    const paneCenterX = winStartX + p * paneW + paneW * 0.5;
    const paneGroup = new THREE.Group();
    paneGroup.position.set(paneCenterX, 1.25, 2.12);

    for (const side of [-1, 1]) {
      const stile = new THREE.Mesh(
        new THREE.BoxGeometry(0.054, southWinH, 0.058),
        whiteBifoldFrameMat
      );
      stile.position.set(side * (paneW * 0.5 - 0.027), 0, 0);
      stile.castShadow = true;
      paneGroup.add(stile);
    }

    for (const vSide of [-1, 1]) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(paneW, 0.062, 0.058),
        whiteBifoldFrameMat
      );
      rail.position.set(0, vSide * (southWinH * 0.5 - 0.031), 0);
      rail.castShadow = true;
      paneGroup.add(rail);
    }

    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(paneW - 0.108, southWinH - 0.124, 0.016),
      glassMat
    );
    paneGroup.add(glass);

    southWallGroup.add(paneGroup);
  }

  // 4 Wider White Bifold Door Panes (totalWidth = 3.02m -> each pane is 0.755m wide, spanning X = +1.68m..+4.70m)
  const numLeaves = 4;
  const totalWidth = 3.02;
  const leafW = totalWidth / numLeaves;
  const leafH = 2.46;
  const startX = 1.68;

  for (let i = 0; i < numLeaves; i++) {
    const panelPivot = new THREE.Group();
    const closedX = startX + i * leafW + leafW / 2;
    panelPivot.position.set(closedX, 1.25, 2.12);

    const stileLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.054, leafH, 0.058),
      whiteBifoldFrameMat
    );
    stileLeft.position.set(-leafW / 2 + 0.027, 0, 0);
    panelPivot.add(stileLeft);

    const stileRight = new THREE.Mesh(
      new THREE.BoxGeometry(0.054, leafH, 0.058),
      whiteBifoldFrameMat
    );
    stileRight.position.set(leafW / 2 - 0.027, 0, 0);
    panelPivot.add(stileRight);

    const railTop = new THREE.Mesh(
      new THREE.BoxGeometry(leafW, 0.058, 0.058),
      whiteBifoldFrameMat
    );
    railTop.position.set(0, leafH / 2 - 0.029, 0);
    panelPivot.add(railTop);

    const railBot = new THREE.Mesh(
      new THREE.BoxGeometry(leafW, 0.068, 0.058),
      whiteBifoldFrameMat
    );
    railBot.position.set(0, -leafH / 2 + 0.034, 0);
    panelPivot.add(railBot);

    const glassPane = new THREE.Mesh(
      new THREE.BoxGeometry(leafW - 0.09, leafH - 0.11, 0.012),
      glassMat
    );
    panelPivot.add(glassPane);

    // Clicking any bifold door frame or glass pane toggles the 4-leaf concertina bifold doors
    interactions.registerBifoldDoor(panelPivot);

    const indexFromRight = numLeaves - 1 - i;
    southWallGroup.add(panelPivot);
    bifoldPanels.push({
      group: panelPivot,
      closedX,
      openX: indexFromRight,
      dir: indexFromRight % 2 === 0 ? 1 : -1,
    });
  }

  // =========================================================================
  // 1. COBBLED PATH RUNNING ALONGSIDE THE HOUSE (South: Z = +2.27m..+3.73m, wrapping around East: X = +5.28m..+6.74m)
  //    Uses a single unified world-space L-shaped texture & depth map so the repeating arc courses
  //    flow seamlessly around the South-East corner as part of the same image.
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
        // For PlaneGeometry rotated by rotation.x = -Math.PI / 2, local +Y maps to world -Z
        const wz = isHorizontalPlane ? cz - ly : cz + lz;
        const u = (wx - worldMinX) / worldSpanX;
        const v = 1 - (wz - worldMinZ) / worldSpanZ;
        uvAttr.setXY(i, u, v);
      }
      uvAttr.needsUpdate = true;
    }
    return geo;
  };

  const limestoneEdgingMat = new THREE.MeshStandardMaterial({
    color: 0xc9bfa8,
    roughness: 0.78,
  });

  // South cobblestone path in front of Kitchen (X = -4.64m to +5.28m, width 9.92m, Z = +2.27m to +3.73m;
  // butts cleanly against the East path at X = +5.28m so relief planes never overlap at [5.633, -0.01, 6.632], Issue #2!)
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

  // Issue #4 ("Boundary shrinks at this point to edge of pergola" at `[6.488, -0.01, 1.326]`),
  // Issue #1 ("There is a path between the house and the pergola" at `[5.387, 0.523, 4.643]`),
  // & Issue #2 ("Its a bit messed up around here" at `[5.633, -0.01, 6.632]`):
  // East cobblestone path running from the Utility Room Split Stable Exit Door (`Z = -1.85m`)
  // past the Kitchen East Window (`Z = -1.85m..+3.73m`) AND continuing South (`Z = +3.73m..+7.25m`)
  // right between the House/Patio (`X <= +5.26m`) and the Walled Grape-Vine Pergola (`X >= +6.82m`)!
  const eastCobblePath = new THREE.Mesh(
    applyWorldSpaceCobbleLPathUVs(
      new THREE.BoxGeometry(1.46, 0.105, 5.58),
      6.01,
      0.94,
      false
    ),
    graniteSettMat
  );
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
  eastCobblePathReliefTop.rotation.x = -Math.PI / 2;
  eastCobblePathReliefTop.position.set(6.01, -0.01, 0.94);
  eastCobblePathReliefTop.receiveShadow = true;
  scene.add(eastCobblePathReliefTop);

  // Southern continuation of the cobbled path between the Patio Shrub Bank (`X = +5.26m`) and the Pergola (`X = +6.82m`)
  // (`X = +5.28m..+6.74m, Z = +3.73m..+7.25m`, Issue #1 & Issue #3!)
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

  // Limestone border kerb segments along the outer East edge (with clean gaps at the Pergola entrance steps)
  for (const [zMin, zMax] of [
    [-1.85, 1.72],
    [3.58, 5.75],
  ] as const) {
    const segLen = zMax - zMin;
    const eastPathOuterKerb = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.115, segLen),
      limestoneEdgingMat
    );
    eastPathOuterKerb.position.set(6.78, -0.056, (zMin + zMax) * 0.5);
    eastPathOuterKerb.receiveShadow = true;
    scene.add(eastPathOuterKerb);
  }

  const eastPathNorthKerb = new THREE.Mesh(
    new THREE.BoxGeometry(1.54, 0.115, 0.08),
    limestoneEdgingMat
  );
  eastPathNorthKerb.position.set(6.05, -0.056, -1.89);
  eastPathNorthKerb.receiveShadow = true;
  scene.add(eastPathNorthKerb);

  // Reclaimed Yorkstone doorstep threshold directly outside the Utility Room Split Stable Exit Door (centered at Z = -1.365m)
  const utilityDoorStep = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.055, 1.06),
    limestoneEdgingMat
  );
  utilityDoorStep.position.set(5.46, -0.012, -1.365);
  utilityDoorStep.castShadow = true;
  utilityDoorStep.receiveShadow = true;
  scene.add(utilityDoorStep);

  // =========================================================================
  // 2. RAISED RATTAN SOFA LOUNGE PATIO (WEST) & WALLED GRAPE-VINE PERGOLA
  //    DINING COURT (EAST) SOUTH OF THE KITCHEN COBBLE PATH (Photos 1, 5, 8, 10, 11, 12)
  // =========================================================================
  buildPatioAndGrapeVinePergola(scene, southWallGroup, {
    limestoneEdgingMat,
    structuralOakMat,
    glassMat,
    buildLionHeadTrophyUrn,
    buildOldGrindstone,
  });
}

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
  const urnGroup = new THREE.Group();
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
  const plinthLower = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.09, 0.42),
    weatheredStoneUrnMat
  );
  plinthLower.position.set(0, 0.045, 0);
  plinthLower.castShadow = true;
  plinthLower.receiveShadow = true;
  urnGroup.add(plinthLower);

  const plinthUpper = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.07, 0.34),
    weatheredStoneUrnMat
  );
  plinthUpper.position.set(0, 0.125, 0);
  plinthUpper.castShadow = true;
  plinthUpper.receiveShadow = true;
  urnGroup.add(plinthUpper);

  // 2. Fluted Trophy Pedestal Foot & Stem (Y = 0.16..0.38m)
  const socleFoot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.165, 0.09, 16),
    weatheredStoneUrnMat
  );
  socleFoot.position.set(0, 0.205, 0);
  urnGroup.add(socleFoot);

  const stemKnop = new THREE.Mesh(
    new THREE.TorusGeometry(0.115, 0.026, 10, 16),
    weatheredStoneUrnMat
  );
  stemKnop.rotation.x = Math.PI / 2;
  stemKnop.position.set(0, 0.27, 0);
  urnGroup.add(stemKnop);

  const stemNeck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.135, 0.095, 0.11, 16),
    weatheredStoneUrnMat
  );
  stemNeck.position.set(0, 0.33, 0);
  urnGroup.add(stemNeck);

  // 3. Gadrooned Lower Trophy Cup Bowl & Flared Upper Chalice Body (Y = 0.38..0.78m)
  const cupLowerCalix = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.135, 0.14, 16),
    weatheredStoneUrnMat
  );
  cupLowerCalix.position.set(0, 0.45, 0);
  cupLowerCalix.castShadow = true;
  urnGroup.add(cupLowerCalix);

  const cupMidCordon = new THREE.Mesh(
    new THREE.TorusGeometry(0.255, 0.018, 10, 20),
    weatheredStoneUrnMat
  );
  cupMidCordon.rotation.x = Math.PI / 2;
  cupMidCordon.position.set(0, 0.52, 0);
  urnGroup.add(cupMidCordon);

  const cupMainBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.305, 0.245, 0.24, 20),
    weatheredStoneUrnMat
  );
  cupMainBody.position.set(0, 0.64, 0);
  cupMainBody.castShadow = true;
  cupMainBody.receiveShadow = true;
  urnGroup.add(cupMainBody);

  // Rolled classical Egg-and-Dart Trophy Lip Rim (Y = 0.77m)
  const cupLipRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.315, 0.028, 12, 24),
    weatheredStoneUrnMat
  );
  cupLipRim.rotation.x = Math.PI / 2;
  cupLipRim.position.set(0, 0.765, 0);
  cupLipRim.castShadow = true;
  urnGroup.add(cupLipRim);

  // 4. Twin Trophy Cup Handles on Left & Right Sides (-X and +X)
  for (const side of [-1, 1]) {
    const trophyHandle = new THREE.Mesh(
      new THREE.TorusGeometry(0.115, 0.02, 10, 18, Math.PI * 1.25),
      lionReliefMat
    );
    trophyHandle.position.set(side * 0.275, 0.61, 0);
    trophyHandle.rotation.z = side > 0 ? -Math.PI * 0.55 : Math.PI * 0.55;
    trophyHandle.castShadow = true;
    urnGroup.add(trophyHandle);
  }

  // 5. Four Sculpted Relief Lion Heads around the Trophy Cup Belly (0, 90, 180, 270 deg)
  for (let a = 0; a < 4; a++) {
    const angle = (a * Math.PI) / 2;
    const lionHead = new THREE.Group();
    const radiusOnCup = 0.278;
    lionHead.position.set(
      Math.sin(angle) * radiusOnCup,
      0.635,
      Math.cos(angle) * radiusOnCup
    );
    lionHead.rotation.y = angle;

    // Sculpted Lion Mane Medallion Ruff
    const maneRuff = new THREE.Mesh(
      new THREE.TorusGeometry(0.058, 0.022, 10, 14),
      lionReliefMat
    );
    lionHead.add(maneRuff);

    // Lion Cranium & Brow Boss
    const lionSkull = new THREE.Mesh(
      new THREE.SphereGeometry(0.052, 12, 10),
      lionReliefMat
    );
    lionSkull.scale.set(1.05, 1.12, 0.75);
    lionSkull.position.set(0, 0.008, 0.018);
    lionHead.add(lionSkull);

    // Protruding Lion Snout / Muzzle & Jaws
    const lionMuzzle = new THREE.Mesh(
      new THREE.BoxGeometry(0.048, 0.044, 0.045),
      lionReliefMat
    );
    lionMuzzle.position.set(0, -0.01, 0.042);
    lionHead.add(lionMuzzle);

    // Sculpted Nose Bridge & Brow Ridge
    const lionBrow = new THREE.Mesh(
      new THREE.BoxGeometry(0.056, 0.018, 0.032),
      lionReliefMat
    );
    lionBrow.position.set(0, 0.024, 0.04);
    lionHead.add(lionBrow);

    // Classical Ring held in the Lion's Mouth
    const mouthRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.028, 0.006, 8, 14),
      bronzeRingMat
    );
    mouthRing.position.set(0, -0.042, 0.052);
    mouthRing.rotation.x = 0.18;
    lionHead.add(mouthRing);

    urnGroup.add(lionHead);
  }

  // 6. Lush Boxwood Dome, Geraniums & Trailing Ivy planted inside the Trophy Cup
  const plantCrown = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 14, 12),
    foliageMat
  );
  plantCrown.scale.set(1.08, 0.78, 1.08);
  plantCrown.position.set(0, 0.86, 0);
  plantCrown.castShadow = true;
  urnGroup.add(plantCrown);

  const bloomGeo = new THREE.SphereGeometry(0.045, 8, 8);
  for (const [bx, by, bz, isWhite] of [
    [-0.11, 1.02, 0.08, true],
    [0.12, 1.01, -0.07, false],
    [0.02, 1.06, 0.02, true],
    [-0.08, 0.99, -0.11, false],
    [0.14, 0.98, 0.1, true],
  ] as const) {
    const bloom = new THREE.Mesh(bloomGeo, isWhite ? whiteBloomMat : blushBloomMat);
    bloom.position.set(bx, by, bz);
    urnGroup.add(bloom);
  }

  scene.add(urnGroup);
}

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
  const grindstoneGroup = new THREE.Group();
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
  for (const sideZ of [-0.11, 0.11]) {
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(0.86, 0.14, 0.075),
      timberMat
    );
    beam.position.set(0, 0.22, sideZ);
    beam.castShadow = true;
    beam.receiveShadow = true;
    grindstoneGroup.add(beam);
  }
  for (const legX of [-0.36, 0.36]) {
    for (const legZ of [-0.11, 0.11]) {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.07, 0.26, 0.07),
        timberMat
      );
      leg.position.set(legX, 0.13, legZ);
      leg.castShadow = true;
      grindstoneGroup.add(leg);
    }
  }

  // Thick circular Millstone / Grindstone Wheel (radius 0.36m, thickness 0.13m)
  const wheelRadius = 0.36;
  const wheelThickness = 0.13;
  const wheelCenterY = 0.42;

  const stoneWheel = new THREE.Mesh(
    new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelThickness, 28),
    gritstoneMat
  );
  stoneWheel.rotation.x = Math.PI / 2;
  stoneWheel.position.set(0, wheelCenterY, 0);
  stoneWheel.castShadow = true;
  stoneWheel.receiveShadow = true;
  grindstoneGroup.add(stoneWheel);

  // Concentric dressed stone tooling rings on both faces of the grindstone
  for (const faceZ of [-wheelThickness / 2 - 0.002, wheelThickness / 2 + 0.002]) {
    for (const ringR of [0.16, 0.26]) {
      const dressingRing = new THREE.Mesh(
        new THREE.TorusGeometry(ringR, 0.006, 6, 24),
        gritstoneDarkBandMat
      );
      dressingRing.position.set(0, wheelCenterY, faceZ);
      grindstoneGroup.add(dressingRing);
    }
  }

  // Central square iron axle plate (eye boss) and rusted wrought-iron spindle + crank handle
  const axleEyePlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.11, wheelThickness + 0.03),
    rustedIronMat
  );
  axleEyePlate.position.set(0, wheelCenterY, 0);
  grindstoneGroup.add(axleEyePlate);

  const ironSpindle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 0.34, 10),
    rustedIronMat
  );
  ironSpindle.rotation.x = Math.PI / 2;
  ironSpindle.position.set(0, wheelCenterY, 0);
  ironSpindle.castShadow = true;
  grindstoneGroup.add(ironSpindle);

  // Forged iron hand-crank arm on the front of the grindstone spindle
  const crankArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.16, 0.016),
    rustedIronMat
  );
  crankArm.position.set(0, wheelCenterY - 0.065, 0.175);
  grindstoneGroup.add(crankArm);

  const crankHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.09, 8),
    rustedIronMat
  );
  crankHandle.rotation.x = Math.PI / 2;
  crankHandle.position.set(0, wheelCenterY - 0.135, 0.215);
  grindstoneGroup.add(crankHandle);

  scene.add(grindstoneGroup);
}
