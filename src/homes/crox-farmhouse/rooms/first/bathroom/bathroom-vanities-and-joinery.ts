import * as THREE from 'three';
import {
  buildArmstrongPaperHolder,
  buildArmstrongRobeHook,
  buildLefroyBrooksCharterhouseWc,
  buildLefroyBrooksLissaDoonWashstand,
  getBathroomBrassMaterials,
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
 * Builds the Principal / Master Bathroom (`familyBathroom`, Room 17):
 * - Open-legged Polished Brass (`BR`) console washstand w/ 3TH heritage ceramic basin, Perrin & Rowe
 *   `3705BR` Traditional 3-hole deck basin mixer (porcelain levers & pop-up waste) & exposed `6303BR` bottle trap
 * - Balineum `Mercer` Unlacquered Brass `H24BHB95345` wall mirror
 * - `GSI Classic Swirlflush®` (`871411`) heritage vortex WC + P&R `6797BR` Traditional Brass/Porcelain concealed lever + Walnut timber seat w/ Brass hinges
 * - `1x 6960BR` Traditional Pivot Toilet Roll Holder + `2x 6921BR` Traditional Robe Hooks
 */
export function buildFamilyBathroomVanityAndToilet(
  scene: THREE.Group,
  kit: FamilyBathroomVanityAndToiletKit
): void {
  const { floorTopY } = kit;
  const brBrass = getBathroomBrassMaterials('BR');

  // 1. Open-Legged Solid Polished Brass (`BR`) Console Washstand + 3TH Heritage Ceramic Basin (`760mm W x 510mm D x 850mm H`)
  //    Centered in the 970mm SE Bulkhead alcove (`X = -10.285m, Z = -0.01m`, facing North `-Z`)
  //    Includes Perrin & Rowe `3705BR` Traditional 3-Hole Deck Mixer w/ Porcelain Levers & Pop-Up Waste + exposed `6303BR` Bottle Trap!
  const masterWashstand = buildLefroyBrooksLissaDoonWashstand({
    namePrefix: 'familyBathroom.brassConsoleWashstand',
    finish: 'BR',
    widthM: 0.76,
    depthM: 0.51,
    rimHeightM: 0.85,
    tapHoles: 3,
    includeDeckMixer: true,
    mixerStyle: 'traditional',
    mountVariant: 'consoleLegs',
  });
  masterWashstand.position.set(-10.285, floorTopY, -0.01);
  masterWashstand.rotation.y = wallFacingToRotY('north');
  scene.add(masterWashstand);

  // 2. Balineum Mercer Unlacquered Brass (`H24BHB95345`) Wall Mirror above washstand
  const mirrorGroup = new THREE.Group();
  mirrorGroup.name = 'familyBathroom.vanityMirror';

  const mirrorGlassMat = new THREE.MeshStandardMaterial({
    color: 0xdce6eb,
    roughness: 0.1,
    metalness: 0.22,
  });
  const mirrorCenterY = floorTopY + 1.52;

  const mirrorFrameGeo = new THREE.BoxGeometry(0.68, 0.78, 0.026);
  mirrorFrameGeo.computeBoundingSphere();
  const mirrorFrame = new THREE.Mesh(mirrorFrameGeo, brBrass.primary);
  mirrorFrame.name = 'familyBathroom.mirrorFrame';
  mirrorFrame.position.set(-10.285, mirrorCenterY, -0.025);
  mirrorFrame.castShadow = true;
  mirrorGroup.add(mirrorFrame);

  const mirrorSurfaceGeo = new THREE.BoxGeometry(0.62, 0.72, 0.008);
  mirrorSurfaceGeo.computeBoundingSphere();
  const mirrorSurface = new THREE.Mesh(mirrorSurfaceGeo, mirrorGlassMat);
  mirrorSurface.name = 'familyBathroom.mirror';
  mirrorSurface.position.set(-10.285, mirrorCenterY, -0.036);
  mirrorGroup.add(mirrorSurface);

  scene.add(mirrorGroup);

  // 3. GSI Classic Swirlflush® (`871411` BTW) Heritage Vortex WC + P&R `6797BR` Traditional Brass Concealed Lever + Walnut Timber Seat w/ Brass Hinges
  const heritageVortexWc = buildLefroyBrooksCharterhouseWc({
    namePrefix: 'familyBathroom.gsiSwirlflushWc',
    finish: 'BR',
    variant: 'backToWallVortex',
    collection: 'gsiClassicSwirlflush',
    seatFinish: 'walnut',
    concealedLeverYM: 0.86,
    concealedLeverXM: 0.135,
    leverStyle: 'traditional',
  });
  heritageVortexWc.position.set(-10.18, floorTopY, -2.5);
  heritageVortexWc.rotation.y = wallFacingToRotY('south');
  scene.add(heritageVortexWc);

  // 4. Perrin & Rowe Traditional `BR` Accessories (`1x 6960BR` Pivot Paper Holder + `2x 6921BR` Robe Hooks)
  const paperHolder = buildArmstrongPaperHolder({
    namePrefix: 'familyBathroom.paperHolder',
    finish: 'BR',
    style: 'traditional',
  });
  paperHolder.position.set(-9.8, floorTopY + 0.66, -2.05);
  paperHolder.rotation.y = wallFacingToRotY('west');
  scene.add(paperHolder);

  for (const [hookSuffix, hookZ] of [
    ['north', 0.25],
    ['south', 0.55],
  ] as const) {
    const robeHook = buildArmstrongRobeHook({
      namePrefix: `familyBathroom.robeHook.${hookSuffix}`,
      finish: 'BR',
      style: 'traditional',
    });
    robeHook.position.set(-10.77, floorTopY + 1.68, hookZ);
    robeHook.rotation.y = wallFacingToRotY('west');
    scene.add(robeHook);
  }
}
