import * as THREE from 'three';
import type { RoomLodController } from '../lod/lod-manager.ts';
import type { BifoldPanelRef, LightGroupMap, TimeOfDay, ZoneIndicatorMaterials } from '../../types/scene.ts';
import type { RoomZoneId } from '../../types/topology.ts';
import type { PropertySceneLayers, RoomSwitchLedBinding } from './scene-content.ts';

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
  readonly maxCameraDistance: number;
}

export interface SceneBatchOptimizerOptions {
  readonly layers: PropertySceneLayers;
  readonly lodController: RoomLodController;
  readonly interactiveMeshes: THREE.Object3D[];
  readonly bifoldPanels: readonly BifoldPanelRef[];
  readonly lightGroups: LightGroupMap;
  readonly indicatorMats: ZoneIndicatorMaterials;
  readonly roomSwitchLedMats: readonly RoomSwitchLedBinding[];
  readonly getDynamicObjects: () => Set<THREE.Object3D>;
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
    const todScale = this.getStandaloneLightTodScale();
    for (let i = 0; i < this.managedPointLights.length; i++) {
      const entry = this.managedPointLights[i]!;
      if (entry.isStandalone && entry.light.intensity > 0) {
        entry.light.intensity = entry.baseIntensity * todScale;
      }
    }
  }

  public constructor(options: SceneBatchOptimizerOptions) {
    this.options = options;
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
      rec.light.intensity = rec.originalIntensity;
      rec.light.distance = rec.originalDistance;
      if (rec.light.userData) {
        rec.light.userData.isMutedByFloorOrDistance = false;
      }
    }

    this.batchRecords.length = 0;
    this.originalChildrenByParent.clear();
    this.originalMeshProps.clear();
    this.originalLightRecords.length = 0;
    this.managedPointLights.length = 0;
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

    // 8. Sync `interactiveMeshes`: keep unbatched interactive meshes + append merged interactive batch meshes
    const updatedInteractive: THREE.Object3D[] = [];
    for (const obj of interactiveMeshes) {
      if (!batchedOriginalMeshes.has(obj)) {
        updatedInteractive.push(obj);
      }
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

    this.isCurrentlyBatched = true;
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

      if (node instanceof THREE.Mesh) {
        if (!this.originalMeshProps.has(node)) {
          this.originalMeshProps.set(node, {
            material: node.material,
            castShadow: node.castShadow,
          });
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

      const nextTier: 1 | 2 | undefined =
        u.lodTier === 1 || u.lodTier === 2 ? (u.lodTier as 1 | 2) : inheritedTier;
      const nextZone: RoomZoneId | undefined =
        ((u.zoneId ?? u.zone) as RoomZoneId | undefined) ?? inheritedZone;

      let nextRuntimeMaxDist = inheritedRuntimeMaxDist;
      if (u.lodTier === 'high' || nextTier === 2) {
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
              Boolean(nextUserData.ufhZoneId) ||
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

            const key = `${mat.uuid}|${node.castShadow ? 1 : 0}|${nextRuntimeMaxDist}|${intKey}|${cellKey}`;
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
      const baseKey = `${mat.uuid}|${intKey}|${cutKey}|${first.zoneId ?? ''}`;
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
          obj.name === 'familyRoom.neptuneWycombeDiningTable.extendedSeats')
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
        const key = `${node.material.uuid}|${node.castShadow ? 1 : 0}|${node.receiveShadow ? 1 : 0}|${isInt ? 1 : 0}`;
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

    const standaloneClusters = new Map<
      string,
      Array<{ readonly light: THREE.PointLight; readonly worldPos: THREE.Vector3; readonly is1F: boolean }>
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

      if (knxLights.has(light)) {
        if (is1F) {
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
          maxCameraDistance: 32,
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
      list.push({ light, worldPos, is1F });
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
      } else if (primary.is1F) {
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
        maxCameraDistance: 28,
      });
    }
  }

  /**
   * Updates hoisted 1F and standalone Outbuilding/Grounds `PointLight` intensities based on
   * floor visibility and camera distance without changing `.visible` (so `NUM_POINT_LIGHTS`
   * remains constant and shaders never recompile, while distant/hidden lights early-out in the shader).
   */
  public syncPointLightVisibilityAndDistance(
    cameraPos: THREE.Vector3,
    firstFloorVisible: boolean
  ): boolean {
    if (!this.isCurrentlyBatched || this.managedPointLights.length === 0) return false;
    let changed = false;

    for (let i = 0; i < this.managedPointLights.length; i++) {
      const entry = this.managedPointLights[i]!;
      const dx = entry.worldPos.x - cameraPos.x;
      const dz = entry.worldPos.z - cameraPos.z;
      const distSq = dx * dx + dz * dz;
      const maxD = entry.maxCameraDistance;
      const shouldMute = (entry.isFirstFloor && !firstFloorVisible) || distSq >= maxD * maxD;

      if (!entry.isStandalone) {
        const prevMuted = Boolean(entry.light.userData?.isMutedByFloorOrDistance);
        if (prevMuted !== shouldMute) {
          entry.light.userData = {
            ...entry.light.userData,
            isMutedByFloorOrDistance: shouldMute,
          };
          changed = true;
        }
        const knxTarget =
          typeof entry.light.userData?.knxTargetIntensity === 'number'
            ? (entry.light.userData.knxTargetIntensity as number)
            : entry.baseIntensity;
        const nextInt = shouldMute ? 0 : knxTarget;
        if (entry.light.intensity !== nextInt) {
          entry.light.intensity = nextInt;
          changed = true;
        }
        continue;
      }

      const nextInt = shouldMute ? 0 : entry.baseIntensity * this.getStandaloneLightTodScale();
      if (entry.light.intensity !== nextInt) {
        entry.light.intensity = nextInt;
        changed = true;
      }
    }

    return changed;
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

        if (wx < minX) minX = wx;
        if (wx > maxX) maxX = wx;
        if (wy < minY) minY = wy;
        if (wy > maxY) maxY = wy;
        if (wz < minZ) minZ = wz;
        if (wz > maxZ) maxZ = wz;

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

      if (g.index) {
        const idxArr = g.index.array;
        const idxCount = g.index.count;
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
    return merged;
  }
}
