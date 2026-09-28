import * as THREE from 'three';
import { CROX_FARMHOUSE_LOD_REGISTRATIONS } from '../../homes/crox-farmhouse/manifest.ts';
import {
  getUsdPrimPathForAnnotation,
  serializeAnnotationsToUsdaOverrideLayer,
} from '../usd/usda-override-layer.ts';
import type {
  AnnotationKind,
  CutawayWallDescriptor,
  SceneAnnotationHit,
  SceneAnnotationRecord,
  SceneCameraPoseSnapshot,
  SceneMeasurementAnnotation,
  SceneMeshDiagnosticInfo,
  SceneObjectTransformAnnotation,
  Vec3Tuple,
} from '../../types/scene.ts';

const STORAGE_KEY = 'crox_twin_annotations_v1';

export function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function toTuple3(v: THREE.Vector3): Vec3Tuple {
  return [round3(v.x), round3(v.y), round3(v.z)];
}

export function formatMetersAndFeetInches(meters: number): string {
  const cm = (meters * 100).toFixed(1);
  const totalInches = meters * 39.3700787;
  const feet = Math.floor(totalInches / 12);
  const inches = (totalInches - feet * 12).toFixed(1);
  return `${meters.toFixed(3)} m (${cm} cm · ${feet}' ${inches}")`;
}

export interface SceneGroupNameMap {
  readonly firstFloorMeshGroup: THREE.Object3D;
  readonly groundFloorCeilingGroup: THREE.Object3D;
  readonly ceilingMeshGroup: THREE.Object3D;
  readonly southWestWallGroup: THREE.Object3D;
  readonly westWallGroup: THREE.Object3D;
  readonly northWallGroup: THREE.Object3D;
  readonly eastWallGroup: THREE.Object3D;
}

export function resolveRoomForPoint(x: number, y: number, z: number): {
  readonly roomZoneId: string;
  readonly roomName: string;
} {
  for (const reg of CROX_FARMHOUSE_LOD_REGISTRATIONS) {
    const b = reg.bounds;
    if (
      x >= b.minX - 0.35 &&
      x <= b.maxX + 0.35 &&
      y >= b.minY - 0.35 &&
      y <= b.maxY + 0.45 &&
      z >= b.minZ - 0.35 &&
      z <= b.maxZ + 0.35
    ) {
      return { roomZoneId: reg.zoneId, roomName: reg.shortName };
    }
  }

  let bestZoneId = 'exterior';
  let bestName = 'Exterior / Grounds';
  let bestDistSq = Number.POSITIVE_INFINITY;
  for (const reg of CROX_FARMHOUSE_LOD_REGISTRATIONS) {
    const b = reg.bounds;
    const cx = (b.minX + b.maxX) * 0.5;
    const cy = (b.minY + b.maxY) * 0.5;
    const cz = (b.minZ + b.maxZ) * 0.5;
    const dSq = (x - cx) * (x - cx) + (y - cy) * (y - cy) + (z - cz) * (z - cz);
    if (dSq < bestDistSq) {
      bestDistSq = dSq;
      bestZoneId = reg.zoneId;
      bestName = `${reg.shortName} (Near)`;
    }
  }
  return { roomZoneId: bestZoneId, roomName: bestName };
}

function describeGeometry(geo: THREE.BufferGeometry): string {
  if (geo instanceof THREE.BoxGeometry) {
    const p = geo.parameters;
    return `BoxGeometry(${round3(p.width)} × ${round3(p.height)} × ${round3(p.depth)})`;
  }
  if (geo instanceof THREE.CylinderGeometry) {
    const p = geo.parameters;
    return `CylinderGeometry(rTop=${round3(p.radiusTop)}, rBot=${round3(p.radiusBottom)}, h=${round3(p.height)})`;
  }
  if (geo instanceof THREE.PlaneGeometry) {
    const p = geo.parameters;
    return `PlaneGeometry(${round3(p.width)} × ${round3(p.height)})`;
  }
  if (geo instanceof THREE.SphereGeometry) {
    const p = geo.parameters;
    return `SphereGeometry(r=${round3(p.radius)})`;
  }
  const posAttr = geo.getAttribute('position');
  const vertCount = posAttr ? posAttr.count : 0;
  return `${geo.type}(verts=${vertCount})`;
}

function describeMaterial(matOrArray: THREE.Material | THREE.Material[]): string {
  const mat = Array.isArray(matOrArray) ? matOrArray[0] : matOrArray;
  if (!mat) return 'UnknownMaterial';

  const parts: string[] = [mat.type];
  if ('color' in mat && mat.color instanceof THREE.Color) {
    parts.push(`#${mat.color.getHexString()}`);
  }
  if ('roughness' in mat && typeof mat.roughness === 'number') {
    parts.push(`r=${round3(mat.roughness)}`);
  }
  if ('metalness' in mat && typeof mat.metalness === 'number') {
    parts.push(`m=${round3(mat.metalness)}`);
  }
  if (mat.transparent && mat.opacity < 1) {
    parts.push(`alpha=${round3(mat.opacity)}`);
  }
  const sideLabel =
    mat.side === THREE.DoubleSide
      ? 'DoubleSide'
      : mat.side === THREE.BackSide
        ? 'BackSide'
        : 'FrontSide';
  parts.push(sideLabel);
  return parts.join(' · ');
}

export function extractSceneAnnotationHit(
  hit: THREE.Intersection,
  mesh: THREE.Mesh,
  sceneRoot: THREE.Scene,
  groupMap: SceneGroupNameMap,
  cameraPose: SceneCameraPoseSnapshot
): SceneAnnotationHit {
  const worldPoint = toTuple3(hit.point);

  const rawNormal = hit.face
    ? hit.face.normal.clone().transformDirection(mesh.matrixWorld).normalize()
    : new THREE.Vector3(0, 1, 0);
  const worldNormal = toTuple3(rawNormal);

  const worldCenterVec = new THREE.Vector3();
  const worldBox = new THREE.Box3().setFromObject(mesh);
  worldBox.getCenter(worldCenterVec);
  const worldSizeVec = new THREE.Vector3();
  worldBox.getSize(worldSizeVec);

  const parentChain: string[] = [];
  let foundCutaway: CutawayWallDescriptor | undefined;

  let cur: THREE.Object3D | null = mesh;
  while (cur && cur !== sceneRoot) {
    if (!foundCutaway && cur.userData?.cutawayWall) {
      foundCutaway = cur.userData.cutawayWall as CutawayWallDescriptor;
    }
    const labelParts: string[] = [];
    if (cur.name) {
      labelParts.push(cur.name);
    } else if (cur === groupMap.firstFloorMeshGroup) {
      labelParts.push('firstFloorMeshGroup');
    } else if (cur === groupMap.groundFloorCeilingGroup) {
      labelParts.push('groundFloorCeilingGroup');
    } else if (cur === groupMap.ceilingMeshGroup) {
      labelParts.push('ceilingMeshGroup');
    } else if (cur === groupMap.southWestWallGroup) {
      labelParts.push('cutawayWall.southWest');
    } else if (cur === groupMap.westWallGroup) {
      labelParts.push('cutawayWall.west');
    } else if (cur === groupMap.northWallGroup) {
      labelParts.push('cutawayWall.north');
    } else if (cur === groupMap.eastWallGroup) {
      labelParts.push('cutawayWall.east');
    }

    if (typeof cur.userData?.interactableId === 'string') {
      labelParts.push(`interactable:${cur.userData.interactableId}`);
    }
    if (typeof cur.userData?.zoneId === 'string') {
      labelParts.push(`zone:${cur.userData.zoneId}`);
    }
    if (labelParts.length > 0) {
      parentChain.unshift(labelParts.join(' '));
    }
    cur = cur.parent;
  }

  const meshInfo: SceneMeshDiagnosticInfo = {
    meshName: mesh.name || '(unnamed mesh)',
    parentChain,
    geometrySummary: describeGeometry(mesh.geometry),
    materialSummary: describeMaterial(mesh.material),
    meshWorldCenter: toTuple3(worldCenterVec),
    meshBoundingBoxMin: toTuple3(worldBox.min),
    meshBoundingBoxMax: toTuple3(worldBox.max),
    meshBoundingBoxSize: toTuple3(worldSizeVec),
    ...(foundCutaway ? { cutawayWall: foundCutaway } : {}),
  };

  const { roomZoneId, roomName } = resolveRoomForPoint(
    hit.point.x,
    hit.point.y,
    hit.point.z
  );

  return {
    kind: 'pin',
    worldPoint,
    worldNormal,
    roomZoneId,
    roomName,
    meshInfo,
    cameraPose,
  };
}

function createBadgeSpriteTexture(
  id: number,
  isSelected: boolean,
  kind: AnnotationKind = 'pin'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 128, 128);

    const baseFill = isSelected
      ? 'rgba(255, 196, 77, 0.96)'
      : kind === 'move'
        ? 'rgba(168, 85, 247, 0.95)'
        : kind === 'measure'
          ? 'rgba(14, 165, 233, 0.95)'
          : 'rgba(235, 77, 61, 0.95)';

    // Outer halo ring
    ctx.beginPath();
    ctx.arc(64, 64, 52, 0, Math.PI * 2);
    ctx.fillStyle = baseFill;
    ctx.fill();
    ctx.lineWidth = 7;
    ctx.strokeStyle = isSelected ? '#ffffff' : '#181a1f';
    ctx.stroke();

    // Inner dark badge circle
    ctx.beginPath();
    ctx.arc(64, 64, 38, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? '#1d222b' : '#181a20';
    ctx.fill();

    // Label text
    ctx.font = 'bold 40px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isSelected ? '#ffd470' : '#ffffff';
    ctx.fillText(`#${id}`, 64, 66);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createPillSpriteTexture(
  primaryText: string,
  secondaryText: string,
  accentHex: string,
  isSelected: boolean
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 512, 128);

    const r = 28;
    const x = 12;
    const y = 14;
    const w = 488;
    const h = 100;

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();

    ctx.fillStyle = 'rgba(18, 21, 27, 0.93)';
    ctx.fill();
    ctx.lineWidth = isSelected ? 6 : 4;
    ctx.strokeStyle = isSelected ? '#ffc44d' : accentHex;
    ctx.stroke();

    ctx.font = 'bold 34px "SFMono-Regular", Consolas, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = isSelected ? '#ffd470' : '#ffffff';
    ctx.fillText(primaryText, 256, secondaryText ? 48 : 64, 464);

    if (secondaryText) {
      ctx.font = '600 23px "SFMono-Regular", Consolas, -apple-system, sans-serif';
      ctx.fillStyle = isSelected ? '#f8dfa1' : '#9ec6e8';
      ctx.fillText(secondaryText, 256, 86, 464);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function buildAnnotationMarker3D(
  record: SceneAnnotationRecord,
  isSelected: boolean
): THREE.Group {
  const kind: AnnotationKind = record.kind ?? 'pin';

  // -------------------------------------------------------------------------
  // 1. MEASUREMENT SPAN MARKER (Start Point A <-> End Point B + Dimension Pill)
  // -------------------------------------------------------------------------
  if (kind === 'measure' && record.measurement) {
    const m = record.measurement;
    const markerGroup = new THREE.Group();
    markerGroup.name = `annotationMarker.measure.${record.id}`;
    markerGroup.userData.annotationId = record.id;

    const pA = new THREE.Vector3(m.startPoint[0], m.startPoint[1], m.startPoint[2]);
    const pB = new THREE.Vector3(m.endPoint[0], m.endPoint[1], m.endPoint[2]);
    const mid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);

    const spanColor = isSelected ? 0xffc44d : 0x38bdf8;
    const accentHex = isSelected ? '#ffc44d' : '#38bdf8';

    // Endpoint spheres & perpendicular architectural tick rings at A and B
    const endGeo = new THREE.SphereGeometry(isSelected ? 0.034 : 0.026, 14, 14);
    const endMat = new THREE.MeshBasicMaterial({
      color: spanColor,
      depthTest: false,
    });
    for (const pt of [pA, pB]) {
      const s = new THREE.Mesh(endGeo, endMat);
      s.position.copy(pt);
      s.renderOrder = 998;
      s.userData.annotationId = record.id;
      markerGroup.add(s);
    }

    // Solid 3D cylinder dimension line between Point A and Point B
    const spanVec = new THREE.Vector3().subVectors(pB, pA);
    const spanLen = spanVec.length();
    if (spanLen > 0.002) {
      const spanDir = spanVec.clone().normalize();
      const lineGeo = new THREE.CylinderGeometry(
        isSelected ? 0.0085 : 0.0065,
        isSelected ? 0.0085 : 0.0065,
        spanLen,
        10
      );
      const lineMat = new THREE.MeshBasicMaterial({
        color: spanColor,
        depthTest: false,
        transparent: true,
        opacity: isSelected ? 0.98 : 0.88,
      });
      const lineMesh = new THREE.Mesh(lineGeo, lineMat);
      lineMesh.position.copy(mid);
      lineMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), spanDir);
      lineMesh.renderOrder = 997;
      lineMesh.userData.annotationId = record.id;
      markerGroup.add(lineMesh);

      // Perpendicular architectural dimension end-ticks at A and B
      const tickUp =
        Math.abs(spanDir.y) < 0.92
          ? new THREE.Vector3(0, 1, 0)
          : new THREE.Vector3(1, 0, 0);
      const tickPerp = new THREE.Vector3().crossVectors(spanDir, tickUp).normalize();
      const tickGeo = new THREE.CylinderGeometry(0.0045, 0.0045, 0.12, 8);
      for (const pt of [pA, pB]) {
        const tickMesh = new THREE.Mesh(tickGeo, lineMat);
        tickMesh.position.copy(pt);
        tickMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tickPerp);
        tickMesh.renderOrder = 998;
        tickMesh.userData.annotationId = record.id;
        markerGroup.add(tickMesh);
      }
    }

    // When selected, show subtle X/Y/Z axis component projection lines
    if (isSelected && spanLen > 0.02) {
      const cornerX = new THREE.Vector3(pB.x, pA.y, pA.z);
      const cornerXZ = new THREE.Vector3(pB.x, pA.y, pB.z);
      const projPoints = [pA, cornerX, cornerXZ, pB];
      const projGeo = new THREE.BufferGeometry().setFromPoints(projPoints);
      const projMat = new THREE.LineBasicMaterial({
        color: 0x9ec6e8,
        depthTest: false,
        transparent: true,
        opacity: 0.65,
      });
      const projLine = new THREE.Line(projGeo, projMat);
      projLine.renderOrder = 996;
      markerGroup.add(projLine);
    }

    // Floating Dimension Pill Badge above the midpoint of the span
    const primaryLabel = m.targetMeasurement?.trim()
      ? `#${record.id} · ${m.distanceM.toFixed(3)}m → ${m.targetMeasurement.trim()}`
      : `#${record.id} · ${m.distanceM.toFixed(3)} m (${(m.distanceM * 100).toFixed(1)} cm)`;
    const [dx, dy, dz] = m.deltaXYZ;
    const secondaryLabel = `ΔX=${dx.toFixed(2)}  ΔY=${dy.toFixed(2)}  ΔZ=${dz.toFixed(2)}m`;

    const pillMat = new THREE.SpriteMaterial({
      map: createPillSpriteTexture(primaryLabel, secondaryLabel, accentHex, isSelected),
      depthTest: false,
      depthWrite: false,
      sizeAttenuation: false,
    });
    const pillSprite = new THREE.Sprite(pillMat);
    pillSprite.position.copy(mid).add(new THREE.Vector3(0, 0.14, 0));
    const pillW = isSelected ? 0.19 : 0.165;
    pillSprite.scale.set(pillW, pillW * 0.25, 1);
    pillSprite.renderOrder = 999;
    pillSprite.userData.annotationId = record.id;
    markerGroup.add(pillSprite);

    return markerGroup;
  }

  // -------------------------------------------------------------------------
  // 2. OBJECT MOVE / ROTATE MARKER (Origin Ghost -> Arrow -> New Center Badge)
  // -------------------------------------------------------------------------
  if (kind === 'move' && record.objectTransform) {
    const tf = record.objectTransform;
    const markerGroup = new THREE.Group();
    markerGroup.name = `annotationMarker.move.${record.id}`;
    markerGroup.userData.annotationId = record.id;

    const pStart = new THREE.Vector3(
      tf.initialWorldCenter[0],
      tf.initialWorldCenter[1],
      tf.initialWorldCenter[2]
    );
    const pEnd = new THREE.Vector3(
      tf.newWorldCenter[0],
      tf.newWorldCenter[1],
      tf.newWorldCenter[2]
    );
    const moveColor = isSelected ? 0xffc44d : 0xa855f7;
    const accentHex = isSelected ? '#ffc44d' : '#a855f7';

    // Origin ghost ring/sphere at initial position
    const originSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.028, 12, 12),
      new THREE.MeshBasicMaterial({
        color: 0xc084fc,
        depthTest: false,
        transparent: true,
        opacity: 0.7,
      })
    );
    originSphere.position.copy(pStart);
    originSphere.renderOrder = 997;
    originSphere.userData.annotationId = record.id;
    markerGroup.add(originSphere);

    // Vector line + cone arrowhead from initialWorldCenter to newWorldCenter
    const moveVec = new THREE.Vector3().subVectors(pEnd, pStart);
    const moveDist = moveVec.length();
    if (moveDist > 0.005) {
      const moveDir = moveVec.clone().normalize();
      const mid = new THREE.Vector3().addVectors(pStart, pEnd).multiplyScalar(0.5);
      const shaftMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.007, 0.007, moveDist, 10),
        new THREE.MeshBasicMaterial({
          color: moveColor,
          depthTest: false,
          transparent: true,
          opacity: 0.9,
        })
      );
      shaftMesh.position.copy(mid);
      shaftMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), moveDir);
      shaftMesh.renderOrder = 998;
      shaftMesh.userData.annotationId = record.id;
      markerGroup.add(shaftMesh);

      const coneMesh = new THREE.Mesh(
        new THREE.ConeGeometry(0.024, 0.065, 12),
        new THREE.MeshBasicMaterial({
          color: moveColor,
          depthTest: false,
        })
      );
      coneMesh.position.copy(pEnd).addScaledVector(moveDir, -0.032);
      coneMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), moveDir);
      coneMesh.renderOrder = 998;
      coneMesh.userData.annotationId = record.id;
      markerGroup.add(coneMesh);
    }

    // 3D circular rotation arc ring around pEnd when the object has been rotated
    const [dx, dy, dz] = tf.deltaTranslation;
    const [drx, dry, drz] = tf.deltaRotationDeg;
    const hasMove = moveDist > 0.005;
    const hasRot = Math.hypot(drx, dry, drz) >= 0.5;

    if (hasRot) {
      const rotRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.22, 0.007, 10, 36, Math.PI * 1.65),
        new THREE.MeshBasicMaterial({
          color: moveColor,
          depthTest: false,
          transparent: true,
          opacity: 0.92,
        })
      );
      rotRing.rotation.x = Math.PI / 2;
      rotRing.position.copy(pEnd);
      rotRing.renderOrder = 998;
      rotRing.userData.annotationId = record.id;
      markerGroup.add(rotRing);
    }

    // Pill badge at newWorldCenter
    const tagWord = hasMove && hasRot ? 'MOVE+ROT' : hasRot ? 'ROTATE' : 'MOVE';
    const primaryLabel = `#${record.id} ${tagWord} · ${tf.targetName}`;
    const movePart = hasMove
      ? `Δ[${dx >= 0 ? '+' : ''}${dx.toFixed(2)}, ${dy >= 0 ? '+' : ''}${dy.toFixed(2)}, ${dz >= 0 ? '+' : ''}${dz.toFixed(2)}]m`
      : '';
    const rotPart = hasRot
      ? `ΔRot[${drx >= 0 ? '+' : ''}${drx.toFixed(0)}°, ${dry >= 0 ? '+' : ''}${dry.toFixed(1)}°, ${drz >= 0 ? '+' : ''}${drz.toFixed(0)}°]`
      : '';
    const secondaryLabel = [movePart, rotPart].filter(Boolean).join(' · ') || 'Δ[0, 0, 0]m';

    const pillMat = new THREE.SpriteMaterial({
      map: createPillSpriteTexture(primaryLabel, secondaryLabel, accentHex, isSelected),
      depthTest: false,
      depthWrite: false,
      sizeAttenuation: false,
    });
    const pillSprite = new THREE.Sprite(pillMat);
    pillSprite.position.copy(pEnd).add(new THREE.Vector3(0, 0.24, 0));
    const pillW = isSelected ? 0.19 : 0.165;
    pillSprite.scale.set(pillW, pillW * 0.25, 1);
    pillSprite.renderOrder = 999;
    pillSprite.userData.annotationId = record.id;
    markerGroup.add(pillSprite);

    return markerGroup;
  }

  // -------------------------------------------------------------------------
  // 3. STANDARD POINT PIN MARKER (#1, #2, ...)
  // -------------------------------------------------------------------------
  const markerGroup = new THREE.Group();
  markerGroup.name = `annotationMarker.${record.id}`;
  markerGroup.userData.annotationId = record.id;

  const hitPos = new THREE.Vector3(
    record.worldPoint[0],
    record.worldPoint[1],
    record.worldPoint[2]
  );
  const normalVec = new THREE.Vector3(
    record.worldNormal[0],
    record.worldNormal[1],
    record.worldNormal[2]
  );
  if (normalVec.lengthSq() < 0.01) {
    normalVec.set(0, 1, 0);
  } else {
    normalVec.normalize();
  }

  markerGroup.position.copy(hitPos);

  const pinColor = isSelected ? 0xffc44d : 0xeb4d3d;

  // Contact sphere right at the exact clicked 3D point
  const tipGeo = new THREE.SphereGeometry(isSelected ? 0.038 : 0.03, 14, 14);
  const tipMat = new THREE.MeshBasicMaterial({
    color: pinColor,
  });
  const tipMesh = new THREE.Mesh(tipGeo, tipMat);
  tipMesh.userData.annotationId = record.id;
  markerGroup.add(tipMesh);

  // Outer wireframe/ring pulse on surface
  const ringGeo = new THREE.RingGeometry(0.048, 0.068, 20);
  const ringMat = new THREE.MeshBasicMaterial({
    color: pinColor,
    side: THREE.DoubleSide,
    depthTest: false,
    transparent: true,
    opacity: isSelected ? 0.95 : 0.75,
  });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  const targetQuat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    normalVec
  );
  ringMesh.quaternion.copy(targetQuat);
  ringMesh.position.copy(normalVec).multiplyScalar(0.004);
  ringMesh.renderOrder = 998;
  ringMesh.userData.annotationId = record.id;
  markerGroup.add(ringMesh);

  // Stem extending outward along surface normal + slight upward bias so badge is clearly readable
  const stemDir = normalVec
    .clone()
    .multiplyScalar(0.18)
    .add(new THREE.Vector3(0, 0.14, 0))
    .normalize();
  const stemLen = 0.24;
  const stemGeo = new THREE.CylinderGeometry(0.006, 0.006, stemLen, 8);
  const stemMat = new THREE.MeshBasicMaterial({
    color: pinColor,
    depthTest: false,
  });
  const stemMesh = new THREE.Mesh(stemGeo, stemMat);
  stemMesh.position.copy(stemDir).multiplyScalar(stemLen * 0.5);
  stemMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), stemDir);
  stemMesh.renderOrder = 998;
  stemMesh.userData.annotationId = record.id;
  markerGroup.add(stemMesh);

  // Numbered Sprite Badge (#1, #2, ...)
  const spriteMat = new THREE.SpriteMaterial({
    map: createBadgeSpriteTexture(record.id, isSelected, 'pin'),
    depthTest: false,
    depthWrite: false,
    sizeAttenuation: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.position.copy(stemDir).multiplyScalar(stemLen + 0.04);
  const badgeScale = isSelected ? 0.052 : 0.044;
  sprite.scale.set(badgeScale, badgeScale, 1);
  sprite.renderOrder = 999;
  sprite.userData.annotationId = record.id;
  markerGroup.add(sprite);

  return markerGroup;
}

/**
 * Builds the live rubber-band 3D measurement preview group while the user is moving
 * the cursor between Point A (`startPoint`) and Point B (`endPoint`) in Measure Mode.
 */
export function buildLiveMeasurePreview3D(
  startPoint: Vec3Tuple,
  endPoint: Vec3Tuple | null,
  axisSnapLocked: boolean
): THREE.Group {
  const previewGroup = new THREE.Group();
  previewGroup.name = 'liveMeasurePreviewGroup';
  previewGroup.userData.isAnnotationGroup = true;

  const pA = new THREE.Vector3(startPoint[0], startPoint[1], startPoint[2]);
  const accentColor = axisSnapLocked ? 0x4ade80 : 0x38bdf8;
  const accentHex = axisSnapLocked ? '#4ade80' : '#38bdf8';

  const startSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 14, 14),
    new THREE.MeshBasicMaterial({
      color: accentColor,
      depthTest: false,
    })
  );
  startSphere.position.copy(pA);
  startSphere.renderOrder = 999;
  previewGroup.add(startSphere);

  if (!endPoint) return previewGroup;

  const pB = new THREE.Vector3(endPoint[0], endPoint[1], endPoint[2]);
  const endSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.032, 14, 14),
    new THREE.MeshBasicMaterial({
      color: 0xffc44d,
      depthTest: false,
    })
  );
  endSphere.position.copy(pB);
  endSphere.renderOrder = 999;
  previewGroup.add(endSphere);

  const spanVec = new THREE.Vector3().subVectors(pB, pA);
  const spanLen = spanVec.length();
  if (spanLen > 0.002) {
    const mid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);
    const spanDir = spanVec.clone().normalize();

    const lineMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.0075, 0.0075, spanLen, 10),
      new THREE.MeshBasicMaterial({
        color: accentColor,
        depthTest: false,
      })
    );
    lineMesh.position.copy(mid);
    lineMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), spanDir);
    lineMesh.renderOrder = 998;
    previewGroup.add(lineMesh);

    // X / Y / Z component right-triangle guide lines
    const cornerX = new THREE.Vector3(pB.x, pA.y, pA.z);
    const cornerXZ = new THREE.Vector3(pB.x, pA.y, pB.z);
    const projGeo = new THREE.BufferGeometry().setFromPoints([pA, cornerX, cornerXZ, pB]);
    const projLine = new THREE.Line(
      projGeo,
      new THREE.LineBasicMaterial({
        color: 0xffc44d,
        depthTest: false,
        transparent: true,
        opacity: 0.72,
      })
    );
    projLine.renderOrder = 997;
    previewGroup.add(projLine);

    const dx = Math.abs(pB.x - pA.x);
    const dy = Math.abs(pB.y - pA.y);
    const dz = Math.abs(pB.z - pA.z);
    const primaryText = `${spanLen.toFixed(3)} m (${(spanLen * 100).toFixed(1)} cm)${axisSnapLocked ? ' [AXIS SNAP]' : ''}`;
    const secondaryText = `ΔX=${dx.toFixed(2)}  ΔY=${dy.toFixed(2)}  ΔZ=${dz.toFixed(2)}m · Click to save`;

    const pillMat = new THREE.SpriteMaterial({
      map: createPillSpriteTexture(primaryText, secondaryText, accentHex, true),
      depthTest: false,
      depthWrite: false,
      sizeAttenuation: false,
    });
    const pillSprite = new THREE.Sprite(pillMat);
    pillSprite.position.copy(mid).add(new THREE.Vector3(0, 0.15, 0));
    pillSprite.scale.set(0.195, 0.195 * 0.25, 1);
    pillSprite.renderOrder = 999;
    previewGroup.add(pillSprite);
  }

  return previewGroup;
}

export type AnnotationStoreListener = (
  records: readonly SceneAnnotationRecord[],
  selectedId: number | null
) => void;

export class SceneAnnotationStore {
  private records: SceneAnnotationRecord[] = [];
  private selectedId: number | null = null;
  private nextId = 1;
  private readonly listeners = new Set<AnnotationStoreListener>();

  public constructor() {
    this.loadFromStorage();
  }

  public subscribe(listener: AnnotationStoreListener): () => void {
    this.listeners.add(listener);
    listener(this.records, this.selectedId);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getRecords(): readonly SceneAnnotationRecord[] {
    return this.records;
  }

  public getSelectedId(): number | null {
    return this.selectedId;
  }

  public getSelectedRecord(): SceneAnnotationRecord | null {
    if (this.selectedId === null) return null;
    return this.records.find((r) => r.id === this.selectedId) ?? null;
  }

  public selectAnnotation(id: number | null): void {
    if (this.selectedId === id) return;
    this.selectedId = id;
    this.emit();
  }

  public addAnnotation(hit: SceneAnnotationHit, initialNote = ''): SceneAnnotationRecord {
    const record: SceneAnnotationRecord = {
      ...hit,
      kind: hit.kind ?? 'pin',
      id: this.nextId++,
      createdAt: new Date().toISOString(),
      note: initialNote,
    };
    this.records.push(record);
    this.selectedId = record.id;
    this.saveToStorage();
    this.emit();
    return record;
  }

  /**
   * Creates or updates a manual object Move / Rotate annotation (`kind === 'move'`).
   * If an annotation already exists for the same `targetUuid`, it updates that annotation in place
   * so dragging an object continuously updates a single clean Move record instead of spamming duplicates.
   */
  public upsertMoveAnnotation(
    baseHit: SceneAnnotationHit,
    transform: SceneObjectTransformAnnotation,
    cameraPose: SceneCameraPoseSnapshot
  ): SceneAnnotationRecord {
    const [dx, dy, dz] = transform.deltaTranslation;
    const [drx, dry, drz] = transform.deltaRotationDeg;
    const hasMove = Math.hypot(dx, dy, dz) >= 0.002;
    const hasRot = Math.hypot(drx, dry, drz) >= 0.1;

    const autoSummaryParts: string[] = [];
    if (hasMove || !hasRot) {
      autoSummaryParts.push(
        `Move ${transform.targetName} to [${transform.newWorldCenter.join(', ')}] (Δ=[${dx >= 0 ? '+' : ''}${dx}, ${dy >= 0 ? '+' : ''}${dy}, ${dz >= 0 ? '+' : ''}${dz}]m)`
      );
    }
    if (hasRot) {
      const rotAxes: string[] = [];
      if (Math.abs(drx) >= 0.1) rotAxes.push(`X ${drx >= 0 ? '+' : ''}${drx}°`);
      if (Math.abs(dry) >= 0.1 || rotAxes.length === 0)
        rotAxes.push(`Y ${dry >= 0 ? '+' : ''}${dry}°`);
      if (Math.abs(drz) >= 0.1) rotAxes.push(`Z ${drz >= 0 ? '+' : ''}${drz}°`);
      if (hasMove) {
        autoSummaryParts.push(`Rotate ${rotAxes.join(', ')}`);
      } else {
        autoSummaryParts.push(
          `Rotate ${transform.targetName} (${rotAxes.join(', ')})`
        );
      }
    }
    const autoSummary = autoSummaryParts.join(', ');

    const existing = this.records.find(
      (r) => r.kind === 'move' && r.objectTransform?.targetUuid === transform.targetUuid
    );

    if (existing) {
      const wasAutoNote =
        !existing.note.trim() ||
        existing.note.startsWith(`Move ${transform.targetName} `) ||
        existing.note.startsWith(`Rotate ${transform.targetName} `);
      const mutableExisting = existing as {
        worldPoint: Vec3Tuple;
        cameraPose: SceneCameraPoseSnapshot;
        objectTransform?: SceneObjectTransformAnnotation;
        note: string;
      };
      mutableExisting.worldPoint = transform.newWorldCenter;
      mutableExisting.cameraPose = cameraPose;
      mutableExisting.objectTransform = transform;
      if (wasAutoNote) {
        mutableExisting.note = autoSummary;
      }
      this.selectedId = existing.id;
      this.saveToStorage();
      this.emit();
      return existing;
    }

    const record: SceneAnnotationRecord = {
      ...baseHit,
      kind: 'move',
      worldPoint: transform.newWorldCenter,
      cameraPose,
      objectTransform: transform,
      id: this.nextId++,
      createdAt: new Date().toISOString(),
      note: autoSummary,
    };
    this.records.push(record);
    this.selectedId = record.id;
    this.saveToStorage();
    this.emit();
    return record;
  }

  /**
   * Adds a 3D Measurement Span annotation (`kind === 'measure'`) between `startHit` and `endHit`.
   */
  public addMeasureAnnotation(
    startHit: SceneAnnotationHit,
    endHit: SceneAnnotationHit,
    snappedEndPoint: Vec3Tuple,
    initialNote = ''
  ): SceneAnnotationRecord {
    const pA = startHit.worldPoint;
    const pB = snappedEndPoint;
    const dx = round3(pB[0] - pA[0]);
    const dy = round3(pB[1] - pA[1]);
    const dz = round3(pB[2] - pA[2]);
    const horizDist = round3(Math.hypot(dx, dz));
    const dist = round3(Math.hypot(dx, dy, dz));
    const midPoint: Vec3Tuple = [
      round3((pA[0] + pB[0]) * 0.5),
      round3((pA[1] + pB[1]) * 0.5),
      round3((pA[2] + pB[2]) * 0.5),
    ];

    const measurement: SceneMeasurementAnnotation = {
      startPoint: pA,
      startNormal: startHit.worldNormal,
      startMeshName: startHit.meshInfo.meshName,
      endPoint: pB,
      endNormal: endHit.worldNormal,
      endMeshName: endHit.meshInfo.meshName,
      deltaXYZ: [dx, dy, dz],
      horizontalDistanceM: horizDist,
      distanceM: dist,
    };

    const { roomZoneId, roomName } = resolveRoomForPoint(
      midPoint[0],
      midPoint[1],
      midPoint[2]
    );

    const record: SceneAnnotationRecord = {
      ...startHit,
      kind: 'measure',
      worldPoint: midPoint,
      roomZoneId,
      roomName,
      cameraPose: endHit.cameraPose,
      measurement,
      id: this.nextId++,
      createdAt: new Date().toISOString(),
      note: initialNote,
    };
    this.records.push(record);
    this.selectedId = record.id;
    this.saveToStorage();
    this.emit();
    return record;
  }

  public updateNote(id: number, note: string): void {
    const rec = this.records.find((r) => r.id === id);
    if (!rec) return;
    rec.note = note;
    this.saveToStorage();
    this.emit();
  }

  public updateTargetMeasurement(id: number, targetMeasurement: string): void {
    const rec = this.records.find((r) => r.id === id);
    if (!rec || !rec.measurement) return;
    rec.measurement.targetMeasurement = targetMeasurement;
    this.saveToStorage();
    this.emit();
  }

  public removeAnnotation(id: number): void {
    const idx = this.records.findIndex((r) => r.id === id);
    if (idx === -1) return;
    this.records.splice(idx, 1);
    if (this.selectedId === id) {
      this.selectedId = this.records[this.records.length - 1]?.id ?? null;
    }
    if (this.records.length === 0) {
      this.nextId = 1;
    }
    this.saveToStorage();
    this.emit();
  }

  public clearAll(): void {
    this.records = [];
    this.selectedId = null;
    this.nextId = 1;
    this.saveToStorage();
    this.emit();
  }

  public formatAsUsdaOverrideLayer(): string {
    return serializeAnnotationsToUsdaOverrideLayer(this.records);
  }

  public formatForAgent(): string {
    if (this.records.length === 0) {
      return 'No 3D annotations recorded.';
    }

    const lines: string[] = [
      `# Crox Farmhouse 3D Scene Annotations (${this.records.length})`,
      '',
    ];

    for (const r of this.records) {
      const kind: AnnotationKind = r.kind ?? 'pin';
      const [x, y, z] = r.worldPoint;
      const [nx, ny, nz] = r.worldNormal;
      const [cx, cy, cz] = r.cameraPose.position;
      const [tx, ty, tz] = r.cameraPose.target;
      const [mx, my, mz] = r.meshInfo.meshWorldCenter;
      const [sx, sy, sz] = r.meshInfo.meshBoundingBoxSize;
      const [minX, minY, minZ] = r.meshInfo.meshBoundingBoxMin;
      const [maxX, maxY, maxZ] = r.meshInfo.meshBoundingBoxMax;
      const usdPrimPath = getUsdPrimPathForAnnotation(r);

      if (kind === 'move' && r.objectTransform) {
        const tf = r.objectTransform;
        const noteText = r.note.trim() || `Move ${tf.targetName}`;
        const dRyRad = round3((tf.deltaRotationDeg[1] * Math.PI) / 180);
        const newRyRad = round3((tf.newRotationDeg[1] * Math.PI) / 180);
        lines.push(`## Issue #${r.id} [OBJECT MOVE / ROTATE]: ${noteText}`);
        lines.push(`- **Room / Zone**: ${r.roomName} (\`${r.roomZoneId}\`)`);
        lines.push(`- **USD Prim Path**: \`${usdPrimPath}\``);
        lines.push(`- **Moved Target (${tf.targetKind})**: \`${tf.targetName}\``);
        if (tf.targetPath.length > 0) {
          lines.push(`- **Hierarchy**: \`${tf.targetPath.join(' > ')}\``);
        }
        lines.push(
          `- **World Center (Before → After)**: \`[${tf.initialWorldCenter.join(', ')}]\` → \`[${tf.newWorldCenter.join(', ')}]\``
        );
        lines.push(
          `- **Delta Translation (m)**: \`[ΔX=${tf.deltaTranslation[0]}, ΔY=${tf.deltaTranslation[1]}, ΔZ=${tf.deltaTranslation[2]}]\``
        );
        lines.push(
          `- **Object Local Position (Before → After)**: \`[${tf.initialObjectPosition.join(', ')}]\` → \`[${tf.newObjectPosition.join(', ')}]\``
        );
        lines.push(
          `- **Rotation Euler Deg (Before → After)**: \`[${tf.initialRotationDeg.join('°, ')}°]\` → \`[${tf.newRotationDeg.join('°, ')}°]\` (ΔRotY=\`${tf.deltaRotationDeg[1]}°\` / \`${dRyRad} rad\`, newRotY=\`${newRyRad} rad\`)`
        );
        lines.push(
          `- **Camera Pose**: pos=\`[${cx}, ${cy}, ${cz}]\`, target=\`[${tx}, ${ty}, ${tz}]\`, floor=\`${r.cameraPose.floorViewMode}\`, ceilingCutaway=\`${r.cameraPose.ceilingCutaway}\``
        );
        lines.push('');
        continue;
      }

      if (kind === 'measure' && r.measurement) {
        const m = r.measurement;
        const targetSpec = m.targetMeasurement?.trim();
        const defaultNote = targetSpec
          ? `Adjust span from ${m.distanceM}m to ${targetSpec}`
          : `Measured span: ${m.distanceM}m (${(m.distanceM * 100).toFixed(1)}cm)`;
        const noteText = r.note.trim() || defaultNote;
        lines.push(`## Issue #${r.id} [MEASUREMENT SPAN]: ${noteText}`);
        lines.push(`- **Room / Zone**: ${r.roomName} (\`${r.roomZoneId}\`)`);
        lines.push(`- **USD Prim Path**: \`${usdPrimPath}\``);
        lines.push(
          `- **Measured 3D Span**: \`${formatMetersAndFeetInches(m.distanceM)}\` (Horizontal XZ: \`${m.horizontalDistanceM} m\`)`
        );
        if (targetSpec) {
          lines.push(`- **Target / Real-World Measurement**: \`${targetSpec}\``);
        }
        lines.push(
          `- **Span Axis Deltas (B − A)**: \`ΔX=${m.deltaXYZ[0]} m, ΔY=${m.deltaXYZ[1]} m, ΔZ=${m.deltaXYZ[2]} m\``
        );
        lines.push(
          `- **Start Point A (m)**: \`[${m.startPoint.join(', ')}]\` on \`${m.startMeshName}\` (normal=\`[${m.startNormal.join(', ')}]\`)`
        );
        lines.push(
          `- **End Point B (m)**: \`[${m.endPoint.join(', ')}]\` on \`${m.endMeshName}\` (normal=\`[${m.endNormal.join(', ')}]\`)`
        );
        lines.push(
          `- **Camera Pose**: pos=\`[${cx}, ${cy}, ${cz}]\`, target=\`[${tx}, ${ty}, ${tz}]\`, floor=\`${r.cameraPose.floorViewMode}\`, ceilingCutaway=\`${r.cameraPose.ceilingCutaway}\``
        );
        lines.push('');
        continue;
      }

      const noteText = r.note.trim() || '(No note entered)';
      lines.push(`## Issue #${r.id}: ${noteText}`);
      lines.push(`- **Room / Zone**: ${r.roomName} (\`${r.roomZoneId}\`)`);
      lines.push(`- **USD Prim Path**: \`${usdPrimPath}\``);
      lines.push(`- **Hit World Point (m)**: \`[${x}, ${y}, ${z}]\``);
      lines.push(`- **Surface Normal**: \`[${nx}, ${ny}, ${nz}]\``);
      lines.push(`- **Mesh Name**: \`${r.meshInfo.meshName}\``);
      if (r.meshInfo.parentChain.length > 0) {
        lines.push(`- **Hierarchy**: \`${r.meshInfo.parentChain.join(' > ')}\``);
      }
      lines.push(`- **Geometry**: \`${r.meshInfo.geometrySummary}\``);
      lines.push(`- **Material**: \`${r.meshInfo.materialSummary}\``);
      lines.push(
        `- **Mesh World Bounds**: center=\`[${mx}, ${my}, ${mz}]\`, size=\`[${sx}, ${sy}, ${sz}]\`, min=\`[${minX}, ${minY}, ${minZ}]\`, max=\`[${maxX}, ${maxY}, ${maxZ}]\``
      );
      if (r.meshInfo.cutawayWall) {
        const cw = r.meshInfo.cutawayWall;
        lines.push(
          `- **Cutaway Wall**: \`axis=${cw.axis}, coord=${cw.coord}, span=[${cw.minSpan}..${cw.maxSpan}], floor=${cw.floor}\``
        );
      }
      lines.push(
        `- **Camera Pose**: pos=\`[${cx}, ${cy}, ${cz}]\`, target=\`[${tx}, ${ty}, ${tz}]\`, floor=\`${r.cameraPose.floorViewMode}\`, ceilingCutaway=\`${r.cameraPose.ceilingCutaway}\``
      );
      lines.push('');
    }

    lines.push('### OpenUSD Non-Destructive Override Layer (`usd/overrides/layout.usda`)');
    lines.push('```usda');
    lines.push(this.formatAsUsdaOverrideLayer().trim());
    lines.push('```');
    lines.push('');
    lines.push('```json');
    lines.push(JSON.stringify(this.records, null, 2));
    lines.push('```');
    return lines.join('\n');
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.records, this.selectedId);
    }
  }

  private saveToStorage(): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
    } catch {
      // Ignore storage quota errors
    }
  }

  private loadFromStorage(): void {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      const valid: SceneAnnotationRecord[] = [];
      let maxId = 0;
      for (const item of parsed) {
        if (
          typeof item === 'object' &&
          item !== null &&
          'id' in item &&
          typeof item.id === 'number' &&
          'worldPoint' in item &&
          Array.isArray(item.worldPoint) &&
          item.worldPoint.length === 3
        ) {
          const rec = item as SceneAnnotationRecord;
          valid.push(rec);
          if (rec.id > maxId) maxId = rec.id;
        }
      }
      this.records = valid;
      this.nextId = maxId + 1;
      this.selectedId = valid[valid.length - 1]?.id ?? null;
    } catch {
      // Ignore malformed localStorage data
    }
  }
}

