import * as THREE from 'three';
import type { SceneCameraPoseSnapshot } from '../../../core/types/scene.ts';
import {
  CROUCH_EYE_HEIGHT,
  DEFAULT_WALKTHROUGH_SPAWNS,
  STANDING_EYE_HEIGHT,
  worldToEastWingLocal,
} from './walkthrough-spawns.ts';

export const OB_ROT = Math.atan2(2.49, 28.98);
export const OB_COS = Math.cos(OB_ROT);
export const OB_SIN = Math.sin(OB_ROT);

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

export function outbuildingLocalToWorld(
  obU: number,
  obV: number
): { readonly wx: number; readonly wz: number } {
  return {
    wx: -22.47 + obU * OB_COS + obV * OB_SIN,
    wz: 16.0 - obU * OB_SIN + obV * OB_COS,
  };
}

/**
 * Returns the exact vaulted plasterboard ceiling soffit world Y (`y = 2.92m` at eaves `v = 0.28m / 5.43m`
 * rising to `y = 4.269m` at the central ridge `v = 2.855m`) in the Store & Barn range.
 */
export function getStoreBarnRoofSoffitY(obV: number): number {
  return 4.269 - Math.abs(obV - 2.855) * ((4.269 - 2.92) / 2.575);
}

/**
 * Computes the target standing/crouched eye height at world `(x, footY, z)`, automatically
 * ducking under the Store Loft pitched roof slopes (`2.92m` eaves -> `4.269m` central ridge)
 * so the player's camera never clips through the roof rafters, purlins, or linear LED battens.
 */
export function getWalkthroughTargetEyeHeight(
  x: number,
  footY: number,
  z: number,
  crouched: boolean
): number {
  if (footY >= 1.2) {
    const { obU, obV } = worldToOutbuildingLocal(x, z);
    if (obU >= 12.15 && obU <= 15.15 && obV >= 0.3 && obV <= 5.45) {
      const roofSoffitY = getStoreBarnRoofSoffitY(obV);
      const maxSafeCameraY = roofSoffitY - 0.38;
      const maxClearEyeH = THREE.MathUtils.clamp(maxSafeCameraY - footY, 0.42, 1.24);
      return crouched ? Math.min(0.68, maxClearEyeH) : maxClearEyeH;
    }
  }
  return crouched ? CROUCH_EYE_HEIGHT : STANDING_EYE_HEIGHT;
}

export interface ActiveStaircaseRiserState {
  readonly staircaseId:
    | 'main-hall'
    | 'barn-spiral'
    | 'stable-exterior-spiral'
    | 'barn-stable-up-steps'
    | 'barn-floor-drop-steps';
  readonly riserIndex: number;
  readonly riserHeight: number;
  readonly progress01: number;
}

export const EXT_SPIRAL_CENTER_U = 32.68;
export const EXT_SPIRAL_CENTER_V = 4.82;
export const EXT_SPIRAL_THETA_START = -0.28 * Math.PI;
export const EXT_SPIRAL_THETA_END = 0.72 * Math.PI;

export function isInsideSpiralStaircaseCutout(x: number, z: number): boolean {
  const { obU, obV } = worldToOutbuildingLocal(x, z);
  const inBarnSpiral = obU >= 21.12 && obU <= 23.02 && obV >= 3.52 && obV <= 5.42;
  const inExtBalconySpiral = obU >= 31.72 && obU <= 33.68 && obV >= 3.88 && obV <= 5.78;
  return inBarnSpiral || inExtBalconySpiral;
}

function applyDiscreteStepRiserContour(linearY: number, baseY: number, riserHeight: number): number {
  const riserIndex = (linearY - baseY) / riserHeight;
  return linearY - 0.014 * Math.sin(riserIndex * Math.PI * 2);
}

/**
 * Detects if the player's feet at `(x, footY, z)` are currently on any staircase in the property
 * and returns the continuous physical riser index (`0 .. N`) for step-synchronized camera animation.
 */
export function evaluateActiveStaircaseRiserState(
  x: number,
  footY: number,
  z: number
): ActiveStaircaseRiserState | null {
  const { ewX, ewZ } = worldToEastWingLocal(x, z);
  // 1. Main Hall Quarter-Turn Staircase
  if (ewX >= -16.64 && ewX <= -15.28 && ewZ >= -2.55 && ewZ <= -1.58 && footY >= 0.82 && footY <= 2.15) {
    const riserHeight = (2.16 - 0.84) / 7;
    const riserIndex = 6 + THREE.MathUtils.clamp((footY - 0.84) / riserHeight, 0, 7);
    return {
      staircaseId: 'main-hall',
      riserIndex,
      riserHeight,
      progress01: THREE.MathUtils.clamp((footY - -0.3) / (2.16 - -0.3), 0, 1),
    };
  }
  if (ewX >= -17.58 && ewX <= -16.58 && ewZ >= -1.62 && ewZ <= -0.26 && footY >= -0.29 && footY <= 0.83) {
    const riserHeight = (0.84 - -0.3) / 6;
    const riserIndex = THREE.MathUtils.clamp((footY - -0.3) / riserHeight, 0, 6);
    return {
      staircaseId: 'main-hall',
      riserIndex,
      riserHeight,
      progress01: THREE.MathUtils.clamp((footY - -0.3) / (2.16 - -0.3), 0, 1),
    };
  }

  const { obU, obV } = worldToOutbuildingLocal(x, z);
  // 2. Stable Exterior Balcony Spiral Staircase (`centerU = 32.68m, centerV = 4.82m, y = -0.44..2.08m`, 14 risers)
  const extDu = obU - EXT_SPIRAL_CENTER_U;
  const extDv = obV - EXT_SPIRAL_CENTER_V;
  const extDist = Math.hypot(extDu, extDv);
  if (extDist <= 0.98 && footY > -0.42 && footY < 2.06) {
    const riserHeight = (2.08 - -0.44) / 14; // 0.18m
    const riserIndex = THREE.MathUtils.clamp((footY - -0.44) / riserHeight, 0, 14);
    return {
      staircaseId: 'stable-exterior-spiral',
      riserIndex,
      riserHeight,
      progress01: riserIndex / 14,
    };
  }

  // 3. Barn Interior Spiral Staircase (`centerU = 22.08m, centerV = 4.50m, y = -0.675..1.54m`, 13 risers)
  const barnDu = obU - 22.08;
  const barnDv = obV - 4.5;
  const barnDist = Math.hypot(barnDu, barnDv);
  if (barnDist <= 0.96 && footY > -0.65 && footY < 1.52) {
    const riserHeight = (1.54 - -0.675) / 13; // 0.1704m
    const riserIndex = THREE.MathUtils.clamp((footY - -0.675) / riserHeight, 0, 13);
    return {
      staircaseId: 'barn-spiral',
      riserIndex,
      riserHeight,
      progress01: riserIndex / 13,
    };
  }

  // 4. Barn Mezzanine-to-Stable 3 `UP` Steps (`u = 22.02..23.22m, v = 2.35..3.35m, y = 1.54..2.08m`, 3 risers)
  if (obU >= 22.02 && obU <= 23.22 && obV >= 2.35 && obV <= 3.35 && footY > 1.55 && footY < 2.07) {
    const riserHeight = (2.08 - 1.54) / 3; // 0.18m
    const riserIndex = THREE.MathUtils.clamp((footY - 1.54) / riserHeight, 0, 3);
    return {
      staircaseId: 'barn-stable-up-steps',
      riserIndex,
      riserHeight,
      progress01: riserIndex / 3,
    };
  }

  // 5. Barn Floor Drop Steps (`u = 18.16..18.48m, v = 0.28..3.62m, y = -0.675..-0.34m`, 2 risers)
  if (obU >= 18.16 && obU <= 18.48 && obV >= 0.28 && obV <= 3.62 && footY > -0.665 && footY < -0.35) {
    const riserHeight = (-0.34 - -0.675) / 2; // 0.1675m
    const riserIndex = THREE.MathUtils.clamp((footY - -0.675) / riserHeight, 0, 2);
    return {
      staircaseId: 'barn-floor-drop-steps',
      riserIndex,
      riserHeight,
      progress01: riserIndex / 2,
    };
  }

  return null;
}

/**
 * Resolves continuous floor, stair, ramp, mezzanine, spiral-staircase, and graded courtyard
 * ground elevation at world position `(x, z)` given the player's reference foot height `refFootY`.
 */
export function sampleFloorElevation(x: number, refFootY: number, z: number): number {
  const { ewX, ewZ } = worldToEastWingLocal(x, z);

  // 1. Main Hall Quarter-Turn Staircase (smooth continuous analytical elevation Up & Down with riser step contour)
  // 1a. Upper Flight (climbing East +X along the North wall from X = -16.64m at Y = 0.84m to X = -15.36m at Y = 2.16m)
  if (ewX >= -16.64 && ewX <= -15.26 && ewZ >= -2.55 && ewZ <= -1.58 && refFootY >= 0.35) {
    const tUpper = THREE.MathUtils.clamp((ewX - -16.64) / (-15.36 - -16.64), 0, 1);
    const linearY = 0.84 + tUpper * (2.16 - 0.84);
    return applyDiscreteStepRiserContour(linearY, 0.84, (2.16 - 0.84) / 7);
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
    const linearY = -0.3 + tLower * (0.84 - -0.3);
    return applyDiscreteStepRiserContour(linearY, -0.3, (0.84 - -0.3) / 6);
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

  // 2b. Outbuilding Barn Mezzanine (`1.54m`), Spiral Staircases, 3 `UP` Steps (`1.54m..2.08m`),
  //     Stable Top Floor & 1st-Floor East Balcony (`2.08m`), and Stable Exterior Spiral Staircase (`-0.44m..2.08m`)
  const { obU, obV } = worldToOutbuildingLocal(x, z);

  // Stable East Balcony Exterior Spiral Staircase (`centerU = 32.68m, centerV = 4.82m, outerR = 0.84m`)
  const extStairDu = obU - EXT_SPIRAL_CENTER_U;
  const extStairDv = obV - EXT_SPIRAL_CENTER_V;
  const extStairDist = Math.hypot(extStairDu, extStairDv);
  if (
    obU >= 31.70 &&
    obU <= 33.72 &&
    obV >= 3.84 &&
    obV <= 5.80 &&
    (extStairDist <= 1.04 || (obU <= 32.68 && obV >= 4.36 && obV <= 5.26))
  ) {
    const rawExtTheta = Math.atan2(extStairDv, extStairDu);
    // West Bridge Top Landing (`u = 31.72..32.68m, v = 4.40..5.24m` at `y = 2.08m`)
    if (
      refFootY >= 1.15 &&
      obU >= 31.70 &&
      obU <= 32.68 &&
      obV >= 4.36 &&
      obV <= 5.26 &&
      extStairDu <= 0.04 &&
      (Math.abs(extStairDv) <= 0.14 || Math.abs(rawExtTheta) >= 0.70 * Math.PI)
    ) {
      return 2.08;
    }

    if (rawExtTheta >= EXT_SPIRAL_THETA_START && rawExtTheta <= EXT_SPIRAL_THETA_END) {
      const tExtStair = THREE.MathUtils.clamp(
        (rawExtTheta - EXT_SPIRAL_THETA_START) / (EXT_SPIRAL_THETA_END - EXT_SPIRAL_THETA_START),
        0,
        1
      );
      const linearExtY = THREE.MathUtils.lerp(-0.44, 2.08, tExtStair);
      const steppedExtY = applyDiscreteStepRiserContour(linearExtY, -0.44, (2.08 - -0.44) / 14);
      if (refFootY >= 0.65 || steppedExtY <= refFootY + 0.75) {
        return steppedExtY;
      }
    } else if (refFootY >= 1.20 && obU <= 32.72 && obV >= 4.30 && obV <= 5.36) {
      return 2.08;
    }

    return refFootY >= 1.25 ? 2.08 : -0.44;
  }

  if (obV >= 0.05 && obV <= 5.66 && obU >= 0.25 && obU <= 31.88) {
    const stairDu = obU - 22.08;
    const stairDv = obV - 4.5;
    const stairDist = Math.hypot(stairDu, stairDv);
    const thetaStart = -Math.PI * 0.65;
    const thetaEnd = Math.PI * 0.82;
    const rawTheta = Math.atan2(stairDv, stairDu);

    const inSpiralStairwellCutout =
      (obU >= 21.14 && obU <= 23.02 && obV >= 3.56) ||
      (obU >= 22.04 && obU <= 23.02 && obV >= 3.305);
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
        const linearStairY = THREE.MathUtils.lerp(-0.675, 1.54, tStair);
        const stairY = applyDiscreteStepRiserContour(linearStairY, -0.675, (1.54 - -0.675) / 13);
        if (refFootY >= 0.45 || stairY <= refFootY + 0.68) {
          return stairY;
        }
      } else if (refFootY >= 0.65) {
        return 1.54;
      }
    }

    // Store Loft Storage Area (`u = 12.31..14.96m, v = 1.24..5.43m, loftFloorY = +2.61m`)
    if (
      refFootY >= 1.85 &&
      obU >= 12.31 &&
      obU <= 14.98 &&
      obV >= 1.18 &&
      obV <= 5.43
    ) {
      return 2.61;
    }

    if (refFootY >= 1.15 && obU >= 18.65 && !inSpiralStairwellCutout) {
      if (obU >= 23.22) return 2.08;
      if (obU >= 22.02 && obV >= 2.35 && obV <= 3.35) {
        const tUp = THREE.MathUtils.clamp((obU - 22.05) / (23.22 - 22.05), 0, 1);
        const linearUpY = THREE.MathUtils.lerp(1.54, 2.08, tUp);
        return applyDiscreteStepRiserContour(linearUpY, 1.54, (2.08 - 1.54) / 3);
      }
      return 1.54;
    }
    if (obV >= 0.0 && obV <= 5.45) {
      if (obU < 5.87) return -0.588;
      if (obU < 12.19) return -0.5;
      if (obU < 18.18) return -0.34;
      if (obU < 18.46) {
        const tDrop = THREE.MathUtils.clamp((obU - 18.18) / 0.28, 0, 1);
        const linearDropY = THREE.MathUtils.lerp(-0.34, -0.675, tDrop);
        return applyDiscreteStepRiserContour(linearDropY, -0.675, (-0.34 - -0.675) / 2);
      }
      if (obU < 23.12) return -0.675;
      return -0.44;
    }
  }

  // Outdoor threshold & Yorkstone path outside the Office East Patio Door and Spiral Staircase (`u = 31.85..34.20m`)
  if (obU >= 31.85 && obU <= 34.20 && obV >= 0.85 && obV <= 5.85 && refFootY <= 1.25) {
    if (obU <= 33.65) return -0.44;
    const tGarden = THREE.MathUtils.clamp((obU - 33.65) / 0.55, 0, 1);
    return THREE.MathUtils.lerp(-0.44, -0.18, tGarden);
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

  // 5a. Raised Flagstone Patio, Grape-Vine Pergola (+0.32m), and Walled Vegetable Garden (0.00m)
  if (ewX >= -4.45 && ewX <= 17.75 && ewZ >= -1.05 && ewZ <= 7.35 && refFootY <= 1.35) {
    // Walled Vegetable Garden & Greenhouse (ewX = 11.85..17.75, ewZ = -0.95..7.20)
    if (ewX > 11.85) {
      // Smooth 2-step transition down East Garden Steps (ewX = 11.85..12.48, ewZ = 1.75..3.45)
      if (ewX <= 12.48 && ewZ >= 1.75 && ewZ <= 3.45) {
        const tStep = THREE.MathUtils.clamp((ewX - 11.85) / 0.63, 0, 1);
        return THREE.MathUtils.lerp(0.32, 0.0, tStep);
      }
      return 0.0;
    }
    // Raised Walled Grape-Vine Pergola Dining Court (ewX = 6.82..11.85, ewZ = -0.95..7.20)
    if (ewX >= 6.82 && ewZ >= -0.95 && ewZ <= 7.20) {
      return 0.32;
    }
    // West Pergola Entrance Steps (ewX = 6.38..6.82)
    if (ewX >= 6.38 && ewX < 6.82 && ewZ >= -0.95 && ewZ <= 7.20) {
      const tStep = THREE.MathUtils.clamp((ewX - 6.38) / 0.44, 0, 1);
      return THREE.MathUtils.lerp(0.0, 0.32, tStep);
    }
    // Courtyard gravel/sett transition aisle between Flagstone Patio and Pergola (ewX = 4.25..6.38)
    if (ewX > 4.25 && ewZ >= -0.95 && ewZ <= 7.20) {
      return 0.0;
    }
    // Raised Flagstone Patio South of Kitchen (ewX = -4.45..4.25, ewZ = 2.62..7.10)
    if (ewX >= -4.45 && ewX <= 4.25 && ewZ >= 2.62 && ewZ <= 7.10) {
      return 0.09;
    }
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
    curEw.ewX <= -16.52 &&
    curEw.ewZ >= -1.65 &&
    curEw.ewZ <= 0.05;

  if (onUpperFlightOrMouth || onQuarterLanding || onLowerFlight) {
    // Directional outer wall bounds so the player can never get wedged at the stair base or landing
    if (nextEw.ewZ < -2.26 && nextEw.ewZ < curEw.ewZ) return 'blocked';
    if (nextEw.ewX < -17.34 && nextEw.ewX < curEw.ewX) return 'blocked';
    if (
      fromFoot.y >= 0.72 &&
      nextEw.ewX > -16.58 &&
      nextEw.ewX < -15.36 &&
      nextEw.ewZ > -1.69 &&
      nextEw.ewZ > curEw.ewZ
    ) {
      return 'blocked';
    }
    if (
      fromFoot.y <= 1.35 &&
      nextEw.ewZ > -1.58 &&
      nextEw.ewZ < -0.52 &&
      nextEw.ewX > -16.64 &&
      nextEw.ewX > curEw.ewX
    ) {
      return 'blocked';
    }
    return 'clear';
  }

  // 2a-ii. Outbuilding Store Loft (`+2.61m`), Barn Mezzanine Balustrades, Spiral Staircase, and 3-Step `UP` Stair
  const { obU: curObU, obV: curObV } = worldToOutbuildingLocal(fromFoot.x, fromFoot.z);
  const { obU: nextObU, obV: nextObV } = worldToOutbuildingLocal(nextX, nextZ);

  // Store Loft Storage Area perimeter, guardrails, and storage tote boxes (`y = 2.61m`)
  if (
    fromFoot.y >= 2.15 &&
    curObU >= 12.25 &&
    curObU <= 15.05 &&
    curObV >= 1.15 &&
    curObV <= 5.45
  ) {
    if (nextObU < 12.52 && nextObU < curObU) return 'blocked';
    if (nextObU > 14.74 && nextObU > curObU) return 'blocked';
    // East storage box stacks (`Boxes 1..5` along `u = 14.32..14.88m, v = 1.85..3.82m`)
    if (nextObU > 14.16 && nextObV >= 1.78 && nextObV <= 3.88 && nextObU > curObU) {
      return 'blocked';
    }
    // South storage box row & low South eave (`Boxes 6..9` along `v >= 4.40m`)
    if (nextObV > 4.26 && nextObV > curObV) return 'blocked';
    // North loft guardrail (`v = 1.24m`) with ladder opening gap at `u = 13.92..14.50m`
    const inLadderOpeningU = nextObU >= 13.92 && nextObU <= 14.50;
    if (!inLadderOpeningU && nextObV < 1.46 && nextObV < curObV) {
      return 'blocked';
    }
    if (inLadderOpeningU && nextObV < 1.18 && nextObV < curObV) {
      return 'blocked';
    }
    return 'clear';
  }

  if (fromFoot.y >= 1.15 && curObU >= 18.68 && curObU <= 23.02 && nextObU < 18.92) {
    return 'blocked';
  }

  if (fromFoot.y >= 0.85 && curObU >= 18.68 && curObU <= 23.05) {
    if (
      curObU <= 22.05 &&
      nextObU > 21.84 &&
      nextObU > curObU &&
      nextObV >= 3.25 &&
      nextObV <= 4.52
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
    curObU >= 21.95 &&
    curObU <= 23.55 &&
    curObV >= 2.38 &&
    curObV <= 3.32
  ) {
    return nextObV < 2.4 || nextObV > 3.3 ? 'blocked' : 'clear';
  }

  // 2a-iii. Stable 1st-Floor East Balcony (`u = 28.95..31.88m, v = 0.05..5.66m, y = 2.08m`)
  //         and Stable Exterior Balcony Spiral Staircase (`centerU = 32.68m, centerV = 4.82m, y = -0.44..2.08m`)
  const curExtDu = curObU - EXT_SPIRAL_CENTER_U;
  const curExtDv = curObV - EXT_SPIRAL_CENTER_V;
  const curExtDist = Math.hypot(curExtDu, curExtDv);
  const nextExtDu = nextObU - EXT_SPIRAL_CENTER_U;
  const nextExtDv = nextObV - EXT_SPIRAL_CENTER_V;
  const nextExtDist = Math.hypot(nextExtDu, nextExtDv);

  const onExtSpiralTopLanding =
    fromFoot.y >= 1.45 &&
    curObU >= 31.68 &&
    curObU <= 32.72 &&
    curObV >= 4.36 &&
    curObV <= 5.26 &&
    curExtDu <= 0.04;
  const onExtSpiralHelixTreads =
    fromFoot.y > -0.42 &&
    fromFoot.y < 2.06 &&
    curObU >= 31.72 &&
    curObU <= 33.68 &&
    curObV >= 3.86 &&
    curObV <= 5.78 &&
    curExtDist <= 0.98;
  const atExtSpiralBottomEntry =
    fromFoot.y <= 0.15 &&
    curObU >= 32.20 &&
    curObU <= 33.68 &&
    curObV >= 3.72 &&
    curObV <= 4.72 &&
    curExtDist <= 1.02;

  if (onExtSpiralTopLanding || onExtSpiralHelixTreads || atExtSpiralBottomEntry) {
    // Central cast-iron column (`r = 0.078m`)
    if (nextExtDist < 0.20 && nextExtDist < curExtDist) return 'blocked';
    // Prevent walking West into the South-East ground brick pier (`u = 31.85m`) while below the top landing
    if (fromFoot.y < 1.75 && nextObU < 32.02 && nextObU < curObU) return 'blocked';
    // North radial bridge guardrail on `topLanding` (`v = 4.42..4.72m`)
    if (fromFoot.y >= 1.55 && nextObU <= 32.68 && nextObV < 4.45 && nextObV < curObV) {
      return 'blocked';
    }
    const exitingTopToBalcony =
      fromFoot.y >= 1.65 && nextObU <= 31.96 && nextObV >= 4.40 && nextObV <= 5.24;
    const exitingBottomToGarden =
      fromFoot.y <= 0.15 && nextObU >= 32.22 && nextObU <= 33.68 && nextObV <= 4.68;
    if (
      !exitingTopToBalcony &&
      !exitingBottomToGarden &&
      nextExtDist > 0.82 &&
      nextExtDist > curExtDist
    ) {
      return 'blocked';
    }
    return 'clear';
  }

  if (
    fromFoot.y >= 1.65 &&
    curObU >= 28.95 &&
    curObU <= 31.88 &&
    curObV >= 0.05 &&
    curObV <= 5.66
  ) {
    if (nextObV < 0.26 && nextObV < curObV) return 'blocked';
    if (nextObV > 5.45 && nextObV > curObV) return 'blocked';
    const inBalconyStairGateV = nextObV >= 4.42 && nextObV <= 5.22;
    if (!inBalconyStairGateV && nextObU > 31.58 && nextObU > curObU) return 'blocked';
    if (inBalconyStairGateV && nextObU >= 31.50) return 'clear';
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
 * Smooth Helical Tangential Guidance & Auto-Curve Steering on:
 * 1. SE Barn Interior Spiral Staircase (`centerU = 22.08m, centerV = 4.50m`)
 * 2. Stable East Balcony Exterior Spiral Staircase (`centerU = 32.68m, centerV = 4.82m`)
 * 3. Main Hall Quarter-Turn Staircase (`ewX = -17.58..-15.26m, ewZ = -2.55..-0.24m`)
 * so holding W (or S) glides effortlessly up and down the stairs.
 */
export function applySpiralStaircaseHelicalGuidance(
  footPos: THREE.Vector3,
  moveVec: THREE.Vector3,
  forwardInput: number,
  targetYawRad: number,
  dtSeconds: number
): number {
  const { obU: curObU, obV: curObV } = worldToOutbuildingLocal(footPos.x, footPos.z);

  // 1. Barn Interior Spiral Staircase (`centerU = 22.08m, centerV = 4.50m`)
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

  // 2. Stable East Balcony Exterior Spiral Staircase (`centerU = 32.68m, centerV = 4.82m`)
  const extDu = curObU - EXT_SPIRAL_CENTER_U;
  const extDv = curObV - EXT_SPIRAL_CENTER_V;
  const extDist = Math.hypot(extDu, extDv);

  if (
    curObU >= 31.70 &&
    curObU <= 33.68 &&
    curObV >= 3.78 &&
    curObV <= 5.78 &&
    extDist >= 0.16 &&
    extDist <= 0.98
  ) {
    const moveU = moveVec.x * OB_COS - moveVec.z * OB_SIN;
    const moveV = moveVec.x * OB_SIN + moveVec.z * OB_COS;
    const theta = Math.atan2(extDv, extDu);

    const onExtMidHelix =
      footPos.y > -0.36 &&
      footPos.y < 1.98 &&
      !(footPos.y >= 1.65 && extDu <= 0 && Math.abs(extDv) <= 0.42);
    const enteringExtBottomHelix =
      footPos.y <= -0.20 &&
      curObU >= 32.35 &&
      curObU <= 33.65 &&
      curObV >= 3.80 &&
      curObV <= 4.65 &&
      moveU * -Math.sin(theta) + moveV * Math.cos(theta) > 0.28;
    const enteringExtTopHelix =
      footPos.y >= 1.65 &&
      curObU >= 31.72 &&
      curObU <= 32.68 &&
      curObV >= 4.40 &&
      curObV <= 5.45 &&
      moveU * 0.65 + moveV * 0.76 > 0.28;

    if (onExtMidHelix || enteringExtBottomHelix || enteringExtTopHelix) {
      const radPull = THREE.MathUtils.clamp((0.55 - extDist) * 1.85, -0.6, 0.6);
      const radU = Math.cos(theta);
      const radV = Math.sin(theta);

      let upU = -Math.sin(theta) + radPull * radU;
      let upV = Math.cos(theta) + radPull * radV;
      if (footPos.y >= 1.75 && theta >= Math.PI * 0.52) {
        upU = THREE.MathUtils.lerp(upU, -0.92, 0.62);
        upV = THREE.MathUtils.lerp(upV, -0.38, 0.62);
      }
      const upLen = Math.hypot(upU, upV) || 1;
      upU /= upLen;
      upV /= upLen;

      let downU = Math.sin(theta) + radPull * radU;
      let downV = -Math.cos(theta) + radPull * radV;
      if (
        footPos.y >= 1.75 &&
        (curObV < 5.05 || Math.abs(theta) > Math.PI * 0.70)
      ) {
        downU = 32.38 - curObU;
        downV = 5.32 - curObV;
      } else if (footPos.y <= -0.15 && theta <= -Math.PI * 0.14) {
        downU = THREE.MathUtils.lerp(downU, -0.58, 0.58);
        downV = THREE.MathUtils.lerp(downV, -0.81, 0.58);
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
        const guideWeight = extDist > 0.72 || extDist < 0.32 ? 0.92 : 0.74;
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

        if (forwardInput > 0 && footPos.y > -0.38 && footPos.y < 1.98) {
          const flowWorldX = flowU * OB_COS + flowV * OB_SIN;
          const flowWorldZ = -flowU * OB_SIN + flowV * OB_COS;
          const desiredYaw = Math.atan2(-flowWorldX, -flowWorldZ);
          const deltaYaw = Math.atan2(
            Math.sin(desiredYaw - targetYawRad),
            Math.cos(desiredYaw - targetYawRad)
          );
          return targetYawRad + deltaYaw * Math.min(1, dtSeconds * 3.8);
        }
      }
    }
  }

  // 3. Main Hall Quarter-Turn Staircase Landing Smooth Auto-Curve Steering
  const { ewX, ewZ } = worldToEastWingLocal(footPos.x, footPos.z);
  if (
    footPos.y >= 0.45 &&
    footPos.y <= 1.25 &&
    ewX >= -17.55 &&
    ewX <= -16.45 &&
    ewZ >= -2.52 &&
    ewZ <= -1.48 &&
    forwardInput > 0
  ) {
    // Turning from Lower Flight (moving North -Z) onto Upper Flight (moving East +X)
    if (moveVec.z < -0.25 && ewZ <= -1.68) {
      const desiredYaw = -Math.PI * 0.5; // Facing East (+X)
      const deltaYaw = Math.atan2(
        Math.sin(desiredYaw - targetYawRad),
        Math.cos(desiredYaw - targetYawRad)
      );
      return targetYawRad + deltaYaw * Math.min(1, dtSeconds * 2.8);
    }
    // Turning from Upper Flight (moving West -X) onto Lower Flight (moving South +Z)
    if (moveVec.x < -0.25 && ewX <= -16.72) {
      const desiredYaw = Math.PI; // Facing South (+Z)
      const deltaYaw = Math.atan2(
        Math.sin(desiredYaw - targetYawRad),
        Math.cos(desiredYaw - targetYawRad)
      );
      return targetYawRad + deltaYaw * Math.min(1, dtSeconds * 2.8);
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
