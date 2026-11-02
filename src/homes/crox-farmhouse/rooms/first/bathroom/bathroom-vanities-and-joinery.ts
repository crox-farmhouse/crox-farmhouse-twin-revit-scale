import * as THREE from 'three';
import { buildSweptMouldingGeometry } from '../../../../../engine/geometry/index.ts';
import {
  buildArmstrongPaperHolder,
  buildArmstrongRobeHook,
  buildLefroyBrooksCharterhouseWc,
  getBathroomBrassMaterials,
  getBathroomTextileMaterials,
  getHonedCarraraMarbleMaterial,
  getVitreousChinaMaterial,
  prepGeo,
  wallFacingToRotY,
} from '../../../../../objects/sanitaryware/index.ts';
import { ROOM17_BOXED_DADO, ROOM17_OPTION1_PLANES } from './bathroom-panelling-and-linings.ts';
import {
  applyMarbleWorldUVs,
  getHeritageVanityMaterialSuite,
  type HeritageSmokedOakPalette,
  type HeritageVanityMaterialSuite,
} from './heritage-breakfront-vanity-materials.ts';

export interface FamilyBathroomDrinksCabinetKit {
  brassMat: THREE.Material;
  ceramicWhiteMat: THREE.Material;
  floorTopY: number;
  upperWallTopY: number;
  windowGlassMat: THREE.Material;
}

export interface FamilyBathroomVanityAndToiletKit {
  brassMat: THREE.Material;
  ceramicWhiteMat: THREE.Material;
  floorTopY: number;
}

/**
 * Exact architectural dimensions & coordinates for the Room 17 (`familyBathroom`)
 * Heritage Smoked Dark-Oak Breakfront Single-Basin Vanity, Grigio-Taupe Marble Upstand,
 * Rounded-Top Reeded Brass Mirror, Boiserie Panels & Pleated Sage-Celadon Wall Sconces.
 */
const HERITAGE_BREAKFRONT_SPEC = {
  wallX: ROOM17_OPTION1_PLANES.westWallX, // -12.810m
  smoothWallFaceX: ROOM17_OPTION1_PLANES.westWallX + ROOM17_OPTION1_PLANES.smoothWallLiningDepth, // -12.8062m
  northZ: ROOM17_OPTION1_PLANES.vanityNorthZ, // -0.780m
  southZ: ROOM17_OPTION1_PLANES.vanitySouthZ, // +0.680m (1,460mm W; 220mm gap to Z = +0.900m!)
  centerZ: (ROOM17_OPTION1_PLANES.vanityNorthZ + ROOM17_OPTION1_PLANES.vanitySouthZ) * 0.5, // -0.050m
  wingWidthZ: 0.395, // North wing: -0.780..-0.385m; South wing: +0.285..+0.680m
  centerBayWidthZ: 0.67, // Central projecting basin bay: -0.385..+0.285m
  wingDepthX: 0.505, // X = -12.810..-12.305m
  centerDepthX: 0.555, // X = -12.810..-12.255m (+50mm breakfront step!)
  carcassHeight: 0.85, // Y = 2.160..3.010m
  plinthFasciaH: 0.108, // Y = 2.160..2.268m
  plinthMouldingH: 0.032, // Y = 2.268..2.300m (total plinth height = 140mm)
  plinthProj: ROOM17_OPTION1_PLANES.vanityPlinthProjection, // 14mm proud of carcass faces
  counterThick: 0.03, // Y = 3.010..3.040m
  counterOverhang: 0.018, // 18mm proud around all 7 exposed breakfront faces
  upstandThickX: 0.02, // 20mm thick proud of smooth West wall
  upstandWingH: 0.085, // Y = 3.040..3.125m
  upstandCenterH: 0.155, // Y = 3.040..3.195m
  basinWidthZ: 0.52, // Cutout 520 × 360mm (outer ceramic bowl 540 × 380mm)
  basinDepthX: 0.36,
  mirrorWidthZ: 0.65, // Z = -0.375..+0.275m
  mirrorBotOffsetY: 1.13, // Y = 3.290m
  mirrorHeight: 0.79, // Y = 3.290..4.080m
  mirrorTopRadius: 0.118,
  mirrorFrameWidth: 0.048,
  boiserieWidthZ: 0.305, // Plumb-centered over North (-0.5825m) & South (+0.4825m) drawer wings
  boiserieBotOffsetY: 1.08, // Y = 3.240m
  boiserieHeight: 0.9, // Y = 3.240..4.140m
  sconceBackplateOffsetY: 1.58, // Y = 3.740m
  bathMatLengthZ: 1.4, // John Lewis Micro-Fresh Extra Large Deep Pile Bath Mat (`140 × 70 cm`, Code 60029308)
  bathMatWidthX: 0.7, // X = -12.220..-11.520m (35mm East of X = -12.255m central bay carcass)
  bathMatWestEdgeX: -12.22,
  bathMatNorthZ: -0.78, // Z = -0.780..+0.620m (clears door-54's R = 720mm swing & 10mm undercut!)
  bathMatBorderInset: 0.11, // Signature 11cm inset sculpted/recessed rectangular border groove
  bathMatThickness: 0.02, // Plush 20mm 100% cotton cut-tuft pile
} as const;

const WC_AND_ACCESSORY_SPEC = {
  wcX: -10.18,
  wcBackZ: ROOM17_OPTION1_PLANES.northWallZ + ROOM17_BOXED_DADO.dadoShelfD, // -2.418m proud of 82mm North dado
  paperHolderX: ROOM17_OPTION1_PLANES.eastWallX - ROOM17_BOXED_DADO.panelFaceD, // -9.868m
  paperHolderY: 2.8,
  paperHolderZ: -1.55,
  robeHookPatressFaceX: ROOM17_OPTION1_PLANES.bulkheadOuterWestX - ROOM17_BOXED_DADO.panelFaceD, // -10.958m
  robeHookY: 3.82,
  robeLength: 1.06,
  hooks: [
    ['north', -0.46],
    ['south', -0.14],
  ] as const,
} as const;

let cachedFloralKnobGeo: THREE.BufferGeometry | null = null;

/**
 * Builds the slimline `450mm`-deep recessed oak Hotel Drinks & Refreshment Cabinet in the
 * Upper South Passage alcove (`X = -10.62..-9.80m, Z = +0.602..+1.048m`), with `0mm` protrusion
 * into the passage (`Z <= +1.05m`) and `0mm` Z-fighting against `bulkheadUpperSoffit` (`Y = 4.160m`).
 */
export function buildFamilyBathroomDrinksCabinet(
  scene: THREE.Group,
  kit: FamilyBathroomDrinksCabinetKit
): void {
  const { brassMat, ceramicWhiteMat, floorTopY, upperWallTopY, windowGlassMat } = kit;

  const drinksGroup = new THREE.Group();
  drinksGroup.name = 'familyBathroom.drinksCabinet';

  const cx = -10.21;
  const cabW = 0.82;
  const cabH = upperWallTopY - floorTopY;
  const zBack = 0.602;
  const zFront = 1.048;
  const cabD = zFront - zBack;
  const cz = (zBack + zFront) * 0.5;

  const darkAnthraciteMat = new THREE.MeshStandardMaterial({
    color: 0x1e2022,
    roughness: 0.35,
    metalness: 0.65,
  });
  const oakCabinetMat = new THREE.MeshStandardMaterial({
    color: 0xa17b55,
    roughness: 0.46,
    metalness: 0.04,
  });
  const beechShelfMat = new THREE.MeshStandardMaterial({
    color: 0xc89d6c,
    roughness: 0.55,
    metalness: 0.05,
  });
  const carraraMat = getHonedCarraraMarbleMaterial();
  const sanPellegrinoGlassMat = new THREE.MeshStandardMaterial({
    color: 0x1d5e3a,
    roughness: 0.12,
    metalness: 0.1,
  });
  const sanPellegrinoLabelMat = new THREE.MeshStandardMaterial({
    color: 0xbfe0f0,
    roughness: 0.4,
  });
  const fijiBottleMat = new THREE.MeshStandardMaterial({
    color: 0xd0eefc,
    roughness: 0.1,
    metalness: 0.05,
    transparent: true,
    opacity: 0.85,
  });
  const champagneGlassMat = new THREE.MeshStandardMaterial({
    color: 0x182c1b,
    roughness: 0.14,
    metalness: 0.15,
  });
  const champagneFoilMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.25,
    metalness: 0.82,
  });
  const dashCanMats = [
    new THREE.MeshStandardMaterial({ color: 0xe86c8d, roughness: 0.28, metalness: 0.45 }),
    new THREE.MeshStandardMaterial({ color: 0xf2a663, roughness: 0.28, metalness: 0.45 }),
    new THREE.MeshStandardMaterial({ color: 0x7bc496, roughness: 0.28, metalness: 0.45 }),
    new THREE.MeshStandardMaterial({ color: 0xf2d65b, roughness: 0.28, metalness: 0.45 }),
  ];
  const warmLedMat = new THREE.MeshStandardMaterial({
    color: 0xfff1d0,
    emissive: 0xffd28a,
    emissiveIntensity: 0.75,
    roughness: 0.2,
  });

  const headerH = 0.088;
  const lowerCheekH = cabH - headerH - 0.002;
  const backThick = 0.022;

  const backPanel = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(cabW - 0.004, cabH - 0.004, backThick)),
    oakCabinetMat
  );
  backPanel.name = 'familyBathroom.drinksCabinet.backPanel';
  backPanel.position.set(cx, floorTopY + (cabH - 0.004) * 0.5, zBack + backThick * 0.5);
  drinksGroup.add(backPanel);

  const cheekDepth = cabD - backThick;
  const cheekGeo = prepGeo(new THREE.BoxGeometry(0.026, lowerCheekH, cheekDepth));
  for (const sideSign of [-1, 1] as const) {
    const cheek = new THREE.Mesh(cheekGeo, oakCabinetMat);
    cheek.name = `familyBathroom.drinksCabinet.cheek.${sideSign < 0 ? 'west' : 'east'}`;
    cheek.position.set(
      cx + sideSign * (cabW * 0.5 - 0.015),
      floorTopY + lowerCheekH * 0.5,
      zBack + backThick + cheekDepth * 0.5
    );
    drinksGroup.add(cheek);
  }

  const topHeader = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(cabW - 0.004, headerH, cabD - 0.002)),
    oakCabinetMat
  );
  topHeader.name = 'familyBathroom.drinksCabinet.topHeader';
  topHeader.position.set(cx, upperWallTopY - 0.002 - headerH * 0.5, cz);
  drinksGroup.add(topHeader);

  const basePlinth = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(cabW - 0.056, 0.08, cheekDepth - 0.024)),
    oakCabinetMat
  );
  basePlinth.name = 'familyBathroom.drinksCabinet.basePlinth';
  basePlinth.position.set(cx, floorTopY + 0.04, zBack + backThick + (cheekDepth - 0.024) * 0.5);
  drinksGroup.add(basePlinth);

  const coolerGroup = new THREE.Group();
  coolerGroup.name = 'familyBathroom.drinksCabinet.wineCooler';
  const coolerW = 0.758;
  const coolerH = 0.79;
  const coolerY0 = floorTopY + 0.08;
  const coolerBackZ = zBack + backThick + 0.01;
  const coolerFrontZ = 1.02;
  const coolerD = coolerFrontZ - coolerBackZ;
  const coolerMidZ = (coolerBackZ + coolerFrontZ) * 0.5;

  const coolerBack = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(coolerW, coolerH, 0.022)),
    darkAnthraciteMat
  );
  coolerBack.name = 'familyBathroom.drinksCabinet.wineCooler.back';
  coolerBack.position.set(cx, coolerY0 + coolerH * 0.5, coolerBackZ + 0.011);
  coolerGroup.add(coolerBack);

  for (const [partTag, py] of [
    ['top', coolerY0 + coolerH - 0.016],
    ['bottom', coolerY0 + 0.016],
  ] as const) {
    const slab = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(coolerW, 0.032, coolerD - 0.02)),
      darkAnthraciteMat
    );
    slab.name = `familyBathroom.drinksCabinet.wineCooler.${partTag}`;
    slab.position.set(cx, py, coolerMidZ);
    coolerGroup.add(slab);
  }

  const coolerSideGeo = prepGeo(new THREE.BoxGeometry(0.03, coolerH - 0.064, coolerD - 0.02));
  for (const s of [-1, 1] as const) {
    const side = new THREE.Mesh(coolerSideGeo, darkAnthraciteMat);
    side.name = `familyBathroom.drinksCabinet.wineCooler.side.${s < 0 ? 'west' : 'east'}`;
    side.position.set(cx + s * (coolerW * 0.5 - 0.015), coolerY0 + coolerH * 0.5, coolerMidZ);
    coolerGroup.add(side);
  }

  const coolerLed = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(coolerW - 0.08, 0.006, 0.014)),
    warmLedMat
  );
  coolerLed.name = 'familyBathroom.drinksCabinet.wineCooler.ledStrip';
  coolerLed.position.set(cx, coolerY0 + coolerH - 0.035, coolerFrontZ - 0.055);
  coolerGroup.add(coolerLed);

  const shelfYs = [coolerY0 + 0.24, coolerY0 + 0.49] as const;
  const shelfGeo = prepGeo(new THREE.BoxGeometry(coolerW - 0.064, 0.014, coolerD - 0.075));
  for (const [idx, sy] of shelfYs.entries()) {
    const shelf = new THREE.Mesh(shelfGeo, beechShelfMat);
    shelf.name = `familyBathroom.drinksCabinet.wineCooler.shelf_${idx + 1}`;
    shelf.position.set(cx, sy, coolerMidZ - 0.01);
    coolerGroup.add(shelf);
  }

  for (let i = 0; i < 3; i++) {
    const bx = cx - 0.22 + i * 0.11;
    const by = coolerY0 + 0.032;
    const body = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.036, 0.038, 0.14, 14)),
      champagneGlassMat
    );
    body.name = `familyBathroom.drinksCabinet.champagne_${i + 1}.body`;
    body.position.set(bx, by + 0.07, coolerMidZ);
    coolerGroup.add(body);

    const foil = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.013, 0.022, 0.055, 12)),
      champagneFoilMat
    );
    foil.name = `familyBathroom.drinksCabinet.champagne_${i + 1}.foil`;
    foil.position.set(bx, by + 0.165, coolerMidZ);
    coolerGroup.add(foil);
  }

  for (let i = 0; i < 3; i++) {
    const bx = cx + 0.08 + i * 0.095;
    const by = shelfYs[0]! + 0.008;
    const sp = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.028, 0.03, 0.165, 14)),
      sanPellegrinoGlassMat
    );
    sp.name = `familyBathroom.drinksCabinet.sanPellegrino_${i + 1}.body`;
    sp.position.set(bx, by + 0.0825, coolerMidZ + 0.02);
    coolerGroup.add(sp);

    const lbl = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.0305, 0.0305, 0.048, 14)),
      sanPellegrinoLabelMat
    );
    lbl.name = `familyBathroom.drinksCabinet.sanPellegrino_${i + 1}.label`;
    lbl.position.set(bx, by + 0.075, coolerMidZ + 0.02);
    coolerGroup.add(lbl);
  }

  for (let i = 0; i < 2; i++) {
    const bx = cx - 0.24 + i * 0.09;
    const by = shelfYs[0]! + 0.008;
    const fiji = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(0.058, 0.165, 0.058)),
      fijiBottleMat
    );
    fiji.name = `familyBathroom.drinksCabinet.fijiWater_${i + 1}.body`;
    fiji.position.set(bx, by + 0.0825, coolerMidZ + 0.02);
    coolerGroup.add(fiji);
  }

  for (let c = 0; c < 4; c++) {
    const bx = cx - 0.22 + c * 0.145;
    const by = shelfYs[1]! + 0.008;
    const can = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.028, 0.028, 0.115, 14)),
      dashCanMats[c % dashCanMats.length]!
    );
    can.name = `familyBathroom.drinksCabinet.dashCan_${c + 1}.body`;
    can.position.set(bx, by + 0.0575, coolerMidZ + 0.03);
    coolerGroup.add(can);
  }

  const doorFrameZ = coolerFrontZ - 0.008;
  for (const [tag, dy] of [
    ['doorFrameTop', coolerY0 + coolerH - 0.02],
    ['doorFrameBottom', coolerY0 + 0.02],
  ] as const) {
    const rail = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(coolerW, 0.04, 0.018)),
      darkAnthraciteMat
    );
    rail.name = `familyBathroom.drinksCabinet.wineCooler.${tag}`;
    rail.position.set(cx, dy, doorFrameZ);
    coolerGroup.add(rail);
  }
  for (const s of [-1, 1] as const) {
    const stile = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(0.04, coolerH - 0.08, 0.018)),
      darkAnthraciteMat
    );
    stile.name = `familyBathroom.drinksCabinet.wineCooler.doorStile.${s < 0 ? 'west' : 'east'}`;
    stile.position.set(cx + s * (coolerW * 0.5 - 0.02), coolerY0 + coolerH * 0.5, doorFrameZ);
    coolerGroup.add(stile);
  }
  const coolerGlass = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(coolerW - 0.08, coolerH - 0.08, 0.006)),
    windowGlassMat
  );
  coolerGlass.name = 'familyBathroom.drinksCabinet.wineCooler.doorGlass';
  coolerGlass.position.set(cx, coolerY0 + coolerH * 0.5, doorFrameZ);
  coolerGroup.add(coolerGlass);

  const coolerHandle = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.007, 0.007, 0.42, 12)),
    brassMat
  );
  coolerHandle.name = 'familyBathroom.drinksCabinet.wineCooler.doorHandle';
  coolerHandle.position.set(cx - coolerW * 0.5 + 0.05, coolerY0 + coolerH * 0.55, doorFrameZ + 0.022);
  coolerGroup.add(coolerHandle);

  drinksGroup.add(coolerGroup);

  const counterY = floorTopY + 0.87;
  const counterD = zFront - 0.004 - (zBack + backThick);
  const counterMidZ = zBack + backThick + counterD * 0.5;
  const marbleCounter = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(cabW - 0.056, 0.028, counterD)),
    carraraMat
  );
  marbleCounter.name = 'familyBathroom.drinksCabinet.marbleCountertop';
  marbleCounter.position.set(cx, counterY + 0.014, counterMidZ);
  marbleCounter.castShadow = true;
  marbleCounter.receiveShadow = true;
  drinksGroup.add(marbleCounter);

  const counterTopY = counterY + 0.028;
  const marbleSplash = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(cabW - 0.056, 0.065, 0.014)),
    carraraMat
  );
  marbleSplash.name = 'familyBathroom.drinksCabinet.backsplash';
  marbleSplash.position.set(cx, counterTopY + 0.0325, zBack + backThick + 0.007);
  drinksGroup.add(marbleSplash);

  const coffeeGroup = new THREE.Group();
  coffeeGroup.name = 'familyBathroom.drinksCabinet.coffeeMachine';
  const cmX = cx - 0.19;
  const cmZ = zBack + backThick + 0.16;
  const cmBody = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.13, 0.23, 0.24)),
    darkAnthraciteMat
  );
  cmBody.name = 'familyBathroom.drinksCabinet.coffeeMachine.body';
  cmBody.position.set(cmX, counterTopY + 0.115, cmZ);
  cmBody.castShadow = true;
  coffeeGroup.add(cmBody);

  const brewHead = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.028, 0.024, 0.055, 14)),
    brassMat
  );
  brewHead.name = 'familyBathroom.drinksCabinet.coffeeMachine.brewHead';
  brewHead.position.set(cmX, counterTopY + 0.17, cmZ + 0.125);
  coffeeGroup.add(brewHead);

  const dripTray = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.11, 0.018, 0.075)),
    darkAnthraciteMat
  );
  dripTray.name = 'familyBathroom.drinksCabinet.coffeeMachine.dripTray';
  dripTray.position.set(cmX, counterTopY + 0.009, cmZ + 0.14);
  coffeeGroup.add(dripTray);

  const espressoCup = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.026, 0.02, 0.048, 14)),
    ceramicWhiteMat
  );
  espressoCup.name = 'familyBathroom.drinksCabinet.coffeeMachine.espressoCup';
  espressoCup.position.set(cmX, counterTopY + 0.042, cmZ + 0.14);
  coffeeGroup.add(espressoCup);
  drinksGroup.add(coffeeGroup);

  const trayX = cx + 0.16;
  const trayZ = zBack + backThick + 0.2;
  const hospTray = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.28, 0.014, 0.2)),
    oakCabinetMat
  );
  hospTray.name = 'familyBathroom.drinksCabinet.hospitalityTray';
  hospTray.position.set(trayX, counterTopY + 0.007, trayZ);
  drinksGroup.add(hospTray);

  for (let i = 0; i < 2; i++) {
    const cxCup = trayX - 0.065 + i * 0.13;
    const saucer = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.052, 0.04, 0.008, 16)),
      ceramicWhiteMat
    );
    saucer.name = `familyBathroom.drinksCabinet.hospitalityTray.saucer_${i + 1}`;
    saucer.position.set(cxCup, counterTopY + 0.018, trayZ);
    drinksGroup.add(saucer);

    const cup = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.032, 0.025, 0.054, 16)),
      ceramicWhiteMat
    );
    cup.name = `familyBathroom.drinksCabinet.hospitalityTray.cup_${i + 1}`;
    cup.position.set(cxCup, counterTopY + 0.048, trayZ);
    drinksGroup.add(cup);
  }

  const upperShelfD = 0.28;
  const upperShelfMidZ = zBack + backThick + upperShelfD * 0.5;
  for (const [sIdx, sy] of [counterTopY + 0.38, counterTopY + 0.72].entries()) {
    const uShelf = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(cabW - 0.056, 0.022, upperShelfD)),
      oakCabinetMat
    );
    uShelf.name = `familyBathroom.drinksCabinet.upperShelf_${sIdx + 1}`;
    uShelf.position.set(cx, sy, upperShelfMidZ);
    uShelf.castShadow = true;
    drinksGroup.add(uShelf);

    const galleryRail = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.004, 0.004, cabW - 0.064, 12)),
      brassMat
    );
    galleryRail.name = `familyBathroom.drinksCabinet.upperShelf_${sIdx + 1}.galleryRail`;
    galleryRail.rotation.z = Math.PI * 0.5;
    galleryRail.position.set(cx, sy + 0.026, zBack + backThick + upperShelfD - 0.014);
    drinksGroup.add(galleryRail);

    const ledUnder = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(cabW - 0.09, 0.005, 0.012)),
      warmLedMat
    );
    ledUnder.name = `familyBathroom.drinksCabinet.upperShelf_${sIdx + 1}.ledStrip`;
    ledUnder.position.set(cx, sy - 0.013, zBack + backThick + upperShelfD - 0.04);
    drinksGroup.add(ledUnder);

    for (let g = 0; g < 4; g++) {
      const gx = cx - 0.24 + g * 0.16;
      const tumbler = new THREE.Mesh(
        prepGeo(new THREE.CylinderGeometry(0.032, 0.028, sIdx === 0 ? 0.092 : 0.135, 14)),
        windowGlassMat
      );
      tumbler.name = `familyBathroom.drinksCabinet.shelf_${sIdx + 1}.glass_${g + 1}`;
      tumbler.position.set(gx, sy + 0.011 + (sIdx === 0 ? 0.046 : 0.0675), upperShelfMidZ + 0.02);
      drinksGroup.add(tumbler);
    }
  }

  scene.add(drinksGroup);
}

/**
 * Builds a reusable 10-petal radially fluted / scalloped Tudor-rose brass floral knob
 * matching the close-up hardware in `heritage_vanity_ref2.jpg` (`Ø31mm × D23mm`, local `+X` outward).
 */
function getFlutedFloralRosetteKnobGeometry(): THREE.BufferGeometry {
  if (cachedFloralKnobGeo) return cachedFloralKnobGeo;

  const positions: number[] = [];
  const uvs: number[] = [];

  const pushTri = (
    ax: number,
    ay: number,
    az: number,
    bx: number,
    by: number,
    bz: number,
    cx: number,
    cy: number,
    cz: number
  ): void => {
    positions.push(ax, ay, az, bx, by, bz, cx, cy, cz);
    uvs.push(ay * 20, az * 20, by * 20, bz * 20, cy * 20, cz * 20);
  };

  const petals = 10;
  const segTheta = 60;
  const segRho = 10;
  const baseRadius = 0.0152;
  const headCenterX = 0.0165;

  const frontRingPoint = (ir: number, it: number): [number, number, number] => {
    const rho = ir / segRho;
    const theta = (it / segTheta) * Math.PI * 2;
    const lobe = 1 + 0.078 * Math.cos(petals * theta) * Math.pow(rho, 1.35);
    const r = baseRadius * rho * lobe;
    // Domed face with radial petal flutes + crisp tiny central stamen pip
    const dome = 0.0052 * Math.cos(rho * Math.PI * 0.46);
    const fluteCrease =
      0.00155 * Math.sin(Math.pow(rho, 0.85) * Math.PI) * (0.5 - 0.5 * Math.cos(petals * theta));
    const centerPip = rho < 0.18 ? 0.0012 * Math.cos((rho / 0.18) * Math.PI * 0.5) : 0;
    const x = headCenterX + dome - fluteCrease + centerPip;
    return [x, r * Math.sin(theta), r * Math.cos(theta)];
  };

  // Front sculpted fluted rosette dome
  for (let ir = 0; ir < segRho; ir++) {
    for (let it = 0; it < segTheta; it++) {
      const p00 = frontRingPoint(ir, it);
      const p10 = frontRingPoint(ir + 1, it);
      const p11 = frontRingPoint(ir + 1, it + 1);
      const p01 = frontRingPoint(ir, it + 1);
      if (ir > 0) {
        pushTri(p00[0], p00[1], p00[2], p11[0], p11[1], p11[2], p10[0], p10[1], p10[2]);
      }
      pushTri(p00[0], p00[1], p00[2], p01[0], p01[1], p01[2], p11[0], p11[1], p11[2]);
    }
  }

  // Scalloped outer rim & tapered rear calyx back to the Ø11mm stem at x = 0.008m
  const backSlices: readonly [number, number, number][] = [
    [1.0, 0.078, headCenterX],
    [0.98, 0.068, 0.0138],
    [0.72, 0.03, 0.0102],
    [0.38, 0.0, 0.008],
    [0.36, 0.0, 0.002],
    [0.52, 0.0, 0.0015],
    [0.52, 0.0, 0.0],
  ];

  for (let s = 0; s < backSlices.length - 1; s++) {
    const [scale0, amp0, x0] = backSlices[s]!;
    const [scale1, amp1, x1] = backSlices[s + 1]!;
    for (let it = 0; it < segTheta; it++) {
      const th0 = (it / segTheta) * Math.PI * 2;
      const th1 = ((it + 1) / segTheta) * Math.PI * 2;
      const r00 = baseRadius * scale0 * (1 + amp0 * Math.cos(petals * th0));
      const r01 = baseRadius * scale0 * (1 + amp0 * Math.cos(petals * th1));
      const r10 = baseRadius * scale1 * (1 + amp1 * Math.cos(petals * th0));
      const r11 = baseRadius * scale1 * (1 + amp1 * Math.cos(petals * th1));

      const a: [number, number, number] = [x0, r00 * Math.sin(th0), r00 * Math.cos(th0)];
      const b: [number, number, number] = [x0, r01 * Math.sin(th1), r01 * Math.cos(th1)];
      const c: [number, number, number] = [x1, r11 * Math.sin(th1), r11 * Math.cos(th1)];
      const d: [number, number, number] = [x1, r10 * Math.sin(th0), r10 * Math.cos(th0)];
      pushTri(a[0], a[1], a[2], d[0], d[1], d[2], c[0], c[1], c[2]);
      pushTri(a[0], a[1], a[2], c[0], c[1], c[2], b[0], b[1], b[2]);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  sanitizeNormals(geo);
  cachedFloralKnobGeo = geo;
  return geo;
}

function addFloralRosetteKnob(
  parent: THREE.Group,
  name: string,
  frontFaceX: number,
  y: number,
  z: number,
  mat: THREE.Material
): void {
  const knob = new THREE.Mesh(getFlutedFloralRosetteKnobGeometry(), mat);
  knob.name = name;
  knob.position.set(frontFaceX - 0.0005, y, z);
  knob.castShadow = true;
  knob.receiveShadow = true;
  parent.add(knob);
}

/**
 * Builds a 45°-mitred inner cock-bead / bolection moulding rectangle (`4` mitred strips)
 * on an East-facing (`+X`) Shaker door or drawer front, matching `ref2.jpg` & `ref3.jpg`.
 */
function sanitizeNormals(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  geo.computeVertexNormals();
  const nAttr = geo.getAttribute('normal') as THREE.BufferAttribute | undefined;
  if (nAttr) {
    for (let i = 0; i < nAttr.count; i++) {
      const nx = nAttr.getX(i);
      const ny = nAttr.getY(i);
      const nz = nAttr.getZ(i);
      const lenSq = nx * nx + ny * ny + nz * nz;
      if (!Number.isFinite(lenSq) || lenSq < 1e-12) {
        nAttr.setXYZ(i, 1, 0, 0);
      }
    }
    nAttr.needsUpdate = true;
  }
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

function buildMitredInnerBeadFrameGeometry(
  innerW: number,
  innerH: number,
  beadW: number,
  beadD: number
): THREE.BufferGeometry {
  // Sample non-degenerate closed ogee/bolection cross-section `(projX, insetOffset)`:
  // `insetOffset = 0` sits against the outer stile/rail step; `insetOffset = beadW` steps inward toward center!
  const curve = new THREE.Shape();
  curve.moveTo(0, 0);
  curve.lineTo(beadD * 0.65, 0);
  curve.quadraticCurveTo(beadD, beadW * 0.28, beadD * 0.86, beadW * 0.62);
  curve.quadraticCurveTo(beadD * 0.45, beadW * 0.92, 0, beadW);
  const rawPts = curve.getPoints(6);
  const ring: [number, number][] = [];
  for (const p of rawPts) {
    if (
      ring.length === 0 ||
      Math.hypot(p.x - ring[ring.length - 1][0], p.y - ring[ring.length - 1][1]) > 1e-5
    ) {
      ring.push([p.x, p.y]);
    }
  }
  if (Math.hypot(ring[0][0] - ring[ring.length - 1][0], ring[0][1] - ring[ring.length - 1][1]) < 1e-5) {
    ring.pop();
  }

  const hw = innerW * 0.5;
  const hh = innerH * 0.5;
  // 4 corners in `(z, y)` around the East-facing (`+X`) inner aperture, with exact 45° inward corner mitre `(dz, dy)`:
  const corners: readonly { z: number; y: number; dz: number; dy: number }[] = [
    { z: -hw, y: hh, dz: 1, dy: -1 },
    { z: -hw, y: -hh, dz: 1, dy: 1 },
    { z: hw, y: -hh, dz: -1, dy: 1 },
    { z: hw, y: hh, dz: -1, dy: -1 },
  ];

  const positions: number[] = [];
  const uvs: number[] = [];
  const m = ring.length;

  const evalCorner = (cIdx: number, pIdx: number): [number, number, number] => {
    const c = corners[cIdx];
    const [projX, inset] = ring[pIdx];
    return [projX, c.y + c.dy * inset, c.z + c.dz * inset];
  };

  for (let side = 0; side < 4; side++) {
    const nextSide = (side + 1) % 4;
    const sideLen = side % 2 === 0 ? innerH : innerW;
    for (let j = 0; j < m; j++) {
      const jNext = (j + 1) % m;
      const a = evalCorner(side, j);
      const b = evalCorner(nextSide, j);
      const c = evalCorner(nextSide, jNext);
      const d = evalCorner(side, jNext);
      const v0 = j / m;
      const v1 = (j + 1) / m;

      positions.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
      uvs.push(0, v0, sideLen, v0, sideLen, v1);

      positions.push(a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2]);
      uvs.push(0, v0, sideLen, v1, 0, v1);
    }
  }

  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  return sanitizeNormals(out);
}

/**
 * Adds an in-frame cock-beaded Shaker door or drawer front (`vertical-grain` stiles & recessed
 * center panel, `horizontal-grain` top & bottom rails, and 45°-mitred inner bolection beading).
 */
function addBeadedShakerFront(
  parent: THREE.Group,
  namePrefix: string,
  frontFaceX: number,
  centerY: number,
  centerZ: number,
  height: number,
  widthZ: number,
  stileW: number,
  railH: number,
  oak: HeritageSmokedOakPalette
): void {
  const frameT = 0.019;
  const panelT = 0.011;
  const beadW = 0.0105;
  const beadD = 0.0065;
  const innerW = Math.max(0.05, widthZ - stileW * 2);
  const innerH = Math.max(0.05, height - railH * 2);
  const panelFaceX = frontFaceX - frameT + panelT;

  // Recessed vertical-grain smoked-oak field panel
  const panel = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(panelT, innerH + 0.01, innerW + 0.01)),
    oak.panelField
  );
  panel.name = `${namePrefix}.panel`;
  panel.position.set(frontFaceX - frameT + panelT * 0.5, centerY, centerZ);
  panel.castShadow = true;
  panel.receiveShadow = true;
  parent.add(panel);

  // Vertical-grain left & right stiles
  const stileGeo = prepGeo(new THREE.BoxGeometry(frameT, height, stileW));
  for (const [tag, zOff] of [
    ['northStile', -(widthZ * 0.5 - stileW * 0.5)],
    ['southStile', widthZ * 0.5 - stileW * 0.5],
  ] as const) {
    const stile = new THREE.Mesh(stileGeo, oak.verticalGrain);
    stile.name = `${namePrefix}.${tag}`;
    stile.position.set(frontFaceX - frameT * 0.5, centerY, centerZ + zOff);
    stile.castShadow = true;
    stile.receiveShadow = true;
    parent.add(stile);
  }

  // Horizontal-grain top & bottom rails
  const railGeo = prepGeo(new THREE.BoxGeometry(frameT, railH, innerW));
  for (const [tag, yOff] of [
    ['topRail', height * 0.5 - railH * 0.5],
    ['bottomRail', -(height * 0.5 - railH * 0.5)],
  ] as const) {
    const rail = new THREE.Mesh(railGeo, oak.horizontalGrain);
    rail.name = `${namePrefix}.${tag}`;
    rail.position.set(frontFaceX - frameT * 0.5, centerY + yOff, centerZ);
    rail.castShadow = true;
    rail.receiveShadow = true;
    parent.add(rail);
  }

  // 45°-mitred inner stepped beading moulding around the recessed panel (`ref2.jpg` & `ref3.jpg`)
  const beadMesh = new THREE.Mesh(
    buildMitredInnerBeadFrameGeometry(innerW, innerH, beadW, beadD),
    oak.verticalGrain
  );
  beadMesh.name = `${namePrefix}.innerBeading`;
  beadMesh.position.set(panelFaceX, centerY, centerZ);
  beadMesh.castShadow = true;
  beadMesh.receiveShadow = true;
  parent.add(beadMesh);
}

/**
 * Returns the 8-point horizontal `[x, z]` breakfront perimeter polyline (ordered South -> East -> North
 * so outward normal `(-dz, dx)` points into Room 17 along all 7 exposed segments).
 */
function getBreakfrontPerimeterPath(extraOutwardOffset = 0): [number, number][] {
  const {
    wallX,
    northZ,
    southZ,
    centerZ,
    centerBayWidthZ,
    wingDepthX,
    centerDepthX,
  } = HERITAGE_BREAKFRONT_SPEC;

  const southEndZ = southZ + extraOutwardOffset;
  const northEndZ = northZ - extraOutwardOffset;
  const wingFrontX = wallX + wingDepthX + extraOutwardOffset;
  const centerFrontX = wallX + centerDepthX + extraOutwardOffset;
  const southStepZ = centerZ + centerBayWidthZ * 0.5 + extraOutwardOffset;
  const northStepZ = centerZ - centerBayWidthZ * 0.5 - extraOutwardOffset;

  return [
    [wallX, southEndZ],
    [wingFrontX, southEndZ],
    [wingFrontX, southStepZ],
    [centerFrontX, southStepZ],
    [centerFrontX, northStepZ],
    [wingFrontX, northStepZ],
    [wingFrontX, northEndZ],
    [wallX, northEndZ],
  ];
}

/**
 * Builds the shaped ogee-bracket front plinth fascia (`Y = 2.160..2.268m`) under the projecting
 * central 2-door bay (`ref1.jpg` & `ref3.jpg`), with horizontal smoked-oak UVs.
 */
function buildCenterShapedBracketPlinthGeometry(
  spanZ: number,
  heightY: number,
  thickX: number
): THREE.BufferGeometry {
  const hz = spanZ * 0.5;
  const footW = 0.112;
  const archTopY = 0.056;
  const innerShoulderZ = hz - footW - 0.088;

  const shape = new THREE.Shape();
  shape.moveTo(-hz, 0);
  shape.lineTo(-hz + footW, 0);
  shape.bezierCurveTo(
    -hz + footW + 0.028,
    0.002,
    -innerShoulderZ - 0.036,
    archTopY,
    -innerShoulderZ,
    archTopY
  );
  shape.lineTo(innerShoulderZ, archTopY);
  shape.bezierCurveTo(
    innerShoulderZ + 0.036,
    archTopY,
    hz - footW - 0.028,
    0.002,
    hz - footW,
    0
  );
  shape.lineTo(hz, 0);
  shape.lineTo(hz, heightY);
  shape.lineTo(-hz, heightY);
  shape.closePath();

  const raw = new THREE.ExtrudeGeometry(shape, {
    depth: thickX,
    bevelEnabled: true,
    bevelThickness: 0.0012,
    bevelSize: 0.0012,
    bevelSegments: 2,
    curveSegments: 24,
  });
  raw.rotateY(Math.PI * 0.5);

  const nonIdx = raw.index ? raw.toNonIndexed() : raw;
  nonIdx.computeVertexNormals();
  const pos = nonIdx.getAttribute('position') as THREE.BufferAttribute;
  const uvs = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    // Horizontal oak grain: map horizontal Z/X onto `u`, vertical Y onto `v`
    uvs[i * 2] = (pos.getZ(i) + pos.getX(i)) * 1.4;
    uvs[i * 2 + 1] = pos.getY(i) * 1.4;
  }
  nonIdx.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  nonIdx.computeBoundingBox();
  nonIdx.computeBoundingSphere();
  return nonIdx;
}

/**
 * Builds the deck-mounted Polished Brass (`BR`) Y-cradle traditional monobloc basin mixer
 * with curved swan-neck spout and angled V-arms + 4-spoke crosshead handles (`ref1.jpg` & `ref3.jpg`).
 */
function buildHeritageBrassYCradleMixer(
  namePrefix: string,
  brBrass: ReturnType<typeof getBathroomBrassMaterials>,
  chinaMat: THREE.Material
): THREE.Group {
  const group = new THREE.Group();
  group.name = namePrefix;

  // Hexagonal / stepped traditional pedestal base on marble deck
  const basePlinth = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.026, 0.031, 0.012, 8)),
    brBrass.primary
  );
  basePlinth.name = `${namePrefix}.hexPedestal`;
  basePlinth.position.set(0, 0.006, 0);
  basePlinth.castShadow = true;
  group.add(basePlinth);

  const lowerBody = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.019, 0.024, 0.038, 16)),
    brBrass.primary
  );
  lowerBody.name = `${namePrefix}.centralBody`;
  lowerBody.position.set(0, 0.03, 0);
  lowerBody.castShadow = true;
  group.add(lowerBody);

  // Twin ~42° angled V-arms branching toward North (-Z) and South (+Z) with crosshead handles
  for (const [sideTag, zSign] of [
    ['northColdValve', -1],
    ['southHotValve', 1],
  ] as const) {
    const armGroup = new THREE.Group();
    armGroup.name = `${namePrefix}.${sideTag}`;
    armGroup.position.set(0, 0.034, zSign * 0.008);
    armGroup.rotation.x = zSign * 0.74; // ~42.4° outward V-splay matching ref1.jpg & ref3.jpg!

    const branchTube = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.0125, 0.0155, 0.052, 14)),
      brBrass.primary
    );
    branchTube.name = `${namePrefix}.${sideTag}.branch`;
    branchTube.position.set(0, 0.026, 0);
    branchTube.castShadow = true;
    armGroup.add(branchTube);

    const bonnet = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.0155, 0.0135, 0.018, 14)),
      brBrass.primary
    );
    bonnet.name = `${namePrefix}.${sideTag}.bonnet`;
    bonnet.position.set(0, 0.058, 0);
    armGroup.add(bonnet);

    const stem = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.0065, 0.008, 0.02, 12)),
      brBrass.primary
    );
    stem.name = `${namePrefix}.${sideTag}.spindle`;
    stem.position.set(0, 0.075, 0);
    armGroup.add(stem);

    const hub = new THREE.Mesh(
      prepGeo(new THREE.SphereGeometry(0.011, 14, 12)),
      brBrass.primary
    );
    hub.name = `${namePrefix}.${sideTag}.crossheadHub`;
    hub.position.set(0, 0.088, 0);
    armGroup.add(hub);

    // White porcelain H/C index cap on top of crosshead hub
    const ceramicIndex = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.0068, 0.0068, 0.004, 14)),
      chinaMat
    );
    ceramicIndex.name = `${namePrefix}.${sideTag}.ceramicIndex`;
    ceramicIndex.position.set(0, 0.098, 0);
    armGroup.add(ceramicIndex);

    // 4-spoke traditional crosshead arms + ball tips
    for (let s = 0; s < 4; s++) {
      const ang = (s * Math.PI) * 0.5 + Math.PI * 0.25;
      const spokeGroup = new THREE.Group();
      spokeGroup.name = `${namePrefix}.${sideTag}.spoke_${s + 1}`;
      spokeGroup.position.set(0, 0.088, 0);
      spokeGroup.rotation.y = ang;

      const spoke = new THREE.Mesh(
        prepGeo(new THREE.CylinderGeometry(0.0034, 0.0048, 0.03, 10)),
        brBrass.primary
      );
      spoke.name = `${namePrefix}.${sideTag}.spoke_${s + 1}.shaft`;
      spoke.rotation.z = Math.PI * 0.5;
      spoke.position.set(0.018, 0, 0);
      spokeGroup.add(spoke);

      const tipBall = new THREE.Mesh(
        prepGeo(new THREE.SphereGeometry(0.0056, 10, 8)),
        brBrass.primary
      );
      tipBall.name = `${namePrefix}.${sideTag}.spoke_${s + 1}.tip`;
      tipBall.position.set(0.034, 0, 0);
      spokeGroup.add(tipBall);

      armGroup.add(spokeGroup);
    }

    group.add(armGroup);
  }

  // Tall curved swan-neck spout rising from center collar to H = 196mm (Y = 3.236m, arching
  // ~4cm above the 3.195m marble splashback plateau) and reaching 148mm forward over the bowl
  const spoutCollar = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.0135, 0.0165, 0.022, 16)),
    brBrass.primary
  );
  spoutCollar.name = `${namePrefix}.spoutCollar`;
  spoutCollar.position.set(0, 0.056, 0);
  group.add(spoutCollar);

  const spoutCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.064, 0),
    new THREE.Vector3(0.004, 0.135, 0),
    new THREE.Vector3(0.034, 0.19, 0),
    new THREE.Vector3(0.095, 0.196, 0),
    new THREE.Vector3(0.14, 0.162, 0),
    new THREE.Vector3(0.148, 0.134, 0),
  ]);
  const spoutTube = new THREE.Mesh(
    prepGeo(new THREE.TubeGeometry(spoutCurve, 32, 0.0092, 16, false)),
    brBrass.primary
  );
  spoutTube.name = `${namePrefix}.swanNeckSpout`;
  spoutTube.castShadow = true;
  group.add(spoutTube);

  const spoutNozzle = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.0102, 0.0126, 0.016, 16)),
    brBrass.primary
  );
  spoutNozzle.name = `${namePrefix}.aeratorNozzle`;
  spoutNozzle.position.set(0.1485, 0.128, 0);
  spoutNozzle.rotation.z = -0.16;
  group.add(spoutNozzle);

  return group;
}

/**
 * Builds the Heritage Smoked Dark-Oak Breakfront Vanity (`1,460mm W × 505/555mm D × 850mm H`),
 * Veined Grigio-Taupe Marble Breakfront Countertop (`30mm`) + S-Curve Stepped Splashback (`85..155mm`),
 * Glazed Oval Undermount Basin & Brass Y-Cradle Swan-Neck Mixer (`ref1.jpg`, `ref2.jpg`, `ref3.jpg`).
 */
function buildHeritageBreakfrontVanity(
  floorTopY: number,
  mats: HeritageVanityMaterialSuite,
  brBrass: ReturnType<typeof getBathroomBrassMaterials>,
  chinaMat: THREE.Material
): THREE.Group {
  const vanityGroup = new THREE.Group();
  vanityGroup.name = 'familyBathroom.darkOakVanityUnit';

  const {
    wallX,
    smoothWallFaceX,
    northZ,
    southZ,
    centerZ,
    wingWidthZ,
    centerBayWidthZ,
    wingDepthX,
    centerDepthX,
    carcassHeight,
    plinthFasciaH,
    plinthMouldingH,
    plinthProj,
    counterThick,
    counterOverhang,
    upstandThickX,
    upstandWingH,
    upstandCenterH,
    basinWidthZ,
    basinDepthX,
  } = HERITAGE_BREAKFRONT_SPEC;

  const { oak, taupeMarble, floralKnobBrass } = mats;
  const plinthTotalH = plinthFasciaH + plinthMouldingH; // 0.140m
  const carcassTopY = floorTopY + carcassHeight; // 3.010m
  const counterTopY = carcassTopY + counterThick; // 3.040m
  const bodyBotY = floorTopY + plinthTotalH; // 2.300m
  const bodyH = carcassTopY - bodyBotY; // 0.710m
  const bodyMidY = (bodyBotY + carcassTopY) * 0.5;

  const wingFrontX = wallX + wingDepthX; // -12.305m
  const centerFrontX = wallX + centerDepthX; // -12.255m
  const northStepZ = centerZ - centerBayWidthZ * 0.5; // -0.385m
  const southStepZ = centerZ + centerBayWidthZ * 0.5; // +0.285m
  const northWingCz = northZ + wingWidthZ * 0.5; // -0.5825m
  const southWingCz = southZ - wingWidthZ * 0.5; // +0.4825m

  // =========================================================================
  // 1. 3-BAY BREAKFRONT SMOKED DARK-OAK CARCASS & VERTICAL-GRAIN SIDE CHEEKS
  // =========================================================================
  // Recessed shadow backing boxes behind inset doors & drawers (gives crisp 2.5mm dark shadow lines!)
  const wingShadowCarcass = prepGeo(new THREE.BoxGeometry(wingDepthX - 0.012, bodyH, wingWidthZ - 0.008));
  for (const [tag, wCz] of [
    ['northWingCarcass', northWingCz],
    ['southWingCarcass', southWingCz],
  ] as const) {
    const mesh = new THREE.Mesh(wingShadowCarcass, oak.shadowReveal);
    mesh.name = `familyBathroom.darkOakVanityUnit.${tag}`;
    mesh.position.set(wallX + (wingDepthX - 0.012) * 0.5, bodyMidY, wCz);
    vanityGroup.add(mesh);
  }

  // Slim front shadow baffle behind the inset central doors (leaves the upper basin cavity 100% open!)
  const centerFrontShadowBaffle = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.036, bodyH, centerBayWidthZ - 0.008)),
    oak.shadowReveal
  );
  centerFrontShadowBaffle.name = 'familyBathroom.darkOakVanityUnit.centerBayFrontReveal';
  centerFrontShadowBaffle.position.set(centerFrontX - 0.03, bodyMidY, centerZ);
  vanityGroup.add(centerFrontShadowBaffle);

  const centerLowerCarcass = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(centerDepthX - 0.042, bodyH - 0.22, centerBayWidthZ - 0.008)),
    oak.shadowReveal
  );
  centerLowerCarcass.name = 'familyBathroom.darkOakVanityUnit.centerBayCarcass';
  centerLowerCarcass.position.set(
    wallX + (centerDepthX - 0.042) * 0.5,
    bodyBotY + (bodyH - 0.22) * 0.5,
    centerZ
  );
  vanityGroup.add(centerLowerCarcass);

  // Exposed North & South full-depth side panels in vertical-grain smoked oak (`ref3.jpg` left side!)
  const endCheekT = 0.024;
  const endCheekGeo = prepGeo(new THREE.BoxGeometry(wingDepthX, bodyH, endCheekT));
  for (const [tag, ez] of [
    ['northExposedEndPanel', northZ + endCheekT * 0.5],
    ['southExposedEndPanel', southZ - endCheekT * 0.5],
  ] as const) {
    const panel = new THREE.Mesh(endCheekGeo, oak.verticalGrain);
    panel.name = `familyBathroom.darkOakVanityUnit.${tag}`;
    panel.position.set(wallX + wingDepthX * 0.5, bodyMidY, ez);
    panel.castShadow = true;
    panel.receiveShadow = true;
    vanityGroup.add(panel);
  }

  // Crisp 50mm breakfront step side return cheeks (`X = -12.305..-12.255m` at `Z = -0.385m` & `+0.285m`)
  const stepDepth = centerDepthX - wingDepthX; // 0.050m
  const stepCheekT = 0.026;
  const stepCheekGeo = prepGeo(new THREE.BoxGeometry(stepDepth + 0.02, bodyH, stepCheekT));
  for (const [tag, sz] of [
    ['northBreakfrontReturnStile', northStepZ + stepCheekT * 0.5],
    ['southBreakfrontReturnStile', southStepZ - stepCheekT * 0.5],
  ] as const) {
    const ret = new THREE.Mesh(stepCheekGeo, oak.verticalGrain);
    ret.name = `familyBathroom.darkOakVanityUnit.${tag}`;
    ret.position.set(centerFrontX - (stepDepth + 0.02) * 0.5, bodyMidY, sz);
    ret.castShadow = true;
    ret.receiveShadow = true;
    vanityGroup.add(ret);
  }

  // =========================================================================
  // 2. MOULDED PLINTH (`Y = 2.160..2.300m`) & SHAPED CENTER BRACKET CUTOUT
  // =========================================================================
  const wingPlinthFrontX = wingFrontX + plinthProj; // -12.291m
  const centerPlinthFrontX = centerFrontX + plinthProj; // -12.241m
  const plinthNorthZ = northZ - plinthProj; // -0.794m
  const plinthSouthZ = southZ + plinthProj; // +0.694m
  const plinthNorthStepZ = northStepZ - plinthProj; // -0.399m
  const plinthSouthStepZ = southStepZ + plinthProj; // +0.299m
  const plinthFasciaMidY = floorTopY + plinthFasciaH * 0.5;

  // Solid horizontal-grain plinth blocks under North & South drawer wings (including exposed side returns)
  const wingPlinthW = wingWidthZ; // Z = -0.794..-0.399m and +0.299..+0.694m
  const wingPlinthD = wingPlinthFrontX - wallX;
  const wingPlinthGeo = prepGeo(new THREE.BoxGeometry(wingPlinthD, plinthFasciaH, wingPlinthW));
  for (const [tag, pz] of [
    ['northWingPlinth', (plinthNorthZ + plinthNorthStepZ) * 0.5],
    ['southWingPlinth', (plinthSouthStepZ + plinthSouthZ) * 0.5],
  ] as const) {
    const wp = new THREE.Mesh(wingPlinthGeo, oak.horizontalGrain);
    wp.name = `familyBathroom.darkOakVanityUnit.${tag}`;
    wp.position.set(wallX + wingPlinthD * 0.5, plinthFasciaMidY, pz);
    wp.castShadow = true;
    wp.receiveShadow = true;
    vanityGroup.add(wp);
  }

  // Solid L-return plinth cheeks on the 50mm breakfront projection (`Z = -0.399m` & `+0.299m`)
  const centerPlinthSpanZ = plinthSouthStepZ - plinthNorthStepZ; // 0.698m
  const stepPlinthReturnGeo = prepGeo(new THREE.BoxGeometry(stepDepth + 0.024, plinthFasciaH, 0.032));
  for (const [tag, rz] of [
    ['northCenterPlinthReturn', plinthNorthStepZ + 0.016],
    ['southCenterPlinthReturn', plinthSouthStepZ - 0.016],
  ] as const) {
    const rMesh = new THREE.Mesh(stepPlinthReturnGeo, oak.horizontalGrain);
    rMesh.name = `familyBathroom.darkOakVanityUnit.${tag}`;
    rMesh.position.set(centerPlinthFrontX - (stepDepth + 0.016) * 0.5, plinthFasciaMidY, rz);
    rMesh.castShadow = true;
    rMesh.receiveShadow = true;
    vanityGroup.add(rMesh);
  }

  // Recessed shadow kickboard behind the shaped central bracket cutout (`ref1.jpg` & `ref3.jpg`)
  const recessedKick = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(centerDepthX - 0.042, plinthFasciaH, centerBayWidthZ - 0.01)),
    oak.shadowReveal
  );
  recessedKick.name = 'familyBathroom.darkOakVanityUnit.centerRecessedShadowKick';
  recessedKick.position.set(wallX + (centerDepthX - 0.042) * 0.5, plinthFasciaMidY, centerZ);
  recessedKick.castShadow = true;
  vanityGroup.add(recessedKick);

  // Extruded shaped ogee-bracket front fascia under the central 2-door bay
  const bracketFasciaThick = 0.022;
  const centerBracketMesh = new THREE.Mesh(
    buildCenterShapedBracketPlinthGeometry(centerPlinthSpanZ, plinthFasciaH, bracketFasciaThick),
    oak.horizontalGrain
  );
  centerBracketMesh.name = 'familyBathroom.darkOakVanityUnit.centerShapedBracketPlinth';
  centerBracketMesh.position.set(centerPlinthFrontX - bracketFasciaThick, floorTopY, centerZ);
  centerBracketMesh.castShadow = true;
  centerBracketMesh.receiveShadow = true;
  vanityGroup.add(centerBracketMesh);

  // Continuous swept stepped cyma/ogee plinth top moulding (`Y = 2.268..2.300m`) around all 7 faces!
  const plinthCapProfile = new THREE.Shape();
  plinthCapProfile.moveTo(0, -0.008);
  plinthCapProfile.lineTo(0, plinthProj);
  plinthCapProfile.lineTo(0.005, plinthProj);
  plinthCapProfile.quadraticCurveTo(0.012, plinthProj, 0.017, plinthProj * 0.62);
  plinthCapProfile.quadraticCurveTo(0.023, plinthProj * 0.16, 0.028, plinthProj * 0.12);
  plinthCapProfile.lineTo(plinthMouldingH, 0);
  plinthCapProfile.lineTo(plinthMouldingH, -0.008);
  plinthCapProfile.closePath();

  const plinthCapGeo = buildSweptMouldingGeometry(
    plinthCapProfile,
    getBreakfrontPerimeterPath(0),
    (x, z, vertY) => new THREE.Vector3(x, floorTopY + plinthFasciaH + vertY, z),
    8
  );
  const plinthCapMesh = new THREE.Mesh(plinthCapGeo, oak.horizontalGrain);
  plinthCapMesh.name = 'familyBathroom.darkOakVanityUnit.sweptPlinthOgeeMoulding';
  plinthCapMesh.castShadow = true;
  plinthCapMesh.receiveShadow = true;
  vanityGroup.add(plinthCapMesh);

  // =========================================================================
  // 3. FACE FRAMES, TWIN CENTRAL IN-FRAME DOORS & 6 GRADUATED DRAWERS + 8 FLORAL KNOBS
  // =========================================================================
  const frameDepthX = 0.022;
  const topRailH = 0.024;
  const botRailH = 0.016;
  const openY0 = bodyBotY + botRailH; // 2.316m
  const openY1 = carcassTopY - topRailH; // 2.986m
  const openH = openY1 - openY0; // 0.670m

  // 3A. Central projecting basin bay (`Z = -0.385..+0.285m`, `670mm` W): twin tall in-frame Shaker doors
  const centerOuterStileW = 0.034;
  for (const [sTag, sz] of [
    ['centerNorthFrameStile', northStepZ + centerOuterStileW * 0.5],
    ['centerSouthFrameStile', southStepZ - centerOuterStileW * 0.5],
  ] as const) {
    const st = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(frameDepthX, bodyH, centerOuterStileW)),
      oak.verticalGrain
    );
    st.name = `familyBathroom.darkOakVanityUnit.${sTag}`;
    st.position.set(centerFrontX - frameDepthX * 0.5, bodyMidY, sz);
    st.castShadow = true;
    st.receiveShadow = true;
    vanityGroup.add(st);
  }

  const centerClearW = centerBayWidthZ - centerOuterStileW * 2; // 0.602m
  for (const [rTag, rH, ry] of [
    ['centerTopFrameRail', topRailH, carcassTopY - topRailH * 0.5],
    ['centerBottomFrameRail', botRailH, bodyBotY + botRailH * 0.5],
  ] as const) {
    const rl = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(frameDepthX, rH, centerClearW)),
      oak.horizontalGrain
    );
    rl.name = `familyBathroom.darkOakVanityUnit.${rTag}`;
    rl.position.set(centerFrontX - frameDepthX * 0.5, ry, centerZ);
    rl.castShadow = true;
    rl.receiveShadow = true;
    vanityGroup.add(rl);
  }

  const revealGap = 0.003;
  const doorH = openH - revealGap * 2; // 0.664m
  const doorCy = (openY0 + openY1) * 0.5;
  const singleDoorW = (centerClearW - revealGap * 3) * 0.5; // 0.2965m
  const doorStileW = 0.052;
  const doorRailH = 0.054;
  // In `ref2.jpg`, the two floral knobs sit centered on the 52mm meeting stiles near the top rail!
  const doorKnobY = openY1 - revealGap - doorRailH * 0.52;

  for (const [dIdx, zSign] of ([-1, 1] as const).entries()) {
    const doorCz = centerZ + zSign * (singleDoorW * 0.5 + revealGap * 0.5);
    const dPrefix = `familyBathroom.darkOakVanityUnit.sinkDoor_${dIdx + 1}`;
    addBeadedShakerFront(
      vanityGroup,
      dPrefix,
      centerFrontX - 0.0015,
      doorCy,
      doorCz,
      doorH,
      singleDoorW,
      doorStileW,
      doorRailH,
      oak
    );
    addFloralRosetteKnob(
      vanityGroup,
      `${dPrefix}.floralKnob`,
      centerFrontX - 0.0015,
      doorKnobY,
      centerZ + zSign * (revealGap * 0.5 + doorStileW * 0.5),
      floralKnobBrass
    );
  }

  // 3B. Left (South) & Right (North) Recessed Drawer Wings (`395mm` W each, 3 graduated drawers per wing)
  const wingOuterStileW = 0.028;
  const wingInnerStileW = 0.028;
  const drawerGap = 0.0035;
  const availDrawerStackH = openH - drawerGap * 4;
  const topDrH = availDrawerStackH * 0.305;
  const midDrH = availDrawerStackH * 0.335;
  const botDrH = availDrawerStackH * 0.36;

  const botDrCy = openY0 + drawerGap + botDrH * 0.5;
  const midDrCy = openY0 + drawerGap * 2 + botDrH + midDrH * 0.5;
  const topDrCy = openY1 - drawerGap - topDrH * 0.5;

  for (const [bankTag, bankZ0, bankZ1] of [
    ['northBank', northZ, northStepZ],
    ['southBank', southStepZ, southZ],
  ] as const) {
    const bankOuterZ =
      bankTag === 'northBank'
        ? bankZ0 + wingOuterStileW * 0.5
        : bankZ1 - wingOuterStileW * 0.5;
    const bankInnerZ =
      bankTag === 'northBank'
        ? bankZ1 - wingInnerStileW * 0.5
        : bankZ0 + wingInnerStileW * 0.5;

    for (const [stTag, stW, stZ] of [
      ['outerFrameStile', wingOuterStileW, bankOuterZ],
      ['innerFrameStile', wingInnerStileW, bankInnerZ],
    ] as const) {
      const st = new THREE.Mesh(
        prepGeo(new THREE.BoxGeometry(frameDepthX, bodyH, stW)),
        oak.verticalGrain
      );
      st.name = `familyBathroom.darkOakVanityUnit.${bankTag}.${stTag}`;
      st.position.set(wingFrontX - frameDepthX * 0.5, bodyMidY, stZ);
      st.castShadow = true;
      st.receiveShadow = true;
      vanityGroup.add(st);
    }

    const clearZ0 =
      bankTag === 'northBank' ? bankZ0 + wingOuterStileW : bankZ0 + wingInnerStileW;
    const clearZ1 =
      bankTag === 'northBank' ? bankZ1 - wingInnerStileW : bankZ1 - wingOuterStileW;
    const clearWingW = clearZ1 - clearZ0;
    const clearWingCz = (clearZ0 + clearZ1) * 0.5;

    for (const [rTag, rH, ry] of [
      ['topFrameRail', topRailH, carcassTopY - topRailH * 0.5],
      ['bottomFrameRail', botRailH, bodyBotY + botRailH * 0.5],
    ] as const) {
      const rl = new THREE.Mesh(
        prepGeo(new THREE.BoxGeometry(frameDepthX, rH, clearWingW)),
        oak.horizontalGrain
      );
      rl.name = `familyBathroom.darkOakVanityUnit.${bankTag}.${rTag}`;
      rl.position.set(wingFrontX - frameDepthX * 0.5, ry, clearWingCz);
      rl.castShadow = true;
      rl.receiveShadow = true;
      vanityGroup.add(rl);
    }

    const drawerW = clearWingW - revealGap * 2;
    for (const [drTag, drCy, drH] of [
      ['bottomDrawer', botDrCy, botDrH],
      ['middleDrawer', midDrCy, midDrH],
      ['topDrawer', topDrCy, topDrH],
    ] as const) {
      const drPrefix = `familyBathroom.darkOakVanityUnit.${bankTag}.${drTag}`;
      addBeadedShakerFront(
        vanityGroup,
        drPrefix,
        wingFrontX - 0.0015,
        drCy,
        clearWingCz,
        drH,
        drawerW,
        0.044,
        0.042,
        oak
      );
      addFloralRosetteKnob(
        vanityGroup,
        `${drPrefix}.floralKnob`,
        wingFrontX - 0.0015,
        drCy,
        clearWingCz,
        floralKnobBrass
      );
    }
  }

  // =========================================================================
  // 4. VEINED GRIGIO-TAUPE BREAKFRONT MARBLE COUNTERTOP (`30mm`, `Y = 3.010..3.040m`)
  //    + SWEPT STEPPED-BULLNOSE PERIMETER EDGE + S-CURVE STEPPED SPLASHBACK
  // =========================================================================
  const basinCenterX = wallX + 0.305; // -12.505m (centered cleanly in 573mm breakfront bay)
  const coreOverhang = 0.011; // Core extruded deck extends to +11mm; sculpted bullnose sweeps +11..+19mm!
  const deckPath = getBreakfrontPerimeterPath(coreOverhang);

  // In Shape coordinates (x, y) before `rotateX(-PI/2)`: local x = world X, local y = -world Z
  const slabShape = new THREE.Shape();
  slabShape.moveTo(deckPath[0]![0], -deckPath[0]![1]);
  for (let i = 1; i < deckPath.length; i++) {
    slabShape.lineTo(deckPath[i]![0], -deckPath[i]![1]);
  }
  slabShape.closePath();

  const basinHole = new THREE.Path();
  basinHole.absellipse(
    basinCenterX,
    -centerZ,
    basinDepthX * 0.5,
    basinWidthZ * 0.5,
    0,
    Math.PI * 2,
    false,
    0
  );
  slabShape.holes.push(basinHole);

  const rawSlabGeo = new THREE.ExtrudeGeometry(slabShape, {
    depth: counterThick - 0.002,
    bevelEnabled: true,
    bevelThickness: 0.001,
    bevelSize: 0.001,
    bevelSegments: 2,
    curveSegments: 48,
  });
  rawSlabGeo.rotateX(-Math.PI * 0.5);
  rawSlabGeo.translate(0, carcassTopY + 0.001, 0);

  const marbleSlab = new THREE.Mesh(applyMarbleWorldUVs(rawSlabGeo, 1.05), taupeMarble);
  marbleSlab.name = 'familyBathroom.darkOakVanityUnit.taupeMarbleCountertop';
  marbleSlab.castShadow = true;
  marbleSlab.receiveShadow = true;
  vanityGroup.add(marbleSlab);

  // Continuous swept stepped-bullnose marble perimeter moulding (`ref2.jpg` front & side profile!)
  const bullnoseStart = coreOverhang - 0.001; // 10mm (1mm tuck into slab core for zero seam)
  const bullnoseStep = counterOverhang - 0.0035; // 14.5mm upper & lower fillets
  const bullnosePeak = counterOverhang + 0.0015; // 19.5mm rounded torus nose
  const edgeProfile = new THREE.Shape();
  edgeProfile.moveTo(0, bullnoseStart);
  edgeProfile.lineTo(0, bullnoseStep);
  edgeProfile.lineTo(0.0045, bullnoseStep);
  edgeProfile.quadraticCurveTo(0.008, bullnosePeak, counterThick * 0.5, bullnosePeak);
  edgeProfile.quadraticCurveTo(counterThick - 0.008, bullnosePeak, counterThick - 0.0045, bullnoseStep);
  edgeProfile.lineTo(counterThick, bullnoseStep);
  edgeProfile.lineTo(counterThick, bullnoseStart);
  edgeProfile.closePath();

  const bullnoseGeo = applyMarbleWorldUVs(
    buildSweptMouldingGeometry(
      edgeProfile,
      getBreakfrontPerimeterPath(0),
      (x, z, vertY) => new THREE.Vector3(x, carcassTopY + vertY, z),
      10
    ),
    1.05
  );
  const bullnoseRim = new THREE.Mesh(bullnoseGeo, taupeMarble);
  bullnoseRim.name = 'familyBathroom.darkOakVanityUnit.taupeMarbleBullnoseEdge';
  bullnoseRim.castShadow = true;
  bullnoseRim.receiveShadow = true;
  vanityGroup.add(bullnoseRim);

  // Signature S-Curve Stepped Taupe-Marble Upstand Splashback (`Z = -0.780..+0.680m`, `Y = 3.040..3.125/3.195m`)
  const halfUpstandW = (southZ - northZ) * 0.5; // 0.730m
  const halfCenterW = centerBayWidthZ * 0.5; // 0.335m
  const rOuter = 0.022;
  const shoulderHalfSpan = 0.042;
  const uShoulderOut = halfCenterW + shoulderHalfSpan; // 0.377m
  const uShoulderIn = halfCenterW - shoulderHalfSpan; // 0.293m

  const upstandShape = new THREE.Shape();
  upstandShape.moveTo(-halfUpstandW, 0);
  upstandShape.lineTo(halfUpstandW, 0);
  upstandShape.lineTo(halfUpstandW, upstandWingH - rOuter);
  upstandShape.absarc(
    halfUpstandW - rOuter,
    upstandWingH - rOuter,
    rOuter,
    0,
    Math.PI * 0.5,
    false
  );
  upstandShape.lineTo(uShoulderOut, upstandWingH);
  upstandShape.bezierCurveTo(
    halfCenterW + 0.004,
    upstandWingH,
    halfCenterW - 0.004,
    upstandCenterH,
    uShoulderIn,
    upstandCenterH
  );
  upstandShape.lineTo(-uShoulderIn, upstandCenterH);
  upstandShape.bezierCurveTo(
    -halfCenterW + 0.004,
    upstandCenterH,
    -halfCenterW - 0.004,
    upstandWingH,
    -uShoulderOut,
    upstandWingH
  );
  upstandShape.lineTo(-halfUpstandW + rOuter, upstandWingH);
  upstandShape.absarc(
    -halfUpstandW + rOuter,
    upstandWingH - rOuter,
    rOuter,
    Math.PI * 0.5,
    Math.PI,
    false
  );
  upstandShape.closePath();

  const rawUpstandGeo = new THREE.ExtrudeGeometry(upstandShape, {
    depth: upstandThickX,
    bevelEnabled: true,
    bevelThickness: 0.0018,
    bevelSize: 0.0018,
    bevelSegments: 3,
    curveSegments: 28,
  });
  rawUpstandGeo.rotateY(Math.PI * 0.5);
  rawUpstandGeo.translate(smoothWallFaceX, counterTopY, centerZ);

  const upstandMesh = new THREE.Mesh(
    applyMarbleWorldUVs(rawUpstandGeo, 1.05, 0.27, 0.14),
    taupeMarble
  );
  upstandMesh.name = 'familyBathroom.darkOakVanityUnit.sCurveTaupeMarbleUpstand';
  upstandMesh.castShadow = true;
  upstandMesh.receiveShadow = true;
  vanityGroup.add(upstandMesh);

  // =========================================================================
  // 5. GLAZED WHITE CERAMIC OVAL UNDERMOUNT BASIN & BRASS Y-CRADLE MIXER
  // =========================================================================
  const bowlDepth = 0.175;
  const bowlLathePts: THREE.Vector2[] = [];
  const bowlSteps = 16;
  // Trace from TOP undermount flange DOWN to bottom drain so LatheGeometry normals point INWARD & UPWARD!
  bowlLathePts.push(new THREE.Vector2(basinDepthX * 0.535, 0.002));
  for (let i = bowlSteps; i >= 0; i--) {
    const t = i / bowlSteps;
    const r = 0.03 + (basinDepthX * 0.502 - 0.03) * Math.pow(t, 0.62);
    const y = -bowlDepth + bowlDepth * Math.pow(t, 1.35);
    bowlLathePts.push(new THREE.Vector2(r, y));
  }
  bowlLathePts.push(new THREE.Vector2(0.0, -bowlDepth));
  const bowlGeo = prepGeo(new THREE.LatheGeometry(bowlLathePts, 56));
  bowlGeo.scale(1, 1, basinWidthZ / basinDepthX);
  const glazedBowlMat = chinaMat.clone();
  glazedBowlMat.name = 'heritage.glazedCeramicOvalBowl';
  glazedBowlMat.side = THREE.DoubleSide;
  const ceramicBowl = new THREE.Mesh(bowlGeo, glazedBowlMat);
  ceramicBowl.name = 'familyBathroom.darkOakVanityUnit.undermountBasin.bowl';
  ceramicBowl.position.set(basinCenterX, carcassTopY + 0.002, centerZ);
  ceramicBowl.receiveShadow = true;
  vanityGroup.add(ceramicBowl);

  const bowlFloor = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.055, 0.052, 0.008, 32)),
    chinaMat
  );
  bowlFloor.scale.set(1, 1, basinWidthZ / basinDepthX);
  bowlFloor.name = 'familyBathroom.darkOakVanityUnit.undermountBasin.floor';
  bowlFloor.position.set(basinCenterX, carcassTopY - bowlDepth + 0.004, centerZ);
  bowlFloor.receiveShadow = true;
  vanityGroup.add(bowlFloor);

  const basinWaste = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.031, 0.029, 0.006, 24)),
    brBrass.primary
  );
  basinWaste.name = 'familyBathroom.darkOakVanityUnit.undermountBasin.brassWaste';
  basinWaste.position.set(basinCenterX, carcassTopY - bowlDepth + 0.009, centerZ);
  vanityGroup.add(basinWaste);

  // Deck-mounted Polished Brass Y-cradle monobloc bridge mixer (`ref1.jpg`, `ref2.jpg`, `ref3.jpg`)
  const yMixer = buildHeritageBrassYCradleMixer(
    'familyBathroom.darkOakVanityUnit.yCradleBasinMixer',
    brBrass,
    chinaMat
  );
  yMixer.position.set(smoothWallFaceX + upstandThickX + 0.052, counterTopY, centerZ);
  vanityGroup.add(yMixer);

  // Subtle brass tray + scalloped shell dish on South (left) counter wing (`ref1.jpg` & `ref3.jpg`!)
  const trayDishGroup = new THREE.Group();
  trayDishGroup.name = 'familyBathroom.darkOakVanityUnit.scallopedShellSoapDish';
  trayDishGroup.position.set(wallX + 0.21, counterTopY, southStepZ + 0.055);

  const brassTray = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.058, 0.052, 0.008, 24)),
    brBrass.primary
  );
  brassTray.scale.set(0.76, 1, 1.25);
  brassTray.name = 'familyBathroom.darkOakVanityUnit.scallopedShellSoapDish.brassTray';
  brassTray.position.set(0, 0.004, 0);
  brassTray.castShadow = true;
  trayDishGroup.add(brassTray);

  const shellSoap = new THREE.Mesh(
    prepGeo(new THREE.SphereGeometry(0.028, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55)),
    chinaMat
  );
  shellSoap.scale.set(0.85, 0.65, 1.15);
  shellSoap.name = 'familyBathroom.darkOakVanityUnit.scallopedShellSoapDish.shell';
  shellSoap.position.set(-0.006, 0.008, -0.014);
  trayDishGroup.add(shellSoap);

  vanityGroup.add(trayDishGroup);

  return vanityGroup;
}

/**
 * Builds the Rounded-Shoulder 5-Reed Champagne-Brass Mirror (`square 90° mitred bottom corners`
 * + `generously rounded R = 118mm top corners`) centered above the central splashback plateau,
 * plus the Twin Painted `Wimborne White` Boiserie Frames & Pleated Sage-Celadon Wall Sconces!
 */
function buildHeritageMirrorBoiserieAndSconces(
  floorTopY: number,
  mats: HeritageVanityMaterialSuite,
  brBrass: ReturnType<typeof getBathroomBrassMaterials>
): THREE.Group {
  const wallDecorGroup = new THREE.Group();
  wallDecorGroup.name = 'familyBathroom.heritageMirrorAndSconces';

  const {
    smoothWallFaceX,
    northZ,
    southZ,
    centerZ,
    wingWidthZ,
    mirrorWidthZ,
    mirrorBotOffsetY,
    mirrorHeight,
    mirrorTopRadius,
    mirrorFrameWidth,
    boiserieWidthZ,
    boiserieBotOffsetY,
    boiserieHeight,
    sconceBackplateOffsetY,
  } = HERITAGE_BREAKFRONT_SPEC;

  // =========================================================================
  // 1. ARCH-SHOULDERED 5-REED CHAMPAGNE-BRASS MIRROR (`ref1.jpg` & `ref3.jpg`)
  // =========================================================================
  const mirrorGroup = new THREE.Group();
  mirrorGroup.name = 'familyBathroom.heritageReededMirror';

  const mBotY = floorTopY + mirrorBotOffsetY; // 3.290m
  const mTopY = mBotY + mirrorHeight; // 4.080m
  const mSouthZ = centerZ + mirrorWidthZ * 0.5; // +0.275m
  const mNorthZ = centerZ - mirrorWidthZ * 0.5; // -0.375m
  const R = mirrorTopRadius; // 0.118m
  const fw = mirrorFrameWidth; // 0.048m

  // 5-reed stepped fluted moulding cross-section `(u, x)`:
  // `u in [0..fw]` = inward distance from outer perimeter; `x` = projection in +X from smooth wall
  const reedCrossSection: readonly [number, number][] = [
    [0.0, 0.0],
    [0.0, 0.02],
    [0.0025, 0.0255],
    [0.006, 0.0265],
    [0.0095, 0.0245],
    [0.0115, 0.0195],
    [0.014, 0.0242],
    [0.0175, 0.025],
    [0.0205, 0.0232],
    [0.0225, 0.0185],
    [0.025, 0.0228],
    [0.0285, 0.0235],
    [0.0315, 0.0215],
    [0.0335, 0.0165],
    [0.039, 0.0165],
    [0.0415, 0.0192],
    [0.045, 0.0188],
    [fw, 0.012],
    [fw, 0.0],
  ];

  // Build continuous swept arch (South bottom -> South vertical -> South-top arc -> Top -> North-top arc -> North vertical -> North bottom)
  // with exact 45° mitres at BOTH square 90° bottom corners (`y = mBotY + u`)!
  interface ArchSample {
    z: number;
    y: number;
    nz: number;
    ny: number;
    mitreBot: boolean;
  }

  const archSamples: ArchSample[] = [];
  const arcSteps = 22;

  // Start at South-bottom corner (mitred at 45°: z = mSouthZ - u, y = mBotY + u)
  archSamples.push({ z: mSouthZ, y: mBotY, nz: -1, ny: 1, mitreBot: true });
  archSamples.push({ z: mSouthZ, y: mTopY - R, nz: -1, ny: 0, mitreBot: false });

  // South-top rounded shoulder: center `(mSouthZ - R, mTopY - R)`, angle `0 -> PI/2` in `(+Z, +Y)`
  for (let i = 1; i <= arcSteps; i++) {
    const a = (i / arcSteps) * Math.PI * 0.5;
    const czArc = mSouthZ - R;
    const cyArc = mTopY - R;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    archSamples.push({
      z: czArc + R * ca,
      y: cyArc + R * sa,
      nz: -ca,
      ny: -sa,
      mitreBot: false,
    });
  }

  // North-top rounded shoulder: center `(mNorthZ + R, mTopY - R)`, angle `PI/2 -> PI` in `(+Z, +Y)`
  for (let i = 0; i <= arcSteps; i++) {
    const a = Math.PI * 0.5 + (i / arcSteps) * Math.PI * 0.5;
    const czArc = mNorthZ + R;
    const cyArc = mTopY - R;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    archSamples.push({
      z: czArc + R * ca,
      y: cyArc + R * sa,
      nz: -ca,
      ny: -sa,
      mitreBot: false,
    });
  }

  archSamples.push({ z: mNorthZ, y: mTopY - R, nz: 1, ny: 0, mitreBot: false });
  archSamples.push({ z: mNorthZ, y: mBotY, nz: 1, ny: 1, mitreBot: true });

  const framePositions: number[] = [];
  const frameUvs: number[] = [];
  const pushFrameQuad = (
    a: [number, number, number],
    b: [number, number, number],
    c: [number, number, number],
    d: [number, number, number]
  ): void => {
    framePositions.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
    framePositions.push(a[0], a[1], a[2], c[0], c[1], c[2], d[0], d[1], d[2]);
    frameUvs.push(a[2], a[1], b[2], b[1], c[2], c[1], a[2], a[1], c[2], c[1], d[2], d[1]);
  };

  const sampleVert = (s: ArchSample, u: number, xProj: number): [number, number, number] => [
    smoothWallFaceX + xProj,
    s.y + u * s.ny,
    s.z + u * s.nz,
  ];

  // Sweep the upper arch + both verticals
  for (let i = 0; i < archSamples.length - 1; i++) {
    const s0 = archSamples[i]!;
    const s1 = archSamples[i + 1]!;
    for (let k = 0; k < reedCrossSection.length - 1; k++) {
      const [u0, x0] = reedCrossSection[k]!;
      const [u1, x1] = reedCrossSection[k + 1]!;
      // Check winding: s goes South -> Top -> North, u goes inward -> cross product points +X!
      pushFrameQuad(
        sampleVert(s0, u0, x0),
        sampleVert(s0, u1, x1),
        sampleVert(s1, u1, x1),
        sampleVert(s1, u0, x0)
      );
    }
  }

  // Sweep the straight horizontal bottom rail between the two 45° bottom mitres!
  const botLeftSample: ArchSample = { z: mSouthZ, y: mBotY, nz: -1, ny: 1, mitreBot: true };
  const botRightSample: ArchSample = { z: mNorthZ, y: mBotY, nz: 1, ny: 1, mitreBot: true };
  for (let k = 0; k < reedCrossSection.length - 1; k++) {
    const [u0, x0] = reedCrossSection[k]!;
    const [u1, x1] = reedCrossSection[k + 1]!;
    pushFrameQuad(
      sampleVert(botRightSample, u0, x0),
      sampleVert(botRightSample, u1, x1),
      sampleVert(botLeftSample, u1, x1),
      sampleVert(botLeftSample, u0, x0)
    );
  }

  const reededFrameGeo = new THREE.BufferGeometry();
  reededFrameGeo.setAttribute('position', new THREE.Float32BufferAttribute(framePositions, 3));
  reededFrameGeo.setAttribute('uv', new THREE.Float32BufferAttribute(frameUvs, 2));
  reededFrameGeo.computeVertexNormals();
  reededFrameGeo.computeBoundingBox();
  reededFrameGeo.computeBoundingSphere();

  const reededFrameMesh = new THREE.Mesh(reededFrameGeo, mats.reededMirrorBrass);
  reededFrameMesh.name = 'familyBathroom.heritageReededMirror.reededBrassFrame';
  reededFrameMesh.castShadow = true;
  reededFrameMesh.receiveShadow = true;
  mirrorGroup.add(reededFrameMesh);

  // Arch-shouldered bevelled mirror glass plate inside the 5-reed frame (`square bottom + rounded top`)
  const makeArchPlateShape = (inset: number): THREE.Shape => {
    const hw = mirrorWidthZ * 0.5 - inset;
    const h = mirrorHeight - inset * 2;
    const r = Math.max(0.012, R - inset);
    const sh = new THREE.Shape();
    sh.moveTo(-hw, 0);
    sh.lineTo(hw, 0);
    sh.lineTo(hw, h - r);
    sh.absarc(hw - r, h - r, r, 0, Math.PI * 0.5, false);
    sh.lineTo(-hw + r, h);
    sh.absarc(-hw + r, h - r, r, Math.PI * 0.5, Math.PI, false);
    sh.closePath();
    return sh;
  };

  const bevelPlateGeo = prepGeo(
    new THREE.ExtrudeGeometry(makeArchPlateShape(fw - 0.004), {
      depth: 0.008,
      bevelEnabled: false,
      curveSegments: 24,
    })
  );
  bevelPlateGeo.rotateY(Math.PI * 0.5);
  const bevelPlate = new THREE.Mesh(bevelPlateGeo, mats.mirrorBevelGlass);
  bevelPlate.name = 'familyBathroom.heritageReededMirror.bevelPerimeterGlass';
  bevelPlate.position.set(smoothWallFaceX + 0.002, mBotY + fw - 0.004, centerZ);
  mirrorGroup.add(bevelPlate);

  const centerMirrorInset = fw + 0.018;
  const centerPlateGeo = prepGeo(
    new THREE.ExtrudeGeometry(makeArchPlateShape(centerMirrorInset), {
      depth: 0.003,
      bevelEnabled: false,
      curveSegments: 24,
    })
  );
  centerPlateGeo.rotateY(Math.PI * 0.5);
  const centerPlate = new THREE.Mesh(centerPlateGeo, mats.mirrorGlass);
  centerPlate.name = 'familyBathroom.heritageReededMirror.silverMirrorPlate';
  centerPlate.position.set(smoothWallFaceX + 0.0085, mBotY + centerMirrorInset, centerZ);
  mirrorGroup.add(centerPlate);

  wallDecorGroup.add(mirrorGroup);

  // =========================================================================
  // 2. TWIN PAINTED BOISERIE WALL PANELS & PLEATED SAGE-CELADON SCONCES
  //    Plumb-centered over the North (`Z = -0.5825m`) & South (`Z = +0.4825m`) drawer wings!
  // =========================================================================
  const northWingCz = northZ + wingWidthZ * 0.5; // -0.5825m
  const southWingCz = southZ - wingWidthZ * 0.5; // +0.4825m
  const bBotY = floorTopY + boiserieBotOffsetY; // 3.240m
  const bMidY = bBotY + boiserieHeight * 0.5; // 3.690m
  const boiserieGeo = buildMitredInnerBeadFrameGeometry(
    boiserieWidthZ + 0.03,
    boiserieHeight + 0.04,
    0.034,
    0.019
  );

  // Build reusable 3D 44-pleat gathered fabric empire shade geometry (`ref1.jpg` & `ref3.jpg`)
  const buildPleatedEmpireShadeGeo = (): THREE.BufferGeometry => {
    const pleats = 44;
    const radialSegs = pleats * 4;
    const heightSegs = 12;
    const rBot = 0.076;
    const rTop = 0.046;
    const shadeH = 0.146;
    const geo = new THREE.CylinderGeometry(rTop, rBot, shadeH, radialSegs, heightSegs, true);
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const theta = Math.atan2(z, x);
      const rBase = Math.hypot(x, z);
      const pleatWave = 1 + 0.044 * Math.cos(pleats * theta);
      const nr = rBase * pleatWave;
      pos.setXYZ(i, nr * Math.cos(theta), y, nr * Math.sin(theta));
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    return geo;
  };
  const pleatedShadeGeo = buildPleatedEmpireShadeGeo();

  const sconceY = floorTopY + sconceBackplateOffsetY; // 3.740m

  const boiserieShadowGeo = buildMitredInnerBeadFrameGeometry(
    boiserieWidthZ + 0.036,
    boiserieHeight + 0.046,
    0.04,
    0.003
  );
  const boiserieShadowMat = new THREE.MeshStandardMaterial({
    name: 'heritage.wimborneBoiserieShadowLine',
    color: 0xdad3c5,
    roughness: 0.85,
    metalness: 0.0,
  });

  for (const [sideTag, panelCz] of [
    ['north', northWingCz],
    ['south', southWingCz],
  ] as const) {
    const boiserieShadow = new THREE.Mesh(boiserieShadowGeo, boiserieShadowMat);
    boiserieShadow.name = `familyBathroom.westBoiseriePanel.${sideTag}.shadowLine`;
    boiserieShadow.position.set(smoothWallFaceX + 0.0005, bMidY, panelCz);
    wallDecorGroup.add(boiserieShadow);

    const boiserieMesh = new THREE.Mesh(boiserieGeo, mats.boiserieMoulding);
    boiserieMesh.name = `familyBathroom.westBoiseriePanel.${sideTag}`;
    boiserieMesh.position.set(smoothWallFaceX + 0.002, bMidY, panelCz);
    boiserieMesh.castShadow = true;
    boiserieMesh.receiveShadow = true;
    wallDecorGroup.add(boiserieMesh);

    const sconceGroup = new THREE.Group();
    sconceGroup.name = `familyBathroom.pleatedWallSconce.${sideTag}`;
    sconceGroup.position.set(smoothWallFaceX, sconceY, panelCz);

    // Stepped circular Polished Brass backplate (`Ø92mm`, matching `ref3.jpg`)
    const outerPlate = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.046, 0.048, 0.008, 28)),
      brBrass.primary
    );
    outerPlate.name = `familyBathroom.pleatedWallSconce.${sideTag}.wallPlate`;
    outerPlate.rotation.z = Math.PI * 0.5;
    outerPlate.position.set(0.004, 0, 0);
    outerPlate.castShadow = true;
    sconceGroup.add(outerPlate);

    const innerDome = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.028, 0.036, 0.012, 24)),
      brBrass.primary
    );
    innerDome.name = `familyBathroom.pleatedWallSconce.${sideTag}.steppedRose`;
    innerDome.rotation.z = Math.PI * 0.5;
    innerDome.position.set(0.012, 0, 0);
    sconceGroup.add(innerDome);

    const centerBoss = new THREE.Mesh(
      prepGeo(new THREE.SphereGeometry(0.011, 14, 12)),
      brBrass.primary
    );
    centerBoss.name = `familyBathroom.pleatedWallSconce.${sideTag}.finialBoss`;
    centerBoss.position.set(0.019, 0, 0);
    sconceGroup.add(centerBoss);

    // Curved swan/J-arm sweeping outward (+X = 104mm) and upward into the shade gallery
    const armCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.018, -0.002, 0),
      new THREE.Vector3(0.056, -0.016, 0),
      new THREE.Vector3(0.094, 0.004, 0),
      new THREE.Vector3(0.104, 0.046, 0),
    ]);
    const armTube = new THREE.Mesh(
      prepGeo(new THREE.TubeGeometry(armCurve, 20, 0.0052, 12, false)),
      brBrass.primary
    );
    armTube.name = `familyBathroom.pleatedWallSconce.${sideTag}.swanArm`;
    armTube.castShadow = true;
    sconceGroup.add(armTube);

    const candleCup = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.018, 0.011, 0.022, 18)),
      brBrass.primary
    );
    candleCup.name = `familyBathroom.pleatedWallSconce.${sideTag}.candleCup`;
    candleCup.position.set(0.104, 0.054, 0);
    sconceGroup.add(candleCup);

    const warmBulb = new THREE.Mesh(
      prepGeo(new THREE.SphereGeometry(0.018, 14, 12)),
      mats.warmCandleBulb
    );
    warmBulb.scale.set(0.85, 1.45, 0.85);
    warmBulb.name = `familyBathroom.pleatedWallSconce.${sideTag}.candleLamp`;
    warmBulb.position.set(0.104, 0.095, 0);
    sconceGroup.add(warmBulb);

    // Gathered 44-pleat sage-celadon fabric empire shade (`Y = +0.045..+0.191m` above backplate!)
    const pleatedShade = new THREE.Mesh(pleatedShadeGeo, mats.pleatedSageShade);
    pleatedShade.name = `familyBathroom.pleatedWallSconce.${sideTag}.pleatedSageShade`;
    pleatedShade.position.set(0.104, 0.118, 0);
    pleatedShade.castShadow = true;
    pleatedShade.receiveShadow = true;
    sconceGroup.add(pleatedShade);

    const topRimRing = new THREE.Mesh(
      prepGeo(new THREE.TorusGeometry(0.046, 0.0022, 8, 28)),
      brBrass.primary
    );
    topRimRing.name = `familyBathroom.pleatedWallSconce.${sideTag}.topGimbalRing`;
    topRimRing.rotation.x = Math.PI * 0.5;
    topRimRing.position.set(0.104, 0.19, 0);
    sconceGroup.add(topRimRing);

    wallDecorGroup.add(sconceGroup);
  }

  return wallDecorGroup;
}

/**
 * Sculpted soft-draped honeycomb waffle-linen bathrobe hanging naturally from a brass robe hook.
 * Local `+X` points outward from the wall hook; rotate `Y = Math.PI` when mounted on a West-facing wall.
 */

/**
 * Builds the John Lewis `Micro-Fresh Extra Large Deep Pile Bath Mat` in `Linen` (`p4852123`,
 * Product Code `60029308`, `140 × 70 cm`, 100% cotton `~20mm` cut-tuft pile, square `90°` corners,
 * and signature `11cm`-inset sculpted/recessed rectangular border groove), laid at
 * `X = -12.22.. -11.52m, Z = -0.78..+0.62m` so `door-54` clears its SE corner cleanly!
 */
function buildDeepPileLinenBathMat(
  floorTopY: number,
  mats: HeritageVanityMaterialSuite
): THREE.Group {
  const matGroup = new THREE.Group();
  matGroup.name = 'familyBathroom.deepPileLinenBathMat';

  const {
    bathMatLengthZ,
    bathMatWidthX,
    bathMatWestEdgeX,
    bathMatNorthZ,
    bathMatBorderInset,
    bathMatThickness,
  } = HERITAGE_BREAKFRONT_SPEC;

  const matCenterX = bathMatWestEdgeX + bathMatWidthX * 0.5; // -11.870m
  const matCenterZ = bathMatNorthZ + bathMatLengthZ * 0.5; // -0.080m
  const halfX = bathMatWidthX * 0.5; // 0.350m
  const halfZ = bathMatLengthZ * 0.5; // 0.700m
  const cornerR = 0.008; // Crisp square 90° textile corners (8mm stitched cloth radius)

  // High-resolution `112 × 56` sculpted pile grid (~12.5mm spacing) capturing:
  // - Softly cushioned square-cornered cotton edge (0..18mm from edge, zero hard plastic box),
  // - Plush 11cm outer cut-tuft frame band,
  // - John Lewis signature 11cm-inset sculpted/recessed rectangular border groove (width ~24mm),
  // - Plush 20mm central cut-tuft field,
  // - Subtle pile compression below 8.5mm at the outermost SE corner triangle so `door-54`'s 10mm
  //   leaf undercut clears with >1.5mm vertical margin even mid-swing!
  const segZ = 112;
  const segX = 56;
  const stride = segX + 1;
  // Each vertex: [lx, y, lz, u, v, aoShade]
  const gridVerts: [number, number, number, number, number, number][] = [];

  // `door-54` East hinge in East-Wing local coords: (-10.995, +0.975), swing radius = 0.7203m
  const hingeLocalX = -10.995 - matCenterX;
  const hingeLocalZ = 0.975 - matCenterZ;

  for (let iz = 0; iz <= segZ; iz++) {
    const lzRaw = (iz / segZ - 0.5) * bathMatLengthZ;
    for (let ix = 0; ix <= segX; ix++) {
      const lxRaw = (ix / segX - 0.5) * bathMatWidthX;
      let lx = lxRaw;
      let lz = lzRaw;

      // Tiny 8mm cloth corner softening (square 90° silhouette)
      const qx = Math.abs(lx) - (halfX - cornerR);
      const qz = Math.abs(lz) - (halfZ - cornerR);
      if (qx > 0 && qz > 0) {
        const dc = Math.hypot(qx, qz);
        if (dc > cornerR) {
          const sc = cornerR / dc;
          lx = Math.sign(lx) * (halfX - cornerR + qx * sc);
          lz = Math.sign(lz) * (halfZ - cornerR + qz * sc);
        }
      }

      const dxEdge = halfX - Math.abs(lx);
      const dzEdge = halfZ - Math.abs(lz);
      const dRectEdge = Math.max(0, Math.min(dxEdge, dzEdge));

      // Base cushioned square-cornered pile envelope
      let y: number;
      let ao = 1.0;
      if (dRectEdge <= 0.0005) {
        y = 0.0008;
        ao = 0.88;
      } else if (dRectEdge < 0.022) {
        const t = dRectEdge / 0.022;
        const ease = Math.sin(t * Math.PI * 0.5);
        y = 0.0008 + (bathMatThickness * 0.94 - 0.0008) * Math.pow(ease, 0.72);
        ao = 0.9 + 0.1 * ease;
      } else {
        y = bathMatThickness;
      }

      // Signature 11cm-inset sculpted/recessed rectangular border groove (`dRectEdge = 0.11m`, width `26mm`)
      const grooveHalfW = 0.013;
      const distFromGroove = Math.abs(dRectEdge - bathMatBorderInset);
      if (distFromGroove < grooveHalfW) {
        const g = 0.5 + 0.5 * Math.cos((distFromGroove / grooveHalfW) * Math.PI);
        y -= 0.0115 * g; // Recessed ~11.5mm sculpted channel!
        ao -= 0.22 * g; // Crisp warm `#B8A994` taupe-stone shadow nestled in the 11cm inset channel!
      }

      // Organic 100% cotton cut-tuft micro-undulation across the pile
      if (dRectEdge > 0.008) {
        const tuftWave =
          0.0011 * Math.sin(lz * 62 + Math.cos(lx * 47) * 1.3) +
          0.0009 * Math.cos(lx * 68 - Math.sin(lz * 43) * 1.2);
        y += tuftWave * Math.min(1, dRectEdge / 0.024);
      }

      // Guarantee 100% 3D clearance under `door-54`'s 10mm leaf undercut (`R = 0.725m` around East hinge)
      const dHinge = Math.hypot(lx - hingeLocalX, lz - hingeLocalZ);
      if (dHinge < 0.745) {
        const blend = Math.max(0, Math.min(1, (dHinge - 0.715) / 0.03));
        const safeCap = 0.0082 + (bathMatThickness - 0.0082) * blend;
        y = Math.min(y, safeCap);
      }

      gridVerts.push([
        lx,
        Math.max(0.0008, y),
        lz,
        (lz + halfZ) * 1.45,
        (lx + halfX) * 1.45,
        ao,
      ]);
    }
  }

  const positions: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];

  const pushVert = (v: [number, number, number, number, number, number]): void => {
    positions.push(v[0], v[1], v[2]);
    uvs.push(v[3], v[4]);
    colors.push(v[5], v[5] * 0.99, v[5] * 0.97);
  };

  for (let iz = 0; iz < segZ; iz++) {
    for (let ix = 0; ix < segX; ix++) {
      const a = gridVerts[iz * stride + ix]!;
      const b = gridVerts[iz * stride + ix + 1]!;
      const c = gridVerts[(iz + 1) * stride + ix + 1]!;
      const d = gridVerts[(iz + 1) * stride + ix]!;

      pushVert(a);
      pushVert(d);
      pushVert(c);
      pushVert(a);
      pushVert(c);
      pushVert(b);
    }
  }

  const pileGeo = new THREE.BufferGeometry();
  pileGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  pileGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  pileGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  pileGeo.computeVertexNormals();
  pileGeo.computeBoundingBox();
  pileGeo.computeBoundingSphere();

  const pileMesh = new THREE.Mesh(pileGeo, mats.deepPileLinenBathMat);
  pileMesh.name = 'familyBathroom.deepPileLinenBathMat.tuftedPile';
  pileMesh.position.set(matCenterX, floorTopY, matCenterZ);
  pileMesh.castShadow = true;
  pileMesh.receiveShadow = true;
  matGroup.add(pileMesh);

  // Thin bound 100% cotton perimeter tape (`4mm` tall tucked under the cushioned outer skirt)
  const backingMesh = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(bathMatWidthX - 0.006, 0.0035, bathMatLengthZ - 0.006)),
    mats.deepPileLinenHem
  );
  backingMesh.name = 'familyBathroom.deepPileLinenBathMat.cottonBacking';
  backingMesh.position.set(matCenterX, floorTopY + 0.0018, matCenterZ);
  backingMesh.receiveShadow = true;
  matGroup.add(backingMesh);

  return matGroup;
}

function buildHangingWaffleBathrobe(
  namePrefix: string,
  robeMat: THREE.Material,
  collarTrimMat: THREE.Material
): THREE.Group {
  const group = new THREE.Group();
  group.name = namePrefix;

  const loopGeo = prepGeo(new THREE.TorusGeometry(0.024, 0.0055, 8, 18, Math.PI * 1.15));
  const loop = new THREE.Mesh(loopGeo, collarTrimMat);
  loop.name = `${namePrefix}.hangingLoop`;
  loop.rotation.y = Math.PI * 0.5;
  loop.position.set(-0.016, 0.006, 0);
  group.add(loop);

  const robeLen = WC_AND_ACCESSORY_SPEC.robeLength;
  const foldOffsets: readonly [string, number, number, number, number][] = [
    ['centerFold', 0.048, 0, 0.034, 0.048],
    ['northInnerFold', 0.044, -0.042, 0.028, 0.041],
    ['southInnerFold', 0.044, 0.042, 0.028, 0.041],
    ['northOuterFold', 0.036, -0.082, 0.024, 0.035],
    ['southOuterFold', 0.036, 0.082, 0.024, 0.035],
  ];
  for (const [fName, fx, fz, topR, botR] of foldOffsets) {
    const lobeGeo = prepGeo(new THREE.CylinderGeometry(topR, botR, robeLen, 14, 4));
    lobeGeo.scale(0.68, 1, 1.28);
    const lobe = new THREE.Mesh(lobeGeo, robeMat);
    lobe.name = `${namePrefix}.${fName}`;
    lobe.position.set(fx, -0.02 - robeLen * 0.5, fz * 1.12);
    lobe.rotation.x = fz * 0.36;
    lobe.castShadow = true;
    lobe.receiveShadow = true;
    group.add(lobe);
  }

  const lapelGeo = prepGeo(new THREE.CapsuleGeometry(0.019, 0.24, 6, 12));
  for (const [lName, side] of [
    ['northLapel', -1],
    ['southLapel', 1],
  ] as const) {
    const lapel = new THREE.Mesh(lapelGeo, collarTrimMat);
    lapel.name = `${namePrefix}.${lName}`;
    lapel.position.set(0.068, -0.17, side * 0.034);
    lapel.rotation.x = side * 0.16;
    lapel.rotation.z = 0.06;
    lapel.castShadow = true;
    group.add(lapel);
  }

  const sleeveGeo = prepGeo(new THREE.CylinderGeometry(0.026, 0.036, 0.5, 14));
  const cuffGeo = prepGeo(new THREE.CylinderGeometry(0.039, 0.038, 0.042, 14));
  for (const [sName, side] of [
    ['northSleeve', -1],
    ['southSleeve', 1],
  ] as const) {
    const sleeve = new THREE.Mesh(sleeveGeo, robeMat);
    sleeve.name = `${namePrefix}.${sName}`;
    sleeve.position.set(0.052, -0.35, side * 0.115);
    sleeve.rotation.x = side * 0.09;
    sleeve.castShadow = true;
    sleeve.receiveShadow = true;
    group.add(sleeve);

    const cuff = new THREE.Mesh(cuffGeo, collarTrimMat);
    cuff.name = `${namePrefix}.${sName}Cuff`;
    cuff.position.set(0.052, -0.585, side * 0.136);
    cuff.rotation.x = side * 0.09;
    group.add(cuff);
  }

  const beltBand = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.052, 0.054, 0.038, 16)),
    collarTrimMat
  );
  beltBand.scale.set(0.66, 1, 1.85);
  beltBand.name = `${namePrefix}.waistBelt`;
  beltBand.position.set(0.048, -0.48, 0);
  group.add(beltBand);

  const knot = new THREE.Mesh(prepGeo(new THREE.SphereGeometry(0.022, 12, 10)), collarTrimMat);
  knot.name = `${namePrefix}.beltKnot`;
  knot.position.set(0.078, -0.485, 0.012);
  group.add(knot);

  const tailGeo = prepGeo(new THREE.BoxGeometry(0.012, 0.28, 0.032));
  for (const [tIdx, tz, rotX] of [
    [1, -0.012, -0.08],
    [2, 0.028, 0.11],
  ] as const) {
    const tail = new THREE.Mesh(tailGeo, collarTrimMat);
    tail.name = `${namePrefix}.beltTail_${tIdx}`;
    tail.position.set(0.08, -0.62, tz);
    tail.rotation.x = rotX;
    group.add(tail);
  }

  return group;
}

/**
 * Builds Room 17 (`familyBathroom`) West-wall Heritage Breakfront Smoked Dark-Oak Single-Basin Vanity
 * (`1,460 × 505/555 × 880mm`, placed at `Z = -0.78..+0.68m` with `220mm` breathing gap to `Z = +0.90m`),
 * S-curve Grigio-Taupe marble upstand, arch-shouldered 5-reed champagne-brass mirror, twin boiserie
 * wall panels & pleated sage-celadon brass sconces, NE stepped-cistern WC with fumed dark-oak seat,
 * East-wall toilet roll holder, and `2×` bulkhead brass robe hooks with hanging waffle bathrobes.
 */
export function buildFamilyBathroomVanityAndToilet(
  scene: THREE.Group,
  kit: FamilyBathroomVanityAndToiletKit
): void {
  const { floorTopY } = kit;
  const brBrass = getBathroomBrassMaterials('BR');
  const chinaMat = getVitreousChinaMaterial();
  const textiles = getBathroomTextileMaterials();
  const heritageMats = getHeritageVanityMaterialSuite();

  scene.add(buildHeritageBreakfrontVanity(floorTopY, heritageMats, brBrass, chinaMat));
  scene.add(buildHeritageMirrorBoiserieAndSconces(floorTopY, heritageMats, brBrass));
  scene.add(buildDeepPileLinenBathMat(floorTopY, heritageMats));

  // NE Stepped-Cistern WC with straight-grained fumed English oak seat (Issue #3)
  const heritageVortexWc = buildLefroyBrooksCharterhouseWc({
    namePrefix: 'familyBathroom.gsiSwirlflushWc',
    finish: 'BR',
    variant: 'closeCoupled',
    collection: 'gsiClassicSwirlflush',
    seatFinish: 'darkOak',
    leverStyle: 'traditional',
  });
  heritageVortexWc.position.set(WC_AND_ACCESSORY_SPEC.wcX, floorTopY, WC_AND_ACCESSORY_SPEC.wcBackZ);
  heritageVortexWc.rotation.y = wallFacingToRotY('south');
  scene.add(heritageVortexWc);

  // Issue #4: Perrin & Rowe brass toilet roll holder mounted on `eastPanelling` at Y = 2.80m, Z = -1.55m!
  const paperHolder = buildArmstrongPaperHolder({
    namePrefix: 'familyBathroom.paperHolder',
    finish: 'BR',
    style: 'traditional',
  });
  paperHolder.position.set(
    WC_AND_ACCESSORY_SPEC.paperHolderX,
    WC_AND_ACCESSORY_SPEC.paperHolderY,
    WC_AND_ACCESSORY_SPEC.paperHolderZ
  );
  paperHolder.rotation.y = wallFacingToRotY('west');
  scene.add(paperHolder);

  // Crisp Wimborne White bevelled Shaker patress rail (`68mm` projection matching boxed dado below)
  // on the outside West face of the SE shower bulkhead (`Z = -0.60..-0.00m`, clear of door-54 swing!)
  const patressMat = new THREE.MeshStandardMaterial({
    name: 'familyBathroom.wimborneWhiteHookPatress',
    color: 0xf7f4ec,
    roughness: 0.34,
    metalness: 0.02,
  });
  const patressDepthX =
    ROOM17_OPTION1_PLANES.bulkheadOuterWestX - WC_AND_ACCESSORY_SPEC.robeHookPatressFaceX;
  const patressBoard = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(patressDepthX, 0.092, 0.58)),
    patressMat
  );
  patressBoard.name = 'familyBathroom.bulkheadRobeHookPatress';
  patressBoard.position.set(
    WC_AND_ACCESSORY_SPEC.robeHookPatressFaceX + patressDepthX * 0.5,
    WC_AND_ACCESSORY_SPEC.robeHookY,
    -0.3
  );
  patressBoard.castShadow = true;
  patressBoard.receiveShadow = true;
  scene.add(patressBoard);

  for (const [hookSuffix, hookZ] of WC_AND_ACCESSORY_SPEC.hooks) {
    const isNorth = hookSuffix === 'north';
    const robeMat = isNorth ? textiles.ivoryWaffleRobe : textiles.oatmealWaffleRobe;
    const trimMat = isNorth ? textiles.oatmealWaffleRobe : textiles.ivoryWaffleRobe;

    const robeHook = buildArmstrongRobeHook({
      namePrefix: `familyBathroom.robeHook.${hookSuffix}`,
      finish: 'BR',
      style: 'traditional',
    });
    robeHook.position.set(
      WC_AND_ACCESSORY_SPEC.robeHookPatressFaceX,
      WC_AND_ACCESSORY_SPEC.robeHookY,
      hookZ
    );
    robeHook.rotation.y = wallFacingToRotY('west');
    scene.add(robeHook);

    const hangingRobe = buildHangingWaffleBathrobe(
      `familyBathroom.hangingRobe.${hookSuffix}`,
      robeMat,
      trimMat
    );
    hangingRobe.position.set(
      WC_AND_ACCESSORY_SPEC.robeHookPatressFaceX - 0.022,
      WC_AND_ACCESSORY_SPEC.robeHookY,
      hookZ
    );
    hangingRobe.rotation.y = Math.PI;
    hangingRobe.rotation.z = -0.035;
    scene.add(hangingRobe);
  }
}
