import type * as THREE from 'three';

/** True if `obj` and every ancestor are visible. */
export function isObjectVisibleInHierarchy(obj: THREE.Object3D): boolean {
  let cur: THREE.Object3D | null = obj;
  while (cur) {
    if (!cur.visible) return false;
    cur = cur.parent;
  }
  return true;
}

/** Removes all direct children of `group`. */
export function clearGroupChildren(group: THREE.Group): void {
  while (group.children.length > 0) {
    const child = group.children[0];
    if (child) {
      group.remove(child);
    }
  }
}
