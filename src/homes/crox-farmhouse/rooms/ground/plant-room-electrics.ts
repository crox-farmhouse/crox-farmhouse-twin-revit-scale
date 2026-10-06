import * as THREE from 'three';
import type { CutawayWallDescriptor, SceneBuilderContext } from '../../../../types/scene.ts';
import type { createGroundFloorMaterials } from '../../structure/ground-floor-materials.ts';
import type { defineTier2Levels } from '../../structure/tier2-levels.ts';

function createSharedGeo<T extends THREE.BufferGeometry>(geo: T): T {
  geo.computeBoundingSphere();
  return geo;
}

function tagHighLod<T extends THREE.Object3D>(obj: T, maxDistance = 12): T {
  obj.userData.lodTier = 'high';
  obj.userData.lodMaxDistance = maxDistance;
  return obj;
}

/**
 * Plant Room east wall: KNX automation and 3-phase distribution boards.
 *
 * Extracted verbatim from `buildMainHouseGroundFloorRooms` (ground-floor-rooms.ts). Statement order and
 * geometry are unchanged; shared locals flow in via `kit` and out via the return value.
 */
export function buildPlantRoomElectrics(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createGroundFloorMaterials>, 'tagCutawayWall' | 'windowGlassMat'> &
    Pick<ReturnType<typeof defineTier2Levels>, 'tier2FloorY'>
): void {
  const { scene } = ctx;
  const {
    tagCutawayWall,
    tier2FloorY,
    windowGlassMat,
  } = kit;
  // =========================================================================
  // 7A. PLANT ROOM EAST WALL: KNX AUTOMATION & 3-PHASE 400V METAL DISTRIBUTION BOARDS
  //     (Issue #15: Mounted on the East interior wall X = -17.39m to the right/South of the Z = 9.22m door,
  //      spanning Z = 9.82m..11.42m, facing West -X into the Plant Room)
  // =========================================================================
  {
    const elecGroup = new THREE.Group();
    elecGroup.name = 'plantRoom.electricalDistribution';
    elecGroup.userData.zone = 'study';
    elecGroup.position.x = 0.054;
    const eastCutaway: CutawayWallDescriptor = {
      axis: 'x',
      coord: -17.25,
      minSpan: 8.15,
      maxSpan: 11.77,
      floor: 'ground',
    };
    tagCutawayWall(elecGroup, eastCutaway);

    const enclosureGreyMat = new THREE.MeshStandardMaterial({
      color: 0xcad0d6, // RAL 7035 light industrial sheet-steel powder coat
      roughness: 0.34,
      metalness: 0.52,
    });
    const enclosureTrimMat = new THREE.MeshStandardMaterial({
      color: 0x3b4248,
      roughness: 0.4,
      metalness: 0.6,
    });
    const trunkingGalvMat = new THREE.MeshStandardMaterial({
      color: 0xb4bcc4,
      roughness: 0.28,
      metalness: 0.75,
    });
    const dinModuleWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xeaecef,
      roughness: 0.42,
    });
    const knxGreenLedMat = new THREE.MeshStandardMaterial({
      color: 0x22dd55,
      emissive: 0x18cc44,
      emissiveIntensity: 0.9,
    });
    const dangerYellowMat = new THREE.MeshStandardMaterial({
      color: 0xf2c418,
      roughness: 0.35,
    });
    const isolatorRedMat = new THREE.MeshStandardMaterial({
      color: 0xd42420,
      roughness: 0.32,
    });

    // Overhead horizontal 150x100mm galvanized steel cable trunking header above both boards (Y = tier2FloorY + 2.38m, Z = 9.80m..11.44m)
    const headerTrunking = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.14, 0.14, 1.64)),
      trunkingGalvMat
    );
    headerTrunking.name = 'plantRoom.electricalDistribution.headerTrunking';
    headerTrunking.position.set(-17.39 - 0.07, tier2FloorY + 2.38, 10.62);
    headerTrunking.castShadow = true;
    elecGroup.add(headerTrunking);

    // 1. Left Board (Z = 10.18m): Tall Hager / ABB KNX Building Automation Metal Cabinet (0.64m W x 1.14m H x 0.18m D)
    const knxBoardZ = 10.18;
    const knxBoardY = tier2FloorY + 1.56;
    const knxCabinet = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.18, 1.14, 0.64)),
      enclosureGreyMat
    );
    knxCabinet.name = 'plantRoom.electricalDistribution.knxBoard';
    knxCabinet.position.set(-17.39 - 0.09, knxBoardY, knxBoardZ);
    knxCabinet.castShadow = true;
    knxCabinet.receiveShadow = true;
    elecGroup.add(knxCabinet);

    // Dark recessed DIN-rail interior window + 5 rows of KNX actuators, DALI gateways & bus power supplies
    const knxWindowBack = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.016, 0.96, 0.50)),
      enclosureTrimMat
    );
    knxWindowBack.name = 'plantRoom.electricalDistribution.knxBoard.windowBack';
    knxWindowBack.position.set(-17.39 - 0.176, knxBoardY, knxBoardZ);
    elecGroup.add(knxWindowBack);

    const dinRailGeo = createSharedGeo(new THREE.BoxGeometry(0.022, 0.068, 0.44));
    const statusLedGeo = createSharedGeo(new THREE.BoxGeometry(0.006, 0.012, 0.016));
    for (let row = 0; row < 5; row++) {
      const ry = knxBoardY + 0.36 - row * 0.18;
      const dinRail = new THREE.Mesh(
        dinRailGeo,
        dinModuleWhiteMat
      );
      dinRail.name = `plantRoom.electricalDistribution.knxDinRow.${row + 1}`;
      dinRail.position.set(-17.39 - 0.182, ry, knxBoardZ);
      elecGroup.add(dinRail);

      // Green KNX bus & channel status LEDs along each DIN row
      for (let led = 0; led < 4; led++) {
        const statusLed = tagHighLod(
          new THREE.Mesh(statusLedGeo, knxGreenLedMat)
        );
        statusLed.name = `plantRoom.electricalDistribution.knxDinRow.${row + 1}.statusLed.${led + 1}`;
        statusLed.position.set(
          -17.39 - 0.194,
          ry + 0.015,
          knxBoardZ - 0.16 + led * 0.105
        );
        elecGroup.add(statusLed);
      }
    }

    // Smoked glass inspection door & vertical swing-handle lock on the KNX enclosure
    const knxGlassDoor = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.008, 1.02, 0.54)),
      windowGlassMat
    );
    knxGlassDoor.name = 'plantRoom.electricalDistribution.knxBoard.glassDoor';
    knxGlassDoor.position.set(-17.39 - 0.196, knxBoardY, knxBoardZ);
    elecGroup.add(knxGlassDoor);

    const knxDoorHandle = tagHighLod(
      new THREE.Mesh(
        createSharedGeo(new THREE.BoxGeometry(0.02, 0.14, 0.028)),
        enclosureTrimMat
      )
    );
    knxDoorHandle.name = 'plantRoom.electricalDistribution.knxBoard.doorHandle';
    knxDoorHandle.position.set(-17.39 - 0.195, knxBoardY, knxBoardZ - 0.285);
    elecGroup.add(knxDoorHandle);

    // 2. Right Board (Z = 10.98m): 3-Phase 400V TPN Commercial Metal Distribution Board & Main Switch-Disconnector
    const tpBoardZ = 10.98;
    const tpBoardY = tier2FloorY + 1.66;
    const tpCabinet = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.20, 0.94, 0.56)),
      enclosureGreyMat
    );
    tpCabinet.name = 'plantRoom.electricalDistribution.threePhaseBoard';
    tpCabinet.position.set(-17.39 - 0.10, tpBoardY, tpBoardZ);
    tpCabinet.castShadow = true;
    tpCabinet.receiveShadow = true;
    elecGroup.add(tpCabinet);

    // Lower 125A 3-Phase Incomer & Rotary Isolator Switch Box (Y = tier2FloorY + 0.92m)
    const incomerBox = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.20, 0.38, 0.56)),
      enclosureGreyMat
    );
    incomerBox.name = 'plantRoom.electricalDistribution.threePhaseIncomer';
    incomerBox.position.set(-17.39 - 0.10, tier2FloorY + 0.92, tpBoardZ);
    incomerBox.castShadow = true;
    elecGroup.add(incomerBox);

    // Yellow & Red Interlocking 3-Phase Rotary Main Isolator Handle on Incomer Box
    const isolatorPad = tagHighLod(
      new THREE.Mesh(
        createSharedGeo(new THREE.BoxGeometry(0.014, 0.088, 0.088)),
        dangerYellowMat
      )
    );
    isolatorPad.name = 'plantRoom.electricalDistribution.threePhaseIncomer.isolatorPad';
    isolatorPad.position.set(-17.39 - 0.204, tier2FloorY + 0.94, tpBoardZ + 0.12);
    elecGroup.add(isolatorPad);

    const isolatorKnob = tagHighLod(
      new THREE.Mesh(
        createSharedGeo(new THREE.BoxGeometry(0.032, 0.024, 0.068)),
        isolatorRedMat
      )
    );
    isolatorKnob.name = 'plantRoom.electricalDistribution.threePhaseIncomer.isolatorKnob';
    isolatorKnob.position.set(-17.39 - 0.218, tier2FloorY + 0.94, tpBoardZ + 0.12);
    elecGroup.add(isolatorKnob);

    // L1 / L2 / L3 3-Phase Neon Indicator Lamps (Red, Amber, Blue) & Digital Multi-Function Meter on TPN Board
    const phaseColors = [0xff2b2b, 0xffb81c, 0x2277ff] as const;
    const phaseLampGeo = createSharedGeo(new THREE.CylinderGeometry(0.011, 0.011, 0.012, 10));
    for (let p = 0; p < 3; p++) {
      const pLamp = tagHighLod(
        new THREE.Mesh(
          phaseLampGeo,
          new THREE.MeshStandardMaterial({
            color: phaseColors[p],
            emissive: phaseColors[p],
            emissiveIntensity: 0.85,
          })
        )
      );
      pLamp.name = `plantRoom.electricalDistribution.threePhaseBoard.phaseLamp.L${p + 1}`;
      pLamp.rotation.z = Math.PI / 2;
      pLamp.position.set(
        -17.39 - 0.204,
        tpBoardY + 0.34,
        tpBoardZ - 0.08 + p * 0.045
      );
      elecGroup.add(pLamp);
    }

    // Yellow 400V 3-Phase Warning Plaques on both metal boards
    const warningPlaqueGeo = createSharedGeo(new THREE.BoxGeometry(0.006, 0.065, 0.095));
    for (const [wIdx, wz] of ([knxBoardZ, tpBoardZ] as const).entries()) {
      const warningPlaque = tagHighLod(
        new THREE.Mesh(warningPlaqueGeo, dangerYellowMat)
      );
      warningPlaque.name = `plantRoom.electricalDistribution.warningPlaque.${wIdx + 1}`;
      warningPlaque.position.set(-17.39 - 0.202, tier2FloorY + 1.88, wz);
      elecGroup.add(warningPlaque);
    }

    // Vertical galvanized steel cable risers connecting both boards to the overhead trunking & floor conduit
    const riserGeo = createSharedGeo(new THREE.BoxGeometry(0.08, 0.32, 0.08));
    for (const [rIdx, rz] of ([knxBoardZ - 0.14, knxBoardZ + 0.14, tpBoardZ - 0.12, tpBoardZ + 0.12] as const).entries()) {
      const riser = new THREE.Mesh(
        riserGeo,
        trunkingGalvMat
      );
      riser.name = `plantRoom.electricalDistribution.cableRiser.${rIdx + 1}`;
      riser.position.set(-17.39 - 0.06, tier2FloorY + 2.22, rz);
      elecGroup.add(riser);
    }

    scene.add(elecGroup);

    // =========================================================================
    // 7A-2. PLANT ROOM SOUTH WALL: 3-PHASE 32 kWh HOME BATTERY STACK (SIGENSTOR
    //       20 kW 3-PHASE HYBRID INVERTER + 4 x 8 kWh LFP MODULES) & 3-PHASE
    //       WHOLE-HOME BACKUP GATEWAY (ATS)
    //       Mounted along the North -Z = 11.49m interior face of the Plant Room
    //       South wall (X = -18.78m..-17.56m, Y = tier2FloorY = -0.60m), directly
    //       adjacent to the 125A 3-Phase 400V TPN Incomer & KNX Board.
    // =========================================================================
    const batterySystemGroup = new THREE.Group();
    batterySystemGroup.name = 'plantRoom.homeBatterySystem';
    batterySystemGroup.userData.zone = 'study';
    tagCutawayWall(batterySystemGroup, {
      axis: 'z',
      coord: 11.63,
      minSpan: -22.47,
      maxSpan: -17.11,
      floor: 'ground',
    });

    const batteryPearlWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf4f6f8, // Sleek matte pearl-white powder-coated aluminum fascia (SigenStor / PW3 aesthetic)
      roughness: 0.22,
      metalness: 0.18,
    });
    const batteryAnthraciteChassisMat = new THREE.MeshStandardMaterial({
      color: 0x20252b, // Anodized dark anthracite heat-sink chassis, plinth & module shadow seams
      roughness: 0.38,
      metalness: 0.58,
    });
    const batteryCyanHaloMat = new THREE.MeshStandardMaterial({
      color: 0x18f0d8, // Signature SigenStor glowing cyan-emerald state-of-charge LED bar & halo ring
      emissive: 0x00d8c0,
      emissiveIntensity: 1.15,
      roughness: 0.15,
    });

    // 1. Floor-Standing 32 kWh Modular 3-Phase Battery + 20 kW Hybrid Inverter Stack
    //    Positioned at X = -18.42m, Z = 11.34m (0.68m W x 1.62m H x 0.28m D, facing North -Z)
    const stackGroup = new THREE.Group();
    stackGroup.name = 'plantRoom.homeBatterySystem.sigenStorStack';
    stackGroup.position.set(-18.42, tier2FloorY, 11.34);

    const stackW = 0.68;
    const stackD = 0.28;
    const basePlinthH = 0.075;

    // Floor-levelling anthracite aluminum base plinth (Y = 0..0.075m)
    const stackPlinth = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(stackW, basePlinthH, stackD)),
      batteryAnthraciteChassisMat
    );
    stackPlinth.name = 'plantRoom.homeBatterySystem.plinth';
    stackPlinth.position.set(0, basePlinthH * 0.5, 0);
    stackPlinth.castShadow = true;
    stackPlinth.receiveShadow = true;
    stackGroup.add(stackPlinth);

    // 4 x 8 kWh Modular LFP Battery Packs (32 kWh total, stacked Y = 0.08m..1.20m)
    const modH = 0.265;
    const modGap = 0.015;
    const modChassisGeo = createSharedGeo(new THREE.BoxGeometry(stackW - 0.02, modH + modGap, stackD - 0.03));
    const modFasciaGeo = createSharedGeo(new THREE.BoxGeometry(stackW, modH, 0.036));
    for (let m = 0; m < 4; m++) {
      const modCenterY = basePlinthH + m * (modH + modGap) + modH * 0.5 + 0.008;

      // Rear dark anthracite finned aluminum heat-sink core
      const modChassis = new THREE.Mesh(
        modChassisGeo,
        batteryAnthraciteChassisMat
      );
      modChassis.name = `plantRoom.homeBatterySystem.batteryModule.${m + 1}.chassis`;
      modChassis.position.set(0, modCenterY, 0.01);
      modChassis.castShadow = true;
      modChassis.receiveShadow = true;
      stackGroup.add(modChassis);

      // Front chamfered pearl-white aluminum battery module cover
      const modFascia = new THREE.Mesh(
        modFasciaGeo,
        batteryPearlWhiteMat
      );
      modFascia.name = `plantRoom.homeBatterySystem.batteryModule.${m + 1}`;
      modFascia.position.set(0, modCenterY, -stackD * 0.5 + 0.018);
      modFascia.castShadow = true;
      modFascia.receiveShadow = true;
      stackGroup.add(modFascia);
    }

    // Top 20 kW 3-Phase Hybrid Inverter / Energy Controller Head Unit (Y = 1.20m..1.58m)
    const invH = 0.36;
    const invCenterY = basePlinthH + 4 * (modH + modGap) + invH * 0.5 + 0.01;

    const invChassis = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(stackW - 0.016, invH, stackD - 0.02)),
      batteryAnthraciteChassisMat
    );
    invChassis.name = 'plantRoom.homeBatterySystem.hybridInverter3Phase.chassis';
    invChassis.position.set(0, invCenterY, 0.008);
    invChassis.castShadow = true;
    stackGroup.add(invChassis);

    const invFascia = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(stackW, invH - 0.01, 0.038)),
      batteryPearlWhiteMat
    );
    invFascia.name = 'plantRoom.homeBatterySystem.hybridInverter3Phase';
    invFascia.position.set(0, invCenterY, -stackD * 0.5 + 0.019);
    invFascia.castShadow = true;
    invFascia.receiveShadow = true;
    stackGroup.add(invFascia);

    // Top anthracite weather/dust cap crown
    const stackTopCap = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(stackW + 0.006, 0.022, stackD + 0.006)),
      batteryAnthraciteChassisMat
    );
    stackTopCap.name = 'plantRoom.homeBatterySystem.sigenStorStack.topCap';
    stackTopCap.position.set(0, invCenterY + invH * 0.5 + 0.008, 0);
    stackGroup.add(stackTopCap);

    // Glowing State-of-Charge (SoC) Vertical LED Light Bar & Circular Halo Ring on the Front Fascia (-Z face)
    const frontFaceZ = -stackD * 0.5 - 0.002;
    const socHaloRing = new THREE.Mesh(
      createSharedGeo(new THREE.RingGeometry(0.044, 0.056, 28)),
      batteryCyanHaloMat
    );
    socHaloRing.name = 'plantRoom.homeBatterySystem.socHaloRing';
    socHaloRing.rotation.y = Math.PI;
    socHaloRing.position.set(0, invCenterY + 0.02, frontFaceZ);
    stackGroup.add(socHaloRing);

    const socVerticalBar = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.012, 1.18, 0.006)),
      batteryCyanHaloMat
    );
    socVerticalBar.name = 'plantRoom.homeBatterySystem.socLightBar';
    socVerticalBar.position.set(0, 0.68, frontFaceZ);
    stackGroup.add(socVerticalBar);

    // Side-mounted DC Rotary Isolator Switch on the Inverter Head Unit
    const dcIsolator = tagHighLod(
      new THREE.Mesh(
        createSharedGeo(new THREE.BoxGeometry(0.024, 0.068, 0.068)),
        isolatorRedMat
      )
    );
    dcIsolator.name = 'plantRoom.homeBatterySystem.hybridInverter3Phase.dcIsolator';
    dcIsolator.position.set(stackW * 0.5 + 0.01, invCenterY - 0.04, -0.02);
    stackGroup.add(dcIsolator);

    batterySystemGroup.add(stackGroup);

    // 2. Wall-Mounted 3-Phase Whole-Home Backup Gateway / Automatic Transfer Switch (0ms UPS ATS)
    //    Positioned at X = -17.78m, Y = tier2FloorY + 1.34m, Z = 11.39m (0.42m W x 0.62m H x 0.18m D, facing North -Z)
    const gatewayGroup = new THREE.Group();
    gatewayGroup.name = 'plantRoom.homeBatterySystem.backupGateway';
    gatewayGroup.position.set(-17.78, tier2FloorY + 1.34, 11.39);

    const gwW = 0.42;
    const gwH = 0.62;
    const gwD = 0.18;

    const gatewayBox = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(gwW, gwH, gwD)),
      batteryPearlWhiteMat
    );
    gatewayBox.name = 'plantRoom.homeBatterySystem.backupGateway.enclosure';
    gatewayBox.castShadow = true;
    gatewayBox.receiveShadow = true;
    gatewayGroup.add(gatewayBox);

    // Dark recessed smoked-glass status window on the Backup Gateway
    const gatewayWindow = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(0.16, 0.24, 0.008)),
      enclosureTrimMat
    );
    gatewayWindow.name = 'plantRoom.homeBatterySystem.backupGateway.statusWindow';
    gatewayWindow.position.set(-0.06, 0.04, -gwD * 0.5 - 0.002);
    gatewayGroup.add(gatewayWindow);

    // 3-Phase Grid / Battery / Home Status LEDs (Green On-Grid + Cyan Battery Ready + KNX Load-Shed Link)
    const gatewayLedGeo = createSharedGeo(new THREE.BoxGeometry(0.018, 0.01, 0.006));
    for (let gLed = 0; gLed < 3; gLed++) {
      const ledDot = tagHighLod(
        new THREE.Mesh(
          gatewayLedGeo,
          gLed === 1 ? batteryCyanHaloMat : knxGreenLedMat
        )
      );
      ledDot.name = `plantRoom.homeBatterySystem.backupGateway.statusLed.${gLed + 1}`;
      ledDot.position.set(-0.06, 0.11 - gLed * 0.045, -gwD * 0.5 - 0.006);
      gatewayGroup.add(ledDot);
    }

    // Manual Grid/Backup Rotary Bypass Interlock Switch & Dual Voltage Warning Label on Gateway
    const bypassPad = tagHighLod(
      new THREE.Mesh(
        createSharedGeo(new THREE.BoxGeometry(0.072, 0.072, 0.012)),
        dangerYellowMat
      )
    );
    bypassPad.name = 'plantRoom.homeBatterySystem.backupGateway.bypassPad';
    bypassPad.position.set(0.1, -0.06, -gwD * 0.5 - 0.004);
    gatewayGroup.add(bypassPad);

    const bypassKnob = tagHighLod(
      new THREE.Mesh(
        createSharedGeo(new THREE.BoxGeometry(0.022, 0.054, 0.026)),
        isolatorRedMat
      )
    );
    bypassKnob.name = 'plantRoom.homeBatterySystem.backupGateway.bypassKnob';
    bypassKnob.position.set(0.1, -0.06, -gwD * 0.5 - 0.016);
    gatewayGroup.add(bypassKnob);

    batterySystemGroup.add(gatewayGroup);

    // 3. Galvanized Steel Cable Trunking & Conduits linking SigenStor Stack -> Backup Gateway -> 3-Phase TPN Board
    const southHeaderTrunking = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(1.36, 0.14, 0.14)),
      trunkingGalvMat
    );
    southHeaderTrunking.name = 'plantRoom.homeBatterySystem.southTrunking';
    southHeaderTrunking.position.set(-18.08, tier2FloorY + 2.38, 11.39);
    southHeaderTrunking.castShadow = true;
    batterySystemGroup.add(southHeaderTrunking);

    // Vertical armored risers from the Inverter & Backup Gateway up to the South galvanized trunking header
    const batRiserLongGeo = createSharedGeo(new THREE.BoxGeometry(0.068, 0.80, 0.068));
    const batRiserShortGeo = createSharedGeo(new THREE.BoxGeometry(0.068, 0.74, 0.068));
    for (const [rIdx, rx] of ([-18.32, -17.86, -17.70] as const).entries()) {
      const isLong = rx === -18.32;
      const rH = isLong ? 0.80 : 0.74;
      const rMidY = tier2FloorY + 2.31 - rH * 0.5;
      const batRiser = new THREE.Mesh(
        isLong ? batRiserLongGeo : batRiserShortGeo,
        trunkingGalvMat
      );
      batRiser.name = `plantRoom.homeBatterySystem.cableRiser.${rIdx + 1}`;
      batRiser.position.set(rx, rMidY, 11.41);
      batterySystemGroup.add(batRiser);
    }

    scene.add(batterySystemGroup);
  }
}
