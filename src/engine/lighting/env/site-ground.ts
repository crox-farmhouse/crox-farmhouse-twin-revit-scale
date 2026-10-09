import * as THREE from 'three';
import {
  Fn,
  color,
  length,
  mix,
  positionWorld,
  smoothstep,
  texture,
  uniform,
  uv,
  vec2,
} from 'three/tsl';
import { DEFAULT_SITE_HAZE_FOOTPRINT, type SiteHazeFootprint } from './site-haze-fog.ts';

/** Top of the property's sub-base plinth is −0.69 m; the meadow sits just below it. */
export const SITE_GROUND_Y = -0.705;

const GROUND_RADIUS = 240;
const FADE_START = 55;
const FADE_END = 210;
const TEXTURE_SIZE = 128;
/** World metres covered by one tile of the grass texture. */
const TILE_METRES = 3.5;

interface TslCapableStandardMaterial {
  colorNode?: unknown;
}

/** Small seeded PRNG (mulberry32) so the grass texture is identical on every load. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Tileable mown-meadow albedo (sRGB bytes): two octaves of value noise for clumps plus per-texel
 * blade speckle, in muted English-pasture greens. Pure data, no DOM.
 */
export function buildMeadowTextureData(size = TEXTURE_SIZE, seed = 1337): Uint8Array {
  const rand = mulberry32(seed);
  const lattice = (n: number): Float32Array => {
    const g = new Float32Array(n * n);
    for (let i = 0; i < g.length; i++) g[i] = rand();
    return g;
  };
  const coarseN = 8;
  const fineN = 32;
  const coarse = lattice(coarseN);
  const fine = lattice(fineN);
  const sample = (g: Float32Array, n: number, x: number, y: number): number => {
    const fx = (x / size) * n;
    const fy = (y / size) * n;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const tx = fx - x0;
    const ty = fy - y0;
    const sx = tx * tx * (3 - 2 * tx);
    const sy = ty * ty * (3 - 2 * ty);
    const at = (ix: number, iy: number): number => g[((iy % n) * n + (ix % n)) % (n * n)]!;
    const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx;
    const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx;
    return a + (b - a) * sy;
  };

  const data = new Uint8Array(size * size * 4);
  // Base pasture green and a drier, yellower tone for clump variation.
  const lush = [92, 116, 58];
  const dry = [128, 128, 72];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const clump = sample(coarse, coarseN, x, y) * 0.65 + sample(fine, fineN, x, y) * 0.35;
      const speckle = (rand() - 0.5) * 0.22;
      const shade = 0.82 + clump * 0.3 + speckle;
      const dryMix = Math.max(0, Math.min(1, (clump - 0.55) * 1.6));
      const i = (y * size + x) * 4;
      for (let c = 0; c < 3; c++) {
        const base = lush[c]! + (dry[c]! - lush[c]!) * dryMix;
        data[i + c] = Math.max(0, Math.min(255, Math.round(base * shade)));
      }
      data[i + 3] = 255;
    }
  }
  return data;
}

/** Live handle to the site ground: update the horizon tint when the sky changes. */
export interface SiteGround {
  readonly mesh: THREE.Mesh;
  /** Linear radiance the far meadow fades into (the HDR's horizon ground × background intensity). */
  setHorizonColor(color: THREE.Color): void;
  dispose(): void;
}

/**
 * Large shadow-receiving meadow disc under the estate. Beyond the site it fades into the HDR's
 * horizon ground colour, so the 3D ground meets the panorama without a visible edge. One draw call,
 * one tiny texture; identical for every camera.
 */
export function createSiteGround(footprint: SiteHazeFootprint = DEFAULT_SITE_HAZE_FOOTPRINT): SiteGround {
  const tex = new THREE.DataTexture(buildMeadowTextureData(), TEXTURE_SIZE, TEXTURE_SIZE);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 4;
  const tileRepeat = (GROUND_RADIUS * 2) / TILE_METRES;
  tex.repeat.set(tileRepeat, tileRepeat);
  tex.needsUpdate = true;

  const material = new THREE.MeshStandardMaterial({
    map: tex,
    roughness: 0.96,
    metalness: 0,
    // Keep the meadow behind any coplanar estate surface (plinth top, barn slab).
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 4,
  });
  const uniforms = {
    uCroxHorizon: { value: new THREE.Color(0x3c4d28) },
    uCroxSiteCenter: { value: new THREE.Vector2(footprint.centerX, footprint.centerZ) },
    uCroxFade: { value: new THREE.Vector2(FADE_START, FADE_END) },
  };

  const uHorizonNode = uniform(uniforms.uCroxHorizon.value);
  const uSiteCenterNode = vec2(footprint.centerX, footprint.centerZ);
  const baseHorizonTint = color(0x3c4d28);

  const tslMaterial = material as unknown as TslCapableStandardMaterial;
  tslMaterial.colorNode = Fn(() => {
    const grassAlbedo = texture(tex, uv().mul(tileRepeat)).rgb;
    const distFromCenter = length(positionWorld.xz.sub(uSiteCenterNode));
    const horizonBlend = smoothstep(FADE_START, FADE_END, distFromCenter).mul(0.88);
    const horizonTarget = mix(baseHorizonTint, uHorizonNode, 1.0);
    return mix(grassAlbedo, horizonTarget, horizonBlend);
  })();

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vCroxGroundXZ;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvCroxGroundXZ = ( modelMatrix * vec4( transformed, 1.0 ) ).xz;'
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec2 vCroxGroundXZ;\nuniform vec3 uCroxHorizon;\nuniform vec2 uCroxSiteCenter;\nuniform vec2 uCroxFade;'
      )
      .replace(
        '#include <tonemapping_fragment>',
        'gl_FragColor.rgb = mix( gl_FragColor.rgb, uCroxHorizon, smoothstep( uCroxFade.x, uCroxFade.y, length( vCroxGroundXZ - uCroxSiteCenter ) ) );\n#include <tonemapping_fragment>'
      );
  };
  material.customProgramCacheKey = () => 'crox-site-ground';

  const geometry = new THREE.CircleGeometry(GROUND_RADIUS, 96);
  geometry.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'environment.siteGround';
  mesh.position.set(footprint.centerX, SITE_GROUND_Y, footprint.centerZ);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  mesh.userData['isEnvironmentGround'] = true;
  mesh.updateMatrix();
  mesh.updateMatrixWorld(true);
  mesh.matrixAutoUpdate = false;

  return {
    mesh,
    setHorizonColor: (nextColor) => {
      uniforms.uCroxHorizon.value.copy(nextColor);
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
      tex.dispose();
    },
  };
}
