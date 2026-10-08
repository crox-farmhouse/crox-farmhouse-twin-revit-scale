import * as THREE from 'three';

/** Horizontal footprint (world XZ) inside which the site is haze-free. */
export interface SiteHazeFootprint {
  readonly centerX: number;
  readonly centerZ: number;
  /** Radius (m) of the haze-free disc around the site centre. */
  readonly radius: number;
}

/**
 * Default footprint fitted to the navigable site (`SITE_PIVOT_BOUNDS`: x −40..30, z −20..35):
 * the buildings, courtyard and garden stay crisp, the surrounding fields fade into aerial haze.
 */
export const DEFAULT_SITE_HAZE_FOOTPRINT: SiteHazeFootprint = { centerX: -5, centerZ: 7.5, radius: 38 };

const MARKER = '/* crox-site-haze */';

function glslFloat(n: number): string {
  return Number.isInteger(n) ? `${n}.0` : `${n}`;
}

/**
 * Builds the replacement `fog_vertex` chunk. Instead of the camera-space depth (`-mvPosition.z`),
 * which makes orthographic / far-orbit views look far foggier than close perspective views, the
 * fog depth is the horizontal world distance *beyond the site footprint*. The haze is therefore a
 * property of the world, identical for every camera type, zoom and position.
 */
export function buildSiteHazeFogVertexChunk(footprint: SiteHazeFootprint): string {
  return `${MARKER}
#ifdef USE_FOG
	{
		vec3 crox_fogWorld = transpose( mat3( viewMatrix ) ) * ( mvPosition.xyz - viewMatrix[ 3 ].xyz );
		vec2 crox_fogOffset = crox_fogWorld.xz - vec2( ${glslFloat(footprint.centerX)}, ${glslFloat(footprint.centerZ)} );
		vFogDepth = max( 0.0, length( crox_fogOffset ) - ${glslFloat(footprint.radius)} );
	}
#endif
`;
}

/**
 * Globally swaps three's `fog_vertex` shader chunk for the world-space site haze (idempotent).
 * Must run before the first render so every material compiles with it; `FogExp2.density` is then
 * interpreted per metre beyond the site footprint.
 */
export function installSiteHazeFog(footprint: SiteHazeFootprint = DEFAULT_SITE_HAZE_FOOTPRINT): void {
  if (THREE.ShaderChunk.fog_vertex.startsWith(MARKER)) return;
  THREE.ShaderChunk.fog_vertex = buildSiteHazeFogVertexChunk(footprint);
}
