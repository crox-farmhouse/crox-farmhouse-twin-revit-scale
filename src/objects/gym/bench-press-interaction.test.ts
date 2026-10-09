import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
  BENCH_RACK_Y,
  GYM_BENCH_PRESS_ID,
  GymBenchPressController,
  TOTAL_BENCH_DURATION_SEC,
} from './bench-press-interaction.ts';

const GYM_FLOOR_Y = -0.488;
const OB_ROT = Math.atan2(2.49, 28.98);
const OB_COS = Math.cos(OB_ROT);
const OB_SIN = Math.sin(OB_ROT);

function createTestSquatRackRig() {
  const rackGroup = new THREE.Group();
  rackGroup.name = 'outbuildings.gym.nikeSquatRack';
  rackGroup.position.set(1.52, GYM_FLOOR_Y, 4.02);
  rackGroup.rotation.y = Math.PI;

  const barbellGroup = new THREE.Group();
  barbellGroup.name = 'outbuildings.gym.nikeSquatRack.barbell';
  barbellGroup.position.set(0, 1.34, -0.172);
  const barShaft = new THREE.Mesh();
  barbellGroup.add(barShaft);
  rackGroup.add(barbellGroup);

  const benchGroup = new THREE.Group();
  benchGroup.name = 'outbuildings.gym.nikeSquatRack.bench';
  benchGroup.position.set(0.18, 0, 0.86);
  benchGroup.rotation.y = 0.06;
  const benchPad = new THREE.Mesh();
  benchGroup.add(benchPad);
  rackGroup.add(benchGroup);

  const jCupOffsets = [0.02, -0.028, -0.01, 0.02, -0.028, -0.01];
  const jCupMeshes = jCupOffsets.map((dy, idx) => {
    const m = new THREE.Mesh();
    m.name = `jCup.${idx}`;
    m.position.set(idx < 3 ? -0.56 : 0.56, 1.34 + dy, -0.172);
    rackGroup.add(m);
    return { mesh: m, restY: m.position.y };
  });

  const controller = new GymBenchPressController({
    rackGroup,
    barbellGroup,
    benchGroup,
    jCupMeshes,
    gymFloorY: GYM_FLOOR_Y,
    clickableTargets: [rackGroup],
  });

  return {
    rackGroup,
    barbellGroup,
    barShaft,
    benchGroup,
    benchPad,
    jCupMeshes,
    controller,
  };
}

describe('GymBenchPressController', () => {
  it('exposes expected id, label, aliases, and idle prompt', () => {
    const { controller, rackGroup } = createTestSquatRackRig();
    expect(controller.id).toBe(GYM_BENCH_PRESS_ID);
    expect(controller.label).toBe('Nike Squat Rack & Bench Press');
    expect(controller.aliases).toContain('bench press');
    expect(controller.aliases).toContain('squat rack');
    expect(controller.clickableTargets).toEqual([rackGroup]);
    expect(controller.describe()).toBe('Bench Press on Squat Rack (102 kg)');
    expect(controller.isFirstPersonActive()).toBe(false);
    expect(controller.sampleFirstPersonPose()).toBeNull();
    expect(controller.step(0.1)).toBe(false);
  });

  it('collects barbell, bench, and J-cup meshes as dynamic objects', () => {
    const { controller, barbellGroup, barShaft, benchGroup, benchPad, jCupMeshes } =
      createTestSquatRackRig();
    const dynamicSet = new Set<THREE.Object3D>();
    controller.collectDynamicObjects(dynamicSet);
    expect(dynamicSet.has(barbellGroup)).toBe(true);
    expect(dynamicSet.has(barShaft)).toBe(true);
    expect(dynamicSet.has(benchGroup)).toBe(true);
    expect(dynamicSet.has(benchPad)).toBe(true);
    for (const jCup of jCupMeshes) {
      expect(dynamicSet.has(jCup.mesh)).toBe(true);
    }
  });

  it('choreographs setup, unrack, 3 reps (clean, sticking point, grinder), and full restoration at 7.4s', () => {
    const { controller, barbellGroup, benchGroup, jCupMeshes } = createTestSquatRackRig();

    expect(controller.trigger()).toBe(true);
    expect(controller.isFirstPersonActive()).toBe(true);
    expect(controller.describe()).toBe('Rack Barbell & Stand Up');

    // 1. Setup complete at t = 1.05s: bench centered under uprights, rack lowered to 0.88m, camera lying back
    expect(controller.step(1.05)).toBe(true);
    expect(benchGroup.position.x).toBeCloseTo(0, 4);
    expect(benchGroup.position.z).toBeCloseTo(0.24, 4);
    expect(benchGroup.rotation.y).toBeCloseTo(0, 4);
    expect(barbellGroup.position.y).toBeCloseTo(BENCH_RACK_Y, 4);
    expect(jCupMeshes[0]!.mesh.position.y).toBeCloseTo(BENCH_RACK_Y + 0.02, 4);

    const liePose = controller.sampleFirstPersonPose();
    expect(liePose).not.toBeNull();
    expect(liePose!.eyePosition[1]).toBeCloseTo(GYM_FLOOR_Y + 0.58, 3);
    expect(liePose!.pitchRad).toBeCloseTo(1.34, 3);

    // 2. Grip & unrack complete at t = 1.65s: barbell at lockout (0.96m) over mid-chest (0.04m)
    controller.step(0.6); // t = 1.65s
    expect(barbellGroup.position.y).toBeCloseTo(0.96, 3);
    expect(barbellGroup.position.z).toBeCloseTo(0.04, 3);
    const unrackPose = controller.sampleFirstPersonPose()!;
    expect(unrackPose.pitchRad).toBeCloseTo(1.42, 3);
    expect(unrackPose.eyePosition[1]).toBeCloseTo(GYM_FLOOR_Y + 0.568, 3);

    // 3. Rep 1: Eccentric chest touch at t = 2.35s (~0.62m), then explosive lockout at t = 3.05s (~0.96m)
    controller.step(0.7); // t = 2.35s
    expect(barbellGroup.position.y).toBeCloseTo(0.62, 3);
    expect(barbellGroup.position.z).toBeCloseTo(0.09, 3);

    controller.step(0.35); // t = 2.70s (mid-drive Rep 1 FOV pulse)
    expect(controller.sampleFirstPersonPose()!.fovBoostDeg).toBeGreaterThan(1.5);

    controller.step(0.35); // t = 3.05s (Rep 1 lockout)
    expect(barbellGroup.position.y).toBeCloseTo(0.96, 3);

    // 4. Rep 2: Chest touch at t = 3.70s (~0.62m), sticking point around t = 4.10s (~0.78m), lockout at t = 4.55s
    controller.step(0.65); // t = 3.70s
    expect(barbellGroup.position.y).toBeCloseTo(0.62, 3);

    controller.step(0.4); // t = 4.10s (Rep 2 sticking point)
    expect(barbellGroup.position.y).toBeGreaterThan(0.74);
    expect(barbellGroup.position.y).toBeLessThan(0.82);
    expect(controller.sampleFirstPersonPose()!.fovBoostDeg).toBeGreaterThan(2.5);

    controller.step(0.45); // t = 4.55s (Rep 2 lockout)
    expect(barbellGroup.position.y).toBeCloseTo(0.96, 3);

    // 5. Rep 3 (Grinder): Chest touch at t = 5.20s (~0.62m), sticking-point grind at t = 5.75s (~0.76m), lockout at t = 6.35s
    controller.step(0.65); // t = 5.20s
    expect(barbellGroup.position.y).toBeCloseTo(0.62, 3);

    controller.step(0.55); // t = 5.75s (mid-grind stall around 0.76m with tremor & high FOV boost)
    expect(barbellGroup.position.y).toBeGreaterThan(0.74);
    expect(barbellGroup.position.y).toBeLessThan(0.79);
    expect(Math.abs(barbellGroup.rotation.z)).toBeGreaterThan(0.001);
    expect(controller.sampleFirstPersonPose()!.fovBoostDeg).toBeGreaterThan(4.0);

    controller.step(0.6); // t = 6.35s (Rep 3 triumphant lockout)
    expect(barbellGroup.position.y).toBeCloseTo(0.96, 3);
    expect(barbellGroup.rotation.z).toBeCloseTo(0, 4);

    // 6. Re-rack into J-cups at t = 6.80s (0.88m) and full restoration at t = 7.40s
    controller.step(0.45); // t = 6.80s
    expect(barbellGroup.position.y).toBeCloseTo(BENCH_RACK_Y, 3);
    expect(barbellGroup.position.z).toBeCloseTo(-0.172, 3);

    controller.step(TOTAL_BENCH_DURATION_SEC - 6.8 + 0.01); // past 7.40s
    expect(controller.isFirstPersonActive()).toBe(false);
    expect(controller.sampleFirstPersonPose()).toBeNull();
    expect(controller.describe()).toBe('Bench Press on Squat Rack (102 kg)');
    expect(barbellGroup.position.x).toBeCloseTo(0, 5);
    expect(barbellGroup.position.y).toBeCloseTo(1.34, 5);
    expect(barbellGroup.position.z).toBeCloseTo(-0.172, 5);
    expect(benchGroup.position.x).toBeCloseTo(0.18, 5);
    expect(benchGroup.position.z).toBeCloseTo(0.86, 5);
    expect(benchGroup.rotation.y).toBeCloseTo(0.06, 5);
    for (const jCup of jCupMeshes) {
      expect(jCup.mesh.position.y).toBeCloseTo(jCup.restY, 5);
    }
  });

  it('resets cleanly when triggered again while active or when cancelFirstPerson() is called', () => {
    const { controller, barbellGroup, benchGroup, jCupMeshes } = createTestSquatRackRig();

    controller.trigger();
    controller.step(2.35);
    expect(barbellGroup.position.y).toBeCloseTo(0.62, 3);

    // Triggering while active cancels & resets immediately
    expect(controller.trigger()).toBe(true);
    expect(controller.isFirstPersonActive()).toBe(false);
    expect(barbellGroup.position.y).toBeCloseTo(1.34, 5);
    expect(benchGroup.position.x).toBeCloseTo(0.18, 5);
    expect(benchGroup.position.z).toBeCloseTo(0.86, 5);
    expect(jCupMeshes[0]!.mesh.position.y).toBeCloseTo(jCupMeshes[0]!.restY, 5);

    // Start again and cancel via cancelFirstPerson()
    controller.trigger();
    controller.step(4.0);
    controller.cancelFirstPerson();
    expect(controller.isFirstPersonActive()).toBe(false);
    expect(controller.sampleFirstPersonPose()).toBeNull();
    expect(barbellGroup.position.y).toBeCloseTo(1.34, 5);
  });

  it('evaluates player proximity zone in outbuilding coordinates', () => {
    const { controller } = createTestSquatRackRig();

    const toWorld = (obU: number, obV: number): readonly [number, number] => [
      -22.47 + obU * OB_COS + obV * OB_SIN,
      16.0 - obU * OB_SIN + obV * OB_COS,
    ];

    const [inX, inZ] = toWorld(1.52, 3.4);
    expect(controller.isPlayerInProximityZone(inX, GYM_FLOOR_Y, inZ)).toBe(true);

    // Wrong floor elevation
    expect(controller.isPlayerInProximityZone(inX, GYM_FLOOR_Y + 1.2, inZ)).toBe(false);

    // Outside gym squat-rack bay
    const [outX, outZ] = toWorld(4.0, 1.2);
    expect(controller.isPlayerInProximityZone(outX, GYM_FLOOR_Y, outZ)).toBe(false);
  });

  it('maintains smooth frame-to-frame 1P camera continuity across all 6 bench press stages', () => {
    const { controller } = createTestSquatRackRig();
    controller.trigger();
    const dt = 1 / 60;
    let prev = controller.sampleFirstPersonPose()!;
    expect(prev).not.toBeNull();
    while (controller.isFirstPersonActive()) {
      controller.step(dt);
      const cur = controller.sampleFirstPersonPose();
      if (!cur) break;
      const eyeStep = Math.hypot(
        cur.eyePosition[0] - prev.eyePosition[0],
        cur.eyePosition[1] - prev.eyePosition[1],
        cur.eyePosition[2] - prev.eyePosition[2]
      );
      const pitchStep = Math.abs(cur.pitchRad - prev.pitchRad);
      const fovStep = Math.abs((cur.fovBoostDeg ?? 0) - (prev.fovBoostDeg ?? 0));
      expect(eyeStep).toBeLessThan(0.125);
      expect(pitchStep).toBeLessThan(0.12);
      expect(fovStep).toBeLessThan(0.36);
      prev = cur;
    }
  });
});
