import * as THREE from 'three';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import type { TimeOfDay } from '../../../types/scene.ts';

interface EnvPresetConfig {
  readonly hdrUrl: string;
  readonly skyZenith: number;
  readonly skyHorizon: number;
  readonly horizonGlow: number;
  readonly groundPasture: number;
  readonly groundBounce: number;
  readonly sunOrbColor: number;
  readonly windowCardColor: number;
  readonly warmInteriorCard: number;
  readonly envIntensity: number;
  readonly bgIntensity: number;
  readonly hdrMaxClampEnv: number;
  readonly hdrMaxClampBg: number;
  readonly envRotationY: number;
  readonly sunPos: readonly [number, number, number];
  readonly sunColor: number;
  readonly sunIntensity: number;
  readonly hemiSkyColor: number;
  readonly hemiGroundColor: number;
  readonly hemiIntensity: number;
  readonly fogColor: number;
  readonly fogDensity: number;
}

const ENV_PRESETS: Readonly<Record<TimeOfDay, EnvPresetConfig>> = {
  day: {
    hdrUrl: '/textures/hdr/english_countryside_day_2k.hdr',
    skyZenith: 0x3b73b8,
    skyHorizon: 0xcbe0f2,
    horizonGlow: 0xf6efe2,
    groundPasture: 0x3c4d28,
    groundBounce: 0x2c381e,
    sunOrbColor: 0xfff8e8,
    windowCardColor: 0xffffff,
    warmInteriorCard: 0xffdfba,
    envIntensity: 0.20,
    bgIntensity: 1.10,
    hdrMaxClampEnv: 7.5,
    hdrMaxClampBg: 8.0,
    // Garden/Patio/Courtyard (+Z) is North-facing -> Geographic South is -Z, West is +X, East is -X.
    // Day sun in South-South-West (-Z, +X), shining over the Main House roof onto the North-facing garden
    // and illuminating the South-facing (-Z) courtyard facade of the Outbuildings/Barns.
    envRotationY: 1.81,
    sunPos: [6.5, 14.5, -13.5],
    sunColor: 0xfff5e4,
    sunIntensity: 0.95,
    hemiSkyColor: 0xe6eff8,
    hemiGroundColor: 0x4d593c,
    hemiIntensity: 0.45,
    fogColor: 0xc5d5e2,
    fogDensity: 0.0032,
  },
  dusk: {
    hdrUrl: '/textures/hdr/english_countryside_dusk_2k.hdr',
    skyZenith: 0x121b2e,
    skyHorizon: 0x7a4834,
    horizonGlow: 0xd97842,
    groundPasture: 0x161911,
    groundBounce: 0x10110c,
    sunOrbColor: 0xff9e58,
    windowCardColor: 0x5c708a,
    warmInteriorCard: 0xffc98c,
    envIntensity: 0.055,
    bgIntensity: 0.068,
    hdrMaxClampEnv: 3.5,
    hdrMaxClampBg: 3.0,
    // Dusk sunset in the West / West-North-West (+X, slightly +Z), casting warm evening light across the garden & pergola.
    envRotationY: 0.57,
    sunPos: [16.5, 5.2, 9.5],
    sunColor: 0xff9d5c,
    sunIntensity: 0.18,
    hemiSkyColor: 0x58647d,
    hemiGroundColor: 0x211c17,
    hemiIntensity: 0.16,
    fogColor: 0x161b24,
    fogDensity: 0.0055,
  },
  night: {
    hdrUrl: '/textures/hdr/english_countryside_night_2k.hdr',
    skyZenith: 0x070c18,
    skyHorizon: 0x152238,
    horizonGlow: 0x243654,
    groundPasture: 0x0d120c,
    groundBounce: 0x090c08,
    sunOrbColor: 0x9ab4dc,
    windowCardColor: 0x2a364b,
    warmInteriorCard: 0xffb974,
    envIntensity: 0.22,
    bgIntensity: 0.14,
    hdrMaxClampEnv: 8.0,
    hdrMaxClampBg: 6.5,
    // Night moon in the South-East (-Z, -X) sky.
    envRotationY: 2.70,
    sunPos: [-12.5, 10.5, -10.0],
    sunColor: 0x8ea8cc,
    sunIntensity: 0.14,
    hemiSkyColor: 0x3a4b6e,
    hemiGroundColor: 0x181c16,
    hemiIntensity: 0.18,
    fogColor: 0x090d16,
    fogDensity: 0.0065,
  },
};

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Sky / sun / fog / 2K English Countryside HDR environment & skybox for the property scene,
 * supporting `day`, `dusk`, and `night` modes.
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

  /** Creates the hemisphere + shadow-casting sun lights + English countryside HDR skybox & IBL maps. */
  public constructor(
    scene: THREE.Scene,
    renderer?: THREE.WebGLRenderer,
    onEnvUpdated?: () => void
  ) {
    this.scene = scene;
    this.renderer = renderer;
    this.onEnvUpdated = onEnvUpdated;

    this.hemiLight = new THREE.HemisphereLight(0xdcd8ce, 0x3d352e, 0.42);
    scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xffdfba, 0.65);
    this.sunLight.position.set(6.5, 14.5, -13.5);
    this.sunLight.target.position.set(-2.5, 0.0, 8.0);
    scene.add(this.sunLight.target);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.set(this.shadowMapSize, this.shadowMapSize);
    this.sunLight.shadow.camera.near = 2.0;
    this.sunLight.shadow.camera.far = 55.0;
    this.sunLight.shadow.camera.left = -24.0;
    this.sunLight.shadow.camera.right = 24.0;
    this.sunLight.shadow.camera.top = 18.0;
    this.sunLight.shadow.camera.bottom = -18.0;
    this.sunLight.shadow.camera.updateProjectionMatrix();
    this.sunLight.shadow.bias = -0.00018;
    this.sunLight.shadow.normalBias = 0.006;
    scene.add(this.sunLight);

    if (renderer) {
      this.bakeInstantProceduralHdrEnvironments(renderer);
      this.loadCountrysideHdrFiles(renderer);
    }
  }

  /**
   * Generates immediate procedural Float32 equirectangular English countryside HDR skyboxes
   * and PMREM IBL cubemaps on frame 0 so the scene has full HDR lighting and sky before
   * the 2K `.hdr` assets finish streaming.
   */
  private bakeInstantProceduralHdrEnvironments(renderer: THREE.WebGLRenderer): void {
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();

    const W = 512;
    const H = 256;
    const zenithCol = new THREE.Color();
    const horizonCol = new THREE.Color();
    const glowCol = new THREE.Color();
    const pastureCol = new THREE.Color();
    const groundCol = new THREE.Color();
    const sunCol = new THREE.Color();
    const tmpCol = new THREE.Color();

    for (const mode of ['day', 'dusk', 'night'] as const) {
      const cfg = ENV_PRESETS[mode];
      zenithCol.setHex(cfg.skyZenith);
      horizonCol.setHex(cfg.skyHorizon);
      glowCol.setHex(cfg.horizonGlow);
      pastureCol.setHex(cfg.groundPasture);
      groundCol.setHex(cfg.groundBounce);
      sunCol.setHex(cfg.sunOrbColor);

      const data = new Float32Array(W * H * 4);
      const sunU = 0.60;
      const sunV = mode === 'day' ? 0.34 : mode === 'dusk' ? 0.45 : 0.405;
      const sunPeak = mode === 'day' ? 6.5 : mode === 'dusk' ? 4.5 : 3.2;

      for (let y = 0; y < H; y++) {
        // Row 0 is top (zenith) when flipY = true
        const vTop = y / (H - 1);
        const elevation = (0.5 - vTop) * Math.PI; // +pi/2 at zenith, 0 at horizon, -pi/2 at nadir

        for (let x = 0; x < W; x++) {
          const u = x / W;
          const az = u * Math.PI * 2;
          // Rolling English countryside hedgerow silhouette height along the horizon
          const hedgerowH =
            0.012 +
            0.008 * Math.sin(az * 5.0 + 0.7) +
            0.005 * Math.cos(az * 13.0 - 1.2) +
            0.003 * Math.sin(az * 29.0 + 2.1);

          const du = Math.min(Math.abs(u - sunU), 1 - Math.abs(u - sunU));
          const dv = vTop - sunV;
          const sunDist = Math.hypot(du * 2.0, dv);

          if (elevation >= 0) {
            const ny = Math.sin(elevation);
            const tZenith = Math.pow(ny, 0.52);
            tmpCol.copy(horizonCol).lerp(zenithCol, tZenith);

            // Warm solar/twilight glow near the sun azimuth on the horizon
            const glowFactor = Math.exp(-sunDist * 3.2) * (1 - ny * 0.65);
            tmpCol.lerp(glowCol, Math.min(0.85, glowFactor));

            // Soft procedural cumulus/cirrus cloud wisps
            const cloudWave =
              0.5 +
              0.3 * Math.sin(az * 6.0 + ny * 9.0) +
              0.2 * Math.cos(az * 15.0 - ny * 14.0);
            const cloudBand = smoothstep(0.06, 0.35, ny) * (1 - smoothstep(0.55, 0.92, ny));
            const cloudStrength = Math.max(0, cloudWave - 0.45) * cloudBand * 0.45;
            tmpCol.lerp(glowCol, cloudStrength);

            // Distant English hedgerow treeline silhouette right along the horizon
            if (ny < hedgerowH) {
              const treeMix = smoothstep(hedgerowH, hedgerowH * 0.35, ny);
              tmpCol.lerp(groundCol, treeMix * 0.82);
            }

            // Sun / Moon disc & corona
            const disc = Math.exp(-sunDist * sunDist * 1400.0) * sunPeak;
            const corona = Math.exp(-sunDist * 9.5) * (sunPeak * 0.14);
            tmpCol.r += sunCol.r * (disc + corona);
            tmpCol.g += sunCol.g * (disc + corona);
            tmpCol.b += sunCol.b * (disc + corona);
          } else {
            const nyDown = Math.sin(-elevation);
            const tGround = smoothstep(0.0, 0.38, nyDown);
            tmpCol.copy(pastureCol).lerp(groundCol, tGround);
          }

          const idx = (y * W + x) * 4;
          data[idx] = tmpCol.r;
          data[idx + 1] = tmpCol.g;
          data[idx + 2] = tmpCol.b;
          data[idx + 3] = 1.0;
        }
      }

      const procTex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat, THREE.FloatType);
      procTex.colorSpace = THREE.LinearSRGBColorSpace;
      procTex.mapping = THREE.EquirectangularReflectionMapping;
      procTex.minFilter = THREE.LinearFilter;
      procTex.magFilter = THREE.LinearFilter;
      procTex.flipY = true;
      procTex.needsUpdate = true;

      const pmremTarget = pmrem.fromEquirectangular(procTex);
      this.bgMaps[mode] = procTex;
      this.envMaps[mode] = pmremTarget.texture;
    }

    pmrem.dispose();
  }

  /**
   * Asynchronously loads the 2K Radiance `.hdr` English countryside panoramas for
   * `day` (`autumn_field_2k`), `dusk` (`evening_field_2k`), and `night` (`kloppenheim_02_2k`),
   * applies a smooth nadir pasture ground-plane blend so close-up tripod grass blades don't
   * appear distorted beneath the 3D estate in top-down orbit views, and precomputes PMREM IBL maps.
   */
  private loadCountrysideHdrFiles(renderer: THREE.WebGLRenderer): void {
    const loader = new HDRLoader().setDataType(THREE.FloatType);

    for (const mode of ['day', 'dusk', 'night'] as const) {
      const cfg = ENV_PRESETS[mode];
      loader.load(
        cfg.hdrUrl,
        (loadedTex) => {
          const img = loadedTex.image as { width: number; height: number; data: Float32Array };
          if (!img || !img.data) return;

          const W = img.width;
          const H = img.height;
          const bgData = img.data;
          const envData = new Float32Array(bgData.length);

          // Sample the distant English meadow band (`vTop = 0.525..0.540`) to build a smooth,
          // natural countryside pasture ground plane for the lower nadir (`vTop > 0.545`).
          const yBand0 = Math.floor(H * 0.525);
          const yBand1 = Math.floor(H * 0.540);
          const colR = new Float32Array(W);
          const colG = new Float32Array(W);
          const colB = new Float32Array(W);
          let avgR = 0;
          let avgG = 0;
          let avgB = 0;

          const bandRows = Math.max(1, yBand1 - yBand0);
          for (let x = 0; x < W; x++) {
            let sr = 0;
            let sg = 0;
            let sb = 0;
            for (let y = yBand0; y < yBand1; y++) {
              const i = (y * W + x) * 4;
              sr += Math.min(bgData[i]!, 2.0);
              sg += Math.min(bgData[i + 1]!, 2.0);
              sb += Math.min(bgData[i + 2]!, 2.0);
            }
            colR[x] = sr / bandRows;
            colG[x] = sg / bandRows;
            colB[x] = sb / bandRows;
            avgR += colR[x]!;
            avgG += colG[x]!;
            avgB += colB[x]!;
          }
          avgR /= W;
          avgG /= W;
          avgB /= W;

          // Box-blur the horizon pasture ring horizontally so the ground transition is silky-smooth
          const smoothColR = new Float32Array(W);
          const smoothColG = new Float32Array(W);
          const smoothColB = new Float32Array(W);
          const blurRadius = 24;
          for (let x = 0; x < W; x++) {
            let sr = 0;
            let sg = 0;
            let sb = 0;
            for (let dx = -blurRadius; dx <= blurRadius; dx++) {
              const xw = (x + dx + W) % W;
              sr += colR[xw]!;
              sg += colG[xw]!;
              sb += colB[xw]!;
            }
            const inv = 1 / (blurRadius * 2 + 1);
            smoothColR[x] = sr * inv;
            smoothColG[x] = sg * inv;
            smoothColB[x] = sb * inv;
          }

          const yNadirStart = Math.floor(H * 0.542);
          const yNadirFull = Math.floor(H * 0.66);

          for (let y = 0; y < H; y++) {
            const vTop = y / (H - 1);
            const nadirBlend =
              y > yNadirStart ? smoothstep(yNadirStart, yNadirFull, y) : 0;
            const deepNadirMix =
              y > yNadirStart ? smoothstep(yNadirStart, H - 1, y) * 0.72 : 0;
            // Deepen the upper twilight dome in dusk mode so zenith is rich civil-twilight indigo
            // while preserving the warm amber sunset band near the horizon (`vTop = 0.42..0.52`).
            const duskZenithFactor =
              mode === 'dusk' && vTop < 0.48
                ? smoothstep(0.48, 0.05, vTop)
                : 0;

            for (let x = 0; x < W; x++) {
              const i = (y * W + x) * 4;
              let r = bgData[i]!;
              let g = bgData[i + 1]!;
              let b = bgData[i + 2]!;

              if (duskZenithFactor > 0) {
                r *= 1 - duskZenithFactor * 0.72;
                g *= 1 - duskZenithFactor * 0.58;
                b *= 1 - duskZenithFactor * 0.35;
              }

              if (nadirBlend > 0) {
                const pr = smoothColR[x]! * (1 - deepNadirMix) + avgR * 0.65 * deepNadirMix;
                const pg = smoothColG[x]! * (1 - deepNadirMix) + avgG * 0.65 * deepNadirMix;
                const pb = smoothColB[x]! * (1 - deepNadirMix) + avgB * 0.65 * deepNadirMix;
                r = r * (1 - nadirBlend) + pr * nadirBlend;
                g = g * (1 - nadirBlend) + pg * nadirBlend;
                b = b * (1 - nadirBlend) + pb * nadirBlend;
              }

              // Soft knee compression for extreme single-pixel sun/moon spikes
              const peak = Math.max(r, g, b);
              if (peak > cfg.hdrMaxClampBg) {
                const scaleBg = cfg.hdrMaxClampBg / peak;
                bgData[i] = r * scaleBg;
                bgData[i + 1] = g * scaleBg;
                bgData[i + 2] = b * scaleBg;
              } else {
                bgData[i] = r;
                bgData[i + 1] = g;
                bgData[i + 2] = b;
              }
              bgData[i + 3] = 1.0;

              if (peak > cfg.hdrMaxClampEnv) {
                const scaleEnv = cfg.hdrMaxClampEnv / peak;
                envData[i] = r * scaleEnv;
                envData[i + 1] = g * scaleEnv;
                envData[i + 2] = b * scaleEnv;
              } else {
                envData[i] = r;
                envData[i + 1] = g;
                envData[i + 2] = b;
              }
              envData[i + 3] = 1.0;
            }
          }

          loadedTex.colorSpace = THREE.LinearSRGBColorSpace;
          loadedTex.mapping = THREE.EquirectangularReflectionMapping;
          loadedTex.minFilter = THREE.LinearFilter;
          loadedTex.magFilter = THREE.LinearFilter;
          loadedTex.flipY = true;
          loadedTex.needsUpdate = true;

          const envSourceTex = new THREE.DataTexture(
            envData,
            W,
            H,
            THREE.RGBAFormat,
            THREE.FloatType
          );
          envSourceTex.colorSpace = THREE.LinearSRGBColorSpace;
          envSourceTex.mapping = THREE.EquirectangularReflectionMapping;
          envSourceTex.minFilter = THREE.LinearFilter;
          envSourceTex.magFilter = THREE.LinearFilter;
          envSourceTex.flipY = true;
          envSourceTex.needsUpdate = true;

          const pmrem = new THREE.PMREMGenerator(renderer);
          pmrem.compileEquirectangularShader();
          const pmremTarget = pmrem.fromEquirectangular(envSourceTex);
          envSourceTex.dispose();
          pmrem.dispose();

          const prevBg = this.bgMaps[mode];
          const prevEnv = this.envMaps[mode];
          this.bgMaps[mode] = loadedTex;
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
          // Keep procedural English countryside HDR fallback if network/asset load fails
        }
      );
    }
  }

  private applyEnvironmentTextures(mode: TimeOfDay): void {
    const cfg = ENV_PRESETS[mode];
    const bgTex = this.bgMaps[mode];
    const envTex = this.envMaps[mode];

    if (bgTex) {
      this.scene.background = bgTex;
      this.scene.backgroundIntensity = cfg.bgIntensity;
      this.scene.backgroundBlurriness = 0.0;
      this.scene.backgroundRotation.set(0, cfg.envRotationY, 0);
    } else if (this.scene.background instanceof THREE.Color) {
      this.scene.background.setHex(cfg.fogColor);
    } else {
      this.scene.background = new THREE.Color(cfg.fogColor);
    }

    if (envTex) {
      this.scene.environment = envTex;
      this.scene.environmentIntensity = cfg.envIntensity;
      this.scene.environmentRotation.set(0, cfg.envRotationY, 0);
    }
  }

  public getShadowMapSize(): 1024 | 2048 | 4096 {
    return this.shadowMapSize;
  }

  /**
   * Changes the sun shadow-map resolution (graphics tier). Only the shadow texture resolution changes:
   * the shadow frustum, bias and light intensities stay fixed, and nothing here depends on the camera
   * position, zoom or projection, so lighting looks the same in every view.
   */
  public setShadowMapSize(size: 1024 | 2048 | 4096): void {
    if (size === this.shadowMapSize) return;
    this.shadowMapSize = size;
    const shadow = this.sunLight.shadow;
    shadow.map?.dispose();
    shadow.map = null;
    shadow.mapSize.set(size, size);
    shadow.needsUpdate = true;
    if (this.renderer) {
      this.renderer.shadowMap.needsUpdate = true;
    }
  }

  public setTimeOfDay(mode: TimeOfDay): void {
    this.currentMode = mode;
    const cfg = ENV_PRESETS[mode];

    const fog = this.scene.fog as THREE.FogExp2 | null;
    if (fog) {
      fog.color.setHex(cfg.fogColor);
      fog.density = cfg.fogDensity;
    }

    this.hemiLight.intensity = cfg.hemiIntensity;
    this.hemiLight.color.setHex(cfg.hemiSkyColor);
    this.hemiLight.groundColor.setHex(cfg.hemiGroundColor);

    this.sunLight.intensity = cfg.sunIntensity;
    this.sunLight.color.setHex(cfg.sunColor);
    this.sunLight.position.set(cfg.sunPos[0], cfg.sunPos[1], cfg.sunPos[2]);

    this.applyEnvironmentTextures(mode);
  }
}
