import type { RoomBoundingBox, RoomZoneId } from '../../../core/types/topology.ts';

/**
 * Pure (three-free) copy of the main-house east-wing builder frame
 * (`structure/ground-floor-materials.ts`): east-wing rooms are authored in a local frame
 * rotated by `EAST_WING_ROTATION_Y` and offset so local (-16.92, 2.54) lands on world
 * (-16.92, 2.61).
 */
export const EAST_WING_ROTATION_Y = -Math.atan2(0.705, 5.27);
const COS = Math.cos(EAST_WING_ROTATION_Y);
const SIN = Math.sin(EAST_WING_ROTATION_Y);
const OFFSET_X = -16.92 - (-16.92 * COS + 2.54 * SIN);
const OFFSET_Z = 2.61 - (16.92 * SIN + 2.54 * COS);

/** Room zones whose authored bounds are in the east-wing local frame. */
export const EAST_WING_LOCAL_ZONE_IDS: readonly RoomZoneId[] = [
  'kitchen',
  'sitting',
  'utility',
  'familyRoom',
  'bootLobby',
  'hall',
  'mainBedroom',
  'familyBathroom',
];

/** Local east-wing (x, z) → world [x, z]. */
export function eastWingToWorldXZ(x: number, z: number): [number, number] {
  return [x * COS + z * SIN + OFFSET_X, -x * SIN + z * COS + OFFSET_Z];
}

/** Local east-wing rectangle → world polygon (4 corners, CCW in local frame). */
export function eastWingRectToWorldPolygon(
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number
): [number, number][] {
  return [
    eastWingToWorldXZ(minX, minZ),
    eastWingToWorldXZ(maxX, minZ),
    eastWingToWorldXZ(maxX, maxZ),
    eastWingToWorldXZ(minX, maxZ),
  ];
}

/** World AABB of a local east-wing AABB (heights unchanged). */
export function eastWingBoundsToWorld(b: RoomBoundingBox): RoomBoundingBox {
  const corners = eastWingRectToWorldPolygon(b.minX, b.maxX, b.minZ, b.maxZ);
  const xs = corners.map((c) => c[0]);
  const zs = corners.map((c) => c[1]);
  const round = (v: number): number => Math.round(v * 1000) / 1000;
  return {
    minX: round(Math.min(...xs)),
    maxX: round(Math.max(...xs)),
    minY: b.minY,
    maxY: b.maxY,
    minZ: round(Math.min(...zs)),
    maxZ: round(Math.max(...zs)),
  };
}

/** Outbuilding builder frame (`outbuilding-coords-and-materials.ts`): (u, v) → world [x, z]. */
export const OUTBUILDING_FRAME = {
  originX: -22.47,
  originZ: 16.0,
  rotationY: Math.atan2(2.49, 28.98),
} as const;

export function outbuildingToWorldXZ(u: number, v: number): [number, number] {
  const c = Math.cos(OUTBUILDING_FRAME.rotationY);
  const s = Math.sin(OUTBUILDING_FRAME.rotationY);
  return [OUTBUILDING_FRAME.originX + u * c + v * s, OUTBUILDING_FRAME.originZ - u * s + v * c];
}

export function outbuildingRectToWorldPolygon(
  minU: number,
  maxU: number,
  minV: number,
  maxV: number
): [number, number][] {
  return [
    outbuildingToWorldXZ(minU, minV),
    outbuildingToWorldXZ(maxU, minV),
    outbuildingToWorldXZ(maxU, maxV),
    outbuildingToWorldXZ(minU, maxV),
  ];
}
