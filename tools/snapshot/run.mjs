#!/usr/bin/env node
// Bundles the snapshot CLI with esbuild (shipped with Vite) and runs it under Node.
// Usage: node tools/snapshot/run.mjs [check|update] [goldenPath]
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';

const outfile = '.snapshots/snapshot-cli.mjs';
await build({
  entryPoints: ['tools/snapshot/snapshot-cli.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile,
  logLevel: 'warning',
});
execFileSync(process.execPath, [outfile, ...process.argv.slice(2)], { stdio: 'inherit' });
