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
  private readonly onStateChanged: (active: boolean) => void;
  private readonly onPoseUpdated: () => void;

  private active = false;
  private crouched = false;
  private pointerLocked = false;
  private isDraggingLook = false;
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
  private bobPhase = 0;

  private glideTargetFoot: THREE.Vector3 | null = null;
  private savedOrbitState: SavedOrbitState | null = null;

  private targetedMesh: THREE.Object3D | null = null;
  private targetedPrompt: string | null = null;
  private lastRaycastMs = 0;

  private readonly keysDown = new Set<string>();
  private readonly downRaycaster = new THREE.Raycaster();
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
    this.onStateChanged = options.onStateChanged;
    this.onPoseUpdated = options.onPoseUpdated;

    this.downRaycaster.near = 0.05;
    this.downRaycaster.far = 4.5;
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

  public setBaseFov(fov: number): void {
    this.baseFov = THREE.MathUtils.clamp(fov, 60, 100);
    this.currentFov = this.baseFov;
    if (this.active) {
      this.rig.perspCamera.fov = this.currentFov;
      this.rig.perspCamera.updateProjectionMatrix();
      this.onPoseUpdated();
    }
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
    this.verticalVelocity = 0;
    this.jumpOffsetY = 0;
    this.currentEyeHeight = STANDING_EYE_HEIGHT;
    this.currentFov = this.baseFov;
    this.glideTargetFoot = null;
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
      } else {
        const def = DEFAULT_WALKTHROUGH_SPAWNS[0];
        this.footPos.set(def.position[0], def.position[1], def.position[2]);
        this.yawRad = THREE.MathUtils.degToRad(def.yawDeg);
        this.pitchRad = -0.03;
      }
    }

    this.syncCameraFromFootAndAngles(0);
    this.refreshTargetedInteractable(true);
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
    this.emit();
    return saved?.pose ?? null;
  }

  public teleportToSpawn(spawnId: string): boolean {
    const sp = DEFAULT_WALKTHROUGH_SPAWNS.find((s) => s.id === spawnId);
    if (!sp) return false;
    this.glideTargetFoot = null;
    this.verticalVelocity = 0;
    this.jumpOffsetY = 0;
    this.footPos.set(sp.position[0], sp.position[1], sp.position[2]);
    this.footPos.y = this.sampleFloorElevation(
      this.footPos.x,
      this.footPos.y,
      this.footPos.z
    );
    this.yawRad = THREE.MathUtils.degToRad(sp.yawDeg);
    this.pitchRad = -0.03;
    this.syncCameraFromFootAndAngles(0);
    this.refreshTargetedInteractable(true);
    this.onPoseUpdated();
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
    }
  }

  private refreshTargetedInteractable(force = false): void {
    if (!this.active) return;
    const now = performance.now();
    if (!force && now - this.lastRaycastMs < 45) return;
    this.lastRaycastMs = now;

    const cam = this.rig.perspCamera;
    cam.updateMatrixWorld();
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
    const rayOrigin = new THREE.Vector3(x, refFootY + 1.05, z);
    this.downRaycaster.set(rayOrigin, new THREE.Vector3(0, -1, 0));

    const hits = this.downRaycaster.intersectObjects(this.scene.children, true);
    let bestFloorY: number | null = null;
    const roomMinY = this.getRoomMinYAt(x, refFootY + 0.35, z);

    for (const hit of hits) {
      const obj = hit.object;
      if (!(obj instanceof THREE.Mesh)) continue;
      if (!isObjectVisibleInHierarchy(obj)) continue;
      if (obj.userData?.isAnnotationGroup) continue;
      // Ignore ceiling/roof meshes above the head
      if (hit.point.y > refFootY + 0.62) continue;
      if (hit.point.y < refFootY - 1.2) continue;

      // Prefer upward-facing horizontal surfaces (floors, stair treads, thresholds)
      if (hit.face) {
        const worldNormal = hit.face.normal
          .clone()
          .transformDirection(obj.matrixWorld);
        if (worldNormal.y < 0.55) continue;
      }

      // Skip table/countertop/sofa surfaces (> 0.36m above room floor) unless on the Main Hall staircase
      if (roomMinY !== null && hit.point.y - roomMinY > 0.36) {
        const inStairHall = x >= -17.5 && x <= -12.8 && z >= -2.5 && z <= 3.0;
        if (!inStairHall) continue;
      }

      // Also never drop into sub-floor cellars/trenches below roomMinY - 0.12m
      if (roomMinY !== null && hit.point.y < roomMinY - 0.12) {
        continue;
      }

      if (bestFloorY === null || hit.point.y > bestFloorY) {
        bestFloorY = hit.point.y;
      }
    }

    if (bestFloorY !== null) {
      return bestFloorY;
    }

    return roomMinY ?? refFootY;
  }

  private isBlockedByWallOrCabinet(
    fromFoot: THREE.Vector3,
    moveDirXZ: THREE.Vector3,
    stepDist: number
  ): boolean {
    const radii = [0.52, 1.12];
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
    if (!this.active) return false;

    let movedOrRotated = false;

    // 1. Smoothly interpolate eye height (standing vs crouched)
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
      this.yawRad += turnInput * KEY_TURN_SPEED_RAD * dtSeconds;
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
          1 - Math.exp(-15 * dtSeconds)
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
        (isMoving || this.glideTargetFoot) && this.jumpOffsetY === 0
          ? Math.sin(this.bobPhase) * (isSprinting ? 0.022 : 0.015)
          : 0;
      this.syncCameraFromFootAndAngles(bobOffset);
      this.onPoseUpdated();
    }

    this.refreshTargetedInteractable();
    return movedOrRotated;
  }

  private bindInputEvents(): void {
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === this.canvas;
      this.emit();
    });

    this.canvas.addEventListener('pointerdown', (e: PointerEvent) => {
      if (!this.active || e.button !== 0) return;
      if (!this.pointerLocked) {
        // Call of Duty style: clicking the 3D viewport automatically engages Pointer Lock mouselook!
        try {
          this.canvas.requestPointerLock?.();
        } catch {
          // Fallback to drag look
        }
        this.isDraggingLook = true;
        this.lastDragClientX = e.clientX;
        this.lastDragClientY = e.clientY;
      }
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
        this.refreshTargetedInteractable();
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
        this.refreshTargetedInteractable();
        this.onPoseUpdated();
      }
    });

    window.addEventListener('pointerup', () => {
      this.isDraggingLook = false;
    });

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName ?? '';
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) return;
      if (e.metaKey || e.altKey) return;

      if (!this.active) return;

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
