import * as THREE from 'three';
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

const NORTH_EXTERIOR_CUTAWAY = {
  axis: 'z' as const,
  coord: -2.64,
  minSpan: -12.81,
  maxSpan: -9.56,
  floor: 'first' as const,
};

/**
 * Builds a watertight, proper-handed (`det = +1`) polygonal wall lining slab along `(x0, z0) -> (x1, z1)`
 * with room-inward normal `n = (-tz, tx)` and thickness `depth` (`0 .. depth`).
 */
function buildPolygonalWallLiningGeometry(
  x0: number,
  z0: number,
  x1: number,
  z1: number,
  polygonUY: readonly (readonly [number, number])[],
  depth: number
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

  const rawGeo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: false,
  });
  const geo = rawGeo.index ? rawGeo.toNonIndexed() : rawGeo;
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const norm = geo.getAttribute('normal') as THREE.BufferAttribute;
  const uv = geo.getAttribute('uv') as THREE.BufferAttribute;

  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i);
    const v = pos.getY(i);
    const d = pos.getZ(i);
    pos.setXYZ(i, x0 + u * tx + d * nx, v, z0 + u * tz + d * nz);

    const nu = norm.getX(i);
    const nv = norm.getY(i);
    const nd = norm.getZ(i);
    norm.setXYZ(i, nu * tx + nd * nx, nv, nu * tz + nd * nz);

    uv.setXY(i, u * 0.5, v * 0.5);
  }
  pos.needsUpdate = true;
  norm.needsUpdate = true;
  uv.needsUpdate = true;
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

/**
 * Sweeps a closed 2D moulding cross-section `(d, y)` (ordered bottom -> front -> top -> back)
 * along a 2D wall polyline `(x, z)` with exact 45°-mitred internal/external corners and optional
 * start/end corner mitres (`startMitreSign` / `endMitreSign`: `+1` or `-1` for split 45° corners, `0` for square cap).
 */
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

  // First & last tangent vectors for optional split-corner 45° mitres
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

  // End caps when square-butted (`mitreSign === 0`)
  const capRing = (ring: readonly { x: number; y: number; z: number; ao: number }[], flip: boolean): void => {
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
  if (startMitreSign === 0) {
    capRing(rings[0]!, true);
  }
  if (endMitreSign === 0) {
    capRing(rings[numVerts - 1]!, false);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

interface BoardBandSpec {
  readonly uMin: number;
  readonly uMax: number;
  readonly yBands: readonly (readonly [number, number])[];
}

/**
 * Builds genuine 3D vertical V-groove tongue-and-groove (`T&G`) cottage matchboarding along
 * `(x0, z0) -> (x1, z1)` (`~106mm` board pitch, `13.8mm` board thickness, `4.6mm`-deep `45°` V-grooves),
 * with exact 45° internal/external corner mitres and clean cutout bands around windows/countertops.
 */
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

  const faceD = 0.0138;
  const rootD = 0.0092;
  const chamferW = 0.0038;
  const startMitreSign = options?.startMitreSign ?? 0;
  const endMitreSign = options?.endMitreSign ?? 0;

  // Build piecewise-linear front depth profile `(u, d)` across `[0, totalLen]`
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
    if (u <= 1e-6 && startMitreSign !== 0) {
      return u + startMitreSign * d;
    }
    if (u >= totalLen - 1e-6 && endMitreSign !== 0) {
      return u + endMitreSign * d;
    }
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
    for (let k = 0; k < 6; k++) {
      normals.push(fnx, fny, fnz);
    }
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
        // Outward normal in (t, n) plane for segment (du, dd) is (-dd, du) / hyp
        const localUt = -dd / hyp;
        const localUn = du / hyp;
        const fnx = localUt * tx + localUn * nx;
        const fnz = localUt * tz + localUn * nz;

        const p00 = toWorld(segU0, yBot, d0);
        const p10 = toWorld(segU1, yBot, d1);
        const p11 = toWorld(segU1, yTop, d1);
        const p01 = toWorld(segU0, yTop, d0);
        pushQuad(p00, p10, p11, p01, fnx, 0, fnz, segU0, yBot, segU1, yTop, aoAtDepth(d0), aoAtDepth(d1));

        // Top & bottom horizontal thickness caps (`d = 0 -> d0/d1`) so cutouts & tops are 100% solid
        const b00 = toWorld(segU0, yBot, 0);
        const b10 = toWorld(segU1, yBot, 0);
        const b11 = toWorld(segU1, yTop, 0);
        const b01 = toWorld(segU0, yTop, 0);
        pushQuad(p01, p11, b11, b01, 0, 1, 0, segU0, 0, segU1, faceD);
        pushQuad(b00, b10, p10, p00, 0, -1, 0, segU0, 0, segU1, faceD);
      }

      // Square vertical side return caps at band edges when not mitred
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
 * Builds Room 17 (`familyBathroom`)'s Farrow & Ball architectural scheme:
 *  - Seamless `School House White` (No. 291, `#e6e1d5`) upper wall linings meeting the vaulted
 *    skeilings & collar ceiling with 0.000mm air gap and zero horizontal/pier seams.
 *  - Half-height (`1.22m` above FFL) `Wimborne White` (No. 239, `#f7f4ec`) real 3D vertical V-groove
 *    tongue-and-groove cottage panelling, 45°-mitred moulded dado cap rail, and 45°-mitred painted
 *    bathroom skirting around all dry walls.
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

  const { collarCeilingY, collarNorthZ, wallTopEmbed } = EAST_WING_BATHROOM_VAULT;
  const collarEmbedTopY = collarCeilingY + wallTopEmbed;
  const northEavesEmbedTopY = getEastWingCeilingHeightAtZ(-2.502) + wallTopEmbed;
  const southWallEmbedTopY = getEastWingCeilingHeightAtZ(0.9) + wallTopEmbed;

  const liningDepth = 0.0075;
  const panelBotY = floorTopY + 0.138; // 2.298m (tucked cleanly inside rebated skirting cap)
  const dadoBaseY = floorTopY + 1.152; // 3.312m .. 3.3385m (3mm above Win 1763678's 3.309m architrave, kissing the 3.33m 49° North cottage eaves!)
  const panelTopY = dadoBaseY + 0.006; // 3.318m (tucked cleanly inside rebated dado cap rail)
  const liningBotY = dadoBaseY + 0.006; // 3.318m (tucked behind dado rail)
  const showerTileTopY = floorTopY + 2.042; // 4.202m (top of Zellige shower tiling)

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
    if (northCutaway) {
      tagUpperCutawayWall(mesh, NORTH_EXTERIOR_CUTAWAY);
    }
    scene.add(mesh);
    return mesh;
  };

  // =========================================================================
  // 1. SEAMLESS FARROW & BALL `SCHOOL HOUSE WHITE` (No. 291) UPPER WALL LININGS
  // =========================================================================
  // 1A. West Wall (`X = -12.81m`, `Z = +0.90m -> -2.502m`, spanning above-shower & North skeiling)
  addShellMesh(
    'familyBathroom.westWallUpperLining',
    buildPolygonalWallLiningGeometry(
      -12.81,
      0.9,
      -12.81,
      -2.502,
      [
        [0, showerTileTopY],
        [0.9 - -0.652, showerTileTopY],
        [0.9 - -0.652, liningBotY],
        [0.9 - -2.502, liningBotY],
        [0.9 - -2.502, northEavesEmbedTopY],
        [0.9 - collarNorthZ, collarEmbedTopY],
        [0, southWallEmbedTopY],
      ],
      liningDepth
    ),
    schoolHouseWhiteMat
  );

  // 1B. North Exterior Wall (`Z = -2.50m`, `X = -12.812m -> -9.798m`, tucked behind 3.312..3.3385m dado rail into 49° North skeiling)
  addShellMesh(
    'familyBathroom.northWallUpperLining',
    buildPolygonalWallLiningGeometry(
      -12.812,
      -2.5,
      -9.798,
      -2.5,
      [
        [0, liningBotY],
        [3.014, liningBotY],
        [3.014, getEastWingCeilingHeightAtZ(-2.5) + wallTopEmbed],
        [0, getEastWingCeilingHeightAtZ(-2.5) + wallTopEmbed],
      ],
      0.006
    ),
    schoolHouseWhiteMat,
    true
  );

  // 1C. East Cross-Wall (`X = -9.80m`, `Z = -2.502m -> -0.164m`, stopping behind dark-oak joinery)
  addShellMesh(
    'familyBathroom.eastWallUpperLining',
    buildPolygonalWallLiningGeometry(
      -9.8,
      -2.502,
      -9.8,
      -0.164,
      [
        [0, liningBotY],
        [-0.164 - -2.502, liningBotY],
        [-0.164 - -2.502, collarEmbedTopY],
        [collarNorthZ - -2.502, collarEmbedTopY],
        [0, northEavesEmbedTopY],
      ],
      liningDepth
    ),
    schoolHouseWhiteMat
  );

  // 1D. Bulkhead West Wall & Corner Return (`X = -10.77m`, `Z = -0.01m -> +0.90m`)
  addShellMesh(
    'familyBathroom.bulkheadWestUpperLining',
    buildPolygonalWallLiningGeometry(
      -10.77,
      -0.01,
      -10.77,
      0.9,
      [
        [0, liningBotY],
        [0.91, liningBotY],
        [0.91, collarEmbedTopY],
        [0, collarEmbedTopY],
      ],
      liningDepth
    ),
    schoolHouseWhiteMat
  );
  addShellMesh(
    'familyBathroom.bulkheadReturnUpperLining',
    buildPolygonalWallLiningGeometry(
      -10.745,
      -0.01,
      -10.7775,
      -0.01,
      [
        [0, liningBotY],
        [0.0325, liningBotY],
        [0.0325, collarEmbedTopY],
        [0, collarEmbedTopY],
      ],
      liningDepth
    ),
    schoolHouseWhiteMat
  );

  // 1E. South Partition & Door Transom (`Z = +0.90m`, `X = -10.77m -> -12.812m`)
  addShellMesh(
    'familyBathroom.southWallUpperLining',
    buildPolygonalWallLiningGeometry(
      -10.77,
      0.9,
      -12.812,
      0.9,
      [
        [0, floorTopY + 2.025],
        [-10.77 - -11.666, floorTopY + 2.025],
        [-10.77 - -11.666, liningBotY],
        [-10.77 - -11.908, liningBotY],
        [-10.77 - -11.908, showerTileTopY],
        [-10.77 - -12.812, showerTileTopY],
        [-10.77 - -12.812, southWallEmbedTopY],
        [0, southWallEmbedTopY],
      ],
      liningDepth
    ),
    schoolHouseWhiteMat
  );

  // =========================================================================
  // 2. FARROW & BALL `WIMBORNE WHITE` (No. 239) 3D VERTICAL V-GROOVE T&G PANELLING
  // =========================================================================
  // 2A. West Dry Wall (`X = -12.81m`, north of shower trim `Z = -0.654m .. -2.500m`)
  addShellMesh(
    'familyBathroom.westPanelling',
    buildVerticalVGroovePanellingGeometry(
      -12.81,
      -0.654,
      -12.81,
      -2.5,
      17,
      [{ uMin: 0, uMax: 1.846, yBands: [[panelBotY, panelTopY]] }],
      { startMitreSign: 0, endMitreSign: -1 }
    ),
    wimborneWhitePanellingMat
  );

  // 2B. North Exterior Wall (`Z = -2.50m`, `X = -12.81m .. -9.80m`, framing neatly around Win 1763678's 75mm white window architrave)
  const winLeftU = -11.969 - -12.81; // 0.841m (outer edge of left 75mm architrave)
  const winRightU = -10.731 - -12.81; // 2.079m (outer edge of right 75mm architrave)
  addShellMesh(
    'familyBathroom.northPanelling',
    buildVerticalVGroovePanellingGeometry(
      -12.81,
      -2.5,
      -9.8,
      -2.5,
      28,
      [
        { uMin: 0, uMax: winLeftU, yBands: [[panelBotY, panelTopY]] },
        {
          uMin: winLeftU,
          uMax: winRightU,
          yBands: [[panelBotY, 2.325]],
        },
        { uMin: winRightU, uMax: 3.01, yBands: [[panelBotY, panelTopY]] },
      ],
      { startMitreSign: 1, endMitreSign: -1 }
    ),
    wimborneWhitePanellingMat,
    true
  );

  // 2C. East Cross-Wall (`X = -9.80m`, `Z = -2.50m .. -0.165m`, stepping cleanly over 3.01m Carrara vanity top)
  const vanityFrontU = -0.525 - -2.5; // 1.975m
  const joineryFrontU = -0.165 - -2.5; // 2.324m
  addShellMesh(
    'familyBathroom.eastPanelling',
    buildVerticalVGroovePanellingGeometry(
      -9.8,
      -2.5,
      -9.8,
      -0.165,
      22,
      [
        { uMin: 0, uMax: vanityFrontU, yBands: [[panelBotY, panelTopY]] },
        { uMin: vanityFrontU, uMax: joineryFrontU, yBands: [[floorTopY + 0.85, panelTopY]] },
      ],
      { startMitreSign: 1, endMitreSign: 0 }
    ),
    wimborneWhitePanellingMat
  );

  // 2D. Bulkhead West Wall & Corner Return (`(-10.745, -0.01) -> (-10.77, -0.01) -> (-10.77, +0.878)`)
  addShellMesh(
    'familyBathroom.bulkheadReturnPanelling',
    buildVerticalVGroovePanellingGeometry(
      -10.745,
      -0.01,
      -10.77,
      -0.01,
      1,
      [{ uMin: 0, uMax: 0.025, yBands: [[panelBotY, panelTopY]] }],
      { startMitreSign: 0, endMitreSign: 1 }
    ),
    wimborneWhitePanellingMat
  );
  addShellMesh(
    'familyBathroom.bulkheadWestPanelling',
    buildVerticalVGroovePanellingGeometry(
      -10.77,
      -0.01,
      -10.77,
      0.878,
      8,
      [{ uMin: 0, uMax: 0.888, yBands: [[panelBotY, panelTopY]] }],
      { startMitreSign: -1, endMitreSign: 0 }
    ),
    wimborneWhitePanellingMat
  );

  // 2E. South Dry Pier (`Z = +0.90m`, `X = -11.672m -> -11.906m`)
  addShellMesh(
    'familyBathroom.southPierPanelling',
    buildVerticalVGroovePanellingGeometry(
      -11.672,
      0.9,
      -11.906,
      0.9,
      2,
      [{ uMin: 0, uMax: 0.234, yBands: [[panelBotY, panelTopY]] }],
      { startMitreSign: 0, endMitreSign: 0 }
    ),
    wimborneWhitePanellingMat
  );

  // =========================================================================
  // 3. MOULDED COTTAGE DADO CAP RAIL & REBATED PAINTED SKIRTING (`WIMBORNE WHITE`)
  // =========================================================================
  // Classic cottage ovolo/astragal dado cap rail (`26.5mm` tall, `24.2mm` projection = +10.4mm proud of T&G)
  const dadoCapProfile: readonly ProfilePoint2D[] = [
    { d: 0.0, y: 0.006, ao: 0.88 },
    { d: 0.0138, y: 0.006, ao: 0.86 },
    { d: 0.0138, y: 0.0, ao: 0.86 },
    { d: 0.0178, y: 0.0, ao: 0.90 },
    { d: 0.0205, y: 0.0035, ao: 0.95 },
    { d: 0.0232, y: 0.008, ao: 0.99 },
    { d: 0.0242, y: 0.013, ao: 1.0 },
    { d: 0.0242, y: 0.0195, ao: 1.0 },
    { d: 0.0224, y: 0.0235, ao: 0.99 },
    { d: 0.0185, y: 0.0256, ao: 0.96 },
    { d: 0.0075, y: 0.0265, ao: 0.93 },
    { d: 0.0, y: 0.0265, ao: 0.93 },
  ];

  // Classic 146mm torus/ogee bathroom skirting (`24.0mm` plinth projection = +10.2mm proud of 13.8mm T&G)
  const bathroomSkirtingProfile: readonly ProfilePoint2D[] = [
    { d: 0.0, y: 0.002, ao: 0.92 },
    { d: 0.024, y: 0.002, ao: 0.94 },
    { d: 0.024, y: 0.114, ao: 1.0 },
    { d: 0.0222, y: 0.12, ao: 0.97 },
    { d: 0.0188, y: 0.1255, ao: 0.90 },
    { d: 0.0188, y: 0.1305, ao: 0.90 },
    { d: 0.0212, y: 0.1365, ao: 1.0 },
    { d: 0.0195, y: 0.1425, ao: 0.98 },
    { d: 0.0155, y: 0.146, ao: 0.93 },
    { d: 0.0138, y: 0.146, ao: 0.90 },
    { d: 0.0138, y: 0.136, ao: 0.90 },
    { d: 0.0, y: 0.136, ao: 0.90 },
  ];

  // Split North exterior wall segments cleanly at the 45° NW & NE mitres so cutaway mode hides North trim cleanly
  addShellMesh(
    'familyBathroom.westDadoRail',
    buildSweptMitredMouldingGeometry(
      [
        [-12.81, -0.654],
        [-12.81, -2.5],
      ],
      dadoCapProfile,
      dadoBaseY,
      { startMitreSign: 0, endMitreSign: -1 }
    ),
    wimborneWhitePanellingMat
  );
  addShellMesh(
    'familyBathroom.northDadoRail',
    buildSweptMitredMouldingGeometry(
      [
        [-12.81, -2.5],
        [-9.8, -2.5],
      ],
      dadoCapProfile,
      dadoBaseY,
      { startMitreSign: 1, endMitreSign: -1 }
    ),
    wimborneWhitePanellingMat,
    true
  );
  addShellMesh(
    'familyBathroom.eastDadoRail',
    buildSweptMitredMouldingGeometry(
      [
        [-9.8, -2.5],
        [-9.8, -0.165],
      ],
      dadoCapProfile,
      dadoBaseY,
      { startMitreSign: 1, endMitreSign: 0 }
    ),
    wimborneWhitePanellingMat
  );
  addShellMesh(
    'familyBathroom.bulkheadDadoRail',
    buildSweptMitredMouldingGeometry(
      [
        [-10.745, -0.01],
        [-10.77, -0.01],
        [-10.77, 0.878],
      ],
      dadoCapProfile,
      dadoBaseY
    ),
    wimborneWhitePanellingMat
  );
  addShellMesh(
    'familyBathroom.southPierDadoRail',
    buildSweptMitredMouldingGeometry(
      [
        [-11.672, 0.9],
        [-11.906, 0.9],
      ],
      dadoCapProfile,
      dadoBaseY
    ),
    wimborneWhitePanellingMat
  );

  // Painted Wimborne White Bathroom Skirtings (replacing raw oak skirting inside Room 17)
  addShellMesh(
    'familyBathroom.perimeterMitredSkirting',
    buildSweptMitredMouldingGeometry(
      [
        [-12.81, -0.654],
        [-12.81, -2.5],
      ],
      bathroomSkirtingProfile,
      floorTopY,
      { startMitreSign: 0, endMitreSign: -1 }
    ),
    wimborneWhitePanellingMat
  );
  addShellMesh(
    'familyBathroom.northSkirting',
    buildSweptMitredMouldingGeometry(
      [
        [-12.81, -2.5],
        [-9.8, -2.5],
      ],
      bathroomSkirtingProfile,
      floorTopY,
      { startMitreSign: 1, endMitreSign: -1 }
    ),
    wimborneWhitePanellingMat,
    true
  );
  addShellMesh(
    'familyBathroom.eastSkirting',
    buildSweptMitredMouldingGeometry(
      [
        [-9.8, -2.5],
        [-9.8, -0.525],
      ],
      bathroomSkirtingProfile,
      floorTopY,
      { startMitreSign: 1, endMitreSign: 0 }
    ),
    wimborneWhitePanellingMat
  );
  addShellMesh(
    'familyBathroom.bulkheadSkirting',
    buildSweptMitredMouldingGeometry(
      [
        [-10.745, -0.01],
        [-10.77, -0.01],
        [-10.77, 0.878],
      ],
      bathroomSkirtingProfile,
      floorTopY
    ),
    wimborneWhitePanellingMat
  );
  addShellMesh(
    'familyBathroom.southPierSkirting',
    buildSweptMitredMouldingGeometry(
      [
        [-11.672, 0.9],
        [-11.906, 0.9],
      ],
      bathroomSkirtingProfile,
      floorTopY
    ),
    wimborneWhitePanellingMat
  );
}
