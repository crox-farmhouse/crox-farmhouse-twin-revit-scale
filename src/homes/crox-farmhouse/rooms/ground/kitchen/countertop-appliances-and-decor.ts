import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../../core/types/scene.ts';
import {
  createBrushedStainlessTexture,
  createPolishedChromeTexture,
} from '../../../../../engine/textures/procedural-textures.ts';
import {
  type KitchenCabinetrySharedContext,
  prepGeo,
  tagHighLod,
} from './kitchen-joinery-shared.ts';

// Shared geometries for Dualit 4-slot toaster
const sharedToasterBasePlinthGeo = prepGeo(new THREE.BoxGeometry(0.32, 0.022, 0.21));
const sharedToasterBodyGeo = prepGeo(new THREE.BoxGeometry(0.3, 0.18, 0.2));
const sharedToasterTopRollGeo = prepGeo(new THREE.CylinderGeometry(0.014, 0.014, 0.304, 14));
const sharedToasterEndCheekGeo = prepGeo(new THREE.BoxGeometry(0.026, 0.184, 0.208));
const sharedToasterEndCrownGeo = prepGeo(new THREE.CylinderGeometry(0.014, 0.014, 0.206, 14));
const sharedToasterSlotRimGeo = prepGeo(new THREE.BoxGeometry(0.036, 0.006, 0.145));
const sharedToasterSlotGeo = prepGeo(new THREE.BoxGeometry(0.026, 0.008, 0.135));
const sharedToasterControlPlateGeo = prepGeo(new THREE.BoxGeometry(0.21, 0.135, 0.004));
const sharedToasterBadgeGeo = prepGeo(new THREE.BoxGeometry(0.065, 0.018, 0.008));
const sharedToasterTimerDialGeo = prepGeo(new THREE.CylinderGeometry(0.018, 0.018, 0.018, 14));
const sharedToasterLeverTrackGeo = prepGeo(new THREE.BoxGeometry(0.01, 0.085, 0.006));
const sharedToasterEjectorKnobGeo = prepGeo(new THREE.BoxGeometry(0.034, 0.016, 0.026));
const sharedToasterCrumbTrayGeo = prepGeo(new THREE.BoxGeometry(0.24, 0.012, 0.016));

// Shared geometries for Sage Dual Boiler & Smart Grinder Pro
const sharedEspressoBodyGeo = prepGeo(new THREE.BoxGeometry(0.37, 0.35, 0.25));
const sharedEspressoWarmingTrayGeo = prepGeo(new THREE.BoxGeometry(0.31, 0.006, 0.19));
const sharedEspressoSideColumnGeo = prepGeo(new THREE.CylinderGeometry(0.018, 0.018, 0.35, 14));
const sharedEspressoUpperHeaderGeo = prepGeo(new THREE.BoxGeometry(0.374, 0.105, 0.095));
const sharedEspressoHeaderRollGeo = prepGeo(new THREE.CylinderGeometry(0.014, 0.014, 0.374, 14));
const sharedEspressoCupRailGeo = prepGeo(new THREE.CylinderGeometry(0.005, 0.005, 0.35, 10));
const sharedEspressoDripBaseGeo = prepGeo(new THREE.BoxGeometry(0.372, 0.044, 0.145));
const sharedEspressoDripGrilleGeo = prepGeo(new THREE.BoxGeometry(0.352, 0.008, 0.126));
const sharedEspressoSplashPanelGeo = prepGeo(new THREE.PlaneGeometry(0.34, 0.2));
const sharedEspressoGaugeBezelGeo = prepGeo(new THREE.CylinderGeometry(0.027, 0.027, 0.012, 20));
const sharedEspressoGaugeFaceGeo = prepGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.014, 20));
const sharedEspressoLcdBezelGeo = prepGeo(new THREE.BoxGeometry(0.042, 0.024, 0.006));
const sharedEspressoLcdScreenGeo = prepGeo(new THREE.PlaneGeometry(0.036, 0.018));
const sharedEspressoControlBtnGeo = prepGeo(new THREE.CylinderGeometry(0.008, 0.008, 0.008, 12));
const sharedEspressoSteamHubGeo = prepGeo(new THREE.SphereGeometry(0.014, 12, 10));
const sharedEspressoSteamStickGeo = prepGeo(new THREE.CylinderGeometry(0.0045, 0.006, 0.042, 10));
const sharedEspressoSteamWandGeo = prepGeo(new THREE.CylinderGeometry(0.005, 0.004, 0.175, 10));
const sharedEspressoHotWaterDialGeo = prepGeo(new THREE.CylinderGeometry(0.015, 0.015, 0.016, 16));
const sharedEspressoGroupCollarGeo = prepGeo(new THREE.CylinderGeometry(0.044, 0.042, 0.022, 18));
const sharedEspressoGroupHeadGeo = prepGeo(new THREE.CylinderGeometry(0.04, 0.038, 0.042, 18));
const sharedEspressoPortafilterBasketGeo = prepGeo(
  new THREE.CylinderGeometry(0.036, 0.032, 0.034, 18)
);
const sharedEspressoPortafilterNeckGeo = prepGeo(
  new THREE.CylinderGeometry(0.009, 0.009, 0.035, 10)
);
const sharedEspressoPortafilterHandleGeo = prepGeo(
  new THREE.CylinderGeometry(0.011, 0.014, 0.12, 12)
);
const sharedEspressoWarmingCupGeo = prepGeo(new THREE.CylinderGeometry(0.026, 0.02, 0.045, 12));

const sharedGrinderPlinthGeo = prepGeo(new THREE.BoxGeometry(0.154, 0.024, 0.195));
const sharedGrinderBaseGeo = prepGeo(new THREE.BoxGeometry(0.15, 0.22, 0.185));
const sharedGrinderFrontTrimGeo = prepGeo(new THREE.BoxGeometry(0.152, 0.08, 0.03));
const sharedGrinderLcdGeo = prepGeo(new THREE.PlaneGeometry(0.044, 0.032));
const sharedGrinderChuteGeo = prepGeo(new THREE.BoxGeometry(0.042, 0.085, 0.055));
const sharedGrinderHopperGeo = prepGeo(new THREE.CylinderGeometry(0.078, 0.056, 0.13, 18));
const sharedGrinderHopperLidGeo = prepGeo(new THREE.CylinderGeometry(0.08, 0.08, 0.015, 18));

// Shared geometries for 4-zone Induction Hob
const sharedHobGlassGeo = prepGeo(new THREE.BoxGeometry(0.82, 0.012, 0.52));
const sharedHobBevelGeo = prepGeo(new THREE.BoxGeometry(0.835, 0.006, 0.535));
const sharedHobCrosshairGeo = prepGeo(new THREE.PlaneGeometry(0.03, 0.003));
const sharedHobTouchBarGeo = prepGeo(new THREE.PlaneGeometry(0.36, 0.028));

export function buildDualitToaster(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number
): void {
  const toasterGroup = new THREE.Group();
  toasterGroup.name = 'kitchen.cabinetry.dualitToaster';
  toasterGroup.position.set(x, y, z);

  const polishedChromeTex = createPolishedChromeTexture();

  // Dualit toaster is smooth polished mirror chrome (NOT brushed), reacting 100% to room lights
  const mirrorChromeMat = new THREE.MeshStandardMaterial({
    map: polishedChromeTex,
    color: 0xe8e5de,
    roughness: 0.06,
    metalness: 0.54,
  });
  const castChromeEndMat = new THREE.MeshStandardMaterial({
    map: polishedChromeTex,
    color: 0xd6d3cb,
    roughness: 0.12,
    metalness: 0.52,
  });
  const darkSlotMat = new THREE.MeshStandardMaterial({
    color: 0x16191d,
    roughness: 0.45,
  });
  const brassDialMat = new THREE.MeshStandardMaterial({
    color: 0xc59b58,
    roughness: 0.22,
    metalness: 0.56,
  });

  // Black rubber feet / base plinth
  const basePlinth = new THREE.Mesh(sharedToasterBasePlinthGeo, darkSlotMat);
  basePlinth.name = 'kitchen.cabinetry.dualitToaster.basePlinth';
  basePlinth.position.set(0, 0.011, 0);
  tagHighLod(basePlinth, 12);
  toasterGroup.add(basePlinth);

  // Main 4-slot Dualit mirror-chrome body
  const body = new THREE.Mesh(sharedToasterBodyGeo, mirrorChromeMat);
  body.name = 'kitchen.cabinetry.dualitToaster.body';
  body.position.set(0, 0.108, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  toasterGroup.add(body);

  // Rounded front & rear top chrome shoulders
  for (const sz of [-0.092, 0.092] as const) {
    const topRoll = new THREE.Mesh(sharedToasterTopRollGeo, mirrorChromeMat);
    topRoll.name = `kitchen.cabinetry.dualitToaster.topRoll.${sz < 0 ? 'back' : 'front'}`;
    topRoll.rotation.z = Math.PI / 2;
    topRoll.position.set(0, 0.194, sz);
    tagHighLod(topRoll, 12);
    toasterGroup.add(topRoll);
  }

  // Classic Dualit cast-chrome left & right end cheeks with rounded top crown
  for (const side of [-1, 1] as const) {
    const sideLabel = side < 0 ? 'left' : 'right';
    const endCheek = new THREE.Mesh(sharedToasterEndCheekGeo, castChromeEndMat);
    endCheek.name = `kitchen.cabinetry.dualitToaster.endCheek.${sideLabel}`;
    endCheek.position.set(side * 0.151, 0.11, 0);
    endCheek.castShadow = true;
    toasterGroup.add(endCheek);

    const endCrown = new THREE.Mesh(sharedToasterEndCrownGeo, castChromeEndMat);
    endCrown.name = `kitchen.cabinetry.dualitToaster.endCrown.${sideLabel}`;
    endCrown.rotation.x = Math.PI / 2;
    endCrown.position.set(side * 0.151, 0.198, 0);
    tagHighLod(endCrown, 12);
    toasterGroup.add(endCrown);
  }

  // 4 Top bread slots running front-to-back with polished chrome slot surrounds
  const slotXCoords = [-0.096, -0.032, 0.032, 0.096] as const;
  for (let i = 0; i < slotXCoords.length; i++) {
    const sx = slotXCoords[i]!;
    const slotRim = new THREE.Mesh(sharedToasterSlotRimGeo, mirrorChromeMat);
    slotRim.name = `kitchen.cabinetry.dualitToaster.slotRim_${i + 1}`;
    slotRim.position.set(sx, 0.201, 0);
    tagHighLod(slotRim, 12);
    toasterGroup.add(slotRim);

    const slot = new THREE.Mesh(sharedToasterSlotGeo, darkSlotMat);
    slot.name = `kitchen.cabinetry.dualitToaster.slot_${i + 1}`;
    slot.position.set(sx, 0.203, 0);
    tagHighLod(slot, 12);
    toasterGroup.add(slot);
  }

  // Dark recessed front control fascia plate behind the Dualit timer & ejector lever
  const frontControlPlate = new THREE.Mesh(
    sharedToasterControlPlateGeo,
    new THREE.MeshStandardMaterial({
      color: 0x2a2d32,
      roughness: 0.35,
      metalness: 0.5,
    })
  );
  frontControlPlate.name = 'kitchen.cabinetry.dualitToaster.frontControlPlate';
  frontControlPlate.position.set(0, 0.112, 0.101);
  tagHighLod(frontControlPlate, 12);
  toasterGroup.add(frontControlPlate);

  // Front Dualit badge, rotary mechanical timer dial, and manual ejector lever
  const badge = new THREE.Mesh(sharedToasterBadgeGeo, brassDialMat);
  badge.name = 'kitchen.cabinetry.dualitToaster.badge';
  badge.position.set(-0.07, 0.16, 0.104);
  tagHighLod(badge, 12);
  toasterGroup.add(badge);

  const timerDial = new THREE.Mesh(sharedToasterTimerDialGeo, darkSlotMat);
  timerDial.name = 'kitchen.cabinetry.dualitToaster.timerDial';
  timerDial.rotation.x = Math.PI / 2;
  timerDial.position.set(-0.07, 0.095, 0.107);
  tagHighLod(timerDial, 12);
  toasterGroup.add(timerDial);

  const leverTrack = new THREE.Mesh(sharedToasterLeverTrackGeo, darkSlotMat);
  leverTrack.name = 'kitchen.cabinetry.dualitToaster.leverTrack';
  leverTrack.position.set(0.07, 0.105, 0.103);
  tagHighLod(leverTrack, 12);
  toasterGroup.add(leverTrack);

  const ejectorKnob = new THREE.Mesh(sharedToasterEjectorKnobGeo, darkSlotMat);
  ejectorKnob.name = 'kitchen.cabinetry.dualitToaster.ejectorKnob';
  ejectorKnob.position.set(0.07, 0.13, 0.113);
  tagHighLod(ejectorKnob, 12);
  toasterGroup.add(ejectorKnob);

  // Pull-out chrome crumb tray handle at bottom front
  const crumbTray = new THREE.Mesh(sharedToasterCrumbTrayGeo, mirrorChromeMat);
  crumbTray.name = 'kitchen.cabinetry.dualitToaster.crumbTray';
  crumbTray.position.set(0, 0.03, 0.105);
  tagHighLod(crumbTray, 12);
  toasterGroup.add(crumbTray);

  parent.add(toasterGroup);
}

export function buildCoffeeMachineAndGrinder(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  rotY = 0
): void {
  const coffeeStation = new THREE.Group();
  coffeeStation.name = 'kitchen.espressoMachineAndGrinder';
  coffeeStation.position.set(x, y, z);
  coffeeStation.rotation.y = rotY;

  const brushedStainlessTex = createBrushedStainlessTexture();
  const polishedChromeTex = createPolishedChromeTexture();

  // Brushed Stainless Steel casing for the Sage Dual Boiler (BES920) & Smart Grinder Pro
  const brushedStainlessMat = new THREE.MeshStandardMaterial({
    map: brushedStainlessTex,
    bumpMap: brushedStainlessTex,
    bumpScale: 0.004,
    color: 0xc8c5be,
    roughness: 0.28,
    metalness: 0.48,
  });
  const darkStainlessRecessMat = new THREE.MeshStandardMaterial({
    map: brushedStainlessTex,
    bumpMap: brushedStainlessTex,
    bumpScale: 0.003,
    color: 0x76746e,
    roughness: 0.34,
    metalness: 0.46,
  });
  // Small polished chrome accents (group head, portafilter basket, steam wand)
  const mirrorChromeMat = new THREE.MeshStandardMaterial({
    map: polishedChromeTex,
    color: 0xe6e3dc,
    roughness: 0.08,
    metalness: 0.54,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x181b1f,
    roughness: 0.4,
    metalness: 0.25,
  });
  const lcdBacklightMat = new THREE.MeshBasicMaterial({
    color: 0x78b8e8,
  });
  const gaugeFaceMat = new THREE.MeshBasicMaterial({
    color: 0xedeae2,
  });
  const hopperMat = new THREE.MeshStandardMaterial({
    color: 0x3b2a1c,
    transparent: true,
    opacity: 0.72,
    roughness: 0.18,
  });
  const ceramicCupMat = new THREE.MeshStandardMaterial({
    color: 0xf6f3ec,
    roughness: 0.18,
  });

  // =========================================================================
  // SAGE DUAL BOILER (BES920) ESPRESSO MACHINE (at localX = -0.14m)
  // =========================================================================
  const mx = -0.14;

  // 1. Rear & main brushed stainless boiler housing (0.37m wide x 0.35m tall x 0.25m deep)
  const machineBody = new THREE.Mesh(sharedEspressoBodyGeo, brushedStainlessMat);
  machineBody.name = 'kitchen.espressoMachineAndGrinder.dualBoiler.body';
  machineBody.position.set(mx, 0.175, -0.02);
  machineBody.castShadow = true;
  machineBody.receiveShadow = true;
  coffeeStation.add(machineBody);

  // Recessed darker stainless cup-warming tray on top so the top of the machine has realistic contrast
  const topWarmingTray = new THREE.Mesh(sharedEspressoWarmingTrayGeo, darkStainlessRecessMat);
  topWarmingTray.name = 'kitchen.espressoMachineAndGrinder.dualBoiler.topWarmingTray';
  topWarmingTray.position.set(mx, 0.352, -0.02);
  coffeeStation.add(topWarmingTray);

  // Brushed stainless vertical curved side columns on left & right of the Sage Dual Boiler
  for (const side of [-1, 1] as const) {
    const sideColumn = new THREE.Mesh(sharedEspressoSideColumnGeo, brushedStainlessMat);
    sideColumn.name = `kitchen.espressoMachineAndGrinder.dualBoiler.sideColumn.${side < 0 ? 'left' : 'right'}`;
    sideColumn.position.set(mx + side * 0.182, 0.175, 0.095);
    sideColumn.castShadow = true;
    coffeeStation.add(sideColumn);
  }

  // 2. Protruding upper front brushed stainless canopy / header
  const upperHeader = new THREE.Mesh(sharedEspressoUpperHeaderGeo, brushedStainlessMat);
  upperHeader.name = 'kitchen.espressoMachineAndGrinder.dualBoiler.upperHeader';
  upperHeader.position.set(mx, 0.298, 0.135);
  upperHeader.castShadow = true;
  coffeeStation.add(upperHeader);

  // Rounded front-top brushed stainless edge along the upper canopy
  const headerTopRoll = new THREE.Mesh(sharedEspressoHeaderRollGeo, brushedStainlessMat);
  headerTopRoll.name = 'kitchen.espressoMachineAndGrinder.dualBoiler.headerTopRoll';
  headerTopRoll.rotation.z = Math.PI / 2;
  headerTopRoll.position.set(mx, 0.346, 0.175);
  tagHighLod(headerTopRoll, 12);
  coffeeStation.add(headerTopRoll);

  // Top chrome cup-warming surround rail
  const cupRailBack = new THREE.Mesh(sharedEspressoCupRailGeo, mirrorChromeMat);
  cupRailBack.name = 'kitchen.espressoMachineAndGrinder.dualBoiler.cupRailBack';
  cupRailBack.rotation.z = Math.PI / 2;
  cupRailBack.position.set(mx, 0.364, -0.12);
  tagHighLod(cupRailBack, 12);
  coffeeStation.add(cupRailBack);

  // 3. Full-width Sage black drip tray base + contrasting polished chrome slotted grille on top
  const dripTrayBase = new THREE.Mesh(sharedEspressoDripBaseGeo, darkMat);
  dripTrayBase.name = 'kitchen.espressoMachineAndGrinder.dualBoiler.dripTrayBase';
  dripTrayBase.position.set(mx, 0.022, 0.155);
  dripTrayBase.castShadow = true;
  coffeeStation.add(dripTrayBase);

  const dripTrayGrille = new THREE.Mesh(sharedEspressoDripGrilleGeo, mirrorChromeMat);
  dripTrayGrille.name = 'kitchen.espressoMachineAndGrinder.dualBoiler.dripTrayGrille';
  dripTrayGrille.position.set(mx, 0.046, 0.155);
  coffeeStation.add(dripTrayGrille);

  // Recessed darker brushed stainless splash wall behind the group head
  const groupSplashPanel = new THREE.Mesh(sharedEspressoSplashPanelGeo, darkStainlessRecessMat);
  groupSplashPanel.name = 'kitchen.espressoMachineAndGrinder.dualBoiler.groupSplashPanel';
  groupSplashPanel.position.set(mx, 0.148, 0.107);
  coffeeStation.add(groupSplashPanel);

  // 4. Central circular Sage Espresso Pressure Gauge on upper header fascia
  const gaugeBezel = new THREE.Mesh(sharedEspressoGaugeBezelGeo, darkMat);
  gaugeBezel.name = 'kitchen.espressoMachineAndGrinder.dualBoiler.gaugeBezel';
  gaugeBezel.rotation.x = Math.PI / 2;
  gaugeBezel.position.set(mx, 0.304, 0.184);
  tagHighLod(gaugeBezel, 12);
  coffeeStation.add(gaugeBezel);

  const gaugeFace = new THREE.Mesh(sharedEspressoGaugeFaceGeo, gaugeFaceMat);
  gaugeFace.name = 'kitchen.espressoMachineAndGrinder.dualBoiler.gaugeFace';
  gaugeFace.rotation.x = Math.PI / 2;
  gaugeFace.position.set(mx, 0.304, 0.185);
  tagHighLod(gaugeFace, 12);
  coffeeStation.add(gaugeFace);

  // 5. Twin backlit Sage Dual Boiler LCD displays (Shot Clock & PID Temperature)
  for (const [idx, lcdX] of ([mx - 0.058, mx + 0.058] as const).entries()) {
    const sideLabel = idx === 0 ? 'left' : 'right';
    const lcdBezel = new THREE.Mesh(sharedEspressoLcdBezelGeo, darkMat);
    lcdBezel.name = `kitchen.espressoMachineAndGrinder.dualBoiler.lcdBezel.${sideLabel}`;
    lcdBezel.position.set(lcdX, 0.292, 0.183);
    tagHighLod(lcdBezel, 12);
    coffeeStation.add(lcdBezel);

    const lcdScreen = new THREE.Mesh(sharedEspressoLcdScreenGeo, lcdBacklightMat);
    lcdScreen.name = `kitchen.espressoMachineAndGrinder.dualBoiler.lcdScreen.${sideLabel}`;
    lcdScreen.position.set(lcdX, 0.292, 0.187);
    tagHighLod(lcdScreen, 12);
    coffeeStation.add(lcdScreen);
  }

  // 3 illuminated round chrome control buttons (Power on left, 1-Cup & 2-Cup on right)
  const btnXCoords = [mx - 0.105, mx + 0.045, mx + 0.074] as const;
  for (let i = 0; i < btnXCoords.length; i++) {
    const btn = new THREE.Mesh(sharedEspressoControlBtnGeo, mirrorChromeMat);
    btn.name = `kitchen.espressoMachineAndGrinder.dualBoiler.controlButton_${i + 1}`;
    btn.rotation.x = Math.PI / 2;
    btn.position.set(btnXCoords[i]!, 0.264, 0.184);
    tagHighLod(btn, 12);
    coffeeStation.add(btn);
  }

  // Left-side chrome Steam Lever + articulated stainless Steam Wand
  const steamLeverHub = new THREE.Mesh(sharedEspressoSteamHubGeo, mirrorChromeMat);
  steamLeverHub.name = 'kitchen.espressoMachineAndGrinder.dualBoiler.steamLeverHub';
  steamLeverHub.position.set(mx - 0.145, 0.302, 0.185);
  tagHighLod(steamLeverHub, 12);
  coffeeStation.add(steamLeverHub);

  const steamLeverStick = new THREE.Mesh(sharedEspressoSteamStickGeo, mirrorChromeMat);
  steamLeverStick.name = 'kitchen.espressoMachineAndGrinder.dualBoiler.steamLeverStick';
  steamLeverStick.rotation.x = 0.55;
  steamLeverStick.position.set(mx - 0.145, 0.312, 0.202);
  tagHighLod(steamLeverStick, 12);
  coffeeStation.add(steamLeverStick);

  const steamWand = new THREE.Mesh(sharedEspressoSteamWandGeo, mirrorChromeMat);
  steamWand.name = 'kitchen.espressoMachineAndGrinder.dualBoiler.steamWand';
  steamWand.rotation.z = -0.16;
  steamWand.rotation.x = 0.12;
  steamWand.position.set(mx - 0.135, 0.165, 0.155);
  tagHighLod(steamWand, 12);
  coffeeStation.add(steamWand);

  // Right-side knurled chrome Hot Water Dial
  const hotWaterDial = new THREE.Mesh(sharedEspressoHotWaterDialGeo, mirrorChromeMat);
  hotWaterDial.name = 'kitchen.espressoMachineAndGrinder.dualBoiler.hotWaterDial';
  hotWaterDial.rotation.x = Math.PI / 2;
  hotWaterDial.position.set(mx + 0.145, 0.302, 0.186);
  tagHighLod(hotWaterDial, 12);
  coffeeStation.add(hotWaterDial);

  // 6. 58mm commercial chrome Group Head & Portafilter
  const groupHeadCollar = new THREE.Mesh(sharedEspressoGroupCollarGeo, darkMat);
  groupHeadCollar.name = 'kitchen.espressoMachineAndGrinder.dualBoiler.groupHeadCollar';
  groupHeadCollar.position.set(mx, 0.238, 0.145);
  tagHighLod(groupHeadCollar, 12);
  coffeeStation.add(groupHeadCollar);

  const groupHead = new THREE.Mesh(sharedEspressoGroupHeadGeo, mirrorChromeMat);
  groupHead.name = 'kitchen.espressoMachineAndGrinder.dualBoiler.groupHead';
  groupHead.position.set(mx, 0.214, 0.145);
  tagHighLod(groupHead, 12);
  coffeeStation.add(groupHead);

  const portafilterBasket = new THREE.Mesh(sharedEspressoPortafilterBasketGeo, mirrorChromeMat);
  portafilterBasket.name = 'kitchen.espressoMachineAndGrinder.dualBoiler.portafilterBasket';
  portafilterBasket.position.set(mx, 0.188, 0.145);
  tagHighLod(portafilterBasket, 12);
  coffeeStation.add(portafilterBasket);

  const portafilterNeck = new THREE.Mesh(sharedEspressoPortafilterNeckGeo, mirrorChromeMat);
  portafilterNeck.name = 'kitchen.espressoMachineAndGrinder.dualBoiler.portafilterNeck';
  portafilterNeck.rotation.x = Math.PI / 2;
  portafilterNeck.rotation.z = -0.15;
  portafilterNeck.position.set(mx + 0.006, 0.188, 0.185);
  tagHighLod(portafilterNeck, 12);
  coffeeStation.add(portafilterNeck);

  const portafilterHandle = new THREE.Mesh(sharedEspressoPortafilterHandleGeo, darkMat);
  portafilterHandle.name = 'kitchen.espressoMachineAndGrinder.dualBoiler.portafilterHandle';
  portafilterHandle.rotation.x = Math.PI / 2;
  portafilterHandle.rotation.z = -0.15;
  portafilterHandle.position.set(mx + 0.016, 0.185, 0.25);
  tagHighLod(portafilterHandle, 12);
  coffeeStation.add(portafilterHandle);

  // 2 Ceramic espresso cups warming on top of the Sage Dual Boiler
  for (const [idx, cx] of ([mx - 0.08, mx + 0.08] as const).entries()) {
    const cup = new THREE.Mesh(sharedEspressoWarmingCupGeo, ceramicCupMat);
    cup.name = `kitchen.espressoMachineAndGrinder.dualBoiler.warmingCup_${idx + 1}`;
    cup.position.set(cx, 0.372, -0.02);
    tagHighLod(cup, 12);
    coffeeStation.add(cup);
  }

  // =========================================================================
  // MATCHING SAGE SMART GRINDER PRO IN BRUSHED STAINLESS STEEL (at localX = +0.18m)
  // =========================================================================
  const grinderPlinth = new THREE.Mesh(sharedGrinderPlinthGeo, darkMat);
  grinderPlinth.name = 'kitchen.espressoMachineAndGrinder.smartGrinder.plinth';
  grinderPlinth.position.set(0.18, 0.012, 0.0);
  coffeeStation.add(grinderPlinth);

  const grinderBase = new THREE.Mesh(sharedGrinderBaseGeo, brushedStainlessMat);
  grinderBase.name = 'kitchen.espressoMachineAndGrinder.smartGrinder.base';
  grinderBase.position.set(0.18, 0.13, 0.0);
  grinderBase.castShadow = true;
  coffeeStation.add(grinderBase);

  const grinderFrontTrim = new THREE.Mesh(sharedGrinderFrontTrimGeo, brushedStainlessMat);
  grinderFrontTrim.name = 'kitchen.espressoMachineAndGrinder.smartGrinder.frontTrim';
  grinderFrontTrim.position.set(0.18, 0.2, 0.092);
  coffeeStation.add(grinderFrontTrim);

  const grinderLcd = new THREE.Mesh(sharedGrinderLcdGeo, lcdBacklightMat);
  grinderLcd.name = 'kitchen.espressoMachineAndGrinder.smartGrinder.lcdScreen';
  grinderLcd.position.set(0.155, 0.2, 0.108);
  tagHighLod(grinderLcd, 12);
  coffeeStation.add(grinderLcd);

  const grinderChute = new THREE.Mesh(sharedGrinderChuteGeo, darkMat);
  grinderChute.name = 'kitchen.espressoMachineAndGrinder.smartGrinder.chute';
  grinderChute.position.set(0.18, 0.13, 0.095);
  tagHighLod(grinderChute, 12);
  coffeeStation.add(grinderChute);

  const beanHopper = new THREE.Mesh(sharedGrinderHopperGeo, hopperMat);
  beanHopper.name = 'kitchen.espressoMachineAndGrinder.smartGrinder.beanHopper';
  beanHopper.position.set(0.18, 0.305, 0.0);
  coffeeStation.add(beanHopper);

  const hopperLid = new THREE.Mesh(sharedGrinderHopperLidGeo, darkMat);
  hopperLid.name = 'kitchen.espressoMachineAndGrinder.smartGrinder.hopperLid';
  hopperLid.position.set(0.18, 0.375, 0.0);
  tagHighLod(hopperLid, 12);
  coffeeStation.add(hopperLid);

  parent.add(coffeeStation);
}

export function buildNorthWallInductionHobAndToaster(
  ctx: SceneBuilderContext,
  shared: KitchenCabinetrySharedContext
): void {
  const northGroup = ctx.scene;
  const { ovenGlassMat, stainlessSteelMat } = shared;

  // 4-Zone Black Ceramic Glass Induction Hob on the Worktop to the right of the AGA (centered at X = -0.82m, Z = -2.15m)
  const hobGroup = new THREE.Group();
  hobGroup.name = 'kitchen.cabinetry.north.inductionHob';
  hobGroup.position.set(-0.82, 0.945, -2.15);

  const hobGlass = new THREE.Mesh(sharedHobGlassGeo, ovenGlassMat);
  hobGlass.name = 'kitchen.cabinetry.north.inductionHob.glassPlate';
  hobGroup.add(hobGlass);

  const hobBevel = new THREE.Mesh(sharedHobBevelGeo, stainlessSteelMat);
  hobBevel.name = 'kitchen.cabinetry.north.inductionHob.bevelTrim';
  hobBevel.position.set(0, -0.002, 0);
  hobGroup.add(hobBevel);

  const zoneRingMat = new THREE.MeshBasicMaterial({
    color: 0x566370,
    side: THREE.DoubleSide,
  });
  const zoneCoords: ReadonlyArray<readonly [number, number, number]> = [
    [-0.21, -0.1, 0.095],
    [-0.21, 0.11, 0.078],
    [0.2, -0.1, 0.105],
    [0.2, 0.11, 0.082],
  ];
  for (let i = 0; i < zoneCoords.length; i++) {
    const [zx, zz, zr] = zoneCoords[i]!;
    const ring = new THREE.Mesh(
      prepGeo(new THREE.RingGeometry(zr - 0.006, zr, 24)),
      zoneRingMat
    );
    ring.name = `kitchen.cabinetry.north.inductionHob.zone_${i + 1}.ring`;
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(zx, 0.007, zz);
    tagHighLod(ring, 12);
    hobGroup.add(ring);

    const crossH = new THREE.Mesh(sharedHobCrosshairGeo, zoneRingMat);
    crossH.name = `kitchen.cabinetry.north.inductionHob.zone_${i + 1}.crosshair`;
    crossH.rotation.x = -Math.PI / 2;
    crossH.position.set(zx, 0.007, zz);
    tagHighLod(crossH, 12);
    hobGroup.add(crossH);
  }

  const touchBar = new THREE.Mesh(
    sharedHobTouchBarGeo,
    new THREE.MeshBasicMaterial({ color: 0x993322 })
  );
  touchBar.name = 'kitchen.cabinetry.north.inductionHob.touchControlBar';
  touchBar.rotation.x = -Math.PI / 2;
  touchBar.position.set(0, 0.007, 0.21);
  tagHighLod(touchBar, 12);
  hobGroup.add(touchBar);

  northGroup.add(hobGroup);

  // Dualit Classic 4-Slot Polished Chrome Toaster at X = +0.34m
  buildDualitToaster(northGroup, 0.34, 0.943, -2.14);
}
