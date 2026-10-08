import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../../engine/viewer/scene-types.ts';
import {
  createBrushedStainlessTexture,
  createHawaiiArtworkTexture,
  createImperialBrickTextures,
  createStoneTileTexture,
  createWelshSlateRoofTexture,
} from '../../../../../engine/textures/procedural-textures.ts';
import {
  addCasedArchitravePortal,
  buildMitredWallSkirtingGeometry,
} from '../../../../../engine/geometry/swept-moulding.ts';

function prepGeo<T extends THREE.BufferGeometry>(geo: T): T {
  geo.computeBoundingSphere();
  return geo;
}

function tagHighLod(obj: THREE.Object3D, maxDistance = 14): void {
  obj.userData.lodTier = 'high';
  obj.userData.lodMaxDistance = maxDistance;
}

function ensureNamedHierarchy(root: THREE.Object3D, fallbackPrefix: string): void {
  let idx = 0;
  root.traverse((child) => {
    if (!child.name) {
      child.name = `${fallbackPrefix}.part_${idx++}`;
    }
    if (child instanceof THREE.Mesh && child.geometry) {
      if (!child.geometry.boundingSphere) {
        child.geometry.computeBoundingSphere();
      }
    }
  });
}

// Shared door & window hardware geometries
const sharedDoorButtHingeGeo = prepGeo(new THREE.CylinderGeometry(0.009, 0.009, 0.075, 8));
const sharedDoorLeafGeo = prepGeo(new THREE.BoxGeometry(0.81, 2.06, 0.06));
const sharedDoorPanelRecessGeo = prepGeo(new THREE.BoxGeometry(0.58, 0.68, 0.072));
const sharedDoorInnerPanelGeo = prepGeo(new THREE.BoxGeometry(0.5, 0.6, 0.08));
const sharedDoorBackplateGeo = prepGeo(new THREE.BoxGeometry(0.042, 0.15, 0.085));
const sharedDoorSpindleGeo = prepGeo(new THREE.BoxGeometry(0.018, 0.018, 0.13));
const sharedDoorLeverGeo = prepGeo(new THREE.BoxGeometry(0.115, 0.02, 0.02));

const sharedStableVGrooveGeo = prepGeo(new THREE.BoxGeometry(0.005, 0.75, 0.068));
const sharedStableLowerRailGeo = prepGeo(new THREE.BoxGeometry(0.81, 0.112, 0.068));
const sharedStableLowerStileGeo = prepGeo(new THREE.BoxGeometry(0.11, 0.984, 0.068));
const sharedStableLowerLeverGeo = prepGeo(new THREE.BoxGeometry(0.11, 0.018, 0.018));
const sharedStableUpperStileGeo = prepGeo(new THREE.BoxGeometry(0.11, 1.027, 0.066));
const sharedStableUpperRailGeo = prepGeo(new THREE.BoxGeometry(0.81, 0.115, 0.066));
const sharedStableHorizMuntinGeo = prepGeo(new THREE.BoxGeometry(0.6, 0.022, 0.042));
const sharedStableUpperKnobGeo = prepGeo(new THREE.CylinderGeometry(0.016, 0.016, 0.022, 10));
const sharedStableShootBoltGeo = prepGeo(new THREE.CylinderGeometry(0.007, 0.007, 0.14, 8));

let oakDoorInstanceCounter = 0;

export function buildOakDoor(
  parent: THREE.Object3D,
  interactions: SceneBuilderContext['interactions'],
  x: number,
  z: number,
  rotY = 0,
  namePrefix?: string
): void {
  const resolvedPrefix =
    namePrefix ??
    (Math.abs(x - 2.68) < 0.05 && Math.abs(z - -0.775) < 0.05
      ? 'kitchen.oakDoor'
      : `kitchen.oakDoor_${oakDoorInstanceCounter++}`);

  const doorGroup = new THREE.Group();
  doorGroup.name = `${resolvedPrefix}.group`;
  doorGroup.position.set(x, 0, z);
  doorGroup.rotation.y = rotY;

  const whiteDoorMat = new THREE.MeshStandardMaterial({
    color: 0xf4f1ea,
    roughness: 0.34,
    metalness: 0.04,
  });
  const whitePanelMat = new THREE.MeshStandardMaterial({
    color: 0xe7e2d8,
    roughness: 0.4,
    metalness: 0.03,
  });
  const oakArchitraveMat = new THREE.MeshStandardMaterial({
    color: 0x8e643c,
    roughness: 0.52,
    metalness: 0.04,
  });
  const brushedStainlessTex = createBrushedStainlessTexture();
  const brushedHardwareMat = new THREE.MeshStandardMaterial({
    map: brushedStainlessTex,
    bumpMap: brushedStainlessTex,
    bumpScale: 0.003,
    color: 0xc8c5be,
    roughness: 0.28,
    metalness: 0.48,
  });

  // Outer 45°-mitred ogee/torus solid antique oak architrave header & jambs + reveal lining
  addCasedArchitravePortal(doorGroup, {
    axis: 'x',
    wallCoord: 0,
    wallThickness: 0.15,
    openingCenter: 0,
    openingWidth: 0.826,
    frontFloorY: 0,
    backFloorY: 0,
    headY: 2.075,
    material: oakArchitraveMat,
    namePrefix: resolvedPrefix,
  });

  // Interactive hinged door leaf assembly
  const leafGroup = new THREE.Group();
  leafGroup.name = `${resolvedPrefix}.leafGroup`;
  leafGroup.position.set(0, 1.03, 0.02);

  // Main painted white door leaf (0.81m wide x 2.06m high) set inside the doorway opening
  const leaf = new THREE.Mesh(sharedDoorLeafGeo, whiteDoorMat);
  leaf.name = `${resolvedPrefix}.leaf`;
  leaf.castShadow = true;
  leaf.receiveShadow = true;
  leafGroup.add(leaf);

  // Shaker recessed panels + moulded framing on the door leaf
  const panelTags = ['upper', 'lower'] as const;
  const panelYs = [0.45, -0.47] as const;
  for (let i = 0; i < panelYs.length; i++) {
    const py = panelYs[i];
    const tag = panelTags[i];
    const panelRecess = new THREE.Mesh(sharedDoorPanelRecessGeo, whitePanelMat);
    panelRecess.name = `${resolvedPrefix}.${tag}PanelRecess`;
    panelRecess.position.set(0, py, 0);
    leafGroup.add(panelRecess);

    const innerPanel = new THREE.Mesh(sharedDoorInnerPanelGeo, whiteDoorMat);
    innerPanel.name = `${resolvedPrefix}.${tag}InnerPanel`;
    innerPanel.position.set(0, py, 0);
    leafGroup.add(innerPanel);
  }

  // 3 Brushed stainless steel butt hinges along the left jamb
  const hingeYs = [-0.68, 0.02, 0.72] as const;
  for (let i = 0; i < hingeYs.length; i++) {
    const hinge = new THREE.Mesh(sharedDoorButtHingeGeo, brushedHardwareMat);
    hinge.name = `${resolvedPrefix}.buttHinge_${i}`;
    hinge.position.set(-0.395, hingeYs[i], 0.04);
    tagHighLod(hinge);
    leafGroup.add(hinge);
  }

  // Brushed stainless steel backplate & lever handle on both sides of the door
  const backplate = new THREE.Mesh(sharedDoorBackplateGeo, brushedHardwareMat);
  backplate.name = `${resolvedPrefix}.handleBackplate`;
  backplate.position.set(0.31, -0.01, 0);
  tagHighLod(backplate);
  leafGroup.add(backplate);

  const spindle = new THREE.Mesh(sharedDoorSpindleGeo, brushedHardwareMat);
  spindle.name = `${resolvedPrefix}.handleSpindle`;
  spindle.position.set(0.31, 0.01, 0);
  tagHighLod(spindle);
  leafGroup.add(spindle);

  const leverSides = [
    [-0.06, 'North'],
    [0.06, 'South'],
  ] as const;
  for (const [hz, sideTag] of leverSides) {
    const lever = new THREE.Mesh(sharedDoorLeverGeo, brushedHardwareMat);
    lever.name = `${resolvedPrefix}.handleLever${sideTag}`;
    lever.position.set(0.265, 0.01, hz);
    tagHighLod(lever);
    leafGroup.add(lever);
  }

  doorGroup.add(leafGroup);
  ensureNamedHierarchy(doorGroup, resolvedPrefix);
  interactions.registerHingedDoor(
    doorGroup,
    leafGroup,
    new THREE.Vector3(-0.395, 0, 0),
    'y',
    1.35
  );

  parent.add(doorGroup);
}

/**
 * Builds a traditional farmhouse Split Stable Door for the Utility Room exterior exit.
 * Divided horizontally at mid-height (Y = 1.03m) into:
 * - An independent Lower Stable Leaf with vertical tongue-and-groove (T&G) cottage boarding, 2 hinges & deadbolt lever handle
 * - An independent Upper Stable Leaf (slightly ajar to show the split in 3D) with a 6-pane cottage glazed window,
 *   projecting oak weather drip bar across the horizontal split, 2 upper hinges & brushed stainless coupling shoot-bolt.
 * Both halves can be clicked to swing open/closed independently!
 */
export function buildSplitStableDoor(
  parent: THREE.Object3D,
  interactions: SceneBuilderContext['interactions'],
  x: number,
  z: number,
  rotY = 0
): void {
  const doorGroup = new THREE.Group();
  doorGroup.name = 'utility.stableDoor.group';
  doorGroup.position.set(x, 0, z);
  doorGroup.rotation.y = rotY;

  const whiteDoorMat = new THREE.MeshStandardMaterial({
    color: 0xf4f1ea,
    roughness: 0.34,
    metalness: 0.04,
  });
  const tgPlankMat = new THREE.MeshStandardMaterial({
    color: 0xe8e3d8,
    roughness: 0.42,
    metalness: 0.03,
  });
  const grooveShadowMat = new THREE.MeshStandardMaterial({
    color: 0x3b3833,
    roughness: 0.75,
  });
  const oakArchitraveMat = new THREE.MeshStandardMaterial({
    color: 0x8e643c,
    roughness: 0.52,
    metalness: 0.04,
  });
  const oakWeatherMat = new THREE.MeshStandardMaterial({
    color: 0x946b42,
    roughness: 0.52,
    metalness: 0.05,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xbad8f5,
    transparent: true,
    opacity: 0.24,
    roughness: 0.1,
    metalness: 0.18,
  });
  const brushedStainlessTex = createBrushedStainlessTexture();
  const brushedHardwareMat = new THREE.MeshStandardMaterial({
    map: brushedStainlessTex,
    bumpMap: brushedStainlessTex,
    bumpScale: 0.003,
    color: 0xc8c5be,
    roughness: 0.28,
    metalness: 0.48,
  });

  // Weathered oak exterior threshold weather sill at floor level (sized for 0.28m exterior brick wall)
  const oakSill = new THREE.Mesh(prepGeo(new THREE.BoxGeometry(0.94, 0.036, 0.32)), oakWeatherMat);
  oakSill.name = 'utility.stableDoor.thresholdSill';
  oakSill.position.set(0, 0.018, -0.01);
  oakSill.castShadow = true;
  oakSill.receiveShadow = true;
  doorGroup.add(oakSill);

  // Outer 45°-mitred ogee/torus solid antique oak architrave header & jambs + reveal lining
  addCasedArchitravePortal(doorGroup, {
    axis: 'x',
    wallCoord: 0,
    wallThickness: 0.28,
    openingCenter: 0,
    openingWidth: 0.826,
    frontFloorY: 0,
    backFloorY: 0,
    headY: 2.075,
    material: oakArchitraveMat,
    namePrefix: 'utility.stableDoor',
  });

  // =========================================================================
  // 1. LOWER STABLE LEAF (Y = 0.036m to 1.020m -> height 0.984m, width 0.81m)
  // =========================================================================
  const lowerLeafGroup = new THREE.Group();
  lowerLeafGroup.name = 'utility.stableDoor.lowerLeafGroup';
  lowerLeafGroup.position.set(0, 0.528, 0.02);

  // Outer framing stiles & rails of lower leaf
  const lowerLeafCore = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.81, 0.984, 0.058)),
    whiteDoorMat
  );
  lowerLeafCore.name = 'utility.stableDoor.lowerLeaf.core';
  lowerLeafCore.castShadow = true;
  lowerLeafCore.receiveShadow = true;
  lowerLeafGroup.add(lowerLeafCore);

  // Recessed Tongue-and-Groove (T&G) cottage vertical boarding panel on both faces
  const lowerRecess = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.61, 0.76, 0.064)),
    tgPlankMat
  );
  lowerRecess.name = 'utility.stableDoor.lowerLeaf.tgBoardingPanel';
  lowerLeafGroup.add(lowerRecess);

  // 6 Vertical V-groove shadow lines across the lower leaf T&G boarding
  const grooveXs = [-0.21, -0.126, -0.042, 0.042, 0.126, 0.21] as const;
  for (let i = 0; i < grooveXs.length; i++) {
    const vGroove = new THREE.Mesh(sharedStableVGrooveGeo, grooveShadowMat);
    vGroove.name = `utility.stableDoor.lowerLeaf.vGroove_${i}`;
    vGroove.position.set(grooveXs[i], 0, 0);
    tagHighLod(vGroove);
    lowerLeafGroup.add(vGroove);
  }

  // Top & bottom raised Shaker rails of the lower leaf
  for (const [ry, railTag] of [
    [-0.436, 'bottomRail'],
    [0.436, 'topRail'],
  ] as const) {
    const rail = new THREE.Mesh(sharedStableLowerRailGeo, whiteDoorMat);
    rail.name = `utility.stableDoor.lowerLeaf.${railTag}`;
    rail.position.set(0, ry, 0);
    lowerLeafGroup.add(rail);
  }
  for (const [sx, stileTag] of [
    [-0.35, 'leftStile'],
    [0.35, 'rightStile'],
  ] as const) {
    const stile = new THREE.Mesh(sharedStableLowerStileGeo, whiteDoorMat);
    stile.name = `utility.stableDoor.lowerLeaf.${stileTag}`;
    stile.position.set(sx, 0, 0);
    lowerLeafGroup.add(stile);
  }

  // 2 Brushed stainless steel butt hinges on the lower leaf (at Y = 0.22m & 0.84m)
  const lowerHingeYs = [-0.3, 0.31] as const;
  for (let i = 0; i < lowerHingeYs.length; i++) {
    const hinge = new THREE.Mesh(sharedDoorButtHingeGeo, brushedHardwareMat);
    hinge.name = `utility.stableDoor.lowerLeaf.buttHinge_${i}`;
    hinge.position.set(-0.395, lowerHingeYs[i], 0.038);
    tagHighLod(hinge);
    lowerLeafGroup.add(hinge);
  }

  // Lower leaf brushed stainless lever handle & mortice lock backplate (at Y = 0.90m, near top of lower leaf)
  const lowerBackplate = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.042, 0.14, 0.082)),
    brushedHardwareMat
  );
  lowerBackplate.name = 'utility.stableDoor.lowerLeaf.handleBackplate';
  lowerBackplate.position.set(0.32, 0.34, 0);
  tagHighLod(lowerBackplate);
  lowerLeafGroup.add(lowerBackplate);

  for (const [hz, sideTag] of [
    [-0.055, 'Interior'],
    [0.055, 'Exterior'],
  ] as const) {
    const lever = new THREE.Mesh(sharedStableLowerLeverGeo, brushedHardwareMat);
    lever.name = `utility.stableDoor.lowerLeaf.handleLever${sideTag}`;
    lever.position.set(0.275, 0.36, hz);
    tagHighLod(lever);
    lowerLeafGroup.add(lever);
  }

  // Dark horizontal split shadow seam between the Lower Leaf and Upper Leaf (local Y = +0.50m -> world Y = 1.028m)
  // Parented to lowerLeafGroup so the middle bar swings with the door and is never left visible in the doorway when open!
  const splitGapShadow = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.812, 0.016, 0.062)),
    grooveShadowMat
  );
  splitGapShadow.name = 'utility.stableDoor.splitGapShadow';
  splitGapShadow.position.set(0, 0.5, 0);
  lowerLeafGroup.add(splitGapShadow);

  doorGroup.add(lowerLeafGroup);
  const lowerPivot = interactions.registerHingedDoor(
    doorGroup,
    lowerLeafGroup,
    new THREE.Vector3(-0.405, 0, 0),
    'y',
    -1.35
  );

  // =========================================================================
  // 2. UPPER STABLE LEAF (Y = 1.038m to 2.065m -> height 1.027m, width 0.81m)
  //    Coupled with the lower leaf so the entire door opens and closes as one!
  // =========================================================================
  const upperLeafGroup = new THREE.Group();
  upperLeafGroup.name = 'utility.stableDoor.upperLeafGroup';
  upperLeafGroup.position.set(0, 1.552, 0.02);

  // Left & Right Vertical Stiles of upper glazed leaf
  for (const [sx, stileTag] of [
    [-0.35, 'leftStile'],
    [0.35, 'rightStile'],
  ] as const) {
    const stile = new THREE.Mesh(sharedStableUpperStileGeo, whiteDoorMat);
    stile.name = `utility.stableDoor.upperLeaf.${stileTag}`;
    stile.position.set(sx, 0, 0);
    stile.castShadow = true;
    upperLeafGroup.add(stile);
  }

  // Top & Bottom Horizontal Rails of upper glazed leaf
  for (const [ry, railTag] of [
    [-0.456, 'bottomRail'],
    [0.456, 'topRail'],
  ] as const) {
    const rail = new THREE.Mesh(sharedStableUpperRailGeo, whiteDoorMat);
    rail.name = `utility.stableDoor.upperLeaf.${railTag}`;
    rail.position.set(0, ry, 0);
    rail.castShadow = true;
    upperLeafGroup.add(rail);
  }

  // Projecting weathered oak weather-drip bar along the bottom rail of the upper leaf (right above the split seam!)
  const weatherDripBar = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.82, 0.026, 0.095)),
    oakWeatherMat
  );
  weatherDripBar.name = 'utility.stableDoor.upperLeaf.weatherDripBar';
  weatherDripBar.position.set(0, -0.502, -0.012);
  weatherDripBar.castShadow = true;
  upperLeafGroup.add(weatherDripBar);

  // 6-Pane (2 columns x 3 rows) Cottage Glazed Window inside the upper stable leaf
  const upperGlass = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.6, 0.81, 0.018)),
    glassMat
  );
  upperGlass.name = 'utility.stableDoor.upperLeaf.cottageGlassPane';
  upperGlass.position.set(0, 0, 0);
  upperLeafGroup.add(upperGlass);

  // Vertical center glazing muntin bar
  const vMuntin = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.022, 0.81, 0.042)),
    whiteDoorMat
  );
  vMuntin.name = 'utility.stableDoor.upperLeaf.verticalMuntin';
  vMuntin.position.set(0, 0, 0);
  upperLeafGroup.add(vMuntin);

  // 2 Horizontal glazing muntin bars (creating 6 cottage panes)
  const hMuntinYs = [-0.26, 0.26] as const;
  for (let i = 0; i < hMuntinYs.length; i++) {
    const hMuntin = new THREE.Mesh(sharedStableHorizMuntinGeo, whiteDoorMat);
    hMuntin.name = `utility.stableDoor.upperLeaf.horizontalMuntin_${i}`;
    hMuntin.position.set(0, hMuntinYs[i], 0);
    upperLeafGroup.add(hMuntin);
  }

  // 2 Brushed stainless steel butt hinges on the upper leaf (at local Y = -0.32m & +0.32m)
  const upperHingeYs = [-0.32, 0.32] as const;
  for (let i = 0; i < upperHingeYs.length; i++) {
    const hinge = new THREE.Mesh(sharedDoorButtHingeGeo, brushedHardwareMat);
    hinge.name = `utility.stableDoor.upperLeaf.buttHinge_${i}`;
    hinge.position.set(-0.395, upperHingeYs[i], 0.038);
    tagHighLod(hinge);
    upperLeafGroup.add(hinge);
  }

  // Upper leaf brushed stainless stable latch & vertical interconnecting coupling shoot-bolt
  const upperLatchPlate = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.038, 0.09, 0.078)),
    brushedHardwareMat
  );
  upperLatchPlate.name = 'utility.stableDoor.upperLeaf.latchPlate';
  upperLatchPlate.position.set(0.32, -0.38, 0);
  tagHighLod(upperLatchPlate);
  upperLeafGroup.add(upperLatchPlate);

  for (const [hz, sideTag] of [
    [-0.048, 'Interior'],
    [0.048, 'Exterior'],
  ] as const) {
    const upperKnob = new THREE.Mesh(sharedStableUpperKnobGeo, brushedHardwareMat);
    upperKnob.name = `utility.stableDoor.upperLeaf.latchKnob${sideTag}`;
    upperKnob.rotation.x = Math.PI / 2;
    upperKnob.position.set(0.32, -0.38, hz);
    tagHighLod(upperKnob);
    upperLeafGroup.add(upperKnob);
  }

  // Vertical interconnecting stable-door shoot bolt mounted on the inside bottom rail of the upper leaf
  const shootBolt = new THREE.Mesh(sharedStableShootBoltGeo, brushedHardwareMat);
  shootBolt.name = 'utility.stableDoor.upperLeaf.couplingShootBolt';
  shootBolt.position.set(0.22, -0.46, 0.04);
  tagHighLod(shootBolt);
  upperLeafGroup.add(shootBolt);

  doorGroup.add(upperLeafGroup);
  ensureNamedHierarchy(doorGroup, 'utility.stableDoor');
  const upperPivot = interactions.registerHingedDoor(
    doorGroup,
    upperLeafGroup,
    new THREE.Vector3(-0.405, 0, 0),
    'y',
    -1.35,
    0
  );
  interactions.linkDoorPair(lowerPivot, upperPivot);

  parent.add(doorGroup);
}

const sharedEastWinPostGeo = prepGeo(new THREE.BoxGeometry(0.26, 2.52, 0.055));

export function buildFullHeightEastWindow(
  parent: THREE.Object3D,
  x: number,
  centerZ: number
): void {
  const winGroup = new THREE.Group();
  winGroup.name = 'kitchen.eastWindow.group';
  winGroup.position.set(x, 0, centerZ);

  const oakFrameMat = new THREE.MeshStandardMaterial({
    color: 0x946b42,
    roughness: 0.52,
    metalness: 0.06,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xbad8f5,
    transparent: true,
    opacity: 0.18,
    roughness: 0.1,
    metalness: 0.2,
  });

  const winW = 2.0;
  const winH = 2.52;

  // Floor sill and top head frame (sized for 0.28m exterior brick wall)
  const sill = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.32, 0.045, winW + 0.06)),
    oakFrameMat
  );
  sill.name = 'kitchen.eastWindow.sill';
  sill.position.set(0, 0.022, 0);
  winGroup.add(sill);

  const head = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.29, 0.06, winW + 0.04)),
    oakFrameMat
  );
  head.name = 'kitchen.eastWindow.headFrame';
  head.position.set(0, winH - 0.03, 0);
  winGroup.add(head);

  // Outer jambs + 2 internal vertical mullions (3 tall full-height bays)
  const postPositions = [-winW / 2 + 0.03, -winW / 6, winW / 6, winW / 2 - 0.03] as const;
  for (let i = 0; i < postPositions.length; i++) {
    const post = new THREE.Mesh(sharedEastWinPostGeo, oakFrameMat);
    post.name = `kitchen.eastWindow.mullionPost_${i}`;
    post.position.set(0, winH / 2, postPositions[i]);
    post.castShadow = true;
    winGroup.add(post);
  }

  // Full-height glass pane
  const glass = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.016, winH - 0.09, winW - 0.1)),
    glassMat
  );
  glass.name = 'kitchen.eastWindow.glassPane';
  glass.position.set(0, winH / 2, 0);
  winGroup.add(glass);

  parent.add(winGroup);
}

export function buildKitchenShellAndBeams(ctx: SceneBuilderContext): void {
  const {
    scene,
    ceilingMeshGroup,
    ceilingCutaway,
    cutawayWallGroups,
    interactions,
  } = ctx;

  const stoneFloorTex = createStoneTileTexture();
  stoneFloorTex.repeat.set(7.85, 3.75);
  const floorMat = new THREE.MeshStandardMaterial({
    map: stoneFloorTex,
    roughness: 0.68,
    metalness: 0.04,
  });

  // Exact Architectural Plan Dimensions:
  // Dining Kitchen + Utility Wing = 9.40m (30'10") x 4.49m (14'9")
  // X = -4.40m to +5.00m (center X = +0.30m), Z = -2.50m to +1.99m (center Z = -0.255m)
  const floorMesh = new THREE.Mesh(prepGeo(new THREE.BoxGeometry(9.4, 0.12, 4.49)), floorMat);
  floorMesh.name = 'kitchen.floor.stoneTileSlab';
  floorMesh.position.set(0.3, -0.06, -0.255);
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  // Weathered stone / gravel tone so the plinth reads as yard and foundation against the meadow ground.
  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x6e6758,
    roughness: 0.9,
  });
  // Property-wide architectural sub-base plinth spanning the entire Main House Ground Floor & Courtyard
  const plinth = new THREE.Mesh(prepGeo(new THREE.BoxGeometry(34.5, 0.18, 19.5)), plinthMat);
  plinth.name = 'kitchen.foundation.subBasePlinth';
  plinth.position.set(-10.2, -0.78, 6.2);
  plinth.receiveShadow = true;
  scene.add(plinth);

  const eastPlinthCollar = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(11.38, 0.56, 9.78)),
    plinthMat
  );
  eastPlinthCollar.name = 'kitchen.foundation.eastPlinthCollar';
  eastPlinthCollar.position.set(1.05, -0.39, 2.09);
  eastPlinthCollar.receiveShadow = true;
  scene.add(eastPlinthCollar);

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xe6e1d6,
    roughness: 0.86,
    metalness: 0.02,
  });

  // Handmade English Farmhouse Imperial Brick material for all exterior wall elevations & gable ends
  const imperialBrickTex = createImperialBrickTextures();
  const imperialBrickMat = new THREE.MeshStandardMaterial({
    map: imperialBrickTex.colorMap,
    bumpMap: imperialBrickTex.bumpMap,
    bumpScale: 0.018,
    roughness: 0.82,
    metalness: 0.03,
  });

  // World-space UV mapper so Imperial Brick courses align seamlessly
  const applyWorldSpaceBrickUVs = (
    geo: THREE.BufferGeometry,
    offsetX: number,
    offsetY: number,
    offsetZ: number
  ): void => {
    const pos = geo.attributes.position;
    const norm = geo.attributes.normal;
    const uv = geo.attributes.uv;
    if (!pos || !norm || !uv) return;

    const tileW = 1.35;
    const tileH = 1.2;

    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i) + offsetX;
      const wy = pos.getY(i) + offsetY;
      const wz = pos.getZ(i) + offsetZ;
      const nx = Math.abs(norm.getX(i));
      const ny = Math.abs(norm.getY(i));
      const nz = Math.abs(norm.getZ(i));

      if (nx >= nz && nx >= ny) {
        uv.setXY(i, wz / tileW, wy / tileH);
      } else if (nz >= nx && nz >= ny) {
        uv.setXY(i, wx / tileW, wy / tileH);
      } else {
        uv.setXY(i, wx / tileW, wz / tileH);
      }
    }
    uv.needsUpdate = true;
  };

  // Builds a BoxGeometry wall segment with Imperial Brick on exterior faces and warm Plaster on interior faces
  const createExteriorBrickWallBox = (
    name: string,
    w: number,
    h: number,
    d: number,
    cx: number,
    cy: number,
    cz: number,
    plasterFaces: ReadonlyArray<'+x' | '-x' | '+y' | '-y' | '+z' | '-z'>
  ): THREE.Mesh => {
    const geo = new THREE.BoxGeometry(w, h, d);
    applyWorldSpaceBrickUVs(geo, cx, cy, cz);
    prepGeo(geo);
    const plasterSet = new Set(plasterFaces);
    const materials: THREE.Material[] = [
      plasterSet.has('+x') ? wallMat : imperialBrickMat,
      plasterSet.has('-x') ? wallMat : imperialBrickMat,
      plasterSet.has('+y') ? wallMat : imperialBrickMat,
      plasterSet.has('-y') ? wallMat : imperialBrickMat,
      plasterSet.has('+z') ? wallMat : imperialBrickMat,
      plasterSet.has('-z') ? wallMat : imperialBrickMat,
    ];
    const mesh = new THREE.Mesh(geo, materials);
    mesh.name = name;
    mesh.position.set(cx, cy, cz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  const wallHeight = 3.0;
  const extWallThick = 0.28;   // 280mm solid Victorian exterior brick wall
  const crossWallThick = 0.24; // 240mm load-bearing cross-wall between Kitchen & Family Room
  const partWallThick = 0.15;  // 150mm internal partition wall

  // North Back Wall
  const backWallLowBase = createExteriorBrickWallBox(
    'kitchen.northWall.lowBase',
    9.64,
    0.18,
    extWallThick,
    0.18,
    0.09,
    -2.5 - extWallThick / 2,
    ['+z']
  );
  scene.add(backWallLowBase);

  const backWall = createExteriorBrickWallBox(
    'kitchen.northWall.main',
    9.64,
    wallHeight - 0.18,
    extWallThick,
    0.18,
    0.18 + (wallHeight - 0.18) / 2,
    -2.5 - extWallThick / 2,
    ['+z']
  );
  cutawayWallGroups.north.add(backWall);

  // West Load-Bearing Cross-Wall between Kitchen & Family Room
  const westWallLowBase = createExteriorBrickWallBox(
    'kitchen.westCrossWall.lowBase',
    crossWallThick,
    0.18,
    3.35,
    -4.4 - crossWallThick / 2,
    0.09,
    -0.825,
    ['+x', '-x', '+y', '-y', '+z', '-z']
  );
  scene.add(westWallLowBase);

  const westWallMain = createExteriorBrickWallBox(
    'kitchen.westCrossWall.main',
    crossWallThick,
    wallHeight - 0.18,
    3.35,
    -4.4 - crossWallThick / 2,
    0.18 + (wallHeight - 0.18) / 2,
    -0.825,
    ['+x', '-x', '+y', '-y', '+z', '-z']
  );
  cutawayWallGroups.west.add(westWallMain);

  const westOpeningHeader = createExteriorBrickWallBox(
    'kitchen.westCrossWall.portalHeader',
    crossWallThick,
    0.94,
    1.14,
    -4.4 - crossWallThick / 2,
    2.53,
    1.42,
    ['+x', '-x', '+y', '-y', '+z', '-z']
  );
  cutawayWallGroups.west.add(westOpeningHeader);

  // Kitchen stone tile floor continuation into the open Kitchen <-> Dining Room portal up to X = -4.64m
  {
    const portalFloorGeo = new THREE.BoxGeometry(0.24, 0.08, 1.14);
    const pfPos = portalFloorGeo.attributes.position;
    const pfNorm = portalFloorGeo.attributes.normal;
    const pfUv = portalFloorGeo.attributes.uv;
    if (pfPos && pfNorm && pfUv) {
      for (let i = 0; i < pfPos.count; i++) {
        const wx = pfPos.getX(i) + -4.52;
        const wz = pfPos.getZ(i) + 1.42;
        if (Math.abs(pfNorm.getY(i)) > 0.5) {
          pfUv.setXY(i, (wx - -4.4) / 9.4, 1 - (wz - -2.5) / 4.49);
        }
      }
      pfUv.needsUpdate = true;
    }
    prepGeo(portalFloorGeo);
    const kitchenPortalFloor = new THREE.Mesh(portalFloorGeo, floorMat);
    kitchenPortalFloor.name = 'kitchen.portalFloor';
    kitchenPortalFloor.position.set(-4.52, -0.04, 1.42);
    kitchenPortalFloor.receiveShadow = true;
    scene.add(kitchenPortalFloor);
  }

  // Flush reclaimed Yorkstone threshold saddle strip at the Kitchen <-> Dining Room floor transition
  const portalStepMat = new THREE.MeshStandardMaterial({
    color: 0xb5aba0,
    roughness: 0.76,
    metalness: 0.04,
  });
  const portalThresholdStep = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.036, 0.004, 1.14)),
    portalStepMat
  );
  portalThresholdStep.name = 'kitchen.portalThreshold';
  portalThresholdStep.position.set(-4.64, 0.002, 1.42);
  portalThresholdStep.receiveShadow = true;
  scene.add(portalThresholdStep);

  // =========================================================================
  // EAST EXTERIOR BRICK WALL (X = +5.00m..+5.28m, Z = -2.78m to +2.27m, thickness 0.28m)
  // =========================================================================
  const eastWallCenterX = 5.0 + extWallThick / 2; // +5.14m

  const eastWallLowBaseNorth = createExteriorBrickWallBox(
    'utility.eastWall.lowBaseNorth',
    extWallThick,
    0.18,
    0.975,
    eastWallCenterX,
    0.09,
    -2.2925,
    ['-x']
  );
  scene.add(eastWallLowBaseNorth);

  const eastWallLowBaseMid = createExteriorBrickWallBox(
    'utility.eastWall.lowBaseMid',
    extWallThick,
    0.18,
    0.575,
    eastWallCenterX,
    0.09,
    -0.6375,
    ['-x']
  );
  scene.add(eastWallLowBaseMid);

  const eastWallLowBaseSouth = createExteriorBrickWallBox(
    'kitchen.eastWall.lowBaseSouth',
    extWallThick,
    0.18,
    0.62,
    eastWallCenterX,
    0.09,
    1.96,
    ['-x']
  );
  scene.add(eastWallLowBaseSouth);

  const eastWallUtilNorthPier = createExteriorBrickWallBox(
    'utility.eastWall.northPier',
    extWallThick,
    wallHeight - 0.18,
    0.975,
    eastWallCenterX,
    0.18 + (wallHeight - 0.18) / 2,
    -2.2925,
    ['-x']
  );
  cutawayWallGroups.east.add(eastWallUtilNorthPier);

  const eastWallUtilDoorHeader = createExteriorBrickWallBox(
    'utility.eastWall.doorHeader',
    extWallThick,
    0.86,
    0.88,
    eastWallCenterX,
    2.57,
    -1.365,
    ['-x']
  );
  cutawayWallGroups.east.add(eastWallUtilDoorHeader);

  const eastWallMidPier = createExteriorBrickWallBox(
    'utility.eastWall.midPier',
    extWallThick,
    wallHeight - 0.18,
    0.575,
    eastWallCenterX,
    0.18 + (wallHeight - 0.18) / 2,
    -0.6375,
    ['-x']
  );
  cutawayWallGroups.east.add(eastWallMidPier);

  // Exterior Split Stable Exit Door on the East end of the Utility Room (X = +5.14m, Z = -1.365m)
  buildSplitStableDoor(
    cutawayWallGroups.east,
    interactions,
    eastWallCenterX,
    -1.365,
    -Math.PI / 2
  );

  const eastWallSouthPier = createExteriorBrickWallBox(
    'kitchen.eastWall.southPier',
    extWallThick,
    wallHeight - 0.18,
    0.62,
    eastWallCenterX,
    0.18 + (wallHeight - 0.18) / 2,
    1.96,
    ['-x']
  );
  cutawayWallGroups.east.add(eastWallSouthPier);

  const eastWindowHeader = createExteriorBrickWallBox(
    'kitchen.eastWall.windowHeader',
    extWallThick,
    0.48,
    2.0,
    eastWallCenterX,
    2.76,
    0.65,
    ['-x']
  );
  cutawayWallGroups.east.add(eastWindowHeader);

  buildFullHeightEastWindow(cutawayWallGroups.east, eastWallCenterX, 0.65);

  // =========================================================================
  // UTILITY ROOM CUTOUT (Exact Plan Dimensions: 3.00m x 1.65m = 9'10" x 5'5")
  // =========================================================================
  const utilWestWall = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(partWallThick, wallHeight, 1.8)),
    wallMat
  );
  utilWestWall.name = 'utility.westPartitionWall';
  utilWestWall.position.set(1.925, wallHeight / 2, -1.6);
  utilWestWall.castShadow = true;
  utilWestWall.receiveShadow = true;
  scene.add(utilWestWall);

  // Utility Room South Wall (Z = -0.775m) with doorway cutout centered at X = +2.68m
  const utilSouthWallLeft = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.245, wallHeight, partWallThick)),
    wallMat
  );
  utilSouthWallLeft.name = 'utility.southPartitionWall.leftPier';
  utilSouthWallLeft.position.set(2.1225, wallHeight / 2, -0.775);
  utilSouthWallLeft.castShadow = true;
  utilSouthWallLeft.receiveShadow = true;
  scene.add(utilSouthWallLeft);

  const utilSouthWallRight = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(1.885, wallHeight, partWallThick)),
    wallMat
  );
  utilSouthWallRight.name = 'utility.southPartitionWall.rightPier';
  utilSouthWallRight.position.set(4.0575, wallHeight / 2, -0.775);
  utilSouthWallRight.castShadow = true;
  utilSouthWallRight.receiveShadow = true;
  scene.add(utilSouthWallRight);

  const utilDoorHeader = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.87, 0.86, partWallThick)),
    wallMat
  );
  utilDoorHeader.name = 'utility.southPartitionWall.doorHeader';
  utilDoorHeader.position.set(2.68, 2.57, -0.775);
  utilDoorHeader.castShadow = true;
  utilDoorHeader.receiveShadow = true;
  scene.add(utilDoorHeader);

  // Interactive Oak Door into the Utility Room
  buildOakDoor(scene, interactions, 2.68, -0.775, 0, 'kitchen.oakDoor');

  // Framed Picture of Hawaii mounted on the wall behind the sitting area armchairs (X = +4.06m, Y = 1.50m, Z = -0.683m)
  const hawaiiFrameGroup = new THREE.Group();
  hawaiiFrameGroup.name = 'kitchen.sitting.hawaiiArtworkFrame';
  hawaiiFrameGroup.position.set(4.06, 1.5, -0.683);

  const galleryOakFrameMat = new THREE.MeshStandardMaterial({
    color: 0x8d633b,
    roughness: 0.46,
    metalness: 0.06,
  });
  const museumMatBoardMat = new THREE.MeshStandardMaterial({
    color: 0xf6f3eb,
    roughness: 0.82,
    metalness: 0.0,
  });
  const matBevelMat = new THREE.MeshStandardMaterial({
    color: 0xdcd6c8,
    roughness: 0.78,
  });
  const hawaiiTex = createHawaiiArtworkTexture();
  const hawaiiPrintMat = new THREE.MeshStandardMaterial({
    map: hawaiiTex,
    roughness: 0.34,
    metalness: 0.02,
  });

  const frameW = 1.08;
  const frameH = 0.78;
  const mouldingW = 0.036;
  const frameDepth = 0.038;

  // Backing & off-white museum passe-partout mount board
  const mountBacking = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(frameW - mouldingW * 1.6, frameH - mouldingW * 1.6, 0.02)),
    museumMatBoardMat
  );
  mountBacking.name = 'kitchen.sitting.hawaiiArtworkFrame.mountBacking';
  mountBacking.position.set(0, 0, -0.004);
  mountBacking.receiveShadow = true;
  hawaiiFrameGroup.add(mountBacking);

  // Inner beveled mat window rim around the Hawaii print
  const innerBevelRim = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(0.868, 0.568, 0.023)),
    matBevelMat
  );
  innerBevelRim.name = 'kitchen.sitting.hawaiiArtworkFrame.innerBevelRim';
  innerBevelRim.position.set(0, 0, -0.003);
  hawaiiFrameGroup.add(innerBevelRim);

  // High-resolution Hawaii Na Pali / Hanalei Bay golden-hour artwork print
  const hawaiiCanvas = new THREE.Mesh(
    prepGeo(new THREE.PlaneGeometry(0.85, 0.55)),
    hawaiiPrintMat
  );
  hawaiiCanvas.name = 'kitchen.sitting.hawaiiArtworkFrame.canvas';
  hawaiiCanvas.position.set(0, 0, 0.01);
  hawaiiCanvas.receiveShadow = true;
  hawaiiFrameGroup.add(hawaiiCanvas);

  // Solid oak gallery box-frame rails & stiles (proud of the mat board)
  const hawaiiHRailGeo = prepGeo(new THREE.BoxGeometry(frameW, mouldingW, frameDepth));
  for (const [sy, railTag] of [
    [-1, 'bottomRail'],
    [1, 'topRail'],
  ] as const) {
    const hRail = new THREE.Mesh(hawaiiHRailGeo, galleryOakFrameMat);
    hRail.name = `kitchen.sitting.hawaiiArtworkFrame.${railTag}`;
    hRail.position.set(0, sy * (frameH * 0.5 - mouldingW * 0.5), 0.004);
    hRail.castShadow = true;
    hRail.receiveShadow = true;
    hawaiiFrameGroup.add(hRail);
  }

  const hawaiiVStileGeo = prepGeo(
    new THREE.BoxGeometry(mouldingW, frameH - mouldingW * 2, frameDepth)
  );
  for (const [sx, stileTag] of [
    [-1, 'leftStile'],
    [1, 'rightStile'],
  ] as const) {
    const vStile = new THREE.Mesh(hawaiiVStileGeo, galleryOakFrameMat);
    vStile.name = `kitchen.sitting.hawaiiArtworkFrame.${stileTag}`;
    vStile.position.set(sx * (frameW * 0.5 - mouldingW * 0.5), 0, 0.004);
    vStile.castShadow = true;
    vStile.receiveShadow = true;
    hawaiiFrameGroup.add(vStile);
  }

  scene.add(hawaiiFrameGroup);

  // South Front Wall at Z = +2.13m
  const southWallCenterZ = 1.99 + extWallThick / 2; // +2.13m

  const southLowCutaway = createExteriorBrickWallBox(
    'kitchen.southWall.westLowCutaway',
    2.48,
    0.18,
    extWallThick,
    -3.16,
    0.09,
    southWallCenterZ,
    ['-z', '-x']
  );
  scene.add(southLowCutaway);

  const southWestFullWall = createExteriorBrickWallBox(
    'kitchen.southWall.westFullWall',
    2.48,
    wallHeight - 0.18,
    extWallThick,
    -3.16,
    0.18 + (wallHeight - 0.18) / 2,
    southWallCenterZ,
    ['-z', '-x']
  );
  cutawayWallGroups.southWest.add(southWestFullWall);

  // Exterior Imperial Brick / interior plaster wall strip above the 3-Pane Window's thick Oak Mantel (Y = 2.74m to 3.00m)
  const southWindowHeader = createExteriorBrickWallBox(
    'kitchen.southWall.windowHeader',
    2.98,
    0.26,
    extWallThick,
    -0.43,
    2.87,
    southWallCenterZ,
    ['-z']
  );
  cutawayWallGroups.southWest.add(southWindowHeader);

  // Exterior Imperial Brick / interior plaster wall strip above the Bifold's thick Oak Mantel (Y = 2.74m to 3.00m)
  const bifoldHeader = createExteriorBrickWallBox(
    'kitchen.southWall.bifoldHeader',
    3.5,
    0.26,
    extWallThick,
    3.19,
    2.87,
    southWallCenterZ,
    ['-z']
  );
  cutawayWallGroups.southWest.add(bifoldHeader);

  const bifoldLeftPier = createExteriorBrickWallBox(
    'kitchen.southWall.bifoldLeftPier',
    0.38,
    wallHeight,
    extWallThick,
    1.25,
    wallHeight / 2,
    southWallCenterZ,
    ['-z']
  );
  cutawayWallGroups.southWest.add(bifoldLeftPier);

  const bifoldRightPier = createExteriorBrickWallBox(
    'kitchen.southWall.bifoldRightPier',
    0.06,
    wallHeight,
    extWallThick,
    4.97,
    wallHeight / 2,
    southWallCenterZ,
    ['-z']
  );
  cutawayWallGroups.southWest.add(bifoldRightPier);

  // =========================================================================
  // ANTIQUE OAK 45°-MITRED SKIRTING BOARDS ALONG ALL EXPOSED INTERIOR WALLS
  // =========================================================================
  const skirtingMat = new THREE.MeshStandardMaterial({
    color: 0x8e643c,
    roughness: 0.56,
    metalness: 0.04,
  });

  const addMitredKitchenSkirting = (
    name: string,
    parent: THREE.Object3D,
    path: ReadonlyArray<readonly [number, number]>
  ): void => {
    const geo = prepGeo(buildMitredWallSkirtingGeometry(path));
    const mesh = new THREE.Mesh(geo, skirtingMat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
  };

  addMitredKitchenSkirting('kitchen.skirting.southWestWall', scene, [
    [-1.92, 1.99],
    [-4.4, 1.99],
  ]);
  addMitredKitchenSkirting('kitchen.skirting.southCentralPier', cutawayWallGroups.southWest, [
    [1.44, 1.99],
    [1.06, 1.99],
  ]);
  addMitredKitchenSkirting('kitchen.skirting.sittingNorthEastCorner', scene, [
    [3.15, -0.7],
    [5.0, -0.7],
    [5.0, -0.35],
  ]);
  addMitredKitchenSkirting('kitchen.skirting.sittingSouthEastCorner', scene, [
    [5.0, 1.65],
    [5.0, 1.99],
  ]);
  addMitredKitchenSkirting('kitchen.skirting.tvPartitionWall', scene, [
    [1.85, -1.845],
    [1.85, -0.7],
    [2.21, -0.7],
  ]);
  addMitredKitchenSkirting('utility.skirting.westSouthInternalCorner', scene, [
    [2.21, -0.85],
    [2.0, -0.85],
    [2.0, -1.86],
  ]);
  addMitredKitchenSkirting('utility.skirting.southWallRight', scene, [
    [5.0, -0.85],
    [3.15, -0.85],
  ]);

  // Smooth Plaster Ceiling over the 9.40m x 4.49m Kitchen & Utility Wing
  const ceilingMat = new THREE.MeshStandardMaterial({
    color: 0xf2eee6,
    roughness: 0.9,
    side: THREE.DoubleSide,
  });
  const fullCeiling = new THREE.Mesh(
    prepGeo(new THREE.BoxGeometry(9.64, 0.08, 4.49)),
    ceilingMat
  );
  fullCeiling.name = 'kitchen.ceiling.plasterSlab';
  fullCeiling.position.set(0.18, 3.04, -0.255);
  ceilingMeshGroup.add(fullCeiling);

  // =========================================================================
  // WELSH SLATE PITCHED ROOF, TIMBER SOFFITS, PAINTED FASCIA BOARDS,
  // CAST-IRON HALF-ROUND GUTTERS & RAINWATER DOWNPIPES (inside ceilingMeshGroup)
  // =========================================================================
  const wallWestX = -4.64;
  const wallEastX = 5.28;
  const wallNorthZ = -2.78;
  const wallSouthZ = 2.27;
  const roofCenterZ = (wallNorthZ + wallSouthZ) * 0.5; // -0.255m
  const halfWallZ = (wallSouthZ - wallNorthZ) * 0.5; // 2.525m

  const eavesOverhangZ = 0.245;
  const vergeOverhangX = 0.2;
  const halfEavesZ = halfWallZ + eavesOverhangZ; // 2.77m from roofCenterZ to outer face of fascia
  const fasciaSouthZ = roofCenterZ + halfEavesZ; // +2.515m
  const fasciaNorthZ = roofCenterZ - halfEavesZ; // -3.025m
  const vergeWestX = wallWestX; // Joins the Family Room wing seamlessly at X = -4.64m
  const vergeEastX = wallEastX + vergeOverhangX; // +5.48m
  const roofSpanX = vergeEastX - vergeWestX; // 10.12m

  const soffitBotY = 3.0; // Flush with top of the 3.00m exterior walls
  const fasciaTopY = 3.15; // 150mm vertical fascia / bargeboard depth
  const pitchSlope = 0.52; // Traditional Victorian slate roof pitch
  const pitchAngle = Math.atan(pitchSlope);

  const yDeckAt = (d: number): number => fasciaTopY + (halfEavesZ - d) * pitchSlope;
  const yBargeBotAt = (d: number): number => soffitBotY + (halfEavesZ - d) * pitchSlope;

  const ridgeDeckY = yDeckAt(0);
  const ridgeBargeBotY = yBargeBotAt(0);
  const wallDeckY = yDeckAt(halfWallZ);

  const welshSlateTex = createWelshSlateRoofTexture();
  const welshSlateMat = new THREE.MeshStandardMaterial({
    map: welshSlateTex,
    bumpMap: welshSlateTex,
    bumpScale: 0.018,
    color: 0xffffff,
    roughness: 0.78,
    metalness: 0.02,
  });
  const ridgeLeadMat = new THREE.MeshStandardMaterial({
    color: 0x383d45,
    roughness: 0.44,
    metalness: 0.38,
    side: THREE.DoubleSide,
  });
  const soffitFasciaMat = new THREE.MeshStandardMaterial({
    color: 0xefeae0,
    roughness: 0.38,
    metalness: 0.03,
  });
  const gutterCastIronMat = new THREE.MeshStandardMaterial({
    color: 0x8fa693, // Heritage pale sage-green painted gutters
    roughness: 0.38,
    metalness: 0.22,
    side: THREE.DoubleSide,
  });
  const gutterInnerDarkMat = new THREE.MeshStandardMaterial({
    color: 0x0d0f12,
    roughness: 0.72,
    metalness: 0.25,
  });

  const addExtrudedZYProfile = (
    name: string,
    pointsZY: ReadonlyArray<readonly [number, number]>,
    xStart: number,
    xEnd: number,
    mat: THREE.Material,
    useBrickWorldUVs = false
  ): THREE.Mesh => {
    const shape = new THREE.Shape();
    pointsZY.forEach(([z, y], idx) => {
      if (idx === 0) {
        shape.moveTo(-z, y);
      } else {
        shape.lineTo(-z, y);
      }
    });
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: xEnd - xStart,
      bevelEnabled: false,
    });
    geo.rotateY(Math.PI / 2);
    geo.translate(xStart, 0, 0);
    geo.computeVertexNormals();

    if (useBrickWorldUVs) {
      applyWorldSpaceBrickUVs(geo, 0, 0, 0);
    }
    prepGeo(geo);

    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    ceilingMeshGroup.add(mesh);
    return mesh;
  };

  // 1. Cross-Wall & East Gable End Imperial Brick Masonry Pentagons
  const gablePointsZY: ReadonlyArray<readonly [number, number]> = [
    [wallNorthZ, 3.0],
    [wallSouthZ, 3.0],
    [wallSouthZ, wallDeckY],
    [roofCenterZ, ridgeDeckY],
    [wallNorthZ, wallDeckY],
  ];

  addExtrudedZYProfile(
    'kitchen.roof.westGableBrick',
    gablePointsZY,
    wallWestX + 0.01,
    wallWestX + crossWallThick,
    imperialBrickMat,
    true
  );
  addExtrudedZYProfile(
    'kitchen.roof.eastGableBrick',
    gablePointsZY,
    wallEastX - extWallThick,
    wallEastX,
    imperialBrickMat,
    true
  );

  // 2. Unified Pitched Verge Soffit & Plumb-Cut Bargeboard at East Gable
  const vergeChevronPointsZY: ReadonlyArray<readonly [number, number]> = [
    [fasciaNorthZ, soffitBotY],
    [roofCenterZ, ridgeBargeBotY],
    [fasciaSouthZ, soffitBotY],
    [fasciaSouthZ, fasciaTopY],
    [roofCenterZ, ridgeDeckY],
    [fasciaNorthZ, fasciaTopY],
  ];

  addExtrudedZYProfile(
    'kitchen.roof.eastVergeSoffit',
    vergeChevronPointsZY,
    wallEastX,
    vergeEastX - 0.026,
    soffitFasciaMat
  );

  const outerBargePointsZY: ReadonlyArray<readonly [number, number]> = [
    [fasciaNorthZ, soffitBotY - 0.006],
    [roofCenterZ, ridgeBargeBotY - 0.006],
    [fasciaSouthZ, soffitBotY - 0.006],
    [fasciaSouthZ, fasciaTopY + 0.004],
    [roofCenterZ, ridgeDeckY + 0.004],
    [fasciaNorthZ, fasciaTopY + 0.004],
  ];

  addExtrudedZYProfile(
    'kitchen.roof.eastOuterBargeboard',
    outerBargePointsZY,
    vergeEastX - 0.026,
    vergeEastX,
    soffitFasciaMat
  );

  // 3. Horizontal Eaves Soffit Boards & Vertical Painted Timber Fascia Boards (South & North Eaves)
  const southEavesBoxPointsZY: ReadonlyArray<readonly [number, number]> = [
    [wallSouthZ, soffitBotY],
    [fasciaSouthZ, soffitBotY],
    [fasciaSouthZ, fasciaTopY],
    [wallSouthZ, wallDeckY],
  ];
  addExtrudedZYProfile(
    'kitchen.roof.southEavesSoffit',
    southEavesBoxPointsZY,
    wallWestX,
    wallEastX,
    soffitFasciaMat
  );

  const northEavesBoxPointsZY: ReadonlyArray<readonly [number, number]> = [
    [fasciaNorthZ, soffitBotY],
    [wallNorthZ, soffitBotY],
    [wallNorthZ, wallDeckY],
    [fasciaNorthZ, fasciaTopY],
  ];
  addExtrudedZYProfile(
    'kitchen.roof.northEavesSoffit',
    northEavesBoxPointsZY,
    wallWestX,
    wallEastX,
    soffitFasciaMat
  );

  const roofMidX = (vergeWestX + vergeEastX) * 0.5;
  const fasciaBoardGeo = prepGeo(
    new THREE.BoxGeometry(roofSpanX, fasciaTopY - soffitBotY + 0.006, 0.022)
  );
  for (const [fasciaZ, normalSign, sideName] of [
    [fasciaSouthZ, 1, 'southFasciaBoard'],
    [fasciaNorthZ, -1, 'northFasciaBoard'],
  ] as const) {
    const fasciaFace = new THREE.Mesh(fasciaBoardGeo, soffitFasciaMat);
    fasciaFace.name = `kitchen.roof.${sideName}`;
    fasciaFace.position.set(
      roofMidX,
      (soffitBotY + fasciaTopY) * 0.5 - 0.003,
      fasciaZ + normalSign * 0.008
    );
    fasciaFace.castShadow = true;
    fasciaFace.receiveShadow = true;
    ceilingMeshGroup.add(fasciaFace);
  }

  // 4. Pitched North & South Welsh Slate Roof Slopes
  const slateOverhangIntoGutter = 0.03;
  const slateHalfSpanZ = halfEavesZ + slateOverhangIntoGutter;
  const slateRiseY = slateHalfSpanZ * pitchSlope;
  const rafterLength = Math.hypot(slateHalfSpanZ, slateRiseY);
  const slateThick = 0.036;

  const slopeMidOffsetZ = slateHalfSpanZ * 0.5;
  const slopeMidY =
    ridgeDeckY - slateRiseY * 0.5 + slateThick * 0.5 * Math.cos(pitchAngle);

  const slateSlopeGeo = prepGeo(
    new THREE.BoxGeometry(roofSpanX + 0.04, slateThick, rafterLength)
  );
  const southSlateSlope = new THREE.Mesh(slateSlopeGeo, welshSlateMat);
  southSlateSlope.name = 'kitchen.roof.southSlateSlope';
  southSlateSlope.position.set(roofMidX, slopeMidY, roofCenterZ + slopeMidOffsetZ);
  southSlateSlope.rotation.x = pitchAngle;
  southSlateSlope.castShadow = true;
  southSlateSlope.receiveShadow = true;
  ceilingMeshGroup.add(southSlateSlope);

  const northSlateSlope = new THREE.Mesh(slateSlopeGeo, welshSlateMat);
  northSlateSlope.name = 'kitchen.roof.northSlateSlope';
  northSlateSlope.position.set(roofMidX, slopeMidY, roofCenterZ - slopeMidOffsetZ);
  northSlateSlope.rotation.x = -pitchAngle;
  northSlateSlope.castShadow = true;
  northSlateSlope.receiveShadow = true;
  ceilingMeshGroup.add(northSlateSlope);

  const ridgeCap = new THREE.Mesh(
    prepGeo(
      new THREE.CylinderGeometry(0.058, 0.058, roofSpanX + 0.05, 16, 1, false, 0, Math.PI)
    ),
    ridgeLeadMat
  );
  ridgeCap.name = 'kitchen.roof.ridgeLeadCap';
  ridgeCap.rotation.z = Math.PI / 2;
  ridgeCap.position.set(roofMidX, ridgeDeckY + 0.008, roofCenterZ);
  ridgeCap.castShadow = true;
  ceilingMeshGroup.add(ridgeCap);

  const ridgeCollarGeo = prepGeo(
    new THREE.CylinderGeometry(0.064, 0.064, 0.02, 14, 1, false, 0, Math.PI)
  );
  let collarIdx = 0;
  for (let rx = -4.4; rx <= 5.3; rx += 0.45) {
    const ridgeCollar = new THREE.Mesh(ridgeCollarGeo, ridgeLeadMat);
    ridgeCollar.name = `kitchen.roof.ridgeCollar_${collarIdx++}`;
    ridgeCollar.rotation.z = Math.PI / 2;
    ridgeCollar.position.set(rx, ridgeDeckY + 0.01, roofCenterZ);
    tagHighLod(ridgeCollar);
    ceilingMeshGroup.add(ridgeCollar);
  }

  // 5. Cast-Iron Half-Round Rainwater Gutters + Fascia Support Brackets
  const gutterLength = roofSpanX + 0.02;
  const gutterRadius = 0.052;
  const gutterY = 3.125;
  const gutterSouthZ = fasciaSouthZ + 0.018 + gutterRadius;
  const gutterNorthZ = fasciaNorthZ - 0.018 - gutterRadius;

  const gutterTroughGeo = prepGeo(
    new THREE.CylinderGeometry(
      gutterRadius,
      gutterRadius,
      gutterLength,
      18,
      1,
      true,
      Math.PI,
      Math.PI
    )
  );
  const gutterLipGeo = prepGeo(new THREE.CylinderGeometry(0.0055, 0.0055, gutterLength, 8));
  const gutterStopEndGeo = prepGeo(
    new THREE.CircleGeometry(gutterRadius, 16, Math.PI, Math.PI)
  );
  const gutterBracketStrapGeo = prepGeo(
    new THREE.TorusGeometry(gutterRadius + 0.004, 0.0045, 8, 16, Math.PI)
  );
  const gutterFasciaClipGeo = prepGeo(new THREE.BoxGeometry(0.02, 0.065, 0.018));

  for (const [gutterZ, normalSign, gutterSide] of [
    [gutterSouthZ, 1, 'southGutter'],
    [gutterNorthZ, -1, 'northGutter'],
  ] as const) {
    const gutterTrough = new THREE.Mesh(gutterTroughGeo, gutterCastIronMat);
    gutterTrough.name = `kitchen.roof.${gutterSide}.trough`;
    gutterTrough.rotation.z = Math.PI / 2;
    gutterTrough.position.set(roofMidX, gutterY, gutterZ);
    gutterTrough.castShadow = true;
    ceilingMeshGroup.add(gutterTrough);

    for (const [lipSide, lipTag] of [
      [-1, 'innerLip'],
      [1, 'outerLip'],
    ] as const) {
      const lip = new THREE.Mesh(gutterLipGeo, gutterCastIronMat);
      lip.name = `kitchen.roof.${gutterSide}.${lipTag}`;
      lip.rotation.z = Math.PI / 2;
      lip.position.set(roofMidX, gutterY, gutterZ + lipSide * gutterRadius);
      tagHighLod(lip);
      ceilingMeshGroup.add(lip);
    }

    for (const [endX, endTag] of [
      [roofMidX - gutterLength * 0.5, 'westStopEnd'],
      [roofMidX + gutterLength * 0.5, 'eastStopEnd'],
    ] as const) {
      const stopEnd = new THREE.Mesh(gutterStopEndGeo, gutterCastIronMat);
      stopEnd.name = `kitchen.roof.${gutterSide}.${endTag}`;
      stopEnd.rotation.y = Math.PI / 2;
      stopEnd.position.set(endX, gutterY, gutterZ);
      tagHighLod(stopEnd);
      ceilingMeshGroup.add(stopEnd);
    }

    let bIdx = 0;
    for (let bx = -4.5; bx <= 5.35; bx += 0.9) {
      const bracketStrap = new THREE.Mesh(gutterBracketStrapGeo, gutterCastIronMat);
      bracketStrap.name = `kitchen.roof.${gutterSide}.bracketStrap_${bIdx}`;
      bracketStrap.rotation.y = Math.PI / 2;
      bracketStrap.rotation.x = Math.PI;
      bracketStrap.position.set(bx, gutterY, gutterZ);
      tagHighLod(bracketStrap);
      ceilingMeshGroup.add(bracketStrap);

      const fasciaClip = new THREE.Mesh(gutterFasciaClipGeo, gutterCastIronMat);
      fasciaClip.name = `kitchen.roof.${gutterSide}.fasciaClip_${bIdx}`;
      fasciaClip.position.set(bx, gutterY - 0.02, gutterZ - normalSign * (gutterRadius + 0.006));
      tagHighLod(fasciaClip);
      ceilingMeshGroup.add(fasciaClip);
      bIdx++;
    }
  }

  // 6. Continuous Cast-Iron Rainwater Downpipes
  const pipeR = 0.032;
  const dpOutletNozzleGeo = prepGeo(
    new THREE.CylinderGeometry(pipeR + 0.012, pipeR + 0.006, 0.075, 16)
  );
  const dpVertPipeGeo = prepGeo(new THREE.CylinderGeometry(pipeR, pipeR, 2.63, 16));
  const dpSocketRingGeo = prepGeo(
    new THREE.CylinderGeometry(pipeR + 0.008, pipeR + 0.006, 0.052, 16)
  );
  const dpEarPlateGeo = prepGeo(new THREE.BoxGeometry(0.14, 0.036, 0.022));
  const dpGulleyRimGeo = prepGeo(new THREE.BoxGeometry(0.2, 0.022, 0.2));
  const dpGulleyGrateGeo = prepGeo(new THREE.BoxGeometry(0.15, 0.024, 0.15));

  const addCastIronDownpipe = (
    dpName: string,
    pipeX: number,
    gutterZ: number,
    wallOuterZ: number,
    outwardSign: 1 | -1
  ): void => {
    const dpGroup = new THREE.Group();
    dpGroup.name = dpName;
    const wallPipeZ = wallOuterZ + outwardSign * 0.042;

    const outletNozzle = new THREE.Mesh(dpOutletNozzleGeo, gutterCastIronMat);
    outletNozzle.name = `${dpName}.outletNozzle`;
    outletNozzle.position.set(pipeX, gutterY - gutterRadius - 0.02, gutterZ);
    outletNozzle.castShadow = true;
    dpGroup.add(outletNozzle);

    const swanCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(pipeX, gutterY - gutterRadius - 0.005, gutterZ),
      new THREE.Vector3(pipeX, 2.985, gutterZ),
      new THREE.Vector3(pipeX, 2.915, (gutterZ + wallPipeZ) * 0.5),
      new THREE.Vector3(pipeX, 2.835, wallPipeZ),
      new THREE.Vector3(pipeX, 2.75, wallPipeZ),
    ]);
    const swanTube = new THREE.Mesh(
      prepGeo(new THREE.TubeGeometry(swanCurve, 20, pipeR, 16, false)),
      gutterCastIronMat
    );
    swanTube.name = `${dpName}.swanNeckTube`;
    swanTube.castShadow = true;
    dpGroup.add(swanTube);

    const vertPipe = new THREE.Mesh(dpVertPipeGeo, gutterCastIronMat);
    vertPipe.name = `${dpName}.verticalPipe`;
    vertPipe.position.set(pipeX, 1.445, wallPipeZ);
    vertPipe.castShadow = true;
    vertPipe.receiveShadow = true;
    dpGroup.add(vertPipe);

    const clipYs = [2.72, 2.0, 1.28, 0.56] as const;
    for (let i = 0; i < clipYs.length; i++) {
      const clipY = clipYs[i];
      const socketRing = new THREE.Mesh(dpSocketRingGeo, gutterCastIronMat);
      socketRing.name = `${dpName}.socketRing_${i}`;
      socketRing.position.set(pipeX, clipY, wallPipeZ);
      socketRing.castShadow = true;
      tagHighLod(socketRing);
      dpGroup.add(socketRing);

      const earPlate = new THREE.Mesh(dpEarPlateGeo, gutterCastIronMat);
      earPlate.name = `${dpName}.earPlate_${i}`;
      earPlate.position.set(pipeX, clipY, wallOuterZ + outwardSign * 0.011);
      tagHighLod(earPlate);
      dpGroup.add(earPlate);
    }

    const shoeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(pipeX, 0.15, wallPipeZ),
      new THREE.Vector3(pipeX, 0.095, wallPipeZ + outwardSign * 0.01),
      new THREE.Vector3(pipeX, 0.052, wallPipeZ + outwardSign * 0.048),
    ]);
    const shoeTube = new THREE.Mesh(
      prepGeo(new THREE.TubeGeometry(shoeCurve, 10, pipeR + 0.002, 16, false)),
      gutterCastIronMat
    );
    shoeTube.name = `${dpName}.outletShoeTube`;
    shoeTube.castShadow = true;
    dpGroup.add(shoeTube);

    const gulleyRim = new THREE.Mesh(dpGulleyRimGeo, gutterCastIronMat);
    gulleyRim.name = `${dpName}.gulleyRim`;
    gulleyRim.position.set(pipeX, 0.011, wallPipeZ + outwardSign * 0.075);
    tagHighLod(gulleyRim);
    dpGroup.add(gulleyRim);

    const gulleyGrate = new THREE.Mesh(dpGulleyGrateGeo, gutterInnerDarkMat);
    gulleyGrate.name = `${dpName}.gulleyGrate`;
    gulleyGrate.position.set(pipeX, 0.012, wallPipeZ + outwardSign * 0.075);
    tagHighLod(gulleyGrate);
    dpGroup.add(gulleyGrate);

    ceilingMeshGroup.add(dpGroup);
  };

  addCastIronDownpipe('kitchen.roof.southEastDownpipe', 5.14, gutterSouthZ, wallSouthZ, 1);
  addCastIronDownpipe('kitchen.roof.northWestDownpipe', -4.52, gutterNorthZ, wallNorthZ, -1);

  ceilingMeshGroup.visible = !ceilingCutaway;
}
