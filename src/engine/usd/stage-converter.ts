import * as THREE from 'three';
import { CROX_FARMHOUSE_LOD_REGISTRATIONS } from '../../homes/crox-farmhouse/manifest.ts';
import type { CameraPresetDefinition, LightGroupMap, Vec3Tuple } from '../../types/scene.ts';
import { convertThreeMaterialToUsdSpec } from './procedural-materials.ts';
import {
  CROX_USD_ZONE_LAYERS,
  sanitizeUsdIdent,
  type UsdCameraData,
  type UsdCustomAttributeValue,
  type UsdGeomSubsetData,
  type UsdMeshData,
  type UsdPreviewSurfaceData,
  type UsdPrim,
  type UsdStageDocument,
  type UsdXformOps,
} from './schema.ts';

function round5(n: number): number {
  const v = Math.round(n * 1e5) / 1e5;
  return Object.is(v, -0) ? 0 : v;
}

function toVec3(v: THREE.Vector3): Vec3Tuple {
  return [round5(v.x), round5(v.y), round5(v.z)];
}

/**
 * Converts a Three.js Quaternion into OpenUSD `xformOp:rotateXYZ` degrees.
 *
 * OpenUSD `xformOp:rotateXYZ` applies X, then Y, then Z in row-vector convention,
 * which corresponds to column-vector matrix multiplication `R_Z * R_Y * R_X`
 * (`THREE.Euler` order `'ZYX'`).
 */
export function quaternionToUsdRotateXYZDeg(q: THREE.Quaternion): Vec3Tuple {
  const euler = new THREE.Euler().setFromQuaternion(q, 'ZYX');
  const radToDeg = 180 / Math.PI;
  return [
    round5(euler.x * radToDeg),
    round5(euler.y * radToDeg),
    round5(euler.z * radToDeg),
  ];
}

export function matrixToUsdXformOps(matrix: THREE.Matrix4): UsdXformOps {
  const pos = new THREE.Vector3();
  const quat = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  matrix.decompose(pos, quat, scale);
  return {
    translate: toVec3(pos),
    rotateXYZDeg: quaternionToUsdRotateXYZDeg(quat),
    scale: toVec3(scale),
  };
}

class CanonicalMaterialRegistry {
  private readonly matToPrimName = new Map<THREE.Material, string>();
  private readonly signatureToPrimName = new Map<string, string>();
  private readonly materialPrims: UsdPrim[] = [];

  public getOrRegisterMaterial(mat: THREE.Material, usageHint = ''): string {
    const existing = this.matToPrimName.get(mat);
    if (existing) {
      return `/CroxFarmhouse/_Materials/${existing}`;
    }

    const spec: UsdPreviewSurfaceData = convertThreeMaterialToUsdSpec(mat, usageHint);
    const sig = JSON.stringify(spec);
    const bySig = this.signatureToPrimName.get(sig);
    if (bySig) {
      this.matToPrimName.set(mat, bySig);
      return `/CroxFarmhouse/_Materials/${bySig}`;
    }

    const patternKind = spec.proceduralPattern?.kind ?? 'solid';
    const rawLabel = mat.name
      ? sanitizeUsdIdent(mat.name)
      : sanitizeUsdIdent(patternKind);
    const primName = `Mat_${rawLabel}_${this.materialPrims.length}`;

    this.matToPrimName.set(mat, primName);
    this.signatureToPrimName.set(sig, primName);

    this.materialPrims.push({
      specifier: 'def',
      typeName: 'Material',
      name: primName,
      material: spec,
    });

    return `/CroxFarmhouse/_Materials/${primName}`;
  }

  public getMaterialPrims(): readonly UsdPrim[] {
    return this.materialPrims;
  }
}

/**
 * Checks whether a `THREE.BoxGeometry` is an unmodified, origin-centered rectangular box
 * suitable for representation as a parametric `UsdGeomCube`.
 */
function isCleanParametricBox(
  geo: THREE.BufferGeometry
): { readonly width: number; readonly height: number; readonly depth: number } | null {
  if (geo.type !== 'BoxGeometry') return null;
  const params = (
    geo as unknown as {
      parameters?: {
        width?: number;
        height?: number;
        depth?: number;
        widthSegments?: number;
        heightSegments?: number;
        depthSegments?: number;
      };
    }
  ).parameters;
  if (!params) return null;
  const w = params.width ?? 1;
  const h = params.height ?? 1;
  const d = params.depth ?? 1;
  if ((params.widthSegments ?? 1) !== 1 || (params.heightSegments ?? 1) !== 1 || (params.depthSegments ?? 1) !== 1) {
    return null;
  }
  const pos = geo.getAttribute('position');
  if (!pos || pos.count !== 24) return null;

  const hw = w * 0.5;
  const hh = h * 0.5;
  const hd = d * 0.5;
  for (let i = 0; i < pos.count; i++) {
    if (
      Math.abs(Math.abs(pos.getX(i)) - hw) > 1e-4 ||
      Math.abs(Math.abs(pos.getY(i)) - hh) > 1e-4 ||
      Math.abs(Math.abs(pos.getZ(i)) - hd) > 1e-4
    ) {
      return null;
    }
  }
  return { width: w, height: h, depth: d };
}

/**
 * Checks whether a `THREE.CylinderGeometry` or `THREE.ConeGeometry` is an unmodified,
 * origin-centered Y-axis cylinder or cone suitable for `UsdGeomCylinder` or `UsdGeomCone`.
 */
function isCleanParametricCylinderOrCone(
  geo: THREE.BufferGeometry
):
  | { readonly kind: 'cylinder'; readonly radius: number; readonly height: number }
  | { readonly kind: 'cone'; readonly radius: number; readonly height: number }
  | null {
  if (geo.type !== 'CylinderGeometry' && geo.type !== 'ConeGeometry') return null;
  const params = (
    geo as unknown as {
      parameters?: {
        radiusTop?: number;
        radiusBottom?: number;
        radius?: number;
        height?: number;
        openEnded?: boolean;
        thetaLength?: number;
      };
    }
  ).parameters;
  if (!params) return null;
  if (params.openEnded) return null;
  const thetaLen = params.thetaLength ?? Math.PI * 2;
  if (thetaLen < Math.PI * 1.99) return null;

  const h = params.height ?? 1;
  const rTop = geo.type === 'ConeGeometry' ? 0 : (params.radiusTop ?? 1);
  const rBot =
    geo.type === 'ConeGeometry' ? (params.radius ?? 1) : (params.radiusBottom ?? 1);

  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  if (!bb) return null;
  const maxR = Math.max(rTop, rBot);
  if (
    Math.abs((bb.min.y + bb.max.y) * 0.5) > 1e-3 ||
    Math.abs(bb.max.y - bb.min.y - h) > 1e-3 ||
    Math.abs((bb.min.x + bb.max.x) * 0.5) > 1e-2 ||
    Math.abs((bb.min.z + bb.max.z) * 0.5) > 1e-2 ||
    maxR <= 0
  ) {
    return null;
  }

  if (Math.abs(rTop - rBot) < 1e-4) {
    return { kind: 'cylinder', radius: rTop, height: h };
  }
  if (rTop < 1e-5 && rBot > 0) {
    return { kind: 'cone', radius: rBot, height: h };
  }
  return null;
}

/**
 * Checks whether a `THREE.SphereGeometry` is a full, origin-centered sphere suitable for `UsdGeomSphere`.
 */
function isCleanParametricSphere(
  geo: THREE.BufferGeometry
): { readonly radius: number } | null {
  if (geo.type !== 'SphereGeometry') return null;
  const params = (
    geo as unknown as {
      parameters?: {
        radius?: number;
        phiLength?: number;
        thetaLength?: number;
      };
    }
  ).parameters;
  if (!params) return null;
  const phiLen = params.phiLength ?? Math.PI * 2;
  const thetaLen = params.thetaLength ?? Math.PI;
  if (phiLen < Math.PI * 1.99 || thetaLen < Math.PI * 0.99) return null;

  const r = params.radius ?? 1;
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  if (!bb) return null;
  if (
    Math.abs((bb.min.x + bb.max.x) * 0.5) > 1e-3 ||
    Math.abs((bb.min.y + bb.max.y) * 0.5) > 1e-3 ||
    Math.abs((bb.min.z + bb.max.z) * 0.5) > 1e-3
  ) {
    return null;
  }
  return { radius: r };
}

function convertBufferGeometryToUsdMesh(
  geo: THREE.BufferGeometry,
  materials: readonly THREE.Material[],
  matRegistry: CanonicalMaterialRegistry,
  usageHint: string
): {
  readonly meshData: UsdMeshData;
  readonly singleMaterialPath?: string;
} | null {
  const posAttr = geo.getAttribute('position');
  if (!posAttr || posAttr.count < 3) return null;

  const normAttr = geo.getAttribute('normal');
  const uvAttr = geo.getAttribute('uv');
  const indexAttr = geo.getIndex();

  const points: Vec3Tuple[] = [];
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  for (let i = 0; i < posAttr.count; i++) {
    const x = round5(posAttr.getX(i));
    const y = round5(posAttr.getY(i));
    const z = round5(posAttr.getZ(i));
    points.push([x, y, z]);
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }

  const normals: Vec3Tuple[] | undefined = normAttr
    ? Array.from({ length: normAttr.count }, (_, i) => [
        round5(normAttr.getX(i)),
        round5(normAttr.getY(i)),
        round5(normAttr.getZ(i)),
      ])
    : undefined;

  const uvs: [number, number][] | undefined = uvAttr
    ? Array.from({ length: uvAttr.count }, (_, i) => [
        round5(uvAttr.getX(i)),
        round5(uvAttr.getY(i)),
      ])
    : undefined;

  const faceVertexCounts: number[] = [];
  const faceVertexIndices: number[] = [];

  if (indexAttr) {
    const triCount = Math.floor(indexAttr.count / 3);
    for (let f = 0; f < triCount; f++) {
      const i0 = indexAttr.getX(f * 3);
      const i1 = indexAttr.getX(f * 3 + 1);
      const i2 = indexAttr.getX(f * 3 + 2);
      faceVertexCounts.push(3);
      faceVertexIndices.push(i0, i1, i2);
    }
  } else {
    const triCount = Math.floor(posAttr.count / 3);
    for (let f = 0; f < triCount; f++) {
      faceVertexCounts.push(3);
      faceVertexIndices.push(f * 3, f * 3 + 1, f * 3 + 2);
    }
  }

  const resolvedMatPaths = materials.map((m) =>
    matRegistry.getOrRegisterMaterial(m, usageHint)
  );
  const uniqueMatPaths = new Set(resolvedMatPaths);

  let subsets: UsdGeomSubsetData[] | undefined;
  let singleMaterialPath: string | undefined = resolvedMatPaths[0];

  if (uniqueMatPaths.size > 1 && geo.groups.length > 0) {
    singleMaterialPath = undefined;
    const byMatPath = new Map<string, number[]>();
    const totalFaces = faceVertexCounts.length;

    for (const grp of geo.groups) {
      const matIdx = grp.materialIndex ?? 0;
      const matPath = resolvedMatPaths[Math.min(matIdx, resolvedMatPaths.length - 1)];
      if (!matPath) continue;
      const startFace = Math.max(0, Math.floor(grp.start / 3));
      const endFace = Math.min(totalFaces, Math.floor((grp.start + grp.count) / 3));
      let faceList = byMatPath.get(matPath);
      if (!faceList) {
        faceList = [];
        byMatPath.set(matPath, faceList);
      }
      for (let f = startFace; f < endFace; f++) {
        faceList.push(f);
      }
    }

    subsets = [];
    let subsetIdx = 0;
    for (const [matPath, faceIndices] of byMatPath.entries()) {
      if (faceIndices.length === 0) continue;
      subsets.push({
        name: `materialSubset_${subsetIdx++}`,
        faceIndices,
        materialBindingPath: matPath,
      });
    }
  }

  const doubleSided = materials.some((m) => m.side === THREE.DoubleSide);

  return {
    singleMaterialPath,
    meshData: {
      points,
      faceVertexCounts,
      faceVertexIndices,
      normals,
      normalsInterpolation: 'vertex',
      uvs,
      uvsInterpolation: 'vertex',
      doubleSided,
      extent: [
        [minX, minY, minZ],
        [maxX, maxY, maxZ],
      ],
      subsets,
    },
  };
}

function extractCustomAttributes(
  obj: THREE.Object3D,
  zoneId: string
): Readonly<Record<string, UsdCustomAttributeValue>> {
  const attrs: Record<string, UsdCustomAttributeValue> = {
    'twin:roomZoneId': { type: 'token', value: zoneId },
  };
  if (obj.name) {
    attrs['twin:threeName'] = { type: 'string', value: obj.name };
  }

  const u = obj.userData ?? {};
  if (typeof u.lodTier === 'number') {
    attrs['twin:lodTier'] = { type: 'int', value: u.lodTier };
  }
  if (u.isCutawayWall && u.cutawayWall && typeof u.cutawayWall === 'object') {
    const cw = u.cutawayWall as {
      axis?: string;
      coord?: number;
      floor?: string;
    };
    attrs['twin:isCutawayWall'] = { type: 'bool', value: true };
    if (cw.axis) attrs['twin:cutawayAxis'] = { type: 'token', value: cw.axis };
    if (typeof cw.coord === 'number') {
      attrs['twin:cutawayCoord'] = { type: 'double', value: cw.coord };
    }
  }
  if (typeof u.circuitId === 'string') {
    attrs['knx:circuitId'] = { type: 'token', value: u.circuitId };
  }
  if (typeof u.switchPa === 'string') {
    attrs['knx:switchPa'] = { type: 'string', value: u.switchPa };
  }
  if (typeof u.sensorPa === 'string') {
    attrs['knx:sensorPa'] = { type: 'string', value: u.sensorPa };
  }
  if (typeof u.roomMotionSensorId === 'string') {
    attrs['knx:motionSensorId'] = { type: 'token', value: u.roomMotionSensorId };
  }
  if (u.isBifoldDoor) {
    attrs['twin:interactiveKind'] = { type: 'token', value: 'bifoldDoor' };
  } else if (u.isCarGate) {
    attrs['twin:interactiveKind'] = { type: 'token', value: 'drivewayGate' };
  } else if (u.isUniFiCamera && typeof u.cameraId === 'string') {
    attrs['unifi:cameraId'] = { type: 'token', value: u.cameraId };
  } else if (u.isUniFiAccessReader && typeof u.readerId === 'string') {
    attrs['unifi:readerId'] = { type: 'token', value: u.readerId };
  }

  return attrs;
}

function convertObjectBranchToUsdPrim(
  obj: THREE.Object3D,
  zoneId: string,
  matRegistry: CanonicalMaterialRegistry,
  usedNamesInScope: Set<string>,
  useWorldTransform = false
): UsdPrim | null {
  if (obj instanceof THREE.Light || obj instanceof THREE.Camera) {
    return null;
  }
  if (obj instanceof THREE.Line || obj instanceof THREE.Points) {
    return null;
  }

  const rawBaseName = obj.name
    ? obj.name.startsWith(`${zoneId}.`)
      ? obj.name.slice(zoneId.length + 1)
      : obj.name
    : `${obj.type}_${obj.id}`;
  let primName = sanitizeUsdIdent(rawBaseName, sanitizeUsdIdent(obj.type));
  if (usedNamesInScope.has(primName)) {
    let suffix = 2;
    while (usedNamesInScope.has(`${primName}_${suffix}`)) {
      suffix++;
    }
    primName = `${primName}_${suffix}`;
  }
  usedNamesInScope.add(primName);

  const baseXform: UsdXformOps = useWorldTransform
    ? matrixToUsdXformOps(obj.matrixWorld)
    : {
        translate: toVec3(obj.position),
        rotateXYZDeg: quaternionToUsdRotateXYZDeg(obj.quaternion),
        scale: toVec3(obj.scale),
      };

  const visibility = obj.visible ? undefined : ('invisible' as const);
  const customAttributes = extractCustomAttributes(obj, zoneId);
  const isStructuralOrFurniture =
    obj.userData?.lodTier !== 2 && !obj.userData?.isSecurityFovCone;

  // Handle InstancedMesh by expanding instances into child Prims
  if (obj instanceof THREE.InstancedMesh) {
    const geo = obj.geometry as THREE.BufferGeometry;
    const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
    const converted = convertBufferGeometryToUsdMesh(
      geo,
      mats,
      matRegistry,
      `${zoneId}.${primName}`
    );
    if (!converted) return null;

    const instChildren: UsdPrim[] = [];
    const instMat = new THREE.Matrix4();
    for (let i = 0; i < obj.count; i++) {
      obj.getMatrixAt(i, instMat);
      instChildren.push({
        specifier: 'def',
        typeName: 'Mesh',
        name: `Instance_${i}`,
        xform: matrixToUsdXformOps(instMat),
        materialBindingPath: converted.singleMaterialPath,
        mesh: converted.meshData,
      });
    }

    return {
      specifier: 'def',
      typeName: 'Xform',
      name: primName,
      xform: baseXform,
      visibility,
      customAttributes,
      children: instChildren,
    };
  }

  const childScopeNames = new Set<string>();
  const childPrims: UsdPrim[] = [];
  for (const child of obj.children) {
    const convertedChild = convertObjectBranchToUsdPrim(
      child,
      zoneId,
      matRegistry,
      childScopeNames,
      false
    );
    if (convertedChild) {
      childPrims.push(convertedChild);
    }
  }

  if (obj instanceof THREE.Mesh) {
    const geo = obj.geometry as THREE.BufferGeometry;
    const mats = (Array.isArray(obj.material) ? obj.material : [obj.material]).filter(
      Boolean
    ) as THREE.Material[];
    if (mats.length === 0) return null;

    // Skip additive floor glow pool helper planes (lighting in USD is handled by real UsdLux lights)
    const firstMat = mats[0] as THREE.MeshBasicMaterial;
    if (firstMat.blending === THREE.AdditiveBlending && firstMat.depthWrite === false) {
      return null;
    }

    const usageHint = `${zoneId}.${primName}`;
    const resolvedMatPaths = mats.map((m) =>
      matRegistry.getOrRegisterMaterial(m, usageHint)
    );
    const uniqueMatPaths = new Set(resolvedMatPaths);

    // 1. Check if this mesh is a clean single-material parametric Box, Cylinder, Cone, or Sphere
    if (uniqueMatPaths.size === 1) {
      const singleMatPath = resolvedMatPaths[0];
      const doubleSided = mats[0].side === THREE.DoubleSide;

      const cleanBox = isCleanParametricBox(geo);
      if (cleanBox) {
        const baseScale = baseXform.scale ?? [1, 1, 1];
        const scaledBoxXform: UsdXformOps = {
          translate: baseXform.translate,
          rotateXYZDeg: baseXform.rotateXYZDeg,
          scale: [
            round5(baseScale[0] * cleanBox.width),
            round5(baseScale[1] * cleanBox.height),
            round5(baseScale[2] * cleanBox.depth),
          ],
        };
        return {
          specifier: 'def',
          typeName: 'Cube',
          name: primName,
          xform: scaledBoxXform,
          visibility,
          collisionEnabled: isStructuralOrFurniture,
          materialBindingPath: singleMatPath,
          customAttributes: {
            ...customAttributes,
            'twin:boxDimensions': {
              type: 'double3',
              value: [
                round5(cleanBox.width),
                round5(cleanBox.height),
                round5(cleanBox.depth),
              ],
            },
          },
          cube: {
            size: 1.0,
            doubleSided,
            extent: [
              [-0.5, -0.5, -0.5],
              [0.5, 0.5, 0.5],
            ],
          },
          children: childPrims.length > 0 ? childPrims : undefined,
        };
      }

      const cleanCylOrCone = isCleanParametricCylinderOrCone(geo);
      if (cleanCylOrCone) {
        const r = round5(cleanCylOrCone.radius);
        const h = round5(cleanCylOrCone.height);
        const hh = round5(h * 0.5);
        if (cleanCylOrCone.kind === 'cylinder') {
          return {
            specifier: 'def',
            typeName: 'Cylinder',
            name: primName,
            xform: baseXform,
            visibility,
            collisionEnabled: isStructuralOrFurniture,
            materialBindingPath: singleMatPath,
            customAttributes,
            cylinder: {
              axis: 'Y',
              radius: r,
              height: h,
              doubleSided,
              extent: [
                [-r, -hh, -r],
                [r, hh, r],
              ],
            },
            children: childPrims.length > 0 ? childPrims : undefined,
          };
        }
        return {
          specifier: 'def',
          typeName: 'Cone',
          name: primName,
          xform: baseXform,
          visibility,
          collisionEnabled: isStructuralOrFurniture,
          materialBindingPath: singleMatPath,
          customAttributes,
          cone: {
            axis: 'Y',
            radius: r,
            height: h,
            doubleSided,
            extent: [
              [-r, -hh, -r],
              [r, hh, r],
            ],
          },
          children: childPrims.length > 0 ? childPrims : undefined,
        };
      }

      const cleanSphere = isCleanParametricSphere(geo);
      if (cleanSphere) {
        const r = round5(cleanSphere.radius);
        return {
          specifier: 'def',
          typeName: 'Sphere',
          name: primName,
          xform: baseXform,
          visibility,
          materialBindingPath: singleMatPath,
          customAttributes,
          sphere: {
            radius: r,
            doubleSided,
            extent: [
              [-r, -r, -r],
              [r, r, r],
            ],
          },
          children: childPrims.length > 0 ? childPrims : undefined,
        };
      }
    }

    // 2. Otherwise export full polygonal / multi-material UsdGeomMesh
    const converted = convertBufferGeometryToUsdMesh(
      geo,
      mats,
      matRegistry,
      usageHint
    );
    if (!converted) return null;

    return {
      specifier: 'def',
      typeName: 'Mesh',
      name: primName,
      xform: baseXform,
      visibility,
      collisionEnabled: isStructuralOrFurniture,
      materialBindingPath: converted.singleMaterialPath,
      customAttributes,
      mesh: converted.meshData,
      children: childPrims.length > 0 ? childPrims : undefined,
    };
  }

  if (childPrims.length === 0) return null;

  return {
    specifier: 'def',
    typeName: 'Xform',
    name: primName,
    metadata: {
      kind: 'component',
    },
    xform: baseXform,
    visibility,
    customAttributes,
    children: childPrims,
  };
}

/**
 * Resolves which of the 20 `CROX_USD_ZONE_LAYERS` a top-level Three.js branch belongs to.
 */
export function classifyBranchZoneLayer(
  obj: THREE.Object3D,
  roofGroupSet: ReadonlySet<THREE.Object3D>,
  isFirstFloorLayer: boolean
): string {
  let curr: THREE.Object3D | null = obj;
  while (curr) {
    if (roofGroupSet.has(curr)) {
      return 'roofAndCeilings';
    }
    curr = curr.parent;
  }

  const u = obj.userData ?? {};
  if (
    u.isUniFiCamera ||
    u.isUniFiAccessReader ||
    u.isSecurityFovCone ||
    (typeof obj.name === 'string' &&
      (obj.name.startsWith('ufh.') ||
        obj.name.startsWith('security.') ||
        obj.name.startsWith('unifi.')))
  ) {
    return 'securityAndMep';
  }

  const validZoneIds = new Set(CROX_USD_ZONE_LAYERS.map((z) => z.zoneId));
  const explicitZone = (u.zoneId ?? u.zone) as string | undefined;
  if (explicitZone && validZoneIds.has(explicitZone)) {
    return explicitZone;
  }

  if (typeof obj.name === 'string' && obj.name.length > 0) {
    const dotIdx = obj.name.indexOf('.');
    const prefix = dotIdx > 0 ? obj.name.slice(0, dotIdx) : obj.name;
    if (prefix === 'diningRoom') return 'familyRoom';
    if (prefix === 'westBayWindow') return 'livingRoom';
    if (prefix === 'westWingCorridor') return 'upperLanding';
    if (validZoneIds.has(prefix)) return prefix;
  }

  const box = new THREE.Box3().setFromObject(obj);
  if (box.isEmpty()) {
    return isFirstFloorLayer ? 'upperLanding' : 'courtyard';
  }
  const center = new THREE.Vector3();
  box.getCenter(center);

  if (center.y >= 4.25) {
    return 'roofAndCeilings';
  }

  const targetFloor = isFirstFloorLayer || center.y >= 2.15 ? 'first' : 'ground';

  for (const reg of CROX_FARMHOUSE_LOD_REGISTRATIONS) {
    if (reg.floorId !== targetFloor) continue;
    const b = reg.bounds;
    if (
      center.x >= b.minX - 0.45 &&
      center.x <= b.maxX + 0.45 &&
      center.z >= b.minZ - 0.45 &&
      center.z <= b.maxZ + 0.45
    ) {
      return reg.zoneId;
    }
  }

  let bestZoneId = targetFloor === 'first' ? 'upperLanding' : 'courtyard';
  let bestDistSq = Number.POSITIVE_INFINITY;
  for (const reg of CROX_FARMHOUSE_LOD_REGISTRATIONS) {
    if (reg.floorId !== targetFloor) continue;
    const b = reg.bounds;
    const cx = (b.minX + b.maxX) * 0.5;
    const cz = (b.minZ + b.maxZ) * 0.5;
    const dSq = (center.x - cx) * (center.x - cx) + (center.z - cz) * (center.z - cz);
    if (dSq < bestDistSq) {
      bestDistSq = dSq;
      bestZoneId = reg.zoneId;
    }
  }

  return bestZoneId;
}

function buildLightingAndCamerasLayer(
  lightGroups: LightGroupMap,
  cameraPresets: readonly CameraPresetDefinition[]
): UsdStageDocument {
  const lightPrims: UsdPrim[] = [];

  // 1. Exterior Architectural Sun & Sky Dome (`UsdLuxDistantLight` + `UsdLuxDomeLight`)
  lightPrims.push(
    {
      specifier: 'def',
      typeName: 'DistantLight',
      name: 'SunLight',
      metadata: {
        doc: 'Primary South-West afternoon sunlight for Crox Farmhouse',
      },
      xform: {
        translate: [-18, 28, 22],
        rotateXYZDeg: [-42, -28, 0],
      },
      light: {
        color: [1.0, 0.96, 0.9],
        intensity: 450,
        angleDeg: 0.53,
        enableColorTemperature: true,
        colorTemperatureK: 5600,
      },
    },
    {
      specifier: 'def',
      typeName: 'DomeLight',
      name: 'SkyDomeLight',
      metadata: {
        doc: 'Soft Leicestershire daylight sky dome ambient illumination',
      },
      light: {
        color: [0.85, 0.91, 1.0],
        intensity: 1.2,
      },
    }
  );

  // 2. All KNX Lighting Circuits (`UsdLuxSphereLight`) grouped by KNX Circuit ID
  const usedLightNames = new Set<string>(['SunLight', 'SkyDomeLight']);
  for (const [circuitId, group] of Object.entries(lightGroups)) {
    if (!group || group.lights.length === 0) continue;
    const circuitPrimName = sanitizeUsdIdent(`Circuit_${circuitId}`);
    const circuitChildren: UsdPrim[] = [];

    for (let i = 0; i < group.lights.length; i++) {
      const l = group.lights[i];
      l.updateWorldMatrix(true, false);
      const worldPos = new THREE.Vector3();
      const worldQuat = new THREE.Quaternion();
      const worldScale = new THREE.Vector3();
      l.matrixWorld.decompose(worldPos, worldQuat, worldScale);

      const c: Vec3Tuple = [
        round5(l.color.r),
        round5(l.color.g),
        round5(l.color.b),
      ];
      // Scale Three.js candela intensity to physical UsdLux intensity for Blender EEVEE & UE5
      const usdIntensity = round5(Math.max(15, group.maxIntensity * 18));
      const isSpot = l instanceof THREE.SpotLight;
      const spotAngleDeg = isSpot
        ? round5(((l as THREE.SpotLight).angle * 180) / Math.PI)
        : undefined;

      circuitChildren.push({
        specifier: 'def',
        typeName: 'SphereLight',
        name: `Fixture_${i + 1}`,
        xform: {
          translate: toVec3(worldPos),
          rotateXYZDeg: isSpot ? [-90, 0, 0] : undefined,
        },
        customAttributes: {
          'knx:circuitId': { type: 'token', value: circuitId },
          'knx:maxThreeIntensity': { type: 'double', value: group.maxIntensity },
        },
        light: {
          color: c,
          intensity: usdIntensity,
          radius: 0.06,
          enableColorTemperature: true,
          colorTemperatureK: 2700,
          shapingConeAngleDeg: spotAngleDeg,
          shapingConeSoftness: isSpot ? 0.35 : undefined,
        },
      });
    }

    if (circuitChildren.length > 0 && !usedLightNames.has(circuitPrimName)) {
      usedLightNames.add(circuitPrimName);
      lightPrims.push({
        specifier: 'def',
        typeName: 'Scope',
        name: circuitPrimName,
        customAttributes: {
          'knx:circuitId': { type: 'token', value: circuitId },
        },
        children: circuitChildren,
      });
    }
  }

  // 3. All 13 Camera Presets (`UsdGeomCamera`) with exact lookAt orientation
  const cameraPrims: UsdPrim[] = [];
  const tempCam = new THREE.PerspectiveCamera(45, 16 / 9, 0.05, 250);
  tempCam.up.set(0, 1, 0);

  for (const preset of cameraPresets) {
    tempCam.position.copy(preset.pos);
    tempCam.lookAt(preset.target);
    tempCam.updateMatrixWorld(true);

    const camData: UsdCameraData = {
      projection: preset.useOrthographic ? 'orthographic' : 'perspective',
      focalLengthMm: preset.useOrthographic ? 50 : 24,
      horizontalApertureMm: 36,
      verticalApertureMm: 20.25,
      clippingRangeM: [0.05, 250],
    };

    cameraPrims.push({
      specifier: 'def',
      typeName: 'Camera',
      name: sanitizeUsdIdent(`Cam_${preset.id}`),
      metadata: {
        doc: `${preset.label} (${preset.floorViewMode} floor)`,
      },
      xform: {
        translate: toVec3(preset.pos),
        rotateXYZDeg: quaternionToUsdRotateXYZDeg(tempCam.quaternion),
      },
      customAttributes: {
        'twin:presetId': { type: 'token', value: preset.id },
        'twin:label': { type: 'string', value: preset.label },
        'twin:floorViewMode': { type: 'token', value: preset.floorViewMode ?? 'all' },
        'twin:cameraTarget': { type: 'double3', value: toVec3(preset.target) },
        ...(preset.zoneId
          ? { 'twin:zoneId': { type: 'token', value: preset.zoneId } }
          : {}),
      },
      camera: camData,
    });
  }

  return {
    defaultPrim: 'CroxFarmhouse',
    doc: 'Crox Farmhouse KNX Lighting Circuits (UsdLux) and Camera Presets (UsdGeomCamera)',
    metersPerUnit: 1,
    upAxis: 'Y',
    prims: [
      {
        specifier: 'def',
        typeName: 'Xform',
        name: 'CroxFarmhouse',
        children: [
          {
            specifier: 'def',
            typeName: 'Scope',
            name: 'Lights',
            children: lightPrims,
          },
          {
            specifier: 'def',
            typeName: 'Scope',
            name: 'Cameras',
            children: cameraPrims,
          },
        ],
      },
    ],
  };
}

export interface GeneratedUsdStageBundle {
  readonly rootStage: UsdStageDocument;
  readonly unrealStage: UsdStageDocument;
  readonly materialsLayer: UsdStageDocument;
  readonly lightingAndCamerasLayer: UsdStageDocument;
  readonly zoneLayers: ReadonlyMap<string, UsdStageDocument>;
  readonly stats: {
    readonly totalPrims: number;
    readonly cubeCount: number;
    readonly cylinderCount: number;
    readonly sphereCount: number;
    readonly coneCount: number;
    readonly meshCount: number;
    readonly materialCount: number;
    readonly zoneCount: number;
  };
}

function countPrimStats(prims: readonly UsdPrim[]): {
  total: number;
  cubes: number;
  cylinders: number;
  spheres: number;
  cones: number;
  meshes: number;
} {
  let total = 0;
  let cubes = 0;
  let cylinders = 0;
  let spheres = 0;
  let cones = 0;
  let meshes = 0;

  const walk = (list: readonly UsdPrim[]): void => {
    for (const p of list) {
      total++;
      if (p.typeName === 'Cube') cubes++;
      else if (p.typeName === 'Cylinder') cylinders++;
      else if (p.typeName === 'Sphere') spheres++;
      else if (p.typeName === 'Cone') cones++;
      else if (p.typeName === 'Mesh') meshes++;
      if (p.children) walk(p.children);
    }
  };
  walk(prims);
  return { total, cubes, cylinders, spheres, cones, meshes };
}

/**
 * Converts the built Crox Farmhouse scene hierarchy into a modular, multi-layered
 * OpenUSD stage bundle (`rootStage`, `unrealStage`, `materialsLayer`, `lightingAndCamerasLayer`,
 * and 20 per-room `zoneLayers`).
 */
export function convertCroxSceneToUsdStageBundle(input: {
  readonly scene: THREE.Scene;
  readonly firstFloorMeshGroup: THREE.Group;
  readonly groundFloorCeilingGroup: THREE.Group;
  readonly ceilingMeshGroup: THREE.Group;
  readonly cutawayWallGroups: {
    readonly southWest: THREE.Group;
    readonly west: THREE.Group;
    readonly north: THREE.Group;
    readonly east: THREE.Group;
  };
  readonly lightGroups: LightGroupMap;
  readonly cameraPresets: readonly CameraPresetDefinition[];
}): GeneratedUsdStageBundle {
  const {
    scene,
    firstFloorMeshGroup,
    groundFloorCeilingGroup,
    ceilingMeshGroup,
    cutawayWallGroups,
    lightGroups,
    cameraPresets,
  } = input;

  scene.updateMatrixWorld(true);

  const matRegistry = new CanonicalMaterialRegistry();
  const roofGroupSet = new Set<THREE.Object3D>([
    groundFloorCeilingGroup,
    ceilingMeshGroup,
  ]);
  const topLayerContainers = new Set<THREE.Object3D>([
    firstFloorMeshGroup,
    groundFloorCeilingGroup,
    ceilingMeshGroup,
    cutawayWallGroups.southWest,
    cutawayWallGroups.west,
    cutawayWallGroups.north,
    cutawayWallGroups.east,
  ]);

  const zonePrimBuckets = new Map<string, UsdPrim[]>();
  const zoneUsedNames = new Map<string, Set<string>>();
  for (const spec of CROX_USD_ZONE_LAYERS) {
    zonePrimBuckets.set(spec.zoneId, []);
    zoneUsedNames.set(spec.zoneId, new Set<string>());
  }

  const processTopLevelBranch = (
    branch: THREE.Object3D,
    isFirstFloor: boolean,
    parentHasTransform: boolean
  ): void => {
    if (branch instanceof THREE.Light || branch instanceof THREE.Camera) return;
    if (branch.userData?.isRoomContainer) {
      for (const sub of branch.children) {
        processTopLevelBranch(sub, isFirstFloor, true);
      }
      return;
    }

    const zoneId = classifyBranchZoneLayer(branch, roofGroupSet, isFirstFloor);
    const bucket = zonePrimBuckets.get(zoneId) ?? zonePrimBuckets.get('courtyard')!;
    const usedNames = zoneUsedNames.get(zoneId) ?? zoneUsedNames.get('courtyard')!;

    const prim = convertObjectBranchToUsdPrim(
      branch,
      zoneId,
      matRegistry,
      usedNames,
      parentHasTransform
    );
    if (prim) {
      branch.userData = {
        ...branch.userData,
        usdPrimPath: `/CroxFarmhouse/Zones/${zoneId}/${prim.name}`,
      };
      bucket.push(prim);
    }
  };

  // 1. Ground floor & exterior direct children of `scene`
  for (const child of scene.children) {
    if (topLayerContainers.has(child)) continue;
    processTopLevelBranch(child, false, false);
  }

  // 2. Cutaway wall groups (ground & first floor outer walls)
  for (const cwGroup of [
    cutawayWallGroups.southWest,
    cutawayWallGroups.west,
    cutawayWallGroups.north,
    cutawayWallGroups.east,
  ]) {
    for (const child of cwGroup.children) {
      processTopLevelBranch(child, false, false);
    }
  }

  // 3. First floor rooms
  for (const child of firstFloorMeshGroup.children) {
    processTopLevelBranch(child, true, false);
  }

  // 4. Ground floor ceiling slabs & First floor roofs/chimneys (`roofAndCeilings`)
  for (const roofGroup of [groundFloorCeilingGroup, ceilingMeshGroup]) {
    for (const child of roofGroup.children) {
      processTopLevelBranch(child, true, false);
    }
  }

  // Build individual `usd/zones/<zoneId>.usda` documents
  const zoneLayers = new Map<string, UsdStageDocument>();
  let totalPrims = 0;
  let cubeCount = 0;
  let cylinderCount = 0;
  let sphereCount = 0;
  let coneCount = 0;
  let meshCount = 0;

  for (const spec of CROX_USD_ZONE_LAYERS) {
    const children = zonePrimBuckets.get(spec.zoneId) ?? [];
    const s = countPrimStats(children);
    totalPrims += s.total;
    cubeCount += s.cubes;
    cylinderCount += s.cylinders;
    sphereCount += s.spheres;
    coneCount += s.cones;
    meshCount += s.meshes;

    zoneLayers.set(spec.zoneId, {
      defaultPrim: 'CroxFarmhouse',
      doc: `${spec.label} — ${spec.description}`,
      metersPerUnit: 1,
      upAxis: 'Y',
      prims: [
        {
          specifier: 'def',
          typeName: 'Xform',
          name: 'CroxFarmhouse',
          children: [
            {
              specifier: 'def',
              typeName: 'Scope',
              name: 'Zones',
              children: [
                {
                  specifier: 'def',
                  typeName: 'Xform',
                  name: spec.zoneId,
                  metadata: {
                    kind: 'group',
                    doc: spec.description,
                  },
                  customAttributes: {
                    'twin:zoneId': { type: 'token', value: spec.zoneId },
                    'twin:label': { type: 'string', value: spec.label },
                    'twin:floorId': { type: 'token', value: spec.floorId },
                    'twin:wing': { type: 'token', value: spec.wing },
                  },
                  children,
                },
              ],
            },
          ],
        },
      ],
    });
  }

  const materialPrims = matRegistry.getMaterialPrims();
  const materialsLayer: UsdStageDocument = {
    defaultPrim: 'CroxFarmhouse',
    doc: 'Crox Farmhouse Canonical MaterialX (UsdMtlx) & UsdPreviewSurface Material Library',
    metersPerUnit: 1,
    upAxis: 'Y',
    prims: [
      {
        specifier: 'def',
        typeName: 'Xform',
        name: 'CroxFarmhouse',
        children: [
          {
            specifier: 'def',
            typeName: 'Scope',
            name: '_Materials',
            children: materialPrims,
          },
        ],
      },
    ],
  };

  const lightingAndCamerasLayer = buildLightingAndCamerasLayer(
    lightGroups,
    cameraPresets
  );

  // Root stage composes overrides, lighting/cameras, materials, and all 20 modular zone layers
  const zoneSubLayerPaths = CROX_USD_ZONE_LAYERS.map(
    (spec) => `./zones/${spec.zoneId}.usda`
  );
  const zoneShellPrims: UsdPrim[] = CROX_USD_ZONE_LAYERS.map((spec) => ({
    specifier: 'def',
    typeName: 'Xform',
    name: spec.zoneId,
    metadata: {
      kind: 'group',
      doc: spec.label,
    },
  }));

  const rootStage: UsdStageDocument = {
    defaultPrim: 'CroxFarmhouse',
    doc: 'Crox Farm House, Tur Langton — Master OpenUSD Stage (ArchViz + Smart Home Digital Twin)',
    metersPerUnit: 1,
    upAxis: 'Y',
    subLayers: [
      './overrides/layout.usda',
      './lighting/cameras_and_lights.usda',
      './materials/materials.usda',
      ...zoneSubLayerPaths,
    ],
    customLayerData: {
      propertyId: 'crox-farmhouse',
      propertyName: 'Crox Farm House, Tur Langton',
      authoringEngine: 'Crox OpenUSD Parametric & MaterialX Pipeline',
    },
    prims: [
      {
        specifier: 'def',
        typeName: 'Xform',
        name: 'CroxFarmhouse',
        metadata: {
          kind: 'assembly',
          variantSetNames: ['lod', 'roofCutaway'],
          variants: {
            lod: 'hero',
            roofCutaway: 'fullBuilding',
          },
        },
        customAttributes: {
          'twin:propertyId': { type: 'token', value: 'crox-farmhouse' },
          'twin:location': {
            type: 'string',
            value: 'Tur Langton, Leicestershire, UK',
          },
        },
        children: [
          {
            specifier: 'def',
            typeName: 'Scope',
            name: 'Zones',
            children: zoneShellPrims,
          },
        ],
        variantSets: {
          lod: {
            hero: {
              customAttributes: {
                'twin:activeLodTier': { type: 'int', value: 2 },
              },
            },
            standard: {
              customAttributes: {
                'twin:activeLodTier': { type: 'int', value: 1 },
              },
            },
            shell: {
              customAttributes: {
                'twin:activeLodTier': { type: 'int', value: 0 },
              },
            },
          },
          roofCutaway: {
            fullBuilding: {
              children: [
                {
                  specifier: 'over',
                  typeName: '',
                  name: 'Zones',
                  children: [
                    {
                      specifier: 'over',
                      typeName: '',
                      name: 'roofAndCeilings',
                      visibility: 'inherited',
                    },
                  ],
                },
              ],
            },
            groundFloorCutaway: {
              children: [
                {
                  specifier: 'over',
                  typeName: '',
                  name: 'Zones',
                  children: [
                    {
                      specifier: 'over',
                      typeName: '',
                      name: 'roofAndCeilings',
                      visibility: 'invisible',
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    ],
  };

  // Unreal Engine 5 Stage Actor entry-point layer (`crox_farmhouse_unreal.usda`)
  const unrealStage: UsdStageDocument = {
    defaultPrim: 'CroxFarmhouse',
    doc: 'Crox Farm House — Unreal Engine 5 USD Stage Actor & Interchange MaterialX Entry Point',
    metersPerUnit: 1,
    upAxis: 'Y',
    subLayers: ['./crox_farmhouse.usda'],
    customLayerData: {
      unrealTarget: 'UE5_UsdStageActor_Interchange_MaterialX',
      enablePhysicsCollisions: true,
    },
    prims: [
      {
        specifier: 'over',
        typeName: '',
        name: 'CroxFarmhouse',
        metadata: {
          variants: {
            lod: 'hero',
            roofCutaway: 'fullBuilding',
          },
        },
      },
    ],
  };

  return {
    rootStage,
    unrealStage,
    materialsLayer,
    lightingAndCamerasLayer,
    zoneLayers,
    stats: {
      totalPrims,
      cubeCount,
      cylinderCount,
      sphereCount,
      coneCount,
      meshCount,
      materialCount: materialPrims.length,
      zoneCount: zoneLayers.size,
    },
  };
}
