import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { SceneInteractionManager } from '../../engine/interaction/interaction-manager.ts';
import {
  formatRunningPacePerKm,
  GYM_TREADMILL_RUN_ID,
  GymTreadmillRunController,
  outbuildingToWorldXZ,
  RUN_YAW_RAD,
  TOTAL_RUN_DURATION_SEC,
  worldToOutbuildingUV,
} from './treadmill-run-interaction.ts';

const GYM_FLOOR_Y = -0.488;

function createTestTreadmillFixture(): {
  readonly controller: GymTreadmillRunController;
  readonly runGroup: THREE.Group;
  readonly beltDeck: THREE.Mesh;
  readonly frontRoller: THREE.Mesh;
  readonly rearRoller: THREE.Mesh;
  readonly beltTexture: THREE.Texture;
  readonly screenMesh: THREE.Mesh;
  readonly screenTexture: THREE.Texture;
} {
  const runGroup = new THREE.Group();
  runGroup.position.set(3.7, GYM_FLOOR_Y, 4.305);

  const beltTexture = new THREE.Texture();
  const beltMat = new THREE.MeshStandardMaterial({ map: beltTexture });
  const beltDeck = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.088, 1.44), beltMat);
  beltDeck.position.set(0, 0.152, -0.24);
  runGroup.add(beltDeck);

  const frontRoller = new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.043, 0.518, 12), beltMat);
  frontRoller.position.set(0, 0.152, 0.475);
  runGroup.add(frontRoller);

  const rearRoller = new THREE.Mesh(new THREE.CylinderGeometry(0.043, 0.043, 0.518, 12), beltMat);
  rearRoller.position.set(0, 0.152, -0.955);
  runGroup.add(rearRoller);

  const drawOps: string[] = [];
  const fakeCanvas = {
    width: 512,
    height: 300,
    getContext: (type: string) => {
      if (type !== '2d') return null;
      return {
        fillStyle: '#000000',
        font: '',
        textAlign: 'left',
        fillRect: () => {
          drawOps.push('fillRect');
        },
        fillText: (text: string) => {
          drawOps.push(`text:${text}`);
        },
      };
    },
  } as unknown as HTMLCanvasElement;

  const screenTexture = new THREE.Texture(fakeCanvas);
  const screenMat = new THREE.MeshStandardMaterial({
    map: screenTexture,
    emissiveMap: screenTexture,
  });
  const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.4), screenMat);
  runGroup.add(screenMesh);

  const controller = new GymTreadmillRunController({
    runGroup,
    beltDeck,
    frontRoller,
    rearRoller,
    beltTexture,
    screenMesh,
    gymFloorY: GYM_FLOOR_Y,
    clickableTargets: [runGroup],
  });

  return {
    controller,
    runGroup,
    beltDeck,
    frontRoller,
    rearRoller,
    beltTexture,
    screenMesh,
    screenTexture,
  };
}

describe('GymTreadmillRunController', () => {
  it('exposes stable id, label, aliases, and idle state before trigger', () => {
    const { controller, runGroup } = createTestTreadmillFixture();
    expect(controller.id).toBe(GYM_TREADMILL_RUN_ID);
    expect(controller.label).toBe('Technogym Run Personal Treadmill');
    expect(controller.aliases).toEqual([
      'treadmill',
      'run',
      'technogym',
      'jog',
      'sprint',
      'cardio',
    ]);
    expect(controller.clickableTargets).toEqual([runGroup]);
    expect(controller.describe()).toBe('Run on Technogym Treadmill');
    expect(controller.isFirstPersonActive()).toBe(false);
    expect(controller.sampleFirstPersonPose()).toBeNull();
    expect(controller.step(0.1)).toBe(false);
  });

  it('steps through warmup, tempo jog, sprint interval, and cooldown completion at 8.0s', () => {
    const {
      controller,
      beltDeck,
      frontRoller,
      rearRoller,
      beltTexture,
      screenTexture,
    } = createTestTreadmillFixture();

    const initialScreenVersion = screenTexture.version;
    expect(controller.trigger()).toBe(true);
    expect(controller.isFirstPersonActive()).toBe(true);
    expect(controller.describe()).toBe('Stop Treadmill Run');
    expect(screenTexture.version).toBeGreaterThan(initialScreenVersion);

    // Stage 1 (0.0s -> 0.85s): Step On & Console Tap
    expect(controller.step(0.5)).toBe(true);
    const warmupPose = controller.sampleFirstPersonPose();
    expect(warmupPose).not.toBeNull();
    expect(warmupPose!.yawRad).toBeCloseTo(RUN_YAW_RAD, 5);
    expect(warmupPose!.pitchRad).toBeLessThan(-0.1);
    expect(warmupPose!.pitchRad).toBeGreaterThanOrEqual(-0.24);
    expect(warmupPose!.footPosition[1]).toBeCloseTo(GYM_FLOOR_Y + 0.196, 3);
    expect(controller.getCurrentSpeedKmh()).toBeGreaterThan(0);
    expect(controller.getCurrentSpeedKmh()).toBeLessThanOrEqual(5.5);

    // Stage 2 (0.85s -> 3.20s): Tempo Jog (`5.5 -> 11.5 km/h`, `+2.2 deg` FOV boost)
    expect(controller.step(1.5)).toBe(true); // t = 2.0s
    const tempoPose = controller.sampleFirstPersonPose();
    expect(tempoPose).not.toBeNull();
    expect(controller.getCurrentSpeedKmh()).toBeGreaterThan(5.5);
    expect(controller.getCurrentSpeedKmh()).toBeLessThanOrEqual(11.5);
    expect(tempoPose!.fovBoostDeg).toBeCloseTo(2.2, 3);
    expect(tempoPose!.eyePosition[1]).toBeGreaterThan(tempoPose!.footPosition[1] + 1.6);
    expect(Math.abs(tempoPose!.rollRad ?? 0)).toBeGreaterThan(0);
    expect(beltTexture.wrapS).toBe(THREE.RepeatWrapping);
    expect(beltTexture.wrapT).toBe(THREE.RepeatWrapping);
    expect(beltTexture.offset.y).toBeGreaterThan(0);
    expect(frontRoller.rotation.x).toBeGreaterThan(0);
    expect(rearRoller.rotation.x).toBeGreaterThan(0);
    expect(beltDeck.position.y).toBeLessThan(0.152);

    // Stage 3 (3.20s -> 6.40s): High-Speed Sprint Interval (`16.8 km/h`, `+5.8 deg` FOV boost)
    expect(controller.step(2.5)).toBe(true); // t = 4.5s
    const sprintPose = controller.sampleFirstPersonPose();
    expect(sprintPose).not.toBeNull();
    expect(controller.getCurrentSpeedKmh()).toBeCloseTo(16.8, 2);
    expect(sprintPose!.fovBoostDeg).toBeCloseTo(5.8, 3);
    expect(sprintPose!.pitchRad).toBeCloseTo(-0.06, 3);
    expect(controller.getDistanceMeters()).toBeGreaterThan(8);

    // Stage 4 (6.40s -> 8.00s): Cooldown & Dismount
    expect(controller.step(2.7)).toBe(true); // t = 7.2s
    const cooldownPose = controller.sampleFirstPersonPose();
    expect(cooldownPose).not.toBeNull();
    expect(controller.getCurrentSpeedKmh()).toBeLessThan(16.8);
    expect(controller.getCurrentSpeedKmh()).toBeGreaterThan(0);
    expect(cooldownPose!.footPosition[1]).toBeLessThan(GYM_FLOOR_Y + 0.196);
    expect(cooldownPose!.footPosition[1]).toBeGreaterThan(GYM_FLOOR_Y);

    // Completion at 8.0s (`TOTAL_RUN_DURATION_SEC`)
    expect(controller.step(0.85)).toBe(true); // t = 8.05s >= 8.0s
    expect(controller.getElapsedSec()).toBeGreaterThanOrEqual(TOTAL_RUN_DURATION_SEC);
    expect(controller.isFirstPersonActive()).toBe(false);
    expect(controller.sampleFirstPersonPose()).toBeNull();
    expect(controller.describe()).toBe('Run on Technogym Treadmill');
    expect(beltDeck.position.y).toBeCloseTo(0.152, 5);
    expect(controller.step(0.1)).toBe(false);
  });

  it('supports cancelFirstPerson and toggling off via a second trigger() call', () => {
    const { controller, beltDeck } = createTestTreadmillFixture();
    controller.trigger();
    controller.step(1.2);
    expect(controller.isFirstPersonActive()).toBe(true);
    expect(beltDeck.position.y).toBeLessThan(0.152);

    controller.cancelFirstPerson();
    expect(controller.isFirstPersonActive()).toBe(false);
    expect(controller.sampleFirstPersonPose()).toBeNull();
    expect(controller.describe()).toBe('Run on Technogym Treadmill');
    expect(beltDeck.position.y).toBeCloseTo(0.152, 5);

    // Triggering again restarts the run, and triggering while running cancels cleanly
    expect(controller.trigger()).toBe(true);
    expect(controller.isFirstPersonActive()).toBe(true);
    expect(controller.trigger()).toBe(true);
    expect(controller.isFirstPersonActive()).toBe(false);
  });

  it('checks player proximity in outbuilding local coordinates', () => {
    const { controller } = createTestTreadmillFixture();
    const [beltWorldX, beltWorldZ] = outbuildingToWorldXZ(3.7, 4.125);
    const [uvU, uvV] = worldToOutbuildingUV(beltWorldX, beltWorldZ);
    expect(uvU).toBeCloseTo(3.7, 4);
    expect(uvV).toBeCloseTo(4.125, 4);

    expect(controller.isPlayerInProximityZone(beltWorldX, GYM_FLOOR_Y, beltWorldZ)).toBe(true);
    expect(controller.isPlayerInProximityZone(beltWorldX, GYM_FLOOR_Y + 0.2, beltWorldZ)).toBe(
      true
    );
    // Too high (e.g. upstairs)
    expect(controller.isPlayerInProximityZone(beltWorldX, GYM_FLOOR_Y + 1.2, beltWorldZ)).toBe(
      false
    );
    // Outside gym treadmill zone (`obU = 1.0, obV = 1.0`)
    const [farX, farZ] = outbuildingToWorldXZ(1.0, 1.0);
    expect(controller.isPlayerInProximityZone(farX, GYM_FLOOR_Y, farZ)).toBe(false);
  });

  it('collects dynamic objects and formats running pace', () => {
    const { controller, beltDeck, frontRoller, rearRoller, screenMesh } =
      createTestTreadmillFixture();
    const dynamicSet = new Set<THREE.Object3D>();
    controller.collectDynamicObjects(dynamicSet);
    expect(dynamicSet.has(beltDeck)).toBe(true);
    expect(dynamicSet.has(frontRoller)).toBe(true);
    expect(dynamicSet.has(rearRoller)).toBe(true);
    expect(dynamicSet.has(screenMesh)).toBe(true);

    expect(formatRunningPacePerKm(0)).toBe('--:-- /KM');
    expect(formatRunningPacePerKm(11.5)).toBe('5:13 /KM');
    expect(formatRunningPacePerKm(16.8)).toBe('3:34 /KM');
  });

  it('registers with SceneInteractionManager and routes clicks, prompts, and updates', () => {
    const { controller, beltDeck } = createTestTreadmillFixture();
    const interactiveMeshes: THREE.Object3D[] = [];
    const manager = new SceneInteractionManager(interactiveMeshes);
    const id = manager.registerAnimatedInteractable(controller);

    expect(id).toBe(GYM_TREADMILL_RUN_ID);
    expect(interactiveMeshes).toContain(beltDeck);
    expect(manager.describeInteractable(beltDeck)).toBe('Run on Technogym Treadmill');

    expect(manager.handleInteractableClick(GYM_TREADMILL_RUN_ID)).toBe(true);
    expect(controller.isFirstPersonActive()).toBe(true);
    expect(manager.describeInteractable(beltDeck)).toBe('Stop Treadmill Run');
    expect(manager.update(1.0)).toBe(true);

    expect(manager.handleInteractableClick(GYM_TREADMILL_RUN_ID)).toBe(true);
    expect(controller.isFirstPersonActive()).toBe(false);
    expect(manager.describeInteractable(beltDeck)).toBe('Run on Technogym Treadmill');
  });

  it('maintains smooth C0/C1 frame-to-frame 1P camera continuity across all stage transitions', () => {
    const { controller } = createTestTreadmillFixture();
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
      expect(eyeStep).toBeLessThan(0.05);
      expect(pitchStep).toBeLessThan(0.02);
      expect(fovStep).toBeLessThan(0.38);
      prev = cur;
    }
  });
});
