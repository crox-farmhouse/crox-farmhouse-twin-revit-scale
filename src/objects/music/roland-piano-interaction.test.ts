import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  HALL_PIANO_PLAY_ID,
  RolandPianoController,
  TOTAL_PIANO_DURATION_SEC,
  pianoLocalToWorldXZ,
  worldXZToPianoLocal,
} from './roland-piano-interaction.ts';

function createPianoFixture() {
  const pianoGroup = new THREE.Group();
  pianoGroup.position.set(-14.6, 0, -0.2);

  const lidPivot = new THREE.Group();
  lidPivot.position.set(-0.702, 0.913, 0);
  lidPivot.rotation.z = 0.16;
  const lidMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.02, 1.4),
    new THREE.MeshStandardMaterial()
  );
  lidMesh.name = 'hall.rolandGP6PE.lid';
  lidPivot.add(lidMesh);
  pianoGroup.add(lidPivot);

  const lidPropStick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.005, 0.22, 8),
    new THREE.MeshStandardMaterial()
  );
  lidPropStick.position.set(0.6, 0.985, 0.04);
  lidPropStick.rotation.z = -0.14;
  pianoGroup.add(lidPropStick);

  const benchGroup = new THREE.Group();
  benchGroup.position.set(0, 0, 0.74);
  const benchCushion = new THREE.Mesh(
    new THREE.BoxGeometry(0.57, 0.046, 0.35),
    new THREE.MeshStandardMaterial()
  );
  benchGroup.add(benchCushion);
  pianoGroup.add(benchGroup);

  const whiteKeysMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.225, 0.024, 0.145),
    new THREE.MeshStandardMaterial()
  );
  whiteKeysMesh.position.set(0, 0.676, 0.388);
  pianoGroup.add(whiteKeysMesh);

  const blackKeyMeshes: THREE.Mesh[] = [];
  for (let i = 0; i < 36; i++) {
    const key = new THREE.Mesh(
      new THREE.BoxGeometry(0.012, 0.014, 0.092),
      new THREE.MeshStandardMaterial()
    );
    key.position.set(-0.6 + (i / 35) * 1.2, 0.692, 0.362);
    pianoGroup.add(key);
    blackKeyMeshes.push(key);
  }

  const pedalMeshes: THREE.Mesh[] = [];
  for (const px of [-0.066, 0, 0.066]) {
    const pedal = new THREE.Mesh(
      new THREE.BoxGeometry(0.023, 0.012, 0.105),
      new THREE.MeshStandardMaterial()
    );
    pedal.position.set(px, 0.045, 0.275);
    pedal.rotation.x = 0.15;
    pianoGroup.add(pedal);
    pedalMeshes.push(pedal);
  }

  const touchPanelMat = new THREE.MeshStandardMaterial({
    emissive: new THREE.Color(0xc8a464),
    emissiveIntensity: 0.35,
  });

  const sheetMusicBook = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.18, 0.008),
    new THREE.MeshStandardMaterial()
  );
  sheetMusicBook.position.set(0, 0.993, 0.202);
  sheetMusicBook.rotation.x = -0.22;
  pianoGroup.add(sheetMusicBook);

  const controller = new RolandPianoController({
    pianoGroup,
    lidPivot,
    lidPropStick,
    benchGroup,
    whiteKeysMesh,
    blackKeyMeshes,
    pedalMeshes,
    touchPanelMat,
    sheetMusicBook,
    hallFloorY: 0,
  });

  return {
    controller,
    pianoGroup,
    lidPivot,
    lidPropStick,
    benchGroup,
    whiteKeysMesh,
    blackKeyMeshes,
    pedalMeshes,
    touchPanelMat,
    sheetMusicBook,
  };
}

describe('RolandPianoController', () => {
  it('converts between piano-local and world XZ coordinates round-trip', () => {
    const [wx, wz] = pianoLocalToWorldXZ(0.15, 0.72);
    const [lx, lz] = worldXZToPianoLocal(wx, wz);
    expect(lx).toBeCloseTo(0.15, 6);
    expect(lz).toBeCloseTo(0.72, 6);
  });

  it('starts idle and transitions through recital choreography back to rest state', () => {
    const {
      controller,
      lidPivot,
      benchGroup,
      blackKeyMeshes,
      pedalMeshes,
      touchPanelMat,
    } = createPianoFixture();

    expect(controller.id).toBe(HALL_PIANO_PLAY_ID);
    expect(controller.getPhase()).toBe('idle');
    expect(controller.isFirstPersonActive()).toBe(false);

    const dynamicObjects = new Set<THREE.Object3D>();
    controller.collectDynamicObjects(dynamicObjects);
    expect(dynamicObjects.size).toBeGreaterThan(36);

    // Trigger recital
    controller.trigger();
    expect(controller.getPhase()).toBe('playing');
    expect(controller.isFirstPersonActive()).toBe(true);

    // Step into Stage 2 (recital performance at t = 2.0s)
    controller.step(2.0);
    expect(lidPivot.rotation.z).toBeCloseTo(0.46, 2);
    expect(benchGroup.position.z).toBeCloseTo(0.75, 2);
    expect(touchPanelMat.emissiveIntensity).toBeGreaterThan(0.5);
    // Damper pedal should be depressed during sustained arpeggios
    expect(pedalMeshes[2]!.rotation.x).toBeGreaterThan(0.16);
    // At least one black key should be depressed at t = 2.0s (Db4 / Ab4 / F5 chord)
    const depressedKeys = blackKeyMeshes.filter((k) => k.position.y < 0.6915);
    expect(depressedKeys.length).toBeGreaterThan(0);

    // Sample 1st-person pose while seated at the keyboard
    const pose = controller.sampleFirstPersonPose();
    expect(pose).not.toBeNull();
    expect(pose!.eyePosition[1]).toBeCloseTo(1.22, 1);

    // Step past total duration to finish recital and restore rest state
    controller.step(TOTAL_PIANO_DURATION_SEC);
    expect(controller.getPhase()).toBe('idle');
    expect(controller.isFirstPersonActive()).toBe(false);
    expect(lidPivot.rotation.z).toBeCloseTo(0.16, 5);
    expect(benchGroup.position.z).toBeCloseTo(0.74, 5);
    expect(pedalMeshes[2]!.rotation.x).toBeCloseTo(0.15, 5);
  });

  it('detects player proximity near the keyboard and bench', () => {
    const { controller } = createPianoFixture();
    const [benchWx, benchWz] = pianoLocalToWorldXZ(0, 0.74);
    expect(controller.isPlayerInProximityZone(benchWx, 0, benchWz)).toBe(true);
    expect(controller.isPlayerInProximityZone(benchWx + 10, 0, benchWz)).toBe(false);
  });
});
