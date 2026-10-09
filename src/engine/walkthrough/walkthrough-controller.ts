import * as THREE from 'three';
import type { SceneCameraPoseSnapshot } from '../../core/types/scene.ts';
import type { FirstPersonPoseSample } from '../interaction/handlers/animated-interactable.ts';
import { isObjectVisibleInHierarchy } from '../util/object-utils.ts';
import type { CameraRig } from '../camera/camera-rig.ts';
import {
  WalkthroughDoorBargeAndCollisionSolver,
  type WalkthroughDoorBargeHandler,
  type WalkthroughProximityDoorBargeHandler,
} from './parts/walkthrough-door-barge.ts';
import {
  getWalkthroughTargetEyeHeight,
  OB_COS,
  OB_SIN,
  outbuildingLocalToWorld,
  resolveWalkthroughEntryPose,
  sampleFloorElevation,
  worldToOutbuildingLocal,
} from './parts/walkthrough-elevation-solver.ts';
import { WalkthroughLadderClimbController } from './parts/walkthrough-ladder-climb.ts';
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
} from './parts/walkthrough-spawns.ts';

export {
  DEFAULT_WALKTHROUGH_SPAWNS,
  ewSpawnPos,
  WALKTHROUGH_FOV_PRESETS,
  type WalkthroughSpawnPoint,
  worldToEastWingLocal,
};

function shortestAngleDelta(fromRad: number, toRad: number): number {
  return Math.atan2(Math.sin(toRad - fromRad), Math.cos(toRad - fromRad));
}

function lerpAngle(fromRad: number, toRad: number, t: number): number {
  return fromRad + shortestAngleDelta(fromRad, toRad) * t;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = THREE.MathUtils.clamp((x - edge0) / Math.max(1e-5, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function computeOutbuildingLookAtYaw(
  fromU: number,
  fromV: number,
  toU: number,
  toV: number
): number {
  const du = toU - fromU;
  const dv = toV - fromV;
  const wx = du * OB_COS + dv * OB_SIN;
  const wz = -du * OB_SIN + dv * OB_COS;
  return Math.atan2(-wx, -wz);
}

interface GolfShotStartPose {
  readonly startU: number;
  readonly startV: number;
  readonly startFootY: number;
  readonly startYaw: number;
  readonly startPitch: number;
  readonly startEyeH: number;
}

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
  private readonly onTriggerGolfSimulatorShot?: () => boolean;
  private readonly getGolfSimulatorShotElapsedSec?: () => number | null;
  private readonly getGolfSimulatorPrompt?: () => string | null;
  private readonly getActiveFirstPersonPose?: () => FirstPersonPoseSample | null;
  private readonly cancelActiveFirstPerson?: () => boolean;
  private readonly getProximityAnimatedInteractable?: (
    footX: number,
    footY: number,
    footZ: number
  ) => { readonly id: string; readonly prompt: string; readonly trigger: () => boolean } | null;
  private readonly onStateChanged: (active: boolean) => void;
  private readonly onPoseUpdated: () => void;
  private readonly collisionAndBarge: WalkthroughDoorBargeAndCollisionSolver;
  private readonly ladderClimb = new WalkthroughLadderClimbController();

  private active = false;
  private crouched = false;
  private isCurrentlySprinting = false;
  private pointerLocked = false;
  private isDraggingLook = false;
  private dragLookPointerId: number | null = null;
  private lookDirty = false;
  private lastDragClientX = 0;
  private lastDragClientY = 0;
  private dragLookStartX = 0;
  private dragLookStartY = 0;
  private dragLookStartTimeMs = 0;
  private touchForwardInput = 0;
  private touchStrafeInput = 0;
  private touchSprint = false;
  private touchLookYaw = 0;
  private touchLookPitch = 0;

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
  private groundVelX = 0;
  private groundVelZ = 0;
  private bobPhase = 0;
  private smoothedFps = 120;

  private glideTargetFoot: THREE.Vector3 | null = null;
  private savedOrbitState: SavedOrbitState | null = null;

  private targetedMesh: THREE.Object3D | null = null;
  private targetedPrompt: string | null = null;
  private wasInGolfAutoSwingStance = false;
  private golfShotStartPose: GolfShotStartPose | null = null;
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
    readonly onTriggerGolfSimulatorShot?: () => boolean;
    readonly getGolfSimulatorShotElapsedSec?: () => number | null;
    readonly getGolfSimulatorPrompt?: () => string | null;
    readonly getActiveFirstPersonPose?: () => FirstPersonPoseSample | null;
    readonly cancelActiveFirstPerson?: () => boolean;
    readonly getProximityAnimatedInteractable?: (
      footX: number,
      footY: number,
      footZ: number
    ) => { readonly id: string; readonly prompt: string; readonly trigger: () => boolean } | null;
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
    this.onTriggerGolfSimulatorShot = options.onTriggerGolfSimulatorShot;
    this.getGolfSimulatorShotElapsedSec = options.getGolfSimulatorShotElapsedSec;
    this.getGolfSimulatorPrompt = options.getGolfSimulatorPrompt;
    this.getActiveFirstPersonPose = options.getActiveFirstPersonPose;
    this.cancelActiveFirstPerson = options.cancelActiveFirstPerson;
    this.getProximityAnimatedInteractable = options.getProximityAnimatedInteractable;
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

  public setTouchMoveVector(strafe: number, forward: number, sprint = false): void {
    this.touchStrafeInput = THREE.MathUtils.clamp(strafe, -1, 1);
    this.touchForwardInput = THREE.MathUtils.clamp(forward, -1, 1);
    this.touchSprint = sprint;
  }

  public setTouchLookVector(yawInput: number, pitchInput: number): void {
    this.touchLookYaw = THREE.MathUtils.clamp(yawInput, -1, 1);
    this.touchLookPitch = THREE.MathUtils.clamp(pitchInput, -1, 1);
  }

  public toggleCrouched(): boolean {
    this.crouched = !this.crouched;
    this.saveSessionState(true);
    this.emit();
    return this.crouched;
  }

  public jump(): void {
    if (!this.active) return;
    if ((this.getActiveFirstPersonPose?.() ?? null) !== null) {
      this.cancelActiveFirstPerson?.();
      this.refreshTargetedInteractable(true);
      return;
    }
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

  public beginFirstPersonGolfShot(): void {
    const { obU, obV } = worldToOutbuildingLocal(this.footPos.x, this.footPos.z);
    this.golfShotStartPose = {
      startU: obU,
      startV: obV,
      startFootY: this.footPos.y,
      startYaw: this.yawRad,
      startPitch: this.pitchRad,
      startEyeH: this.currentEyeHeight,
    };
    this.glideTargetFoot = null;
    this.verticalVelocity = 0;
    this.jumpOffsetY = 0;
    this.wasInGolfAutoSwingStance = true;
  }

  private getGolfSimulatorZoneStatus(foot: THREE.Vector3): {
    readonly inAutoSwingStance: boolean;
    readonly inPlayZone: boolean;
  } {
    if (foot.y > 0.25) {
      return { inAutoSwingStance: false, inPlayZone: false };
    }
    const { obU, obV } = worldToOutbuildingLocal(foot.x, foot.z);
    // Callaway Tour Golf Bag is at outbuilding (u = 16.05m, v = 5.03m)
    const distToBag = Math.hypot(obU - 16.05, obV - 5.03);
    const inAutoSwingStance = foot.y <= 0.15 && distToBag <= 1.55;
    const inPlayZone = distToBag <= 2.35;
    return { inAutoSwingStance, inPlayZone };
  }

  public triggerTargetedInteraction(): boolean {
    if (!this.active) return false;
    if ((this.getActiveFirstPersonPose?.() ?? null) !== null) {
      const cancelled = this.cancelActiveFirstPerson?.() ?? false;
      this.refreshTargetedInteractable(true);
      return cancelled;
    }
    this.refreshTargetedInteractable(true);
    if (this.interactWithClimbableLadder()) {
      return true;
    }
    const { inPlayZone } = this.getGolfSimulatorZoneStatus(this.footPos);
    if (this.targetedMesh) {
      const prompt = this.describeInteractable(this.targetedMesh);
      if (inPlayZone && prompt.includes('Golf Bag')) {
        if (this.onTriggerGolfSimulatorShot?.()) {
          this.beginFirstPersonGolfShot();
          this.refreshTargetedInteractable(true);
          return true;
        }
      }
      this.onInteractWithMesh(this.targetedMesh);
      this.refreshTargetedInteractable(true);
      return true;
    }
    const proxAnim =
      this.getProximityAnimatedInteractable?.(this.footPos.x, this.footPos.y, this.footPos.z) ??
      null;
    if (proxAnim && proxAnim.trigger()) {
      this.refreshTargetedInteractable(true);
      return true;
    }
    if (inPlayZone && this.onTriggerGolfSimulatorShot?.()) {
      this.beginFirstPersonGolfShot();
      this.refreshTargetedInteractable(true);
      return true;
    }
    return false;
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
    this.wasInGolfAutoSwingStance = this.getGolfSimulatorZoneStatus(
      this.footPos
    ).inAutoSwingStance;
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
    this.dragLookPointerId = null;
    this.touchForwardInput = 0;
    this.touchStrafeInput = 0;
    this.touchSprint = false;
    this.touchLookYaw = 0;
    this.touchLookPitch = 0;
    this.lookDirty = false;
    this.targetedMesh = null;
    this.targetedPrompt = null;
    this.wasInGolfAutoSwingStance = false;
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
    this.wasInGolfAutoSwingStance = this.getGolfSimulatorZoneStatus(
      this.footPos
    ).inAutoSwingStance;
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
    const rawPrompt = nextMesh ? this.describeInteractable(nextMesh) : null;
    const proxAnim =
      this.getProximityAnimatedInteractable?.(this.footPos.x, this.footPos.y, this.footPos.z) ??
      null;
    const activeFpPose = this.getActiveFirstPersonPose?.() ?? null;
    if (activeFpPose !== null) {
      const activePrompt = proxAnim?.prompt ?? (rawPrompt && rawPrompt.length > 0 ? rawPrompt : null);
      if (nextMesh !== this.targetedMesh || activePrompt !== this.targetedPrompt) {
        this.targetedMesh = nextMesh;
        this.targetedPrompt = activePrompt;
        this.emit();
      }
      return;
    }
    const { inPlayZone } = this.getGolfSimulatorZoneStatus(this.footPos);
    const rawGolfPrompt =
      inPlayZone && (!rawPrompt || rawPrompt.includes('Golf Simulator Mat'))
        ? (this.getGolfSimulatorPrompt?.() ?? null)
        : null;
    const golfProximityPrompt =
      rawGolfPrompt && rawGolfPrompt.length > 0 ? rawGolfPrompt : null;
    const nextPrompt =
      ladderPrompt ??
      golfProximityPrompt ??
      (rawPrompt && rawPrompt.length > 0 ? rawPrompt : (proxAnim?.prompt ?? null));
    if (nextMesh !== this.targetedMesh || nextPrompt !== this.targetedPrompt) {
      this.targetedMesh = nextMesh;
      this.targetedPrompt = nextPrompt;
      this.emit();
    }
  }

  private syncCameraFromFootAndAngles(
    bobOffsetY: number,
    rollRad = 0,
    pitchNodRad = 0
  ): void {
    syncWalkthroughCameraPose(
      this.rig,
      this.footPos,
      this.currentEyeHeight,
      this.jumpOffsetY,
      bobOffsetY,
      this.yawRad,
      THREE.MathUtils.clamp(this.pitchRad + pitchNodRad, -MAX_PITCH_RAD, MAX_PITCH_RAD),
      rollRad
    );
  }

  /**
   * Synchronized First-Person Camera Choreography for the Golf Simulator Shot (`0.00s -> 4.55s`):
   * 1. (`0.00s -> 0.28s`): Steps/turns to the Callaway Tour Golf Bag (`u = 16.18, v = 4.38`) and looks down
   *    at the top divider cuff as the club is grabbed and lifted up out of the bag into 1PV hands.
   * 2. (`0.28s -> 0.72s`): Steps from the golf bag to the Tee Box Address Stance (`u = 16.36, v = 3.92`)
   *    with natural footsteps, looking down over the hands & clubhead sole at the teed Titleist ball.
   * 3. (`0.72s -> 1.28s`): First-person backswing — eyes stay locked on the teed ball with athletic shoulder coil
   *    while the 3D club sweeps back and up across the right side of the viewport.
   * 4. (`1.28s -> 1.48s`): High-speed downswing through ball impact at `t = 1.48s` (`fovBoost = +3.8°`).
   * 5. (`1.48s -> 1.92s`): Follow-through & head-up release — head turns up and West to face the 16:9 widescreen
   *    impact screen as the 3D ball rockets into the screen (`1.48s -> 1.63s`).
   * 6. (`1.92s -> 3.45s`): Watches the screen fabric ripple and the live projected ball trajectory arc across
   *    the St Andrews fairway onto the green.
   * 7. (`3.45s -> 4.55s`): Steps back to the Callaway Tour Golf Bag, watches the club slide back into the bag
   *    divider cuff, and restores free first-person view.
   */
  private stepFirstPersonGolfShot(t: number, dtSeconds: number): void {
    this.lookDirty = false;
    this.glideTargetFoot = null;
    this.jumpOffsetY = 0;
    this.verticalVelocity = 0;

    const start = this.golfShotStartPose ?? {
      startU: 16.22,
      startV: 4.18,
      startFootY: -0.34,
      startYaw: computeOutbuildingLookAtYaw(16.22, 4.18, 16.03, 5.01),
      startPitch: -0.36,
      startEyeH: STANDING_EYE_HEIGHT,
    };

    const bagStandU = 16.22;
    const bagStandV = 4.18;
    const teeStandU = 16.36;
    const teeStandV = 3.92;
    const simFloorY = -0.34;

    const bagLookYaw = computeOutbuildingLookAtYaw(bagStandU, bagStandV, 16.03, 5.01);
    const bagLookPitch = -0.36;
    const ballLookYaw = computeOutbuildingLookAtYaw(teeStandU, teeStandV, 16.22, 3.35);
    const ballLookPitch = -0.5;
    const screenLookYaw = computeOutbuildingLookAtYaw(teeStandU, teeStandV, 13.13, 3.35);
    const screenLookPitch = -0.02;

    let obU = teeStandU;
    let obV = teeStandV;
    let footY = simFloorY;
    let yaw = screenLookYaw;
    let pitch = screenLookPitch;
    let eyeH = STANDING_EYE_HEIGHT;
    let bobOffsetY = 0;
    let rollRad = 0;
    let fovBoost = 0;

    if (t <= 0.28) {
      const u = smoothstep(0, 0.28, t);
      const lookU = smoothstep(0, 0.2, t);
      obU = THREE.MathUtils.lerp(start.startU, bagStandU, u);
      obV = THREE.MathUtils.lerp(start.startV, bagStandV, u);
      footY = THREE.MathUtils.lerp(start.startFootY, simFloorY, u);
      yaw = lerpAngle(start.startYaw, bagLookYaw, lookU);
      pitch = THREE.MathUtils.lerp(start.startPitch, bagLookPitch, lookU);
      eyeH = THREE.MathUtils.lerp(start.startEyeH, 1.46, Math.sin(u * Math.PI * 0.85));
      rollRad = -0.025 * Math.sin(u * Math.PI);
    } else if (t <= 0.72) {
      const u = smoothstep(0.28, 0.72, t);
      obU = THREE.MathUtils.lerp(bagStandU, teeStandU, u);
      obV = THREE.MathUtils.lerp(bagStandV, teeStandV, u);
      yaw = lerpAngle(bagLookYaw, ballLookYaw, u);
      pitch = THREE.MathUtils.lerp(bagLookPitch, ballLookPitch, u);
      eyeH = THREE.MathUtils.lerp(1.46, 1.52, u);
      bobOffsetY = Math.sin(u * Math.PI * 2) * 0.016;
      rollRad = Math.sin(u * Math.PI * 2) * 0.014;
    } else if (t <= 1.28) {
      const u = smoothstep(0.72, 1.28, t);
      obU = teeStandU;
      obV = teeStandV;
      yaw = ballLookYaw - u * 0.09;
      pitch = ballLookPitch - u * 0.03;
      eyeH = 1.52 - u * 0.04;
      rollRad = -u * 0.055;
    } else if (t <= 1.48) {
      const rawU = THREE.MathUtils.clamp((t - 1.28) / 0.2, 0, 1);
      const u = Math.pow(rawU, 2.0);
      const rem = 1 - u;
      obU = teeStandU;
      obV = teeStandV;
      yaw = ballLookYaw - rem * 0.09 + u * 0.12;
      pitch = ballLookPitch - rem * 0.03 + u * 0.06;
      eyeH = 1.48 + u * 0.05;
      rollRad = -rem * 0.055 + u * 0.035;
      fovBoost = u * 3.8;
    } else if (t <= 1.92) {
      const rawU = THREE.MathUtils.clamp((t - 1.48) / 0.44, 0, 1);
      const u = 1 - Math.pow(1 - rawU, 2.6);
      obU = teeStandU;
      obV = teeStandV;
      yaw = lerpAngle(ballLookYaw + 0.12, screenLookYaw, u);
      pitch = THREE.MathUtils.lerp(ballLookPitch + 0.06, screenLookPitch, u);
      eyeH = THREE.MathUtils.lerp(1.53, 1.62, u);
      rollRad = THREE.MathUtils.lerp(0.035, 0.016, u);
      fovBoost = (1 - u) * 3.8;
    } else if (t <= 3.45) {
      const u = THREE.MathUtils.clamp((t - 1.92) / 1.53, 0, 1);
      obU = teeStandU;
      obV = teeStandV;
      yaw = screenLookYaw;
      pitch = screenLookPitch + Math.sin(u * Math.PI) * 0.065;
      eyeH = 1.62;
      rollRad = 0.016 * (1 - u);
    } else if (t <= 4.1) {
      const u = smoothstep(3.45, 4.1, t);
      obU = THREE.MathUtils.lerp(teeStandU, bagStandU, u);
      obV = THREE.MathUtils.lerp(teeStandV, bagStandV, u);
      yaw = lerpAngle(screenLookYaw, bagLookYaw, u);
      pitch = THREE.MathUtils.lerp(screenLookPitch, -0.36, u);
      eyeH = THREE.MathUtils.lerp(1.62, 1.5, u);
      bobOffsetY = Math.sin(u * Math.PI * 2) * 0.014;
      rollRad = Math.sin(u * Math.PI * 2) * 0.012;
    } else {
      const u = smoothstep(4.1, 4.55, t);
      const finishBayYaw = computeOutbuildingLookAtYaw(bagStandU, bagStandV, 14.2, 3.85);
      obU = bagStandU;
      obV = bagStandV;
      yaw = lerpAngle(bagLookYaw, finishBayYaw, smoothstep(0.35, 1.0, u));
      pitch = THREE.MathUtils.lerp(-0.36, -0.1, smoothstep(0.25, 1.0, u));
      eyeH = THREE.MathUtils.lerp(1.5, STANDING_EYE_HEIGHT, u);
    }

    const worldPos = outbuildingLocalToWorld(obU, obV);
    this.footPos.set(worldPos.wx, footY, worldPos.wz);
    this.yawRad = yaw;
    this.pitchRad = pitch;
    this.targetYawRad = yaw;
    this.targetPitchRad = pitch;
    this.currentEyeHeight = eyeH;

    const desiredFov = this.baseFov + fovBoost;
    if (Math.abs(this.currentFov - desiredFov) > 0.02) {
      this.currentFov = THREE.MathUtils.lerp(
        this.currentFov,
        desiredFov,
        1 - Math.exp(-14 * dtSeconds)
      );
      this.rig.perspCamera.fov = this.currentFov;
      this.rig.perspCamera.updateProjectionMatrix();
    }

    this.syncCameraFromFootAndAngles(bobOffsetY, rollRad, 0);
    this.refreshTargetedInteractable();
    this.onPoseUpdated();
    this.saveSessionState(false);
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

    if (Math.abs(this.touchLookYaw) > 1e-4 || Math.abs(this.touchLookPitch) > 1e-4) {
      const curvedYaw =
        Math.sign(this.touchLookYaw) * Math.pow(Math.abs(this.touchLookYaw), 1.35);
      const curvedPitch =
        Math.sign(this.touchLookPitch) * Math.pow(Math.abs(this.touchLookPitch), 1.35);
      const TOUCH_LOOK_YAW_SPEED_RAD = 2.45;
      const TOUCH_LOOK_PITCH_SPEED_RAD = 1.65;
      this.targetYawRad -= curvedYaw * TOUCH_LOOK_YAW_SPEED_RAD * dtSeconds;
      this.targetPitchRad = THREE.MathUtils.clamp(
        this.targetPitchRad + curvedPitch * TOUCH_LOOK_PITCH_SPEED_RAD * dtSeconds,
        -MAX_PITCH_RAD,
        MAX_PITCH_RAD
      );
      this.lookDirty = true;
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
        this.keysDown,
        this.touchForwardInput,
        this.touchStrafeInput,
        this.touchSprint
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

      this.syncCameraFromFootAndAngles(
        ladderStep.bobOffsetY,
        ladderStep.rollRad,
        ladderStep.pitchNodRad
      );
      this.refreshTargetedInteractable();
      this.onPoseUpdated();
      this.saveSessionState(false);
      return true;
    }

    const golfElapsedSec = this.getGolfSimulatorShotElapsedSec?.() ?? null;
    if (golfElapsedSec !== null) {
      if (!this.golfShotStartPose) {
        this.beginFirstPersonGolfShot();
      }
      this.stepFirstPersonGolfShot(golfElapsedSec, dtSeconds);
      return true;
    }
    if (this.golfShotStartPose !== null) {
      this.golfShotStartPose = null;
      this.wasInGolfAutoSwingStance = true;
    }

    const fpSample = this.getActiveFirstPersonPose?.() ?? null;
    if (fpSample !== null) {
      this.lookDirty = false;
      this.glideTargetFoot = null;
      this.jumpOffsetY = 0;
      this.verticalVelocity = 0;
      this.groundVelX = 0;
      this.groundVelZ = 0;
      const [fx, fy, fz] = fpSample.footPosition;
      const [ex, ey, ez] = fpSample.eyePosition;
      this.footPos.set(fx, fy, fz);
      this.yawRad = fpSample.yawRad;
      this.pitchRad = fpSample.pitchRad;
      this.targetYawRad = fpSample.yawRad;
      this.targetPitchRad = fpSample.pitchRad;
      this.currentEyeHeight = Math.max(0.25, ey - fy);

      const desiredFpFov = this.baseFov + (fpSample.fovBoostDeg ?? 0);
      if (Math.abs(this.currentFov - desiredFpFov) > 0.02) {
        this.currentFov = THREE.MathUtils.lerp(
          this.currentFov,
          desiredFpFov,
          1 - Math.exp(-12 * dtSeconds)
        );
        this.rig.perspCamera.fov = this.currentFov;
        this.rig.perspCamera.updateProjectionMatrix();
      }

      this.syncCameraFromFootAndAngles(0, fpSample.rollRad ?? 0, 0);
      this.rig.perspCamera.position.set(ex, ey, ez);
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
      const eyeRate = this.footPos.y >= 1.5 && this.currentEyeHeight > targetEyeH ? 24 : 14;
      this.currentEyeHeight = THREE.MathUtils.lerp(
        this.currentEyeHeight,
        targetEyeH,
        1 - Math.exp(-eyeRate * dtSeconds)
      );
      movedOrRotated = true;
    }

    if (this.jumpOffsetY > 0 || this.verticalVelocity !== 0) {
      this.jumpOffsetY += this.verticalVelocity * dtSeconds;
      this.verticalVelocity -= GRAVITY_MPS2 * dtSeconds;
      if (this.footPos.y >= 1.8 && targetEyeH < STANDING_EYE_HEIGHT - 0.1) {
        this.jumpOffsetY = 0;
        this.verticalVelocity = 0;
      } else if (this.jumpOffsetY <= 0) {
        this.jumpOffsetY = 0;
        this.verticalVelocity = 0;
      }
      movedOrRotated = true;
    }



    let forwardInput = this.touchForwardInput;
    let strafeInput = this.touchStrafeInput;
    if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) forwardInput += 1;
    if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) forwardInput -= 1;
    if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) strafeInput += 1;
    if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) strafeInput -= 1;
    forwardInput = THREE.MathUtils.clamp(forwardInput, -1, 1);
    strafeInput = THREE.MathUtils.clamp(strafeInput, -1, 1);

    const inputMag = Math.min(1, Math.hypot(forwardInput, strafeInput));
    const isMoving = inputMag > 0.02;
    const isSprinting =
      isMoving &&
      !this.crouched &&
      (this.touchSprint || this.keysDown.has('ShiftLeft') || this.keysDown.has('ShiftRight'));
    this.isCurrentlySprinting = isSprinting;
    const baseSpeed = this.crouched ? CROUCH_SPEED_MPS : isSprinting ? SPRINT_SPEED_MPS : WALK_SPEED_MPS;
    const speed = baseSpeed * inputMag;

    const targetFov = this.baseFov + (isSprinting ? SPRINT_FOV_BOOST : 0);
    if (Math.abs(this.currentFov - targetFov) > 0.05) {
      this.currentFov = THREE.MathUtils.lerp(this.currentFov, targetFov, 1 - Math.exp(-10 * dtSeconds));
      this.rig.perspCamera.fov = this.currentFov;
      this.rig.perspCamera.updateProjectionMatrix();
      movedOrRotated = true;
    }

    const forwardX = -Math.sin(this.yawRad);
    const forwardZ = -Math.cos(this.yawRad);
    const rightX = Math.cos(this.yawRad);
    const rightZ = -Math.sin(this.yawRad);
    const rawMoveX = forwardX * forwardInput + rightX * strafeInput;
    const rawMoveZ = forwardZ * forwardInput + rightZ * strafeInput;
    const rawMoveLen = Math.hypot(rawMoveX, rawMoveZ);
    const desiredVx = rawMoveLen > 1e-4 ? (rawMoveX / rawMoveLen) * speed : 0;
    const desiredVz = rawMoveLen > 1e-4 ? (rawMoveZ / rawMoveLen) * speed : 0;
    const velRate = isMoving ? 22 : 26;
    const velAlpha = 1 - Math.exp(-velRate * dtSeconds);
    this.groundVelX = THREE.MathUtils.lerp(this.groundVelX, desiredVx, velAlpha);
    this.groundVelZ = THREE.MathUtils.lerp(this.groundVelZ, desiredVz, velAlpha);
    const groundSpeed = Math.hypot(this.groundVelX, this.groundVelZ);
    if (!isMoving && groundSpeed < 0.03) {
      this.groundVelX = 0;
      this.groundVelZ = 0;
    }

    if (isMoving || groundSpeed >= 0.03) {
      this.glideTargetFoot = null;
      const moveVec = new THREE.Vector3(this.groundVelX, 0, this.groundVelZ);
      if (moveVec.lengthSq() > 1e-5) {
        moveVec.normalize();
        if (
          isMoving &&
          this.ladderClimb.checkAutoMountOnMovement(
            this.footPos,
            moveVec,
            forwardInput,
            this.yawRad,
            this.pitchRad,
            this.currentEyeHeight,
            this.keysDown,
            this.touchForwardInput
          )
        ) {
          this.jumpOffsetY = 0;
          this.verticalVelocity = 0;
          this.groundVelX = 0;
          this.groundVelZ = 0;
          movedOrRotated = true;
        } else {
          const stepDist = groundSpeed * dtSeconds;
          this.targetYawRad = this.collisionAndBarge.stepHorizontalMovement(
            this.footPos,
            moveVec,
            forwardInput,
            this.targetYawRad,
            stepDist,
            this.currentEyeHeight,
            this.isCurrentlySprinting,
            dtSeconds
          );
          const actualMoved = this.collisionAndBarge.getLastMovedDistance();
          const movedRatio = THREE.MathUtils.clamp(
            actualMoved / Math.max(1e-4, stepDist),
            0,
            1
          );
          if (movedRatio < 0.08) {
            // Blocked head-on by a wall or corner: damp velocity and settle head-bob to rest
            this.groundVelX *= 0.25;
            this.groundVelZ *= 0.25;
            if (Math.abs(Math.sin(this.bobPhase)) > 1e-3) {
              const nearestZeroPhase = Math.round(this.bobPhase / Math.PI) * Math.PI;
              this.bobPhase = THREE.MathUtils.lerp(
                this.bobPhase,
                nearestZeroPhase,
                1 - Math.exp(-18 * dtSeconds)
              );
            }
          } else {
            const speedScale = THREE.MathUtils.clamp(groundSpeed / WALK_SPEED_MPS, 0.35, 1.45);
            this.bobPhase +=
              dtSeconds * (isSprinting ? 13.0 : 9.0) * movedRatio * Math.min(1, speedScale);
          }
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
    } else if (Math.abs(Math.sin(this.bobPhase)) > 1e-3) {
      const nearestZeroPhase = Math.round(this.bobPhase / Math.PI) * Math.PI;
      this.bobPhase = THREE.MathUtils.lerp(
        this.bobPhase,
        nearestZeroPhase,
        1 - Math.exp(-16 * dtSeconds)
      );
      if (Math.abs(this.bobPhase - nearestZeroPhase) <= 1e-3) {
        this.bobPhase = 0;
      }
      movedOrRotated = true;
    }

    const { inAutoSwingStance } = this.getGolfSimulatorZoneStatus(this.footPos);
    if (inAutoSwingStance && !this.wasInGolfAutoSwingStance) {
      if (this.onTriggerGolfSimulatorShot?.()) {
        this.beginFirstPersonGolfShot();
        this.refreshTargetedInteractable(true);
      }
    }
    this.wasInGolfAutoSwingStance = inAutoSwingStance;

    const stairKinematics = this.ladderClimb.sampleManualStairWalkKinematics(
      dtSeconds,
      this.footPos,
      (isMoving || Boolean(this.glideTargetFoot)) && this.jumpOffsetY === 0,
      isSprinting
    );
    if (
      stairKinematics.onStairs ||
      Math.abs(stairKinematics.rollRad) > 1e-4 ||
      Math.abs(stairKinematics.bobOffsetY) > 1e-4 ||
      Math.abs(stairKinematics.pitchNodRad) > 1e-4
    ) {
      movedOrRotated = true;
    }

    if (stairKinematics.fovBoost > 0.02) {
      const stairTargetFov =
        this.baseFov + (isSprinting ? SPRINT_FOV_BOOST : 0) + stairKinematics.fovBoost;
      this.currentFov = THREE.MathUtils.lerp(
        this.currentFov,
        stairTargetFov,
        1 - Math.exp(-10 * dtSeconds)
      );
      this.rig.perspCamera.fov = this.currentFov;
      this.rig.perspCamera.updateProjectionMatrix();
    }

    if (movedOrRotated) {
      const flatWalkBob =
        this.jumpOffsetY === 0
          ? Math.sin(this.bobPhase) * (isSprinting ? 0.022 : 0.015)
          : 0;
      const bobOffset = stairKinematics.onStairs
        ? stairKinematics.bobOffsetY + flatWalkBob * 0.25
        : flatWalkBob + stairKinematics.bobOffsetY;
      this.syncCameraFromFootAndAngles(
        bobOffset,
        stairKinematics.rollRad,
        stairKinematics.pitchNodRad
      );
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
      if (e.pointerType === 'touch') {
        // Multi-touch guard: if a finger is already looking around on the canvas,
        // ignore any secondary finger touching the canvas so walking + looking never conflict.
        if (this.dragLookPointerId !== null) return;
        try {
          this.canvas.setPointerCapture(e.pointerId);
        } catch {
          // Ignore synthetic pointer capture errors
        }
      } else {
        try {
          this.canvas.requestPointerLock?.();
        } catch {
          // Fallback to drag look
        }
      }
      this.isDraggingLook = true;
      this.dragLookPointerId = e.pointerId;
      this.lastDragClientX = e.clientX;
      this.lastDragClientY = e.clientY;
      this.dragLookStartX = e.clientX;
      this.dragLookStartY = e.clientY;
      this.dragLookStartTimeMs = performance.now();
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
        if (
          this.isDraggingLook &&
          e.pointerId === this.dragLookPointerId &&
          (e.pointerType === 'touch' || (e.buttons & 1) !== 0)
        ) {
          const dx = e.clientX - this.lastDragClientX;
          const dy = e.clientY - this.lastDragClientY;
          this.lastDragClientX = e.clientX;
          this.lastDragClientY = e.clientY;
          if (e.pointerType === 'touch') {
            const speedPx = Math.hypot(dx, dy);
            const accel = 1 + Math.min(0.65, speedPx * 0.018);
            const yawSens = 0.0088 * accel;
            const pitchSens = 0.0072 * accel;
            this.targetYawRad -= dx * yawSens;
            this.targetPitchRad = THREE.MathUtils.clamp(
              this.targetPitchRad - dy * pitchSens,
              -MAX_PITCH_RAD,
              MAX_PITCH_RAD
            );
          } else {
            this.targetYawRad -= dx * DRAG_SENSITIVITY;
            this.targetPitchRad = THREE.MathUtils.clamp(
              this.targetPitchRad - dy * DRAG_SENSITIVITY,
              -MAX_PITCH_RAD,
              MAX_PITCH_RAD
            );
          }
          this.lookDirty = true;
        }
      },
      { passive: true }
    );

    const endDragLook = (e: PointerEvent): void => {
      if (this.dragLookPointerId !== null && e.pointerId === this.dragLookPointerId) {
        const wasTap =
          e.type === 'pointerup' &&
          e.pointerType === 'touch' &&
          Math.hypot(e.clientX - this.dragLookStartX, e.clientY - this.dragLookStartY) < 10 &&
          performance.now() - this.dragLookStartTimeMs < 260;
        this.isDraggingLook = false;
        this.dragLookPointerId = null;
        try {
          if (this.canvas.hasPointerCapture(e.pointerId)) {
            this.canvas.releasePointerCapture(e.pointerId);
          }
        } catch {
          // Ignore pointer capture release errors
        }
        if (wasTap && this.targetedPrompt !== null) {
          this.triggerTargetedInteraction();
        }
      }
    };
    window.addEventListener('pointerup', endDragLook);
    window.addEventListener('pointercancel', endDragLook);

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
        this.jump();
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
      this.dragLookPointerId = null;
      this.touchForwardInput = 0;
      this.touchStrafeInput = 0;
      this.touchSprint = false;
      this.touchLookYaw = 0;
      this.touchLookPitch = 0;
      this.groundVelX = 0;
      this.groundVelZ = 0;
    });
  }
}
