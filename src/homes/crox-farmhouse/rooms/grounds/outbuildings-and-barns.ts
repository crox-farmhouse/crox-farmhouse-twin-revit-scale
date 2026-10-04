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
  return OUTBUILDING_ORIGIN_Z - u * OUTBUILDING_SIN;
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
  // Issue #4 ("Make sure all of these doors open" at `[-6.474, 0.65, 14.893]`):
  // Every door leaf is mounted on a hinged pivotGroup at its jamb and registered with `ctx.interactions.registerHingedDoor`.
  const addBoardedBarnDoor = (
    parent: THREE.Object3D,
    uCenter: number,
    yBase: number,
    vWallCenter: number,
    width: number,
    height: number,
    isDoubleLeaf: boolean,
    mat: THREE.Material = courtyardDoorMat,
    doorLabel: string = 'Outbuilding Door'
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

    // Hinged door leaf panel(s) with vertical boarding grooves & black wrought-iron strap hinges
    const numLeaves = isDoubleLeaf ? 2 : 1;
    const leafW = (width - (isDoubleLeaf ? 0.016 : 0)) / numLeaves;
    for (let l = 0; l < numLeaves; l++) {
      const hingeSide = isDoubleLeaf ? (l === 0 ? -1 : 1) : -1;
      const lx = isDoubleLeaf ? (l === 0 ? -leafW * 0.5 - 0.004 : leafW * 0.5 + 0.004) : 0;
      const hingePivotX = lx + hingeSide * (leafW * 0.5);
      const leafOffsetX = -hingeSide * (leafW * 0.5);

      const leafPivot = new THREE.Group();
      leafPivot.name = `outbuildings.doorPivot.${doorLabel.replace(/\s+/g, '')}.${l + 1}`;
      leafPivot.position.set(hingePivotX, 0, -0.04);
      doorGroup.add(leafPivot);

      const leafPanel = new THREE.Mesh(
        new THREE.BoxGeometry(leafW, height - 0.02, 0.052),
        mat
      );
      leafPanel.position.set(leafOffsetX, height * 0.5 + 0.01, 0);
      leafPanel.castShadow = true;
      leafPanel.receiveShadow = true;
      leafPivot.add(leafPanel);

      // Vertical tongue-and-groove shadow battens along the front (-v) face
      const numPlanks = Math.max(4, Math.round(leafW / 0.14));
      for (let p = 1; p < numPlanks; p++) {
        const px = leafOffsetX - leafW * 0.5 + (p / numPlanks) * leafW;
        const groove = new THREE.Mesh(
          new THREE.BoxGeometry(0.012, height - 0.06, 0.058),
          courtyardDoorRecessMat
        );
        groove.position.set(px, height * 0.5 + 0.01, 0);
        leafPivot.add(groove);
      }

      // Upper and lower black wrought-iron strap hinges on the courtyard (-v) face
      const strapSpan = Math.min(0.36, leafW * 0.45);
      const strapCenterX = -hingeSide * (strapSpan * 0.5 + 0.02);
      for (const hy of [height * 0.24, height * 0.78]) {
        const strap = new THREE.Mesh(
          new THREE.BoxGeometry(strapSpan, 0.036, 0.014),
          castIronMat
        );
        strap.position.set(strapCenterX, hy, -0.03);
        leafPivot.add(strap);
      }

      // Black wrought-iron ring latch on the leading stile of the door leaf
      if (!isDoubleLeaf || l === 1) {
        const latch = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.14, 0.025), castIronMat);
        latch.position.set(
          leafOffsetX - hingeSide * (leafW * 0.5 - 0.08),
          height * 0.48,
          -0.032
        );
        leafPivot.add(latch);
      }

      ctx.interactions.registerHingedDoor(
        doorGroup,
        leafPivot,
        new THREE.Vector3(0, 0, 0),
        'y',
        -hingeSide * Math.PI * 0.48
      );
    }

    parent.add(doorGroup);
  };

  /**
   * Issue #6 ("This is glass" at `[-18.173, 0.287, 15.705]`) &
   * Issue #4 ("Make sure all of these doors open"):
   * Builds a full-height 4-bay glazed gym screen & interactive double French glass doors (`outbuildings.gym.northGlazedScreen`)
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

    // 4 full-height glazed bays (2 fixed side lights + 2 central hinged French glass doors)
    const numBays = 4;
    const bayW = width / numBays;
    const glassH = height - 0.11;
    const glassCenterY = height * 0.5 + 0.02;

    for (let b = 0; b < numBays; b++) {
      const bx = -width * 0.5 + (b + 0.5) * bayW;
      const isCentralDoor = b === 1 || b === 2;
      const hingeSide = b === 1 ? -1 : 1;

      const bayContainer = new THREE.Group();
      let localX = 0;
      if (isCentralDoor) {
        const pivotX = bx + hingeSide * (bayW * 0.5);
        localX = -hingeSide * (bayW * 0.5);
        bayContainer.name = `outbuildings.gym.northGlazedScreen.doorPivot.${b}`;
        bayContainer.position.set(pivotX, 0, -0.02);
      } else {
        bayContainer.position.set(bx, 0, -0.02);
      }
      screenGroup.add(bayContainer);

      // Top and bottom door/sidelight frame rails
      const topRail = new THREE.Mesh(
        new THREE.BoxGeometry(bayW - 0.01, 0.055, 0.058),
        courtyardDoorMat
      );
      topRail.position.set(localX, height - 0.028, 0);
      bayContainer.add(topRail);

      const botRail = new THREE.Mesh(
        new THREE.BoxGeometry(bayW - 0.01, 0.075, 0.058),
        courtyardDoorMat
      );
      botRail.position.set(localX, 0.06, 0);
      bayContainer.add(botRail);

      // Left and right vertical stiles of each bay
      for (const s of [-1, 1]) {
        const stile = new THREE.Mesh(
          new THREE.BoxGeometry(0.042, height - 0.03, 0.058),
          courtyardDoorMat
        );
        stile.position.set(localX + s * (bayW * 0.5 - 0.024), height * 0.5 + 0.01, 0);
        bayContainer.add(stile);
      }

      // Slim horizontal glazing bars dividing each tall glass bay into 3 lights
      for (const ty of [height * 0.36, height * 0.68]) {
        const transom = new THREE.Mesh(
          new THREE.BoxGeometry(bayW - 0.07, 0.024, 0.042),
          courtyardDoorMat
        );
        transom.position.set(localX, ty, 0);
        bayContainer.add(transom);
      }

      // Full-height clear architectural glass pane (`windowGlassMat` — Issue #6: "This is glass")
      const glassPane = new THREE.Mesh(
        new THREE.BoxGeometry(bayW - 0.08, glassH, 0.024),
        windowGlassMat
      );
      glassPane.name = `outbuildings.gym.northGlazedScreen.glass.${b + 1}`;
      glassPane.position.set(localX, glassCenterY, 0);
      bayContainer.add(glassPane);

      // Black lever handle on the central double glass doors & register hinged door AFTER meshes are added
      if (isCentralDoor) {
        const handle = new THREE.Mesh(
          new THREE.BoxGeometry(0.028, 0.14, 0.045),
          castIronMat
        );
        handle.position.set(
          localX - hingeSide * (bayW * 0.5 - 0.042),
          height * 0.48,
          -0.032
        );
        bayContainer.add(handle);

        ctx.interactions.registerHingedDoor(
          screenGroup,
          bayContainer,
          new THREE.Vector3(0, 0, 0),
          'y',
          -hingeSide * Math.PI * 0.48
        );
      }
    }

    parent.add(screenGroup);
  };

  // Helper to add a multi-pane casement window in an Outbuilding wall
  // (Issue #8: True cutout opening in the brick wall with full-depth timber reveal frame and thin clear glass pane so no bricks appear inside the window!)
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
      new THREE.BoxGeometry(width + 0.1, 0.058, wallT + 0.08),
      stoneSillMat
    );
    sill.position.set(0, -height * 0.5 - 0.024, 0);
    sill.castShadow = true;
    sill.receiveShadow = true;
    winGroup.add(sill);

    const lintel = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.08, 0.065, wallT + 0.04),
      stoneSillMat
    );
    lintel.position.set(0, height * 0.5 + 0.028, 0);
    winGroup.add(lintel);

    // Outer white-painted timber reveal box frame lining the full wall thickness
    const frameDepth = wallT + 0.032;
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

    // Center vertical mullion & horizontal transom (4-pane cottage casement) recessed inside the reveal
    const barDepth = 0.068;
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

    // Clear architectural glazing sheet set cleanly inside the open window cutout (no bricks inside!)
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.09, height - 0.09, 0.018),
      windowGlassMat
    );
    winGroup.add(glass);

    parent.add(winGroup);
  };

  interface OutbuildingWallWindowSpec {
    readonly uCenter: number;
    readonly yCenter: number;
    readonly width: number;
    readonly height: number;
  }

  // Helper that builds a u-aligned brick wall with exact rectangular openings cut out for each window
  // so solid brick never appears behind transparent window glass (Issue #8).
  const addOutbuildingBrickWallWithWindows = (
    parent: THREE.Object3D,
    uMin: number,
    uMax: number,
    yMin: number,
    yMax: number,
    vMin: number,
    vMax: number,
    plasterFaces: ReadonlyArray<'+x' | '-x' | '+z' | '-z'>,
    windows: ReadonlyArray<OutbuildingWallWindowSpec>
  ): void => {
    const sorted = [...windows].sort((a, b) => a.uCenter - b.uCenter);
    const vCenter = (vMin + vMax) * 0.5;
    let cursorU = uMin;

    for (const win of sorted) {
      const winUMin = win.uCenter - win.width * 0.5;
      const winUMax = win.uCenter + win.width * 0.5;
      const winYMin = win.yCenter - win.height * 0.5;
      const winYMax = win.yCenter + win.height * 0.5;

      if (winUMin > cursorU + 0.01) {
        addOutbuildingBrickWall(
          parent,
          cursorU,
          winUMin,
          yMin,
          yMax,
          vMin,
          vMax,
          plasterFaces
        );
      }
      if (winYMin > yMin + 0.01) {
        addOutbuildingBrickWall(
          parent,
          winUMin,
          winUMax,
          yMin,
          winYMin,
          vMin,
          vMax,
          plasterFaces
        );
      }
      if (yMax > winYMax + 0.01) {
        addOutbuildingBrickWall(
          parent,
          winUMin,
          winUMax,
          winYMax,
          yMax,
          vMin,
          vMax,
          plasterFaces
        );
      }

      addOutbuildingWindow(
        parent,
        win.uCenter,
        win.yCenter,
        vCenter,
        win.width,
        win.height,
        false
      );

      cursorU = winUMax;
    }

    if (uMax > cursorU + 0.01) {
      addOutbuildingBrickWall(
        parent,
        cursorU,
        uMax,
        yMin,
        yMax,
        vMin,
        vMax,
        plasterFaces
      );
    }
  };

  // Helper to build a double-pitched gable roof + brick gable triangles + eaves gutters
  // Issue #9 ("Lots of weird mesh issues here" at `[-10.417, 0.2, 15.282]`):
  // Explicit `westOverhangU` and `eastOverhangU` prevent lower roof sections from poking through
  // step-up gable walls at `u = 12.07m` and `u = 23.22m`.
  const addPitchedOutbuildingRoofSection = (
    uMin: number,
    uMax: number,
    vMin: number,
    vMax: number,
    datumY: number,
    eaveRelH: number,
    ridgeRelH: number,
    roofMat: THREE.Material,
    addWestBrickGable: boolean,
    addEastBrickGable: boolean,
    westGableFloorRelH: number = eaveRelH,
    eastGableFloorRelH: number = eaveRelH,
    westOverhangU: number = 0.12,
    eastOverhangU: number = 0.12
  ): void => {
    const vMid = (vMin + vMax) * 0.5;
    const halfSpanV = (vMax - vMin) * 0.5 + 0.2; // 0.20m eaves overhang
    const slopeRise = ridgeRelH - eaveRelH;
    const slopeLenV = Math.hypot(halfSpanV, slopeRise);
    const pitchAngle = Math.atan2(slopeRise, halfSpanV);
    const roofUMin = uMin - westOverhangU;
    const roofUMax = uMax + eastOverhangU;
    const lenU = roofUMax - roofUMin;
    const uMid = (roofUMin + roofUMax) * 0.5;

    const sectionRoofGroup = new THREE.Group();
    sectionRoofGroup.position.set(uMid, datumY, vMid);

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

    // Brick gable end triangles at uMin and/or uMax (inset by 0.01m in V and 0.02m at ridge so they never z-fight with roof slopes)
    const buildGableEndTriangle = (uWallMin: number, startRelH: number): void => {
      const shape = new THREE.Shape();
      const halfWallV = (vMax - vMin) * 0.5 - 0.01;
      const peakRelH = ridgeRelH - 0.02;
      if (startRelH < eaveRelH) {
        shape.moveTo(-halfWallV, startRelH);
        shape.lineTo(halfWallV, startRelH);
        shape.lineTo(halfWallV, eaveRelH);
        shape.lineTo(0, peakRelH);
        shape.lineTo(-halfWallV, eaveRelH);
      } else {
        const frac = (peakRelH - startRelH) / Math.max(0.05, peakRelH - eaveRelH);
        const wAtStart = halfWallV * frac;
        shape.moveTo(-wAtStart, startRelH);
        shape.lineTo(wAtStart, startRelH);
        shape.lineTo(0, peakRelH);
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
        datumY,
        OUTBUILDING_ORIGIN_Z + vMid
      );
      const mesh = new THREE.Mesh(geo, exteriorBrickMat);
      mesh.position.set(uWallMin, datumY, vMid);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      roofGroup.add(mesh);
    };

    if (addWestBrickGable) {
      buildGableEndTriangle(uMin, westGableFloorRelH);
    }
    if (addEastBrickGable) {
      buildGableEndTriangle(uMax - wallT, eastGableFloorRelH);
    }
  };

  // =========================================================================
  // 1. LEVEL 1 — SINGLE-STOREY WEST RANGE (`GYM` + `GARAGE`, u = 0.00m..12.07m)
  //    - Bay 1 (`GYM`: 5.49m x 5.15m, u = 0.00m..5.77m)
  //    - Bay 2 (`Garage`: 6.10m x 5.15m, u = 5.77m..12.07m)
  //    - Issue #7 ("Remove this (its next doors properthy" at `[-21.393, 0.038, 22.611]`):
  //      Removed the South-West boundary wall and garden gate South of the GYM West Gable.
  //    - Issue #8 ("This is just a small window not full height" at `[-22.185, 0.176, 17.79]`):
  //      Replaced the full-height GYM West Gable window with a small cottage casement window (`0.68m x 0.76m`).
  //    - Issue #9 ("Lots of weird mesh issues here" at `[-10.417, 0.2, 15.282]`):
  //      Unified `vNorth = 0.00m`, `vSouth = 5.71m`, and `groundWallTopY = 1.94m` across the entire
  //      Outbuilding Range so there are zero step-in notches, exposed interior plaster edges, or z-fighting walls at `u = 12.07m`!
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
  const westRangeDatumY = -0.48;
  const northWestWallTopY = westRangeDatumY + westRangeWallH; // 1.94m level eave across GYM + Garage

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
  // Issue #8 ("This is just a small window not full height" at `[-22.185, 0.176, 17.79]`):
  // Small cottage casement window (`0.68m` wide along `v = 1.61..2.29m` x `0.76m` high at `y = baseY0 + 1.00..baseY0 + 1.76m`)
  addOutbuildingBrickWall(groundGroup, 0, wallT, baseY0 - 0.14, northWestWallTopY, 0, 1.61, ['+x']);
  addOutbuildingBrickWall(groundGroup, 0, wallT, baseY0 - 0.14, baseY0 + 1.0, 1.61, 2.29, ['+x']);
  addOutbuildingBrickWall(groundGroup, 0, wallT, baseY0 + 1.76, northWestWallTopY, 1.61, 2.29, ['+x']);
  addOutbuildingBrickWall(groundGroup, 0, wallT, baseY0 - 0.14, northWestWallTopY, 2.29, vWestRangeSouth, ['+x']);
  addOutbuildingWindow(groundGroup, wallT * 0.5, baseY0 + 1.38, 1.95, 0.68, 0.76, true);

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

  // South Garden Wall of GYM & Garage (v = 5.43m..5.71m, u = 0.28m..12.07m — solid brick boundary wall per Floorplan)
  addOutbuildingBrickWall(
    groundGroup,
    wallT,
    uGarageEnd,
    baseY0 - 0.14,
    northWestWallTopY,
    vWestRangeSouth - wallT,
    vWestRangeSouth,
    ['-z']
  );

  // Internal Partition Wall between GYM and Garage (u = 5.77m..5.97m) with hinged internal door at v = 1.25m..2.15m (Floorplan Image 9 & Issue #4)
  addOutbuildingBrickWall(groundGroup, uGymEnd, uGymEnd + partT, baseY0, northWestWallTopY, wallT, 1.25, ['+x', '-x']);
  addOutbuildingBrickWall(groundGroup, uGymEnd, uGymEnd + partT, baseY0 + 1.98, northWestWallTopY, 1.25, 2.15, ['+x', '-x']);
  addOutbuildingBrickWall(groundGroup, uGymEnd, uGymEnd + partT, baseY0, northWestWallTopY, 2.15, vWestRangeSouth - wallT, ['+x', '-x']);

  const gymGarageDoorPivot = new THREE.Group();
  gymGarageDoorPivot.name = 'outbuildings.doorPivot.GymGarageInternal';
  gymGarageDoorPivot.position.set(uGymEnd + partT * 0.5, baseY0, 1.25);
  const gymGarageDoorLeaf = new THREE.Mesh(
    new THREE.BoxGeometry(0.044, 1.96, 0.88),
    courtyardDoorMat
  );
  gymGarageDoorLeaf.position.set(0, 0.99, 0.44);
  gymGarageDoorLeaf.castShadow = true;
  gymGarageDoorLeaf.receiveShadow = true;
  gymGarageDoorPivot.add(gymGarageDoorLeaf);
  const gymGarageDoorHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.12, 0.024),
    castIronMat
  );
  gymGarageDoorHandle.position.set(0, 0.96, 0.8);
  gymGarageDoorPivot.add(gymGarageDoorHandle);
  groundGroup.add(gymGarageDoorPivot);
  ctx.interactions.registerHingedDoor(
    groundGroup,
    gymGarageDoorPivot,
    new THREE.Vector3(0, 0, 0),
    'y',
    Math.PI * 0.46
  );

  // North Courtyard Wall of GYM & Garage (v = 0.00m..0.28m, u = 0.28m..12.07m):
  // - Small GYM casement window at u = 1.49m (`0.68m x 0.78m`, clean cutout!)
  // - Full-height 4-bay glazed GYM screen at u = 3.05m..5.45m (`2.40m` wide)
  // - Two wide `2.64m` Double Garage Doors in Garage (`u = 6.08m..8.72m` and `u = 9.12m..11.76m`), 0 windows
  addOutbuildingBrickWallWithWindows(
    groundGroup,
    wallT,
    3.05,
    baseY0 - 0.14,
    northWestWallTopY,
    0,
    wallT,
    ['+z'],
    [{ uCenter: 1.49, yCenter: baseY0 + 1.39, width: 0.68, height: 0.78 }]
  );

  // GYM East wide opening (u = 3.05m..5.45m): Full-height glazed screen & interactive glass doors (Issue #4 & Issue #6!)
  addOutbuildingBrickWall(groundGroup, 3.05, 5.45, baseY0 + 2.1, northWestWallTopY, 0, wallT, ['+z']);
  addGlazedGymCoachScreen(groundGroup, 4.25, baseY0 + 0.02, wallT * 0.5, 2.4, 2.08);

  // Pier between GYM glazed screen and Garage Double Door #1 (u = 5.45m..6.08m)
  addOutbuildingBrickWall(groundGroup, 5.45, 6.08, baseY0 - 0.14, northWestWallTopY, 0, wallT, ['+z']);

  // Garage Double Coach/Garage Door #1 (u = 6.08m..8.72m, width = 2.64m)
  addOutbuildingBrickWall(groundGroup, 6.08, 8.72, baseY12 + 2.08, northWestWallTopY, 0, wallT, ['+z']);
  addBoardedBarnDoor(
    groundGroup,
    7.4,
    baseY12 - 0.03,
    wallT * 0.5,
    2.64,
    2.1,
    true,
    courtyardDoorMat,
    'Garage West Double Door'
  );

  // Central Brick Pier between the two Double Garage Doors (u = 8.72m..9.12m)
  addOutbuildingBrickWall(groundGroup, 8.72, 9.12, baseY12 - 0.14, northWestWallTopY, 0, wallT, ['+z']);

  // Garage Double Coach/Garage Door #2 (u = 9.12m..11.76m, width = 2.64m)
  addOutbuildingBrickWall(groundGroup, 9.12, 11.76, baseY12 + 2.08, northWestWallTopY, 0, wallT, ['+z']);
  addBoardedBarnDoor(
    groundGroup,
    10.44,
    baseY12 - 0.01,
    wallT * 0.5,
    2.64,
    2.1,
    true,
    courtyardDoorMat,
    'Garage East Double Door'
  );

  // East Pier of Garage up to Step #1 at u = 12.07m
  addOutbuildingBrickWall(groundGroup, 11.76, uGarageEnd, baseY12 - 0.14, northWestWallTopY, 0, wallT, ['+z']);

  // Level 1 Pitched Pantile Roof over GYM & Garage (u = 0.00m..12.07m, trimmed flush at East Step #1 wall — Issue #9!)
  addPitchedOutbuildingRoofSection(
    uGymStart,
    uGarageEnd,
    vWestRangeNorth,
    vWestRangeSouth,
    westRangeDatumY,
    westRangeWallH,
    westRangeRidgeH,
    pantileRoofMat,
    true,
    false,
    westRangeWallH,
    westRangeWallH,
    0.14,
    0.0
  );

  // =========================================================================
  // 2. STEP #1 -> LEVEL 2 (`STORE`: u = 12.07m..14.96m + `BARN`: u = 14.96m..23.22m)
  //    AND STEP #2 -> LEVEL 3 (`2-STOREY STABLE` AT THE END: u = 23.22m..29.05m)
  //    - Issue #9 ("Lots of weird mesh issues here" at `[-10.417, 0.2, 15.282]`):
  //      Unified `vEastRangeNorth = 0.00m`, `vEastRangeSouth = 5.71m`, and `eastRangeGroundTopY = 1.94m`
  //      with the West Range so the North & South exterior brick walls are 100% flush across Step #1 (`u = 12.07m`),
  //      and all internal cross-walls span strictly `v = 0.28m..5.43m` (`vEastRangeNorth + wallT` to `vEastRangeSouth - wallT`)!
  // =========================================================================
  const uStoreStart = uGarageEnd; // 12.07m (Step #1!)
  const uBarnStart = uStoreEnd; // 14.96m
  const uBarnEnd = 23.22; // 14.96m + 0.24m wall + 8.02m Barn (Step #2!)
  const uStableStart = uBarnEnd; // 23.22m
  const uStableEnd = 29.05; // 23.22m + 5.55m Stable + 0.28m East Gable wall
  const vEastRangeNorth = 0.0;
  const vEastRangeSouth = 5.71; // Unified flush with West Range (`0.28m` North + `5.15m` internal + `0.28m` South — Issue #9!)
  const eastRangeInternalV = vEastRangeSouth - vEastRangeNorth - wallT * 2; // 5.15m
  const eastRangeGroundWallH = 2.26;
  const barnUpperEaveH = 3.24; // Level 2 (Store + Barn) eave height above barnDatumY
  const barnRidgeH = 4.84; // Level 2 (Store + Barn) ridge height above barnDatumY
  const stableUpperEaveH = 3.78; // Level 3 (2-Storey Stable) eave height above stableDatumY (+0.64m step up in world Y!)
  const stableRidgeH = 5.48; // Level 3 (2-Storey Stable) ridge height above stableDatumY (+0.74m step up in world Y!)

  const baseYBarnStart = getBaseYAtU(uBarnStart); // -0.39m
  const baseYBarnEnd = getBaseYAtU(uBarnEnd); // -0.26m
  const baseYStableEnd = getBaseYAtU(uStableEnd); // -0.18m
  const baseYBarnMid = (baseYBarnStart + baseYBarnEnd) * 0.5;
  const baseYStableMid = (baseYBarnEnd + baseYStableEnd) * 0.5;

  const barnDatumY = -0.32;
  const stableDatumY = -0.22;
  const eastRangeGroundTopY = barnDatumY + eastRangeGroundWallH; // 1.94m (exact match with northWestWallTopY = 1.94m!)
  const barnUpperTopY = barnDatumY + barnUpperEaveH; // 2.92m level eave across Store + Barn
  const stableUpperTopY = stableDatumY + stableUpperEaveH; // 3.56m level eave across 2-Storey Stable

  // Store, Barn & Stable Ground Floor Slabs
  const storeFloor = new THREE.Mesh(
    new THREE.BoxGeometry(2.65, 0.12, eastRangeInternalV),
    barnFloorMat
  );
  storeFloor.position.set(
    uStoreStart + 0.24 + 2.65 * 0.5,
    (baseY12 + baseYStoreEnd) * 0.5 - 0.05,
    vEastRangeNorth + wallT + eastRangeInternalV * 0.5
  );
  storeFloor.receiveShadow = true;
  groundGroup.add(storeFloor);

  const barnFloor = new THREE.Mesh(
    new THREE.BoxGeometry(8.02, 0.12, eastRangeInternalV),
    barnFloorMat
  );
  barnFloor.position.set(
    uBarnStart + 0.24 + 8.02 * 0.5,
    baseYBarnMid - 0.05,
    vEastRangeNorth + wallT + eastRangeInternalV * 0.5
  );
  barnFloor.receiveShadow = true;
  groundGroup.add(barnFloor);

  const stableFloor = new THREE.Mesh(
    new THREE.BoxGeometry(5.55, 0.12, eastRangeInternalV),
    barnFloorMat
  );
  stableFloor.position.set(
    uStableStart + 5.55 * 0.5,
    baseYStableMid - 0.05,
    vEastRangeNorth + wallT + eastRangeInternalV * 0.5
  );
  stableFloor.receiveShadow = true;
  groundGroup.add(stableFloor);

  // Internal Ground-Floor Cross-Walls at u = 12.07m (Garage/Store Step #1), u = 14.96m (Store/Barn), and u = 23.02m..23.22m (Barn/Stable Step #2)
  // Issue #9: Strictly span `vEastRangeNorth + wallT` to `vEastRangeSouth - wallT` (`0.28m..5.43m`) so they never z-fight with the North or South exterior walls!
  addOutbuildingBrickWall(
    groundGroup,
    uStoreStart,
    uStoreStart + 0.24,
    baseY12 - 0.14,
    eastRangeGroundTopY,
    vEastRangeNorth + wallT,
    vEastRangeSouth - wallT,
    ['+x', '-x']
  );
  addOutbuildingBrickWall(
    groundGroup,
    uBarnStart,
    uBarnStart + 0.24,
    baseYBarnStart - 0.14,
    eastRangeGroundTopY,
    vEastRangeNorth + wallT,
    vEastRangeSouth - wallT,
    ['+x', '-x']
  );
  addOutbuildingBrickWall(
    groundGroup,
    uBarnEnd - partT,
    uBarnEnd,
    baseYBarnEnd - 0.14,
    eastRangeGroundTopY,
    vEastRangeNorth + wallT,
    vEastRangeSouth - wallT,
    ['+x', '-x']
  );

  // Continuous South Garden Wall of Store, Barn & Stable (Ground Floor: u = 12.07m..28.77m)
  // with clean window cutouts for the 2 Barn South windows (`u = 18.25m, 21.35m`) and 1 Stable South window (`u = 26.35m`) per Floorplan (Issue #8!)
  addOutbuildingBrickWallWithWindows(
    groundGroup,
    uStoreStart,
    uStableEnd - wallT,
    baseY12 - 0.14,
    eastRangeGroundTopY,
    vEastRangeSouth - wallT,
    vEastRangeSouth,
    ['-z'],
    [
      { uCenter: 18.25, yCenter: baseYBarnMid + 1.24, width: 0.96, height: 1.02 },
      { uCenter: 21.35, yCenter: baseYBarnMid + 1.24, width: 0.96, height: 1.02 },
      { uCenter: 26.35, yCenter: baseYStableMid + 1.24, width: 0.96, height: 1.02 },
    ]
  );

  // Continuous Flush Reclaimed Red-Brick North Courtyard Wall of Store, Barn & 2-Storey Stable
  // (Ground Floor: v = 0.00m..0.28m, u = 12.07m..28.77m — Issue #4 & Issue #9!):
  // - Store Single White Door at u = 12.85m..13.75m (0 windows in Store!)
  // - Barn Single White Door at u = 15.85m..16.85m (0 ground-floor windows on Barn North wall!)
  // - Stable Single White Door on the West side of the Stable at u = 23.80m..24.70m (`u = 24.25m`)
  // - Stable Single Casement Window on the East side of the Stable at u = 26.55m
  addOutbuildingBrickWall(
    groundGroup,
    uStoreStart,
    12.85,
    baseY12 - 0.14,
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
    courtyardDoorMat,
    'Store Courtyard Door'
  );
  addOutbuildingBrickWall(
    groundGroup,
    13.75,
    15.85,
    baseYStoreEnd - 0.14,
    eastRangeGroundTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z']
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
    courtyardDoorMat,
    'Barn Courtyard Door'
  );

  // Continuous flush red-brick wall from Barn door (u = 16.85m) to Stable West door (u = 23.80m)
  addOutbuildingBrickWall(
    groundGroup,
    16.85,
    23.8,
    baseYBarnMid - 0.14,
    eastRangeGroundTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z']
  );

  // White Stable Door on the West side of the 2-Storey Stable at u = 23.80m..24.70m (`u = 24.25m`)
  addOutbuildingBrickWall(
    groundGroup,
    23.8,
    24.7,
    baseYStableMid + 2.04,
    eastRangeGroundTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z']
  );
  addBoardedBarnDoor(
    groundGroup,
    24.25,
    baseYStableMid,
    vEastRangeNorth + wallT * 0.5,
    0.9,
    2.04,
    false,
    courtyardDoorMat,
    'Stable Courtyard Door'
  );

  // East portion of Stable North wall (u = 24.70m..28.77m) with the single Stable Ground-Floor Casement Window at u = 26.55m
  addOutbuildingBrickWallWithWindows(
    groundGroup,
    24.7,
    uStableEnd - wallT,
    baseYStableEnd - 0.14,
    eastRangeGroundTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z'],
    [{ uCenter: 26.55, yCenter: baseYStableMid + 1.24, width: 0.92, height: 1.02 }]
  );

  // East Gable End of 2-Storey Stable (Ground Floor: u = 28.77m..29.05m, v = 0.00m..5.71m) with Large Gable Window
  const vEastRangeMid = (vEastRangeNorth + vEastRangeSouth) * 0.5;
  addOutbuildingBrickWall(
    groundGroup,
    uStableEnd - wallT,
    uStableEnd,
    baseYStableEnd - 0.14,
    eastRangeGroundTopY,
    vEastRangeNorth,
    vEastRangeMid - 0.62,
    ['-x']
  );
  addOutbuildingBrickWall(
    groundGroup,
    uStableEnd - wallT,
    uStableEnd,
    baseYStableEnd - 0.14,
    baseYStableEnd + 0.62,
    vEastRangeMid - 0.62,
    vEastRangeMid + 0.62,
    ['-x']
  );
  addOutbuildingBrickWall(
    groundGroup,
    uStableEnd - wallT,
    uStableEnd,
    baseYStableEnd + 1.88,
    eastRangeGroundTopY,
    vEastRangeMid - 0.62,
    vEastRangeMid + 0.62,
    ['-x']
  );
  addOutbuildingBrickWall(
    groundGroup,
    uStableEnd - wallT,
    uStableEnd,
    baseYStableEnd - 0.14,
    eastRangeGroundTopY,
    vEastRangeMid + 0.62,
    vEastRangeSouth,
    ['-x']
  );
  addOutbuildingWindow(
    groundGroup,
    uStableEnd - wallT * 0.5,
    baseYStableEnd + 1.25,
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
    barnDatumY + (barnUpperEaveH - 0.1) * 0.5,
    vEastRangeNorth - 0.04
  );
  groundGroup.add(step1Downpipe);

  const step2Downpipe = new THREE.Mesh(
    new THREE.CylinderGeometry(0.034, 0.034, stableUpperEaveH - 0.1, 12),
    castIronMat
  );
  step2Downpipe.position.set(
    uStableStart + 0.06,
    stableDatumY + (stableUpperEaveH - 0.1) * 0.5,
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
  // 2B. OPPOSING INTERNAL BRICK PILASTERS & HEAVY WEATHERED-OAK KING-POST ROOF TRUSSES
  //     ACROSS ALL 5 OUTBUILDING BAYS (Issues #5 & #6!)
  //     - Issue #5 ("Slight pillar here and opposite wall, with big wooden roof trusses. The rest of the barns have the same"
  //       at `[-13.615, -0.48, 20.689]`)
  //     - Issue #6 ("Same here" at `[-19.444, -0.528, 21.19]`)
  //     - Added to `groundGroup` (`outbuildings.groundShell`) so the pilasters and big wooden roof trusses
  //       remain 100% visible when viewing the Ground Floor with `ceilingCutaway = true`!
  // =========================================================================
  const trussOakMat = new THREE.MeshStandardMaterial({
    color: 0x6e5138, // Aged, hand-hewn structural English oak
    roughness: 0.78,
    metalness: 0.03,
  });
  const trussDarkOakMat = new THREE.MeshStandardMaterial({
    color: 0x573e29,
    roughness: 0.82,
    metalness: 0.04,
  });

  const trussesGroup = new THREE.Group();
  trussesGroup.name = 'outbuildings.roofTrusses';
  groundGroup.add(trussesGroup);

  const pilasterW = 0.32;
  const pilasterD = 0.18;
  const vInnerNorth = wallT; // 0.28m
  const vInnerSouth = vWestRangeSouth - wallT; // 5.43m
  const vSpanInternal = vInnerSouth - vInnerNorth; // 5.15m

  interface BarnTrussBaySpec {
    readonly id: string;
    readonly uCenter: number;
    readonly baseY: number;
    readonly tieBottomY: number;
    readonly ridgeApexY: number;
  }

  const barnTrussBays: ReadonlyArray<BarnTrussBaySpec> = [
    // Bay 1: GYM (Issue #6 at `[-19.444, -0.528, 21.19]`, just West of the `u = 3.05m` glazed screen)
    {
      id: 'gym',
      uCenter: 2.86,
      baseY: baseY0,
      tieBottomY: northWestWallTopY,
      ridgeApexY: westRangeDatumY + westRangeRidgeH - 0.1,
    },
    // Bay 2: Garage (Issue #5 at `[-13.615, -0.48, 20.689]`, centered between the two Double Garage Doors)
    {
      id: 'garage',
      uCenter: 8.92,
      baseY: (baseY0 + baseY12) * 0.5,
      tieBottomY: northWestWallTopY,
      ridgeApexY: westRangeDatumY + westRangeRidgeH - 0.1,
    },
    // Bay 3: Store (`u = 12.31..14.96m`)
    {
      id: 'store',
      uCenter: 13.95,
      baseY: baseYStoreEnd,
      tieBottomY: eastRangeGroundTopY,
      ridgeApexY: barnDatumY + barnRidgeH - 0.45,
    },
    // Bay 4a & 4b: 3-Bay Barn (`u = 15.20..23.02m`, matching the 2 pairs of opposing pilasters on the Floorplan!)
    {
      id: 'barnWest',
      uCenter: 17.45,
      baseY: baseYBarnMid,
      tieBottomY: eastRangeGroundTopY,
      ridgeApexY: barnDatumY + barnRidgeH - 0.45,
    },
    {
      id: 'barnEast',
      uCenter: 20.52,
      baseY: baseYBarnMid,
      tieBottomY: eastRangeGroundTopY,
      ridgeApexY: barnDatumY + barnRidgeH - 0.45,
    },
    // Bay 5: Stable (`u = 23.22..28.77m`, matching the opposing pilasters on the Floorplan!)
    {
      id: 'stable',
      uCenter: 25.45,
      baseY: baseYStableMid,
      tieBottomY: eastRangeGroundTopY,
      ridgeApexY: stableDatumY + stableRidgeH - 0.55,
    },
  ];

  for (const bay of barnTrussBays) {
    // 1. Opposing North & South Internal Brick Pilasters (`0.32m` wide x `0.18m` deep) with Yorkstone Corbel Padstones
    addOutbuildingBrickWall(
      groundGroup,
      bay.uCenter - pilasterW * 0.5,
      bay.uCenter + pilasterW * 0.5,
      bay.baseY - 0.08,
      bay.tieBottomY,
      vInnerNorth,
      vInnerNorth + pilasterD,
      ['+x', '-x', '+z']
    );
    addOutbuildingBrickWall(
      groundGroup,
      bay.uCenter - pilasterW * 0.5,
      bay.uCenter + pilasterW * 0.5,
      bay.baseY - 0.08,
      bay.tieBottomY,
      vInnerSouth - pilasterD,
      vInnerSouth,
      ['+x', '-x', '-z']
    );

    for (const vPad of [vInnerNorth + pilasterD * 0.5, vInnerSouth - pilasterD * 0.5]) {
      const padstone = new THREE.Mesh(
        new THREE.BoxGeometry(pilasterW + 0.05, 0.09, pilasterD + 0.04),
        stoneSillMat
      );
      padstone.name = `outbuildings.pilasterPadstone.${bay.id}`;
      padstone.position.set(bay.uCenter, bay.tieBottomY - 0.045, vPad);
      padstone.castShadow = true;
      padstone.receiveShadow = true;
      groundGroup.add(padstone);
    }

    // 2. Heavy Weathered-Oak King-Post Roof Truss (`outbuildings.roofTruss.<id>`)
    const trussGroup = new THREE.Group();
    trussGroup.name = `outbuildings.roofTruss.${bay.id}`;
    trussGroup.position.set(bay.uCenter, 0, vMidCenter());
    trussesGroup.add(trussGroup);

    const tieH = 0.22;
    const tieW = 0.2;
    const tieMidY = bay.tieBottomY + tieH * 0.5;
    const tieTopY = bay.tieBottomY + tieH;
    const halfSpan = vSpanInternal * 0.5; // 2.575m
    const trussRise = Math.max(1.15, bay.ridgeApexY - tieTopY);

    // Main horizontal oak tie-beam spanning from North pilaster to South pilaster
    const tieBeam = new THREE.Mesh(
      new THREE.BoxGeometry(tieW, tieH, vSpanInternal + 0.16),
      trussOakMat
    );
    tieBeam.position.set(0, tieMidY, 0);
    tieBeam.castShadow = true;
    tieBeam.receiveShadow = true;
    trussGroup.add(tieBeam);

    // North (-v) and South (+v) Oak Wall-Posts & Diagonal Knee Braces seated on the opposing pilasters
    for (const sideV of [-1, 1] as const) {
      const postV = sideV * (halfSpan - pilasterD * 0.5);
      const wallPost = new THREE.Mesh(
        new THREE.BoxGeometry(0.17, 0.68, 0.16),
        trussDarkOakMat
      );
      wallPost.position.set(0, bay.tieBottomY - 0.34, postV);
      wallPost.castShadow = true;
      trussGroup.add(wallPost);

      // Diagonal oak knee brace springing from the pilaster wall-post up to the tie-beam soffit
      const braceStartV = sideV * (halfSpan - pilasterD - 0.02);
      const braceStartY = bay.tieBottomY - 0.54;
      const braceEndV = sideV * (halfSpan - 0.78);
      const braceEndY = bay.tieBottomY + 0.02;
      const dV = braceEndV - braceStartV;
      const dY = braceEndY - braceStartY;
      const braceLen = Math.hypot(dV, dY);
      const kneeBrace = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.16, braceLen),
        trussOakMat
      );
      kneeBrace.position.set(0, (braceStartY + braceEndY) * 0.5, (braceStartV + braceEndV) * 0.5);
      kneeBrace.rotation.x = -Math.atan2(dY, dV);
      kneeBrace.castShadow = true;
      trussGroup.add(kneeBrace);

      // Pitched principal rafter rising from tie-beam end to the ridge apex
      const rafterRunV = halfSpan + 0.06;
      const rafterLen = Math.hypot(rafterRunV, trussRise);
      const rafterAngle = Math.atan2(trussRise, rafterRunV);
      const principalRafter = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.19, rafterLen),
        trussOakMat
      );
      principalRafter.position.set(
        0,
        tieTopY + trussRise * 0.5 - 0.04,
        sideV * (rafterRunV * 0.5)
      );
      principalRafter.rotation.x = sideV * rafterAngle;
      principalRafter.castShadow = true;
      principalRafter.receiveShadow = true;
      trussGroup.add(principalRafter);

      // Diagonal oak strut from the base of the central king-post up to the mid-span of each principal rafter
      const strutStartV = sideV * 0.08;
      const strutStartY = tieTopY + 0.14;
      const strutEndV = sideV * (halfSpan * 0.52);
      const strutEndY = tieTopY + trussRise * 0.48 - 0.06;
      const sDV = strutEndV - strutStartV;
      const sDY = strutEndY - strutStartY;
      const strutLen = Math.hypot(sDV, sDY);
      const strut = new THREE.Mesh(
        new THREE.BoxGeometry(0.13, 0.14, strutLen),
        trussDarkOakMat
      );
      strut.position.set(0, (strutStartY + strutEndY) * 0.5, (strutStartV + strutEndV) * 0.5);
      strut.rotation.x = -Math.atan2(sDY, sDV);
      strut.castShadow = true;
      trussGroup.add(strut);

      // Wrought-iron heel strap at the tie-beam / principal rafter junction
      const heelStrap = new THREE.Mesh(
        new THREE.BoxGeometry(tieW + 0.018, 0.24, 0.06),
        castIronMat
      );
      heelStrap.position.set(0, tieMidY + 0.04, sideV * (halfSpan - 0.18));
      trussGroup.add(heelStrap);
    }

    // Central Jowled Oak King-Post rising from the tie-beam center to the ridge apex
    const kingPostH = trussRise - 0.04;
    const kingPost = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, kingPostH, 0.18),
      trussDarkOakMat
    );
    kingPost.position.set(0, tieTopY + kingPostH * 0.5, 0);
    kingPost.castShadow = true;
    trussGroup.add(kingPost);

    // Flared jowl head & base collar on the central king-post
    const kingJowlHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.22, 0.28),
      trussOakMat
    );
    kingJowlHead.position.set(0, tieTopY + kingPostH - 0.12, 0);
    trussGroup.add(kingJowlHead);

    // Traditional black wrought-iron U-stirrup strap clamping the king-post foot to the tie-beam
    const ironStirrup = new THREE.Mesh(
      new THREE.BoxGeometry(tieW + 0.02, 0.38, 0.065),
      castIronMat
    );
    ironStirrup.position.set(0, tieMidY + 0.12, 0);
    trussGroup.add(ironStirrup);
  }

  function vMidCenter(): number {
    return (vInnerNorth + vInnerSouth) * 0.5;
  }

  // Longitudinal Oak Ridge Beams & Mid-Slope Trench Purlins tying the roof trusses together across all barns
  for (const [u0, u1, tieBottomY, ridgeApexY] of [
    [wallT, uGarageEnd, northWestWallTopY, westRangeDatumY + westRangeRidgeH - 0.1],
    [uStoreStart + 0.24, uBarnEnd - partT, eastRangeGroundTopY, barnDatumY + barnRidgeH - 0.45],
    [uStableStart, uStableEnd - wallT, eastRangeGroundTopY, stableDatumY + stableRidgeH - 0.55],
  ] as const) {
    const spanU = u1 - u0;
    const midU = (u0 + u1) * 0.5;
    const tieTopY = tieBottomY + 0.22;
    const trussRise = Math.max(1.15, ridgeApexY - tieTopY);
    const purlinY = tieTopY + trussRise * 0.52;
    const purlinOffsetV = vSpanInternal * 0.25;

    const ridgeBeam = new THREE.Mesh(
      new THREE.BoxGeometry(spanU, 0.16, 0.14),
      trussDarkOakMat
    );
    ridgeBeam.position.set(midU, ridgeApexY - 0.06, vMidCenter());
    ridgeBeam.castShadow = true;
    trussesGroup.add(ridgeBeam);

    for (const sideV of [-1, 1] as const) {
      const purlin = new THREE.Mesh(
        new THREE.BoxGeometry(spanU, 0.14, 0.14),
        trussOakMat
      );
      purlin.position.set(midU, purlinY, vMidCenter() + sideV * purlinOffsetV);
      purlin.castShadow = true;
      trussesGroup.add(purlin);
    }
  }

  // =========================================================================
  // 3. OUTBUILDING FIRST FLOOR OVER BARN & 2-STOREY STABLE (Issue #1, Issue #8 & Issue #9!)
  //    - Level 2 Upper Walls (`Store + Barn`: u = 12.07m..23.22m, y = eastRangeUpperFloorY..barnUpperTopY)
  //    - Level 3 Stepped-Up Upper Walls (`2-Storey Stable`: u = 23.22m..29.05m, y = eastRangeUpperFloorY..stableUpperTopY, +0.64m higher!)
  //    - Issue #9 ("Lots of weird mesh issues here" at `[-10.417, 0.2, 15.282]`):
  //      Step #1 West Upper Spandrel Wall (`u = 12.07m..12.31m`) uses `exteriorBrickMat` on its exposed West face
  //      and spans cleanly between `vEastRangeNorth + wallT` and `vEastRangeSouth - wallT` (`0.28m..5.43m`).
  // =========================================================================
  const eastRangeUpperFloorY = eastRangeGroundTopY;

  // West First-Floor Room Timber Slab (`4.34m x 5.15m`, u = 18.68m..23.02m)
  const westUpperRoomSlab = new THREE.Mesh(
    new THREE.BoxGeometry(4.34, 0.14, eastRangeInternalV),
    oakFloorMat
  );
  westUpperRoomSlab.name = 'outbuildings.firstFloor.westRoomSlab';
  westUpperRoomSlab.position.set(
    18.68 + 4.34 * 0.5,
    eastRangeUpperFloorY - 0.04,
    vEastRangeNorth + wallT + eastRangeInternalV * 0.5
  );
  westUpperRoomSlab.receiveShadow = true;
  firstFloorGroup.add(westUpperRoomSlab);

  // East First-Floor Room Timber Slab (`5.55m x 5.15m`, u = 23.22m..28.77m, stepped up +0.24m via the 3 `UP` steps over the Stable!)
  const stableUpperFloorY = eastRangeUpperFloorY + 0.24;
  const eastUpperRoomSlab = new THREE.Mesh(
    new THREE.BoxGeometry(5.55, 0.14, eastRangeInternalV),
    oakFloorMat
  );
  eastUpperRoomSlab.name = 'outbuildings.firstFloor.stableRoomSlab';
  eastUpperRoomSlab.position.set(
    uStableStart + 5.55 * 0.5,
    stableUpperFloorY - 0.04,
    vEastRangeNorth + wallT + eastRangeInternalV * 0.5
  );
  eastUpperRoomSlab.receiveShadow = true;
  firstFloorGroup.add(eastUpperRoomSlab);

  // STEP #1 Upper Exterior Brick Walls of Level 2 (`Store + Barn`: u = 12.07m..23.22m, y = eastRangeUpperFloorY..barnUpperTopY)
  // North Courtyard wall has ONLY the single upper hayloft window at u = 19.85m with a clean brick cutout (Photo 5, Issue #8!)
  addOutbuildingBrickWallWithWindows(
    firstFloorGroup,
    uStoreStart,
    uBarnEnd,
    eastRangeUpperFloorY,
    barnUpperTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z'],
    [{ uCenter: 19.85, yCenter: eastRangeUpperFloorY + 0.48, width: 0.78, height: 0.72 }]
  );
  // South Upper Wall of Store + Barn (solid brick, 0 windows per Floorplan)
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
  // Step #1 West Upper Spandrel Wall at u = 12.07m..12.31m (exterior brick on West `-x` face above the Garage roof — Issue #9!)
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

  // STEP #2 Upper Exterior Brick Walls of Level 3 (`2-Storey Stable`: u = 23.22m..29.05m, y = eastRangeUpperFloorY..stableUpperTopY, +0.64m higher — Issue #1 & Issue #8!)
  // Single North 1st-floor window at u = 26.35m (Photo 10 top-left) and single South 1st-floor window at u = 26.35m (Floorplan), with clean brick cutouts!
  addOutbuildingBrickWallWithWindows(
    firstFloorGroup,
    uStableStart,
    uStableEnd,
    eastRangeUpperFloorY,
    stableUpperTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z'],
    [{ uCenter: 26.35, yCenter: stableUpperFloorY + 0.68, width: 0.88, height: 0.84 }]
  );
  addOutbuildingBrickWallWithWindows(
    firstFloorGroup,
    uStableStart,
    uStableEnd,
    eastRangeUpperFloorY,
    stableUpperTopY,
    vEastRangeSouth - wallT,
    vEastRangeSouth,
    ['-z'],
    [{ uCenter: 26.35, yCenter: stableUpperFloorY + 0.68, width: 0.88, height: 0.84 }]
  );

  // Internal West Partition of the 4.30m First-Floor Room at u = 18.50m..18.68m (strictly capped at barnUpperTopY)
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
  // East Upper Gable Wall of the 2-Storey Stable at u = 28.77m..29.05m (solid brick, 0 upper windows per Photo 12 bottom-left)
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

  // Internal 1st-Floor Partition between the 4.30m x 5.15m Barn Loft Room and the 5.60m x 5.15m Stable Upper Room
  // (at u = 23.02m..23.22m with central `UP` doorway opening at v = 2.40m..3.30m — Issue #9: strictly capped at barnUpperTopY
  // so no internal plaster wall pokes above the Barn roof!)
  addOutbuildingBrickWall(
    firstFloorGroup,
    uBarnEnd - partT,
    uBarnEnd,
    eastRangeUpperFloorY,
    barnUpperTopY,
    vEastRangeNorth + wallT,
    2.4,
    ['+x', '-x']
  );
  addOutbuildingBrickWall(
    firstFloorGroup,
    uBarnEnd - partT,
    uBarnEnd,
    eastRangeUpperFloorY,
    barnUpperTopY,
    3.3,
    vEastRangeSouth - wallT,
    ['+x', '-x']
  );
  // Exterior Brick Step-Up Spandrel Wall at u = 23.22m..23.50m (inside the Stable footprint) bridging from barnUpperTopY (2.92m) to stableUpperTopY (3.56m)
  addOutbuildingBrickWall(
    firstFloorGroup,
    uStableStart,
    uStableStart + wallT,
    barnUpperTopY,
    stableUpperTopY,
    vEastRangeNorth + wallT,
    vEastRangeSouth - wallT,
    []
  );

  // 3 Central `UP` steps through the 1st-floor partition opening (u = 22.62m..23.22m, v = 2.40m..3.30m)
  // & SE Corner `DN` Staircase in the 4.30m x 5.15m room (u = 22.15m, v = 3.1m..5.1m — Floorplan Image 9!)
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

  // STEP #1 Roof -> Level 2 Pitched Roof over Store & Barn (`u = 12.07m..23.22m`, weathered clay pantile, `barnUpperEaveH = 3.24m, barnRidgeH = 4.84m`, trimmed at East Step #2 wall — Issue #9!)
  addPitchedOutbuildingRoofSection(
    uStoreStart,
    uBarnEnd,
    vEastRangeNorth,
    vEastRangeSouth,
    barnDatumY,
    barnUpperEaveH,
    barnRidgeH,
    pantileRoofMat,
    true,
    false,
    barnUpperEaveH,
    barnUpperEaveH,
    0.06,
    0.0
  );

  // STEP #2 Roof -> Level 3 Higher Pitched Roof over the 2-Storey Stable at the East end (`u = 23.22m..29.05m`, natural Welsh slate, `stableUpperEaveH = 3.78m, stableRidgeH = 5.48m` — Issue #1 & Issue #9!)
  addPitchedOutbuildingRoofSection(
    uStableStart,
    uStableEnd,
    vEastRangeNorth,
    vEastRangeSouth,
    stableDatumY,
    stableUpperEaveH,
    stableRidgeH,
    welshSlateMat,
    true,
    true,
    stableUpperEaveH,
    stableUpperEaveH,
    0.06,
    0.14
  );
}
