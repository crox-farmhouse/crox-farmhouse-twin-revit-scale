import * as THREE from 'three';
import type { FloorViewMode, InteractiveUserData, TimeOfDay } from '../../core/types/scene.ts';
import { CutawayController } from '../cutaway/cutaway-controller.ts';
import { EnvironmentLighting } from '../lighting/environment-lighting.ts';
import {
  applyWebGpuLightVolumeToScene,
  installShaderLightCulling,
} from '../lighting/shader-light-culling.ts';
import { detectDeviceProfile } from '../perf/index.ts';
import { RoomLodController } from '../lod/lod-manager.ts';
import { applySelectiveBevelModifier } from '../rendering/bevel-modifier.ts';
import { classifyScene } from '../trade-views/index.ts';
import type { UsdStageRuntimeController } from '../usd/stage-runtime.ts';
import {
  DEFAULT_WALKTHROUGH_SPAWNS,
  type WalkthroughController,
} from '../walkthrough/walkthrough-controller.ts';
import type { PropertySceneProfile, SecurityOverlay3D } from './property-scene-profile.ts';
import {
  buildPropertySceneContent,
  createPropertySceneLayers,
  type PropertySceneContent,
  type PropertySceneLayers,
} from './scene-content.ts';
import type { SceneZoneRegistry } from './scene-zone-registry.ts';
import { AnnotationService } from './services/annotation-service.ts';
import { CameraService } from './services/camera-service.ts';
import { DeviceService } from './services/device-service.ts';
import { GraphicsService } from './services/graphics-service.ts';
import { PointerInput } from './services/pointer-input.ts';
import { RoomService } from './services/room-service.ts';
import { StaticSceneService } from './services/static-scene-service.ts';
import { TradeViewService } from './services/trade-view-service.ts';
import { ViewerRenderer } from './services/viewer-renderer.ts';
import { createViewerUsdRuntime } from './services/viewer-usd-runtime.ts';
import { createViewerWalkthrough } from './services/viewer-walkthrough.ts';

/** First-person golf-bay stance used when the golf shot is triggered from orbit view. */
const GOLF_SHOT_SPAWN = { position: [-5.972, -0.34, 18.972] as const, yawDeg: 194 };

/**
 * Composition root of the 3D viewer: builds and wires the focused services and
 * runs the frame loop. `PropertyScene` extends this with flat legacy delegates.
 *
 * - `renderer` (ViewerRenderer): WebGL + post-processing + on-demand render flag
 * - `camera` (CameraService): rig, fly-to, poses, view events, projection / picking
 * - `cutaways` (CutawayController): floor focus, ceiling / roof / wall cutaways
 * - `rooms` (RoomService): current room, focused-room LOD, room highlight
 * - `graphics` (GraphicsService): PerformanceGovernor, quality presets, stats
 * - `trades` (TradeViewService), `annotations` (AnnotationService),
 *   `devices` (DeviceService), `staticScene` (batching / matrix freezing),
 *   `input` (PointerInput), `walkthrough`, `usd` (OpenUSD stage runtime)
 *
 * Home-specific data comes from a `PropertySceneProfile`.
 */
export class ViewerComposition<TSecurity extends SecurityOverlay3D = SecurityOverlay3D> {
  public readonly scene: THREE.Scene;
  public readonly renderer: ViewerRenderer;
  public readonly camera: CameraService;
  public readonly cutaways: CutawayController;
  public readonly rooms: RoomService;
  public readonly walkthrough: WalkthroughController;
  public readonly annotations: AnnotationService;
  public readonly environment: EnvironmentLighting;
  public readonly devices: DeviceService<TSecurity>;
  public readonly trades: TradeViewService;
  public readonly staticScene: StaticSceneService;
  public readonly usd: UsdStageRuntimeController;
  public readonly input: PointerInput;
  public readonly graphics: GraphicsService;

  private readonly canvas: HTMLCanvasElement;
  protected readonly zoneRegistry: SceneZoneRegistry;
  protected readonly lodController: RoomLodController;
  protected readonly layers: PropertySceneLayers;
  protected readonly content: PropertySceneContent<TSecurity>;
  private userInteracting = false;

  public constructor(
    canvas: HTMLCanvasElement,
    onObjectInteraction: (data: InteractiveUserData) => void,
    profile: PropertySceneProfile<TSecurity>
  ) {
    installShaderLightCulling();
    this.canvas = canvas;
    this.zoneRegistry = profile.createZoneRegistry();
    this.lodController = new RoomLodController(profile.lodRegistrations);

    const scene = (this.scene = new THREE.Scene());
    scene.background = new THREE.Color(0x0f1318);
    scene.fog = new THREE.FogExp2(0x0f1318, 0.022);

    const renderer = (this.renderer = new ViewerRenderer(canvas));
    this.camera = new CameraService({
      canvas,
      scene,
      renderer,
      zoneRegistry: this.zoneRegistry,
      lodController: this.lodController,
      onActiveCameraChanged: (camera) => this.annotations.controller.setCamera(camera),
      getCutaways: () => this.cutaways,
      getWalkthrough: () => this.walkthrough,
      isPickExcluded: (mesh) => this.isPickExcluded(mesh),
      refreshView: () => this.refreshView(false),
    });
    const rig = this.camera.rig;
    rig.controls.addEventListener('change', () => {
      this.refreshView(false);
      renderer.requestRender();
    });

    const layers = (this.layers = createPropertySceneLayers(scene));
    this.cutaways = new CutawayController(layers, this.zoneRegistry, this.lodController);
    this.rooms = new RoomService({
      scene,
      registrations: profile.lodRegistrations,
      lodController: this.lodController,
      invalidator: renderer,
      getCameraPosition: () => rig.getActiveCamera().position,
      getOrbitTarget: () => rig.controls.target,
      getOrbitPivot: () => rig.getPivot(),
      getFloorViewMode: () => this.cutaways.getFloorViewMode(),
      onCurrentRoomChanged: () => {
        // Lighting is invariant to room/camera panning; never re-rank or fade lights on room change.
      },
    });

    this.walkthrough = createViewerWalkthrough({
      canvas,
      scene,
      rig,
      invalidator: renderer,
      getRoomMinYAt: (x, y, z) => this.rooms.getRoomMinYAt(x, y, z),
      getInteractiveMeshes: () => this.content?.interactiveMeshes ?? [],
      getInteractions: () => this.devices.interactions,
      isBifoldsOpen: () => this.devices.isBifoldsOpen(),
      onInteractWithMesh: (mesh) => this.input.triggerInteractiveObject(mesh),
      onStateChanged: () => {
        this.camera.resetViewNotifyThrottle();
        renderer.resetHistory();
        this.refreshView(true);
        renderer.invalidateShadows();
        renderer.requestRender();
      },
      onPoseUpdated: () => {
        this.refreshView(false);
        renderer.requestRender();
      },
    });

    this.annotations = new AnnotationService({
      canvas,
      layers,
      orbitControls: rig.controls,
      getActiveCamera: () => rig.getActiveCamera(),
      getCameraPose: () => this.camera.getPoseSnapshot(),
      setRayFromClient: (clientX, clientY) => this.camera.setRayFromClient(clientX, clientY),
      isExcludedFromPicking: (mesh) => this.isPickExcluded(mesh),
      requestRender: () => renderer.requestRender(),
      invalidateShadows: () => renderer.invalidateShadows(),
      canUseStaticBatching: () => this.usd.canUseStaticBatching(),
      unbatchAll: () => this.staticScene.batchOptimizer.unbatchAll(),
      optimizeBatches: () => this.staticScene.batchOptimizer.optimize(),
      freezeStaticMatrices: () => this.staticScene.freezeStaticMatrices(),
      captureFurnitureColliders: () => this.walkthrough.captureFurnitureColliders(),
      invalidateObstacleCache: () => this.walkthrough.invalidateObstacleCache(),
      refreshView: () => this.refreshView(true),
    });
    scene.add(...this.annotations.controller.getSceneObjects());

    this.environment = new EnvironmentLighting(scene, renderer.renderer, () => {
      renderer.invalidateShadows();
      renderer.requestRender();
    });
    this.setTimeOfDay('dusk');

    const content = (this.content = buildPropertySceneContent(layers, {
      profile,
      registry: this.zoneRegistry,
      lodController: this.lodController,
      ceilingCutaway: this.cutaways.isCeilingCutaway(),
    }));
    applySelectiveBevelModifier(layers);
    this.cutaways.collectDynamicCutawayWalls();
    this.devices = new DeviceService({
      content,
      profile,
      invalidator: renderer,
      startGolfSimulatorShot: () => this.startGolfSimulatorShot(),
      startFirstPersonInteractable: (interactableId) =>
        this.startFirstPersonInteractable(interactableId),
      onObjectInteraction,
    });
    this.trades = new TradeViewService(scene, renderer);
    this.staticScene = new StaticSceneService({
      scene,
      layers,
      renderer,
      lodController: this.lodController,
      lightGroups: content.lightGroups,
      indicatorMats: content.indicatorMats,
      roomSwitchLedMats: content.roomSwitchLedMats,
      interactiveMeshes: content.interactiveMeshes,
      bifoldPanels: content.bifoldPanels,
      tradeViews: this.trades.controller,
      cutaways: this.cutaways,
      collectDynamicObjects: (target) => {
        this.annotations.controller.collectDynamicObjects(target);
        this.devices.collectDynamicObjects(target);
      },
    });
    const batches = this.staticScene.batchOptimizer;

    this.usd = createViewerUsdRuntime({
      scene,
      layers,
      invalidator: renderer,
      isCeilingCutaway: () => this.cutaways.isCeilingCutaway(),
      setCeilingCutaway: () => this.toggleCeilingCutaway(),
      onBeforeZoneLoad: () => batches.unbatchAll(),
      onZoneLoaded: (canBatch) => {
        applySelectiveBevelModifier(layers);
        classifyScene([scene]);
        this.devices.interactions.rebindAfterUsdZoneLoad([scene]);
        this.cutaways.collectDynamicCutawayWalls();
        this.walkthrough.captureFurnitureColliders();
        if (!this.annotations.isActive() && canBatch) batches.optimize();
        this.walkthrough.invalidateObstacleCache();
        this.refreshView(true);
        this.staticScene.freezeStaticMatrices();
        renderer.invalidateShadows();
        renderer.requestRender();
      },
      onSyncBatchState: (shouldBatch) => {
        if (shouldBatch && !this.annotations.isActive()) batches.optimize();
        else batches.unbatchAll();
        this.staticScene.freezeStaticMatrices();
        this.walkthrough.invalidateObstacleCache();
        renderer.invalidateShadows();
        renderer.requestRender();
      },
    });

    this.walkthrough.captureFurnitureColliders();
    batches.optimize();
    batches.setBudgetAnchorZone('kitchen');
    this.trades.controller.indexScene();
    this.refreshView(true);
    this.staticScene.freezeStaticMatrices();
    this.input = new PointerInput({
      canvas,
      scene,
      firstFloorMeshGroup: layers.firstFloorMeshGroup,
      camera: this.camera,
      annotations: this.annotations.controller,
      invalidator: renderer,
      interactiveMeshes: content.interactiveMeshes,
      getWalkthrough: () => this.walkthrough,
      getUsdRuntime: () => this.usd,
      isPickExcluded: (mesh) => this.isPickExcluded(mesh),
      handleInteractable: (id) => this.devices.handleInteractable(id),
      toggleUfhZone: (zoneId) => this.devices.toggleUfhZone(zoneId),
      onObjectInteraction,
    });
    window.addEventListener('resize', () => this.handleResize());
    window.addEventListener('orientationchange', () => this.handleResize());
    window.visualViewport?.addEventListener('resize', () => this.handleResize());
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => this.handleResize());
      ro.observe(canvas);
    }

    // Navigation: anchor pans / orbits / zooms on the visible surface under the cursor.
    rig.setSurfacePicker((ndcX, ndcY) => this.camera.pickVisibleSurfacePointNdc(ndcX, ndcY));
    rig.controls.addEventListener('start', () => (this.userInteracting = true));
    rig.controls.addEventListener('end', () => (this.userInteracting = false));

    this.graphics = new GraphicsService({
      renderer,
      environment: this.environment,
      lodController: this.lodController,
      batchOptimizer: batches,
      refreshView: () => this.refreshView(true),
    });
    this.walkthrough.restoreFromSessionIfActive(this.camera.getPoseSnapshot());
  }

  // --- Frame loop -----------------------------------------------------------------

  public handleResize(): void {
    const w = this.canvas.clientWidth;
    const h = Math.max(1, this.canvas.clientHeight);
    this.camera.rig.resize(w, h);
    this.renderer.resize(w, h);
    this.graphics.setDevicePixelRatio(window.devicePixelRatio || 1);
  }

  public update(dtSeconds: number): void {
    const rig = this.camera.rig;
    let cameraMoved = false;
    if (this.walkthrough.update(dtSeconds)) {
      this.renderer.requestRender();
      cameraMoved = true;
    }
    // Tween + damping in one step (controls 'change' refreshes cutaways for damped motion).
    const wasTweening = rig.isTweening();
    if (!this.walkthrough.isActive() && rig.update(dtSeconds)) {
      if (wasTweening) {
        this.rooms.rebaseExplicitAnchor(rig.controls.target);
        this.refreshView(false);
      }
      this.renderer.requestRender();
      cameraMoved = true;
    }
    this.devices.update(dtSeconds, this.walkthrough.isActive() && cameraMoved);
    if (this.staticScene.batchOptimizer.stepFades(dtSeconds)) this.renderer.requestRender();

    const rendered = this.renderer.renderIfNeeded(
      this.scene,
      rig.getActiveCamera(),
      dtSeconds,
      cameraMoved,
      () => this.annotations.controller.prepareForRender()
    );
    if (rendered) this.graphics.recordFrame(dtSeconds * 1000, cameraMoved || this.userInteracting);
    if (!cameraMoved && !this.userInteracting) this.graphics.notifyIdle();
  }

  /** Re-evaluates cutaways, point-light culling, the current room and view listeners. */
  protected refreshView(forceNotifyView: boolean): void {
    const rig = this.camera.rig;
    const isWalkthrough = this.walkthrough.isActive();
    const camPos = rig.getActiveCamera().position;
    const result = this.cutaways.update({
      cameraPosition: camPos,
      target: rig.controls.target,
      isOrthographic: rig.isOrthographic(),
      orthoZoom: rig.orthoCamera.zoom,
      isWalkthrough,
    });
    const batches = this.staticScene.batchOptimizer;
    if (batches.syncPointLightVisibilityAndDistance(camPos, this.layers.firstFloorMeshGroup.visible)) {
      this.renderer.requestRender();
    }
    if (result.shadowsDirty) this.renderer.invalidateShadows();
    if (result.needsRender) this.renderer.requestRender();
    this.rooms.updateFromView(isWalkthrough, isWalkthrough ? camPos : rig.controls.target);
    this.camera.notifyView(forceNotifyView);
  }

  private isPickExcluded(mesh: THREE.Mesh): boolean {
    return mesh.geometry === this.content.glowPoolGeometry;
  }

  private startGolfSimulatorShot(): void {
    if (!this.walkthrough.isActive()) {
      if (this.annotations.isActive()) this.annotations.controller.setAnnotationMode(false);
      this.walkthrough.enter(this.camera.getPoseSnapshot(), GOLF_SHOT_SPAWN);
    }
    this.walkthrough.beginFirstPersonGolfShot();
  }

  private startFirstPersonInteractable(_interactableId: string): void {
    const sample = this.devices.interactions.getActiveFirstPersonPose();
    if (!this.walkthrough.isActive() && sample) {
      if (this.annotations.isActive()) this.annotations.controller.setAnnotationMode(false);
      this.walkthrough.enter(this.camera.getPoseSnapshot(), {
        position: sample.footPosition,
        yawDeg: THREE.MathUtils.radToDeg(sample.yawRad),
      });
    }
  }

  // --- Composite operations ------------------------------------------------------

  /** Re-frames the camera on the current room (or the default overview). */
  public recenterView(): void {
    const current = this.rooms.getCurrent();
    const reg = current ? this.rooms.getRegistration(current) : undefined;
    if (!reg || this.walkthrough.isActive()) {
      this.camera.flyToPreset('top');
      return;
    }
    const b = reg.bounds;
    this.renderer.resetHistory();
    this.camera.rig.useCamera(false);
    this.camera.rig.frameBounds(b);
    this.rooms.rebaseExplicitAnchor(new THREE.Vector3((b.minX + b.maxX) / 2, b.minY, (b.minZ + b.maxZ) / 2));
    this.renderer.requestRender();
  }

  public setFloorViewMode(mode: FloorViewMode): void {
    this.cutaways.setFloorViewMode(mode);
    this.refreshView(false);
    this.renderer.invalidateShadows();
    this.renderer.requestRender();
  }

  public toggleCeilingCutaway(): boolean {
    const next = this.cutaways.toggleCeilingCutaway();
    this.refreshView(false);
    this.renderer.invalidateShadows();
    this.renderer.requestRender();
    return next;
  }

  public setWalkthroughMode(enabled: boolean, spawnId?: string): boolean {
    if (enabled) {
      if (this.annotations.isActive()) this.annotations.controller.setAnnotationMode(false);
      const spawn = spawnId ? DEFAULT_WALKTHROUGH_SPAWNS.find((s) => s.id === spawnId) : undefined;
      this.walkthrough.enter(this.camera.getPoseSnapshot(), spawn);
      return true;
    }
    const savedPose = this.walkthrough.exit();
    if (savedPose) this.camera.flyToCameraPose(savedPose);
    return false;
  }

  public setTimeOfDay(mode: TimeOfDay): void {
    this.environment.setTimeOfDay(mode);
    // Devices / batching do not exist yet during construction (initial 'dusk').
    this.devices?.setTimeOfDay(mode);
    this.staticScene?.batchOptimizer.setTimeOfDay(mode);
    this.renderer.invalidateShadows();
    this.renderer.requestRender();
  }

  /**
   * Pre-computes all geometry bounding volumes, uploads all procedural textures
   * to GPU VRAM, compiles shaders across all floor/roof layers, and flushes the
   * initial render pass while `#loading-screen` is still visible so there is
   * zero lag when the viewport becomes interactive.
   */
  public async warmUpForStartup(
    onProgress?: (label: string, fraction: number) => Promise<void> | void
  ): Promise<void> {
    await this.renderer.init();
    const refreshedProfile = detectDeviceProfile(this.renderer.renderer);
    this.graphics.setDevicePixelRatio(refreshedProfile.devicePixelRatio);
    this.environment.bakeProceduralEnvironments(this.renderer.renderer);
    this.environment.applyTimeOfDay(this.environment.currentMinutes, this.scene);
    applyWebGpuLightVolumeToScene(this.scene);

    await onProgress?.('Indexing geometry & textures…', 0.65);

    const textures = new Set<THREE.Texture>();
    if (this.scene.environment) textures.add(this.scene.environment);

    const collectMaterialTextures = (mat: THREE.Material): void => {
      const m = mat as unknown as Record<string, unknown>;
      const texKeys = [
        'map',
        'alphaMap',
        'bumpMap',
        'normalMap',
        'roughnessMap',
        'metalnessMap',
        'emissiveMap',
        'aoMap',
        'lightMap',
        'envMap',
      ];
      for (const k of texKeys) {
        const val = m[k];
        if (val instanceof THREE.Texture) {
          textures.add(val);
        }
      }
    };

    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const geom = obj.geometry;
        if (geom instanceof THREE.BufferGeometry) {
          if (!geom.boundingSphere) geom.computeBoundingSphere();
          if (!geom.boundingBox) geom.computeBoundingBox();
        }
        const mat = obj.material;
        if (Array.isArray(mat)) {
          for (const item of mat) {
            if (item) collectMaterialTextures(item);
          }
        } else if (mat) {
          collectMaterialTextures(mat);
        }
      }
    });

    await onProgress?.('Uploading textures to GPU…', 0.78);
    const glRenderer = this.renderer.renderer;
    for (const tex of textures) {
      try {
        if (tex.image) {
          glRenderer.initTexture(tex);
        }
      } catch {
        // Ignore textures without valid image data in headless contexts
      }
    }

    await onProgress?.('Compiling shaders & shadow maps…', 0.90);
    const prevFirstFloorVis = this.layers.firstFloorMeshGroup.visible;
    const prevCeilingVis = this.layers.ceilingMeshGroup.visible;

    this.layers.firstFloorMeshGroup.visible = true;
    this.layers.ceilingMeshGroup.visible = true;
    this.scene.updateMatrixWorld(true);

    try {
      await glRenderer.compileAsync(this.scene, this.camera.rig.perspCamera);
    } catch {
      // Ignore shader compile warmup errors in non-standard WebGPU/WebGL contexts
    }

    this.layers.firstFloorMeshGroup.visible = prevFirstFloorVis;
    this.layers.ceilingMeshGroup.visible = prevCeilingVis;

    this.refreshView(true);
    this.renderer.invalidateShadows();
    this.renderer.requestRender();
    this.update(0.016);

    // Warm up surface-picker raycast so the first pointerdown/orbit has zero lazy setup
    try {
      this.camera.pickVisibleSurfacePointNdc(0, 0);
    } catch {
      // Ignore if canvas has zero dimensions in headless tests
    }

    try {
      await glRenderer.waitForGPU();
    } catch {
      // Ignore GPU sync errors in headless contexts
    }
  }
}
