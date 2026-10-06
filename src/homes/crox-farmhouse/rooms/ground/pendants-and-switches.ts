import * as THREE from 'three';
import { createScopedBuilderContext } from '../../../../engine/scene/scene-content.ts';
import { buildGroundFloorCorstonSockets } from '../../../../objects/fixtures/corston-power-sockets.ts';
import { buildRoomKnxTempSensor } from '../../../../objects/fixtures/knx-temp-sensor.ts';
import { buildRecessedFloorUplights } from './floor-uplights.ts';
import { buildRoomCeilingPendant, buildRoomCorstonToggleSwitch } from './kitchen-knx-lighting.ts';
import { buildRoomCeilingPirSensor } from './room-motion-sensors.ts';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import {
  MAIN_EAST_WING_OFFSET,
  MAIN_EAST_WING_ROTATION_Y,
  type createGroundFloorMaterials,
} from '../../structure/ground-floor-materials.ts';
import type { createGroundFloorShellKit } from '../../structure/ground-floor-shell-kit.ts';
import type { defineTier2Levels } from '../../structure/tier2-levels.ts';
import type { buildDiningRoom } from './dining-room.ts';

/**
 * KNX ceiling pendants and Corston toggle switches for every ground-floor room.
 */
export function buildGroundFloorPendantsAndSwitches(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createGroundFloorMaterials>, 'frontWallH' | 'tagCutawayWall' | 'wallH'> &
    Pick<ReturnType<typeof createGroundFloorShellKit>, 'getEastCourtyardWallCenterX'> &
    Pick<ReturnType<typeof buildDiningRoom>, 'lowerFloorY'> &
    Pick<ReturnType<typeof defineTier2Levels>, 'tier2FloorY'>
): void {
  const { groundFloorCeilingGroup, interactions, lightGroups, scene } = ctx;
  const eastWingCtx = createScopedBuilderContext(ctx, {
    name: 'groundPendantsAndSwitches.eastWing',
    offset: MAIN_EAST_WING_OFFSET,
    rotationY: MAIN_EAST_WING_ROTATION_Y,
  });
  const {
    frontWallH,
    getEastCourtyardWallCenterX,
    lowerFloorY,
    tagCutawayWall,
    tier2FloorY,
    wallH,
  } = kit;
  // =========================================================================
  // 9. KNX CEILING PENDANTS & CORSTON TOGGLE SWITCHES FOR ALL GROUND FLOOR ROOMS
  // =========================================================================
  // 1. Dining Room (Circuits: familyRoomSpots, diningPendant, diningPictureLight, diningFairyLights)
  const diningTablePendant = buildRoomCeilingPendant(eastWingCtx, {
    circuitId: 'diningPendant',
    x: -6.55,
    z: -0.607,
    ceilingY: wallH - 0.03,
    dropLength: 0.38,
    floorY: 0,
    style: 'linenDrum',
    pointLightIntensity: 11.5,
    pointLightDistance: 6.5,
  });
  diningTablePendant.name = 'familyRoom.diningTablePendant';
  diningTablePendant.userData.zone = 'familyRoom';

  buildRoomCorstonToggleSwitch(eastWingCtx, {
    circuitId: 'familyRoomSpots',
    switchPa: '1.1.15',
    location: 'Dining Room — East Wall (by Kitchen Portal)',
    x: -4.64,
    y: 1.18,
    z: -0.58,
    facing: 'west',
  });
  // Issue #7: Dining Room West Wall lightswitch by the Boot Lobby step-down door
  buildRoomCorstonToggleSwitch(eastWingCtx, {
    circuitId: 'familyRoomSpots',
    switchPa: '1.1.15',
    location: 'Dining Room — West Wall (by Boot Lobby Door)',
    x: -9.56,
    y: 1.19,
    z: 1.069,
    facing: 'east',
  });
  // Issue #1: Dining Room KNX Bus NTC Temperature Probe in the West Wall Switch Backbox ([-9.56, 1.239, 1.047])
  buildRoomKnxTempSensor(eastWingCtx, {
    name: 'familyRoom.knxTempSensor',
    zone: 'familyRoom',
    ufhZoneId: 'ufhZone4',
    sensorPa: '1.1.15',
    sensorGa: '4/1/4',
    location: 'Dining Room — West Wall Switch Backbox (by Boot Lobby Door)',
    roomLabel: 'Dining Rm',
    defaultTempC: 20.5,
    x: -9.56,
    y: 1.19,
    z: 1.069,
    facing: 'east',
  });

  // 2. Middle Boot Lobby (Circuit: bootLobbyPendant, Switch PA: 1.1.16)
  //    Issue #11: Ceiling pendant at [-11.3, 1.625, 0.92] removed!
  //    Issue #12: Replaced by Aged-Brass Wall Light on the South Exterior Brick Wall at [-10.363, 1.204, 2.4] (normal [0, 0, -1])
  {
    const southSconceBrassMat = new THREE.MeshStandardMaterial({
      color: 0x765535,
      roughness: 0.3,
      metalness: 0.76,
    });
    const southSconceTrimMat = new THREE.MeshStandardMaterial({
      color: 0xd8ccb8,
      roughness: 0.65,
    });

    const buildNorthFacingWallSconce = (cfg: {
      readonly name: string;
      readonly zone: string;
      readonly circuitId: 'bootLobbyPendant' | 'hallPendant';
      readonly x: number;
      readonly y: number;
      readonly z: number;
      readonly facingZ?: 1 | -1;
      /** When set, the sconce is mounted on an X-facing wall and projects along ±X instead of ±Z. */
      readonly facingX?: 1 | -1;
      readonly spawnPointLight?: boolean;
      readonly lightIntensity: number;
      readonly lightDistance: number;
      readonly cutawayCoord?: number;
      readonly cutawayMinX?: number;
      readonly cutawayMaxX?: number;
    }): void => {
      // X-facing sconces are built projecting along local +Z and then yawed onto the wall.
      const dirZ = cfg.facingX ? 1 : (cfg.facingZ ?? -1);
      const worldDirX = cfg.facingX ?? 0;
      const worldDirZ = cfg.facingX ? 0 : dirZ;
      const shadeMat = new THREE.MeshStandardMaterial({
        color: 0xf7ecd5,
        emissive: 0xffb85c,
        emissiveIntensity: 2.1,
        roughness: 0.58,
        side: THREE.DoubleSide,
      });
      const bulbMat = new THREE.MeshStandardMaterial({
        color: 0xfff6e0,
        emissive: 0xffb85c,
        emissiveIntensity: 2.8,
        roughness: 0.15,
      });
      lightGroups[cfg.circuitId].emissives.push(shadeMat, bulbMat);

      const sconceGroup = new THREE.Group();
      sconceGroup.name = cfg.name;
      sconceGroup.userData.zone = cfg.zone;
      sconceGroup.position.set(cfg.x, cfg.y, cfg.z);
      if (cfg.facingX) {
        sconceGroup.rotation.y = cfg.facingX * (Math.PI / 2);
      }

      const armY = 0.08;
      const dropZ = dirZ * 0.145; // Projects into room (+Z from North wall or -Z from South wall)

      const backplate = new THREE.Mesh(
        new THREE.CylinderGeometry(0.052, 0.056, 0.014, 20),
        southSconceBrassMat
      );
      backplate.name = `${cfg.name}.backplate`;
      backplate.rotation.x = Math.PI / 2;
      backplate.position.set(0, armY, dirZ * 0.007);
      backplate.castShadow = true;
      sconceGroup.add(backplate);

      const roseBoss = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.032, 0.018, 16),
        southSconceBrassMat
      );
      if (!roseBoss.name) roseBoss.name = 'groundFloor.fixture.roseBoss';
      roseBoss.rotation.x = Math.PI / 2;
      roseBoss.position.set(0, armY, dirZ * 0.02);
      sconceGroup.add(roseBoss);

      const armHoriz = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0075, 0.0075, Math.abs(dropZ) - 0.015, 12),
        southSconceBrassMat
      );
      armHoriz.name = `${cfg.name}.arm`;
      armHoriz.rotation.x = Math.PI / 2;
      armHoriz.position.set(0, armY, (dropZ + dirZ * 0.015) * 0.5);
      armHoriz.castShadow = true;
      sconceGroup.add(armHoriz);

      const knuckleJoint = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 12, 10),
        southSconceBrassMat
      );
      if (!knuckleJoint.name) knuckleJoint.name = 'groundFloor.fixture.knuckleJoint';
      knuckleJoint.position.set(0, armY, dropZ);
      sconceGroup.add(knuckleJoint);

      const upperCollar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.018, 0.026, 14),
        southSconceBrassMat
      );
      if (!upperCollar.name) upperCollar.name = 'groundFloor.fixture.upperCollar';
      upperCollar.position.set(0, armY - 0.02, dropZ);
      sconceGroup.add(upperCollar);

      const lampHolderCup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.024, 0.024, 0.032, 16),
        southSconceBrassMat
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
        shadeMat
      );
      sconceShade.name = `${cfg.name}.shade`;
      sconceShade.position.set(0, shadeCenterY, dropZ);
      sconceShade.castShadow = true;
      sconceGroup.add(sconceShade);

      const topBindingRing = new THREE.Mesh(
        new THREE.TorusGeometry(shadeTopR, 0.003, 8, 24),
        southSconceTrimMat
      );
      if (!topBindingRing.name) topBindingRing.name = 'groundFloor.fixture.topBindingRing';
      topBindingRing.rotation.x = Math.PI / 2;
      topBindingRing.position.set(0, shadeCenterY + shadeH * 0.5, dropZ);
      sconceGroup.add(topBindingRing);

      const botBindingRing = new THREE.Mesh(
        new THREE.TorusGeometry(shadeBotR, 0.003, 8, 24),
        southSconceTrimMat
      );
      if (!botBindingRing.name) botBindingRing.name = 'groundFloor.fixture.botBindingRing';
      botBindingRing.rotation.x = Math.PI / 2;
      botBindingRing.position.set(0, shadeCenterY - shadeH * 0.5, dropZ);
      sconceGroup.add(botBindingRing);

      const sconceBulb = new THREE.Mesh(
        new THREE.SphereGeometry(0.024, 12, 12),
        bulbMat
      );
      sconceBulb.name = `${cfg.name}.bulb`;
      sconceBulb.position.set(0, shadeCenterY + 0.015, dropZ);
      sconceGroup.add(sconceBulb);

      if (cfg.spawnPointLight) {
        const sconceLight = new THREE.PointLight(
          0xffcf94,
          cfg.lightIntensity,
          cfg.lightDistance,
          1.8
        );
        sconceLight.userData.baseIntensity = cfg.lightIntensity;
        sconceLight.position.set(cfg.x + worldDirX * 0.35, cfg.y - 0.04, cfg.z + worldDirZ * 0.35);
        eastWingCtx.scene.add(sconceLight);
        lightGroups[cfg.circuitId].lights.push(sconceLight);
      }

      if (cfg.cutawayMinX !== undefined && cfg.cutawayMaxX !== undefined) {
        tagCutawayWall(sconceGroup, {
          axis: 'z',
          coord: cfg.cutawayCoord ?? 2.54,
          minSpan: cfg.cutawayMinX,
          maxSpan: cfg.cutawayMaxX,
          floor: 'ground',
        });
      }

      eastWingCtx.scene.add(sconceGroup);
      interactions.registerLightFixture(sconceGroup, cfg.circuitId);
      eastWingCtx.addGlowPool(
        cfg.circuitId,
        cfg.x + worldDirX * 0.55,
        lowerFloorY + 0.006,
        cfg.z + worldDirZ * 0.55,
        1.65,
        0.22
      );
    };

    // Issue #2 & Issue #3: Boot Lobby South Wall Light removed; East cross-wall light centered on the wall
    // between the North partition wall (Z = -0.10m) and the Dining Room portal architrave (Z = +1.28m)
    // at local (x = -9.8, y = 1.242, z = 0.594) -> world [-9.605, 1.242, 1.625], facing West into the Boot Lobby!
    buildNorthFacingWallSconce({
      name: 'bootLobby.northWallLight',
      zone: 'bootLobby',
      circuitId: 'bootLobbyPendant',
      x: -9.8,
      y: 1.242,
      z: 0.594,
      facingX: -1,
      spawnPointLight: true,
      lightIntensity: 7.5,
      lightDistance: 4.2,
    });

    // Issue #13: Entrance Hall South Wall Light at [-15.941, 0.962, 2.4] (mounted at sconce height Y = 1.12m so shade sits at Y ≈ 0.962m!)
    buildNorthFacingWallSconce({
      name: 'hall.southWallLight',
      zone: 'hall',
      circuitId: 'hallPendant',
      x: -15.941,
      y: 1.12,
      z: 2.4,
      facingZ: -1,
      spawnPointLight: true,
      lightIntensity: 9.5,
      lightDistance: 6.4,
      cutawayCoord: 2.54,
      cutawayMinX: -16.973,
      cutawayMaxX: -12.81,
    });

    // Issue #4: Entrance Hall North Wall Light at [-14.965, 1.06, -2.213]
    // (local x = -15.622, y = 1.06, z = -2.5, facing South +Z into the Hall between the stairs and North window)
    buildNorthFacingWallSconce({
      name: 'hall.northWallLight',
      zone: 'hall',
      circuitId: 'hallPendant',
      x: -15.622,
      y: 1.06,
      z: -2.5,
      facingZ: 1,
      spawnPointLight: false,
      lightIntensity: 6.5,
      lightDistance: 4.6,
      cutawayCoord: -2.64,
      cutawayMinX: -17.55,
      cutawayMaxX: -15.16,
    });

    // Matching Staircase Hall East Wall Light on the Hall / Boot Lobby partition (wall face X = -13.05m),
    // projecting West into the hall, clear of the Corston switch at Z = 0.95m.
    buildNorthFacingWallSconce({
      name: 'hall.eastWallLight',
      zone: 'hall',
      circuitId: 'hallPendant',
      x: -13.05,
      y: 1.12,
      z: 0.74,
      facingX: -1,
      spawnPointLight: false,
      lightIntensity: 6.5,
      lightDistance: 4.6,
    });
  }

  buildRoomCorstonToggleSwitch(eastWingCtx, {
    circuitId: 'bootLobbyPendant',
    switchPa: '1.1.16',
    location: 'Boot Lobby — East Wall (by Step-Down Portal)',
    x: -9.8,
    y: lowerFloorY + 1.18,
    z: 1.05,
    facing: 'west',
  });

  // 3. Staircase Hall (Circuit: hallPendant, Switch PA: 1.1.17)
  //    No ceiling pendant: lit by the South & East wall lights, stair tread lights and the fireplace beam LED strip.
  buildRoomCorstonToggleSwitch(eastWingCtx, {
    circuitId: 'hallPendant',
    switchPa: '1.1.17',
    location: 'Entrance Hall — East Wall (by Boot Lobby Door)',
    x: -13.05,
    y: lowerFloorY + 1.18,
    z: 0.95,
    facing: 'west',
  });
  // Issue #2: Staircase Hall / Boot Lobby KNX Bus NTC Temperature Probe in the East Wall Switch Backbox ([-13.055, 0.881, 0.992])
  buildRoomKnxTempSensor(eastWingCtx, {
    name: 'hall.knxTempSensor',
    zone: 'hall',
    ufhZoneId: 'ufhZone3',
    sensorPa: '1.1.17',
    sensorGa: '4/1/3',
    location: 'Staircase Hall — East Wall Switch Backbox (by Boot Lobby Door)',
    roomLabel: 'Main Hall',
    defaultTempC: 19.5,
    x: -13.05,
    y: lowerFloorY + 1.18,
    z: 0.95,
    facing: 'west',
  });

  // 4. Front / Living Room (Circuit: frontRoomPendant, Switch PA: 1.1.18)
  //    Lightswitch + KNX temp sensor probe on the angled East Cross-Wall by the Hallway Door
  {
    const livingEastWallRotY = Math.atan2(-4.9, -0.35);
    const livingEastWallCutaway = {
      axis: 'x' as const,
      coord: -17.7,
      minSpan: -2.78,
      maxSpan: 2.68,
      floor: 'ground' as const,
    };
    const livingSwitch = buildRoomCorstonToggleSwitch(eastWingCtx, {
      circuitId: 'frontRoomPendant',
      switchPa: '1.1.18',
      location: 'Living Room — East Wall (by Hallway Door)',
      x: -17.993,
      y: 0.878,
      z: 2.02,
      rotY: livingEastWallRotY,
      cutawayWall: livingEastWallCutaway,
    });
    tagCutawayWall(livingSwitch, livingEastWallCutaway);

    const livingTempSensor = buildRoomKnxTempSensor(eastWingCtx, {
      name: 'livingRoom.knxTempSensor',
      zone: 'livingRoom',
      ufhZoneId: 'ufhZone2',
      sensorPa: '1.1.18',
      sensorGa: '4/1/2',
      location: 'Living Room — East Wall Switch Backbox (by Hallway Door)',
      roomLabel: 'Living Rm',
      defaultTempC: 16.0,
      x: -17.993,
      y: 0.878,
      z: 2.02,
      rotY: livingEastWallRotY,
      cutawayWall: livingEastWallCutaway,
    });
    tagCutawayWall(livingTempSensor, livingEastWallCutaway);
  }

  // 5. Front Entrance Hallway (Circuit: entranceHallPendant, Switch PA: 1.1.19)
  buildRoomCeilingPendant(ctx, {
    circuitId: 'entranceHallPendant',
    x: -19.8,
    z: 2.98,
    ceilingY: frontWallH - 0.03,
    dropLength: 0.3,
    floorY: tier2FloorY,
    style: 'glassLantern',
    pointLightIntensity: 11.5,
    pointLightDistance: 6.5,
  });
  buildRoomCorstonToggleSwitch(ctx, {
    circuitId: 'entranceHallPendant',
    switchPa: '1.1.19',
    location: 'Front Entrance Hallway — South Wall (by Front Door)',
    x: -21.55,
    y: tier2FloorY + 1.18,
    z: 3.55,
    facing: 'north',
  });

  // Front Entrance Hallway inground floor uplights (Circuit: entranceHallUplights), each washing up one of
  // the gallery pictures with identical 0.12m perpendicular spacing from the interior plaster wall face
  // (0.098m from the oak skirting board, eliminating clipping on the angled North wall — Issue #4):
  // - North wall ([-22.19, 1.905] -> [-17.891, 2.48], 0.28m thick, South face at n = 0.14m):
  //   u = 1.15 and u = 2.45 at n = 0.14 + 0.12 = 0.26m -> [-21.084, 2.315] and [-19.796, 2.488]
  // - South wall (Z = 3.625m, 0.15m thick, North face at Z = 3.550m):
  //   X = -21.25, -20.10, -18.95 at Z = 3.550 - 0.12 = 3.43m
  buildRecessedFloorUplights(ctx, {
    name: 'entranceHall.floorUplight.north',
    zone: 'entranceHall',
    circuitId: 'entranceHallUplights',
    floorY: tier2FloorY,
    positions: [
      [-21.084, 2.315],
      [-19.796, 2.488],
    ],
    // Halos only: the South run's grazing light (below) spills across the hallway.
    wallWash: {
      wallZ: 2.28,
      wallZAtX: (x: number) => 2.0462 + (0.575 / 4.299) * (x + 22.19),
      haloHeight: 0.95,
    },
  });
  buildRecessedFloorUplights(ctx, {
    name: 'entranceHall.floorUplight.south',
    zone: 'entranceHall',
    circuitId: 'entranceHallUplights',
    floorY: tier2FloorY,
    positions: [
      [-21.25, 3.43],
      [-20.1, 3.43],
      [-18.95, 3.43],
    ],
    wallWash: { wallZ: 3.55, haloHeight: 0.95 },
  });

  // Flush ceiling PIR presence sensors for the motion-controlled rooms (click to simulate occupancy)
  buildRoomCeilingPirSensor(eastWingCtx, {
    name: 'bootLobby.wineCellar.knxMotionSensor',
    zone: 'bootLobby',
    sensorId: 'wineCellar',
    knxPa: '1.1.25',
    indicatorCircuitId: 'wineCellarLeds',
    x: -10.45,
    ceilingY: wallH - 0.016,
    z: -1.25,
  });
  buildRoomCeilingPirSensor(eastWingCtx, {
    name: 'bootLobby.downstairsWc.knxMotionSensor',
    zone: 'bootLobby',
    sensorId: 'cloakroomWc',
    knxPa: '1.1.26',
    indicatorCircuitId: 'cloakroomWcLights',
    x: -12.14,
    ceilingY: wallH - 0.016,
    z: -1.35,
  });

  // 6. Sitting / Living Room (Circuit: livingRoomPendant, Switch PA: 1.1.21)
  //    NO central ceiling light (Issue #6); illuminated by 2 Downward-Hanging Aged-Brass Wall Sconces
  //    on the North Wall (Z = +3.70m at X = -19.135m and X = -21.281m — Issue #12, matching media_1790547890733.png):
  //    - Stepped circular antique-brass wall rose + central boss dome
  //    - Straight horizontal tubular brass arm projecting +Z from wall rose
  //    - 90° downward brass knuckle joint + stepped collared brass lamp holder
  //    - Tall tapered warm parchment/cream drum shade hanging BELOW the horizontal arm!
  const sconceBrassMat = new THREE.MeshStandardMaterial({
    color: 0x765535, // Aged antique bronze-brass finish matching media_1790547890733.png
    roughness: 0.3,
    metalness: 0.76,
  });
  const sconceShadeMat = new THREE.MeshStandardMaterial({
    color: 0xf7ecd5,
    emissive: 0xffb85c,
    emissiveIntensity: 2.1,
    roughness: 0.58,
    side: THREE.DoubleSide,
  });
  const sconceShadeTrimMat = new THREE.MeshStandardMaterial({
    color: 0xd8ccb8,
    roughness: 0.65,
  });
  const sconceBulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff6e0,
    emissive: 0xffb85c,
    emissiveIntensity: 2.8,
    roughness: 0.15,
  });
  lightGroups.livingRoomPendant.emissives.push(sconceShadeMat, sconceBulbMat);

  for (const [sconceIdx, sconceX] of [
    [1, -19.135],
    [2, -21.281],
  ] as const) {
    const sconceGroup = new THREE.Group();
    sconceGroup.name = `sittingRoom.wallLight.${sconceIdx}`;
    sconceGroup.userData.zone = 'sittingRoom';
    sconceGroup.position.set(sconceX, 1.04, 3.7);

    const armY = 0.14;   // Wall rose & horizontal brass arm height above sconce origin
    const dropZ = 0.145; // Z projection of downward lamp holder & hanging shade

    // 1. Stepped circular antique-brass wall rose + domed central boss on the South (+Z) face of the Z = 3.70m wall
    const backplate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.052, 0.056, 0.014, 20),
      sconceBrassMat
    );
    backplate.name = `sittingRoom.wallLight.${sconceIdx}.backplate`;
    backplate.rotation.x = Math.PI / 2;
    backplate.position.set(0, armY, 0.007);
    backplate.castShadow = true;
    sconceGroup.add(backplate);

    const roseBoss = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.032, 0.018, 16),
      sconceBrassMat
    );
    if (!roseBoss.name) roseBoss.name = 'groundFloor.fixture.roseBoss';
    roseBoss.rotation.x = Math.PI / 2;
    roseBoss.position.set(0, armY, 0.02);
    sconceGroup.add(roseBoss);

    // 2. Straight horizontal tubular antique-brass arm projecting +Z from the wall rose
    const armHoriz = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0075, 0.0075, dropZ - 0.015, 12),
      sconceBrassMat
    );
    armHoriz.name = `sittingRoom.wallLight.${sconceIdx}.arm`;
    armHoriz.rotation.x = Math.PI / 2;
    armHoriz.position.set(0, armY, (dropZ + 0.015) * 0.5);
    armHoriz.castShadow = true;
    sconceGroup.add(armHoriz);

    // 3. 90° downward brass knuckle joint + stepped collared lamp holder at z = dropZ
    const knuckleJoint = new THREE.Mesh(
      new THREE.SphereGeometry(0.012, 12, 10),
      sconceBrassMat
    );
    if (!knuckleJoint.name) knuckleJoint.name = 'groundFloor.fixture.knuckleJoint';
    knuckleJoint.position.set(0, armY, dropZ);
    sconceGroup.add(knuckleJoint);

    const upperCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.018, 0.026, 14),
      sconceBrassMat
    );
    if (!upperCollar.name) upperCollar.name = 'groundFloor.fixture.upperCollar';
    upperCollar.position.set(0, armY - 0.02, dropZ);
    sconceGroup.add(upperCollar);

    const lampHolderCup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.024, 0.032, 16),
      sconceBrassMat
    );
    lampHolderCup.name = `sittingRoom.wallLight.${sconceIdx}.lampHolder`;
    lampHolderCup.position.set(0, armY - 0.046, dropZ);
    lampHolderCup.castShadow = true;
    sconceGroup.add(lampHolderCup);

    // 4. Downward-Hanging Tapered Warm Parchment/Cream Drum Shade below the brass lamp holder (media_1790547890733.png)
    const shadeH = 0.165;
    const shadeTopR = 0.056;
    const shadeBotR = 0.076;
    const shadeCenterY = armY - 0.062 - shadeH * 0.5;

    const sconceShade = new THREE.Mesh(
      new THREE.CylinderGeometry(shadeTopR, shadeBotR, shadeH, 24, 1, true),
      sconceShadeMat
    );
    sconceShade.name = `sittingRoom.wallLight.${sconceIdx}.shade`;
    sconceShade.position.set(0, shadeCenterY, dropZ);
    sconceShade.castShadow = true;
    sconceGroup.add(sconceShade);

    // Subtle rolled top & bottom binding rings on the shade
    const topBindingRing = new THREE.Mesh(
      new THREE.TorusGeometry(shadeTopR, 0.003, 8, 24),
      sconceShadeTrimMat
    );
    if (!topBindingRing.name) topBindingRing.name = 'groundFloor.fixture.topBindingRing';
    topBindingRing.rotation.x = Math.PI / 2;
    topBindingRing.position.set(0, shadeCenterY + shadeH * 0.5, dropZ);
    sconceGroup.add(topBindingRing);

    const botBindingRing = new THREE.Mesh(
      new THREE.TorusGeometry(shadeBotR, 0.003, 8, 24),
      sconceShadeTrimMat
    );
    if (!botBindingRing.name) botBindingRing.name = 'groundFloor.fixture.botBindingRing';
    botBindingRing.rotation.x = Math.PI / 2;
    botBindingRing.position.set(0, shadeCenterY - shadeH * 0.5, dropZ);
    sconceGroup.add(botBindingRing);

    // 5. Glowing warm filament bulb hanging inside the shade
    const sconceBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.024, 12, 12),
      sconceBulbMat
    );
    sconceBulb.name = `sittingRoom.wallLight.${sconceIdx}.bulb`;
    sconceBulb.position.set(0, shadeCenterY + 0.015, dropZ);
    sconceGroup.add(sconceBulb);

    // Single consolidated PointLight illuminating the Sitting Room & North wall
    // (parented directly to `scene` rather than `sconceGroup` so LOD2 visibility toggling never recompiles shaders!)
    if (sconceIdx === 1) {
      const sconceLight = new THREE.PointLight(0xffcf94, 11.5, 7.8, 1.7);
      sconceLight.position.set(sconceX - 1.07, 1.04, 4.25);
      scene.add(sconceLight);
      lightGroups.livingRoomPendant.lights.push(sconceLight);
    }

    scene.add(sconceGroup);
    interactions.registerLightFixture(sconceGroup, 'livingRoomPendant');
    ctx.addGlowPool('livingRoomPendant', sconceX, tier2FloorY + 0.006, 4.35, 1.85, 0.22);
  }

  // Issue #3: Sitting Room / Entrance Hall North Wall Lightswitch + KNX Bus NTC Temp Probe at [-18.721, 0.616, 3.714] (normal [0, 0, 1])
  buildRoomCorstonToggleSwitch(ctx, {
    circuitId: 'livingRoomPendant',
    switchPa: '1.1.21',
    location: 'Sitting Room — North Wall (by Hallway Door)',
    x: -18.721,
    y: 0.616,
    z: 3.714,
    facing: 'south',
  });
  buildRoomKnxTempSensor(ctx, {
    name: 'sittingRoom.knxTempSensor',
    zone: 'sittingRoom',
    ufhZoneId: 'ufhZone1',
    sensorPa: '1.1.21',
    sensorGa: '4/1/1',
    location: 'Sitting Room — North Wall Switch Backbox (by Hallway Door)',
    roomLabel: 'Sitting Rm',
    defaultTempC: 21.0,
    x: -18.721,
    y: 0.616,
    z: 3.714,
    facing: 'south',
  });

  // 7. Study & Plant Room Linear Ceiling LED Light Bars (Circuit: studyPendant, Switch PA: 1.1.23 — Issue #5)
  //    Two 1.22m architectural surface-mounted linear LED batten luminaires:
  //    - Plant Room LED Light Bar (`plantRoom.ledLightBar`) at X = -18.08m, Z = 9.94m (North–South orientation)
  //    - Study LED Light Bar (`study.ledLightBar`) at X = -20.62m, Z = 9.94m (East–West orientation)
  {
    // Issue #4: Overhead LED light bars stay visible in cutaway mode at low opacity (`0.34..0.38`)
    void groundFloorCeilingGroup;
    const ledHousingMat = new THREE.MeshStandardMaterial({
      color: 0xe8eaed, // Powder-coated white/silver extruded aluminum batten housing
      roughness: 0.32,
      metalness: 0.45,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    });
    const ledEndCapMat = new THREE.MeshStandardMaterial({
      color: 0x3a3f47, // Dark anthracite polycarbonate end caps
      roughness: 0.42,
      metalness: 0.28,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    });
    const ledDiffuserMat = new THREE.MeshStandardMaterial({
      color: 0xfcfaf2,
      emissive: 0xffe2a8,
      emissiveIntensity: 2.35,
      roughness: 0.22,
      metalness: 0.02,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    });
    lightGroups.studyPendant.emissives.push(ledDiffuserMat);

    for (const [barName, zoneName, bx, bz, rotY, hasLight] of [
      ['plantRoom.ledLightBar', 'study', -18.08, 9.94, Math.PI / 2, true],
      ['study.ledLightBar', 'study', -20.62, 9.94, 0, false],
    ] as const) {
      const barGroup = new THREE.Group();
      barGroup.name = barName;
      barGroup.userData.zone = zoneName;
      barGroup.position.set(bx, wallH - 0.03, bz);
      barGroup.rotation.y = rotY;

      const barLen = 1.22;
      const barW = 0.078;

      // Top extruded aluminum ceiling mounting Spine
      const housingChannel = new THREE.Mesh(
        new THREE.BoxGeometry(barLen, 0.022, barW),
        ledHousingMat
      );
      housingChannel.name = `${barName}.housing`;
      housingChannel.position.set(0, -0.011, 0);
      housingChannel.castShadow = false;
      barGroup.add(housingChannel);

      // End caps at both ends of the 1.22m LED batten
      for (const endSign of [-1, 1] as const) {
        const endCap = new THREE.Mesh(
          new THREE.BoxGeometry(0.018, 0.048, barW + 0.004),
          ledEndCapMat
        );
        endCap.name = `${barName}.endCap`;
        endCap.position.set(endSign * (barLen / 2 - 0.009), -0.024, 0);
        barGroup.add(endCap);
      }

      // Frosted opal polycarbonate linear LED diffuser lens
      const diffuserLens = new THREE.Mesh(
        new THREE.BoxGeometry(barLen - 0.036, 0.028, barW - 0.008),
        ledDiffuserMat
      );
      diffuserLens.name = `${barName}.diffuser`;
      diffuserLens.position.set(0, -0.036, 0);
      barGroup.add(diffuserLens);

      if (hasLight) {
        // Consolidated PointLight positioned in world space between the Plant Room & Study doorway
        // (parented directly to `scene` rather than `groundFloorCeilingGroup` so ceiling cutaway never recompiles shaders!)
        const ledPointLight = new THREE.PointLight(0xffe0a8, 14.5, 7.8, 1.65);
        ledPointLight.position.set(-19.23, wallH - 0.21, 9.94);
        scene.add(ledPointLight);
        lightGroups.studyPendant.lights.push(ledPointLight);
      }

      scene.add(barGroup);
      interactions.registerLightFixture(barGroup, 'studyPendant');
      ctx.addGlowPool('studyPendant', bx, tier2FloorY + 0.006, bz, 2.25, 0.24);
    }
  }
  buildRoomCorstonToggleSwitch(ctx, {
    circuitId: 'studyPendant',
    switchPa: '1.1.23',
    location: 'Study — Partition Wall (by Open Doorway)',
    x: -18.99,
    y: tier2FloorY + 1.18,
    z: 9.95,
    facing: 'west',
  });

  // Issue #3: There is no lightswitch on the East wall of the Plant Room — it is a KNX PIR + Lux Motion Sensor
  // (`plantRoom.knxMotionSensor`, PA 1.1.24) controlling the Plant Room lighting.
  {
    const motionSensorGroup = new THREE.Group();
    motionSensorGroup.name = 'plantRoom.knxMotionSensor';
    motionSensorGroup.userData.zone = 'study';
    motionSensorGroup.userData.knxPa = '1.1.24';
    motionSensorGroup.userData.location = 'Plant Room — East Wall (Motion Sensor by Courtyard Door)';
    const sensorWallX = getEastCourtyardWallCenterX(9.92) - 0.145;
    motionSensorGroup.position.set(sensorWallX, tier2FloorY + 1.92, 9.92);

    const sensorBodyMat = new THREE.MeshStandardMaterial({
      color: 0xf4f2ec,
      roughness: 0.34,
      metalness: 0.06,
    });
    const sensorBezelMat = new THREE.MeshStandardMaterial({
      color: 0xdad6cc,
      roughness: 0.38,
      metalness: 0.14,
    });
    const fresnelLensMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x70c8ff,
      emissiveIntensity: 0.18,
      roughness: 0.18,
      metalness: 0.05,
    });
    const statusLedMat = new THREE.MeshStandardMaterial({
      color: 0x38e54d,
      emissive: 0x22cc38,
      emissiveIntensity: 1.6,
      roughness: 0.2,
    });

    // Wall-mounted circular KNX presence/motion detector housing facing West (-X) into the Plant Room
    const wallMountBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.044, 0.046, 0.016, 24),
      sensorBodyMat
    );
    wallMountBase.name = 'plantRoom.knxMotionSensor.housing';
    wallMountBase.rotation.z = Math.PI / 2;
    wallMountBase.position.set(-0.008, 0, 0);
    wallMountBase.castShadow = true;
    motionSensorGroup.add(wallMountBase);

    const trimBezel = new THREE.Mesh(
      new THREE.TorusGeometry(0.038, 0.0035, 10, 24),
      sensorBezelMat
    );
    trimBezel.name = 'plantRoom.knxMotionSensor.bezel';
    trimBezel.rotation.y = Math.PI / 2;
    trimBezel.position.set(-0.016, 0, 0);
    motionSensorGroup.add(trimBezel);

    // Segmented hemispherical PIR Fresnel lens dome projecting West (-X)
    const pirDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.026, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.52),
      fresnelLensMat
    );
    pirDome.name = 'plantRoom.knxMotionSensor.pirFresnelLens';
    pirDome.rotation.z = Math.PI / 2;
    pirDome.scale.set(1, 0.58, 1);
    pirDome.position.set(-0.015, 0, 0);
    motionSensorGroup.add(pirDome);

    // Green KNX bus / occupancy indicator micro-LED below lens
    const statusLed = new THREE.Mesh(
      new THREE.SphereGeometry(0.0028, 8, 8),
      statusLedMat
    );
    statusLed.name = 'plantRoom.knxMotionSensor.statusLed';
    statusLed.position.set(-0.017, -0.032, 0);
    motionSensorGroup.add(statusLed);

    scene.add(motionSensorGroup);
    interactions.registerLightFixture(motionSensorGroup, 'studyPendant');
  }

  // Issues #2–#17: UK Regulations (Approved Document M / BS 7671) Corston Antique Brass
  // 13A BS 1363 Switched Sockets, 5A BS 546 Round-Pin Lamp Sockets & Flush Brass Floor Socket
  buildGroundFloorCorstonSockets(ctx, tagCutawayWall, eastWingCtx);
}
