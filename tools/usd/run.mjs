#!/usr/bin/env node
// Bundles the OpenUSD stage generator with esbuild, emits modular .usda layers,
// and compiles/validates binary .usdc & .usdz stages with Pixar's OpenUSD (pxr) SDK.
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';

const outDir = process.argv[2] ?? 'usd';
const outfile = '.snapshots/usd-export-cli.mjs';

await build({
  entryPoints: ['tools/usd/export-cli.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  outfile,
  logLevel: 'warning',
});

execFileSync(process.execPath, [outfile, outDir], { stdio: 'inherit' });
execFileSync('python3', ['tools/usd/compile_stage.py', outDir], { stdio: 'inherit' });
