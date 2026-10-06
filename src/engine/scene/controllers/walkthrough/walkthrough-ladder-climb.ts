import * as THREE from 'three';
import {
  getWalkthroughTargetEyeHeight,
  OB_COS,
  OB_SIN,
  outbuildingLocalToWorld,
  worldToOutbuildingLocal,
} from './walkthrough-elevation-solver.ts';
import { MAX_PITCH_RAD, STANDING_EYE_HEIGHT } from './walkthrough-spawns.ts';

export type LadderClimbPhase =
  | 'idle'
  | 'mounting_bottom'
  | 'climbing'
  | 'mantling_top'
  | 'mounting_top'
  | 'dismounting_bottom';

const LADDER_CENTER_U = 14.21;
const LADDER_CLIMB_STAND_V = 0.85;
const LADDER_DISMOUNT_BOTTOM_V = 0.76;
const LADDER_LOFT_LANDING_V = 1.76;
const LADDER_BOTTOM_FOOT_Y = -0.34;
const LADDER_FIRST_RUNG_FOOT_Y = -0.18;
const LADDER_MANTLE_START_FOOT_Y = 1.96;
const LADDER_TOP_MOUNT_END_FOOT_Y = 1.88;
const LADDER_TOP_LOFT_FOOT_Y = 2.61;
const LADDER_RUNG_SPACING = 0.272;

// Facing South (+obV) toward the ladder wall at v = 1.24m
const LADDER_FACE_SOUTH_YAW = Math.atan2(-OB_SIN, -OB_COS);

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

export interface LadderStepResult {
  readonly active: boolean;
  readonly yawRad: number;
  readonly pitchRad: number;
  readonly targetYawRad: number;
  readonly targetPitchRad: number;
  readonly currentEyeHeight: number;
  readonly bobOffsetY: number;
  readonly rollRad: number;
  readonly fovBoost: number;
}

/**
 * Call-of-Duty-Style First-Person Ladder Climb & Top-of-Ladder Mantle Controller
 * for `outbuildings.store.loftLadder` -> `outbuildings.store.loftFloor` (`+2.61m`).
 */
export class WalkthroughLadderClimbController {
  private phase: LadderClimbPhase = 'idle';
  private phaseElapsed = 0;

  private startObU = LADDER_CENTER_U;
  private startObV = LADDER_CLIMB_STAND_V;
  private startFootY = LADDER_BOTTOM_FOOT_Y;
  private startYawRad = LADDER_FACE_SOUTH_YAW;
  private startPitchRad = 0;
  private startEyeHeight = STANDING_EYE_HEIGHT;

  private autoClimbDir: -1 | 0 | 1 = 0;
  private topMountForwardKeyHeld = false;
  private currentRollRad = 0;

  public isActive(): boolean {
    return this.phase !== 'idle';
  }

  public getPhase(): LadderClimbPhase {
    return this.phase;
  }

  public getCurrentRollRad(): number {
    return this.currentRollRad;
  }

  public reset(): void {
    this.phase = 'idle';
    this.phaseElapsed = 0;
    this.autoClimbDir = 0;
    this.topMountForwardKeyHeld = false;
    this.currentRollRad = 0;
  }

  /**
   * Returns a context-sensitive HUD interaction prompt when near or on the Store Loft ladder.
   */
  public getProximityLadderPrompt(footPos: THREE.Vector3, targetedMesh: THREE.Object3D | null): string | null {
    if (this.phase === 'climbing') {
      return footPos.y >= 1.45
        ? 'Mantle onto Storage Loft [W / Space / F]'
        : 'Climb Ladder [W Up · S Down · Space Jump Off]';
    }
    if (this.phase !== 'idle') {
      return null;
    }

    const isTargetingLadder = Boolean(
      targetedMesh &&
        ((targetedMesh.userData as Record<string, unknown> | undefined)?.isClimbableLadder === true ||
          targetedMesh.name.startsWith('outbuildings.store.loftLadder'))
    );
    const { obU, obV } = worldToOutbuildingLocal(footPos.x, footPos.z);

    if (footPos.y >= 2.15) {
      if (isTargetingLadder || (obU >= 13.72 && obU <= 14.70 && obV >= 1.15 && obV <= 1.82)) {
        return 'Descend Loft Ladder';
      }
      return null;
    }

    if (isTargetingLadder || (footPos.y <= 0.45 && obU >= 13.78 && obU <= 14.64 && obV >= 0.52 && obV <= 1.25)) {
      return 'Climb Loft Ladder';
    }

    return null;
  }

  /**
   * Handles pressing `[F]` or left-clicking when targeting or standing at the Store Loft ladder.
   */
  public tryTriggerInteraction(
    footPos: THREE.Vector3,
    yawRad: number,
    pitchRad: number,
    currentEyeHeight: number,
    targetedMesh: THREE.Object3D | null
  ): boolean {
    if (this.phase === 'climbing') {
      if (footPos.y >= 1.35) {
        this.beginTopMantle(footPos, yawRad, pitchRad, currentEyeHeight);
      } else {
        this.autoClimbDir = this.autoClimbDir === 1 ? -1 : 1;
      }
      return true;
    }
    if (this.phase !== 'idle') {
      return false;
    }

    const isTargetingLadder = Boolean(
      targetedMesh &&
        ((targetedMesh.userData as Record<string, unknown> | undefined)?.isClimbableLadder === true ||
          targetedMesh.name.startsWith('outbuildings.store.loftLadder'))
    );
    const { obU, obV } = worldToOutbuildingLocal(footPos.x, footPos.z);

    if (footPos.y >= 2.0) {
      if (isTargetingLadder || (obU >= 13.55 && obU <= 14.85 && obV >= 1.12 && obV <= 2.15)) {
        this.beginTopMount(footPos, yawRad, pitchRad, currentEyeHeight, -1, false);
        return true;
      }
      return false;
    }

    if (
      isTargetingLadder ||
      (footPos.y <= 0.5 && obU >= 13.55 && obU <= 14.85 && obV >= 0.35 && obV <= 1.30)
    ) {
      this.beginBottomMount(footPos, yawRad, pitchRad, currentEyeHeight, 1);
      return true;
    }

    return false;
  }

  /**
   * Handles pressing `Space` while on the ladder (either mantling at the top or kicking off backward).
   */
  public tryHandleSpaceJump(
    footPos: THREE.Vector3,
    yawRad: number,
    pitchRad: number,
    currentEyeHeight: number
  ): { readonly handled: boolean; readonly kickBackVelocityY: number } {
    if (this.phase === 'idle') {
      return { handled: false, kickBackVelocityY: 0 };
    }
    if (this.phase === 'climbing') {
      if (footPos.y >= 1.45) {
        this.beginTopMantle(footPos, yawRad, pitchRad, currentEyeHeight);
        return { handled: true, kickBackVelocityY: 0 };
      }
      // Kick backward off the ladder into the Store North corridor
      const { wx, wz } = outbuildingLocalToWorld(LADDER_CENTER_U, LADDER_DISMOUNT_BOTTOM_V);
      footPos.x = wx;
      footPos.z = wz;
      footPos.y = Math.max(LADDER_BOTTOM_FOOT_Y, footPos.y - 0.12);
      this.reset();
      return { handled: true, kickBackVelocityY: 2.35 };
    }
    return { handled: true, kickBackVelocityY: 0 };
  }

  /**
   * Checks if walking into the bottom of the ladder (or walking into the top loft ladder opening)
   * should automatically latch the player onto the ladder in 1PV.
   */
  public checkAutoMountOnMovement(
    footPos: THREE.Vector3,
    moveVec: THREE.Vector3,
    forwardInput: number,
    yawRad: number,
    pitchRad: number,
    currentEyeHeight: number,
    keysDown: ReadonlySet<string>
  ): boolean {
    if (this.phase !== 'idle') return true;

    const { obU, obV } = worldToOutbuildingLocal(footPos.x, footPos.z);
    const moveU = moveVec.x * OB_COS - moveVec.z * OB_SIN;
    const moveV = moveVec.x * OB_SIN + moveVec.z * OB_COS;

    // 1. Bottom Corridor Auto-Mount (`obU = 13.90..14.52m, obV = 0.72..1.25m, footY <= 0.35m`)
    if (
      footPos.y <= 0.35 &&
      forwardInput > 0 &&
      obU >= 13.90 &&
      obU <= 14.52 &&
      obV >= 0.72 &&
      obV <= 1.25 &&
      moveV > 0.38 &&
      Math.abs(moveU) < 0.85
    ) {
      const lookDelta = Math.abs(shortestAngleDelta(yawRad, LADDER_FACE_SOUTH_YAW));
      if (lookDelta <= Math.PI * 0.44) {
        this.beginBottomMount(footPos, yawRad, pitchRad, currentEyeHeight, 0);
        return true;
      }
    }

    // 2. Top Store Loft Auto-Mount (`obU = 13.90..14.52m, obV <= 1.48m, footY >= 2.15m`)
    if (
      footPos.y >= 2.15 &&
      obU >= 13.90 &&
      obU <= 14.52 &&
      obV <= 1.48 &&
      moveV < -0.34
    ) {
      const forwardHeld = keysDown.has('KeyW') || keysDown.has('ArrowUp');
      this.beginTopMount(footPos, yawRad, pitchRad, currentEyeHeight, -1, forwardHeld);
      return true;
    }

    return false;
  }

  private beginBottomMount(
    footPos: THREE.Vector3,
    yawRad: number,
    pitchRad: number,
    currentEyeHeight: number,
    autoClimbDir: -1 | 0 | 1
  ): void {
    const { obU, obV } = worldToOutbuildingLocal(footPos.x, footPos.z);
    this.phase = 'mounting_bottom';
    this.phaseElapsed = 0;
    this.startObU = obU;
    this.startObV = obV;
    this.startFootY = footPos.y;
    this.startYawRad = yawRad;
    this.startPitchRad = pitchRad;
    this.startEyeHeight = currentEyeHeight;
    this.autoClimbDir = autoClimbDir;
    this.topMountForwardKeyHeld = false;
  }

  private beginTopMount(
    footPos: THREE.Vector3,
    yawRad: number,
    pitchRad: number,
    currentEyeHeight: number,
    autoClimbDir: -1 | 0 | 1,
    forwardHeld: boolean
  ): void {
    const { obU, obV } = worldToOutbuildingLocal(footPos.x, footPos.z);
    this.phase = 'mounting_top';
    this.phaseElapsed = 0;
    this.startObU = obU;
    this.startObV = obV;
    this.startFootY = footPos.y;
    this.startYawRad = yawRad;
    this.startPitchRad = pitchRad;
    this.startEyeHeight = currentEyeHeight;
    this.autoClimbDir = autoClimbDir;
    this.topMountForwardKeyHeld = forwardHeld;
  }

  private beginTopMantle(
    footPos: THREE.Vector3,
    yawRad: number,
    pitchRad: number,
    currentEyeHeight: number
  ): void {
    const { obU, obV } = worldToOutbuildingLocal(footPos.x, footPos.z);
    this.phase = 'mantling_top';
    this.phaseElapsed = 0;
    this.startObU = obU;
    this.startObV = obV;
    this.startFootY = footPos.y;
    this.startYawRad = yawRad;
    this.startPitchRad = pitchRad;
    this.startEyeHeight = currentEyeHeight;
    this.autoClimbDir = 0;
  }

  private beginBottomDismount(
    footPos: THREE.Vector3,
    yawRad: number,
    pitchRad: number,
    currentEyeHeight: number
  ): void {
    const { obU, obV } = worldToOutbuildingLocal(footPos.x, footPos.z);
    this.phase = 'dismounting_bottom';
    this.phaseElapsed = 0;
    this.startObU = obU;
    this.startObV = obV;
    this.startFootY = footPos.y;
    this.startYawRad = yawRad;
    this.startPitchRad = pitchRad;
    this.startEyeHeight = currentEyeHeight;
    this.autoClimbDir = 0;
  }

  /**
   * Advances the Call-of-Duty ladder climb & mantle state machine for the current frame.
   */
  public step(
    dtSeconds: number,
    footPos: THREE.Vector3,
    yawRad: number,
    pitchRad: number,
    targetYawRad: number,
    targetPitchRad: number,
    currentEyeHeight: number,
    crouched: boolean,
    keysDown: ReadonlySet<string>
  ): LadderStepResult {
    if (this.phase === 'idle') {
      if (Math.abs(this.currentRollRad) > 1e-4) {
        this.currentRollRad = THREE.MathUtils.lerp(
          this.currentRollRad,
          0,
          1 - Math.exp(-18 * dtSeconds)
        );
      } else {
        this.currentRollRad = 0;
      }
      return {
        active: false,
        yawRad,
        pitchRad,
        targetYawRad,
        targetPitchRad,
        currentEyeHeight,
        bobOffsetY: 0,
        rollRad: this.currentRollRad,
        fovBoost: 0,
      };
    }

    this.phaseElapsed += dtSeconds;

    // -------------------------------------------------------------------------
    // Phase 1: Mounting Ladder from Bottom Corridor (`0.24s` Call-of-Duty Latch-On)
    // -------------------------------------------------------------------------
    if (this.phase === 'mounting_bottom') {
      const duration = 0.24;
      const t = THREE.MathUtils.clamp(this.phaseElapsed / duration, 0, 1);
      const ease = smoothstep(0, 1, t);

      const obU = THREE.MathUtils.lerp(this.startObU, LADDER_CENTER_U, ease);
      const obV = THREE.MathUtils.lerp(this.startObV, LADDER_CLIMB_STAND_V, ease);
      const { wx, wz } = outbuildingLocalToWorld(obU, obV);
      footPos.x = wx;
      footPos.z = wz;
      footPos.y = THREE.MathUtils.lerp(this.startFootY, LADDER_FIRST_RUNG_FOOT_Y, ease);

      const nextYaw = lerpAngle(this.startYawRad, LADDER_FACE_SOUTH_YAW, ease);
      const desiredPitch = THREE.MathUtils.clamp(this.startPitchRad, -0.05, 0.32) + 0.14 * Math.sin(t * Math.PI);
      const nextPitch = THREE.MathUtils.lerp(this.startPitchRad, desiredPitch, ease);
      const nextEyeH = THREE.MathUtils.lerp(this.startEyeHeight, 1.56, ease);

      // Crisp hand-grab roll & vertical compression impulse
      const grabImpulse = Math.sin(t * Math.PI);
      this.currentRollRad = -0.034 * grabImpulse;
      const bobOffsetY = -0.024 * grabImpulse;

      if (t >= 1) {
        this.phase = 'climbing';
        this.phaseElapsed = 0;
      }

      return {
        active: true,
        yawRad: nextYaw,
        pitchRad: nextPitch,
        targetYawRad: nextYaw,
        targetPitchRad: nextPitch,
        currentEyeHeight: nextEyeH,
        bobOffsetY,
        rollRad: this.currentRollRad,
        fovBoost: 0.8 * grabImpulse,
      };
    }

    // -------------------------------------------------------------------------
    // Phase 2: Reverse Top-Mount from Store Loft onto Ladder (`0.64s` CoD Vault-On)
    // -------------------------------------------------------------------------
    if (this.phase === 'mounting_top') {
      const duration = 0.64;
      const t = THREE.MathUtils.clamp(this.phaseElapsed / duration, 0, 1);
      const ease = smoothstep(0, 1, t);

      if (!keysDown.has('KeyW') && !keysDown.has('ArrowUp')) {
        this.topMountForwardKeyHeld = false;
      }

      // Swing laterally around the grab hoops and step backward across the v = 1.24m loft nosing
      const swingArcU = Math.sin(t * Math.PI) * 0.036;
      const obU = THREE.MathUtils.lerp(this.startObU, LADDER_CENTER_U, ease) + swingArcU;
      const obV = THREE.MathUtils.lerp(this.startObV, LADDER_CLIMB_STAND_V, ease);
      const { wx, wz } = outbuildingLocalToWorld(obU, obV);
      footPos.x = wx;
      footPos.z = wz;

      const dropT = smoothstep(0.22, 1.0, t);
      footPos.y = THREE.MathUtils.lerp(this.startFootY, LADDER_TOP_MOUNT_END_FOOT_Y, dropT);

      const nextYaw = lerpAngle(this.startYawRad, LADDER_FACE_SOUTH_YAW, smoothstep(0, 0.82, t));
      const lookDownArc = -0.26 * Math.sin(t * Math.PI);
      const nextPitch = THREE.MathUtils.lerp(this.startPitchRad, -0.14, ease) + lookDownArc;
      const nextEyeH = THREE.MathUtils.lerp(this.startEyeHeight, 1.34, dropT);

      // Two-hand grab-rail hoop roll & weight transfer
      this.currentRollRad =
        t < 0.5
          ? -0.052 * Math.sin((t / 0.5) * Math.PI)
          : 0.032 * Math.sin(((t - 0.5) / 0.5) * Math.PI);
      const bobOffsetY = -0.032 * Math.sin(t * Math.PI);

      if (t >= 1) {
        this.phase = 'climbing';
        this.phaseElapsed = 0;
      }

      return {
        active: true,
        yawRad: nextYaw,
        pitchRad: THREE.MathUtils.clamp(nextPitch, -MAX_PITCH_RAD, MAX_PITCH_RAD),
        targetYawRad: nextYaw,
        targetPitchRad: THREE.MathUtils.clamp(nextPitch, -MAX_PITCH_RAD, MAX_PITCH_RAD),
        currentEyeHeight: nextEyeH,
        bobOffsetY,
        rollRad: this.currentRollRad,
        fovBoost: 1.5 * Math.sin(t * Math.PI),
      };
    }

    // -------------------------------------------------------------------------
    // Phase 3: Rung-by-Rung Call-of-Duty Hand-over-Hand Climbing
    // -------------------------------------------------------------------------
    if (this.phase === 'climbing') {
      const wHeld = keysDown.has('KeyW') || keysDown.has('ArrowUp');
      const sHeld = keysDown.has('KeyS') || keysDown.has('ArrowDown');
      const shiftHeld = keysDown.has('ShiftLeft') || keysDown.has('ShiftRight');

      if (!wHeld) {
        this.topMountForwardKeyHeld = false;
      }

      let climbInput = 0;
      if (sHeld) {
        climbInput = -1;
        this.autoClimbDir = 0;
      } else if (wHeld) {
        if (this.topMountForwardKeyHeld || pitchRad < -0.68) {
          // Looking sharply down (< -39°) or continuing top-down mount with W held descends like Call of Duty!
          climbInput = -1;
        } else {
          climbInput = 1;
          this.autoClimbDir = 0;
        }
      } else if (this.autoClimbDir !== 0) {
        climbInput = this.autoClimbDir;
      }

      // Clamp horizontal look within ±68° of the ladder wall while allowing free look
      const clampedYawDelta = THREE.MathUtils.clamp(
        shortestAngleDelta(LADDER_FACE_SOUTH_YAW, targetYawRad),
        -1.18,
        1.18
      );
      const clampedTargetYaw = LADDER_FACE_SOUTH_YAW + clampedYawDelta;
      const recenterWeight = climbInput !== 0 ? 1 - Math.exp(-6.5 * dtSeconds) : 0;
      const desiredYaw =
        climbInput !== 0
          ? lerpAngle(clampedTargetYaw, LADDER_FACE_SOUTH_YAW, recenterWeight * 0.45)
          : clampedTargetYaw;
      const lookAlpha = 1 - Math.exp(-36 * dtSeconds);
      const nextYaw = lerpAngle(yawRad, desiredYaw, lookAlpha);

      const basePitchTarget =
        this.autoClimbDir !== 0
          ? this.autoClimbDir > 0
            ? 0.18
            : -0.24
          : THREE.MathUtils.clamp(targetPitchRad, -1.25, 1.15);

      const baseSpeed =
        climbInput > 0
          ? shiftHeld
            ? 1.98
            : 1.54
          : shiftHeld
            ? 2.18
            : 1.70;

      // Rung phase synchronized to the 10 solid European oak rungs (`0.272m` pitch)
      const prevRungIndex = (footPos.y - LADDER_BOTTOM_FOOT_Y) / LADDER_RUNG_SPACING;
      const prevRungPhase = prevRungIndex * Math.PI;

      // Non-uniform Call-of-Duty hand-over-hand haul velocity pulse per rung
      const haulPulse = 1.0 + 0.30 * Math.sin(prevRungPhase * 2 - Math.PI * 0.25);
      if (climbInput !== 0) {
        footPos.y += climbInput * baseSpeed * haulPulse * dtSeconds;
      }

      const rungIndex = (footPos.y - LADDER_BOTTOM_FOOT_Y) / LADDER_RUNG_SPACING;
      const rungPhase = rungIndex * Math.PI;
      const activeMotionWeight = climbInput !== 0 ? 1.0 : 0.18;

      // Alternating left/right hand-over-hand camera Dutch roll, lateral stile sway & chest pull
      const targetRoll = Math.sin(rungPhase) * 0.036 * activeMotionWeight;
      this.currentRollRad = THREE.MathUtils.lerp(
        this.currentRollRad,
        targetRoll,
        1 - Math.exp(-22 * dtSeconds)
      );

      const swayU = -Math.sin(rungPhase) * 0.022 * activeMotionWeight;
      const pullV = Math.abs(Math.sin(rungPhase)) * 0.018 * activeMotionWeight;
      const { wx, wz } = outbuildingLocalToWorld(
        LADDER_CENTER_U + swayU,
        LADDER_CLIMB_STAND_V + pullV
      );
      footPos.x = wx;
      footPos.z = wz;

      const pitchNod = climbInput !== 0 ? Math.sin(rungPhase * 2) * 0.018 : 0;
      const nextPitch =
        THREE.MathUtils.lerp(pitchRad, basePitchTarget, lookAlpha) + pitchNod;
      const bobOffsetY = climbInput !== 0 ? Math.sin(rungPhase * 2) * 0.014 : 0;

      // Scale eye height smoothly from 1.56m at bottom to 1.32m at top of ladder so head stays below roof eaves
      const climbFrac = THREE.MathUtils.clamp(
        (footPos.y - LADDER_BOTTOM_FOOT_Y) / (LADDER_MANTLE_START_FOOT_Y - LADDER_BOTTOM_FOOT_Y),
        0,
        1
      );
      const desiredEyeH = THREE.MathUtils.lerp(1.56, 1.32, climbFrac);
      const nextEyeH = THREE.MathUtils.lerp(
        currentEyeHeight,
        desiredEyeH,
        1 - Math.exp(-18 * dtSeconds)
      );

      // Check top mantle trigger (`footPos.y >= 1.96m` while climbing up)
      if (climbInput > 0 && footPos.y >= LADDER_MANTLE_START_FOOT_Y) {
        this.beginTopMantle(footPos, nextYaw, nextPitch, nextEyeH);
      } else if (climbInput < 0 && footPos.y <= LADDER_BOTTOM_FOOT_Y + 0.08) {
        this.beginBottomDismount(footPos, nextYaw, nextPitch, nextEyeH);
      }

      return {
        active: true,
        yawRad: nextYaw,
        pitchRad: THREE.MathUtils.clamp(nextPitch, -MAX_PITCH_RAD, MAX_PITCH_RAD),
        targetYawRad: desiredYaw,
        targetPitchRad: basePitchTarget,
        currentEyeHeight: nextEyeH,
        bobOffsetY,
        rollRad: this.currentRollRad,
        fovBoost: climbInput !== 0 ? (shiftHeld ? 2.6 : 1.2) : 0,
      };
    }

    // -------------------------------------------------------------------------
    // Phase 4: Call-of-Duty Top-of-Ladder Vault & Mantle Onto Store Loft (`0.72s`)
    // -------------------------------------------------------------------------
    if (this.phase === 'mantling_top') {
      const duration = 0.72;
      const t = THREE.MathUtils.clamp(this.phaseElapsed / duration, 0, 1);

      // Stage 1 (t = 0..0.60): Haul body vertically over the loft nosing (y: 1.96m -> 2.61m)
      const tHaul = THREE.MathUtils.clamp(t / 0.60, 0, 1);
      const easeHaul = 1 - Math.pow(1 - tHaul, 2.4);
      footPos.y = THREE.MathUtils.lerp(this.startFootY, LADDER_TOP_LOFT_FOOT_Y, easeHaul);

      // Stage 2 (t = 0.16..0.92): Vault forward across the v = 1.24m threshold onto the pine deck (v -> 1.76m)
      const tVault = smoothstep(0.16, 0.92, t);
      const hipShiftU = -0.040 * Math.sin(t * Math.PI);
      const obU = THREE.MathUtils.lerp(this.startObU, LADDER_CENTER_U - 0.02, tVault) + hipShiftU;
      const obV = THREE.MathUtils.lerp(this.startObV, LADDER_LOFT_LANDING_V, tVault);
      const { wx, wz } = outbuildingLocalToWorld(obU, obV);
      footPos.x = wx;
      footPos.z = wz;

      // Smoothly transition eye height to the Store Loft roof-safe height so camera never clips the roof
      const finalLoftEyeH = getWalkthroughTargetEyeHeight(
        wx,
        LADDER_TOP_LOFT_FOOT_Y,
        wz,
        crouched
      );
      const nextEyeH = THREE.MathUtils.lerp(
        this.startEyeHeight,
        finalLoftEyeH,
        smoothstep(0.05, 0.85, t)
      );

      // Camera Yaw: face South (+obV) into the Store Loft storage area
      const nextYaw = lerpAngle(this.startYawRad, LADDER_FACE_SOUTH_YAW, smoothstep(0, 0.65, t));

      // Camera Pitch: look down at the grab hoops & oak nosing during haul, then lift gaze across the loft
      const haulPitchDip =
        t < 0.45
          ? -0.24 * Math.sin((t / 0.45) * (Math.PI * 0.5))
          : -0.24 * Math.cos(((t - 0.45) / 0.55) * (Math.PI * 0.5));
      const basePitch = THREE.MathUtils.lerp(this.startPitchRad, -0.05, smoothstep(0, 1, t));
      const nextPitch = THREE.MathUtils.clamp(basePitch + haulPitchDip, -MAX_PITCH_RAD, MAX_PITCH_RAD);

      // Call-of-Duty 2-Stage Mantle Dutch Roll:
      // +3.3° right roll on grab-hoop haul -> -2.6° left counter-roll on leg swing & boot plant -> 0° settle
      if (t < 0.46) {
        this.currentRollRad = 0.058 * Math.sin((t / 0.46) * Math.PI);
      } else if (t < 0.88) {
        this.currentRollRad = -0.046 * Math.sin(((t - 0.46) / 0.42) * Math.PI);
      } else {
        this.currentRollRad = THREE.MathUtils.lerp(this.currentRollRad, 0, (t - 0.88) / 0.12);
      }

      // Visceral knee-dip landing thud when planting boots on the pine loft deck (`t = 0.62..1.00`)
      const bobOffsetY =
        t >= 0.62
          ? -0.044 * Math.sin(((t - 0.62) / 0.38) * Math.PI)
          : 0.018 * Math.sin((t / 0.62) * Math.PI);

      if (t >= 1) {
        footPos.y = LADDER_TOP_LOFT_FOOT_Y;
        this.reset();
      }

      return {
        active: true,
        yawRad: nextYaw,
        pitchRad: nextPitch,
        targetYawRad: nextYaw,
        targetPitchRad: -0.05,
        currentEyeHeight: nextEyeH,
        bobOffsetY,
        rollRad: this.currentRollRad,
        fovBoost: 2.5 * Math.sin(t * Math.PI),
      };
    }

    // -------------------------------------------------------------------------
    // Phase 5: Bottom Dismount into Store North Corridor (`0.20s`)
    // -------------------------------------------------------------------------
    const duration = 0.20;
    const t = THREE.MathUtils.clamp(this.phaseElapsed / duration, 0, 1);
    const ease = smoothstep(0, 1, t);

    const obU = THREE.MathUtils.lerp(this.startObU, LADDER_CENTER_U, ease);
    const obV = THREE.MathUtils.lerp(this.startObV, LADDER_DISMOUNT_BOTTOM_V, ease);
    const { wx, wz } = outbuildingLocalToWorld(obU, obV);
    footPos.x = wx;
    footPos.z = wz;
    footPos.y = THREE.MathUtils.lerp(this.startFootY, LADDER_BOTTOM_FOOT_Y, ease);

    const targetGroundEyeH = getWalkthroughTargetEyeHeight(wx, LADDER_BOTTOM_FOOT_Y, wz, crouched);
    const nextEyeH = THREE.MathUtils.lerp(this.startEyeHeight, targetGroundEyeH, ease);
    const nextPitch = THREE.MathUtils.lerp(this.startPitchRad, -0.03, ease);
    this.currentRollRad = THREE.MathUtils.lerp(this.currentRollRad, 0, ease);
    const bobOffsetY = -0.022 * Math.sin(t * Math.PI);

    if (t >= 1) {
      footPos.y = LADDER_BOTTOM_FOOT_Y;
      this.reset();
    }

    return {
      active: true,
      yawRad: this.startYawRad,
      pitchRad: nextPitch,
      targetYawRad: this.startYawRad,
      targetPitchRad: -0.03,
      currentEyeHeight: nextEyeH,
      bobOffsetY,
      rollRad: this.currentRollRad,
      fovBoost: 0,
    };
  }
}
