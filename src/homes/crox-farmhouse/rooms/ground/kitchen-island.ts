import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import type { SceneInteractionManager } from '../../../../engine/scene/interaction-manager.ts';
import {
  createBrushedStainlessTexture,
  createDriftwoodTexture,
  createMarbleBacksplashTexture,
  createPolishedChromeTexture,
} from '../../../../engine/textures/procedural-textures.ts';
import { buildHollowCabinetCarcass } from '../../../../objects/joinery/cabinet-interior.ts';

function buildUnderCounterWineCooler(
  islandGroup: THREE.Group,
  localX: number,
  frontZ: number,
  interactions: SceneInteractionManager
): void {
  const coolerGroup = new THREE.Group();
  coolerGroup.name = 'island.wineCooler';
  coolerGroup.position.set(localX, 0, frontZ);

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
  const cavW = 0.6;
  const cavH = 0.76;
  const cavMidY = 0.48;
  const cavD = 0.36;
  const wallT = 0.02;
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(cavW, cavH, wallT), darkCavityMat);
  backWall.name = 'wineCooler.cavity.back';
  backWall.position.set(0, cavMidY, -cavD + wallT * 0.5);
  coolerGroup.add(backWall);

  for (const side of [-1, 1]) {
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(wallT, cavH, cavD), darkCavityMat);
    sideWall.name = side < 0 ? 'wineCooler.cavity.left' : 'wineCooler.cavity.right';
    sideWall.position.set(side * (cavW * 0.5 - wallT * 0.5), cavMidY, -cavD * 0.5);
    coolerGroup.add(sideWall);
  }
  for (const vSide of [-1, 1]) {
    const tbWall = new THREE.Mesh(
      new THREE.BoxGeometry(cavW - wallT * 2, wallT, cavD),
      darkCavityMat
    );
    tbWall.name = vSide < 0 ? 'wineCooler.cavity.bottom' : 'wineCooler.cavity.top';
    tbWall.position.set(0, cavMidY + vSide * (cavH * 0.5 - wallT * 0.5), -cavD * 0.5);
    coolerGroup.add(tbWall);
  }

  // Warm amber interior display glow strip at top of wine cooler cavity
  const ledStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.012, 0.04),
    new THREE.MeshBasicMaterial({ color: 0xffb85c })
  );
  ledStrip.name = 'wineCooler.ledStrip';
  ledStrip.position.set(0, 0.832, -0.08);
  coolerGroup.add(ledStrip);

  // Dual-zone digital temperature control bar in the middle
  const zoneDivider = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.032, 0.31), stainlessMat);
  zoneDivider.name = 'wineCooler.zoneDivider';
  zoneDivider.position.set(0, 0.48, -0.16);
  coolerGroup.add(zoneDivider);

  const tempDisplay = new THREE.Mesh(
    new THREE.PlaneGeometry(0.12, 0.016),
    new THREE.MeshBasicMaterial({ color: 0x6ec6ff })
  );
  tempDisplay.name = 'wineCooler.tempDisplay';
  tempDisplay.position.set(0, 0.48, -0.003);
  coolerGroup.add(tempDisplay);

  // 5 Beechwood slide-out wine shelves with full-length horizontal wine bottles inside the cavity
  const shelfHeights = [0.19, 0.3, 0.4, 0.59, 0.71];
  for (const sy of shelfHeights) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.018, 0.29), beechWoodMat);
    shelf.name = 'wineCooler.shelf';
    shelf.position.set(0, sy, -0.16);
    coolerGroup.add(shelf);

    for (const bx of [-0.18, -0.09, 0.0, 0.09, 0.18]) {
      const bottleBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.032, 0.032, 0.18, 10),
        bottleGlassMat
      );
      bottleBody.rotation.x = Math.PI / 2;
      bottleBody.position.set(bx, sy + 0.038, -0.19);
      coolerGroup.add(bottleBody);

      const bottleNeck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.028, 0.065, 8),
        bottleGlassMat
      );
      bottleNeck.rotation.x = Math.PI / 2;
      bottleNeck.position.set(bx, sy + 0.038, -0.07);
      coolerGroup.add(bottleNeck);

      const capsule = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0125, 0.0125, 0.022, 8),
        foilMat
      );
      capsule.rotation.x = Math.PI / 2;
      capsule.position.set(bx, sy + 0.038, -0.03);
      coolerGroup.add(capsule);
    }
  }

  // Interactive hinged Brushed Stainless Steel + Tinted Glass Wine Cooler Door (0.596m x 0.756m, y = 0.102..0.858m)
  const coolerDoorGroup = new THREE.Group();
  coolerDoorGroup.name = 'wineCooler.door';
  coolerDoorGroup.position.set(0, cavMidY, 0.014);

  const doorW = 0.596;
  const doorH = 0.756;
  const stileW = 0.046;
  const doorThick = 0.024;
  const innerPaneW = doorW - stileW * 2;
  const innerPaneH = doorH - stileW * 2;

  // Perimeter magnetic door gasket behind the stainless steel door frame
  for (const vSide of [-1, 1]) {
    const hGasket = new THREE.Mesh(
      new THREE.BoxGeometry(doorW - 0.008, 0.024, 0.01),
      gasketMat
    );
    hGasket.position.set(0, vSide * (doorH * 0.5 - 0.016), -0.012);
    coolerDoorGroup.add(hGasket);
  }
  for (const side of [-1, 1]) {
    const vGasket = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, doorH - 0.048, 0.01),
      gasketMat
    );
    vGasket.position.set(side * (doorW * 0.5 - 0.016), 0, -0.012);
    coolerDoorGroup.add(vGasket);
  }

  const topRail = new THREE.Mesh(
    new THREE.BoxGeometry(doorW, stileW, doorThick),
    stainlessMat
  );
  topRail.name = 'wineCooler.door.topRail';
  topRail.position.set(0, (doorH - stileW) * 0.5, 0);
  topRail.castShadow = true;
  coolerDoorGroup.add(topRail);

  const botRail = new THREE.Mesh(
    new THREE.BoxGeometry(doorW, stileW, doorThick),
    stainlessMat
  );
  botRail.name = 'wineCooler.door.bottomRail';
  botRail.position.set(0, -(doorH - stileW) * 0.5, 0);
  botRail.castShadow = true;
  coolerDoorGroup.add(botRail);

  for (const side of [-1, 1]) {
    const vertStile = new THREE.Mesh(
      new THREE.BoxGeometry(stileW, innerPaneH, doorThick),
      stainlessMat
    );
    vertStile.name = side < 0 ? 'wineCooler.door.leftStile' : 'wineCooler.door.rightStile';
    vertStile.position.set(side * ((doorW - stileW) * 0.5), 0, 0);
    vertStile.castShadow = true;
    coolerDoorGroup.add(vertStile);
  }

  // Tinted UV-Glass window pane
  const glassPane = new THREE.Mesh(
    new THREE.BoxGeometry(innerPaneW, innerPaneH, 0.012),
    tintedGlassMat
  );
  glassPane.name = 'wineCooler.door.glass';
  glassPane.position.set(0, 0, 0.002);
  coolerDoorGroup.add(glassPane);

  // Vertical brushed stainless steel bar handle on the right stile of the wine cooler door
  const handleX = (doorW - stileW) * 0.5;
  const handleBar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.009, 0.52, 10),
    stainlessMat
  );
  handleBar.name = 'wineCooler.door.handle';
  handleBar.position.set(handleX, 0, 0.034);
  coolerDoorGroup.add(handleBar);

  for (const hy of [-0.21, 0.21]) {
    const standoff = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.014, 0.026), stainlessMat);
    standoff.position.set(handleX, hy, 0.018);
    coolerDoorGroup.add(standoff);
  }

  coolerGroup.add(coolerDoorGroup);
  interactions.registerHingedDoor(
    coolerGroup,
    coolerDoorGroup,
    new THREE.Vector3(-(doorW - stileW) * 0.5, 0, 0),
    'y',
    -Math.PI * 0.62
  );

  islandGroup.add(coolerGroup);
}

export function buildLargeBlueIslandWithLeftSink(ctx: SceneBuilderContext): void {
  const { scene, interactions } = ctx;

  // Blue Island (3.80m worktop width x 1.52m depth — >2 full kitchen cabinets deep, centered at X = -0.92m, Z = +0.14m)
  // - Back (-Z) half houses the full-depth cooking/sink cabinets (z = -0.73m to 0.00m), with the Sink at z = -0.36m
  // - Front (+Z) half houses the Wine Cooler on the left full-depth pier (z = 0.00m to +0.73m, completely clear of the sink!)
  //   and a 390mm breakfast-bar overhang on the right section (z = +0.37m to +0.76m) for the 3 counter stools!
  const islandGroup = new THREE.Group();
  islandGroup.name = 'kitchen.island';
  islandGroup.position.set(-0.92, 0, 0.14);

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
  const knobGeo = new THREE.SphereGeometry(0.014, 10, 8);

  /**
   * Builds a Howdens-style full-overlay (lay-on) Shaker door with a genuinely INSET center panel
   * and 4 raised outer stiles & rails (left/right stiles + top/bottom rails protruding 12mm proud of the center).
   */
  const addHowdensIslandShakerDoor = (
    cx: number,
    cy: number,
    carcassZ: number,
    w: number,
    h: number,
    facingDir: 1 | -1,
    stileW = 0.062
  ): THREE.Group => {
    const doorGroup = new THREE.Group();
    doorGroup.position.set(cx, cy, carcassZ);

    // 1. Recessed flat center panel (10mm thick, sitting close to the carcass face)
    const insetPanel = new THREE.Mesh(
      new THREE.BoxGeometry(w - 0.01, h - 0.01, 0.01),
      hagueBlueMat
    );
    insetPanel.position.set(0, 0, facingDir * 0.005);
    insetPanel.receiveShadow = true;
    doorGroup.add(insetPanel);

    // 2. Raised Left & Right Vertical Shaker Stiles (22mm thick -> 12mm proud of the inset center panel!)
    const frameDepth = 0.022;
    const frameCenterZ = facingDir * (frameDepth * 0.5);
    for (const side of [-1, 1]) {
      const stile = new THREE.Mesh(
        new THREE.BoxGeometry(stileW, h, frameDepth),
        hagueBlueMat
      );
      stile.position.set(side * (w * 0.5 - stileW * 0.5), 0, frameCenterZ);
      stile.castShadow = true;
      stile.receiveShadow = true;
      doorGroup.add(stile);
    }

    // 3. Raised Top & Bottom Horizontal Shaker Rails between the stiles
    const innerRailW = Math.max(0.04, w - stileW * 2);
    for (const vSide of [-1, 1]) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(innerRailW, stileW, frameDepth),
        hagueBlueMat
      );
      rail.position.set(0, vSide * (h * 0.5 - stileW * 0.5), frameCenterZ);
      rail.castShadow = true;
      rail.receiveShadow = true;
      doorGroup.add(rail);
    }

    islandGroup.add(doorGroup);
    return doorGroup;
  };

  // 1. Kitchen-Side (-Z) Hollow Cabinet Carcasses (z = -0.73m to -0.11m, depth 0.62m):
  //    - Bay 0 (localX = -1.515m): Integrated Dishwasher Tub with wire crockery racks & dinner plates
  buildHollowCabinetCarcass(islandGroup, -1.52, 0.45, -0.42, 0.61, 0.9, 0.62, '-z', hagueBlueMat, {
    plinthH: 0.14,
    interiorStyle: 'dishwasher',
  });
  //    - Bay 1 (localX = -0.909m): Under-Sink Cupboard with plumbing trap & storage caddy
  buildHollowCabinetCarcass(islandGroup, -0.91, 0.45, -0.42, 0.61, 0.9, 0.62, '-z', hagueBlueMat, {
    plinthH: 0.14,
    interiorStyle: 'underSink',
  });
  //    - Bays 2 & 3 (localX = 0.0m): Double Central Island Cupboard with oak interior & shelf
  buildHollowCabinetCarcass(islandGroup, 0.0, 0.45, -0.42, 1.21, 0.9, 0.62, '-z', hagueBlueMat, {
    plinthH: 0.14,
    dividers: 1,
    interiorStyle: 'oak',
  });
  //    - Bays 4 & 5 (localX = +1.212m): Double Right Island Cupboard with oak interior & shelf
  buildHollowCabinetCarcass(islandGroup, 1.212, 0.45, -0.42, 1.215, 0.9, 0.62, '-z', hagueBlueMat, {
    plinthH: 0.14,
    dividers: 1,
    interiorStyle: 'oak',
  });

  // 2. Stool-Side (+Z) Left Pier Housing the Under-Counter Wine Cooler (localX = -1.3875m, z = -0.11m to +0.73m, depth 0.84m)
  //    Built in solid Hague Blue around the 0.60m x 0.76m (y = 0.10..0.86m) wine cooler aperture with zero exposed oak carcass lining
  const pierCx = -1.3875;
  const pierCz = 0.31;
  const pierW = 0.875;
  const pierD = 0.84;
  const coolerApertureW = 0.6;
  const pierCheekW = (pierW - coolerApertureW) * 0.5; // 0.1375m solid Hague Blue end stiles

  // Bottom Hague Blue plinth (y = 0.00..0.10m) across full pier width + recessed ventilation grille
  const pierPlinth = new THREE.Mesh(
    new THREE.BoxGeometry(pierW, 0.1, pierD),
    hagueBlueMat
  );
  pierPlinth.name = 'island.wineCoolerPier.plinth';
  pierPlinth.position.set(pierCx, 0.05, pierCz);
  pierPlinth.castShadow = true;
  pierPlinth.receiveShadow = true;
  islandGroup.add(pierPlinth);

  const plinthVent = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.024, 0.012),
    new THREE.MeshStandardMaterial({ color: 0x0b0e12, roughness: 0.7 })
  );
  plinthVent.name = 'island.wineCoolerPier.plinthVent';
  plinthVent.position.set(pierCx, 0.05, 0.726);
  islandGroup.add(plinthVent);

  // Left & Right solid Hague Blue pier cheeks (y = 0.10..0.90m) framing the 0.60m wine cooler opening
  for (const side of [-1, 1]) {
    const pierCheek = new THREE.Mesh(
      new THREE.BoxGeometry(pierCheekW, 0.8, pierD),
      hagueBlueMat
    );
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
  const pierTopRail = new THREE.Mesh(
    new THREE.BoxGeometry(coolerApertureW, 0.04, pierD),
    hagueBlueMat
  );
  pierTopRail.name = 'island.wineCoolerPier.topRail';
  pierTopRail.position.set(pierCx, 0.88, pierCz);
  pierTopRail.castShadow = true;
  pierTopRail.receiveShadow = true;
  islandGroup.add(pierTopRail);

  // Rear solid Hague Blue backing behind the 0.36m-deep wine cooler cavity (z = -0.11..+0.37m)
  const pierRearCore = new THREE.Mesh(
    new THREE.BoxGeometry(coolerApertureW, 0.76, 0.48),
    hagueBlueMat
  );
  pierRearCore.name = 'island.wineCoolerPier.rearBacking';
  pierRearCore.position.set(pierCx, 0.48, 0.13);
  pierRearCore.castShadow = true;
  pierRearCore.receiveShadow = true;
  islandGroup.add(pierRearCore);

  // Wine Cooler mounted FLUSH with the front overhang at z = +0.73m (centered on left pier at localX = -1.3875m)
  buildUnderCounterWineCooler(islandGroup, -1.3875, 0.73, interactions);

  // 3. Solid Recessed Back Section under the 390mm Stool Overhang (localX = -0.95m to +1.825m, z = -0.11m to +0.37m, depth 0.48m)
  //    NO cupboards under the back of the island — just a clean Hague Blue panelled back behind the 3 counter stools!
  const rightRecessedBase = new THREE.Mesh(
    new THREE.BoxGeometry(2.775, 0.9, 0.48),
    hagueBlueMat
  );
  rightRecessedBase.position.set(0.4375, 0.45, 0.13);
  rightRecessedBase.castShadow = true;
  rightRecessedBase.receiveShadow = true;
  islandGroup.add(rightRecessedBase);

  // Right-end support leg/panel flush with the front overhang at localX = +1.795m (z = +0.37m to +0.73m)
  const rightOverhangEndLeg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.36), hagueBlueMat);
  rightOverhangEndLeg.position.set(1.795, 0.45, 0.55);
  rightOverhangEndLeg.castShadow = true;
  islandGroup.add(rightOverhangEndLeg);

  // Howdens Full-Overlay Doors along the Back Face (-Z cooking/sink side at z = -0.73m):
  // 6 full-overlay doors spanning localX = -1.82m to +1.82m (each 0.60m wide x 0.75m tall above the 14cm kickboard, with 6mm gaps)
  const backDoorCentersX = [-1.515, -0.909, -0.303, 0.303, 0.909, 1.515] as const;
  for (let i = 0; i < backDoorCentersX.length; i++) {
    const bx = backDoorCentersX[i] ?? 0;
    const isDishwasher = i === 0;
    const doorGroup = addHowdensIslandShakerDoor(bx, 0.515, -0.73, 0.6, 0.75, -1);

    if (isDishwasher) {
      // Top-edge stainless control fascia lip of the integrated dishwasher
      const dwTopLip = new THREE.Mesh(
        new THREE.BoxGeometry(0.598, 0.014, 0.024),
        stainlessLipMat
      );
      dwTopLip.position.set(0, 0.894 - 0.515, -0.011);
      doorGroup.add(dwTopLip);

      // Central brushed stainless knob on the integrated dishwasher door
      const dwKnob = new THREE.Mesh(knobGeo, chromeKnobMat);
      dwKnob.scale.set(1, 1, 0.75);
      dwKnob.position.set(0, 0.83 - 0.515, -0.03);
      doorGroup.add(dwKnob);

      // Integrated dishwasher drops down around its bottom horizontal edge
      interactions.registerHingedDoor(
        islandGroup,
        doorGroup,
        new THREE.Vector3(0, -0.375, -0.011),
        'x',
        -Math.PI * 0.45
      );
    } else {
      // Paired doors open from their meeting stiles
      const knobOffset = i % 2 === 1 ? 0.235 : -0.235;
      const hingeSideX: -1 | 1 = i % 2 === 1 ? -1 : 1;
      const knob = new THREE.Mesh(knobGeo, chromeKnobMat);
      knob.scale.set(1, 1, 0.75);
      knob.position.set(knobOffset, 0.81 - 0.515, -0.03);
      doorGroup.add(knob);

      interactions.registerHingedDoor(
        islandGroup,
        doorGroup,
        new THREE.Vector3(hingeSideX * (0.6 * 0.5 - 0.012), 0, -0.011),
        'y',
        -hingeSideX * Math.PI * 0.62
      );
    }
  }

  // Worktop (3.80m x 1.52m, z = -0.76m to +0.76m) in matching Carrara marble
  const worktop = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.055, 1.52), islandWorktopMat);
  worktop.position.set(0, 0.927, 0.0);
  worktop.castShadow = true;
  worktop.receiveShadow = true;
  islandGroup.add(worktop);

  // Sink at localX = -0.71m, z = -0.36m
  const sinkX = -0.71;
  const sinkZ = -0.36;

  const sinkRim = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.02, 0.5),
    new THREE.MeshStandardMaterial({ color: 0xfaf8f2, roughness: 0.18 })
  );
  sinkRim.position.set(sinkX, 0.95, sinkZ);
  islandGroup.add(sinkRim);

  const sinkBasin = new THREE.Mesh(
    new THREE.BoxGeometry(0.66, 0.024, 0.44),
    new THREE.MeshStandardMaterial({ color: 0xc8c4ba, roughness: 0.28 })
  );
  sinkBasin.position.set(sinkX, 0.953, sinkZ);
  islandGroup.add(sinkBasin);

  // Routed Sink Drainage Grooves in the marble worktop above the Integrated Dishwasher
  for (const gz of [-0.52, -0.467, -0.413, -0.36, -0.307, -0.253, -0.2]) {
    const groove = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.004, 0.011),
      drainerGrooveMat
    );
    groove.position.set(-1.33, 0.955, gz);
    islandGroup.add(groove);
  }

  // Polished Chrome Swan-Neck Mixer Tap mounted on the +Z (inner island) side of the sink (z = -0.08m),
  // arching back (-Z) over the sink basin!
  const tapZ = sinkZ + 0.28; // -0.08m (opposite side of the sink from -0.64m)
  const tapBase = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.025, 0.042), polishedChromeTapMat);
  tapBase.position.set(sinkX, 0.965, tapZ);
  islandGroup.add(tapBase);

  const tapStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.016, 0.26, 12),
    polishedChromeTapMat
  );
  tapStem.position.set(sinkX, 1.09, tapZ);
  tapStem.castShadow = true;
  islandGroup.add(tapStem);

  const tapSpout = new THREE.Mesh(
    new THREE.TorusGeometry(0.095, 0.013, 10, 18, Math.PI),
    polishedChromeTapMat
  );
  tapSpout.rotation.y = -Math.PI / 2;
  tapSpout.position.set(sinkX, 1.21, tapZ - 0.095);
  tapSpout.castShadow = true;
  islandGroup.add(tapSpout);

  // Chrome mixer lever on the side of the tap base
  const tapLever = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.004, 0.065, 8),
    polishedChromeTapMat
  );
  tapLever.rotation.z = -0.45;
  tapLever.position.set(sinkX + 0.045, 1.015, tapZ);
  islandGroup.add(tapLever);

  // Sculpted Artisan Stoneware Pedestal Fruit Bowl on the Island Worktop (x = +0.95m, z = +0.02m)
  const fruitBowlGroup = new THREE.Group();
  fruitBowlGroup.name = 'kitchen.island.fruitBowl';
  fruitBowlGroup.position.set(0.95, 0.954, 0.02);
  fruitBowlGroup.userData = { lodTier: 2, zoneId: 'kitchen' };

  const bowlCeramicMat = new THREE.MeshStandardMaterial({
    name: 'IslandStonewareFruitBowlMat',
    color: 0xf0ece2,
    roughness: 0.26,
    metalness: 0.04,
  });
  const stemWoodMat = new THREE.MeshStandardMaterial({
    name: 'FruitStemWoodMat',
    color: 0x3d291a,
    roughness: 0.82,
  });
  const redAppleMat = new THREE.MeshStandardMaterial({
    name: 'RedAppleMat',
    color: 0xb82924,
    roughness: 0.22,
    metalness: 0.02,
  });
  const greenAppleMat = new THREE.MeshStandardMaterial({
    name: 'GreenAppleMat',
    color: 0x6f9e38,
    roughness: 0.25,
    metalness: 0.02,
  });
  const orangeCitrusMat = new THREE.MeshStandardMaterial({
    name: 'ValenciaOrangeMat',
    color: 0xe8741e,
    roughness: 0.36,
    metalness: 0.02,
  });
  const lemonMat = new THREE.MeshStandardMaterial({
    name: 'AmalfiLemonMat',
    color: 0xf2ca27,
    roughness: 0.32,
    metalness: 0.02,
  });
  const pearMat = new THREE.MeshStandardMaterial({
    name: 'ConferencePearMat',
    color: 0x9aa83a,
    roughness: 0.34,
    metalness: 0.02,
  });
  const bananaMat = new THREE.MeshStandardMaterial({
    name: 'RipeBananaMat',
    color: 0xebd138,
    roughness: 0.38,
    metalness: 0.01,
  });
  const grapeMat = new THREE.MeshStandardMaterial({
    name: 'BurgundyGrapeMat',
    color: 0x3d1c38,
    roughness: 0.24,
    metalness: 0.03,
  });

  // Wide, shallow lathe-turned stoneware pedestal bowl with thick rounded rim & concave basin
  const bowlProfile: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.076, 0.0),
    new THREE.Vector2(0.072, 0.014),
    new THREE.Vector2(0.062, 0.028),
    new THREE.Vector2(0.112, 0.048),
    new THREE.Vector2(0.152, 0.074),
    new THREE.Vector2(0.168, 0.104),
    new THREE.Vector2(0.162, 0.112),
    new THREE.Vector2(0.153, 0.105),
    new THREE.Vector2(0.136, 0.075),
    new THREE.Vector2(0.095, 0.05),
    new THREE.Vector2(0.045, 0.038),
    new THREE.Vector2(0.0, 0.035),
  ];
  const bowlMesh = new THREE.Mesh(
    new THREE.LatheGeometry(bowlProfile, 28),
    bowlCeramicMat
  );
  bowlMesh.name = 'kitchen.island.fruitBowl.pedestalBowl';
  bowlMesh.castShadow = true;
  bowlMesh.receiveShadow = true;
  bowlMesh.userData = { lodTier: 2, zoneId: 'kitchen' };
  fruitBowlGroup.add(bowlMesh);

  // Helper returning the exact inner concave surface height of the bowl at radial distance `r`
  const getBowlInnerSurfaceY = (r: number): number => {
    if (r <= 0.045) return 0.035 + (r / 0.045) * (0.038 - 0.035);
    if (r <= 0.095) return 0.038 + ((r - 0.045) / 0.05) * (0.05 - 0.038);
    if (r <= 0.136) return 0.05 + ((r - 0.095) / 0.041) * (0.075 - 0.05);
    if (r <= 0.153) return 0.075 + ((r - 0.136) / 0.017) * (0.105 - 0.075);
    return 0.112;
  };

  // 1. Apples (Red & Granny Smith Green) with woody stems seated directly on the bowl floor
  const appleSpecs: ReadonlyArray<{
    readonly pos: readonly [number, number, number];
    readonly rot: readonly [number, number, number];
    readonly isGreen: boolean;
  }> = [
    { pos: [-0.048, 0.071, 0.036], rot: [0.18, 0.4, -0.15], isGreen: false },
    { pos: [0.054, 0.072, 0.032], rot: [-0.14, -0.3, 0.22], isGreen: true },
    { pos: [-0.008, 0.068, -0.008], rot: [0.08, 0.2, 0.12], isGreen: false },
    { pos: [-0.064, 0.074, -0.032], rot: [-0.22, 0.5, 0.18], isGreen: true },
  ];
  const appleGeo = new THREE.SphereGeometry(0.034, 16, 12);
  const stemGeo = new THREE.CylinderGeometry(0.0018, 0.0012, 0.014, 6);
  for (let i = 0; i < appleSpecs.length; i++) {
    const spec = appleSpecs[i];
    const apple = new THREE.Group();
    apple.name = `kitchen.island.fruitBowl.apple.${i + 1}`;
    apple.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
    apple.rotation.set(spec.rot[0], spec.rot[1], spec.rot[2]);

    const body = new THREE.Mesh(
      appleGeo,
      spec.isGreen ? greenAppleMat : redAppleMat
    );
    body.name = `kitchen.island.fruitBowl.appleBody.${i + 1}`;
    body.scale.set(1.0, 0.9, 1.0);
    body.castShadow = true;
    body.receiveShadow = true;
    apple.add(body);

    const stem = new THREE.Mesh(stemGeo, stemWoodMat);
    stem.name = `kitchen.island.fruitBowl.appleStem.${i + 1}`;
    stem.position.set(0, 0.032, 0);
    apple.add(stem);

    fruitBowlGroup.add(apple);
  }

  // 2. Valencia Oranges seated in the bowl
  const orangePositions: ReadonlyArray<readonly [number, number, number]> = [
    [0.062, 0.074, -0.038],
    [0.004, 0.073, 0.064],
    [-0.016, 0.073, -0.062],
  ];
  const orangeGeo = new THREE.SphereGeometry(0.035, 16, 12);
  for (let i = 0; i < orangePositions.length; i++) {
    const [ox, oy, oz] = orangePositions[i];
    const orange = new THREE.Mesh(orangeGeo, orangeCitrusMat);
    orange.name = `kitchen.island.fruitBowl.orange.${i + 1}`;
    orange.scale.set(1.0, 0.95, 1.0);
    orange.position.set(ox, oy, oz);
    orange.castShadow = true;
    orange.receiveShadow = true;
    fruitBowlGroup.add(orange);
  }

  // 3. Amalfi Lemons (prolate citrus ellipsoids nestled between the apples and oranges)
  const lemonSpecs: ReadonlyArray<{
    readonly pos: readonly [number, number, number];
    readonly rot: readonly [number, number, number];
  }> = [
    { pos: [0.088, 0.078, -0.002], rot: [0.15, 0.65, -0.28] },
    { pos: [-0.032, 0.095, 0.042], rot: [-0.2, -0.45, 0.24] },
  ];
  const lemonGeo = new THREE.SphereGeometry(0.027, 14, 12);
  for (let i = 0; i < lemonSpecs.length; i++) {
    const spec = lemonSpecs[i];
    const lemon = new THREE.Mesh(lemonGeo, lemonMat);
    lemon.name = `kitchen.island.fruitBowl.lemon.${i + 1}`;
    lemon.scale.set(1.34, 0.88, 0.88);
    lemon.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
    lemon.rotation.set(spec.rot[0], spec.rot[1], spec.rot[2]);
    lemon.castShadow = true;
    lemon.receiveShadow = true;
    fruitBowlGroup.add(lemon);
  }

  // 4. Conference Pears (compound lower bulb + tapered neck + stem resting on the base layer)
  const pearSpecs: ReadonlyArray<{
    readonly pos: readonly [number, number, number];
    readonly rot: readonly [number, number, number];
  }> = [
    { pos: [0.034, 0.082, -0.006], rot: [0.35, 0.25, -0.42] },
    { pos: [-0.052, 0.082, -0.002], rot: [-0.28, -0.35, 0.48] },
  ];
  const pearBulbGeo = new THREE.SphereGeometry(0.03, 14, 12);
  const pearNeckGeo = new THREE.ConeGeometry(0.023, 0.04, 14);
  for (let i = 0; i < pearSpecs.length; i++) {
    const spec = pearSpecs[i];
    const pear = new THREE.Group();
    pear.name = `kitchen.island.fruitBowl.pear.${i + 1}`;
    pear.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
    pear.rotation.set(spec.rot[0], spec.rot[1], spec.rot[2]);

    const bulb = new THREE.Mesh(pearBulbGeo, pearMat);
    bulb.name = `kitchen.island.fruitBowl.pearBulb.${i + 1}`;
    bulb.scale.set(1.0, 0.92, 1.0);
    bulb.castShadow = true;
    pear.add(bulb);

    const neck = new THREE.Mesh(pearNeckGeo, pearMat);
    neck.name = `kitchen.island.fruitBowl.pearNeck.${i + 1}`;
    neck.position.set(0, 0.023, 0);
    neck.castShadow = true;
    pear.add(neck);

    const stem = new THREE.Mesh(stemGeo, stemWoodMat);
    stem.name = `kitchen.island.fruitBowl.pearStem.${i + 1}`;
    stem.position.set(0, 0.044, 0);
    pear.add(stem);

    fruitBowlGroup.add(pear);
  }

  // 5. Curved Hand of Ripe Bananas whose belly origin (0, 0, 0) rests directly on the fruit below
  const createCenteredBananaGeometry = (): THREE.BufferGeometry => {
    const lenSegs = 14;
    const radSegs = 6;
    const halfSpanX = 0.074;
    const archRiseY = 0.028;
    const maxR = 0.0145;

    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= lenSegs; i++) {
      const u = i / lenSegs;
      const t = u * 2 - 1; // [-1, +1]
      const cx = t * halfSpanX;
      const cy = t * t * archRiseY;
      const cz = (1 - t * t) * 0.005;

      // Tangent along the spine to orient the cross-section ring
      const dx = halfSpanX;
      const dy = 2 * t * archRiseY;
      const tLen = Math.hypot(dx, dy) || 1;
      const nx = -dy / tLen;
      const ny = dx / tLen;

      // Taper radius smoothly at both tips, with a short stem neck at t -> +1
      const profile =
        t > 0.82
          ? 0.24
          : Math.max(0.18, Math.cos(t * 0.44 * Math.PI));
      const r = maxR * profile;

      for (let j = 0; j <= radSegs; j++) {
        const v = j / radSegs;
        const theta = v * Math.PI * 2;
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        const px = cx + nx * (r * sinT);
        const py = cy + ny * (r * sinT);
        const pz = cz + r * 0.92 * cosT;

        positions.push(px, py, pz);
        uvs.push(u, v);
      }
    }

    const ringStride = radSegs + 1;
    for (let i = 0; i < lenSegs; i++) {
      for (let j = 0; j < radSegs; j++) {
        const a = i * ringStride + j;
        const b = (i + 1) * ringStride + j;
        const c = (i + 1) * ringStride + (j + 1);
        const d = i * ringStride + (j + 1);
        indices.push(a, b, d, b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  };

  const bananaGeo = createCenteredBananaGeometry();
  const bananaSpecs: ReadonlyArray<{
    readonly pos: readonly [number, number, number];
    readonly rot: readonly [number, number, number];
  }> = [
    { pos: [0.012, 0.095, -0.018], rot: [0.08, 0.32, -0.04] },
    { pos: [0.022, 0.097, -0.002], rot: [0.02, 0.46, -0.05] },
    { pos: [0.028, 0.094, 0.014], rot: [-0.06, 0.6, -0.06] },
  ];
  for (let b = 0; b < bananaSpecs.length; b++) {
    const spec = bananaSpecs[b];
    const banana = new THREE.Mesh(bananaGeo, bananaMat);
    banana.name = `kitchen.island.fruitBowl.banana.${b + 1}`;
    banana.position.set(spec.pos[0], spec.pos[1], spec.pos[2]);
    banana.rotation.set(spec.rot[0], spec.rot[1], spec.rot[2]);
    banana.castShadow = true;
    banana.receiveShadow = true;
    fruitBowlGroup.add(banana);
  }

  // Shared woody crown joining the stem tips of the 3 bananas
  const bananaCrown = new THREE.Mesh(
    new THREE.CylinderGeometry(0.007, 0.009, 0.022, 8),
    stemWoodMat
  );
  bananaCrown.name = 'kitchen.island.fruitBowl.bananaCrown';
  bananaCrown.position.set(0.082, 0.12, -0.032);
  bananaCrown.rotation.set(0.25, 0.45, -0.55);
  bananaCrown.castShadow = true;
  fruitBowlGroup.add(bananaCrown);

  // 6. Bunch of Burgundy Grapes nestled inside the front-left bowl pocket (strictly inside r <= 0.126m and above getBowlInnerSurfaceY)
  const grapeRadius = 0.0105;
  const grapeGeo = new THREE.SphereGeometry(grapeRadius, 10, 8);
  const rawGrapeCoords: ReadonlyArray<readonly [number, number, number]> = [
    // Bottom layer resting directly on the inner bowl wall & adjacent apples
    [-0.078, 0.082, 0.042],
    [-0.092, 0.084, 0.032],
    [-0.088, 0.085, 0.052],
    [-0.104, 0.088, 0.044],
    [-0.098, 0.089, 0.062],
    [-0.076, 0.086, 0.062],
    [-0.112, 0.092, 0.032],
    [-0.112, 0.094, 0.052],
    // Upper layer nestled in the pockets of the bottom grape layer
    [-0.084, 0.098, 0.044],
    [-0.096, 0.101, 0.038],
    [-0.094, 0.102, 0.054],
    [-0.106, 0.104, 0.046],
    [-0.082, 0.099, 0.058],
    [-0.09, 0.112, 0.046],
  ];
  for (let g = 0; g < rawGrapeCoords.length; g++) {
    const [gx, rawGy, gz] = rawGrapeCoords[g];
    const r = Math.hypot(gx, gz);
    const minSafeY = getBowlInnerSurfaceY(r + grapeRadius) + grapeRadius + 0.002;
    const gy = Math.max(rawGy, minSafeY);
    const grape = new THREE.Mesh(grapeGeo, grapeMat);
    grape.name = `kitchen.island.fruitBowl.grape.${g + 1}`;
    grape.position.set(gx, gy, gz);
    grape.castShadow = true;
    grape.receiveShadow = true;
    fruitBowlGroup.add(grape);
  }

  islandGroup.add(fruitBowlGroup);

  // Cox & Cox Weathered Oak Counter Stools — natural weathered oak with sculpted saddle seat,
  // 4 splayed tapered oak legs, and staggered horizontal footrest rungs (backless)
  const weatheredOakMat = new THREE.MeshStandardMaterial({
    map: createDriftwoodTexture(),
    color: 0xc8b8a0,
    roughness: 0.72,
    metalness: 0.02,
  });

  // 3 Counter Stools tucked under the 390mm overhang (to the right of the flush Wine Cooler pier)
  for (const sx of [-0.48, 0.38, 1.24]) {
    const stool = new THREE.Group();
    stool.position.set(sx, 0, 0.66);

    // Under-seat solid oak apron frame
    const seatApron = new THREE.Mesh(
      new THREE.BoxGeometry(0.31, 0.036, 0.2),
      weatheredOakMat
    );
    seatApron.position.set(0, 0.642, 0);
    stool.add(seatApron);

    // Contoured carved Weathered Oak Saddle Seat (dipped center + raised left/right wings, no backrest)
    const saddleCenter = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.038, 0.285),
      weatheredOakMat
    );
    saddleCenter.position.set(0, 0.668, 0);
    saddleCenter.castShadow = true;
    saddleCenter.receiveShadow = true;
    stool.add(saddleCenter);

    for (const side of [-1, 1]) {
      const saddleWing = new THREE.Mesh(
        new THREE.BoxGeometry(0.155, 0.04, 0.285),
        weatheredOakMat
      );
      saddleWing.position.set(side * 0.142, 0.678, 0);
      saddleWing.rotation.z = side * 0.13; // Gently dished saddle curvature
      saddleWing.castShadow = true;
      saddleWing.receiveShadow = true;
      stool.add(saddleWing);
    }

    // 4 Splayed tapered Weathered Oak legs (angled outward in X and Z)
    const legSpecs: ReadonlyArray<readonly [number, number]> = [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ];
    for (const [sxSign, szSign] of legSpecs) {
      const leg = new THREE.Mesh(
        new THREE.BoxGeometry(0.036, 0.665, 0.036),
        weatheredOakMat
      );
      leg.position.set(sxSign * 0.172, 0.328, szSign * 0.112);
      leg.rotation.z = sxSign * 0.1;
      leg.rotation.x = -szSign * 0.08;
      leg.castShadow = true;
      stool.add(leg);
    }

    // Front & Back horizontal oak footrest rungs (higher at y = 0.24m)
    for (const rz of [-0.122, 0.122]) {
      const fbRung = new THREE.Mesh(
        new THREE.BoxGeometry(0.365, 0.024, 0.024),
        weatheredOakMat
      );
      fbRung.position.set(0, 0.24, rz);
      fbRung.castShadow = true;
      stool.add(fbRung);
    }

    // Left & Right horizontal oak side stretchers (staggered slightly lower at y = 0.19m)
    for (const rx of [-0.188, 0.188]) {
      const sideRung = new THREE.Mesh(
        new THREE.BoxGeometry(0.024, 0.024, 0.245),
        weatheredOakMat
      );
      sideRung.position.set(rx, 0.19, 0);
      sideRung.castShadow = true;
      stool.add(sideRung);
    }

    islandGroup.add(stool);
  }

  scene.add(islandGroup);
}
