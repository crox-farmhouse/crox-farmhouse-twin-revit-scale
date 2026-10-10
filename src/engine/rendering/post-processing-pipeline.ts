import * as THREE from 'three';
import {
  PostProcessing,
  type Node,
  type PassNode,
  type TextureNode,
  type UniformNode,
  type WebGPURenderer,
} from 'three/webgpu';
import {
  Fn,
  If,
  abs,
  acesFilmicToneMapping,
  agxToneMapping,
  clamp,
  cos,
  dot,
  exp2,
  float,
  fract,
  length,
  log2,
  max,
  min,
  mix,
  pass,
  pow,
  renderGroup,
  screenCoordinate,
  select,
  type ShaderNodeObject,
  sin,
  smoothstep,
  sqrt,
  sRGBTransferOETF,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import type { RigCamera } from '../camera/camera-rig.ts';
import type { GraphicsTier, GraphicsTierSettings } from '../../core/types/twin-ux.ts';
import { getTierSettings, isGraphicsTier } from '../perf/tier-settings.ts';
import { BloomPass } from './bloom-pass.ts';

/** Legacy 3-step preset kept for the existing HUD; each preset maps onto a {@link GraphicsTier}. */
export type GraphicsQualityPreset = 'ultra' | 'balanced' | 'performance';
export type PostProcessingQualityPreset = GraphicsQualityPreset;

export interface GraphicsSettingsState {
  readonly quality: GraphicsQualityPreset;
  readonly tier: GraphicsTier;
  readonly motionBlurEnabled: boolean;
  readonly motionBlurStrength: number;
  readonly postProcessingEnabled: boolean;
  readonly ambientOcclusionEnabled: boolean;
  readonly fxaaEnabled: boolean;
  readonly bloomEnabled: boolean;
  readonly sharpenEnabled: boolean;
  readonly pixelRatio: number;
}
export type PostProcessingSettings = GraphicsSettingsState;

const PRESET_TO_TIER: Readonly<Record<GraphicsQualityPreset, GraphicsTier>> = {
  ultra: 'ultra',
  balanced: 'high',
  performance: 'low',
};

function tierToPreset(tier: GraphicsTier): GraphicsQualityPreset {
  if (tier === 'ultra') return 'ultra';
  if (tier === 'low') return 'performance';
  return 'balanced';
}

/** Vertical projection scale (`P[1][1]`) of the rig's 42° perspective camera; used until one is seen. */
const DEFAULT_PERSPECTIVE_PROJ_Y = 1 / Math.tan(THREE.MathUtils.degToRad(21));

/**
 * Display transform used by the post pipeline and by the renderer's direct-to-canvas path.
 * AgX keeps hue and desaturates gracefully toward white in bright light pools, where ACES pushes
 * warm interiors to flat saturated yellow. Flip to `'aces'` to revert in one line.
 */
export const POST_TONE_MAPPER: 'agx' | 'aces' = 'agx';

/** Matching built-in tone mapping for frames rendered straight to the canvas (post disabled). */
export const RENDERER_TONE_MAPPING: THREE.ToneMapping =
  POST_TONE_MAPPER === 'agx' ? THREE.AgXToneMapping : THREE.ACESFilmicToneMapping;

const STORAGE_KEY = 'crox_graphics_settings_v3';
const AO_INTENSITY = 0.42;
const BLOOM_INTENSITY = 0.12;
const SHARPEN_INTENSITY = 0.26;
const MOTION_BLUR_STRENGTH = 0.38;

function currentDevicePixelRatio(): number {
  return typeof window !== 'undefined' && window.devicePixelRatio > 0 ? window.devicePixelRatio : 1;
}

function isWebGpuCapableRenderer(
  renderer: WebGPURenderer | THREE.WebGLRenderer
): renderer is WebGPURenderer {
  return 'isWebGPURenderer' in renderer && renderer.isWebGPURenderer === true;
}

export class PostProcessingPipeline {
  private readonly renderer: WebGPURenderer | THREE.WebGLRenderer;
  private postProcessing: PostProcessing | null = null;
  private scenePass: ShaderNodeObject<PassNode> | null = null;
  private readonly bloom = new BloomPass();

  // Live TSL Uniforms driving the WGSL post-processing node graph
  private readonly uResolution: ShaderNodeObject<UniformNode<THREE.Vector2>>;
  private readonly uTexelSize: ShaderNodeObject<UniformNode<THREE.Vector2>>;
  private readonly uNear = uniform(0.1).setGroup(renderGroup);
  private readonly uFar = uniform(120.0).setGroup(renderGroup);
  private readonly uIsOrtho = uniform(0.0).setGroup(renderGroup);
  private readonly uIsLogDepth = uniform(0.0).setGroup(renderGroup);
  private readonly uOrthoEquivDepth = uniform(10.0).setGroup(renderGroup);
  private readonly uExposure: ShaderNodeObject<UniformNode<number>>;
  private readonly uCurrInvViewProj = uniform(new THREE.Matrix4()).setGroup(renderGroup);
  private readonly uPrevViewProj = uniform(new THREE.Matrix4()).setGroup(renderGroup);
  private readonly uMotionBlurEnabled = uniform(1.0).setGroup(renderGroup);
  private readonly uShutterScale = uniform(MOTION_BLUR_STRENGTH).setGroup(renderGroup);
  private readonly uAoIntensity = uniform(AO_INTENSITY).setGroup(renderGroup);
  private readonly uSharpenIntensity = uniform(SHARPEN_INTENSITY).setGroup(renderGroup);
  private readonly uFxaaEnabled = uniform(0.0).setGroup(renderGroup);

  private readonly currViewProj = new THREE.Matrix4();
  private readonly currInvViewProj = new THREE.Matrix4();
  private readonly prevViewProj = new THREE.Matrix4();
  private hasPrevMatrix = false;

  private tier: GraphicsTier = 'high';
  /** Subtle ~135° shutter camera-velocity motion blur; active while the post pipeline is enabled. */
  private motionBlurEnabled = true;
  private motionBlurStrength = MOTION_BLUR_STRENGTH;
  private postEnabled = true;
  private ambientOcclusionEnabled = true;
  private fxaaEnabled = false;
  private bloomEnabled = false;
  private sharpenEnabled = true;
  private targetPixelRatio = 1.0;
  private cssWidth = 1;
  private cssHeight = 1;
  private currentPixelRatio = 1.0;
  private lastPerspectiveProjY = DEFAULT_PERSPECTIVE_PROJ_Y;

  public constructor(
    renderer: WebGPURenderer | THREE.WebGLRenderer,
    initialWidth = 1,
    initialHeight = 1
  ) {
    this.renderer = renderer;
    this.cssWidth = Math.max(1, initialWidth);
    this.cssHeight = Math.max(1, initialHeight);

    this.assignTierSettings(getTierSettings(this.tier, currentDevicePixelRatio()));
    this.restoreSettings();
    this.currentPixelRatio = this.targetPixelRatio;

    const rtWidth = Math.max(1, Math.round(this.cssWidth * this.currentPixelRatio));
    const rtHeight = Math.max(1, Math.round(this.cssHeight * this.currentPixelRatio));

    this.uResolution = uniform(new THREE.Vector2(rtWidth, rtHeight)).setGroup(renderGroup);
    this.uTexelSize = uniform(new THREE.Vector2(1 / rtWidth, 1 / rtHeight)).setGroup(renderGroup);
    this.uExposure = uniform(renderer.toneMappingExposure).setGroup(renderGroup);
    this.bloom.setSize(rtWidth, rtHeight);

    this.syncRendererPixelRatio();
  }

  private assignTierSettings(settings: GraphicsTierSettings): void {
    this.tier = settings.tier;
    this.targetPixelRatio = Math.max(0.5, settings.pixelRatio);
    this.postEnabled = settings.postProcessing;
    this.ambientOcclusionEnabled = settings.postProcessing && settings.ambientOcclusion;
    this.fxaaEnabled = false;
    this.bloomEnabled = settings.postProcessing && settings.bloom;
    this.sharpenEnabled = settings.postProcessing && settings.sharpen;
  }

  private syncRendererPixelRatio(): void {
    this.currentPixelRatio = this.targetPixelRatio;
    this.renderer.setPixelRatio(this.currentPixelRatio);
    this.renderer.setSize(this.cssWidth, this.cssHeight, false);

    const rtWidth = Math.max(1, Math.round(this.cssWidth * this.currentPixelRatio));
    const rtHeight = Math.max(1, Math.round(this.cssHeight * this.currentPixelRatio));
    this.uResolution.value.set(rtWidth, rtHeight);
    this.uTexelSize.value.set(1 / rtWidth, 1 / rtHeight);
    this.bloom.setSize(rtWidth, rtHeight);
  }

  public resize(cssWidth: number, cssHeight: number, pixelRatio?: number): void {
    this.cssWidth = Math.max(1, cssWidth);
    this.cssHeight = Math.max(1, cssHeight);
    if (typeof pixelRatio === 'number' && Number.isFinite(pixelRatio) && pixelRatio > 0) {
      this.targetPixelRatio = Math.max(0.5, pixelRatio);
    }
    this.syncRendererPixelRatio();
    this.hasPrevMatrix = false;
  }

  public resetHistory(): void {
    this.hasPrevMatrix = false;
  }

  public getSettings(): GraphicsSettingsState {
    return {
      quality: tierToPreset(this.tier),
      tier: this.tier,
      motionBlurEnabled: this.motionBlurEnabled,
      motionBlurStrength: this.motionBlurStrength,
      postProcessingEnabled: this.postEnabled,
      ambientOcclusionEnabled: this.ambientOcclusionEnabled,
      fxaaEnabled: this.fxaaEnabled,
      bloomEnabled: this.bloomEnabled,
      sharpenEnabled: this.sharpenEnabled,
      pixelRatio: this.currentPixelRatio,
    };
  }

  /**
   * Applies a graphics tier (pixel ratio, AO, bloom, sharpen, post on/off). With post disabled the
   * scene renders straight to the canvas using the renderer's built-in tone mapping, which uses
   * the same exposure curve as the post shader so lighting looks identical either way.
   */
  public applyTierSettings(settings: GraphicsTierSettings): void {
    const prevRatio = this.targetPixelRatio;
    this.assignTierSettings(settings);
    if (
      Math.abs(prevRatio - this.targetPixelRatio) > 1e-4 ||
      this.currentPixelRatio !== this.targetPixelRatio
    ) {
      this.syncRendererPixelRatio();
    }
    this.hasPrevMatrix = false;
    this.saveSettings();
  }

  /** Legacy preset API: `ultra` → ultra tier, `balanced` → high tier, `performance` → low tier. */
  public setQualityPreset(preset: GraphicsQualityPreset): void {
    this.applyTierSettings(getTierSettings(PRESET_TO_TIER[preset], currentDevicePixelRatio()));
  }

  public cycleQualityPreset(): GraphicsQualityPreset {
    const order: readonly GraphicsQualityPreset[] = ['ultra', 'balanced', 'performance'];
    const current = tierToPreset(this.tier);
    const next = order[(order.indexOf(current) + 1) % order.length]!;
    this.setQualityPreset(next);
    return next;
  }

  public isMotionBlurEnabled(): boolean {
    return this.motionBlurEnabled;
  }

  public setMotionBlurEnabled(enabled: boolean): void {
    this.motionBlurEnabled = enabled;
    if (enabled) this.postEnabled = true;
    this.saveSettings();
  }

  public toggleMotionBlur(): boolean {
    this.setMotionBlurEnabled(!this.motionBlurEnabled);
    return this.motionBlurEnabled;
  }

  public isSsaoEnabled(): boolean {
    return this.ambientOcclusionEnabled;
  }

  public setSsaoEnabled(enabled: boolean): void {
    this.ambientOcclusionEnabled = enabled;
    if (enabled) this.postEnabled = true;
    this.saveSettings();
  }

  public toggleSsao(): boolean {
    this.setSsaoEnabled(!this.ambientOcclusionEnabled);
    return this.ambientOcclusionEnabled;
  }

  public isFxaaEnabled(): boolean {
    return this.fxaaEnabled;
  }

  public setFxaaEnabled(enabled: boolean): void {
    this.fxaaEnabled = enabled;
    if (enabled) this.postEnabled = true;
    this.saveSettings();
  }

  public toggleFxaa(): boolean {
    this.setFxaaEnabled(!this.fxaaEnabled);
    return this.fxaaEnabled;
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          tier: this.tier,
          pixelRatio: this.targetPixelRatio,
          motionBlurEnabled: this.motionBlurEnabled,
        })
      );
    } catch {
      // Ignore storage quota / disabled storage errors
    }
  }

  private restoreSettings(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<{
        tier: unknown;
        pixelRatio: unknown;
        motionBlurEnabled: unknown;
      }>;
      if (isGraphicsTier(parsed.tier)) {
        const base = getTierSettings(parsed.tier, currentDevicePixelRatio());
        const ratio =
          typeof parsed.pixelRatio === 'number' && parsed.pixelRatio > 0
            ? Math.min(base.pixelRatio, parsed.pixelRatio)
            : base.pixelRatio;
        this.assignTierSettings({ ...base, pixelRatio: ratio });
      }
      if (typeof parsed.motionBlurEnabled === 'boolean') {
        this.motionBlurEnabled = parsed.motionBlurEnabled;
      }
    } catch {
      // Ignore malformed stored settings
    }
  }

  private ensurePostProcessing(
    renderer: WebGPURenderer,
    scene: THREE.Scene,
    camera: THREE.Camera
  ): PostProcessing {
    if (this.postProcessing && this.scenePass) {
      this.scenePass.scene = scene;
      this.scenePass.camera = camera;
      return this.postProcessing;
    }

    const scenePass = pass(scene, camera);
    // Ensure PassNode renderTarget dimensions are always exact integers (preventing fractional
    // viewport/scissor validation errors on fractional DPRs like 0.75, 0.85, 1.25, or 1.5).
    const passInternal = scenePass as unknown as {
      _width: number;
      _height: number;
      _pixelRatio: number;
      _resolution: number;
      renderTarget: THREE.RenderTarget;
      setSize: (width: number, height: number) => void;
    };
    passInternal.setSize = function (width: number, height: number): void {
      this._width = width;
      this._height = height;
      const effectiveWidth = Math.max(1, Math.floor(this._width * this._pixelRatio * this._resolution));
      const effectiveHeight = Math.max(1, Math.floor(this._height * this._pixelRatio * this._resolution));
      this.renderTarget.setSize(effectiveWidth, effectiveHeight);
    };
    // Work around Three.js r180 WebGPU RenderTarget.setSize bug: when `renderTarget.setSize`
    // disposes the underlying GPU textures, increment `.version` on color and depth attachments
    // so `NodeSampledTexture.update()` rebuilds the composite quad bind group with the new views.
    scenePass.renderTarget.addEventListener('dispose', () => {
      for (const tex of scenePass.renderTarget.textures) {
        tex.version++;
      }
      if (scenePass.renderTarget.depthTexture) {
        scenePass.renderTarget.depthTexture.version++;
      }
    });
    this.scenePass = scenePass;

    const colorNode = scenePass.getTextureNode('output');
    const depthNode = scenePass.getTextureNode('depth');

    const postProcessing = new PostProcessing(renderer);
    postProcessing.outputColorTransform = false;
    postProcessing.outputNode = this.buildCompositeNode(colorNode, depthNode);
    this.postProcessing = postProcessing;
    return postProcessing;
  }

  private buildCompositeNode(
    colorNode: ShaderNodeObject<TextureNode>,
    depthNode: ShaderNodeObject<TextureNode>
  ): ShaderNodeObject<Node> {
    const sampleHdr = (sampleUv: ShaderNodeObject<Node>): ShaderNodeObject<Node> =>
      (colorNode.sample(clamp(sampleUv, 0.001, 0.999)) as unknown as ShaderNodeObject<TextureNode>).level(float(0)).rgb;

    const perceptualLuma = (rgb: ShaderNodeObject<Node>): ShaderNodeObject<Node> =>
      sqrt(max(0.0, dot(rgb, vec3(0.299, 0.587, 0.114))));

    const linearizeDepth = (d: ShaderNodeObject<Node>): ShaderNodeObject<Node> => {
      const orthoLinZ = mix(this.uNear, this.uFar, d);
      const logLinZ = this.uNear.mul(exp2(d.mul(log2(this.uFar.div(max(1e-6, this.uNear))))));
      const zNdc = d.mul(2.0).sub(1.0);
      const perspLinZ = this.uNear
        .mul(this.uFar)
        .mul(2.0)
        .div(max(1e-5, this.uFar.add(this.uNear).sub(zNdc.mul(this.uFar.sub(this.uNear)))));
      return select(
        this.uIsOrtho.greaterThan(0.5),
        orthoLinZ,
        select(this.uIsLogDepth.greaterThan(0.5), logLinZ, perspLinZ)
      );
    };

    const readLinearDepth = (sampleUv: ShaderNodeObject<Node>): ShaderNodeObject<Node> =>
      linearizeDepth(depthNode.sample(clamp(sampleUv, 0.001, 0.999)).r);

    const toneMap = (hdrColor: ShaderNodeObject<Node>): ShaderNodeObject<Node> => {
      if (POST_TONE_MAPPER === 'agx') {
        const base = agxToneMapping(hdrColor, this.uExposure);
        // AgX Punchy midtone contrast & natural colour saturation preservation
        const contrasted = pow(max(base, vec3(0.0)), vec3(1.12));
        const agxLuma = dot(contrasted, vec3(0.2126, 0.7152, 0.0722));
        return clamp(vec3(agxLuma).add(contrasted.sub(agxLuma).mul(1.16)), 0.0, 1.0);
      }
      return clamp(acesFilmicToneMapping(hdrColor, this.uExposure), 0.0, 1.0);
    };

    // Directional FXAA 3.11 (3x3 neighborhood edge orientation + tangent span search
    // + sub-pixel aliasing filter) fused with Contrast-Adaptive Sharpening (CAS).
    const computeFxaaAndCas = (
      vUv: ShaderNodeObject<Node>,
      centerColor: ShaderNodeObject<Node>
    ): ShaderNodeObject<Node> => {
      const rgbN = sampleHdr(vUv.add(vec2(0.0, this.uTexelSize.y))).toVar();
      const rgbS = sampleHdr(vUv.sub(vec2(0.0, this.uTexelSize.y))).toVar();
      const rgbE = sampleHdr(vUv.add(vec2(this.uTexelSize.x, 0.0))).toVar();
      const rgbW = sampleHdr(vUv.sub(vec2(this.uTexelSize.x, 0.0))).toVar();

      const lumaM = perceptualLuma(centerColor).toVar();
      const lumaN = perceptualLuma(rgbN).toVar();
      const lumaS = perceptualLuma(rgbS).toVar();
      const lumaE = perceptualLuma(rgbE).toVar();
      const lumaW = perceptualLuma(rgbW).toVar();

      const lumaMin = min(lumaM, min(min(lumaN, lumaS), min(lumaE, lumaW))).toVar();
      const lumaMax = max(lumaM, max(max(lumaN, lumaS), max(lumaE, lumaW))).toVar();
      const lumaRange = lumaMax.sub(lumaMin).toVar();

      const resultColor = vec3(centerColor).toVar();

      If(
        this.uFxaaEnabled
          .greaterThan(0.5)
          .and(lumaRange.greaterThanEqual(max(0.0312, lumaMax.mul(0.125)))),
        () => {
          const rgbNW = sampleHdr(vUv.add(vec2(this.uTexelSize.x.negate(), this.uTexelSize.y)));
          const rgbNE = sampleHdr(vUv.add(vec2(this.uTexelSize.x, this.uTexelSize.y)));
          const rgbSW = sampleHdr(
            vUv.add(vec2(this.uTexelSize.x.negate(), this.uTexelSize.y.negate()))
          );
          const rgbSE = sampleHdr(vUv.add(vec2(this.uTexelSize.x, this.uTexelSize.y.negate())));

          const lumaNW = perceptualLuma(rgbNW);
          const lumaNE = perceptualLuma(rgbNE);
          const lumaSW = perceptualLuma(rgbSW);
          const lumaSE = perceptualLuma(rgbSE);

          const lumaDownUp = lumaS.add(lumaN);
          const lumaLeftRight = lumaW.add(lumaE);
          const lumaLeftCorners = lumaSW.add(lumaNW);
          const lumaDownCorners = lumaSW.add(lumaSE);
          const lumaRightCorners = lumaSE.add(lumaNE);
          const lumaUpCorners = lumaNE.add(lumaNW);

          const edgeHorizontal = abs(lumaW.mul(-2.0).add(lumaLeftCorners))
            .add(abs(lumaM.mul(-2.0).add(lumaDownUp)).mul(2.0))
            .add(abs(lumaE.mul(-2.0).add(lumaRightCorners)));
          const edgeVertical = abs(lumaN.mul(-2.0).add(lumaUpCorners))
            .add(abs(lumaM.mul(-2.0).add(lumaLeftRight)).mul(2.0))
            .add(abs(lumaS.mul(-2.0).add(lumaDownCorners)));

          const isHorizontal = edgeHorizontal.greaterThanEqual(edgeVertical).toVar();
          const luma1 = select(isHorizontal, lumaS, lumaW);
          const luma2 = select(isHorizontal, lumaN, lumaE);
          const gradient1 = luma1.sub(lumaM);
          const gradient2 = luma2.sub(lumaM);
          const is1Steepest = abs(gradient1).greaterThanEqual(abs(gradient2));
          const gradientScaled = max(abs(gradient1), abs(gradient2)).mul(0.25).toVar();

          const baseStep = select(isHorizontal, this.uTexelSize.y, this.uTexelSize.x);
          const stepLength = select(is1Steepest, baseStep.negate(), baseStep).toVar();
          const lumaLocalAverage = select(
            is1Steepest,
            luma1.add(lumaM).mul(0.5),
            luma2.add(lumaM).mul(0.5)
          ).toVar();

          const currentUv = vec2(
            select(isHorizontal, vUv.x, vUv.x.add(stepLength.mul(0.5))),
            select(isHorizontal, vUv.y.add(stepLength.mul(0.5)), vUv.y)
          );

          const offset = select(
            isHorizontal,
            vec2(this.uTexelSize.x, 0.0),
            vec2(0.0, this.uTexelSize.y)
          ).toVar();
          const uv1 = currentUv.sub(offset).toVar();
          const uv2 = currentUv.add(offset).toVar();

          const lumaEnd1 = perceptualLuma(sampleHdr(uv1)).sub(lumaLocalAverage).toVar();
          const lumaEnd2 = perceptualLuma(sampleHdr(uv2)).sub(lumaLocalAverage).toVar();
          const reached1 = abs(lumaEnd1).greaterThanEqual(gradientScaled).toVar();
          const reached2 = abs(lumaEnd2).greaterThanEqual(gradientScaled).toVar();

          uv1.assign(select(reached1, uv1, uv1.sub(offset.mul(1.5))));
          uv2.assign(select(reached2, uv2, uv2.add(offset.mul(1.5))));

          const stepMultipliers: readonly number[] = [2.0, 2.0, 4.0, 8.0];
          for (const stepMul of stepMultipliers) {
            If(reached1.and(reached2).not(), () => {
              If(reached1.not(), () => {
                lumaEnd1.assign(perceptualLuma(sampleHdr(uv1)).sub(lumaLocalAverage));
              });
              If(reached2.not(), () => {
                lumaEnd2.assign(perceptualLuma(sampleHdr(uv2)).sub(lumaLocalAverage));
              });
              reached1.assign(abs(lumaEnd1).greaterThanEqual(gradientScaled));
              reached2.assign(abs(lumaEnd2).greaterThanEqual(gradientScaled));
              uv1.assign(select(reached1, uv1, uv1.sub(offset.mul(stepMul))));
              uv2.assign(select(reached2, uv2, uv2.add(offset.mul(stepMul))));
            });
          }

          const distance1 = select(isHorizontal, vUv.x.sub(uv1.x), vUv.y.sub(uv1.y));
          const distance2 = select(isHorizontal, uv2.x.sub(vUv.x), uv2.y.sub(vUv.y));
          const isDirection1 = distance1.lessThan(distance2);
          const distanceFinal = min(distance1, distance2);
          const edgeThickness = max(1e-5, distance1.add(distance2));
          const pixelOffset = distanceFinal.negate().div(edgeThickness).add(0.5);

          const isLumaCenterSmaller = lumaM.lessThan(lumaLocalAverage);
          const chosenEndLuma = select(isDirection1, lumaEnd1, lumaEnd2);
          const correctVariation = chosenEndLuma.lessThan(0.0).notEqual(isLumaCenterSmaller);
          const finalOffset = select(correctVariation, pixelOffset, float(0.0)).toVar();

          const lumaAverage = lumaDownUp
            .add(lumaLeftRight)
            .mul(2.0)
            .add(lumaLeftCorners)
            .add(lumaRightCorners)
            .mul(1.0 / 12.0);
          const subPixelOffset1 = clamp(
            abs(lumaAverage.sub(lumaM)).div(max(1e-5, lumaRange)),
            0.0,
            1.0
          );
          const subPixelOffset2 = subPixelOffset1
            .mul(-2.0)
            .add(3.0)
            .mul(subPixelOffset1)
            .mul(subPixelOffset1);
          const subPixelOffsetFinal = subPixelOffset2.mul(subPixelOffset2).mul(0.75);

          finalOffset.assign(max(finalOffset, subPixelOffsetFinal));
          const finalUv = vec2(
            select(isHorizontal, vUv.x, vUv.x.add(finalOffset.mul(stepLength))),
            select(isHorizontal, vUv.y.add(finalOffset.mul(stepLength)), vUv.y)
          );
          resultColor.assign(sampleHdr(finalUv));
        }
      );

      If(this.uSharpenIntensity.greaterThan(0.001), () => {
        const neighborAvg = rgbN.add(rgbS).add(rgbE).add(rgbW).mul(0.25);
        const detailWeight = float(1.0)
          .sub(smoothstep(0.25, 0.85, lumaRange))
          .mul(this.uSharpenIntensity);
        resultColor.assign(
          max(vec3(0.0), resultColor.add(centerColor.sub(neighborAvg).mul(detailWeight)))
        );
      });

      return resultColor;
    };

    // Bilateral Screen-Space Ambient Occlusion (SSAO): 4 rotated symmetric pairs (8 depth taps total).
    // Radius and distance fade are driven by the on-screen scale (world units per pixel), so an
    // orthographic view produces the same AO as a perspective view at the same apparent zoom.
    const computeContactAO = (
      vUv: ShaderNodeObject<Node>,
      centerLinZ: ShaderNodeObject<Node>,
      noise: ShaderNodeObject<Node>
    ): ShaderNodeObject<Node> => {
      const scaleZ = select(
        this.uIsOrtho.greaterThan(0.5),
        this.uOrthoEquivDepth,
        centerLinZ
      ).toVar();
      const aoResult = float(1.0).toVar();

      If(this.uAoIntensity.greaterThan(0.001).and(scaleZ.lessThan(20.0)), () => {
        const radiusPx = clamp(float(21.0).div(max(1.2, scaleZ)), 2.5, 14.5);
        const aspectStep = this.uTexelSize.mul(radiusPx).toVar();
        const baseAngle = noise.mul(6.2831853);
        const c0 = cos(baseAngle).toVar();
        const s0 = sin(baseAngle).toVar();

        const rotDirs: readonly [ShaderNodeObject<Node>, number][] = [
          [vec2(c0, s0), 0.42],
          [vec2(s0.negate(), c0), 0.65],
          [vec2(c0.sub(s0), c0.add(s0)).mul(0.70710678), 0.85],
          [vec2(c0.negate().sub(s0), c0.sub(s0)).mul(0.70710678), 1.0],
        ];

        const occlusion = float(0.0).toVar();
        for (const [unitDir, ringScale] of rotDirs) {
          const dir = unitDir.mul(aspectStep).mul(ringScale);
          const zPlus = readLinearDepth(vUv.add(dir));
          const zMinus = readLinearDepth(vUv.sub(dir));

          const pairAvgZ = zPlus.add(zMinus).mul(0.5);
          const delta = centerLinZ.sub(pairAvgZ);
          const maxSpan = max(abs(zPlus.sub(centerLinZ)), abs(zMinus.sub(centerLinZ)));

          const rangeCheck = smoothstep(0.55, 0.08, maxSpan);
          const crease = smoothstep(0.004, 0.14, delta).mul(rangeCheck);
          occlusion.addAssign(crease);
        }

        const distanceFade = float(1.0).sub(smoothstep(13.0, 20.0, scaleZ));
        const ao = float(1.0).sub(
          occlusion.mul(0.18).mul(this.uAoIntensity).mul(distanceFade)
        );
        aoResult.assign(clamp(ao, 0.68, 1.0));
      });

      return aoResult;
    };

    const compositeShader = Fn(() => {
      const vUv = uv();
      // Sample base color and depth in outer scope so WGSL textureDimensions vars are top-level
      const rawDepth = depthNode.sample(vUv).r.toVar();
      const centerColor = sampleHdr(vUv).toVar();
      const bloomColor = this.bloom.buildNode(colorNode, vUv).toVar();
      const ldrOut = vec3(0.0).toVar();

      If(rawDepth.greaterThanEqual(0.9999), () => {
        ldrOut.assign(toneMap(centerColor.add(bloomColor)));
      });

      If(rawDepth.lessThan(0.9999), () => {
        const magicXY = vec2(0.06711056, 0.00583715);
        const noise = fract(float(52.9829189).mul(fract(dot(screenCoordinate.xy, magicXY)))).toVar();
        const centerLinZ = linearizeDepth(rawDepth).toVar();

        // 1. Compute per-pixel 3D camera velocity vector in screen UV space (only when camera moved).
        // Note: WebGPU PostProcessing QuadMesh UVs have vUv.y = 0 at top (ndc.y = +1) and 1 at bottom (ndc.y = -1).
        const velocity = vec2(0.0).toVar();
        If(this.uMotionBlurEnabled.greaterThan(0.5), () => {
          const ndcZ = rawDepth.mul(2.0).sub(1.0);
          const ndcXY = vec2(vUv.x, float(1.0).sub(vUv.y)).mul(2.0).sub(1.0);
          const clipPos = vec4(ndcXY, ndcZ, 1.0);
          const worldPos = this.uCurrInvViewProj.mul(clipPos).toVar();
          worldPos.divAssign(max(1e-6, worldPos.w));

          const prevClipPos = this.uPrevViewProj.mul(worldPos).toVar();
          If(prevClipPos.w.greaterThan(1e-4), () => {
            const prevNdc = prevClipPos.xy.div(prevClipPos.w);
            const prevUv = vec2(
              prevNdc.x.mul(0.5).add(0.5),
              float(0.5).sub(prevNdc.y.mul(0.5))
            );
            const rawVel = vUv.sub(prevUv).mul(this.uShutterScale).toVar();
            const velMag = length(rawVel);
            const maxRadius = float(0.014);
            velocity.assign(
              select(
                velMag.greaterThan(maxRadius),
                rawVel.mul(maxRadius.div(max(1e-6, velMag))),
                rawVel
              )
            );
          });
        });

        const speedPx = length(velocity.mul(this.uResolution)).toVar();
        const hdrColor = vec3(centerColor).toVar();
        const applyBlur = this.uMotionBlurEnabled.greaterThan(0.5).and(speedPx.greaterThan(1.8));

        // 2. Apply subtle 6-tap depth-aware directional shutter motion blur when panning/flying,
        //    with a smooth onset ramp (1.8px -> 6.5px) so gentle orbits remain crisp.
        If(applyBlur, () => {
          const accumColor = centerColor.mul(1.65).toVar();
          const totalWeight = float(1.65).toVar();

          const sampleCount = 6;
          for (let i = 0; i < sampleCount; i++) {
            const fi = float(i).add(noise).div(float(sampleCount)).sub(0.5);
            const sampleUv = clamp(vUv.add(velocity.mul(fi)), 0.001, 0.999);
            const sampleCol = sampleHdr(sampleUv);
            const sampleLinZ = readLinearDepth(sampleUv);

            const depthDiff = abs(sampleLinZ.sub(centerLinZ));
            const depthWeight = smoothstep(1.2, 0.08, depthDiff).mul(0.75).add(0.25);
            const windowWeight = float(1.0).sub(abs(fi).mul(0.75));
            const w = depthWeight.mul(windowWeight);

            accumColor.addAssign(sampleCol.mul(w));
            totalWeight.addAssign(w);
          }
          const blurBlend = smoothstep(1.8, 6.5, speedPx);
          hdrColor.assign(mix(centerColor, accumColor.div(totalWeight), blurBlend));
        });

        If(
          applyBlur
            .not()
            .and(this.uFxaaEnabled.greaterThan(0.5).or(this.uSharpenIntensity.greaterThan(0.001))),
          () => {
            hdrColor.assign(computeFxaaAndCas(vUv, centerColor));
          }
        );

        // 3. Apply Screen-Space Contact Ambient Occlusion (fades out during rapid whip-pans)
        const motionFade = float(1.0).sub(clamp(speedPx.sub(4.0).div(18.0), 0.0, 0.65));
        const ao = mix(float(1.0), computeContactAO(vUv, centerLinZ, noise), motionFade);
        hdrColor.mulAssign(ao);

        // 4. Add selective HDR bloom around glowing bulbs, LED diffusers and halos
        hdrColor.addAssign(bloomColor);

        // 5. Tone mapping (AgX or ACES, see POST_TONE_MAPPER)
        ldrOut.assign(toneMap(hdrColor));
      });

      return sRGBTransferOETF(vec4(ldrOut, 1.0));
    });

    return compositeShader();
  }

  /**
   * Renders the 3D scene through the WebGPU TSL HDR velocity-motion-blur + contact-AO + bloom pipeline,
   * or directly to the canvas when the active tier or feature flags disable post-processing.
   */
  public render(scene: THREE.Scene, camera: RigCamera | THREE.Camera, dtSeconds: number): void {
    // Always render through `this.postProcessing` on WebGPURenderer across all graphics tiers
    // (including Low tier where post effects are 0) so the scene pass keeps a constant
    // RenderTarget, sampleCount, and toneMapping — preventing WebGPURenderer from rebuilding
    // 4,300+ RenderObjects and recompiling 1,400+ WGSL shaders when switching graphics modes.
    if (!isWebGpuCapableRenderer(this.renderer)) {
      this.renderer.setRenderTarget(null);
      this.renderer.render(scene, camera);
      this.hasPrevMatrix = false;
      return;
    }

    camera.updateMatrixWorld();
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    this.currViewProj.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.currInvViewProj.copy(this.currViewProj).invert();

    if (!this.hasPrevMatrix) {
      this.prevViewProj.copy(this.currViewProj);
      this.hasPrevMatrix = true;
    }

    let maxMatrixDelta = 0;
    const ce = this.currViewProj.elements;
    const pe = this.prevViewProj.elements;
    for (let i = 0; i < 16; i++) {
      const d = Math.abs(ce[i]! - pe[i]!);
      if (d > maxMatrixDelta) maxMatrixDelta = d;
    }
    const cameraMoved = maxMatrixDelta > 1e-5;

    const isOrtho = (camera as THREE.OrthographicCamera).isOrthographicCamera === true;
    const near = (camera as THREE.PerspectiveCamera | THREE.OrthographicCamera).near ?? 0.1;
    const far = (camera as THREE.PerspectiveCamera | THREE.OrthographicCamera).far ?? 120.0;
    const projElements = camera.projectionMatrix.elements;
    const projY = projElements[5]!;
    if (!isOrtho && projY > 1e-6) {
      this.lastPerspectiveProjY = projY;
    }

    this.uNear.value = near;
    this.uFar.value = far;
    this.uIsOrtho.value = isOrtho ? 1.0 : 0.0;
    this.uIsLogDepth.value = !isOrtho && this.renderer.logarithmicDepthBuffer === true ? 1.0 : 0.0;
    // Distance at which the perspective camera would show the same world-units-per-pixel as the
    // ortho camera: perspective scale = P11 / z, ortho scale = P11_ortho.
    this.uOrthoEquivDepth.value = isOrtho
      ? this.lastPerspectiveProjY / Math.max(1e-6, projY)
      : 0.0;
    // Exposure comes only from the renderer (never from the camera type, zoom or position).
    this.uExposure.value = this.renderer.toneMappingExposure;

    if (cameraMoved) {
      this.uCurrInvViewProj.value.copy(this.currInvViewProj);
      this.uPrevViewProj.value.copy(this.prevViewProj);
    }

    // Normalize shutter exposure scale across variable refresh rates (60Hz–144Hz)
    const fpsNorm = THREE.MathUtils.clamp(1.0 / (Math.max(0.004, dtSeconds) * 60.0), 0.45, 1.65);
    const postActive = this.postEnabled;
    this.uMotionBlurEnabled.value =
      postActive && this.motionBlurEnabled && !isOrtho && cameraMoved ? 1.0 : 0.0;
    this.uShutterScale.value = this.motionBlurStrength * fpsNorm;
    // AO is identical for ortho and perspective (shader scales by apparent on-screen size).
    this.uAoIntensity.value = postActive && this.ambientOcclusionEnabled ? AO_INTENSITY : 0.0;
    this.bloom.setIntensity(postActive && this.bloomEnabled ? BLOOM_INTENSITY : 0.0);
    this.uSharpenIntensity.value = postActive && this.sharpenEnabled ? SHARPEN_INTENSITY : 0.0;
    this.uFxaaEnabled.value = postActive && this.fxaaEnabled ? 1.0 : 0.0;

    // Render scene pass + single-pass WebGPU TSL composite to screen
    const postProcessing = this.ensurePostProcessing(this.renderer, scene, camera);
    postProcessing.render();

    // Store current ViewProj matrix for next frame's velocity vectors
    this.prevViewProj.copy(this.currViewProj);
  }

  public dispose(): void {
    this.bloom.dispose();
    if (this.scenePass) {
      this.scenePass.dispose();
      this.scenePass = null;
    }
    if (this.postProcessing) {
      this.postProcessing.dispose();
      this.postProcessing = null;
    }
  }
}
