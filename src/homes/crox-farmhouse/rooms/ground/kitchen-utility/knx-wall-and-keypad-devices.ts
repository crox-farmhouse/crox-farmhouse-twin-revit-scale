import * as THREE from 'three';
import type { CircuitId } from '../../../../../core/types/knx.ts';
import type { RoomZoneId } from '../../../../../core/types/topology.ts';
import type { CutawayWallDescriptor, InteractiveUserData } from '../../../../../core/types/scene.ts';
import type { SceneBuilderContext } from '../../../../../engine/viewer/scene-types.ts';
import {
  buildCorstonToggleSwitch,
  facingToRotY,
  type CorstonToggleGangSpec,
} from '../../../../../objects/fixtures/corston-toggle-switch.ts';
import { buildRoomKnxTempSensor } from '../../../../../objects/fixtures/knx-temp-sensor.ts';
import { croxPushButton, croxPushButtonGangs, croxZoneFirstCircuit } from '../../../knx/devices-placement.ts';
import { buildRoomCeilingPendant } from './knx-ceiling-and-track-lights.ts';

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

const sharedSensorBezelGeo = prepGeo(new THREE.CylinderGeometry(0.062, 0.058, 0.018, 16));
const sharedSensorDomeGeo = prepGeo(
  new THREE.SphereGeometry(0.032, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55)
);
const sharedSensorLedRingGeo = prepGeo(new THREE.TorusGeometry(0.038, 0.0035, 8, 20));
const sharedSensorLuxWindowGeo = prepGeo(new THREE.CylinderGeometry(0.006, 0.006, 0.004, 10));

// ============================================================================
// Corston KNX push-button plates (gangs resolved from CROX_PUSH_BUTTONS by PA)
// ============================================================================

interface CroxPlateOptions {
  readonly name: string;
  readonly pa: string;
  readonly location: string;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly rotY: number;
  readonly parent: THREE.Object3D;
  /** Used when the PA is not in CROX_PUSH_BUTTONS (single gang). */
  readonly fallbackZoneId?: RoomZoneId;
  readonly fallbackCircuitId?: CircuitId;
  readonly ledMaterialForGang?: (gang: number) => THREE.MeshStandardMaterial | undefined;
  readonly extraUserDataForGang?: (gang: number) => InteractiveUserData | undefined;
  readonly cutawayWall?: CutawayWallDescriptor;
}

function buildCroxPlate(ctx: SceneBuilderContext, o: CroxPlateOptions): THREE.Group {
  const device = croxPushButton(o.pa);
  const fallbackGang: CorstonToggleGangSpec[] = o.fallbackZoneId
    ? [{ gang: 1, zoneId: o.fallbackZoneId, label: o.location, ...(o.fallbackCircuitId ? { circuitId: o.fallbackCircuitId } : {}) }]
    : [];
  const gangs = croxPushButtonGangs(o.pa) ?? fallbackGang;
  const handle = buildCorstonToggleSwitch(ctx, {
    name: o.name,
    switchPa: o.pa,
    location: device?.location ?? o.location,
    gangs,
    x: o.x,
    y: o.y,
    z: o.z,
    rotY: o.rotY,
    ...(device ? { mountedInZoneId: device.mountedInZoneId } : o.fallbackZoneId ? { mountedInZoneId: o.fallbackZoneId } : {}),
    parentGroup: o.parent,
    ledInitiallyOn: true,
    ...(o.ledMaterialForGang ? { ledMaterialForGang: o.ledMaterialForGang } : {}),
    ...(o.extraUserDataForGang ? { extraUserDataForGang: o.extraUserDataForGang } : {}),
    ...(o.cutawayWall ? { cutawayWall: o.cutawayWall } : {}),
  });
  return handle.group;
}

function createLegacyLedMat(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0xffb84d,
    emissive: new THREE.Color(0xff9d2e),
    emissiveIntensity: 3.0,
  });
}

export interface WallSwitchMaterials {
  readonly wallSwitchLedMat: THREE.MeshStandardMaterial;
  readonly courtyardSwitchLedMat: THREE.MeshStandardMaterial;
}

export function buildWallKNXSwitch(ctx: SceneBuilderContext): WallSwitchMaterials {
  const { cutawayWallGroups } = ctx;
  const wallSwitchLedMat = createLegacyLedMat();
  const courtyardSwitchLedMat = createLegacyLedMat();

  // Kitchen plates (east-wing frame). Gang 1 of each drives the kitchen (legacy central scene
  // table), so it keeps the shared kitchen LED; the bifold plate's gang 2 drives the courtyard.
  const kitchenPlates: ReadonlyArray<{
    readonly name: string;
    readonly pa: string;
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly rotY: number;
    readonly label: string;
    readonly groupKey: 'southWest' | 'west' | 'north' | 'east';
  }> = [
    { name: 'kitchen.knx.switch.entrance', pa: '1.1.10', x: -4.12, y: 1.28, z: 1.987, rotY: Math.PI, label: 'Entrance', groupKey: 'southWest' },
    { name: 'kitchen.knx.switch.leftOfAga', pa: '1.1.30', x: -3.18, y: 1.22, z: -2.497, rotY: 0, label: 'Left of AGA', groupKey: 'north' },
    { name: 'kitchen.knx.switch.sittingArea', pa: '1.1.31', x: 4.997, y: 1.28, z: 1.82, rotY: -Math.PI / 2, label: 'Sitting Area', groupKey: 'east' },
    { name: 'kitchen.knx.switch.bifoldTwoGang', pa: '1.1.14', x: 1.05, y: 1.28, z: 1.987, rotY: Math.PI, label: 'Bifold 2-Gang', groupKey: 'southWest' },
  ];

  for (const plate of kitchenPlates) {
    buildCroxPlate(ctx, {
      name: plate.name,
      pa: plate.pa,
      location: plate.label,
      x: plate.x,
      y: plate.y,
      z: plate.z,
      rotY: plate.rotY,
      parent: cutawayWallGroups[plate.groupKey],
      fallbackZoneId: 'kitchen',
      ledMaterialForGang: (gang) => {
        const zoneId = croxPushButton(plate.pa)?.gangs.find((g) => g.gang === gang)?.zoneId;
        return zoneId === 'courtyard' ? courtyardSwitchLedMat : zoneId === 'kitchen' ? wallSwitchLedMat : undefined;
      },
      extraUserDataForGang: (gang) => {
        const zoneId = croxPushButton(plate.pa)?.gangs.find((g) => g.gang === gang)?.zoneId;
        return zoneId === 'courtyard' ? { isCourtyardSwitch: true } : undefined;
      },
    });
  }

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
    x: 1.05,
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
  const utilitySwitchLedMat = createLegacyLedMat();

  // Plates either side of the utility doorway (X = +3.28m, Y = 1.28m) on the Z = -0.775m wall:
  // 1.1.11 on the kitchen side, 1.1.32 on the utility side.
  for (const [side, sideTag, pa] of [
    [1, 'kitchenSide', '1.1.11'],
    [-1, 'utilitySide', '1.1.32'],
  ] as const) {
    buildCroxPlate(ctx, {
      name: `utility.knx.switch.doorway_${sideTag}`,
      pa,
      location: 'Utility Door',
      x: 3.28,
      y: 1.28,
      z: -0.775 + side * 0.076,
      rotY: side === 1 ? 0 : Math.PI,
      parent: ctx.scene,
      fallbackZoneId: 'utility',
      ledMaterialForGang: () => utilitySwitchLedMat,
      extraUserDataForGang: () => ({ isUtilitySwitch: true }),
    });
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
      userData: { isKitchenMotionSensor: true, presenceDetectorPa: '1.1.12', zoneId: 'kitchen' },
    },
    {
      name: 'utility.knx.motionSensor',
      x: 3.5,
      z: -1.45,
      ledMat: utilitySensorLedMat,
      userData: { isUtilityMotionSensor: true, presenceDetectorPa: '1.1.13', zoneId: 'utility' },
    },
  ];

  for (const cfg of sensorConfigs) {
    const group = new THREE.Group();
    group.name = cfg.name;
    group.position.set(cfg.x, 2.532, cfg.z);
    group.userData.presenceDetectorPa = cfg.userData.presenceDetectorPa;

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

  // Utility Room Central Brass & Fluted-Glass Ceiling Pendant (wired to utilitySpotlights Ch 6, mounted on 2.54m soffit)
  buildRoomCeilingPendant(ctx, {
    circuitId: 'utilitySpotlights',
    x: 3.5,
    z: -1.62,
    ceilingY: 2.532,
    floorY: 0.012,
    dropLength: 0.28,
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
  /** Push-button device PA when it differs from `switchPa` (second plate on the same line). */
  readonly devicePa?: string;
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
 * Builds an interactive Corston antique-brass KNX push-button plate in any room. The gangs come
 * from `CROX_PUSH_BUTTONS` (by `devicePa ?? switchPa`); unknown PAs fall back to a single gang on
 * the circuit's zone.
 */
export function buildRoomCorstonToggleSwitch(
  ctx: SceneBuilderContext,
  options: RoomCorstonToggleSwitchOptions
): THREE.Group {
  const { circuitId, switchPa, x, y, z } = options;
  const pa = options.devicePa ?? switchPa;
  const location = options.switchLocation ?? options.location ?? 'Room Switch';
  const domainPrefix = circuitId === 'utilitySpotlights' ? 'utility' : 'kitchen';
  const name = options.customUnitName ?? `${domainPrefix}.knx.corstonSwitch.${circuitId}_${roomSwitchCounter++}`;
  const fallbackZoneId = options.zoneSceneSwitchZoneId ?? croxPushButton(pa)?.mountedInZoneId;
  const fallbackCircuitId = fallbackZoneId ? croxZoneFirstCircuit(fallbackZoneId) ?? circuitId : circuitId;

  return buildCroxPlate(ctx, {
    name,
    pa,
    location,
    x,
    y,
    z,
    rotY: options.rotY ?? facingToRotY(options.facing ?? 'south'),
    parent: options.parentGroup ?? ctx.scene,
    ...(fallbackZoneId ? { fallbackZoneId } : {}),
    fallbackCircuitId,
    ...(options.cutawayWall ? { cutawayWall: options.cutawayWall } : {}),
  });
}
