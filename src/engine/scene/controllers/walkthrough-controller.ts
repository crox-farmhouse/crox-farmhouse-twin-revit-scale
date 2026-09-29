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
    position: ewSpawnPos(-7.1, -0.95, 1.35),
    yawDeg: -8,
  },
  {
    id: 'hall',
    label: 'Main Hall & Stairs',
    zoneId: 'hall',
    position: ewSpawnPos(-14.8, -0.35, 1.4),
    yawDeg: -8,
  },
  {
    id: 'livingRoom',
    label: 'Living Room',
    zoneId: 'livingRoom',
    position: [-19.4, -0.65, 0.2],
    yawDeg: 45,
  },
  {
    id: 'sittingRoom',
    label: 'Sitting Room',
    zoneId: 'sittingRoom',
    position: [-19.8, -0.65, 5.8],
    yawDeg: 90,
  },
  {
    id: 'study',
    label: 'Study',
    zoneId: 'study',
    position: [-19.6, -0.65, 9.8],
    yawDeg: 180,
  },
  {
    id: 'upperLanding',
    label: '1st Floor Landing',
    zoneId: 'upperLanding',
    position: ewSpawnPos(-15.2, 2.02, 1.1),
    yawDeg: -98,
  },
  {
    id: 'mainBedroom',
    label: 'Main Bedroom',
    zoneId: 'mainBedroom',
    position: ewSpawnPos(-7.2, 2.02, 0.5),
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

const STANDING_EYE_HEIGHT = 1.66;
const CROUCH_EYE_HEIGHT = 1.02;
const WALK_SPEED_MPS = 3.1;
const SPRINT_SPEED_MPS = 5.4;
const KEY_TURN_SPEED_RAD = 1.75;
const MOUSE_SENSITIVITY = 0.0024;
const DRAG_SENSITIVITY = 0.0042;
const MAX_PITCH_RAD = THREE.MathUtils.degToRad(82);
const WALKTHROUGH_FOV = 62;

interface SavedOrbitState {
  readonly pose: SceneCameraPoseSnapshot;
  readonly fov: number;
}

/**
 * First-Person Walkthrough Controller for Crox Farmhouse.
 *
 * Supports:
 * - WASD / Arrow keys movement + Shift sprint + Q/E keyboard turning + C crouch
 * - Both click-and-drag mouselook AND optional Pointer Lock (`requestPointerLock`)
 * - Smooth downward floor/staircase surface raycasting + multi-tier room floor elevation tracking
 * - Subtle head-bob while walking and smooth glide-to-point on double-click
 */
export class WalkthroughController {
  private readonly canvas: HTMLCanvasElement;
  private readonly scene: THREE.Scene;
  private readonly rig: CameraRig;
  private readonly getRoomMinYAt: (x: number, y: number, z: number) => number | null;
  private readonly onStateChanged: (active: boolean) => void;
  private readonly onPoseUpdated: () => void;

  private active = false;
  private crouched = false;
  private pointerLocked = false;
  private isDraggingLook = false;
  private lastDragClientX = 0;
  private lastDragClientY = 0;

  private footPos = new THREE.Vector3(-1.35, 0.05, 1.35);
  private currentEyeHeight = STANDING_EYE_HEIGHT;
  private yawRad = 0; // 0 = looking along -Z
  private pitchRad = 0;
  private bobPhase = 0;

  private glideTargetFoot: THREE.Vector3 | null = null;
  private savedOrbitState: SavedOrbitState | null = null;

  private readonly keysDown = new Set<string>();
  private readonly downRaycaster = new THREE.Raycaster();
  private readonly wallRaycaster = new THREE.Raycaster();
  private readonly listeners = new Set<(active: boolean) => void>();

  public constructor(options: {
    readonly canvas: HTMLCanvasElement;
    readonly scene: THREE.Scene;
    readonly rig: CameraRig;
    readonly getRoomMinYAt: (x: number, y: number, z: number) => number | null;
    readonly onStateChanged: (active: boolean) => void;
    readonly onPoseUpdated: () => void;
  }) {
    this.canvas = options.canvas;
    this.scene = options.scene;
    this.rig = options.rig;
    this.getRoomMinYAt = options.getRoomMinYAt;
    this.onStateChanged = options.onStateChanged;
    this.onPoseUpdated = options.onPoseUpdated;

    this.downRaycaster.near = 0.05;
    this.downRaycaster.far = 4.5;
    this.wallRaycaster.near = 0.02;
    this.wallRaycaster.far = 0.55;

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
    this.emit();
  }

  public toggleCrouched(): boolean {
    this.crouched = !this.crouched;
    this.emit();
    return this.crouched;
  }

  public requestMouseLock(): void {
    if (!this.active) return;
    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock?.();
    } else {
      this.canvas.requestPointerLock?.();
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

    this.active = true;
    this.crouched = false;
    this.currentEyeHeight = STANDING_EYE_HEIGHT;
    this.glideTargetFoot = null;
    this.keysDown.clear();

    this.rig.useCamera(false);
    this.rig.controls.enabled = false;
    this.rig.perspCamera.fov = WALKTHROUGH_FOV;
    this.rig.perspCamera.near = 0.08;
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
      this.pitchRad = -0.04;
    } else {
      // Determine whether the current orbit target or camera is inside a room
      const [tx, ty, tz] = currentPose.target;
      const [cx, , cz] = currentPose.position;
      const roomMinY = this.getRoomMinYAt(tx, ty, tz);
      if (roomMinY !== null && Math.hypot(cx - tx, cz - tz) < 18.0) {
        // Spawn a little back from the orbit target toward the camera if inside the same room
        const dirX = tx - cx;
        const dirZ = tz - cz;
        const distXZ = Math.hypot(dirX, dirZ);
        const spawnX = distXZ > 0.5 ? tx - (dirX / distXZ) * Math.min(1.4, distXZ * 0.4) : tx;
        const spawnZ = distXZ > 0.5 ? tz - (dirZ / distXZ) * Math.min(1.4, distXZ * 0.4) : tz;
        const baseFloorY = this.getRoomMinYAt(spawnX, ty, spawnZ) ?? roomMinY;
        const sampledY = this.sampleFloorElevation(spawnX, baseFloorY, spawnZ);
        this.footPos.set(spawnX, sampledY, spawnZ);
        this.yawRad = Math.atan2(-dirX, -dirZ);
        this.pitchRad = -0.05;
      } else {
        const def = DEFAULT_WALKTHROUGH_SPAWNS[0];
        this.footPos.set(def.position[0], def.position[1], def.position[2]);
        this.yawRad = THREE.MathUtils.degToRad(def.yawDeg);
        this.pitchRad = -0.04;
      }
    }

    this.syncCameraFromFootAndAngles(0);
    this.onStateChanged(true);
    this.onPoseUpdated();
    this.emit();
  }

  public exit(): SceneCameraPoseSnapshot | null {
    if (!this.active) return null;
    this.active = false;
    this.keysDown.clear();
    this.glideTargetFoot = null;
    this.isDraggingLook = false;

    if (document.pointerLockElement === this.canvas) {
      document.exitPointerLock?.();
    }

    const saved = this.savedOrbitState;
    this.rig.perspCamera.fov = saved?.fov ?? 42;
    this.rig.perspCamera.near = 0.15;
    this.rig.perspCamera.updateProjectionMatrix();
    this.rig.controls.enabled = true;

    this.onStateChanged(false);
    this.emit();
    return saved?.pose ?? null;
  }

  public teleportToSpawn(spawnId: string): boolean {
    const sp = DEFAULT_WALKTHROUGH_SPAWNS.find((s) => s.id === spawnId);
    if (!sp) return false;
    this.glideTargetFoot = null;
    this.footPos.set(sp.position[0], sp.position[1], sp.position[2]);
    this.footPos.y = this.sampleFloorElevation(
      this.footPos.x,
      this.footPos.y,
      this.footPos.z
    );
    this.yawRad = THREE.MathUtils.degToRad(sp.yawDeg);
    this.pitchRad = -0.04;
    this.syncCameraFromFootAndAngles(0);
    this.onPoseUpdated();
    this.emit();
    return true;
  }

  public glideToWorldPoint(point: THREE.Vector3): void {
    if (!this.active) return;
    const targetFloorY = this.sampleFloorElevation(point.x, point.y, point.z);
    this.glideTargetFoot = new THREE.Vector3(point.x, targetFloorY, point.z);
    // Smoothly orient yaw toward the clicked destination
    const dx = point.x - this.footPos.x;
    const dz = point.z - this.footPos.z;
    if (Math.hypot(dx, dz) > 0.25) {
      this.yawRad = Math.atan2(-dx, -dz);
    }
  }

  private sampleFloorElevation(x: number, refFootY: number, z: number): number {
    const rayOrigin = new THREE.Vector3(x, refFootY + 1.05, z);
    this.downRaycaster.set(rayOrigin, new THREE.Vector3(0, -1, 0));

    const hits = this.downRaycaster.intersectObjects(this.scene.children, true);
    let bestFloorY: number | null = null;

    for (const hit of hits) {
      const obj = hit.object;
      if (!(obj instanceof THREE.Mesh)) continue;
      if (!isObjectVisibleInHierarchy(obj)) continue;
      if (obj.userData?.isAnnotationGroup) continue;
      // Ignore ceiling/roof meshes above the head
      if (hit.point.y > refFootY + 0.62) continue;
      if (hit.point.y < refFootY - 1.5) continue;

      // Prefer upward-facing horizontal surfaces (floors, stair treads, thresholds)
      if (hit.face) {
        const worldNormal = hit.face.normal
          .clone()
          .transformDirection(obj.matrixWorld);
        if (worldNormal.y < 0.55) continue;
      }

      // Skip table/countertop surfaces (> 0.68m above room floor) unless on stairs
      const roomMinY = this.getRoomMinYAt(x, hit.point.y, z);
      if (roomMinY !== null && hit.point.y - roomMinY > 0.52) {
        // Check if this is in the Main Hall staircase zone (X in -17.2..-13.0)
        const inStairHall = x >= -17.3 && x <= -12.8 && z >= -2.1 && z <= 3.0;
        if (!inStairHall) continue;
      }

      if (bestFloorY === null || hit.point.y > bestFloorY) {
        bestFloorY = hit.point.y;
      }
    }

    if (bestFloorY !== null) {
      return bestFloorY;
    }

    const fallbackRoomY = this.getRoomMinYAt(x, refFootY + 0.5, z);
    return fallbackRoomY ?? refFootY;
  }

  private isBlockedByWallOrCabinet(
    fromFoot: THREE.Vector3,
    moveDirXZ: THREE.Vector3,
    stepDist: number
  ): boolean {
    // Cast a horizontal ray at knee/waist height (0.55m above foot) and chest height (1.15m above foot)
    const radii = [0.52, 1.15];
    this.wallRaycaster.far = Math.max(0.36, stepDist + 0.3);

    for (const hOffset of radii) {
      const origin = new THREE.Vector3(
        fromFoot.x,
        fromFoot.y + hOffset,
        fromFoot.z
      );
      this.wallRaycaster.set(origin, moveDirXZ);
      const hits = this.wallRaycaster.intersectObjects(this.scene.children, true);
      for (const hit of hits) {
        const obj = hit.object;
        if (!(obj instanceof THREE.Mesh)) continue;
        if (!isObjectVisibleInHierarchy(obj)) continue;
        if (obj.userData?.isAnnotationGroup) continue;
        if (hit.distance <= stepDist + 0.28) {
          // Check if surface normal is mostly vertical (a wall, closed door, or cabinet side)
          if (hit.face) {
            const worldNormal = hit.face.normal
              .clone()
              .transformDirection(obj.matrixWorld);
            if (Math.abs(worldNormal.y) < 0.45) {
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
    const eyeY = this.footPos.y + this.currentEyeHeight + bobOffsetY;
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
    if (!this.active) return false;

    let movedOrRotated = false;

    // 1. Smoothly interpolate eye height (standing vs crouched)
    const targetEyeH = this.crouched ? CROUCH_EYE_HEIGHT : STANDING_EYE_HEIGHT;
    if (Math.abs(this.currentEyeHeight - targetEyeH) > 1e-3) {
      this.currentEyeHeight = THREE.MathUtils.lerp(
        this.currentEyeHeight,
        targetEyeH,
        1 - Math.exp(-12 * dtSeconds)
      );
      movedOrRotated = true;
    }

    // 2. Keyboard yaw rotation (Q / E)
    let turnInput = 0;
    if (this.keysDown.has('KeyQ')) turnInput += 1;
    if (this.keysDown.has('KeyE')) turnInput -= 1;
    if (turnInput !== 0) {
      this.yawRad += turnInput * KEY_TURN_SPEED_RAD * dtSeconds;
      movedOrRotated = true;
    }

    // 3. WASD / Arrow movement
    let forwardInput = 0;
    let strafeInput = 0;
    if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) forwardInput += 1;
    if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) forwardInput -= 1;
    if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) strafeInput += 1;
    if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) strafeInput -= 1;

    const isSprinting =
      this.keysDown.has('ShiftLeft') || this.keysDown.has('ShiftRight');
    const speed = isSprinting ? SPRINT_SPEED_MPS : WALK_SPEED_MPS;

    if (forwardInput !== 0 || strafeInput !== 0) {
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

        // Try full movement vector, then slide along X or Z if blocked by a wall/counter
        if (!this.isBlockedByWallOrCabinet(this.footPos, moveVec, stepDist)) {
          this.footPos.x += moveVec.x * stepDist;
          this.footPos.z += moveVec.z * stepDist;
        } else {
          const slideX = new THREE.Vector3(Math.sign(moveVec.x), 0, 0);
          const slideZ = new THREE.Vector3(0, 0, Math.sign(moveVec.z));
          if (
            Math.abs(moveVec.x) > 0.1 &&
            !this.isBlockedByWallOrCabinet(
              this.footPos,
              slideX,
              Math.abs(moveVec.x) * stepDist
            )
          ) {
            this.footPos.x += moveVec.x * stepDist;
          } else if (
            Math.abs(moveVec.z) > 0.1 &&
            !this.isBlockedByWallOrCabinet(
              this.footPos,
              slideZ,
              Math.abs(moveVec.z) * stepDist
            )
          ) {
            this.footPos.z += moveVec.z * stepDist;
          }
        }

        const targetFloorY = this.sampleFloorElevation(
          this.footPos.x,
          this.footPos.y,
          this.footPos.z
        );
        this.footPos.y = THREE.MathUtils.lerp(
          this.footPos.y,
          targetFloorY,
          1 - Math.exp(-14 * dtSeconds)
        );

        this.bobPhase += dtSeconds * (isSprinting ? 12.5 : 8.8);
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
        const step = Math.min(dist, WALK_SPEED_MPS * 1.25 * dtSeconds);
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
          1 - Math.exp(-14 * dtSeconds)
        );
        this.bobPhase += dtSeconds * 8.5;
      }
      movedOrRotated = true;
    } else if (Math.abs(Math.sin(this.bobPhase)) > 0.02) {
      this.bobPhase = 0;
      movedOrRotated = true;
    }

    if (movedOrRotated) {
      const bobOffset =
        forwardInput !== 0 || strafeInput !== 0 || this.glideTargetFoot
          ? Math.sin(this.bobPhase) * 0.018
          : 0;
      this.syncCameraFromFootAndAngles(bobOffset);
      this.onPoseUpdated();
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
      if (this.pointerLocked) return;
      this.isDraggingLook = true;
      this.lastDragClientX = e.clientX;
      this.lastDragClientY = e.clientY;
    });

    window.addEventListener('pointermove', (e: PointerEvent) => {
      if (!this.active) return;
      if (this.pointerLocked) {
        this.yawRad -= e.movementX * MOUSE_SENSITIVITY;
        this.pitchRad = THREE.MathUtils.clamp(
          this.pitchRad - e.movementY * MOUSE_SENSITIVITY,
          -MAX_PITCH_RAD,
          MAX_PITCH_RAD
        );
        this.syncCameraFromFootAndAngles(0);
        this.onPoseUpdated();
        return;
      }
      if (this.isDraggingLook && (e.buttons & 1) !== 0) {
        const dx = e.clientX - this.lastDragClientX;
        const dy = e.clientY - this.lastDragClientY;
        this.lastDragClientX = e.clientX;
        this.lastDragClientY = e.clientY;
        this.yawRad -= dx * DRAG_SENSITIVITY;
        this.pitchRad = THREE.MathUtils.clamp(
          this.pitchRad - dy * DRAG_SENSITIVITY,
          -MAX_PITCH_RAD,
          MAX_PITCH_RAD
        );
        this.syncCameraFromFootAndAngles(0);
        this.onPoseUpdated();
      }
    });

    window.addEventListener('pointerup', () => {
      this.isDraggingLook = false;
    });

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName ?? '';
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (!this.active) return;

      if (e.code === 'KeyC' && !e.repeat) {
        e.preventDefault();
        this.toggleCrouched();
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
