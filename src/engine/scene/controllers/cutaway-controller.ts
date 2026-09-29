import * as THREE from 'three';
import type { RoomLodController } from '../../lod/lod-manager.ts';
import type { CutawayWallDescriptor, FloorViewMode } from '../../../types/scene.ts';
import type { PropertySceneLayers } from '../scene-content.ts';
import type { SceneZoneRegistry } from '../scene-zone-registry.ts';

export interface CutawayViewInput {
  readonly cameraPosition: THREE.Vector3;
  readonly target: THREE.Vector3;
  readonly isOrthographic: boolean;
  readonly orthoZoom: number;
  readonly isWalkthrough?: boolean;
}

export interface CutawayUpdateResult {
  readonly needsRender: boolean;
  readonly shadowsDirty: boolean;
}

/**
 * Owns the floor-view / ceiling-cutaway state and decides, every time the camera
 * moves, which floors, ceilings, roof and walls are hidden so the camera can
 * see into the focused rooms. Also drives room LOD evaluation.
 */
export class CutawayController {
  private readonly layers: PropertySceneLayers;
  private readonly zoneRegistry: SceneZoneRegistry;
  private readonly lodController: RoomLodController;
  private readonly dynamicCutawayWallItems: Array<{
    readonly obj: THREE.Object3D;
    readonly descriptor: CutawayWallDescriptor;
    readonly offsetX: number;
    readonly offsetZ: number;
    readonly rotationY: number;
  }> = [];

  private floorViewMode: FloorViewMode = 'ground';
  private ceilingCutaway = true;

  public constructor(
    layers: PropertySceneLayers,
    zoneRegistry: SceneZoneRegistry,
    lodController: RoomLodController
  ) {
    this.layers = layers;
    this.zoneRegistry = zoneRegistry;
    this.lodController = lodController;
  }

  public getFloorViewMode(): FloorViewMode {
    return this.floorViewMode;
  }

  public isCeilingCutaway(): boolean {
    return this.ceilingCutaway;
  }

  /** Sets the floor focus; the ceiling cutaway follows (on unless viewing all floors). */
  public setFloorViewMode(mode: FloorViewMode): void {
    this.floorViewMode = mode;
    this.ceilingCutaway = mode !== 'all';
  }

  public setViewState(floorViewMode: FloorViewMode, ceilingCutaway: boolean): void {
    this.floorViewMode = floorViewMode;
    this.ceilingCutaway = ceilingCutaway;
  }

  public toggleCeilingCutaway(): boolean {
    this.ceilingCutaway = !this.ceilingCutaway;
    return this.ceilingCutaway;
  }

  /** Indexes every object tagged with `userData.cutawayWall` under the scene, recording any parent wing/room container transform. */
  public collectDynamicCutawayWalls(): void {
    this.dynamicCutawayWallItems.length = 0;
    this.layers.scene.traverse((obj) => {
      const rawDescriptor = obj.userData?.cutawayWall as CutawayWallDescriptor | undefined;
      if (!rawDescriptor) return;

      let offsetX = 0;
      let offsetZ = 0;
      let rotationY = 0;
      let cur: THREE.Object3D | null = obj;
      while (cur) {
        const containerOffset = cur.userData?.containerOffset as
          | readonly [number, number, number]
          | undefined;
        if (containerOffset) {
          offsetX += containerOffset[0];
          offsetZ += containerOffset[2];
        }
        const containerRotY = cur.userData?.containerRotationY as number | undefined;
        if (typeof containerRotY === 'number') {
          rotationY += containerRotY;
        }
        cur = cur.parent;
      }

      this.dynamicCutawayWallItems.push({
        obj,
        descriptor: rawDescriptor,
        offsetX,
        offsetZ,
        rotationY,
      });
    });
  }

  private toContainerLocalXZ(
    wx: number,
    wz: number,
    offsetX: number,
    offsetZ: number,
    rotationY: number
  ): { readonly x: number; readonly z: number } {
    const dx = wx - offsetX;
    const dz = wz - offsetZ;
    if (rotationY === 0) {
      return { x: dx, z: dz };
    }
    const cosR = Math.cos(rotationY);
    const sinR = Math.sin(rotationY);
    return {
      x: dx * cosR - dz * sinR,
      z: dx * sinR + dz * cosR,
    };
  }

  public update(view: CutawayViewInput): CutawayUpdateResult {
    const { firstFloorMeshGroup, groundFloorCeilingGroup, ceilingMeshGroup, cutawayWallGroups } =
      this.layers;
    let needsRender = false;

    const cam = view.cameraPosition;
    const target = view.target;
    const dx = target.x - cam.x;
    const dz = target.z - cam.z;
    const horizLen = Math.hypot(dx, dz);
    const isTopDownPlan = horizLen < 0.45;

    const perspDist = cam.distanceTo(target);
    const zoomedOut =
      this.lodController.getPolicyMode() === 'lod0' ||
      (view.isOrthographic
        ? view.orthoZoom <= 0.62
        : perspDist >= (isTopDownPlan ? 32.0 : 15.5));

    if (this.lodController.evaluateLod(cam, target, this.floorViewMode)) {
      needsRender = true;
    }

    const maxEyeY = this.floorViewMode === 'first' ? 4.05 : 1.85;
    const cameraInsideHouse =
      Boolean(view.isWalkthrough) ||
      (!view.isOrthographic &&
        perspDist <= 4.35 &&
        cam.y <= maxEyeY &&
        this.zoneRegistry.arePointsInSameInteriorRoom(
          cam.x,
          cam.y,
          cam.z,
          target.x,
          target.y,
          target.z
        ));

    // Determine desired visibility for First Floor rooms, Ground Floor ceilings/joists, and Pitched Roofs
    let desiredFirstFloorVis = true;
    let desiredGroundCeilingVis = true;
    let desiredRoofVis = true;

    if (cameraInsideHouse) {
      // Inside a single room at eye level or in 1st-person walkthrough: show overhead ceiling joists/beams & upstairs
      desiredGroundCeilingVis = true;
      desiredRoofVis = true;
      desiredFirstFloorVis = Boolean(view.isWalkthrough) || cam.y >= 2.2 || this.floorViewMode !== 'ground';
    } else if (this.floorViewMode === 'all') {
      desiredFirstFloorVis = true;
      desiredGroundCeilingVis = true;
      desiredRoofVis = !this.ceilingCutaway || zoomedOut;
    } else if (this.floorViewMode === 'first') {
      // 1st Floor Focus: show First Floor bedrooms/bathrooms, cut away the pitched slate roof above
      desiredFirstFloorVis = true;
      desiredGroundCeilingVis = true;
      desiredRoofVis = !this.ceilingCutaway;
    } else {
      // 'ground' Floor Focus: hide the First Floor slab & rooms so you can see straight into all Ground Floor rooms!
      desiredFirstFloorVis = false;
      desiredGroundCeilingVis = !this.ceilingCutaway;
      desiredRoofVis = !this.ceilingCutaway;
    }

    if (zoomedOut || cameraInsideHouse) {
      let changed = false;
      let majorShellChanged = false;
      if (
        firstFloorMeshGroup.visible !== desiredFirstFloorVis ||
        groundFloorCeilingGroup.visible !== desiredGroundCeilingVis ||
        ceilingMeshGroup.visible !== desiredRoofVis
      ) {
        firstFloorMeshGroup.visible = desiredFirstFloorVis;
        groundFloorCeilingGroup.visible = desiredGroundCeilingVis;
        ceilingMeshGroup.visible = desiredRoofVis;
        changed = true;
        majorShellChanged = true;
      }
      if (
        !cutawayWallGroups.southWest.visible ||
        !cutawayWallGroups.west.visible ||
        !cutawayWallGroups.north.visible ||
        !cutawayWallGroups.east.visible
      ) {
        cutawayWallGroups.southWest.visible = true;
        cutawayWallGroups.west.visible = true;
        cutawayWallGroups.north.visible = true;
        cutawayWallGroups.east.visible = true;
        changed = true;
      }
      for (const item of this.dynamicCutawayWallItems) {
        if (!item.obj.visible) {
          item.obj.visible = true;
          changed = true;
        }
      }
      return { needsRender: needsRender || changed, shadowsDirty: majorShellChanged };
    }

    // Transform camera & target into the Kitchen / East-West Wing container's local frame
    const kitchenChild = cutawayWallGroups.southWest.children[0];
    const kitchenOffset = (kitchenChild?.userData?.containerOffset as
      | readonly [number, number, number]
      | undefined) ?? [0, 0, 0];
    const kitchenRotY = (kitchenChild?.userData?.containerRotationY as number | undefined) ?? 0;
    const kCam = this.toContainerLocalXZ(cam.x, cam.z, kitchenOffset[0], kitchenOffset[2], kitchenRotY);
    const kTarget = this.toContainerLocalXZ(
      target.x,
      target.z,
      kitchenOffset[0],
      kitchenOffset[2],
      kitchenRotY
    );
    const kDx = kTarget.x - kCam.x;
    const kDz = kTarget.z - kCam.z;
    const kVx = horizLen > 0.001 ? kDx / horizLen : 0;
    const kVz = horizLen > 0.001 ? kDz / horizLen : 0;

    // Camera-facing cutaway rules when orbiting/panning around the Kitchen (in East-West Wing local frame):
    // 1. South Wall (Kitchen at local Z = +2.22m..+2.50m):
    //    Cuts away when camera is on the South (+Z) side looking North into the Kitchen
    const cutSouthWest =
      this.floorViewMode === 'ground' && !isTopDownPlan && kCam.z > 2.22 && kVz < -0.26;
    // 2. West Wall of Kitchen + Appliance Towers (at local X = -4.40m):
    //    Cuts away when camera is on the West (-X) side looking East into the Kitchen
    const cutWest =
      this.floorViewMode === 'ground' &&
      !isTopDownPlan &&
      kTarget.x > -4.2 &&
      kCam.x < -3.2 &&
      kVx > 0.26;
    // 3. North Back Wall + North Kitchen/Utility Cabinets (at local Z = -2.50m):
    //    Cuts away when camera is on the North (-Z) side looking South into the room
    const cutNorth =
      this.floorViewMode === 'ground' && !isTopDownPlan && kCam.z < -1.08 && kVz > 0.26;
    // 4. East Wall + East Full-Height Window & Split Stable Door (at local X = +5.00m):
    //    Cuts away when camera is on the East (+X) side looking West into the room
    const cutEast =
      this.floorViewMode === 'ground' && !isTopDownPlan && kCam.x > 3.8 && kVx < -0.26;

    const swVis = !cutSouthWest;
    const wVis = !cutWest;
    const nVis = !cutNorth;
    const eVis = !cutEast;

    let changed = false;
    const majorShellChanged =
      firstFloorMeshGroup.visible !== desiredFirstFloorVis ||
      groundFloorCeilingGroup.visible !== desiredGroundCeilingVis ||
      ceilingMeshGroup.visible !== desiredRoofVis;
    if (
      majorShellChanged ||
      cutawayWallGroups.southWest.visible !== swVis ||
      cutawayWallGroups.west.visible !== wVis ||
      cutawayWallGroups.north.visible !== nVis ||
      cutawayWallGroups.east.visible !== eVis
    ) {
      firstFloorMeshGroup.visible = desiredFirstFloorVis;
      groundFloorCeilingGroup.visible = desiredGroundCeilingVis;
      ceilingMeshGroup.visible = desiredRoofVis;
      cutawayWallGroups.southWest.visible = swVis;
      cutawayWallGroups.west.visible = wVis;
      cutawayWallGroups.north.visible = nVis;
      cutawayWallGroups.east.visible = eVis;
      changed = true;
    }

    // Dynamic camera-facing cutaway across all Ground Floor & First Floor rooms:
    for (const { obj, descriptor, offsetX, offsetZ, rotationY } of this.dynamicCutawayWallItems) {
      const lCam = this.toContainerLocalXZ(cam.x, cam.z, offsetX, offsetZ, rotationY);
      const lTarget = this.toContainerLocalXZ(target.x, target.z, offsetX, offsetZ, rotationY);
      const lVx = horizLen > 0.001 ? (lTarget.x - lCam.x) / horizLen : 0;
      const lVz = horizLen > 0.001 ? (lTarget.z - lCam.z) / horizLen : 0;
      const desiredVis = !this.shouldCutDynamicWall(
        descriptor,
        lCam.x,
        lCam.z,
        lTarget.x,
        lTarget.z,
        lVx,
        lVz,
        isTopDownPlan
      );
      if (obj.visible !== desiredVis) {
        obj.visible = desiredVis;
        changed = true;
      }
    }

    return { needsRender: needsRender || changed, shadowsDirty: majorShellChanged };
  }

  private shouldCutDynamicWall(
    descriptor: CutawayWallDescriptor,
    camX: number,
    camZ: number,
    targetX: number,
    targetZ: number,
    vx: number,
    vz: number,
    isTopDownPlan: boolean
  ): boolean {
    const activeFloorMatch =
      (descriptor.floor === 'ground' && this.floorViewMode === 'ground') ||
      (descriptor.floor === 'first' && this.floorViewMode === 'first');
    if (!activeFloorMatch || isTopDownPlan) {
      return false;
    }

    if (descriptor.axis === 'z') {
      const distZ = Math.abs(descriptor.coord - targetZ);
      const onSouthCamSide =
        vz < -0.22 && descriptor.coord > targetZ - 0.35 && descriptor.coord <= camZ + 0.55;
      const onNorthCamSide =
        vz > 0.22 && descriptor.coord < targetZ + 0.35 && descriptor.coord >= camZ - 0.55;

      if ((onSouthCamSide || onNorthCamSide) && distZ <= 5.4) {
        const tRay =
          Math.abs(targetZ - camZ) > 0.01
            ? THREE.MathUtils.clamp((descriptor.coord - camZ) / (targetZ - camZ), 0, 1.2)
            : 1;
        const rayX = camX + (targetX - camX) * tRay;
        return (
          (targetX >= descriptor.minSpan - 1.4 && targetX <= descriptor.maxSpan + 1.4) ||
          (rayX >= descriptor.minSpan - 1.15 && rayX <= descriptor.maxSpan + 1.15)
        );
      }
      return false;
    }

    const distX = Math.abs(descriptor.coord - targetX);
    const onEastCamSide =
      vx < -0.22 && descriptor.coord > targetX - 0.35 && descriptor.coord <= camX + 0.55;
    const onWestCamSide =
      vx > 0.22 && descriptor.coord < targetX + 0.35 && descriptor.coord >= camX - 0.55;

    if ((onEastCamSide || onWestCamSide) && distX <= 5.6) {
      const tRay =
        Math.abs(targetX - camX) > 0.01
          ? THREE.MathUtils.clamp((descriptor.coord - camX) / (targetX - camX), 0, 1.2)
          : 1;
      const rayZ = camZ + (targetZ - camZ) * tRay;
      return (
        (targetZ >= descriptor.minSpan - 1.4 && targetZ <= descriptor.maxSpan + 1.4) ||
        (rayZ >= descriptor.minSpan - 1.15 && rayZ <= descriptor.maxSpan + 1.15)
      );
    }
    return false;
  }
}
