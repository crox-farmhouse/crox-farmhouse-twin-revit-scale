import * as THREE from 'three';
import { buildMitredWallSkirtingGeometry } from '../../../../../engine/geometry/swept-moulding.ts';
import type { CutawayWallDescriptor } from '../../../../../core/types/scene.ts';
import type { SceneBuilderContext } from '../../../../../engine/viewer/scene-types.ts';
import type { createGroundFloorMaterials } from '../../../structure/ground-floor-materials.ts';
import type { buildDiningRoom } from '../dining-room.ts';

function createSharedGeo<T extends THREE.BufferGeometry>(geo: T): T {
  geo.computeBoundingSphere();
  return geo;
}

function tagHighLod<T extends THREE.Object3D>(obj: T, maxDistance = 12): T {
  obj.userData.lodTier = 'high';
  obj.userData.lodMaxDistance = maxDistance;
  return obj;
}

export type DownstairsWcAndCloakroomKit = Pick<
  ReturnType<typeof createGroundFloorMaterials>,
  'antiqueOakSkirtingMat' | 'brassMat' | 'ceramicWhiteMat' | 'tagCutawayWall' | 'wallH'
> &
  Pick<
    ReturnType<typeof buildDiningRoom>,
    'lowerDoorLintelH' | 'lowerDoorLintelY' | 'lowerFloorY' | 'lowerWallH' | 'lowerWallMidY'
  >;

/**
 * Downstairs Toilet / Cloakroom WC (`bootLobby.downstairsWc`) inside the West room off the Boot Lobby:
 * honed Carrara marble floor, Farrow & Ball Hague Blue wall linings, bespoke Shaker vanity unit,
 * perimeter backlit mirror, dual brass wall sconces, and Edwardian low-level WC suite.
 */
export function buildDownstairsWcAndCloakroom(
  ctx: SceneBuilderContext,
  kit: DownstairsWcAndCloakroomKit
): void {
  const { lightGroups, scene } = ctx;
  const {
    antiqueOakSkirtingMat,
    brassMat,
    ceramicWhiteMat,
    lowerDoorLintelH,
    lowerDoorLintelY,
    lowerFloorY,
    lowerWallH,
    lowerWallMidY,
    tagCutawayWall,
    wallH,
  } = kit;

  // Downstairs Toilet / Cloakroom WC inside the West Room
  // (Issue #11 & Issue #15: darker heritage painted walls, warm honed Carrara marble tiled floor, substantial marble-topped Shaker vanity unit, and cozy low-glare lighting)
  // Room bounds: X = -12.81m..-11.465m, Z = -2.50m..-0.25m, Y = lowerFloorY = -0.30m
  const wcGroup = new THREE.Group();
  wcGroup.name = 'bootLobby.downstairsWc';
  wcGroup.userData.zone = 'bootLobby';

  // Procedural warm honed Carrara marble texture for the WC floor tiles & vanity countertop (Issue #15: toned down brightness)
  const marbleCanvas = document.createElement('canvas');
  marbleCanvas.width = 512;
  marbleCanvas.height = 512;
  const mCtx = marbleCanvas.getContext('2d');
  if (mCtx) {
    mCtx.fillStyle = '#cbc4b8';
    mCtx.fillRect(0, 0, 512, 512);

    // Soft cloudy mineral variations
    for (const [cx, cy, r, alpha] of [
      [120, 140, 160, 0.08],
      [360, 220, 180, 0.07],
      [220, 400, 150, 0.08],
    ] as const) {
      const grad = mCtx.createRadialGradient(cx, cy, 10, cx, cy, r);
      grad.addColorStop(0, `rgba(115, 118, 122, ${alpha})`);
      grad.addColorStop(1, 'rgba(203, 196, 184, 0)');
      mCtx.fillStyle = grad;
      mCtx.fillRect(0, 0, 512, 512);
    }

    // Delicate diagonal Carrara grey veining
    mCtx.strokeStyle = 'rgba(105, 110, 116, 0.36)';
    mCtx.lineWidth = 2.2;
    for (let v = 0; v < 7; v++) {
      mCtx.beginPath();
      const startX = (v * 83) % 512;
      mCtx.moveTo(startX, 0);
      mCtx.bezierCurveTo(
        (startX + 90) % 512,
        170,
        (startX + 40) % 512,
        340,
        (startX + 140) % 512,
        512
      );
      mCtx.stroke();
    }

    // 4x4 large-format honed marble tile grout grid
    mCtx.strokeStyle = 'rgba(140, 135, 127, 0.58)';
    mCtx.lineWidth = 2;
    for (const g of [128, 256, 384] as const) {
      mCtx.beginPath();
      mCtx.moveTo(g, 0);
      mCtx.lineTo(g, 512);
      mCtx.moveTo(0, g);
      mCtx.lineTo(512, g);
      mCtx.stroke();
    }
  }
  const wcMarbleTex = new THREE.CanvasTexture(marbleCanvas);
  wcMarbleTex.colorSpace = THREE.SRGBColorSpace;
  wcMarbleTex.wrapS = THREE.RepeatWrapping;
  wcMarbleTex.wrapT = THREE.RepeatWrapping;
  wcMarbleTex.repeat.set(1.5, 2.5);

  const wcMarbleFloorMat = new THREE.MeshStandardMaterial({
    map: wcMarbleTex,
    roughness: 0.44,
    metalness: 0.03,
  });
  const wcMarbleCounterMat = new THREE.MeshStandardMaterial({
    map: wcMarbleTex,
    roughness: 0.32,
    metalness: 0.04,
  });

  // Honed Carrara Marble Tiled Floor covering the entire Downstairs WC room (X = -12.81m..-11.465m, Z = -2.50m..-0.25m)
  const wcMarbleFloor = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(1.345, 0.012, 2.25)),
    wcMarbleFloorMat
  );
  wcMarbleFloor.name = 'bootLobby.downstairsWc.marbleFloor';
  wcMarbleFloor.position.set(-12.1375, lowerFloorY + 0.004, -1.375);
  wcMarbleFloor.receiveShadow = true;
  wcGroup.add(wcMarbleFloor);

  // Darker heritage painted walls (deep Farrow & Ball Hague Blue / Railings slate-charcoal #253338) on all 4 WC interior faces
  const wcDarkWallMat = new THREE.MeshStandardMaterial({
    color: 0x253338,
    roughness: 0.6,
    metalness: 0.03,
  });

  const wcSideWallGeo = createSharedGeo(new THREE.BoxGeometry(0.016, lowerWallH, 2.24));

  // West interior wall lining (X = -12.80m, Z = -2.49m..-0.25m)
  const wcWestDarkWall = new THREE.Mesh(wcSideWallGeo, wcDarkWallMat);
  wcWestDarkWall.name = 'bootLobby.downstairsWc.westWall';
  wcWestDarkWall.position.set(-12.8, lowerWallMidY, -1.37);
  wcWestDarkWall.receiveShadow = true;
  wcGroup.add(wcWestDarkWall);

  // East interior partition wall lining (X = -11.472m, Z = -2.49m..-0.25m)
  const wcEastDarkWall = new THREE.Mesh(wcSideWallGeo, wcDarkWallMat);
  wcEastDarkWall.name = 'bootLobby.downstairsWc.eastWall';
  wcEastDarkWall.position.set(-11.472, lowerWallMidY, -1.37);
  wcEastDarkWall.receiveShadow = true;
  wcGroup.add(wcEastDarkWall);

  // South interior wall lining around the WC door (Z = -0.258m, door at X = -12.54m..-11.70m)
  const southPierSpecs = [
    [-12.67, 0.26, 'westPier'],
    [-11.585, 0.23, 'eastPier'],
  ] as const;
  for (const [sx, sw, pierTag] of southPierSpecs) {
    const southPierLining = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(sw, lowerWallH, 0.016)),
      wcDarkWallMat
    );
    southPierLining.name = `bootLobby.downstairsWc.southWall.${pierTag}`;
    southPierLining.position.set(sx, lowerWallMidY, -0.258);
    southPierLining.receiveShadow = true;
    wcGroup.add(southPierLining);
  }
  const wcSouthDoorHeaderLining = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.84, lowerDoorLintelH, 0.016)),
    wcDarkWallMat
  );
  wcSouthDoorHeaderLining.name = 'bootLobby.downstairsWc.southWall.doorHeader';
  wcSouthDoorHeaderLining.position.set(-12.12, lowerDoorLintelY, -0.258);
  wcGroup.add(wcSouthDoorHeaderLining);

  // North exterior wall dark lining around the WC window (X = -12.52m..-11.76m, Y = 0.79m..1.60m), tagged with tagCutawayWall
  const wcNorthCutaway: CutawayWallDescriptor = {
    axis: 'z',
    coord: -2.64,
    minSpan: -12.81,
    maxSpan: -11.45,
    floor: 'ground',
  };
  const northLiningSpecs = [
    [-12.62, lowerWallMidY, 0.38, lowerWallH, 'westPier'],
    [-11.65, lowerWallMidY, 0.4, lowerWallH, 'eastPier'],
    [-12.14, (lowerFloorY + 0.79) / 2, 0.58, 0.79 - lowerFloorY, 'spandrelLower'],
    [-12.14, (1.6 + wallH) / 2, 0.58, wallH - 1.6, 'spandrelUpper'],
  ] as const;
  for (const [nx, ny, nw, nh, nTag] of northLiningSpecs) {
    const northLining = new THREE.Mesh(
      createSharedGeo(new THREE.BoxGeometry(nw, nh, 0.016)),
      wcDarkWallMat
    );
    northLining.name = `bootLobby.downstairsWc.northWall.${nTag}`;
    northLining.position.set(nx, ny, -2.49);
    northLining.receiveShadow = true;
    tagCutawayWall(northLining, wcNorthCutaway);
    wcGroup.add(northLining);
  }

  // 1. Much More Substantial Floor-Standing Bespoke Period Shaker Vanity Unit on the West wall (Issue #11)
  //    (0.48m deep E-W x 0.84m tall x 0.86m wide N-S, centered at Z = -0.88m, X = -12.80m..-12.32m)
  const vanityCabinetMat = new THREE.MeshStandardMaterial({
    color: 0x3b443c, // rich deep heritage olive-charcoal joinery
    roughness: 0.48,
    metalness: 0.04,
  });
  const vanityTrimMat = new THREE.MeshStandardMaterial({
    color: 0x2d352e,
    roughness: 0.52,
    metalness: 0.04,
  });
  const wcMirrorCanvas = document.createElement('canvas');
  wcMirrorCanvas.width = 256;
  wcMirrorCanvas.height = 384;
  const wmCtx = wcMirrorCanvas.getContext('2d');
  if (wmCtx) {
    const mGrad = wmCtx.createLinearGradient(0, 0, 256, 384);
    mGrad.addColorStop(0, '#eef4f7');
    mGrad.addColorStop(0.38, '#d8e3e8');
    mGrad.addColorStop(0.7, '#f7f1e6');
    mGrad.addColorStop(1, '#c5d1d8');
    wmCtx.fillStyle = mGrad;
    wmCtx.fillRect(0, 0, 256, 384);

    // Soft warm reflection of opposite East wall sconces & bevelled specular sheen
    for (const [gx, gy] of [
      [78, 150],
      [185, 150],
    ] as const) {
      const sGlow = wmCtx.createRadialGradient(gx, gy, 4, gx, gy, 58);
      sGlow.addColorStop(0, 'rgba(255, 244, 214, 0.85)');
      sGlow.addColorStop(0.45, 'rgba(255, 218, 158, 0.32)');
      sGlow.addColorStop(1, 'rgba(255, 218, 158, 0)');
      wmCtx.fillStyle = sGlow;
      wmCtx.fillRect(0, 0, 256, 384);
    }
    wmCtx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
    wmCtx.lineWidth = 5;
    wmCtx.strokeRect(10, 10, 236, 364);
  }
  const wcMirrorTex = new THREE.CanvasTexture(wcMirrorCanvas);
  wcMirrorTex.colorSpace = THREE.SRGBColorSpace;
  const mirrorGlassMat = new THREE.MeshStandardMaterial({
    map: wcMirrorTex,
    emissive: 0xd8d2c6,
    emissiveMap: wcMirrorTex,
    emissiveIntensity: 0.1,
    roughness: 0.12,
    metalness: 0.18,
  });

  const vanityZ = -0.88;
  const vanityW = 0.86; // N-S width along Z
  const vanityD = 0.48; // E-W depth along X
  const vanityCarcassH = 0.80;

  // Moulded base plinth (Y = lowerFloorY..lowerFloorY + 0.085m)
  const vanityPlinth = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(vanityD - 0.02, 0.085, vanityW + 0.016)),
    vanityTrimMat
  );
  vanityPlinth.name = 'bootLobby.downstairsWc.vanityPlinth';
  vanityPlinth.position.set(-12.8 + (vanityD - 0.02) / 2, lowerFloorY + 0.0425, vanityZ);
  vanityPlinth.castShadow = true;
  vanityPlinth.receiveShadow = true;
  wcGroup.add(vanityPlinth);

  // Main floor-standing Shaker vanity cabinet carcass (Y = lowerFloorY + 0.08m..0.80m)
  const vanityCab = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(vanityD, vanityCarcassH - 0.08, vanityW)),
    vanityCabinetMat
  );
  vanityCab.name = 'bootLobby.downstairsWc.vanityCabinet';
  vanityCab.position.set(-12.8 + vanityD / 2, lowerFloorY + 0.44, vanityZ);
  vanityCab.castShadow = true;
  vanityCab.receiveShadow = true;
  wcGroup.add(vanityCab);

  // Framed corner pilasters & 2 recessed Shaker panelled doors on the East (+X) front face
  const shakerDoorFrameGeo = createSharedGeo(new THREE.BoxGeometry(0.022, 0.62, 0.37));
  const shakerDoorPanelGeo = createSharedGeo(new THREE.BoxGeometry(0.014, 0.5, 0.26));
  const doorKnobGeo = createSharedGeo(new THREE.SphereGeometry(0.015, 12, 12));

  for (const sideZ of [-1, 1] as const) {
    const sideTag = sideZ < 0 ? 'north' : 'south';
    const doorZ = vanityZ + sideZ * 0.2;
    const shakerDoorFrame = new THREE.Mesh(shakerDoorFrameGeo, vanityTrimMat);
    shakerDoorFrame.name = `bootLobby.downstairsWc.vanityDoorFrame.${sideTag}`;
    shakerDoorFrame.position.set(-12.8 + vanityD + 0.008, lowerFloorY + 0.44, doorZ);
    shakerDoorFrame.castShadow = true;
    wcGroup.add(shakerDoorFrame);

    const shakerDoorPanel = new THREE.Mesh(shakerDoorPanelGeo, vanityCabinetMat);
    shakerDoorPanel.name = `bootLobby.downstairsWc.vanityDoorPanel.${sideTag}`;
    shakerDoorPanel.position.set(-12.8 + vanityD + 0.015, lowerFloorY + 0.44, doorZ);
    wcGroup.add(shakerDoorPanel);

    // Aged brass cabinet knob on each Shaker door
    const doorKnob = tagHighLod(new THREE.Mesh(doorKnobGeo, brassMat));
    doorKnob.name = `bootLobby.downstairsWc.vanityDoorKnob.${sideTag}`;
    doorKnob.position.set(
      -12.8 + vanityD + 0.032,
      lowerFloorY + 0.52,
      vanityZ + sideZ * 0.048
    );
    wcGroup.add(doorKnob);
  }

  // Thick Honed Carrara Marble Countertop Slab (0.51m deep x 0.042m thick x 0.90m wide) + 0.11m Marble Backsplash Upstand
  const basinSlab = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(vanityD + 0.03, 0.042, vanityW + 0.04)),
    wcMarbleCounterMat
  );
  basinSlab.name = 'bootLobby.downstairsWc.sinkBasin';
  basinSlab.position.set(-12.8 + (vanityD + 0.03) / 2, lowerFloorY + 0.821, vanityZ);
  basinSlab.castShadow = true;
  basinSlab.receiveShadow = true;
  wcGroup.add(basinSlab);

  const marbleUpstand = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.024, 0.11, vanityW + 0.04)),
    wcMarbleCounterMat
  );
  marbleUpstand.name = 'bootLobby.downstairsWc.marbleUpstand';
  marbleUpstand.position.set(-12.8 + 0.012, lowerFloorY + 0.897, vanityZ);
  marbleUpstand.castShadow = true;
  wcGroup.add(marbleUpstand);

  // Undermounted glazed white porcelain sink basin bowl & brass waste plug
  const basinRim = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.32, 0.016, 0.52)),
    ceramicWhiteMat
  );
  basinRim.name = 'bootLobby.downstairsWc.basinRim';
  basinRim.position.set(-12.8 + 0.28, lowerFloorY + 0.843, vanityZ);
  wcGroup.add(basinRim);

  const basinWell = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.27, 0.018, 0.46)),
    new THREE.MeshStandardMaterial({ color: 0xdfe3e6, roughness: 0.14, metalness: 0.06 })
  );
  basinWell.name = 'bootLobby.downstairsWc.basinWell';
  basinWell.position.set(-12.8 + 0.28, lowerFloorY + 0.846, vanityZ);
  wcGroup.add(basinWell);

  // Traditional Perrin & Rowe style aged-brass bridge mixer tap with crosshead hot/cold valves
  const tapStem = tagHighLod(
    new THREE.Mesh(createSharedGeo(new THREE.CylinderGeometry(0.016, 0.02, 0.16, 14)), brassMat)
  );
  tapStem.name = 'bootLobby.downstairsWc.tapStem';
  tapStem.position.set(-12.8 + 0.085, lowerFloorY + 0.92, vanityZ);
  wcGroup.add(tapStem);

  const tapSpout = tagHighLod(
    new THREE.Mesh(createSharedGeo(new THREE.BoxGeometry(0.14, 0.018, 0.02)), brassMat)
  );
  tapSpout.name = 'bootLobby.downstairsWc.tapSpout';
  tapSpout.position.set(-12.8 + 0.145, lowerFloorY + 0.99, vanityZ);
  wcGroup.add(tapSpout);

  const valveBodyGeo = createSharedGeo(new THREE.CylinderGeometry(0.014, 0.018, 0.065, 12));
  const crossBarGeo = createSharedGeo(new THREE.BoxGeometry(0.052, 0.01, 0.052));
  const valveSpecs = [
    [vanityZ - 0.11, 'hot'],
    [vanityZ + 0.11, 'cold'],
  ] as const;
  for (const [valveZ, vTag] of valveSpecs) {
    const valveBody = tagHighLod(new THREE.Mesh(valveBodyGeo, brassMat));
    valveBody.name = `bootLobby.downstairsWc.tapValve.${vTag}`;
    valveBody.position.set(-12.8 + 0.085, lowerFloorY + 0.875, valveZ);
    wcGroup.add(valveBody);

    const crossBar = tagHighLod(new THREE.Mesh(crossBarGeo, brassMat));
    crossBar.name = `bootLobby.downstairsWc.tapCrosshead.${vTag}`;
    crossBar.position.set(-12.8 + 0.085, lowerFloorY + 0.91, valveZ);
    wcGroup.add(crossBar);
  }

  // Substantial Architectural Aged-Brass Framed Wall Mirror above the vanity (0.72m wide x 0.88m tall)
  // With Warm 2700K Perimeter LED Backlighting ONLY on the West wall + 2 Heritage Brass Wall Sconces on the opposite East wall (Issue #7 & Issue #15)
  const mirrorFrame = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.028, 0.88, 0.72)),
    brassMat
  );
  mirrorFrame.name = 'bootLobby.downstairsWc.mirrorFrame';
  mirrorFrame.position.set(-12.8 + 0.024, lowerFloorY + 1.44, vanityZ);
  mirrorFrame.castShadow = true;
  wcGroup.add(mirrorFrame);

  const mirrorSurface = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.01, 0.82, 0.66)),
    mirrorGlassMat
  );
  mirrorSurface.name = 'bootLobby.downstairsWc.mirror';
  mirrorSurface.position.set(-12.8 + 0.036, lowerFloorY + 1.44, vanityZ);
  wcGroup.add(mirrorSurface);

  // Concealed Warm 2700K Perimeter LED Backlight Frame + Soft Wall-Wash Halo behind the WC Mirror (Issue #7 & Issue #15: toned down)
  const wcMirrorLedMat = new THREE.MeshStandardMaterial({
    color: 0xfff3d6,
    emissive: 0xffb85c,
    emissiveIntensity: 1.15,
    roughness: 0.2,
  });
  const wcMirrorHaloMat = new THREE.MeshStandardMaterial({
    color: 0xffdfa8,
    emissive: 0xffb85c,
    emissiveIntensity: 0.65,
    roughness: 0.65,
    transparent: true,
    opacity: 0.36,
  });
  // WC mirror backlight + sconces are on their own PIR-controlled circuit (WC PIR 1.1.26)
  lightGroups.cloakroomWcLights.emissives.push(wcMirrorLedMat, wcMirrorHaloMat);

  // 4-sided warm LED diffuser strips tucked behind the outer edge of the brass mirror frame (X = -12.79m)
  const mirrorCenterY = lowerFloorY + 1.44;
  const horizLedGeo = createSharedGeo(new THREE.BoxGeometry(0.014, 0.014, 0.71));
  const vertLedGeo = createSharedGeo(new THREE.BoxGeometry(0.014, 0.86, 0.014));
  for (const [dy, dz, ledGeo] of [
    [0.435, 0, horizLedGeo],  // Top LED bar
    [-0.435, 0, horizLedGeo], // Bottom LED bar
    [0, -0.355, vertLedGeo],  // North vertical LED bar
    [0, 0.355, vertLedGeo],   // South vertical LED bar
  ] as const) {
    const ledBar = tagHighLod(new THREE.Mesh(ledGeo, wcMirrorLedMat));
    ledBar.name = 'bootLobby.downstairsWc.mirrorLedStrip';
    ledBar.position.set(-12.8 + 0.009, mirrorCenterY + dy, vanityZ + dz);
    wcGroup.add(ledBar);
  }

  // Soft warm perimeter halo wash on the West wall right behind the mirror
  const horizHaloGeo = createSharedGeo(new THREE.BoxGeometry(0.004, 0.065, 0.82));
  const vertHaloGeo = createSharedGeo(new THREE.BoxGeometry(0.004, 0.98, 0.065));
  for (const [dy, dz, haloGeo] of [
    [0.47, 0, horizHaloGeo],
    [-0.47, 0, horizHaloGeo],
    [0, -0.39, vertHaloGeo],
    [0, 0.39, vertHaloGeo],
  ] as const) {
    const haloStrip = tagHighLod(new THREE.Mesh(haloGeo, wcMirrorHaloMat));
    haloStrip.name = 'bootLobby.downstairsWc.mirrorLedHalo';
    haloStrip.position.set(-12.8 + 0.003, mirrorCenterY + dy, vanityZ + dz);
    wcGroup.add(haloStrip);
  }

  // Issue #7 & Issue #15: No wall lights on the West vanity side (only mirror backlighting);
  // 2 Heritage Aged-Brass & Fluted Opal-Glass Wall Sconces mounted on the opposite East partition wall (X = -11.48m, dirX = -1)
  const wcSconceShadeMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e0,
    emissive: 0xffb85c,
    emissiveIntensity: 1.05,
    roughness: 0.35,
    side: THREE.DoubleSide,
  });
  wcSconceShadeMat.userData.baseEmissiveIntensity = 1.05;
  const wcSconceBulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff9eb,
    emissive: 0xffc470,
    emissiveIntensity: 1.4,
    roughness: 0.15,
  });
  wcSconceBulbMat.userData.baseEmissiveIntensity = 1.4;
  lightGroups.cloakroomWcLights.emissives.push(wcSconceShadeMat, wcSconceBulbMat);

  // Soft fill from the two opal sconces (parented to the scene root, never to a cutaway group)
  const wcFillLight = new THREE.PointLight(0xffcf94, 3.2, 3.2, 1.8);
  wcFillLight.userData.baseIntensity = 3.2;
  wcFillLight.position.set(-11.75, lowerFloorY + 1.45, -1.33);
  scene.add(wcFillLight);
  lightGroups.cloakroomWcLights.lights.push(wcFillLight);

  const sconceBackplateGeo = createSharedGeo(new THREE.CylinderGeometry(0.052, 0.056, 0.014, 18));
  const sconceArmGeo = createSharedGeo(new THREE.CylinderGeometry(0.008, 0.009, 0.095, 12));
  const sconceRiserGeo = createSharedGeo(new THREE.CylinderGeometry(0.016, 0.011, 0.045, 14));
  const sconceShadeGeo = createSharedGeo(
    new THREE.CylinderGeometry(0.044, 0.036, 0.145, 18, 1, true)
  );
  const sconceBulbGeo = createSharedGeo(new THREE.SphereGeometry(0.02, 12, 12));

  for (const [sIdx, wallX, sconceY, sconceZ, dirX] of [
    [1, -11.48, 1.32, -1.78, -1], // North East-wall sconce
    [2, -11.48, 1.32, -0.88, -1], // South East-wall sconce opposite vanity mirror
  ] as const) {
    const sconceGrp = new THREE.Group();
    sconceGrp.name = `bootLobby.downstairsWc.wallSconce.${sIdx}`;
    sconceGrp.position.set(wallX, sconceY, sconceZ);

    // Stepped circular aged-brass wall backplate
    const backplate = new THREE.Mesh(sconceBackplateGeo, brassMat);
    backplate.name = `bootLobby.downstairsWc.wallSconce.${sIdx}.backplate`;
    backplate.rotation.z = Math.PI / 2;
    backplate.position.set(dirX * 0.007, 0, 0);
    backplate.castShadow = true;
    sconceGrp.add(backplate);

    // Curved brass horizontal arm & knurled gallery cup holder
    const arm = tagHighLod(new THREE.Mesh(sconceArmGeo, brassMat));
    arm.name = `bootLobby.downstairsWc.wallSconce.${sIdx}.arm`;
    arm.rotation.z = Math.PI / 2;
    arm.position.set(dirX * 0.052, -0.012, 0);
    sconceGrp.add(arm);

    const riser = tagHighLod(new THREE.Mesh(sconceRiserGeo, brassMat));
    riser.name = `bootLobby.downstairsWc.wallSconce.${sIdx}.riser`;
    riser.position.set(dirX * 0.095, 0.01, 0);
    sconceGrp.add(riser);

    // Fluted opal-glass cylinder/tulip shade + warm glowing filament bulb
    const shade = new THREE.Mesh(sconceShadeGeo, wcSconceShadeMat);
    shade.name = `bootLobby.downstairsWc.wallSconce.${sIdx}.shade`;
    shade.position.set(dirX * 0.095, 0.095, 0);
    shade.castShadow = true;
    sconceGrp.add(shade);

    const bulb = tagHighLod(new THREE.Mesh(sconceBulbGeo, wcSconceBulbMat));
    bulb.name = `bootLobby.downstairsWc.wallSconce.${sIdx}.bulb`;
    bulb.position.set(dirX * 0.095, 0.085, 0);
    sconceGrp.add(bulb);

    wcGroup.add(sconceGrp);
  }

  // 2. High-LOD Traditional Edwardian Low-Level Vitreous China Toilet (`bootLobby.downstairsWc`, Issue #4)
  //    Burlington / Thomas Crapper style traditional WC at X = -12.80m, Z = -1.92m, facing East (+X):
  //    - Sculpted stepped Edwardian pedestal base with brass floor-fixing dome bolts & rear ceramic outlet shroud
  //    - Hollow LatheGeometry glazed vitreous china pan bowl with traditional stepped box-rim, visible inner well & water seal
  //    - Contoured open oval Solid Heritage Walnut toilet seat ring with Aged-Brass pillar bar hinges
  //    - Traditional stepped-cornice vitreous china cistern mounted on ornate cast-brass wall brackets
  //    - Cranked Aged-Brass & White-Porcelain torpedo flush lever + exposed 38mm brass flush pipe & 15mm brass supply pipe
  const toiletZ = -1.92;
  const panCenterX = -12.8 + 0.455; // -12.345m

  const vitreousChinaMat = new THREE.MeshStandardMaterial({
    color: 0xf6f5f0,
    roughness: 0.11,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });
  const innerBowlGlazeMat = new THREE.MeshStandardMaterial({
    color: 0xe6eaec,
    roughness: 0.08,
    metalness: 0.06,
    side: THREE.DoubleSide,
  });
  const waterSealMat = new THREE.MeshStandardMaterial({
    color: 0xd4edf4,
    roughness: 0.04,
    metalness: 0.12,
    transparent: true,
    opacity: 0.78,
  });
  const walnutSeatMat = new THREE.MeshStandardMaterial({
    color: 0x5c3a21, // Rich satin-lacquered heritage American walnut / antique oak seat
    roughness: 0.28,
    metalness: 0.04,
  });

  // 2A. Stepped Edwardian Vitreous China Pedestal Base & Rear S/P-Trap Outlet Shroud
  const pedestalFootPts = [
    new THREE.Vector2(0.001, 0.0),
    new THREE.Vector2(0.148, 0.0),
    new THREE.Vector2(0.146, 0.018),
    new THREE.Vector2(0.132, 0.028),
    new THREE.Vector2(0.126, 0.046),
    new THREE.Vector2(0.106, 0.068),
    new THREE.Vector2(0.098, 0.145),
    new THREE.Vector2(0.112, 0.188),
  ];
  const wcPanPedestal = new THREE.Mesh(
    createSharedGeo(new THREE.LatheGeometry(pedestalFootPts, 24)),
    vitreousChinaMat
  );
  wcPanPedestal.name = 'bootLobby.downstairsWc.toiletPedestal';
  wcPanPedestal.position.set(panCenterX - 0.015, lowerFloorY + 0.01, toiletZ);
  wcPanPedestal.scale.set(1.26, 1.0, 0.88);
  wcPanPedestal.castShadow = true;
  wcPanPedestal.receiveShadow = true;
  wcGroup.add(wcPanPedestal);

  // Aged-brass floor-fixing dome screw caps on the North & South flanges of the pedestal foot
  const floorBoltGeo = createSharedGeo(new THREE.SphereGeometry(0.011, 10, 10));
  for (const boltSideZ of [-1, 1] as const) {
    const floorBolt = tagHighLod(new THREE.Mesh(floorBoltGeo, brassMat));
    floorBolt.name = `bootLobby.downstairsWc.floorBolt.${boltSideZ < 0 ? 'north' : 'south'}`;
    floorBolt.position.set(panCenterX - 0.015, lowerFloorY + 0.026, toiletZ + boltSideZ * 0.116);
    wcGroup.add(floorBolt);
  }

  // Issue #9: Boxed-out painted plasterboard waste/soil pipe casing (`bootLobby.downstairsWc.wastePipeBoxing`)
  // on the West wall (`X = -12.80m`)
  const wastePipeBoxingGroup = new THREE.Group();
  wastePipeBoxingGroup.name = 'bootLobby.downstairsWc.wastePipeBoxing';

  const vertStackBoxing = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.2, lowerWallH, 0.32)),
    wcDarkWallMat
  );
  vertStackBoxing.name = 'bootLobby.downstairsWc.wastePipeBoxing.verticalStack';
  vertStackBoxing.position.set(-12.7, lowerWallMidY, -1.48);
  vertStackBoxing.castShadow = true;
  vertStackBoxing.receiveShadow = true;
  wastePipeBoxingGroup.add(vertStackBoxing);

  const horizSoilBoxing = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.18, 0.36, 0.842)),
    wcDarkWallMat
  );
  horizSoilBoxing.name = 'bootLobby.downstairsWc.wastePipeBoxing.horizontalDuct';
  horizSoilBoxing.position.set(-12.71, lowerFloorY + 0.18, -2.061);
  horizSoilBoxing.castShadow = true;
  horizSoilBoxing.receiveShadow = true;
  wastePipeBoxingGroup.add(horizSoilBoxing);

  const horizBoxingCapShelf = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.194, 0.022, 0.846)),
    vanityCabinetMat
  );
  horizBoxingCapShelf.name = 'bootLobby.downstairsWc.wastePipeBoxing.capShelf';
  horizBoxingCapShelf.position.set(-12.703, lowerFloorY + 0.371, -2.061);
  horizBoxingCapShelf.castShadow = true;
  horizBoxingCapShelf.receiveShadow = true;
  wastePipeBoxingGroup.add(horizBoxingCapShelf);

  // 45-degree mitred 146mm antique oak skirting wrapping the waste-pipe boxing base
  const boxSkirt = new THREE.Mesh(
    createSharedGeo(
      buildMitredWallSkirtingGeometry(
        [
          [-12.62, -2.482],
          [-12.62, -1.64],
          [-12.6, -1.64],
          [-12.6, -1.32],
          [-12.8, -1.32],
        ],
        lowerFloorY
      )
    ),
    antiqueOakSkirtingMat
  );
  boxSkirt.name = 'bootLobby.downstairsWc.wastePipeBoxing.skirting';
  boxSkirt.castShadow = true;
  boxSkirt.receiveShadow = true;
  wastePipeBoxingGroup.add(boxSkirt);
  wcGroup.add(wastePipeBoxingGroup);

  // Rear horizontal porcelain soil-pipe shroud & stepped wall collar into the horizontal waste-pipe boxing (X = -12.62m)
  const soilPipeShroud = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.056, 0.058, 0.22, 16)),
      vitreousChinaMat
    )
  );
  soilPipeShroud.name = 'bootLobby.downstairsWc.soilPipeShroud';
  soilPipeShroud.rotation.z = Math.PI / 2;
  soilPipeShroud.position.set(-12.62 + 0.11, lowerFloorY + 0.185, toiletZ);
  soilPipeShroud.castShadow = true;
  wcGroup.add(soilPipeShroud);

  const soilWallCollar = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.076, 0.08, 0.026, 18)),
      vitreousChinaMat
    )
  );
  soilWallCollar.name = 'bootLobby.downstairsWc.soilWallCollar';
  soilWallCollar.rotation.z = Math.PI / 2;
  soilWallCollar.position.set(-12.62 + 0.013, lowerFloorY + 0.185, toiletZ);
  wcGroup.add(soilWallCollar);

  // 2B. Hollow Lathe-Sculpted Traditional Flared Box-Rim Vitreous China Pan Bowl
  const bowlProfilePts = [
    new THREE.Vector2(0.001, 0.175), // Bottom of water trap well
    new THREE.Vector2(0.068, 0.18),  // Inner trap floor
    new THREE.Vector2(0.112, 0.172), // Outer lower bowl transition from pedestal
    new THREE.Vector2(0.146, 0.235), // Swelling outer belly of Edwardian bowl
    new THREE.Vector2(0.174, 0.315), // Upper outer bowl flare
    new THREE.Vector2(0.182, 0.365), // Neck beneath stepped Edwardian box-rim
    new THREE.Vector2(0.198, 0.376), // Lower lip of traditional projecting flushing rim
    new THREE.Vector2(0.202, 0.398), // Outer crest of porcelain flushing rim
    new THREE.Vector2(0.192, 0.406), // Top glazed rim surface
    new THREE.Vector2(0.154, 0.404), // Inner rim overhang
    new THREE.Vector2(0.148, 0.382), // Under-rim flushing channel
    new THREE.Vector2(0.132, 0.315), // Sloping inner porcelain bowl wall
    new THREE.Vector2(0.088, 0.235), // Lower inner bowl taper
    new THREE.Vector2(0.064, 0.192), // Inner water trap well wall
    new THREE.Vector2(0.001, 0.188), // Inner center well bottom
  ];
  const wcPanBowl = new THREE.Mesh(
    createSharedGeo(new THREE.LatheGeometry(bowlProfilePts, 28)),
    vitreousChinaMat
  );
  wcPanBowl.name = 'bootLobby.downstairsWc.toiletPan';
  wcPanBowl.position.set(panCenterX, lowerFloorY, toiletZ);
  wcPanBowl.scale.set(1.18, 1.0, 0.95);
  wcPanBowl.castShadow = true;
  wcPanBowl.receiveShadow = true;
  wcGroup.add(wcPanBowl);

  // Inner glazed well & translucent water seal surface inside the open bowl (visible from overhead!)
  const innerWellLiner = new THREE.Mesh(
    createSharedGeo(new THREE.CylinderGeometry(0.138, 0.068, 0.16, 24, 1, true)),
    innerBowlGlazeMat
  );
  innerWellLiner.name = 'bootLobby.downstairsWc.innerWellLiner';
  innerWellLiner.position.set(panCenterX, lowerFloorY + 0.285, toiletZ);
  innerWellLiner.scale.set(1.16, 1.0, 0.93);
  wcGroup.add(innerWellLiner);

  const waterSealDisc = new THREE.Mesh(
    createSharedGeo(new THREE.CylinderGeometry(0.086, 0.072, 0.008, 22)),
    waterSealMat
  );
  waterSealDisc.name = 'bootLobby.downstairsWc.waterSeal';
  waterSealDisc.position.set(panCenterX - 0.01, lowerFloorY + 0.224, toiletZ);
  waterSealDisc.scale.set(1.15, 1.0, 0.92);
  wcGroup.add(waterSealDisc);

  // Rear porcelain hinge-deck shelf & flush-pipe inlet horn at the back of the pan
  const rearPanDeck = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.15, 0.048, 0.25)),
    vitreousChinaMat
  );
  rearPanDeck.name = 'bootLobby.downstairsWc.rearPanDeck';
  rearPanDeck.position.set(panCenterX - 0.185, lowerFloorY + 0.38, toiletZ);
  rearPanDeck.castShadow = true;
  wcGroup.add(rearPanDeck);

  const rearInletHorn = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.036, 0.044, 0.07, 16)),
      vitreousChinaMat
    )
  );
  rearInletHorn.name = 'bootLobby.downstairsWc.rearInletHorn';
  rearInletHorn.rotation.z = Math.PI / 2;
  rearInletHorn.position.set(panCenterX - 0.255, lowerFloorY + 0.382, toiletZ);
  wcGroup.add(rearInletHorn);

  // 2C. Open Contoured Solid Heritage Walnut Toilet Seat Ring & Aged-Brass Pillar Bar Hinges
  const wcSeat = new THREE.Mesh(
    createSharedGeo(new THREE.TorusGeometry(0.164, 0.027, 18, 36)),
    walnutSeatMat
  );
  wcSeat.name = 'bootLobby.downstairsWc.toiletSeat';
  wcSeat.rotation.x = Math.PI / 2;
  wcSeat.position.set(panCenterX + 0.006, lowerFloorY + 0.418, toiletZ);
  wcSeat.scale.set(1.17, 0.95, 0.36);
  wcSeat.castShadow = true;
  wcSeat.receiveShadow = true;
  wcGroup.add(wcSeat);

  // Rear walnut seat bridge block & aged-brass pillar bar hinges
  const walnutHingeBlock = tagHighLod(
    new THREE.Mesh(createSharedGeo(new THREE.BoxGeometry(0.052, 0.018, 0.21)), walnutSeatMat)
  );
  walnutHingeBlock.name = 'bootLobby.downstairsWc.seatHingeBlock';
  walnutHingeBlock.position.set(panCenterX - 0.175, lowerFloorY + 0.418, toiletZ);
  walnutHingeBlock.castShadow = true;
  wcGroup.add(walnutHingeBlock);

  const hingePillarGeo = createSharedGeo(new THREE.CylinderGeometry(0.012, 0.015, 0.034, 12));
  for (const hingeSideZ of [-1, 1] as const) {
    const hingePillar = tagHighLod(new THREE.Mesh(hingePillarGeo, brassMat));
    hingePillar.name = `bootLobby.downstairsWc.seatHingePillar.${hingeSideZ < 0 ? 'north' : 'south'}`;
    hingePillar.position.set(
      panCenterX - 0.182,
      lowerFloorY + 0.418,
      toiletZ + hingeSideZ * 0.078
    );
    wcGroup.add(hingePillar);
  }
  const hingeCrossBar = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.006, 0.006, 0.18, 12)),
      brassMat
    )
  );
  hingeCrossBar.name = 'bootLobby.downstairsWc.seatHingeCrossBar';
  hingeCrossBar.rotation.x = Math.PI / 2;
  hingeCrossBar.position.set(panCenterX - 0.182, lowerFloorY + 0.426, toiletZ);
  wcGroup.add(hingeCrossBar);

  // 2D. Traditional Low/Mid-Level Stepped Cornice Vitreous China Cistern (`bootLobby.downstairsWc.cistern`)
  const cisternCenterX = -12.8 + 0.11; // -12.69m
  const cisternBaseY = lowerFloorY + 0.73;
  const cisternH = 0.31;
  const cisternW = 0.46; // N-S width along Z
  const cisternD = 0.20; // E-W depth along X

  // Stepped lower moulding & main vitreous china cistern tank
  const cisternLowerSkirt = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(cisternD - 0.016, 0.028, cisternW - 0.02)),
    vitreousChinaMat
  );
  cisternLowerSkirt.name = 'bootLobby.downstairsWc.cisternLowerSkirt';
  cisternLowerSkirt.position.set(cisternCenterX - 0.005, cisternBaseY + 0.014, toiletZ);
  cisternLowerSkirt.castShadow = true;
  wcGroup.add(cisternLowerSkirt);

  const wcCistern = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(cisternD, cisternH - 0.028, cisternW)),
    vitreousChinaMat
  );
  wcCistern.name = 'bootLobby.downstairsWc.cistern';
  wcCistern.position.set(cisternCenterX, cisternBaseY + 0.028 + (cisternH - 0.028) / 2, toiletZ);
  wcCistern.castShadow = true;
  wcCistern.receiveShadow = true;
  wcGroup.add(wcCistern);

  // Classic Edwardian recessed front panel & oval ceramic maker's badge on the East (+X) face of the cistern
  const cisternFrontPanel = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.012, 0.19, 0.36)),
    vitreousChinaMat
  );
  cisternFrontPanel.name = 'bootLobby.downstairsWc.cisternFrontPanel';
  cisternFrontPanel.position.set(cisternCenterX + cisternD / 2 + 0.004, cisternBaseY + 0.165, toiletZ);
  wcGroup.add(cisternFrontPanel);

  const makerBadgeRim = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.032, 0.032, 0.008, 16)),
      brassMat
    )
  );
  makerBadgeRim.name = 'bootLobby.downstairsWc.makerBadgeRim';
  makerBadgeRim.rotation.z = Math.PI / 2;
  makerBadgeRim.position.set(cisternCenterX + cisternD / 2 + 0.011, cisternBaseY + 0.17, toiletZ);
  makerBadgeRim.scale.set(1.0, 1.35, 0.72);
  wcGroup.add(makerBadgeRim);

  // Stepped overhanging architectural bell-top porcelain cistern lid + central finial boss
  const cisternCorniceStep = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(cisternD + 0.022, 0.024, cisternW + 0.026)),
    vitreousChinaMat
  );
  cisternCorniceStep.name = 'bootLobby.downstairsWc.cisternCorniceStep';
  cisternCorniceStep.position.set(cisternCenterX + 0.004, cisternBaseY + cisternH + 0.012, toiletZ);
  cisternCorniceStep.castShadow = true;
  wcGroup.add(cisternCorniceStep);

  const cisternLid = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(cisternD + 0.006, 0.022, cisternW + 0.008)),
    vitreousChinaMat
  );
  cisternLid.name = 'bootLobby.downstairsWc.cisternLid';
  cisternLid.position.set(cisternCenterX + 0.002, cisternBaseY + cisternH + 0.034, toiletZ);
  cisternLid.castShadow = true;
  wcGroup.add(cisternLid);

  // Ornate pierced cast-brass wall support brackets beneath the cistern (North & South sides)
  const wallLegGeo = createSharedGeo(new THREE.BoxGeometry(0.016, 0.13, 0.024));
  const topArmGeo = createSharedGeo(new THREE.BoxGeometry(0.165, 0.014, 0.022));
  const scrollStrutGeo = createSharedGeo(new THREE.CylinderGeometry(0.006, 0.006, 0.16, 10));

  for (const brkSideZ of [-1, 1] as const) {
    const brkTag = brkSideZ < 0 ? 'north' : 'south';
    const brkZ = toiletZ + brkSideZ * 0.155;
    const wallLeg = tagHighLod(new THREE.Mesh(wallLegGeo, brassMat));
    wallLeg.name = `bootLobby.downstairsWc.cisternBracketLeg.${brkTag}`;
    wallLeg.position.set(-12.8 + 0.014, cisternBaseY - 0.055, brkZ);
    wcGroup.add(wallLeg);

    const topArm = tagHighLod(new THREE.Mesh(topArmGeo, brassMat));
    topArm.name = `bootLobby.downstairsWc.cisternBracketArm.${brkTag}`;
    topArm.position.set(-12.8 + 0.09, cisternBaseY - 0.004, brkZ);
    wcGroup.add(topArm);

    const scrollStrut = tagHighLod(new THREE.Mesh(scrollStrutGeo, brassMat));
    scrollStrut.name = `bootLobby.downstairsWc.cisternBracketScroll.${brkTag}`;
    scrollStrut.rotation.z = -0.82;
    scrollStrut.position.set(-12.8 + 0.075, cisternBaseY - 0.055, brkZ);
    wcGroup.add(scrollStrut);
  }

  // 2E. Traditional Aged-Brass Cranked Flush Lever with Turned White Ceramic Torpedo Handle
  const leverZ = toiletZ + 0.155;
  const leverY = cisternBaseY + 0.235;
  const leverFulcrum = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.018, 0.022, 0.026, 14)),
      brassMat
    )
  );
  leverFulcrum.name = 'bootLobby.downstairsWc.flushLeverFulcrum';
  leverFulcrum.rotation.z = Math.PI / 2;
  leverFulcrum.position.set(cisternCenterX + cisternD / 2 + 0.016, leverY, leverZ);
  wcGroup.add(leverFulcrum);

  const leverArm = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.0055, 0.0055, 0.075, 10)),
      brassMat
    )
  );
  leverArm.name = 'bootLobby.downstairsWc.flushLeverArm';
  leverArm.rotation.x = Math.PI / 2;
  leverArm.rotation.z = -0.22;
  leverArm.position.set(cisternCenterX + cisternD / 2 + 0.032, leverY - 0.008, leverZ + 0.032);
  wcGroup.add(leverArm);

  const ceramicTorpedoHandle = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.011, 0.009, 0.068, 14)),
      vitreousChinaMat
    )
  );
  ceramicTorpedoHandle.name = 'bootLobby.downstairsWc.flushLever';
  ceramicTorpedoHandle.rotation.x = Math.PI / 2;
  ceramicTorpedoHandle.position.set(cisternCenterX + cisternD / 2 + 0.036, leverY - 0.014, leverZ + 0.078);
  ceramicTorpedoHandle.castShadow = true;
  wcGroup.add(ceramicTorpedoHandle);

  const handleFinial = tagHighLod(
    new THREE.Mesh(createSharedGeo(new THREE.SphereGeometry(0.009, 10, 10)), brassMat)
  );
  handleFinial.name = 'bootLobby.downstairsWc.flushLeverFinial';
  handleFinial.position.set(cisternCenterX + cisternD / 2 + 0.036, leverY - 0.014, leverZ + 0.114);
  wcGroup.add(handleFinial);

  // 2F. Exposed 38mm Aged-Brass Flush Pipe, Shroud Collars & 15mm Brass Cold Supply Pipe
  const flushPipeX = -12.8 + 0.125; // -12.675m
  const cisternNut = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.028, 0.028, 0.026, 14)),
      brassMat
    )
  );
  cisternNut.name = 'bootLobby.downstairsWc.cisternNut';
  cisternNut.position.set(flushPipeX, cisternBaseY - 0.012, toiletZ);
  wcGroup.add(cisternNut);

  // Continuous 38mm brass L-bend flush pipe from cistern base down to Y = lowerFloorY + 0.382m and East into pan horn
  const flushPipeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(flushPipeX, cisternBaseY, toiletZ),
    new THREE.Vector3(flushPipeX, lowerFloorY + 0.43, toiletZ),
    new THREE.Vector3(flushPipeX + 0.02, lowerFloorY + 0.385, toiletZ),
    new THREE.Vector3(panCenterX - 0.24, lowerFloorY + 0.382, toiletZ),
  ]);
  const flushPipeMesh = new THREE.Mesh(
    createSharedGeo(new THREE.TubeGeometry(flushPipeCurve, 20, 0.019, 14, false)),
    brassMat
  );
  flushPipeMesh.name = 'bootLobby.downstairsWc.flushPipe';
  flushPipeMesh.castShadow = true;
  wcGroup.add(flushPipeMesh);

  // Stepped brass compression collar where flush pipe enters rear porcelain pan horn
  const panPipeCollar = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.028, 0.032, 0.024, 14)),
      brassMat
    )
  );
  panPipeCollar.name = 'bootLobby.downstairsWc.panPipeCollar';
  panPipeCollar.rotation.z = Math.PI / 2;
  panPipeCollar.position.set(panCenterX - 0.282, lowerFloorY + 0.382, toiletZ);
  wcGroup.add(panPipeCollar);

  // 15mm aged-brass water supply pipe rising from the top of the horizontal waste-pipe boxing on the North side of the cistern
  const supplyPipeX = -12.8 + 0.085;
  const supplyPipeZ = toiletZ - 0.165;
  const supplyPipeBaseY = lowerFloorY + 0.382;
  const supplyPipe = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(
        new THREE.CylinderGeometry(0.008, 0.008, cisternBaseY - supplyPipeBaseY, 10)
      ),
      brassMat
    )
  );
  supplyPipe.name = 'bootLobby.downstairsWc.supplyPipe';
  supplyPipe.position.set(supplyPipeX, (supplyPipeBaseY + cisternBaseY) / 2, supplyPipeZ);
  wcGroup.add(supplyPipe);

  const supplyFloorRose = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.022, 0.024, 0.012, 12)),
      brassMat
    )
  );
  supplyFloorRose.name = 'bootLobby.downstairsWc.supplyFloorRose';
  supplyFloorRose.position.set(supplyPipeX, supplyPipeBaseY + 0.006, supplyPipeZ);
  wcGroup.add(supplyFloorRose);

  // 2G. Matching Heritage Aged-Brass Wall-Mounted Toilet Roll Holder on the North wall (`Z = -2.476m`)
  const rollHolderGroup = new THREE.Group();
  rollHolderGroup.name = 'bootLobby.downstairsWc.toiletRollHolder';
  rollHolderGroup.position.set(-12.32, lowerFloorY + 0.68, -2.476);

  const wallRoseGeo = createSharedGeo(new THREE.CylinderGeometry(0.022, 0.024, 0.01, 14));
  const postArmGeo = createSharedGeo(new THREE.CylinderGeometry(0.007, 0.009, 0.078, 12));
  for (const postX of [-0.072, 0.072] as const) {
    const pTag = postX < 0 ? 'west' : 'east';
    const wallRose = tagHighLod(new THREE.Mesh(wallRoseGeo, brassMat));
    wallRose.name = `bootLobby.downstairsWc.toiletRollHolder.wallRose.${pTag}`;
    wallRose.rotation.x = Math.PI / 2;
    wallRose.position.set(postX, 0, 0.005);
    rollHolderGroup.add(wallRose);

    const postArm = tagHighLod(new THREE.Mesh(postArmGeo, brassMat));
    postArm.name = `bootLobby.downstairsWc.toiletRollHolder.postArm.${pTag}`;
    postArm.rotation.x = Math.PI / 2;
    postArm.position.set(postX, 0, 0.044);
    rollHolderGroup.add(postArm);
  }
  const rollSpindle = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.006, 0.006, 0.156, 12)),
      brassMat
    )
  );
  rollSpindle.name = 'bootLobby.downstairsWc.toiletRollHolder.spindle';
  rollSpindle.rotation.z = Math.PI / 2;
  rollSpindle.position.set(0, 0, 0.078);
  rollHolderGroup.add(rollSpindle);

  const tissueRoll = tagHighLod(
    new THREE.Mesh(
      createSharedGeo(new THREE.CylinderGeometry(0.054, 0.054, 0.11, 20)),
      new THREE.MeshStandardMaterial({ color: 0xf7f5f0, roughness: 0.85, metalness: 0.01 })
    )
  );
  tissueRoll.name = 'bootLobby.downstairsWc.toiletRollHolder.tissueRoll';
  tissueRoll.rotation.z = Math.PI / 2;
  tissueRoll.position.set(0, 0, 0.078);
  tissueRoll.castShadow = true;
  rollHolderGroup.add(tissueRoll);

  tagCutawayWall(rollHolderGroup, wcNorthCutaway);
  wcGroup.add(rollHolderGroup);

  scene.add(wcGroup);
}
