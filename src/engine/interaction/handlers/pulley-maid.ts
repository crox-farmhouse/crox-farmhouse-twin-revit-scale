import type * as THREE from 'three';
import { easeInOutCubic, stepProgress } from '../interaction-math.ts';

/** Fixed interactable id of the Utility Room pulley maid airer. */
export const PULLEY_MAID_ID = 'pulley-maid';

export interface PulleyMaidConfig {
  readonly clickRoot: THREE.Object3D;
  readonly rackMovingGroup: THREE.Group;
  readonly vertRopes: readonly THREE.Mesh[];
  readonly pulleyWheels: readonly THREE.Mesh[];
  readonly wallHaulRope: THREE.Mesh;
  readonly baseRopeLength: number;
  readonly pulleyCeilingY: number;
  readonly baseRackEyeY: number;
  readonly baseWallRopeLength: number;
  readonly wallPulleyY: number;
  readonly dropDistance?: number;
}

export interface PulleyMaidState {
  readonly id: string;
  rackMovingGroup: THREE.Group;
  vertRopes: readonly THREE.Mesh[];
  pulleyWheels: readonly THREE.Mesh[];
  wallHaulRope: THREE.Mesh;
  readonly baseRopeLength: number;
  readonly pulleyCeilingY: number;
  readonly baseRackEyeY: number;
  readonly baseWallRopeLength: number;
  readonly wallPulleyY: number;
  readonly dropDistance: number;
  isLowered: boolean;
  progress: number;
  readonly speed: number;
}

/** Tags the moving parts with `pulleyMaidRole` userData so they can be rebound after USD reloads. */
export function tagPulleyMaidRoles(config: PulleyMaidConfig): void {
  config.rackMovingGroup.userData = {
    ...config.rackMovingGroup.userData,
    pulleyMaidRole: 'rackMovingGroup',
  };
  config.vertRopes.forEach((rope, idx) => {
    rope.userData = { ...rope.userData, pulleyMaidRole: 'vertRope', pulleyMaidIndex: idx };
  });
  config.pulleyWheels.forEach((wheel, idx) => {
    wheel.userData = { ...wheel.userData, pulleyMaidRole: 'pulleyWheel', pulleyMaidIndex: idx };
  });
  config.wallHaulRope.userData = { ...config.wallHaulRope.userData, pulleyMaidRole: 'wallHaulRope' };
}

export function createPulleyMaidState(config: PulleyMaidConfig): PulleyMaidState {
  return {
    id: PULLEY_MAID_ID,
    rackMovingGroup: config.rackMovingGroup,
    vertRopes: config.vertRopes,
    pulleyWheels: config.pulleyWheels,
    wallHaulRope: config.wallHaulRope,
    baseRopeLength: config.baseRopeLength,
    pulleyCeilingY: config.pulleyCeilingY,
    baseRackEyeY: config.baseRackEyeY,
    baseWallRopeLength: config.baseWallRopeLength,
    wallPulleyY: config.wallPulleyY,
    dropDistance: config.dropDistance ?? 0.84,
    isLowered: false,
    progress: 0,
    speed: 1.65,
  };
}

/** Steps the airer lowering/raising animation. Returns true if it moved. */
export function stepPulleyMaid(pm: PulleyMaidState, dtSeconds: number): boolean {
  const target = pm.isLowered ? 1 : 0;
  if (pm.progress === target) return false;
  pm.progress = stepProgress(pm.progress, target, dtSeconds, pm.speed);
  const smooth = easeInOutCubic(pm.progress);
  const drop = smooth * pm.dropDistance;

  pm.rackMovingGroup.position.y = -drop;
  pm.rackMovingGroup.updateMatrixWorld(true);

  const newEyeY = pm.baseRackEyeY - drop;
  const newRopeLen = Math.max(0.1, pm.pulleyCeilingY - newEyeY);
  const ropeCenterY = (pm.pulleyCeilingY + newEyeY) * 0.5;
  const scaleY = newRopeLen / pm.baseRopeLength;

  for (const rope of pm.vertRopes) {
    rope.scale.y = scaleY;
    rope.position.y = ropeCenterY;
    rope.updateMatrixWorld(true);
  }

  for (const wheel of pm.pulleyWheels) {
    wheel.rotation.z = smooth * Math.PI * 6;
    wheel.updateMatrixWorld(true);
  }

  // As the rack lowers by `drop`, rope is paid out from the wall cleat so the slack loop on the wall shortens slightly
  const newWallLen = Math.max(0.7, pm.baseWallRopeLength - drop * 0.45);
  pm.wallHaulRope.scale.y = newWallLen / pm.baseWallRopeLength;
  pm.wallHaulRope.position.y = pm.wallPulleyY - newWallLen * 0.5;
  pm.wallHaulRope.updateMatrixWorld(true);
  return true;
}

export function collectPulleyMaidDynamicObjects(
  pm: PulleyMaidState,
  outSet: Set<THREE.Object3D>
): void {
  pm.rackMovingGroup.traverse((c) => outSet.add(c));
  for (const rope of pm.vertRopes) outSet.add(rope);
  for (const wheel of pm.pulleyWheels) outSet.add(wheel);
  outSet.add(pm.wallHaulRope);
}
