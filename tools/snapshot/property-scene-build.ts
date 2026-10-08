import * as THREE from 'three';
import { RoomLodController } from '../../src/engine/lod/lod-manager.ts';
import {
  buildPropertySceneContent,
  createPropertySceneLayers,
} from '../../src/engine/viewer/scene-content.ts';
import { createCroxFarmhouseSceneProfile } from '../../src/homes/crox-farmhouse/crox-property-scene.ts';

/**
 * Builds the Crox Farmhouse scene content through the exact code path used by
 * `PropertyScene` (minus renderer / cameras / DOM wiring).
 */
export async function buildPropertySceneForSnapshot(_three: typeof THREE): Promise<{
  readonly roots: readonly THREE.Object3D[];
  readonly extras: Record<string, unknown>;
}> {
  const scene = new THREE.Scene();
  const layers = createPropertySceneLayers(scene);

  const profile = createCroxFarmhouseSceneProfile();
  const registry = profile.createZoneRegistry();
  const lod = new RoomLodController(profile.lodRegistrations);

  const content = buildPropertySceneContent(layers, {
    profile,
    registry,
    lodController: lod,
    ceilingCutaway: true,
  });

  return {
    roots: [scene],
    extras: {
      indicatorMats: content.indicatorMats,
      interactiveMeshes: content.interactiveMeshes,
      bifoldPanels: content.bifoldPanels.map((b) => ({
        group: b.group,
        closedX: b.closedX,
        openX: b.openX,
        dir: b.dir,
      })),
      lightGroups: content.lightGroups,
      roomSwitchLedMats: content.roomSwitchLedMats,
      tvArtTextures: content.tvArtTextures,
      tvOffTexture: content.tvOffTexture,
      securityCameras: Array.from(content.security.cameras.keys()),
      securityReaders: Array.from(content.security.accessReaders.keys()),
      cameraPresets: registry.getAllCameraPresets().map((p) => ({
        id: p.id,
        pos: p.pos.toArray(),
        target: p.target.toArray(),
        zoneId: p.zoneId,
        floor: p.floorViewMode,
      })),
      lodDiagnostics: lod.getDiagnostics(),
      interactionState: content.interactions,
    },
  };
}
