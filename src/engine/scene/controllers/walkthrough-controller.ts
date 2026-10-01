import * as THREE from 'three';
import type { SceneCameraPoseSnapshot } from '../../../types/scene.ts';
import type { RoomZoneId } from '../../../types/topology.ts';
import { isObjectVisibleInHierarchy } from '../object-utils.ts';
import type { CameraRig } from './camera-rig.ts';

export interface WalkthroughSpawnPoint {
  readonly id: string;
  readonly label: string;
  readonly zoneId: RoomZoneId;
  readonly position: readonly [number, number, number]; // [x, footY, z]
  readonly yawDeg: number; // 0 = looking North (-Z), 90 = West (-X), -90 = East (+X), 180 = South (+Z)
}

const EW_ROT_Y = -Math.atan2(0.705, 5.27);
const EW_COS = Math.cos(EW_ROT_Y);
const EW_SIN = Math.sin(EW_ROT_Y);
const EW_OFFSET_X = -16.92 - (-16.92 * EW_COS + 2.54 * EW_SIN);
const EW_OFFSET_Z = 2.61 - (16.92 * EW_SIN + 2.54 * EW_COS);

function worldToEastWingLocal(
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

function ewSpawnPos(x: number, y: number, z: number): readonly [number, number, number] {
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
    position: ewSpawnPos(-7.2, 2.16, 0.5),
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

const STANDING_EYE_HEIGHT = 1.60;
const CROUCH_EYE_HEIGHT = 1.00;
const WALK_SPEED_MPS = 3.35;
const SPRINT_SPEED_MPS = 5.85;
const CROUCH_SPEED_MPS = 1.85;
const JUMP_IMPULSE_MPS = 4.1;
const GRAVITY_MPS2 = 16.0;
const KEY_TURN_SPEED_RAD = 1.85;
const MOUSE_SENSITIVITY = 0.0022;
const DRAG_SENSITIVITY = 0.0042;
const MAX_PITCH_RAD = THREE.MathUtils.degToRad(84);
export const WALKTHROUGH_FOV_PRESETS = [72, 78, 90] as const;
const DEFAULT_WALKTHROUGH_FOV = 78;
const SPRINT_FOV_BOOST = 6;
const INTERACT_MAX_DISTANCE = 2.85;

interface SavedOrbitState {
  readonly pose: SceneCameraPoseSnapshot;
  readonly fov: number;
}

interface CachedObstacle {
  readonly mesh: THREE.Mesh;
  centerX: number;
  centerZ: number;
  radiusXZ: number;
  minY: number;
  maxY: number;
  readonly isDynamic: boolean;
}

interface CachedFurnitureBox {
  readonly mesh: THREE.Mesh;
  readonly visibilityNode: THREE.Object3D;
  readonly centerX: number;
  readonly centerZ: number;
  readonly radiusXZ: number;
  readonly minY: number;
  readonly maxY: number;
  readonly ux: number;
  readonly uz: number;
  readonly minU: number;
  readonly maxU: number;
  readonly minV: number;
  readonly maxV: number;
}

interface PersistedWalkthroughSession {
  readonly active: boolean;
  readonly footPos: readonly [number, number, number];
  readonly yawRad: number;
  readonly pitchRad: number;
  readonly crouched: boolean;
  readonly baseFov: number;
}

const WALKTHROUGH_SESSION_KEY = 'crox_walkthrough_state_v1';

/**
 * Call-of-Duty-style First-Person Walkthrough Controller (no weapon) for Crox Farmhouse.
 *
 * Supports:
 * - Wide 78° vertical (~110° horizontal widescreen) FOV with dynamic +6° sprint FOV kick & FOV presets (72° / 78° / 90°)
 * - Auto Pointer-Lock on canvas click for instant 360° mouselook (plus drag fallback)
 * - WASD move/strafe + Shift sprint + Space jump + C / Left Ctrl crouch
 * - Press [F] (or Left-Click while pointer-locked) to interact with targeted doors, cupboards, drawers, AGA lids & KNX switches
 * - Live center-screen raycast interaction prompt ("Press [F] to Open Door", etc.)
 */
export class WalkthroughController {
  private readonly canvas: HTMLCanvasElement;
  private readonly scene: THREE.Scene;
  private readonly rig: CameraRig;
  private readonly getRoomMinYAt: (x: number, y: number, z: number) => number | null;
  private readonly getInteractiveMeshes: () => readonly THREE.Object3D[];
  private readonly describeInteractable: (mesh: THREE.Object3D) => string;
  private readonly onInteractWithMesh: (mesh: THREE.Object3D) => void;
  private readonly onBargeWalkthroughDoor: (
    interactableId: string,
    isSprinting: boolean,
    footX: number,
    footY: number,
    footZ: number,
    moveDirX: number,
    moveDirZ: number
  ) => boolean;
  private readonly onProximityBargeDoors: (
    footX: number,
    footY: number,
    footZ: number,
    moveDirX: number,
    moveDirZ: number,
    isSprinting: boolean
  ) => boolean;
  private readonly onStateChanged: (active: boolean) => void;
  private readonly onPoseUpdated: () => void;

  private active = false;
  private crouched = false;
  private allowDoorBarge = false;
  private isCurrentlySprinting = false;
  private pointerLocked = false;
  private isDraggingLook = false;
  private lookDirty = false;
  private lastDragClientX = 0;
  private lastDragClientY = 0;

  private baseFov: number = DEFAULT_WALKTHROUGH_FOV;
  private currentFov: number = DEFAULT_WALKTHROUGH_FOV;

  private footPos = new THREE.Vector3(-1.35, 0.05, 1.35);
  private verticalVelocity = 0;
  private jumpOffsetY = 0;
  private currentEyeHeight = STANDING_EYE_HEIGHT;
  private yawRad = 0; // 0 = looking along -Z
  private pitchRad = 0;
  private targetYawRad = 0;
  private targetPitchRad = 0;
  private bobPhase = 0;
  private smoothedFps = 120;

  private glideTargetFoot: THREE.Vector3 | null = null;
  private savedOrbitState: SavedOrbitState | null = null;

  private targetedMesh: THREE.Object3D | null = null;
  private targetedPrompt: string | null = null;
  private lastRaycastMs = 0;
  private lastSessionSaveMs = 0;

  private cachedObstacles: CachedObstacle[] | null = null;
  private cachedFurnitureBoxes: CachedFurnitureBox[] = [];
  private readonly nearbyObstacleMeshes: THREE.Object3D[] = [];
  private readonly tmpBox = new THREE.Box3();
  private readonly tmpCorner = new THREE.Vector3();
  private readonly tmpOrigin = new THREE.Vector3();
  private readonly tmpNormal = new THREE.Vector3();

  private readonly keysDown = new Set<string>();
  private readonly wallRaycaster = new THREE.Raycaster();
  private readonly interactRaycaster = new THREE.Raycaster();
  private readonly centerNdc = new THREE.Vector2(0, 0);
  private readonly listeners = new Set<(active: boolean) => void>();

  public constructor(options: {
    readonly canvas: HTMLCanvasElement;
    readonly scene: THREE.Scene;
    readonly rig: CameraRig;
    readonly getRoomMinYAt: (x: number, y: number, z: number) => number | null;
    readonly getInteractiveMeshes: () => readonly THREE.Object3D[];
    readonly describeInteractable: (mesh: THREE.Object3D) => string;
    readonly onInteractWithMesh: (mesh: THREE.Object3D) => void;
    readonly onBargeWalkthroughDoor?: (
      interactableId: string,
      isSprinting: boolean,
      footX: number,
      footY: number,
      footZ: number,
      moveDirX: number,
      moveDirZ: number
    ) => boolean;
    readonly onProximityBargeDoors?: (
      footX: number,
      footY: number,
      footZ: number,
      moveDirX: number,
      moveDirZ: number,
      isSprinting: boolean
    ) => boolean;
    readonly onStateChanged: (active: boolean) => void;
    readonly onPoseUpdated: () => void;
  }) {
    this.canvas = options.canvas;
    this.scene = options.scene;
    this.rig = options.rig;
    this.getRoomMinYAt = options.getRoomMinYAt;
    this.getInteractiveMeshes = options.getInteractiveMeshes;
    this.describeInteractable = options.describeInteractable;
    this.onInteractWithMesh = options.onInteractWithMesh;
    this.onBargeWalkthroughDoor = options.onBargeWalkthroughDoor ?? (() => false);
    this.onProximityBargeDoors = options.onProximityBargeDoors ?? (() => false);
    this.onStateChanged = options.onStateChanged;
    this.onPoseUpdated = options.onPoseUpdated;

    this.wallRaycaster.near = 0.02;
    this.wallRaycaster.far = 0.55;
    this.interactRaycaster.near = 0.05;
    this.interactRaycaster.far = INTERACT_MAX_DISTANCE;

    this.bindInputEvents();
  }

  public isActive(): boolean {
    return this.active;
  }

  public isCrouched(): boolean {
    return this.crouched;
  }

  public isPointerLocked(): boolean {
    return this.pointerLocked;
  }

  public getBaseFov(): number {
    return this.baseFov;
  }

  public getSmoothedFps(): number {
    return Math.round(this.smoothedFps);
  }

  public invalidateObstacleCache(): void {
    this.cachedObstacles = null;
  }

  /**
   * Captures per-piece 2D Oriented Bounding Box furniture colliders from unmerged scene meshes
   * before `SceneBatchOptimizer` merges static assembly child meshes, then clears `cachedObstacles`
   * so raycast wall/door obstacles are lazily indexed against the live merged meshes.
   */
  public captureFurnitureColliders(): void {
    this.cachedFurnitureBoxes = [];
    this.cachedObstacles = null;
    this.getObstacleCache();
    this.cachedObstacles = null;
  }

  public pressKey(code: string): void {
    this.keysDown.add(code);
  }

  public setBaseFov(fov: number): void {
    this.baseFov = THREE.MathUtils.clamp(fov, 60, 100);
    this.currentFov = this.baseFov;
    if (this.active) {
      this.rig.perspCamera.fov = this.currentFov;
      this.rig.perspCamera.updateProjectionMatrix();
      this.onPoseUpdated();
    }
    this.saveSessionState(true);
    this.emit();
  }

  public cycleBaseFov(): number {
    const idx = WALKTHROUGH_FOV_PRESETS.indexOf(
      this.baseFov as (typeof WALKTHROUGH_FOV_PRESETS)[number]
    );
    const nextFov =
      WALKTHROUGH_FOV_PRESETS[(idx + 1) % WALKTHROUGH_FOV_PRESETS.length];
    this.setBaseFov(nextFov);
    return nextFov;
  }

  public getTargetedPrompt(): string | null {
    return this.targetedPrompt;
  }

  public getFootPosition(): THREE.Vector3 {
    return this.footPos;
  }

  public subscribe(cb: (active: boolean) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit(): void {
    for (const cb of this.listeners) {
      cb(this.active);
    }
  }

  public setCrouched(crouched: boolean): void {
    this.crouched = crouched;
    this.saveSessionState(true);
    this.emit();
  }

  public toggleCrouched(): boolean {
    this.crouched = !this.crouched;
    this.saveSessionState(true);
    this.emit();
    return this.crouched;
  }

  public requestMouseLock(): void {
    if (!this.active) return;
    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock?.();
    } else {
      try {
        this.canvas.requestPointerLock?.();
      } catch {
        // Ignore if browser blocks pointer lock outside direct gesture
      }
    }
  }

  public triggerTargetedInteraction(): boolean {
    if (!this.active) return false;
    this.refreshTargetedInteractable(true);
    if (!this.targetedMesh) return false;
    this.onInteractWithMesh(this.targetedMesh);
    this.refreshTargetedInteractable(true);
    return true;
  }

  public refreshPrompt(): void {
    this.refreshTargetedInteractable(true);
  }

  private blurActiveControlIfNeeded(): void {
    const activeEl = document.activeElement;
    if (activeEl instanceof HTMLElement && activeEl !== document.body && activeEl !== this.canvas) {
      activeEl.blur();
    }
  }

  private saveSessionState(force = false): void {
    const now = performance.now();
    if (!force && now - this.lastSessionSaveMs < 1500) return;
    this.lastSessionSaveMs = now;
    try {
      const payload: PersistedWalkthroughSession = {
        active: this.active,
        footPos: [
          Number(this.footPos.x.toFixed(3)),
          Number(this.footPos.y.toFixed(3)),
          Number(this.footPos.z.toFixed(3)),
        ],
        yawRad: Number(this.yawRad.toFixed(4)),
        pitchRad: Number(this.pitchRad.toFixed(4)),
        crouched: this.crouched,
        baseFov: this.baseFov,
      };
      sessionStorage.setItem(WALKTHROUGH_SESSION_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota or private mode errors
    }
  }

  public restoreFromSessionIfActive(currentPose: SceneCameraPoseSnapshot): boolean {
    try {
      const raw = sessionStorage.getItem(WALKTHROUGH_SESSION_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as Partial<PersistedWalkthroughSession>;
      if (!parsed || parsed.active !== true || !Array.isArray(parsed.footPos)) {
        return false;
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
        return false;
      }
      if (typeof parsed.baseFov === 'number' && Number.isFinite(parsed.baseFov)) {
        this.baseFov = THREE.MathUtils.clamp(parsed.baseFov, 60, 100);
      }
      this.enter(currentPose, {
        position: [fx, fy, fz],
        yawDeg:
          typeof parsed.yawRad === 'number' && Number.isFinite(parsed.yawRad)
            ? THREE.MathUtils.radToDeg(parsed.yawRad)
            : 0,
      });
      if (typeof parsed.pitchRad === 'number' && Number.isFinite(parsed.pitchRad)) {
        this.pitchRad = THREE.MathUtils.clamp(parsed.pitchRad, -MAX_PITCH_RAD, MAX_PITCH_RAD);
        this.targetPitchRad = this.pitchRad;
      }
      if (typeof parsed.crouched === 'boolean') {
        this.crouched = parsed.crouched;
        this.currentEyeHeight = this.crouched ? CROUCH_EYE_HEIGHT : STANDING_EYE_HEIGHT;
      }
      this.ensureFootPositionUnblocked();
      this.syncCameraFromFootAndAngles(0);
      this.onPoseUpdated();
      this.emit();
      return true;
    } catch {
      return false;
    }
  }

  private depenetrateFootPosition(): void {
    this.getObstacleCache();
    const furnMinY = this.footPos.y + 0.25;
    const furnMaxY =
      this.footPos.y + Math.max(this.currentEyeHeight, STANDING_EYE_HEIGHT) + 0.15;
    const furnPad = 0.2;
    const furnPadSq = furnPad * furnPad;

    for (let iter = 0; iter < 2; iter++) {
      let pushed = false;
      for (let i = 0; i < this.cachedFurnitureBoxes.length; i++) {
        const f = this.cachedFurnitureBoxes[i];
        if (f.maxY <= furnMinY || f.minY >= furnMaxY) continue;
        const dx = f.centerX - this.footPos.x;
        const dz = f.centerZ - this.footPos.z;
        const maxDist = f.radiusXZ + furnPad + 0.15;
        if (dx * dx + dz * dz > maxDist * maxDist) continue;
        const visTarget = f.mesh.parent ? f.mesh : f.visibilityNode;
        if (!isObjectVisibleInHierarchy(visTarget)) continue;

        const vx = -f.uz;
        const vz = f.ux;
        const curU = this.footPos.x * f.ux + this.footPos.z * f.uz;
        const curV = this.footPos.x * vx + this.footPos.z * vz;

        const clampedU = Math.max(f.minU, Math.min(f.maxU, curU));
        const clampedV = Math.max(f.minV, Math.min(f.maxV, curV));
        const du = curU - clampedU;
        const dv = curV - clampedV;
        const distSq = du * du + dv * dv;

        if (distSq >= furnPadSq) continue;

        let targetU = curU;
        let targetV = curV;
        if (distSq > 1e-6) {
          const dist = Math.sqrt(distSq);
          const push = furnPad - dist + 0.005;
          targetU += (du / dist) * push;
          targetV += (dv / dist) * push;
        } else {
          // Inside OBB: push out along nearest edge
          const dMinU = curU - (f.minU - furnPad);
          const dMaxU = f.maxU + furnPad - curU;
          const dMinV = curV - (f.minV - furnPad);
          const dMaxV = f.maxV + furnPad - curV;
          const minD = Math.min(dMinU, dMaxU, dMinV, dMaxV);
          if (minD === dMinU) targetU = f.minU - furnPad - 0.005;
          else if (minD === dMaxU) targetU = f.maxU + furnPad + 0.005;
          else if (minD === dMinV) targetV = f.minV - furnPad - 0.005;
          else targetV = f.maxV + furnPad + 0.005;
        }

        const nextX = targetU * f.ux + targetV * vx;
        const nextZ = targetU * f.uz + targetV * vz;
        const pushDir = new THREE.Vector3(nextX - this.footPos.x, 0, nextZ - this.footPos.z);
        const pushLen = pushDir.length();
        if (pushLen > 1e-4) {
          pushDir.divideScalar(pushLen);
          if (!this.isBlockedByWallOrCabinet(this.footPos, pushDir, pushLen)) {
            this.footPos.x = nextX;
            this.footPos.z = nextZ;
            pushed = true;
          }
        }
      }
      if (!pushed) break;
    }
  }

  private ensureFootPositionUnblocked(): void {
    this.depenetrateFootPosition();
    const cardinals = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, -1),
    ];
    const blockedCount = cardinals.filter((dir) =>
      this.isBlockedByWallOrCabinet(this.footPos, dir, 0.32)
    ).length;
    if (blockedCount >= 2) {
      // Snap to nearest known-clear room spawn point on the closest floor
      let bestSpawn = DEFAULT_WALKTHROUGH_SPAWNS[0];
      let bestScore = Number.POSITIVE_INFINITY;
      for (const sp of DEFAULT_WALKTHROUGH_SPAWNS) {
        const dx = sp.position[0] - this.footPos.x;
        const dy = (sp.position[1] - this.footPos.y) * 2.5;
        const dz = sp.position[2] - this.footPos.z;
        const score = dx * dx + dy * dy + dz * dz;
        if (score < bestScore) {
          bestScore = score;
          bestSpawn = sp;
        }
      }
      this.footPos.set(
        bestSpawn.position[0],
        bestSpawn.position[1],
        bestSpawn.position[2]
      );
      this.footPos.y = this.sampleFloorElevation(
        this.footPos.x,
        this.footPos.y,
        this.footPos.z
      );
    }
  }

  public enter(
    currentPose: SceneCameraPoseSnapshot,
    spawnOverride?: {
      readonly position: readonly [number, number, number];
      readonly yawDeg?: number;
    }
  ): void {
    if (!this.active) {
      this.savedOrbitState = {
        pose: currentPose,
        fov: this.rig.perspCamera.fov,
      };
    }

    this.blurActiveControlIfNeeded();

    this.active = true;
    this.crouched = false;
    this.verticalVelocity = 0;
    this.jumpOffsetY = 0;
    this.currentEyeHeight = STANDING_EYE_HEIGHT;
    this.currentFov = this.baseFov;
    this.glideTargetFoot = null;
    this.lookDirty = false;
    this.keysDown.clear();

    this.rig.useCamera(false);
    this.rig.controls.enabled = false;
    this.rig.perspCamera.fov = this.baseFov;
    this.rig.perspCamera.near = 0.06;
    this.rig.perspCamera.updateProjectionMatrix();

    if (spawnOverride) {
      this.footPos.set(
        spawnOverride.position[0],
        spawnOverride.position[1],
        spawnOverride.position[2]
      );
      const sampledY = this.sampleFloorElevation(
        this.footPos.x,
        this.footPos.y,
        this.footPos.z
      );
      this.footPos.y = sampledY;
      this.yawRad = THREE.MathUtils.degToRad(spawnOverride.yawDeg ?? 0);
      this.pitchRad = -0.03;
      this.depenetrateFootPosition();
    } else {
      // Determine whether the current orbit target or camera is inside a room
      const [tx, ty, tz] = currentPose.target;
      const [cx, , cz] = currentPose.position;
      const roomMinY = this.getRoomMinYAt(tx, ty, tz);
      if (roomMinY !== null && Math.hypot(cx - tx, cz - tz) < 18.0) {
        const dirX = tx - cx;
        const dirZ = tz - cz;
        const distXZ = Math.hypot(dirX, dirZ);
        const spawnX = distXZ > 0.5 ? tx - (dirX / distXZ) * Math.min(1.4, distXZ * 0.4) : tx;
        const spawnZ = distXZ > 0.5 ? tz - (dirZ / distXZ) * Math.min(1.4, distXZ * 0.4) : tz;
        const baseFloorY = this.getRoomMinYAt(spawnX, ty, spawnZ) ?? roomMinY;
        const sampledY = this.sampleFloorElevation(spawnX, baseFloorY, spawnZ);
        this.footPos.set(spawnX, sampledY, spawnZ);
        this.yawRad = Math.atan2(-dirX, -dirZ);
        this.pitchRad = -0.04;
        this.ensureFootPositionUnblocked();
      } else {
        const def = DEFAULT_WALKTHROUGH_SPAWNS[0];
        this.footPos.set(def.position[0], def.position[1], def.position[2]);
        this.yawRad = THREE.MathUtils.degToRad(def.yawDeg);
        this.pitchRad = -0.03;
      }
    }
    this.targetYawRad = this.yawRad;
    this.targetPitchRad = this.pitchRad;

    this.syncCameraFromFootAndAngles(0);
    this.refreshTargetedInteractable(true);
    this.onStateChanged(true);
    this.onPoseUpdated();
    this.saveSessionState(true);
    this.emit();
  }

  public exit(): SceneCameraPoseSnapshot | null {
    if (!this.active) return null;
    this.active = false;
    this.keysDown.clear();
    this.glideTargetFoot = null;
    this.isDraggingLook = false;
    this.lookDirty = false;
    this.targetedMesh = null;
    this.targetedPrompt = null;
    this.verticalVelocity = 0;
    this.jumpOffsetY = 0;

    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock?.();
    }

    const saved = this.savedOrbitState;
    this.rig.perspCamera.fov = saved?.fov ?? 42;
    this.rig.perspCamera.near = 0.15;
    this.rig.perspCamera.updateProjectionMatrix();
    this.rig.controls.enabled = true;

    this.onStateChanged(false);
    this.saveSessionState(true);
    this.emit();
    return saved?.pose ?? null;
  }

  public teleportToSpawn(spawnId: string): boolean {
    const sp = DEFAULT_WALKTHROUGH_SPAWNS.find((s) => s.id === spawnId);
    if (!sp) return false;
    this.blurActiveControlIfNeeded();
    this.glideTargetFoot = null;
    this.verticalVelocity = 0;
    this.jumpOffsetY = 0;
    this.footPos.set(sp.position[0], sp.position[1], sp.position[2]);
    this.footPos.y = this.sampleFloorElevation(
      this.footPos.x,
      this.footPos.y,
      this.footPos.z
    );
    this.depenetrateFootPosition();
    this.yawRad = THREE.MathUtils.degToRad(sp.yawDeg);
    this.pitchRad = -0.03;
    this.targetYawRad = this.yawRad;
    this.targetPitchRad = this.pitchRad;
    this.syncCameraFromFootAndAngles(0);
    this.refreshTargetedInteractable(true);
    this.onPoseUpdated();
    this.saveSessionState(true);
    this.emit();
    return true;
  }

  public glideToWorldPoint(point: THREE.Vector3): void {
    if (!this.active) return;
    const targetFloorY = this.sampleFloorElevation(point.x, point.y, point.z);
    this.glideTargetFoot = new THREE.Vector3(point.x, targetFloorY, point.z);
    const dx = point.x - this.footPos.x;
    const dz = point.z - this.footPos.z;
    if (Math.hypot(dx, dz) > 0.25) {
      this.yawRad = Math.atan2(-dx, -dz);
      this.targetYawRad = this.yawRad;
    }
  }

  private refreshTargetedInteractable(force = false): void {
    if (!this.active) return;
    const now = performance.now();
    if (!force && now - this.lastRaycastMs < 90) return;
    this.lastRaycastMs = now;

    const cam = this.rig.perspCamera;
    this.interactRaycaster.setFromCamera(this.centerNdc, cam);

    const hits = this.interactRaycaster.intersectObjects(
      this.getInteractiveMeshes() as THREE.Object3D[],
      false
    );
    const firstHit = hits.find(
      (h) => h.distance <= INTERACT_MAX_DISTANCE && isObjectVisibleInHierarchy(h.object)
    );

    const nextMesh = firstHit?.object ?? null;
    const nextPrompt = nextMesh ? this.describeInteractable(nextMesh) : null;

    if (nextMesh !== this.targetedMesh || nextPrompt !== this.targetedPrompt) {
      this.targetedMesh = nextMesh;
      this.targetedPrompt = nextPrompt;
      this.emit();
    }
  }

  private sampleFloorElevation(x: number, refFootY: number, z: number): number {
    const { ewX, ewZ } = worldToEastWingLocal(x, z);

    // 1. Main Hall Quarter-Turn Staircase (smooth continuous analytical elevation Up & Down)
    // 1a. Upper Flight (climbing East +X along the North wall from X = -16.64m at Y = 0.84m to X = -15.36m at Y = 2.16m)
    if (
      ewX >= -16.64 &&
      ewX <= -15.26 &&
      ewZ >= -2.55 &&
      ewZ <= -1.58 &&
      refFootY >= 0.35
    ) {
      const tUpper = THREE.MathUtils.clamp(
        (ewX - -16.64) / (-15.36 - -16.64),
        0,
        1
      );
      return 0.84 + tUpper * (2.16 - 0.84);
    }

    // 1b. Quarter-Turn Landing (X = -17.58m..-16.58m, Z = -2.55m..-1.62m at Y = +0.84m)
    if (
      ewX >= -17.58 &&
      ewX <= -16.58 &&
      ewZ >= -2.55 &&
      ewZ <= -1.62 &&
      refFootY >= 0.15 &&
      refFootY <= 1.65
    ) {
      return 0.84;
    }

    // 1c. Lower Flight (climbing North -Z along the West wall from Z = -0.32m at Y = -0.30m to Z = -1.62m at Y = +0.84m)
    if (
      ewX >= -17.58 &&
      ewX <= -16.58 &&
      ewZ >= -1.62 &&
      ewZ <= -0.24 &&
      refFootY <= 1.55
    ) {
      const tLower = THREE.MathUtils.clamp(
        (-0.32 - ewZ) / (-0.32 - -1.62),
        0,
        1
      );
      return -0.3 + tLower * (0.84 - -0.3);
    }

    // 2. First Floor Rooms & Doorways (strictly bounded to the actual First Floor footprint
    //    so you can NEVER float on an invisible 2.16m platform over the Courtyard or single-storey Kitchen!)
    const inEastWingFirstFloor =
      ewX >= -17.85 && ewX <= -4.4 && ewZ >= -2.75 && ewZ <= 2.45;
    const inWestWingFirstFloor =
      x >= -22.5 && x <= -16.88 && z >= -3.25 && z <= 11.75;
    if (refFootY >= 1.65 && (inEastWingFirstFloor || inWestWingFirstFloor)) {
      return inEastWingFirstFloor ? 2.16 : 2.08;
    }

    // 3. Ground Floor East Wing (Kitchen +0.05m -> Dining Room 0.00m -> Boot Lobby & Main Hall -0.30m)
    if (ewX >= -17.62 && ewX <= 4.35 && ewZ >= -2.85 && ewZ <= 2.62) {
      if (ewX >= -4.45) return 0.05;
      if (ewX >= -4.68) {
        return THREE.MathUtils.lerp(0.0, 0.05, (ewX - -4.68) / 0.23);
      }
      if (ewX >= -9.58) return 0.0;
      if (ewX >= -9.8) {
        return THREE.MathUtils.lerp(-0.3, 0.0, (ewX - -9.8) / 0.22);
      }
      return -0.3;
    }

    // 4. Ground Floor West Wing (Living Room, Front Entrance Hall, Sitting Room, Study, Plant Room at -0.60m)
    if (x <= -17.05 && z <= 11.8) {
      if (x >= -17.75 && z >= -2.55 && z <= 2.65) {
        return THREE.MathUtils.lerp(-0.6, -0.3, (x - -17.75) / 0.6);
      }
      return -0.6;
    }

    // 5. Outdoor Courtyard, Raised Limestone Terrace & Grounds (continuous graded courtyard elevation)
    const northZ = 2.61 - (x - -16.92) * (0.705 / 5.27) - 0.05;
    const tx = Math.max(0, Math.min(1, (-4.52 - x) / 11.43));
    const smoothTx = 0.55 * tx + 0.45 * tx * tx * (3 - 2 * tx);

    const northTx = Math.max(0, Math.min(1, (-8.2 - x) / 6.8));
    const smoothNorthTx = northTx * northTx * (3 - 2 * northTx);

    const tz = Math.max(
      0,
      Math.min(1, (z - northZ) / Math.max(1.0, 8.65 - northZ))
    );
    const smoothTz = 0.5 * tz + 0.5 * tz * tz * (3 - 2 * tz);

    const westEdgeY = -0.3 * smoothNorthTx * (1 - smoothTz) - 0.6 * smoothTz;
    const westDrop = westEdgeY * smoothTx;

    const seStartZ = northZ + 4.35;
    const seTz = Math.max(0, Math.min(1, (z - seStartZ) / 9.0));
    const smoothSeTz = seTz * seTz * (3 - 2 * seTz);
    const eastDrop = -0.18 * (1 - smoothTx) * smoothSeTz;

    return westDrop + eastDrop;
  }

  /**
   * Lazily indexes structural BoxGeometry obstacles (walls, closed doors, and cabinet panels)
   * plus 2D Oriented Bounding Box furniture colliders (tables, sofas, chairs, beds, islands,
   * worktops, baths, and appliances) once so walkthrough collision runs in < 0.03ms/frame.
   */
  private getObstacleCache(): readonly CachedObstacle[] {
    if (this.cachedObstacles !== null) {
      return this.cachedObstacles;
    }
    const list: CachedObstacle[] = [];
    const furnitureList: CachedFurnitureBox[] = [];
    const rebuildFurniture = this.cachedFurnitureBoxes.length === 0;
    this.scene.updateMatrixWorld(true);

    this.scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      if (obj.geometry instanceof THREE.PlaneGeometry) return;
      if (obj.userData?.isAnnotationGroup || obj.userData?.circuitId) return;
      if (
        typeof obj.name === 'string' &&
        (obj.name.startsWith('hall.stairs') || obj.name.includes('cobblePath'))
      ) {
        return;
      }

      // Check ancestor chain for ceiling/roof groups, UFH overlays, architectural shell groups, or dynamic door/bifold pivots
      const isDynamicObject = (node: THREE.Object3D): boolean => {
        const u = node.userData as Record<string, unknown> | undefined;
        if (
          typeof u?.interactableId === 'string' ||
          u?.isBifoldDoor === true ||
          u?.isCarGate === true
        ) {
          return true;
        }
        return typeof node.name === 'string' && /bifold|doorPivot/i.test(node.name);
      };
      let hasDynamicAncestor = isDynamicObject(obj);
      let hasArchitecturalShellAncestor =
        obj.userData?.isArchitecturalShell === true ||
        obj.userData?.isCutawayWall === true ||
        Boolean(obj.userData?.cutawayWall);
      let skipGroup = false;
      let cur: THREE.Object3D | null = obj.parent;
      while (cur && cur !== this.scene) {
        if (cur.userData?.isAnnotationGroup || cur.userData?.ufhZoneId) {
          skipGroup = true;
          break;
        }
        if (
          typeof cur.name === 'string' &&
          (cur.name.endsWith('.groundCeiling') ||
            cur.name.endsWith('.roof') ||
            cur.name.startsWith('hall.stairs') ||
            cur.name.includes('ufh'))
        ) {
          skipGroup = true;
          break;
        }
        if (
          cur.userData?.isArchitecturalShell === true ||
          cur.userData?.isCutawayWall === true ||
          Boolean(cur.userData?.cutawayWall)
        ) {
          hasArchitecturalShellAncestor = true;
        }
        if (isDynamicObject(cur)) {
          hasDynamicAncestor = true;
        }
        cur = cur.parent;
      }
      if (skipGroup) return;

      this.tmpBox.setFromObject(obj);
      if (this.tmpBox.isEmpty()) return;

      const sizeX = this.tmpBox.max.x - this.tmpBox.min.x;
      const sizeY = this.tmpBox.max.y - this.tmpBox.min.y;
      const sizeZ = this.tmpBox.max.z - this.tmpBox.min.z;
      const centerX = (this.tmpBox.min.x + this.tmpBox.max.x) * 0.5;
      const centerZ = (this.tmpBox.min.z + this.tmpBox.max.z) * 0.5;
      const radiusXZ = Math.hypot(sizeX, sizeZ) * 0.5;

      // 1. Vertical structural walls (including multi-material USDA BufferGeometry walls in cutawayWallGroups,
      //    mitered polyline canted bay walls/windows, and bevelled RoundedBoxGeometry meshes),
      //    window frames/upstands/stiles/mullions, Roman blinds & curtains, all interior/exterior doors
      //    (including 28mm panelled doors and 12-16mm glazed courtyard/bifold doors), and tall cabinetry:
      const isBlindOrCurtain =
        typeof obj.name === 'string' && /romanBlind|curtain/i.test(obj.name);
      const isWindowGlass =
        !hasDynamicAncestor &&
        (Array.isArray(obj.material)
          ? obj.material.some(
              (m) =>
                Boolean((m as THREE.Material & { transparent?: boolean }).transparent) &&
                ((m as THREE.Material & { opacity?: number }).opacity ?? 1) <= 0.5
            )
          : Boolean(
              (obj.material as THREE.Material & { transparent?: boolean })?.transparent &&
                ((obj.material as THREE.Material & { opacity?: number })?.opacity ?? 1) <= 0.5
            )) &&
        sizeY >= 0.45 &&
        Math.min(sizeX, sizeZ) <= 0.16 &&
        Math.max(sizeX, sizeZ) >= 0.35;
      const isBoxOrShellWall =
        isBlindOrCurtain ||
        obj.geometry instanceof THREE.BoxGeometry ||
        hasArchitecturalShellAncestor ||
        (!(obj.geometry instanceof THREE.CylinderGeometry) &&
          !(obj.geometry instanceof THREE.SphereGeometry) &&
          !(obj.geometry instanceof THREE.ConeGeometry) &&
          !(obj.geometry instanceof THREE.TubeGeometry) &&
          !(obj.geometry instanceof THREE.RingGeometry) &&
          !(obj.geometry instanceof THREE.TorusGeometry));
      if (
        isBoxOrShellWall &&
        (sizeY >= 0.45 || (isBlindOrCurtain && sizeY >= 0.25)) &&
        (Math.max(sizeX, sizeZ) >= 0.32 ||
          (sizeY >= 0.85 && Math.max(sizeX, sizeZ) >= 0.04)) &&
        Math.min(sizeX, sizeZ) >= 0.008 &&
        Math.max(sizeX, sizeZ) <= 28.0
      ) {
        list.push({
          mesh: obj,
          centerX,
          centerZ,
          radiusXZ,
          minY: this.tmpBox.min.y,
          maxY: this.tmpBox.max.y,
          isDynamic: hasDynamicAncestor,
        });
      }

      // 2. 2D Oriented Bounding Box (OBB) Furniture, Cabinetry, Window Recess & Blind/Curtain Colliders:
      //    Catches dining tables, desks, coffee tables, sofas (including sculpted BufferGeometry
      //    cushions), armchairs, dining chairs, beds, kitchen island & worktops, sideboards,
      //    bathtubs, vanities, WCs, tall pantry/wardrobe units, Roman blinds, curtains, and window glass recesses.
      if (rebuildFurniture && !hasDynamicAncestor && Math.max(sizeX, sizeZ) <= 5.5) {
        const floorY = this.sampleFloorElevation(centerX, this.tmpBox.max.y, centerZ);
        const topAboveFloor = this.tmpBox.max.y - floorY;
        const botAboveFloor = this.tmpBox.min.y - floorY;

        if (
          topAboveFloor >= 0.34 &&
          topAboveFloor <= 2.32 &&
          botAboveFloor <= 1.65
        ) {
          if (!obj.geometry.boundingBox) {
            obj.geometry.computeBoundingBox();
          }
          const localBox = obj.geometry.boundingBox;
          if (localBox && !localBox.isEmpty()) {
            const m = obj.matrixWorld.elements;
            // Extract primary horizontal unit axis (ux, uz) from mesh world matrix
            const axX = m[0];
            const axZ = m[2];
            const azX = m[8];
            const azZ = m[10];
            const lenAx = Math.hypot(axX, axZ);
            const lenAz = Math.hypot(azX, azZ);
            let ux = 1;
            let uz = 0;
            if (lenAx >= lenAz && lenAx > 1e-4) {
              ux = axX / lenAx;
              uz = axZ / lenAx;
            } else if (lenAz > 1e-4) {
              ux = azX / lenAz;
              uz = azZ / lenAz;
            }
            const vx = -uz;
            const vz = ux;

            let minU = Number.POSITIVE_INFINITY;
            let maxU = Number.NEGATIVE_INFINITY;
            let minV = Number.POSITIVE_INFINITY;
            let maxV = Number.NEGATIVE_INFINITY;

            for (let cxIdx = 0; cxIdx < 2; cxIdx++) {
              const lx = cxIdx === 0 ? localBox.min.x : localBox.max.x;
              for (let cyIdx = 0; cyIdx < 2; cyIdx++) {
                const ly = cyIdx === 0 ? localBox.min.y : localBox.max.y;
                for (let czIdx = 0; czIdx < 2; czIdx++) {
                  const lz = czIdx === 0 ? localBox.min.z : localBox.max.z;
                  this.tmpCorner.set(lx, ly, lz).applyMatrix4(obj.matrixWorld);
                  const u = this.tmpCorner.x * ux + this.tmpCorner.z * uz;
                  const v = this.tmpCorner.x * vx + this.tmpCorner.z * vz;
                  if (u < minU) minU = u;
                  if (u > maxU) maxU = u;
                  if (v < minV) minV = v;
                  if (v > maxV) maxV = v;
                }
              }
            }

            let uSpan = maxU - minU;
            let vSpan = maxV - minV;
            // Inflate thin depth axis of Roman blinds, curtains, and fixed window glass panes
            // so the camera can never enter the 14cm window reveal or clip inside window blinds.
            if (isBlindOrCurtain || isWindowGlass) {
              const padDepth = isWindowGlass ? 0.15 : 0.1;
              if (uSpan < vSpan) {
                minU -= padDepth;
                maxU += padDepth;
                uSpan = maxU - minU;
              } else {
                minV -= padDepth;
                maxV += padDepth;
                vSpan = maxV - minV;
              }
            }

            const validDimensions =
              isBlindOrCurtain || isWindowGlass
                ? Math.max(uSpan, vSpan) >= 0.32 && Math.max(uSpan, vSpan) <= 5.2
                : Math.min(uSpan, vSpan) >= 0.29 &&
                  Math.max(uSpan, vSpan) >= 0.36 &&
                  Math.max(uSpan, vSpan) <= 5.2;

            if (validDimensions) {
              furnitureList.push({
                mesh: obj,
                visibilityNode: obj.parent ?? obj,
                centerX,
                centerZ,
                radiusXZ: Math.max(radiusXZ, Math.hypot(uSpan, vSpan) * 0.5),
                minY: this.tmpBox.min.y,
                maxY: this.tmpBox.max.y,
                ux,
                uz,
                minU,
                maxU,
                minV,
                maxV,
              });
            }
          }
        }
      }
    });

    this.cachedObstacles = list;
    if (rebuildFurniture) {
      this.cachedFurnitureBoxes = furnitureList;
    }
    return list;
  }

  private isBlockedByWallOrCabinet(
    fromFoot: THREE.Vector3,
    moveDirXZ: THREE.Vector3,
    stepDist: number
  ): boolean {
    const nextX = fromFoot.x + moveDirXZ.x * stepDist;
    const nextZ = fromFoot.z + moveDirXZ.z * stepDist;
    const curEw = worldToEastWingLocal(fromFoot.x, fromFoot.z);
    const nextEw = worldToEastWingLocal(nextX, nextZ);

    // 1. First Floor Landing gallery balustrade guardrail around the stairwell void
    //    Allows free entry/exit onto the Upper Flight at ewX = -15.36, ewZ in [-2.48, -1.65]
    if (
      fromFoot.y >= 1.85 &&
      nextEw.ewX >= -17.58 &&
      nextEw.ewX <= -15.34 &&
      nextEw.ewZ >= -1.64 &&
      nextEw.ewZ <= -0.54
    ) {
      return true;
    }

    // 2. Clean 2D corridor & balustrade bounds when walking UP or DOWN the Main Hall staircase
    //    (prevents horizontal raycasts from ever snagging on stair risers, stringers, or slab edges)
    const onUpperFlightOrMouth =
      fromFoot.y >= 0.65 &&
      curEw.ewX >= -16.68 &&
      curEw.ewX <= -15.05 &&
      curEw.ewZ >= -2.52 &&
      curEw.ewZ <= -1.58;
    const onQuarterLanding =
      fromFoot.y >= 0.25 &&
      fromFoot.y <= 1.55 &&
      curEw.ewX >= -17.55 &&
      curEw.ewX <= -16.55 &&
      curEw.ewZ >= -2.52 &&
      curEw.ewZ <= -1.55;
    const onLowerFlight =
      fromFoot.y <= 1.35 &&
      curEw.ewX >= -17.55 &&
      curEw.ewX <= -16.58 &&
      curEw.ewZ >= -1.65 &&
      curEw.ewZ <= -0.15;

    if (onUpperFlightOrMouth || onQuarterLanding || onLowerFlight) {
      if (nextEw.ewZ < -2.22) return true; // North brick wall + Roman blind clearance
      if (nextEw.ewX < -17.28) return true; // West cross-wall clearance
      if (
        fromFoot.y >= 0.72 &&
        nextEw.ewX > -16.58 &&
        nextEw.ewX < -15.36 &&
        nextEw.ewZ > -1.69
      ) {
        return true; // Upper flight South balustrade
      }
      if (
        fromFoot.y <= 1.35 &&
        nextEw.ewZ > -1.58 &&
        nextEw.ewZ < -0.35 &&
        nextEw.ewX > -16.68
      ) {
        return true; // Lower flight East balustrade
      }
      return false;
    }

    // 2b. Ground-floor West Canted Bay Windows (Living Room at Z = -0.26m, Sitting Room at Z = 5.92m)
    //     Enforces the exact 3-sided canted bay geometry (wallInnerX = -22.19m, bayInnerFrontX = -22.52m,
    //     frontHalfZ = 0.62m, bayHalfZ = 1.08m) plus the central cast-iron bay radiator (X = -22.32m)
    if (fromFoot.y <= 0.5 && fromFoot.x >= -22.68 && fromFoot.x <= -21.75) {
      for (const bayCenterZ of [-0.26, 5.92] as const) {
        const curDz = Math.abs(fromFoot.z - bayCenterZ);
        const nextDz = Math.abs(nextZ - bayCenterZ);
        if (nextDz <= 1.14 || curDz <= 1.14) {
          const bayWallInnerX =
            nextDz <= 0.62
              ? -22.52
              : nextDz <= 1.08
                ? -22.52 + ((nextDz - 0.62) / 0.46) * (-22.19 - -22.52)
                : -22.19;
          const minAllowedX =
            nextDz <= 0.68
              ? Math.max(bayWallInnerX + 0.22, -22.16)
              : bayWallInnerX + 0.22;
          if (
            nextX < minAllowedX &&
            (nextX < fromFoot.x || (nextDz > curDz && fromFoot.x < -21.97))
          ) {
            return true;
          }
        }
      }
    }

    const obstacles = this.getObstacleCache();

    // 3. Fast 2D Oriented Bounding Box (OBB) collision against furniture, tables, sofas, beds, islands, worktops, window recesses & blinds
    const furnMinY = fromFoot.y + 0.25;
    const furnMaxY =
      fromFoot.y + Math.max(this.currentEyeHeight, STANDING_EYE_HEIGHT) + 0.15;
    const furnPad = 0.2;
    const furnPadSq = furnPad * furnPad;
    const furnReach = stepDist + furnPad + 0.25;

    for (let i = 0; i < this.cachedFurnitureBoxes.length; i++) {
      const f = this.cachedFurnitureBoxes[i];
      if (f.maxY <= furnMinY || f.minY >= furnMaxY) continue;
      const dx = f.centerX - fromFoot.x;
      const dz = f.centerZ - fromFoot.z;
      const maxDist = f.radiusXZ + furnReach;
      if (dx * dx + dz * dz > maxDist * maxDist) continue;
      const visTarget = f.mesh.parent ? f.mesh : f.visibilityNode;
      if (!isObjectVisibleInHierarchy(visTarget)) continue;

      const vx = -f.uz;
      const vz = f.ux;
      const curU = fromFoot.x * f.ux + fromFoot.z * f.uz;
      const curV = fromFoot.x * vx + fromFoot.z * vz;
      const nextU = nextX * f.ux + nextZ * f.uz;
      const nextV = nextX * vx + nextZ * vz;

      const curDu = curU < f.minU ? f.minU - curU : curU > f.maxU ? curU - f.maxU : 0;
      const curDv = curV < f.minV ? f.minV - curV : curV > f.maxV ? curV - f.maxV : 0;
      const curDistSq = curDu * curDu + curDv * curDv;

      const nextDu = nextU < f.minU ? f.minU - nextU : nextU > f.maxU ? nextU - f.maxU : 0;
      const nextDv = nextV < f.minV ? f.minV - nextV : nextV > f.maxV ? nextV - f.maxV : 0;
      const nextDistSq = nextDu * nextDu + nextDv * nextDv;

      if (nextDistSq < furnPadSq) {
        if (curDistSq >= furnPadSq || nextDistSq < curDistSq - 1e-5) {
          return true;
        }
        if (curDistSq === 0) {
          const midU = (f.minU + f.maxU) * 0.5;
          const midV = (f.minV + f.maxV) * 0.5;
          const curCenterSq = (curU - midU) ** 2 + (curV - midV) ** 2;
          const nextCenterSq = (nextU - midU) ** 2 + (nextV - midV) ** 2;
          if (nextCenterSq < curCenterSq) {
            return true;
          }
        }
      }
    }

    // 4. Fast spatial-filtered multi-height & shoulder-width raycast against structural walls, window frames, blinds, doors & cabinetry
    this.nearbyObstacleMeshes.length = 0;
    const footMinY = fromFoot.y + 0.3;
    const footMaxY =
      fromFoot.y + Math.max(this.currentEyeHeight, STANDING_EYE_HEIGHT) + 0.18;
    const reach = stepDist + 0.72;

    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      if (!isObjectVisibleInHierarchy(obs.mesh)) continue;
      if (obs.isDynamic) {
        this.tmpBox.setFromObject(obs.mesh);
        obs.centerX = (this.tmpBox.min.x + this.tmpBox.max.x) * 0.5;
        obs.centerZ = (this.tmpBox.min.z + this.tmpBox.max.z) * 0.5;
        obs.minY = this.tmpBox.min.y;
        obs.maxY = this.tmpBox.max.y;
      }
      if (obs.maxY <= footMinY || obs.minY >= footMaxY) continue;
      const dx = obs.centerX - fromFoot.x;
      const dz = obs.centerZ - fromFoot.z;
      const maxDist = obs.radiusXZ + reach;
      if (dx * dx + dz * dz <= maxDist * maxDist) {
        this.nearbyObstacleMeshes.push(obs.mesh);
      }
    }

    if (this.nearbyObstacleMeshes.length === 0) {
      return false;
    }

    const backOff = 0.08;
    const maxHitDist = stepDist + 0.34 + backOff;
    this.wallRaycaster.far = Math.max(0.42, maxHitDist + 0.04);
    const perpX = -moveDirXZ.z;
    const perpZ = moveDirXZ.x;

    // Cast at knee (+0.45m), waist (+0.95m), chest (+1.35m), and eye height (currentEyeHeight),
    // with center and ±0.15m shoulder rays backed off by 0.08m so thin window frames, blinds, and stiles cannot be clipped into
    for (const rayOffsetY of [0.45, 0.95, 1.35, this.currentEyeHeight] as const) {
      for (const latOffset of [0, -0.15, 0.15] as const) {
        this.tmpOrigin.set(
          fromFoot.x + perpX * latOffset - moveDirXZ.x * backOff,
          fromFoot.y + rayOffsetY,
          fromFoot.z + perpZ * latOffset - moveDirXZ.z * backOff
        );
        this.wallRaycaster.set(this.tmpOrigin, moveDirXZ);

        const hits = this.wallRaycaster.intersectObjects(this.nearbyObstacleMeshes, false);
        for (let i = 0; i < hits.length; i++) {
          const hit = hits[i];
          if (hit.distance >= 0.01 && hit.distance <= maxHitDist && hit.face) {
            let curObj: THREE.Object3D | null = hit.object;
            let interactableId: string | undefined;
            while (curObj && curObj !== this.scene) {
              const uid = (curObj.userData as Record<string, unknown> | undefined)?.interactableId;
              if (typeof uid === 'string') {
                interactableId = uid;
                break;
              }
              curObj = curObj.parent;
            }
            if (
              this.allowDoorBarge &&
              interactableId &&
              this.onBargeWalkthroughDoor(
                interactableId,
                this.isCurrentlySprinting,
                fromFoot.x,
                fromFoot.y,
                fromFoot.z,
                moveDirXZ.x,
                moveDirXZ.z
              )
            ) {
              // Call-of-Duty style: running through a walk-through doorway flings it open without blocking!
              this.refreshTargetedInteractable(true);
              continue;
            }
            this.tmpNormal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
            // Block any front-facing vertical wall/door/blind opposing our movement direction
            // (using -0.01 instead of -0.15 so 7.62° East Wing wall-sliding never slips through walls!)
            if (
              Math.abs(this.tmpNormal.y) < 0.45 &&
              this.tmpNormal.dot(moveDirXZ) < -0.01
            ) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  private syncCameraFromFootAndAngles(bobOffsetY: number): void {
    const cam = this.rig.perspCamera;
    const eyeY =
      this.footPos.y + this.currentEyeHeight + this.jumpOffsetY + bobOffsetY;
    cam.position.set(this.footPos.x, eyeY, this.footPos.z);

    const cosPitch = Math.cos(this.pitchRad);
    const sinPitch = Math.sin(this.pitchRad);
    const lookDirX = -Math.sin(this.yawRad) * cosPitch;
    const lookDirY = sinPitch;
    const lookDirZ = -Math.cos(this.yawRad) * cosPitch;

    const lookDistance = 2.2;
    this.rig.controls.target.set(
      cam.position.x + lookDirX * lookDistance,
      cam.position.y + lookDirY * lookDistance,
      cam.position.z + lookDirZ * lookDistance
    );
    cam.lookAt(this.rig.controls.target);
    cam.updateMatrixWorld();
  }

  public update(dtSeconds: number): boolean {
    if (dtSeconds > 0.0005 && dtSeconds < 0.25) {
      const instFps = 1 / dtSeconds;
      this.smoothedFps = this.smoothedFps * 0.9 + instFps * 0.1;
    }

    if (!this.active) return false;

    let movedOrRotated = false;

    if (this.lookDirty) {
      this.lookDirty = false;
      movedOrRotated = true;
    }

    // 1. Sub-frame exponential look smoothing (decouples bursty mouse packets from display refresh)
    const yawDiff = this.targetYawRad - this.yawRad;
    const pitchDiff = this.targetPitchRad - this.pitchRad;
    if (Math.abs(yawDiff) > 1e-5 || Math.abs(pitchDiff) > 1e-5) {
      const lookAlpha = 1 - Math.exp(-48 * dtSeconds);
      this.yawRad =
        Math.abs(yawDiff) <= 1e-4
          ? this.targetYawRad
          : THREE.MathUtils.lerp(this.yawRad, this.targetYawRad, lookAlpha);
      this.pitchRad =
        Math.abs(pitchDiff) <= 1e-4
          ? this.targetPitchRad
          : THREE.MathUtils.lerp(this.pitchRad, this.targetPitchRad, lookAlpha);
      movedOrRotated = true;
    }

    // 1b. Smoothly interpolate eye height (standing vs crouched)
    const targetEyeH = this.crouched ? CROUCH_EYE_HEIGHT : STANDING_EYE_HEIGHT;
    if (Math.abs(this.currentEyeHeight - targetEyeH) > 1e-3) {
      this.currentEyeHeight = THREE.MathUtils.lerp(
        this.currentEyeHeight,
        targetEyeH,
        1 - Math.exp(-14 * dtSeconds)
      );
      movedOrRotated = true;
    }

    // 2. Jump & gravity physics
    if (this.jumpOffsetY > 0 || this.verticalVelocity !== 0) {
      this.jumpOffsetY += this.verticalVelocity * dtSeconds;
      this.verticalVelocity -= GRAVITY_MPS2 * dtSeconds;
      if (this.jumpOffsetY <= 0) {
        this.jumpOffsetY = 0;
        this.verticalVelocity = 0;
      }
      movedOrRotated = true;
    }

    // 3. Keyboard yaw rotation (Q / E)
    let turnInput = 0;
    if (this.keysDown.has('KeyQ')) turnInput += 1;
    if (this.keysDown.has('KeyE')) turnInput -= 1;
    if (turnInput !== 0) {
      this.targetYawRad += turnInput * KEY_TURN_SPEED_RAD * dtSeconds;
      movedOrRotated = true;
    }

    // 4. WASD / Arrow movement
    let forwardInput = 0;
    let strafeInput = 0;
    if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) forwardInput += 1;
    if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) forwardInput -= 1;
    if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) strafeInput += 1;
    if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) strafeInput -= 1;

    const isMoving = forwardInput !== 0 || strafeInput !== 0;
    const isSprinting =
      isMoving &&
      !this.crouched &&
      (this.keysDown.has('ShiftLeft') || this.keysDown.has('ShiftRight'));
    this.isCurrentlySprinting = isSprinting;
    const speed = this.crouched
      ? CROUCH_SPEED_MPS
      : isSprinting
        ? SPRINT_SPEED_MPS
        : WALK_SPEED_MPS;

    // Dynamic Call-of-Duty sprint FOV kick
    const targetFov = this.baseFov + (isSprinting ? SPRINT_FOV_BOOST : 0);
    if (Math.abs(this.currentFov - targetFov) > 0.05) {
      this.currentFov = THREE.MathUtils.lerp(
        this.currentFov,
        targetFov,
        1 - Math.exp(-10 * dtSeconds)
      );
      this.rig.perspCamera.fov = this.currentFov;
      this.rig.perspCamera.updateProjectionMatrix();
      movedOrRotated = true;
    }

    if (isMoving) {
      this.glideTargetFoot = null;
      const forwardX = -Math.sin(this.yawRad);
      const forwardZ = -Math.cos(this.yawRad);
      const rightX = Math.cos(this.yawRad);
      const rightZ = -Math.sin(this.yawRad);

      const moveVec = new THREE.Vector3(
        forwardX * forwardInput + rightX * strafeInput,
        0,
        forwardZ * forwardInput + rightZ * strafeInput
      );
      if (moveVec.lengthSq() > 1e-5) {
        moveVec.normalize();
        const stepDist = speed * dtSeconds;

        if (
          this.onProximityBargeDoors(
            this.footPos.x,
            this.footPos.y,
            this.footPos.z,
            moveVec.x,
            moveVec.z,
            isSprinting
          )
        ) {
          this.refreshTargetedInteractable(true);
        }

        this.allowDoorBarge = true;
        const primaryBlocked = this.isBlockedByWallOrCabinet(this.footPos, moveVec, stepDist);
        this.allowDoorBarge = false;
        if (!primaryBlocked) {
          this.footPos.x += moveVec.x * stepDist;
          this.footPos.z += moveVec.z * stepDist;
        } else {
          // Slide along the active wing's orthogonal wall axes (East Wing rotated -7.62° vs West Wing world axes)
          const inEastWing = worldToEastWingLocal(this.footPos.x, this.footPos.z).ewX > -17.65;
          const axisUX = inEastWing ? EW_COS : 1;
          const axisUZ = inEastWing ? -EW_SIN : 0;
          const axisVX = inEastWing ? EW_SIN : 0;
          const axisVZ = inEastWing ? EW_COS : 1;
          const projU = moveVec.x * axisUX + moveVec.z * axisUZ;
          const projV = moveVec.x * axisVX + moveVec.z * axisVZ;
          const slideU = new THREE.Vector3(
            Math.sign(projU) * axisUX,
            0,
            Math.sign(projU) * axisUZ
          );
          const slideV = new THREE.Vector3(
            Math.sign(projV) * axisVX,
            0,
            Math.sign(projV) * axisVZ
          );
          if (
            Math.abs(projU) > 0.1 &&
            !this.isBlockedByWallOrCabinet(
              this.footPos,
              slideU,
              Math.abs(projU) * stepDist
            )
          ) {
            this.footPos.x += slideU.x * Math.abs(projU) * stepDist;
            this.footPos.z += slideU.z * Math.abs(projU) * stepDist;
          } else if (
            Math.abs(projV) > 0.1 &&
            !this.isBlockedByWallOrCabinet(
              this.footPos,
              slideV,
              Math.abs(projV) * stepDist
            )
          ) {
            this.footPos.x += slideV.x * Math.abs(projV) * stepDist;
            this.footPos.z += slideV.z * Math.abs(projV) * stepDist;
          }
        }
        this.depenetrateFootPosition();

        const targetFloorY = this.sampleFloorElevation(
          this.footPos.x,
          this.footPos.y,
          this.footPos.z
        );
        this.footPos.y = THREE.MathUtils.lerp(
          this.footPos.y,
          targetFloorY,
          1 - Math.exp(-15 * dtSeconds)
        );

        this.bobPhase += dtSeconds * (isSprinting ? 13.0 : 9.0);
        movedOrRotated = true;
      }
    } else if (this.glideTargetFoot) {
      const toTarget = new THREE.Vector3(
        this.glideTargetFoot.x - this.footPos.x,
        0,
        this.glideTargetFoot.z - this.footPos.z
      );
      const dist = toTarget.length();
      if (dist < 0.08) {
        this.footPos.copy(this.glideTargetFoot);
        this.glideTargetFoot = null;
      } else {
        toTarget.divideScalar(dist);
        this.onProximityBargeDoors(
          this.footPos.x,
          this.footPos.y,
          this.footPos.z,
          toTarget.x,
          toTarget.z,
          false
        );
        const step = Math.min(dist, WALK_SPEED_MPS * 1.25 * dtSeconds);
        this.allowDoorBarge = true;
        const glideBlocked = this.isBlockedByWallOrCabinet(this.footPos, toTarget, step);
        this.allowDoorBarge = false;
        if (glideBlocked) {
          this.glideTargetFoot = null;
        } else {
          this.footPos.x += toTarget.x * step;
          this.footPos.z += toTarget.z * step;
          const targetFloorY = this.sampleFloorElevation(
            this.footPos.x,
            this.footPos.y,
            this.footPos.z
          );
          this.footPos.y = THREE.MathUtils.lerp(
            this.footPos.y,
            targetFloorY,
            1 - Math.exp(-15 * dtSeconds)
          );
          this.bobPhase += dtSeconds * 8.5;
        }
      }
      movedOrRotated = true;
    } else if (Math.abs(Math.sin(this.bobPhase)) > 0.02) {
      this.bobPhase = 0;
      movedOrRotated = true;
    }

    if (movedOrRotated) {
      const bobOffset =
        (isMoving || this.glideTargetFoot) && this.jumpOffsetY === 0
          ? Math.sin(this.bobPhase) * (isSprinting ? 0.022 : 0.015)
          : 0;
      this.syncCameraFromFootAndAngles(bobOffset);
      this.refreshTargetedInteractable();
      this.onPoseUpdated();
      this.saveSessionState(false);
    }

    return movedOrRotated;
  }

  private bindInputEvents(): void {
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.canvas;
      this.emit();
    });

    this.canvas.addEventListener('pointerdown', (e: PointerEvent) => {
      if (!this.active || e.button !== 0) return;
      this.blurActiveControlIfNeeded();
      if (this.pointerLocked) {
        this.triggerTargetedInteraction();
        return;
      }
      // Call of Duty style: clicking the 3D viewport automatically engages Pointer Lock mouselook!
      try {
        this.canvas.requestPointerLock?.();
      } catch {
        // Fallback to drag look
      }
      this.isDraggingLook = true;
      this.lastDragClientX = e.clientX;
      this.lastDragClientY = e.clientY;
    });

    // Coalesce high-frequency (250-1000Hz) mouse movements into targetYawRad / targetPitchRad
    window.addEventListener(
      'pointermove',
      (e: PointerEvent) => {
        if (!this.active) return;
        if (this.pointerLocked) {
          this.targetYawRad -= e.movementX * MOUSE_SENSITIVITY;
          this.targetPitchRad = THREE.MathUtils.clamp(
            this.targetPitchRad - e.movementY * MOUSE_SENSITIVITY,
            -MAX_PITCH_RAD,
            MAX_PITCH_RAD
          );
          this.lookDirty = true;
          return;
        }
        if (this.isDraggingLook && (e.buttons & 1) !== 0) {
          const dx = e.clientX - this.lastDragClientX;
          const dy = e.clientY - this.lastDragClientY;
          this.lastDragClientX = e.clientX;
          this.lastDragClientY = e.clientY;
          this.targetYawRad -= dx * DRAG_SENSITIVITY;
          this.targetPitchRad = THREE.MathUtils.clamp(
            this.targetPitchRad - dy * DRAG_SENSITIVITY,
            -MAX_PITCH_RAD,
            MAX_PITCH_RAD
          );
          this.lookDirty = true;
        }
      },
      { passive: true }
    );

    window.addEventListener('pointerup', () => {
      this.isDraggingLook = false;
    });

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const tag = activeEl?.tagName ?? '';
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.metaKey || e.altKey) return;

      if (!this.active) return;

      if (tag === 'SELECT' || tag === 'BUTTON') {
        (activeEl as HTMLElement).blur();
      }

      // Press [F] to Interact with looked-at door, cupboard, drawer, AGA lid or KNX switch!
      if (e.code === 'KeyF' && !e.repeat && !e.ctrlKey) {
        e.preventDefault();
        this.triggerTargetedInteraction();
        return;
      }

      // Crouch: C or Left Ctrl
      if ((e.code === 'KeyC' || e.code === 'ControlLeft') && !e.repeat) {
        e.preventDefault();
        this.toggleCrouched();
        return;
      }

      // Jump: Space
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        if (this.crouched) {
          this.setCrouched(false);
        } else if (this.jumpOffsetY <= 0.01) {
          this.verticalVelocity = JUMP_IMPULSE_MPS;
        }
        return;
      }

      if (
        e.code === 'KeyW' ||
        e.code === 'KeyA' ||
        e.code === 'KeyS' ||
        e.code === 'KeyD' ||
        e.code === 'KeyQ' ||
        e.code === 'KeyE' ||
        e.code === 'ArrowUp' ||
        e.code === 'ArrowDown' ||
        e.code === 'ArrowLeft' ||
        e.code === 'ArrowRight' ||
        e.code === 'ShiftLeft' ||
        e.code === 'ShiftRight'
      ) {
        e.preventDefault();
        this.keysDown.add(e.code);
      }
    });

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      this.keysDown.delete(e.code);
    });

    window.addEventListener('blur', () => {
      this.keysDown.clear();
      this.isDraggingLook = false;
    });
  }
}
