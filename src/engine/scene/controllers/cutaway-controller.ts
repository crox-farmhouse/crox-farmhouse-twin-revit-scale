import * as THREE from 'three';
import type { RoomLodController } from '../../lod/lod-manager.ts';
import type { CutawayWallDescriptor, FloorViewMode } from '../../../types/scene.ts';
import type { PropertySceneLayers } from '../scene-content.ts';
import type { SceneZoneRegistry } from '../scene-zone-registry.ts';
import { SHADOW_PASS_HOOK_FLAG } from '../scene-batch-optimizer.ts';

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
 * Creates a zero-area, always-drawn shadow-casting mesh whose `onBeforeShadow` / `onAfterShadow`
 * callbacks bracket every shadow-map pass (Three.js renders shadow casters in scene-graph order).
 */
function createShadowPassHook(name: string): THREE.Mesh {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(9), 3));
  // Non-zero bounding sphere so generic "tiny mesh => castShadow=false" filters leave it alone.
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1);
  geo.boundingBox = new THREE.Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1));
  const mat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, depthTest: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  mesh.frustumCulled = false;
  mesh.matrixAutoUpdate = false;
  mesh.raycast = (): void => {};
  mesh.userData = {
    [SHADOW_PASS_HOOK_FLAG]: true,
    // Excluded from annotation picking, USD stage traversal, bevel and walkthrough obstacles.
    isAnnotationGroup: true,
    lodIgnore: true,
  };
  return mesh;
}

/**
 * Owns the floor-view / ceiling-cutaway state and decides, every time the camera
 * moves, which floors, ceilings, roof and walls are hidden so the camera can
 * see into the focused rooms. Also drives room LOD evaluation.
 *
 * Lighting invariant: cutaways only change what the *camera* sees. Geometry hidden by a
 * cutaway (first floor, ceilings, roof, camera-facing walls) keeps casting shadows: two
 * shadow-pass hook meshes (first and last child of the scene) temporarily re-show it during
 * every shadow-map render. Floor mode, zoom and camera position therefore never change sun
 * shadows, light intensities or which lights are active. Only the overhead fixture shade
 * opacity (a see-through aid) changes.
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
  private readonly overheadLightMaterials: Array<{
    readonly mat: THREE.MeshStandardMaterial;
    readonly cutawayOpacity: number;
  }> = [];

  private shadowCastersIgnoreCutaway = true;
  private readonly shadowPassStartHook: THREE.Mesh = createShadowPassHook('__cutawayShadowPassStart');
  private readonly shadowPassEndHook: THREE.Mesh = createShadowPassHook('__cutawayShadowPassEnd');
  /** Objects temporarily re-shown by the start hook; restored by the end hook. */
  private readonly shadowPassRevealed: THREE.Object3D[] = [];

  private floorViewMode: FloorViewMode = 'ground';
  private ceilingCutaway = true;
  private wasWalkthrough = false;
  private allDynamicWallsShown = false;
  private overheadLightsLowOpacity = true;
  private readonly lastWalkthroughLodPos = new THREE.Vector3(
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY
  );
  private readonly lastOrbitLodCamPos = new THREE.Vector3(
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY
  );
  private readonly lastOrbitLodTargetPos = new THREE.Vector3(
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY,
    Number.POSITIVE_INFINITY
  );

  public constructor(
    layers: PropertySceneLayers,
    zoneRegistry: SceneZoneRegistry,
    lodController: RoomLodController
  ) {
    this.layers = layers;
    this.zoneRegistry = zoneRegistry;
    this.lodController = lodController;
    this.shadowPassStartHook.onBeforeShadow = (): void => {
      this.revealCutawayGeometryForShadowPass();
    };
    this.shadowPassEndHook.onAfterShadow = (): void => {
      this.restoreCutawayGeometryAfterShadowPass();
    };
  }

  /**
   * When true (default), geometry hidden by cutaways still casts shadows, so sun/point shadows
   * are identical in every floor mode, zoom level and camera position. Returns true if changed
   * (caller should redraw the shadow map once).
   */
  public setShadowCastersIgnoreCutaway(enabled: boolean): boolean {
    if (this.shadowCastersIgnoreCutaway === enabled) return false;
    this.shadowCastersIgnoreCutaway = enabled;
    this.ensureShadowPassHooks();
    return true;
  }

  public getShadowCastersIgnoreCutaway(): boolean {
    return this.shadowCastersIgnoreCutaway;
  }

  /** Every object whose `.visible` this controller toggles for cutaway purposes. */
  private forEachCutawayManagedObject(fn: (obj: THREE.Object3D) => void): void {
    const { firstFloorMeshGroup, groundFloorCeilingGroup, ceilingMeshGroup, cutawayWallGroups } =
      this.layers;
    fn(firstFloorMeshGroup);
    fn(groundFloorCeilingGroup);
    fn(ceilingMeshGroup);
    fn(cutawayWallGroups.southWest);
    fn(cutawayWallGroups.west);
    fn(cutawayWallGroups.north);
    fn(cutawayWallGroups.east);
    for (const item of this.dynamicCutawayWallItems) {
      fn(item.obj);
    }
  }

  private revealCutawayGeometryForShadowPass(): void {
    if (!this.shadowCastersIgnoreCutaway || this.shadowPassRevealed.length > 0) return;
    this.forEachCutawayManagedObject((obj) => {
      if (!obj.visible) {
        obj.visible = true;
        this.shadowPassRevealed.push(obj);
      }
    });
  }

  private restoreCutawayGeometryAfterShadowPass(): void {
    for (let i = 0; i < this.shadowPassRevealed.length; i++) {
      this.shadowPassRevealed[i]!.visible = false;
    }
    this.shadowPassRevealed.length = 0;
  }

  /** Keeps the start hook as the scene's first child and the end hook as its last child. */
  private ensureShadowPassHooks(): void {
    const scene = this.layers.scene;
    const start = this.shadowPassStartHook;
    const end = this.shadowPassEndHook;
    if (!this.shadowCastersIgnoreCutaway) {
      if (start.parent) start.parent.remove(start);
      if (end.parent) end.parent.remove(end);
      return;
    }
    const children = scene.children;
    if (children[0] !== start) {
      if (start.parent !== scene) scene.add(start);
      const idx = children.indexOf(start);
      if (idx > 0) {
        children.splice(idx, 1);
        children.unshift(start);
      }
    }
    if (children[children.length - 1] !== end) {
      if (end.parent === scene) {
        children.splice(children.indexOf(end), 1);
        children.push(end);
      } else {
        scene.add(end);
      }
    }
    start.castShadow = true;
    end.castShadow = true;
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
    this.lastOrbitLodCamPos.set(
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY
    );
  }

  public setViewState(floorViewMode: FloorViewMode, ceilingCutaway: boolean): void {
    this.floorViewMode = floorViewMode;
    this.ceilingCutaway = ceilingCutaway;
    this.lastOrbitLodCamPos.set(
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY
    );
  }

  public toggleCeilingCutaway(): boolean {
    this.ceilingCutaway = !this.ceilingCutaway;
    return this.ceilingCutaway;
  }

  /** Indexes every object tagged with `userData.cutawayWall` under the scene, recording any parent wing/room container transform. */
  public collectDynamicCutawayWalls(): void {
    this.restoreCutawayGeometryAfterShadowPass();
    this.ensureShadowPassHooks();
    this.dynamicCutawayWallItems.length = 0;
    this.overheadLightMaterials.length = 0;
    this.allDynamicWallsShown = false;
    const seenLightMats = new Set<THREE.MeshStandardMaterial>();

    this.layers.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
          if (m instanceof THREE.MeshStandardMaterial && !seenLightMats.has(m)) {
            const savedCutawayOpacity = m.userData?.cutawayLightOpacity as number | undefined;
            if (
              typeof savedCutawayOpacity === 'number' ||
              (m.transparent && m.opacity >= 0.30 && m.opacity <= 0.44 && m.depthWrite === false)
            ) {
              const cutawayOpacity = savedCutawayOpacity ?? m.opacity;
              m.userData = { ...m.userData, cutawayLightOpacity: cutawayOpacity };
              seenLightMats.add(m);
              this.overheadLightMaterials.push({ mat: m, cutawayOpacity });
            }
          }
        }
      }

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
    let lodShadowsDirty = false;
    // Safety net: never leave cutaway geometry revealed if a shadow pass was interrupted.
    this.restoreCutawayGeometryAfterShadowPass();
    this.ensureShadowPassHooks();
    // Cutaway visibility changes alter the shadow-caster set only when hidden geometry is
    // excluded from shadow passes (legacy mode).
    const cutawayAffectsShadows = !this.shadowCastersIgnoreCutaway;

    const cam = view.cameraPosition;
    const target = view.target;
    const isWalkthrough = Boolean(view.isWalkthrough);

    if (isWalkthrough) {
      const enteredWalkthrough = !this.wasWalkthrough;
      this.wasWalkthrough = true;
      if (
        enteredWalkthrough ||
        this.lastWalkthroughLodPos.distanceToSquared(cam) >= 0.14
      ) {
        this.lastWalkthroughLodPos.copy(cam);
        const walkthroughFloor: FloorViewMode = cam.y >= 2.15 ? 'first' : 'ground';
        if (this.lodController.evaluateLod(cam, cam, walkthroughFloor)) {
          needsRender = true;
          if (this.lodController.didLastEvalChangeShadows()) {
            lodShadowsDirty = true;
          }
        }
      }
    } else {
      if (this.wasWalkthrough) {
        this.wasWalkthrough = false;
        this.lastWalkthroughLodPos.set(
          Number.POSITIVE_INFINITY,
          Number.POSITIVE_INFINITY,
          Number.POSITIVE_INFINITY
        );
        this.lastOrbitLodCamPos.set(
          Number.POSITIVE_INFINITY,
          Number.POSITIVE_INFINITY,
          Number.POSITIVE_INFINITY
        );
      }
      if (
        this.lastOrbitLodCamPos.distanceToSquared(cam) >= 0.08 ||
        this.lastOrbitLodTargetPos.distanceToSquared(target) >= 0.04
      ) {
        this.lastOrbitLodCamPos.copy(cam);
        this.lastOrbitLodTargetPos.copy(target);
        if (this.lodController.evaluateLod(cam, target, this.floorViewMode)) {
          needsRender = true;
          if (this.lodController.didLastEvalChangeShadows()) {
            lodShadowsDirty = true;
          }
        }
      }
    }

    const dx = target.x - cam.x;
    const dz = target.z - cam.z;
    const horizLen = Math.hypot(dx, dz);
    const isTopDownPlan = horizLen < 0.45;

    const perspDist = cam.distanceTo(target);
    const zoomedOut =
      this.lodController.getPolicyMode() === 'lod0' ||
      (view.isOrthographic
        ? view.orthoZoom <= 0.62
        : perspDist >= (isTopDownPlan ? 32.0 : 28.5));

    const maxEyeY = this.floorViewMode === 'first' ? 4.05 : 1.85;
    const cameraInsideHouse =
      isWalkthrough ||
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

    // Only fixture *shade* transparency changes here (a see-through aid for cutaway views). Emissive
    // intensity, light intensity and which lights are active are never touched by cutaways.
    // Issue #3 ("in 1pv lights should not be see through" at `[-2.579, 0.933, 16.359]`, `outbuildings.barn.poolTableLight.shade`):
    // Overhead light fixtures use low opacity (`0.32..0.42`) when viewing from outside in cutaway mode,
    // and become 100% opaque (`opacity = 1.0`, not see-through) in 1PV / interior view or when cutaway is off!
    const wantLowOpacityLights = this.ceilingCutaway && !cameraInsideHouse;
    if (wantLowOpacityLights !== this.overheadLightsLowOpacity) {
      this.overheadLightsLowOpacity = wantLowOpacityLights;
      for (const { mat, cutawayOpacity } of this.overheadLightMaterials) {
        mat.transparent = wantLowOpacityLights;
        mat.opacity = wantLowOpacityLights ? cutawayOpacity : 1.0;
        mat.depthWrite = !wantLowOpacityLights;
        mat.needsUpdate = true;
      }
      needsRender = true;
    }

    // Determine desired visibility for First Floor rooms, Ground Floor ceilings/joists, and Pitched Roofs
    let desiredFirstFloorVis = true;
    let desiredGroundCeilingVis = true;
    let desiredRoofVis = true;

    if (cameraInsideHouse) {
      // Inside a single room at eye level or in 1st-person walkthrough: show overhead ceiling joists/beams & upstairs
      desiredGroundCeilingVis = true;
      desiredRoofVis = true;
      desiredFirstFloorVis = isWalkthrough || cam.y >= 2.2 || this.floorViewMode !== 'ground';
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

    if (zoomedOut || cameraInsideHouse || !this.ceilingCutaway) {
      let changed = false;
      this.ensureCeilingSubgroupsVisible();
      if (
        firstFloorMeshGroup.visible !== desiredFirstFloorVis ||
        groundFloorCeilingGroup.visible !== desiredGroundCeilingVis ||
        ceilingMeshGroup.visible !== desiredRoofVis
      ) {
        firstFloorMeshGroup.visible = desiredFirstFloorVis;
        groundFloorCeilingGroup.visible = desiredGroundCeilingVis;
        ceilingMeshGroup.visible = desiredRoofVis;
        changed = true;
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
      if (!this.allDynamicWallsShown) {
        for (const item of this.dynamicCutawayWallItems) {
          if (!item.obj.visible) {
            item.obj.visible = true;
            changed = true;
          }
        }
        this.allDynamicWallsShown = true;
      }
      return {
        needsRender: needsRender || changed,
        shadowsDirty: (cutawayAffectsShadows && changed) || lodShadowsDirty,
      };
    }

    this.allDynamicWallsShown = false;

    // When the orbit target has been panned below the floor plane (`target.y < -0.5m`), project the focus point
    // onto the active floor elevation (`focusPlaneY`) along the camera-to-target ray so camera-facing walls
    // directly in the line of sight still cut away cleanly (Issue #3!).
    const focusPlaneY = this.floorViewMode === 'first' ? 1.8 : 0.4;
    const tFocus =
      cam.y > focusPlaneY + 0.5 && target.y < focusPlaneY - 0.5
        ? THREE.MathUtils.clamp((cam.y - focusPlaneY) / (cam.y - target.y), 0.2, 1.0)
        : 1.0;
    const focusWorldX = cam.x + (target.x - cam.x) * tFocus;
    const focusWorldZ = cam.z + (target.z - cam.z) * tFocus;

    // Transform camera & target into the Kitchen / East-West Wing container's local frame
    const kitchenChild = cutawayWallGroups.southWest.children[0];
    const kitchenOffset = (kitchenChild?.userData?.containerOffset as
      | readonly [number, number, number]
      | undefined) ?? [0, 0, 0];
    const kitchenRotY = (kitchenChild?.userData?.containerRotationY as number | undefined) ?? 0;
    const kCam = this.toContainerLocalXZ(cam.x, cam.z, kitchenOffset[0], kitchenOffset[2], kitchenRotY);
    const kTarget = this.toContainerLocalXZ(
      focusWorldX,
      focusWorldZ,
      kitchenOffset[0],
      kitchenOffset[2],
      kitchenRotY
    );
    const kDx = kTarget.x - kCam.x;
    const kDz = kTarget.z - kCam.z;
    const kHorizLen = Math.hypot(kDx, kDz);
    const kVx = kHorizLen > 0.001 ? kDx / kHorizLen : 0;
    const kVz = kHorizLen > 0.001 ? kDz / kHorizLen : 0;

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
    this.ensureCeilingSubgroupsVisible();
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

    // Dynamic camera-facing cutaway across all Ground Floor & First Floor rooms (Main House & Outbuildings):
    for (const { obj, descriptor, offsetX, offsetZ, rotationY } of this.dynamicCutawayWallItems) {
      const lCam = this.toContainerLocalXZ(cam.x, cam.z, offsetX, offsetZ, rotationY);
      const lTarget = this.toContainerLocalXZ(focusWorldX, focusWorldZ, offsetX, offsetZ, rotationY);
      const lHorizLen = Math.hypot(lTarget.x - lCam.x, lTarget.z - lCam.z);
      const lVx = lHorizLen > 0.001 ? (lTarget.x - lCam.x) / lHorizLen : 0;
      const lVz = lHorizLen > 0.001 ? (lTarget.z - lCam.z) / lHorizLen : 0;
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

    return {
        needsRender: needsRender || changed,
        shadowsDirty: (cutawayAffectsShadows && changed) || lodShadowsDirty,
      };
  }

  private ensureCeilingSubgroupsVisible(): void {
    for (const child of this.layers.ceilingMeshGroup.children) {
      if (child.userData?.isRoomContainer && !child.visible) {
        child.visible = true;
      }
    }
    for (const child of this.layers.groundFloorCeilingGroup.children) {
      if (child.userData?.isRoomContainer && !child.visible) {
        child.visible = true;
      }
    }
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
      (descriptor.floor === 'ground' &&
        (this.floorViewMode === 'ground' ||
          (Boolean(descriptor.includeInFirstFloorCutaway) && this.floorViewMode === 'first'))) ||
      (descriptor.floor === 'first' && this.floorViewMode === 'first');
    if (!activeFloorMatch || isTopDownPlan) {
      return false;
    }

    if (descriptor.axis === 'z') {
      const distZ = Math.abs(descriptor.coord - targetZ);
      const allowSouth = !descriptor.outwardSide || descriptor.outwardSide === 'south';
      const allowNorth = !descriptor.outwardSide || descriptor.outwardSide === 'north';
      const onSouthCamSide =
        allowSouth &&
        vz < -0.22 &&
        descriptor.coord > targetZ - 0.35 &&
        descriptor.coord <= camZ + 0.55;
      const onNorthCamSide =
        allowNorth &&
        vz > 0.22 &&
        descriptor.coord < targetZ + 0.35 &&
        descriptor.coord >= camZ - 0.55;

      if ((onSouthCamSide || onNorthCamSide) && distZ <= 6.2) {
        const tRay =
          Math.abs(targetZ - camZ) > 0.01
            ? THREE.MathUtils.clamp((descriptor.coord - camZ) / (targetZ - camZ), 0, 1.2)
            : 1;
        const rayX = camX + (targetX - camX) * tRay;
        return (
          (targetX >= descriptor.minSpan - 1.8 && targetX <= descriptor.maxSpan + 1.8) ||
          (rayX >= descriptor.minSpan - 1.5 && rayX <= descriptor.maxSpan + 1.5)
        );
      }
      return false;
    }

    const distX = Math.abs(descriptor.coord - targetX);
    const allowEast = !descriptor.outwardSide || descriptor.outwardSide === 'east';
    const allowWest = !descriptor.outwardSide || descriptor.outwardSide === 'west';
    const onEastCamSide =
      allowEast &&
      vx < -0.22 &&
      descriptor.coord > targetX - 0.35 &&
      descriptor.coord <= camX + 0.55;
    const onWestCamSide =
      allowWest &&
      vx > 0.22 &&
      descriptor.coord < targetX + 0.35 &&
      descriptor.coord >= camX - 0.55;

    if ((onEastCamSide || onWestCamSide) && distX <= 6.4) {
      const tRay =
        Math.abs(targetX - camX) > 0.01
          ? THREE.MathUtils.clamp((descriptor.coord - camX) / (targetX - camX), 0, 1.2)
          : 1;
      const rayZ = camZ + (targetZ - camZ) * tRay;
      return (
        (targetZ >= descriptor.minSpan - 1.8 && targetZ <= descriptor.maxSpan + 1.8) ||
        (rayZ >= descriptor.minSpan - 1.5 && rayZ <= descriptor.maxSpan + 1.5)
      );
    }
    return false;
  }
}
