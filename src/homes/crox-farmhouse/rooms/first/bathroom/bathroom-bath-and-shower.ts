import * as THREE from 'three';
import { EAST_WING_BATHROOM_VAULT } from '../../../structure/first-floor-materials.ts';
import {
  buildArmstrongConcealedShowerSet,
  buildArmstrongFreestandingBathMixer,
  buildBcDesignsCopperBoatBath,
  getAcrymiteWhiteMaterial,
  getBathroomBrassMaterials,
  getBathroomTextileMaterials,
  getHonedCarraraMarbleMaterial,
  getZelligeCreamWallTileMaterial,
  prepGeo,
  wallFacingToRotY,
} from '../../../../../objects/sanitaryware/index.ts';
import {
  ROOM17_OPTION1_PLANES,
  SOUTH_SHOWER_NICHE_OPENING,
  WEST_SHOWER_NICHE_OPENING,
} from './bathroom-panelling-and-linings.ts';

export interface FamilyBathroomBathAndShowerKit {
  brassMat: THREE.Material;
  ceramicWhiteMat: THREE.Material;
  floorTopY: number;
  windowGlassMat: THREE.Material;
}

const SHOWER_TRAY_BOUNDS = {
  westX: ROOM17_OPTION1_PLANES.showerWestX, // -10.77m
  eastX: ROOM17_OPTION1_PLANES.eastWallX, // -9.80m (970mm W)
  northZ: ROOM17_OPTION1_PLANES.showerNorthZ, // -0.68m
  southZ: ROOM17_OPTION1_PLANES.showerSouthZ, // +0.48m (1,160mm D)
} as const;

const TOWEL_RAIL_SPEC = {
  wallFaceX: ROOM17_OPTION1_PLANES.eastWallX - ROOM17_OPTION1_PLANES.plasterLiningDepth, // -9.8075m
  baseY: 3.53,
  centerZ: -1.03, // Z = -1.26..-0.80m (right outside SE shower door at -0.68m, well clear of Z = -1.55m roll holder!)
  height: 0.72,
  halfSpanZ: 0.23,
  standOffX: -0.095,
} as const;

const BOAT_BATH_PLACEMENT = {
  centerX: -11.58,
  bathCenterZ: -1.68,
  mixerCenterZ: -2.14,
  lengthM: 1.7,
  widthM: 0.74,
  endHeightM: 0.676,
  centerHeightM: 0.64,
} as const;

function setWorldZelligeBoxUVs(
  geo: THREE.BufferGeometry,
  sx: number,
  sy: number,
  sz: number
): THREE.BufferGeometry {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const norm = geo.getAttribute('normal') as THREE.BufferAttribute;
  const uv = geo.getAttribute('uv') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const nx = Math.abs(norm.getX(i));
    const ny = Math.abs(norm.getY(i));
    let u = x + sx * 0.5;
    let v = y + sy * 0.5;
    if (nx > 0.5) {
      u = z + sz * 0.5;
      v = y + sy * 0.5;
    } else if (ny > 0.5) {
      u = x + sx * 0.5;
      v = z + sz * 0.5;
    }
    uv.setXY(i, u * 0.66, v * 0.5);
  }
  uv.needsUpdate = true;
  return prepGeo(geo);
}

/**
 * Adds a concealed warm 2700K IP67 LED diffuser channel + warm bounce wash inside a recessed shower niche (Issue #2).
 */
function addRecessedNicheWarmLedStrip(
  parent: THREE.Group,
  namePrefix: string,
  alongAxis: 'x' | 'z',
  spanLen: number,
  x: number,
  y: number,
  z: number,
  brBrass: ReturnType<typeof getBathroomBrassMaterials>,
  ledStripMat: THREE.Material
): void {
  const channelW = alongAxis === 'x' ? spanLen - 0.016 : 0.014;
  const channelD = alongAxis === 'z' ? spanLen - 0.016 : 0.014;
  const housing = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(channelW, 0.006, channelD)),
    brBrass.primary
  );
  housing.name = `${namePrefix}.brassChannel`;
  housing.position.set(x, y + 0.002, z);
  parent.add(housing);

  const diffuserW = alongAxis === 'x' ? spanLen - 0.022 : 0.009;
  const diffuserD = alongAxis === 'z' ? spanLen - 0.022 : 0.009;
  const diffuser = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(diffuserW, 0.004, diffuserD)),
    ledStripMat
  );
  diffuser.name = `${namePrefix}.warm2700kStrip`;
  diffuser.position.set(x, y - 0.001, z);
  parent.add(diffuser);
}

function buildShowerEnclosureWithLitNiches(
  scene: THREE.Group,
  floorTopY: number,
  windowGlassMat: THREE.Material,
  brBrass: ReturnType<typeof getBathroomBrassMaterials>,
  acrymiteWhiteMat: THREE.Material,
  zelligeTileMat: THREE.Material,
  carraraMat: THREE.Material
): void {
  const showerGroup = new THREE.Group();
  showerGroup.name = 'familyBathroom.showerEnclosure';

  const {
    westX: trayWestX,
    eastX: trayEastX,
    northZ: trayNorthZ,
    southZ: traySouthZ,
  } = SHOWER_TRAY_BOUNDS;
  const trayW = trayEastX - trayWestX; // 0.97m
  const trayL = traySouthZ - trayNorthZ; // 1.16m
  const trayCx = (trayWestX + trayEastX) * 0.5; // -10.285m
  const trayCz = (trayNorthZ + traySouthZ) * 0.5; // -0.10m

  const rimH = 0.038;
  const wellTopY = floorTopY + 0.027;
  const rimTopY = floorTopY + rimH; // 2.198m
  const rimW = 0.046;

  // =========================================================================
  // 1. LOW-PROFILE WHITE STONE-RESIN SHOWER TRAY (970 × 1,160 × 38mm)
  // =========================================================================
  const trayAssembly = new THREE.Group();
  trayAssembly.name = 'familyBathroom.showerTray';

  const baseWell = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(trayW - 0.006, 0.027, trayL - 0.006)),
    acrymiteWhiteMat
  );
  baseWell.name = 'familyBathroom.showerTray.standingWell';
  baseWell.position.set(trayCx, floorTopY + 0.0135, trayCz);
  baseWell.castShadow = true;
  baseWell.receiveShadow = true;
  trayAssembly.add(baseWell);

  const nsRimGeo = prepGeo(new THREE.BoxGeometry(trayW, rimH, rimW));
  for (const [edgeName, rz] of [
    ['northRim', trayNorthZ + rimW * 0.5],
    ['southRim', traySouthZ - rimW * 0.5],
  ] as const) {
    const rim = new THREE.Mesh(nsRimGeo, acrymiteWhiteMat);
    rim.name = `familyBathroom.showerTray.${edgeName}`;
    rim.position.set(trayCx, floorTopY + rimH * 0.5, rz);
    rim.castShadow = true;
    rim.receiveShadow = true;
    trayAssembly.add(rim);
  }

  const ewRimGeo = prepGeo(new THREE.BoxGeometry(rimW, rimH, trayL - rimW * 2));
  for (const [edgeName, rx] of [
    ['westRim', trayWestX + rimW * 0.5],
    ['eastRim', trayEastX - rimW * 0.5],
  ] as const) {
    const rim = new THREE.Mesh(ewRimGeo, acrymiteWhiteMat);
    rim.name = `familyBathroom.showerTray.${edgeName}`;
    rim.position.set(rx, floorTopY + rimH * 0.5, trayCz);
    rim.castShadow = true;
    rim.receiveShadow = true;
    trayAssembly.add(rim);
  }

  const innerStep = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(trayW - rimW * 2 - 0.016, 0.0025, trayL - rimW * 2 - 0.016)),
    acrymiteWhiteMat
  );
  innerStep.name = 'familyBathroom.showerTray.innerDrainDeck';
  innerStep.position.set(trayCx, wellTopY + 0.001, trayCz);
  innerStep.receiveShadow = true;
  trayAssembly.add(innerStep);

  const drainX = trayCx;
  const drainZ = 0.2;
  const creaseMat = new THREE.MeshStandardMaterial({
    color: 0xe2e0da,
    roughness: 0.22,
    metalness: 0.0,
  });
  for (const [cName, cxCorner, czCorner] of [
    ['nwFallCrease', trayWestX + rimW, trayNorthZ + rimW],
    ['neFallCrease', trayEastX - rimW, trayNorthZ + rimW],
    ['swFallCrease', trayWestX + rimW, traySouthZ - rimW],
    ['seFallCrease', trayEastX - rimW, traySouthZ - rimW],
  ] as const) {
    const dx = drainX - cxCorner;
    const dz = drainZ - czCorner;
    const segLen = Math.max(0.08, Math.hypot(dx, dz) - 0.055);
    const crease = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(0.003, 0.0015, segLen)),
      creaseMat
    );
    crease.name = `familyBathroom.showerTray.${cName}`;
    crease.userData.lodTier = 'high';
    crease.userData.lodMaxDistance = 12;
    crease.rotation.y = Math.atan2(dx, dz);
    crease.position.set(cxCorner + dx * 0.52, wellTopY + 0.0024, czCorner + dz * 0.52);
    trayAssembly.add(crease);
  }

  showerGroup.add(trayAssembly);

  const wasteRecess = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.048, 0.046, 0.003, 24)),
    brBrass.darkShadow
  );
  wasteRecess.name = 'familyBathroom.showerEnclosure.lpw90WasteCup';
  wasteRecess.userData.lodTier = 'high';
  wasteRecess.userData.lodMaxDistance = 12;
  wasteRecess.position.set(drainX, wellTopY + 0.0018, drainZ);
  showerGroup.add(wasteRecess);

  const showerDrainGrate = new THREE.Mesh(
    prepGeo(new THREE.CylinderGeometry(0.043, 0.045, 0.005, 24)),
    brBrass.primary
  );
  showerDrainGrate.name = 'familyBathroom.showerEnclosure.lpw90BrassWaste';
  showerDrainGrate.userData.lodTier = 'high';
  showerDrainGrate.userData.lodMaxDistance = 12;
  showerDrainGrate.position.set(drainX, wellTopY + 0.0042, drainZ);
  showerGroup.add(showerDrainGrate);

  // =========================================================================
  // 2. MATKI EAUZONE PLUS LIVING BRASS FRAMED GLASS FRONT & HINGED PIVOT DOOR
  //    Spans Z = -0.68m across X = -10.761m .. -9.809m (H = 2.052m -> top 4.25m)
  // =========================================================================
  const westTileFaceX = trayWestX + ROOM17_OPTION1_PLANES.zelligeDepth; // -10.761m
  const eastTileFaceX = trayEastX - ROOM17_OPTION1_PLANES.zelligeDepth; // -9.809m
  const clearFrontW = eastTileFaceX - westTileFaceX; // 0.952m
  const frontZ = trayNorthZ + 0.018; // -0.662m (sitting cleanly on the North rim)
  const screenH = 2.052;
  const fixedPanelW = 0.34;
  const doorLeafW = clearFrontW - fixedPanelW - 0.036; // ~0.576m generous hinged pivot door
  const mullionX = eastTileFaceX - 0.018 - fixedPanelW;

  // Perimeter Living Brass channels + top transom header bar
  const vertChannelGeo = prepGeo(new THREE.BoxGeometry(0.022, screenH, 0.024));
  for (const [chName, cx] of [
    ['westWallChannel', westTileFaceX + 0.011],
    ['eastWallChannel', eastTileFaceX - 0.011],
    ['pivotMullionPost', mullionX],
  ] as const) {
    const ch = new THREE.Mesh(vertChannelGeo, brBrass.primary);
    ch.name = `familyBathroom.showerEnclosure.${chName}`;
    ch.position.set(cx, rimTopY + screenH * 0.5, frontZ);
    ch.castShadow = true;
    showerGroup.add(ch);
  }

  const topTransomBar = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(clearFrontW, 0.026, 0.026)),
    brBrass.primary
  );
  topTransomBar.name = 'familyBathroom.showerEnclosure.topHeaderBar';
  topTransomBar.position.set((westTileFaceX + eastTileFaceX) * 0.5, rimTopY + screenH - 0.013, frontZ);
  topTransomBar.castShadow = true;
  showerGroup.add(topTransomBar);

  // Fixed East glass inline panel
  const fixedCenterX = (mullionX + 0.011 + (eastTileFaceX - 0.022)) * 0.5;
  const fixedSpanX = eastTileFaceX - 0.022 - (mullionX + 0.011);
  const fixedGlass = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(fixedSpanX, screenH - 0.038, 0.01)),
    windowGlassMat
  );
  fixedGlass.name = 'familyBathroom.showerGlass.fixedPanel';
  fixedGlass.position.set(fixedCenterX, rimTopY + 0.012 + (screenH - 0.038) * 0.5, frontZ);
  showerGroup.add(fixedGlass);

  const fixedBottomChannel = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(fixedSpanX + 0.008, 0.014, 0.018)),
    brBrass.primary
  );
  fixedBottomChannel.name = 'familyBathroom.showerEnclosure.fixedBottomChannel';
  fixedBottomChannel.position.set(fixedCenterX, rimTopY + 0.007, frontZ);
  showerGroup.add(fixedBottomChannel);

  // Hinged West glass pivot door (hinged near West wall channel, latch at mullion)
  const doorPivotGroup = new THREE.Group();
  doorPivotGroup.name = 'familyBathroom.showerEnclosure.pivotDoor';
  const hingePivotX = westTileFaceX + 0.026;
  doorPivotGroup.position.set(hingePivotX, rimTopY, frontZ);
  doorPivotGroup.rotation.y = 0.08; // Subtle 4.5° outward poise showing hinged door articulation

  const doorGlassH = screenH - 0.044;
  const doorGlass = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(doorLeafW, doorGlassH, 0.01)),
    windowGlassMat
  );
  doorGlass.name = 'familyBathroom.showerGlass.doorLeaf';
  doorGlass.position.set(doorLeafW * 0.5, 0.016 + doorGlassH * 0.5, 0);
  doorPivotGroup.add(doorGlass);

  const doorDripSeal = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(doorLeafW, 0.012, 0.016)),
    brBrass.primary
  );
  doorDripSeal.name = 'familyBathroom.showerEnclosure.doorBottomDripSeal';
  doorDripSeal.position.set(doorLeafW * 0.5, 0.01, 0);
  doorPivotGroup.add(doorDripSeal);

  for (const [hTag, hy] of [
    ['bottomPivotHinge', 0.022],
    ['topPivotHinge', screenH - 0.036],
  ] as const) {
    const hingeBlock = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(0.052, 0.032, 0.026)),
      brBrass.primary
    );
    hingeBlock.name = `familyBathroom.showerEnclosure.${hTag}`;
    hingeBlock.position.set(0.02, hy, 0);
    doorPivotGroup.add(hingeBlock);
  }

  // Double-sided turned Living Brass vertical pull handle on hinged shower door
  const handleX = doorLeafW - 0.055;
  const handleMidY = 0.96;
  const handleSpanY = 0.34;
  for (const zSign of [-1, 1] as const) {
    const bar = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.009, 0.009, handleSpanY, 16)),
      brBrass.primary
    );
    bar.name = `familyBathroom.showerEnclosure.doorHandle.${zSign < 0 ? 'outer' : 'inner'}`;
    bar.position.set(handleX, handleMidY, zSign * 0.036);
    doorPivotGroup.add(bar);
  }
  for (const yOff of [-handleSpanY * 0.42, handleSpanY * 0.42] as const) {
    const standoff = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.007, 0.007, 0.072, 14)),
      brBrass.primary
    );
    standoff.name = `familyBathroom.showerEnclosure.doorHandleStandoff.${yOff < 0 ? 'lower' : 'upper'}`;
    standoff.rotation.x = Math.PI * 0.5;
    standoff.position.set(handleX, handleMidY + yOff, 0);
    doorPivotGroup.add(standoff);
  }

  showerGroup.add(doorPivotGroup);

  // =========================================================================
  // 3. ISSUE #2: WARM 2700K LED-LIT RECESSED STUD NICHES (SOUTH 2-TIER + WEST)
  //    Zero niches in the X = -9.80m bedroom headboard masonry wall!
  // =========================================================================
  const warmLedStripMat = new THREE.MeshStandardMaterial({
    name: 'familyBathroom.showerNiche.warm2700kLed',
    color: 0xffebd0,
    emissive: new THREE.Color(0xffc368),
    emissiveIntensity: 2.5,
    roughness: 0.18,
    metalness: 0.0,
  });

  // Subtle warm-lit Zellige material for inside the lit niches so the glaze & back wall visibly glow warm 2700K!
  const litNicheZelligeMat = (zelligeTileMat as THREE.MeshPhysicalMaterial).clone();
  litNicheZelligeMat.name = 'familyBathroom.showerNiche.warmLitZellige';
  litNicheZelligeMat.emissive = new THREE.Color(0xffca7a);
  litNicheZelligeMat.emissiveIntensity = 0.28;

  const litNicheCarraraMat = (carraraMat as THREE.MeshPhysicalMaterial).clone();
  litNicheCarraraMat.name = 'familyBathroom.showerNiche.warmLitCarrara';
  litNicheCarraraMat.emissive = new THREE.Color(0xffcf86);
  litNicheCarraraMat.emissiveIntensity = 0.18;

  const amberGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x7a4119,
    emissive: new THREE.Color(0x4a2408),
    emissiveIntensity: 0.22,
    roughness: 0.14,
    metalness: 0.04,
    clearcoat: 0.72,
  });
  const oliveGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x3f4c2c,
    roughness: 0.16,
    metalness: 0.03,
    clearcoat: 0.68,
  });
  const stonewareBottleMat = new THREE.MeshStandardMaterial({
    color: 0xe8e0d2,
    emissive: new THREE.Color(0xffd494),
    emissiveIntensity: 0.12,
    roughness: 0.58,
    metalness: 0.02,
  });
  const soapBarMat = new THREE.MeshStandardMaterial({
    color: 0xd8cdb8,
    roughness: 0.74,
    metalness: 0.0,
  });
  const seaSpongeMat = new THREE.MeshStandardMaterial({
    color: 0xc9a978,
    roughness: 0.94,
    metalness: 0.0,
  });

  // 3A. South 2-Tier Warm-LED-Lit Bottle Niche (Z = +0.471..+0.566m — leaves 34mm solid wall before +0.600m mini-bar!)
  {
    const southNicheGroup = new THREE.Group();
    southNicheGroup.name = 'familyBathroom.showerEnclosure.southBottleNiche';

    const snWestX = SOUTH_SHOWER_NICHE_OPENING.westX;
    const snEastX = SOUTH_SHOWER_NICHE_OPENING.eastX;
    const snBotY = SOUTH_SHOWER_NICHE_OPENING.bottomY;
    const snTopY = SOUTH_SHOWER_NICHE_OPENING.topY;
    const snW = snEastX - snWestX; // 0.48m
    const snH = snTopY - snBotY; // 0.76m
    const snCx = (snWestX + snEastX) * 0.5;
    const snCy = (snBotY + snTopY) * 0.5;
    const snFrontZ = traySouthZ - ROOM17_OPTION1_PLANES.zelligeDepth; // +0.471m
    const snBackZ = 0.562; // 91mm clear niche depth; back tile ends at 0.566m -> 34mm solid wall before 0.600m!
    const snDepth = snBackZ - snFrontZ;
    const snMidZ = (snFrontZ + snBackZ) * 0.5;

    const snBackMesh = new THREE.Mesh(
      setWorldZelligeBoxUVs(new THREE.BoxGeometry(snW, snH, 0.008), snW, snH, 0.008),
      litNicheZelligeMat
    );
    snBackMesh.name = 'familyBathroom.showerEnclosure.southBottleNiche.backWall';
    snBackMesh.position.set(snCx, snCy, snBackZ + 0.004);
    snBackMesh.receiveShadow = true;
    southNicheGroup.add(snBackMesh);

    const snSideGeo = setWorldZelligeBoxUVs(
      new THREE.BoxGeometry(0.008, snH, snDepth),
      0.008,
      snH,
      snDepth
    );
    for (const [sideTag, sx] of [
      ['westReveal', snWestX + 0.004],
      ['eastReveal', snEastX - 0.004],
    ] as const) {
      const side = new THREE.Mesh(snSideGeo, litNicheZelligeMat);
      side.name = `familyBathroom.showerEnclosure.southBottleNiche.${sideTag}`;
      side.position.set(sx, snCy, snMidZ);
      southNicheGroup.add(side);
    }

    const snSoffit = new THREE.Mesh(
      setWorldZelligeBoxUVs(new THREE.BoxGeometry(snW - 0.016, 0.008, snDepth), snW, 0.008, snDepth),
      litNicheZelligeMat
    );
    snSoffit.name = 'familyBathroom.showerEnclosure.southBottleNiche.topSoffit';
    snSoffit.position.set(snCx, snTopY - 0.004, snMidZ);
    southNicheGroup.add(snSoffit);

    // 20mm Honed Carrara bottom sill & mid-height divider shelf
    const snSillW = snW - 0.008;
    const snSillD = snDepth + 0.014;
    const snSillGeo = prepGeo(new THREE.BoxGeometry(snSillW, 0.02, snSillD));
    const snBottomSill = new THREE.Mesh(snSillGeo, litNicheCarraraMat);
    snBottomSill.name = 'familyBathroom.showerEnclosure.southBottleNiche.carraraBottomSill';
    snBottomSill.position.set(snCx, snBotY + 0.01, snBackZ - snSillD * 0.5);
    snBottomSill.castShadow = true;
    snBottomSill.receiveShadow = true;
    southNicheGroup.add(snBottomSill);

    const snMidShelfY = 3.27;
    const snMidShelf = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(snW - 0.016, 0.018, snDepth + 0.006)),
      litNicheCarraraMat
    );
    snMidShelf.name = 'familyBathroom.showerEnclosure.southBottleNiche.carraraMiddleShelf';
    snMidShelf.position.set(snCx, snMidShelfY, snBackZ - (snDepth + 0.006) * 0.5);
    snMidShelf.castShadow = true;
    snMidShelf.receiveShadow = true;
    southNicheGroup.add(snMidShelf);

    // Concealed Warm 2700K IP67 LED strip downlighters in BOTH upper & lower niche alcoves!
    addRecessedNicheWarmLedStrip(
      southNicheGroup,
      'familyBathroom.showerEnclosure.southBottleNiche.upperLed',
      'x',
      snW - 0.024,
      snCx,
      snTopY - 0.01,
      snFrontZ + 0.024,
      brBrass,
      warmLedStripMat
    );
    addRecessedNicheWarmLedStrip(
      southNicheGroup,
      'familyBathroom.showerEnclosure.southBottleNiche.lowerLed',
      'x',
      snW - 0.024,
      snCx,
      snMidShelfY - 0.011,
      snFrontZ + 0.024,
      brBrass,
      warmLedStripMat
    );

    // 4mm Living Brass Schluter-JOLLY perimeter mitred trim
    const jollyT = 0.005;
    const snTrimZ = snFrontZ - 0.0015;
    for (const [bName, bx, by, bw, bh] of [
      ['topJollyTrim', snCx, snTopY - jollyT * 0.5, snW + jollyT * 2, jollyT],
      ['bottomJollyTrim', snCx, snBotY + jollyT * 0.5, snW + jollyT * 2, jollyT],
      ['westJollyTrim', snWestX - jollyT * 0.5, snCy, jollyT, snH],
      ['eastJollyTrim', snEastX + jollyT * 0.5, snCy, jollyT, snH],
    ] as const) {
      const trim = new THREE.Mesh(prepGeo(new THREE.BoxGeometry(bw, bh, 0.008)), brBrass.primary);
      trim.name = `familyBathroom.showerEnclosure.southBottleNiche.${bName}`;
      trim.position.set(bx, by, snTrimZ);
      southNicheGroup.add(trim);
    }

    // Styled apothecary pump bottles & stoneware vessels
    const lowerShelfTopY = snBotY + 0.02;
    const bottleSpecs: readonly [string, number, number, number, THREE.Material][] = [
      ['shampooBottle', snCx - 0.13, 0.032, 0.175, amberGlassMat],
      ['conditionerBottle', snCx - 0.035, 0.032, 0.175, amberGlassMat],
      ['bodyWashBottle', snCx + 0.085, 0.036, 0.195, oliveGlassMat],
    ];
    for (const [bName, bx, r, h, mat] of bottleSpecs) {
      const body = new THREE.Mesh(
        prepGeo(new THREE.CylinderGeometry(r * 0.94, r, h, 18)),
        mat
      );
      body.name = `familyBathroom.showerEnclosure.southBottleNiche.${bName}`;
      body.position.set(bx, lowerShelfTopY + h * 0.5, snMidZ);
      body.castShadow = true;
      southNicheGroup.add(body);

      const collar = new THREE.Mesh(
        prepGeo(new THREE.CylinderGeometry(0.011, 0.013, 0.024, 14)),
        brBrass.primary
      );
      collar.name = `familyBathroom.showerEnclosure.southBottleNiche.${bName}.brassPump`;
      collar.position.set(bx, lowerShelfTopY + h + 0.012, snMidZ);
      southNicheGroup.add(collar);
    }

    const upperShelfTopY = snMidShelfY + 0.009;
    const scrubJar = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.044, 0.04, 0.088, 18)),
      stonewareBottleMat
    );
    scrubJar.name = 'familyBathroom.showerEnclosure.southBottleNiche.stonewareScrubJar';
    scrubJar.position.set(snCx - 0.095, upperShelfTopY + 0.044, snMidZ);
    scrubJar.castShadow = true;
    southNicheGroup.add(scrubJar);

    const jarLid = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 18)),
      brBrass.primary
    );
    jarLid.name = 'familyBathroom.showerEnclosure.southBottleNiche.stonewareScrubJar.brassLid';
    jarLid.position.set(snCx - 0.095, upperShelfTopY + 0.094, snMidZ);
    southNicheGroup.add(jarLid);

    const bathOilFlacon = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.026, 0.028, 0.135, 16)),
      amberGlassMat
    );
    bathOilFlacon.name = 'familyBathroom.showerEnclosure.southBottleNiche.bathOilFlacon';
    bathOilFlacon.position.set(snCx + 0.085, upperShelfTopY + 0.0675, snMidZ);
    bathOilFlacon.castShadow = true;
    southNicheGroup.add(bathOilFlacon);

    showerGroup.add(southNicheGroup);
  }

  // 3B. West Companion Warm-LED-Lit Soap Niche (X = -10.852..-10.761m — leaves 34mm solid wall before -10.890m!)
  {
    const westNicheGroup = new THREE.Group();
    westNicheGroup.name = 'familyBathroom.showerEnclosure.westCompanionNiche';

    const wnNorthZ = WEST_SHOWER_NICHE_OPENING.northZ;
    const wnSouthZ = WEST_SHOWER_NICHE_OPENING.southZ;
    const wnBotY = WEST_SHOWER_NICHE_OPENING.bottomY;
    const wnTopY = WEST_SHOWER_NICHE_OPENING.topY;
    const wnW = wnSouthZ - wnNorthZ; // 0.30m
    const wnH = wnTopY - wnBotY; // 0.38m
    const wnCz = (wnNorthZ + wnSouthZ) * 0.5;
    const wnCy = (wnBotY + wnTopY) * 0.5;
    const wnFrontX = westTileFaceX; // -10.761m
    const wnBackX = -10.85; // 89mm clear depth; back tile ends at -10.856m -> 34mm solid wall before -10.890m!
    const wnDepth = wnFrontX - wnBackX;
    const wnMidX = (wnFrontX + wnBackX) * 0.5;

    const wnBack = new THREE.Mesh(
      setWorldZelligeBoxUVs(new THREE.BoxGeometry(0.006, wnH, wnW), 0.006, wnH, wnW),
      litNicheZelligeMat
    );
    wnBack.name = 'familyBathroom.showerEnclosure.westCompanionNiche.backWall';
    wnBack.position.set(wnBackX - 0.003, wnCy, wnCz);
    westNicheGroup.add(wnBack);

    const wnSideGeo = setWorldZelligeBoxUVs(
      new THREE.BoxGeometry(wnDepth, wnH, 0.008),
      wnDepth,
      wnH,
      0.008
    );
    for (const [rTag, rz] of [
      ['northReveal', wnNorthZ + 0.004],
      ['southReveal', wnSouthZ - 0.004],
    ] as const) {
      const reveal = new THREE.Mesh(wnSideGeo, litNicheZelligeMat);
      reveal.name = `familyBathroom.showerEnclosure.westCompanionNiche.${rTag}`;
      reveal.position.set(wnMidX, wnCy, rz);
      westNicheGroup.add(reveal);
    }

    const wnSoffit = new THREE.Mesh(
      setWorldZelligeBoxUVs(new THREE.BoxGeometry(wnDepth, 0.008, wnW - 0.016), wnDepth, 0.008, wnW),
      litNicheZelligeMat
    );
    wnSoffit.name = 'familyBathroom.showerEnclosure.westCompanionNiche.topSoffit';
    wnSoffit.position.set(wnMidX, wnTopY - 0.004, wnCz);
    westNicheGroup.add(wnSoffit);

    const wnSillD = wnDepth + 0.012;
    const wnSill = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(wnSillD, 0.02, wnW - 0.008)),
      litNicheCarraraMat
    );
    wnSill.name = 'familyBathroom.showerEnclosure.westCompanionNiche.carraraSill';
    wnSill.position.set(wnBackX + wnSillD * 0.5, wnBotY + 0.01, wnCz);
    wnSill.castShadow = true;
    westNicheGroup.add(wnSill);

    addRecessedNicheWarmLedStrip(
      westNicheGroup,
      'familyBathroom.showerEnclosure.westCompanionNiche.topLed',
      'z',
      wnW - 0.024,
      wnFrontX - 0.022,
      wnTopY - 0.01,
      wnCz,
      brBrass,
      warmLedStripMat
    );

    const jollyT = 0.005;
    const wnTrimX = wnFrontX + 0.0015;
    for (const [bName, by, bz, bh, bw] of [
      ['topJollyTrim', wnTopY - jollyT * 0.5, wnCz, jollyT, wnW + jollyT * 2],
      ['bottomJollyTrim', wnBotY + jollyT * 0.5, wnCz, jollyT, wnW + jollyT * 2],
      ['northJollyTrim', wnCy, wnNorthZ - jollyT * 0.5, wnH, jollyT],
      ['southJollyTrim', wnCy, wnSouthZ + jollyT * 0.5, wnH, jollyT],
    ] as const) {
      const trim = new THREE.Mesh(prepGeo(new THREE.BoxGeometry(0.008, bh, bw)), brBrass.primary);
      trim.name = `familyBathroom.showerEnclosure.westCompanionNiche.${bName}`;
      trim.position.set(wnTrimX, by, bz);
      westNicheGroup.add(trim);
    }

    const wnSillTopY = wnBotY + 0.02;
    const soapDish = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.044, 0.036, 0.014, 18)),
      stonewareBottleMat
    );
    soapDish.name = 'familyBathroom.showerEnclosure.westCompanionNiche.soapDish';
    soapDish.position.set(wnMidX, wnSillTopY + 0.007, wnCz - 0.06);
    westNicheGroup.add(soapDish);

    const soapBar = new THREE.Mesh(
      prepGeo(new THREE.BoxGeometry(0.046, 0.022, 0.068)),
      soapBarMat
    );
    soapBar.name = 'familyBathroom.showerEnclosure.westCompanionNiche.artisanalSoap';
    soapBar.rotation.y = 0.22;
    soapBar.position.set(wnMidX, wnSillTopY + 0.022, wnCz - 0.06);
    westNicheGroup.add(soapBar);

    const seaSponge = new THREE.Mesh(
      prepGeo(new THREE.DodecahedronGeometry(0.036, 1)),
      seaSpongeMat
    );
    seaSponge.name = 'familyBathroom.showerEnclosure.westCompanionNiche.naturalSeaSponge';
    seaSponge.scale.set(0.9, 0.82, 1.05);
    seaSponge.position.set(wnMidX, wnSillTopY + 0.03, wnCz + 0.065);
    westNicheGroup.add(seaSponge);

    showerGroup.add(westNicheGroup);
  }

  scene.add(showerGroup);

  // =========================================================================
  // 4. ACOUSTIC-SAFE PERRIN & ROWE TRADITIONAL BR SHOWER BRASSWARE
  //    - Concealed thermostatic valve + handshower rail on West stud cheek (`X = -10.761m`)
  //    - 200mm rainfall deluge rose dropped on a vertical brass ceiling arm from `4.65m` ceiling!
  //    - Zero pipes or valves on the `X = -9.80m` East bedroom headboard masonry wall!
  // =========================================================================
  const valveZ = -0.22;
  const showerSet = buildArmstrongConcealedShowerSet({
    namePrefix: 'familyBathroom.shower.thermostaticSet',
    finish: 'BR',
    style: 'traditional',
    valveCenterYM: 1.08,
    overheadArmYM: 1.98,
    overheadArmReachM: 0.42,
    roseDiameterM: 0.2,
    slideRailOffsetXM: 0.24, // Facing 'east' (+X): local +X maps to -Z -> Z = -0.46m right by shower door!
    slideRailCenterYM: 1.28,
  });
  showerSet.position.set(westTileFaceX, rimTopY, valveZ);
  showerSet.rotation.y = wallFacingToRotY('east');

  // Replace horizontal wall arm inside `.overheadShower` with a vertical ceiling-mounted drop arm
  // centered over the SE shower tray at (trayCx = -10.285m, trayCz = -0.10m) from Y = 4.65m ceiling!
  const overheadSubgroup = showerSet.getObjectByName(
    'familyBathroom.shower.thermostaticSet.overheadShower'
  );
  if (overheadSubgroup) {
    for (const partName of [
      'familyBathroom.shower.thermostaticSet.overheadShower.wallFlange',
      'familyBathroom.shower.thermostaticSet.overheadShower.knurledWallNut',
      'familyBathroom.shower.thermostaticSet.overheadShower.arm5684',
    ]) {
      const part = overheadSubgroup.getObjectByName(partName);
      if (part) overheadSubgroup.remove(part);
    }

    // In showerSet local coordinates (origin at [westTileFaceX, rimTopY, valveZ], rotY = +PI/2):
    // worldX = westTileFaceX + localZ  =>  localZ = trayCx - westTileFaceX
    // worldZ = valveZ - localX         =>  localX = valveZ - trayCz
    const localCenterX = valveZ - trayCz;
    const localCenterZ = trayCx - westTileFaceX;
    const localCeilingY = EAST_WING_BATHROOM_VAULT.collarCeilingY - rimTopY; // 4.650 - 2.198 = 2.452m
    const dropLen = 0.36;
    const armBottomLocalY = localCeilingY - dropLen; // world Y = 4.29m

    // Reposition existing swivel ball, collar & 200mm rainfall rose meshes directly under the ceiling drop arm
    const origArmEndY = 1.98 - 0.055;
    const deltaY = armBottomLocalY - origArmEndY;
    for (const child of overheadSubgroup.children) {
      child.position.x = localCenterX;
      child.position.y += deltaY;
      child.position.z = localCenterZ;
    }

    const ceilingFlange = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.036, 0.032, 0.014, 24)),
      brBrass.primary
    );
    ceilingFlange.name = 'familyBathroom.shower.thermostaticSet.overheadShower.ceilingFlange';
    ceilingFlange.position.set(localCenterX, localCeilingY - 0.007, localCenterZ);
    overheadSubgroup.add(ceilingFlange);

    const ceilingCollar = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.018, 0.018, 0.016, 20)),
      brBrass.primary
    );
    ceilingCollar.name = 'familyBathroom.shower.thermostaticSet.overheadShower.ceilingCollar';
    ceilingCollar.position.set(localCenterX, localCeilingY - 0.02, localCenterZ);
    overheadSubgroup.add(ceilingCollar);

    const ceilingDropPipe = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.011, 0.011, dropLen, 20)),
      brBrass.primary
    );
    ceilingDropPipe.name = 'familyBathroom.shower.thermostaticSet.overheadShower.ceilingDropArm';
    ceilingDropPipe.position.set(localCenterX, localCeilingY - dropLen * 0.5, localCenterZ);
    ceilingDropPipe.castShadow = true;
    overheadSubgroup.add(ceilingDropPipe);
  }

  scene.add(showerSet);
}

function buildRaisedBrassTowelRail(
  brBrass: ReturnType<typeof getBathroomBrassMaterials>,
  textiles: ReturnType<typeof getBathroomTextileMaterials>
): THREE.Group {
  const towelRailGroup = new THREE.Group();
  towelRailGroup.name = 'familyBathroom.heatedTowelRail';

  const {
    wallFaceX,
    baseY: railBaseY,
    centerZ: railCenterZ,
    height: railH,
    halfSpanZ,
    standOffX,
  } = TOWEL_RAIL_SPEC;
  towelRailGroup.position.set(wallFaceX, railBaseY, railCenterZ);

  const uprightGeo = prepGeo(new THREE.CylinderGeometry(0.014, 0.014, railH, 16));
  const crossBarGeo = prepGeo(new THREE.CylinderGeometry(0.011, 0.011, halfSpanZ * 2, 16));
  const ballJointGeo = prepGeo(new THREE.SphereGeometry(0.02, 14, 12));
  const wallRoseGeo = prepGeo(new THREE.CylinderGeometry(0.028, 0.032, 0.012, 18));
  const bracketStandoffGeo = prepGeo(
    new THREE.CylinderGeometry(0.009, 0.009, Math.abs(standOffX), 14)
  );

  for (const [sideIdx, zOff] of [-halfSpanZ, halfSpanZ].entries()) {
    const sideLabel = sideIdx === 0 ? 'north' : 'south';
    const upright = new THREE.Mesh(uprightGeo, brBrass.primary);
    upright.name = `familyBathroom.heatedTowelRail.upright.${sideLabel}`;
    upright.position.set(standOffX, railH * 0.5, zOff);
    upright.castShadow = true;
    towelRailGroup.add(upright);

    const finial = new THREE.Mesh(ballJointGeo, brBrass.primary);
    finial.name = `familyBathroom.heatedTowelRail.topFinial.${sideLabel}`;
    finial.position.set(standOffX, railH + 0.008, zOff);
    towelRailGroup.add(finial);

    for (const [bIdx, by] of [0.06, railH - 0.06].entries()) {
      const rose = new THREE.Mesh(wallRoseGeo, brBrass.primary);
      rose.name = `familyBathroom.heatedTowelRail.wallRose.${sideLabel}_${bIdx + 1}`;
      rose.rotation.z = Math.PI * 0.5;
      rose.position.set(-0.006, by, zOff);
      towelRailGroup.add(rose);

      const arm = new THREE.Mesh(bracketStandoffGeo, brBrass.primary);
      arm.name = `familyBathroom.heatedTowelRail.wallBracket.${sideLabel}_${bIdx + 1}`;
      arm.rotation.z = Math.PI * 0.5;
      arm.position.set(standOffX * 0.5, by, zOff);
      towelRailGroup.add(arm);
    }

    const valveBody = new THREE.Mesh(
      prepGeo(new THREE.CylinderGeometry(0.016, 0.016, 0.048, 14)),
      brBrass.primary
    );
    valveBody.name = `familyBathroom.heatedTowelRail.valve.${sideLabel}`;
    valveBody.position.set(standOffX, -0.024, zOff);
    towelRailGroup.add(valveBody);
  }

  const barHeights = [0.06, 0.24, 0.42, 0.58, railH - 0.06] as const;
  for (const [i, ry] of barHeights.entries()) {
    const bar = new THREE.Mesh(crossBarGeo, brBrass.primary);
    bar.name = `familyBathroom.heatedTowelRail.bar_${i + 1}`;
    bar.rotation.x = Math.PI / 2;
    bar.position.set(standOffX, ry, 0);
    bar.castShadow = true;
    towelRailGroup.add(bar);

    for (const [sIdx, zOff] of [-halfSpanZ, halfSpanZ].entries()) {
      const ball = new THREE.Mesh(ballJointGeo, brBrass.primary);
      ball.name = `familyBathroom.heatedTowelRail.ballJoint_${i + 1}_${sIdx === 0 ? 'n' : 's'}`;
      ball.userData.lodTier = 'high';
      ball.userData.lodMaxDistance = 12;
      ball.position.set(standOffX, ry, zOff);
      towelRailGroup.add(ball);
    }
  }

  const towelW = 0.32;
  const towelDrop = 0.33;
  const towelBarY = 0.42;
  const towelShape = new THREE.Shape();
  const rTop = 0.022;
  towelShape.moveTo(-rTop, -towelDrop);
  towelShape.lineTo(-rTop, 0);
  towelShape.absarc(0, 0, rTop, Math.PI, 0, true);
  towelShape.lineTo(rTop, -towelDrop * 0.94);
  towelShape.lineTo(rTop - 0.011, -towelDrop * 0.94);
  towelShape.lineTo(rTop - 0.011, 0);
  towelShape.absarc(0, 0, rTop - 0.011, 0, Math.PI, false);
  towelShape.lineTo(-rTop + 0.011, -towelDrop);
  towelShape.closePath();

  const towelGeo = prepGeo(
    new THREE.ExtrudeGeometry(towelShape, {
      depth: towelW,
      bevelEnabled: true,
      bevelThickness: 0.004,
      bevelSize: 0.004,
      bevelSegments: 2,
      curveSegments: 16,
    })
  );
  towelGeo.translate(0, 0, -towelW * 0.5);
  const drapedTowel = new THREE.Mesh(towelGeo, textiles.stripedRailTowel);
  drapedTowel.name = 'familyBathroom.heatedTowelRail.stripedBathTowel';
  drapedTowel.position.set(standOffX, towelBarY + 0.004, 0);
  drapedTowel.castShadow = true;
  drapedTowel.receiveShadow = true;
  towelRailGroup.add(drapedTowel);

  return towelRailGroup;
}

/**
 * Builds Room 17 (`familyBathroom`, Option 1) `970 × 1,160mm` SE walk-in alcove shower with
 * warm `2700K` LED-lit recessed stud niches, ceiling-dropped `200mm` deluge rose & West-stud
 * thermostatic mixer, East-wall Polished Brass ladder towel warmer, and Copper Boat Bath.
 */
export function buildFamilyBathroomBathAndShower(
  scene: THREE.Group,
  kit: FamilyBathroomBathAndShowerKit
): void {
  const { floorTopY, windowGlassMat } = kit;
  const brBrass = getBathroomBrassMaterials('BR');
  const acrymiteWhiteMat = getAcrymiteWhiteMaterial();
  const zelligeTileMat = getZelligeCreamWallTileMaterial();
  const carraraMat = getHonedCarraraMarbleMaterial();
  const textiles = getBathroomTextileMaterials();

  buildShowerEnclosureWithLitNiches(
    scene,
    floorTopY,
    windowGlassMat,
    brBrass,
    acrymiteWhiteMat,
    zelligeTileMat,
    carraraMat
  );

  scene.add(buildRaisedBrassTowelRail(brBrass, textiles));

  const copperBoatBath = buildBcDesignsCopperBoatBath({
    namePrefix: 'familyBathroom.copperBoatBath',
    lengthM: BOAT_BATH_PLACEMENT.lengthM,
    widthM: BOAT_BATH_PLACEMENT.widthM,
    endHeightM: BOAT_BATH_PLACEMENT.endHeightM,
    centerHeightM: BOAT_BATH_PLACEMENT.centerHeightM,
    brassFinish: 'BR',
    overflowEnd: 'west',
  });
  copperBoatBath.position.set(
    BOAT_BATH_PLACEMENT.centerX,
    floorTopY,
    BOAT_BATH_PLACEMENT.bathCenterZ
  );
  copperBoatBath.rotation.y = 0;
  scene.add(copperBoatBath);

  const bathMixer = buildArmstrongFreestandingBathMixer({
    namePrefix: 'familyBathroom.bathMixer',
    finish: 'BR',
    style: 'traditional',
    overallHeightM: 0.958,
    spoutOutletHeightM: 0.827,
    spoutReachM: 0.21,
  });
  bathMixer.position.set(
    BOAT_BATH_PLACEMENT.centerX,
    floorTopY,
    BOAT_BATH_PLACEMENT.mixerCenterZ
  );
  bathMixer.rotation.y = wallFacingToRotY('south');
  scene.add(bathMixer);
}
