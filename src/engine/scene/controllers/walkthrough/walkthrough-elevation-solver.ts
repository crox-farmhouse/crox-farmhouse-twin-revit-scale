import * as THREE from 'three';
import type { SceneCameraPoseSnapshot } from '../../../../types/scene.ts';
import { DEFAULT_WALKTHROUGH_SPAWNS, worldToEastWingLocal } from './walkthrough-spawns.ts';

const OB_ROT = Math.atan2(2.49, 28.98);
const OB_COS = Math.cos(OB_ROT);
const OB_SIN = Math.sin(OB_ROT);

export function worldToOutbuildingLocal(
  x: number,
  z: number
): { readonly obU: number; readonly obV: number } {
  const obDx = x - -22.47;
  const obDz = z - 16.0;
  return {
    obU: obDx * OB_COS - obDz * OB_SIN,
    obV: obDx * OB_SIN + obDz * OB_COS,
  };
}

export function isInsideSpiralStaircaseCutout(x: number, z: number): boolean {
  const { obU, obV } = worldToOutbuildingLocal(x, z);
  return obU >= 21.12 && obU <= 23.02 && obV >= 3.52 && obV <= 5.42;
}

/**
 * Resolves continuous floor, stair, ramp, mezzanine, spiral-staircase, and graded courtyard
 * ground elevation at world position `(x, z)` given the player's reference foot height `refFootY`.
 */
export function sampleFloorElevation(x: number, refFootY: number, z: number): number {
  const { ewX, ewZ } = worldToEastWingLocal(x, z);

  // 1. Main Hall Quarter-Turn Staircase (smooth continuous analytical elevation Up & Down)
  // 1a. Upper Flight (climbing East +X along the North wall from X = -16.64m at Y = 0.84m to X = -15.36m at Y = 2.16m)
  if (ewX >= -16.64 && ewX <= -15.26 && ewZ >= -2.55 && ewZ <= -1.58 && refFootY >= 0.35) {
    const tUpper = THREE.MathUtils.clamp((ewX - -16.64) / (-15.36 - -16.64), 0, 1);
    return 0.84 + tUpper * (2.16 - 0.84);
  }

  // 1b. Quarter-Turn Landing (X = -17.58m..-16.58m, Z = -2.55m..-1.62m at Y = +0.84m)
  if (
    ewX >= -17.58 &&
    ewX <= -16.58 &&
    ewZ >= -2.55 &&
    ewZ <= -1.62 &&
    refFootY >= 0.15 &&
    refFootY <= 1.65
  ) {
    return 0.84;
  }

  // 1c. Lower Flight (climbing North -Z along the West wall from Z = -0.32m at Y = -0.30m to Z = -1.62m at Y = +0.84m)
  if (ewX >= -17.58 && ewX <= -16.58 && ewZ >= -1.62 && ewZ <= -0.24 && refFootY <= 1.55) {
    const tLower = THREE.MathUtils.clamp((-0.32 - ewZ) / (-0.32 - -1.62), 0, 1);
    return -0.3 + tLower * (0.84 - -0.3);
  }

  // 2. First Floor Rooms & Doorways (strictly bounded to the actual First Floor footprint)
  const inEastWingFirstFloor = ewX >= -17.85 && ewX <= -4.4 && ewZ >= -2.75 && ewZ <= 2.45;
  const inWestWingFirstFloor = x >= -22.5 && x <= -16.88 && z >= -3.25 && z <= 11.75;
  if (refFootY >= 1.65 && (inEastWingFirstFloor || inWestWingFirstFloor)) {
    if (inEastWingFirstFloor) {
      if (ewX >= -9.56) return 2.34;
      if (ewX >= -9.8) {
        return THREE.MathUtils.lerp(2.16, 2.34, (ewX - -9.8) / 0.24);
      }
      return 2.16;
    }
    return 2.08;
  }

  // 2b. Outbuilding Barn Mezzanine (`1.54m`), Spiral Staircase, 3 `UP` Steps (`1.54m..2.08m`), Stable Top Floor (`2.08m`)
  const { obU, obV } = worldToOutbuildingLocal(x, z);
  if (obV >= 0.25 && obV <= 5.45 && obU >= 0.25 && obU <= 28.8) {
    const stairDu = obU - 22.08;
    const stairDv = obV - 4.5;
    const stairDist = Math.hypot(stairDu, stairDv);
    const thetaStart = -Math.PI * 0.65;
    const thetaEnd = Math.PI * 0.82;
    const rawTheta = Math.atan2(stairDv, stairDu);

    const inSpiralStairwellCutout = obU >= 21.14 && obU <= 23.02 && obV >= 3.56;
    if (inSpiralStairwellCutout || (stairDist <= 1.02 && obV >= 3.48)) {
      if (
        refFootY >= 0.65 &&
        obU >= 21.12 &&
        obU <= 22.04 &&
        obV >= 3.54 &&
        obV <= 4.92 &&
        stairDu <= 0.02 &&
        (stairDv <= 0.04 || rawTheta >= thetaEnd)
      ) {
        return 1.54;
      }

      if (rawTheta >= thetaStart && rawTheta <= thetaEnd) {
        const tStair = THREE.MathUtils.clamp(
          (rawTheta - thetaStart) / (thetaEnd - thetaStart),
          0,
          1
        );
        const stairY = THREE.MathUtils.lerp(-0.675, 1.54, tStair);
        if (refFootY >= 0.45 || stairY <= refFootY + 0.68) {
          return stairY;
        }
      } else if (refFootY >= 0.65) {
        return 1.54;
      }
    }

    if (refFootY >= 1.15 && obU >= 18.65 && !inSpiralStairwellCutout) {
      if (obU >= 23.22) return 2.08;
      if (obU >= 22.35 && obV >= 2.35 && obV <= 3.35) {
        const tUp = THREE.MathUtils.clamp((obU - 22.4) / (23.22 - 22.4), 0, 1);
        return THREE.MathUtils.lerp(1.54, 2.08, tUp);
      }
      return 1.54;
    }
    if (obU < 5.87) return -0.588;
    if (obU < 12.19) return -0.5;
    if (obU < 15.08) return -0.4;
    if (obU < 18.18) return -0.34;
    if (obU < 18.46) {
      const tDrop = THREE.MathUtils.clamp((obU - 18.18) / 0.28, 0, 1);
      return THREE.MathUtils.lerp(-0.34, -0.675, tDrop);
    }
    if (obU < 23.12) return -0.675;
    return -0.44;
  }

  // 3. Ground Floor East Wing (Kitchen +0.05m -> Dining Room 0.00m -> Boot Lobby & Main Hall -0.30m)
  if (ewX >= -17.62 && ewX <= 4.35 && ewZ >= -2.85 && ewZ <= 2.62) {
    if (ewX >= -4.45) return 0.05;
    if (ewX >= -4.68) return THREE.MathUtils.lerp(0.0, 0.05, (ewX - -4.68) / 0.23);
    if (ewX >= -9.58) return 0.0;
    if (ewX >= -9.8) return THREE.MathUtils.lerp(-0.3, 0.0, (ewX - -9.8) / 0.22);
    return -0.3;
  }

  // 4. Ground Floor West Wing (Living Room, Front Entrance Hall, Sitting Room, Study, Plant Room at -0.60m)
  if (x <= -17.05 && z <= 11.8) {
    if (x >= -17.75 && z >= -2.55 && z <= 2.65) {
      return THREE.MathUtils.lerp(-0.6, -0.3, (x - -17.75) / 0.6);
    }
    return -0.6;
  }

  // 5. Outdoor Courtyard, Raised Limestone Terrace & Grounds (continuous graded courtyard elevation)
  const northZ = 2.61 - (x - -16.92) * (0.705 / 5.27) - 0.05;
  const tx = Math.max(0, Math.min(1, (-4.52 - x) / 11.43));
  const smoothTx = 0.55 * tx + 0.45 * tx * tx * (3 - 2 * tx);

  const northTx = Math.max(0, Math.min(1, (-8.2 - x) / 6.8));
  const smoothNorthTx = northTx * northTx * (3 - 2 * northTx);

  const tz = Math.max(0, Math.min(1, (z - northZ) / Math.max(1.0, 8.65 - northZ)));
  const smoothTz = 0.5 * tz + 0.5 * tz * tz * (3 - 2 * tz);

  const westEdgeY = -0.3 * smoothNorthTx * (1 - smoothTz) - 0.6 * smoothTz;
  const westDrop = westEdgeY * smoothTx;

  const seStartZ = northZ + 4.35;
  const seTz = Math.max(0, Math.min(1, (z - seStartZ) / 9.0));
  const smoothSeTz = seTz * seTz * (3 - 2 * seTz);
  const eastDrop = -0.18 * (1 - smoothTx) * smoothSeTz;

  return westDrop + eastDrop;
}

/**
 * Evaluates analytical staircase, mezzanine balustrade, spiral-staircase column/banister,
 * and canted bay-window clearance bounds before running generic OBB/raycast obstacle checks.
 */
export function evaluateArchitecturalWalkwayBounds(
  fromFoot: THREE.Vector3,
  nextX: number,
  nextZ: number
): 'blocked' | 'clear' | 'check_obstacles' {
  const curEw = worldToEastWingLocal(fromFoot.x, fromFoot.z);
  const nextEw = worldToEastWingLocal(nextX, nextZ);

  // 1. First Floor Landing gallery balustrade guardrail around the stairwell void
  if (
    fromFoot.y >= 1.85 &&
    nextEw.ewX >= -17.58 &&
    nextEw.ewX <= -15.34 &&
    nextEw.ewZ >= -1.64 &&
    nextEw.ewZ <= -0.54
  ) {
    return 'blocked';
  }

  // 2. Clean 2D corridor & balustrade bounds when walking UP or DOWN the Main Hall staircase
  const onUpperFlightOrMouth =
    fromFoot.y >= 0.65 &&
    curEw.ewX >= -16.68 &&
    curEw.ewX <= -15.05 &&
    curEw.ewZ >= -2.52 &&
    curEw.ewZ <= -1.58;
  const onQuarterLanding =
    fromFoot.y >= 0.25 &&
    fromFoot.y <= 1.55 &&
    curEw.ewX >= -17.55 &&
    curEw.ewX <= -16.55 &&
    curEw.ewZ >= -2.52 &&
    curEw.ewZ <= -1.55;
  const onLowerFlight =
    fromFoot.y <= 1.35 &&
    curEw.ewX >= -17.55 &&
    curEw.ewX <= -16.58 &&
    curEw.ewZ >= -1.65 &&
    curEw.ewZ <= -0.15;

  if (onUpperFlightOrMouth || onQuarterLanding || onLowerFlight) {
    if (nextEw.ewZ < -2.22 || nextEw.ewX < -17.28) return 'blocked';
    if (
      fromFoot.y >= 0.72 &&
      nextEw.ewX > -16.58 &&
      nextEw.ewX < -15.36 &&
      nextEw.ewZ > -1.69
    ) {
      return 'blocked';
    }
    if (
      fromFoot.y <= 1.35 &&
      nextEw.ewZ > -1.58 &&
      nextEw.ewZ < -0.35 &&
      nextEw.ewX > -16.68
    ) {
      return 'blocked';
    }
    return 'clear';
  }

  // 2a-ii. Outbuilding Barn Mezzanine Balustrades, Spiral Staircase, and 3-Step `UP` Stair
  const { obU: curObU, obV: curObV } = worldToOutbuildingLocal(fromFoot.x, fromFoot.z);
  const { obU: nextObU, obV: nextObV } = worldToOutbuildingLocal(nextX, nextZ);

  if (fromFoot.y >= 1.15 && curObU >= 18.68 && curObU <= 23.02 && nextObU < 18.92) {
    return 'blocked';
  }

  if (fromFoot.y >= 0.85 && curObU >= 18.68 && curObU <= 23.05) {
    if (
      curObU <= 22.05 &&
      nextObU > 21.84 &&
      nextObU > curObU &&
      nextObV >= 3.48 &&
      nextObV <= 4.52
    ) {
      return 'blocked';
    }
    if (
      curObV <= 3.58 &&
      nextObV > 3.36 &&
      nextObV > curObV &&
      nextObU >= 21.92 &&
      nextObU <= 23.02
    ) {
      return 'blocked';
    }
    if (nextObV >= 4.78) {
      if (curObU <= 21.14 && nextObU > 20.94 && nextObU > curObU) return 'blocked';
      if (curObU > 21.14 && nextObU < 21.28 && nextObU < curObU) return 'blocked';
    }
  }

  const curStairDu = curObU - 22.08;
  const curStairDv = curObV - 4.5;
  const curStairDist = Math.hypot(curStairDu, curStairDv);
  const nextStairDu = nextObU - 22.08;
  const nextStairDv = nextObV - 4.5;
  const nextStairDist = Math.hypot(nextStairDu, nextStairDv);

  const onSpiralTopLanding =
    fromFoot.y >= 0.85 &&
    curObU >= 21.05 &&
    curObU <= 22.04 &&
    curObV >= 3.52 &&
    curObV <= 4.88 &&
    curStairDu <= 0.02 &&
    (curStairDv <= 0.05 || Math.atan2(curStairDv, curStairDu) >= Math.PI * 0.78);
  const onSpiralHelixTreads =
    fromFoot.y > -0.64 &&
    fromFoot.y < 1.52 &&
    curObU >= 21.12 &&
    curObU <= 23.0 &&
    curObV >= 3.5 &&
    curObV <= 5.42 &&
    curStairDist <= 0.96;
  const atSpiralBottomEntry =
    fromFoot.y <= -0.2 &&
    curObU >= 21.35 &&
    curObU <= 22.45 &&
    curObV >= 3.42 &&
    curObV <= 4.35 &&
    curStairDist <= 0.96;

  if (onSpiralTopLanding || onSpiralHelixTreads || atSpiralBottomEntry) {
    if (nextObV > 5.22 || nextObU > 22.84) return 'blocked';
    if (nextStairDist < 0.23 && nextStairDist < curStairDist) return 'blocked';
    const exitingTopLandingToMezzanine =
      fromFoot.y >= 0.95 && nextObU <= 22.0 && nextObV <= 4.78;
    const exitingBottomToBarnFloor =
      fromFoot.y <= -0.15 && nextObU >= 21.2 && nextObU <= 22.25 && nextObV <= 4.18;
    if (
      !exitingTopLandingToMezzanine &&
      !exitingBottomToBarnFloor &&
      nextStairDist > 0.81 &&
      nextStairDist > curStairDist
    ) {
      return 'blocked';
    }
    return 'clear';
  }

  if (
    fromFoot.y >= 1.35 &&
    curObU >= 22.15 &&
    curObU <= 23.55 &&
    curObV >= 2.38 &&
    curObV <= 3.32
  ) {
    return nextObV < 2.4 || nextObV > 3.3 ? 'blocked' : 'clear';
  }

  // 2b. Ground-floor West Canted Bay Windows (Living Room at Z = -0.26m, Sitting Room at Z = 5.92m)
  if (fromFoot.y <= 0.5 && fromFoot.x >= -22.68 && fromFoot.x <= -21.75) {
    for (const bayCenterZ of [-0.26, 5.92] as const) {
      const curDz = Math.abs(fromFoot.z - bayCenterZ);
      const nextDz = Math.abs(nextZ - bayCenterZ);
      if (nextDz <= 1.14 || curDz <= 1.14) {
        const bayWallInnerX =
          nextDz <= 0.62
            ? -22.52
            : nextDz <= 1.08
              ? -22.52 + ((nextDz - 0.62) / 0.46) * (-22.19 - -22.52)
              : -22.19;
        const minAllowedX =
          nextDz <= 0.68 ? Math.max(bayWallInnerX + 0.22, -22.16) : bayWallInnerX + 0.22;
        if (
          nextX < minAllowedX &&
          (nextX < fromFoot.x || (nextDz > curDz && fromFoot.x < -21.97))
        ) {
          return 'blocked';
        }
      }
    }
  }

  return 'check_obstacles';
}

/**
 * Smooth Helical Tangential Guidance & Auto-Curve Steering on the SE Barn Spiral Staircase
 * (`centerU = 22.08m, centerV = 4.50m`) so holding W (or S) glides effortlessly up and down the spiral.
 */
export function applySpiralStaircaseHelicalGuidance(
  footPos: THREE.Vector3,
  moveVec: THREE.Vector3,
  forwardInput: number,
  targetYawRad: number,
  dtSeconds: number
): number {
  const { obU: curObU, obV: curObV } = worldToOutbuildingLocal(footPos.x, footPos.z);
  const stairDu = curObU - 22.08;
  const stairDv = curObV - 4.5;
  const stairDist = Math.hypot(stairDu, stairDv);

  if (
    curObU >= 21.12 &&
    curObU <= 22.98 &&
    curObV >= 3.48 &&
    curObV <= 5.4 &&
    stairDist >= 0.16 &&
    stairDist <= 0.94
  ) {
    const moveU = moveVec.x * OB_COS - moveVec.z * OB_SIN;
    const moveV = moveVec.x * OB_SIN + moveVec.z * OB_COS;
    const theta = Math.atan2(stairDv, stairDu);

    const onMidHelix =
      footPos.y > -0.58 &&
      footPos.y < 1.46 &&
      !(footPos.y >= 1.15 && stairDu <= 0 && stairDv <= 0);
    const enteringBottomHelix =
      footPos.y <= -0.58 &&
      curObV >= 3.52 &&
      curObV <= 4.25 &&
      curObU >= 21.45 &&
      curObU <= 22.35 &&
      moveU * -Math.sin(theta) + moveV * Math.cos(theta) > 0.35;
    const enteringTopHelix =
      footPos.y >= 1.15 &&
      curObU >= 21.18 &&
      curObU <= 22.02 &&
      curObV >= 4.2 &&
      curObV <= 5.1 &&
      moveU * 0.55 + moveV * 0.83 > 0.35;

    if (onMidHelix || enteringBottomHelix || enteringTopHelix) {
      const radPull = THREE.MathUtils.clamp((0.54 - stairDist) * 1.85, -0.6, 0.6);
      const radU = Math.cos(theta);
      const radV = Math.sin(theta);

      let upU = -Math.sin(theta) + radPull * radU;
      let upV = Math.cos(theta) + radPull * radV;
      if (footPos.y >= 1.32 && theta >= Math.PI * 0.68) {
        upU = THREE.MathUtils.lerp(upU, -0.86, 0.55);
        upV = THREE.MathUtils.lerp(upV, -0.5, 0.55);
      }
      const upLen = Math.hypot(upU, upV) || 1;
      upU /= upLen;
      upV /= upLen;

      let downU = Math.sin(theta) + radPull * radU;
      let downV = -Math.cos(theta) + radPull * radV;
      if (
        footPos.y >= 1.35 &&
        (curObV < 4.72 || theta > Math.PI * 0.82 || theta < -Math.PI * 0.68)
      ) {
        downU = 21.64 - curObU;
        downV = 4.96 - curObV;
      } else if (footPos.y <= -0.42 && theta <= -Math.PI * 0.52) {
        downU = THREE.MathUtils.lerp(downU, -0.76, 0.55);
        downV = THREE.MathUtils.lerp(downV, -0.65, 0.55);
      }
      const downLen = Math.hypot(downU, downV) || 1;
      downU /= downLen;
      downV /= downLen;

      const dotUp = moveU * upU + moveV * upV;
      const dotDown = moveU * downU + moveV * downV;
      let flowU = 0;
      let flowV = 0;
      let activeFlow = false;

      if (dotUp >= dotDown && dotUp > 0.15) {
        flowU = upU;
        flowV = upV;
        activeFlow = true;
      } else if (dotDown > dotUp && dotDown > 0.15) {
        flowU = downU;
        flowV = downV;
        activeFlow = true;
      }

      if (activeFlow) {
        const guideWeight = stairDist > 0.7 || stairDist < 0.32 ? 0.92 : 0.72;
        const guidedU = THREE.MathUtils.lerp(moveU, flowU, guideWeight);
        const guidedV = THREE.MathUtils.lerp(moveV, flowV, guideWeight);
        moveVec.set(
          guidedU * OB_COS + guidedV * OB_SIN,
          0,
          -guidedU * OB_SIN + guidedV * OB_COS
        );
        if (moveVec.lengthSq() > 1e-5) {
          moveVec.normalize();
        }

        if (forwardInput > 0 && footPos.y > -0.52 && footPos.y < 1.44) {
          const flowWorldX = flowU * OB_COS + flowV * OB_SIN;
          const flowWorldZ = -flowU * OB_SIN + flowV * OB_COS;
          const desiredYaw = Math.atan2(-flowWorldX, -flowWorldZ);
          const deltaYaw = Math.atan2(
            Math.sin(desiredYaw - targetYawRad),
            Math.cos(desiredYaw - targetYawRad)
          );
          return targetYawRad + deltaYaw * Math.min(1, dtSeconds * 3.6);
        }
      }
    }
  }

  return targetYawRad;
}

export function resolveWalkthroughEntryPose(
  currentPose: SceneCameraPoseSnapshot,
  getRoomMinYAt: (x: number, y: number, z: number) => number | null,
  spawnOverride?: {
    readonly position: readonly [number, number, number];
    readonly yawDeg?: number;
  }
): {
  readonly footX: number;
  readonly footY: number;
  readonly footZ: number;
  readonly yawRad: number;
  readonly pitchRad: number;
  readonly checkMode: 'depenetrate' | 'ensure_unblocked' | 'none';
} {
  if (spawnOverride) {
    const [fx, fy, fz] = spawnOverride.position;
    return {
      footX: fx,
      footY: sampleFloorElevation(fx, fy, fz),
      footZ: fz,
      yawRad: THREE.MathUtils.degToRad(spawnOverride.yawDeg ?? 0),
      pitchRad: -0.03,
      checkMode: 'depenetrate',
    };
  }

  const [tx, ty, tz] = currentPose.target;
  const [cx, , cz] = currentPose.position;
  const roomMinY = getRoomMinYAt(tx, ty, tz);
  if (roomMinY !== null && Math.hypot(cx - tx, cz - tz) < 18.0) {
    const dirX = tx - cx;
    const dirZ = tz - cz;
    const distXZ = Math.hypot(dirX, dirZ);
    const spawnX = distXZ > 0.5 ? tx - (dirX / distXZ) * Math.min(1.4, distXZ * 0.4) : tx;
    const spawnZ = distXZ > 0.5 ? tz - (dirZ / distXZ) * Math.min(1.4, distXZ * 0.4) : tz;
    const baseFloorY = getRoomMinYAt(spawnX, ty, spawnZ) ?? roomMinY;
    return {
      footX: spawnX,
      footY: sampleFloorElevation(spawnX, baseFloorY, spawnZ),
      footZ: spawnZ,
      yawRad: Math.atan2(-dirX, -dirZ),
      pitchRad: -0.04,
      checkMode: 'ensure_unblocked',
    };
  }

  const def = DEFAULT_WALKTHROUGH_SPAWNS[0];
  return {
    footX: def.position[0],
    footY: def.position[1],
    footZ: def.position[2],
    yawRad: THREE.MathUtils.degToRad(def.yawDeg),
    pitchRad: -0.03,
    checkMode: 'none',
  };
}
