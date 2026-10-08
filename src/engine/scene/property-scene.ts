import * as THREE from 'three';
import type {
  AccessPointEntityState,
  CctvCameraEntityState,
  LodPolicyMode,
  RoomLodDiagnostics,
} from '../../core/entities.ts';
import { RoomLodController } from '../lod/lod-manager.ts';
import type { CircuitLevels } from '../../types/knx.ts';
import type {
  AnnotationToolMode,
  CameraPresetName,
  FloorViewMode,
  GizmoTransformMode,
  InteractiveUserData,
  LiveMeasurePreviewState,
  SceneAnnotationHit,
  SceneAnnotationRecord,
  SceneCameraPoseSnapshot,
  TimeOfDay,
} from '../../types/scene.ts';
import type { RoomZoneId } from '../../types/topology.ts';
import type { GraphicsMode, GraphicsTierSettings, TradeView } from '../../types/twin-ux.ts';
import {
  PerformanceGovernor,
  detectDeviceProfile,
  estimateInitialTier,
  getDeviceCacheKey,
  getPointLightBudget,
  readCachedPerf,
  updateCachedTier,
  type PerformanceGovernorStats,
} from '../perf/index.ts';
import { RoomTracker } from './room-tracker.ts';
import { TradeViewController, classifyScene } from '../trade-views/index.ts';
import { STANDING_EYE_HEIGHT } from './controllers/walkthrough/walkthrough-spawns.ts';
import type { RoomZoneLodRegistration } from '../../core/entities.ts';
import { round3 } from '../annotation/annotation-system.ts';
import {
  SceneAnnotationController,
  type MeasureCompleteCallback,
  type ObjectTransformChangeCallback,
} from './controllers/annotation-controller.ts';
import { BifoldDoorAnimator } from './controllers/bifold-animator.ts';
import { CameraRig, type RigCamera } from './controllers/camera-rig.ts';
import { CircuitLightingController } from './controllers/circuit-lighting.ts';
import { CutawayController } from './controllers/cutaway-controller.ts';
import { EnvironmentLighting } from './controllers/environment-lighting.ts';
import {
  PostProcessingPipeline,
  type GraphicsQualityPreset,
  type GraphicsSettingsState,
} from './controllers/post-processing-pipeline.ts';
import {
  DEFAULT_WALKTHROUGH_SPAWNS,
  WalkthroughController,
} from './controllers/walkthrough-controller.ts';
import type { SceneInteractionManager } from './interaction-manager.ts';
import { applySelectiveBevelModifier } from './bevel-modifier.ts';
import { isObjectVisibleInHierarchy } from './object-utils.ts';
import type {
  PropertySceneProfile,
  SecurityOverlay3D,
  UfhSystemOverlay3D,
  UfhZoneId,
} from './property-scene-profile.ts';
import {
  buildPropertySceneContent,
  createPropertySceneLayers,
  type PropertySceneContent,
  type PropertySceneLayers,
} from './scene-content.ts';
import type { SceneZoneRegistry } from './scene-zone-registry.ts';
import { SceneBatchOptimizer } from './scene-batch-optimizer.ts';
import { installShaderLightCulling } from './shader-light-culling.ts';
import {
  type UsdIndexedPrimInfo,
  UsdStageRuntimeController,
} from '../usd/stage-runtime.ts';

export type { MovableTargetCandidate } from './controllers/annotation-controller.ts';

/** Camera + floor state published to view listeners (e.g. the focus HUD). */
export interface PropertySceneViewState {
  readonly cameraPosition: THREE.Vector3;
  readonly target: THREE.Vector3;
  readonly isOrthographic: boolean;
  readonly orthoZoom: number;
  readonly floorViewMode: FloorViewMode;
}

/** Room framing target for `flyToRoomBounds`. */
export interface RoomFramingBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly minZ: number;
  readonly maxZ: number;
}

/**
 * Home-agnostic 3D property scene.
 *
 * A thin facade that owns the renderer and render loop and composes focused
 * controllers:
 * - `CameraRig`: cameras, orbit controls, fly-to tweens
 * - `CutawayController`: floor focus, ceiling/roof/wall cutaways, LOD evaluation
 * - `EnvironmentLighting` / `CircuitLightingController`: sky + KNX-driven visuals
 * - `BifoldDoorAnimator`: bifold door animation
 * - `SceneAnnotationController`: pin / measure / move-rotate authoring tools
 *
 * Home-specific data comes from a `PropertySceneProfile`.
 */
export class PropertyScene<TSecurity extends SecurityOverlay3D = SecurityOverlay3D> {
  private readonly canvas: HTMLCanvasElement;
  private readonly onObjectInteraction: (data: InteractiveUserData) => void;
  private readonly zoneRegistry: SceneZoneRegistry;
  private readonly lodController: RoomLodController;
  private needsRender = true;

  private readonly scene: THREE.Scene;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly postProcessing: PostProcessingPipeline;
  private readonly rig: CameraRig;
  private readonly layers: PropertySceneLayers;
  private readonly annotations: SceneAnnotationController;
  private readonly environment: EnvironmentLighting;
  private readonly content: PropertySceneContent<TSecurity>;
  private readonly circuitLighting: CircuitLightingController;
  private readonly cutaways: CutawayController;
  private readonly bifolds: BifoldDoorAnimator;
  private readonly interactions: SceneInteractionManager;
  private readonly batchOptimizer: SceneBatchOptimizer;
  private readonly usdRuntime: UsdStageRuntimeController;
  private readonly walkthrough: WalkthroughController;

  private readonly raycaster = new THREE.Raycaster();
  private readonly pointer = new THREE.Vector2();
  private pointerDownPos = { x: 0, y: 0 };

  private readonly viewListeners = new Set<(view: PropertySceneViewState) => void>();
  private lastWalkthroughViewNotifyMs = 0;
  private postBlurSettleFrames = 0;
  private lastDoorShadowUpdateMs = 0;
  private doorsWereAnimating = false;
  private onSurfaceDoubleClick: ((point: THREE.Vector3) => void) | null = null;
  private onUsdPrimPick: ((info: UsdIndexedPrimInfo) => void) | null = null;

  private readonly lodRegistrations: readonly RoomZoneLodRegistration[];
  private readonly roomTracker: RoomTracker;
  private readonly footScratch = new THREE.Vector3();
  private readonly governor: PerformanceGovernor;
  private readonly tradeViews: TradeViewController;
  private userInteracting = false;
  private graphicsToastListener: ((message: string) => void) | null = null;

  public constructor(
    canvas: HTMLCanvasElement,
    onObjectInteraction: (data: InteractiveUserData) => void,
    profile: PropertySceneProfile<TSecurity>
  ) {
    installShaderLightCulling();

    this.canvas = canvas;
    this.onObjectInteraction = onObjectInteraction;
    this.zoneRegistry = profile.createZoneRegistry();
    this.lodController = new RoomLodController(profile.lodRegistrations);
    this.lodRegistrations = profile.lodRegistrations;
    this.roomTracker = new RoomTracker({
      registrations: profile.lodRegistrations,
      onChange: (zoneId) => this.setCurrentRoomId(zoneId),
    });

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f1318);
    this.scene.fog = new THREE.FogExp2(0x0f1318, 0.022);

    this.rig = new CameraRig(canvas, (camera) => this.annotations.setCamera(camera));

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.setPixelRatio(1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;

    this.postProcessing = new PostProcessingPipeline(
      this.renderer,
      canvas.clientWidth,
      canvas.clientHeight
    );

    this.rig.controls.addEventListener('change', () => {
      this.updateCameraFacingWallCutaways();
      this.needsRender = true;
    });

    this.layers = createPropertySceneLayers(this.scene);
    this.cutaways = new CutawayController(this.layers, this.zoneRegistry, this.lodController);

    this.walkthrough = new WalkthroughController({
      canvas,
      scene: this.scene,
      rig: this.rig,
      getRoomMinYAt: (x, y, z) => {
        let bestMinY: number | null = null;
        let bestDistY = Number.POSITIVE_INFINITY;
        for (const reg of profile.lodRegistrations) {
          if (reg.zoneId === 'courtyard') continue;
          // Exclude the outdoor courtyard cutout from the L-shaped upperLanding bounding box
          if (reg.zoneId === 'upperLanding' && x > -16.95 && z > 2.65) {
            continue;
          }
          const b = reg.bounds;
          if (x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) {
            // Map sub-floor UFH/cellar bounding-box minYs to actual room walking floor elevations
            const walkingFloorY =
              reg.zoneId === 'mainBedroom'
                ? 2.34
                : b.minY >= 1.5
                  ? 2.16
                  : reg.zoneId === 'familyRoom'
                  ? 0.0
                  : reg.zoneId === 'bootLobby' || reg.zoneId === 'hall'
                    ? -0.3
                    : reg.zoneId === 'livingRoom' ||
                        reg.zoneId === 'entranceHall' ||
                        reg.zoneId === 'sittingRoom' ||
                        reg.zoneId === 'study'
                      ? -0.6
                      : b.minY;
            const distY = Math.abs(y - walkingFloorY);
            if (distY <= 0.95 && distY < bestDistY) {
              bestDistY = distY;
              bestMinY = walkingFloorY;
            }
          }
        }
        return bestMinY;
      },
      getInteractiveMeshes: () => this.content?.interactiveMeshes ?? [],
      describeInteractable: (mesh) =>
        this.interactions.describeInteractable(mesh, this.bifolds.isOpen()),
      onInteractWithMesh: (mesh) => this.triggerInteractiveObject(mesh),
      onTriggerGolfSimulatorShot: () => {
        const triggered = this.interactions.triggerGolfSimulatorShot();
        if (triggered) {
          this.needsRender = true;
        }
        return triggered;
      },
      getGolfSimulatorShotElapsedSec: () =>
        this.interactions.getGolfSimulatorShotElapsedSec(),
      getGolfSimulatorPrompt: () => this.interactions.getGolfSimulatorPromptLabel(),
      onBargeWalkthroughDoor: (
        interactableId,
        isSprinting,
        footX,
        footY,
        footZ,
        moveDirX,
        moveDirZ
      ) => {
        const barged = this.interactions.bargeOpenWalkthroughDoor(
          interactableId,
          isSprinting,
          footX,
          footY,
          footZ,
          moveDirX,
          moveDirZ
        );
        if (barged) {
          this.needsRender = true;
        }
        return barged;
      },
      onProximityBargeDoors: (footX, footY, footZ, moveDirX, moveDirZ, isSprinting) => {
        const barged = this.interactions.bargeNearbyWalkthroughDoors(
          footX,
          footY,
          footZ,
          moveDirX,
          moveDirZ,
          isSprinting
        );
        if (barged) {
          this.needsRender = true;
        }
        return barged;
      },
      onStateChanged: () => {
        this.lastWalkthroughViewNotifyMs = 0;
        this.postProcessing.resetHistory();
        this.updateCameraFacingWallCutaways(true);
        this.renderer.shadowMap.needsUpdate = true;
        this.needsRender = true;
      },
      onPoseUpdated: () => {
        this.updateCameraFacingWallCutaways(false);
        this.needsRender = true;
      },
    });

    this.annotations = new SceneAnnotationController({
      canvas,
      layers: this.layers,
      orbitControls: this.rig.controls,
      getActiveCamera: () => this.rig.getActiveCamera(),
      getCameraPose: () => this.getCurrentCameraPoseSnapshot(),
      setRayFromClient: (clientX, clientY) => this.setRayFromClient(clientX, clientY),
      isExcludedFromPicking: (mesh) => mesh.geometry === this.content.glowPoolGeometry,
      requestRender: () => {
        this.needsRender = true;
      },
      invalidateShadows: () => {
        this.renderer.shadowMap.needsUpdate = true;
      },
    });
    this.scene.add(...this.annotations.getSceneObjects());

    this.environment = new EnvironmentLighting(this.scene, this.renderer, () => {
      this.renderer.shadowMap.needsUpdate = true;
      this.needsRender = true;
    });
    this.setTimeOfDay('dusk');

    this.content = buildPropertySceneContent(this.layers, {
      profile,
      registry: this.zoneRegistry,
      lodController: this.lodController,
      ceilingCutaway: this.cutaways.isCeilingCutaway(),
    });
    applySelectiveBevelModifier(this.layers);
    this.interactions = this.content.interactions;
    this.cutaways.collectDynamicCutawayWalls();

    this.circuitLighting = new CircuitLightingController({
      lightGroups: this.content.lightGroups,
      indicatorMats: this.content.indicatorMats,
      roomSwitchLedMats: this.content.roomSwitchLedMats,
      switchLedRules: profile.switchLedRules,
      defaultFixtureAppearance: profile.defaultFixtureAppearance,
      fixtureAppearanceOverrides: profile.fixtureAppearanceOverrides,
      tvArtTextures: this.content.tvArtTextures,
      tvOffTexture: this.content.tvOffTexture,
    });
    this.bifolds = new BifoldDoorAnimator(this.content.bifoldPanels, profile.bifoldTrack);
    this.content.ufhSystem?.subscribe(() => {
      this.needsRender = true;
    });

    // Trade views: tag every renderable before batching so merged batches stay single-category.
    classifyScene([this.scene]);
    this.tradeViews = new TradeViewController({
      roots: [this.scene],
      requestRender: () => {
        this.needsRender = true;
      },
      invalidateShadows: () => {
        this.renderer.shadowMap.needsUpdate = true;
      },
    });
    this.tradeViews.captureServicePoints();

    this.batchOptimizer = new SceneBatchOptimizer({
      layers: this.layers,
      lodController: this.lodController,
      lightGroups: this.content.lightGroups,
      indicatorMats: this.content.indicatorMats,
      roomSwitchLedMats: this.content.roomSwitchLedMats,
      interactiveMeshes: this.content.interactiveMeshes,
      bifoldPanels: this.content.bifoldPanels,
      getDynamicObjects: () => {
        const dynamicObjects = new Set<THREE.Object3D>();
        this.annotations.collectDynamicObjects(dynamicObjects);
        for (const panel of this.bifolds.getPanels()) {
          panel.group.traverse((child) => dynamicObjects.add(child));
        }
        this.interactions.collectDynamicObjects(dynamicObjects);
        return dynamicObjects;
      },
      onBeforeBatchChange: () => {
        this.tradeViews.suspend();
      },
      onAfterBatchChange: () => {
        this.cutaways.collectDynamicCutawayWalls();
        this.tradeViews.resume();
      },
    });

    this.usdRuntime = new UsdStageRuntimeController({
      scene: this.scene,
      firstFloorMeshGroup: this.layers.firstFloorMeshGroup,
      groundFloorCeilingGroup: this.layers.groundFloorCeilingGroup,
      ceilingMeshGroup: this.layers.ceilingMeshGroup,
      cutawayWallGroups: this.layers.cutawayWallGroups,
      initialCeilingCutaway: this.cutaways.isCeilingCutaway(),
      onRoofCutawayChanged: (cutaway) => {
        if (this.isCeilingCutaway() !== cutaway) {
          this.toggleCeilingCutaway();
        }
      },
      onBeforeZoneLoadFromUsda: () => {
        this.batchOptimizer.unbatchAll();
      },
      onZoneLoadedFromUsda: () => {
        applySelectiveBevelModifier(this.layers);
        classifyScene([this.scene]);
        this.interactions.rebindAfterUsdZoneLoad([this.scene]);
        this.cutaways.collectDynamicCutawayWalls();
        this.walkthrough.captureFurnitureColliders();
        if (!this.annotations.isAnnotationMode() && this.usdRuntime.canUseStaticBatching()) {
          this.batchOptimizer.optimize();
        }
        this.walkthrough.invalidateObstacleCache();
        this.updateCameraFacingWallCutaways(true);
        this.freezeStaticMatrices();
        this.renderer.shadowMap.needsUpdate = true;
        this.needsRender = true;
      },
      onSyncBatchState: (shouldBatch) => {
        if (shouldBatch && !this.annotations.isAnnotationMode()) {
          this.batchOptimizer.optimize();
          this.freezeStaticMatrices();
        } else {
          this.batchOptimizer.unbatchAll();
          this.freezeStaticMatrices();
        }
        this.walkthrough.invalidateObstacleCache();
        this.renderer.shadowMap.needsUpdate = true;
        this.needsRender = true;
      },
    });
    this.usdRuntime.subscribe(() => {
      this.renderer.shadowMap.needsUpdate = true;
      this.needsRender = true;
    });

    this.walkthrough.captureFurnitureColliders();
    this.batchOptimizer.optimize();
    this.batchOptimizer.setBudgetAnchorZone('kitchen');
    this.tradeViews.indexScene();
    this.updateCameraFacingWallCutaways(true);
    this.freezeStaticMatrices();
    this.setupInteractionEvents();

    // Navigation: anchor pans / orbits / zooms on the visible surface under the cursor.
    this.rig.setSurfacePicker((ndcX, ndcY) => this.pickVisibleSurfacePointNdc(ndcX, ndcY));
    this.rig.controls.addEventListener('start', () => {
      this.userInteracting = true;
    });
    this.rig.controls.addEventListener('end', () => {
      this.userInteracting = false;
    });

    // Performance auto-tune: cached tier for this GPU, else a device heuristic.
    const deviceProfile = detectDeviceProfile(this.renderer);
    const perfCacheKey = getDeviceCacheKey(deviceProfile);
    const initialTier = readCachedPerf(perfCacheKey)?.tier ?? estimateInitialTier(deviceProfile);
    this.governor = new PerformanceGovernor({
      devicePixelRatio: deviceProfile.devicePixelRatio,
      initialTier,
      applyTier: (settings) => this.applyGraphicsTier(settings),
      onToast: (message) => this.graphicsToastListener?.(message),
      onAutoTierChange: (tier) => updateCachedTier(perfCacheKey, tier),
    });
    this.walkthrough.restoreFromSessionIfActive(this.getCurrentCameraPoseSnapshot());
  }

  // ---------------------------------------------------------------------------
  // Registry / LOD / security / UFH / OpenUSD Runtime
  // ---------------------------------------------------------------------------

  public getUsdRuntime(): UsdStageRuntimeController {
    return this.usdRuntime;
  }

  public setOnUsdPrimPick(cb: ((info: UsdIndexedPrimInfo) => void) | null): void {
    this.onUsdPrimPick = cb;
  }

  public getZoneRegistry(): SceneZoneRegistry {
    return this.zoneRegistry;
  }

  public getLodController(): RoomLodController {
    return this.lodController;
  }

  public getLodDiagnostics(): RoomLodDiagnostics {
    return this.lodController.getDiagnostics();
  }

  public getFocusedRoomShortName(): string {
    return this.lodController.getFocusedRoomShortName();
  }

  public getGraphicsSettings(): GraphicsSettingsState {
    return this.postProcessing.getSettings();
  }

  public setGraphicsQualityPreset(preset: GraphicsQualityPreset): void {
    this.postProcessing.setQualityPreset(preset);
    this.needsRender = true;
  }

  public cycleGraphicsQualityPreset(): GraphicsQualityPreset {
    const next = this.postProcessing.cycleQualityPreset();
    this.needsRender = true;
    return next;
  }

  // ---------------------------------------------------------------------------
  // UX contract API (graphics mode, current room, trade view, recenter)
  // NOTE: Integration point for the parallel UX overhaul. UI code depends on these
  // signatures; implementations are wired to PerformanceGovernor / RoomTracker /
  // TradeViewController during integration.
  // ---------------------------------------------------------------------------

  private currentRoomId: RoomZoneId | null = null;
  private readonly currentRoomListeners = new Set<(zoneId: RoomZoneId | null) => void>();
  private tradeView: TradeView = 'owner';
  private readonly tradeViewListeners = new Set<(view: TradeView) => void>();

  public getGraphicsMode(): GraphicsMode {
    return this.governor.getMode();
  }

  public setGraphicsMode(mode: GraphicsMode): void {
    this.governor.setMode(mode);
    this.needsRender = true;
  }

  /** Live FPS / tier stats from the performance governor. */
  public getGraphicsStats(): PerformanceGovernorStats {
    return this.governor.getStats();
  }

  /** Receives short user-facing messages such as auto quality step-downs. */
  public setOnGraphicsToast(cb: ((message: string) => void) | null): void {
    this.graphicsToastListener = cb;
  }

  private applyGraphicsTier(settings: GraphicsTierSettings): void {
    this.postProcessing.applyTierSettings(settings);
    this.environment.setShadowMapSize(settings.shadowMapSize);
    this.lodController.setDistanceScale(settings.lodDistanceScale);
    this.lodController.setHighDetailMaxDistance(settings.highDetailMaxDistance);
    const budget = settings.tier === 'ultra' ? Infinity : getPointLightBudget(settings.tier);
    this.batchOptimizer.setPointLightBudget(budget);
    this.updateCameraFacingWallCutaways(true);
    this.renderer.shadowMap.needsUpdate = true;
    this.needsRender = true;
  }

  public getCurrentRoomId(): RoomZoneId | null {
    return this.currentRoomId;
  }

  /** Subscribes to current-room changes. Returns an unsubscribe function. */
  public onCurrentRoomChanged(cb: (zoneId: RoomZoneId | null) => void): () => void {
    this.currentRoomListeners.add(cb);
    return () => this.currentRoomListeners.delete(cb);
  }

  /** Explicitly selects a room (e.g. from the room navigator) and frames it. */
  public selectRoom(zoneId: RoomZoneId): void {
    this.roomTracker.setExplicit(zoneId, this.rig.getPivot());
    this.setFocusedZone(zoneId);
  }

  protected setCurrentRoomId(zoneId: RoomZoneId | null): void {
    if (zoneId === this.currentRoomId) return;
    this.currentRoomId = zoneId;
    if (zoneId && this.batchOptimizer.setBudgetAnchorZone(zoneId)) {
      this.needsRender = true;
    }
    for (const cb of this.currentRoomListeners) cb(zoneId);
  }

  public getTradeView(): TradeView {
    return this.tradeView;
  }

  public setTradeView(view: TradeView): void {
    if (view === this.tradeView) return;
    this.tradeView = view;
    this.tradeViews.setView(view);
    for (const cb of this.tradeViewListeners) cb(view);
    this.needsRender = true;
  }

  /** CSV schedule of service points (sockets, switches, sanitaryware, …) for a trade. */
  public exportServiceSchedule(view: TradeView = this.tradeView): string {
    return this.tradeViews.exportServiceScheduleCsv(view);
  }

  public onTradeViewChanged(cb: (view: TradeView) => void): () => void {
    this.tradeViewListeners.add(cb);
    return () => this.tradeViewListeners.delete(cb);
  }

  /** Re-frames the camera on the current room (or the default overview). */
  public recenterView(): void {
    const reg = this.currentRoomId
      ? this.lodRegistrations.find((r) => r.zoneId === this.currentRoomId)
      : undefined;
    if (!reg || this.walkthrough.isActive()) {
      this.flyToPreset('top');
      return;
    }
    this.postProcessing.resetHistory();
    this.rig.useCamera(false);
    this.rig.frameBounds(reg.bounds);
    this.roomTracker.rebaseExplicitAnchor(
      new THREE.Vector3(
        (reg.bounds.minX + reg.bounds.maxX) / 2,
        reg.bounds.minY,
        (reg.bounds.minZ + reg.bounds.maxZ) / 2
      )
    );
    this.needsRender = true;
  }

  public isMotionBlurEnabled(): boolean {
    return this.postProcessing.isMotionBlurEnabled();
  }

  public toggleMotionBlur(): boolean {
    const next = this.postProcessing.toggleMotionBlur();
    this.needsRender = true;
    return next;
  }

  public getLodPolicyMode(): LodPolicyMode {
    return this.lodController.getPolicyMode();
  }

  public setLodPolicyMode(mode: LodPolicyMode): void {
    const changed = this.lodController.setPolicyMode(
      mode,
      this.rig.getActiveCamera().position,
      this.rig.controls.target,
      this.cutaways.getFloorViewMode()
    );
    if (changed) {
      this.renderer.shadowMap.needsUpdate = true;
      this.needsRender = true;
    }
  }

  public setFocusedZone(zoneId: RoomZoneId): void {
    const changed = this.lodController.setFocusedZoneId(
      zoneId,
      this.rig.getActiveCamera().position,
      this.rig.controls.target,
      this.cutaways.getFloorViewMode()
    );
    if (changed) {
      this.renderer.shadowMap.needsUpdate = true;
      this.needsRender = true;
    }
  }

  public syncUniFiSecurity3D(
    cameras: readonly CctvCameraEntityState[],
    accessPoints: readonly AccessPointEntityState[]
  ): void {
    this.content.security.syncCameras(cameras);
    this.content.security.syncAccessPoints(accessPoints);
    this.needsRender = true;
  }

  public getUfhSystem(): UfhSystemOverlay3D | null {
    return this.content.ufhSystem;
  }

  public isUfhLayerVisible(): boolean {
    return this.content.ufhSystem?.isLayerVisible() ?? false;
  }

  public setUfhLayerVisible(visible: boolean): void {
    if (!this.content.ufhSystem) return;
    this.content.ufhSystem.setLayerVisible(visible);
    this.needsRender = true;
  }

  public toggleUfhLayer(): boolean {
    if (!this.content.ufhSystem) return false;
    const next = this.content.ufhSystem.toggleLayerVisible();
    this.needsRender = true;
    return next;
  }

  public toggleUfhZone(zoneId: UfhZoneId): boolean {
    if (!this.content.ufhSystem) return false;
    const next = this.content.ufhSystem.toggleZone(zoneId);
    this.needsRender = true;
    return next;
  }

  public setAllUfhZones(on: boolean): void {
    if (!this.content.ufhSystem) return;
    this.content.ufhSystem.setAllZones(on);
    this.needsRender = true;
  }

  // ---------------------------------------------------------------------------
  // Floor focus & cutaways
  // ---------------------------------------------------------------------------

  public getFloorViewMode(): FloorViewMode {
    return this.cutaways.getFloorViewMode();
  }

  public setFloorViewMode(mode: FloorViewMode): void {
    this.cutaways.setFloorViewMode(mode);
    this.updateCameraFacingWallCutaways();
    this.renderer.shadowMap.needsUpdate = true;
    this.needsRender = true;
  }

  public isCeilingCutaway(): boolean {
    return this.cutaways.isCeilingCutaway();
  }

  public toggleCeilingCutaway(): boolean {
    const next = this.cutaways.toggleCeilingCutaway();
    this.updateCameraFacingWallCutaways();
    this.renderer.shadowMap.needsUpdate = true;
    this.needsRender = true;
    return next;
  }

  private updateCameraFacingWallCutaways(forceNotifyView = false): void {
    const isWalkthrough = this.walkthrough.isActive();
    const camPos = this.rig.getActiveCamera().position;
    const result = this.cutaways.update({
      cameraPosition: camPos,
      target: this.rig.controls.target,
      isOrthographic: this.rig.isOrthographic(),
      orthoZoom: this.rig.orthoCamera.zoom,
      isWalkthrough,
    });
    if (
      this.batchOptimizer.syncPointLightVisibilityAndDistance(
        camPos,
        this.layers.firstFloorMeshGroup.visible
      )
    ) {
      this.needsRender = true;
    }
    if (result.shadowsDirty) {
      this.renderer.shadowMap.needsUpdate = true;
    }
    if (result.needsRender) {
      this.needsRender = true;
    }
    if (isWalkthrough) {
      this.footScratch.copy(camPos);
      this.footScratch.y -= STANDING_EYE_HEIGHT;
      this.roomTracker.updateFromWalkthrough(this.footScratch);
    } else {
      this.roomTracker.updateFromOrbit(
        this.rig.controls.target,
        this.cutaways.getFloorViewMode(),
        performance.now()
      );
    }
    if (this.viewListeners.size > 0) {
      if (isWalkthrough && !forceNotifyView) {
        const now = performance.now();
        if (now - this.lastWalkthroughViewNotifyMs < 150) {
          return;
        }
        this.lastWalkthroughViewNotifyMs = now;
      }
      const view = this.getViewState();
      for (const listener of this.viewListeners) {
        listener(view);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // First-Person Walkthrough Mode
  // ---------------------------------------------------------------------------

  public getWalkthrough(): WalkthroughController {
    return this.walkthrough;
  }

  public isWalkthroughMode(): boolean {
    return this.walkthrough.isActive();
  }

  public setWalkthroughMode(enabled: boolean, spawnId?: string): boolean {
    if (enabled) {
      if (this.annotations.isAnnotationMode()) {
        this.annotations.setAnnotationMode(false);
      }
      const spawn = spawnId
        ? DEFAULT_WALKTHROUGH_SPAWNS.find((s) => s.id === spawnId)
        : undefined;
      this.walkthrough.enter(this.getCurrentCameraPoseSnapshot(), spawn);
      return true;
    }
    const savedPose = this.walkthrough.exit();
    if (savedPose) {
      this.flyToCameraPose(savedPose);
    }
    return false;
  }

  public toggleWalkthroughMode(spawnId?: string): boolean {
    return this.setWalkthroughMode(!this.walkthrough.isActive(), spawnId);
  }

  /** Current camera + floor state. */
  public getViewState(): PropertySceneViewState {
    const camPos = this.rig.getActiveCamera().position;
    const isWalkthrough = this.walkthrough.isActive();
    return {
      cameraPosition: camPos,
      target: isWalkthrough ? camPos : this.rig.controls.target,
      isOrthographic: this.rig.isOrthographic(),
      orthoZoom: this.rig.orthoCamera.zoom,
      floorViewMode: isWalkthrough
        ? camPos.y >= 2.15
          ? 'first'
          : 'ground'
        : this.cutaways.getFloorViewMode(),
    };
  }

  /** Subscribes to camera / floor-mode changes. Returns an unsubscribe function. */
  public onViewChanged(listener: (view: PropertySceneViewState) => void): () => void {
    this.viewListeners.add(listener);
    return () => this.viewListeners.delete(listener);
  }

  private freezeStaticMatrices(): void {
    this.scene.updateMatrixWorld(true);
    this.scene.matrixWorldAutoUpdate = false;
    const dynamicObjects = new Set<THREE.Object3D>();
    this.annotations.collectDynamicObjects(dynamicObjects);
    for (const panel of this.bifolds.getPanels()) {
      panel.group.traverse((child) => dynamicObjects.add(child));
    }
    this.interactions.collectDynamicObjects(dynamicObjects);

    const maxAnisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    const seenMaterials = new Set<THREE.Material>();

    this.scene.traverse((obj) => {
      if (obj !== this.scene && !dynamicObjects.has(obj)) {
        obj.matrixAutoUpdate = false;
      }
      if (obj instanceof THREE.Mesh) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const mat of mats) {
          if (!mat || seenMaterials.has(mat)) continue;
          seenMaterials.add(mat);
          const stdMat = mat as THREE.MeshStandardMaterial;
          for (const tex of [
            stdMat.map,
            stdMat.normalMap,
            stdMat.roughnessMap,
            stdMat.bumpMap,
          ]) {
            if (tex && tex.anisotropy < maxAnisotropy) {
              tex.anisotropy = maxAnisotropy;
              tex.needsUpdate = true;
            }
          }
        }

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
            if (sphere.radius * maxScale < 0.25) {
              obj.castShadow = false;
            }
          }
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Interactables, lighting & devices
  // ---------------------------------------------------------------------------

  public handleInteractableClick(interactableId: string): boolean {
    if (interactableId === 'golf-simulator-shot') {
      if (!this.interactions.triggerGolfSimulatorShot()) {
        return false;
      }
      if (!this.walkthrough.isActive()) {
        if (this.annotations.isAnnotationMode()) {
          this.annotations.setAnnotationMode(false);
        }
        this.walkthrough.enter(this.getCurrentCameraPoseSnapshot(), {
          position: [-5.972, -0.34, 18.972],
          yawDeg: 194,
        });
      }
      this.walkthrough.beginFirstPersonGolfShot();
      this.needsRender = true;
      return true;
    }
    const handled = this.interactions.handleInteractableClick(interactableId);
    if (handled) {
      this.needsRender = true;
    }
    return handled;
  }

  public setTimeOfDay(mode: TimeOfDay): void {
    this.environment.setTimeOfDay(mode);
    this.circuitLighting?.setTimeOfDay(mode);
    this.batchOptimizer?.setTimeOfDay(mode);
    this.renderer.shadowMap.needsUpdate = true;
    this.needsRender = true;
  }

  public applyKNXLightLevels(liveLevels: Readonly<CircuitLevels>): void {
    this.circuitLighting.applyLevels(liveLevels);
    this.needsRender = true;
  }

  public setMotionSensorStates(kitchenMotion: boolean, utilityMotion: boolean): void {
    this.circuitLighting.setMotionSensorStates(kitchenMotion, utilityMotion);
    this.needsRender = true;
  }

  public setTVArtState(artModeOn: boolean, artIndex: number): void {
    if (this.circuitLighting.setTVArtState(artModeOn, artIndex)) {
      this.needsRender = true;
    }
  }

  public isBifoldsOpen(): boolean {
    return this.bifolds.isOpen();
  }

  public toggleBifolds(): boolean {
    const open = this.bifolds.toggle();
    this.needsRender = true;
    return open;
  }

  public isCarGatesOpen(): boolean {
    return this.interactions.isCarGatesOpen();
  }

  public setCarGatesOpen(isOpen: boolean): void {
    if (this.interactions.isCarGatesOpen() !== isOpen) {
      this.interactions.setCarGatesOpen(isOpen);
      this.needsRender = true;
    }
  }

  public toggleCarGates(): boolean {
    const next = !this.interactions.isCarGatesOpen();
    this.interactions.setCarGatesOpen(next);
    this.needsRender = true;
    return next;
  }

  public getCarGatesProgress(): number {
    return this.interactions.getCarGatesProgress();
  }

  // ---------------------------------------------------------------------------
  // Camera
  // ---------------------------------------------------------------------------

  public flyToPreset(presetName: CameraPresetName | string): void {
    if (this.walkthrough.isActive()) {
      this.walkthrough.exit();
    }
    const p = this.zoneRegistry.getCameraPreset(presetName);
    if (!p) return;

    this.postProcessing.resetHistory();

    if (p.floorViewMode) {
      this.cutaways.setFloorViewMode(p.floorViewMode);
    }
    if (p.zoneId) {
      this.lodController.setFocusedZoneId(
        p.zoneId,
        p.pos,
        p.target,
        this.cutaways.getFloorViewMode()
      );
    }

    if (p.useOrthographic) {
      this.rig.useCamera(true);
      this.rig.orthoCamera.zoom = 1.08;
      this.rig.orthoCamera.updateProjectionMatrix();
    } else {
      this.rig.useCamera(false);
    }

    this.rig.startTween(p.pos, p.target, 0.7);
    this.updateCameraFacingWallCutaways();
    this.needsRender = true;
  }

  public getCurrentCameraPoseSnapshot(): SceneCameraPoseSnapshot {
    const pos = this.rig.getActiveCamera().position;
    const tgt = this.rig.controls.target;
    return {
      position: [round3(pos.x), round3(pos.y), round3(pos.z)],
      target: [round3(tgt.x), round3(tgt.y), round3(tgt.z)],
      floorViewMode: this.cutaways.getFloorViewMode(),
      ceilingCutaway: this.cutaways.isCeilingCutaway(),
      isOrthographic: this.rig.isOrthographic(),
    };
  }

  public flyToCameraPose(pose: SceneCameraPoseSnapshot): void {
    if (this.walkthrough.isActive()) {
      this.walkthrough.exit();
    }
    this.postProcessing.resetHistory();
    this.cutaways.setViewState(pose.floorViewMode, pose.ceilingCutaway);

    if (pose.isOrthographic) {
      this.rig.useCamera(true);
      this.rig.orthoCamera.updateProjectionMatrix();
    } else {
      this.rig.useCamera(false);
    }

    this.rig.startTween(
      new THREE.Vector3(pose.position[0], pose.position[1], pose.position[2]),
      new THREE.Vector3(pose.target[0], pose.target[1], pose.target[2]),
      0.6
    );
    this.updateCameraFacingWallCutaways();
    this.needsRender = true;
  }

  // ---------------------------------------------------------------------------
  // Room focus helpers
  // ---------------------------------------------------------------------------

  /**
   * Flies the perspective camera to frame a room, keeping the current viewing
   * direction (so the move feels like a zoom-in rather than a jump).
   */
  public flyToRoomBounds(bounds: RoomFramingBounds, floorViewMode: FloorViewMode): void {
    if (this.walkthrough.isActive()) {
      this.walkthrough.exit();
    }
    this.postProcessing.resetHistory();
    this.cutaways.setFloorViewMode(floorViewMode);
    this.rig.useCamera(false);

    const target = new THREE.Vector3(
      (bounds.minX + bounds.maxX) / 2,
      bounds.minY + 0.9,
      (bounds.minZ + bounds.maxZ) / 2
    );
    const span = Math.max(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ);
    const distance = THREE.MathUtils.clamp(span * 0.9 + 2.5, 5.0, 8.0);

    const cam = this.rig.getActiveCamera().position;
    const currentTarget = this.rig.controls.target;
    const horiz = new THREE.Vector3(cam.x - currentTarget.x, 0, cam.z - currentTarget.z);
    if (horiz.lengthSq() < 1e-4) {
      horiz.set(0.35, 0, 1);
    }
    horiz.normalize();
    const elevation = THREE.MathUtils.degToRad(52);
    const endPos = target
      .clone()
      .addScaledVector(horiz, distance * Math.cos(elevation))
      .add(new THREE.Vector3(0, distance * Math.sin(elevation), 0));

    this.rig.startTween(endPos, target, 0.7);
    this.updateCameraFacingWallCutaways();
    this.needsRender = true;
  }

  /**
   * Registers a callback for double-clicks on visible scene geometry (outside
   * annotation mode). Receives the world-space hit point.
   */
  public setOnSurfaceDoubleClick(cb: ((point: THREE.Vector3) => void) | null): void {
    this.onSurfaceDoubleClick = cb;
  }

  private pickVisibleSurfacePointNdc(ndcX: number, ndcY: number): THREE.Vector3 | null {
    const camera = this.rig.getActiveCamera();
    camera.updateMatrixWorld();
    this.pointer.set(ndcX, ndcY);
    this.raycaster.setFromCamera(this.pointer, camera);
    return this.firstVisibleSurfaceHit(this.raycaster);
  }

  private pickVisibleSurfacePoint(clientX: number, clientY: number): THREE.Vector3 | null {
    return this.firstVisibleSurfaceHit(this.setRayFromClient(clientX, clientY));
  }

  private firstVisibleSurfaceHit(raycaster: THREE.Raycaster): THREE.Vector3 | null {
    const hits = raycaster.intersectObjects(this.scene.children, true);
    const hit = hits.find(
      (h) =>
        h.object instanceof THREE.Mesh &&
        isObjectVisibleInHierarchy(h.object) &&
        h.object.geometry !== this.content.glowPoolGeometry &&
        !h.object.userData?.isAnnotationGroup
    );
    return hit ? hit.point.clone() : null;
  }

  // ---------------------------------------------------------------------------
  // Annotation tools (delegated)
  // ---------------------------------------------------------------------------

  public isAnnotationMode(): boolean {
    return this.annotations.isAnnotationMode();
  }

  public setAnnotationMode(enabled: boolean): void {
    if (enabled) {
      this.batchOptimizer.unbatchAll();
      this.updateCameraFacingWallCutaways(true);
      this.freezeStaticMatrices();
    }
    this.annotations.setAnnotationMode(enabled);
    if (!enabled && this.usdRuntime.canUseStaticBatching()) {
      this.walkthrough.captureFurnitureColliders();
      this.batchOptimizer.optimize();
      this.updateCameraFacingWallCutaways(true);
      this.freezeStaticMatrices();
    }
    this.walkthrough.invalidateObstacleCache();
    this.renderer.shadowMap.needsUpdate = true;
    this.needsRender = true;
  }

  public toggleAnnotationMode(): boolean {
    const next = !this.annotations.isAnnotationMode();
    this.setAnnotationMode(next);
    return this.annotations.isAnnotationMode();
  }

  public getAnnotationToolMode(): AnnotationToolMode {
    return this.annotations.getAnnotationToolMode();
  }

  public setAnnotationToolMode(tool: AnnotationToolMode): void {
    this.annotations.setAnnotationToolMode(tool);
  }

  public getGizmoTransformMode(): GizmoTransformMode {
    return this.annotations.getGizmoTransformMode();
  }

  public setGizmoTransformMode(mode: GizmoTransformMode): void {
    this.annotations.setGizmoTransformMode(mode);
  }

  public getMeasureAxisSnap(): boolean {
    return this.annotations.getMeasureAxisSnap();
  }

  public setMeasureAxisSnap(enabled: boolean): void {
    this.annotations.setMeasureAxisSnap(enabled);
  }

  public cancelActiveMeasurement(): void {
    this.annotations.cancelActiveMeasurement();
  }

  public setOnAnnotationPick(cb: ((hit: SceneAnnotationHit) => void) | null): void {
    this.annotations.setOnAnnotationPick(cb);
  }

  public setOnAnnotationMarkerSelect(cb: ((id: number) => void) | null): void {
    this.annotations.setOnAnnotationMarkerSelect(cb);
  }

  public setOnObjectTransformChange(cb: ObjectTransformChangeCallback | null): void {
    this.annotations.setOnObjectTransformChange(cb);
  }

  public setOnMeasurePreviewChange(
    cb: ((state: LiveMeasurePreviewState) => void) | null
  ): void {
    this.annotations.setOnMeasurePreviewChange(cb);
  }

  public setOnMeasureComplete(cb: MeasureCompleteCallback | null): void {
    this.annotations.setOnMeasureComplete(cb);
  }

  public syncAnnotationMarkers(
    records: readonly SceneAnnotationRecord[],
    selectedId: number | null
  ): void {
    this.annotations.syncAnnotationMarkers(records, selectedId);
  }

  public reapplySavedMoveAnnotations(records: readonly SceneAnnotationRecord[]): void {
    this.batchOptimizer.unbatchAll();
    this.annotations.reapplySavedMoveAnnotations(records);
    if (!this.annotations.isAnnotationMode() && this.usdRuntime.canUseStaticBatching()) {
      this.walkthrough.captureFurnitureColliders();
      this.batchOptimizer.optimize();
    }
    this.walkthrough.invalidateObstacleCache();
    this.freezeStaticMatrices();
  }

  public detachMoveGizmo(): void {
    this.annotations.detachMoveGizmo();
  }

  public switchSelectedMoveCandidate(targetUuid: string): void {
    this.annotations.switchSelectedMoveCandidate(targetUuid);
  }

  public selectMovedObjectByUuid(targetUuid: string): boolean {
    return this.annotations.selectMovedObjectByUuid(targetUuid);
  }

  public nudgeSelectedObject(
    dx: number,
    dy: number,
    dz: number,
    dRotYDeg = 0,
    dRotXDeg = 0,
    dRotZDeg = 0
  ): void {
    this.annotations.nudgeSelectedObject(dx, dy, dz, dRotYDeg, dRotXDeg, dRotZDeg);
  }

  public setSelectedObjectDeltaTransform(
    dx: number,
    dy: number,
    dz: number,
    dRotYDeg: number,
    dRotXDeg?: number,
    dRotZDeg?: number
  ): void {
    this.annotations.setSelectedObjectDeltaTransform(dx, dy, dz, dRotYDeg, dRotXDeg, dRotZDeg);
  }

  public resetMovedObject(targetUuid?: string): void {
    this.annotations.resetMovedObject(targetUuid);
  }

  // ---------------------------------------------------------------------------
  // Pointer input, resize & render loop
  // ---------------------------------------------------------------------------

  private setRayFromClient(clientX: number, clientY: number): THREE.Raycaster {
    if (this.walkthrough.isActive() && this.walkthrough.isPointerLocked()) {
      this.pointer.set(0, 0);
    } else {
      const rect = this.canvas.getBoundingClientRect();
      this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    }

    const camera: RigCamera = this.rig.getActiveCamera();
    camera.updateMatrixWorld();
    this.raycaster.setFromCamera(this.pointer, camera);
    return this.raycaster;
  }

  private triggerInteractiveObject(mesh: THREE.Object3D): void {
    if (this.onUsdPrimPick) {
      const primInfo = this.usdRuntime.getPrimInfoByMesh(mesh);
      if (primInfo) {
        this.onUsdPrimPick(primInfo);
      }
    }
    const data = mesh.userData as InteractiveUserData;
    if (data.isClimbableLadder && this.walkthrough.isActive()) {
      this.walkthrough.interactWithClimbableLadder();
      this.needsRender = true;
      return;
    }
    if (data.interactableId) {
      this.handleInteractableClick(data.interactableId);
    }
    if (data.ufhZoneId) {
      this.toggleUfhZone(data.ufhZoneId);
    }
    this.onObjectInteraction(data);
    if (this.walkthrough.isActive()) {
      this.walkthrough.refreshPrompt();
    }
    this.needsRender = true;
  }

  private setupInteractionEvents(): void {
    this.canvas.addEventListener('pointerdown', (e: PointerEvent) => {
      this.pointerDownPos = { x: e.clientX, y: e.clientY };
    });

    let lastHoverRaycastMs = 0;
    this.canvas.addEventListener('pointermove', (e: PointerEvent) => {
      if (this.walkthrough.isActive() || this.annotations.isGizmoDragging()) return;

      // Live 3D measurement rubber-band line preview when waiting for Point B
      if (this.annotations.isAwaitingMeasureEnd() && e.buttons === 0) {
        const now = performance.now();
        if (now - lastHoverRaycastMs < 24) return;
        lastHoverRaycastMs = now;
        this.annotations.updateMeasurePreviewAt(e.clientX, e.clientY, e.shiftKey);
        this.canvas.style.cursor = 'crosshair';
        return;
      }

      if (e.buttons !== 0) return;
      if (this.annotations.isAnnotationMode() || e.shiftKey) {
        this.canvas.style.cursor = this.annotations.getHoverCursor();
        return;
      }
      const now = performance.now();
      if (now - lastHoverRaycastMs < 50) return;
      lastHoverRaycastMs = now;

      const raycaster = this.setRayFromClient(e.clientX, e.clientY);
      if (this.annotations.intersectMarkers(raycaster).length > 0) {
        this.canvas.style.cursor = 'pointer';
        return;
      }
      const hits = raycaster.intersectObjects(this.content.interactiveMeshes, false);
      const visibleHit = hits.find((hit) => isObjectVisibleInHierarchy(hit.object));
      this.canvas.style.cursor = visibleHit ? 'pointer' : 'grab';
    });

    this.canvas.addEventListener('pointerup', (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (this.annotations.isGizmoBusy()) return;

      const dist = Math.hypot(
        e.clientX - this.pointerDownPos.x,
        e.clientY - this.pointerDownPos.y
      );
      if (dist > 6) return;

      const raycaster = this.setRayFromClient(e.clientX, e.clientY);

      // 1-2. Annotation markers and annotation tools take precedence.
      if (this.annotations.handleClick(raycaster, e)) return;

      // 3. Normal interactive object click (doors, switches, lights, gates, etc.)
      const hits = raycaster.intersectObjects(this.content.interactiveMeshes, false);
      const firstHit = hits.find((hit) => isObjectVisibleInHierarchy(hit.object));
      if (firstHit) {
        this.triggerInteractiveObject(firstHit.object);
        return;
      }

      // 4. OpenUSD Stage Prim Inspection pick on any visible architectural / furniture mesh
      if (this.onUsdPrimPick) {
        const sceneHits = raycaster.intersectObjects(
          [this.scene, this.layers.firstFloorMeshGroup],
          true
        );
        const visibleSceneHit = sceneHits.find(
          (hit) =>
            hit.object instanceof THREE.Mesh &&
            hit.object.geometry !== this.content.glowPoolGeometry &&
            isObjectVisibleInHierarchy(hit.object)
        );
        if (visibleSceneHit) {
          const primInfo = this.usdRuntime.getPrimInfoByMesh(visibleSceneHit.object);
          if (primInfo) {
            this.onUsdPrimPick(primInfo);
          }
        }
      }
    });

    this.canvas.addEventListener('dblclick', (e: MouseEvent) => {
      if (this.annotations.isAnnotationMode() || e.shiftKey) return;
      const point = this.pickVisibleSurfacePoint(e.clientX, e.clientY);
      // Devices (switches, doors, gates…) already act on single click; don't also refocus.
      const onDevice = this.raycaster
        .intersectObjects(this.content.interactiveMeshes, false)
        .some((hit) => isObjectVisibleInHierarchy(hit.object));
      if (point && !onDevice) {
        if (this.walkthrough.isActive()) {
          this.walkthrough.glideToWorldPoint(point);
        } else if (this.onSurfaceDoubleClick) {
          this.onSurfaceDoubleClick(point);
        }
      }
    });

    window.addEventListener('resize', () => this.handleResize());
  }

  public handleResize(): void {
    const w = this.canvas.clientWidth;
    const h = Math.max(1, this.canvas.clientHeight);
    this.rig.resize(w, h);
    this.postProcessing.resize(w, h);
    this.governor.setDevicePixelRatio(window.devicePixelRatio || 1);
    this.needsRender = true;
  }

  public update(dtSeconds: number): void {
    let cameraMoved = false;

    if (this.walkthrough.update(dtSeconds)) {
      this.needsRender = true;
      cameraMoved = true;
    }

    // Tween + frame-rate independent damping in one step (controls 'change'
    // already refreshes cutaways for damped motion; tweens need it explicitly).
    const wasTweening = this.rig.isTweening();
    if (!this.walkthrough.isActive() && this.rig.update(dtSeconds)) {
      if (wasTweening) this.updateCameraFacingWallCutaways();
      this.needsRender = true;
      cameraMoved = true;
    }

    const bifoldMoving = this.bifolds.update(dtSeconds);
    const doorMoving = this.interactions.update(dtSeconds);
    if (bifoldMoving || doorMoving) {
      this.doorsWereAnimating = true;
      const now = performance.now();
      const shadowThrottleMs = this.walkthrough.isActive() && cameraMoved ? 90 : 32;
      if (now - this.lastDoorShadowUpdateMs >= shadowThrottleMs) {
        this.lastDoorShadowUpdateMs = now;
        this.renderer.shadowMap.needsUpdate = true;
      }
      this.needsRender = true;
    } else if (this.doorsWereAnimating) {
      this.doorsWereAnimating = false;
      this.renderer.shadowMap.needsUpdate = true;
      this.needsRender = true;
    }

    if (this.batchOptimizer.stepFades(dtSeconds)) {
      this.needsRender = true;
    }

    if (cameraMoved && this.postProcessing.isMotionBlurEnabled()) {
      this.postBlurSettleFrames = 1;
    } else if (!this.needsRender && this.postBlurSettleFrames > 0) {
      this.postBlurSettleFrames -= 1;
      this.needsRender = true;
    }

    if (this.needsRender) {
      const camera = this.rig.getActiveCamera();
      camera.updateMatrixWorld();
      this.annotations.prepareForRender();
      this.postProcessing.render(this.scene, camera, dtSeconds);
      this.needsRender = false;
      this.governor.recordFrame(dtSeconds * 1000, cameraMoved || this.userInteracting);
    }

    if (!cameraMoved && !this.userInteracting && this.governor.hasPendingChange()) {
      this.governor.notifyCameraIdle();
    }
  }
}
