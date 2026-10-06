import * as THREE from 'three';
import type { CircuitId } from '../../types/knx.ts';
import type { InteractiveUserData } from '../../types/scene.ts';

interface ClosedDoorwayGeometry {
  readonly centerX: number;
  readonly centerZ: number;
  readonly minY: number;
  readonly maxY: number;
  readonly tangentX: number;
  readonly tangentZ: number;
  readonly normalX: number;
  readonly normalZ: number;
  readonly halfWidth: number;
}

interface HingedDoorState {
  readonly id: string;
  pivot: THREE.Group;
  readonly axis: 'x' | 'y' | 'z';
  closedAngle: number;
  openAngle: number;
  isOpen: boolean;
  progress: number;
  speed: number;
  overheadTrackZ?: number;
  closedPosZ?: number;
  isFoldingFloorMat?: boolean;
  closedPivotPos?: THREE.Vector3;
  stowedPivotOffset?: THREE.Vector3;
  linkedDrawerId?: string;
  onStateChange?: (isOpen: boolean) => void;
  bargeSwingSign?: -1 | 1;
  fromAngle?: number;
  closedGeometry?: ClosedDoorwayGeometry;
}

interface BifoldCupboardState {
  readonly id: string;
  outerPivot: THREE.Group;
  innerLeaf: THREE.Group;
  readonly sideSign: -1 | 1; // -1 = left folding pair, +1 = right folding pair
  readonly leafWidth: number;
  readonly closedOuterX: number;
  readonly closedInnerX: number;
  readonly faceZ: number;
  isOpen: boolean;
  progress: number;
  readonly speed: number;
}

interface SlidingDrawerState {
  readonly id: string;
  group: THREE.Group;
  readonly closedPos: THREE.Vector3;
  readonly openPos: THREE.Vector3;
  isOpen: boolean;
  progress: number;
  readonly speed: number;
  linkedDoorId?: string;
  fadeOutWhenOpen?: boolean;
  fadeMaterials?: THREE.Material[];
}

function prepareFadeMaterialsForGroup(root: THREE.Object3D): THREE.Material[] {
  const clonedBySource = new Map<THREE.Material, THREE.Material>();
  const result: THREE.Material[] = [];
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    if (Array.isArray(obj.material)) {
      obj.material = obj.material.map((m: THREE.Material) => {
        let cloned = clonedBySource.get(m);
        if (!cloned) {
          cloned = m.clone();
          cloned.userData = { ...cloned.userData, isDynamicGolfBagMaterial: true };
          clonedBySource.set(m, cloned);
          result.push(cloned);
        }
        return cloned;
      });
    } else if (obj.material) {
      const m = obj.material as THREE.Material;
      let cloned = clonedBySource.get(m);
      if (!cloned) {
        cloned = m.clone();
        cloned.userData = { ...cloned.userData, isDynamicGolfBagMaterial: true };
        clonedBySource.set(m, cloned);
        result.push(cloned);
      }
      obj.material = cloned;
    }
  });
  return result;
}

function applyGroupFadeAlpha(
  group: THREE.Object3D,
  materials: readonly THREE.Material[] | undefined,
  alpha: number
): void {
  const clamped = Math.max(0, Math.min(1, alpha));
  group.visible = clamped > 0.005;
  if (materials) {
    for (const mat of materials) {
      mat.transparent = clamped < 0.999;
      mat.opacity = clamped;
      mat.depthWrite = clamped > 0.25;
      mat.needsUpdate = true;
    }
  }
  group.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = clamped > 0.35;
    }
  });
}

interface PulleyMaidState {
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

interface MotorizedCarGatePairState {
  northPivot: THREE.Group;
  southPivot: THREE.Group;
  readonly northOpenAngle: number;
  readonly southOpenAngle: number;
  isOpen: boolean;
  progress: number;
  readonly speed: number;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const tmpDoorBounds = new THREE.Box3();
const doorManualCloseTimestampMs = new Map<string, number>();

/**
 * Corner and adjacent door pairs whose 3D open swing envelopes share the same pocket.
 * Opening any door in this map automatically closes its conflicting neighbour(s) so doors
 * never intersect one another.
 */
const CONFLICTING_DOOR_IDS: Readonly<Record<string, readonly string[]>> = {
  'door-1': ['door-11'],
  'door-11': ['door-1'],
  'door-3': ['door-6', 'door-7'],
  'door-6': ['door-3'],
  'door-7': ['door-3'],
  'door-32': ['door-34', 'door-35', 'door-36', 'door-37', 'bifold-cupboard-1'],
  'door-34': ['door-32', 'bifold-cupboard-1'],
  'door-35': ['door-32', 'bifold-cupboard-1'],
  'door-36': ['door-32', 'bifold-cupboard-1'],
  'door-37': ['door-32', 'bifold-cupboard-1'],
  'door-39': ['bifold-cupboard-1'],
  'door-41': ['bifold-cupboard-1'],
  'bifold-cupboard-1': [
    'door-32',
    'door-34',
    'door-35',
    'door-36',
    'door-37',
    'door-39',
    'door-41',
  ],
  'door-38': ['door-42'],
  'door-42': ['door-38'],
  'door-40': ['door-60'],
  'door-60': ['door-40'],
  'door-43': ['door-46', 'door-47'],
  'door-46': ['door-43'],
  'door-47': ['door-43'],
  'door-56': ['door-57'],
  'door-57': ['door-56'],
};

/**
 * Encapsulates all interactive 3D props in the Crox Farmhouse Digital Twin:
 * - Hinged kitchen/island/utility cupboard doors, appliance doors, AGA doors, Miele doors & room doors
 * - Bi-fold countertop pantry doors
 * - Sliding pan drawers & warming drawer
 * - Lowering/raising Utility Room Pulley Maid ceiling clothes airer
 * - Motorized 10-second Dual-Leaf Front Car Entrance Gates (controlled via 3D click & KNX Bus GA 1/5/1)
 * - Clicking bifold doors & all 8 KNX light fixtures
 */
export class SceneInteractionManager {
  private readonly interactiveMeshes: THREE.Object3D[];
  private readonly hingedDoors = new Map<string, HingedDoorState>();
  private readonly bifoldCupboards = new Map<string, BifoldCupboardState>();
  private readonly slidingDrawers = new Map<string, SlidingDrawerState>();
  private readonly toggleCallbacks = new Map<
    string,
    { readonly onToggle: () => void; readonly dynamicRoots: readonly THREE.Object3D[] }
  >();
  private pulleyMaid: PulleyMaidState | null = null;
  private carGatePair: MotorizedCarGatePairState | null = null;
  private nextId = 1;

  public constructor(interactiveMeshes: THREE.Object3D[]) {
    this.interactiveMeshes = interactiveMeshes;
  }

  private allocateId(prefix: string): string {
    const id = `${prefix}-${this.nextId}`;
    this.nextId += 1;
    return id;
  }

  /**
   * Marks an Object3D and all its descendant Meshes with the given InteractiveUserData
   * and registers them for raycasting.
   */
  public registerClickableObject(root: THREE.Object3D, data: InteractiveUserData): void {
    root.userData = { ...root.userData, ...data };
    root.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.userData = { ...child.userData, ...data };
        this.interactiveMeshes.push(child);
      }
    });
  }

  /**
   * Marks a light fixture mesh or group so clicking any part of it toggles the given KNX circuit.
   */
  public registerLightFixture(root: THREE.Object3D, circuitId: CircuitId): void {
    this.registerClickableObject(root, { circuitId });
  }

  /**
   * Marks a bifold door leaf or frame so clicking it toggles the 4-leaf concertina bifold doors.
   */
  public registerBifoldDoor(root: THREE.Object3D): void {
    this.registerClickableObject(root, { isBifoldDoor: true });
  }

  /**
   * Wraps `doorObj` (which must already have its local position set and be added to `parent`)
   * in a hinge pivot group located at `doorObj.position + hingeOffsetInParent`, so clicking
   * any mesh inside `doorObj` smoothly swings it open/closed around `axis`.
   */
  public registerHingedDoor(
    parent: THREE.Object3D,
    doorObj: THREE.Object3D,
    hingeOffsetInParent: THREE.Vector3,
    axis: 'x' | 'y' | 'z',
    openAngle: number,
    initialAngle = 0
  ): THREE.Group {
    const id = this.allocateId('door');
    const pivot = new THREE.Group();
    pivot.position.copy(doorObj.position).add(hingeOffsetInParent);

    parent.remove(doorObj);
    doorObj.position.copy(hingeOffsetInParent).negate();
    pivot.add(doorObj);

    if (initialAngle !== 0) {
      pivot.rotation[axis] = initialAngle;
    }

    parent.add(pivot);
    this.registerClickableObject(pivot, { interactableId: id });
    pivot.userData = { ...pivot.userData, doorRole: 'pivot' };

    this.hingedDoors.set(id, {
      id,
      pivot,
      axis,
      closedAngle: initialAngle,
      openAngle,
      isOpen: false,
      progress: 0,
      speed: 2.6,
    });

    return pivot;
  }

  /**
   * Registers a single-piece retractable up-and-over overhead garage door (`axis = 'x'`).
   * As the panel tilts upward (`rotation.x` from `0` to `+openAngle`), the top roller pivot
   * glides rearward (`+z`) along the horizontal overhead ceiling tracks by `overheadTrackZ * sin(rx)`,
   * so the bottom edge rises straight up the doorway jambs without ever swinging inward into a parked car.
   */
  public registerOverheadGarageDoor(
    parent: THREE.Object3D,
    doorObj: THREE.Object3D,
    hingeOffsetInParent: THREE.Vector3,
    overheadTrackZ: number,
    openAngle = Math.PI * 0.495
  ): THREE.Group {
    const id = this.allocateId('door');
    const pivot = new THREE.Group();
    pivot.position.copy(doorObj.position).add(hingeOffsetInParent);

    parent.remove(doorObj);
    doorObj.position.copy(hingeOffsetInParent).negate();
    pivot.add(doorObj);

    parent.add(pivot);
    this.registerClickableObject(pivot, { interactableId: id });
    pivot.userData = { ...pivot.userData, doorRole: 'pivot' };

    this.hingedDoors.set(id, {
      id,
      pivot,
      axis: 'x',
      closedAngle: 0,
      openAngle,
      isOpen: false,
      progress: 0,
      speed: 1.65,
      overheadTrackZ,
      closedPosZ: pivot.position.z,
    });

    return pivot;
  }

  /**
   * Registers the track-mounted sliding Golf Simulator front stance mat and links it
   * with the Callaway Tour Golf Bag (`bagGroup`).
   */
  public registerFoldingGolfMat(
    parent: THREE.Object3D,
    foldingMatObj: THREE.Object3D,
    hingeOffsetInParent: THREE.Vector3,
    bagGroup: THREE.Group,
    bagStowedDelta: THREE.Vector3,
    openAngle = Math.PI * 0.994,
    onStateChange?: (isFolded: boolean) => void
  ): { readonly matPivot: THREE.Group; readonly matDoorId: string; readonly bagDrawerId: string } {
    const matDoorId = this.allocateId('door');
    const bagDrawerId = this.allocateId('drawer');

    const matPivot = new THREE.Group();
    matPivot.name = 'outbuildings.barn.golfSimulator.turfMat.foldingPivot';
    matPivot.position.copy(foldingMatObj.position).add(hingeOffsetInParent);

    parent.remove(foldingMatObj);
    foldingMatObj.position.copy(hingeOffsetInParent).negate();
    matPivot.add(foldingMatObj);
    parent.add(matPivot);

    this.registerClickableObject(matPivot, { interactableId: matDoorId });
    matPivot.userData = { ...matPivot.userData, doorRole: 'pivot' };
    this.registerClickableObject(bagGroup, { interactableId: bagDrawerId });
    bagGroup.userData = { ...bagGroup.userData, drawerRole: 'group' };

    this.hingedDoors.set(matDoorId, {
      id: matDoorId,
      pivot: matPivot,
      axis: 'z',
      closedAngle: 0,
      openAngle: 0,
      isOpen: false,
      progress: 0,
      speed: 0.95,
      isFoldingFloorMat: true,
      closedPivotPos: matPivot.position.clone(),
      stowedPivotOffset:
        bagStowedDelta.lengthSq() > 0.001
          ? bagStowedDelta.clone()
          : new THREE.Vector3(-1.96, 0.036, 0),
      linkedDrawerId: bagDrawerId,
      onStateChange,
    });

    const closedPos = bagGroup.position.clone();
    const openPos = closedPos.clone();
    void openAngle;
    const fadeMaterials = prepareFadeMaterialsForGroup(bagGroup);
    this.slidingDrawers.set(bagDrawerId, {
      id: bagDrawerId,
      group: bagGroup,
      closedPos,
      openPos,
      isOpen: false,
      progress: 0,
      speed: 2.4,
      linkedDoorId: matDoorId,
      fadeOutWhenOpen: true,
      fadeMaterials,
    });

    return { matPivot, matDoorId, bagDrawerId };
  }

  private applySlidingGolfMatKinematics(door: HingedDoorState): void {
    if (!door.closedPivotPos) {
      door.closedPivotPos = door.pivot.position.clone();
    }
    const p = door.progress;
    const rampEnd = 0.22;

    // Dishwasher-Rack Threshold Ramp Kinematics:
    // - Both sets of floor tracks (`outsideTrack` in the limestone tiles & `insideTrack` in the inside mat) remain 100% FIXED & FLUSH!
    // - During `p in [0..0.22]`, the front rollers roll up the 220mm (8°) sloped threshold ramp bridge at `x = 0` while the rear edge is lifted 35mm into its step-up roller detent.
    // - During `p in [0..1.00]`, the mat rolls smoothly along the fixed channels (`slideDistanceX = 1.98m`).
    const rawMatLift = Math.min(1, Math.max(0, p / rampEnd));
    const matLiftSmooth = easeInOutCubic(rawMatLift);
    const slideSmooth = easeInOutCubic(p);
    const liftHeightY = 0.036;
    const slideDistanceX = 1.98;

    // Slight nose-up pitch (~0.8°) as the leading rollers climb the threshold ramp before the rear step-up rollers lock level
    const rampPitchZ = p < rampEnd ? Math.sin((p / rampEnd) * Math.PI) * -0.014 : 0;

    door.pivot.rotation.set(0, 0, rampPitchZ);
    door.pivot.position.set(
      door.closedPivotPos.x - slideSmooth * slideDistanceX,
      door.closedPivotPos.y + matLiftSmooth * liftHeightY,
      door.closedPivotPos.z
    );

    const rollerAngleZ = (slideSmooth * slideDistanceX) / 0.009;
    door.pivot.traverse((child) => {
      if (child.userData?.isGolfMatTrackRoller) {
        child.rotation.z = rollerAngleZ;
      }
    });
  }

  /**
   * Registers a 2-leaf folding bi-fold cupboard door pair (such as the upper Pantry doors)
   * so clicking either leaf folds both leaves together in a concertina motion.
   */
  public registerBifoldCupboardPair(
    parent: THREE.Object3D,
    outerLeaf: THREE.Group,
    innerLeaf: THREE.Group,
    sideSign: -1 | 1,
    leafWidth: number,
    faceZ: number
  ): void {
    const id = this.allocateId('bifold-cupboard');
    const closedOuterX = outerLeaf.position.x;
    const closedInnerX = innerLeaf.position.x;

    // Outer hinge is on the outer edge of outerLeaf:
    const outerHingeX = closedOuterX + sideSign * (leafWidth * 0.5);
    const outerPivot = new THREE.Group();
    outerPivot.position.set(outerHingeX, outerLeaf.position.y, faceZ);

    parent.remove(outerLeaf);
    outerLeaf.position.set(-sideSign * (leafWidth * 0.5), 0, 0);
    outerPivot.add(outerLeaf);
    parent.add(outerPivot);

    this.registerClickableObject(outerPivot, { interactableId: id });
    this.registerClickableObject(innerLeaf, { interactableId: id });
    outerPivot.userData = { ...outerPivot.userData, bifoldRole: 'outerPivot' };
    innerLeaf.userData = { ...innerLeaf.userData, bifoldRole: 'innerLeaf' };

    this.bifoldCupboards.set(id, {
      id,
      outerPivot,
      innerLeaf,
      sideSign,
      leafWidth,
      closedOuterX,
      closedInnerX,
      faceZ,
      isOpen: false,
      progress: 0,
      speed: 2.4,
    });
  }

  /**
   * Registers a sliding pan drawer or warming drawer so clicking it smoothly slides it out/in.
   */
  public registerSlidingDrawer(
    drawerGroup: THREE.Group,
    slideDelta: THREE.Vector3
  ): void {
    const id = this.allocateId('drawer');
    const closedPos = drawerGroup.position.clone();
    const openPos = closedPos.clone().add(slideDelta);

    this.registerClickableObject(drawerGroup, { interactableId: id });
    drawerGroup.userData = { ...drawerGroup.userData, drawerRole: 'group' };

    this.slidingDrawers.set(id, {
      id,
      group: drawerGroup,
      closedPos,
      openPos,
      isOpen: false,
      progress: 0,
      speed: 2.8,
    });
  }

  /**
   * Registers the Utility Room Pulley Maid ceiling clothes airer so clicking it lowers/raises
   * the wooden drying laths and dynamically adjusts the vertical hoist ropes.
   */
  public registerPulleyMaid(config: {
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
  }): void {
    const id = 'pulley-maid';
    this.registerClickableObject(config.clickRoot, { interactableId: id });
    config.rackMovingGroup.userData = {
      ...config.rackMovingGroup.userData,
      pulleyMaidRole: 'rackMovingGroup',
    };
    config.vertRopes.forEach((rope, idx) => {
      rope.userData = {
        ...rope.userData,
        pulleyMaidRole: 'vertRope',
        pulleyMaidIndex: idx,
      };
    });
    config.pulleyWheels.forEach((wheel, idx) => {
      wheel.userData = {
        ...wheel.userData,
        pulleyMaidRole: 'pulleyWheel',
        pulleyMaidIndex: idx,
      };
    });
    config.wallHaulRope.userData = {
      ...config.wallHaulRope.userData,
      pulleyMaidRole: 'wallHaulRope',
    };

    this.pulleyMaid = {
      id,
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

  /**
   * Registers the Motorized Dual-Leaf Front Car Entrance Gates (`Z = +13.02m..+15.94m` at `X = -22.33m`)
   * so both leaves swing open/closed together slowly (~10.0 seconds) when clicked or controlled via the KNX bus.
   */
  public registerMotorizedCarGatePair(
    parent: THREE.Object3D,
    northLeaf: THREE.Object3D,
    northHingeOffset: THREE.Vector3,
    northOpenAngle: number,
    southLeaf: THREE.Object3D,
    southHingeOffset: THREE.Vector3,
    southOpenAngle: number,
    travelDurationSec = 10.0
  ): void {
    const northPivot = new THREE.Group();
    northPivot.position.copy(northLeaf.position).add(northHingeOffset);
    parent.remove(northLeaf);
    northLeaf.position.copy(northHingeOffset).negate();
    northPivot.add(northLeaf);
    parent.add(northPivot);

    const southPivot = new THREE.Group();
    southPivot.position.copy(southLeaf.position).add(southHingeOffset);
    parent.remove(southLeaf);
    southLeaf.position.copy(southHingeOffset).negate();
    southPivot.add(southLeaf);
    parent.add(southPivot);

    this.registerClickableObject(northPivot, { isCarGate: true });
    this.registerClickableObject(southPivot, { isCarGate: true });
    northPivot.userData = { ...northPivot.userData, carGateRole: 'northPivot' };
    southPivot.userData = { ...southPivot.userData, carGateRole: 'southPivot' };

    this.carGatePair = {
      northPivot,
      southPivot,
      northOpenAngle,
      southOpenAngle,
      isOpen: false,
      progress: 0,
      speed: 1.0 / Math.max(1.0, travelDurationSec),
    };
  }

  public setCarGatesOpen(isOpen: boolean): void {
    if (this.carGatePair) {
      this.carGatePair.isOpen = isOpen;
    }
  }

  public isCarGatesOpen(): boolean {
    return this.carGatePair?.isOpen ?? false;
  }

  public getCarGatesProgress(): number {
    return this.carGatePair?.progress ?? 0;
  }

  /**
   * Registers an interactive prop with a custom click toggle callback (e.g. extending the dining table).
   */
  public registerToggleCallback(
    root: THREE.Object3D,
    onToggle: () => void,
    dynamicRoots: readonly THREE.Object3D[] = [root]
  ): void {
    const id = this.allocateId('toggle');
    this.registerClickableObject(root, { interactableId: id });
    this.toggleCallbacks.set(id, { onToggle, dynamicRoots });
  }

  private closeConflictingDoors(openedId: string): void {
    const conflicts = CONFLICTING_DOOR_IDS[openedId];
    if (!conflicts) return;
    for (const conflictId of conflicts) {
      const otherDoor = this.hingedDoors.get(conflictId);
      if (otherDoor && otherDoor.isOpen) {
        otherDoor.fromAngle = undefined;
        otherDoor.isOpen = false;
        otherDoor.speed = 3.2;
      }
      const otherBifold = this.bifoldCupboards.get(conflictId);
      if (otherBifold && otherBifold.isOpen) {
        otherBifold.isOpen = false;
      }
    }
  }

  /**
   * Toggles the interactive prop with the given `interactableId`.
   * Returns true if a prop was matched and toggled.
   */
  public handleInteractableClick(interactableId: string): boolean {
    const toggleCb = this.toggleCallbacks.get(interactableId);
    if (toggleCb) {
      toggleCb.onToggle();
      return true;
    }

    const door = this.hingedDoors.get(interactableId);
    if (door) {
      door.fromAngle = undefined;
      door.isOpen = !door.isOpen;
      door.speed = door.isFoldingFloorMat
        ? 0.95
        : door.overheadTrackZ !== undefined
          ? 1.55
          : 2.8;
      if (door.linkedDrawerId) {
        const linkedDrawer = this.slidingDrawers.get(door.linkedDrawerId);
        if (linkedDrawer) {
          linkedDrawer.isOpen = door.isOpen;
        }
      }
      door.onStateChange?.(door.isOpen);
      if (door.isOpen) {
        this.closeConflictingDoors(interactableId);
      } else {
        doorManualCloseTimestampMs.set(interactableId, performance.now());
      }
      return true;
    }

    const bifoldCup = this.bifoldCupboards.get(interactableId);
    if (bifoldCup) {
      bifoldCup.isOpen = !bifoldCup.isOpen;
      if (bifoldCup.isOpen) {
        this.closeConflictingDoors(interactableId);
      }
      return true;
    }

    const drawer = this.slidingDrawers.get(interactableId);
    if (drawer) {
      drawer.isOpen = !drawer.isOpen;
      if (drawer.linkedDoorId) {
        const linkedDoor = this.hingedDoors.get(drawer.linkedDoorId);
        if (linkedDoor) {
          linkedDoor.fromAngle = undefined;
          linkedDoor.isOpen = drawer.isOpen;
          linkedDoor.speed = 1.55;
          linkedDoor.onStateChange?.(linkedDoor.isOpen);
        }
      }
      return true;
    }

    if (this.pulleyMaid && this.pulleyMaid.id === interactableId) {
      this.pulleyMaid.isLowered = !this.pulleyMaid.isLowered;
      return true;
    }

    return false;
  }

  public setHingedDoorOpen(interactableId: string, isOpen: boolean): boolean {
    const door = this.hingedDoors.get(interactableId);
    if (!door) return false;
    door.fromAngle = undefined;
    door.isOpen = isOpen;
    door.speed = 2.8;
    door.onStateChange?.(door.isOpen);
    if (isOpen) {
      this.closeConflictingDoors(interactableId);
    } else {
      doorManualCloseTimestampMs.set(interactableId, performance.now());
    }
    return true;
  }

  private readonly tmpHingeWorld = new THREE.Vector3();

  /**
   * Computes and caches the world-space closed doorway threshold geometry for `door`:
   * - `(centerX, centerZ)` is the world XZ midpoint of the closed door leaf
   * - `(tangentX, tangentZ)` points along the closed door plane from the hinge jamb to the latch jamb
   * - `(normalX, normalZ) = (tangentZ, -tangentX)` is perpendicular to the closed doorway plane AND
   *   points in the exact world XZ direction that increasing `pivot.rotation.y` (`deltaAngle > 0`) swings the door leaf!
   */
  private getClosedDoorwayGeometry(door: HingedDoorState): ClosedDoorwayGeometry {
    if (door.closedGeometry) return door.closedGeometry;

    const savedRot = door.pivot.rotation[door.axis];
    if (savedRot !== door.closedAngle) {
      door.pivot.rotation[door.axis] = door.closedAngle;
      door.pivot.updateMatrixWorld(true);
    } else {
      door.pivot.updateMatrixWorld(true);
    }

    tmpDoorBounds.setFromObject(door.pivot);
    door.pivot.getWorldPosition(this.tmpHingeWorld);

    if (savedRot !== door.closedAngle) {
      door.pivot.rotation[door.axis] = savedRot;
      door.pivot.updateMatrixWorld(true);
    }

    const centerX = (tmpDoorBounds.min.x + tmpDoorBounds.max.x) * 0.5;
    const centerZ = (tmpDoorBounds.min.z + tmpDoorBounds.max.z) * 0.5;
    const dx = centerX - this.tmpHingeWorld.x;
    const dz = centerZ - this.tmpHingeWorld.z;
    const distFromHinge = Math.hypot(dx, dz);
    const boxSpan = Math.max(
      tmpDoorBounds.max.x - tmpDoorBounds.min.x,
      tmpDoorBounds.max.z - tmpDoorBounds.min.z
    );
    const halfWidth = distFromHinge >= 0.18 ? distFromHinge : Math.max(0.35, boxSpan * 0.5);
    const tangentX = distFromHinge >= 1e-4 ? dx / distFromHinge : 1;
    const tangentZ = distFromHinge >= 1e-4 ? dz / distFromHinge : 0;
    const normalX = tangentZ;
    const normalZ = -tangentX;

    const geom: ClosedDoorwayGeometry = {
      centerX,
      centerZ,
      minY: tmpDoorBounds.min.y,
      maxY: tmpDoorBounds.max.y,
      tangentX,
      tangentZ,
      normalX,
      normalZ,
      halfWidth,
    };
    door.closedGeometry = geom;
    return geom;
  }

  /**
   * Determines whether a player at `(footX, footY, footZ)` moving with horizontal unit direction
   * `(moveDirX, moveDirZ)` is genuinely running/walking **through** `door`'s doorway (rather than
   * running parallel past the door in a corridor).
   *
   * Returns the desired `rotation.y` swing sign (`+1` or `-1`) so the door swings open **away**
   * from the player in whichever direction they are running through, or `null` if not traversing.
   */
  private computeDoorwayTraversalSwingSign(
    door: HingedDoorState,
    footX: number,
    footY: number,
    footZ: number,
    moveDirX: number,
    moveDirZ: number,
    isSprinting: boolean,
    isRaycastHit: boolean
  ): -1 | 1 | null {
    const geom = this.getClosedDoorwayGeometry(door);
    if (geom.maxY <= footY + 0.25 || geom.minY >= footY + 1.65) {
      return null;
    }

    const relX = footX - geom.centerX;
    const relZ = footZ - geom.centerZ;
    // Lateral offset along the doorway (0 = center, ±halfWidth = jambs)
    const u = relX * geom.tangentX + relZ * geom.tangentZ;
    // Signed perpendicular distance from the closed doorway plane
    const n = relX * geom.normalX + relZ * geom.normalZ;

    // Velocity components along and perpendicular to the doorway plane
    const vu = moveDirX * geom.tangentX + moveDirZ * geom.tangentZ;
    const vn = moveDirX * geom.normalX + moveDirZ * geom.normalZ;

    // 1. Must be moving substantially across the doorway plane (never open when running parallel past a door!)
    if (Math.abs(vn) < 0.58) {
      return null;
    }

    // 2. Must be on the approach side of the doorway (or right in the threshold) moving toward/across n = 0
    if (n * vn > 0.05) {
      return null;
    }

    const maxPerpDist =
      isRaycastHit && door.isOpen
        ? 0.88
        : isSprinting
          ? 0.44
          : 0.34;
    if (Math.abs(n) > maxPerpDist) {
      return null;
    }

    // 3. Must be within the doorway span and projected plane crossing must pass between the doorway jambs
    if (Math.abs(u) > geom.halfWidth + 0.04) {
      return null;
    }
    const distToPlane = Math.max(0, -n / vn);
    const uCross = u + vu * distToPlane;
    if (Math.abs(uCross) > geom.halfWidth - 0.02) {
      return null;
    }

    return vn >= 0 ? 1 : -1;
  }

  /**
   * Returns true if `interactableId` is a walk-through room, exterior, courtyard, or stable door
   * (rather than a cupboard, larder, or appliance door).
   */
  public isWalkthroughDoor(interactableId: string): boolean {
    const door = this.hingedDoors.get(interactableId);
    if (!door || door.axis !== 'y') return false;
    const pivotName = (
      door.pivot.name +
      ' ' +
      (door.pivot.children[0]?.name ?? '')
    ).toLowerCase();
    if (
      pivotName.includes('understairs') ||
      pivotName.includes('cupboard') ||
      pivotName.includes('larder') ||
      pivotName.includes('fridge') ||
      pivotName.includes('freezer') ||
      pivotName.includes('winecooler')
    ) {
      return false;
    }
    const geom = this.getClosedDoorwayGeometry(door);
    const h = geom.maxY - geom.minY;
    const w = geom.halfWidth * 2;
    return h >= 0.92 && h <= 2.15 && w >= 0.45;
  }

  private applyDoorBargeSwing(
    door: HingedDoorState,
    desiredSign: -1 | 1 | undefined,
    bargeSpeed: number
  ): void {
    if (!door.isOpen) {
      const currentEffectiveOpen = this.getEffectiveDoorOpenAngle(door);
      const currentSign: -1 | 1 =
        currentEffectiveOpen - door.closedAngle >= 0 ? 1 : -1;
      door.fromAngle =
        door.progress > 0.01 ? door.pivot.rotation[door.axis] : undefined;
      door.bargeSwingSign = desiredSign ?? currentSign;
      door.progress = 0;
      door.isOpen = true;
      door.speed = bargeSpeed;
      this.closeConflictingDoors(door.id);
    } else if (door.progress < 0.95 && door.speed < bargeSpeed) {
      door.speed = bargeSpeed;
    }
  }

  /**
   * Call-of-Duty style door barge: if `interactableId` is a closed walk-through door and the player is
   * genuinely running **through** the doorway (not running parallel past it), automatically flings
   * it open away from the player's movement direction (including both halves of the split Utility
   * Stable Door `door-1` / `door-2`) and returns `true` so First-Person Walkthrough collision lets
   * the player run right through. If the door is already open, it stays open without swinging the other way.
   */
  public bargeOpenWalkthroughDoor(
    interactableId: string,
    isSprinting = false,
    footX?: number,
    footY?: number,
    footZ?: number,
    moveDirX?: number,
    moveDirZ?: number
  ): boolean {
    if (!this.isWalkthroughDoor(interactableId)) return false;
    const door = this.hingedDoors.get(interactableId);
    if (!door) return false;

    const lastCloseMs = doorManualCloseTimestampMs.get(interactableId) ?? 0;
    if (performance.now() - lastCloseMs < 650) {
      return false;
    }

    // If the door is already open, do not swing it the other way again; allow passing while it finishes opening
    if (door.isOpen) {
      if (door.progress < 0.95) {
        const bargeSpeed = isSprinting ? 6.8 : 4.8;
        if (door.speed < bargeSpeed) door.speed = bargeSpeed;
        return true;
      }
      return false;
    }

    let desiredSign: -1 | 1 | undefined;
    if (
      footX !== undefined &&
      footY !== undefined &&
      footZ !== undefined &&
      moveDirX !== undefined &&
      moveDirZ !== undefined
    ) {
      const sign = this.computeDoorwayTraversalSwingSign(
        door,
        footX,
        footY,
        footZ,
        moveDirX,
        moveDirZ,
        isSprinting,
        true
      );
      if (sign === null) {
        return false;
      }
      desiredSign = sign;
    }

    const bargeSpeed = isSprinting ? 6.8 : 4.8;
    this.applyDoorBargeSwing(door, desiredSign, bargeSpeed);

    // If barging through the split Utility Room Stable Door (`door-1` lower / `door-2` upper),
    // open both halves together in the same direction so the player can run straight through.
    if (interactableId === 'door-1' || interactableId === 'door-2') {
      const partnerId = interactableId === 'door-1' ? 'door-2' : 'door-1';
      const partner = this.hingedDoors.get(partnerId);
      if (partner && !partner.isOpen) {
        this.applyDoorBargeSwing(partner, desiredSign, bargeSpeed);
      }
    }

    return true;
  }

  /**
   * Checks if the player's capsule in First-Person Walkthrough mode is running/walking **through**
   * any closed walk-through doorway on the same floor and pre-emptively barges it open away from the
   * player's movement direction (both ways depending on which way you ran through).
   */
  public bargeNearbyWalkthroughDoors(
    footX: number,
    footY: number,
    footZ: number,
    moveDirX: number,
    moveDirZ: number,
    isSprinting = false
  ): boolean {
    let anyBarged = false;
    const now = performance.now();

    for (const [id, door] of this.hingedDoors.entries()) {
      if (door.isOpen || door.axis !== 'y') continue;
      if (now - (doorManualCloseTimestampMs.get(id) ?? 0) < 650) continue;
      if (!this.isWalkthroughDoor(id)) continue;

      const desiredSign = this.computeDoorwayTraversalSwingSign(
        door,
        footX,
        footY,
        footZ,
        moveDirX,
        moveDirZ,
        isSprinting,
        false
      );
      if (desiredSign === null) continue;

      if (
        this.bargeOpenWalkthroughDoor(
          id,
          isSprinting,
          footX,
          footY,
          footZ,
          moveDirX,
          moveDirZ
        )
      ) {
        anyBarged = true;
      }
    }
    return anyBarged;
  }

  /**
   * Computes the default collision-free open angle for a hinged door when clicked:
   * - Provides a ~86° swing for doors whose initial registration specified `openAngle = 0`
   * - Redirects `door-14` (Dining Courtyard Door) inward to clear the exterior terracotta planter
   * - Redirects `door-28` (Bedroom 2 Door) inward into Bedroom 2 so it never collides with `door-29`
   * - Clamps over-rotated (> 83°) cupboard/corner doors so adjacent doors never cross past 90°
   *   or intersect walls/furniture
   */
  private getDefaultDoorOpenAngle(door: HingedDoorState): number {
    if (door.id === 'door-14') return 1.45;
    if (door.id === 'door-28') return -1.35;
    if (door.id === 'door-13') return -1.38;
    if (door.id === 'door-19') return 1.38;
    if (door.id === 'door-42') return -1.28;
    if (door.id === 'door-60') return -1.28;
    if (door.id === 'door-56') return 1.25;
    if (door.id === 'door-57') return 1.15;

    if (door.overheadTrackZ !== undefined || door.isFoldingFloorMat) {
      return door.openAngle;
    }

    const rawDelta = door.openAngle - door.closedAngle;
    if (Math.abs(rawDelta) < 0.05) {
      const swingSign = door.pivot.position.z > 1.5 ? 1 : -1;
      return door.closedAngle + swingSign * Math.PI * 0.48;
    }

    const maxSwing = 1.45;
    if (Math.abs(rawDelta) > maxSwing) {
      return door.closedAngle + Math.sign(rawDelta) * maxSwing;
    }
    return door.openAngle;
  }

  private getEffectiveDoorOpenAngle(door: HingedDoorState): number {
    const defaultOpen = this.getDefaultDoorOpenAngle(door);
    if (door.bargeSwingSign !== undefined && door.axis === 'y') {
      const mag = Math.abs(defaultOpen - door.closedAngle);
      return door.closedAngle + door.bargeSwingSign * mag;
    }
    return defaultOpen;
  }

  /**
   * Returns a concise action prompt label for a looked-at interactive mesh
   * (e.g. "Open Door", "Close Cupboard", "Open AGA Lid", "Toggle Light Switch").
   */
  public describeInteractable(mesh: THREE.Object3D, isBifoldsOpen = false): string {
    const data = mesh.userData as InteractiveUserData;
    const id = data.interactableId;
    if (id) {
      const door = this.hingedDoors.get(id);
      if (door) {
        const verb = door.isOpen ? 'Close' : 'Open';
        const chainNames = [
          mesh.name,
          mesh.parent?.name ?? '',
          door.pivot.name,
          door.pivot.children[0]?.name ?? '',
        ]
          .join(' ')
          .toLowerCase();
        if (chainNames.includes('lid')) return `${verb} AGA Simmering/Boiling Lid`;
        if (
          chainNames.includes('aga') ||
          chainNames.includes('roasting') ||
          chainNames.includes('baking') ||
          chainNames.includes('simmering') ||
          chainNames.includes('warming')
        ) {
          return `${verb} AGA Oven Door`;
        }
        if (door.isFoldingFloorMat || chainNames.includes('turfmat')) {
          return `${door.isOpen ? 'Roll Out Flush' : 'Lift & Roll In'} Golf Simulator Mat`;
        }
        if (door.overheadTrackZ !== undefined) {
          return `${verb} Garage Door`;
        }
        if (
          door.axis !== 'y' ||
          chainNames.includes('fridge') ||
          chainNames.includes('freezer') ||
          (chainNames.includes('wine') && !chainNames.includes('cellar')) ||
          chainNames.includes('dishwasher') ||
          chainNames.includes('miele')
        ) {
          return `${verb} Appliance Door`;
        }
        if (this.isWalkthroughDoor(id)) {
          return `${verb} Door`;
        }
        return `${verb} Cupboard`;
      }
      const bifoldCup = this.bifoldCupboards.get(id);
      if (bifoldCup) {
        return `${bifoldCup.isOpen ? 'Close' : 'Open'} Pantry Bi-Fold Doors`;
      }
      const drawer = this.slidingDrawers.get(id);
      if (drawer) {
        if (drawer.linkedDoorId) {
          return `${drawer.isOpen ? 'Roll Out Flush' : 'Lift & Roll In'} Golf Simulator Mat`;
        }
        return `${drawer.isOpen ? 'Close' : 'Open'} Drawer`;
      }
      if (this.pulleyMaid && this.pulleyMaid.id === id) {
        return `${this.pulleyMaid.isLowered ? 'Raise' : 'Lower'} Pulley Maid Airer`;
      }
      if (this.toggleCallbacks.has(id)) {
        return 'Extend / Retract Table';
      }
    }
    if (data.isBifoldDoor) {
      return `${isBifoldsOpen ? 'Close' : 'Open'} Bifold Patio Doors`;
    }
    if (data.isCarGate) {
      return `${this.isCarGatesOpen() ? 'Close' : 'Open'} Courtyard Gates`;
    }
    if (data.isKNXSwitch || data.isCourtyardSwitch || data.isUtilitySwitch) {
      return data.switchDirection
        ? `Toggle Light Switch (${data.switchDirection === 'up' ? 'Up' : 'Down'})`
        : 'Toggle KNX Light Switch';
    }
    if (data.isFrameTV) {
      return 'Cycle Frame TV Artwork';
    }
    if (data.isKnxTempSensor) {
      return 'Inspect KNX Temperature Probe';
    }
    if (data.circuitId) {
      return 'Toggle Light Switch / Fixture';
    }
    if (data.ufhZoneId) {
      return 'Toggle Underfloor Heating Zone';
    }
    if (
      data.roomMotionSensorId ||
      data.isKitchenMotionSensor ||
      data.isUtilityMotionSensor
    ) {
      return 'Trigger KNX Motion Sensor';
    }
    if (data.accessEntityId || data.isUniFiAccessReader) {
      return 'Unlock Gate Intercom';
    }
    if (data.cameraEntityId || data.isUniFiCamera) {
      return 'Trigger CCTV Smart Detection';
    }
    return 'Interact';
  }

  /**
   * Rebinds all raycastable interactive meshes and animated door/drawer/pantry/pulley-maid
   * pivot groups after one or more zones have been replaced by live `.usda` prims.
   */
  public rebindAfterUsdZoneLoad(roots: readonly THREE.Object3D[]): void {
    this.interactiveMeshes.length = 0;
    const seenMeshes = new Set<THREE.Object3D>();

    const doorCandidates = new Map<string, THREE.Group>();
    const drawerCandidates = new Map<string, THREE.Group>();
    const bifoldOuterCandidates = new Map<string, THREE.Group>();
    const bifoldInnerCandidates = new Map<string, THREE.Group>();
    let pulleyRackCandidate: THREE.Group | null = null;
    const pulleyVertRopes = new Map<number, THREE.Mesh>();
    const pulleyWheels = new Map<number, THREE.Mesh>();
    let pulleyWallRope: THREE.Mesh | null = null;
    let carGateNorthCandidate: THREE.Group | null = null;
    let carGateSouthCandidate: THREE.Group | null = null;

    for (const root of roots) {
      root.traverse((obj) => {
        const u = (obj.userData ?? {}) as Record<string, unknown>;

        if (obj instanceof THREE.Group) {
          const id = typeof u.interactableId === 'string' ? u.interactableId : undefined;
          if (id) {
            if (id.startsWith('door-')) {
              const existing = doorCandidates.get(id);
              if (!existing || (u.doorRole === 'pivot' && existing.userData?.doorRole !== 'pivot')) {
                doorCandidates.set(id, obj);
              }
            } else if (id.startsWith('drawer-')) {
              const existing = drawerCandidates.get(id);
              if (!existing || (u.drawerRole === 'group' && existing.userData?.drawerRole !== 'group')) {
                drawerCandidates.set(id, obj);
              }
            } else if (id.startsWith('bifold-cupboard-')) {
              if (u.bifoldRole === 'outerPivot' && !bifoldOuterCandidates.has(id)) {
                bifoldOuterCandidates.set(id, obj);
              } else if (u.bifoldRole === 'innerLeaf' && !bifoldInnerCandidates.has(id)) {
                bifoldInnerCandidates.set(id, obj);
              }
            }
          }
          if (u.pulleyMaidRole === 'rackMovingGroup') {
            pulleyRackCandidate = obj;
          }
          if (u.carGateRole === 'northPivot') {
            carGateNorthCandidate = obj;
          } else if (u.carGateRole === 'southPivot') {
            carGateSouthCandidate = obj;
          }
        }

        if (obj instanceof THREE.Mesh && !seenMeshes.has(obj)) {
          if (
            u.interactableId ||
            u.circuitId ||
            u.isBifoldDoor ||
            u.isCarGate ||
            u.isKNXSwitch ||
            u.isUtilitySwitch ||
            u.isCourtyardSwitch ||
            u.isKitchenMotionSensor ||
            u.isUtilityMotionSensor ||
            u.roomMotionSensorId ||
            u.isFrameTV ||
            u.isUniFiCamera ||
            u.isUniFiAccessReader ||
            u.ufhZoneId
          ) {
            seenMeshes.add(obj);
            this.interactiveMeshes.push(obj);
          }

          if (u.pulleyMaidRole === 'vertRope' && typeof u.pulleyMaidIndex === 'number') {
            pulleyVertRopes.set(u.pulleyMaidIndex, obj);
          } else if (
            u.pulleyMaidRole === 'pulleyWheel' &&
            typeof u.pulleyMaidIndex === 'number'
          ) {
            pulleyWheels.set(u.pulleyMaidIndex, obj);
          } else if (u.pulleyMaidRole === 'wallHaulRope') {
            pulleyWallRope = obj;
          }
        }
      });
    }

    for (const door of this.hingedDoors.values()) {
      const newPivot = doorCandidates.get(door.id);
      if (newPivot && newPivot !== door.pivot) {
        const angleDelta = door.openAngle - door.closedAngle;
        door.pivot = newPivot;
        door.closedAngle = newPivot.rotation[door.axis];
        door.openAngle = door.closedAngle + angleDelta;
        door.closedGeometry = undefined;
        if (door.isFoldingFloorMat) {
          door.closedPivotPos = newPivot.position.clone();
          this.applySlidingGolfMatKinematics(door);
        } else {
          if (door.overheadTrackZ !== undefined && door.closedPosZ === undefined) {
            door.closedPosZ = newPivot.position.z;
          }
          const effectiveOpen = this.getEffectiveDoorOpenAngle(door);
          const startAngle = door.fromAngle ?? door.closedAngle;
          const smooth = easeInOutCubic(door.progress);
          const currentAngle = startAngle + (effectiveOpen - startAngle) * smooth;
          door.pivot.rotation[door.axis] = currentAngle;
          if (door.overheadTrackZ !== undefined && door.closedPosZ !== undefined) {
            door.pivot.position.z =
              door.closedPosZ + door.overheadTrackZ * Math.sin(Math.abs(currentAngle));
          }
        }
        door.pivot.updateMatrixWorld(true);
      }
    }

    for (const dr of this.slidingDrawers.values()) {
      const newGroup = drawerCandidates.get(dr.id);
      if (newGroup && newGroup !== dr.group) {
        const slideDelta = dr.openPos.clone().sub(dr.closedPos);
        const quatDelta = newGroup.quaternion
          .clone()
          .multiply(dr.group.quaternion.clone().invert());
        slideDelta.applyQuaternion(quatDelta);
        dr.closedPos.copy(newGroup.position);
        dr.openPos.copy(newGroup.position).add(slideDelta);
        dr.group = newGroup;
        const smooth = easeInOutCubic(dr.progress);
        if (dr.fadeOutWhenOpen) {
          dr.fadeMaterials = prepareFadeMaterialsForGroup(newGroup);
          applyGroupFadeAlpha(dr.group, dr.fadeMaterials, 1 - smooth);
        } else {
          dr.group.position.lerpVectors(dr.closedPos, dr.openPos, smooth);
        }
        dr.group.updateMatrixWorld(true);
      }
    }

    for (const bf of this.bifoldCupboards.values()) {
      const newOuter = bifoldOuterCandidates.get(bf.id);
      const newInner = bifoldInnerCandidates.get(bf.id);
      if (newOuter) bf.outerPivot = newOuter;
      if (newInner) bf.innerLeaf = newInner;
    }

    if (this.pulleyMaid && pulleyRackCandidate && pulleyWallRope) {
      this.pulleyMaid.rackMovingGroup = pulleyRackCandidate;
      this.pulleyMaid.wallHaulRope = pulleyWallRope;
      if (pulleyVertRopes.size === this.pulleyMaid.vertRopes.length) {
        this.pulleyMaid.vertRopes = this.pulleyMaid.vertRopes.map(
          (r, i) => pulleyVertRopes.get(i) ?? r
        );
      }
      if (pulleyWheels.size === this.pulleyMaid.pulleyWheels.length) {
        this.pulleyMaid.pulleyWheels = this.pulleyMaid.pulleyWheels.map(
          (w, i) => pulleyWheels.get(i) ?? w
        );
      }
    }

    if (this.carGatePair) {
      if (carGateNorthCandidate) {
        this.carGatePair.northPivot = carGateNorthCandidate;
      }
      if (carGateSouthCandidate) {
        this.carGatePair.southPivot = carGateSouthCandidate;
      }
    }
  }

  /**
   * Collects all dynamic Object3Ds managed by `SceneInteractionManager` so static matrix
   * freezing leaves their transforms dynamic.
   */
  public collectDynamicObjects(outSet: Set<THREE.Object3D>): void {
    for (const tc of this.toggleCallbacks.values()) {
      for (const r of tc.dynamicRoots) {
        r.traverse((c) => outSet.add(c));
      }
    }
    for (const door of this.hingedDoors.values()) {
      door.pivot.traverse((c) => outSet.add(c));
      if (door.isFoldingFloorMat && door.pivot.parent) {
        door.pivot.parent.traverse((c) => {
          if (
            c.userData?.isGolfOutsideTrackLiftGroup ||
            c.userData?.isGolfTrackCamLink ||
            c.userData?.isGolfTrackLiftLeverPivot ||
            c.name.includes('trackSystem')
          ) {
            c.traverse((sub) => outSet.add(sub));
          }
        });
      }
    }
    for (const bf of this.bifoldCupboards.values()) {
      bf.outerPivot.traverse((c) => outSet.add(c));
      bf.innerLeaf.traverse((c) => outSet.add(c));
    }
    for (const dr of this.slidingDrawers.values()) {
      dr.group.traverse((c) => outSet.add(c));
    }
    if (this.pulleyMaid) {
      this.pulleyMaid.rackMovingGroup.traverse((c) => outSet.add(c));
      for (const rope of this.pulleyMaid.vertRopes) {
        outSet.add(rope);
      }
      for (const wheel of this.pulleyMaid.pulleyWheels) {
        outSet.add(wheel);
      }
      outSet.add(this.pulleyMaid.wallHaulRope);
    }
    if (this.carGatePair) {
      this.carGatePair.northPivot.traverse((c) => outSet.add(c));
      this.carGatePair.southPivot.traverse((c) => outSet.add(c));
    }
  }

  /**
   * Steps all active animations. Returns true if any animation moved this frame.
   */
  public update(dtSeconds: number): boolean {
    let anyChanged = false;

    if (this.carGatePair) {
      const cg = this.carGatePair;
      const target = cg.isOpen ? 1 : 0;
      if (cg.progress !== target) {
        const step = dtSeconds * cg.speed;
        cg.progress =
          cg.progress < target
            ? Math.min(1, cg.progress + step)
            : Math.max(0, cg.progress - step);
        const smooth = easeInOutCubic(cg.progress);
        cg.northPivot.rotation.y = cg.northOpenAngle * smooth;
        cg.southPivot.rotation.y = cg.southOpenAngle * smooth;
        cg.northPivot.updateMatrixWorld(true);
        cg.southPivot.updateMatrixWorld(true);
        anyChanged = true;
      }
    }

    for (const door of this.hingedDoors.values()) {
      const target = door.isOpen ? 1 : 0;
      if (door.progress !== target) {
        const step = dtSeconds * door.speed;
        door.progress =
          door.progress < target
            ? Math.min(1, door.progress + step)
            : Math.max(0, door.progress - step);
        if (door.isFoldingFloorMat) {
          this.applySlidingGolfMatKinematics(door);
        } else {
          const smooth = easeInOutCubic(door.progress);
          const effectiveOpen = this.getEffectiveDoorOpenAngle(door);
          const startAngle = door.fromAngle ?? door.closedAngle;
          const currentAngle = startAngle + (effectiveOpen - startAngle) * smooth;
          door.pivot.rotation[door.axis] = currentAngle;
          if (door.overheadTrackZ !== undefined && door.closedPosZ !== undefined) {
            door.pivot.position.z =
              door.closedPosZ + door.overheadTrackZ * Math.sin(Math.abs(currentAngle));
          }
        }
        if (door.progress === 0) {
          door.bargeSwingSign = undefined;
          door.fromAngle = undefined;
        } else if (door.progress === 1) {
          door.fromAngle = undefined;
        }
        door.pivot.updateMatrixWorld(true);
        anyChanged = true;
      }
    }

    for (const bf of this.bifoldCupboards.values()) {
      const target = bf.isOpen ? 1 : 0;
      if (bf.progress !== target) {
        const step = dtSeconds * bf.speed;
        bf.progress =
          bf.progress < target
            ? Math.min(1, bf.progress + step)
            : Math.max(0, bf.progress - step);
        const smooth = easeInOutCubic(bf.progress);
        const maxAngle = 1.38; // ~79 degrees concertina fold
        const theta = smooth * maxAngle;

        // Outer leaf pivots outward around its outer hinge
        bf.outerPivot.rotation.y = bf.sideSign * theta;
        bf.outerPivot.updateMatrixWorld(true);

        // Inner leaf travels with the knuckle joint and counter-rotates
        const outerHingeX = bf.closedOuterX + bf.sideSign * (bf.leafWidth * 0.5);
        const knuckleX = outerHingeX - bf.sideSign * bf.leafWidth * Math.cos(theta);
        const knuckleZ = bf.faceZ + bf.leafWidth * Math.sin(theta);

        bf.innerLeaf.position.x = knuckleX - bf.sideSign * (bf.leafWidth * 0.5) * Math.cos(theta);
        bf.innerLeaf.position.z = knuckleZ - (bf.leafWidth * 0.5) * Math.sin(theta);
        bf.innerLeaf.rotation.y = -bf.sideSign * theta;
        bf.innerLeaf.updateMatrixWorld(true);
        anyChanged = true;
      }
    }

    for (const dr of this.slidingDrawers.values()) {
      const target = dr.isOpen ? 1 : 0;
      if (dr.progress !== target) {
        const step = dtSeconds * dr.speed;
        dr.progress =
          dr.progress < target
            ? Math.min(1, dr.progress + step)
            : Math.max(0, dr.progress - step);
        const smooth = easeInOutCubic(dr.progress);
        if (dr.fadeOutWhenOpen) {
          applyGroupFadeAlpha(dr.group, dr.fadeMaterials, 1 - smooth);
        } else {
          dr.group.position.lerpVectors(dr.closedPos, dr.openPos, smooth);
        }
        dr.group.updateMatrixWorld(true);
        anyChanged = true;
      }
    }

    if (this.pulleyMaid) {
      const pm = this.pulleyMaid;
      const target = pm.isLowered ? 1 : 0;
      if (pm.progress !== target) {
        const step = dtSeconds * pm.speed;
        pm.progress =
          pm.progress < target
            ? Math.min(1, pm.progress + step)
            : Math.max(0, pm.progress - step);
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

        anyChanged = true;
      }
    }

    return anyChanged;
  }
}
