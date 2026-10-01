import type {
  CctvCameraEntityState,
  SmartDetectionType,
  SmartHomeBusEvent,
} from '../../core/entities.ts';
import { transformEastWingTuple } from '../../homes/crox-farmhouse/structure/ground-floor-materials.ts';

export type UniFiProtectListener = (
  cameras: readonly CctvCameraEntityState[],
  busEvent?: SmartHomeBusEvent
) => void;

/**
 * Initial Crox Farmhouse UniFi Protect CCTV Camera Topology.
 */
export const DEFAULT_UNIFI_PROTECT_CAMERAS: readonly CctvCameraEntityState[] = [
  {
    entityId: 'camera.unifi_driveway_gate',
    name: 'Driveway & Front Split Gate (AI Pro)',
    shortName: 'Gate AI Pro',
    protocol: 'unifi-protect',
    buildingId: 'courtyardGrounds',
    floorId: 'exterior',
    zoneId: 'courtyard',
    hardwareAddress: 'UVC-AI-Pro · 192.168.10.21',
    kind: 'camera',
    model: 'UVC-AI-Pro',
    isRecording: true,
    irNightVisionActive: true,
    showFrustum3D: false,
    activeDetection: 'none',
    lastDetectionSummary: 'Clear · LPR & Smart Zone Active',
    pose3D: {
      position: [-17.15, 2.48, 11.78],
      lookAt: [-19.6, 0.9, 15.6],
      horizontalFovDeg: 62,
      rangeMeters: 9.5,
    },
    cameraPresetId: 'courtyardGates',
  },
  {
    entityId: 'camera.unifi_south_courtyard',
    name: 'South Cobbled Courtyard (G5 Pro)',
    shortName: 'Courtyard G5',
    protocol: 'unifi-protect',
    buildingId: 'courtyardGrounds',
    floorId: 'exterior',
    zoneId: 'courtyard',
    hardwareAddress: 'UVC-G5-Pro · 192.168.10.22',
    kind: 'camera',
    model: 'UVC-G5-Pro',
    isRecording: true,
    irNightVisionActive: true,
    showFrustum3D: false,
    activeDetection: 'none',
    lastDetectionSummary: 'Clear · Courtyard & Bifolds Zone',
    pose3D: {
      position: transformEastWingTuple(-4.55, 3.15, 2.72),
      lookAt: transformEastWingTuple(1.2, 0.7, 7.8),
      horizontalFovDeg: 68,
      rangeMeters: 9.0,
    },
    cameraPresetId: 'overview',
  },
  {
    entityId: 'camera.unifi_east_gable',
    name: 'East Gable & Utility Door (G5 Pro)',
    shortName: 'East Gable G5',
    protocol: 'unifi-protect',
    buildingId: 'mainHouse',
    floorId: 'exterior',
    zoneId: 'utility',
    hardwareAddress: 'UVC-G5-Pro · 192.168.10.23',
    kind: 'camera',
    model: 'UVC-G5-Pro',
    isRecording: true,
    irNightVisionActive: true,
    showFrustum3D: false,
    activeDetection: 'none',
    lastDetectionSummary: 'Clear · East Stable Door Zone',
    pose3D: {
      position: transformEastWingTuple(5.08, 3.15, -0.6),
      lookAt: transformEastWingTuple(9.2, 0.8, 2.8),
      horizontalFovDeg: 64,
      rangeMeters: 7.5,
    },
    cameraPresetId: 'isometric',
  },
  {
    entityId: 'camera.unifi_west_wing',
    name: 'West Entrance & Bay Lawn (G5 Pro)',
    shortName: 'West Lawn G5',
    protocol: 'unifi-protect',
    buildingId: 'mainHouse',
    floorId: 'exterior',
    zoneId: 'entranceHall',
    hardwareAddress: 'UVC-G5-Pro · 192.168.10.24',
    kind: 'camera',
    model: 'UVC-G5-Pro',
    isRecording: true,
    irNightVisionActive: true,
    showFrustum3D: false,
    activeDetection: 'none',
    lastDetectionSummary: 'Clear · Front Porch Approach',
    pose3D: {
      position: [-22.52, 3.85, 3.6],
      lookAt: [-27.5, 0.8, 2.8],
      horizontalFovDeg: 65,
      rangeMeters: 8.0,
    },
    cameraPresetId: 'sittingRoom',
  },
];

/**
 * UniFi Protect CCTV Protocol Adapter.
 *
 * Manages 3D camera entities, field-of-view (FOV) frustum visualization, and Smart Detections
 * (`person`, `vehicle`) that can trigger cross-protocol KNX automations via `SmartHomeHub`.
 */
export class UniFiProtectController {
  private readonly cameras: CctvCameraEntityState[];
  private readonly listeners = new Set<UniFiProtectListener>();
  private showFrustums = false;
  private nextEventId = 5000;

  public constructor(
    initialCameras: readonly CctvCameraEntityState[] = DEFAULT_UNIFI_PROTECT_CAMERAS
  ) {
    this.cameras = initialCameras.map((c) => ({ ...c }));
  }

  public subscribe(fn: UniFiProtectListener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify(busEvent?: SmartHomeBusEvent): void {
    for (const fn of this.listeners) {
      fn(this.cameras, busEvent);
    }
  }

  public getCameras(): readonly CctvCameraEntityState[] {
    return this.cameras;
  }

  public areFrustumsVisible(): boolean {
    return this.showFrustums;
  }

  public toggleAllFrustums(): boolean {
    this.showFrustums = !this.showFrustums;
    for (let i = 0; i < this.cameras.length; i++) {
      const cam = this.cameras[i];
      if (!cam) continue;
      this.cameras[i] = {
        ...cam,
        showFrustum3D: this.showFrustums,
      };
    }
    this.notify();
    return this.showFrustums;
  }

  public triggerSmartDetection(
    entityId: string,
    detection: SmartDetectionType
  ): CctvCameraEntityState | undefined {
    const idx = this.cameras.findIndex((c) => c.entityId === entityId);
    if (idx < 0) return undefined;
    const cam = this.cameras[idx];
    if (!cam) return undefined;

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] ?? '00:00:00';
    const summary =
      detection === 'vehicle'
        ? `Smart Detection: Vehicle (LPR Match) at ${cam.shortName}`
        : detection === 'person'
          ? `Smart Detection: Person in ${cam.shortName} Zone`
          : `${cam.shortName}: Motion Cleared`;

    const updated: CctvCameraEntityState = {
      ...cam,
      activeDetection: detection,
      showFrustum3D: this.showFrustums,
      lastDetectionSummary: summary,
    };
    this.cameras[idx] = updated;

    const busEvent: SmartHomeBusEvent = {
      id: this.nextEventId++,
      timestamp: timeStr,
      protocol: 'unifi-protect',
      sourceAddress: cam.hardwareAddress,
      targetAddress: cam.entityId,
      eventType: detection === 'none' ? 'SmartDetect.End' : `SmartDetect.${detection}`,
      summary,
    };

    this.notify(busEvent);
    return updated;
  }
}
