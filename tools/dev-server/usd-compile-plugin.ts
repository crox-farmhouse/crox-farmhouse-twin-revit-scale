import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';
import { asRecord, errorMessage, readRequestBody, sendJson } from './http-helpers.ts';

/**
 * Dev-only endpoint: `POST <base>api/usd/compile-overrides` with `{ usda }`.
 * Saves the override layer to `usd/overrides/layout.usda` and recompiles the
 * stage with Pixar's `pxr` SDK (tools/usd/compile_stage.py).
 */
export function usdCompilePlugin(): Plugin {
  return {
    name: 'crox-usd-compile-overrides',
    apply: 'serve',
    configureServer(server) {
      const root = server.config.root;
      server.middlewares.use(`${server.config.base}api/usd/compile-overrides`, (req, res) => {
        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'Method not allowed' });
          return;
        }
        void (async () => {
          try {
            const payload = asRecord(JSON.parse((await readRequestBody(req)) || '{}'));
            const usdaText = typeof payload.usda === 'string' ? payload.usda : '';
            if (!usdaText.trim().startsWith('#usda')) {
              sendJson(res, 400, { error: 'Override layer must start with #usda 1.0' });
              return;
            }
            const overridePath = path.resolve(root, 'usd/overrides/layout.usda');
            fs.mkdirSync(path.dirname(overridePath), { recursive: true });
            fs.writeFileSync(overridePath, usdaText, 'utf8');

            const scriptPath = path.resolve(root, 'tools/usd/compile_stage.py');
            const usdDir = path.resolve(root, 'usd');
            execFile(
              'python3',
              // compile_stage.py takes the USD directory as its first positional argument.
              [scriptPath, usdDir],
              { cwd: root, timeout: 30000 },
              (err, stdout, stderr) => {
                if (err) {
                  sendJson(res, 500, { error: stderr || err.message });
                  return;
                }
                sendJson(res, 200, { ok: true, output: stdout.trim() });
              }
            );
          } catch (err) {
            sendJson(res, 500, { error: errorMessage(err, 'USD compile failed') });
          }
        })();
      });
    },
  };
}
