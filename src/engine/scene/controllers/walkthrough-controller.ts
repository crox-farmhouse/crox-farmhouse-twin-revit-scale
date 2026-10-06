import * as THREE from 'three';
import type { SceneCameraPoseSnapshot } from '../../../types/scene.ts';
import { isObjectVisibleInHierarchy } from '../object-utils.ts';
import type { CameraRig } from './camera-rig.ts';
import {
  WalkthroughDoorBargeAndCollisionSolver,
  type WalkthroughDoorBargeHandler,
  type WalkthroughProximityDoorBargeHandler,
} from './walkthrough/walkthrough-door-barge.ts';
import {
  getWalkthroughTargetEyeHeight,
  resolveWalkthroughEntryPose,
  sampleFloorElevation,
} from './walkthrough/walkthrough-elevation-solver.ts';
import { WalkthroughLadderClimbController } from './walkthrough/walkthrough-ladder-climb.ts';
import {
  CROUCH_EYE_HEIGHT,
  CROUCH_SPEED_MPS,
  DEFAULT_WALKTHROUGH_FOV,
  DEFAULT_WALKTHROUGH_SPAWNS,
  DRAG_SENSITIVITY,
  ewSpawnPos,
  GRAVITY_MPS2,
  INTERACT_MAX_DISTANCE,
  JUMP_IMPULSE_MPS,
  KEY_TURN_SPEED_RAD,
  loadWalkthroughSessionFromStorage,
  MAX_PITCH_RAD,
  MOUSE_SENSITIVITY,
  type SavedOrbitState,
  SPRINT_FOV_BOOST,
  SPRINT_SPEED_MPS,
  STANDING_EYE_HEIGHT,
  saveWalkthroughSessionToStorage,
  syncWalkthroughCameraPose,
  WALK_SPEED_MPS,
  WALKTHROUGH_FOV_PRESETS,
  WALKTHROUGH_MOVEMENT_KEYS,
  type WalkthroughSpawnPoint,
  worldToEastWingLocal,
} from './walkthrough/walkthrough-spawns.ts';

export {
  DEFAULT_WALKTHROUGH_SPAWNS,
  ewSpawnPos,
  WALKTHROUGH_FOV_PRESETS,
  type WalkthroughSpawnPoint,
  worldToEastWingLocal,
};

/**
 * Call-of-Duty-style First-Person Walkthrough Controller (no weapon) for Crox Farmhouse.
 */
export class WalkthroughController {
  private readonly canvas: HTMLCanvasElement;
  private readonly rig: CameraRig;
  private readonly getRoomMinYAt: (x: number, y: number, z: number) => number | null;
  private readonly getInteractiveMeshes: () => readonly THREE.Object3D[];
  private readonly describeInteractable: (mesh: THREE.Object3D) => string;
  private readonly onInteractWithMesh: (mesh: THREE.Object3D) => void;
  private readonly onStateChanged: (active: boolean) => void;
  private readonly onPoseUpdated: () => void;
  private readonly collisionAndBarge: WalkthroughDoorBargeAndCollisionSolver;
  private readonly ladderClimb = new WalkthroughLadderClimbController();

  private active = false;
  private crouched = false;
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
  private yawRad = 0;
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

  private readonly keysDown = new Set<string>();
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
    readonly onBargeWalkthroughDoor?: WalkthroughDoorBargeHandler;
    readonly onProximityBargeDoors?: WalkthroughProximityDoorBargeHandler;
    readonly onStateChanged: (active: boolean) => void;
    readonly onPoseUpdated: () => void;
  }) {
    this.canvas = options.canvas;
    this.rig = options.rig;
    this.getRoomMinYAt = options.getRoomMinYAt;
    this.getInteractiveMeshes = options.getInteractiveMeshes;
    this.describeInteractable = options.describeInteractable;
    this.onInteractWithMesh = options.onInteractWithMesh;
    this.onStateChanged = options.onStateChanged;
    this.onPoseUpdated = options.onPoseUpdated;

    this.collisionAndBarge = new WalkthroughDoorBargeAndCollisionSolver({
      scene: options.scene,
      onBargeWalkthroughDoor: options.onBargeWalkthroughDoor ?? (() => false),
      onProximityBargeDoors: options.onProximityBargeDoors ?? (() => false),
      onDoorBarged: () => this.refreshTargetedInteractable(true),
    });

    this.interactRaycaster.near = 0.05;
    this.interactRaycaster.far = INTERACT_MAX_DISTANCE;
    this.bindInputEvents();
  }

  public isActive(): boolean { return this.active; }
  public isCrouched(): boolean { return this.crouched; }
  public isPointerLocked(): boolean { return this.pointerLocked; }
  public getBaseFov(): number { return this.baseFov; }
  public getSmoothedFps(): number { return Math.round(this.smoothedFps); }
  public getTargetedPrompt(): string | null { return this.targetedPrompt; }
  public getFootPosition(): THREE.Vector3 { return this.footPos; }
  public invalidateObstacleCache(): void { this.collisionAndBarge.invalidateObstacleCache(); }
  public captureFurnitureColliders(): void { this.collisionAndBarge.captureFurnitureColliders(); }
  public pressKey(code: string): void { this.keysDown.add(code); }
  public refreshPrompt(): void { this.refreshTargetedInteractable(true); }

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
    const nextFov = WALKTHROUGH_FOV_PRESETS[(idx + 1) % WALKTHROUGH_FOV_PRESETS.length];
    this.setBaseFov(nextFov);
    return nextFov;
  }

  public subscribe(cb: (active: boolean) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private emit(): void {
    for (const cb of this.listeners) cb(this.active);
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

  public interactWithClimbableLadder(): boolean {
    if (!this.active) return false;
    const triggered = this.ladderClimb.tryTriggerInteraction(
      this.footPos,
      this.yawRad,
      this.pitchRad,
      this.currentEyeHeight,
      this.targetedMesh
    );
    if (triggered) {
      this.glideTargetFoot = null;
      this.verticalVelocity = 0;
      this.jumpOffsetY = 0;
      this.refreshTargetedInteractable(true);
    }
    return triggered;
  }

  public triggerTargetedInteraction(): boolean {
    if (!this.active) return false;
    this.refreshTargetedInteractable(true);
    if (this.interactWithClimbableLadder()) {
      return true;
    }
    if (!this.targetedMesh) return false;
    this.onInteractWithMesh(this.targetedMesh);
    this.refreshTargetedInteractable(true);
    return true;
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
    saveWalkthroughSessionToStorage({
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
    });
  }

  public restoreFromSessionIfActive(currentPose: SceneCameraPoseSnapshot): boolean {
    const session = loadWalkthroughSessionFromStorage();
    if (!session) return false;
    if (session.baseFov !== undefined) this.baseFov = session.baseFov;
    this.enter(currentPose, { position: session.footPos, yawDeg: session.yawDeg });
    if (session.pitchRad !== undefined) {
      this.pitchRad = session.pitchRad;
      this.targetPitchRad = session.pitchRad;
    }
    if (session.crouched !== undefined) {
      this.crouched = session.crouched;
      this.currentEyeHeight = this.crouched ? CROUCH_EYE_HEIGHT : STANDING_EYE_HEIGHT;
    }
    this.collisionAndBarge.ensureFootPositionUnblocked(this.footPos, this.currentEyeHeight);
    this.syncCameraFromFootAndAngles(0);
    this.onPoseUpdated();
    this.emit();
    return true;
  }

  public enter(
    currentPose: SceneCameraPoseSnapshot,
    spawnOverride?: { readonly position: readonly [number, number, number]; readonly yawDeg?: number }
  ): void {
    if (!this.active) {
      this.savedOrbitState = { pose: currentPose, fov: this.rig.perspCamera.fov };
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
    this.ladderClimb.reset();

    this.rig.useCamera(false);
    this.rig.controls.enabled = false;
    this.rig.perspCamera.fov = this.baseFov;
    this.rig.perspCamera.near = 0.06;
    this.rig.perspCamera.updateProjectionMatrix();

    const resolved = resolveWalkthroughEntryPose(currentPose, this.getRoomMinYAt, spawnOverride);
    this.footPos.set(resolved.footX, resolved.footY, resolved.footZ);
    this.yawRad = resolved.yawRad;
    this.pitchRad = resolved.pitchRad;

    if (resolved.checkMode === 'depenetrate') {
      this.collisionAndBarge.depenetrateFootPosition(this.footPos, this.currentEyeHeight);
    } else if (resolved.checkMode === 'ensure_unblocked') {
      this.collisionAndBarge.ensureFootPositionUnblocked(this.footPos, this.currentEyeHeight);
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
    this.ladderClimb.reset();
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
    this.ladderClimb.reset();
    this.verticalVelocity = 0;
    this.jumpOffsetY = 0;
    this.footPos.set(sp.position[0], sp.position[1], sp.position[2]);
    this.footPos.y = sampleFloorElevation(this.footPos.x, this.footPos.y, this.footPos.z);
    this.collisionAndBarge.depenetrateFootPosition(this.footPos, this.currentEyeHeight);
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
    const targetFloorY = sampleFloorElevation(point.x, point.y, point.z);
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

    this.interactRaycaster.setFromCamera(this.centerNdc, this.rig.perspCamera);
    const hits = this.interactRaycaster.intersectObjects(
      this.getInteractiveMeshes() as THREE.Object3D[],
      false
    );
    const firstHit = hits.find(
      (h) => h.distance <= INTERACT_MAX_DISTANCE && isObjectVisibleInHierarchy(h.object)
    );

    const nextMesh = firstHit?.object ?? null;
    const ladderPrompt = this.ladderClimb.getProximityLadderPrompt(this.footPos, nextMesh);
    const nextPrompt =
      ladderPrompt ?? (nextMesh ? this.describeInteractable(nextMesh) : null);
    if (nextMesh !== this.targetedMesh || nextPrompt !== this.targetedPrompt) {
      this.targetedMesh = nextMesh;
      this.targetedPrompt = nextPrompt;
      this.emit();
    }
  }

  private syncCameraFromFootAndAngles(bobOffsetY: number, rollRad = 0): void {
    syncWalkthroughCameraPose(
      this.rig,
      this.footPos,
      this.currentEyeHeight,
      this.jumpOffsetY,
      bobOffsetY,
      this.yawRad,
      this.pitchRad,
      rollRad
    );
  }

  public update(dtSeconds: number): boolean {
    if (dtSeconds > 0.0005 && dtSeconds < 0.25) {
      this.smoothedFps = this.smoothedFps * 0.9 + (1 / dtSeconds) * 0.1;
    }
    if (!this.active) return false;

    let turnInput = 0;
    if (this.keysDown.has('KeyQ')) turnInput += 1;
    if (this.keysDown.has('KeyE')) turnInput -= 1;
    if (turnInput !== 0) {
      this.targetYawRad += turnInput * KEY_TURN_SPEED_RAD * dtSeconds;
    }

    if (this.ladderClimb.isActive()) {
      this.lookDirty = false;
      this.glideTargetFoot = null;
      this.jumpOffsetY = 0;
      this.verticalVelocity = 0;
      const ladderStep = this.ladderClimb.step(
        dtSeconds,
        this.footPos,
        this.yawRad,
        this.pitchRad,
        this.targetYawRad,
        this.targetPitchRad,
        this.currentEyeHeight,
        this.crouched,
        this.keysDown
      );
      this.yawRad = ladderStep.yawRad;
      this.pitchRad = ladderStep.pitchRad;
      this.targetYawRad = ladderStep.targetYawRad;
      this.targetPitchRad = ladderStep.targetPitchRad;
      this.currentEyeHeight = ladderStep.currentEyeHeight;

      const desiredLadderFov = this.baseFov + ladderStep.fovBoost;
      if (Math.abs(this.currentFov - desiredLadderFov) > 0.02) {
        this.currentFov = THREE.MathUtils.lerp(
          this.currentFov,
          desiredLadderFov,
          1 - Math.exp(-12 * dtSeconds)
        );
        this.rig.perspCamera.fov = this.currentFov;
        this.rig.perspCamera.updateProjectionMatrix();
      }

      this.syncCameraFromFootAndAngles(ladderStep.bobOffsetY, ladderStep.rollRad);
      this.refreshTargetedInteractable();
      this.onPoseUpdated();
      this.saveSessionState(false);
      return true;
    }

    let movedOrRotated = false;
    if (this.lookDirty) {
      this.lookDirty = false;
      movedOrRotated = true;
    }
    if (turnInput !== 0) {
      movedOrRotated = true;
    }

    const yawDiff = this.targetYawRad - this.yawRad;
    const pitchDiff = this.targetPitchRad - this.pitchRad;
    if (Math.abs(yawDiff) > 1e-5 || Math.abs(pitchDiff) > 1e-5) {
      const lookAlpha = 1 - Math.exp(-48 * dtSeconds);
      this.yawRad = Math.abs(yawDiff) <= 1e-4 ? this.targetYawRad : THREE.MathUtils.lerp(this.yawRad, this.targetYawRad, lookAlpha);
      this.pitchRad = Math.abs(pitchDiff) <= 1e-4 ? this.targetPitchRad : THREE.MathUtils.lerp(this.pitchRad, this.targetPitchRad, lookAlpha);
      movedOrRotated = true;
    }

    const targetEyeH = getWalkthroughTargetEyeHeight(
      this.footPos.x,
      this.footPos.y,
      this.footPos.z,
      this.crouched
    );
    if (Math.abs(this.currentEyeHeight - targetEyeH) > 1e-3) {
      this.currentEyeHeight = THREE.MathUtils.lerp(this.currentEyeHeight, targetEyeH, 1 - Math.exp(-14 * dtSeconds));
      movedOrRotated = true;
    }

    if (this.jumpOffsetY > 0 || this.verticalVelocity !== 0) {
      this.jumpOffsetY += this.verticalVelocity * dtSeconds;
      this.verticalVelocity -= GRAVITY_MPS2 * dtSeconds;
      if (this.jumpOffsetY <= 0) {
        this.jumpOffsetY = 0;
        this.verticalVelocity = 0;
      }
      movedOrRotated = true;
    }



    let forwardInput = 0;
    let strafeInput = 0;
    if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) forwardInput += 1;
    if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) forwardInput -= 1;
    if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) strafeInput += 1;
    if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) strafeInput -= 1;

    const isMoving = forwardInput !== 0 || strafeInput !== 0;
    const isSprinting =
      isMoving && !this.crouched && (this.keysDown.has('ShiftLeft') || this.keysDown.has('ShiftRight'));
    this.isCurrentlySprinting = isSprinting;
    const speed = this.crouched ? CROUCH_SPEED_MPS : isSprinting ? SPRINT_SPEED_MPS : WALK_SPEED_MPS;

    const targetFov = this.baseFov + (isSprinting ? SPRINT_FOV_BOOST : 0);
    if (Math.abs(this.currentFov - targetFov) > 0.05) {
      this.currentFov = THREE.MathUtils.lerp(this.currentFov, targetFov, 1 - Math.exp(-10 * dtSeconds));
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
        if (
          this.ladderClimb.checkAutoMountOnMovement(
            this.footPos,
            moveVec,
            forwardInput,
            this.yawRad,
            this.pitchRad,
            this.currentEyeHeight,
            this.keysDown
          )
        ) {
          this.jumpOffsetY = 0;
          this.verticalVelocity = 0;
          movedOrRotated = true;
        } else {
          this.targetYawRad = this.collisionAndBarge.stepHorizontalMovement(
            this.footPos,
            moveVec,
            forwardInput,
            this.targetYawRad,
            speed * dtSeconds,
            this.currentEyeHeight,
            this.isCurrentlySprinting,
            dtSeconds
          );
          this.bobPhase += dtSeconds * (isSprinting ? 13.0 : 9.0);
          movedOrRotated = true;
        }
      }
    } else if (this.glideTargetFoot) {
      const glideStep = this.collisionAndBarge.stepGlideToTarget(
        this.footPos,
        this.glideTargetFoot,
        this.currentEyeHeight,
        dtSeconds
      );
      this.glideTargetFoot = glideStep.nextGlideTarget;
      this.bobPhase += glideStep.bobDelta;
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
      try {
        this.canvas.requestPointerLock?.();
      } catch {
        // Fallback to drag look
      }
      this.isDraggingLook = true;
      this.lastDragClientX = e.clientX;
      this.lastDragClientY = e.clientY;
    });

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
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.metaKey || e.altKey || !this.active) return;
      if (tag === 'SELECT' || tag === 'BUTTON') (activeEl as HTMLElement).blur();

      if (e.code === 'KeyF' && !e.repeat && !e.ctrlKey) {
        e.preventDefault();
        this.triggerTargetedInteraction();
        return;
      }
      if ((e.code === 'KeyC' || e.code === 'ControlLeft') && !e.repeat) {
        e.preventDefault();
        this.toggleCrouched();
        return;
      }
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        const ladderJump = this.ladderClimb.tryHandleSpaceJump(
          this.footPos,
          this.yawRad,
          this.pitchRad,
          this.currentEyeHeight
        );
        if (ladderJump.handled) {
          this.verticalVelocity = ladderJump.kickBackVelocityY;
          return;
        }
        if (this.crouched) {
          this.setCrouched(false);
        } else if (this.jumpOffsetY <= 0.01) {
          this.verticalVelocity = JUMP_IMPULSE_MPS;
        }
        return;
      }
      if (WALKTHROUGH_MOVEMENT_KEYS.has(e.code)) {
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
