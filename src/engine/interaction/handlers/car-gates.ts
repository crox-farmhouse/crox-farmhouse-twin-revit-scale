import * as THREE from 'three';
import { easeInOutCubic, stepProgress } from '../interaction-math.ts';
import { wrapInHingePivot } from './hinge-pivot.ts';

/** Motorized dual-leaf front car entrance gates (KNX GA 1/5/1). */
export interface MotorizedCarGatePairState {
  northPivot: THREE.Group;
  southPivot: THREE.Group;
  readonly northOpenAngle: number;
  readonly southOpenAngle: number;
  isOpen: boolean;
  progress: number;
  readonly speed: number;
}

/** Wraps both leaves in hinge pivots (added to `parent`) and returns the gate pair state. */
export function createMotorizedCarGatePair(
  parent: THREE.Object3D,
  northLeaf: THREE.Object3D,
  northHingeOffset: THREE.Vector3,
  northOpenAngle: number,
  southLeaf: THREE.Object3D,
  southHingeOffset: THREE.Vector3,
  southOpenAngle: number,
  travelDurationSec: number
): MotorizedCarGatePairState {
  const northPivot = wrapInHingePivot(parent, northLeaf, northHingeOffset);
  parent.add(northPivot);
  const southPivot = wrapInHingePivot(parent, southLeaf, southHingeOffset);
  parent.add(southPivot);
  return {
    northPivot,
    southPivot,
    northOpenAngle,
    southOpenAngle,
    isOpen: false,
    progress: 0,
    speed: 1.0 / Math.max(1.0, travelDurationSec),
  };
}

/** Steps the gate swing. Returns true if the leaves moved. */
export function stepCarGates(cg: MotorizedCarGatePairState, dtSeconds: number): boolean {
  const target = cg.isOpen ? 1 : 0;
  if (cg.progress === target) return false;
  cg.progress = stepProgress(cg.progress, target, dtSeconds, cg.speed);
  const smooth = easeInOutCubic(cg.progress);
  cg.northPivot.rotation.y = cg.northOpenAngle * smooth;
  cg.southPivot.rotation.y = cg.southOpenAngle * smooth;
  cg.northPivot.updateMatrixWorld(true);
  cg.southPivot.updateMatrixWorld(true);
  return true;
}
