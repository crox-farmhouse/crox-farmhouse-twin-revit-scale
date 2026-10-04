import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import {
  createCourtyardStoneTexture,
  createWelshSlateRoofTexture,
} from '../../../../engine/textures/procedural-textures.ts';

export interface OutbuildingsBuilderKit {
  readonly exteriorBrickMat: THREE.Material;
  readonly stoneSillMat: THREE.Material;
  readonly courtyardDoorMat: THREE.Material;
  readonly courtyardDoorRecessMat: THREE.Material;
  readonly castIronMat: THREE.Material;
  readonly windowFrameMat: THREE.Material;
  readonly windowGlassMat: THREE.Material;
  readonly warmRoomPlasterMat: THREE.Material;
  readonly oakFloorMat: THREE.Material;
  readonly wallCapMat: THREE.Material;
  readonly applyWorldSpaceBrickUVs: (
    geo: THREE.BufferGeometry,
    ox: number,
    oy: number,
    oz: number
  ) => void;
  readonly addWallClimbingIvyCluster: (
    parent: THREE.Object3D,
    localX: number,
    localY: number,
    localZ: number,
    normalAxis: 'x' | 'z',
    outwardSign: 1 | -1,
    spanW: number,
    spanH: number,
    seed: number
  ) => void;
}

/**
 * Origin and orientation of the 5-Bay Outbuilding / Barn Range (`GYM`, `Garage`, `Store`, `Barn`, `Stable`)
 * running along the southern boundary of the Courtyard from the Split Driveway Gate (`X = -22.47m, Z = +16.00m`)
 * to the East Gable opposite the Kitchen & Grape-Vine Pergola (`X = +6.40m, Z = +13.51m`).
 */
export const OUTBUILDING_ORIGIN_X = -22.47;
export const OUTBUILDING_ORIGIN_Z = 16.0;
export const OUTBUILDING_ROTATION_Y = Math.atan2(2.49, 28.98); // +0.08571 rad (~4.91°)

const OUTBUILDING_COS = Math.cos(OUTBUILDING_ROTATION_Y);
const OUTBUILDING_SIN = Math.sin(OUTBUILDING_ROTATION_Y);

/**
 * Returns the world Z coordinate of the North Courtyard-facing wall of the Outbuilding Range
 * for a given world X coordinate (`wx`), used to clip the southern edge of the courtyard cobbles cleanly.
 */
export function getOutbuildingNorthWallWorldZ(wx: number): number {
  const dx = wx - OUTBUILDING_ORIGIN_X;
  const u = dx / OUTBUILDING_COS;
  const vNorth = u >= 12.07 ? 0.14 : 0.0;
  return OUTBUILDING_ORIGIN_Z - u * OUTBUILDING_SIN + vNorth * OUTBUILDING_COS;
}

/**
 * Issue #7: Creates a speckled EPDM dark-charcoal rubber gym tile material (`1m x 1m` tiles with
 * fine grey/blue-grey elastomer flecks and subtle micro-grain bump).
 */
function createGymRubberTileMaterial(): THREE.MeshStandardMaterial {
  const size = 256;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d')!;

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;

  const cImg = cCtx.createImageData(size, size);
  const bImg = bCtx.createImageData(size, size);
  const cData = cImg.data;
  const bData = bImg.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const h1 = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      const f1 = h1 - Math.floor(h1);
      const h2 = Math.sin(x * 39.346 + y * 11.135) * 29183.127;
      const f2 = h2 - Math.floor(h2);

      // Base vulcanized dark charcoal rubber (#2c2e33) with subtle EPDM silver-grey flecks
      let r = 44 + Math.round((f1 - 0.5) * 8);
      let g = 46 + Math.round((f1 - 0.5) * 8);
      let b = 50 + Math.round((f1 - 0.5) * 9);
      if (f2 > 0.91) {
        // Light grey EPDM rubber crumb fleck
        r += 34;
        g += 36;
        b += 40;
      } else if (f2 < 0.08) {
        // Deep carbon black rubber granule
        r -= 10;
        g -= 10;
        b -= 10;
      }

      cData[idx] = Math.max(0, Math.min(255, r));
      cData[idx + 1] = Math.max(0, Math.min(255, g));
      cData[idx + 2] = Math.max(0, Math.min(255, b));
      cData[idx + 3] = 255;

      const bumpVal = Math.max(0, Math.min(255, Math.round(128 + (f1 - 0.5) * 42)));
      bData[idx] = bumpVal;
      bData[idx + 1] = bumpVal;
      bData[idx + 2] = bumpVal;
      bData[idx + 3] = 255;
    }
  }

  cCtx.putImageData(cImg, 0, 0);
  bCtx.putImageData(bImg, 0, 0);

  const colorMap = new THREE.CanvasTexture(colorCanvas);
  colorMap.colorSpace = THREE.SRGBColorSpace;
  colorMap.wrapS = THREE.RepeatWrapping;
  colorMap.wrapT = THREE.RepeatWrapping;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;

  return new THREE.MeshStandardMaterial({
    map: colorMap,
    bumpMap,
    bumpScale: 0.006,
    color: 0xffffff,
    roughness: 0.76,
    metalness: 0.04,
  });
}

/**
 * Issue #7: Builds a single 3D `BufferGeometry` containing the grid of `1.00m x 1.00m`
 * EPDM rubber gym floor tiles across the `5.49m x 5.15m` GYM floor (`u = 0.28m..5.77m, v = 0.28m..5.43m`),
 * where every individual `1m x 1m` tile has a 45° chamfered perimeter edge bevel and recessed V-groove joint.
 */
function createChamferedGymRubberTilesGeometry(
  uStart: number,
  uSpan: number,
  vStart: number,
  vSpan: number,
  yBottom: number,
  tileThickness: number
): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const tilePitch = 1.0; // 1.00m x 1.00m nominal gym tiles
  const jointGap = 0.003; // 3mm tight seam between adjacent rubber tiles
  const chamferW = 0.014; // 14mm 45° chamfered edge bevel on each tile perimeter
  const chamferDrop = 0.01; // 10mm vertical drop along the chamfer bevel
  const yTop = yBottom + tileThickness;
  const yShoulder = yTop - chamferDrop;

  const addQuad = (
    p0: readonly [number, number, number],
    p1: readonly [number, number, number],
    p2: readonly [number, number, number],
    p3: readonly [number, number, number],
    nx: number,
    ny: number,
    nz: number,
    uvScale: number
  ): void => {
    const base = positions.length / 3;
    positions.push(
      p0[0], p0[1], p0[2],
      p1[0], p1[1], p1[2],
      p2[0], p2[1], p2[2],
      p3[0], p3[1], p3[2]
    );
    for (let k = 0; k < 4; k++) {
      normals.push(nx, ny, nz);
    }
    uvs.push(
      p0[0] * uvScale, p0[2] * uvScale,
      p1[0] * uvScale, p1[2] * uvScale,
      p2[0] * uvScale, p2[2] * uvScale,
      p3[0] * uvScale, p3[2] * uvScale
    );
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };

  const numCols = Math.ceil(uSpan / tilePitch); // 6 columns across 5.49m (5 x 1.00m + 1 x 0.49m perimeter cut tile)
  const numRows = Math.ceil(vSpan / tilePitch); // 6 rows across 5.15m (5 x 1.00m + 1 x 0.15m perimeter cut tile)
  const invBevNorm = 1 / Math.hypot(chamferW, chamferDrop);
  const bevHoriz = chamferDrop * invBevNorm;
  const bevVert = chamferW * invBevNorm;

  for (let col = 0; col < numCols; col++) {
    const u0 = uStart + col * tilePitch + jointGap * 0.5;
    const u1 = Math.min(uStart + uSpan, uStart + (col + 1) * tilePitch) - jointGap * 0.5;
    if (u1 - u0 <= chamferW * 2.2) continue;

    for (let row = 0; row < numRows; row++) {
      const v0 = vStart + row * tilePitch + jointGap * 0.5;
      const v1 = Math.min(vStart + vSpan, vStart + (row + 1) * tilePitch) - jointGap * 0.5;
      if (v1 - v0 <= chamferW * 2.2) continue;

      const uIn0 = u0 + chamferW;
      const uIn1 = u1 - chamferW;
      const vIn0 = v0 + chamferW;
      const vIn1 = v1 - chamferW;
      const uvOffset = ((col * 7 + row * 13) % 5) * 0.17;

      // 1. Flat top center surface of the 1m x 1m rubber tile (y = yTop)
      addQuad(
        [uIn0, yTop, vIn0],
        [uIn0, yTop, vIn1],
        [uIn1, yTop, vIn1],
        [uIn1, yTop, vIn0],
        0, 1, 0,
        1.25 + uvOffset * 0.05
      );

      // 2. Four 45° chamfered perimeter bevel faces sloping from yTop (inner) to yShoulder (outer)
      // North (-v) chamfer bevel
      addQuad(
        [u0, yShoulder, v0],
        [uIn0, yTop, vIn0],
        [uIn1, yTop, vIn0],
        [u1, yShoulder, v0],
        0, bevVert, -bevHoriz,
        1.25
      );
      // South (+v) chamfer bevel
      addQuad(
        [uIn0, yTop, vIn1],
        [u0, yShoulder, v1],
        [u1, yShoulder, v1],
        [uIn1, yTop, vIn1],
        0, bevVert, bevHoriz,
        1.25
      );
      // West (-u) chamfer bevel
      addQuad(
        [u0, yShoulder, v0],
        [u0, yShoulder, v1],
        [uIn0, yTop, vIn1],
        [uIn0, yTop, vIn0],
        -bevHoriz, bevVert, 0,
        1.25
      );
      // East (+u) chamfer bevel
      addQuad(
        [uIn1, yTop, vIn0],
        [uIn1, yTop, vIn1],
        [u1, yShoulder, v1],
        [u1, yShoulder, v0],
        bevHoriz, bevVert, 0,
        1.25
      );

      // 3. Four vertical perimeter side skirts inside the tile joint gap (yShoulder down to yBottom)
      addQuad(
        [u0, yBottom, v0],
        [u0, yShoulder, v0],
        [u1, yShoulder, v0],
        [u1, yBottom, v0],
        0, 0, -1,
        1.0
      );
      addQuad(
        [u1, yBottom, v1],
        [u1, yShoulder, v1],
        [u0, yShoulder, v1],
        [u0, yBottom, v1],
        0, 0, 1,
        1.0
      );
      addQuad(
        [u0, yBottom, v1],
        [u0, yShoulder, v1],
        [u0, yShoulder, v0],
        [u0, yBottom, v0],
        -1, 0, 0,
        1.0
      );
      addQuad(
        [u1, yBottom, v0],
        [u1, yShoulder, v0],
        [u1, yShoulder, v1],
        [u1, yBottom, v1],
        1, 0, 0,
        1.0
      );
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

/**
 * Builds the complete 5-Bay Outbuilding / Barn Range:
 * - Single-Storey West Range (`GYM` `5.49m x 5.15m`, `Garage` `6.10m x 5.15m`, `Store` `2.65m x 5.15m`)
 * - Two-Storey East Range (`Barn` `8.02m x 4.85m` + `2-Storey Stable` `5.55m x 4.95m` + `Outbuilding First Floor`
 *   `4.30m x 5.10m` and `5.60m x 5.10m` rooms above)
 */
export function buildOutbuildingsAndBarns(
  ctx: SceneBuilderContext,
  kit: OutbuildingsBuilderKit
): void {
  const { scene, firstFloorMeshGroup, ceilingMeshGroup } = ctx;
  const {
    exteriorBrickMat,
    stoneSillMat,
    courtyardDoorMat,
    courtyardDoorRecessMat,
    castIronMat,
    windowFrameMat,
    windowGlassMat,
    warmRoomPlasterMat,
    oakFloorMat,
    wallCapMat,
    applyWorldSpaceBrickUVs,
    addWallClimbingIvyCluster,
  } = kit;

  // Root groups aligned with the Outbuilding Range axis (Ground Floor, First Floor, and Roof)
  const groundGroup = new THREE.Group();
  groundGroup.name = 'outbuildings.groundShell';
  groundGroup.userData.isArchitecturalShell = true;
  groundGroup.position.set(OUTBUILDING_ORIGIN_X, 0, OUTBUILDING_ORIGIN_Z);
  groundGroup.rotation.y = OUTBUILDING_ROTATION_Y;
  scene.add(groundGroup);

  const firstFloorGroup = new THREE.Group();
  firstFloorGroup.name = 'outbuildings.firstFloor';
  firstFloorGroup.userData.isArchitecturalShell = true;
  firstFloorGroup.position.set(OUTBUILDING_ORIGIN_X, 0, OUTBUILDING_ORIGIN_Z);
  firstFloorGroup.rotation.y = OUTBUILDING_ROTATION_Y;
  firstFloorMeshGroup.add(firstFloorGroup);

  const roofGroup = new THREE.Group();
  roofGroup.name = 'outbuildings.roof';
  roofGroup.position.set(OUTBUILDING_ORIGIN_X, 0, OUTBUILDING_ORIGIN_Z);
  roofGroup.rotation.y = OUTBUILDING_ROTATION_Y;
  ceilingMeshGroup.add(roofGroup);

  // Materials for the Outbuilding Range
  const slateTex = createWelshSlateRoofTexture();
  const pantileRoofMat = new THREE.MeshStandardMaterial({
    map: slateTex,
    bumpMap: slateTex,
    bumpScale: 0.02,
    color: 0xb8a392, // Weathered warm grey-brown clay pantile / barn roof tint (Photos 2, 5, 6)
    roughness: 0.82,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  const welshSlateMat = new THREE.MeshStandardMaterial({
    map: slateTex,
    bumpMap: slateTex,
    bumpScale: 0.018,
    color: 0xffffff,
    roughness: 0.78,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  const coursedStoneTex = createCourtyardStoneTexture();

  const darkBarnDoorMat = new THREE.MeshStandardMaterial({
    color: 0x3b332d,
    roughness: 0.76,
    metalness: 0.04,
  });

  const barnFloorMat = new THREE.MeshStandardMaterial({
    map: coursedStoneTex,
    color: 0x9e988e,
    roughness: 0.84,
    metalness: 0.03,
  });

  const gymSubFloorMat = new THREE.MeshStandardMaterial({
    color: 0x222428, // Dark recessed joint bed under the 1m x 1m chamfered rubber gym tiles
    roughness: 0.9,
    metalness: 0.02,
  });
  const gymRubberTileMat = createGymRubberTileMaterial();

  // Helper to compute local base ground elevation along u = 0..29.05m
  // Grades smoothly from Y = -0.60m at the West gate (u = 0) to Y = -0.18m at the Stable (u = 29m)
  const getBaseYAtU = (u: number): number => {
    const t = Math.max(0, Math.min(1, u / 28.5));
    const smooth = t * t * (3 - 2 * t);
    return -0.6 + 0.42 * smooth;
  };

  const wallT = 0.28;
  const partT = 0.2;

  // Helper to add a brick/plaster wall box in Outbuilding local coordinates (u, y, v)
  const addOutbuildingBrickWall = (
    parent: THREE.Object3D,
    uMin: number,
    uMax: number,
    yMin: number,
    yMax: number,
    vMin: number,
    vMax: number,
    plasterFaces: ReadonlyArray<'+x' | '-x' | '+z' | '-z'> = [],
    overrideExteriorMat: THREE.Material = exteriorBrickMat
  ): THREE.Mesh => {
    const w = uMax - uMin;
    const h = yMax - yMin;
    const d = vMax - vMin;
    const cu = (uMin + uMax) * 0.5;
    const cy = (yMin + yMax) * 0.5;
    const cv = (vMin + vMax) * 0.5;
    const geo = new THREE.BoxGeometry(w, h, d);
    applyWorldSpaceBrickUVs(geo, OUTBUILDING_ORIGIN_X + cu, cy, OUTBUILDING_ORIGIN_Z + cv);
    const pSet = new Set(plasterFaces);
    const mats: THREE.Material[] = [
      pSet.has('+x') ? warmRoomPlasterMat : overrideExteriorMat,
      pSet.has('-x') ? warmRoomPlasterMat : overrideExteriorMat,
      wallCapMat,
      overrideExteriorMat,
      pSet.has('+z') ? warmRoomPlasterMat : overrideExteriorMat,
      pSet.has('-z') ? warmRoomPlasterMat : overrideExteriorMat,
    ];
    const mesh = new THREE.Mesh(geo, mats);
    mesh.userData.isArchitecturalShell = true;
    mesh.position.set(cu, cy, cv);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  // Helper to add a vertical-boarded painted timber double garage / coach door or single barn door
  const addBoardedBarnDoor = (
    parent: THREE.Object3D,
    uCenter: number,
    yBase: number,
    vWallCenter: number,
    width: number,
    height: number,
    isDoubleLeaf: boolean,
    mat: THREE.Material = courtyardDoorMat
  ): void => {
    const doorGroup = new THREE.Group();
    doorGroup.position.set(uCenter, yBase, vWallCenter);

    // Timber outer frame jambs & head lintel
    const frameDepth = wallT + 0.02;
    const headFrame = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.12, 0.08, frameDepth),
      courtyardDoorRecessMat
    );
    headFrame.position.set(0, height + 0.04, 0);
    doorGroup.add(headFrame);

    for (const side of [-1, 1]) {
      const jamb = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, height, frameDepth),
        courtyardDoorRecessMat
      );
      jamb.position.set(side * (width * 0.5 + 0.03), height * 0.5, 0);
      doorGroup.add(jamb);
    }

    // Reclaimed stone threshold sill
    const sill = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.14, 0.045, wallT + 0.08),
      stoneSillMat
    );
    sill.position.set(0, 0.022, -0.02);
    sill.receiveShadow = true;
    doorGroup.add(sill);

    // Door leaf panel(s) with vertical boarding grooves & black wrought-iron strap hinges
    const numLeaves = isDoubleLeaf ? 2 : 1;
    const leafW = (width - (isDoubleLeaf ? 0.016 : 0)) / numLeaves;
    for (let l = 0; l < numLeaves; l++) {
      const lx = isDoubleLeaf ? (l === 0 ? -leafW * 0.5 - 0.004 : leafW * 0.5 + 0.004) : 0;
      const leafPanel = new THREE.Mesh(
        new THREE.BoxGeometry(leafW, height - 0.02, 0.052),
        mat
      );
      leafPanel.position.set(lx, height * 0.5 + 0.01, -0.04);
      leafPanel.castShadow = true;
      leafPanel.receiveShadow = true;
      doorGroup.add(leafPanel);

      // Vertical tongue-and-groove shadow battens along the front (-v) face
      const numPlanks = Math.max(4, Math.round(leafW / 0.14));
      for (let p = 1; p < numPlanks; p++) {
        const px = lx - leafW * 0.5 + (p / numPlanks) * leafW;
        const groove = new THREE.Mesh(
          new THREE.BoxGeometry(0.012, height - 0.06, 0.058),
          courtyardDoorRecessMat
        );
        groove.position.set(px, height * 0.5 + 0.01, -0.04);
        doorGroup.add(groove);
      }

      // Upper and lower black wrought-iron strap hinges on the courtyard (-v) face
      const hingeSide = isDoubleLeaf ? (l === 0 ? -1 : 1) : -1;
      const hingeBaseX = lx + hingeSide * (leafW * 0.5 - 0.18);
      for (const hy of [height * 0.24, height * 0.78]) {
        const strap = new THREE.Mesh(
          new THREE.BoxGeometry(Math.min(0.36, leafW * 0.45), 0.036, 0.014),
          castIronMat
        );
        strap.position.set(hingeBaseX, hy, -0.07);
        doorGroup.add(strap);
      }
    }

    // Center iron ring latch
    const latch = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.14, 0.025), castIronMat);
    latch.position.set(isDoubleLeaf ? 0.03 : leafW * 0.36, height * 0.48, -0.072);
    doorGroup.add(latch);

    parent.add(doorGroup);
  };

  /**
   * Issue #6 ("This is glass" at `[-18.173, 0.287, 15.705]`):
   * Builds a full-height 4-bay glazed gym screen & double glass doors (`outbuildings.gym.northGlazedScreen`)
   * in the wide Coach-Arch opening (`u = 3.05m..5.45m`) of the GYM North Courtyard wall.
   */
  const addGlazedGymCoachScreen = (
    parent: THREE.Object3D,
    uCenter: number,
    yBase: number,
    vWallCenter: number,
    width: number,
    height: number
  ): void => {
    const screenGroup = new THREE.Group();
    screenGroup.name = 'outbuildings.gym.northGlazedScreen';
    screenGroup.position.set(uCenter, yBase, vWallCenter);

    // Outer perimeter frame & stone threshold sill
    const frameDepth = wallT + 0.02;
    const headFrame = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.12, 0.075, frameDepth),
      courtyardDoorRecessMat
    );
    headFrame.position.set(0, height + 0.038, 0);
    screenGroup.add(headFrame);

    for (const side of [-1, 1]) {
      const outerJamb = new THREE.Mesh(
        new THREE.BoxGeometry(0.055, height, frameDepth),
        courtyardDoorRecessMat
      );
      outerJamb.position.set(side * (width * 0.5 + 0.028), height * 0.5, 0);
      screenGroup.add(outerJamb);
    }

    const sill = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.14, 0.045, wallT + 0.08),
      stoneSillMat
    );
    sill.position.set(0, 0.022, -0.02);
    sill.receiveShadow = true;
    screenGroup.add(sill);

    // 4 full-height glazed bays (2 fixed side lights + 2 central French glass doors)
    const numBays = 4;
    const bayW = width / numBays;
    const glassH = height - 0.11;
    const glassCenterY = height * 0.5 + 0.02;

    for (let b = 0; b < numBays; b++) {
      const bx = -width * 0.5 + (b + 0.5) * bayW;

      // Top and bottom door/sidelight frame rails
      const topRail = new THREE.Mesh(
        new THREE.BoxGeometry(bayW - 0.01, 0.055, 0.058),
        courtyardDoorMat
      );
      topRail.position.set(bx, height - 0.028, -0.02);
      screenGroup.add(topRail);

      const botRail = new THREE.Mesh(
        new THREE.BoxGeometry(bayW - 0.01, 0.075, 0.058),
        courtyardDoorMat
      );
      botRail.position.set(bx, 0.06, -0.02);
      screenGroup.add(botRail);

      // Left and right vertical stiles of each bay
      for (const s of [-1, 1]) {
        const stile = new THREE.Mesh(
          new THREE.BoxGeometry(0.042, height - 0.03, 0.058),
          courtyardDoorMat
        );
        stile.position.set(bx + s * (bayW * 0.5 - 0.024), height * 0.5 + 0.01, -0.02);
        screenGroup.add(stile);
      }

      // Slim horizontal glazing bars dividing each tall glass bay into 3 lights
      for (const ty of [height * 0.36, height * 0.68]) {
        const transom = new THREE.Mesh(
          new THREE.BoxGeometry(bayW - 0.07, 0.024, 0.042),
          courtyardDoorMat
        );
        transom.position.set(bx, ty, -0.02);
        screenGroup.add(transom);
      }

      // Full-height clear architectural glass pane (`windowGlassMat` — Issue #6: "This is glass")
      const glassPane = new THREE.Mesh(
        new THREE.BoxGeometry(bayW - 0.08, glassH, 0.024),
        windowGlassMat
      );
      glassPane.name = `outbuildings.gym.northGlazedScreen.glass.${b + 1}`;
      glassPane.position.set(bx, glassCenterY, -0.02);
      screenGroup.add(glassPane);
    }

    // Twin black lever handles on the central double glass doors
    for (const side of [-1, 1]) {
      const handle = new THREE.Mesh(
        new THREE.BoxGeometry(0.028, 0.14, 0.045),
        castIronMat
      );
      handle.position.set(side * 0.042, height * 0.48, -0.052);
      screenGroup.add(handle);
    }

    parent.add(screenGroup);
  };

  // Helper to add a multi-pane casement window in an Outbuilding wall
  // (Issue #9: Spans the full `wallT = 0.28m` thickness so frame, mullions, transoms, and glass are visible on BOTH exterior and interior wall faces!)
  const addOutbuildingWindow = (
    parent: THREE.Object3D,
    uCenter: number,
    yCenter: number,
    vCenter: number,
    width: number,
    height: number,
    alongV: boolean = false
  ): void => {
    const winGroup = new THREE.Group();
    winGroup.position.set(uCenter, yCenter, vCenter);
    if (alongV) {
      winGroup.rotation.y = Math.PI / 2;
    }

    // Weathered stone sill & upper brick/stone lintel header projecting proud of both wall faces
    const sill = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.1, 0.058, wallT + 0.09),
      stoneSillMat
    );
    sill.position.set(0, -height * 0.5 - 0.024, 0);
    sill.castShadow = true;
    sill.receiveShadow = true;
    winGroup.add(sill);

    const lintel = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.08, 0.065, wallT + 0.045),
      stoneSillMat
    );
    lintel.position.set(0, height * 0.5 + 0.028, 0);
    winGroup.add(lintel);

    // Outer white-painted timber frame spanning full wall thickness + 4.4cm reveal projection
    const frameDepth = wallT + 0.044;
    for (const side of [-1, 1]) {
      const stile = new THREE.Mesh(
        new THREE.BoxGeometry(0.054, height, frameDepth),
        windowFrameMat
      );
      stile.position.set(side * (width * 0.5 - 0.027), 0, 0);
      winGroup.add(stile);

      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.054, frameDepth),
        windowFrameMat
      );
      rail.position.set(0, side * (height * 0.5 - 0.027), 0);
      winGroup.add(rail);
    }

    // Center vertical mullion & horizontal transom (6-pane cottage casement) proud of glass on both sides
    const barDepth = wallT + 0.048;
    const midMullion = new THREE.Mesh(
      new THREE.BoxGeometry(0.036, height - 0.08, barDepth),
      windowFrameMat
    );
    winGroup.add(midMullion);

    const midTransom = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.08, 0.032, barDepth),
      windowFrameMat
    );
    winGroup.add(midTransom);

    // Dark reflective architectural glazing spanning proud of the 0.28m brick wall on both exterior & interior faces
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.09, height - 0.09, wallT + 0.028),
      windowGlassMat
    );
    winGroup.add(glass);

    parent.add(winGroup);
  };

  // Helper to build a double-pitched gable roof + brick gable triangles + eaves gutters
  const addPitchedOutbuildingRoofSection = (
    uMin: number,
    uMax: number,
    vMin: number,
    vMax: number,
    baseYWest: number,
    baseYEast: number,
    eaveRelH: number,
    ridgeRelH: number,
    roofMat: THREE.Material,
    addWestBrickGable: boolean,
    addEastBrickGable: boolean,
    westGableFloorRelH: number = eaveRelH,
    eastGableFloorRelH: number = eaveRelH
  ): void => {
    const vMid = (vMin + vMax) * 0.5;
    const halfSpanV = (vMax - vMin) * 0.5 + 0.2; // 0.20m eaves overhang
    const slopeRise = ridgeRelH - eaveRelH;
    const slopeLenV = Math.hypot(halfSpanV, slopeRise);
    const pitchAngle = Math.atan2(slopeRise, halfSpanV);
    const lenU = uMax - uMin + 0.24;
    const uMid = (uMin + uMax) * 0.5;
    const avgBaseY = (baseYWest + baseYEast) * 0.5;
    const uTiltZ = Math.atan2(baseYEast - baseYWest, uMax - uMin);

    const sectionRoofGroup = new THREE.Group();
    sectionRoofGroup.position.set(uMid, avgBaseY, vMid);
    sectionRoofGroup.rotation.z = uTiltZ;

    // North (-v) and South (+v) pitched roof slopes
    for (const sideV of [-1, 1] as const) {
      const slopeMesh = new THREE.Mesh(
        new THREE.BoxGeometry(lenU, 0.055, slopeLenV),
        roofMat
      );
      slopeMesh.position.set(
        0,
        eaveRelH + slopeRise * 0.5,
        sideV * (halfSpanV * 0.5)
      );
      slopeMesh.rotation.x = sideV * pitchAngle;
      slopeMesh.castShadow = true;
      slopeMesh.receiveShadow = true;
      sectionRoofGroup.add(slopeMesh);

      // Black half-round cast-iron eaves gutter along North and South eaves
      const gutter = new THREE.Mesh(
        new THREE.CylinderGeometry(0.052, 0.052, lenU, 12, 1, true, Math.PI, Math.PI),
        castIronMat
      );
      gutter.rotation.z = Math.PI / 2;
      gutter.position.set(0, eaveRelH - 0.02, sideV * (halfSpanV + 0.03));
      sectionRoofGroup.add(gutter);
    }

    // Ridge roll cap
    const ridgeCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, lenU + 0.02, 12, 1, false, 0, Math.PI),
      castIronMat
    );
    ridgeCap.rotation.z = Math.PI / 2;
    ridgeCap.position.set(0, ridgeRelH + 0.02, 0);
    sectionRoofGroup.add(ridgeCap);

    roofGroup.add(sectionRoofGroup);

    // Brick gable end triangles at uMin and/or uMax
    const buildGableEndTriangle = (uWallMin: number, baseY: number, startRelH: number): void => {
      const shape = new THREE.Shape();
      const halfWallV = (vMax - vMin) * 0.5;
      shape.moveTo(-halfWallV, startRelH);
      shape.lineTo(halfWallV, startRelH);
      if (startRelH < eaveRelH) {
        shape.lineTo(halfWallV, eaveRelH);
        shape.lineTo(0, ridgeRelH);
        shape.lineTo(-halfWallV, eaveRelH);
      } else {
        const frac = (ridgeRelH - startRelH) / Math.max(0.05, ridgeRelH - eaveRelH);
        const wAtStart = halfWallV * frac;
        shape.moveTo(-wAtStart, startRelH);
        shape.lineTo(wAtStart, startRelH);
        shape.lineTo(0, ridgeRelH);
      }
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: wallT,
        bevelEnabled: false,
      });
      geo.rotateY(Math.PI / 2);
      applyWorldSpaceBrickUVs(
        geo,
        OUTBUILDING_ORIGIN_X + uWallMin,
        baseY,
        OUTBUILDING_ORIGIN_Z + vMid
      );
      const mesh = new THREE.Mesh(geo, exteriorBrickMat);
      mesh.position.set(uWallMin, baseY, vMid);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      roofGroup.add(mesh);
    };

    if (addWestBrickGable) {
      buildGableEndTriangle(uMin, baseYWest, westGableFloorRelH);
    }
    if (addEastBrickGable) {
      buildGableEndTriangle(uMax - wallT, baseYEast, eastGableFloorRelH);
    }
  };

  // =========================================================================
  // 1. LEVEL 1 — SINGLE-STOREY WEST RANGE (`GYM` + `GARAGE`, u = 0.00m..12.07m)
  //    - Bay 1 (`GYM`: 5.49m x 5.15m, u = 0.00m..5.77m)
  //    - Bay 2 (`Garage`: 6.10m x 5.15m, u = 5.77m..12.07m)
  //    - Issue #8 ("Larger door on this section, double garage door, no single door" at `[-13.829, 0.425, 15.332]`):
  //      The Garage (`u = 5.77m..12.07m`) has TWO large `2.64m`-wide Double Garage Doors (`u = 6.08m..8.72m`
  //      and `u = 9.12m..11.76m`) and NO single door!
  //    - Issue #4 ("Remove this post" at `[-19.699, 1.139, 15.508]`):
  //      Removed `outbuildings.courtyardPostLamp` completely.
  // =========================================================================
  const uGymStart = 0.0;
  const uGymEnd = 5.77; // 0.28m West wall + 5.49m GYM
  const uGarageEnd = 12.07; // + 0.20m partition + 6.10m Garage
  const uStoreEnd = 14.96; // + 0.24m step-up wall + 2.65m Store
  const vWestRangeNorth = 0.0;
  const vWestRangeSouth = 5.71; // 0.28m North + 5.15m internal + 0.28m South
  const westRangeWallH = 2.42;
  const westRangeRidgeH = 3.92;
  const baseY0 = getBaseYAtU(0); // -0.60m
  const baseY12 = getBaseYAtU(uGarageEnd); // -0.44m
  const baseYStoreEnd = getBaseYAtU(uStoreEnd); // -0.39m

  // Issue #7: GYM Floor (`5.49m x 5.15m`) built as a dark sub-slab + 3D `1.00m x 1.00m` Chamfered-Edge Rubber Gym Tiles
  const gymSubSlab = new THREE.Mesh(
    new THREE.BoxGeometry(5.49, 0.095, 5.15),
    gymSubFloorMat
  );
  gymSubSlab.name = 'outbuildings.gym.subSlab';
  gymSubSlab.position.set(0.28 + 5.49 * 0.5, baseY0 - 0.062, 0.28 + 5.15 * 0.5);
  gymSubSlab.receiveShadow = true;
  groundGroup.add(gymSubSlab);

  const gymRubberTilesMesh = new THREE.Mesh(
    createChamferedGymRubberTilesGeometry(0.28, 5.49, 0.28, 5.15, baseY0 - 0.014, 0.026),
    gymRubberTileMat
  );
  gymRubberTilesMesh.name = 'outbuildings.gym.rubberTileFloor';
  gymRubberTilesMesh.castShadow = false;
  gymRubberTilesMesh.receiveShadow = true;
  groundGroup.add(gymRubberTilesMesh);

  // Garage Ground Floor Slab
  const garageFloor = new THREE.Mesh(
    new THREE.BoxGeometry(6.1, 0.12, 5.15),
    barnFloorMat
  );
  garageFloor.position.set(5.97 + 6.1 * 0.5, (baseY0 + baseY12) * 0.5 - 0.05, 0.28 + 5.15 * 0.5);
  garageFloor.receiveShadow = true;
  groundGroup.add(garageFloor);

  // West Gable Wall of GYM facing the Front Road (u = 0.00m..0.28m, v = 0.00m..5.71m — Photos 2 & 3)
  addOutbuildingBrickWall(groundGroup, 0, wallT, baseY0 - 0.12, baseY0 + westRangeWallH, 0, 1.45, ['+x']);
  addOutbuildingBrickWall(groundGroup, 0, wallT, baseY0 + 2.08, baseY0 + westRangeWallH, 1.45, 2.45, ['+x']);
  addOutbuildingBrickWall(groundGroup, 0, wallT, baseY0 - 0.12, baseY0 + westRangeWallH, 2.45, vWestRangeSouth, ['+x']);
  addOutbuildingWindow(groundGroup, wallT * 0.5, baseY0 + 1.05, 1.95, 1.0, 2.05, true);

  // Massive Lush Climbing Ivy Mantle covering the West Gable Wall of the GYM (Photos 2, 3 & 6)
  addWallClimbingIvyCluster(
    groundGroup,
    -0.02,
    baseY0,
    3.25,
    'x',
    -1,
    4.6,
    westRangeRidgeH - 0.15,
    301
  );

  // South-West Brick Boundary Wall & Timber Garden Gate to the right (South) of the GYM West Gable (Photo 2 & 4)
  addOutbuildingBrickWall(groundGroup, 0, wallT, baseY0 - 0.12, baseY0 + 1.95, vWestRangeSouth, vWestRangeSouth + 0.45);
  addBoardedBarnDoor(groundGroup, wallT * 0.5, baseY0, vWestRangeSouth + 0.98, 1.02, 1.88, false, courtyardDoorMat);
  addOutbuildingBrickWall(groundGroup, 0, wallT, baseY0 - 0.12, baseY0 + 1.98, vWestRangeSouth + 1.5, vWestRangeSouth + 3.2);

  // South Garden Wall of GYM & Garage (v = 5.43m..5.71m, u = 0.28m..12.07m) + South GYM Casement Window
  const northWestWallTopY = baseY12 + westRangeWallH;
  addOutbuildingBrickWall(
    groundGroup,
    wallT,
    uGarageEnd,
    baseY0 - 0.12,
    northWestWallTopY,
    vWestRangeSouth - wallT,
    vWestRangeSouth,
    ['-z']
  );
  addOutbuildingWindow(
    groundGroup,
    3.05,
    baseY0 + 1.35,
    vWestRangeSouth - wallT * 0.5,
    0.96,
    1.05
  );

  // Internal Partition Wall between GYM and Garage (u = 5.77m..5.97m) with doorway at v = 1.25m..2.15m (Floorplan Image 9)
  addOutbuildingBrickWall(groundGroup, uGymEnd, uGymEnd + partT, baseY0, northWestWallTopY, wallT, 1.25, ['+x', '-x']);
  addOutbuildingBrickWall(groundGroup, uGymEnd, uGymEnd + partT, baseY0 + 2.08, northWestWallTopY, 1.25, 2.15, ['+x', '-x']);
  addOutbuildingBrickWall(groundGroup, uGymEnd, uGymEnd + partT, baseY0, northWestWallTopY, 2.15, vWestRangeSouth - wallT, ['+x', '-x']);

  // North Courtyard Wall of GYM & Garage (v = 0.00m..0.28m, u = 0.28m..12.07m):
  // - Issue #5 ("No door here just a small window" at `[-21.444, 0.307, 15.986]`):
  //   Solid brick wall on the West half of GYM with a single small casement window at u = 1.15m..1.83m
  // - Issue #6 ("This is glass" at `[-18.173, 0.287, 15.705]`):
  //   Full-height 4-bay glazed gym screen & double glass doors at u = 3.05m..5.45m (width 2.40m)
  // - Issue #8 ("Larger door on this section, double garage door, no single door" at `[-13.829, 0.425, 15.332]`):
  //   Two wide `2.64m` Double Garage Doors in `Garage` (`u = 6.08m..8.72m` and `u = 9.12m..11.76m`) with NO single door!
  addOutbuildingBrickWall(groundGroup, wallT, 1.15, baseY0 - 0.12, northWestWallTopY, 0, wallT, ['+z']);
  addOutbuildingBrickWall(groundGroup, 1.15, 1.83, baseY0 - 0.12, baseY0 + 1.0, 0, wallT, ['+z']);
  addOutbuildingBrickWall(groundGroup, 1.15, 1.83, baseY0 + 1.78, northWestWallTopY, 0, wallT, ['+z']);
  addOutbuildingWindow(groundGroup, 1.49, baseY0 + 1.39, wallT * 0.5, 0.68, 0.78);
  addOutbuildingBrickWall(groundGroup, 1.83, 3.05, baseY0 - 0.12, northWestWallTopY, 0, wallT, ['+z']);

  // GYM East wide opening (u = 3.05m..5.45m): Full-height glazed screen & glass doors (Issue #6!)
  addOutbuildingBrickWall(groundGroup, 3.05, 5.45, baseY0 + 2.1, northWestWallTopY, 0, wallT, ['+z']);
  addGlazedGymCoachScreen(groundGroup, 4.25, baseY0 + 0.02, wallT * 0.5, 2.4, 2.08);

  // Pier between GYM glazed screen and Garage Double Door #1 (u = 5.45m..6.08m)
  addOutbuildingBrickWall(groundGroup, 5.45, 6.08, baseY0 - 0.12, northWestWallTopY, 0, wallT, ['+z']);

  // Garage Double Coach/Garage Door #1 (u = 6.08m..8.72m, width = 2.64m — Issue #8!)
  addOutbuildingBrickWall(groundGroup, 6.08, 8.72, baseY12 + 2.08, northWestWallTopY, 0, wallT, ['+z']);
  addBoardedBarnDoor(groundGroup, 7.4, baseY12 - 0.03, wallT * 0.5, 2.64, 2.1, true, courtyardDoorMat);

  // Central Brick Pier between the two Double Garage Doors (u = 8.72m..9.12m)
  addOutbuildingBrickWall(groundGroup, 8.72, 9.12, baseY12 - 0.12, northWestWallTopY, 0, wallT, ['+z']);

  // Garage Double Coach/Garage Door #2 (u = 9.12m..11.76m, width = 2.64m — Issue #8: "Larger door on this section, double garage door, no single door"!)
  addOutbuildingBrickWall(groundGroup, 9.12, 11.76, baseY12 + 2.08, northWestWallTopY, 0, wallT, ['+z']);
  addBoardedBarnDoor(groundGroup, 10.44, baseY12 - 0.01, wallT * 0.5, 2.64, 2.1, true, courtyardDoorMat);

  // East Pier of Garage up to Step #1 at u = 12.07m
  addOutbuildingBrickWall(groundGroup, 11.76, uGarageEnd, baseY12 - 0.12, northWestWallTopY, 0, wallT, ['+z']);

  // Level 1 Pitched Pantile Roof over GYM & Garage (u = 0.00m..12.07m)
  addPitchedOutbuildingRoofSection(
    uGymStart,
    uGarageEnd,
    vWestRangeNorth,
    vWestRangeSouth,
    baseY0,
    baseY12,
    westRangeWallH,
    westRangeRidgeH,
    pantileRoofMat,
    true,
    false
  );

  // =========================================================================
  // 2. STEP #1 -> LEVEL 2 (`STORE`: u = 12.07m..14.96m + `BARN`: u = 14.96m..23.22m)
  //    AND STEP #2 -> LEVEL 3 (`2-STOREY STABLE` AT THE END: u = 23.22m..29.05m)
  //    - Issue #1 ("Look again, stable at the end has a slightly higher roof, there are 2 steps" at `[2.033, 2.448, 14.035]`):
  //      * Step #1 at `u = 12.07m`: Roof and upper walls step up from the single-storey `GYM + Garage`
  //        (`westRangeWallH = 2.42m, westRangeRidgeH = 3.92m`) to the mid-height `Store + Barn` range
  //        (`barnUpperEaveH = 3.24m, barnRidgeH = 4.84m`).
  //      * Step #2 at `u = 23.22m`: Roof and upper walls step up AGAIN at `u = 23.22m` to the taller
  //        `2-Storey Stable` at the East end (`stableUpperEaveH = 3.88m, stableRidgeH = 5.58m`,
  //        `+0.64m` higher eave and `+0.74m` higher ridge than the Barn!).
  // =========================================================================
  const uStoreStart = uGarageEnd; // 12.07m (Step #1!)
  const uBarnStart = uStoreEnd; // 14.96m
  const uBarnEnd = 23.22; // 14.96m + 0.24m wall + 8.02m Barn (Step #2!)
  const uStableStart = uBarnEnd; // 23.22m
  const uStableEnd = 29.05; // 23.22m + 5.55m Stable + 0.28m East Gable wall
  const vEastRangeNorth = 0.14;
  const vEastRangeSouth = 5.55; // 0.28m North + 4.85m..4.95m internal + 0.28m South
  const eastRangeGroundWallH = 2.24;
  const barnUpperEaveH = 3.24; // Level 2 (Store + Barn) eave height (Step #1 up from 2.42m)
  const barnRidgeH = 4.84; // Level 2 (Store + Barn) ridge height (Step #1 up from 3.92m)
  const stableUpperEaveH = 3.88; // Level 3 (2-Storey Stable at East end) eave height (Step #2 up +0.64m!)
  const stableRidgeH = 5.58; // Level 3 (2-Storey Stable at East end) ridge height (Step #2 up +0.74m!)

  const baseYBarnStart = getBaseYAtU(uBarnStart); // -0.39m
  const baseYBarnEnd = getBaseYAtU(uBarnEnd); // -0.26m
  const baseYStableEnd = getBaseYAtU(uStableEnd); // -0.18m
  const baseYBarnMid = (baseYBarnStart + baseYBarnEnd) * 0.5;
  const baseYStableMid = (baseYBarnEnd + baseYStableEnd) * 0.5;
  const eastRangeGroundTopY = baseYStableMid + eastRangeGroundWallH;

  // Store, Barn & Stable Ground Floor Slabs
  const storeFloor = new THREE.Mesh(
    new THREE.BoxGeometry(2.65, 0.12, 4.85),
    barnFloorMat
  );
  storeFloor.position.set(
    uStoreStart + 0.24 + 2.65 * 0.5,
    (baseY12 + baseYStoreEnd) * 0.5 - 0.05,
    vEastRangeNorth + wallT + 4.85 * 0.5
  );
  storeFloor.receiveShadow = true;
  groundGroup.add(storeFloor);

  const barnFloor = new THREE.Mesh(
    new THREE.BoxGeometry(8.02, 0.12, 4.85),
    barnFloorMat
  );
  barnFloor.position.set(
    uBarnStart + 0.24 + 8.02 * 0.5,
    baseYBarnMid - 0.05,
    vEastRangeNorth + wallT + 4.85 * 0.5
  );
  barnFloor.receiveShadow = true;
  groundGroup.add(barnFloor);

  const stableFloor = new THREE.Mesh(
    new THREE.BoxGeometry(5.55, 0.12, 4.85),
    barnFloorMat
  );
  stableFloor.position.set(
    uStableStart + 5.55 * 0.5,
    baseYStableMid - 0.05,
    vEastRangeNorth + wallT + 4.85 * 0.5
  );
  stableFloor.receiveShadow = true;
  groundGroup.add(stableFloor);

  // Internal Ground-Floor Cross-Walls at u = 12.07m (Garage/Store Step #1), u = 14.96m (Store/Barn), and u = 23.02m..23.22m (Barn/Stable Step #2)
  addOutbuildingBrickWall(
    groundGroup,
    uStoreStart,
    uStoreStart + 0.24,
    baseY12 - 0.12,
    eastRangeGroundTopY,
    vEastRangeNorth,
    vEastRangeSouth,
    ['+x', '-x']
  );
  addOutbuildingBrickWall(
    groundGroup,
    uBarnStart,
    uBarnStart + 0.24,
    baseYBarnStart - 0.12,
    eastRangeGroundTopY,
    vEastRangeNorth + wallT,
    vEastRangeSouth - wallT,
    ['+x', '-x']
  );
  // Keep the Barn/Stable partition strictly between the North and South exterior walls (`vEastRangeNorth + wallT` to `vEastRangeSouth - wallT`)
  // so it NEVER pokes through or disrupts the flush North Courtyard Brick Wall (`Issue #4: "Wall messed up"`)!
  addOutbuildingBrickWall(
    groundGroup,
    uBarnEnd - partT,
    uBarnEnd,
    baseYBarnEnd - 0.12,
    eastRangeGroundTopY,
    vEastRangeNorth + wallT,
    vEastRangeSouth - wallT,
    ['+x', '-x']
  );

  // Continuous South Garden Wall of Store, Barn & Stable (Ground Floor: u = 12.07m..29.05m) + Exterior South Casement Windows (Issue #9!)
  addOutbuildingBrickWall(
    groundGroup,
    uStoreStart,
    uStableEnd,
    baseY12 - 0.12,
    eastRangeGroundTopY,
    vEastRangeSouth - wallT,
    vEastRangeSouth,
    ['-z']
  );
  for (const uSouthWin of [17.65, 21.15, 24.85, 27.35]) {
    addOutbuildingWindow(
      groundGroup,
      uSouthWin,
      baseYBarnMid + 1.34,
      vEastRangeSouth - wallT * 0.5,
      0.96,
      1.05
    );
  }

  // Continuous Flush Reclaimed Red-Brick North Courtyard Wall of Store, Barn & 2-Storey Stable
  // (Ground Floor: v = 0.14m..0.42m, u = 12.07m..29.05m — Issue #4 & Issue #9!)
  // - Store Door at u = 12.85m..13.75m + Store Window at u = 14.32m (Photo 5 center)
  // - Barn Door at u = 15.85m..16.85m (Floorplan)
  // - Three Barn Ground-Floor Casement Windows at u = 18.25m, u = 20.25m, and u = 22.15m (Issue #9!)
  // - Two Stable Ground-Floor Casement Windows at u = 24.45m and u = 25.95m & Dark Timber Stable Door at u = 27.15m..28.05m
  addOutbuildingBrickWall(
    groundGroup,
    uStoreStart,
    12.85,
    baseY12 - 0.12,
    eastRangeGroundTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z']
  );
  addOutbuildingBrickWall(
    groundGroup,
    12.85,
    13.75,
    baseYStoreEnd + 2.02,
    eastRangeGroundTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z']
  );
  addBoardedBarnDoor(
    groundGroup,
    13.3,
    baseYStoreEnd,
    vEastRangeNorth + wallT * 0.5,
    0.9,
    2.02,
    false,
    courtyardDoorMat
  );
  addOutbuildingBrickWall(
    groundGroup,
    13.75,
    15.85,
    baseYStoreEnd - 0.12,
    eastRangeGroundTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z']
  );
  addOutbuildingWindow(
    groundGroup,
    14.36,
    baseYStoreEnd + 1.34,
    vEastRangeNorth + wallT * 0.5,
    0.68,
    0.82
  );

  addOutbuildingBrickWall(
    groundGroup,
    15.85,
    16.85,
    baseYBarnMid + 2.02,
    eastRangeGroundTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z']
  );
  addBoardedBarnDoor(
    groundGroup,
    16.35,
    baseYBarnMid,
    vEastRangeNorth + wallT * 0.5,
    1.0,
    2.02,
    false,
    darkBarnDoorMat
  );

  // Continuous flush red-brick wall from Barn (u = 16.85m) across the Stable boundary (u = 23.22m) to the Stable door (u = 27.15m)!
  addOutbuildingBrickWall(
    groundGroup,
    16.85,
    27.15,
    baseYBarnMid - 0.12,
    eastRangeGroundTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z']
  );
  // 3 Barn North Courtyard Casement Windows (`u = 18.25m, 20.25m, 22.15m` — Issue #9!)
  for (const uBarnWin of [18.25, 20.25, 22.15]) {
    addOutbuildingWindow(
      groundGroup,
      uBarnWin,
      baseYBarnMid + 1.32,
      vEastRangeNorth + wallT * 0.5,
      0.92,
      1.05
    );
  }
  // 2 Stable North Courtyard Casement Windows (`u = 24.45m, 25.95m` — Issue #9!)
  for (const uStableWin of [24.45, 25.95]) {
    addOutbuildingWindow(
      groundGroup,
      uStableWin,
      baseYStableMid + 1.36,
      vEastRangeNorth + wallT * 0.5,
      0.92,
      1.05
    );
  }

  // Dark-stained Stable Door at u = 27.15m..28.05m (Photo 10 mid-left & Floorplan)
  addOutbuildingBrickWall(
    groundGroup,
    27.15,
    28.05,
    baseYStableEnd + 2.04,
    eastRangeGroundTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z']
  );
  addBoardedBarnDoor(
    groundGroup,
    27.6,
    baseYStableEnd,
    vEastRangeNorth + wallT * 0.5,
    0.9,
    2.04,
    false,
    darkBarnDoorMat
  );

  addOutbuildingBrickWall(
    groundGroup,
    28.05,
    uStableEnd - wallT,
    baseYStableEnd - 0.12,
    eastRangeGroundTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z']
  );

  // East Gable End of 2-Storey Stable (Ground Floor: u = 28.77m..29.05m, v = 0.14m..5.55m) with Large Gable Window
  const vEastRangeMid = (vEastRangeNorth + vEastRangeSouth) * 0.5;
  addOutbuildingBrickWall(
    groundGroup,
    uStableEnd - wallT,
    uStableEnd,
    baseYStableEnd - 0.12,
    eastRangeGroundTopY,
    vEastRangeNorth,
    vEastRangeMid - 0.62,
    ['-x']
  );
  addOutbuildingBrickWall(
    groundGroup,
    uStableEnd - wallT,
    uStableEnd,
    baseYStableEnd - 0.12,
    baseYStableEnd + 0.72,
    vEastRangeMid - 0.62,
    vEastRangeMid + 0.62,
    ['-x']
  );
  addOutbuildingBrickWall(
    groundGroup,
    uStableEnd - wallT,
    uStableEnd,
    baseYStableEnd + 1.98,
    eastRangeGroundTopY,
    vEastRangeMid - 0.62,
    vEastRangeMid + 0.62,
    ['-x']
  );
  addOutbuildingBrickWall(
    groundGroup,
    uStableEnd - wallT,
    uStableEnd,
    baseYStableEnd - 0.12,
    eastRangeGroundTopY,
    vEastRangeMid + 0.62,
    vEastRangeSouth,
    ['-x']
  );
  addOutbuildingWindow(
    groundGroup,
    uStableEnd - wallT * 0.5,
    baseYStableEnd + 1.35,
    vEastRangeMid,
    1.24,
    1.26,
    true
  );

  // Cast-iron rainwater downpipes at Step #1 (`u = 12.14m`, Photo 5 center) and Step #2 (`u = 23.28m`)
  const step1Downpipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.034, 0.034, barnUpperEaveH - 0.1, 12),
    castIronMat
  );
  step1Downpipe.position.set(
    uStoreStart + 0.06,
    baseY12 + (barnUpperEaveH - 0.1) * 0.5,
    vEastRangeNorth - 0.04
  );
  groundGroup.add(step1Downpipe);

  const step2Downpipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.034, 0.034, stableUpperEaveH - 0.1, 12),
    castIronMat
  );
  step2Downpipe.position.set(
    uStableStart + 0.06,
    baseYBarnEnd + (stableUpperEaveH - 0.1) * 0.5,
    vEastRangeNorth - 0.04
  );
  groundGroup.add(step2Downpipe);

  // Wall-clinging Climbing Ivy on the North Courtyard Brick Wall of the Store & Barn (u = 14.5m..17.6m, clinging flat to the wall)
  addWallClimbingIvyCluster(
    groundGroup,
    16.15,
    baseYBarnStart + 0.35,
    vEastRangeNorth - 0.02,
    'z',
    -1,
    3.2,
    barnUpperEaveH - 0.45,
    409
  );

  // =========================================================================
  // 3. OUTBUILDING FIRST FLOOR OVER BARN & 2-STOREY STABLE (Issue #1, Issue #2 & Issue #9!)
  //    - Level 2 Upper Walls (`Store + Barn`: u = 12.07m..23.22m, y = eastRangeUpperFloorY..barnUpperTopY)
  //    - Level 3 Stepped-Up Upper Walls (`2-Storey Stable`: u = 23.22m..29.05m, y = eastRangeUpperFloorY..stableUpperTopY, +0.64m higher!)
  //    - West First-Floor Room (`4.30m x 5.10m` = `14'1" x 16'9"`): u = 18.68m..23.02m (over East half of Barn)
  //      with SE corner `DN` staircase down into the Barn and 3 central `UP` steps into the East room
  //    - East First-Floor Room (`5.60m x 5.10m` = `18'4" x 16'9"`): u = 23.22m..28.77m (directly over the 2-Storey Stable!)
  // =========================================================================
  const eastRangeUpperFloorY = eastRangeGroundTopY;
  const barnUpperTopY = baseYBarnMid + barnUpperEaveH;
  const stableUpperTopY = baseYStableMid + stableUpperEaveH;

  // West First-Floor Room Timber Slab (`4.30m x 4.85m`, u = 18.68m..23.02m)
  const westUpperRoomSlab = new THREE.Mesh(
    new THREE.BoxGeometry(4.34, 0.14, 4.85),
    oakFloorMat
  );
  westUpperRoomSlab.name = 'outbuildings.firstFloor.westRoomSlab';
  westUpperRoomSlab.position.set(
    18.68 + 4.34 * 0.5,
    eastRangeUpperFloorY - 0.04,
    vEastRangeNorth + wallT + 4.85 * 0.5
  );
  westUpperRoomSlab.receiveShadow = true;
  firstFloorGroup.add(westUpperRoomSlab);

  // East First-Floor Room Timber Slab (`5.55m x 4.85m`, u = 23.22m..28.77m, stepped up +0.24m via the 3 `UP` steps over the Stable!)
  const stableUpperFloorY = eastRangeUpperFloorY + 0.24;
  const eastUpperRoomSlab = new THREE.Mesh(
    new THREE.BoxGeometry(5.55, 0.14, 4.85),
    oakFloorMat
  );
  eastUpperRoomSlab.name = 'outbuildings.firstFloor.stableRoomSlab';
  eastUpperRoomSlab.position.set(
    uStableStart + 5.55 * 0.5,
    stableUpperFloorY - 0.04,
    vEastRangeNorth + wallT + 4.85 * 0.5
  );
  eastUpperRoomSlab.receiveShadow = true;
  firstFloorGroup.add(eastUpperRoomSlab);

  // STEP #1 Upper Exterior Brick Walls of Level 2 (`Store + Barn`: u = 12.07m..23.22m, y = eastRangeUpperFloorY..barnUpperTopY)
  addOutbuildingBrickWall(
    firstFloorGroup,
    uStoreStart,
    uBarnEnd,
    eastRangeUpperFloorY,
    barnUpperTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z']
  );
  addOutbuildingBrickWall(
    firstFloorGroup,
    uStoreStart,
    uBarnEnd,
    eastRangeUpperFloorY,
    barnUpperTopY,
    vEastRangeSouth - wallT,
    vEastRangeSouth,
    ['-z']
  );
  // Step #1 West Upper Gable Wall at u = 12.07m
  addOutbuildingBrickWall(
    firstFloorGroup,
    uStoreStart,
    uStoreStart + 0.24,
    eastRangeUpperFloorY,
    barnUpperTopY,
    vEastRangeNorth + wallT,
    vEastRangeSouth - wallT,
    ['+x']
  );

  // STEP #2 Upper Exterior Brick Walls of Level 3 (`2-Storey Stable`: u = 23.22m..29.05m, y = eastRangeUpperFloorY..stableUpperTopY, +0.64m higher — Issue #1!)
  addOutbuildingBrickWall(
    firstFloorGroup,
    uStableStart,
    uStableEnd,
    eastRangeUpperFloorY,
    stableUpperTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z']
  );
  addOutbuildingBrickWall(
    firstFloorGroup,
    uStableStart,
    uStableEnd,
    eastRangeUpperFloorY,
    stableUpperTopY,
    vEastRangeSouth - wallT,
    vEastRangeSouth,
    ['-z']
  );

  // Internal West Partition of the 4.30m First-Floor Room at u = 18.50m..18.68m
  addOutbuildingBrickWall(
    firstFloorGroup,
    18.5,
    18.68,
    eastRangeUpperFloorY,
    barnUpperTopY,
    vEastRangeNorth + wallT,
    vEastRangeSouth - wallT,
    ['+x', '-x']
  );
  // East Upper Gable Wall of the 2-Storey Stable at u = 28.77m..29.05m
  addOutbuildingBrickWall(
    firstFloorGroup,
    uStableEnd - wallT,
    uStableEnd,
    eastRangeUpperFloorY,
    stableUpperTopY,
    vEastRangeNorth + wallT,
    vEastRangeSouth - wallT,
    ['-x']
  );

  // Internal 1st-Floor Partition & Step-Up Wall between the 4.30m x 5.10m Barn Loft Room and the taller 5.60m x 5.10m Stable Upper Room
  // (at u = 23.02m..23.22m with central `UP` doorway opening at v = 2.40m..3.30m — Floorplan Image 9!)
  addOutbuildingBrickWall(
    firstFloorGroup,
    uBarnEnd - partT,
    uBarnEnd,
    eastRangeUpperFloorY,
    stableUpperTopY,
    vEastRangeNorth + wallT,
    2.4,
    ['+x', '-x']
  );
  addOutbuildingBrickWall(
    firstFloorGroup,
    uBarnEnd - partT,
    uBarnEnd,
    eastRangeUpperFloorY,
    stableUpperTopY,
    3.3,
    vEastRangeSouth - wallT,
    ['+x', '-x']
  );
  // Upper lintel header above the central 1st-floor doorway opening where the Stable wall steps up above the Barn!
  addOutbuildingBrickWall(
    firstFloorGroup,
    uBarnEnd - partT,
    uBarnEnd,
    barnUpperTopY,
    stableUpperTopY,
    2.4,
    3.3,
    ['+x', '-x']
  );

  // 3 Central `UP` steps through the 1st-floor partition opening (u = 22.62m..23.22m, v = 2.40m..3.30m)
  // & SE Corner `DN` Staircase in the 4.30m x 5.10m room (u = 22.15m, v = 3.1m..5.1m — Floorplan Image 9!)
  for (let s = 0; s < 3; s++) {
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.08 * (s + 1), 0.88),
      oakFloorMat
    );
    step.position.set(22.66 + s * 0.22, eastRangeUpperFloorY + 0.04 * (s + 1), 2.85);
    firstFloorGroup.add(step);
  }
  for (let s = 0; s < 10; s++) {
    const tread = new THREE.Mesh(
      new THREE.BoxGeometry(0.86, 0.04, 0.22),
      oakFloorMat
    );
    tread.position.set(22.35, eastRangeUpperFloorY - s * 0.2, 5.05 - s * 0.21);
    firstFloorGroup.add(tread);
  }

  // First-Floor Windows on the North Courtyard Wall, East Gable Wall & South Wall (Issue #9!):
  // 1. Two Upper Barn Hayloft / 1st-Floor Windows on the North Courtyard Wall at u = 17.65m and u = 20.85m (Photo 5 center)
  for (const uBarnUpperWin of [17.65, 20.85]) {
    addOutbuildingWindow(
      firstFloorGroup,
      uBarnUpperWin,
      eastRangeUpperFloorY + 0.48,
      vEastRangeNorth + wallT * 0.5,
      0.78,
      0.72
    );
  }
  // 2. Two First-Floor Casement Windows of the taller 2-Storey Stable on the North Courtyard Wall at u = 24.85m and u = 27.15m (Photo 10 top-left!)
  for (const uStableUpperWin of [24.85, 27.15]) {
    addOutbuildingWindow(
      firstFloorGroup,
      uStableUpperWin,
      stableUpperFloorY + 0.72,
      vEastRangeNorth + wallT * 0.5,
      0.88,
      0.84
    );
  }
  // 3. East Gable 1st-Floor Window of the 2-Storey Stable (shown on `Outbuilding First Floor` plan in Image 9!)
  addOutbuildingWindow(
    firstFloorGroup,
    uStableEnd - wallT * 0.5,
    stableUpperFloorY + 0.72,
    vEastRangeMid,
    0.96,
    0.96,
    true
  );
  // 4. First-Floor South Exterior Windows on the Barn (`u = 20.85m`) and 2-Storey Stable (`u = 24.85m, 27.15m`)
  addOutbuildingWindow(
    firstFloorGroup,
    20.85,
    eastRangeUpperFloorY + 0.48,
    vEastRangeSouth - wallT * 0.5,
    0.78,
    0.72
  );
  for (const uStableSouthUpperWin of [24.85, 27.15]) {
    addOutbuildingWindow(
      firstFloorGroup,
      uStableSouthUpperWin,
      stableUpperFloorY + 0.72,
      vEastRangeSouth - wallT * 0.5,
      0.88,
      0.84
    );
  }

  // STEP #1 Roof -> Level 2 Pitched Roof over Store & Barn (`u = 12.07m..23.22m`, weathered clay pantile, `barnUpperEaveH = 3.24m, barnRidgeH = 4.84m`)
  addPitchedOutbuildingRoofSection(
    uStoreStart,
    uBarnEnd,
    vEastRangeNorth,
    vEastRangeSouth,
    baseY12,
    baseYBarnEnd,
    barnUpperEaveH,
    barnRidgeH,
    pantileRoofMat,
    true,
    false,
    westRangeWallH - 0.15,
    barnUpperEaveH
  );

  // STEP #2 Roof -> Level 3 Higher Pitched Roof over the 2-Storey Stable at the East end (`u = 23.22m..29.05m`, natural Welsh slate, `stableUpperEaveH = 3.88m, stableRidgeH = 5.58m` — Issue #1!)
  addPitchedOutbuildingRoofSection(
    uStableStart,
    uStableEnd,
    vEastRangeNorth,
    vEastRangeSouth,
    baseYBarnEnd,
    baseYStableEnd,
    stableUpperEaveH,
    stableRidgeH,
    welshSlateMat,
    true,
    true,
    barnUpperEaveH - 0.12,
    stableUpperEaveH
  );
}
