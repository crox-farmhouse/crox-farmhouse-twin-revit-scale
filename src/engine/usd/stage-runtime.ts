import * as THREE from 'three';
import { CROX_FARMHOUSE_LOD_REGISTRATIONS } from '../../homes/crox-farmhouse/manifest.ts';
import type { Vec3Tuple } from '../../types/scene.ts';
import { convertThreeMaterialToUsdSpec } from './procedural-materials.ts';
import {
  CROX_USD_ZONE_LAYERS,
  sanitizeUsdIdent,
  type UsdPrim,
  type UsdPrimTypeName,
  type UsdProceduralPatternKind,
} from './schema.ts';
import { classifyBranchZoneLayer } from './stage-converter.ts';
import {
  applyUsdOverridesToScene,
  parseUsdaOverrideLayer,
} from './usda-override-layer.ts';
import { serializeUsdaStage } from './usda-serializer.ts';
import {
  parseAndInstantiateUsdaZone,
  parseUsdaMaterialLibrary,
  type UsdaSceneLayerTarget,
} from './usda-zone-loader.ts';

export type UsdViewportDiagnosticMode =
  | 'pbr'
  | 'primTypes'
  | 'physicsColliders'
  | 'materialArchetypes';

export type UsdLodVariant = 'hero' | 'standard' | 'shell';
export type UsdRoofCutawayVariant = 'fullBuilding' | 'groundFloorCutaway';

export interface UsdIndexedPrimInfo {
  readonly uuid: string;
  readonly primPath: string;
  readonly primName: string;
  readonly objectName: string;
  readonly typeName: UsdPrimTypeName;
  readonly zoneId: string;
  readonly sublayerFile: string;
  readonly kind: 'assembly' | 'component' | 'subcomponent';
  readonly purpose: 'default' | 'render' | 'guide';
  readonly physicsCollision: boolean;
  readonly lodTier: 0 | 1 | 2;
  readonly materialName: string;
  readonly materialPath: string;
  readonly materialArchetype: UsdProceduralPatternKind;
  readonly worldCenter: Vec3Tuple;
  readonly worldSize: Vec3Tuple;
  readonly usdaSourceOfTruth: boolean;
}

export interface UsdZoneSublayerSummary {
  readonly zoneId: string;
  readonly label: string;
  readonly fileName: string;
  readonly muted: boolean;
  readonly sourceMode: 'usda' | 'ts';
  readonly totalPrims: number;
  readonly cubeCount: number;
  readonly cylinderCount: number;
  readonly sphereCount: number;
  readonly coneCount: number;
  readonly meshCount: number;
  readonly colliderCount: number;
}

export interface UsdStageStatsSummary {
  readonly totalPrims: number;
  readonly cubeCount: number;
  readonly cylinderCount: number;
  readonly sphereCount: number;
  readonly coneCount: number;
  readonly meshCount: number;
  readonly colliderCount: number;
  readonly materialCount: number;
  readonly sublayerCount: number;
  readonly usdaZoneCount: number;
  readonly lodVariant: UsdLodVariant;
  readonly roofCutawayVariant: UsdRoofCutawayVariant;
  readonly diagnosticMode: UsdViewportDiagnosticMode;
}

function round4(n: number): number {
  const v = Math.round(n * 1e4) / 1e4;
  return Object.is(v, -0) ? 0 : v;
}

function toVec3(v: THREE.Vector3): Vec3Tuple {
  return [round4(v.x), round4(v.y), round4(v.z)];
}

function quaternionToUsdRotateXYZDeg(q: THREE.Quaternion): Vec3Tuple {
  const euler = new THREE.Euler().setFromQuaternion(q, 'ZYX');
  const radToDeg = 180 / Math.PI;
  return [round4(euler.x * radToDeg), round4(euler.y * radToDeg), round4(euler.z * radToDeg)];
}

function classifyMeshPrimType(mesh: THREE.Mesh): UsdPrimTypeName {
  const geo = mesh.geometry;
  if (Array.isArray(mesh.material) && mesh.material.length > 1) {
    return 'Mesh';
  }
  if (geo instanceof THREE.BoxGeometry) {
    return 'Cube';
  }
  if (geo instanceof THREE.SphereGeometry) {
    const p = geo.parameters;
    const phiLen = p.phiLength ?? Math.PI * 2;
    const thetaLen = p.thetaLength ?? Math.PI;
    if (Math.abs(phiLen - Math.PI * 2) < 1e-2 && Math.abs(thetaLen - Math.PI) < 1e-2) {
      return 'Sphere';
    }
    return 'Mesh';
  }
  if (geo instanceof THREE.ConeGeometry) {
    return 'Cone';
  }
  if (geo instanceof THREE.CylinderGeometry) {
    const p = geo.parameters;
    const rTop = p.radiusTop ?? 1;
    const rBot = p.radiusBottom ?? 1;
    const thetaLen = p.thetaLength ?? Math.PI * 2;
    if (Math.abs(thetaLen - Math.PI * 2) < 1e-2) {
      if (rTop === 0 && rBot > 0) return 'Cone';
      if (Math.abs(rTop - rBot) < 1e-4 && rTop > 0) return 'Cylinder';
    }
    return 'Mesh';
  }
  return 'Mesh';
}

function hasPhysicsCollider(name: string, zoneId: string, isArchShell: boolean): boolean {
  if (isArchShell) return true;
  const lower = name.toLowerCase();
  if (
    lower.includes('floor') ||
    lower.includes('wall') ||
    lower.includes('slab') ||
    lower.includes('stair') ||
    lower.includes('step') ||
    lower.includes('tread') ||
    lower.includes('landing') ||
    lower.includes('door') ||
    lower.includes('counter') ||
    lower.includes('worktop') ||
    lower.includes('island') ||
    lower.includes('table') ||
    lower.includes('courtyard') ||
    lower.includes('driveway')
  ) {
    return true;
  }
  return zoneId === 'roofAndCeilings';
}

function resolveZoneForWorldBox(
  box: THREE.Box3,
  objectName: string,
  userDataZoneId: string | undefined,
  isCeilingLayer: boolean
): string {
  if (isCeilingLayer) return 'roofAndCeilings';
  if (
    objectName.startsWith('ufh.') ||
    objectName.startsWith('security.') ||
    objectName.startsWith('unifi.')
  ) {
    return 'securityAndMep';
  }
  if (userDataZoneId) {
    const matchingLayer = CROX_USD_ZONE_LAYERS.find((l) => l.zoneId === userDataZoneId);
    if (matchingLayer) return matchingLayer.zoneId;
  }
  const dotIdx = objectName.indexOf('.');
  if (dotIdx > 0) {
    const prefix = objectName.slice(0, dotIdx);
    const matchingLayer = CROX_USD_ZONE_LAYERS.find((l) => l.zoneId === prefix);
    if (matchingLayer) return matchingLayer.zoneId;
  }
  if (!box.isEmpty()) {
    const center = new THREE.Vector3();
    box.getCenter(center);
    for (const reg of CROX_FARMHOUSE_LOD_REGISTRATIONS) {
      const b = reg.bounds;
      if (
        center.x >= b.minX - 0.35 &&
        center.x <= b.maxX + 0.35 &&
        center.y >= b.minY - 0.35 &&
        center.y <= b.maxY + 0.45 &&
        center.z >= b.minZ - 0.35 &&
        center.z <= b.maxZ + 0.35
      ) {
        const matchingLayer = CROX_USD_ZONE_LAYERS.find((l) => l.zoneId === reg.zoneId);
        if (matchingLayer) return matchingLayer.zoneId;
      }
    }
  }
  return 'courtyard';
}

const PRIM_TYPE_COLORS: Readonly<Record<UsdPrimTypeName, number>> = {
  '': 0x94a3b8,
  Cube: 0x38bdf8, // Sky blue
  Cylinder: 0x2dd4bf, // Teal
  Capsule: 0x2dd4bf,
  Sphere: 0xfbbf24, // Amber
  Cone: 0xfb923c, // Orange
  Mesh: 0xc084fc, // Purple
  BasisCurves: 0xf472b6,
  Xform: 0x94a3b8,
  Scope: 0x64748b,
  Material: 0x94a3b8,
  Shader: 0x94a3b8,
  NodeGraph: 0x94a3b8,
  GeomSubset: 0xa78bfa,
  SphereLight: 0xfde047,
  DiskLight: 0xfde047,
  RectLight: 0xfde047,
  DistantLight: 0xfde047,
  DomeLight: 0xfde047,
  Camera: 0x60a5fa,
};

const ARCHETYPE_COLORS: Readonly<Record<UsdProceduralPatternKind, number>> = {
  brick_bond: 0xd95f43,
  herringbone_brick: 0xe07a5f,
  checker_tile: 0x38bdf8,
  wood_grain: 0xd4a373,
  natural_stone: 0x94a3b8,
  slate_tile: 0x64748b,
  cobblestone: 0x78716c,
  plaster_wall: 0xf3e5ab,
  woven_fabric: 0xa855f7,
  patterned_rug: 0xec4899,
  brushed_metal: 0x22d3ee,
  architectural_glass: 0x67e8f9,
  emissive_display: 0x4ade80,
  solid: 0x475569,
};

/**
 * Runtime OpenUSD Stage Controller for the Web App.
 *
 * Indexes the live Three.js scene into the canonical `/CroxFarmhouse` OpenUSD stage
 * hierarchy, allowing real-time:
 * - Sublayer muting/soloing (`usd/zones/*.usda`)
 * - VariantSet switching (`lod = hero | standard | shell`, `roofCutaway = fullBuilding | groundFloorCutaway`)
 * - Diagnostic shading modes (`primTypes`, `physicsColliders`, `materialArchetypes`, `pbr`)
 * - Live `#usda 1.0` prim inspection (`def Cube`, `def Cylinder`, `MaterialX`, `UsdPhysics`)
 * - Live `#usda 1.0` override & parametric prim (`def Cube` / `def Cylinder` / `def Sphere`) authoring
 */
export const INITIAL_INCREMENTAL_USDA_ZONES: readonly string[] = [
  'kitchen',
  'butlersPantry',
  'utility',
  'bootRoom',
];

export class UsdStageRuntimeController {
  private readonly sceneRoot: THREE.Scene;
  private readonly roots: readonly THREE.Object3D[];
  private readonly ceilingRoot: THREE.Object3D;
  private readonly groundCeilingRoot: THREE.Object3D;
  private readonly firstFloorRoot: THREE.Object3D;
  private readonly cutawayWallGroups: {
    readonly southWest: THREE.Group;
    readonly west: THREE.Group;
    readonly north: THREE.Group;
    readonly east: THREE.Group;
  };
  private readonly onRoofCutawayChanged?: (cutaway: boolean) => void;
  private readonly onZoneLoadedFromUsda?: (zoneId: string) => void;

  private readonly meshByUuid = new Map<string, THREE.Mesh>();
  private readonly primByUuid = new Map<string, UsdIndexedPrimInfo>();
  private readonly primByPath = new Map<string, UsdIndexedPrimInfo>();
  private readonly meshesByZone = new Map<string, THREE.Mesh[]>();
  private readonly mutedZones = new Set<string>();
  private readonly usdaBackedZones = new Set<string>();
  private usdaMaterialLibraryPromise: Promise<Map<string, THREE.Material>> | null = null;
  private readonly originalMaterials = new Map<string, THREE.Material | THREE.Material[]>();
  private readonly diagnosticMaterialCache = new Map<string, THREE.MeshStandardMaterial>();
  private readonly authoredOverrideGroup = new THREE.Group();

  private lodVariant: UsdLodVariant = 'hero';
  private roofCutawayVariant: UsdRoofCutawayVariant = 'groundFloorCutaway';
  private diagnosticMode: UsdViewportDiagnosticMode = 'pbr';
  private uniqueMaterialPaths = new Set<string>();
  private readonly listeners = new Set<() => void>();

  public constructor(options: {
    readonly scene: THREE.Scene;
    readonly firstFloorMeshGroup: THREE.Group;
    readonly groundFloorCeilingGroup: THREE.Group;
    readonly ceilingMeshGroup: THREE.Group;
    readonly cutawayWallGroups: {
      readonly southWest: THREE.Group;
      readonly west: THREE.Group;
      readonly north: THREE.Group;
      readonly east: THREE.Group;
    };
    readonly initialCeilingCutaway: boolean;
    readonly onRoofCutawayChanged?: (cutaway: boolean) => void;
    readonly onZoneLoadedFromUsda?: (zoneId: string) => void;
  }) {
    this.sceneRoot = options.scene;
    this.cutawayWallGroups = options.cutawayWallGroups;
    this.roots = [
      options.scene,
      options.firstFloorMeshGroup,
      options.groundFloorCeilingGroup,
      options.ceilingMeshGroup,
      options.cutawayWallGroups.southWest,
      options.cutawayWallGroups.west,
      options.cutawayWallGroups.north,
      options.cutawayWallGroups.east,
    ];
    this.ceilingRoot = options.ceilingMeshGroup;
    this.groundCeilingRoot = options.groundFloorCeilingGroup;
    this.firstFloorRoot = options.firstFloorMeshGroup;
    this.roofCutawayVariant = options.initialCeilingCutaway
      ? 'groundFloorCutaway'
      : 'fullBuilding';
    this.onRoofCutawayChanged = options.onRoofCutawayChanged;
    this.onZoneLoadedFromUsda = options.onZoneLoadedFromUsda;

    this.authoredOverrideGroup.name = 'usd.liveAuthoredPrims';
    options.scene.add(this.authoredOverrideGroup);

    this.indexStage();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): void {
    for (const l of this.listeners) {
      l();
    }
  }

  public isZoneUsdaBacked(zoneId: string): boolean {
    return this.usdaBackedZones.has(zoneId);
  }

  private async ensureUsdaMaterialLibrary(): Promise<Map<string, THREE.Material>> {
    if (!this.usdaMaterialLibraryPromise) {
      this.usdaMaterialLibraryPromise = fetch('/usd/materials/materials.usda')
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP ${res.status} fetching /usd/materials/materials.usda`);
          }
          return res.text();
        })
        .then((text) => parseUsdaMaterialLibrary(text));
    }
    return this.usdaMaterialLibraryPromise;
  }

  /**
   * Incrementally replaces a zone's TypeScript-built Three.js meshes with meshes
   * parsed and instantiated directly from `/usd/zones/<zoneId>.usda` and
   * `/usd/materials/materials.usda`, making the `.usda` file the live runtime
   * source of truth for that zone.
   */
  public async loadZoneFromUsdaFile(zoneId: string): Promise<boolean> {
    if (this.usdaBackedZones.has(zoneId)) {
      return true;
    }
    try {
      const [materials, zoneRes] = await Promise.all([
        this.ensureUsdaMaterialLibrary(),
        fetch(`/usd/zones/${zoneId}.usda`),
      ]);
      if (!zoneRes.ok) {
        return false;
      }
      const zoneUsdaText = await zoneRes.text();
      const loaded = parseAndInstantiateUsdaZone(zoneUsdaText, materials);
      if (loaded.topPrims.length === 0) {
        return false;
      }

      this.transferLiveMaterialsAndRemoveTypeScriptBranches(
        zoneId,
        loaded.topPrims.map((p) => p.object3d)
      );

      for (const topPrim of loaded.topPrims) {
        const container = this.resolveSceneLayerContainer(topPrim.sceneLayer);
        container.add(topPrim.object3d);
      }

      this.usdaBackedZones.add(zoneId);
      this.indexStage();
      this.syncVisibilityForZone(zoneId);
      this.onZoneLoadedFromUsda?.(zoneId);
      if (this.diagnosticMode !== 'pbr') {
        const currentMode = this.diagnosticMode;
        this.diagnosticMode = 'pbr';
        this.setDiagnosticMode(currentMode);
      } else {
        this.emit();
      }
      return true;
    } catch (err) {
      console.warn(`[OpenUSD Stage] Failed to load zone ${zoneId} from .usda:`, err);
      return false;
    }
  }

  public async loadZonesFromUsdaFiles(zoneIds: readonly string[]): Promise<number> {
    let loadedCount = 0;
    for (const zoneId of zoneIds) {
      const ok = await this.loadZoneFromUsdaFile(zoneId);
      if (ok) loadedCount++;
    }
    return loadedCount;
  }

  public async loadAllZonesFromUsdaFiles(): Promise<number> {
    return this.loadZonesFromUsdaFiles(CROX_USD_ZONE_LAYERS.map((z) => z.zoneId));
  }

  private resolveSceneLayerContainer(layer: UsdaSceneLayerTarget): THREE.Object3D {
    switch (layer) {
      case 'firstFloor':
        return this.firstFloorRoot;
      case 'groundCeiling':
        return this.groundCeilingRoot;
      case 'roof':
        return this.ceilingRoot;
      case 'cutaway.southWest':
        return this.cutawayWallGroups.southWest;
      case 'cutaway.west':
        return this.cutawayWallGroups.west;
      case 'cutaway.north':
        return this.cutawayWallGroups.north;
      case 'cutaway.east':
        return this.cutawayWallGroups.east;
      case 'ground':
      default:
        return this.sceneRoot;
    }
  }

  private transferLiveMaterialsAndRemoveTypeScriptBranches(
    zoneId: string,
    usdTopObjects: readonly THREE.Object3D[]
  ): void {
    const roofGroupSet = new Set<THREE.Object3D>([
      this.groundCeilingRoot,
      this.ceilingRoot,
    ]);
    const topLayerContainers = new Set<THREE.Object3D>([
      this.firstFloorRoot,
      this.groundCeilingRoot,
      this.ceilingRoot,
      this.cutawayWallGroups.southWest,
      this.cutawayWallGroups.west,
      this.cutawayWallGroups.north,
      this.cutawayWallGroups.east,
      this.authoredOverrideGroup,
    ]);

    const shouldKeepHelper = (obj: THREE.Object3D): boolean => {
      if (
        obj instanceof THREE.Light ||
        obj instanceof THREE.Camera ||
        obj instanceof THREE.Line ||
        obj instanceof THREE.Points
      ) {
        return true;
      }
      if (
        obj.userData?.isAnnotationGroup ||
        obj.userData?.isSecurityFovCone ||
        obj.name.startsWith('annotationMarker')
      ) {
        return true;
      }
      if (obj instanceof THREE.Mesh) {
        const firstMat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
        if (
          firstMat instanceof THREE.MeshBasicMaterial &&
          firstMat.blending === THREE.AdditiveBlending &&
          firstMat.depthWrite === false
        ) {
          return true;
        }
      }
      return false;
    };

    const isExportableUsdNode = (obj: THREE.Object3D): boolean => {
      if (shouldKeepHelper(obj)) return false;
      if (obj instanceof THREE.Mesh) return true;
      return obj.children.some(isExportableUsdNode);
    };

    const syncTsNodeToUsdNode = (
      tsNode: THREE.Object3D,
      usdNode: THREE.Object3D
    ): void => {
      if (tsNode instanceof THREE.Mesh && usdNode instanceof THREE.Mesh) {
        usdNode.castShadow = tsNode.castShadow;
        usdNode.receiveShadow = tsNode.receiveShadow;

        if (!Array.isArray(tsNode.material) && !Array.isArray(usdNode.material)) {
          usdNode.material = tsNode.material;
        } else if (
          Array.isArray(tsNode.material) &&
          Array.isArray(usdNode.material)
        ) {
          const uniqueMats: THREE.Material[] = [];
          for (const grp of tsNode.geometry.groups) {
            const m =
              tsNode.material[
                Math.min(grp.materialIndex ?? 0, tsNode.material.length - 1)
              ];
            if (m && !uniqueMats.includes(m)) {
              uniqueMats.push(m);
            }
          }
          if (uniqueMats.length === usdNode.material.length) {
            usdNode.material = uniqueMats;
          } else if (tsNode.material.length === usdNode.material.length) {
            usdNode.material = [...tsNode.material];
          }
        }
      }

      const tsExportableChildren = tsNode.children.filter(isExportableUsdNode);
      const usdChildren = usdNode.children.filter((c) => !shouldKeepHelper(c));

      for (const child of [...tsNode.children]) {
        if (shouldKeepHelper(child)) {
          usdNode.add(child);
          if (
            child instanceof THREE.SpotLight &&
            child.target &&
            child.target.parent === tsNode
          ) {
            usdNode.add(child.target);
          }
        }
      }

      const count = Math.min(tsExportableChildren.length, usdChildren.length);
      for (let i = 0; i < count; i++) {
        syncTsNodeToUsdNode(tsExportableChildren[i], usdChildren[i]);
      }
    };

    const tsBranches: {
      readonly parent: THREE.Object3D;
      readonly branch: THREE.Object3D;
    }[] = [];

    const collectFromContainer = (
      container: THREE.Object3D,
      isFirstFloor: boolean
    ): void => {
      for (const child of [...container.children]) {
        if (topLayerContainers.has(child) || shouldKeepHelper(child)) continue;
        if (child.userData?.isRoomContainer) {
          for (const sub of [...child.children]) {
            if (shouldKeepHelper(sub)) continue;
            if (classifyBranchZoneLayer(sub, roofGroupSet, isFirstFloor) === zoneId) {
              tsBranches.push({ parent: child, branch: sub });
            }
          }
          continue;
        }
        if (classifyBranchZoneLayer(child, roofGroupSet, isFirstFloor) === zoneId) {
          tsBranches.push({ parent: container, branch: child });
        }
      }
    };

    collectFromContainer(this.sceneRoot, false);
    collectFromContainer(this.cutawayWallGroups.southWest, false);
    collectFromContainer(this.cutawayWallGroups.west, false);
    collectFromContainer(this.cutawayWallGroups.north, false);
    collectFromContainer(this.cutawayWallGroups.east, false);
    collectFromContainer(this.firstFloorRoot, true);
    collectFromContainer(this.groundCeilingRoot, true);
    collectFromContainer(this.ceilingRoot, true);

    const exportableTsBranches = tsBranches
      .map((entry) => entry.branch)
      .filter(isExportableUsdNode);

    const pairCount = Math.min(exportableTsBranches.length, usdTopObjects.length);
    for (let i = 0; i < pairCount; i++) {
      syncTsNodeToUsdNode(exportableTsBranches[i], usdTopObjects[i]);
    }

    for (const { parent, branch } of tsBranches) {
      parent.remove(branch);
    }
  }

  public indexStage(): void {
    this.meshByUuid.clear();
    this.primByUuid.clear();
    this.primByPath.clear();
    this.meshesByZone.clear();
    this.uniqueMaterialPaths.clear();

    for (const layer of CROX_USD_ZONE_LAYERS) {
      this.meshesByZone.set(layer.zoneId, []);
    }

    const usedNamesPerZone = new Map<string, Set<string>>();
    const visited = new Set<string>();

    for (const root of this.roots) {
      const isCeilingLayer =
        root === this.ceilingRoot || root === this.groundCeilingRoot;
      root.updateMatrixWorld(true);

      root.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        if (visited.has(obj.uuid)) return;
        if (
          obj.userData?.isAnnotationGroup ||
          obj.userData?.isSecurityFovCone ||
          obj.name.startsWith('annotationMarker')
        ) {
          return;
        }
        // Skip additive light glow pools
        const firstMat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
        if (
          firstMat instanceof THREE.MeshBasicMaterial &&
          firstMat.blending === THREE.AdditiveBlending
        ) {
          return;
        }

        visited.add(obj.uuid);

        const box = new THREE.Box3().setFromObject(obj);
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        if (!box.isEmpty()) {
          box.getCenter(center);
          box.getSize(size);
        }

        let inheritedName = obj.name;
        let inheritedZoneId: string | undefined =
          typeof obj.userData?.zoneId === 'string'
            ? obj.userData.zoneId
            : typeof obj.userData?.zone === 'string'
              ? obj.userData.zone
              : undefined;
        let isArchShell = Boolean(obj.userData?.isArchitecturalShell);
        let lodTier: 0 | 1 | 2 = 0;
        let isUsdaSource = Boolean(obj.userData?.usdSourceOfTruth);

        let cur: THREE.Object3D | null = obj;
        while (cur) {
          if (!inheritedName && cur.name && !cur.name.endsWith('.scene')) {
            inheritedName = cur.name;
          }
          if (!inheritedZoneId) {
            if (typeof cur.userData?.zoneId === 'string') {
              inheritedZoneId = cur.userData.zoneId;
            } else if (typeof cur.userData?.zone === 'string') {
              inheritedZoneId = cur.userData.zone;
            }
          }
          if (cur.userData?.isArchitecturalShell) {
            isArchShell = true;
          }
          if (cur.userData?.usdSourceOfTruth) {
            isUsdaSource = true;
          }
          if (cur.userData?.lodTier === 2) {
            lodTier = 2;
          } else if (cur.userData?.lodTier === 1 && lodTier === 0) {
            lodTier = 1;
          }
          cur = cur.parent;
        }

        const zoneId = resolveZoneForWorldBox(
          box,
          inheritedName || obj.name,
          inheritedZoneId,
          isCeilingLayer
        );

        let zoneNames = usedNamesPerZone.get(zoneId);
        if (!zoneNames) {
          zoneNames = new Set<string>();
          usedNamesPerZone.set(zoneId, zoneNames);
        }

        const rawBaseName = inheritedName || obj.name || `Prim_${zoneNames.size + 1}`;
        const stripped = rawBaseName.startsWith(`${zoneId}.`)
          ? rawBaseName.slice(zoneId.length + 1)
          : rawBaseName;
        let primName = sanitizeUsdIdent(stripped, `Prim_${zoneNames.size + 1}`);
        if (zoneNames.has(primName)) {
          let suffix = 2;
          while (zoneNames.has(`${primName}_${suffix}`)) {
            suffix++;
          }
          primName = `${primName}_${suffix}`;
        }
        zoneNames.add(primName);

        const primPath = `/CroxFarmhouse/Zones/${zoneId}/${primName}`;
        const typeName = classifyMeshPrimType(obj);
        const physicsCollision = hasPhysicsCollider(
          inheritedName || obj.name,
          zoneId,
          isArchShell
        );

        const usdMatKind = firstMat?.userData?.proceduralKind as
          | UsdProceduralPatternKind
          | undefined;
        const previewSpec = firstMat
          ? convertThreeMaterialToUsdSpec(firstMat, inheritedName || obj.name)
          : null;
        const archetype: UsdProceduralPatternKind =
          usdMatKind ?? previewSpec?.proceduralPattern?.kind ?? 'solid';
        const matBaseName = firstMat?.name
          ? sanitizeUsdIdent(firstMat.name, 'Mat')
          : `Mat_${archetype}_${Math.round((previewSpec?.diffuseColor[0] ?? 0.8) * 255)
              .toString(16)
              .padStart(2, '0')}${Math.round((previewSpec?.diffuseColor[1] ?? 0.8) * 255)
              .toString(16)
              .padStart(2, '0')}${Math.round((previewSpec?.diffuseColor[2] ?? 0.8) * 255)
              .toString(16)
              .padStart(2, '0')}`;
        const materialPath =
          (firstMat?.userData?.usdMaterialPath as string | undefined) ??
          `/CroxFarmhouse/_Materials/${matBaseName}`;
        this.uniqueMaterialPaths.add(materialPath);

        const sublayerFile = `usd/zones/${zoneId}.usda`;

        const info: UsdIndexedPrimInfo = {
          uuid: obj.uuid,
          primPath,
          primName,
          objectName: inheritedName || obj.name || primName,
          typeName,
          zoneId,
          sublayerFile,
          kind: lodTier === 2 ? 'subcomponent' : 'component',
          purpose:
            zoneId === 'securityAndMep' &&
            (inheritedName.includes('frustum') || inheritedName.includes('ufh'))
              ? 'guide'
              : 'default',
          physicsCollision,
          lodTier,
          materialName: matBaseName,
          materialPath,
          materialArchetype: archetype,
          worldCenter: toVec3(center),
          worldSize: toVec3(size),
          usdaSourceOfTruth: isUsdaSource || this.usdaBackedZones.has(zoneId),
        };

        obj.userData.usdPrimPath = primPath;
        obj.userData.usdPrimInfo = info;

        this.meshByUuid.set(obj.uuid, obj);
        this.primByUuid.set(obj.uuid, info);
        this.primByPath.set(primPath, info);

        let zoneList = this.meshesByZone.get(zoneId);
        if (!zoneList) {
          zoneList = [];
          this.meshesByZone.set(zoneId, zoneList);
        }
        zoneList.push(obj);
      });
    }
  }

  public getStageStats(): UsdStageStatsSummary {
    let cubeCount = 0;
    let cylinderCount = 0;
    let sphereCount = 0;
    let coneCount = 0;
    let meshCount = 0;
    let colliderCount = 0;

    for (const info of this.primByUuid.values()) {
      if (info.typeName === 'Cube') cubeCount++;
      else if (info.typeName === 'Cylinder') cylinderCount++;
      else if (info.typeName === 'Sphere') sphereCount++;
      else if (info.typeName === 'Cone') coneCount++;
      else meshCount++;

      if (info.physicsCollision) colliderCount++;
    }

    return {
      totalPrims: this.primByUuid.size,
      cubeCount,
      cylinderCount,
      sphereCount,
      coneCount,
      meshCount,
      colliderCount,
      materialCount: this.uniqueMaterialPaths.size,
      sublayerCount: CROX_USD_ZONE_LAYERS.length,
      usdaZoneCount: this.usdaBackedZones.size,
      lodVariant: this.lodVariant,
      roofCutawayVariant: this.roofCutawayVariant,
      diagnosticMode: this.diagnosticMode,
    };
  }

  public getZoneSublayers(): readonly UsdZoneSublayerSummary[] {
    return CROX_USD_ZONE_LAYERS.map((layer) => {
      const meshes = this.meshesByZone.get(layer.zoneId) ?? [];
      let cubeCount = 0;
      let cylinderCount = 0;
      let sphereCount = 0;
      let coneCount = 0;
      let meshCount = 0;
      let colliderCount = 0;
      for (const m of meshes) {
        const info = this.primByUuid.get(m.uuid);
        if (!info) continue;
        if (info.typeName === 'Cube') cubeCount++;
        else if (info.typeName === 'Cylinder') cylinderCount++;
        else if (info.typeName === 'Sphere') sphereCount++;
        else if (info.typeName === 'Cone') coneCount++;
        else meshCount++;
        if (info.physicsCollision) colliderCount++;
      }
      return {
        zoneId: layer.zoneId,
        label: layer.label,
        fileName: `${layer.zoneId}.usda`,
        muted: this.mutedZones.has(layer.zoneId),
        sourceMode: this.usdaBackedZones.has(layer.zoneId) ? 'usda' : 'ts',
        totalPrims: meshes.length,
        cubeCount,
        cylinderCount,
        sphereCount,
        coneCount,
        meshCount,
        colliderCount,
      };
    });
  }

  public isZoneMuted(zoneId: string): boolean {
    return this.mutedZones.has(zoneId);
  }

  public setZoneMuted(zoneId: string, muted: boolean): void {
    if (muted) {
      this.mutedZones.add(zoneId);
    } else {
      this.mutedZones.delete(zoneId);
    }
    this.syncVisibilityForZone(zoneId);
    this.emit();
  }

  public setAllZonesMuted(muted: boolean): void {
    this.mutedZones.clear();
    if (muted) {
      for (const layer of CROX_USD_ZONE_LAYERS) {
        this.mutedZones.add(layer.zoneId);
      }
    }
    for (const layer of CROX_USD_ZONE_LAYERS) {
      this.syncVisibilityForZone(layer.zoneId);
    }
    this.emit();
  }

  public soloZone(zoneId: string): void {
    const allOthersMuted =
      !this.mutedZones.has(zoneId) &&
      this.mutedZones.size === CROX_USD_ZONE_LAYERS.length - 1;

    if (allOthersMuted) {
      // Un-solo back to all visible
      this.setAllZonesMuted(false);
      return;
    }

    this.mutedZones.clear();
    for (const layer of CROX_USD_ZONE_LAYERS) {
      if (layer.zoneId !== zoneId) {
        this.mutedZones.add(layer.zoneId);
      }
    }
    for (const layer of CROX_USD_ZONE_LAYERS) {
      this.syncVisibilityForZone(layer.zoneId);
    }
    this.emit();
  }

  private syncVisibilityForZone(zoneId: string): void {
    const meshes = this.meshesByZone.get(zoneId) ?? [];
    const zoneMuted = this.mutedZones.has(zoneId);
    for (const mesh of meshes) {
      const info = this.primByUuid.get(mesh.uuid);
      if (!info) continue;
      if (zoneMuted) {
        mesh.visible = false;
        continue;
      }
      if (this.lodVariant === 'shell' && info.lodTier >= 1) {
        mesh.visible = false;
        continue;
      }
      if (this.lodVariant === 'standard' && info.lodTier >= 2) {
        mesh.visible = false;
        continue;
      }
      mesh.visible = true;
    }
  }

  public getLodVariant(): UsdLodVariant {
    return this.lodVariant;
  }

  public setLodVariant(variant: UsdLodVariant): void {
    if (this.lodVariant === variant) return;
    this.lodVariant = variant;
    for (const layer of CROX_USD_ZONE_LAYERS) {
      this.syncVisibilityForZone(layer.zoneId);
    }
    this.emit();
  }

  public getRoofCutawayVariant(): UsdRoofCutawayVariant {
    return this.roofCutawayVariant;
  }

  public setRoofCutawayVariant(variant: UsdRoofCutawayVariant): void {
    this.roofCutawayVariant = variant;
    const isCutaway = variant === 'groundFloorCutaway';
    this.onRoofCutawayChanged?.(isCutaway);
    this.emit();
  }

  public getDiagnosticMode(): UsdViewportDiagnosticMode {
    return this.diagnosticMode;
  }

  public setDiagnosticMode(mode: UsdViewportDiagnosticMode): void {
    if (this.diagnosticMode === mode) return;
    this.diagnosticMode = mode;

    if (mode === 'pbr') {
      for (const [uuid, origMat] of this.originalMaterials.entries()) {
        const mesh = this.meshByUuid.get(uuid);
        if (mesh) {
          mesh.material = origMat;
        }
      }
      this.originalMaterials.clear();
      this.emit();
      return;
    }

    for (const [uuid, mesh] of this.meshByUuid.entries()) {
      if (!this.originalMaterials.has(uuid)) {
        this.originalMaterials.set(uuid, mesh.material);
      }
      const info = this.primByUuid.get(uuid);
      if (!info) continue;

      if (mode === 'primTypes') {
        const hex = PRIM_TYPE_COLORS[info.typeName] ?? 0x94a3b8;
        mesh.material = this.getOrCreateDiagnosticMat(`type:${info.typeName}`, hex, false, 1.0);
      } else if (mode === 'physicsColliders') {
        if (info.physicsCollision) {
          mesh.material = this.getOrCreateDiagnosticMat('phys:collider', 0x10b981, true, 0.92);
        } else {
          mesh.material = this.getOrCreateDiagnosticMat('phys:noncollider', 0x1e293b, false, 0.22);
        }
      } else if (mode === 'materialArchetypes') {
        const hex = ARCHETYPE_COLORS[info.materialArchetype] ?? 0x64748b;
        mesh.material = this.getOrCreateDiagnosticMat(
          `arch:${info.materialArchetype}`,
          hex,
          false,
          1.0
        );
      }
    }

    this.emit();
  }

  private getOrCreateDiagnosticMat(
    key: string,
    colorHex: number,
    wireframeOverlay: boolean,
    opacity: number
  ): THREE.MeshStandardMaterial {
    const cached = this.diagnosticMaterialCache.get(key);
    if (cached) return cached;

    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: wireframeOverlay ? 0.35 : 0.55,
      metalness: 0.08,
      transparent: opacity < 1,
      opacity,
      side: THREE.DoubleSide,
    });
    this.diagnosticMaterialCache.set(key, mat);
    return mat;
  }

  public getPrimInfoByMesh(mesh: THREE.Object3D): UsdIndexedPrimInfo | null {
    let cur: THREE.Object3D | null = mesh;
    while (cur) {
      const info = this.primByUuid.get(cur.uuid);
      if (info) return info;
      cur = cur.parent;
    }
    return null;
  }

  public getPrimInfoByPath(primPath: string): UsdIndexedPrimInfo | null {
    return this.primByPath.get(primPath) ?? null;
  }

  public searchPrims(query: string, limit = 40): readonly UsdIndexedPrimInfo[] {
    const q = query.trim().toLowerCase();
    const results: UsdIndexedPrimInfo[] = [];
    for (const info of this.primByUuid.values()) {
      if (
        !q ||
        info.primPath.toLowerCase().includes(q) ||
        info.objectName.toLowerCase().includes(q) ||
        info.typeName.toLowerCase().includes(q) ||
        info.materialArchetype.toLowerCase().includes(q)
      ) {
        results.push(info);
        if (results.length >= limit) break;
      }
    }
    return results;
  }

  /**
   * Generates the live `#usda 1.0` prim specification snippet for a given `UsdIndexedPrimInfo`.
   */
  public formatPrimUsdaSnippet(info: UsdIndexedPrimInfo): string {
    const mesh = this.meshByUuid.get(info.uuid);
    if (!mesh) return `# Prim ${info.primPath} not found`;

    mesh.updateMatrixWorld(true);
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    mesh.matrixWorld.decompose(pos, quat, scale);

    const prim: UsdPrim = {
      specifier: 'def',
      typeName: info.typeName,
      name: info.primName,
      metadata: {
        kind: info.kind,
      },
      purpose: info.purpose !== 'default' ? info.purpose : undefined,
      materialBindingPath: info.materialPath,
      collisionEnabled: info.physicsCollision || undefined,
      xform: {
        translate: toVec3(pos),
        rotateXYZDeg: quaternionToUsdRotateXYZDeg(quat),
        scale: toVec3(scale),
      },
      customAttributes: {
        'twin:zoneId': { type: 'token', value: info.zoneId },
        'twin:objectName': { type: 'string', value: info.objectName },
        'twin:materialArchetype': { type: 'token', value: info.materialArchetype },
        'twin:lodTier': { type: 'int', value: info.lodTier },
      },
      ...(info.typeName === 'Cube' ? { cube: { size: 1 } } : {}),
      ...(info.typeName === 'Sphere' ? { sphere: { radius: 1 } } : {}),
      ...(info.typeName === 'Cylinder'
        ? { cylinder: { radius: 1, height: 1, axis: 'Y' } }
        : {}),
      ...(info.typeName === 'Cone' ? { cone: { radius: 1, height: 1, axis: 'Y' } } : {}),
    };

    const doc = serializeUsdaStage({
      defaultPrim: info.primName,
      doc: `Prim Path: ${info.primPath} (${info.sublayerFile})`,
      metersPerUnit: 1,
      upAxis: 'Y',
      prims: [prim],
    });
    return doc.trim();
  }

  /**
   * Parses and applies a `#usda 1.0` layer in real time:
   * 1. Applies any `over "..."` transform/visibility overrides to existing scene prims.
   * 2. Instantiates any new `def Cube`, `def Cylinder`, `def Sphere`, or `def Cone` prims
   *    authored in the `#usda 1.0` text directly into the live 3D scene!
   */
  public applyLiveUsdaLayerText(usdaText: string): {
    readonly overridesApplied: number;
    readonly primsCreated: number;
  } {
    const overrides = parseUsdaOverrideLayer(usdaText);
    const overridesApplied = applyUsdOverridesToScene(
      [...this.roots, this.firstFloorRoot],
      overrides
    );

    // Clear previously authored dynamic prims and parse any `def Cube|Cylinder|Sphere|Cone` blocks
    while (this.authoredOverrideGroup.children.length > 0) {
      const child = this.authoredOverrideGroup.children[0];
      this.authoredOverrideGroup.remove(child);
    }

    const createdPrims = this.instantiateAuthoredParametricPrims(usdaText);
    this.emit();
    return { overridesApplied, primsCreated: createdPrims };
  }

  private instantiateAuthoredParametricPrims(usdaText: string): number {
    let created = 0;
    const defRegex =
      /def\s+(Cube|Cylinder|Sphere|Cone)\s+"([^"]+)"[\s\S]*?\{([\s\S]*?)\}/g;
    let match: RegExpExecArray | null = defRegex.exec(usdaText);

    while (match !== null) {
      const typeName = match[1] as 'Cube' | 'Cylinder' | 'Sphere' | 'Cone';
      const primName = match[2];
      const body = match[3];

      const parseTuple = (propName: string, fallback: Vec3Tuple): Vec3Tuple => {
        const m = body.match(
          new RegExp(
            `${propName}\\s*=\\s*\\(\\s*([-+\\d.eE]+)\\s*,\\s*([-+\\d.eE]+)\\s*,\\s*([-+\\d.eE]+)\\s*\\)`
          )
        );
        if (!m) return fallback;
        return [Number(m[1]), Number(m[2]), Number(m[3])];
      };

      const parseNum = (propName: string, fallback: number): number => {
        const m = body.match(new RegExp(`${propName}\\s*=\\s*([-+\\d.eE]+)`));
        return m ? Number(m[1]) : fallback;
      };

      const translate = parseTuple('xformOp:translate', [0, 1, 0]);
      const rotateDeg = parseTuple('xformOp:rotateXYZ', [0, 0, 0]);
      const scale = parseTuple('xformOp:scale', [1, 1, 1]);
      const color = parseTuple('primvars:displayColor', [0.82, 0.68, 0.48]);

      let geo: THREE.BufferGeometry;
      if (typeName === 'Cube') {
        const s = parseNum('double size', 1);
        geo = new THREE.BoxGeometry(s, s, s);
      } else if (typeName === 'Cylinder') {
        const r = parseNum('double radius', 0.5);
        const h = parseNum('double height', 1);
        geo = new THREE.CylinderGeometry(r, r, h, 24);
      } else if (typeName === 'Sphere') {
        const r = parseNum('double radius', 0.5);
        geo = new THREE.SphereGeometry(r, 24, 18);
      } else {
        const r = parseNum('double radius', 0.5);
        const h = parseNum('double height', 1);
        geo = new THREE.ConeGeometry(r, h, 24);
      }

      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color[0], color[1], color[2]),
        roughness: 0.45,
        metalness: 0.1,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = `usdOverride.${primName}`;
      mesh.position.set(translate[0], translate[1], translate[2]);
      const degToRad = Math.PI / 180;
      mesh.rotation.set(
        rotateDeg[0] * degToRad,
        rotateDeg[1] * degToRad,
        rotateDeg[2] * degToRad,
        'ZYX'
      );
      mesh.scale.set(scale[0], scale[1], scale[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.authoredOverrideGroup.add(mesh);
      created++;

      match = defRegex.exec(usdaText);
    }

    return created;
  }
}
