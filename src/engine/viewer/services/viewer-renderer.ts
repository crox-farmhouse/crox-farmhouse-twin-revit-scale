import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import type { RigCamera } from '../../camera/camera-rig.ts';
import { syncBakedLightCameraMatrix } from '../../lighting/baked-light-volume.ts';
import {
  PostProcessingPipeline,
  RENDERER_TONE_MAPPING,
} from '../../rendering/post-processing-pipeline.ts';
import type { RenderInvalidator } from './viewer-types.ts';

/**
 * Owns the WebGPU renderer (with automatic WebGL2 backend fallback), the
 * post-processing pipeline and the on-demand render flag. Frames are only
 * drawn when something requested a render and after `init()` has resolved.
 */
export class ViewerRenderer implements RenderInvalidator {
  public readonly renderer: WebGPURenderer;
  public readonly post: PostProcessingPipeline;
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private needsRender = true;
  private shadowsDirty = true;
  private postBlurSettleFrames = 0;

  public constructor(canvas: HTMLCanvasElement) {
    this.renderer = new WebGPURenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      logarithmicDepthBuffer: true,
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.setPixelRatio(1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.toneMapping = RENDERER_TONE_MAPPING;
    this.renderer.toneMappingExposure = 1.12;

    this.post = new PostProcessingPipeline(this.renderer, canvas.clientWidth, canvas.clientHeight);
  }

  public init(): Promise<void> {
    if (this.initialized) return Promise.resolve();
    if (!this.initPromise) {
      this.initPromise = this.renderer.init().then(() => {
        this.initialized = true;
        this.needsRender = true;
        this.shadowsDirty = true;
      });
    }
    return this.initPromise;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public requestRender(): void {
    this.needsRender = true;
  }

  public invalidateShadows(): void {
    this.shadowsDirty = true;
  }

  /** Clears temporal history (TAA / motion blur) after a camera cut. */
  public resetHistory(): void {
    this.post.resetHistory();
  }

  public getMaxAnisotropy(): number {
    try {
      return this.renderer.getMaxAnisotropy() || 8;
    } catch {
      return 8;
    }
  }

  public resize(width: number, height: number): void {
    this.post.resize(width, height);
    this.needsRender = true;
  }

  /**
   * Draws a frame when dirty (plus one settle frame after motion-blurred camera
   * motion). Returns true when a frame was rendered.
   */
  public renderIfNeeded(
    scene: THREE.Scene,
    camera: RigCamera,
    dtSeconds: number,
    cameraMoved: boolean,
    beforeRender: () => void
  ): boolean {
    if (!this.initialized) {
      return false;
    }
    if (cameraMoved && this.post.isMotionBlurEnabled()) {
      this.postBlurSettleFrames = 1;
    } else if (!this.needsRender && this.postBlurSettleFrames > 0) {
      this.postBlurSettleFrames -= 1;
      this.needsRender = true;
    }
    if (!this.needsRender) return false;
    if (this.shadowsDirty) {
      for (const child of scene.children) {
        if (child instanceof THREE.Light && child.castShadow && child.shadow) {
          child.shadow.autoUpdate = false;
          child.shadow.needsUpdate = true;
        }
      }
      this.shadowsDirty = false;
    }
    camera.updateMatrixWorld();
    syncBakedLightCameraMatrix(camera);
    beforeRender();
    this.post.render(scene, camera, dtSeconds);
    this.needsRender = false;
    return true;
  }
}
