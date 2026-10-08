/**
 * Headless lighting-consistency check.
 *
 * Builds the Crox Farmhouse scene through the same code path as `PropertyScene` (content,
 * LOD, batching, cutaways, KNX circuit lighting — no WebGL), then drives the cutaway/LOD
 * controllers from 5 camera positions in each of the 3 floor modes and asserts that:
 *   1. Every light's effective intensity / colour / distance / active flag is identical in
 *      all 15 views (lighting is a pure function of KNX state + time of day).
 *   2. The number of active lights (NUM_POINT_LIGHTS etc.) never changes (no shader recompiles).
 *   3. Within a floor mode, the set of shadow casters seen by the shadow pass is identical for
 *      every camera position (camera never changes shadows).
 *   4. Light-group emissive intensities (fixture glow) never change with the camera.
 * Also verifies the fixed point-light budget only changes on explicit anchor changes.
 *
 * Usage: node tools/lighting/run.mjs   (exit code 1 on failure)
 */
import '../snapshot/env-setup.ts';
import * as THREE from 'three';
import { RoomLodController } from '../../src/engine/lod/lod-manager.ts';
import {
  buildPropertySceneContent,
  createPropertySceneLayers,
} from '../../src/engine/viewer/scene-content.ts';
import { createCroxFarmhouseSceneProfile } from '../../src/homes/crox-farmhouse/crox-property-scene.ts';
import { CutawayController } from '../../src/engine/cutaway/cutaway-controller.ts';
import { CircuitLightingController } from '../../src/engine/lighting/circuit-lighting.ts';
import { SceneBatchOptimizer } from '../../src/engine/rendering/scene-batch-optimizer.ts';
import type { CircuitId, CircuitLevels } from '../../src/core/types/knx.ts';
import type { FloorViewMode } from '../../src/core/types/scene.ts';

// TextureLoader would try to fetch an <img>; return an empty texture instead.
THREE.TextureLoader.prototype.load = function load(url: string): THREE.Texture {
  const tex = new THREE.Texture();
  tex.name = `__loaded:${url}`;
  return tex;
};

interface CameraCase {
  readonly name: string;
  readonly pos: THREE.Vector3;
  readonly target: THREE.Vector3;
  readonly isOrthographic: boolean;
  readonly orthoZoom: number;
}

const TARGET = new THREE.Vector3(0, 0.4, 0);
const CAMERA_CASES: readonly CameraCase[] = [
  { name: 'close-orbit', pos: new THREE.Vector3(4, 5, 6), target: TARGET, isOrthographic: false, orthoZoom: 1 },
  { name: 'mid-orbit', pos: new THREE.Vector3(10, 12, 14), target: TARGET, isOrthographic: false, orthoZoom: 1 },
  { name: 'far-orbit', pos: new THREE.Vector3(30, 34, 38), target: TARGET, isOrthographic: false, orthoZoom: 1 },
  { name: 'plan-zoomed-in', pos: new THREE.Vector3(0, 60, 0.01), target: TARGET, isOrthographic: true, orthoZoom: 2.5 },
  { name: 'plan-zoomed-out', pos: new THREE.Vector3(0, 60, 0.01), target: TARGET, isOrthographic: true, orthoZoom: 0.4 },
];
const FLOOR_MODES: readonly FloorViewMode[] = ['ground', 'first', 'all'];
const EPS = 1e-6;

function isVisibleInHierarchy(obj: THREE.Object3D): boolean {
  let cur: THREE.Object3D | null = obj;
  while (cur) {
    if (!cur.visible) return false;
    cur = cur.parent;
  }
  return true;
}

/** Invokes a shadow-pass hook callback the way WebGLShadowMap would (args unused by our hooks). */
function callHook(fn: THREE.Object3D['onBeforeShadow']): void {
  (fn as unknown as () => void)();
}

function main(): void {
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

  const cutaways = new CutawayController(layers, registry, lod);
  cutaways.collectDynamicCutawayWalls();
  const circuitLighting = new CircuitLightingController({
    lightGroups: content.lightGroups,
    indicatorMats: content.indicatorMats,
    roomSwitchLedMats: content.roomSwitchLedMats,
    switchLedRules: profile.switchLedRules,
    defaultFixtureAppearance: profile.defaultFixtureAppearance,
    fixtureAppearanceOverrides: profile.fixtureAppearanceOverrides,
    tvArtTextures: content.tvArtTextures,
    tvOffTexture: content.tvOffTexture,
  });
  const optimizer = new SceneBatchOptimizer({
    layers,
    lodController: lod,
    lightGroups: content.lightGroups,
    indicatorMats: content.indicatorMats,
    roomSwitchLedMats: content.roomSwitchLedMats,
    interactiveMeshes: content.interactiveMeshes,
    bifoldPanels: content.bifoldPanels,
    getDynamicObjects: () => {
      const dyn = new Set<THREE.Object3D>();
      for (const panel of content.bifoldPanels) panel.group.traverse((c) => dyn.add(c));
      content.interactions.collectDynamicObjects(dyn);
      return dyn;
    },
    onAfterBatchChange: () => cutaways.collectDynamicCutawayWalls(),
  });
  optimizer.optimize();

  // Deterministic KNX state: every circuit at a distinct dim level.
  const levels = {} as CircuitLevels;
  (Object.keys(content.lightGroups) as CircuitId[]).forEach((id, i) => {
    levels[id] = 20 + ((i * 37) % 81);
  });
  circuitLighting.setTimeOfDay('night');
  optimizer.setTimeOfDay('night');
  circuitLighting.applyLevels(levels);

  const allLights: THREE.Light[] = [];
  scene.traverse((o) => {
    if (o instanceof THREE.Light) allLights.push(o);
  });
  const emissiveMats = new Set<THREE.MeshStandardMaterial>();
  for (const grp of Object.values(content.lightGroups)) {
    for (const m of grp.emissives) emissiveMats.add(m);
  }
  const startHook = scene.children[0];
  const endHook = scene.children[scene.children.length - 1];
  const hooksInstalled =
    Boolean(startHook?.userData?.isShadowPassHook) && Boolean(endHook?.userData?.isShadowPassHook);
  if (!hooksInstalled) {
    console.warn('WARN: cutaway shadow-pass hooks are not the first/last scene children');
  }

  interface ViewSample {
    readonly label: string;
    readonly lights: readonly string[];
    readonly activeCounts: string;
    readonly emissives: readonly number[];
    readonly shadowCasters: ReadonlySet<THREE.Object3D>;
  }

  const sample = (label: string): ViewSample => {
    const lights = allLights.map((l) => {
      const active = isVisibleInHierarchy(l);
      const eff = active ? l.intensity : 0;
      const dist = l instanceof THREE.PointLight || l instanceof THREE.SpotLight ? l.distance : 0;
      return `${l.type}:${l.name || l.uuid.slice(0, 8)}:${active ? 1 : 0}:${eff.toFixed(6)}:${l.color.getHexString()}:${dist.toFixed(4)}`;
    });
    const counts = new Map<string, number>();
    for (const l of allLights) {
      if (isVisibleInHierarchy(l)) counts.set(l.type, (counts.get(l.type) ?? 0) + 1);
    }
    const activeCounts = [...counts.entries()].sort().map(([k, v]) => `${k}=${v}`).join(',');
    // Simulate a shadow pass: start hook reveals cutaway geometry, end hook restores it.
    if (hooksInstalled) callHook(startHook!.onBeforeShadow);
    const shadowCasters = new Set<THREE.Object3D>();
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh && o.castShadow && !o.userData?.isShadowPassHook && isVisibleInHierarchy(o)) {
        shadowCasters.add(o);
      }
    });
    if (hooksInstalled) callHook(endHook!.onAfterShadow);
    return {
      label,
      lights,
      activeCounts,
      emissives: [...emissiveMats].map((m) => m.emissiveIntensity),
      shadowCasters,
    };
  };

  const failures: string[] = [];
  const samples: ViewSample[] = [];
  for (const mode of FLOOR_MODES) {
    cutaways.setFloorViewMode(mode);
    const perMode: ViewSample[] = [];
    for (const cam of CAMERA_CASES) {
      cutaways.update({
        cameraPosition: cam.pos,
        target: cam.target,
        isOrthographic: cam.isOrthographic,
        orthoZoom: cam.orthoZoom,
      });
      optimizer.syncPointLightVisibilityAndDistance(cam.pos, layers.firstFloorMeshGroup.visible);
      optimizer.stepFades(1);
      const s = sample(`${mode}/${cam.name}`);
      perMode.push(s);
      samples.push(s);
    }
    const ref = perMode[0]!;
    for (const s of perMode.slice(1)) {
      if (s.shadowCasters.size !== ref.shadowCasters.size || [...s.shadowCasters].some((o) => !ref.shadowCasters.has(o))) {
        failures.push(`shadow casters differ: ${ref.label} (${ref.shadowCasters.size}) vs ${s.label} (${s.shadowCasters.size})`);
      }
    }
  }

  const ref = samples[0]!;
  for (const s of samples.slice(1)) {
    if (s.activeCounts !== ref.activeCounts) {
      failures.push(`active light counts differ: ${ref.label} [${ref.activeCounts}] vs ${s.label} [${s.activeCounts}]`);
    }
    for (let i = 0; i < ref.lights.length; i++) {
      if (ref.lights[i] !== s.lights[i]) {
        failures.push(`light differs: ${ref.label} ${ref.lights[i]} vs ${s.label} ${s.lights[i]}`);
      }
    }
    for (let i = 0; i < ref.emissives.length; i++) {
      if (Math.abs(ref.emissives[i]! - s.emissives[i]!) > EPS) {
        failures.push(`fixture emissive #${i} differs: ${ref.label} ${ref.emissives[i]} vs ${s.label} ${s.emissives[i]}`);
      }
    }
  }
  const casterCounts = FLOOR_MODES.map((m) => {
    const s = samples.find((x) => x.label.startsWith(`${m}/`));
    return `${m}=${s?.shadowCasters.size ?? 0}`;
  }).join(', ');

  // Light budget: only explicit anchor/budget changes move the active set; camera never does.
  const managed = optimizer.getManagedPointLights();
  if (managed.length > 4) {
    optimizer.setPointLightBudget(4);
    optimizer.setBudgetAnchorZone('kitchen');
    let steps = 0;
    while (optimizer.stepFades(1 / 60) && steps < 120) steps++;
    if (optimizer.hasPendingFades()) failures.push('budget fades did not settle within 2 s');
    if (steps < 10 || steps > 20) failures.push(`budget fade took ${steps} frames (expected ~15 @60fps)`);
    const lit = () => managed.map((e) => e.light.intensity.toFixed(6)).join('|');
    const before = lit();
    for (const cam of CAMERA_CASES) {
      cutaways.update({ cameraPosition: cam.pos, target: cam.target, isOrthographic: cam.isOrthographic, orthoZoom: cam.orthoZoom });
      optimizer.syncPointLightVisibilityAndDistance(cam.pos, layers.firstFloorMeshGroup.visible);
      optimizer.stepFades(1);
    }
    if (lit() !== before) failures.push('budgeted light set changed with camera position');
    optimizer.setPointLightBudget(Number.POSITIVE_INFINITY);
    while (optimizer.stepFades(1 / 60)) { /* settle */ }
  }

  console.log(`lights: ${allLights.length} (${ref.activeCounts}); managed point lights: ${managed.length}`);
  console.log(`views: ${samples.length} (${CAMERA_CASES.length} cameras x ${FLOOR_MODES.length} floor modes)`);
  console.log(`shadow casters per floor mode (info; geometry LOD may differ by floor): ${casterCounts}`);
  if (failures.length > 0) {
    console.error(`FAIL: ${failures.length} lighting inconsistencies`);
    for (const f of failures.slice(0, 40)) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log('PASS: lighting is camera / zoom / floor-mode independent');
}

main();
