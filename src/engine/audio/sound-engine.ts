import type * as THREE from 'three';

export interface SoundEngineSettings {
  readonly muted: boolean;
  readonly masterVolume: number;
  readonly ambientEnabled: boolean;
  readonly sfxEnabled: boolean;
}

export interface SpatialSoundOptions {
  readonly dryGain?: number;
  readonly wetSend?: number;
  readonly refDistance?: number;
  readonly maxDistance?: number;
}

export interface NoiseBurstSpec {
  readonly startTime: number;
  readonly duration: number;
  readonly filterType: BiquadFilterType;
  readonly freqStart: number;
  readonly freqEnd?: number;
  readonly q?: number;
  readonly gainPeak: number;
  readonly attackSec?: number;
}

export interface ToneBurstSpec {
  readonly startTime: number;
  readonly duration: number;
  readonly type: OscillatorType;
  readonly freqStart: number;
  readonly freqEnd?: number;
  readonly gainPeak: number;
  readonly attackSec?: number;
}

/**
 * Synthesis toolkit passed to each asset's procedural sound recipe.
 */
export interface SoundSynthToolkit {
  readonly ctx: AudioContext;
  readonly dest: AudioNode;
  readonly now: number;
  noiseBurst(spec: NoiseBurstSpec): void;
  tone(spec: ToneBurstSpec): void;
}

const STORAGE_KEY = 'crox_sound_settings_v1';

/**
 * Core 3D Web Audio runtime & procedural synthesis toolkit.
 *
 * Domain-agnostic: owns `AudioContext` lifecycle, user volume/mute persistence,
 * 3D `AudioListener` tracking, stereo convolution room reverb, and low-level
 * synthesis building blocks (`noiseBurst`, `tone`, `playSpatial`, `playDirect`).
 * Individual 3D assets and subsystems encapsulate their own sound recipes alongside
 * their own modules.
 */
export class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;

  private whiteNoiseBuffer: AudioBuffer | null = null;
  private pinkNoiseBuffer: AudioBuffer | null = null;

  private muted = false;
  private masterVolume = 0.75;
  private ambientEnabled = true;
  private sfxEnabled = true;
  private isInterior = true;

  private unlockInstalled = false;
  private readonly listeners = new Set<() => void>();

  public constructor() {
    this.loadSettings();
    this.installGestureUnlock();
  }

  private loadSettings(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<SoundEngineSettings>;
      if (typeof parsed.muted === 'boolean') this.muted = parsed.muted;
      if (typeof parsed.masterVolume === 'number' && Number.isFinite(parsed.masterVolume)) {
        this.masterVolume = Math.max(0, Math.min(1, parsed.masterVolume));
      }
      if (typeof parsed.ambientEnabled === 'boolean') this.ambientEnabled = parsed.ambientEnabled;
      if (typeof parsed.sfxEnabled === 'boolean') this.sfxEnabled = parsed.sfxEnabled;
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }

  private saveSettings(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const payload: SoundEngineSettings = {
        muted: this.muted,
        masterVolume: this.masterVolume,
        ambientEnabled: this.ambientEnabled,
        sfxEnabled: this.sfxEnabled,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage errors
    }
  }

  private emitChanged(): void {
    for (const fn of this.listeners) {
      fn();
    }
  }

  public onChanged(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    if (this.muted === muted) return;
    this.muted = muted;
    this.saveSettings();
    this.syncBusGains();
    this.emitChanged();
  }

  public toggleMuted(): boolean {
    this.setMuted(!this.muted);
    if (!this.muted) {
      this.ensureContext();
    }
    return this.muted;
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public setMasterVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, Number.isFinite(volume) ? volume : 0.75));
    if (Math.abs(this.masterVolume - clamped) < 1e-4) return;
    this.masterVolume = clamped;
    this.saveSettings();
    this.syncBusGains();
    this.emitChanged();
  }

  public isAmbientEnabled(): boolean {
    return this.ambientEnabled;
  }

  public setAmbientEnabled(enabled: boolean): void {
    if (this.ambientEnabled === enabled) return;
    this.ambientEnabled = enabled;
    this.saveSettings();
    this.syncBusGains();
    this.emitChanged();
  }

  public isSfxEnabled(): boolean {
    return this.sfxEnabled;
  }

  public setSfxEnabled(enabled: boolean): void {
    if (this.sfxEnabled === enabled) return;
    this.sfxEnabled = enabled;
    this.saveSettings();
    this.syncBusGains();
    this.emitChanged();
  }

  private installGestureUnlock(): void {
    if (
      this.unlockInstalled ||
      typeof window === 'undefined' ||
      typeof window.addEventListener !== 'function'
    ) {
      return;
    }
    this.unlockInstalled = true;
    const onGesture = (): void => {
      if (this.muted) return;
      this.ensureContext();
    };
    window.addEventListener('pointerdown', onGesture, { passive: true });
    window.addEventListener('keydown', onGesture, { passive: true });
    window.addEventListener('touchstart', onGesture, { passive: true });
  }

  public ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      try {
        const ctx = new AudioCtx();
        this.ctx = ctx;

        const masterGain = ctx.createGain();
        masterGain.gain.value = this.muted ? 0 : this.masterVolume;
        masterGain.connect(ctx.destination);
        this.masterGain = masterGain;

        const sfxGain = ctx.createGain();
        sfxGain.gain.value = this.sfxEnabled ? 1.0 : 0.0;
        sfxGain.connect(masterGain);
        this.sfxGain = sfxGain;

        const ambientGain = ctx.createGain();
        ambientGain.gain.value = this.ambientEnabled ? 1.0 : 0.0;
        ambientGain.connect(masterGain);
        this.ambientGain = ambientGain;

        this.buildNoiseBuffers(ctx);
        this.buildRoomReverb(ctx, sfxGain);
      } catch {
        return null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {
        // Ignore autoplay restrictions before user gesture
      });
    }
    return this.ctx;
  }

  private buildNoiseBuffers(ctx: AudioContext): void {
    const sampleRate = ctx.sampleRate;
    const whiteLen = sampleRate * 2;
    const whiteBuf = ctx.createBuffer(1, whiteLen, sampleRate);
    const whiteData = whiteBuf.getChannelData(0);
    for (let i = 0; i < whiteLen; i++) {
      whiteData[i] = Math.random() * 2 - 1;
    }
    this.whiteNoiseBuffer = whiteBuf;

    // Paul Kellet pink noise filter for natural ambient wind & room air
    const pinkLen = sampleRate * 4;
    const pinkBuf = ctx.createBuffer(1, pinkLen, sampleRate);
    const pinkData = pinkBuf.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    for (let i = 0; i < pinkLen; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      pinkData[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.045;
      b6 = white * 0.115926;
    }
    this.pinkNoiseBuffer = pinkBuf;
  }

  private buildRoomReverb(ctx: AudioContext, sfxGain: GainNode): void {
    try {
      const sampleRate = ctx.sampleRate;
      const duration = 0.65;
      const length = Math.floor(sampleRate * duration);
      const ir = ctx.createBuffer(2, length, sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = ir.getChannelData(ch);
        for (let i = 0; i < length; i++) {
          const t = i / sampleRate;
          const early = t < 0.035 ? Math.sin(t * 950 * (ch + 1)) * 0.35 : 0;
          const tail = (Math.random() * 2 - 1) * Math.exp(-t * 8.5);
          data[i] = (early + tail) * 0.35;
        }
      }
      const convolver = ctx.createConvolver();
      convolver.buffer = ir;
      const revGain = ctx.createGain();
      revGain.gain.value = 0.18;
      convolver.connect(revGain);
      revGain.connect(sfxGain);
      this.reverbNode = convolver;
      this.reverbGain = revGain;
    } catch {
      // Convolver optional
    }
  }

  private syncBusGains(): void {
    if (!this.ctx || !this.masterGain || !this.sfxGain || !this.ambientGain) return;
    const now = this.ctx.currentTime;
    const targetMaster = this.muted ? 0 : this.masterVolume;
    this.masterGain.gain.setTargetAtTime(targetMaster, now, 0.025);
    this.sfxGain.gain.setTargetAtTime(this.sfxEnabled ? 1.0 : 0.0, now, 0.025);
    this.ambientGain.gain.setTargetAtTime(this.ambientEnabled ? 1.0 : 0.0, now, 0.04);
  }

  /**
   * Synchronizes the 3D Web Audio listener with the active camera and adjusts room
   * convolution reverb wetness based on whether the listener is indoors or outdoors.
   */
  public updateListener(camera: THREE.Camera, isInterior: boolean): void {
    this.isInterior = isInterior;
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;

    const listener = this.ctx.listener;
    const pos = camera.position;
    const el = camera.matrixWorld.elements;
    const fx = -el[8]!;
    const fy = -el[9]!;
    const fz = -el[10]!;
    const ux = el[4]!;
    const uy = el[5]!;
    const uz = el[6]!;

    if ('positionX' in listener && listener.positionX) {
      listener.positionX.setTargetAtTime(pos.x, now, 0.015);
      listener.positionY.setTargetAtTime(pos.y, now, 0.015);
      listener.positionZ.setTargetAtTime(pos.z, now, 0.015);
      listener.forwardX.setTargetAtTime(fx, now, 0.015);
      listener.forwardY.setTargetAtTime(fy, now, 0.015);
      listener.forwardZ.setTargetAtTime(fz, now, 0.015);
      listener.upX.setTargetAtTime(ux, now, 0.015);
      listener.upY.setTargetAtTime(uy, now, 0.015);
      listener.upZ.setTargetAtTime(uz, now, 0.015);
    } else {
      const legacy = listener as unknown as {
        setPosition?: (x: number, y: number, z: number) => void;
        setOrientation?: (
          fx: number,
          fy: number,
          fz: number,
          ux: number,
          uy: number,
          uz: number
        ) => void;
      };
      legacy.setPosition?.(pos.x, pos.y, pos.z);
      legacy.setOrientation?.(fx, fy, fz, ux, uy, uz);
    }

    if (this.reverbGain) {
      this.reverbGain.gain.setTargetAtTime(isInterior ? 0.22 : 0.05, now, 0.15);
    }
  }

  /**
   * Returns the active ambient bus and noise buffers when ambient audio is active and running.
   */
  public getAmbientBus(): {
    readonly ctx: AudioContext;
    readonly ambientGain: GainNode;
    readonly pinkNoiseBuffer: AudioBuffer | null;
  } | null {
    if (this.muted || !this.ambientEnabled) return null;
    if (!this.ctx || this.ctx.state !== 'running' || !this.ambientGain) return null;
    return {
      ctx: this.ctx,
      ambientGain: this.ambientGain,
      pinkNoiseBuffer: this.pinkNoiseBuffer,
    };
  }

  /**
   * Executes a procedural sound recipe routed through a 3D spatial `PannerNode` (when `worldPos`
   * is provided) and the room reverb send, or directly to the SFX bus (when `worldPos` is omitted).
   */
  public playSpatial(
    worldPos: { readonly x: number; readonly y: number; readonly z: number } | undefined,
    recipe: (toolkit: SoundSynthToolkit) => void,
    options?: SpatialSoundOptions
  ): void {
    if (this.muted || !this.sfxEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain) return;

    const dest = this.createBusNode(ctx, worldPos, options);
    const toolkit = this.createToolkit(ctx, dest);
    recipe(toolkit);
  }

  /**
   * Executes a non-spatialized procedural sound recipe directly on the SFX bus.
   */
  public playDirect(recipe: (toolkit: SoundSynthToolkit) => void): void {
    this.playSpatial(undefined, recipe, { dryGain: 1.0, wetSend: 0.04 });
  }

  private createBusNode(
    ctx: AudioContext,
    worldPos: { readonly x: number; readonly y: number; readonly z: number } | undefined,
    options?: SpatialSoundOptions
  ): AudioNode {
    const dryGain = options?.dryGain ?? 1.0;
    const wetSend = options?.wetSend ?? (this.isInterior ? 0.22 : 0.06);
    const refDistance = options?.refDistance ?? 2.2;
    const maxDistance = options?.maxDistance ?? 28;

    const inputGain = ctx.createGain();
    inputGain.gain.value = dryGain;

    if (worldPos && typeof ctx.createPanner === 'function') {
      const panner = ctx.createPanner();
      panner.panningModel = 'HRTF';
      panner.distanceModel = 'inverse';
      panner.refDistance = refDistance;
      panner.maxDistance = maxDistance;
      panner.rolloffFactor = 1.15;
      const now = ctx.currentTime;
      if ('positionX' in panner && panner.positionX) {
        panner.positionX.setValueAtTime(worldPos.x, now);
        panner.positionY.setValueAtTime(worldPos.y, now);
        panner.positionZ.setValueAtTime(worldPos.z, now);
      } else {
        (
          panner as unknown as { setPosition?: (x: number, y: number, z: number) => void }
        ).setPosition?.(worldPos.x, worldPos.y, worldPos.z);
      }
      inputGain.connect(panner);
      panner.connect(this.sfxGain!);
      if (this.reverbNode && wetSend > 0.01) {
        const send = ctx.createGain();
        send.gain.value = wetSend;
        panner.connect(send);
        send.connect(this.reverbNode);
      }
    } else {
      inputGain.connect(this.sfxGain!);
      if (this.reverbNode && wetSend > 0.01) {
        const send = ctx.createGain();
        send.gain.value = wetSend;
        inputGain.connect(send);
        send.connect(this.reverbNode);
      }
    }
    return inputGain;
  }

  private createToolkit(ctx: AudioContext, dest: AudioNode): SoundSynthToolkit {
    return {
      ctx,
      dest,
      now: ctx.currentTime,
      noiseBurst: (spec) => this.emitNoiseBurst(ctx, dest, spec),
      tone: (spec) => this.emitTone(ctx, dest, spec),
    };
  }

  private emitNoiseBurst(ctx: AudioContext, dest: AudioNode, spec: NoiseBurstSpec): void {
    if (!this.whiteNoiseBuffer) return;
    const src = ctx.createBufferSource();
    src.buffer = this.whiteNoiseBuffer;
    const offset = Math.random() * Math.max(0.05, this.whiteNoiseBuffer.duration - spec.duration - 0.05);

    const filter = ctx.createBiquadFilter();
    filter.type = spec.filterType;
    filter.frequency.setValueAtTime(Math.max(20, spec.freqStart), spec.startTime);
    if (spec.freqEnd !== undefined) {
      filter.frequency.exponentialRampToValueAtTime(
        Math.max(20, spec.freqEnd),
        spec.startTime + spec.duration
      );
    }
    filter.Q.value = spec.q ?? 1.0;

    const attack = spec.attackSec ?? 0.004;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, spec.startTime);
    env.gain.linearRampToValueAtTime(Math.max(0.0002, spec.gainPeak), spec.startTime + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, spec.startTime + spec.duration);

    src.connect(filter);
    filter.connect(env);
    env.connect(dest);

    src.start(spec.startTime, offset, spec.duration + 0.02);
    src.stop(spec.startTime + spec.duration + 0.02);
  }

  private emitTone(ctx: AudioContext, dest: AudioNode, spec: ToneBurstSpec): void {
    const osc = ctx.createOscillator();
    osc.type = spec.type;
    osc.frequency.setValueAtTime(Math.max(20, spec.freqStart), spec.startTime);
    if (spec.freqEnd !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, spec.freqEnd),
        spec.startTime + spec.duration
      );
    }

    const attack = spec.attackSec ?? 0.003;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, spec.startTime);
    env.gain.linearRampToValueAtTime(Math.max(0.0002, spec.gainPeak), spec.startTime + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, spec.startTime + spec.duration);

    osc.connect(env);
    env.connect(dest);

    osc.start(spec.startTime);
    osc.stop(spec.startTime + spec.duration + 0.015);
  }
}

export const soundEngine = new SoundEngine();
