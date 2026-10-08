import * as THREE from 'three';
import type { FloorViewMode } from '../../core/types/scene.ts';
import type { FloorId, RoomBoundingBox, RoomZoneId } from '../../core/types/topology.ts';
import type {
  LodPolicyMode,
  RoomLodDiagnostics,
  RoomLodStateSnapshot,
  RoomLodTier,
  RoomZoneLodRegistration,
} from '../../core/entities.ts';

interface ManagedLodObject {
  readonly object: THREE.Object3D;
  readonly tier: 1 | 2;
}

interface RuntimeDistanceLodItem {
  readonly object: THREE.Object3D;
  readonly centerX: number;
  readonly centerY: number;
  readonly centerZ: number;
  readonly maxDistanceM: number;
  visible: boolean;
}

interface ManagedRoomLodEntry {
  readonly zoneId: RoomZoneId;
  readonly shortName: string;
  readonly floorId: FloorId;
  readonly bounds: RoomBoundingBox;
  readonly center: THREE.Vector3;
  readonly shellGroup: THREE.Group;
  readonly standardGroup: THREE.Group;
  readonly heroGroup: THREE.Group;
  readonly managedObjects: ManagedLodObject[];
  currentTier: RoomLodTier;
  lastDistanceM: number;
}

export interface RoomLodGroups {
  readonly shellGroup: THREE.Group;
  readonly standardGroup: THREE.Group;
  readonly heroGroup: THREE.Group;
}

/**
 * Semantic Room Level-of-Detail (LOD) Controller.
 *
 * Manages per-room detail tiers across the entire property:
 * - `LOD0` (Shell): Architectural shell only (walls, windows, doors, slabs, switches).
 * - `LOD1` (Standard): Primary furniture, cabinetry carcasses, appliances & light fixtures.
 * - `LOD2` (Hero): High-detail interior props (cabinet interior crockery, books, tableware,
 *   logs, small decor) and full per-room lighting detail.
 */
export class RoomLodController {
  private static readonly AUTO_HERO_RADIUS_M = 14.0;
  private static readonly HERO_PROP_MAX_DIM_M = 0.34;
  private static readonly SHELL_STRUCTURAL_MIN_DIM_M = 1.95;

  private readonly rooms = new Map<RoomZoneId, ManagedRoomLodEntry>();
  private readonly runtimeDistanceItems: RuntimeDistanceLodItem[] = [];
  private policyMode: LodPolicyMode = 'auto';
  private focusedZoneId: RoomZoneId = 'kitchen';
  private lastEvalShadowsDirty = false;
  /** Perf-governor multiplier applied to every distance threshold (hero radius + runtime items). */
  private distanceScale = 1.0;
  /** Base radius (m) inside which rooms get LOD2 Hero detail in `auto` mode. */
  private highDetailMaxDistanceM = RoomLodController.AUTO_HERO_RADIUS_M;
  private onLodChangeCallback?: (diagnostics: RoomLodDiagnostics) => void;

  public constructor(registrations: readonly RoomZoneLodRegistration[] = []) {
    for (const reg of registrations) {
      this.registerRoom(reg);
    }
  }

  public registerRoom(reg: RoomZoneLodRegistration): RoomLodGroups {
    const existing = this.rooms.get(reg.zoneId);
    if (existing) {
      return {
        shellGroup: existing.shellGroup,
        standardGroup: existing.standardGroup,
        heroGroup: existing.heroGroup,
      };
    }

    const center = new THREE.Vector3(
      (reg.bounds.minX + reg.bounds.maxX) * 0.5,
      (reg.bounds.minY + reg.bounds.maxY) * 0.5,
      (reg.bounds.minZ + reg.bounds.maxZ) * 0.5
    );

    const shellGroup = new THREE.Group();
    shellGroup.name = `room-lod0-shell-${reg.zoneId}`;

    const standardGroup = new THREE.Group();
    standardGroup.name = `room-lod1-standard-${reg.zoneId}`;

    const heroGroup = new THREE.Group();
    heroGroup.name = `room-lod2-hero-${reg.zoneId}`;

    const entry: ManagedRoomLodEntry = {
      zoneId: reg.zoneId,
      shortName: reg.shortName,
      floorId: reg.floorId,
      bounds: reg.bounds,
      center,
      shellGroup,
      standardGroup,
      heroGroup,
      managedObjects: [],
      currentTier: 2,
      lastDistanceM: 0,
    };

    this.rooms.set(reg.zoneId, entry);
    return { shellGroup, standardGroup, heroGroup };
  }

  public setOnLodChanged(cb: (diagnostics: RoomLodDiagnostics) => void): void {
    this.onLodChangeCallback = cb;
  }

  public getRoomGroups(zoneId: RoomZoneId): RoomLodGroups | undefined {
    const entry = this.rooms.get(zoneId);
    if (!entry) return undefined;
    return {
      shellGroup: entry.shellGroup,
      standardGroup: entry.standardGroup,
      heroGroup: entry.heroGroup,
    };
  }

  public registerObjectWithTier(
    zoneId: RoomZoneId,
    object: THREE.Object3D,
    tier: 1 | 2
  ): void {
    const room = this.rooms.get(zoneId);
    if (!room) return;
    object.userData = { ...object.userData, lodTier: tier, zoneId };
    room.managedObjects.push({ object, tier });
    if (tier === 2) {
      RoomLodController.disableShadowCasting(object);
    }
  }

  /**
   * Registers a distance-culled micro-detail object. Distance culling never changes the set of
   * shadow casters: the object is made permanently non-shadow-casting (these are small props),
   * so the `_castsShadow` argument is ignored and kept only for call-site compatibility.
   */
  public registerRuntimeDistanceObject(
    object: THREE.Object3D,
    centerX: number,
    centerY: number,
    centerZ: number,
    maxDistanceM: number,
    _castsShadow = false
  ): void {
    RoomLodController.disableShadowCasting(object);
    this.runtimeDistanceItems.push({
      object,
      centerX,
      centerY,
      centerZ,
      maxDistanceM,
      visible: object.visible,
    });
  }

  /**
   * High-detail (LOD2 / distance-culled) props are fixed as non-shadow-casting at load so LOD
   * switching driven by the camera can never add or remove sun/point-light shadow casters.
   */
  private static disableShadowCasting(object: THREE.Object3D): void {
    object.traverse((node) => {
      if (node instanceof THREE.Mesh && node.castShadow) {
        node.castShadow = false;
      }
    });
  }

  /**
   * Perf-governor hook: scales every LOD distance threshold (hero radius and runtime
   * distance-culled items). `1` = default; `<1` hides detail sooner. Takes effect on the next
   * `evaluateLod`. Never affects lighting or shadow casters.
   */
  public setDistanceScale(scale: number): void {
    this.distanceScale = Number.isFinite(scale) && scale > 0 ? scale : 1.0;
  }

  public getDistanceScale(): number {
    return this.distanceScale;
  }

  /** Perf-governor hook: base radius (m, before `distanceScale`) for LOD2 Hero rooms in `auto` mode. */
  public setHighDetailMaxDistance(m: number): void {
    this.highDetailMaxDistanceM =
      Number.isFinite(m) && m >= 0 ? m : RoomLodController.AUTO_HERO_RADIUS_M;
  }

  public getHighDetailMaxDistance(): number {
    return this.highDetailMaxDistanceM;
  }

  /** World-space centre of a registered room (used e.g. as the point-light budget anchor). */
  public getRoomCenter(zoneId: RoomZoneId): THREE.Vector3 | undefined {
    return this.rooms.get(zoneId)?.center;
  }

  public clearRuntimeDistanceObjects(): void {
    for (let i = 0; i < this.runtimeDistanceItems.length; i++) {
      const item = this.runtimeDistanceItems[i]!;
      item.object.visible = true;
      item.visible = true;
    }
    this.runtimeDistanceItems.length = 0;
  }

  public removeBatchedObjects(objectsToRemove?: ReadonlySet<THREE.Object3D>): void {
    for (const room of this.rooms.values()) {
      for (let i = room.managedObjects.length - 1; i >= 0; i--) {
        const obj = room.managedObjects[i]!.object;
        if (
          obj.userData?.isBatchedStaticMesh ||
          (objectsToRemove !== undefined && objectsToRemove.has(obj))
        ) {
          room.managedObjects.splice(i, 1);
        }
      }
    }
  }

  public didLastEvalChangeShadows(): boolean {
    return this.lastEvalShadowsDirty;
  }

  /**
   * Scans built scene root groups and binds interior furniture (`LOD1`) and fine props (`LOD2`)
   * to their enclosing `RoomZoneId` so every room supports dynamic `LOD0` / `LOD1` / `LOD2` switching.
   */
  public indexBuiltSceneHierarchy(roots: readonly THREE.Object3D[]): void {
    for (const room of this.rooms.values()) {
      for (const item of room.managedObjects) {
        item.object.visible = true;
      }
      room.shellGroup.visible = true;
      room.standardGroup.visible = true;
      room.heroGroup.visible = true;
      room.currentTier = 2;
      room.managedObjects.length = 0;
    }

    const rootSet = new Set<THREE.Object3D>(roots);
    const box = new THREE.Box3();
    for (const room of this.rooms.values()) {
      RoomLodController.disableShadowCasting(room.heroGroup);
    }
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    for (const root of roots) {
      root.updateMatrixWorld(true);
      const floorFilter: 'ground' | 'first' | undefined =
        root.name === 'firstFloorMeshGroup' ? 'first' : undefined;
      for (const child of root.children) {
        if (rootSet.has(child)) continue;
        this.classifySceneBranch(child, box, size, center, floorFilter);
      }
    }
  }

  private classifySceneBranch(
    obj: THREE.Object3D,
    box: THREE.Box3,
    size: THREE.Vector3,
    center: THREE.Vector3,
    floorFilter?: 'ground' | 'first'
  ): void {
    // Skip lights, cameras, and helper planes, as well as state-toggled hidden subtrees (e.g. extended dining table seats)
    if (obj instanceof THREE.Light || obj instanceof THREE.Camera || !obj.visible || obj.userData?.lodIgnore) {
      return;
    }

    // Transparently unwrap hierarchical Wing / Room / Wall-Frame container groups
    // so their child meshes and furniture groups are classified identically to top-level scene children.
    if (obj.userData?.isRoomContainer) {
      for (const sub of obj.children) {
        this.classifySceneBranch(sub, box, size, center, floorFilter);
      }
      return;
    }

    // Never classify dynamic cutaway wall segments, architectural shell groups, windows, doors, floors, skirtings, or stairs as LOD1/LOD2 furniture
    if (
      obj.userData?.isCutawayWall ||
      obj.userData?.isArchitecturalShell ||
      (typeof obj.name === 'string' &&
        /floor|stairs|architrave|doorwaycasing|skirting|chimneybreast|gable|skeiling|collar/i.test(
          obj.name
        ))
    ) {
      return;
    }

    // Never hide interactive switches, doors, bifolds, gates, or security devices in LOD0
    if (this.containsCriticalInteractive(obj)) {
      return;
    }

    const rawTier = obj.userData?.lodTier;
    const explicitTier: RoomLodTier | undefined =
      typeof rawTier === 'number' ? (rawTier as RoomLodTier) : undefined;
    const explicitZone = (obj.userData?.zoneId ?? obj.userData?.zone) as
      | RoomZoneId
      | undefined;

    if (explicitTier !== undefined && explicitZone !== undefined) {
      if (explicitTier === 1 || explicitTier === 2) {
        const room = this.rooms.get(explicitZone);
        room?.managedObjects.push({ object: obj, tier: explicitTier });
        if (room && explicitTier === 2) {
          RoomLodController.disableShadowCasting(obj);
        }
      }
      return;
    }

    box.setFromObject(obj);
    if (box.isEmpty()) return;

    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const minHorizontalDim = Math.min(size.x, size.z);

    // Explicitly room-tagged furniture, curtains, and equipment assemblies
    if (explicitZone && explicitZone !== 'courtyard' && maxDim < 6.0) {
      const room = this.rooms.get(explicitZone);
      if (room) {
        const tier: 1 | 2 =
          maxDim <= RoomLodController.HERO_PROP_MAX_DIM_M ? 2 : 1;
        obj.userData = { ...obj.userData, lodTier: tier, zoneId: room.zoneId };
        room.managedObjects.push({ object: obj, tier });
        if (tier === 2) {
          RoomLodController.disableShadowCasting(obj);
        }
        return;
      }
    }

    // Structural slabs, long walls, roofs, or large architectural assemblies stay in LOD0 Shell
    if (maxDim >= RoomLodController.SHELL_STRUCTURAL_MIN_DIM_M) {
      // If it's a container Group with many sub-items (e.g. cabinet interior group or room prop group),
      // recurse into its children so individual furniture and props inside it are classified!
      if (obj instanceof THREE.Group && obj.children.length > 1 && maxDim < 18.0) {
        for (const sub of obj.children) {
          this.classifySceneBranch(sub, box, size, center, floorFilter);
        }
      }
      return;
    }

    // Thin vertical wall/window panels on the perimeter stay in LOD0 Shell
    if (size.y >= 1.8 && minHorizontalDim <= 0.28) {
      return;
    }

    // Named furniture/radiator groups can sit flush against interior walls (-0.15m inset),
    // while unnamed meshes require a +0.05m inset so exterior window/wall details stay in LOD0.
    const isNamedGroup = obj instanceof THREE.Group && obj.name.length > 0;
    const room = this.findContainingRoom(
      center.x,
      center.y,
      center.z,
      isNamedGroup ? -0.15 : 0.05,
      floorFilter
    );
    if (!room) return;

    const tier: 1 | 2 =
      maxDim <= RoomLodController.HERO_PROP_MAX_DIM_M ? 2 : 1;

    obj.userData = { ...obj.userData, lodTier: tier, zoneId: room.zoneId };
    room.managedObjects.push({ object: obj, tier });
    if (tier === 2) {
      RoomLodController.disableShadowCasting(obj);
    }
  }

  private containsCriticalInteractive(obj: THREE.Object3D): boolean {
    let found = false;
    obj.traverse((node) => {
      if (found) return;
      const u = node.userData;
      if (
        u?.isArchitecturalShell ||
        u?.isCutawayWall ||
        u?.isKNXSwitch ||
        u?.switchPa ||
        u?.isKnxTempSensor ||
        u?.isCourtyardSwitch ||
        u?.isUtilitySwitch ||
        u?.isKitchenMotionSensor ||
        u?.isUtilityMotionSensor ||
        u?.roomMotionSensorId ||
        u?.isBifoldDoor ||
        u?.isCarGate ||
        u?.isUniFiCamera ||
        u?.isUniFiAccessReader ||
        u?.circuitId !== undefined ||
        u?.isFittingFx ||
        u?.isLightGlowPool
      ) {
        found = true;
      }
    });
    return found;
  }

  private findContainingRoom(
    x: number,
    y: number,
    z: number,
    horizontalInsetM = -0.15,
    floorFilter?: 'ground' | 'first'
  ): ManagedRoomLodEntry | undefined {
    for (const room of this.rooms.values()) {
      if (room.zoneId === 'courtyard') continue;
      if (floorFilter && room.floorId !== floorFilter) continue;
      if (room.zoneId === 'upperLanding' && x > -16.95 && z > 2.65) continue;
      const b = room.bounds;
      const maxYLimit = room.floorId === 'ground' ? b.maxY : b.maxY + 0.1;
      if (
        x >= b.minX + horizontalInsetM &&
        x <= b.maxX - horizontalInsetM &&
        y >= b.minY - 0.1 &&
        y <= maxYLimit &&
        z >= b.minZ + horizontalInsetM &&
        z <= b.maxZ - horizontalInsetM
      ) {
        return room;
      }
    }
    return undefined;
  }

  public getPolicyMode(): LodPolicyMode {
    return this.policyMode;
  }

  public setPolicyMode(
    mode: LodPolicyMode,
    cameraPos: THREE.Vector3,
    cameraTarget: THREE.Vector3,
    floorViewMode: FloorViewMode
  ): boolean {
    this.policyMode = mode;
    return this.evaluateLod(cameraPos, cameraTarget, floorViewMode, true);
  }

  public getFocusedZoneId(): RoomZoneId {
    return this.focusedZoneId;
  }

  public getFocusedRoomShortName(): string {
    const focusedEntry = this.rooms.get(this.focusedZoneId);
    return focusedEntry?.shortName ?? this.focusedZoneId;
  }

  public setFocusedZoneId(
    zoneId: RoomZoneId,
    cameraPos: THREE.Vector3,
    cameraTarget: THREE.Vector3,
    floorViewMode: FloorViewMode
  ): boolean {
    this.focusedZoneId = zoneId;
    return this.evaluateLod(cameraPos, cameraTarget, floorViewMode, true);
  }

  /**
   * Evaluates and applies the target LOD tier (`0`, `1`, or `2`) for every registered room.
   * Returns `true` if any room's LOD tier changed (requiring a re-render).
   */
  public evaluateLod(
    cameraPos: THREE.Vector3,
    cameraTarget: THREE.Vector3,
    floorViewMode: FloorViewMode,
    forceNotify = false
  ): boolean {
    let anyChanged = false;
    let shadowsDirty = false;

    // Determine if the camera target is inside a specific interior room
    const targetRoom = this.findContainingRoom(
      cameraTarget.x,
      cameraTarget.y,
      cameraTarget.z
    );
    if (targetRoom && this.policyMode === 'auto') {
      this.focusedZoneId = targetRoom.zoneId;
    }

    for (const room of this.rooms.values()) {
      const verticalWeight = floorViewMode === 'all' ? 1.6 : 0.45;
      const distToTarget = Math.hypot(
        room.center.x - cameraTarget.x,
        (room.center.y - cameraTarget.y) * verticalWeight,
        room.center.z - cameraTarget.z
      );
      const distToCam = Math.hypot(
        room.center.x - cameraPos.x,
        (room.center.y - cameraPos.y) * 0.4,
        room.center.z - cameraPos.z
      );
      const effectiveDist = Math.min(distToTarget, distToCam * 0.85);
      room.lastDistanceM = Math.round(effectiveDist * 10) / 10;

      const desiredTier = this.computeDesiredTierForRoom(
        room,
        effectiveDist,
        floorViewMode
      );

      if (room.currentTier !== desiredTier || forceNotify) {
        if (room.currentTier !== desiredTier) {
          anyChanged = true;
          // LOD2 hero props never cast shadows, so only a tier-1 (primary furniture) visibility
          // change alters the shadow-caster set. In `auto` mode that boundary depends solely on
          // the floor view mode (never on camera distance or focus), see computeDesiredTierForRoom.
          if ((room.currentTier >= 1) !== (desiredTier >= 1)) {
            shadowsDirty = true;
          }
        }
        room.currentTier = desiredTier;
        this.applyTierToRoom(room, desiredTier);
      }
    }

    // Evaluate runtime distance-culled micro-detail and outbuilding interior clusters
    const nRuntime = this.runtimeDistanceItems.length;
    if (nRuntime > 0) {
      const camX = cameraPos.x;
      const camY = cameraPos.y;
      const camZ = cameraPos.z;
      const tgtX = cameraTarget.x;
      const tgtY = cameraTarget.y;
      const tgtZ = cameraTarget.z;
      const mode = this.policyMode;
      const scale = this.distanceScale;

      for (let i = 0; i < nRuntime; i++) {
        const item = this.runtimeDistanceItems[i]!;
        let wantVisible = true;
        if (mode === 'lod0') {
          wantVisible = false;
        } else if (mode === 'lod1') {
          wantVisible = item.maxDistanceM > 20.0;
        } else if (mode === 'auto') {
          const dxC = item.centerX - camX;
          const dyC = (item.centerY - camY) * 0.5;
          const dzC = item.centerZ - camZ;
          const distCamSq = dxC * dxC + dyC * dyC + dzC * dzC;

          const dxT = item.centerX - tgtX;
          const dyT = (item.centerY - tgtY) * 0.5;
          const dzT = item.centerZ - tgtZ;
          const distTgtSq = dxT * dxT + dyT * dyT + dzT * dzT;

          const minDistSq = Math.min(distCamSq * 0.78, distTgtSq);
          // 1.2m hysteresis band prevents popping when hovering near threshold
          const scaledMax = item.maxDistanceM * scale;
          const threshold = item.visible ? scaledMax + 0.6 : scaledMax - 0.6;
          wantVisible = minDistSq <= threshold * threshold;
        }

        if (item.visible !== wantVisible || forceNotify) {
          if (item.visible !== wantVisible) {
            // Runtime items are permanently non-shadow-casting: never dirties shadows.
            anyChanged = true;
          }
          item.visible = wantVisible;
          item.object.visible = wantVisible;
        }
      }
    }

    this.lastEvalShadowsDirty = shadowsDirty;

    if ((anyChanged || forceNotify) && this.onLodChangeCallback) {
      this.onLodChangeCallback(this.getDiagnostics());
    }

    return anyChanged;
  }

  private computeDesiredTierForRoom(
    room: ManagedRoomLodEntry,
    effectiveDistM: number,
    floorViewMode: FloorViewMode
  ): RoomLodTier {
    if (this.policyMode === 'lod0') return 0;
    if (this.policyMode === 'lod1') return 1;
    if (this.policyMode === 'lod2') return 2;

    // In 'auto' mode:
    // 1. Rooms on a hidden/non-active floor drop to LOD0 Shell. The double-height stair void
    //    (Upper Landing seen from the Hall and vice versa) always keeps LOD1 so the shadow-caster
    //    set does not depend on which room the camera happens to be focused on.
    if (floorViewMode === 'ground' && room.floorId === 'first') {
      return room.zoneId === 'upperLanding' ? 1 : 0;
    }
    if (floorViewMode === 'first' && room.floorId === 'ground') {
      return room.zoneId === 'hall' ? 1 : 0;
    }

    // 2. The explicitly focused room (and Kitchen/Sitting pair when either is focused) gets LOD2 Hero
    const isFocusedPair =
      room.zoneId === this.focusedZoneId ||
      (this.focusedZoneId === 'kitchen' && room.zoneId === 'sitting') ||
      (this.focusedZoneId === 'sitting' && room.zoneId === 'kitchen');

    if (isFocusedPair || effectiveDistM <= this.highDetailMaxDistanceM * this.distanceScale) {
      return 2;
    }

    // Always keep primary room furniture (LOD1 Standard) visible on the active floor
    return 1;
  }

  private applyTierToRoom(room: ManagedRoomLodEntry, tier: RoomLodTier): void {
    room.shellGroup.visible = true;
    room.standardGroup.visible = tier >= 1;
    room.heroGroup.visible = tier >= 2;

    for (const item of room.managedObjects) {
      item.object.visible = tier >= item.tier;
    }
  }

  public getDiagnostics(): RoomLodDiagnostics {
    const tierCounts: Record<RoomLodTier, number> = { 0: 0, 1: 0, 2: 0 };
    const snapshots: RoomLodStateSnapshot[] = [];

    for (const room of this.rooms.values()) {
      tierCounts[room.currentTier] += 1;
      let standardCount = room.standardGroup.children.length;
      let heroCount = room.heroGroup.children.length;
      for (const m of room.managedObjects) {
        if (m.tier === 1) standardCount += 1;
        else heroCount += 1;
      }
      snapshots.push({
        zoneId: room.zoneId,
        shortName: room.shortName,
        floorId: room.floorId,
        tier: room.currentTier,
        isFocused: room.zoneId === this.focusedZoneId,
        distanceToTargetM: room.lastDistanceM,
        standardObjectCount: standardCount,
        heroObjectCount: heroCount,
      });
    }

    const focusedEntry = this.rooms.get(this.focusedZoneId);
    return {
      policyMode: this.policyMode,
      focusedZoneId: this.focusedZoneId,
      focusedZoneTier: focusedEntry ? focusedEntry.currentTier : 2,
      tierCounts,
      rooms: snapshots,
    };
  }
}
