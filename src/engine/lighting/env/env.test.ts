import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { ENV_PRESETS, environmentRotationForSun } from './env-presets.ts';
import {
  SITE_SHADOW_BOX,
  copyEnvState,
  fitShadowFrustum,
  lerpEnvState,
  stateFromPreset,
  sunPlacement,
} from './env-state.ts';
import { buildOrthoSafeBackgroundVertexShader } from './background-projection.ts';
import { buildSiteHazeFogVertexChunk } from './site-haze-fog.ts';

/** World azimuth at which three.js shows a panorama column `u` under environment rotation `theta`. */
function worldAzimuthOfPanoramaColumn(u: number, theta: number): number {
  const hdrAzimuth = (u - 0.5) * Math.PI * 2;
  // three rotates the lookup direction by −θ, so panorama azimuth φ appears at world azimuth φ − θ.
  const dir = new THREE.Vector3(Math.cos(hdrAzimuth), 0, Math.sin(hdrAzimuth));
  dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), theta);
  return Math.atan2(dir.z, dir.x);
}

describe('environmentRotationForSun', () => {
  it.each(['day', 'dusk', 'night'] as const)('puts the %s HDR sun disc on the sun light azimuth', (mode) => {
    const cfg = ENV_PRESETS[mode];
    const theta = environmentRotationForSun(cfg.sunDirection, cfg.hdrSunU);
    const expected = Math.atan2(cfg.sunDirection[2], cfg.sunDirection[0]);
    const actual = worldAzimuthOfPanoramaColumn(cfg.hdrSunU, theta);
    const diff = Math.atan2(Math.sin(actual - expected), Math.cos(actual - expected));
    expect(Math.abs(diff)).toBeLessThan(1e-9);
    expect(theta).toBeGreaterThan(-Math.PI);
    expect(theta).toBeLessThanOrEqual(Math.PI);
  });

  it('matches the hand-tuned legacy day rotation for the legacy sun position', () => {
    expect(Math.abs(environmentRotationForSun([6.5, 14.5, -13.5], 0.6) - 1.81)).toBeLessThan(0.1);
  });
});

describe('presets', () => {
  it('reads as daylight > dusk > night', () => {
    const { day, dusk, night } = ENV_PRESETS;
    expect(day.sunIntensity).toBeGreaterThan(dusk.sunIntensity);
    expect(dusk.sunIntensity).toBeGreaterThan(night.sunIntensity);
    expect(day.envIntensity).toBeGreaterThan(dusk.envIntensity);
    expect(dusk.envIntensity).toBeGreaterThan(night.envIntensity);
    // Night IBL and hemi fill stay low so interiors are lit by the fittings.
    expect(night.envIntensity).toBeLessThanOrEqual(0.1);
    expect(night.hemiIntensity).toBeLessThanOrEqual(0.1);
    expect(dusk.hemiIntensity).toBeLessThanOrEqual(0.1);
  });

  it('keeps the sun above the horizon', () => {
    for (const cfg of Object.values(ENV_PRESETS)) {
      expect(cfg.sunDirection[1]).toBeGreaterThan(0);
    }
  });
});

describe('fitShadowFrustum', () => {
  it.each(['day', 'dusk', 'night'] as const)('contains every site corner for the %s sun', (mode) => {
    const dir = new THREE.Vector3(...ENV_PRESETS[mode].sunDirection).normalize();
    const { position, target } = sunPlacement(dir);
    const f = fitShadowFrustum(position, target, SITE_SHADOW_BOX, 0);
    const cam = new THREE.OrthographicCamera(f.left, f.right, f.top, f.bottom, f.near, f.far);
    cam.position.copy(position);
    cam.lookAt(target);
    cam.updateMatrixWorld();
    cam.updateProjectionMatrix();
    const b = SITE_SHADOW_BOX;
    for (let i = 0; i < 8; i++) {
      const p = new THREE.Vector3(
        i & 1 ? b.max[0] : b.min[0],
        i & 2 ? b.max[1] : b.min[1],
        i & 4 ? b.max[2] : b.min[2]
      ).project(cam);
      expect(Math.abs(p.x)).toBeLessThanOrEqual(1 + 1e-6);
      expect(Math.abs(p.y)).toBeLessThanOrEqual(1 + 1e-6);
      expect(Math.abs(p.z)).toBeLessThanOrEqual(1 + 1e-6);
    }
    expect(f.near).toBeGreaterThan(0);
  });
});

describe('lerpEnvState', () => {
  it('hits both endpoints and stays between them', () => {
    const a = stateFromPreset(ENV_PRESETS.day);
    const b = stateFromPreset(ENV_PRESETS.night);
    const out = stateFromPreset(ENV_PRESETS.dusk);
    lerpEnvState(a, b, 0, out);
    expect(out.sunIntensity).toBeCloseTo(a.sunIntensity);
    expect(out.sunDirection.distanceTo(a.sunDirection)).toBeLessThan(1e-6);
    lerpEnvState(a, b, 1, out);
    expect(out.exposure).toBeCloseTo(b.exposure);
    expect(out.sunDirection.distanceTo(b.sunDirection)).toBeLessThan(1e-6);
    lerpEnvState(a, b, 0.5, out);
    expect(out.envIntensity).toBeLessThan(a.envIntensity);
    expect(out.envIntensity).toBeGreaterThan(b.envIntensity);
    expect(out.sunDirection.length()).toBeCloseTo(1);
  });

  it('copies state', () => {
    const a = stateFromPreset(ENV_PRESETS.day);
    const out = copyEnvState(a, stateFromPreset(ENV_PRESETS.night));
    expect(out.fogColor.getHex()).toBe(a.fogColor.getHex());
    expect(out.fogDensity).toBeCloseTo(a.fogDensity);
  });
});

describe('site haze fog chunk', () => {
  it('uses world-space distance beyond the site footprint, not camera depth', () => {
    const chunk = buildSiteHazeFogVertexChunk({ centerX: -5, centerZ: 7.5, radius: 38 });
    expect(chunk).toContain('vec2( -5.0, 7.5 )');
    expect(chunk).toContain('- 38.0');
    expect(chunk).not.toContain('-mvPosition.z');
    expect(chunk).not.toContain('- mvPosition.z');
  });
});

describe('ortho-safe background', () => {
  it('scales the background box only under orthographic projection, idempotently', () => {
    const once = buildOrthoSafeBackgroundVertexShader(THREE.ShaderLib.backgroundCube.vertexShader);
    expect(once).toContain('projectionMatrix[ 3 ][ 3 ] == 1.0 ? 1.0e4 : 1.0');
    expect(once).not.toContain('#include <begin_vertex>');
    expect(buildOrthoSafeBackgroundVertexShader(once)).toBe(once);
  });
});
