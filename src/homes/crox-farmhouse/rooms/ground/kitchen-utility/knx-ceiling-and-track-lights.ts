import * as THREE from 'three';
import type { CircuitId } from '../../../../../core/types/knx.ts';
import type { InteractiveUserData } from '../../../../../core/types/scene.ts';
import type { SceneBuilderContext } from '../../../../../engine/viewer/scene-types.ts';
import {
  createBraidedCableTexture,
  createCementTexture,
} from '../../../../../engine/textures/procedural-textures.ts';

function prepGeo<T extends THREE.BufferGeometry>(geo: T): T {
  geo.computeBoundingSphere();
  return geo;
}

function tagHighLod(obj: THREE.Object3D, maxDistance = 14): void {
  obj.userData.lodTier = 'high';
  obj.userData.lodMaxDistance = maxDistance;
}

function setInteractiveUserData(mesh: THREE.Object3D, data: InteractiveUserData): void {
  Object.assign(mesh.userData, data);
}

// ============================================================================
// Shared BufferGeometries for Kitchen & Utility Ceiling, Track & Outdoor Lights
// ============================================================================
const concreteProfilePoints: THREE.Vector2[] = [
  new THREE.Vector2(0.155, 0.0),
  new THREE.Vector2(0.153, 0.045),
  new THREE.Vector2(0.148, 0.095),
  new THREE.Vector2(0.138, 0.145),
  new THREE.Vector2(0.122, 0.19),
  new THREE.Vector2(0.098, 0.228),
  new THREE.Vector2(0.068, 0.254),
  new THREE.Vector2(0.042, 0.268),
  new THREE.Vector2(0.038, 0.295),
  new THREE.Vector2(0.012, 0.295),
];
const sharedConcreteShadeGeo = prepGeo(new THREE.LatheGeometry(concreteProfilePoints, 28));

const concreteInnerPoints: THREE.Vector2[] = [
  new THREE.Vector2(0.149, 0.002),
  new THREE.Vector2(0.144, 0.09),
  new THREE.Vector2(0.132, 0.14),
  new THREE.Vector2(0.114, 0.185),
  new THREE.Vector2(0.088, 0.222),
  new THREE.Vector2(0.035, 0.255),
];
const sharedConcreteInnerGeo = prepGeo(new THREE.LatheGeometry(concreteInnerPoints, 24));
const sharedIslandRoseGeo = prepGeo(new THREE.CylinderGeometry(0.058, 0.058, 0.028, 16));
const sharedIslandCordGripGeo = prepGeo(new THREE.CylinderGeometry(0.014, 0.018, 0.026, 12));
const sharedIslandBraidedCordGeo = prepGeo(new THREE.CylinderGeometry(0.0095, 0.0095, 0.4, 10));
const sharedIslandBulbGeo = prepGeo(new THREE.SphereGeometry(0.048, 14, 14));

const narrowGlassProfilePoints: THREE.Vector2[] = [
  new THREE.Vector2(0.078, 0.0),
  new THREE.Vector2(0.083, 0.045),
  new THREE.Vector2(0.085, 0.12),
  new THREE.Vector2(0.084, 0.21),
  new THREE.Vector2(0.079, 0.285),
  new THREE.Vector2(0.066, 0.335),
  new THREE.Vector2(0.046, 0.368),
  new THREE.Vector2(0.036, 0.39),
];
const sharedNarrowGlassShadeGeo = prepGeo(new THREE.LatheGeometry(narrowGlassProfilePoints, 20));
const sharedSittingRoseGeo = prepGeo(new THREE.CylinderGeometry(0.055, 0.055, 0.028, 12));
const sharedSittingCordGeo = prepGeo(new THREE.CylinderGeometry(0.007, 0.007, 3.0 - (1.78 + 0.43), 6));
const sharedSittingGalleryGeo = prepGeo(new THREE.CylinderGeometry(0.028, 0.042, 0.07, 12));
const sharedSittingSocketGeo = prepGeo(new THREE.CylinderGeometry(0.02, 0.022, 0.055, 10));
const sharedFilamentLoopGeo = prepGeo(new THREE.CylinderGeometry(0.0065, 0.0065, 0.125, 8));
const sharedFilamentBridgeGeo = prepGeo(new THREE.BoxGeometry(0.034, 0.0065, 0.0065));
const sharedLargeEdisonBulbGeo = prepGeo(new THREE.SphereGeometry(0.042, 14, 12));
const sharedBulbGlowHaloGeo = prepGeo(new THREE.SphereGeometry(0.068, 16, 12));

const sharedUplightBezelGeo = prepGeo(new THREE.CylinderGeometry(0.065, 0.065, 0.012, 16));
const sharedUplightLensGeo = prepGeo(new THREE.CylinderGeometry(0.046, 0.046, 0.014, 16));

const sharedSpotTrimGeo = prepGeo(new THREE.CylinderGeometry(0.065, 0.065, 0.02, 10));
const sharedSpotPuckGeo = prepGeo(new THREE.CylinderGeometry(0.045, 0.045, 0.022, 10));

const sharedPoleBaseCollarGeo = prepGeo(new THREE.CylinderGeometry(0.055, 0.075, 0.12, 10));
const sharedPatioPoleGeo = prepGeo(new THREE.CylinderGeometry(0.022, 0.032, 2.75, 10));
const sharedPoleFinialBallGeo = prepGeo(new THREE.SphereGeometry(0.036, 10, 10));
const sharedBarnAnchorGeo = prepGeo(new THREE.CylinderGeometry(0.024, 0.024, 0.06, 8));
const sharedFestoonSocketGeo = prepGeo(new THREE.CylinderGeometry(0.014, 0.016, 0.038, 8));
const sharedFestoonDropCordGeo = prepGeo(new THREE.CylinderGeometry(0.004, 0.004, 0.055, 6));
const sharedFestoonGlobeGeo = prepGeo(new THREE.SphereGeometry(0.034, 12, 10));

const sharedLampCollarGeo = prepGeo(new THREE.TorusGeometry(0.068, 0.016, 8, 16));
const sharedLampBarFinialGeo = prepGeo(new THREE.SphereGeometry(0.022, 8, 8));
const sharedLampCageRibGeo = prepGeo(new THREE.CylinderGeometry(0.008, 0.008, 0.46, 6));

export function buildFiveKNXLightingCircuits(ctx: SceneBuilderContext): void {
  const { scene, lightGroups, interactiveMeshes, cutawayWallGroups, interactions } = ctx;

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc99e5a,
    roughness: 0.26,
    metalness: 0.86,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const darkBronzeMat = new THREE.MeshStandardMaterial({
    color: 0x26292e,
    roughness: 0.4,
    metalness: 0.75,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const matteBlackMat = new THREE.MeshStandardMaterial({
    color: 0x15171a,
    roughness: 0.42,
    metalness: 0.35,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const braidedCableTex = createBraidedCableTexture();
  const braidedCableMat = new THREE.MeshStandardMaterial({
    map: braidedCableTex,
    roughness: 0.78,
    metalness: 0.04,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });

  // =========================================================================
  // CIRCUIT 1: Pendant Set 1 — 3 Concrete Pendants over Blue Island
  // =========================================================================
  const islandBulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff2d6,
    emissive: new THREE.Color(0xffaa44),
    emissiveIntensity: 2.5,
    roughness: 0.15,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  });
  const cementShadeTex = createCementTexture();
  const concreteShadeMat = new THREE.MeshStandardMaterial({
    map: cementShadeTex,
    bumpMap: cementShadeTex,
    bumpScale: 0.003,
    color: 0xd8d4cc,
    roughness: 0.88,
    metalness: 0.03,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
  });
  const concreteInnerGlowMat = new THREE.MeshStandardMaterial({
    color: 0xf5ebd6,
    emissive: new THREE.Color(0xffaa42),
    emissiveIntensity: 1.2,
    roughness: 0.65,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
  });
  lightGroups.islandPendants.emissives.push(islandBulbMat, concreteInnerGlowMat);

  const islandPendantXs = [-2.07, -0.92, 0.23] as const;
  for (let idx = 0; idx < islandPendantXs.length; idx++) {
    const px = islandPendantXs[idx];
    const pz = 0.14;
    const pName = `kitchen.lighting.islandPendant_${idx}`;
    const group = new THREE.Group();
    group.name = pName;
    group.position.set(px, 0, pz);

    // Matte Black Ceiling Rose + Black Cord Grip (mounted to Survey2Plan 2.54m flat ceiling soffit)
    const blackRose = new THREE.Mesh(sharedIslandRoseGeo, matteBlackMat);
    blackRose.name = `${pName}.ceilingRose`;
    blackRose.position.set(0, 2.526, 0);
    group.add(blackRose);

    const blackCordGrip = new THREE.Mesh(sharedIslandCordGripGeo, matteBlackMat);
    blackCordGrip.name = `${pName}.cordGrip`;
    blackCordGrip.position.set(0, 2.502, 0);
    tagHighLod(blackCordGrip);
    group.add(blackCordGrip);

    // Black & White Braided Fabric Cable
    const braidedCord = new THREE.Mesh(sharedIslandBraidedCordGeo, braidedCableMat);
    braidedCord.name = `${pName}.braidedCord`;
    braidedCord.position.set(0, 2.31, 0);
    group.add(braidedCord);

    // Taller cast-concrete bell-dome shade (rim at Y = 1.83m, top neck at Y = 2.125m)
    const concreteDome = new THREE.Mesh(sharedConcreteShadeGeo, concreteShadeMat);
    concreteDome.name = `${pName}.concreteShade`;
    concreteDome.position.set(0, 1.83, 0);
    concreteDome.castShadow = true;
    group.add(concreteDome);

    // Warm inner lining of the concrete shade
    const innerDome = new THREE.Mesh(sharedConcreteInnerGeo, concreteInnerGlowMat);
    innerDome.name = `${pName}.innerGlowLining`;
    innerDome.position.set(0, 1.83, 0);
    group.add(innerDome);

    const bulb = new THREE.Mesh(sharedIslandBulbGeo, islandBulbMat);
    bulb.name = `${pName}.bulb`;
    bulb.position.set(0, 1.91, 0);
    group.add(bulb);

    interactions.registerLightFixture(group, 'islandPendants');
    ctx.addGlowPool('islandPendants', px, 0.958, pz, 0.68, 0.42);
    scene.add(group);
  }

  const islandZoneLight = new THREE.PointLight(0xffb866, 8.5, 6.6, 1.4);
  islandZoneLight.name = 'kitchen.lighting.islandPendants.pointLight';
  islandZoneLight.position.set(-0.92, 1.82, 0.14);
  scene.add(islandZoneLight);
  lightGroups.islandPendants.lights.push(islandZoneLight);

  // =========================================================================
  // CIRCUIT 2: Pendant Set 2 — 2 Spaced-Apart Long, Narrow Clear Glass Pendants
  // =========================================================================
  const clearGlassShadeMat = new THREE.MeshStandardMaterial({
    color: 0xfff6e6,
    emissive: new THREE.Color(0xffa83b),
    emissiveIntensity: 0.9,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    roughness: 0.07,
    metalness: 0.16,
  });
  const vintageBulbEnvelopeMat = new THREE.MeshStandardMaterial({
    color: 0xffe4b0,
    emissive: new THREE.Color(0xffa528),
    emissiveIntensity: 3.2,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
    roughness: 0.12,
  });
  const filamentCoreMat = new THREE.MeshStandardMaterial({
    color: 0xfff8e2,
    emissive: new THREE.Color(0xffb838),
    emissiveIntensity: 5.5,
    roughness: 0.06,
  });
  const sittingBulbHaloMat = new THREE.MeshBasicMaterial({
    color: 0xffad3b,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  lightGroups.sittingPendants.emissives.push(
    clearGlassShadeMat,
    vintageBulbEnvelopeMat,
    filamentCoreMat
  );
  lightGroups.sittingPendants.cones.push(sittingBulbHaloMat);

  const sittingPendantXPositions = [2.8, 4.1] as const;
  const sittingPendantZ = 0.68;
  const shadeBaseY = 1.78;
  const galleryTopY = shadeBaseY + 0.43;
  const dropLen = 3.0 - galleryTopY;

  for (let idx = 0; idx < sittingPendantXPositions.length; idx++) {
    const spX = sittingPendantXPositions[idx];
    const pName = `kitchen.lighting.sittingPendant_${idx}`;
    const pGroup = new THREE.Group();
    pGroup.name = pName;
    pGroup.position.set(spX, 0, sittingPendantZ);

    const ceilingRose = new THREE.Mesh(sharedSittingRoseGeo, brassMat);
    ceilingRose.name = `${pName}.ceilingRose`;
    ceilingRose.position.set(0, 2.98, 0);
    pGroup.add(ceilingRose);

    const cord = new THREE.Mesh(sharedSittingCordGeo, darkBronzeMat);
    cord.name = `${pName}.suspensionCord`;
    cord.position.set(0, galleryTopY + dropLen / 2, 0);
    pGroup.add(cord);

    const galleryHolder = new THREE.Mesh(sharedSittingGalleryGeo, brassMat);
    galleryHolder.name = `${pName}.galleryHolder`;
    galleryHolder.position.set(0, shadeBaseY + 0.405, 0);
    pGroup.add(galleryHolder);

    const innerSocket = new THREE.Mesh(sharedSittingSocketGeo, brassMat);
    innerSocket.name = `${pName}.innerSocket`;
    innerSocket.position.set(0, shadeBaseY + 0.34, 0);
    tagHighLod(innerSocket);
    pGroup.add(innerSocket);

    const filamentXs = [-0.014, 0.0, 0.014] as const;
    for (let f = 0; f < filamentXs.length; f++) {
      const filamentLoop = new THREE.Mesh(sharedFilamentLoopGeo, filamentCoreMat);
      filamentLoop.name = `${pName}.filamentLoop_${f}`;
      filamentLoop.position.set(filamentXs[f], shadeBaseY + 0.22, 0);
      tagHighLod(filamentLoop);
      pGroup.add(filamentLoop);
    }
    const filamentBridge = new THREE.Mesh(sharedFilamentBridgeGeo, filamentCoreMat);
    filamentBridge.name = `${pName}.filamentBridge`;
    filamentBridge.position.set(0, shadeBaseY + 0.16, 0);
    tagHighLod(filamentBridge);
    pGroup.add(filamentBridge);

    const largeEdisonBulb = new THREE.Mesh(sharedLargeEdisonBulbGeo, vintageBulbEnvelopeMat);
    largeEdisonBulb.name = `${pName}.edisonBulbEnvelope`;
    largeEdisonBulb.scale.set(1, 2.2, 1);
    largeEdisonBulb.position.set(0, shadeBaseY + 0.22, 0);
    pGroup.add(largeEdisonBulb);

    const bulbGlowHalo = new THREE.Mesh(sharedBulbGlowHaloGeo, sittingBulbHaloMat);
    bulbGlowHalo.name = `${pName}.bulbGlowHalo`;
    bulbGlowHalo.scale.set(1.05, 1.85, 1.05);
    bulbGlowHalo.position.set(0, shadeBaseY + 0.21, 0);
    pGroup.add(bulbGlowHalo);

    const glassShade = new THREE.Mesh(sharedNarrowGlassShadeGeo, clearGlassShadeMat);
    glassShade.name = `${pName}.glassShade`;
    glassShade.position.set(0, shadeBaseY, 0);
    pGroup.add(glassShade);

    interactions.registerLightFixture(pGroup, 'sittingPendants');
    scene.add(pGroup);
    ctx.addGlowPool('sittingPendants', spX, 0.02, sittingPendantZ, 1.15, 0.52);
  }

  const pendantPointLight = new THREE.PointLight(0xffb250, 14.5, 7.6, 1.35);
  pendantPointLight.name = 'kitchen.lighting.sittingPendants.pointLight';
  pendantPointLight.position.set(3.45, shadeBaseY + 0.18, sittingPendantZ);
  scene.add(pendantPointLight);
  lightGroups.sittingPendants.lights.push(pendantPointLight);

  ctx.addGlowPool('sittingPendants', 3.45, 0.465, 0.82, 0.54, 0.58);

  // =========================================================================
  // CIRCUIT 3: 5 Inground Floor Uplights across the inside front of the 3.55x2.07m Bifolds
  // =========================================================================
  const uplightXPositions = [1.68, 2.3875, 3.095, 3.8025, 4.51] as const;
  const uplightZ = 1.86;

  const bezelMat = new THREE.MeshStandardMaterial({
    color: 0xb8bec6,
    roughness: 0.25,
    metalness: 0.88,
  });
  const uplightLensMat = new THREE.MeshStandardMaterial({
    color: 0xfff0d0,
    emissive: new THREE.Color(0xffaa38),
    emissiveIntensity: 3.0,
    roughness: 0.1,
  });

  lightGroups.bifoldUplights.emissives.push(uplightLensMat);

  for (let i = 0; i < uplightXPositions.length; i++) {
    const ux = uplightXPositions[i];
    const bezel = new THREE.Mesh(sharedUplightBezelGeo, bezelMat);
    bezel.name = `kitchen.lighting.bifoldUplight_${i}.bezel`;
    bezel.position.set(ux, 0.006, uplightZ);
    setInteractiveUserData(bezel, { circuitId: 'bifoldUplights' });
    interactiveMeshes.push(bezel);
    scene.add(bezel);

    const lens = new THREE.Mesh(sharedUplightLensGeo, uplightLensMat);
    lens.name = `kitchen.lighting.bifoldUplight_${i}.lens`;
    lens.position.set(ux, 0.007, uplightZ);
    setInteractiveUserData(lens, { circuitId: 'bifoldUplights' });
    interactiveMeshes.push(lens);
    scene.add(lens);

    ctx.addGlowPool('bifoldUplights', ux, 0.012, uplightZ, 0.48, 0.42);
    ctx.addGlowPool('bifoldUplights', ux, 2.085, 2.06, 0.52, 0.22, Math.PI / 2);
  }

  const bifoldGrazingLight = new THREE.PointLight(0xffb454, 7.8, 4.8, 1.4);
  bifoldGrazingLight.name = 'kitchen.lighting.bifoldUplights.pointLight';
  bifoldGrazingLight.position.set(3.095, 0.36, uplightZ);
  scene.add(bifoldGrazingLight);
  lightGroups.bifoldUplights.lights.push(bifoldGrazingLight);

  // =========================================================================
  // CIRCUIT 4: 10 Recessed Ceiling Spotlights in a 4 x 3 Kitchen Grid (in 2.54m flat soffit)
  // =========================================================================
  const spotEmissive = new THREE.MeshStandardMaterial({
    color: 0xfff6e5,
    emissive: new THREE.Color(0xffc570),
    emissiveIntensity: 2.5,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  const spotTrimMat = new THREE.MeshStandardMaterial({
    color: 0xeae6dc,
    roughness: 0.5,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  });
  lightGroups.spotlights.emissives.push(spotEmissive);

  const spotCoords: ReadonlyArray<readonly [number, number]> = [
    [-3.35, -1.25],
    [-1.73, -1.25],
    [-0.11, -1.25],
    [1.45, -1.25],
    [-3.35, 0.14],
    [1.45, 0.14],
    [-3.35, 1.18],
    [-1.73, 1.18],
    [-0.11, 1.18],
    [1.45, 1.18],
  ];

  for (let i = 0; i < spotCoords.length; i++) {
    const [sx, sz] = spotCoords[i];
    const trim = new THREE.Mesh(sharedSpotTrimGeo, spotTrimMat);
    trim.name = `kitchen.lighting.spotlight_${i}.trim`;
    trim.position.set(sx, 2.532, sz);
    interactions.registerLightFixture(trim, 'spotlights');
    scene.add(trim);

    const puck = new THREE.Mesh(sharedSpotPuckGeo, spotEmissive);
    puck.name = `kitchen.lighting.spotlight_${i}.puck`;
    puck.position.set(sx, 2.527, sz);
    interactions.registerLightFixture(puck, 'spotlights');
    scene.add(puck);

    ctx.addGlowPool('spotlights', sx, 0.012, sz, 0.9, 0.2);
  }

  const spotZoneLight = new THREE.PointLight(0xffe0b2, 7.5, 5.2, 1.3);
  spotZoneLight.name = 'kitchen.lighting.spotlights.pointLight';
  spotZoneLight.position.set(-1.15, 2.42, 0.14);
  scene.add(spotZoneLight);
  lightGroups.spotlights.lights.push(spotZoneLight);

  // =========================================================================
  // CIRCUIT 5: Under-Cabinet LED Strips (including the West Wall Wrap-Around)
  // =========================================================================
  const stripMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d6,
    emissive: new THREE.Color(0xffb14a),
    emissiveIntensity: 2.8,
  });
  lightGroups.underCabinet.emissives.push(stripMat);

  const strips: ReadonlyArray<{
    readonly name: string;
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly w: number;
    readonly d: number;
    readonly worktopY: number;
    readonly groupKey: 'north' | 'west' | 'scene';
  }> = [
    { name: 'kitchen.lighting.underCabinet.northWestStrip', x: -3.74, y: 1.51, z: -2.19, w: 0.54, d: 0.03, worktopY: 0.945, groupKey: 'north' },
    { name: 'kitchen.lighting.underCabinet.agaMantelStrip', x: -2.16, y: 1.885, z: -2.07, w: 1.35, d: 0.03, worktopY: 0.945, groupKey: 'north' },
    { name: 'kitchen.lighting.underCabinet.northMidStrip', x: -0.855, y: 1.885, z: -2.07, w: 1.1, d: 0.03, worktopY: 0.945, groupKey: 'north' },
    { name: 'kitchen.lighting.underCabinet.westWallStrip', x: -4.08, y: 1.51, z: -1.61, w: 0.03, d: 0.94, worktopY: 0.945, groupKey: 'west' },
    { name: 'kitchen.lighting.underCabinet.islandBarStrip', x: -0.48, y: 0.89, z: 0.54, w: 2.62, d: 0.03, worktopY: 0.012, groupKey: 'scene' },
  ];

  for (const st of strips) {
    const stripMesh = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(st.w, 0.016, st.d)),
      stripMat
    );
    stripMesh.name = st.name;
    stripMesh.position.set(st.x, st.y, st.z);
    interactions.registerLightFixture(stripMesh, 'underCabinet');
    if (st.groupKey === 'north') {
      cutawayWallGroups.north.add(stripMesh);
    } else if (st.groupKey === 'west') {
      cutawayWallGroups.west.add(stripMesh);
    } else {
      scene.add(stripMesh);
    }

    const radius = Math.max(st.w, st.d) * 0.52;
    ctx.addGlowPool('underCabinet', st.x + 0.05, st.worktopY, st.z + 0.05, radius, 0.38);
  }

  const underCabZoneLight = new THREE.PointLight(0xffb960, 5.5, 6.2, 1.4);
  underCabZoneLight.name = 'kitchen.lighting.underCabinet.pointLight';
  underCabZoneLight.position.set(-1.8, 1.78, -1.6);
  scene.add(underCabZoneLight);
  lightGroups.underCabinet.lights.push(underCabZoneLight);

  // =========================================================================
  // CIRCUIT 5B (Ch 9): Above-Cabinet Plinth Strip LEDs (GA 1/2/9)
  // =========================================================================
  const aboveCabChannelMat = new THREE.MeshStandardMaterial({
    color: 0xc2beb6,
    roughness: 0.36,
    metalness: 0.68,
  });
  const aboveCabStripMat = new THREE.MeshStandardMaterial({
    color: 0xfff4dc,
    emissive: new THREE.Color(0xffaf45),
    emissiveIntensity: 2.8,
    roughness: 0.22,
  });
  lightGroups.aboveCabinet.emissives.push(aboveCabStripMat);

  const aboveCabStrips: ReadonlyArray<{
    readonly name: string;
    readonly x: number;
    readonly baseY: number;
    readonly z: number;
    readonly w: number;
    readonly d: number;
    readonly groupKey: 'north' | 'west' | 'scene';
  }> = [
    { name: 'kitchen.lighting.aboveCabinet.westTallTowers', x: -3.79, baseY: 2.42, z: -0.31, w: 0.038, d: 1.56, groupKey: 'scene' },
    { name: 'kitchen.lighting.aboveCabinet.westStepBack', x: -3.935, baseY: 2.42, z: -1.09, w: 0.252, d: 0.038, groupKey: 'scene' },
    { name: 'kitchen.lighting.aboveCabinet.westUpperCupboards', x: -4.08, baseY: 2.42, z: -1.635, w: 0.038, d: 1.09, groupKey: 'west' },
    { name: 'kitchen.lighting.aboveCabinet.northWestUpperCupboard', x: -3.79, baseY: 2.42, z: -2.18, w: 0.58, d: 0.038, groupKey: 'north' },
    { name: 'kitchen.lighting.aboveCabinet.northPantryCupboard', x: 1.18, baseY: 2.42, z: -2.055, w: 0.9, d: 0.038, groupKey: 'scene' },
  ];

  for (const ast of aboveCabStrips) {
    const stripGroup = new THREE.Group();
    stripGroup.name = ast.name;
    stripGroup.position.set(ast.x, ast.baseY, ast.z);

    const aluChannel = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(ast.w + 0.008, 0.007, ast.d + 0.008)),
      aboveCabChannelMat
    );
    aluChannel.name = `${ast.name}.aluChannel`;
    aluChannel.position.set(0, 0.0065, 0);
    tagHighLod(aluChannel);
    stripGroup.add(aluChannel);

    const ledDiffuser = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(ast.w, 0.007, ast.d)),
      aboveCabStripMat
    );
    ledDiffuser.name = `${ast.name}.ledDiffuser`;
    ledDiffuser.position.set(0, 0.0115, 0);
    stripGroup.add(ledDiffuser);

    interactions.registerLightFixture(stripGroup, 'aboveCabinet');
    if (ast.groupKey === 'north') {
      cutawayWallGroups.north.add(stripGroup);
    } else if (ast.groupKey === 'west') {
      cutawayWallGroups.west.add(stripGroup);
    } else {
      scene.add(stripGroup);
    }

    const span = Math.max(ast.w, ast.d);
    ctx.addGlowPool('aboveCabinet', ast.x, ast.baseY + 0.016, ast.z, span * 0.48, 0.42);
    ctx.addGlowPool('aboveCabinet', ast.x, 2.528, ast.z, span * 0.62, 0.26, Math.PI / 2);
  }

  const aboveCabWestLight = new THREE.PointLight(0xffb658, 7.2, 5.8, 1.4);
  aboveCabWestLight.name = 'kitchen.lighting.aboveCabinet.pointLight';
  aboveCabWestLight.position.set(-2.2, 2.48, -1.25);
  scene.add(aboveCabWestLight);
  lightGroups.aboveCabinet.lights.push(aboveCabWestLight);

  // =========================================================================
  // CIRCUIT 6: 2 Utility Room Recessed Ceiling Spotlights (in 2.54m flat soffit)
  // =========================================================================
  const utilitySpotEmissive = new THREE.MeshStandardMaterial({
    color: 0xfff6e5,
    emissive: new THREE.Color(0xffc570),
    emissiveIntensity: 2.5,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  lightGroups.utilitySpotlights.emissives.push(utilitySpotEmissive);

  const utilitySpotCoords: ReadonlyArray<readonly [number, number]> = [
    [2.75, -1.45],
    [4.25, -1.45],
  ];

  for (let i = 0; i < utilitySpotCoords.length; i++) {
    const [ux, uz] = utilitySpotCoords[i];
    const trim = new THREE.Mesh(sharedSpotTrimGeo, spotTrimMat);
    trim.name = `utility.lighting.spotlight_${i}.trim`;
    trim.position.set(ux, 2.532, uz);
    interactions.registerLightFixture(trim, 'utilitySpotlights');
    scene.add(trim);

    const puck = new THREE.Mesh(sharedSpotPuckGeo, utilitySpotEmissive);
    puck.name = `utility.lighting.spotlight_${i}.puck`;
    puck.position.set(ux, 2.527, uz);
    interactions.registerLightFixture(puck, 'utilitySpotlights');
    scene.add(puck);

    ctx.addGlowPool('utilitySpotlights', ux, 0.012, uz, 0.85, 0.32);
  }

  ctx.addGlowPool('utilitySpotlights', 2.85, 0.945, -2.15, 0.68, 0.38);
  ctx.addGlowPool('utilitySpotlights', 4.25, 0.945, -2.15, 0.72, 0.38);

  const utilityZoneLight = new THREE.PointLight(0xffe0b2, 6.5, 4.6, 1.3);
  utilityZoneLight.name = 'utility.lighting.utilitySpotlights.pointLight';
  utilityZoneLight.position.set(3.5, 2.42, -1.45);
  scene.add(utilityZoneLight);
  lightGroups.utilitySpotlights.lights.push(utilityZoneLight);

  // =========================================================================
  // CIRCUIT 7: Outdoor Cobbled Courtyard Festoon Lighting (GA 1/2/7)
  // =========================================================================
  const castIronMat = new THREE.MeshStandardMaterial({
    color: 0x1b1e22,
    roughness: 0.48,
    metalness: 0.72,
  });
  const festoonCableMat = new THREE.MeshStandardMaterial({
    color: 0x141619,
    roughness: 0.75,
    metalness: 0.15,
  });
  const festoonBulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff1d0,
    emissive: new THREE.Color(0xffa434),
    emissiveIntensity: 2.8,
    roughness: 0.14,
  });
  lightGroups.courtyardFestoons.emissives.push(festoonBulbMat);

  const patioPoleZ = 7.0;
  const poleXs = [-1.85, 1.56, 4.82] as const;
  for (let i = 0; i < poleXs.length; i++) {
    const poleX = poleXs[i];
    const poleBaseCollar = new THREE.Mesh(sharedPoleBaseCollarGeo, castIronMat);
    poleBaseCollar.name = `kitchen.lighting.festoonPole_${i}.baseCollar`;
    poleBaseCollar.position.set(poleX, 0.06, patioPoleZ);
    scene.add(poleBaseCollar);

    const pole = new THREE.Mesh(sharedPatioPoleGeo, castIronMat);
    pole.name = `kitchen.lighting.festoonPole_${i}.shaft`;
    pole.position.set(poleX, 1.375, patioPoleZ);
    pole.castShadow = true;
    scene.add(pole);

    const finialBall = new THREE.Mesh(sharedPoleFinialBallGeo, brassMat);
    finialBall.name = `kitchen.lighting.festoonPole_${i}.finialBall`;
    finialBall.position.set(poleX, 2.78, patioPoleZ);
    tagHighLod(finialBall);
    scene.add(finialBall);
  }

  const anchorCoords = [
    [-4.13, 2.52, 2.26],
    [-1.85, 2.82, 12.28],
    [1.56, 2.82, 11.58],
    [4.82, 2.82, 10.88],
  ] as const;
  for (let i = 0; i < anchorCoords.length; i++) {
    const [bx, by, bz] = anchorCoords[i];
    const barnAnchor = new THREE.Mesh(sharedBarnAnchorGeo, castIronMat);
    barnAnchor.name = `kitchen.lighting.festoonAnchor_${i}`;
    barnAnchor.rotation.x = Math.PI / 2;
    barnAnchor.position.set(bx, by, bz);
    tagHighLod(barnAnchor);
    scene.add(barnAnchor);
  }

  const festoonSpans: ReadonlyArray<{
    readonly start: THREE.Vector3;
    readonly end: THREE.Vector3;
    readonly sag: number;
    readonly bulbCount: number;
  }> = [
    {
      start: new THREE.Vector3(1.56, 2.66, 2.28),
      end: new THREE.Vector3(1.56, 2.72, patioPoleZ),
      sag: 0.34,
      bulbCount: 7,
    },
    {
      start: new THREE.Vector3(4.82, 2.66, 2.28),
      end: new THREE.Vector3(4.82, 2.72, patioPoleZ),
      sag: 0.34,
      bulbCount: 7,
    },
    {
      start: new THREE.Vector3(1.56, 2.66, 2.28),
      end: new THREE.Vector3(4.82, 2.72, patioPoleZ),
      sag: 0.38,
      bulbCount: 8,
    },
    {
      start: new THREE.Vector3(-1.85, 2.72, patioPoleZ),
      end: new THREE.Vector3(1.56, 2.66, 2.28),
      sag: 0.38,
      bulbCount: 7,
    },
    {
      start: new THREE.Vector3(-1.85, 2.72, patioPoleZ),
      end: new THREE.Vector3(-1.85, 2.82, 12.28),
      sag: 0.36,
      bulbCount: 7,
    },
    {
      start: new THREE.Vector3(1.56, 2.72, patioPoleZ),
      end: new THREE.Vector3(1.56, 2.82, 11.58),
      sag: 0.34,
      bulbCount: 6,
    },
    {
      start: new THREE.Vector3(4.82, 2.72, patioPoleZ),
      end: new THREE.Vector3(4.82, 2.82, 10.88),
      sag: 0.32,
      bulbCount: 6,
    },
    {
      start: new THREE.Vector3(-1.85, 2.72, patioPoleZ),
      end: new THREE.Vector3(1.56, 2.82, 11.58),
      sag: 0.38,
      bulbCount: 7,
    },
    {
      start: new THREE.Vector3(1.56, 2.72, patioPoleZ),
      end: new THREE.Vector3(4.82, 2.82, 10.88),
      sag: 0.36,
      bulbCount: 7,
    },
    {
      start: new THREE.Vector3(-4.13, 2.52, 2.28),
      end: new THREE.Vector3(-1.85, 2.72, patioPoleZ),
      sag: 0.36,
      bulbCount: 7,
    },
    {
      start: new THREE.Vector3(-4.13, 2.52, 2.28),
      end: new THREE.Vector3(-4.024, 2.35, 6.3),
      sag: 0.3,
      bulbCount: 6,
    },
    {
      start: new THREE.Vector3(-1.85, 2.72, patioPoleZ),
      end: new THREE.Vector3(-4.024, 2.35, 6.3),
      sag: 0.24,
      bulbCount: 5,
    },
  ];

  for (let sIdx = 0; sIdx < festoonSpans.length; sIdx++) {
    const span = festoonSpans[sIdx];
    const spanPrefix = `kitchen.lighting.festoonSpan_${sIdx}`;
    const curvePoints: THREE.Vector3[] = [];
    const steps = 16;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const pt = new THREE.Vector3().lerpVectors(span.start, span.end, t);
      pt.y -= span.sag * 4 * t * (1 - t);
      curvePoints.push(pt);
    }
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const cableGeo = prepGeo(new THREE.TubeGeometry(curve, 20, 0.0065, 6, false));
    const cableMesh = new THREE.Mesh(cableGeo, festoonCableMat);
    cableMesh.name = `${spanPrefix}.catenaryCable`;
    setInteractiveUserData(cableMesh, { circuitId: 'courtyardFestoons' });
    interactiveMeshes.push(cableMesh);
    scene.add(cableMesh);

    for (let b = 1; b <= span.bulbCount; b++) {
      const t = b / (span.bulbCount + 1);
      const pt = curve.getPoint(t);

      const dropCord = new THREE.Mesh(sharedFestoonDropCordGeo, festoonCableMat);
      dropCord.name = `${spanPrefix}.bulb_${b}.dropCord`;
      dropCord.position.set(pt.x, pt.y - 0.027, pt.z);
      tagHighLod(dropCord);
      scene.add(dropCord);

      const socket = new THREE.Mesh(sharedFestoonSocketGeo, festoonCableMat);
      socket.name = `${spanPrefix}.bulb_${b}.socket`;
      socket.position.set(pt.x, pt.y - 0.058, pt.z);
      tagHighLod(socket);
      scene.add(socket);

      const globe = new THREE.Mesh(sharedFestoonGlobeGeo, festoonBulbMat);
      globe.name = `${spanPrefix}.bulb_${b}.globe`;
      globe.position.set(pt.x, pt.y - 0.092, pt.z);
      setInteractiveUserData(globe, { circuitId: 'courtyardFestoons' });
      interactiveMeshes.push(globe);
      scene.add(globe);

      if (b % 2 === 1) {
        ctx.addGlowPool('courtyardFestoons', pt.x, -0.008, pt.z, 0.78, 0.28);
      }
    }
  }

  const festoonFillLight = new THREE.PointLight(0xffad48, 9.5, 10.5, 1.35);
  festoonFillLight.name = 'kitchen.lighting.courtyardFestoons.pointLight';
  festoonFillLight.position.set(2.4, 2.4, 4.35);
  scene.add(festoonFillLight);
  lightGroups.courtyardFestoons.lights.push(festoonFillLight);

  // =========================================================================
  // CIRCUIT 8: Traditional Reclaimed Cast-Iron Victorian Lamp Post (GA 1/2/8)
  // =========================================================================
  const lampPostGroup = new THREE.Group();
  lampPostGroup.name = 'courtyard.reclaimedLampPost';
  const lampX = -4.024;
  const lampZ = 6.3;
  lampPostGroup.position.set(lampX, 0, lampZ);

  const agedCopperMat = new THREE.MeshStandardMaterial({
    color: 0x8f5e38,
    roughness: 0.36,
    metalness: 0.78,
  });
  const lanternGlassMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d8,
    emissive: new THREE.Color(0xffa030),
    emissiveIntensity: 0.75,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    roughness: 0.1,
    metalness: 0.18,
  });
  const lanternMantleMat = new THREE.MeshStandardMaterial({
    color: 0xfff8e2,
    emissive: new THREE.Color(0xff9e24),
    emissiveIntensity: 3.6,
    roughness: 0.1,
  });

  lightGroups.reclaimedLampPost.emissives.push(lanternGlassMat, lanternMantleMat);

  const plinthStep1 = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.18, 0.21, 0.14, 8)),
    castIronMat
  );
  plinthStep1.name = 'courtyard.reclaimedLampPost.plinthStep';
  plinthStep1.position.set(0, 0.07, 0);
  plinthStep1.castShadow = true;
  setInteractiveUserData(plinthStep1, { circuitId: 'reclaimedLampPost' });
  interactiveMeshes.push(plinthStep1);
  lampPostGroup.add(plinthStep1);

  const plinthBody = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.115, 0.155, 0.52, 8)),
    castIronMat
  );
  plinthBody.name = 'courtyard.reclaimedLampPost.plinthBody';
  plinthBody.position.set(0, 0.4, 0);
  plinthBody.castShadow = true;
  setInteractiveUserData(plinthBody, { circuitId: 'reclaimedLampPost' });
  interactiveMeshes.push(plinthBody);
  lampPostGroup.add(plinthBody);

  const ringYs = [0.68, 1.35, 2.22] as const;
  for (let i = 0; i < ringYs.length; i++) {
    const ringY = ringYs[i];
    const collar = new THREE.Mesh(
      sharedLampCollarGeo,
      ringY === 2.22 ? brassMat : castIronMat
    );
    collar.name = `courtyard.reclaimedLampPost.columnCollar_${i}`;
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, ringY, 0);
    tagHighLod(collar);
    lampPostGroup.add(collar);
  }

  const postColumn = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.044, 0.078, 1.68, 12)),
    castIronMat
  );
  postColumn.name = 'courtyard.reclaimedLampPost.columnShaft';
  postColumn.position.set(0, 1.5, 0);
  postColumn.castShadow = true;
  setInteractiveUserData(postColumn, { circuitId: 'reclaimedLampPost' });
  interactiveMeshes.push(postColumn);
  lampPostGroup.add(postColumn);

  const ladderBar = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.012, 0.012, 0.54, 8)),
    castIronMat
  );
  ladderBar.name = 'courtyard.reclaimedLampPost.ladderBar';
  ladderBar.rotation.z = Math.PI / 2;
  ladderBar.position.set(0, 2.16, 0);
  tagHighLod(ladderBar);
  lampPostGroup.add(ladderBar);

  for (const [side, sideTag] of [
    [-1, 'West'],
    [1, 'East'],
  ] as const) {
    const barFinial = new THREE.Mesh(sharedLampBarFinialGeo, brassMat);
    barFinial.name = `courtyard.reclaimedLampPost.ladderBarFinial${sideTag}`;
    barFinial.position.set(side * 0.275, 2.16, 0);
    tagHighLod(barFinial);
    lampPostGroup.add(barFinial);
  }

  const lanternBasePlate = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.24, 0.032, 0.24)),
    agedCopperMat
  );
  lanternBasePlate.name = 'courtyard.reclaimedLampPost.lanternBasePlate';
  lanternBasePlate.position.set(0, 2.35, 0);
  lampPostGroup.add(lanternBasePlate);

  const lanternGlassCage = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.195, 0.135, 0.44, 4)),
    lanternGlassMat
  );
  lanternGlassCage.name = 'courtyard.reclaimedLampPost.lanternGlassCage';
  lanternGlassCage.rotation.y = Math.PI / 4;
  lanternGlassCage.position.set(0, 2.59, 0);
  setInteractiveUserData(lanternGlassCage, { circuitId: 'reclaimedLampPost' });
  interactiveMeshes.push(lanternGlassCage);
  lampPostGroup.add(lanternGlassCage);

  let ribIdx = 0;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const rib = new THREE.Mesh(sharedLampCageRibGeo, castIronMat);
      rib.name = `courtyard.reclaimedLampPost.cageCornerRib_${ribIdx++}`;
      rib.position.set(sx * 0.118, 2.59, sz * 0.118);
      rib.rotation.z = -sx * 0.095;
      rib.rotation.x = sz * 0.095;
      tagHighLod(rib);
      lampPostGroup.add(rib);
    }
  }

  const mantleStem = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.012, 0.016, 0.12, 8)),
    brassMat
  );
  mantleStem.name = 'courtyard.reclaimedLampPost.mantleStem';
  mantleStem.position.set(0, 2.43, 0);
  tagHighLod(mantleStem);
  lampPostGroup.add(mantleStem);

  const mantleGlobe = new THREE.Mesh(
    prepGeo(new THREE.SphereGeometry(0.048, 14, 12)),
    lanternMantleMat
  );
  mantleGlobe.name = 'courtyard.reclaimedLampPost.mantleGlobe';
  mantleGlobe.scale.set(1, 1.45, 1);
  mantleGlobe.position.set(0, 2.56, 0);
  setInteractiveUserData(mantleGlobe, { circuitId: 'reclaimedLampPost' });
  interactiveMeshes.push(mantleGlobe);
  lampPostGroup.add(mantleGlobe);

  const hoodBrim = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.34, 0.025, 0.34)),
    agedCopperMat
  );
  hoodBrim.name = 'courtyard.reclaimedLampPost.hoodBrim';
  hoodBrim.position.set(0, 2.82, 0);
  lampPostGroup.add(hoodBrim);

  const hoodRoof = new THREE.Mesh(
    prepGeo(new THREE.ConeGeometry(0.235, 0.21, 4)),
    agedCopperMat
  );
  hoodRoof.name = 'courtyard.reclaimedLampPost.hoodRoof';
  hoodRoof.rotation.y = Math.PI / 4;
  hoodRoof.position.set(0, 2.935, 0);
  lampPostGroup.add(hoodRoof);

  const topFinialOrb = new THREE.Mesh(
    prepGeo(new THREE.SphereGeometry(0.028, 10, 10)),
    brassMat
  );
  topFinialOrb.name = 'courtyard.reclaimedLampPost.topFinialOrb';
  topFinialOrb.position.set(0, 3.06, 0);
  tagHighLod(topFinialOrb);
  lampPostGroup.add(topFinialOrb);

  const topFinialSpire = new THREE.Mesh(
    prepGeo(new THREE.ConeGeometry(0.014, 0.09, 8)),
    brassMat
  );
  topFinialSpire.name = 'courtyard.reclaimedLampPost.topFinialSpire';
  topFinialSpire.position.set(0, 3.12, 0);
  tagHighLod(topFinialSpire);
  lampPostGroup.add(topFinialSpire);

  interactions.registerLightFixture(lampPostGroup, 'reclaimedLampPost');
  scene.add(lampPostGroup);

  const lampPostLight = new THREE.PointLight(0xffaa3b, 9.0, 9.5, 1.3);
  lampPostLight.name = 'courtyard.reclaimedLampPost.pointLight';
  lampPostLight.position.set(lampX, 2.55, lampZ);
  scene.add(lampPostLight);
  lightGroups.reclaimedLampPost.lights.push(lampPostLight);

  ctx.addGlowPool('reclaimedLampPost', lampX, -0.006, lampZ, 1.65, 0.52);
}

export interface RoomCeilingPendantOptions {
  readonly circuitId: CircuitId;
  readonly x: number;
  readonly z: number;
  readonly ceilingY: number;
  readonly floorY?: number;
  readonly dropLength?: number;
  readonly style?: 'linenDrum' | 'brassLantern' | 'flutedGlass' | 'opalGlobe' | 'glassLantern';
  readonly addPointLight?: boolean;
  readonly pointLightIntensity?: number;
  readonly pointLightDistance?: number;
  readonly parentGroup?: THREE.Object3D;
}

export const sharedRoomBrassMat = new THREE.MeshStandardMaterial({
  color: 0xc59b58,
  roughness: 0.25,
  metalness: 0.88,
  transparent: true,
  opacity: 0.35,
  depthWrite: false,
});
export const sharedRoomCollarMat = new THREE.MeshStandardMaterial({
  color: 0x3a3228,
  roughness: 0.35,
  metalness: 0.78,
  transparent: true,
  opacity: 0.35,
  depthWrite: false,
});
const sharedBraidedCordMat = new THREE.MeshStandardMaterial({
  color: 0x26231f,
  roughness: 0.72,
  metalness: 0.12,
  transparent: true,
  opacity: 0.35,
  depthWrite: false,
});

const clearLanternGlassMat = new THREE.MeshStandardMaterial({
  color: 0xf4fbff,
  roughness: 0.04,
  metalness: 0.0,
  transparent: true,
  opacity: 0.16,
  depthWrite: false,
  side: THREE.DoubleSide,
});
const lanternCandleSleeveMat = new THREE.MeshStandardMaterial({
  color: 0xf3eee2,
  roughness: 0.55,
  transparent: true,
  opacity: 0.36,
  depthWrite: false,
});

// Shared geometries for RoomCeilingPendant
const sharedRoomRoseGeo = prepGeo(new THREE.CylinderGeometry(0.056, 0.062, 0.024, 16));
const sharedRoomCordGripGeo = prepGeo(new THREE.CylinderGeometry(0.012, 0.016, 0.024, 12));
const sharedRoomGalleryGeo = prepGeo(new THREE.CylinderGeometry(0.024, 0.036, 0.052, 12));
const sharedRoomBulbGeo = prepGeo(new THREE.SphereGeometry(0.044, 14, 12));
const sharedLinenDrumShadeGeo = prepGeo(
  new THREE.CylinderGeometry(0.145, 0.195, 0.21, 24, 1, true)
);
const sharedLinenTopRimGeo = prepGeo(new THREE.TorusGeometry(0.145, 0.0045, 8, 24));
const sharedLinenBottomRimGeo = prepGeo(new THREE.TorusGeometry(0.195, 0.0045, 8, 24));
const sharedBrassLanternGlassGeo = prepGeo(new THREE.CylinderGeometry(0.13, 0.105, 0.24, 6));
const sharedBrassLanternTopCrownGeo = prepGeo(
  new THREE.CylinderGeometry(0.04, 0.138, 0.055, 6)
);
const sharedBrassLanternBottomRingGeo = prepGeo(
  new THREE.CylinderGeometry(0.108, 0.095, 0.022, 6)
);
const sharedOpalGlobeGeo = prepGeo(new THREE.SphereGeometry(0.135, 20, 16));
const sharedFlutedBellShadeGeo = prepGeo(
  new THREE.CylinderGeometry(0.065, 0.155, 0.18, 20, 1, true)
);

const sharedGlassLanternCanopyGeo = prepGeo(
  new THREE.ConeGeometry(0.1 * Math.SQRT2 + 0.012, 0.075, 4, 1)
);
const sharedGlassLanternTopFrameGeo = prepGeo(
  new THREE.BoxGeometry(0.1 * 2 + 0.02, 0.014, 0.1 * 2 + 0.02)
);
const sharedGlassLanternTrayGeo = prepGeo(
  new THREE.BoxGeometry(0.1 * 2 + 0.026, 0.02, 0.1 * 2 + 0.026)
);
const sharedGlassLanternDropFinialGeo = prepGeo(new THREE.ConeGeometry(0.022, 0.06, 12));
const sharedGlassLanternPostGeo = prepGeo(new THREE.BoxGeometry(0.012, 0.27, 0.012));
const sharedGlassLanternPaneGeo = prepGeo(new THREE.PlaneGeometry(0.1 * 2 - 0.01, 0.27 - 0.01));

const cordLengthGeoCache = new Map<string, THREE.CylinderGeometry>();
function getRoomCordGeo(cordLen: number): THREE.CylinderGeometry {
  const key = cordLen.toFixed(4);
  const existing = cordLengthGeoCache.get(key);
  if (existing) return existing;
  const created = prepGeo(new THREE.CylinderGeometry(0.0065, 0.0065, cordLen, 8));
  cordLengthGeoCache.set(key, created);
  return created;
}

function buildGlassLanternCage(
  group: THREE.Group,
  pendantPrefix: string,
  shadeTopY: number,
  bulb: THREE.Mesh
): void {
  const half = 0.1;
  const cageTopY = shadeTopY - 0.07;
  const cageBotY = shadeTopY - 0.34;
  const cageMidY = (cageTopY + cageBotY) / 2;

  const canopy = new THREE.Mesh(sharedGlassLanternCanopyGeo, sharedRoomBrassMat);
  canopy.name = `${pendantPrefix}.lanternCanopy`;
  canopy.rotation.y = Math.PI / 4;
  canopy.position.set(0, cageTopY + 0.0375, 0);
  canopy.castShadow = true;
  group.add(canopy);

  const topFrame = new THREE.Mesh(sharedGlassLanternTopFrameGeo, sharedRoomBrassMat);
  topFrame.name = `${pendantPrefix}.lanternTopFrame`;
  topFrame.position.set(0, cageTopY - 0.004, 0);
  group.add(topFrame);

  const tray = new THREE.Mesh(sharedGlassLanternTrayGeo, sharedRoomBrassMat);
  tray.name = `${pendantPrefix}.lanternTray`;
  tray.position.set(0, cageBotY - 0.006, 0);
  tray.castShadow = true;
  group.add(tray);

  const dropFinial = new THREE.Mesh(sharedGlassLanternDropFinialGeo, sharedRoomBrassMat);
  dropFinial.name = `${pendantPrefix}.lanternDropFinial`;
  dropFinial.rotation.x = Math.PI;
  dropFinial.position.set(0, cageBotY - 0.046, 0);
  tagHighLod(dropFinial);
  group.add(dropFinial);

  const postCorners = [
    [half, half],
    [-half, half],
    [half, -half],
    [-half, -half],
  ] as const;
  for (let i = 0; i < postCorners.length; i++) {
    const [px, pz] = postCorners[i];
    const post = new THREE.Mesh(sharedGlassLanternPostGeo, sharedRoomBrassMat);
    post.name = `${pendantPrefix}.lanternCornerPost_${i}`;
    post.position.set(px, cageMidY, pz);
    post.castShadow = true;
    tagHighLod(post);
    group.add(post);
  }

  for (let k = 0; k < 4; k++) {
    const angle = (k * Math.PI) / 2;
    const pane = new THREE.Mesh(sharedGlassLanternPaneGeo, clearLanternGlassMat);
    pane.name = `${pendantPrefix}.lanternGlassPane_${k}`;
    pane.rotation.y = angle;
    pane.position.set(Math.sin(angle) * half, cageMidY, Math.cos(angle) * half);
    pane.renderOrder = 2;
    group.add(pane);
  }

  const sleeveTopY = bulb.position.y - 0.03;
  const sleeveH = sleeveTopY - (cageBotY + 0.004);
  const candleSleeve = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.014, 0.016, sleeveH, 12)),
    lanternCandleSleeveMat
  );
  candleSleeve.name = `${pendantPrefix}.candleSleeve`;
  candleSleeve.position.set(0, sleeveTopY - sleeveH / 2, 0);
  tagHighLod(candleSleeve);
  group.add(candleSleeve);

  bulb.scale.set(0.5, 0.9, 0.5);
}

let roomPendantCounter = 0;

/**
 * Builds an interactive 3D Period Ceiling Pendant Light in any Ground Floor or First Floor room
 * and binds its emissive bulb/shade and PointLight to the specified KNX `CircuitId`.
 */
export function buildRoomCeilingPendant(
  ctx: SceneBuilderContext,
  options: RoomCeilingPendantOptions
): THREE.Group {
  const {
    circuitId,
    x,
    z,
    ceilingY,
    floorY = 0,
    dropLength = 0.42,
    style = 'linenDrum',
    addPointLight = true,
    pointLightIntensity,
    pointLightDistance = 6.2,
    parentGroup,
  } = options;

  const domainPrefix = circuitId === 'utilitySpotlights' ? 'utility' : 'kitchen';
  const pendantPrefix = `${domainPrefix}.lighting.ceilingPendant.${circuitId}_${roomPendantCounter++}`;

  const targetParent = parentGroup ?? ctx.scene;
  const group = new THREE.Group();
  group.name = pendantPrefix;
  group.position.set(x, 0, z);

  const bulbEmissiveMat = new THREE.MeshStandardMaterial({
    color: 0xfff4dc,
    emissive: new THREE.Color(0xffad42),
    emissiveIntensity: 2.8,
    roughness: 0.14,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  });
  const shadeEmissiveMat = new THREE.MeshStandardMaterial({
    color: style === 'flutedGlass' || style === 'brassLantern' ? 0xfff7e8 : 0xf4ece0,
    emissive: new THREE.Color(0xffb44c),
    emissiveIntensity: style === 'flutedGlass' || style === 'brassLantern' ? 1.1 : 1.45,
    roughness: style === 'flutedGlass' || style === 'brassLantern' ? 0.12 : 0.68,
    metalness: style === 'flutedGlass' || style === 'brassLantern' ? 0.12 : 0.02,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  ctx.lightGroups[circuitId].emissives.push(bulbEmissiveMat, shadeEmissiveMat);

  // Antique brass ceiling rose + cord grip
  const ceilingRose = new THREE.Mesh(sharedRoomRoseGeo, sharedRoomBrassMat);
  ceilingRose.name = `${pendantPrefix}.ceilingRose`;
  ceilingRose.position.set(0, ceilingY - 0.012, 0);
  group.add(ceilingRose);

  const cordGrip = new THREE.Mesh(sharedRoomCordGripGeo, sharedRoomBrassMat);
  cordGrip.name = `${pendantPrefix}.cordGrip`;
  cordGrip.position.set(0, ceilingY - 0.03, 0);
  tagHighLod(cordGrip);
  group.add(cordGrip);

  // Braided silk suspension cord
  const shadeTopY = ceilingY - dropLength;
  const cordLen = Math.max(0.12, dropLength - 0.024);
  const cord = new THREE.Mesh(getRoomCordGeo(cordLen), sharedBraidedCordMat);
  cord.name = `${pendantPrefix}.suspensionCord`;
  cord.position.set(0, shadeTopY + cordLen * 0.5, 0);
  group.add(cord);

  // Brass lampholder gallery
  const gallery = new THREE.Mesh(sharedRoomGalleryGeo, sharedRoomBrassMat);
  gallery.name = `${pendantPrefix}.gallery`;
  gallery.position.set(0, shadeTopY, 0);
  group.add(gallery);

  const bulbY = shadeTopY - (style === 'glassLantern' ? 0.205 : 0.085);
  const bulb = new THREE.Mesh(sharedRoomBulbGeo, bulbEmissiveMat);
  bulb.name = `${pendantPrefix}.bulb`;
  bulb.position.set(0, bulbY, 0);
  group.add(bulb);

  if (style === 'linenDrum') {
    const drumShade = new THREE.Mesh(sharedLinenDrumShadeGeo, shadeEmissiveMat);
    drumShade.name = `${pendantPrefix}.linenDrumShade`;
    drumShade.position.set(0, bulbY, 0);
    drumShade.castShadow = true;
    group.add(drumShade);

    const topRim = new THREE.Mesh(sharedLinenTopRimGeo, sharedRoomBrassMat);
    topRim.name = `${pendantPrefix}.topRim`;
    topRim.rotation.x = Math.PI / 2;
    topRim.position.set(0, bulbY + 0.105, 0);
    tagHighLod(topRim);
    group.add(topRim);

    const bottomRim = new THREE.Mesh(sharedLinenBottomRimGeo, sharedRoomBrassMat);
    bottomRim.name = `${pendantPrefix}.bottomRim`;
    bottomRim.rotation.x = Math.PI / 2;
    bottomRim.position.set(0, bulbY - 0.105, 0);
    tagHighLod(bottomRim);
    group.add(bottomRim);
  } else if (style === 'brassLantern') {
    const lanternGlass = new THREE.Mesh(sharedBrassLanternGlassGeo, shadeEmissiveMat);
    lanternGlass.name = `${pendantPrefix}.brassLanternGlass`;
    lanternGlass.position.set(0, bulbY - 0.01, 0);
    group.add(lanternGlass);

    const topCrown = new THREE.Mesh(sharedBrassLanternTopCrownGeo, sharedRoomBrassMat);
    topCrown.name = `${pendantPrefix}.topCrown`;
    topCrown.position.set(0, bulbY + 0.13, 0);
    group.add(topCrown);

    const bottomRing = new THREE.Mesh(sharedBrassLanternBottomRingGeo, sharedRoomBrassMat);
    bottomRing.name = `${pendantPrefix}.bottomRing`;
    bottomRing.position.set(0, bulbY - 0.135, 0);
    tagHighLod(bottomRing);
    group.add(bottomRing);
  } else if (style === 'glassLantern') {
    buildGlassLanternCage(group, pendantPrefix, shadeTopY, bulb);
  } else if (style === 'opalGlobe') {
    const opalGlobe = new THREE.Mesh(sharedOpalGlobeGeo, shadeEmissiveMat);
    opalGlobe.name = `${pendantPrefix}.opalGlobeShade`;
    opalGlobe.position.set(0, bulbY - 0.015, 0);
    group.add(opalGlobe);
  } else {
    const bellShade = new THREE.Mesh(sharedFlutedBellShadeGeo, shadeEmissiveMat);
    bellShade.name = `${pendantPrefix}.flutedBellShade`;
    bellShade.position.set(0, bulbY, 0);
    group.add(bellShade);
  }

  if (addPointLight) {
    const pLight = new THREE.PointLight(
      0xffb866,
      pointLightIntensity ?? ctx.lightGroups[circuitId].maxIntensity,
      pointLightDistance,
      1.35
    );
    pLight.name = `${pendantPrefix}.pointLight`;
    pLight.position.set(x, bulbY - 0.04, z);
    targetParent.add(pLight);
    ctx.lightGroups[circuitId].lights.push(pLight);
  }

  ctx.addGlowPool(circuitId, x, floorY + 0.014, z, 1.15, 0.34);

  ctx.interactions.registerLightFixture(group, circuitId);
  targetParent.add(group);
  return group;
}
