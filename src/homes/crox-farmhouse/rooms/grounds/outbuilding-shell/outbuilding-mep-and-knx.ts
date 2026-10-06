import * as THREE from 'three';
import type { CircuitId } from '../../../../../types/knx.ts';
import type {
  CutawayWallDescriptor,
  InteractiveUserData,
  SceneBuilderContext,
} from '../../../../../types/scene.ts';
import type { RoomZoneId } from '../../../../../types/topology.ts';
import {
  buildCorstonPowerSocket,
  type CorstonSocketPlacement,
} from '../../../../../objects/fixtures/corston-power-sockets.ts';
import { buildRoomCorstonToggleSwitch } from '../../ground/kitchen-utility/knx-wall-and-keypad-devices.ts';
import type { OutbuildingShellContext } from './outbuilding-coords-and-materials.ts';

function setInteractiveTreeUserData(root: THREE.Object3D, data: InteractiveUserData): void {
  root.userData = { ...root.userData, ...data };
}

/**
 * Builds a sleek architectural Daikin Emura / Mitsubishi Kirigamine Zen Air-to-Air VRF
 * High-Wall Inverter Indoor Fan-Coil Unit with curved matte-white acoustic front panel,
 * motorized Coanda discharge louvre vane, dark return-air shadow gap, and status LED pip.
 */
function buildIndoorAirToAirAcUnit(
  unitName: string,
  u: number,
  y: number,
  v: number,
  rotY: number,
  zoneId: RoomZoneId
): THREE.Group {
  const acGroup = new THREE.Group();
  acGroup.name = unitName;
  acGroup.userData = { zone: zoneId };
  acGroup.position.set(u, y, v);
  acGroup.rotation.y = rotY;

  const casingMat = new THREE.MeshStandardMaterial({
    color: 0xf4f2ed,
    roughness: 0.32,
    metalness: 0.08,
  });
  const trimAnthraciteMat = new THREE.MeshStandardMaterial({
    color: 0x23272e,
    roughness: 0.42,
    metalness: 0.35,
  });
  const brushedSilverMat = new THREE.MeshStandardMaterial({
    color: 0xc8cdd4,
    roughness: 0.26,
    metalness: 0.78,
  });
  const coolLedMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: new THREE.Color(0x0ea5e9),
    emissiveIntensity: 2.2,
    roughness: 0.2,
  });

  // 1. Rear wall chassis block (0.88m W x 0.29m H x 0.16m D)
  const chassisGeo = new THREE.BoxGeometry(0.88, 0.29, 0.16);
  chassisGeo.computeBoundingSphere();
  const chassis = new THREE.Mesh(chassisGeo, casingMat);
  chassis.name = `${unitName}.chassis`;
  chassis.position.set(0, 0, 0.08);
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  acGroup.add(chassis);

  // 2. Curved / bevelled floating front fascia panel (Daikin Emura silhouette)
  const fasciaGeo = new THREE.BoxGeometry(0.9, 0.275, 0.045);
  fasciaGeo.computeBoundingSphere();
  const fascia = new THREE.Mesh(fasciaGeo, casingMat);
  fascia.name = `${unitName}.frontFascia`;
  fascia.position.set(0, 0.004, 0.185);
  fascia.castShadow = true;
  acGroup.add(fascia);

  // Brushed aluminium trim strip along lower fascia edge
  const accentGeo = new THREE.BoxGeometry(0.89, 0.008, 0.006);
  accentGeo.computeBoundingSphere();
  const accentStrip = new THREE.Mesh(accentGeo, brushedSilverMat);
  accentStrip.name = `${unitName}.silverTrim`;
  accentStrip.position.set(0, -0.11, 0.209);
  acGroup.add(accentStrip);

  // 3. Dark discharge slot & motorized Coanda airflow vane at bottom
  const slotGeo = new THREE.BoxGeometry(0.84, 0.036, 0.04);
  slotGeo.computeBoundingSphere();
  const dischargeSlot = new THREE.Mesh(slotGeo, trimAnthraciteMat);
  dischargeSlot.name = `${unitName}.dischargeSlot`;
  dischargeSlot.position.set(0, -0.128, 0.165);
  acGroup.add(dischargeSlot);

  const vaneGeo = new THREE.BoxGeometry(0.82, 0.006, 0.048);
  vaneGeo.computeBoundingSphere();
  const louvreVane = new THREE.Mesh(vaneGeo, casingMat);
  louvreVane.name = `${unitName}.coandaLouvreVane`;
  louvreVane.position.set(0, -0.138, 0.182);
  louvreVane.rotation.x = 0.42;
  acGroup.add(louvreVane);

  // 4. Daikin Intelligent Thermal Eye & Cool-Blue KNX Status LED on right corner
  const eyeGeo = new THREE.CylinderGeometry(0.009, 0.009, 0.008, 14);
  eyeGeo.computeBoundingSphere();
  const sensorEye = new THREE.Mesh(eyeGeo, trimAnthraciteMat);
  sensorEye.name = `${unitName}.thermalSensorEye`;
  sensorEye.rotation.x = Math.PI / 2;
  sensorEye.position.set(0.38, -0.11, 0.208);
  acGroup.add(sensorEye);

  const ledGeo = new THREE.BoxGeometry(0.022, 0.004, 0.004);
  ledGeo.computeBoundingSphere();
  const statusLed = new THREE.Mesh(ledGeo, coolLedMat);
  statusLed.name = `${unitName}.knxCoolingLed`;
  statusLed.position.set(0.34, -0.11, 0.209);
  acGroup.add(statusLed);

  return acGroup;
}

/**
 * Builds the concealed Outdoor Multi-Split / VRF Heat Pump Condenser Unit (`Daikin VRV IV-S 14kW`)
 * behind the South Outbuilding Wall (`u = 13.60m, v = 6.12m`) with anti-vibration plinth,
 * twin axial fans, insulated copper pair-coil refrigerant trunking, and IP65 rotary isolator.
 */
function buildOutdoorVrfCondenserBank(groundGroup: THREE.Group): void {
  const condGroup = new THREE.Group();
  condGroup.name = 'outbuildings.mep.acOutdoorCondenser';
  condGroup.userData = { zone: 'outbuildingGarage' };
  condGroup.position.set(13.6, -0.34, 6.12);

  const concretePadMat = new THREE.MeshStandardMaterial({
    color: 0x8d8b84,
    roughness: 0.88,
    metalness: 0.04,
  });
  const cabinetMat = new THREE.MeshStandardMaterial({
    color: 0xd8d5cc,
    roughness: 0.42,
    metalness: 0.32,
  });
  const darkGrilleMat = new THREE.MeshStandardMaterial({
    color: 0x22262b,
    roughness: 0.48,
    metalness: 0.52,
  });
  const copperInsulationMat = new THREE.MeshStandardMaterial({
    color: 0x1e2228,
    roughness: 0.65,
    metalness: 0.12,
  });
  const isolatorYellowMat = new THREE.MeshStandardMaterial({
    color: 0xeab308,
    roughness: 0.35,
    metalness: 0.15,
  });
  const isolatorRedMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.35,
    metalness: 0.15,
  });

  // 1. Concrete plinth slab + Big Foot anti-vibration rubber mounting feet
  const padGeo = new THREE.BoxGeometry(1.28, 0.1, 0.58);
  padGeo.computeBoundingSphere();
  const pad = new THREE.Mesh(padGeo, concretePadMat);
  pad.name = 'outbuildings.mep.acOutdoorCondenser.concretePad';
  pad.position.set(0, 0.05, 0);
  pad.castShadow = true;
  pad.receiveShadow = true;
  condGroup.add(pad);

  for (const fx of [-0.42, 0.42] as const) {
    const footGeo = new THREE.BoxGeometry(0.14, 0.045, 0.42);
    footGeo.computeBoundingSphere();
    const foot = new THREE.Mesh(footGeo, copperInsulationMat);
    foot.name = `outbuildings.mep.acOutdoorCondenser.antiVibFoot.${fx < 0 ? 'west' : 'east'}`;
    foot.position.set(fx, 0.122, 0);
    condGroup.add(foot);
  }

  // 2. Twin-Fan Daikin VRV IV-S Weatherproof Sheet-Steel Cabinet (1.06m W x 1.34m H x 0.38m D)
  const cabGeo = new THREE.BoxGeometry(1.06, 1.34, 0.38);
  cabGeo.computeBoundingSphere();
  const cabinet = new THREE.Mesh(cabGeo, cabinetMat);
  cabinet.name = 'outbuildings.mep.acOutdoorCondenser.cabinet';
  cabinet.position.set(0, 0.815, 0);
  cabinet.castShadow = true;
  cabinet.receiveShadow = true;
  condGroup.add(cabinet);

  // Top weather cap lip
  const topCapGeo = new THREE.BoxGeometry(1.08, 0.032, 0.4);
  topCapGeo.computeBoundingSphere();
  const topCap = new THREE.Mesh(topCapGeo, cabinetMat);
  topCap.name = 'outbuildings.mep.acOutdoorCondenser.topCap';
  topCap.position.set(0, 1.49, 0);
  condGroup.add(topCap);

  // 3. Twin circular acoustic fan shrouds & hubs on South (+z) discharge face
  for (const [tag, cy] of [
    ['lowerFan', 0.49],
    ['upperFan', 1.12],
  ] as const) {
    const shroudGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.022, 24);
    shroudGeo.computeBoundingSphere();
    const shroud = new THREE.Mesh(shroudGeo, darkGrilleMat);
    shroud.name = `outbuildings.mep.acOutdoorCondenser.${tag}.grille`;
    shroud.rotation.x = Math.PI / 2;
    shroud.position.set(-0.14, cy, 0.195);
    condGroup.add(shroud);

    const hubGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.03, 16);
    hubGeo.computeBoundingSphere();
    const hub = new THREE.Mesh(hubGeo, cabinetMat);
    hub.name = `outbuildings.mep.acOutdoorCondenser.${tag}.hub`;
    hub.rotation.x = Math.PI / 2;
    hub.position.set(-0.14, cy, 0.2);
    condGroup.add(hub);
  }

  // 4. Insulated Refrigerant Pair-Coil Trunking Duct entering Outbuilding South Wall (v = 5.71m)
  const trunkGeo = new THREE.BoxGeometry(0.11, 0.95, 0.09);
  trunkGeo.computeBoundingSphere();
  const trunkVertical = new THREE.Mesh(trunkGeo, copperInsulationMat);
  trunkVertical.name = 'outbuildings.mep.acOutdoorCondenser.refrigerantTrunking';
  trunkVertical.position.set(0.62, 0.72, -0.22);
  condGroup.add(trunkVertical);

  const wallEntryGeo = new THREE.BoxGeometry(0.12, 0.12, 0.28);
  wallEntryGeo.computeBoundingSphere();
  const wallEntry = new THREE.Mesh(wallEntryGeo, copperInsulationMat);
  wallEntry.name = 'outbuildings.mep.acOutdoorCondenser.wallPenetration';
  wallEntry.position.set(0.62, 1.15, -0.32);
  condGroup.add(wallEntry);

  // 5. Wall-Mounted IP65 32A Rotary AC Isolator Switch on South Brick Wall
  const isoBoxGeo = new THREE.BoxGeometry(0.12, 0.16, 0.085);
  isoBoxGeo.computeBoundingSphere();
  const isoBox = new THREE.Mesh(isoBoxGeo, isolatorYellowMat);
  isoBox.name = 'outbuildings.mep.acOutdoorCondenser.rotaryIsolator';
  isoBox.position.set(0.84, 1.18, -0.36);
  condGroup.add(isoBox);

  const dialGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.022, 14);
  dialGeo.computeBoundingSphere();
  const dial = new THREE.Mesh(dialGeo, isolatorRedMat);
  dial.name = 'outbuildings.mep.acOutdoorCondenser.rotaryIsolator.handle';
  dial.rotation.x = Math.PI / 2;
  dial.position.set(0.84, 1.18, -0.31);
  condGroup.add(dial);

  groundGroup.add(condGroup);
}

/**
 * Builds the Outbuilding Sub-Main Distribution Board & KNX Line 2.1 DIN-Rail Enclosure
 * (`PA 2.1.1 / 2.1.20 / 2.1.30`) on the Garage East Partition Wall (`u = 11.98m, v = 0.92m`).
 */
function buildGarageSubDistributionAndKnxBoard(groundGroup: THREE.Group): void {
  const boardGroup = new THREE.Group();
  boardGroup.name = 'outbuildings.garage.mepSubBoard';
  boardGroup.userData = { zone: 'outbuildingGarage' };
  boardGroup.position.set(11.98, 1.35, 0.92);
  boardGroup.rotation.y = -Math.PI / 2; // Facing West (-u) into the Garage bay

  const steelEnclosureMat = new THREE.MeshStandardMaterial({
    color: 0xd0d5dc,
    roughness: 0.3,
    metalness: 0.72,
  });
  const darkFrameMat = new THREE.MeshStandardMaterial({
    color: 0x262b33,
    roughness: 0.4,
    metalness: 0.55,
  });
  const dinModuleMat = new THREE.MeshStandardMaterial({
    color: 0xeeece6,
    roughness: 0.45,
    metalness: 0.1,
  });
  const knxGreenLedMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: new THREE.Color(0x16a34a),
    emissiveIntensity: 2.5,
  });

  // 1. Left Enclosure: 18-Way TPN Metal Consumer Unit / Sub-Distribution Board (fed via 16mm² SWA from Main House Plant Room)
  const dbGeo = new THREE.BoxGeometry(0.42, 0.54, 0.13);
  dbGeo.computeBoundingSphere();
  const subDb = new THREE.Mesh(dbGeo, steelEnclosureMat);
  subDb.name = 'outbuildings.garage.mepSubBoard.subConsumerUnit';
  subDb.position.set(-0.26, 0, 0.065);
  subDb.castShadow = true;
  boardGroup.add(subDb);

  // 2. Right Enclosure: KNX TP1 Line 2.1 & 5V/5A Lamp Relay / DALI Dimmer Cabinet (`PA 2.1.20` & `PA 2.1.30`)
  const knxCabGeo = new THREE.BoxGeometry(0.46, 0.54, 0.14);
  knxCabGeo.computeBoundingSphere();
  const knxCab = new THREE.Mesh(knxCabGeo, steelEnclosureMat);
  knxCab.name = 'outbuildings.garage.mepSubBoard.knxLine2Enclosure';
  knxCab.position.set(0.24, 0, 0.07);
  knxCab.castShadow = true;
  boardGroup.add(knxCab);

  // Glazed inspection window frame on KNX enclosure
  const windowBezelGeo = new THREE.BoxGeometry(0.38, 0.42, 0.012);
  windowBezelGeo.computeBoundingSphere();
  const windowBezel = new THREE.Mesh(windowBezelGeo, darkFrameMat);
  windowBezel.name = 'outbuildings.garage.mepSubBoard.knxWindowFrame';
  windowBezel.position.set(0.24, 0, 0.142);
  boardGroup.add(windowBezel);

  // 3 Rows of DIN-rail KNX modules visible behind the inspection window (Line Coupler 2.1.0, PSU, Actuator 2.1.20, AC Gateway 2.1.30)
  for (const [idx, ry] of [
    [1, 0.12],
    [2, 0.0],
    [3, -0.12],
  ] as const) {
    const railModGeo = new THREE.BoxGeometry(0.32, 0.075, 0.016);
    railModGeo.computeBoundingSphere();
    const railMod = new THREE.Mesh(railModGeo, dinModuleMat);
    railMod.name = `outbuildings.garage.mepSubBoard.dinRow.${idx}`;
    railMod.position.set(0.24, ry, 0.146);
    boardGroup.add(railMod);

    const busLedGeo = new THREE.BoxGeometry(0.018, 0.006, 0.004);
    busLedGeo.computeBoundingSphere();
    const busLed = new THREE.Mesh(busLedGeo, knxGreenLedMat);
    busLed.name = `outbuildings.garage.mepSubBoard.dinRow.${idx}.statusLed`;
    busLed.position.set(0.12, ry + 0.018, 0.155);
    boardGroup.add(busLed);
  }

  groundGroup.add(boardGroup);
}

/**
 * Builds the Empty Office Space (`outbuildingStableOffice`, `u = 23.22..31.57m`) temporary lighting:
 * - 6 recessed ceiling spotlights (`outbuildings.stable.office.spotlight.1..6`) on `groundCeilingGroup` (`y = 1.96m`)
 * - 4 aged-brass & fluted-glass wall sconces (`outbuildings.stable.office.wallLight.1..4`) on `groundGroup`
 * - 1 freestanding SE Corner Floor Reading Lamp (`outbuildings.stable.office.floorLamp`) connected to a 5V/5A socket
 * Plus the Main Barn Corner Bar Counter Lamp (`outbuildings.barn.cornerBar.counterLamp`) connected to a 5V/5A socket.
 */
function buildEmptyOfficeAndBarnCounterLighting(s: OutbuildingShellContext): void {
  const {
    ctx,
    groundGroup,
    groundCeilingGroup,
    stableGroundFloorY,
    stableGroundTopY,
    barnCarpetTopY,
    spotlightHousingMat,
    spotlightBrassTrimMat,
  } = s;

  const spotGroup = ctx.lightGroups.stableOfficeSpotlights;
  const wallAndLampGroup = ctx.lightGroups.stableOfficeWallsAndLamps5A;
  const barnLampGroup = ctx.lightGroups.barnBarsAndLamps5A;

  // 1. Six Recessed Warm-White Ceiling Spotlights in Empty Office (`y = stableGroundTopY = 1.96m`)
  const officeSpotCoords: ReadonlyArray<readonly [number, number]> = [
    [25.0, 1.58],
    [27.6, 1.58],
    [30.15, 1.58],
    [25.6, 3.35],
    [27.85, 3.85],
    [30.15, 3.85],
  ];

  const bezelGeo = new THREE.CylinderGeometry(0.052, 0.052, 0.008, 18);
  bezelGeo.computeBoundingSphere();
  const baffleGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.012, 16);
  baffleGeo.computeBoundingSphere();
  const lensGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.004, 16);
  lensGeo.computeBoundingSphere();

  const spotLensMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e4,
    emissive: new THREE.Color(0xffb454),
    emissiveIntensity: 2.4,
    roughness: 0.18,
  });
  spotGroup.emissives.push(spotLensMat);

  officeSpotCoords.forEach(([u, v], idx) => {
    const spotIdx = idx + 1;
    const fixtureName = `outbuildings.stable.office.spotlight.${spotIdx}`;
    const fixture = new THREE.Group();
    fixture.name = fixtureName;
    fixture.userData = {
      zone: 'outbuildingStableOffice',
      circuitId: 'stableOfficeSpotlights',
      switchPa: '2.1.14',
      switchLocation: `Office Ceiling Spot ${spotIdx}`,
    };
    fixture.position.set(u, stableGroundTopY - 0.004, v);

    const bezel = new THREE.Mesh(bezelGeo, spotlightBrassTrimMat);
    bezel.name = `${fixtureName}.bezel`;
    setInteractiveTreeUserData(bezel, fixture.userData as InteractiveUserData);
    ctx.interactiveMeshes.push(bezel);
    fixture.add(bezel);

    const baffle = new THREE.Mesh(baffleGeo, spotlightHousingMat);
    baffle.name = `${fixtureName}.baffle`;
    baffle.position.set(0, 0.003, 0);
    fixture.add(baffle);

    const lens = new THREE.Mesh(lensGeo, spotLensMat);
    lens.name = `${fixtureName}.emitter`;
    lens.position.set(0, -0.002, 0);
    setInteractiveTreeUserData(lens, fixture.userData as InteractiveUserData);
    ctx.interactiveMeshes.push(lens);
    fixture.add(lens);

    groundCeilingGroup.add(fixture);

    // Downward warm PointLight on groundGroup so it illuminates the room even when ceiling cutaway is active
    const ptLight = new THREE.PointLight(0xffcb88, 6.5, 5.2, 1.8);
    ptLight.name = `${fixtureName}.pointLight`;
    ptLight.position.set(u, stableGroundTopY - 0.16, v);
    groundGroup.add(ptLight);
    spotGroup.lights.push(ptLight);
  });

  // 2. Four Aged-Brass & Fluted-Glass Wall Sconces in Empty Office (`stableOfficeWallsAndLamps5A`)
  const wallLightMat = new THREE.MeshStandardMaterial({
    color: 0xfff3dc,
    emissive: new THREE.Color(0xffaa44),
    emissiveIntensity: 2.2,
    roughness: 0.2,
    transparent: true,
    opacity: 0.9,
  });
  wallAndLampGroup.emissives.push(wallLightMat);

  const wallSconceConfigs: ReadonlyArray<{
    readonly idx: number;
    readonly u: number;
    readonly v: number;
    readonly rotY: number;
    readonly label: string;
  }> = [
    { idx: 1, u: 25.4, v: 0.292, rotY: 0, label: 'Office North-West Wall Light' },
    { idx: 2, u: 29.1, v: 0.292, rotY: 0, label: 'Office North-East Wall Light' },
    { idx: 3, u: 27.8, v: 5.418, rotY: Math.PI, label: 'Office South Wall Light' },
    { idx: 4, u: 24.865, v: 4.68, rotY: Math.PI / 2, label: 'Office Cloakroom Partition Wall Light' },
  ];

  const sconceBackplateGeo = new THREE.BoxGeometry(0.075, 0.22, 0.012);
  sconceBackplateGeo.computeBoundingSphere();
  const sconceShadeGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.24, 16);
  sconceShadeGeo.computeBoundingSphere();
  const sconceCapGeo = new THREE.CylinderGeometry(0.046, 0.046, 0.012, 16);
  sconceCapGeo.computeBoundingSphere();

  for (const cfg of wallSconceConfigs) {
    const sconceName = `outbuildings.stable.office.wallLight.${cfg.idx}`;
    const sconceGroup = new THREE.Group();
    sconceGroup.name = sconceName;
    const uData: InteractiveUserData = {
      circuitId: 'stableOfficeWallsAndLamps5A',
      switchPa: '2.1.14',
      switchLocation: cfg.label,
    };
    sconceGroup.userData = { zone: 'outbuildingStableOffice', ...uData };
    sconceGroup.position.set(cfg.u, stableGroundFloorY + 1.62, cfg.v);
    sconceGroup.rotation.y = cfg.rotY;

    const backplate = new THREE.Mesh(sconceBackplateGeo, spotlightBrassTrimMat);
    backplate.name = `${sconceName}.backplate`;
    backplate.position.set(0, 0, 0.006);
    setInteractiveTreeUserData(backplate, uData);
    ctx.interactiveMeshes.push(backplate);
    sconceGroup.add(backplate);

    const glassShade = new THREE.Mesh(sconceShadeGeo, wallLightMat);
    glassShade.name = `${sconceName}.flutedShade`;
    glassShade.position.set(0, 0, 0.068);
    setInteractiveTreeUserData(glassShade, uData);
    ctx.interactiveMeshes.push(glassShade);
    sconceGroup.add(glassShade);

    for (const [capTag, cy] of [
      ['topRing', 0.122],
      ['bottomRing', -0.122],
    ] as const) {
      const cap = new THREE.Mesh(sconceCapGeo, spotlightBrassTrimMat);
      cap.name = `${sconceName}.${capTag}`;
      cap.position.set(0, cy, 0.068);
      sconceGroup.add(cap);
    }

    const sconceLight = new THREE.PointLight(0xffb866, 3.8, 3.8, 1.9);
    sconceLight.name = `${sconceName}.pointLight`;
    sconceLight.position.set(0, 0, 0.12);
    sconceGroup.add(sconceLight);
    wallAndLampGroup.lights.push(sconceLight);

    groundGroup.add(sconceGroup);
  }

  // 3. Empty Office SE Corner Aged-Brass Floor Reading Lamp (`outbuildings.stable.office.floorLamp`)
  // Connected via 3D braided cord to Corston 5V/5A Lamp Socket at `(30.92, 0.01, 5.426)`
  const officeFloorLamp = new THREE.Group();
  officeFloorLamp.name = 'outbuildings.stable.office.floorLamp';
  const officeLampData: InteractiveUserData = {
    circuitId: 'stableOfficeWallsAndLamps5A',
    switchPa: '2.1.14',
    switchLocation: 'Office 5V Floor Lamp',
  };
  officeFloorLamp.userData = { zone: 'outbuildingStableOffice', ...officeLampData };
  officeFloorLamp.position.set(30.85, stableGroundFloorY, 4.88);

  const floorBaseGeo = new THREE.CylinderGeometry(0.15, 0.16, 0.022, 22);
  floorBaseGeo.computeBoundingSphere();
  const floorBase = new THREE.Mesh(floorBaseGeo, spotlightBrassTrimMat);
  floorBase.name = 'outbuildings.stable.office.floorLamp.base';
  floorBase.position.set(0, 0.011, 0);
  floorBase.castShadow = true;
  officeFloorLamp.add(floorBase);

  const floorStemGeo = new THREE.CylinderGeometry(0.012, 0.014, 1.38, 14);
  floorStemGeo.computeBoundingSphere();
  const floorStem = new THREE.Mesh(floorStemGeo, spotlightBrassTrimMat);
  floorStem.name = 'outbuildings.stable.office.floorLamp.stem';
  floorStem.position.set(0, 0.7, 0);
  floorStem.castShadow = true;
  officeFloorLamp.add(floorStem);

  const floorShadeGeo = new THREE.CylinderGeometry(0.16, 0.22, 0.28, 24, 1, true);
  floorShadeGeo.computeBoundingSphere();
  const floorShade = new THREE.Mesh(floorShadeGeo, wallLightMat);
  floorShade.name = 'outbuildings.stable.office.floorLamp.shade';
  floorShade.position.set(0, 1.42, 0);
  setInteractiveTreeUserData(floorShade, officeLampData);
  ctx.interactiveMeshes.push(floorShade);
  officeFloorLamp.add(floorShade);

  const officeLampLight = new THREE.PointLight(0xffb866, 4.5, 4.2, 1.8);
  officeLampLight.name = 'outbuildings.stable.office.floorLamp.pointLight';
  officeLampLight.position.set(0, 1.38, 0);
  officeFloorLamp.add(officeLampLight);
  wallAndLampGroup.lights.push(officeLampLight);

  groundGroup.add(officeFloorLamp);

  // 4. Main Barn Corner Bar Counter Lamp (`outbuildings.barn.cornerBar.counterLamp`)
  // Connected via 3D braided cord to Corston 5V/5A Lamp Socket at `(22.52, -0.22, 0.284)`
  const barnBarLampMat = new THREE.MeshStandardMaterial({
    color: 0xfff2d8,
    emissive: new THREE.Color(0xffa838),
    emissiveIntensity: 2.2,
    roughness: 0.24,
  });
  barnLampGroup.emissives.push(barnBarLampMat);

  const barLamp = new THREE.Group();
  barLamp.name = 'outbuildings.barn.cornerBar.counterLamp';
  const barLampData: InteractiveUserData = {
    circuitId: 'barnBarsAndLamps5A',
    switchPa: '2.1.12',
    switchLocation: 'Barn Corner Bar 5V Lamp',
  };
  barLamp.userData = { zone: 'outbuildingBarn', ...barLampData };
  barLamp.position.set(22.58, barnCarpetTopY + 1.06, 0.62);

  const barBaseGeo = new THREE.CylinderGeometry(0.065, 0.075, 0.16, 18);
  barBaseGeo.computeBoundingSphere();
  const barBase = new THREE.Mesh(barBaseGeo, spotlightBrassTrimMat);
  barBase.name = 'outbuildings.barn.cornerBar.counterLamp.base';
  barBase.position.set(0, 0.08, 0);
  barBase.castShadow = true;
  barLamp.add(barBase);

  const barShadeGeo = new THREE.CylinderGeometry(0.085, 0.125, 0.16, 20);
  barShadeGeo.computeBoundingSphere();
  const barShade = new THREE.Mesh(barShadeGeo, barnBarLampMat);
  barShade.name = 'outbuildings.barn.cornerBar.counterLamp.shade';
  barShade.position.set(0, 0.24, 0);
  setInteractiveTreeUserData(barShade, barLampData);
  ctx.interactiveMeshes.push(barShade);
  barLamp.add(barShade);

  const barLampLight = new THREE.PointLight(0xffb454, 3.6, 3.5, 1.9);
  barLampLight.name = 'outbuildings.barn.cornerBar.counterLamp.pointLight';
  barLampLight.position.set(0, 0.24, 0);
  barLamp.add(barLampLight);
  barnLampGroup.lights.push(barLampLight);

  groundGroup.add(barLamp);
}

/**
 * Places all 19 Single-Gang Corston Antique Brass Toggle Switches (`buildRoomCorstonToggleSwitch`)
 * at logical doorway/bedside locations across the 6 Outbuilding zones (`PA 2.1.10` .. `2.1.15`).
 *
 * Each switch follows the universal Kitchen switch principle:
 * - Short press (`▲` / `▼`): cycles through the zone's 3 KNX scenes (`S1` / `S2` / `S3`)
 * - Long press hold (`>= 600ms` `▲` or `▼`): switches all lights in that zone OFF (`0%`).
 */
function buildOutbuildingCorstonZoneSwitches(s: OutbuildingShellContext): void {
  const { ctx, groundGroup, firstFloorGroup } = s;

  const switchPlacements: ReadonlyArray<{
    readonly customUnitName: string;
    readonly zoneId: RoomZoneId;
    readonly circuitId: CircuitId;
    readonly switchPa: string;
    readonly switchLocation: string;
    readonly u: number;
    readonly y: number;
    readonly v: number;
    readonly facing: 'north' | 'south' | 'east' | 'west';
    readonly isFirstFloor?: boolean;
  }> = [
    // 1. Outbuilding Gym (PA 2.1.10 · S1 Peak Workout / S2 Stretch & Recovery / S3 Warm Cove)
    {
      customUnitName: 'outbuildings.gym.knxSwitch.courtyardEntry',
      zoneId: 'outbuildingGym',
      circuitId: 'gymSpotsAndBattens',
      switchPa: '2.1.10',
      switchLocation: 'Gym Courtyard Entry',
      u: 1.98,
      y: 0.87,
      v: 0.292,
      facing: 'south',
    },
    {
      customUnitName: 'outbuildings.gym.knxSwitch.showerDoor',
      zoneId: 'outbuildingGym',
      circuitId: 'gymSpotsAndBattens',
      switchPa: '2.1.10',
      switchLocation: 'Gym Shower Door',
      u: 5.758,
      y: 0.87,
      v: 3.98,
      facing: 'west',
    },

    // 2. Outbuilding Garage, Workshop, Shower & Store (PA 2.1.11 · S1 Workshop Bright / S2 Showroom / S3 Night Security)
    {
      customUnitName: 'outbuildings.garage.knxSwitch.courtyardWestPier',
      zoneId: 'outbuildingGarage',
      circuitId: 'garageHighBayLights',
      switchPa: '2.1.11',
      switchLocation: 'Garage West Bay Entry',
      u: 6.32,
      y: 0.86,
      v: 0.292,
      facing: 'south',
    },
    {
      customUnitName: 'outbuildings.garage.knxSwitch.workbenchEntry',
      zoneId: 'outbuildingGarage',
      circuitId: 'garageHighBayLights',
      switchPa: '2.1.11',
      switchLocation: 'Garage Workbench Entry',
      u: 11.78,
      y: 0.86,
      v: 0.292,
      facing: 'south',
    },
    {
      customUnitName: 'outbuildings.garage.knxSwitch.showerEntry',
      zoneId: 'outbuildingGarage',
      circuitId: 'garageBenchAndShower',
      switchPa: '2.1.11',
      switchLocation: 'Garage Shower Entry',
      u: 7.42,
      y: 0.86,
      v: 3.928,
      facing: 'north',
    },
    {
      customUnitName: 'outbuildings.garage.knxSwitch.storeEntry',
      zoneId: 'outbuildingGarage',
      circuitId: 'garageHighBayLights',
      switchPa: '2.1.11',
      switchLocation: 'Garden Store Entry',
      u: 12.68,
      y: 0.86,
      v: 0.292,
      facing: 'south',
    },

    // 3. Main Barn — Golf Simulator, Pool & Bars (PA 2.1.12 · S1 Sim & Social / S2 Club Night / S3 After-Hours Bar)
    {
      customUnitName: 'outbuildings.barn.knxSwitch.northCourtyardDoor',
      zoneId: 'outbuildingBarn',
      circuitId: 'barnTrussAndSimHalo',
      switchPa: '2.1.12',
      switchLocation: 'Barn Courtyard Door',
      u: 17.02,
      y: 0.86,
      v: 0.292,
      facing: 'south',
    },
    {
      customUnitName: 'outbuildings.barn.knxSwitch.golfSimConsole',
      zoneId: 'outbuildingBarn',
      circuitId: 'barnTrussAndSimHalo',
      switchPa: '2.1.12',
      switchLocation: 'Barn Golf Sim Console',
      u: 16.42,
      y: 0.86,
      v: 5.418,
      facing: 'north',
    },
    {
      customUnitName: 'outbuildings.barn.knxSwitch.sunkenSteps',
      zoneId: 'outbuildingBarn',
      circuitId: 'barnBarsAndLamps5A',
      switchPa: '2.1.12',
      switchLocation: 'Barn Sunken Steps',
      u: 18.82,
      y: 0.525,
      v: 0.292,
      facing: 'south',
    },
    {
      customUnitName: 'outbuildings.barn.knxSwitch.spiralStairBase',
      zoneId: 'outbuildingBarn',
      circuitId: 'barnBarsAndLamps5A',
      switchPa: '2.1.12',
      switchLocation: 'Barn Spiral Stair Base',
      u: 20.92,
      y: 0.525,
      v: 5.418,
      facing: 'north',
    },
    {
      customUnitName: 'outbuildings.barn.knxSwitch.stableDoorway',
      zoneId: 'outbuildingBarn',
      circuitId: 'barnBarsAndLamps5A',
      switchPa: '2.1.12',
      switchLocation: 'Barn-to-Office Door',
      u: 23.008,
      y: 0.525,
      v: 1.62,
      facing: 'west',
    },

    // 4. Barn Mezzanine Retro Lounge (PA 2.1.13 · S1 Retro Lounge / S2 CRT Movie & Game / S3 Reading Lamps)
    {
      customUnitName: 'outbuildings.mezzanine.knxSwitch.spiralLanding',
      zoneId: 'outbuildingMezzanine',
      circuitId: 'mezzanineSconcesAndAmbient',
      switchPa: '2.1.13',
      switchLocation: 'Mezzanine Spiral Landing',
      u: 20.92,
      y: 2.74,
      v: 5.418,
      facing: 'north',
      isFirstFloor: true,
    },
    {
      customUnitName: 'outbuildings.mezzanine.knxSwitch.stableUpperDoor',
      zoneId: 'outbuildingMezzanine',
      circuitId: 'mezzanineLamps5A',
      switchPa: '2.1.13',
      switchLocation: 'Mezzanine-to-Suite Steps',
      u: 23.008,
      y: 2.74,
      v: 3.12,
      facing: 'west',
      isFirstFloor: true,
    },

    // 5. Stable Ground — Empty Office Space & Cloakroom WC (PA 2.1.14 · S1 Bright Workday / S2 Warm Studio / S3 Evening Wall & 5V Lamps)
    {
      customUnitName: 'outbuildings.stable.office.knxSwitch.barnConnectingDoor',
      zoneId: 'outbuildingStableOffice',
      circuitId: 'stableOfficeSpotlights',
      switchPa: '2.1.14',
      switchLocation: 'Office West Door (Barn)',
      u: 23.232,
      y: 0.76,
      v: 1.62,
      facing: 'east',
    },
    {
      customUnitName: 'outbuildings.stable.office.knxSwitch.northCourtyardDoor',
      zoneId: 'outbuildingStableOffice',
      circuitId: 'stableOfficeSpotlights',
      switchPa: '2.1.14',
      switchLocation: 'Office Courtyard Door',
      u: 27.68,
      y: 0.76,
      v: 0.292,
      facing: 'south',
    },
    {
      customUnitName: 'outbuildings.stable.office.knxSwitch.cloakroomDoor',
      zoneId: 'outbuildingStableOffice',
      circuitId: 'stableOfficeWallsAndLamps5A',
      switchPa: '2.1.14',
      switchLocation: 'Office Cloakroom WC Door',
      u: 23.46,
      y: 0.76,
      v: 3.928,
      facing: 'north',
    },

    // 6. Stable Upper Guest Bedroom, Ensuite & Balcony (PA 2.1.15 · S1 Suite Bright / S2 Evening Relax / S3 Bedtime 5V Lamps)
    {
      customUnitName: 'outbuildings.stable.upper.knxSwitch.entryDoor',
      zoneId: 'outbuildingStableSuite',
      circuitId: 'stableSuiteDownlights',
      switchPa: '2.1.15',
      switchLocation: 'Guest Suite Entry Door',
      u: 23.232,
      y: 3.28,
      v: 3.12,
      facing: 'east',
      isFirstFloor: true,
    },
    {
      customUnitName: 'outbuildings.stable.upper.knxSwitch.bedsideMaster',
      zoneId: 'outbuildingStableSuite',
      circuitId: 'stableSuiteLamps5A',
      switchPa: '2.1.15',
      switchLocation: 'Guest Suite Bedside Master',
      u: 26.22,
      y: 2.86,
      v: 5.418,
      facing: 'north',
      isFirstFloor: true,
    },
    {
      customUnitName: 'outbuildings.stable.upper.knxSwitch.balconyBifolds',
      zoneId: 'outbuildingStableSuite',
      circuitId: 'stableSuiteDownlights',
      switchPa: '2.1.15',
      switchLocation: 'Guest Suite Balcony Doors',
      u: 29.708,
      y: 3.28,
      v: 1.05,
      facing: 'west',
      isFirstFloor: true,
    },
  ];

  for (const sw of switchPlacements) {
    const unit = buildRoomCorstonToggleSwitch(ctx, {
      customUnitName: sw.customUnitName,
      circuitId: sw.circuitId,
      zoneSceneSwitchZoneId: sw.zoneId,
      switchPa: sw.switchPa,
      switchLocation: sw.switchLocation,
      x: sw.u,
      y: sw.y,
      z: sw.v,
      facing: sw.facing,
      parentGroup: sw.isFirstFloor ? firstFloorGroup : groundGroup,
    });
    unit.userData = { ...unit.userData, zone: sw.zoneId };
  }
}

/**
 * Installs Corston 5V / 5A Round-Pin Lamp Sockets (`buildCorstonPowerSocket`) across all Outbuilding
 * rooms and connects every freestanding floor lamp, table lamp, bedside lamp, dressing lamp, and
 * counter lamp via continuous 3D braided silk cords (`cordWaypoints`).
 */
function buildOutbuilding5VLampSocketsAndCords(s: OutbuildingShellContext): void {
  const { ctx, groundGroup, firstFloorGroup } = s;

  const groundSocketCtx: SceneBuilderContext = {
    ...ctx,
    scene: groundGroup as unknown as THREE.Scene,
  };
  const firstFloorSocketCtx: SceneBuilderContext = {
    ...ctx,
    scene: firstFloorGroup as unknown as THREE.Scene,
  };
  const noopCutaway = (_obj: THREE.Object3D, _desc: CutawayWallDescriptor): void => {};

  // A. Ground Floor Outbuilding 5V / 5A Lamp Sockets (Main Barn & Stable Empty Office)
  const groundSockets: ReadonlyArray<CorstonSocketPlacement> = [
    // 1. Barn Corner Bar 5V/5A Lamp Socket -> connected to `outbuildings.barn.cornerBar.counterLamp`
    {
      name: 'outbuildings.barn.socket5A.cornerBarLamp',
      zone: 'outbuildingBarn',
      kind: 'singleWithLampSocket',
      x: 22.52,
      y: -0.22,
      z: 0.284,
      facing: 'south',
      connectedLamp: {
        circuitId: 'barnBarsAndLamps5A',
        switchPa: '2.1.12',
        switchLocation: 'Barn Corner Bar 5V Lamp Socket',
        cordWaypoints: [
          [22.575, -0.24, 0.296],
          [22.58, 0.18, 0.36],
          [22.58, 0.388, 0.62],
        ],
      },
    },
    // 2. Barn South Wall 5V/5A Lamp + 13A Double Socket near Viewing Bar
    {
      name: 'outbuildings.barn.socket5A.southViewingWall',
      zone: 'outbuildingBarn',
      kind: 'doubleWithLampSocket',
      x: 19.8,
      y: -0.22,
      z: 5.426,
      facing: 'north',
    },
    // 3. Empty Office SE Corner 5V/5A Lamp Socket -> connected to `outbuildings.stable.office.floorLamp`
    {
      name: 'outbuildings.stable.office.socket5A.seFloorLamp',
      zone: 'outbuildingStableOffice',
      kind: 'doubleWithLampSocket',
      x: 30.92,
      y: 0.01,
      z: 5.426,
      facing: 'north',
      connectedLamp: {
        circuitId: 'stableOfficeWallsAndLamps5A',
        switchPa: '2.1.14',
        switchLocation: 'Office SE 5V Lamp Socket',
        cordWaypoints: [
          [30.832, -0.01, 5.414],
          [30.84, -0.425, 5.36],
          [30.85, -0.425, 4.88],
        ],
      },
    },
    // 4. Empty Office North Wall 5V/5A Lamp + 13A Double Socket (for future desk/table lamp)
    {
      name: 'outbuildings.stable.office.socket5A.northWall',
      zone: 'outbuildingStableOffice',
      kind: 'doubleWithLampSocket',
      x: 25.6,
      y: 0.01,
      z: 0.284,
      facing: 'south',
    },
    // 5. Empty Office South Wall 5V/5A Lamp + 13A Double Socket (for future credenza/reading lamp)
    {
      name: 'outbuildings.stable.office.socket5A.southWall',
      zone: 'outbuildingStableOffice',
      kind: 'doubleWithLampSocket',
      x: 27.2,
      y: 0.01,
      z: 5.426,
      facing: 'north',
    },
  ];

  for (const placement of groundSockets) {
    buildCorstonPowerSocket(groundSocketCtx, noopCutaway, placement);
  }

  // B. First Floor Outbuilding 5V / 5A Lamp Sockets (Barn Mezzanine Lounge & Stable Upper Guest Suite)
  const firstFloorSockets: ReadonlyArray<CorstonSocketPlacement> = [
    // 1. Mezzanine NE Side Cabinet Table Lamp (`outbuildings.mezzanine.tableLamp` at `22.64, 2.08, 0.46`)
    {
      name: 'outbuildings.mezzanine.socket5A.tableLamp',
      zone: 'outbuildingMezzanine',
      kind: 'doubleWithLampSocket',
      x: 22.58,
      y: 1.84,
      z: 0.284,
      facing: 'south',
      connectedLamp: {
        circuitId: 'mezzanineLamps5A',
        switchPa: '2.1.13',
        switchLocation: 'Mezzanine NE Table Lamp 5V Socket',
        cordWaypoints: [
          [22.668, 1.82, 0.296],
          [22.64, 2.08, 0.34],
          [22.64, 2.082, 0.46],
        ],
      },
    },
    // 2. Mezzanine Bookcase Mathmos Lava Lamp (`outbuildings.mezzanine.lavaLamp.bookcase` at `22.18, 2.092, 0.45`)
    {
      name: 'outbuildings.mezzanine.socket5A.lavaLamp',
      zone: 'outbuildingMezzanine',
      kind: 'singleWithLampSocket',
      x: 22.12,
      y: 1.84,
      z: 0.284,
      facing: 'south',
      connectedLamp: {
        circuitId: 'mezzanineLamps5A',
        switchPa: '2.1.13',
        switchLocation: 'Mezzanine Bookcase 5V Lamp Socket',
        cordWaypoints: [
          [22.175, 1.82, 0.296],
          [22.18, 2.02, 0.35],
          [22.18, 2.092, 0.45],
        ],
      },
    },
    // 3. Mezzanine SW Corner Floor Reading Lamp (`outbuildings.mezzanine.floorTaskLamp` at `19.25, 1.54, 4.88`)
    {
      name: 'outbuildings.mezzanine.socket5A.floorTaskLamp',
      zone: 'outbuildingMezzanine',
      kind: 'doubleWithLampSocket',
      x: 19.32,
      y: 1.84,
      z: 5.426,
      facing: 'north',
      connectedLamp: {
        circuitId: 'mezzanineLamps5A',
        switchPa: '2.1.13',
        switchLocation: 'Mezzanine SW Floor Lamp 5V Socket',
        cordWaypoints: [
          [19.232, 1.82, 5.414],
          [19.24, 1.555, 5.36],
          [19.25, 1.555, 4.88],
        ],
      },
    },
    // 4. Mezzanine Teak Sideboard Anglepoise Task Lamp (`outbuildings.mezzanine.sideboardTaskLamp` at `19.16, 2.26, 3.04`)
    {
      name: 'outbuildings.mezzanine.socket5A.sideboardTaskLamp',
      zone: 'outbuildingMezzanine',
      kind: 'singleWithLampSocket',
      x: 19.16,
      y: 1.84,
      z: 3.52,
      facing: 'north',
      connectedLamp: {
        circuitId: 'mezzanineLamps5A',
        switchPa: '2.1.13',
        switchLocation: 'Mezzanine Sideboard 5V Lamp Socket',
        cordWaypoints: [
          [19.105, 1.82, 3.508],
          [19.14, 2.14, 3.28],
          [19.16, 2.262, 3.04],
        ],
      },
    },
    // 5. Stable Upper Bedroom West Bedside Table Lamp (`26.48, 2.664, 5.18`)
    {
      name: 'outbuildings.stable.upper.socket5A.bedsideWest',
      zone: 'outbuildingStableSuite',
      kind: 'doubleWithLampSocket',
      x: 26.4,
      y: 2.53,
      z: 5.426,
      facing: 'north',
      connectedLamp: {
        circuitId: 'stableSuiteLamps5A',
        switchPa: '2.1.15',
        switchLocation: 'Guest Suite West Bedside 5V Socket',
        cordWaypoints: [
          [26.312, 2.51, 5.414],
          [26.44, 2.66, 5.32],
          [26.48, 2.666, 5.18],
        ],
      },
    },
    // 6. Stable Upper Bedroom East Bedside Table Lamp (`28.38, 2.664, 5.18`)
    {
      name: 'outbuildings.stable.upper.socket5A.bedsideEast',
      zone: 'outbuildingStableSuite',
      kind: 'doubleWithLampSocket',
      x: 28.46,
      y: 2.53,
      z: 5.426,
      facing: 'north',
      connectedLamp: {
        circuitId: 'stableSuiteLamps5A',
        switchPa: '2.1.15',
        switchLocation: 'Guest Suite East Bedside 5V Socket',
        cordWaypoints: [
          [28.372, 2.51, 5.414],
          [28.38, 2.66, 5.32],
          [28.38, 2.666, 5.18],
        ],
      },
    },
    // 7. Stable Upper Bedroom Dressing Table Lamp (`28.02, 2.84, 0.50`)
    {
      name: 'outbuildings.stable.upper.socket5A.dressingTable',
      zone: 'outbuildingStableSuite',
      kind: 'doubleWithLampSocket',
      x: 27.94,
      y: 2.53,
      z: 0.284,
      facing: 'south',
      connectedLamp: {
        circuitId: 'stableSuiteLamps5A',
        switchPa: '2.1.15',
        switchLocation: 'Guest Suite Dressing Table 5V Socket',
        cordWaypoints: [
          [28.028, 2.51, 0.296],
          [28.02, 2.76, 0.34],
          [28.02, 2.842, 0.5],
        ],
      },
    },
  ];

  for (const placement of firstFloorSockets) {
    buildCorstonPowerSocket(firstFloorSocketCtx, noopCutaway, placement);
  }
}

/**
 * Traverses all Outbuilding scene groups (`groundGroup`, `groundCeilingGroup`, `firstFloorGroup`, `roofGroup`)
 * and binds existing PointLights, spotlights, sconces, LED coves, and 5V/5A lamps into `ctx.lightGroups[circuitId]`
 * so that toggling any Outbuilding KNX switch or scene dims/switches the 3D lighting live.
 */
function bindExistingOutbuildingLightsToKnxCircuits(s: OutbuildingShellContext): void {
  const { ctx, groundGroup, groundCeilingGroup, firstFloorGroup, roofGroup } = s;

  const classifyOutbuildingObjectCircuit = (obj: THREE.Object3D): CircuitId | null => {
    let curr: THREE.Object3D | null = obj;
    while (curr) {
      const n = curr.name || '';
      if (n.startsWith('outbuildings.stable.office.')) {
        if (n.includes('spotlight')) return 'stableOfficeSpotlights';
        if (n.includes('wallLight') || n.includes('floorLamp')) return 'stableOfficeWallsAndLamps5A';
      }
      if (n.startsWith('outbuildings.stable.groundCloakroom.')) {
        return 'stableOfficeWallsAndLamps5A';
      }
      if (
        n.startsWith('outbuildings.gym.ceilingSpotlight') ||
        n.startsWith('outbuildings.trusses.gym.')
      ) {
        return 'gymSpotsAndBattens';
      }
      if (n.startsWith('outbuildings.gym.')) {
        return 'gymWallAndCoveLights';
      }
      if (
        n.startsWith('outbuildings.trusses.garage.') ||
        n.startsWith('outbuildings.trusses.store.')
      ) {
        return 'garageHighBayLights';
      }
      if (n.startsWith('outbuildings.garage.')) {
        return 'garageBenchAndShower';
      }
      if (
        n.startsWith('outbuildings.trusses.barn.') ||
        n.startsWith('outbuildings.barn.golfSimulator.') ||
        n.startsWith('outbuildings.barn.mezzanineUndersideSpot')
      ) {
        return 'barnTrussAndSimHalo';
      }
      if (
        n.startsWith('outbuildings.barn.cornerBar.') ||
        n.startsWith('outbuildings.barn.golfViewingBar.') ||
        n.startsWith('outbuildings.barn.poolTable.') ||
        n.startsWith('outbuildings.barn.pictureLight')
      ) {
        return 'barnBarsAndLamps5A';
      }
      if (
        n.startsWith('outbuildings.mezzanine.tableLamp') ||
        n.startsWith('outbuildings.mezzanine.floorTaskLamp') ||
        n.startsWith('outbuildings.mezzanine.sideboardTaskLamp') ||
        n.startsWith('outbuildings.mezzanine.lavaLamp')
      ) {
        return 'mezzanineLamps5A';
      }
      if (n.startsWith('outbuildings.mezzanine.')) {
        return 'mezzanineSconcesAndAmbient';
      }
      if (
        n.startsWith('outbuildings.firstFloor.stableBedroom.bedsideLamp') ||
        n.startsWith('outbuildings.firstFloor.stableBedroom.dressingTable.lamp')
      ) {
        return 'stableSuiteLamps5A';
      }
      if (
        n.startsWith('outbuildings.firstFloor.stable') ||
        n.startsWith('outbuildings.trusses.stable.')
      ) {
        return 'stableSuiteDownlights';
      }
      curr = curr.parent;
    }
    return null;
  };

  const seenLights = new Set<THREE.Light>();
  const seenMaterials = new Set<THREE.MeshStandardMaterial>();
  for (const cid of Object.keys(ctx.lightGroups) as CircuitId[]) {
    const grp = ctx.lightGroups[cid];
    for (const l of grp.lights) seenLights.add(l);
    for (const m of grp.emissives) seenMaterials.add(m);
  }

  const interactiveLampRoots: ReadonlyArray<{
    readonly prefix: string;
    readonly circuitId: CircuitId;
    readonly switchPa: string;
    readonly label: string;
  }> = [
    {
      prefix: 'outbuildings.mezzanine.tableLamp',
      circuitId: 'mezzanineLamps5A',
      switchPa: '2.1.13',
      label: 'Mezzanine NE 5V Table Lamp',
    },
    {
      prefix: 'outbuildings.mezzanine.floorTaskLamp',
      circuitId: 'mezzanineLamps5A',
      switchPa: '2.1.13',
      label: 'Mezzanine SW 5V Floor Lamp',
    },
    {
      prefix: 'outbuildings.mezzanine.sideboardTaskLamp',
      circuitId: 'mezzanineLamps5A',
      switchPa: '2.1.13',
      label: 'Mezzanine Sideboard 5V Task Lamp',
    },
    {
      prefix: 'outbuildings.mezzanine.lavaLamp.bookcase',
      circuitId: 'mezzanineLamps5A',
      switchPa: '2.1.13',
      label: 'Mezzanine 5V Mathmos Lava Lamp',
    },
    {
      prefix: 'outbuildings.firstFloor.stableBedroom.bedsideLamp.1',
      circuitId: 'stableSuiteLamps5A',
      switchPa: '2.1.15',
      label: 'Guest Suite West 5V Bedside Lamp',
    },
    {
      prefix: 'outbuildings.firstFloor.stableBedroom.bedsideLamp.2',
      circuitId: 'stableSuiteLamps5A',
      switchPa: '2.1.15',
      label: 'Guest Suite East 5V Bedside Lamp',
    },
    {
      prefix: 'outbuildings.firstFloor.stableBedroom.dressingTable.lamp',
      circuitId: 'stableSuiteLamps5A',
      switchPa: '2.1.15',
      label: 'Guest Suite 5V Dressing Lamp',
    },
  ];

  for (const rootGroup of [groundGroup, groundCeilingGroup, firstFloorGroup, roofGroup]) {
    rootGroup.traverse((obj) => {
      const cid = classifyOutbuildingObjectCircuit(obj);
      if (!cid) return;
      const lg = ctx.lightGroups[cid];
      if (!lg) return;

      if (obj instanceof THREE.PointLight && !seenLights.has(obj)) {
        seenLights.add(obj);
        lg.lights.push(obj);
      } else if (obj instanceof THREE.Mesh) {
        const mat = obj.material;
        if (
          mat instanceof THREE.MeshStandardMaterial &&
          mat.emissiveIntensity > 0.35 &&
          !mat.emissiveMap &&
          !obj.name.includes('statusLed') &&
          !obj.name.includes('knxCoolingLed') &&
          !seenMaterials.has(mat)
        ) {
          seenMaterials.add(mat);
          lg.emissives.push(mat);
        }

        for (const lampSpec of interactiveLampRoots) {
          if (obj.name.startsWith(lampSpec.prefix)) {
            setInteractiveTreeUserData(obj, {
              circuitId: lampSpec.circuitId,
              switchPa: lampSpec.switchPa,
              switchLocation: lampSpec.label,
            });
            if (!ctx.interactiveMeshes.includes(obj)) {
              ctx.interactiveMeshes.push(obj);
            }
          }
        }
      }
    });
  }
}

/**
 * Master builder for Outbuilding M&E (Air-to-Air VRF AC Cooling, Garage Sub-Main & KNX Line 2.1 DB),
 * Empty Office Space spotlights & wall sconces, 19 Corston Single-Toggle Zone Scene Switches,
 * and 11 Corston 5V/5A Round-Pin Lamp Sockets with continuous 3D braided lamp cords.
 */
export function buildOutbuildingMepAndKnx(s: OutbuildingShellContext): void {
  const { groundGroup, firstFloorGroup } = s;

  // 1. Empty Office Space Spotlights + Wall Sconces + 5V Floor Lamp & Barn Bar 5V Lamp
  buildEmptyOfficeAndBarnCounterLighting(s);

  // 2. 19 Single-Gang Corston Toggle Switches across all 6 Outbuilding Zones
  buildOutbuildingCorstonZoneSwitches(s);

  // 3. 11 Corston 5V/5A Round-Pin Lamp Sockets & 3D Braided Cords to all Outbuilding Lamps
  buildOutbuilding5VLampSocketsAndCords(s);

  // 4. Air-to-Air VRF Multi-Split AC Cooling (Concealed Outdoor Condenser + 4 Indoor Wall Units)
  buildOutdoorVrfCondenserBank(groundGroup);
  groundGroup.add(
    buildIndoorAirToAirAcUnit(
      'outbuildings.gym.acUnit',
      3.0,
      1.98,
      5.41,
      Math.PI,
      'outbuildingGym'
    )
  );
  groundGroup.add(
    buildIndoorAirToAirAcUnit(
      'outbuildings.barn.acUnit',
      19.6,
      2.52,
      5.41,
      Math.PI,
      'outbuildingBarn'
    )
  );
  groundGroup.add(
    buildIndoorAirToAirAcUnit(
      'outbuildings.stable.office.acUnit',
      28.2,
      1.62,
      5.41,
      Math.PI,
      'outbuildingStableOffice'
    )
  );
  firstFloorGroup.add(
    buildIndoorAirToAirAcUnit(
      'outbuildings.stable.upper.acUnit',
      27.43,
      3.04,
      5.41,
      Math.PI,
      'outbuildingStableSuite'
    )
  );

  // 5. Garage Sub-Main Consumer Unit & KNX Line 2.1 DIN Enclosure (PA 2.1.1 / 2.1.20 / 2.1.30)
  buildGarageSubDistributionAndKnxBoard(groundGroup);

  // 6. Bind all existing Outbuilding PointLights & Emissive Fixtures to KNX Circuit Light Groups
  bindExistingOutbuildingLightsToKnxCircuits(s);
}
