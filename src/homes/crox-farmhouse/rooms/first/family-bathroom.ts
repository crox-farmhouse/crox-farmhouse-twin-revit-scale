import * as THREE from 'three';
import { addCasedArchitravePortal } from '../../../../engine/geometry/index.ts';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import type { createFirstFloorMaterials } from '../../structure/first-floor-materials.ts';
import type { createFirstFloorShellKit } from '../../structure/first-floor-shell-kit.ts';

/**
 * Family Bathroom (`familyBathroom`) and upper south passage.
 *
 * Extracted verbatim from `buildMainHouseFirstFloorAndRoof` (first-floor-rooms.ts). Statement order and
 * geometry are unchanged; shared locals flow in via `kit` and out via the return value.
 */
export function buildFamilyBathroom(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'antiqueOakSkirtingMat' | 'bathroomTileMat' | 'brassMat' | 'ceramicWhiteMat' | 'floorTopY' | 'oakFloorMat' | 'upperWallTopY' | 'wardrobeMat' | 'warmRoomPlasterMat' | 'windowGlassMat'> &
    Pick<ReturnType<typeof createFirstFloorShellKit>, 'addFirstFloorSlab' | 'addShakerWardrobeDoor' | 'addUpperBrickWallAlongXWithWindow' | 'addUpperInteractiveDoor' | 'addUpperInteriorWall' | 'doorH'>
): void {
  const { firstFloorMeshGroup: scene } = ctx;
  const {
    addFirstFloorSlab,
    addUpperBrickWallAlongXWithWindow,
    addUpperInteractiveDoor,
    addUpperInteriorWall,
    antiqueOakSkirtingMat,
    bathroomTileMat,
    brassMat,
    ceramicWhiteMat,
    doorH,
    floorTopY,
    oakFloorMat,
    upperWallTopY,
    wardrobeMat,
    warmRoomPlasterMat,
    windowGlassMat,
  } = kit;
  // =========================================================================
  // 2. PRINCIPAL FAMILY BATHROOM & UPPER PASSAGE
  //    Directly above Boot Lobby / Store / WC: X = -9.80m..-12.81m, Z = -2.50m..+2.40m
  // =========================================================================
  // Bathroom tiled floor (Z = -2.50m..+0.98m) & Upper South Passage oak floor (Z = +0.98m..+2.40m)
  // Extended across [-13.05, -9.56] so both 0.24m cross-wall doorway thresholds have continuous oak flooring (Issues #9 & #10)
  addFirstFloorSlab(-12.81, -9.8, -2.5, 0.98, bathroomTileMat);
  addFirstFloorSlab(-13.05, -9.56, 0.98, 2.4, oakFloorMat);

  // North Exterior Brick Wall of Family Bathroom (Z = -2.78m..-2.50m, X = -12.81m..-9.56m)
  // Skirting clamped to [-12.81, -9.80] so it butts cleanly against the Cross-Wall West face (Issues #2 & #7)
  addUpperBrickWallAlongXWithWindow(
    -12.81,
    -9.56,
    -2.78,
    -2.5,
    -11.35,
    1.05,
    3.02,
    3.94,
    'south',
    2,
    { skirtingMin: -12.81, skirtingMax: -9.8 }
  );

  // South Courtyard Exterior Brick Wall of Upper Passage (Z = +2.40m..+2.68m, X = -12.81m..-9.56m)
  // Skirting clamped to [-12.81, -9.80] so it never pokes through the Main Bedroom cross-wall corner (Issue #2!)
  addUpperBrickWallAlongXWithWindow(
    -12.81,
    -9.56,
    2.4,
    2.68,
    -12.05,
    0.76,
    3.06,
    3.9,
    'north',
    1,
    { skirtingMin: -12.81, skirtingMax: -9.8 }
  );

  const collarCeilingY = 4.52;

  // =========================================================================
  // BESPOKE HOTEL DRINKS & REFRESHMENT CABINET (`X = -10.68m..-9.80m, Z = +0.05m..+1.05m`) (Issue #11)
  // Open recessed hospitality cabinet facing South (`+Z`) into the Upper South Passage
  // right outside the Main Bedroom doorway, equipped with:
  // - Under-counter glazed Wine & Beverage Cooler stocked with San Pellegrino,
  //   Fiji Water, cans of DASH sparkling water, and chilled Champagne
  // - Honed Carrara marble countertop & backsplash
  // - Compact luxury espresso/pod Coffee Machine, hospitality tray & glassware shelves
  // =========================================================================
  // North & West enclosing walls of the Recessed Drinks Cabinet (reaching collarCeilingY = 4.52m, skirting only on Bathroom side)
  addUpperInteriorWall(-10.24, floorTopY, collarCeilingY, 0.05, 0.88, 0.12, warmRoomPlasterMat, {
    skirtingSides: [-1],
    skirtingMin: -10.62,
    skirtingMax: -9.8,
  });
  addUpperInteriorWall(-10.68, floorTopY, collarCeilingY, 0.515, 0.12, 0.93, warmRoomPlasterMat, {
    skirtingSides: [-1],
    skirtingMin: 0.01,
    skirtingMax: 0.9,
  });

  {
    const drinksGroup = new THREE.Group();
    drinksGroup.name = 'familyBathroom.drinksCabinet';

    const cx = -10.21; // Clear alcove X = -10.62m .. -9.80m (width = 0.82m)
    const cabW = 0.80;
    const cabH = upperWallTopY - floorTopY; // 2.08m

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
    const marbleMat = new THREE.MeshStandardMaterial({
      color: 0xf4f1ec,
      roughness: 0.25,
      metalness: 0.02,
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

    // 1. Recessed Joinery Back & Side Cheeks (`Z = 0.36m..1.03m`)
    const backPanel = new THREE.Mesh(
      new THREE.BoxGeometry(cabW, cabH, 0.04),
      wardrobeMat
    );
    backPanel.position.set(cx, floorTopY + cabH / 2, 0.38);
    drinksGroup.add(backPanel);

    for (const sideSign of [-1, 1] as const) {
      const cheek = new THREE.Mesh(
        new THREE.BoxGeometry(0.028, cabH, 0.66),
        wardrobeMat
      );
      cheek.position.set(cx + sideSign * (cabW / 2 - 0.014), floorTopY + cabH / 2, 0.70);
      drinksGroup.add(cheek);
    }

    // Top cornice header & base plinth
    const topHeader = new THREE.Mesh(
      new THREE.BoxGeometry(cabW + 0.02, 0.09, 0.68),
      wardrobeMat
    );
    topHeader.position.set(cx, upperWallTopY - 0.045, 0.71);
    drinksGroup.add(topHeader);

    const basePlinth = new THREE.Mesh(
      new THREE.BoxGeometry(cabW - 0.04, 0.08, 0.60),
      wardrobeMat
    );
    basePlinth.position.set(cx, floorTopY + 0.04, 0.70);
    drinksGroup.add(basePlinth);

    // 2. Under-Counter Glazed Wine & Beverage Cooler (`Y = floorTopY + 0.08m .. floorTopY + 0.87m`)
    const coolerGroup = new THREE.Group();
    coolerGroup.name = 'familyBathroom.drinksCabinet.wineCooler';
    const coolerW = 0.74;
    const coolerH = 0.79;
    const coolerY0 = floorTopY + 0.08;

    // Outer insulated cooler shell (top, bottom, left, right, back)
    const coolerBack = new THREE.Mesh(new THREE.BoxGeometry(coolerW, coolerH, 0.03), darkAnthraciteMat);
    coolerBack.position.set(cx, coolerY0 + coolerH / 2, 0.42);
    coolerGroup.add(coolerBack);

    const coolerTop = new THREE.Mesh(new THREE.BoxGeometry(coolerW, 0.035, 0.56), darkAnthraciteMat);
    coolerTop.position.set(cx, coolerY0 + coolerH - 0.0175, 0.70);
    coolerGroup.add(coolerTop);

    const coolerBottom = new THREE.Mesh(new THREE.BoxGeometry(coolerW, 0.045, 0.56), darkAnthraciteMat);
    coolerBottom.position.set(cx, coolerY0 + 0.0225, 0.70);
    coolerGroup.add(coolerBottom);

    for (const s of [-1, 1] as const) {
      const coolerSide = new THREE.Mesh(new THREE.BoxGeometry(0.035, coolerH, 0.56), darkAnthraciteMat);
      coolerSide.position.set(cx + s * (coolerW / 2 - 0.0175), coolerY0 + coolerH / 2, 0.70);
      coolerGroup.add(coolerSide);
    }

    // Internal warm LED light strip at top of wine cooler
    const coolerLed = new THREE.Mesh(new THREE.BoxGeometry(coolerW - 0.1, 0.008, 0.02), warmLedMat);
    coolerLed.position.set(cx, coolerY0 + coolerH - 0.04, 0.92);
    coolerGroup.add(coolerLed);

    // 3 Beechwood pull-out shelves inside the wine cooler
    const shelfYOffsets = [0.06, 0.29, 0.54];
    for (const sy of shelfYOffsets) {
      const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(coolerW - 0.08, 0.016, 0.46),
        beechShelfMat
      );
      shelf.position.set(cx, coolerY0 + sy, 0.70);
      coolerGroup.add(shelf);
    }

    // --- Shelf 1 (Bottom, Y = coolerY0 + 0.068): Chilled Champagne Bottles ---
    const champY = coolerY0 + 0.068 + 0.044;
    for (let i = 0; i < 5; i++) {
      const bx = cx - 0.24 + i * 0.12;
      const bottleGroup = new THREE.Group();
      bottleGroup.name = `familyBathroom.drinksCabinet.champagne_${i + 1}`;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.19, 14), champagneGlassMat);
      body.rotation.x = Math.PI / 2;
      body.position.set(bx, champY, 0.65);
      bottleGroup.add(body);

      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.040, 0.11, 14), champagneGlassMat);
      neck.rotation.x = Math.PI / 2;
      neck.position.set(bx, champY, 0.80);
      bottleGroup.add(neck);

      const foil = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.022, 0.065, 14), champagneFoilMat);
      foil.rotation.x = Math.PI / 2;
      foil.position.set(bx, champY, 0.86);
      bottleGroup.add(foil);

      const label = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.012, 0.075), ceramicWhiteMat);
      label.position.set(bx, champY + 0.038, 0.67);
      bottleGroup.add(label);
      coolerGroup.add(bottleGroup);
    }

    // --- Shelf 2 (Middle, Y = coolerY0 + 0.298): San Pellegrino (left) & Fiji Water (right) ---
    const midBottleY = coolerY0 + 0.298;
    // 4 San Pellegrino green glass bottles on the left
    for (let i = 0; i < 4; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = cx - 0.24 + col * 0.10;
      const bz = 0.84 - row * 0.14;
      const spGroup = new THREE.Group();
      spGroup.name = `familyBathroom.drinksCabinet.sanPellegrino_${i + 1}`;
      const spBody = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.034, 0.13, 14), sanPellegrinoGlassMat);
      spBody.position.set(bx, midBottleY + 0.065, bz);
      spGroup.add(spBody);
      const spNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.032, 0.065, 14), sanPellegrinoGlassMat);
      spNeck.position.set(bx, midBottleY + 0.162, bz);
      spGroup.add(spNeck);
      const spLabel = new THREE.Mesh(new THREE.CylinderGeometry(0.0345, 0.0345, 0.048, 14), sanPellegrinoLabelMat);
      spLabel.position.set(bx, midBottleY + 0.068, bz);
      spGroup.add(spLabel);
      const spStar = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.006), sanPellegrinoStarMat);
      spStar.position.set(bx, midBottleY + 0.068, bz + 0.033);
      spGroup.add(spStar);
      coolerGroup.add(spGroup);
    }
    // 4 Square Fiji Water bottles on the right
    for (let i = 0; i < 4; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const bx = cx + 0.12 + col * 0.10;
      const bz = 0.84 - row * 0.14;
      const fijiGroup = new THREE.Group();
      fijiGroup.name = `familyBathroom.drinksCabinet.fijiWater_${i + 1}`;
      const fijiBody = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.155, 0.064), fijiBottleMat);
      fijiBody.position.set(bx, midBottleY + 0.078, bz);
      fijiGroup.add(fijiBody);
      const fijiShoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.038, 0.038, 4), fijiBottleMat);
      fijiShoulder.rotation.y = Math.PI / 4;
      fijiShoulder.position.set(bx, midBottleY + 0.174, bz);
      fijiGroup.add(fijiShoulder);
      const fijiCap = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.016, 12), fijiLabelMat);
      fijiCap.position.set(bx, midBottleY + 0.20, bz);
      fijiGroup.add(fijiCap);
      const fijiFrontLabel = new THREE.Mesh(new THREE.BoxGeometry(0.054, 0.075, 0.004), fijiLabelMat);
      fijiFrontLabel.position.set(bx, midBottleY + 0.078, bz + 0.032);
      fijiGroup.add(fijiFrontLabel);
      const hibiscus = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.022, 0.005), fijiHibiscusMat);
      hibiscus.position.set(bx + 0.01, midBottleY + 0.062, bz + 0.034);
      fijiGroup.add(hibiscus);
      coolerGroup.add(fijiGroup);
    }

    // --- Shelf 3 (Top, Y = coolerY0 + 0.548): Cans of DASH Sparkling Water ---
    const topCanY = coolerY0 + 0.548;
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 6; col++) {
        const canX = cx - 0.25 + col * 0.10;
        const canZ = 0.85 - row * 0.11;
        const canMat = dashCanMats[(col + row) % dashCanMats.length];
        const canGroup = new THREE.Group();
        canGroup.name = `familyBathroom.drinksCabinet.dashCan_${row * 6 + col + 1}`;
        const canBody = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.030, 0.112, 14), canMat);
        canBody.position.set(canX, topCanY + 0.056, canZ);
        canGroup.add(canBody);
        const canTop = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.030, 0.006, 14), brushedChromeMat);
        canTop.position.set(canX, topCanY + 0.115, canZ);
        canGroup.add(canTop);
        coolerGroup.add(canGroup);
      }
    }

    // Glazed Cooler Door Frame & Low-Iron Glass Pane (`Z = 0.99m`)
    const doorFrameThick = 0.022;
    const doorFrameTop = new THREE.Mesh(new THREE.BoxGeometry(coolerW - 0.02, 0.036, doorFrameThick), brushedChromeMat);
    doorFrameTop.position.set(cx, coolerY0 + coolerH - 0.022, 0.99);
    coolerGroup.add(doorFrameTop);
    const doorFrameBot = new THREE.Mesh(new THREE.BoxGeometry(coolerW - 0.02, 0.042, doorFrameThick), brushedChromeMat);
    doorFrameBot.position.set(cx, coolerY0 + 0.025, 0.99);
    coolerGroup.add(doorFrameBot);
    for (const s of [-1, 1] as const) {
      const stile = new THREE.Mesh(new THREE.BoxGeometry(0.036, coolerH - 0.05, doorFrameThick), brushedChromeMat);
      stile.position.set(cx + s * (coolerW / 2 - 0.028), coolerY0 + coolerH / 2, 0.99);
      coolerGroup.add(stile);
    }
    const coolerGlass = new THREE.Mesh(
      new THREE.BoxGeometry(coolerW - 0.09, coolerH - 0.08, 0.008),
      windowGlassMat
    );
    coolerGlass.position.set(cx, coolerY0 + coolerH / 2, 0.99);
    coolerGroup.add(coolerGlass);

    // Vertical brass cooler door handle on the left stile
    const coolerHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.42, 10), brassMat);
    coolerHandle.position.set(cx - coolerW / 2 + 0.03, coolerY0 + coolerH / 2 + 0.04, 1.02);
    coolerGroup.add(coolerHandle);

    drinksGroup.add(coolerGroup);

    // 3. Honed Carrara Marble Countertop (`Y = floorTopY + 0.87m .. 0.905m`) & Upstand
    const counterY = floorTopY + 0.888;
    const marbleCounter = new THREE.Mesh(
      new THREE.BoxGeometry(cabW - 0.04, 0.035, 0.64),
      marbleMat
    );
    marbleCounter.name = 'familyBathroom.drinksCabinet.marbleCountertop';
    marbleCounter.position.set(cx, counterY, 0.71);
    marbleCounter.castShadow = true;
    marbleCounter.receiveShadow = true;
    drinksGroup.add(marbleCounter);

    const marbleSplash = new THREE.Mesh(
      new THREE.BoxGeometry(cabW - 0.056, 0.48, 0.018),
      marbleMat
    );
    marbleSplash.position.set(cx, counterY + 0.25, 0.41);
    drinksGroup.add(marbleSplash);

    // 4. Compact Luxury Espresso / Pod Coffee Machine (`familyBathroom.drinksCabinet.coffeeMachine`)
    const coffeeGroup = new THREE.Group();
    coffeeGroup.name = 'familyBathroom.drinksCabinet.coffeeMachine';
    const cmX = cx - 0.16;
    const cmY = counterY + 0.0175;
    const cmZ = 0.70;

    // Capsule drawer base under coffee machine
    const podDrawer = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.045, 0.30), darkAnthraciteMat);
    podDrawer.position.set(cmX, cmY + 0.0225, cmZ);
    coffeeGroup.add(podDrawer);
    const podDrawerHandle = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.008, 0.014), brassMat);
    podDrawerHandle.position.set(cmX, cmY + 0.0225, cmZ + 0.155);
    coffeeGroup.add(podDrawerHandle);

    // Main coffee machine tower & brushed chrome faceplate
    const cmBody = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.25, 0.24), darkAnthraciteMat);
    cmBody.position.set(cmX, cmY + 0.045 + 0.125, cmZ - 0.02);
    coffeeGroup.add(cmBody);
    const cmFace = new THREE.Mesh(new THREE.BoxGeometry(0.165, 0.23, 0.018), brushedChromeMat);
    cmFace.position.set(cmX, cmY + 0.045 + 0.125, cmZ + 0.105);
    coffeeGroup.add(cmFace);

    // Brew head, brass extraction lever, and drip tray with espresso cup
    const brewHead = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.028, 0.075, 16), brushedChromeMat);
    brewHead.position.set(cmX, cmY + 0.21, cmZ + 0.135);
    coffeeGroup.add(brewHead);
    const brewLever = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.09, 10), brassMat);
    brewLever.rotation.x = Math.PI / 3;
    brewLever.position.set(cmX, cmY + 0.26, cmZ + 0.145);
    coffeeGroup.add(brewLever);
    const dripTray = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.028, 0.09), brushedChromeMat);
    dripTray.position.set(cmX, cmY + 0.059, cmZ + 0.135);
    coffeeGroup.add(dripTray);
    const cupOnTray = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.019, 0.048, 14), ceramicWhiteMat);
    cupOnTray.position.set(cmX, cmY + 0.097, cmZ + 0.135);
    coffeeGroup.add(cupOnTray);

    // Rear water tank
    const waterTank = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.22, 0.07), fijiBottleMat);
    waterTank.position.set(cmX, cmY + 0.155, cmZ - 0.165);
    coffeeGroup.add(waterTank);

    drinksGroup.add(coffeeGroup);

    // 5. Brushed Brass Hospitality Tray on Countertop (right side) with San Pellegrino, Fiji & Espresso Cups
    const trayX = cx + 0.17;
    const trayZ = 0.73;
    const trayBase = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.012, 0.24), brassMat);
    trayBase.position.set(trayX, cmY + 0.006, trayZ);
    drinksGroup.add(trayBase);

    for (let i = 0; i < 2; i++) {
      const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.035, 0.008, 16), ceramicWhiteMat);
      saucer.position.set(trayX - 0.06 + i * 0.12, cmY + 0.016, trayZ + 0.05);
      drinksGroup.add(saucer);
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.021, 0.052, 16), ceramicWhiteMat);
      cup.position.set(trayX - 0.06 + i * 0.12, cmY + 0.044, trayZ + 0.05);
      drinksGroup.add(cup);
    }

    // 6. Two Open Upper Display Shelves (`Y = floorTopY + 1.44m` & `1.74m`) with Brass Gallery Rails & Crystal Flutes
    for (const [sIdx, shelfY] of [floorTopY + 1.44, floorTopY + 1.74].entries()) {
      const upperShelf = new THREE.Mesh(
        new THREE.BoxGeometry(cabW - 0.056, 0.024, 0.34),
        wardrobeMat
      );
      upperShelf.position.set(cx, shelfY, 0.56);
      drinksGroup.add(upperShelf);

      const galleryRail = new THREE.Mesh(
        new THREE.CylinderGeometry(0.004, 0.004, cabW - 0.08, 10),
        brassMat
      );
      galleryRail.rotation.z = Math.PI / 2;
      galleryRail.position.set(cx, shelfY + 0.028, 0.71);
      drinksGroup.add(galleryRail);

      const ledUnder = new THREE.Mesh(
        new THREE.BoxGeometry(cabW - 0.12, 0.005, 0.016),
        warmLedMat
      );
      ledUnder.position.set(cx, shelfY - 0.014, 0.68);
      drinksGroup.add(ledUnder);

      // Crystal champagne flutes / water tumblers on upper shelves
      for (let g = 0; g < 5; g++) {
        const gx = cx - 0.24 + g * 0.12;
        if (sIdx === 0) {
          // Water tumblers
          const tumbler = new THREE.Mesh(
            new THREE.CylinderGeometry(0.032, 0.027, 0.095, 14),
            windowGlassMat
          );
          tumbler.position.set(gx, shelfY + 0.012 + 0.0475, 0.57);
          drinksGroup.add(tumbler);
        } else {
          // Tall crystal champagne flutes
          const base = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.028, 0.005, 14), windowGlassMat);
          base.position.set(gx, shelfY + 0.0145, 0.57);
          drinksGroup.add(base);
          const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.085, 10), windowGlassMat);
          stem.position.set(gx, shelfY + 0.057, 0.57);
          drinksGroup.add(stem);
          const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.012, 0.105, 14), windowGlassMat);
          bowl.position.set(gx, shelfY + 0.15, 0.57);
          drinksGroup.add(bowl);
        }
      }
    }

    scene.add(drinksGroup);
  }

  // Partition wall between Family Bathroom and Upper South Passage (0.15m thick, Z = +0.90m..+1.05m, X = -9.80m..-12.81m)
  // With bathroom entrance doorway at X = -11.18m (`width = 0.82m`) and OPEN Drinks Cabinet recess across X = -10.62m..-9.80m (Issue #11)
  addUpperInteriorWall(-10.695, floorTopY, collarCeilingY, 0.975, 0.15, 0.15, warmRoomPlasterMat, {
    skipSkirting: true,
  });
  addUpperInteriorWall(-10.21, upperWallTopY, collarCeilingY, 0.975, 0.82, 0.15, warmRoomPlasterMat, {
    skipSkirting: true,
  });
  addUpperInteriorWall(-12.2, floorTopY, collarCeilingY, 0.975, 1.22, 0.15, warmRoomPlasterMat, {
    skirtingSides: [1],
    skirtingMin: -12.81,
    skirtingMax: -11.672,
  });
  addUpperInteriorWall(-11.18, floorTopY + doorH, collarCeilingY, 0.975, 0.82, 0.15, warmRoomPlasterMat, {
    skipSkirting: true,
  });
  addUpperInteractiveDoor('x', 0.975, 0.15, -11.18, 0.82, -Math.PI * 0.48);

  // =========================================================================
  // PRINCIPAL FAMILY BATHROOM SANITARYWARE (matching `ff_rotated_3d_axes.png`)
  // 1. Walk-In Glass Shower Enclosure in SW corner (`X = -12.81m..-11.65m, Z = +0.05m..+0.90m`)
  // 2. Freestanding Sculpted Oval Bathtub in NW quadrant (`X = -11.75m, Z = -1.35m`, oriented East-West)
  // 3. Bathroom WC in NE corner (`X = -10.22m, Z = -2.18m`, facing South `+Z`)
  // 4. Wash Basin & Vanity Unit on East wall (`X = -10.06m, Z = -0.78m`, facing West `-X`)
  // =========================================================================
  // 1. Walk-in Glass Shower Enclosure in SW corner of Bathroom (West of bathroom door)
  const showerTray = new THREE.Mesh(
    new THREE.BoxGeometry(1.14, 0.045, 0.84),
    ceramicWhiteMat
  );
  showerTray.name = 'familyBathroom.showerTray';
  showerTray.position.set(-12.23, floorTopY + 0.022, 0.475);
  showerTray.receiveShadow = true;
  scene.add(showerTray);

  const showerGlassScreen = new THREE.Mesh(
    new THREE.BoxGeometry(0.82, 1.88, 0.018),
    windowGlassMat
  );
  showerGlassScreen.name = 'familyBathroom.showerGlass';
  showerGlassScreen.position.set(-12.39, floorTopY + 0.94, 0.06);
  scene.add(showerGlassScreen);

  const showerRiser = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 1.08, 10),
    brassMat
  );
  showerRiser.position.set(-12.74, floorTopY + 1.38, 0.475);
  scene.add(showerRiser);

  // 2. Freestanding Sculpted Oval Feature Bathtub at X = -11.75m, Z = -1.35m (oriented East-West)
  const bathGroup = new THREE.Group();
  bathGroup.name = 'familyBathroom.bathtub';
  bathGroup.position.set(-11.75, floorTopY, -1.35);
  const bathOuter = new THREE.Mesh(
    new THREE.CylinderGeometry(0.44, 0.38, 0.58, 24),
    ceramicWhiteMat
  );
  bathOuter.scale.set(1.85, 1.0, 1.0);
  bathOuter.position.set(0, 0.29, 0);
  bathOuter.castShadow = true;
  bathOuter.receiveShadow = true;
  bathGroup.add(bathOuter);

  const bathFillerStandpipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.022, 0.76, 10),
    brassMat
  );
  bathFillerStandpipe.position.set(-0.82, 0.38, 0);
  bathGroup.add(bathFillerStandpipe);
  scene.add(bathGroup);

  // 3. Bathroom WC in NE corner on North Wall (X = -10.22m, Z = -2.18m, facing South `+Z`)
  const bathWcCistern = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.44, 0.18),
    ceramicWhiteMat
  );
  bathWcCistern.position.set(-10.22, floorTopY + 0.68, -2.38);
  scene.add(bathWcCistern);

  const bathWcPan = new THREE.Mesh(
    new THREE.CylinderGeometry(0.19, 0.15, 0.42, 16),
    ceramicWhiteMat
  );
  bathWcPan.position.set(-10.22, floorTopY + 0.21, -2.08);
  scene.add(bathWcPan);

  // 4. Vanity Basin on East Wall between WC and Recessed Passage Cupboard (X = -10.06m, Z = -0.78m, facing West `-X`)
  const bathVanityUnit = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.82, 0.88),
    wardrobeMat
  );
  bathVanityUnit.position.set(-10.06, floorTopY + 0.41, -0.78);
  bathVanityUnit.castShadow = true;
  scene.add(bathVanityUnit);

  const bathVanityTop = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.06, 0.9),
    ceramicWhiteMat
  );
  bathVanityTop.position.set(-10.06, floorTopY + 0.85, -0.78);
  scene.add(bathVanityTop);

  // West Load-Bearing Cross-Wall between Family Bathroom/Passage and Main Staircase Landing (0.24m thick, X = -12.81m..-13.05m)
  // Open passage/doorway at Z = +1.55m with cased antique oak architrave portal matching downstairs
  addUpperInteriorWall(-12.93, floorTopY, upperWallTopY, -0.7, 0.24, 3.6, warmRoomPlasterMat, {
    skipSkirting: true,
  });
  // Clean skirting segments on the X = -12.93m Cross-Wall (stopping at North stringer Z = -2.478m, East Chimney Breast, and South Landing Wall Z = +2.22m on West side; and Shower on East side)
  for (const [sideSign, z0, z1] of [
    [-1, -2.478, -1.34],
    [-1, 0.46, 1.018],
    [-1, 2.082, 2.22],
    [1, -2.5, 0.05],
  ] as const) {
    const sD = z1 - z0;
    const sCz = (z0 + z1) / 2;
    const skirt = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, 0.122, sD),
      antiqueOakSkirtingMat
    );
    skirt.userData.isArchitecturalShell = true;
    skirt.position.set(-12.93 + sideSign * (0.12 + 0.009), floorTopY + 0.061, sCz);
    skirt.receiveShadow = true;
    scene.add(skirt);
    const skirtCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, 0.024, sD),
      antiqueOakSkirtingMat
    );
    skirtCap.userData.isArchitecturalShell = true;
    skirtCap.position.set(-12.93 + sideSign * (0.12 + 0.006), floorTopY + 0.134, sCz);
    skirtCap.receiveShadow = true;
    scene.add(skirtCap);
  }
  addUpperInteriorWall(-12.93, floorTopY, upperWallTopY, 2.2, 0.24, 0.4, warmRoomPlasterMat, {
    skirtingSides: [1],
    skirtingMin: 2.082,
    skirtingMax: 2.4,
  });
  addUpperInteriorWall(-12.93, floorTopY + doorH, upperWallTopY, 1.55, 0.24, 0.9, warmRoomPlasterMat, {
    skipSkirting: true,
  });
  addCasedArchitravePortal(scene, {
    axis: 'z',
    wallCoord: -12.93,
    wallThickness: 0.24,
    openingCenter: 1.55,
    openingWidth: 0.9,
    frontFloorY: floorTopY,
    backFloorY: floorTopY,
    headY: floorTopY + doorH,
    material: antiqueOakSkirtingMat,
    namePrefix: 'upperLanding.eastPassagePortal',
  });

  // Issue #5: Trapezoidal Upper Gable Extension on the X = -12.93m Cross-Wall (Y = 4.16m..4.52m)
  {
    const crossGableShape = new THREE.Shape();
    crossGableShape.moveTo(-1.9, upperWallTopY);
    crossGableShape.lineTo(1.8, upperWallTopY);
    crossGableShape.lineTo(1.05, collarCeilingY);
    crossGableShape.lineTo(-1.15, collarCeilingY);
    crossGableShape.closePath();
    const crossGableGeo = new THREE.ExtrudeGeometry(crossGableShape, {
      depth: 0.24,
      bevelEnabled: false,
    });
    crossGableGeo.rotateY(Math.PI / 2);
    crossGableGeo.translate(-12.93 - 0.12, 0, 0);
    const crossGableMesh = new THREE.Mesh(crossGableGeo, warmRoomPlasterMat);
    crossGableMesh.name = 'familyBathroom.westWallUpperGable';
    crossGableMesh.castShadow = true;
    crossGableMesh.receiveShadow = true;
    scene.add(crossGableMesh);
  }
}
