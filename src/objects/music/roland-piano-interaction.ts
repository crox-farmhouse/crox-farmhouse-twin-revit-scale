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

export interface PianoNoteEvent {
  readonly timeSec: number;
  readonly durationSec: number;
  readonly freqHz: number;
  readonly velocity: number;
  /** 0..35 black-key index for physical key depression animation. */
  readonly blackKeyIndex: number;
  /** -1 (bass left) .. +1 (treble right) for camera/hand expression. */
  readonly panRegister: number;
}

export interface PianoTuneDefinition {
  readonly id: string;
  readonly title: string;
  readonly artist: 'Taylor Swift' | 'KATSEYE' | 'Coldplay';
  readonly notes: readonly PianoNoteEvent[];
  readonly repedalTimesSec: readonly number[];
}

const SEMITONE_OFFSETS: Readonly<Record<string, number>> = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
};

/**
 * Converts a scientific pitch name (e.g. `'Eb5'`, `'F#4'`, `'C3'`) into exact equal-tempered
 * frequency (`Hz`), physical keyboard index (`0..35`), and stereo pan register (`-1..+1`).
 */
function parsePitch(pitch: string): {
  readonly freqHz: number;
  readonly blackKeyIndex: number;
  readonly panRegister: number;
} {
  const match = /^([A-G](?:#|b)?)(-?\d)$/.exec(pitch.trim());
  if (!match) {
    return { freqHz: 440, blackKeyIndex: 18, panRegister: 0 };
  }
  const noteName = match[1]!;
  const octave = Number(match[2]!);
  const semitone = SEMITONE_OFFSETS[noteName] ?? 0;
  const midi = (octave + 1) * 12 + semitone; // C4 = 60, A4 = 69
  const freqHz = 440 * Math.pow(2, (midi - 69) / 12);
  const norm = Math.max(0, Math.min(1, (midi - 36) / (84 - 36))); // C2 (36) .. C6 (84)
  const blackKeyIndex = Math.max(0, Math.min(35, Math.round(norm * 35)));
  const panRegister = Number(((norm - 0.5) * 1.65).toFixed(3));
  return { freqHz, blackKeyIndex, panRegister };
}

type BeatNoteSpec = readonly [
  beat: number,
  durationBeats: number,
  pitches: string | readonly string[],
  velocity: number,
];

/**
 * Compiles a sheet-music beat grid (`[beat, durationBeats, pitchOrChord, velocity]`) at `bpm`
 * into time-sorted `PianoNoteEvent`s between `startSec` and `8.48s`.
 */
function compileBeatScore(
  bpm: number,
  startSec: number,
  specs: readonly BeatNoteSpec[]
): readonly PianoNoteEvent[] {
  const secPerBeat = 60 / bpm;
  const events: PianoNoteEvent[] = [];
  for (const [beat, durBeats, pitches, velocity] of specs) {
    const timeSec = Number((startSec + beat * secPerBeat).toFixed(4));
    const durationSec = Number(Math.max(0.14, durBeats * secPerBeat).toFixed(4));
    const pitchList = typeof pitches === 'string' ? [pitches] : pitches;
    for (let i = 0; i < pitchList.length; i++) {
      const { freqHz, blackKeyIndex, panRegister } = parsePitch(pitchList[i]!);
      events.push({
        timeSec: Number((timeSec + i * 0.006).toFixed(4)),
        durationSec,
        freqHz: Number(freqHz.toFixed(2)),
        velocity,
        blackKeyIndex,
        panRegister,
      });
    }
  }
  events.sort((a, b) => a.timeSec - b.timeSec);
  return events;
}

/**
 * Curated pop piano repertoire with exact sheet-music melodies, chord voicings, and rhythmic
 * beat grids from **Coldplay**, **Taylor Swift**, and **KATSEYE**.
 */
export const PIANO_REPERTOIRE: readonly PianoTuneDefinition[] = [
  // 1. Coldplay — "Clocks" (131 BPM, E-flat Mixolydian: Eb -> Bbm -> Bbm -> Fm, 3+3+2 eighth-note ostinato)
  {
    id: 'coldplay-clocks',
    title: 'Clocks',
    artist: 'Coldplay',
    repedalTimesSec: [2.98, 4.81, 6.64],
    notes: compileBeatScore(131, 1.15, [
      // Bar 1: Eb major (Eb5 - Bb4 - G4 x2 + Eb5 - Bb4) over Eb2 + Eb3 bass
      [0.0, 3.8, ['Eb2', 'Eb3'], 0.72],
      [0.0, 0.48, 'Eb5', 0.84],
      [0.5, 0.48, 'Bb4', 0.74],
      [1.0, 0.48, 'G4', 0.70],
      [1.5, 0.48, 'Eb5', 0.82],
      [2.0, 0.48, 'Bb4', 0.74],
      [2.5, 0.48, 'G4', 0.70],
      [3.0, 0.48, 'Eb5', 0.80],
      [3.5, 0.48, 'Bb4', 0.72],

      // Bar 2: Bb minor (Db5 - Bb4 - F4 x2 + Db5 - Bb4) over Bb2 + F3 bass
      [4.0, 3.8, ['Bb2', 'F3'], 0.72],
      [4.0, 0.48, 'Db5', 0.84],
      [4.5, 0.48, 'Bb4', 0.74],
      [5.0, 0.48, 'F4', 0.70],
      [5.5, 0.48, 'Db5', 0.82],
      [6.0, 0.48, 'Bb4', 0.74],
      [6.5, 0.48, 'F4', 0.70],
      [7.0, 0.48, 'Db5', 0.80],
      [7.5, 0.48, 'Bb4', 0.72],

      // Bar 3: Bb minor second measure
      [8.0, 3.8, ['Bb2', 'F3'], 0.72],
      [8.0, 0.48, 'Db5', 0.84],
      [8.5, 0.48, 'Bb4', 0.74],
      [9.0, 0.48, 'F4', 0.70],
      [9.5, 0.48, 'Db5', 0.82],
      [10.0, 0.48, 'Bb4', 0.74],
      [10.5, 0.48, 'F4', 0.70],
      [11.0, 0.48, 'Db5', 0.80],
      [11.5, 0.48, 'Bb4', 0.72],

      // Bar 4: F minor (C5 - Ab4 - F4 x2 + C5 - Ab4) over F2 + C3 bass
      [12.0, 3.8, ['F2', 'C3'], 0.74],
      [12.0, 0.48, 'C5', 0.84],
      [12.5, 0.48, 'Ab4', 0.76],
      [13.0, 0.48, 'F4', 0.72],
      [13.5, 0.48, 'C5', 0.82],
      [14.0, 0.48, 'Ab4', 0.76],
      [14.5, 0.48, 'F4', 0.72],
      [15.0, 0.48, 'C5', 0.84],
      [15.5, 1.10, ['F4', 'Ab4', 'Eb5'], 0.82],
    ]),
  },

  // 2. Coldplay — "Viva La Vida" (134 BPM, Ab Major: Db -> Eb -> Ab -> Fm, iconic string/choir hook)
  {
    id: 'coldplay-viva-la-vida',
    title: 'Viva La Vida',
    artist: 'Coldplay',
    repedalTimesSec: [2.94, 4.73, 6.52],
    notes: compileBeatScore(134, 1.15, [
      // Bar 1 (Db major): Pulsing string stabs + choir hook (Ab5 - Ab5 - Ab5 -> G5)
      [0.0, 0.85, ['Db3', 'Ab3', 'F4'], 0.74],
      [0.0, 0.90, 'Ab5', 0.84],
      [1.0, 0.45, ['Db3', 'Ab3', 'F4'], 0.70],
      [1.0, 0.90, 'Ab5', 0.82],
      [1.5, 0.90, ['Db3', 'Ab3', 'F4'], 0.76],
      [2.0, 0.90, 'Ab5', 0.84],
      [2.5, 0.85, ['Db3', 'Ab3', 'F4'], 0.72],
      [3.5, 0.48, ['Db3', 'Ab3', 'F4'], 0.72],
      [3.5, 0.50, 'G5', 0.80],

      // Bar 2 (Eb major): Pulsing stabs + choir hook (G5 - G5 - G5 -> Eb5)
      [4.0, 0.85, ['Eb3', 'Bb3', 'G4'], 0.76],
      [4.0, 0.90, 'G5', 0.84],
      [5.0, 0.45, ['Eb3', 'Bb3', 'G4'], 0.70],
      [5.0, 0.90, 'G5', 0.82],
      [5.5, 0.90, ['Eb3', 'Bb3', 'G4'], 0.76],
      [6.0, 0.90, 'G5', 0.84],
      [6.5, 0.85, ['Eb3', 'Bb3', 'G4'], 0.72],
      [7.5, 0.48, ['Eb3', 'Bb3', 'G4'], 0.72],
      [7.5, 0.50, 'Eb5', 0.80],

      // Bar 3 (Ab major): Pulsing stabs + choir hook (C6 - C6 - C6 -> Bb5)
      [8.0, 0.85, ['Ab2', 'Eb3', 'C4'], 0.76],
      [8.0, 0.90, 'C6', 0.86],
      [9.0, 0.45, ['Ab2', 'Eb3', 'C4'], 0.70],
      [9.0, 0.90, 'C6', 0.84],
      [9.5, 0.90, ['Ab2', 'Eb3', 'C4'], 0.76],
      [10.0, 0.90, 'C6', 0.86],
      [10.5, 0.85, ['Ab2', 'Eb3', 'C4'], 0.72],
      [11.5, 0.48, ['Ab2', 'Eb3', 'C4'], 0.72],
      [11.5, 0.50, 'Bb5', 0.82],

      // Bar 4 (F minor): Pulsing stabs + resolution (Ab5 - Ab5 - G5 - F5)
      [12.0, 0.85, ['F2', 'C3', 'Ab3'], 0.78],
      [12.0, 0.90, 'Ab5', 0.86],
      [13.0, 0.45, ['F2', 'C3', 'Ab3'], 0.72],
      [13.0, 0.90, 'Ab5', 0.84],
      [13.5, 0.90, ['F2', 'C3', 'Ab3'], 0.76],
      [14.0, 0.85, 'G5', 0.82],
      [15.0, 1.25, ['F2', 'C3', 'Ab3', 'C5', 'F5'], 0.86],
    ]),
  },

  // 3. Coldplay — "The Scientist" (130 BPM, F Major: Dm7 -> Bb -> F -> Fsus2 pulsing chords + melody)
  {
    id: 'coldplay-the-scientist',
    title: 'The Scientist',
    artist: 'Coldplay',
    repedalTimesSec: [3.00, 4.84, 6.69],
    notes: compileBeatScore(130, 1.15, [
      // Bar 1 (Dm7): Steady quarter-note piano pulse + "Come up to meet you..." (F5 - G5 - F5 - C5 - A4)
      [0.0, 3.8, 'D3', 0.74],
      [0.0, 0.85, ['A3', 'C4', 'F4'], 0.66],
      [1.0, 0.85, ['A3', 'C4'], 0.62],
      [1.0, 0.48, 'F5', 0.82],
      [1.5, 0.48, 'G5', 0.84],
      [2.0, 0.85, ['A3', 'C4'], 0.62],
      [2.0, 0.90, 'F5', 0.84],
      [3.0, 0.85, ['A3', 'C4'], 0.62],
      [3.0, 0.95, 'C5', 0.80],

      // Bar 2 (Bb): "...tell you I'm sorry" (A4 | F5 - G5 - F5 - C5 - A4)
      [4.0, 3.8, 'Bb2', 0.74],
      [4.0, 0.85, ['Bb3', 'D4'], 0.64],
      [4.0, 0.95, 'A4', 0.80],
      [5.0, 0.85, ['Bb3', 'D4'], 0.62],
      [5.0, 0.48, 'F5', 0.82],
      [5.5, 0.48, 'G5', 0.84],
      [6.0, 0.85, ['Bb3', 'D4'], 0.62],
      [6.0, 0.90, 'F5', 0.84],
      [7.0, 0.85, ['Bb3', 'D4'], 0.62],
      [7.0, 0.50, 'C5', 0.80],
      [7.5, 0.50, 'A4', 0.78],

      // Bar 3 (F): "You don't know how lovely you are" (F5 - G5 - F5 - A5 - A5 - G5 - F5)
      [8.0, 3.8, 'F2', 0.76],
      [8.0, 0.85, ['A3', 'C4', 'F4'], 0.66],
      [9.0, 0.85, ['A3', 'C4'], 0.62],
      [9.0, 0.48, 'F5', 0.82],
      [9.5, 0.48, 'G5', 0.84],
      [10.0, 0.85, ['A3', 'C4'], 0.62],
      [10.0, 0.48, 'F5', 0.82],
      [10.5, 0.48, 'A5', 0.86],
      [11.0, 0.85, ['A3', 'C4'], 0.62],
      [11.0, 0.48, 'A5', 0.84],
      [11.5, 0.48, 'G5', 0.80],

      // Bar 4 (Fsus2 -> C/E turnaround): "F5..." + Chris Martin's signature C4-F4-G4 -> C4-E4-G4 riff
      [12.0, 3.8, 'F2', 0.74],
      [12.0, 0.90, ['C4', 'F4', 'G4'], 0.72],
      [12.0, 1.40, 'F5', 0.84],
      [13.0, 0.90, ['C4', 'F4', 'G4'], 0.70],
      [14.0, 0.90, ['C4', 'F4', 'G4'], 0.74],
      [15.0, 1.20, ['C4', 'E4', 'G4', 'C5'], 0.80],
    ]),
  },

  // 4. Taylor Swift — "Love Story" (126 BPM, D Major: D -> G -> Bm -> A, exact "Romeo take me" chorus)
  {
    id: 'taylor-swift-love-story',
    title: 'Love Story',
    artist: 'Taylor Swift',
    repedalTimesSec: [3.05, 4.96, 6.86],
    notes: compileBeatScore(126, 1.15, [
      // Bar 1 (D major): "Ro-me-o, take me some-where we can be a-lone" (D5-D5-G5-F#5-D5-D5-E5-E5-D5-F#5-D5-E5)
      [0.0, 1.9, ['D3', 'A3', 'F#4'], 0.72],
      [0.0, 0.36, 'D5', 0.80],
      [0.4, 0.36, 'D5', 0.80],
      [0.8, 0.55, 'G5', 0.88],
      [1.4, 0.40, 'F#5', 0.84],
      [1.8, 0.36, 'D5', 0.80],
      [2.0, 1.9, ['D3', 'A3', 'F#4'], 0.68],
      [2.2, 0.36, 'D5', 0.78],
      [2.55, 0.36, 'E5', 0.82],
      [2.9, 0.36, 'E5', 0.82],
      [3.25, 0.36, 'D5', 0.78],
      [3.6, 0.40, 'F#5', 0.84],

      // Bar 2 (G major): "...a-lone, I'll be wait-ing, all there's left to do is run" (D5-E5 | D5-E5-F#5-E5-D5-E5-E5-D5-F#5)
      [4.0, 1.9, ['G2', 'D3', 'B3'], 0.74],
      [4.0, 0.36, 'D5', 0.80],
      [4.35, 0.60, 'E5', 0.82],
      [5.1, 0.36, 'D5', 0.78],
      [5.45, 0.36, 'E5', 0.82],
      [5.8, 0.45, 'F#5', 0.86],
      [6.0, 1.9, ['G2', 'D3', 'B3'], 0.70],
      [6.3, 0.36, 'E5', 0.82],
      [6.65, 0.36, 'D5', 0.78],
      [7.0, 0.36, 'E5', 0.82],
      [7.35, 0.36, 'E5', 0.82],
      [7.7, 0.36, 'D5', 0.78],

      // Bar 3 (B minor): "You'll be the prince and I'll be the prin-cess" (F#5-D5-E5 | D5-E5-D5-F#5-E5-D5-E5-D5-F#5-E5)
      [8.0, 1.9, ['B2', 'F#3', 'D4'], 0.74],
      [8.0, 0.36, 'F#5', 0.86],
      [8.35, 0.36, 'D5', 0.80],
      [8.7, 0.55, 'E5', 0.82],
      [9.35, 0.36, 'D5', 0.78],
      [9.7, 0.36, 'E5', 0.82],
      [10.0, 1.9, ['B2', 'F#3', 'D4'], 0.70],
      [10.05, 0.36, 'D5', 0.78],
      [10.4, 0.42, 'F#5', 0.86],
      [10.85, 0.40, 'E5', 0.82],
      [11.3, 0.36, 'D5', 0.78],
      [11.65, 0.36, 'E5', 0.82],

      // Bar 4 (A major -> D major): "It's a love sto-ry, ba-by, just say yes" (D5-D5-E5-F#5-E5-F#5-F#5-E5-D5)
      [12.0, 1.9, ['A2', 'E3', 'C#4'], 0.76],
      [12.0, 0.36, 'D5', 0.80],
      [12.35, 0.36, 'D5', 0.80],
      [12.7, 0.38, 'E5', 0.82],
      [13.1, 0.45, 'F#5', 0.86],
      [13.6, 0.40, 'E5', 0.82],
      [14.0, 0.45, 'F#5', 0.86],
      [14.5, 0.45, 'E5', 0.82],
      [15.0, 1.25, ['D3', 'A3', 'F#4', 'D5'], 0.88],
    ]),
  },

  // 5. Taylor Swift — "Blank Space" (128 BPM, F Major: F -> Dm -> Bb -> C, exact chorus melody)
  {
    id: 'taylor-swift-blank-space',
    title: 'Blank Space',
    artist: 'Taylor Swift',
    repedalTimesSec: [3.02, 4.90, 6.77],
    notes: compileBeatScore(128, 1.15, [
      // Bar 1 (F major): "So it's gon-na be for-ev-er" (F5-F5-F5-F5-F5-F5-G5-A5)
      [0.0, 1.9, ['F2', 'C3', 'A3'], 0.74],
      [0.0, 0.38, 'F5', 0.82],
      [0.5, 0.38, 'F5', 0.80],
      [1.0, 0.38, 'F5', 0.82],
      [1.5, 0.38, 'F5', 0.80],
      [2.0, 1.9, ['F2', 'C3', 'A3'], 0.70],
      [2.0, 0.38, 'F5', 0.84],
      [2.5, 0.38, 'F5', 0.82],
      [3.0, 0.45, 'G5', 0.86],
      [3.5, 0.50, 'A5', 0.88],

      // Bar 2 (D minor): "Or it's gon-na go down in flames" (F5-F5-F5-F5-F5-A5-E5-E5-F5)
      [4.0, 1.9, ['D3', 'A3', 'F4'], 0.74],
      [4.0, 0.38, 'F5', 0.82],
      [4.5, 0.38, 'F5', 0.80],
      [5.0, 0.38, 'F5', 0.82],
      [5.5, 0.38, 'F5', 0.80],
      [6.0, 1.9, ['D3', 'A3', 'F4'], 0.70],
      [6.0, 0.38, 'F5', 0.84],
      [6.45, 0.45, 'A5', 0.88],
      [6.95, 0.38, 'E5', 0.82],
      [7.35, 0.38, 'E5', 0.80],
      [7.70, 0.45, 'F5', 0.86],

      // Bar 3 (Bb major): "You can tell me when it's o-ver" (F5-F5-F5-F5-F5-F5-G5-A5)
      [8.0, 1.9, ['Bb2', 'F3', 'D4'], 0.76],
      [8.0, 0.38, 'F5', 0.82],
      [8.5, 0.38, 'F5', 0.80],
      [9.0, 0.38, 'F5', 0.82],
      [9.5, 0.38, 'F5', 0.80],
      [10.0, 1.9, ['Bb2', 'F3', 'D4'], 0.72],
      [10.0, 0.38, 'F5', 0.84],
      [10.5, 0.38, 'F5', 0.82],
      [11.0, 0.45, 'G5', 0.86],
      [11.5, 0.50, 'A5', 0.88],

      // Bar 4 (C major -> F major): "If the high was worth the pain" (F5-F5-F5-F5-A5-E5-E5-F5)
      [12.0, 1.9, ['C3', 'G3', 'E4'], 0.76],
      [12.0, 0.38, 'F5', 0.82],
      [12.5, 0.38, 'F5', 0.80],
      [13.0, 0.38, 'F5', 0.84],
      [13.5, 0.38, 'F5', 0.82],
      [14.0, 0.45, 'A5', 0.88],
      [14.45, 0.38, 'E5', 0.82],
      [14.8, 0.38, 'E5', 0.80],
      [15.15, 1.15, ['F3', 'C4', 'A4', 'F5'], 0.88],
    ]),
  },

  // 6. Taylor Swift — "Cruel Summer" (132 BPM, A Major: A -> F#m -> D -> E, iconic chorus hook)
  {
    id: 'taylor-swift-cruel-summer',
    title: 'Cruel Summer',
    artist: 'Taylor Swift',
    repedalTimesSec: [2.97, 4.79, 6.60],
    notes: compileBeatScore(132, 1.15, [
      // Bar 1 (A major): "And it's cool, that's what I tell 'em" (E4-F#4-A4-A4-A4-B4-A4-F#4-E4)
      [0.0, 1.9, ['A2', 'E3'], 0.74],
      [0.0, 0.35, 'E4', 0.76],
      [0.35, 0.35, 'F#4', 0.80],
      [0.75, 0.45, 'A4', 0.84],
      [1.25, 0.45, 'A4', 0.82],
      [1.75, 0.45, 'A4', 0.84],
      [2.0, 1.9, ['A2', 'E3'], 0.70],
      [2.25, 0.45, 'B4', 0.86],
      [2.75, 0.45, 'A4', 0.82],
      [3.25, 0.38, 'F#4', 0.78],
      [3.65, 0.38, 'E4', 0.74],

      // Bar 2 (F# minor): "No rules in break-a-ble hea-ven" (E4-F#4-A4-A4-A4-B4-A4-F#4)
      [4.0, 1.9, ['F#2', 'C#3', 'F#3'], 0.74],
      [4.0, 0.35, 'E4', 0.76],
      [4.35, 0.35, 'F#4', 0.80],
      [4.75, 0.45, 'A4', 0.84],
      [5.25, 0.45, 'A4', 0.82],
      [5.75, 0.45, 'A4', 0.84],
      [6.0, 1.9, ['F#2', 'C#3'], 0.70],
      [6.25, 0.45, 'B4', 0.86],
      [6.75, 0.45, 'A4', 0.82],
      [7.25, 0.65, 'F#4', 0.80],

      // Bar 3 (D major): "But ooh, it's a cruel sum-mer" (A4 - B4 - C#5 - B4 - A4 - F#4 - E4 - F#4 - E4)
      [8.0, 1.9, ['D3', 'A3'], 0.76],
      [8.0, 0.50, 'A4', 0.84],
      [8.5, 0.50, 'B4', 0.86],
      [9.0, 0.65, 'C#5', 0.90],
      [9.75, 0.45, 'B4', 0.84],
      [10.0, 1.9, ['D3', 'A3'], 0.72],
      [10.25, 0.45, 'A4', 0.82],
      [10.75, 0.45, 'F#4', 0.80],
      [11.25, 0.38, 'E4', 0.76],
      [11.65, 0.38, 'F#4', 0.80],

      // Bar 4 (E major -> A major): "With you... it's a cruel sum-mer" (E4 | A4 - B4 - C#5 - B4 - A4)
      [12.0, 1.9, ['E2', 'B2', 'G#3'], 0.76],
      [12.0, 0.70, 'E4', 0.78],
      [12.75, 0.45, 'A4', 0.84],
      [13.25, 0.45, 'B4', 0.86],
      [13.75, 0.50, 'C#5', 0.90],
      [14.25, 0.45, 'B4', 0.84],
      [14.75, 1.35, ['A2', 'E3', 'C#4', 'A4'], 0.88],
    ]),
  },

  // 6. KATSEYE — "Touch" (132 BPM, Eb Major / C Minor: Cm7 -> Fm7 -> Bb7 -> Ebmaj7, exact chorus melody)
  {
    id: 'katseye-touch',
    title: 'Touch',
    artist: 'KATSEYE',
    repedalTimesSec: [2.97, 4.79, 6.60],
    notes: compileBeatScore(132, 1.15, [
      // Bar 1 (Cm7): "Touch, touch, touch, touch, touch" (Eb5 x5) + "Thought about you way too" (Eb5-F5-G5-F5-Eb5-F5)
      [0.0, 1.9, ['C3', 'G3', 'Bb3'], 0.72],
      [0.0, 0.36, 'Eb5', 0.84],
      [0.45, 0.36, 'Eb5', 0.82],
      [0.90, 0.36, 'Eb5', 0.84],
      [1.35, 0.36, 'Eb5', 0.82],
      [1.80, 0.45, 'Eb5', 0.86],
      [2.0, 1.9, ['C3', 'G3', 'Bb3'], 0.68],
      [2.35, 0.28, 'Eb5', 0.78],
      [2.62, 0.28, 'F5', 0.82],
      [2.90, 0.28, 'G5', 0.86],
      [3.18, 0.28, 'F5', 0.82],
      [3.45, 0.28, 'Eb5', 0.78],
      [3.72, 0.28, 'F5', 0.82],

      // Bar 2 (Fm7): "Much, much, much, much, much" (F5 x5) + "Over-overthinking" (Eb5-F5-G5-F5-Eb5-F5)
      [4.0, 1.9, ['F2', 'C3', 'Ab3'], 0.74],
      [4.0, 0.36, 'F5', 0.86],
      [4.45, 0.36, 'F5', 0.84],
      [4.90, 0.36, 'F5', 0.86],
      [5.35, 0.36, 'F5', 0.84],
      [5.80, 0.45, 'F5', 0.88],
      [6.0, 1.9, ['F2', 'C3', 'Ab3'], 0.70],
      [6.35, 0.28, 'Eb5', 0.78],
      [6.62, 0.28, 'F5', 0.82],
      [6.90, 0.28, 'G5', 0.86],
      [7.18, 0.28, 'F5', 0.82],
      [7.45, 0.28, 'Eb5', 0.78],
      [7.72, 0.28, 'F5', 0.82],

      // Bar 3 (Bb7): "Us, us, us, us, us" (Eb5 x5) + "'Cause you been so out of" (Eb5-F5-G5-F5-Eb5-F5)
      [8.0, 1.9, ['Bb2', 'F3', 'Ab3'], 0.74],
      [8.0, 0.36, 'Eb5', 0.84],
      [8.45, 0.36, 'Eb5', 0.82],
      [8.90, 0.36, 'Eb5', 0.84],
      [9.35, 0.36, 'Eb5', 0.82],
      [9.80, 0.45, 'Eb5', 0.86],
      [10.0, 1.9, ['Bb2', 'F3', 'Ab3'], 0.70],
      [10.35, 0.28, 'Eb5', 0.78],
      [10.62, 0.28, 'F5', 0.82],
      [10.90, 0.28, 'G5', 0.86],
      [11.18, 0.28, 'F5', 0.82],
      [11.45, 0.28, 'Eb5', 0.78],
      [11.72, 0.28, 'F5', 0.82],

      // Bar 4 (Ebmaj7): "Touch, touch, touch, touch, touch!"
      [12.0, 1.9, ['Eb2', 'Bb2', 'G3'], 0.76],
      [12.0, 0.40, 'Eb5', 0.86],
      [12.50, 0.40, 'Eb5', 0.84],
      [13.00, 0.40, 'Eb5', 0.86],
      [13.50, 0.45, 'F5', 0.84],
      [14.00, 0.50, 'G5', 0.88],
      [14.60, 1.40, ['Eb3', 'Bb3', 'G4', 'Eb5'], 0.86],
    ]),
  },

  // 7. KATSEYE — "Gabriela" (128 BPM, A Minor: Am -> Dm -> G -> E7 -> Am, exact "Hands off Gabriela" chorus)
  {
    id: 'katseye-gabriela',
    title: 'Gabriela',
    artist: 'KATSEYE',
    repedalTimesSec: [3.02, 4.90, 6.77],
    notes: compileBeatScore(128, 1.15, [
      // Bar 1 (Am): "Hands off, Ga-bri-e-la, Ga-bri-e-la" (E5 - E5 - D5 - C5 - C5 - A4 - G4)
      [0.0, 1.4, ['A2', 'E3'], 0.76],
      [0.0, 0.45, 'E5', 0.86],
      [0.5, 0.45, 'E5', 0.84],
      [1.0, 0.45, 'D5', 0.82],
      [1.5, 1.4, ['A3', 'C4'], 0.68],
      [1.5, 0.45, 'C5', 0.84],
      [2.0, 0.45, 'C5', 0.82],
      [2.5, 0.45, 'A4', 0.80],
      [3.0, 0.85, 'G4', 0.78],

      // Bar 2 (Dm): "Hands off, Ga-bri-e-la-la-la" (E5 - E5 - D5 - C5 - D5 - E5 - D5)
      [4.0, 1.4, ['D3', 'A3'], 0.76],
      [4.0, 0.45, 'E5', 0.86],
      [4.5, 0.45, 'E5', 0.84],
      [5.0, 0.45, 'D5', 0.82],
      [5.5, 1.4, ['A3', 'F4'], 0.68],
      [5.5, 0.45, 'C5', 0.82],
      [6.0, 0.45, 'D5', 0.84],
      [6.5, 0.45, 'E5', 0.88],
      [7.0, 0.85, 'D5', 0.82],

      // Bar 3 (G -> C): "Back off of my fel-la, Ga-bri-e-la" (E5 - E5 - D5 - C5 - C5 - A4 - G4)
      [8.0, 1.4, ['G2', 'D3'], 0.76],
      [8.0, 0.45, 'E5', 0.86],
      [8.5, 0.45, 'E5', 0.84],
      [9.0, 0.45, 'D5', 0.82],
      [9.5, 1.4, ['C3', 'G3'], 0.72],
      [9.5, 0.45, 'C5', 0.84],
      [10.0, 0.45, 'C5', 0.82],
      [10.5, 0.45, 'A4', 0.80],
      [11.0, 0.85, 'G4', 0.78],

      // Bar 4 (E7 -> Am): "Back off, Ga-bri-e-la-la-la" (E5 - E5 - D5 - C5 - B4 - C5 - A4)
      [12.0, 1.4, ['E2', 'B2', 'G#3'], 0.78],
      [12.0, 0.45, 'E5', 0.86],
      [12.5, 0.45, 'E5', 0.84],
      [13.0, 0.45, 'D5', 0.82],
      [13.5, 0.45, 'C5', 0.82],
      [14.0, 0.45, 'B4', 0.84],
      [14.5, 0.45, 'C5', 0.84],
      [15.0, 1.25, ['A2', 'E3', 'A3', 'A4'], 0.88],
    ]),
  },
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
 * Choreographs a `9.6s` pop piano performance randomly selected from **Taylor Swift**,
 * **KATSEYE**, and **Coldplay**:
 * 1. (`0.00s -> 1.10s`) Pull out the Roland BNC-05 artist bench, raise the polished-ebony
 *    grand lid to concert projection position, wake the backlit Smart Touch Panel, and sit
 *    at the 88-key PHA-50 hybrid keyboard.
 * 2. (`1.10s -> 8.50s`) Perform a polyphonic pop arrangement (*Clocks*, *Viva La Vida*,
 *    *The Scientist*, *Love Story*, *Cruel Summer*, *Touch*, or *Gabriela*) with sample-accurate
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
  #currentTuneIdx = -1;

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

  public getCurrentTune(): PianoTuneDefinition {
    const idx = this.#currentTuneIdx >= 0 ? this.#currentTuneIdx : 0;
    return PIANO_REPERTOIRE[idx] ?? PIANO_REPERTOIRE[0]!;
  }

  public trigger(tuneId?: string): boolean {
    if (this.#phase === 'idle') {
      if (tuneId) {
        const matchedIdx = PIANO_REPERTOIRE.findIndex((t) => t.id === tuneId);
        this.#currentTuneIdx = matchedIdx >= 0 ? matchedIdx : 0;
      } else if (PIANO_REPERTOIRE.length > 1) {
        // Pick a random pop tune without repeating the immediately previous song
        const poolSize = PIANO_REPERTOIRE.length;
        if (this.#currentTuneIdx < 0) {
          this.#currentTuneIdx = Math.floor(Math.random() * poolSize);
        } else {
          const offset = 1 + Math.floor(Math.random() * (poolSize - 1));
          this.#currentTuneIdx = (this.#currentTuneIdx + offset) % poolSize;
        }
      } else {
        this.#currentTuneIdx = 0;
      }
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
    if (this.#phase === 'playing') {
      const tune = this.getCurrentTune();
      return `Stop Playing Piano (${tune.artist} – ${tune.title})`;
    }
    return 'Play Roland GP-6-PE Baby Grand Piano';
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
    const activeTune = this.getCurrentTune();
    const score = activeTune.notes;

    // 1. Sample-accurate lookahead scheduling (80ms lookahead onto Web Audio clock)
    const lookaheadHorizon = this.#elapsedSec + 0.08;
    while (
      this.#nextNoteIdx < score.length &&
      score[this.#nextNoteIdx]!.timeSec <= lookaheadHorizon
    ) {
      const note = score[this.#nextNoteIdx]!;
      this.#nextNoteIdx += 1;
      if (note.timeSec >= prevT - 0.05) {
        const audioDelaySec = Math.max(0, note.timeSec - this.#elapsedSec);
        this.#playPianoNoteSound(note, audioDelaySec);
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
      for (let nIdx = 0; nIdx < score.length; nIdx++) {
        const ev = score[nIdx]!;
        if (ev.blackKeyIndex !== i) continue;
        const dtNote = t - ev.timeSec;
        if (dtNote >= 0 && dtNote <= ev.durationSec) {
          const attack = clamp01(dtNote / 0.035);
          const release = clamp01((ev.durationSec - dtNote) / 0.12);
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
    for (let nIdx = 0; nIdx < score.length; nIdx++) {
      const ev = score[nIdx]!;
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
      // Sustain pedal depressed during each harmonic measure, lifting briefly at chord changes
      let damperDown = 0;
      if (t >= 1.12 && t <= 8.48) {
        let repedalDip = 0;
        for (const rt of activeTune.repedalTimesSec) {
          repedalDip += Math.exp(-Math.pow((t - rt) / 0.12, 2));
        }
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

  #playPianoNoteSound(note: PianoNoteEvent, audioDelaySec = 0): void {
    const [wx, wz] = pianoLocalToWorldXZ(note.panRegister * 0.42, 0.05);
    const worldPos = { x: wx, y: this.#hallFloorY + 0.88, z: wz };

    soundEngine.playSpatial(
      worldPos,
      (tk) => {
        const t0 = tk.now + Math.max(0, audioDelaySec);
        const vel = note.velocity;
        const f0 = note.freqHz;
        // Damper-pedaled soundboard sustain so melody notes sing smoothly instead of clipping
        const acousticDur = Math.min(2.6, Math.max(note.durationSec * 2.4, note.durationSec + 0.85));
        const isBass = f0 < 220;

        // 1. Pure Concert Grand Fundamental (sine, locked pitch with zero detune warble)
        tk.tone({
          startTime: t0,
          duration: acousticDur,
          type: 'sine',
          freqStart: f0,
          gainPeak: (isBass ? 0.13 : 0.155) * vel,
          attackSec: 0.005,
        });

        // 2. 2nd Harmonic (triangle) — stronger on bass strings for warm speaker translation
        tk.tone({
          startTime: t0,
          duration: acousticDur * 0.78,
          type: 'triangle',
          freqStart: f0 * 2.0,
          gainPeak: (isBass ? 0.092 : 0.064) * vel,
          attackSec: 0.004,
        });

        // 3. 3rd Harmonic bell overtone on initial hammer strike
        tk.tone({
          startTime: t0,
          duration: Math.min(0.75, acousticDur * 0.45),
          type: 'sine',
          freqStart: f0 * 3.0,
          gainPeak: (isBass ? 0.046 : 0.026) * vel,
          attackSec: 0.003,
        });

        // 4. 4th Harmonic warmth on low bass roots
        if (isBass) {
          tk.tone({
            startTime: t0,
            duration: Math.min(0.6, acousticDur * 0.38),
            type: 'sine',
            freqStart: f0 * 4.0,
            gainPeak: 0.028 * vel,
            attackSec: 0.003,
          });
        }

        // 5. Felt hammer & PHA-50 wooden key action transient
        tk.noiseBurst({
          startTime: t0,
          duration: 0.018,
          filterType: 'bandpass',
          freqStart: Math.min(3200, f0 * 4.0 + 600),
          freqEnd: Math.min(1600, f0 * 2.0 + 300),
          q: 3.0,
          gainPeak: 0.022 * vel,
          attackSec: 0.002,
        });
      },
      { dryGain: 0.68, wetSend: 0.38, refDistance: 2.8, maxDistance: 24 }
    );
  }
}
