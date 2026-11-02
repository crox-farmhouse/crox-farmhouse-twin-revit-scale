import * as THREE from 'three';
import { getZelligeCreamWallTileMaterial } from '../../../../../objects/sanitaryware/index.ts';
import {
  EAST_WING_BATHROOM_VAULT,
  getEastWingCeilingHeightAtZ,
} from '../../../structure/first-floor-materials.ts';
import type { createFirstFloorShellKit } from '../../../structure/first-floor-shell-kit.ts';

export interface FamilyBathroomPanellingKit {
  readonly floorTopY: number;
  readonly schoolHouseWhiteMat: THREE.Material;
  readonly wimborneWhitePanellingMat: THREE.Material;
  readonly tagUpperCutawayWall: ReturnType<typeof createFirstFloorShellKit>['tagUpperCutawayWall'];
}

interface ProfilePoint2D {
  readonly d: number;
  readonly y: number;
  readonly ao?: number;
}

interface BoardBandSpec {
  readonly uMin: number;
  readonly uMax: number;
  readonly yBands: readonly (readonly [number, number])[];
}

const NORTH_EXTERIOR_CUTAWAY = {
  axis: 'z' as const,
  coord: -2.64,
  minSpan: -13.05,
  maxSpan: -9.56,
  floor: 'first' as const,
};

/**
 * Shared boxed-dado projection dimensions & Option 1 shell planes for Room 17 (`familyBathroom`)
 * so sanitaryware, West vanity joinery, SE alcove shower, and trim align with zero gaps or clipping.
 */
export const ROOM17_BOXED_DADO = {
  /** Boxed T&G matchboard front face projection (`68mm` proud of structural plaster plane). */
  panelFaceD: 0.068,
  /** V-groove root projection (`63mm`, giving crisp `5mm`-deep `45°` V-grooves). */
  panelRootD: 0.063,
  /** Moulded bullnose dado shelf ledge projection (`82mm` total depth). */
  dadoShelfD: 0.082,
  /** Moulded bathroom skirting plinth projection (`80mm` total depth). */
  skirtingD: 0.08,
} as const;

export const ROOM17_OPTION1_PLANES = {
  westWallX: -12.81,
  eastWallX: -9.8,
  northWallZ: -2.5,
  southWallZ: 0.9,
  /** Outside West plaster face of the 120mm SE shower acoustic bulkhead (`X = -10.89..-10.77m`). */
  bulkheadOuterWestX: -10.89,
  /** Inside West structural face of the SE walk-in shower (`X = -10.77..-9.80m` = 970mm W). */
  showerWestX: -10.77,
  /** Stretched North glass screen/door line of SE walk-in shower (`Z = -0.68..+0.48m` = 1,160mm D). */
  showerNorthZ: -0.68,
  /** Inside South structural face of SE walk-in shower (120mm acoustic stud `Z = +0.48..+0.60m`). */
  showerSouthZ: 0.48,
  /** Passage mini-bar recess back structural face (`Z = +0.60..+1.05m` = 450mm D). */
  miniBarBackZ: 0.6,
  /** West vanity North cheek (`Z = -0.70..+0.90m` = 1,600mm W). */
  vanityNorthZ: -0.7,
  /** West vanity base front (`550mm` deep: `X = -12.81..-12.26m`). */
  vanityBaseEastX: -12.26,
  /** West vanity upper apothecary joinery front (`300mm` deep: `X = -12.81..-12.51m`). */
  vanityUpperEastX: -12.51,
  /** West vanity Carrara marble countertop top offset above `floorTopY` (`0.870m` -> `Y = 3.030m`). */
  vanityCounterHeight: 0.87,
  /** Door-54 (`opening = -11.735..-10.975m`, `center = -11.355m`, `width = 0.76m`) architrave bounds. */
  doorArchitraveButtZ: 0.882,
  doorWestArchitraveX: -11.819,
  doorEastArchitraveX: -10.891,
  doorHeadArchitraveOffsetY: 1.866 + 0.084,
  zelligeDepth: 0.009,
  plasterLiningDepth: 0.0075,
  zelligeUvScale: [0.66, 0.5] as const,
} as const;

export const SOUTH_SHOWER_NICHE_OPENING = {
  westX: -10.525,
  eastX: -10.045,
  bottomY: 2.9,
  topY: 3.66,
} as const;

export const WEST_SHOWER_NICHE_OPENING = {
  northZ: 0.08,
  southZ: 0.38,
  bottomY: 3.24,
  topY: 3.62,
} as const;

const DADO_SHELF_PROFILE: readonly ProfilePoint2D[] = [
  { d: 0.0, y: 0.006, ao: 0.88 },
  { d: 0.068, y: 0.006, ao: 0.85 },
  { d: 0.068, y: 0.0, ao: 0.85 },
  { d: 0.073, y: 0.0, ao: 0.9 },
  { d: 0.0775, y: 0.004, ao: 0.95 },
  { d: 0.081, y: 0.009, ao: 0.99 },
  { d: 0.082, y: 0.014, ao: 1.0 },
  { d: 0.082, y: 0.021, ao: 1.0 },
  { d: 0.08, y: 0.025, ao: 0.99 },
  { d: 0.0755, y: 0.0274, ao: 0.97 },
  { d: 0.009, y: 0.028, ao: 0.95 },
  { d: 0.0, y: 0.028, ao: 0.94 },
];

const BOXED_SKIRTING_PROFILE: readonly ProfilePoint2D[] = [
  { d: 0.0, y: 0.002, ao: 0.92 },
  { d: 0.08, y: 0.002, ao: 0.94 },
  { d: 0.08, y: 0.114, ao: 1.0 },
  { d: 0.078, y: 0.12, ao: 0.97 },
  { d: 0.074, y: 0.1255, ao: 0.9 },
  { d: 0.074, y: 0.1305, ao: 0.9 },
  { d: 0.0765, y: 0.1365, ao: 1.0 },
  { d: 0.0745, y: 0.1425, ao: 0.98 },
  { d: 0.07, y: 0.146, ao: 0.93 },
  { d: 0.068, y: 0.146, ao: 0.9 },
  { d: 0.068, y: 0.136, ao: 0.9 },
  { d: 0.0, y: 0.136, ao: 0.9 },
];

function computeWallPathMitrePoints(
  pts: readonly (readonly [number, number])[],
  offsetD: number
): [number, number][] {
  const n = pts.length;
  const normals: [number, number][] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = pts[i + 1]![0] - pts[i]![0];
    const dz = pts[i + 1]![1] - pts[i]![1];
    const len = Math.hypot(dx, dz) || 1;
    normals.push([-dz / len, dx / len]);
  }
  const out: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const [px, pz] = pts[i]!;
    if (i === 0) {
      const [nx, nz] = normals[0]!;
      out.push([px + nx * offsetD, pz + nz * offsetD]);
    } else if (i === n - 1) {
      const [nx, nz] = normals[n - 2]!;
      out.push([px + nx * offsetD, pz + nz * offsetD]);
    } else {
      const [n0x, n0z] = normals[i - 1]!;
      const [n1x, n1z] = normals[i]!;
      const bx = n0x + n1x;
      const bz = n0z + n1z;
      const denom = bx * n0x + bz * n0z;
      if (Math.abs(denom) < 1e-4) {
        out.push([px + n0x * offsetD, pz + n0z * offsetD]);
      } else {
        const scale = offsetD / denom;
        out.push([px + bx * scale, pz + bz * scale]);
      }
    }
  }
  return out;
}

function buildPolygonalWallLiningGeometry(
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  polygonUY: readonly (readonly [number, number])[],
  depth: number,
  options?: {
    readonly holes?: readonly (readonly (readonly [number, number])[])[];
    readonly uvScale?: readonly [number, number];
  }
): THREE.BufferGeometry {
  const dx = x1 - x0;
  const dz = z1 - z0;
  const len = Math.hypot(dx, dz);
  const tx = dx / len;
  const tz = dz / len;
  const nx = -tz;
  const nz = tx;

  const shape = new THREE.Shape();
  shape.moveTo(polygonUY[0]![0], polygonUY[0]![1]);
  for (let i = 1; i < polygonUY.length; i++) {
    shape.lineTo(polygonUY[i]![0], polygonUY[i]![1]);
  }
  shape.closePath();

  if (options?.holes) {
    for (const hPts of options.holes) {
      const holePath = new THREE.Path();
      holePath.moveTo(hPts[0]![0], hPts[0]![1]);
      for (let i = 1; i < hPts.length; i++) {
        holePath.lineTo(hPts[i]![0], hPts[i]![1]);
      }
      holePath.closePath();
      shape.holes.push(holePath);
    }
  }

  const rawGeo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  const geo = rawGeo.index ? rawGeo.toNonIndexed() : rawGeo;
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const norm = geo.getAttribute('normal') as THREE.BufferAttribute;
  const uv = geo.getAttribute('uv') as THREE.BufferAttribute;
  const [uvScaleU, uvScaleV] = options?.uvScale ?? [0.5, 0.5];

  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i);
    const v = pos.getY(i);
    const d = pos.getZ(i);
    pos.setXYZ(i, x0 + u * tx + d * nx, v, z0 + u * tz + d * nz);

    const nu = norm.getX(i);
    const nv = norm.getY(i);
    const nd = norm.getZ(i);
    norm.setXYZ(i, nu * tx + nd * nx, nv, nu * tz + nd * nz);

    uv.setXY(i, u * uvScaleU, v * uvScaleV);
  }
  pos.needsUpdate = true;
  norm.needsUpdate = true;
  uv.needsUpdate = true;
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

function buildSweptMitredMouldingGeometry(
  wallPoints: readonly (readonly [number, number])[],
  profile: readonly ProfilePoint2D[],
  baseY: number,
  options?: {
    readonly startMitreSign?: -1 | 0 | 1;
    readonly endMitreSign?: -1 | 0 | 1;
  }
): THREE.BufferGeometry {
  const numVerts = wallPoints.length;
  const startMitreSign = options?.startMitreSign ?? 0;
  const endMitreSign = options?.endMitreSign ?? 0;

  const rings: { x: number; y: number; z: number; ao: number }[][] = Array.from(
    { length: numVerts },
    () => []
  );

  const dx0 = wallPoints[1]![0] - wallPoints[0]![0];
  const dz0 = wallPoints[1]![1] - wallPoints[0]![1];
  const len0 = Math.hypot(dx0, dz0);
  const tx0 = dx0 / len0;
  const tz0 = dz0 / len0;

  const dxLast = wallPoints[numVerts - 1]![0] - wallPoints[numVerts - 2]![0];
  const dzLast = wallPoints[numVerts - 1]![1] - wallPoints[numVerts - 2]![1];
  const lenLast = Math.hypot(dxLast, dzLast);
  const txLast = dxLast / lenLast;
  const tzLast = dzLast / lenLast;

  for (let pIdx = 0; pIdx < profile.length; pIdx++) {
    const { d, y, ao = 1 } = profile[pIdx]!;
    const offsetPts = computeWallPathMitrePoints(wallPoints, d);
    for (let i = 0; i < numVerts; i++) {
      let [px, pz] = offsetPts[i]!;
      if (i === 0 && startMitreSign !== 0) {
        px += startMitreSign * d * tx0;
        pz += startMitreSign * d * tz0;
      }
      if (i === numVerts - 1 && endMitreSign !== 0) {
        px += endMitreSign * d * txLast;
        pz += endMitreSign * d * tzLast;
      }
      rings[i]!.push({ x: px, y: baseY + y, z: pz, ao });
    }
  }

  const positions: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];

  const pushVertColor = (ao: number): void => {
    colors.push(ao, ao * 0.996, ao * 0.988);
  };

  const pushTri = (
    a: { x: number; y: number; z: number; ao: number },
    b: { x: number; y: number; z: number; ao: number },
    c: { x: number; y: number; z: number; ao: number },
    ua: number,
    va: number,
    ub: number,
    vb: number,
    uc: number,
    vc: number
  ): void => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
    pushVertColor(a.ao);
    pushVertColor(b.ao);
    pushVertColor(c.ao);
    uvs.push(ua, va, ub, vb, uc, vc);
  };

  let runningS = 0;
  for (let i = 0; i < numVerts - 1; i++) {
    const segLen = Math.hypot(
      wallPoints[i + 1]![0] - wallPoints[i]![0],
      wallPoints[i + 1]![1] - wallPoints[i]![1]
    );
    const s0 = runningS;
    const s1 = runningS + segLen;
    runningS = s1;

    const r0 = rings[i]!;
    const r1 = rings[i + 1]!;
    for (let k = 0; k < profile.length; k++) {
      const kNext = (k + 1) % profile.length;
      const p00 = r0[k]!;
      const p10 = r1[k]!;
      const p11 = r1[kNext]!;
      const p01 = r0[kNext]!;
      pushTri(p00, p10, p11, s0, p00.y, s1, p10.y, s1, p11.y);
      pushTri(p00, p11, p01, s0, p00.y, s1, p11.y, s0, p01.y);
    }
  }

  const capRing = (
    ring: readonly { x: number; y: number; z: number; ao: number }[],
    flip: boolean
  ): void => {
    const anchor = ring[0]!;
    for (let k = 1; k < ring.length - 1; k++) {
      const b = ring[k]!;
      const c = ring[k + 1]!;
      if (flip) {
        pushTri(anchor, c, b, 0, anchor.y, 0.02, c.y, 0.02, b.y);
      } else {
        pushTri(anchor, b, c, 0, anchor.y, 0.02, b.y, 0.02, c.y);
      }
    }
  };
  if (startMitreSign === 0) capRing(rings[0]!, true);
  if (endMitreSign === 0) capRing(rings[numVerts - 1]!, false);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

function buildVerticalVGroovePanellingGeometry(
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  numBoards: number,
  bands: readonly BoardBandSpec[],
  options?: {
    readonly startMitreSign?: -1 | 0 | 1;
    readonly endMitreSign?: -1 | 0 | 1;
  }
): THREE.BufferGeometry {
  const dx = x1 - x0;
  const dz = z1 - z0;
  const totalLen = Math.hypot(dx, dz);
  const tx = dx / totalLen;
  const tz = dz / totalLen;
  const nx = -tz;
  const nz = tx;

  const faceD = ROOM17_BOXED_DADO.panelFaceD;
  const rootD = ROOM17_BOXED_DADO.panelRootD;
  const chamferW = 0.0042;
  const startMitreSign = options?.startMitreSign ?? 0;
  const endMitreSign = options?.endMitreSign ?? 0;

  const rawSteps: { u0: number; d0: number; u1: number; d1: number }[] = [];
  const boardW = totalLen / numBoards;
  for (let b = 0; b < numBoards; b++) {
    const bStart = b * boardW;
    const bEnd = (b + 1) * boardW;
    const leftChamfer = b === 0 && startMitreSign !== 0 ? 0.0018 : chamferW;
    const rightChamfer = b === numBoards - 1 && endMitreSign !== 0 ? 0.0018 : chamferW;
    const flatStart = bStart + leftChamfer;
    const flatEnd = bEnd - rightChamfer;
    if (leftChamfer > 1e-5) {
      rawSteps.push({ u0: bStart, d0: rootD, u1: flatStart, d1: faceD });
    }
    if (flatEnd > flatStart + 1e-5) {
      rawSteps.push({ u0: flatStart, d0: faceD, u1: flatEnd, d1: faceD });
    }
    if (rightChamfer > 1e-5) {
      rawSteps.push({ u0: flatEnd, d0: faceD, u1: bEnd, d1: rootD });
    }
  }

  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];

  const aoAtDepth = (d: number): number => {
    const t = Math.max(0, Math.min(1, (d - rootD) / (faceD - rootD)));
    return 0.84 + 0.16 * t;
  };
  const pushAo = (ao: number): void => {
    colors.push(ao, ao * 0.995, ao * 0.985);
  };

  const uAtEndpoint = (u: number, d: number): number => {
    if (u <= 1e-6 && startMitreSign !== 0) return u + startMitreSign * d;
    if (u >= totalLen - 1e-6 && endMitreSign !== 0) return u + endMitreSign * d;
    return u;
  };

  const toWorld = (u: number, y: number, d: number): [number, number, number] => {
    const uEff = uAtEndpoint(u, d);
    return [x0 + uEff * tx + d * nx, y, z0 + uEff * tz + d * nz];
  };

  const pushQuad = (
    p00: [number, number, number],
    p10: [number, number, number],
    p11: [number, number, number],
    p01: [number, number, number],
    fnx: number,
    fny: number,
    fnz: number,
    u0: number,
    v0: number,
    u1: number,
    v1: number,
    ao0 = 1,
    ao1 = 1
  ): void => {
    positions.push(
      p00[0], p00[1], p00[2],
      p10[0], p10[1], p10[2],
      p11[0], p11[1], p11[2],
      p00[0], p00[1], p00[2],
      p11[0], p11[1], p11[2],
      p01[0], p01[1], p01[2]
    );
    for (let k = 0; k < 6; k++) normals.push(fnx, fny, fnz);
    pushAo(ao0);
    pushAo(ao1);
    pushAo(ao1);
    pushAo(ao0);
    pushAo(ao1);
    pushAo(ao0);
    uvs.push(u0, v0, u1, v0, u1, v1, u0, v0, u1, v1, u0, v1);
  };

  const interpDepth = (
    step: { u0: number; d0: number; u1: number; d1: number },
    u: number
  ): number => {
    const span = step.u1 - step.u0;
    if (span <= 1e-7) return step.d0;
    return step.d0 + ((u - step.u0) / span) * (step.d1 - step.d0);
  };

  for (const band of bands) {
    for (const [yBot, yTop] of band.yBands) {
      for (const step of rawSteps) {
        const segU0 = Math.max(step.u0, band.uMin);
        const segU1 = Math.min(step.u1, band.uMax);
        if (segU1 - segU0 <= 1e-5) continue;

        const d0 = interpDepth(step, segU0);
        const d1 = interpDepth(step, segU1);
        const du = segU1 - segU0;
        const dd = d1 - d0;
        const hyp = Math.hypot(du, dd);
        const localUt = -dd / hyp;
        const localUn = du / hyp;
        const fnx = localUt * tx + localUn * nx;
        const fnz = localUt * tz + localUn * nz;

        const p00 = toWorld(segU0, yBot, d0);
        const p10 = toWorld(segU1, yBot, d1);
        const p11 = toWorld(segU1, yTop, d1);
        const p01 = toWorld(segU0, yTop, d0);
        pushQuad(p00, p10, p11, p01, fnx, 0, fnz, segU0, yBot, segU1, yTop, aoAtDepth(d0), aoAtDepth(d1));

        const b00 = toWorld(segU0, yBot, 0);
        const b10 = toWorld(segU1, yBot, 0);
        const b11 = toWorld(segU1, yTop, 0);
        const b01 = toWorld(segU0, yTop, 0);
        pushQuad(p01, p11, b11, b01, 0, 1, 0, segU0, 0, segU1, faceD);
        pushQuad(b00, b10, p10, p00, 0, -1, 0, segU0, 0, segU1, faceD);
      }

      if (band.uMin > 1e-5 || startMitreSign === 0) {
        const dLeft = band.uMin <= 1e-5 ? rootD : faceD;
        const f0 = toWorld(band.uMin, yBot, dLeft);
        const f1 = toWorld(band.uMin, yTop, dLeft);
        const w0 = toWorld(band.uMin, yBot, 0);
        const w1 = toWorld(band.uMin, yTop, 0);
        pushQuad(w0, f0, f1, w1, -tx, 0, -tz, 0, yBot, dLeft, yTop);
      }
      if (band.uMax < totalLen - 1e-5 || endMitreSign === 0) {
        const dRight = band.uMax >= totalLen - 1e-5 ? rootD : faceD;
        const f0 = toWorld(band.uMax, yBot, dRight);
        const f1 = toWorld(band.uMax, yTop, dRight);
        const w0 = toWorld(band.uMax, yBot, 0);
        const w1 = toWorld(band.uMax, yTop, 0);
        pushQuad(f0, w0, w1, f1, tx, 0, tz, 0, yBot, dRight, yTop);
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

/**
 * Builds Room 17 (`familyBathroom`) Option 1 wall linings, SE walk-in shower Zellige tiling,
 * and crisp `Wimborne White` `68mm` boxed V-groove T&G dado panelling (`top Y = 3.340m`):
 * - Full-height vertical handmade cream Zellige tiling (`Y = 2.198..4.664m`) on ALL 3 interior walls
 *   of the `970 × 1,160mm` SE walk-in shower (`West X = -10.77m`, `South Z = +0.48m`, `East X = -9.80m`),
 *   with clean apertures for the South 2-tier & West companion LED-lit recessed stud niches (East brick
 *   headboard wall stays 100% solid & un-chased).
 * - `School House White` (No. 291) matte upper plaster linings above the `3.340m` dado shelf across all
 *   dry walls (West North of vanity, North, East North of shower, SE bulkhead West/North nib, & South).
 * - `Wimborne White` (No. 239) `68mm` V-groove T&G panelling, `82mm` bullnose dado shelf, and `80mm`
 *   profiled skirting with 45° internal/external mitres, 45° self-returns, and 0.0mm flush butts into
 *   the West vanity dark-oak cheeks, `door-54` white architrave, and Living Brass shower channel.
 */
export function buildFamilyBathroomPanellingAndLinings(
  scene: THREE.Group,
  kit: FamilyBathroomPanellingKit
): void {
  const {
    floorTopY,
    schoolHouseWhiteMat,
    wimborneWhitePanellingMat,
    tagUpperCutawayWall,
  } = kit;

  const zelligeTileMat = getZelligeCreamWallTileMaterial();
  const { collarCeilingY, collarNorthZ, wallTopEmbed } = EAST_WING_BATHROOM_VAULT;
  const collarEmbedTopY = collarCeilingY + wallTopEmbed;
  const northEavesEmbedTopY = getEastWingCeilingHeightAtZ(-2.502) + wallTopEmbed;
  const southWallEmbedTopY = getEastWingCeilingHeightAtZ(ROOM17_OPTION1_PLANES.southWallZ) + wallTopEmbed;

  const panelBotY = floorTopY + 0.138;
  const dadoBaseY = floorTopY + 1.152;
  const panelTopY = dadoBaseY + 0.006;
  const liningBotY = dadoBaseY + 0.006;
  const showerRimTopY = floorTopY + 0.038;
  const doorArchitraveTopY = floorTopY + ROOM17_OPTION1_PLANES.doorHeadArchitraveOffsetY;

  const addShellMesh = (
    name: string,
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    northCutaway = false
  ): THREE.Mesh => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.userData.isArchitecturalShell = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (northCutaway) tagUpperCutawayWall(mesh, NORTH_EXTERIOR_CUTAWAY);
    scene.add(mesh);
    return mesh;
  };

  // =========================================================================
  // 1. SE WALK-IN ALCOVE SHOWER FULL-HEIGHT VERTICAL ZELLIGE TILING (3 WALLS)
  // =========================================================================
  // 1A. West inner shower stud wall (X = -10.77m facing +X East, Z = +0.48m -> -0.68m)
  const shSouthZ = ROOM17_OPTION1_PLANES.showerSouthZ;
  const shNorthZ = ROOM17_OPTION1_PLANES.showerNorthZ;
  const shDepthSpan = shSouthZ - shNorthZ;
  addShellMesh(
    'familyBathroom.showerWestWallTiling',
    buildPolygonalWallLiningGeometry(
      ROOM17_OPTION1_PLANES.showerWestX,
      shSouthZ,
      ROOM17_OPTION1_PLANES.showerWestX,
      shNorthZ,
      [
        [0, showerRimTopY],
        [shDepthSpan, showerRimTopY],
        [shDepthSpan, collarEmbedTopY],
        [0, collarEmbedTopY],
      ],
      ROOM17_OPTION1_PLANES.zelligeDepth,
      {
        holes: [
          [
            [shSouthZ - WEST_SHOWER_NICHE_OPENING.southZ, WEST_SHOWER_NICHE_OPENING.bottomY],
            [shSouthZ - WEST_SHOWER_NICHE_OPENING.northZ, WEST_SHOWER_NICHE_OPENING.bottomY],
            [shSouthZ - WEST_SHOWER_NICHE_OPENING.northZ, WEST_SHOWER_NICHE_OPENING.topY],
            [shSouthZ - WEST_SHOWER_NICHE_OPENING.southZ, WEST_SHOWER_NICHE_OPENING.topY],
          ],
        ],
        uvScale: ROOM17_OPTION1_PLANES.zelligeUvScale,
      }
    ),
    zelligeTileMat
  );

  // 1B. South back shower stud wall (Z = +0.48m facing -Z North, X = -9.80m -> -10.77m)
  const shEastX = ROOM17_OPTION1_PLANES.eastWallX;
  const shWestX = ROOM17_OPTION1_PLANES.showerWestX;
  const shWidthSpan = shEastX - shWestX;
  addShellMesh(
    'familyBathroom.showerSouthWallTiling',
    buildPolygonalWallLiningGeometry(
      shEastX,
      shSouthZ,
      shWestX,
      shSouthZ,
      [
        [0, showerRimTopY],
        [shWidthSpan, showerRimTopY],
        [shWidthSpan, collarEmbedTopY],
        [0, collarEmbedTopY],
      ],
      ROOM17_OPTION1_PLANES.zelligeDepth,
      {
        holes: [
          [
            [shEastX - SOUTH_SHOWER_NICHE_OPENING.eastX, SOUTH_SHOWER_NICHE_OPENING.bottomY],
            [shEastX - SOUTH_SHOWER_NICHE_OPENING.westX, SOUTH_SHOWER_NICHE_OPENING.bottomY],
            [shEastX - SOUTH_SHOWER_NICHE_OPENING.westX, SOUTH_SHOWER_NICHE_OPENING.topY],
            [shEastX - SOUTH_SHOWER_NICHE_OPENING.eastX, SOUTH_SHOWER_NICHE_OPENING.topY],
          ],
        ],
        uvScale: ROOM17_OPTION1_PLANES.zelligeUvScale,
      }
    ),
    zelligeTileMat
  );

  // 1C. East solid masonry shower wall (X = -9.80m facing -X West, Z = -0.68m -> +0.48m — 100% un-chased!)
  addShellMesh(
    'familyBathroom.showerEastWallTiling',
    buildPolygonalWallLiningGeometry(
      shEastX,
      shNorthZ,
      shEastX,
      shSouthZ,
      [
        [0, showerRimTopY],
        [shDepthSpan, showerRimTopY],
        [shDepthSpan, collarEmbedTopY],
        [0, collarEmbedTopY],
      ],
      ROOM17_OPTION1_PLANES.zelligeDepth,
      {
        uvScale: ROOM17_OPTION1_PLANES.zelligeUvScale,
      }
    ),
    zelligeTileMat
  );

  // =========================================================================
  // 2. DRY-ZONE SCHOOL HOUSE WHITE UPPER PLASTER LININGS (ABOVE 3.34m DADO)
  // =========================================================================
  const westDrySouthZ = ROOM17_OPTION1_PLANES.vanityNorthZ;
  const westDryNorthZ = -2.502;
  addShellMesh(
    'familyBathroom.westWallUpperLining',
    buildPolygonalWallLiningGeometry(
      ROOM17_OPTION1_PLANES.westWallX,
      westDrySouthZ,
      ROOM17_OPTION1_PLANES.westWallX,
      westDryNorthZ,
      [
        [0, liningBotY],
        [westDrySouthZ - westDryNorthZ, liningBotY],
        [westDrySouthZ - westDryNorthZ, northEavesEmbedTopY],
        [westDrySouthZ - collarNorthZ, collarEmbedTopY],
        [0, collarEmbedTopY],
      ],
      ROOM17_OPTION1_PLANES.plasterLiningDepth
    ),
    schoolHouseWhiteMat
  );

  addShellMesh(
    'familyBathroom.northWallUpperLining',
    buildPolygonalWallLiningGeometry(
      ROOM17_OPTION1_PLANES.westWallX,
      ROOM17_OPTION1_PLANES.northWallZ,
      -9.798,
      ROOM17_OPTION1_PLANES.northWallZ,
      [
        [0, liningBotY],
        [-9.798 - ROOM17_OPTION1_PLANES.westWallX, liningBotY],
        [-9.798 - ROOM17_OPTION1_PLANES.westWallX, getEastWingCeilingHeightAtZ(ROOM17_OPTION1_PLANES.northWallZ) + wallTopEmbed],
        [0, getEastWingCeilingHeightAtZ(ROOM17_OPTION1_PLANES.northWallZ) + wallTopEmbed],
      ],
      0.006
    ),
    schoolHouseWhiteMat,
    true
  );

  const eastDryEndZ = shNorthZ;
  addShellMesh(
    'familyBathroom.eastWallUpperLining',
    buildPolygonalWallLiningGeometry(
      ROOM17_OPTION1_PLANES.eastWallX,
      westDryNorthZ,
      ROOM17_OPTION1_PLANES.eastWallX,
      eastDryEndZ,
      [
        [0, liningBotY],
        [eastDryEndZ - westDryNorthZ, liningBotY],
        [eastDryEndZ - westDryNorthZ, collarEmbedTopY],
        [collarNorthZ - westDryNorthZ, collarEmbedTopY],
        [0, northEavesEmbedTopY],
      ],
      ROOM17_OPTION1_PLANES.plasterLiningDepth
    ),
    schoolHouseWhiteMat
  );

  // Outside West face & 120mm North nib of the SE shower bulkhead
  addShellMesh(
    'familyBathroom.bulkheadWestUpperLining',
    buildPolygonalWallLiningGeometry(
      ROOM17_OPTION1_PLANES.bulkheadOuterWestX,
      shNorthZ,
      ROOM17_OPTION1_PLANES.bulkheadOuterWestX,
      ROOM17_OPTION1_PLANES.southWallZ,
      [
        [0, liningBotY],
        [ROOM17_OPTION1_PLANES.southWallZ - shNorthZ, liningBotY],
        [ROOM17_OPTION1_PLANES.southWallZ - shNorthZ, collarEmbedTopY],
        [0, collarEmbedTopY],
      ],
      ROOM17_OPTION1_PLANES.plasterLiningDepth
    ),
    schoolHouseWhiteMat
  );

  addShellMesh(
    'familyBathroom.bulkheadNorthNibUpperLining',
    buildPolygonalWallLiningGeometry(
      ROOM17_OPTION1_PLANES.showerWestX,
      shNorthZ,
      ROOM17_OPTION1_PLANES.bulkheadOuterWestX - ROOM17_OPTION1_PLANES.plasterLiningDepth,
      shNorthZ,
      [
        [0, liningBotY],
        [ROOM17_OPTION1_PLANES.showerWestX - (ROOM17_OPTION1_PLANES.bulkheadOuterWestX - ROOM17_OPTION1_PLANES.plasterLiningDepth), liningBotY],
        [ROOM17_OPTION1_PLANES.showerWestX - (ROOM17_OPTION1_PLANES.bulkheadOuterWestX - ROOM17_OPTION1_PLANES.plasterLiningDepth), collarEmbedTopY],
        [0, collarEmbedTopY],
      ],
      ROOM17_OPTION1_PLANES.plasterLiningDepth
    ),
    schoolHouseWhiteMat
  );

  // South dry wall upper lining framing Door-54 and stopping cleanly against the 300mm upper vanity cheek (-12.51m)
  const southEastX = ROOM17_OPTION1_PLANES.bulkheadOuterWestX;
  const southWestStopX = ROOM17_OPTION1_PLANES.vanityUpperEastX;
  addShellMesh(
    'familyBathroom.southWallUpperLining',
    buildPolygonalWallLiningGeometry(
      southEastX,
      ROOM17_OPTION1_PLANES.southWallZ,
      southWestStopX,
      ROOM17_OPTION1_PLANES.southWallZ,
      [
        [0, doorArchitraveTopY],
        [southEastX - ROOM17_OPTION1_PLANES.doorWestArchitraveX, doorArchitraveTopY],
        [southEastX - ROOM17_OPTION1_PLANES.doorWestArchitraveX, liningBotY],
        [southEastX - southWestStopX, liningBotY],
        [southEastX - southWestStopX, southWallEmbedTopY],
        [0, southWallEmbedTopY],
      ],
      ROOM17_OPTION1_PLANES.plasterLiningDepth
    ),
    schoolHouseWhiteMat
  );

  // Also fill the narrow strip between Door-54 West architrave (-11.819m) and South-West returned panelling (-11.825m)
  // down to floorTopY so bare plaster never peeks next to the door casing.
  addShellMesh(
    'familyBathroom.southDoorWestMarginLining',
    buildPolygonalWallLiningGeometry(
      ROOM17_OPTION1_PLANES.doorWestArchitraveX,
      ROOM17_OPTION1_PLANES.southWallZ,
      -11.91,
      ROOM17_OPTION1_PLANES.southWallZ,
      [
        [0, floorTopY],
        [-11.819 - -11.91, floorTopY],
        [-11.819 - -11.91, liningBotY],
        [0, liningBotY],
      ],
      ROOM17_OPTION1_PLANES.plasterLiningDepth
    ),
    schoolHouseWhiteMat
  );

  // =========================================================================
  // 3. WIMBORNE WHITE 68mm BOXED V-GROOVE T&G PANELLING
  // =========================================================================
  // 3A. West dry section (Z = -0.70m -> -2.50m): butts 0.0mm squarely into vanity North cheek at -0.70m, 45°-mitres NW corner
  const westPanelSpan = ROOM17_OPTION1_PLANES.vanityNorthZ - ROOM17_OPTION1_PLANES.northWallZ;
  addShellMesh(
    'familyBathroom.westPanelling',
    buildVerticalVGroovePanellingGeometry(
      ROOM17_OPTION1_PLANES.westWallX,
      ROOM17_OPTION1_PLANES.vanityNorthZ,
      ROOM17_OPTION1_PLANES.westWallX,
      ROOM17_OPTION1_PLANES.northWallZ,
      19,
      [{ uMin: 0, uMax: westPanelSpan, yBands: [[panelBotY, panelTopY]] }],
      { startMitreSign: 0, endMitreSign: -1 }
    ),
    wimborneWhitePanellingMat
  );

  // 3B. North wall (X = -12.81m -> -9.80m): 45°-mitres at both NW and NE corners, notched under Win 1763678
  const northSpan = ROOM17_OPTION1_PLANES.eastWallX - ROOM17_OPTION1_PLANES.westWallX;
  const winLeftU = -11.969 - ROOM17_OPTION1_PLANES.westWallX;
  const winRightU = -10.731 - ROOM17_OPTION1_PLANES.westWallX;
  addShellMesh(
    'familyBathroom.northPanelling',
    buildVerticalVGroovePanellingGeometry(
      ROOM17_OPTION1_PLANES.westWallX,
      ROOM17_OPTION1_PLANES.northWallZ,
      ROOM17_OPTION1_PLANES.eastWallX,
      ROOM17_OPTION1_PLANES.northWallZ,
      30,
      [
        { uMin: 0, uMax: winLeftU, yBands: [[panelBotY, panelTopY]] },
        { uMin: winLeftU, uMax: winRightU, yBands: [[panelBotY, 2.322]] },
        { uMin: winRightU, uMax: northSpan, yBands: [[panelBotY, panelTopY]] },
      ],
      { startMitreSign: 1, endMitreSign: -1 }
    ),
    wimborneWhitePanellingMat,
    true
  );

  const northSillGeo = new THREE.BoxGeometry(1.296, 0.024, ROOM17_BOXED_DADO.dadoShelfD + 0.012);
  northSillGeo.computeBoundingSphere();
  addShellMesh(
    'familyBathroom.northWindowBoxedSill',
    northSillGeo,
    wimborneWhitePanellingMat,
    true
  ).position.set(
    -11.35,
    2.33,
    ROOM17_OPTION1_PLANES.northWallZ + (ROOM17_BOXED_DADO.dadoShelfD - 0.012) * 0.5
  );

  // 3C. East dry section (Z = -2.50m -> -0.692m): 45°-mitres NE corner and finishes cleanly with returned end-stile at -0.692m
  const eastPanelEndZ = -0.692;
  const eastPanelSpan = eastPanelEndZ - ROOM17_OPTION1_PLANES.northWallZ;
  addShellMesh(
    'familyBathroom.eastPanelling',
    buildVerticalVGroovePanellingGeometry(
      ROOM17_OPTION1_PLANES.eastWallX,
      ROOM17_OPTION1_PLANES.northWallZ,
      ROOM17_OPTION1_PLANES.eastWallX,
      eastPanelEndZ,
      19,
      [{ uMin: 0, uMax: eastPanelSpan, yBands: [[panelBotY, panelTopY]] }],
      { startMitreSign: 1, endMitreSign: 0 }
    ),
    wimborneWhitePanellingMat
  );

  // 3D. SE Shower Bulkhead outside North nib + West face (45° external mitre at [-10.89, -0.68], 0.0mm butt at Door-54 +0.882m)
  const nibStartX = -10.785;
  const nibSpan = nibStartX - ROOM17_OPTION1_PLANES.bulkheadOuterWestX;
  addShellMesh(
    'familyBathroom.bulkheadNorthNibPanelling',
    buildVerticalVGroovePanellingGeometry(
      nibStartX,
      shNorthZ,
      ROOM17_OPTION1_PLANES.bulkheadOuterWestX,
      shNorthZ,
      2,
      [{ uMin: 0, uMax: nibSpan, yBands: [[panelBotY, panelTopY]] }],
      { startMitreSign: 0, endMitreSign: 1 }
    ),
    wimborneWhitePanellingMat
  );

  const bulkheadWestSpan = ROOM17_OPTION1_PLANES.doorArchitraveButtZ - shNorthZ;
  addShellMesh(
    'familyBathroom.bulkheadWestPanelling',
    buildVerticalVGroovePanellingGeometry(
      ROOM17_OPTION1_PLANES.bulkheadOuterWestX,
      shNorthZ,
      ROOM17_OPTION1_PLANES.bulkheadOuterWestX,
      ROOM17_OPTION1_PLANES.doorArchitraveButtZ,
      16,
      [{ uMin: 0, uMax: bulkheadWestSpan, yBands: [[panelBotY, panelTopY]] }],
      { startMitreSign: -1, endMitreSign: 0 }
    ),
    wimborneWhitePanellingMat
  );

  // 3E. South dry wall West of Door-54 (X = -11.825m -> -12.26m plumb with the dark-oak vanity front plane)
  const swPanelStartX = -11.825;
  const swBaseU = swPanelStartX - ROOM17_OPTION1_PLANES.vanityBaseEastX;
  addShellMesh(
    'familyBathroom.southWestPanelling',
    buildVerticalVGroovePanellingGeometry(
      swPanelStartX,
      ROOM17_OPTION1_PLANES.southWallZ,
      ROOM17_OPTION1_PLANES.vanityBaseEastX,
      ROOM17_OPTION1_PLANES.southWallZ,
      5,
      [{ uMin: 0, uMax: swBaseU, yBands: [[panelBotY, panelTopY]] }],
      { startMitreSign: 0, endMitreSign: 0 }
    ),
    wimborneWhitePanellingMat
  );

  // =========================================================================
  // 4. 82mm BULLNOSE DADO SHELF RAILS & 80mm PROFILE SKIRTINGS (ZERO STUMPS)
  // =========================================================================
  // Continuous West -> North -> East U-run with 45° internal mitres and a 45° self-return into East wall at Z = -0.690m
  const eastReturnCornerZ = -0.69 - ROOM17_BOXED_DADO.dadoShelfD; // -0.772m -> outer bullnose lands at Z = -0.690m
  addShellMesh(
    'familyBathroom.perimeterDadoRail',
    buildSweptMitredMouldingGeometry(
      [
        [ROOM17_OPTION1_PLANES.westWallX, ROOM17_OPTION1_PLANES.vanityNorthZ],
        [ROOM17_OPTION1_PLANES.westWallX, ROOM17_OPTION1_PLANES.northWallZ],
        [ROOM17_OPTION1_PLANES.eastWallX, ROOM17_OPTION1_PLANES.northWallZ],
        [ROOM17_OPTION1_PLANES.eastWallX, eastReturnCornerZ],
        [ROOM17_OPTION1_PLANES.eastWallX + 0.002, eastReturnCornerZ],
      ],
      DADO_SHELF_PROFILE,
      dadoBaseY,
      { startMitreSign: 0, endMitreSign: 0 }
    ),
    wimborneWhitePanellingMat,
    true
  );

  const eastSkirtReturnCornerZ = -0.69 - ROOM17_BOXED_DADO.skirtingD;
  addShellMesh(
    'familyBathroom.perimeterSkirting',
    buildSweptMitredMouldingGeometry(
      [
        [ROOM17_OPTION1_PLANES.westWallX, ROOM17_OPTION1_PLANES.vanityNorthZ],
        [ROOM17_OPTION1_PLANES.westWallX, ROOM17_OPTION1_PLANES.northWallZ],
        [ROOM17_OPTION1_PLANES.eastWallX, ROOM17_OPTION1_PLANES.northWallZ],
        [ROOM17_OPTION1_PLANES.eastWallX, eastSkirtReturnCornerZ],
        [ROOM17_OPTION1_PLANES.eastWallX + 0.002, eastSkirtReturnCornerZ],
      ],
      BOXED_SKIRTING_PROFILE,
      floorTopY,
      { startMitreSign: 0, endMitreSign: 0 }
    ),
    wimborneWhitePanellingMat,
    true
  );

  // Bulkhead North nib -> 45° external mitre -> Bulkhead West face -> 0.0mm butt into Door-54 white architrave
  addShellMesh(
    'familyBathroom.bulkheadDadoRail',
    buildSweptMitredMouldingGeometry(
      [
        [nibStartX, shNorthZ],
        [ROOM17_OPTION1_PLANES.bulkheadOuterWestX, shNorthZ],
        [ROOM17_OPTION1_PLANES.bulkheadOuterWestX, ROOM17_OPTION1_PLANES.doorArchitraveButtZ],
      ],
      DADO_SHELF_PROFILE,
      dadoBaseY,
      { startMitreSign: 0, endMitreSign: 0 }
    ),
    wimborneWhitePanellingMat
  );

  addShellMesh(
    'familyBathroom.bulkheadSkirting',
    buildSweptMitredMouldingGeometry(
      [
        [nibStartX, shNorthZ],
        [ROOM17_OPTION1_PLANES.bulkheadOuterWestX, shNorthZ],
        [ROOM17_OPTION1_PLANES.bulkheadOuterWestX, ROOM17_OPTION1_PLANES.doorArchitraveButtZ],
      ],
      BOXED_SKIRTING_PROFILE,
      floorTopY,
      { startMitreSign: 0, endMitreSign: 0 }
    ),
    wimborneWhitePanellingMat
  );

  // South-West dado rail & skirting (45° self-return next to Door-54 West architrave -> 0.0mm butt into dark-oak vanity cheeks)
  const swDadoReturnCornerX = swPanelStartX - ROOM17_BOXED_DADO.dadoShelfD;
  const swDadoVanityReturnX = ROOM17_OPTION1_PLANES.vanityBaseEastX + ROOM17_BOXED_DADO.dadoShelfD;
  addShellMesh(
    'familyBathroom.southWestDadoRail',
    buildSweptMitredMouldingGeometry(
      [
        [swDadoReturnCornerX, ROOM17_OPTION1_PLANES.southWallZ + 0.002],
        [swDadoReturnCornerX, ROOM17_OPTION1_PLANES.southWallZ],
        [swDadoVanityReturnX, ROOM17_OPTION1_PLANES.southWallZ],
        [swDadoVanityReturnX, ROOM17_OPTION1_PLANES.southWallZ + 0.002],
      ],
      DADO_SHELF_PROFILE,
      dadoBaseY,
      { startMitreSign: 0, endMitreSign: 0 }
    ),
    wimborneWhitePanellingMat
  );

  const swSkirtReturnCornerX = swPanelStartX - ROOM17_BOXED_DADO.skirtingD;
  addShellMesh(
    'familyBathroom.southWestSkirting',
    buildSweptMitredMouldingGeometry(
      [
        [swSkirtReturnCornerX, ROOM17_OPTION1_PLANES.southWallZ + 0.002],
        [swSkirtReturnCornerX, ROOM17_OPTION1_PLANES.southWallZ],
        [ROOM17_OPTION1_PLANES.vanityBaseEastX, ROOM17_OPTION1_PLANES.southWallZ],
      ],
      BOXED_SKIRTING_PROFILE,
      floorTopY,
      { startMitreSign: 0, endMitreSign: 0 }
    ),
    wimborneWhitePanellingMat
  );
}
