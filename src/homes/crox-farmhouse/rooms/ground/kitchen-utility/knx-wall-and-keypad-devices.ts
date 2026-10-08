import * as THREE from 'three';
import type { CircuitId } from '../../../../../core/types/knx.ts';
import { CIRCUITS } from '../../../../../integrations/knx/constants.ts';
import type { RoomZoneId } from '../../../../../core/types/topology.ts';
import type {
  CutawayWallDescriptor,
  InteractiveUserData,
  SceneBuilderContext,
} from '../../../../../core/types/scene.ts';
import { buildRoomKnxTempSensor } from '../../../../../objects/fixtures/knx-temp-sensor.ts';
import {
  buildRoomCeilingPendant,
  sharedRoomBrassMat,
  sharedRoomCollarMat,
} from './knx-ceiling-and-track-lights.ts';

function prepGeo<T extends THREE.BufferGeometry>(geo: T): T {
  geo.computeBoundingSphere();
  return geo;
}

function tagHighLod(obj: THREE.Object3D, maxDistance = 14): void {
  obj.userData.lodTier = 'high';
  obj.userData.lodMaxDistance = maxDistance;
}

function setInteractiveUserData(mesh: THREE.Object3D, data: InteractiveUserData): void {
  Object.assign(mesh.userData, data);
}

// ============================================================================
// Shared BufferGeometries for Corston Switches & KNX Motion Sensors
// ============================================================================
const sharedSingleGangBackplateGeo = prepGeo(new THREE.BoxGeometry(0.088, 0.088, 0.005));
const sharedDoubleGangBackplateGeo = prepGeo(new THREE.BoxGeometry(0.146, 0.088, 0.005));
const sharedSingleHalfPlateGeo = prepGeo(new THREE.BoxGeometry(0.078, 0.039, 0.004));
const sharedDoubleHalfPlateGeo = prepGeo(new THREE.BoxGeometry(0.064, 0.039, 0.004));
const sharedSwitchCollarRingGeo = prepGeo(
  new THREE.CylinderGeometry(0.0115, 0.013, 0.007, 16)
);
const sharedSwitchPivotDomeGeo = prepGeo(new THREE.SphereGeometry(0.0075, 10, 10));
const sharedSwitchToggleLeverGeo = prepGeo(
  new THREE.CylinderGeometry(0.0028, 0.0048, 0.026, 12)
);
const sharedSwitchLeverTipGeo = prepGeo(new THREE.SphereGeometry(0.0034, 10, 10));
const sharedSwitchLedGeo = prepGeo(new THREE.CylinderGeometry(0.0024, 0.0024, 0.002, 10));

const sharedSensorBezelGeo = prepGeo(new THREE.CylinderGeometry(0.062, 0.058, 0.018, 16));
const sharedSensorDomeGeo = prepGeo(
  new THREE.SphereGeometry(0.032, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55)
);
const sharedSensorLedRingGeo = prepGeo(new THREE.TorusGeometry(0.038, 0.0035, 8, 20));
const sharedSensorLuxWindowGeo = prepGeo(new THREE.CylinderGeometry(0.006, 0.006, 0.004, 10));

function addCorstonToggleMechanismToPlate(
  parentGroup: THREE.Group,
  gangPrefix: string,
  offsetX: number,
  halfPlateWidth: number,
  brassPlateMat: THREE.Material,
  darkBronzeMat: THREE.Material,
  ledMat: THREE.Material,
  userData: InteractiveUserData,
  interactiveMeshes: THREE.Object3D[]
): void {
  const upUserData: InteractiveUserData = { ...userData, switchDirection: 'up' };
  const downUserData: InteractiveUserData = { ...userData, switchDirection: 'down' };

  const halfPlateGeo =
    Math.abs(halfPlateWidth - 0.078) < 0.001
      ? sharedSingleHalfPlateGeo
      : Math.abs(halfPlateWidth - 0.064) < 0.001
        ? sharedDoubleHalfPlateGeo
        : prepGeo(new THREE.BoxGeometry(halfPlateWidth, 0.039, 0.004));

  const upperHalfPlate = new THREE.Mesh(halfPlateGeo, brassPlateMat);
  upperHalfPlate.name = `${gangPrefix}.upperHalfPlate`;
  upperHalfPlate.position.set(offsetX, 0.0195, 0.006);
  setInteractiveUserData(upperHalfPlate, upUserData);
  interactiveMeshes.push(upperHalfPlate);
  parentGroup.add(upperHalfPlate);

  const lowerHalfPlate = new THREE.Mesh(halfPlateGeo, brassPlateMat);
  lowerHalfPlate.name = `${gangPrefix}.lowerHalfPlate`;
  lowerHalfPlate.position.set(offsetX, -0.0195, 0.006);
  setInteractiveUserData(lowerHalfPlate, downUserData);
  interactiveMeshes.push(lowerHalfPlate);
  parentGroup.add(lowerHalfPlate);

  const collarRing = new THREE.Mesh(sharedSwitchCollarRingGeo, darkBronzeMat);
  collarRing.name = `${gangPrefix}.collarRing`;
  collarRing.rotation.x = Math.PI / 2;
  collarRing.position.set(offsetX, 0, 0.0095);
  tagHighLod(collarRing);
  setInteractiveUserData(collarRing, upUserData);
  interactiveMeshes.push(collarRing);
  parentGroup.add(collarRing);

  const pivotDome = new THREE.Mesh(sharedSwitchPivotDomeGeo, brassPlateMat);
  pivotDome.name = `${gangPrefix}.pivotDome`;
  pivotDome.position.set(offsetX, 0, 0.012);
  tagHighLod(pivotDome);
  setInteractiveUserData(pivotDome, upUserData);
  interactiveMeshes.push(pivotDome);
  parentGroup.add(pivotDome);

  const toggleLever = new THREE.Mesh(sharedSwitchToggleLeverGeo, brassPlateMat);
  toggleLever.name = `${gangPrefix}.toggleLever`;
  toggleLever.rotation.x = Math.PI / 2;
  toggleLever.position.set(offsetX, 0, 0.022);
  tagHighLod(toggleLever);
  setInteractiveUserData(toggleLever, upUserData);
  interactiveMeshes.push(toggleLever);
  parentGroup.add(toggleLever);

  const leverTip = new THREE.Mesh(sharedSwitchLeverTipGeo, brassPlateMat);
  leverTip.name = `${gangPrefix}.leverTip`;
  leverTip.position.set(offsetX, 0, 0.035);
  tagHighLod(leverTip);
  setInteractiveUserData(leverTip, upUserData);
  interactiveMeshes.push(leverTip);
  parentGroup.add(leverTip);

  const led = new THREE.Mesh(sharedSwitchLedGeo, ledMat);
  led.name = `${gangPrefix}.statusLed`;
  led.rotation.x = Math.PI / 2;
  led.position.set(offsetX, 0.024, 0.0078);
  tagHighLod(led);
  parentGroup.add(led);
}

function buildCorstonSingleToggleUnit(
  unitName: string,
  x: number,
  y: number,
  z: number,
  rotY: number,
  brassPlateMat: THREE.Material,
  darkBronzeMat: THREE.Material,
  ledMat: THREE.Material,
  userData: InteractiveUserData,
  interactiveMeshes: THREE.Object3D[]
): THREE.Group {
  const switchGroup = new THREE.Group();
  switchGroup.name = unitName;
  switchGroup.position.set(x, y, z);
  switchGroup.rotation.y = rotY;

  const backplate = new THREE.Mesh(sharedSingleGangBackplateGeo, brassPlateMat);
  backplate.name = `${unitName}.backplate`;
  backplate.position.set(0, 0, 0.0025);
  switchGroup.add(backplate);

  addCorstonToggleMechanismToPlate(
    switchGroup,
    unitName,
    0,
    0.078,
    brassPlateMat,
    darkBronzeMat,
    ledMat,
    userData,
    interactiveMeshes
  );

  return switchGroup;
}

function buildCorstonDoubleToggleUnit(
  unitName: string,
  x: number,
  y: number,
  z: number,
  rotY: number,
  brassPlateMat: THREE.Material,
  darkBronzeMat: THREE.Material,
  leftLedMat: THREE.Material,
  rightLedMat: THREE.Material,
  leftUserData: InteractiveUserData,
  rightUserData: InteractiveUserData,
  interactiveMeshes: THREE.Object3D[]
): THREE.Group {
  const switchGroup = new THREE.Group();
  switchGroup.name = unitName;
  switchGroup.position.set(x, y, z);
  switchGroup.rotation.y = rotY;

  const backplate = new THREE.Mesh(sharedDoubleGangBackplateGeo, brassPlateMat);
  backplate.name = `${unitName}.backplate`;
  backplate.position.set(0, 0, 0.0025);
  switchGroup.add(backplate);

  // Gang 1 (Left toggle at -0.032m): Kitchen Scene Toggle
  addCorstonToggleMechanismToPlate(
    switchGroup,
    `${unitName}.gang1Kitchen`,
    -0.032,
    0.064,
    brassPlateMat,
    darkBronzeMat,
    leftLedMat,
    leftUserData,
    interactiveMeshes
  );

  // Gang 2 (Right toggle at +0.032m): Courtyard Outdoor Lighting Toggle
  addCorstonToggleMechanismToPlate(
    switchGroup,
    `${unitName}.gang2Courtyard`,
    0.032,
    0.064,
    brassPlateMat,
    darkBronzeMat,
    rightLedMat,
    rightUserData,
    interactiveMeshes
  );

  return switchGroup;
}

export interface WallSwitchMaterials {
  readonly wallSwitchLedMat: THREE.MeshStandardMaterial;
  readonly courtyardSwitchLedMat: THREE.MeshStandardMaterial;
}

export function buildWallKNXSwitch(ctx: SceneBuilderContext): WallSwitchMaterials {
  const { interactiveMeshes, cutawayWallGroups } = ctx;

  const corstonBrassMat = new THREE.MeshStandardMaterial({
    color: 0xc59b58,
    roughness: 0.25,
    metalness: 0.88,
  });
  const corstonCollarMat = new THREE.MeshStandardMaterial({
    color: 0x3a3228,
    roughness: 0.35,
    metalness: 0.78,
  });
  const wallSwitchLedMat = new THREE.MeshStandardMaterial({
    color: 0xffb84d,
    emissive: new THREE.Color(0xff9d2e),
    emissiveIntensity: 3.0,
  });
  const courtyardSwitchLedMat = new THREE.MeshStandardMaterial({
    color: 0xffb84d,
    emissive: new THREE.Color(0xff9d2e),
    emissiveIntensity: 3.0,
  });

  const singleGangSwitches: ReadonlyArray<{
    readonly name: string;
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly rotY: number;
    readonly label: string;
    readonly groupKey: 'southWest' | 'west' | 'north' | 'east';
  }> = [
    {
      name: 'kitchen.knx.switch.entrance',
      x: -4.12,
      y: 1.28,
      z: 1.987,
      rotY: Math.PI,
      label: 'Entrance',
      groupKey: 'southWest',
    },
    {
      name: 'kitchen.knx.switch.leftOfAga',
      x: -3.18,
      y: 1.22,
      z: -2.497,
      rotY: 0,
      label: 'Left of AGA',
      groupKey: 'north',
    },
    {
      name: 'kitchen.knx.switch.sittingArea',
      x: 4.997,
      y: 1.28,
      z: 1.82,
      rotY: -Math.PI / 2,
      label: 'Sitting Area',
      groupKey: 'east',
    },
  ];

  for (const sw of singleGangSwitches) {
    const unit = buildCorstonSingleToggleUnit(
      sw.name,
      sw.x,
      sw.y,
      sw.z,
      sw.rotY,
      corstonBrassMat,
      corstonCollarMat,
      wallSwitchLedMat,
      { isKNXSwitch: true, switchLocation: sw.label },
      interactiveMeshes
    );
    cutawayWallGroups[sw.groupKey].add(unit);
  }

  // Switch #3 on the Wall Next to the Bifolds (South Bifold Left Pier at X = +1.25m, Z = +1.987m)
  const bifoldTwoGangUnit = buildCorstonDoubleToggleUnit(
    'kitchen.knx.switch.bifoldTwoGang',
    1.25,
    1.28,
    1.987,
    Math.PI,
    corstonBrassMat,
    corstonCollarMat,
    wallSwitchLedMat,
    courtyardSwitchLedMat,
    { isKNXSwitch: true, switchLocation: 'Bifold 2-Gang (G1 Kitchen)' },
    { isCourtyardSwitch: true, switchLocation: 'Bifold 2-Gang (G2 Courtyard)' },
    interactiveMeshes
  );
  cutawayWallGroups.southWest.add(bifoldTwoGangUnit);

  // Kitchen KNX Bus NTC Temperature Probe in the South-West Bifold Pier Switch Backbox
  const tempSensorGroup = buildRoomKnxTempSensor(ctx, {
    name: 'kitchen.knxTempSensor',
    zone: 'kitchen',
    ufhZoneId: 'ufhZone4',
    sensorPa: '1.1.10',
    sensorGa: '4/1/5',
    location: 'Kitchen — South Bifold Pier Switch Backbox',
    roomLabel: 'Kitchen',
    defaultTempC: 20.5,
    x: 1.25,
    y: 1.28,
    z: 1.987,
    facing: 'north',
    parentGroup: cutawayWallGroups.southWest,
  });
  let tempPartIdx = 0;
  tempSensorGroup.traverse((child) => {
    if (!child.name) {
      child.name = `kitchen.knxTempSensor.part_${tempPartIdx++}`;
    }
    if (child instanceof THREE.Mesh && child.geometry && !child.geometry.boundingSphere) {
      child.geometry.computeBoundingSphere();
    }
  });

  return { wallSwitchLedMat, courtyardSwitchLedMat };
}

export function buildUtilityKNXSwitch(
  ctx: SceneBuilderContext
): THREE.MeshStandardMaterial {
  const { scene, interactiveMeshes } = ctx;

  const corstonBrassMat = new THREE.MeshStandardMaterial({
    color: 0xc59b58,
    roughness: 0.25,
    metalness: 0.88,
  });
  const corstonCollarMat = new THREE.MeshStandardMaterial({
    color: 0x3a3228,
    roughness: 0.35,
    metalness: 0.78,
  });
  const utilitySwitchLedMat = new THREE.MeshStandardMaterial({
    color: 0xffb84d,
    emissive: new THREE.Color(0xff9d2e),
    emissiveIntensity: 3.0,
  });

  // Matching Corston Single-Toggle Switch by the Utility Room doorway (X = +3.28m, Y = 1.28m) on both sides of the Z = -0.775m wall
  for (const [side, sideTag] of [
    [1, 'kitchenSide'],
    [-1, 'utilitySide'],
  ] as const) {
    const unit = buildCorstonSingleToggleUnit(
      `utility.knx.switch.doorway_${sideTag}`,
      3.28,
      1.28,
      -0.775 + side * 0.076,
      side === 1 ? 0 : Math.PI,
      corstonBrassMat,
      corstonCollarMat,
      utilitySwitchLedMat,
      { isUtilitySwitch: true, switchLocation: 'Utility Door' },
      interactiveMeshes
    );
    scene.add(unit);
  }

  return utilitySwitchLedMat;
}

export interface MotionSensorMaterials {
  readonly kitchenSensorLedMat: THREE.MeshStandardMaterial;
  readonly utilitySensorLedMat: THREE.MeshStandardMaterial;
}

export function buildKitchenAndUtilityMotionSensors(
  ctx: SceneBuilderContext
): MotionSensorMaterials {
  const { scene, interactiveMeshes } = ctx;

  const housingMat = new THREE.MeshStandardMaterial({
    color: 0xf4f2ec,
    roughness: 0.45,
    metalness: 0.05,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });
  const fresnelLensMat = new THREE.MeshStandardMaterial({
    color: 0xfafcff,
    roughness: 0.18,
    metalness: 0.1,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });
  const luxCellMat = new THREE.MeshStandardMaterial({
    color: 0x1e2631,
    roughness: 0.2,
    metalness: 0.6,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
  });

  const kitchenSensorLedMat = new THREE.MeshStandardMaterial({
    color: 0x4be07a,
    emissive: new THREE.Color(0x32c864),
    emissiveIntensity: 2.6,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const utilitySensorLedMat = new THREE.MeshStandardMaterial({
    color: 0x4be07a,
    emissive: new THREE.Color(0x32c864),
    emissiveIntensity: 2.6,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });

  const sensorConfigs: ReadonlyArray<{
    readonly name: string;
    readonly x: number;
    readonly z: number;
    readonly ledMat: THREE.MeshStandardMaterial;
    readonly userData: InteractiveUserData;
  }> = [
    {
      name: 'kitchen.knx.motionSensor',
      x: 0.67,
      z: 0.65,
      ledMat: kitchenSensorLedMat,
      userData: { isKitchenMotionSensor: true },
    },
    {
      name: 'utility.knx.motionSensor',
      x: 3.5,
      z: -1.45,
      ledMat: utilitySensorLedMat,
      userData: { isUtilityMotionSensor: true },
    },
  ];

  for (const cfg of sensorConfigs) {
    const group = new THREE.Group();
    group.name = cfg.name;
    group.position.set(cfg.x, 2.98, cfg.z);

    const bezel = new THREE.Mesh(sharedSensorBezelGeo, housingMat);
    bezel.name = `${cfg.name}.bezel`;
    setInteractiveUserData(bezel, cfg.userData);
    interactiveMeshes.push(bezel);
    group.add(bezel);

    const dome = new THREE.Mesh(sharedSensorDomeGeo, fresnelLensMat);
    dome.name = `${cfg.name}.fresnelDome`;
    dome.rotation.x = Math.PI;
    dome.position.set(0, -0.006, 0);
    setInteractiveUserData(dome, cfg.userData);
    interactiveMeshes.push(dome);
    group.add(dome);

    const ledRing = new THREE.Mesh(sharedSensorLedRingGeo, cfg.ledMat);
    ledRing.name = `${cfg.name}.ledRing`;
    ledRing.rotation.x = Math.PI / 2;
    ledRing.position.set(0, -0.009, 0);
    tagHighLod(ledRing);
    setInteractiveUserData(ledRing, cfg.userData);
    interactiveMeshes.push(ledRing);
    group.add(ledRing);

    const luxWindow = new THREE.Mesh(sharedSensorLuxWindowGeo, luxCellMat);
    luxWindow.name = `${cfg.name}.luxWindow`;
    luxWindow.position.set(0.046, -0.008, 0);
    tagHighLod(luxWindow);
    group.add(luxWindow);

    scene.add(group);
  }

  // Utility Room Central Brass & Fluted-Glass Ceiling Pendant (wired to utilitySpotlights Ch 6)
  buildRoomCeilingPendant(ctx, {
    circuitId: 'utilitySpotlights',
    x: 3.5,
    z: -1.62,
    ceilingY: 2.98,
    floorY: 0.012,
    dropLength: 0.44,
    style: 'flutedGlass',
    addPointLight: false,
  });

  return { kitchenSensorLedMat, utilitySensorLedMat };
}

export interface RoomCorstonToggleSwitchOptions {
  readonly circuitId: CircuitId;
  readonly zoneSceneSwitchZoneId?: RoomZoneId;
  readonly customUnitName?: string;
  readonly switchPa: string;
  readonly switchLocation?: string;
  readonly location?: string;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly rotY?: number;
  readonly facing?: 'north' | 'south' | 'east' | 'west';
  readonly parentGroup?: THREE.Object3D;
  readonly cutawayWall?: CutawayWallDescriptor;
}

let roomSwitchCounter = 0;

/**
 * Builds an interactive 3D Corston Architectural Antique Brass 1-Gang Toggle Switch
 * in any Ground Floor or First Floor room and binds it to the room's KNX circuit & Physical Address.
 */
export function buildRoomCorstonToggleSwitch(
  ctx: SceneBuilderContext,
  options: RoomCorstonToggleSwitchOptions
): THREE.Group {
  const {
    circuitId,
    zoneSceneSwitchZoneId,
    customUnitName,
    switchPa,
    switchLocation,
    location,
    x,
    y,
    z,
    rotY,
    facing = 'south',
    parentGroup,
    cutawayWall,
  } = options;

  const resolvedLocation = switchLocation ?? location ?? 'Room Switch';
  const resolvedRotY =
    rotY ??
    (facing === 'south'
      ? 0
      : facing === 'north'
        ? Math.PI
        : facing === 'east'
          ? Math.PI / 2
          : -Math.PI / 2);

  const ledMat = new THREE.MeshStandardMaterial({
    color: 0xffb84d,
    emissive: new THREE.Color(0xff9d2e),
    emissiveIntensity: 3.0,
  });
  ctx.registerSwitchLedMaterial?.(circuitId, ledMat);

  const domainPrefix = circuitId === 'utilitySpotlights' ? 'utility' : 'kitchen';
  const unitName = customUnitName ?? `${domainPrefix}.knx.corstonSwitch.${circuitId}_${roomSwitchCounter++}`;

  const unit = buildCorstonSingleToggleUnit(
    unitName,
    x,
    y,
    z,
    resolvedRotY,
    sharedRoomBrassMat,
    sharedRoomCollarMat,
    ledMat,
    {
      circuitId,
      zoneSceneSwitchZoneId:
        zoneSceneSwitchZoneId ?? CIRCUITS.find((c) => c.id === circuitId)?.zoneId,
      switchPa,
      switchLocation: resolvedLocation,
    },
    ctx.interactiveMeshes
  );

  if (cutawayWall) {
    unit.userData = {
      ...unit.userData,
      isCutawayWall: true,
      cutawayWall,
    };
  }

  (parentGroup ?? ctx.scene).add(unit);
  return unit;
}
