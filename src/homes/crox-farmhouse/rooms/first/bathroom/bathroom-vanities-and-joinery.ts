import * as THREE from 'three';
import { EAST_WING_BATHROOM_VAULT } from '../../../structure/first-floor-materials.ts';
import {
  buildArmstrongDeck3HoleBasinMixer,
  buildArmstrongPaperHolder,
  buildArmstrongRobeHook,
  buildLefroyBrooksCharterhouseWc,
  getBathroomBrassMaterials,
  getBathroomTextileMaterials,
  getDarkOakVeneerMaterials,
  getHonedCarraraMarbleMaterial,
  getVitreousChinaMaterial,
  prepGeo,
  wallFacingToRotY,
} from '../../../../../objects/sanitaryware/index.ts';
import { ROOM17_BOXED_DADO, ROOM17_OPTION1_PLANES } from './bathroom-panelling-and-linings.ts';

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

const WEST_VANITY_SPEC = {
  wallX: ROOM17_OPTION1_PLANES.westWallX, // -12.81m
  northZ: ROOM17_OPTION1_PLANES.vanityNorthZ, // -0.70m
  southZ: ROOM17_OPTION1_PLANES.southWallZ, // +0.90m (1,600mm W)
  baseDepthX: 0.55, // X = -12.81 .. -12.26m
  counterDepthX: 0.56, // X = -12.81 .. -12.25m (10mm front overhang)
  baseHeight: 0.84, // Y = 2.160 .. 3.000m
  counterThick: 0.03, // Y = 3.000 .. 3.030m
  upstandHeight: 0.075, // Y = 3.030 .. 3.105m
  plinthHeight: 0.1, // Flush Shaker base plinth (0mm skirting overlap!)
  centerSinkBayW: 0.55, // Z = -0.175 .. +0.375m (centered at Z = +0.10m)
  drawerBankW: 0.525, // 2 × 525mm = 1,050mm clear counter wings & 6 wash-bag drawers
  upperDepthX: 0.3, // X = -12.81 .. -12.51m
  upperCupboardW: 0.4, // 2 × 400mm closed panelled cupboards flanking 800mm mirror
} as const;

const WC_AND_ACCESSORY_SPEC = {
  wcX: -10.18,
  wcBackZ: ROOM17_OPTION1_PLANES.northWallZ + ROOM17_BOXED_DADO.dadoShelfD, // -2.418m proud of 82mm North dado
  /** Issue #4: Toilet roll holder on `eastPanelling` at Y = 2.80m, Z = -1.55m! */
  paperHolderX: ROOM17_OPTION1_PLANES.eastWallX - ROOM17_BOXED_DADO.panelFaceD, // -9.868m
  paperHolderY: 2.8,
  paperHolderZ: -1.55,
  /** 2× 6921BR brass robe hooks + waffle robes on SE bulkhead outside West face (clear of door-54 swing). */
  robeHookPatressFaceX: ROOM17_OPTION1_PLANES.bulkheadOuterWestX - ROOM17_BOXED_DADO.panelFaceD, // -10.958m
  robeHookY: 3.82,
  robeLength: 1.06,
  hooks: [
    ['north', -0.46],
    ['south', -0.14],
  ] as const,
} as const;

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

  const cx = -10.21; // X = -10.62 .. -9.80m (width = 0.82m)
  const cabW = 0.82;
  const cabH = upperWallTopY - floorTopY; // 2.00m (2.160 .. 4.160m)
  const zBack = 0.602; // 2mm South of 0.600m dividing stud
  const zFront = 1.048; // 2mm North of 1.050m passage plane (0mm protrusion!)
  const cabD = zFront - zBack; // 0.446m
  const cz = (zBack + zFront) * 0.5; // 0.825m

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

  // 1. Oak carcass back, side cheeks, base plinth & top cornice header (Y <= upperWallTopY - 0.002m!)
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

  // 2. Slimline 385mm-deep under-counter hotel beverage cooler (`Z = 0.635..1.020m`)
  const coolerGroup = new THREE.Group();
  coolerGroup.name = 'familyBathroom.drinksCabinet.wineCooler';
  const coolerW = 0.758;
  const coolerH = 0.79;
  const coolerY0 = floorTopY + 0.08;
  const coolerBackZ = zBack + backThick + 0.01; // 0.634m
  const coolerFrontZ = 1.02;
  const coolerD = coolerFrontZ - coolerBackZ; // 0.386m
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

  // Chilled champagne, San Pellegrino, Fiji water & Dash cans sized cleanly for 385mm slimline cooler
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

  // Glazed cooler door (`Z = 1.018m`)
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

  // 3. Countertop (`Y = 3.030..3.058m`, `Z = 0.624..1.044m`), compact Nespresso machine & lit upper shelves
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

  // Compact Nespresso machine (`240mm` deep so plenty of front workspace on 420mm counter!)
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

  // Hospitality tray with 2 porcelain cups & saucers
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

  // 2 warm-LED-lit oak & brass-gallery upper glassware shelves (`Z = 0.624..0.904m` = 280mm D)
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
 * Builds an in-frame Shaker dark-oak panel (4 surround stiles/rails + recessed center panel)
 * on the `+X` face of a West-wall cabinet.
 */
function addEastFacingShakerFront(
  parent: THREE.Group,
  namePrefix: string,
  frontFaceX: number,
  centerY: number,
  centerZ: number,
  height: number,
  widthZ: number,
  darkOak: ReturnType<typeof getDarkOakVeneerMaterials>
): void {
  const frameT = 0.018;
  const panelT = 0.01;
  const stileW = Math.min(0.056, widthZ * 0.16);
  const railH = Math.min(0.056, height * 0.22);
  const innerW = Math.max(0.04, widthZ - stileW * 2);
  const innerH = Math.max(0.04, height - railH * 2);

  const panel = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(panelT, innerH + 0.008, innerW + 0.008)),
    darkOak.panelField
  );
  panel.name = `${namePrefix}.panel`;
  panel.position.set(frontFaceX - frameT + panelT * 0.5, centerY, centerZ);
  panel.castShadow = true;
  panel.receiveShadow = true;
  parent.add(panel);

  for (const [tag, zOff] of [
    ['northStile', -(widthZ * 0.5 - stileW * 0.5)],
    ['southStile', widthZ * 0.5 - stileW * 0.5],
  ] as const) {
    const stile = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(frameT, height, stileW)),
      darkOak.veneer
    );
    stile.name = `${namePrefix}.${tag}`;
    stile.position.set(frontFaceX - frameT * 0.5, centerY, centerZ + zOff);
    stile.castShadow = true;
    stile.receiveShadow = true;
    parent.add(stile);
  }

  for (const [tag, yOff] of [
    ['topRail', height * 0.5 - railH * 0.5],
    ['bottomRail', -(height * 0.5 - railH * 0.5)],
  ] as const) {
    const rail = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(frameT, railH, innerW)),
      darkOak.veneer
    );
    rail.name = `${namePrefix}.${tag}`;
    rail.position.set(frontFaceX - frameT * 0.5, centerY + yOff, centerZ);
    rail.castShadow = true;
    rail.receiveShadow = true;
    parent.add(rail);
  }
}

function addBrassCupPull(
  parent: THREE.Group,
  namePrefix: string,
  frontFaceX: number,
  y: number,
  z: number,
  brBrass: ReturnType<typeof getBathroomBrassMaterials>
): void {
  const backplate = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.004, 0.032, 0.096)),
    brBrass.primary
  );
  backplate.name = `${namePrefix}.backplate`;
  backplate.position.set(frontFaceX + 0.002, y, z);
  parent.add(backplate);

  const hood = new THREE.Mesh(
    prepGeo(
      new THREE.CylinderGeometry(0.015, 0.015, 0.078, 16, 1, false, 0, Math.PI)
    ),
    brBrass.primary
  );
  hood.name = `${namePrefix}.cupHood`;
  hood.rotation.x = Math.PI * 0.5;
  hood.position.set(frontFaceX + 0.004, y - 0.002, z);
  hood.castShadow = true;
  parent.add(hood);
}

function addBrassTurnedKnob(
  parent: THREE.Group,
  namePrefix: string,
  frontFaceX: number,
  y: number,
  z: number,
  brBrass: ReturnType<typeof getBathroomBrassMaterials>
): void {
  const rose = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.015, 0.016, 0.004, 16)),
    brBrass.primary
  );
  rose.name = `${namePrefix}.rose`;
  rose.rotation.z = Math.PI * 0.5;
  rose.position.set(frontFaceX + 0.002, y, z);
  parent.add(rose);

  const stem = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.006, 0.008, 0.014, 14)),
    brBrass.primary
  );
  stem.name = `${namePrefix}.stem`;
  stem.rotation.z = Math.PI * 0.5;
  stem.position.set(frontFaceX + 0.01, y, z);
  parent.add(stem);

  const ball = new THREE.Mesh(
    prepGeo(new THREE.SphereGeometry(0.014, 16, 12)),
    brBrass.primary
  );
  ball.name = `${namePrefix}.knob`;
  ball.scale.set(0.76, 1, 1);
  ball.position.set(frontFaceX + 0.022, y, z);
  ball.castShadow = true;
  parent.add(ball);
}

/**
 * Builds the Option 1 West-Wall `1,600 × 550mm` "Max Counter & Drawers" Single-Basin Smoked Dark-Oak Vanity
 * (`X = -12.81..-12.26m, Z = -0.70..+0.90m`, facing East — Fixes Issue #1):
 * - Flush dark-oak base plinth (`0mm` skirting overlap)
 * - Central `550mm` 2-door under-sink cupboard + two flanking `525mm` 3-drawer wash-bag banks (`6` drawers total)
 * - `1,600 × 560 × 30mm` Honed Bianco Carrara marble countertop (`1,050mm` clear counter wings) + `75mm` splashback
 * - Central `550 × 400mm` white vitreous-china oval undermount basin + Perrin & Rowe `3705BR` 3-hole brass mixer.
 */
function buildWestWallDarkOakBaseVanity(
  floorTopY: number,
  darkOak: ReturnType<typeof getDarkOakVeneerMaterials>,
  brBrass: ReturnType<typeof getBathroomBrassMaterials>,
  carraraMat: THREE.Material,
  chinaMat: THREE.Material,
  textiles: ReturnType<typeof getBathroomTextileMaterials>
): {
  readonly vanityGroup: THREE.Group;
  readonly counterTopY: number;
} {
  const vanityGroup = new THREE.Group();
  vanityGroup.name = 'familyBathroom.darkOakVanityUnit';

  const {
    wallX,
    northZ,
    southZ,
    baseDepthX,
    counterDepthX,
    baseHeight,
    counterThick,
    upstandHeight,
    plinthHeight,
    centerSinkBayW,
    drawerBankW,
  } = WEST_VANITY_SPEC;

  const vanityW = southZ - northZ; // 1.60m
  const vanityCz = (northZ + southZ) * 0.5; // +0.10m
  const baseFrontX = wallX + baseDepthX; // -12.26m
  const baseCx = wallX + baseDepthX * 0.5;
  const counterBotY = floorTopY + baseHeight; // 3.000m
  const counterTopY = counterBotY + counterThick; // 3.030m

  // 1. Flush dark-oak Shaker base plinth (`Y = 2.160..2.260m`, front face flush at X = -12.26m!)
  const plinth = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(baseDepthX, plinthHeight, vanityW)),
    darkOak.veneer
  );
  plinth.name = 'familyBathroom.darkOakVanityUnit.flushBasePlinth';
  plinth.position.set(baseCx, floorTopY + plinthHeight * 0.5, vanityCz);
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  vanityGroup.add(plinth);

  // 2. Main smoked dark-oak carcass (`Y = 2.260..3.000m`) + solid outer North & South cheeks
  //    (receiving West & South-West boxed panelling & skirtings 0.0mm squarely!)
  const bodyH = baseHeight - plinthHeight; // 0.74m
  const bodyMidY = floorTopY + plinthHeight + bodyH * 0.5;
  const carcass = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(baseDepthX - 0.018, bodyH, vanityW - 0.004)),
    darkOak.veneer
  );
  carcass.name = 'familyBathroom.darkOakVanityUnit.carcass';
  carcass.position.set(wallX + (baseDepthX - 0.018) * 0.5, bodyMidY, vanityCz);
  carcass.castShadow = true;
  carcass.receiveShadow = true;
  vanityGroup.add(carcass);

  const cheekT = 0.028;
  for (const [tag, cz] of [
    ['northOuterCheek', northZ + cheekT * 0.5],
    ['southOuterCheek', southZ - cheekT * 0.5],
  ] as const) {
    const cheek = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(baseDepthX, baseHeight, cheekT)),
      darkOak.veneer
    );
    cheek.name = `familyBathroom.darkOakVanityUnit.${tag}`;
    cheek.position.set(baseCx, floorTopY + baseHeight * 0.5, cz);
    cheek.castShadow = true;
    cheek.receiveShadow = true;
    vanityGroup.add(cheek);
  }

  // Face-frame outer & intermediate vertical stiles + top & bottom rails along `baseFrontX = -12.26m`
  const frameDepthX = 0.02;
  const frameStileW = 0.036;
  const frameRailH = 0.036;
  const sinkNorthDivZ = vanityCz - centerSinkBayW * 0.5; // -0.175m
  const sinkSouthDivZ = vanityCz + centerSinkBayW * 0.5; // +0.375m

  for (const [sTag, sz] of [
    ['northFrameStile', northZ + frameStileW * 0.5],
    ['sinkNorthDividerStile', sinkNorthDivZ],
    ['sinkSouthDividerStile', sinkSouthDivZ],
    ['southFrameStile', southZ - frameStileW * 0.5],
  ] as const) {
    const st = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(frameDepthX, bodyH, frameStileW)),
      darkOak.veneer
    );
    st.name = `familyBathroom.darkOakVanityUnit.${sTag}`;
    st.position.set(baseFrontX - frameDepthX * 0.5, bodyMidY, sz);
    st.castShadow = true;
    vanityGroup.add(st);
  }

  for (const [rTag, ry] of [
    ['topFrameRail', counterBotY - frameRailH * 0.5],
    ['bottomFrameRail', floorTopY + plinthHeight + frameRailH * 0.5],
  ] as const) {
    const rl = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(frameDepthX, frameRailH, vanityW)),
      darkOak.veneer
    );
    rl.name = `familyBathroom.darkOakVanityUnit.${rTag}`;
    rl.position.set(baseFrontX - frameDepthX * 0.5, ry, vanityCz);
    rl.castShadow = true;
    vanityGroup.add(rl);
  }

  // 3. Central 550mm 2-door under-sink cupboard (`Z = -0.175..+0.375m`)
  const clearInnerY0 = floorTopY + plinthHeight + frameRailH;
  const clearInnerY1 = counterBotY - frameRailH;
  const clearInnerH = clearInnerY1 - clearInnerY0; // 0.668m
  const sinkClearW = centerSinkBayW - frameStileW; // 0.514m
  const singleSinkDoorW = (sinkClearW - 0.01) * 0.5;
  const sinkDoorH = clearInnerH - 0.008;
  const sinkDoorCy = (clearInnerY0 + clearInnerY1) * 0.5;

  for (const [dIdx, zSign] of ([-1, 1] as const).entries()) {
    const doorCz = vanityCz + zSign * (singleSinkDoorW * 0.5 + 0.0025);
    const dPrefix = `familyBathroom.darkOakVanityUnit.sinkDoor_${dIdx + 1}`;
    addEastFacingShakerFront(
      vanityGroup,
      dPrefix,
      baseFrontX - 0.002,
      sinkDoorCy,
      doorCz,
      sinkDoorH,
      singleSinkDoorW,
      darkOak
    );
    addBrassTurnedKnob(
      vanityGroup,
      `${dPrefix}.knob`,
      baseFrontX - 0.002,
      sinkDoorCy + sinkDoorH * 0.28,
      vanityCz + zSign * 0.036,
      brBrass
    );
  }

  // 4. Two flanking 525mm banks of 3 deep full-extension wash-bag drawers (6 drawers total!)
  const drawerRailH = 0.022;
  const totalDrawerH = clearInnerH - drawerRailH * 2;
  const topDrawerH = totalDrawerH * 0.28;
  const midDrawerH = totalDrawerH * 0.35;
  const botDrawerH = totalDrawerH * 0.37;
  const drawerSpecs = [
    ['bottomWashBagDrawer', clearInnerY0 + botDrawerH * 0.5, botDrawerH - 0.006],
    [
      'middleWashBagDrawer',
      clearInnerY0 + botDrawerH + drawerRailH + midDrawerH * 0.5,
      midDrawerH - 0.006,
    ],
    ['topVanityDrawer', clearInnerY1 - topDrawerH * 0.5, topDrawerH - 0.006],
  ] as const;

  for (const [bankTag, bankZ0, bankZ1] of [
    ['northBank', northZ + frameStileW, sinkNorthDivZ - frameStileW * 0.5],
    ['southBank', sinkSouthDivZ + frameStileW * 0.5, southZ - frameStileW],
  ] as const) {
    const bankCz = (bankZ0 + bankZ1) * 0.5;
    const bankClearW = bankZ1 - bankZ0;

    for (const [rIdx, divY] of [
      clearInnerY0 + botDrawerH + drawerRailH * 0.5,
      clearInnerY0 + botDrawerH + drawerRailH + midDrawerH + drawerRailH * 0.5,
    ].entries()) {
      const divRail = new THREE.Mesh(
        prepGeo(new THREE.BoxGeometry(frameDepthX, drawerRailH, bankClearW)),
        darkOak.veneer
      );
      divRail.name = `familyBathroom.darkOakVanityUnit.${bankTag}.dividerRail_${rIdx + 1}`;
      divRail.position.set(baseFrontX - frameDepthX * 0.5, divY, bankCz);
      vanityGroup.add(divRail);
    }

    for (const [drTag, drCy, drH] of drawerSpecs) {
      const drPrefix = `familyBathroom.darkOakVanityUnit.${bankTag}.${drTag}`;
      addEastFacingShakerFront(
        vanityGroup,
        drPrefix,
        baseFrontX - 0.002,
        drCy,
        bankCz,
        drH,
        bankClearW - 0.006,
        darkOak
      );
      addBrassCupPull(
        vanityGroup,
        `${drPrefix}.cupPull`,
        baseFrontX - 0.002,
        drCy + 0.006,
        bankCz,
        brBrass
      );
    }
  }

  // 5. Honed Bianco Carrara Marble Countertop (`1,600 × 560 × 30mm`) with oval basin cutout + 75mm upstands
  //    In Shape coordinates (x, y) before rotateX(-PI/2): local x = world X, local y = -world Z!
  const basinWAlongZ = 0.52;
  const basinDAlongX = 0.37;
  const basinCenterX = wallX + 0.3; // -12.51m (26cm from front lip, leaving 21cm rear tap deck)
  const basinCenterZ = vanityCz; // +0.10m

  const slabShape = new THREE.Shape();
  slabShape.moveTo(wallX, -southZ);
  slabShape.lineTo(wallX + counterDepthX, -southZ);
  slabShape.lineTo(wallX + counterDepthX, -northZ);
  slabShape.lineTo(wallX, -northZ);
  slabShape.closePath();

  const basinHole = new THREE.Path();
  basinHole.absellipse(
    basinCenterX,
    -basinCenterZ,
    basinDAlongX * 0.5,
    basinWAlongZ * 0.5,
    0,
    Math.PI * 2,
    false,
    0
  );
  slabShape.holes.push(basinHole);

  const slabGeo = prepGeo(
    new THREE.ExtrudeGeometry(slabShape, {
      depth: counterThick,
      bevelEnabled: true,
      bevelThickness: 0.003,
      bevelSize: 0.002,
      bevelSegments: 2,
      curveSegments: 32,
    })
  );
  slabGeo.rotateX(-Math.PI * 0.5);
  const marbleSlab = new THREE.Mesh(slabGeo, carraraMat);
  marbleSlab.name = 'familyBathroom.darkOakVanityUnit.carraraCountertop';
  marbleSlab.position.set(0, counterBotY, 0);
  marbleSlab.castShadow = true;
  marbleSlab.receiveShadow = true;
  vanityGroup.add(marbleSlab);

  // Rear & South 75mm Carrara splashbacks (`Y = 3.030..3.105m`)
  const rearUpstand = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.02, upstandHeight, vanityW)),
    carraraMat
  );
  rearUpstand.name = 'familyBathroom.darkOakVanityUnit.carraraRearUpstand';
  rearUpstand.position.set(wallX + 0.01, counterTopY + upstandHeight * 0.5, vanityCz);
  rearUpstand.castShadow = true;
  vanityGroup.add(rearUpstand);

  const southUpstand = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(counterDepthX - 0.02, upstandHeight, 0.02)),
    carraraMat
  );
  southUpstand.name = 'familyBathroom.darkOakVanityUnit.carraraSouthUpstand';
  southUpstand.position.set(
    wallX + 0.02 + (counterDepthX - 0.02) * 0.5,
    counterTopY + upstandHeight * 0.5,
    southZ - 0.01
  );
  southUpstand.castShadow = true;
  vanityGroup.add(southUpstand);

  // 6. Central 550 × 400mm glazed white vitreous-china oval undermount basin + P&R 3705BR 3-hole brass mixer
  const bowlDepth = 0.175;
  const bowlOuter = new THREE.Mesh(
    prepGeo(
      new THREE.CylinderGeometry(
        basinDAlongX * 0.52,
        basinDAlongX * 0.36,
        bowlDepth,
        32,
        1,
        true
      )
    ),
    chinaMat
  );
  bowlOuter.scale.set(1, 1, basinWAlongZ / basinDAlongX);
  bowlOuter.name = 'familyBathroom.darkOakVanityUnit.undermountBasin.walls';
  bowlOuter.position.set(basinCenterX, counterBotY - bowlDepth * 0.5 + 0.004, basinCenterZ);
  vanityGroup.add(bowlOuter);

  const bowlFloor = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(basinDAlongX * 0.37, basinDAlongX * 0.35, 0.016, 32)),
    chinaMat
  );
  bowlFloor.scale.set(1, 1, basinWAlongZ / basinDAlongX);
  bowlFloor.name = 'familyBathroom.darkOakVanityUnit.undermountBasin.floor';
  bowlFloor.position.set(basinCenterX, counterBotY - bowlDepth + 0.008, basinCenterZ);
  bowlFloor.receiveShadow = true;
  vanityGroup.add(bowlFloor);

  const basinWaste = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.032, 0.03, 0.006, 20)),
    brBrass.primary
  );
  basinWaste.name = 'familyBathroom.darkOakVanityUnit.undermountBasin.brassWaste';
  basinWaste.position.set(basinCenterX, counterBotY - bowlDepth + 0.018, basinCenterZ);
  vanityGroup.add(basinWaste);

  const basinMixer = buildArmstrongDeck3HoleBasinMixer({
    namePrefix: 'familyBathroom.darkOakVanityUnit.basinMixer3705BR',
    finish: 'BR',
    style: 'traditional',
    valveSpreadM: 0.2,
  });
  basinMixer.position.set(wallX + 0.095, counterTopY, basinCenterZ);
  basinMixer.rotation.y = wallFacingToRotY('east');
  vanityGroup.add(basinMixer);

  // Subtle styling on the generous 525mm North/South marble counter wings (`drawerBankW = 0.525m` each)
  const northWingCz = northZ + drawerBankW * 0.5;
  const southWingCz = southZ - drawerBankW * 0.5;
  const soapDispenser = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.034, 0.038, 0.13, 18)),
    chinaMat
  );
  soapDispenser.name = 'familyBathroom.darkOakVanityUnit.countertopSoapDispenser';
  soapDispenser.position.set(wallX + 0.19, counterTopY + 0.065, northWingCz + 0.08);
  soapDispenser.castShadow = true;
  vanityGroup.add(soapDispenser);

  const soapPump = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.01, 0.012, 0.032, 14)),
    brBrass.primary
  );
  soapPump.name = 'familyBathroom.darkOakVanityUnit.countertopSoapDispenser.pump';
  soapPump.position.set(wallX + 0.19, counterTopY + 0.146, northWingCz + 0.08);
  vanityGroup.add(soapPump);

  const handTowel = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.22, 0.028, 0.15)),
    textiles.ivoryWaffleRobe
  );
  handTowel.name = 'familyBathroom.darkOakVanityUnit.foldedHandTowel';
  handTowel.position.set(wallX + 0.28, counterTopY + 0.014, southWingCz - 0.04);
  handTowel.castShadow = true;
  vanityGroup.add(handTowel);

  return { vanityGroup, counterTopY };
}

/**
 * Builds the Option 1 Countertop-to-Ceiling Smoked Dark-Oak Upper Apothecary Joinery (`Y = 3.030..4.650m`):
 * - Two `400mm W × 300mm D` closed panelled dark-oak apothecary cupboards (`North Z = -0.70..-0.30m`
 *   and `South Z = +0.50..+0.90m`) with Polished Brass (`BR`) knobs
 * - Central `800mm`-wide (`Z = -0.30..+0.50m`) bevelled silver mirror with Unlacquered Brass bead,
 *   warm `2700K` LED soffit wash, and twin warm IP44 Polished Brass & opal-glass sconces!
 */
function buildWestWallUpperApothecaryJoinery(
  counterTopY: number,
  collarCeilingY: number,
  darkOak: ReturnType<typeof getDarkOakVeneerMaterials>,
  brBrass: ReturnType<typeof getBathroomBrassMaterials>
): THREE.Group {
  const upperJoinery = new THREE.Group();
  upperJoinery.name = 'familyBathroom.vanityFullHeightJoinery';

  const { wallX, northZ, southZ, upstandHeight, upperDepthX, upperCupboardW } = WEST_VANITY_SPEC;
  const joineryW = southZ - northZ; // 1.60m
  const joineryCz = (northZ + southZ) * 0.5; // +0.10m
  const upperFrontX = wallX + upperDepthX; // -12.51m
  const upperCx = wallX + upperDepthX * 0.5;
  const corniceTotalH = 0.072;
  const bodyTopY = collarCeilingY - corniceTotalH; // 4.578m
  const bodyH = bodyTopY - counterTopY;
  const bodyMidY = counterTopY + bodyH * 0.5;

  // 1. Two 400mm W × 300mm D closed panelled dark-oak apothecary cupboards (North & South)
  for (const [sideTag, z0, z1, knobTowardMirrorSign] of [
    ['northCupboard', northZ, northZ + upperCupboardW, 1],
    ['southCupboard', southZ - upperCupboardW, southZ, -1],
  ] as const) {
    const cupW = z1 - z0; // 0.40m
    const cupCz = (z0 + z1) * 0.5;

    const cupCarcass = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(upperDepthX - 0.018, bodyH, cupW)),
      darkOak.veneer
    );
    cupCarcass.name = `familyBathroom.vanityFullHeightJoinery.${sideTag}.carcass`;
    cupCarcass.position.set(wallX + (upperDepthX - 0.018) * 0.5, bodyMidY, cupCz);
    cupCarcass.castShadow = true;
    cupCarcass.receiveShadow = true;
    upperJoinery.add(cupCarcass);

    // Solid outer cheek (at Z = -0.70m and Z = +0.90m) so West & South-West dado rails butt 0.0mm flush!
    const outerCheekZ = sideTag === 'northCupboard' ? z0 + 0.014 : z1 - 0.014;
    const outerCheek = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(upperDepthX, bodyH + corniceTotalH, 0.028)),
      darkOak.veneer
    );
    outerCheek.name = `familyBathroom.vanityFullHeightJoinery.${sideTag}.outerCheek`;
    outerCheek.position.set(upperCx, counterTopY + (bodyH + corniceTotalH) * 0.5, outerCheekZ);
    outerCheek.castShadow = true;
    outerCheek.receiveShadow = true;
    upperJoinery.add(outerCheek);

    // Inner pilaster stile facing the 800mm central mirror bay
    const innerCheekZ = sideTag === 'northCupboard' ? z1 - 0.014 : z0 + 0.014;
    const innerCheek = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(upperDepthX, bodyH, 0.028)),
      darkOak.veneer
    );
    innerCheek.name = `familyBathroom.vanityFullHeightJoinery.${sideTag}.innerCheek`;
    innerCheek.position.set(upperCx, bodyMidY, innerCheekZ);
    innerCheek.castShadow = true;
    upperJoinery.add(innerCheek);

    // Closed panelled dark-oak Shaker cupboard door (`H = bodyH - 0.048m`) with Polished Brass knob
    const doorBotY = counterTopY + 0.024;
    const doorTopY = bodyTopY - 0.024;
    const doorH = doorTopY - doorBotY;
    const doorCy = (doorBotY + doorTopY) * 0.5;
    const doorW = cupW - 0.056;
    const doorPrefix = `familyBathroom.vanityFullHeightJoinery.${sideTag}.panelledDoor`;
    addEastFacingShakerFront(
      upperJoinery,
      doorPrefix,
      upperFrontX - 0.002,
      doorCy,
      cupCz,
      doorH,
      doorW,
      darkOak
    );
    addBrassTurnedKnob(
      upperJoinery,
      `${doorPrefix}.knob`,
      upperFrontX - 0.002,
      counterTopY + 0.34,
      cupCz + knobTowardMirrorSign * (doorW * 0.5 - 0.036),
      brBrass
    );
  }

  // 2. Central 800mm Bevelled Mirror Bay (`Z = -0.30..+0.50m`) + dark-oak soffit canopy + warm IP44 brass sconces
  const mirrorNorthZ = northZ + upperCupboardW; // -0.30m
  const mirrorSouthZ = southZ - upperCupboardW; // +0.50m
  const mirrorBayW = mirrorSouthZ - mirrorNorthZ; // 0.80m
  const mirrorBayCz = (mirrorNorthZ + mirrorSouthZ) * 0.5; // +0.10m

  const mirrorBackPanel = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.022, bodyH - upstandHeight, mirrorBayW)),
    darkOak.veneer
  );
  mirrorBackPanel.name = 'familyBathroom.vanityFullHeightJoinery.mirrorBackPanel';
  mirrorBackPanel.position.set(
    wallX + 0.011,
    counterTopY + upstandHeight + (bodyH - upstandHeight) * 0.5,
    mirrorBayCz
  );
  upperJoinery.add(mirrorBackPanel);

  // Overhead canopy soffit bridging the two 300mm cupboards above the mirror (`Y = 4.42..4.578m`)
  const soffitBotY = bodyTopY - 0.14;
  const soffitBox = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(upperDepthX, bodyTopY - soffitBotY, mirrorBayW)),
    darkOak.veneer
  );
  soffitBox.name = 'familyBathroom.vanityFullHeightJoinery.mirrorCanopySoffit';
  soffitBox.position.set(upperCx, (soffitBotY + bodyTopY) * 0.5, mirrorBayCz);
  soffitBox.castShadow = true;
  upperJoinery.add(soffitBox);

  // Brass-beaded bevelled silver mirror (`620mm W × 1,160mm H`, centered between twin IP44 brass sconces!)
  const mirrorW = 0.6;
  const mirrorBotY = counterTopY + upstandHeight + 0.055; // 3.160m
  const mirrorTopY = soffitBotY - 0.055; // 4.368m
  const mirrorH = mirrorTopY - mirrorBotY;
  const mirrorCy = (mirrorBotY + mirrorTopY) * 0.5;
  const mirrorX = wallX + 0.032;

  const brassFrame = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.012, mirrorH + 0.02, mirrorW + 0.02)),
    brBrass.primary
  );
  brassFrame.name = 'familyBathroom.vanityFullHeightJoinery.mirrorBrassBeadFrame';
  brassFrame.position.set(mirrorX, mirrorCy, mirrorBayCz);
  upperJoinery.add(brassFrame);

  const silverMirrorMat = new THREE.MeshPhysicalMaterial({
    name: 'familyBathroom.bevelledMirrorSilver',
    color: 0xf4f6f8,
    metalness: 0.96,
    roughness: 0.04,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
  });
  const mirrorGlass = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.008, mirrorH, mirrorW)),
    silverMirrorMat
  );
  mirrorGlass.name = 'familyBathroom.vanityFullHeightJoinery.bevelledMirror';
  mirrorGlass.position.set(mirrorX + 0.004, mirrorCy, mirrorBayCz);
  upperJoinery.add(mirrorGlass);

  // Concealed warm 2700K LED soffit downlight strip over the mirror
  const warmGlowMat = new THREE.MeshStandardMaterial({
    color: 0xffebd0,
    emissive: new THREE.Color(0xffc978),
    emissiveIntensity: 1.8,
    roughness: 0.2,
  });
  const soffitLed = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.016, 0.005, mirrorBayW - 0.08)),
    warmGlowMat
  );
  soffitLed.name = 'familyBathroom.vanityFullHeightJoinery.mirrorSoffitLight';
  soffitLed.position.set(wallX + upperDepthX * 0.62, soffitBotY - 0.002, mirrorBayCz);
  upperJoinery.add(soffitLed);

  // Twin warm IP44 Polished Brass & frosted opal-glass wall sconces mounted on the mirror bay side stiles!
  const opalShadeMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e4,
    emissive: new THREE.Color(0xffcf87),
    emissiveIntensity: 1.35,
    roughness: 0.32,
    metalness: 0.0,
  });
  for (const [scTag, scZ] of [
    ['northSconce', mirrorNorthZ + 0.052],
    ['southSconce', mirrorSouthZ - 0.052],
  ] as const) {
    const sconceY = 3.82;
    const sconceGroup = new THREE.Group();
    sconceGroup.name = `familyBathroom.vanityFullHeightJoinery.${scTag}`;
    sconceGroup.position.set(wallX + 0.022, sconceY, scZ);

    const wallRose = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.032, 0.034, 0.012, 20)),
      brBrass.primary
    );
    wallRose.name = `familyBathroom.vanityFullHeightJoinery.${scTag}.rose`;
    wallRose.rotation.z = Math.PI * 0.5;
    wallRose.position.set(0.006, 0, 0);
    sconceGroup.add(wallRose);

    const arm = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.007, 0.007, 0.075, 14)),
      brBrass.primary
    );
    arm.name = `familyBathroom.vanityFullHeightJoinery.${scTag}.arm`;
    arm.rotation.z = Math.PI * 0.5;
    arm.position.set(0.044, 0, 0);
    sconceGroup.add(arm);

    const holderCup = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.022, 0.014, 0.024, 18)),
      brBrass.primary
    );
    holderCup.name = `familyBathroom.vanityFullHeightJoinery.${scTag}.gallery`;
    holderCup.position.set(0.08, 0.006, 0);
    sconceGroup.add(holderCup);

    const opalShade = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.026, 0.036, 0.145, 20)),
      opalShadeMat
    );
    opalShade.name = `familyBathroom.vanityFullHeightJoinery.${scTag}.opalShade`;
    opalShade.position.set(0.08, 0.088, 0);
    sconceGroup.add(opalShade);

    upperJoinery.add(sconceGroup);
  }

  // 3. Full-width stepped dark-oak frieze & moulded crown cornice (`Y = 4.578..4.650m`)
  const corniceFrieze = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(upperDepthX + 0.014, 0.048, joineryW)),
    darkOak.veneer
  );
  corniceFrieze.name = 'familyBathroom.vanityFullHeightJoinery.crownFrieze';
  corniceFrieze.position.set(
    wallX + (upperDepthX + 0.014) * 0.5,
    collarCeilingY - 0.048,
    joineryCz
  );
  corniceFrieze.castShadow = true;
  upperJoinery.add(corniceFrieze);

  const corniceCrown = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(upperDepthX + 0.032, 0.024, joineryW + 0.016)),
    darkOak.veneer
  );
  corniceCrown.name = 'familyBathroom.vanityFullHeightJoinery.crownCornice';
  corniceCrown.position.set(
    wallX + (upperDepthX + 0.032) * 0.5,
    collarCeilingY - 0.012,
    joineryCz
  );
  corniceCrown.castShadow = true;
  upperJoinery.add(corniceCrown);

  return upperJoinery;
}

/**
 * Sculpted soft-draped honeycomb waffle-linen bathrobe hanging naturally from a brass robe hook.
 * Local `+X` points outward from the wall hook; rotate `Y = Math.PI` when mounted on a West-facing wall.
 */
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
 * Builds Room 17 (`familyBathroom`, Option 1) West-wall `1,600 × 550mm` dark-oak single-basin vanity,
 * countertop-to-ceiling apothecary cupboards & bevelled mirror joinery, NE stepped-cistern WC with
 * straight-grained dark-oak seat (`#3`), East-wall toilet roll holder (`#4`), and `2×` brass robe hooks
 * with hanging waffle bathrobes on the outside West cheek of the SE shower bulkhead.
 */
export function buildFamilyBathroomVanityAndToilet(
  scene: THREE.Group,
  kit: FamilyBathroomVanityAndToiletKit
): void {
  const { floorTopY } = kit;
  const brBrass = getBathroomBrassMaterials('BR');
  const darkOak = getDarkOakVeneerMaterials();
  const carraraMat = getHonedCarraraMarbleMaterial();
  const chinaMat = getVitreousChinaMaterial();
  const textiles = getBathroomTextileMaterials();

  const collarCeilingY =
    EAST_WING_BATHROOM_VAULT.collarCeilingY + EAST_WING_BATHROOM_VAULT.ceilingClearance + 0.001;

  const { vanityGroup, counterTopY } = buildWestWallDarkOakBaseVanity(
    floorTopY,
    darkOak,
    brBrass,
    carraraMat,
    chinaMat,
    textiles
  );
  scene.add(vanityGroup);

  const upperJoinery = buildWestWallUpperApothecaryJoinery(
    counterTopY,
    collarCeilingY,
    darkOak,
    brBrass
  );
  scene.add(upperJoinery);

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
