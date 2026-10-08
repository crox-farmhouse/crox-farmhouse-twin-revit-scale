/**
 * Headless KNX lighting audit + docs generator for the Crox Farmhouse twin.
 *
 * Builds the scene through the same code path as `PropertyScene` (no WebGL) and checks the
 * KNX project (`CROX_KNX_PROJECT`) against the 3D model:
 *   - every circuit drives at least one bound 3D fitting (point light, emissive or glow pool),
 *     and every light group belongs to a KNX circuit,
 *   - every push-button in the project has a clickable mesh per gang with matching
 *     `switchPa` / `switchGang` / `zoneSceneSwitchZoneId`, and every switch mesh is in the project,
 *   - every presence detector has a mesh (`presenceDetectorPa`) and its mount point lies inside
 *     (ceiling) or on the edge of (wall, ≤ 0.6 m) its own coverage polygon,
 *   - every lighting zone has at least one switch gang and one presence detector.
 * Exit code 1 on any problem.
 *
 * Usage:
 *   node tools/knx/run.mjs [--verbose]       audit only
 *   node tools/knx/run.mjs --write-docs      also regenerate docs/KNX_LIGHTING.md and the
 *                                            ETS-style CSVs (docs/knx-group-addresses.csv,
 *                                            docs/knx-devices.csv)
 */
import '../snapshot/env-setup.ts';
import { writeFileSync } from 'node:fs';
import * as THREE from 'three';
import { RoomLodController } from '../../src/engine/lod/lod-manager.ts';
import {
  buildPropertySceneContent,
  createPropertySceneLayers,
} from '../../src/engine/viewer/scene-content.ts';
import { createCroxFarmhouseSceneProfile } from '../../src/homes/crox-farmhouse/crox-property-scene.ts';
import { CROX_KNX_PROJECT } from '../../src/homes/crox-farmhouse/knx/project.ts';
import { exportDeviceCsv, exportGroupAddressCsv } from '../../src/integrations/knx/ga-export.ts';
import { distanceToPolygonXZ } from '../../src/integrations/knx/motion-presence.ts';
import type { CircuitConfig, CircuitId } from '../../src/core/types/knx.ts';
import type { InteractiveUserData } from '../../src/core/types/scene.ts';

THREE.TextureLoader.prototype.load = function load(url: string): THREE.Texture {
  const tex = new THREE.Texture();
  tex.name = `__loaded:${url}`;
  return tex;
};

const verbose = process.argv.includes('--verbose');
const writeDocs = process.argv.includes('--write-docs');
const project = CROX_KNX_PROJECT;

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
const fmt = (p: THREE.Vector3): string => `(${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)})`;

// ---- Circuits → fittings ---------------------------------------------------------------------
let pointLights = 0;
const meshesByMaterial = new Map<THREE.Material, string[]>();
scene.traverse((o) => {
  if (o instanceof THREE.PointLight) pointLights++;
  if (o instanceof THREE.Mesh) {
    const mats: THREE.Material[] = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      const list = meshesByMaterial.get(m) ?? [];
      list.push(o.name || o.parent?.name || '(unnamed)');
      meshesByMaterial.set(m, list);
    }
  }
});

function summariseNames(names: readonly string[]): string {
  const counts = new Map<string, number>();
  for (const n of names) {
    const key = n.replace(/[._-]?\d+$/, '').replace(/\.\d+\./g, '.');
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([n, c]) => (c > 1 ? `${n} ×${c}` : n))
    .join('; ');
}

interface CircuitAudit {
  readonly circuit: CircuitConfig;
  readonly lights: number;
  readonly emissives: number;
  readonly pools: number;
  readonly fittings: string;
}

const circuitAudit: CircuitAudit[] = [];
for (const c of project.circuits) {
  const g = content.lightGroups[c.id];
  const lights = g?.lights.length ?? 0;
  const emissives = g?.emissives.length ?? 0;
  const pools = g?.pools.length ?? 0;
  const names: string[] = [];
  for (const m of g?.emissives ?? []) names.push(...(meshesByMaterial.get(m) ?? [m.name]));
  for (const l of g?.lights ?? []) names.push(l.name || 'PointLight');
  if (lights + emissives + pools === 0) problems.push(`circuit ${c.id} (${c.zoneId}) has no 3D fitting`);
  circuitAudit.push({ circuit: c, lights, emissives, pools, fittings: summariseNames(names) });
}
const circuitIds = new Set<CircuitId>(project.circuits.map((c) => c.id));
for (const id of Object.keys(content.lightGroups) as CircuitId[]) {
  if (!circuitIds.has(id)) problems.push(`light group ${id} is not a KNX circuit`);
}

// ---- Switch meshes ---------------------------------------------------------------------------
interface GangHit {
  readonly pa: string;
  readonly gang: number;
  readonly zoneId: string;
  readonly pos: THREE.Vector3;
}
const gangHits: GangHit[] = [];
const sensorMeshes = new Map<string, THREE.Vector3>();
for (const mesh of content.interactiveMeshes) {
  const data = mesh.userData as InteractiveUserData;
  const pos = new THREE.Vector3();
  (mesh.parent ?? mesh).getWorldPosition(pos);
  if (data.presenceDetectorPa) sensorMeshes.set(data.presenceDetectorPa, pos);
  const isSwitch = data.zoneSceneSwitchZoneId !== undefined || data.isKNXSwitch === true;
  if (!isSwitch) continue;
  if (!data.switchPa) {
    problems.push(`switch mesh ${mesh.name} has no switchPa`);
    continue;
  }
  gangHits.push({
    pa: data.switchPa,
    gang: data.switchGang ?? 1,
    zoneId: data.zoneSceneSwitchZoneId ?? 'kitchen',
    pos,
  });
}

const buttonPas = new Set(project.pushButtons.map((b) => b.pa));
for (const hit of gangHits) {
  if (!buttonPas.has(hit.pa)) problems.push(`switch mesh with PA ${hit.pa} is not in the KNX project`);
}
const buttonPos = new Map<string, THREE.Vector3>();
for (const b of project.pushButtons) {
  for (const g of b.gangs) {
    const hit = gangHits.find((h) => h.pa === b.pa && h.gang === g.gang);
    if (!hit) {
      problems.push(`push-button ${b.pa} gang ${g.gang} (${g.label}) has no mesh`);
    } else {
      if (hit.zoneId !== g.zoneId) {
        problems.push(`push-button ${b.pa} gang ${g.gang} mesh controls ${hit.zoneId}, project says ${g.zoneId}`);
      }
      buttonPos.set(b.pa, hit.pos);
    }
  }
}

// ---- Presence detectors ----------------------------------------------------------------------
for (const d of project.presenceDetectors) {
  if (!sensorMeshes.has(d.pa)) problems.push(`presence detector ${d.pa} (${d.name}) has no mesh`);
  if (distanceToPolygonXZ(d.position.x, d.position.z, d.coverage.polygon) > 0.6) {
    problems.push(`presence detector ${d.pa} mount point is > 0.6 m from its coverage polygon`);
  }
}

// ---- Zones -----------------------------------------------------------------------------------
interface ZoneAudit {
  readonly id: string;
  readonly name: string;
  readonly circuits: number;
  readonly scenes: number;
  readonly gangs: number;
  readonly plates: number;
  readonly sensors: number;
}
const zoneAudit: ZoneAudit[] = project.zones.map((z) => {
  const plates = project.pushButtons.filter((b) => b.gangs.some((g) => g.zoneId === z.id));
  const gangs = plates.reduce((n, b) => n + b.gangs.filter((g) => g.zoneId === z.id).length, 0);
  const sensors = project.presenceDetectors.filter((d) => d.zoneId === z.id).length;
  if (gangs === 0) problems.push(`zone ${z.id} has no switch gang`);
  if (sensors === 0) problems.push(`zone ${z.id} has no presence detector`);
  return { id: z.id, name: z.name, circuits: z.circuits.length, scenes: z.scenes.length, gangs, plates: plates.length, sensors };
});

// ---- Report ----------------------------------------------------------------------------------
console.log(`PointLights in scene: ${pointLights}`);
console.log(`Circuits ${project.circuits.length} · zones ${project.zones.length} · push-buttons ${project.pushButtons.length} (${gangHits.length} gang meshes) · presence detectors ${project.presenceDetectors.length}`);
console.log('');
console.log('zone                      circuits scenes plates gangs sensors');
for (const z of zoneAudit) {
  console.log(`  ${z.id.padEnd(24)} ${String(z.circuits).padStart(7)} ${String(z.scenes).padStart(6)} ${String(z.plates).padStart(6)} ${String(z.gangs).padStart(5)} ${String(z.sensors).padStart(7)}`);
}
if (verbose) {
  console.log('');
  for (const a of circuitAudit) {
    console.log(`  ${a.circuit.zoneId.padEnd(24)} ${a.circuit.id.padEnd(28)} L=${a.lights} E=${a.emissives} P=${a.pools}  ${a.fittings}`);
  }
}

if (writeDocs) {
  writeFileSync('docs/knx-group-addresses.csv', exportGroupAddressCsv(project));
  writeFileSync('docs/knx-devices.csv', exportDeviceCsv(project));
  writeFileSync('docs/KNX_LIGHTING.md', renderDoc(pointLights));
  console.log('\nWrote docs/KNX_LIGHTING.md, docs/knx-group-addresses.csv, docs/knx-devices.csv');
}

console.log('');
if (problems.length > 0) {
  console.log(`FAIL: ${problems.length} problem(s)`);
  for (const p of problems.slice(0, 120)) console.log(`  - ${p}`);
  process.exit(1);
}
console.log('PASS: every circuit has fittings; every switch gang and detector is modelled; every zone has switches and detectors');

// ---- Docs ------------------------------------------------------------------------------------
function renderDoc(pointLightCount: number): string {
  const L: string[] = [];
  const circuitById = new Map(project.circuits.map((c) => [c.id, c]));
  L.push('# KNX lighting — Crox Farmhouse');
  L.push('');
  L.push('<!-- Generated by `node tools/knx/run.mjs --write-docs` from src/homes/crox-farmhouse/knx/. Do not edit by hand. -->');
  L.push('');
  L.push('The KNX installation is described as an ETS-style project (`CROX_KNX_PROJECT`,');
  L.push('`src/homes/crox-farmhouse/knx/`) and run by the generic bus emulator');
  L.push('(`src/integrations/knx/emulator.ts`). Group-address and device lists:');
  L.push('[knx-group-addresses.csv](knx-group-addresses.csv) · [knx-devices.csv](knx-devices.csv).');
  L.push('');
  L.push('## Switch and presence behaviour (every zone)');
  L.push('');
  L.push('| Gesture on a Corston toggle gang | Result |');
  L.push('| --- | --- |');
  L.push('| Short flick ▲ | Next stored scene of that gang\'s zone (wraps; from off/night wakes into scene 1) |');
  L.push('| Short flick ▼ | Previous scene (from off/night wakes into the last scene) |');
  L.push('| Hold ▲ (≥ 600 ms) | Full brightness — every zone circuit 100 % |');
  L.push('| Hold ▼ (≥ 600 ms) | **Night mode** — zone night levels (3–5 %) when dark (< lux threshold), off in daylight |');
  L.push('');
  L.push(`Presence: each detector holds presence for ${project.defaultPresenceHoldTimeSec} s after the last movement (demo override 12 s via`);
  L.push('`setPresenceHoldTimeOverride`). A zone in night mode switches **fully off** when all its detectors are vacant and the');
  L.push('hold time has elapsed since night mode was entered; presence in an **off** zone after dark restores night mode.');
  L.push('Pressing any switch counts as presence in the room it is mounted in. Switched-only channels (5A lamp relays,');
  L.push('PIR relays, garage battens) treat any level > 0 as 100 %.');
  L.push('');
  L.push('## GA plan');
  L.push('');
  L.push('Main groups: 0 central · 1 house ground · 2 house first · 3 outbuildings · 4 HVAC · 5 exterior.');
  L.push('Middle groups: 1 switch (1.001) · 2 brightness (5.001) · 3 status (5.001) · 4 sensors (presence 1.018 at x/4/20+n, lux 9.004)');
  L.push('· 5 gates & media · 6 zone control (sub 4n scene 17.001, 4n+1 night 1.001, 4n+2 full/off 1.001, 4n+3 dim 3.007)');
  L.push('· 7 zone feedback (sub 2n scene status, 2n+1 on/off status), n = zone ordinal in its main group.');
  L.push('');
  L.push('## Summary per zone');
  L.push('');
  L.push(`Totals: ${project.circuits.length} circuits, ${project.zones.length} zones, ${project.pushButtons.length} push-button plates, ${project.presenceDetectors.length} presence detectors, ${pointLightCount} PointLights in the scene.`);
  L.push('');
  L.push('| Zone | Circuits | Scenes | Plates | Gangs | Detectors |');
  L.push('| --- | ---: | ---: | ---: | ---: | ---: |');
  for (const z of zoneAudit) L.push(`| ${z.name} (\`${z.id}\`) | ${z.circuits} | ${z.scenes} | ${z.plates} | ${z.gangs} | ${z.sensors} |`);
  L.push('');
  L.push('## Zones');
  for (const z of project.zones) {
    L.push('');
    L.push(`### ${z.name} (\`${z.id}\`)`);
    L.push('');
    L.push(`Zone GAs: scene ${z.ga.scene} · night ${z.ga.night} · full/off ${z.ga.full} · dim ${z.ga.dim} · scene status ${z.ga.sceneStatus} · status ${z.ga.status}`);
    L.push('');
    L.push('| Circuit | Type | Actuator / ch | GA value | Dimmable | Bound fittings (L lights · E emissives · P pools) |');
    L.push('| --- | --- | --- | --- | --- | --- |');
    for (const id of z.circuits) {
      const c = circuitById.get(id);
      const a = circuitAudit.find((x) => x.circuit.id === id);
      if (!c || !a) continue;
      L.push(`| ${c.shortName} (\`${c.id}\`) | ${c.kind ?? '-'} | ${c.actuatorPa} / ${c.channel} | ${c.gaValue} | ${c.dimmable === false ? 'switched' : 'yes'} | L${a.lights} E${a.emissives} P${a.pools} — ${a.fittings || '-'} |`);
    }
    L.push('');
    L.push('| # | Scene | Levels |');
    L.push('| ---: | --- | --- |');
    z.scenes.forEach((s, i) => {
      const lv = z.circuits
        .map((id) => `${circuitById.get(id)?.shortName ?? id} ${s.levels[id] ?? 0}%`)
        .join(', ');
      L.push(`| ${i + 1} | ${s.label} | ${lv} |`);
    });
    const night = Object.entries(z.nightLevels)
      .map(([id, v]) => `${circuitById.get(id as CircuitId)?.shortName ?? id} ${v}%`)
      .join(', ');
    L.push(`| — | Night mode | ${night || 'all off'} |`);
    L.push('');
    const plates = project.pushButtons.filter((b) => b.gangs.some((g) => g.zoneId === z.id));
    if (plates.length > 0) {
      L.push('| Switch PA | Plate | Location | Gangs | World position |');
      L.push('| --- | --- | --- | --- | --- |');
      for (const b of plates) {
        const p = buttonPos.get(b.pa);
        L.push(`| ${b.pa} | ${b.name} | ${b.location} | ${b.gangs.map((g) => `${g.gang}: ${g.label}`).join(' · ')} | ${p ? fmt(p) : 'not modelled'} |`);
      }
      L.push('');
    }
    const dets = project.presenceDetectors.filter((d) => d.zoneId === z.id);
    if (dets.length > 0) {
      L.push('| Detector PA | Name | Presence GA | Mount (world) | Hold |');
      L.push('| --- | --- | --- | --- | --- |');
      for (const d of dets) {
        L.push(`| ${d.pa} | ${d.name} | ${d.gaPresence} | (${d.position.x.toFixed(2)}, ${d.position.y.toFixed(2)}, ${d.position.z.toFixed(2)}) | ${d.params.holdTimeSec}s |`);
      }
    }
  }
  L.push('');
  L.push('## Walkthrough presence');
  L.push('');
  L.push('`MotionPresenceBridge` (`src/integrations/knx/motion-presence.ts`) maps a first-person foot position to the');
  L.push('detectors whose coverage (XZ polygon + height band) contains it and calls `reportPresence(pa)` on the emulator.');
  L.push('Wiring (app layer):');
  L.push('');
  L.push('```ts');
  L.push('const bridge = new MotionPresenceBridge(knx, knx.getPresenceDetectors());');
  L.push('createTwinRuntime({ ..., onWalkthroughPresence: (pos) => bridge.update(pos) });');
  L.push('```');
  L.push('');
  return `${L.join('\n')}\n`;
}
