import * as THREE from 'three';
import type { CutawayWallDescriptor } from '../../types/scene.ts';
import type { RoomZoneId } from '../../types/topology.ts';

export interface WindowRomanBlindOptions {
  readonly name: string;
  readonly zone: RoomZoneId;
  readonly centerX: number;
  /** Window aperture width (m); the blind overhangs by 7cm on each side. */
  readonly width: number;
  /** Center Y of the timber/aluminium headrail (m). */
  readonly railY: number;
  /** Bottom Y of the lowered Roman blind fabric stack (m). */
  readonly bottomY: number;
  /** World Z coordinate of the interior wall face on which the blind is face-fixed. */
  readonly wallFaceZ: number;
  /** +1 when mounted on a North wall facing South (+Z); -1 when mounted on a South wall facing North (-Z). */
  readonly facingZ: 1 | -1;
  readonly cutawayWall?: CutawayWallDescriptor;
  readonly parentGroup?: THREE.Object3D;
}

/**
 * Face-fixed natural oatmeal-linen Roman blind shown part-lowered with a soft
 * rolled pleat stack across the top of a cottage casement window.
 */
export function buildWindowRomanBlind(
  scene: THREE.Scene,
  tagCutawayWall: (obj: THREE.Object3D, desc: CutawayWallDescriptor) => void,
  opts: WindowRomanBlindOptions
): THREE.Group {
  const blindGroup = new THREE.Group();
  blindGroup.name = opts.name;
  blindGroup.userData.zone = opts.zone;

  const blindW = opts.width + 0.14;
  const dirZ = opts.facingZ;

  const linenMat = new THREE.MeshStandardMaterial({
    color: 0xd8ccb4,
    roughness: 0.92,
    metalness: 0.0,
  });
  const railMat = new THREE.MeshStandardMaterial({
    color: 0xe9e4da,
    roughness: 0.6,
  });

  const headRail = new THREE.Mesh(
    new THREE.BoxGeometry(blindW + 0.02, 0.04, 0.045),
    railMat
  );
  headRail.name = `${opts.name}.headRail`;
  headRail.position.set(opts.centerX, opts.railY, opts.wallFaceZ + dirZ * 0.0225);
  blindGroup.add(headRail);

  const panelTopY = opts.railY - 0.02;
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(blindW, panelTopY - opts.bottomY, 0.008),
    linenMat
  );
  panel.name = `${opts.name}.fabric`;
  panel.position.set(
    opts.centerX,
    (panelTopY + opts.bottomY) / 2,
    opts.wallFaceZ + dirZ * 0.05
  );
  panel.castShadow = true;
  panel.receiveShadow = true;
  blindGroup.add(panel);

  // Soft rolled pleats hanging proud of the fabric face, deepest at the bottom of the stack
  const pleatGeo = new THREE.CylinderGeometry(0.028, 0.028, blindW, 14, 1);
  pleatGeo.rotateZ(Math.PI / 2);
  const pleatCount = 4;
  for (let k = 0; k < pleatCount; k++) {
    const pleat = new THREE.Mesh(pleatGeo, linenMat);
    pleat.name = `${opts.name}.pleat`;
    const pleatY = opts.bottomY + 0.028 + k * 0.058;
    pleat.position.set(
      opts.centerX,
      pleatY,
      opts.wallFaceZ + dirZ * (0.06 + (pleatCount - k) * 0.004)
    );
    pleat.scale.set(1, 1.05, 0.7);
    pleat.castShadow = true;
    blindGroup.add(pleat);
  }

  if (opts.cutawayWall) {
    tagCutawayWall(blindGroup, opts.cutawayWall);
  }
  (opts.parentGroup ?? scene).add(blindGroup);
  return blindGroup;
}
