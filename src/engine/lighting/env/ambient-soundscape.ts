import type { TimeOfDay } from '../../../core/types/scene.ts';
import { soundEngine } from '../../audio/sound-engine.ts';

/**
 * Procedural countryside ambient soundscape for the Crox Farmhouse estate (`src/engine/lighting/env/`):
 * - Continuous pink-noise Hertfordshire meadow breeze whose lowpass cutoff and gain respond to
 *   Time of Day (`day`, `dusk`, `night`), whether the camera is indoors vs outdoors, and whether
 *   the Kitchen 4-leaf concertina bifold doors are folded open to the patio.
 * - Daytime / Golden-Hour Dusk birdsong chirps (woodland warblers & blackbirds).
 * - Nighttime meadow cricket stridulation.
 */
export class AmbientSoundscape {
  private windSource: AudioBufferSourceNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;
  private boundCtx: AudioContext | null = null;
  private nextChirpTimerSec = 1.8;

  public update(dtSeconds: number, timeOfDay: TimeOfDay, isInterior: boolean, bifoldsOpen: boolean): void {
    const bus = soundEngine.getAmbientBus();
    if (!bus || !bus.pinkNoiseBuffer) {
      if (this.windGain && this.boundCtx) {
        this.windGain.gain.setTargetAtTime(0, this.boundCtx.currentTime, 0.1);
      }
      return;
    }

    const { ctx, ambientGain, pinkNoiseBuffer } = bus;
    const now = ctx.currentTime;

    if (!this.windSource || this.boundCtx !== ctx) {
      try {
        const src = ctx.createBufferSource();
        src.buffer = pinkNoiseBuffer;
        src.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 260;
        filter.Q.value = 0.7;

        const gain = ctx.createGain();
        gain.gain.value = 0.0;

        src.connect(filter);
        filter.connect(gain);
        gain.connect(ambientGain);
        src.start(now);

        this.windSource = src;
        this.windFilter = filter;
        this.windGain = gain;
        this.boundCtx = ctx;
      } catch {
        return;
      }
    }

    if (this.windFilter && this.windGain) {
      const outdoorFactor = isInterior ? (bifoldsOpen ? 0.55 : 0.22) : 1.0;
      const baseCut = timeOfDay === 'day' ? 380 : timeOfDay === 'dusk' ? 290 : 210;
      const lfo = Math.sin(now * 0.42) * 55 + Math.cos(now * 0.19) * 35;
      const targetFreq = Math.max(90, (baseCut + lfo) * (isInterior ? 0.62 : 1.0));
      const targetWindGain =
        (timeOfDay === 'day' ? 0.055 : timeOfDay === 'dusk' ? 0.042 : 0.032) * outdoorFactor;

      this.windFilter.frequency.setTargetAtTime(targetFreq, now, 0.25);
      this.windGain.gain.setTargetAtTime(targetWindGain, now, 0.35);
    }

    this.nextChirpTimerSec -= Math.max(0, Math.min(0.25, dtSeconds));
    if (this.nextChirpTimerSec <= 0) {
      const outdoorGain = isInterior ? (bifoldsOpen ? 0.38 : 0.1) : 0.85;
      if (timeOfDay === 'day' || timeOfDay === 'dusk') {
        this.playBirdChirp(ctx, ambientGain, outdoorGain * (timeOfDay === 'day' ? 1.0 : 0.65));
        this.nextChirpTimerSec =
          (timeOfDay === 'day' ? 2.2 : 3.8) + Math.random() * (timeOfDay === 'day' ? 3.5 : 5.2);
      } else {
        this.playNightCricket(ctx, ambientGain, outdoorGain * 0.7);
        this.nextChirpTimerSec = 1.4 + Math.random() * 2.8;
      }
    }
  }

  private playBirdChirp(ctx: AudioContext, ambientGain: GainNode, scale: number): void {
    if (scale <= 0.02) return;
    const now = ctx.currentTime;
    const notes = 2 + Math.floor(Math.random() * 3);
    const baseFreq = 2200 + Math.random() * 1400;

    let panNode: AudioNode = ambientGain;
    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime((Math.random() * 2 - 1) * 0.75, now);
      panner.connect(ambientGain);
      panNode = panner;
    }

    for (let i = 0; i < notes; i++) {
      const t0 = now + i * (0.085 + Math.random() * 0.04);
      const dur = 0.055 + Math.random() * 0.035;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const fStart = baseFreq * (1 + (Math.random() - 0.5) * 0.18);
      const fEnd = fStart * (1.12 + (Math.random() - 0.4) * 0.22);
      osc.frequency.setValueAtTime(fStart, t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(400, fEnd), t0 + dur);

      const peak = 0.014 * scale;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.linearRampToValueAtTime(peak, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

      osc.connect(gain);
      gain.connect(panNode);
      osc.start(t0);
      osc.stop(t0 + dur + 0.01);
    }
  }

  private playNightCricket(ctx: AudioContext, ambientGain: GainNode, scale: number): void {
    if (scale <= 0.02) return;
    const now = ctx.currentTime;
    const pulses = 3 + Math.floor(Math.random() * 2);
    const carrierFreq = 4150 + (Math.random() - 0.5) * 180;

    let panNode: AudioNode = ambientGain;
    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime((Math.random() * 2 - 1) * 0.8, now);
      panner.connect(ambientGain);
      panNode = panner;
    }

    for (let i = 0; i < pulses; i++) {
      const t0 = now + i * 0.042;
      const dur = 0.026;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(carrierFreq, t0);

      const peak = 0.009 * scale;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.linearRampToValueAtTime(peak, t0 + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

      osc.connect(gain);
      gain.connect(panNode);
      osc.start(t0);
      osc.stop(t0 + dur + 0.005);
    }
  }
}
