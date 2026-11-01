import * as THREE from 'three';
import {
  buildArmstrongConcealedShowerSet,
  buildArmstrongFreestandingBathMixer,
  buildBcDesignsCopperBoatBath,
  getBathroomBrassMaterials,
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
 * - Matki `EauZone Plus` `EWP850-LB` (`2000mm H`, `10mm` glass in Unlacquered Living Brass) + Matki `Continental 30` low-profile tray & `LPW90` Brass waste + `KERDI-BOARD-SN` niche
 * - Perrin & Rowe `TSS2BR8` Concealed Traditional 8" Shower Set (`BR` Polished Brass w/ porcelain lever & handshower)
 * - Vogue UK `Baroque` `LG014-BR` Unlacquered Polished Brass Towel Warmer
 * - BC Designs `BAC040` (`1700 × 740 × 715mm`) Copper Boat Bath + `WAS050G` Clicker Waste + `WAS080G` Shallow P-Trap
 * - Perrin & Rowe `3520/1BR` Traditional Twin-Leg Floorstanding Bath-Shower Mixer w/ Porcelain Levers, Bridge & Cradle
 */
export function buildFamilyBathroomBathAndShower(
  scene: THREE.Group,
  kit: FamilyBathroomBathAndShowerKit
): void {
  const { ceramicWhiteMat, floorTopY, windowGlassMat } = kit;
  const brBrass = getBathroomBrassMaterials('BR');

  // 1. Matki EauZone Plus Walk-in Enclosure (EWP850-LB, 2000mm H) + Continental 30 Tray in SW corner
  {
    const showerGroup = new THREE.Group();
    showerGroup.name = 'familyBathroom.showerEnclosure';

    const showerTrayHeight = 0.03; // Matki Continental 30 low-profile 30mm stone-resin tray
    const showerTrayTopY = floorTopY + showerTrayHeight;

    const showerTrayGeo = new THREE.BoxGeometry(0.85, showerTrayHeight, 1.2);
    showerTrayGeo.computeBoundingSphere();
    const showerTray = new THREE.Mesh(showerTrayGeo, ceramicWhiteMat);
    showerTray.name = 'familyBathroom.showerTray';
    showerTray.position.set(-12.385, floorTopY + showerTrayHeight * 0.5, 0.3);
    showerTray.receiveShadow = true;
    showerGroup.add(showerTray);

    const showerDrainGrateGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.004, 18);
    showerDrainGrateGeo.computeBoundingSphere();
    const showerDrainGrate = new THREE.Mesh(showerDrainGrateGeo, brBrass.primary);
    showerDrainGrate.name = 'familyBathroom.showerEnclosure.lpw90BrassWaste';
    showerDrainGrate.userData.lodTier = 'high';
    showerDrainGrate.userData.lodMaxDistance = 12;
    showerDrainGrate.position.set(-12.52, showerTrayTopY + 0.001, 0.58);
    showerGroup.add(showerDrainGrate);

    // Matki EauZone Plus EWP850-LB 2000mm H 10mm Solid Safety Glass Screen
    const screenH = 2.0;
    const showerGlassScreenGeo = new THREE.BoxGeometry(0.01, screenH, 0.85);
    showerGlassScreenGeo.computeBoundingSphere();
    const showerGlassScreen = new THREE.Mesh(showerGlassScreenGeo, windowGlassMat);
    showerGlassScreen.name = 'familyBathroom.showerGlass';
    showerGlassScreen.position.set(-11.97, showerTrayTopY + screenH * 0.5, 0.465);
    showerGroup.add(showerGlassScreen);

    // Unlacquered Living Brass (BR) vertical wall channel & overhead bracing stay bar
    const glassWallChannelGeo = new THREE.BoxGeometry(0.024, screenH, 0.024);
    glassWallChannelGeo.computeBoundingSphere();
    const glassWallChannel = new THREE.Mesh(glassWallChannelGeo, brBrass.primary);
    glassWallChannel.name = 'familyBathroom.showerEnclosure.wallChannel';
    glassWallChannel.userData.lodTier = 'high';
    glassWallChannel.userData.lodMaxDistance = 12;
    glassWallChannel.position.set(-11.97, showerTrayTopY + screenH * 0.5, 0.888);
    showerGroup.add(glassWallChannel);

    const glassSupportArmGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.84, 12);
    glassSupportArmGeo.computeBoundingSphere();
    const glassSupportArm = new THREE.Mesh(glassSupportArmGeo, brBrass.primary);
    glassSupportArm.name = 'familyBathroom.showerEnclosure.supportArm';
    glassSupportArm.userData.lodTier = 'high';
    glassSupportArm.userData.lodMaxDistance = 12;
    glassSupportArm.rotation.z = Math.PI / 2;
    glassSupportArm.position.set(-12.39, showerTrayTopY + 1.98, 0.08);
    showerGroup.add(glassSupportArm);

    // KERDI-BOARD-SN Tiled Shower Niche on South shower wall (X = -12.385m, Z = 0.892m)
    const nicheTrimGeo = new THREE.BoxGeometry(0.32, 0.42, 0.016);
    nicheTrimGeo.computeBoundingSphere();
    const nicheTrim = new THREE.Mesh(nicheTrimGeo, brBrass.primary);
    nicheTrim.name = 'familyBathroom.showerEnclosure.kerdiBoardNicheTrim';
    nicheTrim.userData.lodTier = 'high';
    nicheTrim.userData.lodMaxDistance = 12;
    nicheTrim.position.set(-12.385, showerTrayTopY + 1.22, 0.892);
    showerGroup.add(nicheTrim);

    const nicheInnerGeo = new THREE.BoxGeometry(0.285, 0.385, 0.012);
    nicheInnerGeo.computeBoundingSphere();
    const nicheInner = new THREE.Mesh(nicheInnerGeo, ceramicWhiteMat);
    nicheInner.name = 'familyBathroom.showerEnclosure.kerdiBoardNicheBack';
    nicheInner.position.set(-12.385, showerTrayTopY + 1.22, 0.888);
    showerGroup.add(nicheInner);

    // Perrin & Rowe Traditional `TSS2BR8` Concealed 8" Thermostatic Shower Set on West shower wall
    const thermostaticSet = buildArmstrongConcealedShowerSet({
      namePrefix: 'familyBathroom.shower.thermostaticSet',
      finish: 'BR',
      style: 'traditional',
    });
    thermostaticSet.position.set(-12.81, showerTrayTopY, 0.34);
    thermostaticSet.rotation.y = wallFacingToRotY('east');
    showerGroup.add(thermostaticSet);

    scene.add(showerGroup);
  }

  // 1b. Vogue UK Baroque `LG014-BR` Unlacquered Polished Brass Floor/Wall Towel Warmer (West Wall X = -12.74m, Z = -0.58m)
  {
    const towelRailGroup = new THREE.Group();
    towelRailGroup.name = 'familyBathroom.heatedTowelRail';
    towelRailGroup.position.set(-12.74, floorTopY, -0.58);

    const sharedUprightGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.96, 14);
    sharedUprightGeo.computeBoundingSphere();
    const sharedRailBarGeo = new THREE.CylinderGeometry(0.013, 0.013, 0.56, 14);
    sharedRailBarGeo.computeBoundingSphere();
    const sharedBallGeo = new THREE.SphereGeometry(0.022, 14, 12);
    sharedBallGeo.computeBoundingSphere();
    const sharedWallBracketGeo = new THREE.CylinderGeometry(0.01, 0.013, 0.07, 10);
    sharedWallBracketGeo.computeBoundingSphere();
    const radColumnGeo = new THREE.BoxGeometry(0.068, 0.52, 0.40);
    radColumnGeo.computeBoundingSphere();

    // Traditional central white enameled multi-column radiator core inside the Baroque brass towel frame
    const radCore = new THREE.Mesh(radColumnGeo, ceramicWhiteMat);
    radCore.name = 'familyBathroom.heatedTowelRail.baroqueColumnCore';
    radCore.position.set(0.01, 0.54, 0);
    radCore.castShadow = true;
    towelRailGroup.add(radCore);

    for (const [sideIdx, zOff] of [-0.28, 0.28].entries()) {
      const sideLabel = sideIdx === 0 ? 'north' : 'south';
      const upright = new THREE.Mesh(sharedUprightGeo, brBrass.primary);
      upright.name = `familyBathroom.heatedTowelRail.upright.${sideLabel}`;
      upright.position.set(0.01, 0.48, zOff);
      upright.castShadow = true;
      towelRailGroup.add(upright);

      for (const [bIdx, yOff] of [0.18, 0.94].entries()) {
        const ball = new THREE.Mesh(sharedBallGeo, brBrass.primary);
        ball.name = `familyBathroom.heatedTowelRail.ballJoint.${sideLabel}_${bIdx + 1}`;
        ball.userData.lodTier = 'high';
        ball.userData.lodMaxDistance = 12;
        ball.position.set(0.01, yOff, zOff);
        towelRailGroup.add(ball);

        const bracket = new THREE.Mesh(sharedWallBracketGeo, brBrass.primary);
        bracket.name = `familyBathroom.heatedTowelRail.bracket_${sideIdx * 2 + bIdx + 1}`;
        bracket.userData.lodTier = 'high';
        bracket.userData.lodMaxDistance = 12;
        bracket.rotation.z = Math.PI / 2;
        bracket.position.set(-0.025, yOff, zOff);
        towelRailGroup.add(bracket);
      }
    }

    for (const [i, ry] of [0.18, 0.84, 0.94].entries()) {
      const bar = new THREE.Mesh(sharedRailBarGeo, brBrass.primary);
      bar.name = `familyBathroom.heatedTowelRail.bar_${i + 1}`;
      bar.userData.lodTier = 'high';
      bar.userData.lodMaxDistance = 12;
      bar.rotation.x = Math.PI / 2;
      bar.position.set(0.01, ry, 0);
      bar.castShadow = true;
      towelRailGroup.add(bar);
    }

    scene.add(towelRailGroup);
  }

  // 2. BC Designs Copper Boat Bath `BAC040` (`L1700 x W740 x H715mm` + `WAS050G` Brass Clicker Waste)
  const copperBoatBath = buildBcDesignsCopperBoatBath({
    namePrefix: 'familyBathroom.copperBoatBath',
    lengthM: 1.7,
    widthM: 0.74,
    endHeightM: 0.715,
    centerHeightM: 0.605,
    brassFinish: 'BR',
    overflowEnd: 'west',
  });
  copperBoatBath.position.set(-11.6, floorTopY, -1.48);
  copperBoatBath.rotation.y = 0;
  scene.add(copperBoatBath);

  // 3. Perrin & Rowe `3520/1BR` Traditional Twin-Leg Floorstanding Bath-Shower Mixer w/ Porcelain Levers & Cradle
  //    Centered behind the North saddle of the 1700mm Copper Boat Bath (`X = -11.60m, Z = -2.01m`, facing South `+Z`),
  //    projecting its 210mm swan-neck spout cleanly to `Z = -1.80m` over the 605mm centre saddle!
  const bathMixer = buildArmstrongFreestandingBathMixer({
    namePrefix: 'familyBathroom.bathMixer',
    finish: 'BR',
    style: 'traditional',
    overallHeightM: 0.958,
    spoutOutletHeightM: 0.827,
    spoutReachM: 0.21,
  });
  bathMixer.position.set(-11.6, floorTopY, -2.01);
  bathMixer.rotation.y = wallFacingToRotY('south');
  scene.add(bathMixer);
}
