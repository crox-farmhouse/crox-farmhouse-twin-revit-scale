import * as THREE from 'three';
import type { AnimatedInteractable } from '../../engine/interaction/handlers/animated-interactable.ts';
import {
  planBreakShot,
  samplePoolBreak,
  simulatePoolBreak,
  type PoolPoint,
  type PoolSimResult,
  type PoolTableSpec,
} from './pool-table-physics.ts';

/** Fixed interactable id of the barn pool-table break. */
export const POOL_TABLE_BREAK_ID = 'pool-table-break';

export interface PoolTableBreakConfig {
  /** Ball meshes in the table's local frame; index 0 is the cue ball. All share one parent. */
  readonly balls: readonly THREE.Mesh[];
  /** The cue that strikes (its build pose is its resting pose on the rail). */
  readonly cue: THREE.Object3D;
  /** Cue length in metres (the mesh's local +Y axis runs butt → tip). */
  readonly cueLength: number;
  readonly clickableTargets: readonly THREE.Object3D[];
  readonly spec: PoolTableSpec;
  /** PRNG seed for the break jitter (each successive break uses the next break number). */
  readonly seed?: number;
  readonly label?: string;
  readonly aliases?: readonly string[];
}

type Phase = 'racked' | 'breaking' | 'broken' | 'racking';

// Break timeline (seconds from the click).
const CUE_ADDRESS_END = 0.6;
const CUE_DRAW_END = 1.0;
const CUE_IMPACT = 1.08;
const CUE_FOLLOW_END = 1.2;
const CUE_RETURN_START = 1.9;
const CUE_RETURN_END = 2.7;
const CUE_DRAW_BACK = 0.16;
const CUE_FOLLOW_THROUGH = 0.07;
const CUE_TIP_GAP = 0.03;
/** Cue elevation: the tip sits lower than the butt so it clears the head rail. */
const CUE_ELEVATION_RAD = 0.1;
const POCKET_DROP_SEC = 0.22;
const POCKET_DROP_DEPTH = 0.07;
const RACK_SEC = 0.9;
const RACK_LIFT = 0.04;
const MAX_STEP_SEC = 0.05;

const UP = new THREE.Vector3(0, 1, 0);

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/**
 * Click-to-break animation for a pool table: the cue addresses the cue ball, draws back and
 * strikes; the balls then follow a pre-simulated deterministic trajectory
 * ({@link simulatePoolBreak}) and pocketed balls drop out of sight. The next click re-racks every
 * ball into its build position; the click after that breaks again.
 */
export class PoolTableBreakController implements AnimatedInteractable {
  public readonly id = POOL_TABLE_BREAK_ID;
  public readonly label: string;
  public readonly aliases: readonly string[];
  public readonly clickableTargets: readonly THREE.Object3D[];

  readonly #balls: readonly THREE.Mesh[];
  readonly #cue: THREE.Object3D;
  readonly #cueLength: number;
  readonly #spec: PoolTableSpec;
  readonly #seed: number;
  readonly #rack: readonly PoolPoint[];
  readonly #ballY: number;
  readonly #cueRestPos: THREE.Vector3;
  readonly #cueRestQuat: THREE.Quaternion;
  readonly #cueAddressPos = new THREE.Vector3();
  readonly #cueAddressQuat = new THREE.Quaternion();
  readonly #cueAxis = new THREE.Vector3();
  readonly #rackFrom: THREE.Vector3[];
  readonly #samples: PoolPoint[] = [];
  readonly #tmp = new THREE.Vector3();

  #phase: Phase = 'racked';
  #elapsed = 0;
  #breakNumber = 0;
  #sim: PoolSimResult | null = null;
  /** Pocket drop per ball for the current break (sim time + pocket centre), or null. */
  #drops: ({ readonly timeSec: number; readonly x: number; readonly z: number } | null)[] = [];

  public constructor(config: PoolTableBreakConfig) {
    this.label = config.label ?? 'Pool table';
    this.aliases = config.aliases ?? [];
    this.clickableTargets = config.clickableTargets;
    this.#balls = config.balls;
    this.#cue = config.cue;
    this.#cueLength = config.cueLength;
    this.#spec = config.spec;
    this.#seed = config.seed ?? 0xc0ffee;
    this.#rack = config.balls.map((b) => ({ x: b.position.x, z: b.position.z }));
    this.#ballY = config.balls[0]?.position.y ?? 0;
    this.#cueRestPos = config.cue.position.clone();
    this.#cueRestQuat = config.cue.quaternion.clone();
    this.#rackFrom = config.balls.map((b) => b.position.clone());
  }

  /** Current phase, for tests / diagnostics. */
  public get phase(): Phase {
    return this.#phase;
  }

  public trigger(): boolean {
    if (this.#phase === 'racked') {
      this.#startBreak();
      return true;
    }
    if (this.#phase === 'broken') {
      this.#startRack();
      return true;
    }
    return false;
  }

  public describe(): string {
    switch (this.#phase) {
      case 'racked':
        return 'Break';
      case 'broken':
        return 'Re-rack';
      case 'breaking':
        return '';
      case 'racking':
        return '';
    }
  }

  public collectDynamicObjects(out: Set<THREE.Object3D>): void {
    for (const ball of this.#balls) out.add(ball);
    this.#cue.traverse((c) => out.add(c));
  }

  public step(dtSeconds: number): boolean {
    if (this.#phase === 'racked' || this.#phase === 'broken') return false;
    this.#elapsed += Math.min(MAX_STEP_SEC, Math.max(0, dtSeconds));
    if (this.#phase === 'breaking') this.#stepBreak(this.#elapsed);
    else this.#stepRack(this.#elapsed);
    return true;
  }

  // --- Break -------------------------------------------------------------------------------

  #startBreak(): void {
    const cueBall = this.#rack[0]!;
    // Aim at the apex of the triangle: the object ball nearest the cue ball.
    let apex = this.#rack[1] ?? { x: cueBall.x + 1, z: cueBall.z };
    let best = Number.POSITIVE_INFINITY;
    for (let i = 1; i < this.#rack.length; i++) {
      const p = this.#rack[i]!;
      const d = Math.hypot(p.x - cueBall.x, p.z - cueBall.z);
      if (d < best) {
        best = d;
        apex = p;
      }
    }
    const shot = planBreakShot(0, cueBall, apex, this.#seed, this.#breakNumber);
    this.#breakNumber += 1;
    this.#sim = simulatePoolBreak(this.#spec, this.#rack, shot);
    this.#drops = this.#balls.map(() => null);
    for (const e of this.#sim.pocketEvents) {
      const pocket = this.#spec.pockets[e.pocketIndex];
      if (pocket) this.#drops[e.ballIndex] = { timeSec: e.timeSec, x: pocket.x, z: pocket.z };
    }

    // Cue address pose: tip just behind the cue ball along the shot line, butt raised.
    const r = this.#spec.ballRadius;
    const cosE = Math.cos(CUE_ELEVATION_RAD);
    this.#cueAxis.set(shot.dirX * cosE, -Math.sin(CUE_ELEVATION_RAD), shot.dirZ * cosE).normalize();
    this.#cueAddressQuat.setFromUnitVectors(UP, this.#cueAxis);
    this.#tipToCentre(cueBall.x - shot.dirX * (r + CUE_TIP_GAP), cueBall.z - shot.dirZ * (r + CUE_TIP_GAP), 0, this.#cueAddressPos);

    this.#phase = 'breaking';
    this.#elapsed = 0;
  }

  /** Cue mesh centre for a tip at (`tipX`, ballY, `tipZ`) moved `along` metres along the cue axis. */
  #tipToCentre(tipX: number, tipZ: number, along: number, out: THREE.Vector3): THREE.Vector3 {
    return out
      .set(tipX, this.#ballY, tipZ)
      .addScaledVector(this.#cueAxis, along - this.#cueLength * 0.5);
  }

  #stepBreak(t: number): void {
    this.#poseCue(t);
    const sim = this.#sim;
    if (!sim) return;
    const simT = t - CUE_IMPACT;
    const positions = samplePoolBreak(sim, Math.max(0, simT), this.#samples);
    for (let i = 0; i < this.#balls.length; i++) {
      const ball = this.#balls[i]!;
      const p = positions[i];
      if (!p) continue;
      const drop = this.#drops[i];
      if (drop && simT >= drop.timeSec) {
        const u = clamp01((simT - drop.timeSec) / POCKET_DROP_SEC);
        if (u >= 1) {
          ball.visible = false;
        } else {
          ball.visible = true;
          ball.position.set(
            p.x + (drop.x - p.x) * u,
            this.#ballY - POCKET_DROP_DEPTH * u * u,
            p.z + (drop.z - p.z) * u
          );
        }
      } else {
        ball.visible = true;
        ball.position.set(p.x, this.#ballY, p.z);
      }
      ball.updateMatrixWorld(true);
    }
    const ballsDone = simT >= sim.restTimeSec + POCKET_DROP_SEC;
    if (ballsDone && t >= CUE_RETURN_END) {
      this.#cue.position.copy(this.#cueRestPos);
      this.#cue.quaternion.copy(this.#cueRestQuat);
      this.#cue.updateMatrixWorld(true);
      this.#phase = 'broken';
    }
  }

  #poseCue(t: number): void {
    const cue = this.#cue;
    if (t <= CUE_ADDRESS_END) {
      const u = easeInOutCubic(clamp01(t / CUE_ADDRESS_END));
      cue.position.lerpVectors(this.#cueRestPos, this.#cueAddressPos, u);
      // Lift the cue off the rail in a small arc while it swings round to the shot line.
      cue.position.y += Math.sin(u * Math.PI) * 0.12;
      cue.quaternion.slerpQuaternions(this.#cueRestQuat, this.#cueAddressQuat, u);
    } else if (t <= CUE_DRAW_END) {
      const u = easeInOutCubic(clamp01((t - CUE_ADDRESS_END) / (CUE_DRAW_END - CUE_ADDRESS_END)));
      cue.quaternion.copy(this.#cueAddressQuat);
      cue.position.copy(this.#cueAddressPos).addScaledVector(this.#cueAxis, -CUE_DRAW_BACK * u);
    } else if (t <= CUE_IMPACT) {
      const u = clamp01((t - CUE_DRAW_END) / (CUE_IMPACT - CUE_DRAW_END));
      const travel = CUE_DRAW_BACK + CUE_TIP_GAP;
      cue.quaternion.copy(this.#cueAddressQuat);
      cue.position.copy(this.#cueAddressPos).addScaledVector(this.#cueAxis, -CUE_DRAW_BACK + travel * u * u);
    } else if (t <= CUE_FOLLOW_END) {
      const u = clamp01((t - CUE_IMPACT) / (CUE_FOLLOW_END - CUE_IMPACT));
      cue.quaternion.copy(this.#cueAddressQuat);
      cue.position
        .copy(this.#cueAddressPos)
        .addScaledVector(this.#cueAxis, CUE_TIP_GAP + CUE_FOLLOW_THROUGH * (1 - (1 - u) * (1 - u)));
    } else if (t <= CUE_RETURN_START) {
      // Hold the follow-through, lifted slightly clear of the moving balls.
      const u = clamp01((t - CUE_FOLLOW_END) / 0.3);
      cue.quaternion.copy(this.#cueAddressQuat);
      cue.position
        .copy(this.#cueAddressPos)
        .addScaledVector(this.#cueAxis, CUE_TIP_GAP + CUE_FOLLOW_THROUGH - 0.25 * easeInOutCubic(u));
      cue.position.y += 0.05 * easeInOutCubic(u);
    } else {
      const u = easeInOutCubic(clamp01((t - CUE_RETURN_START) / (CUE_RETURN_END - CUE_RETURN_START)));
      const from = this.#tmp
        .copy(this.#cueAddressPos)
        .addScaledVector(this.#cueAxis, CUE_TIP_GAP + CUE_FOLLOW_THROUGH - 0.25);
      from.y += 0.05;
      cue.position.lerpVectors(from, this.#cueRestPos, u);
      cue.position.y += Math.sin(u * Math.PI) * 0.08;
      cue.quaternion.slerpQuaternions(this.#cueAddressQuat, this.#cueRestQuat, u);
    }
    cue.updateMatrixWorld(true);
  }

  // --- Re-rack -----------------------------------------------------------------------------

  #startRack(): void {
    for (let i = 0; i < this.#balls.length; i++) {
      const ball = this.#balls[i]!;
      const from = this.#rackFrom[i]!;
      if (ball.visible) {
        from.copy(ball.position);
      } else {
        // Pocketed: rise out of the pocket it dropped into.
        const drop = this.#drops[i];
        from.set(drop?.x ?? ball.position.x, this.#ballY - POCKET_DROP_DEPTH, drop?.z ?? ball.position.z);
        ball.position.copy(from);
        ball.visible = true;
      }
    }
    this.#phase = 'racking';
    this.#elapsed = 0;
  }

  #stepRack(t: number): void {
    const n = this.#balls.length;
    let done = true;
    for (let i = 0; i < n; i++) {
      const ball = this.#balls[i]!;
      const from = this.#rackFrom[i]!;
      const to = this.#rack[i]!;
      // Stagger the balls slightly so the rack assembles rather than snapping at once.
      const delay = (i / Math.max(1, n - 1)) * 0.25;
      const raw = clamp01((t - delay) / (RACK_SEC - 0.25));
      if (raw < 1) done = false;
      const u = easeInOutCubic(raw);
      ball.position.set(
        from.x + (to.x - from.x) * u,
        from.y + (this.#ballY - from.y) * u + Math.sin(u * Math.PI) * RACK_LIFT,
        from.z + (to.z - from.z) * u
      );
      ball.updateMatrixWorld(true);
    }
    if (done) {
      for (let i = 0; i < n; i++) {
        const ball = this.#balls[i]!;
        const to = this.#rack[i]!;
        ball.position.set(to.x, this.#ballY, to.z);
        ball.updateMatrixWorld(true);
      }
      this.#sim = null;
      this.#phase = 'racked';
    }
  }
}
