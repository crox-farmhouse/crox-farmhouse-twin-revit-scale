import * as THREE from 'three';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { float, fog, length, max, positionWorld, uniform, vec2 } from 'three/tsl';
import { PMREMGenerator, type WebGPURenderer } from 'three/webgpu';
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
import { createSiteGround, type SiteGround } from './env/site-ground.ts';
import { DEFAULT_SITE_HAZE_FOOTPRINT, installSiteHazeFog } from './env/site-haze-fog.ts';

const TIMES_OF_DAY: readonly TimeOfDay[] = ['day', 'dusk', 'night'];

const MODE_TO_MINUTES: Readonly<Record<TimeOfDay, number>> = {
  day: 12 * 60,
  dusk: 19 * 60 + 30,
  night: 23 * 60,
};

/** Duration (ms) of the eased cross-fade between time-of-day presets. */
const TRANSITION_MS = 900;

interface WebGpuPmremGenerator extends PMREMGenerator {
  fromEquirectangular(
    equirectangular: THREE.Texture,
    renderTarget?: THREE.RenderTarget | null
  ): THREE.RenderTarget;
}

function isWebGPURendererInstance(
  renderer: WebGPURenderer | THREE.WebGLRenderer
): renderer is WebGPURenderer {
  return 'isWebGPURenderer' in renderer && renderer.isWebGPURenderer === true;
}

function bakeEquirectPmrem(
  renderer: WebGPURenderer | THREE.WebGLRenderer,
  equirect: THREE.Texture
): THREE.Texture {
  if (isWebGPURendererInstance(renderer)) {
    const pmrem = new PMREMGenerator(renderer) as WebGpuPmremGenerator;
    const target = pmrem.fromEquirectangular(equirect);
    pmrem.dispose();
    return target.texture;
  }
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const target = pmrem.fromEquirectangular(equirect);
  pmrem.dispose();
  return target.texture;
}

/**
 * Sky / sun / IBL / exposure / haze for the property scene in `day`, `dusk` and `night` modes.
 *
 * - 2K CC0 HDR panoramas (procedural sky until they stream in) are PMREM-filtered for IBL, with the
 *   sun disc clamped out of the IBL (the shadowed directional light is the sun) and the skybox kept
 *   separately with its own intensity and a little blur.
 * - The environment is rotated so the HDR's sun disc sits on the directional light's azimuth.
 * - The sun's shadow camera is fitted to the whole site for the current sun direction.
 * - This class owns `renderer.toneMappingExposure` (per time of day; the post pipeline reads it).
 * - A shadow-receiving meadow disc grounds the estate and fades into the panorama's horizon ground.
 * - Haze is world-space (beyond the site footprint), so orthographic and perspective views match,
 *   and the skybox also renders under orthographic cameras (see background-projection.ts).
 *
 * Nothing here depends on the camera; changes between presets fade smoothly.
 */
export class EnvironmentLighting {
  public currentMinutes: number = MODE_TO_MINUTES.dusk;
  private readonly scene: THREE.Scene;
  private readonly hemiLight: THREE.HemisphereLight;
  private readonly sunLight: THREE.DirectionalLight;
  private readonly envMaps: Partial<Record<TimeOfDay, THREE.Texture>> = {};
  private readonly bgMaps: Partial<Record<TimeOfDay, THREE.Texture>> = {};
  /** Linear radiance of each panorama's horizon ground band (what the 3D meadow fades into). */
  private readonly horizonGround: Record<TimeOfDay, THREE.Color> = {
    day: new THREE.Color(ENV_PRESETS.day.groundPasture),
    dusk: new THREE.Color(ENV_PRESETS.dusk.groundPasture),
    night: new THREE.Color(ENV_PRESETS.night.groundPasture),
  };
  private readonly ground?: SiteGround;
  private readonly horizonScratch = new THREE.Color();
  private readonly onEnvUpdated?: () => void;
  private readonly renderer?: WebGPURenderer | THREE.WebGLRenderer;
  private readonly uFogColor = uniform(new THREE.Color(ENV_PRESETS.dusk.fogColor));
  private readonly uFogDensity = uniform(ENV_PRESETS.dusk.fogDensity);
  private currentMode: TimeOfDay = 'dusk';
  private shadowMapSize: 1024 | 2048 | 4096 = 2048;
  private hasAppliedMode = false;
  private hasBakedProceduralEnvironments = false;
  private readonly state: EnvLightingState = stateFromPreset(ENV_PRESETS.dusk);
  private readonly transitionFrom: EnvLightingState = stateFromPreset(ENV_PRESETS.dusk);
  private readonly transitionTo: EnvLightingState = stateFromPreset(ENV_PRESETS.dusk);
  private transitionStart = 0;
  private transitionFrame = 0;

  /** Creates the hemisphere + shadow-casting sun lights + site ground & haze. */
  public constructor(
    scene: THREE.Scene,
    renderer?: WebGPURenderer | THREE.WebGLRenderer,
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
    this.sunLight.shadow.autoUpdate = false;
    this.sunLight.shadow.needsUpdate = true;
    this.sunLight.shadow.mapSize.set(this.shadowMapSize, this.shadowMapSize);
    this.sunLight.shadow.bias = -0.0002;
    scene.add(this.sunLight);

    if (renderer) {
      // Shader chunks are read at program compile time, so swap in the haze before the first render.
      installSiteHazeFog();
      installOrthoSafeBackground();
      const fogOffset = positionWorld.xz.sub(
        vec2(DEFAULT_SITE_HAZE_FOOTPRINT.centerX, DEFAULT_SITE_HAZE_FOOTPRINT.centerZ)
      );
      const fogDepth = max(
        float(0),
        length(fogOffset).sub(float(DEFAULT_SITE_HAZE_FOOTPRINT.radius))
      );
      const fogFactor = this.uFogDensity
        .mul(this.uFogDensity)
        .mul(fogDepth)
        .mul(fogDepth)
        .negate()
        .exp()
        .oneMinus();
      scene.fogNode = fog(this.uFogColor, fogFactor);
      this.ground = createSiteGround();
      scene.add(this.ground.mesh);
    }
  }

  /**
   * Frame-0 procedural skies + PMREM IBL so the scene is lit before the 2K `.hdr` files arrive.
   * Must be called after `await renderer.init()` has resolved on `WebGPURenderer`.
   */
  public bakeProceduralEnvironments(
    renderer: WebGPURenderer | THREE.WebGLRenderer | undefined = this.renderer
  ): void {
    if (this.hasBakedProceduralEnvironments || !renderer) return;
    this.hasBakedProceduralEnvironments = true;
    for (const mode of TIMES_OF_DAY) {
      const sky = bakeProceduralSky(ENV_PRESETS[mode]);
      this.bgMaps[mode] = sky;
      this.envMaps[mode] = bakeEquirectPmrem(renderer, sky);
    }
    this.applyEnvironmentTextures(this.currentMode);
    this.applyState();
    this.loadHdrFiles(renderer);
  }

  /** Streams the 2K HDR panoramas, prepares them and swaps them in as each finishes. */
  private loadHdrFiles(renderer: WebGPURenderer | THREE.WebGLRenderer): void {
    const loader = new HDRLoader().setDataType(THREE.FloatType);
    for (const mode of TIMES_OF_DAY) {
      const cfg = ENV_PRESETS[mode];
      loader.load(
        cfg.hdrUrl,
        (loadedTex) => {
          const prepared = prepareHdrPanorama(loadedTex, cfg);
          if (!prepared) return;
          const envTexture = bakeEquirectPmrem(renderer, prepared.envSource);
          prepared.envSource.dispose();

          const prevBg = this.bgMaps[mode];
          const prevEnv = this.envMaps[mode];
          this.bgMaps[mode] = prepared.background;
          this.envMaps[mode] = envTexture;
          this.horizonGround[mode].copy(prepared.horizonGround);
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

    const fogObj = this.scene.fog;
    if (fogObj instanceof THREE.FogExp2) {
      fogObj.color.copy(s.fogColor);
      fogObj.density = s.fogDensity;
    } else if (fogObj instanceof THREE.Fog) {
      fogObj.color.copy(s.fogColor);
    }
    this.uFogColor.value.copy(s.fogColor);
    this.uFogDensity.value = s.fogDensity;
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
    if (this.ground) {
      const horizon = this.horizonScratch.copy(this.horizonGround[this.currentMode]);
      this.ground.setHorizonColor(horizon.multiplyScalar(this.state.bgIntensity));
    }
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
    this.sunLight.shadow.needsUpdate = true;
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
    if (this.renderer && 'needsUpdate' in this.renderer.shadowMap) {
      this.renderer.shadowMap.needsUpdate = true;
    }
  }

  /** Current time-of-day preset (the target of any running transition). */
  public getTimeOfDay(): TimeOfDay {
    return this.currentMode;
  }

  /** Immediately applies the current or specified time-of-day textures and state without transition. */
  public applyTimeOfDay(modeOrMinutes?: TimeOfDay | number, _scene?: THREE.Scene): void {
    let mode: TimeOfDay = this.currentMode;
    if (modeOrMinutes === 'day' || modeOrMinutes === 'dusk' || modeOrMinutes === 'night') {
      mode = modeOrMinutes;
    } else if (typeof modeOrMinutes === 'number' && Number.isFinite(modeOrMinutes)) {
      this.currentMinutes = modeOrMinutes;
    }
    this.currentMode = mode;
    this.currentMinutes = MODE_TO_MINUTES[mode];
    this.hasAppliedMode = true;
    this.cancelTransition();
    copyEnvState(stateFromPreset(ENV_PRESETS[mode]), this.state);
    this.applyEnvironmentTextures(mode);
    this.applyState();
  }

  /**
   * Switches to a time-of-day preset. The first call (and any call without a renderer / rAF) applies
   * immediately; later calls swap the sky textures and ease the lights, IBL, exposure and haze over
   * {@link TRANSITION_MS}, requesting a render each frame via `onEnvUpdated`.
   */
  public setTimeOfDay(mode: TimeOfDay): void {
    this.currentMode = mode;
    this.currentMinutes = MODE_TO_MINUTES[mode];
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
