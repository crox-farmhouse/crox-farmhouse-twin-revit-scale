import { bootstrap } from './app/bootstrap.ts';
import { getLoadingScreen } from './ui/shell/loading.ts';

/** Entry point: everything is composed in src/app/bootstrap.ts. */
bootstrap().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  getLoadingScreen().fail(`Something went wrong while loading: ${message}`);
  console.error(err);
});
