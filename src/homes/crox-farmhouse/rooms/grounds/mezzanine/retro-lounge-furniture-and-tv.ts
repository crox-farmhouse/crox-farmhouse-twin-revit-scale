import * as THREE from 'three';
import {
  applyOakJoineryUVs,
  createCorduroyFabricTexture,
  createGeometricColourBlockRugTexture,
  createKnittedPouffeTexture,
  createLionKingTrinitronScreenTexture,
  createMonopolyBoardTexture,
  createPersianMedallionRugTexture,
  createSculptedBeanbagGeometry,
  createSheepskinFleeceTextures,
  createSolidWhiteOakJoineryTextures,
  createTapestryBeanbagTexture,
} from './mezzanine-shared-textures.ts';

export interface RetroLoungeMaterialsKit {
  readonly sbTopY: number;
  readonly teakMat: THREE.MeshStandardMaterial;
  readonly darkTeakMat: THREE.MeshStandardMaterial;
  readonly trinitronCharcoalMat: THREE.MeshStandardMaterial;
  readonly trinitronDarkGrilleMat: THREE.MeshStandardMaterial;
  readonly ps1GreyMat: THREE.MeshStandardMaterial;
  readonly ps1DarkGreyMat: THREE.MeshStandardMaterial;
  readonly cordBlackMat: THREE.MeshStandardMaterial;
  readonly silverBadgeMat: THREE.MeshStandardMaterial;
}

export function buildBarnMezzanineRetroFurnitureAndTv(
  loungeGroup: THREE.Group,
  mezzanineFloorY: number
): RetroLoungeMaterialsKit {
  // Issue #7 ("Lighter oak less mahogany more like white oak" + Reference Photo `media_1791202879638_22365d89.jpg`):
  // Hand-Rubbed Satin-Oiled Solid European White Oak Joinery (`roughness: 0.48`, `metalness: 0.03`, `bumpScale: 0.006`)
  const whiteOakTextures = createSolidWhiteOakJoineryTextures();
  const teakMat = new THREE.MeshStandardMaterial({
    color: 0xf7efe4,
    map: whiteOakTextures.colorMap,
    bumpMap: whiteOakTextures.bumpMap,
    bumpScale: 0.006,
    roughness: 0.48,
    metalness: 0.03,
  });
  const darkTeakMat = new THREE.MeshStandardMaterial({
    color: 0xdccab2,
    map: whiteOakTextures.colorMap,
    bumpMap: whiteOakTextures.bumpMap,
    bumpScale: 0.006,
    roughness: 0.52,
    metalness: 0.03,
  });
  const trinitronCharcoalMat = new THREE.MeshStandardMaterial({
    color: 0x22252a,
    roughness: 0.46,
    metalness: 0.14,
  });
  const trinitronDarkGrilleMat = new THREE.MeshStandardMaterial({
    color: 0x141619,
    roughness: 0.62,
    metalness: 0.18,
  });
  const ps1GreyMat = new THREE.MeshStandardMaterial({
    color: 0xa6aab2,
    roughness: 0.44,
    metalness: 0.08,
  });
  const ps1DarkGreyMat = new THREE.MeshStandardMaterial({
    color: 0x7c8088,
    roughness: 0.48,
    metalness: 0.1,
  });
  const cordBlackMat = new THREE.MeshStandardMaterial({
    color: 0x17191c,
    roughness: 0.55,
    metalness: 0.08,
  });
  const silverBadgeMat = new THREE.MeshStandardMaterial({
    color: 0xd8dde4,
    roughness: 0.22,
    metalness: 0.82,
  });

  // =========================================================================
  // 1. LAYERED VINTAGE RUGS ON THE MEZZANINE OAK FLOOR
  //    - Foreground Geometric Colour-Block Wool Rug (`u = 19.96m, v = 2.34m`)
  //    - Background Crimson & Navy Persian Medallion Rug (`u = 21.34m, v = 1.48m`)
  // =========================================================================
  const blockRugMat = new THREE.MeshStandardMaterial({
    map: createGeometricColourBlockRugTexture(),
    roughness: 0.88,
    metalness: 0.02,
  });
  const blockRug = new THREE.Mesh(
    new THREE.BoxGeometry(1.48, 0.012, 2.08),
    blockRugMat
  );
  blockRug.name = 'outbuildings.mezzanine.retroBlockRug';
  blockRug.position.set(19.96, mezzanineFloorY + 0.006, 2.34);
  blockRug.receiveShadow = true;
  loungeGroup.add(blockRug);

  const persianRugMat = new THREE.MeshStandardMaterial({
    map: createPersianMedallionRugTexture(),
    roughness: 0.86,
    metalness: 0.02,
  });
  const persianRug = new THREE.Mesh(
    new THREE.BoxGeometry(1.62, 0.01, 1.96),
    persianRugMat
  );
  persianRug.name = 'outbuildings.mezzanine.persianRug';
  persianRug.position.set(21.62, mezzanineFloorY + 0.005, 1.62);
  persianRug.receiveShadow = true;
  loungeGroup.add(persianRug);

  // =========================================================================
  // 2. MID-CENTURY SCULPTED SOLID WHITE OAK SIDEBOARD CREDENZA (`outbuildings.mezzanine.retroSideboard`)
  //    Backed against the Front Mezzanine Balustrade (`u = 19.16m, v = 2.38m`), facing East (`+u`)
  //    Reference Photo: `media_1791202879638_22365d89.jpg`
  //    - Hollow-fronted rounded-corner Y-Z stadium outer carcass frame (`1.56m` wide x `0.52m` high x `0.44m` deep)
  //      with `R = 0.076m` rounded top/bottom shoulders and chamfered front perimeter moulding
  //    - Dark recessed front shadow reveal cavity + solid oak internal divider stiles & drawer rails
  //    - 2 flush-inset rounded-outer-corner cupboard doors (vertical oak grain) with sculpted vertical timber pulls
  //    - 3 flush-inset central drawers (horizontal oak grain) with sculpted horizontal finger-lip bar pulls
  //    - Sculpted solid-oak underframe apron with 4 splayed tapered legs
  // =========================================================================
  const sideboardGroup = new THREE.Group();
  sideboardGroup.name = 'outbuildings.mezzanine.retroSideboard';
  sideboardGroup.position.set(19.16, mezzanineFloorY, 2.38);
  loungeGroup.add(sideboardGroup);

  const sbDepthU = 0.44;
  const sbTotalW = 1.56;
  const sbHalfW = sbTotalW * 0.5; // 0.78m
  const sbLegH = 0.22;
  const sbBodyH = 0.52;
  const sbHalfH = sbBodyH * 0.5; // 0.26m
  const sbBodyMidY = sbLegH + sbHalfH; // 0.48m
  const sbTopY = sbLegH + sbBodyH; // 0.74m
  const sbOuterCornerR = 0.076;
  const sbWallT = 0.026;
  const sbInnerHalfW = sbHalfW - sbWallT; // 0.754m
  const sbInnerHalfH = sbHalfH - sbWallT; // 0.234m
  const sbInnerCornerR = 0.052;

  const createRoundedRectPath = (
    halfW: number,
    halfH: number,
    rLeftTop: number,
    rLeftBot: number,
    rRightBot: number,
    rRightTop: number,
    isHole: boolean = false
  ): THREE.Shape | THREE.Path => {
    const path = isHole ? new THREE.Path() : new THREE.Shape();
    const segs = 14;
    // Counter-clockwise around (x, y)
    path.moveTo(-halfW + rLeftBot, -halfH);
    path.lineTo(halfW - rRightBot, -halfH);
    for (let s = 1; s <= segs; s++) {
      const a = -Math.PI * 0.5 + (s / segs) * (Math.PI * 0.5);
      path.lineTo(
        halfW - rRightBot + Math.cos(a) * rRightBot,
        -halfH + rRightBot + Math.sin(a) * rRightBot
      );
    }
    path.lineTo(halfW, halfH - rRightTop);
    for (let s = 1; s <= segs; s++) {
      const a = (s / segs) * (Math.PI * 0.5);
      path.lineTo(
        halfW - rRightTop + Math.cos(a) * rRightTop,
        halfH - rRightTop + Math.sin(a) * rRightTop
      );
    }
    path.lineTo(-halfW + rLeftTop, halfH);
    for (let s = 1; s <= segs; s++) {
      const a = Math.PI * 0.5 + (s / segs) * (Math.PI * 0.5);
      path.lineTo(
        -halfW + rLeftTop + Math.cos(a) * rLeftTop,
        halfH - rLeftTop + Math.sin(a) * rLeftTop
      );
    }
    path.lineTo(-halfW, -halfH + rLeftBot);
    for (let s = 1; s <= segs; s++) {
      const a = Math.PI + (s / segs) * (Math.PI * 0.5);
      path.lineTo(
        -halfW + rLeftBot + Math.cos(a) * rLeftBot,
        -halfH + rLeftBot + Math.sin(a) * rLeftBot
      );
    }
    path.closePath();
    return path;
  };

  // 1. Unified Hollow Rounded-Corner Solid Oak Outer Carcass Frame (zero cylinder/box overlap!)
  const carcassShape = createRoundedRectPath(
    sbHalfW,
    sbHalfH,
    sbOuterCornerR,
    sbOuterCornerR,
    sbOuterCornerR,
    sbOuterCornerR,
    false
  ) as THREE.Shape;
  const carcassHole = createRoundedRectPath(
    sbInnerHalfW,
    sbInnerHalfH,
    sbInnerCornerR,
    sbInnerCornerR,
    sbInnerCornerR,
    sbInnerCornerR,
    true
  );
  carcassShape.holes.push(carcassHole);

  const carcassExtrudeDepth = sbDepthU - 0.010;
  const carcassGeo = new THREE.ExtrudeGeometry(carcassShape, {
    depth: carcassExtrudeDepth,
    bevelEnabled: true,
    bevelThickness: 0.005,
    bevelSize: 0.005,
    bevelSegments: 4,
    curveSegments: 20,
  });
  carcassGeo.translate(0, 0, -carcassExtrudeDepth * 0.5);
  carcassGeo.rotateY(Math.PI / 2);
  // Compute continuous grain UVs: lengthwise along Z on top/bottom slabs, vertical along Y on rounded side walls
  {
    carcassGeo.computeVertexNormals();
    const pos = carcassGeo.attributes.position;
    const norm = carcassGeo.attributes.normal;
    const uv = carcassGeo.attributes.uv;
    if (pos && norm && uv) {
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const ny = Math.abs(norm.getY(i));
        const nz = Math.abs(norm.getZ(i));
        if (nz > ny && Math.abs(z) > sbHalfW - 0.12) {
          // Vertical grain on left/right side panels
          uv.setXY(i, y * 1.35 + 0.2, x * 1.5 + 0.5);
        } else {
          // Lengthwise grain along Z on top slab, bottom rail & front perimeter moulding
          uv.setXY(i, z * 0.85 + 0.5, (x + y) * 1.45 + 0.3);
        }
      }
      uv.needsUpdate = true;
    }
  }
  const sbCarcassMesh = new THREE.Mesh(carcassGeo, teakMat);
  sbCarcassMesh.name = 'outbuildings.mezzanine.retroSideboard.carcass';
  sbCarcassMesh.position.set(0, sbBodyMidY, 0);
  sbCarcassMesh.castShadow = true;
  sbCarcassMesh.receiveShadow = true;
  sideboardGroup.add(sbCarcassMesh);

  // 2. Solid Oak Rear Back Panel (`x = -0.218..+0.190m`) & Dark Shadow Reveal Cavity (`x = +0.194m`)
  const backPanelShape = createRoundedRectPath(
    sbInnerHalfW + 0.004,
    sbInnerHalfH + 0.004,
    sbInnerCornerR,
    sbInnerCornerR,
    sbInnerCornerR,
    sbInnerCornerR,
    false
  ) as THREE.Shape;
  const backPanelGeo = new THREE.ExtrudeGeometry(backPanelShape, {
    depth: sbDepthU - 0.032,
    bevelEnabled: false,
    curveSegments: 16,
  });
  backPanelGeo.translate(0, 0, -(sbDepthU - 0.032) * 0.5);
  backPanelGeo.rotateY(Math.PI / 2);
  applyOakJoineryUVs(backPanelGeo, 'z', 0.85, 1.35);
  const sbBackCoreMesh = new THREE.Mesh(backPanelGeo, darkTeakMat);
  sbBackCoreMesh.name = 'outbuildings.mezzanine.retroSideboard.backPanel';
  sbBackCoreMesh.position.set(-0.012, sbBodyMidY, 0);
  sbBackCoreMesh.castShadow = true;
  sbBackCoreMesh.receiveShadow = true;
  sideboardGroup.add(sbBackCoreMesh);

  const shadowCavityMat = new THREE.MeshStandardMaterial({
    color: 0x26190f,
    roughness: 0.88,
    metalness: 0.01,
  });
  const shadowCavityGeo = new THREE.ShapeGeometry(backPanelShape, 14);
  shadowCavityGeo.rotateY(Math.PI / 2);
  const shadowCavityMesh = new THREE.Mesh(shadowCavityGeo, shadowCavityMat);
  shadowCavityMesh.name = 'outbuildings.mezzanine.retroSideboard.shadowCavity';
  shadowCavityMesh.position.set(sbDepthU * 0.5 - 0.023, sbBodyMidY, 0);
  sideboardGroup.add(shadowCavityMesh);

  // 3. Internal Vertical Oak Divider Stiles (`z = ±0.236m`) & Horizontal Drawer Rails
  const dividerStileZ = 0.236;
  const dividerStileW = 0.018;
  for (const sideZ of [-1, 1] as const) {
    const stileGeo = applyOakJoineryUVs(
      new THREE.BoxGeometry(0.022, sbInnerHalfH * 2, dividerStileW),
      'y',
      1.35,
      1.6,
      sideZ * 0.17
    );
    const stileMesh = new THREE.Mesh(stileGeo, darkTeakMat);
    stileMesh.name = 'outbuildings.mezzanine.retroSideboard.dividerStile';
    stileMesh.position.set(sbDepthU * 0.5 - 0.015, sbBodyMidY, sideZ * dividerStileZ);
    sideboardGroup.add(stileMesh);
  }

  // 4. Flush-Inset Left & Right Cupboard Doors (rounded outer top/bottom corners matching carcass, vertical oak grain)
  //    In `rotateY(Math.PI / 2)`, `shapeX = -z`, so:
  //    - For the Left Door (`z in [-0.749, -0.250]`): `shapeX in [+0.250, +0.749]` (outer rounded corners are on the RIGHT `+shapeX` of the shape!)
  //    - For the Right Door (`z in [+0.250, +0.749]`): `shapeX in [-0.749, -0.250]` (outer rounded corners are on the LEFT `-shapeX` of the shape!)
  const doorSpanZ = sbInnerHalfW - 0.005 - (dividerStileZ + dividerStileW * 0.5 + 0.004); // 0.749 - 0.249 = 0.500m
  const doorCenterAbsZ = (dividerStileZ + dividerStileW * 0.5 + 0.004 + (sbInnerHalfW - 0.005)) * 0.5; // 0.499m
  const doorHalfW = doorSpanZ * 0.5; // 0.250m
  const doorHalfH = sbInnerHalfH - 0.005; // 0.229m
  const doorOuterR = sbInnerCornerR - 0.005; // 0.047m
  const doorInnerR = 0.003;
  const insetFrontX = sbDepthU * 0.5 - 0.020;

  for (const sideZ of [-1, 1] as const) {
    // When sideZ === -1 (Left door at negative Z), in shape space `shapeX = -z > 0`, so the outer cabinet edge is on the RIGHT (`rRightBot, rRightTop`)!
    const isLeftDoor = sideZ < 0;
    const doorShape = createRoundedRectPath(
      doorHalfW,
      doorHalfH,
      isLeftDoor ? doorInnerR : doorOuterR,
      isLeftDoor ? doorInnerR : doorOuterR,
      isLeftDoor ? doorOuterR : doorInnerR,
      isLeftDoor ? doorOuterR : doorInnerR,
      false
    ) as THREE.Shape;
    const doorGeo = new THREE.ExtrudeGeometry(doorShape, {
      depth: 0.015,
      bevelEnabled: true,
      bevelThickness: 0.0025,
      bevelSize: 0.0025,
      bevelSegments: 3,
      curveSegments: 14,
    });
    doorGeo.rotateY(Math.PI / 2);
    applyOakJoineryUVs(doorGeo, 'y', 1.15, 1.25, isLeftDoor ? 0.12 : 0.58, isLeftDoor ? 0.08 : 0.44);

    const doorPanel = new THREE.Mesh(doorGeo, teakMat);
    doorPanel.name = 'outbuildings.mezzanine.retroSideboard.door';
    doorPanel.position.set(insetFrontX, sbBodyMidY, sideZ * doorCenterAbsZ);
    doorPanel.castShadow = true;
    doorPanel.receiveShadow = true;
    sideboardGroup.add(doorPanel);

    // Sculpted vertical mid-century solid-oak finger-pull handle near the inner stile
    const handleZ = sideZ * (dividerStileZ + 0.042);
    const handleShadow = new THREE.Mesh(
      new THREE.BoxGeometry(0.006, 0.118, 0.012),
      shadowCavityMat
    );
    handleShadow.name = 'outbuildings.mezzanine.retroSideboard.doorHandleRecess';
    handleShadow.position.set(insetFrontX + 0.018, sbBodyMidY, handleZ - sideZ * 0.005);
    sideboardGroup.add(handleShadow);

    const handleGeo = applyOakJoineryUVs(
      new THREE.BoxGeometry(0.018, 0.122, 0.015),
      'y',
      1.6,
      1.6
    );
    const doorHandle = new THREE.Mesh(handleGeo, darkTeakMat);
    doorHandle.name = 'outbuildings.mezzanine.retroSideboard.doorHandle';
    doorHandle.position.set(insetFrontX + 0.023, sbBodyMidY, handleZ);
    doorHandle.castShadow = true;
    sideboardGroup.add(doorHandle);
  }

  // 5. Three Flush-Inset Central Drawers (horizontal oak grain + sculpted finger-lip pulls)
  const drawerBayW = (dividerStileZ - dividerStileW * 0.5 - 0.004) * 2; // 0.446m
  const drawerTotalH = sbInnerHalfH * 2 - 0.010; // 0.458m
  const drawerGapY = 0.005;
  const singleDrawerH = (drawerTotalH - drawerGapY * 2) / 3; // ~0.149m
  const drawerShape = createRoundedRectPath(
    drawerBayW * 0.5,
    singleDrawerH * 0.5,
    0.003,
    0.003,
    0.003,
    0.003,
    false
  ) as THREE.Shape;

  for (let d = 0; d < 3; d++) {
    const dy =
      sbBodyMidY -
      drawerTotalH * 0.5 +
      singleDrawerH * 0.5 +
      d * (singleDrawerH + drawerGapY);
    const drawerGeo = new THREE.ExtrudeGeometry(drawerShape, {
      depth: 0.015,
      bevelEnabled: true,
      bevelThickness: 0.0025,
      bevelSize: 0.0025,
      bevelSegments: 3,
    });
    drawerGeo.rotateY(Math.PI / 2);
    applyOakJoineryUVs(drawerGeo, 'z', 0.95, 1.35, d * 0.31, d * 0.27);

    const drawerFront = new THREE.Mesh(drawerGeo, teakMat);
    drawerFront.name = 'outbuildings.mezzanine.retroSideboard.drawer';
    drawerFront.position.set(insetFrontX, dy, 0);
    drawerFront.castShadow = true;
    drawerFront.receiveShadow = true;
    sideboardGroup.add(drawerFront);

    // Dark finger-recess shadow under the horizontal drawer pull
    const pullShadow = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.009, 0.118),
      shadowCavityMat
    );
    pullShadow.name = 'outbuildings.mezzanine.retroSideboard.drawerPullRecess';
    pullShadow.position.set(insetFrontX + 0.019, dy - 0.004, 0);
    sideboardGroup.add(pullShadow);

    const pullGeo = applyOakJoineryUVs(
      new THREE.BoxGeometry(0.020, 0.016, 0.124),
      'z',
      1.2,
      1.6,
      d * 0.2
    );
    const drawerPull = new THREE.Mesh(pullGeo, darkTeakMat);
    drawerPull.name = 'outbuildings.mezzanine.retroSideboard.drawerPull';
    drawerPull.position.set(insetFrontX + 0.024, dy + 0.003, 0);
    drawerPull.castShadow = true;
    sideboardGroup.add(drawerPull);
  }

  // 6. Sculpted Mid-Century Solid Oak Underframe Stretcher Apron & 4 Splayed Tapered Legs
  for (const railX of [-0.155, 0.155] as const) {
    const railGeo = applyOakJoineryUVs(
      new THREE.BoxGeometry(0.026, 0.032, sbTotalW - 0.28),
      'z',
      0.85,
      1.5
    );
    const stretcherRail = new THREE.Mesh(railGeo, darkTeakMat);
    stretcherRail.name = 'outbuildings.mezzanine.retroSideboard.stretcherRail';
    stretcherRail.position.set(railX, sbLegH - 0.014, 0);
    stretcherRail.castShadow = true;
    sideboardGroup.add(stretcherRail);
  }
  for (const crossZ of [-0.60, 0, 0.60] as const) {
    const crossGeo = applyOakJoineryUVs(
      new THREE.BoxGeometry(0.31, 0.028, 0.028),
      'x',
      1.2,
      1.5
    );
    const crossRail = new THREE.Mesh(crossGeo, darkTeakMat);
    crossRail.name = 'outbuildings.mezzanine.retroSideboard.crossRail';
    crossRail.position.set(0, sbLegH - 0.014, crossZ);
    sideboardGroup.add(crossRail);
  }

  for (const lx of [-0.155, 0.155] as const) {
    for (const lz of [-0.61, 0.61] as const) {
      const legGeo = applyOakJoineryUVs(
        new THREE.CylinderGeometry(0.023, 0.013, sbLegH + 0.02, 16),
        'y',
        1.4,
        2.0
      );
      const leg = new THREE.Mesh(legGeo, darkTeakMat);
      leg.name = 'outbuildings.mezzanine.retroSideboard.leg';
      leg.position.set(lx, sbLegH * 0.5, lz);
      leg.rotation.z = lx > 0 ? 0.10 : -0.10;
      leg.rotation.x = lz > 0 ? -0.09 : 0.09;
      leg.castShadow = true;
      leg.receiveShadow = true;
      sideboardGroup.add(leg);
    }
  }

  // =========================================================================
  // 3. RETRO 1990s SONY TRINITRON 27" COLOUR CRT TV (`outbuildings.mezzanine.sonyTrinitronTV`)
  //    Playing Disney's The Lion King (1994, Young Simba on the Pride Lands savanna!)
  // =========================================================================
  const tvGroup = new THREE.Group();
  tvGroup.name = 'outbuildings.mezzanine.sonyTrinitronTV';
  tvGroup.position.set(19.20, mezzanineFloorY + sbTopY, 2.38);
  tvGroup.rotation.y = -0.06; // Slightly angled toward the lounge seating
  loungeGroup.add(tvGroup);

  // Swivel base pedestal
  const tvBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.028, 0.52),
    trinitronDarkGrilleMat
  );
  tvBase.name = 'outbuildings.mezzanine.sonyTrinitronTV.swivelBase';
  tvBase.position.set(-0.02, 0.014, 0);
  tvGroup.add(tvBase);

  // Main front Trinitron cabinet bezel (`0.64m` wide along Z x `0.52m` high x `0.22m` front box)
  const tvFrontBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.52, 0.64),
    trinitronCharcoalMat
  );
  tvFrontBody.name = 'outbuildings.mezzanine.sonyTrinitronTV.frontCabinet';
  tvFrontBody.position.set(0.05, 0.288, 0);
  tvFrontBody.castShadow = true;
  tvFrontBody.receiveShadow = true;
  tvGroup.add(tvFrontBody);

  // Tapered rear CRT tube housing with ventilation louvres (`-x` toward the balustrade)
  const tvMidBack = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.42, 0.50),
    trinitronCharcoalMat
  );
  tvMidBack.name = 'outbuildings.mezzanine.sonyTrinitronTV.rearHousing';
  tvMidBack.position.set(-0.14, 0.28, 0);
  tvMidBack.castShadow = true;
  tvGroup.add(tvMidBack);

  const tvNeckCap = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.24, 0.26),
    trinitronDarkGrilleMat
  );
  tvNeckCap.name = 'outbuildings.mezzanine.sonyTrinitronTV.crtNeckCap';
  tvNeckCap.position.set(-0.27, 0.27, 0);
  tvGroup.add(tvNeckCap);

  // Moulded top & side ventilation slot ribs on the CRT housing
  for (let vSlot = -0.18; vSlot <= 0.18; vSlot += 0.045) {
    const ventRib = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.006, 0.018),
      trinitronDarkGrilleMat
    );
    ventRib.name = 'outbuildings.mezzanine.sonyTrinitronTV.ventRib';
    ventRib.userData = { lodTier: 'high', lodMaxDistance: 12 };
    ventRib.position.set(-0.13, 0.492, vSlot);
    tvGroup.add(ventRib);
  }

  // Deep recessed dark bezel framing the 4:3 CRT glass
  const bezelFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.41, 0.52),
    trinitronDarkGrilleMat
  );
  bezelFrame.name = 'outbuildings.mezzanine.sonyTrinitronTV.bezel';
  bezelFrame.position.set(0.155, 0.315, 0);
  tvGroup.add(bezelFrame);

  // Illuminated 4:3 Sony Trinitron CRT Screen (`The Lion King` Young Simba scene!)
  const lionKingTex = createLionKingTrinitronScreenTexture();
  const crtScreenMat = new THREE.MeshStandardMaterial({
    map: lionKingTex,
    emissive: new THREE.Color(0xffffff),
    emissiveMap: lionKingTex,
    emissiveIntensity: 0.72,
    roughness: 0.12,
    metalness: 0.08,
  });
  // Vertically flat, horizontally slightly cylindrical Trinitron aperture-grille curve!
  const screenW = 0.48;
  const screenH = 0.36;
  const screenGeo = new THREE.PlaneGeometry(screenW, screenH, 16, 4);
  const sPos = screenGeo.attributes.position;
  for (let i = 0; i < sPos.count; i++) {
    const sx = sPos.getX(i);
    // Subtle Trinitron horizontal cylinder bulge outward (`+z` in local PlaneGeometry before rotation)
    const normX = sx / (screenW * 0.5);
    const bulge = (1 - normX * normX) * 0.012;
    sPos.setZ(i, bulge);
  }
  screenGeo.computeVertexNormals();
  screenGeo.computeBoundingSphere();

  const crtScreen = new THREE.Mesh(screenGeo, crtScreenMat);
  crtScreen.name = 'outbuildings.mezzanine.sonyTrinitronTV.screen';
  crtScreen.rotation.y = Math.PI / 2; // Faces `+x` East into the Mezzanine lounge
  crtScreen.position.set(0.167, 0.315, 0);
  tvGroup.add(crtScreen);

  // Lower speaker grille & flip-down control panel door below the screen
  const lowerControlBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.026, 0.068, 0.62),
    trinitronDarkGrilleMat
  );
  lowerControlBar.name = 'outbuildings.mezzanine.sonyTrinitronTV.controlBar';
  lowerControlBar.position.set(0.158, 0.068, 0);
  tvGroup.add(lowerControlBar);

  // Silver 'SONY' badge centered below the screen
  const sonyBadge = new THREE.Mesh(
    new THREE.BoxGeometry(0.008, 0.014, 0.062),
    silverBadgeMat
  );
  sonyBadge.name = 'outbuildings.mezzanine.sonyTrinitronTV.badge';
  sonyBadge.userData = { lodTier: 'high', lodMaxDistance: 12 };
  sonyBadge.position.set(0.172, 0.092, 0);
  tvGroup.add(sonyBadge);

  // Glowing green power indicator LED + power button
  const powerLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.0045, 8, 8),
    new THREE.MeshStandardMaterial({
      color: 0x33ff55,
      emissive: 0x22ee44,
      emissiveIntensity: 1.8,
    })
  );
  powerLed.name = 'outbuildings.mezzanine.sonyTrinitronTV.powerLed';
  powerLed.userData = { lodTier: 'high', lodMaxDistance: 12 };
  powerLed.position.set(0.171, 0.065, 0.22);
  tvGroup.add(powerLed);

  // =========================================================================
  // 6. SCULPTED 1990s CORDUROY BEANBAG CHAIRS, TAPESTRY BEANBAG, KILIM POUFFE
  //    & LOW WOODEN COFFEE TABLE WITH OPEN MONOPOLY BOARD GAME, SODA CANS & SNACKS
  // =========================================================================
  const loungeSeatingGroup = new THREE.Group();
  loungeSeatingGroup.name = 'outbuildings.mezzanine.beanbagLounge';
  loungeGroup.add(loungeSeatingGroup);

  // Issue #1 ("This has gone way too childish, look at the original concept art. It needs to be cosy and warm just not 1970s.
  // Traditional style rug. Still wooden book case. Not bright purples and blacks like a CBBC studio."):
  // Matches `media_1791202879638_22365d89.jpg` with warm, cosy heritage navy corduroy, woven oatmeal/terracotta/navy tapestry,
  // deep slate-indigo corduroy in the back corner, and a round woven terracotta/cream pouffe!
  // Issue #5 ("Terracotta cordoroy beanbag" at `[-2.701, 2.121, 18.522]`, `outbuildings.mezzanine.beanbag.navyFront`):
  // Rich warm Terracotta Jumbo Corduroy Material (`#b8563a` wales with `#8e3d26` shadow valleys)
  const terracottaCorduroyMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: createCorduroyFabricTexture('#b8563a', '#8e3d26'),
    roughness: 0.86,
    metalness: 0.02,
  });
  // Issue #6 ("sheepskin beanbag" at `[-2.208, 2.109, 15.359]`, `outbuildings.mezzanine.beanbag.navyBack`):
  // Plush curly warm-ivory New Zealand Sheepskin Fleece Material
  const sheepskinTextures = createSheepskinFleeceTextures();
  const sheepskinBeanbagMat = new THREE.MeshStandardMaterial({
    color: 0xf8f3e6,
    map: sheepskinTextures.colorMap,
    bumpMap: sheepskinTextures.bumpMap,
    bumpScale: 0.018,
    roughness: 0.92,
    metalness: 0.01,
  });
  const tapestryBeanbagMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: createTapestryBeanbagTexture(),
    roughness: 0.86,
    metalness: 0.02,
  });
  const knittedPouffeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: createKnittedPouffeTexture(),
    roughness: 0.88,
    metalness: 0.02,
  });

  const beanbagGeoLarge = createSculptedBeanbagGeometry(0.54, 0.68, 0.58);
  const beanbagGeoMed = createSculptedBeanbagGeometry(0.48, 0.62, 0.52);

  // 1. Foreground South-West Terracotta Jumbo Corduroy Beanbag Chair (`u = 19.72m, v = 3.96m` — Issue #5!)
  const navyBeanbagFront = new THREE.Mesh(beanbagGeoLarge, terracottaCorduroyMat);
  navyBeanbagFront.name = 'outbuildings.mezzanine.beanbag.navyFront';
  navyBeanbagFront.position.set(19.72, mezzanineFloorY, 3.96);
  navyBeanbagFront.rotation.y = -2.28;
  navyBeanbagFront.castShadow = true;
  navyBeanbagFront.receiveShadow = true;
  loungeSeatingGroup.add(navyBeanbagFront);

  // 2. East Lounge Woven Tapestry Beanbag Chair (`u = 22.42m, v = 1.42m`, facing the coffee table & TV)
  const tapestryBeanbag = new THREE.Mesh(beanbagGeoMed, tapestryBeanbagMat);
  tapestryBeanbag.name = 'outbuildings.mezzanine.beanbag.tapestry';
  tapestryBeanbag.position.set(22.42, mezzanineFloorY, 1.42);
  tapestryBeanbag.rotation.y = -1.35;
  tapestryBeanbag.castShadow = true;
  tapestryBeanbag.receiveShadow = true;
  loungeSeatingGroup.add(tapestryBeanbag);

  // 3. North-West Lounge Plush Curly Cream Sheepskin Beanbag Chair (`u = 20.52m, v = 1.08m` — Issue #6!)
  const navyBeanbagBack = new THREE.Mesh(beanbagGeoMed, sheepskinBeanbagMat);
  navyBeanbagBack.name = 'outbuildings.mezzanine.beanbag.navyBack';
  navyBeanbagBack.position.set(20.52, mezzanineFloorY, 1.08);
  navyBeanbagBack.rotation.y = 0.52;
  navyBeanbagBack.castShadow = true;
  navyBeanbagBack.receiveShadow = true;
  loungeSeatingGroup.add(navyBeanbagBack);

  // 4. Round Woven Terracotta & Cream Pouffe Cushion (`outbuildings.mezzanine.pouffe` at `u = 20.68m, v = 2.24m`, matching `media_1791202879638_22365d89.jpg`)
  const pouffeGeo = new THREE.SphereGeometry(0.30, 28, 20);
  pouffeGeo.scale(1.0, 0.56, 1.0);
  const pouffeMesh = new THREE.Mesh(pouffeGeo, knittedPouffeMat);
  pouffeMesh.name = 'outbuildings.mezzanine.pouffe';
  pouffeMesh.position.set(20.68, mezzanineFloorY + 0.16, 2.24);
  pouffeMesh.castShadow = true;
  pouffeMesh.receiveShadow = true;
  loungeSeatingGroup.add(pouffeMesh);

  // 5. Low Warm-Timber Lounge Coffee Table (`u = 21.55m, v = 1.62m`, matching `media_1791202879638_22365d89.jpg`)
  const coffeeTableGroup = new THREE.Group();
  coffeeTableGroup.name = 'outbuildings.mezzanine.coffeeTable';
  coffeeTableGroup.position.set(21.55, mezzanineFloorY, 1.62);
  coffeeTableGroup.rotation.y = 0.06;
  loungeSeatingGroup.add(coffeeTableGroup);

  const ctW = 0.62;
  const ctL = 0.96;
  const ctH = 0.38;
  const ctTop = new THREE.Mesh(
    applyOakJoineryUVs(new THREE.BoxGeometry(ctW, 0.028, ctL), 'z', 0.95, 1.35),
    teakMat
  );
  ctTop.name = 'outbuildings.mezzanine.coffeeTable.top';
  ctTop.position.set(0, ctH - 0.014, 0);
  ctTop.castShadow = true;
  ctTop.receiveShadow = true;
  coffeeTableGroup.add(ctTop);

  for (const lx of [-0.24, 0.24] as const) {
    for (const lz of [-0.40, 0.40] as const) {
      const ctLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.013, ctH - 0.02, 16),
        darkTeakMat
      );
      ctLeg.name = 'outbuildings.mezzanine.coffeeTable.leg';
      ctLeg.position.set(lx, (ctH - 0.02) * 0.5, lz);
      ctLeg.castShadow = true;
      coffeeTableGroup.add(ctLeg);
    }
  }

  // Open Monopoly Board on center of coffee table
  const monopolyBoard = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.006, 0.48),
    new THREE.MeshStandardMaterial({
      map: createMonopolyBoardTexture(),
      roughness: 0.36,
      metalness: 0.04,
    })
  );
  monopolyBoard.name = 'outbuildings.mezzanine.monopolyBoard';
  monopolyBoard.position.set(0, ctH + 0.003, 0.02);
  monopolyBoard.rotation.y = 0.14;
  coffeeTableGroup.add(monopolyBoard);

  // Miniature green Monopoly houses, red hotels & 2 white dice on the board
  const houseGreenMat = new THREE.MeshStandardMaterial({ color: 0x1e8238, roughness: 0.35 });
  const hotelRedMat = new THREE.MeshStandardMaterial({ color: 0xc92626, roughness: 0.35 });
  for (const [hx, hz, isHotel] of [
    [-0.16, 0.14, false],
    [-0.12, 0.15, false],
    [0.15, -0.11, true],
    [0.14, 0.16, false],
    [-0.15, -0.12, true],
  ] as const) {
    const token = new THREE.Mesh(
      new THREE.BoxGeometry(isHotel ? 0.016 : 0.012, isHotel ? 0.014 : 0.010, isHotel ? 0.014 : 0.012),
      isHotel ? hotelRedMat : houseGreenMat
    );
    token.name = 'outbuildings.mezzanine.monopolyBoard.houseToken';
    token.userData = { lodTier: 'high', lodMaxDistance: 12 };
    token.position.set(hx, ctH + 0.011, hz);
    coffeeTableGroup.add(token);
  }
  for (const [dx, dz] of [
    [-0.02, 0.03],
    [0.015, 0.045],
  ] as const) {
    const die = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.012, 0.012),
      new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.25 })
    );
    die.name = 'outbuildings.mezzanine.monopolyBoard.die';
    die.userData = { lodTier: 'high', lodMaxDistance: 12 };
    die.position.set(dx, ctH + 0.012, dz);
    die.rotation.y = 0.4;
    coffeeTableGroup.add(die);
  }

  // 1990s Soda Cans (Red Coca-Cola Can, Green 7UP Can, Yellow Crisps Can) + Red Snack Bowl + Stacked Game Boxes
  for (const [cx, cz, cCol, cH] of [
    [0.21, -0.22, 0xd62424, 0.115], // Red Coca-Cola can
    [-0.22, -0.20, 0x1e8a44, 0.115], // Green 7UP / Sprite can
    [0.20, 0.32, 0xe8b923, 0.155],  // Yellow crisps canister
  ] as const) {
    const can = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, cH, 18),
      new THREE.MeshStandardMaterial({ color: cCol, roughness: 0.25, metalness: 0.45 })
    );
    can.name = 'outbuildings.mezzanine.coffeeTable.sodaCan';
    can.userData = { lodTier: 'high', lodMaxDistance: 12 };
    can.position.set(cx, ctH + cH * 0.5, cz);
    can.castShadow = true;
    coffeeTableGroup.add(can);

    const canLid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.030, 0.030, 0.004, 18),
      silverBadgeMat
    );
    canLid.name = 'outbuildings.mezzanine.coffeeTable.sodaCanLid';
    canLid.userData = { lodTier: 'high', lodMaxDistance: 12 };
    canLid.position.set(cx, ctH + cH + 0.002, cz);
    coffeeTableGroup.add(canLid);
  }

  // Red ceramic snack bowl & white bowl
  for (const [bx, bz, bCol] of [
    [-0.20, -0.34, 0xc82828],
    [-0.18, 0.34, 0xf2eee6],
  ] as const) {
    const bowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.044, 0.048, 20),
      new THREE.MeshStandardMaterial({ color: bCol, roughness: 0.3 })
    );
    bowl.name = 'outbuildings.mezzanine.coffeeTable.snackBowl';
    bowl.userData = { lodTier: 'high', lodMaxDistance: 12 };
    bowl.position.set(bx, ctH + 0.024, bz);
    bowl.castShadow = true;
    coffeeTableGroup.add(bowl);
  }

  // Issue #4 ("Remove this book from table" at `[-0.774, 2.025, 15.338]`, `outbuildings.mezzanine.coffeeTable`):
  // Removed the stacked book/box meshes from the edge of the coffee table.

  return {
    sbTopY,
    teakMat,
    darkTeakMat,
    trinitronCharcoalMat,
    trinitronDarkGrilleMat,
    ps1GreyMat,
    ps1DarkGreyMat,
    cordBlackMat,
    silverBadgeMat,
  };
}
