#!/usr/bin/env node
// Zero-dependency layer boundary checker for src/.
//
// Dependency rule (see docs/ARCHITECTURE.md):
//   core → (nothing)            engine → core           objects → engine, core
//   homes → engine, objects, integrations, core
//   integrations → core         state → core
//   ui → core, state (+ TYPE-ONLY imports of src/app/twin-api.ts;
//        src/ui/dev/** may also import engine + integrations for legacy dev tools)
//   app, main.ts → anything
// core and state must not import three.js. Same-layer imports are always allowed.
//
// Known violations awaiting an in-flight refactor live in tools/boundaries-baseline.json
// (matched by file + import specifier, so line shifts do not matter). They are reported but do
// not fail the check; fixed entries are flagged as stale so the baseline only ever shrinks.
//
// Usage: node tools/check-boundaries.mjs [--json] [--no-baseline]
// Exits 1 when any violation outside the baseline is found.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'src');

/** @type {Record<string, readonly string[] | '*'>} */
const ALLOWED = {
  core: [],
  engine: ['core'],
  objects: ['engine', 'core'],
  homes: ['engine', 'objects', 'integrations', 'core'],
  integrations: ['core'],
  state: ['core'],
  ui: ['core', 'state'],
  app: '*',
};

/** Bare packages forbidden per layer (pure layers must stay renderer-agnostic). */
const FORBIDDEN_PACKAGES = {
  core: ['three', 'preact', '@preact/signals'],
  state: ['three'],
};

const BASELINE_PATH = join(ROOT, 'tools', 'boundaries-baseline.json');

const UI_TYPE_ONLY_FACADE = 'src/app/twin-api.ts';
const UI_DEV_PREFIX = 'src/ui/dev/';
const UI_DEV_EXTRA = ['engine', 'integrations'];

function toPosix(p) {
  return p.split(sep).join('/');
}

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walk(full, out);
    } else if (/\.(ts|tsx|mts)$/.test(name) && !name.endsWith('.d.ts')) {
      out.push(full);
    }
  }
  return out;
}

/** Layer of a repo-relative posix path under src/, or null when outside src/. */
function layerOf(relPath) {
  if (!relPath.startsWith('src/')) {
    return null;
  }
  const rest = relPath.slice('src/'.length);
  if (!rest.includes('/')) {
    return 'app'; // src/main.ts and other root entry files are composition-root code
  }
  return rest.slice(0, rest.indexOf('/'));
}

/** Blanks out comments while preserving line numbers and string contents. */
function stripComments(text) {
  let out = '';
  let i = 0;
  let quote = '';
  while (i < text.length) {
    const ch = text[i];
    const next = text[i + 1];
    if (quote) {
      out += ch;
      if (ch === '\\') {
        out += next ?? '';
        i += 2;
        continue;
      }
      if (ch === quote) {
        quote = '';
      }
      i += 1;
      continue;
    }
    if (ch === '/' && next === '/') {
      while (i < text.length && text[i] !== '\n') {
        i += 1;
      }
      continue;
    }
    if (ch === '/' && next === '*') {
      i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) {
        out += text[i] === '\n' ? '\n' : ' ';
        i += 1;
      }
      i += 2;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
    }
    out += ch;
    i += 1;
  }
  return out;
}

const STATIC_RE =
  /(^|[\n;{}])\s*(import|export)\s+(type\s+)?([^;'"`]*?)\s*from\s*['"]([^'"\n]+)['"]/g;
const SIDE_EFFECT_RE = /(^|[\n;{}])\s*import\s*['"]([^'"\n]+)['"]/g;
const DYNAMIC_RE = /\bimport\(\s*['"]([^'"\n]+)['"]\s*\)/g;

function lineAt(text, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (text.charCodeAt(i) === 10) {
      line += 1;
    }
  }
  return line;
}

/** Index of the `import`/`export` keyword in a statement match (skips the leading separator). */
function keywordIndex(m) {
  const afterSep = m[0].slice(m[1].length);
  return m.index + m[1].length + afterSep.search(/\S/);
}

/** True when every named specifier in `{ ... }` is marked `type`. */
function allSpecifiersTypeOnly(clause) {
  const m = /^\{([\s\S]*)\}$/.exec(clause.trim());
  if (!m) {
    return false;
  }
  const parts = m[1].split(',').map((s) => s.trim()).filter(Boolean);
  return parts.length > 0 && parts.every((s) => s.startsWith('type '));
}

function parseImports(text) {
  const code = stripComments(text);
  /** @type {{ spec: string, typeOnly: boolean, line: number }[]} */
  const found = [];
  for (const m of code.matchAll(STATIC_RE)) {
    const typeOnly = Boolean(m[3]) || allSpecifiersTypeOnly(m[4]);
    found.push({ spec: m[5], typeOnly, line: lineAt(code, keywordIndex(m)) });
  }
  for (const m of code.matchAll(SIDE_EFFECT_RE)) {
    found.push({ spec: m[2], typeOnly: false, line: lineAt(code, keywordIndex(m)) });
  }
  for (const m of code.matchAll(DYNAMIC_RE)) {
    found.push({ spec: m[1], typeOnly: false, line: lineAt(code, m.index) });
  }
  return found;
}

function bareName(spec) {
  const parts = spec.split('/');
  return spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

export function checkBoundaries() {
  /** @type {{ file: string, line: number, from: string, to: string, spec: string, reason: string }[]} */
  const violations = [];
  for (const abs of walk(SRC, [])) {
    const file = toPosix(relative(ROOT, abs));
    const fromLayer = layerOf(file);
    if (!fromLayer) {
      continue;
    }
    for (const imp of parseImports(readFileSync(abs, 'utf8'))) {
      if (!imp.spec.startsWith('.') && !imp.spec.startsWith('/')) {
        const pkg = bareName(imp.spec);
        const banned = FORBIDDEN_PACKAGES[fromLayer] ?? [];
        if (banned.includes(pkg) && !imp.typeOnly) {
          violations.push({
            file, line: imp.line, from: fromLayer, to: pkg, spec: imp.spec,
            reason: `${fromLayer} must not import '${pkg}'`,
          });
        }
        continue;
      }
      const target = toPosix(relative(ROOT, resolve(dirname(abs), imp.spec)));
      const toLayer = layerOf(target);
      if (!toLayer || toLayer === fromLayer) {
        continue;
      }
      const allowed = ALLOWED[fromLayer];
      if (allowed === undefined) {
        violations.push({
          file, line: imp.line, from: fromLayer, to: toLayer, spec: imp.spec,
          reason: `unknown layer '${fromLayer}' (add it to tools/check-boundaries.mjs)`,
        });
        continue;
      }
      if (allowed === '*' || allowed.includes(toLayer)) {
        continue;
      }
      if (fromLayer === 'ui') {
        if (target === UI_TYPE_ONLY_FACADE && imp.typeOnly) {
          continue;
        }
        if (file.startsWith(UI_DEV_PREFIX) && UI_DEV_EXTRA.includes(toLayer)) {
          continue;
        }
      }
      const hint =
        fromLayer === 'ui' && target === UI_TYPE_ONLY_FACADE
          ? ' (use `import type` for the TwinApi facade)'
          : '';
      violations.push({
        file, line: imp.line, from: fromLayer, to: toLayer, spec: imp.spec,
        reason: `${fromLayer} → ${toLayer} is not allowed${hint}`,
      });
    }
  }
  return violations;
}

/** @returns {{ file: string, spec: string, reason?: string }[]} */
function loadBaseline() {
  try {
    const parsed = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
    return Array.isArray(parsed.violations) ? parsed.violations : [];
  } catch {
    return [];
  }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const all = checkBoundaries();
  const baseline = process.argv.includes('--no-baseline') ? [] : loadBaseline();
  const key = (v) => `${v.file}|${v.spec}`;
  const baselineKeys = new Set(baseline.map(key));
  const known = all.filter((v) => baselineKeys.has(key(v)));
  const violations = all.filter((v) => !baselineKeys.has(key(v)));
  const liveKeys = new Set(all.map(key));
  const stale = baseline.filter((b) => !liveKeys.has(key(b)));

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ violations, known, stale }, null, 2));
  } else {
    for (const v of known) {
      console.log(`known  ${v.file}:${v.line}  ${v.reason}  [${v.spec}]`);
    }
    for (const b of stale) {
      console.log(`stale  ${b.file}  [${b.spec}] is fixed: remove it from tools/boundaries-baseline.json`);
    }
    for (const v of violations) {
      console.log(`${v.file}:${v.line}  ${v.reason}  [${v.spec}]`);
    }
    console.log(
      violations.length === 0
        ? `check-boundaries: OK (${known.length} known baseline violation(s))`
        : `\ncheck-boundaries: ${violations.length} violation(s) (+${known.length} known in baseline)`
    );
  }
  process.exit(violations.length === 0 ? 0 : 1);
}
