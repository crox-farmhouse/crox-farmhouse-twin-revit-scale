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

  interface OutbuildingSkylightSpec {
    readonly id: string;
    readonly uCenter: number;
    readonly vCenter: number;
    readonly widthU: number;
    readonly lengthS: number;
  }

  const veluxFlashingMat = new THREE.MeshStandardMaterial({
    color: 0x2f3338,
    roughness: 0.42,
    metalness: 0.62,
  });

  const spotlightHousingMat = new THREE.MeshStandardMaterial({
    color: 0x2b2622,
    roughness: 0.34,
    metalness: 0.72,
  });

  const spotlightBrassTrimMat = new THREE.MeshStandardMaterial({
    color: 0xb89348,
    roughness: 0.28,
    metalness: 0.82,
  });

  // Helper to build a 2D polygon in the `(v, y)` plane extruded along `u` from `uMin` to `uMax`
  const createExtrudedVYPolygon = (
    pointsVY: ReadonlyArray<readonly [number, number]>,
    uSpan: number
  ): THREE.BufferGeometry => {
    const shape = new THREE.Shape();
    for (let i = 0; i < pointsVY.length; i++) {
      const [vyZ, vyY] = pointsVY[i];
      // After `geo.rotateY(Math.PI / 2)`, shape X maps to `-Z` (`-v`), so pass `-vyZ` as shape X!
      if (i === 0) {
        shape.moveTo(-vyZ, vyY);
      } else {
        shape.lineTo(-vyZ, vyY);
      }
    }
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: uSpan,
      bevelEnabled: false,
    });
    geo.rotateY(Math.PI / 2);
    return geo;
  };

  // Helper to build a double-pitched gable roof + insulated plasterboard vaulted ceiling (Issue #4)
  // + Velux skylight cutouts (Issues #5 & #6) + brick gable triangles + eaves gutters
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
    eastOverhangU: number = 0.12,
    interiorUIntervals: ReadonlyArray<readonly [number, number]> = [],
    northSkylights: ReadonlyArray<OutbuildingSkylightSpec> = []
  ): void => {
    const vMid = (vMin + vMax) * 0.5;
    const halfSpanV = (vMax - vMin) * 0.5 + 0.2; // 0.20m eaves overhang (`3.055m`)
    const slopeRise = ridgeRelH - eaveRelH;
    const slopeLenV = Math.hypot(halfSpanV, slopeRise);
    const pitchAngle = Math.atan2(slopeRise, halfSpanV);
    const cosPitch = Math.cos(pitchAngle);
    const sinPitch = Math.sin(pitchAngle);
    const roofUMin = uMin - westOverhangU;
    const roofUMax = uMax + eastOverhangU;
    const lenU = roofUMax - roofUMin;
    const uMid = (roofUMin + roofUMax) * 0.5;

    const sectionRoofGroup = new THREE.Group();
    sectionRoofGroup.position.set(uMid, datumY, vMid);

    // Helper to add a sloped panel (or split it around Velux skylight openings) in the slope's local plane
    // where `s` runs from `-slopeLenV * 0.5` (at the ridge) to `+slopeLenV * 0.5` (at the eaves) for `sideV = +1`,
    // or `-slopeLenV * 0.5` (at the eaves) to `+slopeLenV * 0.5` (at the ridge) for `sideV = -1`.
    const addSlopedPanelWithSkylightCutouts = (
      targetGroup: THREE.Object3D,
      panelUMin: number,
      panelUMax: number,
      sMin: number,
      sMax: number,
      thickness: number,
      normalOffset: number,
      sideV: -1 | 1,
      mat: THREE.Material,
      skylights: ReadonlyArray<OutbuildingSkylightSpec>,
      meshPrefix: string
    ): void => {
      const slopePlane = new THREE.Group();
      slopePlane.position.set(
        0,
        eaveRelH + slopeRise * 0.5 + normalOffset * cosPitch,
        sideV * (halfSpanV * 0.5) - sideV * normalOffset * sinPitch
      );
      slopePlane.rotation.x = sideV * pitchAngle;
      targetGroup.add(slopePlane);

      const addSubBox = (u0: number, u1: number, s0: number, s1: number): void => {
        const wU = u1 - u0;
        const lS = s1 - s0;
        if (wU <= 0.008 || lS <= 0.008) return;
        const m = new THREE.Mesh(new THREE.BoxGeometry(wU, thickness, lS), mat);
        m.name = meshPrefix;
        m.position.set((u0 + u1) * 0.5 - uMid, 0, (s0 + s1) * 0.5);
        m.castShadow = true;
        m.receiveShadow = true;
        slopePlane.add(m);
      };

      const activeSkylights = skylights
        .filter((sk) => sk.uCenter + sk.widthU * 0.5 > panelUMin && sk.uCenter - sk.widthU * 0.5 < panelUMax)
        .sort((a, b) => a.uCenter - b.uCenter);

      if (activeSkylights.length === 0) {
        addSubBox(panelUMin, panelUMax, sMin, sMax);
        return;
      }

      let cursorU = panelUMin;
      for (const sk of activeSkylights) {
        const skUMin = Math.max(panelUMin, sk.uCenter - sk.widthU * 0.5);
        const skUMax = Math.min(panelUMax, sk.uCenter + sk.widthU * 0.5);
        // Convert world `vCenter` to local slope coordinate `s` relative to `sideV * (halfSpanV * 0.5)`
        const dvFromMid = sk.vCenter - vMid; // negative on North (-1) slope
        const distAlongSlopeFromRidge = Math.abs(dvFromMid) / cosPitch;
        const sCenter = sideV * (distAlongSlopeFromRidge - slopeLenV * 0.5);
        const skSMin = Math.max(sMin, sCenter - sk.lengthS * 0.5);
        const skSMax = Math.min(sMax, sCenter + sk.lengthS * 0.5);

        if (skUMin > cursorU + 0.01) {
          addSubBox(cursorU, skUMin, sMin, sMax);
        }
        if (skSMin > sMin + 0.01) {
          addSubBox(skUMin, skUMax, sMin, skSMin);
        }
        if (sMax > skSMax + 0.01) {
          addSubBox(skUMin, skUMax, skSMax, sMax);
        }
        cursorU = skUMax;
      }
      if (panelUMax > cursorU + 0.01) {
        addSubBox(cursorU, panelUMax, sMin, sMax);
      }
    };

    // 1. Exterior North (-v) and South (+v) pitched roof tile slopes
    for (const sideV of [-1, 1] as const) {
      addSlopedPanelWithSkylightCutouts(
        sectionRoofGroup,
        roofUMin,
        roofUMax,
        -slopeLenV * 0.5,
        slopeLenV * 0.5,
        0.055,
        0,
        sideV,
        roofMat,
        sideV === -1 ? northSkylights : [],
        'outbuildings.roof.exteriorSlope'
      );

      // Black half-round cast-iron eaves gutter along North and South eaves
      const gutter = new THREE.Mesh(
        new THREE.CylinderGeometry(0.052, 0.052, lenU, 12, 1, true, Math.PI, Math.PI),
        castIronMat
      );
      gutter.rotation.z = Math.PI / 2;
      gutter.position.set(0, eaveRelH - 0.02, sideV * (halfSpanV + 0.03));
      sectionRoofGroup.add(gutter);
    }

    // 2. Issue #4 ("Put a vauled ceiling in here, insulated plasterboard" at `[-13.898, 2.571, 19.843]`):
    //    Interior Insulated Plasterboard Vaulted Ceiling (`warmRoomPlasterMat`) lining the underside of the
    //    North and South roof slopes across each interior room bay (`v = vMin + wallT .. vMax - wallT`),
    //    with matching cutout apertures for the Velux skylights!
    const innerHalfSpanV = (vMax - vMin) * 0.5 - wallT; // 2.575m
    const innerMaxDistAlongSlope = innerHalfSpanV / cosPitch;
    const plasterNormalOffset = -0.056; // Positioned cleanly on the underside of the exterior roof slab

    for (const [bayUMin, bayUMax] of interiorUIntervals) {
      for (const sideV of [-1, 1] as const) {
        const sMin = sideV === 1 ? -slopeLenV * 0.5 : slopeLenV * 0.5 - innerMaxDistAlongSlope;
        const sMax = sideV === 1 ? -slopeLenV * 0.5 + innerMaxDistAlongSlope : slopeLenV * 0.5;
        addSlopedPanelWithSkylightCutouts(
          sectionRoofGroup,
          bayUMin,
          bayUMax,
          sMin,
          sMax,
          0.048,
          plasterNormalOffset,
          sideV,
          warmRoomPlasterMat,
          sideV === -1 ? northSkylights : [],
          'outbuildings.roof.vaultedPlasterCeiling'
        );
      }

      // Central insulated plasterboard apex ridge fillet sealing the vaulted ceiling peak
      const apexFillet = new THREE.Mesh(
        new THREE.BoxGeometry(bayUMax - bayUMin, 0.045, 0.14),
        warmRoomPlasterMat
      );
      apexFillet.name = 'outbuildings.roof.vaultedCeilingApex';
      apexFillet.position.set(
        (bayUMin + bayUMax) * 0.5 - uMid,
        ridgeRelH - 0.068,
        0
      );
      sectionRoofGroup.add(apexFillet);
    }

    // 3. Issues #5 & #6 ("Velux here" at `[-15.746, 2.508, 16.446]` and `[-11.903, 2.573, 16.247]`):
    //    Build 3D Velux Roof Windows inside the North slope skylight cutouts
    if (northSkylights.length > 0) {
      const northSlopeGroup = new THREE.Group();
      northSlopeGroup.position.set(0, eaveRelH + slopeRise * 0.5, -(halfSpanV * 0.5));
      northSlopeGroup.rotation.x = -pitchAngle;
      sectionRoofGroup.add(northSlopeGroup);

      for (const sk of northSkylights) {
        const dvFromMid = sk.vCenter - vMid;
        const distAlongSlopeFromRidge = Math.abs(dvFromMid) / cosPitch;
        const sCenter = -(distAlongSlopeFromRidge - slopeLenV * 0.5);

        const veluxGroup = new THREE.Group();
        veluxGroup.name = `outbuildings.roof.velux.${sk.id}`;
        veluxGroup.position.set(sk.uCenter - uMid, 0, sCenter);
        northSlopeGroup.add(veluxGroup);

        const wU = sk.widthU;
        const lS = sk.lengthS;
        const revealDepthY = 0.115; // Spans from underside of vaulted plasterboard (`-0.08m`) to top of exterior flashing (`+0.035m`)
        const revealCenterY = -0.022;
        const jambT = 0.032;

        // White plastered lightwell reveal lining the roof/insulation cutout
        for (const sideX of [-1, 1] as const) {
          const sideReveal = new THREE.Mesh(
            new THREE.BoxGeometry(jambT, revealDepthY, lS),
            warmRoomPlasterMat
          );
          sideReveal.position.set(sideX * (wU * 0.5 - jambT * 0.5), revealCenterY, 0);
          veluxGroup.add(sideReveal);
        }
        for (const sideZ of [-1, 1] as const) {
          const endReveal = new THREE.Mesh(
            new THREE.BoxGeometry(wU - jambT * 2, revealDepthY, jambT),
            warmRoomPlasterMat
          );
          endReveal.position.set(0, revealCenterY, sideZ * (lS * 0.5 - jambT * 0.5));
          veluxGroup.add(endReveal);
        }

        // Exterior dark anthracite aluminium Velux flashing collar & weather hood on top of the pantiles
        const flashW = 0.065;
        for (const sideX of [-1, 1] as const) {
          const sideFlash = new THREE.Mesh(
            new THREE.BoxGeometry(flashW, 0.028, lS + flashW * 2),
            veluxFlashingMat
          );
          sideFlash.position.set(sideX * (wU * 0.5 + flashW * 0.5 - 0.015), 0.032, 0);
          veluxGroup.add(sideFlash);
        }
        for (const sideZ of [-1, 1] as const) {
          const endFlash = new THREE.Mesh(
            new THREE.BoxGeometry(wU + 0.04, 0.028, flashW),
            veluxFlashingMat
          );
          endFlash.position.set(0, 0.032, sideZ * (lS * 0.5 + flashW * 0.5 - 0.015));
          veluxGroup.add(endFlash);
        }

        // Interior white-painted timber Velux casement sash frame & top aluminium ventilation bar
        const sashT = 0.042;
        const innerClearW = wU - jambT * 2;
        const innerClearL = lS - jambT * 2;
        for (const sideX of [-1, 1] as const) {
          const sashStile = new THREE.Mesh(
            new THREE.BoxGeometry(sashT, 0.045, innerClearL),
            windowFrameMat
          );
          sashStile.position.set(sideX * (innerClearW * 0.5 - sashT * 0.5), 0.008, 0);
          veluxGroup.add(sashStile);
        }
        for (const sideZ of [-1, 1] as const) {
          const sashRail = new THREE.Mesh(
            new THREE.BoxGeometry(innerClearW - sashT * 2, 0.045, sashT),
            windowFrameMat
          );
          sashRail.position.set(0, 0.008, sideZ * (innerClearL * 0.5 - sashT * 0.5));
          veluxGroup.add(sashRail);
        }

        // Velux top ventilation flap handle bar (at the ridge `+s` end of the North slope window)
        const handleBar = new THREE.Mesh(
          new THREE.BoxGeometry(innerClearW * 0.55, 0.018, 0.024),
          veluxFlashingMat
        );
        handleBar.position.set(0, -0.02, innerClearL * 0.5 - sashT - 0.015);
        veluxGroup.add(handleBar);

        // Clear double-glazed Velux skylight glass pane (`windowGlassMat`)
        const glassPane = new THREE.Mesh(
          new THREE.BoxGeometry(innerClearW - sashT * 2 + 0.01, 0.018, innerClearL - sashT * 2 + 0.01),
          windowGlassMat
        );
        glassPane.name = `outbuildings.roof.velux.${sk.id}.glass`;
        glassPane.position.set(0, 0.012, 0);
        veluxGroup.add(glassPane);
      }
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

    // Exterior Brick Gable End Triangles at uMin and/or uMax
    // When `startRelH > eaveRelH` (at Step #1 `u = 12.07m` and Step #2 `u = 23.22m`), builds an exterior
    // brick step-up spandrel chevron strictly ABOVE the lower roof slope so exterior red brick never
    // bleeds inside the lower vaulted ceiling (Issue #7: "Paint this wall"!).
    const buildGableEndTriangle = (uWallMin: number, lowerRoofEaveRelH: number): void => {
      const halfWallV = (vMax - vMin) * 0.5 - 0.01;
      const peakRelH = ridgeRelH - 0.02;
      const lowerSlopeRise = slopeRise;
      const lowerPeakRelH = lowerRoofEaveRelH + lowerSlopeRise - 0.02;

      let pointsVY: ReadonlyArray<readonly [number, number]>;
      if (lowerRoofEaveRelH >= eaveRelH - 0.01) {
        // Standard full gable triangle above `eaveRelH` (used at West Gable `u = 0` and East Gable `u = 28.77m`)
        pointsVY = [
          [-halfWallV, eaveRelH],
          [halfWallV, eaveRelH],
          [0, peakRelH],
        ];
      } else {
        // Step-up chevron polygon strictly between the lower roof slope (`lowerRoofEaveRelH..lowerPeakRelH`)
        // and the upper roof slope (`eaveRelH..peakRelH`) so zero brick protrudes below the lower roof!
        pointsVY = [
          [-halfWallV, lowerRoofEaveRelH],
          [0, lowerPeakRelH],
          [halfWallV, lowerRoofEaveRelH],
          [halfWallV, eaveRelH],
          [0, peakRelH],
          [-halfWallV, eaveRelH],
        ];
      }

      const geo = createExtrudedVYPolygon(pointsVY, wallT - 0.03);
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

  // Helper to build a painted interior plasterboard gable wall (`warmRoomPlasterMat`) extending from
  // `yMin` (`eaveWorldY`) all the way up to the underside of the vaulted plasterboard ceiling (`ceilEaveY..ceilRidgeY`),
  // plus North/South inner wall-plate frieze strips (`Issue #7: "Paint this wall"` & `Issue #10: "Ceiling all the way up here"`!).
  const addInteriorPlasterGableWall = (
    parent: THREE.Object3D,
    uMin: number,
    uMax: number,
    vInnerMin: number,
    vInnerMax: number,
    yBaseWorld: number,
    ceilEaveWorldY: number,
    ceilRidgeWorldY: number,
    meshName: string
  ): void => {
    const vMid = (vInnerMin + vInnerMax) * 0.5;
    const halfInnerV = (vInnerMax - vInnerMin) * 0.5;
    const geo = createExtrudedVYPolygon(
      [
        [-halfInnerV, yBaseWorld],
        [halfInnerV, yBaseWorld],
        [halfInnerV, ceilEaveWorldY],
        [0, ceilRidgeWorldY],
        [-halfInnerV, ceilEaveWorldY],
      ],
      uMax - uMin
    );
    const mesh = new THREE.Mesh(geo, warmRoomPlasterMat);
    mesh.name = meshName;
    mesh.userData.isArchitecturalShell = true;
    mesh.position.set(uMin, 0, vMid);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
  };

  // Helper to add North & South interior painted plasterboard wall-plate frieze strips bridging from
  // `eaveWorldY` up to `ceilEaveWorldY` along the inside of a vaulted room so no gap appears at the eaves
  const addVaultedRoomEaveFriezeStrips = (
    parent: THREE.Object3D,
    uMin: number,
    uMax: number,
    vInnerNorth: number,
    vInnerSouth: number,
    eaveWorldY: number,
    ceilEaveWorldY: number
  ): void => {
    const h = ceilEaveWorldY - eaveWorldY + 0.04;
    if (h <= 0.01) return;
    const lenU = uMax - uMin;
    const midU = (uMin + uMax) * 0.5;
    const midY = eaveWorldY + h * 0.5 - 0.02;
    for (const vPos of [vInnerNorth - 0.02, vInnerSouth + 0.02]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(lenU, h, 0.06), warmRoomPlasterMat);
      strip.userData.isArchitecturalShell = true;
      strip.position.set(midU, midY, vPos);
      parent.add(strip);
    }
  };

  // =========================================================================
  // 1. LEVEL 1 — SINGLE-STOREY WEST RANGE (`GYM` + `GARAGE`, u = 0.00m..12.07m)
  //    - Bay 1 (`GYM`: 5.49m x 5.15m, u = 0.00m..5.77m)
  //    - Bay 2 (`Garage`: 6.10m x 5.15m, u = 5.77m..12.07m)
  //    - Issue #4 ("Put a vauled ceiling in here, insulated plasterboard" at `[-13.898, 2.571, 19.843]`)
  //    - Issue #5 ("Velux here" at `[-15.746, 2.508, 16.446]`, `u = 6.661m`)
  //    - Issue #6 ("Velux here" at `[-11.903, 2.573, 16.247]`, `u = 10.507m`)
  //    - Issue #7 ("Paint this wall" at `[-10.211, 2.681, 17.684]`, `u = 12.070m`)
  //    - Issue #10 ("Ceiling all the way up here" at `[-16.221, 1.817, 18.995]`, `u = 5.970m`)
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
  const westRangeCeilRidgeY = westRangeDatumY + westRangeRidgeH - 0.062; // 3.378m vaulted ceiling apex
  const westRangeCeilEaveY =
    westRangeCeilRidgeY - 2.575 * ((westRangeRidgeH - westRangeWallH) / 3.055); // 2.114m vaulted ceiling eave at inner wall face

  // GYM Floor (`5.49m x 5.15m`) built as a dark sub-slab + 3D `1.00m x 1.00m` Chamfered-Edge Rubber Gym Tiles
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
  // Small cottage casement window (`0.68m` wide along `v = 1.61..2.29m` x `0.76m` high at `y = baseY0 + 1.00..baseY0 + 1.76m`)
  addOutbuildingBrickWall(groundGroup, 0, wallT, baseY0 - 0.14, northWestWallTopY, 0, 1.61, ['+x']);
  addOutbuildingBrickWall(groundGroup, 0, wallT, baseY0 - 0.14, baseY0 + 1.0, 1.61, 2.29, ['+x']);
  addOutbuildingBrickWall(groundGroup, 0, wallT, baseY0 + 1.76, northWestWallTopY, 1.61, 2.29, ['+x']);
  addOutbuildingBrickWall(groundGroup, 0, wallT, baseY0 - 0.14, northWestWallTopY, 2.29, vWestRangeSouth, ['+x']);
  addOutbuildingWindow(groundGroup, wallT * 0.5, baseY0 + 1.38, 1.95, 0.68, 0.76, true);

  // Painted interior gable lining inside the GYM West Gable wall (`u = 0.25..0.285m`) up to the vaulted ceiling
  addInteriorPlasterGableWall(
    groundGroup,
    wallT - 0.03,
    wallT + 0.005,
    wallT,
    vWestRangeSouth - wallT,
    northWestWallTopY,
    westRangeCeilEaveY,
    westRangeCeilRidgeY,
    'outbuildings.gym.westGableInteriorPlaster'
  );

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

  // Internal Partition Wall between GYM and Garage (u = 5.77m..5.97m) with hinged internal door at v = 1.25m..2.15m
  // Issue #10 ("Ceiling all the way up here" at `[-16.221, 1.817, 18.995]`):
  // Extends all the way up to the vaulted ceiling apex (`westRangeCeilRidgeY = 3.378m`) with painted warm plaster on both sides!
  addOutbuildingBrickWall(groundGroup, uGymEnd, uGymEnd + partT, baseY0, northWestWallTopY, wallT, 1.25, ['+x', '-x']);
  addOutbuildingBrickWall(groundGroup, uGymEnd, uGymEnd + partT, baseY0 + 1.98, northWestWallTopY, 1.25, 2.15, ['+x', '-x']);
  addOutbuildingBrickWall(groundGroup, uGymEnd, uGymEnd + partT, baseY0, northWestWallTopY, 2.15, vWestRangeSouth - wallT, ['+x', '-x']);
  addInteriorPlasterGableWall(
    groundGroup,
    uGymEnd,
    uGymEnd + partT,
    wallT,
    vWestRangeSouth - wallT,
    northWestWallTopY,
    westRangeCeilEaveY,
    westRangeCeilRidgeY,
    'outbuildings.gymGaragePartitionGable'
  );

  // Vaulted eave frieze strips inside GYM (`u = 0.28..5.77m`) and Garage (`u = 5.97..12.07m`)
  addVaultedRoomEaveFriezeStrips(
    groundGroup,
    wallT,
    uGymEnd,
    wallT,
    vWestRangeSouth - wallT,
    northWestWallTopY,
    westRangeCeilEaveY
  );
  addVaultedRoomEaveFriezeStrips(
    groundGroup,
    uGymEnd + partT,
    uGarageEnd,
    wallT,
    vWestRangeSouth - wallT,
    northWestWallTopY,
    westRangeCeilEaveY
  );

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

  // GYM East wide opening (u = 3.05m..5.45m): Full-height glazed screen & interactive glass doors
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

  // Level 1 Pitched Pantile Roof + Insulated Plasterboard Vaulted Ceiling (Issue #4)
  // + 2 North-Slope Velux Skylights over the Garage (`u = 6.661m` Issue #5 & `u = 10.507m` Issue #6)
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
    0.0,
    [
      [wallT, uGymEnd],
      [uGymEnd + partT, uGarageEnd],
    ],
    [
      { id: 'garageWest', uCenter: 6.661, vCenter: 1.08, widthU: 0.84, lengthS: 1.18 },
      { id: 'garageEast', uCenter: 10.507, vCenter: 1.08, widthU: 0.84, lengthS: 1.18 },
    ]
  );

  // =========================================================================
  // 2. STEP #1 -> LEVEL 2 (`STORE`: u = 12.07m..14.96m + `BARN`: u = 14.96m..23.22m)
  //    AND STEP #2 -> LEVEL 3 (`2-STOREY STABLE` AT THE END: u = 23.22m..29.05m)
  //    - Issue #1 ("only 1 truss in here and its at the front of the mezzanine. I think the mezzanine is a little lower down too (lowish ceiling underneath)"
  //      at `[-1.842, 2.082, 17.548]`, `u = 20.42m`):
  //      Lowered Barn mezzanine to `mezzanineFloorY = 1.54m` (underside ceiling at `y = 1.40m`, giving a lowish `1.72m` ceiling underneath)
  //      and placed the single Barn truss right at the front of the mezzanine (`u = 18.68m`).
  //    - Issue #2 ("This is a usable top floor so I dont think there is a big truss in here" at `[2.917, 2.21, 16.337]`):
  //      Removed the roof truss from the Stable upper room.
  //    - Issue #3 ("Ceiling feels much higher in here?" at `[3.679, -0.189, 16.835]`, inside the Stable ground floor):
  //      Raised the Stable ground-floor ceiling (`stableGroundTopY`) to `2.52m` (`2.74m` clear ceiling height above the `-0.22m` Stable floor,
  //      with `stableUpperFloorY = 2.66m`, `stableUpperTopY = 3.88m`, and `stableRidgeY = 5.48m`).
  // =========================================================================
  const uStoreStart = uGarageEnd; // 12.07m (Step #1!)
  const uBarnStart = uStoreEnd; // 14.96m
  const uMezzanineFront = 18.68; // Front edge of the 4.34m Barn Mezzanine (`u = 18.68..23.02m`)
  const uBarnEnd = 23.22; // 14.96m + 0.24m wall + 8.02m Barn (Step #2!)
  const uStableStart = uBarnEnd; // 23.22m
  const uStableEnd = 29.05; // 23.22m + 5.55m Stable + 0.28m East Gable wall
  const vEastRangeNorth = 0.0;
  const vEastRangeSouth = 5.71;
  const eastRangeInternalV = vEastRangeSouth - vEastRangeNorth - wallT * 2; // 5.15m
  const eastRangeGroundWallH = 2.26;
  const barnUpperEaveH = 3.24; // Level 2 (Store + Barn) eave height above barnDatumY
  const barnRidgeH = 4.84; // Level 2 (Store + Barn) ridge height above barnDatumY
  const stableUpperEaveH = 4.1; // Level 3 (2-Storey Stable) eave height above stableDatumY -> world Y = 3.88m
  const stableRidgeH = 5.7; // Level 3 (2-Storey Stable) ridge height above stableDatumY -> world Y = 5.48m

  const baseYBarnStart = getBaseYAtU(uBarnStart); // -0.39m
  const baseYBarnEnd = getBaseYAtU(uBarnEnd); // -0.26m
  const baseYStableEnd = getBaseYAtU(uStableEnd); // -0.18m
  const baseYBarnMid = (baseYBarnStart + baseYBarnEnd) * 0.5;
  const baseYStableMid = (baseYBarnEnd + baseYStableEnd) * 0.5;

  const barnDatumY = -0.32;
  const stableDatumY = -0.22;
  const eastRangeGroundTopY = barnDatumY + eastRangeGroundWallH; // 1.94m
  const barnUpperTopY = barnDatumY + barnUpperEaveH; // 2.92m level eave across Store + Barn
  const barnCeilRidgeY = barnDatumY + barnRidgeH - 0.064; // 4.456m vaulted ceiling apex in Store & Barn
  const barnCeilEaveY =
    barnCeilRidgeY - 2.575 * ((barnRidgeH - barnUpperEaveH) / 3.055); // 3.107m vaulted ceiling eave in Store & Barn

  // Issue #1: Lowered Barn Mezzanine floor (`mezzanineFloorY = 1.54m`, underside soffit at `y = 1.40m`, giving a lowish `1.72m` ceiling underneath!)
  const mezzanineFloorY = 1.54;
  const mezzanineUndersideY = 1.4;

  // Issue #3: Much higher Ground-Floor Ceiling in the 2-Storey Stable (`stableGroundTopY = 2.52m`, `2.74m` headroom above `-0.22m`!)
  const stableGroundTopY = 2.52;
  const stableUpperFloorY = 2.66;
  const stableUpperTopY = stableDatumY + stableUpperEaveH; // 3.88m level eave across 2-Storey Stable
  const stableCeilRidgeY = stableDatumY + stableRidgeH - 0.064; // 5.416m vaulted ceiling apex in Stable
  const stableCeilEaveY =
    stableCeilRidgeY - 2.575 * ((stableRidgeH - stableUpperEaveH) / 3.055); // 4.067m vaulted ceiling eave in Stable

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

  // Issue #7 ("Paint this wall" at `[-10.211, 2.681, 17.684]`, `u = 12.07m`):
  // Internal Cross-Wall at u = 12.07m..12.31m (Garage/Store Step #1):
  // - Rectangular wall from ground up to `eastRangeGroundTopY = 1.94m` painted on both `+x` and `-x` faces.
  // - Painted interior gable wall from `1.94m` up to the Garage vaulted ceiling apex (`westRangeCeilRidgeY = 3.378m`)
  //   so the East wall of the Garage is 100% painted plasterboard all the way up to the vaulted ceiling!
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
  addInteriorPlasterGableWall(
    groundGroup,
    uStoreStart,
    uStoreStart + 0.24,
    vEastRangeNorth + wallT,
    vEastRangeSouth - wallT,
    eastRangeGroundTopY,
    westRangeCeilEaveY,
    westRangeCeilRidgeY,
    'outbuildings.garageStoreStep1InteriorGable'
  );
  // Store side (`+x` at `u = 12.28..12.315m`) painted plasterboard lining extending up to the Store vaulted ceiling (`barnCeilRidgeY`)
  addInteriorPlasterGableWall(
    firstFloorGroup,
    uStoreStart + 0.21,
    uStoreStart + 0.245,
    vEastRangeNorth + wallT,
    vEastRangeSouth - wallT,
    eastRangeGroundTopY,
    barnCeilEaveY,
    barnCeilRidgeY,
    'outbuildings.storeWestInteriorPlasterGable'
  );

  // Internal Cross-Wall at u = 14.96m..15.20m (Store/Barn partition): painted on both sides all the way up to the Level 2 vaulted ceiling!
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
  addInteriorPlasterGableWall(
    firstFloorGroup,
    uBarnStart,
    uBarnStart + 0.24,
    vEastRangeNorth + wallT,
    vEastRangeSouth - wallT,
    eastRangeGroundTopY,
    barnCeilEaveY,
    barnCeilRidgeY,
    'outbuildings.storeBarnPartitionGable'
  );

  // Internal Cross-Wall at u = 23.02m..23.22m (Barn/Stable Step #2):
  // - Below the Barn Mezzanine (`y = baseYBarnEnd..mezzanineFloorY = 1.54m`): full width `v = 0.28..5.43m`.
  // - Above `mezzanineFloorY = 1.54m` up to `stableGroundTopY = 2.52m`: central `UP` stair opening at `v = 2.40..3.30m`
  //   with solid painted walls on North (`v = 0.28..2.40m`) and South (`v = 3.30..5.43m`), plus a painted riser bulkhead
  //   closing the space below `stableGroundTopY = 2.52m` on the Stable ground-floor side!
  addOutbuildingBrickWall(
    groundGroup,
    uBarnEnd - partT,
    uBarnEnd,
    baseYBarnEnd - 0.14,
    mezzanineFloorY,
    vEastRangeNorth + wallT,
    vEastRangeSouth - wallT,
    ['+x', '-x']
  );
  addOutbuildingBrickWall(
    groundGroup,
    uBarnEnd - partT,
    uBarnEnd,
    mezzanineFloorY,
    stableGroundTopY,
    vEastRangeNorth + wallT,
    2.4,
    ['+x', '-x']
  );
  addOutbuildingBrickWall(
    groundGroup,
    uBarnEnd - partT,
    uBarnEnd,
    mezzanineFloorY,
    stableGroundTopY,
    3.3,
    vEastRangeSouth - wallT,
    ['+x', '-x']
  );
  addOutbuildingBrickWall(
    groundGroup,
    uBarnEnd - 0.06,
    uBarnEnd,
    mezzanineFloorY,
    stableGroundTopY,
    2.4,
    3.3,
    ['+x', '-x']
  );

  // South Garden Wall of Store & Barn (Ground Floor: u = 12.07m..23.22m, y = baseY12..1.94m)
  addOutbuildingBrickWallWithWindows(
    groundGroup,
    uStoreStart,
    uBarnEnd,
    baseY12 - 0.14,
    eastRangeGroundTopY,
    vEastRangeSouth - wallT,
    vEastRangeSouth,
    ['-z'],
    [
      { uCenter: 18.05, yCenter: baseYBarnMid + 1.05, width: 0.92, height: 0.88 },
      { uCenter: 21.05, yCenter: baseYBarnMid + 1.05, width: 0.92, height: 0.88 },
    ]
  );

  // South Garden Wall of 2-Storey Stable (Ground Floor: u = 23.22m..28.77m, rising to the higher `stableGroundTopY = 2.52m` — Issue #3!)
  addOutbuildingBrickWallWithWindows(
    groundGroup,
    uStableStart,
    uStableEnd - wallT,
    baseYBarnEnd - 0.14,
    stableGroundTopY,
    vEastRangeSouth - wallT,
    vEastRangeSouth,
    ['-z'],
    [{ uCenter: 26.35, yCenter: baseYStableMid + 1.32, width: 0.96, height: 1.08 }]
  );

  // North Courtyard Wall of Store & Barn (Ground Floor: v = 0.00m..0.28m, u = 12.07m..23.22m, y = baseY..1.94m)
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

  // Continuous flush red-brick wall from Barn door (u = 16.85m) to Barn East end (u = 23.22m)
  addOutbuildingBrickWall(
    groundGroup,
    16.85,
    uBarnEnd,
    baseYBarnMid - 0.14,
    eastRangeGroundTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z']
  );

  // North Courtyard Wall of 2-Storey Stable (Ground Floor: u = 23.22m..28.77m, rising to the higher `stableGroundTopY = 2.52m` — Issue #3!)
  addOutbuildingBrickWall(
    groundGroup,
    uStableStart,
    23.8,
    baseYStableMid - 0.14,
    stableGroundTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z']
  );
  addOutbuildingBrickWall(
    groundGroup,
    23.8,
    24.7,
    baseYStableMid + 2.04,
    stableGroundTopY,
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
    stableGroundTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z'],
    [{ uCenter: 26.55, yCenter: baseYStableMid + 1.32, width: 0.92, height: 1.08 }]
  );

  // East Gable End of 2-Storey Stable (Ground Floor: u = 28.77m..29.05m, v = 0.00m..5.71m, rising to `stableGroundTopY = 2.52m`) with Large Gable Window
  const vEastRangeMid = (vEastRangeNorth + vEastRangeSouth) * 0.5;
  addOutbuildingBrickWall(
    groundGroup,
    uStableEnd - wallT,
    uStableEnd,
    baseYStableEnd - 0.14,
    stableGroundTopY,
    vEastRangeNorth,
    vEastRangeMid - 0.62,
    ['-x']
  );
  addOutbuildingBrickWall(
    groundGroup,
    uStableEnd - wallT,
    uStableEnd,
    baseYStableEnd - 0.14,
    baseYStableEnd + 0.68,
    vEastRangeMid - 0.62,
    vEastRangeMid + 0.62,
    ['-x']
  );
  addOutbuildingBrickWall(
    groundGroup,
    uStableEnd - wallT,
    uStableEnd,
    baseYStableEnd + 1.94,
    stableGroundTopY,
    vEastRangeMid - 0.62,
    vEastRangeMid + 0.62,
    ['-x']
  );
  addOutbuildingBrickWall(
    groundGroup,
    uStableEnd - wallT,
    uStableEnd,
    baseYStableEnd - 0.14,
    stableGroundTopY,
    vEastRangeMid + 0.62,
    vEastRangeSouth,
    ['-x']
  );
  addOutbuildingWindow(
    groundGroup,
    uStableEnd - wallT * 0.5,
    baseYStableEnd + 1.31,
    vEastRangeMid,
    1.24,
    1.26,
    true
  );

  // Cast-iron rainwater downpipes at Step #1 (`u = 12.14m`) and Step #2 (`u = 23.28m`)
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

  // Wall-clinging Climbing Ivy on the North Courtyard Brick Wall of the Store & Barn (u = 14.5m..17.6m)
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
  // 2B. OPPOSING INTERNAL BRICK PILASTERS, PRECISION-MITERED WEATHERED-OAK KING-POST
  //     ROOF TRUSSES & TRUSS SPOTLIGHTS (Issues #1, #2, #8 & #9!)
  //     - Issue #1 ("only 1 truss in here and its at the front of the mezzanine. I think the mezzanine is a little lower down too (lowish ceiling underneath)"
  //       at `[-1.842, 2.082, 17.548]`):
  //       Replaced the 2 Barn trusses with 1 single Barn truss (`outbuildings.roofTruss.barn`) right at the front of the mezzanine (`u = 18.68m`).
  //     - Issue #2 ("This is a usable top floor so I dont think there is a big truss in here" at `[2.917, 2.21, 16.337]`):
  //       Removed the roof truss from the Stable upper room (`u = 25.45m`), keeping only the ground-floor pilasters below the Stable ceiling.
  //     - Issue #8 ("Clean up this mesh" at `[-13.092, 1.994, 19.782]`):
  //       Rebuilt all angled truss timbers using exact 2D polygon mitered extrusions with zero overlapping `wallPost` or protruding box corners.
  //     - Issue #9 ("Spotlights in the trusses" at `[-13.062, 2.052, 20.127]`):
  //       Mounted 4 directional architectural spotlights with warm glowing LED lenses along each oak roof truss.
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

  const pilasterW = 0.3;
  const pilasterD = 0.16;
  const vInnerNorth = wallT; // 0.28m
  const vInnerSouth = vWestRangeSouth - wallT; // 5.43m
  const vSpanInternal = vInnerSouth - vInnerNorth; // 5.15m

  function vMidCenter(): number {
    return (vInnerNorth + vInnerSouth) * 0.5;
  }

  // Ground-floor opposing brick pilasters in the Stable (`u = 25.45m`, rising cleanly to `stableGroundTopY = 2.52m`, NO truss above per Issue #2!)
  for (const [vPMin, vPMax, pFace] of [
    [vInnerNorth, vInnerNorth + pilasterD, '+z'],
    [vInnerSouth - pilasterD, vInnerSouth, '-z'],
  ] as const) {
    addOutbuildingBrickWall(
      groundGroup,
      25.45 - pilasterW * 0.5,
      25.45 + pilasterW * 0.5,
      baseYStableMid - 0.08,
      stableGroundTopY - 0.08,
      vPMin,
      vPMax,
      ['+x', '-x', pFace]
    );
    const padstone = new THREE.Mesh(
      new THREE.BoxGeometry(pilasterW + 0.04, 0.08, pilasterD + 0.03),
      stoneSillMat
    );
    padstone.name = 'outbuildings.pilasterPadstone.stable';
    padstone.position.set(25.45, stableGroundTopY - 0.04, (vPMin + vPMax) * 0.5);
    groundGroup.add(padstone);
  }

  interface BarnTrussBaySpec {
    readonly id: string;
    readonly uCenter: number;
    readonly baseY: number;
    readonly tieBottomY: number;
    readonly ceilEaveY: number;
    readonly ceilRidgeY: number;
  }

  const barnTrussBays: ReadonlyArray<BarnTrussBaySpec> = [
    // Bay 1: GYM (`u = 2.86m`)
    {
      id: 'gym',
      uCenter: 2.86,
      baseY: baseY0,
      tieBottomY: northWestWallTopY,
      ceilEaveY: westRangeCeilEaveY,
      ceilRidgeY: westRangeCeilRidgeY,
    },
    // Bay 2: Garage (`u = 8.92m` — Issues #8 & #9)
    {
      id: 'garage',
      uCenter: 8.92,
      baseY: (baseY0 + baseY12) * 0.5,
      tieBottomY: northWestWallTopY,
      ceilEaveY: westRangeCeilEaveY,
      ceilRidgeY: westRangeCeilRidgeY,
    },
    // Bay 3: Store (`u = 13.65m`)
    {
      id: 'store',
      uCenter: 13.65,
      baseY: baseYStoreEnd,
      tieBottomY: barnUpperTopY - 0.2,
      ceilEaveY: barnCeilEaveY,
      ceilRidgeY: barnCeilRidgeY,
    },
    // Bay 4: Barn — Issue #1: ONLY 1 truss in the Barn, located right at the front edge of the mezzanine (`u = 18.68m`)!
    {
      id: 'barn',
      uCenter: uMezzanineFront,
      baseY: baseYBarnMid,
      tieBottomY: barnUpperTopY - 0.2,
      ceilEaveY: barnCeilEaveY,
      ceilRidgeY: barnCeilRidgeY,
    },
  ];

  for (const bay of barnTrussBays) {
    const padstoneH = 0.085;
    const pilasterTopY = bay.tieBottomY - padstoneH;

    // 1. Opposing North & South Internal Brick Pilasters (`0.30m` wide x `0.16m` deep) stopping cleanly below the Yorkstone padstone
    addOutbuildingBrickWall(
      groundGroup,
      bay.uCenter - pilasterW * 0.5,
      bay.uCenter + pilasterW * 0.5,
      bay.baseY - 0.08,
      pilasterTopY,
      vInnerNorth,
      vInnerNorth + pilasterD,
      ['+x', '-x', '+z']
    );
    addOutbuildingBrickWall(
      groundGroup,
      bay.uCenter - pilasterW * 0.5,
      bay.uCenter + pilasterW * 0.5,
      bay.baseY - 0.08,
      pilasterTopY,
      vInnerSouth - pilasterD,
      vInnerSouth,
      ['+x', '-x', '-z']
    );

    for (const vPad of [vInnerNorth + pilasterD * 0.5, vInnerSouth - pilasterD * 0.5]) {
      const padstone = new THREE.Mesh(
        new THREE.BoxGeometry(pilasterW + 0.04, padstoneH, pilasterD + 0.03),
        stoneSillMat
      );
      padstone.name = `outbuildings.pilasterPadstone.${bay.id}`;
      padstone.position.set(bay.uCenter, bay.tieBottomY - padstoneH * 0.5, vPad);
      padstone.castShadow = true;
      padstone.receiveShadow = true;
      groundGroup.add(padstone);
    }

    // 2. Precision-Mitered Weathered-Oak King-Post Roof Truss (`outbuildings.roofTruss.<id>` — Issue #8!)
    const trussGroup = new THREE.Group();
    trussGroup.name = `outbuildings.roofTruss.${bay.id}`;
    trussGroup.position.set(bay.uCenter, 0, vMidCenter());
    trussesGroup.add(trussGroup);

    const tieH = 0.2;
    const tieW = 0.2;
    const tieBottomY = bay.tieBottomY;
    const tieMidY = tieBottomY + tieH * 0.5;
    const tieTopY = tieBottomY + tieH;
    const halfSpan = vSpanInternal * 0.5; // 2.575m
    const rafterApexY = bay.ceilRidgeY - 0.01;
    const trussRise = rafterApexY - tieTopY;
    const slopeTan = trussRise / halfSpan;
    const cosPitch = 1 / Math.hypot(1, slopeTan);
    const rafterVertDepth = 0.175 / cosPitch; // ~0.195m vertical depth of principal rafter
    const halfKingZ = 0.09; // 0.18m wide central King-Post

    // Main horizontal oak tie-beam spanning from North padstone to South padstone (`z = -halfSpan..+halfSpan`)
    const tieBeam = new THREE.Mesh(
      new THREE.BoxGeometry(tieW, tieH, vSpanInternal),
      trussOakMat
    );
    tieBeam.name = `outbuildings.roofTruss.${bay.id}.tieBeam`;
    tieBeam.position.set(0, tieMidY, 0);
    tieBeam.castShadow = true;
    tieBeam.receiveShadow = true;
    trussGroup.add(tieBeam);

    // Helper for top and bottom edge of the principal rafter at distance `az = |z|` from center
    const yRafterTop = (az: number): number => rafterApexY - az * slopeTan;
    const yRafterBot = (az: number): number => yRafterTop(az) - rafterVertDepth;
    const zRafterInnerFoot = Math.max(halfKingZ + 0.2, halfSpan - rafterVertDepth / slopeTan);

    // North (-1) and South (+1) Mitered Principal Rafters, Mitered Diagonal Struts & Mitered Knee Braces
    for (const sideV of [-1, 1] as const) {
      // A. Mitered Principal Rafter: flat horizontal birdsmouth on `y = tieTopY` & vertical plumb cut at `z = sideV * halfKingZ`
      const rafterW = 0.18;
      const rafterGeo = createExtrudedVYPolygon(
        [
          [sideV * halfKingZ, yRafterTop(halfKingZ)],
          [sideV * halfSpan, tieTopY],
          [sideV * zRafterInnerFoot, tieTopY],
          [sideV * halfKingZ, yRafterBot(halfKingZ)],
        ],
        rafterW
      );
      const principalRafter = new THREE.Mesh(rafterGeo, trussOakMat);
      principalRafter.name = `outbuildings.roofTruss.${bay.id}.principalRafter`;
      principalRafter.position.set(-rafterW * 0.5, 0, 0);
      principalRafter.castShadow = true;
      principalRafter.receiveShadow = true;
      trussGroup.add(principalRafter);

      // B. Mitered Diagonal Oak Strut: vertical plumb cut against King-Post (`|z| = halfKingZ`) & sloped cut flush against `yRafterBot(|z|)`
      const strutW = 0.14;
      const zStrutTopInner = 1.12;
      const zStrutTopOuter = 1.32;
      const yStrutBaseBot = tieTopY + 0.12;
      const yStrutBaseTop = tieTopY + 0.28;
      const strutGeo = createExtrudedVYPolygon(
        [
          [sideV * halfKingZ, yStrutBaseTop],
          [sideV * zStrutTopInner, yRafterBot(zStrutTopInner)],
          [sideV * zStrutTopOuter, yRafterBot(zStrutTopOuter)],
          [sideV * halfKingZ, yStrutBaseBot],
        ],
        strutW
      );
      const strut = new THREE.Mesh(strutGeo, trussDarkOakMat);
      strut.name = `outbuildings.roofTruss.${bay.id}.strut`;
      strut.position.set(-strutW * 0.5, 0, 0);
      strut.castShadow = true;
      trussGroup.add(strut);

      // C. Mitered Oak Knee Brace: vertical edge flush against inner face of brick pilaster (`|z| = halfSpan - pilasterD = 2.415m`)
      //    and horizontal top edge flush against underside of tie-beam (`y = tieBottomY`) — zero protruding box corners!
      const braceW = 0.14;
      const zPilasterFace = halfSpan - pilasterD; // 2.415m
      const zBraceTieInner = 1.88;
      const zBraceTieOuter = 2.06;
      const yBracePilasterTop = tieBottomY - 0.34;
      const yBracePilasterBot = tieBottomY - 0.52;
      const kneeBraceGeo = createExtrudedVYPolygon(
        [
          [sideV * zBraceTieInner, tieBottomY],
          [sideV * zBraceTieOuter, tieBottomY],
          [sideV * zPilasterFace, yBracePilasterTop],
          [sideV * zPilasterFace, yBracePilasterBot],
        ],
        braceW
      );
      const kneeBrace = new THREE.Mesh(kneeBraceGeo, trussOakMat);
      kneeBrace.name = `outbuildings.roofTruss.${bay.id}.kneeBrace`;
      kneeBrace.position.set(-braceW * 0.5, 0, 0);
      kneeBrace.castShadow = true;
      trussGroup.add(kneeBrace);

      // Wrought-iron heel strap at the tie-beam / principal rafter foot junction
      const heelStrap = new THREE.Mesh(
        new THREE.BoxGeometry(tieW + 0.016, tieH - 0.02, 0.055),
        castIronMat
      );
      heelStrap.position.set(0, tieMidY, sideV * (zRafterInnerFoot + 0.06));
      trussGroup.add(heelStrap);
    }

    // D. Central Mitered Oak King-Post rising from `y = tieTopY` to the ridge apex (`z = -halfKingZ..+halfKingZ`)
    const kingPostW = 0.18;
    const kingPostGeo = createExtrudedVYPolygon(
      [
        [-halfKingZ, tieTopY],
        [halfKingZ, tieTopY],
        [halfKingZ, yRafterTop(halfKingZ)],
        [0, rafterApexY],
        [-halfKingZ, yRafterTop(halfKingZ)],
      ],
      kingPostW
    );
    const kingPost = new THREE.Mesh(kingPostGeo, trussDarkOakMat);
    kingPost.name = `outbuildings.roofTruss.${bay.id}.kingPost`;
    kingPost.position.set(-kingPostW * 0.5, 0, 0);
    kingPost.castShadow = true;
    trussGroup.add(kingPost);

    // Traditional black wrought-iron U-stirrup strap clamping the king-post foot to the tie-beam
    const ironStirrup = new THREE.Mesh(
      new THREE.BoxGeometry(tieW + 0.018, tieH + 0.14, 0.058),
      castIronMat
    );
    ironStirrup.position.set(0, tieMidY + 0.07, 0);
    trussGroup.add(ironStirrup);

    // 3. Issue #9 ("Spotlights in the trusses" at `[-13.062, 2.052, 20.127]`):
    //    4 Adjustable Architectural Directional Spotlights mounted along each oak roof truss
    const spotZPositions = [-1.88, -0.74, 0.74, 1.88] as const;
    for (let sIdx = 0; sIdx < spotZPositions.length; sIdx++) {
      const sz = spotZPositions[sIdx];
      const aimSignZ = sz < 0 ? -1 : 1;

      const spotGroup = new THREE.Group();
      spotGroup.name = `outbuildings.roofTruss.${bay.id}.spotlight.${sIdx + 1}`;
      spotGroup.position.set(0, tieBottomY, sz);
      trussGroup.add(spotGroup);

      // Brushed-brass circular mounting base plate fixed to the underside of the oak tie-beam
      const basePlate = new THREE.Mesh(
        new THREE.CylinderGeometry(0.036, 0.036, 0.012, 14),
        spotlightBrassTrimMat
      );
      basePlate.position.set(0, -0.006, 0);
      spotGroup.add(basePlate);

      // Dark-bronze U-stirrup yoke stem dropping down from the base plate
      const yokeStem = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.048, 0.044),
        spotlightHousingMat
      );
      yokeStem.position.set(0, -0.03, 0);
      spotGroup.add(yokeStem);

      // Pivoted cylindrical spotlight canister + warm LED emitter lens
      const headPivot = new THREE.Group();
      headPivot.position.set(0, -0.048, 0);
      headPivot.rotation.x = aimSignZ * 0.28;
      spotGroup.add(headPivot);

      const canister = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.088, 16),
        spotlightHousingMat
      );
      canister.castShadow = true;
      headPivot.add(canister);

      const bezelRing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.031, 0.031, 0.014, 16),
        spotlightBrassTrimMat
      );
      bezelRing.position.set(0, -0.04, 0);
      headPivot.add(bezelRing);

      const lensMat = new THREE.MeshStandardMaterial({
        color: 0xfff3d6,
        emissive: new THREE.Color(0xffca70),
        emissiveIntensity: 1.65,
        roughness: 0.18,
        metalness: 0.05,
      });
      const lensDisc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.006, 16),
        lensMat
      );
      lensDisc.name = `outbuildings.roofTruss.${bay.id}.spotlightLens.${sIdx + 1}`;
      lensDisc.position.set(0, -0.045, 0);
      headPivot.add(lensDisc);
    }
  }

  // Longitudinal Oak Ridge Beams & Mid-Slope Trench Purlins segmented cleanly per room bay so they never poke through walls
  for (const [u0, u1, tieBottomY, ceilRidgeY] of [
    [wallT, uGymEnd, northWestWallTopY, westRangeCeilRidgeY],
    [uGymEnd + partT, uGarageEnd, northWestWallTopY, westRangeCeilRidgeY],
    [uStoreStart + 0.24, uBarnStart, barnUpperTopY - 0.2, barnCeilRidgeY],
    [uBarnStart + 0.24, uBarnEnd - partT, barnUpperTopY - 0.2, barnCeilRidgeY],
  ] as const) {
    const spanU = u1 - u0;
    const midU = (u0 + u1) * 0.5;
    const tieTopY = tieBottomY + 0.2;
    const trussRise = ceilRidgeY - 0.01 - tieTopY;
    const purlinY = tieTopY + trussRise * 0.5 - 0.08;
    const purlinOffsetV = vSpanInternal * 0.25;

    const ridgeBeam = new THREE.Mesh(
      new THREE.BoxGeometry(spanU, 0.15, 0.13),
      trussDarkOakMat
    );
    ridgeBeam.position.set(midU, ceilRidgeY - 0.085, vMidCenter());
    ridgeBeam.castShadow = true;
    trussesGroup.add(ridgeBeam);

    for (const sideV of [-1, 1] as const) {
      const purlin = new THREE.Mesh(
        new THREE.BoxGeometry(spanU, 0.13, 0.13),
        trussOakMat
      );
      purlin.position.set(midU, purlinY, vMidCenter() + sideV * purlinOffsetV);
      purlin.castShadow = true;
      trussesGroup.add(purlin);
    }
  }

  // =========================================================================
  // 2C. BARN MEZZANINE LOWERED DECK, LOWISH UNDER-CEILING SOFFIT, BALUSTRADE & STAIRS (`Issue #1`)
  //     AND TALL STABLE GROUND-FLOOR CEILING SOFFIT (`Issue #3`)
  // =========================================================================
  // Issue #1: Plastered lowish ceiling soffit (`y = 1.40m`, `1.72m` headroom above `-0.32m` Barn floor)
  // and front oak mezzanine bressummer beam (`u = 18.68m`) in `groundGroup` so the low ceiling underneath
  // is visible in both Ground and First Floor views!
  const mezzanineCeilingSoffit = new THREE.Mesh(
    new THREE.BoxGeometry(4.34, 0.035, eastRangeInternalV),
    warmRoomPlasterMat
  );
  mezzanineCeilingSoffit.name = 'outbuildings.barn.mezzanineCeilingSoffit';
  mezzanineCeilingSoffit.position.set(
    uMezzanineFront + 4.34 * 0.5,
    mezzanineUndersideY + 0.018,
    vMidCenter()
  );
  mezzanineCeilingSoffit.receiveShadow = true;
  groundGroup.add(mezzanineCeilingSoffit);

  const mezzanineFrontBressummer = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.18, eastRangeInternalV),
    trussOakMat
  );
  mezzanineFrontBressummer.name = 'outbuildings.barn.mezzanineFrontBeam';
  mezzanineFrontBressummer.position.set(
    uMezzanineFront + 0.09,
    mezzanineFloorY - 0.09,
    vMidCenter()
  );
  mezzanineFrontBressummer.castShadow = true;
  groundGroup.add(mezzanineFrontBressummer);

  // Issue #3: High plastered ground-floor ceiling soffit in the 2-Storey Stable (`y = 2.52m`, `2.74m` headroom above `-0.22m`)
  const stableGroundCeilingSoffit = new THREE.Mesh(
    new THREE.BoxGeometry(5.55, 0.035, eastRangeInternalV),
    warmRoomPlasterMat
  );
  stableGroundCeilingSoffit.name = 'outbuildings.stable.groundCeilingSoffit';
  stableGroundCeilingSoffit.position.set(
    uStableStart + 5.55 * 0.5,
    stableGroundTopY + 0.018,
    vMidCenter()
  );
  stableGroundCeilingSoffit.receiveShadow = true;
  groundGroup.add(stableGroundCeilingSoffit);

  // =========================================================================
  // 3. OUTBUILDING FIRST FLOOR OVER BARN MEZZANINE & 2-STOREY STABLE (Issues #1, #2, #3, #7 & #10!)
  // =========================================================================
  // West First-Floor Room (Barn Mezzanine) Timber Slab (`4.34m x 5.15m`, u = 18.68m..23.02m, lowered to `mezzanineFloorY = 1.54m` — Issue #1!)
  const westUpperRoomSlab = new THREE.Mesh(
    new THREE.BoxGeometry(4.34, 0.11, eastRangeInternalV),
    oakFloorMat
  );
  westUpperRoomSlab.name = 'outbuildings.firstFloor.westRoomSlab';
  westUpperRoomSlab.position.set(
    uMezzanineFront + 4.34 * 0.5,
    mezzanineFloorY - 0.055,
    vEastRangeNorth + wallT + eastRangeInternalV * 0.5
  );
  westUpperRoomSlab.receiveShadow = true;
  firstFloorGroup.add(westUpperRoomSlab);

  // Open Mezzanine Timber Guardrail / Balustrade along the front edge of the Barn Mezzanine (`u = 18.74m, v = 0.28..4.35m` — Issue #1!)
  const handrailLenV = 4.08;
  const handrailCenterV = vInnerNorth + handrailLenV * 0.5;
  const mezzanineTopRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.065, handrailLenV),
    trussOakMat
  );
  mezzanineTopRail.name = 'outbuildings.firstFloor.mezzanineHandrail';
  mezzanineTopRail.position.set(uMezzanineFront + 0.08, mezzanineFloorY + 0.92, handrailCenterV);
  firstFloorGroup.add(mezzanineTopRail);

  const mezzanineBottomRail = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.05, handrailLenV),
    trussOakMat
  );
  mezzanineBottomRail.position.set(uMezzanineFront + 0.08, mezzanineFloorY + 0.08, handrailCenterV);
  firstFloorGroup.add(mezzanineBottomRail);

  const numBalusters = 16;
  for (let b = 0; b <= numBalusters; b++) {
    const bv = vInnerNorth + 0.06 + (b / numBalusters) * (handrailLenV - 0.12);
    const isNewel = b === 0 || b === numBalusters || b === 8;
    const baluster = new THREE.Mesh(
      new THREE.BoxGeometry(isNewel ? 0.085 : 0.038, isNewel ? 0.98 : 0.84, isNewel ? 0.085 : 0.038),
      isNewel ? trussDarkOakMat : trussOakMat
    );
    baluster.position.set(
      uMezzanineFront + 0.08,
      mezzanineFloorY + (isNewel ? 0.49 : 0.48),
      bv
    );
    firstFloorGroup.add(baluster);
  }

  // East First-Floor Room Timber Slab (`5.55m x 5.15m`, u = 23.22m..28.77m, raised to `stableUpperFloorY = 2.66m` — Issue #2 & Issue #3!)
  const eastUpperRoomSlab = new THREE.Mesh(
    new THREE.BoxGeometry(5.55, 0.11, eastRangeInternalV),
    oakFloorMat
  );
  eastUpperRoomSlab.name = 'outbuildings.firstFloor.stableRoomSlab';
  eastUpperRoomSlab.position.set(
    uStableStart + 5.55 * 0.5,
    stableUpperFloorY - 0.055,
    vEastRangeNorth + wallT + eastRangeInternalV * 0.5
  );
  eastUpperRoomSlab.receiveShadow = true;
  firstFloorGroup.add(eastUpperRoomSlab);

  // STEP #1 Upper Exterior Brick Walls of Level 2 (`Store + Barn`: u = 12.07m..23.22m, y = eastRangeGroundTopY..barnUpperTopY)
  // North Courtyard wall has the single upper hayloft window at u = 19.85m (lowered slightly to align with `mezzanineFloorY = 1.54m`)
  addOutbuildingBrickWallWithWindows(
    firstFloorGroup,
    uStoreStart,
    uBarnEnd,
    eastRangeGroundTopY,
    barnUpperTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z'],
    [{ uCenter: 19.85, yCenter: eastRangeGroundTopY + 0.44, width: 0.78, height: 0.72 }]
  );
  // South Upper Wall of Store + Barn (solid brick, 0 windows per Floorplan)
  addOutbuildingBrickWall(
    firstFloorGroup,
    uStoreStart,
    uBarnEnd,
    eastRangeGroundTopY,
    barnUpperTopY,
    vEastRangeSouth - wallT,
    vEastRangeSouth,
    ['-z']
  );

  // Vaulted eave frieze strips inside Store (`u = 12.31..14.96m`) and Barn (`u = 15.20..23.02m`)
  addVaultedRoomEaveFriezeStrips(
    firstFloorGroup,
    uStoreStart + 0.24,
    uBarnStart,
    vInnerNorth,
    vInnerSouth,
    barnUpperTopY,
    barnCeilEaveY
  );
  addVaultedRoomEaveFriezeStrips(
    firstFloorGroup,
    uBarnStart + 0.24,
    uBarnEnd - partT,
    vInnerNorth,
    vInnerSouth,
    barnUpperTopY,
    barnCeilEaveY
  );

  // STEP #2 Upper Exterior Brick Walls of Level 3 (`2-Storey Stable`: u = 23.22m..29.05m, y = stableGroundTopY..stableUpperTopY = 2.52m..3.88m)
  // Single North 1st-floor window at u = 26.35m and single South 1st-floor window at u = 26.35m
  addOutbuildingBrickWallWithWindows(
    firstFloorGroup,
    uStableStart,
    uStableEnd,
    stableGroundTopY,
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
    stableGroundTopY,
    stableUpperTopY,
    vEastRangeSouth - wallT,
    vEastRangeSouth,
    ['-z'],
    [{ uCenter: 26.35, yCenter: stableUpperFloorY + 0.68, width: 0.88, height: 0.84 }]
  );

  // Vaulted eave frieze strips inside the 2-Storey Stable Upper Room (`u = 23.22..28.77m`)
  addVaultedRoomEaveFriezeStrips(
    firstFloorGroup,
    uStableStart,
    uStableEnd - wallT,
    vInnerNorth,
    vInnerSouth,
    stableUpperTopY,
    stableCeilEaveY
  );

  // East Upper Gable Wall of the 2-Storey Stable at u = 28.77m..29.05m (with painted interior gable lining up to the Stable vaulted ceiling!)
  addOutbuildingBrickWall(
    firstFloorGroup,
    uStableEnd - wallT,
    uStableEnd,
    stableGroundTopY,
    stableUpperTopY,
    vEastRangeNorth + wallT,
    vEastRangeSouth - wallT,
    ['-x']
  );
  addInteriorPlasterGableWall(
    firstFloorGroup,
    uStableEnd - wallT - 0.005,
    uStableEnd - wallT + 0.03,
    vInnerNorth,
    vInnerSouth,
    stableUpperTopY,
    stableCeilEaveY,
    stableCeilRidgeY,
    'outbuildings.stable.eastGableInteriorPlaster'
  );

  // Internal 1st-Floor Partition between the Barn Mezzanine (`mezzanineFloorY = 1.54m`) and the Stable Upper Room (`stableUpperFloorY = 2.66m`)
  // at u = 23.02m..23.22m with central `UP` doorway opening at v = 2.40m..3.30m (`y = 2.52..2.92m` and painted gable above up to `barnCeilRidgeY`!)
  addOutbuildingBrickWall(
    firstFloorGroup,
    uBarnEnd - partT,
    uBarnEnd,
    stableGroundTopY,
    barnUpperTopY,
    vEastRangeNorth + wallT,
    2.4,
    ['+x', '-x']
  );
  addOutbuildingBrickWall(
    firstFloorGroup,
    uBarnEnd - partT,
    uBarnEnd,
    stableGroundTopY,
    barnUpperTopY,
    3.3,
    vEastRangeSouth - wallT,
    ['+x', '-x']
  );
  addInteriorPlasterGableWall(
    firstFloorGroup,
    uBarnEnd - partT,
    uBarnEnd,
    vInnerNorth,
    vInnerSouth,
    barnUpperTopY,
    barnCeilEaveY,
    barnCeilRidgeY,
    'outbuildings.barnStablePartitionGable'
  );
  // Painted interior gable lining on the Stable side (`+x` at `u = 23.22..23.255m`) up to the Stable vaulted ceiling (`stableCeilRidgeY`)
  addInteriorPlasterGableWall(
    firstFloorGroup,
    uStableStart + wallT - 0.03,
    uStableStart + wallT + 0.005,
    vInnerNorth,
    vInnerSouth,
    barnUpperTopY,
    stableCeilEaveY,
    stableCeilRidgeY,
    'outbuildings.stable.westGableInteriorPlaster'
  );

  // 6 Central `UP` oak steps connecting the lower Barn Mezzanine (`mezzanineFloorY = 1.54m`) up to the Stable Upper Room (`stableUpperFloorY = 2.66m`)
  // & 9-Tread SE Corner `DN` Staircase in the Barn (`u = 19.35..21.15m, v = 4.55..5.38m`) descending from `mezzanineFloorY = 1.54m` to `baseYBarnMid = -0.32m`
  const numUpSteps = 6;
  const upRiseTotal = stableUpperFloorY - mezzanineFloorY; // 1.12m
  const upStepDepthU = 0.22;
  const upStartU = uBarnEnd - numUpSteps * upStepDepthU;
  for (let s = 0; s < numUpSteps; s++) {
    const stepH = upRiseTotal * ((s + 1) / numUpSteps);
    const step = new THREE.Mesh(
      new THREE.BoxGeometry(upStepDepthU, stepH, 0.88),
      oakFloorMat
    );
    step.position.set(
      upStartU + (s + 0.5) * upStepDepthU,
      mezzanineFloorY + stepH * 0.5,
      2.85
    );
    firstFloorGroup.add(step);
  }

  const numDnTreads = 9;
  const dnRiseTotal = mezzanineFloorY - baseYBarnMid; // 1.86m
  for (let s = 0; s < numDnTreads; s++) {
    const treadY = mezzanineFloorY - (s + 1) * (dnRiseTotal / (numDnTreads + 1));
    const tread = new THREE.Mesh(
      new THREE.BoxGeometry(0.84, 0.042, 0.22),
      oakFloorMat
    );
    tread.position.set(22.15, treadY, 5.18 - s * 0.21);
    groundGroup.add(tread);
  }

  // STEP #1 Roof -> Level 2 Pitched Roof + Insulated Plasterboard Vaulted Ceiling over Store & Barn (`u = 12.07m..23.22m`)
  // Notice `westGableFloorRelH = westRangeWallH + (westRangeDatumY - barnDatumY)` so the exterior brick chevron at `u = 12.07m`
  // sits strictly ABOVE the Garage roof slope (Issue #7: "Paint this wall"!)
  const garageEaveRelToBarnDatum = northWestWallTopY - barnDatumY; // 2.26m
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
    garageEaveRelToBarnDatum,
    barnUpperEaveH,
    0.06,
    0.0,
    [
      [uStoreStart + 0.24, uBarnStart],
      [uBarnStart + 0.24, uBarnEnd - partT],
    ]
  );

  // STEP #2 Roof -> Level 3 Higher Pitched Roof + Insulated Plasterboard Vaulted Ceiling over the 2-Storey Stable (`u = 23.22m..29.05m`)
  // Notice `westGableFloorRelH = barnUpperTopY - stableDatumY` so the exterior brick chevron at `u = 23.22m` sits strictly ABOVE the Barn roof slope!
  const barnEaveRelToStableDatum = barnUpperTopY - stableDatumY; // 3.14m
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
    barnEaveRelToStableDatum,
    stableUpperEaveH,
    0.06,
    0.14,
    [[uStableStart + wallT, uStableEnd - wallT]]
  );
}

