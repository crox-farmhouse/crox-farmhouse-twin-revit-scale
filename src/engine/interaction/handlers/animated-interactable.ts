import type * as THREE from 'three';

/**
 * A self-contained animated prop (e.g. the barn pool-table break) that owns its own state and
 * kinematics. Built outside the engine (objects/homes) and plugged into the
 * `InteractionRegistry` via `registerAnimatedInteractable`, which routes clicks / walkthrough `F`,
 * prompts, the per-frame step and static-batching protection to it.
 */
export interface AnimatedInteractable {
  /** Fixed, stable interactable id (also its manifest / `handleInteractableClick` id). */
  readonly id: string;
  /** Human label, e.g. for assistant device lists. */
  readonly label: string;
  /** Extra natural-language names ("play pool", "rack the balls"). */
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
}
