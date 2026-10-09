import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { CircuitLevels } from '../../core/types/knx.ts';
import type { RoomZoneLodRegistration } from '../../core/entities.ts';
import type { LightGroupMap } from '../viewer/scene-types.ts';
import { BakedLightVolumeController } from './baked-light-volume.ts';

function createTestLightGroups(): LightGroupMap {
  const kitchenLight = new THREE.PointLight(0xffdfba, 4.0, 7.5, 2);
  kitchenLight.position.set(0, 2.2, 0);
  kitchenLight.userData = { baseIntensity: 4.0, knxDecayGain: 4.0 };
  kitchenLight.updateMatrixWorld(true);

  const barnLight = new THREE.PointLight(0xffe0b2, 5.0, 8.0, 2);
  barnLight.position.set(-2.0, 2.0, 17.0);
  barnLight.userData = { baseIntensity: 5.0, knxDecayGain: 6.0 };
  barnLight.updateMatrixWorld(true);

  return {
    islandPendants: {
      lights: [kitchenLight],
      emissives: [],
      cones: [],
      pools: [],
      maxIntensity: 4.0,
    },
    barnPoolTableLight: {
      lights: [barnLight],
      emissives: [],
      cones: [],
      pools: [],
      maxIntensity: 5.0,
    },
  } as unknown as LightGroupMap;
}

const TEST_ROOMS: readonly RoomZoneLodRegistration[] = [
  {
    zoneId: 'kitchen',
    bounds: { minX: -4, maxX: 4, minY: 0, maxY: 2.8, minZ: -4, maxZ: 4 },
    maxDistanceM: 22,
  },
  {
    zoneId: 'outbuildingBarn',
    bounds: { minX: -7, maxX: 1, minY: 0, maxY: 3.5, minZ: 14, maxZ: 20 },
    maxDistanceM: 25,
  },
];

describe('BakedLightVolumeController', () => {
  it('bakes static architectural AO with darker room corners than open room centers', () => {
    const controller = new BakedLightVolumeController(createTestLightGroups(), TEST_ROOMS);
    expect(controller.isBaked()).toBe(true);
    expect(controller.getBakedCircuitCount()).toBe(2);

    const centerSample = controller.sampleAtWorldPosition(0, 1.4, 0);
    const cornerSample = controller.sampleAtWorldPosition(-3.8, 0.1, -3.8);
    expect(centerSample.ao).toBeGreaterThan(cornerSample.ao);
    expect(cornerSample.ao).toBeGreaterThanOrEqual(0.55);
  });

  it('updates baked 3D irradiance dynamically when KNX circuits dim and occludes across walls/slabs', () => {
    const controller = new BakedLightVolumeController(createTestLightGroups(), TEST_ROOMS);

    const allOff = { islandPendants: 0, barnPoolTableLight: 0 } as unknown as CircuitLevels;
    controller.updateFromCircuitLevels(allOff, 'night');
    expect(controller.sampleAtWorldPosition(0, 1.2, 0).r).toBe(0);

    const kitchenOn = { islandPendants: 100, barnPoolTableLight: 0 } as unknown as CircuitLevels;
    controller.updateFromCircuitLevels(kitchenOn, 'night');

    const kitchenLit = controller.sampleAtWorldPosition(0, 1.2, 0);
    const upstairsBlocked = controller.sampleAtWorldPosition(0, 4.2, 0);
    const barnDark = controller.sampleAtWorldPosition(-2.0, 1.5, 17.0);

    expect(kitchenLit.r).toBeGreaterThan(0.2);
    expect(kitchenLit.r).toBeGreaterThan(upstairsBlocked.r * 5);
    expect(barnDark.r).toBe(0);
  });
});
