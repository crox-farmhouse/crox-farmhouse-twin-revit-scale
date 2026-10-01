import * as THREE from 'three';
import type { InteractiveUserData, SceneBuilderContext } from '../../../../types/scene.ts';
import {
  createBrushedStainlessTexture,
  createHawaiiArtworkTexture,
  createImperialBrickTextures,
  createMarbleBacksplashTexture,
  createPolishedChromeTexture,
  createStoneTileTexture,
  createTVArtGalleryTextures,
  createWelshSlateRoofTexture,
} from '../../../../engine/textures/procedural-textures.ts';
import { buildHollowCabinetCarcass } from '../../../../objects/joinery/cabinet-interior.ts';
import { addCasedArchitravePortal, buildMitredWallSkirtingGeometry } from '../../../../engine/geometry/swept-moulding.ts';

export function buildOakDoor(
  parent: THREE.Object3D,
  interactions: SceneBuilderContext['interactions'],
  x: number,
  z: number,
  rotY = 0
): void {
  const doorGroup = new THREE.Group();
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
    namePrefix: 'kitchen.oakDoor',
  });

  // Interactive hinged door leaf assembly
  const leafGroup = new THREE.Group();
  leafGroup.position.set(0, 1.03, 0.02);

  // Main painted white door leaf (0.81m wide x 2.06m high) set inside the doorway opening
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.81, 2.06, 0.06), whiteDoorMat);
  leaf.castShadow = true;
  leaf.receiveShadow = true;
  leafGroup.add(leaf);

  // Shaker recessed panels + moulded framing on the door leaf
  for (const py of [0.45, -0.47]) {
    const panelRecess = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.68, 0.072), whitePanelMat);
    panelRecess.position.set(0, py, 0);
    leafGroup.add(panelRecess);

    const innerPanel = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.08), whiteDoorMat);
    innerPanel.position.set(0, py, 0);
    leafGroup.add(innerPanel);
  }

  // 3 Brushed stainless steel butt hinges along the left jamb
  for (const hy of [-0.68, 0.02, 0.72]) {
    const hinge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.075, 8),
      brushedHardwareMat
    );
    hinge.position.set(-0.395, hy, 0.04);
    leafGroup.add(hinge);
  }

  // Brushed stainless steel backplate & lever handle on both sides of the door
  const backplate = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.15, 0.085), brushedHardwareMat);
  backplate.position.set(0.31, -0.01, 0);
  leafGroup.add(backplate);

  const spindle = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.018, 0.13), brushedHardwareMat);
  spindle.position.set(0.31, 0.01, 0);
  leafGroup.add(spindle);

  for (const hz of [-0.06, 0.06]) {
    const lever = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.02, 0.02), brushedHardwareMat);
    lever.position.set(0.265, 0.01, hz);
    leafGroup.add(lever);
  }

  doorGroup.add(leafGroup);
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
function buildSplitStableDoor(
  parent: THREE.Object3D,
  interactions: SceneBuilderContext['interactions'],
  x: number,
  z: number,
  rotY = 0
): void {
  const doorGroup = new THREE.Group();
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
  const oakSill = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.036, 0.32), oakWeatherMat);
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
  lowerLeafGroup.position.set(0, 0.528, 0.02);

  // Outer framing stiles & rails of lower leaf
  const lowerLeafCore = new THREE.Mesh(new THREE.BoxGeometry(0.81, 0.984, 0.058), whiteDoorMat);
  lowerLeafCore.castShadow = true;
  lowerLeafCore.receiveShadow = true;
  lowerLeafGroup.add(lowerLeafCore);

  // Recessed Tongue-and-Groove (T&G) cottage vertical boarding panel on both faces
  const lowerRecess = new THREE.Mesh(new THREE.BoxGeometry(0.61, 0.76, 0.064), tgPlankMat);
  lowerLeafGroup.add(lowerRecess);

  // 6 Vertical V-groove shadow lines across the lower leaf T&G boarding
  for (const gx of [-0.21, -0.126, -0.042, 0.042, 0.126, 0.21]) {
    const vGroove = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.75, 0.068), grooveShadowMat);
    vGroove.position.set(gx, 0, 0);
    lowerLeafGroup.add(vGroove);
  }

  // Top & bottom raised Shaker rails of the lower leaf
  for (const ry of [-0.436, 0.436]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.81, 0.112, 0.068), whiteDoorMat);
    rail.position.set(0, ry, 0);
    lowerLeafGroup.add(rail);
  }
  for (const sx of [-0.35, 0.35]) {
    const stile = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.984, 0.068), whiteDoorMat);
    stile.position.set(sx, 0, 0);
    lowerLeafGroup.add(stile);
  }

  // 2 Brushed stainless steel butt hinges on the lower leaf (at Y = 0.22m & 0.84m)
  for (const hy of [-0.30, 0.31]) {
    const hinge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.075, 8),
      brushedHardwareMat
    );
    hinge.position.set(-0.395, hy, 0.038);
    lowerLeafGroup.add(hinge);
  }

  // Lower leaf brushed stainless lever handle & mortice lock backplate (at Y = 0.90m, near top of lower leaf)
  const lowerBackplate = new THREE.Mesh(
    new THREE.BoxGeometry(0.042, 0.14, 0.082),
    brushedHardwareMat
  );
  lowerBackplate.position.set(0.32, 0.34, 0);
  lowerLeafGroup.add(lowerBackplate);

  for (const hz of [-0.055, 0.055]) {
    const lever = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.018, 0.018), brushedHardwareMat);
    lever.position.set(0.275, 0.36, hz);
    lowerLeafGroup.add(lever);
  }

  doorGroup.add(lowerLeafGroup);
  interactions.registerHingedDoor(
    doorGroup,
    lowerLeafGroup,
    new THREE.Vector3(-0.405, 0, 0),
    'y',
    -1.35
  );

  // Dark horizontal split shadow seam between the Lower Leaf and Upper Leaf (at Y = 1.028m)
  const splitGapShadow = new THREE.Mesh(
    new THREE.BoxGeometry(0.812, 0.016, 0.062),
    grooveShadowMat
  );
  splitGapShadow.position.set(0, 1.028, 0.02);
  doorGroup.add(splitGapShadow);

  // =========================================================================
  // 2. UPPER STABLE LEAF (Y = 1.038m to 2.065m -> height 1.027m, width 0.81m)
  //    Starts slightly ajar (-0.15 rad) and swings wide open (-1.45 rad) when clicked!
  // =========================================================================
  const upperLeafGroup = new THREE.Group();
  upperLeafGroup.position.set(0, 1.552, 0.02);

  // Left & Right Vertical Stiles of upper glazed leaf
  for (const sx of [-0.35, 0.35]) {
    const stile = new THREE.Mesh(new THREE.BoxGeometry(0.11, 1.027, 0.066), whiteDoorMat);
    stile.position.set(sx, 0, 0);
    stile.castShadow = true;
    upperLeafGroup.add(stile);
  }

  // Top & Bottom Horizontal Rails of upper glazed leaf
  for (const ry of [-0.456, 0.456]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.81, 0.115, 0.066), whiteDoorMat);
    rail.position.set(0, ry, 0);
    rail.castShadow = true;
    upperLeafGroup.add(rail);
  }

  // Projecting weathered oak weather-drip bar along the bottom rail of the upper leaf (right above the split seam!)
  const weatherDripBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.82, 0.026, 0.095),
    oakWeatherMat
  );
  weatherDripBar.position.set(0, -0.502, -0.012);
  weatherDripBar.castShadow = true;
  upperLeafGroup.add(weatherDripBar);

  // 6-Pane (2 columns x 3 rows) Cottage Glazed Window inside the upper stable leaf
  const upperGlass = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.81, 0.018), glassMat);
  upperGlass.position.set(0, 0, 0);
  upperLeafGroup.add(upperGlass);

  // Vertical center glazing muntin bar
  const vMuntin = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.81, 0.042), whiteDoorMat);
  vMuntin.position.set(0, 0, 0);
  upperLeafGroup.add(vMuntin);

  // 2 Horizontal glazing muntin bars (creating 6 cottage panes)
  for (const my of [-0.26, 0.26]) {
    const hMuntin = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.022, 0.042), whiteDoorMat);
    hMuntin.position.set(0, my, 0);
    upperLeafGroup.add(hMuntin);
  }

  // 2 Brushed stainless steel butt hinges on the upper leaf (at local Y = -0.32m & +0.32m)
  for (const hy of [-0.32, 0.32]) {
    const hinge = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.009, 0.075, 8),
      brushedHardwareMat
    );
    hinge.position.set(-0.395, hy, 0.038);
    upperLeafGroup.add(hinge);
  }

  // Upper leaf brushed stainless stable latch & vertical interconnecting coupling shoot-bolt
  const upperLatchPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.038, 0.09, 0.078),
    brushedHardwareMat
  );
  upperLatchPlate.position.set(0.32, -0.38, 0);
  upperLeafGroup.add(upperLatchPlate);

  for (const hz of [-0.048, 0.048]) {
    const upperKnob = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.022, 10),
      brushedHardwareMat
    );
    upperKnob.rotation.x = Math.PI / 2;
    upperKnob.position.set(0.32, -0.38, hz);
    upperLeafGroup.add(upperKnob);
  }

  // Vertical interconnecting stable-door shoot bolt mounted on the inside bottom rail of the upper leaf
  const shootBolt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.007, 0.007, 0.14, 8),
    brushedHardwareMat
  );
  shootBolt.position.set(0.22, -0.46, 0.04);
  upperLeafGroup.add(shootBolt);

  doorGroup.add(upperLeafGroup);
  interactions.registerHingedDoor(
    doorGroup,
    upperLeafGroup,
    new THREE.Vector3(-0.405, 0, 0),
    'y',
    -1.45,
    -0.15
  );

  parent.add(doorGroup);
}


function buildFullHeightEastWindow(parent: THREE.Object3D, x: number, centerZ: number): void {
  const winGroup = new THREE.Group();
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
  const sill = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.045, winW + 0.06), oakFrameMat);
  sill.position.set(0, 0.022, 0);
  winGroup.add(sill);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.06, winW + 0.04), oakFrameMat);
  head.position.set(0, winH - 0.03, 0);
  winGroup.add(head);

  // Outer jambs + 2 internal vertical mullions (3 tall full-height bays)
  const postPositions = [-winW / 2 + 0.03, -winW / 6, winW / 6, winW / 2 - 0.03];
  for (const pz of postPositions) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.26, winH, 0.055), oakFrameMat);
    post.position.set(0, winH / 2, pz);
    post.castShadow = true;
    winGroup.add(post);
  }

  // Full-height glass pane
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(0.016, winH - 0.09, winW - 0.1),
    glassMat
  );
  glass.position.set(0, winH / 2, 0);
  winGroup.add(glass);

  parent.add(winGroup);
}

export function buildArchitecturalShellAndUtilityRoom(
  ctx: SceneBuilderContext
): THREE.MeshStandardMaterial {
  const {
    scene,
    ceilingMeshGroup,
    ceilingCutaway,
    cutawayWallGroups,
    interactiveMeshes,
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
  const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.12, 4.49), floorMat);
  floorMesh.position.set(0.3, -0.06, -0.255);
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x1b2028,
    roughness: 0.85,
  });
  // Property-wide dark architectural sub-base plinth spanning the entire Main House Ground Floor & Courtyard
  // Seated below Y = -0.69m so the lowered (-0.30m and -0.60m) interior floors and sloped courtyard (-0.60m) are unobstructed,
  // with an upper plinth collar under the Y = 0.00m East Wing & Raised Terrace.
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(34.5, 0.18, 19.5), plinthMat);
  plinth.position.set(-10.2, -0.78, 6.2);
  scene.add(plinth);

  const eastPlinthCollar = new THREE.Mesh(new THREE.BoxGeometry(11.38, 0.56, 9.78), plinthMat);
  eastPlinthCollar.position.set(1.05, -0.39, 2.09);
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

  // World-space UV mapper so Imperial Brick courses (1.44m wide x 1.328m tall per 16-course tile)
  // align seamlessly across all wall piers, window/door headers, cutaway base walls, and gable pentagons!
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
        // East (+X) or West (-X) face
        uv.setXY(i, wz / tileW, wy / tileH);
      } else if (nz >= nx && nz >= ny) {
        // South (+Z) or North (-Z) face
        uv.setXY(i, wx / tileW, wy / tileH);
      } else {
        // Top (+Y) or Bottom (-Y) reveal/coping face
        uv.setXY(i, wx / tileW, wz / tileH);
      }
    }
    uv.needsUpdate = true;
  };

  // Builds a BoxGeometry wall segment with Imperial Brick on exterior faces and warm Plaster on interior faces
  // BoxGeometry face material order: [0: +X (East), 1: -X (West), 2: +Y (Top), 3: -Y (Bottom), 4: +Z (South), 5: -Z (North)]
  const createExteriorBrickWallBox = (
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
    mesh.position.set(cx, cy, cz);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  };

  const wallHeight = 3.0;
  const extWallThick = 0.28;   // 280mm solid Victorian exterior brick wall
  const crossWallThick = 0.24; // 240mm load-bearing cross-wall between Kitchen & Family Room
  const partWallThick = 0.15;  // 150mm internal partition wall

  // North Back Wall (9.92m span X = -4.64m to +5.28m at Z = -2.50m..-2.78m, centered at X = +0.32m, Z = -2.64m)
  // Interior face is +Z (inside kitchen & utility); exterior faces are -Z, +X (Imperial Brick)
  const backWallLowBase = createExteriorBrickWallBox(
    9.92,
    0.18,
    extWallThick,
    0.32,
    0.09,
    -2.5 - extWallThick / 2,
    ['+z', '+y']
  );
  scene.add(backWallLowBase);

  const backWall = createExteriorBrickWallBox(
    9.92,
    wallHeight,
    extWallThick,
    0.32,
    wallHeight / 2,
    -2.5 - extWallThick / 2,
    ['+z', '+y']
  );
  cutawayWallGroups.north.add(backWall);

  // West Load-Bearing Cross-Wall between Kitchen & Family Room (X = -4.40m..-4.64m, thickness 0.24m, Z = -2.50m to +1.99m):
  // Entire cross-wall is interior warm plaster on all faces; wide open portal at Z = +0.85m..+1.99m (width 1.14m, center Z = +1.42m, matching PH-53 & floorplan)
  const westWallLowBase = createExteriorBrickWallBox(
    crossWallThick,
    0.18,
    3.35,
    -4.4 - crossWallThick / 2,
    0.09,
    -0.825,
    ['+x', '-x', '+y', '-y', '+z', '-z']
  );
  westWallLowBase.name = 'kitchen.westCrossWall.lowBase';
  scene.add(westWallLowBase);

  const westWallMain = createExteriorBrickWallBox(
    crossWallThick,
    wallHeight - 0.18,
    3.35,
    -4.4 - crossWallThick / 2,
    0.18 + (wallHeight - 0.18) / 2,
    -0.825,
    ['+x', '-x', '+y', '-y', '+z', '-z']
  );
  westWallMain.name = 'kitchen.westCrossWall.main';
  cutawayWallGroups.west.add(westWallMain);

  const westOpeningHeader = createExteriorBrickWallBox(
    crossWallThick,
    0.94,
    1.14,
    -4.4 - crossWallThick / 2,
    2.53,
    1.42,
    ['+x', '-x', '+y', '-y', '+z', '-z']
  );
  westOpeningHeader.name = 'kitchen.westCrossWall.portalHeader';
  cutawayWallGroups.west.add(westOpeningHeader);

  // Kitchen stone tile floor continuation into the open Kitchen <-> Dining Room portal up to X = -4.64m
  // (halfway along the right-hand pillar X = -4.40m..-4.96m and flush with the left-hand portal corner — Issue #1)
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
    const kitchenPortalFloor = new THREE.Mesh(portalFloorGeo, floorMat);
    kitchenPortalFloor.name = 'kitchen.portalFloor';
    kitchenPortalFloor.position.set(-4.52, -0.04, 1.42);
    kitchenPortalFloor.receiveShadow = true;
    scene.add(kitchenPortalFloor);
  }

  // Flush reclaimed Yorkstone threshold saddle strip at the Kitchen <-> Dining Room floor transition
  // Moved to X = -4.64m (halfway along the pillar on the right X = -4.40m..-4.96m — Issue #1)
  const portalStepMat = new THREE.MeshStandardMaterial({
    color: 0xb5aba0,
    roughness: 0.76,
    metalness: 0.04,
  });
  const portalThresholdStep = new THREE.Mesh(
    new THREE.BoxGeometry(0.036, 0.004, 1.14),
    portalStepMat
  );
  portalThresholdStep.name = 'kitchen.portalThreshold';
  portalThresholdStep.position.set(-4.64, 0.002, 1.42);
  portalThresholdStep.receiveShadow = true;
  scene.add(portalThresholdStep);

  // =========================================================================
  // EAST EXTERIOR BRICK WALL (X = +5.00m..+5.28m, Z = -2.78m to +2.27m, thickness 0.28m)
  //   - Interior face is -X (warm plaster inside Utility & Kitchen Sitting Area)
  //   - Exterior face is +X (handmade English Imperial Brick)
  // =========================================================================
  const eastWallCenterX = 5.0 + extWallThick / 2; // +5.14m

  const eastWallLowBaseNorth = createExteriorBrickWallBox(
    extWallThick,
    0.18,
    0.975,
    eastWallCenterX,
    0.09,
    -2.2925,
    ['-x', '+y']
  );
  scene.add(eastWallLowBaseNorth);

  const eastWallLowBaseSouth = createExteriorBrickWallBox(
    extWallThick,
    0.18,
    3.195,
    eastWallCenterX,
    0.09,
    0.6725,
    ['-x', '+y']
  );
  scene.add(eastWallLowBaseSouth);

  const eastWallUtilNorthPier = createExteriorBrickWallBox(
    extWallThick,
    wallHeight,
    0.975,
    eastWallCenterX,
    wallHeight / 2,
    -2.2925,
    ['-x', '+y']
  );
  cutawayWallGroups.east.add(eastWallUtilNorthPier);

  const eastWallUtilDoorHeader = createExteriorBrickWallBox(
    extWallThick,
    0.86,
    0.88,
    eastWallCenterX,
    2.57,
    -1.365,
    ['-x', '+y']
  );
  cutawayWallGroups.east.add(eastWallUtilDoorHeader);

  const eastWallMidPier = createExteriorBrickWallBox(
    extWallThick,
    wallHeight,
    0.575,
    eastWallCenterX,
    wallHeight / 2,
    -0.6375,
    ['-x', '+y']
  );
  cutawayWallGroups.east.add(eastWallMidPier);

  // Exterior Split Stable Exit Door on the East end of the Utility Room (X = +5.14m, Z = -1.365m) — inside cutawayWallGroups.east!
  buildSplitStableDoor(
    cutawayWallGroups.east,
    interactions,
    eastWallCenterX,
    -1.365,
    -Math.PI / 2
  );

  const eastWallSouthPier = createExteriorBrickWallBox(
    extWallThick,
    wallHeight,
    0.62,
    eastWallCenterX,
    wallHeight / 2,
    1.96,
    ['-x', '+y']
  );
  cutawayWallGroups.east.add(eastWallSouthPier);

  const eastWindowHeader = createExteriorBrickWallBox(
    extWallThick,
    0.48,
    2.0,
    eastWallCenterX,
    2.76,
    0.65,
    ['-x', '+y']
  );
  cutawayWallGroups.east.add(eastWindowHeader);

  buildFullHeightEastWindow(cutawayWallGroups.east, eastWallCenterX, 0.65);

  // =========================================================================
  // UTILITY ROOM CUTOUT (Exact Plan Dimensions: 3.00m x 1.65m = 9'10" x 5'5")
  //   - Internal X span: X = +2.00m to +5.00m (length 3.00m)
  //   - Internal Z span: Z = -2.50m to -0.85m (width 1.65m)
  //   - 0.15m West Partition Wall at X = +1.85m..+2.00m (center X = +1.925m)
  //   - 0.15m South Partition Wall at Z = -0.85m..-0.70m (center Z = -0.775m)
  // =========================================================================
  const utilWestWall = new THREE.Mesh(
    new THREE.BoxGeometry(partWallThick, wallHeight, 1.8),
    wallMat
  );
  utilWestWall.position.set(1.925, wallHeight / 2, -1.6);
  utilWestWall.castShadow = true;
  utilWestWall.receiveShadow = true;
  scene.add(utilWestWall);

  // Utility Room South Wall (Z = -0.775m) with doorway cutout centered at X = +2.68m (X = 2.245m..3.115m)
  // Starts at X = +2.00m (flush with the East face of utilWestWall at X = 1.85m..2.00m) to avoid coplanar corner Z-fighting
  const utilSouthWallLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.245, wallHeight, partWallThick),
    wallMat
  );
  utilSouthWallLeft.position.set(2.1225, wallHeight / 2, -0.775);
  utilSouthWallLeft.castShadow = true;
  utilSouthWallLeft.receiveShadow = true;
  scene.add(utilSouthWallLeft);

  const utilSouthWallRight = new THREE.Mesh(
    new THREE.BoxGeometry(1.885, wallHeight, partWallThick),
    wallMat
  );
  utilSouthWallRight.position.set(4.0575, wallHeight / 2, -0.775);
  utilSouthWallRight.castShadow = true;
  utilSouthWallRight.receiveShadow = true;
  scene.add(utilSouthWallRight);

  const utilDoorHeader = new THREE.Mesh(
    new THREE.BoxGeometry(0.87, 0.86, partWallThick),
    wallMat
  );
  utilDoorHeader.position.set(2.68, 2.57, -0.775);
  utilDoorHeader.castShadow = true;
  utilDoorHeader.receiveShadow = true;
  scene.add(utilDoorHeader);

  // Interactive Oak Door into the Utility Room
  buildOakDoor(scene, interactions, 2.68, -0.775, 0);

  // Framed Picture of Hawaii mounted on the wall behind the sitting area armchairs (X = +4.06m, Y = 1.50m, Z = -0.683m)
  const hawaiiFrameGroup = new THREE.Group();
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
    new THREE.BoxGeometry(frameW - mouldingW * 1.6, frameH - mouldingW * 1.6, 0.02),
    museumMatBoardMat
  );
  mountBacking.position.set(0, 0, -0.004);
  mountBacking.receiveShadow = true;
  hawaiiFrameGroup.add(mountBacking);

  // Inner beveled mat window rim around the Hawaii print
  const innerBevelRim = new THREE.Mesh(
    new THREE.BoxGeometry(0.868, 0.568, 0.023),
    matBevelMat
  );
  innerBevelRim.position.set(0, 0, -0.003);
  hawaiiFrameGroup.add(innerBevelRim);

  // High-resolution Hawaii Na Pali / Hanalei Bay golden-hour artwork print
  const hawaiiCanvas = new THREE.Mesh(
    new THREE.PlaneGeometry(0.85, 0.55),
    hawaiiPrintMat
  );
  hawaiiCanvas.position.set(0, 0, 0.01);
  hawaiiCanvas.receiveShadow = true;
  hawaiiFrameGroup.add(hawaiiCanvas);

  // Solid oak gallery box-frame rails & stiles (proud of the mat board)
  for (const sy of [-1, 1]) {
    const hRail = new THREE.Mesh(
      new THREE.BoxGeometry(frameW, mouldingW, frameDepth),
      galleryOakFrameMat
    );
    hRail.position.set(0, sy * (frameH * 0.5 - mouldingW * 0.5), 0.004);
    hRail.castShadow = true;
    hRail.receiveShadow = true;
    hawaiiFrameGroup.add(hRail);
  }
  for (const sx of [-1, 1]) {
    const vStile = new THREE.Mesh(
      new THREE.BoxGeometry(mouldingW, frameH - mouldingW * 2, frameDepth),
      galleryOakFrameMat
    );
    vStile.position.set(sx * (frameW * 0.5 - mouldingW * 0.5), 0, 0.004);
    vStile.castShadow = true;
    vStile.receiveShadow = true;
    hawaiiFrameGroup.add(vStile);
  }

  scene.add(hawaiiFrameGroup);

  // Frame TV (Art Mode) mounted on the X = +1.85m Utility Room West Partition Wall (at X = +1.835m, Z = -1.26m)
  const tvGroup = new THREE.Group();
  tvGroup.position.set(1.835, 1.48, -1.26);
  tvGroup.rotation.y = -Math.PI / 2;

  const tvFrameOakMat = new THREE.MeshStandardMaterial({
    color: 0x7d5836,
    roughness: 0.45,
    metalness: 0.08,
  });
  const tvBezel = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.44, 0.035),
    tvFrameOakMat
  );
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
  const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.38), tvScreenMat);
  tvScreen.position.set(0, 0, 0.019);
  tvScreen.receiveShadow = true;
  tvScreen.userData = tvUserData;
  tvGroup.add(tvScreen);
  interactiveMeshes.push(tvScreen);

  scene.add(tvGroup);

  // =========================================================================
  // UTILITY ROOM INTERIOR DETAILS (Exact 3.00m x 1.65m Plan: X = +2.00m to +5.00m, Z = -2.50m to -0.85m)
  // Floor-standing utility cabinets and Miele washing machines stay visible in scene;
  // the wall-hung wooden shelf above the washing machines cuts away with cutawayWallGroups.north!
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
  const utilKnobGeo = new THREE.SphereGeometry(0.014, 10, 8);

  const addUtilityShakerDoor = (
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
    doorGroup.position.set(cx, cy, carcassFaceZ);

    const insetPanel = new THREE.Mesh(
      new THREE.BoxGeometry(w - 0.008, h - 0.008, 0.01),
      doveGreyMat
    );
    insetPanel.position.set(0, 0, 0.005);
    insetPanel.receiveShadow = true;
    doorGroup.add(insetPanel);

    const frameThickness = 0.022;
    for (const side of [-1, 1]) {
      const stile = new THREE.Mesh(
        new THREE.BoxGeometry(stileW, h, frameThickness),
        doveGreyMat
      );
      stile.position.set(side * (w * 0.5 - stileW * 0.5), 0, frameThickness * 0.5);
      stile.castShadow = true;
      stile.receiveShadow = true;
      doorGroup.add(stile);
    }

    const innerSpan = Math.max(0.03, w - stileW * 2);
    for (const vSide of [-1, 1]) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(innerSpan, stileW, frameThickness),
        doveGreyMat
      );
      rail.position.set(0, vSide * (h * 0.5 - stileW * 0.5), frameThickness * 0.5);
      rail.castShadow = true;
      rail.receiveShadow = true;
      doorGroup.add(rail);
    }

    const knob = new THREE.Mesh(utilKnobGeo, brushedKnobMat);
    knob.scale.set(1, 1, 0.75);
    knob.position.set(knobLocalX, knobLocalY, 0.03);
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
  // Lower utility cupboard cavity (Y = 0..0.87m, 14cm kickboard)
  buildHollowCabinetCarcass(utilNorthParent, 2.41, 0, -2.18, 0.82, 0.87, 0.64, '+z', doveGreyMat, {
    plinthHeight: 0.14,
    interiorStyle: 'utility',
    shelfCount: 1,
    hasCenterMullion: true,
    includeItems: true,
  });
  // Upper tall utility/broom cupboard cavity (Y = 0.87m..2.42m)
  buildHollowCabinetCarcass(utilNorthParent, 2.41, 0.87, -2.18, 0.82, 1.55, 0.64, '+z', doveGreyMat, {
    plinthHeight: 0,
    interiorStyle: 'utility',
    shelfCount: 3,
    hasCenterMullion: true,
    includeItems: true,
  });

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

  for (const [frac, th, yOff] of tallCorniceTiers) {
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
      new THREE.BoxGeometry(fullW, th, outerMaxZ - uInnerMaxZ),
      doveGreyMat
    );
    frontBar.position.set(centerX, tierY, (uInnerMaxZ + outerMaxZ) * 0.5);
    frontBar.castShadow = true;
    utilNorthParent.add(frontBar);

    const rightSpanZ = uInnerMaxZ - outerMinZ;
    const rightBar = new THREE.Mesh(
      new THREE.BoxGeometry(outerMaxX - uInnerMaxX, th, rightSpanZ),
      doveGreyMat
    );
    rightBar.position.set((uInnerMaxX + outerMaxX) * 0.5, tierY, (outerMinZ + uInnerMaxZ) * 0.5);
    rightBar.castShadow = true;
    utilNorthParent.add(rightBar);
  }

  // Upper & lower full-overlay Interactive Shaker double doors on the Full-Height Left Utility Unit
  for (const dx of [2.208, 2.612]) {
    const hingeSide: -1 | 1 = dx < 2.41 ? -1 : 1;
    const knobLocalX = dx < 2.41 ? 0.145 : -0.145;
    addUtilityShakerDoor(dx, 1.645, -1.86, 0.398, 1.53, hingeSide, knobLocalX, -0.625, 0.054);
    addUtilityShakerDoor(dx, 0.505, -1.86, 0.398, 0.73, hingeSide, knobLocalX, 0.275, 0.054);
  }

  // 2. UTILITY WORKTOP & SINK BASE UNIT TO THE RIGHT OF THE FULL-HEIGHT UNIT (X = +2.82m to +5.00m, width 2.18m)
  buildHollowCabinetCarcass(utilNorthParent, 3.3, 0, -2.18, 0.96, 0.9, 0.62, '+z', doveGreyMat, {
    plinthHeight: 0.14,
    interiorStyle: 'utility',
    shelfCount: 1,
    hasCenterMullion: true,
    includeItems: true,
  });

  // 2 Full-Overlay Interactive Shaker doors under the Utility Sink (X = +2.82m to +3.78m)
  for (const sx of [3.062, 3.538]) {
    const hingeSide: -1 | 1 = sx < 3.3 ? -1 : 1;
    const knobLocalX = sx < 3.3 ? 0.18 : -0.18;
    addUtilityShakerDoor(sx, 0.505, -1.87, 0.468, 0.73, hingeSide, knobLocalX, 0.285, 0.054);
  }

  // Single Dove Grey support panel between the Sink Base Unit and the Left Miele Washing Machine (at X = +3.79m);
  // the right-hand Miele washing machine goes right up against the outside East wall (X = +5.00m) at the end of the 3.00m span!
  const dividerCheek = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.9, 0.62),
    doveGreyMat
  );
  dividerCheek.position.set(3.79, 0.45, -2.18);
  utilNorthParent.add(dividerCheek);

  // Continuous Carrara marble worktop from the right side of the full-height unit (X = +2.82m) all the way to the East outside wall (X = +5.00m, width 2.18m)
  const utilTop = new THREE.Mesh(new THREE.BoxGeometry(2.18, 0.045, 0.65), limestoneMat);
  utilTop.position.set(3.91, 0.92, -2.17);
  utilTop.castShadow = true;
  utilTop.receiveShadow = true;
  utilNorthParent.add(utilTop);

  // Marble upstand along the Utility Room worktop back wall & right-hand East outside wall (no left upstand against the cupboard)
  const utilBackUpstand = new THREE.Mesh(
    new THREE.BoxGeometry(2.18, 0.095, 0.022),
    limestoneMat
  );
  utilBackUpstand.position.set(3.91, 0.9875, -2.484);
  utilNorthParent.add(utilBackUpstand);

  const utilRightUpstand = new THREE.Mesh(
    new THREE.BoxGeometry(0.022, 0.095, 0.65),
    limestoneMat
  );
  utilRightUpstand.position.set(4.989, 0.9875, -2.17);
  utilNorthParent.add(utilRightUpstand);

  // Utility Sink positioned to the right of the full-height unit (at X = +3.22m, Z = -2.17m)
  const utilSinkRim = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 0.02, 0.44),
    new THREE.MeshStandardMaterial({ color: 0xfaf8f2, roughness: 0.18 })
  );
  utilSinkRim.position.set(3.22, 0.944, -2.17);
  utilNorthParent.add(utilSinkRim);

  const utilSinkBasin = new THREE.Mesh(
    new THREE.BoxGeometry(0.48, 0.024, 0.38),
    new THREE.MeshStandardMaterial({ color: 0xc8c4ba, roughness: 0.28 })
  );
  utilSinkBasin.position.set(3.22, 0.947, -2.17);
  utilNorthParent.add(utilSinkBasin);

  // Routed marble drainer grooves to the right of the Utility Sink (X = +3.62m)
  for (const gz of [-2.32, -2.245, -2.17, -2.095, -2.02]) {
    const groove = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.004, 0.01),
      new THREE.MeshStandardMaterial({ color: 0xd8d3c8, roughness: 0.26 })
    );
    groove.position.set(3.62, 0.946, gz);
    utilNorthParent.add(groove);
  }

  // Polished Chrome Swan-Neck Mixer Tap at the back of the Utility Sink (X = +3.22m, Z = -2.41m)
  const utilTapBase = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.024, 0.04),
    polishedChromeMat
  );
  utilTapBase.position.set(3.22, 0.955, -2.41);
  utilNorthParent.add(utilTapBase);

  const utilTapStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.013, 0.015, 0.24, 12),
    polishedChromeMat
  );
  utilTapStem.position.set(3.22, 1.07, -2.41);
  utilTapStem.castShadow = true;
  utilNorthParent.add(utilTapStem);

  const utilTapSpout = new THREE.Mesh(
    new THREE.TorusGeometry(0.088, 0.012, 10, 18, Math.PI),
    polishedChromeMat
  );
  utilTapSpout.rotation.y = Math.PI / 2;
  utilTapSpout.position.set(3.22, 1.18, -2.322);
  utilTapSpout.castShadow = true;
  utilNorthParent.add(utilTapSpout);

  // 3. PAIR OF MIELE WASHING MACHINES WITH CHROME DOORS & GLASS WINDOWS
  //    Going right up against the outside East wall (X = +5.00m) at the end of the 3.00m span (X = +3.80m..+4.40m and +4.40m..+5.00m)
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

  for (const wx of [4.1, 4.7]) {
    const mieleGroup = new THREE.Group();
    mieleGroup.position.set(wx, 0, -2.17);

    // Main Lotus White Miele cabinet body (0.595m wide x 0.85m tall x 0.60m deep)
    const cabinet = new THREE.Mesh(
      new THREE.BoxGeometry(0.595, 0.85, 0.6),
      mieleWhiteMat
    );
    cabinet.position.set(0, 0.445, 0);
    cabinet.castShadow = true;
    cabinet.receiveShadow = true;
    mieleGroup.add(cabinet);

    // Recessed dark kick plinth at bottom
    const kickPlinth = new THREE.Mesh(
      new THREE.BoxGeometry(0.59, 0.04, 0.56),
      mieleDarkRecessMat
    );
    kickPlinth.position.set(0, 0.02, 0);
    mieleGroup.add(kickPlinth);

    // Top Miele slanted control fascia panel (Y = 0.745m..0.885m)
    const fasciaPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.595, 0.135, 0.026),
      mieleWhiteMat
    );
    fasciaPanel.position.set(0, 0.815, 0.302);
    fasciaPanel.rotation.x = -0.08;
    mieleGroup.add(fasciaPanel);

    // Fascia divider groove & left detergent drawer seam
    const fasciaSeam = new THREE.Mesh(
      new THREE.BoxGeometry(0.596, 0.004, 0.03),
      mieleDarkRecessMat
    );
    fasciaSeam.position.set(0, 0.745, 0.302);
    mieleGroup.add(fasciaSeam);

    const drawerSeam = new THREE.Mesh(
      new THREE.BoxGeometry(0.004, 0.135, 0.03),
      mieleDarkRecessMat
    );
    drawerSeam.position.set(-0.085, 0.815, 0.303);
    mieleGroup.add(drawerSeam);

    // Red Miele logo badge on the detergent drawer
    const mieleBadge = new THREE.Mesh(
      new THREE.BoxGeometry(0.048, 0.016, 0.006),
      mieleBadgeRedMat
    );
    mieleBadge.position.set(-0.19, 0.835, 0.315);
    mieleGroup.add(mieleBadge);

    // Central Miele Polished Chrome rotary programme selector dial
    const rotaryDial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.022, 0.022, 0.02, 18),
      polishedChromeMat
    );
    rotaryDial.rotation.x = Math.PI / 2;
    rotaryDial.position.set(0.01, 0.815, 0.318);
    mieleGroup.add(rotaryDial);

    // Right-side dark glass M-Touch status display with glowing warm readout
    const displayPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.175, 0.055, 0.006),
      mieleDarkRecessMat
    );
    displayPanel.position.set(0.165, 0.815, 0.315);
    mieleGroup.add(displayPanel);

    const displayDigits = new THREE.Mesh(
      new THREE.PlaneGeometry(0.065, 0.018),
      mieleDisplayLedMat
    );
    displayDigits.position.set(0.155, 0.815, 0.319);
    mieleGroup.add(displayDigits);

    // Internal perforated Brushed Stainless Steel Miele Honeycomb Drum + 3 lifters visible through the glass
    const innerDrumBack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.165, 0.165, 0.06, 24),
      brushedKnobMat
    );
    innerDrumBack.rotation.x = Math.PI / 2;
    innerDrumBack.position.set(0, 0.425, 0.275);
    mieleGroup.add(innerDrumBack);

    const rubberGasket = new THREE.Mesh(
      new THREE.TorusGeometry(0.155, 0.016, 12, 24),
      mieleDarkRecessMat
    );
    rubberGasket.position.set(0, 0.425, 0.302);
    mieleGroup.add(rubberGasket);

    // Interactive Hinged Chrome & Curved Glass Porthole Door Assembly
    const mieleDoorGroup = new THREE.Group();
    mieleDoorGroup.position.set(0, 0.425, 0.316);

    // Shiny Polished Chrome Outer Porthole Door Ring
    const chromeDoorRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.188, 0.034, 16, 32),
      polishedChromeMat
    );
    chromeDoorRing.scale.set(1, 1, 0.48);
    chromeDoorRing.castShadow = true;
    mieleDoorGroup.add(chromeDoorRing);

    // Inner Chrome Bevel Ring framing the glass window
    const chromeInnerRim = new THREE.Mesh(
      new THREE.TorusGeometry(0.156, 0.012, 12, 28),
      polishedChromeMat
    );
    chromeInnerRim.scale.set(1, 1, 0.5);
    chromeInnerRim.position.set(0, 0, 0.008);
    mieleDoorGroup.add(chromeInnerRim);

    // Chrome door handle pull grip integrated at the 3 o'clock position of the chrome door ring
    const chromeDoorHandle = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.11, 0.022),
      polishedChromeMat
    );
    chromeDoorHandle.position.set(0.185, 0, 0.014);
    mieleDoorGroup.add(chromeDoorHandle);

    // Curved Tinted Glass Porthole Window Bowl & Front Glass Pane
    const glassWindowBowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.154, 0.128, 0.042, 24),
      mieleGlassWindowMat
    );
    glassWindowBowl.rotation.x = Math.PI / 2;
    glassWindowBowl.position.set(0, 0, -0.008);
    mieleDoorGroup.add(glassWindowBowl);

    const glassFrontDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.154, 0.154, 0.008, 24),
      mieleGlassWindowMat
    );
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
  shelfGroup.position.set(4.395, 1.64, -2.35);

  const oakBracketMat = new THREE.MeshStandardMaterial({
    color: 0x946b42,
    roughness: 0.52,
    metalness: 0.05,
  });

  // Solid wooden wall shelf plank (1.21m wide x 0.032m thick x 0.28m deep, right up against X = +5.00m outside wall)
  const shelfPlank = new THREE.Mesh(
    new THREE.BoxGeometry(1.21, 0.032, 0.28),
    oakBracketMat
  );
  shelfPlank.position.set(0, 0, 0);
  shelfPlank.castShadow = true;
  shelfPlank.receiveShadow = true;
  shelfGroup.add(shelfPlank);

  // 3 Wooden Corbel Brackets underneath the shelf (left, center, right)
  for (const bx of [-0.48, 0.0, 0.48]) {
    // Vertical wooden wall cleat against North wall (z = -0.125m)
    const wallCleat = new THREE.Mesh(
      new THREE.BoxGeometry(0.038, 0.24, 0.028),
      oakBracketMat
    );
    wallCleat.position.set(bx, -0.135, -0.125);
    wallCleat.castShadow = true;
    shelfGroup.add(wallCleat);

    // Horizontal wooden support arm under shelf
    const topArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.038, 0.028, 0.25),
      oakBracketMat
    );
    topArm.position.set(bx, -0.03, -0.01);
    topArm.castShadow = true;
    shelfGroup.add(topArm);

    // Angled wooden diagonal brace strut
    const braceStrut = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, 0.25, 0.028),
      oakBracketMat
    );
    braceStrut.rotation.x = -0.76;
    braceStrut.position.set(bx, -0.125, -0.02);
    braceStrut.castShadow = true;
    shelfGroup.add(braceStrut);
  }

  // Folded stacks of fresh utility room linen towels & glass laundry jars on top of the shelf
  const linenMatWhite = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.78 });
  const linenMatSage = new THREE.MeshStandardMaterial({ color: 0x8fa18e, roughness: 0.78 });
  for (const [tx, ty, mat] of [
    [-0.34, 0.036, linenMatSage],
    [-0.34, 0.078, linenMatWhite],
    [-0.34, 0.118, linenMatWhite],
  ] as const) {
    const towel = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.038, 0.2), mat);
    towel.position.set(tx, ty, 0);
    towel.castShadow = true;
    shelfGroup.add(towel);
  }

  const jarGlassMat = new THREE.MeshStandardMaterial({
    color: 0xeaf2f5,
    transparent: true,
    opacity: 0.55,
    roughness: 0.1,
  });
  for (const jx of [0.16, 0.36]) {
    const jar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.058, 0.058, 0.15, 14),
      jarGlassMat
    );
    jar.position.set(jx, 0.09, 0);
    shelfGroup.add(jar);

    const jarLid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 0.02, 14),
      oakBracketMat
    );
    jarLid.position.set(jx, 0.17, 0);
    shelfGroup.add(jarLid);
  }

  cutawayWallGroups.north.add(shelfGroup);

  // Traditional Interactive Pulley Maid Ceiling Clothes Airer inside the 3.00m x 1.65m Utility Room
  // Clicking the Pulley Maid lowers/raises the wooden drying laths and elongates the hoist cords!
  const pulleyMaidGroup = new THREE.Group();
  pulleyMaidGroup.position.set(3.84, 0, -1.28);

  const rackMovingGroup = new THREE.Group();
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
  for (const lz of [-0.2, -0.067, 0.067, 0.2]) {
    const lath = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.036, 0.016), pineLathMat);
    lath.position.set(0, rackY, lz);
    lath.castShadow = true;
    rackMovingGroup.add(lath);
  }

  const vertRopes: THREE.Mesh[] = [];
  const pulleyWheels: THREE.Mesh[] = [];

  // 2 Traditional Cast-Iron Rack Ends + Ceiling Pulleys + Vertical Hoist Ropes (at localX = -0.54m and +0.54m)
  for (const rx of [-0.54, 0.54]) {
    // Cast-iron horizontal lath carrier bar
    const rackEndBar = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.048, 0.46), castIronMat);
    rackEndBar.position.set(rx, rackY, 0);
    rackEndBar.castShadow = true;
    rackMovingGroup.add(rackEndBar);

    // Arched cast-iron suspension yoke above each rack end
    for (const sideZ of [-0.14, 0.14]) {
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.16, 6), castIronMat);
      strut.position.set(rx, rackY + 0.065, sideZ * 0.5);
      strut.rotation.x = sideZ < 0 ? -0.68 : 0.68;
      rackMovingGroup.add(strut);
    }

    const topEye = new THREE.Mesh(new THREE.TorusGeometry(0.016, 0.005, 6, 12), castIronMat);
    topEye.rotation.y = Math.PI / 2;
    topEye.position.set(rx, rackY + 0.125, 0);
    rackMovingGroup.add(topEye);

    // Ceiling-mounted cast-iron screw pulley wheel & bracket (at Y = 2.96m)
    const pulleyBracket = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.055, 0.036), castIronMat);
    pulleyBracket.position.set(rx, 2.965, 0);
    pulleyMaidGroup.add(pulleyBracket);

    const pulleyWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.024, 0.024, 0.014, 10),
      castIronMat
    );
    pulleyWheel.rotation.x = Math.PI / 2;
    pulleyWheel.position.set(rx, 2.945, 0);
    pulleyMaidGroup.add(pulleyWheel);
    pulleyWheels.push(pulleyWheel);

    // Vertical cotton hoist cord from ceiling pulley down to rack end eye
    const vertRope = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0045, 0.0045, 0.48, 6),
      cottonRopeMat
    );
    vertRope.position.set(rx, 2.705, 0);
    pulleyMaidGroup.add(vertRope);
    vertRopes.push(vertRope);
  }

  // Horizontal ceiling rope running from left pulley across right double-pulley to East utility wall (localX = -0.54m to +1.14m -> X = +4.98m)
  const ceilingRope = new THREE.Mesh(
    new THREE.CylinderGeometry(0.0045, 0.0045, 1.68, 6),
    cottonRopeMat
  );
  ceilingRope.rotation.z = Math.PI / 2;
  ceilingRope.position.set(0.3, 2.95, 0);
  pulleyMaidGroup.add(ceilingRope);

  // Wall guide pulley at top of East utility wall (X = +4.98m) + vertical haul rope down to cast-iron wall cleat hook
  const wallPulley = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.045, 0.03), castIronMat);
  wallPulley.position.set(1.14, 2.95, 0);
  pulleyMaidGroup.add(wallPulley);

  const wallHaulRope = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.005, 1.56, 6),
    cottonRopeMat
  );
  wallHaulRope.position.set(1.14, 2.17, 0);
  pulleyMaidGroup.add(wallHaulRope);

  const wallCleat = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.13, 0.024), castIronMat);
  wallCleat.position.set(1.15, 1.38, 0);
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

  // South Front Wall at Z = +2.13m (interior face at Z = +1.99m is warm plaster; exterior face at Z = +2.27m is Imperial Brick, thickness 0.28m):
  // All full-height South wall piers, headers, 3-pane window, and 4-leaf bifolds are added to
  // cutawayWallGroups.southWest so they all cut away cleanly together down to the 0.18m plinth!
  const southWallCenterZ = 1.99 + extWallThick / 2; // +2.13m

  const southLowCutaway = createExteriorBrickWallBox(
    2.48,
    0.18,
    extWallThick,
    -3.16,
    0.09,
    southWallCenterZ,
    ['-z', '+y', '-x']
  );
  scene.add(southLowCutaway);

  const southWestFullWall = createExteriorBrickWallBox(
    2.48,
    wallHeight - 0.18,
    extWallThick,
    -3.16,
    0.18 + (wallHeight - 0.18) / 2,
    southWallCenterZ,
    ['-z', '+y', '-x']
  );
  cutawayWallGroups.southWest.add(southWestFullWall);

  // Exterior Imperial Brick / interior plaster wall strip above the 3-Pane Window's thick Oak Mantel (Y = 2.74m to 3.00m)
  const southWindowHeader = createExteriorBrickWallBox(
    2.98,
    0.26,
    extWallThick,
    -0.43,
    2.87,
    southWallCenterZ,
    ['-z', '+y']
  );
  cutawayWallGroups.southWest.add(southWindowHeader);

  // Exterior Imperial Brick / interior plaster wall strip above the Bifold's thick Oak Mantel (Y = 2.74m to 3.00m)
  const bifoldHeader = createExteriorBrickWallBox(
    3.5,
    0.26,
    extWallThick,
    3.19,
    2.87,
    southWallCenterZ,
    ['-z', '+y']
  );
  cutawayWallGroups.southWest.add(bifoldHeader);

  const bifoldLeftPier = createExteriorBrickWallBox(
    0.38,
    wallHeight,
    extWallThick,
    1.25,
    wallHeight / 2,
    southWallCenterZ,
    ['-z', '+y']
  );
  cutawayWallGroups.southWest.add(bifoldLeftPier);

  const bifoldRightPier = createExteriorBrickWallBox(
    0.06,
    wallHeight,
    extWallThick,
    4.97,
    wallHeight / 2,
    southWallCenterZ,
    ['-z', '+y']
  );
  cutawayWallGroups.southWest.add(bifoldRightPier);

  // =========================================================================
  // ANTIQUE OAK 45°-MITRED SKIRTING BOARDS ALONG ALL EXPOSED INTERIOR WALLS (Issue #14 & #4/#5)
  // =========================================================================
  const skirtingMat = new THREE.MeshStandardMaterial({
    color: 0x8e643c,
    roughness: 0.56,
    metalness: 0.04,
  });

  const addMitredKitchenSkirting = (
    parent: THREE.Object3D,
    path: ReadonlyArray<readonly [number, number]>
  ): void => {
    const mesh = new THREE.Mesh(buildMitredWallSkirtingGeometry(path), skirtingMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
  };

  // 1. South Front Wall interior face (Z = +1.99m):
  //    - West low cutaway & left window pier (X = -4.40m to -1.92m, on `scene` so it stays on `southLowCutaway`)
  addMitredKitchenSkirting(scene, [
    [-1.92, 1.99],
    [-4.4, 1.99],
  ]);
  //    - Central plaster pier between 3-pane window and 4-leaf bifolds (X = +1.06m to +1.44m)
  addMitredKitchenSkirting(cutawayWallGroups.southWest, [
    [1.44, 1.99],
    [1.06, 1.99],
  ]);

  // 2. East Sitting Area & Utility South Wall interior corner (X = +3.15m..+5.00m at Z = -0.70m, mitred onto X = +5.00m, Z = -0.70m..-0.35m)
  addMitredKitchenSkirting(scene, [
    [3.15, -0.7],
    [5.0, -0.7],
    [5.0, -0.35],
  ]);
  //    - Between East full-height window (Z = +1.65m) and South-East corner (Z = +1.99m)
  addMitredKitchenSkirting(scene, [
    [5.0, 1.65],
    [5.0, 1.99],
  ]);

  // 3. Utility Room Partition Walls (TV Wall at X = +1.85m mitred around the external corner onto Utility South Wall at Z = -0.70m):
  addMitredKitchenSkirting(scene, [
    [1.85, -1.845],
    [1.85, -0.7],
    [2.21, -0.7],
  ]);
  //    - Inside Utility Room West & South walls (45° internal mitre at X = +2.00m, Z = -0.85m)
  addMitredKitchenSkirting(scene, [
    [2.21, -0.85],
    [2.0, -0.85],
    [2.0, -1.86],
  ]);
  //    - Inside Utility Room South Wall right of door architrave (X = +3.15m..+5.00m at Z = -0.85m)
  addMitredKitchenSkirting(scene, [
    [5.0, -0.85],
    [3.15, -0.85],
  ]);

  // Smooth Plaster Ceiling over the 9.40m x 4.49m Kitchen & Utility Wing (spanning X = -4.64m..+5.22m, Z = -2.74m..+2.23m)
  const ceilingMat = new THREE.MeshStandardMaterial({
    color: 0xf2eee6,
    roughness: 0.9,
    side: THREE.DoubleSide,
  });
  const fullCeiling = new THREE.Mesh(new THREE.BoxGeometry(9.86, 0.08, 4.97), ceilingMat);
  fullCeiling.position.set(0.29, 3.04, -0.255);
  ceilingMeshGroup.add(fullCeiling);

  // =========================================================================
  // WELSH SLATE PITCHED ROOF, TIMBER SOFFITS, PAINTED FASCIA BOARDS,
  // CAST-IRON HALF-ROUND GUTTERS & RAINWATER DOWNPIPES (inside ceilingMeshGroup)
  // Built from a unified (Z, Y) cross-section over the 9.40m x 4.49m wing!
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

  // Exact (Z, Y) elevation helpers as a function of horizontal distance d = |z - roofCenterZ|
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
    color: 0x8fa693, // Heritage pale sage-green painted gutters (Issue #11)
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

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    ceilingMeshGroup.add(mesh);
    return mesh;
  };

  // 1. Cross-Wall & East Gable End Imperial Brick Masonry Pentagons (starting at Y = 3.08m above the Kitchen ceiling slab)
  const gablePointsZY: ReadonlyArray<readonly [number, number]> = [
    [wallNorthZ, 3.08],
    [wallSouthZ, 3.08],
    [wallSouthZ, wallDeckY],
    [roofCenterZ, ridgeDeckY],
    [wallNorthZ, wallDeckY],
  ];

  addExtrudedZYProfile(gablePointsZY, wallWestX + 0.01, wallWestX + crossWallThick, imperialBrickMat, true);
  addExtrudedZYProfile(gablePointsZY, wallEastX - extWallThick, wallEastX, imperialBrickMat, true);

  // 2. Unified Pitched Verge Soffit & Plumb-Cut Bargeboard at East Gable
  const vergeChevronPointsZY: ReadonlyArray<readonly [number, number]> = [
    [fasciaNorthZ, soffitBotY],
    [roofCenterZ, ridgeBargeBotY],
    [fasciaSouthZ, soffitBotY],
    [fasciaSouthZ, fasciaTopY],
    [roofCenterZ, ridgeDeckY],
    [fasciaNorthZ, fasciaTopY],
  ];

  addExtrudedZYProfile(vergeChevronPointsZY, wallEastX, vergeEastX - 0.026, soffitFasciaMat);

  const outerBargePointsZY: ReadonlyArray<readonly [number, number]> = [
    [fasciaNorthZ, soffitBotY - 0.006],
    [roofCenterZ, ridgeBargeBotY - 0.006],
    [fasciaSouthZ, soffitBotY - 0.006],
    [fasciaSouthZ, fasciaTopY + 0.004],
    [roofCenterZ, ridgeDeckY + 0.004],
    [fasciaNorthZ, fasciaTopY + 0.004],
  ];

  addExtrudedZYProfile(outerBargePointsZY, vergeEastX - 0.026, vergeEastX, soffitFasciaMat);

  // 3. Horizontal Eaves Soffit Boards & Vertical Painted Timber Fascia Boards (South & North Eaves)
  const southEavesBoxPointsZY: ReadonlyArray<readonly [number, number]> = [
    [wallSouthZ, soffitBotY],
    [fasciaSouthZ, soffitBotY],
    [fasciaSouthZ, fasciaTopY],
    [wallSouthZ, wallDeckY],
  ];
  addExtrudedZYProfile(southEavesBoxPointsZY, wallWestX, wallEastX, soffitFasciaMat);

  const northEavesBoxPointsZY: ReadonlyArray<readonly [number, number]> = [
    [fasciaNorthZ, soffitBotY],
    [wallNorthZ, soffitBotY],
    [wallNorthZ, wallDeckY],
    [fasciaNorthZ, fasciaTopY],
  ];
  addExtrudedZYProfile(northEavesBoxPointsZY, wallWestX, wallEastX, soffitFasciaMat);

  const roofMidX = (vergeWestX + vergeEastX) * 0.5;
  for (const [fasciaZ, normalSign] of [
    [fasciaSouthZ, 1],
    [fasciaNorthZ, -1],
  ] as const) {
    const fasciaFace = new THREE.Mesh(
      new THREE.BoxGeometry(roofSpanX, fasciaTopY - soffitBotY + 0.006, 0.022),
      soffitFasciaMat
    );
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

  const southSlateSlope = new THREE.Mesh(
    new THREE.BoxGeometry(roofSpanX + 0.04, slateThick, rafterLength),
    welshSlateMat
  );
  southSlateSlope.position.set(roofMidX, slopeMidY, roofCenterZ + slopeMidOffsetZ);
  southSlateSlope.rotation.x = pitchAngle;
  southSlateSlope.castShadow = true;
  southSlateSlope.receiveShadow = true;
  ceilingMeshGroup.add(southSlateSlope);

  const northSlateSlope = new THREE.Mesh(
    new THREE.BoxGeometry(roofSpanX + 0.04, slateThick, rafterLength),
    welshSlateMat
  );
  northSlateSlope.position.set(roofMidX, slopeMidY, roofCenterZ - slopeMidOffsetZ);
  northSlateSlope.rotation.x = -pitchAngle;
  northSlateSlope.castShadow = true;
  northSlateSlope.receiveShadow = true;
  ceilingMeshGroup.add(northSlateSlope);

  const ridgeCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.058, 0.058, roofSpanX + 0.05, 16, 1, false, 0, Math.PI),
    ridgeLeadMat
  );
  ridgeCap.rotation.z = Math.PI / 2;
  ridgeCap.position.set(roofMidX, ridgeDeckY + 0.008, roofCenterZ);
  ridgeCap.castShadow = true;
  ceilingMeshGroup.add(ridgeCap);

  for (let rx = -4.4; rx <= 5.3; rx += 0.45) {
    const ridgeCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.064, 0.064, 0.02, 14, 1, false, 0, Math.PI),
      ridgeLeadMat
    );
    ridgeCollar.rotation.z = Math.PI / 2;
    ridgeCollar.position.set(rx, ridgeDeckY + 0.01, roofCenterZ);
    ceilingMeshGroup.add(ridgeCollar);
  }

  // 5. Cast-Iron Half-Round Rainwater Gutters + Fascia Support Brackets
  const gutterLength = roofSpanX + 0.02;
  const gutterRadius = 0.052;
  const gutterY = 3.125;
  const gutterSouthZ = fasciaSouthZ + 0.018 + gutterRadius;
  const gutterNorthZ = fasciaNorthZ - 0.018 - gutterRadius;

  for (const [gutterZ, normalSign] of [
    [gutterSouthZ, 1],
    [gutterNorthZ, -1],
  ] as const) {
    const gutterTrough = new THREE.Mesh(
      new THREE.CylinderGeometry(
        gutterRadius,
        gutterRadius,
        gutterLength,
        18,
        1,
        true,
        Math.PI,
        Math.PI
      ),
      gutterCastIronMat
    );
    gutterTrough.rotation.z = Math.PI / 2;
    gutterTrough.position.set(roofMidX, gutterY, gutterZ);
    gutterTrough.castShadow = true;
    ceilingMeshGroup.add(gutterTrough);

    for (const lipSide of [-1, 1]) {
      const lip = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0055, 0.0055, gutterLength, 8),
        gutterCastIronMat
      );
      lip.rotation.z = Math.PI / 2;
      lip.position.set(roofMidX, gutterY, gutterZ + lipSide * gutterRadius);
      ceilingMeshGroup.add(lip);
    }

    for (const endX of [roofMidX - gutterLength * 0.5, roofMidX + gutterLength * 0.5]) {
      const stopEnd = new THREE.Mesh(
        new THREE.CircleGeometry(gutterRadius, 16, Math.PI, Math.PI),
        gutterCastIronMat
      );
      stopEnd.rotation.y = Math.PI / 2;
      stopEnd.position.set(endX, gutterY, gutterZ);
      ceilingMeshGroup.add(stopEnd);
    }

    for (let bx = -4.5; bx <= 5.35; bx += 0.9) {
      const bracketStrap = new THREE.Mesh(
        new THREE.TorusGeometry(gutterRadius + 0.004, 0.0045, 8, 16, Math.PI),
        gutterCastIronMat
      );
      bracketStrap.rotation.y = Math.PI / 2;
      bracketStrap.rotation.x = Math.PI;
      bracketStrap.position.set(bx, gutterY, gutterZ);
      ceilingMeshGroup.add(bracketStrap);

      const fasciaClip = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.065, 0.018),
        gutterCastIronMat
      );
      fasciaClip.position.set(bx, gutterY - 0.02, gutterZ - normalSign * (gutterRadius + 0.006));
      ceilingMeshGroup.add(fasciaClip);
    }
  }

  // 6. Continuous Cast-Iron Rainwater Downpipes
  const addCastIronDownpipe = (
    pipeX: number,
    gutterZ: number,
    wallOuterZ: number,
    outwardSign: 1 | -1
  ): void => {
    const dpGroup = new THREE.Group();
    const pipeR = 0.032;
    const wallPipeZ = wallOuterZ + outwardSign * 0.042;

    const outletNozzle = new THREE.Mesh(
      new THREE.CylinderGeometry(pipeR + 0.012, pipeR + 0.006, 0.075, 16),
      gutterCastIronMat
    );
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
      new THREE.TubeGeometry(swanCurve, 20, pipeR, 16, false),
      gutterCastIronMat
    );
    swanTube.castShadow = true;
    dpGroup.add(swanTube);

    const vertPipe = new THREE.Mesh(
      new THREE.CylinderGeometry(pipeR, pipeR, 2.63, 16),
      gutterCastIronMat
    );
    vertPipe.position.set(pipeX, 1.445, wallPipeZ);
    vertPipe.castShadow = true;
    vertPipe.receiveShadow = true;
    dpGroup.add(vertPipe);

    for (const clipY of [2.72, 2.0, 1.28, 0.56]) {
      const socketRing = new THREE.Mesh(
        new THREE.CylinderGeometry(pipeR + 0.008, pipeR + 0.006, 0.052, 16),
        gutterCastIronMat
      );
      socketRing.position.set(pipeX, clipY, wallPipeZ);
      socketRing.castShadow = true;
      dpGroup.add(socketRing);

      const earPlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.036, 0.022),
        gutterCastIronMat
      );
      earPlate.position.set(pipeX, clipY, wallOuterZ + outwardSign * 0.011);
      dpGroup.add(earPlate);
    }

    const shoeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(pipeX, 0.15, wallPipeZ),
      new THREE.Vector3(pipeX, 0.095, wallPipeZ + outwardSign * 0.01),
      new THREE.Vector3(pipeX, 0.052, wallPipeZ + outwardSign * 0.048),
    ]);
    const shoeTube = new THREE.Mesh(
      new THREE.TubeGeometry(shoeCurve, 10, pipeR + 0.002, 16, false),
      gutterCastIronMat
    );
    shoeTube.castShadow = true;
    dpGroup.add(shoeTube);

    const gulleyRim = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.022, 0.2),
      gutterCastIronMat
    );
    gulleyRim.position.set(pipeX, 0.011, wallPipeZ + outwardSign * 0.075);
    dpGroup.add(gulleyRim);

    const gulleyGrate = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.024, 0.15),
      gutterInnerDarkMat
    );
    gulleyGrate.position.set(pipeX, 0.012, wallPipeZ + outwardSign * 0.075);
    dpGroup.add(gulleyGrate);

    ceilingMeshGroup.add(dpGroup);
  };

  addCastIronDownpipe(5.14, gutterSouthZ, wallSouthZ, 1);
  addCastIronDownpipe(-4.52, gutterNorthZ, wallNorthZ, -1);

  ceilingMeshGroup.visible = !ceilingCutaway;

  return tvScreenMat;
}
