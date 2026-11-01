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
 * Builds the bespoke recessed oak Hotel Drinks & Refreshment Cabinet in the Upper South Passage alcove
 * (`X = -10.62m..-9.80m, Z = +0.36m..+1.05m`).
 */
export function buildFamilyBathroomDrinksCabinet(
  scene: THREE.Group,
  kit: FamilyBathroomDrinksCabinetKit
): void {
  const { brassMat, ceramicWhiteMat, floorTopY, upperWallTopY, windowGlassMat } = kit;

  const drinksGroup = new THREE.Group();
  drinksGroup.name = 'familyBathroom.drinksCabinet';

  const cx = -10.21; // Clear alcove X = -10.62m .. -9.80m (width = 0.82m)
  const cabW = 0.82;
  const cabH = upperWallTopY - floorTopY; // 2.00m

  // Materials for the bespoke drinks station
  const darkAnthraciteMat = new THREE.MeshStandardMaterial({
    color: 0x1e2022,
    roughness: 0.35,
    metalness: 0.65,
  });
  const brushedChromeMat = new THREE.MeshStandardMaterial({
    color: 0xd8dce0,
    roughness: 0.22,
    metalness: 0.88,
  });
  const oakCabinetMat = new THREE.MeshStandardMaterial({
    color: 0xa17b55,
    roughness: 0.46,
    metalness: 0.04,
  });
  const oakCountertopMat = new THREE.MeshStandardMaterial({
    color: 0x8f6b47,
    roughness: 0.42,
    metalness: 0.04,
  });
  const beechShelfMat = new THREE.MeshStandardMaterial({
    color: 0xc89d6c,
    roughness: 0.55,
    metalness: 0.05,
  });
  const sanPellegrinoGlassMat = new THREE.MeshStandardMaterial({
    color: 0x1d5e3a,
    roughness: 0.12,
    metalness: 0.1,
  });
  const sanPellegrinoLabelMat = new THREE.MeshStandardMaterial({
    color: 0xbfe0f0,
    roughness: 0.4,
  });
  const sanPellegrinoStarMat = new THREE.MeshStandardMaterial({
    color: 0xc82828,
    roughness: 0.4,
  });
  const fijiBottleMat = new THREE.MeshStandardMaterial({
    color: 0xd0eefc,
    roughness: 0.1,
    metalness: 0.05,
    transparent: true,
    opacity: 0.85,
  });
  const fijiLabelMat = new THREE.MeshStandardMaterial({
    color: 0x1b4d8e,
    roughness: 0.35,
  });
  const fijiHibiscusMat = new THREE.MeshStandardMaterial({
    color: 0xe05286,
    roughness: 0.4,
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
    new THREE.MeshStandardMaterial({ color: 0xe86c8d, roughness: 0.28, metalness: 0.45 }), // Raspberry
    new THREE.MeshStandardMaterial({ color: 0xf2a663, roughness: 0.28, metalness: 0.45 }), // Peach
    new THREE.MeshStandardMaterial({ color: 0x7bc496, roughness: 0.28, metalness: 0.45 }), // Cucumber
    new THREE.MeshStandardMaterial({ color: 0xf2d65b, roughness: 0.28, metalness: 0.45 }), // Lemon
  ];
  const warmLedMat = new THREE.MeshStandardMaterial({
    color: 0xfff1d0,
    emissive: 0xffd28a,
    emissiveIntensity: 0.65,
    roughness: 0.2,
  });

  // 1. Recessed Oak Joinery Back & Side Cheeks (`Z = 0.36m..1.05m`, tight against the `0.82m` alcove) (Issues #1 & #5)
  const backPanelGeo = new THREE.BoxGeometry(cabW, cabH, 0.04);
  backPanelGeo.computeBoundingSphere();
  const backPanel = new THREE.Mesh(backPanelGeo, oakCabinetMat);
  backPanel.name = 'familyBathroom.drinksCabinet.backPanel';
  backPanel.position.set(cx, floorTopY + cabH / 2, 0.38);
  drinksGroup.add(backPanel);

  const cheekGeo = new THREE.BoxGeometry(0.028, cabH, 0.68);
  cheekGeo.computeBoundingSphere();
  for (const sideSign of [-1, 1] as const) {
    const cheek = new THREE.Mesh(cheekGeo, oakCabinetMat);
    cheek.name = `familyBathroom.drinksCabinet.cheek.${sideSign < 0 ? 'west' : 'east'}`;
    cheek.position.set(cx + sideSign * (cabW / 2 - 0.014), floorTopY + cabH / 2, 0.71);
    drinksGroup.add(cheek);
  }

  // Top cornice header & base plinth in matching solid oak
  const topHeaderGeo = new THREE.BoxGeometry(cabW, 0.09, 0.69);
  topHeaderGeo.computeBoundingSphere();
  const topHeader = new THREE.Mesh(topHeaderGeo, oakCabinetMat);
  topHeader.name = 'familyBathroom.drinksCabinet.topHeader';
  topHeader.position.set(cx, upperWallTopY - 0.045, 0.705);
  drinksGroup.add(topHeader);

  const basePlinthGeo = new THREE.BoxGeometry(cabW - 0.056, 0.08, 0.63);
  basePlinthGeo.computeBoundingSphere();
  const basePlinth = new THREE.Mesh(basePlinthGeo, oakCabinetMat);
  basePlinth.name = 'familyBathroom.drinksCabinet.basePlinth';
  basePlinth.position.set(cx, floorTopY + 0.04, 0.715);
  drinksGroup.add(basePlinth);

  // 2. Under-Counter Glazed Wine & Beverage Cooler (`Y = floorTopY + 0.08m .. floorTopY + 0.87m`)
  const coolerGroup = new THREE.Group();
  coolerGroup.name = 'familyBathroom.drinksCabinet.wineCooler';
  const coolerW = 0.76;
  const coolerH = 0.79;
  const coolerY0 = floorTopY + 0.08;

  // Outer insulated cooler shell (top, bottom, left, right, back)
  const coolerBackGeo = new THREE.BoxGeometry(coolerW, coolerH, 0.03);
  coolerBackGeo.computeBoundingSphere();
  const coolerBack = new THREE.Mesh(coolerBackGeo, darkAnthraciteMat);
  coolerBack.name = 'familyBathroom.drinksCabinet.wineCooler.back';
  coolerBack.position.set(cx, coolerY0 + coolerH / 2, 0.42);
  coolerGroup.add(coolerBack);

  const coolerTopGeo = new THREE.BoxGeometry(coolerW, 0.035, 0.56);
  coolerTopGeo.computeBoundingSphere();
  const coolerTop = new THREE.Mesh(coolerTopGeo, darkAnthraciteMat);
  coolerTop.name = 'familyBathroom.drinksCabinet.wineCooler.top';
  coolerTop.position.set(cx, coolerY0 + coolerH - 0.0175, 0.70);
  coolerGroup.add(coolerTop);

  const coolerBottomGeo = new THREE.BoxGeometry(coolerW, 0.045, 0.56);
  coolerBottomGeo.computeBoundingSphere();
  const coolerBottom = new THREE.Mesh(coolerBottomGeo, darkAnthraciteMat);
  coolerBottom.name = 'familyBathroom.drinksCabinet.wineCooler.bottom';
  coolerBottom.position.set(cx, coolerY0 + 0.0225, 0.70);
  coolerGroup.add(coolerBottom);

  const coolerSideGeo = new THREE.BoxGeometry(0.035, coolerH, 0.56);
  coolerSideGeo.computeBoundingSphere();
  for (const s of [-1, 1] as const) {
    const coolerSide = new THREE.Mesh(coolerSideGeo, darkAnthraciteMat);
    coolerSide.name = `familyBathroom.drinksCabinet.wineCooler.side.${s < 0 ? 'west' : 'east'}`;
    coolerSide.position.set(cx + s * (coolerW / 2 - 0.0175), coolerY0 + coolerH / 2, 0.70);
    coolerGroup.add(coolerSide);
  }

  // Internal warm LED light strip at top of wine cooler
  const coolerLedGeo = new THREE.BoxGeometry(coolerW - 0.1, 0.008, 0.02);
  coolerLedGeo.computeBoundingSphere();
  const coolerLed = new THREE.Mesh(coolerLedGeo, warmLedMat);
  coolerLed.name = 'familyBathroom.drinksCabinet.wineCooler.ledStrip';
  coolerLed.userData.lodTier = 'high';
  coolerLed.userData.lodMaxDistance = 12;
  coolerLed.position.set(cx, coolerY0 + coolerH - 0.04, 0.92);
  coolerGroup.add(coolerLed);

  // 3 Beechwood pull-out shelves inside the wine cooler
  const shelfYOffsets = [0.06, 0.29, 0.54];
  const coolerShelfGeo = new THREE.BoxGeometry(coolerW - 0.08, 0.016, 0.46);
  coolerShelfGeo.computeBoundingSphere();
  for (const [shelfIdx, sy] of shelfYOffsets.entries()) {
    const shelf = new THREE.Mesh(coolerShelfGeo, beechShelfMat);
    shelf.name = `familyBathroom.drinksCabinet.wineCooler.shelf_${shelfIdx + 1}`;
    shelf.position.set(cx, coolerY0 + sy, 0.70);
    coolerGroup.add(shelf);
  }

  // --- Shelf 1 (Bottom, Y = coolerY0 + 0.068): Chilled Champagne Bottles ---
  const champY = coolerY0 + 0.068 + 0.044;
  const champBodyGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.19, 14);
  champBodyGeo.computeBoundingSphere();
  const champNeckGeo = new THREE.CylinderGeometry(0.016, 0.040, 0.11, 14);
  champNeckGeo.computeBoundingSphere();
  const champFoilGeo = new THREE.CylinderGeometry(0.015, 0.022, 0.065, 14);
  champFoilGeo.computeBoundingSphere();
  const champLabelGeo = new THREE.BoxGeometry(0.055, 0.012, 0.075);
  champLabelGeo.computeBoundingSphere();

  for (let i = 0; i < 5; i++) {
    const bx = cx - 0.24 + i * 0.12;
    const bottleGroup = new THREE.Group();
    bottleGroup.name = `familyBathroom.drinksCabinet.champagne_${i + 1}`;
    bottleGroup.userData.lodTier = 'high';
    bottleGroup.userData.lodMaxDistance = 12;

    const body = new THREE.Mesh(champBodyGeo, champagneGlassMat);
    body.name = `familyBathroom.drinksCabinet.champagne_${i + 1}.body`;
    body.rotation.x = Math.PI / 2;
    body.position.set(bx, champY, 0.65);
    bottleGroup.add(body);

    const neck = new THREE.Mesh(champNeckGeo, champagneGlassMat);
    neck.name = `familyBathroom.drinksCabinet.champagne_${i + 1}.neck`;
    neck.rotation.x = Math.PI / 2;
    neck.position.set(bx, champY, 0.80);
    bottleGroup.add(neck);

    const foil = new THREE.Mesh(champFoilGeo, champagneFoilMat);
    foil.name = `familyBathroom.drinksCabinet.champagne_${i + 1}.foil`;
    foil.rotation.x = Math.PI / 2;
    foil.position.set(bx, champY, 0.86);
    bottleGroup.add(foil);

    const label = new THREE.Mesh(champLabelGeo, ceramicWhiteMat);
    label.name = `familyBathroom.drinksCabinet.champagne_${i + 1}.label`;
    label.position.set(bx, champY + 0.038, 0.67);
    bottleGroup.add(label);
    coolerGroup.add(bottleGroup);
  }

  // --- Shelf 2 (Middle, Y = coolerY0 + 0.298): San Pellegrino (left) & Fiji Water (right) ---
  const midBottleY = coolerY0 + 0.298;
  const spBodyGeo = new THREE.CylinderGeometry(0.033, 0.034, 0.13, 14);
  spBodyGeo.computeBoundingSphere();
  const spNeckGeo = new THREE.CylinderGeometry(0.013, 0.032, 0.065, 14);
  spNeckGeo.computeBoundingSphere();
  const spLabelGeo = new THREE.CylinderGeometry(0.0345, 0.0345, 0.048, 14);
  spLabelGeo.computeBoundingSphere();
  const spStarGeo = new THREE.BoxGeometry(0.018, 0.018, 0.006);
  spStarGeo.computeBoundingSphere();

  // 4 San Pellegrino green glass bottles on the left
  for (let i = 0; i < 4; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const bx = cx - 0.24 + col * 0.10;
    const bz = 0.84 - row * 0.14;
    const spGroup = new THREE.Group();
    spGroup.name = `familyBathroom.drinksCabinet.sanPellegrino_${i + 1}`;
    spGroup.userData.lodTier = 'high';
    spGroup.userData.lodMaxDistance = 12;

    const spBody = new THREE.Mesh(spBodyGeo, sanPellegrinoGlassMat);
    spBody.name = `familyBathroom.drinksCabinet.sanPellegrino_${i + 1}.body`;
    spBody.position.set(bx, midBottleY + 0.065, bz);
    spGroup.add(spBody);

    const spNeck = new THREE.Mesh(spNeckGeo, sanPellegrinoGlassMat);
    spNeck.name = `familyBathroom.drinksCabinet.sanPellegrino_${i + 1}.neck`;
    spNeck.position.set(bx, midBottleY + 0.162, bz);
    spGroup.add(spNeck);

    const spLabel = new THREE.Mesh(spLabelGeo, sanPellegrinoLabelMat);
    spLabel.name = `familyBathroom.drinksCabinet.sanPellegrino_${i + 1}.label`;
    spLabel.position.set(bx, midBottleY + 0.068, bz);
    spGroup.add(spLabel);

    const spStar = new THREE.Mesh(spStarGeo, sanPellegrinoStarMat);
    spStar.name = `familyBathroom.drinksCabinet.sanPellegrino_${i + 1}.star`;
    spStar.position.set(bx, midBottleY + 0.068, bz + 0.033);
    spGroup.add(spStar);

    coolerGroup.add(spGroup);
  }

  // 4 Square Fiji Water bottles on the right
  const fijiBodyGeo = new THREE.BoxGeometry(0.064, 0.155, 0.064);
  fijiBodyGeo.computeBoundingSphere();
  const fijiShoulderGeo = new THREE.CylinderGeometry(0.015, 0.038, 0.038, 4);
  fijiShoulderGeo.computeBoundingSphere();
  const fijiCapGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.016, 12);
  fijiCapGeo.computeBoundingSphere();
  const fijiFrontLabelGeo = new THREE.BoxGeometry(0.054, 0.075, 0.004);
  fijiFrontLabelGeo.computeBoundingSphere();
  const hibiscusGeo = new THREE.BoxGeometry(0.022, 0.022, 0.005);
  hibiscusGeo.computeBoundingSphere();

  for (let i = 0; i < 4; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const bx = cx + 0.12 + col * 0.10;
    const bz = 0.84 - row * 0.14;
    const fijiGroup = new THREE.Group();
    fijiGroup.name = `familyBathroom.drinksCabinet.fijiWater_${i + 1}`;
    fijiGroup.userData.lodTier = 'high';
    fijiGroup.userData.lodMaxDistance = 12;

    const fijiBody = new THREE.Mesh(fijiBodyGeo, fijiBottleMat);
    fijiBody.name = `familyBathroom.drinksCabinet.fijiWater_${i + 1}.body`;
    fijiBody.position.set(bx, midBottleY + 0.078, bz);
    fijiGroup.add(fijiBody);

    const fijiShoulder = new THREE.Mesh(fijiShoulderGeo, fijiBottleMat);
    fijiShoulder.name = `familyBathroom.drinksCabinet.fijiWater_${i + 1}.shoulder`;
    fijiShoulder.rotation.y = Math.PI / 4;
    fijiShoulder.position.set(bx, midBottleY + 0.174, bz);
    fijiGroup.add(fijiShoulder);

    const fijiCap = new THREE.Mesh(fijiCapGeo, fijiLabelMat);
    fijiCap.name = `familyBathroom.drinksCabinet.fijiWater_${i + 1}.cap`;
    fijiCap.position.set(bx, midBottleY + 0.20, bz);
    fijiGroup.add(fijiCap);

    const fijiFrontLabel = new THREE.Mesh(fijiFrontLabelGeo, fijiLabelMat);
    fijiFrontLabel.name = `familyBathroom.drinksCabinet.fijiWater_${i + 1}.label`;
    fijiFrontLabel.position.set(bx, midBottleY + 0.078, bz + 0.037);
    fijiGroup.add(fijiFrontLabel);

    const hibiscus = new THREE.Mesh(hibiscusGeo, fijiHibiscusMat);
    hibiscus.name = `familyBathroom.drinksCabinet.fijiWater_${i + 1}.hibiscus`;
    hibiscus.position.set(bx + 0.01, midBottleY + 0.062, bz + 0.0445);
    fijiGroup.add(hibiscus);

    coolerGroup.add(fijiGroup);
  }

  // --- Shelf 3 (Top, Y = coolerY0 + 0.548): Cans of DASH Sparkling Water ---
  const topCanY = coolerY0 + 0.548;
  const canBodyGeo = new THREE.CylinderGeometry(0.030, 0.030, 0.112, 14);
  canBodyGeo.computeBoundingSphere();
  const canTopGeo = new THREE.CylinderGeometry(0.028, 0.030, 0.006, 14);
  canTopGeo.computeBoundingSphere();

  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 6; col++) {
      const canIdx = row * 6 + col + 1;
      const canX = cx - 0.25 + col * 0.10;
      const canZ = 0.85 - row * 0.11;
      const canMat = dashCanMats[(col + row) % dashCanMats.length];
      const canGroup = new THREE.Group();
      canGroup.name = `familyBathroom.drinksCabinet.dashCan_${canIdx}`;
      canGroup.userData.lodTier = 'high';
      canGroup.userData.lodMaxDistance = 12;

      const canBody = new THREE.Mesh(canBodyGeo, canMat);
      canBody.name = `familyBathroom.drinksCabinet.dashCan_${canIdx}.body`;
      canBody.position.set(canX, topCanY + 0.056, canZ);
      canGroup.add(canBody);

      const canTop = new THREE.Mesh(canTopGeo, brushedChromeMat);
      canTop.name = `familyBathroom.drinksCabinet.dashCan_${canIdx}.top`;
      canTop.position.set(canX, topCanY + 0.115, canZ);
      canGroup.add(canTop);

      coolerGroup.add(canGroup);
    }
  }

  // Glazed Cooler Door Frame & Low-Iron Glass Pane (`Z = 0.99m`)
  const doorFrameThick = 0.022;
  const doorFrameTopGeo = new THREE.BoxGeometry(coolerW - 0.02, 0.036, doorFrameThick);
  doorFrameTopGeo.computeBoundingSphere();
  const doorFrameTop = new THREE.Mesh(doorFrameTopGeo, brushedChromeMat);
  doorFrameTop.name = 'familyBathroom.drinksCabinet.wineCooler.doorFrameTop';
  doorFrameTop.position.set(cx, coolerY0 + coolerH - 0.022, 0.99);
  coolerGroup.add(doorFrameTop);

  const doorFrameBotGeo = new THREE.BoxGeometry(coolerW - 0.02, 0.042, doorFrameThick);
  doorFrameBotGeo.computeBoundingSphere();
  const doorFrameBot = new THREE.Mesh(doorFrameBotGeo, brushedChromeMat);
  doorFrameBot.name = 'familyBathroom.drinksCabinet.wineCooler.doorFrameBottom';
  doorFrameBot.position.set(cx, coolerY0 + 0.025, 0.99);
  coolerGroup.add(doorFrameBot);

  const doorStileGeo = new THREE.BoxGeometry(0.036, coolerH - 0.05, doorFrameThick);
  doorStileGeo.computeBoundingSphere();
  for (const s of [-1, 1] as const) {
    const stile = new THREE.Mesh(doorStileGeo, brushedChromeMat);
    stile.name = `familyBathroom.drinksCabinet.wineCooler.doorStile.${s < 0 ? 'west' : 'east'}`;
    stile.position.set(cx + s * (coolerW / 2 - 0.028), coolerY0 + coolerH / 2, 0.99);
    coolerGroup.add(stile);
  }

  const coolerGlassGeo = new THREE.BoxGeometry(coolerW - 0.09, coolerH - 0.08, 0.008);
  coolerGlassGeo.computeBoundingSphere();
  const coolerGlass = new THREE.Mesh(coolerGlassGeo, windowGlassMat);
  coolerGlass.name = 'familyBathroom.drinksCabinet.wineCooler.doorGlass';
  coolerGlass.position.set(cx, coolerY0 + coolerH / 2, 0.99);
  coolerGroup.add(coolerGlass);

  // Vertical brass cooler door handle on the left stile
  const coolerHandleGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.42, 10);
  coolerHandleGeo.computeBoundingSphere();
  const coolerHandle = new THREE.Mesh(coolerHandleGeo, brassMat);
  coolerHandle.name = 'familyBathroom.drinksCabinet.wineCooler.doorHandle';
  coolerHandle.userData.lodTier = 'high';
  coolerHandle.userData.lodMaxDistance = 12;
  coolerHandle.position.set(cx - coolerW / 2 + 0.03, coolerY0 + coolerH / 2 + 0.04, 1.02);
  coolerGroup.add(coolerHandle);

  drinksGroup.add(coolerGroup);

  // 3. Solid Oiled Oak Countertop (`Y = floorTopY + 0.87m .. 0.905m`) & Upstand (Issue #5: "Make this oak cabinet")
  const counterY = floorTopY + 0.888;
  const marbleCounterGeo = new THREE.BoxGeometry(cabW - 0.056, 0.035, 0.65);
  marbleCounterGeo.computeBoundingSphere();
  const marbleCounter = new THREE.Mesh(marbleCounterGeo, oakCountertopMat);
  marbleCounter.name = 'familyBathroom.drinksCabinet.marbleCountertop';
  marbleCounter.position.set(cx, counterY, 0.725);
  marbleCounter.castShadow = true;
  marbleCounter.receiveShadow = true;
  drinksGroup.add(marbleCounter);

  const marbleSplashGeo = new THREE.BoxGeometry(cabW - 0.056, 0.48, 0.018);
  marbleSplashGeo.computeBoundingSphere();
  const marbleSplash = new THREE.Mesh(marbleSplashGeo, oakCabinetMat);
  marbleSplash.name = 'familyBathroom.drinksCabinet.backsplash';
  marbleSplash.position.set(cx, counterY + 0.25, 0.41);
  drinksGroup.add(marbleSplash);

  // 4. Compact Luxury Espresso / Pod Coffee Machine (`familyBathroom.drinksCabinet.coffeeMachine`)
  const coffeeGroup = new THREE.Group();
  coffeeGroup.name = 'familyBathroom.drinksCabinet.coffeeMachine';
  coffeeGroup.userData.lodTier = 'high';
  coffeeGroup.userData.lodMaxDistance = 12;
  const cmX = cx - 0.16;
  const cmY = counterY + 0.0175;
  const cmZ = 0.70;

  // Capsule drawer base under coffee machine
  const podDrawerGeo = new THREE.BoxGeometry(0.22, 0.045, 0.30);
  podDrawerGeo.computeBoundingSphere();
  const podDrawer = new THREE.Mesh(podDrawerGeo, darkAnthraciteMat);
  podDrawer.name = 'familyBathroom.drinksCabinet.coffeeMachine.podDrawer';
  podDrawer.position.set(cmX, cmY + 0.0225, cmZ);
  coffeeGroup.add(podDrawer);

  const podDrawerHandleGeo = new THREE.BoxGeometry(0.10, 0.008, 0.014);
  podDrawerHandleGeo.computeBoundingSphere();
  const podDrawerHandle = new THREE.Mesh(podDrawerHandleGeo, brassMat);
  podDrawerHandle.name = 'familyBathroom.drinksCabinet.coffeeMachine.podDrawerHandle';
  podDrawerHandle.position.set(cmX, cmY + 0.0225, cmZ + 0.155);
  coffeeGroup.add(podDrawerHandle);

  // Main coffee machine tower & brushed chrome faceplate
  const cmBodyGeo = new THREE.BoxGeometry(0.18, 0.25, 0.24);
  cmBodyGeo.computeBoundingSphere();
  const cmBody = new THREE.Mesh(cmBodyGeo, darkAnthraciteMat);
  cmBody.name = 'familyBathroom.drinksCabinet.coffeeMachine.body';
  cmBody.position.set(cmX, cmY + 0.045 + 0.125, cmZ - 0.02);
  coffeeGroup.add(cmBody);

  const cmFaceGeo = new THREE.BoxGeometry(0.165, 0.23, 0.018);
  cmFaceGeo.computeBoundingSphere();
  const cmFace = new THREE.Mesh(cmFaceGeo, brushedChromeMat);
  cmFace.name = 'familyBathroom.drinksCabinet.coffeeMachine.faceplate';
  cmFace.position.set(cmX, cmY + 0.045 + 0.125, cmZ + 0.105);
  coffeeGroup.add(cmFace);

  // Brew head, brass extraction lever, and drip tray with espresso cup
  const brewHeadGeo = new THREE.CylinderGeometry(0.032, 0.028, 0.075, 16);
  brewHeadGeo.computeBoundingSphere();
  const brewHead = new THREE.Mesh(brewHeadGeo, brushedChromeMat);
  brewHead.name = 'familyBathroom.drinksCabinet.coffeeMachine.brewHead';
  brewHead.position.set(cmX, cmY + 0.21, cmZ + 0.135);
  coffeeGroup.add(brewHead);

  const brewLeverGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.09, 10);
  brewLeverGeo.computeBoundingSphere();
  const brewLever = new THREE.Mesh(brewLeverGeo, brassMat);
  brewLever.name = 'familyBathroom.drinksCabinet.coffeeMachine.brewLever';
  brewLever.rotation.x = Math.PI / 3;
  brewLever.position.set(cmX, cmY + 0.26, cmZ + 0.145);
  coffeeGroup.add(brewLever);

  const dripTrayGeo = new THREE.BoxGeometry(0.15, 0.028, 0.09);
  dripTrayGeo.computeBoundingSphere();
  const dripTray = new THREE.Mesh(dripTrayGeo, brushedChromeMat);
  dripTray.name = 'familyBathroom.drinksCabinet.coffeeMachine.dripTray';
  dripTray.position.set(cmX, cmY + 0.059, cmZ + 0.135);
  coffeeGroup.add(dripTray);

  const cupOnTrayGeo = new THREE.CylinderGeometry(0.024, 0.019, 0.048, 14);
  cupOnTrayGeo.computeBoundingSphere();
  const cupOnTray = new THREE.Mesh(cupOnTrayGeo, ceramicWhiteMat);
  cupOnTray.name = 'familyBathroom.drinksCabinet.coffeeMachine.espressoCup';
  cupOnTray.position.set(cmX, cmY + 0.097, cmZ + 0.135);
  coffeeGroup.add(cupOnTray);

  // Rear water tank
  const waterTankGeo = new THREE.BoxGeometry(0.15, 0.22, 0.07);
  waterTankGeo.computeBoundingSphere();
  const waterTank = new THREE.Mesh(waterTankGeo, fijiBottleMat);
  waterTank.name = 'familyBathroom.drinksCabinet.coffeeMachine.waterTank';
  waterTank.position.set(cmX, cmY + 0.155, cmZ - 0.165);
  coffeeGroup.add(waterTank);

  drinksGroup.add(coffeeGroup);

  // 5. Brushed Brass Hospitality Tray on Countertop (right side) with Espresso Cups
  const trayX = cx + 0.17;
  const trayZ = 0.73;
  const trayBaseGeo = new THREE.BoxGeometry(0.30, 0.012, 0.24);
  trayBaseGeo.computeBoundingSphere();
  const trayBase = new THREE.Mesh(trayBaseGeo, brassMat);
  trayBase.name = 'familyBathroom.drinksCabinet.hospitalityTray';
  trayBase.userData.lodTier = 'high';
  trayBase.userData.lodMaxDistance = 12;
  trayBase.position.set(trayX, cmY + 0.006, trayZ);
  drinksGroup.add(trayBase);

  const traySaucerGeo = new THREE.CylinderGeometry(0.042, 0.035, 0.008, 16);
  traySaucerGeo.computeBoundingSphere();
  const trayCupGeo = new THREE.CylinderGeometry(0.026, 0.021, 0.052, 16);
  trayCupGeo.computeBoundingSphere();
  for (let i = 0; i < 2; i++) {
    const saucer = new THREE.Mesh(traySaucerGeo, ceramicWhiteMat);
    saucer.name = `familyBathroom.drinksCabinet.hospitalityTray.saucer_${i + 1}`;
    saucer.userData.lodTier = 'high';
    saucer.userData.lodMaxDistance = 12;
    saucer.position.set(trayX - 0.06 + i * 0.12, cmY + 0.016, trayZ + 0.05);
    drinksGroup.add(saucer);

    const cup = new THREE.Mesh(trayCupGeo, ceramicWhiteMat);
    cup.name = `familyBathroom.drinksCabinet.hospitalityTray.cup_${i + 1}`;
    cup.userData.lodTier = 'high';
    cup.userData.lodMaxDistance = 12;
    cup.position.set(trayX - 0.06 + i * 0.12, cmY + 0.044, trayZ + 0.05);
    drinksGroup.add(cup);
  }

  // 6. Two Open Upper Display Shelves (`Y = floorTopY + 1.44m` & `1.74m`) with Brass Gallery Rails:
  //    - Shelf 1 (`sIdx === 0`, `Y = floorTopY + 1.44m`): Ceramic coffee cups & saucers with handles/spoons + tea selection box & heritage tea caddies (Issue #3)
  //    - Top Shelf (`sIdx === 1`, `Y = floorTopY + 1.74m`): Crystal water tumblers & stemmed champagne/wine glasses (Issue #3)
  const teaBoxWoodMat = new THREE.MeshStandardMaterial({
    color: 0x5c3a21,
    roughness: 0.38,
    metalness: 0.04,
  });
  const teaCaddyMat = new THREE.MeshStandardMaterial({
    color: 0x1e352f,
    roughness: 0.3,
    metalness: 0.25,
  });
  const teaSachetMats = [
    new THREE.MeshStandardMaterial({ color: 0xb8332a, roughness: 0.45 }), // English Breakfast
    new THREE.MeshStandardMaterial({ color: 0x2b4c7e, roughness: 0.45 }), // Earl Grey
    new THREE.MeshStandardMaterial({ color: 0x3b7a57, roughness: 0.45 }), // Sencha Green
    new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.45 }), // Chamomile Honey
  ];

  const upperShelfGeo = new THREE.BoxGeometry(cabW - 0.056, 0.024, 0.34);
  upperShelfGeo.computeBoundingSphere();
  const galleryRailGeo = new THREE.CylinderGeometry(0.004, 0.004, cabW - 0.08, 10);
  galleryRailGeo.computeBoundingSphere();
  const ledUnderGeo = new THREE.BoxGeometry(cabW - 0.12, 0.005, 0.016);
  ledUnderGeo.computeBoundingSphere();

  const saucerRimGeo = new THREE.CylinderGeometry(0.048, 0.036, 0.009, 18);
  saucerRimGeo.computeBoundingSphere();
  const cupBodyGeo = new THREE.CylinderGeometry(0.03, 0.023, 0.056, 18);
  cupBodyGeo.computeBoundingSphere();
  const cupHandleGeo = new THREE.TorusGeometry(0.014, 0.0038, 8, 16, Math.PI);
  cupHandleGeo.computeBoundingSphere();
  const spoonGeo = new THREE.BoxGeometry(0.056, 0.0025, 0.008);
  spoonGeo.computeBoundingSphere();

  const sachetGeo = new THREE.BoxGeometry(0.024, 0.028, 0.006);
  sachetGeo.computeBoundingSphere();

  const caddyBodyGeo = new THREE.CylinderGeometry(0.031, 0.031, 0.088, 16);
  caddyBodyGeo.computeBoundingSphere();
  const caddyLabelGeo = new THREE.BoxGeometry(0.036, 0.036, 0.004);
  caddyLabelGeo.computeBoundingSphere();
  const caddyLidGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.016, 16);
  caddyLidGeo.computeBoundingSphere();
  const caddyFinialGeo = new THREE.CylinderGeometry(0.008, 0.01, 0.01, 12);
  caddyFinialGeo.computeBoundingSphere();

  const tumblerGeo = new THREE.CylinderGeometry(0.032, 0.027, 0.095, 14);
  tumblerGeo.computeBoundingSphere();
  const wineBaseGeo = new THREE.CylinderGeometry(0.028, 0.03, 0.005, 14);
  wineBaseGeo.computeBoundingSphere();
  const wineStemGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.085, 10);
  wineStemGeo.computeBoundingSphere();
  const wineBowlGeo = new THREE.CylinderGeometry(0.026, 0.014, 0.105, 14);
  wineBowlGeo.computeBoundingSphere();

  for (const [sIdx, shelfY] of [floorTopY + 1.44, floorTopY + 1.74].entries()) {
    const upperShelf = new THREE.Mesh(upperShelfGeo, oakCountertopMat);
    upperShelf.name = `familyBathroom.drinksCabinet.upperShelf_${sIdx + 1}`;
    upperShelf.position.set(cx, shelfY, 0.56);
    drinksGroup.add(upperShelf);

    const galleryRail = new THREE.Mesh(galleryRailGeo, brassMat);
    galleryRail.name = `familyBathroom.drinksCabinet.upperShelf_${sIdx + 1}.galleryRail`;
    galleryRail.userData.lodTier = 'high';
    galleryRail.userData.lodMaxDistance = 12;
    galleryRail.rotation.z = Math.PI / 2;
    galleryRail.position.set(cx, shelfY + 0.028, 0.71);
    drinksGroup.add(galleryRail);

    const ledUnder = new THREE.Mesh(ledUnderGeo, warmLedMat);
    ledUnder.name = `familyBathroom.drinksCabinet.upperShelf_${sIdx + 1}.ledStrip`;
    ledUnder.userData.lodTier = 'high';
    ledUnder.userData.lodMaxDistance = 12;
    ledUnder.position.set(cx, shelfY - 0.014, 0.68);
    drinksGroup.add(ledUnder);

    const shelfTopY = shelfY + 0.012;
    if (sIdx === 0) {
      // Shelf 1: 4 porcelain coffee cups & saucers with handles and brass teaspoons on the left
      for (let c = 0; c < 4; c++) {
        const col = c % 2;
        const row = Math.floor(c / 2);
        const cupX = cx - 0.25 + col * 0.12;
        const cupZ = 0.62 - row * 0.11;
        const cupSetGroup = new THREE.Group();
        cupSetGroup.name = `familyBathroom.drinksCabinet.coffeeCup_${c + 1}`;
        cupSetGroup.userData.lodTier = 'high';
        cupSetGroup.userData.lodMaxDistance = 12;

        const saucerRim = new THREE.Mesh(saucerRimGeo, ceramicWhiteMat);
        saucerRim.name = `familyBathroom.drinksCabinet.coffeeCup_${c + 1}.saucer`;
        saucerRim.position.set(cupX, shelfTopY + 0.0045, cupZ);
        cupSetGroup.add(saucerRim);

        const cupBody = new THREE.Mesh(cupBodyGeo, ceramicWhiteMat);
        cupBody.name = `familyBathroom.drinksCabinet.coffeeCup_${c + 1}.cup`;
        cupBody.position.set(cupX, shelfTopY + 0.036, cupZ);
        cupSetGroup.add(cupBody);

        const cupHandle = new THREE.Mesh(cupHandleGeo, ceramicWhiteMat);
        cupHandle.name = `familyBathroom.drinksCabinet.coffeeCup_${c + 1}.handle`;
        cupHandle.rotation.z = -Math.PI / 2;
        cupHandle.position.set(cupX + 0.028, shelfTopY + 0.038, cupZ);
        cupSetGroup.add(cupHandle);

        const spoon = new THREE.Mesh(spoonGeo, brassMat);
        spoon.name = `familyBathroom.drinksCabinet.coffeeCup_${c + 1}.spoon`;
        spoon.rotation.y = 0.25;
        spoon.position.set(cupX + 0.006, shelfTopY + 0.01, cupZ + 0.028);
        cupSetGroup.add(spoon);

        drinksGroup.add(cupSetGroup);
      }

      // Right side of Shelf 1: Compartmented Walnut & Brass Tea Selection Box + 2 Heritage Loose-Leaf Tea Caddies
      const teaBoxGroup = new THREE.Group();
      teaBoxGroup.name = 'familyBathroom.drinksCabinet.teaBox';
      teaBoxGroup.userData.lodTier = 'high';
      teaBoxGroup.userData.lodMaxDistance = 12;
      const boxX = cx + 0.06;
      const boxZ = 0.58;
      const boxOuterGeo = new THREE.BoxGeometry(0.15, 0.038, 0.13);
      boxOuterGeo.computeBoundingSphere();
      const boxOuter = new THREE.Mesh(boxOuterGeo, teaBoxWoodMat);
      boxOuter.name = 'familyBathroom.drinksCabinet.teaBox.case';
      boxOuter.position.set(boxX, shelfTopY + 0.019, boxZ);
      teaBoxGroup.add(boxOuter);

      const boxBrassClaspGeo = new THREE.BoxGeometry(0.024, 0.012, 0.004);
      boxBrassClaspGeo.computeBoundingSphere();
      const boxBrassClasp = new THREE.Mesh(boxBrassClaspGeo, brassMat);
      boxBrassClasp.name = 'familyBathroom.drinksCabinet.teaBox.clasp';
      boxBrassClasp.position.set(boxX, shelfTopY + 0.026, boxZ + 0.066);
      teaBoxGroup.add(boxBrassClasp);

      for (let s = 0; s < 4; s++) {
        const sx = boxX - 0.048 + s * 0.032;
        for (let r = 0; r < 3; r++) {
          const sachet = new THREE.Mesh(
            sachetGeo,
            teaSachetMats[s % teaSachetMats.length]
          );
          sachet.name = `familyBathroom.drinksCabinet.teaBox.sachet_${s * 3 + r + 1}`;
          sachet.rotation.x = -0.22;
          sachet.position.set(sx, shelfTopY + 0.042, boxZ - 0.032 + r * 0.032);
          teaBoxGroup.add(sachet);
        }
      }
      drinksGroup.add(teaBoxGroup);

      // Two cylindrical heritage tea caddies with stepped brass lids at the right end of Shelf 1
      for (let t = 0; t < 2; t++) {
        const caddyX = cx + 0.21 + t * 0.075;
        const caddyZ = 0.57 - t * 0.02;
        const caddyGroup = new THREE.Group();
        caddyGroup.name = `familyBathroom.drinksCabinet.teaCaddy_${t + 1}`;
        caddyGroup.userData.lodTier = 'high';
        caddyGroup.userData.lodMaxDistance = 12;

        const caddyBody = new THREE.Mesh(caddyBodyGeo, teaCaddyMat);
        caddyBody.name = `familyBathroom.drinksCabinet.teaCaddy_${t + 1}.body`;
        caddyBody.position.set(caddyX, shelfTopY + 0.044, caddyZ);
        caddyGroup.add(caddyBody);

        const caddyLabel = new THREE.Mesh(caddyLabelGeo, champagneFoilMat);
        caddyLabel.name = `familyBathroom.drinksCabinet.teaCaddy_${t + 1}.label`;
        caddyLabel.position.set(caddyX, shelfTopY + 0.046, caddyZ + 0.03);
        caddyGroup.add(caddyLabel);

        const caddyLid = new THREE.Mesh(caddyLidGeo, brassMat);
        caddyLid.name = `familyBathroom.drinksCabinet.teaCaddy_${t + 1}.lid`;
        caddyLid.position.set(caddyX, shelfTopY + 0.096, caddyZ);
        caddyGroup.add(caddyLid);

        const caddyFinial = new THREE.Mesh(caddyFinialGeo, brassMat);
        caddyFinial.name = `familyBathroom.drinksCabinet.teaCaddy_${t + 1}.finial`;
        caddyFinial.position.set(caddyX, shelfTopY + 0.109, caddyZ);
        caddyGroup.add(caddyFinial);

        drinksGroup.add(caddyGroup);
      }
    } else {
      // Top Shelf: 3 cut-crystal water tumblers on the left + 3 stemmed crystal champagne/wine glasses on the right
      for (let g = 0; g < 3; g++) {
        const tumblerX = cx - 0.25 + g * 0.095;
        const tumbler = new THREE.Mesh(tumblerGeo, windowGlassMat);
        tumbler.name = `familyBathroom.drinksCabinet.tumbler_${g + 1}`;
        tumbler.userData.lodTier = 'high';
        tumbler.userData.lodMaxDistance = 12;
        tumbler.position.set(tumblerX, shelfTopY + 0.0475, 0.57);
        drinksGroup.add(tumbler);
      }
      for (let g = 0; g < 3; g++) {
        const gx = cx + 0.06 + g * 0.095;
        const glassGroup = new THREE.Group();
        glassGroup.name = `familyBathroom.drinksCabinet.wineGlass_${g + 1}`;
        glassGroup.userData.lodTier = 'high';
        glassGroup.userData.lodMaxDistance = 12;

        const base = new THREE.Mesh(wineBaseGeo, windowGlassMat);
        base.name = `familyBathroom.drinksCabinet.wineGlass_${g + 1}.base`;
        base.position.set(gx, shelfTopY + 0.0025, 0.57);
        glassGroup.add(base);

        const stem = new THREE.Mesh(wineStemGeo, windowGlassMat);
        stem.name = `familyBathroom.drinksCabinet.wineGlass_${g + 1}.stem`;
        stem.position.set(gx, shelfTopY + 0.045, 0.57);
        glassGroup.add(stem);

        const bowl = new THREE.Mesh(wineBowlGeo, windowGlassMat);
        bowl.name = `familyBathroom.drinksCabinet.wineGlass_${g + 1}.bowl`;
        bowl.position.set(gx, shelfTopY + 0.138, 0.57);
        glassGroup.add(bowl);

        drinksGroup.add(glassGroup);
      }
    }
  }

  scene.add(drinksGroup);
}

/**
 * Sculpted soft-draped honeycomb waffle-linen bathrobe hanging naturally from a brass robe hook (#12).
 * Origin `(0, 0, 0)` sits at the wall face directly behind the hook prong (`y = 0` at hook height),
 * projecting `+X` into the room.
 */
function buildHangingWaffleBathrobe(
  namePrefix: string,
  robeMat: THREE.Material,
  collarTrimMat: THREE.Material
): THREE.Group {
  const group = new THREE.Group();
  group.name = namePrefix;

  // Neck hanging loop resting over the brass robe hook
  const loopGeo = prepGeo(new THREE.TorusGeometry(0.022, 0.0055, 8, 18, Math.PI * 1.15));
  const loop = new THREE.Mesh(loopGeo, collarTrimMat);
  loop.name = `${namePrefix}.hangingLoop`;
  loop.rotation.y = Math.PI * 0.5;
  loop.position.set(0.020, 0.004, 0);
  group.add(loop);

  // Tapered pleated main robe drape (Y = -0.02 .. -1.08m) built from 5 vertical fabric fold lobes
  const robeLen = 1.06;
  const foldOffsets: readonly [string, number, number, number, number][] = [
    ['centerFold', 0.052, 0, 0.034, 0.048],
    ['northInnerFold', 0.048, -0.042, 0.028, 0.041],
    ['southInnerFold', 0.048, 0.042, 0.028, 0.041],
    ['northOuterFold', 0.04, -0.082, 0.024, 0.035],
    ['southOuterFold', 0.04, 0.082, 0.024, 0.035],
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

  // Rolled shawl collar lapels framing the upper chest
  const lapelGeo = prepGeo(new THREE.CapsuleGeometry(0.019, 0.24, 6, 12));
  for (const [lName, side] of [
    ['northLapel', -1],
    ['southLapel', 1],
  ] as const) {
    const lapel = new THREE.Mesh(lapelGeo, collarTrimMat);
    lapel.name = `${namePrefix}.${lName}`;
    lapel.position.set(0.072, -0.17, side * 0.034);
    lapel.rotation.x = side * 0.16;
    lapel.rotation.z = 0.06;
    lapel.castShadow = true;
    group.add(lapel);
  }

  // Relaxed hanging sleeves with rolled cuffs on each side
  const sleeveGeo = prepGeo(new THREE.CylinderGeometry(0.026, 0.036, 0.5, 14));
  const cuffGeo = prepGeo(new THREE.CylinderGeometry(0.039, 0.038, 0.042, 14));
  for (const [sName, side] of [
    ['northSleeve', -1],
    ['southSleeve', 1],
  ] as const) {
    const sleeve = new THREE.Mesh(sleeveGeo, robeMat);
    sleeve.name = `${namePrefix}.${sName}`;
    sleeve.position.set(0.056, -0.35, side * 0.115);
    sleeve.rotation.x = side * 0.09;
    sleeve.castShadow = true;
    sleeve.receiveShadow = true;
    group.add(sleeve);

    const cuff = new THREE.Mesh(cuffGeo, collarTrimMat);
    cuff.name = `${namePrefix}.${sName}Cuff`;
    cuff.position.set(0.056, -0.585, side * 0.136);
    cuff.rotation.x = side * 0.09;
    group.add(cuff);
  }

  // Waist tie belt & hanging sash tails
  const beltBand = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.052, 0.054, 0.038, 16)),
    collarTrimMat
  );
  beltBand.scale.set(0.66, 1, 1.85);
  beltBand.name = `${namePrefix}.waistBelt`;
  beltBand.position.set(0.052, -0.48, 0);
  group.add(beltBand);

  const knot = new THREE.Mesh(prepGeo(new THREE.SphereGeometry(0.022, 12, 10)), collarTrimMat);
  knot.name = `${namePrefix}.beltKnot`;
  knot.position.set(0.082, -0.485, 0.012);
  group.add(knot);

  const tailGeo = prepGeo(new THREE.BoxGeometry(0.012, 0.28, 0.032));
  for (const [tIdx, tz, rotX] of [
    [1, -0.012, -0.08],
    [2, 0.028, 0.11],
  ] as const) {
    const tail = new THREE.Mesh(tailGeo, collarTrimMat);
    tail.name = `${namePrefix}.beltTail_${tIdx}`;
    tail.position.set(0.084, -0.62, tz);
    tail.rotation.x = rotX;
    group.add(tail);
  }

  return group;
}

/**
 * Builds the Principal / Master Bathroom (`familyBathroom`, Room 17):
 * - Bespoke Dark-Stained European Oak Veneer In-Frame Vanity Unit (`#4`) matching Emily's Slide 3 center photo:
 *   molded bracket plinth, top false-drawer fascia + twin fielded lower doors w/ Polished Brass knobs,
 *   25mm Honed Bianco Carrara Marble countertop & shaped heritage upstand, glazed-white ceramic undermount
 *   basin bowl, and Perrin & Rowe `Traditional` `3705BR` 3-hole Polished Brass deck mixer
 * - Full-Height Built-In Dark Oak Shelving & Bevelled Mirror Joinery (`#4 & #8`) rising from the
 *   `y = 3.01m` countertop right up to the `y = 4.65m` flat collar ceiling
 * - `GSI Classic Close-Coupled Swirlflush®` (`871211` pan + `878111` stepped ceramic cistern + `6796BR`
 *   Polished Brass & porcelain paddle lever + Walnut seat) (`#14`)
 * - `1x 6960BR` Traditional Pivot Toilet Roll Holder + `2x 6921BR` Robe Hooks with two sculpted
 *   honeycomb waffle-linen bathrobes on the West wall `firstFloor.interiorWall.6` (`#12`)
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

  const collarCeilingY = EAST_WING_BATHROOM_VAULT.collarCeilingY + EAST_WING_BATHROOM_VAULT.ceilingClearance + 0.001;
  const alcoveCx = -10.285; // 970mm SE alcove: X = -10.77m .. -9.80m
  const alcoveRearZ = -0.01;

  // =========================================================================
  // 1. BESPOKE DARK OAK VENEER IN-FRAME VANITY UNIT (#4 — Slide 3 Center Photo)
  // =========================================================================
  {
    const vanityGroup = new THREE.Group();
    vanityGroup.name = 'familyBathroom.darkOakVanityUnit';
    vanityGroup.userData.tradeCategory = 'sanitary';

    const cabW = 0.92; // 920mm freestanding-in-alcove cabinet + 25mm scribed shadow fillers
    const cabD = 0.515; // Z = -0.01 .. -0.525m
    const cabH = 0.825; // cabinet body top at floorTopY + 0.825m, + 25mm Carrara top = 0.850m (3.01m!)
    const plinthH = 0.082;
    const topSlabH = 0.025;
    const counterTopY = floorTopY + cabH + topSlabH; // exact 3.010m!
    const cabCenterZ = alcoveRearZ - cabD * 0.5;
    const cabFrontZ = alcoveRearZ - cabD; // -0.525m

    // Scribed dark-oak alcove filler strips closing cleanly to X = -10.77m and X = -9.80m
    const scribeGeo = prepGeo(new THREE.BoxGeometry(0.025, cabH, cabD - 0.03));
    for (const [sName, sx] of [
      ['westScribe', alcoveCx - 0.4725],
      ['eastScribe', alcoveCx + 0.4725],
    ] as const) {
      const scribe = new THREE.Mesh(scribeGeo, darkOak.shadowReveal);
      scribe.name = `familyBathroom.darkOakVanityUnit.${sName}`;
      scribe.position.set(sx, floorTopY + cabH * 0.5, cabCenterZ + 0.012);
      vanityGroup.add(scribe);
    }

    // Molded bracket base plinth with recessed center kick (Slide 3 center photo silhouette!)
    const plinthFootW = 0.145;
    const frontFootGeo = prepGeo(new THREE.BoxGeometry(plinthFootW, plinthH, 0.042));
    for (const [fName, fx] of [
      ['westBracketFoot', alcoveCx - cabW * 0.5 + plinthFootW * 0.5 - 0.008],
      ['eastBracketFoot', alcoveCx + cabW * 0.5 - plinthFootW * 0.5 + 0.008],
    ] as const) {
      const foot = new THREE.Mesh(frontFootGeo, darkOak.veneer);
      foot.name = `familyBathroom.darkOakVanityUnit.${fName}`;
      foot.position.set(fx, floorTopY + plinthH * 0.5, cabFrontZ + 0.012);
      foot.castShadow = true;
      foot.receiveShadow = true;
      vanityGroup.add(foot);
    }
    const plinthBridge = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(cabW - plinthFootW * 1.6, 0.034, 0.038)),
      darkOak.veneer
    );
    plinthBridge.name = 'familyBathroom.darkOakVanityUnit.plinthValance';
    plinthBridge.position.set(alcoveCx, floorTopY + plinthH - 0.017, cabFrontZ + 0.014);
    vanityGroup.add(plinthBridge);

    const plinthRecess = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(cabW - 0.02, plinthH, cabD - 0.04)),
      darkOak.shadowReveal
    );
    plinthRecess.name = 'familyBathroom.darkOakVanityUnit.plinthCore';
    plinthRecess.position.set(alcoveCx, floorTopY + plinthH * 0.5, cabCenterZ + 0.018);
    vanityGroup.add(plinthRecess);

    const baseMolding = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(cabW + 0.018, 0.018, cabD + 0.012)),
      darkOak.veneer
    );
    baseMolding.name = 'familyBathroom.darkOakVanityUnit.baseOgeeMolding';
    baseMolding.position.set(alcoveCx, floorTopY + plinthH + 0.009, cabCenterZ - 0.004);
    baseMolding.castShadow = true;
    vanityGroup.add(baseMolding);

    // Hollow dark-oak veneer carcass (gable cheeks + back + floor shelf — open top for undermount ceramic basin!)
    const bodyBotY = floorTopY + plinthH + 0.016;
    const bodyH = cabH - plinthH - 0.016;
    const gableT = 0.022;
    const gableGeo = prepGeo(new THREE.BoxGeometry(gableT, bodyH, cabD - 0.016));
    for (const [gName, gx] of [
      ['westGable', alcoveCx - cabW * 0.5 + gableT * 0.5],
      ['eastGable', alcoveCx + cabW * 0.5 - gableT * 0.5],
    ] as const) {
      const gable = new THREE.Mesh(gableGeo, darkOak.veneer);
      gable.name = `familyBathroom.darkOakVanityUnit.${gName}`;
      gable.position.set(gx, bodyBotY + bodyH * 0.5, cabCenterZ + 0.008);
      gable.castShadow = true;
      gable.receiveShadow = true;
      vanityGroup.add(gable);
    }
    const carcassBack = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(cabW - gableT * 2, bodyH, 0.018)),
      darkOak.veneer
    );
    carcassBack.name = 'familyBathroom.darkOakVanityUnit.carcassBack';
    carcassBack.position.set(alcoveCx, bodyBotY + bodyH * 0.5, alcoveRearZ - 0.015);
    vanityGroup.add(carcassBack);

    const carcassFloor = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(cabW - gableT * 2, 0.022, cabD - 0.036)),
      darkOak.veneer
    );
    carcassFloor.name = 'familyBathroom.darkOakVanityUnit.carcassFloor';
    carcassFloor.position.set(alcoveCx, bodyBotY + 0.011, cabCenterZ + 0.008);
    vanityGroup.add(carcassFloor);

    // Front in-frame face frame stiles & rails on cabFrontZ
    const stileW = 0.052;
    const frontFaceZ = cabFrontZ + 0.008;
    const outerStileGeo = prepGeo(new THREE.BoxGeometry(stileW, bodyH, 0.018));
    for (const [stName, sx] of [
      ['westStile', alcoveCx - cabW * 0.5 + stileW * 0.5],
      ['eastStile', alcoveCx + cabW * 0.5 - stileW * 0.5],
    ] as const) {
      const st = new THREE.Mesh(outerStileGeo, darkOak.veneer);
      st.name = `familyBathroom.darkOakVanityUnit.${stName}`;
      st.position.set(sx, bodyBotY + bodyH * 0.5, frontFaceZ);
      st.castShadow = true;
      vanityGroup.add(st);
    }

    const innerSpanW = cabW - stileW * 2;
    const railH = 0.044;
    const topRailY = floorTopY + cabH - railH * 0.5;
    const drawerOpeningH = 0.148;
    const midRailY = floorTopY + cabH - railH - drawerOpeningH - railH * 0.5;
    const botRailY = bodyBotY + railH * 0.5;

    const horizRailGeo = prepGeo(new THREE.BoxGeometry(innerSpanW, railH, 0.018));
    for (const [rName, ry] of [
      ['topRail', topRailY],
      ['midRail', midRailY],
      ['bottomRail', botRailY],
    ] as const) {
      const rail = new THREE.Mesh(horizRailGeo, darkOak.veneer);
      rail.name = `familyBathroom.darkOakVanityUnit.${rName}`;
      rail.position.set(alcoveCx, ry, frontFaceZ);
      rail.castShadow = true;
      vanityGroup.add(rail);
    }

    // Recessed shadow gap plate behind drawer & twin doors so beaded joints read crisply
    const shadowBack = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(innerSpanW, bodyH - railH * 2, 0.008)),
      darkOak.shadowReveal
    );
    shadowBack.name = 'familyBathroom.darkOakVanityUnit.inFrameShadowReveal';
    shadowBack.position.set(alcoveCx, bodyBotY + bodyH * 0.5, frontFaceZ + 0.005);
    vanityGroup.add(shadowBack);

    // Top wide in-frame false-drawer fascia + recessed fielded panel + central Polished Brass knob
    const drawerY = floorTopY + cabH - railH - drawerOpeningH * 0.5;
    const drawerBorder = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(innerSpanW - 0.008, drawerOpeningH - 0.006, 0.014)),
      darkOak.veneer
    );
    drawerBorder.name = 'familyBathroom.darkOakVanityUnit.topDrawerFascia';
    drawerBorder.position.set(alcoveCx, drawerY, frontFaceZ - 0.002);
    drawerBorder.castShadow = true;
    vanityGroup.add(drawerBorder);

    const drawerField = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(innerSpanW - 0.078, drawerOpeningH - 0.062, 0.008)),
      darkOak.panelField
    );
    drawerField.name = 'familyBathroom.darkOakVanityUnit.topDrawerPanel';
    drawerField.position.set(alcoveCx, drawerY, frontFaceZ - 0.007);
    vanityGroup.add(drawerField);

    // Twin lower in-frame Shaker/fielded doors + paired central Polished Brass round knobs
    const doorTopEdge = midRailY - railH * 0.5 - 0.004;
    const doorBotEdge = botRailY + railH * 0.5 + 0.004;
    const doorH = doorTopEdge - doorBotEdge;
    const doorCenterY = (doorTopEdge + doorBotEdge) * 0.5;
    const singleDoorW = (innerSpanW - 0.012) * 0.5;
    const doorStileW = 0.056;

    const knobRoseGeo = prepGeo(new THREE.CylinderGeometry(0.011, 0.013, 0.006, 16));
    const knobStemGeo = prepGeo(new THREE.CylinderGeometry(0.005, 0.006, 0.014, 14));
    const knobBallGeo = prepGeo(new THREE.SphereGeometry(0.0135, 16, 12));

    const addBrassCabinetKnob = (kName: string, kx: number, ky: number): void => {
      const rose = new THREE.Mesh(knobRoseGeo, brBrass.primary);
      rose.name = `${kName}.rose`;
      rose.userData.lodTier = 'high';
      rose.userData.lodMaxDistance = 12;
      rose.rotation.x = Math.PI * 0.5;
      rose.position.set(kx, ky, frontFaceZ - 0.011);
      vanityGroup.add(rose);

      const stem = new THREE.Mesh(knobStemGeo, brBrass.primary);
      stem.name = `${kName}.stem`;
      stem.userData.lodTier = 'high';
      stem.userData.lodMaxDistance = 12;
      stem.rotation.x = Math.PI * 0.5;
      stem.position.set(kx, ky, frontFaceZ - 0.019);
      vanityGroup.add(stem);

      const ball = new THREE.Mesh(knobBallGeo, brBrass.primary);
      ball.name = `${kName}.knob`;
      ball.userData.lodTier = 'high';
      ball.userData.lodMaxDistance = 12;
      ball.scale.set(1, 1, 0.78);
      ball.position.set(kx, ky, frontFaceZ - 0.029);
      vanityGroup.add(ball);
    };

    addBrassCabinetKnob('familyBathroom.darkOakVanityUnit.drawerKnob', alcoveCx, drawerY);

    for (const [dName, sideSign] of [
      ['westDoor', -1],
      ['eastDoor', 1],
    ] as const) {
      const dx = alcoveCx + sideSign * (singleDoorW * 0.5 + 0.002);
      const dStileGeo = prepGeo(new THREE.BoxGeometry(doorStileW, doorH, 0.015));
      for (const [sSub, sxOff] of [
        ['leftStile', -singleDoorW * 0.5 + doorStileW * 0.5],
        ['rightStile', singleDoorW * 0.5 - doorStileW * 0.5],
      ] as const) {
        const ds = new THREE.Mesh(dStileGeo, darkOak.veneer);
        ds.name = `familyBathroom.darkOakVanityUnit.${dName}.${sSub}`;
        ds.position.set(dx + sxOff, doorCenterY, frontFaceZ - 0.002);
        ds.castShadow = true;
        vanityGroup.add(ds);
      }

      const dRailGeo = prepGeo(
        new THREE.BoxGeometry(singleDoorW - doorStileW * 2, doorStileW, 0.015)
      );
      for (const [rSub, syOff] of [
        ['topRail', doorH * 0.5 - doorStileW * 0.5],
        ['bottomRail', -doorH * 0.5 + doorStileW * 0.5],
      ] as const) {
        const dr = new THREE.Mesh(dRailGeo, darkOak.veneer);
        dr.name = `familyBathroom.darkOakVanityUnit.${dName}.${rSub}`;
        dr.position.set(dx, doorCenterY + syOff, frontFaceZ - 0.002);
        dr.castShadow = true;
        vanityGroup.add(dr);
      }

      const dPanel = new THREE.Mesh(
        prepGeo(
          new THREE.BoxGeometry(
            singleDoorW - doorStileW * 2 + 0.008,
            doorH - doorStileW * 2 + 0.008,
            0.009
          )
        ),
        darkOak.panelField
      );
      dPanel.name = `familyBathroom.darkOakVanityUnit.${dName}.fieldedPanel`;
      dPanel.position.set(dx, doorCenterY, frontFaceZ + 0.001);
      vanityGroup.add(dPanel);

      addBrassCabinetKnob(
        `familyBathroom.darkOakVanityUnit.${dName}Knob`,
        alcoveCx + sideSign * 0.036,
        doorCenterY + 0.045
      );
    }

    // 25mm Honed Bianco Carrara Marble Countertop with true oval undermount basin cutout!
    const topW = 0.966; // spans wall-to-wall across the 970mm alcove
    const topD = 0.538; // overhangs cabinet front cleanly by 13mm
    const bowlHalfW = 0.225; // 450mm x 310mm oval undermount opening
    const bowlHalfD = 0.155;
    const bowlLocalCenterZ = 0.032; // shifted slightly forward to leave generous rear 3-hole tap deck

    const slabShape = new THREE.Shape();
    slabShape.moveTo(-topW * 0.5, -topD * 0.5);
    slabShape.lineTo(topW * 0.5, -topD * 0.5);
    slabShape.lineTo(topW * 0.5, topD * 0.5);
    slabShape.lineTo(-topW * 0.5, topD * 0.5);
    slabShape.closePath();

    const holePath = new THREE.Path();
    const holeSegs = 40;
    for (let i = 0; i <= holeSegs; i++) {
      const ang = (i / holeSegs) * Math.PI * 2;
      const hx = Math.cos(ang) * bowlHalfW;
      const hy = bowlLocalCenterZ + Math.sin(ang) * bowlHalfD;
      if (i === 0) holePath.moveTo(hx, hy);
      else holePath.lineTo(hx, hy);
    }
    slabShape.holes.push(holePath);

    const marbleTopGeo = prepGeo(
      new THREE.ExtrudeGeometry(slabShape, {
        depth: topSlabH,
        bevelEnabled: true,
        bevelThickness: 0.002,
        bevelSize: 0.002,
        bevelSegments: 2,
        curveSegments: 32,
      })
    );
    marbleTopGeo.rotateX(-Math.PI * 0.5);
    const marbleTop = new THREE.Mesh(marbleTopGeo, carraraMat);
    marbleTop.name = 'familyBathroom.darkOakVanityUnit.carraraCountertop';
    marbleTop.position.set(alcoveCx, floorTopY + cabH, alcoveRearZ - topD * 0.5);
    marbleTop.castShadow = true;
    marbleTop.receiveShadow = true;
    vanityGroup.add(marbleTop);

    // Shaped Honed Carrara Marble Heritage Splashback Upstand (matching Slide 3 scooped ends!)
    const upstandW = 0.57;
    const upstandH = 0.095;
    const upShape = new THREE.Shape();
    upShape.moveTo(-upstandW * 0.5, 0);
    upShape.lineTo(upstandW * 0.5, 0);
    upShape.lineTo(upstandW * 0.5, upstandH * 0.52);
    upShape.quadraticCurveTo(upstandW * 0.5 - 0.055, upstandH * 0.54, upstandW * 0.5 - 0.068, upstandH);
    upShape.lineTo(-upstandW * 0.5 + 0.068, upstandH);
    upShape.quadraticCurveTo(-upstandW * 0.5 + 0.055, upstandH * 0.54, -upstandW * 0.5, upstandH * 0.52);
    upShape.closePath();

    const upstandGeo = prepGeo(
      new THREE.ExtrudeGeometry(upShape, {
        depth: 0.02,
        bevelEnabled: true,
        bevelThickness: 0.0015,
        bevelSize: 0.0015,
        bevelSegments: 2,
      })
    );
    const marbleUpstand = new THREE.Mesh(upstandGeo, carraraMat);
    marbleUpstand.name = 'familyBathroom.darkOakVanityUnit.carraraUpstand';
    marbleUpstand.position.set(alcoveCx, counterTopY, alcoveRearZ - 0.036);
    marbleUpstand.castShadow = true;
    vanityGroup.add(marbleUpstand);

    // Glazed-White Vitreous China Undermount Basin Bowl + Polished Brass Clicker Waste
    const bowlWorldZ = alcoveRearZ - topD * 0.5 - bowlLocalCenterZ; // -0.311m
    const bowlDepth = 0.165;
    const bowlSides = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(1, 0.72, bowlDepth, 36, 1, true)),
      chinaMat
    );
    bowlSides.scale.set(bowlHalfW + 0.006, 1, bowlHalfD + 0.006);
    bowlSides.material = chinaMat.clone();
    bowlSides.material.side = THREE.DoubleSide;
    bowlSides.name = 'familyBathroom.darkOakVanityUnit.undermountBasinWalls';
    bowlSides.position.set(alcoveCx, counterTopY - topSlabH - bowlDepth * 0.5 + 0.004, bowlWorldZ);
    bowlSides.receiveShadow = true;
    vanityGroup.add(bowlSides);

    const bowlFloor = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(1, 1, 0.012, 36)),
      chinaMat
    );
    bowlFloor.scale.set((bowlHalfW + 0.006) * 0.73, 1, (bowlHalfD + 0.006) * 0.73);
    bowlFloor.name = 'familyBathroom.darkOakVanityUnit.undermountBasinBase';
    bowlFloor.position.set(alcoveCx, counterTopY - topSlabH - bowlDepth + 0.004, bowlWorldZ);
    bowlFloor.receiveShadow = true;
    vanityGroup.add(bowlFloor);

    const basinWaste = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.031, 0.031, 0.005, 24)),
      brBrass.primary
    );
    basinWaste.name = 'familyBathroom.darkOakVanityUnit.brassClickerWaste';
    basinWaste.userData.lodTier = 'high';
    basinWaste.userData.lodMaxDistance = 12;
    basinWaste.position.set(alcoveCx, counterTopY - topSlabH - bowlDepth + 0.012, bowlWorldZ);
    vanityGroup.add(basinWaste);

    // Perrin & Rowe Traditional 3705BR 3-Hole Deck Basin Mixer w/ White Porcelain Levers
    const deckMixer = buildArmstrongDeck3HoleBasinMixer({
      namePrefix: 'familyBathroom.darkOakVanityUnit.basinMixer3705BR',
      finish: 'BR',
      style: 'traditional',
      valveSpreadM: 0.2,
    });
    deckMixer.position.set(alcoveCx, counterTopY, alcoveRearZ - 0.102);
    deckMixer.rotation.y = wallFacingToRotY('north');
    vanityGroup.add(deckMixer);

    scene.add(vanityGroup);

    // =========================================================================
    // 2. FULL-HEIGHT BUILT-IN DARK OAK SHELVING & BEVELLED MIRROR BEHIND/ABOVE (#4 & #8)
    //    Spans Y = 3.010m (countertop) right up to Y = 4.650m (collarCeilingY)!
    // =========================================================================
    const upperJoinery = new THREE.Group();
    upperJoinery.name = 'familyBathroom.vanityFullHeightJoinery';
    upperJoinery.userData.tradeCategory = 'sanitary';

    const joineryW = 0.966; // X = -10.768 .. -9.802m
    const joineryH = collarCeilingY - counterTopY; // 1.640m full-height to ceiling!
    const sideColW = 0.192; // flanking left & right open apothecary shelving columns
    const sideColD = 0.155; // Z = -0.01 .. -0.165m (clear of central basin & 3-hole mixer!)
    const mirrorBayW = joineryW - sideColW * 2; // 0.582m generous central mirror bay
    const mirrorSoffitY = 4.08; // upper full-width shelving spans 4.08m .. 4.65m

    // Full-height dark-oak panelled backer against Z = -0.01m
    const rearBacker = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(joineryW, joineryH, 0.016)),
      darkOak.panelField
    );
    rearBacker.name = 'familyBathroom.vanityFullHeightJoinery.rearBacker';
    rearBacker.position.set(alcoveCx, counterTopY + joineryH * 0.5, alcoveRearZ - 0.008);
    rearBacker.receiveShadow = true;
    upperJoinery.add(rearBacker);

    // 4 full-height vertical dark-oak dividers (outer cheeks + inner mirror-bay cheeks)
    const cheekThickness = 0.022;
    const fullVertGeo = prepGeo(new THREE.BoxGeometry(cheekThickness, joineryH - 0.048, sideColD));
    for (const [vName, vx] of [
      ['westOuterCheek', alcoveCx - joineryW * 0.5 + cheekThickness * 0.5],
      ['westMirrorDivider', alcoveCx - mirrorBayW * 0.5 - cheekThickness * 0.5],
      ['eastMirrorDivider', alcoveCx + mirrorBayW * 0.5 + cheekThickness * 0.5],
      ['eastOuterCheek', alcoveCx + joineryW * 0.5 - cheekThickness * 0.5],
    ] as const) {
      const vDiv = new THREE.Mesh(fullVertGeo, darkOak.veneer);
      vDiv.name = `familyBathroom.vanityFullHeightJoinery.${vName}`;
      vDiv.position.set(vx, counterTopY + (joineryH - 0.048) * 0.5, alcoveRearZ - sideColD * 0.5);
      vDiv.castShadow = true;
      vDiv.receiveShadow = true;
      upperJoinery.add(vDiv);
    }

    // Central Bevelled Mirror (Y = 3.105m .. 4.08m) w/ Polished Brass inner sight-edge beading
    const mirrorBotY = counterTopY + upstandH; // 3.105m right atop the shaped Carrara upstand
    const mirrorH = mirrorSoffitY - mirrorBotY; // 0.975m tall!
    const mirrorCy = (mirrorBotY + mirrorSoffitY) * 0.5;

    const brassMirrorBead = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(mirrorBayW - 0.012, mirrorH - 0.012, 0.014)),
      brBrass.primary
    );
    brassMirrorBead.name = 'familyBathroom.mirrorFrame';
    brassMirrorBead.position.set(alcoveCx, mirrorCy, alcoveRearZ - 0.023);
    upperJoinery.add(brassMirrorBead);

    const mirrorGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xe6eef2,
      roughness: 0.04,
      metalness: 0.88,
      clearcoat: 0.9,
      clearcoatRoughness: 0.04,
    });
    const mirrorPane = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(mirrorBayW - 0.032, mirrorH - 0.032, 0.008)),
      mirrorGlassMat
    );
    mirrorPane.name = 'familyBathroom.mirror';
    mirrorPane.position.set(alcoveCx, mirrorCy, alcoveRearZ - 0.031);
    upperJoinery.add(mirrorPane);

    // Flanking Left & Right Open Dark-Oak Apothecary Shelves (Y = 3.38, 3.73, 4.08, 4.35m)
    const sideBayInnerW = sideColW - cheekThickness * 2 + 0.004;
    const sideShelfGeo = prepGeo(new THREE.BoxGeometry(sideBayInnerW, 0.02, sideColD - 0.008));
    const galleryBarGeo = prepGeo(new THREE.CylinderGeometry(0.0032, 0.0032, sideBayInnerW, 10));

    const amberJarMat = new THREE.MeshPhysicalMaterial({
      color: 0x6b3815,
      roughness: 0.14,
      clearcoat: 0.72,
    });
    const stonewareMat = new THREE.MeshStandardMaterial({
      color: 0xe7e1d4,
      roughness: 0.62,
      metalness: 0.02,
    });

    for (const [sideTag, bayCx] of [
      ['west', alcoveCx - mirrorBayW * 0.5 - sideColW * 0.5],
      ['east', alcoveCx + mirrorBayW * 0.5 + sideColW * 0.5],
    ] as const) {
      for (const [sIdx, sy] of [3.38, 3.73, 4.08, 4.35].entries()) {
        const shelf = new THREE.Mesh(sideShelfGeo, darkOak.veneer);
        shelf.name = `familyBathroom.vanityFullHeightJoinery.${sideTag}Shelf_${sIdx + 1}`;
        shelf.position.set(bayCx, sy, alcoveRearZ - sideColD * 0.5);
        shelf.castShadow = true;
        shelf.receiveShadow = true;
        upperJoinery.add(shelf);

        // Delicate Polished Brass apothecary gallery retain rail
        const rail = new THREE.Mesh(galleryBarGeo, brBrass.primary);
        rail.name = `familyBathroom.vanityFullHeightJoinery.${sideTag}ShelfRail_${sIdx + 1}`;
        rail.userData.lodTier = 'high';
        rail.userData.lodMaxDistance = 12;
        rail.rotation.z = Math.PI * 0.5;
        rail.position.set(bayCx, sy + 0.024, alcoveRearZ - sideColD + 0.018);
        upperJoinery.add(rail);

        const topY = sy + 0.01;
        if (sIdx === 0) {
          // Amber apothecary glass dispenser + stoneware pot
          const bottle = new THREE.Mesh(
            prepGeo(new THREE.CylinderGeometry(0.024, 0.024, 0.13, 14)),
            amberJarMat
          );
          bottle.name = `familyBathroom.vanityFullHeightJoinery.${sideTag}Bottle`;
          bottle.userData.lodTier = 'high';
          bottle.userData.lodMaxDistance = 12;
          bottle.position.set(bayCx - 0.026, topY + 0.065, alcoveRearZ - 0.09);
          upperJoinery.add(bottle);

          const jar = new THREE.Mesh(
            prepGeo(new THREE.CylinderGeometry(0.026, 0.024, 0.078, 14)),
            stonewareMat
          );
          jar.name = `familyBathroom.vanityFullHeightJoinery.${sideTag}Jar`;
          jar.userData.lodTier = 'high';
          jar.userData.lodMaxDistance = 12;
          jar.position.set(bayCx + 0.032, topY + 0.039, alcoveRearZ - 0.095);
          upperJoinery.add(jar);
        } else if (sIdx === 1) {
          // Rolled waffle hand towels
          const rollGeo = prepGeo(new THREE.CylinderGeometry(0.028, 0.028, 0.11, 14));
          for (const [rIdx, rxOff] of [-0.028, 0.028].entries()) {
            const roll = new THREE.Mesh(
              rollGeo,
              rIdx === 0 ? textiles.ivoryWaffleRobe : textiles.oatmealWaffleRobe
            );
            roll.name = `familyBathroom.vanityFullHeightJoinery.${sideTag}TowelRoll_${rIdx + 1}`;
            roll.userData.lodTier = 'high';
            roll.userData.lodMaxDistance = 12;
            roll.rotation.x = Math.PI * 0.5;
            roll.position.set(bayCx + rxOff, topY + 0.028, alcoveRearZ - 0.088);
            upperJoinery.add(roll);
          }
        }
      }
    }

    // Overhead Full-Width Mirror Soffit Shelf (Y = 4.08m) + Upper Open Shelf (Y = 4.35m) + Crown Cornice at Y = 4.65m!
    const centerShelfGeo = prepGeo(new THREE.BoxGeometry(mirrorBayW + 0.004, 0.024, sideColD + 0.015));
    for (const [cIdx, cy] of [mirrorSoffitY, 4.35].entries()) {
      const cShelf = new THREE.Mesh(centerShelfGeo, darkOak.veneer);
      cShelf.name = `familyBathroom.vanityFullHeightJoinery.centerOverheadShelf_${cIdx + 1}`;
      cShelf.position.set(alcoveCx, cy, alcoveRearZ - (sideColD + 0.015) * 0.5);
      cShelf.castShadow = true;
      cShelf.receiveShadow = true;
      upperJoinery.add(cShelf);
    }

    // Subtle warm architectural LED wash strip recessed beneath the Y = 4.08m mirror soffit
    const warmWashMat = new THREE.MeshStandardMaterial({
      color: 0xfff3d8,
      emissive: 0xffd088,
      emissiveIntensity: 0.75,
      roughness: 0.25,
    });
    const mirrorLedStrip = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(mirrorBayW - 0.06, 0.005, 0.014)),
      warmWashMat
    );
    mirrorLedStrip.name = 'familyBathroom.vanityFullHeightJoinery.mirrorSoffitLight';
    mirrorLedStrip.userData.lodTier = 'high';
    mirrorLedStrip.userData.lodMaxDistance = 12;
    mirrorLedStrip.position.set(alcoveCx, mirrorSoffitY - 0.014, alcoveRearZ - 0.11);
    upperJoinery.add(mirrorLedStrip);

    // Folded waffle bath sheets & seagrass basket on the overhead center shelves
    const foldedStackGeo = prepGeo(new THREE.BoxGeometry(0.22, 0.042, 0.125));
    for (const [stIdx, mat] of [textiles.oatmealWaffleRobe, textiles.ivoryWaffleRobe].entries()) {
      const stack = new THREE.Mesh(foldedStackGeo, mat);
      stack.name = `familyBathroom.vanityFullHeightJoinery.foldedBathSheet_${stIdx + 1}`;
      stack.position.set(alcoveCx - 0.13, mirrorSoffitY + 0.033 + stIdx * 0.043, alcoveRearZ - 0.09);
      stack.castShadow = true;
      upperJoinery.add(stack);
    }
    const basketMat = new THREE.MeshStandardMaterial({
      color: 0xb9996d,
      roughness: 0.84,
      metalness: 0.0,
    });
    const wovenBasket = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(0.21, 0.135, 0.13)),
      basketMat
    );
    wovenBasket.name = 'familyBathroom.vanityFullHeightJoinery.wovenStorageBasket';
    wovenBasket.position.set(alcoveCx + 0.135, mirrorSoffitY + 0.08, alcoveRearZ - 0.09);
    wovenBasket.castShadow = true;
    upperJoinery.add(wovenBasket);

    // Molded Dark Oak Crown Cornice meeting the Y = 4.65m ceiling flush (0mm gap!)
    const corniceFrieze = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(joineryW, 0.048, sideColD + 0.016)),
      darkOak.veneer
    );
    corniceFrieze.name = 'familyBathroom.vanityFullHeightJoinery.crownFrieze';
    corniceFrieze.position.set(alcoveCx, collarCeilingY - 0.024, alcoveRearZ - (sideColD + 0.016) * 0.5);
    corniceFrieze.castShadow = true;
    upperJoinery.add(corniceFrieze);

    const corniceCrown = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(joineryW + 0.004, 0.022, sideColD + 0.036)),
      darkOak.veneer
    );
    corniceCrown.name = 'familyBathroom.vanityFullHeightJoinery.crownCornice';
    corniceCrown.position.set(alcoveCx, collarCeilingY - 0.011, alcoveRearZ - (sideColD + 0.036) * 0.5);
    corniceCrown.castShadow = true;
    upperJoinery.add(corniceCrown);

    scene.add(upperJoinery);
  }

  // =========================================================================
  // 3. GSI CLASSIC CLOSE-COUPLED SWIRLFLUSH® WC + STEPPED CERAMIC CISTERN (#14)
  //    871211 Pan + 878111 Stepped Cistern + P&R 6796BR Brass/Porcelain Lever + Walnut Seat
  // =========================================================================
  const heritageVortexWc = buildLefroyBrooksCharterhouseWc({
    namePrefix: 'familyBathroom.gsiSwirlflushWc',
    finish: 'BR',
    variant: 'closeCoupled',
    collection: 'gsiClassicSwirlflush',
    seatFinish: 'walnut',
    leverStyle: 'traditional',
  });
  heritageVortexWc.position.set(-10.18, floorTopY, -2.5 + 0.0138);
  heritageVortexWc.rotation.y = wallFacingToRotY('south');
  scene.add(heritageVortexWc);

  // =========================================================================
  // 4. P&R 6960BR TOILET ROLL HOLDER + 2x 6921BR ROBE HOOKS & HANGING ROBES ON WEST WALL (#12)
  // =========================================================================
  const paperHolder = buildArmstrongPaperHolder({
    namePrefix: 'familyBathroom.paperHolder',
    finish: 'BR',
    style: 'traditional',
  });
  paperHolder.position.set(-9.8 - 0.0138, floorTopY + 0.66, -2.02);
  paperHolder.rotation.y = wallFacingToRotY('west');
  scene.add(paperHolder);

  // Relocated onto East face of `firstFloor.interiorWall.6` (`X = -12.81m`, North of enlarged shower!)
  for (const [hookSuffix, hookZ, robeMat, trimMat] of [
    ['north', -1.24, textiles.ivoryWaffleRobe, textiles.oatmealWaffleRobe],
    ['south', -0.92, textiles.oatmealWaffleRobe, textiles.ivoryWaffleRobe],
  ] as const) {
    const hookY = floorTopY + 1.52; // 3.68m — right on Annotation #12's Y = 3.655m!
    const robeHook = buildArmstrongRobeHook({
      namePrefix: `familyBathroom.robeHook.${hookSuffix}`,
      finish: 'BR',
      style: 'traditional',
    });
    robeHook.position.set(-12.81 + 0.012, hookY, hookZ);
    robeHook.rotation.y = wallFacingToRotY('east');
    scene.add(robeHook);

    const hangingRobe = buildHangingWaffleBathrobe(
      `familyBathroom.hangingRobe.${hookSuffix}`,
      robeMat,
      trimMat
    );
    // Shift +21mm clear East of the -12.7858m dado rail front nose so 0.0mm of dado rail clips through the fabric!
    hangingRobe.position.set(-12.81 + 0.034, hookY, hookZ);
    scene.add(hangingRobe);
  }
}
