/**
 * Controls the static loading screen in index.html (#loading-screen), which is
 * visible before any script runs and is removed once the scene is interactive.
 */
export interface LoadingScreen {
  setProgress(label: string, fraction: number): Promise<void>;
  fail(message: string): void;
  finish(): void;
}

/** Yields long enough for the browser to paint the latest progress text. */
function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      setTimeout(resolve, 0);
    });
  });
}

export function getLoadingScreen(): LoadingScreen {
  const root = document.getElementById('loading-screen');
  const label = document.getElementById('loading-label');
  const bar = document.getElementById('loading-bar-fill');

  return {
    async setProgress(text: string, fraction: number): Promise<void> {
      if (label) label.textContent = text;
      if (bar) bar.style.width = `${Math.round(Math.max(0, Math.min(1, fraction)) * 100)}%`;
      await nextPaint();
    },
    fail(message: string): void {
      if (label) label.textContent = message;
      root?.classList.add('is-error');
    },
    finish(): void {
      if (!root) return;
      root.classList.add('is-done');
      window.setTimeout(() => root.remove(), 450);
    },
  };
}
