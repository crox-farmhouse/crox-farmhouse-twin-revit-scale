import * as THREE from 'three';
import { buildRoomCeilingPendant, buildRoomCorstonToggleSwitch } from '../ground/kitchen-knx-lighting.ts';
import type { CutawayWallDescriptor, InteractiveUserData } from '../../../../core/types/scene.ts';
import { getBathroomBrassMaterials, getVitreousChinaMaterial } from '../../../../objects/sanitaryware/index.ts';
import type { SceneBuilderContext } from '../../../../engine/viewer/scene-types.ts';
import type { createFirstFloorMaterials } from '../../structure/first-floor-materials.ts';
import type { createFirstFloorShellKit } from '../../structure/first-floor-shell-kit.ts';

/**
 * KNX ceiling pendants and Corston toggle switches for every first-floor room.
 */
export function buildFirstFloorPendantsAndSwitches(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'floorTopY' | 'upperWallTopY'> &
    Pick<ReturnType<typeof createFirstFloorShellKit>, 'tagUpperCutawayWall'>,
  eastWingCtx: SceneBuilderContext = ctx
): void {
  const { firstFloorMeshGroup: scene, interactions, lightGroups } = ctx;
  const { firstFloorMeshGroup: ewScene } = eastWingCtx;
  const { floorTopY, tagUpperCutawayWall } = kit;
  // =========================================================================
  // 9. KNX CEILING PENDANTS & CORSTON TOGGLE SWITCHES FOR ALL FIRST FLOOR ROOMS
  //    (Mounted to `scene` = `firstFloorMeshGroup` so they hide cleanly when
  //    First Floor visibility is toggled off)
  // =========================================================================
  const ewCollarCeilingY = 4.65;
  const mainBedCollarCeilingY = 5.065;
  const mainBedFloorTopY = 2.51;
  const bed2FloorTopY = 2.05;
  const bed3FloorTopY = 2.08;
  const bed4FloorTopY = 2.05;

  // 1. Main Bedroom (Circuit: mainBedroomPendant, Switch PA: 1.2.10)
  buildRoomCeilingPendant(eastWingCtx, {
    circuitId: 'mainBedroomPendant',
    x: -7.1,
    z: -0.05,
    ceilingY: mainBedCollarCeilingY,
    dropLength: 0.48,
    floorY: mainBedFloorTopY,
    pointLightIntensity: 13.5,
    pointLightDistance: 7.4,
    addPointLight: false,
    parentGroup: ewScene,
  });
  buildRoomCorstonToggleSwitch(eastWingCtx, {
    circuitId: 'mainBedroomPendant',
    switchPa: '1.2.10',
    location: 'Main Bedroom — West Wall (by Door)',
    x: -9.56,
    y: mainBedFloorTopY + 1.15,
    z: 0.92,
    facing: 'east',
    parentGroup: ewScene,
  });

  // 2. Principal Family Bathroom (Circuit: familyBathroomPendant, Switch PA: 1.2.11)
  buildRoomCeilingPendant(eastWingCtx, {
    circuitId: 'familyBathroomPendant',
    x: -11.3,
    z: -0.75,
    ceilingY: ewCollarCeilingY,
    dropLength: 0.38,
    floorY: floorTopY,
    pointLightIntensity: 12.5,
    pointLightDistance: 6.5,
    addPointLight: false,
    parentGroup: ewScene,
  });
  // Issue #7: Polished Brass & White Porcelain Ceiling Pull-Cord Switch (PA 1.2.11)
  // Mounted on the Y = 4.65m ceiling at (-11.76, 4.65, 0.82) just clear of firstFloor.interiorWall.4 (Z = 0.90m),
  // dropping a fine braided silk cord down to a weighted Polished Brass & porcelain acorn pull at Y = 3.17..3.25m!
  {
    const brBrass = getBathroomBrassMaterials('BR');
    const chinaMat = getVitreousChinaMaterial();
    const cordSilkMat = new THREE.MeshStandardMaterial({
      color: 0xf3ede0,
      roughness: 0.82,
      metalness: 0.0,
    });
    const pullLedMat = new THREE.MeshStandardMaterial({
      color: 0xffb84d,
      emissive: new THREE.Color(0xff9d2e),
      emissiveIntensity: 3.0,
    });
    eastWingCtx.registerSwitchLedMaterial?.('familyBathroomPendant', pullLedMat);

    const pullX = -11.76;
    const pullZ = 0.82;
    const acornCenterY = 3.2; // Exact Annotation #7 height (ewLocal = [-11.770, 3.197, 0.900])!
    const roseDropBottomY = ewCollarCeilingY - 0.034;
    const cordTopY = roseDropBottomY;
    const cordBotY = acornCenterY + 0.044;
    const cordLen = cordTopY - cordBotY;

    const pullGroup = new THREE.Group();
    pullGroup.name = 'familyBathroom.pullCordSwitch';
    pullGroup.position.set(pullX, 0, pullZ);
    pullGroup.userData = {
      zone: 'familyBathroom',
      knxPushButtonPa: '1.2.11',
      switchLocation: 'Family bathroom — ceiling pull cord by doorway',
    };

    const ceilingRoseGeo = new THREE.CylinderGeometry(0.038, 0.042, 0.014, 24);
    ceilingRoseGeo.computeBoundingSphere();
    const ceilingRose = new THREE.Mesh(ceilingRoseGeo, brBrass.primary);
    ceilingRose.name = 'familyBathroom.pullCordSwitch.ceilingRose';
    ceilingRose.position.set(0, ewCollarCeilingY - 0.007, 0);
    pullGroup.add(ceilingRose);

    const switchBellGeo = new THREE.CylinderGeometry(0.022, 0.014, 0.022, 20);
    switchBellGeo.computeBoundingSphere();
    const switchBell = new THREE.Mesh(switchBellGeo, brBrass.primary);
    switchBell.name = 'familyBathroom.pullCordSwitch.switchBell';
    switchBell.position.set(0, ewCollarCeilingY - 0.024, 0);
    pullGroup.add(switchBell);

    const statusRingGeo = new THREE.TorusGeometry(0.024, 0.002, 8, 20);
    statusRingGeo.computeBoundingSphere();
    const statusRing = new THREE.Mesh(statusRingGeo, pullLedMat);
    statusRing.name = 'familyBathroom.pullCordSwitch.statusLed';
    statusRing.userData.lodTier = 'high';
    statusRing.userData.lodMaxDistance = 12;
    statusRing.rotation.x = Math.PI * 0.5;
    statusRing.position.set(0, ewCollarCeilingY - 0.015, 0);
    pullGroup.add(statusRing);

    const cordGeo = new THREE.CylinderGeometry(0.0022, 0.0022, cordLen, 10);
    cordGeo.computeBoundingSphere();
    const cordMesh = new THREE.Mesh(cordGeo, cordSilkMat);
    cordMesh.name = 'familyBathroom.pullCordSwitch.braidedCord';
    cordMesh.position.set(0, (cordTopY + cordBotY) * 0.5, 0);
    pullGroup.add(cordMesh);

    // Weighted Turned Polished Brass & Glazed White Porcelain Acorn Pull (clickable KNX switch target!)
    const baseData: InteractiveUserData = {
      isKNXSwitch: true,
      switchPa: '1.2.11',
      switchGang: 1,
      zoneSceneSwitchZoneId: 'familyBathroom',
      switchLocation: 'Family bathroom — ceiling pull cord by doorway · G1 Bathroom',
      circuitId: 'familyBathroomPendant',
    };

    const brassCapGeo = new THREE.CylinderGeometry(0.006, 0.015, 0.022, 20);
    brassCapGeo.computeBoundingSphere();
    const brassCap = new THREE.Mesh(brassCapGeo, brBrass.primary);
    brassCap.name = 'familyBathroom.pullCordSwitch.g1.upperCap';
    brassCap.position.set(0, acornCenterY + 0.033, 0);
    Object.assign(brassCap.userData, { ...baseData, switchDirection: 'up' });
    eastWingCtx.interactiveMeshes.push(brassCap);
    pullGroup.add(brassCap);

    const porcelainBodyGeo = new THREE.CylinderGeometry(0.0155, 0.0125, 0.042, 22);
    porcelainBodyGeo.computeBoundingSphere();
    const porcelainBody = new THREE.Mesh(porcelainBodyGeo, chinaMat);
    porcelainBody.name = 'familyBathroom.pullCordSwitch.g1.porcelainGrip';
    porcelainBody.position.set(0, acornCenterY + 0.001, 0);
    porcelainBody.castShadow = true;
    Object.assign(porcelainBody.userData, { ...baseData, switchDirection: 'up' });
    eastWingCtx.interactiveMeshes.push(porcelainBody);
    pullGroup.add(porcelainBody);

    const brassFinialGeo = new THREE.SphereGeometry(0.0125, 18, 14);
    brassFinialGeo.computeBoundingSphere();
    const brassFinial = new THREE.Mesh(brassFinialGeo, brBrass.primary);
    brassFinial.name = 'familyBathroom.pullCordSwitch.g1.lowerFinial';
    brassFinial.scale.set(1, 1.15, 1);
    brassFinial.position.set(0, acornCenterY - 0.024, 0);
    Object.assign(brassFinial.userData, { ...baseData, switchDirection: 'down' });
    eastWingCtx.interactiveMeshes.push(brassFinial);
    pullGroup.add(brassFinial);

    ewScene.add(pullGroup);
  }

  // 3. Main Staircase Landing (Circuit: upperLandingPendant, Switch PA: 1.2.12)
  buildRoomCeilingPendant(eastWingCtx, {
    circuitId: 'upperLandingPendant',
    x: -14.85,
    z: 0.65,
    ceilingY: ewCollarCeilingY,
    dropLength: 0.42,
    floorY: floorTopY,
    pointLightIntensity: 13.0,
    pointLightDistance: 7.2,
    addPointLight: false,
    parentGroup: ewScene,
  });
  buildRoomCorstonToggleSwitch(eastWingCtx, {
    circuitId: 'upperLandingPendant',
    switchPa: '1.2.12',
    location: 'First Floor Landing — East Wall (by Passage)',
    x: -13.05,
    y: floorTopY + 1.15,
    z: 0.92,
    facing: 'west',
    parentGroup: ewScene,
  });

  // Issues #5, #6 & #7: Three Aged-Brass & Parchment-Shade Wall Lights on the Upper Landing (`upperLandingPendant`):
  // - Issue #5 (`upperLanding.eastWallLight`): East Cross-Wall North of the sculpted chimney breast (`x_ew = -13.05m, y = 3.456m, z_ew = -1.866m`, facing West `-X_ew`, world `[-12.5, 3.456, -1.244]`)
  // - Issue #6 (`upperLanding.southEastWallLight`): South Wall East Pier (`x_ew = -13.878m, y = 3.456m, z_ew = 2.22m`, facing North `-Z_ew`, world `[-13.862, 3.456, 2.696]`)
  // - Issue #7 (`upperLanding.southWestWallLight`): South Wall West Pier (`x_ew = -16.77m, y = 3.456m, z_ew = 2.22m`, facing North `-Z_ew`, world `[-16.729, 3.456, 2.313]`)
  {
    const landingSconceBrassMat = new THREE.MeshStandardMaterial({
      color: 0x765535,
      roughness: 0.3,
      metalness: 0.76,
    });
    const landingSconceTrimMat = new THREE.MeshStandardMaterial({
      color: 0xd8ccb8,
      roughness: 0.65,
    });
    const landingSconceShadeMat = new THREE.MeshStandardMaterial({
      color: 0xf7ecd5,
      emissive: 0xffb85c,
      emissiveIntensity: 2.1,
      roughness: 0.58,
      side: THREE.DoubleSide,
    });
    const landingSconceBulbMat = new THREE.MeshStandardMaterial({
      color: 0xfff6e0,
      emissive: 0xffb85c,
      emissiveIntensity: 2.8,
      roughness: 0.15,
    });
    lightGroups.upperLandingSconces.emissives.push(landingSconceShadeMat, landingSconceBulbMat);

    const buildUpperLandingWallSconce = (cfg: {
      readonly name: string;
      readonly x: number;
      readonly y: number;
      readonly z: number;
      readonly facingZ?: 1 | -1;
      readonly facingX?: 1 | -1;
      readonly cutawayWall?: CutawayWallDescriptor;
    }): void => {
      const dirZ = cfg.facingX ? 1 : (cfg.facingZ ?? -1);
      const sconceGroup = new THREE.Group();
      sconceGroup.name = cfg.name;
      sconceGroup.userData.zone = 'upperLanding';
      sconceGroup.position.set(cfg.x, cfg.y, cfg.z);
      if (cfg.facingX) {
        sconceGroup.rotation.y = cfg.facingX * (Math.PI / 2);
      }

      const armY = 0.08;
      const dropZ = dirZ * 0.145;

      const backplate = new THREE.Mesh(
        new THREE.CylinderGeometry(0.052, 0.056, 0.014, 20),
        landingSconceBrassMat
      );
      backplate.name = `${cfg.name}.backplate`;
      backplate.rotation.x = Math.PI / 2;
      backplate.position.set(0, armY, dirZ * 0.007);
      backplate.castShadow = true;
      sconceGroup.add(backplate);

      const roseBoss = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.032, 0.018, 16),
        landingSconceBrassMat
      );
      if (!roseBoss.name) roseBoss.name = 'firstFloor.fixture.roseBoss';
      roseBoss.rotation.x = Math.PI / 2;
      roseBoss.position.set(0, armY, dirZ * 0.02);
      sconceGroup.add(roseBoss);

      const armHoriz = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0075, 0.0075, Math.abs(dropZ) - 0.015, 12),
        landingSconceBrassMat
      );
      armHoriz.name = `${cfg.name}.arm`;
      armHoriz.rotation.x = Math.PI / 2;
      armHoriz.position.set(0, armY, (dropZ + dirZ * 0.015) * 0.5);
      armHoriz.castShadow = true;
      sconceGroup.add(armHoriz);

      const knuckleJoint = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 12, 10),
        landingSconceBrassMat
      );
      if (!knuckleJoint.name) knuckleJoint.name = 'firstFloor.fixture.knuckleJoint';
      knuckleJoint.position.set(0, armY, dropZ);
      sconceGroup.add(knuckleJoint);

      const upperCollar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.018, 0.026, 14),
        landingSconceBrassMat
      );
      if (!upperCollar.name) upperCollar.name = 'firstFloor.fixture.upperCollar';
      upperCollar.position.set(0, armY - 0.02, dropZ);
      sconceGroup.add(upperCollar);

      const lampHolderCup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.024, 0.024, 0.032, 16),
        landingSconceBrassMat
      );
      lampHolderCup.name = `${cfg.name}.lampHolder`;
      lampHolderCup.position.set(0, armY - 0.046, dropZ);
      lampHolderCup.castShadow = true;
      sconceGroup.add(lampHolderCup);

      const shadeH = 0.165;
      const shadeTopR = 0.056;
      const shadeBotR = 0.076;
      const shadeCenterY = armY - 0.062 - shadeH * 0.5;

      const sconceShade = new THREE.Mesh(
        new THREE.CylinderGeometry(shadeTopR, shadeBotR, shadeH, 24, 1, true),
        landingSconceShadeMat
      );
      sconceShade.name = `${cfg.name}.shade`;
      sconceShade.position.set(0, shadeCenterY, dropZ);
      sconceShade.castShadow = true;
      sconceGroup.add(sconceShade);

      const topBindingRing = new THREE.Mesh(
        new THREE.TorusGeometry(shadeTopR, 0.003, 8, 24),
        landingSconceTrimMat
      );
      if (!topBindingRing.name) topBindingRing.name = 'firstFloor.fixture.topBindingRing';
      topBindingRing.rotation.x = Math.PI / 2;
      topBindingRing.position.set(0, shadeCenterY + shadeH * 0.5, dropZ);
      sconceGroup.add(topBindingRing);

      const botBindingRing = new THREE.Mesh(
        new THREE.TorusGeometry(shadeBotR, 0.003, 8, 24),
        landingSconceTrimMat
      );
      if (!botBindingRing.name) botBindingRing.name = 'firstFloor.fixture.botBindingRing';
      botBindingRing.rotation.x = Math.PI / 2;
      botBindingRing.position.set(0, shadeCenterY - shadeH * 0.5, dropZ);
      sconceGroup.add(botBindingRing);

      const sconceBulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.024, 12, 12),
        landingSconceBulbMat
      );
      sconceBulb.name = `${cfg.name}.bulb`;
      sconceBulb.position.set(0, shadeCenterY + 0.015, dropZ);
      sconceGroup.add(sconceBulb);

      if (cfg.cutawayWall) {
        tagUpperCutawayWall(sconceGroup, cfg.cutawayWall);
      }

      ewScene.add(sconceGroup);
      interactions.registerLightFixture(sconceGroup, 'upperLandingSconces');
    };

    buildUpperLandingWallSconce({
      name: 'upperLanding.eastWallLight',
      x: -13.05,
      y: 3.456,
      z: -1.866,
      facingX: -1,
    });
    buildUpperLandingWallSconce({
      name: 'upperLanding.southEastWallLight',
      x: -13.878,
      y: 3.456,
      z: 2.22,
      facingZ: -1,
      cutawayWall: {
        axis: 'z',
        coord: 2.45,
        minSpan: -14.77,
        maxSpan: -12.93,
        floor: 'first',
      },
    });
    buildUpperLandingWallSconce({
      name: 'upperLanding.southWestWallLight',
      x: -16.77,
      y: 3.456,
      z: 2.22,
      facingZ: -1,
      cutawayWall: {
        axis: 'z',
        coord: 2.45,
        minSpan: -17.8,
        maxSpan: -15.93,
        floor: 'first',
      },
    });
  }

  // 4. Bedroom 2 (Circuit: bedroom2Pendant, Switch PA: 1.2.13)
  buildRoomCeilingPendant(ctx, {
    circuitId: 'bedroom2Pendant',
    x: -19.85,
    z: 0.05,
    ceilingY: 4.73,
    dropLength: 0.44,
    floorY: bed2FloorTopY,
    pointLightIntensity: 13.5,
    pointLightDistance: 7.2,
    addPointLight: false,
    parentGroup: scene,
  });
  buildRoomCorstonToggleSwitch(ctx, {
    circuitId: 'bedroom2Pendant',
    switchPa: '1.2.13',
    location: 'Bedroom 2 — East Wall (by Door)',
    x: -19.0,
    y: bed2FloorTopY + 1.15,
    z: 1.12,
    facing: 'west',
    parentGroup: scene,
  });

  // 5. Bedroom 3 (Circuit: bedroom3Pendant, Switch PA: 1.2.14)
  buildRoomCeilingPendant(ctx, {
    circuitId: 'bedroom3Pendant',
    x: -20.05,
    z: 6.38,
    ceilingY: 5.05,
    dropLength: 0.56,
    floorY: bed3FloorTopY,
    pointLightIntensity: 13.0,
    pointLightDistance: 7.0,
    addPointLight: false,
    parentGroup: scene,
  });
  buildRoomCorstonToggleSwitch(ctx, {
    circuitId: 'bedroom3Pendant',
    switchPa: '1.2.14',
    location: 'Bedroom 3 — East Wall (by Door)',
    x: -18.29,
    y: bed3FloorTopY + 1.15,
    z: 6.72,
    facing: 'west',
    parentGroup: scene,
  });

  // 6. Bedroom 4 (Circuit: bedroom4Pendant, Switch PA: 1.2.15)
  buildRoomCeilingPendant(ctx, {
    circuitId: 'bedroom4Pendant',
    x: -19.85,
    z: 9.94,
    ceilingY: 5.05,
    dropLength: 0.56,
    floorY: bed4FloorTopY,
    pointLightIntensity: 13.0,
    pointLightDistance: 7.0,
    addPointLight: false,
    parentGroup: scene,
  });
  buildRoomCorstonToggleSwitch(ctx, {
    circuitId: 'bedroom4Pendant',
    switchPa: '1.2.15',
    location: 'Bedroom 4 — North Wall (by Door)',
    x: -18.32,
    y: bed4FloorTopY + 1.15,
    z: 8.39,
    facing: 'south',
    parentGroup: scene,
  });
}
