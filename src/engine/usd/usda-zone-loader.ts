import * as THREE from 'three';

export type UsdaSceneLayerTarget =
  | 'ground'
  | 'firstFloor'
  | 'groundCeiling'
  | 'roof'
  | 'cutaway.southWest'
  | 'cutaway.west'
  | 'cutaway.north'
  | 'cutaway.east';

export interface UsdaLoadedTopPrim {
  readonly primPath: string;
  readonly sceneLayer: UsdaSceneLayerTarget;
  readonly object3d: THREE.Object3D;
}

export interface UsdaLoadedZoneResult {
  readonly zoneId: string;
  readonly topPrims: readonly UsdaLoadedTopPrim[];
  readonly stats: {
    readonly totalPrims: number;
    readonly cubeCount: number;
    readonly cylinderCount: number;
    readonly sphereCount: number;
    readonly coneCount: number;
    readonly meshCount: number;
  };
}

interface ParsedUsdaMaterialSpec {
  name: string;
  proceduralKind: string;
  primaryColor: [number, number, number];
  secondaryColor: [number, number, number];
  uvScale: [number, number];
  bumpStrength: number;
  diffuseColor: [number, number, number];
  emissiveColor: [number, number, number];
  roughness: number;
  metallic: number;
  opacity: number;
  ior: number;
  clearcoat: number;
  clearcoatRoughness: number;
}

function rgbTupleToHexStyle(rgb: readonly [number, number, number]): string {
  const r = Math.max(0, Math.min(255, Math.round(rgb[0] * 255)));
  const g = Math.max(0, Math.min(255, Math.round(rgb[1] * 255)));
  const b = Math.max(0, Math.min(255, Math.round(rgb[2] * 255)));
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Synthesizes a procedural 2D CanvasTexture in the browser from the declarative
 * MaterialX/OpenUSD `procedural:*` attributes in `usd/materials/materials.usda`.
 */
function buildProceduralTextureFromUsdSpec(
  spec: ParsedUsdaMaterialSpec
): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const kind = spec.proceduralKind;
  if (
    !kind ||
    kind === 'solid' ||
    kind === 'architectural_glass' ||
    kind === 'emissive_display' ||
    kind === 'brushed_metal'
  ) {
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const primaryCss = rgbTupleToHexStyle(spec.primaryColor);
  const secondaryCss = rgbTupleToHexStyle(spec.secondaryColor);

  ctx.fillStyle = primaryCss;
  ctx.fillRect(0, 0, 256, 256);

  if (kind === 'checker_tile') {
    ctx.fillStyle = secondaryCss;
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillRect(128, 128, 128, 128);
    ctx.strokeStyle = 'rgba(120, 115, 108, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 128, 128);
    ctx.strokeRect(128, 0, 128, 128);
    ctx.strokeRect(0, 128, 128, 128);
    ctx.strokeRect(128, 128, 128, 128);
  } else if (kind === 'brick_bond') {
    ctx.fillStyle = secondaryCss;
    ctx.fillRect(0, 0, 256, 256);
    const rows = 4;
    const cols = 2;
    const rowH = 256 / rows;
    const colW = 256 / cols;
    const mortar = 4;
    ctx.fillStyle = primaryCss;
    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (colW * 0.5);
      for (let c = -1; c <= cols; c++) {
        const x = c * colW + offset + mortar * 0.5;
        const y = r * rowH + mortar * 0.5;
        ctx.fillRect(x, y, colW - mortar, rowH - mortar);
      }
    }
  } else if (kind === 'herringbone_brick') {
    ctx.fillStyle = secondaryCss;
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = primaryCss;
    const step = 32;
    for (let y = -64; y < 256 + 64; y += step) {
      for (let x = -64; x < 256 + 64; x += step) {
        const idx = ((x / step) + (y / step)) & 1;
        if (idx === 0) {
          ctx.fillRect(x + 2, y + 2, step * 2 - 4, step - 4);
        } else {
          ctx.fillRect(x + 2, y + 2, step - 4, step * 2 - 4);
        }
      }
    }
  } else if (kind === 'wood_grain') {
    ctx.fillStyle = secondaryCss;
    for (let i = 0; i < 48; i++) {
      const y = ((i * 37) % 256);
      const h = 1 + (i % 3);
      ctx.globalAlpha = 0.14 + (i % 4) * 0.04;
      ctx.fillRect(0, y, 256, h);
    }
    ctx.globalAlpha = 1;
  } else if (kind === 'slate_tile' || kind === 'natural_stone' || kind === 'cobblestone') {
    ctx.strokeStyle = secondaryCss;
    ctx.lineWidth = 3;
    const grid = kind === 'cobblestone' ? 32 : 64;
    for (let y = 0; y < 256; y += grid) {
      for (let x = 0; x < 256; x += grid) {
        const shift = ((y / grid) % 2) * (grid * 0.5);
        ctx.strokeRect((x + shift) % 256, y, grid, grid);
      }
    }
  } else if (kind === 'woven_fabric' || kind === 'patterned_rug') {
    ctx.fillStyle = secondaryCss;
    ctx.globalAlpha = kind === 'patterned_rug' ? 0.32 : 0.16;
    for (let y = 0; y < 256; y += 8) {
      ctx.fillRect(0, y, 256, 2);
    }
    for (let x = 0; x < 256; x += 8) {
      ctx.fillRect(x, 0, 2, 256);
    }
    if (kind === 'patterned_rug') {
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 10;
      ctx.strokeStyle = secondaryCss;
      ctx.strokeRect(18, 18, 220, 220);
    }
    ctx.globalAlpha = 1;
  } else if (kind === 'plaster_wall') {
    ctx.fillStyle = secondaryCss;
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 120; i++) {
      const x = (i * 73) % 256;
      const y = (i * 139) % 256;
      ctx.fillRect(x, y, 14, 10);
    }
    ctx.globalAlpha = 1;
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(Math.max(0.1, spec.uvScale[0]), Math.max(0.1, spec.uvScale[1]));
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function parseVec3Attr(line: string): [number, number, number] | null {
  const m = line.match(/\(\s*([+-]?\d*\.?\d+(?:e[+-]?\d+)?)\s*,\s*([+-]?\d*\.?\d+(?:e[+-]?\d+)?)\s*,\s*([+-]?\d*\.?\d+(?:e[+-]?\d+)?)\s*\)/i);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

function parseVec2Attr(line: string): [number, number] | null {
  const m = line.match(/\(\s*([+-]?\d*\.?\d+(?:e[+-]?\d+)?)\s*,\s*([+-]?\d*\.?\d+(?:e[+-]?\d+)?)\s*\)/i);
  if (!m) return null;
  return [Number(m[1]), Number(m[2])];
}

/**
 * Parses `usd/materials/materials.usda` into a map of `/CroxFarmhouse/_Materials/<MatName>`
 * -> `THREE.Material` (using `MeshPhysicalMaterial` or `MeshStandardMaterial` and procedural
 * `CanvasTexture` synthesis).
 */
export function parseUsdaMaterialLibrary(
  usdaText: string
): Map<string, THREE.Material> {
  const out = new Map<string, THREE.Material>();
  const lines = usdaText.split(/\r?\n/);

  let currentMat: ParsedUsdaMaterialSpec | null = null;
  let inPreviewShader = false;
  let matDepth = 0;
  let currentDepth = 0;

  const finalizeMat = (spec: ParsedUsdaMaterialSpec): void => {
    const matPath = `/CroxFarmhouse/_Materials/${spec.name}`;
    const tex = buildProceduralTextureFromUsdSpec(spec);
    const isTransparent = spec.opacity < 0.995;

    let mat: THREE.MeshStandardMaterial;
    if (spec.clearcoat > 0.01 || isTransparent) {
      mat = new THREE.MeshPhysicalMaterial({
        name: spec.name,
        color: new THREE.Color(
          tex ? 1 : spec.diffuseColor[0],
          tex ? 1 : spec.diffuseColor[1],
          tex ? 1 : spec.diffuseColor[2]
        ),
        map: tex,
        emissive: new THREE.Color(
          spec.emissiveColor[0],
          spec.emissiveColor[1],
          spec.emissiveColor[2]
        ),
        roughness: spec.roughness,
        metalness: spec.metallic,
        transparent: isTransparent,
        opacity: spec.opacity,
        ior: spec.ior,
        clearcoat: spec.clearcoat,
        clearcoatRoughness: spec.clearcoatRoughness,
      });
    } else {
      mat = new THREE.MeshStandardMaterial({
        name: spec.name,
        color: new THREE.Color(
          tex ? 1 : spec.diffuseColor[0],
          tex ? 1 : spec.diffuseColor[1],
          tex ? 1 : spec.diffuseColor[2]
        ),
        map: tex,
        emissive: new THREE.Color(
          spec.emissiveColor[0],
          spec.emissiveColor[1],
          spec.emissiveColor[2]
        ),
        roughness: spec.roughness,
        metalness: spec.metallic,
      });
    }

    mat.userData = {
      usdMaterialPath: matPath,
      proceduralKind: spec.proceduralKind,
    };
    out.set(matPath, mat);
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const matMatch = line.match(/^def\s+Material\s+"([^"]+)"/);
    if (matMatch) {
      currentMat = {
        name: matMatch[1],
        proceduralKind: 'solid',
        primaryColor: [0.85, 0.85, 0.85],
        secondaryColor: [0.75, 0.75, 0.75],
        uvScale: [1, 1],
        bumpStrength: 0.05,
        diffuseColor: [0.85, 0.85, 0.85],
        emissiveColor: [0, 0, 0],
        roughness: 0.7,
        metallic: 0,
        opacity: 1,
        ior: 1.5,
        clearcoat: 0,
        clearcoatRoughness: 0.2,
      };
      matDepth = currentDepth;
      inPreviewShader = false;
    } else if (currentMat && line.startsWith('def Shader "PreviewSurface"')) {
      inPreviewShader = true;
    }

    for (let i = 0; i < line.length; i++) {
      if (line[i] === '{') currentDepth++;
      else if (line[i] === '}') {
        currentDepth--;
        if (inPreviewShader && currentDepth <= matDepth + 1) {
          inPreviewShader = false;
        }
        if (currentMat && currentDepth <= matDepth) {
          finalizeMat(currentMat);
          currentMat = null;
        }
      }
    }

    if (!currentMat) continue;

    if (line.startsWith('custom uniform token procedural:kind')) {
      const m = line.match(/=\s*"([^"]+)"/);
      if (m) currentMat.proceduralKind = m[1];
    } else if (line.startsWith('custom color3f procedural:primaryColor')) {
      const v = parseVec3Attr(line);
      if (v) {
        currentMat.primaryColor = v;
        currentMat.diffuseColor = v;
      }
    } else if (line.startsWith('custom color3f procedural:secondaryColor')) {
      const v = parseVec3Attr(line);
      if (v) currentMat.secondaryColor = v;
    } else if (line.startsWith('custom float2 procedural:uvScale')) {
      const v = parseVec2Attr(line);
      if (v) currentMat.uvScale = v;
    } else if (line.startsWith('custom float procedural:bumpStrength')) {
      const m = line.match(/=\s*([+-]?\d*\.?\d+)/);
      if (m) currentMat.bumpStrength = Number(m[1]);
    } else if (inPreviewShader) {
      if (line.startsWith('color3f inputs:diffuseColor') && ! line.includes('.connect')) {
        const v = parseVec3Attr(line);
        if (v) currentMat.diffuseColor = v;
      } else if (line.startsWith('color3f inputs:emissiveColor')) {
        const v = parseVec3Attr(line);
        if (v) currentMat.emissiveColor = v;
      } else if (line.startsWith('float inputs:roughness')) {
        const m = line.match(/=\s*([+-]?\d*\.?\d+)/);
        if (m) currentMat.roughness = Number(m[1]);
      } else if (line.startsWith('float inputs:metallic')) {
        const m = line.match(/=\s*([+-]?\d*\.?\d+)/);
        if (m) currentMat.metallic = Number(m[1]);
      } else if (line.startsWith('float inputs:opacity')) {
        const m = line.match(/=\s*([+-]?\d*\.?\d+)/);
        if (m) currentMat.opacity = Number(m[1]);
      } else if (line.startsWith('float inputs:ior')) {
        const m = line.match(/=\s*([+-]?\d*\.?\d+)/);
        if (m) currentMat.ior = Number(m[1]);
      } else if (line.startsWith('float inputs:clearcoat =')) {
        const m = line.match(/=\s*([+-]?\d*\.?\d+)/);
        if (m) currentMat.clearcoat = Number(m[1]);
      } else if (line.startsWith('float inputs:clearcoatRoughness')) {
        const m = line.match(/=\s*([+-]?\d*\.?\d+)/);
        if (m) currentMat.clearcoatRoughness = Number(m[1]);
      }
    }
  }

  return out;
}

interface UsdaPrimNode {
  typeName: string;
  name: string;
  primPath: string;
  translate?: [number, number, number];
  rotateXYZDeg?: [number, number, number];
  scale?: [number, number, number];
  visible: boolean;
  doubleSided: boolean;
  materialBindingPath?: string;
  size?: number;
  radius?: number;
  height?: number;
  axis?: 'X' | 'Y' | 'Z';
  boxDimensions?: [number, number, number];
  faceVertexCounts?: number[];
  faceVertexIndices?: number[];
  points?: number[];
  normals?: number[];
  uvs?: number[];
  subsetIndices?: number[];
  sceneLayer?: UsdaSceneLayerTarget;
  threeName?: string;
  userDataJson?: string;
  lodTier?: number;
  roomZoneId?: string;
  children: UsdaPrimNode[];
}

function unescapeUsdString(escaped: string): string {
  return escaped
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

function parseIntArrayBracket(line: string): number[] {
  const start = line.indexOf('[');
  const end = line.lastIndexOf(']');
  if (start < 0 || end <= start) return [];
  const inner = line.slice(start + 1, end).trim();
  if (!inner) return [];
  const parts = inner.split(',');
  const result = new Array<number>(parts.length);
  for (let i = 0; i < parts.length; i++) {
    result[i] = Number(parts[i]);
  }
  return result;
}

function parseTupleFloatArrayBracket(line: string): number[] {
  const start = line.indexOf('[');
  const end = line.lastIndexOf(']');
  if (start < 0 || end <= start) return [];
  const inner = line.slice(start + 1, end);
  const matches = inner.match(/[+-]?\d*\.?\d+(?:e[+-]?\d+)?/gi);
  if (!matches) return [];
  const result = new Array<number>(matches.length);
  for (let i = 0; i < matches.length; i++) {
    result[i] = Number(matches[i]);
  }
  return result;
}

function resolveMaterialForPrim(
  matPath: string | undefined,
  doubleSided: boolean,
  materials: ReadonlyMap<string, THREE.Material>,
  fallbackMat: THREE.MeshStandardMaterial
): THREE.Material {
  const base = (matPath ? materials.get(matPath) : undefined) ?? fallbackMat;
  if (doubleSided && base.side !== THREE.DoubleSide) {
    const cloned = base.clone();
    cloned.side = THREE.DoubleSide;
    return cloned;
  }
  return base;
}

function buildThreeObjectFromUsdaPrim(
  node: UsdaPrimNode,
  materials: ReadonlyMap<string, THREE.Material>,
  fallbackMat: THREE.MeshStandardMaterial,
  stats: {
    totalPrims: number;
    cubeCount: number;
    cylinderCount: number;
    sphereCount: number;
    coneCount: number;
    meshCount: number;
  }
): THREE.Object3D | null {
  if (node.typeName === 'GeomSubset') {
    return null;
  }

  stats.totalPrims++;

  let obj: THREE.Object3D;

  if (node.typeName === 'Cube') {
    stats.cubeCount++;
    const size = node.size ?? 1;
    const geo = new THREE.BoxGeometry(size, size, size);
    const mat = resolveMaterialForPrim(
      node.materialBindingPath,
      node.doubleSided,
      materials,
      fallbackMat
    );
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    obj = mesh;
  } else if (node.typeName === 'Cylinder') {
    stats.cylinderCount++;
    const r = node.radius ?? 0.5;
    const h = node.height ?? 1;
    const geo = new THREE.CylinderGeometry(r, r, h, 24);
    if (node.axis === 'X') geo.rotateZ(Math.PI * 0.5);
    else if (node.axis === 'Z') geo.rotateX(Math.PI * 0.5);
    const mat = resolveMaterialForPrim(
      node.materialBindingPath,
      node.doubleSided,
      materials,
      fallbackMat
    );
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    obj = mesh;
  } else if (node.typeName === 'Cone') {
    stats.coneCount++;
    const r = node.radius ?? 0.5;
    const h = node.height ?? 1;
    const geo = new THREE.ConeGeometry(r, h, 24);
    if (node.axis === 'X') geo.rotateZ(-Math.PI * 0.5);
    else if (node.axis === 'Z') geo.rotateX(Math.PI * 0.5);
    const mat = resolveMaterialForPrim(
      node.materialBindingPath,
      node.doubleSided,
      materials,
      fallbackMat
    );
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    obj = mesh;
  } else if (node.typeName === 'Sphere') {
    stats.sphereCount++;
    const r = node.radius ?? 0.5;
    const geo = new THREE.SphereGeometry(r, 24, 16);
    const mat = resolveMaterialForPrim(
      node.materialBindingPath,
      node.doubleSided,
      materials,
      fallbackMat
    );
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    obj = mesh;
  } else if (node.typeName === 'Mesh' && node.points && node.points.length >= 9) {
    stats.meshCount++;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(node.points, 3)
    );
    if (node.normals && node.normals.length === node.points.length) {
      geo.setAttribute(
        'normal',
        new THREE.Float32BufferAttribute(node.normals, 3)
      );
    }
    if (
      node.uvs &&
      node.uvs.length === (node.points.length / 3) * 2
    ) {
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(node.uvs, 2));
    }

    const subsets = node.children.filter((c) => c.typeName === 'GeomSubset');
    let meshMat: THREE.Material | THREE.Material[];

    if (subsets.length > 0 && node.faceVertexIndices && node.faceVertexIndices.length >= 3) {
      const reorderedIndices: number[] = [];
      const matArray: THREE.Material[] = [];
      geo.clearGroups();

      for (let sIdx = 0; sIdx < subsets.length; sIdx++) {
        const sub = subsets[sIdx];
        const faceList = sub.subsetIndices ?? [];
        const startIdx = reorderedIndices.length;
        for (const f of faceList) {
          const base = f * 3;
          if (base + 2 < node.faceVertexIndices.length) {
            reorderedIndices.push(
              node.faceVertexIndices[base],
              node.faceVertexIndices[base + 1],
              node.faceVertexIndices[base + 2]
            );
          }
        }
        const count = reorderedIndices.length - startIdx;
        if (count > 0) {
          geo.addGroup(startIdx, count, matArray.length);
          matArray.push(
            resolveMaterialForPrim(
              sub.materialBindingPath,
              node.doubleSided,
              materials,
              fallbackMat
            )
          );
        }
      }

      if (reorderedIndices.length > 0) {
        geo.setIndex(reorderedIndices);
      } else {
        geo.setIndex(node.faceVertexIndices);
      }
      meshMat =
        matArray.length > 0
          ? matArray
          : resolveMaterialForPrim(
              node.materialBindingPath,
              node.doubleSided,
              materials,
              fallbackMat
            );
    } else {
      if (node.faceVertexIndices && node.faceVertexIndices.length >= 3) {
        geo.setIndex(node.faceVertexIndices);
      }
      meshMat = resolveMaterialForPrim(
        node.materialBindingPath,
        node.doubleSided,
        materials,
        fallbackMat
      );
    }

    if (!geo.getAttribute('normal')) {
      geo.computeVertexNormals();
    }

    const mesh = new THREE.Mesh(geo, meshMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    obj = mesh;
  } else {
    obj = new THREE.Group();
  }

  obj.name = node.threeName ?? node.name;
  obj.visible = node.visible;

  if (node.translate) {
    obj.position.set(node.translate[0], node.translate[1], node.translate[2]);
  }
  if (node.rotateXYZDeg) {
    const degToRad = Math.PI / 180;
    const euler = new THREE.Euler(
      node.rotateXYZDeg[0] * degToRad,
      node.rotateXYZDeg[1] * degToRad,
      node.rotateXYZDeg[2] * degToRad,
      'ZYX'
    );
    obj.quaternion.setFromEuler(euler);
  }
  if (node.scale) {
    obj.scale.set(node.scale[0], node.scale[1], node.scale[2]);
  }

  let restoredUserData: Record<string, unknown> = {};
  if (node.userDataJson) {
    try {
      const parsed = JSON.parse(node.userDataJson) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        restoredUserData = parsed as Record<string, unknown>;
      }
    } catch {
      // Ignore malformed JSON
    }
  }
  if (node.lodTier !== undefined && restoredUserData.lodTier === undefined) {
    restoredUserData.lodTier = node.lodTier;
  }
  if (node.roomZoneId && restoredUserData.zone === undefined) {
    restoredUserData.zone = node.roomZoneId;
  }
  restoredUserData.usdPrimPath = node.primPath;
  restoredUserData.usdSourceOfTruth = true;
  obj.userData = restoredUserData;

  for (const childNode of node.children) {
    if (childNode.typeName === 'GeomSubset') continue;
    const childObj = buildThreeObjectFromUsdaPrim(
      childNode,
      materials,
      fallbackMat,
      stats
    );
    if (childObj) {
      obj.add(childObj);
    }
  }

  return obj;
}

/**
 * Parses a modular room/system layer (`usd/zones/<zoneId>.usda`) directly from its
 * OpenUSD ASCII representation and instantiates the corresponding Three.js hierarchy
 * (`THREE.Group` + `THREE.Mesh` with `BoxGeometry`, `CylinderGeometry`, `SphereGeometry`,
 * `ConeGeometry`, or `BufferGeometry` + `GeomSubset` multi-materials).
 */
export function parseAndInstantiateUsdaZone(
  usdaText: string,
  materials: ReadonlyMap<string, THREE.Material>
): UsdaLoadedZoneResult {
  const lines = usdaText.split(/\r?\n/);
  const stack: UsdaPrimNode[] = [];
  const rootNodes: UsdaPrimNode[] = [];

  let pendingPrim: UsdaPrimNode | null = null;
  let inParenMetadata = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    if (inParenMetadata) {
      if (line.endsWith(')') || line.includes(')')) {
        inParenMetadata = false;
      }
      if (line.endsWith('{') && pendingPrim) {
        stack.push(pendingPrim);
        pendingPrim = null;
      }
      continue;
    }

    const defMatch = line.match(/^(?:def|over)\s+(\w+)\s+"([^"]+)"(.*)$/);
    if (defMatch) {
      const typeName = defMatch[1];
      const name = defMatch[2];
      const rest = defMatch[3].trim();
      const parent = stack[stack.length - 1];
      const primPath = parent ? `${parent.primPath}/${name}` : `/${name}`;

      const node: UsdaPrimNode = {
        typeName,
        name,
        primPath,
        visible: true,
        doubleSided: false,
        children: [],
      };

      if (parent) {
        parent.children.push(node);
      } else {
        rootNodes.push(node);
      }

      if (rest.startsWith('(') && !rest.includes(')')) {
        inParenMetadata = true;
        pendingPrim = node;
      } else if (rest.endsWith('{')) {
        stack.push(node);
      } else {
        pendingPrim = node;
      }
      continue;
    }

    if (line === '{') {
      if (pendingPrim) {
        stack.push(pendingPrim);
        pendingPrim = null;
      }
      continue;
    }

    if (line === '}') {
      stack.pop();
      continue;
    }

    const current = stack[stack.length - 1];
    if (!current) continue;

    if (line.startsWith('double3 xformOp:translate')) {
      const v = parseVec3Attr(line);
      if (v) current.translate = v;
    } else if (line.startsWith('float3 xformOp:rotateXYZ')) {
      const v = parseVec3Attr(line);
      if (v) current.rotateXYZDeg = v;
    } else if (line.startsWith('float3 xformOp:scale')) {
      const v = parseVec3Attr(line);
      if (v) current.scale = v;
    } else if (line.startsWith('uniform token visibility')) {
      const m = line.match(/=\s*"([^"]+)"/);
      if (m) current.visible = m[1] !== 'invisible';
    } else if (line.startsWith('bool doubleSided')) {
      current.doubleSided = line.includes('true');
    } else if (line.startsWith('rel material:binding')) {
      const m = line.match(/<([^>]+)>/);
      if (m) current.materialBindingPath = m[1];
    } else if (line.startsWith('double size =')) {
      const m = line.match(/=\s*([+-]?\d*\.?\d+)/);
      if (m) current.size = Number(m[1]);
    } else if (line.startsWith('double radius =')) {
      const m = line.match(/=\s*([+-]?\d*\.?\d+)/);
      if (m) current.radius = Number(m[1]);
    } else if (line.startsWith('double height =')) {
      const m = line.match(/=\s*([+-]?\d*\.?\d+)/);
      if (m) current.height = Number(m[1]);
    } else if (line.startsWith('uniform token axis =')) {
      const m = line.match(/=\s*"([XYZ])"/);
      if (m) current.axis = m[1] as 'X' | 'Y' | 'Z';
    } else if (line.startsWith('custom double3 twin:boxDimensions')) {
      const v = parseVec3Attr(line);
      if (v) current.boxDimensions = v;
    } else if (line.startsWith('int[] faceVertexCounts =')) {
      current.faceVertexCounts = parseIntArrayBracket(line);
    } else if (line.startsWith('int[] faceVertexIndices =')) {
      current.faceVertexIndices = parseIntArrayBracket(line);
    } else if (line.startsWith('point3f[] points =')) {
      current.points = parseTupleFloatArrayBracket(line);
    } else if (line.startsWith('normal3f[] primvars:normals =')) {
      current.normals = parseTupleFloatArrayBracket(line);
      if (line.endsWith('(')) inParenMetadata = true;
    } else if (line.startsWith('texCoord2f[] primvars:st =')) {
      current.uvs = parseTupleFloatArrayBracket(line);
      if (line.endsWith('(')) inParenMetadata = true;
    } else if (line.startsWith('int[] indices =') && current.typeName === 'GeomSubset') {
      current.subsetIndices = parseIntArrayBracket(line);
    } else if (line.startsWith('custom uniform token twin:sceneLayer')) {
      const m = line.match(/=\s*"([^"]+)"/);
      if (m) current.sceneLayer = m[1] as UsdaSceneLayerTarget;
    } else if (line.startsWith('custom uniform token twin:roomZoneId')) {
      const m = line.match(/=\s*"([^"]+)"/);
      if (m) current.roomZoneId = m[1];
    } else if (line.startsWith('custom string twin:threeName')) {
      const m = line.match(/=\s*"((?:[^"\\]|\\.)*)"/);
      if (m) current.threeName = unescapeUsdString(m[1]);
    } else if (line.startsWith('custom string twin:userDataJson')) {
      const m = line.match(/=\s*"((?:[^"\\]|\\.)*)"/);
      if (m) current.userDataJson = unescapeUsdString(m[1]);
    } else if (line.startsWith('custom int twin:lodTier')) {
      const m = line.match(/=\s*(-?\d+)/);
      if (m) current.lodTier = Number(m[1]);
    }
  }

  // Locate `/CroxFarmhouse/Zones/<zoneId>`
  const croxRoot = rootNodes.find((n) => n.name === 'CroxFarmhouse') ?? rootNodes[0];
  const zonesScope = croxRoot?.children.find((c) => c.name === 'Zones');
  const zonePrim = zonesScope?.children[0];
  const zoneId = zonePrim?.name ?? 'unknown';

  const fallbackMat = new THREE.MeshStandardMaterial({
    name: 'UsdFallbackMat',
    color: 0xd8d2c7,
    roughness: 0.78,
  });

  const stats = {
    totalPrims: 0,
    cubeCount: 0,
    cylinderCount: 0,
    sphereCount: 0,
    coneCount: 0,
    meshCount: 0,
  };

  const topPrims: UsdaLoadedTopPrim[] = [];
  if (zonePrim) {
    for (const topNode of zonePrim.children) {
      const obj = buildThreeObjectFromUsdaPrim(
        topNode,
        materials,
        fallbackMat,
        stats
      );
      if (!obj) continue;
      const defaultLayer: UsdaSceneLayerTarget =
        zoneId === 'roofAndCeilings' ? 'roof' : 'ground';
      const sceneLayer = topNode.sceneLayer ?? defaultLayer;
      topPrims.push({
        primPath: topNode.primPath,
        sceneLayer,
        object3d: obj,
      });
    }
  }

  return {
    zoneId,
    topPrims,
    stats,
  };
}
