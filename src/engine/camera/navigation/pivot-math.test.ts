import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { PIVOT_MAX_DISTANCE, SITE_PIVOT_BOUNDS, clampPivot, computeFramingPose } from './pivot-math.ts';
import type { NavigationBounds } from './pivot-math.ts';

const BOX: NavigationBounds = { minX: -10, maxX: 10, minY: 0, maxY: 5, minZ: -10, maxZ: 10 };

describe('clampPivot', () => {
  it('leaves a valid pivot untouched', () => {
    const cam = new THREE.Vector3(0, 3, 8);
    const pivot = new THREE.Vector3(1, 1, 1);
    const r = clampPivot(cam, pivot, BOX, 25);
    expect(r.changed).toBe(false);
    expect(r.onViewRay).toBe(true);
    expect(r.pivot.equals(pivot)).toBe(true);
    expect(r.pivot).not.toBe(pivot);
  });

  it('slides a too-distant pivot along the view ray', () => {
    const cam = new THREE.Vector3(0, 1, 0);
    // Site bounds extend to x = 30, so the 25 m distance cap binds first.
    const pivot = new THREE.Vector3(100, 1, 0);
    const r = clampPivot(cam, pivot, SITE_PIVOT_BOUNDS, PIVOT_MAX_DISTANCE);
    expect(r.changed).toBe(true);
    expect(r.onViewRay).toBe(true);
    expect(r.pivot.distanceTo(cam)).toBeCloseTo(PIVOT_MAX_DISTANCE, 6);
    expect(r.pivot.z).toBeCloseTo(0, 6);
    expect(r.pivot.y).toBeCloseTo(1, 6);
  });

  it('pulls an out-of-bounds pivot back to where the ray exits the box', () => {
    const cam = new THREE.Vector3(0, 1, 0);
    const r = clampPivot(cam, new THREE.Vector3(20, 1, 0), BOX, 100);
    expect(r.onViewRay).toBe(true);
    expect(r.pivot.x).toBeCloseTo(10, 6);
  });

  it('hard-clamps when the view ray never enters the valid region', () => {
    const cam = new THREE.Vector3(0, 50, 0);
    const pivot = new THREE.Vector3(0, 60, 0);
    const r = clampPivot(cam, pivot, BOX, 100);
    expect(r.onViewRay).toBe(false);
    expect(r.changed).toBe(true);
    expect(r.pivot.y).toBe(BOX.maxY);
  });

  it('treats a pivot at the camera position as unchanged', () => {
    const p = new THREE.Vector3(1, 1, 1);
    expect(clampPivot(p, p.clone(), BOX).changed).toBe(false);
  });
});

describe('computeFramingPose', () => {
  const opts = {
    currentTarget: new THREE.Vector3(0, 0, 0),
    elevationDeg: 45,
    minDistance: 2,
    maxDistance: 200,
    orthoHalfHeight: 20,
    minZoom: 0.2,
    maxZoom: 8,
  };

  it('targets the box centre and keeps the current azimuth (perspective)', () => {
    const camera = new THREE.PerspectiveCamera(50, 1.5, 0.1, 1000);
    camera.position.set(0, 10, 30);
    const pose = computeFramingPose(BOX, { ...opts, camera });
    expect(pose.target.toArray()).toEqual([0, 2.5, 0]);
    const offset = pose.position.clone().sub(pose.target);
    expect(offset.x).toBeCloseTo(0, 6);
    expect(offset.z).toBeGreaterThan(0);
    // 45° elevation: vertical rise equals horizontal run.
    expect(offset.y).toBeCloseTo(Math.hypot(offset.x, offset.z), 6);
    expect(offset.length()).toBeGreaterThanOrEqual(opts.minDistance);
    expect(offset.length()).toBeLessThanOrEqual(opts.maxDistance);
    expect(pose.orthoZoom).toBe(1);
  });

  it('computes a clamped zoom for orthographic cameras', () => {
    const camera = new THREE.OrthographicCamera(-30, 30, 20, -20, 0.1, 1000);
    camera.position.set(30, 10, 0);
    const pose = computeFramingPose(BOX, { ...opts, camera });
    expect(pose.orthoZoom).toBeGreaterThanOrEqual(opts.minZoom);
    expect(pose.orthoZoom).toBeLessThanOrEqual(opts.maxZoom);
    expect(pose.position.x - pose.target.x).toBeGreaterThan(0);
  });
});
