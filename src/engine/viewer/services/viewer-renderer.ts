import * as THREE from 'three';
import type { RigCamera } from '../../camera/camera-rig.ts';
import { PostProcessingPipeline } from '../../rendering/post-processing-pipeline.ts';
import type { RenderInvalidator } from './viewer-types.ts';

/**
 * Owns the WebGL renderer, the post-processing pipeline and the on-demand
 * render flag. Frames are only drawn when something requested a render.
 */
export class ViewerRenderer implements RenderInvalidator {
  public readonly renderer: THREE.WebGLRenderer;
  public readonly post: PostProcessingPipeline;
  private dirty = true;
  private postBlurSettleFrames = 0;

  public constructor(canvas: HTMLCanvasElement) {
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

    this.post = new PostProcessingPipeline(this.renderer, canvas.clientWidth, canvas.clientHeight);
  }

  public requestRender(): void {
    this.dirty = true;
  }

  public invalidateShadows(): void {
    this.renderer.shadowMap.needsUpdate = true;
  }

  /** Clears temporal history (TAA / motion blur) after a camera cut. */
  public resetHistory(): void {
    this.post.resetHistory();
  }

  public getMaxAnisotropy(): number {
    return this.renderer.capabilities.getMaxAnisotropy();
  }

  public resize(width: number, height: number): void {
    this.post.resize(width, height);
    this.dirty = true;
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
    if (cameraMoved && this.post.isMotionBlurEnabled()) {
      this.postBlurSettleFrames = 1;
    } else if (!this.dirty && this.postBlurSettleFrames > 0) {
      this.postBlurSettleFrames -= 1;
      this.dirty = true;
    }
    if (!this.dirty) return false;
    camera.updateMatrixWorld();
    beforeRender();
    this.post.render(scene, camera, dtSeconds);
    this.dirty = false;
    return true;
  }
}
