import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../../engine/viewer/scene-types.ts';
import { buildHollowCabinetCarcass } from '../../../../../objects/joinery/cabinet-interior.ts';
import {
  type KitchenCabinetrySharedContext,
  nameCarcassHierarchy,
  prepGeo,
  sharedBifoldKnuckleHingeGeo,
  tagHighLod,
} from './kitchen-joinery-shared.ts';

// Shared geometries for the NEFF N50 Double Oven Tower & Housing
const sharedNeffHousingStileGeo = prepGeo(new THREE.BoxGeometry(0.024, 0.99, 0.04));
const sharedNeffBafflePlateGeo = prepGeo(new THREE.BoxGeometry(0.012, 0.36, 0.42));
const sharedNeffFanVentRingGeo = prepGeo(new THREE.TorusGeometry(0.078, 0.008, 10, 24));
const sharedNeffFanImpellerGeo = prepGeo(new THREE.CylinderGeometry(0.062, 0.062, 0.008, 18));
const sharedNeffMainLampGeo = prepGeo(new THREE.BoxGeometry(0.045, 0.008, 0.075));
const sharedNeffTopLampGeo = prepGeo(new THREE.BoxGeometry(0.045, 0.006, 0.075));

const sharedNeffFasciaGlassGeo = prepGeo(new THREE.BoxGeometry(0.024, 0.112, 0.558));
const sharedNeffFasciaEdgeTrimGeo = prepGeo(new THREE.BoxGeometry(0.026, 0.112, 0.018));
const sharedNeffFasciaBottomStripGeo = prepGeo(new THREE.BoxGeometry(0.026, 0.006, 0.594));
const sharedNeffFasciaOverlayGeo = prepGeo(new THREE.PlaneGeometry(0.554, 0.104));
const sharedNeffDialBezelGeo = prepGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.006, 24));
const sharedNeffDialBarrelGeo = prepGeo(new THREE.CylinderGeometry(0.018, 0.018, 0.018, 24));
const sharedNeffDialGripBladeGeo = prepGeo(new THREE.BoxGeometry(0.008, 0.036, 0.006));
const sharedNeffDialPointerTickGeo = prepGeo(new THREE.BoxGeometry(0.009, 0.008, 0.003));
const sharedNeffHandleStandoffGeo = prepGeo(new THREE.BoxGeometry(0.028, 0.014, 0.022));
const sharedNeffHandleBarGeo = prepGeo(new THREE.BoxGeometry(0.016, 0.016, 0.485));

const sharedPantryWorktopLipGeo = prepGeo(new THREE.BoxGeometry(1.19, 0.045, 0.68));

export function buildWestWallFridgeAndOvenTowers(
  ctx: SceneBuilderContext,
  shared: KitchenCabinetrySharedContext
): void {
  const { scene, interactions } = ctx;
  const westGroup = scene;
  const {
    doveGreyMat,
    stainlessSteelMat,
    brushedStainlessTex,
    addChromeKnob,
    addHowdensShakerDoor,
  } = shared;

  // 1a. FULL-HEIGHT SIDE-BY-SIDE INTEGRATED FRIDGE-FREEZER (Z = -0.43m to +0.53m, center Z = +0.05m, width 0.96m)
  //     Shifted North by 0.72m so it sits 32cm clear of the Z = +0.85m..+1.99m Kitchen entrance portal!
  //     Facing the West wall: Left column (+Z, bz = +0.239) = Full-Height Integrated Fridge,
  //     Right column (-Z, bz = -0.239) = Full-Height Integrated Freezer. Full height (Y = 0.14m..2.42m), no top cupboard.
  const fpGroup = new THREE.Group();
  fpGroup.name = 'kitchen.cabinetry.west.fridgeFreezerTower';
  fpGroup.position.set(-4.06, 0, 0.05);

  // Left full-height column (+Z side when facing West wall): Full-Height Integrated Larder Fridge (Y = 0..2.42m, 14cm kickboard)
  nameCarcassHierarchy(
    buildHollowCabinetCarcass(fpGroup, 0, 0, 0.24, 0.68, 2.42, 0.48, '+x', doveGreyMat, {
      plinthHeight: 0.14,
      interiorStyle: 'fridge',
      shelfCount: 5,
      hasCenterMullion: false,
      includeItems: true,
    }),
    'kitchen.cabinetry.west.fridgeFreezerTower.fridgeCarcass'
  );

  // Right full-height column (-Z side when facing West wall): Full-Height Integrated Frost-Free Freezer (Y = 0..2.42m, 14cm kickboard)
  nameCarcassHierarchy(
    buildHollowCabinetCarcass(fpGroup, 0, 0, -0.24, 0.68, 2.42, 0.48, '+x', doveGreyMat, {
      plinthHeight: 0.14,
      interiorStyle: 'freezer',
      shelfCount: 5,
      hasCenterMullion: false,
      includeItems: true,
    }),
    'kitchen.cabinetry.west.fridgeFreezerTower.freezerCarcass'
  );

  // Full-height Howdens Shaker doors on the Integrated Fridge-Freezer (no top cupboard; full height Y = 0.14m..2.41m)
  for (const bz of [-0.239, 0.239] as const) {
    const hingeSideZ: -1 | 1 = bz < 0 ? -1 : 1;
    const knobZ = bz < 0 ? -0.055 : 0.055;
    const colLabel = bz < 0 ? 'freezerDoor' : 'fridgeDoor';
    const doorName = `kitchen.cabinetry.west.fridgeFreezerTower.${colLabel}`;

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
      true,
      doorName
    );
    addChromeKnob(fullHeightDoor, 0.03, 1.12 - 1.275, knobZ - bz, 'x', `${doorName}.knob`);
    const pivot = interactions.registerHingedDoor(
      fpGroup,
      fullHeightDoor,
      new THREE.Vector3(0.011, 0, hingeSideZ * (0.472 * 0.5 - 0.012)),
      'y',
      -hingeSideZ * Math.PI * 0.62
    );
    pivot.name = `${doorName}.pivot`;
  }

  westGroup.add(fpGroup);

  // 1b. FULL-HEIGHT INTEGRATED OVENS UNIT (Z = -1.11m to -0.43m, center Z = -0.77m, width 0.68m)
  //     Houses the NEFF N50 U2ACH7A (U2ACH7AG7B) Built-In Self-Cleaning Double Smart Electric Oven in Graphite
  const ovenTowerGroup = new THREE.Group();
  ovenTowerGroup.name = 'kitchen.cabinetry.west.neffOvenTower';
  ovenTowerGroup.position.set(-4.06, 0, -0.77);

  // Bottom cupboard cavity below the NEFF Double Oven (Y = 0..0.835m, 14cm kickboard, matching adjacent freezer door height)
  nameCarcassHierarchy(
    buildHollowCabinetCarcass(ovenTowerGroup, 0, 0, 0, 0.68, 0.835, 0.68, '+x', doveGreyMat, {
      plinthHeight: 0.14,
      interiorStyle: 'oak',
      shelfCount: 1,
      includeItems: true,
    }),
    'kitchen.cabinetry.west.neffOvenTower.bottomCupboardCarcass'
  );
  // Lower Main 71L Multifunction CircoTherm Pyrolytic Oven cavity (Y = 0.835m..1.425m, height 0.59m)
  const mainOvenCarcass = nameCarcassHierarchy(
    buildHollowCabinetCarcass(
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
    ),
    'kitchen.cabinetry.west.neffOvenTower.mainOvenCarcass'
  );
  // Upper Secondary 34L Oven / Integrated Grill cavity + Top Fascia bay (Y = 1.425m..1.825m, height 0.40m)
  const topOvenCarcass = nameCarcassHierarchy(
    buildHollowCabinetCarcass(
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
    ),
    'kitchen.cabinetry.west.neffOvenTower.topOvenCarcass'
  );
  // Top cupboard cavity above the NEFF Double Oven (Y = 1.825m..2.42m, height 0.595m)
  nameCarcassHierarchy(
    buildHollowCabinetCarcass(ovenTowerGroup, 0, 1.825, 0, 0.68, 0.595, 0.68, '+x', doveGreyMat, {
      plinthHeight: 0,
      interiorStyle: 'oak',
      shelfCount: 1,
      includeItems: true,
    }),
    'kitchen.cabinetry.west.neffOvenTower.topCupboardCarcass'
  );

  // Left & Right Dove Grey tall-housing stiles (4cm wide each) framing the 594mm-wide NEFF Double Oven
  for (const sideZ of [-1, 1] as const) {
    const housingStile = new THREE.Mesh(sharedNeffHousingStileGeo, doveGreyMat);
    housingStile.name = `kitchen.cabinetry.west.neffOvenTower.housingStile.${sideZ < 0 ? 'right' : 'left'}`;
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
    sharedNeffBafflePlateGeo,
    new THREE.MeshStandardMaterial({ color: 0x20242b, roughness: 0.34, metalness: 0.45 })
  );
  bafflePlate.name = 'kitchen.cabinetry.west.neffOvenTower.mainOvenCarcass.bafflePlate';
  bafflePlate.position.set(-0.29, 0, 0);
  tagHighLod(bafflePlate, 12);
  mainOvenCarcass.add(bafflePlate);

  const fanVentRing = new THREE.Mesh(sharedNeffFanVentRingGeo, neffGraphiteMat);
  fanVentRing.name = 'kitchen.cabinetry.west.neffOvenTower.mainOvenCarcass.fanVentRing';
  fanVentRing.rotation.y = Math.PI / 2;
  fanVentRing.position.set(-0.282, 0.01, 0);
  tagHighLod(fanVentRing, 12);
  mainOvenCarcass.add(fanVentRing);

  const fanImpellerDisc = new THREE.Mesh(sharedNeffFanImpellerGeo, stainlessSteelMat);
  fanImpellerDisc.name = 'kitchen.cabinetry.west.neffOvenTower.mainOvenCarcass.fanImpellerDisc';
  fanImpellerDisc.rotation.z = Math.PI / 2;
  fanImpellerDisc.position.set(-0.285, 0.01, 0);
  tagHighLod(fanImpellerDisc, 12);
  mainOvenCarcass.add(fanImpellerDisc);

  // Warm internal oven lamp lens on the ceiling of both cavities
  const mainOvenLamp = new THREE.Mesh(sharedNeffMainLampGeo, neffCavityLightMat);
  mainOvenLamp.name = 'kitchen.cabinetry.west.neffOvenTower.mainOvenCarcass.cavityLamp';
  mainOvenLamp.position.set(0.08, 0.268, -0.14);
  tagHighLod(mainOvenLamp, 12);
  mainOvenCarcass.add(mainOvenLamp);

  const topOvenLamp = new THREE.Mesh(sharedNeffTopLampGeo, neffCavityLightMat);
  topOvenLamp.name = 'kitchen.cabinetry.west.neffOvenTower.topOvenCarcass.cavityLamp';
  topOvenLamp.position.set(0.08, 0.115, 0);
  tagHighLod(topOvenLamp, 12);
  topOvenCarcass.add(topOvenLamp);

  // Bottom full-overlay Shaker cupboard door below NEFF Double Oven (Y = 0.14m..0.83m)
  const ovenBotDoorName = 'kitchen.cabinetry.west.neffOvenTower.bottomCupboardDoor';
  const ovenBotDoor = addHowdensShakerDoor(
    ovenTowerGroup,
    0,
    0.485,
    0.34,
    0.67,
    0.69,
    'x',
    0.062,
    0.062,
    false,
    ovenBotDoorName
  );
  addChromeKnob(ovenBotDoor, 0.03, 0.74 - 0.485, -0.24, 'x', `${ovenBotDoorName}.knob`);
  const ovenBotPivot = interactions.registerHingedDoor(
    ovenTowerGroup,
    ovenBotDoor,
    new THREE.Vector3(0.011, 0, 0.67 * 0.5 - 0.012),
    'y',
    -Math.PI * 0.62
  );
  ovenBotPivot.name = `${ovenBotDoorName}.pivot`;

  // =========================================================================
  // NEFF N50 U2ACH7A (GRAPHITE) — 1. SINGLE TOP CONTROL FASCIA (Y = 1.708m..1.820m, width 0.594m)
  // =========================================================================
  const neffFasciaGroup = new THREE.Group();
  neffFasciaGroup.name = 'kitchen.cabinetry.west.neffOvenTower.controlFascia';
  neffFasciaGroup.position.set(0.344, 1.764, 0);

  // Central gloss black ceramic glass fascia panel (between Graphite vertical edge trims)
  const fasciaBlackGlass = new THREE.Mesh(sharedNeffFasciaGlassGeo, neffBlackGlassMat);
  fasciaBlackGlass.name = 'kitchen.cabinetry.west.neffOvenTower.controlFascia.blackGlass';
  fasciaBlackGlass.castShadow = true;
  neffFasciaGroup.add(fasciaBlackGlass);

  // Left & Right Brushed Graphite Grey vertical side trim strips on the fascia
  for (const sideZ of [-1, 1] as const) {
    const fasciaEdgeTrim = new THREE.Mesh(sharedNeffFasciaEdgeTrimGeo, neffGraphiteMat);
    fasciaEdgeTrim.name = `kitchen.cabinetry.west.neffOvenTower.controlFascia.edgeTrim.${sideZ < 0 ? 'right' : 'left'}`;
    fasciaEdgeTrim.position.set(0.001, 0, sideZ * 0.288);
    fasciaEdgeTrim.castShadow = true;
    neffFasciaGroup.add(fasciaEdgeTrim);
  }

  // Subtle horizontal brushed Graphite bevel strip along bottom edge of control fascia
  const fasciaBottomStrip = new THREE.Mesh(sharedNeffFasciaBottomStripGeo, neffGraphiteMat);
  fasciaBottomStrip.name = 'kitchen.cabinetry.west.neffOvenTower.controlFascia.bottomStrip';
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
    sharedNeffFasciaOverlayGeo,
    new THREE.MeshBasicMaterial({ map: neffFasciaTex })
  );
  neffFasciaOverlay.name = 'kitchen.cabinetry.west.neffOvenTower.controlFascia.displayOverlay';
  neffFasciaOverlay.rotation.y = Math.PI / 2;
  neffFasciaOverlay.position.set(0.0125, 0, 0);
  neffFasciaGroup.add(neffFasciaOverlay);

  // Two Retractable / Elongated NEFF Rotary Control Dials (Left = Function, Right = Temperature)
  const dialPointerMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (const dialZ of [-0.174, 0.174] as const) {
    const dialSide = dialZ < 0 ? 'right' : 'left';
    const dialBezel = new THREE.Mesh(sharedNeffDialBezelGeo, neffGraphiteMat);
    dialBezel.name = `kitchen.cabinetry.west.neffOvenTower.controlFascia.dial.${dialSide}.bezel`;
    dialBezel.rotation.z = Math.PI / 2;
    dialBezel.position.set(0.014, -0.002, dialZ);
    tagHighLod(dialBezel, 12);
    neffFasciaGroup.add(dialBezel);

    const dialBarrel = new THREE.Mesh(sharedNeffDialBarrelGeo, neffBlackGlassMat);
    dialBarrel.name = `kitchen.cabinetry.west.neffOvenTower.controlFascia.dial.${dialSide}.barrel`;
    dialBarrel.rotation.z = Math.PI / 2;
    dialBarrel.position.set(0.021, -0.002, dialZ);
    dialBarrel.castShadow = true;
    tagHighLod(dialBarrel, 12);
    neffFasciaGroup.add(dialBarrel);

    // Characteristic NEFF elongated vertical selector blade across the rotary dial face
    const dialGripBlade = new THREE.Mesh(sharedNeffDialGripBladeGeo, neffGraphiteMat);
    dialGripBlade.name = `kitchen.cabinetry.west.neffOvenTower.controlFascia.dial.${dialSide}.gripBlade`;
    dialGripBlade.position.set(0.031, -0.002, dialZ);
    dialGripBlade.castShadow = true;
    tagHighLod(dialGripBlade, 12);
    neffFasciaGroup.add(dialGripBlade);

    const dialPointerTick = new THREE.Mesh(sharedNeffDialPointerTickGeo, dialPointerMat);
    dialPointerTick.name = `kitchen.cabinetry.west.neffOvenTower.controlFascia.dial.${dialSide}.pointerTick`;
    dialPointerTick.position.set(0.0315, 0.012, dialZ);
    tagHighLod(dialPointerTick, 12);
    neffFasciaGroup.add(dialPointerTick);
  }

  ovenTowerGroup.add(neffFasciaGroup);

  // Helper to build an authentic NEFF N50 Graphite oven door
  const buildNeffGraphiteOvenDoor = (
    doorName: string,
    centerY: number,
    doorH: number,
    topRailH: number,
    botRailH: number,
    handleLocalY: number
  ): THREE.Group => {
    const doorGroup = new THREE.Group();
    doorGroup.name = doorName;
    doorGroup.position.set(0.344, centerY, 0);

    const totalW = 0.594;
    const edgeTrimW = 0.018;
    const blackStileW = 0.074;
    const winW = totalW - (edgeTrimW + blackStileW) * 2; // 0.410m clear window width
    const winH = Math.max(0.08, doorH - topRailH - botRailH);
    const winCenterY = (botRailH - topRailH) * 0.5;
    const doorThick = 0.024;

    const graphiteTrimGeo = prepGeo(new THREE.BoxGeometry(doorThick + 0.002, doorH, edgeTrimW));
    const blackStileGeo = prepGeo(new THREE.BoxGeometry(doorThick, doorH, blackStileW));

    // 1. Left & Right Outer Brushed Graphite Grey Vertical Trim Strips
    for (const sideZ of [-1, 1] as const) {
      const sideLabel = sideZ < 0 ? 'right' : 'left';
      const graphiteTrim = new THREE.Mesh(graphiteTrimGeo, neffGraphiteMat);
      graphiteTrim.name = `${doorName}.graphiteTrim.${sideLabel}`;
      graphiteTrim.position.set(0.001, 0, sideZ * (totalW * 0.5 - edgeTrimW * 0.5));
      graphiteTrim.castShadow = true;
      graphiteTrim.receiveShadow = true;
      doorGroup.add(graphiteTrim);

      // 2. Left & Right Gloss Black Ceramic Glass Vertical Stiles
      const blackStile = new THREE.Mesh(blackStileGeo, neffBlackGlassMat);
      blackStile.name = `${doorName}.blackStile.${sideLabel}`;
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
      prepGeo(new THREE.BoxGeometry(doorThick, topRailH, winW)),
      neffBlackGlassMat
    );
    topRail.name = `${doorName}.topRail`;
    topRail.position.set(0, doorH * 0.5 - topRailH * 0.5, 0);
    topRail.castShadow = true;
    topRail.receiveShadow = true;
    doorGroup.add(topRail);

    const botRail = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(doorThick, botRailH, winW)),
      neffBlackGlassMat
    );
    botRail.name = `${doorName}.bottomRail`;
    botRail.position.set(0, -doorH * 0.5 + botRailH * 0.5, 0);
    botRail.castShadow = true;
    botRail.receiveShadow = true;
    doorGroup.add(botRail);

    // 4. Inner Silver/Graphite Pinstripe Framing the Viewing Window Aperture
    const pThick = 0.004;
    const hPinGeo = prepGeo(new THREE.BoxGeometry(doorThick + 0.001, pThick, winW + pThick * 2));
    for (const sy of [-1, 1] as const) {
      const hPin = new THREE.Mesh(hPinGeo, neffSilverPinstripeMat);
      hPin.name = `${doorName}.pinstripe.${sy < 0 ? 'bottom' : 'top'}`;
      hPin.position.set(0.001, winCenterY + sy * (winH * 0.5 + pThick * 0.5), 0);
      tagHighLod(hPin, 12);
      doorGroup.add(hPin);
    }
    const vPinGeo = prepGeo(new THREE.BoxGeometry(doorThick + 0.001, winH, pThick));
    for (const sz of [-1, 1] as const) {
      const vPin = new THREE.Mesh(vPinGeo, neffSilverPinstripeMat);
      vPin.name = `${doorName}.pinstripe.${sz < 0 ? 'right' : 'left'}`;
      vPin.position.set(0.001, winCenterY, sz * (winW * 0.5 + pThick * 0.5));
      tagHighLod(vPin, 12);
      doorGroup.add(vPin);
    }

    // 5. Transparent Smoked Glass Viewing Window Pane (see-through into the lit NEFF cavity!)
    const windowGlass = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(0.01, winH, winW)),
      neffSmokedWindowMat
    );
    windowGlass.name = `${doorName}.windowGlass`;
    windowGlass.position.set(0.004, winCenterY, 0);
    doorGroup.add(windowGlass);

    // 6. Sculpted NEFF N50 Brushed Graphite Grey Bar Handle & Standoffs
    for (const sz of [-0.215, 0.215] as const) {
      const standoff = new THREE.Mesh(sharedNeffHandleStandoffGeo, neffGraphiteMat);
      standoff.name = `${doorName}.handleStandoff.${sz < 0 ? 'right' : 'left'}`;
      standoff.position.set(0.024, handleLocalY, sz);
      standoff.castShadow = true;
      tagHighLod(standoff, 12);
      doorGroup.add(standoff);
    }
    const handleBar = new THREE.Mesh(sharedNeffHandleBarGeo, neffGraphiteMat);
    handleBar.name = `${doorName}.handleBar`;
    handleBar.position.set(0.042, handleLocalY, 0);
    handleBar.castShadow = true;
    handleBar.receiveShadow = true;
    doorGroup.add(handleBar);

    ovenTowerGroup.add(doorGroup);
    const pivot = interactions.registerHingedDoor(
      ovenTowerGroup,
      doorGroup,
      new THREE.Vector3(0, -doorH * 0.5 + 0.012, 0),
      'z',
      -Math.PI * 0.44
    );
    pivot.name = `${doorName}.pivot`;
    return doorGroup;
  };

  // =========================================================================
  // NEFF N50 U2ACH7A (GRAPHITE) — 2. TOP 34L SECONDARY OVEN / GRILL DOOR (Y = 1.430m..1.702m)
  // =========================================================================
  buildNeffGraphiteOvenDoor(
    'kitchen.cabinetry.west.neffOvenTower.topOvenDoor',
    1.566,
    0.272,
    0.068,
    0.054,
    0.098
  );

  // =========================================================================
  // NEFF N50 U2ACH7A (GRAPHITE) — 3. BOTTOM 71L MAIN CIRCOTHERM OVEN DOOR (Y = 0.840m..1.422m)
  // =========================================================================
  buildNeffGraphiteOvenDoor(
    'kitchen.cabinetry.west.neffOvenTower.mainOvenDoor',
    1.131,
    0.582,
    0.098,
    0.088,
    0.238
  );

  // Top full-overlay Shaker cupboard door above NEFF Double Oven (Y = 1.83m..2.41m)
  const ovenTopDoorName = 'kitchen.cabinetry.west.neffOvenTower.topCupboardDoor';
  const ovenTopDoor = addHowdensShakerDoor(
    ovenTowerGroup,
    0,
    2.12,
    0.34,
    0.67,
    0.58,
    'x',
    0.062,
    0.062,
    false,
    ovenTopDoorName
  );
  addChromeKnob(ovenTopDoor, 0.03, 1.92 - 2.12, -0.24, 'x', `${ovenTopDoorName}.knob`);
  const ovenTopPivot = interactions.registerHingedDoor(
    ovenTowerGroup,
    ovenTopDoor,
    new THREE.Vector3(0.011, 0, 0.67 * 0.5 - 0.012),
    'y',
    -Math.PI * 0.62
  );
  ovenTopPivot.name = `${ovenTopDoorName}.pivot`;

  westGroup.add(ovenTowerGroup);
}

export function buildNorthEastBifoldPantryUnit(
  ctx: SceneBuilderContext,
  shared: KitchenCabinetrySharedContext
): void {
  const { scene, interactions } = ctx;
  const northGroup = scene;
  const {
    doveGreyMat,
    limestoneWorktopMat,
    chromeKnobMat,
    addChromeKnob,
    addHowdensShakerDoor,
    addCovingMantelCornice,
  } = shared;

  // =========================================================================
  // 6. COUNTERTOP BI-FOLD PANTRY UNIT NEAR THE TV
  //    - Upper Bi-Fold Pantry Cupboard spans X = +0.66m to +1.70m (width 1.04m, center X = +1.18m),
  //      leaving a 15cm gap (X = +1.70m..+1.85m) between the upper pantry cupboard and the X = +1.85m wall!
  //    - Lower base section & continuous Carrara marble worktop extend all the way to X = +1.85m
  //      (with a thin 15cm base cupboard in the X = +1.70m..+1.85m gap beneath the worktop!)
  // =========================================================================
  const pantryGroup = new THREE.Group();
  pantryGroup.name = 'kitchen.cabinetry.north.bifoldPantryUnit';
  pantryGroup.position.set(1.255, 0, -2.17);

  // Main lower double-door base cabinet under the upper pantry (X = +0.66m..+1.70m -> local x = -0.075m, width = 1.04m)
  nameCarcassHierarchy(
    buildHollowCabinetCarcass(pantryGroup, -0.075, 0, 0, 1.04, 0.9, 0.65, '+z', doveGreyMat, {
      plinthHeight: 0.14,
      interiorStyle: 'pantry',
      shelfCount: 1,
      hasCenterMullion: true,
      includeItems: true,
    }),
    'kitchen.cabinetry.north.bifoldPantryUnit.lowerBaseCarcass'
  );

  // Thin 15cm base cupboard in the gap between the pantry and the X = +1.85m wall (X = +1.70m..+1.85m -> local x = +0.52m, width = 0.15m)
  nameCarcassHierarchy(
    buildHollowCabinetCarcass(pantryGroup, 0.52, 0, 0, 0.15, 0.9, 0.65, '+z', doveGreyMat, {
      plinthHeight: 0.14,
      interiorStyle: 'oak',
      shelfCount: 1,
      hasCenterMullion: false,
      includeItems: false,
    }),
    'kitchen.cabinetry.north.bifoldPantryUnit.thinGapBaseCarcass'
  );

  // Continuous Carrara marble worktop running across the full base (X = +0.66m..+1.85m, width = 1.19m)
  const pantryWorktopLip = new THREE.Mesh(sharedPantryWorktopLipGeo, limestoneWorktopMat);
  pantryWorktopLip.name = 'kitchen.cabinetry.north.bifoldPantryUnit.worktopLip';
  pantryWorktopLip.position.set(0, 0.92, 0.01);
  pantryWorktopLip.castShadow = true;
  pantryWorktopLip.receiveShadow = true;
  pantryGroup.add(pantryWorktopLip);

  // 2 Full-Overlay Howdens Shaker lower cupboard doors below the upper pantry (X = +0.66m..+1.70m -> each 0.512m wide x 0.75m tall)
  for (const dx of [-0.334, 0.184] as const) {
    const hingeSideX: -1 | 1 = dx < -0.075 ? -1 : 1;
    const innerEdgeX = dx < -0.075 ? dx + 0.195 : dx - 0.195;
    const sideLabel = dx < -0.075 ? 'left' : 'right';
    const doorName = `kitchen.cabinetry.north.bifoldPantryUnit.lowerDoor.${sideLabel}`;
    const door = addHowdensShakerDoor(
      pantryGroup,
      dx,
      0.515,
      0.325,
      0.512,
      0.75,
      'z',
      0.058,
      0.058,
      false,
      doorName
    );
    addChromeKnob(door, innerEdgeX - dx, 0.81 - 0.515, 0.03, 'z', `${doorName}.knob`);
    const pivot = interactions.registerHingedDoor(
      pantryGroup,
      door,
      new THREE.Vector3(hingeSideX * (0.512 * 0.5 - 0.012), 0, 0.011),
      'y',
      hingeSideX * Math.PI * 0.62
    );
    pivot.name = `${doorName}.pivot`;
  }

  // Thin 15cm Shaker base cupboard door in the right-hand gap (X = +1.70m..+1.85m -> local x = +0.52m, width = 0.144m x 0.75m tall)
  const thinGapDoorName = 'kitchen.cabinetry.north.bifoldPantryUnit.thinGapBaseDoor';
  const thinGapBaseDoor = addHowdensShakerDoor(
    pantryGroup,
    0.52,
    0.515,
    0.325,
    0.144,
    0.75,
    'z',
    0.036,
    0.058,
    false,
    thinGapDoorName
  );
  addChromeKnob(thinGapBaseDoor, -0.035, 0.81 - 0.515, 0.03, 'z', `${thinGapDoorName}.knob`);
  const thinGapPivot = interactions.registerHingedDoor(
    pantryGroup,
    thinGapBaseDoor,
    new THREE.Vector3(0.144 * 0.5 - 0.012, 0, 0.011),
    'y',
    Math.PI * 0.62
  );
  thinGapPivot.name = `${thinGapDoorName}.pivot`;

  // Upper Countertop Pantry Carcass (X = +0.66m..+1.70m -> local x = -0.075m, width = 1.04m, leaving a 15cm gap to the X = +1.85m wall!)
  nameCarcassHierarchy(
    buildHollowCabinetCarcass(
      pantryGroup,
      -0.075,
      0.94,
      -0.075,
      1.04,
      1.48,
      0.5,
      '+z',
      doveGreyMat,
      {
        plinthHeight: 0,
        interiorStyle: 'pantry',
        shelfCount: 3,
        hasCenterMullion: false,
        includeItems: true,
      }
    ),
    'kitchen.cabinetry.north.bifoldPantryUnit.upperPantryCarcass'
  );

  // Coving-like mantel cornice wrapping around the 3 exposed sides of the Upper Pantry Cupboard
  addCovingMantelCornice(
    pantryGroup,
    -0.075,
    2.42,
    -0.075,
    1.04,
    0.5,
    0.042,
    0.042,
    0,
    0.042,
    { back: true },
    'kitchen.cabinetry.north.bifoldPantryUnit.cornice'
  );

  // 4 Full-Overlay Bi-Fold Howdens Shaker Door Panes on the 1.04m-wide Upper Pantry (each 0.254m wide x 1.45m tall)
  const bifoldPaneCentersX: readonly [number, number, number, number] = [
    -0.4635,
    -0.2045,
    0.0545,
    0.3135,
  ];
  const bifoldLeafNames: readonly [string, string, string, string] = [
    'kitchen.cabinetry.north.bifoldPantryUnit.bifoldLeaf.leftOuter',
    'kitchen.cabinetry.north.bifoldPantryUnit.bifoldLeaf.leftInner',
    'kitchen.cabinetry.north.bifoldPantryUnit.bifoldLeaf.rightInner',
    'kitchen.cabinetry.north.bifoldPantryUnit.bifoldLeaf.rightOuter',
  ];
  const bifoldLeaves: THREE.Group[] = [];
  for (let i = 0; i < bifoldPaneCentersX.length; i++) {
    const px = bifoldPaneCentersX[i]!;
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
      true,
      bifoldLeafNames[i]
    );
    bifoldLeaves.push(leaf);
  }

  // Attach bi-fold knuckle hinges and brushed stainless knobs directly to the 4 folding leaves
  const [leftOuterLeaf, leftInnerLeaf, rightInnerLeaf, rightOuterLeaf] = bifoldLeaves;
  if (leftOuterLeaf && leftInnerLeaf && rightInnerLeaf && rightOuterLeaf) {
    const hingeYs = [1.18, 1.68, 2.18] as const;
    for (let i = 0; i < hingeYs.length; i++) {
      const hingeY = hingeYs[i]!;
      const leftKnuckle = new THREE.Mesh(sharedBifoldKnuckleHingeGeo, chromeKnobMat);
      leftKnuckle.name = `${leftOuterLeaf.name}.knuckleHinge_${i + 1}`;
      leftKnuckle.position.set(0.127, hingeY - 1.68, 0.023);
      tagHighLod(leftKnuckle, 12);
      leftOuterLeaf.add(leftKnuckle);

      const rightKnuckle = new THREE.Mesh(sharedBifoldKnuckleHingeGeo, chromeKnobMat);
      rightKnuckle.name = `${rightOuterLeaf.name}.knuckleHinge_${i + 1}`;
      rightKnuckle.position.set(-0.127, hingeY - 1.68, 0.023);
      tagHighLod(rightKnuckle, 12);
      rightOuterLeaf.add(rightKnuckle);
    }

    addChromeKnob(
      leftInnerLeaf,
      0.09,
      1.24 - 1.68,
      0.03,
      'z',
      `${leftInnerLeaf.name}.knob.inner`
    );
    addChromeKnob(
      leftInnerLeaf,
      -0.09,
      1.24 - 1.68,
      0.03,
      'z',
      `${leftInnerLeaf.name}.knob.knuckle`
    );
    addChromeKnob(
      rightInnerLeaf,
      -0.09,
      1.24 - 1.68,
      0.03,
      'z',
      `${rightInnerLeaf.name}.knob.inner`
    );
    addChromeKnob(
      rightInnerLeaf,
      0.09,
      1.24 - 1.68,
      0.03,
      'z',
      `${rightInnerLeaf.name}.knob.knuckle`
    );

    interactions.registerBifoldCupboardPair(
      pantryGroup,
      leftOuterLeaf,
      leftInnerLeaf,
      -1,
      0.254,
      0.175
    );
    if (leftOuterLeaf.parent && leftOuterLeaf.parent !== pantryGroup) {
      leftOuterLeaf.parent.name =
        'kitchen.cabinetry.north.bifoldPantryUnit.bifoldLeaf.leftOuter.pivot';
    }

    interactions.registerBifoldCupboardPair(
      pantryGroup,
      rightOuterLeaf,
      rightInnerLeaf,
      1,
      0.254,
      0.175
    );
    if (rightOuterLeaf.parent && rightOuterLeaf.parent !== pantryGroup) {
      rightOuterLeaf.parent.name =
        'kitchen.cabinetry.north.bifoldPantryUnit.bifoldLeaf.rightOuter.pivot';
    }
  }

  northGroup.add(pantryGroup);
}
