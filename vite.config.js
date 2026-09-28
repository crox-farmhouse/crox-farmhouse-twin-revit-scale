import { execSync } from 'node:child_process';
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
