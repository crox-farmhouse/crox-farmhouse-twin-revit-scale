import * as THREE from 'three';
import { soundEngine } from '../../engine/audio/sound-engine.ts';
import type {
  AnimatedInteractable,
  FirstPersonPoseSample,
} from '../../engine/interaction/handlers/animated-interactable.ts';

export const HALL_PIANO_PLAY_ID = 'hall-piano-play';
export const TOTAL_PIANO_DURATION_SEC = 9.6;

/**
 * East-West Wing transform constants (matching `ground-floor-materials.ts`) and
 * `hall.rolandGP6PE` placement (`[-15.111, lowerFloorY, -0.58]`, `rotation.y = 0.92 - Math.PI`).
 */
const EAST_WING_ROT_Y = -Math.atan2(0.705, 5.27);
const EAST_WING_COS = Math.cos(EAST_WING_ROT_Y);
const EAST_WING_SIN = Math.sin(EAST_WING_ROT_Y);
const EAST_WING_OFFSET_X = -16.92 - (-16.92 * EAST_WING_COS + 2.54 * EAST_WING_SIN);
const EAST_WING_OFFSET_Z = 2.61 - (16.92 * EAST_WING_SIN + 2.54 * EAST_WING_COS);

const PIANO_EW_X = -15.111;
const PIANO_EW_Z = -0.58;
const PIANO_LOCAL_ROT_Y = 0.92 - Math.PI;

export const WORLD_PIANO_ROT_Y = EAST_WING_ROT_Y + PIANO_LOCAL_ROT_Y;
const WORLD_PIANO_COS = Math.cos(WORLD_PIANO_ROT_Y);
const WORLD_PIANO_SIN = Math.sin(WORLD_PIANO_ROT_Y);

export const WORLD_PIANO_ORIGIN_X =
  PIANO_EW_X * EAST_WING_COS + PIANO_EW_Z * EAST_WING_SIN + EAST_WING_OFFSET_X;
export const WORLD_PIANO_ORIGIN_Z =
  -PIANO_EW_X * EAST_WING_SIN + PIANO_EW_Z * EAST_WING_COS + EAST_WING_OFFSET_Z;

const LID_REST_ROT_Z = 0.16;
const LID_CONCERT_ROT_Z = 0.46;
const PROP_STICK_REST_Y = 0.985;
const PROP_STICK_REST_ROT_Z = -0.14;
const BENCH_REST_Z = 0.74;
const WHITE_KEYS_REST_Y = 0.676;
const BLACK_KEY_REST_Y = 0.692;
const PEDAL_REST_Y = 0.045;
const PEDAL_REST_ROT_X = 0.15;
const TOUCH_PANEL_REST_EMISSIVE = 0.28;
const TOUCH_PANEL_ACTIVE_EMISSIVE = 1.35;

const STAND_LOCAL_X = 0.0;
const STAND_LOCAL_Z = 1.06;
const STAND_EYE_HEIGHT = 1.6;
const SEATED_LOCAL_Z = 0.75;
const SEATED_EYE_HEIGHT = 1.18;

export type RolandPianoPlayPhase = 'idle' | 'playing';

export interface RolandPianoConfig {
  readonly pianoGroup: THREE.Group;
  readonly lidPivot: THREE.Group;
  readonly lidPropStick: THREE.Mesh;
  readonly benchGroup: THREE.Group;
  readonly whiteKeysMesh: THREE.Mesh;
  readonly blackKeyMeshes: readonly THREE.Mesh[];
  readonly pedalMeshes: readonly THREE.Mesh[]; // [soft, sostenuto, damper]
  readonly touchPanelMat: THREE.MeshStandardMaterial;
  readonly sheetMusicBook: THREE.Mesh;
  readonly hallFloorY: number;
  readonly clickableTargets?: readonly THREE.Object3D[];
}

interface PianoNoteEvent {
  readonly timeSec: number;
  readonly durationSec: number;
  readonly freqHz: number;
  readonly velocity: number;
  /** 0..35 black-key index for physical key depression animation. */
  readonly blackKeyIndex: number;
  /** -1 (bass left) .. +1 (treble right) for camera/hand expression. */
  readonly panRegister: number;
}

/**
 * Polyphonic recital score inspired by Debussy's *Clair de Lune* in D-flat major
 * (`Db`, `Eb`, `F`, `Gb`, `Ab`, `Bb`, `C`), voiced across bass accompaniment and lyrical
 * third/sixth treble melody intervals between `t = 1.15s` and `t = 8.40s`.
 */
const RECITAL_SCORE: readonly PianoNoteEvent[] = [
  // Measure 1: Expressive D-flat major opening chord & descending third motif
  { timeSec: 1.18, durationSec: 2.1, freqHz: 138.59, velocity: 0.62, blackKeyIndex: 5, panRegister: -0.65 },  // Db3
  { timeSec: 1.24, durationSec: 2.0, freqHz: 207.65, velocity: 0.56, blackKeyIndex: 8, panRegister: -0.35 },  // Ab3
  { timeSec: 1.32, durationSec: 1.8, freqHz: 440.00 * Math.pow(2, -4 / 12), velocity: 0.65, blackKeyIndex: 17, panRegister: 0.25 }, // F4
  { timeSec: 1.35, durationSec: 1.8, freqHz: 415.30, velocity: 0.72, blackKeyIndex: 18, panRegister: 0.40 },  // Ab4
  { timeSec: 2.05, durationSec: 1.3, freqHz: 349.23, velocity: 0.64, blackKeyIndex: 16, panRegister: 0.20 },  // F4
  { timeSec: 2.08, durationSec: 1.4, freqHz: 554.37, velocity: 0.78, blackKeyIndex: 20, panRegister: 0.55 },  // Db5
  { timeSec: 2.68, durationSec: 0.85, freqHz: 466.16, velocity: 0.68, blackKeyIndex: 19, panRegister: 0.45 }, // Bb4
  { timeSec: 2.71, durationSec: 0.85, freqHz: 369.99, velocity: 0.58, blackKeyIndex: 17, panRegister: 0.25 }, // Gb4

  // Measure 2: G-flat major ninth arpeggiated ripple
  { timeSec: 3.15, durationSec: 2.2, freqHz: 185.00, velocity: 0.66, blackKeyIndex: 7, panRegister: -0.55 },  // Gb3
  { timeSec: 3.30, durationSec: 2.0, freqHz: 277.18, velocity: 0.60, blackKeyIndex: 10, panRegister: -0.20 }, // Db4
  { timeSec: 3.45, durationSec: 1.8, freqHz: 369.99, velocity: 0.65, blackKeyIndex: 17, panRegister: 0.15 },  // Gb4
  { timeSec: 3.62, durationSec: 1.5, freqHz: 415.30, velocity: 0.74, blackKeyIndex: 18, panRegister: 0.38 },  // Ab4
  { timeSec: 4.10, durationSec: 0.95, freqHz: 369.99, velocity: 0.66, blackKeyIndex: 17, panRegister: 0.25 }, // Gb4
  { timeSec: 4.48, durationSec: 1.10, freqHz: 349.23, velocity: 0.64, blackKeyIndex: 15, panRegister: 0.18 }, // F4

  // Measure 3: E-flat minor seventh lyrical climb into high register
  { timeSec: 4.95, durationSec: 2.1, freqHz: 155.56, velocity: 0.70, blackKeyIndex: 6, panRegister: -0.60 },  // Eb3
  { timeSec: 5.10, durationSec: 1.9, freqHz: 233.08, velocity: 0.64, blackKeyIndex: 9, panRegister: -0.25 },  // Bb3
  { timeSec: 5.25, durationSec: 1.7, freqHz: 311.13, velocity: 0.70, blackKeyIndex: 11, panRegister: 0.05 },  // Eb4
  { timeSec: 5.45, durationSec: 1.5, freqHz: 369.99, velocity: 0.76, blackKeyIndex: 17, panRegister: 0.30 },  // Gb4
  { timeSec: 5.82, durationSec: 1.3, freqHz: 466.16, velocity: 0.82, blackKeyIndex: 19, panRegister: 0.50 },  // Bb4
  { timeSec: 6.20, durationSec: 1.2, freqHz: 415.30, velocity: 0.75, blackKeyIndex: 18, panRegister: 0.40 },  // Ab4
  { timeSec: 6.55, durationSec: 1.1, freqHz: 349.23, velocity: 0.68, blackKeyIndex: 16, panRegister: 0.22 },  // F4

  // Measure 4: A-flat dominant ninth -> Resolving D-flat major rolled concert chord
  { timeSec: 6.90, durationSec: 1.4, freqHz: 103.83, velocity: 0.72, blackKeyIndex: 3, panRegister: -0.78 },  // Ab2
  { timeSec: 7.05, durationSec: 1.3, freqHz: 207.65, velocity: 0.65, blackKeyIndex: 8, panRegister: -0.35 },  // Ab3
  { timeSec: 7.20, durationSec: 1.2, freqHz: 311.13, velocity: 0.70, blackKeyIndex: 11, panRegister: 0.05 },  // Eb4
  { timeSec: 7.52, durationSec: 1.9, freqHz: 138.59, velocity: 0.76, blackKeyIndex: 5, panRegister: -0.70 },  // Db3
  { timeSec: 7.62, durationSec: 1.8, freqHz: 207.65, velocity: 0.70, blackKeyIndex: 8, panRegister: -0.35 },  // Ab3
  { timeSec: 7.72, durationSec: 1.7, freqHz: 277.18, velocity: 0.72, blackKeyIndex: 10, panRegister: -0.05 }, // Db4
  { timeSec: 7.82, durationSec: 1.6, freqHz: 349.23, velocity: 0.75, blackKeyIndex: 16, panRegister: 0.22 },  // F4
  { timeSec: 7.92, durationSec: 1.5, freqHz: 415.30, velocity: 0.78, blackKeyIndex: 18, panRegister: 0.42 },  // Ab4
  { timeSec: 8.04, durationSec: 1.45, freqHz: 554.37, velocity: 0.85, blackKeyIndex: 20, panRegister: 0.65 }, // Db5
  { timeSec: 8.18, durationSec: 1.35, freqHz: 830.61, velocity: 0.68, blackKeyIndex: 25, panRegister: 0.82 }, // Ab5
];

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

/** Converts `pianoGroup` local `(lx, lz)` coordinates to world `[wx, wz]`. */
export function pianoLocalToWorldXZ(lx: number, lz: number): readonly [number, number] {
  return [
    WORLD_PIANO_ORIGIN_X + lx * WORLD_PIANO_COS + lz * WORLD_PIANO_SIN,
    WORLD_PIANO_ORIGIN_Z - lx * WORLD_PIANO_SIN + lz * WORLD_PIANO_COS,
  ];
}

/** Converts world `(wx, wz)` coordinates to `pianoGroup` local `[lx, lz]`. */
export function worldXZToPianoLocal(wx: number, wz: number): readonly [number, number] {
  const dx = wx - WORLD_PIANO_ORIGIN_X;
  const dz = wz - WORLD_PIANO_ORIGIN_Z;
  return [
    dx * WORLD_PIANO_COS - dz * WORLD_PIANO_SIN,
    dx * WORLD_PIANO_SIN + dz * WORLD_PIANO_COS,
  ];
}

/**
 * Self-contained 1st-person + 3D + Web Audio interactive controller for the Stair Hall
 * **Roland GP-6-PE Baby Grand Digital Piano** (`hall.rolandGP6PE`).
 *
 * Choreographs a `9.6s` classical recital performance:
 * 1. (`0.00s -> 1.10s`) Pull out the Roland BNC-05 artist bench, raise the polished-ebony
 *    grand lid to concert projection position, wake the backlit Smart Touch Panel, and sit
 *    at the 88-key PHA-50 hybrid keyboard.
 * 2. (`1.10s -> 8.50s`) Perform a polyphonic recital (*Clair de Lune* in D-flat major) with
 *    spatial 3D grand-piano synthesis, synchronized individual key depressions, damper & soft
 *    brass pedal articulation, and expressive 1st-person pianist head/torso movement.
 * 3. (`8.50s -> 9.60s`) Release pedals, lower the grand lid back to chamber stick angle,
 *    and stand up smoothly beside the bench.
 */
export class RolandPianoController implements AnimatedInteractable {
  public readonly id = HALL_PIANO_PLAY_ID;
  public readonly label = 'Roland GP-6-PE Baby Grand Piano';
  public readonly aliases = [
    'piano',
    'grand piano',
    'baby grand',
    'roland',
    'play piano',
    'hall piano',
  ] as const;
  public readonly clickableTargets: readonly THREE.Object3D[];

  readonly #lidPivot: THREE.Group;
  readonly #lidPropStick: THREE.Mesh;
  readonly #benchGroup: THREE.Group;
  readonly #whiteKeysMesh: THREE.Mesh;
  readonly #blackKeyMeshes: readonly THREE.Mesh[];
  readonly #pedalMeshes: readonly THREE.Mesh[];
  readonly #touchPanelMat: THREE.MeshStandardMaterial;
  readonly #sheetMusicBook: THREE.Mesh;
  readonly #hallFloorY: number;

  #phase: RolandPianoPlayPhase = 'idle';
  #elapsedSec = 0;
  #nextNoteIdx = 0;

  public constructor(config: RolandPianoConfig) {
    this.#lidPivot = config.lidPivot;
    this.#lidPropStick = config.lidPropStick;
    this.#benchGroup = config.benchGroup;
    this.#whiteKeysMesh = config.whiteKeysMesh;
    this.#blackKeyMeshes = config.blackKeyMeshes;
    this.#pedalMeshes = config.pedalMeshes;
    this.#touchPanelMat = config.touchPanelMat;
    this.#sheetMusicBook = config.sheetMusicBook;
    this.#hallFloorY = config.hallFloorY;
    this.clickableTargets = config.clickableTargets ?? [config.pianoGroup];
  }

  public getPhase(): RolandPianoPlayPhase {
    return this.#phase;
  }

  public getElapsedSec(): number {
    return this.#elapsedSec;
  }

  public trigger(): boolean {
    if (this.#phase === 'idle') {
      this.#phase = 'playing';
      this.#elapsedSec = 0;
      this.#nextNoteIdx = 0;
      this.#playBenchAndLidOpenSound();
      return true;
    }
    this.cancelFirstPerson();
    return true;
  }

  public describe(): string {
    return this.#phase === 'playing'
      ? 'Stop Playing Roland GP-6-PE Piano'
      : 'Play Roland GP-6-PE Baby Grand Piano';
  }

  public isFirstPersonActive(): boolean {
    return this.#phase === 'playing';
  }

  public cancelFirstPerson(): void {
    this.#phase = 'idle';
    this.#elapsedSec = 0;
    this.#nextNoteIdx = 0;
    this.#resetPoseToRest();
  }

  public isPlayerInProximityZone(footX: number, footY: number, footZ: number): boolean {
    const [lx, lz] = worldXZToPianoLocal(footX, footZ);
    return (
      Math.abs(footY - this.#hallFloorY) < 0.65 &&
      lx >= -0.85 &&
      lx <= 0.85 &&
      lz >= 0.15 &&
      lz <= 1.38
    );
  }

  public collectDynamicObjects(out: Set<THREE.Object3D>): void {
    this.#lidPivot.traverse((c) => out.add(c));
    out.add(this.#lidPropStick);
    this.#benchGroup.traverse((c) => out.add(c));
    out.add(this.#whiteKeysMesh);
    out.add(this.#sheetMusicBook);
    for (const bk of this.#blackKeyMeshes) out.add(bk);
    for (const ped of this.#pedalMeshes) out.add(ped);
  }

  public step(dtSeconds: number): boolean {
    if (this.#phase !== 'playing' || !Number.isFinite(dtSeconds) || dtSeconds <= 0) {
      return false;
    }

    const prevT = this.#elapsedSec;
    this.#elapsedSec += dtSeconds;
    const t = Math.min(this.#elapsedSec, TOTAL_PIANO_DURATION_SEC);

    // 1. Trigger any score notes crossed during this frame
    while (
      this.#nextNoteIdx < RECITAL_SCORE.length &&
      RECITAL_SCORE[this.#nextNoteIdx]!.timeSec <= this.#elapsedSec
    ) {
      const note = RECITAL_SCORE[this.#nextNoteIdx]!;
      this.#nextNoteIdx += 1;
      if (note.timeSec >= prevT - 0.05) {
        this.#playPianoNoteSound(note);
      }
    }

    if (prevT < 8.55 && this.#elapsedSec >= 8.55) {
      this.#playLidCloseAndBenchSound();
    }

    // 2. Lid & prop stick kinematics (open to concert angle during recital, settle back at end)
    let lidAlpha = 0;
    if (t < 1.1) {
      lidAlpha = easeInOutCubic(t / 1.1);
    } else if (t < 8.5) {
      lidAlpha = 1;
    } else {
      lidAlpha = 1 - easeInOutCubic((t - 8.5) / (TOTAL_PIANO_DURATION_SEC - 8.5));
    }

    this.#lidPivot.rotation.z = lerp(LID_REST_ROT_Z, LID_CONCERT_ROT_Z, lidAlpha);
    this.#lidPivot.updateMatrixWorld(true);

    this.#lidPropStick.position.y = lerp(PROP_STICK_REST_Y, PROP_STICK_REST_Y + 0.048, lidAlpha);
    this.#lidPropStick.rotation.z = lerp(PROP_STICK_REST_ROT_Z, -0.03, lidAlpha);
    this.#lidPropStick.updateMatrixWorld(true);

    // 3. Roland BNC-05 artist bench pull-out & slide-in
    let benchZ = BENCH_REST_Z;
    if (t < 0.5) {
      benchZ = lerp(BENCH_REST_Z, BENCH_REST_Z + 0.1, easeInOutCubic(t / 0.5));
    } else if (t < 1.1) {
      benchZ = lerp(BENCH_REST_Z + 0.1, SEATED_LOCAL_Z, easeInOutCubic((t - 0.5) / 0.6));
    } else if (t < 8.5) {
      benchZ = SEATED_LOCAL_Z;
    } else if (t < 9.05) {
      benchZ = lerp(SEATED_LOCAL_Z, BENCH_REST_Z + 0.09, easeInOutCubic((t - 8.5) / 0.55));
    } else {
      benchZ = lerp(
        BENCH_REST_Z + 0.09,
        BENCH_REST_Z,
        easeInOutCubic((t - 9.05) / (TOTAL_PIANO_DURATION_SEC - 9.05))
      );
    }
    this.#benchGroup.position.z = benchZ;
    this.#benchGroup.updateMatrixWorld(true);

    // 4. Smart Touch Panel illumination & sheet music folio micro-tilt
    this.#touchPanelMat.emissiveIntensity = lerp(
      TOUCH_PANEL_REST_EMISSIVE,
      TOUCH_PANEL_ACTIVE_EMISSIVE,
      lidAlpha
    );
    this.#sheetMusicBook.rotation.z = Math.sin(t * 1.4) * 0.012 * lidAlpha;
    this.#sheetMusicBook.updateMatrixWorld(true);

    // 5. Individual black key depressions & white keybed articulation from active score notes
    for (let i = 0; i < this.#blackKeyMeshes.length; i++) {
      const mesh = this.#blackKeyMeshes[i]!;
      let maxDepress = 0;
      for (let nIdx = 0; nIdx < RECITAL_SCORE.length; nIdx++) {
        const ev = RECITAL_SCORE[nIdx]!;
        if (ev.blackKeyIndex !== i) continue;
        const dtNote = t - ev.timeSec;
        if (dtNote >= 0 && dtNote <= ev.durationSec) {
          const attack = clamp01(dtNote / 0.035);
          const release = clamp01((ev.durationSec - dtNote) / 0.18);
          const env = attack * release * ev.velocity;
          if (env > maxDepress) maxDepress = env;
        }
      }
      mesh.position.y = BLACK_KEY_REST_Y - maxDepress * 0.0085;
      mesh.rotation.x = maxDepress * 0.048;
      mesh.updateMatrixWorld(true);
    }

    // Subtle white-key bed depression pulse on note attacks
    let whitePulse = 0;
    for (let nIdx = 0; nIdx < RECITAL_SCORE.length; nIdx++) {
      const ev = RECITAL_SCORE[nIdx]!;
      const dtNote = t - ev.timeSec;
      if (dtNote >= 0 && dtNote < 0.22) {
        const p = Math.sin((dtNote / 0.22) * Math.PI) * ev.velocity;
        if (p > whitePulse) whitePulse = p;
      }
    }
    this.#whiteKeysMesh.position.y = WHITE_KEYS_REST_Y - whitePulse * 0.0025;
    this.#whiteKeysMesh.rotation.x = whitePulse * 0.012;
    this.#whiteKeysMesh.updateMatrixWorld(true);

    // 6. Damper (right) and Soft / Una Corda (left) brass pedal articulation
    const damperPedal = this.#pedalMeshes[2];
    const softPedal = this.#pedalMeshes[0];
    if (damperPedal) {
      // Sustain pedal depressed during each harmonic measure, lifting briefly at chord changes (3.08s, 4.88s, 6.85s)
      let damperDown = 0;
      if (t >= 1.12 && t <= 8.48) {
        const repedalDip =
          Math.exp(-Math.pow((t - 3.1) / 0.12, 2)) +
          Math.exp(-Math.pow((t - 4.9) / 0.12, 2)) +
          Math.exp(-Math.pow((t - 6.86) / 0.12, 2));
        damperDown = clamp01(1 - repedalDip * 0.9) * lidAlpha;
      }
      damperPedal.position.y = PEDAL_REST_Y - damperDown * 0.006;
      damperPedal.rotation.x = PEDAL_REST_ROT_X + damperDown * 0.12;
      damperPedal.updateMatrixWorld(true);
    }
    if (softPedal) {
      const softDown =
        t >= 1.15 && t <= 2.9 ? Math.sin(clamp01((t - 1.15) / 1.75) * Math.PI) * 0.75 : 0;
      softPedal.position.y = PEDAL_REST_Y - softDown * 0.005;
      softPedal.rotation.x = PEDAL_REST_ROT_X + softDown * 0.09;
      softPedal.updateMatrixWorld(true);
    }

    if (this.#elapsedSec >= TOTAL_PIANO_DURATION_SEC) {
      this.#phase = 'idle';
      this.#elapsedSec = 0;
      this.#nextNoteIdx = 0;
      this.#resetPoseToRest();
    }

    return true;
  }

  public sampleFirstPersonPose(): FirstPersonPoseSample | null {
    if (this.#phase !== 'playing') return null;
    const t = Math.min(this.#elapsedSec, TOTAL_PIANO_DURATION_SEC);

    let sitAlpha = 0;
    if (t < 1.1) {
      sitAlpha = easeInOutCubic(t / 1.1);
    } else if (t < 8.5) {
      sitAlpha = 1;
    } else {
      sitAlpha = 1 - easeInOutCubic((t - 8.5) / (TOTAL_PIANO_DURATION_SEC - 8.5));
    }

    // Expressive upper-body sway across the 88-key keyboard while seated
    const playTime = Math.max(0, Math.min(7.4, t - 1.1));
    const phraseSwayX = Math.sin(playTime * 1.35) * 0.055 * sitAlpha;
    const phraseLeanZ = Math.cos(playTime * 0.95) * 0.028 * sitAlpha;

    const localX = lerp(STAND_LOCAL_X, phraseSwayX, sitAlpha);
    const localZ = lerp(STAND_LOCAL_Z, SEATED_LOCAL_Z - 0.12 + phraseLeanZ, sitAlpha);
    const [eyeX, eyeZ] = pianoLocalToWorldXZ(localX, localZ);
    const [footX, footZ] = pianoLocalToWorldXZ(
      lerp(STAND_LOCAL_X, 0, sitAlpha),
      lerp(STAND_LOCAL_Z, SEATED_LOCAL_Z, sitAlpha)
    );

    const eyeY =
      this.#hallFloorY +
      lerp(STAND_EYE_HEIGHT, SEATED_EYE_HEIGHT, sitAlpha) +
      Math.sin(playTime * 2.4) * 0.008 * sitAlpha;

    // Glance smoothly between bass & treble hands and up toward the sheet music / open lid
    const yawSway = -Math.sin(playTime * 1.35) * 0.11 * sitAlpha;
    const pitchSway = Math.sin(playTime * 1.8) * 0.055 * sitAlpha;
    const yawRad = WORLD_PIANO_ROT_Y + yawSway;
    const pitchRad = lerp(-0.18, -0.31, sitAlpha) + pitchSway;
    const rollRad = Math.sin(playTime * 1.35) * 0.018 * sitAlpha;
    const fovBoostDeg = Math.sin(clamp01((t - 1.1) / 7.4) * Math.PI) * 2.4 * sitAlpha;

    return {
      eyePosition: [eyeX, eyeY, eyeZ],
      footPosition: [footX, this.#hallFloorY, footZ],
      yawRad,
      pitchRad,
      rollRad,
      fovBoostDeg,
    };
  }

  #resetPoseToRest(): void {
    this.#lidPivot.rotation.z = LID_REST_ROT_Z;
    this.#lidPivot.updateMatrixWorld(true);

    this.#lidPropStick.position.y = PROP_STICK_REST_Y;
    this.#lidPropStick.rotation.z = PROP_STICK_REST_ROT_Z;
    this.#lidPropStick.updateMatrixWorld(true);

    this.#benchGroup.position.z = BENCH_REST_Z;
    this.#benchGroup.updateMatrixWorld(true);

    this.#touchPanelMat.emissiveIntensity = TOUCH_PANEL_REST_EMISSIVE;
    this.#sheetMusicBook.rotation.z = 0;
    this.#sheetMusicBook.updateMatrixWorld(true);

    this.#whiteKeysMesh.position.y = WHITE_KEYS_REST_Y;
    this.#whiteKeysMesh.rotation.x = 0;
    this.#whiteKeysMesh.updateMatrixWorld(true);

    for (const bk of this.#blackKeyMeshes) {
      bk.position.y = BLACK_KEY_REST_Y;
      bk.rotation.x = 0;
      bk.updateMatrixWorld(true);
    }

    for (const ped of this.#pedalMeshes) {
      ped.position.y = PEDAL_REST_Y;
      ped.rotation.x = PEDAL_REST_ROT_X;
      ped.updateMatrixWorld(true);
    }
  }

  // ---------------------------------------------------------------------------
  // Asset-encapsulated Roland GP-6-PE Concert Grand Web Audio Synthesis
  // ---------------------------------------------------------------------------

  #playBenchAndLidOpenSound(): void {
    const [wx, wz] = pianoLocalToWorldXZ(0, 0.25);
    soundEngine.playSpatial(
      { x: wx, y: this.#hallFloorY + 0.85, z: wz },
      (tk) => {
        const { now } = tk;
        // Soft leather bench slide & wooden lid lift
        tk.noiseBurst({
          startTime: now + 0.02,
          duration: 0.22,
          filterType: 'bandpass',
          freqStart: 420,
          freqEnd: 260,
          q: 2.0,
          gainPeak: 0.06,
          attackSec: 0.03,
        });
        // Brass prop stick latch click
        tk.tone({
          startTime: now + 0.72,
          duration: 0.08,
          type: 'triangle',
          freqStart: 680,
          freqEnd: 420,
          gainPeak: 0.075,
        });
      },
      { dryGain: 0.45, wetSend: 0.25, refDistance: 2.0, maxDistance: 18 }
    );
  }

  #playLidCloseAndBenchSound(): void {
    const [wx, wz] = pianoLocalToWorldXZ(0, 0.25);
    soundEngine.playSpatial(
      { x: wx, y: this.#hallFloorY + 0.85, z: wz },
      (tk) => {
        const { now } = tk;
        // Damper pedal felt release + soft-close lid cushion
        tk.tone({
          startTime: now,
          duration: 0.14,
          type: 'sine',
          freqStart: 145,
          freqEnd: 68,
          gainPeak: 0.08,
        });
        tk.noiseBurst({
          startTime: now + 0.18,
          duration: 0.24,
          filterType: 'lowpass',
          freqStart: 380,
          freqEnd: 180,
          q: 1.4,
          gainPeak: 0.055,
          attackSec: 0.04,
        });
      },
      { dryGain: 0.42, wetSend: 0.24, refDistance: 2.0, maxDistance: 18 }
    );
  }

  #playPianoNoteSound(note: PianoNoteEvent): void {
    const [wx, wz] = pianoLocalToWorldXZ(note.panRegister * 0.42, 0.05);
    const worldPos = { x: wx, y: this.#hallFloorY + 0.88, z: wz };

    soundEngine.playSpatial(
      worldPos,
      (tk) => {
        const { now } = tk;
        const vel = note.velocity;
        const dur = note.durationSec;
        const f0 = note.freqHz;

        // 1. Warm Concert Grand Fundamental (sine)
        tk.tone({
          startTime: now,
          duration: dur,
          type: 'sine',
          freqStart: f0 * 1.001,
          freqEnd: f0,
          gainPeak: 0.16 * vel,
          attackSec: 0.006,
        });

        // 2. 2nd Harmonic with subtle stretched-octave warmth (triangle)
        tk.tone({
          startTime: now,
          duration: dur * 0.68,
          type: 'triangle',
          freqStart: f0 * 2.0012,
          freqEnd: f0 * 2.0,
          gainPeak: 0.058 * vel,
          attackSec: 0.004,
        });

        // 3. 3rd Harmonic bell shimmer on initial hammer strike
        tk.tone({
          startTime: now,
          duration: Math.min(0.45, dur * 0.32),
          type: 'sine',
          freqStart: f0 * 3.003,
          freqEnd: f0 * 3.0,
          gainPeak: 0.024 * vel,
          attackSec: 0.003,
        });

        // 4. Felt hammer & PHA-50 wooden key action transient
        tk.noiseBurst({
          startTime: now,
          duration: 0.024,
          filterType: 'bandpass',
          freqStart: Math.min(3400, f0 * 4.5 + 650),
          freqEnd: Math.min(1800, f0 * 2.2 + 320),
          q: 2.8,
          gainPeak: 0.032 * vel,
          attackSec: 0.002,
        });
      },
      { dryGain: 0.68, wetSend: 0.38, refDistance: 2.8, maxDistance: 24 }
    );
  }
}
