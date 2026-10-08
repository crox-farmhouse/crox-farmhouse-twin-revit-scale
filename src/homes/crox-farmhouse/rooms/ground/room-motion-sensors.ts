import * as THREE from 'three';
import type { MotionCircuitId, RoomMotionSensorId } from '../../../../core/types/knx.ts';
import type { InteractiveUserData, SceneBuilderContext } from '../../../../core/types/scene.ts';
import type { RoomZoneId } from '../../../../core/types/topology.ts';

export interface RoomCeilingPirSensorOptions {
  readonly name: string;
  readonly zone: RoomZoneId;
  readonly sensorId: RoomMotionSensorId;
  readonly knxPa: string;
  /** The motion circuit this PIR drives; its indicator LED glows whenever that circuit is lit. */
  readonly indicatorCircuitId: MotionCircuitId;
  readonly x: number;
  readonly ceilingY: number;
  readonly z: number;
}

const housingMat = new THREE.MeshStandardMaterial({
  color: 0xf4f2ec,
  roughness: 0.34,
  metalness: 0.06,
});
const fresnelLensMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  emissive: 0x70c8ff,
  emissiveIntensity: 0.12,
  roughness: 0.18,
  metalness: 0.05,
  transparent: true,
  opacity: 0.9,
});
const bezelGeo = new THREE.CylinderGeometry(0.044, 0.041, 0.012, 20);
const domeGeo = new THREE.SphereGeometry(0.024, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.55);
const ledGeo = new THREE.SphereGeometry(0.0035, 8, 8);

/**
 * Small flush-mounted KNX ceiling PIR presence sensor. Clicking any part of it toggles the
 * sensor's simulated occupancy via `userData.roomMotionSensorId`.
 */
export function buildRoomCeilingPirSensor(
  ctx: SceneBuilderContext,
  options: RoomCeilingPirSensorOptions
): THREE.Group {
  const { interactiveMeshes, lightGroups, scene } = ctx;
  const userData: InteractiveUserData = {
    roomMotionSensorId: options.sensorId,
    zoneId: options.zone,
  };

  const group = new THREE.Group();
  group.name = options.name;
  group.userData.zone = options.zone;
  group.userData.knxPa = options.knxPa;
  group.position.set(options.x, options.ceilingY, options.z);

  const ledMat = new THREE.MeshStandardMaterial({
    color: 0x4be07a,
    emissive: 0x32c864,
    emissiveIntensity: 2.4,
    roughness: 0.2,
  });
  ledMat.userData.baseEmissiveIntensity = 2.4;
  lightGroups[options.indicatorCircuitId].emissives.push(ledMat);

  const bezel = new THREE.Mesh(bezelGeo, housingMat);
  bezel.name = `${options.name}.housing`;
  bezel.position.y = -0.006;
  const dome = new THREE.Mesh(domeGeo, fresnelLensMat);
  dome.name = `${options.name}.pirFresnelLens`;
  dome.rotation.x = Math.PI;
  dome.scale.set(1, 0.62, 1);
  dome.position.y = -0.012;
  const led = new THREE.Mesh(ledGeo, ledMat);
  led.name = `${options.name}.statusLed`;
  led.position.set(0.032, -0.013, 0);

  for (const mesh of [bezel, dome, led]) {
    mesh.userData = { ...userData };
    interactiveMeshes.push(mesh);
    group.add(mesh);
  }

  scene.add(group);
  return group;
}
