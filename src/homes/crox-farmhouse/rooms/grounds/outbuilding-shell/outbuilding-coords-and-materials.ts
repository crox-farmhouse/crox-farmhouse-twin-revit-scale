import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../../types/scene.ts';
import {
  createWelshSlateRoofTextures,
  createWovenWoolCarpetTextures,
} from '../../../../../engine/textures/procedural-textures.ts';

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
export function createGymRubberTileMaterial(): THREE.MeshStandardMaterial {
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
export function createChamferedGymRubberTilesGeometry(
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
  geo.computeBoundingSphere();
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
export function createFrostedWindowGlassMaterial(): THREE.MeshStandardMaterial {
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


export interface OutbuildingWallWindowSpec {
  readonly uCenter: number;
  readonly yCenter: number;
  readonly width: number;
  readonly height: number;
  readonly isFrosted?: boolean;
}

export interface OutbuildingSkylightSpec {
  readonly id: string;
  readonly uCenter: number;
  readonly vCenter: number;
  readonly widthU: number;
  readonly lengthS: number;
}

export function createOutbuildingShellContext(
  ctx: SceneBuilderContext,
  kit: OutbuildingsBuilderKit
) {
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

  // Issue #11 ("Improve the slate texture" at `[5.545, 4.42, 15.441]`, `outbuildings.roof.exteriorSlope`):
  // Use unit-repeat clones of the 1024x1024 Welsh slate colorMap & high-relief stepped-shingle bumpMap
  // paired with continuous metric world-space UVs (`applyRoofSlopeUVs`) across all roof slopes & skylight cutouts!
  const baseSlateTextures = createWelshSlateRoofTextures();
  const outbuildingSlateColorMap = baseSlateTextures.colorMap.clone();
  outbuildingSlateColorMap.repeat.set(1, 1);
  outbuildingSlateColorMap.needsUpdate = true;

  const outbuildingSlateBumpMap = baseSlateTextures.bumpMap.clone();
  outbuildingSlateBumpMap.repeat.set(1, 1);
  outbuildingSlateBumpMap.needsUpdate = true;

  const pantileRoofMat = new THREE.MeshStandardMaterial({
    map: outbuildingSlateColorMap,
    bumpMap: outbuildingSlateBumpMap,
    bumpScale: 0.024,
    color: 0xd8cfc6, // Subtle warm weathered slate tint on the West & Center range
    roughness: 0.72,
    metalness: 0.04,
    side: THREE.DoubleSide,
  });

  const welshSlateMat = new THREE.MeshStandardMaterial({
    map: outbuildingSlateColorMap,
    bumpMap: outbuildingSlateBumpMap,
    bumpScale: 0.026,
    color: 0xffffff,
    roughness: 0.68,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  // Issue #3 ("Larger limestone tiles here with a bit more texture" at `[-4.737, -0.34, 18.005]`, `outbuildings.barn.westFloor`) &
  // Issue #2 ("This looks too much like a patio n ow" at `[-4.743, -0.34, 18.601]` + Reference Photo `media_1791215289945_a698ac57.jpg`):
  // Dedicated high-resolution (1024x1024) Smooth Flat-Honed Interior French/Cotswold Limestone Tile Texture:
  // - Very fine (`3px`), flush, pale-cream/ivory sanded grout lines (`#e7dfd0` — slightly lighter than the stone, zero dark recessed patio joints or dark border strokes!)
  // - Warm sandy-biscuit / honey-oatmeal honed limestone (`rgb(208, 192, 166)` to `rgb(218, 202, 176)`)
  // - Delicate white/cream calcitic fossil shell arcs, soft cloudy mineral mottling, and fine dark sedimentary fossil flecks
  // - Smooth satin-honed interior surface (`roughness: 0.36`, `bumpScale: 0.004`)
  const createLargeLimestoneFlagstoneTextures = (): {
    colorMap: THREE.CanvasTexture;
    bumpMap: THREE.CanvasTexture;
  } => {
    const size = 1024;
    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = size;
    colorCanvas.height = size;
    const cCtx = colorCanvas.getContext('2d');

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = size;
    bumpCanvas.height = size;
    const bCtx = bumpCanvas.getContext('2d');

    let seed = 80421;
    const rand = (): number => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    if (cCtx && bCtx) {
      // Flush pale-cream / warm-ivory sanded interior tile grout (`#e7dfd0` — lighter than the limestone tiles, matching `media_1791215289945_a698ac57.jpg`!)
      cCtx.fillStyle = '#e7dfd0';
      cCtx.fillRect(0, 0, size, size);
      bCtx.fillStyle = '#c8c8c8';
      bCtx.fillRect(0, 0, size, size);

      // 3 coursed horizontal honed limestone tile rows x 2 large rectangular tiles per repeat
      const rowHeights = [342, 338, 344];
      const stonePalette = [
        [214, 198, 172],
        [209, 193, 167],
        [218, 202, 176],
        [206, 190, 164],
        [212, 196, 170],
        [215, 199, 173],
      ] as const;

      let yCursor = 0;
      const jointW = 3; // Fine 3px flush interior sanded grout line

      for (let r = 0; r < rowHeights.length; r++) {
        const rH = rowHeights[r];
        const colWidths = r % 2 === 0 ? [532, 492] : [476, 548];
        const staggerOffset = r === 1 ? 210 : r === 2 ? -140 : 0;
        let xCursor = staggerOffset;

        for (let c = 0; c < 3; c++) {
          const cW = colWidths[c % colWidths.length];
          const sx = xCursor + jointW * 0.5;
          const sy = yCursor + jointW * 0.5;
          const sw = cW - jointW;
          const sh = rH - jointW;

          const baseRGB = stonePalette[(r * 3 + c) % stonePalette.length];
          const shadeDelta = Math.round((rand() - 0.5) * 6);
          const sr = Math.min(226, Math.max(198, baseRGB[0] + shadeDelta));
          const sg = Math.min(210, Math.max(182, baseRGB[1] + shadeDelta));
          const sb = Math.min(186, Math.max(156, baseRGB[2] + shadeDelta));

          for (const wrapX of [-size, 0, size] as const) {
            const tx = sx + wrapX;
            if (tx + sw < 0 || tx > size) continue;

            // 1. Flat-honed warm sandy-beige limestone tile body
            const grad = cCtx.createLinearGradient(tx, sy, tx + sw, sy + sh);
            grad.addColorStop(0, `rgb(${sr + 2}, ${sg + 2}, ${sb + 2})`);
            grad.addColorStop(0.5, `rgb(${sr}, ${sg}, ${sb})`);
            grad.addColorStop(1, `rgb(${sr - 3}, ${sg - 3}, ${sb - 2})`);
            cCtx.fillStyle = grad;
            cCtx.fillRect(tx, sy, sw, sh);

            // Flat, flush honed stone bump surface (no pillowed patio edges!)
            bCtx.fillStyle = '#d4d4d4';
            bCtx.fillRect(tx, sy, sw, sh);

            // 2. Soft cloudy calcitic & sandy mineral mottling inside the stone
            for (let p = 0; p < 34; p++) {
              const px = tx + 10 + rand() * Math.max(8, sw - 20);
              const py = sy + 10 + rand() * Math.max(8, sh - 20);
              const rx = 20 + rand() * 58;
              const ry = 12 + rand() * 34;
              const isCreamCloud = rand() > 0.42;
              cCtx.fillStyle = isCreamCloud
                ? `rgba(${Math.min(255, sr + 22)}, ${Math.min(255, sg + 20)}, ${Math.min(255, sb + 18)}, 0.16)`
                : `rgba(${sr - 14}, ${sg - 15}, ${sb - 16}, 0.12)`;
              cCtx.beginPath();
              cCtx.ellipse(px, py, rx, ry, rand() * Math.PI, 0, Math.PI * 2);
              cCtx.fill();

              bCtx.fillStyle = isCreamCloud ? 'rgba(222,222,222,0.12)' : 'rgba(198,198,198,0.12)';
              bCtx.beginPath();
              bCtx.ellipse(px, py, rx * 0.8, ry * 0.8, 0, 0, Math.PI * 2);
              bCtx.fill();
            }

            // 3. Delicate pale-ivory calcitic fossil shell arcs & fine crystalline wisps (signature detail in `media_1791215289945_a698ac57.jpg`)
            for (let v = 0; v < 9; v++) {
              const vx = tx + 18 + rand() * Math.max(10, sw - 36);
              const vy = sy + 18 + rand() * Math.max(10, sh - 36);
              cCtx.strokeStyle =
                v % 3 !== 0
                  ? 'rgba(246, 240, 228, 0.44)'
                  : `rgba(${sr - 18}, ${sg - 19}, ${sb - 20}, 0.22)`;
              cCtx.lineWidth = 0.9 + rand() * 1.3;
              cCtx.beginPath();
              if (v % 2 === 0) {
                // Curved fossil shell cross-section arc
                const shellR = 6 + rand() * 14;
                const startA = rand() * Math.PI;
                cCtx.arc(vx, vy, shellR, startA, startA + 0.9 + rand() * 1.2);
              } else {
                // Fine calcitic vein wisp
                let cx = vx;
                let cy = vy;
                cCtx.moveTo(cx, cy);
                for (let seg = 0; seg < 4; seg++) {
                  cx += (rand() - 0.35) * 28;
                  cy += (rand() - 0.5) * 16;
                  cCtx.lineTo(cx, cy);
                }
              }
              cCtx.stroke();
            }

            // 4. Tiny dark-amber & umber sedimentary fossil/mineral flecks scattered naturally across the honed tile
            for (let d = 0; d < 85; d++) {
              const dx = tx + 6 + rand() * Math.max(6, sw - 12);
              const dy = sy + 6 + rand() * Math.max(6, sh - 12);
              const dr = 0.7 + rand() * 1.6;
              cCtx.fillStyle =
                d % 4 === 0
                  ? 'rgba(248, 243, 232, 0.38)'
                  : 'rgba(118, 98, 74, 0.28)';
              cCtx.beginPath();
              cCtx.arc(dx, dy, dr, 0, Math.PI * 2);
              cCtx.fill();
            }
          }

          xCursor += cW;
        }
        yCursor += rH;
      }
    }

    const colorMap = new THREE.CanvasTexture(colorCanvas);
    colorMap.wrapS = THREE.RepeatWrapping;
    colorMap.wrapT = THREE.RepeatWrapping;
    colorMap.colorSpace = THREE.SRGBColorSpace;

    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.RepeatWrapping;

    return { colorMap, bumpMap };
  };

  const limestoneFloorTextures = createLargeLimestoneFlagstoneTextures();
  const barnLimestoneFloorMat = new THREE.MeshStandardMaterial({
    name: 'outbuildingBarnLimestoneFloor',
    map: limestoneFloorTextures.colorMap,
    bumpMap: limestoneFloorTextures.bumpMap,
    bumpScale: 0.004,
    color: 0xf5efe4,
    roughness: 0.36,
    metalness: 0.04,
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

  // Issue #1 ("These bannisters and ballistrages look too much lilke bamboo, it should be oak" at `[0.091, 2.473, 17.59]`):
  // `oakFloorMat.map` had 8 horizontal plank V-groove lines across `v ∈ [0..1]` which wrapped around `CylinderGeometry`
  // handrails & newel posts like bamboo segments!
  // Build a dedicated groove-free, continuous longitudinal Solid European Oak Joinery texture (`solidOakTex`)
  // where wood fibers, cathedral heartwood figure, and silver medullary rays run continuously along `V` (`0..1`)
  // with ZERO horizontal plank lines, while `mezzaninePlankFloorMat` retains `oakFloorMat.map` for the planked floor slabs!
  const createSolidOakJoineryTextures = (): {
    map: THREE.CanvasTexture;
    bumpMap: THREE.CanvasTexture;
  } => {
    const size = 512;
    const cCanvas = document.createElement('canvas');
    cCanvas.width = size;
    cCanvas.height = size;
    const cCtx = cCanvas.getContext('2d')!;

    const bCanvas = document.createElement('canvas');
    bCanvas.width = size;
    bCanvas.height = size;
    const bCtx = bCanvas.getContext('2d')!;

    const cImg = cCtx.createImageData(size, size);
    const bImg = bCtx.createImageData(size, size);
    const cData = cImg.data;
    const bData = bImg.data;

    for (let y = 0; y < size; y++) {
      const v = (y / size) * Math.PI * 2;
      for (let x = 0; x < size; x++) {
        const u = (x / size) * Math.PI * 2;
        const wave = Math.sin(v * 2.0 + Math.cos(u * 2.0) * 0.45) * 0.65;
        const cathedral =
          Math.sin(u * 4.0 + wave) * 0.52 +
          Math.cos(u * 9.0 - Math.sin(v * 3.0) * 0.5) * 0.28 +
          Math.sin(u * 22.0 + Math.cos(v * 4.0) * 0.35) * 0.14;
        const pore = Math.sin(u * 68.0 + Math.sin(v * 6.0) * 1.4);
        const poreDip = pore > 0.78 ? (pore - 0.78) * 4.5 : 0;
        const ray =
          Math.max(0, Math.sin(u * 5.0 + v * 1.0) * Math.cos(v * 18.0)) > 0.86
            ? 0.16
            : 0;

        const tone = cathedral * 13 - poreDip * 14 + ray * 16;
        const r = Math.max(155, Math.min(242, Math.round(212 + tone)));
        const g = Math.max(122, Math.min(212, Math.round(176 + tone * 0.86)));
        const b = Math.max(84, Math.min(168, Math.round(132 + tone * 0.68)));

        const idx = (y * size + x) * 4;
        cData[idx] = r;
        cData[idx + 1] = g;
        cData[idx + 2] = b;
        cData[idx + 3] = 255;

        const bumpVal = Math.max(
          0,
          Math.min(255, Math.round(128 + cathedral * 18 - poreDip * 38 + ray * 12))
        );
        bData[idx] = bumpVal;
        bData[idx + 1] = bumpVal;
        bData[idx + 2] = bumpVal;
        bData[idx + 3] = 255;
      }
    }

    cCtx.putImageData(cImg, 0, 0);
    bCtx.putImageData(bImg, 0, 0);

    const map = new THREE.CanvasTexture(cCanvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.colorSpace = THREE.SRGBColorSpace;
    map.needsUpdate = true;

    const bumpMap = new THREE.CanvasTexture(bCanvas);
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.RepeatWrapping;
    bumpMap.needsUpdate = true;

    return { map, bumpMap };
  };

  const solidOakJoineryTextures = createSolidOakJoineryTextures();
  const lightJoineryOakMat = new THREE.MeshStandardMaterial({
    name: 'outbuildingLightJoineryOak',
    map: solidOakJoineryTextures.map,
    bumpMap: solidOakJoineryTextures.bumpMap,
    bumpScale: 0.005,
    color: 0xe6d2b5,
    roughness: 0.44,
    metalness: 0.02,
  });
  const lightJoineryOakPostMat = lightJoineryOakMat;

  // Planked European Oak floor material used on flat horizontal Mezzanine & Stable floor slabs
  const mezzaninePlankFloorMat = new THREE.MeshStandardMaterial({
    name: 'outbuildingMezzaninePlankOak',
    map: (oakFloorMat as THREE.MeshStandardMaterial).map ?? null,
    bumpMap: (oakFloorMat as THREE.MeshStandardMaterial).bumpMap ?? null,
    bumpScale: 0.006,
    color: 0xe6d2b5,
    roughness: 0.48,
    metalness: 0.02,
  });

  // Issues #8 & #9 ("Farrow and ball setting plaster down here" at `[-0.614, 0.307, 19.572]` & `[0.257, -0.005, 19.497]`):
  // Authentic Farrow & Ball "Setting Plaster" (No. 231) warm dusty blush-terracotta plaster for the Barn ground-floor walls!
  const settingPlasterMat = new THREE.MeshStandardMaterial({
    name: 'farrowAndBallSettingPlaster',
    color: 0xc9ab97,
    bumpMap: (warmRoomPlasterMat as THREE.MeshStandardMaterial).bumpMap ?? null,
    bumpScale: 0.002,
    roughness: 0.68,
    metalness: 0.02,
  });

  // Issue #6 ("Paint this room more of a cromarty color" at `[2.844, 2.678, 14.106]`):
  // Authentic Farrow & Ball "Cromarty" (No. 285) muted greenish-grey sea-mist sage plaster for the 1st-floor Stable room!
  const cromartyWallMat = new THREE.MeshStandardMaterial({
    name: 'farrowAndBallCromarty',
    color: 0xc3c8bd,
    bumpMap: (warmRoomPlasterMat as THREE.MeshStandardMaterial).bumpMap ?? null,
    bumpScale: 0.002,
    roughness: 0.68,
    metalness: 0.02,
  });

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
  let brickWallSeq = 0;
  const addOutbuildingBrickWall = (
    parent: THREE.Object3D,
    uMin: number,
    uMax: number,
    yMin: number,
    yMax: number,
    vMin: number,
    vMax: number,
    plasterFaces: ReadonlyArray<'+x' | '-x' | '+z' | '-z'> = [],
    overrideExteriorMat: THREE.Material = exteriorBrickMat,
    overridePlasterMat: THREE.Material = warmRoomPlasterMat
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
      pSet.has('+x') ? overridePlasterMat : overrideExteriorMat,
      pSet.has('-x') ? overridePlasterMat : overrideExteriorMat,
      wallCapMat,
      overrideExteriorMat,
      pSet.has('+z') ? overridePlasterMat : overrideExteriorMat,
      pSet.has('-z') ? overridePlasterMat : overrideExteriorMat,
    ];
    const mesh = new THREE.Mesh(geo, mats);
    mesh.name = `${parent.name || "outbuildings"}.brickWall.${++brickWallSeq}`;
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
    const doorSlug = doorLabel.replace(/\s+/g, '');
    const doorGroup = new THREE.Group();
    doorGroup.name = `outbuildings.door.${doorSlug}`;
    doorGroup.position.set(uCenter, yBase, vWallCenter);

    // Timber outer frame jambs & head lintel set cleanly INSIDE the masonry opening
    // so they never overlap or z-fight with the adjacent brick wall piers (Issue #6!)
    const frameDepth = wallT + 0.008;
    const jambW = 0.052;
    const headH = 0.054;
    const sillH = 0.028;

    const headFrame = new THREE.Mesh(
      new THREE.BoxGeometry(width, headH, frameDepth),
      courtyardDoorRecessMat
    );
    headFrame.name = `outbuildings.door.${doorSlug}.headFrame`;
    headFrame.position.set(0, height - headH * 0.5, 0);
    doorGroup.add(headFrame);

    for (const side of [-1, 1]) {
      const jamb = new THREE.Mesh(
        new THREE.BoxGeometry(jambW, height - headH - sillH, frameDepth),
        courtyardDoorRecessMat
      );
      jamb.name = `outbuildings.door.${doorSlug}.jamb.${side < 0 ? "left" : "right"}`;
      jamb.position.set(
        side * (width * 0.5 - jambW * 0.5),
        sillH + (height - headH - sillH) * 0.5,
        0
      );
      doorGroup.add(jamb);
    }

    // Issue #6 ("Missing architrave" at `[-5.666, 1.611, 14.833]` -> `u = 16.842m, y = 1.611m, v = 0.276m`):
    // Full-perimeter chamfered door architraves on both the interior room face (`+z = +wallT * 0.5 + 0.009`)
    // and exterior courtyard face (`-z = -wallT * 0.5 - 0.009`), covering the frame-to-wall joint cleanly!
    const archW = 0.068;
    const archT = 0.018;
    const archSlug = doorLabel.replace(/\s+/g, '');
    for (const [faceZ, archMat] of [
      [-wallT * 0.5 - archT * 0.5, courtyardDoorRecessMat],
      [wallT * 0.5 + archT * 0.5, isDoubleLeaf ? courtyardDoorRecessMat : lightJoineryOakMat],
    ] as const) {
      for (const sideX of [-1, 1] as const) {
        const legArch = new THREE.Mesh(
          new THREE.BoxGeometry(archW, height + archW - sillH, archT),
          archMat
        );
        legArch.name = `outbuildings.doorArchitrave.${archSlug}`;
        legArch.position.set(
          sideX * (width * 0.5 + archW * 0.5 - 0.018),
          sillH + (height + archW - sillH) * 0.5,
          faceZ
        );
        legArch.castShadow = true;
        legArch.receiveShadow = true;
        doorGroup.add(legArch);
      }
      const headArch = new THREE.Mesh(
        new THREE.BoxGeometry(width + archW * 2 - 0.036, archW, archT),
        archMat
      );
      headArch.name = `outbuildings.doorArchitrave.${archSlug}`;
      headArch.position.set(0, height + archW * 0.5 - 0.014, faceZ);
      headArch.castShadow = true;
      headArch.receiveShadow = true;
      doorGroup.add(headArch);
    }

    // Reclaimed stone threshold sill fitted inside the doorway opening (Issue #7: zero gap under door!)
    const sill = new THREE.Mesh(
      new THREE.BoxGeometry(width, sillH, wallT + 0.05),
      stoneSillMat
    );
    sill.name = `outbuildings.door.${doorSlug}.sill`;
    sill.position.set(0, sillH * 0.5, -0.015);
    sill.receiveShadow = true;
    doorGroup.add(sill);

    // Issue #1 ("Maybe these should open ovehead rather than outwards / inwards"
    // at `[-11.881, -0.047, 15.164]`, `outbuildings.doorPivot.GarageEastDoubleDoor.2`):
    // When `hasUpperGlazing === true` (the two Garage Coach Doors), the doors pivot OVERHEAD around the top lintel
    // (`axis = 'x'`, `openAngle = -Math.PI * 0.48`, tilting upward and inward along interior overhead ceiling tracks!)
    // rather than swinging outwards/inwards around `'y'`.
    const clearW = width - jambW * 2;
    const clearH = height - headH - sillH;
    const opensOverhead = hasUpperGlazing;
    // Issue #2 ("These are not 2 separate doors they are one single one, improve the animation they need to open like a proper garage door so it does not hinge straight into the car"):
    // When `opensOverhead === true`, build ONE single unified `clearW`-wide retractable up-and-over garage door panel!
    const numLeaves = opensOverhead ? 1 : isDoubleLeaf ? 2 : 1;
    const leafW = opensOverhead ? clearW : (clearW - (isDoubleLeaf ? 0.012 : 0)) / numLeaves;

    if (opensOverhead) {
      // Interior overhead horizontal steel guide tracks & ceiling drop hangers inside the Garage (`+z` = `+v`)
      const trackLenZ = clearH * 0.94;
      for (const sideX of [-1, 1] as const) {
        const trackX = sideX * (clearW * 0.5 - 0.028);
        const guideTrack = new THREE.Mesh(
          new THREE.BoxGeometry(0.036, 0.042, trackLenZ),
          castIronMat
        );
        guideTrack.name = `outbuildings.garageDoor.overheadTrack.${doorLabel.replace(/\s+/g, '')}`;
        guideTrack.position.set(trackX, sillH + clearH - 0.024, trackLenZ * 0.5 + 0.06);
        doorGroup.add(guideTrack);

        const rearDropBrkt = new THREE.Mesh(
          new THREE.BoxGeometry(0.028, 0.28, 0.028),
          castIronMat
        );
        rearDropBrkt.name = `outbuildings.garageDoor.rearDropBracket.${doorSlug}.${sideX < 0 ? "left" : "right"}`;
        rearDropBrkt.userData.lodTier = 'high';
        rearDropBrkt.position.set(trackX, sillH + clearH + 0.12, trackLenZ + 0.04);
        doorGroup.add(rearDropBrkt);
      }
    }

    for (let l = 0; l < numLeaves; l++) {
      const hingeSide = !opensOverhead && isDoubleLeaf ? (l === 0 ? -1 : 1) : -1;
      const lx = !opensOverhead && isDoubleLeaf ? (l === 0 ? -leafW * 0.5 - 0.003 : leafW * 0.5 + 0.003) : 0;
      const hingePivotX = opensOverhead ? 0 : lx + hingeSide * (leafW * 0.5);
      const leafOffsetX = opensOverhead ? 0 : -hingeSide * (leafW * 0.5);
      const pivotY = opensOverhead ? sillH + clearH : sillH;
      const yShift = opensOverhead ? -clearH : 0;

      const leafPivot = new THREE.Group();
      leafPivot.name = `outbuildings.doorPivot.${doorLabel.replace(/\s+/g, '')}.${l + 1}`;
      leafPivot.position.set(hingePivotX, pivotY, -0.04);
      doorGroup.add(leafPivot);

      if (hasUpperGlazing) {
        // Issue #2: Single-piece `clearW`-wide (`2.536m`) Twin-Bay Coach-House Up-and-Over Garage Door Panel:
        // - Lower solid vertical tongue-and-groove timber apron (`y = 0.003m .. 1.12m`) spanning the full `clearW` width
        //   with a central vertical coach-house batten at `x = 0`
        // - Twin symmetric Left & Right upper 6-pane (`3x2`) multi-light glazed window bays (`y = 1.12m .. clearH - 0.118m`)
        //   separated by a central vertical mullion stile (`0.14m` wide) and framed by outer stiles (`0.115m`), top head rail (`0.115m`),
        //   and full-width mid lock rail!
        const lowerBoardH = clearH * 0.545; // ~1.12m
        const stileW = 0.115;
        const centerMullionW = 0.14;
        const topRailH = 0.115;
        const winBottomY = lowerBoardH;
        const winTopY = clearH - 0.003 - topRailH;
        const winH = winTopY - winBottomY;
        const bayWinW = (leafW - stileW * 2 - centerMullionW) * 0.5;
        const winCenterY = winBottomY + winH * 0.5;

        // 1. Unified single-piece lower solid boarded timber apron panel across the full `leafW` (`2.536m`)
        const lowerPanel = new THREE.Mesh(
          new THREE.BoxGeometry(leafW, lowerBoardH - 0.003, 0.052),
          mat
        );
        lowerPanel.name = `outbuildings.garageDoor.lowerPanel.${doorLabel.replace(/\s+/g, '')}`;
        lowerPanel.position.set(leafOffsetX, yShift + (lowerBoardH + 0.003) * 0.5, 0);
        lowerPanel.castShadow = true;
        lowerPanel.receiveShadow = true;
        leafPivot.add(lowerPanel);

        // Vertical tongue-and-groove shadow battens across the full single-piece apron
        const numPlanks = Math.max(8, Math.round(leafW / 0.14));
        for (let p = 1; p < numPlanks; p++) {
          const px = leafOffsetX - leafW * 0.5 + (p / numPlanks) * leafW;
          const groove = new THREE.Mesh(
            new THREE.BoxGeometry(0.012, lowerBoardH - 0.06, 0.058),
            courtyardDoorRecessMat
          );
          groove.name = `outbuildings.garageDoor.lowerGroove.${doorSlug}.${p}`;
          groove.userData.lodTier = 'high';
          groove.position.set(px, yShift + lowerBoardH * 0.5, 0);
          leafPivot.add(groove);
        }

        // Central vertical coach-house cover batten on the lower apron (`x = 0`)
        const centerLowerBatten = new THREE.Mesh(
          new THREE.BoxGeometry(0.044, lowerBoardH - 0.02, 0.06),
          mat
        );
        centerLowerBatten.name = `outbuildings.garageDoor.centerLowerBatten.${doorSlug}`;
        centerLowerBatten.position.set(leafOffsetX, yShift + lowerBoardH * 0.5, 0);
        centerLowerBatten.castShadow = true;
        leafPivot.add(centerLowerBatten);

        // Moulded full-width mid lock-rail & weather-drip sill bar at `y = lowerBoardH`
        const lockRail = new THREE.Mesh(
          new THREE.BoxGeometry(leafW + 0.004, 0.068, 0.064),
          courtyardDoorRecessMat
        );
        lockRail.name = `outbuildings.garageDoor.lockRail.${doorSlug}`;
        lockRail.position.set(leafOffsetX, yShift + lowerBoardH - 0.018, 0);
        lockRail.castShadow = true;
        leafPivot.add(lockRail);

        // 2. Left outer stile, center vertical mullion stile, and right outer stile
        const upperSectionH = clearH - 0.003 - lowerBoardH;
        const upperSectionMidY = yShift + lowerBoardH + upperSectionH * 0.5;
        for (const sSide of [-1, 1] as const) {
          const upperStile = new THREE.Mesh(
            new THREE.BoxGeometry(stileW, upperSectionH, 0.052),
            mat
          );
          upperStile.name = `outbuildings.garageDoor.upperStile.${doorSlug}.${sSide < 0 ? "left" : "right"}`;
          upperStile.position.set(
            leafOffsetX + sSide * (leafW * 0.5 - stileW * 0.5),
            upperSectionMidY,
            0
          );
          upperStile.castShadow = true;
          upperStile.receiveShadow = true;
          leafPivot.add(upperStile);
        }
        const centerUpperStile = new THREE.Mesh(
          new THREE.BoxGeometry(centerMullionW, upperSectionH, 0.052),
          mat
        );
        centerUpperStile.name = `outbuildings.garageDoor.centerUpperStile.${doorSlug}`;
        centerUpperStile.position.set(leafOffsetX, upperSectionMidY, 0);
        centerUpperStile.castShadow = true;
        centerUpperStile.receiveShadow = true;
        leafPivot.add(centerUpperStile);

        // 3. Full-width top solid timber head rail
        const topRail = new THREE.Mesh(
          new THREE.BoxGeometry(leafW - stileW * 2 + 0.008, topRailH, 0.052),
          mat
        );
        topRail.name = `outbuildings.garageDoor.topRail.${doorSlug}`;
        topRail.position.set(leafOffsetX, yShift + clearH - 0.003 - topRailH * 0.5, 0);
        topRail.castShadow = true;
        topRail.receiveShadow = true;
        leafPivot.add(topRail);

        // 4. Twin Left & Right 6-light (`3x2`) glazed coach-house window bays inside the single door panel
        for (const baySide of [-1, 1] as const) {
          const bayCenterX = leafOffsetX + baySide * (centerMullionW * 0.5 + bayWinW * 0.5);

          for (const gSide of [-1, 1] as const) {
            const vBead = new THREE.Mesh(
              new THREE.BoxGeometry(0.022, winH, 0.056),
              courtyardDoorRecessMat
            );
            vBead.name = `outbuildings.garageDoor.vBead.${doorSlug}.${baySide < 0 ? "left" : "right"}.${gSide < 0 ? "left" : "right"}`;
            vBead.userData.lodTier = 'high';
            vBead.position.set(bayCenterX + gSide * (bayWinW * 0.5 - 0.011), yShift + winCenterY, 0);
            leafPivot.add(vBead);

            const hBead = new THREE.Mesh(
              new THREE.BoxGeometry(bayWinW, 0.022, 0.056),
              courtyardDoorRecessMat
            );
            hBead.name = `outbuildings.garageDoor.hBead.${doorSlug}.${baySide < 0 ? "left" : "right"}.${gSide < 0 ? "bottom" : "top"}`;
            hBead.userData.lodTier = 'high';
            hBead.position.set(bayCenterX, yShift + winCenterY + gSide * (winH * 0.5 - 0.011), 0);
            leafPivot.add(hBead);
          }

          const glassPane = new THREE.Mesh(
            new THREE.BoxGeometry(bayWinW - 0.02, winH - 0.02, 0.014),
            windowGlassMat
          );
          glassPane.name = 'outbuildings.garageDoor.glass';
          glassPane.position.set(bayCenterX, yShift + winCenterY, 0);
          leafPivot.add(glassPane);

          for (const colOffset of [-bayWinW / 6, bayWinW / 6] as const) {
            const vMuntin = new THREE.Mesh(
              new THREE.BoxGeometry(0.022, winH - 0.02, 0.034),
              courtyardDoorRecessMat
            );
            vMuntin.name = `outbuildings.garageDoor.vMuntin.${doorSlug}.${baySide < 0 ? "left" : "right"}.${colOffset < 0 ? 1 : 2}`;
            vMuntin.position.set(bayCenterX + colOffset, yShift + winCenterY, 0);
            vMuntin.castShadow = true;
            leafPivot.add(vMuntin);
          }
          const hMuntin = new THREE.Mesh(
            new THREE.BoxGeometry(bayWinW - 0.02, 0.022, 0.034),
            courtyardDoorRecessMat
          );
          hMuntin.name = `outbuildings.garageDoor.hMuntin.${doorSlug}.${baySide < 0 ? "left" : "right"}`;
          hMuntin.position.set(bayCenterX, yShift + winCenterY, 0);
          hMuntin.castShadow = true;
          leafPivot.add(hMuntin);
        }
      } else {
        const leafPanel = new THREE.Mesh(
          new THREE.BoxGeometry(leafW, clearH - 0.006, 0.052),
          mat
        );
        leafPanel.name = `outbuildings.door.${doorSlug}.leafPanel.${l + 1}`;
        leafPanel.position.set(leafOffsetX, yShift + clearH * 0.5, 0);
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
          groove.name = `outbuildings.door.${doorSlug}.groove.${l + 1}.${p}`;
          groove.userData.lodTier = 'high';
          groove.position.set(px, yShift + clearH * 0.5, 0);
          leafPivot.add(groove);
        }
      }

      if (opensOverhead) {
        // Overhead garage door hardware: left & right top roller/pivot brackets & central T-handle lift latch
        for (const brkSide of [-1, 1] as const) {
          const topPivotStrap = new THREE.Mesh(
            new THREE.BoxGeometry(0.036, 0.18, 0.014),
            castIronMat
          );
          topPivotStrap.name = `outbuildings.garageDoor.topPivotStrap.${doorSlug}.${brkSide < 0 ? "left" : "right"}`;
          topPivotStrap.userData.lodTier = 'high';
          topPivotStrap.position.set(brkSide * (leafW * 0.5 - 0.08), yShift + clearH - 0.1, -0.03);
          leafPivot.add(topPivotStrap);
        }

        const liftHandle = new THREE.Mesh(
          new THREE.BoxGeometry(0.16, 0.036, 0.028),
          castIronMat
        );
        liftHandle.name = `outbuildings.garageDoor.liftHandle.${doorSlug}`;
        liftHandle.userData.lodTier = 'high';
        liftHandle.position.set(0, yShift + clearH * 0.42, -0.032);
        leafPivot.add(liftHandle);

        ctx.interactions.registerOverheadGarageDoor(
          doorGroup,
          leafPivot,
          new THREE.Vector3(0, 0, 0),
          clearH * 0.90,
          Math.PI * 0.495
        );
      } else {
        // Upper and lower black wrought-iron strap hinges on the courtyard (-v) face
        const strapSpan = Math.min(0.36, leafW * 0.45);
        const strapCenterX = -hingeSide * (strapSpan * 0.5 + 0.02);
        const upperStrapY = clearH * 0.78;
        for (const hy of [clearH * 0.18, upperStrapY]) {
          const strap = new THREE.Mesh(
            new THREE.BoxGeometry(strapSpan, 0.036, 0.014),
            castIronMat
          );
          strap.name = `outbuildings.door.${doorSlug}.strapHinge.${l + 1}.${hy < clearH * 0.5 ? "lower" : "upper"}`;
          strap.userData.lodTier = 'high';
          strap.position.set(strapCenterX, yShift + hy, -0.03);
          leafPivot.add(strap);
        }

        // Black wrought-iron ring latch on the leading stile of the door leaf
        if (!isDoubleLeaf || l === 1) {
          const latch = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.14, 0.025), castIronMat);
          latch.name = `outbuildings.door.${doorSlug}.latch.${l + 1}`;
          latch.userData.lodTier = 'high';
          latch.position.set(
            leafOffsetX - hingeSide * (leafW * 0.5 - 0.06),
            yShift + clearH * 0.48,
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
    headFrame.name = 'outbuildings.gym.northGlazedScreen.headFrame';
    headFrame.position.set(0, height - 0.026, 0);
    screenGroup.add(headFrame);

    for (const side of [-1, 1]) {
      const outerJamb = new THREE.Mesh(
        new THREE.BoxGeometry(0.046, height - 0.08, frameDepth),
        courtyardDoorRecessMat
      );
      outerJamb.name = `outbuildings.gym.northGlazedScreen.outerJamb.${side < 0 ? "west" : "east"}`;
      outerJamb.position.set(side * (width * 0.5 - 0.023), height * 0.5 - 0.006, 0);
      screenGroup.add(outerJamb);
    }

    const sill = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.028, wallT + 0.05),
      stoneSillMat
    );
    sill.name = 'outbuildings.gym.northGlazedScreen.sill';
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
        bayContainer.name = `outbuildings.gym.northGlazedScreen.sidelightBay.${b + 1}`;
        bayContainer.position.set(bx, 0, -0.02);
      }
      screenGroup.add(bayContainer);

      // Top and bottom door/sidelight frame rails
      const topRail = new THREE.Mesh(
        new THREE.BoxGeometry(bayW - 0.01, 0.055, 0.058),
        courtyardDoorMat
      );
      topRail.name = `outbuildings.gym.northGlazedScreen.topRail.${b + 1}`;
      topRail.position.set(localX, height - 0.028, 0);
      bayContainer.add(topRail);

      const botRail = new THREE.Mesh(
        new THREE.BoxGeometry(bayW - 0.01, 0.075, 0.058),
        courtyardDoorMat
      );
      botRail.name = `outbuildings.gym.northGlazedScreen.bottomRail.${b + 1}`;
      botRail.position.set(localX, 0.06, 0);
      bayContainer.add(botRail);

      // Left and right vertical stiles of each bay
      for (const s of [-1, 1]) {
        const stile = new THREE.Mesh(
          new THREE.BoxGeometry(0.042, height - 0.03, 0.058),
          courtyardDoorMat
        );
        stile.name = `outbuildings.gym.northGlazedScreen.stile.${b + 1}.${s < 0 ? "left" : "right"}`;
        stile.position.set(localX + s * (bayW * 0.5 - 0.024), height * 0.5 + 0.01, 0);
        bayContainer.add(stile);
      }

      // Slim horizontal glazing bars dividing each tall glass bay into 3 lights
      for (const ty of [height * 0.36, height * 0.68]) {
        const transom = new THREE.Mesh(
          new THREE.BoxGeometry(bayW - 0.07, 0.024, 0.042),
          courtyardDoorMat
        );
        transom.name = `outbuildings.gym.northGlazedScreen.transom.${b + 1}.${ty < height * 0.5 ? "lower" : "upper"}`;
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
        handle.name = `outbuildings.gym.northGlazedScreen.handle.${b + 1}`;
        handle.userData.lodTier = 'high';
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
  let outbuildingWinSeq = 0;
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
    const winId = `outbuildings.window.${++outbuildingWinSeq}`;
    const winGroup = new THREE.Group();
    winGroup.name = winId;
    winGroup.position.set(uCenter, yCenter, vCenter);
    if (alongV) {
      winGroup.rotation.y = Math.PI / 2;
    }

    // Weathered stone sill & upper brick/stone lintel header projecting proud of both wall faces
    const sill = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.1, 0.058, wallT + 0.08),
      stoneSillMat
    );
    sill.name = `${winId}.sill`;
    sill.position.set(0, -height * 0.5 - 0.024, 0);
    sill.castShadow = true;
    sill.receiveShadow = true;
    winGroup.add(sill);

    const lintel = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.08, 0.065, wallT + 0.04),
      stoneSillMat
    );
    lintel.name = `${winId}.lintel`;
    lintel.position.set(0, height * 0.5 + 0.028, 0);
    winGroup.add(lintel);

    // Outer white-painted timber reveal box frame lining the full wall thickness
    const frameDepth = wallT + 0.032;
    for (const side of [-1, 1]) {
      const stile = new THREE.Mesh(
        new THREE.BoxGeometry(0.054, height, frameDepth),
        windowFrameMat
      );
      stile.name = `${winId}.stile.${side < 0 ? "left" : "right"}`;
      stile.position.set(side * (width * 0.5 - 0.027), 0, 0);
      winGroup.add(stile);

      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.054, frameDepth),
        windowFrameMat
      );
      rail.name = `${winId}.rail.${side < 0 ? "bottom" : "top"}`;
      rail.position.set(0, side * (height * 0.5 - 0.027), 0);
      winGroup.add(rail);
    }

    // Center vertical mullion & horizontal transom (4-pane cottage casement) recessed inside the reveal
    const barDepth = 0.068;
    const midMullion = new THREE.Mesh(
      new THREE.BoxGeometry(0.036, height - 0.08, barDepth),
      windowFrameMat
    );
    midMullion.name = `${winId}.midMullion`;
    winGroup.add(midMullion);

    const midTransom = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.08, 0.032, barDepth),
      windowFrameMat
    );
    midTransom.name = `${winId}.midTransom`;
    winGroup.add(midTransom);

    // Architectural glazing sheet (clear or frosted per Issue #11) set cleanly inside the open window cutout (no bricks inside!)
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.09, height - 0.09, 0.018),
      isFrosted ? frostedWindowGlassMat : windowGlassMat
    );
    glass.name = isFrosted ? 'outbuildings.window.frostedGlass' : `${winId}.glass`;
    winGroup.add(glass);

    parent.add(winGroup);
  };

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
    windows: ReadonlyArray<OutbuildingWallWindowSpec>,
    overridePlasterMat: THREE.Material = warmRoomPlasterMat
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
          plasterFaces,
          exteriorBrickMat,
          overridePlasterMat
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
          plasterFaces,
          exteriorBrickMat,
          overridePlasterMat
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
          plasterFaces,
          exteriorBrickMat,
          overridePlasterMat
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
        plasterFaces,
        exteriorBrickMat,
        overridePlasterMat
      );
    }
  };

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
    geo.computeBoundingSphere();
    return geo;
  };

  // Helper to build a double-pitched gable roof + insulated plasterboard vaulted ceiling (Issue #4)
  // + Velux skylight cutouts (Issues #5 & #6) + brick gable triangles + eaves gutters
  let roofSectionSeq = 0;
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

    const roofSecId = `outbuildings.roof.section.${++roofSectionSeq}`;
    const sectionRoofGroup = new THREE.Group();
    sectionRoofGroup.name = roofSecId;
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
        const geo = new THREE.BoxGeometry(wU, thickness, lS);
        if (meshPrefix === 'outbuildings.roof.exteriorSlope') {
          const posAttr = geo.attributes.position;
          const normAttr = geo.attributes.normal;
          const uvAttr = geo.attributes.uv;
          const boxCenterU = (u0 + u1) * 0.5;
          const boxCenterS = (s0 + s1) * 0.5;
          if (posAttr && normAttr && uvAttr) {
            for (let i = 0; i < posAttr.count; i++) {
              const lx = posAttr.getX(i);
              const ly = posAttr.getY(i);
              const lz = posAttr.getZ(i);
              const nx = Math.abs(normAttr.getX(i));
              const worldU = boxCenterU + lx;
              const slopeS = boxCenterS + lz;
              // Distance down the slope from the ridge (0 at ridge -> slopeLenV at eaves on both North and South slopes!)
              const distFromRidge =
                sideV === 1 ? slopeS + slopeLenV * 0.5 : slopeLenV * 0.5 - slopeS;
              if (nx > 0.5) {
                uvAttr.setXY(i, distFromRidge / 2.08, ly / 0.32);
              } else {
                // 2.24m per 8-slate repeat (280mm slate width) x 2.08m per 16-course repeat (130mm exposed slate gauge)
                uvAttr.setXY(i, worldU / 2.24, -distFromRidge / 2.08);
              }
            }
            uvAttr.needsUpdate = true;
          }
        }
        const m = new THREE.Mesh(geo, mat);
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
      gutter.name = `${roofSecId}.gutter.${sideV < 0 ? "north" : "south"}`;
      gutter.rotation.z = Math.PI / 2;
      gutter.position.set(0, eaveRelH - 0.02, sideV * (halfSpanV + 0.03));
      sectionRoofGroup.add(gutter);
    }

    // 2. Issue #4 ("Put a vauled ceiling in here, insulated plasterboard" at `[-13.898, 2.571, 19.843]`):
    //    Interior Insulated Plasterboard Vaulted Ceiling (`warmRoomPlasterMat`) lining the underside of the
    //    North and South roof slopes across each interior room bay (`v = vMin + wallT .. vMax - wallT`),
    //    with matching cutout apertures for the Velux skylights!
    // Issue #7 ("Simplify this geometry" at `[-5.128, 2.993, 14.801]`) & Issue #10 ("Fix the geometry on this join"):
    // Position the vaulted plasterboard ceiling at true rafter depth (`plasterNormalOffset = -(halfSpanV - innerHalfSpanV) * sinPitch`)
    // so that at the inner wall face (`|v - vMid| = innerHalfSpanV = 2.575m`), the sloped ceiling plane meets the top of the
    // brick walls directly at `eaveRelH` (`1.94m` / `2.92m` / `3.32m`) with zero extra eave frieze boxes!
    const innerHalfSpanV = (vMax - vMin) * 0.5 - wallT; // 2.575m
    const eaveInwardDeltaV = halfSpanV - innerHalfSpanV; // 0.48m (0.20m overhang + 0.28m wallT)
    const plasterNormalOffset = -eaveInwardDeltaV * sinPitch; // ~ -0.22m true insulated rafter depth
    const innerMaxDistAlongSlope = (innerHalfSpanV + 0.04) / cosPitch;
    const ceilApexRelH = eaveRelH + innerHalfSpanV * (slopeRise / halfSpanV);

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
        ceilApexRelH - 0.015,
        0
      );
      sectionRoofGroup.add(apexFillet);
    }

    // 3. Issues #5 & #6 ("Velux here" at `[-15.746, 2.508, 16.446]` and `[-11.903, 2.573, 16.247]`):
    //    Build 3D Velux Roof Windows inside the North slope skylight cutouts
    if (northSkylights.length > 0) {
      const northSlopeGroup = new THREE.Group();
      northSlopeGroup.name = `${roofSecId}.northVeluxSlope`;
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
        const revealDepthY = 0.255; // Spans from underside of true-rafter-depth vaulted plasterboard (`-0.22m`) to top of exterior flashing (`+0.035m`)
        const revealCenterY = -0.092;
        const jambT = 0.032;

        // White plastered lightwell reveal lining the roof/insulation cutout
        for (const sideX of [-1, 1] as const) {
          const sideReveal = new THREE.Mesh(
            new THREE.BoxGeometry(jambT, revealDepthY, lS),
            warmRoomPlasterMat
          );
          sideReveal.name = `outbuildings.roof.velux.${sk.id}.sideReveal.${sideX < 0 ? "west" : "east"}`;
          sideReveal.position.set(sideX * (wU * 0.5 - jambT * 0.5), revealCenterY, 0);
          veluxGroup.add(sideReveal);
        }
        for (const sideZ of [-1, 1] as const) {
          const endReveal = new THREE.Mesh(
            new THREE.BoxGeometry(wU - jambT * 2, revealDepthY, jambT),
            warmRoomPlasterMat
          );
          endReveal.name = `outbuildings.roof.velux.${sk.id}.endReveal.${sideZ < 0 ? "lower" : "upper"}`;
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
          sideFlash.name = `outbuildings.roof.velux.${sk.id}.sideFlashing.${sideX < 0 ? "west" : "east"}`;
          sideFlash.position.set(sideX * (wU * 0.5 + flashW * 0.5 - 0.015), 0.032, 0);
          veluxGroup.add(sideFlash);
        }
        for (const sideZ of [-1, 1] as const) {
          const endFlash = new THREE.Mesh(
            new THREE.BoxGeometry(wU + 0.04, 0.028, flashW),
            veluxFlashingMat
          );
          endFlash.name = `outbuildings.roof.velux.${sk.id}.endFlashing.${sideZ < 0 ? "lower" : "upper"}`;
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
          sashStile.name = `outbuildings.roof.velux.${sk.id}.sashStile.${sideX < 0 ? "west" : "east"}`;
          sashStile.position.set(sideX * (innerClearW * 0.5 - sashT * 0.5), 0.008, 0);
          veluxGroup.add(sashStile);
        }
        for (const sideZ of [-1, 1] as const) {
          const sashRail = new THREE.Mesh(
            new THREE.BoxGeometry(innerClearW - sashT * 2, 0.045, sashT),
            windowFrameMat
          );
          sashRail.name = `outbuildings.roof.velux.${sk.id}.sashRail.${sideZ < 0 ? "lower" : "upper"}`;
          sashRail.position.set(0, 0.008, sideZ * (innerClearL * 0.5 - sashT * 0.5));
          veluxGroup.add(sashRail);
        }

        // Velux top ventilation flap handle bar (at the ridge `+s` end of the North slope window)
        const handleBar = new THREE.Mesh(
          new THREE.BoxGeometry(innerClearW * 0.55, 0.018, 0.024),
          veluxFlashingMat
        );
        handleBar.name = `outbuildings.roof.velux.${sk.id}.handleBar`;
        handleBar.userData.lodTier = 'high';
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
    ridgeCap.name = `${roofSecId}.ridgeCap`;
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
      const isStepUpGable = lowerRoofEaveRelH < eaveRelH - 0.01;

      let pointsVY: ReadonlyArray<readonly [number, number]>;
      if (!isStepUpGable) {
        // Standard full gable triangle above `eaveRelH` (used at West Gable `u = 0` and East Gable `u = 28.77m`)
        pointsVY = [
          [-halfWallV, eaveRelH],
          [halfWallV, eaveRelH],
          [0, peakRelH],
        ];
      } else {
        // Issue #9 ("I can see brick ehre, fix all of the geometry / meshes clean it up"
        // at `[0.975, 4.59, 17.033]`, `ceilingMeshGroup > outbuildings.roof`):
        // At Step #1 (`u = 12.07m`) and Step #2 (`u = 23.02m`), keep the exterior brick step-up chevron
        // strictly between the lower roof exterior tile plane (`lowerRoofEaveRelH + 0.03..lowerPeakRelH + 0.03`)
        // and the upper roof slope (`eaveRelH..peakRelH`), and restrict its extrusion depth to `0.095m`
        // (`u = 23.02..23.115m`) so it stays 100% West of the interior painted plaster gable (`u = 23.12..23.225m`)
        // and never pokes through into the Stable, Barn, or Store interiors!
        const lowerBaseRelH = lowerRoofEaveRelH + 0.03;
        const lowerPeakRelH = lowerBaseRelH + lowerSlopeRise - 0.02;
        pointsVY = [
          [-halfWallV, lowerBaseRelH],
          [0, lowerPeakRelH],
          [halfWallV, lowerBaseRelH],
          [halfWallV, eaveRelH],
          [0, peakRelH],
          [-halfWallV, eaveRelH],
        ];
      }

      const brickExtrudeT = isStepUpGable ? 0.095 : wallT - 0.03;
      const geo = createExtrudedVYPolygon(pointsVY, brickExtrudeT);
      applyWorldSpaceBrickUVs(
        geo,
        OUTBUILDING_ORIGIN_X + uWallMin,
        datumY,
        OUTBUILDING_ORIGIN_Z + vMid
      );
      const mesh = new THREE.Mesh(geo, exteriorBrickMat);
      mesh.name = isStepUpGable ? 'outbuildings.roof.stepUpExteriorBrickGable' : 'outbuildings.roof.exteriorBrickGable';
      mesh.position.set(uWallMin, datumY, vMid);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (isStepUpGable && uWallMin < 15) {
        groundGroup.add(mesh);
      } else {
        roofGroup.add(mesh);
      }
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
  // Issue #7 ("Simplify this geometry" at `[-5.128, 2.993, 14.801]`):
  // Since `vaultedPlasterCeiling` sits at true rafter depth and meets the inner wall face directly at `eaveWorldY`,
  // no separate eave frieze strip boxes are needed!
  const addVaultedRoomEaveFriezeStrips = (
    _parent: THREE.Object3D,
    _uMin: number,
    _uMax: number,
    _vInnerNorth: number,
    _vInnerSouth: number,
    _eaveWorldY: number,
    _ceilEaveWorldY: number
  ): void => {
    // Intentionally empty: `vaultedPlasterCeiling` meets the wall top directly at `eaveWorldY`.
  };


  // Shared coordinate and elevation constants across outbuilding shell modules
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
  const westRangeCeilEaveY = northWestWallTopY; // 1.94m (meets wall top directly — Issue #7!)
  const westRangeCeilRidgeY =
    westRangeCeilEaveY + 2.575 * ((westRangeRidgeH - westRangeWallH) / 3.055); // 3.204m vaulted ceiling apex

  const garageFloorTopY = -0.5;
  const garageFloorThickness = 0.12;
  const uStoreStart = uGarageEnd; // 12.07m (Step #1!)
  const uBarnStart = uStoreEnd; // 14.96m
  const uMezzanineFront = 18.68; // Front edge of the 4.34m Barn Mezzanine (`u = 18.68..23.02m`)
  const uBarnEnd = 23.22; // 14.96m + 0.24m wall + 8.02m Barn (Step #2!)
  const uStableStart = uBarnEnd; // 23.22m
  // Batch 1 Issue #3 ("Maybe lose the upstairs extension, a lot of extra money for not much gain, or make it a smaller extension"
  // at `[7.515, 3.237, 13.958]`):
  // Removed the +1.00m upstairs extension so the 1st-floor East gable wall sits directly on the historic structural wall line
  // (`uStableEnd = 29.05m`, giving a `5.55m` internal 1st-floor span `u = 23.22..28.77m` with zero transfer steelwork or roof extension)
  // while restoring the full `2.80m`-deep Walk-Out East Balcony (`u = 29.05..31.85m`) over the ground-floor extension!
  const uStableEnd = 29.05; // 23.22m + 5.55m Stable + 0.28m Upper East Gable wall
  const uStableBalconySpanU = 2.8;
  const uStableExtEnd = uStableEnd + uStableBalconySpanU; // 31.85m
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
  const barnCeilEaveY = barnUpperTopY; // 2.92m (meets wall top directly — Issue #7!)
  const barnCeilRidgeY =
    barnCeilEaveY + 2.575 * ((barnRidgeH - barnUpperEaveH) / 3.055); // 4.269m vaulted ceiling apex in Store & Barn

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
  const stableCeilEaveY = stableUpperTopY; // 3.32m (meets wall top directly — Issue #7!)
  const stableCeilRidgeY =
    stableCeilEaveY + 2.575 * ((stableRidgeH - stableUpperEaveH) / 3.055); // 4.669m vaulted ceiling apex in Stable

  // Issue #1 ("There is a gap here" at `[-9.565, -0.69, 16.38]`) & Issue #2 & #3:
  const barnCarpetTopY = -0.675; // 1.5cm above the -0.69m terrain slab so terrain never bleeds through!
  const stableGroundSpanU = uStableExtEnd - wallT - uStableStart; // 8.35m (23.22m..31.57m)
  const pilasterW = 0.3;
  const pilasterD = 0.16;
  const vInnerNorth = wallT; // 0.28m
  const vInnerSouth = vWestRangeSouth - wallT; // 5.43m
  const vSpanInternal = vInnerSouth - vInnerNorth; // 5.15m

  function vMidCenter(): number {
    return (vInnerNorth + vInnerSouth) * 0.5;
  }

  const createContinuousMezzaninePolygon = (uStart: number): THREE.Shape => {
    const s = new THREE.Shape();
    // Note: after `geo.rotateX(-Math.PI / 2)`, shape `(x, y)` maps to `(u = x, z = -y)`
    s.moveTo(uStart, -0.284);
    s.lineTo(23.016, -0.284);
    s.lineTo(23.016, -3.56);
    s.lineTo(22.04, -3.56);
    s.lineTo(22.04, -4.44);
    s.lineTo(21.995, -4.54);
    s.lineTo(21.37, -4.94);
    s.lineTo(21.14, -4.85);
    s.lineTo(21.14, -5.426);
    s.lineTo(uStart, -5.426);
    s.closePath();
    return s;
  };


  return {
    ctx,
    kit,
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
    groundGroup,
    firstFloorGroup,
    roofGroup,
    groundCeilingGroup,
    pantileRoofMat,
    welshSlateMat,
    barnLimestoneFloorMat,
    gymSubFloorMat,
    gymRubberTileMat,
    stableUpperCarpetMat,
    lightJoineryOakMat,
    lightJoineryOakPostMat,
    mezzaninePlankFloorMat,
    settingPlasterMat,
    cromartyWallMat,
    frostedWindowGlassMat,
    veluxFlashingMat,
    spotlightHousingMat,
    spotlightBrassTrimMat,
    applyOutbuildingFloorUVs,
    getBaseYAtU,
    wallT,
    partT,
    addOutbuildingBrickWall,
    addBoardedBarnDoor,
    addGlazedGymCoachScreen,
    addOutbuildingWindow,
    addOutbuildingBrickWallWithWindows,
    createExtrudedVYPolygon,
    addPitchedOutbuildingRoofSection,
    addInteriorPlasterGableWall,
    addVaultedRoomEaveFriezeStrips,
    uGymStart,
    uGymEnd,
    uGarageEnd,
    uStoreEnd,
    vWestRangeNorth,
    vWestRangeSouth,
    westRangeWallH,
    westRangeRidgeH,
    baseY0,
    westRangeDatumY,
    northWestWallTopY,
    westRangeCeilEaveY,
    westRangeCeilRidgeY,
    garageFloorTopY,
    garageFloorThickness,
    uStoreStart,
    uBarnStart,
    uMezzanineFront,
    uBarnEnd,
    uStableStart,
    uStableEnd,
    uStableBalconySpanU,
    uStableExtEnd,
    vEastRangeNorth,
    vEastRangeSouth,
    eastRangeInternalV,
    eastRangeGroundWallH,
    barnUpperEaveH,
    barnRidgeH,
    stableUpperEaveH,
    stableRidgeH,
    baseYBarnStart,
    barnDatumY,
    stableDatumY,
    eastRangeGroundTopY,
    barnUpperTopY,
    barnCeilEaveY,
    barnCeilRidgeY,
    mezzanineFloorY,
    mezzanineUndersideY,
    barnWestFloorY,
    barnLowerFloorY,
    stableGroundFloorY,
    stableGroundTopY,
    stableUpperFloorY,
    stableUpperTopY,
    stableCeilEaveY,
    stableCeilRidgeY,
    barnCarpetTopY,
    stableGroundSpanU,
    pilasterW,
    pilasterD,
    vInnerNorth,
    vInnerSouth,
    vSpanInternal,
    vMidCenter,
    createContinuousMezzaninePolygon,
  };
}

export type OutbuildingShellContext = ReturnType<typeof createOutbuildingShellContext>;
