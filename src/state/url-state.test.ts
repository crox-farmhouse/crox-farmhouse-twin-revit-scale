import { describe, expect, it } from 'vitest';
import type { ShareViewState } from '../core/types/twin-ux.ts';
import {
  SHARE_URL_PARAM,
  buildShareUrl,
  decodeShareState,
  encodeShareState,
  readShareStateFromLocation,
} from './url-state.ts';

const SAMPLE: ShareViewState = {
  cam: [-12.34, 8.5, 21.07],
  target: [-4.2, 0, 3.9],
  floor: 'first',
  ortho: true,
  room: 'kitchen',
  view: 'electrician',
  guest: false,
};

describe('share-link codec', () => {
  it('round-trips a full view state', () => {
    const encoded = encodeShareState(SAMPLE);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeShareState(encoded)).toEqual(SAMPLE);
  });

  it('round-trips without a room and with guest mode', () => {
    const state: ShareViewState = { ...SAMPLE, room: undefined, guest: true, floor: 'all', view: 'owner' };
    const { room: _room, ...expected } = state;
    expect(decodeShareState(encodeShareState(state))).toEqual(expected);
  });

  it('rounds coordinates to centimetres', () => {
    const decoded = decodeShareState(
      encodeShareState({ ...SAMPLE, cam: [1.23456, -2.34567, 3.005], target: [0.004, 0, 0] })
    );
    expect(decoded?.cam).toEqual([1.23, -2.35, 3.01]);
    expect(decoded?.target).toEqual([0, 0, 0]);
  });

  it('rejects malformed input', () => {
    expect(decodeShareState('')).toBeNull();
    expect(decodeShareState('not base64!')).toBeNull();
    expect(decodeShareState(btoa('{"c":[1,2],"t":[0,0,0]}'))).toBeNull();
    expect(decodeShareState(btoa('[1,2,3]'))).toBeNull();
  });

  it('drops unknown room ids', () => {
    const raw = btoa(JSON.stringify({ c: [1, 2, 3], t: [0, 0, 0], f: 0, o: 0, r: 'notARoom', w: 0, g: 0 }))
      .replace(/=+$/, '');
    const decoded = decodeShareState(raw);
    expect(decoded).not.toBeNull();
    expect(decoded?.room).toBeUndefined();
  });

  it('builds share URLs without dev/transport params and reads them back', () => {
    const url = new URL(
      buildShareUrl(SAMPLE, 'https://example.test/crox-farmhouse-twin/?dev=1&knxWs=ws://x&keep=1#frag')
    );
    expect(url.pathname).toBe('/crox-farmhouse-twin/');
    expect(url.hash).toBe('');
    expect(url.searchParams.has('dev')).toBe(false);
    expect(url.searchParams.has('knxWs')).toBe(false);
    expect(url.searchParams.get('keep')).toBe('1');
    expect(url.searchParams.has(SHARE_URL_PARAM)).toBe(true);
    expect(readShareStateFromLocation(url.search)).toEqual(SAMPLE);
  });
});
