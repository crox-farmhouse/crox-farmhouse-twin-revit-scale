import * as THREE from 'three';
import {
  evaluateActiveStaircaseRiserState,
  getStoreBarnRoofSoffitY,
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
  | 'dismounting_bottom'
  | 'spiral_stair_climbing';

interface SpiralStairSpec {
  readonly id: 'stable-exterior-spiral' | 'barn-spiral';
  readonly meshPrefix: string;
  readonly centerU: number;
  readonly centerV: number;
  readonly walkR: number;
  readonly bottomFootY: number;
  readonly topFootY: number;
  readonly numRisers: number;
  readonly thetaBottom: number;
  readonly thetaTop: number;
  readonly bottomStandU: number;
  readonly bottomStandV: number;
  readonly topStandU: number;
  readonly topStandV: number;
  readonly climbPrompt: string;
  readonly descendPrompt: string;
}

const SPIRAL_STAIR_SPECS: readonly SpiralStairSpec[] = [
  {
    id: 'stable-exterior-spiral',
    meshPrefix: 'outbuildings.stable.exteriorBalconyStaircase',
    centerU: 32.68,
    centerV: 4.82,
    walkR: 0.54,
    bottomFootY: -0.44,
    topFootY: 2.08,
    numRisers: 14,
    thetaBottom: -0.22 * Math.PI,
    thetaTop: 0.68 * Math.PI,
    bottomStandU: 32.92,
    bottomStandV: 4.18,
    topStandU: 31.58,
    topStandV: 4.86,
    climbPrompt: 'Climb Balcony Spiral Stairs',
    descendPrompt: 'Descend Balcony Spiral Stairs',
  },
  {
    id: 'barn-spiral',
    meshPrefix: 'outbuildings.barn.spiralStaircase',
    centerU: 22.08,
    centerV: 4.5,
    walkR: 0.54,
    bottomFootY: -0.675,
    topFootY: 1.54,
    numRisers: 13,
    thetaBottom: -0.58 * Math.PI,
    thetaTop: 0.76 * Math.PI,
    bottomStandU: 21.82,
    bottomStandV: 3.82,
    topStandU: 21.38,
    topStandV: 4.42,
    climbPrompt: 'Climb Barn Spiral Stairs',
    descendPrompt: 'Descend Barn Spiral Stairs',
  },
];

const LADDER_CENTER_U = 14.21;
const LADDER_CLIMB_STAND_V = 0.94;
const LADDER_DISMOUNT_BOTTOM_V = 0.76;
const LADDER_LOFT_LANDING_V = 1.98;
const LADDER_BOTTOM_FOOT_Y = -0.34;
const LADDER_FIRST_RUNG_FOOT_Y = -0.18;
// At footY = 1.44m (Rung 6/7) with eyeH = 1.38m, cameraY = 2.82m (21cm above the 2.61m loft deck and 45cm below the 3.27m ceiling soffit!)
const LADDER_MANTLE_START_FOOT_Y = 1.44;
const LADDER_TOP_MOUNT_END_FOOT_Y = 1.36;
const LADDER_TOP_LOFT_FOOT_Y = 2.61;
const LADDER_RUNG_SPACING = 0.272;
const ROOF_CAMERA_CLEARANCE_MARGIN = 0.38;

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

interface SpiralPathSample {
  readonly obU: number;
  readonly obV: number;
  readonly footY: number;
  readonly stepIdx: number;
  readonly stepFrac: number;
}

/**
 * Evaluates a continuous, C1-smooth 3D trajectory along the spiral staircase for `s in [0, 1]`:
 * - `s = 0.00`: exact bottom landing threshold `(bottomStandU, bottomStandV, bottomFootY)`
 * - `s in [0.06, 0.90]`: helical ascent along `theta in [thetaBottom, thetaTop]` with discrete step-riser contouring
 * - `s = 1.00`: exact top bridge landing threshold `(topStandU, topStandV, topFootY)`
 * Because `s = 0` and `s = 1` terminate directly on the bottom/top landings, starting or finishing
 * a climb never teleports `footPos` by even a single millimeter!
 */
function sampleSpiralStairPath(
  spec: SpiralStairSpec,
  sRaw: number,
  lateralSwayR = 0
): SpiralPathSample {
  const s = THREE.MathUtils.clamp(sRaw, 0, 1);
  const sHelixStart = 0.06;
  const sHelixEnd = 0.90;
  const walkR = spec.walkR + lateralSwayR;

  const botHelixU = spec.centerU + Math.cos(spec.thetaBottom) * walkR;
  const botHelixV = spec.centerV + Math.sin(spec.thetaBottom) * walkR;
  const topHelixU = spec.centerU + Math.cos(spec.thetaTop) * walkR;
  const topHelixV = spec.centerV + Math.sin(spec.thetaTop) * walkR;

  const stepIdx = s * spec.numRisers;
  const stepNumber = Math.floor(stepIdx);
  const stepFrac = stepIdx - stepNumber;

  if (s <= sHelixStart) {
    const t0 = smoothstep(0, sHelixStart, s);
    return {
      obU: THREE.MathUtils.lerp(spec.bottomStandU, botHelixU, t0),
      obV: THREE.MathUtils.lerp(spec.bottomStandV, botHelixV, t0),
      footY: spec.bottomFootY,
      stepIdx,
      stepFrac,
    };
  }

  if (s >= sHelixEnd) {
    const t1 = smoothstep(sHelixEnd, 1.0, s);
    return {
      obU: THREE.MathUtils.lerp(topHelixU, spec.topStandU, t1),
      obV: THREE.MathUtils.lerp(topHelixV, spec.topStandV, t1),
      footY: spec.topFootY,
      stepIdx,
      stepFrac,
    };
  }

  const tHelix = (s - sHelixStart) / (sHelixEnd - sHelixStart);
  const theta = spec.thetaBottom + tHelix * (spec.thetaTop - spec.thetaBottom);
  const obU = spec.centerU + Math.cos(theta) * walkR;
  const obV = spec.centerV + Math.sin(theta) * walkR;

  const helixStepIdx = tHelix * spec.numRisers;
  const helixStepNum = Math.floor(helixStepIdx);
  const helixStepFrac = helixStepIdx - helixStepNum;
  const riseSmooth = smoothstep(0.08, 0.86, helixStepFrac);
  const contouredT = Math.min(1, (helixStepNum + riseSmooth) / spec.numRisers);
  const footY = spec.bottomFootY + contouredT * (spec.topFootY - spec.bottomFootY);

  return {
    obU,
    obV,
    footY,
    stepIdx: helixStepIdx,
    stepFrac: helixStepFrac,
  };
}

/**
 * Computes the horizontal world-space up-stair tangent direction and camera yaw at progress `s`.
 */
function sampleSpiralStairUpTangent(
  spec: SpiralStairSpec,
  s: number
): { readonly worldUpX: number; readonly worldUpZ: number; readonly upYawRad: number } {
  const eps = 0.018;
  const pA = sampleSpiralStairPath(spec, Math.max(0, s - eps), 0);
  const pB = sampleSpiralStairPath(spec, Math.min(1, s + eps), 0);
  const du = pB.obU - pA.obU;
  const dv = pB.obV - pA.obV;
  const rawWx = du * OB_COS + dv * OB_SIN;
  const rawWz = -du * OB_SIN + dv * OB_COS;
  const len = Math.hypot(rawWx, rawWz) || 1;
  const worldUpX = rawWx / len;
  const worldUpZ = rawWz / len;
  const upYawRad = Math.atan2(-worldUpX, -worldUpZ);
  return { worldUpX, worldUpZ, upYawRad };
}

/**
 * Finds the closest normalized progress `s in [0.01, 0.99]` on `sampleSpiralStairPath`
 * to the player's current outbuilding position `(obU, footY, obV)`.
 */
function findClosestSpiralProgress(
  spec: SpiralStairSpec,
  obU: number,
  footY: number,
  obV: number
): number {
  let bestS = 0.04;
  let bestCost = Infinity;
  const samples = 64;
  const heightSpan = Math.max(0.5, spec.topFootY - spec.bottomFootY);
  for (let i = 0; i <= samples; i++) {
    const s = i / samples;
    const p = sampleSpiralStairPath(spec, s, 0);
    const du = obU - p.obU;
    const dv = obV - p.obV;
    const dy = ((footY - p.footY) / heightSpan) * 1.45;
    const cost = du * du + dv * dv + dy * dy;
    if (cost < bestCost) {
      bestCost = cost;
      bestS = s;
    }
  }
  return THREE.MathUtils.clamp(bestS, 0.01, 0.99);
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
  readonly pitchNodRad: number;
  readonly fovBoost: number;
}

export interface ManualStairWalkKinematics {
  readonly onStairs: boolean;
  readonly bobOffsetY: number;
  readonly rollRad: number;
  readonly pitchNodRad: number;
  readonly fovBoost: number;
}

/**
 * Call-of-Duty-Style First-Person Ladder & Spiral-Staircase Climb Controller
 * plus Riser-Synchronized Stair Walking Kinematics for all staircases in Crox Farmhouse.
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

  // Persistent smoothed camera view offsets (never zeroed abruptly on reset so stopping never jumps!)
  private currentRollRad = 0;
  private currentBobOffsetY = 0;
  private currentPitchNodRad = 0;

  // Smoothly accelerated/decelerated climb velocities
  private ladderClimbVelocity = 0;
  private spiralStepVelocity = 0;

  private activeSpiralSpec: SpiralStairSpec | null = null;
  private spiralProgress = 0;
  private mountOffsetU = 0;
  private mountOffsetV = 0;
  private mountOffsetY = 0;

  public isActive(): boolean {
    return this.phase !== 'idle';
  }

  public getPhase(): LadderClimbPhase {
    return this.phase;
  }

  public getCurrentRollRad(): number {
    return this.currentRollRad;
  }

  /**
   * Transitions the state machine back to `idle` while preserving `currentRollRad`,
   * `currentBobOffsetY`, and `currentPitchNodRad` so they damp smoothly to 0 without any camera snap.
   */
  public reset(): void {
    this.phase = 'idle';
    this.phaseElapsed = 0;
    this.autoClimbDir = 0;
    this.topMountForwardKeyHeld = false;
    this.ladderClimbVelocity = 0;
    this.spiralStepVelocity = 0;
    this.activeSpiralSpec = null;
    this.spiralProgress = 0;
    this.mountOffsetU = 0;
    this.mountOffsetV = 0;
    this.mountOffsetY = 0;
  }

  /**
   * Computes riser-synchronized first-person stair walking animation (alternating left/right
   * foot-plant Dutch roll, knee-drive vertical compression/push-off bob, gaze pitch nod, and FOV boost)
   * whenever the player walks manually on any staircase in the property, and smoothly damps
   * all offsets to 0 whenever the player stops moving or steps off a staircase/ladder.
   */
  public sampleManualStairWalkKinematics(
    dtSeconds: number,
    footPos: THREE.Vector3,
    isMoving: boolean,
    isSprinting: boolean
  ): ManualStairWalkKinematics {
    const stairState = evaluateActiveStaircaseRiserState(footPos.x, footPos.y, footPos.z);
    const settleAlpha = 1 - Math.exp(-16 * dtSeconds);

    if (!stairState || !isMoving) {
      this.currentRollRad =
        Math.abs(this.currentRollRad) > 1e-4
          ? THREE.MathUtils.lerp(this.currentRollRad, 0, settleAlpha)
          : 0;
      this.currentBobOffsetY =
        Math.abs(this.currentBobOffsetY) > 1e-4
          ? THREE.MathUtils.lerp(this.currentBobOffsetY, 0, settleAlpha)
          : 0;
      this.currentPitchNodRad =
        Math.abs(this.currentPitchNodRad) > 1e-4
          ? THREE.MathUtils.lerp(this.currentPitchNodRad, 0, settleAlpha)
          : 0;

      return {
        onStairs: stairState !== null,
        bobOffsetY: this.currentBobOffsetY,
        rollRad: this.currentRollRad,
        pitchNodRad: this.currentPitchNodRad,
        fovBoost: 0,
      };
    }

    const activeAlpha = 1 - Math.exp(-20 * dtSeconds);
    const riserPhase = stairState.riserIndex * Math.PI;
    const rollAmp = isSprinting ? 0.034 : 0.024;
    const targetRoll = Math.sin(riserPhase) * rollAmp;
    this.currentRollRad = THREE.MathUtils.lerp(this.currentRollRad, targetRoll, activeAlpha);

    const bobAmp = isSprinting ? 0.025 : 0.018;
    const targetBobY =
      Math.sin(riserPhase * 2 - Math.PI * 0.22) * bobAmp -
      Math.abs(Math.cos(riserPhase)) * 0.006;
    this.currentBobOffsetY = THREE.MathUtils.lerp(this.currentBobOffsetY, targetBobY, activeAlpha);

    const targetPitchNod = Math.sin(riserPhase * 2) * (isSprinting ? 0.014 : 0.010);
    this.currentPitchNodRad = THREE.MathUtils.lerp(
      this.currentPitchNodRad,
      targetPitchNod,
      activeAlpha
    );

    const fovBoost = isSprinting ? 2.0 : 1.0;

    return {
      onStairs: true,
      bobOffsetY: this.currentBobOffsetY,
      rollRad: this.currentRollRad,
      pitchNodRad: this.currentPitchNodRad,
      fovBoost,
    };
  }

  private isClimbableLadderObject(obj: THREE.Object3D | null): boolean {
    let cur: THREE.Object3D | null = obj;
    while (cur) {
      if (cur.userData?.isClimbableLadder === true) return true;
      if (typeof cur.name === "string" && cur.name.startsWith("outbuildings.store.loftLadder")) {
        return true;
      }
      cur = cur.parent;
    }
    return false;
  }

  /**
   * Returns a contextual climb prompt when looking at or standing right beside the Store Loft ladder.
   */
  public getProximityLadderPrompt(
    footPos: THREE.Vector3,
    targetedMesh: THREE.Object3D | null
  ): string | null {
    if (this.phase !== "idle") return null;
    const { obU, obV } = worldToOutbuildingLocal(footPos.x, footPos.z);
    const inBottomZone =
      footPos.y <= 0.45 && obU >= 13.65 && obU <= 14.75 && obV >= 0.25 && obV <= 1.38;
    const inTopZone =
      footPos.y >= 2.35 && obU >= 13.65 && obU <= 14.75 && obV >= 1.02 && obV <= 1.78;
    if (this.isClimbableLadderObject(targetedMesh) && (inBottomZone || inTopZone || Math.hypot(obU - LADDER_CENTER_U, obV - LADDER_CLIMB_STAND_V) <= 2.2)) {
      return footPos.y < 1.2 ? "Climb Store Loft Ladder" : "Descend Store Loft Ladder";
    }
    if (inBottomZone || inTopZone) {
      return footPos.y < 1.2 ? "Climb Store Loft Ladder" : "Descend Store Loft Ladder";
    }
    return null;
  }

  /**
   * Mounts and auto-climbs the Store Loft ladder when triggered via Use / tap / [F].
   */
  public tryTriggerInteraction(
    footPos: THREE.Vector3,
    yawRad: number,
    pitchRad: number,
    currentEyeHeight: number,
    targetedMesh: THREE.Object3D | null
  ): boolean {
    if (this.phase === "climbing") {
      this.autoClimbDir = footPos.y < 1.2 ? 1 : -1;
      return true;
    }
    if (this.phase !== "idle") return false;
    const { obU, obV } = worldToOutbuildingLocal(footPos.x, footPos.z);
    const distToLadder = Math.hypot(obU - LADDER_CENTER_U, obV - LADDER_CLIMB_STAND_V);
    const nearLadder =
      (obU >= 13.55 && obU <= 14.85 && obV >= 0.20 && obV <= 1.85) ||
      (this.isClimbableLadderObject(targetedMesh) && distToLadder <= 2.35);
    if (!nearLadder) return false;
    if (footPos.y < 1.2) {
      this.beginBottomMount(footPos, yawRad, pitchRad, currentEyeHeight, 1);
      return true;
    }
    this.beginTopMount(footPos, yawRad, pitchRad, currentEyeHeight, -1, false);
    return true;
  }

  /**
   * Handles pressing `Space` while on the ladder or spiral staircase.
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
    if (this.phase === 'spiral_stair_climbing') {
      this.reset();
      return { handled: true, kickBackVelocityY: 0 };
    }
    if (this.phase === 'climbing') {
      if (footPos.y >= 1.05) {
        this.beginTopMantle(footPos, yawRad, pitchRad, currentEyeHeight);
        return { handled: true, kickBackVelocityY: 0 };
      }
      this.beginBottomDismount(footPos, yawRad, pitchRad, currentEyeHeight);
      return { handled: true, kickBackVelocityY: 0 };
    }
    return { handled: true, kickBackVelocityY: 0 };
  }

  private beginSpiralStairClimb(
    spec: SpiralStairSpec,
    footPos: THREE.Vector3,
    yawRad: number,
    pitchRad: number,
    currentEyeHeight: number,
    autoClimbDir: -1 | 0 | 1
  ): void {
    const { obU, obV } = worldToOutbuildingLocal(footPos.x, footPos.z);
    this.phase = 'spiral_stair_climbing';
    this.phaseElapsed = 0;
    this.activeSpiralSpec = spec;
    this.startObU = obU;
    this.startObV = obV;
    this.startFootY = footPos.y;
    this.startYawRad = yawRad;
    this.startPitchRad = pitchRad;
    this.startEyeHeight = currentEyeHeight;
    this.autoClimbDir = autoClimbDir;
    this.spiralStepVelocity = 0;

    // Find closest s on the continuous spiral path and store residual offset so frame 1 has 0.000mm jump!
    const s0 = findClosestSpiralProgress(spec, obU, footPos.y, obV);
    this.spiralProgress = s0;
    const p0 = sampleSpiralStairPath(spec, s0, 0);
    this.mountOffsetU = obU - p0.obU;
    this.mountOffsetV = obV - p0.obV;
    this.mountOffsetY = footPos.y - p0.footY;
  }

  /**
   * Checks if walking into the bottom or top of the Store Loft ladder or Spiral Staircases
   * should automatically latch the player onto the climb controller in 1PV.
   */
  public checkAutoMountOnMovement(
    footPos: THREE.Vector3,
    moveVec: THREE.Vector3,
    forwardInput: number,
    yawRad: number,
    pitchRad: number,
    currentEyeHeight: number,
    keysDown: ReadonlySet<string>,
    touchForwardInput = 0
  ): boolean {
    if (this.phase !== 'idle') return true;

    const { obU, obV } = worldToOutbuildingLocal(footPos.x, footPos.z);
    const moveU = moveVec.x * OB_COS - moveVec.z * OB_SIN;
    const moveV = moveVec.x * OB_SIN + moveVec.z * OB_COS;

    // 1. Bottom Corridor Ladder Auto-Mount (`obU = 13.80..14.62m, obV = 0.65..1.32m, footY <= 0.35m`)
    if (
      footPos.y <= 0.35 &&
      forwardInput > 0.08 &&
      obU >= 13.80 &&
      obU <= 14.62 &&
      obV >= 0.65 &&
      obV <= 1.32 &&
      moveV > 0.25 &&
      Math.abs(moveU) < 0.88
    ) {
      const lookDelta = Math.abs(shortestAngleDelta(yawRad, LADDER_FACE_SOUTH_YAW));
      if (lookDelta <= Math.PI * 0.62) {
        this.beginBottomMount(footPos, yawRad, pitchRad, currentEyeHeight, 0);
        return true;
      }
    }

    // 2. Top Store Loft Ladder Auto-Mount (`obU = 13.80..14.62m, obV = 1.08..1.62m, footY >= 2.40m`)
    if (
      footPos.y >= 2.40 &&
      obU >= 13.80 &&
      obU <= 14.62 &&
      obV >= 1.08 &&
      obV <= 1.62 &&
      moveV < -0.25
    ) {
      const forwardHeld =
        keysDown.has('KeyW') || keysDown.has('ArrowUp') || touchForwardInput > 0.15;
      this.beginTopMount(footPos, yawRad, pitchRad, currentEyeHeight, -1, forwardHeld);
      return true;
    }

    // 3. Spiral Staircases Contextual Walk-On (Bottom Step Entry or Top Landing Bridge)
    for (const spec of SPIRAL_STAIR_SPECS) {
      const distToCenter = Math.hypot(obU - spec.centerU, obV - spec.centerV);
      if (distToCenter > 1.25) continue;

      // Bottom entry zone: near s = 0.02..0.20 moving into the staircase
      const pBot = sampleSpiralStairPath(spec, 0.08, 0);
      const distBot = Math.hypot(obU - pBot.obU, obV - pBot.obV);
      if (footPos.y <= spec.bottomFootY + 0.55 && distBot <= 0.62) {
        const upTang = sampleSpiralStairUpTangent(spec, 0.08);
        const dotUp = moveVec.x * upTang.worldUpX + moveVec.z * upTang.worldUpZ;
        if (dotUp > 0.22) {
          this.beginSpiralStairClimb(spec, footPos, yawRad, pitchRad, currentEyeHeight, 0);
          return true;
        }
      }

      // Top landing entry zone: stepping onto the top bridge landing (`s = 0.82..0.98`) moving toward the spiral
      const pTop = sampleSpiralStairPath(spec, 0.90, 0);
      const distTop = Math.hypot(obU - pTop.obU, obV - pTop.obV);
      if (footPos.y >= spec.topFootY - 0.55 && distTop <= 0.68) {
        const upTang = sampleSpiralStairUpTangent(spec, 0.90);
        const dotDown = -(moveVec.x * upTang.worldUpX + moveVec.z * upTang.worldUpZ);
        const toHelixU = spec.centerU - obU;
        const toHelixV = spec.centerV - obV;
        const toHelixLen = Math.hypot(toHelixU, toHelixV) || 1;
        const dotTowardColumn = (moveU * toHelixU + moveV * toHelixV) / toHelixLen;
        if (dotDown > 0.20 || dotTowardColumn > 0.28) {
          this.beginSpiralStairClimb(spec, footPos, yawRad, pitchRad, currentEyeHeight, 0);
          return true;
        }
      }
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
    this.ladderClimbVelocity = 0;
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
    this.ladderClimbVelocity = 0;
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
    this.ladderClimbVelocity = 0;
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
    this.ladderClimbVelocity = 0;
  }

  /**
   * Advances the Call-of-Duty ladder & spiral-staircase climb state machine for the current frame.
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
    keysDown: ReadonlySet<string>,
    touchForwardInput = 0,
    touchStrafeInput = 0,
    touchSprint = false
  ): LadderStepResult {
    if (this.phase === 'idle') {
      const settleAlpha = 1 - Math.exp(-16 * dtSeconds);
      this.currentRollRad =
        Math.abs(this.currentRollRad) > 1e-4
          ? THREE.MathUtils.lerp(this.currentRollRad, 0, settleAlpha)
          : 0;
      this.currentBobOffsetY =
        Math.abs(this.currentBobOffsetY) > 1e-4
          ? THREE.MathUtils.lerp(this.currentBobOffsetY, 0, settleAlpha)
          : 0;
      this.currentPitchNodRad =
        Math.abs(this.currentPitchNodRad) > 1e-4
          ? THREE.MathUtils.lerp(this.currentPitchNodRad, 0, settleAlpha)
          : 0;
      return {
        active: false,
        yawRad,
        pitchRad,
        targetYawRad,
        targetPitchRad,
        currentEyeHeight,
        bobOffsetY: this.currentBobOffsetY,
        rollRad: this.currentRollRad,
        pitchNodRad: this.currentPitchNodRad,
        fovBoost: 0,
      };
    }

    this.phaseElapsed += dtSeconds;

    // -------------------------------------------------------------------------
    // Phase 0: Controllable Spiral Staircase Climb & Descent
    //          - Full 360-degree mouse & Q/E look so you can turn around at any point
    //          - Direction-aware W/S movement (turn around 180 deg + press W to walk down!)
    //          - Variable speed (Shift fast, normal walk, C/Ctrl/Alt slow, release to pause)
    //          - Zero-jump mount & dismount at top/bottom landings!
    // -------------------------------------------------------------------------
    if (this.phase === 'spiral_stair_climbing' && this.activeSpiralSpec) {
      const spec = this.activeSpiralSpec;
      const wHeld = keysDown.has('KeyW') || keysDown.has('ArrowUp');
      const sHeld = keysDown.has('KeyS') || keysDown.has('ArrowDown');
      const aHeld = keysDown.has('KeyA') || keysDown.has('ArrowLeft');
      const dHeld = keysDown.has('KeyD') || keysDown.has('ArrowRight');
      const shiftHeld =
        keysDown.has('ShiftLeft') || keysDown.has('ShiftRight') || touchSprint;
      const slowHeld =
        crouched ||
        keysDown.has('ControlLeft') ||
        keysDown.has('ControlRight') ||
        keysDown.has('AltLeft') ||
        keysDown.has('AltRight');
      const hasTouchMove =
        Math.abs(touchForwardInput) > 0.10 || Math.abs(touchStrafeInput) > 0.12;

      // Any manual WASD or touch joystick input immediately switches from auto-glide to manual control
      if (wHeld || sHeld || aHeld || dHeld || hasTouchMove) {
        this.autoClimbDir = 0;
      }

      let forwardInput = touchForwardInput;
      if (wHeld) forwardInput += 1;
      if (sHeld) forwardInput -= 1;
      forwardInput = THREE.MathUtils.clamp(forwardInput, -1, 1);
      if (Math.abs(forwardInput) < 0.08) forwardInput = 0;

      const prevS = this.spiralProgress;
      const prevUpTang = sampleSpiralStairUpTangent(spec, prevS);

      // Determine whether the player is facing up the stairs (+1) or turned around facing down (-1)
      const lookDirX = -Math.sin(yawRad);
      const lookDirZ = -Math.cos(yawRad);
      const facingUpCos = lookDirX * prevUpTang.worldUpX + lookDirZ * prevUpTang.worldUpZ;
      const downThreshold = prevS >= 0.82 ? 0.25 : prevS <= 0.18 ? -0.35 : -0.12;
      const facingStairSign: -1 | 1 =
        pitchRad < -0.68 || facingUpCos < downThreshold ? -1 : 1;

      let desiredClimbSign = 0;
      if (forwardInput !== 0) {
        desiredClimbSign = forwardInput * facingStairSign;
      } else if (this.autoClimbDir !== 0) {
        desiredClimbSign = this.autoClimbDir;
      }

      // Target speed in risers/sec: Slow (1.25), Walk (2.15), Sprint (3.30)
      const targetSpeedRisers = slowHeld ? 1.25 : shiftHeld ? 3.30 : 2.15;
      const prevStepIdx = prevS * spec.numRisers;
      const prevStepFrac = prevStepIdx - Math.floor(prevStepIdx);
      const haulPulse =
        1.0 + 0.24 * Math.sin(prevStepFrac * Math.PI * 2 - Math.PI * 0.22);

      const targetVel = desiredClimbSign * targetSpeedRisers * haulPulse;
      const accelRate = desiredClimbSign !== 0 ? 14 : 12;
      this.spiralStepVelocity = THREE.MathUtils.lerp(
        this.spiralStepVelocity,
        targetVel,
        1 - Math.exp(-accelRate * dtSeconds)
      );
      if (desiredClimbSign === 0 && Math.abs(this.spiralStepVelocity) < 0.02) {
        this.spiralStepVelocity = 0;
      }

      // Advance normalized progress s along the spiral path
      const ds = (this.spiralStepVelocity * dtSeconds) / spec.numRisers;
      this.spiralProgress = THREE.MathUtils.clamp(prevS + ds, 0, 1);
      const s = this.spiralProgress;

      // Decay initial mount offset smoothly so mounting from any position has 0.000mm snap
      const offsetDecay = Math.exp(-(Math.abs(this.spiralStepVelocity) > 0.1 ? 11 : 6) * dtSeconds);
      this.mountOffsetU *= offsetDecay;
      this.mountOffsetV *= offsetDecay;
      this.mountOffsetY *= offsetDecay;

      const speedFactor = THREE.MathUtils.clamp(
        Math.abs(this.spiralStepVelocity) / 2.15,
        0,
        1.35
      );
      const edgeFade = smoothstep(0.0, 0.07, s) * smoothstep(1.0, 0.91, s);
      const lateralSwayR =
        Math.sin(s * spec.numRisers * Math.PI) * 0.016 * speedFactor * edgeFade;

      const sample = sampleSpiralStairPath(spec, s, lateralSwayR);
      const obU = sample.obU + this.mountOffsetU;
      const obV = sample.obV + this.mountOffsetV;
      const { wx, wz } = outbuildingLocalToWorld(obU, obV);
      footPos.x = wx;
      footPos.z = wz;
      footPos.y = sample.footY + this.mountOffsetY;

      // Carry the player's chosen 360-degree viewing yaw around the spiral curvature as they move,
      // while allowing 100% free mouse look and Q/E turning!
      const newUpTang = sampleSpiralStairUpTangent(spec, s);
      const deltaCurveYaw = shortestAngleDelta(prevUpTang.upYawRad, newUpTang.upYawRad);
      let nextTargetYaw = targetYawRad + deltaCurveYaw;

      // Optional A/D or touch-strafe turn assistance while on spiral stairs
      const strafeTurn = (aHeld ? 1 : 0) - (dHeld ? 1 : 0) - touchStrafeInput * 0.65;
      if (Math.abs(strafeTurn) > 0.05) {
        nextTargetYaw += strafeTurn * 1.45 * dtSeconds;
      }

      // If auto-climbing via [F]/Click without manual look override, gently align gaze with travel tangent
      if (this.autoClimbDir !== 0) {
        const travelYaw =
          this.autoClimbDir > 0
            ? newUpTang.upYawRad
            : newUpTang.upYawRad + Math.PI;
        nextTargetYaw = lerpAngle(
          nextTargetYaw,
          travelYaw,
          1 - Math.exp(-5.5 * dtSeconds)
        );
      }

      const lookAlpha = 1 - Math.exp(-36 * dtSeconds);
      const nextYaw = lerpAngle(yawRad, nextTargetYaw, lookAlpha);
      const nextTargetPitch = THREE.MathUtils.clamp(
        targetPitchRad,
        -MAX_PITCH_RAD,
        MAX_PITCH_RAD
      );
      const nextPitch = THREE.MathUtils.lerp(pitchRad, nextTargetPitch, lookAlpha);

      // Riser-synchronized camera roll, vertical knee-drive bob, and gaze pitch nod
      // scaled by speedFactor * edgeFade so stopping or reaching the landing damps smoothly to 0!
      const stepPhase = sample.stepIdx * Math.PI;
      const motionEnvelope = speedFactor * edgeFade;
      const targetRoll = Math.sin(stepPhase) * 0.028 * motionEnvelope;
      const targetBobY =
        (-0.016 * Math.sin(sample.stepFrac * Math.PI * 2) +
          0.008 * Math.sin(sample.stepFrac * Math.PI)) *
        motionEnvelope;
      const targetPitchNod =
        Math.sin(sample.stepFrac * Math.PI * 2) * 0.014 * motionEnvelope;

      const kAlpha = 1 - Math.exp(-18 * dtSeconds);
      this.currentRollRad = THREE.MathUtils.lerp(this.currentRollRad, targetRoll, kAlpha);
      this.currentBobOffsetY = THREE.MathUtils.lerp(this.currentBobOffsetY, targetBobY, kAlpha);
      this.currentPitchNodRad = THREE.MathUtils.lerp(
        this.currentPitchNodRad,
        targetPitchNod,
        kAlpha
      );

      const targetEyeH = getWalkthroughTargetEyeHeight(wx, footPos.y, wz, crouched);
      const nextEyeH = THREE.MathUtils.lerp(
        currentEyeHeight,
        targetEyeH,
        1 - Math.exp(-16 * dtSeconds)
      );

      // Seamless zero-jump exit when stepping onto the top landing (s >= 0.998) or bottom floor (s <= 0.002)
      if (
        (this.spiralStepVelocity > 0 && s >= 0.998) ||
        (this.spiralStepVelocity < 0 && s <= 0.002)
      ) {
        this.reset();
        return {
          active: true,
          yawRad: nextYaw,
          pitchRad: nextPitch,
          targetYawRad: nextTargetYaw,
          targetPitchRad: nextTargetPitch,
          currentEyeHeight: nextEyeH,
          bobOffsetY: this.currentBobOffsetY,
          rollRad: this.currentRollRad,
          pitchNodRad: this.currentPitchNodRad,
          fovBoost: 0,
        };
      }

      return {
        active: true,
        yawRad: nextYaw,
        pitchRad: nextPitch,
        targetYawRad: nextTargetYaw,
        targetPitchRad: nextTargetPitch,
        currentEyeHeight: nextEyeH,
        bobOffsetY: this.currentBobOffsetY,
        rollRad: this.currentRollRad,
        pitchNodRad: this.currentPitchNodRad,
        fovBoost: speedFactor * (shiftHeld ? 1.8 : 0.9),
      };
    }

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
      const desiredPitch = THREE.MathUtils.clamp(this.startPitchRad, -0.05, 0.28);
      const nextPitch = THREE.MathUtils.lerp(this.startPitchRad, desiredPitch, ease);
      const nextEyeH = THREE.MathUtils.lerp(this.startEyeHeight, 1.52, ease);

      const grabImpulse = Math.sin(t * Math.PI);
      this.currentRollRad = -0.034 * grabImpulse;
      this.currentBobOffsetY = -0.024 * grabImpulse;
      this.currentPitchNodRad = 0.08 * grabImpulse;

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
        bobOffsetY: this.currentBobOffsetY,
        rollRad: this.currentRollRad,
        pitchNodRad: this.currentPitchNodRad,
        fovBoost: 0.8 * grabImpulse,
      };
    }

    // -------------------------------------------------------------------------
    // Phase 2: Reverse Top-Mount from Store Loft onto Ladder (`0.66s` CoD Vault-On)
    // -------------------------------------------------------------------------
    if (this.phase === 'mounting_top') {
      const duration = 0.66;
      const t = THREE.MathUtils.clamp(this.phaseElapsed / duration, 0, 1);
      const ease = smoothstep(0, 1, t);

      if (
        !keysDown.has('KeyW') &&
        !keysDown.has('ArrowUp') &&
        touchForwardInput <= 0.15
      ) {
        this.topMountForwardKeyHeld = false;
      }

      const swingArcU = Math.sin(t * Math.PI) * 0.034;
      const obU = THREE.MathUtils.lerp(this.startObU, LADDER_CENTER_U, ease) + swingArcU;
      const obV = THREE.MathUtils.lerp(this.startObV, LADDER_CLIMB_STAND_V, ease);
      const { wx, wz } = outbuildingLocalToWorld(obU, obV);
      footPos.x = wx;
      footPos.z = wz;

      const dropT = smoothstep(0.18, 1.0, t);
      footPos.y = THREE.MathUtils.lerp(this.startFootY, LADDER_TOP_MOUNT_END_FOOT_Y, dropT);

      const startCameraY = Math.min(
        this.startFootY + this.startEyeHeight,
        getStoreBarnRoofSoffitY(this.startObV) - ROOF_CAMERA_CLEARANCE_MARGIN
      );
      const endCameraY = LADDER_TOP_MOUNT_END_FOOT_Y + 1.38;
      const rawCameraY = THREE.MathUtils.lerp(startCameraY, endCameraY, ease);
      this.currentBobOffsetY = -0.028 * Math.sin(t * Math.PI);
      const maxSafeCameraY = getStoreBarnRoofSoffitY(obV) - ROOF_CAMERA_CLEARANCE_MARGIN;
      const clampedCameraY = Math.min(rawCameraY + this.currentBobOffsetY, maxSafeCameraY);
      const nextEyeH = Math.max(0.35, clampedCameraY - footPos.y - this.currentBobOffsetY);

      const nextYaw = lerpAngle(this.startYawRad, LADDER_FACE_SOUTH_YAW, smoothstep(0, 0.82, t));
      const nextPitch = THREE.MathUtils.lerp(this.startPitchRad, -0.12, ease);
      this.currentPitchNodRad = -0.20 * Math.sin(t * Math.PI);

      this.currentRollRad =
        t < 0.5
          ? -0.048 * Math.sin((t / 0.5) * Math.PI)
          : 0.030 * Math.sin(((t - 0.5) / 0.5) * Math.PI);

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
        bobOffsetY: this.currentBobOffsetY,
        rollRad: this.currentRollRad,
        pitchNodRad: this.currentPitchNodRad,
        fovBoost: 1.4 * Math.sin(t * Math.PI),
      };
    }

    // -------------------------------------------------------------------------
    // Phase 3: Rung-by-Rung Call-of-Duty Hand-over-Hand Climbing
    //          Supports slowing down (C/Ctrl/Alt), sprinting (Shift), pausing on
    //          any rung, and wide free look so you can look back over your shoulder!
    // -------------------------------------------------------------------------
    if (this.phase === 'climbing') {
      const wHeld = keysDown.has('KeyW') || keysDown.has('ArrowUp');
      const sHeld = keysDown.has('KeyS') || keysDown.has('ArrowDown');
      const shiftHeld =
        keysDown.has('ShiftLeft') || keysDown.has('ShiftRight') || touchSprint;
      const slowHeld =
        crouched ||
        keysDown.has('ControlLeft') ||
        keysDown.has('ControlRight') ||
        keysDown.has('AltLeft') ||
        keysDown.has('AltRight');

      const rawForward = THREE.MathUtils.clamp(
        (wHeld ? 1 : 0) - (sHeld ? 1 : 0) + touchForwardInput,
        -1,
        1
      );
      if (!wHeld && touchForwardInput <= 0.15) {
        this.topMountForwardKeyHeld = false;
      }

      // Check if player turned their camera > 100 deg away from the ladder or is looking sharply down
      const yawFromLadder = Math.abs(shortestAngleDelta(LADDER_FACE_SOUTH_YAW, yawRad));
      let climbInput = 0;
      if (rawForward < -0.10) {
        const mag = Math.min(1, Math.abs(rawForward) * 1.15);
        climbInput = (yawFromLadder > Math.PI * 0.62 ? 1 : -1) * mag;
        this.autoClimbDir = 0;
      } else if (rawForward > 0.10) {
        const mag = Math.min(1, Math.abs(rawForward) * 1.15);
        if (this.topMountForwardKeyHeld || pitchRad < -0.68 || yawFromLadder > Math.PI * 0.62) {
          climbInput = -mag;
        } else {
          climbInput = mag;
          this.autoClimbDir = 0;
        }
      } else if (this.autoClimbDir !== 0) {
        climbInput = this.autoClimbDir;
      }

      // Allow wide ±160° horizontal look so you can turn around on the ladder, gently recentering only while climbing
      const clampedYawDelta = THREE.MathUtils.clamp(
        shortestAngleDelta(LADDER_FACE_SOUTH_YAW, targetYawRad),
        -2.78,
        2.78
      );
      const clampedTargetYaw = LADDER_FACE_SOUTH_YAW + clampedYawDelta;
      const recenterWeight =
        climbInput !== 0 && yawFromLadder < Math.PI * 0.55
          ? (1 - Math.exp(-5.0 * dtSeconds)) * 0.35
          : 0;
      const desiredYaw =
        recenterWeight > 0
          ? lerpAngle(clampedTargetYaw, LADDER_FACE_SOUTH_YAW, recenterWeight)
          : clampedTargetYaw;
      const lookAlpha = 1 - Math.exp(-36 * dtSeconds);
      const nextYaw = lerpAngle(yawRad, desiredYaw, lookAlpha);

      const basePitchTarget =
        this.autoClimbDir !== 0
          ? this.autoClimbDir > 0
            ? 0.12
            : -0.20
          : THREE.MathUtils.clamp(targetPitchRad, -1.25, 0.85);
      const nextPitch = THREE.MathUtils.lerp(pitchRad, basePitchTarget, lookAlpha);

      const baseSpeed =
        climbInput > 0
          ? slowHeld
            ? 0.88
            : shiftHeld
              ? 1.92
              : 1.48
          : slowHeld
            ? 0.98
            : shiftHeld
              ? 2.12
              : 1.65;

      const prevRungIndex = (footPos.y - LADDER_BOTTOM_FOOT_Y) / LADDER_RUNG_SPACING;
      const prevRungPhase = prevRungIndex * Math.PI;
      const haulPulse = 1.0 + 0.28 * Math.sin(prevRungPhase * 2 - Math.PI * 0.25);

      const targetClimbVel = climbInput * baseSpeed * haulPulse;
      this.ladderClimbVelocity = THREE.MathUtils.lerp(
        this.ladderClimbVelocity,
        targetClimbVel,
        1 - Math.exp(-(climbInput !== 0 ? 15 : 12) * dtSeconds)
      );
      if (climbInput === 0 && Math.abs(this.ladderClimbVelocity) < 0.01) {
        this.ladderClimbVelocity = 0;
      }

      footPos.y = Math.min(
        LADDER_MANTLE_START_FOOT_Y,
        footPos.y + this.ladderClimbVelocity * dtSeconds
      );

      const rungIndex = (footPos.y - LADDER_BOTTOM_FOOT_Y) / LADDER_RUNG_SPACING;
      const rungPhase = rungIndex * Math.PI;
      const speedNorm = THREE.MathUtils.clamp(Math.abs(this.ladderClimbVelocity) / 1.48, 0, 1.3);
      const activeMotionWeight = Math.max(speedNorm, 0.12);

      const targetRoll = Math.sin(rungPhase) * 0.034 * activeMotionWeight;
      this.currentRollRad = THREE.MathUtils.lerp(
        this.currentRollRad,
        targetRoll,
        1 - Math.exp(-20 * dtSeconds)
      );

      const swayU = -Math.sin(rungPhase) * 0.018 * activeMotionWeight;
      const pullV = Math.abs(Math.sin(rungPhase)) * 0.016 * activeMotionWeight;
      const curObV = LADDER_CLIMB_STAND_V + pullV;
      const { wx, wz } = outbuildingLocalToWorld(LADDER_CENTER_U + swayU, curObV);
      footPos.x = wx;
      footPos.z = wz;

      const targetPitchNod = Math.sin(rungPhase * 2) * 0.015 * speedNorm;
      const targetBobY = Math.sin(rungPhase * 2) * 0.012 * speedNorm;
      this.currentPitchNodRad = THREE.MathUtils.lerp(
        this.currentPitchNodRad,
        targetPitchNod,
        1 - Math.exp(-18 * dtSeconds)
      );
      this.currentBobOffsetY = THREE.MathUtils.lerp(
        this.currentBobOffsetY,
        targetBobY,
        1 - Math.exp(-18 * dtSeconds)
      );

      const climbFrac = THREE.MathUtils.clamp(
        (footPos.y - LADDER_BOTTOM_FOOT_Y) / (LADDER_MANTLE_START_FOOT_Y - LADDER_BOTTOM_FOOT_Y),
        0,
        1
      );
      const desiredEyeH = THREE.MathUtils.lerp(1.52, 1.38, climbFrac);
      const maxSafeEyeH =
        getStoreBarnRoofSoffitY(curObV) -
        ROOF_CAMERA_CLEARANCE_MARGIN -
        footPos.y -
        this.currentBobOffsetY;
      const nextEyeH = Math.min(
        maxSafeEyeH,
        THREE.MathUtils.lerp(currentEyeHeight, desiredEyeH, 1 - Math.exp(-18 * dtSeconds))
      );

      const wantsSideStepOffBottom =
        Math.abs(touchStrafeInput) > 0.72 &&
        Math.abs(rawForward) < 0.25 &&
        footPos.y <= LADDER_FIRST_RUNG_FOOT_Y + 0.35;
      if (climbInput > 0 && footPos.y >= LADDER_MANTLE_START_FOOT_Y - 1e-3) {
        this.beginTopMantle(footPos, nextYaw, nextPitch, nextEyeH);
      } else if (
        (climbInput < 0 && footPos.y <= LADDER_FIRST_RUNG_FOOT_Y + 0.06) ||
        wantsSideStepOffBottom
      ) {
        this.beginBottomDismount(footPos, nextYaw, nextPitch, nextEyeH);
      }

      return {
        active: true,
        yawRad: nextYaw,
        pitchRad: THREE.MathUtils.clamp(nextPitch, -MAX_PITCH_RAD, MAX_PITCH_RAD),
        targetYawRad: desiredYaw,
        targetPitchRad: basePitchTarget,
        currentEyeHeight: nextEyeH,
        bobOffsetY: this.currentBobOffsetY,
        rollRad: this.currentRollRad,
        pitchNodRad: this.currentPitchNodRad,
        fovBoost: speedNorm * (shiftHeld ? 2.2 : 1.0),
      };
    }

    // -------------------------------------------------------------------------
    // Phase 4: Call-of-Duty Top-of-Ladder Vault & Mantle Onto Store Loft (`0.76s`)
    // -------------------------------------------------------------------------
    if (this.phase === 'mantling_top') {
      const duration = 0.76;
      const t = THREE.MathUtils.clamp(this.phaseElapsed / duration, 0, 1);

      const tVault = smoothstep(0.0, 0.96, t);
      const hipShiftU = -0.036 * Math.sin(t * Math.PI);
      const obU = THREE.MathUtils.lerp(this.startObU, LADDER_CENTER_U - 0.02, tVault) + hipShiftU;
      const obV = THREE.MathUtils.lerp(this.startObV, LADDER_LOFT_LANDING_V, tVault);
      const { wx, wz } = outbuildingLocalToWorld(obU, obV);
      footPos.x = wx;
      footPos.z = wz;

      const tFootRise = smoothstep(0.08, 0.86, t);
      footPos.y = THREE.MathUtils.lerp(this.startFootY, LADDER_TOP_LOFT_FOOT_Y, tFootRise);

      const startCameraY = Math.min(
        this.startFootY + this.startEyeHeight,
        getStoreBarnRoofSoffitY(this.startObV) - ROOF_CAMERA_CLEARANCE_MARGIN
      );
      const { wx: endWx, wz: endWz } = outbuildingLocalToWorld(
        LADDER_CENTER_U - 0.02,
        LADDER_LOFT_LANDING_V
      );
      const finalLoftEyeH = getWalkthroughTargetEyeHeight(
        endWx,
        LADDER_TOP_LOFT_FOOT_Y,
        endWz,
        crouched
      );
      const endCameraY = LADDER_TOP_LOFT_FOOT_Y + finalLoftEyeH;
      const rawCameraY = THREE.MathUtils.lerp(startCameraY, endCameraY, smoothstep(0.0, 0.94, t));

      this.currentBobOffsetY =
        t >= 0.60
          ? -0.030 * Math.sin(((t - 0.60) / 0.40) * Math.PI)
          : 0.012 * Math.sin((t / 0.60) * Math.PI);

      const maxSafeCameraY = getStoreBarnRoofSoffitY(obV) - ROOF_CAMERA_CLEARANCE_MARGIN;
      const clampedCameraY = Math.min(rawCameraY + this.currentBobOffsetY, maxSafeCameraY);
      const nextEyeH = Math.max(0.38, clampedCameraY - footPos.y - this.currentBobOffsetY);

      const nextYaw = lerpAngle(this.startYawRad, LADDER_FACE_SOUTH_YAW, smoothstep(0, 0.65, t));
      const basePitch = THREE.MathUtils.lerp(this.startPitchRad, -0.05, smoothstep(0, 1, t));
      this.currentPitchNodRad =
        t < 0.45
          ? -0.20 * Math.sin((t / 0.45) * (Math.PI * 0.5))
          : -0.20 * Math.cos(((t - 0.45) / 0.55) * (Math.PI * 0.5));

      if (t < 0.46) {
        this.currentRollRad = 0.052 * Math.sin((t / 0.46) * Math.PI);
      } else if (t < 0.88) {
        this.currentRollRad = -0.042 * Math.sin(((t - 0.46) / 0.42) * Math.PI);
      } else {
        this.currentRollRad = THREE.MathUtils.lerp(this.currentRollRad, 0, (t - 0.88) / 0.12);
      }

      if (t >= 1) {
        footPos.y = LADDER_TOP_LOFT_FOOT_Y;
        this.reset();
      }

      return {
        active: true,
        yawRad: nextYaw,
        pitchRad: basePitch,
        targetYawRad: nextYaw,
        targetPitchRad: basePitch,
        currentEyeHeight: nextEyeH,
        bobOffsetY: this.currentBobOffsetY,
        rollRad: this.currentRollRad,
        pitchNodRad: this.currentPitchNodRad,
        fovBoost: 2.2 * Math.sin(t * Math.PI),
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
    this.currentBobOffsetY = -0.018 * Math.sin(t * Math.PI);
    this.currentPitchNodRad = THREE.MathUtils.lerp(this.currentPitchNodRad, 0, ease);

    if (t >= 1) {
      footPos.y = LADDER_BOTTOM_FOOT_Y;
      this.reset();
    }

    return {
      active: true,
      yawRad: this.startYawRad,
      pitchRad: nextPitch,
      targetYawRad: this.startYawRad,
      targetPitchRad: nextPitch,
      currentEyeHeight: nextEyeH,
      bobOffsetY: this.currentBobOffsetY,
      rollRad: this.currentRollRad,
      pitchNodRad: this.currentPitchNodRad,
      fovBoost: 0,
    };
  }
}
