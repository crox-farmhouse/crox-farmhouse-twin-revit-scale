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
   * Issue #3 ("Use this cobbled pattern on the entire couryard" at `[-3.721, -0.01, 5.139]`, `courtyard.southCobblePathReliefTop`)
   * & Issue #6 ("Make sure it has a repeating element (see pictures)" at `[-10.452, -0.204, 6.336]`, `courtyard.mainCobbleSlab`):
   * Generates a seamlessly tileable (`THREE.RepeatWrapping`) 512x512 arched granite sett fan ("Bogenpflaster")
   * color + 3D depth texture pair using the EXACT same Canvas2D `roundRect` cobble rendering, `#cbb894` sandy-buff
   * mortar, `#7d8186..#5b6066` 10-color granite palette, and 4-ring stepped depth map as `createGraniteSettLPathTextures()`,
   * repeating in parallel `1.46m` scalloped fan-arc bands across the entire courtyard!
   */
  const createContinuousCourtyardCobbleTextures = (): {
    readonly colorMap: THREE.CanvasTexture;
    readonly depthMap: THREE.CanvasTexture;
  } => {
    const width = 512;
    const height = 512;
    const pathW = 1.46;
    const courseStep = 0.1437559;
    const coursesPerTile = 8;
    const tileSpanS = coursesPerTile * courseStep; // 1.1500472m (8 arched fan courses per repeating tile)
    const numRows = 8;
    const cobbleStepU = pathW / numRows; // 0.1825m
    const arcPivotR = 1.18; // Pronounced repeating scalloped fan-arc curvature matching Photos 1, 5 & 10
    const pxPerMeterS = width / tileSpanS;
    const pxPerMeterU = height / pathW;

    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = width;
    colorCanvas.height = height;
    const cCtx = colorCanvas.getContext('2d')!;

    const depthCanvas = document.createElement('canvas');
    depthCanvas.width = width;
    depthCanvas.height = height;
    const dCtx = depthCanvas.getContext('2d')!;

    // 1. Warm sandy lime/sand mortar pointing base in colorMap & recessed mortar channels in depthMap
    //    (100% identical to `createGraniteSettLPathTextures` in `procedural-textures.ts`!)
    cCtx.fillStyle = '#cbb894';
    cCtx.fillRect(0, 0, width, height);

    dCtx.fillStyle = '#141414';
    dCtx.fillRect(0, 0, width, height);

    for (let y = 0; y < height; y += 4) {
      for (let x = 0; x < width; x += 4) {
        const delta = (((x % width) * 17 + (y % height) * 31) % 14) - 7;
        cCtx.fillStyle = `rgb(${203 + delta}, ${184 + delta}, ${148 + delta})`;
        cCtx.fillRect(x, y, 4, 4);

        const dv = Math.max(8, Math.min(34, 20 + Math.round(delta * 0.7)));
        dCtx.fillStyle = `rgb(${dv}, ${dv}, ${dv})`;
        dCtx.fillRect(x, y, 4, 4);
      }
    }

    const granitePalette = [
      '#7d8186',
      '#6c737b',
      '#8f7b74',
      '#928879',
      '#62666c',
      '#86898e',
      '#7f6d67',
      '#74797e',
      '#9b8f80',
      '#5b6066',
    ];

    const cobbleW = (courseStep - 0.026) * pxPerMeterS;
    const cobbleH = (cobbleStepU - 0.026) * pxPerMeterU;
    const rx = -cobbleW * 0.5;
    const ry = -cobbleH * 0.5;
    const cornerR = 3.5;

    // 2. Render repeating scalloped fan-arc granite setts across the 8x8 tile, wrapping horizontally
    //    around S = 0..tileSpanS so `THREE.RepeatWrapping` tiles seamlessly with zero edge seams!
    for (let c = -3; c <= coursesPerTile + 3; c++) {
      const wrappedC = ((c % coursesPerTile) + coursesPerTile) % coursesPerTile;
      const staggerU = (wrappedC % 2) * (cobbleStepU * 0.5);

      for (let r = 0; r < numRows; r++) {
        const u = (r + 0.5) * cobbleStepU + staggerU * 0.35;
        if (u < 0.04 || u > pathW - 0.04) continue;

        const du = u - pathW * 0.5;
        const clampedDu = Math.max(-arcPivotR + 0.15, Math.min(arcPivotR - 0.15, du));
        const arcBow = arcPivotR - Math.sqrt(arcPivotR * arcPivotR - clampedDu * clampedDu);
        const arcTangentAngle = Math.asin(clampedDu / arcPivotR);

        const s = (c + 0.5) * courseStep - arcBow;
        const cxPx = (s / tileSpanS) * width;
        const cyPx = (u / pathW) * height;
        if (cxPx < -cobbleW || cxPx > width + cobbleW) continue;

        const colorIdx = Math.abs((wrappedC * 17 + r * 11 + 7) % granitePalette.length);
        const baseColor = granitePalette[colorIdx] ?? '#7d8186';
        const cobbleHeightBias = ((wrappedC * 23 + r * 13) % 26) - 12;

        // Draw cobble in Color Map
        cCtx.save();
        cCtx.translate(cxPx, cyPx);
        cCtx.rotate(arcTangentAngle);

        cCtx.fillStyle = baseColor;
        cCtx.beginPath();
        cCtx.roundRect(rx, ry, cobbleW, cobbleH, cornerR);
        cCtx.fill();

        cCtx.strokeStyle = 'rgba(255, 248, 235, 0.18)';
        cCtx.lineWidth = 1.1;
        cCtx.stroke();

        cCtx.fillStyle = 'rgba(30, 32, 36, 0.12)';
        cCtx.fillRect(rx + 3, ry + 4, 3, 3);
        cCtx.fillRect(rx + cobbleW - 7, ry + cobbleH - 8, 3, 3);
        cCtx.restore();

        // Draw cobble in 3D Depth Map
        dCtx.save();
        dCtx.translate(cxPx, cyPx);
        dCtx.rotate(arcTangentAngle);

        const rings: ReadonlyArray<readonly [number, number, number]> = [
          [0.0, 3.5, 95],
          [1.4, 3.2, 155],
          [2.8, 2.8, 205],
          [4.5, 2.2, 238],
        ];
        for (const [inset, cr, baseLum] of rings) {
          const lum = Math.max(45, Math.min(255, baseLum + cobbleHeightBias));
          dCtx.fillStyle = `rgb(${lum}, ${lum}, ${lum})`;
          dCtx.beginPath();
          dCtx.roundRect(
            rx + inset,
            ry + inset,
            Math.max(2, cobbleW - inset * 2),
            Math.max(2, cobbleH - inset * 2),
            cr
          );
          dCtx.fill();
        }

        const crownLum = Math.max(60, Math.min(255, 246 + cobbleHeightBias));
        dCtx.fillStyle = `rgb(${crownLum}, ${crownLum}, ${crownLum})`;
        dCtx.fillRect(rx + 5, ry + 5, Math.max(2, cobbleW - 10), 4);
        const pitLum = Math.max(40, Math.min(230, 178 + cobbleHeightBias));
        dCtx.fillStyle = `rgb(${pitLum}, ${pitLum}, ${pitLum})`;
        dCtx.fillRect(rx + 4, ry + 4, 3, 3);
        dCtx.fillRect(rx + cobbleW - 7, ry + cobbleH - 8, 3, 3);
        dCtx.restore();
      }
    }

    const colorMap = new THREE.CanvasTexture(colorCanvas);
    colorMap.colorSpace = THREE.SRGBColorSpace;
    colorMap.wrapS = THREE.RepeatWrapping;
    colorMap.wrapT = THREE.RepeatWrapping;
    colorMap.anisotropy = 8;

    const depthMap = new THREE.CanvasTexture(depthCanvas);
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
   * Issue #5 ("Add the drainage channel (see pictures)" at `[-7.462, -0.154, 9.973]`):
   * Generates a 3-row coursed warm buff-stone / Yorkstone sett material for the recessed surface-water
   * drainage channel (valley gutter) running diagonally across the Courtyard from the Split Driveway Gate
   * through `[-7.462, -0.154, 9.973]` into the cobbled lane (visible in Photos 1, 5 & 10).
   */
  const createDrainageChannelSettMaterial = (): THREE.MeshStandardMaterial => {
    const w = 256;
    const h = 128;
    const cCanvas = document.createElement('canvas');
    cCanvas.width = w;
    cCanvas.height = h;
    const cCtx = cCanvas.getContext('2d')!;

    const bCanvas = document.createElement('canvas');
    bCanvas.width = w;
    bCanvas.height = h;
    const bCtx = bCanvas.getContext('2d')!;

    cCtx.fillStyle = '#8e7f68';
    cCtx.fillRect(0, 0, w, h);
    bCtx.fillStyle = '#222222';
    bCtx.fillRect(0, 0, w, h);

    const settColors = ['#d2c3a8', '#c6b598', '#dcd0b8', '#bca98c', '#cec0a4'];
    const numRows = 3;
    const numCols = 4;
    const rowH = h / numRows;
    const colW = w / numCols;

    for (let r = 0; r < numRows; r++) {
      const staggerX = (r % 2) * (colW * 0.5);
      for (let c = -1; c <= numCols; c++) {
        const sx = c * colW + staggerX + 3;
        const sy = r * rowH + 3;
        const sw = colW - 6;
        const sh = rowH - 6;
        const idx = Math.abs((r * 7 + c * 13) % settColors.length);

        cCtx.fillStyle = settColors[idx] ?? '#cec0a4';
        cCtx.beginPath();
        cCtx.roundRect(sx, sy, sw, sh, 3);
        cCtx.fill();

        cCtx.strokeStyle = 'rgba(255, 250, 238, 0.25)';
        cCtx.lineWidth = 1;
        cCtx.stroke();

        const lum = r === 1 ? 185 : 225; // Center row slightly recessed as valley gutter
        bCtx.fillStyle = `rgb(${lum}, ${lum}, ${lum})`;
        bCtx.beginPath();
        bCtx.roundRect(sx + 1, sy + 1, sw - 2, sh - 2, 2.5);
        bCtx.fill();
      }
    }

    const colorMap = new THREE.CanvasTexture(cCanvas);
    colorMap.colorSpace = THREE.SRGBColorSpace;
    colorMap.wrapS = THREE.RepeatWrapping;
    colorMap.wrapT = THREE.RepeatWrapping;
    colorMap.anisotropy = 8;

    const bumpMap = new THREE.CanvasTexture(bCanvas);
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.RepeatWrapping;
    bumpMap.anisotropy = 8;

    return new THREE.MeshStandardMaterial({
      map: colorMap,
      bumpMap,
      bumpScale: 0.028,
      roughness: 0.78,
      metalness: 0.04,
    });
  };

  const drainageChannelMat = createDrainageChannelSettMaterial();

  /**
   * Creates a subdivided BoxGeometry for a courtyard slab whose vertices follow the continuous
   * 2D courtyard elevation gradient `getCourtyardGroundY(wx, wz)` and continuous world-space
   * repeating arched granite sett UVs (Issue #3 & Issue #6).
   */
  const createGradedCourtyardGeometry = (
    w: number,
    h: number,
    d: number,
    offsetX: number,
    offsetZ: number,
    segX: number,
    segZ: number,
    applyCobbleUVs: boolean
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
        // Clip the West edge of the courtyard slab along the angled West Wing exterior brick wall
        // and the North edge along the rotated East-West Wing South brick wall so the courtyard floor
        // never spills into the Front Entrance Hallway, Hall, Boot Lobby, Dining Room, Sitting Room, or Plant Room!
        if (isMainCourtyardPiece) {
          const minAllowedNorthZ = getEastWingSouthWallZ(wx) + 0.04;
          if (wz < minAllowedNorthZ) {
            wz = minAllowedNorthZ;
            pos.setZ(i, wz - offsetZ);
          }
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
          // Both the wider Raised Patio Shrub Bank (wx <= 5.5m) and the Walled Grape-Vine Pergola
          // extend South to z_ew = +8.65m (`getEastWingSouthWallZ(wx) + 6.02`), making the cobbled
          // alleyway (`courtyard.southEastCobbleApron`) a realistic ~3.1m-wide cobbled lane!
          const minAllowedTerraceSouthZ = getEastWingSouthWallZ(wx) + 6.02;
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
        pos.setY(i, pos.getY(i) + groundY);
        if (applyCobbleUVs && uv) {
          // Issue #3 & Issue #6: Unified repeating arched granite sett fan UVs across the ENTIRE courtyard!
          uv.setXY(
            i,
            (4.72875 - wx) / 1.1500472,
            1 - (wz - (getEastWingSouthWallZ(wx) - 0.41)) / 1.46
          );
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
  const mainCourtyardSlab = new THREE.Mesh(
    createGradedCourtyardGeometry(
      12.47,
      0.105,
      13.35,
      -10.875,
      9.375,
      36,
      36,
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
  // seamlessly to the Kitchen South Cobble Path at X = -4.64m
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

  // Issue #3 ("Use this cobbled pattern on the entire couryard"):
  // Lower South-East Courtyard Apron & Cobbled Alleyway between the Raised Limestone Patio / Walled Grape-Vine Pergola
  // and the Barn / 2-Storey Stable North Wall (X = -4.64m..+10.80m) using the same repeating arched granite sett pattern!
  const southEastCourtyardApron = new THREE.Mesh(
    createGradedCourtyardGeometry(
      15.44,
      0.105,
      9.4,
      3.08,
      11.35,
      42,
      30,
      true
    ),
    courtyardCobbleMat
  );
  southEastCourtyardApron.name = 'courtyard.southEastCobbleApron';
  southEastCourtyardApron.userData.isArchitecturalShell = true;
  southEastCourtyardApron.position.set(3.08, -0.064, 11.35);
  southEastCourtyardApron.receiveShadow = true;
  scene.add(southEastCourtyardApron);

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

  // -------------------------------------------------------------------------
  // Issue #4 ("Get rid of this one" at `[-10.268, -0.316, 8.879]`) &
  // Issue #5 ("Add the drainage channel (see pictures)" at `[-7.462, -0.154, 9.973]`):
  // Authentic 3-Course Buff-Stone Sett Surface-Water Drainage Channel (`courtyard.drainageChannel`)
  // following the graded Courtyard from the Split Driveway Gate (`X = -22.25m, Z = 13.71m`)
  // straight through `[-7.462, -0.154, 9.973]` to the SW corner of the Patio Shrub Bed (`X = -4.64m, Z = 9.26m`)
  // and continuing down the center of the cobbled alleyway (`X = -4.64m..+8.20m`, Photos 1, 5 & 10).
  // -------------------------------------------------------------------------
  const drainageGroup = new THREE.Group();
  drainageGroup.name = 'courtyard.drainageChannel';
  drainageGroup.userData.isArchitecturalShell = true;

  const addGradedDrainageChannelRun = (
    runName: string,
    x0: number,
    z0: number,
    x1: number,
    z1: number,
    channelWidth: number,
    segLen: number
  ): void => {
    const dx = x1 - x0;
    const dz = z1 - z0;
    const runLen = Math.hypot(dx, dz);
    const nx = -dz / runLen;
    const nz = dx / runLen;
    const segAcross = 4; // 4 transverse segments to dish the center valley row slightly

    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    for (let il = 0; il <= segLen; il++) {
      const t = il / segLen;
      const cx = x0 + dx * t;
      const cz = z0 + dz * t;
      const uCoord = (t * runLen) / 0.56;

      for (let iw = 0; iw <= segAcross; iw++) {
        const s = iw / segAcross - 0.5; // -0.5 .. +0.5
        const wx = cx + nx * (s * channelWidth);
        const wz = cz + nz * (s * channelWidth);
        // Subtle dished valley gutter profile: edges sit +5mm proud of cobbles, center row dips -3mm
        const dishOffset = 0.005 - (1 - 4 * s * s) * 0.007;
        const wy = getCourtyardGroundY(wx, wz) + dishOffset;

        positions.push(wx, wy, wz);
        uvs.push(uCoord, iw / segAcross);
      }
    }

    const stride = segAcross + 1;
    for (let il = 0; il < segLen; il++) {
      for (let iw = 0; iw < segAcross; iw++) {
        const a = il * stride + iw;
        const b = (il + 1) * stride + iw;
        const c = (il + 1) * stride + (iw + 1);
        const d = il * stride + (iw + 1);
        indices.push(a, c, b, a, d, c);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, drainageChannelMat);
    mesh.name = runName;
    mesh.userData.isArchitecturalShell = true;
    mesh.receiveShadow = true;
    drainageGroup.add(mesh);
  };

  // 1. Main diagonal courtyard drainage channel from Split Gate (-22.25, 13.71) right through Issue #5 (-7.462, 9.973) to Patio/Alleyway corner (-4.64, 9.26)
  addGradedDrainageChannelRun(
    'courtyard.drainageChannel.main',
    -22.25,
    13.71,
    -4.64,
    9.26,
    0.34,
    48
  );

  // 2. Continuation of the 3-row stone-sett drainage runner down the center of the South-East cobbled alleyway (Photo 10)
  addGradedDrainageChannelRun(
    'courtyard.drainageChannel.alleyway',
    -4.64,
    9.26,
    8.2,
    10.45,
    0.32,
    36
  );

  // 3. Garage-apron stone-sett threshold channel in front of the double garage doors meeting the main drainage channel (Photo 5)
  addGradedDrainageChannelRun(
    'courtyard.drainageChannel.garageApron',
    -16.45,
    14.65,
    -7.462,
    9.973,
    0.28,
    28
  );

  // Recessed cast-iron slotted surface-water gully grates set into the drainage channel (at Issue #5 junction and lower gate run)
  for (const [gx, gz, gAngle] of [
    [-7.462, 9.973, Math.atan2(9.26 - 13.71, -4.64 - -22.25)],
    [-15.2, 11.93, Math.atan2(9.26 - 13.71, -4.64 - -22.25)],
  ] as const) {
    const gy = getCourtyardGroundY(gx, gz);
    const grate = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.016, 0.32),
      castIronMat
    );
    grate.name = 'courtyard.drainageChannel.gullyGrate';
    grate.position.set(gx, gy + 0.002, gz);
    grate.rotation.y = -gAngle;
    grate.receiveShadow = true;
    drainageGroup.add(grate);
  }

  scene.add(drainageGroup);

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
