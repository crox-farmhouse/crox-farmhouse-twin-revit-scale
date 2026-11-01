import * as THREE from 'three';
import { buildMitredWallSkirtingGeometry } from '../../../../../engine/geometry/swept-moulding.ts';
import type { CutawayWallDescriptor } from '../../../../../core/types/scene.ts';
import type { SceneBuilderContext } from '../../../../../engine/viewer/scene-types.ts';
import {
  buildArmstrongPaperHolder,
  buildArmstrongRobeHook,
  buildArmstrongWallBasinMixer,
  buildLefroyBrooksCharterhouseWc,
  buildLefroyBrooksLissaDoonWashstand,
  buildPerrinRoweTowelRing,
  getBathroomBrassMaterials,
  wallFacingToRotY,
} from '../../../../../objects/sanitaryware/index.ts';
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
 * honed Carrara marble floor, Farrow & Ball Hague Blue wall linings, 100mm-deep heritage wainscot
 * false stud datum housing the Perrin & Rowe `3681R` rough-in & `3681SB` Satin Brass basin mixer,
 * Vanity Hall In-Frame Campden Shaker 840mm vanity (`RUB-W` + `6800SB`), perimeter backlit Satin Brass
 * mirror, dual brass wall sconces, Lefroy Brooks 1900 Classic Charterhouse low-level WC (`LB 7209 + LB 7212`),
 * and coordinated `6258SB` / `6221SB` Satin Brass accessories.
 */
export function buildDownstairsWcAndCloakroom(
  ctx: SceneBuilderContext,
  kit: DownstairsWcAndCloakroomKit
): void {
  const { lightGroups, scene } = ctx;
  const {
    antiqueOakSkirtingMat,
    brassMat,
    lowerDoorLintelH,
    lowerDoorLintelY,
    lowerFloorY,
    lowerWallH,
    lowerWallMidY,
    tagCutawayWall,
    wallH,
  } = kit;

  const marbleTopY = lowerFloorY + 0.008; // -0.292m finished top of honed Carrara marble floor
  const sbBrass = getBathroomBrassMaterials('SB');

  // Room bounds: X = -12.81m..-11.465m, Z = -2.50m..-0.25m, Y = lowerFloorY = -0.30m
  const wcGroup = new THREE.Group();
  wcGroup.name = 'bootLobby.downstairsWc';
  wcGroup.userData.zone = 'bootLobby';

  // Procedural warm honed Carrara marble texture for the WC floor tiles & datum shelf
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

  // Honed Carrara Marble Tiled Floor covering the interior Downstairs WC floor (exact name required by ufh-system.ts!)
  const wcMarbleFloor = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(1.312, 0.008, 2.216)),
    wcMarbleFloorMat
  );
  wcMarbleFloor.name = 'bootLobby.downstairsWc.marbleFloor';
  wcMarbleFloor.position.set(-12.136, lowerFloorY + 0.004, -1.375);
  wcMarbleFloor.receiveShadow = true;
  wcGroup.add(wcMarbleFloor);

  // Darker heritage painted walls (deep Farrow & Ball Hague Blue / Railings slate-charcoal #253338) on all 4 WC interior faces
  const wcDarkWallMat = new THREE.MeshStandardMaterial({
    color: 0x253338,
    roughness: 0.6,
    metalness: 0.03,
  });
  const oliveJoineryMat = new THREE.MeshStandardMaterial({
    color: 0x3b443c,
    roughness: 0.48,
    metalness: 0.04,
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

  // North exterior wall dark lining around the WC window (X = -12.335m..-11.945m, Y = 0.86m..1.60m), tagged with tagCutawayWall
  const wcNorthCutaway: CutawayWallDescriptor = {
    axis: 'z',
    coord: -2.64,
    minSpan: -12.81,
    maxSpan: -11.45,
    floor: 'ground',
  };
  const northSkirtTopY = lowerFloorY + 0.15;
  const northLiningSpecs = [
    [-12.5635, (northSkirtTopY + wallH) / 2, 0.457, wallH - northSkirtTopY, 'westPier'],
    [-11.7125, (northSkirtTopY + wallH) / 2, 0.465, wallH - northSkirtTopY, 'eastPier'],
    [-12.14, (northSkirtTopY + 0.86) / 2, 0.39, 0.86 - northSkirtTopY, 'spandrelLower'],
    [-12.14, (1.6 + wallH) / 2, 0.39, wallH - 1.6, 'spandrelUpper'],
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

  // =========================================================================
  // 1. ARCHITECTURALLY HONEST 100mm-DEEP FALSE STUD DATUM LEDGE (`Z = -1.32m..-0.38m`)
  //    Houses the concealed Perrin & Rowe `3681R` rough-in body in front of the 240mm solid brick West wall
  // =========================================================================
  const vanityZ = -0.85;
  const falseStudGroup = new THREE.Group();
  falseStudGroup.name = 'bootLobby.downstairsWc.falseStudDatum';

  const falseStudCasing = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.1, 1.13, 0.94)),
    wcDarkWallMat
  );
  falseStudCasing.name = 'bootLobby.downstairsWc.falseStudDatum.casing';
  falseStudCasing.position.set(-12.75, marbleTopY + 0.565, vanityZ);
  falseStudCasing.castShadow = true;
  falseStudCasing.receiveShadow = true;
  falseStudGroup.add(falseStudCasing);

  // Subtle heritage wainscot stiles & top frieze rail framing the upper apron (`Y = marbleTopY + 0.845..1.13m`)
  // while keeping the central mixer zone at `X = -12.70m` completely flush for `3681SB` roses
  const wainscotStileGeo = createSharedGeo(new THREE.BoxGeometry(0.008, 0.27, 0.048));
  for (const [stileTag, stileZ] of [
    ['northStile', -1.296],
    ['southStile', -0.404],
  ] as const) {
    const stile = new THREE.Mesh(wainscotStileGeo, wcDarkWallMat);
    stile.name = `bootLobby.downstairsWc.falseStudDatum.${stileTag}`;
    stile.position.set(-12.696, marbleTopY + 0.99, stileZ);
    falseStudGroup.add(stile);
  }
  const wainscotTopRail = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.008, 0.036, 0.844)),
    wcDarkWallMat
  );
  wainscotTopRail.name = 'bootLobby.downstairsWc.falseStudDatum.topRail';
  wainscotTopRail.position.set(-12.696, marbleTopY + 1.11, vanityZ);
  falseStudGroup.add(wainscotTopRail);

  // Crisp 22mm honed Carrara marble / stone datum ledge (`X = -12.80m..-12.685m` at `Y = marbleTopY + 1.14m`, flush at `Z = -1.32m`)
  const datumMarbleLedge = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.115, 0.022, 0.948)),
    wcMarbleCounterMat
  );
  datumMarbleLedge.name = 'bootLobby.downstairsWc.falseStudDatum.marbleLedge';
  datumMarbleLedge.position.set(-12.7425, marbleTopY + 1.14, -0.846);
  datumMarbleLedge.castShadow = true;
  datumMarbleLedge.receiveShadow = true;
  falseStudGroup.add(datumMarbleLedge);

  wcGroup.add(falseStudGroup);

  // =========================================================================
  // 2. WALL-MOUNTED 0TH PERIOD CERAMIC CLOAKROOM BASIN + EXPOSED `6303SB` BOTTLE TRAP + `3681SB` WALL MIXER + `6235SB` TOWEL RING
  // =========================================================================
  const cloakroomBasin = buildLefroyBrooksLissaDoonWashstand({
    namePrefix: 'bootLobby.downstairsWc.cloakroomWashstand',
    finish: 'SB',
    widthM: 0.56,
    depthM: 0.44,
    rimHeightM: 0.845,
    tapHoles: 0,
    includeDeckMixer: false,
    mixerStyle: 'armstrong',
    mountVariant: 'wallMountedBrackets',
  });
  cloakroomBasin.position.set(-12.7, marbleTopY, vanityZ);
  cloakroomBasin.rotation.y = wallFacingToRotY('east');
  wcGroup.add(cloakroomBasin);

  const towelRing = buildPerrinRoweTowelRing({
    namePrefix: 'bootLobby.downstairsWc.towelRing',
    finish: 'SB',
    style: 'armstrong',
  });
  towelRing.position.set(-12.7, marbleTopY + 1.0, -0.45);
  towelRing.rotation.y = wallFacingToRotY('east');
  wcGroup.add(towelRing);

  const basinMixer = buildArmstrongWallBasinMixer({
    namePrefix: 'bootLobby.downstairsWc.basinMixer',
    finish: 'SB',
  });
  basinMixer.position.set(-12.7, marbleTopY + 0.995, vanityZ);
  basinMixer.rotation.y = wallFacingToRotY('east');
  wcGroup.add(basinMixer);

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

  // Warm Backlit Satin Brass (`SB`) Framed Wall Mirror centered at `Z = -0.85m, Y = lowerFloorY + 1.54m`
  // Sized 0.68m W x 0.70m H so its bottom frame (`lowerFloorY + 1.19m = marbleTopY + 1.182m`) & halo cleanly clear the `marbleTopY + 1.151m` datum shelf!
  const mirrorCenterY = lowerFloorY + 1.54;
  const mirrorFrame = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.028, 0.7, 0.68)),
    sbBrass.primary
  );
  mirrorFrame.name = 'bootLobby.downstairsWc.mirrorFrame';
  mirrorFrame.position.set(-12.761, mirrorCenterY, vanityZ);
  mirrorFrame.castShadow = true;
  wcGroup.add(mirrorFrame);

  const mirrorSurface = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.008, 0.64, 0.62)),
    mirrorGlassMat
  );
  mirrorSurface.name = 'bootLobby.downstairsWc.mirror';
  mirrorSurface.position.set(-12.743, mirrorCenterY, vanityZ);
  wcGroup.add(mirrorSurface);

  // Concealed Warm 2700K Perimeter LED Backlight Frame + Soft Wall-Wash Halo behind the WC Mirror
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

  const horizLedGeo = createSharedGeo(new THREE.BoxGeometry(0.008, 0.014, 0.66));
  const vertLedGeo = createSharedGeo(new THREE.BoxGeometry(0.008, 0.68, 0.014));
  for (const [ledTag, dy, dz, ledGeo] of [
    ['top', 0.342, 0, horizLedGeo],
    ['bottom', -0.342, 0, horizLedGeo],
    ['north', 0, -0.332, vertLedGeo],
    ['south', 0, 0.332, vertLedGeo],
  ] as const) {
    const ledBar = tagHighLod(new THREE.Mesh(ledGeo, wcMirrorLedMat));
    ledBar.name = `bootLobby.downstairsWc.mirrorLedStrip.${ledTag}`;
    ledBar.position.set(-12.781, mirrorCenterY + dy, vanityZ + dz);
    wcGroup.add(ledBar);
  }

  const horizHaloGeo = createSharedGeo(new THREE.BoxGeometry(0.003, 0.028, 0.74));
  const vertHaloGeo = createSharedGeo(new THREE.BoxGeometry(0.003, 0.716, 0.028));
  for (const [haloTag, dy, dz, haloGeo] of [
    ['top', 0.358, 0, horizHaloGeo],
    ['bottom', -0.358, 0, horizHaloGeo],
    ['north', 0, -0.356, vertHaloGeo],
    ['south', 0, 0.356, vertHaloGeo],
  ] as const) {
    const haloStrip = tagHighLod(new THREE.Mesh(haloGeo, wcMirrorHaloMat));
    haloStrip.name = `bootLobby.downstairsWc.mirrorLedHalo.${haloTag}`;
    haloStrip.position.set(-12.7895, mirrorCenterY + dy, vanityZ + dz);
    wcGroup.add(haloStrip);
  }

  // 2 Heritage Brass & Fluted Opal-Glass Wall Sconces mounted on the opposite East partition wall (X = -11.48m, dirX = -1)
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

  // Soft fill from the two opal sconces (parented to the scene root, NEVER to a cutaway group!)
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

    const backplate = new THREE.Mesh(sconceBackplateGeo, brassMat);
    backplate.name = `bootLobby.downstairsWc.wallSconce.${sIdx}.backplate`;
    backplate.rotation.z = Math.PI / 2;
    backplate.position.set(dirX * 0.007, 0, 0);
    backplate.castShadow = true;
    sconceGrp.add(backplate);

    const arm = tagHighLod(new THREE.Mesh(sconceArmGeo, brassMat));
    arm.name = `bootLobby.downstairsWc.wallSconce.${sIdx}.arm`;
    arm.rotation.z = Math.PI / 2;
    arm.position.set(dirX * 0.052, -0.012, 0);
    sconceGrp.add(arm);

    const riser = tagHighLod(new THREE.Mesh(sconceRiserGeo, brassMat));
    riser.name = `bootLobby.downstairsWc.wallSconce.${sIdx}.riser`;
    riser.position.set(dirX * 0.095, 0.01, 0);
    sconceGrp.add(riser);

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

  // =========================================================================
  // 3. ARCHITECTURAL SOIL STACK & HORIZONTAL DUCT BOXING (`bootLobby.downstairsWc.wastePipeBoxing`)
  // =========================================================================
  const wastePipeBoxingGroup = new THREE.Group();
  wastePipeBoxingGroup.name = 'bootLobby.downstairsWc.wastePipeBoxing';

  const vertStackBoxing = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.192, lowerWallH - 0.008, 0.32)),
    wcDarkWallMat
  );
  vertStackBoxing.name = 'bootLobby.downstairsWc.wastePipeBoxing.verticalStack';
  vertStackBoxing.position.set(-12.696, lowerWallMidY + 0.004, -1.48);
  vertStackBoxing.castShadow = true;
  vertStackBoxing.receiveShadow = true;
  wastePipeBoxingGroup.add(vertStackBoxing);

  const horizSoilBoxing = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.172, 0.352, 0.842)),
    wcDarkWallMat
  );
  horizSoilBoxing.name = 'bootLobby.downstairsWc.wastePipeBoxing.horizontalDuct';
  horizSoilBoxing.position.set(-12.706, lowerFloorY + 0.184, -2.061);
  horizSoilBoxing.castShadow = true;
  horizSoilBoxing.receiveShadow = true;
  wastePipeBoxingGroup.add(horizSoilBoxing);

  const horizBoxingCapShelf = new THREE.Mesh(
    createSharedGeo(new THREE.BoxGeometry(0.186, 0.022, 0.846)),
    oliveJoineryMat
  );
  horizBoxingCapShelf.name = 'bootLobby.downstairsWc.wastePipeBoxing.capShelf';
  horizBoxingCapShelf.position.set(-12.699, lowerFloorY + 0.371, -2.061);
  horizBoxingCapShelf.castShadow = true;
  horizBoxingCapShelf.receiveShadow = true;
  wastePipeBoxingGroup.add(horizBoxingCapShelf);

  // 45-degree mitred 146mm antique oak skirting wrapping the waste-pipe boxing up to the X = -12.70m false stud
  const boxSkirt = new THREE.Mesh(
    createSharedGeo(
      buildMitredWallSkirtingGeometry(
        [
          [-12.62, -2.482],
          [-12.62, -1.64],
          [-12.6, -1.64],
          [-12.6, -1.32],
          [-12.7, -1.32],
        ],
        marbleTopY
      )
    ),
    antiqueOakSkirtingMat
  );
  boxSkirt.name = 'bootLobby.downstairsWc.wastePipeBoxing.skirting';
  boxSkirt.castShadow = true;
  boxSkirt.receiveShadow = true;
  wastePipeBoxingGroup.add(boxSkirt);
  wcGroup.add(wastePipeBoxingGroup);

  // =========================================================================
  // 4. GEBERIT ACANTO TURBOFLUSH VORTEX WC (`502.719.00.1`) + PERRIN & ROWE `6772SB` CONCEALED CISTERN LEVER
  // =========================================================================
  const vortexWc = buildLefroyBrooksCharterhouseWc({
    namePrefix: 'bootLobby.downstairsWc.acantoVortexWc',
    finish: 'SB',
    variant: 'backToWallVortex',
    collection: 'acantoVortex',
    lowBoxingDepthM: 0.195,
    concealedLeverYM: 0.86,
    concealedLeverXM: 0.135,
    leverStyle: 'armstrong',
  });
  vortexWc.position.set(-12.8, marbleTopY, -2.04);
  vortexWc.rotation.y = wallFacingToRotY('east');
  wcGroup.add(vortexWc);

  // =========================================================================
  // 5. COORDINATED PERRIN & ROWE `'SB'` SATIN BRASS ACCESSORIES (`6258SB` & `6221SB`)
  // =========================================================================
  const paperHolder = buildArmstrongPaperHolder({
    namePrefix: 'bootLobby.downstairsWc.paperHolder',
    finish: 'SB',
  });
  paperHolder.position.set(-12.32, marbleTopY + 0.68, -2.49);
  paperHolder.rotation.y = wallFacingToRotY('south');
  tagCutawayWall(paperHolder, wcNorthCutaway);
  paperHolder.traverse((node) => {
    if (node instanceof THREE.Mesh) {
      tagCutawayWall(node, wcNorthCutaway);
    }
  });
  wcGroup.add(paperHolder);

  const robeHook = buildArmstrongRobeHook({
    namePrefix: 'bootLobby.downstairsWc.robeHook',
    finish: 'SB',
  });
  robeHook.position.set(-11.472, marbleTopY + 1.68, -0.52);
  robeHook.rotation.y = wallFacingToRotY('west');
  wcGroup.add(robeHook);

  scene.add(wcGroup);
}
