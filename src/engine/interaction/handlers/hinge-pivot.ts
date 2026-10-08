import * as THREE from 'three';

/**
 * Re-parents `obj` (which must already have its local position set and be a child of `parent`)
 * under `pivot`, placing the pivot at `obj.position + hingeOffsetInParent` so rotating the pivot
 * swings `obj` about the hinge line. The caller adds the returned pivot to `parent`.
 */
export function wrapInHingePivot(
  parent: THREE.Object3D,
  obj: THREE.Object3D,
  hingeOffsetInParent: THREE.Vector3,
  pivot: THREE.Group = new THREE.Group()
): THREE.Group {
  pivot.position.copy(obj.position).add(hingeOffsetInParent);
  parent.remove(obj);
  obj.position.copy(hingeOffsetInParent).negate();
  pivot.add(obj);
  return pivot;
}
