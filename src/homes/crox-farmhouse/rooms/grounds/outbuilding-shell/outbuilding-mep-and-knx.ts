import * as THREE from 'three';
import type { CircuitId } from '../../../../../core/types/knx.ts';
import type { CutawayWallDescriptor, InteractiveUserData } from '../../../../../core/types/scene.ts';
import type { SceneBuilderContext } from '../../../../../engine/viewer/scene-types.ts';
import type { RoomZoneId } from '../../../../../core/types/topology.ts';
import {
  buildCorstonPowerSocket,
  type CorstonSocketPlacement,
} from '../../../../../objects/fixtures/corston-power-sockets.ts';
import { buildRoomCorstonToggleSwitch } from '../../ground/kitchen-utility/knx-wall-and-keypad-devices.ts';
import { croxPushButton } from '../../../knx/devices-placement.ts';
import type { OutbuildingShellContext } from './outbuilding-coords-and-materials.ts';
import { bindOutbuildingLightsToKnxCircuits } from './outbuilding-light-bindings.ts';

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
 * (`PA 2.1.1 / 2.1.20 / 2.1.30`) on the solid Store Corridor South Partition Wall (`u = 13.65m, v = 1.168m`),
 * facing North (`-v`) into the Store service corridor (`u = 12.31..14.96m, v = 0.28..1.18m`),
 * completely clear of the `v = 0.38..1.18m` Garage-to-Store pass-through doorway.
 */
function buildGarageSubDistributionAndKnxBoard(groundGroup: THREE.Group): void {
  const boardGroup = new THREE.Group();
  boardGroup.name = 'outbuildings.garage.mepSubBoard';
  boardGroup.userData = { zone: 'outbuildingGarage' };
  // Mounted inside the Garage on the East exterior wall of the Shower Room (`u = 8.922m, v = 4.45m`, facing East `+u`)
  // rather than in the Store corridor where it clipped the loft ladder (Issue #9)!
  boardGroup.position.set(8.922, 0.85, 4.45);
  boardGroup.rotation.y = Math.PI / 2; // Facing East (+u) into the Garage workshop bay


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
  const officeLampGroup = ctx.lightGroups.stableOfficeLamps5A;
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

  });

  // One shared warm fill PointLight for the six spots (each spot is emissive-only) on groundGroup so
  // it illuminates the room even when the ceiling cutaway is active — keeps the light budget flat.
  const officeSpotFill = new THREE.PointLight(0xffcb88, 6.5, 7.5, 1.6);
  officeSpotFill.name = 'outbuildings.stable.office.spotlight.fillLight';
  officeSpotFill.position.set(27.6, stableGroundTopY - 0.2, 2.7);
  groundGroup.add(officeSpotFill);
  spotGroup.lights.push(officeSpotFill);

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
    { idx: 3, u: 28.45, v: 5.418, rotY: Math.PI, label: 'Office South Wall Light' },
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

    // Sconces are emissive-only (fluted glass glows); the spot fill light carries the room.

    groundGroup.add(sconceGroup);
  }

  // 3. Empty Office SE Corner Aged-Brass Floor Reading Lamp (`outbuildings.stable.office.floorLamp`)
  // Connected via 3D braided cord to Corston 5V/5A Lamp Socket at `(30.92, 0.01, 5.426)`
  const officeFloorLamp = new THREE.Group();
  officeFloorLamp.name = 'outbuildings.stable.office.floorLamp';
  const officeLampData: InteractiveUserData = {
    circuitId: 'stableOfficeLamps5A',
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
  // Own material so the 5A lamp circuit dims independently of the wall sconces.
  const floorShadeMat = wallLightMat.clone();
  officeLampGroup.emissives.push(floorShadeMat);
  const floorShade = new THREE.Mesh(floorShadeGeo, floorShadeMat);
  floorShade.name = 'outbuildings.stable.office.floorLamp.shade';
  floorShade.position.set(0, 1.42, 0);
  setInteractiveTreeUserData(floorShade, officeLampData);
  ctx.interactiveMeshes.push(floorShade);
  officeFloorLamp.add(floorShade);

  const officeLampLight = new THREE.PointLight(0xffb866, 4.5, 4.2, 1.8);
  officeLampLight.name = 'outbuildings.stable.office.floorLamp.pointLight';
  officeLampLight.position.set(0, 1.38, 0);
  officeFloorLamp.add(officeLampLight);
  officeLampGroup.lights.push(officeLampLight);

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

  // Emissive-only: the corner bar's existing `cornerBar.light` PointLight lights the counter.

  groundGroup.add(barLamp);
}

/**
 * Guest suite vaulted-ceiling spots (`stableSuiteDownlights`): four brass surface cans fixed
 * square to the 27.6° plastered vault either side of the ridge (apex 4.666 m at v = 2.85 m,
 * 3.907 m at v = 1.4 m — measured), emissive-only plus one shared fill PointLight.
 */
function buildGuestSuiteVaultSpots(s: OutbuildingShellContext): void {
  const { ctx, firstFloorGroup, spotlightHousingMat, spotlightBrassTrimMat } = s;
  const group = ctx.lightGroups.stableSuiteDownlights;
  const RIDGE_V = 2.85;
  const APEX_Y = 4.666;
  const SLOPE = (APEX_Y - 3.907) / (RIDGE_V - 1.4);
  const tilt = Math.atan(SLOPE);

  const lensMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e4,
    emissive: new THREE.Color(0xffc27a),
    emissiveIntensity: 2.2,
    roughness: 0.2,
  });
  lensMat.userData = { ...lensMat.userData, baseEmissiveIntensity: 2.2 };
  group.emissives.push(lensMat);

  const canGeo = new THREE.CylinderGeometry(0.042, 0.046, 0.11, 18);
  canGeo.computeBoundingSphere();
  const roseGeo = new THREE.CylinderGeometry(0.055, 0.055, 0.012, 18);
  roseGeo.computeBoundingSphere();
  const lensGeo = new THREE.CylinderGeometry(0.034, 0.034, 0.004, 16);
  lensGeo.computeBoundingSphere();

  const spots: ReadonlyArray<readonly [number, number]> = [
    [26.6, 1.6],
    [28.0, 1.6],
    [26.6, 4.1],
    [28.0, 4.1],
  ];
  spots.forEach(([u, v], idx) => {
    const name = `outbuildings.firstFloor.stableBedroom.downlight.${idx + 1}`;
    const data: InteractiveUserData = {
      circuitId: 'stableSuiteDownlights',
      switchPa: '2.1.63',
      switchLocation: `Guest Suite Vault Spot ${idx + 1}`,
    };
    const fixture = new THREE.Group();
    fixture.name = name;
    fixture.userData = { zone: 'outbuildingStableSuite', ...data };
    const ceilingY = APEX_Y - SLOPE * Math.abs(v - RIDGE_V);
    fixture.position.set(u, ceilingY, v);
    // Axis square to the slope, aimed down-and-in towards the ridge.
    fixture.rotation.x = v < RIDGE_V ? -tilt : tilt;

    const rose = new THREE.Mesh(roseGeo, spotlightBrassTrimMat);
    rose.name = `${name}.rose`;
    rose.position.y = -0.006;
    fixture.add(rose);
    const can = new THREE.Mesh(canGeo, spotlightHousingMat);
    can.name = `${name}.can`;
    can.position.y = -0.067;
    setInteractiveTreeUserData(can, data);
    ctx.interactiveMeshes.push(can);
    fixture.add(can);
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.name = `${name}.emitter`;
    lens.position.y = -0.124;
    fixture.add(lens);
    firstFloorGroup.add(fixture);
  });

  const fill = new THREE.PointLight(0xffd6a0, 3.2, 6.5, 1.6);
  fill.name = 'outbuildings.firstFloor.stableBedroom.downlight.fillLight';
  fill.position.set(27.3, 3.7, RIDGE_V);
  fill.userData = { ...fill.userData, baseIntensity: 3.2 };
  firstFloorGroup.add(fill);
  group.lights.push(fill);
}

/**
 * Places all 25 Single-Gang Corston Antique Brass Toggle Switches (`buildRoomCorstonToggleSwitch`)
 * at ergonomic Part M heights (`1.15m` AFFL at doorways, `0.72m` AFFL over bedside tables) on the
 * latch/handle side of every entrance, pass-through, staircase landing, and bedside across all
 * 6 Outbuilding zones (`PA 2.1.10` .. `2.1.15`).
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
    // =========================================================================
    // 1. Outbuilding Gym (FFL = -0.588m -> 1.15m AFFL = y: 0.562m)
    //    PA 2.1.10 · S1 Peak Workout / S2 Stretch & Recovery / S3 Warm Cove
    // =========================================================================
    // 1A. Courtyard Glazed Coach Screen (`u = 3.05..5.45m`) — West pier (`u = 2.55m`, clear of `2.71..3.01m` pilaster)
    {
      customUnitName: 'outbuildings.gym.knxSwitch.courtyardEntry',
      zoneId: 'outbuildingGym',
      circuitId: 'gymSpotsAndBattens',
      switchPa: '2.1.10',
      switchLocation: 'Gym Courtyard Entry (West)',
      u: 2.55,
      y: 0.562,
      v: 0.292,
      facing: 'south',
    },
    // 1B. Courtyard Glazed Coach Screen — East pier (`u = 5.61m`, between `5.45m` screen & `5.77m` East wall)
    {
      customUnitName: 'outbuildings.gym.knxSwitch.courtyardEastPier',
      zoneId: 'outbuildingGym',
      circuitId: 'gymSpotsAndBattens',
      switchPa: '2.1.10',
      switchLocation: 'Gym Courtyard Entry (East)',
      u: 5.61,
      y: 0.562,
      v: 0.292,
      facing: 'south',
    },
    // 1C. Gym East Partition Pier (`v = 3.52..4.18m`) — Beside Gym-to-Garage Double Glass Doors (`v = 0.88..3.52m`)
    {
      customUnitName: 'outbuildings.gym.knxSwitch.garageGlassDoors',
      zoneId: 'outbuildingGym',
      circuitId: 'gymSpotsAndBattens',
      switchPa: '2.1.10',
      switchLocation: 'Gym-to-Garage Glass Doors',
      u: 5.758,
      y: 0.562,
      v: 3.72,
      facing: 'west',
    },
    // 1D. Gym East Partition Pier (`v = 3.52..4.18m`) — North (latch side) of Gym-to-Shower Oak Door (`v = 4.18..4.94m`)
    {
      customUnitName: 'outbuildings.gym.knxSwitch.showerDoor',
      zoneId: 'outbuildingGym',
      circuitId: 'gymWallAndCoveLights',
      switchPa: '2.1.10',
      switchLocation: 'Gym Shower Room Door',
      u: 5.758,
      y: 0.562,
      v: 4.02,
      facing: 'west',
    },

    // =========================================================================
    // 2. Outbuilding Garage, Workshop, Shower Room & Store
    //    (Garage FFL = -0.50m -> 1.15m AFFL = y: 0.65m; Store FFL = -0.34m -> y: 0.81m)
    //    PA 2.1.11 · S1 Workshop Bright / S2 Showroom / S3 Night Security
    // =========================================================================
    // 2A. Garage West Double Doors (`u = 6.24..8.88m`) — West brick pier (`u = 5.97..6.24m`)
    {
      customUnitName: 'outbuildings.garage.knxSwitch.courtyardWestPier',
      zoneId: 'outbuildingGarage',
      circuitId: 'garageHighBayLights',
      switchPa: '2.1.11',
      switchLocation: 'Garage West Bay Entry',
      u: 6.11,
      y: 0.65,
      v: 0.292,
      facing: 'south',
    },
    // 2B. Central Brick Pier (`u = 8.88..9.12m`) between West & East Double Garage Doors
    {
      customUnitName: 'outbuildings.garage.knxSwitch.centralCourtyardPier',
      zoneId: 'outbuildingGarage',
      circuitId: 'garageHighBayLights',
      switchPa: '2.1.11',
      switchLocation: 'Garage Central Bay Pier',
      u: 9.0,
      y: 0.65,
      v: 0.292,
      facing: 'south',
    },
    // 2C. Garage East Pier (`u = 11.76..12.07m`) — Serves East Double Garage Door & Store Pass-Through (`v = 0.38..1.18m`)
    {
      customUnitName: 'outbuildings.garage.knxSwitch.workbenchEntry',
      zoneId: 'outbuildingGarage',
      circuitId: 'garageHighBayLights',
      switchPa: '2.1.11',
      switchLocation: 'Garage East Bay & Pass-Through',
      u: 11.91,
      y: 0.65,
      v: 0.292,
      facing: 'south',
    },
    // 2D. Garage West Wall (`u = 5.982m`) — Immediately South of Gym-to-Garage Double Glass Doors (`v = 0.88..3.52m`)
    {
      customUnitName: 'outbuildings.garage.knxSwitch.gymGlassDoors',
      zoneId: 'outbuildingGarage',
      circuitId: 'garageHighBayLights',
      switchPa: '2.1.11',
      switchLocation: 'Garage-to-Gym Glass Doors',
      u: 5.982,
      y: 0.65,
      v: 3.68,
      facing: 'east',
    },
    // 2E. Inside Shower Room SW Entry Pier (`v = 4.94..5.43m`, immediately inside the `v = 4.18..4.94m` Shower Room Door)
    {
      customUnitName: 'outbuildings.garage.knxSwitch.showerEntry',
      zoneId: 'outbuildingGarage',
      circuitId: 'garageBenchAndShower',
      switchPa: '2.1.11',
      switchLocation: 'Shower & WC Room Entry',
      u: 5.982,
      y: 0.65,
      v: 5.14,
      facing: 'east',
    },
    // 2F. Garden Store Courtyard Door (`u = 12.85..13.75m`) — West latch jamb (`u = 12.64m`)
    {
      customUnitName: 'outbuildings.garage.knxSwitch.storeEntry',
      zoneId: 'outbuildingGarage',
      circuitId: 'garageHighBayLights',
      switchPa: '2.1.11',
      switchLocation: 'Garden Store Courtyard Door',
      u: 12.64,
      y: 0.81,
      v: 0.292,
      facing: 'south',
    },
    // 2G. Garden Store Corridor East End (`u = 14.78m, v = 1.168m`) — Before stepping through the Barn Portal (`u = 15.20m`)
    {
      customUnitName: 'outbuildings.garage.knxSwitch.storeBarnPortal',
      zoneId: 'outbuildingGarage',
      circuitId: 'garageHighBayLights',
      switchPa: '2.1.11',
      switchLocation: 'Store-to-Barn Corridor Portal',
      u: 14.78,
      y: 0.81,
      v: 1.168,
      facing: 'north',
    },

    // =========================================================================
    // 3. Main Barn — Golf Simulator, Pool & Bars
    //    (Upper Sim FFL = -0.34m -> y: 0.81m; Sunken Lounge FFL = -0.675m -> y: 0.475m)
    //    PA 2.1.12 · S1 Sim & Social / S2 Club Night / S3 After-Hours Bar
    // =========================================================================
    // 3A. Barn West Walkthrough Portal from Store Corridor (`u = 15.20m, v = 0.38..1.18m`)
    {
      customUnitName: 'outbuildings.barn.knxSwitch.storeCorridorEntry',
      zoneId: 'outbuildingBarn',
      circuitId: 'barnTrussAndSimHalo',
      switchPa: '2.1.12',
      switchLocation: 'Barn West Corridor Entry',
      u: 15.48,
      y: 0.81,
      v: 0.292,
      facing: 'south',
    },
    // 3B. Barn North Courtyard Door (`u = 15.85..16.85m`) — East latch jamb (`u = 17.04m`, clear of door swing)
    {
      customUnitName: 'outbuildings.barn.knxSwitch.northCourtyardDoor',
      zoneId: 'outbuildingBarn',
      circuitId: 'barnTrussAndSimHalo',
      switchPa: '2.1.12',
      switchLocation: 'Barn North Courtyard Door',
      u: 17.04,
      y: 0.81,
      v: 0.292,
      facing: 'south',
    },
    // 3C. Barn Golf Simulator Control Console & Viewing Bar Steps (`u = 18.02m, v = 5.418m` on South Wall)
    {
      customUnitName: 'outbuildings.barn.knxSwitch.golfSimConsole',
      zoneId: 'outbuildingBarn',
      circuitId: 'barnTrussAndSimHalo',
      switchPa: '2.1.12',
      switchLocation: 'Barn Golf Sim & Viewing Bar',
      u: 18.02,
      y: 0.81,
      v: 5.418,
      facing: 'north',
    },
    // 3D. Barn Sunken Pool Lounge North Wall (`u = 19.12m`, cleanly East of `u = 18.53..18.83m` brick pilaster)
    {
      customUnitName: 'outbuildings.barn.knxSwitch.sunkenSteps',
      zoneId: 'outbuildingBarn',
      circuitId: 'barnBarsAndLamps5A',
      switchPa: '2.1.12',
      switchLocation: 'Barn Sunken Steps (North)',
      u: 19.12,
      y: 0.475,
      v: 0.292,
      facing: 'south',
    },
    // 3E. Barn Spiral Staircase Base (`u = 20.92m, v = 5.418m`, right beside bottom tread of spiral stair)
    {
      customUnitName: 'outbuildings.barn.knxSwitch.spiralStairBase',
      zoneId: 'outbuildingBarn',
      circuitId: 'barnBarsAndLamps5A',
      switchPa: '2.1.12',
      switchLocation: 'Barn Spiral Stair Base',
      u: 20.92,
      y: 0.475,
      v: 5.418,
      facing: 'north',
    },
    // 3F. Barn-to-Office Glass Door (`v = 1.52..2.84m`) — South latch/handle side (`u = 23.008m, v = 3.02m`, clear of Corner Bar)
    {
      customUnitName: 'outbuildings.barn.knxSwitch.stableDoorway',
      zoneId: 'outbuildingBarn',
      circuitId: 'barnBarsAndLamps5A',
      switchPa: '2.1.12',
      switchLocation: 'Barn-to-Office Glass Door',
      u: 23.008,
      y: 0.475,
      v: 3.02,
      facing: 'west',
    },

    // =========================================================================
    // 4. Barn Mezzanine Retro Lounge (FFL = 1.54m -> 1.15m AFFL = y: 2.69m)
    //    PA 2.1.13 · S1 Retro Lounge / S2 CRT Movie & Game / S3 Reading Lamps
    // =========================================================================
    // 4A. East Partition Wall (`u = 23.008m, v = 2.32m`) — Immediately North of the `v = 2.554..3.554m` 3-step flight
    //     and directly reachable when stepping off the Spiral Staircase top landing (`u = 21.55m, v = 3.60m`)
    {
      customUnitName: 'outbuildings.mezzanine.knxSwitch.stableUpperDoor',
      zoneId: 'outbuildingMezzanine',
      circuitId: 'mezzanineSconcesAndAmbient',
      switchPa: '2.1.13',
      switchLocation: 'Mezzanine Stair Landing & Suite Steps',
      u: 23.008,
      y: 2.69,
      v: 2.32,
      facing: 'west',
      isFirstFloor: true,
    },
    // 4B. Mezzanine Retro Lounge South Wall (`u = 20.65m, v = 5.418m`) — Beside the L-shaped corduroy sofa
    {
      customUnitName: 'outbuildings.mezzanine.knxSwitch.spiralLanding',
      zoneId: 'outbuildingMezzanine',
      circuitId: 'mezzanineLamps5A',
      switchPa: '2.1.13',
      switchLocation: 'Mezzanine Retro Sofa Wall',
      u: 20.65,
      y: 2.69,
      v: 5.418,
      facing: 'north',
      isFirstFloor: true,
    },

    // =========================================================================
    // 5. Stable Ground — Empty Office Space & Cloakroom WC (FFL = -0.44m -> 1.15m AFFL = y: 0.71m)
    //    PA 2.1.14 · S1 Bright Workday / S2 Warm Studio / S3 Evening Wall & 5V Lamps
    // =========================================================================
    // 5A. Office West Glass Door from Barn (`v = 1.52..2.84m`) — South latch/handle side (`u = 23.232m, v = 3.02m`)
    {
      customUnitName: 'outbuildings.stable.office.knxSwitch.barnConnectingDoor',
      zoneId: 'outbuildingStableOffice',
      circuitId: 'stableOfficeSpotlights',
      switchPa: '2.1.14',
      switchLocation: 'Office West Door (Barn)',
      u: 23.232,
      y: 0.71,
      v: 3.02,
      facing: 'east',
    },
    // 5B. Office North Courtyard Door (`u = 23.80..24.70m`) — East latch jamb (`u = 24.92m, v = 0.292m`)
    {
      customUnitName: 'outbuildings.stable.office.knxSwitch.northCourtyardDoor',
      zoneId: 'outbuildingStableOffice',
      circuitId: 'stableOfficeSpotlights',
      switchPa: '2.1.14',
      switchLocation: 'Office North Courtyard Door',
      u: 24.92,
      y: 0.71,
      v: 0.292,
      facing: 'south',
    },
    // 5C. Office Cloakroom WC Door (`u = 23.62..24.38m`, hinged West) — East latch/handle side (`u = 24.54m, v = 3.928m`)
    {
      customUnitName: 'outbuildings.stable.office.knxSwitch.cloakroomDoor',
      zoneId: 'outbuildingStableOffice',
      circuitId: 'stableOfficeWallsAndLamps5A',
      switchPa: '2.1.14',
      switchLocation: 'Office Cloakroom WC Door',
      u: 24.54,
      y: 0.71,
      v: 3.928,
      facing: 'north',
    },
    // 5D. Office East Glazed Double Patio Doors (`u = 31.57m, v = 1.15..3.85m`) — North pier (`u = 31.558m, v = 0.92m`)
    {
      customUnitName: 'outbuildings.stable.office.knxSwitch.eastPatioDoors',
      zoneId: 'outbuildingStableOffice',
      circuitId: 'stableOfficeSpotlights',
      switchPa: '2.1.14',
      switchLocation: 'Office East Patio Doors',
      u: 31.558,
      y: 0.71,
      v: 0.92,
      facing: 'west',
    },

    // =========================================================================
    // 6. Stable Upper Guest Bedroom, Ensuite & Balcony
    //    (FFL = 2.08m -> Doorways 1.15m AFFL = y: 3.23m; Bedside 0.72m AFFL = y: 2.80m)
    //    PA 2.1.15 · S1 Suite Bright / S2 Evening Relax / S3 Bedtime 5V Lamps
    // =========================================================================
    // 6A. Suite West Entry Portal from Mezzanine (`v = 2.405..3.305m`, centered at `v = 2.855m`) — mounted beside the entry steps (`u = 23.42m, v = 3.358m`)
    {
      customUnitName: 'outbuildings.stable.upper.knxSwitch.entryDoor',
      zoneId: 'outbuildingStableSuite',
      circuitId: 'stableSuiteDownlights',
      switchPa: '2.1.15',
      switchLocation: 'Guest Suite Entry Portal',
      u: 23.42,
      y: 3.23,
      v: 3.358,
      facing: 'north',
      isFirstFloor: true,
    },
    // 6B. Suite Ensuite Bathroom Door (`u = 24.62..25.38m, v = 3.37m`, hinged West) — East handle side (`u = 25.54m, v = 3.358m`)
    {
      customUnitName: 'outbuildings.stable.upper.knxSwitch.ensuiteDoor',
      zoneId: 'outbuildingStableSuite',
      circuitId: 'stableSuiteDownlights',
      switchPa: '2.1.15',
      switchLocation: 'Guest Suite Ensuite Door',
      u: 25.54,
      y: 3.23,
      v: 3.358,
      facing: 'north',
      isFirstFloor: true,
    },
    // 6C. Super-King Bed West Nightstand Master Toggle (`u = 26.24m, y = 2.80m, v = 5.418m`, clear of `26.09m` Ensuite wall)
    {
      customUnitName: 'outbuildings.stable.upper.knxSwitch.bedsideMaster',
      zoneId: 'outbuildingStableSuite',
      circuitId: 'stableSuiteLamps5A',
      switchPa: '2.1.15',
      switchLocation: 'Guest Suite Bedside (West)',
      u: 26.24,
      y: 2.8,
      v: 5.418,
      facing: 'north',
      isFirstFloor: true,
    },
    // 6D. Super-King Bed East Nightstand Companion Toggle (`u = 28.58m, y = 2.80m, v = 5.418m`)
    {
      customUnitName: 'outbuildings.stable.upper.knxSwitch.bedsideEast',
      zoneId: 'outbuildingStableSuite',
      circuitId: 'stableSuiteLamps5A',
      switchPa: '2.1.15',
      switchLocation: 'Guest Suite Bedside (East)',
      u: 28.58,
      y: 2.8,
      v: 5.418,
      facing: 'north',
      isFirstFloor: true,
    },
    // 6E. East Gable Sliding Balcony Doors (`u = 28.77m, v = 0.68..5.03m`) — Interior North corner pier (`u = 28.758m, v = 0.48m`)
    {
      customUnitName: 'outbuildings.stable.upper.knxSwitch.balconyBifolds',
      zoneId: 'outbuildingStableSuite',
      circuitId: 'stableSuiteDownlights',
      switchPa: '2.1.15',
      switchLocation: 'Guest Suite Balcony Doors',
      u: 28.758,
      y: 3.23,
      v: 0.48,
      facing: 'west',
      isFirstFloor: true,
    },
  ];


  // Each placement is its own KNX push-button device: 2.1.40 … 2.1.67 in this order
  // (CROX_PUSH_BUTTONS), which supplies the gangs (multi-gang plates at pass-throughs).
  // Doorway plates sit at ~1.05 m AFFL (authored y is 1.15 m AFFL); bedside plates stay put.
  const FIRST_OUTBUILDING_PLATE = 40;
  const DOORWAY_DROP_M = 0.1;
  switchPlacements.forEach((sw, i) => {
    const devicePa = `2.1.${FIRST_OUTBUILDING_PLATE + i}`;
    const isBedside = sw.customUnitName.includes('bedside');
    const unit = buildRoomCorstonToggleSwitch(ctx, {
      customUnitName: sw.customUnitName,
      circuitId: sw.circuitId,
      zoneSceneSwitchZoneId: sw.zoneId,
      switchPa: sw.switchPa,
      devicePa,
      switchLocation: sw.switchLocation,
      x: sw.u,
      y: isBedside ? sw.y : sw.y - DOORWAY_DROP_M,
      z: sw.v,
      facing: sw.facing,
      parentGroup: sw.isFirstFloor ? firstFloorGroup : groundGroup,
    });
    unit.userData = { ...unit.userData, zone: croxPushButton(devicePa)?.mountedInZoneId ?? sw.zoneId };
  });
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

  bindOutbuildingLightsToKnxCircuits(ctx, [groundGroup, groundCeilingGroup, firstFloorGroup, roofGroup]);

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
      if (obj instanceof THREE.Mesh) {
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
 * Master builder for Outbuilding M&E (Air-to-Air VRF AC Cooling, Store Sub-Main & KNX Line 2.1 DB),
 * Empty Office Space spotlights & wall sconces, 25 Corston Single-Toggle Zone Scene Switches,
 * and 11 Corston 5V/5A Round-Pin Lamp Sockets with continuous 3D braided lamp cords.
 */
export function buildOutbuildingMepAndKnx(s: OutbuildingShellContext): void {
  const { groundGroup, firstFloorGroup } = s;

  // 1. Empty Office Space Spotlights + Wall Sconces + 5V Floor Lamp & Barn Bar 5V Lamp
  buildEmptyOfficeAndBarnCounterLighting(s);
  buildGuestSuiteVaultSpots(s);

  // 2. 25 Single-Gang Corston Toggle Switches across all 6 Outbuilding Zones
  buildOutbuildingCorstonZoneSwitches(s);

  // 3. 11 Corston 5V/5A Round-Pin Lamp Sockets & 3D Braided Cords to all Outbuilding Lamps
  buildOutbuilding5VLampSocketsAndCords(s);

  // 4. Air-to-Air VRF Multi-Split AC Cooling (Concealed Outdoor Condenser + 5 Indoor Wall Units)
  buildOutdoorVrfCondenserBank(groundGroup);
  groundGroup.add(
    buildIndoorAirToAirAcUnit(
      'outbuildings.gym.acUnit',
      5.75,
      1.92,
      2.2,
      -Math.PI / 2,
      'outbuildingGym'
    )
  );
  groundGroup.add(
    buildIndoorAirToAirAcUnit(
      'outbuildings.barn.acUnit',
      17.35,
      2.48,
      0.29,
      0,
      'outbuildingBarn'
    )
  );
  firstFloorGroup.add(
    buildIndoorAirToAirAcUnit(
      'outbuildings.mezzanine.acUnit',
      20.2,
      2.58,
      5.41,
      Math.PI,
      'outbuildingMezzanine'
    )
  );
  groundGroup.add(
    buildIndoorAirToAirAcUnit(
      'outbuildings.stable.office.acUnit',
      29.55,
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

  // 5. Outbuilding Sub-Main Consumer Unit & KNX Line 2.1 DIN Enclosure (PA 2.1.1 / 2.1.20 / 2.1.30)
  buildGarageSubDistributionAndKnxBoard(groundGroup);

  // 6. Bind all existing Outbuilding PointLights & Emissive Fixtures to KNX Circuit Light Groups
  bindExistingOutbuildingLightsToKnxCircuits(s);
}

