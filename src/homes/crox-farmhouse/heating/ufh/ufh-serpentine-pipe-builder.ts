import * as THREE from 'three';
import type { UfhZoneId } from '../../../../engine/scene/property-scene-profile.ts';

export function roundPolylineCorners2D(
  waypoints: ReadonlyArray<readonly [number, number]>,
  maxCornerRadius: number,
  arcSegments = 8
): Array<readonly [number, number]> {
  if (waypoints.length <= 2) {
    return waypoints.map((p) => [p[0], p[1]] as const);
  }
  const out: Array<readonly [number, number]> = [waypoints[0]];

  for (let i = 1; i < waypoints.length - 1; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];
    const next = waypoints[i + 1];

    const dxIn = curr[0] - prev[0];
    const dzIn = curr[1] - prev[1];
    const lenIn = Math.hypot(dxIn, dzIn);

    const dxOut = next[0] - curr[0];
    const dzOut = next[1] - curr[1];
    const lenOut = Math.hypot(dxOut, dzOut);

    if (lenIn < 1e-4 || lenOut < 1e-4) {
      out.push(curr);
      continue;
    }

    const ux = dxIn / lenIn;
    const uz = dzIn / lenIn;
    const vx = dxOut / lenOut;
    const vz = dzOut / lenOut;

    const dot = Math.max(-1, Math.min(1, ux * vx + uz * vz));
    const turnAngle = Math.acos(dot);

    if (turnAngle < 0.03 || turnAngle > Math.PI - 0.03) {
      out.push(curr);
      continue;
    }

    const halfTan = Math.tan(turnAngle * 0.5);
    const tangentDist = Math.min(maxCornerRadius * halfTan, lenIn * 0.45, lenOut * 0.45);
    const effRadius = tangentDist / halfTan;

    const startX = curr[0] - ux * tangentDist;
    const startZ = curr[1] - uz * tangentDist;

    // Unit vector perpendicular to incoming tangent pointing toward the inside of the turn
    let px = vx - dot * ux;
    let pz = vz - dot * uz;
    const pLen = Math.hypot(px, pz);
    if (pLen < 1e-5) {
      out.push(curr);
      continue;
    }
    px /= pLen;
    pz /= pLen;

    const centerX = startX + px * effRadius;
    const centerZ = startZ + pz * effRadius;

    for (let s = 0; s <= arcSegments; s++) {
      const theta = (s / arcSegments) * turnAngle;
      const sinT = Math.sin(theta);
      const cosT = Math.cos(theta);
      out.push([
        centerX + effRadius * (sinT * ux - cosT * px),
        centerZ + effRadius * (sinT * uz - cosT * pz),
      ]);
    }
  }

  out.push(waypoints[waypoints.length - 1]);
  return out;
}

const EAST_STEP_X_PLANES: readonly number[] = [
  -9.82, -9.8, -9.77, -9.74, -9.71, -9.68, -9.65, -9.62, -9.59, -9.56, -9.54,
];
const ENTRANCE_STEP_Z_BASE = 2.52;
const ENTRANCE_STEP_Z_PLANES: readonly number[] = [
  ENTRANCE_STEP_Z_BASE - 0.02,
  ENTRANCE_STEP_Z_BASE,
  ENTRANCE_STEP_Z_BASE + 0.025,
  ENTRANCE_STEP_Z_BASE + 0.05,
  ENTRANCE_STEP_Z_BASE + 0.07,
  ENTRANCE_STEP_Z_BASE + 0.09,
  ENTRANCE_STEP_Z_BASE + 0.115,
  ENTRANCE_STEP_Z_BASE + 0.14,
  ENTRANCE_STEP_Z_BASE + 0.16,
];

/**
 * Computes the local UFH pipe centerline elevation `Y` (`localFloorY - 0.018m`)
 * following Crox Farmhouse's 3-tier ground floor topology.
 */
function getSteppedGroundPipeY(x: number, z: number): number {
  let floorY = -0.3;
  if (x >= -9.56) {
    floorY = 0.0;
  } else if (x > -9.8) {
    const t = (x - -9.8) / 0.24;
    const s = t * t * (3 - 2 * t);
    floorY = -0.3 * (1 - s);
  } else if (x <= -17.0 && z > ENTRANCE_STEP_Z_BASE) {
    if (z >= ENTRANCE_STEP_Z_BASE + 0.14) {
      floorY = -0.6;
    } else {
      const t = (z - ENTRANCE_STEP_Z_BASE) / 0.14;
      const s = t * t * (3 - 2 * t);
      floorY = -0.3 * (1 - s) + -0.6 * s;
    }
  }
  return floorY - 0.018;
}

/**
 * Subdivides straight 2D pipe segments wherever they cross the house's floor-step boundaries
 * (`X = -9.80m..-9.56m` between the `-0.30m` Boot Lobby/Wine Cellar and `0.00m` Dining/Cupboard,
 * and `Z = +2.02m..+2.16m` between the `-0.30m` Main Hall and `-0.60m` Entrance Hall) so pipes
 * stay 100% flat on each slab tier and step cleanly up/down at the step thresholds.
 */
function subdividePolylineAtFloorSteps2D(
  rawPoints: ReadonlyArray<readonly [number, number]>
): Array<readonly [number, number]> {
  if (rawPoints.length < 2) {
    return rawPoints.map((pt) => [pt[0], pt[1]] as const);
  }
  const out: Array<readonly [number, number]> = [rawPoints[0]];

  for (let i = 0; i < rawPoints.length - 1; i++) {
    const [x0, z0] = rawPoints[i];
    const [x1, z1] = rawPoints[i + 1];
    const dx = x1 - x0;
    const dz = z1 - z0;

    const splits: number[] = [];
    if (Math.abs(dx) > 1e-5) {
      const minX = Math.min(x0, x1);
      const maxX = Math.max(x0, x1);
      for (const xPlane of EAST_STEP_X_PLANES) {
        if (xPlane > minX + 1e-4 && xPlane < maxX - 1e-4) {
          splits.push((xPlane - x0) / dx);
        }
      }
    }
    if (Math.abs(dz) > 1e-5 && Math.min(x0, x1) <= -17.0) {
      const minZ = Math.min(z0, z1);
      const maxZ = Math.max(z0, z1);
      for (const zPlane of ENTRANCE_STEP_Z_PLANES) {
        if (zPlane > minZ + 1e-4 && zPlane < maxZ - 1e-4) {
          splits.push((zPlane - z0) / dz);
        }
      }
    }

    if (splits.length > 0) {
      splits.sort((a, b) => a - b);
      let lastU = 0;
      for (const u of splits) {
        if (u - lastU > 1e-4 && u < 1 - 1e-4) {
          out.push([x0 + dx * u, z0 + dz * u]);
          lastU = u;
        }
      }
    }
    out.push([x1, z1]);
  }

  return out;
}

/**
 * Builds a twist-free continuous 3D pipe tube `BufferGeometry` along a 2D `(x, z)` path
 * that automatically steps in elevation `Y` with the house's ground-floor slab topology
 * (`-0.60m` <-> `-0.30m` <-> `0.00m`) and includes vertical drop connections into both
 * Manifold A (`hall.understairsManifold` at `Y = -0.30m`) and Manifold B
 * (`familyRoom.bootRoomManifold` at `Y = 0.00m`).
 */
function createHorizontalPipeTubeGeometry(
  rawPoints: ReadonlyArray<readonly [number, number]>,
  _unusedConstantPipeY: number,
  radius: number,
  radialSegments = 8
): THREE.BufferGeometry {
  const subdivided2D = subdividePolylineAtFloorSteps2D(rawPoints);
  const pts2D: Array<readonly [number, number]> = [];
  for (const pt of subdivided2D) {
    if (
      pts2D.length === 0 ||
      Math.hypot(pt[0] - pts2D[pts2D.length - 1][0], pt[1] - pts2D[pts2D.length - 1][1]) > 1e-4
    ) {
      pts2D.push(pt);
    }
  }

  if (pts2D.length < 2) {
    return new THREE.BufferGeometry();
  }

  // Build 3D centerline points with vertical manifold drop elbows at start & end
  const points3D: Array<readonly [number, number, number]> = [];
  const elbowR = 0.032;

  // Start elbow at manifold (drops 98mm from inside the manifold floor shroud to slab screed depth)
  {
    const [x0, z0] = pts2D[0];
    const [x1, z1] = pts2D[1];
    const y0 = getSteppedGroundPipeY(x0, z0);
    const startShroudTopY = y0 + 0.098;
    const dx = x1 - x0;
    const dz = z1 - z0;
    const segLen = Math.hypot(dx, dz);
    if (segLen > elbowR * 2) {
      const ux = dx / segLen;
      const uz = dz / segLen;
      points3D.push([x0, startShroudTopY, z0]);
      const elbowSteps = 4;
      for (let s = 0; s <= elbowSteps; s++) {
        const theta = (s / elbowSteps) * (Math.PI * 0.5);
        points3D.push([
          x0 + ux * elbowR * (1 - Math.cos(theta)),
          y0 + elbowR * (1 - Math.sin(theta)),
          z0 + uz * elbowR * (1 - Math.cos(theta)),
        ]);
      }
    } else {
      points3D.push([x0, y0, z0]);
    }
  }

  for (let i = 1; i < pts2D.length - 1; i++) {
    const [px, pz] = pts2D[i];
    points3D.push([px, getSteppedGroundPipeY(px, pz), pz]);
  }

  // End elbow at manifold (rises 98mm from slab screed depth into the manifold floor shroud)
  {
    const [xPrev, zPrev] = pts2D[pts2D.length - 2];
    const [xEnd, zEnd] = pts2D[pts2D.length - 1];
    const yEnd = getSteppedGroundPipeY(xEnd, zEnd);
    const endShroudTopY = yEnd + 0.098;
    const dx = xEnd - xPrev;
    const dz = zEnd - zPrev;
    const segLen = Math.hypot(dx, dz);
    if (segLen > elbowR * 2) {
      const ux = dx / segLen;
      const uz = dz / segLen;
      const elbowSteps = 4;
      for (let s = 0; s <= elbowSteps; s++) {
        const theta = (s / elbowSteps) * (Math.PI * 0.5);
        points3D.push([
          xEnd - ux * elbowR * (1 - Math.sin(theta)),
          yEnd + elbowR * (1 - Math.cos(theta)),
          zEnd - uz * elbowR * (1 - Math.sin(theta)),
        ]);
      }
      points3D.push([xEnd, endShroudTopY, zEnd]);
    } else {
      points3D.push([xEnd, yEnd, zEnd]);
    }
  }

  const nPts = points3D.length;
  const positions = new Float32Array(nPts * radialSegments * 3);
  const normals = new Float32Array(nPts * radialSegments * 3);
  const indices: number[] = [];

  // Initialize fallback horizontal direction from the first non-vertical segment
  let prevUx = 1;
  let prevUz = 0;
  for (let i = 0; i < nPts - 1; i++) {
    const h = Math.hypot(
      points3D[i + 1][0] - points3D[i][0],
      points3D[i + 1][2] - points3D[i][2]
    );
    if (h > 1e-4) {
      prevUx = (points3D[i + 1][0] - points3D[i][0]) / h;
      prevUz = (points3D[i + 1][2] - points3D[i][2]) / h;
      break;
    }
  }

  for (let i = 0; i < nPts; i++) {
    let tx = 0;
    let ty = 0;
    let tz = 0;
    if (i === 0) {
      tx = points3D[1][0] - points3D[0][0];
      ty = points3D[1][1] - points3D[0][1];
      tz = points3D[1][2] - points3D[0][2];
    } else if (i === nPts - 1) {
      tx = points3D[nPts - 1][0] - points3D[nPts - 2][0];
      ty = points3D[nPts - 1][1] - points3D[nPts - 2][1];
      tz = points3D[nPts - 1][2] - points3D[nPts - 2][2];
    } else {
      const dx0 = points3D[i][0] - points3D[i - 1][0];
      const dy0 = points3D[i][1] - points3D[i - 1][1];
      const dz0 = points3D[i][2] - points3D[i - 1][2];
      const l0 = Math.hypot(dx0, dy0, dz0) || 1;
      const dx1 = points3D[i + 1][0] - points3D[i][0];
      const dy1 = points3D[i + 1][1] - points3D[i][1];
      const dz1 = points3D[i + 1][2] - points3D[i][2];
      const l1 = Math.hypot(dx1, dy1, dz1) || 1;
      tx = dx0 / l0 + dx1 / l1;
      ty = dy0 / l0 + dy1 / l1;
      tz = dz0 / l0 + dz1 / l1;
    }
    const tLen = Math.hypot(tx, ty, tz) || 1;
    tx /= tLen;
    ty /= tLen;
    tz /= tLen;

    const hLen = Math.hypot(tx, tz);
    let ux = prevUx;
    let uz = prevUz;
    if (hLen > 1e-4) {
      ux = tx / hLen;
      uz = tz / hLen;
      prevUx = ux;
      prevUz = uz;
    }

    // Orthonormal cross-section basis (N_side horizontal, B perpendicular to T and N_side)
    const nx = -uz;
    const nz = ux;
    const bx = -ty * ux;
    const by = hLen;
    const bz = -ty * uz;

    const [px, py, pz] = points3D[i];

    for (let j = 0; j < radialSegments; j++) {
      const phi = (j / radialSegments) * Math.PI * 2;
      const cosP = Math.cos(phi);
      const sinP = Math.sin(phi);

      const rnx = cosP * nx + sinP * bx;
      const rny = sinP * by;
      const rnz = cosP * nz + sinP * bz;

      const vIdx = (i * radialSegments + j) * 3;
      positions[vIdx] = px + radius * rnx;
      positions[vIdx + 1] = py + radius * rny;
      positions[vIdx + 2] = pz + radius * rnz;

      normals[vIdx] = rnx;
      normals[vIdx + 1] = rny;
      normals[vIdx + 2] = rnz;
    }
  }

  for (let i = 0; i < nPts - 1; i++) {
    const ring0 = i * radialSegments;
    const ring1 = (i + 1) * radialSegments;
    for (let j = 0; j < radialSegments; j++) {
      const jNext = (j + 1) % radialSegments;
      const a = ring0 + j;
      const b = ring1 + j;
      const c = ring1 + jNext;
      const d = ring0 + jNext;
      indices.push(a, b, c, a, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geo.setIndex(indices);
  return geo;
}

export interface SerpentineRowSpec {
  readonly z: number;
  readonly minX: number;
  readonly maxX: number;
}

export interface SerpentineColSpec {
  readonly x: number;
  readonly minZ: number;
  readonly maxZ: number;
}

export interface ThermalBedRect {
  readonly name: string;
  readonly minX: number;
  readonly maxX: number;
  readonly minZ: number;
  readonly maxZ: number;
}

/**
 * Generates a single unbroken 2D pipe path from `leadInWaypoints` (starting at the manifold flow port),
 * through a sequence of East-West serpentine rows (`rows`) connected by outward 180° semicircular U-bends,
 * and back through `leadOutWaypoints` (ending at the manifold return port) with zero dead ends.
 */
export function buildContinuousRowsSerpentinePath2D(
  rows: ReadonlyArray<SerpentineRowSpec>,
  startGoingEast: boolean,
  leadInWaypoints: ReadonlyArray<readonly [number, number]>,
  leadOutWaypoints: ReadonlyArray<readonly [number, number]>
): Array<readonly [number, number]> {
  const n = rows.length;
  if (n === 0) return [];
  const uBendSteps = 12;

  const rowEndpoints: Array<readonly [number, number, number]> = [];
  for (let i = 0; i < n; i++) {
    const z = rows[i].z;
    const goingEast = startGoingEast ? i % 2 === 0 : i % 2 === 1;
    const prevDz = i > 0 ? Math.abs(z - rows[i - 1].z) : n > 1 ? Math.abs(rows[1].z - z) : 0.22;
    const nextDz = i < n - 1 ? Math.abs(rows[i + 1].z - z) : prevDz;
    const rIn = prevDz * 0.5;
    const rOut = nextDz * 0.5;

    const x0 =
      i === 0
        ? goingEast
          ? rows[0].minX
          : rows[0].maxX
        : goingEast
          ? rows[i].minX + rIn
          : rows[i].maxX - rIn;
    const x1 =
      i === n - 1
        ? goingEast
          ? rows[i].maxX
          : rows[i].minX
        : goingEast
          ? rows[i].maxX - rOut
          : rows[i].minX + rOut;
    rowEndpoints.push([x0, x1, z]);
  }

  const path: Array<readonly [number, number]> = [];

  // 1. Lead-in from manifold flow port smoothly rounded into Row 0
  const [r0x0, r0x1, r0z] = rowEndpoints[0];
  const roundedIn = roundPolylineCorners2D(
    [...leadInWaypoints, [r0x0, r0z], [r0x1, r0z]],
    0.075,
    6
  );
  path.push(...roundedIn);

  // 2. Interior 180° outward semicircular U-bends and straight passes
  for (let i = 0; i < n - 1; i++) {
    const [x0, x1, z] = rowEndpoints[i];
    if (i > 0) {
      path.push([x0, z], [x1, z]);
    }
    const nextZ = rowEndpoints[i + 1][2];
    const bendR = Math.abs(nextZ - z) * 0.5;
    const cx = x1;
    const cz = (z + nextZ) * 0.5;
    const goingEast = startGoingEast ? i % 2 === 0 : i % 2 === 1;
    const tx = goingEast ? 1 : -1;
    const nzSign = nextZ > z ? 1 : -1;

    for (let s = 1; s < uBendSteps; s++) {
      const theta = (s / uBendSteps) * Math.PI;
      path.push([
        cx + bendR * Math.sin(theta) * tx,
        cz - bendR * Math.cos(theta) * nzSign,
      ]);
    }
  }

  // 3. Final row smoothly rounded into lead-out back to manifold return port
  if (n > 1) {
    const [lastX0, lastX1, lastZ] = rowEndpoints[n - 1];
    const roundedOut = roundPolylineCorners2D(
      [[lastX0, lastZ], [lastX1, lastZ], ...leadOutWaypoints],
      0.075,
      6
    );
    path.push(...roundedOut);
  }

  return path;
}

/**
 * Generates a single unbroken 2D pipe path from `leadInWaypoints` through a sequence of
 * North-South serpentine columns (`cols`) connected by outward 180° semicircular U-bends,
 * and back through `leadOutWaypoints` with zero dead ends.
 */
export function buildContinuousColsSerpentinePath2D(
  cols: ReadonlyArray<SerpentineColSpec>,
  startGoingSouth: boolean,
  leadInWaypoints: ReadonlyArray<readonly [number, number]>,
  leadOutWaypoints: ReadonlyArray<readonly [number, number]>
): Array<readonly [number, number]> {
  const n = cols.length;
  if (n === 0) return [];
  const uBendSteps = 12;

  const colEndpoints: Array<readonly [number, number, number]> = [];
  for (let i = 0; i < n; i++) {
    const x = cols[i].x;
    const goingSouth = startGoingSouth ? i % 2 === 0 : i % 2 === 1;
    const prevDx = i > 0 ? Math.abs(x - cols[i - 1].x) : n > 1 ? Math.abs(cols[1].x - x) : 0.22;
    const nextDx = i < n - 1 ? Math.abs(cols[i + 1].x - x) : prevDx;
    const rIn = prevDx * 0.5;
    const rOut = nextDx * 0.5;

    const z0 =
      i === 0
        ? goingSouth
          ? cols[0].minZ
          : cols[0].maxZ
        : goingSouth
          ? cols[i].minZ + rIn
          : cols[i].maxZ - rIn;
    const z1 =
      i === n - 1
        ? goingSouth
          ? cols[i].maxZ
          : cols[i].minZ
        : goingSouth
          ? cols[i].maxZ - rOut
          : cols[i].minZ + rOut;
    colEndpoints.push([z0, z1, x]);
  }

  const path: Array<readonly [number, number]> = [];

  const [c0z0, c0z1, c0x] = colEndpoints[0];
  const roundedIn = roundPolylineCorners2D(
    [...leadInWaypoints, [c0x, c0z0], [c0x, c0z1]],
    0.075,
    6
  );
  path.push(...roundedIn);

  for (let i = 0; i < n - 1; i++) {
    const [z0, z1, x] = colEndpoints[i];
    if (i > 0) {
      path.push([x, z0], [x, z1]);
    }
    const nextX = colEndpoints[i + 1][2];
    const bendR = Math.abs(nextX - x) * 0.5;
    const cx = (x + nextX) * 0.5;
    const cz = z1;
    const goingSouth = startGoingSouth ? i % 2 === 0 : i % 2 === 1;
    const tz = goingSouth ? 1 : -1;
    const nxSign = nextX > x ? 1 : -1;

    for (let s = 1; s < uBendSteps; s++) {
      const theta = (s / uBendSteps) * Math.PI;
      path.push([
        cx - bendR * Math.cos(theta) * nxSign,
        cz + bendR * Math.sin(theta) * tz,
      ]);
    }
  }

  if (n > 1) {
    const [lastZ0, lastZ1, lastX] = colEndpoints[n - 1];
    const roundedOut = roundPolylineCorners2D(
      [[lastX, lastZ0], [lastX, lastZ1], ...leadOutWaypoints],
      0.075,
      6
    );
    path.push(...roundedOut);
  }

  return path;
}

export function makeUniformRows(
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
  numRows: number
): SerpentineRowSpec[] {
  const rows: SerpentineRowSpec[] = [];
  for (let i = 0; i < numRows; i++) {
    const z = minZ + (i / (numRows - 1)) * (maxZ - minZ);
    rows.push({ z, minX, maxX });
  }
  return rows;
}

/**
 * Adds a complete closed UFH circuit group (one or more thermal bed pads + one single unbroken
 * 16mm PERT-AL-PERT pipe mesh starting and ending at the manifold) with zero dead ends.
 */
export function addClosedUfhCircuit(
  parent: THREE.Group,
  pipeMat: THREE.MeshStandardMaterial,
  bedMat: THREE.MeshBasicMaterial,
  interactiveMeshes: THREE.Object3D[],
  zoneId: UfhZoneId,
  groupName: string,
  floorY: number,
  beds: ReadonlyArray<ThermalBedRect>,
  coilPoints: ReadonlyArray<readonly [number, number]>
): void {
  const patchGroup = new THREE.Group();
  patchGroup.name = groupName;

  const pipeY = floorY - 0.018;
  const bedY = floorY - 0.033;
  const pipeRadius = 0.014;

  for (const bed of beds) {
    const spanX = bed.maxX - bed.minX;
    const spanZ = bed.maxZ - bed.minZ;
    const centerX = (bed.minX + bed.maxX) * 0.5;
    const centerZ = (bed.minZ + bed.maxZ) * 0.5;

    const bedGeo = new THREE.PlaneGeometry(spanX + 0.14, spanZ + 0.14);
    bedGeo.rotateX(-Math.PI / 2);
    const bedMesh = new THREE.Mesh(bedGeo, bedMat);
    bedMesh.name = bed.name;
    bedMesh.position.set(centerX, bedY, centerZ);
    bedMesh.userData = { ufhZoneId: zoneId };
    patchGroup.add(bedMesh);
    interactiveMeshes.push(bedMesh);
  }

  const coilGeo = createHorizontalPipeTubeGeometry(coilPoints, pipeY, pipeRadius, 8);
  const coilMesh = new THREE.Mesh(coilGeo, pipeMat);
  coilMesh.name = `${groupName}.coil`;
  coilMesh.userData = { ufhZoneId: zoneId };
  patchGroup.add(coilMesh);
  interactiveMeshes.push(coilMesh);

  parent.add(patchGroup);
}

/**
 * Builds a 2-pipe radiator flow & return supply run (`15mm` copper/PEX under floorboards)
 * with vertical risers into the radiator's bottom TRV and lockshield valves.
 */
export function buildRadiatorSupplyPipeRun(
  parent: THREE.Group,
  pipeMat: THREE.MeshStandardMaterial,
  interactiveMeshes: THREE.Object3D[],
  zoneId: UfhZoneId,
  name: string,
  floorY: number,
  waypoints: ReadonlyArray<readonly [number, number]>,
  radiatorValveZSpan = 0.96
): void {
  const runGroup = new THREE.Group();
  runGroup.name = name;
  const pipeY = floorY - 0.022;
  const pipeRadius = 0.013;

  for (const offset of [-0.022, 0.022] as const) {
    for (let w = 0; w < waypoints.length - 1; w++) {
      const [x0, z0] = waypoints[w];
      const [x1, z1] = waypoints[w + 1];
      const dx = x1 - x0;
      const dz = z1 - z0;
      const segLen = Math.hypot(dx, dz);
      if (segLen < 0.01) continue;

      const nx = -dz / segLen;
      const nz = dx / segLen;
      const segGeo = new THREE.CylinderGeometry(pipeRadius, pipeRadius, segLen, 8);
      segGeo.rotateX(Math.PI / 2);
      const segMesh = new THREE.Mesh(segGeo, pipeMat);
      segMesh.name = `${name}.${offset < 0 ? "flow" : "return"}.segment.${w + 1}`;
      segMesh.position.set(
        (x0 + x1) * 0.5 + nx * offset,
        pipeY,
        (z0 + z1) * 0.5 + nz * offset
      );
      segMesh.rotation.y = Math.atan2(dx, dz);
      segMesh.userData = { ufhZoneId: zoneId };
      runGroup.add(segMesh);
      interactiveMeshes.push(segMesh);
    }
  }

  // Vertical radiator valve tail risers at the final waypoint (radiator center)
  if (waypoints.length > 0) {
    const [radX, radZ] = waypoints[waypoints.length - 1];
    const riserH = 0.165;
    for (const endSign of [-1, 1] as const) {
      const vz = radZ + endSign * (radiatorValveZSpan * 0.5);
      const riserGeo = new THREE.CylinderGeometry(pipeRadius * 0.9, pipeRadius * 0.9, riserH, 8);
      const riserMesh = new THREE.Mesh(riserGeo, pipeMat);
      riserMesh.name = `${name}.${endSign < 0 ? "flowRiser" : "returnRiser"}`;
      riserMesh.position.set(radX, pipeY + riserH * 0.5, vz);
      riserMesh.userData = { ufhZoneId: zoneId, lodTier: 'high' };
      runGroup.add(riserMesh);
      interactiveMeshes.push(riserMesh);
    }
  }

  parent.add(runGroup);
}
