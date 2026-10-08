import * as THREE from 'three';
import type { RigCamera } from '../camera/camera-rig.ts';
import type { GraphicsTier, GraphicsTierSettings } from '../../core/types/twin-ux.ts';
import { getTierSettings, isGraphicsTier } from '../perf/tier-settings.ts';
import { BloomPass } from './bloom-pass.ts';

/** Legacy 3-step preset kept for the existing HUD; each preset maps onto a {@link GraphicsTier}. */
export type GraphicsQualityPreset = 'ultra' | 'balanced' | 'performance';

export interface GraphicsSettingsState {
  readonly quality: GraphicsQualityPreset;
  readonly tier: GraphicsTier;
  readonly motionBlurEnabled: boolean;
  readonly motionBlurStrength: number;
  readonly postProcessingEnabled: boolean;
  readonly ambientOcclusionEnabled: boolean;
  readonly bloomEnabled: boolean;
  readonly sharpenEnabled: boolean;
  readonly pixelRatio: number;
}

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

const POST_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const POST_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;
  ${POST_TONE_MAPPER === 'agx' ? '#define POST_TONE_MAPPER_AGX 1' : ''}

  uniform sampler2D tColor;
  uniform sampler2D tDepth;
  uniform sampler2D tBloom;

  uniform vec2 uResolution;
  uniform vec2 uTexelSize;
  uniform float uNear;
  uniform float uFar;
  uniform float uIsOrtho;
  // Perspective-equivalent view distance for the orthographic camera (same world-units-per-pixel).
  uniform float uOrthoEquivDepth;
  uniform float uExposure;

  uniform mat4 uCurrInvViewProj;
  uniform mat4 uPrevViewProj;
  uniform float uMotionBlurEnabled;
  uniform float uShutterScale;
  uniform float uAoIntensity;
  uniform float uBloomIntensity;
  uniform float uSharpenIntensity;

  varying vec2 vUv;

  float interleavedGradientNoise(vec2 screenPos) {
    vec3 magic = vec3(0.06711056, 0.00583715, 52.9829189);
    return fract(magic.z * fract(dot(screenPos, magic.xy)));
  }

  float linearizeDepth(float d) {
    if (uIsOrtho > 0.5) {
      return mix(uNear, uFar, d);
    }
    float zNdc = d * 2.0 - 1.0;
    return (2.0 * uNear * uFar) / max(1e-5, uFar + uNear - zNdc * (uFar - uNear));
  }

  float readLinearDepth(vec2 uv) {
    return linearizeDepth(texture2D(tDepth, clamp(uv, 0.0, 1.0)).r);
  }

  vec3 acesFilmicToneMapping(vec3 color, float exposure) {
    const mat3 ACESInputMat = mat3(
      vec3(0.59719, 0.07600, 0.02840),
      vec3(0.35458, 0.90834, 0.13383),
      vec3(0.04823, 0.01566, 0.83777)
    );
    const mat3 ACESOutputMat = mat3(
      vec3( 1.60475, -0.10208, -0.00327),
      vec3(-0.53108,  1.10813, -0.07276),
      vec3(-0.07367, -0.00605,  1.07602)
    );
    color *= exposure / 0.6;
    color = ACESInputMat * color;
    vec3 a = color * (color + 0.0245786) - 0.000090537;
    vec3 b = color * (0.983729 * color + 0.4329510) + 0.238081;
    color = a / b;
    color = ACESOutputMat * color;
    return clamp(color, 0.0, 1.0);
  }

  // AgX (Blender / Filament fit), ported verbatim from three's tonemapping_pars_fragment.
  vec3 agxDefaultContrastApprox(vec3 x) {
    vec3 x2 = x * x;
    vec3 x4 = x2 * x2;
    return 15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4 - 6.868 * x2 * x + 0.4298 * x2
      + 0.1191 * x - 0.00232;
  }

  vec3 agxToneMapping(vec3 color, float exposure) {
    const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
      vec3(1.6605, -0.1246, -0.0182),
      vec3(-0.5876, 1.1329, -0.1006),
      vec3(-0.0728, -0.0083, 1.1187)
    );
    const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
      vec3(0.6274, 0.0691, 0.0164),
      vec3(0.3293, 0.9195, 0.0880),
      vec3(0.0433, 0.0113, 0.8956)
    );
    const mat3 AgXInsetMatrix = mat3(
      vec3(0.856627153315983, 0.137318972929847, 0.11189821299995),
      vec3(0.0951212405381588, 0.761241990602591, 0.0767994186031903),
      vec3(0.0482516061458583, 0.101439036467562, 0.811302368396859)
    );
    const mat3 AgXOutsetMatrix = mat3(
      vec3(1.1271005818144368, -0.1413297634984383, -0.14132976349843826),
      vec3(-0.11060664309660323, 1.157823702216272, -0.11060664309660294),
      vec3(-0.016493938717834573, -0.016493938717834257, 1.2519364065950405)
    );
    const float AgxMinEv = -12.47393;
    const float AgxMaxEv = 4.026069;
    color *= exposure;
    color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
    color = AgXInsetMatrix * color;
    color = max(color, 1e-10);
    color = log2(color);
    color = (color - AgxMinEv) / (AgxMaxEv - AgxMinEv);
    color = clamp(color, 0.0, 1.0);
    color = agxDefaultContrastApprox(color);
    color = AgXOutsetMatrix * color;
    color = pow(max(vec3(0.0), color), vec3(2.2));
    color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
    return clamp(color, 0.0, 1.0);
  }

  vec3 toneMap(vec3 color, float exposure) {
  #ifdef POST_TONE_MAPPER_AGX
    return agxToneMapping(color, exposure);
  #else
    return acesFilmicToneMapping(color, exposure);
  #endif
  }

  vec3 linearToSrgb(vec3 value) {
    return mix(
      pow(max(value, vec3(0.0)), vec3(0.41666)) * 1.055 - vec3(0.055),
      value * 12.92,
      vec3(lessThanEqual(value, vec3(0.0031308)))
    );
  }

  // Symmetric-pair depth curvature AO: 3 rotated symmetric pairs (6 depth taps total).
  // Radius and distance fade are driven by the on-screen scale (world units per pixel), so an
  // orthographic view produces the same AO as a perspective view at the same apparent zoom.
  // Depth deltas are linear metres for both projections (see linearizeDepth).
  float computeContactAO(vec2 uv, float centerLinZ, float noise) {
    float scaleZ = uIsOrtho > 0.5 ? uOrthoEquivDepth : centerLinZ;
    if (uAoIntensity <= 0.001 || scaleZ >= 20.0) {
      return 1.0;
    }

    float radiusPx = clamp(20.0 / max(1.2, scaleZ), 2.5, 14.0);
    vec2 aspectStep = uTexelSize * radiusPx;
    float baseAngle = noise * 6.2831853;
    float c0 = cos(baseAngle);
    float s0 = sin(baseAngle);
    vec2 rot0 = vec2(c0, s0);
    vec2 rot1 = vec2(-s0, c0);
    vec2 rot2 = vec2(c0 - s0, c0 + s0) * 0.70710678;

    float occlusion = 0.0;
    for (int i = 0; i < 3; i++) {
      vec2 unitDir = (i == 0) ? rot0 : ((i == 1) ? rot1 : rot2);
      float ringScale = (i == 0) ? 0.55 : ((i == 1) ? 0.80 : 1.0);
      vec2 dir = unitDir * aspectStep * ringScale;

      float zPlus = readLinearDepth(uv + dir);
      float zMinus = readLinearDepth(uv - dir);

      float pairAvgZ = 0.5 * (zPlus + zMinus);
      float delta = centerLinZ - pairAvgZ;
      float maxSpan = max(abs(zPlus - centerLinZ), abs(zMinus - centerLinZ));

      float rangeCheck = smoothstep(0.55, 0.08, maxSpan);
      float crease = smoothstep(0.004, 0.14, delta) * rangeCheck;
      occlusion += crease;
    }

    float distanceFade = 1.0 - smoothstep(13.0, 20.0, scaleZ);
    float ao = 1.0 - (occlusion * 0.333) * uAoIntensity * distanceFade;
    return clamp(ao, 0.52, 1.0);
  }

  // Selective HDR bloom (threshold + mip chain computed by BloomPass at half resolution).
  vec3 computeBloom(vec2 uv) {
    if (uBloomIntensity <= 0.001) {
      return vec3(0.0);
    }
    return texture2D(tBloom, uv).rgb * uBloomIntensity;
  }

  void main() {
    float rawDepth = texture2D(tDepth, vUv).r;
    vec3 centerColor = texture2D(tColor, vUv).rgb;
    if (rawDepth >= 0.9999) {
      vec3 skyLdr = toneMap(centerColor + computeBloom(vUv), uExposure);
      gl_FragColor = vec4(linearToSrgb(skyLdr), 1.0);
      return;
    }

    float noise = interleavedGradientNoise(gl_FragCoord.xy);
    float centerLinZ = linearizeDepth(rawDepth);

    // 1. Compute per-pixel 3D camera velocity vector in screen UV space (only when camera moved)
    vec2 velocity = vec2(0.0);
    if (uMotionBlurEnabled > 0.5) {
      vec4 clipPos = vec4(vUv * 2.0 - 1.0, rawDepth * 2.0 - 1.0, 1.0);
      vec4 worldPos = uCurrInvViewProj * clipPos;
      worldPos /= max(1e-6, worldPos.w);

      vec4 prevClipPos = uPrevViewProj * worldPos;
      if (prevClipPos.w > 1e-4) {
        vec2 prevUv = (prevClipPos.xy / prevClipPos.w) * 0.5 + 0.5;
        velocity = (vUv - prevUv) * uShutterScale;

        float velMag = length(velocity);
        float maxRadius = 0.028;
        if (velMag > maxRadius) {
          velocity *= maxRadius / velMag;
        }
      }
    }

    float speedPx = length(velocity * uResolution);
    vec3 hdrColor = centerColor;

    // 2. Apply 6-tap depth-aware directional shutter motion blur when moving/turning rapidly,
    //    or Contrast-Adaptive Sharpening (CAS) when stationary/slow-moving.
    if (uMotionBlurEnabled > 0.5 && speedPx > 1.25) {
      vec3 accumColor = centerColor * 1.25;
      float totalWeight = 1.25;

      const int SAMPLES = 6;
      for (int i = 0; i < SAMPLES; i++) {
        float fi = (float(i) + noise) / float(SAMPLES) - 0.5;
        vec2 sampleUv = clamp(vUv + velocity * fi, 0.001, 0.999);
        vec3 sampleCol = texture2D(tColor, sampleUv).rgb;
        float sampleLinZ = readLinearDepth(sampleUv);

        float depthDiff = abs(sampleLinZ - centerLinZ);
        float depthWeight = smoothstep(1.2, 0.08, depthDiff) * 0.75 + 0.25;
        float windowWeight = 1.0 - abs(fi) * 0.65;
        float w = depthWeight * windowWeight;

        accumColor += sampleCol * w;
        totalWeight += w;
      }
      hdrColor = accumColor / totalWeight;
    } else if (uSharpenIntensity > 0.001) {
      vec3 n = texture2D(tColor, vUv + vec2(0.0, uTexelSize.y)).rgb;
      vec3 s = texture2D(tColor, vUv - vec2(0.0, uTexelSize.y)).rgb;
      vec3 e = texture2D(tColor, vUv + vec2(uTexelSize.x, 0.0)).rgb;
      vec3 w = texture2D(tColor, vUv - vec2(uTexelSize.x, 0.0)).rgb;
      vec3 neighborAvg = 0.25 * (n + s + e + w);

      vec3 minCol = min(centerColor, min(min(n, s), min(e, w)));
      vec3 maxCol = max(centerColor, max(max(n, s), max(e, w)));
      float localContrast = length(maxCol - minCol);

      float detailWeight = (1.0 - smoothstep(0.35, 1.1, localContrast)) * uSharpenIntensity;
      float aaBlend = smoothstep(0.55, 1.35, localContrast) * 0.24;
      vec3 sharpened = max(vec3(0.0), centerColor + (centerColor - neighborAvg) * detailWeight);
      hdrColor = mix(sharpened, mix(centerColor, neighborAvg, 0.45), aaBlend);
    }

    // 3. Apply Screen-Space Contact Ambient Occlusion (fades out during rapid whip-pans)
    float motionFade = 1.0 - clamp((speedPx - 4.0) / 18.0, 0.0, 0.65);
    float ao = mix(1.0, computeContactAO(vUv, centerLinZ, noise), motionFade);
    hdrColor *= ao;

    // 4. Add selective HDR bloom around glowing bulbs, LED diffusers and halos
    hdrColor += computeBloom(vUv);

    // 5. Tone mapping (AgX or ACES, see POST_TONE_MAPPER) + sRGB output encoding
    vec3 ldrColor = toneMap(hdrColor, uExposure);
    gl_FragColor = vec4(linearToSrgb(ldrColor), 1.0);
  }
`;

const STORAGE_KEY = 'crox_graphics_settings_v2';
const AO_INTENSITY = 0.42;
const BLOOM_INTENSITY = 0.12;
const SHARPEN_INTENSITY = 0.26;

function currentDevicePixelRatio(): number {
  return typeof window !== 'undefined' && window.devicePixelRatio > 0 ? window.devicePixelRatio : 1;
}

export class PostProcessingPipeline {
  private readonly renderer: THREE.WebGLRenderer;
  private renderTarget: THREE.WebGLRenderTarget;
  private readonly postScene: THREE.Scene;
  private readonly postCamera: THREE.OrthographicCamera;
  private readonly postMaterial: THREE.ShaderMaterial;
  private readonly quad: THREE.Mesh;
  private readonly bloom = new BloomPass();

  private readonly currViewProj = new THREE.Matrix4();
  private readonly currInvViewProj = new THREE.Matrix4();
  private readonly prevViewProj = new THREE.Matrix4();
  private hasPrevMatrix = false;

  private tier: GraphicsTier = 'high';
  /** Motion blur is opt-in (plan 2.2) and only takes effect while the post pipeline is enabled. */
  private motionBlurEnabled = false;
  private motionBlurStrength = 0.68;
  private postEnabled = true;
  private ambientOcclusionEnabled = true;
  private bloomEnabled = false;
  private sharpenEnabled = true;
  private targetPixelRatio = 1.0;
  private cssWidth = 1;
  private cssHeight = 1;
  private currentPixelRatio = 1.0;
  private lastPerspectiveProjY = DEFAULT_PERSPECTIVE_PROJ_Y;

  public constructor(renderer: THREE.WebGLRenderer, initialWidth: number, initialHeight: number) {
    this.renderer = renderer;
    this.cssWidth = Math.max(1, initialWidth);
    this.cssHeight = Math.max(1, initialHeight);

    this.assignTierSettings(getTierSettings(this.tier, currentDevicePixelRatio()));
    this.restoreSettings();
    this.currentPixelRatio = this.targetPixelRatio;

    const rtWidth = Math.max(1, Math.round(this.cssWidth * this.currentPixelRatio));
    const rtHeight = Math.max(1, Math.round(this.cssHeight * this.currentPixelRatio));

    const depthTexture = new THREE.DepthTexture(rtWidth, rtHeight);
    depthTexture.format = THREE.DepthFormat;
    depthTexture.type = THREE.UnsignedIntType;
    depthTexture.minFilter = THREE.NearestFilter;
    depthTexture.magFilter = THREE.NearestFilter;

    this.renderTarget = new THREE.WebGLRenderTarget(rtWidth, rtHeight, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      generateMipmaps: false,
      depthBuffer: true,
      stencilBuffer: false,
    });
    this.renderTarget.depthTexture = depthTexture;

    this.postScene = new THREE.Scene();
    this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.postMaterial = new THREE.ShaderMaterial({
      vertexShader: POST_VERTEX_SHADER,
      fragmentShader: POST_FRAGMENT_SHADER,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
      uniforms: {
        tColor: { value: this.renderTarget.texture },
        tDepth: { value: depthTexture },
        tBloom: { value: null },
        uResolution: { value: new THREE.Vector2(rtWidth, rtHeight) },
        uTexelSize: { value: new THREE.Vector2(1 / rtWidth, 1 / rtHeight) },
        uNear: { value: 0.1 },
        uFar: { value: 120.0 },
        uIsOrtho: { value: 0.0 },
        uOrthoEquivDepth: { value: 10.0 },
        uExposure: { value: renderer.toneMappingExposure },
        uCurrInvViewProj: { value: new THREE.Matrix4() },
        uPrevViewProj: { value: new THREE.Matrix4() },
        uMotionBlurEnabled: { value: 0.0 },
        uShutterScale: { value: 0.55 },
        uAoIntensity: { value: AO_INTENSITY },
        uBloomIntensity: { value: BLOOM_INTENSITY },
        uSharpenIntensity: { value: SHARPEN_INTENSITY },
      },
    });

    const quadGeo = new THREE.PlaneGeometry(2, 2);
    this.quad = new THREE.Mesh(quadGeo, this.postMaterial);
    this.quad.frustumCulled = false;
    this.postScene.add(this.quad);

    this.syncRendererPixelRatio();
  }

  private assignTierSettings(settings: GraphicsTierSettings): void {
    this.tier = settings.tier;
    this.targetPixelRatio = Math.max(0.5, settings.pixelRatio);
    this.postEnabled = settings.postProcessing;
    this.ambientOcclusionEnabled = settings.postProcessing && settings.ambientOcclusion;
    this.bloomEnabled = settings.postProcessing && settings.bloom;
    this.sharpenEnabled = settings.postProcessing && settings.sharpen;
  }

  private syncRendererPixelRatio(): void {
    this.currentPixelRatio = this.targetPixelRatio;
    this.renderer.setPixelRatio(this.currentPixelRatio);
    this.renderer.setSize(this.cssWidth, this.cssHeight, false);

    const rtWidth = Math.max(1, Math.round(this.cssWidth * this.currentPixelRatio));
    const rtHeight = Math.max(1, Math.round(this.cssHeight * this.currentPixelRatio));
    this.renderTarget.setSize(rtWidth, rtHeight);
    (this.postMaterial.uniforms.uResolution.value as THREE.Vector2).set(rtWidth, rtHeight);
    (this.postMaterial.uniforms.uTexelSize.value as THREE.Vector2).set(1 / rtWidth, 1 / rtHeight);
  }

  public resize(cssWidth: number, cssHeight: number): void {
    this.cssWidth = Math.max(1, cssWidth);
    this.cssHeight = Math.max(1, cssHeight);
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
      bloomEnabled: this.bloomEnabled,
      sharpenEnabled: this.sharpenEnabled,
      pixelRatio: this.currentPixelRatio,
    };
  }

  /**
   * Applies a graphics tier (pixel ratio, AO, bloom, sharpen, post on/off). With post disabled the
   * scene renders straight to the canvas using the renderer's built-in ACES tone mapping, which uses
   * the same exposure curve as the post shader so lighting looks identical either way.
   */
  public applyTierSettings(settings: GraphicsTierSettings): void {
    const prevRatio = this.targetPixelRatio;
    this.assignTierSettings(settings);
    if (Math.abs(prevRatio - this.targetPixelRatio) > 1e-4 || this.currentPixelRatio !== this.targetPixelRatio) {
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
    this.saveSettings();
  }

  public toggleMotionBlur(): boolean {
    this.motionBlurEnabled = !this.motionBlurEnabled;
    this.saveSettings();
    return this.motionBlurEnabled;
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

  /**
   * Renders the 3D scene through the HDR velocity-motion-blur + contact-AO + bloom pipeline,
   * or directly to the canvas when the active tier disables post-processing.
   */
  public render(scene: THREE.Scene, camera: RigCamera, dtSeconds: number): void {
    if (!this.postEnabled) {
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
    const cameraMoved = maxMatrixDelta > 1e-4;

    // 1. Render scene into linear HalfFloat HDR target + hardware DepthTexture
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(scene, camera);
    if (this.bloomEnabled) {
      this.bloom.render(this.renderer, this.renderTarget.texture, this.renderTarget.width, this.renderTarget.height);
    }
    this.renderer.setRenderTarget(null);

    // 2. Update post-processing uniforms
    const isOrtho = (camera as THREE.OrthographicCamera).isOrthographicCamera === true;
    const projY = camera.projectionMatrix.elements[5]!;
    if (!isOrtho && projY > 1e-6) {
      this.lastPerspectiveProjY = projY;
    }
    const uniforms = this.postMaterial.uniforms;
    uniforms.uNear.value = camera.near;
    uniforms.uFar.value = camera.far;
    uniforms.uIsOrtho.value = isOrtho ? 1.0 : 0.0;
    // Distance at which the perspective camera would show the same world-units-per-pixel as the
    // ortho camera: perspective scale = P11 / z, ortho scale = P11_ortho.
    uniforms.uOrthoEquivDepth.value = isOrtho
      ? this.lastPerspectiveProjY / Math.max(1e-6, projY)
      : 0.0;
    // Exposure comes only from the renderer (never from the camera type, zoom or position).
    uniforms.uExposure.value = this.renderer.toneMappingExposure;

    if (cameraMoved) {
      (uniforms.uCurrInvViewProj.value as THREE.Matrix4).copy(this.currInvViewProj);
      (uniforms.uPrevViewProj.value as THREE.Matrix4).copy(this.prevViewProj);
    }

    // Normalize shutter exposure scale across variable refresh rates (60Hz–144Hz)
    const fpsNorm = THREE.MathUtils.clamp(1.0 / (Math.max(0.004, dtSeconds) * 60.0), 0.45, 1.65);
    uniforms.uMotionBlurEnabled.value =
      this.motionBlurEnabled && !isOrtho && cameraMoved ? 1.0 : 0.0;
    uniforms.uShutterScale.value = this.motionBlurStrength * fpsNorm;
    // AO is identical for ortho and perspective (shader scales by apparent on-screen size).
    uniforms.uAoIntensity.value = this.ambientOcclusionEnabled ? AO_INTENSITY : 0.0;
    uniforms.uBloomIntensity.value = this.bloomEnabled && this.bloom.texture ? BLOOM_INTENSITY : 0.0;
    uniforms.tBloom.value = this.bloom.texture;
    uniforms.uSharpenIntensity.value = this.sharpenEnabled ? SHARPEN_INTENSITY : 0.0;

    // 3. Draw single-pass composite quad to screen
    this.renderer.render(this.postScene, this.postCamera);

    // 4. Store current ViewProj matrix for next frame's velocity vectors
    this.prevViewProj.copy(this.currViewProj);
  }
}
