import * as THREE from 'three';
import { setRoomZoneRegistrations } from '../rooms/room-zone-registry.ts';
import type { RoomLodController } from '../lod/lod-manager.ts';
import type { CircuitId } from '../../core/types/knx.ts';
import type { Vec3Tuple } from '../../core/types/scene.ts';
import type {
  BifoldPanelRef,
  CutawayWallGroups,
  LightCircuitGroup,
  LightGroupMap,
  SceneBuilderContext,
  ZoneIndicatorMaterials,
} from './scene-types.ts';
import {
  createRadialGlowTexture,
  createTVArtGalleryTextures,
  createTVOffTexture,
} from '../textures/procedural-textures.ts';
import { applyUsdOverridesToScene } from '../usd/usda-override-layer.ts';
import { SceneInteractionManager } from '../interaction/interaction-manager.ts';
import type {
  PropertySceneProfile,
  SecurityOverlay3D,
  UfhSystemOverlay3D,
} from './property-scene-profile.ts';
import type { SceneZoneRegistry } from './scene-zone-registry.ts';

export interface ScopedBuilderContextOptions {
  readonly name: string;
  readonly offset?: Vec3Tuple;
  readonly rotationY?: number;
}

/**
 * Creates a hierarchical child `SceneBuilderContext` whose scene, first-floor,
 * ground-floor ceiling, roof, cutaway-wall, and glow-pool layers are parented inside
 * transformed `THREE.Group` containers. Every mesh or group added to this context
 * inherits the parent wing/room transform (`offset` and `rotationY`) automatically.
 */
export function createScopedBuilderContext(
  parentCtx: SceneBuilderContext,
  options: ScopedBuilderContextOptions
): SceneBuilderContext {
  const [dx, dy, dz] = options.offset ?? [0, 0, 0];
  const rotY = options.rotationY ?? 0;

  const makeLayerGroup = (
    parentLayer: THREE.Object3D,
    suffix: string,
    isArchShell = false
  ): THREE.Group => {
    const g = new THREE.Group();
    g.name = `${options.name}.${suffix}`;
    g.position.set(dx, dy, dz);
    g.rotation.y = rotY;
    g.userData = {
      isRoomContainer: true,
      containerOffset: [dx, dy, dz] as const,
      containerRotationY: rotY,
      ...(isArchShell ? { isArchitecturalShell: true } : {}),
    };
    parentLayer.add(g);
    return g;
  };

  const scopedSceneGroup = makeLayerGroup(parentCtx.scene, 'scene');
  const scopedFirstFloorGroup = makeLayerGroup(parentCtx.firstFloorMeshGroup, 'firstFloor');
  const scopedGroundCeilingGroup = makeLayerGroup(
    parentCtx.groundFloorCeilingGroup,
    'groundCeiling',
    true
  );
  const scopedCeilingGroup = makeLayerGroup(parentCtx.ceilingMeshGroup, 'roof', true);
  const scopedCutawayWallGroups: CutawayWallGroups = {
    southWest: makeLayerGroup(parentCtx.cutawayWallGroups.southWest, 'cutaway.southWest', true),
    west: makeLayerGroup(parentCtx.cutawayWallGroups.west, 'cutaway.west', true),
    north: makeLayerGroup(parentCtx.cutawayWallGroups.north, 'cutaway.north', true),
    east: makeLayerGroup(parentCtx.cutawayWallGroups.east, 'cutaway.east', true),
  };

  const cosR = Math.cos(rotY);
  const sinR = Math.sin(rotY);

  return {
    ...parentCtx,
    scene: scopedSceneGroup as unknown as THREE.Scene,
    firstFloorMeshGroup: scopedFirstFloorGroup,
    groundFloorCeilingGroup: scopedGroundCeilingGroup,
    ceilingMeshGroup: scopedCeilingGroup,
    cutawayWallGroups: scopedCutawayWallGroups,
    addGlowPool: (circuitId, x, y, z, radius, maxOpacity = 0.35, rotX = -Math.PI / 2) => {
      const wx = x * cosR + z * sinR + dx;
      const wy = y + dy;
      const wz = -x * sinR + z * cosR + dz;
      parentCtx.addGlowPool(circuitId, wx, wy, wz, radius, maxOpacity, rotX);
    },
  };
}

/**
 * Top-level visibility layers of a property scene. Each layer is toggled as a
 * whole by the cutaway controller (first floor, ground-floor ceiling, roof and
 * the four camera-facing wall groups).
 */
export interface PropertySceneLayers {
  readonly scene: THREE.Scene;
  readonly firstFloorMeshGroup: THREE.Group;
  readonly groundFloorCeilingGroup: THREE.Group;
  readonly ceilingMeshGroup: THREE.Group;
  readonly cutawayWallGroups: CutawayWallGroups;
}

export interface RoomSwitchLedBinding {
  readonly circuitId: CircuitId;
  readonly mat: THREE.MeshStandardMaterial;
}

/** Everything produced by building a home's zone modules into the scene layers. */
export interface PropertySceneContent<TSecurity extends SecurityOverlay3D> {
  readonly lightGroups: LightGroupMap;
  readonly glowPoolGeometry: THREE.PlaneGeometry;
  readonly bifoldPanels: readonly BifoldPanelRef[];
  readonly interactiveMeshes: THREE.Object3D[];
  readonly interactions: SceneInteractionManager;
  readonly roomSwitchLedMats: readonly RoomSwitchLedBinding[];
  readonly indicatorMats: ZoneIndicatorMaterials;
  readonly security: TSecurity;
  readonly ufhSystem: UfhSystemOverlay3D | null;
  readonly tvArtTextures: readonly THREE.CanvasTexture[];
  readonly tvOffTexture: THREE.CanvasTexture;
}

export interface BuildPropertySceneContentOptions<TSecurity extends SecurityOverlay3D> {
  readonly profile: PropertySceneProfile<TSecurity>;
  readonly registry: SceneZoneRegistry;
  readonly lodController: RoomLodController;
  readonly ceilingCutaway: boolean;
}

/**
 * Creates the top-level layer groups, tags them as architectural shell and adds
 * them to `scene` (first floor, ground ceiling, roof, then SW/W/N/E walls).
 */
export function createPropertySceneLayers(scene: THREE.Scene): PropertySceneLayers {
  const firstFloorMeshGroup = new THREE.Group();
  const groundFloorCeilingGroup = new THREE.Group();
  const ceilingMeshGroup = new THREE.Group();
  const cutawayWallGroups: CutawayWallGroups = {
    southWest: new THREE.Group(),
    west: new THREE.Group(),
    north: new THREE.Group(),
    east: new THREE.Group(),
  };

  groundFloorCeilingGroup.userData.isArchitecturalShell = true;
  ceilingMeshGroup.userData.isArchitecturalShell = true;
  cutawayWallGroups.southWest.userData.isArchitecturalShell = true;
  cutawayWallGroups.west.userData.isArchitecturalShell = true;
  cutawayWallGroups.north.userData.isArchitecturalShell = true;
  cutawayWallGroups.east.userData.isArchitecturalShell = true;

  scene.add(firstFloorMeshGroup);
  scene.add(groundFloorCeilingGroup);
  scene.add(ceilingMeshGroup);
  scene.add(
    cutawayWallGroups.southWest,
    cutawayWallGroups.west,
    cutawayWallGroups.north,
    cutawayWallGroups.east
  );

  return {
    scene,
    firstFloorMeshGroup,
    groundFloorCeilingGroup,
    ceilingMeshGroup,
    cutawayWallGroups,
  };
}

function createLightGroups(maxIntensities: Readonly<Record<CircuitId, number>>): LightGroupMap {
  const groups: Partial<Record<CircuitId, LightCircuitGroup>> = {};
  for (const [circuitId, maxIntensity] of Object.entries(maxIntensities) as Array<
    [CircuitId, number]
  >) {
    groups[circuitId] = { lights: [], emissives: [], cones: [], pools: [], maxIntensity };
  }
  return groups as LightGroupMap;
}

/**
 * Builds every registered zone module (and the security overlay) into `layers`
 * and indexes the result for room LOD.
 *
 * This is the single code path used both by the runtime `PropertyScene` and by
 * the headless snapshot harness (`tools/snapshot`), so the snapshot exercises
 * exactly what ships.
 */
export function buildPropertySceneContent<TSecurity extends SecurityOverlay3D>(
  layers: PropertySceneLayers,
  options: BuildPropertySceneContentOptions<TSecurity>
): PropertySceneContent<TSecurity> {
  setRoomZoneRegistrations(options.profile.lodRegistrations);
  const { scene, firstFloorMeshGroup } = layers;

  const radialGlowTex = createRadialGlowTexture();
  const glowPoolGeometry = new THREE.PlaneGeometry(1, 1);
  const lightGroups = createLightGroups(options.profile.circuitMaxIntensity);

  const bifoldPanels: BifoldPanelRef[] = [];
  const interactiveMeshes: THREE.Object3D[] = [];
  const interactions = new SceneInteractionManager(interactiveMeshes);
  if (options.profile.doorPolicy) interactions.setDoorPolicy(options.profile.doorPolicy);
  const roomSwitchLedMats: RoomSwitchLedBinding[] = [];

  const ctx: SceneBuilderContext = {
    scene,
    firstFloorMeshGroup,
    groundFloorCeilingGroup: layers.groundFloorCeilingGroup,
    ceilingMeshGroup: layers.ceilingMeshGroup,
    ceilingCutaway: options.ceilingCutaway,
    cutawayWallGroups: layers.cutawayWallGroups,
    bifoldPanels,
    interactiveMeshes,
    interactions,
    lightGroups,
    addGlowPool: (circuitId, x, y, z, radius, maxOpacity = 0.35, rotX = -Math.PI / 2) => {
      const mat = new THREE.MeshBasicMaterial({
        map: radialGlowTex,
        transparent: true,
        opacity: maxOpacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(glowPoolGeometry, mat);
      mesh.position.set(x, y, z);
      mesh.scale.set(radius * 2, radius * 2, 1);
      mesh.rotation.x = rotX;
      if (y >= 2.2) {
        firstFloorMeshGroup.add(mesh);
      } else {
        scene.add(mesh);
      }
      lightGroups[circuitId].pools.push({ mat, maxOpacity });
    },
    registerSwitchLedMaterial: (circuitId, mat) => {
      roomSwitchLedMats.push({ circuitId, mat });
    },
  };

  const tvArtTextures = createTVArtGalleryTextures();
  const tvOffTexture = createTVOffTexture();

  // Build all registered 3D zone modules across the property (main house, annex & grounds).
  const indicatorMats = options.registry.buildAllZones(ctx);
  const security = options.profile.buildSecurityOverlay(ctx);
  const ufhSystem = options.profile.buildUfhOverlay?.(ctx) ?? null;

  // Apply non-destructive OpenUSD (`#usda 1.0`) override layer transforms if present.
  if (options.profile.usdOverrides && options.profile.usdOverrides.length > 0) {
    applyUsdOverridesToScene([scene, firstFloorMeshGroup], options.profile.usdOverrides);
  }

  // Index all room furniture (LOD1) and fine hero props (LOD2) across ground & first floors.
  options.lodController.indexBuiltSceneHierarchy([scene, firstFloorMeshGroup]);

  return {
    lightGroups,
    glowPoolGeometry,
    bifoldPanels,
    interactiveMeshes,
    interactions,
    roomSwitchLedMats,
    indicatorMats,
    security,
    ufhSystem,
    tvArtTextures,
    tvOffTexture,
  };
}
