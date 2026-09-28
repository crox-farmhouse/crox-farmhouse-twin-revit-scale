import { execFile, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';

let cachedAccessToken = '';
let tokenExpiresAt = 0;

function getVertexAccessToken(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedAccessToken && now < tokenExpiresAt) {
    return cachedAccessToken;
  }
  const raw = execSync(
    'gcloud auth application-default print-access-token 2>/dev/null || gcloud auth print-access-token 2>/dev/null',
    { encoding: 'utf8' }
  ).trim();
  cachedAccessToken = raw;
  tokenExpiresAt = now + 45 * 60 * 1000;
  return cachedAccessToken;
}

function knxVertexAiMiddlewarePlugin() {
  return {
    name: 'knx-vertex-ai-proxy',
    configureServer(server) {
      // Pre-warm token cache on server start
      try {
        getVertexAccessToken(false);
      } catch {
        // Ignore startup warm error
      }

      // 1. Serve /usd/* files directly from ./usd/ (both ASCII .usda and binary .usdc / .usdz)
      server.middlewares.use('/usd/', (req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          next();
          return;
        }
        const rawUrl = (req.url || '').split('?')[0].replace(/^\/+/, '');
        const usdRoot = path.resolve(process.cwd(), 'usd');
        const targetPath = path.resolve(usdRoot, rawUrl);
        if (!targetPath.startsWith(usdRoot) || !fs.existsSync(targetPath)) {
          next();
          return;
        }
        const stat = fs.statSync(targetPath);
        if (!stat.isFile()) {
          next();
          return;
        }
        const ext = path.extname(targetPath).toLowerCase();
        const contentType =
          ext === '.usda' || ext === '.md'
            ? 'text/plain; charset=utf-8'
            : ext === '.usdz'
              ? 'model/vnd.usdz+zip'
              : 'application/octet-stream';
        res.statusCode = 200;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', String(stat.size));
        fs.createReadStream(targetPath).pipe(res);
      });

      // 2. Live OpenUSD Override Layer Save + Pixar C++ `pxr` Stage Compiler endpoint
      server.middlewares.use('/api/usd/compile-overrides', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }
        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const payload = JSON.parse(body || '{}');
            const usdaText = typeof payload.usda === 'string' ? payload.usda : '';
            if (!usdaText.trim().startsWith('#usda')) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Override layer must start with #usda 1.0' }));
              return;
            }
            const overridePath = path.resolve(process.cwd(), 'usd/overrides/layout.usda');
            fs.mkdirSync(path.dirname(overridePath), { recursive: true });
            fs.writeFileSync(overridePath, usdaText, 'utf8');

            const scriptPath = path.resolve(process.cwd(), 'tools/usd/compile_stage.py');
            const usdDir = path.resolve(process.cwd(), 'usd');
            execFile(
              'python3',
              [scriptPath, '--usd-dir', usdDir],
              { cwd: process.cwd(), timeout: 30000 },
              (err, stdout, stderr) => {
                if (err) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(
                    JSON.stringify({
                      error: stderr || err.message,
                    })
                  );
                  return;
                }
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    ok: true,
                    output: stdout.trim(),
                  })
                );
              }
            );
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                error: err instanceof Error ? err.message : 'USD compile failed',
              })
            );
          }
        });
      });

      server.middlewares.use('/api/knx-ai', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const payload = JSON.parse(body || '{}');
            const model = payload.model || 'gemini-3.5-flash-lite';
            const project = process.env.GOOGLE_CLOUD_PROJECT || 'YOUR_GCP_PROJECT';
            const url = `https://aiplatform.googleapis.com/v1/projects/${project}/locations/global/publishers/google/models/${model}:generateContent`;

            const callVertex = async (forceRefresh) => {
              const token = getVertexAccessToken(forceRefresh);
              return fetch(url, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload.vertexRequest),
              });
            };

            let upstream = await callVertex(false);
            if (upstream.status === 401) {
              upstream = await callVertex(true);
            }

            const data = await upstream.json();
            res.statusCode = upstream.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                error: err instanceof Error ? err.message : 'Vertex AI proxy failure',
              })
            );
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [knxVertexAiMiddlewarePlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
});
