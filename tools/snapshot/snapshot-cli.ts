/**
 * Snapshot entry point for the Crox Farmhouse property scene.
 *
 * Mirrors the scene-construction portion of `CroxPropertyScene` (everything
 * except the WebGL renderer, cameras, controls and DOM event wiring) so the
 * full built scene graph can be fingerprinted headlessly.
 */
import './env-setup.ts';
import * as THREE from 'three';
import { main } from './scene-fingerprint.ts';

void main(async () => {
  const { buildPropertySceneForSnapshot } = await import('./property-scene-build.ts');
  return buildPropertySceneForSnapshot(THREE);
});
