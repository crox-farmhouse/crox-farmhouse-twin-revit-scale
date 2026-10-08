import type { PluginOption } from 'vite';
import { usdAssetsPlugin } from './usd-assets-plugin.ts';
import { usdCompilePlugin } from './usd-compile-plugin.ts';
import { vertexAiProxyPlugin } from './vertex-ai-proxy-plugin.ts';

/** All Crox dev-server plugins. API middleware is `apply: 'serve'` only. */
export function croxDevServerPlugins(): PluginOption[] {
  return [usdAssetsPlugin(), usdCompilePlugin(), vertexAiProxyPlugin()];
}
