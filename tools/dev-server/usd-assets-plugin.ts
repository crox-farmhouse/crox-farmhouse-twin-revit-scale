import fs from 'node:fs';
import path from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';

const CONTENT_TYPES: Readonly<Record<string, string>> = {
  '.usda': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.usdz': 'model/vnd.usdz+zip',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
};

/** Sub-directories of `usd/` that the browser runtime fetches (zone layers + material library). */
const RUNTIME_USD_DIRS = ['zones', 'materials'] as const;

/**
 * Serves `<base>usd/*` straight from `./usd/` in the dev server (ASCII .usda as
 * well as binary .usdc / .usdz), so the USD Stage Studio can load zone layers.
 *
 * For production builds the runtime layers (usd/zones, usd/materials) are only
 * copied into `dist/usd/` when `CROX_BUNDLE_USD=1` is set (CI does this after
 * `npm run usd:export`); otherwise the USD dev features degrade gracefully.
 */
export function usdAssetsPlugin(): Plugin {
  let config: ResolvedConfig | undefined;
  return {
    name: 'crox-usd-assets',
    configResolved(resolved) {
      config = resolved;
    },
    configureServer(server) {
      const usdRoot = path.resolve(server.config.root, 'usd');
      server.middlewares.use(`${server.config.base}usd/`, (req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          next();
          return;
        }
        const rawUrl = decodeURIComponent((req.url ?? '').split('?')[0] ?? '').replace(/^\/+/, '');
        const targetPath = path.resolve(usdRoot, rawUrl);
        if (!targetPath.startsWith(usdRoot + path.sep) || !fs.existsSync(targetPath)) {
          next();
          return;
        }
        const stat = fs.statSync(targetPath);
        if (!stat.isFile()) {
          next();
          return;
        }
        const ext = path.extname(targetPath).toLowerCase();
        res.statusCode = 200;
        res.setHeader('Content-Type', CONTENT_TYPES[ext] ?? 'application/octet-stream');
        res.setHeader('Content-Length', String(stat.size));
        if (req.method === 'HEAD') {
          res.end();
          return;
        }
        fs.createReadStream(targetPath).pipe(res);
      });
    },
    closeBundle() {
      if (!config || config.command !== 'build' || process.env.CROX_BUNDLE_USD !== '1') {
        return;
      }
      const outDir = path.resolve(config.root, config.build.outDir);
      for (const dir of RUNTIME_USD_DIRS) {
        const src = path.resolve(config.root, 'usd', dir);
        if (!fs.existsSync(src)) {
          config.logger.warn(`[crox-usd-assets] usd/${dir} missing — run \`npm run usd:export\` first.`);
          continue;
        }
        fs.cpSync(src, path.join(outDir, 'usd', dir), { recursive: true });
        config.logger.info(`[crox-usd-assets] copied usd/${dir} -> ${path.relative(config.root, outDir)}/usd/${dir}`);
      }
    },
  };
}
