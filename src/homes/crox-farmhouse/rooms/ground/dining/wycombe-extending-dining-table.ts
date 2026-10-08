import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../../core/types/scene.ts';
import type { DiningRoomKit } from '../dining-room.ts';

export function buildWycombeExtendingDiningTable(
  ctx: SceneBuilderContext,
  kit: DiningRoomKit
): void {
  const { interactions, scene } = ctx;
  const { brassMat, ceramicWhiteMat } = kit;
  // Neptune Wycombe Extending Dining Table (WYC-TAB-210-EXT: 210cm x 100cm x 75cm -> extends to 286cm 10-person mode when clicked!)
  // & 6 / 10 Natural Pale Oak Spindle-Back Chairs with Woven Rush/Paper-Cord Seats (matching media_1790538918078.jpg)
  // Issue #1: Moved to [-6.55, 0, -0.607]
  // Issue #10: Clicking the dining table toggles between 6-person standard mode and 10-person extended mode!
  const wycombeGroup = new THREE.Group();
  wycombeGroup.name = 'familyRoom.neptuneWycombeDiningTable';
  wycombeGroup.userData = {
    zone: 'familyRoom',
    zoneId: 'familyRoom',
    lodTier: 1,
  };
  wycombeGroup.position.set(-6.55, 0, -0.607);

  // Natural pale weathered/blonde oak finish across the entire table and chairs (media_1790538918078.jpg)
  const wycombeNaturalOakMat = new THREE.MeshStandardMaterial({
    color: 0xc2a682,
    roughness: 0.52,
    metalness: 0.02,
  });
  const wycombeOakSeamMat = new THREE.MeshStandardMaterial({
    color: 0x9a7d5a,
    roughness: 0.62,
    metalness: 0.02,
  });
  // Woven natural paper-cord / rush seat material + soft oatmeal linen table runner
  const wycombeWovenCordMat = new THREE.MeshStandardMaterial({
    color: 0xd4be96,
    roughness: 0.82,
    metalness: 0.01,
  });
  const wycombeCushionMat = new THREE.MeshStandardMaterial({
    color: 0xe6dfd1,
    roughness: 0.78,
  });

  const createRoundedTabletopGeometry = (halfW: number, minZ: number, maxZ: number): THREE.ExtrudeGeometry => {
    const cornerR = 0.045;
    const topThick = 0.032; // Y = 0.718m..0.750m (above 0.630m..0.718m apron)
    const topShape = new THREE.Shape();
    // Shape 2D (x, y) maps after rotateX(-Math.PI / 2) to (x, z = -y)
    const minY = -maxZ;
    const maxY = -minZ;
    topShape.moveTo(-halfW + cornerR, minY);
    topShape.lineTo(halfW - cornerR, minY);
    topShape.absarc(halfW - cornerR, minY + cornerR, cornerR, -Math.PI / 2, 0, false);
    topShape.lineTo(halfW, maxY - cornerR);
    topShape.absarc(halfW - cornerR, maxY - cornerR, cornerR, 0, Math.PI / 2, false);
    topShape.lineTo(-halfW + cornerR, maxY);
    topShape.absarc(-halfW + cornerR, maxY - cornerR, cornerR, Math.PI / 2, Math.PI, false);
    topShape.lineTo(-halfW, minY + cornerR);
    topShape.absarc(-halfW + cornerR, minY + cornerR, cornerR, Math.PI, Math.PI * 1.5, false);
    topShape.closePath();

    const geo = new THREE.ExtrudeGeometry(topShape, {
      depth: topThick,
      bevelEnabled: true,
      bevelThickness: 0.003,
      bevelSize: 0.003,
      bevelSegments: 2,
      curveSegments: 12,
    });
    geo.rotateX(-Math.PI / 2);
    return geo;
  };

  // 1A. Standard 6-person Tabletop: Length = 2.10m (Z = -1.05m..+1.05m), Width = 1.00m (X = -0.50m..+0.50m)
  const wycombeTopSlab = new THREE.Mesh(
    createRoundedTabletopGeometry(0.5, -1.05, 1.05),
    wycombeNaturalOakMat
  );
  wycombeTopSlab.name = 'familyRoom.neptuneWycombeDiningTable.tabletop';
  wycombeTopSlab.position.set(0, 0.718, 0);
  wycombeTopSlab.castShadow = true;
  wycombeTopSlab.receiveShadow = true;
  wycombeGroup.add(wycombeTopSlab);

  // 1B. Extended 10-person Tabletop: Length = 2.86m (Z = -1.05m..+1.81m, extending South into the open dining bay)
  const wycombeExtendedTopSlab = new THREE.Mesh(
    createRoundedTabletopGeometry(0.5, -1.05, 1.81),
    wycombeNaturalOakMat
  );
  wycombeExtendedTopSlab.name = 'familyRoom.neptuneWycombeDiningTable.extendedTabletop';
  wycombeExtendedTopSlab.position.set(0, 0.718, 0);
  wycombeExtendedTopSlab.castShadow = true;
  wycombeExtendedTopSlab.receiveShadow = true;
  wycombeExtendedTopSlab.visible = false;
  wycombeGroup.add(wycombeExtendedTopSlab);

  // 2 transverse extension leaf seam lines (Number Of Leaves: 2)
  const leafSeams: THREE.Mesh[] = [];
  for (const leafSeamZ of [-0.225, 0.225] as const) {
    const leafSeam = new THREE.Mesh(
      new THREE.BoxGeometry(0.992, 0.034, 0.003),
      wycombeOakSeamMat
    );
    if (!leafSeam.name) leafSeam.name = 'familyRoom.diningTable.leafSeam';
    leafSeam.position.set(0, 0.734, leafSeamZ);
    wycombeGroup.add(leafSeam);
    leafSeams.push(leafSeam);
  }

  // Subtle longitudinal wide-plank oak joint lines along the tabletop
  const plankSeams: THREE.Mesh[] = [];
  for (const plankSeamX of [-0.3, -0.1, 0.1, 0.3] as const) {
    const plankSeam = new THREE.Mesh(
      new THREE.BoxGeometry(0.002, 0.002, 2.08),
      wycombeOakSeamMat
    );
    if (!plankSeam.name) plankSeam.name = 'familyRoom.diningTable.plankSeam';
    plankSeam.position.set(plankSeamX, 0.7505, 0);
    wycombeGroup.add(plankSeam);
    plankSeams.push(plankSeam);
  }

  // 2. Undertable Apron Frame: Undertable Height = 63cm (0.630m clear legroom below apron -> Y = 0.630m..0.718m, height = 0.088m)
  const apronH = 0.088;
  const apronMidY = 0.63 + apronH / 2; // 0.674m (bottom at exact Y = 0.630m!)
  const wycombeApron = new THREE.Mesh(
    new THREE.BoxGeometry(0.84, apronH, 1.88),
    wycombeNaturalOakMat
  );
  wycombeApron.name = 'familyRoom.neptuneWycombeDiningTable.apron';
  wycombeApron.position.set(0, apronMidY, 0);
  wycombeApron.castShadow = true;
  wycombeApron.receiveShadow = true;
  wycombeGroup.add(wycombeApron);

  // 3. 4 Splayed, Smoothly Tapered Cylindrical Natural Oak Legs at the corners (matching media_1790538918078.jpg)
  const southLegs: THREE.Mesh[] = [];
  for (const [signX, signZ] of [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ] as const) {
    const topX = signX * 0.395;
    const topZ = signZ * 0.905;
    const botX = signX * 0.445; // Subtle ~4° outward splay in X & Z
    const botZ = signZ * 0.955;
    const topY = 0.712;
    const dx = botX - topX;
    const dz = botZ - topZ;
    const legLen = Math.hypot(dx, topY, dz);

    const legShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.019, legLen, 16),
      wycombeNaturalOakMat
    );
    legShaft.name = 'familyRoom.neptuneWycombeDiningTable.leg';
    legShaft.position.set((topX + botX) / 2, topY / 2, (topZ + botZ) / 2);
    legShaft.rotation.z = signX * 0.07;
    legShaft.rotation.x = -signZ * 0.07;
    legShaft.castShadow = true;
    legShaft.receiveShadow = true;
    wycombeGroup.add(legShaft);
    if (signZ === 1) {
      southLegs.push(legShaft);
    }
  }

  // Helper to build a Neptune Wycombe Natural Oak Spindle-Back Dining Chair with Woven Paper-Cord Seat
  const buildWycombeChair = (cIdx: number, cx: number, cz: number, rotY: number): THREE.Group => {
    const chair = new THREE.Group();
    chair.name = `familyRoom.neptuneWycombeDiningTable.chair.${cIdx}`;
    chair.position.set(cx, 0, cz);
    chair.rotation.y = rotY;

    // 4 Cylindrical Oak Seat Frame Rails surrounding the woven rush/paper-cord seat (Y = 0.448m)
    for (const sz of [-0.185, 0.185] as const) {
      const fbRail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.014, 0.42, 12),
        wycombeNaturalOakMat
      );
      if (!fbRail.name) fbRail.name = 'familyRoom.diningTable.fbRail';
      fbRail.rotation.z = Math.PI / 2;
      fbRail.position.set(0, 0.448, sz);
      fbRail.castShadow = true;
      chair.add(fbRail);
    }
    for (const sx of [-0.205, 0.205] as const) {
      const sideRail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.014, 0.38, 12),
        wycombeNaturalOakMat
      );
      if (!sideRail.name) sideRail.name = 'familyRoom.diningTable.sideRail';
      sideRail.rotation.x = Math.PI / 2;
      sideRail.position.set(sx, 0.448, 0);
      sideRail.castShadow = true;
      chair.add(sideRail);
    }

    // Woven natural paper-cord / rush seat pad with envelope-weave quadrants (Y = 0.445m..0.474m)
    const rushSeat = new THREE.Mesh(
      new THREE.BoxGeometry(0.405, 0.028, 0.375),
      wycombeWovenCordMat
    );
    rushSeat.name = `familyRoom.neptuneWycombeDiningTable.chair.${cIdx}.seat`;
    rushSeat.position.set(0, 0.458, 0);
    rushSeat.castShadow = true;
    rushSeat.receiveShadow = true;
    chair.add(rushSeat);

    // Subtle diagonal envelope-weave seam lines across the rush seat
    for (const diagAngle of [0.74, -0.74] as const) {
      const weaveSeam = new THREE.Mesh(
        new THREE.BoxGeometry(0.52, 0.003, 0.004),
        wycombeOakSeamMat
      );
      if (!weaveSeam.name) weaveSeam.name = 'familyRoom.diningTable.weaveSeam';
      weaveSeam.rotation.y = diagAngle;
      weaveSeam.position.set(0, 0.473, 0);
      chair.add(weaveSeam);
    }

    // Front tapered cylindrical oak legs (slightly splayed)
    for (const signX of [-1, 1] as const) {
      const fLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.011, 0.46, 12),
        wycombeNaturalOakMat
      );
      if (!fLeg.name) fLeg.name = 'familyRoom.diningTable.fLeg';
      fLeg.position.set(signX * 0.208, 0.228, 0.188);
      fLeg.rotation.z = signX * 0.035;
      fLeg.rotation.x = 0.03;
      fLeg.castShadow = true;
      chair.add(fLeg);

      // Rear lower leg segment (floor up to seat rail at Z = -0.185)
      const rLegLower = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.012, 0.46, 12),
        wycombeNaturalOakMat
      );
      if (!rLegLower.name) rLegLower.name = 'familyRoom.diningTable.rLegLower';
      rLegLower.position.set(signX * 0.202, 0.228, -0.192);
      rLegLower.rotation.z = signX * 0.025;
      rLegLower.rotation.x = -0.035;
      rLegLower.castShadow = true;
      chair.add(rLegLower);

      // Continuous raked rear back stile rising from seat rail (Y = 0.45m) to top crest rail (Y = 0.90m)
      const backStile = new THREE.Mesh(
        new THREE.CylinderGeometry(0.013, 0.016, 0.465, 12),
        wycombeNaturalOakMat
      );
      if (!backStile.name) backStile.name = 'familyRoom.diningTable.backStile';
      backStile.position.set(signX * 0.198, 0.675, -0.208);
      backStile.rotation.x = -0.1;
      backStile.castShadow = true;
      chair.add(backStile);

      // Side stretcher rail (Y = 0.165m)
      const sideStretcher = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0085, 0.0085, 0.375, 10),
        wycombeNaturalOakMat
      );
      if (!sideStretcher.name) sideStretcher.name = 'familyRoom.diningTable.sideStretcher';
      sideStretcher.rotation.x = Math.PI / 2;
      sideStretcher.position.set(signX * 0.205, 0.165, 0);
      chair.add(sideStretcher);
    }

    // Front, rear & central H-stretcher rails
    for (const [stY, stZ, stW] of [
      [0.195, 0.188, 0.41],
      [0.195, -0.192, 0.4],
      [0.165, -0.01, 0.41],
    ] as const) {
      const crossStretcher = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0085, 0.0085, stW, 10),
        wycombeNaturalOakMat
      );
      if (!crossStretcher.name) crossStretcher.name = 'familyRoom.diningTable.crossStretcher';
      crossStretcher.rotation.z = Math.PI / 2;
      crossStretcher.position.set(0, stY, stZ);
      chair.add(crossStretcher);
    }

    // Lower horizontal spindle-back rail above the seat (Y = 0.525m)
    const lowerBackRail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.39, 10),
      wycombeNaturalOakMat
    );
    if (!lowerBackRail.name) lowerBackRail.name = 'familyRoom.diningTable.lowerBackRail';
    lowerBackRail.rotation.z = Math.PI / 2;
    lowerBackRail.position.set(0, 0.525, -0.193);
    chair.add(lowerBackRail);

    // Gently curved steam-bent oak top crest rail (Y = 0.895m, matching media_1790538918078.jpg)
    const crestCurve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-0.205, 0.89, -0.222),
      new THREE.Vector3(0, 0.902, -0.242),
      new THREE.Vector3(0.205, 0.89, -0.222)
    );
    const crestRail = new THREE.Mesh(
      new THREE.TubeGeometry(crestCurve, 16, 0.018, 12, false),
      wycombeNaturalOakMat
    );
    if (!crestRail.name) crestRail.name = 'familyRoom.diningTable.crestRail';
    crestRail.scale.set(1, 1.35, 0.72);
    crestRail.position.set(0, -0.31, -0.06);
    crestRail.castShadow = true;
    chair.add(crestRail);

    // 6 slender turned vertical oak spindles spanning from lowerBackRail (Y = 0.525m) to crestRail (Y = 0.895m)
    for (const spx of [-0.145, -0.087, -0.029, 0.029, 0.087, 0.145] as const) {
      const zCurveOff = (1 - (spx / 0.195) * (spx / 0.195)) * 0.012;
      const spindle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0055, 0.0065, 0.375, 10),
        wycombeNaturalOakMat
      );
      if (!spindle.name) spindle.name = 'familyRoom.diningTable.spindle';
      spindle.position.set(spx, 0.708, -0.21 - zCurveOff);
      spindle.rotation.x = -0.1;
      spindle.castShadow = true;
      chair.add(spindle);
    }

    return chair;
  };

  // 4. 6 Primary Neptune Wycombe Dining Chairs (2 on West, 2 on East, 1 at North head, 1 at South foot)
  const chairLayout6: ReadonlyArray<readonly [number, number, number]> = [
    [-0.4, -0.52, Math.PI / 2],
    [-0.4, 0.52, Math.PI / 2],
    [0.4, -0.52, -Math.PI / 2],
    [0.4, 0.52, -Math.PI / 2],
    [0, -0.95, 0],
    [0, 0.95, Math.PI],
  ];
  const chairLayout10Primary: ReadonlyArray<readonly [number, number, number]> = [
    [-0.4, -0.67, Math.PI / 2],
    [-0.4, 0.03, Math.PI / 2],
    [0.4, -0.67, -Math.PI / 2],
    [0.4, 0.03, -Math.PI / 2],
    [0, -0.95, 0],
    [0, 1.71, Math.PI],
  ];
  const chairLayout10Extra: ReadonlyArray<readonly [number, number, number]> = [
    [-0.4, 0.73, Math.PI / 2],
    [-0.4, 1.43, Math.PI / 2],
    [0.4, 0.73, -Math.PI / 2],
    [0.4, 1.43, -Math.PI / 2],
  ];

  const primaryChairs: THREE.Group[] = [];
  for (let cIdx = 0; cIdx < chairLayout6.length; cIdx++) {
    const [cx, cz, rotY] = chairLayout6[cIdx]!;
    const chair = buildWycombeChair(cIdx + 1, cx, cz, rotY);
    wycombeGroup.add(chair);
    primaryChairs.push(chair);
  }

  // Linen runner, ceramic vase centerpiece, brass candlesticks & place settings
  const wycombeRunner = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.005, 1.48),
    wycombeCushionMat
  );
  wycombeRunner.name = 'familyRoom.neptuneWycombeDiningTable.runner';
  wycombeRunner.position.set(0, 0.753, 0);
  wycombeGroup.add(wycombeRunner);

  const wycombeVase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.075, 0.22, 16),
    ceramicWhiteMat
  );
  wycombeVase.name = 'familyRoom.neptuneWycombeDiningTable.centerpieceVase';
  wycombeVase.position.set(0, 0.865, 0);
  wycombeVase.castShadow = true;
  wycombeGroup.add(wycombeVase);

  const foliageSprayMat = new THREE.MeshStandardMaterial({
    color: 0x4b6344,
    roughness: 0.76,
    metalness: 0.02,
  });
  const foliageSprays: Array<{ readonly mesh: THREE.Mesh; readonly baseZ: number }> = [];
  for (const [fx, fy, fz, r] of [
    [-0.03, 0.99, -0.02, 0.055],
    [0.035, 1.01, 0.02, 0.05],
    [0, 1.03, -0.01, 0.048],
  ] as const) {
    const spray = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 10), foliageSprayMat);
    if (!spray.name) spray.name = 'familyRoom.diningTable.spray';
    spray.position.set(fx, fy, fz);
    wycombeGroup.add(spray);
    foliageSprays.push({ mesh: spray, baseZ: fz });
  }

  // Pair of brass candlesticks with ivory taper candles flanking the centerpiece vase
  const candlestickMeshes: Array<{ readonly mesh: THREE.Mesh; readonly baseZ: number }> = [];
  for (const csz of [-0.36, 0.36] as const) {
    const holderBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.042, 0.11, 14),
      brassMat
    );
    if (!holderBase.name) holderBase.name = 'familyRoom.diningTable.holderBase';
    holderBase.position.set(0, 0.808, csz);
    holderBase.castShadow = true;
    wycombeGroup.add(holderBase);
    candlestickMeshes.push({ mesh: holderBase, baseZ: csz });

    const taperCandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.011, 0.18, 10),
      ceramicWhiteMat
    );
    if (!taperCandle.name) taperCandle.name = 'familyRoom.diningTable.taperCandle';
    taperCandle.position.set(0, 0.95, csz);
    taperCandle.castShadow = true;
    wycombeGroup.add(taperCandle);
    candlestickMeshes.push({ mesh: taperCandle, baseZ: csz });
  }

  // Complete Table Place Settings (woven rattan charger mat, stoneware dinner & side plates, folded linen napkin, stainless cutlery & crystal wine/water glasses)
  const placematMat = new THREE.MeshStandardMaterial({
    color: 0x967853,
    roughness: 0.84,
    metalness: 0.02,
  });
  const stonewarePlateMat = new THREE.MeshStandardMaterial({
    color: 0xf4f1ea,
    roughness: 0.24,
    metalness: 0.04,
  });
  const stonewareRimMat = new THREE.MeshStandardMaterial({
    color: 0xd9d2c5,
    roughness: 0.34,
    metalness: 0.04,
  });
  const cutlerySilverMat = new THREE.MeshStandardMaterial({
    color: 0xd8dde2,
    roughness: 0.18,
    metalness: 0.88,
  });
  const crystalGlassMat = new THREE.MeshStandardMaterial({
    color: 0xeef6fa,
    roughness: 0.08,
    metalness: 0.12,
    transparent: true,
    opacity: 0.52,
  });
  const napkinLinenMat = new THREE.MeshStandardMaterial({
    color: 0xc8bfa8,
    roughness: 0.82,
    metalness: 0.01,
  });

  const buildPlaceSetting = (pIdx: number, px: number, pz: number, pRotY: number): THREE.Group => {
    const placeGrp = new THREE.Group();
    placeGrp.name = `familyRoom.neptuneWycombeDiningTable.placeSetting.${pIdx}`;
    placeGrp.position.set(px, 0.75, pz);
    placeGrp.rotation.y = pRotY;

    // Woven round seagrass/rattan placemat
    const matMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.165, 0.165, 0.005, 24),
      placematMat
    );
    if (!matMesh.name) matMesh.name = 'familyRoom.diningTable.mat';
    matMesh.position.set(0, 0.0025, 0);
    matMesh.receiveShadow = true;
    placeGrp.add(matMesh);

    // Dinner plate (27cm) + starter/salad plate (20cm)
    const dinnerPlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.135, 0.11, 0.014, 24),
      stonewarePlateMat
    );
    dinnerPlate.name = `familyRoom.neptuneWycombeDiningTable.plate.${pIdx}`;
    dinnerPlate.position.set(0, 0.012, 0);
    dinnerPlate.castShadow = true;
    dinnerPlate.receiveShadow = true;
    placeGrp.add(dinnerPlate);

    const saladPlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.098, 0.08, 0.012, 24),
      stonewareRimMat
    );
    if (!saladPlate.name) saladPlate.name = 'familyRoom.diningTable.saladPlate';
    saladPlate.position.set(0, 0.023, 0);
    saladPlate.castShadow = true;
    placeGrp.add(saladPlate);

    // Folded linen napkin with brass napkin ring resting on top of the starter plate
    const napkin = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.014, 0.14),
      napkinLinenMat
    );
    if (!napkin.name) napkin.name = 'familyRoom.diningTable.napkin';
    napkin.rotation.y = 0.18;
    napkin.position.set(0, 0.035, 0);
    napkin.castShadow = true;
    placeGrp.add(napkin);

    // Stainless steel fork (left, X = -0.175m) & dinner knife + spoon (right, X = +0.175m, +0.205m)
    const fork = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.004, 0.185),
      cutlerySilverMat
    );
    if (!fork.name) fork.name = 'familyRoom.diningTable.fork';
    fork.position.set(-0.175, 0.004, 0);
    placeGrp.add(fork);

    const knife = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.004, 0.205),
      cutlerySilverMat
    );
    if (!knife.name) knife.name = 'familyRoom.diningTable.knife';
    knife.position.set(0.175, 0.004, 0);
    placeGrp.add(knife);

    // Stemmed crystal wine glass & water tumbler at top-right of the plate
    const glassBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.004, 14),
      crystalGlassMat
    );
    if (!glassBase.name) glassBase.name = 'familyRoom.diningTable.glassBase';
    glassBase.position.set(0.14, 0.003, 0.13);
    placeGrp.add(glassBase);

    const glassStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.075, 8),
      crystalGlassMat
    );
    if (!glassStem.name) glassStem.name = 'familyRoom.diningTable.glassStem';
    glassStem.position.set(0.14, 0.042, 0.13);
    placeGrp.add(glassStem);

    const wineBowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.034, 0.018, 0.082, 16),
      crystalGlassMat
    );
    wineBowl.name = `familyRoom.neptuneWycombeDiningTable.wineGlass.${pIdx}`;
    wineBowl.position.set(0.14, 0.115, 0.13);
    wineBowl.castShadow = true;
    placeGrp.add(wineBowl);

    const waterTumbler = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.026, 0.095, 16),
      crystalGlassMat
    );
    if (!waterTumbler.name) waterTumbler.name = 'familyRoom.diningTable.waterTumbler';
    waterTumbler.position.set(0.075, 0.048, 0.155);
    waterTumbler.castShadow = true;
    placeGrp.add(waterTumbler);

    return placeGrp;
  };

  const placeSettingCoords6: ReadonlyArray<readonly [number, number, number]> = [
    [-0.31, -0.52, Math.PI / 2],  // West North
    [-0.31, 0.52, Math.PI / 2],   // West South
    [0.31, -0.52, -Math.PI / 2],  // East North
    [0.31, 0.52, -Math.PI / 2],   // East South
    [0, -0.84, 0],                // North Head
    [0, 0.84, Math.PI],           // South Foot
  ];
  const placeSettingCoords10Primary: ReadonlyArray<readonly [number, number, number]> = [
    [-0.31, -0.67, Math.PI / 2],
    [-0.31, 0.03, Math.PI / 2],
    [0.31, -0.67, -Math.PI / 2],
    [0.31, 0.03, -Math.PI / 2],
    [0, -0.84, 0],
    [0, 1.6, Math.PI],
  ];
  const placeSettingCoords10Extra: ReadonlyArray<readonly [number, number, number]> = [
    [-0.31, 0.73, Math.PI / 2],
    [-0.31, 1.43, Math.PI / 2],
    [0.31, 0.73, -Math.PI / 2],
    [0.31, 1.43, -Math.PI / 2],
  ];

  const primaryPlaceSettings: THREE.Group[] = [];
  for (let pIdx = 0; pIdx < placeSettingCoords6.length; pIdx++) {
    const [px, pz, pRotY] = placeSettingCoords6[pIdx]!;
    const placeGrp = buildPlaceSetting(pIdx + 1, px, pz, pRotY);
    wycombeGroup.add(placeGrp);
    primaryPlaceSettings.push(placeGrp);
  }

  // Extra 4 chairs (chair.7..10) and 4 place settings (placeSetting.7..10) for 10-person extended mode
  const extendedSeatsGroup = new THREE.Group();
  extendedSeatsGroup.name = 'familyRoom.neptuneWycombeDiningTable.extendedSeats';
  extendedSeatsGroup.visible = false;
  for (let i = 0; i < chairLayout10Extra.length; i++) {
    const [cx, cz, rotY] = chairLayout10Extra[i]!;
    extendedSeatsGroup.add(buildWycombeChair(7 + i, cx, cz, rotY));
  }
  for (let i = 0; i < placeSettingCoords10Extra.length; i++) {
    const [px, pz, pRotY] = placeSettingCoords10Extra[i]!;
    extendedSeatsGroup.add(buildPlaceSetting(7 + i, px, pz, pRotY));
  }
  wycombeGroup.add(extendedSeatsGroup);

  // Interactive click toggle between 6-person standard mode (2.10m) and 10-person extended mode (2.86m)
  let isDiningTableExtended = false;
  interactions.registerToggleCallback(
    wycombeGroup,
    () => {
      isDiningTableExtended = !isDiningTableExtended;
      const extCenterZ = isDiningTableExtended ? 0.38 : 0;

      wycombeTopSlab.visible = !isDiningTableExtended;
      wycombeExtendedTopSlab.visible = isDiningTableExtended;
      extendedSeatsGroup.visible = isDiningTableExtended;

      wycombeApron.scale.z = isDiningTableExtended ? 2.64 / 1.88 : 1;
      wycombeApron.position.z = extCenterZ;

      wycombeRunner.scale.z = isDiningTableExtended ? 2.24 / 1.48 : 1;
      wycombeRunner.position.z = extCenterZ;

      wycombeVase.position.z = extCenterZ;
      for (const sp of foliageSprays) {
        sp.mesh.position.z = sp.baseZ + extCenterZ;
      }
      for (const cs of candlestickMeshes) {
        cs.mesh.position.z = cs.baseZ + extCenterZ;
      }

      leafSeams[0]!.position.z = isDiningTableExtended ? -0.15 : -0.225;
      leafSeams[1]!.position.z = isDiningTableExtended ? 0.91 : 0.225;
      for (const ps of plankSeams) {
        ps.scale.z = isDiningTableExtended ? 2.84 / 2.08 : 1;
        ps.position.z = extCenterZ;
      }

      const southLegZ = (0.905 + 0.955) / 2 + (isDiningTableExtended ? 0.76 : 0);
      for (const sLeg of southLegs) {
        sLeg.position.z = southLegZ;
      }

      const targetChairCoords = isDiningTableExtended ? chairLayout10Primary : chairLayout6;
      for (let i = 0; i < primaryChairs.length; i++) {
        const [cx, cz, rotY] = targetChairCoords[i]!;
        primaryChairs[i]!.position.set(cx, 0, cz);
        primaryChairs[i]!.rotation.y = rotY;
      }

      const targetPlaceCoords = isDiningTableExtended ? placeSettingCoords10Primary : placeSettingCoords6;
      for (let i = 0; i < primaryPlaceSettings.length; i++) {
        const [px, pz, pRotY] = targetPlaceCoords[i]!;
        primaryPlaceSettings[i]!.position.set(px, 0.75, pz);
        primaryPlaceSettings[i]!.rotation.y = pRotY;
      }

      wycombeGroup.updateMatrixWorld(true);
    },
    [wycombeGroup]
  );

  scene.add(wycombeGroup);

}
