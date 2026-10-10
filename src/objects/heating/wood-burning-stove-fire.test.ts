import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  buildHallWoodBurningStoveFirebox,
  createSculptedFlameTongueGeometry,
} from './wood-burning-stove-fire.ts';

describe('WoodBurningStoveFireController', () => {
  it('builds sculpted bottom-anchored flame tongue geometry with valid normals and UVs', () => {
    const geo = createSculptedFlameTongueGeometry(0.06, 0.16, 0.036);
    expect(geo.getAttribute('position')?.count).toBeGreaterThan(50);
    expect(geo.getAttribute('normal')?.count).toBeGreaterThan(50);
    expect(geo.getAttribute('uv')?.count).toBeGreaterThan(50);
    expect(geo.boundingBox).not.toBeNull();
    expect(geo.boundingBox!.min.y).toBeCloseTo(0, 4);
    expect(geo.boundingBox!.max.y).toBeCloseTo(0.16, 4);
  });

  it('populates stoveGroup with sculpted emissive flames, sparks, and animates them on step()', () => {
    const stoveGroup = new THREE.Group();
    const castIronMat = new THREE.MeshStandardMaterial({ color: 0x222428 });

    const controller = buildHallWoodBurningStoveFirebox({
      stoveGroup,
      castIronMat,
    });

    expect(controller.isAmbientLoop).toBe(true);

    const dynamicSet = new Set<THREE.Object3D>();
    controller.collectDynamicObjects(dynamicSet);
    expect(dynamicSet.size).toBeGreaterThan(20);

    const flame1 = stoveGroup.getObjectByName('hall.woodBurningStove.flame.1') as THREE.Mesh;
    const core1 = stoveGroup.getObjectByName('hall.woodBurningStove.flameCore.1') as THREE.Mesh;
    const spark1 = stoveGroup.getObjectByName('hall.woodBurningStove.spark.1') as THREE.Mesh;
    const doorGlass = stoveGroup.getObjectByName('hall.woodBurningStove.doorGlass') as THREE.Mesh;
    expect(flame1).toBeInstanceOf(THREE.Mesh);
    expect(core1).toBeInstanceOf(THREE.Mesh);
    expect(spark1).toBeInstanceOf(THREE.Mesh);
    expect(doorGlass).toBeInstanceOf(THREE.Mesh);

    const flameMat = flame1.material as THREE.MeshStandardMaterial;
    const coreMat = core1.material as THREE.MeshStandardMaterial;
    expect(flameMat.emissiveIntensity).toBeGreaterThan(3.0);
    expect(coreMat.emissiveIntensity).toBeGreaterThan(4.0);

    const initialY = spark1.position.y;
    const initialScaleY = flame1.scale.y;

    expect(controller.step(0.05)).toBe(true);
    expect(spark1.position.y).not.toBe(initialY);
    expect(flame1.scale.y).not.toBe(initialScaleY);
  });
});
