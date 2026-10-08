import { computed, signal, type ReadonlySignal, type Signal } from '@preact/signals';
import type { CircuitLevels } from '../core/types/knx.ts';
import type { FloorViewMode, TimeOfDay } from '../core/types/scene.ts';
import type { RoomZoneId } from '../core/types/topology.ts';
import type { GraphicsMode, TradeView } from '../core/types/twin-ux.ts';

/**
 * UI-shell state (top bar, side panels, tool dock, modals, toasts).
 * Scene/KNX state is mirrored in here by the shell bindings so Preact
 * components never poll the engine.
 */

export type DisplayUnits = 'm' | 'ftin';
export type ShellViewMode = '3d' | 'plan' | 'walk';
export type ShellTool = 'orbit' | 'measure' | 'note';
export type NoteTrade = 'architect' | 'builder' | 'electrician' | 'plumber';
export type DevTab = 'smart-home' | 'usd' | 'diagnostics';

export const NOTE_TRADES: readonly NoteTrade[] = ['architect', 'builder', 'electrician', 'plumber'];

const LS_DEV_MODE = 'crox.ui.devMode';
const LS_UNITS = 'crox.ui.units';
const LS_HELP_SEEN = 'crox.ui.helpSeen.v1';
const LS_GRAPHICS_MODE = 'crox.ui.graphicsMode';
const LS_NOTE_META = 'crox.ui.noteMeta.v1';

export const MOBILE_BREAKPOINT_PX = 900;

function readLocal(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocal(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage may be unavailable (private mode / quota); the UI still works for the session.
  }
}

function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT_PX;
}

// ---------------------------------------------------------------------------
// Persisted preferences
// ---------------------------------------------------------------------------

const devModePref: Signal<boolean> = signal(readLocal(LS_DEV_MODE) === '1');
export const guestMode: Signal<boolean> = signal(false);
/** Developer mode is never available to read-only guests. */
export const devMode: ReadonlySignal<boolean> = computed(() => devModePref.value && !guestMode.value);

export function setDevMode(enabled: boolean): void {
  devModePref.value = enabled;
  writeLocal(LS_DEV_MODE, enabled ? '1' : '0');
}

export const units: Signal<DisplayUnits> = signal(readLocal(LS_UNITS) === 'ftin' ? 'ftin' : 'm');
export function setUnits(next: DisplayUnits): void {
  units.value = next;
  writeLocal(LS_UNITS, next);
}

const GRAPHICS_MODES: readonly GraphicsMode[] = ['auto', 'low', 'medium', 'high', 'ultra'];
export function readStoredGraphicsMode(): GraphicsMode | null {
  const raw = readLocal(LS_GRAPHICS_MODE);
  return GRAPHICS_MODES.find((m) => m === raw) ?? null;
}
export function storeGraphicsMode(mode: GraphicsMode): void {
  writeLocal(LS_GRAPHICS_MODE, mode);
}

export function hasSeenHelp(): boolean {
  return readLocal(LS_HELP_SEEN) === '1';
}
export function markHelpSeen(): void {
  writeLocal(LS_HELP_SEEN, '1');
}

// ---------------------------------------------------------------------------
// Layout / overlays
// ---------------------------------------------------------------------------

export const isMobile: Signal<boolean> = signal(isMobileViewport());
export const navigatorOpen: Signal<boolean> = signal(!isMobileViewport());
export const roomPanelOpen: Signal<boolean> = signal(!isMobileViewport());
export const settingsOpen: Signal<boolean> = signal(false);
export const helpOpen: Signal<boolean> = signal(false);
export const helpStep: Signal<number> = signal(0);
export const devDrawerOpen: Signal<boolean> = signal(false);
export const devTab: Signal<DevTab> = signal<DevTab>('smart-home');

if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    const mobile = isMobileViewport();
    if (mobile === isMobile.value) return;
    isMobile.value = mobile;
    // Desktop shows both panels docked; mobile starts with drawers closed.
    navigatorOpen.value = !mobile;
    roomPanelOpen.value = !mobile;
  });
}

/** Closes the top-most overlay. Returns true if something was closed. */
export function closeTopOverlay(): boolean {
  if (helpOpen.value) {
    helpOpen.value = false;
    markHelpSeen();
    return true;
  }
  if (settingsOpen.value) {
    settingsOpen.value = false;
    return true;
  }
  if (devDrawerOpen.value) {
    devDrawerOpen.value = false;
    return true;
  }
  if (isMobile.value && (navigatorOpen.value || roomPanelOpen.value)) {
    navigatorOpen.value = false;
    roomPanelOpen.value = false;
    return true;
  }
  return false;
}

export function openHelp(step = 0): void {
  helpStep.value = step;
  helpOpen.value = true;
}

// ---------------------------------------------------------------------------
// Scene mirrors (written by shell bindings)
// ---------------------------------------------------------------------------

export const currentRoomId: Signal<RoomZoneId | null> = signal<RoomZoneId | null>(null);
export const tradeView: Signal<TradeView> = signal<TradeView>('owner');
export const floorMode: Signal<FloorViewMode> = signal<FloorViewMode>('ground');
export const viewMode: Signal<ShellViewMode> = signal<ShellViewMode>('3d');
export const activeTool: Signal<ShellTool> = signal<ShellTool>('orbit');
export const sectionCut: Signal<boolean> = signal(true);
export const timeOfDay: Signal<TimeOfDay> = signal<TimeOfDay>('dusk');
export const graphicsMode: Signal<GraphicsMode> = signal<GraphicsMode>('auto');
export const graphicsTierLabel: Signal<string> = signal('');
export const graphicsFps: Signal<number | null> = signal<number | null>(null);
export const liveLevels: Signal<Readonly<CircuitLevels> | null> = signal<Readonly<CircuitLevels> | null>(null);
/** Bumped whenever non-level KNX/scene state changes (gates, UFH, motion…). */
export const deviceRevision: Signal<number> = signal(0);

// ---------------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------------

export interface ToastMessage {
  readonly id: number;
  readonly text: string;
}

export const toast: Signal<ToastMessage | null> = signal<ToastMessage | null>(null);
let toastSeq = 0;
let toastTimer: ReturnType<typeof setTimeout> | null = null;

export function showToast(text: string, durationMs = 2600): void {
  toastSeq += 1;
  const id = toastSeq;
  toast.value = { id, text };
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    if (toast.value?.id === id) toast.value = null;
  }, durationMs);
}

// ---------------------------------------------------------------------------
// Note sidecar metadata (trade tag + resolved flag), keyed by annotation id.
// Stored separately so the engine annotation store types stay unchanged.
// ---------------------------------------------------------------------------

export interface NoteMeta {
  readonly trade?: NoteTrade;
  readonly resolved?: boolean;
}

function isNoteTrade(value: unknown): value is NoteTrade {
  return typeof value === 'string' && NOTE_TRADES.some((t) => t === value);
}

function loadNoteMeta(): Readonly<Record<string, NoteMeta>> {
  const raw = readLocal(LS_NOTE_META);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    const out: Record<string, NoteMeta> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value !== 'object' || value === null) continue;
      const trade: unknown = Reflect.get(value, 'trade');
      const resolved: unknown = Reflect.get(value, 'resolved');
      out[key] = {
        ...(isNoteTrade(trade) ? { trade } : {}),
        ...(resolved === true ? { resolved: true } : {}),
      };
    }
    return out;
  } catch {
    return {};
  }
}

export const noteMeta: Signal<Readonly<Record<string, NoteMeta>>> = signal(loadNoteMeta());

export function updateNoteMeta(id: number, patch: Partial<NoteMeta>): void {
  const key = String(id);
  const prev = noteMeta.value[key] ?? {};
  const merged: NoteMeta = { ...prev, ...patch };
  const next: Record<string, NoteMeta> = { ...noteMeta.value, [key]: merged };
  noteMeta.value = next;
  writeLocal(LS_NOTE_META, JSON.stringify(next));
}

export function pruneNoteMeta(liveIds: readonly number[]): void {
  const live = new Set(liveIds.map(String));
  const current = noteMeta.value;
  const keys = Object.keys(current);
  if (keys.every((k) => live.has(k))) return;
  const next: Record<string, NoteMeta> = {};
  for (const k of keys) {
    const meta = current[k];
    if (live.has(k) && meta) next[k] = meta;
  }
  noteMeta.value = next;
  writeLocal(LS_NOTE_META, JSON.stringify(next));
}
