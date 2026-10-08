import type { SceneAnnotationRecord } from '../../core/types/scene.ts';

/** Browser helpers for copying / downloading note exports (no engine access). */

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

export function downloadBlobFile(content: string, filename: string, mimeType: string): void {
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

/** Minimal slice of `TwinApi.notes` needed to build exports. */
export interface NotesExportSource {
  getRecords(): readonly SceneAnnotationRecord[];
  formatForAgent(): string;
  formatAsUsda(): string;
}

export function downloadNotesJson(notes: NotesExportSource): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    count: notes.getRecords().length,
    markdownReport: notes.formatForAgent(),
    usdaOverrideLayer: notes.formatAsUsda(),
    annotations: notes.getRecords(),
  };
  downloadBlobFile(JSON.stringify(payload, null, 2), `crox-annotations-${Date.now()}.json`, 'application/json');
}

export function downloadNotesUsda(notes: NotesExportSource): void {
  downloadBlobFile(notes.formatAsUsda(), 'layout.usda', 'text/plain;charset=utf-8');
}

/** `1.234 m (123.4 cm · 4' 0.6")`. */
export function formatMetersAndFeetInches(meters: number): string {
  const cm = (meters * 100).toFixed(1);
  const totalInches = meters * 39.3700787;
  const feet = Math.floor(totalInches / 12);
  const inches = (totalInches - feet * 12).toFixed(1);
  return `${meters.toFixed(3)} m (${cm} cm · ${feet}' ${inches}")`;
}
