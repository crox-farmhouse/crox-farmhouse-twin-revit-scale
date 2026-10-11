import * as THREE from 'three';
import {
  Fn,
  If,
  clamp,
  clearcoatNormalView,
  dot,
  float,
  max,
  min,
  mix,
  normalView,
  normalWorld,
  positionViewDirection,
  positionWorld,
  renderGroup,
  select,
  type ShaderNodeObject,
  sqrt,
  step,
  texture3D,
  uniform,
  vec3,
  vec4,
} from 'three/tsl';
import { type Node, type NodeBuilder, PhysicalLightingModel, PointLightNode } from 'three/webgpu';
import {
  SHARED_BAKED_VOLUME_TEXTURE,
  SHARED_CAMERA_WORLD_MATRIX,
  SHARED_VOLUME_INV_SIZE,
  SHARED_VOLUME_MIN,
  SHARED_VOLUME_PARAMS,
} from './baked-light-volume.ts';

export {
  SHARED_BAKED_VOLUME_TEXTURE,
  SHARED_CAMERA_WORLD_MATRIX,
  SHARED_VOLUME_INV_SIZE,
  SHARED_VOLUME_MIN,
  SHARED_VOLUME_PARAMS,
};

export const SHARED_LIGHT_VOLUME_UNIFORMS = {
  uBakedLightVolume: { value: SHARED_BAKED_VOLUME_TEXTURE },
  uCameraWorldMatrix: { value: SHARED_CAMERA_WORLD_MATRIX },
  uBakedVolumeMin: { value: SHARED_VOLUME_MIN },
  uBakedVolumeInvSize: { value: SHARED_VOLUME_INV_SIZE },
  uBakedVolumeParams: { value: SHARED_VOLUME_PARAMS },
} as const;

/** TSL uniform nodes backed directly by the shared Vector3 / Vector4 singletons in renderGroup. */
export const uBakedVolumeMinNode = uniform(SHARED_VOLUME_MIN).setGroup(renderGroup);
export const uBakedVolumeInvSizeNode = uniform(SHARED_VOLUME_INV_SIZE).setGroup(renderGroup);
export const uBakedVolumeParamsNode = uniform(SHARED_VOLUME_PARAMS).setGroup(renderGroup);

/**
 * TSL node that samples the hardware-trilinear 3D Baked Light & AO Volume (`SHARED_BAKED_VOLUME_TEXTURE`)
 * using world-space position and normal, returning `vec4(bakedIrradiance.rgb, bakedAo)`.
 */
export const sampleBakedLightVolumeNode = Fn(() => {
  const enabled = step(0.5, uBakedVolumeParamsNode.x);
  const biasedPos = positionWorld.add(normalWorld.mul(0.22));
  const bakedUvw = clamp(
    biasedPos.sub(uBakedVolumeMinNode).mul(uBakedVolumeInvSizeNode),
    vec3(0.005),
    vec3(0.995)
  );
  const bakedTexel = texture3D(SHARED_BAKED_VOLUME_TEXTURE, bakedUvw, 0)
    .setGroup(renderGroup)
    .toVar('croxBakedTexel');
  const bakedIrradiance = bakedTexel.rgb
    .mul(bakedTexel.rgb)
    .mul(uBakedVolumeParamsNode.y.mul(3.5).mul(enabled));
  const bakedAo = mix(float(1.0), bakedTexel.a, uBakedVolumeParamsNode.z.mul(enabled));
  return vec4(bakedIrradiance, bakedAo);
});

let shaderLightCullingInstalled = false;
let webGpuLightVolumeInstalled = false;

interface TslIrradianceNode {
  assign(value: unknown): void;
  add(value: unknown): { mul(factor: unknown): unknown };
}

interface DirectLightInput {
  readonly lightDirection: Node;
  readonly lightColor: Node;
  readonly reflectedLight: unknown;
  readonly lightNode?: unknown;
}

function installWebGpuLightVolumeHooks(): void {
  if (webGpuLightVolumeInstalled) return;
  webGpuLightVolumeInstalled = true;

  const lightingProto = PhysicalLightingModel.prototype as unknown as {
    clearcoat?: boolean;
    start?: (this: PhysicalLightingModel, builder: NodeBuilder) => void;
    direct?: (this: PhysicalLightingModel, input: DirectLightInput, builder: NodeBuilder) => void;
    indirectDiffuse?: (this: PhysicalLightingModel, builder: NodeBuilder) => void;
  };

  const origStart = lightingProto.start;
  if (typeof origStart === 'function') {
    lightingProto.start = function (this: PhysicalLightingModel, builder: NodeBuilder): void {
      const stack = (builder as unknown as { stack?: { add(node: unknown): void } }).stack;
      if (stack) {
        stack.add(normalView);
        stack.add(positionViewDirection);
        if ((this as unknown as { clearcoat?: boolean }).clearcoat === true) {
          stack.add(clearcoatNormalView);
        }
      }
      origStart.call(this, builder);
    };
  }

  const origDirect = lightingProto.direct;
  if (typeof origDirect === 'function') {
    lightingProto.direct = function (
      this: PhysicalLightingModel,
      input: DirectLightInput,
      builder: NodeBuilder
    ): void {
      if (input.lightNode instanceof PointLightNode) {
        const lc = input.lightColor as unknown as ShaderNodeObject<Node>;
        If(max(lc.r, max(lc.g, lc.b)).greaterThan(1e-4), () => {
          origDirect.call(this, input, builder);
        });
        return;
      }
      origDirect.call(this, input, builder);
    };
  }

  const origIndirectDiffuse = lightingProto.indirectDiffuse;
  if (typeof origIndirectDiffuse === 'function') {
    lightingProto.indirectDiffuse = function (
      this: PhysicalLightingModel,
      builder: NodeBuilder
    ): void {
      const ctx = (
        builder as unknown as {
          context?: {
            irradiance?: TslIrradianceNode & { mul(factor: unknown): unknown };
            iblIrradiance?: TslIrradianceNode & { mul(factor: unknown): unknown };
          };
        }
      ).context;
      if (ctx?.irradiance) {
        const enabled = step(0.5, uBakedVolumeParamsNode.x);
        const biasedPos = positionWorld.add(normalWorld.mul(0.22));
        const bakedUvw = clamp(
          biasedPos.sub(uBakedVolumeMinNode).mul(uBakedVolumeInvSizeNode),
          vec3(0.005),
          vec3(0.995)
        );
        const bakedTexel = texture3D(SHARED_BAKED_VOLUME_TEXTURE, bakedUvw, 0)
          .setGroup(renderGroup)
          .toVar('croxBakedTexel');
        const bakedIrradiance = bakedTexel.rgb
          .mul(bakedTexel.rgb)
          .mul(uBakedVolumeParamsNode.y.mul(3.5).mul(enabled));
        const bakedAo = mix(float(1.0), bakedTexel.a, uBakedVolumeParamsNode.z.mul(enabled));
        ctx.irradiance.assign(ctx.irradiance.add(bakedIrradiance).mul(bakedAo));
        if (ctx.iblIrradiance) {
          ctx.iblIrradiance.assign(ctx.iblIrradiance.mul(bakedAo));
        }
      }
      origIndirectDiffuse.call(this, builder);
    };
  }

  const pointLightProto = PointLightNode.prototype as unknown as {
    setupDirect?: (this: PointLightNode, builder: NodeBuilder) => unknown;
  };
  const origSetupDirect = pointLightProto.setupDirect;
  if (typeof origSetupDirect === 'function') {
    pointLightProto.setupDirect = function (this: PointLightNode, builder: NodeBuilder): unknown {
      const lVector = (
        this as unknown as { getLightVector(b: NodeBuilder): ShaderNodeObject<Node> }
      )
        .getLightVector(builder)
        .toVar();
      const distSq = dot(lVector, lVector).toVar();
      const rawCutoff = float(this.cutoffDistanceNode);
      const effectiveCutoff = select(
        uBakedVolumeParamsNode.x.greaterThan(0.5).and(rawCutoff.greaterThan(0.0)),
        min(rawCutoff, uBakedVolumeParamsNode.w),
        rawCutoff
      ).toVar();
      const c = (this as unknown as { colorNode: ShaderNodeObject<Node> }).colorNode;
      const decay = float(this.decayExponentNode);
      const hasColor = max(c.r, max(c.g, c.b)).greaterThan(1e-4);
      const inRange = effectiveCutoff
        .lessThanEqual(0.0)
        .or(distSq.lessThan(effectiveCutoff.mul(effectiveCutoff)));

      const lightDirection = vec3(0.0, 1.0, 0.0).toVar();
      const lightColor = vec3(0.0).toVar();

      If(hasColor.and(inRange), () => {
        const lightDistance = max(sqrt(distSq), 1e-4).toVar();
        lightDirection.assign(lVector.div(lightDistance));
        const distanceFalloff = lightDistance.pow(decay).max(0.01).reciprocal();
        const cutoffRatio = lightDistance.div(max(effectiveCutoff, 1e-4));
        const windowFactor = clamp(float(1.0).sub(cutoffRatio.pow4()), 0.0, 1.0).pow2();
        const attenuation = select(
          effectiveCutoff.greaterThan(0.0),
          distanceFalloff.mul(windowFactor),
          distanceFalloff
        );
        lightColor.assign(c.mul(attenuation));
      });

      return { lightDirection, lightColor };
    };
  }
}

/**
 * Installs both the WebGPU/TSL `PhysicalLightingModel` + `PointLightNode` hooks and the legacy
 * WebGL PBR light chunks (`lights_pars_begin`, `lights_fragment_begin`, `lights_fragment_maps`) so
 * that:
 * 1. `PointLight` evaluation tightens the expensive per-pixel Cook-Torrance GGX microfacet loop to
 *    near-field highlights (`min(pointLight.distance, uBakedVolumeParams.w)`) when the 3D Baked
 *    Light Volume is active, and skips `BRDF_GGX` / `BRDF_Lambert` completely when out of range.
 * 2. Indirect diffuse evaluation samples the hardware-trilinear 3D Baked Light & AO Volume
 *    (`uBakedLightVolume`), injecting per-circuit KNX diffuse + 1-bounce GI (`RGB`) and static
 *    architectural Ambient Occlusion (`A`) in a single 3D texture fetch per pixel.
 */
export function installShaderLightCulling(): void {
  installWebGpuLightVolumeHooks();

  if (shaderLightCullingInstalled) return;
  shaderLightCullingInstalled = true;

  for (const lib of [THREE.ShaderLib.standard, THREE.ShaderLib.physical]) {
    if (!lib?.uniforms) continue;
    lib.uniforms.uBakedLightVolume = { value: SHARED_BAKED_VOLUME_TEXTURE };
    lib.uniforms.uCameraWorldMatrix = { value: SHARED_CAMERA_WORLD_MATRIX };
    lib.uniforms.uBakedVolumeMin = { value: SHARED_VOLUME_MIN };
    lib.uniforms.uBakedVolumeInvSize = { value: SHARED_VOLUME_INV_SIZE };
    lib.uniforms.uBakedVolumeParams = { value: SHARED_VOLUME_PARAMS };
  }

  const origPars = THREE.ShaderChunk.lights_pars_begin;
  if (typeof origPars === 'string' && origPars.includes('void getPointLightInfo')) {
    const bakedUniformDecl = `
uniform sampler3D uBakedLightVolume;
uniform mat4 uCameraWorldMatrix;
uniform vec3 uBakedVolumeMin;
uniform vec3 uBakedVolumeInvSize;
uniform vec4 uBakedVolumeParams;
`;
    THREE.ShaderChunk.lights_pars_begin =
      bakedUniformDecl +
      origPars.replace(
        /void getPointLightInfo\s*\(\s*const in PointLight pointLight,\s*const in vec3 geometryPosition,\s*out IncidentLight light\s*\)\s*\{[\s\S]*?light\.visible\s*=\s*\(\s*light\.color\s*!=\s*vec3\(\s*0\.0\s*\)\s*\);\s*\}/,
        `void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		float distSq = dot( lVector, lVector );
		float rawCutoff = pointLight.distance;
		float cutoff = ( uBakedVolumeParams.x > 0.5 && rawCutoff > 0.0 )
			? min( rawCutoff, uBakedVolumeParams.w )
			: rawCutoff;
		if ( ( cutoff > 0.0 && distSq >= cutoff * cutoff ) || pointLight.color == vec3( 0.0 ) ) {
			light.color = vec3( 0.0 );
			light.direction = vec3( 0.0, 1.0, 0.0 );
			light.visible = false;
			return;
		}
		float lightDistance = sqrt( distSq );
		light.direction = lVector / max( lightDistance, 1e-4 );
		light.color = pointLight.color * getDistanceAttenuation( lightDistance, cutoff, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}`
      );
  }

  const origFrag = THREE.ShaderChunk.lights_fragment_begin;
  if (typeof origFrag === 'string' && origFrag.includes('RE_Direct(')) {
    THREE.ShaderChunk.lights_fragment_begin = origFrag.replace(
      /RE_Direct\(\s*directLight,\s*geometryPosition,\s*geometryNormal,\s*geometryViewDir,\s*geometryClearcoatNormal,\s*material,\s*reflectedLight\s*\);/g,
      `if ( directLight.visible ) {
			RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
		}`
    );
  }

  const origMaps = THREE.ShaderChunk.lights_fragment_maps;
  if (typeof origMaps === 'string' && origMaps.includes('#if defined( RE_IndirectDiffuse )')) {
    THREE.ShaderChunk.lights_fragment_maps = origMaps.replace(
      '#if defined( RE_IndirectDiffuse )',
      `#if defined( RE_IndirectDiffuse )
	if ( uBakedVolumeParams.x > 0.5 ) {
		vec3 bakedWorldPos = ( uCameraWorldMatrix * vec4( geometryPosition, 1.0 ) ).xyz;
		vec3 bakedWorldNormal = normalize( mat3( uCameraWorldMatrix ) * geometryNormal );
		vec3 biasedPos = bakedWorldPos + bakedWorldNormal * 0.22;
		vec3 bakedUvw = clamp( ( biasedPos - uBakedVolumeMin ) * uBakedVolumeInvSize, vec3( 0.005 ), vec3( 0.995 ) );
		vec4 bakedTexel = texture( uBakedLightVolume, bakedUvw );
		vec3 bakedIrradiance = ( bakedTexel.rgb * bakedTexel.rgb ) * ( 3.5 * uBakedVolumeParams.y );
		float bakedAo = mix( 1.0, bakedTexel.a, uBakedVolumeParams.z );
		irradiance = irradiance * bakedAo + bakedIrradiance * bakedAo;
		#if defined( USE_ENVMAP ) && defined( RE_IndirectDiffuse )
		iblIrradiance = iblIrradiance * bakedAo;
		#endif
	}`
    );
  }
}

export const installCroxLightVolumeShader = installShaderLightCulling;

export function applyWebGpuLightVolumeToScene(_scene?: THREE.Scene): void {
  installShaderLightCulling();
}

export function updateBakedLightVolumeUniforms(): void {
  SHARED_BAKED_VOLUME_TEXTURE.needsUpdate = true;
}
