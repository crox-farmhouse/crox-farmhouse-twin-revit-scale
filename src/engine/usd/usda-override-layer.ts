import type * as THREE from 'three';
import type { SceneAnnotationRecord, Vec3Tuple } from '../../types/scene.ts';
import {
  type UsdPrim,
  type UsdStageDocument,
  sanitizeUsdIdent,
} from './schema.ts';
import { serializeUsdaStage } from './usda-serializer.ts';

export interface UsdTransformOverride {
  /** Full USD prim path, e.g. `/CroxFarmhouse/Zones/livingRoom/chaiseSofa` */
  readonly primPath: string;
  /** Optional Three.js object name, e.g. `livingRoom.chaiseSofa` */
  readonly targetName?: string;
  readonly translate?: Vec3Tuple;
  readonly rotateXYZDeg?: Vec3Tuple;
  readonly scale?: Vec3Tuple;
  readonly visibility?: 'inherited' | 'invisible';
  readonly note?: string;
}

function parseTuple3(raw: string): Vec3Tuple | undefined {
  const m = raw.match(
    /\(\s*([-+]?\d*\.?\d+(?:e[-+]?\d+)?)\s*,\s*([-+]?\d*\.?\d+(?:e[-+]?\d+)?)\s*,\s*([-+]?\d*\.?\d+(?:e[-+]?\d+)?)\s*\)/i
  );
  if (!m) return undefined;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/**
 * Parses a `#usda 1.0` override layer containing nested `over "..."` blocks into
 * structured `UsdTransformOverride` records.
 */
export function parseUsdaOverrideLayer(usdaText: string): UsdTransformOverride[] {
  const results: UsdTransformOverride[] = [];
  const lines = usdaText.split(/\r?\n/);

  interface StackFrame {
    readonly name: string;
    readonly path: string;
    translate?: Vec3Tuple;
    rotateXYZDeg?: Vec3Tuple;
    scale?: Vec3Tuple;
    visibility?: 'inherited' | 'invisible';
    targetName?: string;
    note?: string;
    hasAuthoredOp: boolean;
  }

  const stack: StackFrame[] = [];
  let pendingPrimName: string | null = null;
  let inMetadataParens = 0;

  for (const rawLine of lines) {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (!line) continue;

    if (inMetadataParens > 0) {
      for (const ch of line) {
        if (ch === '(') inMetadataParens++;
        else if (ch === ')') inMetadataParens--;
      }
      if (inMetadataParens <= 0 && line.endsWith('{') && pendingPrimName !== null) {
        const parentPath = stack.length > 0 ? stack[stack.length - 1].path : '';
        stack.push({
          name: pendingPrimName,
          path: `${parentPath}/${pendingPrimName}`,
          hasAuthoredOp: false,
        });
        pendingPrimName = null;
      }
      continue;
    }

    const primMatch = line.match(/^(?:over|def)\s+(?:[A-Za-z0-9_]+\s+)?"([^"]+)"(.*)$/);
    if (primMatch) {
      const name = primMatch[1];
      const rest = primMatch[2].trim();
      if (rest.includes('(') && !rest.includes(')')) {
        pendingPrimName = name;
        inMetadataParens = 1;
        continue;
      }
      if (rest.endsWith('{')) {
        const parentPath = stack.length > 0 ? stack[stack.length - 1].path : '';
        stack.push({
          name,
          path: `${parentPath}/${name}`,
          hasAuthoredOp: false,
        });
      } else {
        pendingPrimName = name;
      }
      continue;
    }

    if (line === '{' && pendingPrimName !== null) {
      const parentPath = stack.length > 0 ? stack[stack.length - 1].path : '';
      stack.push({
        name: pendingPrimName,
        path: `${parentPath}/${pendingPrimName}`,
        hasAuthoredOp: false,
      });
      pendingPrimName = null;
      continue;
    }

    if (line === '}') {
      const finished = stack.pop();
      if (finished && finished.hasAuthoredOp) {
        results.push({
          primPath: finished.path,
          targetName: finished.targetName,
          translate: finished.translate,
          rotateXYZDeg: finished.rotateXYZDeg,
          scale: finished.scale,
          visibility: finished.visibility,
          note: finished.note,
        });
      }
      continue;
    }

    const top = stack[stack.length - 1];
    if (!top) continue;

    if (line.includes('xformOp:translate')) {
      const t = parseTuple3(line);
      if (t) {
        top.translate = t;
        top.hasAuthoredOp = true;
      }
    } else if (line.includes('xformOp:rotateXYZ')) {
      const r = parseTuple3(line);
      if (r) {
        top.rotateXYZDeg = r;
        top.hasAuthoredOp = true;
      }
    } else if (line.includes('xformOp:scale')) {
      const s = parseTuple3(line);
      if (s) {
        top.scale = s;
        top.hasAuthoredOp = true;
      }
    } else if (line.includes('token visibility')) {
      const m = line.match(/"(inherited|invisible)"/);
      if (m) {
        top.visibility = m[1] as 'inherited' | 'invisible';
        top.hasAuthoredOp = true;
      }
    } else if (line.includes('twin:targetName')) {
      const m = line.match(/=\s*"([^"]+)"/);
      if (m) top.targetName = m[1];
    } else if (line.includes('twin:note')) {
      const m = line.match(/=\s*"([^"]+)"/);
      if (m) top.note = m[1];
    }
  }

  return results;
}

/**
 * Applies parsed `UsdTransformOverride` records onto matching Three.js objects in `roots`.
 * Matches either by `userData.usdPrimPath` or by `obj.name === override.targetName`.
 */
export function applyUsdOverridesToScene(
  roots: readonly THREE.Object3D[],
  overrides: readonly UsdTransformOverride[]
): number {
  if (overrides.length === 0) return 0;

  const byPrimPath = new Map<string, UsdTransformOverride>();
  const byTargetName = new Map<string, UsdTransformOverride>();
  for (const ov of overrides) {
    byPrimPath.set(ov.primPath, ov);
    if (ov.targetName) {
      byTargetName.set(ov.targetName, ov);
    }
  }

  let appliedCount = 0;
  const degToRad = Math.PI / 180;

  for (const root of roots) {
    root.traverse((obj) => {
      const primPath =
        typeof obj.userData?.usdPrimPath === 'string' ? obj.userData.usdPrimPath : undefined;
      const ov =
        (primPath ? byPrimPath.get(primPath) : undefined) ??
        (obj.name ? byTargetName.get(obj.name) : undefined);
      if (!ov) return;

      if (ov.translate) {
        obj.position.set(ov.translate[0], ov.translate[1], ov.translate[2]);
      }
      if (ov.rotateXYZDeg) {
        obj.rotation.set(
          ov.rotateXYZDeg[0] * degToRad,
          ov.rotateXYZDeg[1] * degToRad,
          ov.rotateXYZDeg[2] * degToRad
        );
      }
      if (ov.scale) {
        obj.scale.set(ov.scale[0], ov.scale[1], ov.scale[2]);
      }
      if (ov.visibility) {
        obj.visible = ov.visibility !== 'invisible';
      }
      obj.updateMatrixWorld(true);
      appliedCount++;
    });
  }

  return appliedCount;
}

/**
 * Resolves the USD prim path for a `SceneAnnotationRecord`.
 */
export function getUsdPrimPathForAnnotation(record: SceneAnnotationRecord): string {
  const zoneId = sanitizeUsdIdent(record.roomZoneId || 'exterior', 'exterior');
  if (record.kind === 'move' && record.objectTransform) {
    const rawTarget = record.objectTransform.targetName;
    const dotPrefix = `${record.roomZoneId}.`;
    const stripped = rawTarget.startsWith(dotPrefix)
      ? rawTarget.slice(dotPrefix.length)
      : rawTarget;
    const primName = sanitizeUsdIdent(stripped, 'TargetObject');
    return `/CroxFarmhouse/Zones/${zoneId}/${primName}`;
  }
  const rawMesh = record.meshInfo.meshName;
  const dotPrefix = `${record.roomZoneId}.`;
  const stripped = rawMesh.startsWith(dotPrefix)
    ? rawMesh.slice(dotPrefix.length)
    : rawMesh;
  const primName = sanitizeUsdIdent(stripped, 'Mesh');
  return `/CroxFarmhouse/Zones/${zoneId}/${primName}`;
}

/**
 * Generates a `#usda 1.0` non-destructive override layer (`usd/overrides/layout.usda`)
 * from a list of `SceneAnnotationRecord` items.
 */
export function serializeAnnotationsToUsdaOverrideLayer(
  records: readonly SceneAnnotationRecord[]
): string {
  const zoneChildren = new Map<string, UsdPrim[]>();
  const usedNamesByZone = new Map<string, Set<string>>();

  const allocateUniquePrimName = (zoneId: string, baseName: string, id: number): string => {
    let used = usedNamesByZone.get(zoneId);
    if (!used) {
      used = new Set<string>();
      usedNamesByZone.set(zoneId, used);
    }
    if (!used.has(baseName)) {
      used.add(baseName);
      return baseName;
    }
    const suffixed = `${baseName}_${id}`;
    used.add(suffixed);
    return suffixed;
  };

  for (const r of records) {
    const zoneId = sanitizeUsdIdent(r.roomZoneId || 'exterior', 'exterior');
    let list = zoneChildren.get(zoneId);
    if (!list) {
      list = [];
      zoneChildren.set(zoneId, list);
    }

    if (r.kind === 'move' && r.objectTransform) {
      const tf = r.objectTransform;
      const dotPrefix = `${r.roomZoneId}.`;
      const stripped = tf.targetName.startsWith(dotPrefix)
        ? tf.targetName.slice(dotPrefix.length)
        : tf.targetName;
      const primName = allocateUniquePrimName(zoneId, sanitizeUsdIdent(stripped, `MoveTarget_${r.id}`), r.id);

      list.push({
        specifier: 'over',
        typeName: '',
        name: primName,
        metadata: {
          doc: r.note || `Moved ${tf.targetName}`,
        },
        xform: {
          translate: tf.newObjectPosition,
          rotateXYZDeg: tf.newRotationDeg,
        },
        customAttributes: {
          'twin:targetName': { type: 'string', value: tf.targetName },
          'twin:worldCenterAfter': { type: 'double3', value: tf.newWorldCenter },
          'twin:deltaTranslation': { type: 'double3', value: tf.deltaTranslation },
          'twin:note': { type: 'string', value: r.note },
        },
      });
    } else if (r.kind === 'measure' && r.measurement) {
      const m = r.measurement;
      list.push({
        specifier: 'def',
        typeName: 'Scope',
        name: `Annotation_Measure_${r.id}`,
        purpose: 'guide',
        metadata: {
          doc: r.note || `Measurement span ${m.distanceM}m`,
        },
        customAttributes: {
          'twin:annotationKind': { type: 'token', value: 'measure' },
          'twin:distanceM': { type: 'double', value: m.distanceM },
          'twin:horizontalDistanceM': { type: 'double', value: m.horizontalDistanceM },
          'twin:startPoint': { type: 'double3', value: m.startPoint },
          'twin:endPoint': { type: 'double3', value: m.endPoint },
          ...(m.targetMeasurement
            ? { 'twin:targetMeasurement': { type: 'string', value: m.targetMeasurement } }
            : {}),
          'twin:note': { type: 'string', value: r.note },
        },
      });
    } else {
      const dotPrefix = `${r.roomZoneId}.`;
      const rawMesh = r.meshInfo.meshName;
      const stripped = rawMesh.startsWith(dotPrefix)
        ? rawMesh.slice(dotPrefix.length)
        : rawMesh;
      const primName = allocateUniquePrimName(zoneId, sanitizeUsdIdent(stripped, `Pin_${r.id}`), r.id);
      list.push({
        specifier: 'over',
        typeName: '',
        name: primName,
        metadata: {
          doc: r.note || `Pin annotation #${r.id}`,
        },
        customAttributes: {
          'twin:annotationId': { type: 'int', value: r.id },
          'twin:hitWorldPoint': { type: 'double3', value: r.worldPoint },
          'twin:note': { type: 'string', value: r.note },
        },
      });
    }
  }

  const zoneOvers: UsdPrim[] = [];
  for (const [zoneId, children] of zoneChildren.entries()) {
    zoneOvers.push({
      specifier: 'over',
      typeName: '',
      name: zoneId,
      children,
    });
  }

  const stage: UsdStageDocument = {
    defaultPrim: 'CroxFarmhouse',
    doc: 'Crox Farmhouse non-destructive layout & annotation override layer',
    metersPerUnit: 1,
    upAxis: 'Y',
    prims: [
      {
        specifier: 'over',
        typeName: '',
        name: 'CroxFarmhouse',
        children:
          zoneOvers.length > 0
            ? [
                {
                  specifier: 'over',
                  typeName: '',
                  name: 'Zones',
                  children: zoneOvers,
                },
              ]
            : [],
      },
    ],
  };

  return serializeUsdaStage(stage);
}
