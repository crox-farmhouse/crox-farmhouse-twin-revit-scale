import * as THREE from 'three';
import type { RoomLodController } from '../lod/lod-manager.ts';
import type { TimeOfDay } from '../../core/types/scene.ts';
import type { BifoldPanelRef, LightGroupMap, ZoneIndicatorMaterials } from '../viewer/scene-types.ts';
import type { RoomZoneId } from '../../core/types/topology.ts';
import type { PropertySceneLayers, RoomSwitchLedBinding } from '../viewer/scene-content.ts';

interface BatchedGroupRecord {
  readonly parent: THREE.Object3D;
  readonly originalMeshes: readonly {
    readonly mesh: THREE.Mesh;
    readonly meshParent: THREE.Object3D;
  }[];
  readonly mergedMeshes: readonly THREE.Mesh[];
}

interface OriginalLightRecord {
  readonly light: THREE.PointLight;
  readonly originalParent: THREE.Object3D;
  readonly originalPosition: THREE.Vector3;
  readonly originalVisible: boolean;
  readonly originalIntensity: number;
  readonly originalDistance: number;
}

export interface ManagedPointLightEntry {
  readonly light: THREE.PointLight;
  readonly worldPos: THREE.Vector3;
  readonly isFirstFloor: boolean;
  readonly isStandalone: boolean;
  readonly baseIntensity: number;
}

/** World-space anchor (or room id) used to pick which point lights stay inside the light budget. */
export type PointLightBudgetAnchor = RoomZoneId | THREE.Vector3;

/** Seconds taken to fade a point light in/out when it enters or leaves the light budget. */
const POINT_LIGHT_BUDGET_FADE_S = 0.25;

/** Max intensity boost for a circuit's surviving lights when the budget drops some of them. */
const BUDGET_MAX_BOOST = 1.6;

/** Weight of vertical (floor-to-floor) distance when ranking lights against the budget anchor. */
const BUDGET_VERTICAL_WEIGHT = 3;

/** `userData` key holding a managed light's current budget fade weight (0..1). */
export const POINT_LIGHT_BUDGET_WEIGHT_KEY = 'budgetWeight';

/** Reads the budget fade weight that `SceneBatchOptimizer` stored on a light (1 when unmanaged). */
export function getPointLightBudgetWeight(light: THREE.Light): number {
  const w = light.userData?.[POINT_LIGHT_BUDGET_WEIGHT_KEY];
  return typeof w === 'number' ? w : 1;
}

/** Budget re-rank listeners keyed by the shared light-group map (one optimizer per scene). */
const levelChangeListeners = new WeakMap<LightGroupMap, () => void>();

/**
 * Called by the circuit lighting controller after it writes new KNX target intensities so the
 * light budget re-ranks immediately (outside the frame loop): newly switched-on circuits get a
 * slot at once instead of waiting for the next `stepFades`.
 */
export function notifyCircuitLevelsChanged(lightGroups: LightGroupMap): void {
  levelChangeListeners.get(lightGroups)?.();
}

/**
 * Userdata flag for runtime-added lights (e.g. synthetic fitting fill lights) whose parent may be
 * hidden by room LOD / floor modes: they are always hoisted to the scene root like 1F lights.
 */
export const ALWAYS_HOIST_LIGHT_FLAG = 'alwaysHoistLight';

/** Userdata flag for helper meshes that must never be batched, deduplicated or shadow-culled. */
export const SHADOW_PASS_HOOK_FLAG = 'isShadowPassHook';

export interface SceneBatchOptimizerOptions {
  readonly layers: PropertySceneLayers;
  readonly lodController: RoomLodController;
  readonly interactiveMeshes: THREE.Object3D[];
  readonly bifoldPanels: readonly BifoldPanelRef[];
  readonly lightGroups: LightGroupMap;
  readonly indicatorMats: ZoneIndicatorMaterials;
  readonly roomSwitchLedMats: readonly RoomSwitchLedBinding[];
  readonly getDynamicObjects: () => Set<THREE.Object3D>;
  /** Called before any batch/unbatch mutation (e.g. to suspend trade-view material overlays). */
  readonly onBeforeBatchChange?: () => void;
  readonly onAfterBatchChange?: () => void;
}

const LEAF_OR_MICRO_SHADOW_EXCLUDE_RE =
  /leaf|leaves|foliage|blossom|petal|tendril|grapeCluster|berry|herb|fern|moss|needle|filament|bristle|spoke|cassette|chainring|bolt|screw|nut|washer|rivet|keycap/i;

/**
 * Runtime static-geometry batcher, material deduplicator, shadow-caster filter,
 * PointLight consolidator, and distance-LOD binder.
 *
 * Reduces ~20,700 individual `THREE.Mesh` objects down to ~850–1,050 batched draw calls while:
 * - Preserving all interactive doors, drawers, cupboards, bifolds, gates, switches, sensors, and lights.
 * - Updating `interactiveMeshes` so static clickable fixtures/furniture remain 100% interactive with 5x fewer raycast targets.
 * - Consolidating redundant overlapping standalone `PointLight`s and keeping `NUM_POINT_LIGHTS` constant across floor modes (zero shader recompiles).
 * - Supporting instant reversible `unbatchAll()` whenever `.usda` zone hot-reloading, annotation mode, or saved transform re-application needs the original unmerged mesh tree.
 */
export class SceneBatchOptimizer {
  private readonly options: SceneBatchOptimizerOptions;
  private readonly batchRecords: BatchedGroupRecord[] = [];
  private readonly originalChildrenByParent = new Map<THREE.Object3D, THREE.Object3D[]>();
  private readonly originalMeshProps = new Map<
    THREE.Mesh,
    { readonly material: THREE.Material | THREE.Material[]; readonly castShadow: boolean }
  >();
  private originalInteractiveMeshes: THREE.Object3D[] | null = null;
  private readonly originalLightRecords: OriginalLightRecord[] = [];
  private readonly managedPointLights: ManagedPointLightEntry[] = [];
  private readonly allRegisteredBatchMeshes = new Set<THREE.Object3D>();
  private isCurrentlyBatched = false;
  private extraLodBound = false;
  private timeOfDay: TimeOfDay = 'dusk';

  // Fixed point-light budget (camera-independent). `Infinity` keeps every managed light active.
  private pointLightBudget = Number.POSITIVE_INFINITY;
  private budgetAnchor: PointLightBudgetAnchor | null = null;
  /** Per managed light (parallel to `managedPointLights`): current fade weight 0..1. */
  private readonly budgetWeights: number[] = [];
  /** Per managed light: target fade weight (0 = outside budget, 1 = inside). */
  private readonly budgetTargets: number[] = [];
  /** ON/OFF signature of the managed lights when the budget targets were last computed. */
  private budgetActivityKey = '';
  /**
   * KNX switch-on order per budget group (`circuit:<id>`): bumped whenever a circuit goes from OFF
   * to ON after boot. Recently switched-on circuits outrank older ones for budget slots, so the
   * room the user just lit never stays dark. Depends only on KNX history, never on the camera.
   */
  private readonly budgetGroupActivation = new Map<string, number>();
  private budgetActivationCounter = 0;

  private getStandaloneLightTodScale(): number {
    // Outbuilding / Barn / Gym / Garage / Mezzanine / Stable interiors have deep footprints and minimal
    // window daylight, so their standalone task & ambient PointLights stay bright across all times of day.
    if (this.timeOfDay === 'day') return 1.15;
    if (this.timeOfDay === 'dusk') return 1.20;
    return 1.15;
  }

  public setTimeOfDay(mode: TimeOfDay): void {
    if (this.timeOfDay === mode) return;
    this.timeOfDay = mode;
    this.applyManagedLightIntensities();
  }

  /**
   * Physical (pre-budget) intensity of a managed light: the KNX dimmer target for KNX circuits,
   * or `baseIntensity × time-of-day scale` for standalone lights. Never depends on the camera.
   */
  private getManagedLightTargetIntensity(entry: ManagedPointLightEntry): number {
    if (entry.isStandalone) {
      return entry.baseIntensity * this.getStandaloneLightTodScale();
    }
    const knxTarget = entry.light.userData?.knxTargetIntensity;
    return typeof knxTarget === 'number' ? knxTarget : entry.baseIntensity;
  }

  /** Writes `target × budgetWeight` into every managed light. Returns true if any intensity changed. */
  private applyManagedLightIntensities(): boolean {
    let changed = false;
    for (let i = 0; i < this.managedPointLights.length; i++) {
      const entry = this.managedPointLights[i]!;
      const weight = this.budgetWeights[i] ?? 1;
      const next = this.getManagedLightTargetIntensity(entry) * weight;
      if (entry.light.intensity !== next) {
        entry.light.intensity = next;
        changed = true;
      }
    }
    return changed;
  }

  /**
   * Sets a fixed number of managed point lights that may be lit at once (per quality tier).
   * Lights are chosen by proximity to the budget anchor room (never the camera) and only change
   * when the budget or anchor changes. `Infinity` (default) keeps every light active.
   * Returns true if the active set changed (call `stepFades` each frame to animate the switch).
   */
  public setPointLightBudget(n: number): boolean {
    const next = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : Number.POSITIVE_INFINITY;
    if (next === this.pointLightBudget) return false;
    this.pointLightBudget = next;
    return this.recomputeBudgetTargets();
  }

  public getPointLightBudget(): number {
    return this.pointLightBudget;
  }

  /**
   * Sets the room (zone id, resolved via `RoomLodController.getRoomCenter`) or world position that
   * the light budget is centred on. Only explicit calls change the active set.
   * Returns true if the active set changed.
   */
  public setBudgetAnchorZone(anchor: PointLightBudgetAnchor): boolean {
    if (anchor instanceof THREE.Vector3) {
      if (this.budgetAnchor instanceof THREE.Vector3 && this.budgetAnchor.equals(anchor)) return false;
      this.budgetAnchor = anchor.clone();
    } else {
      if (this.budgetAnchor === anchor) return false;
      this.budgetAnchor = anchor;
    }
    return this.recomputeBudgetTargets();
  }

  private resolveBudgetAnchorPosition(): THREE.Vector3 | null {
    const anchor = this.budgetAnchor;
    if (anchor === null) return null;
    if (anchor instanceof THREE.Vector3) return anchor;
    return this.options.lodController.getRoomCenter(anchor) ?? null;
  }

  /**
   * Recomputes which managed lights are inside the budget. Returns true if any target changed.
   *
   * Policy (camera-independent; depends only on KNX state, time of day, budget and anchor room):
   * 1. Only lights that are actually ON (target intensity > 0) compete for slots; OFF lights
   *    contribute nothing, so they never steal a slot from a lit room.
   * 2. First pass gives the nearest light of every ON KNX circuit its own slot (nearest to the
   *    anchor first), then one per always-on standalone room, so a switched-on circuit is never
   *    left dark — one strong light per room beats several weak ones in a single room.
   * 3. Remaining slots go to the remaining ON lights by distance to the anchor.
   * 4. When a circuit keeps only some of its ON lights, those are boosted (≤ BUDGET_MAX_BOOST)
   *    so the room's total light output is roughly preserved.
   */
  private recomputeBudgetTargets(): boolean {
    const n = this.managedPointLights.length;
    const budget = this.pointLightBudget;
    const nextTargets = new Array<number>(n).fill(1);
    const prevActivityKey = this.budgetActivityKey;
    this.budgetActivityKey = this.computeBudgetActivityKey();
    if (prevActivityKey.length === n) this.stampSwitchedOnGroups(prevActivityKey, this.budgetActivityKey);
    if (Number.isFinite(budget) && budget < n) {
      const anchorPos = this.resolveBudgetAnchorPosition();
      const order: number[] = [];
      for (let i = 0; i < n; i++) order.push(i);
      if (anchorPos) {
        // Vertical separation counts 3× so lights on the anchor's own floor win over the floor
        // above/below at a similar plan distance.
        const dist = order.map((i) => {
          const p = this.managedPointLights[i]!.worldPos;
          const dx = p.x - anchorPos.x;
          const dy = (p.y - anchorPos.y) * BUDGET_VERTICAL_WEIGHT;
          const dz = p.z - anchorPos.z;
          return dx * dx + dy * dy + dz * dz;
        });
        // Stable sort by distance to the anchor room; ties keep registration order.
        order.sort((a, b) => dist[a]! - dist[b]! || a - b);
      }
      const keys = this.computeBudgetGroupKeys();
      const isOn = order.map(() => false);
      for (let i = 0; i < n; i++) isOn[i] = this.isManagedLightOn(i);

      const picked: number[] = [];
      const pickedSet = new Set<number>();
      const seenGroups = new Set<string>();
      // KNX circuits the user switched on outrank always-on standalone ambience; among KNX
      // circuits the most recently switched-on go first (ties: nearest to the anchor).
      const recency = (i: number): number => this.budgetGroupActivation.get(keys[i]!) ?? 0;
      const knxOrder = [...order].sort((a, b) => recency(b) - recency(a));
      // The circuit switched on last keeps every one of its lights (it is what the user is
      // looking at); with ≤ 3 lights per circuit this costs at most a couple of slots.
      const newestKey = this.budgetActivationCounter > 0 ? keys[knxOrder[0] ?? -1] : undefined;
      if (newestKey !== undefined && recency(knxOrder[0]!) > 0) {
        for (const i of knxOrder) {
          if (keys[i] !== newestKey || !isOn[i]) continue;
          picked.push(i);
          pickedSet.add(i);
        }
        seenGroups.add(newestKey);
      }
      for (const knxPass of [true, false]) {
        for (const i of knxPass ? knxOrder : order) {
          const key = keys[i]!;
          if (!isOn[i] || seenGroups.has(key) || key.startsWith('circuit:') !== knxPass) continue;
          seenGroups.add(key);
          picked.push(i);
          pickedSet.add(i);
        }
      }
      for (const i of order) {
        if (isOn[i] && !pickedSet.has(i)) {
          picked.push(i);
          pickedSet.add(i);
        }
      }
      for (const i of order) {
        if (!pickedSet.has(i)) {
          picked.push(i);
          pickedSet.add(i);
        }
      }

      nextTargets.fill(0);
      const onTotal = new Map<string, number>();
      const onActive = new Map<string, number>();
      for (let k = 0; k < n; k++) {
        const i = picked[k]!;
        if (k < budget) nextTargets[i] = 1;
        if (!isOn[i]) continue;
        const key = keys[i]!;
        onTotal.set(key, (onTotal.get(key) ?? 0) + 1);
        if (k < budget) onActive.set(key, (onActive.get(key) ?? 0) + 1);
      }
      for (let i = 0; i < n; i++) {
        if (nextTargets[i] !== 1 || !isOn[i]) continue;
        const key = keys[i]!;
        const total = onTotal.get(key) ?? 1;
        const active = onActive.get(key) ?? 1;
        if (active < total) nextTargets[i] = Math.min(BUDGET_MAX_BOOST, total / active);
      }
    }
    let changed = false;
    for (let i = 0; i < n; i++) {
      if (this.budgetTargets[i] !== nextTargets[i]) {
        this.budgetTargets[i] = nextTargets[i]!;
        changed = true;
      }
    }
    return changed;
  }

  /** Bumps the activation stamp of every budget group with a light that just went OFF → ON. */
  private stampSwitchedOnGroups(prevKey: string, nextKey: string): void {
    let groupKeys: string[] | null = null;
    for (let i = 0; i < nextKey.length; i++) {
      if (nextKey[i] !== '1' || prevKey[i] === '1') continue;
      groupKeys ??= this.computeBudgetGroupKeys();
      const key = groupKeys[i]!;
      if (key.startsWith('circuit:')) this.budgetGroupActivation.set(key, ++this.budgetActivationCounter);
    }
  }

  private isManagedLightOn(i: number): boolean {
    const entry = this.managedPointLights[i];
    return entry !== undefined && this.getManagedLightTargetIntensity(entry) > 1e-4;
  }

  /** One char per managed light: '1' when ON. Budget targets are recomputed when it changes. */
  private computeBudgetActivityKey(): string {
    let key = '';
    for (let i = 0; i < this.managedPointLights.length; i++) key += this.isManagedLightOn(i) ? '1' : '0';
    return key;
  }

  /**
   * Room/circuit grouping used by the one-light-per-room pass: the KNX circuit id for circuit
   * lights; the `<building>.<room>` name prefix (or a 6 m cell) for standalone lights.
   */
  private computeBudgetGroupKeys(): string[] {
    const circuitByLight = new Map<THREE.Light, string>();
    for (const [circuitId, grp] of Object.entries(this.options.lightGroups)) {
      if (!grp) continue;
      for (const l of grp.lights) circuitByLight.set(l, circuitId);
    }
    return this.managedPointLights.map((entry) => {
      const circuitId = circuitByLight.get(entry.light);
      if (circuitId) return `circuit:${circuitId}`;
      const parts = entry.light.name.split('.');
      if (parts.length >= 3) return `room:${parts[0]}.${parts[1]}`;
      return `cell:${entry.isFirstFloor ? 1 : 0}:${Math.floor(entry.worldPos.x / 6)}:${Math.floor(entry.worldPos.z / 6)}`;
    });
  }

  /**
   * Advances budget fades (~250 ms) and writes the resulting intensities. Re-evaluates the active
   * set whenever a light is switched on/off (KNX), never on camera movement.
   * Returns true while any light intensity changed this step (caller should re-render).
   */
  public stepFades(dtSeconds: number): boolean {
    const n = this.managedPointLights.length;
    if (n === 0) return false;
    if (Number.isFinite(this.pointLightBudget) && this.computeBudgetActivityKey() !== this.budgetActivityKey) {
      this.recomputeBudgetTargets();
    }
    const baseStep = dtSeconds > 0 ? dtSeconds / POINT_LIGHT_BUDGET_FADE_S : Number.POSITIVE_INFINITY;
    let anyWeightChanged = false;
    for (let i = 0; i < n; i++) {
      const cur = this.budgetWeights[i] ?? 1;
      const target = this.budgetTargets[i] ?? 1;
      if (cur === target) continue;
      // Scale by the larger endpoint so boosted (>1) targets still fade in ~250 ms.
      const step = baseStep * Math.max(1, cur, target);
      const next = target > cur ? Math.min(target, cur + step) : Math.max(target, cur - step);
      this.budgetWeights[i] = next;
      const light = this.managedPointLights[i]!.light;
      light.userData = { ...light.userData, [POINT_LIGHT_BUDGET_WEIGHT_KEY]: next };
      anyWeightChanged = true;
    }
    if (!anyWeightChanged) return false;
    return this.applyManagedLightIntensities();
  }

  /** True while any managed light is still fading toward its budget target. */
  public hasPendingFades(): boolean {
    for (let i = 0; i < this.managedPointLights.length; i++) {
      if ((this.budgetWeights[i] ?? 1) !== (this.budgetTargets[i] ?? 1)) return true;
    }
    return false;
  }

  public constructor(options: SceneBatchOptimizerOptions) {
    this.options = options;
    levelChangeListeners.set(options.lightGroups, () => this.handleCircuitLevelsChanged());
  }

  /**
   * Re-ranks the budget right after a KNX level change. Lights that were OFF before and are now
   * inside the budget snap straight to their target weight (they were dark, so there is no pop);
   * lights losing their slot still fade out via `stepFades`.
   */
  private handleCircuitLevelsChanged(): void {
    if (!Number.isFinite(this.pointLightBudget) || this.managedPointLights.length === 0) return;
    const prevKey = this.budgetActivityKey;
    if (this.computeBudgetActivityKey() === prevKey) return;
    this.recomputeBudgetTargets();
    for (let i = 0; i < this.managedPointLights.length; i++) {
      const wasOn = prevKey[i] === '1';
      if (wasOn || !this.isManagedLightOn(i)) continue;
      const target = this.budgetTargets[i] ?? 1;
      this.budgetWeights[i] = target;
      const light = this.managedPointLights[i]!.light;
      light.userData = { ...light.userData, [POINT_LIGHT_BUDGET_WEIGHT_KEY]: target };
    }
    this.applyManagedLightIntensities();
  }

  public getManagedPointLights(): readonly ManagedPointLightEntry[] {
    return this.managedPointLights;
  }

  private snapshotParentChildren(parent: THREE.Object3D): void {
    if (!this.originalChildrenByParent.has(parent)) {
      this.originalChildrenByParent.set(parent, [...parent.children]);
    }
  }

  /**
   * Restores all merged `THREE.Mesh` batches back to their original individual `THREE.Mesh` nodes
   * in their exact original `parent.children` order and with their original materials and lights.
   */
  public unbatchAll(): void {
    if (!this.isCurrentlyBatched) return;

    this.options.onBeforeBatchChange?.();
    const { lodController, interactiveMeshes, onAfterBatchChange } = this.options;
    lodController.clearRuntimeDistanceObjects();
    if (this.allRegisteredBatchMeshes.size > 0) {
      lodController.removeBatchedObjects(this.allRegisteredBatchMeshes);
      this.allRegisteredBatchMeshes.clear();
    }

    for (let i = this.batchRecords.length - 1; i >= 0; i--) {
      const rec = this.batchRecords[i]!;
      for (const merged of rec.mergedMeshes) {
        rec.parent.remove(merged);
        merged.geometry.dispose();
      }
      for (const { mesh, meshParent } of rec.originalMeshes) {
        meshParent.add(mesh);
      }
    }

    for (const [parent, origChildren] of this.originalChildrenByParent.entries()) {
      for (const child of origChildren) {
        if (child.parent !== parent) {
          parent.add(child);
        }
      }
      parent.children.length = 0;
      parent.children.push(...origChildren);
    }

    for (const [mesh, props] of this.originalMeshProps.entries()) {
      mesh.material = props.material;
      mesh.castShadow = props.castShadow;
    }

    if (this.originalInteractiveMeshes !== null) {
      interactiveMeshes.length = 0;
      interactiveMeshes.push(...this.originalInteractiveMeshes);
      this.originalInteractiveMeshes = null;
    }

    for (let i = this.originalLightRecords.length - 1; i >= 0; i--) {
      const rec = this.originalLightRecords[i]!;
      if (rec.light.parent !== rec.originalParent) {
        rec.originalParent.add(rec.light);
      }
      rec.light.position.copy(rec.originalPosition);
      rec.light.visible = rec.originalVisible;
      // KNX lights keep their live dimmer level (not the stale level captured at optimize time).
      const knxTarget = rec.light.userData?.knxTargetIntensity;
      rec.light.intensity = typeof knxTarget === 'number' ? knxTarget : rec.originalIntensity;
      rec.light.distance = rec.originalDistance;
      if (rec.light.userData) {
        delete rec.light.userData[POINT_LIGHT_BUDGET_WEIGHT_KEY];
      }
    }

    this.batchRecords.length = 0;
    this.originalChildrenByParent.clear();
    this.originalMeshProps.clear();
    this.originalLightRecords.length = 0;
    this.managedPointLights.length = 0;
    this.budgetWeights.length = 0;
    this.budgetTargets.length = 0;
    this.isCurrentlyBatched = false;
    this.extraLodBound = false;

    // Re-index scene hierarchy for RoomLodController and CutawayController
    lodController.indexBuiltSceneHierarchy([
      this.options.layers.scene,
      this.options.layers.firstFloorMeshGroup,
    ]);
    onAfterBatchChange?.();
  }

  /**
   * Deduplicates identical static materials, binds unindexed heavy room assemblies to `RoomLodController`,
   * disables shadow casting on small clutter/foliage/high-LOD props, consolidates redundant PointLights,
   * and merges static opaque meshes across container subtrees by spatial cell and material.
   */
  public optimize(): void {
    if (this.isCurrentlyBatched) {
      this.unbatchAll();
    }
    this.options.onBeforeBatchChange?.();

    const { layers, lodController, interactiveMeshes, onAfterBatchChange } = this.options;
    const {
      scene,
      firstFloorMeshGroup,
      groundFloorCeilingGroup,
      ceilingMeshGroup,
      cutawayWallGroups,
    } = layers;

    scene.updateMatrixWorld(true);
    lodController.clearRuntimeDistanceObjects();
    this.allRegisteredBatchMeshes.clear();

    // 1. Register heavy interior room assemblies that were skipped during initial LOD indexing
    if (!this.extraLodBound) {
      this.bindAdditionalInteriorLodGroups();
      this.extraLodBound = true;
    }

    // 2. Snapshot original interactiveMeshes so we can replace batched static interactive meshes cleanly
    this.originalInteractiveMeshes = [...interactiveMeshes];
    const interactiveSet = new Set<THREE.Object3D>(interactiveMeshes);

    // 3. Collect strictly dynamic/animated objects and mutable materials that must NEVER be merged across groups
    const protectedObjects = this.collectProtectedObjects();
    const mutableMaterials = this.collectMutableMaterials();

    // 4. Deduplicate identical static materials and cull shadow casting on small/foliage/micro-detail meshes
    this.deduplicateMaterialsAndCullSmallShadows(scene, mutableMaterials);

    // 5. Identify visibility root containers:
    //    - Top-level floor/ceiling/cutaway layer groups
    //    - Any intermediate Group that has `cutawayWall` / `isCutawayWall` or `ufhZoneId`
    const topContainers = new Set<THREE.Object3D>([
      scene,
      firstFloorMeshGroup,
      groundFloorCeilingGroup,
      ceilingMeshGroup,
      cutawayWallGroups.southWest,
      cutawayWallGroups.west,
      cutawayWallGroups.north,
      cutawayWallGroups.east,
    ]);

    const subContainers: THREE.Object3D[] = [];
    scene.traverse((obj) => {
      if (obj instanceof THREE.Group && !topContainers.has(obj) && !protectedObjects.has(obj)) {
        const u = obj.userData;
        if (u?.ufhZoneId) {
          topContainers.add(obj);
          subContainers.push(obj);
        }
      }
    });

    const batchedOriginalMeshes = new Set<THREE.Object3D>();
    const newInteractiveMeshes: THREE.Object3D[] = [];

    // 6. Batch across each container subtree
    const allContainers = [
      scene,
      firstFloorMeshGroup,
      groundFloorCeilingGroup,
      ceilingMeshGroup,
      cutawayWallGroups.southWest,
      cutawayWallGroups.west,
      cutawayWallGroups.north,
      cutawayWallGroups.east,
      ...subContainers,
    ];

    for (const container of allContainers) {
      this.batchContainerSubtree(
        container,
        topContainers,
        protectedObjects,
        mutableMaterials,
        interactiveSet,
        batchedOriginalMeshes,
        newInteractiveMeshes,
        lodController
      );
    }

    // 7. Also batch inside rigid-body sliding drawer groups and static toggle roots
    this.batchRigidDynamicGroups(
      scene,
      interactiveSet,
      batchedOriginalMeshes,
      newInteractiveMeshes,
      mutableMaterials
    );

    // 8. Sync `interactiveMeshes`: keep unbatched interactive meshes + append merged interactive batch meshes,
    //    excluding ultra-high-poly decorative sub-meshes (5,844-vert golf club iron blades and 6,096-vert inner
    //    treadmill tube cores) whose parent interactable already has primary low-poly clickable targets.
    const updatedInteractive: THREE.Object3D[] = [];
    for (const obj of interactiveMeshes) {
      if (batchedOriginalMeshes.has(obj)) continue;
      if (
        obj instanceof THREE.Mesh &&
        (obj.name === 'outbuildings.barn.golfSimulator.callawayTourBag.iron' ||
          obj.name === 'outbuildings.barn.golfSimulator.hittingStrip.activeClub.headBlade' ||
          obj.name === 'outbuildings.gym.technogymRunPersonal.polishedFrame' ||
          obj.name.startsWith('outbuildings.gym.technogymRunPersonal.polishedFrameInnerCore'))
      ) {
        continue;
      }
      updatedInteractive.push(obj);
    }
    for (const merged of newInteractiveMeshes) {
      updatedInteractive.push(merged);
    }
    interactiveMeshes.length = 0;
    interactiveMeshes.push(...updatedInteractive);

    // 9. Remove batched original meshes from RoomLodController so it only iterates live objects
    if (batchedOriginalMeshes.size > 0) {
      lodController.removeBatchedObjects(batchedOriginalMeshes);
    }

    // 10. Consolidate redundant standalone PointLights and hoist 1F PointLights to prevent shader recompilations
    this.consolidateAndHoistPointLights(scene, firstFloorMeshGroup);
    this.budgetWeights.length = 0;
    this.budgetTargets.length = 0;
    this.recomputeBudgetTargets();
    for (let i = 0; i < this.managedPointLights.length; i++) {
      // Lights start at their budget target (no fade-in on load / re-batch).
      const w = this.budgetTargets[i] ?? 1;
      this.budgetWeights[i] = w;
      const light = this.managedPointLights[i]!.light;
      light.userData = { ...light.userData, [POINT_LIGHT_BUDGET_WEIGHT_KEY]: w };
    }

    this.isCurrentlyBatched = true;
    this.applyManagedLightIntensities();
    onAfterBatchChange?.();
  }

  private bindAdditionalInteriorLodGroups(): void {
    const { layers, lodController } = this.options;
    const explicitGroupZones: ReadonlyArray<readonly [string, RoomZoneId, 1 | 2]> = [
      ['hall.understairsManifold', 'hall', 1],
      ['bootLobby.wineCellar.wineCooler', 'bootLobby', 1],
      ['island.wineCooler', 'kitchen', 1],
      ['study.viessmannBoiler.1', 'study', 1],
      ['study.viessmannBoiler.2', 'study', 1],
      ['plantRoom.electricalDistribution', 'study', 1],
    ];

    for (const [name, zoneId, tier] of explicitGroupZones) {
      const obj = layers.scene.getObjectByName(name);
      if (obj && obj.userData?.lodTier === undefined) {
        lodController.registerObjectWithTier(zoneId, obj, tier);
      }
    }

    layers.scene.traverse((obj) => {
      if (
        obj instanceof THREE.Group &&
        obj.name === 'westBayWindow.curtainsAndPole' &&
        obj.userData?.lodTier === undefined
      ) {
        const box = new THREE.Box3().setFromObject(obj);
        const centerZ = (box.min.z + box.max.z) * 0.5;
        const zoneId: RoomZoneId = centerZ > 2.5 ? 'sittingRoom' : 'livingRoom';
        lodController.registerObjectWithTier(zoneId, obj, 1);
      }
    });
  }

  /**
   * Collects objects that actually move/animate at runtime or are dynamically toggled by overlays.
   * Static clickable objects (such as the static dining table base/chairs, static light fixture
   * housings, and static UFH manifold parts) are NOT excluded here so they can be merged by
   * matching interactive signature while keeping `interactiveMeshes` intact.
   */
  private collectProtectedObjects(): Set<THREE.Object3D> {
    const { layers, bifoldPanels, getDynamicObjects } = this.options;
    const protectedSet = getDynamicObjects();

    const markSubtree = (root: THREE.Object3D): void => {
      root.traverse((node) => protectedSet.add(node));
    };

    for (const panel of bifoldPanels) {
      markSubtree(panel.group);
    }

    layers.scene.traverse((obj) => {
      const u = obj.userData;
      if (!u) return;
      if (
        u.isBifoldDoor ||
        u.isCarGate ||
        u.isUniFiCamera ||
        u.isUniFiAccessReader ||
        u.isUniFiAp ||
        u.isFrameTV ||
        u.isAnnotationGroup ||
        u.isSecurityFovCone ||
        u.doorRole === 'pivot' ||
        u.bifoldRole !== undefined ||
        u.drawerRole === 'group' ||
        u.pulleyMaidRole !== undefined
      ) {
        markSubtree(obj);
      }
    });

    return protectedSet;
  }

  private collectMutableMaterials(): Set<THREE.Material> {
    const { lightGroups, indicatorMats, roomSwitchLedMats } = this.options;
    const set = new Set<THREE.Material>();

    for (const grp of Object.values(lightGroups)) {
      if (!grp) continue;
      for (const m of grp.emissives) set.add(m);
      for (const m of grp.cones) set.add(m);
      for (const p of grp.pools) set.add(p.mat);
    }
    for (const m of Object.values(indicatorMats)) {
      if (m instanceof THREE.Material) set.add(m);
    }
    for (const b of roomSwitchLedMats) {
      set.add(b.mat);
    }
    return set;
  }

  private isClosedSolidGeometry(geo: THREE.BufferGeometry): boolean {
    const gType = geo.type;
    if (
      gType === 'BoxGeometry' ||
      gType === 'RoundedBoxGeometry' ||
      gType === 'IcosahedronGeometry' ||
      gType === 'TorusGeometry' ||
      gType === 'TubeGeometry' ||
      gType === 'ExtrudeGeometry'
    ) {
      return true;
    }
    if (gType === 'CylinderGeometry' || gType === 'ConeGeometry') {
      const params = (geo as THREE.CylinderGeometry).parameters;
      return !params?.openEnded;
    }
    if (gType === 'SphereGeometry') {
      const params = (geo as THREE.SphereGeometry).parameters;
      const phiLength = params?.phiLength ?? Math.PI * 2;
      const thetaLength = params?.thetaLength ?? Math.PI;
      return phiLength >= Math.PI * 1.99 && thetaLength >= Math.PI * 0.99;
    }
    return false;
  }

  private deduplicateMaterialsAndCullSmallShadows(
    scene: THREE.Scene,
    mutableMaterials: ReadonlySet<THREE.Material>
  ): void {
    const canonicalBySig = new Map<string, THREE.Material>();
    const imageIdMap = new Map<object, number>();
    const canonicalTexBySig = new Map<string, THREE.Texture>();
    let nextImgId = 1;

    const getCanonicalTex = (tex: THREE.Texture | null | undefined): THREE.Texture | null => {
      if (!tex) return null;
      const img = tex.image as object | undefined;
      if (!img || typeof img !== 'object') return tex;
      let imgId = imageIdMap.get(img);
      if (imgId === undefined) {
        imgId = nextImgId++;
        imageIdMap.set(img, imgId);
      }
      const sig = `${imgId}|${tex.repeat.x.toFixed(4)}|${tex.repeat.y.toFixed(4)}|${tex.offset.x.toFixed(4)}|${tex.offset.y.toFixed(4)}|${tex.rotation.toFixed(4)}|${tex.wrapS}|${tex.wrapT}|${tex.colorSpace}`;
      let canon = canonicalTexBySig.get(sig);
      if (!canon) {
        canon = tex;
        canonicalTexBySig.set(sig, canon);
      }
      return canon;
    };

    const visit = (node: THREE.Object3D, ancestorHighLod: boolean, ancestorLeafOrPlant: boolean): void => {
      const u = node.userData;
      const isHighLod =
        ancestorHighLod || u?.lodTier === 2 || u?.lodTier === 'high';
      const isLeafOrPlant =
        ancestorLeafOrPlant ||
        (typeof node.name === 'string' && LEAF_OR_MICRO_SHADOW_EXCLUDE_RE.test(node.name));

      if (node.userData?.[SHADOW_PASS_HOOK_FLAG]) return;

      if (node instanceof THREE.Mesh) {
        if (!this.originalMeshProps.has(node)) {
          this.originalMeshProps.set(node, {
            material: node.material,
            castShadow: node.castShadow,
          });
        }
        if (!node.geometry.boundingBox) {
          node.geometry.computeBoundingBox();
        }
        if (!node.geometry.boundingSphere) {
          node.geometry.computeBoundingSphere();
        }

        if (node.castShadow) {
          if (isHighLod || isLeafOrPlant) {
            node.castShadow = false;
          } else {
            if (!node.geometry.boundingSphere) {
              node.geometry.computeBoundingSphere();
            }
            const sphere = node.geometry.boundingSphere;
            if (sphere) {
              const maxScale = Math.max(
                Math.abs(node.scale.x),
                Math.abs(node.scale.y),
                Math.abs(node.scale.z)
              );
              const isArch =
                Boolean(u?.isArchitecturalShell) ||
                Boolean(u?.cutawayWall) ||
                Boolean(u?.isCutawayWall);
              const minShadowRadius = isArch ? 0.22 : 0.42;
              if (sphere.radius * maxScale < minShadowRadius) {
                node.castShadow = false;
              }
            }
          }
        }

        if (!Array.isArray(node.material) && node.material) {
          const mat = node.material as THREE.MeshStandardMaterial;
          if (mat.blending === THREE.AdditiveBlending && mat.depthWrite === false) {
            node.raycast = (): void => {};
          }
          const matU = mat.userData as Record<string, unknown> | undefined;
          const isDynamicMat =
            mutableMaterials.has(mat) ||
            Boolean(matU?.isDynamicGolfBagMaterial) ||
            Boolean(matU?.isDynamicGolfScreen) ||
            Boolean(matU?.isDynamicGolfStatusLight) ||
            matU?.cutawayLightOpacity !== undefined;

          if (!isDynamicMat) {
            const map = getCanonicalTex(mat.map);
            const normalMap = getCanonicalTex(mat.normalMap);
            const roughnessMap = getCanonicalTex(mat.roughnessMap);
            const bumpMap = getCanonicalTex(mat.bumpMap);
            const alphaMap = getCanonicalTex(mat.alphaMap);
            const emissiveMap = getCanonicalTex(mat.emissiveMap);

            if (map && mat.map !== map) mat.map = map;
            if (normalMap && mat.normalMap !== normalMap) mat.normalMap = normalMap;
            if (roughnessMap && mat.roughnessMap !== roughnessMap) mat.roughnessMap = roughnessMap;
            if (bumpMap && mat.bumpMap !== bumpMap) mat.bumpMap = bumpMap;
            if (alphaMap && mat.alphaMap !== alphaMap) mat.alphaMap = alphaMap;
            if (emissiveMap && mat.emissiveMap !== emissiveMap) mat.emissiveMap = emissiveMap;

            // Enable hardware backface culling (THREE.FrontSide) on closed 3D solid geometries
            // that unnecessarily inherited a THREE.DoubleSide material.
            const targetSide =
              mat.side === THREE.DoubleSide &&
              !mat.transparent &&
              this.isClosedSolidGeometry(node.geometry)
                ? THREE.FrontSide
                : mat.side;

            const qRough = Math.round((mat.roughness ?? 0.5) * 50) / 50;
            const qMetal = Math.round((mat.metalness ?? 0) * 50) / 50;

            const sig = [
              mat.type,
              mat.color?.getHexString?.() ?? '',
              mat.emissive?.getHexString?.() ?? '',
              (mat.emissiveIntensity ?? 0).toFixed(2),
              qRough.toFixed(2),
              qMetal.toFixed(2),
              (mat.bumpScale ?? 0).toFixed(3),
              (mat.opacity ?? 1).toFixed(2),
              mat.transparent ? '1' : '0',
              targetSide,
              mat.depthWrite ? '1' : '0',
              mat.polygonOffset ? '1' : '0',
              map?.uuid ?? '',
              normalMap?.uuid ?? '',
              roughnessMap?.uuid ?? '',
              bumpMap?.uuid ?? '',
              alphaMap?.uuid ?? '',
              emissiveMap?.uuid ?? '',
            ].join('|');

            let existing = canonicalBySig.get(sig);
            if (!existing) {
              if (mat.side !== targetSide) {
                const cloned = mat.clone();
                cloned.side = targetSide;
                existing = cloned;
              } else {
                existing = mat;
              }
              canonicalBySig.set(sig, existing);
            }
            node.material = existing;
          }
        }
      }

      for (const child of node.children) {
        visit(child, isHighLod, isLeafOrPlant);
      }
    };

    visit(scene, false, false);
  }

  private isBatchableMesh(
    mesh: THREE.Mesh,
    protectedObjects: ReadonlySet<THREE.Object3D>,
    mutableMaterials: ReadonlySet<THREE.Material>
  ): boolean {
    if (!mesh.visible) return false;
    if (mesh.userData?.[SHADOW_PASS_HOOK_FLAG]) return false;
    if (protectedObjects.has(mesh)) return false;
    if (mesh.userData?.isGolfSimulatorDynamic) return false;
    if (mesh.children.length > 0) return false;
    if (Array.isArray(mesh.material) || !mesh.material) return false;
    if (
      mutableMaterials.has(mesh.material) ||
      mesh.material.userData?.isDynamicGolfBagMaterial ||
      mesh.material.userData?.isDynamicGolfScreen ||
      mesh.material.userData?.isDynamicGolfStatusLight ||
      mesh.material.userData?.cutawayLightOpacity !== undefined
    ) {
      return false;
    }
    const posAttr = mesh.geometry.getAttribute('position');
    if (!posAttr || posAttr.count === 0) return false;
    return true;
  }

  private buildInteractiveKey(u: Record<string, unknown> | undefined, isInteractive: boolean): string {
    if (!isInteractive && !u?.circuitId && !u?.interactableId && !u?.ufhZoneId && !u?.applianceId) {
      return '';
    }
    if (!u) return 'int';
    return [
      isInteractive ? '1' : '0',
      (u.interactableId as string | undefined) ?? '',
      (u.circuitId as string | undefined) ?? '',
      (u.ufhZoneId as string | undefined) ?? '',
      (u.applianceId as string | undefined) ?? '',
      (u.switchPa as string | undefined) ?? '',
      (u.roomMotionSensorId as string | undefined) ?? '',
      u.isClimbableLadder ? 'L' : '',
      u.isKNXSwitch ? 'K' : '',
      u.isKnxTempSensor ? 'T' : '',
      u.isCourtyardSwitch ? 'C' : '',
      u.isUtilitySwitch ? 'U' : '',
      u.isKitchenMotionSensor ? 'M' : '',
      u.isUtilityMotionSensor ? 'N' : '',
    ].join(':');
  }

  private batchContainerSubtree(
    container: THREE.Object3D,
    topContainers: ReadonlySet<THREE.Object3D>,
    protectedObjects: ReadonlySet<THREE.Object3D>,
    mutableMaterials: ReadonlySet<THREE.Material>,
    interactiveSet: ReadonlySet<THREE.Object3D>,
    batchedOriginalMeshes: Set<THREE.Object3D>,
    newInteractiveMeshes: THREE.Object3D[],
    lodController: RoomLodController
  ): void {
    interface CutawaySpec {
      readonly floor: 'ground' | 'first';
      readonly axis: 'x' | 'z';
      readonly coord: number;
      readonly minSpan: number;
      readonly maxSpan: number;
      readonly outwardSide?: 'north' | 'south' | 'east' | 'west';
      readonly includeInFirstFloorCutaway?: boolean;
    }

    interface BucketItem {
      readonly mesh: THREE.Mesh;
      readonly meshParent: THREE.Object3D;
      readonly lodTier: 1 | 2 | undefined;
      readonly zoneId: RoomZoneId | undefined;
      readonly runtimeMaxDist: number;
      readonly isInteractive: boolean;
      readonly inheritedUserData: Record<string, unknown>;
      readonly groupPrefix: string;
      readonly cutawayWall: CutawaySpec | undefined;
      readonly offsetX: number;
      readonly offsetZ: number;
      readonly rotationY: number;
    }

    const buckets = new Map<string, BucketItem[]>();
    const worldCenter = new THREE.Vector3();

    const rootU = container.userData as Record<string, unknown> | undefined;
    const rootTier =
      rootU?.lodTier === 1 || rootU?.lodTier === 2 ? (rootU.lodTier as 1 | 2) : undefined;
    const rootZone = (rootU?.zoneId ?? rootU?.zone) as RoomZoneId | undefined;

    let baseOffsetX = 0;
    let baseOffsetZ = 0;
    let baseRotY = 0;
    let anc: THREE.Object3D | null = container;
    while (anc) {
      const cOff = anc.userData?.containerOffset as readonly [number, number, number] | undefined;
      if (cOff) {
        baseOffsetX += cOff[0];
        baseOffsetZ += cOff[2];
      }
      const cRot = anc.userData?.containerRotationY as number | undefined;
      if (typeof cRot === 'number') {
        baseRotY += cRot;
      }
      anc = anc.parent;
    }

    const visit = (
      node: THREE.Object3D,
      inheritedTier: 1 | 2 | undefined,
      inheritedZone: RoomZoneId | undefined,
      inheritedRuntimeMaxDist: number,
      inheritedUserData: Record<string, unknown>,
      groupPrefix: string,
      inheritedCutaway: CutawaySpec | undefined,
      offsetX: number,
      offsetZ: number,
      rotationY: number
    ): void => {
      if (!node.visible || protectedObjects.has(node)) return;
      if (node !== container && topContainers.has(node)) return;

      const u = (node.userData ?? {}) as Record<string, unknown>;
      let nextOffsetX = offsetX;
      let nextOffsetZ = offsetZ;
      let nextRotY = rotationY;
      if (node !== container) {
        const cOff = u.containerOffset as readonly [number, number, number] | undefined;
        if (cOff) {
          nextOffsetX += cOff[0];
          nextOffsetZ += cOff[2];
        }
        const cRot = u.containerRotationY as number | undefined;
        if (typeof cRot === 'number') {
          nextRotY += cRot;
        }
      }

      const nextCutaway = (u.cutawayWall as CutawaySpec | undefined) ?? inheritedCutaway;

      let nextTier: 1 | 2 | undefined =
        u.lodTier === 1 || u.lodTier === 2 ? (u.lodTier as 1 | 2) : inheritedTier;
      const nextZone: RoomZoneId | undefined =
        ((u.zoneId ?? u.zone) as RoomZoneId | undefined) ?? inheritedZone;

      const isLightingNode =
        u.circuitId !== undefined ||
        Boolean(u.isFittingFx) ||
        Boolean(u.isLightGlowPool) ||
        (node instanceof THREE.Mesh &&
          (Array.isArray(node.material)
            ? node.material.some((m) => mutableMaterials.has(m))
            : mutableMaterials.has(node.material)));
      if (isLightingNode) {
        nextTier = undefined;
      }
      let nextRuntimeMaxDist = isLightingNode ? 0 : inheritedRuntimeMaxDist;
      if (!isLightingNode && (u.lodTier === 'high' || nextTier === 2)) {
        nextRuntimeMaxDist = 28;
      }

      let nextUserData = inheritedUserData;
      if (
        u.interactableId !== undefined ||
        u.circuitId !== undefined ||
        u.ufhZoneId !== undefined ||
        u.applianceId !== undefined ||
        u.switchPa !== undefined ||
        u.roomMotionSensorId !== undefined ||
        u.isClimbableLadder !== undefined ||
        u.isKNXSwitch !== undefined ||
        u.isKnxTempSensor !== undefined ||
        u.isCourtyardSwitch !== undefined ||
        u.isUtilitySwitch !== undefined ||
        u.isKitchenMotionSensor !== undefined ||
        u.isUtilityMotionSensor !== undefined
      ) {
        nextUserData = { ...inheritedUserData, ...u };
      }

      const nextPrefix =
        node !== container && typeof node.name === 'string' && node.name.length > 0 && !groupPrefix
          ? node.name.split('.').slice(0, 2).join('.')
          : groupPrefix;

      if (node instanceof THREE.Mesh) {
        if (this.isBatchableMesh(node, protectedObjects, mutableMaterials) && node.parent) {
          if (!node.geometry.boundingSphere) {
            node.geometry.computeBoundingSphere();
          }
          const sphere = node.geometry.boundingSphere;
          const maxScale = Math.max(
            Math.abs(node.scale.x),
            Math.abs(node.scale.y),
            Math.abs(node.scale.z)
          );
          // Skip merging huge architectural floor/roof/lawn slabs (> 8.5m radius)
          if (!sphere || sphere.radius * maxScale <= 8.5) {
            if (sphere) {
              worldCenter.copy(sphere.center).applyMatrix4(node.matrixWorld);
            } else {
              worldCenter.setFromMatrixPosition(node.matrixWorld);
            }

            const isInteractive =
              interactiveSet.has(node) ||
              Boolean(nextUserData.interactableId) ||
              Boolean(nextUserData.circuitId) ||
              Boolean(nextUserData.applianceId) ||
              Boolean(nextUserData.isClimbableLadder);

            const cutKey = nextCutaway
              ? `cut:${nextCutaway.floor}:${nextCutaway.axis}:${Math.round(nextCutaway.coord * 10)}:${nextCutaway.outwardSide ?? ''}:${nextCutaway.includeInFirstFloorCutaway ? 1 : 0}:${Math.round(nextOffsetX * 10)}:${Math.round(nextOffsetZ * 10)}:${Math.round(nextRotY * 100)}:${Math.floor(((nextCutaway.minSpan + nextCutaway.maxSpan) * 0.5) / 5.0)}`
              : '';

            // Coarse spatial bucketing (16m cells) keeps frustum & distance culling granular while maximizing batch sizes
            const cellKey = cutKey
              ? cutKey
              : nextZone && nextRuntimeMaxDist === 0
                ? nextZone
                : `${Math.floor(worldCenter.x / 16.0)}:${Math.floor(worldCenter.z / 16.0)}`;
            const mat = node.material as THREE.Material;
            const intKey = this.buildInteractiveKey(nextUserData, isInteractive);

            const key = `${mat.uuid}|${node.castShadow ? 1 : 0}|${nextRuntimeMaxDist}|${intKey}|${cellKey}|${tradeCategoryKey(node)}`;
            let list = buckets.get(key);
            if (!list) {
              list = [];
              buckets.set(key, list);
            }
            list.push({
              mesh: node,
              meshParent: node.parent,
              lodTier: nextTier,
              zoneId: nextZone,
              runtimeMaxDist: nextRuntimeMaxDist,
              isInteractive,
              inheritedUserData: nextUserData,
              groupPrefix: nextPrefix,
              cutawayWall: nextCutaway,
              offsetX: nextOffsetX,
              offsetZ: nextOffsetZ,
              rotationY: nextRotY,
            });
          }
        }
      }

      for (const child of node.children) {
        visit(
          child,
          nextTier,
          nextZone,
          nextRuntimeMaxDist,
          nextUserData,
          nextPrefix,
          nextCutaway,
          nextOffsetX,
          nextOffsetZ,
          nextRotY
        );
      }
    };

    visit(
      container,
      rootTier,
      rootZone,
      0,
      {},
      container.name || '',
      rootU?.cutawayWall as CutawaySpec | undefined,
      baseOffsetX,
      baseOffsetZ,
      baseRotY
    );

    // Coalesce buckets that share the same material + interaction key + cellKey when split only by castShadow
    const byMaterialAndCell = new Map<string, BucketItem[][]>();
    for (const list of buckets.values()) {
      const first = list[0]!;
      const mat = first.mesh.material as THREE.Material;
      const intKey = this.buildInteractiveKey(first.inheritedUserData, first.isInteractive);
      const cutKey = first.cutawayWall
        ? `cut:${first.cutawayWall.floor}:${first.cutawayWall.axis}:${Math.round(first.cutawayWall.coord * 10)}:${first.cutawayWall.outwardSide ?? ''}:${first.cutawayWall.includeInFirstFloorCutaway ? 1 : 0}:${Math.round(first.offsetX * 10)}:${Math.round(first.offsetZ * 10)}:${Math.round(first.rotationY * 100)}:${Math.floor(((first.cutawayWall.minSpan + first.cutawayWall.maxSpan) * 0.5) / 5.0)}`
        : '';
      const baseKey = `${mat.uuid}|${intKey}|${cutKey}|${first.zoneId ?? ''}|${tradeCategoryKey(first.mesh)}`;
      let groupLists = byMaterialAndCell.get(baseKey);
      if (!groupLists) {
        groupLists = [];
        byMaterialAndCell.set(baseKey, groupLists);
      }
      groupLists.push(list);
    }

    const finalBuckets: BucketItem[][] = [];
    for (const groupLists of byMaterialAndCell.values()) {
      if (groupLists.length === 1) {
        finalBuckets.push(groupLists[0]!);
        continue;
      }
      const multiLists: BucketItem[][] = [];
      const singletons: BucketItem[] = [];
      for (const l of groupLists) {
        if (l.length === 1) {
          singletons.push(l[0]!);
        } else {
          multiLists.push(l);
        }
      }
      if (singletons.length > 0) {
        if (multiLists.length > 0) {
          multiLists[0]!.push(...singletons);
        } else if (singletons.length >= 2) {
          multiLists.push(singletons);
        } else {
          multiLists.push(singletons);
        }
      }
      for (const l of multiLists) {
        finalBuckets.push(l);
      }
    }

    const invContainerWorld = container.matrixWorld.clone().invert();
    const relMatrix = new THREE.Matrix4();
    const originalMeshes: Array<{ readonly mesh: THREE.Mesh; readonly meshParent: THREE.Object3D }> = [];
    const mergedMeshes: THREE.Mesh[] = [];
    const tmpSphereCenter = new THREE.Vector3();

    for (const list of finalBuckets) {
      if (list.length < 2) {
        const single = list[0]!;
        if (single.runtimeMaxDist > 0 && single.lodTier === undefined) {
          const s = single.mesh.geometry.boundingSphere;
          if (s) {
            tmpSphereCenter.copy(s.center).applyMatrix4(single.mesh.matrixWorld);
          } else {
            tmpSphereCenter.setFromMatrixPosition(single.mesh.matrixWorld);
          }
          lodController.registerRuntimeDistanceObject(
            single.mesh,
            tmpSphereCenter.x,
            tmpSphereCenter.y,
            tmpSphereCenter.z,
            single.runtimeMaxDist,
            single.mesh.castShadow
          );
        }
        continue;
      }

      const firstItem = list[0]!;
      const template = firstItem.mesh;
      const mergedGeo = this.mergeMeshListFast(list, invContainerWorld, relMatrix);
      if (!mergedGeo) continue;

      let anyReceiveShadow = false;
      let anyCastShadow = false;
      for (let i = 0; i < list.length; i++) {
        if (list[i]!.mesh.receiveShadow) anyReceiveShadow = true;
        if (list[i]!.mesh.castShadow) anyCastShadow = true;
      }

      const mergedMesh = new THREE.Mesh(mergedGeo, template.material);
      accelerateMergedMeshRaycast(mergedMesh);
      const baseName = firstItem.groupPrefix || container.name || 'scene';
      mergedMesh.name = `${baseName}.batch`;
      mergedMesh.castShadow = anyCastShadow;
      mergedMesh.receiveShadow = anyReceiveShadow;

      let mergedCutaway: CutawaySpec | undefined;
      if (firstItem.cutawayWall) {
        let minS = firstItem.cutawayWall.minSpan;
        let maxS = firstItem.cutawayWall.maxSpan;
        for (let i = 1; i < list.length; i++) {
          const cw = list[i]!.cutawayWall;
          if (cw) {
            if (cw.minSpan < minS) minS = cw.minSpan;
            if (cw.maxSpan > maxS) maxS = cw.maxSpan;
          }
        }
        mergedCutaway = {
          ...firstItem.cutawayWall,
          minSpan: minS,
          maxSpan: maxS,
        };
      }

      const relOffX = firstItem.offsetX - baseOffsetX;
      const relOffZ = firstItem.offsetZ - baseOffsetZ;
      const relRotY = firstItem.rotationY - baseRotY;

      mergedMesh.userData = {
        ...container.userData,
        ...template.userData,
        ...firstItem.inheritedUserData,
        ...(firstItem.lodTier !== undefined ? { lodTier: firstItem.lodTier } : {}),
        ...(firstItem.zoneId !== undefined ? { zoneId: firstItem.zoneId } : {}),
        ...(mergedCutaway !== undefined ? { cutawayWall: mergedCutaway } : {}),
        ...(Math.abs(relOffX) > 1e-4 || Math.abs(relOffZ) > 1e-4
          ? { containerOffset: [relOffX, 0, relOffZ] }
          : {}),
        ...(Math.abs(relRotY) > 1e-4 ? { containerRotationY: relRotY } : {}),
        isBatchedStaticMesh: true,
      };

      if (firstItem.runtimeMaxDist > 0 && mergedGeo.boundingSphere) {
        tmpSphereCenter
          .copy(mergedGeo.boundingSphere.center)
          .applyMatrix4(container.matrixWorld);
        lodController.registerRuntimeDistanceObject(
          mergedMesh,
          tmpSphereCenter.x,
          tmpSphereCenter.y,
          tmpSphereCenter.z,
          firstItem.runtimeMaxDist,
          mergedMesh.castShadow
        );
      } else if (
        rootTier === undefined &&
        firstItem.zoneId &&
        (firstItem.lodTier === 1 || firstItem.lodTier === 2)
      ) {
        lodController.registerObjectWithTier(
          firstItem.zoneId,
          mergedMesh,
          firstItem.lodTier
        );
        this.allRegisteredBatchMeshes.add(mergedMesh);
      }

      if (firstItem.isInteractive) {
        newInteractiveMeshes.push(mergedMesh);
      }

      for (const item of list) {
        this.snapshotParentChildren(item.meshParent);
        item.meshParent.remove(item.mesh);
        originalMeshes.push({ mesh: item.mesh, meshParent: item.meshParent });
        batchedOriginalMeshes.add(item.mesh);
      }

      this.snapshotParentChildren(container);
      container.add(mergedMesh);
      mergedMesh.matrixWorld.copy(container.matrixWorld);
      mergedMeshes.push(mergedMesh);
    }

    if (mergedMeshes.length > 0) {
      this.batchRecords.push({
        parent: container,
        originalMeshes,
        mergedMeshes,
      });
    }
  }

  /**
   * Batches static child meshes inside rigid-body dynamic assemblies:
   * - Sliding drawers (`drawerRole === 'group'`, excluding fade-out golf bag materials)
   * - Hinged multi-panel doors (`doorRole === 'pivot'`)
   * - Bifold door leaves (`bifoldPanels[i].group`)
   * - Rigid dining-table sub-groups (`chair.*`, `placeSetting.*`, `extendedSeats`)
   */
  private batchRigidDynamicGroups(
    scene: THREE.Scene,
    interactiveSet: ReadonlySet<THREE.Object3D>,
    batchedOriginalMeshes: Set<THREE.Object3D>,
    newInteractiveMeshes: THREE.Object3D[],
    mutableMaterials: ReadonlySet<THREE.Material>
  ): void {
    const rigidRootsSet = new Set<THREE.Object3D>();
    for (const panel of this.options.bifoldPanels) {
      rigidRootsSet.add(panel.group);
    }

    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Group)) return;
      const u = obj.userData;
      if (u?.drawerRole === 'group' || u?.doorRole === 'pivot') {
        rigidRootsSet.add(obj);
      } else if (
        typeof obj.name === 'string' &&
        (obj.name.startsWith('familyRoom.neptuneWycombeDiningTable.chair.') ||
          obj.name.startsWith('familyRoom.neptuneWycombeDiningTable.placeSetting.') ||
          obj.name === 'familyRoom.neptuneWycombeDiningTable.extendedSeats' ||
          obj.name === 'outbuildings.gym.nikeSquatRack.barbell' ||
          obj.name === 'outbuildings.gym.nikeSquatRack.bench')
      ) {
        rigidRootsSet.add(obj);
      }
    });

    for (const root of rigidRootsSet) {
      const buckets = new Map<
        string,
        Array<{ readonly mesh: THREE.Mesh; readonly meshParent: THREE.Object3D; readonly isInteractive: boolean }>
      >();

      root.traverse((node) => {
        if (node !== root && rigidRootsSet.has(node)) return;
        if (!(node instanceof THREE.Mesh) || !node.visible || !node.parent) return;
        if (node.userData?.isGolfSimulatorDynamic) return;
        if (batchedOriginalMeshes.has(node)) return;
        if (node.children.length > 0 || Array.isArray(node.material) || !node.material) return;
        if (node.material.transparent || mutableMaterials.has(node.material)) return;
        if (
          node.material.userData?.isDynamicGolfBagMaterial ||
          node.material.userData?.isDynamicGolfScreen ||
          node.material.userData?.isDynamicGolfStatusLight
        ) {
          return;
        }
        const posAttr = node.geometry.getAttribute('position');
        if (!posAttr || posAttr.count === 0) return;

        const isInt = interactiveSet.has(node);
        const key = `${node.material.uuid}|${node.castShadow ? 1 : 0}|${node.receiveShadow ? 1 : 0}|${isInt ? 1 : 0}|${tradeCategoryKey(node)}`;
        let list = buckets.get(key);
        if (!list) {
          list = [];
          buckets.set(key, list);
        }
        list.push({ mesh: node, meshParent: node.parent, isInteractive: isInt });
      });

      const invRootWorld = root.matrixWorld.clone().invert();
      const relMatrix = new THREE.Matrix4();
      const originalMeshes: Array<{ readonly mesh: THREE.Mesh; readonly meshParent: THREE.Object3D }> = [];
      const mergedMeshes: THREE.Mesh[] = [];

      for (const list of buckets.values()) {
        if (list.length < 2) continue;
        const first = list[0]!;
        const mergedGeo = this.mergeMeshListFast(list, invRootWorld, relMatrix);
        if (!mergedGeo) continue;

        const mergedMesh = new THREE.Mesh(mergedGeo, first.mesh.material);
        accelerateMergedMeshRaycast(mergedMesh);
        mergedMesh.name = root.name ? `${root.name}.batch` : 'rigid.batch';
        mergedMesh.castShadow = first.mesh.castShadow;
        mergedMesh.receiveShadow = first.mesh.receiveShadow;
        mergedMesh.userData = {
          ...root.userData,
          ...first.mesh.userData,
          isBatchedStaticMesh: true,
        };

        if (first.isInteractive) {
          newInteractiveMeshes.push(mergedMesh);
        }

        for (const item of list) {
          this.snapshotParentChildren(item.meshParent);
          item.meshParent.remove(item.mesh);
          originalMeshes.push({ mesh: item.mesh, meshParent: item.meshParent });
          batchedOriginalMeshes.add(item.mesh);
        }

        this.snapshotParentChildren(root);
        root.add(mergedMesh);
        mergedMesh.matrixWorld.copy(root.matrixWorld);
        mergedMeshes.push(mergedMesh);
      }

      if (mergedMeshes.length > 0) {
        this.batchRecords.push({
          parent: root,
          originalMeshes,
          mergedMeshes,
        });
      }
    }
  }

  /**
   * Consolidates overlapping standalone Outbuilding/Grounds `PointLight` clusters and hoists active
   * first-floor `PointLight`s onto `scene` (in world coordinates) so `NUM_POINT_LIGHTS` never changes
   * when `firstFloorMeshGroup.visible` toggles (eliminating PBR shader recompilations).
   */
  private consolidateAndHoistPointLights(
    scene: THREE.Scene,
    firstFloorMeshGroup: THREE.Group
  ): void {
    const { lightGroups } = this.options;
    const knxLights = new Set<THREE.PointLight>();
    for (const grp of Object.values(lightGroups)) {
      if (!grp) continue;
      for (const l of grp.lights) {
        knxLights.add(l);
      }
    }

    const allPointLights: THREE.PointLight[] = [];
    scene.traverse((obj) => {
      if (obj instanceof THREE.PointLight) {
        allPointLights.push(obj);
      }
    });

    const isInsideFirstFloor = (obj: THREE.Object3D): boolean => {
      let cur: THREE.Object3D | null = obj.parent;
      while (cur) {
        if (cur === firstFloorMeshGroup) return true;
        cur = cur.parent;
      }
      return false;
    };

    // Any layer the CutawayController may hide (floors, ceilings, roof, camera-facing walls).
    // Lights parented under them are hoisted so cutaways never switch lights off.
    const { groundFloorCeilingGroup, ceilingMeshGroup, cutawayWallGroups } = this.options.layers;
    const cutawayLayers = new Set<THREE.Object3D>([
      firstFloorMeshGroup,
      groundFloorCeilingGroup,
      ceilingMeshGroup,
      cutawayWallGroups.southWest,
      cutawayWallGroups.west,
      cutawayWallGroups.north,
      cutawayWallGroups.east,
    ]);
    const isInsideCutawayLayer = (obj: THREE.Object3D): boolean => {
      let cur: THREE.Object3D | null = obj.parent;
      while (cur) {
        if (cutawayLayers.has(cur) || cur.userData?.cutawayWall) return true;
        cur = cur.parent;
      }
      return false;
    };

    const standaloneClusters = new Map<
      string,
      Array<{
        readonly light: THREE.PointLight;
        readonly worldPos: THREE.Vector3;
        readonly is1F: boolean;
        readonly hoist: boolean;
      }>
    >();

    for (const light of allPointLights) {
      if (!light.parent) continue;
      this.originalLightRecords.push({
        light,
        originalParent: light.parent,
        originalPosition: light.position.clone(),
        originalVisible: light.visible,
        originalIntensity: light.intensity,
        originalDistance: light.distance,
      });

      const worldPos = new THREE.Vector3();
      light.getWorldPosition(worldPos);
      const is1F = isInsideFirstFloor(light);
      const hoist = is1F || isInsideCutawayLayer(light) || light.userData?.[ALWAYS_HOIST_LIGHT_FLAG] === true;

      if (knxLights.has(light)) {
        if (hoist) {
          this.snapshotParentChildren(light.parent);
          this.snapshotParentChildren(scene);
          scene.add(light);
          light.position.copy(worldPos);
          light.updateMatrixWorld();
        }
        this.managedPointLights.push({
          light,
          worldPos,
          isFirstFloor: is1F,
          isStandalone: false,
          baseIntensity: light.intensity,
        });
        continue;
      }

      // Keep all interior Barn/Outbuilding task & ambient lights active; only skip micro-range (<2.4m) accent lights
      if (light.distance > 0 && light.distance <= 2.4) {
        light.visible = false;
        continue;
      }

      // Group overlapping standalone PointLights into fine sub-zone clusters (~3.4m x 3.4m cells)
      // so each Barn zone (Golf Sim, West Bay, Golf Bar, Pool Table, Corner Bar, Mezzanine, Cloakroom) keeps its own light
      const clusterKey = `${is1F ? '1F' : 'GF'}:${Math.floor(worldPos.x / 3.4)}:${Math.floor(worldPos.z / 3.4)}`;
      let list = standaloneClusters.get(clusterKey);
      if (!list) {
        list = [];
        standaloneClusters.set(clusterKey, list);
      }
      list.push({ light, worldPos, is1F, hoist });
    }

    for (const list of standaloneClusters.values()) {
      const primary = list[0]!;
      if (list.length > 1) {
        const avgPos = new THREE.Vector3();
        let totalIntensity = 0;
        let maxDist = primary.light.distance;
        for (const item of list) {
          avgPos.add(item.worldPos);
          totalIntensity += item.light.intensity;
          if (item.light.distance > maxDist) maxDist = item.light.distance;
        }
        avgPos.divideScalar(list.length);

        for (let i = 1; i < list.length; i++) {
          list[i]!.light.visible = false;
        }

        const mergedIntensity = Math.min(primary.light.intensity * 2.25, totalIntensity * 0.92);
        const mergedDistance = Math.min(14.0, maxDist * 1.42);
        primary.light.intensity = mergedIntensity;
        primary.light.distance = mergedDistance;
        primary.worldPos.copy(avgPos);

        if (primary.is1F || primary.light.parent !== scene) {
          this.snapshotParentChildren(primary.light.parent!);
          this.snapshotParentChildren(scene);
          scene.add(primary.light);
        }
        primary.light.position.copy(avgPos);
        primary.light.updateMatrixWorld();
      } else if (primary.hoist) {
        this.snapshotParentChildren(primary.light.parent!);
        this.snapshotParentChildren(scene);
        scene.add(primary.light);
        primary.light.position.copy(primary.worldPos);
        primary.light.updateMatrixWorld();
      }

      const rawBaseIntensity = primary.light.intensity;
      primary.light.intensity = rawBaseIntensity * this.getStandaloneLightTodScale();
      this.managedPointLights.push({
        light: primary.light,
        worldPos: primary.worldPos.clone(),
        isFirstFloor: primary.is1F,
        isStandalone: true,
        baseIntensity: rawBaseIntensity,
      });
    }
  }

  /**
   * Re-syncs managed `PointLight` intensities from KNX dimmer targets and time of day.
   *
   * Lighting is a pure function of KNX state + time of day: the camera position and floor
   * visibility arguments are intentionally ignored (kept for call-site compatibility). Lights are
   * never muted by camera distance or by hiding the first floor, and `.visible` is never toggled,
   * so `NUM_POINT_LIGHTS` stays constant and shaders never recompile. Returns true only if a
   * KNX/time-of-day/budget-driven intensity actually changed.
   */
  public syncPointLightVisibilityAndDistance(
    _cameraPos: THREE.Vector3,
    _firstFloorVisible: boolean
  ): boolean {
    if (!this.isCurrentlyBatched || this.managedPointLights.length === 0) return false;
    return this.applyManagedLightIntensities();
  }

  private readonly scratchNormalMatrix = new THREE.Matrix3();

  /**
   * Single-pass typed-array geometry merger that transforms positions, normals, UVs, and indices
   * directly into pre-allocated buffers while simultaneously computing the merged bounding box
   * and bounding sphere (avoiding intermediate BufferGeometry clones and redundant bounding passes).
   */
  private mergeMeshListFast(
    list: ReadonlyArray<{ readonly mesh: THREE.Mesh }>,
    invTargetWorld: THREE.Matrix4,
    scratchMatrix: THREE.Matrix4
  ): THREE.BufferGeometry | null {
    let totalVerts = 0;
    let totalIndices = 0;

    for (let i = 0; i < list.length; i++) {
      const g = list[i]!.mesh.geometry;
      const pos = g.getAttribute('position');
      if (!pos || pos.count === 0) return null;
      totalVerts += pos.count;
      totalIndices += g.index ? g.index.count : pos.count;
    }

    const posOut = new Float32Array(totalVerts * 3);
    const normOut = new Float32Array(totalVerts * 3);
    const uvOut = new Float32Array(totalVerts * 2);
    const idxOut =
      totalVerts > 65535
        ? new Uint32Array(totalIndices)
        : new Uint16Array(totalIndices);

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let minZ = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    let maxZ = Number.NEGATIVE_INFINITY;

    const subBounds = new Float32Array(list.length * 6);
    const subRanges = new Uint32Array(list.length * 2);

    let vOffset = 0;
    let iOffset = 0;

    for (let i = 0; i < list.length; i++) {
      const m = list[i]!.mesh;
      const g = m.geometry;
      if (!g.getAttribute('normal')) {
        g.computeVertexNormals();
      }

      scratchMatrix.multiplyMatrices(invTargetWorld, m.matrixWorld);
      const e = scratchMatrix.elements;
      const m00 = e[0];
      const m01 = e[4];
      const m02 = e[8];
      const tx = e[12];
      const m10 = e[1];
      const m11 = e[5];
      const m12 = e[9];
      const ty = e[13];
      const m20 = e[2];
      const m21 = e[6];
      const m22 = e[10];
      const tz = e[14];

      this.scratchNormalMatrix.getNormalMatrix(scratchMatrix);
      const ne = this.scratchNormalMatrix.elements;
      const n00 = ne[0];
      const n01 = ne[3];
      const n02 = ne[6];
      const n10 = ne[1];
      const n11 = ne[4];
      const n12 = ne[7];
      const n20 = ne[2];
      const n21 = ne[5];
      const n22 = ne[8];

      const posAttr = g.getAttribute('position') as THREE.BufferAttribute;
      const normAttr = g.getAttribute('normal') as THREE.BufferAttribute | undefined;
      const uvAttr = g.getAttribute('uv') as THREE.BufferAttribute | undefined;
      const posArr = posAttr.array;
      const normArr = normAttr?.array;
      const uvArr = uvAttr && uvAttr.itemSize === 2 ? uvAttr.array : undefined;
      const count = posAttr.count;

      let sMinX = Number.POSITIVE_INFINITY;
      let sMinY = Number.POSITIVE_INFINITY;
      let sMinZ = Number.POSITIVE_INFINITY;
      let sMaxX = Number.NEGATIVE_INFINITY;
      let sMaxY = Number.NEGATIVE_INFINITY;
      let sMaxZ = Number.NEGATIVE_INFINITY;

      for (let v = 0; v < count; v++) {
        const v3 = v * 3;
        const out3 = (vOffset + v) * 3;
        const px = posArr[v3]!;
        const py = posArr[v3 + 1]!;
        const pz = posArr[v3 + 2]!;

        const wx = m00 * px + m01 * py + m02 * pz + tx;
        const wy = m10 * px + m11 * py + m12 * pz + ty;
        const wz = m20 * px + m21 * py + m22 * pz + tz;

        posOut[out3] = wx;
        posOut[out3 + 1] = wy;
        posOut[out3 + 2] = wz;

        if (wx < sMinX) sMinX = wx;
        if (wx > sMaxX) sMaxX = wx;
        if (wy < sMinY) sMinY = wy;
        if (wy > sMaxY) sMaxY = wy;
        if (wz < sMinZ) sMinZ = wz;
        if (wz > sMaxZ) sMaxZ = wz;

        if (normArr) {
          const nx = normArr[v3]!;
          const ny = normArr[v3 + 1]!;
          const nz = normArr[v3 + 2]!;
          const rx = n00 * nx + n01 * ny + n02 * nz;
          const ry = n10 * nx + n11 * ny + n12 * nz;
          const rz = n20 * nx + n21 * ny + n22 * nz;
          const len = Math.hypot(rx, ry, rz) || 1;
          normOut[out3] = rx / len;
          normOut[out3 + 1] = ry / len;
          normOut[out3 + 2] = rz / len;
        } else {
          normOut[out3 + 1] = 1;
        }

        if (uvArr) {
          const v2 = v * 2;
          const out2 = (vOffset + v) * 2;
          uvOut[out2] = uvArr[v2]!;
          uvOut[out2 + 1] = uvArr[v2 + 1]!;
        }
      }

      if (sMinX < minX) minX = sMinX;
      if (sMaxX > maxX) maxX = sMaxX;
      if (sMinY < minY) minY = sMinY;
      if (sMaxY > maxY) maxY = sMaxY;
      if (sMinZ < minZ) minZ = sMinZ;
      if (sMaxZ > maxZ) maxZ = sMaxZ;

      const b6 = i * 6;
      subBounds[b6] = sMinX;
      subBounds[b6 + 1] = sMinY;
      subBounds[b6 + 2] = sMinZ;
      subBounds[b6 + 3] = sMaxX;
      subBounds[b6 + 4] = sMaxY;
      subBounds[b6 + 5] = sMaxZ;

      const subStart = iOffset;
      let subIdxCount = count;
      if (g.index) {
        const idxArr = g.index.array;
        const idxCount = g.index.count;
        subIdxCount = idxCount;
        for (let k = 0; k < idxCount; k++) {
          idxOut[iOffset + k] = idxArr[k]! + vOffset;
        }
        iOffset += idxCount;
      } else {
        for (let k = 0; k < count; k++) {
          idxOut[iOffset + k] = vOffset + k;
        }
        iOffset += count;
      }

      const r2 = i * 2;
      subRanges[r2] = subStart;
      subRanges[r2 + 1] = subIdxCount;

      vOffset += count;
    }

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(posOut, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(normOut, 3));
    merged.setAttribute('uv', new THREE.BufferAttribute(uvOut, 2));
    merged.setIndex(new THREE.BufferAttribute(idxOut, 1));

    const bbox = new THREE.Box3(
      new THREE.Vector3(minX, minY, minZ),
      new THREE.Vector3(maxX, maxY, maxZ)
    );
    merged.boundingBox = bbox;
    merged.boundingSphere = bbox.getBoundingSphere(new THREE.Sphere());
    merged.userData = { subBounds, subRanges };
    return merged;
  }
}

const _raycastInverseMatrix = new THREE.Matrix4();
const _raycastLocalRay = new THREE.Ray();
const _raycastWorldSphere = new THREE.Sphere();
const _raycastSphereHit = new THREE.Vector3();
const _raycastSubBox = new THREE.Box3();

/**
 * Accelerates CPU raycasting against merged static batch meshes by testing each constituent
 * sub-mesh's tight local AABB first and only running triangle intersection on hit sub-mesh index ranges.
 */
function accelerateMergedMeshRaycast(mesh: THREE.Mesh): void {
  const geoUserData = mesh.geometry.userData as {
    readonly subBounds?: Float32Array;
    readonly subRanges?: Uint32Array;
  } | undefined;
  const subBounds = geoUserData?.subBounds;
  const subRanges = geoUserData?.subRanges;
  if (!subBounds || !subRanges) return;
  const subCount = subRanges.length >>> 1;
  if (subCount < 2) return;

  mesh.raycast = function (
    this: THREE.Mesh,
    raycaster: THREE.Raycaster,
    intersects: THREE.Intersection[]
  ): void {
    const geometry = this.geometry;
    const material = this.material;
    if (!material || !this.visible) return;

    if (geometry.boundingSphere === null) geometry.computeBoundingSphere();
    _raycastWorldSphere.copy(geometry.boundingSphere!).applyMatrix4(this.matrixWorld);

    _raycastLocalRay.copy(raycaster.ray).recast(raycaster.near);
    if (!_raycastWorldSphere.containsPoint(_raycastLocalRay.origin)) {
      if (_raycastLocalRay.intersectSphere(_raycastWorldSphere, _raycastSphereHit) === null) {
        return;
      }
      if (
        _raycastLocalRay.origin.distanceToSquared(_raycastSphereHit) >
        (raycaster.far - raycaster.near) ** 2
      ) {
        return;
      }
    }

    _raycastInverseMatrix.copy(this.matrixWorld).invert();
    _raycastLocalRay.copy(raycaster.ray).applyMatrix4(_raycastInverseMatrix);

    if (geometry.boundingBox !== null && !_raycastLocalRay.intersectsBox(geometry.boundingBox)) {
      return;
    }

    const selfWithCompute = this as unknown as {
      _computeIntersections(
        rc: THREE.Raycaster,
        out: THREE.Intersection[],
        localRay: THREE.Ray
      ): void;
    };

    for (let s = 0; s < subCount; s++) {
      const b6 = s * 6;
      _raycastSubBox.min.set(subBounds[b6]!, subBounds[b6 + 1]!, subBounds[b6 + 2]!);
      _raycastSubBox.max.set(subBounds[b6 + 3]!, subBounds[b6 + 4]!, subBounds[b6 + 5]!);
      if (_raycastLocalRay.intersectsBox(_raycastSubBox)) {
        const r2 = s * 2;
        geometry.setDrawRange(subRanges[r2]!, subRanges[r2 + 1]!);
        selfWithCompute._computeIntersections(raycaster, intersects, _raycastLocalRay);
      }
    }
    geometry.setDrawRange(0, Infinity);
  };
}

/** Trade category tag (set by `classifyScene`) so merged batches never mix trade categories. */
function tradeCategoryKey(obj: THREE.Object3D): string {
  const cat: unknown = obj.userData?.tradeCategory;
  return typeof cat === 'string' ? cat : '';
}
