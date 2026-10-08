import * as THREE from 'three';

/**
 * Selective HDR bloom: a luminance soft-threshold bright pass at half resolution followed by a
 * dual-filter (13-tap down / 9-tap tent up) mip chain. Only pixels well above the threshold —
 * emissive bulb cores, LED diffusers, halos — contribute, so lit white walls do not glow.
 * Output (`texture`) is the accumulated half-resolution bloom, composited by the post shader.
 */

const FULLSCREEN_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const BRIGHT_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform sampler2D tColor;
  uniform vec2 uTexelSize;
  uniform float uThreshold;
  uniform float uKnee;
  varying vec2 vUv;
  vec3 prefilter(vec3 c) {
    float lum = max(c.r, max(c.g, c.b));
    float soft = clamp(lum - uThreshold + uKnee, 0.0, 2.0 * uKnee);
    soft = soft * soft / (4.0 * uKnee + 1e-5);
    float contribution = max(soft, lum - uThreshold) / max(lum, 1e-5);
    // Clamp fireflies so a single hot texel can't flood the frame.
    return min(c * contribution, vec3(64.0));
  }
  void main() {
    vec2 o = uTexelSize * 0.5;
    vec3 c = prefilter(texture2D(tColor, vUv + vec2(-o.x, -o.y)).rgb);
    c += prefilter(texture2D(tColor, vUv + vec2( o.x, -o.y)).rgb);
    c += prefilter(texture2D(tColor, vUv + vec2(-o.x,  o.y)).rgb);
    c += prefilter(texture2D(tColor, vUv + vec2( o.x,  o.y)).rgb);
    gl_FragColor = vec4(c * 0.25, 1.0);
  }
`;

const DOWN_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform sampler2D tSource;
  uniform vec2 uTexelSize;
  varying vec2 vUv;
  void main() {
    vec2 t = uTexelSize;
    vec3 a = texture2D(tSource, vUv + t * vec2(-2.0,  2.0)).rgb;
    vec3 b = texture2D(tSource, vUv + t * vec2( 0.0,  2.0)).rgb;
    vec3 c = texture2D(tSource, vUv + t * vec2( 2.0,  2.0)).rgb;
    vec3 d = texture2D(tSource, vUv + t * vec2(-2.0,  0.0)).rgb;
    vec3 e = texture2D(tSource, vUv).rgb;
    vec3 f = texture2D(tSource, vUv + t * vec2( 2.0,  0.0)).rgb;
    vec3 g = texture2D(tSource, vUv + t * vec2(-2.0, -2.0)).rgb;
    vec3 h = texture2D(tSource, vUv + t * vec2( 0.0, -2.0)).rgb;
    vec3 i = texture2D(tSource, vUv + t * vec2( 2.0, -2.0)).rgb;
    vec3 j = texture2D(tSource, vUv + t * vec2(-1.0,  1.0)).rgb;
    vec3 k = texture2D(tSource, vUv + t * vec2( 1.0,  1.0)).rgb;
    vec3 l = texture2D(tSource, vUv + t * vec2(-1.0, -1.0)).rgb;
    vec3 m = texture2D(tSource, vUv + t * vec2( 1.0, -1.0)).rgb;
    vec3 sum = e * 0.125 + (a + c + g + i) * 0.03125 + (b + d + f + h) * 0.0625 + (j + k + l + m) * 0.125;
    gl_FragColor = vec4(sum, 1.0);
  }
`;

const UP_FRAGMENT = /* glsl */ `
  precision highp float;
  uniform sampler2D tSource;
  uniform vec2 uTexelSize;
  uniform float uRadius;
  varying vec2 vUv;
  void main() {
    vec2 t = uTexelSize * uRadius;
    vec3 sum = texture2D(tSource, vUv).rgb * 4.0;
    sum += (texture2D(tSource, vUv + vec2(-t.x, 0.0)).rgb + texture2D(tSource, vUv + vec2(t.x, 0.0)).rgb
          + texture2D(tSource, vUv + vec2(0.0, -t.y)).rgb + texture2D(tSource, vUv + vec2(0.0, t.y)).rgb) * 2.0;
    sum += texture2D(tSource, vUv + vec2(-t.x, -t.y)).rgb + texture2D(tSource, vUv + vec2(t.x, -t.y)).rgb
         + texture2D(tSource, vUv + vec2(-t.x, t.y)).rgb + texture2D(tSource, vUv + vec2(t.x, t.y)).rgb;
    gl_FragColor = vec4(sum / 16.0, 1.0);
  }
`;

/** Pre-exposure HDR luminance where bloom starts (emissive cores are ~10–20, lit walls < 3). */
const BLOOM_THRESHOLD = 4.0;
const BLOOM_KNEE = 1.8;
const MIP_LEVELS = 5;

function makeTarget(w: number, h: number): THREE.WebGLRenderTarget {
  return new THREE.WebGLRenderTarget(Math.max(1, w), Math.max(1, h), {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    generateMipmaps: false,
    depthBuffer: false,
    stencilBuffer: false,
  });
}

export class BloomPass {
  private readonly mips: THREE.WebGLRenderTarget[] = [];
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private readonly quad: THREE.Mesh;
  private readonly brightMat: THREE.ShaderMaterial;
  private readonly downMat: THREE.ShaderMaterial;
  private readonly upMat: THREE.ShaderMaterial;
  private width = 0;
  private height = 0;

  public constructor() {
    this.brightMat = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERTEX,
      fragmentShader: BRIGHT_FRAGMENT,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tColor: { value: null },
        uTexelSize: { value: new THREE.Vector2() },
        uThreshold: { value: BLOOM_THRESHOLD },
        uKnee: { value: BLOOM_KNEE },
      },
    });
    this.downMat = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERTEX,
      fragmentShader: DOWN_FRAGMENT,
      depthTest: false,
      depthWrite: false,
      uniforms: { tSource: { value: null }, uTexelSize: { value: new THREE.Vector2() } },
    });
    this.upMat = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERTEX,
      fragmentShader: UP_FRAGMENT,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      transparent: true,
      uniforms: {
        tSource: { value: null },
        uTexelSize: { value: new THREE.Vector2() },
        uRadius: { value: 1.0 },
      },
    });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.brightMat);
    this.quad.frustumCulled = false;
    this.scene.add(this.quad);
  }

  /** Accumulated bloom (half resolution); valid after {@link render}. */
  public get texture(): THREE.Texture | null {
    return this.mips[0]?.texture ?? null;
  }

  public setSize(fullWidth: number, fullHeight: number): void {
    const w = Math.max(1, Math.floor(fullWidth / 2));
    const h = Math.max(1, Math.floor(fullHeight / 2));
    if (w === this.width && h === this.height && this.mips.length > 0) return;
    this.width = w;
    this.height = h;
    for (let i = 0; i < MIP_LEVELS; i++) {
      const mw = Math.max(1, w >> i);
      const mh = Math.max(1, h >> i);
      const existing = this.mips[i];
      if (existing) existing.setSize(mw, mh);
      else this.mips.push(makeTarget(mw, mh));
    }
  }

  private draw(renderer: THREE.WebGLRenderer, material: THREE.ShaderMaterial, target: THREE.WebGLRenderTarget, clear: boolean): void {
    this.quad.material = material;
    renderer.setRenderTarget(target);
    if (clear) renderer.clear(true, false, false);
    renderer.render(this.scene, this.camera);
  }

  public render(renderer: THREE.WebGLRenderer, hdrColor: THREE.Texture, fullWidth: number, fullHeight: number): void {
    this.setSize(fullWidth, fullHeight);
    const prevAutoClear = renderer.autoClear;
    const prevTarget = renderer.getRenderTarget();
    renderer.autoClear = false;

    this.brightMat.uniforms.tColor!.value = hdrColor;
    (this.brightMat.uniforms.uTexelSize!.value as THREE.Vector2).set(1 / fullWidth, 1 / fullHeight);
    this.draw(renderer, this.brightMat, this.mips[0]!, true);

    for (let i = 1; i < this.mips.length; i++) {
      const src = this.mips[i - 1]!;
      this.downMat.uniforms.tSource!.value = src.texture;
      (this.downMat.uniforms.uTexelSize!.value as THREE.Vector2).set(1 / src.width, 1 / src.height);
      this.draw(renderer, this.downMat, this.mips[i]!, true);
    }
    for (let i = this.mips.length - 2; i >= 0; i--) {
      const src = this.mips[i + 1]!;
      this.upMat.uniforms.tSource!.value = src.texture;
      (this.upMat.uniforms.uTexelSize!.value as THREE.Vector2).set(1 / src.width, 1 / src.height);
      this.draw(renderer, this.upMat, this.mips[i]!, false);
    }

    renderer.setRenderTarget(prevTarget);
    renderer.autoClear = prevAutoClear;
  }

  public dispose(): void {
    for (const m of this.mips) m.dispose();
    this.mips.length = 0;
    this.brightMat.dispose();
    this.downMat.dispose();
    this.upMat.dispose();
    this.quad.geometry.dispose();
  }
}
