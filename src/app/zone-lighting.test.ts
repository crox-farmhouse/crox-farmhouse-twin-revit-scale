import { describe, expect, it } from 'vitest';
import { CROX_ZONE_SCENES } from '../homes/crox-farmhouse/hud-model.ts';
import { CROX_ROOM_MANIFEST, getRoomManifest } from '../homes/crox-farmhouse/room-manifest.ts';
import { CROX_KNX_PROJECT } from '../homes/crox-farmhouse/knx/project.ts';
import { KNXPropertyBusController } from '../integrations/knx/emulator.ts';
import type { CircuitId } from '../core/types/knx.ts';
import type { KnxZoneBus, KnxZoneState } from '../core/types/knx-zones.ts';
import { isKnxZoneBus } from '../core/types/knx-zones.ts';
import type { RoomZoneId } from '../core/types/topology.ts';
import { createZoneLightingApi, inferLayerKind, type ZoneLightingDeps } from './zone-lighting.ts';

const CIRCUITS = CROX_KNX_PROJECT.circuits;

const deps: ZoneLightingDeps = {
  circuits: CIRCUITS,
  manifest: CROX_ROOM_MANIFEST,
  getManifest: (zoneId) => getRoomManifest(zoneId),
  getLevelScenes: (zoneId) => CROX_ZONE_SCENES[zoneId] ?? [],
  roomLabel: (zoneId) => getRoomManifest(zoneId)?.label ?? zoneId,
  uiSourcePa: '1.1.10',
};

function settle(knx: KNXPropertyBusController): void {
  for (let i = 0; i < 200; i++) knx.stepDimming(0.1);
}

describe('inferLayerKind', () => {
  it('prefers an explicit kind', () => {
    expect(inferLayerKind({ id: 'diningPendant', name: 'x', shortName: 'x', kind: 'feature' })).toBe('feature');
  });

  it('classifies legacy circuits by name', () => {
    const kindOf = (id: CircuitId): string => {
      const c = CIRCUITS.find((x) => x.id === id);
      if (!c) throw new Error(id);
      // Name-based inference only (Crox circuits also carry an explicit kind).
      return inferLayerKind({ id: c.id, name: c.name, shortName: c.shortName });
    };
    expect(kindOf('islandPendants')).toBe('pendants');
    expect(kindOf('spotlights')).toBe('spots');
    expect(kindOf('underCabinet')).toBe('task');
    expect(kindOf('diningPictureLight')).toBe('picture');
    expect(kindOf('entranceHallUplights')).toBe('uplights');
    expect(kindOf('mezzanineLamps5A')).toBe('lamps');
    expect(kindOf('courtyardFestoons')).toBe('exterior');
    expect(kindOf('reclaimedLampPost')).toBe('exterior');
  });
});

describe('Crox KNX emulator (native zone bus)', () => {
  const knx = new KNXPropertyBusController(CROX_KNX_PROJECT);
  const zones = createZoneLightingApi(knx, deps);

  it('implements KnxZoneBus natively, one zone per room with its circuits', () => {
    expect(isKnxZoneBus(knx)).toBe(true);
    expect(zones.source()).toBe('knx');
    const familyRoom = zones.get('familyRoom');
    expect(familyRoom?.circuitIds).toEqual(
      expect.arrayContaining(['familyRoomSpots', 'diningPendant', 'diningPictureLight', 'diningFairyLights'])
    );
    expect(familyRoom?.scenes[0]?.label).toBe('Bright');
    const ids = zones.list().map((z) => z.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('tracks Full / Night / Off / scene / manual from the bus', () => {
    const zoneId: RoomZoneId = 'familyRoom';
    const state = (): KnxZoneState => zones.getState(zoneId);

    zones.setOff(zoneId);
    settle(knx);
    expect(state()).toEqual({ mode: 'off', sceneIndex: null });

    zones.setFull(zoneId);
    expect(state().mode).toBe('full');

    zones.setNight(zoneId);
    expect(state().mode).toBe('night');

    zones.recallScene(zoneId, 1);
    expect(state()).toEqual({ mode: 'scene', sceneIndex: 1 });

    knx.setCircuitLevel('diningPendant', 12);
    expect(state().mode).toBe('manual');
  });
});

describe('native zone model', () => {
  it('delegates to a controller that implements KnxZoneBus', () => {
    const calls: string[] = [];
    const legacy = new KNXPropertyBusController(CROX_KNX_PROJECT);
    const native: KnxZoneBus = {
      getZones: () => [
        {
          id: 'hall',
          name: 'Stair Hall',
          circuits: ['hallPendant'],
          scenes: [{ id: 'bright', label: 'Bright', levels: { hallPendant: 100 } }],
        },
      ],
      getZoneState: () => ({ mode: 'scene', sceneIndex: 0 }),
      recallZoneScene: (zoneId, idx) => calls.push(`scene:${zoneId}:${idx}`),
      setZoneFull: (zoneId) => calls.push(`full:${zoneId}`),
      enterZoneNight: (zoneId) => calls.push(`night:${zoneId}`),
      setZoneOff: (zoneId) => calls.push(`off:${zoneId}`),
      handleZoneSwitchGesture: () => undefined,
      getPushButtons: () => [
        { pa: '1.1.20', name: 'Hall plate', mountedInZoneId: 'hall', location: 'Hall door', gangs: [{ gang: 1, zoneId: 'hall', label: 'Hall' }] },
      ],
      getPresenceDetectors: () => [{ pa: '1.1.90', name: 'Hall PIR', zoneId: 'hall' }],
      getPresenceState: () => ({ detected: true, lastSeenSimSec: 12 }),
      getCircuits: () => CIRCUITS,
    };
    const bus = Object.assign(legacy, native);
    const zones = createZoneLightingApi(bus, deps);
    expect(zones.source()).toBe('knx');
    expect(zones.list().map((z) => z.id)).toEqual(['hall']);
    // hallPendant is typed `wall` (staircase hall wall lights) in the Crox project.
    expect(zones.get('hall')?.layers[0]?.kind).toBe('wall');
    zones.recallScene('hall', 0);
    zones.setFull('hall');
    zones.setNight('hall');
    zones.setOff('hall');
    expect(calls).toEqual(['scene:hall:0', 'full:hall', 'night:hall', 'off:hall']);
    expect(zones.presenceDetectors('hall')[0]?.detected).toBe(true);
    expect(zones.switches('hall')[0]?.gangs[0]?.ledOn).toBe(true);
  });
});
