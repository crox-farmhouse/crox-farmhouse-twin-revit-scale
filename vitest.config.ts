import { defineConfig } from 'vitest/config';

// Unit tests run in plain Node (no DOM / WebGL). Keep tests next to the pure
// modules they cover as `*.test.ts`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tools/**/*.test.ts'],
  },
});
