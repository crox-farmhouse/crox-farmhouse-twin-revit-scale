import type { RoomZoneId } from '../core/types/topology.ts';
import type { ShareViewState, TradeView } from '../core/types/twin-ux.ts';

/**
 * Share-link state codec.
 *
 * The view state is serialised as a compact JSON tuple, then base64url encoded
 * into a single `?v=` URL parameter. Numbers are rounded to centimetres so links
 * stay short and stable.
 */

export const SHARE_URL_PARAM = 'v';

const TRADE_VIEWS: readonly TradeView[] = ['owner', 'architect', 'builder', 'electrician', 'plumber'];
const FLOOR_MODES: readonly ShareViewState['floor'][] = ['ground', 'first', 'all'];

/** Wire format: short keys keep the encoded string compact. */
interface CompactShareState {
  readonly c: readonly number[];
  readonly t: readonly number[];
  readonly f: number;
  readonly o: number;
  readonly r?: string;
  readonly w: number;
  readonly g: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(param: string): string | null {
  if (!/^[A-Za-z0-9_-]+$/.test(param)) return null;
  const padded = param.replace(/-/g, '+').replace(/_/g, '/');
  const withPad = padded + '='.repeat((4 - (padded.length % 4)) % 4);
  try {
    const binary = atob(withPad);
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

/** Exhaustive (compile-checked) set of zone ids accepted from share links. */
const ROOM_ZONE_IDS: Readonly<Record<RoomZoneId, true>> = {
  kitchen: true,
  sitting: true,
  utility: true,
  familyRoom: true,
  bootLobby: true,
  hall: true,
  livingRoom: true,
  entranceHall: true,
  sittingRoom: true,
  study: true,
  mainBedroom: true,
  familyBathroom: true,
  upperLanding: true,
  bedroom2: true,
  bedroom3: true,
  bedroom4: true,
  courtyard: true,
  hallway: true,
  diningRoom: true,
  snug: true,
  masterBedroom: true,
  annexLiving: true,
  annexBedroom: true,
  outbuildingGym: true,
  outbuildingGarage: true,
  outbuildingBarn: true,
  outbuildingMezzanine: true,
  outbuildingStableOffice: true,
  outbuildingStore: true,
  outbuildingStableSuite: true,
};

export function isRoomZoneId(value: string): value is RoomZoneId {
  return Object.prototype.hasOwnProperty.call(ROOM_ZONE_IDS, value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readVec3(value: unknown): readonly [number, number, number] | null {
  if (!Array.isArray(value) || value.length !== 3) return null;
  const out: number[] = [];
  for (const v of value) {
    if (typeof v !== 'number' || !Number.isFinite(v) || Math.abs(v) > 10000) return null;
    out.push(v);
  }
  return [out[0], out[1], out[2]];
}

export function encodeShareState(s: ShareViewState): string {
  const compact: CompactShareState = {
    c: s.cam.map(round2),
    t: s.target.map(round2),
    f: Math.max(0, FLOOR_MODES.indexOf(s.floor)),
    o: s.ortho ? 1 : 0,
    ...(s.room ? { r: s.room } : {}),
    w: Math.max(0, TRADE_VIEWS.indexOf(s.view)),
    g: s.guest ? 1 : 0,
  };
  return toBase64Url(JSON.stringify(compact));
}

export function decodeShareState(param: string): ShareViewState | null {
  const json = fromBase64Url(param.trim());
  if (json === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;

  const cam = readVec3(parsed.c);
  const target = readVec3(parsed.t);
  if (!cam || !target) return null;

  const floorIdx = typeof parsed.f === 'number' ? parsed.f : 0;
  const floor = FLOOR_MODES[floorIdx] ?? 'ground';
  const viewIdx = typeof parsed.w === 'number' ? parsed.w : 0;
  const view = TRADE_VIEWS[viewIdx] ?? 'owner';
  const room = typeof parsed.r === 'string' && isRoomZoneId(parsed.r) ? parsed.r : undefined;

  return {
    cam,
    target,
    floor,
    ortho: parsed.o === 1,
    ...(room ? { room } : {}),
    view,
    guest: parsed.g !== 0,
  };
}

/** Builds an absolute share URL for the current page, replacing any previous view state. */
export function buildShareUrl(s: ShareViewState, baseHref: string = window.location.href): string {
  const url = new URL(baseHref);
  url.hash = '';
  // Developer / transport params never travel with a share link.
  url.searchParams.delete('dev');
  url.searchParams.delete('knxWs');
  url.searchParams.set(SHARE_URL_PARAM, encodeShareState(s));
  return url.toString();
}

/** Reads `?v=` from the current location (or the given search string). */
export function readShareStateFromLocation(search: string = window.location.search): ShareViewState | null {
  const raw = new URLSearchParams(search).get(SHARE_URL_PARAM);
  return raw ? decodeShareState(raw) : null;
}
