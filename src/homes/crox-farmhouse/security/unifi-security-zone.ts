import {
  createUniFiAccessReader3D,
  createUniFiProtectCamera3D,
  type UniFiAccessVisualHandle,
  type UniFiCameraVisualHandle,
} from '../../../catalog/index.ts';
import type {
  AccessPointEntityState,
  CctvCameraEntityState,
} from '../../../core/entities.ts';
import type { SceneBuilderContext } from '../../../types/scene.ts';
import {
  CROX_FARMHOUSE_UNIFI_ACCESS_POINTS,
  CROX_FARMHOUSE_UNIFI_CAMERAS,
} from '../manifest.ts';

export interface CroxSecurity3DHandles {
  readonly cameras: ReadonlyMap<string, UniFiCameraVisualHandle>;
  readonly accessReaders: ReadonlyMap<string, UniFiAccessVisualHandle>;
  syncCameras(states: readonly CctvCameraEntityState[]): void;
  syncAccessPoints(states: readonly AccessPointEntityState[]): void;
}

/**
 * Instantiates all 3D UniFi Protect CCTV cameras (with 3D FOV frustum cones)
 * and UniFi Access G2 Reader Pro / Door Hub readers across Crox Farmhouse.
 */
export function buildCroxUniFiSecurityAndAccess3D(
  ctx: SceneBuilderContext,
  initialCameras: readonly CctvCameraEntityState[] = CROX_FARMHOUSE_UNIFI_CAMERAS,
  initialAccessPoints: readonly AccessPointEntityState[] = CROX_FARMHOUSE_UNIFI_ACCESS_POINTS
): CroxSecurity3DHandles {
  const cameras = new Map<string, UniFiCameraVisualHandle>();
  const accessReaders = new Map<string, UniFiAccessVisualHandle>();

  for (const cam of initialCameras) {
    const handle = createUniFiProtectCamera3D(cam, ctx.interactiveMeshes);
    ctx.scene.add(handle.rootGroup);
    cameras.set(cam.entityId, handle);
  }

  for (const ap of initialAccessPoints) {
    const handle = createUniFiAccessReader3D(ap, ctx.interactiveMeshes);
    ctx.scene.add(handle.rootGroup);
    accessReaders.set(ap.entityId, handle);
  }

  return {
    cameras,
    accessReaders,
    syncCameras(states: readonly CctvCameraEntityState[]): void {
      for (const st of states) {
        const handle = cameras.get(st.entityId);
        if (!handle) continue;
        handle.frustumGroup.visible = st.showFrustum3D;

        if (st.activeDetection === 'vehicle') {
          handle.statusRingMat.color.setHex(0xef4444);
          handle.statusRingMat.emissive.setHex(0xdc2626);
          handle.statusRingMat.emissiveIntensity = 3.2;
          handle.frustumConeMat.color.setHex(0xef4444);
          handle.frustumConeMat.opacity = 0.22;
          handle.frustumWireMat.color.setHex(0xf87171);
        } else if (st.activeDetection === 'person') {
          handle.statusRingMat.color.setHex(0xf59e0b);
          handle.statusRingMat.emissive.setHex(0xd97706);
          handle.statusRingMat.emissiveIntensity = 3.0;
          handle.frustumConeMat.color.setHex(0xf59e0b);
          handle.frustumConeMat.opacity = 0.2;
          handle.frustumWireMat.color.setHex(0xfbbf24);
        } else {
          handle.statusRingMat.color.setHex(0x38bdf8);
          handle.statusRingMat.emissive.setHex(0x0284c7);
          handle.statusRingMat.emissiveIntensity = 2.0;
          handle.frustumConeMat.color.setHex(0x38bdf8);
          handle.frustumConeMat.opacity = 0.11;
          handle.frustumWireMat.color.setHex(0x38bdf8);
        }
      }
    },
    syncAccessPoints(states: readonly AccessPointEntityState[]): void {
      for (const st of states) {
        const handle = accessReaders.get(st.entityId);
        if (!handle) continue;
        if (!st.isLocked || st.doorPosition === 'open' || st.doorPosition === 'moving') {
          handle.statusLedMat.color.setHex(0x4be07a);
          handle.statusLedMat.emissive.setHex(0x22c55e);
          handle.statusLedMat.emissiveIntensity = 3.0;
        } else {
          handle.statusLedMat.color.setHex(0x38bdf8);
          handle.statusLedMat.emissive.setHex(0x0284c7);
          handle.statusLedMat.emissiveIntensity = 2.0;
        }
      }
    },
  };
}
