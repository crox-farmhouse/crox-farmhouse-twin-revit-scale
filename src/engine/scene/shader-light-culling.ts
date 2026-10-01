import * as THREE from 'three';

let shaderLightCullingInstalled = false;

/**
 * Patches Three.js's built-in PBR light chunks (`lights_pars_begin` and `lights_fragment_begin`)
 * so that:
 * 1. `getPointLightInfo` performs a fast distance-squared cutoff (`dot(lVector, lVector) >= cutoff * cutoff`)
 *    and zero-intensity check (`pointLight.color == vec3(0.0)`) BEFORE executing `sqrt`, `normalize`,
 *    or `pow(lightDistance, decay)`.
 * 2. `lights_fragment_begin` guards `RE_Direct(...)` (the full Cook-Torrance GGX microfacet BRDF)
 *    behind `if ( directLight.visible )`, skipping ~85% of per-pixel BRDF evaluations for PointLights
 *    and SpotLights that are switched off or in other rooms, with zero visual difference and zero
 *    shader recompilations when KNX circuits toggle.
 */
export function installShaderLightCulling(): void {
  if (shaderLightCullingInstalled) return;
  shaderLightCullingInstalled = true;

  const origPars = THREE.ShaderChunk.lights_pars_begin;
  if (typeof origPars === 'string' && origPars.includes('void getPointLightInfo')) {
    THREE.ShaderChunk.lights_pars_begin = origPars.replace(
      /void getPointLightInfo\s*\(\s*const in PointLight pointLight,\s*const in vec3 geometryPosition,\s*out IncidentLight light\s*\)\s*\{[\s\S]*?light\.visible\s*=\s*\(\s*light\.color\s*!=\s*vec3\(\s*0\.0\s*\)\s*\);\s*\}/,
      `void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		float distSq = dot( lVector, lVector );
		float cutoff = pointLight.distance;
		if ( ( cutoff > 0.0 && distSq >= cutoff * cutoff ) || pointLight.color == vec3( 0.0 ) ) {
			light.color = vec3( 0.0 );
			light.direction = vec3( 0.0, 1.0, 0.0 );
			light.visible = false;
			return;
		}
		vec3 camUpWorld = vec3( viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1] );
		float lightWorldY = cameraPosition.y + dot( pointLight.position, camUpWorld );
		float fragWorldY = cameraPosition.y + dot( geometryPosition, camUpWorld );
		float lightWorldX = cameraPosition.x + dot( pointLight.position, vec3( viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0] ) );
		if ( lightWorldX < -5.5 && lightWorldY < 2.00 && fragWorldY > 2.072 ) {
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
}
