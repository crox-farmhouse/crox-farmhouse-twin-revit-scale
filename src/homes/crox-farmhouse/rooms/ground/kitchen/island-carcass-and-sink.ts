import * as THREE from 'three';
import type { SceneInteractionManager } from '../../../../../engine/interaction/interaction-manager.ts';
import {
  createBrushedStainlessTexture,
  createMarbleBacksplashTexture,
  createPolishedChromeTexture,
} from '../../../../../engine/textures/procedural-textures.ts';
import { buildHollowCabinetCarcass } from '../../../../../objects/joinery/cabinet-interior.ts';
import {
  nameCarcassHierarchy,
  prepGeo,
  sharedCabinetKnobGeo,
  tagHighLod,
} from './kitchen-joinery-shared.ts';

// Shared geometries for the Under-Counter Dual-Zone Wine Cooler
const cavW = 0.6;
const cavH = 0.76;
const cavMidY = 0.48;
const cavD = 0.36;
const wallT = 0.02;

const sharedCoolerBackWallGeo = prepGeo(new THREE.BoxGeometry(cavW, cavH, wallT));
const sharedCoolerSideWallGeo = prepGeo(new THREE.BoxGeometry(wallT, cavH, cavD));
const sharedCoolerTopBotWallGeo = prepGeo(new THREE.BoxGeometry(cavW - wallT * 2, wallT, cavD));
const sharedCoolerLedStripGeo = prepGeo(new THREE.BoxGeometry(0.5, 0.012, 0.04));
const sharedCoolerZoneDividerGeo = prepGeo(new THREE.BoxGeometry(0.56, 0.032, 0.31));
const sharedCoolerTempDisplayGeo = prepGeo(new THREE.PlaneGeometry(0.12, 0.016));
const sharedCoolerShelfGeo = prepGeo(new THREE.BoxGeometry(0.54, 0.018, 0.29));
const sharedWineBottleBodyGeo = prepGeo(new THREE.CylinderGeometry(0.032, 0.032, 0.18, 10));
const sharedWineBottleNeckGeo = prepGeo(new THREE.CylinderGeometry(0.012, 0.028, 0.065, 8));
const sharedWineBottleCapsuleGeo = prepGeo(new THREE.CylinderGeometry(0.0125, 0.0125, 0.022, 8));

const doorW = 0.596;
const doorH = 0.756;
const stileW = 0.046;
const doorThick = 0.024;
const innerPaneW = doorW - stileW * 2;
const innerPaneH = doorH - stileW * 2;

const sharedCoolerHorizGasketGeo = prepGeo(new THREE.BoxGeometry(doorW - 0.008, 0.024, 0.01));
const sharedCoolerVertGasketGeo = prepGeo(new THREE.BoxGeometry(0.024, doorH - 0.048, 0.01));
const sharedCoolerDoorRailGeo = prepGeo(new THREE.BoxGeometry(doorW, stileW, doorThick));
const sharedCoolerDoorStileGeo = prepGeo(new THREE.BoxGeometry(stileW, innerPaneH, doorThick));
const sharedCoolerDoorGlassGeo = prepGeo(new THREE.BoxGeometry(innerPaneW, innerPaneH, 0.012));
const sharedCoolerHandleBarGeo = prepGeo(new THREE.CylinderGeometry(0.009, 0.009, 0.52, 10));
const sharedCoolerHandleStandoffGeo = prepGeo(new THREE.BoxGeometry(0.014, 0.014, 0.026));

// Shared geometries for the Hague Blue Island Carcass, Shaker Doors, Worktop & Belfast Sink
const pierW = 0.875;
const pierD = 0.84;
const coolerApertureW = 0.6;
const pierCheekW = (pierW - coolerApertureW) * 0.5;

const sharedPierPlinthGeo = prepGeo(new THREE.BoxGeometry(pierW, 0.1, pierD));
const sharedPierPlinthVentGeo = prepGeo(new THREE.BoxGeometry(0.48, 0.024, 0.012));
const sharedPierCheekGeo = prepGeo(new THREE.BoxGeometry(pierCheekW, 0.8, pierD));
const sharedPierTopRailGeo = prepGeo(new THREE.BoxGeometry(coolerApertureW, 0.04, pierD));
const sharedPierRearCoreGeo = prepGeo(new THREE.BoxGeometry(coolerApertureW, 0.76, 0.48));
const sharedIslandRecessedBackGeo = prepGeo(new THREE.BoxGeometry(2.775, 0.9, 0.48));
const sharedIslandOverhangLegGeo = prepGeo(new THREE.BoxGeometry(0.06, 0.9, 0.36));
const sharedDishwasherTopLipGeo = prepGeo(new THREE.BoxGeometry(0.598, 0.014, 0.024));
const sharedIslandWorktopGeo = prepGeo(new THREE.BoxGeometry(3.8, 0.055, 1.52));
const sharedSinkRimGeo = prepGeo(new THREE.BoxGeometry(0.72, 0.02, 0.5));
const sharedSinkBasinGeo = prepGeo(new THREE.BoxGeometry(0.66, 0.016, 0.44));
const sharedIslandDrainerGrooveGeo = prepGeo(new THREE.BoxGeometry(0.46, 0.004, 0.011));
const sharedTapBaseGeo = prepGeo(new THREE.BoxGeometry(0.16, 0.025, 0.042));
const sharedTapStemGeo = prepGeo(new THREE.CylinderGeometry(0.014, 0.016, 0.26, 12));
const sharedTapSpoutGeo = prepGeo(new THREE.TorusGeometry(0.095, 0.013, 10, 18, Math.PI));
const sharedTapLeverGeo = prepGeo(new THREE.CylinderGeometry(0.004, 0.004, 0.065, 8));

export function buildUnderCounterWineCooler(
  islandGroup: THREE.Group,
  localX: number,
  frontZ: number,
  interactions: SceneInteractionManager,
  options?: {
    readonly groupName?: string;
    readonly yOffset?: number;
  }
): void {
  const coolerGroup = new THREE.Group();
  coolerGroup.name = options?.groupName ?? 'island.wineCooler';
  coolerGroup.position.set(localX, options?.yOffset ?? 0, frontZ);

  const brushedStainlessTex = createBrushedStainlessTexture();
  const stainlessMat = new THREE.MeshStandardMaterial({
    map: brushedStainlessTex,
    bumpMap: brushedStainlessTex,
    bumpScale: 0.003,
    color: 0xd8d6d0,
    roughness: 0.24,
    metalness: 0.35,
  });
  const darkCavityMat = new THREE.MeshStandardMaterial({
    color: 0x101318,
    roughness: 0.5,
  });
  const gasketMat = new THREE.MeshStandardMaterial({
    color: 0x0b0d11,
    roughness: 0.75,
  });
  const tintedGlassMat = new THREE.MeshStandardMaterial({
    color: 0x121820,
    transparent: true,
    opacity: 0.58,
    roughness: 0.1,
    metalness: 0.5,
  });
  const beechWoodMat = new THREE.MeshStandardMaterial({
    color: 0xb88652,
    roughness: 0.55,
  });
  const bottleGlassMat = new THREE.MeshStandardMaterial({
    color: 0x1c3322,
    roughness: 0.2,
    metalness: 0.3,
  });
  const foilMat = new THREE.MeshStandardMaterial({
    color: 0xc89d58,
    roughness: 0.25,
    metalness: 0.55,
  });

  // Hollow dark refrigerated wine cooler interior walls filling the 0.60m x 0.76m (y = 0.10..0.86m) aperture
  const backWall = new THREE.Mesh(sharedCoolerBackWallGeo, darkCavityMat);
  backWall.name = 'wineCooler.cavity.back';
  backWall.position.set(0, cavMidY, -cavD + wallT * 0.5);
  coolerGroup.add(backWall);

  for (const side of [-1, 1] as const) {
    const sideWall = new THREE.Mesh(sharedCoolerSideWallGeo, darkCavityMat);
    sideWall.name = side < 0 ? 'wineCooler.cavity.left' : 'wineCooler.cavity.right';
    sideWall.position.set(side * (cavW * 0.5 - wallT * 0.5), cavMidY, -cavD * 0.5);
    coolerGroup.add(sideWall);
  }
  for (const vSide of [-1, 1] as const) {
    const tbWall = new THREE.Mesh(sharedCoolerTopBotWallGeo, darkCavityMat);
    tbWall.name = vSide < 0 ? 'wineCooler.cavity.bottom' : 'wineCooler.cavity.top';
    tbWall.position.set(0, cavMidY + vSide * (cavH * 0.5 - wallT * 0.5), -cavD * 0.5);
    coolerGroup.add(tbWall);
  }

  // Warm amber interior display glow strip at top of wine cooler cavity
  const ledStrip = new THREE.Mesh(
    sharedCoolerLedStripGeo,
    new THREE.MeshBasicMaterial({ color: 0xffb85c })
  );
  ledStrip.name = 'wineCooler.ledStrip';
  ledStrip.position.set(0, 0.832, -0.08);
  tagHighLod(ledStrip, 12);
  coolerGroup.add(ledStrip);

  // Dual-zone digital temperature control bar in the middle
  const zoneDivider = new THREE.Mesh(sharedCoolerZoneDividerGeo, stainlessMat);
  zoneDivider.name = 'wineCooler.zoneDivider';
  zoneDivider.position.set(0, 0.48, -0.16);
  coolerGroup.add(zoneDivider);

  const tempDisplay = new THREE.Mesh(
    sharedCoolerTempDisplayGeo,
    new THREE.MeshBasicMaterial({ color: 0x6ec6ff })
  );
  tempDisplay.name = 'wineCooler.tempDisplay';
  tempDisplay.position.set(0, 0.48, -0.0005);
  tagHighLod(tempDisplay, 12);
  coolerGroup.add(tempDisplay);

  // 5 Beechwood slide-out wine shelves with full-length horizontal wine bottles inside the cavity
  const shelfHeights = [0.19, 0.3, 0.4, 0.59, 0.71] as const;
  const bottleXCoords = [-0.18, -0.09, 0.0, 0.09, 0.18] as const;
  for (let sIdx = 0; sIdx < shelfHeights.length; sIdx++) {
    const sy = shelfHeights[sIdx]!;
    const shelf = new THREE.Mesh(sharedCoolerShelfGeo, beechWoodMat);
    shelf.name = `wineCooler.shelf_${sIdx + 1}`;
    shelf.position.set(0, sy, -0.16);
    coolerGroup.add(shelf);

    for (let bIdx = 0; bIdx < bottleXCoords.length; bIdx++) {
      const bx = bottleXCoords[bIdx]!;
      const bottlePrefix = `wineCooler.shelf_${sIdx + 1}.bottle_${bIdx + 1}`;

      const bottleBody = new THREE.Mesh(sharedWineBottleBodyGeo, bottleGlassMat);
      bottleBody.name = `${bottlePrefix}.body`;
      bottleBody.rotation.x = Math.PI / 2;
      bottleBody.position.set(bx, sy + 0.038, -0.19);
      tagHighLod(bottleBody, 12);
      coolerGroup.add(bottleBody);

      const bottleNeck = new THREE.Mesh(sharedWineBottleNeckGeo, bottleGlassMat);
      bottleNeck.name = `${bottlePrefix}.neck`;
      bottleNeck.rotation.x = Math.PI / 2;
      bottleNeck.position.set(bx, sy + 0.038, -0.07);
      tagHighLod(bottleNeck, 12);
      coolerGroup.add(bottleNeck);

      const capsule = new THREE.Mesh(sharedWineBottleCapsuleGeo, foilMat);
      capsule.name = `${bottlePrefix}.capsule`;
      capsule.rotation.x = Math.PI / 2;
      capsule.position.set(bx, sy + 0.038, -0.03);
      tagHighLod(capsule, 12);
      coolerGroup.add(capsule);
    }
  }

  // Interactive hinged Brushed Stainless Steel + Tinted Glass Wine Cooler Door (0.596m x 0.756m, y = 0.102..0.858m)
  const coolerDoorGroup = new THREE.Group();
  coolerDoorGroup.name = 'wineCooler.door';
  coolerDoorGroup.position.set(0, cavMidY, 0.014);

  // Perimeter magnetic door gasket behind the stainless steel door frame
  for (const vSide of [-1, 1] as const) {
    const hGasket = new THREE.Mesh(sharedCoolerHorizGasketGeo, gasketMat);
    hGasket.name = `wineCooler.door.gasket.${vSide < 0 ? 'bottom' : 'top'}`;
    hGasket.position.set(0, vSide * (doorH * 0.5 - 0.016), -0.012);
    tagHighLod(hGasket, 12);
    coolerDoorGroup.add(hGasket);
  }
  for (const side of [-1, 1] as const) {
    const vGasket = new THREE.Mesh(sharedCoolerVertGasketGeo, gasketMat);
    vGasket.name = `wineCooler.door.gasket.${side < 0 ? 'left' : 'right'}`;
    vGasket.position.set(side * (doorW * 0.5 - 0.016), 0, -0.012);
    tagHighLod(vGasket, 12);
    coolerDoorGroup.add(vGasket);
  }

  const topRail = new THREE.Mesh(sharedCoolerDoorRailGeo, stainlessMat);
  topRail.name = 'wineCooler.door.topRail';
  topRail.position.set(0, (doorH - stileW) * 0.5, 0);
  topRail.castShadow = true;
  coolerDoorGroup.add(topRail);

  const botRail = new THREE.Mesh(sharedCoolerDoorRailGeo, stainlessMat);
  botRail.name = 'wineCooler.door.bottomRail';
  botRail.position.set(0, -(doorH - stileW) * 0.5, 0);
  botRail.castShadow = true;
  coolerDoorGroup.add(botRail);

  for (const side of [-1, 1] as const) {
    const vertStile = new THREE.Mesh(sharedCoolerDoorStileGeo, stainlessMat);
    vertStile.name = side < 0 ? 'wineCooler.door.leftStile' : 'wineCooler.door.rightStile';
    vertStile.position.set(side * ((doorW - stileW) * 0.5), 0, 0);
    vertStile.castShadow = true;
    coolerDoorGroup.add(vertStile);
  }

  // Tinted UV-Glass window pane
  const glassPane = new THREE.Mesh(sharedCoolerDoorGlassGeo, tintedGlassMat);
  glassPane.name = 'wineCooler.door.glass';
  glassPane.position.set(0, 0, 0.002);
  coolerDoorGroup.add(glassPane);

  // Vertical brushed stainless steel bar handle on the right stile of the wine cooler door
  const handleX = (doorW - stileW) * 0.5;
  const handleBar = new THREE.Mesh(sharedCoolerHandleBarGeo, stainlessMat);
  handleBar.name = 'wineCooler.door.handle';
  handleBar.position.set(handleX, 0, 0.034);
  coolerDoorGroup.add(handleBar);

  for (const hy of [-0.21, 0.21] as const) {
    const standoff = new THREE.Mesh(sharedCoolerHandleStandoffGeo, stainlessMat);
    standoff.name = `wineCooler.door.handleStandoff.${hy < 0 ? 'bottom' : 'top'}`;
    standoff.position.set(handleX, hy, 0.018);
    tagHighLod(standoff, 12);
    coolerDoorGroup.add(standoff);
  }

  coolerGroup.add(coolerDoorGroup);
  const doorPivot = interactions.registerHingedDoor(
    coolerGroup,
    coolerDoorGroup,
    new THREE.Vector3(-(doorW - stileW) * 0.5, 0, 0),
    'y',
    -Math.PI * 0.62
  );
  doorPivot.name = 'wineCooler.door.pivot';

  islandGroup.add(coolerGroup);
}

export function buildIslandCarcassWorktopAndSink(
  islandGroup: THREE.Group,
  interactions: SceneInteractionManager
): void {
  const hagueBlueMat = new THREE.MeshStandardMaterial({
    color: 0x1e364b,
    roughness: 0.48,
    metalness: 0.06,
  });
  const islandMarbleTex = createMarbleBacksplashTexture();
  islandMarbleTex.wrapS = THREE.RepeatWrapping;
  islandMarbleTex.wrapT = THREE.RepeatWrapping;
  islandMarbleTex.repeat.set(2.0, 1.0);

  const islandWorktopMat = new THREE.MeshStandardMaterial({
    map: islandMarbleTex,
    roughness: 0.18,
    metalness: 0.04,
  });
  const drainerGrooveMat = new THREE.MeshStandardMaterial({
    color: 0xd8d3c8,
    roughness: 0.26,
    metalness: 0.03,
  });
  const brushedStainlessTex = createBrushedStainlessTexture();
  const stainlessLipMat = new THREE.MeshStandardMaterial({
    map: brushedStainlessTex,
    bumpMap: brushedStainlessTex,
    bumpScale: 0.003,
    color: 0xc8c5be,
    roughness: 0.28,
    metalness: 0.48,
  });
  // Island cupboard door knobs are Brushed Stainless Steel (reacting 100% to room lighting)
  const chromeKnobMat = new THREE.MeshStandardMaterial({
    map: brushedStainlessTex,
    bumpMap: brushedStainlessTex,
    bumpScale: 0.003,
    color: 0xc8c5be,
    roughness: 0.28,
    metalness: 0.48,
  });
  // Island sink mixer tap is smooth Polished Chrome
  const polishedChromeTapMat = new THREE.MeshStandardMaterial({
    map: createPolishedChromeTexture(),
    color: 0xe8e5de,
    roughness: 0.06,
    metalness: 0.55,
  });

  // Shared geometries for the 6 identical 0.60m x 0.75m Howdens Island Shaker doors
  const doorWIsland = 0.6;
  const doorHIsland = 0.75;
  const doorStileWIsland = 0.062;
  const doorFrameDepthIsland = 0.022;
  const doorInnerRailWIsland = Math.max(0.04, doorWIsland - doorStileWIsland * 2);

  const sharedIslandDoorInsetGeo = prepGeo(
    new THREE.BoxGeometry(doorWIsland - 0.01, doorHIsland - 0.01, 0.01)
  );
  const sharedIslandDoorStileGeo = prepGeo(
    new THREE.BoxGeometry(doorStileWIsland, doorHIsland, doorFrameDepthIsland)
  );
  const sharedIslandDoorRailGeo = prepGeo(
    new THREE.BoxGeometry(doorInnerRailWIsland, doorStileWIsland, doorFrameDepthIsland)
  );

  /**
   * Builds a Howdens-style full-overlay (lay-on) Shaker door with a genuinely INSET center panel
   * and 4 raised outer stiles & rails (left/right stiles + top/bottom rails protruding 12mm proud of the center).
   */
  const addHowdensIslandShakerDoor = (
    doorName: string,
    cx: number,
    cy: number,
    carcassZ: number,
    facingDir: 1 | -1
  ): THREE.Group => {
    const doorGroup = new THREE.Group();
    doorGroup.name = doorName;
    doorGroup.position.set(cx, cy, carcassZ);

    // 1. Recessed flat center panel (10mm thick, sitting close to the carcass face)
    const insetPanel = new THREE.Mesh(sharedIslandDoorInsetGeo, hagueBlueMat);
    insetPanel.name = `${doorName}.insetPanel`;
    insetPanel.position.set(0, 0, facingDir * 0.005);
    insetPanel.receiveShadow = true;
    doorGroup.add(insetPanel);

    // 2. Raised Left & Right Vertical Shaker Stiles (22mm thick -> 12mm proud of the inset center panel!)
    const frameCenterZ = facingDir * (doorFrameDepthIsland * 0.5);
    for (const side of [-1, 1] as const) {
      const stile = new THREE.Mesh(sharedIslandDoorStileGeo, hagueBlueMat);
      stile.name = `${doorName}.stile.${side < 0 ? 'left' : 'right'}`;
      stile.position.set(
        side * (doorWIsland * 0.5 - doorStileWIsland * 0.5),
        0,
        frameCenterZ
      );
      stile.castShadow = true;
      stile.receiveShadow = true;
      doorGroup.add(stile);
    }

    // 3. Raised Top & Bottom Horizontal Shaker Rails between the stiles
    for (const vSide of [-1, 1] as const) {
      const rail = new THREE.Mesh(sharedIslandDoorRailGeo, hagueBlueMat);
      rail.name = `${doorName}.rail.${vSide < 0 ? 'bottom' : 'top'}`;
      rail.position.set(
        0,
        vSide * (doorHIsland * 0.5 - doorStileWIsland * 0.5),
        frameCenterZ
      );
      rail.castShadow = true;
      rail.receiveShadow = true;
      doorGroup.add(rail);
    }

    islandGroup.add(doorGroup);
    return doorGroup;
  };

  // 1. Kitchen-Side (-Z) Hollow Cabinet Carcasses (z = -0.73m to -0.11m, depth 0.62m):
  //    - Bay 0 (localX = -1.515m): Integrated Dishwasher Tub with wire crockery racks & dinner plates
  nameCarcassHierarchy(
    buildHollowCabinetCarcass(islandGroup, -1.52, 0.45, -0.42, 0.61, 0.9, 0.62, '-z', hagueBlueMat, {
      plinthH: 0.14,
      interiorStyle: 'dishwasher',
    }),
    'kitchen.island.carcass.dishwasherBay'
  );
  //    - Bay 1 (localX = -0.909m): Under-Sink Cupboard with plumbing trap & storage caddy
  nameCarcassHierarchy(
    buildHollowCabinetCarcass(islandGroup, -0.91, 0.45, -0.42, 0.61, 0.9, 0.62, '-z', hagueBlueMat, {
      plinthH: 0.14,
      interiorStyle: 'underSink',
    }),
    'kitchen.island.carcass.underSinkBay'
  );
  //    - Bays 2 & 3 (localX = 0.0m): Double Central Island Cupboard with oak interior & shelf
  nameCarcassHierarchy(
    buildHollowCabinetCarcass(islandGroup, 0.0, 0.45, -0.42, 1.21, 0.9, 0.62, '-z', hagueBlueMat, {
      plinthH: 0.14,
      dividers: 1,
      interiorStyle: 'oak',
    }),
    'kitchen.island.carcass.centralDoubleBay'
  );
  //    - Bays 4 & 5 (localX = +1.212m): Double Right Island Cupboard with oak interior & shelf
  nameCarcassHierarchy(
    buildHollowCabinetCarcass(islandGroup, 1.212, 0.45, -0.42, 1.215, 0.9, 0.62, '-z', hagueBlueMat, {
      plinthH: 0.14,
      dividers: 1,
      interiorStyle: 'oak',
    }),
    'kitchen.island.carcass.rightDoubleBay'
  );

  // 2. Stool-Side (+Z) Left Pier Housing the Under-Counter Wine Cooler (localX = -1.3875m, z = -0.11m to +0.73m, depth 0.84m)
  const pierCx = -1.3875;
  const pierCz = 0.31;

  // Bottom Hague Blue plinth (y = 0.00..0.10m) across full pier width + recessed ventilation grille
  const pierPlinth = new THREE.Mesh(sharedPierPlinthGeo, hagueBlueMat);
  pierPlinth.name = 'island.wineCoolerPier.plinth';
  pierPlinth.position.set(pierCx, 0.05, pierCz);
  pierPlinth.castShadow = true;
  pierPlinth.receiveShadow = true;
  islandGroup.add(pierPlinth);

  const plinthVent = new THREE.Mesh(
    sharedPierPlinthVentGeo,
    new THREE.MeshStandardMaterial({ color: 0x0b0e12, roughness: 0.7 })
  );
  plinthVent.name = 'island.wineCoolerPier.plinthVent';
  plinthVent.position.set(pierCx, 0.05, 0.73);
  tagHighLod(plinthVent, 12);
  islandGroup.add(plinthVent);

  // Left & Right solid Hague Blue pier cheeks (y = 0.10..0.90m) framing the 0.60m wine cooler opening
  for (const side of [-1, 1] as const) {
    const pierCheek = new THREE.Mesh(sharedPierCheekGeo, hagueBlueMat);
    pierCheek.name =
      side < 0 ? 'island.wineCoolerPier.leftCheek' : 'island.wineCoolerPier.rightCheek';
    pierCheek.position.set(
      pierCx + side * (coolerApertureW * 0.5 + pierCheekW * 0.5),
      0.5,
      pierCz
    );
    pierCheek.castShadow = true;
    pierCheek.receiveShadow = true;
    islandGroup.add(pierCheek);
  }

  // Top Hague Blue fascia rail above the wine cooler door (y = 0.86..0.90m)
  const pierTopRail = new THREE.Mesh(sharedPierTopRailGeo, hagueBlueMat);
  pierTopRail.name = 'island.wineCoolerPier.topRail';
  pierTopRail.position.set(pierCx, 0.88, pierCz);
  pierTopRail.castShadow = true;
  pierTopRail.receiveShadow = true;
  islandGroup.add(pierTopRail);

  // Rear solid Hague Blue backing behind the 0.36m-deep wine cooler cavity (z = -0.11..+0.37m)
  const pierRearCore = new THREE.Mesh(sharedPierRearCoreGeo, hagueBlueMat);
  pierRearCore.name = 'island.wineCoolerPier.rearBacking';
  pierRearCore.position.set(pierCx, 0.48, 0.13);
  pierRearCore.castShadow = true;
  pierRearCore.receiveShadow = true;
  islandGroup.add(pierRearCore);

  // Wine Cooler mounted FLUSH with the front overhang at z = +0.73m (centered on left pier at localX = -1.3875m)
  buildUnderCounterWineCooler(islandGroup, -1.3875, 0.73, interactions);

  // 3. Solid Recessed Back Section under the 390mm Stool Overhang (localX = -0.95m to +1.825m, z = -0.11m to +0.37m, depth 0.48m)
  const rightRecessedBase = new THREE.Mesh(sharedIslandRecessedBackGeo, hagueBlueMat);
  rightRecessedBase.name = 'kitchen.island.recessedBackPanel';
  rightRecessedBase.position.set(0.4375, 0.45, 0.13);
  rightRecessedBase.castShadow = true;
  rightRecessedBase.receiveShadow = true;
  islandGroup.add(rightRecessedBase);

  // Right-end support leg/panel flush with the front overhang at localX = +1.795m (z = +0.37m to +0.73m)
  const rightOverhangEndLeg = new THREE.Mesh(sharedIslandOverhangLegGeo, hagueBlueMat);
  rightOverhangEndLeg.name = 'kitchen.island.rightOverhangEndLeg';
  rightOverhangEndLeg.position.set(1.795, 0.45, 0.55);
  rightOverhangEndLeg.castShadow = true;
  islandGroup.add(rightOverhangEndLeg);

  // Howdens Full-Overlay Doors along the Back Face (-Z cooking/sink side at z = -0.73m):
  // 6 full-overlay doors spanning localX = -1.82m to +1.82m (each 0.60m wide x 0.75m tall above the 14cm kickboard, with 6mm gaps)
  const backDoorCentersX = [-1.515, -0.909, -0.303, 0.303, 0.909, 1.515] as const;
  for (let i = 0; i < backDoorCentersX.length; i++) {
    const bx = backDoorCentersX[i] ?? 0;
    const isDishwasher = i === 0;
    const doorName = isDishwasher
      ? 'kitchen.island.backDoor.dishwasher'
      : `kitchen.island.backDoor_${i + 1}`;
    const doorGroup = addHowdensIslandShakerDoor(doorName, bx, 0.515, -0.73, -1);

    if (isDishwasher) {
      // Top-edge stainless control fascia lip of the integrated dishwasher
      const dwTopLip = new THREE.Mesh(sharedDishwasherTopLipGeo, stainlessLipMat);
      dwTopLip.name = `${doorName}.topControlLip`;
      dwTopLip.position.set(0, 0.894 - 0.515, -0.011);
      tagHighLod(dwTopLip, 12);
      doorGroup.add(dwTopLip);

      // Central brushed stainless knob on the integrated dishwasher door
      const dwKnob = new THREE.Mesh(sharedCabinetKnobGeo, chromeKnobMat);
      dwKnob.name = `${doorName}.knob`;
      dwKnob.scale.set(1, 1, 0.75);
      dwKnob.position.set(0, 0.83 - 0.515, -0.03);
      tagHighLod(dwKnob, 12);
      doorGroup.add(dwKnob);

      // Integrated dishwasher drops down around its bottom horizontal edge
      const pivot = interactions.registerHingedDoor(
        islandGroup,
        doorGroup,
        new THREE.Vector3(0, -0.375, -0.011),
        'x',
        -Math.PI * 0.45
      );
      pivot.name = `${doorName}.pivot`;
    } else {
      // Paired doors open from their meeting stiles
      const knobOffset = i % 2 === 1 ? 0.235 : -0.235;
      const hingeSideX: -1 | 1 = i % 2 === 1 ? -1 : 1;
      const knob = new THREE.Mesh(sharedCabinetKnobGeo, chromeKnobMat);
      knob.name = `${doorName}.knob`;
      knob.scale.set(1, 1, 0.75);
      knob.position.set(knobOffset, 0.81 - 0.515, -0.03);
      tagHighLod(knob, 12);
      doorGroup.add(knob);

      const pivot = interactions.registerHingedDoor(
        islandGroup,
        doorGroup,
        new THREE.Vector3(hingeSideX * (0.6 * 0.5 - 0.012), 0, -0.011),
        'y',
        -hingeSideX * Math.PI * 0.62
      );
      pivot.name = `${doorName}.pivot`;
    }
  }

  // Worktop (3.80m x 1.52m, z = -0.76m to +0.76m) in matching Carrara marble
  const worktop = new THREE.Mesh(sharedIslandWorktopGeo, islandWorktopMat);
  worktop.name = 'kitchen.island.worktop';
  worktop.position.set(0, 0.927, 0.0);
  worktop.castShadow = true;
  worktop.receiveShadow = true;
  islandGroup.add(worktop);

  // Sink at localX = -0.71m, z = -0.36m
  const sinkX = -0.71;
  const sinkZ = -0.36;

  const sinkRim = new THREE.Mesh(
    sharedSinkRimGeo,
    new THREE.MeshStandardMaterial({ color: 0xfaf8f2, roughness: 0.18 })
  );
  sinkRim.name = 'kitchen.island.sink.rim';
  sinkRim.position.set(sinkX, 0.95, sinkZ);
  islandGroup.add(sinkRim);

  const sinkBasin = new THREE.Mesh(
    sharedSinkBasinGeo,
    new THREE.MeshStandardMaterial({ color: 0xc8c4ba, roughness: 0.28 })
  );
  sinkBasin.name = 'kitchen.island.sink.basin';
  sinkBasin.position.set(sinkX, 0.957, sinkZ);
  islandGroup.add(sinkBasin);

  // Routed Sink Drainage Grooves in the marble worktop above the Integrated Dishwasher
  const grooveZCoords = [-0.52, -0.467, -0.413, -0.36, -0.307, -0.253, -0.2] as const;
  for (let i = 0; i < grooveZCoords.length; i++) {
    const gz = grooveZCoords[i]!;
    const groove = new THREE.Mesh(sharedIslandDrainerGrooveGeo, drainerGrooveMat);
    groove.name = `kitchen.island.sink.drainerGroove_${i + 1}`;
    groove.position.set(-1.33, 0.9605, gz);
    tagHighLod(groove, 12);
    islandGroup.add(groove);
  }

  // Polished Chrome Swan-Neck Mixer Tap mounted on the +Z (inner island) side of the sink (z = -0.08m),
  // arching back (-Z) over the sink basin!
  const tapZ = sinkZ + 0.28; // -0.08m
  const tapBase = new THREE.Mesh(sharedTapBaseGeo, polishedChromeTapMat);
  tapBase.name = 'kitchen.island.sink.tap.base';
  tapBase.position.set(sinkX, 0.965, tapZ);
  tagHighLod(tapBase, 12);
  islandGroup.add(tapBase);

  const tapStem = new THREE.Mesh(sharedTapStemGeo, polishedChromeTapMat);
  tapStem.name = 'kitchen.island.sink.tap.stem';
  tapStem.position.set(sinkX, 1.09, tapZ);
  tapStem.castShadow = true;
  islandGroup.add(tapStem);

  const tapSpout = new THREE.Mesh(sharedTapSpoutGeo, polishedChromeTapMat);
  tapSpout.name = 'kitchen.island.sink.tap.spout';
  tapSpout.rotation.y = -Math.PI / 2;
  tapSpout.position.set(sinkX, 1.21, tapZ - 0.095);
  tapSpout.castShadow = true;
  islandGroup.add(tapSpout);

  // Chrome mixer lever on the side of the tap base
  const tapLever = new THREE.Mesh(sharedTapLeverGeo, polishedChromeTapMat);
  tapLever.name = 'kitchen.island.sink.tap.lever';
  tapLever.rotation.z = -0.45;
  tapLever.position.set(sinkX + 0.045, 1.015, tapZ);
  tagHighLod(tapLever, 12);
  islandGroup.add(tapLever);
}
