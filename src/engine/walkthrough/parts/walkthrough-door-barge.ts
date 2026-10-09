import * as THREE from 'three';
import { isObjectVisibleInHierarchy } from '../../util/object-utils.ts';
import {
  applySpiralStaircaseHelicalGuidance,
  evaluateActiveStaircaseRiserState,
  evaluateArchitecturalWalkwayBounds,
  isInsideSpiralStaircaseCutout,
  sampleFloorElevation,
} from './walkthrough-elevation-solver.ts';
import {
  computeWingWallSlideAxes,
  findNearestWalkthroughSpawn,
  STANDING_EYE_HEIGHT,
  WALK_SPEED_MPS,
} from './walkthrough-spawns.ts';

export type WalkthroughDoorBargeHandler = (
  interactableId: string,
  isSprinting: boolean,
  footX: number,
  footY: number,
  footZ: number,
  moveDirX: number,
  moveDirZ: number
) => boolean;

export type WalkthroughProximityDoorBargeHandler = (
  footX: number,
  footY: number,
  footZ: number,
  moveDirX: number,
  moveDirZ: number,
  isSprinting: boolean
) => boolean;

export interface CachedObstacle {
  readonly mesh: THREE.Mesh;
  readonly visibilityNode: THREE.Object3D;
  readonly localBox: THREE.Box3;
  centerX: number;
  centerZ: number;
  radiusXZ: number;
  minY: number;
  maxY: number;
  readonly isDynamic: boolean;
}

export interface CachedFurnitureBox {
  readonly mesh: THREE.Mesh;
  readonly visibilityNode: THREE.Object3D;
  readonly centerX: number;
  readonly centerZ: number;
  readonly radiusXZ: number;
  readonly minY: number;
  readonly maxY: number;
  readonly ux: number;
  readonly uz: number;
  readonly minU: number;
  readonly maxU: number;
  readonly minV: number;
  readonly maxV: number;
}

/**
 * Handles automatic walkthrough door proximity detection, smooth Call-of-Duty-style
 * door auto-barging on contact/approach, 2D OBB furniture depenetration, and
 * spatial-filtered wall/cabinetry/door raycast collision.
 */
export class WalkthroughDoorBargeAndCollisionSolver {
  private readonly scene: THREE.Scene;
  private readonly onBargeWalkthroughDoor: WalkthroughDoorBargeHandler;
  private readonly onProximityBargeDoors: WalkthroughProximityDoorBargeHandler;
  private readonly onDoorBarged: () => void;

  private cachedObstacles: CachedObstacle[] | null = null;
  private cachedFurnitureBoxes: CachedFurnitureBox[] = [];
  private readonly nearbyObstacleMeshes: THREE.Object3D[] = [];
  private readonly tmpBox = new THREE.Box3();
  private readonly tmpCorner = new THREE.Vector3();
  private readonly tmpOrigin = new THREE.Vector3();
  private readonly tmpNormal = new THREE.Vector3();
  private readonly tmpRayDir = new THREE.Vector3();
  private readonly tmpHitNormal1 = new THREE.Vector3();
  private readonly tmpHitNormal2 = new THREE.Vector3();
  private readonly tmpSlideDir = new THREE.Vector3();
  private readonly wallRaycaster = new THREE.Raycaster();
  private lastMovedDistance = 0;

  public constructor(options: {
    readonly scene: THREE.Scene;
    readonly onBargeWalkthroughDoor: WalkthroughDoorBargeHandler;
    readonly onProximityBargeDoors: WalkthroughProximityDoorBargeHandler;
    readonly onDoorBarged: () => void;
  }) {
    this.scene = options.scene;
    this.onBargeWalkthroughDoor = options.onBargeWalkthroughDoor;
    this.onProximityBargeDoors = options.onProximityBargeDoors;
    this.onDoorBarged = options.onDoorBarged;
    this.wallRaycaster.near = 0.02;
    this.wallRaycaster.far = 0.55;
  }

  public invalidateObstacleCache(): void {
    if (this.cachedObstacles === null) return;
    // Keep pre-batch obstacle cache intact if already built from unbatched meshes
  }

  public captureFurnitureColliders(): void {
    this.cachedFurnitureBoxes = [];
    this.cachedObstacles = null;
    this.getObstacleCache();
  }

  public checkProximityDoorBarge(
    footPos: THREE.Vector3,
    moveDirX: number,
    moveDirZ: number,
    isSprinting: boolean
  ): boolean {
    const barged = this.onProximityBargeDoors(footPos.x, footPos.y, footPos.z, moveDirX, moveDirZ, isSprinting);
    if (barged) this.onDoorBarged();
    return barged;
  }

  private findHitInteractableId(hitObject: THREE.Object3D): string | undefined {
    let curObj: THREE.Object3D | null = hitObject;
    while (curObj && curObj !== this.scene) {
      const uid = (curObj.userData as Record<string, unknown> | undefined)?.interactableId;
      if (typeof uid === 'string') return uid;
      curObj = curObj.parent;
    }
    return undefined;
  }

  private tryBargeHitDoor(
    hitObject: THREE.Object3D,
    allowDoorBarge: boolean,
    isSprinting: boolean,
    fromFoot: THREE.Vector3,
    moveDirXZ: THREE.Vector3
  ): boolean {
    if (!allowDoorBarge) return false;
    const interactableId = this.findHitInteractableId(hitObject);
    if (!interactableId) return false;
    const barged = this.onBargeWalkthroughDoor(
      interactableId,
      isSprinting,
      fromFoot.x,
      fromFoot.y,
      fromFoot.z,
      moveDirXZ.x,
      moveDirXZ.z
    );
    if (barged) this.onDoorBarged();
    return barged;
  }

  public depenetrateFootPosition(footPos: THREE.Vector3, currentEyeHeight: number): void {
    if (isInsideSpiralStaircaseCutout(footPos.x, footPos.z) || footPos.y >= 2.2) return;
    this.getObstacleCache();
    const furnMinY = footPos.y + 0.25;
    const furnMaxY = footPos.y + Math.max(currentEyeHeight, STANDING_EYE_HEIGHT) + 0.15;
    const furnPad = 0.2;
    const furnPadSq = furnPad * furnPad;

    for (let iter = 0; iter < 2; iter++) {
      let pushed = false;
      for (let i = 0; i < this.cachedFurnitureBoxes.length; i++) {
        const f = this.cachedFurnitureBoxes[i];
        if (f.maxY <= furnMinY || f.minY >= furnMaxY) continue;
        const dx = f.centerX - footPos.x;
        const dz = f.centerZ - footPos.z;
        const maxDist = f.radiusXZ + furnPad + 0.15;
        if (dx * dx + dz * dz > maxDist * maxDist) continue;
        const visTarget = f.mesh.parent ? f.mesh : f.visibilityNode;
        if (!isObjectVisibleInHierarchy(visTarget)) continue;

        const vx = -f.uz;
        const vz = f.ux;
        const curU = footPos.x * f.ux + footPos.z * f.uz;
        const curV = footPos.x * vx + footPos.z * vz;
        const clampedU = Math.max(f.minU, Math.min(f.maxU, curU));
        const clampedV = Math.max(f.minV, Math.min(f.maxV, curV));
        const du = curU - clampedU;
        const dv = curV - clampedV;
        const distSq = du * du + dv * dv;
        if (distSq >= furnPadSq) continue;

        let targetU = curU;
        let targetV = curV;
        if (distSq > 1e-6) {
          const dist = Math.sqrt(distSq);
          const push = furnPad - dist + 0.005;
          targetU += (du / dist) * push;
          targetV += (dv / dist) * push;
        } else {
          const dMinU = curU - (f.minU - furnPad);
          const dMaxU = f.maxU + furnPad - curU;
          const dMinV = curV - (f.minV - furnPad);
          const dMaxV = f.maxV + furnPad - curV;
          const minD = Math.min(dMinU, dMaxU, dMinV, dMaxV);
          if (minD === dMinU) targetU = f.minU - furnPad - 0.005;
          else if (minD === dMaxU) targetU = f.maxU + furnPad + 0.005;
          else if (minD === dMinV) targetV = f.minV - furnPad - 0.005;
          else targetV = f.maxV + furnPad + 0.005;
        }

        const nextX = targetU * f.ux + targetV * vx;
        const nextZ = targetU * f.uz + targetV * vz;
        const pushDir = new THREE.Vector3(nextX - footPos.x, 0, nextZ - footPos.z);
        const pushLen = pushDir.length();
        if (pushLen > 1e-4) {
          pushDir.divideScalar(pushLen);
          if (!this.isBlockedByWallOrCabinet(footPos, pushDir, pushLen, currentEyeHeight, false, false)) {
            footPos.x = nextX;
            footPos.z = nextZ;
            pushed = true;
          }
        }
      }
      if (!pushed) break;
    }
  }

  public ensureFootPositionUnblocked(footPos: THREE.Vector3, currentEyeHeight: number): void {
    this.depenetrateFootPosition(footPos, currentEyeHeight);
    const cardinals = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0, -1),
    ];
    const blockedCount = cardinals.filter((dir) =>
      this.isBlockedByWallOrCabinet(footPos, dir, 0.32, currentEyeHeight, false, false)
    ).length;
    if (blockedCount >= 2) {
      const bestSpawn = findNearestWalkthroughSpawn(footPos.x, footPos.y, footPos.z);
      footPos.set(bestSpawn.position[0], bestSpawn.position[1], bestSpawn.position[2]);
      footPos.y = sampleFloorElevation(footPos.x, footPos.y, footPos.z);
    }
  }

  public getObstacleCache(): readonly CachedObstacle[] {
    if (this.cachedObstacles !== null) return this.cachedObstacles;
    const list: CachedObstacle[] = [];
    const furnitureList: CachedFurnitureBox[] = [];
    const rebuildFurniture = this.cachedFurnitureBoxes.length === 0;
    this.scene.updateMatrixWorld(true);

    this.scene.traverse((obj) => {
      if (!(obj instanceof THREE.Mesh) || obj.geometry instanceof THREE.PlaneGeometry) return;
      if (
        obj.userData?.isAnnotationGroup ||
        obj.userData?.circuitId ||
        obj.userData?.isBatchedStaticMesh === true
      ) {
        return;
      }
      if (
        typeof obj.name === 'string' &&
        (obj.name.startsWith('hall.stairs') ||
          obj.name.startsWith('outbuildings.barn.mezzanineLadder') ||
          obj.name.startsWith('outbuildings.store.loftLadder') ||
          obj.name.startsWith('outbuildings.barn.spiralStaircase') ||
          obj.name.startsWith('outbuildings.stable.exteriorBalconyStaircase') ||
          obj.name.startsWith('outbuildings.firstFloor.stableEastBalcony.deck') ||
          obj.name.startsWith('outbuildings.firstFloor.stableEastBalcony.copingFascia') ||
          obj.name.startsWith('outbuildings.barn.mezzanineStairwell') ||
          obj.name.startsWith('outbuildings.firstFloor.stairwellFascia') ||
          obj.name.startsWith('outbuildings.firstFloor.stableUpStep') ||
          obj.name.startsWith('outbuildings.barn.floorDropStep') ||
          obj.name.includes('turfMat') ||
          obj.name.includes('hittingStrip') ||
          obj.name.includes('ballTray') ||
          obj.name.includes('ballFlightTracer') ||
          obj.name.includes('cobblePath') ||
          obj.name === 'courtyard.vegetableGarden.endGlass' ||
          obj.name === 'courtyard.vegetableGarden.roofGlass' ||
          obj.name === 'courtyard.vegetableGarden.roofBar' ||
          obj.name === 'courtyard.vegetableGarden.stoneCourse' ||
          obj.name === 'courtyard.vegetableGarden.copingStone' ||
          obj.name === 'courtyard.grapeVinePergola.stoneCourse' ||
          obj.name === 'courtyard.grapeVinePergola.copingStone' ||
          obj.name === 'courtyard.grapeVinePergola.dwarfCoping' ||
          obj.name === 'courtyard.grapeVinePergola.westNorthStep' ||
          obj.name === 'courtyard.grapeVinePergola.westSouthStep' ||
          obj.name === 'courtyard.grapeVinePergola.eastGardenStep')
      ) {
        return;
      }

      const isDynamicObject = (node: THREE.Object3D): boolean => {
        const u = node.userData as Record<string, unknown> | undefined;
        if (u?.isBifoldDoor === true || u?.isCarGate === true) {
          return true;
        }
        if (
          typeof u?.interactableId === 'string' &&
          (u.interactableId.startsWith('door-') || u.interactableId.startsWith('bifold-cupboard-'))
        ) {
          return true;
        }
        return typeof node.name === 'string' && /bifold|doorPivot/i.test(node.name);
      };
      let hasDynamicAncestor = isDynamicObject(obj);
      let hasArchitecturalShellAncestor =
        obj.userData?.isArchitecturalShell === true ||
        obj.userData?.isCutawayWall === true ||
        Boolean(obj.userData?.cutawayWall);
      let isHighPolyPropOrFoliage = false;
      let skipGroup = false;
      let cur: THREE.Object3D | null = obj.parent;
      while (cur && cur !== this.scene) {
        if (cur.userData?.isAnnotationGroup || cur.userData?.ufhZoneId) {
          skipGroup = true;
          break;
        }
        if (typeof cur.name === 'string') {
          if (
            cur.name.endsWith('.groundCeiling') ||
            cur.name.endsWith('.roof') ||
            cur.name === 'outbuildings.roofTrusses' ||
            cur.name === 'outbuildings.barn.mezzanineLadder' ||
            cur.name === 'outbuildings.store.loftLadder' ||
            cur.name.startsWith('outbuildings.barn.spiralStaircase') ||
            cur.name.startsWith('outbuildings.stable.exteriorBalconyStaircase') ||
            cur.name.startsWith('outbuildings.barn.mezzanineStairwell') ||
            cur.name.startsWith('hall.stairs') ||
            cur.name.includes('turfMat') ||
            cur.name.includes('ufh')
          ) {
            skipGroup = true;
            break;
          }
          if (
            cur.name.includes('porsche992TurboS') ||
            cur.name.includes('landRoverDefender') ||
            cur.name.includes('grapeVineCanopy') ||
            cur.name.includes('dryStoneRelief') ||
            cur.name.includes('climbingIvy') ||
            cur.name.includes('wisteria') ||
            cur.name.includes('oliveTree') ||
            cur.name.includes('fiddleLeaf') ||
            cur.name.includes('botanicalShrub')
          ) {
            isHighPolyPropOrFoliage = true;
          }
        }
        if (
          cur.userData?.isArchitecturalShell === true ||
          cur.userData?.isCutawayWall === true ||
          Boolean(cur.userData?.cutawayWall)
        ) {
          hasArchitecturalShellAncestor = true;
        }
        if (isDynamicObject(cur)) hasDynamicAncestor = true;
        cur = cur.parent;
      }
      if (skipGroup) return;

      if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
      const geomBox = obj.geometry.boundingBox;
      if (!geomBox || geomBox.isEmpty()) return;
      this.tmpBox.copy(geomBox).applyMatrix4(obj.matrixWorld);
      if (this.tmpBox.isEmpty()) return;

      const sizeX = this.tmpBox.max.x - this.tmpBox.min.x;
      const sizeY = this.tmpBox.max.y - this.tmpBox.min.y;
      const sizeZ = this.tmpBox.max.z - this.tmpBox.min.z;
      const centerX = (this.tmpBox.min.x + this.tmpBox.max.x) * 0.5;
      const centerZ = (this.tmpBox.min.z + this.tmpBox.max.z) * 0.5;
      const radiusXZ = Math.hypot(sizeX, sizeZ) * 0.5;

      const isBlindOrCurtain = typeof obj.name === 'string' && /romanBlind|curtain/i.test(obj.name);
      const isWindowGlass =
        !hasDynamicAncestor &&
        (Array.isArray(obj.material)
          ? obj.material.some(
              (m) =>
                Boolean((m as THREE.Material & { transparent?: boolean }).transparent) &&
                ((m as THREE.Material & { opacity?: number }).opacity ?? 1) <= 0.5
            )
          : Boolean(
              (obj.material as THREE.Material & { transparent?: boolean })?.transparent &&
                ((obj.material as THREE.Material & { opacity?: number })?.opacity ?? 1) <= 0.5
            )) &&
        sizeY >= 0.45 &&
        Math.min(sizeX, sizeZ) <= 0.16 &&
        Math.max(sizeX, sizeZ) >= 0.35;
      const isBoxOrShellWall =
        !isHighPolyPropOrFoliage &&
        (isBlindOrCurtain ||
          isWindowGlass ||
          hasDynamicAncestor ||
          obj.geometry instanceof THREE.BoxGeometry ||
          hasArchitecturalShellAncestor);
      if (
        isBoxOrShellWall &&
        (sizeY >= 0.45 || (isBlindOrCurtain && sizeY >= 0.25)) &&
        (Math.max(sizeX, sizeZ) >= 0.32 || (sizeY >= 0.85 && Math.max(sizeX, sizeZ) >= 0.04)) &&
        Math.min(sizeX, sizeZ) >= 0.008 &&
        Math.max(sizeX, sizeZ) <= 28.0
      ) {
        list.push({
          mesh: obj,
          visibilityNode: obj.parent ?? obj,
          localBox: geomBox.clone(),
          centerX,
          centerZ,
          radiusXZ,
          minY: this.tmpBox.min.y,
          maxY: this.tmpBox.max.y,
          isDynamic: hasDynamicAncestor,
        });
      }

      const isDoorFrameOrJamb =
        typeof obj.name === 'string' &&
        (obj.name.startsWith('outbuildings.door.') ||
          obj.name.startsWith('outbuildings.doorArchitrave.') ||
          obj.name.startsWith('outbuildings.garageDoor.') ||
          obj.name.includes('.doorFrame') ||
          obj.name.includes('.sill'));

      const isGardenOrPergolaWalkableOrFoliage =
        typeof obj.name === 'string' &&
        (obj.name.startsWith('courtyard.grapeVinePergola.') ||
          obj.name.startsWith('courtyard.vegetableGarden.') ||
          obj.name.startsWith('courtyard.patioBorderPlant') ||
          obj.name.includes('.botanical') ||
          obj.name.includes('trailingSpray') ||
          obj.name.includes('cropMound') ||
          obj.name.includes('vineClimber'));

      if (
        rebuildFurniture &&
        !isHighPolyPropOrFoliage &&
        !isGardenOrPergolaWalkableOrFoliage &&
        !hasDynamicAncestor &&
        !isDoorFrameOrJamb &&
        Math.max(sizeX, sizeZ) <= 5.5
      ) {
        const floorY = sampleFloorElevation(centerX, this.tmpBox.max.y, centerZ);
        const topAboveFloor = this.tmpBox.max.y - floorY;
        const botAboveFloor = this.tmpBox.min.y - floorY;

        if (topAboveFloor >= 0.34 && topAboveFloor <= 2.32 && botAboveFloor <= 1.65) {
          const localBox = geomBox;
          const m = obj.matrixWorld.elements;
          const lenAx = Math.hypot(m[0], m[2]);
          const lenAz = Math.hypot(m[8], m[10]);
          let ux = 1;
          let uz = 0;
          if (lenAx >= lenAz && lenAx > 1e-4) {
            ux = m[0] / lenAx;
            uz = m[2] / lenAx;
          } else if (lenAz > 1e-4) {
            ux = m[8] / lenAz;
            uz = m[10] / lenAz;
          }
          const vx = -uz;
          const vz = ux;

          let minU = Number.POSITIVE_INFINITY;
          let maxU = Number.NEGATIVE_INFINITY;
          let minV = Number.POSITIVE_INFINITY;
          let maxV = Number.NEGATIVE_INFINITY;

          for (let cxIdx = 0; cxIdx < 2; cxIdx++) {
            const lx = cxIdx === 0 ? localBox.min.x : localBox.max.x;
            for (let cyIdx = 0; cyIdx < 2; cyIdx++) {
              const ly = cyIdx === 0 ? localBox.min.y : localBox.max.y;
              for (let czIdx = 0; czIdx < 2; czIdx++) {
                const lz = czIdx === 0 ? localBox.min.z : localBox.max.z;
                this.tmpCorner.set(lx, ly, lz).applyMatrix4(obj.matrixWorld);
                const u = this.tmpCorner.x * ux + this.tmpCorner.z * uz;
                const v = this.tmpCorner.x * vx + this.tmpCorner.z * vz;
                if (u < minU) minU = u;
                if (u > maxU) maxU = u;
                if (v < minV) minV = v;
                if (v > maxV) maxV = v;
              }
            }
          }

          let uSpan = maxU - minU;
          let vSpan = maxV - minV;
          if (isBlindOrCurtain || isWindowGlass) {
            const padDepth = isWindowGlass ? 0.15 : 0.1;
            if (uSpan < vSpan) {
              minU -= padDepth;
              maxU += padDepth;
              uSpan = maxU - minU;
            } else {
              minV -= padDepth;
              maxV += padDepth;
              vSpan = maxV - minV;
            }
          }

          const validDimensions =
            isBlindOrCurtain || isWindowGlass
              ? Math.max(uSpan, vSpan) >= 0.32 && Math.max(uSpan, vSpan) <= 5.2
              : Math.min(uSpan, vSpan) >= 0.29 && Math.max(uSpan, vSpan) >= 0.36 && Math.max(uSpan, vSpan) <= 5.2;

          if (validDimensions) {
            furnitureList.push({
              mesh: obj,
              visibilityNode: obj.parent ?? obj,
              centerX,
              centerZ,
              radiusXZ: Math.max(radiusXZ, Math.hypot(uSpan, vSpan) * 0.5),
              minY: this.tmpBox.min.y,
              maxY: this.tmpBox.max.y,
              ux,
              uz,
              minU,
              maxU,
              minV,
              maxV,
            });
          }
        }
      }
    });

    this.cachedObstacles = list;
    if (rebuildFurniture) this.cachedFurnitureBoxes = furnitureList;
    return list;
  }

  public getLastMovedDistance(): number {
    return this.lastMovedDistance;
  }

  public isBlockedByWallOrCabinet(
    fromFoot: THREE.Vector3,
    moveDirXZ: THREE.Vector3,
    stepDist: number,
    currentEyeHeight: number,
    allowDoorBarge: boolean,
    isSprinting: boolean,
    outNormal?: THREE.Vector3
  ): boolean {
    if (outNormal) outNormal.set(0, 0, 0);
    const nextX = fromFoot.x + moveDirXZ.x * stepDist;
    const nextZ = fromFoot.z + moveDirXZ.z * stepDist;

    const boundsStatus = evaluateArchitecturalWalkwayBounds(fromFoot, nextX, nextZ);
    if (boundsStatus === 'blocked') return true;
    if (boundsStatus === 'clear') return false;

    const obstacles = this.getObstacleCache();
    const furnMinY = fromFoot.y + 0.25;
    const furnMaxY = fromFoot.y + Math.max(currentEyeHeight, STANDING_EYE_HEIGHT) + 0.15;
    const furnPad = 0.2;
    const furnPadSq = furnPad * furnPad;
    const furnReach = stepDist + furnPad + 0.25;

    for (let i = 0; i < this.cachedFurnitureBoxes.length; i++) {
      const f = this.cachedFurnitureBoxes[i];
      if (f.maxY <= furnMinY || f.minY >= furnMaxY) continue;
      const dx = f.centerX - fromFoot.x;
      const dz = f.centerZ - fromFoot.z;
      const maxDist = f.radiusXZ + furnReach;
      if (dx * dx + dz * dz > maxDist * maxDist) continue;
      const visTarget = f.mesh.parent ? f.mesh : f.visibilityNode;
      if (!isObjectVisibleInHierarchy(visTarget)) continue;

      const vx = -f.uz;
      const vz = f.ux;
      const curU = fromFoot.x * f.ux + fromFoot.z * f.uz;
      const curV = fromFoot.x * vx + fromFoot.z * vz;
      const nextU = nextX * f.ux + nextZ * f.uz;
      const nextV = nextX * vx + nextZ * vz;

      const curDu = curU < f.minU ? f.minU - curU : curU > f.maxU ? curU - f.maxU : 0;
      const curDv = curV < f.minV ? f.minV - curV : curV > f.maxV ? curV - f.maxV : 0;
      const curDistSq = curDu * curDu + curDv * curDv;

      const nextDu = nextU < f.minU ? f.minU - nextU : nextU > f.maxU ? nextU - f.maxU : 0;
      const nextDv = nextV < f.minV ? f.minV - nextV : nextV > f.maxV ? nextV - f.maxV : 0;
      const nextDistSq = nextDu * nextDu + nextDv * nextDv;

      if (nextDistSq < furnPadSq) {
        let blockedByFurn = false;
        if (curDistSq >= furnPadSq || nextDistSq < curDistSq - 1e-5) {
          blockedByFurn = true;
        } else if (curDistSq === 0) {
          const midU = (f.minU + f.maxU) * 0.5;
          const midV = (f.minV + f.maxV) * 0.5;
          const curCenterSq = (curU - midU) ** 2 + (curV - midV) ** 2;
          const nextCenterSq = (nextU - midU) ** 2 + (nextV - midV) ** 2;
          if (nextCenterSq < curCenterSq) blockedByFurn = true;
        }
        if (blockedByFurn) {
          if (outNormal) {
            const clampedU = Math.max(f.minU, Math.min(f.maxU, nextU));
            const clampedV = Math.max(f.minV, Math.min(f.maxV, nextV));
            let ou = nextU - clampedU;
            let ov = nextV - clampedV;
            if (Math.hypot(ou, ov) < 1e-4) {
              const midU = (f.minU + f.maxU) * 0.5;
              const midV = (f.minV + f.maxV) * 0.5;
              ou = Math.abs(curU - midU) >= Math.abs(curV - midV) ? Math.sign(curU - midU) : 0;
              ov = ou === 0 ? Math.sign(curV - midV) || 1 : 0;
            }
            const nx = ou * f.ux + ov * vx;
            const nz = ou * f.uz + ov * vz;
            const nLen = Math.hypot(nx, nz);
            if (nLen > 1e-4) {
              outNormal.set(nx / nLen, 0, nz / nLen);
            }
          }
          return true;
        }
      }
    }

    this.nearbyObstacleMeshes.length = 0;
    const footMinY = fromFoot.y + 0.3;
    const footMaxY = fromFoot.y + Math.max(currentEyeHeight, STANDING_EYE_HEIGHT) + 0.18;
    const reach = stepDist + 0.72;

    for (let i = 0; i < obstacles.length; i++) {
      const obs = obstacles[i];
      if (!obs.isDynamic && (obs.maxY <= footMinY || obs.minY >= footMaxY)) continue;
      const coarseDx = obs.centerX - fromFoot.x;
      const coarseDz = obs.centerZ - fromFoot.z;
      const coarseMaxDist = obs.radiusXZ + reach + (obs.isDynamic ? 1.4 : 0);
      if (coarseDx * coarseDx + coarseDz * coarseDz > coarseMaxDist * coarseMaxDist) continue;

      const visTarget = obs.mesh.parent ? obs.mesh : obs.visibilityNode;
      if (!isObjectVisibleInHierarchy(visTarget)) continue;

      if (obs.isDynamic) {
        if (!obs.mesh.parent) {
          obs.mesh.matrixWorld.multiplyMatrices(obs.visibilityNode.matrixWorld, obs.mesh.matrix);
        }
        this.tmpBox.copy(obs.localBox).applyMatrix4(obs.mesh.matrixWorld);
        obs.centerX = (this.tmpBox.min.x + this.tmpBox.max.x) * 0.5;
        obs.centerZ = (this.tmpBox.min.z + this.tmpBox.max.z) * 0.5;
        obs.minY = this.tmpBox.min.y;
        obs.maxY = this.tmpBox.max.y;
        if (obs.maxY <= footMinY || obs.minY >= footMaxY) continue;
        const dx = obs.centerX - fromFoot.x;
        const dz = obs.centerZ - fromFoot.z;
        const maxDist = obs.radiusXZ + reach;
        if (dx * dx + dz * dz > maxDist * maxDist) continue;
      }
      this.nearbyObstacleMeshes.push(obs.mesh);
    }

    if (this.nearbyObstacleMeshes.length === 0) return false;

    const backOff = 0.08;
    const maxHitDist = stepDist + 0.34 + backOff;
    this.wallRaycaster.far = Math.max(0.42, maxHitDist + 0.04);
    const perpX = -moveDirXZ.z;
    const perpZ = moveDirXZ.x;
    const upperRayY = Math.min(1.28, Math.max(0.85, currentEyeHeight - 0.12));

    let bestHitDist = Number.POSITIVE_INFINITY;
    let foundHit = false;

    for (const rayOffsetY of [0.52, upperRayY] as const) {
      for (const latOffset of [0, -0.15, 0.15] as const) {
        this.tmpOrigin.set(
          fromFoot.x + perpX * latOffset - moveDirXZ.x * backOff,
          fromFoot.y + rayOffsetY,
          fromFoot.z + perpZ * latOffset - moveDirXZ.z * backOff
        );
        this.wallRaycaster.set(this.tmpOrigin, moveDirXZ);

        const hits = this.wallRaycaster.intersectObjects(this.nearbyObstacleMeshes, false);
        for (let i = 0; i < hits.length; i++) {
          const hit = hits[i];
          if (hit.distance >= 0.01 && hit.distance <= maxHitDist && hit.face) {
            if (this.tryBargeHitDoor(hit.object, allowDoorBarge, isSprinting, fromFoot, moveDirXZ)) {
              continue;
            }
            this.tmpNormal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
            if (Math.abs(this.tmpNormal.y) < 0.45) {
              const horizLen = Math.hypot(this.tmpNormal.x, this.tmpNormal.z);
              if (horizLen > 1e-4) {
                let nx = this.tmpNormal.x / horizLen;
                let nz = this.tmpNormal.z / horizLen;
                const dotMove = nx * moveDirXZ.x + nz * moveDirXZ.z;
                if (dotMove > 0.01) {
                  // Double-sided or inward-wound wall face: flip outward normal to oppose approach
                  nx = -nx;
                  nz = -nz;
                }
                if (nx * moveDirXZ.x + nz * moveDirXZ.z < -0.01) {
                  if (!outNormal) return true;
                  if (hit.distance < bestHitDist) {
                    bestHitDist = hit.distance;
                    outNormal.set(nx, 0, nz);
                    foundHit = true;
                  }
                }
              }
            }
          }
        }
      }
    }

    // Capsule shoulder whisker rays (±26 deg) so sliding nearly parallel to a wall maintains capsule skin clearance
    if (!foundHit) {
      const cosA = 0.8988;
      const sinA = 0.4384;
      const shoulderMaxDist = stepDist + 0.29;
      this.wallRaycaster.far = shoulderMaxDist + 0.04;
      this.tmpOrigin.set(fromFoot.x, fromFoot.y + 0.52, fromFoot.z);
      for (const sign of [-1, 1] as const) {
        this.tmpRayDir.set(
          moveDirXZ.x * cosA - sign * moveDirXZ.z * sinA,
          0,
          moveDirXZ.x * sign * sinA + moveDirXZ.z * cosA
        );
        this.wallRaycaster.set(this.tmpOrigin, this.tmpRayDir);
        const hits = this.wallRaycaster.intersectObjects(this.nearbyObstacleMeshes, false);
        for (let i = 0; i < hits.length; i++) {
          const hit = hits[i];
          if (hit.distance >= 0.01 && hit.distance <= shoulderMaxDist && hit.face) {
            this.tmpNormal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld);
            if (Math.abs(this.tmpNormal.y) < 0.45) {
              const horizLen = Math.hypot(this.tmpNormal.x, this.tmpNormal.z);
              if (horizLen > 1e-4) {
                let nx = this.tmpNormal.x / horizLen;
                let nz = this.tmpNormal.z / horizLen;
                if (nx * this.tmpRayDir.x + nz * this.tmpRayDir.z > 0) {
                  nx = -nx;
                  nz = -nz;
                }
                if (nx * moveDirXZ.x + nz * moveDirXZ.z < -0.08) {
                  if (outNormal) outNormal.set(nx, 0, nz);
                  return true;
                }
              }
            }
          }
        }
      }
    }

    return foundHit;
  }

  /**
   * FPS Collide-and-Slide (`PM_ClipVelocity` / `UCharacterMovementComponent::SlideAlongSurface`):
   * 1. Attempts primary step along `moveVec`.
   * 2. If blocked by a surface with horizontal outward unit normal `n1`:
   *    - Head-on deadzone (`moveVec · n1 <= -0.94`, within ~20° of perpendicular): stops cleanly
   *      against the wall rather than drifting sideways from a slight camera angle.
   *    - Angled contact: projects the movement vector onto the wall tangent plane
   *      (`v_slide = v - (v · n1) * n1`) with wall friction (`0.90`).
   *    - 2-plane corner crease check: if the slid vector hits a second wall `n2`, comes to a
   *      clean stop in the corner without oscillating.
   */
  public stepHorizontalMovement(
    footPos: THREE.Vector3,
    moveVec: THREE.Vector3,
    forwardInput: number,
    targetYawRad: number,
    stepDist: number,
    currentEyeHeight: number,
    isSprinting: boolean,
    dtSeconds: number
  ): number {
    const startX = footPos.x;
    const startZ = footPos.z;

    this.checkProximityDoorBarge(footPos, moveVec.x, moveVec.z, isSprinting);
    const updatedYaw = applySpiralStaircaseHelicalGuidance(footPos, moveVec, forwardInput, targetYawRad, dtSeconds);
    const preStairState = evaluateActiveStaircaseRiserState(footPos.x, footPos.y, footPos.z);
    const stairHaulPulse = preStairState
      ? 0.92 + 0.22 * Math.sin(preStairState.riserIndex * Math.PI * 2 - Math.PI * 0.25)
      : 1.0;
    const effectiveStepDist = stepDist * stairHaulPulse;
    const primaryBlocked = this.isBlockedByWallOrCabinet(
      footPos,
      moveVec,
      effectiveStepDist,
      currentEyeHeight,
      true,
      isSprinting,
      this.tmpHitNormal1
    );
    if (!primaryBlocked) {
      footPos.x += moveVec.x * effectiveStepDist;
      footPos.z += moveVec.z * effectiveStepDist;
    } else if (this.tmpHitNormal1.lengthSq() > 0.5) {
      const n1x = this.tmpHitNormal1.x;
      const n1z = this.tmpHitNormal1.z;
      const inwardDot = moveVec.x * n1x + moveVec.z * n1z;
      // Head-on deadzone: if walking nearly perpendicular into a wall (within ~20 deg),
      // stop cleanly instead of sliding sideways.
      if (inwardDot > -0.94 && inwardDot < 0) {
        const slideX = moveVec.x - inwardDot * n1x;
        const slideZ = moveVec.z - inwardDot * n1z;
        const slideMag = Math.hypot(slideX, slideZ);
        const wallFriction = 0.90;
        const slideStepDist = effectiveStepDist * slideMag * wallFriction;
        if (slideMag > 0.22 && slideStepDist > 1e-4) {
          this.tmpSlideDir.set(slideX / slideMag, 0, slideZ / slideMag);
          const secondBlocked = this.isBlockedByWallOrCabinet(
            footPos,
            this.tmpSlideDir,
            slideStepDist,
            currentEyeHeight,
            false,
            isSprinting,
            this.tmpHitNormal2
          );
          if (!secondBlocked) {
            footPos.x += this.tmpSlideDir.x * slideStepDist;
            footPos.z += this.tmpSlideDir.z * slideStepDist;
          }
        }
      }
    } else {
      // Analytical walkway boundary fallback (only slide when angled > 20 deg from perpendicular)
      const { projU, projV, slideU, slideV } = computeWingWallSlideAxes(footPos.x, footPos.z, moveVec);
      if (
        Math.abs(projU) >= 0.34 &&
        !this.isBlockedByWallOrCabinet(footPos, slideU, Math.abs(projU) * effectiveStepDist * 0.9, currentEyeHeight, false, isSprinting)
      ) {
        footPos.x += slideU.x * Math.abs(projU) * effectiveStepDist * 0.9;
        footPos.z += slideU.z * Math.abs(projU) * effectiveStepDist * 0.9;
      } else if (
        Math.abs(projV) >= 0.34 &&
        !this.isBlockedByWallOrCabinet(footPos, slideV, Math.abs(projV) * effectiveStepDist * 0.9, currentEyeHeight, false, isSprinting)
      ) {
        footPos.x += slideV.x * Math.abs(projV) * effectiveStepDist * 0.9;
        footPos.z += slideV.z * Math.abs(projV) * effectiveStepDist * 0.9;
      }
    }
    this.depenetrateFootPosition(footPos, currentEyeHeight);
    this.lastMovedDistance = Math.hypot(footPos.x - startX, footPos.z - startZ);
    const targetFloorY = sampleFloorElevation(footPos.x, footPos.y, footPos.z);
    const onStairsNow =
      preStairState !== null ||
      evaluateActiveStaircaseRiserState(footPos.x, targetFloorY, footPos.z) !== null;
    const elevRate = onStairsNow ? 26 : 15;
    footPos.y = THREE.MathUtils.lerp(footPos.y, targetFloorY, 1 - Math.exp(-elevRate * dtSeconds));
    return updatedYaw;
  }

  public stepGlideToTarget(
    footPos: THREE.Vector3,
    glideTargetFoot: THREE.Vector3,
    currentEyeHeight: number,
    dtSeconds: number
  ): { readonly nextGlideTarget: THREE.Vector3 | null; readonly bobDelta: number } {
    const toTarget = new THREE.Vector3(glideTargetFoot.x - footPos.x, 0, glideTargetFoot.z - footPos.z);
    const dist = toTarget.length();
    if (dist < 0.08) {
      footPos.copy(glideTargetFoot);
      return { nextGlideTarget: null, bobDelta: 0 };
    }
    toTarget.divideScalar(dist);
    this.checkProximityDoorBarge(footPos, toTarget.x, toTarget.z, false);
    const step = Math.min(dist, WALK_SPEED_MPS * 1.25 * dtSeconds);
    if (this.isBlockedByWallOrCabinet(footPos, toTarget, step, currentEyeHeight, true, false)) {
      return { nextGlideTarget: null, bobDelta: 0 };
    }
    footPos.x += toTarget.x * step;
    footPos.z += toTarget.z * step;
    const targetFloorY = sampleFloorElevation(footPos.x, footPos.y, footPos.z);
    footPos.y = THREE.MathUtils.lerp(footPos.y, targetFloorY, 1 - Math.exp(-15 * dtSeconds));
    return { nextGlideTarget: glideTargetFoot, bobDelta: dtSeconds * 8.5 };
  }
}
