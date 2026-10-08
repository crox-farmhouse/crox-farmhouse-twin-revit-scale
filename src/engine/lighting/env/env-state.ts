import * as THREE from 'three';
import type { EnvPresetConfig, Vec3Tuple } from './env-presets.ts';

/** World-space box that must receive sun shadows (buildings, courtyard, garden). */
export interface ShadowFitBox {
  readonly min: Vec3Tuple;
  readonly max: Vec3Tuple;
}

/** Navigable site (`SITE_PIVOT_BOUNDS` x −40..30, z −20..35) up to roof ridges / tree tops. */
export const SITE_SHADOW_BOX: ShadowFitBox = { min: [-40, -0.5, -20], max: [30, 14, 35] };

/** Distance (m) from the shadow box centre to the directional light. */
const SUN_DISTANCE = 90;

/** Orthographic extents of a shadow camera fitted around a box, in light view space. */
export interface ShadowFrustum {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
  readonly near: number;
  readonly far: number;
}

/**
 * Computes the tightest orthographic shadow frustum around `box` for a directional light at
 * `position` looking at `target` (what three's `DirectionalLightShadow` does with `lookAt`).
 * Depends only on the sun direction, never on the camera, so shadows are identical in every view.
 */
export function fitShadowFrustum(
  position: THREE.Vector3,
  target: THREE.Vector3,
  box: ShadowFitBox,
  margin = 1.0
): ShadowFrustum {
  const view = new THREE.Matrix4().lookAt(position, target, new THREE.Vector3(0, 1, 0));
  view.setPosition(position);
  view.invert();
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  const p = new THREE.Vector3();
  for (let i = 0; i < 8; i++) {
    p.set(i & 1 ? box.max[0] : box.min[0], i & 2 ? box.max[1] : box.min[1], i & 4 ? box.max[2] : box.min[2]);
    p.applyMatrix4(view);
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
    minZ = Math.min(minZ, p.z);
    maxZ = Math.max(maxZ, p.z);
  }
  // The light looks down −Z in its own view space.
  return {
    left: minX - margin,
    right: maxX + margin,
    bottom: minY - margin,
    top: maxY + margin,
    near: Math.max(0.1, -maxZ - margin),
    far: -minZ + margin,
  };
}

/** Light position + target for a sun direction, centred on the shadow box. */
export function sunPlacement(
  direction: THREE.Vector3,
  box: ShadowFitBox = SITE_SHADOW_BOX
): { position: THREE.Vector3; target: THREE.Vector3 } {
  const target = new THREE.Vector3(
    (box.min[0] + box.max[0]) / 2,
    0,
    (box.min[2] + box.max[2]) / 2
  );
  const position = target.clone().addScaledVector(direction.clone().normalize(), SUN_DISTANCE);
  return { position, target };
}

/** The interpolatable (non-texture) part of the environment for smooth time-of-day transitions. */
export interface EnvLightingState {
  readonly sunDirection: THREE.Vector3;
  readonly sunColor: THREE.Color;
  sunIntensity: number;
  readonly hemiSkyColor: THREE.Color;
  readonly hemiGroundColor: THREE.Color;
  hemiIntensity: number;
  envIntensity: number;
  bgIntensity: number;
  bgBlurriness: number;
  exposure: number;
  readonly fogColor: THREE.Color;
  fogDensity: number;
}

export function stateFromPreset(cfg: EnvPresetConfig): EnvLightingState {
  return {
    sunDirection: new THREE.Vector3(...cfg.sunDirection).normalize(),
    sunColor: new THREE.Color(cfg.sunColor),
    sunIntensity: cfg.sunIntensity,
    hemiSkyColor: new THREE.Color(cfg.hemiSkyColor),
    hemiGroundColor: new THREE.Color(cfg.hemiGroundColor),
    hemiIntensity: cfg.hemiIntensity,
    envIntensity: cfg.envIntensity,
    bgIntensity: cfg.bgIntensity,
    bgBlurriness: cfg.bgBlurriness,
    exposure: cfg.exposure,
    fogColor: new THREE.Color(cfg.fogColor),
    fogDensity: cfg.fogDensity,
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Writes `from → to` at `t` (0..1) into `out`. Intensities and exposure interpolate geometrically
 * (perceptually even fades between e.g. 3.2 and 0.22), the sun direction along the great circle.
 */
export function lerpEnvState(
  from: EnvLightingState,
  to: EnvLightingState,
  t: number,
  out: EnvLightingState
): EnvLightingState {
  const k = Math.max(0, Math.min(1, t));
  const geo = (a: number, b: number): number =>
    a > 0 && b > 0 ? Math.exp(lerp(Math.log(a), Math.log(b), k)) : lerp(a, b, k);
  const dir = new THREE.Vector3().copy(from.sunDirection);
  const q = new THREE.Quaternion().setFromUnitVectors(from.sunDirection, to.sunDirection);
  const qk = new THREE.Quaternion().slerp(q, k);
  out.sunDirection.copy(dir.applyQuaternion(qk)).normalize();
  out.sunColor.copy(from.sunColor).lerp(to.sunColor, k);
  out.sunIntensity = geo(from.sunIntensity, to.sunIntensity);
  out.hemiSkyColor.copy(from.hemiSkyColor).lerp(to.hemiSkyColor, k);
  out.hemiGroundColor.copy(from.hemiGroundColor).lerp(to.hemiGroundColor, k);
  out.hemiIntensity = geo(from.hemiIntensity, to.hemiIntensity);
  out.envIntensity = geo(from.envIntensity, to.envIntensity);
  out.bgIntensity = geo(from.bgIntensity, to.bgIntensity);
  out.bgBlurriness = lerp(from.bgBlurriness, to.bgBlurriness, k);
  out.exposure = geo(from.exposure, to.exposure);
  out.fogColor.copy(from.fogColor).lerp(to.fogColor, k);
  out.fogDensity = geo(from.fogDensity, to.fogDensity);
  return out;
}

/** Copies every field of `src` into `dst`. */
export function copyEnvState(src: EnvLightingState, dst: EnvLightingState): EnvLightingState {
  return lerpEnvState(src, src, 1, dst);
}
