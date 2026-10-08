import type { TimeOfDay } from '../../../core/types/scene.ts';

/** World-space vector as a readonly tuple (metres / unit direction). */
export type Vec3Tuple = readonly [number, number, number];

/**
 * Per-time-of-day environment preset. Everything here is camera-independent: the same values apply
 * to perspective, orthographic, walkthrough and top-down views.
 */
export interface EnvPresetConfig {
  /** 2K Radiance `.hdr` panorama (CC0, Poly Haven — see public/textures/hdr/README.md). */
  readonly hdrUrl: string;
  /** Horizontal texture coordinate (0..1) of the sun / moon disc in the HDR panorama. */
  readonly hdrSunU: number;
  /** Vertical texture coordinate (0 = zenith, 1 = nadir) of the sun / moon disc in the HDR panorama. */
  readonly hdrSunV: number;
  // Procedural fallback sky colours (used until the 2K HDR has streamed in, or if it fails to load).
  readonly skyZenith: number;
  readonly skyHorizon: number;
  readonly horizonGlow: number;
  readonly groundPasture: number;
  readonly groundBounce: number;
  readonly sunOrbColor: number;
  readonly sunOrbPeak: number;
  /** Image-based lighting strength (`scene.environmentIntensity`). */
  readonly envIntensity: number;
  /** Skybox brightness (`scene.backgroundIntensity`), independent from the IBL strength. */
  readonly bgIntensity: number;
  /** Skybox blur (`scene.backgroundBlurriness`); a touch of blur reads as aerial depth of field. */
  readonly bgBlurriness: number;
  /** Peak radiance kept in the IBL source; the sun disc is removed because the shadowed sun light replaces it. */
  readonly hdrMaxClampEnv: number;
  /** Peak radiance kept in the visible skybox (soft knee on the sun disc). */
  readonly hdrMaxClampBg: number;
  /** Extra darkening of the upper dome (0 = none) for a deeper twilight zenith. */
  readonly zenithDarkening: number;
  /** Direction *towards* the sun / moon (normalised at use). */
  readonly sunDirection: Vec3Tuple;
  readonly sunColor: number;
  readonly sunIntensity: number;
  readonly hemiSkyColor: number;
  readonly hemiGroundColor: number;
  readonly hemiIntensity: number;
  /** Renderer tone-mapping exposure for this time of day (the post pipeline reads it from the renderer). */
  readonly exposure: number;
  /** World-space site haze colour (also the fallback background colour). */
  readonly fogColor: number;
  /** Exp² haze density per metre *beyond the site radius* (camera-independent; see site-haze-fog.ts). */
  readonly fogDensity: number;
}

const HDR_BASE = `${import.meta.env?.BASE_URL ?? '/'}textures/hdr/`;

/**
 * Site orientation: the garden / patio / courtyard (+Z) faces north, so geographic south is −Z,
 * west is +X and east is −X.
 */
export const ENV_PRESETS: Readonly<Record<TimeOfDay, EnvPresetConfig>> = {
  day: {
    // Poly Haven "meadow_2" (CC0): clear blue sky, hedgerow trees, sun ~27° high.
    hdrUrl: `${HDR_BASE}english_countryside_day_2k.hdr`,
    hdrSunU: 0.6,
    hdrSunV: 0.35,
    skyZenith: 0x3b73b8,
    skyHorizon: 0xcbe0f2,
    horizonGlow: 0xf6efe2,
    groundPasture: 0x3c4d28,
    groundBounce: 0x2c381e,
    sunOrbColor: 0xfff8e8,
    sunOrbPeak: 6.5,
    envIntensity: 0.9,
    bgIntensity: 1.0,
    bgBlurriness: 0.03,
    hdrMaxClampEnv: 6.0,
    hdrMaxClampBg: 24.0,
    zenithDarkening: 0,
    // Late-morning sun in the south-south-west, ~40° high, over the main house onto the north garden
    // and the south-facing courtyard facade of the outbuildings.
    sunDirection: [0.29, 0.64, -0.71],
    // ~5800 K daylight.
    sunColor: 0xfff2e6,
    sunIntensity: 3.2,
    hemiSkyColor: 0xdfeaf7,
    hemiGroundColor: 0x55603f,
    hemiIntensity: 0.18,
    exposure: 1.0,
    fogColor: 0xcad9e8,
    fogDensity: 0.0042,
  },
  dusk: {
    // Poly Haven "spruit_sunrise" (CC0): low golden sun ~8° above a hazy field horizon.
    hdrUrl: `${HDR_BASE}english_countryside_dusk_2k.hdr`,
    hdrSunU: 0.6,
    hdrSunV: 0.455,
    skyZenith: 0x1d2c4a,
    skyHorizon: 0xa8704a,
    horizonGlow: 0xf0a060,
    groundPasture: 0x2a2c18,
    groundBounce: 0x1a1c10,
    sunOrbColor: 0xffb070,
    sunOrbPeak: 5.0,
    envIntensity: 0.32,
    bgIntensity: 0.62,
    bgBlurriness: 0.03,
    hdrMaxClampEnv: 4.0,
    hdrMaxClampBg: 16.0,
    zenithDarkening: 0.55,
    // Setting sun in the west-north-west, ~11° high, raking warm light across the garden and pergola.
    sunDirection: [0.85, 0.2, 0.49],
    // ~2900 K golden hour.
    sunColor: 0xffb46e,
    sunIntensity: 1.55,
    hemiSkyColor: 0x6a7392,
    hemiGroundColor: 0x2a2018,
    hemiIntensity: 0.06,
    exposure: 1.1,
    fogColor: 0x9c8574,
    fogDensity: 0.0055,
  },
  night: {
    // Poly Haven "kloppenheim_02" (CC0): moonlit field with distant village glow.
    hdrUrl: `${HDR_BASE}english_countryside_night_2k.hdr`,
    hdrSunU: 0.6,
    hdrSunV: 0.405,
    skyZenith: 0x070c18,
    skyHorizon: 0x152238,
    horizonGlow: 0x243654,
    groundPasture: 0x0d120c,
    groundBounce: 0x090c08,
    sunOrbColor: 0x9ab4dc,
    sunOrbPeak: 3.2,
    // Kept low so interiors are lit by the fittings, not washed by sky IBL.
    envIntensity: 0.06,
    bgIntensity: 0.12,
    bgBlurriness: 0,
    hdrMaxClampEnv: 4.0,
    hdrMaxClampBg: 6.5,
    zenithDarkening: 0,
    // Moon in the south-east sky, ~35° high.
    sunDirection: [-0.6, 0.57, -0.56],
    sunColor: 0x9fb6e6,
    sunIntensity: 0.22,
    hemiSkyColor: 0x34466a,
    hemiGroundColor: 0x14181a,
    hemiIntensity: 0.05,
    exposure: 1.12,
    fogColor: 0x0a0f1a,
    fogDensity: 0.007,
  },
};

/**
 * Y rotation (radians) for `scene.environmentRotation` / `scene.backgroundRotation` that puts the
 * HDR's sun disc (at texture column `hdrSunU`) on the azimuth of the world-space `sunDirection`.
 *
 * three.js maps a world direction to `u = atan2(z, x) / 2π + 0.5`, and an environment rotation of θ
 * moves panorama azimuth φ to world azimuth φ − θ, so θ = φ_hdr − φ_world.
 */
export function environmentRotationForSun(sunDirection: Vec3Tuple, hdrSunU: number): number {
  const hdrAzimuth = (hdrSunU - 0.5) * Math.PI * 2;
  const worldAzimuth = Math.atan2(sunDirection[2], sunDirection[0]);
  let theta = hdrAzimuth - worldAzimuth;
  while (theta > Math.PI) theta -= Math.PI * 2;
  while (theta <= -Math.PI) theta += Math.PI * 2;
  return theta;
}
