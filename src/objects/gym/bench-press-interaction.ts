import type * as THREE from 'three';
import type {
  AnimatedInteractable,
  FirstPersonPoseSample,
} from '../../engine/interaction/handlers/animated-interactable.ts';

export const GYM_BENCH_PRESS_ID = 'gym-bench-press';
export const TOTAL_BENCH_DURATION_SEC = 7.4;
export const BENCH_RACK_Y = 0.88;

const OB_ROT = Math.atan2(2.49, 28.98);
const OB_COS = Math.cos(OB_ROT);
const OB_SIN = Math.sin(OB_ROT);
const OB_ORIGIN_X = -22.47;
const OB_ORIGIN_Z = 16.0;

const RACK_OB_U = 1.52;
const RACK_OB_V = 4.02;

export const STAND_OB_U = 2.05;
export const STAND_OB_V = 2.65;
const STAND_EYE_HEIGHT = 1.6;
const STAND_PITCH_RAD = -0.12;

const BENCH_ACTIVE_X = 0.0;
const BENCH_ACTIVE_Z = 0.24;
const BENCH_ACTIVE_ROT_Y = 0.0;

const BAR_LOCKOUT_Y = 0.96;
const BAR_CHEST_Y = 0.62;
const BAR_LOCKOUT_Z_OFFSET = 0.212;
const BAR_CHEST_Z_OFFSET = 0.262;

const EYE_LIE_Y = 0.58;
const EYE_UNRACK_DIP_Y = 0.012;
const EYE_RACKED_Z_OFFSET = 0.032;
const EYE_PRESS_Z_OFFSET = 0.165;

export interface BenchPressPoseSample extends FirstPersonPoseSample {
  readonly eyeX: number;
  readonly eyeY: number;
  readonly eyeZ: number;
  readonly footX: number;
  readonly footY: number;
  readonly footZ: number;
  readonly rollRad: number;
  readonly fovBoostDeg: number;
}

export interface JCupMeshEntry {
  readonly mesh: THREE.Object3D;
  readonly restY: number;
}

export type JCupMeshInput = THREE.Object3D | JCupMeshEntry;

export interface GymBenchPressConfig {
  readonly rackGroup: THREE.Group;
  readonly barbellGroup: THREE.Group;
  readonly benchGroup: THREE.Group;
  readonly jCupMeshes: readonly JCupMeshInput[];
  readonly gymFloorY: number;
  readonly clickableTargets?: readonly THREE.Object3D[];
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeInOutCubic(t: number): number {
  const u = clamp01(t);
  return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
}

function easeInOutSine(t: number): number {
  const u = clamp01(t);
  return -(Math.cos(Math.PI * u) - 1) * 0.5;
}

function easeOutCubic(t: number): number {
  const u = clamp01(t);
  return 1 - Math.pow(1 - u, 3);
}

function outbuildingToWorldXZ(obU: number, obV: number): readonly [number, number] {
  const wx = OB_ORIGIN_X + obU * OB_COS + obV * OB_SIN;
  const wz = OB_ORIGIN_Z - obU * OB_SIN + obV * OB_COS;
  return [wx, wz];
}

function rackLocalToOutbuildingUV(lx: number, lz: number): readonly [number, number] {
  return [RACK_OB_U - lx, RACK_OB_V - lz];
}

function worldXZToOutbuildingUV(wx: number, wz: number): readonly [number, number] {
  const dx = wx - OB_ORIGIN_X;
  const dz = wz - OB_ORIGIN_Z;
  const obU = dx * OB_COS - dz * OB_SIN;
  const obV = dx * OB_SIN + dz * OB_COS;
  return [obU, obV];
}

/**
 * Self-contained 1st-person interactive controller for the **Nike Strength Squat Cage &
 * Competition Flat Bench Press** (`outbuildings.gym.nikeSquatRack`).
 *
 * Choreographs a 6-stage `7.4s` 1st-person bench press set (`102 kg / 225 lb`):
 * 1. (`0.00s -> 1.05s`) Bench slide-in under the front uprights, J-cup & barbell lower to
 *    competition bench rack height (`0.88m`), and 1PV camera lie-back on the competition pad.
 * 2. (`1.05s -> 1.65s`) Grip & unrack to lockout (`y = 0.96m`) over the mid-chest with weight-settle dip.
 * 3. (`1.65s -> 3.05s`) Rep 1 — clean eccentric descent to chest (`y = 0.62m`), brief pause, explosive lockout.
 * 4. (`3.05s -> 4.55s`) Rep 2 — working rep with mid-range sticking-point slowdown (`y ≈ 0.78m`) & subtle bar roll.
 * 5. (`4.55s -> 6.35s`) Rep 3 — max-effort grinder rep stalling at the sticking point (`y ≈ 0.76m` at `5.55s..5.95s`)
 *    with high-frequency isometric tremor (`±4mm` X/Y vibration, `±0.018 rad` bar tilt, `+4.8°` FOV boost) before lockout.
 * 6. (`6.35s -> 7.40s`) Re-rack into J-cups and restore rack, bench, and standing 1PV camera pose.
 */
export class GymBenchPressController implements AnimatedInteractable {
  public readonly id = GYM_BENCH_PRESS_ID;
  public readonly label = 'Nike Squat Rack & Bench Press';
  public readonly aliases = [
    'bench press',
    'squat rack',
    'barbell',
    'lift weights',
    'bench',
    'gym rack',
  ] as const;
  public readonly clickableTargets: readonly THREE.Object3D[];

  readonly #barbellGroup: THREE.Group;
  readonly #benchGroup: THREE.Group;
  readonly #jCups: readonly JCupMeshEntry[];
  readonly #gymFloorY: number;

  readonly #barRestX: number;
  readonly #barRestY: number;
  readonly #barRestZ: number;
  readonly #benchRestX: number;
  readonly #benchRestY: number;
  readonly #benchRestZ: number;
  readonly #benchRestRotY: number;

  #phase: 'idle' | 'active' = 'idle';
  #elapsedSec = 0;
  #firstPersonActive = false;
  #currentPose: BenchPressPoseSample | null = null;

  public constructor(config: GymBenchPressConfig) {
    this.#barbellGroup = config.barbellGroup;
    this.#benchGroup = config.benchGroup;
    this.#gymFloorY = config.gymFloorY;
    this.clickableTargets = config.clickableTargets ?? [config.rackGroup];

    this.#barRestX = config.barbellGroup.position.x;
    this.#barRestY = config.barbellGroup.position.y;
    this.#barRestZ = config.barbellGroup.position.z;

    this.#benchRestX = config.benchGroup.position.x;
    this.#benchRestY = config.benchGroup.position.y;
    this.#benchRestZ = config.benchGroup.position.z;
    this.#benchRestRotY = config.benchGroup.rotation.y;

    this.#jCups = config.jCupMeshes.map((entry) => {
      if ('mesh' in entry) {
        return { mesh: entry.mesh, restY: entry.restY };
      }
      return { mesh: entry, restY: entry.position.y };
    });
  }

  public trigger(): boolean {
    if (this.#phase === 'active') {
      this.cancelFirstPerson();
      return true;
    }
    this.#phase = 'active';
    this.#elapsedSec = 0;
    this.#firstPersonActive = true;
    this.#applyPoseAtTime(0);
    return true;
  }

  public describe(): string {
    return this.#phase === 'active'
      ? 'Rack Barbell & Stand Up'
      : 'Bench Press on Squat Rack (102 kg)';
  }

  public isFirstPersonActive(): boolean {
    return this.#firstPersonActive;
  }

  public sampleFirstPersonPose(): BenchPressPoseSample | null {
    if (!this.#firstPersonActive) {
      return null;
    }
    return this.#currentPose;
  }

  public cancelFirstPerson(): void {
    this.#resetToRestPose();
    this.#phase = 'idle';
    this.#elapsedSec = 0;
    this.#firstPersonActive = false;
    this.#currentPose = null;
  }

  public isPlayerInProximityZone(footX: number, footY: number, footZ: number): boolean {
    if (Math.abs(footY - this.#gymFloorY) >= 0.65) {
      return false;
    }
    const [obU, obV] = worldXZToOutbuildingUV(footX, footZ);
    return obU >= 0.55 && obU <= 2.45 && obV >= 2.5 && obV <= 4.65;
  }

  public collectDynamicObjects(out: Set<THREE.Object3D>): void {
    this.#barbellGroup.traverse((c) => out.add(c));
    this.#benchGroup.traverse((c) => out.add(c));
    for (const jCup of this.#jCups) {
      jCup.mesh.traverse((c) => out.add(c));
    }
  }

  public step(dtSeconds: number): boolean {
    if (this.#phase !== 'active') {
      return false;
    }
    const dt = Math.max(0, dtSeconds);
    this.#elapsedSec += dt;
    if (this.#elapsedSec >= TOTAL_BENCH_DURATION_SEC) {
      this.cancelFirstPerson();
      return true;
    }
    this.#applyPoseAtTime(this.#elapsedSec);
    return true;
  }

  public getElapsedSec(): number {
    return this.#elapsedSec;
  }

  #resetToRestPose(): void {
    this.#barbellGroup.position.set(this.#barRestX, this.#barRestY, this.#barRestZ);
    this.#barbellGroup.rotation.set(0, 0, 0);
    this.#barbellGroup.updateMatrixWorld(true);

    this.#benchGroup.position.set(this.#benchRestX, this.#benchRestY, this.#benchRestZ);
    this.#benchGroup.rotation.set(0, this.#benchRestRotY, 0);
    this.#benchGroup.updateMatrixWorld(true);

    for (const jCup of this.#jCups) {
      jCup.mesh.position.y = jCup.restY;
      jCup.mesh.updateMatrixWorld(true);
    }
  }

  #setRackHeight(rackY: number): void {
    const deltaY = rackY - this.#barRestY;
    for (const jCup of this.#jCups) {
      jCup.mesh.position.y = jCup.restY + deltaY;
      jCup.mesh.updateMatrixWorld(true);
    }
  }

  #applyPoseAtTime(t: number): void {
    const barRackedZ = this.#barRestZ;
    const barLockoutZ = this.#barRestZ + BAR_LOCKOUT_Z_OFFSET;
    const barChestZ = this.#barRestZ + BAR_CHEST_Z_OFFSET;

    const eyeRackedLocalZ = this.#barRestZ + EYE_RACKED_Z_OFFSET;
    const eyePressLocalZ = this.#barRestZ + EYE_PRESS_Z_OFFSET;
    const [lieObU, lieObV] = rackLocalToOutbuildingUV(0, eyeRackedLocalZ);
    const [standWx, standWz] = outbuildingToWorldXZ(STAND_OB_U, STAND_OB_V);

    const lieYawRad = Math.atan2(OB_SIN, OB_COS);
    const standYawRad = lieYawRad + Math.PI;

    let barX = this.#barRestX;
    let barY = BENCH_RACK_Y;
    let barZ = barRackedZ;
    let barRollZ = 0;

    let rackY = BENCH_RACK_Y;
    let benchSlideU = 1;

    let eyeLocalX = 0;
    let eyeLocalY = EYE_LIE_Y;
    let eyeLocalZ = eyeRackedLocalZ;
    let useStandingBlend = false;
    let standBlendT = 0;

    let yawRad = lieYawRad;
    let pitchRad = 1.34;
    let rollRad = 0;
    let fovBoostDeg = 0;

    if (t <= 1.05) {
      // Stage 1 (0.00s -> 1.05s): Bench slide-in, rack height lower, and 1PV lie-back
      const u = easeInOutCubic(t / 1.05);
      const camU = easeInOutSine(t / 1.05);
      benchSlideU = u;
      rackY = lerp(this.#barRestY, BENCH_RACK_Y, u);
      barY = rackY;
      barZ = barRackedZ;

      useStandingBlend = true;
      standBlendT = camU;
      yawRad = lerp(standYawRad, lieYawRad, camU);
      pitchRad = lerp(STAND_PITCH_RAD, 1.34, camU);
      rollRad = Math.sin(camU * Math.PI) * 0.025;
      fovBoostDeg = 0;
    } else if (t <= 1.65) {
      // Stage 2 (1.05s -> 1.65s): Grip & unrack 102 kg barbell to lockout over mid-chest
      const u = easeInOutCubic((t - 1.05) / 0.6);
      barY = lerp(BENCH_RACK_Y, BAR_LOCKOUT_Y, u);
      barZ = lerp(barRackedZ, barLockoutZ, u);

      const settleDip = easeOutCubic(u) * EYE_UNRACK_DIP_Y + Math.sin(u * Math.PI) * 0.004;
      eyeLocalY = EYE_LIE_Y - settleDip;
      eyeLocalZ = lerp(eyeRackedLocalZ, eyePressLocalZ, u);
      pitchRad = lerp(1.34, 1.42, u);
      rollRad = Math.sin(u * Math.PI) * 0.006;
      fovBoostDeg = u * 0.8;
    } else if (t <= 3.05) {
      // Stage 3 (1.65s -> 3.05s): Rep 1 — Clean explosive rep
      if (t <= 2.3) {
        // Eccentric descent (1.65s -> 2.30s)
        const u = easeInOutSine((t - 1.65) / 0.65);
        barY = lerp(BAR_LOCKOUT_Y, BAR_CHEST_Y, u);
        barZ = lerp(barLockoutZ, barChestZ, u);
        eyeLocalY = lerp(EYE_LIE_Y - EYE_UNRACK_DIP_Y, 0.535, u);
        eyeLocalZ = lerp(eyePressLocalZ, this.#barRestZ + 0.205, u);
        pitchRad = lerp(1.42, 1.26, u);
        fovBoostDeg = lerp(0.8, 1.1, u);
      } else if (t <= 2.4) {
        // Brief 0.1s chest pause (2.30s -> 2.40s)
        barY = BAR_CHEST_Y;
        barZ = barChestZ;
        eyeLocalY = 0.535;
        eyeLocalZ = this.#barRestZ + 0.205;
        pitchRad = 1.26;
        fovBoostDeg = 1.1;
      } else {
        // Explosive concentric press (2.40s -> 3.05s)
        const rawU = clamp01((t - 2.4) / 0.65);
        const u = easeOutCubic(rawU);
        barY = lerp(BAR_CHEST_Y, BAR_LOCKOUT_Y, u);
        barZ = lerp(barChestZ, barLockoutZ, u);
        eyeLocalY = lerp(0.535, EYE_LIE_Y - EYE_UNRACK_DIP_Y, u);
        eyeLocalZ = lerp(this.#barRestZ + 0.205, eyePressLocalZ, u);
        pitchRad = lerp(1.26, 1.42, u);
        fovBoostDeg = lerp(1.1, 0.8, rawU) + Math.sin(rawU * Math.PI) * 1.6;
      }
    } else if (t <= 4.55) {
      // Stage 4 (3.05s -> 4.55s): Rep 2 — Working rep with sticking-point slowdown around y = 0.78m
      if (t <= 3.7) {
        // Controlled descent (3.05s -> 3.70s)
        const u = easeInOutSine((t - 3.05) / 0.65);
        barY = lerp(BAR_LOCKOUT_Y, BAR_CHEST_Y, u);
        barZ = lerp(barLockoutZ, barChestZ, u);
        eyeLocalY = lerp(EYE_LIE_Y - EYE_UNRACK_DIP_Y, 0.532, u);
        eyeLocalZ = lerp(eyePressLocalZ, this.#barRestZ + 0.205, u);
        pitchRad = lerp(1.42, 1.25, u);
        fovBoostDeg = lerp(0.8, 1.4, u);
      } else {
        // Harder concentric drive (3.70s -> 4.55s) with sticking-point slowdown around localY = 0.78m
        const raw = clamp01((t - 3.7) / 0.85);
        let pressFrac: number;
        if (raw < 0.35) {
          pressFrac = easeOutCubic(raw / 0.35) * 0.44;
        } else if (raw < 0.65) {
          const s = (raw - 0.35) / 0.3;
          pressFrac = 0.44 + s * 0.12;
        } else {
          const s = easeInOutCubic((raw - 0.65) / 0.35);
          pressFrac = 0.56 + s * 0.44;
        }
        barY = lerp(BAR_CHEST_Y, BAR_LOCKOUT_Y, pressFrac);
        barZ = lerp(barChestZ, barLockoutZ, pressFrac);
        const effortEnv = Math.sin(raw * Math.PI);
        barRollZ = Math.sin(raw * Math.PI * 2) * 0.012 * effortEnv;
        eyeLocalY = lerp(0.532, EYE_LIE_Y - EYE_UNRACK_DIP_Y, pressFrac);
        eyeLocalZ = lerp(this.#barRestZ + 0.205, eyePressLocalZ, pressFrac);
        pitchRad = lerp(1.25, 1.42, pressFrac) - effortEnv * 0.02;
        rollRad = Math.sin(raw * Math.PI) * 0.014;
        fovBoostDeg = lerp(1.4, 0.8, raw) + effortEnv * 2.7;
      }
    } else if (t <= 6.35) {
      // Stage 5 (4.55s -> 6.35s): Rep 3 — Max-effort grinder rep
      if (t <= 5.2) {
        // Controlled descent (4.55s -> 5.20s)
        const u = easeInOutSine((t - 4.55) / 0.65);
        barY = lerp(BAR_LOCKOUT_Y, BAR_CHEST_Y, u);
        barZ = lerp(barLockoutZ, barChestZ, u);
        eyeLocalY = lerp(EYE_LIE_Y - EYE_UNRACK_DIP_Y, 0.53, u);
        eyeLocalZ = lerp(eyePressLocalZ, this.#barRestZ + 0.205, u);
        pitchRad = lerp(1.42, 1.24, u);
        fovBoostDeg = lerp(0.8, 1.8, u);
      } else {
        // The Grind (5.20s -> 6.35s): stalls at sticking point (localY ≈ 0.76m at 5.55s..5.95s)
        let pressFrac: number;
        let tremorGain = 0;
        if (t <= 5.55) {
          const u = easeOutCubic((t - 5.2) / 0.35);
          pressFrac = u * 0.4; // 0.62 -> 0.756m
          tremorGain = u * 0.65;
        } else if (t <= 5.95) {
          const u = (t - 5.55) / 0.4;
          pressFrac = 0.4 + u * 0.045; // stalls around 0.756m..0.771m (~0.76m)
          tremorGain = 1.0;
        } else {
          const u = easeInOutCubic((t - 5.95) / 0.4);
          pressFrac = 0.445 + u * 0.555; // breaks through to 0.96m lockout
          tremorGain = 1 - u;
        }

        const tremorX = Math.sin(t * 52) * 0.004 * tremorGain;
        const tremorY = Math.cos(t * 61) * 0.004 * tremorGain;
        barX = this.#barRestX + tremorX;
        barY = lerp(BAR_CHEST_Y, BAR_LOCKOUT_Y, pressFrac) + tremorY;
        barZ = lerp(barChestZ, barLockoutZ, pressFrac);
        barRollZ = Math.sin(t * 37) * 0.018 * tremorGain;

        const grindNorm = clamp01((t - 5.2) / 1.15);
        const strainEnv = Math.sin(grindNorm * Math.PI);
        eyeLocalX = Math.sin(t * 44) * 0.002 * tremorGain;
        eyeLocalY = lerp(0.53, EYE_LIE_Y - EYE_UNRACK_DIP_Y, pressFrac) - tremorGain * 0.006;
        eyeLocalZ = lerp(this.#barRestZ + 0.205, eyePressLocalZ, pressFrac);
        pitchRad =
          lerp(1.24, 1.42, pressFrac) -
          tremorGain * 0.035 +
          Math.sin(t * 31) * 0.008 * tremorGain;
        rollRad = Math.sin(t * 29) * 0.018 * tremorGain;
        fovBoostDeg = lerp(1.8, 0.8, grindNorm) + strainEnv * 3.2;
      }
    } else {
      // Stage 6 (6.35s -> 7.40s): Re-rack into J-cups & stand up
      if (t <= 6.8) {
        // Guide barbell back into J-cups (6.35s -> 6.80s)
        const u = easeInOutCubic((t - 6.35) / 0.45);
        barY = lerp(BAR_LOCKOUT_Y, BENCH_RACK_Y, u);
        barZ = lerp(barLockoutZ, barRackedZ, u);
        rackY = BENCH_RACK_Y;
        benchSlideU = 1;

        eyeLocalY = lerp(EYE_LIE_Y - EYE_UNRACK_DIP_Y, EYE_LIE_Y, u);
        eyeLocalZ = lerp(eyePressLocalZ, eyeRackedLocalZ, u);
        pitchRad = lerp(1.42, 1.34, u);
        fovBoostDeg = lerp(0.8, 0, u);
      } else {
        // Restore rack & bench to resting positions while 1PV camera sits up and steps off (6.80s -> 7.40s)
        const u = easeInOutCubic((t - 6.8) / 0.6);
        const camU = easeInOutSine((t - 6.8) / 0.6);
        benchSlideU = 1 - u;
        rackY = lerp(BENCH_RACK_Y, this.#barRestY, u);
        barY = rackY;
        barZ = barRackedZ;

        useStandingBlend = true;
        standBlendT = 1 - camU;
        yawRad = lerp(lieYawRad, standYawRad, camU);
        pitchRad = lerp(1.34, STAND_PITCH_RAD, camU);
        rollRad = Math.sin(camU * Math.PI) * -0.02;
        fovBoostDeg = 0;
      }
    }

    // Apply bench transform
    this.#benchGroup.position.set(
      lerp(this.#benchRestX, BENCH_ACTIVE_X, benchSlideU),
      this.#benchRestY,
      lerp(this.#benchRestZ, BENCH_ACTIVE_Z, benchSlideU)
    );
    this.#benchGroup.rotation.set(0, lerp(this.#benchRestRotY, BENCH_ACTIVE_ROT_Y, benchSlideU), 0);
    this.#benchGroup.updateMatrixWorld(true);

    // Apply J-cup transforms
    this.#setRackHeight(rackY);

    // Apply barbell transform
    this.#barbellGroup.position.set(barX, barY, barZ);
    this.#barbellGroup.rotation.set(0, 0, barRollZ);
    this.#barbellGroup.updateMatrixWorld(true);

    // Compute world-space 1PV eye & foot positions
    let eyeWx: number;
    let eyeWy: number;
    let eyeWz: number;
    let footWx: number;
    let footWy: number;
    let footWz: number;

    if (useStandingBlend) {
      const [lieEyeWx, lieEyeWz] = outbuildingToWorldXZ(lieObU, lieObV);
      const lieEyeWy = this.#gymFloorY + EYE_LIE_Y;
      const standEyeWy = this.#gymFloorY + STAND_EYE_HEIGHT;

      eyeWx = lerp(standWx, lieEyeWx, standBlendT);
      eyeWy = lerp(standEyeWy, lieEyeWy, standBlendT);
      eyeWz = lerp(standWz, lieEyeWz, standBlendT);

      footWx = eyeWx;
      footWy = this.#gymFloorY;
      footWz = eyeWz;
    } else {
      const [curObU, curObV] = rackLocalToOutbuildingUV(eyeLocalX, eyeLocalZ);
      const [wx, wz] = outbuildingToWorldXZ(curObU, curObV);
      eyeWx = wx;
      eyeWy = this.#gymFloorY + eyeLocalY;
      eyeWz = wz;

      footWx = eyeWx;
      footWy = this.#gymFloorY;
      footWz = eyeWz;
    }

    this.#currentPose = {
      eyePosition: [eyeWx, eyeWy, eyeWz],
      footPosition: [footWx, footWy, footWz],
      eyeX: eyeWx,
      eyeY: eyeWy,
      eyeZ: eyeWz,
      footX: footWx,
      footY: footWy,
      footZ: footWz,
      yawRad,
      pitchRad,
      rollRad,
      fovBoostDeg,
    };
  }
}
