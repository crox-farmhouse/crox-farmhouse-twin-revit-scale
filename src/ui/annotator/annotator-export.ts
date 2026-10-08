import type { SceneAnnotationStore } from '../../engine/annotation/annotation-system.ts';
import type { SceneAnnotationRecord } from '../../core/types/scene.ts';

export interface AnnotationsExportPayload {
  readonly exportedAt: string;
  readonly count: number;
  readonly markdownReport: string;
  readonly usdaOverrideLayer: string;
  readonly annotations: readonly SceneAnnotationRecord[];
}

export function copyTextWithFallback(text: string): Promise<boolean> {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    return navigator.clipboard
      .writeText(text)
      .then(() => true)
      .catch(() => execCommandCopyFallback(text));
  }
  return Promise.resolve(execCommandCopyFallback(text));
}

function execCommandCopyFallback(text: string): boolean {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  ta.style.top = '0';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  return ok;
}

export function formatAnnotationsMarkdownReport(store: SceneAnnotationStore): string {
  return store.formatForAgent();
}

export function formatAnnotationsUsdaLayer(store: SceneAnnotationStore): string {
  return store.formatAsUsdaOverrideLayer();
}

export function buildAnnotationsExportPayload(
  store: SceneAnnotationStore
): AnnotationsExportPayload {
  return {
    exportedAt: new Date().toISOString(),
    count: store.getRecords().length,
    markdownReport: store.formatForAgent(),
    usdaOverrideLayer: store.formatAsUsdaOverrideLayer(),
    annotations: store.getRecords(),
  };
}

export function downloadBlobFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAnnotationsAsJsonFile(store: SceneAnnotationStore): void {
  const payload = buildAnnotationsExportPayload(store);
  downloadBlobFile(
    JSON.stringify(payload, null, 2),
    `crox-annotations-${Date.now()}.json`,
    'application/json'
  );
}

export function exportAnnotationsAsUsdaFile(store: SceneAnnotationStore): void {
  const usdaText = formatAnnotationsUsdaLayer(store);
  downloadBlobFile(usdaText, 'layout.usda', 'text/plain;charset=utf-8');
}
