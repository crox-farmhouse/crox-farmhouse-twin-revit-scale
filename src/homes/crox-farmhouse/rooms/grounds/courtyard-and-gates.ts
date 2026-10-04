import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import {
  getEastWingSouthWallZ,
  MAIN_EAST_WING_ROTATION_Y,
  transformEastWingPoint,
  type createGroundFloorMaterials,
} from '../../structure/ground-floor-materials.ts';
import type { createGroundFloorShellKit } from '../../structure/ground-floor-shell-kit.ts';
import {
  buildOutbuildingsAndBarns,
  getOutbuildingNorthWallWorldZ,
} from './outbuildings-and-barns.ts';

/**
 * Graded cobbled courtyard, planting, ivy, boundary walls, split car gates, and the southern
 * 5-bay Outbuilding / Barn Range (`GYM`, `Garage`, `Store`, `Barn + First Floor`, `Stable`).
 */
export function buildCourtyardAndGates(
  ctx: SceneBuilderContext,
  kit: Pick<
    ReturnType<typeof createGroundFloorMaterials>,
    | 'castIronMat'
    | 'courtyardDoorMat'
    | 'courtyardDoorRecessMat'
    | 'engineeredOakFloorMat'
    | 'exteriorBrickMat'
    | 'stoneSillMat'
    | 'wallCapMat'
    | 'warmRoomPlasterMat'
    | 'windowFrameMat'
    | 'windowGlassMat'
  > &
    Pick<
      ReturnType<typeof createGroundFloorShellKit>,
      'applyWorldSpaceBrickUVs' | 'getCourtyardGroundY' | 'getEastCourtyardWallCenterX'
    >
): void {
  const { interactions, scene } = ctx;
  const {
    applyWorldSpaceBrickUVs,
    castIronMat,
    courtyardDoorMat,
    courtyardDoorRecessMat,
    engineeredOakFloorMat,
    exteriorBrickMat,
    getCourtyardGroundY,
    getEastCourtyardWallCenterX,
    stoneSillMat,
    wallCapMat,
    warmRoomPlasterMat,
    windowFrameMat,
    windowGlassMat,
  } = kit;
  // =========================================================================
  // 8. GRADED COBBLED COURTYARD (0.00m AT KITCHEN -> -0.60m AT PLANT ROOM & GATE),
  //    GARDEN BENCH, PLANTERS, CLIMBING IVY & SPLIT DRIVEWAY / PEDESTRIAN GATE
  // =========================================================================
  const terracottaPotMat = new THREE.MeshStandardMaterial({
    color: 0xb65e3e,
    roughness: 0.68,
    metalness: 0.04,
  });

  /**
   * Issue #10: Generates a seamlessly tileable (THREE.RepeatWrapping) 1024x1024 arched
   * granite sett fan ("Bogenpflaster") color + bump texture pair for the Courtyard that
   * matches `createGraniteSettLPathTextures` in front of the kitchen and repeats in parallel
   * 1.46m fan bands across the courtyard (stopping cleanly where each 1.46m path band meets).
   */
  const createContinuousCourtyardCobbleTextures = (): {
    readonly colorMap: THREE.CanvasTexture;
    readonly depthMap: THREE.CanvasTexture;
  } => {
    const size = 1024;
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

    // Match exact stone dimensions and palette from `createGraniteSettLPathTextures` in `src/scene/textures.ts`
    const pathW = 1.46;
    const courseStep = 0.1437559;
    const coursesPerTile = 8;
    const tileSpanX = coursesPerTile * courseStep; // 1.1500472m (8 arched fan courses per repeating tile)
    const numRows = 8;
    const cobbleStepU = pathW / numRows; // 0.1825m
    const mortarHalfW = 0.0085;
    const arcPivotR = 2.16;

    const granitePalette: ReadonlyArray<readonly [number, number, number]> = [
      [198, 190, 178], // Light warm silver-buff granite
      [172, 165, 154], // Weathered medium warm grey granite
      [212, 196, 174], // Warm honey-sandstone / oatmeal granite
      [148, 142, 135], // Charcoal-taupe granite sett
      [186, 174, 158], // Pale greige-buff sett
      [160, 150, 138], // Muted olive-taupe granite
      [204, 184, 162], // Warm pinkish-sand granite
      [136, 130, 124], // Deep slate-grey granite
      [190, 182, 170], // Classic silver-oatmeal granite
      [178, 162, 144], // Warm russet-buff stone
    ];

    const hash2 = (a: number, b: number): number => {
      const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453123;
      return x - Math.floor(x);
    };

    // Precompute the 8x8 repeating cell attributes so the 1,048,576-pixel loop
    // never recomputes trigonometric hash2() or palette lookups per pixel.
    const cellJitterALut = new Float64Array(coursesPerTile * numRows);
    const cellJitterBLut = new Float64Array(coursesPerTile * numRows);
    const halfLenSLut = new Float64Array(coursesPerTile * numRows);
    const halfWidULut = new Float64Array(coursesPerTile * numRows);
    const palIdxLut = new Uint8Array(coursesPerTile * numRows);

    for (let c = 0; c < coursesPerTile; c++) {
      for (let r = 0; r < numRows; r++) {
        const cellIdx = c * numRows + r;
        const jA = hash2(c * 19 + 3, r * 37 + 11);
        const jB = hash2(c * 43 + 7, r * 23 + 5);
        cellJitterALut[cellIdx] = jA;
        cellJitterBLut[cellIdx] = jB;
        halfLenSLut[cellIdx] = Math.max(
          0.01,
          courseStep * 0.5 - mortarHalfW * (0.9 + 0.25 * jA)
        );
        halfWidULut[cellIdx] = Math.max(
          0.01,
          cobbleStepU * 0.5 - mortarHalfW * (0.9 + 0.25 * jB)
        );
        palIdxLut[cellIdx] =
          Math.floor(jA * granitePalette.length) % granitePalette.length;
      }
    }

    for (let py = 0; py < size; py++) {
      // py = 0 corresponds to uv.y = 1 (north edge of a 1.46m band), py = size - 1 to uv.y = 0 (south edge)
      const u = (py / size) * pathW;
      const du = u - pathW * 0.5;
      const arcBow =
        arcPivotR - Math.sqrt(Math.max(0.01, arcPivotR * arcPivotR - du * du));
      const arcTangentAngle = Math.asin(
        Math.max(-0.95, Math.min(0.95, du / arcPivotR))
      );
      const cosA = Math.cos(arcTangentAngle);
      const sinA = Math.sin(arcTangentAngle);

      // Edge border joint where adjacent 1.46m parallel fan bands meet
      const bandSeamDist = Math.min(u, pathW - u);
      const isBandSeam = bandSeamDist < mortarHalfW * 0.85;

      for (let px = 0; px < size; px++) {
        const s = (px / size) * tileSpanX;
        const idx = (py * size + px) * 4;

        const sCurved = s - arcBow;
        const coursePos = sCurved / courseStep;
        const courseIndex = Math.round(coursePos);
        const wrappedCourseIdx =
          ((courseIndex % coursesPerTile) + coursesPerTile) % coursesPerTile;
        const distFromCourseCenter = (coursePos - courseIndex) * courseStep;

        const rowStagger = (wrappedCourseIdx & 1) === 1 ? 0.5 * cobbleStepU : 0;
        const uStaggered = u + rowStagger;
        const rowPos = uStaggered / cobbleStepU;
        const cobbleRow = Math.floor(rowPos);
        const wrappedRowIdx = ((cobbleRow % numRows) + numRows) % numRows;
        const distFromRowCenter = (rowPos - (cobbleRow + 0.5)) * cobbleStepU;

        const cellIdx = wrappedCourseIdx * numRows + wrappedRowIdx;
        const cellJitterA = cellJitterALut[cellIdx]!;
        const cellJitterB = cellJitterBLut[cellIdx]!;

        const normS = Math.abs(distFromCourseCenter) / halfLenSLut[cellIdx]!;
        const normU = Math.abs(distFromRowCenter) / halfWidULut[cellIdx]!;
        const superEllipse =
          isBandSeam || normS > 1.0 || normU > 1.0
            ? 1.1
            : Math.pow(Math.pow(normS, 4.5) + Math.pow(normU, 4.5), 1 / 4.5);

        const grain1 =
          Math.sin(s * 195 + u * 210) *
          Math.cos(s * 140 - u * 165) *
          Math.sin((s + u) * 310);
        const grain2 = Math.sin(s * 520 + u * 480) * 0.5;

        if (superEllipse > 1.0 || isBandSeam) {
          // Sandy-buff lime mortar bed (#cbb894) matching `createGraniteSettLPathTextures`
          const sandGrain = grain1 * 9 + grain2 * 5;
          cData[idx] = Math.max(0, Math.min(255, Math.round(203 + sandGrain)));
          cData[idx + 1] = Math.max(0, Math.min(255, Math.round(184 + sandGrain * 0.92)));
          cData[idx + 2] = Math.max(0, Math.min(255, Math.round(148 + sandGrain * 0.82)));
          cData[idx + 3] = 255;

          const jointDepth = Math.max(18, Math.round(42 + grain1 * 10));
          bData[idx] = jointDepth;
          bData[idx + 1] = jointDepth;
          bData[idx + 2] = jointDepth;
          bData[idx + 3] = 255;
        } else {
          const baseRGB = granitePalette[palIdxLut[cellIdx]!]!;
          const shadeShift = (cellJitterB - 0.5) * 24;

          const localX =
            distFromCourseCenter * cosA - distFromRowCenter * sinA;
          const localY =
            distFromCourseCenter * sinA + distFromRowCenter * cosA;
          const domeProfile = Math.max(
            0,
            1.0 - 0.55 * Math.pow(superEllipse, 2.2)
          );
          const edgeBevel =
            superEllipse > 0.82 ? (1.0 - superEllipse) / 0.18 : 1.0;

          const crystalSpeckle =
            Math.sin(localX * 420 + cellJitterA * 50) *
              Math.cos(localY * 420 + cellJitterB * 50) *
              11 +
            grain2 * 7;

          const domeLight = (domeProfile - 0.35) * 18 * edgeBevel;
          const r = Math.max(
            0,
            Math.min(
              255,
              Math.round(baseRGB[0] + shadeShift + domeLight + crystalSpeckle)
            )
          );
          const g = Math.max(
            0,
            Math.min(
              255,
              Math.round(
                baseRGB[1] + shadeShift * 0.96 + domeLight + crystalSpeckle * 0.95
              )
            )
          );
          const b = Math.max(
            0,
            Math.min(
              255,
              Math.round(
                baseRGB[2] + shadeShift * 0.9 + domeLight + crystalSpeckle * 0.88
              )
            )
          );

          cData[idx] = r;
          cData[idx + 1] = g;
          cData[idx + 2] = b;
          cData[idx + 3] = 255;

          const hVal = Math.max(
            65,
            Math.min(
              255,
              Math.round(
                125 + domeProfile * 110 * edgeBevel + crystalSpeckle * 1.4
              )
            )
          );
          bData[idx] = hVal;
          bData[idx + 1] = hVal;
          bData[idx + 2] = hVal;
          bData[idx + 3] = 255;
        }
      }
    }

    cCtx.putImageData(cImg, 0, 0);
    bCtx.putImageData(bImg, 0, 0);

    const colorMap = new THREE.CanvasTexture(colorCanvas);
    colorMap.colorSpace = THREE.SRGBColorSpace;
    colorMap.wrapS = THREE.RepeatWrapping;
    colorMap.wrapT = THREE.RepeatWrapping;
    colorMap.anisotropy = 8;

    const depthMap = new THREE.CanvasTexture(bumpCanvas);
    depthMap.wrapS = THREE.RepeatWrapping;
    depthMap.wrapT = THREE.RepeatWrapping;
    depthMap.anisotropy = 8;

    return { colorMap, depthMap };
  };

  const { colorMap: cobbleColorTex, depthMap: cobbleBumpTex } =
    createContinuousCourtyardCobbleTextures();
  const courtyardCobbleMat = new THREE.MeshStandardMaterial({
    map: cobbleColorTex,
    bumpMap: cobbleBumpTex,
    bumpScale: 0.038,
    roughness: 0.82,
    metalness: 0.06,
  });

  /**
   * Issue #7 ("Along here is a much more rough cobblestone texture" at `[2.062, -0.059, 12.624]`):
   * Generates a rough, hand-laid, deeply-jointed rustic fieldstone/granite cobblestone texture + high-relief
   * bump map for the South-East Courtyard Apron & Alleyway between the Patio/Pergola and the Barn/Stable
   * (matching `media_1791117103770_2d2c87d9.jpg` bottom-left and `media_1791117141917_9863a9c5.jpg`).
   */
  const createRoughAlleyCobblestoneMaterial = (): THREE.MeshStandardMaterial => {
    const size = 512;
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

    const cols = 10;
    const rows = 12;
    const roughPalette: ReadonlyArray<readonly [number, number, number]> = [
      [156, 144, 128], // Weathered warm grey-buff cobble
      [132, 122, 110], // Dark taupe-grey fieldstone
      [174, 156, 134], // Warm ochre-sandstone cobble
      [114, 108, 102], // Charcoal-slate cobble
      [164, 142, 122], // Russet-brown ironstone cobble
      [142, 136, 124], // Moss-tinted olive-grey stone
      [182, 168, 148], // Pale weathered gritstone
      [122, 112, 98],  // Deep umber-grey cobble
    ];

    const hash = (a: number, b: number): number => {
      const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
      return x - Math.floor(x);
    };

    for (let py = 0; py < size; py++) {
      const v = (py / size) * rows;
      const rowIdx = Math.floor(v);
      const fy = v - rowIdx;
      const rowShift = (rowIdx & 1) * 0.45 + (hash(rowIdx, 7) - 0.5) * 0.25;

      for (let px = 0; px < size; px++) {
        const idx = (py * size + px) * 4;
        const u = (px / size) * cols + rowShift;
        const colIdx = Math.floor(u);
        const fx = u - colIdx;

        const wCol = ((colIdx % cols) + cols) % cols;
        const wRow = ((rowIdx % rows) + rows) % rows;
        const jA = hash(wCol * 17 + 3, wRow * 31 + 11);
        const jB = hash(wCol * 41 + 9, wRow * 19 + 5);
        const jC = hash(wCol * 23 + 1, wRow * 53 + 7);

        // Irregular organic cobble center & crooked edges
        const cx = 0.5 + (jA - 0.5) * 0.14;
        const cy = 0.5 + (jB - 0.5) * 0.14;
        const warpX = Math.sin(fy * Math.PI * 2 + jA * 6.28) * 0.055;
        const warpY = Math.cos(fx * Math.PI * 2 + jB * 6.28) * 0.055;
        const dx = Math.abs(fx - cx + warpX) / (0.41 - jC * 0.05);
        const dy = Math.abs(fy - cy + warpY) / (0.39 - jA * 0.05);
        const dist = Math.pow(Math.pow(dx, 3.2) + Math.pow(dy, 3.2), 1 / 3.2);

        const craggyNoise =
          Math.sin((px + jA * 40) * 0.28) * Math.cos((py + jB * 40) * 0.28) * 14 +
          Math.sin(px * 0.65 - py * 0.55) * 8;

        if (dist > 1.0) {
          // Deep, rough, dark earthy & mossy mortar recess between irregular cobbles
          const mossHint = hash(px * 0.15, py * 0.15);
          const mr = Math.round(78 + craggyNoise * 0.6 - (mossHint > 0.65 ? 12 : 0));
          const mg = Math.round(74 + craggyNoise * 0.6 + (mossHint > 0.65 ? 8 : 0));
          const mb = Math.round(60 + craggyNoise * 0.5 - (mossHint > 0.65 ? 10 : 0));
          cData[idx] = Math.max(0, Math.min(255, mr));
          cData[idx + 1] = Math.max(0, Math.min(255, mg));
          cData[idx + 2] = Math.max(0, Math.min(255, mb));
          cData[idx + 3] = 255;

          const jointB = Math.max(8, Math.min(55, Math.round(22 + craggyNoise * 0.8)));
          bData[idx] = jointB;
          bData[idx + 1] = jointB;
          bData[idx + 2] = jointB;
          bData[idx + 3] = 255;
        } else {
          // Uneven, weathered, hand-split rough cobblestone dome
          const baseRGB = roughPalette[Math.floor(jC * roughPalette.length) % roughPalette.length]!;
          const dome = Math.max(0, 1.0 - 0.72 * Math.pow(dist, 1.85));
          const bevel = dist > 0.76 ? (1.0 - dist) / 0.24 : 1.0;
          const stoneHeightBias = (jB - 0.5) * 32;
          const shade = (dome - 0.4) * 34 * bevel + stoneHeightBias + craggyNoise;

          cData[idx] = Math.max(0, Math.min(255, Math.round(baseRGB[0] + shade)));
          cData[idx + 1] = Math.max(0, Math.min(255, Math.round(baseRGB[1] + shade * 0.95)));
          cData[idx + 2] = Math.max(0, Math.min(255, Math.round(baseRGB[2] + shade * 0.88)));
          cData[idx + 3] = 255;

          const hVal = Math.max(
            60,
            Math.min(255, Math.round(115 + dome * 125 * bevel + stoneHeightBias + craggyNoise * 1.3))
          );
          bData[idx] = hVal;
          bData[idx + 1] = hVal;
          bData[idx + 2] = hVal;
          bData[idx + 3] = 255;
        }
      }
    }

    cCtx.putImageData(cImg, 0, 0);
    bCtx.putImageData(bImg, 0, 0);

    const colorMap = new THREE.CanvasTexture(colorCanvas);
    colorMap.colorSpace = THREE.SRGBColorSpace;
    colorMap.wrapS = THREE.RepeatWrapping;
    colorMap.wrapT = THREE.RepeatWrapping;
    colorMap.anisotropy = 8;

    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.RepeatWrapping;
    bumpMap.anisotropy = 8;

    return new THREE.MeshStandardMaterial({
      map: colorMap,
      bumpMap,
      bumpScale: 0.058,
      roughness: 0.9,
      metalness: 0.02,
    });
  };

  const roughAlleyCobbleMat = createRoughAlleyCobblestoneMaterial();

  /**
   * Creates a subdivided BoxGeometry for a courtyard slab or stone sett band whose vertices
   * follow the continuous 2D courtyard elevation gradient `getCourtyardGroundY(wx, wz)`
   * and continuous world-space arched granite sett UVs (Issue #10, #6, #7).
   */
  const createGradedCourtyardGeometry = (
    w: number,
    h: number,
    d: number,
    offsetX: number,
    offsetZ: number,
    segX: number,
    segZ: number,
    applyCobbleUVs: boolean,
    isRoughCobbleApron: boolean = false
  ): THREE.BufferGeometry => {
    const geo = new THREE.BoxGeometry(w, h, d, segX, 1, segZ);
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    const isMainCourtyardPiece = offsetX > -18.0 && offsetX < -4.0;
    const isSouthEastApronPiece = offsetX >= -4.0 && offsetX < 10.0;
    if (pos) {
      for (let i = 0; i < pos.count; i++) {
        let wx = pos.getX(i) + offsetX;
        let wz = pos.getZ(i) + offsetZ;
        // Issue #10: Clip the West edge of the courtyard slab & stone sett bands along the angled
        // West Wing exterior brick wall (`getEastCourtyardWallCenterX(wz) + 0.04`) and the North edge
        // along the rotated East-West Wing South brick wall (`getEastWingSouthWallZ(wx) + 0.04`) so the
        // courtyard floor never spills into the Front Entrance Hallway, Hall, Boot Lobby, Dining Room,
        // Sitting Room, or Plant Room!
        if (isMainCourtyardPiece) {
          const minAllowedNorthZ = getEastWingSouthWallZ(wx) + 0.04;
          if (wz < minAllowedNorthZ) {
            wz = minAllowedNorthZ;
            pos.setZ(i, wz - offsetZ);
          }
          // Issue #4: Wrap courtyard cobbles cleanly around the Ground Floor Entrance Hallway
          // East jut-out (X = -17.00m..-16.16m, Z = 2.68m..3.83m) so cobbles at Y = -0.32m
          // never poke through the -0.60m Entrance Hallway floor while keeping full coverage South of Z = 3.75m.
          const isInsideJutOutZ = wz < 3.75;
          if ((isInsideJutOutZ && wz > 3.4) || (!isInsideJutOutZ && wz < 4.1 && wx < -16.22)) {
            wz = 3.75;
            pos.setZ(i, wz - offsetZ);
          }
          if (wz <= 11.78) {
            const minAllowedCourtyardX = isInsideJutOutZ
              ? -16.22
              : getEastCourtyardWallCenterX(wz) + 0.04;
            if (wx < minAllowedCourtyardX) {
              wx = minAllowedCourtyardX;
              pos.setX(i, wx - offsetX);
            }
          }
        } else if (isSouthEastApronPiece) {
          // Both the Raised Patio Shrub Bank (wx <= 4.8m) and the enlarged Walled Grape-Vine Pergola
          // (wx > 4.8m, Issue #2) extend South to z_ew = +7.35m (`getEastWingSouthWallZ(wx) + 4.72`)!
          const minAllowedTerraceSouthZ = getEastWingSouthWallZ(wx) + 4.72;
          if (wz < minAllowedTerraceSouthZ) {
            wz = minAllowedTerraceSouthZ;
            pos.setZ(i, wz - offsetZ);
          }
        }
        // Clip the South (+Z) edge of all courtyard cobble pieces along the angled North wall
        // of the 5-Bay Outbuilding / Barn Range so zero cobbles enter GYM, Garage, Store, Barn, or Stable.
        if (offsetX > -23.0) {
          const maxAllowedSouthZ = getOutbuildingNorthWallWorldZ(wx) - 0.02;
          if (wz > maxAllowedSouthZ) {
            wz = maxAllowedSouthZ;
            pos.setZ(i, wz - offsetZ);
          }
        }
        const groundY = getCourtyardGroundY(wx, wz);
        const roughMicroRelief =
          isRoughCobbleApron && pos.getY(i) > 0
            ? Math.sin(wx * 5.2 + wz * 4.7) * Math.cos(wx * 3.8 - wz * 6.1) * 0.006
            : 0;
        pos.setY(i, pos.getY(i) + groundY + roughMicroRelief);
        if (applyCobbleUVs && uv) {
          if (isRoughCobbleApron) {
            // Issue #7: Rough irregular cobblestone UVs aligned with the Barn/Alleyway axis
            uv.setXY(i, wx / 1.35, wz / 1.35);
          } else {
            // Issue #10 & #6: Align world-space UVs with the rotated Kitchen South Cobble Path (band width 1.46m,
            // 8 arched courses = 1.1500472m from pivotX = 4.72875m) so the arched fan bands align across the courtyard & driveway!
            uv.setXY(
              i,
              (4.72875 - wx) / 1.1500472,
              1 - (wz - (getEastWingSouthWallZ(wx) - 0.41)) / 1.46
            );
          }
        }
      }
      pos.needsUpdate = true;
      if (applyCobbleUVs && uv) {
        uv.needsUpdate = true;
      }
      geo.computeVertexNormals();
    }
    return geo;
  };

  // Main Cobbled Courtyard Slab enclosed by the L-shaped house (X = getEastCourtyardWallCenterX(z)..-4.64m, Z = getEastWingSouthWallZ(x)..+16.05m)
  // Clipped along the angled West Wing wall & rotated East-West Wing South wall so zero cobbles spill into the house (Issue #10)
  const mainCourtyardSlab = new THREE.Mesh(
    createGradedCourtyardGeometry(
      12.47,
      0.105,
      13.35,
      -10.875,
      9.375,
      32,
      32,
      true
    ),
    courtyardCobbleMat
  );
  mainCourtyardSlab.name = 'courtyard.mainCobbleSlab';
  mainCourtyardSlab.userData.isArchitecturalShell = true;
  mainCourtyardSlab.position.set(-10.875, -0.064, 9.375);
  mainCourtyardSlab.receiveShadow = true;
  scene.add(mainCourtyardSlab);

  // North-East Courtyard Cobble Strip connecting the Dining Room South threshold (X = -9.56m..-4.64m)
  // seamlessly to the Kitchen South Cobble Path at X = -4.64m without entering the Hall, Boot Lobby, or Dining Room
  const northEastCourtyardLink = new THREE.Mesh(
    createGradedCourtyardGeometry(
      4.92,
      0.105,
      0.9,
      -7.1,
      4.1,
      12,
      4,
      true
    ),
    courtyardCobbleMat
  );
  northEastCourtyardLink.name = 'courtyard.northEastCobbleLink';
  northEastCourtyardLink.userData.isArchitecturalShell = true;
  northEastCourtyardLink.position.set(-7.1, -0.064, 4.1);
  northEastCourtyardLink.receiveShadow = true;
  scene.add(northEastCourtyardLink);

  // Cobbled Courtyard Entrance Bay immediately behind the Split Gate along the South Gable Wall of the Study
  // (X = -22.33m..-17.11m, Z = +11.77m..+16.05m)
  const gateCourtyardBaySlab = new THREE.Mesh(
    createGradedCourtyardGeometry(5.22, 0.105, 4.28, -19.72, 13.91, 16, 12, true),
    courtyardCobbleMat
  );
  gateCourtyardBaySlab.name = 'courtyard.gateBayCobbleSlab';
  gateCourtyardBaySlab.userData.isArchitecturalShell = true;
  gateCourtyardBaySlab.position.set(-19.72, -0.064, 13.91);
  gateCourtyardBaySlab.receiveShadow = true;
  scene.add(gateCourtyardBaySlab);

  // Issue #7 ("Along here is a much more rough cobblestone texture" at `[2.062, -0.059, 12.624]`):
  // Lower South-East Courtyard Apron & Cobbled Alleyway between the Raised Limestone Patio / Walled Grape-Vine Pergola
  // and the Barn / 2-Storey Stable North Wall (X = -4.64m..+10.80m, Photo 10)
  const southEastCourtyardApron = new THREE.Mesh(
    createGradedCourtyardGeometry(
      15.44,
      0.105,
      9.4,
      3.08,
      11.35,
      42,
      30,
      true,
      true
    ),
    roughAlleyCobbleMat
  );
  southEastCourtyardApron.name = 'courtyard.southEastCobbleApron';
  southEastCourtyardApron.userData.isArchitecturalShell = true;
  southEastCourtyardApron.position.set(3.08, -0.064, 11.35);
  southEastCourtyardApron.receiveShadow = true;
  scene.add(southEastCourtyardApron);

  // Issue #6 ("This texture should be used on the driveway too"):
  // Arched Granite-Sett Driveway Apron in front of (West of) the Split Gate (X = -27.85m..-22.33m, Z = +11.77m..+16.25m)
  const drivewayApron = new THREE.Mesh(
    createGradedCourtyardGeometry(5.52, 0.095, 4.48, -25.09, 14.01, 16, 14, true),
    courtyardCobbleMat
  );
  drivewayApron.name = 'courtyard.drivewayApron';
  drivewayApron.userData.isArchitecturalShell = true;
  drivewayApron.position.set(-25.09, -0.068, 14.01);
  drivewayApron.receiveShadow = true;
  scene.add(drivewayApron);

  // Stone Sett Drainage Channels & Car Gate Wheel Tracks following the graded Cobbled Courtyard (visible in Photos 1, 2, 5, 7, 10)
  for (const [cx, cz, w, d, sx, sz] of [
    [-10.68, 4.45, 12.08, 0.16, 28, 2],    // East-West sett channel continuing the line of the Kitchen cobble path
    [-10.78, 7.6, 12.28, 0.16, 28, 2],     // Middle East-West courtyard drainage sett band
    [-13.41, 13.05, 17.75, 0.22, 36, 2],   // Double-row stone sett track starting at the Split Gate post (X=-22.28m) into the courtyard (Photos 1, 2, 7)
    [-16.15, 9.4, 0.16, 13.0, 2, 28],      // North-South sett drainage channel along West courtyard wing
    [-8.78, 9.9, 0.16, 12.0, 2, 28],       // North-South sett drainage channel aligned with Dining Room Courtyard Door
  ] as const) {
    const band = new THREE.Mesh(
      createGradedCourtyardGeometry(w, 0.11, d, cx, cz, sx, sz, false),
      stoneSillMat
    );
    band.userData.isArchitecturalShell = true;
    band.position.set(cx, -0.058, cz);
    band.receiveShadow = true;
    scene.add(band);
  }

  // -------------------------------------------------------------------------
  // Slatted Teak/Oak Garden Bench & Flanking Terracotta Planters under the Boot Lobby
  // Courtyard Window (local X = -11.65m, Z = +3.02m — seated on the sloped courtyard cobbles, Photo 1!)
  // -------------------------------------------------------------------------
  const benchGroup = new THREE.Group();
  const benchWorldPos = transformEastWingPoint(-11.65, 0, 3.02);
  const benchGroundY = getCourtyardGroundY(benchWorldPos.x, benchWorldPos.z);
  benchGroup.position.set(benchWorldPos.x, benchGroundY, benchWorldPos.z);
  benchGroup.rotation.y = MAIN_EAST_WING_ROTATION_Y;

  const weatheredTeakMat = new THREE.MeshStandardMaterial({
    color: 0x8c765c,
    roughness: 0.72,
    metalness: 0.03,
  });

  // Bench seat slats & backrest slats (width 1.28m, depth 0.52m, height 0.86m)
  const benchSeat = new THREE.Mesh(
    new THREE.BoxGeometry(1.24, 0.045, 0.48),
    weatheredTeakMat
  );
  benchSeat.position.set(0, 0.43, 0.02);
  benchSeat.castShadow = true;
  benchSeat.receiveShadow = true;
  benchGroup.add(benchSeat);

  const benchBack = new THREE.Mesh(
    new THREE.BoxGeometry(1.24, 0.42, 0.04),
    weatheredTeakMat
  );
  benchBack.position.set(0, 0.66, -0.21);
  benchBack.rotation.x = -0.08;
  benchBack.castShadow = true;
  benchGroup.add(benchBack);

  for (const sideX of [-0.59, 0.59]) {
    const frontLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.58, 0.055),
      weatheredTeakMat
    );
    frontLeg.position.set(sideX, 0.29, 0.23);
    frontLeg.castShadow = true;
    benchGroup.add(frontLeg);

    const rearLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.86, 0.055),
      weatheredTeakMat
    );
    rearLeg.position.set(sideX, 0.43, -0.22);
    rearLeg.castShadow = true;
    benchGroup.add(rearLeg);

    const armRest = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.04, 0.52),
      weatheredTeakMat
    );
    armRest.position.set(sideX, 0.59, 0.01);
    armRest.castShadow = true;
    benchGroup.add(armRest);
  }
  scene.add(benchGroup);

  // Terracotta & Weathered Stone Planters along the Courtyard Walls (seated on the sloped courtyard cobbles, Photos 1, 3, 5)
  const ivyDarkGreenMat = new THREE.MeshStandardMaterial({
    color: 0x2d4e28,
    roughness: 0.78,
    metalness: 0.02,
  });
  const ivyMidGreenMat = new THREE.MeshStandardMaterial({
    color: 0x3f6836,
    roughness: 0.74,
    metalness: 0.02,
  });
  const greyPlanterMat = new THREE.MeshStandardMaterial({
    color: 0x767a7e,
    roughness: 0.68,
    metalness: 0.08,
  });

  const pPlanter1 = transformEastWingPoint(-8.12, 0, 2.94);
  const pPlanter2 = transformEastWingPoint(-9.42, 0, 2.94);
  const pPlanter3 = transformEastWingPoint(-12.65, 0, 2.98);
  const pPlanter4 = transformEastWingPoint(-15.65, 0, 2.98);
  const pPlanter5 = transformEastWingPoint(-14.15, 0, 2.98);

  for (const [px, pz, potR, crownR, isGrey] of [
    [pPlanter1.x, pPlanter1.z, 0.22, 0.28, false],  // Right of Dining Room Exterior Courtyard Door (Photo 1)
    [pPlanter2.x, pPlanter2.z, 0.2, 0.25, false],   // Left of Dining Room Exterior Courtyard Door (Photo 1)
    [pPlanter3.x, pPlanter3.z, 0.22, 0.28, true],   // Left of Garden Bench — Grey cylindrical planter (Photo 5)
    [pPlanter5.x, pPlanter5.z, 0.21, 0.26, true],   // Right of Hall Courtyard Door — Grey cylindrical planter (Photo 5)
    [pPlanter4.x, pPlanter4.z, 0.21, 0.27, true],   // Left of Hall Courtyard Door — Grey cylindrical planter (Photo 5)
    [getEastCourtyardWallCenterX(4.35) + 0.44, 4.35, 0.23, 0.3, false],   // Along Sitting Room Courtyard Wall (Photo 1 & 3 — Issue #1)
    [getEastCourtyardWallCenterX(7.65) + 0.44, 7.65, 0.22, 0.28, false],  // North of Plant Room Courtyard Door (Photo 3 — Issue #1)
    [getEastCourtyardWallCenterX(10.75) + 0.44, 10.75, 0.22, 0.28, false],// South of Plant Room Courtyard Door (Photo 3 — Issue #1)
  ] as const) {
    const potGroundY = getCourtyardGroundY(px, pz);
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(potR, potR * (isGrey ? 0.88 : 0.74), potR * 1.65, 12),
      isGrey ? greyPlanterMat : terracottaPotMat
    );
    pot.position.set(px, potGroundY + potR * 0.825, pz);
    pot.castShadow = true;
    pot.receiveShadow = true;
    scene.add(pot);

    const shrub = new THREE.Mesh(
      new THREE.SphereGeometry(crownR, 12, 10),
      ivyMidGreenMat
    );
    shrub.scale.set(1.05, 0.92, 1.05);
    shrub.position.set(px, potGroundY + potR * 1.65 + crownR * 0.65, pz);
    shrub.castShadow = true;
    scene.add(shrub);
  }

  // Dark-grey Oval Sky Satellite Dish on the upper South Courtyard Brick Wall above Boot Lobby / Hall (Photo 5)
  const satWorldPos = transformEastWingPoint(-13.85, 3.12, 2.71);
  const satDish = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 14, 10),
    castIronMat
  );
  satDish.name = 'courtyard.satelliteDish';
  satDish.userData.isArchitecturalShell = true;
  satDish.scale.set(1.18, 0.88, 0.22);
  satDish.position.set(satWorldPos.x, satWorldPos.y, satWorldPos.z + 0.08);
  satDish.rotation.set(0.24, MAIN_EAST_WING_ROTATION_Y + 0.35, 0);
  satDish.castShadow = true;
  scene.add(satDish);

  // -------------------------------------------------------------------------
  // High-LOD Botanical Climbing English Ivy (Hedera helix) on Courtyard & Front Bay Walls (Issue #4)
  // Built from branching woody climbing stems (TubeGeometry) + shingled 3-lobed palmate ivy leaf sprays
  // -------------------------------------------------------------------------
  const ivyStemMat = new THREE.MeshStandardMaterial({
    color: 0x4d3b2c,
    roughness: 0.88,
    metalness: 0.02,
  });
  const ivyYoungGreenMat = new THREE.MeshStandardMaterial({
    color: 0x4b7a3a,
    roughness: 0.64,
    metalness: 0.03,
    side: THREE.DoubleSide,
  });

  // Builds a single reusable multi-leaf shingled botanical ivy spray geometry (5 overlapping 3-lobed cordate ivy blades)
  // in wall-local coordinates where +X is outward from the wall, +Y is up, and Z is lateral along the wall.
  const createBotanicalIvySprayGeometry = (): THREE.BufferGeometry => {
    const positions: number[] = [];
    const normals: number[] = [];
    const indices: number[] = [];

    const addLobedIvyBlade = (
      ox: number,
      oy: number,
      oz: number,
      len: number,
      width: number,
      yawRad: number,
      pitchRad: number,
      rollRad: number
    ): void => {
      const baseVertex = positions.length / 3;
      const euler = new THREE.Euler(rollRad, yawRad, pitchRad, 'YXZ');
      const quat = new THREE.Quaternion().setFromEuler(euler);
      const vTmp = new THREE.Vector3();

      // 11-vertex 3-lobed palmate/cordate ivy leaf blade:
      // 0: petiole base, 1: center midrib, 2: main apex tip,
      // 3: left basal lobe, 4: left lateral lobe tip, 5: left sinus notch, 6: left upper shoulder,
      // 7: right basal lobe, 8: right lateral lobe tip, 9: right sinus notch, 10: right upper shoulder
      const localPts: ReadonlyArray<readonly [number, number, number]> = [
        [0.0, 0.0, 0.0],
        [0.012 * len, -0.44 * len, 0.0],
        [0.028 * len, -1.0 * len, 0.0],
        [0.006 * len, 0.14 * len, -0.32 * width],
        [0.018 * len, -0.32 * len, -0.52 * width],
        [0.014 * len, -0.46 * len, -0.26 * width],
        [0.022 * len, -0.72 * len, -0.30 * width],
        [0.006 * len, 0.14 * len, 0.32 * width],
        [0.018 * len, -0.32 * len, 0.52 * width],
        [0.014 * len, -0.46 * len, 0.26 * width],
        [0.022 * len, -0.72 * len, 0.30 * width],
      ];

      for (const [lx, ly, lz] of localPts) {
        vTmp.set(lx, ly, lz).applyQuaternion(quat);
        positions.push(ox + vTmp.x, oy + vTmp.y, oz + vTmp.z);
        normals.push(1, 0, 0);
      }

      const bladeTris: ReadonlyArray<readonly [number, number, number]> = [
        [0, 3, 1],
        [3, 4, 1],
        [4, 5, 1],
        [5, 6, 1],
        [6, 2, 1],
        [0, 1, 7],
        [1, 8, 7],
        [1, 9, 8],
        [1, 10, 9],
        [1, 2, 10],
      ];
      for (const [a, b, c] of bladeTris) {
        indices.push(baseVertex + a, baseVertex + b, baseVertex + c);
      }
    };

    // 6 shingled overlapping ivy blades per spray cluster
    addLobedIvyBlade(0.018, 0.0, 0.0, 0.14, 0.13, 0.0, 0.22, 0.0);
    addLobedIvyBlade(0.014, 0.045, -0.055, 0.125, 0.115, -0.32, 0.18, -0.28);
    addLobedIvyBlade(0.014, 0.042, 0.058, 0.125, 0.115, 0.32, 0.18, 0.28);
    addLobedIvyBlade(0.010, -0.048, -0.048, 0.115, 0.108, -0.24, 0.26, -0.18);
    addLobedIvyBlade(0.010, -0.045, 0.050, 0.115, 0.108, 0.24, 0.26, 0.18);
    addLobedIvyBlade(0.022, 0.072, 0.004, 0.105, 0.098, 0.06, 0.15, 0.05);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  };

  const ivySprayGeo = createBotanicalIvySprayGeometry();

  const addWallClimbingIvy = (
    wallX: number,
    wallZ: number,
    normalAxis: 'x' | 'z',
    spanWidth: number,
    maxHeight: number,
    seedOffset: number
  ): void => {
    const ivyGroup = new THREE.Group();
    ivyGroup.name = `courtyard.climbingIvy.${seedOffset}`;
    ivyGroup.userData.isArchitecturalShell = true;
    const baseGroundY = getCourtyardGroundY(wallX, wallZ);
    const outwardSign = normalAxis === 'x' ? (wallX > -19.0 ? 1 : -1) : 1;

    const getWallSurfacePoint = (lateral: number, y: number, outDist: number): THREE.Vector3 => {
      if (normalAxis === 'x') {
        const wz = wallZ + lateral;
        const baseWallX =
          wallX > -18.0 ? getEastCourtyardWallCenterX(wz) + 0.14 : -22.47;
        return new THREE.Vector3(baseWallX + outwardSign * outDist, y, wz);
      }
      const wx = wallX + lateral;
      const baseWallZ = getEastWingSouthWallZ(wx);
      return new THREE.Vector3(wx, y, baseWallZ + outwardSign * outDist);
    };

    // 1. Three branching woody climbing vine stems clinging to the brick surface
    for (let b = 0; b < 3; b++) {
      const branchLateralBase = (b - 1) * (spanWidth * 0.22);
      const stemPts: THREE.Vector3[] = [];
      const steps = 6;
      for (let s = 0; s <= steps; s++) {
        const st = s / steps;
        const sy = baseGroundY + 0.04 + st * (maxHeight - 0.12) * (b === 1 ? 1.0 : 0.86);
        const wave = Math.sin(st * Math.PI * 2.5 + seedOffset * 0.17 + b * 1.9) * (spanWidth * 0.12);
        const lat = branchLateralBase * (1 - 0.25 * st) + wave;
        stemPts.push(getWallSurfacePoint(lat, sy, 0.009));
      }
      const stemCurve = new THREE.CatmullRomCurve3(stemPts);
      const stemRadius = b === 1 ? 0.0085 : 0.0065;
      const stemMesh = new THREE.Mesh(
        new THREE.TubeGeometry(stemCurve, 14, stemRadius, 5, false),
        ivyStemMat
      );
      stemMesh.castShadow = true;
      stemMesh.receiveShadow = true;
      ivyGroup.add(stemMesh);
    }

    // 2. Shingled botanical 3-lobed ivy leaf spray clusters along the vine branches
    const count = Math.floor(spanWidth * maxHeight * 11);
    const sprayMats = [ivyDarkGreenMat, ivyMidGreenMat, ivyYoungGreenMat];
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      const hash1 = Math.sin((i + seedOffset) * 12.9898) * 43758.5453;
      const frac1 = hash1 - Math.floor(hash1);
      const hash2 = Math.sin((i + seedOffset) * 78.233) * 19341.123;
      const frac2 = hash2 - Math.floor(hash2);
      const hash3 = Math.sin((i + seedOffset) * 39.425) * 27183.456;
      const frac3 = hash3 - Math.floor(hash3);

      const y = baseGroundY + 0.14 + t * (maxHeight - 0.18);
      // Taper width organically toward the upper climbing shoots
      const widthAtY = spanWidth * (1.0 - 0.36 * Math.pow(t, 1.35));
      const branchSnap = Math.sin(t * Math.PI * 2.5 + seedOffset * 0.17 + (i % 3) * 1.9) * (spanWidth * 0.1);
      const lateral = (frac1 - 0.5) * widthAtY * 0.85 + branchSnap * 0.45;
      const scale = (0.78 + frac2 * 0.52) * (1.05 - 0.22 * t);
      const matIdx = t > 0.78 && i % 2 === 0 ? 2 : i % 3;

      const leafSpray = new THREE.Mesh(ivySprayGeo, sprayMats[matIdx]!);
      const pos = getWallSurfacePoint(lateral, y, 0.008 + frac3 * 0.014);
      leafSpray.position.copy(pos);

      if (normalAxis === 'x') {
        const baseRotY = outwardSign > 0 ? 0 : Math.PI;
        const wallAngle = wallX > -18.0 ? Math.atan2(-0.43, 9.37) : 0;
        leafSpray.rotation.set(
          (frac3 - 0.5) * 0.38,
          baseRotY + wallAngle + (frac1 - 0.5) * 0.28,
          (frac2 - 0.5) * 0.18
        );
      } else {
        leafSpray.rotation.set(
          (frac3 - 0.5) * 0.38,
          -Math.PI / 2 + MAIN_EAST_WING_ROTATION_Y + (frac1 - 0.5) * 0.28,
          (frac2 - 0.5) * 0.18
        );
      }
      leafSpray.scale.set(scale, scale, scale);
      leafSpray.castShadow = true;
      leafSpray.receiveShadow = true;
      ivyGroup.add(leafSpray);
    }
    scene.add(ivyGroup);
  };

  // 1. Lush climbing ivy on the East Courtyard Wall of Sitting Room & Plant Room (Photos 1 & 3 — Issue #1: strictly on exterior courtyard face)
  addWallClimbingIvy(getEastCourtyardWallCenterX(4.45) + 0.14, 4.45, 'x', 1.45, 3.35, 11);
  addWallClimbingIvy(getEastCourtyardWallCenterX(7.55) + 0.14, 7.55, 'x', 1.55, 3.45, 29);
  // 2. Climbing ivy on the South Courtyard Wall around the Dining Room & Boot Lobby (Photo 1)
  const pIvySouth1 = transformEastWingPoint(-5.25, 0, 2.69);
  const pIvySouth2 = transformEastWingPoint(-13.55, 0, 2.69);
  addWallClimbingIvy(pIvySouth1.x, pIvySouth1.z, 'z', 1.15, 2.75, 47);
  addWallClimbingIvy(pIvySouth2.x, pIvySouth2.z, 'z', 1.2, 3.15, 63);
  // 3. Climbing ivy on the West Front Facade around the twin Victorian bay windows (Photo 2)
  addWallClimbingIvy(-22.47, 1.55, 'x', 1.1, 3.45, 83);
  addWallClimbingIvy(-22.47, 4.25, 'x', 1.1, 3.45, 101);
  addWallClimbingIvy(-22.47, 7.65, 'x', 1.15, 3.45, 127);

  // Reusable local-space climbing ivy cluster helper for the Outbuildings / Barns
  const addWallClimbingIvyCluster = (
    parent: THREE.Object3D,
    localX: number,
    localY: number,
    localZ: number,
    normalAxis: 'x' | 'z',
    outwardSign: 1 | -1,
    spanW: number,
    spanH: number,
    seed: number
  ): void => {
    const clusterGroup = new THREE.Group();
    clusterGroup.name = `outbuildings.climbingIvy.${seed}`;
    clusterGroup.userData.isArchitecturalShell = true;

    const getLocalWallPoint = (lat: number, y: number, outDist: number): THREE.Vector3 => {
      if (normalAxis === 'x') {
        return new THREE.Vector3(
          localX + outwardSign * outDist,
          localY + y,
          localZ + lat
        );
      }
      return new THREE.Vector3(
        localX + lat,
        localY + y,
        localZ + outwardSign * outDist
      );
    };

    for (let b = 0; b < 3; b++) {
      const branchLateralBase = (b - 1) * (spanW * 0.22);
      const stemPts: THREE.Vector3[] = [];
      const steps = 6;
      for (let s = 0; s <= steps; s++) {
        const st = s / steps;
        const sy = 0.04 + st * (spanH - 0.1) * (b === 1 ? 1.0 : 0.88);
        const wave = Math.sin(st * Math.PI * 2.5 + seed * 0.17 + b * 1.9) * (spanW * 0.12);
        const lat = branchLateralBase * (1 - 0.22 * st) + wave;
        stemPts.push(getLocalWallPoint(lat, sy, 0.009));
      }
      const stemCurve = new THREE.CatmullRomCurve3(stemPts);
      const stemMesh = new THREE.Mesh(
        new THREE.TubeGeometry(stemCurve, 12, b === 1 ? 0.0085 : 0.0065, 5, false),
        ivyStemMat
      );
      stemMesh.castShadow = true;
      clusterGroup.add(stemMesh);
    }

    const count = Math.floor(spanW * spanH * 10);
    const sprayMats = [ivyDarkGreenMat, ivyMidGreenMat, ivyYoungGreenMat];
    const baseRotY =
      normalAxis === 'x'
        ? outwardSign > 0
          ? 0
          : Math.PI
        : outwardSign > 0
          ? -Math.PI / 2
          : Math.PI / 2;

    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      const hash1 = Math.sin((i + seed) * 12.9898) * 43758.5453;
      const frac1 = hash1 - Math.floor(hash1);
      const hash2 = Math.sin((i + seed) * 78.233) * 19341.123;
      const frac2 = hash2 - Math.floor(hash2);
      const hash3 = Math.sin((i + seed) * 39.425) * 27183.456;
      const frac3 = hash3 - Math.floor(hash3);

      const y = 0.1 + t * (spanH - 0.14);
      const widthAtY = spanW * (1.0 - 0.28 * Math.pow(t, 1.35));
      const branchSnap =
        Math.sin(t * Math.PI * 2.5 + seed * 0.17 + (i % 3) * 1.9) * (spanW * 0.09);
      const lateral = (frac1 - 0.5) * widthAtY * 0.88 + branchSnap * 0.45;
      const scale = (0.82 + frac2 * 0.52) * (1.06 - 0.2 * t);
      const matIdx = t > 0.76 && i % 2 === 0 ? 2 : i % 3;

      const leafSpray = new THREE.Mesh(ivySprayGeo, sprayMats[matIdx]!);
      leafSpray.position.copy(getLocalWallPoint(lateral, y, 0.008 + frac3 * 0.015));
      leafSpray.rotation.set(
        (frac3 - 0.5) * 0.38,
        baseRotY + (frac1 - 0.5) * 0.28,
        (frac2 - 0.5) * 0.18
      );
      leafSpray.scale.set(scale, scale, scale);
      leafSpray.castShadow = true;
      leafSpray.receiveShadow = true;
      clusterGroup.add(leafSpray);
    }

    parent.add(clusterGroup);
  };

  // -------------------------------------------------------------------------
  // Interactive Split Courtyard Gate (Pedestrian Entrance + Double Car Entrance)
  // Flush with the West Front Facade of the Main House at X = -22.33m (X = -22.19m..-22.47m),
  // spanning South from the SW Front corner of the Study (Z = +11.77m)
  // to the NW corner of the Outbuilding/GYM (Z = +16.00m) at the lowered courtyard elevation
  // (Y = -0.60m, 60cm below the Kitchen!) — matching Photos 1, 2, 3, 7 & Floorplan!
  // -------------------------------------------------------------------------
  const gateX = -22.33;
  const gateH = 1.88;
  const gateGroundY = getCourtyardGroundY(gateX, 14.0); // -0.60m

  // 3 Painted Timber Gate Posts along X = -22.33m (seated on the Y = -0.60m courtyard threshold):
  // - North post against the Study SW front brick corner (Z = +11.82m)
  // - Intermediate split post between the Pedestrian Entrance and Car Entrance (Z = +12.96m)
  // - South post at the Outbuilding/GYM NW corner (Z = +16.00m)
  for (const postZ of [11.82, 12.96, 16.0]) {
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, gateH + 0.08, 0.12),
      courtyardDoorMat
    );
    post.position.set(gateX, gateGroundY + (gateH + 0.08) / 2, postZ);
    post.castShadow = true;
    post.receiveShadow = true;
    scene.add(post);

    const postCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.035, 0.15),
      courtyardDoorRecessMat
    );
    postCap.position.set(gateX, gateGroundY + gateH + 0.095, postZ);
    scene.add(postCap);
  }

  /**
   * Helper to build a gate leaf group along X = gateX (at gateGroundY = -0.60m):
   * - Smooth vertical T&G boarding + capping rail on the West (-X, driveway) side (Photo 2)
   * - Framed ledged-and-braced horizontal rails + diagonal cross-braces on the East (+X, courtyard) side (Photo 3 & 7)
   */
  const buildSplitGateLeafGroup = (
    minZ: number,
    maxZ: number,
    hingeSide: 'north' | 'south',
    hasLatchHandle: boolean
  ): { readonly leafGroup: THREE.Group; readonly pivotZ: number } => {
    const leafW = maxZ - minZ;
    const centerZ = (minZ + maxZ) / 2;
    const leafGroup = new THREE.Group();
    leafGroup.position.set(gateX, gateGroundY + gateH / 2 + 0.03, centerZ);

    // Main vertical tongue-and-groove timber boarding panel
    const boardPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.048, gateH, leafW),
      courtyardDoorMat
    );
    boardPanel.castShadow = true;
    boardPanel.receiveShadow = true;
    leafGroup.add(boardPanel);

    // Top weather capping rail & outer stiles
    const topCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.082, 0.055, leafW + 0.01),
      courtyardDoorRecessMat
    );
    topCap.position.set(0, gateH / 2 + 0.01, 0);
    topCap.castShadow = true;
    leafGroup.add(topCap);

    for (const sz of [-leafW / 2 + 0.045, leafW / 2 - 0.045]) {
      const stile = new THREE.Mesh(
        new THREE.BoxGeometry(0.072, gateH, 0.09),
        courtyardDoorRecessMat
      );
      stile.position.set(0.012, 0, sz);
      stile.castShadow = true;
      leafGroup.add(stile);
    }

    // Top, middle, and bottom horizontal ledges on the courtyard (+X) side (visible in Photo 3 & 7!)
    for (const ly of [-gateH / 2 + 0.14, 0.0, gateH / 2 - 0.14]) {
      const ledge = new THREE.Mesh(
        new THREE.BoxGeometry(0.032, 0.11, leafW - 0.14),
        courtyardDoorRecessMat
      );
      ledge.position.set(0.034, ly, 0);
      ledge.castShadow = true;
      leafGroup.add(ledge);
    }

    // Lower and upper diagonal timber braces on the courtyard (+X) side (rising from the hinge side, Photo 3 & 7!)
    const braceSpanZ = leafW - 0.18;
    const braceSpanY = gateH / 2 - 0.24;
    const braceLen = Math.hypot(braceSpanZ, braceSpanY);
    const braceSign = hingeSide === 'north' ? 1 : -1;
    for (const by of [-gateH / 4, gateH / 4]) {
      const brace = new THREE.Mesh(
        new THREE.BoxGeometry(0.028, 0.09, braceLen),
        courtyardDoorRecessMat
      );
      brace.position.set(0.032, by, 0);
      brace.rotation.x = braceSign * Math.atan2(braceSpanY, braceSpanZ);
      brace.castShadow = true;
      leafGroup.add(brace);
    }

    // Black wrought-iron ring latch / handle on the West (-X) driveway face (visible in Photo 2!)
    if (hasLatchHandle) {
      const latchZ = hingeSide === 'north' ? leafW / 2 - 0.12 : -leafW / 2 + 0.12;
      const latchPlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.035, 0.14, 0.06),
        castIronMat
      );
      latchPlate.position.set(-0.026, 0.04, latchZ);
      leafGroup.add(latchPlate);
    }

    scene.add(leafGroup);
    const pivotZ = hingeSide === 'north' ? -leafW / 2 : leafW / 2;
    return { leafGroup, pivotZ };
  };

  // 1. North Pedestrian Entrance Gate Leaf (Z = +11.88m..+12.90m, width 1.02m, hinged manually on North post by the front corner, swinging inward +X into the courtyard)
  const pedGate = buildSplitGateLeafGroup(11.88, 12.9, 'north', true);
  interactions.registerHingedDoor(
    scene,
    pedGate.leafGroup,
    new THREE.Vector3(0, 0, pedGate.pivotZ),
    'y',
    Math.PI * 0.48,
    0
  );

  // 2. South Double-Leaf Motorized Car Entrance Gate (Z = +13.02m..+15.94m, total width 2.92m):
  //    - Left/North Car Gate Leaf (Z = +13.02m..+14.47m, hinged on the intermediate split post at Z = +12.96m)
  //    - Right/South Car Gate Leaf (Z = +14.49m..+15.94m, hinged on the South post at Z = +16.00m)
  //    Both leaves swing inward (+X, East) into the cobbled courtyard on KNX Bus (PA 1.1.22, GA 1/5/1 & 1/5/2)
  const northCarGate = buildSplitGateLeafGroup(13.02, 14.47, 'north', true);
  const southCarGate = buildSplitGateLeafGroup(14.49, 15.94, 'south', false);

  // Underground 24V KNX Gate Ram Boxes at the base of the two Car Gate Hinge Posts (Z = +13.06m and Z = +15.90m)
  for (const motorZ of [13.06, 15.9]) {
    const motorPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.03, 0.28),
      castIronMat
    );
    motorPlate.position.set(gateX + 0.08, gateGroundY + 0.015, motorZ);
    motorPlate.receiveShadow = true;
    scene.add(motorPlate);
  }

  interactions.registerMotorizedCarGatePair(
    scene,
    northCarGate.leafGroup,
    new THREE.Vector3(0, 0, northCarGate.pivotZ),
    Math.PI * 0.46,
    southCarGate.leafGroup,
    new THREE.Vector3(0, 0, southCarGate.pivotZ),
    -Math.PI * 0.46,
    10.0
  );

  // -------------------------------------------------------------------------
  // 9. SOUTHERN 5-BAY OUTBUILDING / BARN RANGE (GYM, GARAGE, STORE, BARN + FIRST FLOOR, STABLE)
  // -------------------------------------------------------------------------
  buildOutbuildingsAndBarns(ctx, {
    exteriorBrickMat,
    stoneSillMat,
    courtyardDoorMat,
    courtyardDoorRecessMat,
    castIronMat,
    windowFrameMat,
    windowGlassMat,
    warmRoomPlasterMat,
    oakFloorMat: engineeredOakFloorMat,
    wallCapMat,
    applyWorldSpaceBrickUVs,
    addWallClimbingIvyCluster,
  });
}
