import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../../engine/viewer/scene-types.ts';
import { createMarbleBacksplashTexture } from '../../../../../engine/textures/procedural-textures.ts';
import { buildHollowCabinetCarcass } from '../../../../../objects/joinery/cabinet-interior.ts';
import {
  type KitchenCabinetrySharedContext,
  nameCarcassHierarchy,
  prepGeo,
  tagHighLod,
} from './kitchen-joinery-shared.ts';

// Closed-loop LatheGeometry profile so the chrome dome lid has a solid rolled bottom lip & underside
const agaLidProfile: THREE.Vector2[] = [
  new THREE.Vector2(0.0, 0.028),
  new THREE.Vector2(0.164, 0.028),
  new THREE.Vector2(0.168, 0.0),
  new THREE.Vector2(0.182, 0.0),
  new THREE.Vector2(0.18, 0.038),
  new THREE.Vector2(0.172, 0.052),
  new THREE.Vector2(0.155, 0.061),
  new THREE.Vector2(0.12, 0.065),
  new THREE.Vector2(0.0, 0.067),
];
const sharedAgaLidGeo = prepGeo(new THREE.LatheGeometry(agaLidProfile, 24));
const sharedAgaHotplateRingGeo = prepGeo(new THREE.CylinderGeometry(0.19, 0.2, 0.0165, 18));
const sharedAgaHotplateDiscGeo = prepGeo(new THREE.CylinderGeometry(0.168, 0.168, 0.012, 24));
const sharedAgaLidHeatLinerGeo = prepGeo(new THREE.CylinderGeometry(0.16, 0.16, 0.005, 24));
const sharedAgaLidInnerStepGeo = prepGeo(new THREE.CylinderGeometry(0.118, 0.122, 0.005, 22));
const sharedAgaLidCenterBossGeo = prepGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.005, 14));
const sharedAgaDomeRearHingeGeo = prepGeo(new THREE.BoxGeometry(0.068, 0.026, 0.038));
const sharedAgaDomeHandleGeo = prepGeo(new THREE.BoxGeometry(0.085, 0.024, 0.036));

const sharedAgaRearCoreGeo = prepGeo(new THREE.BoxGeometry(1.52, 0.91, 0.4));
const sharedAgaTopPlateGeo = prepGeo(new THREE.BoxGeometry(1.55, 0.035, 0.75));
const sharedAgaBackUpstandGeo = prepGeo(new THREE.BoxGeometry(1.55, 0.055, 0.028));
const sharedAgaWarmingPlateGeo = prepGeo(new THREE.BoxGeometry(0.36, 0.02, 0.42));
const sharedAgaTopVentBaseGeo = prepGeo(new THREE.BoxGeometry(0.16, 0.055, 0.13));
const sharedAgaTopVentCapGeo = prepGeo(new THREE.CylinderGeometry(0.052, 0.068, 0.035, 16));
const sharedAgaTopVentGrilleGeo = prepGeo(new THREE.CylinderGeometry(0.044, 0.044, 0.008, 16));

const sharedAgaHingeStrapGeo = prepGeo(new THREE.BoxGeometry(0.056, 0.042, 0.032));
const sharedAgaHingeBarrelGeo = prepGeo(new THREE.CylinderGeometry(0.014, 0.014, 0.058, 10));
const sharedAgaDoorCatchGeo = prepGeo(new THREE.BoxGeometry(0.026, 0.036, 0.028));
const sharedAgaCrestBackingGeo = prepGeo(new THREE.CylinderGeometry(0.068, 0.068, 0.008, 24));
const sharedAgaCrestFaceGeo = prepGeo(new THREE.PlaneGeometry(0.175, 0.108));
const sharedAgaTowelBracketGeo = prepGeo(new THREE.BoxGeometry(0.022, 0.022, 0.085));
const sharedAgaTowelFinialGeo = prepGeo(new THREE.SphereGeometry(0.016, 10, 8));

const sharedBacksplashGeo = prepGeo(new THREE.BoxGeometry(2.77, 0.966, 0.024));
// Survey2Plan Ceil 1609635 = 2.54m flat plaster ceiling soffit over West Kitchen (hood chimney terminates cleanly at Y = 2.54m)
const sharedHoodMantleGeo = prepGeo(new THREE.BoxGeometry(2.75, 0.59, 0.45));
const sharedHoodCorbelGeo = prepGeo(new THREE.BoxGeometry(0.12, 0.22, 0.47));
const sharedHoodShelfLowerGeo = prepGeo(new THREE.BoxGeometry(2.78, 0.028, 0.475));
const sharedHoodShelfUpperGeo = prepGeo(new THREE.BoxGeometry(2.81, 0.038, 0.495));
const sharedHoodTopCorniceGeo = prepGeo(new THREE.BoxGeometry(2.77, 0.036, 0.465));
const sharedHoodBaffleGeo = prepGeo(new THREE.BoxGeometry(1.02, 0.018, 0.34));

export function buildAgaRangeCooker(
  ctx: SceneBuilderContext,
  shared: KitchenCabinetrySharedContext
): void {
  const { scene, interactions } = ctx;
  const northGroup = scene;
  const { brushedStainlessTex, polishedChromeTex } = shared;

  // =========================================================================
  // 3. WIDE ROYAL-SLATE BLUE CAST-IRON AGA (X = -2.92m to -1.40m, center X = -2.16m)
  // =========================================================================
  const agaGroup = new THREE.Group();
  agaGroup.name = 'kitchen.cabinetry.north.agaRangeCooker';
  agaGroup.position.set(-2.16, 0, -2.13);

  const agaLightBlueMat = new THREE.MeshStandardMaterial({
    color: 0x5676a6,
    roughness: 0.18,
    metalness: 0.14,
  });
  const agaBlackTrimMat = new THREE.MeshStandardMaterial({
    color: 0x1c2024,
    roughness: 0.28,
    metalness: 0.4,
  });
  // Shiny polished mirror chrome for the AGA dome lids and split towel rails (reacting 100% to room lighting)
  const chromeMat = new THREE.MeshStandardMaterial({
    map: polishedChromeTex,
    color: 0xe8e5de,
    roughness: 0.06,
    metalness: 0.55,
    side: THREE.DoubleSide,
  });

  // Rear core of the AGA body (Z = -0.36m to +0.04m) + front cast-iron frame piers/rails leaving 5 recessed oven cavities
  const agaRearCore = new THREE.Mesh(sharedAgaRearCoreGeo, agaLightBlueMat);
  agaRearCore.name = 'kitchen.cabinetry.north.agaRangeCooker.rearCore';
  agaRearCore.position.set(0, 0.455, -0.16);
  agaRearCore.castShadow = true;
  agaGroup.add(agaRearCore);

  const agaFrontBlocks: ReadonlyArray<readonly [number, number, number, number, string]> = [
    // [centerX, centerY, widthX, heightY, partName] spanning Z = +0.04m..+0.36m (depth 0.32m, center Z = +0.20m)
    [-0.705, 0.455, 0.11, 0.91, 'farLeftPier'],
    [-0.245, 0.455, 0.13, 0.91, 'leftCenterPier'],
    [0.245, 0.455, 0.13, 0.91, 'rightCenterPier'],
    [0.705, 0.455, 0.11, 0.91, 'farRightPier'],
    [0.0, 0.05, 1.3, 0.1, 'bottomPlinthRail'],
    [-0.48, 0.45, 0.34, 0.1, 'leftMidRail'],
    [-0.48, 0.855, 0.34, 0.11, 'leftTopRail'],
    [0.48, 0.45, 0.34, 0.1, 'rightMidRail'],
    [0.48, 0.855, 0.34, 0.11, 'rightTopRail'],
    [0.0, 0.655, 0.36, 0.51, 'centerUpperPanel'],
  ];
  for (const [bx, by, bw, bh, partName] of agaFrontBlocks) {
    const frontBlock = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(bw, bh, 0.32)),
      agaLightBlueMat
    );
    frontBlock.name = `kitchen.cabinetry.north.agaRangeCooker.frontFrame.${partName}`;
    frontBlock.position.set(bx, by, 0.2);
    frontBlock.castShadow = true;
    frontBlock.receiveShadow = true;
    agaGroup.add(frontBlock);
  }

  const agaTop = new THREE.Mesh(sharedAgaTopPlateGeo, agaBlackTrimMat);
  agaTop.name = 'kitchen.cabinetry.north.agaRangeCooker.topPlate';
  agaTop.position.set(0, 0.92, 0);
  agaGroup.add(agaTop);

  // Small black cast-iron upstand running along the back edge of the AGA top
  const agaBackUpstand = new THREE.Mesh(sharedAgaBackUpstandGeo, agaBlackTrimMat);
  agaBackUpstand.name = 'kitchen.cabinetry.north.agaRangeCooker.backUpstand';
  agaBackUpstand.position.set(0, 0.965, -0.36);
  agaBackUpstand.castShadow = true;
  agaGroup.add(agaBackUpstand);

  const warmingPlate = new THREE.Mesh(sharedAgaWarmingPlateGeo, agaBlackTrimMat);
  warmingPlate.name = 'kitchen.cabinetry.north.agaRangeCooker.warmingPlate';
  warmingPlate.position.set(-0.48, 0.942, -0.02);
  agaGroup.add(warmingPlate);

  const castIronHotplateMat = new THREE.MeshStandardMaterial({
    color: 0x2a2d32,
    roughness: 0.48,
    metalness: 0.62,
  });
  const agaLidUndersideLinerMat = new THREE.MeshStandardMaterial({
    map: brushedStainlessTex,
    bumpMap: brushedStainlessTex,
    bumpScale: 0.003,
    color: 0xb8b4ac,
    roughness: 0.36,
    metalness: 0.58,
  });

  for (const domeX of [-0.04, 0.44] as const) {
    const domeLabel = domeX < 0 ? 'boilingHob' : 'simmeringHob';
    const hobPrefix = `kitchen.cabinetry.north.agaRangeCooker.${domeLabel}`;

    const ring = new THREE.Mesh(sharedAgaHotplateRingGeo, chromeMat);
    ring.name = `${hobPrefix}.surroundRing`;
    ring.position.set(domeX, 0.94125, -0.02);
    agaGroup.add(ring);

    // Circular machined cast-iron boiling/simmering hotplate inside the chrome surround (revealed when dome lid is lifted!)
    const hotplateDisc = new THREE.Mesh(sharedAgaHotplateDiscGeo, castIronHotplateMat);
    hotplateDisc.name = `${hobPrefix}.hotplateDisc`;
    hotplateDisc.position.set(domeX, 0.9485, -0.02);
    agaGroup.add(hotplateDisc);

    // Interactive hinged chrome AGA insulating dome lid (lifts back on its rear hinge when clicked!)
    const lidGroup = new THREE.Group();
    lidGroup.name = `${hobPrefix}.domeLid`;
    lidGroup.position.set(domeX, 0.96, -0.02);

    const lid = new THREE.Mesh(sharedAgaLidGeo, chromeMat);
    lid.name = `${hobPrefix}.domeLid.shell`;
    lid.castShadow = true;
    lid.receiveShadow = true;
    lidGroup.add(lid);

    // Solid insulated brushed-stainless heat-shield liner plate on the underside of the AGA dome lid
    const undersideHeatLiner = new THREE.Mesh(
      sharedAgaLidHeatLinerGeo,
      agaLidUndersideLinerMat
    );
    undersideHeatLiner.name = `${hobPrefix}.domeLid.undersideHeatLiner`;
    undersideHeatLiner.position.set(0, 0.0205, 0);
    tagHighLod(undersideHeatLiner, 12);
    lidGroup.add(undersideHeatLiner);

    // Stepped inner expansion ring & central retaining boss on the underside of the lid
    const undersideInnerStep = new THREE.Mesh(sharedAgaLidInnerStepGeo, castIronHotplateMat);
    undersideInnerStep.name = `${hobPrefix}.domeLid.undersideInnerStep`;
    undersideInnerStep.position.set(0, 0.0115, 0);
    tagHighLod(undersideInnerStep, 12);
    lidGroup.add(undersideInnerStep);

    const undersideCenterBoss = new THREE.Mesh(sharedAgaLidCenterBossGeo, chromeMat);
    undersideCenterBoss.name = `${hobPrefix}.domeLid.undersideCenterBoss`;
    undersideCenterBoss.position.set(0, 0.0025, 0);
    tagHighLod(undersideCenterBoss, 12);
    lidGroup.add(undersideCenterBoss);

    // Rear hinge housing block at the back of the AGA dome lid
    const domeRearHinge = new THREE.Mesh(sharedAgaDomeRearHingeGeo, chromeMat);
    domeRearHinge.name = `${hobPrefix}.domeLid.rearHinge`;
    domeRearHinge.position.set(0, 0.014, -0.178);
    tagHighLod(domeRearHinge, 12);
    lidGroup.add(domeRearHinge);

    const domeHandle = new THREE.Mesh(sharedAgaDomeHandleGeo, agaBlackTrimMat);
    domeHandle.name = `${hobPrefix}.domeLid.handle`;
    domeHandle.position.set(0, 0.023, 0.192);
    tagHighLod(domeHandle, 12);
    lidGroup.add(domeHandle);

    agaGroup.add(lidGroup);
    const lidPivot = interactions.registerHingedDoor(
      agaGroup,
      lidGroup,
      new THREE.Vector3(0, 0, -0.18),
      'x',
      -Math.PI * 0.46
    );
    lidPivot.name = `${hobPrefix}.domeLid.pivot`;
  }

  // Raised cast-iron flue/extractor vent housing on top between the 2 hobs at the back (x = +0.20m, z = -0.24m)
  const agaTopVentBase = new THREE.Mesh(sharedAgaTopVentBaseGeo, agaBlackTrimMat);
  agaTopVentBase.name = 'kitchen.cabinetry.north.agaRangeCooker.topFlueVent.base';
  agaTopVentBase.position.set(0.2, 0.965, -0.24);
  agaTopVentBase.castShadow = true;
  agaGroup.add(agaTopVentBase);

  const agaTopVentCap = new THREE.Mesh(sharedAgaTopVentCapGeo, agaBlackTrimMat);
  agaTopVentCap.name = 'kitchen.cabinetry.north.agaRangeCooker.topFlueVent.cap';
  agaTopVentCap.position.set(0.2, 1.005, -0.24);
  tagHighLod(agaTopVentCap, 12);
  agaGroup.add(agaTopVentCap);

  const agaTopVentGrille = new THREE.Mesh(sharedAgaTopVentGrilleGeo, chromeMat);
  agaTopVentGrille.name = 'kitchen.cabinetry.north.agaRangeCooker.topFlueVent.grille';
  agaTopVentGrille.position.set(0.2, 1.023, -0.24);
  tagHighLod(agaTopVentGrille, 12);
  agaGroup.add(agaTopVentGrille);

  // Classic 5-door layout (NO top central door — the AGA crest sits in that top-center space instead):
  // [centerX, centerY, width, height, hingeSide (-1 = left outer edge, +1 = right outer edge), ovenName]
  const ovenCoords: ReadonlyArray<
    readonly [number, number, number, number, -1 | 1, string]
  > = [
    [-0.48, 0.65, 0.36, 0.32, -1, 'topLeftOven'],
    [-0.48, 0.25, 0.36, 0.32, -1, 'bottomLeftOven'],
    [0.0, 0.25, 0.38, 0.32, -1, 'bottomCenterOven'],
    [0.48, 0.65, 0.36, 0.32, 1, 'topRightRoastingOven'],
    [0.48, 0.25, 0.36, 0.32, 1, 'bottomRightSimmeringOven'],
  ];
  for (const [ox, oy, ow, oh, hingeSide, ovenName] of ovenCoords) {
    const ovenPrefix = `kitchen.cabinetry.north.agaRangeCooker.${ovenName}`;

    // Dark cast-iron oven interior cavity & wire rack inside each of the 5 AGA ovens (Z = +0.04m..+0.35m)
    nameCarcassHierarchy(
      buildHollowCabinetCarcass(
        agaGroup,
        ox,
        oy - (oh - 0.02) * 0.5,
        0.195,
        ow - 0.02,
        oh - 0.02,
        0.31,
        '+z',
        agaBlackTrimMat,
        {
          plinthHeight: 0,
          interiorStyle: 'oven',
          shelfCount: 1,
          includeItems: true,
        }
      ),
      `${ovenPrefix}.cavity`
    );

    // Fixed black cast-iron surround on the AGA body
    const doorOutline = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(ow + 0.012, oh + 0.012, 0.008)),
      agaBlackTrimMat
    );
    doorOutline.name = `${ovenPrefix}.doorOutline`;
    doorOutline.position.set(ox, oy, 0.364);
    agaGroup.add(doorOutline);

    // Interactive hinged cast-iron AGA oven door (with dark heat-shield liner on back of door)
    const agaDoorGroup = new THREE.Group();
    agaDoorGroup.name = `${ovenPrefix}.door`;
    agaDoorGroup.position.set(ox, oy, 0.39);

    const door = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(ow, oh, 0.022)),
      agaLightBlueMat
    );
    door.name = `${ovenPrefix}.door.castBody`;
    door.castShadow = true;
    agaDoorGroup.add(door);

    const doorInnerHeatLiner = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(ow - 0.045, oh - 0.045, 0.006)),
      castIronHotplateMat
    );
    doorInnerHeatLiner.name = `${ovenPrefix}.door.innerHeatLiner`;
    doorInnerHeatLiner.position.set(0, 0, -0.014);
    tagHighLod(doorInnerHeatLiner, 12);
    agaDoorGroup.add(doorInnerHeatLiner);

    const doorRaisedPanel = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(ow - 0.036, oh - 0.036, 0.008)),
      agaLightBlueMat
    );
    doorRaisedPanel.name = `${ovenPrefix}.door.raisedPanel`;
    doorRaisedPanel.position.set(0, 0, 0.015);
    agaDoorGroup.add(doorRaisedPanel);

    // Large body-colored cast-iron hinges on the outer edge of each door (top & bottom hinge lugs + vertical pin barrel)
    const hingeX = ox + hingeSide * (ow * 0.5 + 0.012);
    for (const [hIdx, hyOffset] of ([-oh * 0.28, oh * 0.28] as const).entries()) {
      const vLabel = hIdx === 0 ? 'bottom' : 'top';
      const hingeStrap = new THREE.Mesh(sharedAgaHingeStrapGeo, agaLightBlueMat);
      hingeStrap.name = `${ovenPrefix}.door.hingeStrap.${vLabel}`;
      hingeStrap.position.set(hingeSide * (ow * 0.5 - 0.004), hyOffset, 0.006);
      hingeStrap.castShadow = true;
      tagHighLod(hingeStrap, 12);
      agaDoorGroup.add(hingeStrap);

      const hingeBarrel = new THREE.Mesh(sharedAgaHingeBarrelGeo, agaLightBlueMat);
      hingeBarrel.name = `${ovenPrefix}.hingeBarrel.${vLabel}`;
      hingeBarrel.position.set(hingeX, oy + hyOffset, 0.395);
      hingeBarrel.castShadow = true;
      tagHighLod(hingeBarrel, 12);
      agaGroup.add(hingeBarrel);
    }

    // Opposite inner-edge door catch lug
    const catchSide = -hingeSide;
    const doorCatch = new THREE.Mesh(sharedAgaDoorCatchGeo, agaLightBlueMat);
    doorCatch.name = `${ovenPrefix}.door.catchLug`;
    doorCatch.position.set(catchSide * (ow * 0.5 - 0.002), 0, 0.013);
    tagHighLod(doorCatch, 12);
    agaDoorGroup.add(doorCatch);

    agaGroup.add(agaDoorGroup);
    const doorPivot = interactions.registerHingedDoor(
      agaGroup,
      agaDoorGroup,
      new THREE.Vector3(hingeSide * (ow * 0.5 + 0.012), 0, 0.013),
      'y',
      hingeSide * Math.PI * 0.62
    );
    doorPivot.name = `${ovenPrefix}.door.pivot`;
  }

  // AGA Crest / Emblem mounted in the top-center space (x = 0.0, y = 0.66m) where there is no top central door
  const crestCanvas = document.createElement('canvas');
  crestCanvas.width = 256;
  crestCanvas.height = 160;
  const cCtx = crestCanvas.getContext('2d');
  if (cCtx) {
    cCtx.clearRect(0, 0, 256, 160);
    // Classic oval silver/cream AGA crest plate with black & chrome border
    cCtx.fillStyle = '#1c2024';
    cCtx.beginPath();
    cCtx.ellipse(128, 80, 114, 66, 0, 0, Math.PI * 2);
    cCtx.fill();

    cCtx.strokeStyle = '#e8ecf2';
    cCtx.lineWidth = 8;
    cCtx.beginPath();
    cCtx.ellipse(128, 80, 104, 56, 0, 0, Math.PI * 2);
    cCtx.stroke();

    cCtx.fillStyle = '#f2eee4';
    cCtx.font = 'bold 58px Georgia, serif';
    cCtx.textAlign = 'center';
    cCtx.textBaseline = 'middle';
    cCtx.fillText('AGA', 128, 84);
  }
  const crestTex = new THREE.CanvasTexture(crestCanvas);
  crestTex.colorSpace = THREE.SRGBColorSpace;

  const agaCrestBacking = new THREE.Mesh(sharedAgaCrestBackingGeo, chromeMat);
  agaCrestBacking.name = 'kitchen.cabinetry.north.agaRangeCooker.crest.backing';
  agaCrestBacking.rotation.x = Math.PI / 2;
  agaCrestBacking.scale.set(1.35, 1.0, 0.85);
  agaCrestBacking.position.set(0.0, 0.66, 0.368);
  tagHighLod(agaCrestBacking, 12);
  agaGroup.add(agaCrestBacking);

  const agaCrestFace = new THREE.Mesh(
    sharedAgaCrestFaceGeo,
    new THREE.MeshStandardMaterial({
      map: crestTex,
      transparent: true,
      roughness: 0.22,
      metalness: 0.25,
    })
  );
  agaCrestFace.name = 'kitchen.cabinetry.north.agaRangeCooker.crest.facePlate';
  agaCrestFace.position.set(0.0, 0.66, 0.3765);
  tagHighLod(agaCrestFace, 12);
  agaGroup.add(agaCrestFace);

  // Split Chrome Towel Rail (1/3 length below the plate warmer side on the left, gap in between, 2/3 length below the 2 hobs on the right)
  const railSections: ReadonlyArray<readonly [number, number, string]> = [
    [-0.5, 0.44, 'leftRail'],
    [0.24, 0.92, 'rightRail'],
  ];
  for (const [rx, rLen, railLabel] of railSections) {
    const railPrefix = `kitchen.cabinetry.north.agaRangeCooker.towelRail.${railLabel}`;
    const railBar = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.013, 0.013, rLen, 12)),
      chromeMat
    );
    railBar.name = `${railPrefix}.bar`;
    railBar.rotation.z = Math.PI / 2;
    railBar.position.set(rx, 0.86, 0.44);
    railBar.castShadow = true;
    agaGroup.add(railBar);

    // Brackets & black end-caps at each end of the rail section
    for (const endSide of [-1, 1] as const) {
      const endLabel = endSide < 0 ? 'left' : 'right';
      const endX = rx + endSide * (rLen * 0.5 - 0.02);
      const bracket = new THREE.Mesh(sharedAgaTowelBracketGeo, agaBlackTrimMat);
      bracket.name = `${railPrefix}.bracket.${endLabel}`;
      bracket.position.set(endX, 0.86, 0.398);
      tagHighLod(bracket, 12);
      agaGroup.add(bracket);

      const endFinial = new THREE.Mesh(sharedAgaTowelFinialGeo, agaBlackTrimMat);
      endFinial.name = `${railPrefix}.finial.${endLabel}`;
      endFinial.position.set(rx + endSide * (rLen * 0.5), 0.86, 0.44);
      tagHighLod(endFinial, 12);
      agaGroup.add(endFinial);
    }
  }

  northGroup.add(agaGroup);
}

export function buildBacksplashAndCookerHood(
  ctx: SceneBuilderContext,
  shared: KitchenCabinetrySharedContext
): void {
  const northUpperCutawayGroup = ctx.cutawayWallGroups.north;
  const { doveGreyMat, wallPlasterMat, stainlessSteelMat } = shared;

  // =========================================================================
  // 5. FULL-LENGTH CARRARA MARBLE BACKSPLASH & SMOOTH WIDE COOKER HOOD
  //    (15cm shorter on the right-hand side: spans X = -2.93m to -0.18m, center X = -1.555m, width 2.75m)
  // =========================================================================
  const marbleTex = createMarbleBacksplashTexture();
  const marbleBacksplashMat = new THREE.MeshStandardMaterial({
    map: marbleTex,
    roughness: 0.18,
    metalness: 0.04,
  });

  const wideHoodGroup = new THREE.Group();
  wideHoodGroup.name = 'kitchen.cabinetry.north.cookerHoodAndBacksplash';
  wideHoodGroup.position.set(-1.555, 0, -2.27);

  const marbleBacksplash = new THREE.Mesh(sharedBacksplashGeo, marbleBacksplashMat);
  marbleBacksplash.name = 'kitchen.cabinetry.north.cookerHoodAndBacksplash.marbleBacksplash';
  marbleBacksplash.position.set(0, 1.403, -2.482 - -2.27);
  marbleBacksplash.receiveShadow = true;
  wideHoodGroup.add(marbleBacksplash);

  // Mantel shelf at Y = 1.94m, chimney terminating cleanly against the Survey2Plan 2.54m flat ceiling soffit (Ceil 1609635)
  const mantleHood = new THREE.Mesh(sharedHoodMantleGeo, wallPlasterMat);
  mantleHood.name = 'kitchen.cabinetry.north.cookerHoodAndBacksplash.chimneyBreast';
  mantleHood.position.set(0, 2.24, 0.005);
  mantleHood.castShadow = true;
  mantleHood.receiveShadow = true;
  wideHoodGroup.add(mantleHood);

  for (const cx of [-1.285, 1.285] as const) {
    const corbel = new THREE.Mesh(sharedHoodCorbelGeo, doveGreyMat);
    corbel.name = `kitchen.cabinetry.north.cookerHoodAndBacksplash.corbel.${cx < 0 ? 'left' : 'right'}`;
    corbel.position.set(cx, 1.796, 0.015);
    wideHoodGroup.add(corbel);
  }

  const mantleShelfLower = new THREE.Mesh(sharedHoodShelfLowerGeo, doveGreyMat);
  mantleShelfLower.name = 'kitchen.cabinetry.north.cookerHoodAndBacksplash.mantleShelfLower';
  mantleShelfLower.position.set(0, 1.905, 0.015);
  wideHoodGroup.add(mantleShelfLower);

  const mantleShelf = new THREE.Mesh(sharedHoodShelfUpperGeo, doveGreyMat);
  mantleShelf.name = 'kitchen.cabinetry.north.cookerHoodAndBacksplash.mantleShelfUpper';
  mantleShelf.position.set(0, 1.938, 0.023);
  wideHoodGroup.add(mantleShelf);

  const hoodTopCornice = new THREE.Mesh(sharedHoodTopCorniceGeo, wallPlasterMat);
  hoodTopCornice.name = 'kitchen.cabinetry.north.cookerHoodAndBacksplash.topCornice';
  hoodTopCornice.position.set(0, 2.517, 0.01);
  wideHoodGroup.add(hoodTopCornice);

  for (const bx of [-0.64, 0.62] as const) {
    const baffle = new THREE.Mesh(sharedHoodBaffleGeo, stainlessSteelMat);
    baffle.name = `kitchen.cabinetry.north.cookerHoodAndBacksplash.greaseBaffle.${bx < 0 ? 'left' : 'right'}`;
    baffle.position.set(bx, 1.895, 0.02);
    wideHoodGroup.add(baffle);
  }

  northUpperCutawayGroup.add(wideHoodGroup);
}
