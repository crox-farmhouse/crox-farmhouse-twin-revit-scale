import * as THREE from 'three';
import {
  buildBarnMezzanineRetroLounge,
  buildStableBalconyOutdoorFurniture,
  buildStableUpperEnsuite,
} from '../barn-mezzanine-retro-lounge.ts';
import {
  OUTBUILDING_ORIGIN_X,
  OUTBUILDING_ORIGIN_Z,
  type OutbuildingShellContext,
} from './outbuilding-coords-and-materials.ts';

export function buildMezzanineAndStableUpperShell(shellCtx: OutbuildingShellContext): void {
  const {
    ctx,
    exteriorBrickMat,
    stoneSillMat,
    castIronMat,
    windowFrameMat,
    windowGlassMat,
    applyWorldSpaceBrickUVs,
    groundGroup,
    firstFloorGroup,
    roofGroup,
    stableUpperCarpetMat,
    lightJoineryOakMat,
    lightJoineryOakPostMat,
    mezzaninePlankFloorMat,
    settingPlasterMat,
    cromartyWallMat,
    woodFibreCoreMat,
    spotlightBrassTrimMat,
    applyOutbuildingFloorUVs,
    wallT,
    partT,
    addOutbuildingBrickWall,
    addOutbuildingBrickWallWithWindows,
    addOutbuildingExteriorUpDownWallLight,
    createExtrudedVYPolygon,
    addVaultedRoomEaveFriezeStrips,
    uStoreStart,
    uBarnStart,
    uMezzanineFront,
    uBarnEnd,
    uStableStart,
    uStableEnd,
    uStableExtEnd,
    vEastRangeNorth,
    vEastRangeSouth,
    eastRangeInternalV,
    stableRidgeH,
    stableDatumY,
    eastRangeGroundTopY,
    barnUpperTopY,
    barnCeilEaveY,
    barnCeilRidgeY,
    mezzanineFloorY,
    barnWestFloorY,
    stableGroundFloorY,
    stableGroundTopY,
    stableUpperFloorY,
    stableUpperTopY,
    stableCeilEaveY,
    stableCeilRidgeY,
    barnCarpetTopY,
    vInnerNorth,
    vInnerSouth,
    vMidCenter,
    createContinuousMezzaninePolygon,
  } = shellCtx;

  // =========================================================================
  // 3. OUTBUILDING FIRST FLOOR OVER BARN MEZZANINE (`1.54m`) & 2-STOREY STABLE (`2.08m` — Issue #11!)
  //    Continuous Mezzanine Floor Slab (`outbuildings.firstFloor.westRoomSlab`) seamlessly integrating
  //    the Haldane UK Spiral Staircase Top Landing (`u = 21.14..22.04m, v = 3.56..4.94m`) — Issue #1!
  // =========================================================================
  const westUpperSlabGeo = new THREE.ExtrudeGeometry(
    createContinuousMezzaninePolygon(18.684),
    { depth: 0.11, bevelEnabled: false }
  );
  westUpperSlabGeo.rotateX(-Math.PI / 2);
  applyOutbuildingFloorUVs(westUpperSlabGeo, 0, mezzanineFloorY - 0.11, 0, 0.5);
  westUpperSlabGeo.computeBoundingSphere();
  const westUpperRoomSlab = new THREE.Mesh(
    westUpperSlabGeo,
    mezzaninePlankFloorMat
  );
  westUpperRoomSlab.name = 'outbuildings.firstFloor.westRoomSlab';
  westUpperRoomSlab.position.set(0, mezzanineFloorY - 0.11, 0);
  westUpperRoomSlab.receiveShadow = true;
  firstFloorGroup.add(westUpperRoomSlab);

  // Solid light-oak stairwell edge fascia trim boards (`0.022m` thick x `0.145m` high, `y = 1.395..1.54m`) along the open stairwell cutout edges
  const stairwellWestFasciaGeo = new THREE.BoxGeometry(0.022, 0.145, 5.426 - 4.85);
  applyOutbuildingFloorUVs(stairwellWestFasciaGeo, 21.14, 1.4675, (4.85 + 5.426) * 0.5, 0.5);
  const stairwellWestFascia = new THREE.Mesh(
    stairwellWestFasciaGeo,
    lightJoineryOakMat
  );
  stairwellWestFascia.name = 'outbuildings.firstFloor.stairwellFascia.west';
  stairwellWestFascia.position.set(21.14, 1.4675, (4.85 + 5.426) * 0.5);
  stairwellWestFascia.castShadow = true;
  firstFloorGroup.add(stairwellWestFascia);

  const stairwellEastLandingFasciaGeo = new THREE.BoxGeometry(0.022, 0.145, 4.44 - 3.56);
  applyOutbuildingFloorUVs(stairwellEastLandingFasciaGeo, 22.04, 1.4675, (3.56 + 4.44) * 0.5, 0.5);
  const stairwellEastLandingFascia = new THREE.Mesh(
    stairwellEastLandingFasciaGeo,
    lightJoineryOakMat
  );
  stairwellEastLandingFascia.name = 'outbuildings.firstFloor.stairwellFascia.eastLanding';
  stairwellEastLandingFascia.position.set(22.04, 1.4675, (3.56 + 4.44) * 0.5);
  stairwellEastLandingFascia.castShadow = true;
  firstFloorGroup.add(stairwellEastLandingFascia);

  const stairwellNorthFasciaGeo = new THREE.BoxGeometry(23.016 - 22.04, 0.145, 0.022);
  applyOutbuildingFloorUVs(stairwellNorthFasciaGeo, (22.04 + 23.016) * 0.5, 1.4675, 3.56, 0.5);
  const stairwellNorthFascia = new THREE.Mesh(
    stairwellNorthFasciaGeo,
    lightJoineryOakMat
  );
  stairwellNorthFascia.name = 'outbuildings.firstFloor.stairwellFascia.north';
  stairwellNorthFascia.position.set((22.04 + 23.016) * 0.5, 1.4675, 3.56);
  stairwellNorthFascia.castShadow = true;
  firstFloorGroup.add(stairwellNorthFascia);

  // Solid light-oak front fascia trim strip along the Barn Mezzanine leading edge between the pilasters (`u = uMezzanineFront - 0.005`)
  const mezzanineFrontFasciaGeo = new THREE.BoxGeometry(0.018, 0.11, eastRangeInternalV - 0.328);
  applyOutbuildingFloorUVs(mezzanineFrontFasciaGeo, uMezzanineFront - 0.005, mezzanineFloorY - 0.055, vMidCenter(), 0.5);
  const mezzanineFrontFascia = new THREE.Mesh(
    mezzanineFrontFasciaGeo,
    lightJoineryOakMat
  );
  mezzanineFrontFascia.name = 'outbuildings.firstFloor.mezzanineFrontFascia';
  mezzanineFrontFascia.position.set(
    uMezzanineFront - 0.005,
    mezzanineFloorY - 0.055,
    vMidCenter()
  );
  mezzanineFrontFascia.castShadow = true;
  firstFloorGroup.add(mezzanineFrontFascia);

  // Issue #2 ("This should match the bannisters too soft. tounded top" at `[-3.441, 2.492, 18.633]`, `outbuildings.firstFloor.mezzanineHandrail`) &
  // Issue #3 ("So should this" at `[-0.924, 2.462, 17.676]`, `outbuildings.barn.mezzanineStairwellGuardrail`):
  // Unified both the Front Mezzanine Balustrade (`u = 18.76m, v = 0.36..5.35m`) and the Stairwell Guardrails
  // (`v = 3.54m, u = 21.12..22.24m` and `u = 21.12m, v = 4.85..5.37m`) to match `outbuildings.firstFloor.stableUpStairs`
  // and `outbuildings.barn.spiralStaircase`:
  // - Rounded cylindrical solid-oak top handrails (`CylinderGeometry(0.026, 0.026, len, 20)`) at `y = mezzanineFloorY + 0.92m`
  // - Turned cylindrical solid-oak newel posts (`CylinderGeometry(0.034, 0.038, 0.92, 20)`) with spherical finial caps (`SphereGeometry(0.042, 16, 12)`)
  // - Toughened glass banister panels with brushed stainless-steel cylindrical stand-off clamps (`CylinderGeometry(0.016, 0.016, 0.036, 14)`)
  //   and rounded-top solid-oak bottom shoe rails!
  const balustradeClampMat = new THREE.MeshStandardMaterial({
    color: 0xd8dde4,
    roughness: 0.2,
    metalness: 0.9,
  });

  const handrailLenV = 5.35 - 0.36; // 4.99m between outer turned newel posts
  const handrailCenterV = vMidCenter(); // 2.855m
  const mezzanineTopRail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, handrailLenV, 20),
    lightJoineryOakMat
  );
  mezzanineTopRail.name = 'outbuildings.firstFloor.mezzanineHandrail';
  mezzanineTopRail.rotation.x = Math.PI / 2;
  mezzanineTopRail.position.set(uMezzanineFront + 0.08, mezzanineFloorY + 0.92, handrailCenterV);
  mezzanineTopRail.castShadow = true;
  firstFloorGroup.add(mezzanineTopRail);

  const mezzanineBottomRail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, handrailLenV, 18),
    lightJoineryOakMat
  );
  mezzanineBottomRail.name = 'outbuildings.firstFloor.mezzanineBottomRail';
  mezzanineBottomRail.rotation.x = Math.PI / 2;
  mezzanineBottomRail.position.set(uMezzanineFront + 0.08, mezzanineFloorY + 0.07, handrailCenterV);
  firstFloorGroup.add(mezzanineBottomRail);

  for (const [pIdx, pv] of [
    [1, 0.36],
    [2, 2.855],
    [3, 5.35],
  ] as const) {
    const newelPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.034, 0.038, 0.98, 20),
      lightJoineryOakPostMat
    );
    newelPost.name = `outbuildings.firstFloor.mezzaninePost.${pIdx}`;
    newelPost.position.set(uMezzanineFront + 0.08, mezzanineFloorY + 0.49, pv);
    newelPost.castShadow = true;
    firstFloorGroup.add(newelPost);

    const newelCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.042, 16, 12),
      lightJoineryOakMat
    );
    newelCap.name = `outbuildings.firstFloor.mezzaninePost.${pIdx}`;
    newelCap.position.set(uMezzanineFront + 0.08, mezzanineFloorY + 0.994, pv);
    firstFloorGroup.add(newelCap);
  }

  for (const [gIdx, gv] of [
    [1, 1.6075],
    [2, 4.1025],
  ] as const) {
    const glassPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.78, 2.38),
      windowGlassMat
    );
    glassPanel.name = `outbuildings.firstFloor.mezzanineGlassPanel.${gIdx}`;
    glassPanel.position.set(uMezzanineFront + 0.08, mezzanineFloorY + 0.495, gv);
    firstFloorGroup.add(glassPanel);

    for (const cvOff of [-0.92, 0.92] as const) {
      for (const cyOff of [0.12, 0.8] as const) {
        const clamp = new THREE.Mesh(
          new THREE.CylinderGeometry(0.016, 0.016, 0.036, 14),
          balustradeClampMat
        );
        clamp.name = `outbuildings.firstFloor.mezzanineGlassPanel.${gIdx}.clamp.${cvOff < 0 ? "north" : "south"}.${cyOff < 0.5 ? "bottom" : "top"}`;
        clamp.userData.lodTier = 'high';
        clamp.rotation.z = Math.PI / 2;
        clamp.position.set(uMezzanineFront + 0.08, mezzanineFloorY + cyOff, gv + cvOff);
        firstFloorGroup.add(clamp);
      }
    }
  }

  // Issue #1 ("Isn't this in the wrong place?" at `[-0.75, 2.126, 17.694]` -> `u = 21.495m, v = 3.547m`) &
  // Issue #2 ("Should it not be across here?" at `[-0.192, 1.545, 18.252]` -> `u = 22.003m, v = 4.151m` on `spiralStaircase.topLanding`):
  // Removed the guardrail across `v = 3.54m, u = 21.12..22.02m` (where `topLanding` and `westRoomSlab.eastNorth` are both at `y = 1.54m`)
  // and placed the guardrail along the actual East drop-off edge of `spiralStaircase.topLanding` (`u = 22.02m, v = 3.54..4.44m`,
  // tying into the Spiral Staircase Central Column at `u = 22.08m, v = 4.50m`) with a short `22cm` return (`u = 22.02..22.24m, v = 3.54m`)
  // into the bottom South newel post of `stableUpStairs` (`u = 22.24m, v = 3.54m`)!
  const stairwellGuardrailGroup = new THREE.Group();
  stairwellGuardrailGroup.name = 'outbuildings.barn.mezzanineStairwellGuardrail';
  firstFloorGroup.add(stairwellGuardrailGroup);

  // 1. East Landing Guardrail running North-South along the East edge of `topLanding` (`u = 22.02m, v = 3.54..4.44m`)
  const swEastU = 22.02;
  const swEastLenV = 4.44 - 3.54; // 0.90m (from v = 3.54m corner newel post to v = 4.44m spiral central column!)
  const swEastMidV = (3.54 + 4.44) * 0.5; // 3.99m
  const swEastTopRail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, swEastLenV, 20),
    lightJoineryOakMat
  );
  swEastTopRail.name = 'outbuildings.barn.mezzanineStairwellGuardrail';
  swEastTopRail.rotation.x = Math.PI / 2;
  swEastTopRail.position.set(swEastU, mezzanineFloorY + 0.92, swEastMidV);
  swEastTopRail.castShadow = true;
  stairwellGuardrailGroup.add(swEastTopRail);

  const swEastBotRail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, swEastLenV, 18),
    lightJoineryOakMat
  );
  swEastBotRail.name = "outbuildings.barn.mezzanineStairwellGuardrail.eastBottomRail";
  swEastBotRail.rotation.x = Math.PI / 2;
  swEastBotRail.position.set(swEastU, mezzanineFloorY + 0.07, swEastMidV);
  stairwellGuardrailGroup.add(swEastBotRail);

  const swEastGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.72, swEastLenV - 0.08),
    windowGlassMat
  );
  swEastGlass.name = 'outbuildings.barn.mezzanineStairwellGuardrail';
  swEastGlass.position.set(swEastU, mezzanineFloorY + 0.495, swEastMidV);
  stairwellGuardrailGroup.add(swEastGlass);

  for (const cvOff of [-0.28, 0.28] as const) {
    for (const cyOff of [0.12, 0.8] as const) {
      const clamp = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.036, 14),
        balustradeClampMat
      );
      clamp.name = `outbuildings.barn.mezzanineStairwellGuardrail.eastClamp.${cvOff < 0 ? "north" : "south"}.${cyOff < 0.5 ? "bottom" : "top"}`;
      clamp.userData.lodTier = 'high';
      clamp.rotation.z = Math.PI / 2;
      clamp.position.set(swEastU, mezzanineFloorY + cyOff, swEastMidV + cvOff);
      stairwellGuardrailGroup.add(clamp);
    }
  }

  // 2. Short `22cm` North Return (`u = 22.02..22.24m, v = 3.54m`) connecting `(22.02, 3.54)` to `stableUpStairs` bottom newel `(22.24, 3.54)`
  const swReturnLenU = 22.24 - swEastU; // 0.22m
  const swReturnMidU = (swEastU + 22.24) * 0.5; // 22.13m
  const swReturnTopRail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, swReturnLenU, 18),
    lightJoineryOakMat
  );
  swReturnTopRail.name = 'outbuildings.barn.mezzanineStairwellGuardrail';
  swReturnTopRail.rotation.z = Math.PI / 2;
  swReturnTopRail.position.set(swReturnMidU, mezzanineFloorY + 0.92, 3.54);
  swReturnTopRail.castShadow = true;
  stairwellGuardrailGroup.add(swReturnTopRail);

  const swReturnBotRail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, swReturnLenU, 16),
    lightJoineryOakMat
  );
  swReturnBotRail.name = "outbuildings.barn.mezzanineStairwellGuardrail.returnBottomRail";
  swReturnBotRail.rotation.z = Math.PI / 2;
  swReturnBotRail.position.set(swReturnMidU, mezzanineFloorY + 0.07, 3.54);
  stairwellGuardrailGroup.add(swReturnBotRail);

  const swReturnGlass = new THREE.Mesh(
    new THREE.BoxGeometry(swReturnLenU - 0.06, 0.72, 0.014),
    windowGlassMat
  );
  swReturnGlass.name = "outbuildings.barn.mezzanineStairwellGuardrail.returnGlassPanel";
  swReturnGlass.position.set(swReturnMidU, mezzanineFloorY + 0.495, 3.54);
  stairwellGuardrailGroup.add(swReturnGlass);

  // 3. South segment of West stairwell edge (`u = 21.12m, v = 4.85..5.37m`, meeting the shared spiral-staircase top newel post at `v = 4.85m`!)
  const swWestLenV = 5.37 - 4.85; // 0.52m
  const swWestMidV = (4.85 + 5.37) * 0.5; // 5.11m
  const swWestTopRail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, swWestLenV, 20),
    lightJoineryOakMat
  );
  swWestTopRail.name = 'outbuildings.barn.mezzanineStairwellGuardrail';
  swWestTopRail.rotation.x = Math.PI / 2;
  swWestTopRail.position.set(21.12, mezzanineFloorY + 0.92, swWestMidV);
  swWestTopRail.castShadow = true;
  stairwellGuardrailGroup.add(swWestTopRail);

  const swWestBotRail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, swWestLenV, 18),
    lightJoineryOakMat
  );
  swWestBotRail.name = "outbuildings.barn.mezzanineStairwellGuardrail.westBottomRail";
  swWestBotRail.rotation.x = Math.PI / 2;
  swWestBotRail.position.set(21.12, mezzanineFloorY + 0.07, swWestMidV);
  stairwellGuardrailGroup.add(swWestBotRail);

  const swWestGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.72, swWestLenV - 0.08),
    windowGlassMat
  );
  swWestGlass.name = "outbuildings.barn.mezzanineStairwellGuardrail.westGlassPanel";
  swWestGlass.position.set(21.12, mezzanineFloorY + 0.495, swWestMidV);
  stairwellGuardrailGroup.add(swWestGlass);

  for (const cvOff of [-0.14, 0.14] as const) {
    for (const cyOff of [0.12, 0.8] as const) {
      const clamp = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.036, 14),
        balustradeClampMat
      );
      clamp.name = `outbuildings.barn.mezzanineStairwellGuardrail.westClamp.${cvOff < 0 ? "north" : "south"}.${cyOff < 0.5 ? "bottom" : "top"}`;
      clamp.userData.lodTier = 'high';
      clamp.rotation.z = Math.PI / 2;
      clamp.position.set(21.12, mezzanineFloorY + cyOff, swWestMidV + cvOff);
      stairwellGuardrailGroup.add(clamp);
    }
  }

  for (const [pu, pv] of [
    [swEastU, 3.54],
    [21.12, 5.37],
  ] as const) {
    const swPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.034, 0.038, 0.98, 20),
      lightJoineryOakPostMat
    );
    swPost.name = `outbuildings.barn.mezzanineStairwellGuardrail.newelPost.${pu > 21.5 ? "east" : "west"}`;
    swPost.position.set(pu, mezzanineFloorY + 0.49, pv);
    swPost.castShadow = true;
    stairwellGuardrailGroup.add(swPost);

    const swPostCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.042, 16, 12),
      lightJoineryOakMat
    );
    swPostCap.name = `outbuildings.barn.mezzanineStairwellGuardrail.newelCap.${pu > 21.5 ? "east" : "west"}`;
    swPostCap.userData.lodTier = 'high';
    swPostCap.position.set(pu, mezzanineFloorY + 0.994, pv);
    stairwellGuardrailGroup.add(swPostCap);
  }

  // 1990s Retro Gaming & Lounge Zone on top of the Barn Mezzanine (`outbuildings.mezzanine.retroLounge`)
  buildBarnMezzanineRetroLounge(firstFloorGroup, mezzanineFloorY);

  // Issue #4 ("Carpet in here like the upstairs bedrooms, fix the scale" at `[5.5, 2.08, 15.313]`):
  // East First-Floor Room Woven Wool Carpet Slab (`5.55m x 5.15m`, u = 23.22m..28.77m, `stableUpperFloorY = 2.08m`)
  // with `upstairsWovenWoolCarpet` material and world-space `uvScale = 0.5` matching the upstairs bedrooms!
  const stableSlabSpanU = uStableEnd - wallT - uStableStart; // 6.55m (extended by +1.00m per Issue #4!)
  const stableSlabCenterU = uStableStart + stableSlabSpanU * 0.5;
  const stableSlabCenterY = stableUpperFloorY - 0.055;
  const stableSlabCenterV = vEastRangeNorth + wallT + eastRangeInternalV * 0.5;
  const eastUpperRoomSlabGeo = new THREE.BoxGeometry(stableSlabSpanU, 0.11, eastRangeInternalV);
  applyOutbuildingFloorUVs(eastUpperRoomSlabGeo, stableSlabCenterU, stableSlabCenterY, stableSlabCenterV, 0.5);
  const eastUpperRoomSlab = new THREE.Mesh(
    eastUpperRoomSlabGeo,
    stableUpperCarpetMat
  );
  eastUpperRoomSlab.name = 'outbuildings.firstFloor.stableRoomSlab';
  eastUpperRoomSlab.position.set(
    stableSlabCenterU,
    stableSlabCenterY,
    stableSlabCenterV
  );
  eastUpperRoomSlab.receiveShadow = true;
  firstFloorGroup.add(eastUpperRoomSlab);

  // Issue #8 ("Put a small ensuite in this corner with shower, toilet, sink" at `[2.44, 2.08, 18.808]`):
  buildStableUpperEnsuite(
    firstFloorGroup,
    stableUpperFloorY,
    stableUpperTopY,
    lightJoineryOakMat,
    cromartyWallMat,
    windowGlassMat,
    roofGroup,
    ctx
  );

  // STEP #1 Upper Exterior Brick Walls of Level 2 (`Barn Mezzanine`: u = 18.68m..23.02m, y = 1.54m..2.92m)
  // Note: Single-storey Store & West Barn (`u = 12.07..18.68m`) rise directly to `barnUpperTopY = 2.92m` on `groundGroup`
  // so the full double-height wall (including above the Barn Courtyard Door) is visible in ground cutaway mode (Issue #6)!
  addOutbuildingBrickWallWithWindows(
    firstFloorGroup,
    uMezzanineFront,
    uBarnEnd - partT,
    mezzanineFloorY,
    barnUpperTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z'],
    [{ uCenter: 19.85, yCenter: eastRangeGroundTopY + 0.44, width: 0.78, height: 0.72 }],
    settingPlasterMat
  );
  // South Upper Wall of Barn Mezzanine (`u = 18.68..23.02m`, solid brick, 0 windows per Floorplan)
  addOutbuildingBrickWall(
    firstFloorGroup,
    uMezzanineFront,
    uBarnEnd - partT,
    mezzanineFloorY,
    barnUpperTopY,
    vEastRangeSouth - wallT,
    vEastRangeSouth,
    ['-z'],
    exteriorBrickMat,
    settingPlasterMat
  );

  // Vaulted eave frieze strips inside Store (`u = 12.31..14.96m`) and Barn (`u = 15.20..23.02m`)
  addVaultedRoomEaveFriezeStrips(
    roofGroup,
    uStoreStart + 0.24,
    uBarnStart,
    vInnerNorth,
    vInnerSouth,
    barnUpperTopY,
    barnCeilEaveY
  );
  addVaultedRoomEaveFriezeStrips(
    roofGroup,
    uBarnStart + 0.24,
    uBarnEnd - partT,
    vInnerNorth,
    vInnerSouth,
    barnUpperTopY,
    barnCeilEaveY
  );

  // STEP #2 Upper Exterior Brick Walls of Level 3 (`2-Storey Stable`: u = 23.02m..29.05m, y = stableGroundTopY..stableUpperTopY = 1.96m..3.32m)
  // Issue #6 ("Paint this room more of a cromarty color" at `[2.844, 2.678, 14.106]`):
  // Uses Farrow & Ball "Cromarty" (`cromartyWallMat`) across the 1st-floor Stable room!
  addOutbuildingBrickWallWithWindows(
    firstFloorGroup,
    uBarnEnd - partT,
    uStableEnd,
    stableGroundTopY,
    stableUpperTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z'],
    [{ uCenter: 26.35, yCenter: stableUpperFloorY + 0.66, width: 0.88, height: 0.82 }],
    cromartyWallMat
  );
  // Issue #11 ("This window needs to be frosted" at `[4.304, 2.734, 19.324]`) +
  // Issue #2 ("move the window if you have to"):
  // Positioned the frosted South bathroom window at `uCenter = 24.92m` (`u = 24.48..25.36m`) so it sits
  // squarely inside the rearranged full-size Stable 1st-floor Ensuite (`u = 23.22..25.84m`)!
  addOutbuildingBrickWallWithWindows(
    firstFloorGroup,
    uBarnEnd - partT,
    uStableEnd,
    stableGroundTopY,
    stableUpperTopY,
    vEastRangeSouth - wallT,
    vEastRangeSouth,
    ['-z'],
    [{ uCenter: 24.92, yCenter: stableUpperFloorY + 0.66, width: 0.88, height: 0.82, isFrosted: true }],
    cromartyWallMat
  );

  // Vaulted eave frieze strips inside the 2-Storey Stable Upper Room (`u = 23.22..28.77m`)
  addVaultedRoomEaveFriezeStrips(
    roofGroup,
    uStableStart,
    uStableEnd - wallT,
    vInnerNorth,
    vInnerSouth,
    stableUpperTopY,
    stableCeilEaveY
  );

  // Issue #4 ("This door looks weird proportionally, does it make sense? Will it pass building regs, maybe a smaller door and 2 windows?"
  // at `[6.57, 3.143, 16.351]`, `outbuildings.firstFloor.stableBalconySlidingDoor.slidingNorth.stile.south`) &
  // Issue #9 ("add some up / down lights iether side here" at `[6.511, 2.983, 13.951]`, `outbuildings.firstFloor.brickWall.99`):
  // - Why the previous 4.35m-wide 4-panel sliding door failed Building Regs & looked squat:
  //   Because the side eaves of the 2-Storey Stable are at `stableUpperTopY = 3.32m` while the 1st-floor level is `stableUpperFloorY = 2.08m`,
  //   stretching a flat door lintel across `v = 0.68..5.03m` limited the door leaf height to just `1.24m` (`1.166m` clear walkthrough height),
  //   which violates UK Building Regulations Approved Document K (Section 2, minimum `2.00m` headroom on access routes/doorways) and Part M.
  // - Architectural & Building-Regs-Compliant Solution:
  //   1. Central Full-Height Double French Glazed Balcony Door (`v = 2.215m..3.495m`, `1.28m W × 2.04m H`, `y = 2.08m..4.12m`)
  //      centered under the high vaulted gable ridge (`4.669m` apex), rising above the side eaves into the central gable so it achieves
  //      a full `2.00m` clear walkthrough height (Part K compliant!).
  //   2. Two Symmetrical Flanking 4-Pane Cottage Casement Windows (`0.84m W × 0.86m H`, `y = 2.34m..3.20m`, centered at `y = 2.77m`)
  //      on the North bay (`v = 0.86m..1.70m`, `vCenter = 1.28m`) and South bay (`v = 4.01m..4.85m`, `vCenter = 4.43m`), tucked neatly
  //      below the `3.32m` side eaves.
  //   3. Architectural Up/Down Exterior Wall Sconce Lights mounted symmetrically on the brick piers on either side (`u = 29.05m`).
  const balDoorV0 = 2.215;
  const balDoorV1 = 3.495; // 1.28m wide central French double door opening centered at v = 2.855m
  const balDoorBotY = stableUpperFloorY; // 2.08m
  const balDoorTopY = 4.12; // 2.04m total frame height (2.00m clear walkthrough headroom — Part K compliant!)

  const winNorthV0 = 0.86;
  const winNorthV1 = 1.70; // 0.84m wide North casement window centered at v = 1.28m
  const winSouthV0 = 4.01;
  const winSouthV1 = 4.85; // 0.84m wide South casement window centered at v = 4.43m
  const winBotY = 2.34;
  const winTopY = 3.20; // 0.86m high casement windows centered at y = 2.77m

  // 1A. Floor-zone sill strip under the central French doorway (`y = 1.96m..2.08m, v = 2.215m..3.495m`)
  addOutbuildingBrickWall(
    firstFloorGroup,
    uStableEnd - wallT,
    uStableEnd,
    stableGroundTopY,
    balDoorBotY,
    balDoorV0,
    balDoorV1,
    ['-x'],
    exteriorBrickMat,
    cromartyWallMat
  );

  void winNorthV0;
  void winNorthV1;
  void winSouthV0;
  void winSouthV1;
  void winBotY;
  void winTopY;
  const eastGableWallMidU = uStableEnd - wallT * 0.5; // 28.91m

  // Issue #2 ("remove these windows" at `[6.728, 2.79, 18.009]`, `outbuildings.window.10.glass`):
  // Removed the two flanking East Gable casement windows so the Stable Upper East Gable wall has
  // continuous solid brick & interior Cromarty plaster piers North (`v = 0.28..2.215m`) and South (`v = 3.495..5.43m`)
  // of the central Full-Height Glazed French Double Balcony Door!
  addOutbuildingBrickWall(
    firstFloorGroup,
    uStableEnd - wallT,
    uStableEnd,
    stableGroundTopY,
    stableUpperTopY,
    vEastRangeNorth + wallT,
    balDoorV0,
    ['-x'],
    exteriorBrickMat,
    cromartyWallMat
  );
  addOutbuildingBrickWall(
    firstFloorGroup,
    uStableEnd - wallT,
    uStableEnd,
    stableGroundTopY,
    stableUpperTopY,
    balDoorV1,
    vEastRangeSouth - wallT,
    ['-x'],
    exteriorBrickMat,
    cromartyWallMat
  );

  // 1I. Upper East Gable Triangles above `stableUpperTopY = 3.32m`, notched cleanly around the upper portion
  //     of the central Full-Height French Balcony Door (`v = 2.215m..3.495m, y = 3.32m..4.12m`)
  {
    const vMinG = vInnerNorth;
    const vMaxG = vInnerSouth;
    const vMidG = (vMinG + vMaxG) * 0.5; // 2.855m
    const halfSpanG = (vMaxG - vMinG) * 0.5;
    const dDoorV0 = balDoorV0 - vMidG; // -0.64m
    const dDoorV1 = balDoorV1 - vMidG; // +0.64m
    const gableCutawaySpec = {
      axis: 'x' as const,
      coord: eastGableWallMidU,
      minSpan: vMinG,
      maxSpan: vMaxG,
      floor: 'first' as const,
      outwardSide: 'east' as const,
      includeInFirstFloorCutaway: true,
    };

    // 1. Interior 15mm breathable lime plaster gable (`outbuildings.stable.eastGableInteriorPlaster`)
    const intGableGeo = createExtrudedVYPolygon(
      [
        [-halfSpanG, stableUpperTopY],
        [dDoorV0, stableUpperTopY],
        [dDoorV0, balDoorTopY],
        [dDoorV1, balDoorTopY],
        [dDoorV1, stableUpperTopY],
        [halfSpanG, stableUpperTopY],
        [0, stableCeilRidgeY],
      ],
      0.015
    );
    const intGableMesh = new THREE.Mesh(intGableGeo, cromartyWallMat);
    intGableMesh.name = 'outbuildings.stable.eastGableInteriorPlaster';
    intGableMesh.userData.isArchitecturalShell = true;
    intGableMesh.userData.cutawayWall = gableCutawaySpec;
    intGableMesh.position.set(uStableEnd - wallT, 0, vMidG);
    intGableMesh.castShadow = true;
    intGableMesh.receiveShadow = true;
    firstFloorGroup.add(intGableMesh);

    // 1B. Middle 60mm Breathable Wood-Fibre Insulation Gable Core (`outbuildings.stable.eastGableWoodFibreCore`)
    const iwiGableGeo = createExtrudedVYPolygon(
      [
        [-halfSpanG - 0.06, stableUpperTopY],
        [dDoorV0, stableUpperTopY],
        [dDoorV0, balDoorTopY],
        [dDoorV1, balDoorTopY],
        [dDoorV1, stableUpperTopY],
        [halfSpanG + 0.06, stableUpperTopY],
        [0, stableCeilRidgeY + 0.06],
      ],
      0.06
    );
    const iwiGableMesh = new THREE.Mesh(iwiGableGeo, woodFibreCoreMat);
    iwiGableMesh.name = 'outbuildings.stable.eastGableWoodFibreCore';
    iwiGableMesh.userData.isArchitecturalShell = true;
    iwiGableMesh.userData.cutawayWall = gableCutawaySpec;
    iwiGableMesh.position.set(uStableEnd - wallT + 0.015, 0, vMidG);
    iwiGableMesh.castShadow = true;
    iwiGableMesh.receiveShadow = true;
    firstFloorGroup.add(iwiGableMesh);

    // 2. Exterior 205mm (9-inch) red-brick East Gable triangle (`outbuildings.stable.eastGableExteriorBrick`)
    const halfOuterV = (vEastRangeSouth - vEastRangeNorth) * 0.5 - 0.01;
    const peakWorldY = stableDatumY + stableRidgeH - 0.02;
    const extGableGeo = createExtrudedVYPolygon(
      [
        [-halfOuterV, stableUpperTopY],
        [dDoorV0, stableUpperTopY],
        [dDoorV0, balDoorTopY],
        [dDoorV1, balDoorTopY],
        [dDoorV1, stableUpperTopY],
        [halfOuterV, stableUpperTopY],
        [0, peakWorldY],
      ],
      wallT - 0.075
    );
    applyWorldSpaceBrickUVs(
      extGableGeo,
      OUTBUILDING_ORIGIN_X + (uStableEnd - wallT + 0.075),
      0,
      OUTBUILDING_ORIGIN_Z + vMidG
    );
    const extGableMesh = new THREE.Mesh(extGableGeo, exteriorBrickMat);
    extGableMesh.name = 'outbuildings.stable.eastGableExteriorBrick';
    extGableMesh.userData.isArchitecturalShell = true;
    extGableMesh.userData.cutawayWall = gableCutawaySpec;
    extGableMesh.position.set(uStableEnd - wallT + 0.075, 0, vMidG);
    extGableMesh.castShadow = true;
    extGableMesh.receiveShadow = true;
    firstFloorGroup.add(extGableMesh);
  }

  // 2. Central Full-Height Glazed French Double Balcony Door (`outbuildings.firstFloor.stableBalconySlidingDoor`,
  //    `1.28m W × 2.04m H`, `y = 2.08m..4.12m` — Building Regulations Part K & Part M compliant!)
  {
    const balconyDoorGroup = new THREE.Group();
    balconyDoorGroup.name = 'outbuildings.firstFloor.stableBalconySlidingDoor';
    balconyDoorGroup.userData.zone = 'courtyard';
    const bDoorMidU = eastGableWallMidU; // 28.91m
    const bDoorMidV = (balDoorV0 + balDoorV1) * 0.5; // 2.855m
    const bDoorW = balDoorV1 - balDoorV0; // 1.28m
    const bDoorH = balDoorTopY - balDoorBotY; // 2.04m full height!
    balconyDoorGroup.userData.cutawayWall = {
      axis: 'x',
      coord: bDoorMidU,
      minSpan: balDoorV0,
      maxSpan: balDoorV1,
      floor: 'first',
      outwardSide: 'east',
      includeInFirstFloorCutaway: true,
    };
    balconyDoorGroup.position.set(bDoorMidU, balDoorBotY, bDoorMidV);
    firstFloorGroup.add(balconyDoorGroup);

    const frameT = 0.042;
    // Weathered stone threshold sill & external stone header lintel
    const sillMesh = new THREE.Mesh(
      new THREE.BoxGeometry(wallT + 0.06, 0.028, bDoorW + 0.06),
      stoneSillMat
    );
    sillMesh.name = 'outbuildings.firstFloor.stableBalconySlidingDoor.thresholdSill';
    sillMesh.position.set(0.01, 0.014, 0);
    sillMesh.receiveShadow = true;
    balconyDoorGroup.add(sillMesh);

    const extHeaderLintel = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.075, bDoorW + 0.14),
      stoneSillMat
    );
    extHeaderLintel.name = 'outbuildings.firstFloor.stableBalconySlidingDoor.extHeaderLintel';
    extHeaderLintel.position.set(wallT * 0.5 + 0.01, bDoorH + 0.036, 0);
    extHeaderLintel.castShadow = true;
    balconyDoorGroup.add(extHeaderLintel);

    // Outer white-painted timber reveal box frame (`windowFrameMat`, matching the flanking cottage casement windows!)
    for (const sideV of [-1, 1] as const) {
      const jamb = new THREE.Mesh(
        new THREE.BoxGeometry(wallT + 0.024, bDoorH, frameT),
        windowFrameMat
      );
      jamb.name = `outbuildings.firstFloor.stableBalconySlidingDoor.jamb.${sideV < 0 ? 'north' : 'south'}`;
      jamb.position.set(0, bDoorH * 0.5, sideV * (bDoorW * 0.5 - frameT * 0.5));
      jamb.castShadow = true;
      balconyDoorGroup.add(jamb);
    }

    const headFrame = new THREE.Mesh(
      new THREE.BoxGeometry(wallT + 0.024, frameT, bDoorW),
      windowFrameMat
    );
    headFrame.name = 'outbuildings.firstFloor.stableBalconySlidingDoor.headFrame';
    headFrame.position.set(0, bDoorH - frameT * 0.5, 0);
    headFrame.castShadow = true;
    balconyDoorGroup.add(headFrame);

    // Twin Interactive Hinged Full-Height Glazed French Doors (`slidingNorth` and `slidingSouth`)
    const clearSpanV = bDoorW - frameT * 2; // 1.196m clear width
    const leafW = clearSpanV * 0.5 - 0.004; // 0.594m per leaf
    const leafH = bDoorH - 0.028 - frameT; // 1.970m clear leaf height (`2.00m` walkthrough opening!)
    const stileW = 0.056;
    const botRailH = 0.16;
    const topRailH = 0.068;

    for (const [sideSign, pTag] of [
      [-1, 'slidingNorth'],
      [1, 'slidingSouth'],
    ] as const) {
      const hingeZ = sideSign * (clearSpanV * 0.5);
      const leafPivot = new THREE.Group();
      leafPivot.name = `outbuildings.firstFloor.stableBalconySlidingDoor.${pTag}`;
      leafPivot.position.set(0.018, 0.028, hingeZ);
      balconyDoorGroup.add(leafPivot);

      const inwardDir = -sideSign;
      const leafMidZ = inwardDir * (leafW * 0.5);

      for (const [sTag, sz] of [
        ['north', inwardDir * (stileW * 0.5)],
        ['south', inwardDir * (leafW - stileW * 0.5)],
      ] as const) {
        const stile = new THREE.Mesh(
          new THREE.BoxGeometry(0.044, leafH, stileW),
          windowFrameMat
        );
        stile.name = `outbuildings.firstFloor.stableBalconySlidingDoor.${pTag}.stile.${sTag}`;
        stile.position.set(0, leafH * 0.5, sz);
        stile.castShadow = true;
        leafPivot.add(stile);
      }

      const bRail = new THREE.Mesh(
        new THREE.BoxGeometry(0.044, botRailH, leafW - stileW * 2),
        windowFrameMat
      );
      bRail.name = `outbuildings.firstFloor.stableBalconySlidingDoor.${pTag}.bottomRail`;
      bRail.position.set(0, botRailH * 0.5, leafMidZ);
      bRail.castShadow = true;
      leafPivot.add(bRail);

      const tRail = new THREE.Mesh(
        new THREE.BoxGeometry(0.044, topRailH, leafW - stileW * 2),
        windowFrameMat
      );
      tRail.name = `outbuildings.firstFloor.stableBalconySlidingDoor.${pTag}.topRail`;
      tRail.position.set(0, leafH - topRailH * 0.5, leafMidZ);
      tRail.castShadow = true;
      leafPivot.add(tRail);

      const paneW = leafW - stileW * 2 + 0.01;
      const paneH = leafH - botRailH - topRailH + 0.01;
      const paneCY = botRailH + paneH * 0.5;
      const glassPane = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, paneH, paneW),
        windowGlassMat
      );
      glassPane.name = `outbuildings.firstFloor.stableBalconySlidingDoor.${pTag}.glass`;
      glassPane.position.set(0, paneCY, leafMidZ);
      leafPivot.add(glassPane);

      // Two Georgian/cottage horizontal glazing bars per French door leaf matching the ground-floor patio doors
      for (const [barTag, gy] of [
        ['lower', botRailH + paneH * 0.34],
        ['upper', botRailH + paneH * 0.67],
      ] as const) {
        const hBar = new THREE.Mesh(
          new THREE.BoxGeometry(0.030, 0.022, paneW),
          windowFrameMat
        );
        hBar.name = `outbuildings.firstFloor.stableBalconySlidingDoor.${pTag}.glazingBar.${barTag}`;
        hBar.position.set(0, gy, leafMidZ);
        leafPivot.add(hBar);
      }

      // Brushed-brass lever handles on interior & exterior faces of each French door leaf
      for (const hx of [-0.034, 0.034] as const) {
        const handle = new THREE.Mesh(
          new THREE.BoxGeometry(0.024, 0.018, 0.105),
          spotlightBrassTrimMat
        );
        handle.name = `outbuildings.firstFloor.stableBalconySlidingDoor.${pTag}.handle.${hx < 0 ? 'inner' : 'outer'}`;
        handle.userData.lodTier = 'high';
        handle.position.set(hx, 0.98, inwardDir * (leafW - stileW * 0.5 - 0.02));
        leafPivot.add(handle);
      }

      ctx.interactions.registerHingedDoor(
        balconyDoorGroup,
        leafPivot,
        new THREE.Vector3(0, 0, 0),
        'y',
        sideSign < 0 ? Math.PI * 0.46 : -Math.PI * 0.46
      );
    }

    // Neatly retracted solid light-oak interior blind pelmet at the top of the French doors
    const blindPelmet = new THREE.Mesh(
      new THREE.BoxGeometry(0.046, 0.044, clearSpanV),
      lightJoineryOakMat
    );
    blindPelmet.name = 'outbuildings.firstFloor.stableBalconySlidingDoor.blindPelmet';
    blindPelmet.position.set(-wallT * 0.5 + 0.026, bDoorH - 0.024, 0);
    blindPelmet.castShadow = true;
    balconyDoorGroup.add(blindPelmet);
  }

  // Issue #9 ("add some up / down lights iether side here" at `[6.511, 2.983, 13.951]`, `outbuildings.firstFloor.brickWall.99`):
  // Architectural Dual-Beam Up/Down Exterior Wall Sconce Lights mounted on the East Gable brick piers (`u = 29.05m`):
  // - Outer North pier (`v = 0.57m, y = 2.82m`, right at `[6.511, 2.983, 13.951]`!) & Outer South pier (`v = 5.14m, y = 2.82m`)
  // - Inner North pier (`v = 1.96m, y = 2.82m`) & Inner South pier (`v = 3.75m, y = 2.82m`) flanking the central French balcony doors
  addOutbuildingExteriorUpDownWallLight(
    firstFloorGroup,
    uStableEnd,
    2.82,
    0.57,
    'outbuildings.firstFloor.stableBalconyWallLight.northOuter',
    'first',
    vEastRangeNorth + wallT,
    winNorthV0
  );
  addOutbuildingExteriorUpDownWallLight(
    firstFloorGroup,
    uStableEnd,
    2.82,
    1.96,
    'outbuildings.firstFloor.stableBalconyWallLight.northInner',
    'first',
    winNorthV1,
    balDoorV0
  );
  addOutbuildingExteriorUpDownWallLight(
    firstFloorGroup,
    uStableEnd,
    2.82,
    3.75,
    'outbuildings.firstFloor.stableBalconyWallLight.southInner',
    'first',
    balDoorV1,
    winSouthV0
  );
  addOutbuildingExteriorUpDownWallLight(
    firstFloorGroup,
    uStableEnd,
    2.82,
    5.14,
    'outbuildings.firstFloor.stableBalconyWallLight.southOuter',
    'first',
    winSouthV1,
    vEastRangeSouth - wallT
  );

  // 3. Upper-Floor Walk-Out Balcony Deck & Perimeter Railings (`outbuildings.firstFloor.stableEastBalcony`)
  //    Spanning `u = 29.05m..31.85m` (`2.80m` deep) x `v = 0.00m..5.71m` (`5.71m` wide) at `y = stableUpperFloorY = 2.08m`
  {
    const balconyGroup = new THREE.Group();
    balconyGroup.name = 'outbuildings.firstFloor.stableEastBalcony';
    balconyGroup.userData.zone = 'courtyard';
    firstFloorGroup.add(balconyGroup);

    const balStartU = uStableEnd; // 29.05m
    const balEndU = uStableExtEnd; // 31.85m
    const balSpanU = balEndU - balStartU; // 2.80m
    const balMidU = (balStartU + balEndU) * 0.5; // 30.45m
    const balSpanV = vEastRangeSouth - vEastRangeNorth; // 5.71m
    const balMidV = (vEastRangeNorth + vEastRangeSouth) * 0.5; // 2.855m

    // Perimeter stone fascia coping cornice (`y = stableGroundTopY (1.96m) .. stableUpperFloorY - 0.03m (2.05m)`)
    const fasciaSlab = new THREE.Mesh(
      new THREE.BoxGeometry(balSpanU + 0.06, 0.09, balSpanV + 0.08),
      stoneSillMat
    );
    fasciaSlab.name = 'outbuildings.firstFloor.stableEastBalcony.copingFascia';
    fasciaSlab.position.set(balMidU + 0.02, stableGroundTopY + 0.045, balMidV);
    fasciaSlab.castShadow = true;
    fasciaSlab.receiveShadow = true;
    balconyGroup.add(fasciaSlab);

    // Grooved Solid European Oak Timber Balcony Decking (`y = 2.05m..2.08m`, top flush with `stableUpperFloorY = 2.08m`)
    const deckW = balSpanU - 0.04; // 2.76m
    const deckL = balSpanV - 0.08; // 5.63m
    const deckGeo = new THREE.BoxGeometry(deckW, 0.034, deckL);
    applyOutbuildingFloorUVs(deckGeo, balMidU - 0.01, stableUpperFloorY - 0.017, balMidV, 0.5);
    const balconyDeck = new THREE.Mesh(deckGeo, lightJoineryOakMat);
    balconyDeck.name = 'outbuildings.firstFloor.stableEastBalcony.deck';
    balconyDeck.position.set(balMidU - 0.01, stableUpperFloorY - 0.017, balMidV);
    balconyDeck.castShadow = true;
    balconyDeck.receiveShadow = true;
    balconyGroup.add(balconyDeck);

    // Subtle dark timber drainage grooves running North-South (`v`) across the balcony deck planks
    const deckGrooveMat = new THREE.MeshStandardMaterial({
      color: 0x3b2c1e,
      roughness: 0.9,
      metalness: 0.02,
    });
    const numDeckPlanks = 19;
    for (let p = 1; p < numDeckPlanks; p++) {
      const pu = balStartU + (p / numDeckPlanks) * deckW;
      const groove = new THREE.Mesh(
        new THREE.BoxGeometry(0.006, 0.004, deckL - 0.04),
        deckGrooveMat
      );
      groove.name = `outbuildings.firstFloor.stableEastBalcony.deckGroove.${p}`;
      groove.userData.lodTier = 'high';
      groove.position.set(pu, stableUpperFloorY + 0.001, balMidV);
      balconyGroup.add(groove);
    }

    // Architectural Wrought-Iron & Solid-Oak Balcony Railings (`outbuildings.firstFloor.stableEastBalcony.railings`)
    const railingsGroup = new THREE.Group();
    railingsGroup.name = 'outbuildings.firstFloor.stableEastBalcony.railings';
    balconyGroup.add(railingsGroup);

    const railH = 1.10; // Part K mandatory 1,100mm (1.10m) external balcony guardrail height above 2.08m deck!
    const rNorthV = vEastRangeNorth + 0.08; // 0.08m
    const rSouthV = vEastRangeSouth - 0.08; // 5.63m
    const rEastU = balEndU - 0.08; // 31.77m
    // Issue #10 ("Make the extit stairs a spiral staircase on this side so we dont cover the door" at `[9.692, 1.228, 18.262]`):
    // The spiral staircase is now at the South-East corner (`v = 4.42m..5.56m`), so the East railing runs along
    // the North & Central balcony (`v = 0.08m..4.42m`), leaving `v = 4.42m..5.56m` open onto the spiral stair top landing!
    const stairGateSouthV0 = 4.42;

    const addBalconyRailingRun = (
      u0: number,
      v0: number,
      u1: number,
      v1: number,
      runId: string
    ): void => {
      const len = Math.hypot(u1 - u0, v1 - v0);
      const midU = (u0 + u1) * 0.5;
      const midV = (v0 + v1) * 0.5;
      const alongV = Math.abs(v1 - v0) > Math.abs(u1 - u0);

      // Top rounded solid-oak handrail (`r = 0.028m` at `y = stableUpperFloorY + railH`)
      const topRail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.028, 0.028, len, 18),
        lightJoineryOakMat
      );
      topRail.name = `outbuildings.firstFloor.stableEastBalcony.handrail.${runId}`;
      if (alongV) {
        topRail.rotation.x = Math.PI / 2;
      } else {
        topRail.rotation.z = Math.PI / 2;
      }
      topRail.position.set(midU, stableUpperFloorY + railH, midV);
      topRail.castShadow = true;
      railingsGroup.add(topRail);

      // Upper & lower wrought-iron flat bar rails (`y = +0.10m` and `y = +0.89m`)
      for (const barYOff of [0.09, railH - 0.05] as const) {
        const flatBar = new THREE.Mesh(
          new THREE.BoxGeometry(alongV ? 0.032 : len, 0.018, alongV ? len : 0.032),
          castIronMat
        );
        flatBar.name = `outbuildings.firstFloor.stableEastBalcony.flatBar.${runId}.${barYOff < 0.5 ? "bottom" : "top"}`;
        flatBar.position.set(midU, stableUpperFloorY + barYOff, midV);
        flatBar.castShadow = true;
        railingsGroup.add(flatBar);
      }

      // Vertical wrought-iron square/round baluster spindles spaced every ~12.5cm + decorative collar rings
      const numSpindles = Math.max(2, Math.floor(len / 0.102)); // <= 86mm clear gap (strictly passes Part K 100mm sphere rule!)
      const spindleH = railH - 0.14;
      for (let i = 1; i < numSpindles; i++) {
        const t = i / numSpindles;
        const su = u0 + (u1 - u0) * t;
        const sv = v0 + (v1 - v0) * t;
        const spindle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.008, 0.008, spindleH, 10),
          castIronMat
        );
        spindle.name = 'outbuildings.firstFloor.stableEastBalcony.spindle';
        spindle.userData.lodTier = 'high';
        spindle.position.set(su, stableUpperFloorY + 0.09 + spindleH * 0.5, sv);
        spindle.castShadow = true;
        railingsGroup.add(spindle);

        if (i % 2 === 0) {
          const collar = new THREE.Mesh(
            new THREE.SphereGeometry(0.015, 10, 8),
            castIronMat
          );
          collar.name = `outbuildings.firstFloor.stableEastBalcony.spindleCollar.${runId}.${i}`;
          collar.userData.lodTier = 'high';
          collar.position.set(su, stableUpperFloorY + railH * 0.52, sv);
          railingsGroup.add(collar);
        }
      }
    };

    // North Railing (`u = 29.05..31.77m, v = 0.08m`)
    addBalconyRailingRun(balStartU, rNorthV, rEastU, rNorthV, 'north');
    // South Railing (`u = 29.05..31.77m, v = 5.63m`)
    addBalconyRailingRun(balStartU, rSouthV, rEastU, rSouthV, 'south');
    // East Railing North and South of the Spiral Staircase West Bridge Gate (`v = 4.42m..5.22m`)
    const stairGateSouthV1 = 5.22;
    addBalconyRailingRun(rEastU, rNorthV, rEastU, stairGateSouthV0, 'east');
    addBalconyRailingRun(rEastU, stairGateSouthV1, rEastU, rSouthV, 'eastSouth');

    // Turned Wrought-Iron & Solid-Oak Newel Posts around the Balcony Perimeter
    for (const [pu, pv] of [
      [balStartU + 0.04, rNorthV],
      [rEastU, rNorthV],
      [rEastU, (rNorthV + stairGateSouthV0) * 0.5],
      [rEastU, stairGateSouthV0],
      [rEastU, stairGateSouthV1],
      [rEastU, rSouthV],
      [balStartU + 0.04, rSouthV],
    ] as const) {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.062, railH + 0.04, 0.062),
        castIronMat
      );
      post.name = 'outbuildings.firstFloor.stableEastBalcony.newelPost';
      post.position.set(pu, stableUpperFloorY + (railH + 0.04) * 0.5, pv);
      post.castShadow = true;
      railingsGroup.add(post);

      const finial = new THREE.Mesh(
        new THREE.SphereGeometry(0.042, 14, 12),
        lightJoineryOakMat
      );
      finial.name = `outbuildings.firstFloor.stableEastBalcony.newelFinial.${Math.round(pu * 10)}_${Math.round(pv * 10)}`;
      finial.userData.lodTier = 'high';
      finial.position.set(pu, stableUpperFloorY + railH + 0.065, pv);
      railingsGroup.add(finial);
    }

    // Batch 1 Issue #6 ("Outdoor funruture set here" at `[7.722, 2.08, 17.465]`):
    // Weathered Solid-Teak & Woven-Rope Outdoor Balcony Lounge Furniture Set on the Balcony Deck!
    buildStableBalconyOutdoorFurniture(balconyGroup, stableUpperFloorY, balStartU, balEndU);
  }

  // 4. Issue #10 ("Make the extit stairs a spiral staircase on this side so we dont cover the door" at `[9.692, 1.228, 18.262]`) &
  //    Batch 3 Issue #10 ("Fix this landing " at `[10.13, 2.08, 18.537]`, `outbuildings.stable.exteriorBalconyStaircase.topLanding`):
  //    Bespoke Exterior Cast-Iron & Weathered-Oak Spiral Staircase (`outbuildings.stable.exteriorBalconyStaircase`)
  //    positioned at the South-East corner (`centerU = 32.68m, centerV = 4.82m, outerRadius = 0.82m`):
  //    - `topLanding` is a bespoke Fan/Trapezoidal West Bridge Sector (`theta = +0.76*pi .. +1.24*pi`) bridging from the central
  //      column (`u = 32.68m, v = 4.82m`) to the balcony East gate (`u = 31.85m, v = 4.42m..5.22m`) at `y = 2.08m`.
  //    - The 13 spiral treads (`s = 0..12`) sweep clockwise strictly outside that West landing sector (`thetaBottom = -0.68*pi`
  //      on the North-West -> North -> East -> South up to `thetaTop = +0.66*pi` on the South-West), so ZERO treads or vertical
  //      spindles ever pass underneath or poke through `topLanding`!
  {
    const extStairGroup = new THREE.Group();
    extStairGroup.name = 'outbuildings.stable.exteriorBalconyStaircase';
    extStairGroup.userData.zone = 'courtyard';
    groundGroup.add(extStairGroup);

    const spiralCenterU = uStableExtEnd + 0.83; // 32.68m
    const spiralCenterV = 4.82; // Centered on the v = 4.42..5.22m balcony gate!
    const spiralOuterR = 0.82; // Outer tread radius
    const spiralColR = 0.078; // 156mm cast-iron central column radius
    const totalExtRise = stableUpperFloorY - stableGroundFloorY; // 2.52m (from -0.44m to +2.08m)
    const lRailH = 0.96;

    // A. Dressed Circular Yorkstone Ground Plinth Pad (`y = -0.48m..-0.42m`) & Cast-Iron Base Flange
    const groundPad = new THREE.Mesh(
      new THREE.CylinderGeometry(spiralOuterR + 0.14, spiralOuterR + 0.18, 0.08, 32),
      stoneSillMat
    );
    groundPad.name = 'outbuildings.stable.exteriorBalconyStaircase.bottomLanding';
    groundPad.position.set(spiralCenterU, stableGroundFloorY - 0.02, spiralCenterV);
    groundPad.receiveShadow = true;
    extStairGroup.add(groundPad);

    const baseFlange = new THREE.Mesh(
      new THREE.CylinderGeometry(spiralColR + 0.09, spiralColR + 0.12, 0.045, 24),
      castIronMat
    );
    baseFlange.name = "outbuildings.stable.exteriorBalconyStaircase.baseFlange";
    baseFlange.position.set(spiralCenterU, stableGroundFloorY + 0.022, spiralCenterV);
    extStairGroup.add(baseFlange);

    // B. Central Cast-Iron Column (`outbuildings.stable.exteriorBalconyStaircase.supportColumn`) with turned decorative rings & acorn finial
    const colTotalH = totalExtRise + lRailH + 0.14;
    const centerColumn = new THREE.Mesh(
      new THREE.CylinderGeometry(spiralColR, spiralColR, colTotalH, 24),
      castIronMat
    );
    centerColumn.name = 'outbuildings.stable.exteriorBalconyStaircase.supportColumn';
    centerColumn.position.set(spiralCenterU, stableGroundFloorY + colTotalH * 0.5, spiralCenterV);
    centerColumn.castShadow = true;
    extStairGroup.add(centerColumn);

    const colFinial = new THREE.Mesh(
      new THREE.SphereGeometry(spiralColR * 1.22, 16, 14),
      lightJoineryOakMat
    );
    colFinial.name = "outbuildings.stable.exteriorBalconyStaircase.columnFinial";
    colFinial.userData.lodTier = 'high';
    colFinial.position.set(spiralCenterU, stableGroundFloorY + colTotalH + 0.05, spiralCenterV);
    extStairGroup.add(colFinial);

    // Wall-tie cantilever steel bracket anchoring the spiral column to the South-East masonry pier (`u = 31.85m, v = 4.82m`)
    const wallTieArm = new THREE.Mesh(
      new THREE.BoxGeometry(spiralCenterU - uStableExtEnd, 0.09, 0.11),
      castIronMat
    );
    wallTieArm.name = "outbuildings.stable.exteriorBalconyStaircase.wallTieBracket";
    wallTieArm.position.set((uStableExtEnd + spiralCenterU) * 0.5, stableUpperFloorY - 0.08, spiralCenterV);
    wallTieArm.castShadow = true;
    extStairGroup.add(wallTieArm);

    // C. Bespoke Trapezoidal / Fan-Sector Top Balcony Bridge Landing (`outbuildings.stable.exteriorBalconyStaircase.topLanding`)
    //    Occupies strictly the West angular sector from the central column (`u = 32.68m, v = 4.82m`) to the balcony gate
    //    (`u = 31.83m, v = 4.42m..5.22m`), leaving the North, East, and South sectors 100% open for the spiral treads!
    const landingV0 = 4.42;
    const landingV1 = 5.22;
    const bridgeWestDX = (uStableExtEnd - 0.02) - spiralCenterU; // -0.85m
    const bridgeHalfV = (landingV1 - landingV0) * 0.5; // 0.40m
    const colHubR = spiralColR + 0.025; // 0.103m

    const createBridgeLandingGeo = (thickness: number, pad: number): THREE.BufferGeometry => {
      const shape = new THREE.Shape();
      // Note: after rotateX(Math.PI / 2), shape (x, y) maps to (x, 0, y) in local XZ!
      shape.moveTo(bridgeWestDX - pad, -bridgeHalfV - pad);
      shape.lineTo(bridgeWestDX - pad, bridgeHalfV + pad);
      shape.lineTo(0, colHubR + pad);
      shape.absarc(0, 0, colHubR + pad, Math.PI * 0.5, -Math.PI * 0.5, true);
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: thickness,
        bevelEnabled: true,
        bevelThickness: 0.004,
        bevelSize: 0.004,
        bevelSegments: 2,
        curveSegments: 16,
      });
      geo.rotateX(Math.PI / 2);
      geo.computeBoundingSphere();
      return geo;
    };

    const topLandingFrameGeo = createBridgeLandingGeo(0.052, 0.018);
    const topLandingFrame = new THREE.Mesh(topLandingFrameGeo, castIronMat);
    topLandingFrame.name = 'outbuildings.stable.exteriorBalconyStaircase.topLandingFrame';
    topLandingFrame.position.set(spiralCenterU, stableUpperFloorY - 0.036, spiralCenterV);
    topLandingFrame.castShadow = true;
    extStairGroup.add(topLandingFrame);

    const topLandingDeckGeo = createBridgeLandingGeo(0.036, 0);
    applyOutbuildingFloorUVs(topLandingDeckGeo, spiralCenterU, stableUpperFloorY, spiralCenterV, 0.5);
    const topLandingDeck = new THREE.Mesh(topLandingDeckGeo, lightJoineryOakMat);
    topLandingDeck.name = 'outbuildings.stable.exteriorBalconyStaircase.topLanding';
    topLandingDeck.position.set(spiralCenterU, stableUpperFloorY, spiralCenterV);
    topLandingDeck.castShadow = true;
    topLandingDeck.receiveShadow = true;
    extStairGroup.add(topLandingDeck);

    // North radial safety guardrail along the North edge of the bridge landing (`(u = 31.77m, v = 4.42m)` -> `(u = 32.68m, v = 4.72m)`)
    {
      const nU0 = uStableExtEnd - 0.08;
      const nV0 = landingV0;
      const nU1 = spiralCenterU;
      const nV1 = spiralCenterV - colHubR;
      const nLen = Math.hypot(nU1 - nU0, nV1 - nV0);
      const nMidU = (nU0 + nU1) * 0.5;
      const nMidV = (nV0 + nV1) * 0.5;
      const nYaw = -Math.atan2(nV1 - nV0, nU1 - nU0);

      const northBridgeRail = new THREE.Mesh(
        new THREE.BoxGeometry(nLen, 0.042, 0.048),
        lightJoineryOakMat
      );
      northBridgeRail.name = "outbuildings.stable.exteriorBalconyStaircase.topLandingNorthRail";
      northBridgeRail.position.set(nMidU, stableUpperFloorY + lRailH, nMidV);
      northBridgeRail.rotation.y = nYaw;
      northBridgeRail.castShadow = true;
      extStairGroup.add(northBridgeRail);

      const northBridgeBotBar = new THREE.Mesh(
        new THREE.BoxGeometry(nLen, 0.018, 0.032),
        castIronMat
      );
      northBridgeBotBar.name = "outbuildings.stable.exteriorBalconyStaircase.topLandingNorthBottomBar";
      northBridgeBotBar.position.set(nMidU, stableUpperFloorY + 0.09, nMidV);
      northBridgeBotBar.rotation.y = nYaw;
      extStairGroup.add(northBridgeBotBar);

      for (let i = 1; i <= 5; i++) {
        const t = i / 6;
        const su = nU0 + (nU1 - nU0) * t;
        const sv = nV0 + (nV1 - nV0) * t;
        const sp = new THREE.Mesh(
          new THREE.CylinderGeometry(0.008, 0.008, lRailH - 0.1, 10),
          castIronMat
        );
        sp.name = `outbuildings.stable.exteriorBalconyStaircase.topLandingSpindle.${i}`;
        sp.userData.lodTier = 'high';
        sp.position.set(su, stableUpperFloorY + 0.09 + (lRailH - 0.1) * 0.5, sv);
        sp.castShadow = true;
        extStairGroup.add(sp);
      }
    }

    // D. 13 Fan-Shaped Weathered-Oak & Cast-Iron Spiral Treads (`outbuildings.stable.exteriorBalconyStaircase.tread.1..13`)
    //    Sweeping clockwise from bottom (`s = 0` at `thetaBottom = -0.68 * Math.PI` North-West) through North (`-0.5 * Math.PI`),
    //    East (`0`), and South (`+0.5 * Math.PI`) up to top tread (`s = 12` at `thetaTop = +0.66 * Math.PI` South-West),
    //    stepping directly onto the South radial edge of `topLanding` with ZERO overlap under the landing!
    const numSpiralSteps = 13;
    const stepRise = totalExtRise / (numSpiralSteps + 1); // 0.18m per riser (13 treads + top landing = 14 risers)
    const thetaBottom = -0.68 * Math.PI; // Bottom step on North-West side (`u ≈ 32.24m, v ≈ 4.13m`)
    const thetaTop = 0.66 * Math.PI; // Top step arriving at South-West radial edge of top landing (`u ≈ 32.29m, v ≈ 5.54m`)
    const treadSectorSpan = 0.34; // Radians of each fan tread (~19.5°)

    // Pre-build reusable fan-shaped tread geometry (`ExtrudeGeometry` in XY then rotated to XZ horizontal plane)
    const treadShape = new THREE.Shape();
    const innerR = spiralColR + 0.005;
    const outerR = spiralOuterR;
    const halfAng = treadSectorSpan * 0.5;
    treadShape.absarc(0, 0, innerR, -halfAng, halfAng, false);
    treadShape.lineTo(Math.cos(halfAng) * outerR, Math.sin(halfAng) * outerR);
    treadShape.absarc(0, 0, outerR, halfAng, -halfAng, true);
    treadShape.closePath();

    const fanTreadGeo = new THREE.ExtrudeGeometry(treadShape, {
      depth: 0.036,
      bevelEnabled: true,
      bevelThickness: 0.004,
      bevelSize: 0.004,
      bevelSegments: 2,
      curveSegments: 18,
    });
    fanTreadGeo.rotateX(Math.PI / 2);
    fanTreadGeo.computeBoundingSphere();

    const handrailCurvePts: THREE.Vector3[] = [];
    const stringerCurvePts: THREE.Vector3[] = [];
    const railR = spiralOuterR - 0.035;

    for (let s = 0; s < numSpiralSteps; s++) {
      const t = s / (numSpiralSteps - 1);
      const theta = thetaBottom + t * (thetaTop - thetaBottom);
      const treadY = stableGroundFloorY + (s + 1) * stepRise;

      // Oak fan tread
      const treadMesh = new THREE.Mesh(fanTreadGeo, lightJoineryOakMat);
      treadMesh.name = `outbuildings.stable.exteriorBalconyStaircase.tread.${s + 1}`;
      treadMesh.position.set(spiralCenterU, treadY, spiralCenterV);
      treadMesh.rotation.y = -theta;
      treadMesh.castShadow = true;
      treadMesh.receiveShadow = true;
      extStairGroup.add(treadMesh);

      // Cast-iron cylindrical spacer collar on the central column & under-tread web bracket
      const colSpacer = new THREE.Mesh(
        new THREE.CylinderGeometry(spiralColR + 0.012, spiralColR + 0.012, 0.022, 20),
        castIronMat
      );
      colSpacer.name = `outbuildings.stable.exteriorBalconyStaircase.columnSpacer.${s + 1}`;
      colSpacer.userData.lodTier = 'high';
      colSpacer.position.set(spiralCenterU, treadY - 0.024, spiralCenterV);
      extStairGroup.add(colSpacer);

      const midR = (innerR + outerR) * 0.52;
      const supportWeb = new THREE.Mesh(
        new THREE.BoxGeometry(outerR - innerR - 0.08, 0.028, 0.032),
        castIronMat
      );
      supportWeb.name = `outbuildings.stable.exteriorBalconyStaircase.treadWeb.${s + 1}`;
      supportWeb.userData.lodTier = 'high';
      supportWeb.position.set(
        spiralCenterU + Math.cos(theta) * midR,
        treadY - 0.032,
        spiralCenterV + Math.sin(theta) * midR
      );
      supportWeb.rotation.y = -theta;
      extStairGroup.add(supportWeb);

      // 2 wrought-iron vertical baluster spindles per tread along the outer radius
      for (const angOff of [-halfAng * 0.55, halfAng * 0.55] as const) {
        const spTheta = theta + angOff;
        const spU = spiralCenterU + Math.cos(spTheta) * railR;
        const spV = spiralCenterV + Math.sin(spTheta) * railR;
        const spH = lRailH + 0.03;
        const spindle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.008, 0.008, spH, 10),
          castIronMat
        );
        spindle.position.set(spU, treadY + spH * 0.5 - 0.015, spV);
        spindle.name = `outbuildings.stable.exteriorBalconyStaircase.spindle.${s + 1}.${angOff < 0 ? 1 : 2}`;
        spindle.userData.lodTier = 'high';
        spindle.castShadow = true;
        extStairGroup.add(spindle);
      }

      handrailCurvePts.push(
        new THREE.Vector3(
          spiralCenterU + Math.cos(theta) * railR,
          treadY + lRailH,
          spiralCenterV + Math.sin(theta) * railR
        )
      );
      stringerCurvePts.push(
        new THREE.Vector3(
          spiralCenterU + Math.cos(theta) * (outerR - 0.015),
          treadY - 0.02,
          spiralCenterV + Math.sin(theta) * (outerR - 0.015)
        )
      );
    }

    // Connect top of helical handrail & outer stringer cleanly to the South-West balcony gate newel post (`u = 31.77m, v = 5.22m`)
    handrailCurvePts.push(
      new THREE.Vector3(uStableExtEnd - 0.08, stableUpperFloorY + lRailH, landingV1)
    );
    stringerCurvePts.push(
      new THREE.Vector3(uStableExtEnd, stableUpperFloorY - 0.02, landingV1)
    );

    // E. Continuous Helical Solid-Oak Handrail (`outbuildings.stable.exteriorBalconyStaircase.handrail.1`) & Helical Cast-Iron Outer Stringer (`stringer.1`)
    const handrailCurve = new THREE.CatmullRomCurve3(handrailCurvePts);
    const spiralHandrail = new THREE.Mesh(
      new THREE.TubeGeometry(handrailCurve, 64, 0.026, 14, false),
      lightJoineryOakMat
    );
    spiralHandrail.name = 'outbuildings.stable.exteriorBalconyStaircase.handrail.1';
    spiralHandrail.geometry.computeBoundingSphere();
    spiralHandrail.castShadow = true;
    extStairGroup.add(spiralHandrail);

    const stringerCurve = new THREE.CatmullRomCurve3(stringerCurvePts);
    const spiralStringer = new THREE.Mesh(
      new THREE.TubeGeometry(stringerCurve, 64, 0.022, 12, false),
      castIronMat
    );
    spiralStringer.name = 'outbuildings.stable.exteriorBalconyStaircase.stringer.1';
    spiralStringer.geometry.computeBoundingSphere();
    spiralStringer.castShadow = true;
    extStairGroup.add(spiralStringer);

    // Bottom entry newel post & finial at `s = 0` (`thetaBottom`)
    const botNewelU = spiralCenterU + Math.cos(thetaBottom) * railR;
    const botNewelV = spiralCenterV + Math.sin(thetaBottom) * railR;
    const botNewelH = stepRise + lRailH + 0.04;
    const botNewel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.028, botNewelH, 14),
      castIronMat
    );
    botNewel.name = "outbuildings.stable.exteriorBalconyStaircase.bottomNewelPost";
    botNewel.position.set(botNewelU, stableGroundFloorY + botNewelH * 0.5, botNewelV);
    botNewel.castShadow = true;
    extStairGroup.add(botNewel);

    const botNewelCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.038, 12, 10),
      lightJoineryOakMat
    );
    botNewelCap.name = "outbuildings.stable.exteriorBalconyStaircase.bottomNewelCap";
    botNewelCap.userData.lodTier = 'high';
    botNewelCap.position.set(botNewelU, stableGroundFloorY + botNewelH + 0.02, botNewelV);
    extStairGroup.add(botNewelCap);
  }

  // Issue #1 ("on cutout mode this wall should come higher up" at `[0.522, 2.491, 14.685]`):
  // Internal 1st-Floor Partition between the Barn Mezzanine (`mezzanineFloorY = 1.54m`) and the Stable Upper Room (`stableUpperFloorY = 2.08m`)
  // at `u = 23.02m..23.22m`: raise both piers (`v = 0.282..2.40m` and `v = 3.30..5.428m`) on `firstFloorGroup` all the way up
  // to `stableUpperTopY = 3.32m` so in 1st-floor cutaway mode this wall matches the full `3.32m` Stable wall height!
  // Issue #10 ("Fix the geometry on this join" at `[0.827, 3.574, 18.557]` -> `u = 22.993m, y = 3.574m, v = 4.542m`):
  // On the Barn side (`u = 23.02..23.12m`), the eave line is `barnUpperTopY = 2.92m` (whereas on the Stable side
  // `u = 23.12..23.22m`, the eave line is `stableUpperTopY = 3.32m`).
  // By stopping the Barn-side rectangular wall at `barnUpperTopY = 2.92m` and starting `outbuildings.barnStablePartitionGable`
  // at `yBase = barnUpperTopY = 2.92m`, the top sloped edges of `outbuildings.barnStablePartitionGable` match the exact
  // angle and elevation of `outbuildings.roof.vaultedPlasterCeiling` (`2.92m` at eaves -> `4.269m` at ridge) with zero protruding steps!
  const uPartMid = uBarnEnd - partT * 0.5; // 23.12m
  // Barn Mezzanine West half (`u = 23.02..23.12m`) in `settingPlasterMat`, Stable Upper East half (`u = 23.12..23.22m`) in `cromartyWallMat` (Issue #6!)
  addOutbuildingBrickWall(
    firstFloorGroup,
    uBarnEnd - partT,
    uPartMid,
    stableGroundTopY,
    barnUpperTopY,
    vEastRangeNorth + wallT + 0.002,
    2.554,
    ['-x', '+z', '-z'],
    settingPlasterMat,
    settingPlasterMat
  );
  addOutbuildingBrickWall(
    firstFloorGroup,
    uBarnEnd - partT,
    uPartMid,
    stableGroundTopY,
    barnUpperTopY,
    3.554,
    vEastRangeSouth - wallT - 0.002,
    ['-x', '+z', '-z'],
    settingPlasterMat,
    settingPlasterMat
  );
  addOutbuildingBrickWall(
    firstFloorGroup,
    uPartMid,
    uBarnEnd,
    stableGroundTopY,
    stableUpperTopY,
    vEastRangeNorth + wallT + 0.002,
    2.554,
    ['+x', '-x', '+z', '-z'],
    cromartyWallMat,
    cromartyWallMat
  );
  addOutbuildingBrickWall(
    firstFloorGroup,
    uPartMid,
    uBarnEnd,
    stableGroundTopY,
    stableUpperTopY,
    3.554,
    vEastRangeSouth - wallT - 0.002,
    ['+x', '-x', '+z', '-z'],
    cromartyWallMat,
    cromartyWallMat
  );
  // Issue #1 ("Make this a full height entrance" at `[0.883, 2.92, 16.92]`, `outbuildings.firstFloor.stableUpStairs`) &
  // Issue #4 ("Could the bannisters here not be merged somehow? Rather than this akward gap between the 2"):
  // Full-height doorway entrance (`portalTopY = stableUpperFloorY + 2.00 = 4.08m`) across `v = 2.554..3.554m`.
  // Issue #10 ("I can see some wall inside the door" at `[0.859, 3.798, 17.387]`, `outbuildings.barnStablePartitionGable`):
  // Previously `stableEntrancePortalTopY = 4.08m` was above the Barn roof slope at the South doorway jamb (`v = 3.554m`,
  // where `ySlope = 3.9025m`), causing the 7-vertex non-convex gable polygon to self-intersect and triangulate wall faces
  // right across the doorway opening!
  // Setting `stableEntrancePortalTopY = 3.86m` (`1.78m` above `2.08m` Stable floor, `2.32m` above `1.54m` Mezzanine floor)
  // keeps the doorway lintel strictly below the Barn vaulted ceiling at `v = 3.554m`, AND splitting the gable into
  // 3 strictly convex sub-polygons (North wing, Over-Door header, South wing) guarantees zero wall inside the door!
  const stableEntrancePortalTopY = 3.86;
  {
    const addGableWithPortalCutout = (
      uMinG: number,
      uMaxG: number,
      yBaseG: number,
      ceilRidgeY: number,
      meshName: string,
      gableMat: THREE.Material = settingPlasterMat
    ): void => {
      const vMinG = vInnerNorth + 0.002;
      const vMaxG = vInnerSouth - 0.002;
      const vMidG = (vMinG + vMaxG) * 0.5; // 2.855m
      const halfSpanG = (vMaxG - vMinG) * 0.5; // 2.573m
      const doorV0 = 2.554 - vMidG; // -0.301m
      const doorV1 = 3.554 - vMidG; // +0.699m
      const uSpan = uMaxG - uMinG;

      const ySlopeAt = (dv: number): number =>
        ceilRidgeY - (Math.abs(dv) / halfSpanG) * (ceilRidgeY - yBaseG);

      const ySlopeDoor0 = ySlopeAt(doorV0);
      const ySlopeDoor1 = ySlopeAt(doorV1);

      // 1. North Convex Wing (`[-halfSpanG .. doorV0]`)
      const northWingGeo = createExtrudedVYPolygon(
        [
          [-halfSpanG, yBaseG],
          [doorV0, yBaseG],
          [doorV0, ySlopeDoor0],
        ],
        uSpan
      );
      const northWingMesh = new THREE.Mesh(northWingGeo, gableMat);
      northWingMesh.name = meshName;
      northWingMesh.userData.isArchitecturalShell = true;
      northWingMesh.position.set(uMinG, 0, vMidG);
      northWingMesh.castShadow = true;
      northWingMesh.receiveShadow = true;
      firstFloorGroup.add(northWingMesh);

      // 2. Center Over-Door Convex Pentagon (`[doorV0 .. doorV1]`, strictly above `stableEntrancePortalTopY`)
      const overDoorGeo = createExtrudedVYPolygon(
        [
          [doorV0, stableEntrancePortalTopY],
          [doorV1, stableEntrancePortalTopY],
          [doorV1, ySlopeDoor1],
          [0, ceilRidgeY],
          [doorV0, ySlopeDoor0],
        ],
        uSpan
      );
      const overDoorMesh = new THREE.Mesh(overDoorGeo, gableMat);
      overDoorMesh.name = `${meshName}.overDoorHeader`;
      overDoorMesh.userData.isArchitecturalShell = true;
      overDoorMesh.position.set(uMinG, 0, vMidG);
      overDoorMesh.castShadow = true;
      overDoorMesh.receiveShadow = true;
      firstFloorGroup.add(overDoorMesh);

      // 3. South Convex Wing (`[doorV1 .. +halfSpanG]`)
      const southWingGeo = createExtrudedVYPolygon(
        [
          [doorV1, yBaseG],
          [halfSpanG, yBaseG],
          [doorV1, ySlopeDoor1],
        ],
        uSpan
      );
      const southWingMesh = new THREE.Mesh(southWingGeo, gableMat);
      southWingMesh.name = `${meshName}.southWing`;
      southWingMesh.userData.isArchitecturalShell = true;
      southWingMesh.position.set(uMinG, 0, vMidG);
      southWingMesh.castShadow = true;
      southWingMesh.receiveShadow = true;
      firstFloorGroup.add(southWingMesh);
    };

    addGableWithPortalCutout(
      uBarnEnd - partT,
      uPartMid + 0.005,
      barnCeilEaveY,
      barnCeilRidgeY,
      'outbuildings.barnStablePartitionGable',
      settingPlasterMat
    );
    addGableWithPortalCutout(
      uPartMid,
      uBarnEnd + 0.005,
      stableCeilEaveY,
      stableCeilRidgeY,
      'outbuildings.stable.westGableInteriorPlaster',
      cromartyWallMat
    );
  }

  // Batch 2 Issue #1 ("Color drenched same as wall baseboards in here" at `[2.01, 2.244, 14.178]`):
  // Add matching colour-drenched Setting Plaster baseboards (`145mm` high x `18mm` projection) along the Barn Mezzanine
  // 1st-floor walls (`u = 18.68..23.02m`) at `y = mezzanineFloorY = 1.54m`!
  {
    const mezzBaseboardGroup = new THREE.Group();
    mezzBaseboardGroup.name = 'outbuildings.firstFloor.mezzanine.baseboards';
    mezzBaseboardGroup.userData.zone = 'courtyard';
    firstFloorGroup.add(mezzBaseboardGroup);

    const mBaseH = 0.145;
    const mBaseT = 0.018;
    const mBeadR = 0.008;
    const addMezzBaseboardRun = (
      x0: number,
      z0: number,
      x1: number,
      z1: number,
      inwardNormalX: number,
      inwardNormalZ: number,
      runId: string
    ): void => {
      const len = Math.hypot(x1 - x0, z1 - z0);
      if (len <= 0.02) return;
      const alongZ = Math.abs(z1 - z0) > Math.abs(x1 - x0);
      const midX = (x0 + x1) * 0.5 + inwardNormalX * (mBaseT * 0.5);
      const midZ = (z0 + z1) * 0.5 + inwardNormalZ * (mBaseT * 0.5);

      const board = new THREE.Mesh(
        new THREE.BoxGeometry(alongZ ? mBaseT : len, mBaseH, alongZ ? len : mBaseT),
        settingPlasterMat
      );
      board.name = `outbuildings.firstFloor.mezzanine.baseboard.${runId}`;
      board.position.set(midX, mezzanineFloorY + mBaseH * 0.5, midZ);
      board.castShadow = true;
      board.receiveShadow = true;
      mezzBaseboardGroup.add(board);

      const bead = new THREE.Mesh(
        new THREE.CylinderGeometry(mBeadR, mBeadR, len, 12),
        settingPlasterMat
      );
      bead.name = `outbuildings.firstFloor.mezzanine.baseboardBead.${runId}`;
      if (alongZ) {
        bead.rotation.x = Math.PI / 2;
      } else {
        bead.rotation.z = Math.PI / 2;
      }
      bead.position.set(
        (x0 + x1) * 0.5 + inwardNormalX * (mBaseT - mBeadR * 0.4),
        mezzanineFloorY + mBaseH + mBeadR * 0.35,
        (z0 + z1) * 0.5 + inwardNormalZ * (mBaseT - mBeadR * 0.4)
      );
      mezzBaseboardGroup.add(bead);
    };

    // North Mezzanine Wall (`v = 0.28m, u = 18.68..23.02m`)
    addMezzBaseboardRun(uMezzanineFront, vInnerNorth, uBarnEnd - partT, vInnerNorth, 0, 1, 'northWall');
    // South Mezzanine Wall West of Stairwell (`v = 5.43m, u = 18.68..21.14m`)
    addMezzBaseboardRun(uMezzanineFront, vInnerSouth, 21.14, vInnerSouth, 0, -1, 'southWall');
    // East Mezzanine Partition Wall North of Stair Flight (`u = 23.02m, v = 0.28..2.54m`)
    addMezzBaseboardRun(uBarnEnd - partT, vInnerNorth + 0.018, uBarnEnd - partT, 2.54, -1, 0, 'eastWallNorth');
  }

  // Issue #5 ("Missing baseboard (same color as walls in barn)" at `[-4.823, -0.187, 14.765]`):
  // Add colour-drenched Setting Plaster baseboards (`145mm` high x `18mm` projection with top torus bead)
  // along all Barn Ground-Floor walls (`outbuildings.barn.baseboards`) on `groundGroup`!
  {
    const barnBaseboardGroup = new THREE.Group();
    barnBaseboardGroup.name = 'outbuildings.barn.baseboards';
    barnBaseboardGroup.userData.zone = 'courtyard';
    groundGroup.add(barnBaseboardGroup);

    const bBaseH = 0.145;
    const bBaseT = 0.018;
    const bBeadR = 0.008;
    const addBarnGroundBaseboardRun = (
      x0: number,
      z0: number,
      x1: number,
      z1: number,
      floorBaseY: number,
      inwardNormalX: number,
      inwardNormalZ: number,
      runId: string
    ): void => {
      const len = Math.hypot(x1 - x0, z1 - z0);
      if (len <= 0.02) return;
      const alongZ = Math.abs(z1 - z0) > Math.abs(x1 - x0);
      const midX = (x0 + x1) * 0.5 + inwardNormalX * (bBaseT * 0.5);
      const midZ = (z0 + z1) * 0.5 + inwardNormalZ * (bBaseT * 0.5);

      const board = new THREE.Mesh(
        new THREE.BoxGeometry(alongZ ? bBaseT : len, bBaseH, alongZ ? len : bBaseT),
        settingPlasterMat
      );
      board.name = `outbuildings.barn.baseboard.${runId}`;
      board.position.set(midX, floorBaseY + bBaseH * 0.5, midZ);
      board.castShadow = true;
      board.receiveShadow = true;
      barnBaseboardGroup.add(board);

      const bead = new THREE.Mesh(
        new THREE.CylinderGeometry(bBeadR, bBeadR, len, 12),
        settingPlasterMat
      );
      bead.name = `outbuildings.barn.baseboard.${runId}.bead`;
      if (alongZ) {
        bead.rotation.x = Math.PI / 2;
      } else {
        bead.rotation.z = Math.PI / 2;
      }
      bead.position.set(
        midX + inwardNormalX * (bBaseT * 0.25),
        floorBaseY + bBaseH + bBeadR * 0.35,
        midZ + inwardNormalZ * (bBaseT * 0.25)
      );
      barnBaseboardGroup.add(bead);
    };

    // 1. West Limestone Barn Bay & Continuous North Corridor (`y = barnWestFloorY = -0.34m`, `u = 12.315..18.18m`):
    //    - Issue #2 ("and here remove this, skrting runs all the way along the corridor"):
    //      Removed `westPartitionNorth` from the open corridor entrance and extended the North wall skirting
    //      all the way along the North Corridor (`u = 13.78..15.80m` East of Store Courtyard Door, and `12.315..12.82m` West of Store Courtyard Door)!
    addBarnGroundBaseboardRun(12.315, vInnerNorth, 12.82, vInnerNorth, barnWestFloorY, 0, 1, 'corridorNorthWest');
    addBarnGroundBaseboardRun(13.78, vInnerNorth, 15.80, vInnerNorth, barnWestFloorY, 0, 1, 'westNorthLeft');
    //    - North Courtyard Wall East of Barn Courtyard Door (`u = 16.90..18.18m` — exact hit point `[-4.823, -0.187, 14.765]`!)
    addBarnGroundBaseboardRun(16.90, vInnerNorth, 18.18, vInnerNorth, barnWestFloorY, 0, 1, 'westNorthRight');
    //    - Issue #1 ("this edge looksa. mess, lots of dithering, poor mitering on the skirting too" at `[-7.236, 1.902, 15.977]`):
    //      Build `corridorSouth` (`u = 12.315..15.180m, v = 1.240m`) and `westPartitionCenter` (`u = 15.180m, v = 1.240..1.330m`)
    //      with a true 45°-mitred external corner joint from `(15.180, 1.240)` to `(15.198, 1.222)` and continuous top torus beads
    //      meeting at the exact corner vertex `(15.1935, 1.2265)`!
    {
      const createMitredSkirtingPrism = (ptsXZ: ReadonlyArray<readonly [number, number]>): THREE.BufferGeometry => {
        const shape = new THREE.Shape();
        shape.moveTo(ptsXZ[0]![0], -ptsXZ[0]![1]);
        for (let i = 1; i < ptsXZ.length; i++) {
          shape.lineTo(ptsXZ[i]![0], -ptsXZ[i]![1]);
        }
        shape.closePath();
        const geo = new THREE.ExtrudeGeometry(shape, { depth: bBaseH, bevelEnabled: false });
        geo.rotateX(-Math.PI / 2);
        geo.computeVertexNormals();
        return geo;
      };

      const cornerU = 15.18;
      const cornerV = 1.24;
      const southEndV = 1.33;
      const beadOff = bBaseT * 0.75; // 0.0135m
      const beadY = barnWestFloorY + bBaseH + bBeadR * 0.35;
      const beadCornerU = cornerU + beadOff; // 15.1935m
      const beadCornerV = cornerV - beadOff; // 1.2265m

      // 1. 45°-mitred `corridorSouth` skirting board (`u = 12.315..15.198m, v = 1.222..1.240m`)
      const corridorSouthBoard = new THREE.Mesh(
        createMitredSkirtingPrism([
          [12.315, cornerV],
          [cornerU, cornerV],
          [cornerU + bBaseT, cornerV - bBaseT],
          [12.315, cornerV - bBaseT],
        ]),
        settingPlasterMat
      );
      corridorSouthBoard.name = 'outbuildings.barn.baseboard.corridorSouth';
      corridorSouthBoard.position.y = barnWestFloorY;
      corridorSouthBoard.castShadow = true;
      corridorSouthBoard.receiveShadow = true;
      barnBaseboardGroup.add(corridorSouthBoard);

      const csBeadLen = beadCornerU - 12.315;
      const csBead = new THREE.Mesh(
        new THREE.CylinderGeometry(bBeadR, bBeadR, csBeadLen, 12),
        settingPlasterMat
      );
      csBead.name = 'outbuildings.barn.baseboard.corridorSouth.bead';
      csBead.rotation.z = Math.PI / 2;
      csBead.position.set(12.315 + csBeadLen * 0.5, beadY, beadCornerV);
      barnBaseboardGroup.add(csBead);

      // 2. 45°-mitred `westPartitionCenter` skirting return (`u = 15.180..15.198m, v = 1.222..1.330m`)
      const westPartCenterBoard = new THREE.Mesh(
        createMitredSkirtingPrism([
          [cornerU, cornerV],
          [cornerU, southEndV],
          [cornerU + bBaseT, southEndV],
          [cornerU + bBaseT, cornerV - bBaseT],
        ]),
        settingPlasterMat
      );
      westPartCenterBoard.name = 'outbuildings.barn.baseboard.westPartitionCenter';
      westPartCenterBoard.position.y = barnWestFloorY;
      westPartCenterBoard.castShadow = true;
      westPartCenterBoard.receiveShadow = true;
      barnBaseboardGroup.add(westPartCenterBoard);

      const wpcBeadLen = southEndV - beadCornerV;
      const wpcBead = new THREE.Mesh(
        new THREE.CylinderGeometry(bBeadR, bBeadR, wpcBeadLen, 12),
        settingPlasterMat
      );
      wpcBead.name = 'outbuildings.barn.baseboard.westPartitionCenter.bead';
      wpcBead.rotation.x = Math.PI / 2;
      wpcBead.position.set(beadCornerU, beadY, (beadCornerV + southEndV) * 0.5);
      barnBaseboardGroup.add(wpcBead);

      const cornerMitreBead = new THREE.Mesh(
        new THREE.SphereGeometry(bBeadR, 14, 14),
        settingPlasterMat
      );
      cornerMitreBead.name = 'outbuildings.barn.baseboard.westPartitionCenter.cornerMitre';
      cornerMitreBead.position.set(beadCornerU, beadY, beadCornerV);
      barnBaseboardGroup.add(cornerMitreBead);
    }
    //    - South Wall between Golf Simulator (`u = 15.20m`) and Golf Viewing Bar (`u = 18.18m`)
    addBarnGroundBaseboardRun(uBarnStart + 0.24, vInnerSouth, 18.18, vInnerSouth, barnWestFloorY, 0, -1, 'westSouth');

    // 2. Middle Limestone Step Landing (`u = 18.18..18.46m, y = -0.5075m`):
    addBarnGroundBaseboardRun(18.18, vInnerNorth, 18.46, vInnerNorth, -0.5075, 0, 1, 'midStepNorth');

    // 3. East Lower Barn under Mezzanine (`y = barnCarpetTopY = -0.675m`, `u = 18.46..23.02m`):
    //    - North Wall & North Pilaster (`u = 18.53..18.83m, v = 0.28..0.44m`)
    addBarnGroundBaseboardRun(18.46, vInnerNorth, 18.53, vInnerNorth, barnCarpetTopY, 0, 1, 'eastNorthPrePilaster');
    addBarnGroundBaseboardRun(18.53, vInnerNorth, 18.53, vInnerNorth + 0.16, barnCarpetTopY, -1, 0, 'northPilasterWest');
    addBarnGroundBaseboardRun(18.53, vInnerNorth + 0.16, 18.83, vInnerNorth + 0.16, barnCarpetTopY, 0, 1, 'northPilasterFront');
    addBarnGroundBaseboardRun(18.83, vInnerNorth, 18.83, vInnerNorth + 0.16, barnCarpetTopY, 1, 0, 'northPilasterEast');
    addBarnGroundBaseboardRun(18.83, vInnerNorth, uBarnEnd - partT, vInnerNorth, barnCarpetTopY, 0, 1, 'eastNorthMain');

    //    - South Wall & South Pilaster (`u = 18.53..18.83m, v = 5.27..5.43m`)
    addBarnGroundBaseboardRun(18.53, vInnerSouth - 0.16, 18.83, vInnerSouth - 0.16, barnCarpetTopY, 0, -1, 'southPilasterFront');
    addBarnGroundBaseboardRun(18.83, vInnerSouth - 0.16, 18.83, vInnerSouth, barnCarpetTopY, 1, 0, 'southPilasterEast');
    addBarnGroundBaseboardRun(18.83, vInnerSouth, uBarnEnd - partT, vInnerSouth, barnCarpetTopY, 0, -1, 'eastSouthMain');

    //    - East Barn/Stable Partition Wall (`u = 23.02m`) North & South of the Stable Glass Door (`v = 1.96..2.86m`)
    addBarnGroundBaseboardRun(uBarnEnd - partT, vInnerNorth, uBarnEnd - partT, 1.94, barnCarpetTopY, -1, 0, 'eastPartitionNorth');
    addBarnGroundBaseboardRun(uBarnEnd - partT, 2.88, uBarnEnd - partT, vInnerSouth, barnCarpetTopY, -1, 0, 'eastPartitionSouth');
  }

  // Issue #3 ("Bullnose these stairs correctly and improve the general carpentry" at `[0.471, 1.9, 16.881]`, `outbuildings.firstFloor.stableUpStep.2`):
  // Bespoke 3-Step Bullnose Light-Oak Staircase & Doorway Joinery Assembly (`outbuildings.firstFloor.stableUpStairs`)
  // connecting the Barn Mezzanine (`mezzanineFloorY = 1.54m`) up to the Stable Upper Room (`stableUpperFloorY = 2.08m`):
  // - Closed solid light-oak side stringer boards (`28mm` thick at `v = 2.414m` & `v = 3.286m`) with raked top moulding caps & bottom newel stops
  // - Recessed painted/oak vertical risers (`18mm` thick) under each step and under the top landing threshold (`u = 23.02m`)
  // - Overhanging solid light-oak treads (`30mm` thick, `22mm` projection) with **half-round cylindrical bullnose leading edges**,
  //   return bullnose end caps, scotia cove mouldings underneath each nosing, and world-space oak UVs (`uvScale = 0.5`)
  // - 4th bullnose light-oak top landing threshold nosing (`outbuildings.firstFloor.stableUpStep.topNosing`) at `u = 23.02m, y = 2.08m`
  // - Moulded light-oak doorway jamb linings, head lining, and chamfered architraves framing the `v = 2.40..3.30m` opening!
  {
    const upStairsGroup = new THREE.Group();
    upStairsGroup.name = 'outbuildings.firstFloor.stableUpStairs';
    firstFloorGroup.add(upStairsGroup);

    // Issue #8 ("Make these stairs more coherant witht he spiral" at `[0.213, 1.739, 16.929]`):
    // Upgraded `outbuildings.firstFloor.stableUpStairs` to an Open-Riser Solid American White Oak,
    // Toughened Glass & Brushed Stainless-Clamp 3-Step Feature Flight matching the Haldane UK Spiral Staircase:
    // - Open risers (no solid plaster carcass block or white painted risers) with `36mm` thick solid oak bullnose treads
    // - Turned cylindrical solid-oak central support pedestals & raked central oak spine beam underneath the treads
    // - Laminated solid-oak raked side stringers (`lightJoineryOakPostMat`) with rounded top & bottom edge beads
    // - Turned cylindrical solid-oak newel posts (`r = 0.036m`) with spherical oak finial caps (`r = 0.044m`)
    // - Raked cylindrical solid-oak handrails (`r = 0.026m`) and raked toughened glass banister panels with
    //   brushed stainless-steel stand-off spigot clamps!
    const numUpSteps = 3;
    const upRiseTotal = stableUpperFloorY - mezzanineFloorY; // 0.54m
    const stepRiserH = upRiseTotal / numUpSteps; // 0.18m per step
    const stepGoingU = 0.25; // 250mm going per tread
    const treadT = 0.036; // 36mm thick solid American white oak tread matching spiral staircase
    const bullnoseR = treadT * 0.5; // 18mm half-round bullnose radius
    const nosingOverhangU = 0.026; // 26mm overhanging bullnose nosing
    const stringerT = 0.028; // 28mm thick laminated solid-oak side stringer ribbons
    // Issue #4: `stairOpeningW = 1.00m` centered at `stairCenterV = 3.054m` (`v = 2.554..3.554m`)
    // so the South stringer & banister lie at `sv = 3.054 + (0.50 - 0.014) = 3.54m`, merging directly into the stairwell guardrail!
    const stairOpeningW = 1.0; // v = 2.554m..3.554m
    const stairCenterV = 3.054;
    const treadClearW = stairOpeningW - stringerT * 2; // 0.844m clear tread width between oak side stringers
    const upFlightEndU = uBarnEnd - partT; // 23.02m (West face of Barn/Stable partition wall)
    const upStartU = upFlightEndU - numUpSteps * stepGoingU; // 22.27m

    const stainlessClampMat = new THREE.MeshStandardMaterial({
      color: 0xd8dde4,
      roughness: 0.2,
      metalness: 0.9,
    });

    // Central raked solid-oak spine stringer beam + turned oak support drums under each open-riser tread
    const stringerPitchAngle = Math.atan2(upRiseTotal, numUpSteps * stepGoingU); // ~35.75°
    const stringerDiagLen = Math.hypot(numUpSteps * stepGoingU, upRiseTotal) + 0.06;

    const centerSpineBeam = new THREE.Mesh(
      new THREE.BoxGeometry(stringerDiagLen, 0.095, 0.085),
      lightJoineryOakPostMat
    );
    centerSpineBeam.name = 'outbuildings.firstFloor.stableUpStairs.centerSpine';
    centerSpineBeam.position.set(
      upStartU + (numUpSteps * stepGoingU) * 0.5 + 0.02,
      mezzanineFloorY + upRiseTotal * 0.5 - 0.06,
      stairCenterV
    );
    centerSpineBeam.rotation.z = stringerPitchAngle;
    centerSpineBeam.castShadow = true;
    upStairsGroup.add(centerSpineBeam);

    for (let s = 0; s < numUpSteps; s++) {
      const stepTopY = mezzanineFloorY + (s + 1) * stepRiserH;
      const riserFrontU = upStartU + s * stepGoingU;
      const stepBackU = riserFrontU + stepGoingU;

      // 1. Turned Solid-Oak Cylindrical Support Pedestal Drum under center of each open-riser tread (matching spiral center column!)
      const drumH = stepRiserH - treadT + 0.04;
      const supportDrum = new THREE.Mesh(
        new THREE.CylinderGeometry(0.056, 0.056, drumH, 20),
        lightJoineryOakPostMat
      );
      supportDrum.name = `outbuildings.firstFloor.stableUpStep.supportDrum.${s + 1}`;
      supportDrum.position.set(
        riserFrontU + stepGoingU * 0.48,
        stepTopY - treadT - drumH * 0.5 + 0.01,
        stairCenterV
      );
      supportDrum.castShadow = true;
      upStairsGroup.add(supportDrum);

      // 2. Overhanging Solid American White Oak Tread Board (`outbuildings.firstFloor.stableUpStep.1..3`) with world-space oak UVs
      const treadFlatDepthU = stepGoingU + nosingOverhangU - bullnoseR;
      const treadFlatCenterU = stepBackU - treadFlatDepthU * 0.5;
      const treadCenterY = stepTopY - treadT * 0.5;
      const treadWidthV = treadClearW;

      const treadGeo = new THREE.BoxGeometry(treadFlatDepthU, treadT, treadWidthV);
      applyOutbuildingFloorUVs(treadGeo, treadFlatCenterU, treadCenterY, stairCenterV, 0.5);
      const treadMesh = new THREE.Mesh(treadGeo, lightJoineryOakMat);
      treadMesh.name = `outbuildings.firstFloor.stableUpStep.${s + 1}`;
      treadMesh.position.set(treadFlatCenterU, treadCenterY, stairCenterV);
      treadMesh.castShadow = true;
      treadMesh.receiveShadow = true;
      firstFloorGroup.add(treadMesh);

      // 3. Rounded Half-Round Cylindrical Bullnose Leading Edge (`CylinderGeometry` along `Z` at `-u` leading edge)
      const bullnoseCenterU = riserFrontU - nosingOverhangU + bullnoseR;
      const bullnoseCyl = new THREE.Mesh(
        new THREE.CylinderGeometry(bullnoseR, bullnoseR, treadWidthV, 18),
        lightJoineryOakMat
      );
      bullnoseCyl.name = `outbuildings.firstFloor.stableUpStep.${s + 1}`;
      bullnoseCyl.rotation.x = Math.PI / 2;
      bullnoseCyl.position.set(bullnoseCenterU, treadCenterY, stairCenterV);
      bullnoseCyl.castShadow = true;
      bullnoseCyl.receiveShadow = true;
      upStairsGroup.add(bullnoseCyl);

      // 4. Tapered solid-oak under-tread rib bracket (`0.18m x 0.028m x 0.68m`) matching `spiralStaircase.tread` spine ribs!
      const underRib = new THREE.Mesh(
        new THREE.BoxGeometry(stepGoingU * 0.72, 0.026, treadWidthV - 0.06),
        lightJoineryOakPostMat
      );
      underRib.name = `outbuildings.firstFloor.stableUpStep.${s + 1}.underRib`;
      underRib.position.set(
        treadFlatCenterU,
        stepTopY - treadT - 0.013,
        stairCenterV
      );
      upStairsGroup.add(underRib);
    }

    // 5. Top Threshold Solid-Oak Fascia & 4th Bullnose Light-Oak Threshold Nosing at `u = 23.02m, y = stableUpperFloorY = 2.08m`
    const topFasciaH = stableUpperFloorY - mezzanineFloorY - treadT;
    const topFasciaGeo = new THREE.BoxGeometry(0.022, topFasciaH, stairOpeningW);
    applyOutbuildingFloorUVs(topFasciaGeo, upFlightEndU - 0.05, mezzanineFloorY + topFasciaH * 0.5, stairCenterV, 0.5);
    const topOakFascia = new THREE.Mesh(topFasciaGeo, lightJoineryOakMat);
    topOakFascia.name = 'outbuildings.firstFloor.stableUpStep.topFascia';
    topOakFascia.position.set(
      upFlightEndU - 0.05,
      mezzanineFloorY + topFasciaH * 0.5,
      stairCenterV
    );
    topOakFascia.castShadow = true;
    upStairsGroup.add(topOakFascia);

    const topNosingDepthU = partT + 0.036;
    const topNosingGeo = new THREE.BoxGeometry(topNosingDepthU, treadT, treadClearW);
    applyOutbuildingFloorUVs(
      topNosingGeo,
      upFlightEndU + partT * 0.5 - 0.006,
      stableUpperFloorY - treadT * 0.5 + 0.002,
      stairCenterV,
      0.5
    );
    const topNosingBoard = new THREE.Mesh(topNosingGeo, lightJoineryOakMat);
    topNosingBoard.name = 'outbuildings.firstFloor.stableUpStep.topNosing';
    topNosingBoard.position.set(
      upFlightEndU + partT * 0.5 - 0.006,
      stableUpperFloorY - treadT * 0.5 + 0.002,
      stairCenterV
    );
    topNosingBoard.castShadow = true;
    topNosingBoard.receiveShadow = true;
    upStairsGroup.add(topNosingBoard);

    const topBullnoseCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(bullnoseR, bullnoseR, treadClearW, 18),
      lightJoineryOakMat
    );
    topBullnoseCyl.name = 'outbuildings.firstFloor.stableUpStep.topNosing';
    topBullnoseCyl.rotation.x = Math.PI / 2;
    topBullnoseCyl.position.set(
      upFlightEndU - nosingOverhangU + bullnoseR,
      stableUpperFloorY - treadT * 0.5 + 0.002,
      stairCenterV
    );
    topBullnoseCyl.castShadow = true;
    upStairsGroup.add(topBullnoseCyl);

    // 6. Laminated Solid-Oak Side Stringer Ribbons (`v = 2.414m` & `v = 3.286m`), Turned Cylindrical Oak Newel Posts,
    //    Raked Cylindrical Oak Handrails & Toughened Glass Banister Panels with Stainless-Steel Clamps!
    for (const sideV of [-1, 1] as const) {
      const sv = stairCenterV + sideV * (stairOpeningW * 0.5 - stringerT * 0.5);

      // Raked laminated solid-oak outer stringer ribbon (matching `spiralStaircase.outerStringer`)
      const rakedStringerGeo = new THREE.BoxGeometry(stringerDiagLen, 0.19, stringerT);
      applyOutbuildingFloorUVs(
        rakedStringerGeo,
        upStartU + (numUpSteps * stepGoingU) * 0.5 - 0.01,
        mezzanineFloorY + upRiseTotal * 0.5 + 0.01,
        sv,
        0.5
      );
      const rakedStringer = new THREE.Mesh(
        rakedStringerGeo,
        lightJoineryOakPostMat
      );
      rakedStringer.name = 'outbuildings.firstFloor.stableUpStairs.stringer';
      rakedStringer.position.set(
        upStartU + (numUpSteps * stepGoingU) * 0.5 - 0.01,
        mezzanineFloorY + upRiseTotal * 0.5 + 0.01,
        sv
      );
      rakedStringer.rotation.z = stringerPitchAngle;
      rakedStringer.castShadow = true;
      rakedStringer.receiveShadow = true;
      upStairsGroup.add(rakedStringer);

      // Rounded top & bottom edge beads along the solid-oak stringer ribbon
      for (const beadOffsetY of [-0.095, 0.095] as const) {
        const edgeBead = new THREE.Mesh(
          new THREE.CylinderGeometry(0.011, 0.011, stringerDiagLen + 0.02, 12),
          lightJoineryOakMat
        );
        edgeBead.position.set(
          upStartU + (numUpSteps * stepGoingU) * 0.5 - 0.01,
          mezzanineFloorY + upRiseTotal * 0.5 + 0.01 + beadOffsetY,
          sv
        );
        edgeBead.name = `outbuildings.firstFloor.stableUpStairs.stringerBead.${sideV < 0 ? "north" : "south"}.${beadOffsetY < 0 ? "bottom" : "top"}`;
        edgeBead.userData.lodTier = 'high';
        edgeBead.rotation.z = stringerPitchAngle - Math.PI / 2;
        upStairsGroup.add(edgeBead);
      }

      // Turned cylindrical solid-oak bottom & top newel posts with spherical finial caps (matching `spiralStaircase.newelPost`)
      const botNewelU = upStartU - 0.03;
      const topNewelU = upFlightEndU - 0.04;
      const botNewelH = 0.92;
      const topNewelH = 0.92;

      for (const [nu, nBaseY, nH] of [
        [botNewelU, mezzanineFloorY, botNewelH],
        [topNewelU, stableUpperFloorY - 0.06, topNewelH],
      ] as const) {
        const newelCyl = new THREE.Mesh(
          new THREE.CylinderGeometry(0.034, 0.038, nH, 20),
          lightJoineryOakPostMat
        );
        newelCyl.name = 'outbuildings.firstFloor.stableUpStairs.newelPost';
        newelCyl.position.set(nu, nBaseY + nH * 0.5, sv);
        newelCyl.castShadow = true;
        upStairsGroup.add(newelCyl);

        const newelCap = new THREE.Mesh(
          new THREE.SphereGeometry(0.042, 16, 12),
          lightJoineryOakMat
        );
        newelCap.name = `outbuildings.firstFloor.stableUpStairs.newelCap.${sideV < 0 ? "north" : "south"}.${nu < 22.5 ? "bottom" : "top"}`;
        newelCap.userData.lodTier = 'high';
        newelCap.position.set(nu, nBaseY + nH + 0.014, sv);
        upStairsGroup.add(newelCap);
      }

      // Raked cylindrical solid-oak handrail (`r = 0.026m`) bridging between the bottom and top newel posts
      const railSpanU = topNewelU - botNewelU;
      const railRiseY = stableUpperFloorY - 0.06 - mezzanineFloorY;
      const railLen = Math.hypot(railSpanU, railRiseY);
      const railAngle = Math.atan2(railRiseY, railSpanU);

      const handrailCyl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.026, 0.026, railLen, 16),
        lightJoineryOakMat
      );
      handrailCyl.name = 'outbuildings.firstFloor.stableUpStairs.handrail';
      handrailCyl.position.set(
        (botNewelU + topNewelU) * 0.5,
        mezzanineFloorY + railRiseY * 0.5 + 0.86,
        sv
      );
      handrailCyl.rotation.z = railAngle - Math.PI / 2;
      handrailCyl.castShadow = true;
      upStairsGroup.add(handrailCyl);

      // Raked Toughened Glass Banister Panel & Brushed Stainless-Steel Cylindrical Stand-Off Clamps
      const glassPanel = new THREE.Mesh(
        new THREE.BoxGeometry(railLen - 0.09, 0.64, 0.014),
        windowGlassMat
      );
      glassPanel.name = 'outbuildings.firstFloor.stableUpStairs.glassBanister';
      glassPanel.position.set(
        (botNewelU + topNewelU) * 0.5,
        mezzanineFloorY + railRiseY * 0.5 + 0.48,
        sv
      );
      glassPanel.rotation.z = railAngle;
      upStairsGroup.add(glassPanel);

      for (const clampFrac of [0.22, 0.78] as const) {
        const cu = botNewelU + clampFrac * railSpanU;
        const cyBase = mezzanineFloorY + clampFrac * railRiseY;
        for (const cyOff of [0.16, 0.76] as const) {
          const clamp = new THREE.Mesh(
            new THREE.CylinderGeometry(0.014, 0.014, 0.032, 12),
            stainlessClampMat
          );
          clamp.name = `outbuildings.firstFloor.stableUpStairs.glassClamp.${sideV < 0 ? "north" : "south"}.${clampFrac < 0.5 ? "lower" : "upper"}.${cyOff < 0.5 ? "bottom" : "top"}`;
          clamp.userData.lodTier = 'high';
          clamp.rotation.x = Math.PI / 2;
          clamp.position.set(cu, cyBase + cyOff, sv);
          upStairsGroup.add(clamp);
        }
      }
    }

    // 8. Issue #1 ("Make this a full height entrance" at `[0.883, 2.92, 16.92]`):
    //    Full-Height (`2.00m` clear height above `stableUpperFloorY = 2.08m`, reaching `stableEntrancePortalTopY = 4.08m`)
    //    Light-Oak Doorway Jamb Linings & Chamfered Architraves around the `u = 23.02..23.22m, v = 2.554..3.554m` Portal:
    //    Attached to `firstFloorGroup` so the West cross-wall and its full-height entrance doorway portal are full-height in Cutaway Mode!
    const lowerJambH = barnUpperTopY - stableUpperFloorY; // 0.84m (up to 2.92m Barn cutaway eave line)
    const upperJambH = stableEntrancePortalTopY - barnUpperTopY; // 1.16m (from 2.92m eave line up to 4.08m full-height lintel)
    const jambT = 0.026;
    const archW = 0.058;
    const archT = 0.016;
    const doorUMid = uBarnEnd - partT * 0.5; // 23.12m

    const upperPortalGroup = new THREE.Group();
    upperPortalGroup.name = 'outbuildings.roof.stableEntranceUpperPortal';
    firstFloorGroup.add(upperPortalGroup);

    for (const sideV of [-1, 1] as const) {
      const vz = stairCenterV + sideV * (stairOpeningW * 0.5 - jambT * 0.5);
      const lowerJamb = new THREE.Mesh(
        new THREE.BoxGeometry(partT + 0.008, lowerJambH, jambT),
        lightJoineryOakMat
      );
      lowerJamb.name = `outbuildings.firstFloor.stableEntrancePortal.lowerJamb.${sideV < 0 ? "north" : "south"}`;
      lowerJamb.position.set(doorUMid, stableUpperFloorY + lowerJambH * 0.5, vz);
      lowerJamb.castShadow = true;
      upStairsGroup.add(lowerJamb);

      const upperJamb = new THREE.Mesh(
        new THREE.BoxGeometry(partT + 0.008, upperJambH, jambT),
        lightJoineryOakMat
      );
      upperJamb.name = `outbuildings.roof.stableEntranceUpperPortal.upperJamb.${sideV < 0 ? "north" : "south"}`;
      upperJamb.position.set(doorUMid, barnUpperTopY + upperJambH * 0.5, vz);
      upperJamb.castShadow = true;
      upperPortalGroup.add(upperJamb);
    }

    const portalHead = new THREE.Mesh(
      new THREE.BoxGeometry(partT + 0.008, jambT, stairOpeningW),
      lightJoineryOakMat
    );
    portalHead.name = 'outbuildings.roof.stableEntranceUpperPortal.headLining';
    portalHead.position.set(doorUMid, stableEntrancePortalTopY - jambT * 0.5, stairCenterV);
    upperPortalGroup.add(portalHead);

    for (const sideU of [-1, 1] as const) {
      const uFace = doorUMid + sideU * (partT * 0.5 + archT * 0.5);
      const splitTopY = sideU < 0 ? barnUpperTopY : stableUpperTopY;
      const legBottomY = sideU < 0 ? mezzanineFloorY + 0.14 : stableUpperFloorY;
      const lowerLegH = splitTopY - legBottomY;
      const upperLegH = stableEntrancePortalTopY - splitTopY + archW;
      for (const sideV of [-1, 1] as const) {
        const vz = stairCenterV + sideV * (stairOpeningW * 0.5 + archW * 0.5 - 0.01);
        const lowerArchLeg = new THREE.Mesh(
          new THREE.BoxGeometry(archT, lowerLegH, archW),
          lightJoineryOakPostMat
        );
        lowerArchLeg.name = `outbuildings.firstFloor.stableEntrancePortal.lowerArchitraveLeg.${sideU < 0 ? "west" : "east"}.${sideV < 0 ? "north" : "south"}`;
        lowerArchLeg.position.set(uFace, legBottomY + lowerLegH * 0.5, vz);
        upStairsGroup.add(lowerArchLeg);

        const upperArchLeg = new THREE.Mesh(
          new THREE.BoxGeometry(archT, upperLegH, archW),
          lightJoineryOakPostMat
        );
        upperArchLeg.name = `outbuildings.roof.stableEntranceUpperPortal.upperArchitraveLeg.${sideU < 0 ? "west" : "east"}.${sideV < 0 ? "north" : "south"}`;
        upperArchLeg.position.set(uFace, splitTopY + upperLegH * 0.5, vz);
        upperPortalGroup.add(upperArchLeg);
      }
      const archHeader = new THREE.Mesh(
        new THREE.BoxGeometry(archT, archW, stairOpeningW + archW * 2 - 0.02),
        lightJoineryOakPostMat
      );
      archHeader.name = `outbuildings.roof.stableEntranceUpperPortal.architraveHeader.${sideU < 0 ? "west" : "east"}`;
      archHeader.position.set(uFace, stableEntrancePortalTopY + archW * 0.5 - 0.008, stairCenterV);
      upperPortalGroup.add(archHeader);
    }
  }

}
