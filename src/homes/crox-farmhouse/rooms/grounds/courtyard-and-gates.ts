import * as THREE from 'three';
import type { SceneBuilderContext } from '../../../../engine/viewer/scene-types.ts';
import {
  getEastWingSouthWallZ,
  MAIN_EAST_WING_ROTATION_Y,
  transformEastWingPoint,
  type createGroundFloorMaterials,
} from '../../structure/ground-floor-materials.ts';
import type { createGroundFloorShellKit } from '../../structure/ground-floor-shell-kit.ts';
import { buildLandRoverDefender } from './land-rover-defender.ts';
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
   * Issue #1 ("This looks good but maybe a little "too" uniform and procedural, how can we make it look more natural"
   * at `[-9.511, -0.235, 7.804]`, `courtyard.mainCobbleSlab`),
   * Issue #3 ("Use this cobbled pattern on the entire couryard"), &
   * Issue #6 ("Make sure it has a repeating element (see pictures)"):
   * Generates a seamlessly tileable (`THREE.RepeatWrapping`) 1024x1024 multi-band (`2.3000944m x 2.92m`,
   * 16 arched fan courses x 2 adjacent `1.46m` scalloped fan bands) hand-cleaved granite-sett ("Bogenpflaster")
   * color + 3D depth texture pair with per-stone size (`±14%`), position (`±3mm`), and angle (`±3.4°`) jitter,
   * 8-point irregular chamfered stone contours, diagonal mineral cleavage shading, quartz/feldspar speckles,
   * and weathered sandy-lime mortar with subtle mossy/earth patina.
   */
  const createContinuousCourtyardCobbleTextures = (): {
    readonly colorMap: THREE.CanvasTexture;
    readonly depthMap: THREE.CanvasTexture;
  } => {
    const width = 1024;
    const height = 1024;
    const bandW = 1.46;
    const bandsPerTile = 2;
    const tileSpanU = bandW * bandsPerTile; // 2.92m across 2 adjacent fan bands
    const courseStep = 0.1437559;
    const coursesPerTile = 16;
    const tileSpanS = coursesPerTile * courseStep; // 2.3000944m along 16 arched fan courses
    const rowsPerBand = 8;
    const cobbleStepU = bandW / rowsPerBand; // 0.1825m
    const pxPerMeterS = width / tileSpanS;
    const pxPerMeterU = height / tileSpanU;

    const stoneHash = (seed: number): number => {
      const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123;
      return x - Math.floor(x);
    };

    const traceOrganicCobblePath = (
      ctx: CanvasRenderingContext2D,
      w: number,
      h: number,
      seed: number,
      inset = 0
    ): void => {
      const hw = Math.max(2, w * 0.5 - inset);
      const hh = Math.max(2, h * 0.5 - inset);
      const chX = Math.min(hw * 0.42, (2.8 + stoneHash(seed + 1) * 3.4) * (1 - inset * 0.08));
      const chY = Math.min(hh * 0.42, (2.6 + stoneHash(seed + 2) * 3.2) * (1 - inset * 0.08));
      const j = (k: number): number =>
        (stoneHash(seed + k * 19.3) - 0.5) * 1.9 * Math.max(0.25, 1 - inset * 0.12);

      ctx.beginPath();
      ctx.moveTo(-hw + chX + j(3), -hh + j(4));
      ctx.lineTo(hw - chX + j(5), -hh + j(6));
      ctx.lineTo(hw + j(7), -hh + chY + j(8));
      ctx.lineTo(hw + j(9), hh - chY + j(10));
      ctx.lineTo(hw - chX + j(11), hh + j(12));
      ctx.lineTo(-hw + chX + j(13), hh + j(14));
      ctx.lineTo(-hw + j(15), hh - chY + j(16));
      ctx.lineTo(-hw + j(17), -hh + chY + j(18));
      ctx.closePath();
    };

    const colorCanvas = document.createElement('canvas');
    colorCanvas.width = width;
    colorCanvas.height = height;
    const cCtx = colorCanvas.getContext('2d')!;

    const depthCanvas = document.createElement('canvas');
    depthCanvas.width = width;
    depthCanvas.height = height;
    const dCtx = depthCanvas.getContext('2d')!;

    // 1. Weathered sandy-lime mortar base with multi-scale grit, damp earth crevices & subtle mossy patina
    cCtx.fillStyle = '#c4b18d';
    cCtx.fillRect(0, 0, width, height);

    dCtx.fillStyle = '#121212';
    dCtx.fillRect(0, 0, width, height);

    for (let y = 0; y < height; y += 4) {
      const ny = (y / height) * Math.PI * 2;
      for (let x = 0; x < width; x += 4) {
        const nx = (x / width) * Math.PI * 2;
        const macroWave =
          Math.sin(nx * 2 + ny) * 6 +
          Math.cos(nx * 3 - ny * 2) * 5 +
          Math.sin(nx * 5 + ny * 4) * 3;
        const grit = (((x * 19 + y * 37) ^ (x * 7)) % 15) - 7;
        const mossSignal =
          Math.sin(nx * 3 + 0.8) * Math.cos(ny * 3 - 0.5) +
          Math.sin(nx * 7 - ny * 5) * 0.45;
        const isMossy = mossSignal > 0.68;

        const r = Math.max(
          135,
          Math.min(222, Math.round(196 + macroWave + grit - (isMossy ? 22 : 0)))
        );
        const g = Math.max(
          130,
          Math.min(212, Math.round(177 + macroWave + grit - (isMossy ? 6 : 0)))
        );
        const b = Math.max(
          105,
          Math.min(182, Math.round(141 + macroWave + grit - (isMossy ? 26 : 0)))
        );
        cCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        cCtx.fillRect(x, y, 4, 4);

        const dv = Math.max(8, Math.min(36, 19 + Math.round((macroWave + grit) * 0.55)));
        dCtx.fillStyle = `rgb(${dv}, ${dv}, ${dv})`;
        dCtx.fillRect(x, y, 4, 4);
      }
    }

    // Heritage hand-cleaved granite, porphyry, warm sandstone & blue-grey basalt RGB palette
    const granitePaletteRgb: ReadonlyArray<readonly [number, number, number]> = [
      [125, 129, 134], // Weathered silver-grey granite
      [108, 115, 123], // Cool blue-grey granite
      [143, 123, 116], // Warm pinkish-taupe porphyry
      [146, 136, 121], // Warm buff-grey sandstone sett
      [98, 102, 108],  // Dark charcoal-slate sett
      [134, 137, 142], // Pale ash granite
      [127, 109, 103], // Russet-brown ironstone sett
      [116, 121, 126], // Mid quarry grey
      [155, 143, 128], // Golden-oatmeal weathered sett
      [91, 96, 102],   // Deep blue-basalt sett
      [138, 127, 114], // Warm greige sett
      [112, 118, 114], // Lichen-tinted olive-grey granite
      [149, 131, 118], // Warm terracotta-flecked granite
      [104, 108, 115], // Steely blue sett
    ];

    const baseCobbleW = (courseStep - 0.024) * pxPerMeterS;
    const baseCobbleH = (cobbleStepU - 0.024) * pxPerMeterU;

    // 2. Render repeating scalloped fan-arc granite setts across the 2-band x 16-course tile,
    //    wrapping around both S (0..tileSpanS) and U (0..tileSpanU) so `THREE.RepeatWrapping` is 100% seamless!
    for (let band = 0; band < bandsPerTile; band++) {
      const bandOffsetU = band * bandW;
      // Subtle organic difference between adjacent fan bands so adjacent rows of fans don't look like rigid clones
      const bandArcPivotR = band === 0 ? 1.16 : 1.23;
      const bandCoursePhase = band === 0 ? 0.0 : 0.18;

      for (let c = -3; c <= coursesPerTile + 3; c++) {
        const wrappedC = ((c % coursesPerTile) + coursesPerTile) % coursesPerTile;
        const courseWave = Math.sin((wrappedC / coursesPerTile) * Math.PI * 4 + band * 1.7) * 0.008;

        for (let r = 0; r < rowsPerBand; r++) {
          const seed = band * 4099 + wrappedC * 131 + r * 17 + 23;
          const staggerU = (wrappedC % 2) * (cobbleStepU * 0.42);
          const jitterU = (stoneHash(seed + 1) - 0.5) * 0.014;
          const localU = (r + 0.46) * cobbleStepU + staggerU * 0.36 + jitterU;
          if (localU < 0.032 || localU > bandW - 0.032) continue;

          const du = localU - bandW * 0.5;
          const clampedDu = Math.max(-bandArcPivotR + 0.14, Math.min(bandArcPivotR - 0.14, du));
          const arcBow =
            bandArcPivotR - Math.sqrt(bandArcPivotR * bandArcPivotR - clampedDu * clampedDu);
          const arcTangentAngle =
            Math.asin(clampedDu / bandArcPivotR) + (stoneHash(seed + 2) - 0.5) * 0.062;

          const jitterS = (stoneHash(seed + 3) - 0.5) * 0.015 + courseWave;
          const s = (c + 0.5 + bandCoursePhase) * courseStep - arcBow + jitterS;
          const u = bandOffsetU + localU;

          const cxPx = (s / tileSpanS) * width;
          const cyPx = (u / tileSpanU) * height;
          if (cxPx < -baseCobbleW || cxPx > width + baseCobbleW) continue;

          const cobbleW = baseCobbleW * (0.87 + stoneHash(seed + 4) * 0.25);
          const cobbleH = baseCobbleH * (0.86 + stoneHash(seed + 5) * 0.24);
          const rx = -cobbleW * 0.5;
          const ry = -cobbleH * 0.5;

          const palIdx = Math.floor(stoneHash(seed + 6) * granitePaletteRgb.length);
          const [br, bg, bb] = granitePaletteRgb[palIdx] ?? [125, 129, 134];
          const toneShift = Math.round((stoneHash(seed + 7) - 0.5) * 24);
          const warmShift = Math.round((stoneHash(seed + 8) - 0.5) * 12);
          const sr = Math.max(62, Math.min(188, br + toneShift + warmShift));
          const sg = Math.max(62, Math.min(184, bg + toneShift));
          const sb = Math.max(60, Math.min(182, bb + toneShift - warmShift));

          const cobbleHeightBias = Math.round((stoneHash(seed + 9) - 0.5) * 34);

          // Draw cobble in Color Map
          cCtx.save();
          cCtx.translate(cxPx, cyPx);
          cCtx.rotate(arcTangentAngle);

          // Subtle recessed mortar shadow halo around each stone base
          cCtx.fillStyle = 'rgba(42, 36, 28, 0.26)';
          traceOrganicCobblePath(cCtx, cobbleW + 3.2, cobbleH + 3.2, seed, 0);
          cCtx.fill();

          // Cleaved granite crown with natural diagonal mineral gradient
          const grad = cCtx.createLinearGradient(rx, ry, -rx, -ry);
          grad.addColorStop(
            0,
            `rgb(${Math.min(215, sr + 14)}, ${Math.min(210, sg + 13)}, ${Math.min(205, sb + 11)})`
          );
          grad.addColorStop(0.55, `rgb(${sr}, ${sg}, ${sb})`);
          grad.addColorStop(
            1,
            `rgb(${Math.max(45, sr - 16)}, ${Math.max(45, sg - 16)}, ${Math.max(45, sb - 14)})`
          );
          cCtx.fillStyle = grad;
          traceOrganicCobblePath(cCtx, cobbleW, cobbleH, seed, 0);
          cCtx.fill();

          // Sunlit top/left hand-dressed bevel edge & shaded bottom/right cleavage edge
          cCtx.strokeStyle = 'rgba(255, 248, 232, 0.22)';
          cCtx.lineWidth = 1.25;
          cCtx.stroke();

          // Inner riven facet & mineral grain mottling (feldspar, quartz & dark biotite flecks)
          for (let sp = 0; sp < 6; sp++) {
            const spX = (stoneHash(seed + 20 + sp * 3) - 0.5) * (cobbleW * 0.68);
            const spY = (stoneHash(seed + 21 + sp * 3) - 0.5) * (cobbleH * 0.68);
            const spR = 1.3 + stoneHash(seed + 22 + sp * 3) * 2.4;
            cCtx.fillStyle =
              sp % 2 === 0 ? 'rgba(248, 242, 228, 0.16)' : 'rgba(28, 30, 34, 0.17)';
            cCtx.beginPath();
            cCtx.arc(spX, spY, spR, 0, Math.PI * 2);
            cCtx.fill();
          }

          // Occasional subtle natural quartz vein or weathered cleavage line across ~30% of setts
          if (stoneHash(seed + 45) > 0.68) {
            cCtx.strokeStyle =
              stoneHash(seed + 46) > 0.5
                ? 'rgba(235, 226, 210, 0.18)'
                : 'rgba(42, 38, 34, 0.20)';
            cCtx.lineWidth = 0.9;
            cCtx.beginPath();
            cCtx.moveTo(rx * 0.65, (stoneHash(seed + 47) - 0.5) * cobbleH * 0.5);
            cCtx.lineTo(-rx * 0.65, (stoneHash(seed + 48) - 0.5) * cobbleH * 0.5);
            cCtx.stroke();
          }
          cCtx.restore();

          // Draw cobble in 3D Depth Map
          dCtx.save();
          dCtx.translate(cxPx, cyPx);
          dCtx.rotate(arcTangentAngle);

          const rings: ReadonlyArray<readonly [number, number]> = [
            [0.0, 92],
            [1.6, 154],
            [3.2, 204],
            [5.0, 238],
          ];
          for (const [inset, baseLum] of rings) {
            const lum = Math.max(42, Math.min(255, baseLum + cobbleHeightBias));
            dCtx.fillStyle = `rgb(${lum}, ${lum}, ${lum})`;
            traceOrganicCobblePath(dCtx, cobbleW, cobbleH, seed, inset);
            dCtx.fill();
          }

          // Riven stone crown & natural cleavage micro-pits in depth map
          const crownLum = Math.max(60, Math.min(255, 246 + cobbleHeightBias));
          dCtx.fillStyle = `rgb(${crownLum}, ${crownLum}, ${crownLum})`;
          dCtx.fillRect(
            rx + cobbleW * 0.22,
            ry + cobbleH * 0.24,
            Math.max(2, cobbleW * 0.52),
            Math.max(2, cobbleH * 0.36)
          );
          const pitLum = Math.max(40, Math.min(228, 174 + cobbleHeightBias));
          dCtx.fillStyle = `rgb(${pitLum}, ${pitLum}, ${pitLum})`;
          dCtx.fillRect(rx + 4, ry + 4, 3, 3);
          dCtx.fillRect(rx + cobbleW - 7, ry + cobbleH - 8, 3, 3);
          dCtx.restore();
        }
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
    bumpScale: 0.042,
    roughness: 0.84,
    metalness: 0.05,
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
   * 2D courtyard elevation gradient `getCourtyardGroundY(wx, wz)`, subtle organic stone-bed
   * micro-undulation (`Issue #1`), and continuous world-space repeating arched granite sett UVs.
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
          // Issue #3 ("This section seems to get a bit to narrow, look again at the arial shots" at `[5.699, -0.061, 13.178]`):
          // The Raised Patio Shrub Bank (`wx <= 5.15m`) extends South to `z_ew = +7.82m` (`getEastWingSouthWallZ(wx) + 5.20`)
          // and the Walled Grape-Vine Pergola (`wx > 5.15m`) extends South to `z_ew = +7.20m` (+ `0.44m` herb bed = `getEastWingSouthWallZ(wx) + 5.01`),
          // widening `courtyard.southEastCobbleApron` to a generous ~3.3m–3.9m cobbled lane matching the aerial photos!
          const minAllowedTerraceSouthZ =
            getEastWingSouthWallZ(wx) + (wx <= 5.15 ? 5.2 : 5.01);
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
        // Subtle natural hand-laid stone bed micro-undulation (±3.5mm) across top surface vertices (Issue #1)
        const isTopVertex = pos.getY(i) > 0;
        const microUndulation = isTopVertex
          ? Math.sin(wx * 1.9 + wz * 1.6) * 0.0022 + Math.cos(wx * 3.7 - wz * 3.1) * 0.0014
          : 0;
        pos.setY(i, pos.getY(i) + groundY + microUndulation);
        if (applyCobbleUVs && uv) {
          // Issue #1: Map onto the 2.3000944m x 2.92m (16 courses x 2 fan bands) organic hand-cleaved sett tile
          // with subtle low-frequency course wander so fan lines have natural hand-laid character!
          const organicWanderS = Math.sin(wz * 0.65 + wx * 0.25) * 0.035;
          const organicWanderU = Math.cos(wx * 0.55 - wz * 0.35) * 0.028;
          uv.setXY(
            i,
            (4.72875 - wx + organicWanderS) / 2.3000944,
            1 - (wz - (getEastWingSouthWallZ(wx) - 0.41) + organicWanderU) / 2.92
          );
        }
      }
      pos.needsUpdate = true;
      if (applyCobbleUVs && uv) {
        uv.needsUpdate = true;
      }
      geo.computeVertexNormals();
      geo.computeBoundingSphere();
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

  // Issue #3 ("This section seems to get a bit to narrow, look again at the arial shots" at `[5.699, -0.061, 13.178]`):
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
    geo.computeBoundingSphere();

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

  // 2. Continuation of the 3-row stone-sett drainage runner down the center of the widened South-East cobbled alleyway (Photo 10)
  addGradedDrainageChannelRun(
    'courtyard.drainageChannel.alleyway',
    -4.64,
    9.26,
    8.2,
    12.15,
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
  benchGroup.name = 'courtyard.gardenBench';
  const benchWorldPos = transformEastWingPoint(-11.65, 0, 3.02);
  const benchGroundY = getCourtyardGroundY(benchWorldPos.x, benchWorldPos.z);
  benchGroup.position.set(benchWorldPos.x, benchGroundY, benchWorldPos.z);
  benchGroup.rotation.y = MAIN_EAST_WING_ROTATION_Y;

  const weatheredTeakMat = new THREE.MeshStandardMaterial({
    color: 0x8c765c,
    roughness: 0.72,
    metalness: 0.03,
  });
  const weatheredTeakDarkMat = new THREE.MeshStandardMaterial({
    color: 0x75614a,
    roughness: 0.78,
    metalness: 0.03,
  });

  // Sculpted English Teak Garden Bench (width 1.28m, depth 0.52m, height 0.86m):
  // Front bullnose seat rail (`courtyard.gardenBench.seat`) + 6 individual cambered teak seat slats
  const benchSeat = new THREE.Mesh(
    new THREE.BoxGeometry(1.125, 0.038, 0.068),
    weatheredTeakMat
  );
  benchSeat.name = 'courtyard.gardenBench.seat';
  benchSeat.position.set(0, 0.432, 0.215);
  benchSeat.castShadow = true;
  benchSeat.receiveShadow = true;
  benchGroup.add(benchSeat);

  for (let slatIdx = 0; slatIdx < 5; slatIdx++) {
    const slatZ = 0.135 - slatIdx * 0.082;
    const seatSlat = new THREE.Mesh(
      new THREE.BoxGeometry(1.125, 0.024, 0.064),
      slatIdx % 2 === 0 ? weatheredTeakMat : weatheredTeakDarkMat
    );
    seatSlat.name = `courtyard.gardenBench.seat.slat.${slatIdx + 1}`;
    seatSlat.position.set(0, 0.436 - Math.sin((slatIdx / 4) * Math.PI) * 0.008, slatZ);
    seatSlat.castShadow = true;
    seatSlat.receiveShadow = true;
    benchGroup.add(seatSlat);
  }

  // Shaped top crest rail (`courtyard.gardenBench.backrest`), lower backrest rail & 15 vertical mortised spindles
  const benchBack = new THREE.Mesh(
    new THREE.BoxGeometry(1.125, 0.068, 0.038),
    weatheredTeakMat
  );
  benchBack.name = 'courtyard.gardenBench.backrest';
  benchBack.position.set(0, 0.835, -0.224);
  benchBack.rotation.x = -0.08;
  benchBack.castShadow = true;
  benchGroup.add(benchBack);

  const benchBackBottomRail = new THREE.Mesh(
    new THREE.BoxGeometry(1.125, 0.042, 0.034),
    weatheredTeakDarkMat
  );
  benchBackBottomRail.name = 'courtyard.gardenBench.backrest.bottomRail';
  benchBackBottomRail.position.set(0, 0.505, -0.198);
  benchBackBottomRail.rotation.x = -0.08;
  benchBackBottomRail.castShadow = true;
  benchGroup.add(benchBackBottomRail);

  for (let spIdx = 0; spIdx < 15; spIdx++) {
    const spX = -0.504 + spIdx * 0.072;
    const backSlat = new THREE.Mesh(
      new THREE.BoxGeometry(0.038, 0.288, 0.018),
      spIdx % 2 === 0 ? weatheredTeakMat : weatheredTeakDarkMat
    );
    backSlat.name = `courtyard.gardenBench.backrest.slat.${spIdx + 1}`;
    backSlat.position.set(spX, 0.668, -0.211);
    backSlat.rotation.x = -0.08;
    backSlat.castShadow = true;
    benchGroup.add(backSlat);
  }

  const benchCrossStretcher = new THREE.Mesh(
    new THREE.BoxGeometry(1.125, 0.036, 0.042),
    weatheredTeakDarkMat
  );
  benchCrossStretcher.name = 'courtyard.gardenBench.crossStretcher';
  benchCrossStretcher.position.set(0, 0.17, 0.005);
  benchCrossStretcher.castShadow = true;
  benchGroup.add(benchCrossStretcher);

  for (const sideX of [-0.59, 0.59]) {
    const sideKey = sideX < 0 ? 'west' : 'east';
    const frontLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.58, 0.055),
      weatheredTeakMat
    );
    frontLeg.name = `courtyard.gardenBench.frontLeg.${sideKey}`;
    frontLeg.position.set(sideX, 0.29, 0.23);
    frontLeg.castShadow = true;
    benchGroup.add(frontLeg);

    const rearLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.055, 0.86, 0.055),
      weatheredTeakMat
    );
    rearLeg.name = `courtyard.gardenBench.rearLeg.${sideKey}`;
    rearLeg.position.set(sideX, 0.43, -0.22);
    rearLeg.castShadow = true;
    benchGroup.add(rearLeg);

    const armRest = new THREE.Mesh(
      new THREE.BoxGeometry(0.068, 0.036, 0.525),
      weatheredTeakMat
    );
    armRest.name = `courtyard.gardenBench.armRest.${sideKey}`;
    armRest.position.set(sideX, 0.598, 0.01);
    armRest.castShadow = true;
    benchGroup.add(armRest);

    const seatSideRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.044, 0.052, 0.392),
      weatheredTeakDarkMat
    );
    seatSideRail.name = `courtyard.gardenBench.seatFrame.${sideKey}`;
    seatSideRail.position.set(sideX, 0.415, 0.005);
    seatSideRail.castShadow = true;
    benchGroup.add(seatSideRail);

    const lowSideStretcher = new THREE.Mesh(
      new THREE.BoxGeometry(0.038, 0.042, 0.392),
      weatheredTeakDarkMat
    );
    lowSideStretcher.name = `courtyard.gardenBench.sideStretcher.${sideKey}`;
    lowSideStretcher.position.set(sideX, 0.17, 0.005);
    lowSideStretcher.castShadow = true;
    benchGroup.add(lowSideStretcher);
  }
  scene.add(benchGroup);

  // -------------------------------------------------------------------------
  // High-LOD Clipped Boxwood / Standard Bay Laurel Topiary Trees in Flared Ribbed
  // Terracotta & Weathered Lead Planters along the Courtyard Walls (Photos 1, 3, 5 — Issue #4)
  // -------------------------------------------------------------------------
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
  const greyPlanterMat = new THREE.MeshStandardMaterial({
    color: 0x767a7e,
    roughness: 0.68,
    metalness: 0.08,
  });
  const planterSoilMat = new THREE.MeshStandardMaterial({
    color: 0x2b2017,
    roughness: 0.95,
    metalness: 0.01,
  });

  // Creates a flared, ribbed terracotta or lead planter pot geometry using LatheGeometry
  const createDetailedPlanterPotGeometry = (
    topR: number,
    height: number,
    isGrey: boolean
  ): THREE.BufferGeometry => {
    const baseR = topR * (isGrey ? 0.84 : 0.72);
    const profile: THREE.Vector2[] = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(baseR * 1.04, 0.0),
      new THREE.Vector2(baseR * 1.05, height * 0.08),
      new THREE.Vector2(baseR * 0.98, height * 0.11),
      new THREE.Vector2(baseR + (topR - baseR) * 0.34, height * 0.38),
      new THREE.Vector2(baseR + (topR - baseR) * 0.42, height * 0.42),
      new THREE.Vector2(baseR + (topR - baseR) * 0.38, height * 0.45),
      new THREE.Vector2(baseR + (topR - baseR) * 0.76, height * 0.76),
      new THREE.Vector2(topR * 1.02, height * 0.86),
      new THREE.Vector2(topR * 0.98, height * 0.90),
      new THREE.Vector2(topR * 1.07, height * 0.95),
      new THREE.Vector2(topR * 1.06, height),
      new THREE.Vector2(topR * 0.90, height),
      new THREE.Vector2(topR * 0.88, height * 0.88),
      new THREE.Vector2(0.0, height * 0.88),
    ];
    const geo = new THREE.LatheGeometry(profile, 24);
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    return geo;
  };

  // Creates an organically sculpted, multi-frequency botanical topiary crown mesh with tufted foliage clusters
  const createSculptedTopiaryCrownGeometry = (
    radius: number,
    seed: number,
    verticalScale = 1.06
  ): THREE.BufferGeometry => {
    const geo = new THREE.SphereGeometry(radius, 24, 18);
    const pos = geo.attributes.position;
    if (pos) {
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vy = pos.getY(i);
        const vz = pos.getZ(i);
        const len = Math.hypot(vx, vy, vz) || 1;
        const nx = vx / len;
        const ny = vy / len;
        const nz = vz / len;

        // Multi-scale botanical foliage tufting & subtle clipped topiary silhouette
        const tuftWave1 =
          Math.sin(nx * 6.5 + ny * 5.2 + seed * 1.7) *
          Math.cos(nz * 6.5 - ny * 4.8 + seed * 2.3);
        const tuftWave2 =
          Math.sin(nx * 13.0 - nz * 11.5 + seed * 3.1) *
          Math.cos(ny * 12.0 + nx * 9.5 - seed * 1.3);
        const tuftWave3 = Math.sin((nx + ny + nz) * 19.0 + seed * 5.7);

        // Gently fuller lower skirt and softly domed upper apex like a clipped boxwood/bay tree
        const clipProfile = 1.0 + (ny > 0 ? -0.06 * ny * ny : 0.05 * (1.0 - ny * ny));
        const radialDisp =
          clipProfile + 0.095 * tuftWave1 + 0.052 * tuftWave2 + 0.024 * tuftWave3;

        pos.setXYZ(
          i,
          vx * radialDisp,
          vy * radialDisp * verticalScale,
          vz * radialDisp
        );
      }
      pos.needsUpdate = true;
    }
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    return geo;
  };

  const pPlanter1 = transformEastWingPoint(-8.12, 0, 2.94);
  const pPlanter2 = transformEastWingPoint(-9.42, 0, 2.94);
  const pPlanter3 = transformEastWingPoint(-12.65, 0, 2.98);
  const pPlanter4 = transformEastWingPoint(-15.65, 0, 2.98);
  const pPlanter5 = transformEastWingPoint(-14.15, 0, 2.98);

  let planterSeq = 0;
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
    const planterId = ++planterSeq;
    const potGroundY = getCourtyardGroundY(px, pz);
    const potH = potR * 1.65;

    // 1. Flared & ribbed terracotta / weathered lead planter vessel
    const pot = new THREE.Mesh(
      createDetailedPlanterPotGeometry(potR, potH, isGrey),
      isGrey ? greyPlanterMat : terracottaPotMat
    );
    pot.name = `courtyard.planter.${planterId}.pot`;
    pot.position.set(px, potGroundY, pz);
    pot.castShadow = true;
    pot.receiveShadow = true;
    scene.add(pot);

    // Moulded rolled lip collar rim around top of pot
    const potRim = new THREE.Mesh(
      new THREE.TorusGeometry(potR * 1.02, potR * 0.055, 10, 24),
      isGrey ? greyPlanterMat : terracottaPotMat
    );
    potRim.name = `courtyard.planter.${planterId}.potRim`;
    potRim.position.set(px, potGroundY + potH - potR * 0.04, pz);
    potRim.rotation.x = Math.PI / 2;
    potRim.castShadow = true;
    potRim.receiveShadow = true;
    scene.add(potRim);

    // Rich dark compost/mulch soil bed inside the top of the planter
    const soilDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(potR * 0.89, potR * 0.86, 0.026, 20),
      planterSoilMat
    );
    soilDisc.name = `courtyard.planter.${planterId}.soil`;
    soilDisc.position.set(px, potGroundY + potH - 0.032, pz);
    soilDisc.receiveShadow = true;
    scene.add(soilDisc);

    // 2. Twisted woody standard bay/boxwood trunk & secondary braided stems rising from soil into canopy
    const crownCenterY = potGroundY + potH + crownR * 0.72;
    const trunkH = crownR * 0.78;
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(potR * 0.095, potR * 0.145, trunkH, 10),
      ivyStemMat
    );
    trunk.name = `courtyard.planter.${planterId}.trunk`;
    trunk.position.set(px, potGroundY + potH - 0.02 + trunkH * 0.5, pz);
    trunk.castShadow = true;
     trunk.receiveShadow = true;
    scene.add(trunk);

    for (let b = 0; b < 3; b++) {
      const bAngle = (b * Math.PI * 2) / 3 + planterId * 0.65;
      const branch = new THREE.Mesh(
        new THREE.CylinderGeometry(potR * 0.048, potR * 0.072, trunkH * 0.82, 8),
        ivyStemMat
      );
      branch.name = `courtyard.planter.${planterId}.trunk.branch.${b + 1}`;
      branch.position.set(
        px + Math.cos(bAngle) * potR * 0.08,
        potGroundY + potH + trunkH * 0.46,
        pz + Math.sin(bAngle) * potR * 0.08
      );
      branch.rotation.set(
        Math.sin(bAngle) * 0.22,
        0,
        -Math.cos(bAngle) * 0.22
      );
      branch.castShadow = true;
      scene.add(branch);
    }

    // 3. Primary sculpted organic topiary canopy (`courtyard.planter.${planterId}.shrub`)
    const shrub = new THREE.Mesh(
      createSculptedTopiaryCrownGeometry(crownR, planterId * 7.3, 1.04),
      ivyMidGreenMat
    );
    shrub.name = `courtyard.planter.${planterId}.shrub`;
    shrub.position.set(px, crownCenterY, pz);
    shrub.castShadow = true;
    shrub.receiveShadow = true;
    scene.add(shrub);

    // 4. Multi-layered overlapping botanical foliage sub-clusters (deep shaded lower lobes, mid-green lateral clusters, young sunlit upper shoot tips)
    const lobeSpecs: ReadonlyArray<
      readonly [number, number, number, number, THREE.Material]
    > = [
      // Lower shaded foliage skirt lobes
      [0.44, -0.22, 0.0, 0.52, ivyDarkGreenMat],
      [-0.38, -0.20, 0.28, 0.50, ivyDarkGreenMat],
      [-0.12, -0.21, -0.44, 0.51, ivyDarkGreenMat],
      // Mid-crown lush lateral clusters
      [0.32, 0.08, 0.34, 0.54, ivyMidGreenMat],
      [-0.36, 0.10, -0.28, 0.53, ivyMidGreenMat],
      [0.08, 0.12, -0.40, 0.48, ivyYoungGreenMat],
      // Upper sunlit apical crown cluster
      [0.04, 0.36, 0.05, 0.49, ivyYoungGreenMat],
    ];

    for (let k = 0; k < lobeSpecs.length; k++) {
      const [ox, oy, oz, radFrac, lobeMat] = lobeSpecs[k]!;
      const rotAngle = planterId * 1.15 + k * 0.88;
      const rx = ox * Math.cos(rotAngle) - oz * Math.sin(rotAngle);
      const rz = ox * Math.sin(rotAngle) + oz * Math.cos(rotAngle);
      const lobeMesh = new THREE.Mesh(
        createSculptedTopiaryCrownGeometry(
          crownR * radFrac,
          planterId * 19.1 + (k + 1) * 5.3,
          0.96
        ),
        lobeMat
      );
      lobeMesh.name = `courtyard.planter.${planterId}.shrub.lobe.${k + 1}`;
      lobeMesh.position.set(
        px + rx * crownR,
        crownCenterY + oy * crownR,
        pz + rz * crownR
      );
      lobeMesh.castShadow = true;
      lobeMesh.receiveShadow = true;
      scene.add(lobeMesh);
    }
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
    geo.computeBoundingSphere();
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
      stemMesh.name = `courtyard.climbingIvy.${seedOffset}.stem.${b + 1}`;
      stemMesh.geometry.computeBoundingSphere();
      stemMesh.userData.lodTier = 'high';
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
      leafSpray.name = `courtyard.climbingIvy.${seedOffset}.leafSpray.${i + 1}`;
      leafSpray.userData.lodTier = 'high';
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
      stemMesh.name = `outbuildings.climbingIvy.${seed}.stem.${b + 1}`;
      stemMesh.geometry.computeBoundingSphere();
      stemMesh.userData.lodTier = 'high';
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
      leafSpray.name = `outbuildings.climbingIvy.${seed}.leafSpray.${i + 1}`;
      leafSpray.userData.lodTier = 'high';
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

  // Deep shadow-groove material for crisp vertical tongue-and-groove V-joints on the West (-X) gate face
  const gateGrooveShadowMat = new THREE.MeshStandardMaterial({
    color: 0x161916,
    roughness: 0.92,
    metalness: 0.02,
  });

  // 3 Painted Timber Gate Posts along X = -22.33m (seated on the Y = -0.60m courtyard threshold)
  // Positioned with explicit clearances from the Study SW brick corner (Z = +11.77m) and
  // Outbuilding/GYM NW brick corner (Z = +16.00m) to eliminate all coplanar dithering / z-fighting:
  // - Post 1 (North): Z = +11.835m, widthZ = 0.10m (spans Z = 11.785..11.885m, 15mm South of Study wall at Z = 11.77m)
  // - Post 2 (Middle split post): Z = +12.96m, widthZ = 0.11m (spans Z = 12.905..13.015m)
  // - Post 3 (South): Z = +15.945m, widthZ = 0.10m (spans Z = 15.895..15.995m, 5mm North of Outbuilding wall at Z = 16.00m)
  const postH = gateH + 0.08;
  const postTopY = gateGroundY + postH;
  let gatePostSeq = 0;
  for (const [postZ, postDepthX, postWidthZ] of [
    [11.835, 0.12, 0.10],
    [12.96, 0.125, 0.11],
    [15.945, 0.12, 0.10],
  ] as const) {
    const postId = ++gatePostSeq;
    const post = new THREE.Mesh(
      new THREE.BoxGeometry(postDepthX, postH, postWidthZ),
      courtyardDoorMat
    );
    post.name = `courtyard.splitGate.post.${postId}`;
    post.position.set(gateX, gateGroundY + postH / 2, postZ);
    post.castShadow = true;
    post.receiveShadow = true;
    scene.add(post);

    // Moulded necking collar strictly above postTopY (zero volumetric overlap)
    const postCollar = new THREE.Mesh(
      new THREE.BoxGeometry(postDepthX + 0.018, 0.014, postWidthZ + 0.018),
      courtyardDoorRecessMat
    );
    postCollar.name = `courtyard.splitGate.post.${postId}.collar`;
    postCollar.position.set(gateX, postTopY + 0.008, postZ);
    postCollar.castShadow = true;
    scene.add(postCollar);

    // Weathered chamfered post cap strictly above necking collar (zero volumetric overlap)
    const postCap = new THREE.Mesh(
      new THREE.BoxGeometry(postDepthX + 0.034, 0.036, postWidthZ + 0.034),
      courtyardDoorRecessMat
    );
    postCap.name = `courtyard.splitGate.post.${postId}.cap`;
    postCap.position.set(gateX, postTopY + 0.034, postZ);
    postCap.castShadow = true;
    scene.add(postCap);
  }

  /**
   * Helper to build a gate leaf group along X = gateX (at gateGroundY = -0.60m):
   * - Rich architectural detail on the West (-X, driveway) front face (Issue #3):
   *   vertical tongue-and-groove (T&G) bevelled planks + recessed V-joint shadow grooves,
   *   chamfered bottom weather drip rail & top frieze moulding, heavy wrought-iron spear-ended
   *   strap hinges with knuckle barrels & dome studs, and forged wrought-iron ring latch & escutcheon.
   * - Framed ledged-and-braced horizontal rails + diagonal cross-braces on the East (+X, courtyard) side (Photo 3 & 7).
   * - All sub-meshes have strictly disjoint bounding volumes so there is zero dithering / z-fighting!
   */
  let gateLeafSeq = 0;
  const buildSplitGateLeafGroup = (
    minZ: number,
    maxZ: number,
    hingeSide: 'north' | 'south',
    hasLatchHandle: boolean,
    hasMeetingAstragal = false
  ): { readonly leafGroup: THREE.Group; readonly pivotZ: number } => {
    const leafW = maxZ - minZ;
    const centerZ = (minZ + maxZ) / 2;
    const gateLeafId = `courtyard.splitGate.leaf.${++gateLeafSeq}`;
    const leafGroup = new THREE.Group();
    leafGroup.name = gateLeafId;
    leafGroup.position.set(gateX, gateGroundY + gateH / 2 + 0.03, centerZ);

    const stileWidthZ = 0.09;
    const panelSpanZ = leafW - stileWidthZ * 2 - 0.002;

    // 1. Main vertical tongue-and-groove timber boarding core panel (strictly between North & South stiles)
    const boardPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.044, gateH - 0.004, panelSpanZ),
      courtyardDoorMat
    );
    boardPanel.name = `${gateLeafId}.boardPanel`;
    boardPanel.castShadow = true;
    boardPanel.receiveShadow = true;
    leafGroup.add(boardPanel);

    // 2. Outer vertical stiles framing North and South edges (x = -0.034..+0.042, stepping 12mm proud on West face)
    for (const sz of [-leafW / 2 + stileWidthZ / 2, leafW / 2 - stileWidthZ / 2]) {
      const stile = new THREE.Mesh(
        new THREE.BoxGeometry(0.076, gateH, stileWidthZ),
        courtyardDoorRecessMat
      );
      stile.name = `${gateLeafId}.stile.${sz < 0 ? 'north' : 'south'}`;
      stile.position.set(0.004, 0, sz);
      stile.castShadow = true;
      stile.receiveShadow = true;
      leafGroup.add(stile);
    }

    // 3. Top weather capping rail (strictly above y = +gateH / 2 so it never overlaps stiles or boardPanel)
    const topCap = new THREE.Mesh(
      new THREE.BoxGeometry(0.088, 0.052, leafW + 0.006),
      courtyardDoorRecessMat
    );
    topCap.name = `${gateLeafId}.topCap`;
    topCap.position.set(0.004, gateH / 2 + 0.027, 0);
    topCap.castShadow = true;
    topCap.receiveShadow = true;
    leafGroup.add(topCap);

    // 4. Front (West, -X driveway face) top frieze rail & bottom chamfered weather drip plinth rail
    const frontBottomRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.010, 0.076, panelSpanZ - 0.002),
      courtyardDoorRecessMat
    );
    frontBottomRail.name = `${gateLeafId}.frontBottomRail`;
    frontBottomRail.position.set(-0.0275, -gateH / 2 + 0.040, 0);
    frontBottomRail.castShadow = true;
    frontBottomRail.receiveShadow = true;
    leafGroup.add(frontBottomRail);

    const frontTopRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.010, 0.068, panelSpanZ - 0.002),
      courtyardDoorRecessMat
    );
    frontTopRail.name = `${gateLeafId}.frontTopRail`;
    frontTopRail.position.set(-0.0275, gateH / 2 - 0.036, 0);
    frontTopRail.castShadow = true;
    frontTopRail.receiveShadow = true;
    leafGroup.add(frontTopRail);

    // 5. Front (West, -X driveway face) Vertical T&G Bevelled Planks & V-Joint Shadow Grooves
    const tgHeight = gateH - 0.152;
    const tgCenterY = 0.004;
    const plankCount = Math.max(7, Math.round(panelSpanZ / 0.105));
    const plankPitchZ = panelSpanZ / plankCount;

    for (let p = 0; p < plankCount; p++) {
      const pz = -panelSpanZ / 2 + (p + 0.5) * plankPitchZ;
      const tgPlank = new THREE.Mesh(
        new THREE.BoxGeometry(0.004, tgHeight, plankPitchZ - 0.009),
        p % 2 === 0 ? courtyardDoorMat : courtyardDoorRecessMat
      );
      tgPlank.name = `${gateLeafId}.tgPlank.${p + 1}`;
      tgPlank.position.set(-0.0245, tgCenterY, pz);
      tgPlank.castShadow = true;
      tgPlank.receiveShadow = true;
      leafGroup.add(tgPlank);
    }

    for (let j = 1; j < plankCount; j++) {
      const gz = -panelSpanZ / 2 + j * plankPitchZ;
      const tgGroove = new THREE.Mesh(
        new THREE.BoxGeometry(0.003, tgHeight, 0.007),
        gateGrooveShadowMat
      );
      tgGroove.name = `${gateLeafId}.tgGroove.${j}`;
      tgGroove.position.set(-0.0242, tgCenterY, gz);
      leafGroup.add(tgGroove);
    }

    // 6. Front (West, -X driveway face) Heavy Black Wrought-Iron Strap Hinges (knuckle, pad, tapered strap, spear finial & coach bolts)
    const hingeDir = hingeSide === 'north' ? 1 : -1;
    const hingeEdgeZ = hingeSide === 'north' ? -leafW / 2 : leafW / 2;
    const strapLen = Math.min(0.46, leafW * 0.38);

    for (const [hPos, hy] of [
      ['lower', -gateH / 2 + 0.22],
      ['upper', gateH / 2 - 0.22],
    ] as const) {
      const knuckle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.015, 0.092, 12),
        castIronMat
      );
      knuckle.name = `${gateLeafId}.strapHinge.${hPos}.knuckle`;
      knuckle.position.set(-0.038, hy, hingeEdgeZ + hingeDir * 0.012);
      knuckle.castShadow = true;
      leafGroup.add(knuckle);

      const hingePad = new THREE.Mesh(
        new THREE.BoxGeometry(0.008, 0.105, 0.056),
        castIronMat
      );
      hingePad.name = `${gateLeafId}.strapHinge.${hPos}.pad`;
      hingePad.position.set(-0.0385, hy, hingeEdgeZ + hingeDir * 0.044);
      hingePad.castShadow = true;
      leafGroup.add(hingePad);

      const strapCenterZ = hingeEdgeZ + hingeDir * (0.074 + strapLen / 2);
      const hingeStrap = new THREE.Mesh(
        new THREE.BoxGeometry(0.007, 0.044, strapLen),
        castIronMat
      );
      hingeStrap.name = `${gateLeafId}.strapHinge.${hPos}.strap`;
      hingeStrap.position.set(-0.038, hy, strapCenterZ);
      hingeStrap.castShadow = true;
      leafGroup.add(hingeStrap);

      const finialZ = hingeEdgeZ + hingeDir * (0.074 + strapLen + 0.016);
      const finial = new THREE.Mesh(
        new THREE.BoxGeometry(0.007, 0.034, 0.034),
        castIronMat
      );
      finial.name = `${gateLeafId}.strapHinge.${hPos}.finial`;
      finial.position.set(-0.038, hy, finialZ);
      finial.rotation.x = Math.PI / 4;
      finial.castShadow = true;
      leafGroup.add(finial);

      for (let bIdx = 0; bIdx < 4; bIdx++) {
        const bz =
          hingeEdgeZ + hingeDir * (0.052 + bIdx * ((strapLen + 0.01) / 3.4));
        const bolt = new THREE.Mesh(
          new THREE.BoxGeometry(0.005, 0.014, 0.014),
          castIronMat
        );
        bolt.name = `${gateLeafId}.strapHinge.${hPos}.bolt.${bIdx + 1}`;
        bolt.position.set(-0.0435, hy, bz);
        leafGroup.add(bolt);
      }
    }

    // 7. Rear (East, +X courtyard side) top, middle, and bottom horizontal ledges (strictly East of boardPanel +0.022)
    for (const ly of [-gateH / 2 + 0.14, 0.0, gateH / 2 - 0.14]) {
      const ledge = new THREE.Mesh(
        new THREE.BoxGeometry(0.030, 0.11, panelSpanZ - 0.004),
        courtyardDoorRecessMat
      );
      ledge.name = `${gateLeafId}.ledge.${ly < -0.1 ? 'bottom' : ly > 0.1 ? 'top' : 'middle'}`;
      ledge.position.set(0.038, ly, 0);
      ledge.castShadow = true;
      ledge.receiveShadow = true;
      leafGroup.add(ledge);
    }

    // 8. Rear (East, +X courtyard side) lower and upper diagonal timber braces (strictly East of boardPanel +0.022 and clear of ledges)
    const braceSpanZ = panelSpanZ - 0.10;
    const braceSpanY = gateH / 2 - 0.34;
    const braceLen = Math.hypot(braceSpanZ, braceSpanY);
    const braceSign = hingeSide === 'north' ? 1 : -1;
    for (const by of [-gateH / 4, gateH / 4]) {
      const brace = new THREE.Mesh(
        new THREE.BoxGeometry(0.026, 0.088, braceLen),
        courtyardDoorRecessMat
      );
      brace.name = `${gateLeafId}.brace.${by < 0 ? 'lower' : 'upper'}`;
      brace.position.set(0.036, by, 0);
      brace.rotation.x = braceSign * Math.atan2(braceSpanY, braceSpanZ);
      brace.castShadow = true;
      brace.receiveShadow = true;
      leafGroup.add(brace);
    }

    // 9. Forged wrought-iron ring latch, spindle boss & keyhole escutcheon on the West (-X) driveway face
    if (hasLatchHandle) {
      const latchZ = hingeSide === 'north' ? leafW / 2 - 0.055 : -leafW / 2 + 0.055;
      const latchPlate = new THREE.Mesh(
        new THREE.BoxGeometry(0.008, 0.18, 0.058),
        castIronMat
      );
      latchPlate.name = `${gateLeafId}.latchPlate`;
      latchPlate.userData.lodTier = 'high';
      latchPlate.position.set(-0.0385, 0.04, latchZ);
      latchPlate.castShadow = true;
      leafGroup.add(latchPlate);

      const latchBoss = new THREE.Mesh(
        new THREE.CylinderGeometry(0.013, 0.015, 0.022, 12),
        castIronMat
      );
      latchBoss.name = `${gateLeafId}.latchBoss`;
      latchBoss.userData.lodTier = 'high';
      latchBoss.position.set(-0.048, 0.065, latchZ);
      latchBoss.rotation.z = Math.PI / 2;
      latchBoss.castShadow = true;
      leafGroup.add(latchBoss);

      const latchRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.036, 0.006, 10, 20),
        castIronMat
      );
      latchRing.name = `${gateLeafId}.latchRing`;
      latchRing.userData.lodTier = 'high';
      latchRing.position.set(-0.055, 0.03, latchZ);
      latchRing.rotation.y = Math.PI / 2;
      latchRing.castShadow = true;
      leafGroup.add(latchRing);

      const keyEscutcheon = new THREE.Mesh(
        new THREE.BoxGeometry(0.006, 0.044, 0.026),
        castIronMat
      );
      keyEscutcheon.name = `${gateLeafId}.keyEscutcheon`;
      keyEscutcheon.userData.lodTier = 'high';
      keyEscutcheon.position.set(-0.043, -0.09, latchZ);
      leafGroup.add(keyEscutcheon);
    }

    // 10. Center meeting stile vertical weather astragal strip on the West (-X) driveway face
    if (hasMeetingAstragal) {
      const astragal = new THREE.Mesh(
        new THREE.BoxGeometry(0.010, gateH - 0.01, 0.042),
        courtyardDoorRecessMat
      );
      astragal.name = `${gateLeafId}.meetingAstragal`;
      astragal.position.set(-0.040, 0, leafW / 2 - 0.008);
      astragal.castShadow = true;
      leafGroup.add(astragal);
    }

    scene.add(leafGroup);
    const pivotZ = hingeSide === 'north' ? -leafW / 2 : leafW / 2;
    return { leafGroup, pivotZ };
  };

  // 1. North Pedestrian Entrance Gate Leaf (Z = +11.89m..+12.895m, width 1.005m, hinged manually on North post, swinging inward +X into the courtyard)
  const pedGate = buildSplitGateLeafGroup(11.89, 12.895, 'north', true, false);
  interactions.registerHingedDoor(
    scene,
    pedGate.leafGroup,
    new THREE.Vector3(0, 0, pedGate.pivotZ),
    'y',
    Math.PI * 0.48,
    0
  );

  // 2. South Double-Leaf Motorized Car Entrance Gate (Z = +13.025m..+15.885m):
  //    - Left/North Car Gate Leaf (Z = +13.025m..+14.465m, hinged on the intermediate split post at Z = +12.96m)
  //    - Right/South Car Gate Leaf (Z = +14.495m..+15.885m, hinged on the South post at Z = +15.945m)
  //    Both leaves swing inward (+X, East) into the cobbled courtyard on KNX Bus (PA 1.1.22, GA 1/5/1 & 1/5/2)
  const northCarGate = buildSplitGateLeafGroup(13.025, 14.465, 'north', true, true);
  const southCarGate = buildSplitGateLeafGroup(14.495, 15.885, 'south', false, false);

  // Underground 24V KNX Gate Ram Boxes at the base of the two Car Gate Hinge Posts (Z = +13.06m and Z = +15.90m)
  let motorSeq = 0;
  for (const motorZ of [13.06, 15.9]) {
    const motorPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.03, 0.28),
      castIronMat
    );
    motorPlate.name = `courtyard.splitGate.motorPlate.${++motorSeq}`;
    motorPlate.userData.lodTier = 'high';
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
  // 8b. SANTORINI BLACK LAND ROVER DEFENDER 110 (L663 V8 CARPATHIAN EDITION) IN COURTYARD
  // -------------------------------------------------------------------------
  buildLandRoverDefender(scene, getCourtyardGroundY);

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
