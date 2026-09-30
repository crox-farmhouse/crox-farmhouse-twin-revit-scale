import * as THREE from 'three';
import type { CircuitId } from '../../types/knx.ts';
import type { InteractiveUserData } from '../../types/scene.ts';

interface HingedDoorState {
  readonly id: string;
  pivot: THREE.Group;
  readonly axis: 'x' | 'y' | 'z';
  closedAngle: number;
  openAngle: number;
  isOpen: boolean;
  progress: number;
  readonly speed: number;
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
      door.isOpen = !door.isOpen;
      return true;
    }

    const bifoldCup = this.bifoldCupboards.get(interactableId);
    if (bifoldCup) {
      bifoldCup.isOpen = !bifoldCup.isOpen;
      return true;
    }

    const drawer = this.slidingDrawers.get(interactableId);
    if (drawer) {
      drawer.isOpen = !drawer.isOpen;
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
    door.isOpen = isOpen;
    return true;
  }

  /**
   * Computes the effective open angle for a hinged door, providing a ~86° swing fallback
   * for room/courtyard doors whose initial registration specified `openAngle = 0`.
   */
  private getEffectiveDoorOpenAngle(door: HingedDoorState): number {
    if (Math.abs(door.openAngle - door.closedAngle) < 0.05) {
      const swingSign = door.pivot.position.z > 1.5 ? 1 : -1;
      return door.closedAngle + swingSign * Math.PI * 0.48;
    }
    return door.openAngle;
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
        if (
          chainNames.includes('fridge') ||
          chainNames.includes('freezer') ||
          (chainNames.includes('wine') && !chainNames.includes('cellar')) ||
          chainNames.includes('dishwasher') ||
          chainNames.includes('miele')
        ) {
          return `${verb} Appliance Door`;
        }
        tmpDoorBounds.setFromObject(door.pivot);
        const pivotHeight = tmpDoorBounds.max.y - tmpDoorBounds.min.y;
        const hasCupboardName =
          chainNames.includes('cupboard') ||
          chainNames.includes('cabinet') ||
          chainNames.includes('larder') ||
          chainNames.includes('island') ||
          chainNames.includes('vanity') ||
          chainNames.includes('wardrobe');
        if (pivotHeight < 0.92 || (hasCupboardName && pivotHeight < 1.85)) {
          return `${verb} Cupboard`;
        }
        return `${verb} Door`;
      }
      const bifoldCup = this.bifoldCupboards.get(id);
      if (bifoldCup) {
        return `${bifoldCup.isOpen ? 'Close' : 'Open'} Pantry Bi-Fold Doors`;
      }
      const drawer = this.slidingDrawers.get(id);
      if (drawer) {
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
            if (id.startsWith('door-') && !doorCandidates.has(id)) {
              doorCandidates.set(id, obj);
            } else if (id.startsWith('drawer-') && !drawerCandidates.has(id)) {
              drawerCandidates.set(id, obj);
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
        const effectiveOpen = this.getEffectiveDoorOpenAngle(door);
        const smooth = easeInOutCubic(door.progress);
        door.pivot.rotation[door.axis] =
          door.closedAngle + (effectiveOpen - door.closedAngle) * smooth;
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
        dr.group.position.lerpVectors(dr.closedPos, dr.openPos, smooth);
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
        const smooth = easeInOutCubic(door.progress);
        const effectiveOpen = this.getEffectiveDoorOpenAngle(door);
        door.pivot.rotation[door.axis] =
          door.closedAngle + (effectiveOpen - door.closedAngle) * smooth;
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
        dr.group.position.lerpVectors(dr.closedPos, dr.openPos, smooth);
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
