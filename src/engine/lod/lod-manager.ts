import * as THREE from 'three';
import type { FloorViewMode } from '../../types/scene.ts';
import type { FloorId, RoomBoundingBox, RoomZoneId } from '../../types/topology.ts';
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
  private static readonly AUTO_HERO_RADIUS_M = 5.6;
  private static readonly AUTO_STANDARD_RADIUS_M = 11.2;
  private static readonly HERO_PROP_MAX_DIM_M = 0.34;
  private static readonly SHELL_STRUCTURAL_MIN_DIM_M = 1.95;

  private readonly rooms = new Map<RoomZoneId, ManagedRoomLodEntry>();
  private policyMode: LodPolicyMode = 'auto';
  private focusedZoneId: RoomZoneId = 'kitchen';
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
  }

  /**
   * Scans built scene root groups and binds interior furniture (`LOD1`) and fine props (`LOD2`)
   * to their enclosing `RoomZoneId` so every room supports dynamic `LOD0` / `LOD1` / `LOD2` switching.
   */
  public indexBuiltSceneHierarchy(roots: readonly THREE.Object3D[]): void {
    for (const room of this.rooms.values()) {
      room.managedObjects.length = 0;
    }

    const rootSet = new Set<THREE.Object3D>(roots);
    const box = new THREE.Box3();
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    for (const root of roots) {
      root.updateMatrixWorld(true);
      for (const child of root.children) {
        if (rootSet.has(child)) continue;
        this.classifySceneBranch(child, box, size, center);
      }
    }
  }

  private classifySceneBranch(
    obj: THREE.Object3D,
    box: THREE.Box3,
    size: THREE.Vector3,
    center: THREE.Vector3
  ): void {
    // Skip lights, cameras, and helper planes, as well as state-toggled hidden subtrees (e.g. extended dining table seats)
    if (obj instanceof THREE.Light || obj instanceof THREE.Camera || !obj.visible || obj.userData?.lodIgnore) {
      return;
    }

    // Transparently unwrap hierarchical Wing / Room / Wall-Frame container groups
    // so their child meshes and furniture groups are classified identically to top-level scene children.
    if (obj.userData?.isRoomContainer) {
      for (const sub of obj.children) {
        this.classifySceneBranch(sub, box, size, center);
      }
      return;
    }

    // Never classify dynamic cutaway wall segments, architectural shell groups, windows, doors, floors, or stairs as LOD1/LOD2 furniture
    if (
      obj.userData?.isCutawayWall ||
      obj.userData?.isArchitecturalShell ||
      (typeof obj.name === 'string' &&
        /floor|stairs|architrave|doorwaycasing/i.test(obj.name))
    ) {
      return;
    }

    // Never hide interactive switches, doors, bifolds, gates, or security devices in LOD0
    if (this.containsCriticalInteractive(obj)) {
      return;
    }

    const explicitTier = obj.userData?.lodTier as RoomLodTier | undefined;
    let explicitZone = (obj.userData?.zoneId ?? obj.userData?.zone) as
      | RoomZoneId
      | undefined;
    if (!explicitZone && typeof obj.name === 'string' && obj.name.length > 0) {
      const dotIdx = obj.name.indexOf('.');
      if (dotIdx > 0) {
        const prefix = obj.name.slice(0, dotIdx);
        if (prefix === 'diningRoom') {
          explicitZone = 'familyRoom';
        } else if (prefix === 'westBayWindow') {
          explicitZone = 'livingRoom';
        } else if (this.rooms.has(prefix as RoomZoneId)) {
          explicitZone = prefix as RoomZoneId;
        }
      }
    }

    if (explicitTier !== undefined && explicitZone !== undefined) {
      if (explicitTier === 1 || explicitTier === 2) {
        const room = this.rooms.get(explicitZone);
        room?.managedObjects.push({ object: obj, tier: explicitTier });
      }
      return;
    }

    box.setFromObject(obj);
    if (box.isEmpty()) return;

    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const minHorizontalDim = Math.min(size.x, size.z);

    // Explicitly room-tagged or room-prefixed furniture, curtains, and equipment assemblies
    if (explicitZone && explicitZone !== 'courtyard' && maxDim < 6.0) {
      const room = this.rooms.get(explicitZone);
      if (room) {
        const tier: 1 | 2 =
          maxDim <= RoomLodController.HERO_PROP_MAX_DIM_M ? 2 : 1;
        obj.userData = { ...obj.userData, lodTier: tier, zoneId: room.zoneId };
        room.managedObjects.push({ object: obj, tier });
        return;
      }
    }

    // Structural slabs, long walls, roofs, or large architectural assemblies stay in LOD0 Shell
    if (maxDim >= RoomLodController.SHELL_STRUCTURAL_MIN_DIM_M) {
      // If it's a container Group with many sub-items (e.g. cabinet interior group or room prop group),
      // recurse into its children so individual furniture and props inside it are classified!
      if (obj instanceof THREE.Group && obj.children.length > 1 && maxDim < 18.0) {
        for (const sub of obj.children) {
          this.classifySceneBranch(sub, box, size, center);
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
      isNamedGroup ? -0.15 : 0.05
    );
    if (!room) return;

    const tier: 1 | 2 =
      maxDim <= RoomLodController.HERO_PROP_MAX_DIM_M ? 2 : 1;

    obj.userData = { ...obj.userData, lodTier: tier, zoneId: room.zoneId };
    room.managedObjects.push({ object: obj, tier });
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
        u?.isUniFiAccessReader
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
    horizontalInsetM = -0.15
  ): ManagedRoomLodEntry | undefined {
    for (const room of this.rooms.values()) {
      if (room.zoneId === 'courtyard') continue;
      if (room.zoneId === 'upperLanding' && x > -16.95 && z > 2.65) continue;
      const b = room.bounds;
      if (
        x >= b.minX + horizontalInsetM &&
        x <= b.maxX - horizontalInsetM &&
        y >= b.minY - 0.1 &&
        y <= b.maxY + 0.1 &&
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
        }
        room.currentTier = desiredTier;
        this.applyTierToRoom(room, desiredTier);
      }
    }

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
    // 1. Rooms on a hidden/non-active floor drop to LOD0 Shell (except Upper Landing when looking up from Hall)
    if (floorViewMode === 'ground' && room.floorId === 'first') {
      if (room.zoneId === 'upperLanding' && this.focusedZoneId === 'hall') {
        return 1;
      }
      return 0;
    }
    if (floorViewMode === 'first' && room.floorId === 'ground') {
      if (room.zoneId === 'hall' && this.focusedZoneId === 'upperLanding') {
        return 1;
      }
      return 0;
    }

    // 2. The explicitly focused room (and Kitchen/Sitting pair when either is focused) gets LOD2 Hero
    const isFocusedPair =
      room.zoneId === this.focusedZoneId ||
      (this.focusedZoneId === 'kitchen' && room.zoneId === 'sitting') ||
      (this.focusedZoneId === 'sitting' && room.zoneId === 'kitchen');

    if (isFocusedPair || effectiveDistM <= RoomLodController.AUTO_HERO_RADIUS_M) {
      return 2;
    }

    if (effectiveDistM <= RoomLodController.AUTO_STANDARD_RADIUS_M) {
      return 1;
    }

    return 0;
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
