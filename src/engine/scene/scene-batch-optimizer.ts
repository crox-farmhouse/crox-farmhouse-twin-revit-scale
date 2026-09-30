import * as THREE from 'three';
import type { RoomLodController } from '../lod/lod-manager.ts';
import type { BifoldPanelRef, LightGroupMap, ZoneIndicatorMaterials } from '../../types/scene.ts';
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

export interface SceneBatchOptimizerOptions {
  readonly layers: PropertySceneLayers;
  readonly lodController: RoomLodController;
  readonly interactiveMeshes: readonly THREE.Object3D[];
  readonly bifoldPanels: readonly BifoldPanelRef[];
  readonly lightGroups: LightGroupMap;
  readonly indicatorMats: ZoneIndicatorMaterials;
  readonly roomSwitchLedMats: readonly RoomSwitchLedBinding[];
  readonly getDynamicObjects: () => Set<THREE.Object3D>;
}

/**
 * Runtime static-geometry batcher, material deduplicator, and unindexed-room-prop LOD binder.
 *
 * Reduces ~10,450 individual `THREE.Mesh` objects down to ~2,400 batched draw calls while:
 * - Preserving all interactive doors, drawers, cupboards, bifolds, gates, switches, sensors, and lights.
 * - Preserving parent furniture `THREE.Group` transforms, names, cutaway-wall tags, and LOD tiers.
 * - Supporting instant reversible `unbatchAll()` whenever `.usda` zone hot-reloading or saved
 *   annotation transform re-application needs the original unmerged mesh tree.
 */
export class SceneBatchOptimizer {
  private readonly options: SceneBatchOptimizerOptions;
  private readonly batchRecords: BatchedGroupRecord[] = [];
  private isCurrentlyBatched = false;
  private extraLodBound = false;

  public constructor(options: SceneBatchOptimizerOptions) {
    this.options = options;
  }

  /**
   * Restores all merged `THREE.Mesh` batches back to their original individual `THREE.Mesh` nodes.
   */
  public unbatchAll(): void {
    if (!this.isCurrentlyBatched) return;
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
    this.batchRecords.length = 0;
    this.isCurrentlyBatched = false;
    this.extraLodBound = false;
  }

  /**
   * Deduplicates identical static materials, binds unindexed heavy room assemblies to `RoomLodController`,
   * disables shadow casting on small (< 32cm) clutter props, and merges static opaque meshes by material.
   */
  public optimize(): void {
    if (this.isCurrentlyBatched) {
      this.unbatchAll();
    }

    const { layers, lodController } = this.options;
    const { scene, firstFloorMeshGroup, groundFloorCeilingGroup, ceilingMeshGroup, cutawayWallGroups } =
      layers;

    scene.updateMatrixWorld(true);

    // 1. Register heavy interior room assemblies that were skipped during initial LOD indexing
    if (!this.extraLodBound) {
      this.bindAdditionalInteriorLodGroups();
      this.extraLodBound = true;
    }

    // 2. Collect all dynamic/interactive objects and mutable materials that must NEVER be merged
    const protectedObjects = this.collectProtectedObjects();
    const mutableMaterials = this.collectMutableMaterials();

    // 3. Deduplicate identical static materials and cull shadow casting on small (< 0.30m radius) clutter meshes
    this.deduplicateMaterialsAndCullSmallShadows(scene, mutableMaterials);

    const containerGroups = new Set<THREE.Object3D>([
      scene,
      firstFloorMeshGroup,
      groundFloorCeilingGroup,
      ceilingMeshGroup,
      cutawayWallGroups.southWest,
      cutawayWallGroups.west,
      cutawayWallGroups.north,
      cutawayWallGroups.east,
    ]);
    scene.traverse((obj) => {
      if (obj instanceof THREE.Group) {
        if (
          obj.userData?.isRoomContainer ||
          (obj.userData?.isArchitecturalShell && !obj.name)
        ) {
          containerGroups.add(obj);
        }
      }
    });

    // 4a. Furniture / Fixture / Equipment Subtree Batching:
    //     For every top-level furniture/prop Group inside a container group, merge all static
    //     opaque descendant meshes sharing (material, castShadow, receiveShadow) into 1 Mesh per material.
    const topPropGroups: THREE.Group[] = [];
    for (const container of containerGroups) {
      for (const child of container.children) {
        if (
          child instanceof THREE.Group &&
          !containerGroups.has(child) &&
          !protectedObjects.has(child) &&
          child.visible
        ) {
          topPropGroups.push(child);
        }
      }
    }

    for (const propGroup of topPropGroups) {
      this.batchFurnitureSubtree(propGroup, protectedObjects, lodController);
    }

    // 4b. Spatially-Bucketed Container Direct-Child Batching:
    //     For unnamed static opaque direct child meshes of container groups, merge within 6m spatial cells
    //     by (material, castShadow, receiveShadow, isIndexed, zoneId, lodTier, cellX, cellZ).
    for (const container of containerGroups) {
      this.batchContainerDirectMeshes(container, protectedObjects, lodController);
    }

    this.isCurrentlyBatched = true;
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

    // Also bind westBayWindow.curtainsAndPole groups (livingRoom & sittingRoom)
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

  private collectProtectedObjects(): Set<THREE.Object3D> {
    const { layers, interactiveMeshes, bifoldPanels, getDynamicObjects } = this.options;
    const protectedSet = getDynamicObjects();

    const markSubtree = (root: THREE.Object3D): void => {
      root.traverse((node) => protectedSet.add(node));
    };

    for (const mesh of interactiveMeshes) {
      let pivot: THREE.Object3D | null = mesh;
      while (
        pivot &&
        pivot.parent &&
        pivot.parent !== layers.scene &&
        !pivot.userData?.interactableId &&
        !pivot.userData?.isCarGate &&
        !pivot.userData?.isBifoldDoor
      ) {
        pivot = pivot.parent;
      }
      if (
        pivot &&
        (pivot.userData?.interactableId ||
          pivot.userData?.isCarGate ||
          pivot.userData?.isBifoldDoor)
      ) {
        markSubtree(pivot);
      } else {
        markSubtree(mesh);
      }
    }

    for (const panel of bifoldPanels) {
      markSubtree(panel.group);
    }

    layers.scene.traverse((obj) => {
      const u = obj.userData;
      if (!u) return;
      if (
        u.interactableId ||
        u.isKNXSwitch ||
        u.switchPa ||
        u.isKnxTempSensor ||
        u.isCourtyardSwitch ||
        u.isUtilitySwitch ||
        u.isKitchenMotionSensor ||
        u.isUtilityMotionSensor ||
        u.roomMotionSensorId ||
        u.isBifoldDoor ||
        u.isCarGate ||
        u.isUniFiCamera ||
        u.isUniFiAccessReader ||
        u.isFrameTV ||
        u.ufhZoneId ||
        u.isAnnotationGroup ||
        u.isSecurityFovCone ||
        u.circuitId
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

  private deduplicateMaterialsAndCullSmallShadows(
    scene: THREE.Scene,
    mutableMaterials: ReadonlySet<THREE.Material>
  ): void {
    const canonicalBySig = new Map<string, THREE.Material>();

    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;

      // Disable shadow casting on small (< 30cm radius) interior detail clutter
      if (obj.castShadow) {
        if (!obj.geometry.boundingSphere) {
          obj.geometry.computeBoundingSphere();
        }
        const sphere = obj.geometry.boundingSphere;
        if (sphere) {
          const maxScale = Math.max(
            Math.abs(obj.scale.x),
            Math.abs(obj.scale.y),
            Math.abs(obj.scale.z)
          );
          if (sphere.radius * maxScale < 0.3) {
            obj.castShadow = false;
          }
        }
      }

      if (Array.isArray(obj.material) || !obj.material) return;
      const mat = obj.material as THREE.MeshStandardMaterial;
      if (mutableMaterials.has(mat)) return;
      if (mat.userData && Object.keys(mat.userData).length > 0) return;

      const sig = [
        mat.type,
        mat.color?.getHexString?.() ?? '',
        mat.emissive?.getHexString?.() ?? '',
        (mat.emissiveIntensity ?? 0).toFixed(3),
        (mat.roughness ?? -1).toFixed(3),
        (mat.metalness ?? -1).toFixed(3),
        (mat.bumpScale ?? 0).toFixed(4),
        (mat.opacity ?? 1).toFixed(3),
        mat.transparent ? '1' : '0',
        mat.side,
        mat.depthWrite ? '1' : '0',
        mat.polygonOffset ? '1' : '0',
        mat.map?.uuid ?? '',
        mat.normalMap?.uuid ?? '',
        mat.roughnessMap?.uuid ?? '',
        mat.bumpMap?.uuid ?? '',
        mat.alphaMap?.uuid ?? '',
      ].join('|');

      const existing = canonicalBySig.get(sig);
      if (existing) {
        obj.material = existing;
      } else {
        canonicalBySig.set(sig, mat);
      }
    });
  }

  private isBatchableMesh(
    mesh: THREE.Mesh,
    protectedObjects: ReadonlySet<THREE.Object3D>
  ): boolean {
    if (!mesh.visible) return false;
    if (protectedObjects.has(mesh)) return false;
    if (mesh.children.length > 0) return false;
    if (Array.isArray(mesh.material) || !mesh.material) return false;
    if (mesh.material.transparent) return false;
    const posAttr = mesh.geometry.getAttribute('position');
    if (!posAttr || posAttr.count === 0) return false;
    return true;
  }

  private batchFurnitureSubtree(
    propGroup: THREE.Group,
    protectedObjects: ReadonlySet<THREE.Object3D>,
    lodController: RoomLodController
  ): void {
    const buckets = new Map<
      string,
      Array<{
        readonly mesh: THREE.Mesh;
        readonly meshParent: THREE.Object3D;
        readonly lodTier: number | undefined;
        readonly zoneId: RoomZoneId | undefined;
      }>
    >();

    const rootTier =
      typeof propGroup.userData?.lodTier === 'number'
        ? (propGroup.userData.lodTier as number)
        : undefined;
    const rootZone = (propGroup.userData?.zoneId ?? propGroup.userData?.zone) as
      | RoomZoneId
      | undefined;

    const visit = (
      node: THREE.Object3D,
      inheritedTier: number | undefined,
      inheritedZone: RoomZoneId | undefined
    ): void => {
      if (!node.visible || protectedObjects.has(node)) return;
      const u = node.userData;
      if (node !== propGroup && (u?.cutawayWall || u?.isCutawayWall)) {
        return;
      }
      const nextTier =
        typeof u?.lodTier === 'number' ? (u.lodTier as number) : inheritedTier;
      const nextZone =
        ((u?.zoneId ?? u?.zone) as RoomZoneId | undefined) ?? inheritedZone;

      if (node instanceof THREE.Mesh) {
        if (this.isBatchableMesh(node, protectedObjects) && node.parent) {
          const mat = node.material as THREE.Material;
          const isIdx = node.geometry.index !== null ? 1 : 0;
          const key = `${mat.uuid}|${node.castShadow ? 1 : 0}|${node.receiveShadow ? 1 : 0}|${isIdx}|${nextTier ?? ''}|${nextZone ?? ''}`;
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
          });
        }
        return;
      }
      for (const child of node.children) {
        visit(child, nextTier, nextZone);
      }
    };

    visit(propGroup, rootTier, rootZone);

    const invGroupWorld = propGroup.matrixWorld.clone().invert();
    const relMatrix = new THREE.Matrix4();
    const originalMeshes: Array<{ readonly mesh: THREE.Mesh; readonly meshParent: THREE.Object3D }> = [];
    const mergedMeshes: THREE.Mesh[] = [];

    for (const list of buckets.values()) {
      if (list.length < 2) continue;

      const firstItem = list[0]!;
      const template = firstItem.mesh;
      const mergedGeo = this.mergeMeshListFast(list, invGroupWorld, relMatrix);
      if (!mergedGeo) continue;

      const mergedMesh = new THREE.Mesh(mergedGeo, template.material);
      mergedMesh.name = propGroup.name ? `${propGroup.name}.batch` : '';
      mergedMesh.castShadow = template.castShadow;
      mergedMesh.receiveShadow = template.receiveShadow;
      mergedMesh.userData = {
        ...propGroup.userData,
        ...template.userData,
        ...(firstItem.lodTier !== undefined ? { lodTier: firstItem.lodTier } : {}),
        ...(firstItem.zoneId !== undefined ? { zoneId: firstItem.zoneId } : {}),
        isBatchedStaticMesh: true,
      };

      if (
        rootTier === undefined &&
        firstItem.zoneId &&
        (firstItem.lodTier === 1 || firstItem.lodTier === 2)
      ) {
        lodController.registerObjectWithTier(
          firstItem.zoneId,
          mergedMesh,
          firstItem.lodTier
        );
      }

      for (const item of list) {
        item.meshParent.remove(item.mesh);
        originalMeshes.push(item);
      }

      propGroup.add(mergedMesh);
      mergedMesh.matrixWorld.copy(propGroup.matrixWorld);
      mergedMeshes.push(mergedMesh);
    }

    if (mergedMeshes.length > 0) {
      this.batchRecords.push({
        parent: propGroup,
        originalMeshes,
        mergedMeshes,
      });
    }
  }

  private batchContainerDirectMeshes(
    container: THREE.Object3D,
    protectedObjects: ReadonlySet<THREE.Object3D>,
    lodController: RoomLodController
  ): void {
    const buckets = new Map<
      string,
      Array<{ readonly mesh: THREE.Mesh; readonly meshParent: THREE.Object3D }>
    >();
    const worldCenter = new THREE.Vector3();

    for (const child of container.children) {
      if (!(child instanceof THREE.Mesh)) continue;
      if (child.userData?.isBatchedStaticMesh) continue;
      if (!this.isBatchableMesh(child, protectedObjects)) continue;

      const u = child.userData ?? {};
      // Do not merge dynamic cutaway wall segments at the container level so CutawayController's
      // direct object references in `dynamicCutawayWallItems` remain valid
      if (u.cutawayWall || u.isCutawayWall) continue;

      if (!child.geometry.boundingSphere) {
        child.geometry.computeBoundingSphere();
      }
      const sphere = child.geometry.boundingSphere;
      // Skip merging huge architectural floor/roof slabs (> 6.5m radius)
      if (sphere && sphere.radius > 6.5) continue;

      if (sphere) {
        worldCenter.copy(sphere.center).applyMatrix4(child.matrixWorld);
      } else {
        worldCenter.setFromMatrixPosition(child.matrixWorld);
      }

      // 6m x 6m spatial cell so view-frustum culling remains room-granular
      const cellX = Math.floor(worldCenter.x / 6.0);
      const cellZ = Math.floor(worldCenter.z / 6.0);
      const zoneKey = (u.zoneId ?? u.zone ?? '') as string;
      const tierKey = u.lodTier !== undefined ? String(u.lodTier) : '';
      const isIdx = child.geometry.index !== null ? 1 : 0;
      const mat = child.material as THREE.Material;

      const key = `${mat.uuid}|${child.castShadow ? 1 : 0}|${child.receiveShadow ? 1 : 0}|${isIdx}|${zoneKey}|${tierKey}|${cellX}:${cellZ}`;
      let list = buckets.get(key);
      if (!list) {
        list = [];
        buckets.set(key, list);
      }
      list.push({ mesh: child, meshParent: container });
    }

    const invContainerWorld = container.matrixWorld.clone().invert();
    const relMatrix = new THREE.Matrix4();
    const originalMeshes: Array<{ readonly mesh: THREE.Mesh; readonly meshParent: THREE.Object3D }> = [];
    const mergedMeshes: THREE.Mesh[] = [];

    for (const list of buckets.values()) {
      if (list.length < 2) continue;

      const template = list[0]!.mesh;
      const mergedGeo = this.mergeMeshListFast(list, invContainerWorld, relMatrix);
      if (!mergedGeo) continue;

      const mergedMesh = new THREE.Mesh(mergedGeo, template.material);
      mergedMesh.castShadow = template.castShadow;
      mergedMesh.receiveShadow = template.receiveShadow;
      mergedMesh.userData = {
        ...template.userData,
        isBatchedStaticMesh: true,
      };

      const zoneId = (template.userData?.zoneId ?? template.userData?.zone) as
        | RoomZoneId
        | undefined;
      const lodTier = template.userData?.lodTier as 1 | 2 | undefined;
      if (zoneId && (lodTier === 1 || lodTier === 2)) {
        lodController.registerObjectWithTier(zoneId, mergedMesh, lodTier);
      }

      for (const item of list) {
        container.remove(item.mesh);
        originalMeshes.push(item);
      }

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
    const isIndexed = list[0]!.mesh.geometry.index !== null;

    for (let i = 0; i < list.length; i++) {
      const g = list[i]!.mesh.geometry;
      const pos = g.getAttribute('position');
      if (!pos || pos.count === 0) return null;
      totalVerts += pos.count;
      if (isIndexed) {
        if (!g.index) return null;
        totalIndices += g.index.count;
      }
    }

    const posOut = new Float32Array(totalVerts * 3);
    const normOut = new Float32Array(totalVerts * 3);
    const uvOut = new Float32Array(totalVerts * 2);
    const idxOut = isIndexed
      ? totalVerts > 65535
        ? new Uint32Array(totalIndices)
        : new Uint16Array(totalIndices)
      : null;

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

      if (isIndexed && idxOut && g.index) {
        const idxArr = g.index.array;
        const idxCount = g.index.count;
        for (let k = 0; k < idxCount; k++) {
          idxOut[iOffset + k] = idxArr[k]! + vOffset;
        }
        iOffset += idxCount;
      }

      vOffset += count;
    }

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(posOut, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(normOut, 3));
    merged.setAttribute('uv', new THREE.BufferAttribute(uvOut, 2));
    if (idxOut) {
      merged.setIndex(new THREE.BufferAttribute(idxOut, 1));
    }

    const bbox = new THREE.Box3(
      new THREE.Vector3(minX, minY, minZ),
      new THREE.Vector3(maxX, maxY, maxZ)
    );
    merged.boundingBox = bbox;
    merged.boundingSphere = bbox.getBoundingSphere(new THREE.Sphere());
    return merged;
  }
}
