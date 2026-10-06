import * as THREE from 'three';
import type { SceneCameraPoseSnapshot } from '../../../../types/scene.ts';
import type { RoomZoneId } from '../../../../types/topology.ts';
import type { CameraRig } from '../camera-rig.ts';

export interface WalkthroughSpawnPoint {
  readonly id: string;
  readonly label: string;
  readonly zoneId: RoomZoneId;
  readonly position: readonly [number, number, number]; // [x, footY, z]
  readonly yawDeg: number; // 0 = looking North (-Z), 90 = West (-X), -90 = East (+X), 180 = South (+Z)
}

export const EW_ROT_Y = -Math.atan2(0.705, 5.27);
export const EW_COS = Math.cos(EW_ROT_Y);
export const EW_SIN = Math.sin(EW_ROT_Y);
export const EW_OFFSET_X = -16.92 - (-16.92 * EW_COS + 2.54 * EW_SIN);
export const EW_OFFSET_Z = 2.61 - (16.92 * EW_SIN + 2.54 * EW_COS);

export function worldToEastWingLocal(
  wx: number,
  wz: number
): { readonly ewX: number; readonly ewZ: number } {
  const dx = wx - EW_OFFSET_X;
  const dz = wz - EW_OFFSET_Z;
  return {
    ewX: dx * EW_COS - dz * EW_SIN,
    ewZ: dx * EW_SIN + dz * EW_COS,
  };
}

export function ewSpawnPos(x: number, y: number, z: number): readonly [number, number, number] {
  return [
    Number((x * EW_COS + z * EW_SIN + EW_OFFSET_X).toFixed(3)),
    y,
    Number((-x * EW_SIN + z * EW_COS + EW_OFFSET_Z).toFixed(3)),
  ];
}

export const DEFAULT_WALKTHROUGH_SPAWNS: readonly WalkthroughSpawnPoint[] = [
  {
    id: 'kitchen',
    label: 'Kitchen & AGA',
    zoneId: 'kitchen',
    position: ewSpawnPos(-1.35, 0.05, 1.35),
    yawDeg: -8,
  },
  {
    id: 'sitting',
    label: 'Kitchen Sitting',
    zoneId: 'sitting',
    position: ewSpawnPos(2.35, 0.05, 0.85),
    yawDeg: -105,
  },
  {
    id: 'familyRoom',
    label: 'Dining Room',
    zoneId: 'familyRoom',
    position: ewSpawnPos(-7.1, 0.0, 1.35),
    yawDeg: -8,
  },
  {
    id: 'hall',
    label: 'Main Hall & Stairs',
    zoneId: 'hall',
    position: ewSpawnPos(-14.8, -0.3, 1.4),
    yawDeg: -8,
  },
  {
    id: 'livingRoom',
    label: 'Living Room',
    zoneId: 'livingRoom',
    position: [-19.4, -0.6, 0.2],
    yawDeg: 45,
  },
  {
    id: 'sittingRoom',
    label: 'Sitting Room',
    zoneId: 'sittingRoom',
    position: [-19.8, -0.6, 5.8],
    yawDeg: 90,
  },
  {
    id: 'study',
    label: 'Study',
    zoneId: 'study',
    position: [-19.6, -0.6, 9.8],
    yawDeg: 180,
  },
  {
    id: 'upperLanding',
    label: '1st Floor Landing',
    zoneId: 'upperLanding',
    position: ewSpawnPos(-15.2, 2.16, 1.1),
    yawDeg: -98,
  },
  {
    id: 'mainBedroom',
    label: 'Main Bedroom',
    zoneId: 'mainBedroom',
    position: ewSpawnPos(-7.2, 2.34, 0.5),
    yawDeg: -98,
  },
  {
    id: 'courtyard',
    label: 'Courtyard',
    zoneId: 'courtyard',
    position: ewSpawnPos(1.5, 0.0, 6.2),
    yawDeg: 8,
  },
];

export const STANDING_EYE_HEIGHT = 1.60;
export const CROUCH_EYE_HEIGHT = 1.00;
export const WALK_SPEED_MPS = 3.35;
export const SPRINT_SPEED_MPS = 5.85;
export const CROUCH_SPEED_MPS = 1.85;
export const JUMP_IMPULSE_MPS = 4.1;
export const GRAVITY_MPS2 = 16.0;
export const KEY_TURN_SPEED_RAD = 1.85;
export const MOUSE_SENSITIVITY = 0.0022;
export const DRAG_SENSITIVITY = 0.0042;
export const MAX_PITCH_RAD = THREE.MathUtils.degToRad(84);
export const WALKTHROUGH_FOV_PRESETS = [72, 78, 90] as const;
export const DEFAULT_WALKTHROUGH_FOV = 78;
export const SPRINT_FOV_BOOST = 6;
export const INTERACT_MAX_DISTANCE = 2.85;

export const WALKTHROUGH_MOVEMENT_KEYS = new Set<string>([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'KeyQ',
  'KeyE',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ShiftLeft',
  'ShiftRight',
]);

export interface SavedOrbitState {
  readonly pose: SceneCameraPoseSnapshot;
  readonly fov: number;
}

export interface PersistedWalkthroughSession {
  readonly active: boolean;
  readonly footPos: readonly [number, number, number];
  readonly yawRad: number;
  readonly pitchRad: number;
  readonly crouched: boolean;
  readonly baseFov: number;
}

export const WALKTHROUGH_SESSION_KEY = 'crox_walkthrough_state_v1';

export function findNearestWalkthroughSpawn(
  footX: number,
  footY: number,
  footZ: number
): WalkthroughSpawnPoint {
  let bestSpawn = DEFAULT_WALKTHROUGH_SPAWNS[0];
  let bestScore = Number.POSITIVE_INFINITY;
  for (const sp of DEFAULT_WALKTHROUGH_SPAWNS) {
    const dx = sp.position[0] - footX;
    const dy = (sp.position[1] - footY) * 2.5;
    const dz = sp.position[2] - footZ;
    const score = dx * dx + dy * dy + dz * dz;
    if (score < bestScore) {
      bestScore = score;
      bestSpawn = sp;
    }
  }
  return bestSpawn;
}

export function computeWingWallSlideAxes(
  footX: number,
  footZ: number,
  moveVec: THREE.Vector3
): {
  readonly projU: number;
  readonly projV: number;
  readonly slideU: THREE.Vector3;
  readonly slideV: THREE.Vector3;
} {
  const inEastWing = worldToEastWingLocal(footX, footZ).ewX > -17.65;
  const axisUX = inEastWing ? EW_COS : 1;
  const axisUZ = inEastWing ? -EW_SIN : 0;
  const axisVX = inEastWing ? EW_SIN : 0;
  const axisVZ = inEastWing ? EW_COS : 1;
  const projU = moveVec.x * axisUX + moveVec.z * axisUZ;
  const projV = moveVec.x * axisVX + moveVec.z * axisVZ;
  return {
    projU,
    projV,
    slideU: new THREE.Vector3(Math.sign(projU) * axisUX, 0, Math.sign(projU) * axisUZ),
    slideV: new THREE.Vector3(Math.sign(projV) * axisVX, 0, Math.sign(projV) * axisVZ),
  };
}

export function syncWalkthroughCameraPose(
  rig: CameraRig,
  footPos: THREE.Vector3,
  currentEyeHeight: number,
  jumpOffsetY: number,
  bobOffsetY: number,
  yawRad: number,
  pitchRad: number
): void {
  const cam = rig.perspCamera;
  const eyeY = footPos.y + currentEyeHeight + jumpOffsetY + bobOffsetY;
  cam.position.set(footPos.x, eyeY, footPos.z);

  const cosPitch = Math.cos(pitchRad);
  const sinPitch = Math.sin(pitchRad);
  const lookDirX = -Math.sin(yawRad) * cosPitch;
  const lookDirY = sinPitch;
  const lookDirZ = -Math.cos(yawRad) * cosPitch;

  const lookDistance = 2.2;
  rig.controls.target.set(
    cam.position.x + lookDirX * lookDistance,
    cam.position.y + lookDirY * lookDistance,
    cam.position.z + lookDirZ * lookDistance
  );
  cam.lookAt(rig.controls.target);
  cam.updateMatrixWorld();
}

export function saveWalkthroughSessionToStorage(payload: PersistedWalkthroughSession): void {
  try {
    sessionStorage.setItem(WALKTHROUGH_SESSION_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota or private mode errors
  }
}

export function loadWalkthroughSessionFromStorage(): {
  readonly footPos: readonly [number, number, number];
  readonly yawDeg: number;
  readonly pitchRad?: number;
  readonly crouched?: boolean;
  readonly baseFov?: number;
} | null {
  try {
    const raw = sessionStorage.getItem(WALKTHROUGH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedWalkthroughSession>;
    if (!parsed || parsed.active !== true || !Array.isArray(parsed.footPos)) {
      return null;
    }
    const [fx, fy, fz] = parsed.footPos;
    if (
      typeof fx !== 'number' ||
      typeof fy !== 'number' ||
      typeof fz !== 'number' ||
      !Number.isFinite(fx) ||
      !Number.isFinite(fy) ||
      !Number.isFinite(fz)
    ) {
      return null;
    }
    return {
      footPos: [fx, fy, fz],
      yawDeg:
        typeof parsed.yawRad === 'number' && Number.isFinite(parsed.yawRad)
          ? THREE.MathUtils.radToDeg(parsed.yawRad)
          : 0,
      pitchRad:
        typeof parsed.pitchRad === 'number' && Number.isFinite(parsed.pitchRad)
          ? THREE.MathUtils.clamp(parsed.pitchRad, -MAX_PITCH_RAD, MAX_PITCH_RAD)
          : undefined,
      crouched: typeof parsed.crouched === 'boolean' ? parsed.crouched : undefined,
      baseFov:
        typeof parsed.baseFov === 'number' && Number.isFinite(parsed.baseFov)
          ? THREE.MathUtils.clamp(parsed.baseFov, 60, 100)
          : undefined,
    };
  } catch {
    return null;
  }
}
