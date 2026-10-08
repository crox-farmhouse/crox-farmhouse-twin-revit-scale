import * as THREE from 'three';
import type { RigCamera } from './camera-rig.ts';

export type GraphicsQualityPreset = 'ultra' | 'balanced' | 'performance';

export interface GraphicsSettingsState {
  readonly quality: GraphicsQualityPreset;
  readonly motionBlurEnabled: boolean;
  readonly motionBlurStrength: number;
  readonly ambientOcclusionEnabled: boolean;
  readonly bloomEnabled: boolean;
  readonly pixelRatio: number;
}

const POST_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const POST_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform sampler2D tColor;
  uniform sampler2D tDepth;

  uniform vec2 uResolution;
  uniform vec2 uTexelSize;
  uniform float uNear;
  uniform float uFar;
  uniform float uIsOrtho;
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

  vec3 linearToSrgb(vec3 value) {
    return mix(
      pow(max(value, vec3(0.0)), vec3(0.41666)) * 1.055 - vec3(0.055),
      value * 12.92,
      vec3(lessThanEqual(value, vec3(0.0031308)))
    );
  }

  // Symmetric-pair depth curvature AO: 3 rotated symmetric pairs (6 depth taps total)
  float computeContactAO(vec2 uv, float centerLinZ, float noise) {
    if (uAoIntensity <= 0.001 || centerLinZ >= 20.0) {
      return 1.0;
    }

    float radiusPx = clamp(20.0 / max(1.2, centerLinZ), 2.5, 14.0);
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

    float distanceFade = 1.0 - smoothstep(13.0, 20.0, centerLinZ);
    float ao = 1.0 - (occlusion * 0.333) * uAoIntensity * distanceFade;
    return clamp(ao, 0.52, 1.0);
  }

  vec3 extractBrightHighlightColor(vec3 c) {
    float peak = max(c.r, max(c.g, c.b));
    float knee = smoothstep(0.92, 1.85, peak);
    return c * knee;
  }

  vec3 extractBrightHighlight(vec2 uv) {
    return extractBrightHighlightColor(texture2D(tColor, clamp(uv, 0.0, 1.0)).rgb);
  }

  vec3 computeWarmBloom(vec2 uv, vec3 centerColor) {
    if (uBloomIntensity <= 0.001) {
      return vec3(0.0);
    }
    vec2 r1 = uTexelSize * 4.5;

    vec3 sum = extractBrightHighlightColor(centerColor) * 0.24;
    sum += extractBrightHighlight(uv + vec2( r1.x,  r1.y)) * 0.19;
    sum += extractBrightHighlight(uv + vec2(-r1.x,  r1.y)) * 0.19;
    sum += extractBrightHighlight(uv + vec2( r1.x, -r1.y)) * 0.19;
    sum += extractBrightHighlight(uv + vec2(-r1.x, -r1.y)) * 0.19;
    return sum * uBloomIntensity;
  }

  void main() {
    float rawDepth = texture2D(tDepth, vUv).r;
    vec3 centerColor = texture2D(tColor, vUv).rgb;
    if (rawDepth >= 0.9999) {
      vec3 skyLdr = acesFilmicToneMapping(centerColor + computeWarmBloom(vUv, centerColor), uExposure);
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

    // 4. Add warm HDR optical bloom around glowing bulbs, sconces, and sunlit windows
    hdrColor += computeWarmBloom(vUv, centerColor);

    // 5. ACES Filmic Tone Mapping + sRGB output encoding
    vec3 ldrColor = acesFilmicToneMapping(hdrColor, uExposure);
    gl_FragColor = vec4(linearToSrgb(ldrColor), 1.0);
  }
`;

const STORAGE_KEY = 'crox_graphics_settings_v1';

export class PostProcessingPipeline {
  private readonly renderer: THREE.WebGLRenderer;
  private renderTarget: THREE.WebGLRenderTarget;
  private readonly postScene: THREE.Scene;
  private readonly postCamera: THREE.OrthographicCamera;
  private readonly postMaterial: THREE.ShaderMaterial;
  private readonly quad: THREE.Mesh;

  private readonly currViewProj = new THREE.Matrix4();
  private readonly currInvViewProj = new THREE.Matrix4();
  private readonly prevViewProj = new THREE.Matrix4();
  private hasPrevMatrix = false;

  private quality: GraphicsQualityPreset = 'ultra';
  private motionBlurEnabled = true;
  private motionBlurStrength = 0.68;
  private ambientOcclusionEnabled = true;
  private bloomEnabled = true;
  private cssWidth = 1;
  private cssHeight = 1;
  private currentPixelRatio = 1.5;

  public constructor(renderer: THREE.WebGLRenderer, initialWidth: number, initialHeight: number) {
    this.renderer = renderer;
    this.cssWidth = Math.max(1, initialWidth);
    this.cssHeight = Math.max(1, initialHeight);

    this.restoreSettings();
    this.currentPixelRatio = this.computeTargetPixelRatio();

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
        uResolution: { value: new THREE.Vector2(rtWidth, rtHeight) },
        uTexelSize: { value: new THREE.Vector2(1 / rtWidth, 1 / rtHeight) },
        uNear: { value: 0.1 },
        uFar: { value: 120.0 },
        uIsOrtho: { value: 0.0 },
        uExposure: { value: renderer.toneMappingExposure },
        uCurrInvViewProj: { value: new THREE.Matrix4() },
        uPrevViewProj: { value: new THREE.Matrix4() },
        uMotionBlurEnabled: { value: 1.0 },
        uShutterScale: { value: 0.55 },
        uAoIntensity: { value: 0.42 },
        uBloomIntensity: { value: 0.18 },
        uSharpenIntensity: { value: 0.28 },
      },
    });

    const quadGeo = new THREE.PlaneGeometry(2, 2);
    this.quad = new THREE.Mesh(quadGeo, this.postMaterial);
    this.quad.frustumCulled = false;
    this.postScene.add(this.quad);

    this.syncRendererPixelRatio();
  }

  private computeTargetPixelRatio(): number {
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    if (this.quality === 'ultra') {
      return Math.min(Math.max(dpr, 1.25), 1.75);
    }
    if (this.quality === 'balanced') {
      return Math.min(Math.max(dpr, 1.0), 1.25);
    }
    return 1.0;
  }

  private syncRendererPixelRatio(): void {
    this.currentPixelRatio = this.computeTargetPixelRatio();
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
      quality: this.quality,
      motionBlurEnabled: this.motionBlurEnabled,
      motionBlurStrength: this.motionBlurStrength,
      ambientOcclusionEnabled: this.ambientOcclusionEnabled,
      bloomEnabled: this.bloomEnabled,
      pixelRatio: this.currentPixelRatio,
    };
  }

  public setQualityPreset(preset: GraphicsQualityPreset): void {
    this.quality = preset;
    if (preset === 'ultra') {
      this.ambientOcclusionEnabled = true;
      this.bloomEnabled = true;
    } else if (preset === 'balanced') {
      this.ambientOcclusionEnabled = true;
      this.bloomEnabled = false;
    } else {
      this.ambientOcclusionEnabled = false;
      this.bloomEnabled = false;
    }
    this.syncRendererPixelRatio();
    this.saveSettings();
  }

  public cycleQualityPreset(): GraphicsQualityPreset {
    const order: readonly GraphicsQualityPreset[] = ['ultra', 'balanced', 'performance'];
    const next = order[(order.indexOf(this.quality) + 1) % order.length];
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
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          quality: this.quality,
          motionBlurEnabled: this.motionBlurEnabled,
        })
      );
    } catch {
      // Ignore storage quota errors
    }
  }

  private restoreSettings(): void {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<{
        quality: GraphicsQualityPreset;
        motionBlurEnabled: boolean;
      }>;
      if (
        parsed.quality === 'ultra' ||
        parsed.quality === 'balanced' ||
        parsed.quality === 'performance'
      ) {
        this.quality = parsed.quality;
        if (this.quality === 'balanced') {
          this.bloomEnabled = false;
        } else if (this.quality === 'performance') {
          this.ambientOcclusionEnabled = false;
          this.bloomEnabled = false;
        }
      }
      if (typeof parsed.motionBlurEnabled === 'boolean') {
        this.motionBlurEnabled = parsed.motionBlurEnabled;
      }
    } catch {
      // Ignore malformed session settings
    }
  }

  /**
   * Renders the 3D scene through the HDR velocity-motion-blur + contact-AO + bloom pipeline.
   */
  public render(scene: THREE.Scene, camera: RigCamera, dtSeconds: number): void {
    // Fast bypass when in 'performance' mode with motion blur disabled
    if (this.quality === 'performance' && !this.motionBlurEnabled) {
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
    this.renderer.setRenderTarget(null);

    // 2. Update post-processing uniforms
    const isOrtho = (camera as THREE.OrthographicCamera).isOrthographicCamera === true;
    const uniforms = this.postMaterial.uniforms;
    uniforms.uNear.value = camera.near;
    uniforms.uFar.value = camera.far;
    uniforms.uIsOrtho.value = isOrtho ? 1.0 : 0.0;
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
    uniforms.uAoIntensity.value = this.ambientOcclusionEnabled && !isOrtho ? 0.42 : 0.0;
    uniforms.uBloomIntensity.value = this.bloomEnabled ? 0.18 : 0.0;
    uniforms.uSharpenIntensity.value = this.quality === 'performance' ? 0.0 : 0.26;

    // 3. Draw single-pass composite quad to screen
    this.renderer.render(this.postScene, this.postCamera);

    // 4. Store current ViewProj matrix for next frame's velocity vectors
    this.prevViewProj.copy(this.currViewProj);
  }
}
