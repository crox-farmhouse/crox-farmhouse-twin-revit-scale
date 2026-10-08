import { describe, expect, it } from 'vitest';
import { classifyGpu, estimateInitialTier, getDeviceCacheKey, type DeviceProfile } from './device-tier.ts';

const DESKTOP: DeviceProfile = {
  gpuRenderer: '',
  gpuVendor: '',
  hardwareConcurrency: 16,
  deviceMemoryGb: 16,
  devicePixelRatio: 2,
  isMobile: false,
  isTouch: false,
  maxTextureSize: 16384,
  isWebGL2: true,
};

describe('classifyGpu', () => {
  it.each([
    ['ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)', 'low'],
    ['llvmpipe (LLVM 15.0.7, 256 bits)', 'low'],
    ['ANGLE (NVIDIA, NVIDIA GeForce RTX 4090 Direct3D11 vs_5_0 ps_5_0, D3D11)', 'ultra'],
    ['Apple M2 Max', 'ultra'],
    ['Apple M1', 'high'],
    ['NVIDIA GeForce RTX 2060', 'high'],
    ['AMD Radeon RX 580', 'high'],
    ['NVIDIA GeForce GTX 960', 'medium'],
    ['Intel(R) Iris(R) Xe Graphics', 'medium'],
    ['Adreno (TM) 740', 'medium'],
    ['Intel(R) UHD Graphics 620', 'low'],
    ['Mali-G78 MP14', 'low'],
  ] as const)('%s -> %s', (renderer, tier) => {
    expect(classifyGpu(renderer)).toBe(tier);
  });

  it('returns null for unknown GPUs', () => {
    expect(classifyGpu('Totally Unknown Accelerator 9000')).toBeNull();
    expect(classifyGpu('')).toBeNull();
  });
});

describe('estimateInitialTier', () => {
  it('defaults unknown GPUs to medium', () => {
    expect(estimateInitialTier({ ...DESKTOP, gpuRenderer: 'mystery' })).toBe('medium');
  });

  it('treats desktop Safari "Apple GPU" as high', () => {
    expect(estimateInitialTier({ ...DESKTOP, gpuRenderer: 'Apple GPU' })).toBe('high');
  });

  it('caps by device capabilities', () => {
    const rtx = { ...DESKTOP, gpuRenderer: 'NVIDIA GeForce RTX 4090' };
    expect(estimateInitialTier(rtx)).toBe('ultra');
    expect(estimateInitialTier({ ...rtx, hardwareConcurrency: 6 })).toBe('high');
    expect(estimateInitialTier({ ...rtx, isMobile: true })).toBe('medium');
    expect(estimateInitialTier({ ...rtx, deviceMemoryGb: 2 })).toBe('low');
    expect(estimateInitialTier({ ...rtx, maxTextureSize: 2048 })).toBe('low');
  });

  it('builds a stable cache key', () => {
    expect(getDeviceCacheKey({ ...DESKTOP, gpuRenderer: '  Apple M1 ', devicePixelRatio: 2.1 })).toBe(
      'apple m1|dpr2'
    );
    expect(getDeviceCacheKey(DESKTOP)).toBe('unknown-gpu|dpr2');
  });
});
