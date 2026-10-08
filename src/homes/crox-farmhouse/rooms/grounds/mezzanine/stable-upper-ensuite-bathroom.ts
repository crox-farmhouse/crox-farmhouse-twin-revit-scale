import * as THREE from 'three';
import { buildMitredArchitraveSegments } from '../../../../../engine/geometry/index.ts';
import type { SceneBuilderContext } from '../../../../../engine/viewer/scene-types.ts';

// ============================================================================
// ISSUE #8: SMALL ENSUITE BATHROOM IN THE SW CORNER OF THE 1ST-FLOOR STABLE
// Hit Point: `[2.44, 2.08, 18.808]` -> Outbuilding `(u = 24.578m, y = 2.08m, v = 4.930m)`
// Includes:
// - Stud partition walls (`u = 23.22..25.32m, v = 3.68..5.428m`) rising to `stableUpperTopY = 3.32m`
//   with a hinged 4-panel light-oak door & brass lever handles at `u = 24.36..25.10m, v = 3.68m`
// - Honed Carrara marble tiled floor slab + brass door threshold strip
// - Corner Walk-In Glass Shower (`u = 23.23..24.13m, v = 4.52..5.42m`) with stone-resin tray,
//   frameless toughened glass screens, and brushed-brass rainfall & handheld thermostatic shower
// - Back-to-Wall Vitreous China Toilet (`u = 24.72m, v = 5.05m`) with concealed cistern boxing & brass flush plate
// - Fluted Light-Oak & Carrara Marble Vanity Sink Unit (`u = 23.48m, v = 4.08m`) with ceramic basin,
//   brushed-brass monobloc mixer tap, backlit brass pill mirror, and heated brass towel ladder
// ============================================================================
let cachedCarraraMarbleTileTexture: THREE.CanvasTexture | null = null;

export function createCarraraMarbleTileTexture(): THREE.CanvasTexture {
  if (cachedCarraraMarbleTileTexture) {
    return cachedCarraraMarbleTileTexture;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#edeae4';
    ctx.fillRect(0, 0, 512, 512);
    // Soft grey-taupe Calacatta/Carrara veins
    ctx.strokeStyle = 'rgba(145, 140, 132, 0.26)';
    for (let i = 0; i < 28; i++) {
      ctx.lineWidth = 1 + (i % 3) * 1.2;
      const x0 = (i * 47) % 512;
      const y0 = (i * 83) % 512;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.bezierCurveTo(x0 + 60, y0 + 25, x0 + 110, y0 - 20, x0 + 170, y0 + 35);
      ctx.stroke();
    }
    // Subtle 128px porcelain tile grout grid
    ctx.strokeStyle = 'rgba(180, 174, 165, 0.55)';
    ctx.lineWidth = 2;
    for (let g = 0; g <= 512; g += 128) {
      ctx.beginPath();
      ctx.moveTo(g, 0);
      ctx.lineTo(g, 512);
      ctx.moveTo(0, g);
      ctx.lineTo(512, g);
      ctx.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface StableUpperEnsuiteSharedKit {
  readonly uWest: number;
  readonly uEast: number;
  readonly vNorth: number;
  readonly wallT: number;
  readonly eaveWallH: number;
  readonly vMidRoom: number;
  readonly ridgeCeilH: number;
  readonly doorU0: number;
  readonly doorU1: number;
  readonly vNorthFace: number;
  readonly marbleTileMat: THREE.MeshStandardMaterial;
  readonly ceramicWhiteMat: THREE.MeshStandardMaterial;
  readonly brushedBrassMat: THREE.MeshStandardMaterial;
  readonly warmLedGlowMat: THREE.MeshStandardMaterial;
}

export function createRakedVYExtrusion(
  ptsVH: ReadonlyArray<readonly [number, number]>,
  uSpan: number
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  for (let i = 0; i < ptsVH.length; i++) {
    const [pv, ph] = ptsVH[i]!;
    if (i === 0) shape.moveTo(-pv, ph);
    else shape.lineTo(-pv, ph);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: uSpan, bevelEnabled: false });
  geo.rotateY(Math.PI / 2);
  geo.computeBoundingSphere();
  return geo;
}

export function buildStableUpperEnsuiteBathroom(
  firstFloorGroup: THREE.Group,
  stableUpperFloorY: number,
  stableUpperTopY: number,
  lightJoineryOakMat: THREE.Material,
  warmRoomPlasterMat: THREE.Material,
  windowGlassMat: THREE.Material,
  _roofGroup?: THREE.Group,
  ctx?: SceneBuilderContext
): StableUpperEnsuiteSharedKit {
  const ensuiteGroup = new THREE.Group();
  ensuiteGroup.name = 'outbuildings.firstFloor.stableEnsuite';
  ensuiteGroup.userData.zone = 'courtyard';
  firstFloorGroup.add(ensuiteGroup);

  // Issue #3 ("Fix the topology of the walls etc here so they make sense" at `[2.529, 2.092, 17.529]`) &
  // Issue #1 ("This door / wall should be correct height in cutaway mode" at `[3.503, 2.707, 17.402]`, `outbuildings.firstFloor.stableEnsuite.northWallEast`):
  // - Positioned the Ensuite North Partition Wall at `vNorth = 3.67m` (`v = 3.62..3.72m`), cleanly South of the
  //   `v = 2.554..3.554m` entrance stairway opening and its South oak architrave (`v = 3.554..3.602m`) with zero collision!
  // - Widened the Ensuite to `uEast = 26.04m` (`u = 23.22..26.04m`, East wall at `u = 25.99..26.09m`) with the doorway
  //   at `doorU0 = 24.62m .. doorU1 = 25.38m` (`0.76m` wide) so the `0.44m`-deep Vanity (`u = 25.54..25.98m`) sits
  //   `16cm` East of the doorway opening instead of overlapping the doorway!
  // - All Ensuite partition walls (`northWallWest`, `northWallEast`, `northDoorLintel`, `eastWall`), the full-height `1.96m`
  //   4-panel solid oak Ensuite door & architraves, and the walk-in shower enclosure are built at their FULL vaulted ceiling
  //   height directly in `ensuiteGroup` (`firstFloorGroup`) so they are the exact, proper architectural height in Cutaway Mode!
  const uWest = 23.22;
  const uEast = 26.04; // 2.82m wide along u (leaves 2.68m of South bedroom wall East of u = 26.09m up to u = 28.77m!)
  const vNorth = 3.42; // North wall spans v = 3.37..3.47m, cleanly South of the centered v = 2.405..3.305m entrance doorway & v = 3.353m architrave!
  const vSouth = 5.428; // 1.958m internal depth along v (+25cm deeper now that the entrance door is centered on the ridge!)
  const wallT = 0.10;
  const eaveWallH = stableUpperTopY - stableUpperFloorY; // 1.24m at vSouth = 5.43m (y = 2.08..3.32m)
  const vMidRoom = 2.855;
  const ridgeCeilH = 2.589; // 4.669m - 2.08m vaulted ridge height at vMidRoom = 2.855m

  // Exact South roof slope ceiling height above `stableUpperFloorY = 2.08m` for any `v >= 2.855m`:
  // - At `v = 3.37m` (North face of `northWall`): `2.319m` (`world Y = 4.399m`)
  // - At `v = 3.42m` (centerline of `northWall`): `2.293m` (`world Y = 4.373m`)
  // - At `v = 3.47m` (South face of `northWall`): `2.267m` (`world Y = 4.347m`)
  // - At `v = 5.428m` (South eave wall): `1.241m` (`world Y = 3.321m`)
  const ceilHAtV = (v: number): number => {
    const t = Math.max(0, Math.min(1, (v - vMidRoom) / (5.43 - vMidRoom)));
    return ridgeCeilH - t * (ridgeCeilH - eaveWallH);
  };

  const marbleTileMat = new THREE.MeshStandardMaterial({
    map: createCarraraMarbleTileTexture(),
    roughness: 0.26,
    metalness: 0.04,
  });
  const ceramicWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xfaf8f5,
    roughness: 0.14,
    metalness: 0.04,
  });
  const matteStoneResinMat = new THREE.MeshStandardMaterial({
    color: 0xf7f5f0,
    roughness: 0.24,
    metalness: 0.03,
  });
  const brushedBrassMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.24,
    metalness: 0.86,
  });
  const warmLedGlowMat = new THREE.MeshStandardMaterial({
    color: 0xfff5e0,
    emissive: new THREE.Color(0xffcb78),
    emissiveIntensity: 1.85,
    roughness: 0.2,
  });

  // 1. Honed Carrara Marble Tiled Ensuite Floor (`y = stableUpperFloorY + 0.007m`, spanning `y = 2.081..2.093m`) across `u = 23.22..25.99m, v = 3.47..5.428m`
  //    plus doorway threshold tile infill (`u = 24.644..25.356m, v = 3.372..3.469m` — Issue #4: zero coplanar z-fighting with jambs or `thresholdStrip`!)
  const floorW = uEast - wallT * 0.5 - uWest; // 2.77m
  const floorD = vSouth - (vNorth + wallT * 0.5); // 1.958m (+25cm deeper!)
  const tiledFloor = new THREE.Mesh(
    new THREE.BoxGeometry(floorW, 0.012, floorD),
    marbleTileMat
  );
  tiledFloor.name = 'outbuildings.firstFloor.stableEnsuite.tiledFloor';
  tiledFloor.position.set(
    uWest + floorW * 0.5,
    stableUpperFloorY + 0.007,
    vNorth + wallT * 0.5 + floorD * 0.5
  );
  tiledFloor.receiveShadow = true;
  ensuiteGroup.add(tiledFloor);

  const doorU0 = 24.62;
  const doorU1 = 25.38; // 0.76m doorway opening with 0.61m East pier for the 0.44m-deep vanity!
  const doorW = doorU1 - doorU0;
  const clearThresholdW = doorW - 0.048; // 0.712m clear between the 24mm oak door jambs
  const doorClearH = 1.98; // Full 1.98m (6'6") standard UK doorway clear height under the 2.27m–2.32m ceiling!

  const doorThresholdTile = new THREE.Mesh(
    new THREE.BoxGeometry(clearThresholdW, 0.012, wallT - 0.004),
    marbleTileMat
  );
  doorThresholdTile.name = 'outbuildings.firstFloor.stableEnsuite.doorThresholdTile';
  doorThresholdTile.position.set(
    (doorU0 + doorU1) * 0.5,
    stableUpperFloorY + 0.007,
    vNorth - 0.001
  );
  doorThresholdTile.receiveShadow = true;
  ensuiteGroup.add(doorThresholdTile);

  // 2. Full-Height Vaulted Partition Walls in `ensuiteGroup` (`firstFloorGroup` — Issue #1!):
  //    - `northWallWest` (`u = 23.22..24.62m, v = 3.37..3.47m, y = 2.08..4.399m`)
  //    - `northWallEast` (`u = 25.38..26.09m, v = 3.37..3.47m, y = 2.08..4.399m`)
  //    - `northDoorLintel` (`u = 24.62..25.38m, v = 3.37..3.47m, y = 4.06..4.399m`)
  //    - `eastWall` (`u = 25.99..26.09m, v = 3.47..5.428m`, raked from `2.267m` at `v = 3.47m` down to `1.24m` at `v = 5.428m`)
  const vNorthFace = vNorth - wallT * 0.5; // 3.37m
  const vSouthFace = vNorth + wallT * 0.5; // 3.47m
  const hNorthFace = ceilHAtV(vNorthFace); // 2.319m
  const hSouthFace = ceilHAtV(vSouthFace); // 2.267m

  const northWallWestGeo = createRakedVYExtrusion(
    [
      [vNorthFace, 0],
      [vSouthFace, 0],
      [vSouthFace, hSouthFace],
      [vNorthFace, hNorthFace],
    ],
    doorU0 - uWest
  );
  const northWallWest = new THREE.Mesh(northWallWestGeo, warmRoomPlasterMat);
  northWallWest.name = 'outbuildings.firstFloor.stableEnsuite.northWallWest';
  northWallWest.userData.isArchitecturalShell = true;
  northWallWest.position.set(uWest, stableUpperFloorY, 0);
  northWallWest.castShadow = true;
  northWallWest.receiveShadow = true;
  ensuiteGroup.add(northWallWest);

  const northWallEastGeo = createRakedVYExtrusion(
    [
      [vNorthFace, 0],
      [vSouthFace, 0],
      [vSouthFace, hSouthFace],
      [vNorthFace, hNorthFace],
    ],
    uEast + wallT * 0.5 - doorU1
  );
  const northWallEast = new THREE.Mesh(northWallEastGeo, warmRoomPlasterMat);
  northWallEast.name = 'outbuildings.firstFloor.stableEnsuite.northWallEast';
  northWallEast.userData.isArchitecturalShell = true;
  northWallEast.position.set(doorU1, stableUpperFloorY, 0);
  northWallEast.castShadow = true;
  northWallEast.receiveShadow = true;
  ensuiteGroup.add(northWallEast);

  const northDoorLintelGeo = createRakedVYExtrusion(
    [
      [vNorthFace, doorClearH],
      [vSouthFace, doorClearH],
      [vSouthFace, hSouthFace],
      [vNorthFace, hNorthFace],
    ],
    doorW
  );
  const northDoorLintel = new THREE.Mesh(northDoorLintelGeo, warmRoomPlasterMat);
  northDoorLintel.name = 'outbuildings.firstFloor.stableEnsuite.northDoorLintel';
  northDoorLintel.userData.isArchitecturalShell = true;
  northDoorLintel.position.set(doorU0, stableUpperFloorY, 0);
  northDoorLintel.castShadow = true;
  northDoorLintel.receiveShadow = true;
  ensuiteGroup.add(northDoorLintel);

  // Full-height raked East partition wall (`u = 25.99..26.09m, v = 3.47..5.428m`, zero overlap with `northWallEast`!)
  const eastWallGeo = createRakedVYExtrusion(
    [
      [vSouthFace, 0],
      [vSouth, 0],
      [vSouth, eaveWallH],
      [vSouthFace, hSouthFace],
    ],
    wallT
  );
  const eastWall = new THREE.Mesh(eastWallGeo, warmRoomPlasterMat);
  eastWall.name = 'outbuildings.firstFloor.stableEnsuite.eastWall';
  eastWall.userData.isArchitecturalShell = true;
  eastWall.position.set(uEast - wallT * 0.5, stableUpperFloorY, 0);
  eastWall.castShadow = true;
  eastWall.receiveShadow = true;
  ensuiteGroup.add(eastWall);

  // Full-Height (`1.98m`) Light-Oak Doorway Jambs, Architraves, Brass Threshold & 4-Panel Oak Door Leaf in `ensuiteGroup` (`firstFloorGroup` — Issue #1!)
  // Issue #4 ("dithering here" at `[2.589, 2.092, 17.237]`):
  // Seat `thresholdStrip` (`y = 2.093..2.098m`) cleanly ON TOP of `doorThresholdTile` (`top = 2.093m`) instead of coplanar at `y = 2.092m`!
  const thresholdStrip = new THREE.Mesh(
    new THREE.BoxGeometry(clearThresholdW, 0.005, 0.036),
    brushedBrassMat
  );
  thresholdStrip.name = 'outbuildings.firstFloor.stableEnsuite.doorThresholdStrip';
  thresholdStrip.position.set(
    (doorU0 + doorU1) * 0.5,
    stableUpperFloorY + 0.0155,
    vNorth - 0.022
  );
  ensuiteGroup.add(thresholdStrip);

  for (const jSide of [-1, 1] as const) {
    const ju = (doorU0 + doorU1) * 0.5 + jSide * (doorW * 0.5 - 0.012);
    const jamb = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, doorClearH - 0.013, wallT + 0.024),
      lightJoineryOakMat
    );
    jamb.name = 'outbuildings.firstFloor.stableEnsuite.doorFrame.jamb';
    jamb.position.set(ju, stableUpperFloorY + 0.013 + (doorClearH - 0.013) * 0.5, vNorth);
    jamb.castShadow = true;
    ensuiteGroup.add(jamb);
  }
  const doorHeadJamb = new THREE.Mesh(
    new THREE.BoxGeometry(doorW, 0.024, wallT + 0.024),
    lightJoineryOakMat
  );
  doorHeadJamb.name = 'outbuildings.firstFloor.stableEnsuite.doorFrame.headJamb';
  doorHeadJamb.position.set((doorU0 + doorU1) * 0.5, stableUpperFloorY + doorClearH - 0.012, vNorth);
  ensuiteGroup.add(doorHeadJamb);

  // 45°-Mitred Ogee/Torus Profiled & Colour-Drenched Architraves on both Bedroom (`-z`) and Ensuite (`+z`) faces
  for (const faceZ of [-1, 1] as const) {
    const [leftLegGeo, headGeo, rightLegGeo] = buildMitredArchitraveSegments(
      doorU0 + 0.012,
      doorU1 - 0.012,
      stableUpperFloorY,
      stableUpperFloorY,
      stableUpperFloorY + doorClearH - 0.012,
      'x',
      vNorth + faceZ * (wallT * 0.5),
      faceZ,
      0.064,
      0.020
    );
    for (const legGeo of [leftLegGeo, rightLegGeo] as const) {
      const archLeg = new THREE.Mesh(legGeo, warmRoomPlasterMat);
      archLeg.name = 'outbuildings.firstFloor.stableEnsuite.doorFrame.architraveLeg';
      archLeg.castShadow = true;
      archLeg.receiveShadow = true;
      ensuiteGroup.add(archLeg);
    }
    const archHead = new THREE.Mesh(headGeo, warmRoomPlasterMat);
    archHead.name = 'outbuildings.firstFloor.stableEnsuite.doorFrame.architraveHead';
    archHead.castShadow = true;
    archHead.receiveShadow = true;
    ensuiteGroup.add(archHead);
  }

  // Interactive hinged 4-panel solid oak Ensuite door (`outbuildings.firstFloor.stableEnsuite.door`)
  // hinged at `doorU0 = 24.62m` (West jamb) and registered with `ctx.interactions.registerHingedDoor`!
  const doorFrameAssy = new THREE.Group();
  doorFrameAssy.name = 'outbuildings.firstFloor.stableEnsuite.doorAssy';
  ensuiteGroup.add(doorFrameAssy);

  const doorPivot = new THREE.Group();
  doorPivot.name = 'outbuildings.firstFloor.stableEnsuite.door';
  doorPivot.position.set(doorU0 + 0.024, stableUpperFloorY + 0.012, vNorth + 0.02);
  doorFrameAssy.add(doorPivot);

  const leafW = doorW - 0.048; // 0.712m
  const leafH = doorClearH - 0.026; // 1.954m full-height door leaf!
  const doorLeaf = new THREE.Mesh(
    new THREE.BoxGeometry(leafW, leafH, 0.042),
    lightJoineryOakMat
  );
  doorLeaf.name = 'outbuildings.firstFloor.stableEnsuite.doorLeaf';
  doorLeaf.position.set(leafW * 0.5, leafH * 0.5, 0);
  doorLeaf.castShadow = true;
  doorLeaf.receiveShadow = true;
  doorPivot.add(doorLeaf);

  // Recessed Shaker/fielded panels on both faces of the Ensuite oak door
  for (const [py, ph] of [
    [0.44, 0.62],
    [1.37, 0.86],
  ] as const) {
    const panelBead = new THREE.Mesh(
      new THREE.BoxGeometry(leafW - 0.18, ph, 0.048),
      lightJoineryOakMat
    );
    panelBead.name = 'outbuildings.firstFloor.stableEnsuite.doorPanelBead';
    panelBead.position.set(leafW * 0.5, py, 0);
    doorPivot.add(panelBead);
  }

  for (const hSideZ of [-0.032, 0.032] as const) {
    const lever = new THREE.Mesh(
      new THREE.BoxGeometry(0.115, 0.016, 0.022),
      brushedBrassMat
    );
    lever.name = 'outbuildings.firstFloor.stableEnsuite.doorHandle';
    lever.position.set(leafW - 0.085, 0.98, hSideZ);
    doorPivot.add(lever);
  }

  if (ctx) {
    ctx.interactions.registerHingedDoor(
      doorFrameAssy,
      doorPivot,
      new THREE.Vector3(0, 0, 0),
      'y',
      -Math.PI * 0.48
    );
  }

  // 3. Spacious Walk-In Rainfall Shower (`outbuildings.firstFloor.stableEnsuite.shower`)
  //    in the Tall NW Corner (`u = 23.23..24.48m, v = 3.475..4.395m` — `1.25m W × 0.92m D`)
  //    under the `2.26m` vaulted ceiling!
  const showerGroup = new THREE.Group();
  showerGroup.name = 'outbuildings.firstFloor.stableEnsuite.shower';
  ensuiteGroup.add(showerGroup);

  const shU0 = uWest + 0.01; // 23.23m
  const shU1 = 24.48; // 1.25m wide walk-in shower (leaves 1.06m wide central walkway to vanity at u = 25.54m!)
  const shW = shU1 - shU0; // 1.25m
  const shV0 = vNorth + wallT * 0.5 + 0.005; // 3.475m
  const shV1 = 4.395; // 0.92m deep walk-in shower (+12cm deeper than before!)
  const shD = shV1 - shV0; // 0.92m
  const shCenterU = (shU0 + shU1) * 0.5; // 23.855m
  const shCenterV = (shV0 + shV1) * 0.5; // 3.935m
  const shNorthWallH = ceilHAtV(shV0) - 0.01; // 2.254m at v = 3.475m
  const shSouthWallH = ceilHAtV(shV1) - 0.01; // 1.772m at v = 4.395m
  const shGlassH = shSouthWallH; // 1.772m full-height frameless glass enclosure

  // White stone-resin low-profile walk-in shower tray + linear brushed-brass drain grate
  const showerTray = new THREE.Mesh(
    new THREE.BoxGeometry(shW, 0.042, shD),
    matteStoneResinMat
  );
  showerTray.name = 'outbuildings.firstFloor.stableEnsuite.showerTray';
  showerTray.position.set(shCenterU, stableUpperFloorY + 0.025, shCenterV);
  showerTray.receiveShadow = true;
  showerGroup.add(showerTray);

  const linearDrain = new THREE.Mesh(
    new THREE.BoxGeometry(0.68, 0.004, 0.062),
    brushedBrassMat
  );
  linearDrain.name = 'outbuildings.firstFloor.stableEnsuite.shower.linearDrain';
  linearDrain.position.set(shU0 + 0.50, stableUpperFloorY + 0.048, shV0 + 0.16);
  showerGroup.add(linearDrain);

  // Full-height North & Raked West Carrara marble tile wall linings inside the shower
  const northTilePanel = new THREE.Mesh(
    new THREE.BoxGeometry(shW, shNorthWallH, 0.016),
    marbleTileMat
  );
  northTilePanel.name = 'outbuildings.firstFloor.stableEnsuite.shower.northTilePanel';
  northTilePanel.position.set(shCenterU, stableUpperFloorY + shNorthWallH * 0.5, shV0 + 0.008);
  showerGroup.add(northTilePanel);

  const westTileGeo = createRakedVYExtrusion(
    [
      [shV0, 0],
      [shV1, 0],
      [shV1, shSouthWallH],
      [shV0, shNorthWallH],
    ],
    0.016
  );
  const westTilePanel = new THREE.Mesh(westTileGeo, marbleTileMat);
  westTilePanel.name = 'outbuildings.firstFloor.stableEnsuite.shower.westTilePanel';
  westTilePanel.position.set(shU0, stableUpperFloorY, 0);
  showerGroup.add(westTilePanel);

  // Recessed Brushed-Brass & Illuminated Marble Shampoo Niche on the North shower wall (`u = 24.14m, y = 2.08 + 1.12m`)
  const nicheFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.24, 0.026),
    brushedBrassMat
  );
  nicheFrame.name = 'outbuildings.firstFloor.stableEnsuite.shower.nicheFrame';
  nicheFrame.position.set(24.14, stableUpperFloorY + 1.12, shV0 + 0.016);
  showerGroup.add(nicheFrame);

  const nicheLedStrip = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.008, 0.018),
    warmLedGlowMat
  );
  nicheLedStrip.name = 'outbuildings.firstFloor.stableEnsuite.shower.nicheLedStrip';
  nicheLedStrip.position.set(24.14, stableUpperFloorY + 1.225, shV0 + 0.022);
  showerGroup.add(nicheLedStrip);

  // Full-Height Frameless Toughened Glass East Screen (`u = 24.48m`) & South Screen + Hinged Door (`v = 4.395m`)
  const eastGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, shGlassH - 0.04, shD - 0.02),
    windowGlassMat
  );
  eastGlass.name = 'outbuildings.firstFloor.stableEnsuite.showerGlass';
  eastGlass.position.set(shU1, stableUpperFloorY + 0.04 + (shGlassH - 0.04) * 0.5, shCenterV);
  showerGroup.add(eastGlass);

  const southFixedW = 0.62;
  const southDoorW = shW - southFixedW - 0.02; // 0.61m
  const southGlassPanel = new THREE.Mesh(
    new THREE.BoxGeometry(southFixedW, shGlassH - 0.04, 0.014),
    windowGlassMat
  );
  southGlassPanel.name = 'outbuildings.firstFloor.stableEnsuite.showerGlass';
  southGlassPanel.position.set(
    shU0 + southFixedW * 0.5,
    stableUpperFloorY + 0.04 + (shGlassH - 0.04) * 0.5,
    shV1
  );
  showerGroup.add(southGlassPanel);

  const showerDoorMesh = new THREE.Mesh(
    new THREE.BoxGeometry(southDoorW, shGlassH - 0.04, 0.014),
    windowGlassMat
  );
  showerDoorMesh.name = 'outbuildings.firstFloor.stableEnsuite.showerDoor';
  showerDoorMesh.position.set(
    shU0 + southFixedW + 0.01 + southDoorW * 0.5,
    stableUpperFloorY + 0.04 + (shGlassH - 0.04) * 0.5,
    shV1
  );
  showerGroup.add(showerDoorMesh);

  // Brushed-brass vertical channels, corner post & top header stabilizer bar (`height = shGlassH`)
  const northBrassChannel = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, shGlassH - 0.02, 0.024),
    brushedBrassMat
  );
  northBrassChannel.name = 'outbuildings.firstFloor.stableEnsuite.shower.northBrassChannel';
  northBrassChannel.position.set(shU1, stableUpperFloorY + 0.02 + (shGlassH - 0.02) * 0.5, shV0 + 0.012);
  showerGroup.add(northBrassChannel);

  const cornerBrassPost = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, shGlassH - 0.02, 0.024),
    brushedBrassMat
  );
  cornerBrassPost.name = 'outbuildings.firstFloor.stableEnsuite.shower.cornerBrassPost';
  cornerBrassPost.position.set(shU1, stableUpperFloorY + 0.02 + (shGlassH - 0.02) * 0.5, shV1);
  showerGroup.add(cornerBrassPost);

  const topSouthBrassHeader = new THREE.Mesh(
    new THREE.BoxGeometry(shW, 0.022, 0.024),
    brushedBrassMat
  );
  topSouthBrassHeader.name = 'outbuildings.firstFloor.stableEnsuite.shower.topSouthBrassHeader';
  topSouthBrassHeader.position.set(shCenterU, stableUpperFloorY + shGlassH - 0.011, shV1);
  showerGroup.add(topSouthBrassHeader);

  const topEastBrassHeader = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, 0.022, shD),
    brushedBrassMat
  );
  topEastBrassHeader.name = 'outbuildings.firstFloor.stableEnsuite.shower.topEastBrassHeader';
  topEastBrassHeader.position.set(shU1, stableUpperFloorY + shGlassH - 0.011, shCenterV);
  showerGroup.add(topEastBrassHeader);

  const showerPull = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, 0.34, 12),
    brushedBrassMat
  );
  showerPull.name = 'outbuildings.firstFloor.stableEnsuite.shower.doorPull';
  showerPull.position.set(shU1 - southDoorW + 0.08, stableUpperFloorY + 0.98, shV1 + 0.022);
  showerGroup.add(showerPull);

  // Brushed-Brass Thermostatic Mixer Valve, Vertical Riser Rail & 300mm Overhead Rainfall Deluge Rose at `y = +2.00m`!
  const shFixU = shU0 + 0.50; // 23.73m
  const mixerPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.11, 0.016),
    brushedBrassMat
  );
  mixerPlate.name = 'outbuildings.firstFloor.stableEnsuite.shower.mixerPlate';
  mixerPlate.position.set(shFixU, stableUpperFloorY + 1.02, shV0 + 0.022);
  showerGroup.add(mixerPlate);

  for (const dialDx of [-0.05, 0.05] as const) {
    const dial = new THREE.Mesh(
      new THREE.CylinderGeometry(0.020, 0.020, 0.028, 14),
      brushedBrassMat
    );
    dial.rotation.x = Math.PI / 2;
    dial.name = 'outbuildings.firstFloor.stableEnsuite.shower.mixerDial';
    dial.userData = { lodTier: 'high', lodMaxDistance: 12 };
    dial.position.set(shFixU + dialDx, stableUpperFloorY + 1.02, shV0 + 0.038);
    showerGroup.add(dial);
  }

  const riserPipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.010, 0.010, 0.98, 14),
    brushedBrassMat
  );
  riserPipe.name = 'outbuildings.firstFloor.stableEnsuite.shower.riserPipe';
  riserPipe.position.set(shFixU, stableUpperFloorY + 1.51, shV0 + 0.042);
  showerGroup.add(riserPipe);

  const showerArm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.010, 0.010, 0.36, 14),
    brushedBrassMat
  );
  showerArm.rotation.x = Math.PI / 2;
  showerArm.name = 'outbuildings.firstFloor.stableEnsuite.shower.showerArm';
  showerArm.position.set(shFixU, stableUpperFloorY + 2.00, shV0 + 0.22);
  showerGroup.add(showerArm);

  const delugeHead = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.15, 0.016, 28),
    brushedBrassMat
  );
  delugeHead.name = 'outbuildings.firstFloor.stableEnsuite.showerHead';
  delugeHead.position.set(shFixU, stableUpperFloorY + 1.97, shV0 + 0.38);
  showerGroup.add(delugeHead);

  const handWand = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.011, 0.21, 12),
    brushedBrassMat
  );
  handWand.name = 'outbuildings.firstFloor.stableEnsuite.shower.handWand';
  handWand.position.set(shFixU + 0.16, stableUpperFloorY + 1.16, shV0 + 0.055);
  showerGroup.add(handWand);

  // 4. Full-Size `0.90m` Fluted-Oak & Carrara Marble Vanity Sink Unit (`outbuildings.firstFloor.stableEnsuite.vanitySink`)
  //    shifted North into the Tall NE Zone (`u = 25.54..25.98m, v = 3.53..4.43m`, centered at `v = 3.98m` where ceiling height is `2.00m–2.24m`!)
  const vanityGroup = new THREE.Group();
  vanityGroup.name = 'outbuildings.firstFloor.stableEnsuite.vanitySink';
  const vanD = 0.44; // along u (`u = 25.54..25.98m`)
  const vanW = 0.90; // along v (`v = 3.53..4.43m`)
  const vanH = 0.80;
  const vanCenterU = uEast - wallT * 0.5 - vanD * 0.5 - 0.01; // 25.76m
  const vanCenterV = 3.98;
  vanityGroup.position.set(vanCenterU, stableUpperFloorY + 0.012, vanCenterV);
  ensuiteGroup.add(vanityGroup);

  const vanCabinet = new THREE.Mesh(
    new THREE.BoxGeometry(vanD, vanH - 0.14, vanW),
    lightJoineryOakMat
  );
  vanCabinet.name = 'outbuildings.firstFloor.stableEnsuite.vanitySink.cabinet';
  vanCabinet.position.set(0, 0.12 + (vanH - 0.14) * 0.5, 0);
  vanCabinet.castShadow = true;
  vanCabinet.receiveShadow = true;
  vanityGroup.add(vanCabinet);

  for (const dy of [0.29, 0.60] as const) {
    const drawerFront = new THREE.Mesh(
      new THREE.BoxGeometry(0.018, 0.27, vanW - 0.04),
      lightJoineryOakMat
    );
    drawerFront.name = 'outbuildings.firstFloor.stableEnsuite.vanitySink.drawerFront';
    drawerFront.position.set(-vanD * 0.5 - 0.008, dy, 0);
    vanityGroup.add(drawerFront);

    const pullBar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.26, 10),
      brushedBrassMat
    );
    pullBar.rotation.x = Math.PI / 2;
    pullBar.name = 'outbuildings.firstFloor.stableEnsuite.vanitySink.drawerPull';
    pullBar.position.set(-vanD * 0.5 - 0.026, dy + 0.08, 0);
    vanityGroup.add(pullBar);
  }

  const vanMarbleTop = new THREE.Mesh(
    new THREE.BoxGeometry(vanD + 0.028, 0.034, vanW + 0.032),
    marbleTileMat
  );
  vanMarbleTop.name = 'outbuildings.firstFloor.stableEnsuite.vanitySink.marbleTop';
  vanMarbleTop.position.set(-0.006, vanH, 0);
  vanMarbleTop.castShadow = true;
  vanityGroup.add(vanMarbleTop);

  const vanSplashback = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 0.068, vanW + 0.032),
    marbleTileMat
  );
  vanSplashback.name = 'outbuildings.firstFloor.stableEnsuite.vanitySink.splashback';
  vanSplashback.position.set(vanD * 0.5 - 0.009, vanH + 0.048, 0);
  vanityGroup.add(vanSplashback);

  const sinkBasinRim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.155, 0.06, 24),
    ceramicWhiteMat
  );
  sinkBasinRim.name = 'outbuildings.firstFloor.stableEnsuite.sinkBasin';
  sinkBasinRim.position.set(-0.02, vanH + 0.03, 0);
  sinkBasinRim.scale.set(0.88, 1.0, 1.28);
  vanityGroup.add(sinkBasinRim);

  const sinkWell = new THREE.Mesh(
    new THREE.CylinderGeometry(0.155, 0.13, 0.018, 22),
    new THREE.MeshStandardMaterial({ color: 0xe2e6ea, roughness: 0.2 })
  );
  sinkWell.name = 'outbuildings.firstFloor.stableEnsuite.vanitySink.sinkWell';
  sinkWell.position.set(-0.02, vanH + 0.052, 0);
  sinkWell.scale.set(0.86, 1.0, 1.25);
  vanityGroup.add(sinkWell);

  const sinkDrainPlug = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.006, 14),
    brushedBrassMat
  );
  sinkDrainPlug.name = 'outbuildings.firstFloor.stableEnsuite.vanitySink.drainPlug';
  sinkDrainPlug.userData = { lodTier: 'high', lodMaxDistance: 12 };
  sinkDrainPlug.position.set(-0.02, vanH + 0.059, 0);
  vanityGroup.add(sinkDrainPlug);

  const tapBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.020, 0.145, 14),
    brushedBrassMat
  );
  tapBody.name = 'outbuildings.firstFloor.stableEnsuite.vanitySink.tapBody';
  tapBody.position.set(vanD * 0.5 - 0.068, vanH + 0.088, 0);
  vanityGroup.add(tapBody);

  const tapSpout = new THREE.Mesh(
    new THREE.CylinderGeometry(0.010, 0.010, 0.115, 12),
    brushedBrassMat
  );
  tapSpout.rotation.z = Math.PI * 0.42;
  tapSpout.name = 'outbuildings.firstFloor.stableEnsuite.vanitySink.tapSpout';
  tapSpout.position.set(vanD * 0.5 - 0.118, vanH + 0.138, 0);
  vanityGroup.add(tapSpout);

  // Full-Size Standing Eye-Level Backlit Brushed-Brass Vanity Mirror (`0.68m W x 0.56m H` centered at `y = +1.24m`,
  // spanning `y = 0.96m..1.52m` cleanly below the `1.82m–2.18m` East wall ceiling across `v = 3.64..4.32m`!)
  const mirrorHalo = new THREE.Mesh(
    new THREE.BoxGeometry(0.008, 0.58, 0.70),
    warmLedGlowMat
  );
  mirrorHalo.name = 'outbuildings.firstFloor.stableEnsuite.vanitySink.mirrorHalo';
  mirrorHalo.position.set(vanD * 0.5 + 0.004, 1.24, 0);
  vanityGroup.add(mirrorHalo);

  const mirrorFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.020, 0.56, 0.68),
    brushedBrassMat
  );
  mirrorFrame.name = 'outbuildings.firstFloor.stableEnsuite.mirror';
  mirrorFrame.position.set(vanD * 0.5 - 0.002, 1.24, 0);
  vanityGroup.add(mirrorFrame);

  const mirrorGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.024, 0.532, 0.652),
    new THREE.MeshStandardMaterial({ color: 0xdce8f2, roughness: 0.05, metalness: 0.92 })
  );
  mirrorGlass.name = 'outbuildings.firstFloor.stableEnsuite.vanitySink.mirrorGlass';
  mirrorGlass.position.set(vanD * 0.5 - 0.004, 1.24, 0);
  vanityGroup.add(mirrorGlass);

  // 5. Back-to-Wall Vitreous China Toilet (`outbuildings.firstFloor.stableEnsuite.toilet`)
  //    Centered on the South Wall at `u = 24.88m, v = 5.05m` directly below the Frosted South Bathroom Window (`u = 24.92m`)
  //    between the Shower (`u <= 24.48m`) and Vanity (`u >= 25.54m`), facing North (`-v`) into `1.33m` of open central floor space!
  const toiletGroup = new THREE.Group();
  toiletGroup.name = 'outbuildings.firstFloor.stableEnsuite.toilet';
  toiletGroup.position.set(24.88, stableUpperFloorY + 0.012, 5.05);
  ensuiteGroup.add(toiletGroup);

  const cisternBox = new THREE.Mesh(
    new THREE.BoxGeometry(0.86, 0.94, 0.22),
    marbleTileMat
  );
  cisternBox.name = 'outbuildings.firstFloor.stableEnsuite.toilet.cisternBox';
  cisternBox.position.set(0, 0.47, 0.25);
  cisternBox.castShadow = true;
  cisternBox.receiveShadow = true;
  toiletGroup.add(cisternBox);

  const cisternOakShelf = new THREE.Mesh(
    new THREE.BoxGeometry(0.88, 0.026, 0.24),
    lightJoineryOakMat
  );
  cisternOakShelf.name = 'outbuildings.firstFloor.stableEnsuite.toilet.cisternShelf';
  cisternOakShelf.position.set(0, 0.953, 0.245);
  toiletGroup.add(cisternOakShelf);

  const flushPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.21, 0.14, 0.012),
    brushedBrassMat
  );
  flushPlate.name = 'outbuildings.firstFloor.stableEnsuite.toilet.flushPlate';
  flushPlate.position.set(0, 0.78, 0.136);
  toiletGroup.add(flushPlate);

  const wcPedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.165, 0.145, 0.38, 22),
    ceramicWhiteMat
  );
  wcPedestal.name = 'outbuildings.firstFloor.stableEnsuite.toilet.pedestal';
  wcPedestal.position.set(0, 0.19, -0.02);
  wcPedestal.scale.set(1.0, 1.0, 1.32);
  wcPedestal.castShadow = true;
  toiletGroup.add(wcPedestal);

  const wcRearShroud = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.38, 0.24),
    ceramicWhiteMat
  );
  wcRearShroud.name = 'outbuildings.firstFloor.stableEnsuite.toilet.rearShroud';
  wcRearShroud.position.set(0, 0.19, 0.06);
  toiletGroup.add(wcRearShroud);

  const wcSeatRim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.175, 0.168, 0.032, 24),
    ceramicWhiteMat
  );
  wcSeatRim.name = 'outbuildings.firstFloor.stableEnsuite.toilet.seatRim';
  wcSeatRim.position.set(0, 0.395, -0.02);
  wcSeatRim.scale.set(1.0, 1.0, 1.34);
  toiletGroup.add(wcSeatRim);

  const wcBowlWater = new THREE.Mesh(
    new THREE.CylinderGeometry(0.125, 0.10, 0.012, 20),
    new THREE.MeshStandardMaterial({ color: 0xd6eef8, roughness: 0.08, metalness: 0.1 })
  );
  wcBowlWater.name = 'outbuildings.firstFloor.stableEnsuite.toilet.bowlWater';
  wcBowlWater.position.set(0, 0.385, -0.03);
  wcBowlWater.scale.set(1.0, 1.0, 1.25);
  toiletGroup.add(wcBowlWater);

  // 6. Brushed-Brass Heated Towel Rail Ladder on the SE Partition Wall (`u = 25.96m, v = 4.92m`, cleanly South of the Vanity!)
  const towelRailGroup = new THREE.Group();
  towelRailGroup.name = 'outbuildings.firstFloor.stableEnsuite.towelRail';
  towelRailGroup.position.set(uEast - wallT * 0.5 - 0.025, stableUpperFloorY + 0.68, 4.92);
  ensuiteGroup.add(towelRailGroup);

  for (const tv of [-0.18, 0.18] as const) {
    const vUpright = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.78, 12),
      brushedBrassMat
    );
    vUpright.name = 'outbuildings.firstFloor.stableEnsuite.towelRail.upright';
    vUpright.position.set(0, 0, tv);
    towelRailGroup.add(vUpright);
  }
  for (let r = -4; r <= 4; r++) {
    const hRung = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.36, 10),
      brushedBrassMat
    );
    hRung.rotation.x = Math.PI / 2;
    hRung.name = 'outbuildings.firstFloor.stableEnsuite.towelRail.rung';
    hRung.position.set(0, r * 0.085, 0);
    towelRailGroup.add(hRung);
  }

  const ensuiteLight = new THREE.PointLight(0xffd488, 1.9, 4.6, 1.5);
  ensuiteLight.name = 'outbuildings.firstFloor.stableEnsuite.light';
  ensuiteLight.position.set(24.75, stableUpperFloorY + 1.85, 4.15);
  ensuiteGroup.add(ensuiteLight);


  ensuiteGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.computeBoundingSphere();
    }
  });

  return {
    uWest,
    uEast,
    vNorth,
    wallT,
    eaveWallH,
    vMidRoom,
    ridgeCeilH,
    doorU0,
    doorU1,
    vNorthFace,
    marbleTileMat,
    ceramicWhiteMat,
    brushedBrassMat,
    warmLedGlowMat,
  };
}
