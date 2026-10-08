#!/usr/bin/env node
// ASCII-only OpenUSD export (node only, no pxr SDK needed): bundles tools/usd/export-cli.ts with
// esbuild and writes the modular .usda layers into <outDir> (default `usd/`).
// Binary .usdc / .usdz compilation is a separate optional step: `npm run usd:compile`.
// Usage: node tools/usd/export.mjs [outDir]
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
