import * as THREE from 'three';
import type {
  HeatingEnvironmentConfig,
  HeatingStartMode,
  RoomThermalProfile,
  ThermalWarmupEstimate,
  UfhSystemOverlay3D,
  UfhZoneId,
  UfhZoneState,
} from '../../../engine/scene/property-scene-profile.ts';
import {
  MAIN_EAST_WING_OFFSET,
  MAIN_EAST_WING_ROTATION_Y,
  transformEastWingTuple,
} from '../structure/ground-floor-materials.ts';
import type { SceneBuilderContext } from '../../../types/scene.ts';
import type { RoomZoneId } from '../../../types/topology.ts';

export type {
  HeatingEnvironmentConfig,
  HeatingStartMode,
  RoomThermalProfile,
  ThermalWarmupEstimate,
  UfhZoneId,
  UfhZoneState,
};

export type CroxUfhSystemHandle = UfhSystemOverlay3D;

/**
 * 1600s/1700s Solid-Brick Farmhouse + Double-Glazed Windows Thermal Physics Model
 * derived directly from Crox Farmhouse's 3D room dimensions, emitter specifications,
 * floor coverings (Stone Flagstone / Quarry Tile / 18mm Engineered Oak), and envelope U-values:
 * - Solid 225–340mm Flemish/English-bond brick walls with lime plaster: U ≈ 1.65 W/(m²·K)
 * - Heritage double-glazed sash, casement & bifold units: U ≈ 1.50 W/(m²·K)
 * - Infiltration rate: ~0.85 ACH
 * - Zones 1 & 2: 65°C Flow Cast-Iron 4-Column Radiators (12 min hydraulic lag, high W/m² boost)
 * - Zones 3 & 4: 45°C Blended-Flow 16mm PERT-AL-PERT in 65mm screed (36–46 min screed thermal lag)
 */
const ROOM_THERMAL_PROFILES: ReadonlyArray<RoomThermalProfile> = [
  {
    roomZoneId: 'sittingRoom',
    roomName: 'Sitting Room',
    ufhZoneId: 'ufhZone1',
    emitterLabel: '2 × 4-Col Cast-Iron Radiators (65°C Flow)',
    constructionSummary: '17th-C solid brick W/N walls · Double-glazed bay & sash · Timber floor',
    floorAreaM2: 23.7,
    heatedAreaM2: 23.7,
    volumeM3: 58.3,
    emitterOutputW: 3420,
    specificOutputWPerM2: 144,
    heatLossWPerK: 86,
    thermalCapacitanceWhPerK: 410,
    emitterLagMinutes: 12,
    setbackStartTempC: 18.0,
    coldStartTempC: 14.0,
    targetTempC: 21.0,
  },
  {
    roomZoneId: 'livingRoom',
    roomName: 'Living Room',
    ufhZoneId: 'ufhZone2',
    emitterLabel: '2 × 4-Col Cast-Iron Radiators (65°C Flow)',
    constructionSummary: '17th-C solid brick W/N walls · Double-glazed canted bay · Timber floor',
    floorAreaM2: 24.9,
    heatedAreaM2: 24.9,
    volumeM3: 61.3,
    emitterOutputW: 3280,
    specificOutputWPerM2: 132,
    heatLossWPerK: 88,
    thermalCapacitanceWhPerK: 430,
    emitterLagMinutes: 12,
    setbackStartTempC: 18.0,
    coldStartTempC: 14.0,
    targetTempC: 21.0,
  },
  {
    roomZoneId: 'entranceHall',
    roomName: 'Front Entrance Hallway',
    ufhZoneId: 'ufhZone3',
    emitterLabel: 'Manifold A P1 · Screed UFH under Quarry Tile (45°C)',
    constructionSummary: 'Solid brick S wall · Glazed front door · Sealed terracotta quarry tiles',
    floorAreaM2: 6.6,
    heatedAreaM2: 5.6,
    volumeM3: 16.2,
    emitterOutputW: 540,
    specificOutputWPerM2: 96,
    heatLossWPerK: 24,
    thermalCapacitanceWhPerK: 115,
    emitterLagMinutes: 36,
    setbackStartTempC: 17.5,
    coldStartTempC: 14.0,
    targetTempC: 19.5,
  },
  {
    roomZoneId: 'hall',
    roomName: 'Main Staircase Hall',
    ufhZoneId: 'ufhZone3',
    emitterLabel: 'Manifold A P2–3 · Screed UFH under Flagstones (45°C)',
    constructionSummary: 'Solid brick N/S walls · Double-glazed courtyard door · Heavy flagstones (+5kW Stove)',
    floorAreaM2: 19.2,
    heatedAreaM2: 11.8,
    volumeM3: 52.0,
    emitterOutputW: 1120,
    specificOutputWPerM2: 95,
    heatLossWPerK: 52,
    thermalCapacitanceWhPerK: 280,
    emitterLagMinutes: 40,
    setbackStartTempC: 17.5,
    coldStartTempC: 14.0,
    targetTempC: 19.5,
  },
  {
    roomZoneId: 'bootLobby',
    roomName: 'Boot Lobby, WC & Boot Room',
    ufhZoneId: 'ufhZone3',
    emitterLabel: 'Manifold A P4 & Manifold B P4 · Screed UFH under Stone/Tile (45°C)',
    constructionSummary: 'Solid brick N/S walls · Double-glazed cottage windows · Flagstone & encaustic tile',
    floorAreaM2: 13.4,
    heatedAreaM2: 8.8,
    volumeM3: 31.8,
    emitterOutputW: 840,
    specificOutputWPerM2: 95,
    heatLossWPerK: 38,
    thermalCapacitanceWhPerK: 185,
    emitterLagMinutes: 38,
    setbackStartTempC: 17.5,
    coldStartTempC: 14.0,
    targetTempC: 19.5,
  },
  {
    roomZoneId: 'familyRoom',
    roomName: 'Dining Room & Snug',
    ufhZoneId: 'ufhZone4',
    emitterLabel: 'Boot Room Manifold B P3 · Screed UFH under Quarry Tile (45°C)',
    constructionSummary: 'Solid brick N/S walls · 3 double-glazed cottage windows & door · Quarry tile',
    floorAreaM2: 23.9,
    heatedAreaM2: 18.4,
    volumeM3: 56.4,
    emitterOutputW: 1660,
    specificOutputWPerM2: 90,
    heatLossWPerK: 74,
    thermalCapacitanceWhPerK: 370,
    emitterLagMinutes: 38,
    setbackStartTempC: 18.0,
    coldStartTempC: 14.0,
    targetTempC: 20.5,
  },
  {
    roomZoneId: 'kitchen',
    roomName: 'Kitchen & Island Galley',
    ufhZoneId: 'ufhZone4',
    emitterLabel: 'Boot Room Manifold B P2 · Screed UFH under 18mm Oak (45°C)',
    constructionSummary: 'Solid brick N/S walls · Double-glazed windows · 18mm engineered oak (53% free floor)',
    floorAreaM2: 26.8,
    heatedAreaM2: 14.2,
    volumeM3: 68.5,
    emitterOutputW: 1110,
    specificOutputWPerM2: 78,
    heatLossWPerK: 48,
    thermalCapacitanceWhPerK: 275,
    emitterLagMinutes: 46,
    setbackStartTempC: 18.0,
    coldStartTempC: 14.0,
    targetTempC: 20.5,
  },
  {
    roomZoneId: 'sitting',
    roomName: 'Vaulted Sitting Area (East Kitchen)',
    ufhZoneId: 'ufhZone4',
    emitterLabel: 'Boot Room Manifold B P1 · Screed UFH under 18mm Oak (45°C)',
    constructionSummary: 'Vaulted ceiling · 3.9m double-glazed bifolds · E/S brick walls · 18mm oak',
    floorAreaM2: 14.2,
    heatedAreaM2: 10.6,
    volumeM3: 41.2,
    emitterOutputW: 870,
    specificOutputWPerM2: 82,
    heatLossWPerK: 42,
    thermalCapacitanceWhPerK: 225,
    emitterLagMinutes: 46,
    setbackStartTempC: 18.0,
    coldStartTempC: 14.0,
    targetTempC: 20.5,
  },
  {
    roomZoneId: 'utility',
    roomName: 'Utility & Laundry Room',
    ufhZoneId: 'ufhZone4',
    emitterLabel: 'Boot Room Manifold B P1 · Screed UFH under Stone Tile (45°C)',
    constructionSummary: 'Solid brick N/E corner walls · Double-glazed window · Low-resistance stone tile',
    floorAreaM2: 5.2,
    heatedAreaM2: 3.4,
    volumeM3: 12.8,
    emitterOutputW: 320,
    specificOutputWPerM2: 94,
    heatLossWPerK: 15,
    thermalCapacitanceWhPerK: 80,
    emitterLagMinutes: 36,
    setbackStartTempC: 17.5,
    coldStartTempC: 14.0,
    targetTempC: 19.5,
  },
];

function formatWarmupMinutes(minutes: number | null): string {
  if (minutes === null || !Number.isFinite(minutes)) {
    return 'Insufficient output';
  }
  const rounded = Math.max(1, Math.round(minutes));
  if (rounded < 60) {
    return `${rounded}m`;
  }
  const hrs = Math.floor(rounded / 60);
  const mins = rounded % 60;
  return mins === 0 ? `${hrs}h` : `${hrs}h ${mins}m`;
}

/**
 * Solves first-order building thermal balance with hydraulic/screed dead-time lag:
 *   C_eff * dT/dt = Q_emit - H_loss * (T(t) - T_out)
 *   t_warmup = t_lag + (C_eff / H_loss) * ln((T_max - T_start) / (T_max - T_target))
 */
function computeWarmupEstimateFromParams(
  startTempC: number,
  targetTempC: number,
  outdoorTempC: number,
  emitterOutputW: number,
  heatLossWPerK: number,
  thermalCapacitanceWhPerK: number,
  emitterLagMinutes: number
): ThermalWarmupEstimate {
  const steadyHeatLossAtTargetW = Math.max(0, Math.round(heatLossWPerK * (targetTempC - outdoorTempC)));
  const startLossW = Math.max(0, heatLossWPerK * (startTempC - outdoorTempC));
  const netBoostPowerAtStartW = Math.round(emitterOutputW - startLossW);
  const initialHeatingRateCPerHr =
    thermalCapacitanceWhPerK > 0
      ? Math.max(0, Number(((emitterOutputW - startLossW) / thermalCapacitanceWhPerK).toFixed(2)))
      : 0;
  const maxAchievableTempC = Number((outdoorTempC + emitterOutputW / heatLossWPerK).toFixed(1));

  if (targetTempC <= startTempC) {
    return {
      startTempC,
      targetTempC,
      outdoorTempC,
      emitterOutputW,
      steadyHeatLossAtTargetW,
      netBoostPowerAtStartW,
      emitterLagMinutes,
      initialHeatingRateCPerHr,
      maxAchievableTempC,
      totalWarmupMinutes: 0,
      formattedDuration: '0m (At target)',
    };
  }

  if (maxAchievableTempC <= targetTempC + 0.25) {
    return {
      startTempC,
      targetTempC,
      outdoorTempC,
      emitterOutputW,
      steadyHeatLossAtTargetW,
      netBoostPowerAtStartW,
      emitterLagMinutes,
      initialHeatingRateCPerHr,
      maxAchievableTempC,
      totalWarmupMinutes: null,
      formattedDuration: `Max ${maxAchievableTempC}°C (Boost needed)`,
    };
  }

  const tauHours = thermalCapacitanceWhPerK / heatLossWPerK;
  const climbHours =
    tauHours * Math.log((maxAchievableTempC - startTempC) / (maxAchievableTempC - targetTempC));
  const totalWarmupMinutes = Math.round(emitterLagMinutes + climbHours * 60);

  return {
    startTempC,
    targetTempC,
    outdoorTempC,
    emitterOutputW,
    steadyHeatLossAtTargetW,
    netBoostPowerAtStartW,
    emitterLagMinutes,
    initialHeatingRateCPerHr,
    maxAchievableTempC,
    totalWarmupMinutes,
    formattedDuration: formatWarmupMinutes(totalWarmupMinutes),
  };
}

interface FloorXrayEntry {
  readonly mesh: THREE.Mesh;
  readonly originalMaterial: THREE.Material | THREE.Material[];
  readonly xrayMaterial: THREE.Material | THREE.Material[];
}

function cloneMaterialAsXray(mat: THREE.Material, opacity: number): THREE.Material {
  const cloned = mat.clone();
  cloned.transparent = true;
  cloned.opacity = opacity;
  cloned.depthWrite = false;
  cloned.needsUpdate = true;
  return cloned;
}

/**
 * Replaces interior corners of a 2D polyline with tangent-continuous circular-arc fillets.
 */
function roundPolylineCorners2D(
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

interface SerpentineRowSpec {
  readonly z: number;
  readonly minX: number;
  readonly maxX: number;
}

interface SerpentineColSpec {
  readonly x: number;
  readonly minZ: number;
  readonly maxZ: number;
}

interface ThermalBedRect {
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
function buildContinuousRowsSerpentinePath2D(
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
function buildContinuousColsSerpentinePath2D(
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

function makeUniformRows(
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
function addClosedUfhCircuit(
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
function buildRadiatorSupplyPipeRun(
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
      riserMesh.position.set(radX, pipeY + riserH * 0.5, vz);
      riserMesh.userData = { ufhZoneId: zoneId };
      runGroup.add(riserMesh);
      interactiveMeshes.push(riserMesh);
    }
  }

  parent.add(runGroup);
}

/**
 * Builds the Crox Farmhouse 4-Zone Heating Layer (Zones 1 & 2 Cast-Iron Radiator Circuits
 * in the two front rooms + Zones 3 & 4 Underfloor Heating Pipework across the Hall, Boot Lobby,
 * WC, Walk-In Cupboard, Dining Room, Kitchen & Utility Room) and synchronizes it with both
 * the Plant Room Manifold (`plantRoom.heatingManifold`) and the Understairs Cupboard
 * Secondary Manifold (`hall.understairsManifold`).
 */
export function buildCroxUnderfloorHeatingSystem(
  ctx: SceneBuilderContext
): CroxUfhSystemHandle {
  const { scene, interactiveMeshes } = ctx;

  const rootGroup = new THREE.Group();
  rootGroup.name = 'ufh.heatingPipesLayer';
  rootGroup.userData = { isArchitecturalShell: true, lodIgnore: true };
  rootGroup.visible = false; // Hidden until user toggles the Heating Pipes layer on
  scene.add(rootGroup);

  // Scoped East-West Wing UFH container (rotates and translates Loops 2–8 with the East-West Wing)
  const eastWingUfhGroup = new THREE.Group();
  eastWingUfhGroup.name = 'ufh.eastWingContainer';
  eastWingUfhGroup.position.set(...MAIN_EAST_WING_OFFSET);
  eastWingUfhGroup.rotation.y = MAIN_EAST_WING_ROTATION_Y;
  rootGroup.add(eastWingUfhGroup);

  // Initial 4-zone configuration matching Annotations #1–#8 + Utility Room:
  // - Zone 1 (Sitting Room) & Zone 2 (Living Room) are Cast-Iron Radiator zones (no UFH floor coils)
  // - Zone 3 (Entrance Hall, Main Hall, Boot Lobby, WC & Walk-In Cupboard) is UFH Zone
  // - Zone 4 (Dining Room, Kitchen & Utility Room) is UFH Zone
  const zones: UfhZoneState[] = [
    {
      id: 'ufhZone1',
      zoneNumber: 1,
      name: 'Zone 1 · Sitting Room (Radiators)',
      shortName: 'Z1 Sitting (Rads)',
      manifoldLabel: 'Plant Room · Radiator Circuit 1',
      roomZones: ['sittingRoom'],
      heatingOn: true,
      targetTempC: 21.0,
    },
    {
      id: 'ufhZone2',
      zoneNumber: 2,
      name: 'Zone 2 · Living Room (Radiators)',
      shortName: 'Z2 Living (Rads)',
      manifoldLabel: 'Plant Room · Radiator Circuit 2',
      roomZones: ['livingRoom'],
      heatingOn: false,
      targetTempC: 16.0,
    },
    {
      id: 'ufhZone3',
      zoneNumber: 3,
      name: 'Zone 3 · Hall, Boot Lobby, WC & Boot Room (UFH)',
      shortName: 'Z3 Hall/WC/Boot (UFH)',
      manifoldLabel: 'Manifold A (P1–4) & Boot Room Manifold B (P4)',
      roomZones: ['entranceHall', 'hall', 'bootLobby'],
      heatingOn: true,
      targetTempC: 19.5,
    },
    {
      id: 'ufhZone4',
      zoneNumber: 4,
      name: 'Zone 4 · Dining, Snug, Kitchen & Utility (UFH)',
      shortName: 'Z4 Dining/Kit/Util',
      manifoldLabel: 'Boot Room Manifold B · Ports 1–3',
      roomZones: ['familyRoom', 'kitchen', 'sitting', 'utility'],
      heatingOn: true,
      targetTempC: 20.5,
    },
  ];

  const pipeMats = new Map<UfhZoneId, THREE.MeshStandardMaterial>();
  const bedMats = new Map<UfhZoneId, THREE.MeshBasicMaterial>();

  for (const z of zones) {
    const pMat = new THREE.MeshStandardMaterial({
      color: z.heatingOn ? 0xff2416 : 0x1878ff,
      emissive: z.heatingOn ? 0xe61c0e : 0x0b4ec4,
      emissiveIntensity: z.heatingOn ? 0.86 : 0.72,
      roughness: 0.25,
      metalness: 0.08,
    });
    const bMat = new THREE.MeshBasicMaterial({
      color: z.heatingOn ? 0xff2b1a : 0x1878ff,
      transparent: true,
      opacity: z.heatingOn ? 0.15 : 0.11,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    pipeMats.set(z.id, pMat);
    bedMats.set(z.id, bMat);
  }

  // Primary 28mm insulated distribution trunk materials (Plant Room -> Manifold A -> Manifold B)
  const primaryFlowTrunkMat = new THREE.MeshStandardMaterial({
    color: 0xff3318,
    emissive: 0xd92008,
    emissiveIntensity: 0.9,
    roughness: 0.22,
    metalness: 0.2,
  });
  const primaryReturnTrunkMat = new THREE.MeshStandardMaterial({
    color: 0x2288ff,
    emissive: 0x0d52cc,
    emissiveIntensity: 0.75,
    roughness: 0.22,
    metalness: 0.2,
  });

  // =========================================================================
  // ZONE 1: SITTING ROOM RADIATORS (`sittingRoom`, Y = -0.60m — NO UFH Floor Coils!)
  //         2-pipe sub-floor radiator flow/return feeds to West Bay & East Wall Cast-Iron Radiators
  // =========================================================================
  buildRadiatorSupplyPipeRun(
    rootGroup,
    pipeMats.get('ufhZone1')!,
    interactiveMeshes,
    'ufhZone1',
    'ufh.zone1.sittingRoomWestBayRadiatorFeed',
    -0.6,
    [
      [-18.2, 8.46],
      [-18.2, 8.14],
      [-22.05, 8.14],
      [-22.05, 5.86],
      [-22.34, 5.86],
    ],
    0.98
  );
  buildRadiatorSupplyPipeRun(
    rootGroup,
    pipeMats.get('ufhZone1')!,
    interactiveMeshes,
    'ufhZone1',
    'ufh.zone1.sittingRoomEastWallRadiatorFeed',
    -0.6,
    [
      [-18.1, 8.46],
      [-17.32, 8.14],
      [-17.28, 5.92],
    ],
    0.98
  );

  // =========================================================================
  // ZONE 2: LIVING ROOM RADIATORS (`livingRoom`, Y = -0.60m — NO UFH Floor Coils!)
  //         2-pipe sub-floor radiator flow/return feeds to West Canted Bay & East Wall Cast-Iron Radiators
  // =========================================================================
  buildRadiatorSupplyPipeRun(
    rootGroup,
    pipeMats.get('ufhZone2')!,
    interactiveMeshes,
    'ufhZone2',
    'ufh.zone2.livingRoomWestBayRadiatorFeed',
    -0.6,
    [
      [-18.04, 8.46],
      [-18.04, 3.52],
      [-18.95, 3.52],
      [-18.95, 2.25],
      [-22.05, 1.84],
      [-22.05, -0.26],
      [-22.34, -0.26],
    ],
    0.98
  );
  buildRadiatorSupplyPipeRun(
    rootGroup,
    pipeMats.get('ufhZone2')!,
    interactiveMeshes,
    'ufhZone2',
    'ufh.zone2.livingRoomEastWallRadiatorFeed',
    -0.6,
    [
      [-18.95, 2.25],
      [-18.12, 2.36],
      [-17.831, -1.007],
    ],
    0.644
  );

  // =========================================================================
  // MANIFOLD A (`hall.understairsManifold`, Y = -0.30m, Ports 1–4):
  // ZONE 3 WEST & CENTRAL LOOPS (`entranceHall` #3 + `hall` #4 + `bootLobby` #5 + `downstairsWc` #7)
  // Zero loops cross the -0.30m -> 0.00m step or pass under the Wine Cellar!
  // =========================================================================
  const z3PipeMat = pipeMats.get('ufhZone3')!;
  const z3BedMat = bedMats.get('ufhZone3')!;

  // LOOP 1 (#3): Entrance Hall (`Y = -0.60m`, Manifold A Port 1, routing South into the Entrance Hall)
  const pManifoldAPort1Flow = transformEastWingTuple(-17.38, -0.3, -1.9);
  const pManifoldAPort1Ret = transformEastWingTuple(-17.32, -0.3, -1.9);
  addClosedUfhCircuit(
    rootGroup,
    z3PipeMat,
    z3BedMat,
    interactiveMeshes,
    'ufhZone3',
    'ufh.zone3.entranceHallLoop',
    -0.6,
    [
      {
        name: 'ufh.zone3.entranceHallLoop.thermalBed',
        minX: -22.05,
        maxX: -17.42,
        minZ: 2.86,
        maxZ: 3.44,
      },
    ],
    buildContinuousRowsSerpentinePath2D(
      [
        { z: 2.3, minX: -22.05, maxX: -20.9 },
        { z: 2.53, minX: -22.05, maxX: -19.5 },
        { z: 2.76, minX: -22.05, maxX: -18.2 },
        { z: 2.99, minX: -22.05, maxX: -17.46 },
        { z: 3.21, minX: -22.05, maxX: -17.46 },
        { z: 3.43, minX: -22.05, maxX: -17.46 },
      ],
      false, // Row 0 goes East -> West; Row 5 goes West -> East
      [
        [pManifoldAPort1Flow[0], pManifoldAPort1Flow[2]],
        [-17.38, 2.76],
        [-20.9, 2.3],
      ],
      [
        [-17.32, 3.43],
        [pManifoldAPort1Ret[0], pManifoldAPort1Ret[2]],
      ]
    )
  );

  // LOOP 2 (#4a): Main Staircase Hall South (`Y = -0.30m`, Manifold A Port 2 at Z = -1.97m / -2.01m)
  addClosedUfhCircuit(
    eastWingUfhGroup,
    z3PipeMat,
    z3BedMat,
    interactiveMeshes,
    'ufhZone3',
    'ufh.zone3.mainHallSouthLoop',
    -0.3,
    [
      {
        name: 'ufh.zone3.mainHallSouthLoop.thermalBed',
        minX: -16.4,
        maxX: -13.3,
        minZ: -0.25,
        maxZ: 2.15,
      },
    ],
    buildContinuousRowsSerpentinePath2D(
      makeUniformRows(-16.38, -13.3, -0.25, 2.15, 10),
      true, // Row 0 goes West -> East; Row 9 goes East -> West
      [
        [-17.38, -1.97],
        [-17.05, -1.97],
        [-16.38, -1.97],
      ],
      [
        [-16.46, 2.15],
        [-16.46, -2.01],
        [-17.05, -2.01],
        [-17.38, -2.01],
      ]
    )
  );

  // LOOP 3 (#4b): Main Staircase Hall North-East (`Y = -0.30m`, Manifold A Port 3 at Z = -2.05m / -2.09m)
  addClosedUfhCircuit(
    eastWingUfhGroup,
    z3PipeMat,
    z3BedMat,
    interactiveMeshes,
    'ufhZone3',
    'ufh.zone3.mainHallNorthEastLoop',
    -0.3,
    [
      {
        name: 'ufh.zone3.mainHallNorthEastLoop.thermalBed',
        minX: -15.25,
        maxX: -13.3,
        minZ: -1.88,
        maxZ: -0.52,
      },
    ],
    buildContinuousRowsSerpentinePath2D(
      makeUniformRows(-15.22, -13.3, -1.86, -0.52, 6),
      true,
      [
        [-17.38, -2.05],
        [-17.05, -2.05],
        [-15.22, -2.05],
      ],
      [
        [-15.3, -0.52],
        [-15.3, -2.09],
        [-17.05, -2.09],
        [-17.38, -2.09],
      ]
    )
  );

  // LOOP 4 (#7 + #5): Downstairs Cloakroom WC & Boot Lobby Combined Continuous Loop (`Y = -0.30m`, Manifold A Port 4 at Z = -2.13m / -2.17m)
  //                   Flows East in North corridor (Z = -2.13m) -> 3 N-S passes in open East half of WC (clear of West vanity & WC pan)
  //                   -> through WC doorway at X = -12.14m -> 8 E-W passes across Boot Lobby -> returns along X = -12.70m & -12.24m to Z = -2.17m!
  {
    const wcIn = roundPolylineCorners2D(
      [
        [-17.38, -2.13],
        [-17.05, -2.13],
        [-11.58, -2.13],
        [-11.58, -0.52],
      ],
      0.075,
      6
    );
    const wcBend1: Array<readonly [number, number]> = [];
    for (let s = 1; s < 12; s++) {
      const theta = (s / 12) * Math.PI;
      wcBend1.push([-11.72 + 0.14 * Math.cos(theta), -0.52 + 0.14 * Math.sin(theta)]);
    }
    const wcBend2: Array<readonly [number, number]> = [];
    for (let s = 1; s < 12; s++) {
      const theta = (s / 12) * Math.PI;
      wcBend2.push([-12.0 + 0.14 * Math.cos(theta), -1.96 - 0.14 * Math.sin(theta)]);
    }

    const bootLobbyRows: SerpentineRowSpec[] = [
      { z: 0.12, minX: -12.14, maxX: -10.05 },
      ...makeUniformRows(-12.62, -10.05, 0.41, 2.15, 7),
    ];
    const bootLobbySection = buildContinuousRowsSerpentinePath2D(
      bootLobbyRows,
      true, // Row 0 (z=0.12) goes West -> East; Row 7 (z=2.15) goes East -> West
      [[-12.14, -1.96]],
      [
        [-12.7, 2.15],
        [-12.7, 0.04],
        [-12.24, 0.04],
        [-12.24, -2.17],
        [-17.05, -2.17],
        [-17.38, -2.17],
      ]
    );

    const wcAndBootLobbyPts: Array<readonly [number, number]> = [
      ...wcIn,
      ...wcBend1,
      [-11.86, -0.52],
      [-11.86, -1.96],
      ...wcBend2,
      ...bootLobbySection,
    ];

    addClosedUfhCircuit(
      eastWingUfhGroup,
      z3PipeMat,
      z3BedMat,
      interactiveMeshes,
      'ufhZone3',
      'ufh.zone3.bootLobbyLoop',
      -0.3,
      [
        {
          name: 'ufh.zone3.bootLobbyLoop.thermalBed',
          minX: -12.68,
          maxX: -10.05,
          minZ: 0.08,
          maxZ: 2.15,
        },
        {
          name: 'ufh.zone3.downstairsWcLoop.thermalBed',
          minX: -12.22,
          maxX: -11.56,
          minZ: -2.22,
          maxZ: -0.38,
        },
      ],
      wcAndBootLobbyPts
    );
  }

  // =========================================================================
  // MANIFOLD B (`familyRoom.bootRoomManifold` at X = -7.98m, Y = 0.00m, Z = -1.95m, facing West `-X`, Ports 1–4):
  // SERVES ALL EAST WING 0.00m SLAB LOOPS (Boot Room Loop 5 + Dining/Snug Loop 6 + Kitchen Loop 7 + Utility/Sitting Loop 8)
  // =========================================================================

  // LOOP 5 (#8): Boot Room / Walk-In Cupboard (`familyRoom.walkInCupboard`, `Y = 0.00m`, Manifold B Port 4 at Z = -1.835m / -1.86m)
  //              4 N-S passes across the open checkerboard tile floor (`X = -8.98m..-8.32m, Z = -2.26m..-0.76m`,
  //              clear of both the West Boot Bench `X = -9.55m..-9.07m` and the East Boxed-In Manifold Cupboard `X = -8.22m..-7.97m`)
  addClosedUfhCircuit(
    eastWingUfhGroup,
    z3PipeMat,
    z3BedMat,
    interactiveMeshes,
    'ufhZone3',
    'ufh.zone3.walkInCupboardLoop',
    0.0,
    [
      {
        name: 'ufh.zone3.walkInCupboardLoop.thermalBed',
        minX: -9.02,
        maxX: -8.28,
        minZ: -2.3,
        maxZ: -0.75,
      },
    ],
    buildContinuousColsSerpentinePath2D(
      [
        { x: -8.32, minZ: -1.835, maxZ: -0.76 },
        { x: -8.54, minZ: -2.26, maxZ: -0.76 },
        { x: -8.76, minZ: -2.26, maxZ: -0.76 },
        { x: -8.98, minZ: -2.26, maxZ: -0.76 },
      ],
      true, // Col 0 (-8.32) goes North -> South; Col 3 (-8.98) goes South -> North
      [
        [-8.05, -1.835],
        [-8.32, -1.835],
      ],
      [
        [-8.98, -2.36],
        [-8.25, -2.36],
        [-8.25, -1.86],
        [-8.05, -1.86],
      ]
    )
  );

  // =========================================================================
  // ZONE 4: DINING ROOM, SNUG, KITCHEN & UTILITY ROOM UFH
  //         (`familyRoom` #6 + `kitchen` + `sitting` + `utility`, Y = 0.00m,
  //         Boot Room Manifold B Ports 1–3)
  // =========================================================================
  const z4PipeMat = pipeMats.get('ufhZone4')!;
  const z4BedMat = bedMats.get('ufhZone4')!;

  // LOOP 6 (#6): Dining Room Continuous L-Shaped Loop (`Y = 0.00m`, Manifold B Port 3 at Z = -1.91m / -1.885m)
  //              7 E-W rows in North Snug (`X = -7.46m..-4.88m, Z = -2.18m..-0.64m`) +
  //              11 E-W rows in Main Dining Room (`X = -9.28m..-4.88m, Z = -0.32m..+2.12m`)
  addClosedUfhCircuit(
    eastWingUfhGroup,
    z4PipeMat,
    z4BedMat,
    interactiveMeshes,
    'ufhZone4',
    'ufh.zone4.diningRoomMainLoop',
    0.0,
    [
      {
        name: 'ufh.zone4.diningRoomMainLoop.thermalBed',
        minX: -9.32,
        maxX: -4.88,
        minZ: -0.48,
        maxZ: 2.12,
      },
      {
        name: 'ufh.zone4.diningRoomSnugLoop.thermalBed',
        minX: -7.52,
        maxX: -4.88,
        minZ: -2.24,
        maxZ: -0.48,
      },
    ],
    buildContinuousRowsSerpentinePath2D(
      [
        ...makeUniformRows(-7.46, -4.88, -2.18, -0.64, 7),
        ...makeUniformRows(-9.28, -4.88, -0.32, 2.12, 11),
      ],
      true, // Row 0 goes West -> East; Row 6 goes West -> East (turning at East wall into Row 7); Row 17 goes East -> West
      [
        [-8.04, -1.91],
        [-7.6, -1.91],
        [-7.6, -2.18],
      ],
      [
        [-9.36, 2.12],
        [-9.36, -0.46],
        [-7.58, -0.46],
        [-7.58, -1.885],
        [-8.04, -1.885],
      ]
    )
  );

  // LOOP 7: Kitchen C-Shaped Island-Surround Continuous Loop (`Y = 0.00m`, Manifold B Port 2 at Z = -1.94m / -1.965m)
  //         Wraps continuously around the 3.80m × 1.52m Kitchen Island (`X = -2.82m..+0.98m, Z = -0.62m..+0.90m`)
  //         through 6 North Galley rows (`X = -3.56m..+1.68m, Z = -1.70m..-0.76m`),
  //         6 West Aisle rows (`X = -3.56m..-2.96m, Z = -0.54m..+0.80m`), and
  //         6 South Kitchen Floor rows (`X = -3.56m..+1.68m, Z = +1.02m..+2.18m`) with ZERO dead ends!
  addClosedUfhCircuit(
    eastWingUfhGroup,
    z4PipeMat,
    z4BedMat,
    interactiveMeshes,
    'ufhZone4',
    'ufh.zone4.kitchenWestAndIslandLoop',
    0.0,
    [
      {
        name: 'ufh.zone4.kitchenNorthGalleyLoop.thermalBed',
        minX: -3.56,
        maxX: 1.68,
        minZ: -1.72,
        maxZ: -0.72,
      },
      {
        name: 'ufh.zone4.kitchenWestAisleLoop.thermalBed',
        minX: -3.56,
        maxX: -2.92,
        minZ: -0.72,
        maxZ: 0.98,
      },
      {
        name: 'ufh.zone4.kitchenWestAndIslandLoop.thermalBed',
        minX: -3.56,
        maxX: 1.68,
        minZ: 0.98,
        maxZ: 2.2,
      },
    ],
    buildContinuousRowsSerpentinePath2D(
      [
        ...makeUniformRows(-3.56, 1.68, -1.7, -0.76, 6),
        ...makeUniformRows(-3.56, -2.96, -0.54, 0.8, 6),
        ...makeUniformRows(-3.56, 1.68, 1.02, 2.18, 6),
      ],
      true, // Row 0 goes West -> East; Row 5 ends at West (-3.56); Row 11 ends at West (-3.56); Row 17 ends at West (-3.56)
      [
        [-8.04, -1.94],
        [-7.64, -1.94],
        [-7.64, -2.34],
        [-3.56, -2.34],
      ],
      [
        [-3.64, 2.18],
        [-3.64, -2.38],
        [-7.68, -2.38],
        [-7.68, -1.965],
        [-8.04, -1.965],
      ]
    )
  );

  // LOOP 8: Utility Room + East Kitchen / Vaulted Sitting Bifold Combined Loop (`Y = 0.00m`, Manifold B Port 1 at Z = -2.00m / -2.025m)
  //         Enters Utility Room at `[+2.18, -1.72]`, snakes through 4 Utility rows (`Z = -1.72m..-0.96m, X = +2.18m..+4.78m`),
  //         passes South through the Utility Room doorway (`X = +2.68m`) directly into 10 East Kitchen / Sitting rows
  //         (`Z = -0.56m..+2.18m, X = +1.92m..+4.72m`), and returns North along `X = +1.80m` (between Loop 7 & Loop 8) to `Z = -2.46m`!
  {
    const utilRows = makeUniformRows(2.18, 4.78, -1.72, -0.96, 3);
    const utilPart = buildContinuousRowsSerpentinePath2D(
      utilRows,
      true, // Row 0 (-1.72) goes West -> East; Row 1 (-1.34) goes East -> West; Row 2 (-0.96) goes West -> East (ending at +4.78)
      [
        [-8.04, -2.0],
        [-7.72, -2.0],
        [-7.72, -2.42],
        [2.18, -2.42],
      ],
      [[4.78, -0.96]]
    );
    // Remove duplicate trailing point from utilPart before U-bending into Row 3 at z = -0.76m toward doorway
    const utilBendToDoor: Array<readonly [number, number]> = [];
    for (let s = 1; s < 12; s++) {
      const theta = (s / 12) * Math.PI;
      utilBendToDoor.push([4.68 + 0.1 * Math.sin(theta), -0.86 - 0.1 * Math.cos(theta)]);
    }

    const eastSittingSection = buildContinuousRowsSerpentinePath2D(
      makeUniformRows(1.92, 4.72, -0.56, 2.18, 10),
      true, // Row 0 (-0.56) goes West -> East; Row 9 (+2.18) goes East -> West (ending at +1.92)
      [
        [4.68, -0.76],
        [2.68, -0.76],
        [2.68, -0.66],
        [1.92, -0.66],
      ],
      [
        [1.8, 2.18],
        [1.8, -2.46],
        [-7.76, -2.46],
        [-7.76, -2.025],
        [-8.04, -2.025],
      ]
    );

    const combinedEastAndUtilityPts: Array<readonly [number, number]> = [
      ...utilPart.slice(0, -1),
      ...utilBendToDoor,
      ...eastSittingSection,
    ];

    addClosedUfhCircuit(
      eastWingUfhGroup,
      z4PipeMat,
      z4BedMat,
      interactiveMeshes,
      'ufhZone4',
      'ufh.zone4.kitchenEastSittingLoop',
      0.0,
      [
        {
          name: 'ufh.zone4.kitchenEastSittingLoop.thermalBed',
          minX: 1.88,
          maxX: 4.72,
          minZ: -0.62,
          maxZ: 2.18,
        },
        {
          name: 'ufh.zone4.utilityRoomLoop.thermalBed',
          minX: 2.18,
          maxX: 4.82,
          minZ: -1.76,
          maxZ: -0.74,
        },
      ],
      combinedEastAndUtilityPts
    );
  }

  // =========================================================================
  // 28mm INSULATED PRIMARY DISTRIBUTION MAINS
  // (Plant Room Boilers -> Manifold A Understairs -> Manifold B Boot Room East Wall)
  // =========================================================================
  {
    const trunkGroup = new THREE.Group();
    trunkGroup.name = 'ufh.primaryDistributionMains';

    const addPrimaryPipeChain = (
      prefix: string,
      mat: THREE.MeshStandardMaterial,
      pts: ReadonlyArray<readonly [number, number, number]>
    ): void => {
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0, z0] = pts[i];
        const [x1, y1, z1] = pts[i + 1];
        const p0 = new THREE.Vector3(x0, y0, z0);
        const p1 = new THREE.Vector3(x1, y1, z1);
        const len = p0.distanceTo(p1);
        if (len < 1e-4) continue;
        const cyl = new THREE.Mesh(
          new THREE.CylinderGeometry(0.018, 0.018, len, 10),
          mat
        );
        cyl.name = `${prefix}.${i + 1}`;
        cyl.position.copy(p0).add(p1).multiplyScalar(0.5);
        cyl.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          p1.clone().sub(p0).normalize()
        );
        trunkGroup.add(cyl);
      }
    };

    // 28mm Insulated Primary Flow Trunk (Plant Room -> Manifold A -> steps up at X=-9.80..-9.56 -> Manifold B Boot Room East Wall)
    addPrimaryPipeChain('ufh.primaryDistributionMains.flow', primaryFlowTrunkMat, [
      [-18.43, -0.63, 8.42],
      [-17.45, -0.63, 8.2],
      transformEastWingTuple(-17.45, -0.63, 2.15),
      transformEastWingTuple(-17.45, -0.33, 2.05),
      transformEastWingTuple(-17.45, -0.33, -2.44),
      transformEastWingTuple(-9.8, -0.33, -2.44),
      transformEastWingTuple(-9.56, -0.03, -2.44),
      transformEastWingTuple(-8.052, -0.03, -2.44),
      transformEastWingTuple(-8.052, -0.03, -2.125),
      transformEastWingTuple(-8.052, 0.08, -2.125),
    ]);
    // Manifold A Flow Tee Riser
    addPrimaryPipeChain('ufh.primaryDistributionMains.manifoldAFlowTee', primaryFlowTrunkMat, [
      transformEastWingTuple(-17.45, -0.33, -1.865),
      transformEastWingTuple(-17.4, -0.2, -1.865),
    ]);

    // 28mm Insulated Primary Return Trunk (Plant Room -> Manifold A -> steps up at X=-9.80..-9.56 -> Manifold B Boot Room East Wall)
    addPrimaryPipeChain('ufh.primaryDistributionMains.return', primaryReturnTrunkMat, [
      [-18.37, -0.63, 8.42],
      [-17.39, -0.63, 8.2],
      transformEastWingTuple(-17.39, -0.63, 2.15),
      transformEastWingTuple(-17.39, -0.33, 2.05),
      transformEastWingTuple(-17.39, -0.33, -2.48),
      transformEastWingTuple(-9.8, -0.33, -2.48),
      transformEastWingTuple(-9.56, -0.03, -2.48),
      transformEastWingTuple(-8.052, -0.03, -2.48),
      transformEastWingTuple(-8.052, -0.03, -2.17),
      transformEastWingTuple(-8.052, 0.08, -2.17),
    ]);
    // Manifold A Return Tee Riser
    addPrimaryPipeChain('ufh.primaryDistributionMains.manifoldAReturnTee', primaryReturnTrunkMat, [
      transformEastWingTuple(-17.39, -0.33, -1.82),
      transformEastWingTuple(-17.4, -0.2, -1.82),
    ]);

    rootGroup.add(trunkGroup);
  }

  // =========================================================================
  // CAST-IRON RADIATOR RED/BLUE HIGHLIGHTING FOR FRONT 2 ROOMS (ZONES 1 & 2)
  // =========================================================================
  interface RadiatorMeshEntry {
    readonly mesh: THREE.Mesh;
    readonly zoneId: UfhZoneId;
    readonly originalMaterial: THREE.Material | THREE.Material[];
  }
  let radiatorMeshEntries: RadiatorMeshEntry[] | null = null;

  const ensureRadiatorMeshEntries = (): RadiatorMeshEntry[] => {
    if (radiatorMeshEntries) return radiatorMeshEntries;
    const entries: RadiatorMeshEntry[] = [];
    const radBindings: ReadonlyArray<readonly [string, UfhZoneId]> = [
      ['sittingRoom.castIronRadiator.westBay', 'ufhZone1'],
      ['sittingRoom.castIronRadiator.eastWall', 'ufhZone1'],
      ['livingRoom.castIronRadiator.westBay', 'ufhZone2'],
      ['livingRoom.castIronRadiator.eastWall', 'ufhZone2'],
    ];
    for (const [radName, zoneId] of radBindings) {
      const radObj = scene.getObjectByName(radName);
      if (!radObj) continue;
      radObj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.userData = { ...child.userData, ufhZoneId: zoneId };
          interactiveMeshes.push(child);
          entries.push({
            mesh: child,
            zoneId,
            originalMaterial: child.material,
          });
        }
      });
    }
    radiatorMeshEntries = entries;
    return entries;
  };

  const syncRadiatorMaterials = (visible: boolean): void => {
    const entries = ensureRadiatorMeshEntries();
    for (const entry of entries) {
      if (!visible) {
        entry.mesh.material = entry.originalMaterial;
      } else {
        const zMat = pipeMats.get(entry.zoneId);
        if (zMat) {
          entry.mesh.material = zMat;
        }
      }
    }
  };

  // =========================================================================
  // X-RAY TRANSLUCENT FLOOR & RUG CONTROLLER (active when UFH Layer is visible)
  // =========================================================================
  let floorXrayEntries: FloorXrayEntry[] | null = null;

  const ensureFloorXrayEntries = (): FloorXrayEntry[] => {
    if (floorXrayEntries) return floorXrayEntries;
    const entries: FloorXrayEntry[] = [];
    const box = new THREE.Box3();
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();

    scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh)) return;
      // Do not touch UFH layer meshes or annotation markers
      let cur: THREE.Object3D | null = obj;
      while (cur) {
        if (
          cur === rootGroup ||
          cur.userData?.isAnnotationGroup ||
          cur.name === 'hall.stairs'
        ) {
          return;
        }
        cur = cur.parent;
      }

      const name = obj.name;
      const isNamedGroundFloorOrRug =
        name === 'entranceHall.floor' ||
        name === 'bootLobby.floor' ||
        name === 'bootLobby.downstairsWc.marbleFloor' ||
        name === 'familyRoom.walkInCupboard.checkerTileFloor' ||
        name.startsWith('hall.roundRug') ||
        name.startsWith('familyRoom.diningRug');

      box.setFromObject(obj);
      box.getSize(size);
      box.getCenter(center);

      // Ground-floor slabs have thin vertical height (0.004m..0.13m), large horizontal footprint,
      // and sit at one of the three Ground Floor tiers (-0.64m, -0.34m, or -0.06m..+0.01m) inside the house
      const isGroundFloorSlabByBounds =
        size.y >= 0.003 &&
        size.y <= 0.135 &&
        size.x >= 1.2 &&
        size.z >= 1.2 &&
        center.y >= -0.67 &&
        center.y <= 0.025 &&
        center.x >= -23.0 &&
        center.x <= 5.2 &&
        center.z >= -2.65 &&
        center.z <= 11.6;

      if (isNamedGroundFloorOrRug || isGroundFloorSlabByBounds) {
        const origMat = obj.material;
        const opacity = size.y < 0.025 ? 0.16 : 0.24;
        const xrayMat = Array.isArray(origMat)
          ? origMat.map((m) => cloneMaterialAsXray(m, opacity))
          : cloneMaterialAsXray(origMat, opacity);
        entries.push({
          mesh: obj,
          originalMaterial: origMat,
          xrayMaterial: xrayMat,
        });
      }
    });

    floorXrayEntries = entries;
    return entries;
  };

  const setActuatorIndicatorColor = (obj: THREE.Object3D | undefined, isOn: boolean): void => {
    if (!(obj instanceof THREE.Mesh) || !(obj.material instanceof THREE.MeshStandardMaterial)) {
      return;
    }
    if (!obj.userData?.ufhClonedMat) {
      obj.material = obj.material.clone();
      obj.userData = { ...obj.userData, ufhClonedMat: true };
    }
    const mat = obj.material as THREE.MeshStandardMaterial;
    mat.color.setHex(isOn ? 0xff3b1f : 0x1878ff);
    mat.emissive.setHex(isOn ? 0xe62600 : 0x0b4ec4);
    mat.emissiveIntensity = isOn ? 0.95 : 0.75;
  };

  // Sync manifold actuator caps on Plant Room Manifold, Manifold A (Understairs), and Manifold B (Boot Room)
  const syncManifoldActuatorLeds = (): void => {
    const z1On = zones[0].heatingOn;
    const z2On = zones[1].heatingOn;
    const z3On = zones[2].heatingOn;
    const z4On = zones[3].heatingOn;

    // Plant Room Manifold ports 1–2 (Z1 Radiators), 3–4 (Z2 Radiator), 5 (Z3 Entrance Hall)
    const plantPortStates = [z1On, z1On, z2On, z2On, z3On, z1On, z2On, z3On, z4On, z4On];
    for (let p = 0; p < plantPortStates.length; p++) {
      const cap = scene.getObjectByName(
        `plantRoom.heatingManifold.zoneActuator.${p + 1}.statusCap`
      );
      setActuatorIndicatorColor(cap, plantPortStates[p]);
    }

    // Manifold A (`hall.understairsManifold`) Ports 1–4 (Z3 UFH: Entrance Hall, Main Hall S/NE, WC & Boot Lobby)
    const understairsPortStates = [z3On, z3On, z3On, z3On];
    for (let p = 0; p < understairsPortStates.length; p++) {
      const isOn = understairsPortStates[p];
      for (const objName of [
        `hall.understairsManifold.zoneActuator.${p + 1}.statusCap`,
        `hall.understairsManifold.wiringLed.${p + 1}`,
      ]) {
        setActuatorIndicatorColor(scene.getObjectByName(objName), isOn);
      }
    }

    // Manifold B (`familyRoom.bootRoomManifold`) Ports 1–3 (Z4 Utility/Sitting, Kitchen, Dining/Snug) + Port 4 (Z3 Boot Room)
    const bootRoomPortStates = [z4On, z4On, z4On, z3On];
    for (let p = 0; p < bootRoomPortStates.length; p++) {
      const isOn = bootRoomPortStates[p];
      for (const objName of [
        `familyRoom.bootRoomManifold.zoneActuator.${p + 1}.statusCap`,
        `familyRoom.bootRoomManifold.wiringLed.${p + 1}`,
      ]) {
        setActuatorIndicatorColor(scene.getObjectByName(objName), isOn);
      }
    }

    // Update primary 28mm trunk line between Plant Room, Manifold A, and Manifold B
    const anySecondaryOn = z3On || z4On;
    primaryFlowTrunkMat.color.setHex(anySecondaryOn ? 0xff3318 : 0x1878ff);
    primaryFlowTrunkMat.emissive.setHex(anySecondaryOn ? 0xd92008 : 0x0b4ec4);
  };

  let layerVisible = false;

  const updateZoneMaterials = (zone: UfhZoneState): void => {
    const pMat = pipeMats.get(zone.id);
    const bMat = bedMats.get(zone.id);
    if (pMat) {
      pMat.color.setHex(zone.heatingOn ? 0xff2416 : 0x1878ff);
      pMat.emissive.setHex(zone.heatingOn ? 0xe61c0e : 0x0b4ec4);
      pMat.emissiveIntensity = zone.heatingOn ? 0.86 : 0.72;
    }
    if (bMat) {
      bMat.color.setHex(zone.heatingOn ? 0xff2b1a : 0x1878ff);
      bMat.opacity = zone.heatingOn ? 0.15 : 0.11;
    }
    syncManifoldActuatorLeds();
    if (layerVisible) {
      syncRadiatorMaterials(true);
    }
  };

  let envConfig: HeatingEnvironmentConfig = {
    outdoorTempC: 5,
    startMode: 'setback',
  };

  const listeners = new Set<() => void>();
  const notifyListeners = (): void => {
    for (const cb of listeners) {
      cb();
    }
  };

  const getRoomThermalProfile = (roomZoneId: RoomZoneId): RoomThermalProfile | undefined =>
    ROOM_THERMAL_PROFILES.find((p) => p.roomZoneId === roomZoneId);

  const getRoomWarmupEstimate = (roomZoneId: RoomZoneId): ThermalWarmupEstimate | undefined => {
    const profile = getRoomThermalProfile(roomZoneId);
    if (!profile) return undefined;
    const startTempC =
      envConfig.startMode === 'setback' ? profile.setbackStartTempC : profile.coldStartTempC;
    return computeWarmupEstimateFromParams(
      startTempC,
      profile.targetTempC,
      envConfig.outdoorTempC,
      profile.emitterOutputW,
      profile.heatLossWPerK,
      profile.thermalCapacitanceWhPerK,
      profile.emitterLagMinutes
    );
  };

  const getZoneWarmupEstimate = (zoneId: UfhZoneId): ThermalWarmupEstimate => {
    const zoneProfiles = ROOM_THERMAL_PROFILES.filter((p) => p.ufhZoneId === zoneId);
    if (zoneProfiles.length === 0) {
      return computeWarmupEstimateFromParams(18, 21, envConfig.outdoorTempC, 2000, 60, 300, 30);
    }
    let totalArea = 0;
    let emitterOutputW = 0;
    let heatLossWPerK = 0;
    let thermalCapacitanceWhPerK = 0;
    let weightedLag = 0;
    let weightedStart = 0;
    let weightedTarget = 0;

    for (const p of zoneProfiles) {
      totalArea += p.floorAreaM2;
      emitterOutputW += p.emitterOutputW;
      heatLossWPerK += p.heatLossWPerK;
      thermalCapacitanceWhPerK += p.thermalCapacitanceWhPerK;
      weightedLag += p.emitterLagMinutes * p.floorAreaM2;
      const startT = envConfig.startMode === 'setback' ? p.setbackStartTempC : p.coldStartTempC;
      weightedStart += startT * p.floorAreaM2;
      weightedTarget += p.targetTempC * p.floorAreaM2;
    }

    const startTempC = Number((weightedStart / totalArea).toFixed(1));
    const targetTempC = Number((weightedTarget / totalArea).toFixed(1));
    const emitterLagMinutes = Math.round(weightedLag / totalArea);

    return computeWarmupEstimateFromParams(
      startTempC,
      targetTempC,
      envConfig.outdoorTempC,
      emitterOutputW,
      heatLossWPerK,
      thermalCapacitanceWhPerK,
      emitterLagMinutes
    );
  };

  const setLayerVisible = (visible: boolean): void => {
    if (layerVisible === visible) return;
    layerVisible = visible;
    rootGroup.visible = visible;

    const entries = ensureFloorXrayEntries();
    for (const entry of entries) {
      entry.mesh.material = visible ? entry.xrayMaterial : entry.originalMaterial;
    }

    syncRadiatorMaterials(visible);

    // Automatically swing open the Understairs Cupboard door (Manifold A), the Boot Room door,
    // and the Boxed-In Boot Room Manifold Cupboard door (Manifold B) when the UFH layer is active!
    for (const leafName of [
      'hall.stairs.understairsCupboardDoor.leaf',
      'familyRoom.bootRoomManifoldCupboard.door.leaf',
    ]) {
      const doorLeaf = scene.getObjectByName(leafName);
      const doorPivot = doorLeaf?.parent;
      const doorId = doorPivot?.userData?.interactableId as string | undefined;
      if (doorId) {
        ctx.interactions.setHingedDoorOpen(doorId, visible);
      }
    }
    ctx.interactions.setHingedDoorOpen('familyCupboardDoor', visible);

    if (visible) {
      syncManifoldActuatorLeds();
    }
    notifyListeners();
  };

  return {
    rootGroup,
    isLayerVisible: () => layerVisible,
    setLayerVisible,
    toggleLayerVisible: () => {
      setLayerVisible(!layerVisible);
      return layerVisible;
    },
    getZones: () => zones,
    getZone: (zoneId) => zones.find((z) => z.id === zoneId),
    getZoneForRoom: (roomZoneId) => zones.find((z) => z.roomZones.includes(roomZoneId)),
    isZoneOn: (zoneId) => zones.find((z) => z.id === zoneId)?.heatingOn ?? false,
    setZoneOn: (zoneId, on) => {
      const zone = zones.find((z) => z.id === zoneId);
      if (!zone || zone.heatingOn === on) return;
      zone.heatingOn = on;
      zone.targetTempC = on ? 21.0 : 16.0;
      updateZoneMaterials(zone);
      notifyListeners();
    },
    toggleZone: (zoneId) => {
      const zone = zones.find((z) => z.id === zoneId);
      if (!zone) return false;
      zone.heatingOn = !zone.heatingOn;
      zone.targetTempC = zone.heatingOn ? 21.0 : 16.0;
      updateZoneMaterials(zone);
      notifyListeners();
      return zone.heatingOn;
    },
    setAllZones: (on) => {
      let changed = false;
      for (const zone of zones) {
        if (zone.heatingOn !== on) {
          zone.heatingOn = on;
          zone.targetTempC = on ? 21.0 : 16.0;
          updateZoneMaterials(zone);
          changed = true;
        }
      }
      if (changed) {
        notifyListeners();
      }
    },
    getEnvironment: () => envConfig,
    setOutdoorTempC: (outdoorTempC: number) => {
      if (envConfig.outdoorTempC === outdoorTempC) return;
      envConfig = { ...envConfig, outdoorTempC };
      notifyListeners();
    },
    setStartMode: (startMode: HeatingStartMode) => {
      if (envConfig.startMode === startMode) return;
      envConfig = { ...envConfig, startMode };
      notifyListeners();
    },
    getZoneWarmupEstimate,
    getRoomThermalProfile,
    getRoomWarmupEstimate,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
