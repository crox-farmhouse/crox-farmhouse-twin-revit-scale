#!/usr/bin/env node
// Bundles the headless KNX lighting audit with esbuild (shipped with Vite) and runs it.
// Usage: node tools/knx/run.mjs [--verbose]
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';

const outfile = '.snapshots/knx-audit-cli.mjs';
await build({
  entryPoints: ['tools/knx/knx-audit.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile,
  logLevel: 'warning',
});
execFileSync(process.execPath, [outfile, ...process.argv.slice(2)], { stdio: 'inherit' });
