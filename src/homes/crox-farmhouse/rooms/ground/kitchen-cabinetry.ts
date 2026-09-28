import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import {
  createBrushedStainlessTexture,
  createMarbleBacksplashTexture,
  createPolishedChromeTexture,
} from '../../../../engine/textures/procedural-textures.ts';
import {
  attachDrawerBoxBehindFront,
  buildHollowCabinetCarcass,
} from '../../../../objects/joinery/cabinet-interior.ts';

function buildDualitToaster(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number
): void {
  const toasterGroup = new THREE.Group();
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
  const basePlinth = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.022, 0.21),
    darkSlotMat
  );
  basePlinth.position.set(0, 0.011, 0);
  toasterGroup.add(basePlinth);

  // Main 4-slot Dualit mirror-chrome body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.18, 0.2),
    mirrorChromeMat
  );
  body.position.set(0, 0.108, 0);
  body.castShadow = true;
  body.receiveShadow = true;
  toasterGroup.add(body);

  // Rounded front & rear top chrome shoulders
  for (const sz of [-0.092, 0.092]) {
    const topRoll = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.304, 14),
      mirrorChromeMat
    );
    topRoll.rotation.z = Math.PI / 2;
    topRoll.position.set(0, 0.194, sz);
    toasterGroup.add(topRoll);
  }

  // Classic Dualit cast-chrome left & right end cheeks with rounded top crown
  for (const side of [-1, 1]) {
    const endCheek = new THREE.Mesh(
      new THREE.BoxGeometry(0.026, 0.184, 0.208),
      castChromeEndMat
    );
    endCheek.position.set(side * 0.151, 0.11, 0);
    endCheek.castShadow = true;
    toasterGroup.add(endCheek);

    const endCrown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.206, 14),
      castChromeEndMat
    );
    endCrown.rotation.x = Math.PI / 2;
    endCrown.position.set(side * 0.151, 0.198, 0);
    toasterGroup.add(endCrown);
  }

  // 4 Top bread slots running front-to-back with polished chrome slot surrounds
  for (const sx of [-0.096, -0.032, 0.032, 0.096]) {
    const slotRim = new THREE.Mesh(
      new THREE.BoxGeometry(0.036, 0.006, 0.145),
      mirrorChromeMat
    );
    slotRim.position.set(sx, 0.201, 0);
    toasterGroup.add(slotRim);

    const slot = new THREE.Mesh(
      new THREE.BoxGeometry(0.026, 0.008, 0.135),
      darkSlotMat
    );
    slot.position.set(sx, 0.203, 0);
    toasterGroup.add(slot);
  }

  // Dark recessed front control fascia plate behind the Dualit timer & ejector lever
  const frontControlPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.21, 0.135, 0.004),
    new THREE.MeshStandardMaterial({
      color: 0x2a2d32,
      roughness: 0.35,
      metalness: 0.5,
    })
  );
  frontControlPlate.position.set(0, 0.112, 0.101);
  toasterGroup.add(frontControlPlate);

  // Front Dualit badge, rotary mechanical timer dial, and manual ejector lever
  const badge = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.018, 0.008),
    brassDialMat
  );
  badge.position.set(-0.07, 0.16, 0.104);
  toasterGroup.add(badge);

  const timerDial = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.018, 14),
    darkSlotMat
  );
  timerDial.rotation.x = Math.PI / 2;
  timerDial.position.set(-0.07, 0.095, 0.107);
  toasterGroup.add(timerDial);

  const leverTrack = new THREE.Mesh(
    new THREE.BoxGeometry(0.01, 0.085, 0.006),
    darkSlotMat
  );
  leverTrack.position.set(0.07, 0.105, 0.103);
  toasterGroup.add(leverTrack);

  const ejectorKnob = new THREE.Mesh(
    new THREE.BoxGeometry(0.034, 0.016, 0.026),
    darkSlotMat
  );
  ejectorKnob.position.set(0.07, 0.13, 0.113);
  toasterGroup.add(ejectorKnob);

  // Pull-out chrome crumb tray handle at bottom front
  const crumbTray = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.012, 0.016),
    mirrorChromeMat
  );
  crumbTray.position.set(0, 0.03, 0.105);
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

  // =========================================================================
  // SAGE DUAL BOILER (BES920) ESPRESSO MACHINE (at localX = -0.14m)
  // =========================================================================
  const mx = -0.14;

  // 1. Rear & main brushed stainless boiler housing (0.37m wide x 0.35m tall x 0.25m deep)
  const machineBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.37, 0.35, 0.25),
    brushedStainlessMat
  );
  machineBody.position.set(mx, 0.175, -0.02);
  machineBody.castShadow = true;
  machineBody.receiveShadow = true;
  coffeeStation.add(machineBody);

  // Recessed darker stainless cup-warming tray on top so the top of the machine has realistic contrast
  const topWarmingTray = new THREE.Mesh(
    new THREE.BoxGeometry(0.31, 0.006, 0.19),
    darkStainlessRecessMat
  );
  topWarmingTray.position.set(mx, 0.352, -0.02);
  coffeeStation.add(topWarmingTray);

  // Brushed stainless vertical curved side columns on left & right of the Sage Dual Boiler
  for (const side of [-1, 1]) {
    const sideColumn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.35, 14),
      brushedStainlessMat
    );
    sideColumn.position.set(mx + side * 0.182, 0.175, 0.095);
    sideColumn.castShadow = true;
    coffeeStation.add(sideColumn);
  }

  // 2. Protruding upper front brushed stainless canopy / header (houses pressure gauge, twin LCDs, buttons, steam lever & hot water dial)
  const upperHeader = new THREE.Mesh(
    new THREE.BoxGeometry(0.374, 0.105, 0.095),
    brushedStainlessMat
  );
  upperHeader.position.set(mx, 0.298, 0.135);
  upperHeader.castShadow = true;
  coffeeStation.add(upperHeader);

  // Rounded front-top brushed stainless edge along the upper canopy
  const headerTopRoll = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.014, 0.374, 14),
    brushedStainlessMat
  );
  headerTopRoll.rotation.z = Math.PI / 2;
  headerTopRoll.position.set(mx, 0.346, 0.175);
  coffeeStation.add(headerTopRoll);

  // Top chrome cup-warming surround rail
  const cupRailBack = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.005, 0.35, 10),
    mirrorChromeMat
  );
  cupRailBack.rotation.z = Math.PI / 2;
  cupRailBack.position.set(mx, 0.364, -0.12);
  coffeeStation.add(cupRailBack);

  // 3. Full-width Sage black drip tray base + contrasting polished chrome slotted grille on top
  const dripTrayBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.372, 0.044, 0.145),
    darkMat
  );
  dripTrayBase.position.set(mx, 0.022, 0.155);
  dripTrayBase.castShadow = true;
  coffeeStation.add(dripTrayBase);

  const dripTrayGrille = new THREE.Mesh(
    new THREE.BoxGeometry(0.352, 0.008, 0.126),
    mirrorChromeMat
  );
  dripTrayGrille.position.set(mx, 0.046, 0.155);
  coffeeStation.add(dripTrayGrille);

  // Recessed darker brushed stainless splash wall behind the group head so the chrome group head & steam wand pop
  const groupSplashPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(0.34, 0.2),
    darkStainlessRecessMat
  );
  groupSplashPanel.position.set(mx, 0.148, 0.107);
  coffeeStation.add(groupSplashPanel);

  // 4. Central circular Sage Espresso Pressure Gauge on upper header fascia
  const gaugeBezel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.027, 0.027, 0.012, 20),
    darkMat
  );
  gaugeBezel.rotation.x = Math.PI / 2;
  gaugeBezel.position.set(mx, 0.304, 0.184);
  coffeeStation.add(gaugeBezel);

  const gaugeFace = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, 0.014, 20),
    gaugeFaceMat
  );
  gaugeFace.rotation.x = Math.PI / 2;
  gaugeFace.position.set(mx, 0.304, 0.185);
  coffeeStation.add(gaugeFace);

  // 5. Twin backlit Sage Dual Boiler LCD displays (Shot Clock & PID Temperature)
  for (const lcdX of [mx - 0.058, mx + 0.058]) {
    const lcdBezel = new THREE.Mesh(
      new THREE.BoxGeometry(0.042, 0.024, 0.006),
      darkMat
    );
    lcdBezel.position.set(lcdX, 0.292, 0.183);
    coffeeStation.add(lcdBezel);

    const lcdScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.036, 0.018),
      lcdBacklightMat
    );
    lcdScreen.position.set(lcdX, 0.292, 0.187);
    coffeeStation.add(lcdScreen);
  }

  // 3 illuminated round chrome control buttons (Power on left, 1-Cup & 2-Cup on right)
  for (const btnX of [mx - 0.105, mx + 0.045, mx + 0.074]) {
    const btn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.008, 12),
      mirrorChromeMat
    );
    btn.rotation.x = Math.PI / 2;
    btn.position.set(btnX, 0.264, 0.184);
    coffeeStation.add(btn);
  }

  // Left-side chrome Steam Lever + articulated stainless Steam Wand
  const steamLeverHub = new THREE.Mesh(
    new THREE.SphereGeometry(0.014, 12, 10),
    mirrorChromeMat
  );
  steamLeverHub.position.set(mx - 0.145, 0.302, 0.185);
  coffeeStation.add(steamLeverHub);

  const steamLeverStick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0045, 0.006, 0.042, 10),
    mirrorChromeMat
  );
  steamLeverStick.rotation.x = 0.55;
  steamLeverStick.position.set(mx - 0.145, 0.312, 0.202);
  coffeeStation.add(steamLeverStick);

  const steamWand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.004, 0.175, 10),
    mirrorChromeMat
  );
  steamWand.rotation.z = -0.16;
  steamWand.rotation.x = 0.12;
  steamWand.position.set(mx - 0.135, 0.165, 0.155);
  coffeeStation.add(steamWand);

  // Right-side knurled chrome Hot Water Dial
  const hotWaterDial = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.016, 16),
    mirrorChromeMat
  );
  hotWaterDial.rotation.x = Math.PI / 2;
  hotWaterDial.position.set(mx + 0.145, 0.302, 0.186);
  coffeeStation.add(hotWaterDial);

  // 6. 58mm commercial chrome Group Head & Portafilter
  const groupHeadCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.044, 0.042, 0.022, 18),
    darkMat
  );
  groupHeadCollar.position.set(mx, 0.238, 0.145);
  coffeeStation.add(groupHeadCollar);

  const groupHead = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.038, 0.042, 18),
    mirrorChromeMat
  );
  groupHead.position.set(mx, 0.214, 0.145);
  coffeeStation.add(groupHead);

  const portafilterBasket = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.032, 0.034, 18),
    mirrorChromeMat
  );
  portafilterBasket.position.set(mx, 0.188, 0.145);
  coffeeStation.add(portafilterBasket);

  const portafilterNeck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.009, 0.035, 10),
    mirrorChromeMat
  );
  portafilterNeck.rotation.x = Math.PI / 2;
  portafilterNeck.rotation.z = -0.15;
  portafilterNeck.position.set(mx + 0.006, 0.188, 0.185);
  coffeeStation.add(portafilterNeck);

  const portafilterHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.011, 0.014, 0.12, 12),
    darkMat
  );
  portafilterHandle.rotation.x = Math.PI / 2;
  portafilterHandle.rotation.z = -0.15;
  portafilterHandle.position.set(mx + 0.016, 0.185, 0.25);
  coffeeStation.add(portafilterHandle);

  // 2 Ceramic espresso cups warming on top of the Sage Dual Boiler
  for (const cx of [mx - 0.08, mx + 0.08]) {
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.026, 0.02, 0.045, 12),
      new THREE.MeshStandardMaterial({ color: 0xf6f3ec, roughness: 0.18 })
    );
    cup.position.set(cx, 0.372, -0.02);
    coffeeStation.add(cup);
  }

  // =========================================================================
  // MATCHING SAGE SMART GRINDER PRO IN BRUSHED STAINLESS STEEL (at localX = +0.18m)
  // =========================================================================
  const grinderPlinth = new THREE.Mesh(
    new THREE.BoxGeometry(0.154, 0.024, 0.195),
    darkMat
  );
  grinderPlinth.position.set(0.18, 0.012, 0.0);
  coffeeStation.add(grinderPlinth);

  const grinderBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.22, 0.185),
    brushedStainlessMat
  );
  grinderBase.position.set(0.18, 0.13, 0.0);
  grinderBase.castShadow = true;
  coffeeStation.add(grinderBase);

  const grinderFrontTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.152, 0.08, 0.03),
    brushedStainlessMat
  );
  grinderFrontTrim.position.set(0.18, 0.2, 0.092);
  coffeeStation.add(grinderFrontTrim);

  const grinderLcd = new THREE.Mesh(
    new THREE.PlaneGeometry(0.044, 0.032),
    lcdBacklightMat
  );
  grinderLcd.position.set(0.155, 0.2, 0.108);
  coffeeStation.add(grinderLcd);

  const grinderChute = new THREE.Mesh(
    new THREE.BoxGeometry(0.042, 0.085, 0.055),
    darkMat
  );
  grinderChute.position.set(0.18, 0.13, 0.095);
  coffeeStation.add(grinderChute);

  const beanHopper = new THREE.Mesh(
    new THREE.CylinderGeometry(0.078, 0.056, 0.13, 18),
    hopperMat
  );
  beanHopper.position.set(0.18, 0.305, 0.0);
  coffeeStation.add(beanHopper);

  const hopperLid = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.08, 0.015, 18),
    darkMat
  );
  hopperLid.position.set(0.18, 0.375, 0.0);
  coffeeStation.add(hopperLid);

  parent.add(coffeeStation);
}

export function buildWrapAroundDoveGreyKitchenAGAAndCoffeeCorner(ctx: SceneBuilderContext): void {
  const { scene, cutawayWallGroups, interactions } = ctx;
  // Floor-standing kitchen units (base cabinets, worktops, AGA, fridge/oven towers, pantry) stay visible;
  // only wall-hung upper units and the cooker hood cut away with the walls when panning around!
  const westGroup = scene;
  const northGroup = scene;
  const westUpperCutawayGroup = cutawayWallGroups.west;
  const northUpperCutawayGroup = cutawayWallGroups.north;

  const doveGreyMat = new THREE.MeshStandardMaterial({
    color: 0xa29f97,
    roughness: 0.56,
    metalness: 0.04,
  });
  const worktopMarbleTex = createMarbleBacksplashTexture();
  worktopMarbleTex.wrapS = THREE.RepeatWrapping;
  worktopMarbleTex.wrapT = THREE.RepeatWrapping;
  worktopMarbleTex.repeat.set(1.6, 1.0);

  const limestoneWorktopMat = new THREE.MeshStandardMaterial({
    map: worktopMarbleTex,
    roughness: 0.18,
    metalness: 0.04,
  });
  const wallPlasterMat = new THREE.MeshStandardMaterial({
    color: 0xe6e1d6,
    roughness: 0.86,
    metalness: 0.02,
  });
  const brushedStainlessTex = createBrushedStainlessTexture();
  const polishedChromeTex = createPolishedChromeTexture();

  // Cupboard door handles / knobs are Brushed Stainless Steel (reacting 100% to room lighting)
  const chromeKnobMat = new THREE.MeshStandardMaterial({
    map: brushedStainlessTex,
    bumpMap: brushedStainlessTex,
    bumpScale: 0.003,
    color: 0xc8c5be,
    roughness: 0.28,
    metalness: 0.48,
  });
  const knobGeo = new THREE.SphereGeometry(0.014, 10, 8);

  const addChromeKnob = (
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    facingAxis: 'x' | 'z'
  ): void => {
    const knob = new THREE.Mesh(knobGeo, chromeKnobMat);
    knob.position.set(x, y, z);
    if (facingAxis === 'x') {
      knob.scale.set(0.75, 1, 1);
    } else {
      knob.scale.set(1, 1, 0.75);
    }
    parent.add(knob);
  };

  /**
   * Builds a Howdens-style full-overlay (lay-on) Shaker door or drawer front where:
   * - The flat center panel is genuinely INSET (10mm thick, sitting against the carcass)
   * - The 4 outer Shaker stiles & rails are RAISED (22mm thick -> 12mm proud of the recessed center!)
   * - Full-overlay sizing leaves only a crisp 5mm shadow gap between adjacent doors (not in-frame).
   */
  const addHowdensShakerDoor = (
    parent: THREE.Object3D,
    cx: number,
    cy: number,
    carcassFaceCoord: number,
    w: number,
    h: number,
    facingAxis: 'x' | 'z',
    stileW = 0.062,
    railH = stileW,
    hasMidRail = false
  ): THREE.Group => {
    const doorGroup = new THREE.Group();
    if (facingAxis === 'x') {
      doorGroup.position.set(carcassFaceCoord, cy, cx);
    } else {
      doorGroup.position.set(cx, cy, carcassFaceCoord);
    }

    const insetThickness = 0.01;
    const frameThickness = 0.022;

    if (facingAxis === 'x') {
      // Recessed flat center panel
      const insetPanel = new THREE.Mesh(
        new THREE.BoxGeometry(insetThickness, h - 0.008, w - 0.008),
        doveGreyMat
      );
      insetPanel.position.set(insetThickness * 0.5, 0, 0);
      insetPanel.receiveShadow = true;
      doorGroup.add(insetPanel);

      // Raised Left & Right Vertical Stiles
      for (const side of [-1, 1]) {
        const stile = new THREE.Mesh(
          new THREE.BoxGeometry(frameThickness, h, stileW),
          doveGreyMat
        );
        stile.position.set(frameThickness * 0.5, 0, side * (w * 0.5 - stileW * 0.5));
        stile.castShadow = true;
        stile.receiveShadow = true;
        doorGroup.add(stile);
      }

      // Raised Top & Bottom Horizontal Rails
      const innerSpan = Math.max(0.03, w - stileW * 2);
      for (const vSide of [-1, 1]) {
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(frameThickness, railH, innerSpan),
          doveGreyMat
        );
        rail.position.set(frameThickness * 0.5, vSide * (h * 0.5 - railH * 0.5), 0);
        rail.castShadow = true;
        rail.receiveShadow = true;
        doorGroup.add(rail);
      }

      if (hasMidRail) {
        const midRail = new THREE.Mesh(
          new THREE.BoxGeometry(frameThickness, railH * 0.85, innerSpan),
          doveGreyMat
        );
        midRail.position.set(frameThickness * 0.5, 0, 0);
        midRail.castShadow = true;
        doorGroup.add(midRail);
      }
    } else {
      // Facing +Z
      const insetPanel = new THREE.Mesh(
        new THREE.BoxGeometry(w - 0.008, h - 0.008, insetThickness),
        doveGreyMat
      );
      insetPanel.position.set(0, 0, insetThickness * 0.5);
      insetPanel.receiveShadow = true;
      doorGroup.add(insetPanel);

      // Raised Left & Right Vertical Stiles
      for (const side of [-1, 1]) {
        const stile = new THREE.Mesh(
          new THREE.BoxGeometry(stileW, h, frameThickness),
          doveGreyMat
        );
        stile.position.set(side * (w * 0.5 - stileW * 0.5), 0, frameThickness * 0.5);
        stile.castShadow = true;
        stile.receiveShadow = true;
        doorGroup.add(stile);
      }

      // Raised Top & Bottom Horizontal Rails
      const innerSpan = Math.max(0.03, w - stileW * 2);
      for (const vSide of [-1, 1]) {
        const rail = new THREE.Mesh(
          new THREE.BoxGeometry(innerSpan, railH, frameThickness),
          doveGreyMat
        );
        rail.position.set(0, vSide * (h * 0.5 - railH * 0.5), frameThickness * 0.5);
        rail.castShadow = true;
        rail.receiveShadow = true;
        doorGroup.add(rail);
      }

      if (hasMidRail) {
        const midRail = new THREE.Mesh(
          new THREE.BoxGeometry(innerSpan, railH * 0.85, frameThickness),
          doveGreyMat
        );
        midRail.position.set(0, -0.06, frameThickness * 0.5);
        midRail.castShadow = true;
        doorGroup.add(midRail);
      }
    }

    parent.add(doorGroup);
    return doorGroup;
  };

  // Helper to build a hollow stepped 4-tier coving/mantel crown moulding frame around the perimeter
  // of cupboard tops (baseY = 2.42m / 2.44m), creating a recessed internal void/tray above the cabinet
  // roof where strip LED uplights sit inset rather than perched on top of the cornice rim.
  const corniceVoidFloorMat = new THREE.MeshStandardMaterial({
    color: 0xb6b2a6,
    roughness: 0.58,
    metalness: 0.02,
  });

  const addCovingMantelCornice = (
    parent: THREE.Object3D,
    cx: number,
    baseY: number,
    cz: number,
    w: number,
    d: number,
    overhangLeftX: number,
    overhangRightX: number,
    overhangBackZ: number,
    overhangFrontZ: number,
    openSides?: {
      readonly left?: boolean;
      readonly right?: boolean;
      readonly back?: boolean;
      readonly front?: boolean;
    }
  ): void => {
    const rimW = 0.032; // 32mm plinth perimeter wall thickness around the recessed void
    const innerMinX = cx - w * 0.5 + (openSides?.left ? 0 : rimW);
    const innerMaxX = cx + w * 0.5 - (openSides?.right ? 0 : rimW);
    const innerMinZ = cz - d * 0.5 + (openSides?.back ? 0 : rimW);
    const innerMaxZ = cz + d * 0.5 - (openSides?.front ? 0 : rimW);
    const innerW = Math.max(0.04, innerMaxX - innerMinX);
    const innerD = Math.max(0.04, innerMaxZ - innerMinZ);

    // Recessed void floor tray at the bottom of the plinth cavity (y = baseY + 0.002m)
    const voidFloor = new THREE.Mesh(
      new THREE.BoxGeometry(innerW, 0.004, innerD),
      corniceVoidFloorMat
    );
    voidFloor.position.set(
      (innerMinX + innerMaxX) * 0.5,
      baseY + 0.002,
      (innerMinZ + innerMaxZ) * 0.5
    );
    voidFloor.receiveShadow = true;
    parent.add(voidFloor);

    // [scaleFraction, tierHeight, centerYOffset] — refined, understated Shaker cornice flare
    const tiers: ReadonlyArray<readonly [number, number, number]> = [
      [0.22, 0.018, 0.009], // Lower frieze necking band
      [0.46, 0.018, 0.027], // Lower ogee/cyma coving step
      [0.72, 0.018, 0.045], // Upper coving step
      [1.0, 0.024, 0.066],  // Top projecting mantel crown cap (top at baseY + 0.078m)
    ];

    for (const [frac, th, yOff] of tiers) {
      const oL = overhangLeftX * frac;
      const oR = overhangRightX * frac;
      const oB = overhangBackZ * frac;
      const oF = overhangFrontZ * frac;

      const outerMinX = cx - w * 0.5 - oL;
      const outerMaxX = cx + w * 0.5 + oR;
      const outerMinZ = cz - d * 0.5 - oB;
      const outerMaxZ = cz + d * 0.5 + oF;
      const fullW = outerMaxX - outerMinX;
      const centerX = (outerMinX + outerMaxX) * 0.5;
      const tierY = baseY + yOff;

      // 1. Front perimeter bar (+Z)
      if (!openSides?.front) {
        const frontD = outerMaxZ - innerMaxZ;
        const frontBar = new THREE.Mesh(
          new THREE.BoxGeometry(fullW, th, frontD),
          doveGreyMat
        );
        frontBar.position.set(centerX, tierY, (innerMaxZ + outerMaxZ) * 0.5);
        frontBar.castShadow = true;
        frontBar.receiveShadow = true;
        parent.add(frontBar);
      }

      // 2. Back perimeter bar (-Z)
      if (!openSides?.back) {
        const backD = innerMinZ - outerMinZ;
        const backBar = new THREE.Mesh(
          new THREE.BoxGeometry(fullW, th, backD),
          doveGreyMat
        );
        backBar.position.set(centerX, tierY, (outerMinZ + innerMinZ) * 0.5);
        backBar.castShadow = true;
        backBar.receiveShadow = true;
        parent.add(backBar);
      }

      // 3. Left perimeter bar (-X) spanning between back & front bars
      if (!openSides?.left) {
        const leftW = innerMinX - outerMinX;
        const leftBar = new THREE.Mesh(
          new THREE.BoxGeometry(leftW, th, innerD),
          doveGreyMat
        );
        leftBar.position.set((outerMinX + innerMinX) * 0.5, tierY, (innerMinZ + innerMaxZ) * 0.5);
        leftBar.castShadow = true;
        leftBar.receiveShadow = true;
        parent.add(leftBar);
      }

      // 4. Right perimeter bar (+X) spanning between back & front bars
      if (!openSides?.right) {
        const rightW = outerMaxX - innerMaxX;
        const rightBar = new THREE.Mesh(
          new THREE.BoxGeometry(rightW, th, innerD),
          doveGreyMat
        );
        rightBar.position.set((innerMaxX + outerMaxX) * 0.5, tierY, (innerMinZ + innerMaxZ) * 0.5);
        rightBar.castShadow = true;
        rightBar.receiveShadow = true;
        parent.add(rightBar);
      }
    }
  };

  // =========================================================================
  // 1. WEST WALL APPLIANCE TOWERS & WRAP-AROUND UNITS (at X = -4.40m)
  // =========================================================================
  const stainlessSteelMat = new THREE.MeshStandardMaterial({
    map: brushedStainlessTex,
    bumpMap: brushedStainlessTex,
    bumpScale: 0.004,
    color: 0xc8c5be,
    roughness: 0.28,
    metalness: 0.48,
  });
  const ovenGlassMat = new THREE.MeshStandardMaterial({
    color: 0x0d1014,
    roughness: 0.12,
    metalness: 0.65,
  });

  // 1a. FULL-HEIGHT SIDE-BY-SIDE INTEGRATED FRIDGE-FREEZER (Z = -0.43m to +0.53m, center Z = +0.05m, width 0.96m)
  //     Shifted North by 0.72m so it sits 32cm clear of the Z = +0.85m..+1.99m Kitchen entrance portal!
  //     Facing the West wall: Left column (+Z, bz = +0.239) = Full-Height Integrated Fridge,
  //     Right column (-Z, bz = -0.239) = Full-Height Integrated Freezer. Full height (Y = 0.14m..2.42m), no top cupboard.
  const fpGroup = new THREE.Group();
  fpGroup.position.set(-4.06, 0, 0.05);

  // Left full-height column (+Z side when facing West wall): Full-Height Integrated Larder Fridge (Y = 0..2.42m, 14cm kickboard)
  buildHollowCabinetCarcass(fpGroup, 0, 0, 0.24, 0.68, 2.42, 0.48, '+x', doveGreyMat, {
    plinthHeight: 0.14,
    interiorStyle: 'fridge',
    shelfCount: 5,
    hasCenterMullion: false,
    includeItems: true,
  });

  // Right full-height column (-Z side when facing West wall): Full-Height Integrated Frost-Free Freezer (Y = 0..2.42m, 14cm kickboard)
  buildHollowCabinetCarcass(fpGroup, 0, 0, -0.24, 0.68, 2.42, 0.48, '+x', doveGreyMat, {
    plinthHeight: 0.14,
    interiorStyle: 'freezer',
    shelfCount: 5,
    hasCenterMullion: false,
    includeItems: true,
  });

  // Full-height Howdens Shaker doors on the Integrated Fridge-Freezer (no top cupboard; full height Y = 0.14m..2.41m)
  for (const bz of [-0.239, 0.239]) {
    const hingeSideZ: -1 | 1 = bz < 0 ? -1 : 1;
    const knobZ = bz < 0 ? -0.055 : 0.055;

    // Single full-height Shaker door per column (Y = 0.14m..2.41m, center Y = 1.275m, height = 2.27m) with central Shaker mid-rail
    const fullHeightDoor = addHowdensShakerDoor(
      fpGroup,
      bz,
      1.275,
      0.34,
      0.472,
      2.27,
      'x',
      0.062,
      0.062,
      true
    );
    addChromeKnob(fullHeightDoor, 0.03, 1.12 - 1.275, knobZ - bz, 'x');
    interactions.registerHingedDoor(
      fpGroup,
      fullHeightDoor,
      new THREE.Vector3(0.011, 0, hingeSideZ * (0.472 * 0.5 - 0.012)),
      'y',
      -hingeSideZ * Math.PI * 0.62
    );
  }

  westGroup.add(fpGroup);

  // 1b. FULL-HEIGHT INTEGRATED OVENS UNIT (Z = -1.11m to -0.43m, center Z = -0.77m, width 0.68m)
  //     Houses the NEFF N50 U2ACH7A (U2ACH7AG7B) Built-In Self-Cleaning Double Smart Electric Oven in Graphite
  const ovenTowerGroup = new THREE.Group();
  ovenTowerGroup.position.set(-4.06, 0, -0.77);

  // Bottom cupboard cavity below the NEFF Double Oven (Y = 0..0.835m, 14cm kickboard, matching adjacent freezer door height)
  buildHollowCabinetCarcass(ovenTowerGroup, 0, 0, 0, 0.68, 0.835, 0.68, '+x', doveGreyMat, {
    plinthHeight: 0.14,
    interiorStyle: 'oak',
    shelfCount: 1,
    includeItems: true,
  });
  // Lower Main 71L Multifunction CircoTherm Pyrolytic Oven cavity (Y = 0.835m..1.425m, height 0.59m)
  const mainOvenCarcass = buildHollowCabinetCarcass(
    ovenTowerGroup,
    0,
    0.835,
    0,
    0.68,
    0.59,
    0.68,
    '+x',
    doveGreyMat,
    {
      plinthHeight: 0,
      interiorStyle: 'oven',
      shelfCount: 2,
      includeItems: true,
    }
  );
  // Upper Secondary 34L Oven / Integrated Grill cavity + Top Fascia bay (Y = 1.425m..1.825m, height 0.40m)
  const topOvenCarcass = buildHollowCabinetCarcass(
    ovenTowerGroup,
    0,
    1.425,
    0,
    0.68,
    0.4,
    0.68,
    '+x',
    doveGreyMat,
    {
      plinthHeight: 0,
      interiorStyle: 'oven',
      shelfCount: 1,
      includeItems: false,
    }
  );
  // Top cupboard cavity above the NEFF Double Oven (Y = 1.825m..2.42m, height 0.595m)
  buildHollowCabinetCarcass(ovenTowerGroup, 0, 1.825, 0, 0.68, 0.595, 0.68, '+x', doveGreyMat, {
    plinthHeight: 0,
    interiorStyle: 'oak',
    shelfCount: 1,
    includeItems: true,
  });

  // Left & Right Dove Grey tall-housing stiles (4cm wide each) framing the 594mm-wide NEFF Double Oven
  for (const sideZ of [-1, 1]) {
    const housingStile = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, 0.99, 0.04),
      doveGreyMat
    );
    housingStile.position.set(0.336, 1.33, sideZ * 0.32);
    housingStile.castShadow = true;
    housingStile.receiveShadow = true;
    ovenTowerGroup.add(housingStile);
  }

  // NEFF N50 Graphite Grey & Black Ceramic Glass Materials
  const neffGraphiteMat = new THREE.MeshStandardMaterial({
    map: brushedStainlessTex,
    bumpMap: brushedStainlessTex,
    bumpScale: 0.003,
    color: 0x3d4147,
    roughness: 0.26,
    metalness: 0.64,
  });
  const neffBlackGlassMat = new THREE.MeshStandardMaterial({
    color: 0x0e1014,
    roughness: 0.06,
    metalness: 0.18,
  });
  const neffSmokedWindowMat = new THREE.MeshStandardMaterial({
    color: 0x11151b,
    transparent: true,
    opacity: 0.36,
    roughness: 0.05,
    metalness: 0.22,
  });
  const neffSilverPinstripeMat = new THREE.MeshStandardMaterial({
    color: 0x9fa4ac,
    roughness: 0.25,
    metalness: 0.72,
  });
  const neffCavityLightMat = new THREE.MeshBasicMaterial({
    color: 0xffe2a8,
  });

  // Internal NEFF CircoTherm® rear fan baffle, stainless impeller, side ladder racks & halogen lamp
  const bafflePlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.012, 0.36, 0.42),
    new THREE.MeshStandardMaterial({ color: 0x20242b, roughness: 0.34, metalness: 0.45 })
  );
  bafflePlate.position.set(-0.29, 0, 0);
  mainOvenCarcass.add(bafflePlate);

  const fanVentRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.078, 0.008, 10, 24),
    neffGraphiteMat
  );
  fanVentRing.rotation.y = Math.PI / 2;
  fanVentRing.position.set(-0.282, 0.01, 0);
  mainOvenCarcass.add(fanVentRing);

  const fanImpellerDisc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.062, 0.062, 0.008, 18),
    stainlessSteelMat
  );
  fanImpellerDisc.rotation.z = Math.PI / 2;
  fanImpellerDisc.position.set(-0.285, 0.01, 0);
  mainOvenCarcass.add(fanImpellerDisc);

  // Warm internal oven lamp lens on the ceiling of both cavities
  const mainOvenLamp = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.008, 0.075),
    neffCavityLightMat
  );
  mainOvenLamp.position.set(0.08, 0.268, -0.14);
  mainOvenCarcass.add(mainOvenLamp);

  const topOvenLamp = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 0.006, 0.075),
    neffCavityLightMat
  );
  topOvenLamp.position.set(0.08, 0.115, 0);
  topOvenCarcass.add(topOvenLamp);

  // Bottom full-overlay Shaker cupboard door below NEFF Double Oven (Y = 0.14m..0.83m)
  const ovenBotDoor = addHowdensShakerDoor(
    ovenTowerGroup,
    0,
    0.485,
    0.34,
    0.67,
    0.69,
    'x',
    0.062
  );
  addChromeKnob(ovenBotDoor, 0.03, 0.74 - 0.485, -0.24, 'x');
  interactions.registerHingedDoor(
    ovenTowerGroup,
    ovenBotDoor,
    new THREE.Vector3(0.011, 0, 0.67 * 0.5 - 0.012),
    'y',
    -Math.PI * 0.62
  );

  // =========================================================================
  // NEFF N50 U2ACH7A (GRAPHITE) — 1. SINGLE TOP CONTROL FASCIA (Y = 1.708m..1.820m, width 0.594m)
  // =========================================================================
  const neffFasciaGroup = new THREE.Group();
  neffFasciaGroup.position.set(0.344, 1.764, 0);

  // Central gloss black ceramic glass fascia panel (between Graphite vertical edge trims)
  const fasciaBlackGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, 0.112, 0.558),
    neffBlackGlassMat
  );
  fasciaBlackGlass.castShadow = true;
  neffFasciaGroup.add(fasciaBlackGlass);

  // Left & Right Brushed Graphite Grey vertical side trim strips on the fascia
  for (const sideZ of [-1, 1]) {
    const fasciaEdgeTrim = new THREE.Mesh(
      new THREE.BoxGeometry(0.026, 0.112, 0.018),
      neffGraphiteMat
    );
    fasciaEdgeTrim.position.set(0.001, 0, sideZ * 0.288);
    fasciaEdgeTrim.castShadow = true;
    neffFasciaGroup.add(fasciaEdgeTrim);
  }

  // Subtle horizontal brushed Graphite bevel strip along bottom edge of control fascia
  const fasciaBottomStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.026, 0.006, 0.594),
    neffGraphiteMat
  );
  fasciaBottomStrip.position.set(0.001, -0.053, 0);
  neffFasciaGroup.add(fasciaBottomStrip);

  // Procedural CanvasTexture for the NEFF N50 White LCD Display, NEFF logo badge & touch buttons
  const neffDisplayCanvas = document.createElement('canvas');
  neffDisplayCanvas.width = 512;
  neffDisplayCanvas.height = 128;
  const nCtx = neffDisplayCanvas.getContext('2d');
  if (nCtx) {
    nCtx.fillStyle = '#0a0c10';
    nCtx.fillRect(0, 0, 512, 128);

    // Subtle dial scale rings around left (x=96) and right (x=416) rotary knobs
    nCtx.strokeStyle = 'rgba(220, 226, 235, 0.42)';
    nCtx.lineWidth = 1.5;
    for (const dialX of [96, 416]) {
      for (let a = 0; a < 8; a++) {
        const ang = (a / 8) * Math.PI * 2 - Math.PI * 0.5;
        const r0 = 36;
        const r1 = 42;
        nCtx.beginPath();
        nCtx.moveTo(dialX + Math.cos(ang) * r0, 66 + Math.sin(ang) * r0);
        nCtx.lineTo(dialX + Math.cos(ang) * r1, 66 + Math.sin(ang) * r1);
        nCtx.stroke();
      }
    }

    // Crisp silver-white NEFF brand badge at top center
    nCtx.fillStyle = '#e4e8ee';
    nCtx.font = 'bold 15px sans-serif';
    nCtx.textAlign = 'center';
    nCtx.fillText('NEFF', 256, 22);

    // Recessed center LCD window with glowing white digital readout
    nCtx.fillStyle = '#050608';
    nCtx.strokeStyle = '#2c3138';
    nCtx.lineWidth = 2;
    nCtx.beginPath();
    nCtx.roundRect(178, 30, 156, 54, 4);
    nCtx.fill();
    nCtx.stroke();

    // Cavity indicator icon (double-oven box symbol highlighting main lower cavity)
    nCtx.strokeStyle = 'rgba(240, 246, 255, 0.75)';
    nCtx.lineWidth = 1.5;
    nCtx.strokeRect(190, 40, 18, 12);
    nCtx.fillStyle = '#ffffff';
    nCtx.fillRect(190, 55, 18, 18);

    // Crisp White LCD Temperature & Clock Readout
    nCtx.fillStyle = '#f5f9ff';
    nCtx.font = 'bold 22px monospace';
    nCtx.textAlign = 'center';
    nCtx.fillText('180°C', 258, 63);

    nCtx.fillStyle = 'rgba(235, 244, 255, 0.85)';
    nCtx.font = '11px monospace';
    nCtx.fillText('12:45  Wi-Fi', 266, 77);

    // Touch-sensitive control sensor icons beneath the LCD window
    const touchIcons = ['⏱', '−', '+', '▣', '⚡'];
    nCtx.fillStyle = 'rgba(225, 232, 240, 0.78)';
    nCtx.font = '12px sans-serif';
    touchIcons.forEach((ic, idx) => {
      const tx = 192 + idx * 32;
      nCtx.fillText(ic, tx, 106);
    });
  }
  const neffFasciaTex = new THREE.CanvasTexture(neffDisplayCanvas);
  neffFasciaTex.colorSpace = THREE.SRGBColorSpace;
  const neffFasciaOverlay = new THREE.Mesh(
    new THREE.PlaneGeometry(0.554, 0.104),
    new THREE.MeshBasicMaterial({ map: neffFasciaTex })
  );
  neffFasciaOverlay.rotation.y = Math.PI / 2;
  neffFasciaOverlay.position.set(0.0125, 0, 0);
  neffFasciaGroup.add(neffFasciaOverlay);

  // Two Retractable / Elongated NEFF Rotary Control Dials (Left = Function, Right = Temperature)
  for (const dialZ of [-0.174, 0.174]) {
    const dialBezel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.006, 24),
      neffGraphiteMat
    );
    dialBezel.rotation.z = Math.PI / 2;
    dialBezel.position.set(0.014, -0.002, dialZ);
    neffFasciaGroup.add(dialBezel);

    const dialBarrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.018, 24),
      neffBlackGlassMat
    );
    dialBarrel.rotation.z = Math.PI / 2;
    dialBarrel.position.set(0.021, -0.002, dialZ);
    dialBarrel.castShadow = true;
    neffFasciaGroup.add(dialBarrel);

    // Characteristic NEFF elongated vertical selector blade across the rotary dial face
    const dialGripBlade = new THREE.Mesh(
      new THREE.BoxGeometry(0.008, 0.036, 0.006),
      neffGraphiteMat
    );
    dialGripBlade.position.set(0.031, -0.002, dialZ);
    dialGripBlade.castShadow = true;
    neffFasciaGroup.add(dialGripBlade);

    const dialPointerTick = new THREE.Mesh(
      new THREE.BoxGeometry(0.009, 0.008, 0.003),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    dialPointerTick.position.set(0.0315, 0.012, dialZ);
    neffFasciaGroup.add(dialPointerTick);
  }

  ovenTowerGroup.add(neffFasciaGroup);

  // Helper to build an authentic NEFF N50 Graphite oven door with:
  // - 4-sided hollow black ceramic glass surround (NO opaque backing blocking the window!)
  // - Brushed Graphite Grey outer vertical edge trims matching the fascia
  // - Silver heat-reflective inner window pinstripe
  // - Transparent smoked quadruple-glazed viewing window
  // - Sculpted Brushed Graphite Grey bar handle on twin standoffs
  const buildNeffGraphiteOvenDoor = (
    centerY: number,
    doorH: number,
    topRailH: number,
    botRailH: number,
    handleLocalY: number
  ): THREE.Group => {
    const doorGroup = new THREE.Group();
    doorGroup.position.set(0.344, centerY, 0);

    const totalW = 0.594;
    const edgeTrimW = 0.018;
    const blackStileW = 0.074;
    const winW = totalW - (edgeTrimW + blackStileW) * 2; // 0.410m clear window width
    const winH = Math.max(0.08, doorH - topRailH - botRailH);
    const winCenterY = (botRailH - topRailH) * 0.5;
    const doorThick = 0.024;

    // 1. Left & Right Outer Brushed Graphite Grey Vertical Trim Strips
    for (const sideZ of [-1, 1]) {
      const graphiteTrim = new THREE.Mesh(
        new THREE.BoxGeometry(doorThick + 0.002, doorH, edgeTrimW),
        neffGraphiteMat
      );
      graphiteTrim.position.set(0.001, 0, sideZ * (totalW * 0.5 - edgeTrimW * 0.5));
      graphiteTrim.castShadow = true;
      graphiteTrim.receiveShadow = true;
      doorGroup.add(graphiteTrim);

      // 2. Left & Right Gloss Black Ceramic Glass Vertical Stiles
      const blackStile = new THREE.Mesh(
        new THREE.BoxGeometry(doorThick, doorH, blackStileW),
        neffBlackGlassMat
      );
      blackStile.position.set(
        0,
        0,
        sideZ * (totalW * 0.5 - edgeTrimW - blackStileW * 0.5)
      );
      blackStile.castShadow = true;
      blackStile.receiveShadow = true;
      doorGroup.add(blackStile);
    }

    // 3. Top & Bottom Gloss Black Ceramic Glass Horizontal Rails
    const topRail = new THREE.Mesh(
      new THREE.BoxGeometry(doorThick, topRailH, winW),
      neffBlackGlassMat
    );
    topRail.position.set(0, doorH * 0.5 - topRailH * 0.5, 0);
    topRail.castShadow = true;
    topRail.receiveShadow = true;
    doorGroup.add(topRail);

    const botRail = new THREE.Mesh(
      new THREE.BoxGeometry(doorThick, botRailH, winW),
      neffBlackGlassMat
    );
    botRail.position.set(0, -doorH * 0.5 + botRailH * 0.5, 0);
    botRail.castShadow = true;
    botRail.receiveShadow = true;
    doorGroup.add(botRail);

    // 4. Inner Silver/Graphite Pinstripe Framing the Viewing Window Aperture
    const pThick = 0.004;
    for (const sy of [-1, 1]) {
      const hPin = new THREE.Mesh(
        new THREE.BoxGeometry(doorThick + 0.001, pThick, winW + pThick * 2),
        neffSilverPinstripeMat
      );
      hPin.position.set(0.001, winCenterY + sy * (winH * 0.5 + pThick * 0.5), 0);
      doorGroup.add(hPin);
    }
    for (const sz of [-1, 1]) {
      const vPin = new THREE.Mesh(
        new THREE.BoxGeometry(doorThick + 0.001, winH, pThick),
        neffSilverPinstripeMat
      );
      vPin.position.set(0.001, winCenterY, sz * (winW * 0.5 + pThick * 0.5));
      doorGroup.add(vPin);
    }

    // 5. Transparent Smoked Glass Viewing Window Pane (see-through into the lit NEFF cavity!)
    const windowGlass = new THREE.Mesh(
      new THREE.BoxGeometry(0.01, winH, winW),
      neffSmokedWindowMat
    );
    windowGlass.position.set(0.004, winCenterY, 0);
    doorGroup.add(windowGlass);

    // 6. Sculpted NEFF N50 Brushed Graphite Grey Bar Handle & Standoffs
    for (const sz of [-0.215, 0.215]) {
      const standoff = new THREE.Mesh(
        new THREE.BoxGeometry(0.028, 0.014, 0.022),
        neffGraphiteMat
      );
      standoff.position.set(0.024, handleLocalY, sz);
      standoff.castShadow = true;
      doorGroup.add(standoff);
    }
    const handleBar = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, 0.016, 0.485),
      neffGraphiteMat
    );
    handleBar.position.set(0.042, handleLocalY, 0);
    handleBar.castShadow = true;
    handleBar.receiveShadow = true;
    doorGroup.add(handleBar);

    ovenTowerGroup.add(doorGroup);
    interactions.registerHingedDoor(
      ovenTowerGroup,
      doorGroup,
      new THREE.Vector3(0, -doorH * 0.5 + 0.012, 0),
      'z',
      -Math.PI * 0.44
    );
    return doorGroup;
  };

  // =========================================================================
  // NEFF N50 U2ACH7A (GRAPHITE) — 2. TOP 34L SECONDARY OVEN / GRILL DOOR (Y = 1.430m..1.702m)
  // =========================================================================
  buildNeffGraphiteOvenDoor(1.566, 0.272, 0.068, 0.054, 0.098);

  // =========================================================================
  // NEFF N50 U2ACH7A (GRAPHITE) — 3. BOTTOM 71L MAIN CIRCOTHERM OVEN DOOR (Y = 0.840m..1.422m)
  // =========================================================================
  buildNeffGraphiteOvenDoor(1.131, 0.582, 0.098, 0.088, 0.238);

  // Top full-overlay Shaker cupboard door above NEFF Double Oven (Y = 1.83m..2.41m)
  const ovenTopDoor = addHowdensShakerDoor(
    ovenTowerGroup,
    0,
    2.12,
    0.34,
    0.67,
    0.58,
    'x',
    0.062
  );
  addChromeKnob(ovenTopDoor, 0.03, 1.92 - 2.12, -0.24, 'x');
  interactions.registerHingedDoor(
    ovenTowerGroup,
    ovenTopDoor,
    new THREE.Vector3(0.011, 0, 0.67 * 0.5 - 0.012),
    'y',
    -Math.PI * 0.62
  );

  westGroup.add(ovenTowerGroup);

  // 1c. WEST WALL BASE COUNTERTOP & L-SHAPED CORNER TOP UNITS (Z = -2.50m to -1.11m, length 1.39m)
  //     Exposed worktop length halved from 1.45m to 0.73m (Z = -1.84m to -1.11m) so the Oven Tower & Fridge-Freezer clear the Kitchen entrance!
  const westBaseLen = 1.39;
  // Blind corner base section (Z = -2.50m to -1.84m, length 0.66m) where North base cabinet meets West wall
  const westCornerBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 0.9, 0.66),
    doveGreyMat
  );
  westCornerBase.position.set(-4.07, 0.45, -2.17);
  westCornerBase.castShadow = true;
  westCornerBase.receiveShadow = true;
  westGroup.add(westCornerBase);

  // Exposed double-door West base cabinet carcass (Z = -1.84m to -1.11m, center Z = -1.475m, length 0.73m)
  buildHollowCabinetCarcass(westGroup, -4.07, 0, -1.475, 0.65, 0.9, 0.73, '+x', doveGreyMat, {
    plinthHeight: 0.14,
    interiorStyle: 'oak',
    shelfCount: 1,
    hasCenterMullion: true,
    includeItems: true,
  });

  const westTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.045, westBaseLen + 0.01),
    limestoneWorktopMat
  );
  westTop.position.set(-4.06, 0.92, -1.805);
  westTop.receiveShadow = true;
  westGroup.add(westTop);

  // 2 full-overlay Howdens Shaker base doors along the exposed West wall run (Z = -1.84m to -1.11m -> each 0.358m wide x 0.75m tall)
  for (const wz of [-1.656, -1.294]) {
    const hingeSideZ: -1 | 1 = wz < -1.475 ? -1 : 1;
    const knobZ = wz < -1.475 ? wz + 0.125 : wz - 0.125;
    const door = addHowdensShakerDoor(westGroup, wz, 0.515, -3.745, 0.358, 0.75, 'x', 0.054);
    addChromeKnob(door, 0.03, 0.81 - 0.515, knobZ - wz, 'x');
    interactions.registerHingedDoor(
      westGroup,
      door,
      new THREE.Vector3(0.011, 0, hingeSideZ * (0.358 * 0.5 - 0.012)),
      'y',
      -hingeSideZ * Math.PI * 0.62
    );
  }

  // Blind corner upper section (Z = -2.50m to -2.11m, length 0.39m) where North-West upper meets West upper (top flush at Y = 2.42m)
  const westUpperCorner = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.9, 0.39),
    doveGreyMat
  );
  westUpperCorner.position.set(-4.21, 1.97, -2.305);
  westUpperCorner.castShadow = true;
  westUpperCorner.receiveShadow = true;
  westUpperCutawayGroup.add(westUpperCorner);

  // Exposed double-door West upper wall cupboard carcass (Z = -2.11m to -1.11m, center Z = -1.61m, length 1.00m, top flush at Y = 2.42m)
  buildHollowCabinetCarcass(
    westUpperCutawayGroup,
    -4.21,
    1.52,
    -1.61,
    0.38,
    0.9,
    1.0,
    '+x',
    doveGreyMat,
    {
      plinthHeight: 0,
      interiorStyle: 'oak',
      shelfCount: 2,
      hasCenterMullion: true,
      includeItems: true,
    }
  );

  // 2 full-overlay Howdens Shaker upper wall cupboard doors along the West wall (Z = -2.11m to -1.11m -> each 0.492m wide x 0.88m tall)
  for (const uz of [-1.86, -1.36]) {
    const hingeSideZ: -1 | 1 = uz < -1.61 ? -1 : 1;
    const knobZ = uz < -1.61 ? uz + 0.185 : uz - 0.185;
    const door = addHowdensShakerDoor(westUpperCutawayGroup, uz, 1.97, -4.02, 0.492, 0.88, 'x', 0.056);
    addChromeKnob(door, 0.03, 1.62 - 1.97, knobZ - uz, 'x');
    interactions.registerHingedDoor(
      westUpperCutawayGroup,
      door,
      new THREE.Vector3(0.011, 0, hingeSideZ * (0.492 * 0.5 - 0.012)),
      'y',
      -hingeSideZ * Math.PI * 0.62
    );
  }

  // =========================================================================
  // 2. NORTH BACK WALL RUN (Left of Wide AGA: X = -3.76m to -2.92m, at Z = -2.17m)
  // =========================================================================
  buildHollowCabinetCarcass(northGroup, -3.335, 0, -2.17, 0.83, 0.9, 0.65, '+z', doveGreyMat, {
    plinthHeight: 0.14,
    interiorStyle: 'oak',
    shelfCount: 1,
    hasCenterMullion: true,
    includeItems: true,
  });

  const topLeft = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.045, 0.68), limestoneWorktopMat);
  topLeft.position.set(-3.35, 0.92, -2.16);
  topLeft.receiveShadow = true;
  northGroup.add(topLeft);

  // 2 full-overlay Howdens Shaker base doors between West corner (-3.745m) and AGA (-2.92m) -> each 0.406m wide x 0.75m tall
  for (const cx of [-3.54, -3.128]) {
    const hingeSideX: -1 | 1 = cx < -3.33 ? -1 : 1;
    const knobX = cx < -3.33 ? cx + 0.14 : cx - 0.14;
    const door = addHowdensShakerDoor(northGroup, cx, 0.515, -1.845, 0.406, 0.75, 'z', 0.056);
    addChromeKnob(door, knobX - cx, 0.81 - 0.515, 0.03, 'z');
    interactions.registerHingedDoor(
      northGroup,
      door,
      new THREE.Vector3(hingeSideX * (0.406 * 0.5 - 0.012), 0, 0.011),
      'y',
      hingeSideX * Math.PI * 0.62
    );
  }

  // =========================================================================
  // 3. WIDE ROYAL-SLATE BLUE CAST-IRON AGA (X = -2.92m to -1.40m, center X = -2.16m)
  // =========================================================================
  const agaGroup = new THREE.Group();
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
  const agaRearCore = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.91, 0.4), agaLightBlueMat);
  agaRearCore.position.set(0, 0.455, -0.16);
  agaRearCore.castShadow = true;
  agaGroup.add(agaRearCore);

  const agaFrontBlocks: ReadonlyArray<readonly [number, number, number, number]> = [
    // [centerX, centerY, widthX, heightY] spanning Z = +0.04m..+0.36m (depth 0.32m, center Z = +0.20m)
    [-0.705, 0.455, 0.11, 0.91], // Far-left vertical pier
    [-0.245, 0.455, 0.13, 0.91], // Left-center vertical pier
    [0.245, 0.455, 0.13, 0.91],  // Right-center vertical pier
    [0.705, 0.455, 0.11, 0.91],  // Far-right vertical pier
    [0.0, 0.05, 1.3, 0.1],       // Bottom plinth rail across all 3 columns
    [-0.48, 0.45, 0.34, 0.1],    // Left mid rail between top & bottom ovens
    [-0.48, 0.855, 0.34, 0.11],  // Left top rail above roasting oven
    [0.48, 0.45, 0.34, 0.1],     // Right mid rail between top & bottom ovens
    [0.48, 0.855, 0.34, 0.11],   // Right top rail above baking oven
    [0.0, 0.655, 0.36, 0.51],    // Center upper solid panel behind the AGA crest
  ];
  for (const [bx, by, bw, bh] of agaFrontBlocks) {
    const frontBlock = new THREE.Mesh(
      new THREE.BoxGeometry(bw, bh, 0.32),
      agaLightBlueMat
    );
    frontBlock.position.set(bx, by, 0.2);
    frontBlock.castShadow = true;
    frontBlock.receiveShadow = true;
    agaGroup.add(frontBlock);
  }

  const agaTop = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.035, 0.75), agaBlackTrimMat);
  agaTop.position.set(0, 0.92, 0);
  agaGroup.add(agaTop);

  // Small black cast-iron upstand running along the back edge of the AGA top
  const agaBackUpstand = new THREE.Mesh(
    new THREE.BoxGeometry(1.55, 0.055, 0.028),
    agaBlackTrimMat
  );
  agaBackUpstand.position.set(0, 0.965, -0.36);
  agaBackUpstand.castShadow = true;
  agaGroup.add(agaBackUpstand);

  const warmingPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.02, 0.42),
    agaBlackTrimMat
  );
  warmingPlate.position.set(-0.48, 0.942, -0.02);
  agaGroup.add(warmingPlate);

  // Closed-loop LatheGeometry profile so the chrome dome lid has a solid rolled bottom lip & underside
  const agaLidProfile: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.004),
    new THREE.Vector2(0.16, 0.004),
    new THREE.Vector2(0.164, 0.0),
    new THREE.Vector2(0.182, 0.0),
    new THREE.Vector2(0.18, 0.038),
    new THREE.Vector2(0.172, 0.052),
    new THREE.Vector2(0.155, 0.061),
    new THREE.Vector2(0.12, 0.065),
    new THREE.Vector2(0.0, 0.067),
  ];
  const agaLidGeo = new THREE.LatheGeometry(agaLidProfile, 24);

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

  for (const domeX of [-0.04, 0.44]) {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.2, 0.022, 18), chromeMat);
    ring.position.set(domeX, 0.944, -0.02);
    agaGroup.add(ring);

    // Circular machined cast-iron boiling/simmering hotplate inside the chrome surround (revealed when dome lid is lifted!)
    const hotplateDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.168, 0.168, 0.014, 24),
      castIronHotplateMat
    );
    hotplateDisc.position.set(domeX, 0.951, -0.02);
    agaGroup.add(hotplateDisc);

    // Interactive hinged chrome AGA insulating dome lid (lifts back on its rear hinge when clicked!)
    const lidGroup = new THREE.Group();
    lidGroup.position.set(domeX, 0.952, -0.02);

    const lid = new THREE.Mesh(agaLidGeo, chromeMat);
    lid.castShadow = true;
    lid.receiveShadow = true;
    lidGroup.add(lid);

    // Solid insulated brushed-stainless heat-shield liner plate on the underside of the AGA dome lid
    const undersideHeatLiner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.164, 0.164, 0.014, 24),
      agaLidUndersideLinerMat
    );
    undersideHeatLiner.position.set(0, 0.008, 0);
    lidGroup.add(undersideHeatLiner);

    // Stepped inner expansion ring & central retaining boss on the underside of the lid
    const undersideInnerStep = new THREE.Mesh(
      new THREE.CylinderGeometry(0.118, 0.122, 0.006, 22),
      castIronHotplateMat
    );
    undersideInnerStep.position.set(0, 0.002, 0);
    lidGroup.add(undersideInnerStep);

    const undersideCenterBoss = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.008, 14),
      chromeMat
    );
    undersideCenterBoss.position.set(0, 0.0, 0);
    lidGroup.add(undersideCenterBoss);

    // Rear hinge housing block at the back of the AGA dome lid
    const domeRearHinge = new THREE.Mesh(
      new THREE.BoxGeometry(0.068, 0.026, 0.038),
      chromeMat
    );
    domeRearHinge.position.set(0, 0.014, -0.178);
    lidGroup.add(domeRearHinge);

    const domeHandle = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.024, 0.036), agaBlackTrimMat);
    domeHandle.position.set(0, 0.023, 0.192);
    lidGroup.add(domeHandle);

    agaGroup.add(lidGroup);
    interactions.registerHingedDoor(
      agaGroup,
      lidGroup,
      new THREE.Vector3(0, 0, -0.18),
      'x',
      -Math.PI * 0.46
    );
  }

  // Raised cast-iron flue/extractor vent housing on top between the 2 hobs at the back (x = +0.20m, z = -0.24m)
  const agaTopVentBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 0.055, 0.13),
    agaBlackTrimMat
  );
  agaTopVentBase.position.set(0.2, 0.965, -0.24);
  agaTopVentBase.castShadow = true;
  agaGroup.add(agaTopVentBase);

  const agaTopVentCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.052, 0.068, 0.035, 16),
    agaBlackTrimMat
  );
  agaTopVentCap.position.set(0.2, 1.005, -0.24);
  agaGroup.add(agaTopVentCap);

  const agaTopVentGrille = new THREE.Mesh(
    new THREE.CylinderGeometry(0.044, 0.044, 0.008, 16),
    chromeMat
  );
  agaTopVentGrille.position.set(0.2, 1.023, -0.24);
  agaGroup.add(agaTopVentGrille);

  // Classic 5-door layout (NO top central door — the AGA crest sits in that top-center space instead):
  // [centerX, centerY, width, height, hingeSide (-1 = left outer edge, +1 = right outer edge)]
  const ovenCoords: ReadonlyArray<readonly [number, number, number, number, -1 | 1]> = [
    [-0.48, 0.65, 0.36, 0.32, -1],
    [-0.48, 0.25, 0.36, 0.32, -1],
    [0.0, 0.25, 0.38, 0.32, -1],
    [0.48, 0.65, 0.36, 0.32, 1],
    [0.48, 0.25, 0.36, 0.32, 1],
  ];
  for (const [ox, oy, ow, oh, hingeSide] of ovenCoords) {
    // Dark cast-iron oven interior cavity & wire rack inside each of the 5 AGA ovens (Z = +0.04m..+0.35m)
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
    );

    // Fixed black cast-iron surround on the AGA body
    const doorOutline = new THREE.Mesh(
      new THREE.BoxGeometry(ow + 0.012, oh + 0.012, 0.018),
      agaBlackTrimMat
    );
    doorOutline.position.set(ox, oy, 0.356);
    agaGroup.add(doorOutline);

    // Interactive hinged cast-iron AGA oven door (with dark heat-shield liner on back of door)
    const agaDoorGroup = new THREE.Group();
    agaDoorGroup.position.set(ox, oy, 0.365);

    const door = new THREE.Mesh(new THREE.BoxGeometry(ow, oh, 0.038), agaLightBlueMat);
    door.castShadow = true;
    agaDoorGroup.add(door);

    const doorInnerHeatLiner = new THREE.Mesh(
      new THREE.BoxGeometry(ow - 0.045, oh - 0.045, 0.014),
      castIronHotplateMat
    );
    doorInnerHeatLiner.position.set(0, 0, -0.02);
    agaDoorGroup.add(doorInnerHeatLiner);

    const doorRaisedPanel = new THREE.Mesh(
      new THREE.BoxGeometry(ow - 0.036, oh - 0.036, 0.014),
      agaLightBlueMat
    );
    doorRaisedPanel.position.set(0, 0, 0.021);
    agaDoorGroup.add(doorRaisedPanel);

    // Large body-colored cast-iron hinges on the outer edge of each door (top & bottom hinge lugs + vertical pin barrel)
    const hingeX = ox + hingeSide * (ow * 0.5 + 0.012);
    for (const hyOffset of [-oh * 0.28, oh * 0.28]) {
      const hingeStrap = new THREE.Mesh(
        new THREE.BoxGeometry(0.056, 0.042, 0.032),
        agaLightBlueMat
      );
      hingeStrap.position.set(hingeSide * (ow * 0.5 - 0.004), hyOffset, 0.011);
      hingeStrap.castShadow = true;
      agaDoorGroup.add(hingeStrap);

      const hingeBarrel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.014, 0.058, 10),
        agaLightBlueMat
      );
      hingeBarrel.position.set(hingeX, oy + hyOffset, 0.378);
      hingeBarrel.castShadow = true;
      agaGroup.add(hingeBarrel);
    }

    // Opposite inner-edge door catch lug
    const catchSide = -hingeSide;
    const doorCatch = new THREE.Mesh(
      new THREE.BoxGeometry(0.026, 0.036, 0.028),
      agaLightBlueMat
    );
    doorCatch.position.set(catchSide * (ow * 0.5 - 0.002), 0, 0.013);
    agaDoorGroup.add(doorCatch);

    agaGroup.add(agaDoorGroup);
    interactions.registerHingedDoor(
      agaGroup,
      agaDoorGroup,
      new THREE.Vector3(hingeSide * (ow * 0.5 + 0.012), 0, 0.013),
      'y',
      hingeSide * Math.PI * 0.62
    );
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

  const agaCrestBacking = new THREE.Mesh(
    new THREE.CylinderGeometry(0.068, 0.068, 0.012, 24),
    chromeMat
  );
  agaCrestBacking.rotation.x = Math.PI / 2;
  agaCrestBacking.scale.set(1.35, 1.0, 0.85);
  agaCrestBacking.position.set(0.0, 0.66, 0.364);
  agaGroup.add(agaCrestBacking);

  const agaCrestFace = new THREE.Mesh(
    new THREE.PlaneGeometry(0.175, 0.108),
    new THREE.MeshStandardMaterial({
      map: crestTex,
      transparent: true,
      roughness: 0.22,
      metalness: 0.25,
    })
  );
  agaCrestFace.position.set(0.0, 0.66, 0.371);
  agaGroup.add(agaCrestFace);

  // Split Chrome Towel Rail (1/3 length below the plate warmer side on the left, gap in between, 2/3 length below the 2 hobs on the right)
  const railSections: ReadonlyArray<readonly [number, number]> = [
    // [centerX, length]
    [-0.5, 0.44], // Left 1/3 rail below plate warmer (-0.72m to -0.28m)
    [0.24, 0.92], // Right 2/3 rail below the two hobs (-0.22m to +0.70m), leaving a 6cm gap between rails
  ];
  for (const [rx, rLen] of railSections) {
    const railBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.013, 0.013, rLen, 12),
      chromeMat
    );
    railBar.rotation.z = Math.PI / 2;
    railBar.position.set(rx, 0.86, 0.44);
    railBar.castShadow = true;
    agaGroup.add(railBar);

    // Brackets & black end-caps at each end of the rail section
    for (const endSide of [-1, 1]) {
      const endX = rx + endSide * (rLen * 0.5 - 0.02);
      const bracket = new THREE.Mesh(
        new THREE.BoxGeometry(0.022, 0.022, 0.085),
        agaBlackTrimMat
      );
      bracket.position.set(endX, 0.86, 0.398);
      agaGroup.add(bracket);

      const endFinial = new THREE.Mesh(
        new THREE.SphereGeometry(0.016, 10, 8),
        agaBlackTrimMat
      );
      endFinial.position.set(rx + endSide * (rLen * 0.5), 0.86, 0.44);
      agaGroup.add(endFinial);
    }
  }

  northGroup.add(agaGroup);

  // =========================================================================
  // 4. INDUCTION HOB, DUALIT TOASTER & BASE UNIT TO THE RIGHT OF THE AGA (X = -1.40m to +0.66m, center X = -0.37m, width 2.06m)
  // =========================================================================
  // Left half (X = -1.40m to -0.38m, width 1.02m): Hollow drawer carcass behind the 2 wide pan drawers
  buildHollowCabinetCarcass(northGroup, -0.89, 0, -2.17, 1.02, 0.9, 0.65, '+z', doveGreyMat, {
    plinthHeight: 0.14,
    interiorStyle: 'oak',
    shelfCount: 1,
    includeItems: false,
  });
  // Right half (X = -0.38m to +0.66m, width 1.04m): Hollow double-door base cupboard carcass
  buildHollowCabinetCarcass(northGroup, 0.14, 0, -2.17, 1.04, 0.9, 0.65, '+z', doveGreyMat, {
    plinthHeight: 0.14,
    interiorStyle: 'oak',
    shelfCount: 1,
    hasCenterMullion: true,
    includeItems: true,
  });

  const topRightRun = new THREE.Mesh(new THREE.BoxGeometry(2.08, 0.045, 0.68), limestoneWorktopMat);
  topRightRun.position.set(-0.37, 0.92, -2.16);
  topRightRun.receiveShadow = true;
  northGroup.add(topRightRun);

  // 2 Wide Full-Overlay Howdens Shaker Pan Drawers under the Induction Hob (X = -1.40m to -0.38m, width 1.01m)
  for (const dy of [0.328, 0.704]) {
    const panDrawer = addHowdensShakerDoor(
      northGroup,
      -0.89,
      dy,
      -1.845,
      1.01,
      0.37,
      'z',
      0.06,
      0.048
    );

    // Pair of brushed stainless knobs on each wide pan drawer
    for (const kx of [-1.14, -0.64]) {
      addChromeKnob(panDrawer, kx - -0.89, 0.02, 0.03, 'z');
    }

    // Attach 3D oak dovetail drawer box + Le Creuset casserole & stainless saucepan inside the drawer!
    attachDrawerBoxBehindFront(panDrawer, 1.01, 0.35, 0.54, '+z', true);

    interactions.registerSlidingDrawer(panDrawer, new THREE.Vector3(0, 0, 0.42));
  }

  // 2 Full-Overlay Howdens Shaker Base Doors to the right of the Pan Drawers (X = -0.38m to +0.66m -> each 0.512m wide x 0.75m tall)
  for (const rx of [-0.12, 0.398]) {
    const hingeSideX: -1 | 1 = rx < 0.14 ? -1 : 1;
    const knobX = rx < 0.14 ? rx + 0.195 : rx - 0.195;
    const door = addHowdensShakerDoor(northGroup, rx, 0.515, -1.845, 0.512, 0.75, 'z', 0.062);
    addChromeKnob(door, knobX - rx, 0.81 - 0.515, 0.03, 'z');
    interactions.registerHingedDoor(
      northGroup,
      door,
      new THREE.Vector3(hingeSideX * (0.512 * 0.5 - 0.012), 0, 0.011),
      'y',
      hingeSideX * Math.PI * 0.62
    );
  }

  // 4-Zone Black Ceramic Glass Induction Hob on the Worktop to the right of the AGA (centered at X = -0.82m, Z = -2.15m)
  const hobGroup = new THREE.Group();
  hobGroup.position.set(-0.82, 0.945, -2.15);

  const hobGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.82, 0.012, 0.52),
    ovenGlassMat
  );
  hobGroup.add(hobGlass);

  const hobBevel = new THREE.Mesh(
    new THREE.BoxGeometry(0.835, 0.006, 0.535),
    stainlessSteelMat
  );
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
  for (const [zx, zz, zr] of zoneCoords) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(zr - 0.006, zr, 24), zoneRingMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(zx, 0.007, zz);
    hobGroup.add(ring);

    const crossH = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.003), zoneRingMat);
    crossH.rotation.x = -Math.PI / 2;
    crossH.position.set(zx, 0.007, zz);
    hobGroup.add(crossH);
  }

  const touchBar = new THREE.Mesh(
    new THREE.PlaneGeometry(0.36, 0.028),
    new THREE.MeshBasicMaterial({ color: 0x993322 })
  );
  touchBar.rotation.x = -Math.PI / 2;
  touchBar.position.set(0, 0.007, 0.21);
  hobGroup.add(touchBar);

  northGroup.add(hobGroup);

  // Dualit Classic 4-Slot Polished Chrome Toaster at X = +0.34m
  buildDualitToaster(northGroup, 0.34, 0.943, -2.14);

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
  const marbleBacksplash = new THREE.Mesh(
    new THREE.BoxGeometry(2.77, 1.0, 0.024),
    marbleBacksplashMat
  );
  marbleBacksplash.position.set(-1.555, 1.42, -2.482);
  marbleBacksplash.receiveShadow = true;
  northUpperCutawayGroup.add(marbleBacksplash);

  const wideHoodGroup = new THREE.Group();
  wideHoodGroup.position.set(-1.555, 0, -2.27);

  // Raised higher above the kitchen units (mantel shelf at Y = 1.94m, chimney up to ceiling Y = 3.00m) for generous clearance above the AGA & Hob
  const mantleHood = new THREE.Mesh(new THREE.BoxGeometry(2.75, 1.05, 0.46), wallPlasterMat);
  mantleHood.position.set(0, 2.475, 0);
  mantleHood.castShadow = true;
  mantleHood.receiveShadow = true;
  wideHoodGroup.add(mantleHood);

  for (const cx of [-1.285, 1.285]) {
    const corbel = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.22, 0.48),
      doveGreyMat
    );
    corbel.position.set(cx, 1.8, 0.01);
    wideHoodGroup.add(corbel);
  }

  const mantleShelfLower = new THREE.Mesh(
    new THREE.BoxGeometry(2.78, 0.028, 0.485),
    doveGreyMat
  );
  mantleShelfLower.position.set(0, 1.905, 0.01);
  wideHoodGroup.add(mantleShelfLower);

  const mantleShelf = new THREE.Mesh(new THREE.BoxGeometry(2.81, 0.038, 0.505), doveGreyMat);
  mantleShelf.position.set(0, 1.938, 0.018);
  wideHoodGroup.add(mantleShelf);

  const hoodTopCornice = new THREE.Mesh(
    new THREE.BoxGeometry(2.77, 0.04, 0.475),
    wallPlasterMat
  );
  hoodTopCornice.position.set(0, 2.97, 0.005);
  wideHoodGroup.add(hoodTopCornice);

  for (const bx of [-0.64, 0.62]) {
    const baffle = new THREE.Mesh(
      new THREE.BoxGeometry(1.02, 0.02, 0.34),
      stainlessSteelMat
    );
    baffle.position.set(bx, 1.9, 0.02);
    wideHoodGroup.add(baffle);
  }

  northUpperCutawayGroup.add(wideHoodGroup);

  // =========================================================================
  // 6. COUNTERTOP BI-FOLD PANTRY UNIT NEAR THE TV
  //    - Upper Bi-Fold Pantry Cupboard spans X = +0.66m to +1.70m (width 1.04m, center X = +1.18m),
  //      leaving a 15cm gap (X = +1.70m..+1.85m) between the upper pantry cupboard and the X = +1.85m wall!
  //    - Lower base section & continuous Carrara marble worktop extend all the way to X = +1.85m
  //      (with a thin 15cm base cupboard in the X = +1.70m..+1.85m gap beneath the worktop!)
  // =========================================================================
  const pantryGroup = new THREE.Group();
  pantryGroup.position.set(1.255, 0, -2.17);

  // Main lower double-door base cabinet under the upper pantry (X = +0.66m..+1.70m -> local x = -0.075m, width = 1.04m)
  buildHollowCabinetCarcass(pantryGroup, -0.075, 0, 0, 1.04, 0.9, 0.65, '+z', doveGreyMat, {
    plinthHeight: 0.14,
    interiorStyle: 'pantry',
    shelfCount: 1,
    hasCenterMullion: true,
    includeItems: true,
  });

  // Thin 15cm base cupboard in the gap between the pantry and the X = +1.85m wall (X = +1.70m..+1.85m -> local x = +0.52m, width = 0.15m)
  buildHollowCabinetCarcass(pantryGroup, 0.52, 0, 0, 0.15, 0.9, 0.65, '+z', doveGreyMat, {
    plinthHeight: 0.14,
    interiorStyle: 'oak',
    shelfCount: 1,
    hasCenterMullion: false,
    includeItems: false,
  });

  // Continuous Carrara marble worktop running across the full base (X = +0.66m..+1.85m, width = 1.19m),
  // forming both the ~15cm lip in front of the upper pantry AND the exposed worktop in the 15cm right-hand gap!
  const pantryWorktopLip = new THREE.Mesh(
    new THREE.BoxGeometry(1.19, 0.045, 0.68),
    limestoneWorktopMat
  );
  pantryWorktopLip.position.set(0, 0.92, 0.01);
  pantryWorktopLip.castShadow = true;
  pantryWorktopLip.receiveShadow = true;
  pantryGroup.add(pantryWorktopLip);

  // 2 Full-Overlay Howdens Shaker lower cupboard doors below the upper pantry (X = +0.66m..+1.70m -> each 0.512m wide x 0.75m tall)
  for (const dx of [-0.334, 0.184]) {
    const hingeSideX: -1 | 1 = dx < -0.075 ? -1 : 1;
    const innerEdgeX = dx < -0.075 ? dx + 0.195 : dx - 0.195;
    const door = addHowdensShakerDoor(pantryGroup, dx, 0.515, 0.325, 0.512, 0.75, 'z', 0.058);
    addChromeKnob(door, innerEdgeX - dx, 0.81 - 0.515, 0.03, 'z');
    interactions.registerHingedDoor(
      pantryGroup,
      door,
      new THREE.Vector3(hingeSideX * (0.512 * 0.5 - 0.012), 0, 0.011),
      'y',
      hingeSideX * Math.PI * 0.62
    );
  }

  // Thin 15cm Shaker base cupboard door in the right-hand gap (X = +1.70m..+1.85m -> local x = +0.52m, width = 0.144m x 0.75m tall)
  const thinGapBaseDoor = addHowdensShakerDoor(
    pantryGroup,
    0.52,
    0.515,
    0.325,
    0.144,
    0.75,
    'z',
    0.036,
    0.058
  );
  addChromeKnob(thinGapBaseDoor, -0.035, 0.81 - 0.515, 0.03, 'z');
  interactions.registerHingedDoor(
    pantryGroup,
    thinGapBaseDoor,
    new THREE.Vector3(0.144 * 0.5 - 0.012, 0, 0.011),
    'y',
    Math.PI * 0.62
  );

  // Upper Countertop Pantry Carcass (X = +0.66m..+1.70m -> local x = -0.075m, width = 1.04m, leaving a 15cm gap to the X = +1.85m wall!)
  // Set back by 15cm (depth = 0.50m, z = -0.075 so front is at z = +0.175, leaving 17.5cm worktop lip in front!)
  buildHollowCabinetCarcass(pantryGroup, -0.075, 0.94, -0.075, 1.04, 1.48, 0.5, '+z', doveGreyMat, {
    plinthHeight: 0,
    interiorStyle: 'pantry',
    shelfCount: 3,
    hasCenterMullion: false,
    includeItems: true,
  });

  // Coving-like mantel cornice wrapping around the 3 exposed sides of the Upper Pantry Cupboard (Left -X, Front +Z, and Right +X; open against North back wall)
  addCovingMantelCornice(pantryGroup, -0.075, 2.42, -0.075, 1.04, 0.5, 0.042, 0.042, 0, 0.042, {
    back: true,
  });

  // 4 Full-Overlay Bi-Fold Howdens Shaker Door Panes on the 1.04m-wide Upper Pantry (each 0.254m wide x 1.45m tall)
  const bifoldPaneCentersX: readonly [number, number, number, number] = [
    -0.4635,
    -0.2045,
    0.0545,
    0.3135,
  ];
  const bifoldLeaves: THREE.Group[] = [];
  for (const px of bifoldPaneCentersX) {
    const leaf = addHowdensShakerDoor(
      pantryGroup,
      px,
      1.68,
      0.175,
      0.254,
      1.45,
      'z',
      0.044,
      0.054,
      true
    );
    bifoldLeaves.push(leaf);
  }

  // Attach bi-fold knuckle hinges and brushed stainless knobs directly to the 4 folding leaves
  const [leftOuterLeaf, leftInnerLeaf, rightInnerLeaf, rightOuterLeaf] = bifoldLeaves;
  if (leftOuterLeaf && leftInnerLeaf && rightInnerLeaf && rightOuterLeaf) {
    for (const hingeY of [1.18, 1.68, 2.18]) {
      const leftKnuckle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0045, 0.0045, 0.04, 8),
        chromeKnobMat
      );
      leftKnuckle.position.set(0.127, hingeY - 1.68, 0.023);
      leftOuterLeaf.add(leftKnuckle);

      const rightKnuckle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0045, 0.0045, 0.04, 8),
        chromeKnobMat
      );
      rightKnuckle.position.set(-0.127, hingeY - 1.68, 0.023);
      rightOuterLeaf.add(rightKnuckle);
    }

    addChromeKnob(leftInnerLeaf, 0.09, 1.24 - 1.68, 0.03, 'z');
    addChromeKnob(leftInnerLeaf, -0.09, 1.24 - 1.68, 0.03, 'z');
    addChromeKnob(rightInnerLeaf, -0.09, 1.24 - 1.68, 0.03, 'z');
    addChromeKnob(rightInnerLeaf, 0.09, 1.24 - 1.68, 0.03, 'z');

    interactions.registerBifoldCupboardPair(
      pantryGroup,
      leftOuterLeaf,
      leftInnerLeaf,
      -1,
      0.254,
      0.175
    );
    interactions.registerBifoldCupboardPair(
      pantryGroup,
      rightOuterLeaf,
      rightInnerLeaf,
      1,
      0.254,
      0.175
    );
  }

  northGroup.add(pantryGroup);

  // ESPRESSO COFFEE MACHINE & BURR GRINDER in the North-West corner (at X = -3.88m, Z = -2.053m — Issue #6)
  buildCoffeeMachineAndGrinder(northGroup, -3.88, 0.945, -2.053, Math.PI * 0.25);

  // Single Upper Dove Grey Wall Cabinet along the North-West Back Wall (X = -4.40m to -3.45m, top flush at Y = 2.42m)
  // Blind left corner section behind West upper cupboard (X = -4.40m to -4.02m, width 0.38m)
  const northWestUpperCorner = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.9, 0.38),
    doveGreyMat
  );
  northWestUpperCorner.position.set(-4.21, 1.97, -2.31);
  northWestUpperCorner.castShadow = true;
  northWestUpperCorner.receiveShadow = true;
  northUpperCutawayGroup.add(northWestUpperCorner);

  // Exposed single-door North-West upper cupboard carcass (X = -4.02m to -3.45m, center X = -3.735m, width 0.57m, top flush at Y = 2.42m)
  buildHollowCabinetCarcass(
    northUpperCutawayGroup,
    -3.735,
    1.52,
    -2.31,
    0.57,
    0.9,
    0.38,
    '+z',
    doveGreyMat,
    {
      plinthHeight: 0,
      interiorStyle: 'oak',
      shelfCount: 2,
      includeItems: true,
    }
  );

  // Full-overlay Howdens Shaker door on the exposed front of the North-West Upper Cupboard (X = -4.02m to -3.45m -> 0.56m wide x 0.88m tall)
  const nwUpperDoor = addHowdensShakerDoor(
    northUpperCutawayGroup,
    -3.735,
    1.97,
    -2.12,
    0.56,
    0.88,
    'z',
    0.062
  );
  addChromeKnob(nwUpperDoor, -3.52 - -3.735, 1.62 - 1.97, 0.03, 'z');
  interactions.registerHingedDoor(
    northUpperCutawayGroup,
    nwUpperDoor,
    new THREE.Vector3(-(0.56 * 0.5 - 0.012), 0, 0.011),
    'y',
    -Math.PI * 0.62
  );

  // =========================================================================
  // SINGLE CONTINUOUS CORNICE PLINTH ACROSS THE ENTIRE WEST + NORTH-WEST RUN
  // (Tall Fridge/Oven Towers Z=+0.53..-1.11 -> West Upper Z=-1.11..-2.50 -> NW Upper X=-4.40..-3.45)
  // Flush at baseY = 2.42m with ONE continuous recessed void and NO internal dividers or wall bars!
  // =========================================================================
  {
    const baseY = 2.42;
    const rimW = 0.032;

    // Continuous recessed void floor across all 3 connected cabinet sections at y = 2.422m
    const voidTowerFloor = new THREE.Mesh(
      new THREE.BoxGeometry(0.68 - rimW, 0.004, 1.64 - rimW),
      corniceVoidFloorMat
    );
    voidTowerFloor.position.set(-4.4 + (0.68 - rimW) * 0.5, baseY + 0.002, (-1.11 + (0.53 - rimW)) * 0.5);
    voidTowerFloor.receiveShadow = true;
    westGroup.add(voidTowerFloor);

    const voidWestUpperFloor = new THREE.Mesh(
      new THREE.BoxGeometry(0.38 - rimW, 0.004, 1.39),
      corniceVoidFloorMat
    );
    voidWestUpperFloor.position.set(-4.4 + (0.38 - rimW) * 0.5, baseY + 0.002, -1.805);
    voidWestUpperFloor.receiveShadow = true;
    westUpperCutawayGroup.add(voidWestUpperFloor);

    const voidNwUpperFloor = new THREE.Mesh(
      new THREE.BoxGeometry(-3.482 - (-4.4 + (0.38 - rimW)), 0.004, 0.38 - rimW),
      corniceVoidFloorMat
    );
    voidNwUpperFloor.position.set(
      (-4.4 + (0.38 - rimW) + -3.482) * 0.5,
      baseY + 0.002,
      -2.5 + (0.38 - rimW) * 0.5
    );
    voidNwUpperFloor.receiveShadow = true;
    northUpperCutawayGroup.add(voidNwUpperFloor);

    const continuousTiers: ReadonlyArray<readonly [number, number, number]> = [
      [0.22, 0.018, 0.009],
      [0.46, 0.018, 0.027],
      [0.72, 0.018, 0.045],
      [1.0, 0.024, 0.066],
    ];

    for (const [frac, th, yOff] of continuousTiers) {
      const ov = 0.038 * frac;
      const tierY = baseY + yOff;

      const addSeg = (
        parent: THREE.Object3D,
        minX: number,
        maxX: number,
        minZ: number,
        maxZ: number
      ): void => {
        const seg = new THREE.Mesh(
          new THREE.BoxGeometry(maxX - minX, th, maxZ - minZ),
          doveGreyMat
        );
        seg.position.set((minX + maxX) * 0.5, tierY, (minZ + maxZ) * 0.5);
        seg.castShadow = true;
        seg.receiveShadow = true;
        parent.add(seg);
      };

      // 1. South Return of Tall Fridge Tower (Z = +0.53m, from West wall X=-4.40 to East overhang X=-3.72+ov)
      addSeg(westGroup, -4.4, -3.72 + ov, 0.53 - rimW, 0.53 + ov);

      // 2. East Front of Tall Fridge & Oven Towers (X = -3.72m, from Z=-1.11-ov to South Return Z=0.53-rimW)
      addSeg(westGroup, -3.72 - rimW, -3.72 + ov, -1.11 - ov, 0.53 - rimW);

      // 3. Step-Back Return at Z = -1.11m ONLY across the 30cm step-back (X = -4.02-rimW to -3.72-rimW), leaving the void open!
      addSeg(westGroup, -4.02 - rimW, -3.72 - rimW, -1.11 - ov, -1.11 + rimW);

      // 4. East Front of West Upper Cupboard (X = -4.02m, stopping at the inner L-corner Z = -2.12-rimW so there is NO corner divider!)
      addSeg(westUpperCutawayGroup, -4.02 - rimW, -4.02 + ov, -2.12 - rimW, -1.11 - ov);

      // 5. South Front of North-West Upper Cupboard (Z = -2.12m, meeting Segment 4 at X = -4.02+ov and running East to X = -3.45+ov)
      addSeg(northUpperCutawayGroup, -4.02 + ov, -3.45 + ov, -2.12 - rimW, -2.12 + ov);

      // 6. East Return of North-West Upper Cupboard (X = -3.45m, from North wall Z=-2.50 to South Front Z=-2.12-rimW)
      addSeg(northUpperCutawayGroup, -3.45 - rimW, -3.45 + ov, -2.5, -2.12 - rimW);
    }
  }

  // =========================================================================
  // 7. CARRARA MARBLE WORKTOP UPSTANDS (95mm tall x 22mm thick ONLY against plaster walls, not cupboard side panels)
  // =========================================================================
  const upstandSegments: ReadonlyArray<
    readonly [number, number, number, number, number, 'west' | 'north']
  > = [
    // [centerX, centerZ, widthX, depthZ, heightY, wallGroup]
    // West plaster wall back upstand (Z = -2.50m to -1.11m)
    [-4.388, -1.805, 0.022, 1.39, 0.095, 'west'],
    // North plaster wall back upstand (X = -4.39m to -2.92m, left of AGA)
    [-3.655, -2.488, 1.47, 0.022, 0.095, 'north'],
    // North plaster wall back upstand (X = -0.17m to +0.66m, right of backsplash behind Dualit toaster)
    [0.245, -2.488, 0.83, 0.022, 0.095, 'north'],
    // North plaster wall back upstand in the 15cm gap to the right of the upper pantry (X = +1.70m to +1.85m)
    [1.775, -2.488, 0.15, 0.022, 0.095, 'north'],
    // Right worktop upstand against the X = +1.85m Utility Room West partition wall across the full 0.68m worktop depth (Z = -2.50m to -1.82m)
    [1.839, -2.16, 0.022, 0.68, 0.095, 'north'],
  ];

  for (const [ux, uz, uw, ud, uh, groupKey] of upstandSegments) {
    const upstand = new THREE.Mesh(
      new THREE.BoxGeometry(uw, uh, ud),
      limestoneWorktopMat
    );
    upstand.position.set(ux, 0.9425 + uh * 0.5, uz);
    upstand.receiveShadow = true;
    (groupKey === 'west' ? westGroup : northGroup).add(upstand);
  }
}

