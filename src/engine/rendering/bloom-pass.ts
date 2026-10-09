import * as THREE from 'three';
import type { Node, TextureNode, UniformNode } from 'three/webgpu';
import {
  If,
  clamp,
  float,
  max,
  min,
   type ShaderNodeObject,
  uniform,
  vec2,
  vec3,
} from 'three/tsl';

/**
 * Selective HDR bloom in TSL (Three.js Shading Language) for WebGPU:
 * A soft-knee luminance threshold prefilter (`BLOOM_THRESHOLD = 4.0`, `BLOOM_KNEE = 1.8`)
 * followed by a multi-scale dual-ring tent/Kawase filter kernel in screen UV space.
 * Only pixels well above the threshold — emissive bulb cores (~10–20), LED diffusers, halos —
 * contribute, so lit white walls (< 3) do not glow.
 */

/** Pre-exposure HDR luminance where bloom starts (emissive cores are ~10–20, lit walls < 3). */
export const BLOOM_THRESHOLD = 4.0;
export const BLOOM_KNEE = 1.8;

export class BloomPass {
  public readonly uTexelSize: ShaderNodeObject<UniformNode<THREE.Vector2>>;
  public readonly uThreshold: ShaderNodeObject<UniformNode<number>>;
  public readonly uKnee: ShaderNodeObject<UniformNode<number>>;
  public readonly uIntensity: ShaderNodeObject<UniformNode<number>>;
  private width = 0;
  private height = 0;

  public constructor() {
    this.uTexelSize = uniform(new THREE.Vector2(1 / 1920, 1 / 1080));
    this.uThreshold = uniform(BLOOM_THRESHOLD);
    this.uKnee = uniform(BLOOM_KNEE);
    this.uIntensity = uniform(0.0);
  }

  public setSize(fullWidth: number, fullHeight: number): void {
    const w = Math.max(1, Math.floor(fullWidth));
    const h = Math.max(1, Math.floor(fullHeight));
    if (w === this.width && h === this.height) return;
    this.width = w;
    this.height = h;
    this.uTexelSize.value.set(1 / w, 1 / h);
  }

  public setIntensity(intensity: number): void {
    this.uIntensity.value = Math.max(0, intensity);
  }

  /**
   * Soft-knee HDR luminance threshold prefilter with firefly clamp (`<= 64.0`).
   */
  private prefilter(c: ShaderNodeObject<Node>): ShaderNodeObject<Node> {
    const lum = max(c.r, max(c.g, c.b));
    const soft = clamp(
      lum.sub(this.uThreshold).add(this.uKnee),
      0.0,
      this.uKnee.mul(2.0)
    );
    const softCurve = soft.mul(soft).div(this.uKnee.mul(4.0).add(1e-5));
    const contribution = max(softCurve, lum.sub(this.uThreshold)).div(max(lum, 1e-5));
    return min(c.mul(contribution), vec3(64.0));
  }

  /**
   * Builds the TSL node that evaluates multi-scale warm architectural bloom at `uvNode`.
   */
  public buildNode(
    colorNode: ShaderNodeObject<TextureNode>,
    uvNode: ShaderNodeObject<Node>
  ): ShaderNodeObject<Node> {
    const bloomOut = vec3(0.0).toVar();

    const samplePrefiltered = (offsetTexelsX: number, offsetTexelsY: number): ShaderNodeObject<Node> => {
      const sampleUv = clamp(
        uvNode.add(this.uTexelSize.mul(vec2(offsetTexelsX, offsetTexelsY))),
        0.001,
        0.999
      );
      return this.prefilter((colorNode.sample(sampleUv) as unknown as ShaderNodeObject<TextureNode>).level(float(0)).rgb);
    };

    If(this.uIntensity.greaterThan(0.001), () => {
      // Center + 3 concentric multi-scale Kawase/tent rings (r = 1.5, 4.5, 11.0, 22.0 texels)
      const center = samplePrefiltered(0.0, 0.0);

      const ring1 = samplePrefiltered(-1.5, -1.5)
        .add(samplePrefiltered(1.5, -1.5))
        .add(samplePrefiltered(-1.5, 1.5))
        .add(samplePrefiltered(1.5, 1.5))
        .mul(0.25);

      const ring2 = samplePrefiltered(-4.5, 0.0)
        .add(samplePrefiltered(4.5, 0.0))
        .add(samplePrefiltered(0.0, -4.5))
        .add(samplePrefiltered(0.0, 4.5))
        .mul(0.25);

      const ring3 = samplePrefiltered(-8.5, -8.5)
        .add(samplePrefiltered(8.5, -8.5))
        .add(samplePrefiltered(-8.5, 8.5))
        .add(samplePrefiltered(8.5, 8.5))
        .mul(0.25);

      const ring4 = samplePrefiltered(-18.0, 0.0)
        .add(samplePrefiltered(18.0, 0.0))
        .add(samplePrefiltered(0.0, -18.0))
        .add(samplePrefiltered(0.0, 18.0))
        .mul(0.25);

      const combined = center
        .mul(0.18)
        .add(ring1.mul(0.30))
        .add(ring2.mul(0.24))
        .add(ring3.mul(0.16))
        .add(ring4.mul(0.12));

      bloomOut.assign(combined.mul(this.uIntensity));
    });

    return float(1.0).mul(bloomOut);
  }

  public dispose(): void {
    // TSL nodes are managed by the WebGPU PostProcessing pipeline
  }
}
