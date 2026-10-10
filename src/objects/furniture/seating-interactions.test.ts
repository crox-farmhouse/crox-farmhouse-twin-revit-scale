import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { InteractiveUserData } from '../../core/types/scene.ts';
import { InteractionRegistry } from '../../engine/interaction/interaction-registry.ts';
import {
  collectSeatClickableMeshes,
  registerPropertySeatingInteractions,
  SeatInteractable,
} from './seating-interactions.ts';

function addNamedSeatGroup(parent: THREE.Object3D, name: string, pos: [number, number, number]): THREE.Group {
  const g = new THREE.Group();
  g.name = name;
  g.position.set(pos[0], pos[1], pos[2]);
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.12, 0.6),
    new THREE.MeshStandardMaterial()
  );
  mesh.name = `${name}.seatCushion`;
  g.add(mesh);
  parent.add(g);
  return g;
}

describe('Seating interactions (sofas, armchairs, dining chairs, stools, benches & beanbags)', () => {
  it('toggles 1st-person seated state with allowFreeLook, poseId, and activePrompt', () => {
    const anchor = new THREE.Group();
    anchor.position.set(-18.5, -0.6, 5.65);
    const cushion = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.2, 1.6),
      new THREE.MeshStandardMaterial()
    );
    cushion.name = 'sofa.seatCushion';
    const piping = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.02, 1.6),
      new THREE.MeshStandardMaterial()
    );
    piping.name = 'sofa.seatPiping';
    anchor.add(cushion, piping);

    const clickable = collectSeatClickableMeshes(anchor);
    expect(clickable).toEqual([cushion]);

    const seat = new SeatInteractable({
      id: 'seat:test.sofa',
      label: 'Test Linen Sofa',
      aliases: ['sit on test sofa'],
      anchor,
      clickableTargets: clickable,
      localSeatPos: [-0.06, 0.44, 0],
      localFootOffset: [-0.82, 0, 0],
      localForward: [-1, 0, 0],
      seatedEyeHeightM: 0.72,
      material: 'linen',
    });

    expect(seat.isFirstPersonActive()).toBe(false);
    expect(seat.describe()).toBe('Sit on Test Linen Sofa');
    expect(seat.sampleFirstPersonPose()).toBeNull();

    // Sit down
    expect(seat.trigger()).toBe(true);
    expect(seat.isFirstPersonActive()).toBe(true);
    expect(seat.describe()).toBe('Stand Up from Test Linen Sofa');

    const pose = seat.sampleFirstPersonPose();
    expect(pose).not.toBeNull();
    expect(pose?.allowFreeLook).toBe(true);
    expect(pose?.poseId).toBe('seat:test.sofa');
    expect(pose?.activePrompt).toBe('Stand Up from Test Linen Sofa');
    expect(pose?.eyePosition[1]).toBeCloseTo(-0.6 + 0.44 + 0.72, 3);
    expect(pose?.footPosition[0]).toBeCloseTo(-18.5 - 0.82, 3);
    expect(pose?.footPosition[1]).toBeCloseTo(-0.6, 3);

    // Stand up
    seat.cancelFirstPerson();
    expect(seat.isFirstPersonActive()).toBe(false);
    expect(seat.sampleFirstPersonPose()).toBeNull();
  });

  it('registers all 41 property seats, switches seats cleanly, and preserves dining table extension', () => {
    const root = new THREE.Group();

    // 1. Sitting Room
    addNamedSeatGroup(root, 'sittingRoom.barkerAndStonehouseSofa.east', [-18.514, -0.6, 5.65]);
    addNamedSeatGroup(root, 'sittingRoom.barkerAndStonehouseSofa.west', [-21.05, -0.6, 5.65]);

    // 2. Living Room Chaise Sectional (Chaise + Main)
    const chaiseSofa = new THREE.Group();
    chaiseSofa.name = 'livingRoom.chaiseSofa';
    chaiseSofa.position.set(-20.1, -0.6, -0.04);
    const chaiseCushion = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.2, 1.5),
      new THREE.MeshStandardMaterial()
    );
    chaiseCushion.name = 'livingRoom.chaiseSofa.chaiseCushion';
    const mainCushion = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.2, 0.9),
      new THREE.MeshStandardMaterial()
    );
    mainCushion.name = 'livingRoom.chaiseSofa.seatCushion.1';
    chaiseSofa.add(chaiseCushion, mainCushion);
    root.add(chaiseSofa);

    // 3. Vaulted Sitting Area Armchairs
    addNamedSeatGroup(root, 'sitting.armchairLeft', [2.818, 0, 3.031]);
    addNamedSeatGroup(root, 'sitting.armchairRight', [4.305, 0, 3.23]);

    // 4. Kitchen Island Stools
    for (let i = 1; i <= 3; i++) {
      addNamedSeatGroup(root, `kitchen.island.counterStool_${i}`, [-1.3 + i * 0.85, 0, 3.0]);
    }

    // 5. Dining Room Table + 10 Chairs
    const wycombeGroup = new THREE.Group();
    wycombeGroup.name = 'familyRoom.neptuneWycombeDiningTable';
    const tableTopMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.05, 1.1),
      new THREE.MeshStandardMaterial()
    );
    tableTopMesh.name = 'familyRoom.neptuneWycombeDiningTable.topLeaf.west';
    wycombeGroup.add(tableTopMesh);
    for (let i = 1; i <= 10; i++) {
      addNamedSeatGroup(wycombeGroup, `familyRoom.neptuneWycombeDiningTable.chair.${i}`, [i * 0.5, 0, 0]);
    }
    root.add(wycombeGroup);

    // 6. Walk-in Cupboard Boot Bench
    addNamedSeatGroup(root, 'familyRoom.walkInCupboard.benchSeat', [-8.826, 0.48, -0.424]);

    // 7. Study Chair
    addNamedSeatGroup(root, 'study.southWallDesk.chair', [-21.05, -0.6, 10.48]);

    // 8. Barn Golf Viewing Bar Stools
    for (let i = 1; i <= 3; i++) {
      addNamedSeatGroup(root, `outbuildings.barn.golfViewingBar.stool.${i}`, [-3.5, -0.675, 18.0 + i * 0.65]);
    }

    // 9. Mezzanine Beanbags & Pouffe
    addNamedSeatGroup(root, 'outbuildings.mezzanine.beanbag.navyFront', [-1.52, 1.54, 15.06]);
    addNamedSeatGroup(root, 'outbuildings.mezzanine.beanbag.tapestry', [-0.145, 1.54, 15.32]);
    addNamedSeatGroup(root, 'outbuildings.mezzanine.beanbag.navyBack', [-0.273, 1.54, 16.52]);
    addNamedSeatGroup(root, 'outbuildings.mezzanine.pouffe', [-1.087, 1.72, 16.6]);

    // 10. Gym Hydration Bench
    addNamedSeatGroup(root, 'outbuildings.gym.hydrationBench', [-16.988, -0.588, 16.252]);

    // 11. Stable Bedroom & Balcony
    addNamedSeatGroup(root, 'outbuildings.firstFloor.stableBedroom.dressingStool', [5.142, 2.08, 14.491]);
    addNamedSeatGroup(root, 'outbuildings.firstFloor.stableBedroom.endBench', [5.126, 2.4, 16.76]);
    addNamedSeatGroup(root, 'outbuildings.firstFloor.stableEastBalcony.armchair.1', [7.316, 2.08, 14.324]);
    addNamedSeatGroup(root, 'outbuildings.firstFloor.stableEastBalcony.armchair.2', [8.723, 2.08, 14.344]);

    // 12. Courtyard & Pergola
    addNamedSeatGroup(root, 'courtyard.gardenBench', [-11.76, -0.12, 3.78]);
    addNamedSeatGroup(root, 'courtyard.rattanPatioWestBench', [-5.333, -0.14, 7.096]);
    for (let i = 1; i <= 6; i++) {
      const chairGroup = new THREE.Group();
      chairGroup.position.set(8.2 + i * 0.4, 0.32, 6.5);
      const seatMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.04, 0.46),
        new THREE.MeshStandardMaterial()
      );
      seatMesh.name = 'courtyard.grapeVinePergola.seat';
      chairGroup.add(seatMesh);
      root.add(chairGroup);
    }

    const interactiveMeshes: THREE.Object3D[] = [];
    const registry = new InteractionRegistry(interactiveMeshes);
    let tableToggled = false;
    registry.registerToggleCallback(wycombeGroup, () => {
      tableToggled = !tableToggled;
    });

    const registeredSeats = registerPropertySeatingInteractions([root], registry);
    expect(registeredSeats.length).toBe(41);

    // Verify no duplicate meshes in interactiveMeshes
    expect(new Set(interactiveMeshes).size).toBe(interactiveMeshes.length);

    // Sit on East Linen Sofa, then switch directly to West Linen Sofa
    const eastSofaId = 'seat:sittingRoom.barkerAndStonehouseSofa.east';
    const westSofaId = 'seat:sittingRoom.barkerAndStonehouseSofa.west';
    expect(registry.handleInteractableClick(eastSofaId)).toBe(true);
    expect(registry.getActiveFirstPersonPose()?.poseId).toBe(eastSofaId);

    expect(registry.handleInteractableClick(westSofaId)).toBe(true);
    expect(registry.getActiveFirstPersonPose()?.poseId).toBe(westSofaId);

    // Dining table top still toggles table extension while dining chairs sit
    const tableId = (tableTopMesh.userData as InteractiveUserData).interactableId!;
    expect(registry.describeInteractable(tableTopMesh)).toBe('Extend / Retract Table');
    expect(registry.handleInteractableClick(tableId)).toBe(true);
    expect(tableToggled).toBe(true);

    expect(registry.cancelActiveFirstPerson()).toBe(true);
    expect(registry.getActiveFirstPersonPose()).toBeNull();
  });
});
