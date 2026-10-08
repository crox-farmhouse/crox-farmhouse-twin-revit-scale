/**
 * Headless KNX lighting audit for the Crox Farmhouse twin.
 *
 * Builds the scene through the same code path as `PropertyScene` (no WebGL) and reports, per
 * room zone: KNX circuits with their bound 3D fittings (point lights / emissive materials /
 * glow pools), wall-switch gangs (PA, controlled zone, world position) and ceiling PIR sensors.
 * Fails (exit 1) when:
 *   - a circuit in `CIRCUITS` has no bound fitting (no light, emissive or pool),
 *   - a modelled zone has lighting circuits but no wall-switch gang or no motion sensor,
 *   - a switch mesh is missing its KNX userData (`switchPa`).
 *
 * Usage: node tools/knx/run.mjs [--verbose]
 */
import '../snapshot/env-setup.ts';
import * as THREE from 'three';
import { RoomLodController } from '../../src/engine/lod/lod-manager.ts';
import {
  buildPropertySceneContent,
  createPropertySceneLayers,
} from '../../src/engine/viewer/scene-content.ts';
import { createCroxFarmhouseSceneProfile } from '../../src/homes/crox-farmhouse/crox-property-scene.ts';
import { CIRCUITS } from '../../src/integrations/knx/constants.ts';
import { ROOM_ZONES } from '../../src/integrations/knx/topology.ts';
import type { CircuitId } from '../../src/core/types/knx.ts';
import type { InteractiveUserData } from '../../src/core/types/scene.ts';
import type { RoomZoneDefinition, RoomZoneId } from '../../src/core/types/topology.ts';

THREE.TextureLoader.prototype.load = function load(url: string): THREE.Texture {
  const tex = new THREE.Texture();
  tex.name = `__loaded:${url}`;
  return tex;
};

const verbose = process.argv.includes('--verbose');

const scene = new THREE.Scene();
const layers = createPropertySceneLayers(scene);
const profile = createCroxFarmhouseSceneProfile();
const registry = profile.createZoneRegistry();
const lod = new RoomLodController(profile.lodRegistrations);
const content = buildPropertySceneContent(layers, {
  profile,
  registry,
  lodController: lod,
  ceilingCutaway: true,
});
scene.updateMatrixWorld(true);

const problems: string[] = [];

function zoneAt(p: THREE.Vector3): RoomZoneId | 'none' {
  let best: RoomZoneDefinition | undefined;
  let bestVol = Infinity;
  for (const z of Object.values(ROOM_ZONES)) {
    if (!z) continue;
    const b = z.bounds;
    const inside =
      p.x >= b.minX &&
      p.x <= b.maxX &&
      p.y >= b.minY - 0.3 &&
      p.y <= b.maxY + 0.3 &&
      p.z >= b.minZ &&
      p.z <= b.maxZ;
    if (!inside) continue;
    const vol = (b.maxX - b.minX) * (b.maxY - b.minY) * (b.maxZ - b.minZ);
    if (z.isInterior && vol < bestVol) {
      best = z;
      bestVol = vol;
    } else if (!best && !z.isInterior) {
      best = z;
    }
  }
  return best?.id ?? 'none';
}

function fmt(p: THREE.Vector3): string {
  return `[${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)}]`;
}

// ---- Circuits → fittings -------------------------------------------------------------------
let pointLights = 0;
scene.traverse((o) => {
  if (o instanceof THREE.PointLight) pointLights++;
});

console.log(`PointLights in scene: ${pointLights}`);
console.log('');
console.log('== Circuits (L = point lights, E = emissive materials, P = glow pools)');
for (const c of CIRCUITS) {
  const g = content.lightGroups[c.id];
  const lights = g?.lights.length ?? 0;
  const em = g?.emissives.length ?? 0;
  const pools = g?.pools.length ?? 0;
  if (lights + em + pools === 0) problems.push(`circuit ${c.id} (${c.zoneId}) has no 3D fitting`);
  if (verbose || lights + em + pools === 0) {
    console.log(`  ${c.zoneId.padEnd(24)} ${c.id.padEnd(30)} L=${lights} E=${em} P=${pools}`);
  }
}

// ---- Switches & sensors ---------------------------------------------------------------------
interface UnitInfo {
  readonly name: string;
  readonly pos: THREE.Vector3;
  readonly zoneAt: RoomZoneId | 'none';
  readonly data: InteractiveUserData;
}
const switchUnits = new Map<string, UnitInfo>();
const sensorUnits = new Map<string, UnitInfo>();
for (const mesh of content.interactiveMeshes) {
  const data = mesh.userData as InteractiveUserData;
  const isSwitch =
    data.isKNXSwitch === true ||
    data.isCourtyardSwitch === true ||
    data.isUtilitySwitch === true ||
    data.zoneSceneSwitchZoneId !== undefined;
  const isSensor =
    data.roomMotionSensorId !== undefined ||
    data.isKitchenMotionSensor === true ||
    data.isUtilityMotionSensor === true;
  if (!isSwitch && !isSensor) continue;
  const unit = mesh.parent ?? mesh;
  const pos = new THREE.Vector3();
  unit.getWorldPosition(pos);
  const key = [
    unit.uuid,
    data.switchPa ?? '',
    data.zoneSceneSwitchZoneId ?? '',
    data.roomMotionSensorId ?? '',
    data.isKNXSwitch ? 'k' : '',
    data.isCourtyardSwitch ? 'c' : '',
    data.isUtilitySwitch ? 'u' : '',
  ].join('|');
  const info: UnitInfo = { name: unit.name || mesh.name, pos, zoneAt: zoneAt(pos), data };
  if (isSwitch) {
    if (!data.switchPa && !data.isKNXSwitch && !data.isCourtyardSwitch && !data.isUtilitySwitch) {
      problems.push(`switch mesh ${mesh.name} has no switchPa`);
    }
    switchUnits.set(key, info);
  } else {
    sensorUnits.set(key, info);
  }
}

const switchesByZone = new Map<string, UnitInfo[]>();
for (const u of switchUnits.values()) {
  const ctl =
    u.data.zoneSceneSwitchZoneId ??
    (u.data.isKNXSwitch
      ? 'kitchen'
      : u.data.isUtilitySwitch
        ? 'utility'
        : u.data.isCourtyardSwitch
          ? 'courtyard'
          : 'none');
  const list = switchesByZone.get(ctl) ?? [];
  list.push(u);
  switchesByZone.set(ctl, list);
}
const sensorsByZone = new Map<string, UnitInfo[]>();
for (const u of sensorUnits.values()) {
  const z =
    u.data.zoneId ??
    (u.data.isKitchenMotionSensor ? 'kitchen' : u.data.isUtilityMotionSensor ? 'utility' : u.zoneAt);
  const list = sensorsByZone.get(z) ?? [];
  list.push(u);
  sensorsByZone.set(z, list);
}

console.log('');
console.log('== Per zone: circuits / switch gangs controlling it / sensors');
for (const z of Object.values(ROOM_ZONES)) {
  if (!z) continue;
  const circuits = CIRCUITS.filter((c) => c.zoneId === z.id);
  const sws = switchesByZone.get(z.id) ?? [];
  const sns = sensorsByZone.get(z.id) ?? [];
  console.log(
    `  ${z.id.padEnd(24)} circuits=${circuits.length} switchGangs=${sws.length} sensors=${sns.length}`
  );
  if (verbose) {
    for (const s of sws) {
      console.log(
        `      SW ${s.name} pa=${s.data.switchPa ?? '-'} at ${fmt(s.pos)} in ${s.zoneAt} "${s.data.switchLocation ?? ''}"`
      );
    }
    for (const s of sns) {
      console.log(
        `      PIR ${s.name} id=${s.data.roomMotionSensorId ?? '-'} at ${fmt(s.pos)} in ${s.zoneAt}`
      );
    }
  }
  if (circuits.length > 0 && sws.length === 0) problems.push(`zone ${z.id} has no wall switch`);
  if (circuits.length > 0 && sns.length === 0) problems.push(`zone ${z.id} has no motion sensor`);
}
const orphan = switchesByZone.get('none') ?? [];
for (const s of orphan) problems.push(`switch ${s.name} controls no zone`);

const circuitIds = new Set<CircuitId>(CIRCUITS.map((c) => c.id));
for (const id of Object.keys(content.lightGroups) as CircuitId[]) {
  if (!circuitIds.has(id)) problems.push(`light group ${id} is not a KNX circuit`);
}

console.log('');
if (problems.length > 0) {
  console.log(`FAIL: ${problems.length} problem(s)`);
  for (const p of problems.slice(0, 80)) console.log(`  - ${p}`);
  process.exit(1);
}
console.log('PASS: every circuit has fittings; every lit zone has switches and motion sensors');
