import * as THREE from 'three';
import type { TimeOfDay } from '../../../types/scene.ts';

interface EnvPresetColors {
  readonly skyZenith: number;
  readonly skyHorizon: number;
  readonly groundBounce: number;
  readonly sunOrbColor: number;
  readonly windowCardColor: number;
  readonly warmInteriorCard: number;
  readonly envIntensity: number;
}

const ENV_PRESETS: Readonly<Record<TimeOfDay, EnvPresetColors>> = {
  day: {
    skyZenith: 0x8cb4dc,
    skyHorizon: 0xf6ede0,
    groundBounce: 0x6b5c4c,
    sunOrbColor: 0xfff8e8,
    windowCardColor: 0xffffff,
    warmInteriorCard: 0xffdfba,
    envIntensity: 0.52,
  },
  dusk: {
    skyZenith: 0x26354d,
    skyHorizon: 0xd98a5c,
    groundBounce: 0x42352b,
    sunOrbColor: 0xffb678,
    windowCardColor: 0x9bb2cc,
    warmInteriorCard: 0xffc98c,
    envIntensity: 0.44,
  },
  night: {
    skyZenith: 0x0d131f,
    skyHorizon: 0x1b2436,
    groundBounce: 0x261f19,
    sunOrbColor: 0x687c9c,
    windowCardColor: 0x2a364b,
    warmInteriorCard: 0xffb974,
    envIntensity: 0.30,
  },
};

/**
 * Sky / sun / fog / IBL PMREM environment for a property scene, driven by time of day.
 */
export class EnvironmentLighting {
  private readonly scene: THREE.Scene;
  private readonly hemiLight: THREE.HemisphereLight;
  private readonly sunLight: THREE.DirectionalLight;
  private readonly envMaps: Partial<Record<TimeOfDay, THREE.Texture>> = {};

  /** Creates the hemisphere + shadow-casting sun lights + PMREM IBL environment maps. */
  public constructor(scene: THREE.Scene, renderer?: THREE.WebGLRenderer) {
    this.scene = scene;

    this.hemiLight = new THREE.HemisphereLight(0xdcd8ce, 0x3d352e, 0.42);
    scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffdfba, 0.65);
    this.sunLight.position.set(6.5, 13.5, 10.5);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(2048, 2048);
    this.sunLight.shadow.camera.near = 4.0;
    this.sunLight.shadow.camera.far = 34.0;
    this.sunLight.shadow.camera.left = -28.0;
    this.sunLight.shadow.camera.right = 8.0;
    this.sunLight.shadow.camera.top = 15.5;
    this.sunLight.shadow.camera.bottom = -14.0;
    this.sunLight.shadow.camera.updateProjectionMatrix();
    this.sunLight.shadow.bias = -0.00018;
    this.sunLight.shadow.normalBias = 0.006;
    scene.add(this.sunLight);

    if (renderer) {
      this.bakePmremEnvironments(renderer);
    }
  }

  private bakePmremEnvironments(renderer: THREE.WebGLRenderer): void {
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileCubemapShader();

    const domeGeo = new THREE.SphereGeometry(28, 32, 16);
    const posAttr = domeGeo.attributes.position;
    const colorAttr = new THREE.BufferAttribute(new Float32Array(posAttr.count * 3), 3);
    domeGeo.setAttribute('color', colorAttr);

    const domeMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.BackSide,
      toneMapped: false,
    });

    const cardGeo = new THREE.PlaneGeometry(1, 1);
    const orbGeo = new THREE.SphereGeometry(1.6, 16, 12);

    const zenithCol = new THREE.Color();
    const horizonCol = new THREE.Color();
    const groundCol = new THREE.Color();
    const tmpCol = new THREE.Color();

    for (const mode of ['day', 'dusk', 'night'] as const) {
      const cfg = ENV_PRESETS[mode];
      zenithCol.setHex(cfg.skyZenith);
      horizonCol.setHex(cfg.skyHorizon);
      groundCol.setHex(cfg.groundBounce);

      for (let i = 0; i < posAttr.count; i++) {
        const ny = posAttr.getY(i) / 28.0;
        if (ny >= 0) {
          const t = Math.pow(ny, 0.55);
          tmpCol.copy(horizonCol).lerp(zenithCol, t);
        } else {
          const t = Math.min(1, Math.pow(-ny, 0.45));
          tmpCol.copy(horizonCol).lerp(groundCol, t);
        }
        colorAttr.setXYZ(i, tmpCol.r, tmpCol.g, tmpCol.b);
      }
      colorAttr.needsUpdate = true;

      const envScene = new THREE.Scene();
      envScene.add(new THREE.Mesh(domeGeo, domeMat));

      const sunMat = new THREE.MeshBasicMaterial({
        color: cfg.sunOrbColor,
        toneMapped: false,
      });
      const sunOrb = new THREE.Mesh(orbGeo, sunMat);
      sunOrb.position.set(6.5, 13.5, 10.5);
      envScene.add(sunOrb);

      const windowMat = new THREE.MeshBasicMaterial({
        color: cfg.windowCardColor,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      const southWindowCard = new THREE.Mesh(cardGeo, windowMat);
      southWindowCard.scale.set(14, 5.5, 1);
      southWindowCard.position.set(0, 3.2, 16);
      southWindowCard.lookAt(0, 1.5, 0);
      envScene.add(southWindowCard);

      const westWindowCard = new THREE.Mesh(cardGeo, windowMat);
      westWindowCard.scale.set(10, 4.5, 1);
      westWindowCard.position.set(-16, 2.8, 2);
      westWindowCard.lookAt(0, 1.5, 0);
      envScene.add(westWindowCard);

      const warmMat = new THREE.MeshBasicMaterial({
        color: cfg.warmInteriorCard,
        side: THREE.DoubleSide,
        toneMapped: false,
      });
      const warmCeilingCard = new THREE.Mesh(cardGeo, warmMat);
      warmCeilingCard.scale.set(12, 12, 1);
      warmCeilingCard.position.set(0, 11, 0);
      warmCeilingCard.rotation.x = Math.PI / 2;
      envScene.add(warmCeilingCard);

      const target = pmrem.fromScene(envScene, 0.035, 0.1, 60);
      this.envMaps[mode] = target.texture;

      sunMat.dispose();
      windowMat.dispose();
      warmMat.dispose();
    }

    domeGeo.dispose();
    domeMat.dispose();
    cardGeo.dispose();
    orbGeo.dispose();
    pmrem.dispose();
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
      this.hemiLight.intensity = 0.38;
      this.hemiLight.color.setHex(0xbab5ac);
      this.sunLight.intensity = 0.45;
      this.sunLight.color.setHex(0xffb87e);
    } else {
      bg.setHex(0x080a0f);
      fog.color.setHex(0x080a0f);
      this.hemiLight.intensity = 0.14;
      this.hemiLight.color.setHex(0x6e6c68);
      this.sunLight.intensity = 0.08;
      this.sunLight.color.setHex(0x88847c);
    }

    const envTex = this.envMaps[mode];
    if (envTex) {
      this.scene.environment = envTex;
      this.scene.environmentIntensity = ENV_PRESETS[mode].envIntensity;
    }
  }
}

