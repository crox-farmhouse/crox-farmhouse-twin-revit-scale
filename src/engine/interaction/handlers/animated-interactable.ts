import type * as THREE from 'three';

/**
 * First-person camera and body pose sample returned by an `AnimatedInteractable`
 * while it is actively driving a 1st-person interactive sequence (e.g. running on
 * the Technogym treadmill or performing a 1st-person barbell bench press set).
 */
export interface FirstPersonPoseSample {
  /** World-space camera (eye) position `[x, y, z]`. */
  readonly eyePosition: readonly [number, number, number];
  /** World-space foot position `[x, y, z]` (used to sync player feet and dismount cleanly). */
  readonly footPosition: readonly [number, number, number];
  /** World camera yaw in radians (`0` = North `-Z`, `-PI/2` = East `+X`, `PI` = South `+Z`). */
  readonly yawRad: number;
  /** World camera pitch in radians (`+` = looking up, `-` = looking down). */
  readonly pitchRad: number;
  /** Optional camera roll in radians. */
  readonly rollRad?: number;
  /** Optional additive FOV boost in degrees (e.g. `+5` during sprint or max-effort press). */
  readonly fovBoostDeg?: number;
}

/**
 * A self-contained animated prop (e.g. the barn pool-table break, gym treadmill run, or
 * gym squat-rack bench press) that owns its own state and kinematics. Built outside the
 * engine (objects/homes) and plugged into the `InteractionRegistry` via
 * `registerAnimatedInteractable`, which routes clicks / walkthrough `F`, prompts, the
 * per-frame step, first-person camera choreography, and static-batching protection to it.
 */
export interface AnimatedInteractable {
  /** Fixed, stable interactable id (also its manifest / `handleInteractableClick` id). */
  readonly id: string;
  /** Human label, e.g. for assistant device lists. */
  readonly label: string;
  /** Extra natural-language names ("play pool", "run on treadmill", "bench press"). */
  readonly aliases: readonly string[];
  /** Meshes / groups that should respond to clicks and the walkthrough interact key. */
  readonly clickableTargets: readonly THREE.Object3D[];
  /** Click / F / device-list action. Returns false when the prop ignores the request right now. */
  trigger(): boolean;
  /** Hover / walkthrough prompt for the current state (empty string hides the prompt). */
  describe(): string;
  /** Advances the animation. Returns true if anything moved this frame. */
  step(dtSeconds: number): boolean;
  /** Adds every Object3D this prop animates, so static batching / matrix freezing skips them. */
  collectDynamicObjects(out: Set<THREE.Object3D>): void;
  /** Optional: returns true while this prop is actively driving a 1st-person camera sequence. */
  isFirstPersonActive?(): boolean;
  /** Optional: samples the current 1st-person camera/body pose while `isFirstPersonActive()` is true. */
  sampleFirstPersonPose?(): FirstPersonPoseSample | null;
  /** Optional: cancels/stops an active 1st-person sequence early (e.g. when dismounting). */
  cancelFirstPerson?(): void;
  /** Optional: returns true if the player feet `(footX, footY, footZ)` are in the prop's proximity trigger zone. */
  isPlayerInProximityZone?(footX: number, footY: number, footZ: number): boolean;
  /**
   * Optional: when true, this prop runs a continuous ambient visual animation (such as
   * flickering stove flames and embers) stepped via `stepAmbient(dtSeconds)` without
   * invalidating shadow maps every frame.
   */
  readonly isAmbientLoop?: boolean;
}

