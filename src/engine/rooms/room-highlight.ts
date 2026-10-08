import * as THREE from 'three';
import type { RoomBoundingBox } from '../../core/types/topology.ts';

const FILL_COLOR = 0x6fb7ff;
const FILL_OPACITY = 0.12;
const OUTLINE_OPACITY = 0.75;
/** Lift above the walking floor so the tint never z-fights the floor finish (m). */
const FLOOR_LIFT_M = 0.03;

/**
 * Subtle floor tint + outline marking a room's footprint (navigator hover /
 * selection). Created lazily on first use so it never appears in the static
 * scene graph (snapshots, batching, trade classification).
 */
export class RoomHighlight {
  private readonly scene: THREE.Scene;
  private group: THREE.Group | null = null;

  public constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /** Shows the highlight over `bounds` at `floorY`; `null` hides it. */
  public show(bounds: RoomBoundingBox | null, floorY = 0): void {
    if (!bounds) {
      if (this.group) this.group.visible = false;
      return;
    }
    const group = this.ensureGroup();
    const width = Math.max(0.01, bounds.maxX - bounds.minX);
    const depth = Math.max(0.01, bounds.maxZ - bounds.minZ);
    group.position.set(
      (bounds.minX + bounds.maxX) / 2,
      floorY + FLOOR_LIFT_M,
      (bounds.minZ + bounds.maxZ) / 2
    );
    group.scale.set(width, 1, depth);
    group.visible = true;
    // The viewer freezes static matrices, so update this subtree explicitly.
    group.updateMatrix();
    group.updateMatrixWorld(true);
  }

  public isVisible(): boolean {
    return this.group?.visible ?? false;
  }

  private ensureGroup(): THREE.Group {
    if (this.group) return this.group;
    const group = new THREE.Group();
    group.name = 'viewer.roomHighlight';
    group.userData.isAnnotationGroup = true;
    group.renderOrder = 10;

    const fill = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: FILL_COLOR,
        transparent: true,
        opacity: FILL_OPACITY,
        depthWrite: false,
        side: THREE.DoubleSide,
      })
    );
    const corners = [
      new THREE.Vector3(-0.5, 0, -0.5),
      new THREE.Vector3(0.5, 0, -0.5),
      new THREE.Vector3(0.5, 0, 0.5),
      new THREE.Vector3(-0.5, 0, 0.5),
    ];
    const outline = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(corners),
      new THREE.LineBasicMaterial({
        color: FILL_COLOR,
        transparent: true,
        opacity: OUTLINE_OPACITY,
        depthWrite: false,
      })
    );
    for (const child of [fill, outline]) {
      child.castShadow = false;
      child.receiveShadow = false;
      child.userData.isAnnotationGroup = true;
      // Never pickable: clicks pass through to the room geometry below.
      child.raycast = () => undefined;
      child.renderOrder = 10;
      group.add(child);
    }
    group.matrixAutoUpdate = false;
    for (const child of group.children) {
      child.updateMatrix();
      child.matrixAutoUpdate = false;
    }
    this.scene.add(group);
    return group;
  }
}
