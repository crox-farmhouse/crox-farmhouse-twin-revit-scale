import * as THREE from 'three';
import type { InteractiveUserData, SceneBuilderContext } from '../../../../../core/types/scene.ts';
import {
  createBrushedStainlessTexture,
  createMarbleBacksplashTexture,
  createPolishedChromeTexture,
  createTVArtGalleryTextures,
} from '../../../../../engine/textures/procedural-textures.ts';
import { buildHollowCabinetCarcass } from '../../../../../objects/joinery/cabinet-interior.ts';

function prepGeo<T extends THREE.BufferGeometry>(geo: T): T {
  geo.computeBoundingSphere();
  return geo;
}

function tagHighLod(obj: THREE.Object3D, maxDistance = 14): void {
  obj.userData.lodTier = 'high';
  obj.userData.lodMaxDistance = maxDistance;
}

function nameCarcassHierarchy(root: THREE.Group, prefix: string): void {
  root.name = prefix;
  let idx = 0;
  root.traverse((child) => {
    if (child === root) return;
    if (!child.name) {
      child.name = `${prefix}.part_${idx++}`;
    }
    if (child instanceof THREE.Mesh && child.geometry) {
      if (!child.geometry.boundingSphere) {
        child.geometry.computeBoundingSphere();
      }
      child.geometry.computeBoundingBox();
      const bb = child.geometry.boundingBox;
      if (bb) {
        const sx = bb.max.x - bb.min.x;
        const sy = bb.max.y - bb.min.y;
        const sz = bb.max.z - bb.min.z;
        if (Math.max(sx, sy, sz) < 0.25) {
          tagHighLod(child);
        }
      }
    }
  });
}

// Shared geometries for Utility Room joinery, hardware, Miele washing machines, wall shelf & Pulley Maid
const sharedUtilKnobGeo = prepGeo(new THREE.SphereGeometry(0.014, 10, 8));
const sharedDrainerGrooveGeo = prepGeo(new THREE.BoxGeometry(0.24, 0.004, 0.01));

const sharedMieleCabinetGeo = prepGeo(new THREE.BoxGeometry(0.595, 0.85, 0.6));
const sharedMieleKickPlinthGeo = prepGeo(new THREE.BoxGeometry(0.59, 0.04, 0.56));
const sharedMieleFasciaPanelGeo = prepGeo(new THREE.BoxGeometry(0.595, 0.135, 0.026));
const sharedMieleFasciaSeamGeo = prepGeo(new THREE.BoxGeometry(0.596, 0.004, 0.03));
const sharedMieleDrawerSeamGeo = prepGeo(new THREE.BoxGeometry(0.004, 0.135, 0.03));
const sharedMieleBadgeGeo = prepGeo(new THREE.BoxGeometry(0.048, 0.016, 0.006));
const sharedMieleRotaryDialGeo = prepGeo(new THREE.CylinderGeometry(0.022, 0.022, 0.02, 18));
const sharedMieleDisplayPanelGeo = prepGeo(new THREE.BoxGeometry(0.175, 0.055, 0.006));
const sharedMieleDisplayDigitsGeo = prepGeo(new THREE.PlaneGeometry(0.065, 0.018));
const sharedMieleInnerDrumGeo = prepGeo(new THREE.CylinderGeometry(0.165, 0.165, 0.06, 24));
const sharedMieleRubberGasketGeo = prepGeo(new THREE.TorusGeometry(0.155, 0.016, 12, 24));
const sharedMieleChromeDoorRingGeo = prepGeo(new THREE.TorusGeometry(0.188, 0.034, 16, 32));
const sharedMieleChromeInnerRimGeo = prepGeo(new THREE.TorusGeometry(0.156, 0.012, 12, 28));
const sharedMieleChromeHandleGeo = prepGeo(new THREE.BoxGeometry(0.028, 0.11, 0.022));
const sharedMieleGlassBowlGeo = prepGeo(new THREE.CylinderGeometry(0.154, 0.128, 0.042, 24));
const sharedMieleGlassFrontDiscGeo = prepGeo(new THREE.CylinderGeometry(0.154, 0.154, 0.008, 24));

const sharedShelfWallCleatGeo = prepGeo(new THREE.BoxGeometry(0.038, 0.24, 0.028));
const sharedShelfTopArmGeo = prepGeo(new THREE.BoxGeometry(0.038, 0.028, 0.25));
const sharedShelfBraceStrutGeo = prepGeo(new THREE.BoxGeometry(0.032, 0.25, 0.028));
const sharedShelfTowelGeo = prepGeo(new THREE.BoxGeometry(0.28, 0.038, 0.2));
const sharedShelfJarBodyGeo = prepGeo(new THREE.CylinderGeometry(0.058, 0.058, 0.15, 14));
const sharedShelfJarLidGeo = prepGeo(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 14));

const sharedPulleyLathGeo = prepGeo(new THREE.BoxGeometry(1.46, 0.036, 0.016));
const sharedPulleyRackEndBarGeo = prepGeo(new THREE.BoxGeometry(0.022, 0.048, 0.46));
const sharedPulleyStrutGeo = prepGeo(new THREE.CylinderGeometry(0.007, 0.007, 0.16, 6));
const sharedPulleyTopEyeGeo = prepGeo(new THREE.TorusGeometry(0.016, 0.005, 6, 12));
const sharedPulleyBracketGeo = prepGeo(new THREE.BoxGeometry(0.026, 0.055, 0.036));
const sharedPulleyWheelGeo = prepGeo(new THREE.CylinderGeometry(0.024, 0.024, 0.014, 10));
const sharedPulleyVertRopeGeo = prepGeo(new THREE.CylinderGeometry(0.0045, 0.0045, 0.48, 6));

export function buildUtilityRoomJoineryAndAppliances(
  ctx: SceneBuilderContext
): THREE.MeshStandardMaterial {
  const { scene, cutawayWallGroups, interactiveMeshes, interactions } = ctx;

  // Frame TV (Art Mode) mounted on the X = +1.85m Utility Room West Partition Wall (at X = +1.835m, Z = -1.26m)
  const tvGroup = new THREE.Group();
  tvGroup.name = 'kitchen.frameTv.group';
  tvGroup.position.set(1.835, 1.48, -1.26);
  tvGroup.rotation.y = -Math.PI / 2;

  const tvFrameOakMat = new THREE.MeshStandardMaterial({
    color: 0x7d5836,
    roughness: 0.45,
    metalness: 0.08,
  });
  const tvBezel = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.7, 0.44, 0.035)),
    tvFrameOakMat
  );
  tvBezel.name = 'kitchen.frameTv.oakBezel';
  tvBezel.castShadow = true;
  const tvUserData: InteractiveUserData = { isFrameTV: true };
  tvBezel.userData = tvUserData;
  tvGroup.add(tvBezel);
  interactiveMeshes.push(tvBezel);

  const initialArtTex = createTVArtGalleryTextures()[0];
  const tvScreenMat = new THREE.MeshStandardMaterial({
    map: initialArtTex ?? null,
    color: 0xa69e92,
    roughness: 0.94,
    metalness: 0.0,
    envMapIntensity: 0.0,
    emissiveMap: initialArtTex ?? null,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.04,
  });
  const tvScreen = new THREE.Mesh(
    prepGeo(new THREE.PlaneGeometry(0.64, 0.38)),
    tvScreenMat
  );
  tvScreen.name = 'kitchen.frameTv.artScreen';
  tvScreen.position.set(0, 0, 0.019);
  tvScreen.receiveShadow = true;
  tvScreen.userData = tvUserData;
  tvGroup.add(tvScreen);
  interactiveMeshes.push(tvScreen);

  scene.add(tvGroup);

  // =========================================================================
  // UTILITY ROOM INTERIOR DETAILS (Exact 3.00m x 1.65m Plan: X = +2.00m to +5.00m, Z = -2.50m to -0.85m)
  // =========================================================================
  const utilNorthParent = scene;

  const doveGreyMat = new THREE.MeshStandardMaterial({
    color: 0xa29f97,
    roughness: 0.56,
    metalness: 0.04,
  });
  const utilMarbleTex = createMarbleBacksplashTexture();
  utilMarbleTex.wrapS = THREE.RepeatWrapping;
  utilMarbleTex.wrapT = THREE.RepeatWrapping;
  utilMarbleTex.repeat.set(1.6, 1.0);
  const limestoneMat = new THREE.MeshStandardMaterial({
    map: utilMarbleTex,
    roughness: 0.18,
    metalness: 0.04,
  });
  const brushedStainlessTex = createBrushedStainlessTexture();
  const brushedKnobMat = new THREE.MeshStandardMaterial({
    map: brushedStainlessTex,
    bumpMap: brushedStainlessTex,
    bumpScale: 0.003,
    color: 0xc8c5be,
    roughness: 0.28,
    metalness: 0.48,
  });
  const polishedChromeMat = new THREE.MeshStandardMaterial({
    map: createPolishedChromeTexture(),
    color: 0xe8e5de,
    roughness: 0.06,
    metalness: 0.55,
  });

  const shakerGeometryCache = new Map<
    string,
    {
      readonly insetGeo: THREE.BoxGeometry;
      readonly stileGeo: THREE.BoxGeometry;
      readonly railGeo: THREE.BoxGeometry;
    }
  >();

  const getShakerDoorGeometries = (w: number, h: number, stileW: number) => {
    const key = `${w.toFixed(4)}_${h.toFixed(4)}_${stileW.toFixed(4)}`;
    const existing = shakerGeometryCache.get(key);
    if (existing) return existing;

    const frameThickness = 0.022;
    const innerSpan = Math.max(0.03, w - stileW * 2);
    const created = {
      insetGeo: prepGeo(new THREE.BoxGeometry(w - 0.008, h - 0.008, 0.01)),
      stileGeo: prepGeo(new THREE.BoxGeometry(stileW, h, frameThickness)),
      railGeo: prepGeo(new THREE.BoxGeometry(innerSpan, stileW, frameThickness)),
    };
    shakerGeometryCache.set(key, created);
    return created;
  };

  const addUtilityShakerDoor = (
    doorName: string,
    cx: number,
    cy: number,
    carcassFaceZ: number,
    w: number,
    h: number,
    hingeSide: -1 | 1,
    knobLocalX: number,
    knobLocalY: number,
    stileW = 0.058
  ): void => {
    const doorGroup = new THREE.Group();
    doorGroup.name = doorName;
    doorGroup.position.set(cx, cy, carcassFaceZ);

    const { insetGeo, stileGeo, railGeo } = getShakerDoorGeometries(w, h, stileW);
    const frameThickness = 0.022;

    const insetPanel = new THREE.Mesh(insetGeo, doveGreyMat);
    insetPanel.name = `${doorName}.insetPanel`;
    insetPanel.position.set(0, 0, 0.005);
    insetPanel.receiveShadow = true;
    doorGroup.add(insetPanel);

    for (const [side, sideTag] of [
      [-1, 'leftStile'],
      [1, 'rightStile'],
    ] as const) {
      const stile = new THREE.Mesh(stileGeo, doveGreyMat);
      stile.name = `${doorName}.${sideTag}`;
      stile.position.set(side * (w * 0.5 - stileW * 0.5), 0, frameThickness * 0.5);
      stile.castShadow = true;
      stile.receiveShadow = true;
      doorGroup.add(stile);
    }

    for (const [vSide, railTag] of [
      [-1, 'bottomRail'],
      [1, 'topRail'],
    ] as const) {
      const rail = new THREE.Mesh(railGeo, doveGreyMat);
      rail.name = `${doorName}.${railTag}`;
      rail.position.set(0, vSide * (h * 0.5 - stileW * 0.5), frameThickness * 0.5);
      rail.castShadow = true;
      rail.receiveShadow = true;
      doorGroup.add(rail);
    }

    const knob = new THREE.Mesh(sharedUtilKnobGeo, brushedKnobMat);
    knob.name = `${doorName}.knob`;
    knob.scale.set(1, 1, 0.75);
    knob.position.set(knobLocalX, knobLocalY, 0.03);
    tagHighLod(knob);
    doorGroup.add(knob);

    utilNorthParent.add(doorGroup);
    interactions.registerHingedDoor(
      utilNorthParent,
      doorGroup,
      new THREE.Vector3(hingeSide * (w * 0.5), 0, 0.01),
      'y',
      hingeSide * 1.32
    );
  };

  // 1. LARGE FULL-HEIGHT DOVE GREY UNIT ON THE LEFT-HAND SIDE (X = +2.00m to +2.82m, center X = +2.41m, width 0.82m, height 2.42m)
  const lowerTallCarcass = buildHollowCabinetCarcass(
    utilNorthParent,
    2.41,
    0,
    -2.18,
    0.82,
    0.87,
    0.64,
    '+z',
    doveGreyMat,
    {
      plinthHeight: 0.14,
      interiorStyle: 'utility',
      shelfCount: 1,
      hasCenterMullion: true,
      includeItems: true,
    }
  );
  nameCarcassHierarchy(lowerTallCarcass, 'utility.tallCupboard.lowerCarcass');

  const upperTallCarcass = buildHollowCabinetCarcass(
    utilNorthParent,
    2.41,
    0.87,
    -2.18,
    0.82,
    1.55,
    0.64,
    '+z',
    doveGreyMat,
    {
      plinthHeight: 0,
      interiorStyle: 'utility',
      shelfCount: 3,
      hasCenterMullion: true,
      includeItems: true,
    }
  );
  nameCarcassHierarchy(upperTallCarcass, 'utility.tallCupboard.upperCarcass');

  // 4-tier stepped hollow coving/mantel crown moulding frame wrapping around the Front (+Z) and Right (+X) of the full-height unit
  const tallCorniceTiers: ReadonlyArray<readonly [number, number, number]> = [
    [0.22, 0.018, 0.009],
    [0.46, 0.018, 0.027],
    [0.72, 0.018, 0.045],
    [1.0, 0.024, 0.066],
  ];
  const uRimW = 0.032;
  const uInnerMaxX = 2.41 + 0.82 * 0.5 - uRimW;
  const uInnerMaxZ = -2.18 + 0.64 * 0.5 - uRimW;

  for (let tierIdx = 0; tierIdx < tallCorniceTiers.length; tierIdx++) {
    const [frac, th, yOff] = tallCorniceTiers[tierIdx];
    const oR = 0.038 * frac;
    const oF = 0.038 * frac;
    const outerMinX = 2.41 - 0.82 * 0.5;
    const outerMaxX = 2.41 + 0.82 * 0.5 + oR;
    const outerMinZ = -2.18 - 0.64 * 0.5;
    const outerMaxZ = -2.18 + 0.64 * 0.5 + oF;
    const fullW = outerMaxX - outerMinX;
    const centerX = (outerMinX + outerMaxX) * 0.5;
    const tierY = 2.42 + yOff;

    const frontBar = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(fullW, th, outerMaxZ - uInnerMaxZ)),
      doveGreyMat
    );
    frontBar.name = `utility.tallCupboard.cornice.tier_${tierIdx}_frontBar`;
    frontBar.position.set(centerX, tierY, (uInnerMaxZ + outerMaxZ) * 0.5);
    frontBar.castShadow = true;
    utilNorthParent.add(frontBar);

    const rightSpanZ = uInnerMaxZ - outerMinZ;
    const rightBar = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(outerMaxX - uInnerMaxX, th, rightSpanZ)),
      doveGreyMat
    );
    rightBar.name = `utility.tallCupboard.cornice.tier_${tierIdx}_rightBar`;
    rightBar.position.set((uInnerMaxX + outerMaxX) * 0.5, tierY, (outerMinZ + uInnerMaxZ) * 0.5);
    rightBar.castShadow = true;
    utilNorthParent.add(rightBar);
  }

  // Upper & lower full-overlay Interactive Shaker double doors on the Full-Height Left Utility Unit
  for (const [dx, sideTag] of [
    [2.208, 'Left'],
    [2.612, 'Right'],
  ] as const) {
    const hingeSide: -1 | 1 = dx < 2.41 ? -1 : 1;
    const knobLocalX = dx < 2.41 ? 0.145 : -0.145;
    addUtilityShakerDoor(
      `utility.tallCupboard.upper${sideTag}Door`,
      dx,
      1.645,
      -1.86,
      0.398,
      1.53,
      hingeSide,
      knobLocalX,
      -0.625,
      0.054
    );
    addUtilityShakerDoor(
      `utility.tallCupboard.lower${sideTag}Door`,
      dx,
      0.505,
      -1.86,
      0.398,
      0.73,
      hingeSide,
      knobLocalX,
      0.275,
      0.054
    );
  }

  // 2. UTILITY WORKTOP & SINK BASE UNIT TO THE RIGHT OF THE FULL-HEIGHT UNIT (X = +2.82m to +5.00m, width 2.18m)
  const sinkBaseCarcass = buildHollowCabinetCarcass(
    utilNorthParent,
    3.3,
    0,
    -2.18,
    0.96,
    0.9,
    0.62,
    '+z',
    doveGreyMat,
    {
      plinthHeight: 0.14,
      interiorStyle: 'utility',
      shelfCount: 1,
      hasCenterMullion: true,
      includeItems: true,
    }
  );
  nameCarcassHierarchy(sinkBaseCarcass, 'utility.sinkBase.carcass');

  // 2 Full-Overlay Interactive Shaker doors under the Utility Sink (X = +2.82m to +3.78m)
  for (const [sx, sideTag] of [
    [3.062, 'leftDoor'],
    [3.538, 'rightDoor'],
  ] as const) {
    const hingeSide: -1 | 1 = sx < 3.3 ? -1 : 1;
    const knobLocalX = sx < 3.3 ? 0.18 : -0.18;
    addUtilityShakerDoor(
      `utility.sinkBase.${sideTag}`,
      sx,
      0.505,
      -1.87,
      0.468,
      0.73,
      hingeSide,
      knobLocalX,
      0.285,
      0.054
    );
  }

  // Single Dove Grey support panel between the Sink Base Unit and the Left Miele Washing Machine (at X = +3.79m)
  const dividerCheek = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.022, 0.9, 0.62)),
    doveGreyMat
  );
  dividerCheek.name = 'utility.worktop.dividerCheek';
  dividerCheek.position.set(3.79, 0.45, -2.18);
  utilNorthParent.add(dividerCheek);

  // Continuous Carrara marble worktop from the right side of the full-height unit (X = +2.82m) to East outside wall (X = +5.00m)
  const utilTop = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(2.18, 0.045, 0.65)),
    limestoneMat
  );
  utilTop.name = 'utility.worktop.marbleSlab';
  utilTop.position.set(3.91, 0.92, -2.17);
  utilTop.castShadow = true;
  utilTop.receiveShadow = true;
  utilNorthParent.add(utilTop);

  // Marble upstand along the Utility Room worktop back wall & right-hand East outside wall
  const utilBackUpstand = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(2.18, 0.095, 0.022)),
    limestoneMat
  );
  utilBackUpstand.name = 'utility.worktop.backUpstand';
  utilBackUpstand.position.set(3.91, 0.9875, -2.484);
  utilNorthParent.add(utilBackUpstand);

  const utilRightUpstand = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.022, 0.095, 0.65)),
    limestoneMat
  );
  utilRightUpstand.name = 'utility.worktop.rightUpstand';
  utilRightUpstand.position.set(4.989, 0.9875, -2.17);
  utilNorthParent.add(utilRightUpstand);

  // Utility Sink positioned to the right of the full-height unit (at X = +3.22m, Z = -2.17m)
  const utilSinkRim = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.54, 0.02, 0.44)),
    new THREE.MeshStandardMaterial({ color: 0xfaf8f2, roughness: 0.18 })
  );
  utilSinkRim.name = 'utility.sink.ceramicRim';
  utilSinkRim.position.set(3.22, 0.944, -2.17);
  utilNorthParent.add(utilSinkRim);

  const utilSinkBasin = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.48, 0.024, 0.38)),
    new THREE.MeshStandardMaterial({ color: 0xc8c4ba, roughness: 0.28 })
  );
  utilSinkBasin.name = 'utility.sink.basin';
  utilSinkBasin.position.set(3.22, 0.947, -2.17);
  utilNorthParent.add(utilSinkBasin);

  // Routed marble drainer grooves to the right of the Utility Sink (X = +3.62m)
  const grooveMat = new THREE.MeshStandardMaterial({ color: 0xd8d3c8, roughness: 0.26 });
  const grooveZs = [-2.32, -2.245, -2.17, -2.095, -2.02] as const;
  for (let i = 0; i < grooveZs.length; i++) {
    const groove = new THREE.Mesh(sharedDrainerGrooveGeo, grooveMat);
    groove.name = `utility.sink.drainerGroove_${i}`;
    groove.position.set(3.62, 0.946, grooveZs[i]);
    tagHighLod(groove);
    utilNorthParent.add(groove);
  }

  // Polished Chrome Swan-Neck Mixer Tap at the back of the Utility Sink (X = +3.22m, Z = -2.41m)
  const utilTapBase = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.14, 0.024, 0.04)),
    polishedChromeMat
  );
  utilTapBase.name = 'utility.sinkTap.base';
  utilTapBase.position.set(3.22, 0.955, -2.41);
  tagHighLod(utilTapBase);
  utilNorthParent.add(utilTapBase);

  const utilTapStem = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.013, 0.015, 0.24, 12)),
    polishedChromeMat
  );
  utilTapStem.name = 'utility.sinkTap.stem';
  utilTapStem.position.set(3.22, 1.07, -2.41);
  utilTapStem.castShadow = true;
  utilNorthParent.add(utilTapStem);

  const utilTapSpout = new THREE.Mesh(
    prepGeo(new THREE.TorusGeometry(0.088, 0.012, 10, 18, Math.PI)),
    polishedChromeMat
  );
  utilTapSpout.name = 'utility.sinkTap.swanNeckSpout';
  utilTapSpout.rotation.y = Math.PI / 2;
  utilTapSpout.position.set(3.22, 1.18, -2.322);
  utilTapSpout.castShadow = true;
  utilNorthParent.add(utilTapSpout);

  // 3. PAIR OF MIELE WASHING MACHINES WITH CHROME DOORS & GLASS WINDOWS
  const mieleWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xf5f4ef,
    roughness: 0.22,
    metalness: 0.05,
  });
  const mieleDarkRecessMat = new THREE.MeshStandardMaterial({
    color: 0x16191e,
    roughness: 0.4,
    metalness: 0.25,
  });
  const mieleGlassWindowMat = new THREE.MeshStandardMaterial({
    color: 0x141d26,
    transparent: true,
    opacity: 0.48,
    roughness: 0.06,
    metalness: 0.38,
  });
  const mieleBadgeRedMat = new THREE.MeshBasicMaterial({
    color: 0xb81d13,
  });
  const mieleDisplayLedMat = new THREE.MeshBasicMaterial({
    color: 0xffd28a,
  });

  for (const [wx, machineName] of [
    [4.1, 'utility.mieleWasherLeft'],
    [4.7, 'utility.mieleWasherRight'],
  ] as const) {
    const mieleGroup = new THREE.Group();
    mieleGroup.name = machineName;
    mieleGroup.position.set(wx, 0, -2.17);

    // Main Lotus White Miele cabinet body (0.595m wide x 0.85m tall x 0.60m deep)
    const cabinet = new THREE.Mesh(sharedMieleCabinetGeo, mieleWhiteMat);
    cabinet.name = `${machineName}.cabinet`;
    cabinet.position.set(0, 0.445, 0);
    cabinet.castShadow = true;
    cabinet.receiveShadow = true;
    mieleGroup.add(cabinet);

    // Recessed dark kick plinth at bottom
    const kickPlinth = new THREE.Mesh(sharedMieleKickPlinthGeo, mieleDarkRecessMat);
    kickPlinth.name = `${machineName}.kickPlinth`;
    kickPlinth.position.set(0, 0.02, 0);
    mieleGroup.add(kickPlinth);

    // Top Miele slanted control fascia panel (Y = 0.745m..0.885m)
    const fasciaPanel = new THREE.Mesh(sharedMieleFasciaPanelGeo, mieleWhiteMat);
    fasciaPanel.name = `${machineName}.fasciaPanel`;
    fasciaPanel.position.set(0, 0.815, 0.302);
    fasciaPanel.rotation.x = -0.08;
    mieleGroup.add(fasciaPanel);

    // Fascia divider groove & left detergent drawer seam
    const fasciaSeam = new THREE.Mesh(sharedMieleFasciaSeamGeo, mieleDarkRecessMat);
    fasciaSeam.name = `${machineName}.fasciaSeam`;
    fasciaSeam.position.set(0, 0.745, 0.302);
    tagHighLod(fasciaSeam);
    mieleGroup.add(fasciaSeam);

    const drawerSeam = new THREE.Mesh(sharedMieleDrawerSeamGeo, mieleDarkRecessMat);
    drawerSeam.name = `${machineName}.drawerSeam`;
    drawerSeam.position.set(-0.085, 0.815, 0.303);
    tagHighLod(drawerSeam);
    mieleGroup.add(drawerSeam);

    // Red Miele logo badge on the detergent drawer
    const mieleBadge = new THREE.Mesh(sharedMieleBadgeGeo, mieleBadgeRedMat);
    mieleBadge.name = `${machineName}.mieleBadge`;
    mieleBadge.position.set(-0.19, 0.835, 0.315);
    tagHighLod(mieleBadge);
    mieleGroup.add(mieleBadge);

    // Central Miele Polished Chrome rotary programme selector dial
    const rotaryDial = new THREE.Mesh(sharedMieleRotaryDialGeo, polishedChromeMat);
    rotaryDial.name = `${machineName}.rotaryDial`;
    rotaryDial.rotation.x = Math.PI / 2;
    rotaryDial.position.set(0.01, 0.815, 0.318);
    tagHighLod(rotaryDial);
    mieleGroup.add(rotaryDial);

    // Right-side dark glass M-Touch status display with glowing warm readout
    const displayPanel = new THREE.Mesh(sharedMieleDisplayPanelGeo, mieleDarkRecessMat);
    displayPanel.name = `${machineName}.displayPanel`;
    displayPanel.position.set(0.165, 0.815, 0.315);
    tagHighLod(displayPanel);
    mieleGroup.add(displayPanel);

    const displayDigits = new THREE.Mesh(sharedMieleDisplayDigitsGeo, mieleDisplayLedMat);
    displayDigits.name = `${machineName}.displayDigits`;
    displayDigits.position.set(0.155, 0.815, 0.319);
    tagHighLod(displayDigits);
    mieleGroup.add(displayDigits);

    // Internal perforated Brushed Stainless Steel Miele Honeycomb Drum
    const innerDrumBack = new THREE.Mesh(sharedMieleInnerDrumGeo, brushedKnobMat);
    innerDrumBack.name = `${machineName}.innerDrumBack`;
    innerDrumBack.rotation.x = Math.PI / 2;
    innerDrumBack.position.set(0, 0.425, 0.275);
    mieleGroup.add(innerDrumBack);

    const rubberGasket = new THREE.Mesh(sharedMieleRubberGasketGeo, mieleDarkRecessMat);
    rubberGasket.name = `${machineName}.rubberGasket`;
    rubberGasket.position.set(0, 0.425, 0.302);
    mieleGroup.add(rubberGasket);

    // Interactive Hinged Chrome & Curved Glass Porthole Door Assembly
    const mieleDoorGroup = new THREE.Group();
    mieleDoorGroup.name = `${machineName}.portholeDoor`;
    mieleDoorGroup.position.set(0, 0.425, 0.316);

    // Shiny Polished Chrome Outer Porthole Door Ring
    const chromeDoorRing = new THREE.Mesh(sharedMieleChromeDoorRingGeo, polishedChromeMat);
    chromeDoorRing.name = `${machineName}.portholeDoor.chromeOuterRing`;
    chromeDoorRing.scale.set(1, 1, 0.48);
    chromeDoorRing.castShadow = true;
    mieleDoorGroup.add(chromeDoorRing);

    // Inner Chrome Bevel Ring framing the glass window
    const chromeInnerRim = new THREE.Mesh(sharedMieleChromeInnerRimGeo, polishedChromeMat);
    chromeInnerRim.name = `${machineName}.portholeDoor.chromeInnerRim`;
    chromeInnerRim.scale.set(1, 1, 0.5);
    chromeInnerRim.position.set(0, 0, 0.008);
    mieleDoorGroup.add(chromeInnerRim);

    // Chrome door handle pull grip integrated at the 3 o'clock position of the chrome door ring
    const chromeDoorHandle = new THREE.Mesh(sharedMieleChromeHandleGeo, polishedChromeMat);
    chromeDoorHandle.name = `${machineName}.portholeDoor.handle`;
    chromeDoorHandle.position.set(0.185, 0, 0.014);
    tagHighLod(chromeDoorHandle);
    mieleDoorGroup.add(chromeDoorHandle);

    // Curved Tinted Glass Porthole Window Bowl & Front Glass Pane
    const glassWindowBowl = new THREE.Mesh(sharedMieleGlassBowlGeo, mieleGlassWindowMat);
    glassWindowBowl.name = `${machineName}.portholeDoor.glassWindowBowl`;
    glassWindowBowl.rotation.x = Math.PI / 2;
    glassWindowBowl.position.set(0, 0, -0.008);
    mieleDoorGroup.add(glassWindowBowl);

    const glassFrontDisc = new THREE.Mesh(sharedMieleGlassFrontDiscGeo, mieleGlassWindowMat);
    glassFrontDisc.name = `${machineName}.portholeDoor.glassFrontDisc`;
    glassFrontDisc.rotation.x = Math.PI / 2;
    glassFrontDisc.position.set(0, 0, 0.01);
    mieleDoorGroup.add(glassFrontDisc);

    mieleGroup.add(mieleDoorGroup);
    interactions.registerHingedDoor(
      mieleGroup,
      mieleDoorGroup,
      new THREE.Vector3(-0.19, 0, 0),
      'y',
      -1.35
    );

    utilNorthParent.add(mieleGroup);
  }

  // 4. WALL SHELF WITH WOODEN BRACKETS ABOVE THE WASHING MACHINES (X = +3.79m to +5.00m, center X = +4.395m, Y = 1.64m)
  const shelfGroup = new THREE.Group();
  shelfGroup.name = 'utility.wallShelf';
  shelfGroup.position.set(4.395, 1.64, -2.35);

  const oakBracketMat = new THREE.MeshStandardMaterial({
    color: 0x946b42,
    roughness: 0.52,
    metalness: 0.05,
  });

  // Solid wooden wall shelf plank (1.21m wide x 0.032m thick x 0.28m deep)
  const shelfPlank = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(1.21, 0.032, 0.28)),
    oakBracketMat
  );
  shelfPlank.name = 'utility.wallShelf.plank';
  shelfPlank.position.set(0, 0, 0);
  shelfPlank.castShadow = true;
  shelfPlank.receiveShadow = true;
  shelfGroup.add(shelfPlank);

  // 3 Wooden Corbel Brackets underneath the shelf (left, center, right)
  const bracketXs = [-0.48, 0.0, 0.48] as const;
  for (let i = 0; i < bracketXs.length; i++) {
    const bx = bracketXs[i];
    const wallCleat = new THREE.Mesh(sharedShelfWallCleatGeo, oakBracketMat);
    wallCleat.name = `utility.wallShelf.bracket_${i}.wallCleat`;
    wallCleat.position.set(bx, -0.135, -0.125);
    wallCleat.castShadow = true;
    shelfGroup.add(wallCleat);

    const topArm = new THREE.Mesh(sharedShelfTopArmGeo, oakBracketMat);
    topArm.name = `utility.wallShelf.bracket_${i}.topArm`;
    topArm.position.set(bx, -0.03, -0.01);
    topArm.castShadow = true;
    shelfGroup.add(topArm);

    const braceStrut = new THREE.Mesh(sharedShelfBraceStrutGeo, oakBracketMat);
    braceStrut.name = `utility.wallShelf.bracket_${i}.braceStrut`;
    braceStrut.rotation.x = -0.76;
    braceStrut.position.set(bx, -0.125, -0.02);
    braceStrut.castShadow = true;
    shelfGroup.add(braceStrut);
  }

  // Folded stacks of fresh utility room linen towels & glass laundry jars on top of the shelf
  const linenMatWhite = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.78 });
  const linenMatSage = new THREE.MeshStandardMaterial({ color: 0x8fa18e, roughness: 0.78 });
  const towelConfigs = [
    [-0.34, 0.036, linenMatSage],
    [-0.34, 0.078, linenMatWhite],
    [-0.34, 0.118, linenMatWhite],
  ] as const;
  for (let i = 0; i < towelConfigs.length; i++) {
    const [tx, ty, mat] = towelConfigs[i];
    const towel = new THREE.Mesh(sharedShelfTowelGeo, mat);
    towel.name = `utility.wallShelf.towelStack_${i}`;
    towel.position.set(tx, ty, 0);
    towel.castShadow = true;
    tagHighLod(towel);
    shelfGroup.add(towel);
  }

  const jarGlassMat = new THREE.MeshStandardMaterial({
    color: 0xeaf2f5,
    transparent: true,
    opacity: 0.55,
    roughness: 0.1,
  });
  const jarXs = [0.16, 0.36] as const;
  for (let i = 0; i < jarXs.length; i++) {
    const jx = jarXs[i];
    const jar = new THREE.Mesh(sharedShelfJarBodyGeo, jarGlassMat);
    jar.name = `utility.wallShelf.laundryJar_${i}.body`;
    jar.position.set(jx, 0.09, 0);
    tagHighLod(jar);
    shelfGroup.add(jar);

    const jarLid = new THREE.Mesh(sharedShelfJarLidGeo, oakBracketMat);
    jarLid.name = `utility.wallShelf.laundryJar_${i}.lid`;
    jarLid.position.set(jx, 0.17, 0);
    tagHighLod(jarLid);
    shelfGroup.add(jarLid);
  }

  cutawayWallGroups.north.add(shelfGroup);

  // Traditional Interactive Pulley Maid Ceiling Clothes Airer inside the 3.00m x 1.65m Utility Room
  const pulleyMaidGroup = new THREE.Group();
  pulleyMaidGroup.name = 'utility.pulleyMaid';
  pulleyMaidGroup.position.set(3.84, 0, -1.28);

  const rackMovingGroup = new THREE.Group();
  rackMovingGroup.name = 'utility.pulleyMaid.rackMovingGroup';
  pulleyMaidGroup.add(rackMovingGroup);

  const castIronMat = new THREE.MeshStandardMaterial({
    color: 0x1e2125,
    roughness: 0.48,
    metalness: 0.65,
  });
  const pineLathMat = new THREE.MeshStandardMaterial({
    color: 0xd9bc8c,
    roughness: 0.58,
    metalness: 0.02,
  });
  const cottonRopeMat = new THREE.MeshStandardMaterial({
    color: 0xe6decb,
    roughness: 0.85,
  });

  const rackY = 2.34;
  // 4 Wooden drying laths (1.46m long x 0.036m tall x 0.016m thick)
  const lathZs = [-0.2, -0.067, 0.067, 0.2] as const;
  for (let i = 0; i < lathZs.length; i++) {
    const lath = new THREE.Mesh(sharedPulleyLathGeo, pineLathMat);
    lath.name = `utility.pulleyMaid.lath_${i}`;
    lath.position.set(0, rackY, lathZs[i]);
    lath.castShadow = true;
    rackMovingGroup.add(lath);
  }

  const vertRopes: THREE.Mesh[] = [];
  const pulleyWheels: THREE.Mesh[] = [];

  // 2 Traditional Cast-Iron Rack Ends + Ceiling Pulleys + Vertical Hoist Ropes (at localX = -0.54m and +0.54m)
  const rackEndXs = [-0.54, 0.54] as const;
  for (let i = 0; i < rackEndXs.length; i++) {
    const rx = rackEndXs[i];
    // Cast-iron horizontal lath carrier bar
    const rackEndBar = new THREE.Mesh(sharedPulleyRackEndBarGeo, castIronMat);
    rackEndBar.name = `utility.pulleyMaid.rackEnd_${i}.endBar`;
    rackEndBar.position.set(rx, rackY, 0);
    rackEndBar.castShadow = true;
    rackMovingGroup.add(rackEndBar);

    // Arched cast-iron suspension yoke above each rack end
    for (const [sideZ, sideTag] of [
      [-0.14, 'strutNorth'],
      [0.14, 'strutSouth'],
    ] as const) {
      const strut = new THREE.Mesh(sharedPulleyStrutGeo, castIronMat);
      strut.name = `utility.pulleyMaid.rackEnd_${i}.${sideTag}`;
      strut.position.set(rx, rackY + 0.065, sideZ * 0.5);
      strut.rotation.x = sideZ < 0 ? -0.68 : 0.68;
      tagHighLod(strut);
      rackMovingGroup.add(strut);
    }

    const topEye = new THREE.Mesh(sharedPulleyTopEyeGeo, castIronMat);
    topEye.name = `utility.pulleyMaid.rackEnd_${i}.topEye`;
    topEye.rotation.y = Math.PI / 2;
    topEye.position.set(rx, rackY + 0.125, 0);
    tagHighLod(topEye);
    rackMovingGroup.add(topEye);

    // Ceiling-mounted cast-iron screw pulley wheel & bracket (at Y = 2.96m)
    const pulleyBracket = new THREE.Mesh(sharedPulleyBracketGeo, castIronMat);
    pulleyBracket.name = `utility.pulleyMaid.ceilingPulley_${i}.bracket`;
    pulleyBracket.position.set(rx, 2.965, 0);
    tagHighLod(pulleyBracket);
    pulleyMaidGroup.add(pulleyBracket);

    const pulleyWheel = new THREE.Mesh(sharedPulleyWheelGeo, castIronMat);
    pulleyWheel.name = `utility.pulleyMaid.ceilingPulley_${i}.wheel`;
    pulleyWheel.rotation.x = Math.PI / 2;
    pulleyWheel.position.set(rx, 2.945, 0);
    tagHighLod(pulleyWheel);
    pulleyMaidGroup.add(pulleyWheel);
    pulleyWheels.push(pulleyWheel);

    // Vertical cotton hoist cord from ceiling pulley down to rack end eye
    const vertRope = new THREE.Mesh(sharedPulleyVertRopeGeo, cottonRopeMat);
    vertRope.name = `utility.pulleyMaid.vertHoistRope_${i}`;
    vertRope.position.set(rx, 2.705, 0);
    pulleyMaidGroup.add(vertRope);
    vertRopes.push(vertRope);
  }

  // Horizontal ceiling rope running from left pulley across right double-pulley to East utility wall
  const ceilingRope = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.0045, 0.0045, 1.68, 6)),
    cottonRopeMat
  );
  ceilingRope.name = 'utility.pulleyMaid.ceilingHorizontalRope';
  ceilingRope.rotation.z = Math.PI / 2;
  ceilingRope.position.set(0.3, 2.95, 0);
  tagHighLod(ceilingRope);
  pulleyMaidGroup.add(ceilingRope);

  // Wall guide pulley at top of East utility wall (X = +4.98m) + vertical haul rope down to cast-iron wall cleat hook
  const wallPulley = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.035, 0.045, 0.03)),
    castIronMat
  );
  wallPulley.name = 'utility.pulleyMaid.wallGuidePulley';
  wallPulley.position.set(1.14, 2.95, 0);
  tagHighLod(wallPulley);
  pulleyMaidGroup.add(wallPulley);

  const wallHaulRope = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.005, 0.005, 1.56, 6)),
    cottonRopeMat
  );
  wallHaulRope.name = 'utility.pulleyMaid.wallHaulRope';
  wallHaulRope.position.set(1.14, 2.17, 0);
  pulleyMaidGroup.add(wallHaulRope);

  const wallCleat = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.028, 0.13, 0.024)),
    castIronMat
  );
  wallCleat.name = 'utility.pulleyMaid.wallCleat';
  wallCleat.position.set(1.15, 1.38, 0);
  tagHighLod(wallCleat);
  pulleyMaidGroup.add(wallCleat);

  scene.add(pulleyMaidGroup);
  interactions.registerPulleyMaid({
    clickRoot: pulleyMaidGroup,
    rackMovingGroup,
    vertRopes,
    pulleyWheels,
    wallHaulRope,
    baseRopeLength: 0.48,
    pulleyCeilingY: 2.945,
    baseRackEyeY: rackY + 0.125,
    baseWallRopeLength: 1.56,
    wallPulleyY: 2.95,
    dropDistance: 0.84,
  });

  return tvScreenMat;
}
