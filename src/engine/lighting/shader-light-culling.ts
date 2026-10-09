import * as THREE from 'three';
import {
  SHARED_BAKED_VOLUME_TEXTURE,
  SHARED_CAMERA_WORLD_MATRIX,
  SHARED_VOLUME_INV_SIZE,
  SHARED_VOLUME_MIN,
  SHARED_VOLUME_PARAMS,
} from './baked-light-volume.ts';

let shaderLightCullingInstalled = false;

/**
 * Patches Three.js's built-in PBR light chunks (`lights_pars_begin`, `lights_fragment_begin`,
 * and `lights_fragment_maps`) and registers shared uniforms on `ShaderLib.standard` /
 * `ShaderLib.physical` so that:
 * 1. `getPointLightInfo` performs a fast distance-squared cutoff (`dot(lVector, lVector) >= cutoff * cutoff`)
 *    and tightens the expensive per-pixel Cook-Torrance GGX microfacet loop to near-field highlights
 *    (`min(pointLight.distance, uBakedVolumeParams.w)`) when the 3D Baked Light Volume is active.
 * 2. `lights_fragment_begin` guards `RE_Direct(...)` behind `if ( directLight.visible )`.
 * 3. `lights_fragment_maps` samples the hardware-trilinear 3D Baked Light & AO Volume
 *    (`uBakedLightVolume`), injecting per-circuit KNX diffuse + 1-bounce GI (`RGB`) and static
 *    architectural Ambient Occlusion (`A`) in a single 3D texture fetch per pixel.
 */
export function installShaderLightCulling(): void {
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
	}`
    );
  }
}
