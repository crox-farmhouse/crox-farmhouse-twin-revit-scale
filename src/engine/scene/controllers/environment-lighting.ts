import * as THREE from 'three';
import type { TimeOfDay } from '../../../types/scene.ts';

/**
 * Sky / sun / fog environment for a property scene, driven by time of day.
 */
export class EnvironmentLighting {
  private readonly scene: THREE.Scene;
  private readonly hemiLight: THREE.HemisphereLight;
  private readonly sunLight: THREE.DirectionalLight;

  /** Creates the hemisphere + shadow-casting sun lights and adds them to `scene`. */
  public constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.hemiLight = new THREE.HemisphereLight(0xdcd8ce, 0x3d352e, 0.42);
    scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffdfba, 0.65);
    this.sunLight.position.set(6.5, 13.5, 10.5);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.left = -26.0;
    this.sunLight.shadow.camera.right = 12.0;
    this.sunLight.shadow.camera.top = 14.0;
    this.sunLight.shadow.camera.bottom = -14.0;
    this.sunLight.shadow.bias = -0.0004;
    this.sunLight.shadow.normalBias = 0.014;
    scene.add(this.sunLight);
  }

  public setTimeOfDay(mode: TimeOfDay): void {
    const bg = this.scene.background as THREE.Color;
    const fog = this.scene.fog as THREE.FogExp2;

    if (mode === 'day') {
      bg.setHex(0x1d2631);
      fog.color.setHex(0x1d2631);
      this.hemiLight.intensity = 1.2;
      this.hemiLight.color.setHex(0xf4efe6);
      this.sunLight.intensity = 1.85;
      this.sunLight.color.setHex(0xfff4e0);
    } else if (mode === 'dusk') {
      bg.setHex(0x0f141c);
      fog.color.setHex(0x0f141c);
      this.hemiLight.intensity = 0.36;
      this.hemiLight.color.setHex(0xbab5ac);
      this.sunLight.intensity = 0.42;
      this.sunLight.color.setHex(0xffb87e);
    } else {
      bg.setHex(0x080a0f);
      fog.color.setHex(0x080a0f);
      this.hemiLight.intensity = 0.12;
      this.hemiLight.color.setHex(0x6e6c68);
      this.sunLight.intensity = 0.06;
      this.sunLight.color.setHex(0x88847c);
    }
  }
}
