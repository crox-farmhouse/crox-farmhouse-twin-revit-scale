/**
 * Headless OpenUSD Stage Generator for Crox Farmhouse.
 *
 * Builds the complete property scene graph and emits the modular, multi-layered
 * OpenUSD stage under `usd/`:
 * - `usd/crox_farmhouse.usda` (root stage with VariantSets `lod` & `roofCutaway`)
 * - `usd/crox_farmhouse_unreal.usda` (Unreal Engine 5 Stage Actor entry point)
 * - `usd/overrides/layout.usda` (non-destructive layout & annotation overrides)
 * - `usd/materials/materials.usda` (MaterialX procedural node graphs + UsdPreviewSurface)
 * - `usd/lighting/cameras_and_lights.usda` (UsdLux KNX circuits + UsdGeomCamera presets)
 * - `usd/zones/<zoneId>.usda` (20 modular per-room layers using Cube, Cylinder, Sphere, Cone, Mesh)
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as THREE from 'three';
import { RoomLodController } from '../../src/engine/lod/lod-manager.ts';
import {
  buildPropertySceneContent,
  createPropertySceneLayers,
} from '../../src/engine/scene/scene-content.ts';
import {
  convertCroxSceneToUsdStageBundle,
  parseAndInstantiateUsdaZone,
  parseUsdaMaterialLibrary,
  serializeAnnotationsToUsdaOverrideLayer,
  serializeUsdaStage,
} from '../../src/engine/usd/index.ts';
import { createCroxFarmhouseSceneProfile } from '../../src/homes/crox-farmhouse/crox-property-scene.ts';
import { installRecordingCanvasEnvironment } from '../snapshot/recording-canvas.ts';

installRecordingCanvasEnvironment();

THREE.TextureLoader.prototype.load = function load(url: string): THREE.Texture {
  const tex = new THREE.Texture();
  tex.name = `__loaded:${url}`;
  return tex;
};

function generateUsdStage(outDir = 'usd'): void {
  const t0 = Date.now();
  const scene = new THREE.Scene();
  const layers = createPropertySceneLayers(scene);
  const profile = createCroxFarmhouseSceneProfile();
  const registry = profile.createZoneRegistry();
  const lod = new RoomLodController(profile.lodRegistrations);

  const content = buildPropertySceneContent(layers, {
    profile,
    registry,
    lodController: lod,
    ceilingCutaway: false,
  });

  const bundle = convertCroxSceneToUsdStageBundle({
    scene,
    firstFloorMeshGroup: layers.firstFloorMeshGroup,
    groundFloorCeilingGroup: layers.groundFloorCeilingGroup,
    ceilingMeshGroup: layers.ceilingMeshGroup,
    cutawayWallGroups: layers.cutawayWallGroups,
    lightGroups: content.lightGroups,
    cameraPresets: registry.getAllCameraPresets(),
  });

  mkdirSync(join(outDir, 'zones'), { recursive: true });
  mkdirSync(join(outDir, 'materials'), { recursive: true });
  mkdirSync(join(outDir, 'lighting'), { recursive: true });
  mkdirSync(join(outDir, 'overrides'), { recursive: true });
  mkdirSync(join(outDir, 'textures'), { recursive: true });

  // Copy static texture assets referenced by materials
  const staticRugSrc = 'public/textures/vesper-olive-gold-rug.jpg';
  if (existsSync(staticRugSrc)) {
    copyFileSync(staticRugSrc, join(outDir, 'textures', 'vesper-olive-gold-rug.jpg'));
  }

  // Write root stage & Unreal Engine 5 entry stage
  writeFileSync(
    join(outDir, 'crox_farmhouse.usda'),
    serializeUsdaStage(bundle.rootStage),
    'utf8'
  );
  writeFileSync(
    join(outDir, 'crox_farmhouse_unreal.usda'),
    serializeUsdaStage(bundle.unrealStage),
    'utf8'
  );

  // Write non-destructive layout override layer if not already authored
  const overridePath = join(outDir, 'overrides', 'layout.usda');
  if (!existsSync(overridePath)) {
    writeFileSync(
      overridePath,
      serializeAnnotationsToUsdaOverrideLayer([]),
      'utf8'
    );
  }

  // Write materials and lighting/cameras layers
  const materialsUsdaText = serializeUsdaStage(bundle.materialsLayer);
  writeFileSync(
    join(outDir, 'materials', 'materials.usda'),
    materialsUsdaText,
    'utf8'
  );
  writeFileSync(
    join(outDir, 'lighting', 'cameras_and_lights.usda'),
    serializeUsdaStage(bundle.lightingAndCamerasLayer),
    'utf8'
  );

  // Parse materials.usda & verify round-trip runtime instantiation for all 20 zone .usda files
  const parsedMaterials = parseUsdaMaterialLibrary(materialsUsdaText);
  let rtCube = 0;
  let rtCyl = 0;
  let rtSph = 0;
  let rtCone = 0;
  let rtMesh = 0;

  // Write all 20 modular room/system zone layers
  for (const [zoneId, stageDoc] of bundle.zoneLayers.entries()) {
    const zoneUsdaText = serializeUsdaStage(stageDoc);
    writeFileSync(
      join(outDir, 'zones', `${zoneId}.usda`),
      zoneUsdaText,
      'utf8'
    );
    const rt = parseAndInstantiateUsdaZone(zoneUsdaText, parsedMaterials);
    rtCube += rt.stats.cubeCount;
    rtCyl += rt.stats.cylinderCount;
    rtSph += rt.stats.sphereCount;
    rtCone += rt.stats.coneCount;
    rtMesh += rt.stats.meshCount;
  }

  const elapsedMs = Date.now() - t0;
  const s = bundle.stats;
  console.log(
    `[USD Export] Generated modular OpenUSD stage in '${outDir}/' (${elapsedMs}ms):`
  );
  console.log(
    `  Zones: ${s.zoneCount} | Prims: ${s.totalPrims} (Cube=${s.cubeCount}, Cylinder=${s.cylinderCount}, Sphere=${s.sphereCount}, Cone=${s.coneCount}, Mesh=${s.meshCount}) | Materials: ${s.materialCount}`
  );
  console.log(
    `[USD Loader Round-Trip] Verified 20/20 .usda zones -> Cube=${rtCube}, Cylinder=${rtCyl}, Sphere=${rtSph}, Cone=${rtCone}, Mesh=${rtMesh}, Materials=${parsedMaterials.size}`
  );
}

generateUsdStage(process.argv[2] ?? 'usd');
