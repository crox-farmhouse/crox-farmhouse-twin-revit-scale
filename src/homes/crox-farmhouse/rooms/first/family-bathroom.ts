import * as THREE from 'three';
import { addCasedArchitravePortal, buildMitredWallSkirtingGeometry } from '../../../../engine/geometry/index.ts';
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
    warmRoomPlasterMat,
    windowGlassMat,
  } = kit;
  // =========================================================================
  // 2. PRINCIPAL FAMILY BATHROOM & UPPER PASSAGE
  //    Directly above Boot Lobby / Store / WC: X = -9.80m..-12.81m, Z = -2.50m..+2.40m
  // =========================================================================
  // Bathroom tiled floor (L-shaped around the Recessed Drinks Cabinet bulkhead) & Upper South Passage carpet floor:
  // - West Bathroom zone (`X = -12.93m..-10.695m, Z = -2.64m..+0.975m`, terminating at the bathroom door threshold `Z = 0.975m`)
  // - East Bathroom zone (`X = -10.695m..-9.68m, Z = -2.64m..+0.05m`, terminating inside the `Z = -0.01m` vanity/bulkhead wall)
  // - Upper South Passage & Drinks Cabinet recess (`oakFloorMat`, `Z = +0.975m..+2.54m` plus `X = -10.695m..-9.56m, Z = +0.05m..+0.975m`)
  addFirstFloorSlab(-12.93, -10.695, -2.64, 0.975, bathroomTileMat);
  addFirstFloorSlab(-10.695, -9.68, -2.64, 0.05, bathroomTileMat);
  addFirstFloorSlab(-10.695, -9.56, 0.05, 0.975, oakFloorMat);
  addFirstFloorSlab(-13.05, -9.56, 0.975, 2.54, oakFloorMat);

  // Antique oak threshold transition strip beneath the Family Bathroom doorway (`X = -11.59m..-10.77m, Z = 0.975m`)
  {
    const bathThresholdStrip = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 0.006, 0.032),
      antiqueOakSkirtingMat
    );
    bathThresholdStrip.name = 'familyBathroom.doorThresholdStrip';
    bathThresholdStrip.userData.isArchitecturalShell = true;
    bathThresholdStrip.position.set(-11.18, floorTopY + 0.003, 0.975);
    bathThresholdStrip.receiveShadow = true;
    scene.add(bathThresholdStrip);
  }

  // North Exterior Brick Wall of Family Bathroom (Z = -2.78m..-2.50m, X = -12.81m..-9.56m)
  // Skirting is emitted below via `familyBathroom.perimeterMitredSkirting` for 45°-mitred corners
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
    { skipSkirting: true }
  );

  // South Courtyard Exterior Brick Wall of Upper Passage (Z = +2.40m..+2.68m, X = -12.93m..-9.56m)
  // Skirting is emitted below via `upperSouthPassage.southMitredSkirting` for 45°-mitred corners
  addUpperBrickWallAlongXWithWindow(
    -12.93,
    -9.56,
    2.4,
    2.68,
    -12.05,
    0.76,
    3.06,
    3.9,
    'north',
    1,
    { skipSkirting: true }
  );

  const collarCeilingY = 4.52;

  // =========================================================================
  // BESPOKE HOTEL DRINKS & REFRESHMENT CABINET (`X = -10.62m..-9.80m, Z = +0.36m..+1.05m`)
  // & MANIFOLD L-SHAPED BATHROOM BULKHEAD (`X = -10.77m..-9.80m, Z = -0.01m..+1.05m`) (Issues #1 & #5)
  // - Single continuous 0.15m-thick West enclosing wall (`X = -10.77m..-10.62m, Z = -0.01m..+1.05m`)
  //   that forms a 100% flush NW corner at `[-10.77, -0.01]` and forms the East jamb pier of the bathroom doorway
  //   with zero step-out or overlapping boxes!
  // - Solid North wall & backing (`X = -10.62m..-9.80m, Z = -0.01m..+0.36m`) whose North face (`Z = -0.01m`)
  //   is coplanar with `[-10.77, -0.01]` (creating a flat `0.97m`-wide wall for the Bathroom Vanity Unit)
  //   and whose South face (`Z = +0.36m`) backs the oak Drinks Cabinet with zero hollow void!
  // - Full-depth upper soffit bulkhead (`X = -10.62m..-9.80m, Z = +0.36m..+1.05m, Y = 4.16m..4.52m`)
  //   sealing the top of the Drinks Cabinet up to the 4.52m collar ceiling.
  // =========================================================================
  addUpperInteriorWall(-10.695, floorTopY, collarCeilingY, 0.52, 0.15, 1.06, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });
  addUpperInteriorWall(-10.21, floorTopY, collarCeilingY, 0.175, 0.82, 0.37, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });
  addUpperInteriorWall(-10.21, upperWallTopY, collarCeilingY, 0.705, 0.82, 0.69, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });

  // Continuous 45°-mitred 146mm antique oak skirtings around the Family Bathroom & Upper South Passage
  for (const [skirtName, path] of [
    [
      'familyBathroom.perimeterMitredSkirting',
      [
        [-12.81, -0.3],
        [-12.81, -2.5],
        [-9.8, -2.5],
        [-9.8, -0.01],
        [-10.77, -0.01],
        [-10.77, 0.832],
      ] as const,
    ],
    [
      'familyBathroom.southPierSkirting',
      [
        [-11.672, 0.9],
        [-11.96, 0.9],
      ] as const,
    ],
    [
      'upperSouthPassage.northWestSkirting',
      [
        [-12.81, 1.05],
        [-11.672, 1.05],
      ] as const,
    ],
    [
      'upperSouthPassage.northEastPierSkirting',
      [
        [-10.688, 1.05],
        [-10.62, 1.05],
      ] as const,
    ],
    [
      'upperSouthPassage.southMitredSkirting',
      [
        [-9.8, 2.082],
        [-9.8, 2.4],
        [-12.81, 2.4],
        [-12.81, 2.082],
      ] as const,
    ],
  ] as const) {
    const skirtMesh = new THREE.Mesh(
      buildMitredWallSkirtingGeometry(path, floorTopY),
      antiqueOakSkirtingMat
    );
    skirtMesh.name = skirtName;
    skirtMesh.userData.isArchitecturalShell = true;
    skirtMesh.castShadow = true;
    skirtMesh.receiveShadow = true;
    scene.add(skirtMesh);
  }

  {
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
    const backPanel = new THREE.Mesh(
      new THREE.BoxGeometry(cabW, cabH, 0.04),
      oakCabinetMat
    );
    backPanel.position.set(cx, floorTopY + cabH / 2, 0.38);
    drinksGroup.add(backPanel);

    for (const sideSign of [-1, 1] as const) {
      const cheek = new THREE.Mesh(
        new THREE.BoxGeometry(0.028, cabH, 0.68),
        oakCabinetMat
      );
      cheek.position.set(cx + sideSign * (cabW / 2 - 0.014), floorTopY + cabH / 2, 0.71);
      drinksGroup.add(cheek);
    }

    // Top cornice header & base plinth in matching solid oak
    const topHeader = new THREE.Mesh(
      new THREE.BoxGeometry(cabW, 0.09, 0.69),
      oakCabinetMat
    );
    topHeader.position.set(cx, upperWallTopY - 0.045, 0.705);
    drinksGroup.add(topHeader);

    const basePlinth = new THREE.Mesh(
      new THREE.BoxGeometry(cabW - 0.056, 0.08, 0.63),
      oakCabinetMat
    );
    basePlinth.position.set(cx, floorTopY + 0.04, 0.715);
    drinksGroup.add(basePlinth);

    // 2. Under-Counter Glazed Wine & Beverage Cooler (`Y = floorTopY + 0.08m .. floorTopY + 0.87m`)
    const coolerGroup = new THREE.Group();
    coolerGroup.name = 'familyBathroom.drinksCabinet.wineCooler';
    const coolerW = 0.76;
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

    // 3. Solid Oiled Oak Countertop (`Y = floorTopY + 0.87m .. 0.905m`) & Upstand (Issue #5: "Make this oak cabinet")
    const counterY = floorTopY + 0.888;
    const marbleCounter = new THREE.Mesh(
      new THREE.BoxGeometry(cabW - 0.056, 0.035, 0.65),
      oakCountertopMat
    );
    marbleCounter.name = 'familyBathroom.drinksCabinet.marbleCountertop';
    marbleCounter.position.set(cx, counterY, 0.725);
    marbleCounter.castShadow = true;
    marbleCounter.receiveShadow = true;
    drinksGroup.add(marbleCounter);

    const marbleSplash = new THREE.Mesh(
      new THREE.BoxGeometry(cabW - 0.056, 0.48, 0.018),
      oakCabinetMat
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

    for (const [sIdx, shelfY] of [floorTopY + 1.44, floorTopY + 1.74].entries()) {
      const upperShelf = new THREE.Mesh(
        new THREE.BoxGeometry(cabW - 0.056, 0.024, 0.34),
        oakCountertopMat
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

          const saucerRim = new THREE.Mesh(
            new THREE.CylinderGeometry(0.048, 0.036, 0.009, 18),
            ceramicWhiteMat
          );
          saucerRim.position.set(cupX, shelfTopY + 0.0045, cupZ);
          cupSetGroup.add(saucerRim);

          const cupBody = new THREE.Mesh(
            new THREE.CylinderGeometry(0.03, 0.023, 0.056, 18),
            ceramicWhiteMat
          );
          cupBody.position.set(cupX, shelfTopY + 0.036, cupZ);
          cupSetGroup.add(cupBody);

          const cupHandle = new THREE.Mesh(
            new THREE.TorusGeometry(0.014, 0.0038, 8, 16, Math.PI),
            ceramicWhiteMat
          );
          cupHandle.rotation.z = -Math.PI / 2;
          cupHandle.position.set(cupX + 0.028, shelfTopY + 0.038, cupZ);
          cupSetGroup.add(cupHandle);

          const spoon = new THREE.Mesh(
            new THREE.BoxGeometry(0.056, 0.0025, 0.008),
            brassMat
          );
          spoon.rotation.y = 0.25;
          spoon.position.set(cupX + 0.006, shelfTopY + 0.01, cupZ + 0.028);
          cupSetGroup.add(spoon);

          drinksGroup.add(cupSetGroup);
        }

        // Right side of Shelf 1: Compartmented Walnut & Brass Tea Selection Box + 2 Heritage Loose-Leaf Tea Caddies
        const teaBoxGroup = new THREE.Group();
        teaBoxGroup.name = 'familyBathroom.drinksCabinet.teaBox';
        const boxX = cx + 0.06;
        const boxZ = 0.58;
        const boxOuter = new THREE.Mesh(
          new THREE.BoxGeometry(0.15, 0.038, 0.13),
          teaBoxWoodMat
        );
        boxOuter.position.set(boxX, shelfTopY + 0.019, boxZ);
        teaBoxGroup.add(boxOuter);

        const boxBrassClasp = new THREE.Mesh(
          new THREE.BoxGeometry(0.024, 0.012, 0.004),
          brassMat
        );
        boxBrassClasp.position.set(boxX, shelfTopY + 0.026, boxZ + 0.066);
        teaBoxGroup.add(boxBrassClasp);

        for (let s = 0; s < 4; s++) {
          const sx = boxX - 0.048 + s * 0.032;
          for (let r = 0; r < 3; r++) {
            const sachet = new THREE.Mesh(
              new THREE.BoxGeometry(0.024, 0.028, 0.006),
              teaSachetMats[s % teaSachetMats.length]
            );
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

          const caddyBody = new THREE.Mesh(
            new THREE.CylinderGeometry(0.031, 0.031, 0.088, 16),
            teaCaddyMat
          );
          caddyBody.position.set(caddyX, shelfTopY + 0.044, caddyZ);
          caddyGroup.add(caddyBody);

          const caddyLabel = new THREE.Mesh(
            new THREE.BoxGeometry(0.036, 0.036, 0.004),
            champagneFoilMat
          );
          caddyLabel.position.set(caddyX, shelfTopY + 0.046, caddyZ + 0.03);
          caddyGroup.add(caddyLabel);

          const caddyLid = new THREE.Mesh(
            new THREE.CylinderGeometry(0.032, 0.032, 0.016, 16),
            brassMat
          );
          caddyLid.position.set(caddyX, shelfTopY + 0.096, caddyZ);
          caddyGroup.add(caddyLid);

          const caddyFinial = new THREE.Mesh(
            new THREE.CylinderGeometry(0.008, 0.01, 0.01, 12),
            brassMat
          );
          caddyFinial.position.set(caddyX, shelfTopY + 0.109, caddyZ);
          caddyGroup.add(caddyFinial);

          drinksGroup.add(caddyGroup);
        }
      } else {
        // Top Shelf: 3 cut-crystal water tumblers on the left + 3 stemmed crystal champagne/wine glasses on the right
        for (let g = 0; g < 3; g++) {
          const tumblerX = cx - 0.25 + g * 0.095;
          const tumbler = new THREE.Mesh(
            new THREE.CylinderGeometry(0.032, 0.027, 0.095, 14),
            windowGlassMat
          );
          tumbler.name = `familyBathroom.drinksCabinet.tumbler_${g + 1}`;
          tumbler.position.set(tumblerX, shelfTopY + 0.0475, 0.57);
          drinksGroup.add(tumbler);
        }
        for (let g = 0; g < 3; g++) {
          const gx = cx + 0.06 + g * 0.095;
          const glassGroup = new THREE.Group();
          glassGroup.name = `familyBathroom.drinksCabinet.wineGlass_${g + 1}`;
          const base = new THREE.Mesh(
            new THREE.CylinderGeometry(0.028, 0.03, 0.005, 14),
            windowGlassMat
          );
          base.position.set(gx, shelfTopY + 0.0025, 0.57);
          glassGroup.add(base);
          const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.004, 0.004, 0.085, 10),
            windowGlassMat
          );
          stem.position.set(gx, shelfTopY + 0.045, 0.57);
          glassGroup.add(stem);
          const bowl = new THREE.Mesh(
            new THREE.CylinderGeometry(0.026, 0.014, 0.105, 14),
            windowGlassMat
          );
          bowl.position.set(gx, shelfTopY + 0.138, 0.57);
          glassGroup.add(bowl);
          drinksGroup.add(glassGroup);
        }
      }
    }

    scene.add(drinksGroup);
  }

  // Partition wall between Family Bathroom and Upper South Passage (0.15m thick, Z = +0.90m..+1.05m, X = -10.77m..-12.81m)
  // With bathroom entrance doorway at X = -11.18m (`width = 0.82m`, `X = -11.59m..-10.77m`)
  addUpperInteriorWall(-12.2, floorTopY, collarCeilingY, 0.975, 1.22, 0.15, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });
  addUpperInteriorWall(-11.18, floorTopY + doorH, collarCeilingY, 0.975, 0.82, 0.15, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });
  addUpperInteractiveDoor('x', 0.975, 0.15, -11.18, 0.82, -Math.PI * 0.48);

  // =========================================================================
  // PRINCIPAL FAMILY BATHROOM SANITARYWARE
  // 1. Walk-In Glass Shower Enclosure in SW corner, rotated LENGTHWISE into the room (`X = -12.80m..-11.96m, Z = -0.30m..+0.90m` — Issue #3)
  // 2. Freestanding Burnished Copper "Tubby Tub" Roll-Top Bath in NW quadrant (`X = -11.65m, Z = -1.52m` — Issue #4)
  // 3. High-LOD Edwardian Low-Level Vitreous China Toilet in NE corner (`X = -10.22m, Z = -2.50m`, facing South `+Z`)
  // 4. High-LOD Bespoke Period Shaker Vanity Unit & Mirror against the South-East wall (`X = -10.285m, Z = -0.01m`, facing North `-Z` — Issue #2)
  // =========================================================================
  // 1. Walk-in Glass Shower Enclosure in SW corner of Bathroom, oriented LENGTHWISE into the room (`0.84m` wide along X × `1.20m` long along Z) (Issue #3)
  {
    const showerTray = new THREE.Mesh(
      new THREE.BoxGeometry(0.84, 0.045, 1.2),
      ceramicWhiteMat
    );
    showerTray.name = 'familyBathroom.showerTray';
    showerTray.position.set(-12.38, floorTopY + 0.0225, 0.3);
    showerTray.receiveShadow = true;
    scene.add(showerTray);

    const showerDrainGrate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.004, 16),
      brassMat
    );
    showerDrainGrate.position.set(-12.52, floorTopY + 0.046, 0.58);
    scene.add(showerDrainGrate);

    // Frameless low-iron glass walk-in screen running lengthwise (North-South) along the East edge (`X = -11.97m, Z = +0.06m..+0.90m`)
    // leaving a generous walk-in entry at the North end (`Z = -0.30m..+0.06m`)
    const showerGlassScreen = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 1.92, 0.84),
      windowGlassMat
    );
    showerGlassScreen.name = 'familyBathroom.showerGlass';
    showerGlassScreen.position.set(-11.97, floorTopY + 0.96, 0.48);
    scene.add(showerGlassScreen);

    // Brass vertical wall channel at the South wall (`Z = +0.89m`) & horizontal overhead bracing arm to the West wall (`X = -12.81m`)
    const glassWallChannel = new THREE.Mesh(
      new THREE.BoxGeometry(0.026, 1.92, 0.024),
      brassMat
    );
    glassWallChannel.position.set(-11.97, floorTopY + 0.96, 0.888);
    scene.add(glassWallChannel);

    const glassSupportArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.84, 10),
      brassMat
    );
    glassSupportArm.rotation.z = Math.PI / 2;
    glassSupportArm.position.set(-12.39, floorTopY + 1.9, 0.1);
    scene.add(glassSupportArm);

    // Exposed traditional brass thermostatic shower riser & overhead rainfall deluge head on the West wall (`X = -12.74m, Z = +0.42m`)
    const showerRiser = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 1.08, 12),
      brassMat
    );
    showerRiser.position.set(-12.74, floorTopY + 1.42, 0.42);
    scene.add(showerRiser);

    const showerValveBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.26, 12),
      brassMat
    );
    showerValveBar.rotation.x = Math.PI / 2;
    showerValveBar.position.set(-12.74, floorTopY + 1.02, 0.42);
    scene.add(showerValveBar);

    const showerTopArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.011, 0.36, 10),
      brassMat
    );
    showerTopArm.rotation.z = Math.PI / 2;
    showerTopArm.position.set(-12.56, floorTopY + 1.95, 0.42);
    scene.add(showerTopArm);

    const rainfallRose = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.12, 0.018, 20),
      brassMat
    );
    rainfallRose.position.set(-12.39, floorTopY + 1.92, 0.42);
    scene.add(rainfallRose);
  }

  // 2. Freestanding Burnished Copper "Tubby Tub" Bateau Bath at X = -11.62m, Z = -1.52m (Issue #4: "Copper tubby tub bath")
  {
    const bathGroup = new THREE.Group();
    bathGroup.name = 'familyBathroom.bathtub';
    bathGroup.position.set(-11.62, floorTopY, -1.52);

    const burnishedCopperMat = new THREE.MeshStandardMaterial({
      color: 0xb86538,
      roughness: 0.26,
      metalness: 0.84,
    });
    const copperPlinthMat = new THREE.MeshStandardMaterial({
      color: 0x964e28,
      roughness: 0.32,
      metalness: 0.82,
    });
    const tinnedInteriorMat = new THREE.MeshStandardMaterial({
      color: 0xe8e4dc,
      roughness: 0.18,
      metalness: 0.38,
      side: THREE.DoubleSide,
    });

    // Sculpted double-ended "Tubby Tub" bateau bath shell:
    // Compact, deep soaking proportions (`1.48m` long × `0.78m` wide × `0.64m..0.71m` high with sweeping bateau ends)
    const segU = 48;
    const segV = 20;
    const outerPos: number[] = [];
    const outerNorm: number[] = [];
    const outerUv: number[] = [];
    const outerIdx: number[] = [];

    const innerPos: number[] = [];
    const innerUv: number[] = [];
    const innerIdx: number[] = [];

    const rimPts: THREE.Vector3[] = [];

    const sampleTubRing = (
      v: number,
      u: number,
      inset: number
    ): [number, number, number] => {
      const theta = u * Math.PI * 2;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);
      // Superellipse / stadium-like oval profile for authentic Tubby Tub silhouette
      const signX = Math.sign(cosT);
      const signZ = Math.sign(sinT);
      const pow = 1.72;
      const nx = signX * Math.pow(Math.abs(cosT), 2 / pow);
      const nz = signZ * Math.pow(Math.abs(sinT), 2 / pow);

      // Gentle flare from base (v = 0) to rolled rim (v = 1)
      const flare = 0.84 + 0.16 * Math.pow(v, 0.78);
      const rx = 0.72 * flare - inset;
      const rz = 0.38 * flare - inset;

      // Bateau / slipper rise at the West and East lounging ends (`cosT^2`)
      const endRise = 0.068 * Math.pow(cosT, 4);
      const topY = 0.64 + endRise;
      const botY = inset > 0 ? 0.085 : 0.0;
      const y = THREE.MathUtils.lerp(botY, topY, v);
      return [nx * rx, y, nz * rz];
    };

    const stride = segU + 1;
    for (let iv = 0; iv <= segV; iv++) {
      const v = iv / segV;
      for (let iu = 0; iu <= segU; iu++) {
        const u = iu / segU;
        const [ox, oy, oz] = sampleTubRing(v, u, 0);
        outerPos.push(ox, oy, oz);
        outerUv.push(u * 4, v);

        // Outward normal via angular central difference
        const [px, , pz] = sampleTubRing(v, (iu - 1 + segU) / segU, 0);
        const [nx, , nz] = sampleTubRing(v, (iu + 1) / segU, 0);
        const tx = nx - px;
        const tz = nz - pz;
        const len = Math.hypot(tx, tz) || 1;
        outerNorm.push(tz / len, 0.1 * (1 - v), -tx / len);

        const [ix, iy, iz] = sampleTubRing(v, u, 0.032);
        innerPos.push(ix, iy, iz);
        innerUv.push(u * 4, v);

        if (iv === segV && iu < segU) {
          rimPts.push(new THREE.Vector3((ox + ix) / 2, oy + 0.008, (oz + iz) / 2));
        }
      }
    }

    for (let iv = 0; iv < segV; iv++) {
      for (let iu = 0; iu < segU; iu++) {
        const a = iv * stride + iu;
        const b = a + 1;
        const c = (iv + 1) * stride + iu;
        const d = c + 1;
        // Outward-facing winding for outer copper shell
        outerIdx.push(a, c, b, b, c, d);
        // Inward-facing winding for tinned interior well
        innerIdx.push(a, b, c, b, d, c);
      }
    }

    // Close the flat interior soaking floor at v = 0 (`y = 0.085m`)
    const floorCenterIdx = innerPos.length / 3;
    innerPos.push(0, 0.085, 0);
    innerUv.push(0.5, 0.5);
    for (let iu = 0; iu < segU; iu++) {
      innerIdx.push(floorCenterIdx, iu + 1, iu);
    }

    const outerGeo = new THREE.BufferGeometry();
    outerGeo.setAttribute('position', new THREE.Float32BufferAttribute(outerPos, 3));
    outerGeo.setAttribute('normal', new THREE.Float32BufferAttribute(outerNorm, 3));
    outerGeo.setAttribute('uv', new THREE.Float32BufferAttribute(outerUv, 2));
    outerGeo.setIndex(outerIdx);
    outerGeo.computeVertexNormals();

    const bathOuter = new THREE.Mesh(outerGeo, burnishedCopperMat);
    bathOuter.name = 'familyBathroom.bathtub.copperShell';
    bathOuter.castShadow = true;
    bathOuter.receiveShadow = true;
    bathGroup.add(bathOuter);

    const innerGeo = new THREE.BufferGeometry();
    innerGeo.setAttribute('position', new THREE.Float32BufferAttribute(innerPos, 3));
    innerGeo.setAttribute('uv', new THREE.Float32BufferAttribute(innerUv, 2));
    innerGeo.setIndex(innerIdx);
    innerGeo.computeVertexNormals();

    const bathInner = new THREE.Mesh(innerGeo, tinnedInteriorMat);
    bathInner.name = 'familyBathroom.bathtub.innerWell';
    bathInner.receiveShadow = true;
    bathGroup.add(bathInner);

    // Continuous 3D Rolled Copper Bullnose Rim around the bateau top edge
    const rimCurve = new THREE.CatmullRomCurve3(rimPts, true);
    const bathRim = new THREE.Mesh(
      new THREE.TubeGeometry(rimCurve, 64, 0.024, 14, true),
      burnishedCopperMat
    );
    bathRim.name = 'familyBathroom.bathtub.rolledRim';
    bathRim.castShadow = true;
    bathGroup.add(bathRim);

    // Molded Copper Skirt Plinth around the base (`y = 0..0.068m`)
    const plinthPts: THREE.Vector3[] = [];
    for (let iu = 0; iu < segU; iu++) {
      const [bx, , bz] = sampleTubRing(0.03, iu / segU, -0.01);
      plinthPts.push(new THREE.Vector3(bx, 0.022, bz));
    }
    const plinthCurve = new THREE.CatmullRomCurve3(plinthPts, true);
    const bathPlinth = new THREE.Mesh(
      new THREE.TubeGeometry(plinthCurve, 48, 0.022, 12, true),
      copperPlinthMat
    );
    bathPlinth.name = 'familyBathroom.bathtub.plinth';
    bathPlinth.castShadow = true;
    bathGroup.add(bathPlinth);

    // Central brass pop-up waste & overflow rose inside the tub
    const bathDrain = new THREE.Mesh(
      new THREE.CylinderGeometry(0.034, 0.034, 0.006, 16),
      brassMat
    );
    bathDrain.position.set(0, 0.088, 0);
    bathGroup.add(bathDrain);

    // Freestanding Twin-Leg Brass Standpipe Bath-Shower Mixer at the West end (`x = -0.82m`)
    for (const legZ of [-0.09, 0.09] as const) {
      const standpipeLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.016, 0.76, 12),
        brassMat
      );
      standpipeLeg.position.set(-0.82, 0.38, legZ);
      standpipeLeg.castShadow = true;
      bathGroup.add(standpipeLeg);

      const floorEscutcheon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.034, 0.038, 0.018, 14),
        brassMat
      );
      floorEscutcheon.position.set(-0.82, 0.009, legZ);
      bathGroup.add(floorEscutcheon);
    }

    const mixerBridge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.22, 12),
      brassMat
    );
    mixerBridge.rotation.x = Math.PI / 2;
    mixerBridge.position.set(-0.82, 0.74, 0);
    bathGroup.add(mixerBridge);

    const bathSpout = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.018, 0.024),
      brassMat
    );
    bathSpout.position.set(-0.73, 0.75, 0);
    bathGroup.add(bathSpout);

    scene.add(bathGroup);
  }

  // 3 & 4. High-LOD Edwardian Low-Level Toilet (`X = -10.22m, Z = -2.50m`, facing South `+Z`) &
  //        Bespoke Period Shaker Vanity Unit with Mirror against the South-East Wall (`X = -10.285m, Z = -0.01m`, facing North `-Z`) (Issue #2)
  {
    const vanityCabinetMat = new THREE.MeshStandardMaterial({
      color: 0x3b443c,
      roughness: 0.48,
      metalness: 0.04,
    });
    const vanityTrimMat = new THREE.MeshStandardMaterial({
      color: 0x2d352e,
      roughness: 0.52,
      metalness: 0.04,
    });
    const marbleCounterMat = new THREE.MeshStandardMaterial({
      color: 0xf1eee8,
      roughness: 0.3,
      metalness: 0.04,
    });
    const mirrorGlassMat = new THREE.MeshStandardMaterial({
      color: 0xdce6eb,
      roughness: 0.1,
      metalness: 0.22,
    });

    // 4. Floor-Standing Bespoke Period Shaker Vanity Unit + Mirror against the South-East Bathroom Wall
    // (`X = -10.285m, Z = -0.01m`, facing North `-Z` into the Family Bathroom — Issue #2: "Vanity unit against this wall with mirror")
    const vanityGroup = new THREE.Group();
    vanityGroup.name = 'familyBathroom.vanityUnit';
    vanityGroup.position.set(-10.285, floorTopY, -0.01);
    vanityGroup.rotation.y = Math.PI / 2; // local +X points North (-Z) into the bathroom; local +Z runs East (+X) along the wall

    const vanityW = 0.82;
    const vanityD = 0.46;
    const vanityCarcassH = 0.8;

    const vanityPlinth = new THREE.Mesh(
      new THREE.BoxGeometry(vanityD - 0.02, 0.085, vanityW + 0.016),
      vanityTrimMat
    );
    vanityPlinth.position.set((vanityD - 0.02) / 2, 0.0425, 0);
    vanityPlinth.castShadow = true;
    vanityPlinth.receiveShadow = true;
    vanityGroup.add(vanityPlinth);

    const vanityCab = new THREE.Mesh(
      new THREE.BoxGeometry(vanityD, vanityCarcassH - 0.08, vanityW),
      vanityCabinetMat
    );
    vanityCab.name = 'familyBathroom.vanityCabinet';
    vanityCab.position.set(vanityD / 2, 0.44, 0);
    vanityCab.castShadow = true;
    vanityCab.receiveShadow = true;
    vanityGroup.add(vanityCab);

    for (const sideZ of [-1, 1] as const) {
      const doorZ = sideZ * 0.19;
      const shakerDoorFrame = new THREE.Mesh(
        new THREE.BoxGeometry(0.022, 0.62, 0.36),
        vanityTrimMat
      );
      shakerDoorFrame.position.set(vanityD + 0.008, 0.44, doorZ);
      shakerDoorFrame.castShadow = true;
      vanityGroup.add(shakerDoorFrame);

      const shakerDoorPanel = new THREE.Mesh(
        new THREE.BoxGeometry(0.014, 0.5, 0.26),
        vanityCabinetMat
      );
      shakerDoorPanel.position.set(vanityD + 0.015, 0.44, doorZ);
      vanityGroup.add(shakerDoorPanel);

      const doorKnob = new THREE.Mesh(
        new THREE.SphereGeometry(0.015, 12, 12),
        brassMat
      );
      doorKnob.position.set(vanityD + 0.032, 0.52, sideZ * 0.045);
      vanityGroup.add(doorKnob);
    }

    const basinSlab = new THREE.Mesh(
      new THREE.BoxGeometry(vanityD + 0.03, 0.042, vanityW + 0.04),
      marbleCounterMat
    );
    basinSlab.name = 'familyBathroom.sinkBasin';
    basinSlab.position.set((vanityD + 0.03) / 2, 0.821, 0);
    basinSlab.castShadow = true;
    basinSlab.receiveShadow = true;
    vanityGroup.add(basinSlab);

    const marbleUpstand = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, 0.11, vanityW + 0.04),
      marbleCounterMat
    );
    marbleUpstand.position.set(0.012, 0.897, 0);
    marbleUpstand.castShadow = true;
    vanityGroup.add(marbleUpstand);

    const basinRim = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.016, 0.52),
      ceramicWhiteMat
    );
    basinRim.position.set(0.26, 0.843, 0);
    vanityGroup.add(basinRim);

    const basinWell = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.018, 0.46),
      new THREE.MeshStandardMaterial({ color: 0xdfe3e6, roughness: 0.14, metalness: 0.06 })
    );
    basinWell.position.set(0.26, 0.846, 0);
    vanityGroup.add(basinWell);

    const tapStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.02, 0.16, 14),
      brassMat
    );
    tapStem.position.set(0.085, 0.92, 0);
    vanityGroup.add(tapStem);

    const tapSpout = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.018, 0.02),
      brassMat
    );
    tapSpout.position.set(0.145, 0.99, 0);
    vanityGroup.add(tapSpout);

    for (const valveZ of [-0.11, 0.11] as const) {
      const valveBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.018, 0.065, 12),
        brassMat
      );
      valveBody.position.set(0.085, 0.875, valveZ);
      vanityGroup.add(valveBody);

      const crossBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.052, 0.01, 0.052),
        brassMat
      );
      crossBar.position.set(0.085, 0.91, valveZ);
      vanityGroup.add(crossBar);
    }

    const mirrorFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.84, 0.72),
      brassMat
    );
    mirrorFrame.name = 'familyBathroom.mirrorFrame';
    mirrorFrame.position.set(0.024, 1.42, 0);
    mirrorFrame.castShadow = true;
    vanityGroup.add(mirrorFrame);

    const mirrorSurface = new THREE.Mesh(
      new THREE.BoxGeometry(0.01, 0.78, 0.66),
      mirrorGlassMat
    );
    mirrorSurface.name = 'familyBathroom.mirror';
    mirrorSurface.position.set(0.036, 1.42, 0);
    vanityGroup.add(mirrorSurface);

    scene.add(vanityGroup);

    // 3. High-LOD Traditional Edwardian Low-Level Vitreous China Toilet on North Wall (`X = -10.22m, Z = -2.50m`, facing South `+Z`)
    const toiletGroup = new THREE.Group();
    toiletGroup.name = 'familyBathroom.toilet';
    toiletGroup.position.set(-10.22, floorTopY, -2.5);
    toiletGroup.rotation.y = -Math.PI / 2; // local +X points South (+Z) into the bathroom

    const toiletZ = 0;
    const panCenterX = 0.455;

    const vitreousChinaMat = new THREE.MeshStandardMaterial({
      color: 0xf6f5f0,
      roughness: 0.11,
      metalness: 0.05,
      side: THREE.DoubleSide,
    });
    const innerBowlGlazeMat = new THREE.MeshStandardMaterial({
      color: 0xe6eaec,
      roughness: 0.08,
      metalness: 0.06,
      side: THREE.DoubleSide,
    });
    const waterSealMat = new THREE.MeshStandardMaterial({
      color: 0xd4edf4,
      roughness: 0.04,
      metalness: 0.12,
      transparent: true,
      opacity: 0.78,
    });
    const walnutSeatMat = new THREE.MeshStandardMaterial({
      color: 0x5c3a21,
      roughness: 0.28,
      metalness: 0.04,
    });

    const pedestalFootPts = [
      new THREE.Vector2(0.001, 0.0),
      new THREE.Vector2(0.148, 0.0),
      new THREE.Vector2(0.146, 0.018),
      new THREE.Vector2(0.132, 0.028),
      new THREE.Vector2(0.126, 0.046),
      new THREE.Vector2(0.106, 0.068),
      new THREE.Vector2(0.098, 0.145),
      new THREE.Vector2(0.112, 0.188),
    ];
    const wcPanPedestal = new THREE.Mesh(
      new THREE.LatheGeometry(pedestalFootPts, 24),
      vitreousChinaMat
    );
    wcPanPedestal.name = 'familyBathroom.toiletPedestal';
    wcPanPedestal.position.set(panCenterX - 0.015, 0.01, toiletZ);
    wcPanPedestal.scale.set(1.26, 1.0, 0.88);
    wcPanPedestal.castShadow = true;
    wcPanPedestal.receiveShadow = true;
    toiletGroup.add(wcPanPedestal);

    for (const boltSideZ of [-1, 1] as const) {
      const floorBolt = new THREE.Mesh(
        new THREE.SphereGeometry(0.011, 10, 10),
        brassMat
      );
      floorBolt.position.set(panCenterX - 0.015, 0.026, toiletZ + boltSideZ * 0.116);
      toiletGroup.add(floorBolt);
    }

    const soilPipeShroud = new THREE.Mesh(
      new THREE.CylinderGeometry(0.056, 0.058, 0.22, 16),
      vitreousChinaMat
    );
    soilPipeShroud.rotation.z = Math.PI / 2;
    soilPipeShroud.position.set(0.11, 0.185, toiletZ);
    soilPipeShroud.castShadow = true;
    toiletGroup.add(soilPipeShroud);

    const soilWallCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.076, 0.08, 0.026, 18),
      vitreousChinaMat
    );
    soilWallCollar.rotation.z = Math.PI / 2;
    soilWallCollar.position.set(0.013, 0.185, toiletZ);
    toiletGroup.add(soilWallCollar);

    const bowlProfilePts = [
      new THREE.Vector2(0.001, 0.175),
      new THREE.Vector2(0.068, 0.18),
      new THREE.Vector2(0.112, 0.172),
      new THREE.Vector2(0.146, 0.235),
      new THREE.Vector2(0.174, 0.315),
      new THREE.Vector2(0.182, 0.365),
      new THREE.Vector2(0.198, 0.376),
      new THREE.Vector2(0.202, 0.398),
      new THREE.Vector2(0.192, 0.406),
      new THREE.Vector2(0.154, 0.404),
      new THREE.Vector2(0.148, 0.382),
      new THREE.Vector2(0.132, 0.315),
      new THREE.Vector2(0.088, 0.235),
      new THREE.Vector2(0.064, 0.192),
      new THREE.Vector2(0.001, 0.188),
    ];
    const wcPanBowl = new THREE.Mesh(
      new THREE.LatheGeometry(bowlProfilePts, 28),
      vitreousChinaMat
    );
    wcPanBowl.name = 'familyBathroom.toiletPan';
    wcPanBowl.position.set(panCenterX, 0, toiletZ);
    wcPanBowl.scale.set(1.18, 1.0, 0.95);
    wcPanBowl.castShadow = true;
    wcPanBowl.receiveShadow = true;
    toiletGroup.add(wcPanBowl);

    const innerWellLiner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.138, 0.068, 0.16, 24, 1, true),
      innerBowlGlazeMat
    );
    innerWellLiner.position.set(panCenterX, 0.285, toiletZ);
    innerWellLiner.scale.set(1.16, 1.0, 0.93);
    toiletGroup.add(innerWellLiner);

    const waterSealDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.086, 0.072, 0.008, 22),
      waterSealMat
    );
    waterSealDisc.name = 'familyBathroom.waterSeal';
    waterSealDisc.position.set(panCenterX - 0.01, 0.224, toiletZ);
    waterSealDisc.scale.set(1.15, 1.0, 0.92);
    toiletGroup.add(waterSealDisc);

    const rearPanDeck = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.048, 0.25),
      vitreousChinaMat
    );
    rearPanDeck.position.set(panCenterX - 0.185, 0.38, toiletZ);
    rearPanDeck.castShadow = true;
    toiletGroup.add(rearPanDeck);

    const rearInletHorn = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.044, 0.07, 16),
      vitreousChinaMat
    );
    rearInletHorn.rotation.z = Math.PI / 2;
    rearInletHorn.position.set(panCenterX - 0.255, 0.382, toiletZ);
    toiletGroup.add(rearInletHorn);

    const wcSeat = new THREE.Mesh(
      new THREE.TorusGeometry(0.164, 0.027, 18, 36),
      walnutSeatMat
    );
    wcSeat.name = 'familyBathroom.toiletSeat';
    wcSeat.rotation.x = Math.PI / 2;
    wcSeat.position.set(panCenterX + 0.006, 0.418, toiletZ);
    wcSeat.scale.set(1.17, 0.95, 0.36);
    wcSeat.castShadow = true;
    wcSeat.receiveShadow = true;
    toiletGroup.add(wcSeat);

    const walnutHingeBlock = new THREE.Mesh(
      new THREE.BoxGeometry(0.052, 0.018, 0.21),
      walnutSeatMat
    );
    walnutHingeBlock.position.set(panCenterX - 0.175, 0.418, toiletZ);
    walnutHingeBlock.castShadow = true;
    toiletGroup.add(walnutHingeBlock);

    for (const hingeSideZ of [-1, 1] as const) {
      const hingePillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.015, 0.034, 12),
        brassMat
      );
      hingePillar.position.set(panCenterX - 0.182, 0.418, toiletZ + hingeSideZ * 0.078);
      toiletGroup.add(hingePillar);
    }
    const hingeCrossBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.18, 12),
      brassMat
    );
    hingeCrossBar.rotation.x = Math.PI / 2;
    hingeCrossBar.position.set(panCenterX - 0.182, 0.426, toiletZ);
    toiletGroup.add(hingeCrossBar);

    const cisternCenterX = 0.11;
    const cisternBaseY = 0.73;
    const cisternH = 0.31;
    const cisternW = 0.46;
    const cisternD = 0.2;

    const cisternLowerSkirt = new THREE.Mesh(
      new THREE.BoxGeometry(cisternD - 0.016, 0.028, cisternW - 0.02),
      vitreousChinaMat
    );
    cisternLowerSkirt.position.set(cisternCenterX - 0.005, cisternBaseY + 0.014, toiletZ);
    cisternLowerSkirt.castShadow = true;
    toiletGroup.add(cisternLowerSkirt);

    const wcCistern = new THREE.Mesh(
      new THREE.BoxGeometry(cisternD, cisternH - 0.028, cisternW),
      vitreousChinaMat
    );
    wcCistern.name = 'familyBathroom.cistern';
    wcCistern.position.set(cisternCenterX, cisternBaseY + 0.028 + (cisternH - 0.028) / 2, toiletZ);
    wcCistern.castShadow = true;
    wcCistern.receiveShadow = true;
    toiletGroup.add(wcCistern);

    const cisternFrontPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.19, 0.36),
      vitreousChinaMat
    );
    cisternFrontPanel.position.set(cisternCenterX + cisternD / 2 + 0.004, cisternBaseY + 0.165, toiletZ);
    toiletGroup.add(cisternFrontPanel);

    const makerBadgeRim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.032, 0.008, 16),
      brassMat
    );
    makerBadgeRim.rotation.z = Math.PI / 2;
    makerBadgeRim.position.set(cisternCenterX + cisternD / 2 + 0.011, cisternBaseY + 0.17, toiletZ);
    makerBadgeRim.scale.set(1.0, 1.35, 0.72);
    toiletGroup.add(makerBadgeRim);

    const cisternCorniceStep = new THREE.Mesh(
      new THREE.BoxGeometry(cisternD + 0.022, 0.024, cisternW + 0.026),
      vitreousChinaMat
    );
    cisternCorniceStep.position.set(cisternCenterX + 0.004, cisternBaseY + cisternH + 0.012, toiletZ);
    cisternCorniceStep.castShadow = true;
    toiletGroup.add(cisternCorniceStep);

    const cisternLid = new THREE.Mesh(
      new THREE.BoxGeometry(cisternD + 0.006, 0.022, cisternW + 0.008),
      vitreousChinaMat
    );
    cisternLid.name = 'familyBathroom.cisternLid';
    cisternLid.position.set(cisternCenterX + 0.002, cisternBaseY + cisternH + 0.034, toiletZ);
    cisternLid.castShadow = true;
    toiletGroup.add(cisternLid);

    for (const brkSideZ of [-1, 1] as const) {
      const brkZ = toiletZ + brkSideZ * 0.155;
      const wallLeg = new THREE.Mesh(
        new THREE.BoxGeometry(0.016, 0.13, 0.024),
        brassMat
      );
      wallLeg.position.set(0.014, cisternBaseY - 0.055, brkZ);
      toiletGroup.add(wallLeg);

      const topArm = new THREE.Mesh(
        new THREE.BoxGeometry(0.165, 0.014, 0.022),
        brassMat
      );
      topArm.position.set(0.09, cisternBaseY - 0.004, brkZ);
      toiletGroup.add(topArm);

      const scrollStrut = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.006, 0.16, 10),
        brassMat
      );
      scrollStrut.rotation.z = -0.82;
      scrollStrut.position.set(0.075, cisternBaseY - 0.055, brkZ);
      toiletGroup.add(scrollStrut);
    }

    const leverZ = toiletZ + 0.155;
    const leverY = cisternBaseY + 0.235;
    const leverFulcrum = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.022, 0.026, 14),
      brassMat
    );
    leverFulcrum.rotation.z = Math.PI / 2;
    leverFulcrum.position.set(cisternCenterX + cisternD / 2 + 0.016, leverY, leverZ);
    toiletGroup.add(leverFulcrum);

    const leverArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0055, 0.0055, 0.075, 10),
      brassMat
    );
    leverArm.rotation.x = Math.PI / 2;
    leverArm.rotation.z = -0.22;
    leverArm.position.set(cisternCenterX + cisternD / 2 + 0.032, leverY - 0.008, leverZ + 0.032);
    toiletGroup.add(leverArm);

    const ceramicTorpedoHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.011, 0.009, 0.068, 14),
      vitreousChinaMat
    );
    ceramicTorpedoHandle.name = 'familyBathroom.flushLever';
    ceramicTorpedoHandle.rotation.x = Math.PI / 2;
    ceramicTorpedoHandle.position.set(cisternCenterX + cisternD / 2 + 0.036, leverY - 0.014, leverZ + 0.078);
    ceramicTorpedoHandle.castShadow = true;
    toiletGroup.add(ceramicTorpedoHandle);

    const handleFinial = new THREE.Mesh(
      new THREE.SphereGeometry(0.009, 10, 10),
      brassMat
    );
    handleFinial.position.set(cisternCenterX + cisternD / 2 + 0.036, leverY - 0.014, leverZ + 0.114);
    toiletGroup.add(handleFinial);

    const flushPipeX = 0.125;
    const cisternNut = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.028, 0.026, 14),
      brassMat
    );
    cisternNut.position.set(flushPipeX, cisternBaseY - 0.012, toiletZ);
    toiletGroup.add(cisternNut);

    const flushPipeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(flushPipeX, cisternBaseY, toiletZ),
      new THREE.Vector3(flushPipeX, 0.43, toiletZ),
      new THREE.Vector3(flushPipeX + 0.02, 0.385, toiletZ),
      new THREE.Vector3(panCenterX - 0.25, 0.382, toiletZ),
    ]);
    const flushPipe = new THREE.Mesh(
      new THREE.TubeGeometry(flushPipeCurve, 18, 0.019, 12, false),
      brassMat
    );
    flushPipe.name = 'familyBathroom.flushPipe';
    flushPipe.castShadow = true;
    toiletGroup.add(flushPipe);

    scene.add(toiletGroup);
  }

  // West Load-Bearing Cross-Wall between Family Bathroom/Passage and Main Staircase Landing (0.24m thick, X = -12.81m..-13.05m)
  // Open passage/doorway at Z = +1.55m with cased antique oak architrave portal matching downstairs
  addUpperInteriorWall(-12.93, floorTopY, upperWallTopY, -0.7, 0.24, 3.6, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });
  // Clean antique-oak profiled skirting segments on the West (`X = -13.05m`, Upper Landing) face of the X = -12.93m Cross-Wall
  for (const [z0, z1] of [
    [-2.478, -1.34],
    [0.46, 1.018],
    [2.082, 2.22],
  ] as const) {
    const skirtMesh = new THREE.Mesh(
      buildMitredWallSkirtingGeometry(
        [
          [-13.05, z0],
          [-13.05, z1],
        ],
        floorTopY
      ),
      antiqueOakSkirtingMat
    );
    skirtMesh.userData.isArchitecturalShell = true;
    skirtMesh.castShadow = true;
    skirtMesh.receiveShadow = true;
    scene.add(skirtMesh);
  }
  // Issue #11: Stop the South cross-wall pier at `Z = 2.398m` (`z = 2.199, d = 0.398`) and inset its East face by `2mm` across `Z = 2.22m..2.40m`
  // so it never Z-fights with the `+X` face of the Upper Landing South wall (`Z = 2.22m..2.68m`)!
  addUpperInteriorWall(-12.93, floorTopY, upperWallTopY, 2.199, 0.24, 0.398, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
  });
  addUpperInteriorWall(-12.93, floorTopY + doorH, upperWallTopY, 1.55, 0.24, 0.9, warmRoomPlasterMat, {
    skipSkirting: true,
    skipCap: true,
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

  // Issue #5, #9 & #10: Full-Span Trapezoidal Upper Gable Extension on the X = -12.93m Cross-Wall (Y = 4.16m..4.52m)
  {
    const crossGableShape = new THREE.Shape();
    crossGableShape.moveTo(-2.5, upperWallTopY);
    crossGableShape.lineTo(2.398, upperWallTopY);
    crossGableShape.lineTo(1.05, collarCeilingY);
    crossGableShape.lineTo(-1.15, collarCeilingY);
    crossGableShape.closePath();
    const crossGableGeo = new THREE.ExtrudeGeometry(crossGableShape, {
      depth: 0.24,
      bevelEnabled: false,
    });
    crossGableGeo.rotateY(-Math.PI / 2);
    crossGableGeo.translate(-12.93 + 0.12, 0, 0);
    const crossGableMesh = new THREE.Mesh(crossGableGeo, warmRoomPlasterMat);
    crossGableMesh.name = 'familyBathroom.westWallUpperGable';
    crossGableMesh.userData.isArchitecturalShell = true;
    crossGableMesh.castShadow = true;
    crossGableMesh.receiveShadow = true;
    scene.add(crossGableMesh);
  }
}
