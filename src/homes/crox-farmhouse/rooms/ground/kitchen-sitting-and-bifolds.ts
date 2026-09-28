import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import {
  createCementTexture,
  createCourtyardStoneTexture,
  createDriftwoodTexture,
  createGraniteSettLPathTextures,
  createImperialBrickTextures,
} from '../../../../engine/textures/procedural-textures.ts';

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
      const worldSpanZ = 6.51;

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

  // South cobblestone path (X = -4.64m to +6.74m, width 11.38m, Z = +2.27m to +3.73m)
  const granitePath = new THREE.Mesh(
    applyWorldSpaceCobbleLPathUVs(
      new THREE.BoxGeometry(11.38, 0.105, 1.46),
      1.05,
      3.0,
      false
    ),
    graniteSettMat
  );
  granitePath.name = 'courtyard.southCobblePath';
  granitePath.userData.isArchitecturalShell = true;
  granitePath.position.set(1.05, -0.064, 3.0);
  granitePath.receiveShadow = true;
  scene.add(granitePath);

  const granitePathReliefTop = new THREE.Mesh(
    applyWorldSpaceCobbleLPathUVs(
      new THREE.PlaneGeometry(11.38, 1.46, 186, 24),
      1.05,
      3.0,
      true
    ),
    graniteSettTopReliefMat
  );
  granitePathReliefTop.name = 'courtyard.southCobblePathReliefTop';
  granitePathReliefTop.userData.isArchitecturalShell = true;
  granitePathReliefTop.rotation.x = -Math.PI / 2;
  granitePathReliefTop.position.set(1.05, -0.01, 3.0);
  granitePathReliefTop.receiveShadow = true;
  scene.add(granitePathReliefTop);

  // East wrap-around cobblestone path running all the way North along the East wall
  // in front of the Full-Height East Window AND the Utility Room Split Stable Exit Door (X = +5.28m..+6.74m, Z = -2.78m..+2.27m)
  const eastCobblePath = new THREE.Mesh(
    applyWorldSpaceCobbleLPathUVs(
      new THREE.BoxGeometry(1.46, 0.105, 5.05),
      6.01,
      -0.255,
      false
    ),
    graniteSettMat
  );
  eastCobblePath.position.set(6.01, -0.064, -0.255);
  eastCobblePath.receiveShadow = true;
  scene.add(eastCobblePath);

  const eastCobblePathReliefTop = new THREE.Mesh(
    applyWorldSpaceCobbleLPathUVs(
      new THREE.PlaneGeometry(1.46, 5.05, 24, 84),
      6.01,
      -0.255,
      true
    ),
    graniteSettTopReliefMat
  );
  eastCobblePathReliefTop.rotation.x = -Math.PI / 2;
  eastCobblePathReliefTop.position.set(6.01, -0.01, -0.255);
  eastCobblePathReliefTop.receiveShadow = true;
  scene.add(eastCobblePathReliefTop);

  // Limestone border kerb running along the outer East edge and North return of the wrap-around cobblestone path
  const eastPathOuterKerb = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.115, 6.54),
    limestoneEdgingMat
  );
  eastPathOuterKerb.position.set(6.78, -0.056, 0.48);
  eastPathOuterKerb.receiveShadow = true;
  scene.add(eastPathOuterKerb);

  const eastPathNorthKerb = new THREE.Mesh(
    new THREE.BoxGeometry(1.54, 0.115, 0.08),
    limestoneEdgingMat
  );
  eastPathNorthKerb.position.set(6.05, -0.056, -2.82);
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
  // 2. LOW BRICK THRESHOLD WALL ALONG THE EDGE OF THE PATH (Z = +3.73m to +3.95m)
  //    (Only ~0.24m high — a low reclaimed brick threshold with a step-through gap)
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

  // Left (West) section of the low brick threshold wall: X = -4.64m to +2.56m (width 7.20m)
  const lowBrickWallWest = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(7.2, 0.21, 0.22), -1.04, 0.095, 3.84),
    brickWallMat
  );
  lowBrickWallWest.position.set(-1.04, 0.095, 3.84);
  lowBrickWallWest.castShadow = true;
  lowBrickWallWest.receiveShadow = true;
  scene.add(lowBrickWallWest);

  const lowBrickCopingWest = new THREE.Mesh(
    new THREE.BoxGeometry(7.24, 0.045, 0.25),
    brickSoldierCopingMat
  );
  lowBrickCopingWest.position.set(-1.04, 0.222, 3.84);
  lowBrickCopingWest.castShadow = true;
  lowBrickCopingWest.receiveShadow = true;
  scene.add(lowBrickCopingWest);

  // Square Red-Brick Corner Pier with Stone Pyramid Cap at the West Corner of the Low Retaining Wall
  // (X = -4.52m, Z = +3.84m — visible on the right of Photo 3 and center of Photo 1!)
  const westCornerPier = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(0.36, 0.42, 0.36), -4.52, 0.2, 3.84),
    brickWallMat
  );
  westCornerPier.position.set(-4.52, 0.2, 3.84);
  westCornerPier.castShadow = true;
  westCornerPier.receiveShadow = true;
  scene.add(westCornerPier);

  const westCornerPierCap = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.065, 0.42),
    limestoneEdgingMat
  );
  westCornerPierCap.position.set(-4.52, 0.44, 3.84);
  westCornerPierCap.castShadow = true;
  scene.add(westCornerPierCap);

  // West Return of the Low Brick Retaining Wall separating the Raised Limestone Patio Terrace
  // from the Main Cobbled Courtyard (X = -4.52m, Z = +3.84m..+6.98m)
  const lowBrickReturnWest = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(0.22, 0.21, 3.14), -4.52, 0.095, 5.41),
    brickWallMat
  );
  lowBrickReturnWest.position.set(-4.52, 0.095, 5.41);
  lowBrickReturnWest.castShadow = true;
  lowBrickReturnWest.receiveShadow = true;
  scene.add(lowBrickReturnWest);

  const lowBrickReturnCopingWest = new THREE.Mesh(
    new THREE.BoxGeometry(0.25, 0.045, 3.16),
    brickSoldierCopingMat
  );
  lowBrickReturnCopingWest.position.set(-4.52, 0.222, 5.41);
  lowBrickReturnCopingWest.castShadow = true;
  scene.add(lowBrickReturnCopingWest);

  // Right (East) section of the low brick threshold wall: X = +3.82m to +6.74m (width 2.92m, meeting the East wrap-around path corner)
  const lowBrickWallEast = new THREE.Mesh(
    applyCourtyardBrickUVs(new THREE.BoxGeometry(2.92, 0.21, 0.22), 5.28, 0.095, 3.84),
    brickWallMat
  );
  lowBrickWallEast.position.set(5.28, 0.095, 3.84);
  lowBrickWallEast.castShadow = true;
  lowBrickWallEast.receiveShadow = true;
  scene.add(lowBrickWallEast);

  const lowBrickCopingEast = new THREE.Mesh(
    new THREE.BoxGeometry(2.96, 0.045, 0.25),
    brickSoldierCopingMat
  );
  lowBrickCopingEast.position.set(5.28, 0.222, 3.84);
  lowBrickCopingEast.castShadow = true;
  lowBrickCopingEast.receiveShadow = true;
  scene.add(lowBrickCopingEast);

  // Flush brick/stone threshold step in the walk-through opening (X = +2.56m..+3.82m)
  const thresholdStep = new THREE.Mesh(
    new THREE.BoxGeometry(1.26, 0.115, 0.24),
    limestoneEdgingMat
  );
  thresholdStep.position.set(3.19, -0.052, 3.84);
  thresholdStep.receiveShadow = true;
  scene.add(thresholdStep);

  // =========================================================================
  // 3. PLANTED FLOWER BED IMMEDIATELY BEYOND THE LOW BRICK THRESHOLD (Z = +3.95m to +4.71m)
  // =========================================================================
  const soilMat = new THREE.MeshStandardMaterial({
    color: 0x3b2b1e,
    roughness: 0.96,
  });
  const sageFoliageMat = new THREE.MeshStandardMaterial({
    color: 0x4f6846,
    roughness: 0.86,
  });
  const deepGreenFoliageMat = new THREE.MeshStandardMaterial({
    color: 0x385233,
    roughness: 0.84,
  });
  const lavenderBloomMat = new THREE.MeshStandardMaterial({
    color: 0x7c68a6,
    roughness: 0.8,
  });
  const whiteBloomMat = new THREE.MeshStandardMaterial({
    color: 0xf2ece0,
    roughness: 0.75,
  });
  const blushBloomMat = new THREE.MeshStandardMaterial({
    color: 0xd99ca5,
    roughness: 0.78,
  });

  // West Flower Bed soil mound (X = -4.60m to +2.53m, Z = +3.95m to +4.69m)
  const flowerBedSoilWest = new THREE.Mesh(
    new THREE.BoxGeometry(7.13, 0.12, 0.74),
    soilMat
  );
  flowerBedSoilWest.position.set(-1.035, -0.045, 4.32);
  flowerBedSoilWest.receiveShadow = true;
  scene.add(flowerBedSoilWest);

  // East Flower Bed soil mound (X = +3.85m to +6.71m, Z = +3.95m to +4.69m)
  const flowerBedSoilEast = new THREE.Mesh(
    new THREE.BoxGeometry(2.86, 0.12, 0.74),
    soilMat
  );
  flowerBedSoilEast.position.set(5.28, -0.045, 4.32);
  flowerBedSoilEast.receiveShadow = true;
  scene.add(flowerBedSoilEast);

  // Limestone border kerb separating the flower bed from the limestone slabs (Z = +4.71m)
  const bedKerbWest = new THREE.Mesh(
    new THREE.BoxGeometry(7.18, 0.12, 0.06),
    limestoneEdgingMat
  );
  bedKerbWest.position.set(-1.035, -0.04, 4.71);
  bedKerbWest.receiveShadow = true;
  scene.add(bedKerbWest);

  const bedKerbEast = new THREE.Mesh(
    new THREE.BoxGeometry(2.9, 0.12, 0.06),
    limestoneEdgingMat
  );
  bedKerbEast.position.set(5.28, -0.04, 4.71);
  bedKerbEast.receiveShadow = true;
  scene.add(bedKerbEast);

  // Cottage-garden perennial clumps, lavender bushes & hydrangea blooms along the flower beds
  const flowerBedClumps: ReadonlyArray<{
    readonly x: number;
    readonly z: number;
    readonly r: number;
    readonly h: number;
    readonly kind: 'lavender' | 'hydrangea' | 'rose' | 'box';
  }> = [
    { x: -3.6, z: 4.31, r: 0.34, h: 0.32, kind: 'lavender' },
    { x: -2.75, z: 4.35, r: 0.38, h: 0.38, kind: 'hydrangea' },
    { x: -1.85, z: 4.29, r: 0.32, h: 0.28, kind: 'box' },
    { x: -1.05, z: 4.34, r: 0.36, h: 0.35, kind: 'lavender' },
    { x: -0.2, z: 4.31, r: 0.4, h: 0.4, kind: 'rose' },
    { x: 0.68, z: 4.33, r: 0.35, h: 0.34, kind: 'lavender' },
    { x: 1.52, z: 4.3, r: 0.38, h: 0.38, kind: 'hydrangea' },
    { x: 4.2, z: 4.31, r: 0.34, h: 0.34, kind: 'lavender' },
    { x: 4.92, z: 4.35, r: 0.38, h: 0.4, kind: 'hydrangea' },
    { x: 5.65, z: 4.3, r: 0.33, h: 0.32, kind: 'rose' },
    { x: 6.32, z: 4.33, r: 0.34, h: 0.34, kind: 'lavender' },
  ];

  const clumpSphereGeo = new THREE.SphereGeometry(1, 12, 10);
  const bloomSphereGeo = new THREE.SphereGeometry(0.055, 8, 8);

  for (const clump of flowerBedClumps) {
    const mound = new THREE.Mesh(
      clumpSphereGeo,
      clump.kind === 'box' ? deepGreenFoliageMat : sageFoliageMat
    );
    mound.scale.set(clump.r, clump.h, clump.r * 0.88);
    mound.position.set(clump.x, clump.h * 0.42, clump.z);
    mound.castShadow = true;
    mound.receiveShadow = true;
    scene.add(mound);

    if (clump.kind !== 'box') {
      const bloomMat =
        clump.kind === 'lavender'
          ? lavenderBloomMat
          : clump.kind === 'hydrangea'
            ? whiteBloomMat
            : blushBloomMat;
      for (const [bx, by, bz] of [
        [-0.12, clump.h * 0.78, -0.06],
        [0.11, clump.h * 0.82, 0.05],
        [0.0, clump.h * 0.9, -0.02],
        [-0.05, clump.h * 0.74, 0.1],
        [0.14, clump.h * 0.72, -0.08],
      ] as const) {
        const floret = new THREE.Mesh(bloomSphereGeo, bloomMat);
        floret.position.set(clump.x + bx, by, clump.z + bz);
        scene.add(floret);
      }
    }
  }

  // =========================================================================
  // 4. RIVEN LIMESTONE PAVING SLABS BEYOND THE FLOWER BED (Z = +4.73m to +6.98m)
  // =========================================================================
  const limestoneSlabTex = createCourtyardStoneTexture();
  const limestoneSlabMat = new THREE.MeshStandardMaterial({
    map: limestoneSlabTex,
    roughness: 0.78,
    metalness: 0.04,
  });

  // Main Limestone Flagstone Terrace (X = -4.64m to +6.74m, Z = +4.73m to +6.98m)
  const limestoneTerrace = new THREE.Mesh(
    new THREE.BoxGeometry(11.38, 0.104, 2.25),
    limestoneSlabMat
  );
  limestoneTerrace.position.set(1.05, -0.065, 5.855);
  limestoneTerrace.receiveShadow = true;
  scene.add(limestoneTerrace);

  // Walk-through Limestone Flagstone Bridge between the two flower beds (X = +2.54m..+3.84m, Z = +3.95m..+4.73m)
  const walkThroughSlabs = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.106, 0.78),
    limestoneSlabMat
  );
  walkThroughSlabs.position.set(3.19, -0.063, 4.34);
  walkThroughSlabs.receiveShadow = true;
  scene.add(walkThroughSlabs);

  // =========================================================================
  // 5. DECORATIVE TROPHY / CUP PLANTER WITH SCULPTED LION HEADS (Campagna / Medici Urn)
  //    Standing on the Limestone Slabs beside the step-through at (X = +4.05m, Z = +5.08m)
  // =========================================================================
  buildLionHeadTrophyUrn(scene, 4.05, 5.08, deepGreenFoliageMat, whiteBloomMat, blushBloomMat);

  // =========================================================================
  // 6. OLD RECLAIMED YORKSTONE GRINDSTONE (MILLSTONE WHEEL + IRON AXLE SPINDLE)
  //    Nestled beside the low brick threshold & flower bed at (X = +1.95m, Z = +4.31m)
  // =========================================================================
  buildOldGrindstone(scene, 1.95, 4.31, structuralOakMat);

  // =========================================================================
  // 7. TERRACOTTA & STONE GARDEN POTS ON THE LIMESTONE SLABS & SMALL BAY LEAF TREES BY UTILITY DOOR
  // =========================================================================
  const potMat = new THREE.MeshStandardMaterial({ color: 0xa45a3f, roughness: 0.75 });
  const courtyardTreePositions: ReadonlyArray<readonly [number, number]> = [
    [-0.65, 5.58],
    [2.25, 5.78],
    [5.05, 5.63],
  ];
  for (const [px, pz] of courtyardTreePositions) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.21, 0.48, 14), potMat);
    pot.position.set(px, 0.24, pz);
    pot.castShadow = true;
    pot.receiveShadow = true;
    scene.add(pot);

    const potRim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.024, 8, 16), potMat);
    potRim.rotation.x = Math.PI / 2;
    potRim.position.set(px, 0.47, pz);
    scene.add(potRim);

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.048, 0.72, 8),
      structuralOakMat
    );
    trunk.position.set(px, 0.74, pz);
    trunk.castShadow = true;
    scene.add(trunk);

    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.44, 14, 12), sageFoliageMat);
    canopy.scale.set(1.1, 0.88, 1.1);
    canopy.position.set(px, 1.26, pz);
    canopy.castShadow = true;
    scene.add(canopy);
  }

  // Pair of smaller clipped Bay Leaf (Laurus nobilis) lollipop topiary trees flanking the Utility Split Stable Door,
  // set further out from the East brick wall (X = +5.85m -> ~57cm clear of the X = +5.28m outer brick face)
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

    // Slender straight woody standard stem
    const bayStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.022, 0.52, 8),
      structuralOakMat
    );
    bayStem.position.set(bx, 0.56, bz);
    bayStem.castShadow = true;
    scene.add(bayStem);

    // Compact, neatly clipped spherical Bay Leaf (Laurus nobilis) topiary ball crown (radius ~0.23m)
    const bayCrownCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 14, 12),
      bayLeafDarkMat
    );
    bayCrownCore.scale.set(1.0, 1.06, 1.0);
    bayCrownCore.position.set(bx, 0.96, bz);
    bayCrownCore.castShadow = true;
    bayCrownCore.receiveShadow = true;
    scene.add(bayCrownCore);

    // Textured leafy bay-laurel sub-clusters around the clipped sphere
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

  // =========================================================================
  // 8. CLIMBING GREEN IVY ON THE KITCHEN SOUTH BRICK PIER BETWEEN THE 3-PANE
  //    WINDOW AND THE 4-LEAF BIFOLDS (X = +1.15m, Z = +2.29m — Photos 1 & 3)
  // =========================================================================
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
  // 9. L-SHAPED CHARCOAL WOVEN RATTAN OUTDOOR CORNER SOFA & COFFEE TABLE
  //    ON THE WEST SIDE OF THE LIMESTONE PATIO TERRACE (Photos 1 & 3)
  // =========================================================================
  const rattanGroup = new THREE.Group();
  rattanGroup.position.set(-2.65, 0, 5.75);

  const charcoalRattanMat = new THREE.MeshStandardMaterial({
    color: 0x2c2e32,
    roughness: 0.76,
    metalness: 0.06,
  });
  const outdoorCushionMat = new THREE.MeshStandardMaterial({
    color: 0xd8d5ce,
    roughness: 0.82,
    metalness: 0.02,
  });
  const outdoorAccentPillowMat = new THREE.MeshStandardMaterial({
    color: 0x56636e,
    roughness: 0.78,
  });

  // North-West Wing of the L-Sofa (running East-West along local Z = -0.58m, length 2.15m, depth 0.82m)
  const sofaNorthBase = new THREE.Mesh(
    new THREE.BoxGeometry(2.15, 0.28, 0.82),
    charcoalRattanMat
  );
  sofaNorthBase.position.set(0, 0.16, -0.58);
  sofaNorthBase.castShadow = true;
  sofaNorthBase.receiveShadow = true;
  rattanGroup.add(sofaNorthBase);

  const sofaNorthBack = new THREE.Mesh(
    new THREE.BoxGeometry(2.15, 0.46, 0.14),
    charcoalRattanMat
  );
  sofaNorthBack.position.set(0, 0.53, -0.92);
  sofaNorthBack.castShadow = true;
  rattanGroup.add(sofaNorthBack);

  const sofaNorthEastArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.38, 0.82),
    charcoalRattanMat
  );
  sofaNorthEastArm.position.set(1.005, 0.49, -0.58);
  sofaNorthEastArm.castShadow = true;
  rattanGroup.add(sofaNorthEastArm);

  // West Wing of the L-Sofa (running North-South along local X = -0.665m, Z = -0.17m..+1.05m)
  const sofaWestBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.82, 0.28, 1.22),
    charcoalRattanMat
  );
  sofaWestBase.position.set(-0.665, 0.16, 0.44);
  sofaWestBase.castShadow = true;
  sofaWestBase.receiveShadow = true;
  rattanGroup.add(sofaWestBase);

  const sofaWestBack = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.46, 1.9),
    charcoalRattanMat
  );
  sofaWestBack.position.set(-1.005, 0.53, 0.03);
  sofaWestBack.castShadow = true;
  rattanGroup.add(sofaWestBack);

  const sofaSouthArm = new THREE.Mesh(
    new THREE.BoxGeometry(0.82, 0.38, 0.14),
    charcoalRattanMat
  );
  sofaSouthArm.position.set(-0.665, 0.49, 0.98);
  sofaSouthArm.castShadow = true;
  rattanGroup.add(sofaSouthArm);

  // Plush pale-grey outdoor seat & backrest cushions along both wings of the L-sofa
  for (const cx of [-0.62, 0.0, 0.62]) {
    const seatCushion = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.11, 0.66),
      outdoorCushionMat
    );
    seatCushion.position.set(cx, 0.355, -0.51);
    seatCushion.castShadow = true;
    seatCushion.receiveShadow = true;
    rattanGroup.add(seatCushion);

    const backCushion = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.32, 0.13),
      outdoorCushionMat
    );
    backCushion.position.set(cx, 0.56, -0.78);
    backCushion.rotation.x = 0.12;
    backCushion.castShadow = true;
    rattanGroup.add(backCushion);
  }

  for (const cz of [0.08, 0.64]) {
    const seatCushion = new THREE.Mesh(
      new THREE.BoxGeometry(0.66, 0.11, 0.54),
      outdoorCushionMat
    );
    seatCushion.position.set(-0.59, 0.355, cz);
    seatCushion.castShadow = true;
    seatCushion.receiveShadow = true;
    rattanGroup.add(seatCushion);

    const backCushion = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.32, 0.52),
      outdoorCushionMat
    );
    backCushion.position.set(-0.86, 0.56, cz);
    backCushion.rotation.z = -0.12;
    backCushion.castShadow = true;
    rattanGroup.add(backCushion);
  }

  // Scatter pillows in the corner and ends of the outdoor sofa
  for (const [px, pz, rotY] of [
    [-0.78, -0.72, 0.78],
    [0.78, -0.68, -0.45],
    [-0.72, 0.78, 1.2],
  ] as const) {
    const pillow = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.28, 0.1),
      outdoorAccentPillowMat
    );
    pillow.position.set(px, 0.54, pz);
    pillow.rotation.y = rotY;
    pillow.castShadow = true;
    rattanGroup.add(pillow);
  }

  // Matching Rectangular Charcoal Rattan Coffee Table with Tempered Glass Top
  const rattanTableBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.96, 0.36, 0.58),
    charcoalRattanMat
  );
  rattanTableBase.position.set(0.28, 0.18, 0.32);
  rattanTableBase.castShadow = true;
  rattanTableBase.receiveShadow = true;
  rattanGroup.add(rattanTableBase);

  const rattanTableGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.94, 0.016, 0.56),
    glassMat
  );
  rattanTableGlass.position.set(0.28, 0.37, 0.32);
  rattanGroup.add(rattanTableGlass);

  scene.add(rattanGroup);

  // =========================================================================
  // 10. VINE-COVERED TIMBER GARDEN PERGOLA ON THE EAST / SOUTH-EAST PATIO
  //     (X = +2.65m..+6.15m, Z = +4.95m..+6.85m — Photos 1 & 2)
  // =========================================================================
  const pergolaGroup = new THREE.Group();
  const pergMinX = 2.65;
  const pergMaxX = 6.15;
  const pergMinZ = 4.95;
  const pergMaxZ = 6.85;
  const pergH = 2.48;

  // 4 Square Weathered Oak Corner Posts
  for (const px of [pergMinX, pergMaxX]) {
    for (const pz of [pergMinZ, pergMaxZ]) {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.13, pergH, 0.13),
        structuralOakMat
      );
      post.position.set(px, pergH / 2, pz);
      post.castShadow = true;
      post.receiveShadow = true;
      pergolaGroup.add(post);
    }
  }

  // Front & Rear East-West Main Bearer Beams (overhanging 0.25m past the corner posts)
  const bearerLenX = pergMaxX - pergMinX + 0.5;
  const bearerMidX = (pergMinX + pergMaxX) / 2;
  for (const bz of [pergMinZ, pergMaxZ]) {
    const bearer = new THREE.Mesh(
      new THREE.BoxGeometry(bearerLenX, 0.14, 0.08),
      structuralOakMat
    );
    bearer.position.set(bearerMidX, pergH - 0.04, bz);
    bearer.castShadow = true;
    pergolaGroup.add(bearer);
  }

  // 7 Notched North-South Cross-Rafters across the top of the Pergola
  const rafterLenZ = pergMaxZ - pergMinZ + 0.44;
  const rafterMidZ = (pergMinZ + pergMaxZ) / 2;
  for (let rx = pergMinX - 0.1; rx <= pergMaxX + 0.11; rx += 0.6) {
    const rafter = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.12, rafterLenZ),
      structuralOakMat
    );
    rafter.position.set(rx, pergH + 0.07, rafterMidZ);
    rafter.castShadow = true;
    pergolaGroup.add(rafter);
  }

  // Lush Green Grapevine & Wisteria Foliage Canopy draped across the Pergola Rafters (Photos 1 & 2)
  for (let i = 0; i < 24; i++) {
    const fx = pergMinX - 0.05 + (i % 6) * 0.68 + (i % 2) * 0.14;
    const fz = pergMinZ + Math.floor(i / 6) * 0.58 + ((i * 3) % 2) * 0.12;
    const r = 0.28 + (i % 3) * 0.06;
    const vineCluster = new THREE.Mesh(
      pierIvyGeo,
      i % 2 === 0 ? deepGreenFoliageMat : sageFoliageMat
    );
    vineCluster.scale.set(r * 1.35, r * 0.55, r * 1.25);
    vineCluster.position.set(fx, pergH + 0.12, fz);
    vineCluster.castShadow = true;
    vineCluster.receiveShadow = true;
    pergolaGroup.add(vineCluster);
  }

  scene.add(pergolaGroup);
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
