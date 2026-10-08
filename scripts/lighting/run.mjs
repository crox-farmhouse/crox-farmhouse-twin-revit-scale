#!/usr/bin/env node
// Bundles the headless lighting-consistency check with esbuild (shipped with Vite) and runs it.
// Usage: node scripts/lighting/run.mjs
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';

const outfile = '.snapshots/lighting-consistency-cli.mjs';
await build({
  entryPoints: ['scripts/lighting/consistency-check.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile,
  logLevel: 'warning',
});
execFileSync(process.execPath, [outfile, ...process.argv.slice(2)], { stdio: 'inherit' });
