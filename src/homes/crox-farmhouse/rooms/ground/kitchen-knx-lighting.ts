import * as THREE from 'three';
import type { CircuitId } from '../../../../types/knx.ts';
import type {
  CutawayWallDescriptor,
  InteractiveUserData,
  SceneBuilderContext,
} from '../../../../types/scene.ts';
import { createBraidedCableTexture, createCementTexture } from '../../../../engine/textures/procedural-textures.ts';
import { buildRoomKnxTempSensor } from '../../../../objects/fixtures/knx-temp-sensor.ts';

function setInteractiveUserData(mesh: THREE.Object3D, data: InteractiveUserData): void {
  mesh.userData = data;
}

export function buildFiveKNXLightingCircuits(ctx: SceneBuilderContext): void {
  const { scene, lightGroups, interactiveMeshes, cutawayWallGroups, interactions } = ctx;

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xc99e5a,
    roughness: 0.26,
    metalness: 0.86,
  });
  const darkBronzeMat = new THREE.MeshStandardMaterial({
    color: 0x26292e,
    roughness: 0.4,
    metalness: 0.75,
  });
  const matteBlackMat = new THREE.MeshStandardMaterial({
    color: 0x15171a,
    roughness: 0.42,
    metalness: 0.35,
  });
  const braidedCableTex = createBraidedCableTexture();
  const braidedCableMat = new THREE.MeshStandardMaterial({
    map: braidedCableTex,
    roughness: 0.78,
    metalness: 0.04,
  });

  // =========================================================================
  // CIRCUIT 1: Pendant Set 1 — 3 Concrete Pendants over Blue Island
  //            (Slightly longer bell-dome profile, not too narrow, with
  //             Black & White Braided Cable and Matte Black Ceiling Rose)
  // =========================================================================
  const islandBulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff2d6,
    emissive: new THREE.Color(0xffaa44),
    emissiveIntensity: 2.5,
    roughness: 0.15,
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
  });
  const concreteInnerGlowMat = new THREE.MeshStandardMaterial({
    color: 0xf5ebd6,
    emissive: new THREE.Color(0xffaa42),
    emissiveIntensity: 1.2,
    roughness: 0.65,
    side: THREE.BackSide,
  });
  lightGroups.islandPendants.emissives.push(islandBulbMat, concreteInnerGlowMat);

  // Smooth LatheGeometry profile for a taller, slightly longer concrete dome-bell shade (0.29m tall x 0.31m diameter)
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
  const concreteShadeGeo = new THREE.LatheGeometry(concreteProfilePoints, 28);

  const concreteInnerPoints: THREE.Vector2[] = [
    new THREE.Vector2(0.149, 0.002),
    new THREE.Vector2(0.144, 0.09),
    new THREE.Vector2(0.132, 0.14),
    new THREE.Vector2(0.114, 0.185),
    new THREE.Vector2(0.088, 0.222),
    new THREE.Vector2(0.035, 0.255),
  ];
  const concreteInnerGeo = new THREE.LatheGeometry(concreteInnerPoints, 24);

  for (const px of [-2.07, -0.92, 0.23]) {
    const pz = 0.14;
    const group = new THREE.Group();
    group.position.set(px, 0, pz);

    // Matte Black Ceiling Rose + Black Cord Grip
    const blackRose = new THREE.Mesh(
      new THREE.CylinderGeometry(0.058, 0.058, 0.028, 16),
      matteBlackMat
    );
    blackRose.position.set(0, 2.982, 0);
    group.add(blackRose);

    const blackCordGrip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.018, 0.026, 12),
      matteBlackMat
    );
    blackCordGrip.position.set(0, 2.958, 0);
    group.add(blackCordGrip);

    // Black & White Braided Fabric Cable
    const braidedCord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0095, 0.0095, 0.84, 10),
      braidedCableMat
    );
    braidedCord.position.set(0, 2.54, 0);
    group.add(braidedCord);

    // Taller cast-concrete bell-dome shade (rim at Y = 1.83m, top neck at Y = 2.125m)
    const concreteDome = new THREE.Mesh(concreteShadeGeo, concreteShadeMat);
    concreteDome.position.set(0, 1.83, 0);
    concreteDome.castShadow = true;
    group.add(concreteDome);

    // Warm inner lining of the concrete shade
    const innerDome = new THREE.Mesh(concreteInnerGeo, concreteInnerGlowMat);
    innerDome.position.set(0, 1.83, 0);
    group.add(innerDome);

    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.048, 14, 14), islandBulbMat);
    bulb.position.set(0, 1.91, 0);
    group.add(bulb);

    interactions.registerLightFixture(group, 'islandPendants');
    ctx.addGlowPool('islandPendants', px, 0.958, pz, 0.68, 0.42);
    scene.add(group);
  }

  const islandZoneLight = new THREE.PointLight(0xffb866, 8.5, 6.6, 1.4);
  islandZoneLight.position.set(-0.92, 1.82, 0.14);
  scene.add(islandZoneLight);
  lightGroups.islandPendants.lights.push(islandZoneLight);

  // =========================================================================
  // CIRCUIT 2: Pendant Set 2 — 2 Spaced-Apart Long, Narrow Clear Glass Pendants
  //            with Old-Fashioned Large Filament Bulbs over the Sitting Chairs
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
  // Additive warm golden-amber bloom core inside the clear glass shade so it is unmistakably obvious when ON vs OFF
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

  // Long, narrow hand-blown glass pendant profile (0.39m tall x 0.165m diameter -> >2.3:1 aspect ratio)
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
  const narrowGlassShadeGeo = new THREE.LatheGeometry(narrowGlassProfilePoints, 20);

  // 2 pendants spaced apart (X = +2.80m and X = +4.10m at Z = +0.68m) over the sitting area chairs
  const sittingPendantXPositions = [2.8, 4.1];
  const sittingPendantZ = 0.68;
  const shadeBaseY = 1.78; // Shade runs from Y = 1.78m to Y = 2.17m (0.39m tall!)

  for (const spX of sittingPendantXPositions) {
    const pGroup = new THREE.Group();
    pGroup.position.set(spX, 0, sittingPendantZ);

    const ceilingRose = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.028, 12),
      brassMat
    );
    ceilingRose.position.set(0, 2.98, 0);
    pGroup.add(ceilingRose);

    const galleryTopY = shadeBaseY + 0.43;
    const dropLen = 3.0 - galleryTopY;
    const cord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.007, 0.007, dropLen, 6),
      darkBronzeMat
    );
    cord.position.set(0, galleryTopY + dropLen / 2, 0);
    pGroup.add(cord);

    // Vintage aged-brass gallery holder at top of the long narrow glass shade
    const galleryHolder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.042, 0.07, 12),
      brassMat
    );
    galleryHolder.position.set(0, shadeBaseY + 0.405, 0);
    pGroup.add(galleryHolder);

    // Brass inner E27 lampholder socket inside top of glass shade
    const innerSocket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.022, 0.055, 10),
      brassMat
    );
    innerSocket.position.set(0, shadeBaseY + 0.34, 0);
    pGroup.add(innerSocket);

    // Long glowing vertical squirrel-cage tungsten filament loops inside the large bulb
    for (const fx of [-0.014, 0.0, 0.014]) {
      const filamentLoop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0065, 0.0065, 0.125, 8),
        filamentCoreMat
      );
      filamentLoop.position.set(fx, shadeBaseY + 0.22, 0);
      pGroup.add(filamentLoop);
    }
    const filamentBridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.034, 0.0065, 0.0065),
      filamentCoreMat
    );
    filamentBridge.position.set(0, shadeBaseY + 0.16, 0);
    pGroup.add(filamentBridge);

    // Old-fashioned large elongated vintage Edison bulb envelope inside the narrow glass shade
    const largeEdisonBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.042, 14, 12),
      vintageBulbEnvelopeMat
    );
    largeEdisonBulb.scale.set(1, 2.2, 1);
    largeEdisonBulb.position.set(0, shadeBaseY + 0.22, 0);
    pGroup.add(largeEdisonBulb);

    // Warm golden-amber additive bloom halo around the bulb inside the glass shade (fades to 0 when OFF!)
    const bulbGlowHalo = new THREE.Mesh(
      new THREE.SphereGeometry(0.068, 16, 12),
      sittingBulbHaloMat
    );
    bulbGlowHalo.scale.set(1.05, 1.85, 1.05);
    bulbGlowHalo.position.set(0, shadeBaseY + 0.21, 0);
    pGroup.add(bulbGlowHalo);

    // Long, narrow clear hand-blown glass shade
    const glassShade = new THREE.Mesh(narrowGlassShadeGeo, clearGlassShadeMat);
    glassShade.position.set(0, shadeBaseY, 0);
    pGroup.add(glassShade);

    interactions.registerLightFixture(pGroup, 'sittingPendants');
    scene.add(pGroup);
    ctx.addGlowPool('sittingPendants', spX, 0.02, sittingPendantZ, 1.15, 0.52);
  }

  // Single consolidated PointLight centered between the 2 Lounge / Sitting Area pendants
  const pendantPointLight = new THREE.PointLight(0xffb250, 14.5, 7.6, 1.35);
  pendantPointLight.position.set(3.45, shadeBaseY + 0.18, sittingPendantZ);
  scene.add(pendantPointLight);
  lightGroups.sittingPendants.lights.push(pendantPointLight);

  ctx.addGlowPool('sittingPendants', 3.45, 0.465, 0.82, 0.54, 0.58);

  // =========================================================================
  // CIRCUIT 3: 5 Inground Floor Uplights across the inside front of the Bifolds
  // =========================================================================
  const uplightXPositions = [1.88, 2.535, 3.19, 3.845, 4.5];
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

  const uplightBezelGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.012, 16);
  const uplightLensGeo = new THREE.CylinderGeometry(0.046, 0.046, 0.014, 16);

  for (const ux of uplightXPositions) {
    const bezel = new THREE.Mesh(uplightBezelGeo, bezelMat);
    bezel.position.set(ux, 0.006, uplightZ);
    setInteractiveUserData(bezel, { circuitId: 'bifoldUplights' });
    interactiveMeshes.push(bezel);
    scene.add(bezel);

    const lens = new THREE.Mesh(uplightLensGeo, uplightLensMat);
    lens.position.set(ux, 0.007, uplightZ);
    setInteractiveUserData(lens, { circuitId: 'bifoldUplights' });
    interactiveMeshes.push(lens);
    scene.add(lens);

    // Warm radial floor halo around each recessed uplight and soft wash on the oak mantle above
    ctx.addGlowPool('bifoldUplights', ux, 0.012, uplightZ, 0.48, 0.42);
    ctx.addGlowPool('bifoldUplights', ux, 2.475, 2.06, 0.52, 0.22, Math.PI / 2);
  }

  // Single consolidated grazing PointLight along the oak bifold frame & threshold
  const bifoldGrazingLight = new THREE.PointLight(0xffb454, 7.8, 4.8, 1.4);
  bifoldGrazingLight.position.set(3.19, 0.36, uplightZ);
  scene.add(bifoldGrazingLight);
  lightGroups.bifoldUplights.lights.push(bifoldGrazingLight);

  // =========================================================================
  // CIRCUIT 4: 10 Recessed Ceiling Spotlights in a 4 x 3 Kitchen Grid
  //            (2 center positions omitted where the Island Pendants hang)
  //            Semi-transparent when viewing through the ceiling cutaway!
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

  const spotTrimGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.02, 10);
  const spotPuckGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.022, 10);

  // 4 columns (X = -3.35, -1.73, -0.11, +1.45) x 3 rows (Z = -1.25, +0.14, +1.18)
  // with the 2 middle spots in the Z = +0.14 row omitted for the concrete island pendants
  const spotCoords: ReadonlyArray<readonly [number, number]> = [
    // Back row (4 spots along North kitchen worktop aisle)
    [-3.35, -1.25],
    [-1.73, -1.25],
    [-0.11, -1.25],
    [1.45, -1.25],
    // Center row (outer 2 spots only; center 2 omitted where the 3 island pendants hang)
    [-3.35, 0.14],
    [1.45, 0.14],
    // Front row (4 spots along South side of island)
    [-3.35, 1.18],
    [-1.73, 1.18],
    [-0.11, 1.18],
    [1.45, 1.18],
  ];

  for (const [sx, sz] of spotCoords) {
    const trim = new THREE.Mesh(spotTrimGeo, spotTrimMat);
    trim.position.set(sx, 2.98, sz);
    interactions.registerLightFixture(trim, 'spotlights');
    scene.add(trim);

    const puck = new THREE.Mesh(spotPuckGeo, spotEmissive);
    puck.position.set(sx, 2.975, sz);
    interactions.registerLightFixture(puck, 'spotlights');
    scene.add(puck);

    ctx.addGlowPool('spotlights', sx, 0.012, sz, 0.9, 0.2);
  }

  const spotZoneLight = new THREE.PointLight(0xffe0b2, 7.5, 5.2, 1.3);
  spotZoneLight.position.set(-1.15, 2.75, 0.14);
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
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly w: number;
    readonly d: number;
    readonly worktopY: number;
    readonly groupKey: 'north' | 'west' | 'scene';
  }> = [
    { x: -3.74, y: 1.51, z: -2.19, w: 0.54, d: 0.03, worktopY: 0.945, groupKey: 'north' },
    { x: -2.16, y: 1.885, z: -2.07, w: 1.35, d: 0.03, worktopY: 0.945, groupKey: 'north' },
    { x: -0.855, y: 1.885, z: -2.07, w: 1.1, d: 0.03, worktopY: 0.945, groupKey: 'north' },
    { x: -4.08, y: 1.51, z: -1.61, w: 0.03, d: 0.94, worktopY: 0.945, groupKey: 'west' },
    { x: -0.48, y: 0.89, z: 0.54, w: 2.62, d: 0.03, worktopY: 0.012, groupKey: 'scene' },
  ];

  for (const st of strips) {
    const stripMesh = new THREE.Mesh(new THREE.BoxGeometry(st.w, 0.016, st.d), stripMat);
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
  underCabZoneLight.position.set(-1.8, 1.78, -1.6);
  scene.add(underCabZoneLight);
  lightGroups.underCabinet.lights.push(underCabZoneLight);

  // =========================================================================
  // CIRCUIT 5B (Ch 9): Above-Cabinet Plinth Strip LEDs (GA 1/2/9)
  //            Inset inside the recessed void created by the hollow 4-tier
  //            cornice plinths above the kitchen cabinets (at baseY + 0.008m,
  //            recessed 7cm below the baseY + 0.078m top cornice rim!)
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
    readonly x: number;
    readonly baseY: number;
    readonly z: number;
    readonly w: number;
    readonly d: number;
    readonly groupKey: 'north' | 'west' | 'scene';
  }> = [
    // 1. West Wall Tall Integrated Fridge-Freezer & NEFF Oven Towers — forward along +X front cornice lip (Z = -1.09m..+0.47m)
    { x: -3.79, baseY: 2.42, z: -0.31, w: 0.038, d: 1.56, groupKey: 'scene' },
    // 2. Step-back connector along Z = -1.09m between the Tall Oven Tower and West Upper Cupboard
    { x: -3.935, baseY: 2.42, z: -1.09, w: 0.252, d: 0.038, groupKey: 'scene' },
    // 3. West Wall Upper Cupboards — forward along +X front cornice lip (Z = -2.18m..-1.09m)
    { x: -4.08, baseY: 2.42, z: -1.635, w: 0.038, d: 1.09, groupKey: 'west' },
    // 4. North-West Upper Cupboard — forward along +Z front cornice lip (X = -4.08m..-3.50m, meeting strip 3 at the L-corner!)
    { x: -3.79, baseY: 2.42, z: -2.18, w: 0.58, d: 0.038, groupKey: 'north' },
    // 5. North Countertop Bi-Fold Pantry Cupboard void — forward along +Z front cornice lip (centered at X = +1.18m)
    { x: 1.18, baseY: 2.42, z: -2.055, w: 0.9, d: 0.038, groupKey: 'scene' },
  ];

  for (const ast of aboveCabStrips) {
    const stripGroup = new THREE.Group();
    stripGroup.position.set(ast.x, ast.baseY, ast.z);

    // Anodized aluminum extrusion tray sitting inset on the floor of the cornice plinth void
    const aluChannel = new THREE.Mesh(
      new THREE.BoxGeometry(ast.w + 0.008, 0.007, ast.d + 0.008),
      aboveCabChannelMat
    );
    aluChannel.position.set(0, 0.0065, 0);
    stripGroup.add(aluChannel);

    // Glowing warm-white frosted polycarbonate LED diffuser strip inset inside the extrusion
    const ledDiffuser = new THREE.Mesh(
      new THREE.BoxGeometry(ast.w, 0.007, ast.d),
      aboveCabStripMat
    );
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
    // Warm glow pool inside the recessed cornice void tray
    ctx.addGlowPool('aboveCabinet', ast.x, ast.baseY + 0.016, ast.z, span * 0.48, 0.42);
    // Soft upward wash pool on the ceiling above the cabinet cornice
    ctx.addGlowPool('aboveCabinet', ast.x, 2.985, ast.z, span * 0.62, 0.26, Math.PI / 2);
  }

  // Single consolidated 3D PointLight for the Above-Cabinet Plinth Strip LEDs
  const aboveCabWestLight = new THREE.PointLight(0xffb658, 7.2, 5.8, 1.4);
  aboveCabWestLight.position.set(-2.2, 2.62, -1.25);
  scene.add(aboveCabWestLight);
  lightGroups.aboveCabinet.lights.push(aboveCabWestLight);

  // =========================================================================
  // CIRCUIT 6: 2 Utility Room Recessed Ceiling Spotlights (Independent Toggle + Master Off)
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

  for (const [ux, uz] of utilitySpotCoords) {
    const trim = new THREE.Mesh(spotTrimGeo, spotTrimMat);
    trim.position.set(ux, 2.98, uz);
    interactions.registerLightFixture(trim, 'utilitySpotlights');
    scene.add(trim);

    const puck = new THREE.Mesh(spotPuckGeo, utilitySpotEmissive);
    puck.position.set(ux, 2.975, uz);
    interactions.registerLightFixture(puck, 'utilitySpotlights');
    scene.add(puck);

    ctx.addGlowPool('utilitySpotlights', ux, 0.012, uz, 0.85, 0.32);
  }

  // Warm counter glow pools along the Utility Room marble worktop & sink
  ctx.addGlowPool('utilitySpotlights', 2.85, 0.945, -2.15, 0.68, 0.38);
  ctx.addGlowPool('utilitySpotlights', 4.25, 0.945, -2.15, 0.72, 0.38);

  // Dedicated 3D PointLight for the Utility Room so Ch 6 visibly illuminates/darkens the room
  const utilityZoneLight = new THREE.PointLight(0xffe0b2, 6.5, 4.6, 1.3);
  utilityZoneLight.position.set(3.5, 2.65, -1.45);
  scene.add(utilityZoneLight);
  lightGroups.utilitySpotlights.lights.push(utilityZoneLight);

  // =========================================================================
  // CIRCUIT 7: Outdoor Cobbled Courtyard Festoon Lighting (GA 1/2/7)
  //            Catenary Festoon Strings with Warm Vintage E27 Golf-Ball Bulbs
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

  // Wrought-iron festoon support poles rising from the outer South edge of the wider Limestone Slab Terrace (Z = +7.55m, Issue #6!)
  const patioPoleZ = 7.0;
  for (const poleX of [-1.85, 1.56, 4.82]) {
    const poleBaseCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.075, 0.12, 10),
      castIronMat
    );
    poleBaseCollar.position.set(poleX, 0.06, patioPoleZ);
    scene.add(poleBaseCollar);

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.032, 2.75, 10),
      castIronMat
    );
    pole.position.set(poleX, 1.375, patioPoleZ);
    pole.castShadow = true;
    scene.add(pole);

    const finialBall = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 10), brassMat);
    finialBall.position.set(poleX, 2.78, patioPoleZ);
    scene.add(finialBall);
  }

  // Wall anchor eye-bolts along the Barn & Stable North wall eaves (`z_ew = 12.28m, 11.58m, 10.88m`) where the festoon cables terminate (Issue #3)
  for (const [bx, by, bz] of [
    [-1.85, 2.82, 12.28],
    [1.56, 2.82, 11.58],
    [4.82, 2.82, 10.88],
  ] as const) {
    const barnAnchor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.024, 0.06, 8),
      castIronMat
    );
    barnAnchor.rotation.x = Math.PI / 2;
    barnAnchor.position.set(bx, by, bz);
    scene.add(barnAnchor);
  }

  // 9 catenary festoon spans crisscrossing from the Kitchen to the 3 patio poles AND from the patio poles over to the Barn (Issue #3!)
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
    // Issue #3 ("Have the festoons go over to the barn from these poles too"):
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
  ];

  const socketGeo = new THREE.CylinderGeometry(0.014, 0.016, 0.038, 8);
  const dropCordGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.055, 6);
  const festoonGlobeGeo = new THREE.SphereGeometry(0.034, 12, 10);

  for (const span of festoonSpans) {
    const curvePoints: THREE.Vector3[] = [];
    const steps = 16;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const pt = new THREE.Vector3().lerpVectors(span.start, span.end, t);
      pt.y -= span.sag * 4 * t * (1 - t);
      curvePoints.push(pt);
    }
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const cableGeo = new THREE.TubeGeometry(curve, 20, 0.0065, 6, false);
    const cableMesh = new THREE.Mesh(cableGeo, festoonCableMat);
    setInteractiveUserData(cableMesh, { circuitId: 'courtyardFestoons' });
    interactiveMeshes.push(cableMesh);
    scene.add(cableMesh);

    for (let b = 1; b <= span.bulbCount; b++) {
      const t = b / (span.bulbCount + 1);
      const pt = curve.getPoint(t);

      const dropCord = new THREE.Mesh(dropCordGeo, festoonCableMat);
      dropCord.position.set(pt.x, pt.y - 0.027, pt.z);
      scene.add(dropCord);

      const socket = new THREE.Mesh(socketGeo, festoonCableMat);
      socket.position.set(pt.x, pt.y - 0.058, pt.z);
      scene.add(socket);

      const globe = new THREE.Mesh(festoonGlobeGeo, festoonBulbMat);
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
  festoonFillLight.position.set(2.4, 2.4, 4.35);
  scene.add(festoonFillLight);
  lightGroups.courtyardFestoons.lights.push(festoonFillLight);

  // =========================================================================
  // CIRCUIT 8: Traditional Reclaimed Cast-Iron Victorian Lamp Post (GA 1/2/8)
  //            Standing on the SW corner of the Limestone Paving Slabs at X = -4.024m, Z = +6.30m (Issue #6)
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

  // Stepped octagonal cast-iron heritage plinth base (Y = 0..0.72m)
  const plinthStep1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.21, 0.14, 8),
    castIronMat
  );
  plinthStep1.position.set(0, 0.07, 0);
  plinthStep1.castShadow = true;
  setInteractiveUserData(plinthStep1, { circuitId: 'reclaimedLampPost' });
  interactiveMeshes.push(plinthStep1);
  lampPostGroup.add(plinthStep1);

  const plinthBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.115, 0.155, 0.52, 8),
    castIronMat
  );
  plinthBody.position.set(0, 0.4, 0);
  plinthBody.castShadow = true;
  setInteractiveUserData(plinthBody, { circuitId: 'reclaimedLampPost' });
  interactiveMeshes.push(plinthBody);
  lampPostGroup.add(plinthBody);

  // Decorative brass/iron mouldings along the column
  for (const ringY of [0.68, 1.35, 2.22]) {
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.068, 0.016, 8, 16),
      ringY === 2.22 ? brassMat : castIronMat
    );
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, ringY, 0);
    lampPostGroup.add(collar);
  }

  // Tapered fluted cast-iron column (Y = 0.66..2.32m)
  const postColumn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.044, 0.078, 1.68, 12),
    castIronMat
  );
  postColumn.position.set(0, 1.5, 0);
  postColumn.castShadow = true;
  setInteractiveUserData(postColumn, { circuitId: 'reclaimedLampPost' });
  interactiveMeshes.push(postColumn);
  lampPostGroup.add(postColumn);

  // Traditional Victorian ladder-rest crossbar at neck of column (Y = 2.16m)
  const ladderBar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.54, 8),
    castIronMat
  );
  ladderBar.rotation.z = Math.PI / 2;
  ladderBar.position.set(0, 2.16, 0);
  lampPostGroup.add(ladderBar);

  for (const side of [-1, 1]) {
    const barFinial = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), brassMat);
    barFinial.position.set(side * 0.275, 2.16, 0);
    lampPostGroup.add(barFinial);
  }

  // Lanternfrog / cradle bracket supporting the 4-sided Windsor lantern (Y = 2.34m)
  const lanternBasePlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.032, 0.24),
    agedCopperMat
  );
  lanternBasePlate.position.set(0, 2.35, 0);
  lampPostGroup.add(lanternBasePlate);

  // 4-sided tapered glass lantern enclosure (Y = 2.37..2.82m)
  const lanternGlassCage = new THREE.Mesh(
    new THREE.CylinderGeometry(0.195, 0.135, 0.44, 4),
    lanternGlassMat
  );
  lanternGlassCage.rotation.y = Math.PI / 4;
  lanternGlassCage.position.set(0, 2.59, 0);
  setInteractiveUserData(lanternGlassCage, { circuitId: 'reclaimedLampPost' });
  interactiveMeshes.push(lanternGlassCage);
  lampPostGroup.add(lanternGlassCage);

  // 4 corner cast-iron ribs on the Windsor lantern cage
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const rib = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 0.46, 6),
        castIronMat
      );
      rib.position.set(sx * 0.118, 2.59, sz * 0.118);
      rib.rotation.z = -sx * 0.095;
      rib.rotation.x = sz * 0.095;
      lampPostGroup.add(rib);
    }
  }

  // Glowing vintage gas-mantle / warm filament bulb inside the lantern
  const mantleStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.016, 0.12, 8),
    brassMat
  );
  mantleStem.position.set(0, 2.43, 0);
  lampPostGroup.add(mantleStem);

  const mantleGlobe = new THREE.Mesh(
    new THREE.SphereGeometry(0.048, 14, 12),
    lanternMantleMat
  );
  mantleGlobe.scale.set(1, 1.45, 1);
  mantleGlobe.position.set(0, 2.56, 0);
  setInteractiveUserData(mantleGlobe, { circuitId: 'reclaimedLampPost' });
  interactiveMeshes.push(mantleGlobe);
  lampPostGroup.add(mantleGlobe);

  // Tiered aged-copper Victorian pagoda hood & top finial spire (Y = 2.81..3.16m)
  const hoodBrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.025, 0.34),
    agedCopperMat
  );
  hoodBrim.position.set(0, 2.82, 0);
  lampPostGroup.add(hoodBrim);

  const hoodRoof = new THREE.Mesh(
    new THREE.ConeGeometry(0.235, 0.21, 4),
    agedCopperMat
  );
  hoodRoof.rotation.y = Math.PI / 4;
  hoodRoof.position.set(0, 2.935, 0);
  lampPostGroup.add(hoodRoof);

  const topFinialOrb = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), brassMat);
  topFinialOrb.position.set(0, 3.06, 0);
  lampPostGroup.add(topFinialOrb);

  const topFinialSpire = new THREE.Mesh(
    new THREE.ConeGeometry(0.014, 0.09, 8),
    brassMat
  );
  topFinialSpire.position.set(0, 3.12, 0);
  lampPostGroup.add(topFinialSpire);

  interactions.registerLightFixture(lampPostGroup, 'reclaimedLampPost');
  scene.add(lampPostGroup);

  const lampPostLight = new THREE.PointLight(0xffaa3b, 9.0, 9.5, 1.3);
  lampPostLight.position.set(lampX, 2.55, lampZ);
  scene.add(lampPostLight);
  lightGroups.reclaimedLampPost.lights.push(lampPostLight);

  ctx.addGlowPool('reclaimedLampPost', lampX, -0.006, lampZ, 1.65, 0.52);
}

function addCorstonToggleMechanismToPlate(
  parentGroup: THREE.Group,
  offsetX: number,
  halfPlateWidth: number,
  brassPlateMat: THREE.Material,
  darkBronzeMat: THREE.Material,
  ledMat: THREE.Material,
  userData: InteractiveUserData,
  interactiveMeshes: THREE.Object3D[]
): void {
  const upUserData: InteractiveUserData = { ...userData, switchDirection: 'up' };
  const downUserData: InteractiveUserData = { ...userData, switchDirection: 'down' };

  const upperHalfPlate = new THREE.Mesh(
    new THREE.BoxGeometry(halfPlateWidth, 0.039, 0.004),
    brassPlateMat
  );
  upperHalfPlate.position.set(offsetX, 0.0195, 0.006);
  setInteractiveUserData(upperHalfPlate, upUserData);
  interactiveMeshes.push(upperHalfPlate);
  parentGroup.add(upperHalfPlate);

  const lowerHalfPlate = new THREE.Mesh(
    new THREE.BoxGeometry(halfPlateWidth, 0.039, 0.004),
    brassPlateMat
  );
  lowerHalfPlate.position.set(offsetX, -0.0195, 0.006);
  setInteractiveUserData(lowerHalfPlate, downUserData);
  interactiveMeshes.push(lowerHalfPlate);
  parentGroup.add(lowerHalfPlate);

  const collarRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0115, 0.013, 0.007, 16),
    darkBronzeMat
  );
  collarRing.rotation.x = Math.PI / 2;
  collarRing.position.set(offsetX, 0, 0.0095);
  setInteractiveUserData(collarRing, upUserData);
  interactiveMeshes.push(collarRing);
  parentGroup.add(collarRing);

  const pivotDome = new THREE.Mesh(
    new THREE.SphereGeometry(0.0075, 10, 10),
    brassPlateMat
  );
  pivotDome.position.set(offsetX, 0, 0.012);
  setInteractiveUserData(pivotDome, upUserData);
  interactiveMeshes.push(pivotDome);
  parentGroup.add(pivotDome);

  const toggleLever = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0028, 0.0048, 0.026, 12),
    brassPlateMat
  );
  toggleLever.rotation.x = Math.PI / 2;
  toggleLever.position.set(offsetX, 0, 0.022);
  setInteractiveUserData(toggleLever, upUserData);
  interactiveMeshes.push(toggleLever);
  parentGroup.add(toggleLever);

  const leverTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.0034, 10, 10),
    brassPlateMat
  );
  leverTip.position.set(offsetX, 0, 0.035);
  setInteractiveUserData(leverTip, upUserData);
  interactiveMeshes.push(leverTip);
  parentGroup.add(leverTip);

  const led = new THREE.Mesh(new THREE.CylinderGeometry(0.0024, 0.0024, 0.002, 10), ledMat);
  led.rotation.x = Math.PI / 2;
  led.position.set(offsetX, 0.024, 0.0078);
  parentGroup.add(led);
}

function buildCorstonSingleToggleUnit(
  x: number,
  y: number,
  z: number,
  rotY: number,
  brassPlateMat: THREE.Material,
  darkBronzeMat: THREE.Material,
  ledMat: THREE.Material,
  userData: InteractiveUserData,
  interactiveMeshes: THREE.Object3D[]
): THREE.Group {
  const switchGroup = new THREE.Group();
  switchGroup.position.set(x, y, z);
  switchGroup.rotation.y = rotY;

  // Corston Architectural solid antique-brass bevelled single-gang faceplate (88mm x 88mm x 5mm)
  const backplate = new THREE.Mesh(
    new THREE.BoxGeometry(0.088, 0.088, 0.005),
    brassPlateMat
  );
  backplate.position.set(0, 0, 0.0025);
  switchGroup.add(backplate);

  addCorstonToggleMechanismToPlate(
    switchGroup,
    0,
    0.078,
    brassPlateMat,
    darkBronzeMat,
    ledMat,
    userData,
    interactiveMeshes
  );

  return switchGroup;
}

/**
 * Corston Architectural 2-Gang 2-Way Centre-Retractive Toggle Switch (146mm x 88mm)
 * Mounted on the Bifold Pier next to the South Courtyard Bifold Doors:
 * - Gang 1 (Left): Kitchen Scenes (S1 Cooking / S2 Dining / S3 Lounge + Hold Full/Off)
 * - Gang 2 (Right): Cobbled Courtyard Outdoor Lighting (Festoon String + Reclaimed Lamp Post)
 */
function buildCorstonDoubleToggleUnit(
  x: number,
  y: number,
  z: number,
  rotY: number,
  brassPlateMat: THREE.Material,
  darkBronzeMat: THREE.Material,
  leftLedMat: THREE.Material,
  rightLedMat: THREE.Material,
  leftUserData: InteractiveUserData,
  rightUserData: InteractiveUserData,
  interactiveMeshes: THREE.Object3D[]
): THREE.Group {
  const switchGroup = new THREE.Group();
  switchGroup.position.set(x, y, z);
  switchGroup.rotation.y = rotY;

  // Corston 2-gang solid antique-brass bevelled twin faceplate (146mm x 88mm x 5mm)
  const backplate = new THREE.Mesh(
    new THREE.BoxGeometry(0.146, 0.088, 0.005),
    brassPlateMat
  );
  backplate.position.set(0, 0, 0.0025);
  switchGroup.add(backplate);

  // Gang 1 (Left toggle at -0.032m): Kitchen Scene Toggle
  addCorstonToggleMechanismToPlate(
    switchGroup,
    -0.032,
    0.064,
    brassPlateMat,
    darkBronzeMat,
    leftLedMat,
    leftUserData,
    interactiveMeshes
  );

  // Gang 2 (Right toggle at +0.032m): Courtyard Outdoor Lighting Toggle
  addCorstonToggleMechanismToPlate(
    switchGroup,
    0.032,
    0.064,
    brassPlateMat,
    darkBronzeMat,
    rightLedMat,
    rightUserData,
    interactiveMeshes
  );

  return switchGroup;
}

export interface WallSwitchMaterials {
  readonly wallSwitchLedMat: THREE.MeshStandardMaterial;
  readonly courtyardSwitchLedMat: THREE.MeshStandardMaterial;
}

export function buildWallKNXSwitch(
  ctx: SceneBuilderContext
): WallSwitchMaterials {
  const { interactiveMeshes, cutawayWallGroups } = ctx;

  const corstonBrassMat = new THREE.MeshStandardMaterial({
    color: 0xc59b58,
    roughness: 0.25,
    metalness: 0.88,
  });
  const corstonCollarMat = new THREE.MeshStandardMaterial({
    color: 0x3a3228,
    roughness: 0.35,
    metalness: 0.78,
  });
  const wallSwitchLedMat = new THREE.MeshStandardMaterial({
    color: 0xffb84d,
    emissive: new THREE.Color(0xff9d2e),
    emissiveIntensity: 3.0,
  });
  const courtyardSwitchLedMat = new THREE.MeshStandardMaterial({
    color: 0xffb84d,
    emissive: new THREE.Color(0xff9d2e),
    emissiveIntensity: 3.0,
  });

  // 3 Corston 1-Gang 2-Way Toggle Switches around the Kitchen:
  //   1. Entrance (South Wall Pier just inside the Kitchen-Family Doorway at X = -4.12m, Z = +1.987m, facing North -Z)
  //   2. Left of the Cooker behind the Units (North Back Wall at X = -3.18m, Z = -2.497m, facing South +Z)
  //   4. Sitting Area (East Wall Pier in Sitting Area at X = +4.997m, Z = +1.82m, facing West -X)
  const singleGangSwitches: ReadonlyArray<{
    readonly x: number;
    readonly y: number;
    readonly z: number;
    readonly rotY: number;
    readonly label: string;
    readonly groupKey: 'southWest' | 'west' | 'north' | 'east';
  }> = [
    { x: -4.12, y: 1.28, z: 1.987, rotY: Math.PI, label: 'Entrance', groupKey: 'southWest' },
    { x: -3.18, y: 1.22, z: -2.497, rotY: 0, label: 'Left of AGA', groupKey: 'north' },
    { x: 4.997, y: 1.28, z: 1.82, rotY: -Math.PI / 2, label: 'Sitting Area', groupKey: 'east' },
  ];

  for (const sw of singleGangSwitches) {
    const unit = buildCorstonSingleToggleUnit(
      sw.x,
      sw.y,
      sw.z,
      sw.rotY,
      corstonBrassMat,
      corstonCollarMat,
      wallSwitchLedMat,
      { isKNXSwitch: true, switchLocation: sw.label },
      interactiveMeshes
    );
    cutawayWallGroups[sw.groupKey].add(unit);
  }

  // Switch #3 on the Wall Next to the Bifolds (South Bifold Left Pier at X = +1.25m, Z = +1.987m):
  // Corston 2-Gang 2-Way Centre-Retractive Toggle Switch
  //   - Gang 1 (Left): Kitchen Scenes (1.1.10)
  //   - Gang 2 (Right): Cobbled Courtyard Festoons & Reclaimed Lamp Post (1.1.14)
  const bifoldTwoGangUnit = buildCorstonDoubleToggleUnit(
    1.25,
    1.28,
    1.987,
    Math.PI,
    corstonBrassMat,
    corstonCollarMat,
    wallSwitchLedMat,
    courtyardSwitchLedMat,
    { isKNXSwitch: true, switchLocation: 'Bifold 2-Gang (G1 Kitchen)' },
    { isCourtyardSwitch: true, switchLocation: 'Bifold 2-Gang (G2 Courtyard)' },
    interactiveMeshes
  );
  cutawayWallGroups.southWest.add(bifoldTwoGangUnit);

  // Issue #5: Kitchen KNX Bus NTC Temperature Probe in the South-West Bifold Pier Switch Backbox ([1.231, 1.266, 1.979])
  buildRoomKnxTempSensor(ctx, {
    name: 'kitchen.knxTempSensor',
    zone: 'kitchen',
    ufhZoneId: 'ufhZone4',
    sensorPa: '1.1.10',
    sensorGa: '4/1/5',
    location: 'Kitchen — South Bifold Pier Switch Backbox',
    roomLabel: 'Kitchen',
    defaultTempC: 20.5,
    x: 1.25,
    y: 1.28,
    z: 1.987,
    facing: 'north',
    parentGroup: cutawayWallGroups.southWest,
  });

  return { wallSwitchLedMat, courtyardSwitchLedMat };
}

export function buildUtilityKNXSwitch(
  ctx: SceneBuilderContext
): THREE.MeshStandardMaterial {
  const { scene, interactiveMeshes } = ctx;

  const corstonBrassMat = new THREE.MeshStandardMaterial({
    color: 0xc59b58,
    roughness: 0.25,
    metalness: 0.88,
  });
  const corstonCollarMat = new THREE.MeshStandardMaterial({
    color: 0x3a3228,
    roughness: 0.35,
    metalness: 0.78,
  });
  const utilitySwitchLedMat = new THREE.MeshStandardMaterial({
    color: 0xffb84d,
    emissive: new THREE.Color(0xff9d2e),
    emissiveIntensity: 3.0,
  });

  // Matching Corston Single-Toggle Switch by the Utility Room doorway (X = +3.28m, Y = 1.28m) on both sides of the Z = -0.775m wall
  for (const side of [1, -1]) {
    const unit = buildCorstonSingleToggleUnit(
      3.28,
      1.28,
      -0.775 + side * 0.076,
      side === 1 ? 0 : Math.PI,
      corstonBrassMat,
      corstonCollarMat,
      utilitySwitchLedMat,
      { isUtilitySwitch: true, switchLocation: 'Utility Door' },
      interactiveMeshes
    );
    scene.add(unit);
  }

  return utilitySwitchLedMat;
}

export interface MotionSensorMaterials {
  readonly kitchenSensorLedMat: THREE.MeshStandardMaterial;
  readonly utilitySensorLedMat: THREE.MeshStandardMaterial;
}

export function buildKitchenAndUtilityMotionSensors(
  ctx: SceneBuilderContext
): MotionSensorMaterials {
  const { scene, interactiveMeshes } = ctx;

  const housingMat = new THREE.MeshStandardMaterial({
    color: 0xf4f2ec,
    roughness: 0.45,
    metalness: 0.05,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });
  const fresnelLensMat = new THREE.MeshStandardMaterial({
    color: 0xfafcff,
    roughness: 0.18,
    metalness: 0.1,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });
  const luxCellMat = new THREE.MeshStandardMaterial({
    color: 0x1e2631,
    roughness: 0.2,
    metalness: 0.6,
    transparent: true,
    opacity: 0.36,
    depthWrite: false,
  });

  const kitchenSensorLedMat = new THREE.MeshStandardMaterial({
    color: 0x4be07a,
    emissive: new THREE.Color(0x32c864),
    emissiveIntensity: 2.6,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const utilitySensorLedMat = new THREE.MeshStandardMaterial({
    color: 0x4be07a,
    emissive: new THREE.Color(0x32c864),
    emissiveIntensity: 2.6,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });

  const bezelGeo = new THREE.CylinderGeometry(0.062, 0.058, 0.018, 16);
  const domeGeo = new THREE.SphereGeometry(0.032, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55);
  const ledRingGeo = new THREE.TorusGeometry(0.038, 0.0035, 8, 20);
  const luxWindowGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.004, 10);

  const sensorConfigs: ReadonlyArray<{
    readonly x: number;
    readonly z: number;
    readonly ledMat: THREE.MeshStandardMaterial;
    readonly userData: InteractiveUserData;
  }> = [
    // Kitchen Ceiling PIR + Lux Sensor (PA 1.1.12) in main island/walkway circulation zone
    {
      x: 0.67,
      z: 0.65,
      ledMat: kitchenSensorLedMat,
      userData: { isKitchenMotionSensor: true },
    },
    // Utility Room Ceiling PIR + Lux Sensor (PA 1.1.13) centered between the 2 utility spots
    {
      x: 3.5,
      z: -1.45,
      ledMat: utilitySensorLedMat,
      userData: { isUtilityMotionSensor: true },
    },
  ];

  for (const cfg of sensorConfigs) {
    const group = new THREE.Group();
    group.position.set(cfg.x, 2.98, cfg.z);

    const bezel = new THREE.Mesh(bezelGeo, housingMat);
    setInteractiveUserData(bezel, cfg.userData);
    interactiveMeshes.push(bezel);
    group.add(bezel);

    const dome = new THREE.Mesh(domeGeo, fresnelLensMat);
    dome.rotation.x = Math.PI;
    dome.position.set(0, -0.006, 0);
    setInteractiveUserData(dome, cfg.userData);
    interactiveMeshes.push(dome);
    group.add(dome);

    const ledRing = new THREE.Mesh(ledRingGeo, cfg.ledMat);
    ledRing.rotation.x = Math.PI / 2;
    ledRing.position.set(0, -0.009, 0);
    setInteractiveUserData(ledRing, cfg.userData);
    interactiveMeshes.push(ledRing);
    group.add(ledRing);

    const luxWindow = new THREE.Mesh(luxWindowGeo, luxCellMat);
    luxWindow.position.set(0.046, -0.008, 0);
    group.add(luxWindow);

    scene.add(group);
  }

  // Utility Room Central Brass & Fluted-Glass Ceiling Pendant (wired to utilitySpotlights Ch 6)
  buildRoomCeilingPendant(ctx, {
    circuitId: 'utilitySpotlights',
    x: 3.5,
    z: -1.62,
    ceilingY: 2.98,
    floorY: 0.012,
    dropLength: 0.44,
    style: 'flutedGlass',
    addPointLight: false,
  });

  return { kitchenSensorLedMat, utilitySensorLedMat };
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

export interface RoomCorstonToggleSwitchOptions {
  readonly circuitId: CircuitId;
  readonly switchPa: string;
  readonly switchLocation?: string;
  readonly location?: string;
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly rotY?: number;
  readonly facing?: 'north' | 'south' | 'east' | 'west';
  readonly parentGroup?: THREE.Object3D;
  readonly cutawayWall?: CutawayWallDescriptor;
}

const sharedRoomBrassMat = new THREE.MeshStandardMaterial({
  color: 0xc59b58,
  roughness: 0.25,
  metalness: 0.88,
});
const sharedRoomCollarMat = new THREE.MeshStandardMaterial({
  color: 0x3a3228,
  roughness: 0.35,
  metalness: 0.78,
});
const sharedBraidedCordMat = new THREE.MeshStandardMaterial({
  color: 0x26231f,
  roughness: 0.72,
  metalness: 0.12,
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
});

/**
 * Square Victorian brass-and-clear-glass hall lantern: pyramid canopy, four corner posts, four clear
 * glass panes, a tray with a drop finial, and a candle-sleeve lampholder carrying the (already built)
 * bulb, which is reshaped into a candle lamp.
 */
function buildGlassLanternCage(group: THREE.Group, shadeTopY: number, bulb: THREE.Mesh): void {
  const half = 0.1;
  const cageTopY = shadeTopY - 0.07;
  const cageBotY = shadeTopY - 0.34;
  const cageH = cageTopY - cageBotY;
  const cageMidY = (cageTopY + cageBotY) / 2;

  const canopy = new THREE.Mesh(
    new THREE.ConeGeometry(half * Math.SQRT2 + 0.012, 0.075, 4, 1),
    sharedRoomBrassMat
  );
  canopy.rotation.y = Math.PI / 4;
  canopy.position.set(0, cageTopY + 0.0375, 0);
  canopy.castShadow = true;
  group.add(canopy);

  const topFrame = new THREE.Mesh(new THREE.BoxGeometry(half * 2 + 0.02, 0.014, half * 2 + 0.02), sharedRoomBrassMat);
  topFrame.position.set(0, cageTopY - 0.004, 0);
  group.add(topFrame);

  const tray = new THREE.Mesh(new THREE.BoxGeometry(half * 2 + 0.026, 0.02, half * 2 + 0.026), sharedRoomBrassMat);
  tray.position.set(0, cageBotY - 0.006, 0);
  tray.castShadow = true;
  group.add(tray);

  const dropFinial = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.06, 12), sharedRoomBrassMat);
  dropFinial.rotation.x = Math.PI;
  dropFinial.position.set(0, cageBotY - 0.046, 0);
  group.add(dropFinial);

  const postGeo = new THREE.BoxGeometry(0.012, cageH, 0.012);
  for (const [px, pz] of [[half, half], [-half, half], [half, -half], [-half, -half]] as const) {
    const post = new THREE.Mesh(postGeo, sharedRoomBrassMat);
    post.position.set(px, cageMidY, pz);
    post.castShadow = true;
    group.add(post);
  }

  const paneGeo = new THREE.PlaneGeometry(half * 2 - 0.01, cageH - 0.01);
  for (let k = 0; k < 4; k++) {
    const angle = (k * Math.PI) / 2;
    const pane = new THREE.Mesh(paneGeo, clearLanternGlassMat);
    pane.rotation.y = angle;
    pane.position.set(Math.sin(angle) * half, cageMidY, Math.cos(angle) * half);
    pane.renderOrder = 2;
    group.add(pane);
  }

  // Candle sleeve standing on the tray, carrying the candle lamp in the centre of the cage.
  const sleeveTopY = bulb.position.y - 0.03;
  const sleeveH = sleeveTopY - (cageBotY + 0.004);
  const candleSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.016, sleeveH, 12), lanternCandleSleeveMat);
  candleSleeve.position.set(0, sleeveTopY - sleeveH / 2, 0);
  group.add(candleSleeve);

  bulb.scale.set(0.5, 0.9, 0.5);
}

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

  const targetParent = parentGroup ?? ctx.scene;
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const bulbEmissiveMat = new THREE.MeshStandardMaterial({
    color: 0xfff4dc,
    emissive: new THREE.Color(0xffad42),
    emissiveIntensity: 2.8,
    roughness: 0.14,
  });
  const shadeEmissiveMat = new THREE.MeshStandardMaterial({
    color: style === 'flutedGlass' || style === 'brassLantern' ? 0xfff7e8 : 0xf4ece0,
    emissive: new THREE.Color(0xffb44c),
    emissiveIntensity: style === 'flutedGlass' || style === 'brassLantern' ? 1.1 : 1.45,
    roughness: style === 'flutedGlass' || style === 'brassLantern' ? 0.12 : 0.68,
    metalness: style === 'flutedGlass' || style === 'brassLantern' ? 0.12 : 0.02,
    transparent: style === 'flutedGlass' || style === 'brassLantern',
    opacity: style === 'flutedGlass' || style === 'brassLantern' ? 0.46 : 1.0,
    side: THREE.DoubleSide,
  });
  ctx.lightGroups[circuitId].emissives.push(bulbEmissiveMat, shadeEmissiveMat);

  // Antique brass ceiling rose + cord grip
  const ceilingRose = new THREE.Mesh(
    new THREE.CylinderGeometry(0.056, 0.062, 0.024, 16),
    sharedRoomBrassMat
  );
  ceilingRose.position.set(0, ceilingY - 0.012, 0);
  group.add(ceilingRose);

  const cordGrip = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.016, 0.024, 12),
    sharedRoomBrassMat
  );
  cordGrip.position.set(0, ceilingY - 0.03, 0);
  group.add(cordGrip);

  // Braided silk suspension cord
  const shadeTopY = ceilingY - dropLength;
  const cordLen = Math.max(0.12, dropLength - 0.024);
  const cord = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0065, 0.0065, cordLen, 8),
    sharedBraidedCordMat
  );
  cord.position.set(0, shadeTopY + cordLen * 0.5, 0);
  group.add(cord);

  // Brass lampholder gallery
  const gallery = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.036, 0.052, 12),
    sharedRoomBrassMat
  );
  gallery.position.set(0, shadeTopY, 0);
  group.add(gallery);

  // The glass lantern hangs its candle bulb in the middle of the glazed cage rather than under the gallery.
  const bulbY = shadeTopY - (style === 'glassLantern' ? 0.205 : 0.085);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.044, 14, 12),
    bulbEmissiveMat
  );
  bulb.position.set(0, bulbY, 0);
  group.add(bulb);

  if (style === 'linenDrum') {
    // Tapered woven-linen drum shade with brass top spider ring
    const drumShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.145, 0.195, 0.21, 24, 1, true),
      shadeEmissiveMat
    );
    drumShade.position.set(0, bulbY, 0);
    drumShade.castShadow = true;
    group.add(drumShade);

    const topRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.145, 0.0045, 8, 24),
      sharedRoomBrassMat
    );
    topRim.rotation.x = Math.PI / 2;
    topRim.position.set(0, bulbY + 0.105, 0);
    group.add(topRim);

    const bottomRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.195, 0.0045, 8, 24),
      sharedRoomBrassMat
    );
    bottomRim.rotation.x = Math.PI / 2;
    bottomRim.position.set(0, bulbY - 0.105, 0);
    group.add(bottomRim);
  } else if (style === 'brassLantern') {
    // Hexagonal period brass-and-glass hall lantern cage
    const lanternGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.13, 0.105, 0.24, 6),
      shadeEmissiveMat
    );
    lanternGlass.position.set(0, bulbY - 0.01, 0);
    group.add(lanternGlass);

    const topCrown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.138, 0.055, 6),
      sharedRoomBrassMat
    );
    topCrown.position.set(0, bulbY + 0.13, 0);
    group.add(topCrown);

    const bottomRing = new THREE.Mesh(
      new THREE.CylinderGeometry(0.108, 0.095, 0.022, 6),
      sharedRoomBrassMat
    );
    bottomRing.position.set(0, bulbY - 0.135, 0);
    group.add(bottomRing);
  } else if (style === 'glassLantern') {
    buildGlassLanternCage(group, shadeTopY, bulb);
  } else if (style === 'opalGlobe') {
    // Mid-century / Victorian milk-glass opal globe pendant
    const opalGlobe = new THREE.Mesh(
      new THREE.SphereGeometry(0.135, 20, 16),
      shadeEmissiveMat
    );
    opalGlobe.position.set(0, bulbY - 0.015, 0);
    group.add(opalGlobe);
  } else {
    // Fluted glass bell dome shade
    const bellShade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.155, 0.18, 20, 1, true),
      shadeEmissiveMat
    );
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
    pLight.position.set(x, bulbY - 0.04, z);
    targetParent.add(pLight);
    ctx.lightGroups[circuitId].lights.push(pLight);
  }

  ctx.addGlowPool(circuitId, x, floorY + 0.014, z, 1.15, 0.34);

  ctx.interactions.registerLightFixture(group, circuitId);
  targetParent.add(group);
  return group;
}

/**
 * Builds an interactive 3D Corston Architectural Antique Brass 1-Gang Toggle Switch
 * in any Ground Floor or First Floor room and binds it to the room's KNX circuit & Physical Address.
 */
export function buildRoomCorstonToggleSwitch(
  ctx: SceneBuilderContext,
  options: RoomCorstonToggleSwitchOptions
): THREE.Group {
  const {
    circuitId,
    switchPa,
    switchLocation,
    location,
    x,
    y,
    z,
    rotY,
    facing = 'south',
    parentGroup,
    cutawayWall,
  } = options;

  const resolvedLocation = switchLocation ?? location ?? 'Room Switch';
  const resolvedRotY =
    rotY ??
    (facing === 'south'
      ? 0
      : facing === 'north'
        ? Math.PI
        : facing === 'east'
          ? Math.PI / 2
          : -Math.PI / 2);

  const ledMat = new THREE.MeshStandardMaterial({
    color: 0xffb84d,
    emissive: new THREE.Color(0xff9d2e),
    emissiveIntensity: 3.0,
  });
  ctx.registerSwitchLedMaterial?.(circuitId, ledMat);

  const unit = buildCorstonSingleToggleUnit(
    x,
    y,
    z,
    resolvedRotY,
    sharedRoomBrassMat,
    sharedRoomCollarMat,
    ledMat,
    {
      circuitId,
      switchPa,
      switchLocation: resolvedLocation,
    },
    ctx.interactiveMeshes
  );

  if (cutawayWall) {
    unit.userData = {
      ...unit.userData,
      isCutawayWall: true,
      cutawayWall,
    };
  }

  (parentGroup ?? ctx.scene).add(unit);
  return unit;
}




