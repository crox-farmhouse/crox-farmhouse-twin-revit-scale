import * as THREE from 'three';

const MARKER = '/* crox-ortho-background */';

/**
 * three.js draws texture backgrounds on a unit box centred on the camera. Under an orthographic
 * projection that box shrinks to a speck in the middle of the view, so iso / plan views showed the
 * clear colour (white) instead of the sky. Scaling the box up under orthographic projection makes
 * every pixel see the panorama along the (parallel) view direction — the physically correct
 * "infinitely distant" background for an orthographic camera, matching perspective views that look
 * the same way. Perspective rendering is unchanged (scale 1).
 */
export function buildOrthoSafeBackgroundVertexShader(source: string): string {
  if (source.startsWith(MARKER)) return source;
  const patched = source.replace(
    '#include <begin_vertex>',
    'vec3 transformed = position * ( projectionMatrix[ 3 ][ 3 ] == 1.0 ? 1.0e4 : 1.0 );'
  );
  return patched === source ? source : `${MARKER}\n${patched}`;
}

/** Patches `ShaderLib.backgroundCube` in place (idempotent). Must run before the first background render. */
export function installOrthoSafeBackground(): void {
  const lib = THREE.ShaderLib.backgroundCube;
  lib.vertexShader = buildOrthoSafeBackgroundVertexShader(lib.vertexShader);
}
