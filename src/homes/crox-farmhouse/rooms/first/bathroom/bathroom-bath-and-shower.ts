import * as THREE from 'three';
import {
  buildArmstrongConcealedShowerSet,
  buildArmstrongFreestandingBathMixer,
  buildBcDesignsCopperBoatBath,
  getAcrymiteWhiteMaterial,
  getBathroomBrassMaterials,
  getBathroomTextileMaterials,
  getZelligeCreamWallTileMaterial,
  prepGeo,
  wallFacingToRotY,
} from '../../../../../objects/sanitaryware/index.ts';

export interface FamilyBathroomBathAndShowerKit {
  brassMat: THREE.Material;
  ceramicWhiteMat: THREE.Material;
  floorTopY: number;
  windowGlassMat: THREE.Material;
}

/**
 * Builds the Principal / Master Bathroom (`familyBathroom`, Room 17):
 * - Enlarged `1550 × 900mm` SW Walk-In Shower on a crisp `42mm`-high gloss-white raised stone-resin
 *   `Matki Continental 40` Shower Tray (`#5, #13`) with perimeter rim curb, stepped internal well,
 *   4 subtle drainage fall planes, `LPW90` Polished Brass fast-flow waste, handmade cream vertical
 *   zellige shower wall tiling, `Matki EauZone Plus` `EWP950-LB` Living Brass 10mm glass screen,
 *   `KERDI-BOARD-SN` brass-trimmed recessed tiled niche, and `Perrin & Rowe TSS2BR8` 8" shower set
 * - Wall-mounted ball-jointed `Vogue UK Regency` (`LG013-BR`) Unlacquered Polished Brass heated towel rail
 *   with folded striped cotton bath towel on the West face of `firstFloor.interiorWall.1` (`#10, #11`)
 * - Sculpted `BC Designs BAC070` Copper Plinth Roll-Top Boat Bath + `WAS050G` Brass Clicker Waste
 *   + `Perrin & Rowe 3520/1BR` Traditional Floorstanding Bath-Shower Mixer clearing the survey-calibrated
 *   North cottage window (`#9`)
 */
export function buildFamilyBathroomBathAndShower(
  scene: THREE.Group,
  kit: FamilyBathroomBathAndShowerKit
): void {
  const { floorTopY, windowGlassMat } = kit;
  const brBrass = getBathroomBrassMaterials('BR');
  const acrymiteWhiteMat = getAcrymiteWhiteMaterial();
  const zelligeTileMat = getZelligeCreamWallTileMaterial();
  const textiles = getBathroomTextileMaterials();

  // =========================================================================
  // 1. ENLARGED 1550 × 900mm SW WALK-IN SHOWER ON CRISP GLOSS-WHITE SHOWER TRAY (#5 & #13)
  //    Bounds: X = [-12.81 .. -11.91]m (0.90m W), Z = [-0.65 .. +0.90]m (1.55m L)
  // =========================================================================
  {
    const showerGroup = new THREE.Group();
    showerGroup.name = 'familyBathroom.showerEnclosure';

    const trayWestX = -12.81;
    const trayEastX = -11.91;
    const trayNorthZ = -0.65;
    const traySouthZ = 0.9;
    const trayW = trayEastX - trayWestX; // 0.90m
    const trayL = traySouthZ - trayNorthZ; // 1.55m
    const trayCx = (trayWestX + trayEastX) * 0.5; // -12.36m
    const trayCz = (trayNorthZ + traySouthZ) * 0.5; // +0.125m

    const rimH = 0.042; // 42mm unmistakable raised gloss-white stone-resin perimeter rim
    const wellTopY = floorTopY + 0.03; // 12mm recessed internal standing well
    const rimTopY = floorTopY + rimH;
    const rimW = 0.048;

    const trayAssembly = new THREE.Group();
    trayAssembly.name = 'familyBathroom.showerTray';

    // Solid stone-resin base slab sitting proudly above the limestone floor (zero Z-fighting)
    const baseWell = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(trayW - 0.008, 0.03, trayL - 0.008)),
      acrymiteWhiteMat
    );
    baseWell.name = 'familyBathroom.showerTray.standingWell';
    baseWell.position.set(trayCx, floorTopY + 0.015, trayCz);
    baseWell.castShadow = true;
    baseWell.receiveShadow = true;
    trayAssembly.add(baseWell);

    // Raised 42mm perimeter rim curbs around all 4 edges so the white tray reads unmistakably in 1PV
    const nsRimGeo = prepGeo(new THREE.BoxGeometry(trayW, rimH, rimW));
    for (const [edgeName, rz] of [
      ['northRim', trayNorthZ + rimW * 0.5],
      ['southRim', traySouthZ - rimW * 0.5],
    ] as const) {
      const rim = new THREE.Mesh(nsRimGeo, acrymiteWhiteMat);
      rim.name = `familyBathroom.showerTray.${edgeName}`;
      rim.position.set(trayCx, floorTopY + rimH * 0.5, rz);
      rim.castShadow = true;
      rim.receiveShadow = true;
      trayAssembly.add(rim);
    }

    const ewRimGeo = prepGeo(new THREE.BoxGeometry(rimW, rimH, trayL - rimW * 2));
    for (const [edgeName, rx] of [
      ['westRim', trayWestX + rimW * 0.5],
      ['eastRim', trayEastX - rimW * 0.5],
    ] as const) {
      const rim = new THREE.Mesh(ewRimGeo, acrymiteWhiteMat);
      rim.name = `familyBathroom.showerTray.${edgeName}`;
      rim.position.set(rx, floorTopY + rimH * 0.5, trayCz);
      rim.castShadow = true;
      rim.receiveShadow = true;
      trayAssembly.add(rim);
    }

    // Subtle molded inner anti-slip frame & 4 drainage fall crease lines converging to waste
    const drainX = -12.5;
    const drainZ = 0.52;
    const creaseMat = new THREE.MeshStandardMaterial({
      color: 0xe2e0da,
      roughness: 0.22,
      metalness: 0.0,
    });
    const innerStep = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(trayW - rimW * 2 - 0.02, 0.0025, trayL - rimW * 2 - 0.02)),
      acrymiteWhiteMat
    );
    innerStep.name = 'familyBathroom.showerTray.innerDrainDeck';
    innerStep.position.set(trayCx, wellTopY + 0.001, trayCz);
    innerStep.receiveShadow = true;
    trayAssembly.add(innerStep);

    const corners: readonly [string, number, number][] = [
      ['nwFallCrease', trayWestX + rimW, trayNorthZ + rimW],
      ['neFallCrease', trayEastX - rimW, trayNorthZ + rimW],
      ['swFallCrease', trayWestX + rimW, traySouthZ - rimW],
      ['seFallCrease', trayEastX - rimW, traySouthZ - rimW],
    ];
    for (const [cName, cxCorner, czCorner] of corners) {
      const dx = drainX - cxCorner;
      const dz = drainZ - czCorner;
      const segLen = Math.max(0.08, Math.hypot(dx, dz) - 0.055);
      const crease = new THREE.Mesh(
        prepGeo(new THREE.BoxGeometry(0.003, 0.0015, segLen)),
        creaseMat
      );
      crease.name = `familyBathroom.showerTray.${cName}`;
      crease.userData.lodTier = 'high';
      crease.userData.lodMaxDistance = 12;
      crease.rotation.y = Math.atan2(dx, dz);
      const midFrac = 0.52;
      crease.position.set(
        cxCorner + dx * midFrac,
        wellTopY + 0.0024,
        czCorner + dz * midFrac
      );
      trayAssembly.add(crease);
    }

    showerGroup.add(trayAssembly);

    // LPW90 Polished Brass 90mm Circular Fastflow Waste Bezel & Dome Cover
    const wasteRecess = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.048, 0.046, 0.003, 24)),
      brBrass.darkShadow
    );
    wasteRecess.name = 'familyBathroom.showerEnclosure.lpw90WasteCup';
    wasteRecess.userData.lodTier = 'high';
    wasteRecess.userData.lodMaxDistance = 12;
    wasteRecess.position.set(drainX, wellTopY + 0.0018, drainZ);
    showerGroup.add(wasteRecess);

    const showerDrainGrate = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.043, 0.045, 0.005, 24)),
      brBrass.primary
    );
    showerDrainGrate.name = 'familyBathroom.showerEnclosure.lpw90BrassWaste';
    showerDrainGrate.userData.lodTier = 'high';
    showerDrainGrate.userData.lodMaxDistance = 12;
    showerDrainGrate.position.set(drainX, wellTopY + 0.0042, drainZ);
    showerGroup.add(showerDrainGrate);

    // Handmade Glazed Cream Vertical Zellige Shower Wall Tiling (West & South wet walls + Brass Schluter trims)
    const screenH = 2.0;
    const tileCenterY = rimTopY + screenH * 0.5;
    const westTilePanel = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(0.005, screenH, trayL - 0.004)),
      zelligeTileMat
    );
    westTilePanel.name = 'familyBathroom.showerEnclosure.westZelligeTiling';
    westTilePanel.position.set(trayWestX + 0.0028, tileCenterY, trayCz);
    westTilePanel.receiveShadow = true;
    showerGroup.add(westTilePanel);

    const southTilePanel = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(trayW - 0.004, screenH, 0.005)),
      zelligeTileMat
    );
    southTilePanel.name = 'familyBathroom.showerEnclosure.southZelligeTiling';
    southTilePanel.position.set(trayCx, tileCenterY, traySouthZ - 0.0028);
    southTilePanel.receiveShadow = true;
    showerGroup.add(southTilePanel);

    // Polished Brass Schluter Jolly edge trim profiles framing the shower tiling
    const vertTrimGeo = prepGeo(new THREE.BoxGeometry(0.007, screenH + 0.004, 0.007));
    for (const [tName, tx, tz] of [
      ['northTileEdgeTrim', trayWestX + 0.0035, trayNorthZ + 0.002],
      ['eastTileEdgeTrim', trayEastX - 0.002, traySouthZ - 0.0035],
    ] as const) {
      const trim = new THREE.Mesh(vertTrimGeo, brBrass.primary);
      trim.name = `familyBathroom.showerEnclosure.${tName}`;
      trim.userData.lodTier = 'high';
      trim.userData.lodMaxDistance = 14;
      trim.position.set(tx, tileCenterY, tz);
      showerGroup.add(trim);
    }

    // Matki EauZone Plus EWP950-LB 2000mm H 10mm Solid Safety Glass Screen (950mm panel -> 600mm walk-in entry!)
    const screenLen = 0.95;
    const screenCenterZ = traySouthZ - screenLen * 0.5; // +0.425m (spans -0.05..+0.90m)
    const screenX = trayEastX - 0.022; // -11.932m centered on east rim curb

    const showerGlassScreen = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(0.01, screenH, screenLen)),
      windowGlassMat
    );
    showerGlassScreen.name = 'familyBathroom.showerGlass';
    showerGlassScreen.position.set(screenX, rimTopY + screenH * 0.5, screenCenterZ);
    showerGroup.add(showerGlassScreen);

    // Unlacquered Living Brass (BR) vertical South wall channel, bottom tray channel & overhead stay bar
    const glassWallChannel = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(0.024, screenH, 0.022)),
      brBrass.primary
    );
    glassWallChannel.name = 'familyBathroom.showerEnclosure.wallChannel';
    glassWallChannel.userData.lodTier = 'high';
    glassWallChannel.userData.lodMaxDistance = 14;
    glassWallChannel.position.set(screenX, rimTopY + screenH * 0.5, traySouthZ - 0.014);
    showerGroup.add(glassWallChannel);

    const glassBottomChannel = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(0.018, 0.014, screenLen)),
      brBrass.primary
    );
    glassBottomChannel.name = 'familyBathroom.showerEnclosure.bottomSealChannel';
    glassBottomChannel.userData.lodTier = 'high';
    glassBottomChannel.userData.lodMaxDistance = 14;
    glassBottomChannel.position.set(screenX, rimTopY + 0.007, screenCenterZ);
    showerGroup.add(glassBottomChannel);

    const armSpan = screenX - (trayWestX + 0.006);
    const glassSupportArm = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.0085, 0.0085, armSpan, 14)),
      brBrass.primary
    );
    glassSupportArm.name = 'familyBathroom.showerEnclosure.supportArm';
    glassSupportArm.userData.lodTier = 'high';
    glassSupportArm.userData.lodMaxDistance = 14;
    glassSupportArm.rotation.z = Math.PI / 2;
    glassSupportArm.position.set((trayWestX + 0.006 + screenX) * 0.5, rimTopY + 1.975, -0.02);
    showerGroup.add(glassSupportArm);

    // KERDI-BOARD-SN Brass-Trimmed Recessed Tiled Shower Niche on South shower wall (X = -12.38m, Z = 0.89m)
    const nicheY = rimTopY + 1.18;
    const nicheTrim = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(0.36, 0.42, 0.016)),
      brBrass.primary
    );
    nicheTrim.name = 'familyBathroom.showerEnclosure.kerdiBoardNicheTrim';
    nicheTrim.userData.lodTier = 'high';
    nicheTrim.userData.lodMaxDistance = 12;
    nicheTrim.position.set(-12.38, nicheY, 0.888);
    showerGroup.add(nicheTrim);

    const nicheInner = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(0.326, 0.386, 0.014)),
      zelligeTileMat
    );
    nicheInner.name = 'familyBathroom.showerEnclosure.kerdiBoardNicheBack';
    nicheInner.position.set(-12.38, nicheY, 0.883);
    showerGroup.add(nicheInner);

    // Two amber-glass apothecary wash bottles inside the recessed shower niche
    const amberGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x6e3a16,
      roughness: 0.14,
      metalness: 0.04,
      clearcoat: 0.7,
    });
    const bottleGeo = prepGeo(new THREE.CylinderGeometry(0.028, 0.028, 0.145, 16));
    const pumpGeo = prepGeo(new THREE.CylinderGeometry(0.009, 0.011, 0.032, 12));
    for (const [bIdx, bx] of [-12.44, -12.33].entries()) {
      const bottle = new THREE.Mesh(bottleGeo, amberGlassMat);
      bottle.name = `familyBathroom.showerEnclosure.nicheBottle_${bIdx + 1}`;
      bottle.userData.lodTier = 'high';
      bottle.userData.lodMaxDistance = 10;
      bottle.position.set(bx, nicheY - 0.193 + 0.0725, 0.875);
      showerGroup.add(bottle);

      const pump = new THREE.Mesh(pumpGeo, brBrass.primary);
      pump.name = `familyBathroom.showerEnclosure.nicheBottlePump_${bIdx + 1}`;
      pump.userData.lodTier = 'high';
      pump.userData.lodMaxDistance = 10;
      pump.position.set(bx, nicheY - 0.193 + 0.16, 0.875);
      showerGroup.add(pump);
    }

    // Perrin & Rowe Traditional `TSS2BR8` Concealed 8" Thermostatic Shower Set centered on West shower wall
    const thermostaticSet = buildArmstrongConcealedShowerSet({
      namePrefix: 'familyBathroom.shower.thermostaticSet',
      finish: 'BR',
      style: 'traditional',
    });
    thermostaticSet.position.set(trayWestX + 0.006, rimTopY, 0.24);
    thermostaticSet.rotation.y = wallFacingToRotY('east');
    showerGroup.add(thermostaticSet);

    scene.add(showerGroup);
  }

  // =========================================================================
  // 2. WALL-MOUNTED POLISHED BRASS LADDER HEATED TOWEL RAIL ON `firstFloor.interiorWall.1` (#10 & #11)
  //    Mounted on West face of `bulkheadWestWall` (`X = -10.77m, Z = +0.40m, Y = 2.86..3.78m`, facing West `-X`)
  // =========================================================================
  {
    const towelRailGroup = new THREE.Group();
    towelRailGroup.name = 'familyBathroom.heatedTowelRail';
    // Placed right on X = -10.77m bulkhead West face at Z = +0.40m (Annotation #10: [-10.770, 3.363, 0.363])
    towelRailGroup.position.set(-10.77, floorTopY + 0.72, 0.4);

    const railH = 0.92;
    const halfSpanZ = 0.25; // 500mm rail width (Z = +0.15 .. +0.65m, clear of doorway Z = 0.90m)
    const standOffX = -0.105; // projects 105mm West into bathroom (-X)

    const uprightGeo = prepGeo(new THREE.CylinderGeometry(0.015, 0.015, railH, 16));
    const crossBarGeo = prepGeo(new THREE.CylinderGeometry(0.0125, 0.0125, halfSpanZ * 2, 16));
    const ballJointGeo = prepGeo(new THREE.SphereGeometry(0.021, 16, 12));
    const wallRoseGeo = prepGeo(new THREE.CylinderGeometry(0.028, 0.031, 0.012, 18));
    const standoffTubeGeo = prepGeo(new THREE.CylinderGeometry(0.01, 0.01, Math.abs(standOffX), 12));
    const valveBodyGeo = prepGeo(new THREE.CylinderGeometry(0.016, 0.016, 0.052, 14));

    for (const [sideIdx, zOff] of [-halfSpanZ, halfSpanZ].entries()) {
      const sideLabel = sideIdx === 0 ? 'north' : 'south';
      const upright = new THREE.Mesh(uprightGeo, brBrass.primary);
      upright.name = `familyBathroom.heatedTowelRail.upright.${sideLabel}`;
      upright.position.set(standOffX, railH * 0.5, zOff);
      upright.castShadow = true;
      towelRailGroup.add(upright);

      for (const [bIdx, yOff] of [0.06, railH - 0.06].entries()) {
        const rose = new THREE.Mesh(wallRoseGeo, brBrass.primary);
        rose.name = `familyBathroom.heatedTowelRail.wallRose.${sideLabel}_${bIdx + 1}`;
        rose.userData.lodTier = 'high';
        rose.userData.lodMaxDistance = 12;
        rose.rotation.z = Math.PI / 2;
        rose.position.set(-0.006, yOff, zOff);
        towelRailGroup.add(rose);

        const bracket = new THREE.Mesh(standoffTubeGeo, brBrass.primary);
        bracket.name = `familyBathroom.heatedTowelRail.bracket_${sideIdx * 2 + bIdx + 1}`;
        bracket.userData.lodTier = 'high';
        bracket.userData.lodMaxDistance = 12;
        bracket.rotation.z = Math.PI / 2;
        bracket.position.set(standOffX * 0.5, yOff, zOff);
        towelRailGroup.add(bracket);
      }

      // Traditional angled brass crosshead valve at bottom of each upright
      const valve = new THREE.Mesh(valveBodyGeo, brBrass.primary);
      valve.name = `familyBathroom.heatedTowelRail.valve.${sideLabel}`;
      valve.userData.lodTier = 'high';
      valve.userData.lodMaxDistance = 12;
      valve.position.set(standOffX, -0.02, zOff);
      towelRailGroup.add(valve);
    }

    const barHeights = [0.06, 0.28, 0.5, 0.72, railH - 0.06] as const;
    for (const [i, ry] of barHeights.entries()) {
      const bar = new THREE.Mesh(crossBarGeo, brBrass.primary);
      bar.name = `familyBathroom.heatedTowelRail.bar_${i + 1}`;
      bar.rotation.x = Math.PI / 2;
      bar.position.set(standOffX, ry, 0);
      bar.castShadow = true;
      towelRailGroup.add(bar);

      for (const [sIdx, zOff] of [-halfSpanZ, halfSpanZ].entries()) {
        const ball = new THREE.Mesh(ballJointGeo, brBrass.primary);
        ball.name = `familyBathroom.heatedTowelRail.ballJoint_${i + 1}_${sIdx === 0 ? 'n' : 's'}`;
        ball.userData.lodTier = 'high';
        ball.userData.lodMaxDistance = 12;
        ball.position.set(standOffX, ry, zOff);
        towelRailGroup.add(ball);
      }
    }

    // Folded cream & soft-taupe striped woven cotton bath towel draped over bar_3 (matching Slide 3 right photo!)
    const towelW = 0.34;
    const towelDrop = 0.39;
    const towelBarY = 0.5;
    const towelShape = new THREE.Shape();
    const rTop = 0.022;
    towelShape.moveTo(-rTop, -towelDrop);
    towelShape.lineTo(-rTop, 0);
    towelShape.absarc(0, 0, rTop, Math.PI, 0, true);
    towelShape.lineTo(rTop, -towelDrop * 0.94);
    towelShape.lineTo(rTop - 0.011, -towelDrop * 0.94);
    towelShape.lineTo(rTop - 0.011, 0);
    towelShape.absarc(0, 0, rTop - 0.011, 0, Math.PI, false);
    towelShape.lineTo(-rTop + 0.011, -towelDrop);
    towelShape.closePath();

    const towelGeo = prepGeo(
      new THREE.ExtrudeGeometry(towelShape, {
        depth: towelW,
        bevelEnabled: true,
        bevelThickness: 0.004,
        bevelSize: 0.004,
        bevelSegments: 2,
        curveSegments: 16,
      })
    );
    towelGeo.translate(0, 0, -towelW * 0.5);
    const drapedTowel = new THREE.Mesh(towelGeo, textiles.stripedRailTowel);
    drapedTowel.name = 'familyBathroom.heatedTowelRail.stripedBathTowel';
    drapedTowel.position.set(standOffX, towelBarY + 0.004, 0);
    drapedTowel.castShadow = true;
    drapedTowel.receiveShadow = true;
    towelRailGroup.add(drapedTowel);

    scene.add(towelRailGroup);
  }

  // =========================================================================
  // 3. SCULPTED BC DESIGNS COPPER BOAT BATH + P&R 3520/1BR FLOORSTANDING MIXER
  //    Positioned at X = -11.55m, Z = -1.48m to align gracefully under the lowered
  //    survey-calibrated North cottage window (Win 1763678: X = -11.35m, Y = 2.32..3.24m)
  // =========================================================================
  const copperBoatBath = buildBcDesignsCopperBoatBath({
    namePrefix: 'familyBathroom.copperBoatBath',
    lengthM: 1.7,
    widthM: 0.74,
    endHeightM: 0.676,
    centerHeightM: 0.64,
    brassFinish: 'BR',
    overflowEnd: 'west',
  });
  copperBoatBath.position.set(-11.55, floorTopY, -1.48);
  copperBoatBath.rotation.y = 0;
  scene.add(copperBoatBath);

  // Perrin & Rowe `3520/1BR` Traditional Twin-Leg Floorstanding Bath-Shower Mixer
  // Standpipes at Z = -1.96m (500mm clear of North window board, 110mm behind bath outer rim),
  // 210mm swan-neck spout overhanging cleanly to Z = -1.75m above the 640mm soaking well & internal overflow!
  const bathMixer = buildArmstrongFreestandingBathMixer({
    namePrefix: 'familyBathroom.bathMixer',
    finish: 'BR',
    style: 'traditional',
    overallHeightM: 0.958,
    spoutOutletHeightM: 0.827,
    spoutReachM: 0.21,
  });
  bathMixer.position.set(-11.55, floorTopY, -1.96);
  bathMixer.rotation.y = wallFacingToRotY('south');
  scene.add(bathMixer);
}
