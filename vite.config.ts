import { defineConfig } from 'vite';
import { croxDevServerPlugins } from './tools/dev-server/index.ts';

/** Normalises VITE_BASE (e.g. `/crox-farmhouse-twin/`) to a leading + trailing slash. */
function resolveBase(raw: string | undefined): string {
  const trimmed = (raw ?? '').trim();
  if (!trimmed || trimmed === '/') {
    return '/';
  }
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}/`;
}

/**
 * Vendor-only manual chunks. App code is left to Rollup's default chunking: the
 * layer-based split that used to live here produced circular chunks
 * (engine <-> homes) which risk TDZ errors at module-evaluation time.
 */
function manualChunks(id: string): string | undefined {
  if (id.includes('node_modules/three')) {
    return 'vendor-three';
  }
  if (id.includes('node_modules/preact') || id.includes('node_modules/@preact')) {
    return 'vendor-preact';
  }
  return undefined;
}

export default defineConfig({
  base: resolveBase(process.env.VITE_BASE),
  plugins: [croxDevServerPlugins()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
  build: {
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: { manualChunks },
    },
  },
});
