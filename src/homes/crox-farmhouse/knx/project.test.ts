import { describe, expect, it } from 'vitest';
import { distanceToPolygonXZ } from '../../../integrations/knx/motion-presence.ts';
import { KNXPropertyBusController } from '../../../integrations/knx/emulator.ts';
import { CROX_KNX_PROJECT } from './project.ts';

const project = CROX_KNX_PROJECT;

function parseGa(ga: string): readonly number[] {
  return ga.split('/').map(Number);
}

describe('CROX_KNX_PROJECT consistency', () => {
  it('uses valid, unique 3-level group addresses', () => {
    const seen = new Map<string, string>();
    for (const entry of project.groupAddresses) {
      const [main = -1, middle = -1, sub = -1] = parseGa(entry.address);
      expect(main, entry.address).toBeGreaterThanOrEqual(0);
      expect(main, entry.address).toBeLessThanOrEqual(31);
      expect(middle, entry.address).toBeLessThanOrEqual(7);
      expect(sub, entry.address).toBeLessThanOrEqual(255);
      expect(seen.has(entry.address), `${entry.address} used by ${seen.get(entry.address)} and ${entry.name}`).toBe(false);
      seen.set(entry.address, entry.name);
    }
    const channelGas = project.circuits.flatMap((c) => [c.gaSwitch, c.gaValue, c.gaStatus]);
    expect(new Set(channelGas).size).toBe(channelGas.length);
  });

  it('has unique individual addresses across all devices', () => {
    const pas = project.physicalDevices.map((d) => d.pa);
    const dupes = pas.filter((pa, i) => pas.indexOf(pa) !== i);
    expect(dupes).toEqual([]);
  });

  it('every zone references real circuits, scenes only use zone circuits, night levels are 3–5 %', () => {
    const ids = new Set(project.circuits.map((c) => c.id));
    for (const zone of project.zones) {
      const zoneCircuits = new Set<string>(zone.circuits);
      expect(zone.scenes.length, zone.id).toBeGreaterThanOrEqual(3);
      for (const id of zone.circuits) expect(ids.has(id), `${zone.id}:${id}`).toBe(true);
      for (const scene of zone.scenes) {
        for (const id of Object.keys(scene.levels)) {
          expect(zoneCircuits.has(id), `${zone.id}/${scene.id}:${id}`).toBe(true);
        }
      }
      for (const [id, v] of Object.entries(zone.nightLevels)) {
        expect(zoneCircuits.has(id), `${zone.id} night ${id}`).toBe(true);
        expect(v, `${zone.id} night ${id}`).toBeGreaterThanOrEqual(3);
        expect(v, `${zone.id} night ${id}`).toBeLessThanOrEqual(5);
      }
    }
  });

  it('every circuit is in at least one zone and has a fitting type', () => {
    for (const c of project.circuits) {
      expect(project.zones.some((z) => z.circuits.includes(c.id)), c.id).toBe(true);
      expect(c.kind, c.id).toBeDefined();
    }
  });

  it('every zone has a switch gang and a presence detector next to its field', () => {
    for (const zone of project.zones) {
      expect(project.pushButtons.some((b) => b.gangs.some((g) => g.zoneId === zone.id)), zone.id).toBe(true);
      expect(project.presenceDetectors.some((d) => d.zoneId === zone.id), zone.id).toBe(true);
    }
    // Ceiling detectors sit inside their field; wall-mounted ones on its edge (≤ 0.6 m).
    for (const d of project.presenceDetectors) {
      expect(distanceToPolygonXZ(d.position.x, d.position.z, d.coverage.polygon), d.pa).toBeLessThanOrEqual(0.6);
    }
  });

  it('runs in the bus controller: every zone steps, goes full and night', () => {
    const knx = new KNXPropertyBusController(project);
    for (const zone of project.zones) {
      knx.handleZoneSwitchGesture(zone.id, 'up', 100);
      expect(knx.getZoneState(zone.id).mode, zone.id).toBe('scene');
      knx.handleZoneSwitchGesture(zone.id, 'up', 900);
      expect(knx.getZoneState(zone.id).mode, zone.id).toBe('full');
      knx.handleZoneSwitchGesture(zone.id, 'down', 900);
      expect(knx.getZoneState(zone.id).mode, zone.id).toBe('night');
    }
  });
});
