import * as THREE from 'three';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import type { TimeOfDay } from '../../core/types/scene.ts';
import { ENV_PRESETS, environmentRotationForSun } from './env/env-presets.ts';
import {
  SITE_SHADOW_BOX,
  copyEnvState,
  fitShadowFrustum,
  lerpEnvState,
  stateFromPreset,
  sunPlacement,
  type EnvLightingState,
} from './env/env-state.ts';
import { bakeProceduralSky, prepareHdrPanorama } from './env/hdr-processing.ts';
import { installOrthoSafeBackground } from './env/background-projection.ts';
import { installSiteHazeFog } from './env/site-haze-fog.ts';

const TIMES_OF_DAY: readonly TimeOfDay[] = ['day', 'dusk', 'night'];

/** Duration (ms) of the eased cross-fade between time-of-day presets. */
const TRANSITION_MS = 900;

/**
 * Sky / sun / IBL / exposure / haze for the property scene in `day`, `dusk` and `night` modes.
 *
 * - 2K CC0 HDR panoramas (procedural sky until they stream in) are PMREM-filtered for IBL, with the
 *   sun disc clamped out of the IBL (the shadowed directional light is the sun) and the skybox kept
 *   separately with its own intensity and a little blur.
 * - The environment is rotated so the HDR's sun disc sits on the directional light's azimuth.
 * - The sun's shadow camera is fitted to the whole site for the current sun direction.
 * - This class owns `renderer.toneMappingExposure` (per time of day; the post pipeline reads it).
 * - Haze is world-space (beyond the site footprint), so orthographic and perspective views match,
 *   and the skybox also renders under orthographic cameras (see background-projection.ts).
 *
 * Nothing here depends on the camera; changes between presets fade smoothly.
 */
export class EnvironmentLighting {
  private readonly scene: THREE.Scene;
  private readonly hemiLight: THREE.HemisphereLight;
  private readonly sunLight: THREE.DirectionalLight;
  private readonly envMaps: Partial<Record<TimeOfDay, THREE.Texture>> = {};
  private readonly bgMaps: Partial<Record<TimeOfDay, THREE.Texture>> = {};
  private readonly onEnvUpdated?: () => void;
  private readonly renderer?: THREE.WebGLRenderer;
  private currentMode: TimeOfDay = 'dusk';
  private shadowMapSize: 1024 | 2048 | 4096 = 2048;
  private hasAppliedMode = false;
  private readonly state: EnvLightingState = stateFromPreset(ENV_PRESETS.dusk);
  private readonly transitionFrom: EnvLightingState = stateFromPreset(ENV_PRESETS.dusk);
  private readonly transitionTo: EnvLightingState = stateFromPreset(ENV_PRESETS.dusk);
  private transitionStart = 0;
  private transitionFrame = 0;

  /** Creates the hemisphere + shadow-casting sun lights + HDR skybox & IBL maps. */
  public constructor(
    scene: THREE.Scene,
    renderer?: THREE.WebGLRenderer,
    onEnvUpdated?: () => void
  ) {
    this.scene = scene;
    this.renderer = renderer;
    this.onEnvUpdated = onEnvUpdated;

    this.hemiLight = new THREE.HemisphereLight(0xdcd8ce, 0x3d352e, 0.1);
    scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffdfba, 1.0);
    scene.add(this.sunLight.target);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(this.shadowMapSize, this.shadowMapSize);
    this.sunLight.shadow.bias = -0.0002;
    scene.add(this.sunLight);

    if (renderer) {
      // Shader chunks are read at program compile time, so swap in the haze before the first render.
      installSiteHazeFog();
      installOrthoSafeBackground();
      this.bakeProceduralEnvironments(renderer);
      this.loadHdrFiles(renderer);
    }
  }

  /** Frame-0 procedural skies + PMREM IBL so the scene is lit before the 2K `.hdr` files arrive. */
  private bakeProceduralEnvironments(renderer: THREE.WebGLRenderer): void {
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    for (const mode of TIMES_OF_DAY) {
      const sky = bakeProceduralSky(ENV_PRESETS[mode]);
      this.bgMaps[mode] = sky;
      this.envMaps[mode] = pmrem.fromEquirectangular(sky).texture;
    }
    pmrem.dispose();
  }

  /** Streams the 2K HDR panoramas, prepares them and swaps them in as each finishes. */
  private loadHdrFiles(renderer: THREE.WebGLRenderer): void {
    const loader = new HDRLoader().setDataType(THREE.FloatType);
    for (const mode of TIMES_OF_DAY) {
      const cfg = ENV_PRESETS[mode];
      loader.load(
        cfg.hdrUrl,
        (loadedTex) => {
          const prepared = prepareHdrPanorama(loadedTex, cfg);
          if (!prepared) return;
          const pmrem = new THREE.PMREMGenerator(renderer);
          pmrem.compileEquirectangularShader();
          const pmremTarget = pmrem.fromEquirectangular(prepared.envSource);
          prepared.envSource.dispose();
          pmrem.dispose();

          const prevBg = this.bgMaps[mode];
          const prevEnv = this.envMaps[mode];
          this.bgMaps[mode] = prepared.background;
          this.envMaps[mode] = pmremTarget.texture;
          prevBg?.dispose();
          prevEnv?.dispose();

          if (this.currentMode === mode) {
            this.applyEnvironmentTextures(mode);
            this.onEnvUpdated?.();
          }
        },
        undefined,
        () => {
          // Keep the procedural sky if the asset fails to load (e.g. offline).
        }
      );
    }
  }

  private applyEnvironmentTextures(mode: TimeOfDay): void {
    const cfg = ENV_PRESETS[mode];
    const bgTex = this.bgMaps[mode];
    const envTex = this.envMaps[mode];
    const rotationY = environmentRotationForSun(cfg.sunDirection, cfg.hdrSunU);

    if (bgTex) {
      this.scene.background = bgTex;
      this.scene.backgroundRotation.set(0, rotationY, 0);
    } else if (this.scene.background instanceof THREE.Color) {
      this.scene.background.setHex(cfg.fogColor);
    } else {
      this.scene.background = new THREE.Color(cfg.fogColor);
    }

    if (envTex) {
      this.scene.environment = envTex;
      this.scene.environmentRotation.set(0, rotationY, 0);
    }
    this.applyIntensities();
  }

  /** Writes the interpolatable state to lights, scene, fog and renderer exposure. */
  private applyState(): void {
    const s = this.state;
    this.hemiLight.intensity = s.hemiIntensity;
    this.hemiLight.color.copy(s.hemiSkyColor);
    this.hemiLight.groundColor.copy(s.hemiGroundColor);

    this.sunLight.intensity = s.sunIntensity;
    this.sunLight.color.copy(s.sunColor);
    this.placeSun(s.sunDirection);

    const fog = this.scene.fog;
    if (fog instanceof THREE.FogExp2) {
      fog.color.copy(s.fogColor);
      fog.density = s.fogDensity;
    } else if (fog instanceof THREE.Fog) {
      fog.color.copy(s.fogColor);
    }
    if (this.scene.background instanceof THREE.Color) {
      this.scene.background.copy(s.fogColor);
    }

    if (this.renderer) {
      this.renderer.toneMappingExposure = s.exposure;
    }
    this.applyIntensities();
  }

  private applyIntensities(): void {
    this.scene.environmentIntensity = this.state.envIntensity;
    this.scene.backgroundIntensity = this.state.bgIntensity;
    this.scene.backgroundBlurriness = this.state.bgBlurriness;
  }

  /** Positions the sun for a direction and fits its shadow camera around the whole site. */
  private placeSun(direction: THREE.Vector3): void {
    const { position, target } = sunPlacement(direction, SITE_SHADOW_BOX);
    this.sunLight.position.copy(position);
    this.sunLight.target.position.copy(target);
    this.sunLight.target.updateMatrixWorld();
    const f = fitShadowFrustum(position, target, SITE_SHADOW_BOX);
    const cam = this.sunLight.shadow.camera;
    cam.left = f.left;
    cam.right = f.right;
    cam.top = f.top;
    cam.bottom = f.bottom;
    cam.near = f.near;
    cam.far = f.far;
    cam.updateProjectionMatrix();
    this.updateNormalBias();
  }

  /** Normal-offset bias scaled to the world size of one shadow texel (no acne, minimal peter-panning). */
  private updateNormalBias(): void {
    const cam = this.sunLight.shadow.camera;
    const texel = Math.max(cam.right - cam.left, cam.top - cam.bottom) / this.shadowMapSize;
    this.sunLight.shadow.normalBias = texel * 0.6;
  }

  public getShadowMapSize(): 1024 | 2048 | 4096 {
    return this.shadowMapSize;
  }

  /**
   * Changes the sun shadow-map resolution (graphics tier). Only the shadow texture resolution (and
   * the matching texel-sized normal bias) changes; nothing depends on the camera.
   */
  public setShadowMapSize(size: 1024 | 2048 | 4096): void {
    if (size === this.shadowMapSize) return;
    this.shadowMapSize = size;
    const shadow = this.sunLight.shadow;
    shadow.map?.dispose();
    shadow.map = null;
    shadow.mapSize.set(size, size);
    shadow.needsUpdate = true;
    this.updateNormalBias();
    if (this.renderer) {
      this.renderer.shadowMap.needsUpdate = true;
    }
  }

  /** Current time-of-day preset (the target of any running transition). */
  public getTimeOfDay(): TimeOfDay {
    return this.currentMode;
  }

  /**
   * Switches to a time-of-day preset. The first call (and any call without a renderer / rAF) applies
   * immediately; later calls swap the sky textures and ease the lights, IBL, exposure and haze over
   * {@link TRANSITION_MS}, requesting a render each frame via `onEnvUpdated`.
   */
  public setTimeOfDay(mode: TimeOfDay): void {
    this.currentMode = mode;
    const target = stateFromPreset(ENV_PRESETS[mode]);
    const canAnimate =
      this.hasAppliedMode && !!this.renderer && typeof requestAnimationFrame === 'function';
    this.hasAppliedMode = true;
    this.cancelTransition();

    if (!canAnimate) {
      copyEnvState(target, this.state);
      this.applyEnvironmentTextures(mode);
      this.applyState();
      return;
    }

    copyEnvState(this.state, this.transitionFrom);
    copyEnvState(target, this.transitionTo);
    this.transitionStart = performance.now();
    this.applyEnvironmentTextures(mode);
    this.stepTransition();
  }

  private stepTransition = (): void => {
    const t = Math.min(1, (performance.now() - this.transitionStart) / TRANSITION_MS);
    const eased = t * t * (3 - 2 * t);
    lerpEnvState(this.transitionFrom, this.transitionTo, eased, this.state);
    this.applyState();
    this.onEnvUpdated?.();
    this.transitionFrame = t < 1 ? requestAnimationFrame(this.stepTransition) : 0;
  };

  private cancelTransition(): void {
    if (this.transitionFrame !== 0) {
      cancelAnimationFrame(this.transitionFrame);
      this.transitionFrame = 0;
    }
  }
}
