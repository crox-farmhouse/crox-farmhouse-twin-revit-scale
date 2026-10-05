import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import {
  createCourtyardStoneTexture,
  createWelshSlateRoofTexture,
  createWovenWoolCarpetTextures,
} from '../../../../engine/textures/procedural-textures.ts';
import {
  buildBarnGolfSimulator,
  buildBarnSpiralStaircase,
  buildGarageStihlWallRack,
  buildGarageWorkshopToolBench,
  buildGymOakDoorAndSkirting,
  buildNikeGrindDumbbellRack,
  createPouredResinFloorMaterial,
} from './outbuilding-interiors.ts';
import { buildPorsche992TurboS } from './porsche-992-turbo-s.ts';
import {
  buildBarnCornerBar,
  buildBarnGroundWallArtworks,
  buildBarnMezzanineRetroLounge,
  buildBarnPoolTable,
  buildStableUpperEnsuite,
} from './barn-mezzanine-retro-lounge.ts';

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
/**
 * Issue #11 ("This window needs to be frosted" at `[4.304, 2.734, 19.324]`):
 * Creates an etched/sandblasted translucent frosted glass material with fine crystalline
 * micro-grain diffusion and subtle surface bump.
 */
function createFrostedWindowGlassMaterial(): THREE.MeshStandardMaterial {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const data = img.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const n1 = Math.sin(x * 17.31 + y * 43.17) * 43758.5453;
      const f1 = n1 - Math.floor(n1);
      const n2 = Math.cos(x * 31.7 + y * 11.9) * 19283.41;
      const f2 = n2 - Math.floor(n2);
      const v = Math.round(228 + (f1 - 0.5) * 20 + (f2 - 0.5) * 14);
      data[idx] = Math.max(205, Math.min(252, v - 4));
      data[idx + 1] = Math.max(215, Math.min(255, v + 2));
      data[idx + 2] = Math.max(222, Math.min(255, v + 6));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;

  return new THREE.MeshStandardMaterial({
    name: 'outbuildingFrostedWindowGlass',
    map: tex,
    bumpMap: tex,
    bumpScale: 0.003,
    color: 0xeaf3f8,
    roughness: 0.54,
    metalness: 0.06,
    transparent: true,
    opacity: 0.84,
  });
}

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

  // Issue #6 ("When in cutaway mode hide the top of the mezzanine / ceiling when looking at the ground floor"
  // at `[-2.175, 1.428, 17.324]`, `outbuildings.barn.mezzanineCeilingSoffit`) &
  // Issue #10 (Golf Simulator top ceiling lid at `[-8.437, 2.56, 15.397]`):
  // Attached to `ctx.groundFloorCeilingGroup` so `CutawayController` automatically hides the mezzanine soffit,
  // front bressummer beam, golf simulator ceiling lid, and stable ground ceiling soffit in ground-floor cutaway mode.
  const groundCeilingGroup = new THREE.Group();
  groundCeilingGroup.name = 'outbuildings.groundCeiling';
  groundCeilingGroup.userData.isArchitecturalShell = true;
  groundCeilingGroup.userData.zone = 'courtyard';
  groundCeilingGroup.position.set(OUTBUILDING_ORIGIN_X, 0, OUTBUILDING_ORIGIN_Z);
  groundCeilingGroup.rotation.y = OUTBUILDING_ROTATION_Y;
  (ctx.groundFloorCeilingGroup ?? scene).add(groundCeilingGroup);

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

  // Issue #7 ("Limestone floor" at `[-4.501, -0.34, 17.435]`, `outbuildings.barn.westFloor`):
  // Warm Honed Cotswold / Travertine Limestone Flagstone Material
  const barnLimestoneFloorMat = new THREE.MeshStandardMaterial({
    name: 'outbuildingBarnLimestoneFloor',
    map: coursedStoneTex,
    bumpMap: coursedStoneTex,
    bumpScale: 0.008,
    color: 0xf2ece0,
    roughness: 0.58,
    metalness: 0.03,
  });

  const gymSubFloorMat = new THREE.MeshStandardMaterial({
    color: 0x222428, // Dark recessed joint bed under the 1m x 1m chamfered rubber gym tiles
    roughness: 0.9,
    metalness: 0.02,
  });
  const gymRubberTileMat = createGymRubberTileMaterial();

  // Issue #4 ("Carpet in here like the upstairs bedrooms, fix the scale" at `[5.5, 2.08, 15.313]`):
  // Exact match to `upstairsCarpetMat` in `first-floor-materials.ts` (`upstairsWovenWoolCarpet`)
  const carpetTextures = createWovenWoolCarpetTextures();
  const stableUpperCarpetMat = new THREE.MeshStandardMaterial({
    name: 'upstairsWovenWoolCarpet',
    color: 0xf7f2e8,
    map: carpetTextures.colorMap,
    bumpMap: carpetTextures.bumpMap,
    bumpScale: 0.0025,
    roughness: 0.9,
    metalness: 0.01,
  });

  // Issue #2 ("Same material on all of the stairs, and flooring (lighter oak" at `[-0.7, 1.545, 18.308]`):
  // Unified Lighter European Oak Material shared across all Mezzanine floor slabs, balustrades,
  // Haldane UK Spiral Staircase, 3-step Stable entrance stairs, and ground-floor bullnose steps!
  const lightJoineryOakMat = new THREE.MeshStandardMaterial({
    name: 'outbuildingLightJoineryOak',
    map: (oakFloorMat as THREE.MeshStandardMaterial).map ?? null,
    color: 0xe6cda8,
    roughness: 0.42,
    metalness: 0.03,
  });
  const lightJoineryOakPostMat = lightJoineryOakMat;

  // Issue #11 ("This window needs to be frosted" at `[4.304, 2.734, 19.324]`):
  const frostedWindowGlassMat = createFrostedWindowGlassMaterial();

  // Issue #2 & Issue #4: World-space UV mapping helper for outbuilding floor slabs and oak joinery (`uvScale = 0.5` matching main house)
  const applyOutbuildingFloorUVs = (
    geo: THREE.BufferGeometry,
    cx: number,
    cy: number,
    cz: number,
    uvScale: number = 0.5
  ): void => {
    const pos = geo.attributes.position;
    const norm = geo.attributes.normal;
    const uv = geo.attributes.uv;
    if (!pos || !norm || !uv) return;
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i) + cx;
      const y = pos.getY(i) + cy;
      const v = pos.getZ(i) + cz;
      const nx = Math.abs(norm.getX(i));
      const ny = Math.abs(norm.getY(i));
      if (ny >= 0.5) {
        uv.setXY(i, u * uvScale, v * uvScale);
      } else if (nx >= 0.5) {
        uv.setXY(i, v * uvScale, y * uvScale);
      } else {
        uv.setXY(i, u * uvScale, y * uvScale);
      }
    }
    uv.needsUpdate = true;
  };

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
    doorLabel: string = 'Outbuilding Door',
    hasUpperGlazing: boolean = false
  ): void => {
    const doorGroup = new THREE.Group();
    doorGroup.position.set(uCenter, yBase, vWallCenter);

    // Timber outer frame jambs & head lintel set cleanly INSIDE the masonry opening
    // so they never overlap or z-fight with the adjacent brick wall piers (Issue #6!)
    const frameDepth = wallT - 0.008;
    const jambW = 0.048;
    const headH = 0.052;
    const sillH = 0.028;

    const headFrame = new THREE.Mesh(
      new THREE.BoxGeometry(width, headH, frameDepth),
      courtyardDoorRecessMat
    );
    headFrame.position.set(0, height - headH * 0.5, 0);
    doorGroup.add(headFrame);

    for (const side of [-1, 1]) {
      const jamb = new THREE.Mesh(
        new THREE.BoxGeometry(jambW, height - headH - sillH, frameDepth),
        courtyardDoorRecessMat
      );
      jamb.position.set(
        side * (width * 0.5 - jambW * 0.5),
        sillH + (height - headH - sillH) * 0.5,
        0
      );
      doorGroup.add(jamb);
    }

    // Reclaimed stone threshold sill fitted inside the doorway opening (Issue #7: zero gap under door!)
    const sill = new THREE.Mesh(
      new THREE.BoxGeometry(width, sillH, wallT + 0.05),
      stoneSillMat
    );
    sill.position.set(0, sillH * 0.5, -0.015);
    sill.receiveShadow = true;
    doorGroup.add(sill);

    // Hinged door leaf panel(s) with vertical boarding grooves, optional upper multi-pane coach-house glazing (Issue #5),
    // & black wrought-iron strap hinges
    const clearW = width - jambW * 2;
    const clearH = height - headH - sillH;
    const numLeaves = isDoubleLeaf ? 2 : 1;
    const leafW = (clearW - (isDoubleLeaf ? 0.012 : 0)) / numLeaves;
    for (let l = 0; l < numLeaves; l++) {
      const hingeSide = isDoubleLeaf ? (l === 0 ? -1 : 1) : -1;
      const lx = isDoubleLeaf ? (l === 0 ? -leafW * 0.5 - 0.003 : leafW * 0.5 + 0.003) : 0;
      const hingePivotX = lx + hingeSide * (leafW * 0.5);
      const leafOffsetX = -hingeSide * (leafW * 0.5);

      const leafPivot = new THREE.Group();
      leafPivot.name = `outbuildings.doorPivot.${doorLabel.replace(/\s+/g, '')}.${l + 1}`;
      leafPivot.position.set(hingePivotX, sillH, -0.04);
      doorGroup.add(leafPivot);

      if (hasUpperGlazing) {
        // Issue #5 ("Add some glass to these garage doors" at `[-11.93, 0.262, 15.221]`):
        // Traditional English coach-house half-glazed door leaf:
        // - Lower solid vertical tongue-and-groove timber apron (`y = 0.003m .. 1.12m`)
        // - Upper 6-pane (`3x2`) multi-light glazed casement window (`y = 1.12m .. clearH - 0.118m`) framed by
        //   solid timber stiles (`0.115m`), top head rail (`0.115m`), and mid lock rail with chamfered drip bead!
        const lowerBoardH = clearH * 0.545; // ~1.12m
        const stileW = 0.115;
        const topRailH = 0.115;
        const winBottomY = lowerBoardH;
        const winTopY = clearH - 0.003 - topRailH;
        const winH = winTopY - winBottomY;
        const winW = leafW - stileW * 2;
        const winCenterY = winBottomY + winH * 0.5;

        // 1. Lower solid boarded timber apron panel
        const lowerPanel = new THREE.Mesh(
          new THREE.BoxGeometry(leafW, lowerBoardH - 0.003, 0.052),
          mat
        );
        lowerPanel.position.set(leafOffsetX, (lowerBoardH + 0.003) * 0.5, 0);
        lowerPanel.castShadow = true;
        lowerPanel.receiveShadow = true;
        leafPivot.add(lowerPanel);

        // Vertical tongue-and-groove shadow battens on the lower boarded apron
        const numPlanks = Math.max(4, Math.round(leafW / 0.14));
        for (let p = 1; p < numPlanks; p++) {
          const px = leafOffsetX - leafW * 0.5 + (p / numPlanks) * leafW;
          const groove = new THREE.Mesh(
            new THREE.BoxGeometry(0.012, lowerBoardH - 0.06, 0.058),
            courtyardDoorRecessMat
          );
          groove.position.set(px, lowerBoardH * 0.5, 0);
          leafPivot.add(groove);
        }

        // Moulded mid lock-rail & weather-drip sill bar at `y = lowerBoardH`
        const lockRail = new THREE.Mesh(
          new THREE.BoxGeometry(leafW + 0.004, 0.068, 0.064),
          courtyardDoorRecessMat
        );
        lockRail.position.set(leafOffsetX, lowerBoardH - 0.018, 0);
        lockRail.castShadow = true;
        leafPivot.add(lockRail);

        // 2. Left & right upper solid timber door stiles framing the glazed opening
        for (const sSide of [-1, 1] as const) {
          const upperStile = new THREE.Mesh(
            new THREE.BoxGeometry(stileW, clearH - 0.003 - lowerBoardH, 0.052),
            mat
          );
          upperStile.position.set(
            leafOffsetX + sSide * (leafW * 0.5 - stileW * 0.5),
            lowerBoardH + (clearH - 0.003 - lowerBoardH) * 0.5,
            0
          );
          upperStile.castShadow = true;
          upperStile.receiveShadow = true;
          leafPivot.add(upperStile);
        }

        // 3. Top solid timber head rail
        const topRail = new THREE.Mesh(
          new THREE.BoxGeometry(winW + 0.004, topRailH, 0.052),
          mat
        );
        topRail.position.set(leafOffsetX, clearH - 0.003 - topRailH * 0.5, 0);
        topRail.castShadow = true;
        topRail.receiveShadow = true;
        leafPivot.add(topRail);

        // 4. Recessed dark timber glazing bead frame inside the window aperture
        for (const gSide of [-1, 1] as const) {
          const vBead = new THREE.Mesh(
            new THREE.BoxGeometry(0.022, winH, 0.056),
            courtyardDoorRecessMat
          );
          vBead.position.set(leafOffsetX + gSide * (winW * 0.5 - 0.011), winCenterY, 0);
          leafPivot.add(vBead);

          const hBead = new THREE.Mesh(
            new THREE.BoxGeometry(winW, 0.022, 0.056),
            courtyardDoorRecessMat
          );
          hBead.position.set(leafOffsetX, winCenterY + gSide * (winH * 0.5 - 0.011), 0);
          leafPivot.add(hBead);
        }

        // 5. Clear architectural coach-house window glass pane (`outbuildings.garageDoor.glass`)
        const glassPane = new THREE.Mesh(
          new THREE.BoxGeometry(winW - 0.02, winH - 0.02, 0.014),
          windowGlassMat
        );
        glassPane.name = 'outbuildings.garageDoor.glass';
        glassPane.position.set(leafOffsetX, winCenterY, 0);
        leafPivot.add(glassPane);

        // 6. Traditional 6-light (`3 columns x 2 rows`) coach-house glazing bars (muntins)
        for (const colOffset of [-winW / 6, winW / 6] as const) {
          const vMuntin = new THREE.Mesh(
            new THREE.BoxGeometry(0.022, winH - 0.02, 0.034),
            courtyardDoorRecessMat
          );
          vMuntin.position.set(leafOffsetX + colOffset, winCenterY, 0);
          vMuntin.castShadow = true;
          leafPivot.add(vMuntin);
        }
        const hMuntin = new THREE.Mesh(
          new THREE.BoxGeometry(winW - 0.02, 0.022, 0.034),
          courtyardDoorRecessMat
        );
        hMuntin.position.set(leafOffsetX, winCenterY, 0);
        hMuntin.castShadow = true;
        leafPivot.add(hMuntin);
      } else {
        const leafPanel = new THREE.Mesh(
          new THREE.BoxGeometry(leafW, clearH - 0.006, 0.052),
          mat
        );
        leafPanel.position.set(leafOffsetX, clearH * 0.5, 0);
        leafPanel.castShadow = true;
        leafPanel.receiveShadow = true;
        leafPivot.add(leafPanel);

        // Vertical tongue-and-groove shadow battens along the front (-v) face
        const numPlanks = Math.max(4, Math.round(leafW / 0.14));
        for (let p = 1; p < numPlanks; p++) {
          const px = leafOffsetX - leafW * 0.5 + (p / numPlanks) * leafW;
          const groove = new THREE.Mesh(
            new THREE.BoxGeometry(0.012, clearH - 0.04, 0.058),
            courtyardDoorRecessMat
          );
          groove.position.set(px, clearH * 0.5, 0);
          leafPivot.add(groove);
        }
      }

      // Upper and lower black wrought-iron strap hinges on the courtyard (-v) face
      const strapSpan = Math.min(0.36, leafW * 0.45);
      const strapCenterX = -hingeSide * (strapSpan * 0.5 + 0.02);
      const upperStrapY = hasUpperGlazing ? clearH * 0.51 : clearH * 0.78;
      for (const hy of [clearH * 0.18, upperStrapY]) {
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
          leafOffsetX - hingeSide * (leafW * 0.5 - 0.06),
          clearH * 0.48,
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

    // Outer perimeter frame & stone threshold sill set cleanly inside the opening (Issue #6: zero brick z-fighting!)
    const frameDepth = wallT - 0.008;
    const headFrame = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.052, frameDepth),
      courtyardDoorRecessMat
    );
    headFrame.position.set(0, height - 0.026, 0);
    screenGroup.add(headFrame);

    for (const side of [-1, 1]) {
      const outerJamb = new THREE.Mesh(
        new THREE.BoxGeometry(0.046, height - 0.08, frameDepth),
        courtyardDoorRecessMat
      );
      outerJamb.position.set(side * (width * 0.5 - 0.023), height * 0.5 - 0.006, 0);
      screenGroup.add(outerJamb);
    }

    const sill = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.028, wallT + 0.05),
      stoneSillMat
    );
    sill.position.set(0, 0.014, -0.015);
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
    alongV: boolean = false,
    isFrosted: boolean = false
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

    // Architectural glazing sheet (clear or frosted per Issue #11) set cleanly inside the open window cutout (no bricks inside!)
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.09, height - 0.09, 0.018),
      isFrosted ? frostedWindowGlassMat : windowGlassMat
    );
    if (isFrosted) {
      glass.name = 'outbuildings.window.frostedGlass';
    }
    winGroup.add(glass);

    parent.add(winGroup);
  };

  interface OutbuildingWallWindowSpec {
    readonly uCenter: number;
    readonly yCenter: number;
    readonly width: number;
    readonly height: number;
    readonly isFrosted?: boolean;
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
        false,
        win.isFrosted ?? false
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
    meshName: string,
    gableMat: THREE.Material = warmRoomPlasterMat
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
    if (gableMat === exteriorBrickMat) {
      applyWorldSpaceBrickUVs(geo, OUTBUILDING_ORIGIN_X + uMin, 0, OUTBUILDING_ORIGIN_Z + vMid);
    }
    const mesh = new THREE.Mesh(geo, gableMat);
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

  // Issue #4 ("Resin poured floor" at `[-14.111, -0.509, 18.632]`) &
  // Issue #7 ("Gap on the ground under the bottom of the garage door" at `[-15.39, -0.509, 15.764]`):
  // Seamless Poured Polyurethane/Epoxy Resin Garage Floor (`garageFloorTopY = -0.50m`), extending North
  // to `v = 0.02m` right through the two wide garage door thresholds so there is zero gap under the garage doors!
  const garageResinFloorMat = createPouredResinFloorMaterial();
  const garageFloorTopY = -0.5;
  const garageFloorThickness = 0.12;
  const garageFloor = new THREE.Mesh(
    new THREE.BoxGeometry(6.1, garageFloorThickness, 5.41),
    garageResinFloorMat
  );
  garageFloor.name = 'outbuildings.garage.resinFloor';
  garageFloor.position.set(
    5.97 + 6.1 * 0.5,
    garageFloorTopY - garageFloorThickness * 0.5,
    (0.02 + 5.43) * 0.5
  );
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
    roofGroup,
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

  // Internal Partition Wall between GYM and Garage (u = 5.77m..5.97m)
  // Issue #9 ("Remove the door here and replace with large wide glass window so you can see into the garage"
  // at `[-16.479, 0.414, 18.327]`):
  // Cut a `3.40m x 1.40m` panoramic viewing window opening across `v = 1.15m..4.55m, y = baseY0 + 0.72m .. baseY0 + 2.12m`
  // using 4 non-overlapping plastered wall segments (lower sill wall, North pier, South pier, and upper lintel header):
  addOutbuildingBrickWall(
    groundGroup,
    uGymEnd,
    uGymEnd + partT,
    baseY0,
    baseY0 + 0.72,
    wallT + 0.002,
    vWestRangeSouth - wallT - 0.002,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  addOutbuildingBrickWall(
    groundGroup,
    uGymEnd,
    uGymEnd + partT,
    baseY0 + 0.72,
    northWestWallTopY,
    wallT + 0.002,
    1.15,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  addOutbuildingBrickWall(
    groundGroup,
    uGymEnd,
    uGymEnd + partT,
    baseY0 + 0.72,
    northWestWallTopY,
    4.55,
    vWestRangeSouth - wallT - 0.002,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  addOutbuildingBrickWall(
    groundGroup,
    uGymEnd,
    uGymEnd + partT,
    baseY0 + 2.12,
    northWestWallTopY,
    1.15,
    4.55,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  addInteriorPlasterGableWall(
    roofGroup,
    uGymEnd,
    uGymEnd + partT,
    wallT + 0.002,
    vWestRangeSouth - wallT - 0.002,
    northWestWallTopY,
    westRangeCeilEaveY,
    westRangeCeilRidgeY,
    'outbuildings.gymGaragePartitionGable'
  );

  // Vaulted eave frieze strips inside GYM (`u = 0.28..5.77m`) and Garage (`u = 5.97..12.07m`)
  addVaultedRoomEaveFriezeStrips(
    roofGroup,
    wallT,
    uGymEnd,
    wallT,
    vWestRangeSouth - wallT,
    northWestWallTopY,
    westRangeCeilEaveY
  );
  addVaultedRoomEaveFriezeStrips(
    roofGroup,
    uGymEnd + partT,
    uGarageEnd,
    wallT,
    vWestRangeSouth - wallT,
    northWestWallTopY,
    westRangeCeilEaveY
  );

  // Issue #2 ("Change this for an oak door. Add skirting board in this room" at `[-16.62, 0.075, 16.684]`):
  // Bespoke 4-Panel Solid European Oak Internal Door (`outbuildings.doorPivot.GymGarageInternal`) + Full GYM Perimeter Skirting Board (`outbuildings.gym.skirting`)
  buildGymOakDoorAndSkirting(
    ctx,
    groundGroup,
    baseY0,
    wallT,
    uGymEnd,
    partT,
    vWestRangeSouth,
    windowFrameMat
  );

  // Issue #3 ("Nike grind dumbell rack here" at `[-21.015, -0.123, 16.156]`):
  // 3-Tier Commercial Nike Grind Hex Dumbbell Rack (`outbuildings.gym.nikeGrindDumbbellRack`) with 10 pairs (`5–50`) of light-grey multicolour-speckled Nike Grind hex dumbbells
  buildNikeGrindDumbbellRack(groundGroup, baseY0 + 0.012);

  // Issue #4 & #5 ("Put it against this wall and cut it in to make use of the dead space behind, make it slightly longer"
  // at `[-10.226, -0.27, 17.512]`):
  // Heavy-Duty 5-Bay Stainless-Steel & Butcher-Block Workshop Tool Bench (`outbuildings.garage.toolBench`) recessed into the Garage East wall
  buildGarageWorkshopToolBench(groundGroup, garageFloorTopY, ctx);

  // Issue #1 ("Porsche 992.2 Turbo S in ocean Blue metalic here" at `[-15.013, -0.5, 18.708]`):
  buildPorsche992TurboS(groundGroup, garageFloorTopY);

  // Issue #6 (Pin at `[-12.462, -0.5, 19.84]`) & Issue #7 ("Stihl chainsaws / hedgetrimmers on the wall here" at `[-11.233, 0.427, 20.485]`):
  // High-LOD STIHL Chainsaws, Hedge Trimmers, Pole Trimmer, Blower & Battery Charger Wall Rack on the Garage South Wall (`v = 5.415m`)
  buildGarageStihlWallRack(groundGroup, garageFloorTopY);

  // Issue #8 ("Some brighter LED lighting in here (cool)" at `[-15.005, 0.851, 20.809]`, Garage South Wall at `u = 7.02m, y = 0.851m, v = 5.43m`):
  // High-Output Cool-White (`5600K`, `#ebf6ff`) Linear LED Batten Lighting System (`outbuildings.garage.ledLighting`):
  // - 4 sleek cool-white linear LED cornice batten fixtures (`1.85m` long) along the Garage North (`v = 0.31m`) & South (`v = 5.40m`) walls
  //   at `u = 7.35m` (West bay over the Porsche 992.2 Turbo S) and `u = 10.40m` (East bay over the STIHL wall rack & workbench)
  // - 2 vertical cool-white LED wall-wash light bars on the Garage South wall at `u = 7.02m` (exact hit point `[-15.005, 0.851, 20.809]`!)
  //   and `u = 8.85m` (`y = 0.25m..1.52m`)
  // - 4 overhead vaulted-ceiling cool-white linear LED battens in `groundCeilingGroup` + 2 bright cool-white `THREE.PointLight`s
  {
    const garageLedGroup = new THREE.Group();
    garageLedGroup.name = 'outbuildings.garage.ledLighting';
    groundGroup.add(garageLedGroup);

    const ledHousingMat = new THREE.MeshStandardMaterial({
      color: 0xd8dfe8,
      roughness: 0.26,
      metalness: 0.82,
    });
    const coolWhiteLedTubeMat = new THREE.MeshStandardMaterial({
      color: 0xf4faff,
      emissive: new THREE.Color(0xd8eeff),
      emissiveIntensity: 3.2,
      roughness: 0.14,
      metalness: 0.05,
    });

    // Issue #2 ("Remove this off the back wall" at `[-15.014, 0.677, 20.769]`, `outbuildings.garage.ledLighting.southVerticalDiffuser.1`):
    // Removed the vertical & horizontal LED bars from the Garage South (back) wall; kept only the 2 North over-door
    // cornice LED battens (`v = wallT + 0.024`) plus the 4 overhead ceiling LED battens and cool-white PointLights.

    // 4 Overhead High-Bay Linear Cool-White LED Strips attached to `groundCeilingGroup` (`y = 2.02m`)
    const ceilingLedGroup = new THREE.Group();
    ceilingLedGroup.name = 'outbuildings.garage.ledLighting.ceilingBattens';
    groundCeilingGroup.add(ceilingLedGroup);

    for (const cu of [7.35, 10.4] as const) {
      for (const cv of [1.85, 3.85] as const) {
        const cHousing = new THREE.Mesh(
          new THREE.BoxGeometry(2.05, 0.032, 0.056),
          ledHousingMat
        );
        cHousing.position.set(cu, 2.02, cv);
        ceilingLedGroup.add(cHousing);

        const cDiffuser = new THREE.Mesh(
          new THREE.BoxGeometry(2.0, 0.018, 0.042),
          coolWhiteLedTubeMat
        );
        cDiffuser.position.set(cu, 2.005, cv);
        ceilingLedGroup.add(cDiffuser);
      }
    }

    // 2 Cool-White (`5600K`, `0xe4f3ff`) PointLights illuminating the Porsche 992.2 Turbo S and East Workshop Bay
    for (const lu of [7.45, 10.35] as const) {
      const coolLight = new THREE.PointLight(0xe4f3ff, 3.6, 10.5, 1.35);
      coolLight.position.set(lu, 1.78, 2.85);
      garageLedGroup.add(coolLight);
    }
  }

  // North Courtyard Wall of GYM & Garage (v = 0.00m..0.28m, u = 0.28m..12.07m):
  // - Small GYM casement window at u = 1.49m (`0.68m x 0.78m`, clean cutout!)
  // - Full-height 4-bay glazed GYM screen at u = 3.05m..5.45m (`2.40m` wide)
  // - Two wide `2.64m` Double Garage Doors in Garage (`u = 6.08m..8.72m` and `u = 9.12m..11.76m`), seated flush on `garageFloorTopY = -0.50m` (Issue #7!)
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
  addGlazedGymCoachScreen(groundGroup, 4.25, baseY0 + 0.012, wallT * 0.5, 2.4, 2.088);

  // Pier between GYM glazed screen and Garage Double Door #1 (u = 5.45m..6.08m)
  addOutbuildingBrickWall(groundGroup, 5.45, 6.08, baseY0 - 0.14, northWestWallTopY, 0, wallT, ['+z']);

  // Garage Double Coach/Garage Door #1 (u = 6.08m..8.72m, width = 2.64m, seated flush at `garageFloorTopY = -0.50m` — Issue #7 & Issue #5!)
  const garageDoorHeight = 2.14;
  const garageDoorTopY = garageFloorTopY + garageDoorHeight; // 1.64m
  addOutbuildingBrickWall(groundGroup, 6.08, 8.72, garageDoorTopY, northWestWallTopY, 0, wallT, ['+z']);
  addBoardedBarnDoor(
    groundGroup,
    7.4,
    garageFloorTopY,
    wallT * 0.5,
    2.64,
    garageDoorHeight,
    true,
    courtyardDoorMat,
    'Garage West Double Door',
    true
  );

  // Central Brick Pier between the two Double Garage Doors (u = 8.72m..9.12m)
  addOutbuildingBrickWall(groundGroup, 8.72, 9.12, garageFloorTopY - 0.12, northWestWallTopY, 0, wallT, ['+z']);

  // Garage Double Coach/Garage Door #2 (u = 9.12m..11.76m, width = 2.64m, seated flush at `garageFloorTopY = -0.50m` — Issue #7 & Issue #5!)
  addOutbuildingBrickWall(groundGroup, 9.12, 11.76, garageDoorTopY, northWestWallTopY, 0, wallT, ['+z']);
  addBoardedBarnDoor(
    groundGroup,
    10.44,
    garageFloorTopY,
    wallT * 0.5,
    2.64,
    garageDoorHeight,
    true,
    courtyardDoorMat,
    'Garage East Double Door',
    true
  );

  // East Pier of Garage up to Step #1 at u = 12.07m
  addOutbuildingBrickWall(groundGroup, 11.76, uGarageEnd, garageFloorTopY - 0.12, northWestWallTopY, 0, wallT, ['+z']);

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
      { id: 'gymNorth', uCenter: 1.85, vCenter: 1.08, widthU: 0.84, lengthS: 1.18 },
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
  // Issue #11 ("Lower the floor height here there is only about 3 steps between the mezzanine and the upper floor of the stable" at `[2.052, 2.66, 15.82]`):
  // Lowered Stable upper floor to `2.08m` (3 steps x 0.18m above the `1.54m` Barn Mezzanine), with `stableGroundTopY = 1.96m`,
  // `stableGroundFloorY = -0.44m` (`2.40m` clear ground-floor ceiling height), `stableUpperTopY = 3.32m`, and `stableRidgeY = 4.92m`.
  const stableUpperEaveH = 3.54; // Level 3 (2-Storey Stable) eave height above stableDatumY -> world Y = 3.32m
  const stableRidgeH = 5.14; // Level 3 (2-Storey Stable) ridge height above stableDatumY -> world Y = 4.92m

  const baseYBarnStart = getBaseYAtU(uBarnStart); // -0.39m

  const barnDatumY = -0.32;
  const stableDatumY = -0.22;
  const eastRangeGroundTopY = barnDatumY + eastRangeGroundWallH; // 1.94m
  const barnUpperTopY = barnDatumY + barnUpperEaveH; // 2.92m level eave across Store + Barn
  const barnCeilRidgeY = barnDatumY + barnRidgeH - 0.064; // 4.456m vaulted ceiling apex in Store & Barn
  const barnCeilEaveY =
    barnCeilRidgeY - 2.575 * ((barnRidgeH - barnUpperEaveH) / 3.055); // 3.107m vaulted ceiling eave in Store & Barn

  // Barn Mezzanine floor (`mezzanineFloorY = 1.54m`, underside soffit at `y = 1.40m`)
  const mezzanineFloorY = 1.54;
  const mezzanineUndersideY = 1.4;

  // Issue #10 ("At around this point drop the floor 2 steps down to retain ceiling height under the mezzanine" at `[-3.401, -0.286, 18.968]`, `u = 18.75m`):
  // - West Barn floor (`u = 15.20..18.68m`, Golf Simulator bay in front of mezzanine): `barnWestFloorY = -0.34m`
  // - 2 steps down (`2 x 0.18m = 0.36m`) at `u = 18.68..18.96m`
  // - East Barn sunken floor under the mezzanine (`u = 18.96..23.02m`): `barnLowerFloorY = -0.70m` (`2.10m` clear headroom under `1.40m` soffit!)
  const barnWestFloorY = -0.34;
  const barnLowerFloorY = -0.7;

  // Issue #11: Stable ground floor at `stableGroundFloorY = -0.44m`, ground-floor ceiling at `stableGroundTopY = 1.96m` (`2.40m` headroom),
  // and Stable Upper Floor at `stableUpperFloorY = 2.08m` (3 steps above `mezzanineFloorY = 1.54m`!)
  const stableGroundFloorY = -0.44;
  const stableGroundTopY = 1.96;
  const stableUpperFloorY = 2.08;
  const stableUpperTopY = stableDatumY + stableUpperEaveH; // 3.32m level eave across 2-Storey Stable
  const stableCeilRidgeY = stableDatumY + stableRidgeH - 0.064; // 4.856m vaulted ceiling apex in Stable
  const stableCeilEaveY =
    stableCeilRidgeY - 2.575 * ((stableRidgeH - stableUpperEaveH) / 3.055); // 3.507m vaulted ceiling eave in Stable

  // Issue #1 ("There is a gap here" at `[-9.565, -0.69, 16.38]`) & Issue #2 & #3:
  // Seamless Garage Resin Floor extension across the entire East Wall Alcove & sub-hallway (`u = 12.05..13.06m, v = 0.28..5.428m`)
  // so no sub-base gap (`y = -0.69m`) is ever visible anywhere between the pass-through doorway, hallway wall, and tall cupboard!
  const benchAlcoveFloor = new THREE.Mesh(
    new THREE.BoxGeometry(1.01, garageFloorThickness, 5.148),
    garageResinFloorMat
  );
  benchAlcoveFloor.name = 'outbuildings.garage.resinFloor.alcove';
  benchAlcoveFloor.position.set(
    12.555,
    garageFloorTopY - garageFloorThickness * 0.5,
    (0.28 + 5.428) * 0.5
  );
  benchAlcoveFloor.receiveShadow = true;
  groundGroup.add(benchAlcoveFloor);

  // Continuous Honed Limestone Floor (`barnLimestoneFloorMat` at `barnWestFloorY = -0.34m`) running seamlessly through
  // the North Pass-Through Hallway (`u = 12.07..15.22m, v = 0.28..1.34m`) from the Garage pass-through door into the Barn!
  const storeFloorTopY = -0.34;
  const corridorFloorGeo = new THREE.BoxGeometry(3.15, 0.38, 1.06);
  applyOutbuildingFloorUVs(corridorFloorGeo, 12.07 + 3.15 * 0.5, barnWestFloorY - 0.19, 0.28 + 0.53, 0.45);
  const storeFloor = new THREE.Mesh(
    corridorFloorGeo,
    barnLimestoneFloorMat
  );
  storeFloor.name = 'outbuildings.store.floor';
  storeFloor.position.set(
    12.07 + 3.15 * 0.5,
    barnWestFloorY - 0.19,
    0.28 + 0.53
  );
  storeFloor.receiveShadow = true;
  groundGroup.add(storeFloor);

  // Issue #7 ("Limestone floor" at `[-4.501, -0.34, 17.435]`, `outbuildings.barn.westFloor`):
  // Barn West Honed Limestone Floor (`u = 15.20..18.68m`, width `3.48m`, top at `barnWestFloorY = -0.34m`)
  const barnWestFloorSpanU = uMezzanineFront - (uBarnStart + 0.24); // 3.48m
  const barnWestFloorCenterU = uBarnStart + 0.24 + barnWestFloorSpanU * 0.5;
  const barnFloorCenterV = vEastRangeNorth + wallT + eastRangeInternalV * 0.5;
  const barnWestFloorGeo = new THREE.BoxGeometry(barnWestFloorSpanU, 0.38, eastRangeInternalV);
  applyOutbuildingFloorUVs(barnWestFloorGeo, barnWestFloorCenterU, barnWestFloorY - 0.19, barnFloorCenterV, 0.45);
  const barnWestFloor = new THREE.Mesh(
    barnWestFloorGeo,
    barnLimestoneFloorMat
  );
  barnWestFloor.name = 'outbuildings.barn.westFloor';
  barnWestFloor.position.set(
    barnWestFloorCenterU,
    barnWestFloorY - 0.19,
    barnFloorCenterV
  );
  barnWestFloor.receiveShadow = true;
  groundGroup.add(barnWestFloor);

  // Issue #8 ("Wooden steps with bullnosing like in the main house" at `[-3.402, -0.52, 17.796]`):
  // 2 Full-Width Bullnose Light-Oak Steps Down at `u = 18.68m..18.96m` dropping from `barnWestFloorY = -0.34m`
  // down to the carpeted lower floor (`-0.675m`), complete with `32mm` thick solid light-oak treads,
  // half-round cylindrical bullnose leading edges (`r = 16mm`), scotia cove mouldings, and solid light-oak risers!
  const stepDownDepthU = 0.28;
  const stepTreadT = 0.032;
  const stepBullnoseR = stepTreadT * 0.5; // 16mm half-round bullnose radius
  const stepOverhangU = 0.022;
  const barnCarpetTopY = -0.675; // 1.5cm above the -0.69m terrain slab so terrain never bleeds through!
  const step1TopY = (barnWestFloorY + barnCarpetTopY) * 0.5; // -0.5075m

  // Sub-carcass & solid light-oak risers for the 2-step drop (`u = 18.68..18.96m`)
  const step1CarcassH = (step1TopY - stepTreadT) - (barnLowerFloorY - 0.12);
  const step1CarcassGeo = new THREE.BoxGeometry(stepDownDepthU, step1CarcassH, eastRangeInternalV);
  applyOutbuildingFloorUVs(
    step1CarcassGeo,
    uMezzanineFront + stepDownDepthU * 0.5,
    (step1TopY - stepTreadT + (barnLowerFloorY - 0.12)) * 0.5,
    barnFloorCenterV,
    0.5
  );
  const barnDropStepCarcass = new THREE.Mesh(step1CarcassGeo, lightJoineryOakMat);
  barnDropStepCarcass.name = 'outbuildings.barn.floorDropStep.riserCarcass';
  barnDropStepCarcass.position.set(
    uMezzanineFront + stepDownDepthU * 0.5,
    (step1TopY - stepTreadT + (barnLowerFloorY - 0.12)) * 0.5,
    barnFloorCenterV
  );
  barnDropStepCarcass.castShadow = true;
  barnDropStepCarcass.receiveShadow = true;
  groundGroup.add(barnDropStepCarcass);

  // Upper riser face at `u = 18.68m` (`y = step1TopY .. barnWestFloorY - stepTreadT`)
  const upperRiserH = (barnWestFloorY - stepTreadT) - step1TopY + 0.004;
  const upperRiserGeo = new THREE.BoxGeometry(0.018, upperRiserH, eastRangeInternalV);
  applyOutbuildingFloorUVs(upperRiserGeo, uMezzanineFront + 0.009, step1TopY + upperRiserH * 0.5, barnFloorCenterV, 0.5);
  const upperRiserMesh = new THREE.Mesh(upperRiserGeo, lightJoineryOakMat);
  upperRiserMesh.name = 'outbuildings.barn.floorDropStep.riser.1';
  upperRiserMesh.position.set(uMezzanineFront + 0.009, step1TopY + upperRiserH * 0.5, barnFloorCenterV);
  groundGroup.add(upperRiserMesh);

  // Solid light-oak tread board on Step 1 (`u = 18.68..18.96m + overhang`, `y = step1TopY`)
  const step1FlatSpanU = stepDownDepthU + stepOverhangU - stepBullnoseR;
  const step1FlatCenterU = uMezzanineFront + step1FlatSpanU * 0.5;
  const step1TreadGeo = new THREE.BoxGeometry(step1FlatSpanU, stepTreadT, eastRangeInternalV);
  applyOutbuildingFloorUVs(step1TreadGeo, step1FlatCenterU, step1TopY - stepTreadT * 0.5, barnFloorCenterV, 0.5);
  const barnDropStep1 = new THREE.Mesh(step1TreadGeo, lightJoineryOakMat);
  barnDropStep1.name = 'outbuildings.barn.floorDropStep.1';
  barnDropStep1.position.set(
    step1FlatCenterU,
    step1TopY - stepTreadT * 0.5,
    barnFloorCenterV
  );
  barnDropStep1.castShadow = true;
  barnDropStep1.receiveShadow = true;
  groundGroup.add(barnDropStep1);

  // Upper threshold solid light-oak nosing board at `u = 18.68m, y = barnWestFloorY = -0.34m`
  const upperNosingFlatU = 0.065;
  const upperNosingCenterU = uMezzanineFront - 0.04 + upperNosingFlatU * 0.5;
  const upperNosingGeo = new THREE.BoxGeometry(upperNosingFlatU, stepTreadT, eastRangeInternalV);
  applyOutbuildingFloorUVs(upperNosingGeo, upperNosingCenterU, barnWestFloorY - stepTreadT * 0.5 + 0.001, barnFloorCenterV, 0.5);
  const upperNosingBoard = new THREE.Mesh(upperNosingGeo, lightJoineryOakMat);
  upperNosingBoard.name = 'outbuildings.barn.floorDropStepNosing.1';
  upperNosingBoard.position.set(
    upperNosingCenterU,
    barnWestFloorY - stepTreadT * 0.5 + 0.001,
    barnFloorCenterV
  );
  upperNosingBoard.castShadow = true;
  upperNosingBoard.receiveShadow = true;
  groundGroup.add(upperNosingBoard);

  // Half-round cylindrical bullnose leading edges (`CylinderGeometry`) & underneath scotia coves along both step edges (`u = 18.68m` & `u = 18.96m`)
  for (const [sIdx, riserU, treadTopY] of [
    [1, uMezzanineFront, barnWestFloorY + 0.001],
    [2, uMezzanineFront + stepDownDepthU, step1TopY],
  ] as const) {
    const bullnoseU = riserU + stepOverhangU - stepBullnoseR;
    const bullnoseY = treadTopY - stepBullnoseR;
    const bullnoseCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(stepBullnoseR, stepBullnoseR, eastRangeInternalV, 18),
      lightJoineryOakMat
    );
    bullnoseCyl.name = `outbuildings.barn.floorDropStepNosing.${sIdx}`;
    bullnoseCyl.rotation.x = Math.PI / 2;
    bullnoseCyl.position.set(bullnoseU, bullnoseY, barnFloorCenterV);
    bullnoseCyl.castShadow = true;
    bullnoseCyl.receiveShadow = true;
    groundGroup.add(bullnoseCyl);

    const scotiaCove = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, eastRangeInternalV, 12),
      lightJoineryOakMat
    );
    scotiaCove.rotation.x = Math.PI / 2;
    scotiaCove.position.set(riserU + 0.01, treadTopY - stepTreadT - 0.006, barnFloorCenterV);
    groundGroup.add(scotiaCove);
  }

  // Issue #9 ("Carpet down here like upstairs" at `[-2.381, -0.69, 16.754]`):
  // Barn East Sunken Floor under the Mezzanine (`u = 18.96..23.02m`, width `4.06m`, top at `barnCarpetTopY = -0.675m`,
  // raised `1.5cm` above the `-0.69m` exterior terrain ground slab so the terrain never bleeds through!)
  // Carpeted in `stableUpperCarpetMat` (`upstairsWovenWoolCarpet`) with world-space `uvScale = 0.5` matching upstairs!
  const barnLowerFloorStartU = uMezzanineFront + stepDownDepthU; // 18.96m
  const barnLowerFloorSpanU = uBarnEnd - partT - barnLowerFloorStartU; // 4.06m
  const barnEastFloorCenterU = barnLowerFloorStartU + barnLowerFloorSpanU * 0.5;
  const barnEastLowerFloorGeo = new THREE.BoxGeometry(barnLowerFloorSpanU, 0.145, eastRangeInternalV);
  applyOutbuildingFloorUVs(barnEastLowerFloorGeo, barnEastFloorCenterU, barnCarpetTopY - 0.0725, barnFloorCenterV, 0.5);
  const barnEastLowerFloor = new THREE.Mesh(
    barnEastLowerFloorGeo,
    stableUpperCarpetMat
  );
  barnEastLowerFloor.name = 'outbuildings.barn.eastLowerFloor';
  barnEastLowerFloor.position.set(
    barnEastFloorCenterU,
    barnCarpetTopY - 0.0725,
    barnFloorCenterV
  );
  barnEastLowerFloor.receiveShadow = true;
  groundGroup.add(barnEastLowerFloor);

  // Stable Ground Floor Slab (`u = 23.22..28.77m`, top at `stableGroundFloorY = -0.44m`)
  const stableFloor = new THREE.Mesh(
    new THREE.BoxGeometry(5.55, 0.12, eastRangeInternalV),
    barnFloorMat
  );
  stableFloor.name = 'outbuildings.stable.floor';
  stableFloor.position.set(
    uStableStart + 5.55 * 0.5,
    stableGroundFloorY - 0.06,
    vEastRangeNorth + wallT + eastRangeInternalV * 0.5
  );
  stableFloor.receiveShadow = true;
  groundGroup.add(stableFloor);

  // Issue #2 ("Have this unit wrap around the corner" at `[-10.064, 0.482, 19.713]`) &
  // Issue #3 ("shortern the unit slightly and have a door here which goes through to the bar, it will open up behind the back of the golf simulator. Have a red light above which goes red if someone is playing golf" at `[-10.37, 0.713, 15.833]`):
  // - Shortened the recessed workbench alcove on the North end to `v = 1.63m` and extended it South to `v = 5.428m` so the L-shaped workbench wraps around the SE corner (`v = 5.428m`).
  // - Cut a full-height doorway (`v = 0.50m..1.36m, y = garageFloorTopY (-0.50m) .. 1.50m`) in the North bay of the Garage East wall (`u = 12.07..12.31m`),
  //   fitted with an interactive Hinged Solid Oak Pass-Through Door (`outbuildings.garage.golfPassThroughDoor`) opening behind the back of the Golf Simulator,
  //   and crowned with an illuminated Red Golf Warning Indicator Light (`outbuildings.garage.golfWarningLight`) above the door!
  const garagePassDoorVMin = 0.38;
  const garagePassDoorVMax = 1.18;
  const garagePassDoorTopY = 1.50;
  const benchAlcoveVMin = 1.34;
  const tallCupboardVMax = 2.86; // North Double Stainless-Steel Full-Height Cupboard (`v = 1.34..2.86m`, height `2.16m` -> world Y `1.66m`)
  const benchAlcoveVMax = vEastRangeSouth - wallT - 0.002; // 5.428m

  // 1. Lower sill / step wall (`y = barnLowerFloorY (-0.70m) .. garageFloorTopY (-0.50m)`): full span `vInnerNorth .. vInnerSouth`
  addOutbuildingBrickWall(
    groundGroup,
    uStoreStart,
    uStoreStart + 0.24,
    barnLowerFloorY,
    garageFloorTopY,
    vEastRangeNorth + wallT + 0.002,
    benchAlcoveVMax,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  // 2a. North-most corner jamb pier (`v = 0.282m .. 0.38m`): `y = garageFloorTopY (-0.50m) .. eastRangeGroundTopY (1.94m)`
  addOutbuildingBrickWall(
    groundGroup,
    uStoreStart,
    uStoreStart + 0.24,
    garageFloorTopY,
    eastRangeGroundTopY,
    vEastRangeNorth + wallT + 0.002,
    garagePassDoorVMin,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  // 2b. Over-door lintel (`v = 0.38m .. 1.18m`): `y = 1.50m .. eastRangeGroundTopY (1.94m)`
  addOutbuildingBrickWall(
    groundGroup,
    uStoreStart,
    uStoreStart + 0.24,
    garagePassDoorTopY,
    eastRangeGroundTopY,
    garagePassDoorVMin,
    garagePassDoorVMax,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  // 2c. Center pier between the Pass-Through Door (`v = 1.18m`) and the Tall Stainless Cupboard (`v = 1.34m`)
  addOutbuildingBrickWall(
    groundGroup,
    uStoreStart,
    uStoreStart + 0.24,
    garageFloorTopY,
    eastRangeGroundTopY,
    garagePassDoorVMax,
    benchAlcoveVMin,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  // 3a. Upper lintel header above the Double Stainless-Steel Full-Height Cupboard (`v = 1.34m .. 2.86m, y = 1.66m .. 1.94m`)
  addOutbuildingBrickWall(
    groundGroup,
    uStoreStart,
    uStoreStart + 0.24,
    1.66,
    eastRangeGroundTopY,
    benchAlcoveVMin,
    tallCupboardVMax,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  // 3b. Upper lintel header above the recessed workbench (`v = 2.86m .. 5.428m, y = 1.42m .. eastRangeGroundTopY (1.94m)`)
  addOutbuildingBrickWall(
    groundGroup,
    uStoreStart,
    uStoreStart + 0.24,
    1.42,
    eastRangeGroundTopY,
    tallCupboardVMax,
    benchAlcoveVMax,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );

  // Issue #1 ("There is a gap here" at `[-9.565, -0.69, 16.38]`) & Issue #3:
  // - Continuous South Hallway Wall (`u = 12.31m..14.96m, v = 1.18m..1.34m, y = -0.50m..1.94m`) forming a 100% flush,
  //   airtight corridor wall from the Garage pass-through door all the way to the Barn portal with zero gaps or exposed voids!
  addOutbuildingBrickWall(
    groundGroup,
    uStoreStart + 0.24,
    uBarnStart,
    garageFloorTopY,
    eastRangeGroundTopY,
    garagePassDoorVMax,
    benchAlcoveVMin,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  // - Solid infill wall & top caps covering the void between the back of the recessed Garage cupboard/workbench (`u = 12.78m`)
  //   and the back of the Golf Simulator (`u = 13.04m`) across `v = 1.34m..5.428m`, plus the South pocket (`v = 5.12m..5.428m, u = 13.04..14.96m`)!
  addOutbuildingBrickWall(
    groundGroup,
    12.78,
    13.04,
    garageFloorTopY,
    eastRangeGroundTopY,
    benchAlcoveVMin,
    benchAlcoveVMax,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  addOutbuildingBrickWall(
    groundGroup,
    13.04,
    uBarnStart,
    garageFloorTopY,
    eastRangeGroundTopY,
    5.12,
    benchAlcoveVMax,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  addOutbuildingBrickWall(
    groundGroup,
    uStoreStart + 0.24,
    13.04,
    1.66,
    1.94,
    garagePassDoorVMax,
    tallCupboardVMax,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  addOutbuildingBrickWall(
    groundGroup,
    uStoreStart + 0.24,
    13.04,
    1.42,
    1.94,
    tallCupboardVMax,
    benchAlcoveVMax,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );

  // Interactive Hinged Solid Oak Pass-Through Door (`outbuildings.garage.golfPassThroughDoor`) & Threshold Step
  {
    const passDoorW = garagePassDoorVMax - garagePassDoorVMin; // 0.86m
    const passDoorH = garagePassDoorTopY - garageFloorTopY;     // 2.00m
    const passDoorCenterV = (garagePassDoorVMin + garagePassDoorVMax) * 0.5; // 0.93m
    const passDoorCenterU = uStoreStart + 0.12; // 12.19m

    const passDoorGroup = new THREE.Group();
    passDoorGroup.name = 'outbuildings.garage.golfPassThroughDoor';
    passDoorGroup.userData.zone = 'courtyard';
    passDoorGroup.position.set(passDoorCenterU, garageFloorTopY, passDoorCenterV);
    groundGroup.add(passDoorGroup);

    // Solid light-oak threshold step inside the doorway (`y = 0..0.16m`, bridging `garageFloorTopY = -0.50m` to `barnWestFloorY = -0.34m`)
    const thresholdStep = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.16, passDoorW + 0.04),
      lightJoineryOakMat
    );
    thresholdStep.name = 'outbuildings.garage.golfPassThroughDoor.step';
    thresholdStep.position.set(0.02, 0.08, 0);
    thresholdStep.receiveShadow = true;
    passDoorGroup.add(thresholdStep);

    // Solid Light-Oak Door Frame Jambs, Head Lining & Dual-Face Architraves
    const jambT = 0.032;
    const jambD = 0.252;
    for (const sideZ of [-1, 1] as const) {
      const jamb = new THREE.Mesh(
        new THREE.BoxGeometry(jambD, passDoorH, jambT),
        lightJoineryOakMat
      );
      jamb.position.set(0, passDoorH * 0.5, sideZ * (passDoorW * 0.5 - jambT * 0.5));
      passDoorGroup.add(jamb);
    }
    const headJamb = new THREE.Mesh(
      new THREE.BoxGeometry(jambD, jambT, passDoorW),
      lightJoineryOakMat
    );
    headJamb.position.set(0, passDoorH - jambT * 0.5, 0);
    passDoorGroup.add(headJamb);

    for (const faceX of [-0.126, 0.126] as const) {
      for (const sideZ of [-1, 1] as const) {
        const legArch = new THREE.Mesh(
          new THREE.BoxGeometry(0.016, passDoorH + 0.06, 0.058),
          lightJoineryOakMat
        );
        legArch.position.set(faceX, (passDoorH + 0.06) * 0.5, sideZ * (passDoorW * 0.5 + 0.012));
        passDoorGroup.add(legArch);
      }
      const headArch = new THREE.Mesh(
        new THREE.BoxGeometry(0.016, 0.058, passDoorW + 0.14),
        lightJoineryOakMat
      );
      headArch.position.set(faceX, passDoorH + 0.03, 0);
      passDoorGroup.add(headArch);
    }

    // Hinged 4-Panel Solid Light-Oak Door Leaf (`outbuildings.garage.golfPassThroughDoor.leafPivot`)
    const leafW = passDoorW - jambT * 2 - 0.008; // 0.788m
    const leafH = passDoorH - jambT - 0.165;     // 1.803m (clears the 0.16m threshold step)
    const leafT = 0.044;

    const leafPivot = new THREE.Group();
    leafPivot.name = 'outbuildings.garage.golfPassThroughDoor.leafPivot';
    leafPivot.position.set(0, 0.162, -leafW * 0.5);
    passDoorGroup.add(leafPivot);

    const doorSlab = new THREE.Mesh(
      new THREE.BoxGeometry(leafT, leafH, leafW),
      lightJoineryOakMat
    );
    doorSlab.name = 'outbuildings.garage.golfPassThroughDoor.slab';
    doorSlab.position.set(0, leafH * 0.5, leafW * 0.5);
    doorSlab.castShadow = true;
    doorSlab.receiveShadow = true;
    leafPivot.add(doorSlab);

    // Brushed-Brass Lever Handles on both Garage (`-x`) and Simulator/Barn (`+x`) faces
    const doorBrassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.24,
      metalness: 0.86,
    });
    const handleZ = leafW - 0.065;
    const handleY = 0.94;
    for (const sideX of [-1, 1] as const) {
      const rose = new THREE.Mesh(
        new THREE.CylinderGeometry(0.026, 0.026, 0.01, 16),
        doorBrassMat
      );
      rose.rotation.z = Math.PI / 2;
      rose.position.set(sideX * (leafT * 0.5 + 0.005), handleY, handleZ);
      leafPivot.add(rose);

      const lever = new THREE.Mesh(
        new THREE.CylinderGeometry(0.009, 0.008, 0.115, 12),
        doorBrassMat
      );
      lever.rotation.x = Math.PI / 2;
      lever.position.set(sideX * (leafT * 0.5 + 0.042), handleY, handleZ - 0.045);
      leafPivot.add(lever);
    }

    ctx.interactions.registerHingedDoor(
      passDoorGroup,
      leafPivot,
      new THREE.Vector3(0, 0, 0),
      'y',
      -Math.PI * 0.45
    );

    // Illuminated Red "GOLF IN PLAY" Warning Indicator Light Box (`outbuildings.garage.golfWarningLight`)
    // Mounted directly above the door architrave (`y = passDoorH + 0.15m = 2.15m` above `garageFloorTopY`, i.e. `y = 1.65m` world)
    const warnCanvas = document.createElement('canvas');
    warnCanvas.width = 512;
    warnCanvas.height = 192;
    const wCtx = warnCanvas.getContext('2d');
    if (wCtx) {
      const bgGrad = wCtx.createLinearGradient(0, 0, 0, 192);
      bgGrad.addColorStop(0, '#c40e0e');
      bgGrad.addColorStop(0.5, '#ff1e1e');
      bgGrad.addColorStop(1, '#9e0808');
      wCtx.fillStyle = bgGrad;
      wCtx.fillRect(0, 0, 512, 192);

      wCtx.strokeStyle = '#ffaaaa';
      wCtx.lineWidth = 6;
      wCtx.strokeRect(10, 10, 492, 172);

      wCtx.fillStyle = '#ffffff';
      wCtx.font = 'bold 46px sans-serif';
      wCtx.textAlign = 'center';
      wCtx.textBaseline = 'middle';
      wCtx.fillText('GOLF IN PLAY', 256, 76);

      wCtx.fillStyle = '#ffe0e0';
      wCtx.font = 'bold 26px sans-serif';
      wCtx.fillText('CAUTION — SIMULATOR ACTIVE', 256, 134);
    }
    const warnTex = new THREE.CanvasTexture(warnCanvas);
    warnTex.colorSpace = THREE.SRGBColorSpace;

    const redLensMat = new THREE.MeshStandardMaterial({
      map: warnTex,
      emissiveMap: warnTex,
      color: 0xff2222,
      emissive: new THREE.Color(0xff1414),
      emissiveIntensity: 2.1,
      roughness: 0.18,
      metalness: 0.05,
    });
    const rubyBeaconMat = new THREE.MeshStandardMaterial({
      color: 0xff1111,
      emissive: new THREE.Color(0xff0808),
      emissiveIntensity: 2.4,
      roughness: 0.14,
      metalness: 0.1,
    });
    const housingDarkMat = new THREE.MeshStandardMaterial({
      color: 0x1c1f24,
      roughness: 0.36,
      metalness: 0.72,
    });

    const warnLightGroup = new THREE.Group();
    warnLightGroup.name = 'outbuildings.garage.golfWarningLight';
    warnLightGroup.userData.golfInPlay = true;
    warnLightGroup.position.set(0, passDoorH + 0.15, 0);
    passDoorGroup.add(warnLightGroup);

    // Mount warning light box on both the Garage face (`-x = -0.15m`) and the Simulator/Store face (`+x = +0.15m`)
    for (const [fIdx, sideX, rotY] of [
      [1, -0.152, -Math.PI / 2],
      [2, 0.152, Math.PI / 2],
    ] as const) {
      const boxHousing = new THREE.Mesh(
        new THREE.BoxGeometry(0.058, 0.135, 0.38),
        housingDarkMat
      );
      boxHousing.name = `outbuildings.garage.golfWarningLight.housing.${fIdx}`;
      boxHousing.position.set(sideX, 0, 0);
      boxHousing.castShadow = true;
      warnLightGroup.add(boxHousing);

      const brassBezel = new THREE.Mesh(
        new THREE.BoxGeometry(0.012, 0.145, 0.39),
        doorBrassMat
      );
      brassBezel.position.set(sideX + (sideX < 0 ? -0.026 : 0.026), 0, 0);
      warnLightGroup.add(brassBezel);

      const lensPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.356, 0.114),
        redLensMat
      );
      lensPlane.name = `outbuildings.garage.golfWarningLight.lens.${fIdx}`;
      lensPlane.rotation.y = rotY;
      lensPlane.position.set(sideX + (sideX < 0 ? -0.033 : 0.033), 0, 0);
      warnLightGroup.add(lensPlane);

      // Ruby-red cylindrical warning beacon dome on top of the housing
      const beaconDome = new THREE.Mesh(
        new THREE.CylinderGeometry(0.026, 0.030, 0.044, 16),
        rubyBeaconMat
      );
      beaconDome.name = `outbuildings.garage.golfWarningLight.beacon.${fIdx}`;
      beaconDome.position.set(sideX, 0.088, 0);
      warnLightGroup.add(beaconDome);
    }

    const redWarnPointLight = new THREE.PointLight(0xff1818, 1.45, 2.8, 1.6);
    redWarnPointLight.name = 'outbuildings.garage.golfWarningLight.pointLight';
    redWarnPointLight.position.set(-0.24, 0.02, 0);
    warnLightGroup.add(redWarnPointLight);
  }
  addInteriorPlasterGableWall(
    roofGroup,
    uStoreStart,
    uStoreStart + 0.24,
    vEastRangeNorth + wallT + 0.002,
    vEastRangeSouth - wallT - 0.002,
    eastRangeGroundTopY,
    westRangeCeilEaveY,
    westRangeCeilRidgeY,
    'outbuildings.garageStoreStep1InteriorGable'
  );
  // Store side (`+x` at `u = 12.28..12.315m`) painted plasterboard lining extending up to the Store vaulted ceiling (`barnCeilRidgeY`)
  addInteriorPlasterGableWall(
    roofGroup,
    uStoreStart + 0.21,
    uStoreStart + 0.245,
    vEastRangeNorth + wallT + 0.002,
    vEastRangeSouth - wallT - 0.002,
    eastRangeGroundTopY,
    barnCeilEaveY,
    barnCeilRidgeY,
    'outbuildings.storeWestInteriorPlasterGable'
  );

  // Issue #9 ("2.8m tall golf simulator here cut into the wall, 4m wide, backs into the store room" at `[-7.044, 1.391, 17.979]`,
  // + "its a trackman io, i want a widescreen one, so make of that what you will"):
  // Internal Cross-Wall at `u = 14.96m..15.20m` (Store/Barn partition) with a `4.48m` Widescreen (`16:10`) x `2.80m` tall
  // rectangular portal cutout (`v = 0.615m..5.095m, y = -0.34m..2.46m`) so the recessed TrackMan iO Golf Simulator
  // sits flush in the Barn wall and backs `1.48m` into the Store room!
  // Issue #7 ("Exposed brick around the golf simulator" at `[-6.962, 2.681, 18.934]` -> `u = 15.20m, y = 2.681m, v = 4.251m`):
  // The Store/Barn cross-wall (`u = 14.96..15.20m`) framing the Golf Simulator (North pier, South pier, upper lintel,
  // and Barn-side upper gable `outbuildings.storeBarnPartitionGable`) uses exposed red/multi-stock brickwork (`exteriorBrickMat`)
  // on the Barn face (`+x`) and portal reveals (`+z`, `-z`), keeping only the Store back face (`-x`) plastered!
  const simCutoutVMin = 1.32;
  const simCutoutVMax = 5.12;
  const simCutoutTopY = barnWestFloorY + 2.85; // 2.51m (9'4" TrackMan iO minimum height)
  const barnHallPortalVMin = 0.38;
  const barnHallPortalVMax = 1.18;
  const barnHallPortalTopY = 1.78;
  // North corner brick pier (`v = 0.282m .. 0.44m`)
  addOutbuildingBrickWall(
    groundGroup,
    uBarnStart,
    uBarnStart + 0.24,
    storeFloorTopY - 0.12,
    barnUpperTopY,
    vEastRangeNorth + wallT + 0.002,
    barnHallPortalVMin,
    ['-x'],
    exteriorBrickMat
  );
  // Over-portal brick lintel above the North Hallway walk-through opening (`v = 0.44m .. 1.34m, y = 1.78m .. 2.92m`)
  addOutbuildingBrickWall(
    groundGroup,
    uBarnStart,
    uBarnStart + 0.24,
    barnHallPortalTopY,
    barnUpperTopY,
    barnHallPortalVMin,
    barnHallPortalVMax,
    ['-x'],
    exteriorBrickMat
  );
  // Dividing brick pier between the North Hallway Portal (`v = 0.44..1.34m`) and the Enclosed Golf Simulator (`v = 1.52..5.095m`)
  addOutbuildingBrickWall(
    groundGroup,
    uBarnStart,
    uBarnStart + 0.24,
    storeFloorTopY - 0.12,
    barnUpperTopY,
    barnHallPortalVMax,
    simCutoutVMin,
    ['-x'],
    exteriorBrickMat
  );
  addOutbuildingBrickWall(
    groundGroup,
    uBarnStart,
    uBarnStart + 0.24,
    storeFloorTopY - 0.12,
    barnUpperTopY,
    simCutoutVMax,
    vEastRangeSouth - wallT - 0.002,
    ['-x'],
    exteriorBrickMat
  );
  addOutbuildingBrickWall(
    groundGroup,
    uBarnStart,
    uBarnStart + 0.24,
    simCutoutTopY,
    barnUpperTopY,
    simCutoutVMin,
    simCutoutVMax,
    ['-x'],
    exteriorBrickMat
  );
  addInteriorPlasterGableWall(
    roofGroup,
    uBarnStart,
    uBarnStart + 0.24,
    vEastRangeNorth + wallT + 0.002,
    vEastRangeSouth - wallT - 0.002,
    barnUpperTopY,
    barnCeilEaveY,
    barnCeilRidgeY,
    'outbuildings.storeBarnPartitionGable',
    exteriorBrickMat
  );
  addInteriorPlasterGableWall(
    roofGroup,
    uBarnStart - 0.005,
    uBarnStart + 0.015,
    vEastRangeNorth + wallT + 0.002,
    vEastRangeSouth - wallT - 0.002,
    barnUpperTopY,
    barnCeilEaveY,
    barnCeilRidgeY,
    'outbuildings.storeBarnPartitionGable.storePlaster'
  );

  // Build the Recessed Widescreen TrackMan iO Golf Simulator (`outbuildings.barn.golfSimulator`) backing into the Store room
  buildBarnGolfSimulator(
    groundGroup,
    barnLowerFloorY,
    eastRangeInternalV,
    groundCeilingGroup
  );

  // Issue #2 ("Remove the ladder" at `[-3.328, 1.428, 18.92]`) &
  // Issue #3 ("Spiral staircase here https://haldaneuk.com/projects/wooden-spiral-staircase/" at `[-0.025, 1.428, 18.785]`):
  // Haldane UK Bespoke Freestanding Solid American White Oak Spiral Staircase (`outbuildings.barn.spiralStaircase`) in the SE corner of the Barn
  buildBarnSpiralStaircase(groundGroup, barnCarpetTopY, mezzanineFloorY, lightJoineryOakMat);
  buildBarnGroundWallArtworks(groundGroup);

  // Issue #10 ("Bar in this corner with beer on tap, mini fridge like in the master bedroom" at `[0.516, -0.316, 14.617]`)
  // & Issue #12 ("Pool table" at `[-1.537, -0.675, 16.19]`):
  buildBarnCornerBar(groundGroup, barnCarpetTopY, lightJoineryOakMat, windowGlassMat);
  buildBarnPoolTable(groundGroup, barnCarpetTopY, lightJoineryOakMat);

  // Internal Cross-Wall at u = 23.02m..23.22m (Barn/Stable Step #2):
  // - Issue #11 ("Glass door through to the next room" at `[0.63, 0.255, 15.941]` -> `(u = 23.02m, y = 0.255m, v = 1.919m)`):
  //   Below `mezzanineFloorY = 1.54m`, cut a `0.86m` wide doorway opening at `v = 1.52m..2.38m` (`y = stableGroundFloorY (-0.44m) .. 1.32m`)
  //   fitted with an interactive Hinged Acoustic Glass & Light-Oak Door (`outbuildings.barn.stableGlassDoor`) and a solid light-oak
  //   bullnose threshold step (`outbuildings.barn.stableDoorStep`) bridging from `barnCarpetTopY = -0.675m` up to `stableGroundFloorY = -0.44m`!
  // - Issue #4 ("Could the bannisters here not be merged somehow? Rather than this akward gap between the 2"):
  //   Above `mezzanineFloorY = 1.54m`, the 1st-floor `UP` stair opening spans `v = 2.554m..3.554m` so its South banister (`v = 3.54m`)
  //   is 100% collinear with the stairwell North guardrail (`v = 3.54m`)!
  const gDoorV0 = 1.52;
  const gDoorV1 = 2.38;
  const gDoorBotY = stableGroundFloorY; // -0.44m
  const gDoorTopY = 1.32;

  // 1. Lower step riser wall across the doorway (`y = barnLowerFloorY - 0.12 .. stableGroundFloorY`)
  addOutbuildingBrickWall(
    groundGroup,
    uBarnEnd - partT,
    uBarnEnd,
    barnLowerFloorY - 0.12,
    gDoorBotY,
    gDoorV0,
    gDoorV1,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  // 2. North ground-floor wall pier (`v = 0.282..1.52m`, behind the Corner Bar)
  addOutbuildingBrickWall(
    groundGroup,
    uBarnEnd - partT,
    uBarnEnd,
    barnLowerFloorY - 0.12,
    mezzanineFloorY,
    vEastRangeNorth + wallT + 0.002,
    gDoorV0,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  // 3. South ground-floor wall pier (`v = 2.38..5.428m`, behind the Spiral Staircase)
  addOutbuildingBrickWall(
    groundGroup,
    uBarnEnd - partT,
    uBarnEnd,
    barnLowerFloorY - 0.12,
    mezzanineFloorY,
    gDoorV1,
    vEastRangeSouth - wallT - 0.002,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  // 4. Over-door lintel between `gDoorTopY = 1.32m` and `mezzanineFloorY = 1.54m`
  addOutbuildingBrickWall(
    groundGroup,
    uBarnEnd - partT,
    uBarnEnd,
    gDoorTopY,
    mezzanineFloorY,
    gDoorV0,
    gDoorV1,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );

  // 5. Interactive Hinged Glass Door (`outbuildings.barn.stableGlassDoor`) & Light-Oak Bullnose Threshold Step (`v = 1.52..2.38m`)
  {
    const glassDoorGroup = new THREE.Group();
    glassDoorGroup.name = 'outbuildings.barn.stableGlassDoor';
    glassDoorGroup.userData.zone = 'courtyard';
    const gDoorMidU = uBarnEnd - partT * 0.5; // 23.12m
    const gDoorMidV = (gDoorV0 + gDoorV1) * 0.5; // 1.95m
    const gDoorW = gDoorV1 - gDoorV0; // 0.86m
    const gDoorH = gDoorTopY - gDoorBotY; // 1.76m
    glassDoorGroup.position.set(gDoorMidU, gDoorBotY, gDoorMidV);
    groundGroup.add(glassDoorGroup);

    // Solid light-oak doorway jamb linings, head lining, threshold sill & chamfered architraves
    const jambT = 0.026;
    const sillBoard = new THREE.Mesh(
      new THREE.BoxGeometry(partT + 0.024, 0.024, gDoorW),
      lightJoineryOakMat
    );
    sillBoard.position.set(0, 0.012, 0);
    sillBoard.receiveShadow = true;
    glassDoorGroup.add(sillBoard);

    const headBoard = new THREE.Mesh(
      new THREE.BoxGeometry(partT + 0.012, jambT, gDoorW),
      lightJoineryOakMat
    );
    headBoard.position.set(0, gDoorH - jambT * 0.5, 0);
    glassDoorGroup.add(headBoard);

    for (const sideV of [-1, 1] as const) {
      const jamb = new THREE.Mesh(
        new THREE.BoxGeometry(partT + 0.012, gDoorH - jambT, jambT),
        lightJoineryOakMat
      );
      jamb.position.set(0, (gDoorH - jambT) * 0.5, sideV * (gDoorW * 0.5 - jambT * 0.5));
      glassDoorGroup.add(jamb);

      for (const sideX of [-1, 1] as const) {
        const archLeg = new THREE.Mesh(
          new THREE.BoxGeometry(0.016, gDoorH + 0.04, 0.054),
          lightJoineryOakPostMat
        );
        archLeg.position.set(
          sideX * (partT * 0.5 + 0.008),
          (gDoorH + 0.04) * 0.5,
          sideV * (gDoorW * 0.5 + 0.016)
        );
        glassDoorGroup.add(archLeg);
      }
    }
    for (const sideX of [-1, 1] as const) {
      const archHead = new THREE.Mesh(
        new THREE.BoxGeometry(0.016, 0.054, gDoorW + 0.086),
        lightJoineryOakPostMat
      );
      archHead.position.set(sideX * (partT * 0.5 + 0.008), gDoorH + 0.018, 0);
      glassDoorGroup.add(archHead);
    }

    // Hinged Full-Height Glazed Door Leaf (`outbuildings.barn.stableGlassDoor.leafPivot`)
    const clearW = gDoorW - jambT * 2 - 0.008; // 0.80m
    const clearH = gDoorH - jambT - 0.028; // 1.706m
    const stileW = 0.058;
    const railH = 0.068;
    const leafPivot = new THREE.Group();
    leafPivot.name = 'outbuildings.barn.stableGlassDoor.leafPivot';
    leafPivot.position.set(0, 0.024, -clearW * 0.5);
    glassDoorGroup.add(leafPivot);

    // Left & right solid light-oak door stiles
    for (const sSide of [0, 1] as const) {
      const vz = sSide === 0 ? stileW * 0.5 : clearW - stileW * 0.5;
      const stile = new THREE.Mesh(
        new THREE.BoxGeometry(0.044, clearH, stileW),
        lightJoineryOakMat
      );
      stile.position.set(0, clearH * 0.5, vz);
      stile.castShadow = true;
      leafPivot.add(stile);
    }
    // Top & bottom solid light-oak door rails
    for (const [ry, rh] of [
      [railH * 0.5, railH + 0.02],
      [clearH - railH * 0.5, railH],
    ] as const) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.044, rh, clearW - stileW * 2),
        lightJoineryOakMat
      );
      rail.position.set(0, ry, clearW * 0.5);
      rail.castShadow = true;
      leafPivot.add(rail);
    }

    // Full-height clear architectural glass pane (`outbuildings.barn.stableGlassDoor.glass`) + 2 slim glazing bars
    const paneW = clearW - stileW * 2 + 0.008;
    const paneH = clearH - railH * 2 + 0.008;
    const glassPane = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, paneH, paneW),
      windowGlassMat
    );
    glassPane.name = 'outbuildings.barn.stableGlassDoor.glass';
    glassPane.position.set(0, clearH * 0.5 + 0.005, clearW * 0.5);
    leafPivot.add(glassPane);

    for (const gy of [clearH * 0.36, clearH * 0.67] as const) {
      const glazingBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.028, 0.022, paneW),
        lightJoineryOakPostMat
      );
      glazingBar.position.set(0, gy, clearW * 0.5);
      leafPivot.add(glazingBar);
    }

    // Brushed-brass lever handles on both Barn (`-x`) and Stable (`+x`) faces of the leading stile
    for (const hx of [-0.036, 0.036] as const) {
      const lever = new THREE.Mesh(
        new THREE.BoxGeometry(0.024, 0.018, 0.115),
        spotlightBrassTrimMat
      );
      lever.position.set(hx, clearH * 0.52, clearW - stileW * 0.5 - 0.03);
      leafPivot.add(lever);
    }

    ctx.interactions.registerHingedDoor(
      glassDoorGroup,
      leafPivot,
      new THREE.Vector3(0, 0, 0),
      'y',
      Math.PI * 0.45
    );

    // Solid Light-Oak Bullnose Threshold Step on the Barn side (`u = 22.74..23.02m, y = -0.675m..-0.555m`)
    const stepH = (gDoorBotY - barnCarpetTopY) * 0.5; // 0.1175m
    const stepD = 0.28;
    const stepW = gDoorW + 0.10;
    const stepBlock = new THREE.Mesh(
      new THREE.BoxGeometry(stepD, stepH, stepW),
      lightJoineryOakMat
    );
    stepBlock.name = 'outbuildings.barn.stableDoorStep';
    stepBlock.position.set(-partT * 0.5 - stepD * 0.5, -stepH * 0.5, 0);
    stepBlock.castShadow = true;
    stepBlock.receiveShadow = true;
    glassDoorGroup.add(stepBlock);

    const stepBullnose = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, stepW, 16),
      lightJoineryOakMat
    );
    stepBullnose.rotation.x = Math.PI / 2;
    stepBullnose.position.set(-partT * 0.5 - stepD, -0.016, 0);
    glassDoorGroup.add(stepBullnose);
  }

  addOutbuildingBrickWall(
    groundGroup,
    uBarnEnd - partT,
    uBarnEnd,
    mezzanineFloorY,
    stableGroundTopY,
    vEastRangeNorth + wallT + 0.002,
    2.554,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  addOutbuildingBrickWall(
    groundGroup,
    uBarnEnd - partT,
    uBarnEnd,
    mezzanineFloorY,
    stableGroundTopY,
    3.554,
    vEastRangeSouth - wallT - 0.002,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  addOutbuildingBrickWall(
    groundGroup,
    uBarnEnd - 0.06,
    uBarnEnd,
    mezzanineFloorY,
    stableUpperFloorY,
    2.554,
    3.554,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );

  // South Garden Wall of Store & Barn (Ground Floor: u = 12.07m..23.22m, solid brick with zero windows — Issue #6!)
  addOutbuildingBrickWall(
    groundGroup,
    uStoreStart,
    uBarnEnd,
    barnLowerFloorY - 0.14,
    eastRangeGroundTopY,
    vEastRangeSouth - wallT,
    vEastRangeSouth,
    ['-z']
  );

  // Issue #10 ("Remove this window" at `[4.25, 1.175, 19.329]`):
  // South Garden Wall of 2-Storey Stable (Ground Floor: u = 23.22m..28.77m, solid brick with zero windows!)
  addOutbuildingBrickWall(
    groundGroup,
    uStableStart,
    uStableEnd - wallT,
    stableGroundFloorY - 0.14,
    stableGroundTopY,
    vEastRangeSouth - wallT,
    vEastRangeSouth,
    ['-z']
  );

  // North Courtyard Wall of Store & Barn (Ground Floor: v = 0.00m..0.28m, u = 12.07m..23.22m, y = baseY..1.94m)
  addOutbuildingBrickWall(
    groundGroup,
    uStoreStart,
    12.85,
    storeFloorTopY - 0.14,
    eastRangeGroundTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z']
  );
  addOutbuildingBrickWall(
    groundGroup,
    12.85,
    13.75,
    storeFloorTopY + 2.02,
    eastRangeGroundTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z']
  );
  addBoardedBarnDoor(
    groundGroup,
    13.3,
    storeFloorTopY,
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
    storeFloorTopY - 0.14,
    eastRangeGroundTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z']
  );

  addOutbuildingBrickWall(
    groundGroup,
    15.85,
    16.85,
    barnWestFloorY + 2.02,
    eastRangeGroundTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z']
  );
  addBoardedBarnDoor(
    groundGroup,
    16.35,
    barnWestFloorY,
    vEastRangeNorth + wallT * 0.5,
    1.0,
    2.02,
    false,
    courtyardDoorMat,
    'Barn Courtyard Door'
  );

  // Issue #1 ("Move this window to the left" at `[-2.494, 0.788, 14.415]`):
  // Viewing the Barn North wall from the Courtyard (looking South `+Z`), screen-left is East (`+u`),
  // so shift `uCenter` from `20.06m` to `21.35m` (centered in the East Barn bay `u = 19.85..23.02m`).
  // Issue #9 ("Move window down slightly" at `[-0.892, 0.709, 14.296]`):
  // Lowered `yCenter` from `0.98` to `0.78` (`y = 0.40m..1.16m`) so the Barn North ground-floor window sits lower under the mezzanine!
  addOutbuildingBrickWallWithWindows(
    groundGroup,
    16.85,
    uBarnEnd,
    barnLowerFloorY - 0.14,
    eastRangeGroundTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z'],
    [{ uCenter: 21.35, yCenter: 0.78, width: 0.92, height: 0.76 }]
  );

  // North Courtyard Wall of 2-Storey Stable (Ground Floor: u = 23.22m..28.77m, rising to `stableGroundTopY = 1.96m` — Issue #11!)
  addOutbuildingBrickWall(
    groundGroup,
    uStableStart,
    23.8,
    stableGroundFloorY - 0.14,
    stableGroundTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z']
  );
  addOutbuildingBrickWall(
    groundGroup,
    23.8,
    24.7,
    stableGroundFloorY + 2.04,
    stableGroundTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z']
  );
  addBoardedBarnDoor(
    groundGroup,
    24.25,
    stableGroundFloorY,
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
    stableGroundFloorY - 0.14,
    stableGroundTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z'],
    [{ uCenter: 26.55, yCenter: 1.18, width: 0.92, height: 0.92 }]
  );

  // East Gable End of 2-Storey Stable (Ground Floor: u = 28.77m..29.05m, v = 0.00m..5.71m, rising to `stableGroundTopY = 1.96m`) with Large Gable Window
  const vEastRangeMid = (vEastRangeNorth + vEastRangeSouth) * 0.5;
  addOutbuildingBrickWall(
    groundGroup,
    uStableEnd - wallT,
    uStableEnd,
    stableGroundFloorY - 0.14,
    stableGroundTopY,
    vEastRangeNorth,
    vEastRangeMid - 0.62,
    ['-x']
  );
  addOutbuildingBrickWall(
    groundGroup,
    uStableEnd - wallT,
    uStableEnd,
    stableGroundFloorY - 0.14,
    0.72,
    vEastRangeMid - 0.62,
    vEastRangeMid + 0.62,
    ['-x']
  );
  addOutbuildingBrickWall(
    groundGroup,
    uStableEnd - wallT,
    uStableEnd,
    1.64,
    stableGroundTopY,
    vEastRangeMid - 0.62,
    vEastRangeMid + 0.62,
    ['-x']
  );
  addOutbuildingBrickWall(
    groundGroup,
    uStableEnd - wallT,
    uStableEnd,
    stableGroundFloorY - 0.14,
    stableGroundTopY,
    vEastRangeMid + 0.62,
    vEastRangeSouth,
    ['-x']
  );
  addOutbuildingWindow(
    groundGroup,
    uStableEnd - wallT * 0.5,
    1.18,
    vEastRangeMid,
    1.24,
    0.92,
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

  // Wall-clinging Climbing Ivy on the North Courtyard Brick Pier between Store Door (`13.75m`) and Barn Door (`15.85m`) — Issue #10!
  addWallClimbingIvyCluster(
    groundGroup,
    14.8,
    baseYBarnStart + 0.35,
    vEastRangeNorth - 0.02,
    'z',
    -1,
    1.5,
    barnUpperEaveH - 0.45,
    409
  );

  // =========================================================================
  // 2B. OPPOSING INTERNAL BRICK PILASTERS, PRECISION-MITERED WEATHERED-OAK KING-POST
  //     ROOF TRUSSES & UPWARD-AIMING TRUSS SPOTLIGHTS (Issues #1 & #12!)
  //     - Issue #12 ("Remove this truss" at `[-8.877, 2.397, 15.113]`, `u = 13.62m`):
  //       Removed the Store truss (`u = 13.65m`), leaving only the 3 trusses in GYM (`2.86m`), Garage (`8.92m`), and Barn (`18.68m`).
  //     - Issue #1 ("No these spotlights are supposed to sit on top of the beam and point up into the rafters, one on each side"
  //       at `[-19.31, 2.113, 20.537]`, `outbuildings.roofTruss.gym.tieBeam`):
  //       Mounted 2 spotlights per truss (`sz = -1.18m` and `+1.18m`, one on each side of the king-post)
  //       sitting ON TOP of `tieBeam` (`y = tieTopY`) and pointing UPWARD into the rafters / vaulted ceiling!
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
  roofGroup.add(trussesGroup);

  const pilasterW = 0.3;
  const pilasterD = 0.16;
  const vInnerNorth = wallT; // 0.28m
  const vInnerSouth = vWestRangeSouth - wallT; // 5.43m
  const vSpanInternal = vInnerSouth - vInnerNorth; // 5.15m

  function vMidCenter(): number {
    return (vInnerNorth + vInnerSouth) * 0.5;
  }

  // Ground-floor opposing brick pilasters in the Stable (`u = 25.45m`, rising cleanly to `stableGroundTopY = 1.96m`, NO truss above!)
  for (const [vPMin, vPMax, pFace] of [
    [vInnerNorth, vInnerNorth + pilasterD, '+z'],
    [vInnerSouth - pilasterD, vInnerSouth, '-z'],
  ] as const) {
    addOutbuildingBrickWall(
      groundGroup,
      25.45 - pilasterW * 0.5,
      25.45 + pilasterW * 0.5,
      stableGroundFloorY - 0.08,
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
    // Bay 2: Garage (`u = 8.92m`)
    {
      id: 'garage',
      uCenter: 8.92,
      baseY: garageFloorTopY,
      tieBottomY: northWestWallTopY,
      ceilEaveY: westRangeCeilEaveY,
      ceilRidgeY: westRangeCeilRidgeY,
    },
    // Bay 3: Barn (`u = 18.68m` at the front edge of the mezzanine — Store truss at `u = 13.65m` removed per Issue #12!)
    {
      id: 'barn',
      uCenter: uMezzanineFront,
      baseY: barnLowerFloorY,
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
      ['+x', '-x', '+z'],
      warmRoomPlasterMat
    );
    addOutbuildingBrickWall(
      groundGroup,
      bay.uCenter - pilasterW * 0.5,
      bay.uCenter + pilasterW * 0.5,
      bay.baseY - 0.08,
      pilasterTopY,
      vInnerSouth - pilasterD,
      vInnerSouth,
      ['+x', '-x', '-z'],
      warmRoomPlasterMat
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

    // 2. Precision-Mitered Weathered-Oak King-Post Roof Truss (`outbuildings.roofTruss.<id>`)
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

    // 3. Issue #1 ("No these spotlights are supposed to sit on top of the beam and point up into the rafters, one on each side"
    //    at `[-19.31, 2.113, 20.537]`, `outbuildings.roofTruss.gym.tieBeam`):
    //    2 Architectural Uplight Spotlights per truss (`sz = -1.18m` and `+1.18m`, one on each side of the king-post),
    //    seated ON TOP of the oak tie-beam (`y = tieTopY`) and angled upward into the rafters / vaulted ceiling!
    const spotZPositions = [-1.18, 1.18] as const;
    for (let sIdx = 0; sIdx < spotZPositions.length; sIdx++) {
      const sz = spotZPositions[sIdx];
      const aimSignZ = sz < 0 ? -1 : 1;

      const spotGroup = new THREE.Group();
      spotGroup.name = `outbuildings.roofTruss.${bay.id}.spotlight.${sIdx + 1}`;
      spotGroup.position.set(0, tieTopY, sz);
      trussGroup.add(spotGroup);

      // Brushed-brass circular mounting base plate fixed to the TOP surface of the oak tie-beam
      const basePlate = new THREE.Mesh(
        new THREE.CylinderGeometry(0.038, 0.038, 0.012, 14),
        spotlightBrassTrimMat
      );
      basePlate.position.set(0, 0.006, 0);
      spotGroup.add(basePlate);

      // Dark-bronze U-stirrup yoke stem rising UPWARD from the base plate on top of the tie-beam
      const yokeStem = new THREE.Mesh(
        new THREE.BoxGeometry(0.018, 0.048, 0.044),
        spotlightHousingMat
      );
      yokeStem.position.set(0, 0.03, 0);
      spotGroup.add(yokeStem);

      // Pivoted cylindrical spotlight canister pointing UPWARD (`+Y`) into the rafters & vaulted ceiling
      const headPivot = new THREE.Group();
      headPivot.position.set(0, 0.052, 0);
      headPivot.rotation.x = -aimSignZ * 0.32;
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
      bezelRing.position.set(0, 0.04, 0);
      headPivot.add(bezelRing);

      const lensMat = new THREE.MeshStandardMaterial({
        color: 0xfff3d6,
        emissive: new THREE.Color(0xffca70),
        emissiveIntensity: 1.75,
        roughness: 0.18,
        metalness: 0.05,
      });
      const lensDisc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.006, 16),
        lensMat
      );
      lensDisc.name = `outbuildings.roofTruss.${bay.id}.spotlightLens.${sIdx + 1}`;
      lensDisc.position.set(0, 0.045, 0);
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
  // 2C. BARN MEZZANINE LOWERED DECK, UNDER-CEILING SOFFIT & STABLE GROUND-FLOOR CEILING SOFFIT
  //     (Issues #2, #3 & #6: SE Corner Stairwell Opening `u = 21.14..23.016m, v = 3.56..5.426m` +
  //      attached to `groundCeilingGroup` so ground-floor cutaway hides the soffit & front beam!)
  // =========================================================================
  // 1. West full-width soffit (`u = 18.862m .. 21.14m`, `v = 0.284m .. 5.426m`)
  const mezzanineCeilingSoffit = new THREE.Mesh(
    new THREE.BoxGeometry(2.278, 0.033, 5.142),
    warmRoomPlasterMat
  );
  mezzanineCeilingSoffit.name = 'outbuildings.barn.mezzanineCeilingSoffit';
  mezzanineCeilingSoffit.position.set(
    20.001,
    mezzanineUndersideY + 0.0115,
    2.855
  );
  mezzanineCeilingSoffit.receiveShadow = true;
  groundCeilingGroup.add(mezzanineCeilingSoffit);

  // 2. East North-side soffit (`u = 21.14m .. 23.016m`, `v = 0.284m .. 3.56m`) leaving the SE stairwell opening clear
  const mezzanineCeilingSoffitEastNorth = new THREE.Mesh(
    new THREE.BoxGeometry(1.876, 0.033, 3.276),
    warmRoomPlasterMat
  );
  mezzanineCeilingSoffitEastNorth.name = 'outbuildings.barn.mezzanineCeilingSoffit.eastNorth';
  mezzanineCeilingSoffitEastNorth.position.set(
    22.078,
    mezzanineUndersideY + 0.0115,
    1.922
  );
  mezzanineCeilingSoffitEastNorth.receiveShadow = true;
  groundCeilingGroup.add(mezzanineCeilingSoffitEastNorth);

  const bressummerSpanV = eastRangeInternalV - pilasterD * 2 - 0.008; // 4.822m between North & South pilasters
  const mezzanineFrontBressummer = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.138, bressummerSpanV),
    trussOakMat
  );
  mezzanineFrontBressummer.name = 'outbuildings.barn.mezzanineFrontBeam';
  mezzanineFrontBressummer.position.set(
    uMezzanineFront + 0.09,
    1.359,
    vMidCenter()
  );
  mezzanineFrontBressummer.castShadow = true;
  groundCeilingGroup.add(mezzanineFrontBressummer);

  // Plastered ground-floor ceiling soffit in the 2-Storey Stable (`y = 1.96m`, `2.40m` headroom above `-0.44m` Stable floor)
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
  groundCeilingGroup.add(stableGroundCeilingSoffit);

  // =========================================================================
  // 3. OUTBUILDING FIRST FLOOR OVER BARN MEZZANINE (`1.54m`) & 2-STOREY STABLE (`2.08m` — Issue #11!)
  //    With SE Corner Stairwell Cutout (`u = 21.14..23.016m, v = 3.56..5.426m`) for Haldane UK Spiral Staircase
  // =========================================================================
  // Issue #2 ("Fix the scale and UV mapping of the floor in there" at `[-1.809, 1.54, 17.735]`):
  // 1. West full-width floor slab (`u = 18.684m .. 21.14m`, `v = 0.284m .. 5.426m`) with world-space plank UVs (`uvScale = 0.5`)
  const westUpperSlabGeo = new THREE.BoxGeometry(2.456, 0.11, 5.142);
  applyOutbuildingFloorUVs(westUpperSlabGeo, 19.912, mezzanineFloorY - 0.055, 2.855, 0.5);
  const westUpperRoomSlab = new THREE.Mesh(
    westUpperSlabGeo,
    lightJoineryOakMat
  );
  westUpperRoomSlab.name = 'outbuildings.firstFloor.westRoomSlab';
  westUpperRoomSlab.position.set(
    19.912,
    mezzanineFloorY - 0.055,
    2.855
  );
  westUpperRoomSlab.receiveShadow = true;
  firstFloorGroup.add(westUpperRoomSlab);

  // 2. East North-side floor slab (`u = 21.14m .. 23.016m`, `v = 0.284m .. 3.56m`) with seamless world-space plank UVs (`uvScale = 0.5`)
  const westUpperEastNorthGeo = new THREE.BoxGeometry(1.876, 0.11, 3.276);
  applyOutbuildingFloorUVs(westUpperEastNorthGeo, 22.078, mezzanineFloorY - 0.055, 1.922, 0.5);
  const westUpperRoomSlabEastNorth = new THREE.Mesh(
    westUpperEastNorthGeo,
    lightJoineryOakMat
  );
  westUpperRoomSlabEastNorth.name = 'outbuildings.firstFloor.westRoomSlab.eastNorth';
  westUpperRoomSlabEastNorth.position.set(
    22.078,
    mezzanineFloorY - 0.055,
    1.922
  );
  westUpperRoomSlabEastNorth.receiveShadow = true;
  firstFloorGroup.add(westUpperRoomSlabEastNorth);

  // 3. Solid light-oak stairwell edge fascia trim boards (`0.022m` thick x `0.145m` high, `y = 1.395..1.54m`) along the open stairwell cutout edges
  const stairwellWestFasciaGeo = new THREE.BoxGeometry(0.022, 0.145, 5.426 - 4.85);
  applyOutbuildingFloorUVs(stairwellWestFasciaGeo, 21.14, 1.4675, (4.85 + 5.426) * 0.5, 0.5);
  const stairwellWestFascia = new THREE.Mesh(
    stairwellWestFasciaGeo,
    lightJoineryOakMat
  );
  stairwellWestFascia.name = 'outbuildings.firstFloor.stairwellFascia.west';
  stairwellWestFascia.position.set(21.14, 1.4675, (4.85 + 5.426) * 0.5);
  stairwellWestFascia.castShadow = true;
  firstFloorGroup.add(stairwellWestFascia);

  const stairwellNorthFasciaGeo = new THREE.BoxGeometry(23.016 - 22.04, 0.145, 0.022);
  applyOutbuildingFloorUVs(stairwellNorthFasciaGeo, (22.04 + 23.016) * 0.5, 1.4675, 3.56, 0.5);
  const stairwellNorthFascia = new THREE.Mesh(
    stairwellNorthFasciaGeo,
    lightJoineryOakMat
  );
  stairwellNorthFascia.name = 'outbuildings.firstFloor.stairwellFascia.north';
  stairwellNorthFascia.position.set((22.04 + 23.016) * 0.5, 1.4675, 3.56);
  stairwellNorthFascia.castShadow = true;
  firstFloorGroup.add(stairwellNorthFascia);

  // Solid light-oak front fascia trim strip along the Barn Mezzanine leading edge between the pilasters (`u = uMezzanineFront - 0.005`)
  const mezzanineFrontFasciaGeo = new THREE.BoxGeometry(0.018, 0.11, eastRangeInternalV - 0.328);
  applyOutbuildingFloorUVs(mezzanineFrontFasciaGeo, uMezzanineFront - 0.005, mezzanineFloorY - 0.055, vMidCenter(), 0.5);
  const mezzanineFrontFascia = new THREE.Mesh(
    mezzanineFrontFasciaGeo,
    lightJoineryOakMat
  );
  mezzanineFrontFascia.name = 'outbuildings.firstFloor.mezzanineFrontFascia';
  mezzanineFrontFascia.position.set(
    uMezzanineFront - 0.005,
    mezzanineFloorY - 0.055,
    vMidCenter()
  );
  mezzanineFrontFascia.castShadow = true;
  firstFloorGroup.add(mezzanineFrontFascia);

  // Issue #2 ("This should match the bannisters too soft. tounded top" at `[-3.441, 2.492, 18.633]`, `outbuildings.firstFloor.mezzanineHandrail`) &
  // Issue #3 ("So should this" at `[-0.924, 2.462, 17.676]`, `outbuildings.barn.mezzanineStairwellGuardrail`):
  // Unified both the Front Mezzanine Balustrade (`u = 18.76m, v = 0.36..5.35m`) and the Stairwell Guardrails
  // (`v = 3.54m, u = 21.12..22.24m` and `u = 21.12m, v = 4.85..5.37m`) to match `outbuildings.firstFloor.stableUpStairs`
  // and `outbuildings.barn.spiralStaircase`:
  // - Rounded cylindrical solid-oak top handrails (`CylinderGeometry(0.026, 0.026, len, 20)`) at `y = mezzanineFloorY + 0.86m`
  // - Turned cylindrical solid-oak newel posts (`CylinderGeometry(0.034, 0.038, 0.92, 20)`) with spherical finial caps (`SphereGeometry(0.042, 16, 12)`)
  // - Toughened glass banister panels with brushed stainless-steel cylindrical stand-off clamps (`CylinderGeometry(0.016, 0.016, 0.036, 14)`)
  //   and rounded-top solid-oak bottom shoe rails!
  const balustradeClampMat = new THREE.MeshStandardMaterial({
    color: 0xd8dde4,
    roughness: 0.2,
    metalness: 0.9,
  });

  const handrailLenV = 5.35 - 0.36; // 4.99m between outer turned newel posts
  const handrailCenterV = vMidCenter(); // 2.855m
  const mezzanineTopRail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, handrailLenV, 20),
    lightJoineryOakMat
  );
  mezzanineTopRail.name = 'outbuildings.firstFloor.mezzanineHandrail';
  mezzanineTopRail.rotation.x = Math.PI / 2;
  mezzanineTopRail.position.set(uMezzanineFront + 0.08, mezzanineFloorY + 0.86, handrailCenterV);
  mezzanineTopRail.castShadow = true;
  firstFloorGroup.add(mezzanineTopRail);

  const mezzanineBottomRail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, handrailLenV, 18),
    lightJoineryOakMat
  );
  mezzanineBottomRail.name = 'outbuildings.firstFloor.mezzanineBottomRail';
  mezzanineBottomRail.rotation.x = Math.PI / 2;
  mezzanineBottomRail.position.set(uMezzanineFront + 0.08, mezzanineFloorY + 0.07, handrailCenterV);
  firstFloorGroup.add(mezzanineBottomRail);

  for (const [pIdx, pv] of [
    [1, 0.36],
    [2, 2.855],
    [3, 5.35],
  ] as const) {
    const newelPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.034, 0.038, 0.92, 20),
      lightJoineryOakPostMat
    );
    newelPost.name = `outbuildings.firstFloor.mezzaninePost.${pIdx}`;
    newelPost.position.set(uMezzanineFront + 0.08, mezzanineFloorY + 0.46, pv);
    newelPost.castShadow = true;
    firstFloorGroup.add(newelPost);

    const newelCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.042, 16, 12),
      lightJoineryOakMat
    );
    newelCap.name = `outbuildings.firstFloor.mezzaninePost.${pIdx}`;
    newelCap.position.set(uMezzanineFront + 0.08, mezzanineFloorY + 0.934, pv);
    firstFloorGroup.add(newelCap);
  }

  for (const [gIdx, gv] of [
    [1, 1.6075],
    [2, 4.1025],
  ] as const) {
    const glassPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, 0.72, 2.38),
      windowGlassMat
    );
    glassPanel.name = `outbuildings.firstFloor.mezzanineGlassPanel.${gIdx}`;
    glassPanel.position.set(uMezzanineFront + 0.08, mezzanineFloorY + 0.465, gv);
    firstFloorGroup.add(glassPanel);

    for (const cvOff of [-0.92, 0.92] as const) {
      for (const cyOff of [0.12, 0.8] as const) {
        const clamp = new THREE.Mesh(
          new THREE.CylinderGeometry(0.016, 0.016, 0.036, 14),
          balustradeClampMat
        );
        clamp.rotation.z = Math.PI / 2;
        clamp.position.set(uMezzanineFront + 0.08, mezzanineFloorY + cyOff, gv + cvOff);
        firstFloorGroup.add(clamp);
      }
    }
  }

  // Issue #1 ("Isn't this in the wrong place?" at `[-0.75, 2.126, 17.694]` -> `u = 21.495m, v = 3.547m`) &
  // Issue #2 ("Should it not be across here?" at `[-0.192, 1.545, 18.252]` -> `u = 22.003m, v = 4.151m` on `spiralStaircase.topLanding`):
  // Removed the guardrail across `v = 3.54m, u = 21.12..22.02m` (where `topLanding` and `westRoomSlab.eastNorth` are both at `y = 1.54m`)
  // and placed the guardrail along the actual East drop-off edge of `spiralStaircase.topLanding` (`u = 22.02m, v = 3.54..4.44m`,
  // tying into the Spiral Staircase Central Column at `u = 22.08m, v = 4.50m`) with a short `22cm` return (`u = 22.02..22.24m, v = 3.54m`)
  // into the bottom South newel post of `stableUpStairs` (`u = 22.24m, v = 3.54m`)!
  const stairwellGuardrailGroup = new THREE.Group();
  stairwellGuardrailGroup.name = 'outbuildings.barn.mezzanineStairwellGuardrail';
  firstFloorGroup.add(stairwellGuardrailGroup);

  // 1. East Landing Guardrail running North-South along the East edge of `topLanding` (`u = 22.02m, v = 3.54..4.44m`)
  const swEastU = 22.02;
  const swEastLenV = 4.44 - 3.54; // 0.90m (from v = 3.54m corner newel post to v = 4.44m spiral central column!)
  const swEastMidV = (3.54 + 4.44) * 0.5; // 3.99m
  const swEastTopRail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, swEastLenV, 20),
    lightJoineryOakMat
  );
  swEastTopRail.name = 'outbuildings.barn.mezzanineStairwellGuardrail';
  swEastTopRail.rotation.x = Math.PI / 2;
  swEastTopRail.position.set(swEastU, mezzanineFloorY + 0.86, swEastMidV);
  swEastTopRail.castShadow = true;
  stairwellGuardrailGroup.add(swEastTopRail);

  const swEastBotRail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, swEastLenV, 18),
    lightJoineryOakMat
  );
  swEastBotRail.rotation.x = Math.PI / 2;
  swEastBotRail.position.set(swEastU, mezzanineFloorY + 0.07, swEastMidV);
  stairwellGuardrailGroup.add(swEastBotRail);

  const swEastGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.72, swEastLenV - 0.08),
    windowGlassMat
  );
  swEastGlass.name = 'outbuildings.barn.mezzanineStairwellGuardrail';
  swEastGlass.position.set(swEastU, mezzanineFloorY + 0.465, swEastMidV);
  stairwellGuardrailGroup.add(swEastGlass);

  for (const cvOff of [-0.28, 0.28] as const) {
    for (const cyOff of [0.12, 0.8] as const) {
      const clamp = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.036, 14),
        balustradeClampMat
      );
      clamp.rotation.z = Math.PI / 2;
      clamp.position.set(swEastU, mezzanineFloorY + cyOff, swEastMidV + cvOff);
      stairwellGuardrailGroup.add(clamp);
    }
  }

  // 2. Short `22cm` North Return (`u = 22.02..22.24m, v = 3.54m`) connecting `(22.02, 3.54)` to `stableUpStairs` bottom newel `(22.24, 3.54)`
  const swReturnLenU = 22.24 - swEastU; // 0.22m
  const swReturnMidU = (swEastU + 22.24) * 0.5; // 22.13m
  const swReturnTopRail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, swReturnLenU, 18),
    lightJoineryOakMat
  );
  swReturnTopRail.name = 'outbuildings.barn.mezzanineStairwellGuardrail';
  swReturnTopRail.rotation.z = Math.PI / 2;
  swReturnTopRail.position.set(swReturnMidU, mezzanineFloorY + 0.86, 3.54);
  swReturnTopRail.castShadow = true;
  stairwellGuardrailGroup.add(swReturnTopRail);

  const swReturnBotRail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, swReturnLenU, 16),
    lightJoineryOakMat
  );
  swReturnBotRail.rotation.z = Math.PI / 2;
  swReturnBotRail.position.set(swReturnMidU, mezzanineFloorY + 0.07, 3.54);
  stairwellGuardrailGroup.add(swReturnBotRail);

  const swReturnGlass = new THREE.Mesh(
    new THREE.BoxGeometry(swReturnLenU - 0.06, 0.72, 0.014),
    windowGlassMat
  );
  swReturnGlass.position.set(swReturnMidU, mezzanineFloorY + 0.465, 3.54);
  stairwellGuardrailGroup.add(swReturnGlass);

  // 3. South segment of West stairwell edge (`u = 21.12m, v = 4.85..5.37m`, meeting the shared spiral-staircase top newel post at `v = 4.85m`!)
  const swWestLenV = 5.37 - 4.85; // 0.52m
  const swWestMidV = (4.85 + 5.37) * 0.5; // 5.11m
  const swWestTopRail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.026, 0.026, swWestLenV, 20),
    lightJoineryOakMat
  );
  swWestTopRail.name = 'outbuildings.barn.mezzanineStairwellGuardrail';
  swWestTopRail.rotation.x = Math.PI / 2;
  swWestTopRail.position.set(21.12, mezzanineFloorY + 0.86, swWestMidV);
  swWestTopRail.castShadow = true;
  stairwellGuardrailGroup.add(swWestTopRail);

  const swWestBotRail = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, swWestLenV, 18),
    lightJoineryOakMat
  );
  swWestBotRail.rotation.x = Math.PI / 2;
  swWestBotRail.position.set(21.12, mezzanineFloorY + 0.07, swWestMidV);
  stairwellGuardrailGroup.add(swWestBotRail);

  const swWestGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.72, swWestLenV - 0.08),
    windowGlassMat
  );
  swWestGlass.position.set(21.12, mezzanineFloorY + 0.465, swWestMidV);
  stairwellGuardrailGroup.add(swWestGlass);

  for (const cvOff of [-0.14, 0.14] as const) {
    for (const cyOff of [0.12, 0.8] as const) {
      const clamp = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.036, 14),
        balustradeClampMat
      );
      clamp.rotation.z = Math.PI / 2;
      clamp.position.set(21.12, mezzanineFloorY + cyOff, swWestMidV + cvOff);
      stairwellGuardrailGroup.add(clamp);
    }
  }

  for (const [pu, pv] of [
    [swEastU, 3.54],
    [21.12, 5.37],
  ] as const) {
    const swPost = new THREE.Mesh(
      new THREE.CylinderGeometry(0.034, 0.038, 0.92, 20),
      lightJoineryOakPostMat
    );
    swPost.position.set(pu, mezzanineFloorY + 0.46, pv);
    swPost.castShadow = true;
    stairwellGuardrailGroup.add(swPost);

    const swPostCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.042, 16, 12),
      lightJoineryOakMat
    );
    swPostCap.position.set(pu, mezzanineFloorY + 0.934, pv);
    stairwellGuardrailGroup.add(swPostCap);
  }

  // 1990s Retro Gaming & Lounge Zone on top of the Barn Mezzanine (`outbuildings.mezzanine.retroLounge`)
  buildBarnMezzanineRetroLounge(firstFloorGroup, mezzanineFloorY);

  // Issue #4 ("Carpet in here like the upstairs bedrooms, fix the scale" at `[5.5, 2.08, 15.313]`):
  // East First-Floor Room Woven Wool Carpet Slab (`5.55m x 5.15m`, u = 23.22m..28.77m, `stableUpperFloorY = 2.08m`)
  // with `upstairsWovenWoolCarpet` material and world-space `uvScale = 0.5` matching the upstairs bedrooms!
  const stableSlabCenterU = uStableStart + 5.55 * 0.5;
  const stableSlabCenterY = stableUpperFloorY - 0.055;
  const stableSlabCenterV = vEastRangeNorth + wallT + eastRangeInternalV * 0.5;
  const eastUpperRoomSlabGeo = new THREE.BoxGeometry(5.55, 0.11, eastRangeInternalV);
  applyOutbuildingFloorUVs(eastUpperRoomSlabGeo, stableSlabCenterU, stableSlabCenterY, stableSlabCenterV, 0.5);
  const eastUpperRoomSlab = new THREE.Mesh(
    eastUpperRoomSlabGeo,
    stableUpperCarpetMat
  );
  eastUpperRoomSlab.name = 'outbuildings.firstFloor.stableRoomSlab';
  eastUpperRoomSlab.position.set(
    stableSlabCenterU,
    stableSlabCenterY,
    stableSlabCenterV
  );
  eastUpperRoomSlab.receiveShadow = true;
  firstFloorGroup.add(eastUpperRoomSlab);

  // Issue #8 ("Put a small ensuite in this corner with shower, toilet, sink" at `[2.44, 2.08, 18.808]`):
  buildStableUpperEnsuite(
    firstFloorGroup,
    stableUpperFloorY,
    stableUpperTopY,
    lightJoineryOakMat,
    warmRoomPlasterMat,
    windowGlassMat
  );

  // STEP #1 Upper Exterior Brick Walls of Level 2 (`Store + Barn`: u = 12.07m..23.02m, y = eastRangeGroundTopY..barnUpperTopY)
  // North Courtyard wall has the single upper hayloft window at u = 19.85m
  addOutbuildingBrickWallWithWindows(
    firstFloorGroup,
    uStoreStart,
    uBarnEnd - partT,
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
    uBarnEnd - partT,
    eastRangeGroundTopY,
    barnUpperTopY,
    vEastRangeSouth - wallT,
    vEastRangeSouth,
    ['-z']
  );

  // Vaulted eave frieze strips inside Store (`u = 12.31..14.96m`) and Barn (`u = 15.20..23.02m`)
  addVaultedRoomEaveFriezeStrips(
    roofGroup,
    uStoreStart + 0.24,
    uBarnStart,
    vInnerNorth,
    vInnerSouth,
    barnUpperTopY,
    barnCeilEaveY
  );
  addVaultedRoomEaveFriezeStrips(
    roofGroup,
    uBarnStart + 0.24,
    uBarnEnd - partT,
    vInnerNorth,
    vInnerSouth,
    barnUpperTopY,
    barnCeilEaveY
  );

  // STEP #2 Upper Exterior Brick Walls of Level 3 (`2-Storey Stable`: u = 23.02m..29.05m, y = stableGroundTopY..stableUpperTopY = 1.96m..3.32m)
  // Single North 1st-floor window at u = 26.35m and single South 1st-floor window at u = 26.35m
  addOutbuildingBrickWallWithWindows(
    firstFloorGroup,
    uBarnEnd - partT,
    uStableEnd,
    stableGroundTopY,
    stableUpperTopY,
    vEastRangeNorth,
    vEastRangeNorth + wallT,
    ['+z'],
    [{ uCenter: 26.35, yCenter: stableUpperFloorY + 0.66, width: 0.88, height: 0.82 }]
  );
  // Issue #11 ("This window needs to be frosted" at `[4.304, 2.734, 19.324]`):
  addOutbuildingBrickWallWithWindows(
    firstFloorGroup,
    uBarnEnd - partT,
    uStableEnd,
    stableGroundTopY,
    stableUpperTopY,
    vEastRangeSouth - wallT,
    vEastRangeSouth,
    ['-z'],
    [{ uCenter: 26.35, yCenter: stableUpperFloorY + 0.66, width: 0.88, height: 0.82, isFrosted: true }]
  );

  // Vaulted eave frieze strips inside the 2-Storey Stable Upper Room (`u = 23.22..28.77m`)
  addVaultedRoomEaveFriezeStrips(
    roofGroup,
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
    roofGroup,
    uStableEnd - wallT - 0.005,
    uStableEnd - wallT + 0.03,
    vInnerNorth,
    vInnerSouth,
    stableUpperTopY,
    stableCeilEaveY,
    stableCeilRidgeY,
    'outbuildings.stable.eastGableInteriorPlaster'
  );

  // Issue #1 ("on cutout mode this wall should come higher up" at `[0.522, 2.491, 14.685]`):
  // Internal 1st-Floor Partition between the Barn Mezzanine (`mezzanineFloorY = 1.54m`) and the Stable Upper Room (`stableUpperFloorY = 2.08m`)
  // at `u = 23.02m..23.22m`: raise both piers (`v = 0.282..2.40m` and `v = 3.30..5.428m`) on `firstFloorGroup` all the way up
  // to `stableUpperTopY = 3.32m` so in 1st-floor cutaway mode this wall matches the full `3.32m` Stable wall height!
  addOutbuildingBrickWall(
    firstFloorGroup,
    uBarnEnd - partT,
    uBarnEnd,
    stableGroundTopY,
    stableUpperTopY,
    vEastRangeNorth + wallT + 0.002,
    2.554,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  addOutbuildingBrickWall(
    firstFloorGroup,
    uBarnEnd - partT,
    uBarnEnd,
    stableGroundTopY,
    stableUpperTopY,
    3.554,
    vEastRangeSouth - wallT - 0.002,
    ['+x', '-x', '+z', '-z'],
    warmRoomPlasterMat
  );
  // Issue #1 ("Make this a full height entrance" at `[0.883, 2.92, 16.92]`, `outbuildings.firstFloor.stableUpStairs`) &
  // Issue #4 ("Could the bannisters here not be merged somehow? Rather than this akward gap between the 2"):
  // Full-height doorway entrance (`portalTopY = stableUpperFloorY + 2.00 = 4.08m`) across `v = 2.554..3.554m`.
  const stableEntrancePortalTopY = stableUpperFloorY + 2.0; // 4.08m (2.00m full-height doorway above 2.08m floor)
  {
    const addGableWithPortalCutout = (
      uMinG: number,
      uMaxG: number,
      ceilEaveY: number,
      ceilRidgeY: number,
      meshName: string
    ): void => {
      const vMinG = vInnerNorth + 0.002;
      const vMaxG = vInnerSouth - 0.002;
      const vMidG = (vMinG + vMaxG) * 0.5; // 2.855m
      const halfSpanG = (vMaxG - vMinG) * 0.5; // 2.573m
      const doorV0 = 2.554 - vMidG;
      const doorV1 = 3.554 - vMidG;
      const eaveCornerY = Math.max(stableUpperTopY, ceilEaveY);
      // Polygon in `(v - vMidG, y)` coordinates with the central doorway cutout (`doorV0..doorV1, y = stableUpperTopY..stableEntrancePortalTopY`)
      const geo = createExtrudedVYPolygon(
        [
          [-halfSpanG, stableUpperTopY],
          [doorV0, stableUpperTopY],
          [doorV0, stableEntrancePortalTopY],
          [doorV1, stableEntrancePortalTopY],
          [doorV1, stableUpperTopY],
          [halfSpanG, stableUpperTopY],
          [halfSpanG, eaveCornerY],
          [0, ceilRidgeY],
          [-halfSpanG, eaveCornerY],
        ],
        uMaxG - uMinG
      );
      const mesh = new THREE.Mesh(geo, warmRoomPlasterMat);
      mesh.name = meshName;
      mesh.userData.isArchitecturalShell = true;
      mesh.position.set(uMinG, 0, vMidG);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      roofGroup.add(mesh);
    };

    addGableWithPortalCutout(
      uBarnEnd - partT,
      uBarnEnd,
      barnCeilEaveY,
      barnCeilRidgeY,
      'outbuildings.barnStablePartitionGable'
    );
    addGableWithPortalCutout(
      uBarnEnd - 0.025,
      uBarnEnd + 0.005,
      stableCeilEaveY,
      stableCeilRidgeY,
      'outbuildings.stable.westGableInteriorPlaster'
    );
  }

  // Issue #3 ("Bullnose these stairs correctly and improve the general carpentry" at `[0.471, 1.9, 16.881]`, `outbuildings.firstFloor.stableUpStep.2`):
  // Bespoke 3-Step Bullnose Light-Oak Staircase & Doorway Joinery Assembly (`outbuildings.firstFloor.stableUpStairs`)
  // connecting the Barn Mezzanine (`mezzanineFloorY = 1.54m`) up to the Stable Upper Room (`stableUpperFloorY = 2.08m`):
  // - Closed solid light-oak side stringer boards (`28mm` thick at `v = 2.414m` & `v = 3.286m`) with raked top moulding caps & bottom newel stops
  // - Recessed painted/oak vertical risers (`18mm` thick) under each step and under the top landing threshold (`u = 23.02m`)
  // - Overhanging solid light-oak treads (`30mm` thick, `22mm` projection) with **half-round cylindrical bullnose leading edges**,
  //   return bullnose end caps, scotia cove mouldings underneath each nosing, and world-space oak UVs (`uvScale = 0.5`)
  // - 4th bullnose light-oak top landing threshold nosing (`outbuildings.firstFloor.stableUpStep.topNosing`) at `u = 23.02m, y = 2.08m`
  // - Moulded light-oak doorway jamb linings, head lining, and chamfered architraves framing the `v = 2.40..3.30m` opening!
  {
    const upStairsGroup = new THREE.Group();
    upStairsGroup.name = 'outbuildings.firstFloor.stableUpStairs';
    firstFloorGroup.add(upStairsGroup);

    // Issue #8 ("Make these stairs more coherant witht he spiral" at `[0.213, 1.739, 16.929]`):
    // Upgraded `outbuildings.firstFloor.stableUpStairs` to an Open-Riser Solid American White Oak,
    // Toughened Glass & Brushed Stainless-Clamp 3-Step Feature Flight matching the Haldane UK Spiral Staircase:
    // - Open risers (no solid plaster carcass block or white painted risers) with `36mm` thick solid oak bullnose treads
    // - Turned cylindrical solid-oak central support pedestals & raked central oak spine beam underneath the treads
    // - Laminated solid-oak raked side stringers (`lightJoineryOakPostMat`) with rounded top & bottom edge beads
    // - Turned cylindrical solid-oak newel posts (`r = 0.036m`) with spherical oak finial caps (`r = 0.044m`)
    // - Raked cylindrical solid-oak handrails (`r = 0.026m`) and raked toughened glass banister panels with
    //   brushed stainless-steel stand-off spigot clamps!
    const numUpSteps = 3;
    const upRiseTotal = stableUpperFloorY - mezzanineFloorY; // 0.54m
    const stepRiserH = upRiseTotal / numUpSteps; // 0.18m per step
    const stepGoingU = 0.25; // 250mm going per tread
    const treadT = 0.036; // 36mm thick solid American white oak tread matching spiral staircase
    const bullnoseR = treadT * 0.5; // 18mm half-round bullnose radius
    const nosingOverhangU = 0.026; // 26mm overhanging bullnose nosing
    const stringerT = 0.028; // 28mm thick laminated solid-oak side stringer ribbons
    // Issue #4: `stairOpeningW = 1.00m` centered at `stairCenterV = 3.054m` (`v = 2.554..3.554m`)
    // so the South stringer & banister lie at `sv = 3.054 + (0.50 - 0.014) = 3.54m`, merging directly into the stairwell guardrail!
    const stairOpeningW = 1.0; // v = 2.554m..3.554m
    const stairCenterV = 3.054;
    const treadClearW = stairOpeningW - stringerT * 2; // 0.844m clear tread width between oak side stringers
    const upFlightEndU = uBarnEnd - partT; // 23.02m (West face of Barn/Stable partition wall)
    const upStartU = upFlightEndU - numUpSteps * stepGoingU; // 22.27m

    const stainlessClampMat = new THREE.MeshStandardMaterial({
      color: 0xd8dde4,
      roughness: 0.2,
      metalness: 0.9,
    });

    // Central raked solid-oak spine stringer beam + turned oak support drums under each open-riser tread
    const stringerPitchAngle = Math.atan2(upRiseTotal, numUpSteps * stepGoingU); // ~35.75°
    const stringerDiagLen = Math.hypot(numUpSteps * stepGoingU, upRiseTotal) + 0.06;

    const centerSpineBeam = new THREE.Mesh(
      new THREE.BoxGeometry(stringerDiagLen, 0.095, 0.085),
      lightJoineryOakPostMat
    );
    centerSpineBeam.name = 'outbuildings.firstFloor.stableUpStairs.centerSpine';
    centerSpineBeam.position.set(
      upStartU + (numUpSteps * stepGoingU) * 0.5 + 0.02,
      mezzanineFloorY + upRiseTotal * 0.5 - 0.06,
      stairCenterV
    );
    centerSpineBeam.rotation.z = stringerPitchAngle;
    centerSpineBeam.castShadow = true;
    upStairsGroup.add(centerSpineBeam);

    for (let s = 0; s < numUpSteps; s++) {
      const stepTopY = mezzanineFloorY + (s + 1) * stepRiserH;
      const riserFrontU = upStartU + s * stepGoingU;
      const stepBackU = riserFrontU + stepGoingU;

      // 1. Turned Solid-Oak Cylindrical Support Pedestal Drum under center of each open-riser tread (matching spiral center column!)
      const drumH = stepRiserH - treadT + 0.04;
      const supportDrum = new THREE.Mesh(
        new THREE.CylinderGeometry(0.056, 0.056, drumH, 20),
        lightJoineryOakPostMat
      );
      supportDrum.name = `outbuildings.firstFloor.stableUpStep.supportDrum.${s + 1}`;
      supportDrum.position.set(
        riserFrontU + stepGoingU * 0.48,
        stepTopY - treadT - drumH * 0.5 + 0.01,
        stairCenterV
      );
      supportDrum.castShadow = true;
      upStairsGroup.add(supportDrum);

      // 2. Overhanging Solid American White Oak Tread Board (`outbuildings.firstFloor.stableUpStep.1..3`) with world-space oak UVs
      const treadFlatDepthU = stepGoingU + nosingOverhangU - bullnoseR;
      const treadFlatCenterU = stepBackU - treadFlatDepthU * 0.5;
      const treadCenterY = stepTopY - treadT * 0.5;
      const treadWidthV = treadClearW;

      const treadGeo = new THREE.BoxGeometry(treadFlatDepthU, treadT, treadWidthV);
      applyOutbuildingFloorUVs(treadGeo, treadFlatCenterU, treadCenterY, stairCenterV, 0.5);
      const treadMesh = new THREE.Mesh(treadGeo, lightJoineryOakMat);
      treadMesh.name = `outbuildings.firstFloor.stableUpStep.${s + 1}`;
      treadMesh.position.set(treadFlatCenterU, treadCenterY, stairCenterV);
      treadMesh.castShadow = true;
      treadMesh.receiveShadow = true;
      firstFloorGroup.add(treadMesh);

      // 3. Rounded Half-Round Cylindrical Bullnose Leading Edge (`CylinderGeometry` along `Z` at `-u` leading edge)
      const bullnoseCenterU = riserFrontU - nosingOverhangU + bullnoseR;
      const bullnoseCyl = new THREE.Mesh(
        new THREE.CylinderGeometry(bullnoseR, bullnoseR, treadWidthV, 18),
        lightJoineryOakMat
      );
      bullnoseCyl.name = `outbuildings.firstFloor.stableUpStep.${s + 1}`;
      bullnoseCyl.rotation.x = Math.PI / 2;
      bullnoseCyl.position.set(bullnoseCenterU, treadCenterY, stairCenterV);
      bullnoseCyl.castShadow = true;
      bullnoseCyl.receiveShadow = true;
      upStairsGroup.add(bullnoseCyl);

      // 4. Tapered solid-oak under-tread rib bracket (`0.18m x 0.028m x 0.68m`) matching `spiralStaircase.tread` spine ribs!
      const underRib = new THREE.Mesh(
        new THREE.BoxGeometry(stepGoingU * 0.72, 0.026, treadWidthV - 0.06),
        lightJoineryOakPostMat
      );
      underRib.position.set(
        treadFlatCenterU,
        stepTopY - treadT - 0.013,
        stairCenterV
      );
      upStairsGroup.add(underRib);
    }

    // 5. Top Threshold Solid-Oak Fascia & 4th Bullnose Light-Oak Threshold Nosing at `u = 23.02m, y = stableUpperFloorY = 2.08m`
    const topFasciaH = stableUpperFloorY - mezzanineFloorY - treadT;
    const topFasciaGeo = new THREE.BoxGeometry(0.022, topFasciaH, stairOpeningW);
    applyOutbuildingFloorUVs(topFasciaGeo, upFlightEndU - 0.05, mezzanineFloorY + topFasciaH * 0.5, stairCenterV, 0.5);
    const topOakFascia = new THREE.Mesh(topFasciaGeo, lightJoineryOakMat);
    topOakFascia.name = 'outbuildings.firstFloor.stableUpStep.topFascia';
    topOakFascia.position.set(
      upFlightEndU - 0.05,
      mezzanineFloorY + topFasciaH * 0.5,
      stairCenterV
    );
    topOakFascia.castShadow = true;
    upStairsGroup.add(topOakFascia);

    const topNosingDepthU = partT + 0.036;
    const topNosingGeo = new THREE.BoxGeometry(topNosingDepthU, treadT, treadClearW);
    applyOutbuildingFloorUVs(
      topNosingGeo,
      upFlightEndU + partT * 0.5 - 0.006,
      stableUpperFloorY - treadT * 0.5 + 0.002,
      stairCenterV,
      0.5
    );
    const topNosingBoard = new THREE.Mesh(topNosingGeo, lightJoineryOakMat);
    topNosingBoard.name = 'outbuildings.firstFloor.stableUpStep.topNosing';
    topNosingBoard.position.set(
      upFlightEndU + partT * 0.5 - 0.006,
      stableUpperFloorY - treadT * 0.5 + 0.002,
      stairCenterV
    );
    topNosingBoard.castShadow = true;
    topNosingBoard.receiveShadow = true;
    upStairsGroup.add(topNosingBoard);

    const topBullnoseCyl = new THREE.Mesh(
      new THREE.CylinderGeometry(bullnoseR, bullnoseR, treadClearW, 18),
      lightJoineryOakMat
    );
    topBullnoseCyl.name = 'outbuildings.firstFloor.stableUpStep.topNosing';
    topBullnoseCyl.rotation.x = Math.PI / 2;
    topBullnoseCyl.position.set(
      upFlightEndU - nosingOverhangU + bullnoseR,
      stableUpperFloorY - treadT * 0.5 + 0.002,
      stairCenterV
    );
    topBullnoseCyl.castShadow = true;
    upStairsGroup.add(topBullnoseCyl);

    // 6. Laminated Solid-Oak Side Stringer Ribbons (`v = 2.414m` & `v = 3.286m`), Turned Cylindrical Oak Newel Posts,
    //    Raked Cylindrical Oak Handrails & Toughened Glass Banister Panels with Stainless-Steel Clamps!
    for (const sideV of [-1, 1] as const) {
      const sv = stairCenterV + sideV * (stairOpeningW * 0.5 - stringerT * 0.5);

      // Raked laminated solid-oak outer stringer ribbon (matching `spiralStaircase.outerStringer`)
      const rakedStringerGeo = new THREE.BoxGeometry(stringerDiagLen, 0.19, stringerT);
      applyOutbuildingFloorUVs(
        rakedStringerGeo,
        upStartU + (numUpSteps * stepGoingU) * 0.5 - 0.01,
        mezzanineFloorY + upRiseTotal * 0.5 + 0.01,
        sv,
        0.5
      );
      const rakedStringer = new THREE.Mesh(
        rakedStringerGeo,
        lightJoineryOakPostMat
      );
      rakedStringer.name = 'outbuildings.firstFloor.stableUpStairs.stringer';
      rakedStringer.position.set(
        upStartU + (numUpSteps * stepGoingU) * 0.5 - 0.01,
        mezzanineFloorY + upRiseTotal * 0.5 + 0.01,
        sv
      );
      rakedStringer.rotation.z = stringerPitchAngle;
      rakedStringer.castShadow = true;
      rakedStringer.receiveShadow = true;
      upStairsGroup.add(rakedStringer);

      // Rounded top & bottom edge beads along the solid-oak stringer ribbon
      for (const beadOffsetY of [-0.095, 0.095] as const) {
        const edgeBead = new THREE.Mesh(
          new THREE.CylinderGeometry(0.011, 0.011, stringerDiagLen + 0.02, 12),
          lightJoineryOakMat
        );
        edgeBead.position.set(
          upStartU + (numUpSteps * stepGoingU) * 0.5 - 0.01,
          mezzanineFloorY + upRiseTotal * 0.5 + 0.01 + beadOffsetY,
          sv
        );
        edgeBead.rotation.z = stringerPitchAngle - Math.PI / 2;
        upStairsGroup.add(edgeBead);
      }

      // Turned cylindrical solid-oak bottom & top newel posts with spherical finial caps (matching `spiralStaircase.newelPost`)
      const botNewelU = upStartU - 0.03;
      const topNewelU = upFlightEndU - 0.04;
      const botNewelH = 0.92;
      const topNewelH = 0.92;

      for (const [nu, nBaseY, nH] of [
        [botNewelU, mezzanineFloorY, botNewelH],
        [topNewelU, stableUpperFloorY - 0.06, topNewelH],
      ] as const) {
        const newelCyl = new THREE.Mesh(
          new THREE.CylinderGeometry(0.034, 0.038, nH, 20),
          lightJoineryOakPostMat
        );
        newelCyl.name = 'outbuildings.firstFloor.stableUpStairs.newelPost';
        newelCyl.position.set(nu, nBaseY + nH * 0.5, sv);
        newelCyl.castShadow = true;
        upStairsGroup.add(newelCyl);

        const newelCap = new THREE.Mesh(
          new THREE.SphereGeometry(0.042, 16, 12),
          lightJoineryOakMat
        );
        newelCap.position.set(nu, nBaseY + nH + 0.014, sv);
        upStairsGroup.add(newelCap);
      }

      // Raked cylindrical solid-oak handrail (`r = 0.026m`) bridging between the bottom and top newel posts
      const railSpanU = topNewelU - botNewelU;
      const railRiseY = stableUpperFloorY - 0.06 - mezzanineFloorY;
      const railLen = Math.hypot(railSpanU, railRiseY);
      const railAngle = Math.atan2(railRiseY, railSpanU);

      const handrailCyl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.026, 0.026, railLen, 16),
        lightJoineryOakMat
      );
      handrailCyl.name = 'outbuildings.firstFloor.stableUpStairs.handrail';
      handrailCyl.position.set(
        (botNewelU + topNewelU) * 0.5,
        mezzanineFloorY + railRiseY * 0.5 + 0.86,
        sv
      );
      handrailCyl.rotation.z = railAngle - Math.PI / 2;
      handrailCyl.castShadow = true;
      upStairsGroup.add(handrailCyl);

      // Raked Toughened Glass Banister Panel & Brushed Stainless-Steel Cylindrical Stand-Off Clamps
      const glassPanel = new THREE.Mesh(
        new THREE.BoxGeometry(railLen - 0.09, 0.64, 0.014),
        windowGlassMat
      );
      glassPanel.name = 'outbuildings.firstFloor.stableUpStairs.glassBanister';
      glassPanel.position.set(
        (botNewelU + topNewelU) * 0.5,
        mezzanineFloorY + railRiseY * 0.5 + 0.48,
        sv
      );
      glassPanel.rotation.z = railAngle;
      upStairsGroup.add(glassPanel);

      for (const clampFrac of [0.22, 0.78] as const) {
        const cu = botNewelU + clampFrac * railSpanU;
        const cyBase = mezzanineFloorY + clampFrac * railRiseY;
        for (const cyOff of [0.16, 0.76] as const) {
          const clamp = new THREE.Mesh(
            new THREE.CylinderGeometry(0.014, 0.014, 0.032, 12),
            stainlessClampMat
          );
          clamp.rotation.x = Math.PI / 2;
          clamp.position.set(cu, cyBase + cyOff, sv);
          upStairsGroup.add(clamp);
        }
      }
    }

    // 8. Issue #1 ("Make this a full height entrance" at `[0.883, 2.92, 16.92]`):
    //    Full-Height (`2.00m` clear height above `stableUpperFloorY = 2.08m`, reaching `stableEntrancePortalTopY = 4.08m`)
    //    Light-Oak Doorway Jamb Linings & Chamfered Architraves around the `u = 23.02..23.22m, v = 2.40..3.30m` Portal:
    //    - Lower jambs & side architrave legs (`y <= barnUpperTopY = 2.92m`) live in `upStairsGroup` (`firstFloorGroup`)
    //      with NO low header bar at `y = 2.92m`, so in 1st-floor cutaway mode the entrance is completely open at the top!
    //    - Upper jambs, `portalHead` (`y = 4.08m`), and top `archHeader` (`y = 4.08m`) live in `roofGroup` framing the
    //      full-height doorway cutout in `outbuildings.barnStablePartitionGable`!
    const lowerJambH = stableUpperTopY - stableUpperFloorY; // 1.24m (up to 3.32m cutaway eave line)
    const upperJambH = stableEntrancePortalTopY - stableUpperTopY; // 0.76m (from 3.32m eave line up to 4.08m full-height lintel)
    const jambT = 0.026;
    const archW = 0.058;
    const archT = 0.016;
    const doorUMid = uBarnEnd - partT * 0.5; // 23.12m

    const upperPortalGroup = new THREE.Group();
    upperPortalGroup.name = 'outbuildings.roof.stableEntranceUpperPortal';
    roofGroup.add(upperPortalGroup);

    for (const sideV of [-1, 1] as const) {
      const vz = stairCenterV + sideV * (stairOpeningW * 0.5 - jambT * 0.5);
      const lowerJamb = new THREE.Mesh(
        new THREE.BoxGeometry(partT + 0.008, lowerJambH, jambT),
        lightJoineryOakMat
      );
      lowerJamb.position.set(doorUMid, stableUpperFloorY + lowerJambH * 0.5, vz);
      lowerJamb.castShadow = true;
      upStairsGroup.add(lowerJamb);

      const upperJamb = new THREE.Mesh(
        new THREE.BoxGeometry(partT + 0.008, upperJambH, jambT),
        lightJoineryOakMat
      );
      upperJamb.position.set(doorUMid, stableUpperTopY + upperJambH * 0.5, vz);
      upperJamb.castShadow = true;
      upperPortalGroup.add(upperJamb);
    }

    const portalHead = new THREE.Mesh(
      new THREE.BoxGeometry(partT + 0.008, jambT, stairOpeningW),
      lightJoineryOakMat
    );
    portalHead.position.set(doorUMid, stableEntrancePortalTopY - jambT * 0.5, stairCenterV);
    upperPortalGroup.add(portalHead);

    for (const sideU of [-1, 1] as const) {
      const uFace = doorUMid + sideU * (partT * 0.5 + archT * 0.5);
      const legBottomY = sideU < 0 ? mezzanineFloorY + 0.14 : stableUpperFloorY;
      const lowerLegH = stableUpperTopY - legBottomY;
      const upperLegH = stableEntrancePortalTopY - stableUpperTopY + archW;
      for (const sideV of [-1, 1] as const) {
        const vz = stairCenterV + sideV * (stairOpeningW * 0.5 + archW * 0.5 - 0.01);
        const lowerArchLeg = new THREE.Mesh(
          new THREE.BoxGeometry(archT, lowerLegH, archW),
          lightJoineryOakPostMat
        );
        lowerArchLeg.position.set(uFace, legBottomY + lowerLegH * 0.5, vz);
        upStairsGroup.add(lowerArchLeg);

        const upperArchLeg = new THREE.Mesh(
          new THREE.BoxGeometry(archT, upperLegH, archW),
          lightJoineryOakPostMat
        );
        upperArchLeg.position.set(uFace, stableUpperTopY + upperLegH * 0.5, vz);
        upperPortalGroup.add(upperArchLeg);
      }
      const archHeader = new THREE.Mesh(
        new THREE.BoxGeometry(archT, archW, stairOpeningW + archW * 2 - 0.02),
        lightJoineryOakPostMat
      );
      archHeader.position.set(uFace, stableEntrancePortalTopY + archW * 0.5 - 0.008, stairCenterV);
      upperPortalGroup.add(archHeader);
    }
  }

  // STEP #1 Roof -> Level 2 Pitched Roof + Insulated Plasterboard Vaulted Ceiling over Store & Barn (`u = 12.07m..23.02m`)
  // + 3 North-Slope Velux Skylights (`storeNorth`, `barnWestNorth`, `barnEastNorth` — Issue #11!)
  const garageEaveRelToBarnDatum = northWestWallTopY - barnDatumY; // 2.26m
  addPitchedOutbuildingRoofSection(
    uStoreStart,
    uBarnEnd - partT,
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
    ],
    [
      { id: 'storeNorth', uCenter: 13.65, vCenter: 1.12, widthU: 0.84, lengthS: 1.18 },
      { id: 'barnWestNorth', uCenter: 16.95, vCenter: 1.12, widthU: 0.84, lengthS: 1.18 },
      { id: 'barnEastNorth', uCenter: 20.85, vCenter: 1.12, widthU: 0.84, lengthS: 1.18 },
    ]
  );

  // STEP #2 Roof -> Level 3 Pitched Roof + Insulated Plasterboard Vaulted Ceiling over the 2-Storey Stable (`u = 23.02m..29.05m`)
  // + 2 North-Slope Velux Skylights (`stableWestNorth`, `stableEastNorth` — Issue #13!)
  const barnEaveRelToStableDatum = barnUpperTopY - stableDatumY; // 3.14m
  addPitchedOutbuildingRoofSection(
    uBarnEnd - partT,
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
    [[uStableStart + wallT, uStableEnd - wallT]],
    [
      { id: 'stableWestNorth', uCenter: 24.85, vCenter: 1.12, widthU: 0.84, lengthS: 1.18 },
      { id: 'stableEastNorth', uCenter: 27.15, vCenter: 1.12, widthU: 0.84, lengthS: 1.18 },
    ]
  );
}

