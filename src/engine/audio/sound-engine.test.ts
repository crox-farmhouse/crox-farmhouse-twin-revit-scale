import { describe, expect, it } from 'vitest';
import {
  classifyFloorSurface,
  playWalkthroughFootstep,
  playWalkthroughJump,
  playWalkthroughLand,
} from '../walkthrough/parts/walkthrough-footstep-audio.ts';
import { SoundEngine } from './sound-engine.ts';

describe('sound-engine', () => {
  it('classifies floor surfaces by room zone and coordinates', () => {
    expect(classifyFloorSurface('kitchen', 0, 0, 0, false)).toBe('stone');
    expect(classifyFloorSurface('livingRoom', 0, 0, 0, false)).toBe('wood');
    expect(classifyFloorSurface('outbuildingGym', -18, -0.48, 18, false)).toBe('turf');
    expect(classifyFloorSurface('outbuildingBarn', -6.0, -0.34, 19.0, false)).toBe('turf');
    expect(classifyFloorSurface('outbuildingBarn', 2.0, -0.34, 19.0, false)).toBe('wood');
    expect(classifyFloorSurface('courtyard', 0, 0, -14, false)).toBe('gravel');
    expect(classifyFloorSurface('hallway', 0, 1.5, 0, false)).toBe('stair');
    expect(classifyFloorSurface('outbuildingBarn', 0, 0, 0, true)).toBe('ladder');
  });

  it('manages mute, volume, ambient, and sfx state cleanly in headless environments', () => {
    const engine = new SoundEngine();
    expect(engine.isMuted()).toBe(false);
    expect(engine.getMasterVolume()).toBeCloseTo(0.75, 2);

    let notifications = 0;
    const unsub = engine.onChanged(() => {
      notifications += 1;
    });

    engine.setMuted(true);
    expect(engine.isMuted()).toBe(true);
    expect(engine.toggleMuted()).toBe(false);
    expect(engine.isMuted()).toBe(false);

    engine.setMasterVolume(0.45);
    expect(engine.getMasterVolume()).toBeCloseTo(0.45, 2);

    engine.setAmbientEnabled(false);
    expect(engine.isAmbientEnabled()).toBe(false);

    engine.setSfxEnabled(false);
    expect(engine.isSfxEnabled()).toBe(false);
    expect(notifications).toBeGreaterThanOrEqual(5);

    // Ensure synthesis primitives and asset sound helpers are no-op safe when AudioContext is unavailable
    expect(() =>
      engine.playSpatial({ x: 0, y: 0, z: 0 }, (s) =>
        s.tone({
          startTime: s.now,
          duration: 0.1,
          type: 'sine',
          freqStart: 440,
          freqEnd: 220,
          gainPeak: 0.1,
        })
      )
    ).not.toThrow();
    expect(() =>
      engine.playDirect((s) =>
        s.noiseBurst({
          startTime: s.now,
          duration: 0.05,
          filterType: 'bandpass',
          freqStart: 1200,
          q: 2,
          gainPeak: 0.1,
        })
      )
    ).not.toThrow();
    expect(() => playWalkthroughFootstep('wood', { x: 0, y: 0, z: 0 }, false)).not.toThrow();
    expect(() => playWalkthroughJump({ x: 0, y: 0, z: 0 })).not.toThrow();
    expect(() => playWalkthroughLand('stone', { x: 0, y: 0, z: 0 })).not.toThrow();

    unsub();
  });
});


