import * as THREE from 'three';
import type { Vec3Tuple } from '../../types/scene.ts';
import type {
  UsdPreviewSurfaceData,
  UsdProceduralPatternKind,
  UsdProceduralPatternSpec,
  UsdTextureRef,
} from './schema.ts';

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function colorToTuple(c: THREE.Color): Vec3Tuple {
  return [round4(c.r), round4(c.g), round4(c.b)];
}

function hexToTuple(hex: string): Vec3Tuple | null {
  const clean = hex.trim().replace(/^#/, '');
  if (clean.length === 6 && /^[0-9a-fA-F]{6}$/.test(clean)) {
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;
    return [round4(r), round4(g), round4(b)];
  }
  if (clean.length === 3 && /^[0-9a-fA-F]{3}$/.test(clean)) {
    const r = parseInt(clean[0] + clean[0], 16) / 255;
    const g = parseInt(clean[1] + clean[1], 16) / 255;
    const b = parseInt(clean[2] + clean[2], 16) / 255;
    return [round4(r), round4(g), round4(b)];
  }
  const rgbMatch = hex.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbMatch) {
    return [
      round4(Math.min(255, Number(rgbMatch[1])) / 255),
      round4(Math.min(255, Number(rgbMatch[2])) / 255),
      round4(Math.min(255, Number(rgbMatch[3])) / 255),
    ];
  }
  return null;
}

function multiplyColors(a: Vec3Tuple, b: Vec3Tuple): Vec3Tuple {
  return [round4(a[0] * b[0]), round4(a[1] * b[1]), round4(a[2] * b[2])];
}

function luminance(c: Vec3Tuple): number {
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

function colorDistance(a: Vec3Tuple, b: Vec3Tuple): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/**
 * Extracts distinct fill/stroke colors from a RecordingCanvas command log (`canvas.log`)
 * so procedural materials retain their exact authored color palettes without baking PNGs.
 */
function extractCanvasPalette(image: unknown): Vec3Tuple[] {
  if (!image || typeof image !== 'object' || !('log' in image)) return [];
  const log = (image as { readonly log?: readonly string[] }).log;
  if (!Array.isArray(log)) return [];

  const counts = new Map<string, { color: Vec3Tuple; count: number }>();
  for (let i = 0; i < Math.min(log.length, 600); i++) {
    const entry = log[i];
    if (
      typeof entry === 'string' &&
      (entry.startsWith('set fillStyle=') || entry.startsWith('set strokeStyle='))
    ) {
      const rawVal = entry.slice(entry.indexOf('=') + 1).replace(/^"|"$/g, '');
      const parsed = hexToTuple(rawVal);
      if (parsed) {
        const key = parsed.join(',');
        const existing = counts.get(key);
        if (existing) {
          existing.count++;
        } else {
          counts.set(key, { color: parsed, count: 1 });
        }
      }
    }
  }

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .map((e) => e.color);
}

/**
 * Infers the semantic procedural pattern archetype (`UsdProceduralPatternKind`) from a
 * Three.js material, its procedural canvas draw log, and the meshes it is bound to.
 */
export function classifyProceduralPattern(
  mat: THREE.Material,
  usageHintName = ''
): UsdProceduralPatternSpec {
  const std = mat as THREE.MeshStandardMaterial;
  const matTint: Vec3Tuple =
    std.color instanceof THREE.Color ? colorToTuple(std.color) : [0.8, 0.8, 0.8];
  const roughness = typeof std.roughness === 'number' ? std.roughness : 0.5;
  const metalness = typeof std.metalness === 'number' ? std.metalness : 0.0;
  const opacity = mat.transparent && typeof mat.opacity === 'number' ? mat.opacity : 1.0;
  const bumpScale = typeof std.bumpScale === 'number' ? std.bumpScale : 0.01;

  const mapTex = std.map instanceof THREE.Texture ? std.map : undefined;
  const bumpTex = std.bumpMap instanceof THREE.Texture ? std.bumpMap : undefined;
  const rawRepeat: readonly [number, number] = mapTex
    ? [mapTex.repeat.x || 1, mapTex.repeat.y || 1]
    : bumpTex
      ? [bumpTex.repeat.x || 1, bumpTex.repeat.y || 1]
      : [1, 1];
  const repeat: readonly [number, number] = [
    Math.max(1, Math.round(rawRepeat[0] * 2) / 2),
    Math.max(1, Math.round(rawRepeat[1] * 2) / 2),
  ];

  // 1. Architectural glass / transparent glazing
  if (opacity < 0.85) {
    return {
      kind: 'architectural_glass',
      primaryColor: matTint,
      bumpStrength: 0,
    };
  }

  // 2. Emissive displays / LED indicators / light bulbs
  if (std.emissive instanceof THREE.Color) {
    const em = colorToTuple(std.emissive);
    const emInt = typeof std.emissiveIntensity === 'number' ? std.emissiveIntensity : 1;
    if ((em[0] + em[1] + em[2]) * emInt > 0.35) {
      return {
        kind: 'emissive_display',
        primaryColor: matTint,
        secondaryColor: em,
      };
    }
  }

  // 3. Brushed / cast metals (brass, stainless steel, cast iron, aluminium, Corten)
  if (metalness >= 0.45) {
    const darkTone: Vec3Tuple = [
      round4(matTint[0] * 0.78),
      round4(matTint[1] * 0.78),
      round4(matTint[2] * 0.78),
    ];
    return {
      kind: 'brushed_metal',
      primaryColor: matTint,
      secondaryColor: darkTone,
      bumpStrength: round4(bumpScale),
    };
  }

  const palette = mapTex ? extractCanvasPalette(mapTex.image) : [];
  const primaryBase =
    palette.length > 0 ? multiplyColors(palette[0], matTint) : matTint;
  let secondaryBase: Vec3Tuple | undefined;
  let accentBase: Vec3Tuple | undefined;
  for (const cand of palette.slice(1)) {
    const tinted = multiplyColors(cand, matTint);
    if (!secondaryBase && colorDistance(primaryBase, tinted) > 0.06) {
      secondaryBase = tinted;
    } else if (
      secondaryBase &&
      !accentBase &&
      colorDistance(primaryBase, tinted) > 0.06 &&
      colorDistance(secondaryBase, tinted) > 0.06
    ) {
      accentBase = tinted;
      break;
    }
  }

  const hint = `${mat.name} ${usageHintName}`.toLowerCase();

  if (hint.includes('herringbone')) {
    return {
      kind: 'herringbone_brick',
      primaryColor: primaryBase,
      secondaryColor: secondaryBase ?? [0.78, 0.74, 0.68],
      uvScale: repeat,
      mortarWidth: 0.06,
      bumpStrength: round4(bumpScale || 0.015),
    };
  }

  if (
    hint.includes('brick') ||
    hint.includes('chimney') ||
    (palette.length >= 4 &&
      primaryBase[0] > primaryBase[1] * 1.25 &&
      primaryBase[0] > primaryBase[2] * 1.4)
  ) {
    return {
      kind: 'brick_bond',
      primaryColor: primaryBase,
      secondaryColor: secondaryBase ?? [0.82, 0.79, 0.73],
      accentColor: accentBase ?? [
        round4(primaryBase[0] * 0.82),
        round4(primaryBase[1] * 0.78),
        round4(primaryBase[2] * 0.75),
      ],
      uvScale: [4, 4],
      mortarWidth: 0.08,
      bumpStrength: round4(bumpScale || 0.02),
    };
  }

  if (
    hint.includes('vitoria') ||
    hint.includes('checker') ||
    hint.includes('chequer') ||
    (!mat.transparent &&
      (repeat[0] >= 2 || repeat[1] >= 2) &&
      palette.length >= 2 &&
      secondaryBase &&
      Math.abs(luminance(primaryBase) - luminance(secondaryBase)) > 0.45)
  ) {
    return {
      kind: 'checker_tile',
      primaryColor: primaryBase,
      secondaryColor: secondaryBase ?? [0.12, 0.13, 0.14],
      uvScale: repeat,
      mortarWidth: 0.025,
      bumpStrength: round4(bumpScale || 0.008),
    };
  }

  if (hint.includes('slate') || hint.includes('roof')) {
    return {
      kind: 'slate_tile',
      primaryColor: primaryBase,
      secondaryColor: secondaryBase ?? [
        round4(primaryBase[0] * 0.82),
        round4(primaryBase[1] * 0.84),
        round4(primaryBase[2] * 0.88),
      ],
      uvScale: [6, 6],
      mortarWidth: 0.03,
      bumpStrength: round4(bumpScale || 0.018),
    };
  }

  if (hint.includes('cobble') || hint.includes('sett') || hint.includes('gravel')) {
    return {
      kind: 'cobblestone',
      primaryColor: primaryBase,
      secondaryColor: secondaryBase ?? [
        round4(primaryBase[0] * 0.76),
        round4(primaryBase[1] * 0.75),
        round4(primaryBase[2] * 0.73),
      ],
      uvScale: [8, 8],
      mortarWidth: 0.09,
      bumpStrength: round4(bumpScale || 0.025),
    };
  }

  if (
    hint.includes('rug') ||
    hint.includes('runner') ||
    hint.includes('persian') ||
    hint.includes('berber')
  ) {
    return {
      kind: 'patterned_rug',
      primaryColor: primaryBase,
      secondaryColor: secondaryBase ?? [
        round4(primaryBase[0] * 0.75),
        round4(primaryBase[1] * 0.72),
        round4(primaryBase[2] * 0.68),
      ],
      accentColor: accentBase,
      uvScale: [2, 2],
      bumpStrength: round4(bumpScale || 0.012),
    };
  }

  if (
    hint.includes('oak') ||
    hint.includes('walnut') ||
    hint.includes('timber') ||
    hint.includes('wood') ||
    hint.includes('bifold') ||
    hint.includes('stair') ||
    hint.includes('beam') ||
    hint.includes('rafter')
  ) {
    return {
      kind: 'wood_grain',
      primaryColor: primaryBase,
      secondaryColor: secondaryBase ?? [
        round4(primaryBase[0] * 0.84),
        round4(primaryBase[1] * 0.79),
        round4(primaryBase[2] * 0.72),
      ],
      uvScale: [4, 4],
      bumpStrength: round4(bumpScale || 0.008),
    };
  }

  if (
    hint.includes('sofa') ||
    hint.includes('cushion') ||
    hint.includes('fabric') ||
    hint.includes('linen') ||
    hint.includes('velvet') ||
    hint.includes('curtain') ||
    hint.includes('upholster') ||
    hint.includes('bed')
  ) {
    return {
      kind: 'woven_fabric',
      primaryColor: primaryBase,
      secondaryColor: secondaryBase ?? [
        round4(primaryBase[0] * 0.91),
        round4(primaryBase[1] * 0.91),
        round4(primaryBase[2] * 0.91),
      ],
      uvScale: [8, 8],
      bumpStrength: round4(bumpScale || 0.006),
    };
  }

  if (
    hint.includes('stone') ||
    hint.includes('marble') ||
    hint.includes('granite') ||
    hint.includes('hearth') ||
    hint.includes('sill') ||
    hint.includes('worktop')
  ) {
    return {
      kind: 'natural_stone',
      primaryColor: primaryBase,
      secondaryColor: secondaryBase ?? [
        round4(primaryBase[0] * 0.9),
        round4(primaryBase[1] * 0.89),
        round4(primaryBase[2] * 0.87),
      ],
      uvScale: [4, 4],
      bumpStrength: round4(bumpScale || 0.008),
    };
  }

  if (mapTex || bumpTex || roughness >= 0.75) {
    const kind: UsdProceduralPatternKind =
      palette.length >= 2 && secondaryBase ? 'plaster_wall' : 'solid';
    return {
      kind,
      primaryColor: primaryBase,
      secondaryColor:
        kind === 'plaster_wall'
          ? (secondaryBase ?? [
              round4(primaryBase[0] * 0.95),
              round4(primaryBase[1] * 0.95),
              round4(primaryBase[2] * 0.94),
            ])
          : undefined,
      uvScale: kind === 'plaster_wall' ? [4, 4] : undefined,
      bumpStrength: kind === 'plaster_wall' ? round4(bumpScale || 0.004) : undefined,
    };
  }

  return {
    kind: 'solid',
    primaryColor: primaryBase,
  };
}

/**
 * Converts a Three.js `Material` into a declarative `UsdPreviewSurfaceData` specification
 * with both `UsdPreviewSurface` properties and a procedural MaterialX (`UsdMtlx`) pattern spec.
 */
export function convertThreeMaterialToUsdSpec(
  mat: THREE.Material,
  usageHintName = ''
): UsdPreviewSurfaceData {
  const std = mat as THREE.MeshStandardMaterial & {
    clearcoat?: number;
    clearcoatRoughness?: number;
    ior?: number;
  };

  const pattern = classifyProceduralPattern(mat, usageHintName);
  const roughness = typeof std.roughness === 'number' ? round4(std.roughness) : 0.5;
  const metallic = typeof std.metalness === 'number' ? round4(std.metalness) : 0.0;
  const opacity =
    mat.transparent && typeof mat.opacity === 'number' ? round4(mat.opacity) : 1.0;

  let emissiveColor: Vec3Tuple | undefined;
  if (std.emissive instanceof THREE.Color) {
    const emInt = typeof std.emissiveIntensity === 'number' ? std.emissiveIntensity : 1.0;
    const er = round4(std.emissive.r * emInt);
    const eg = round4(std.emissive.g * emInt);
    const eb = round4(std.emissive.b * emInt);
    if (er > 1e-4 || eg > 1e-4 || eb > 1e-4) {
      emissiveColor = [er, eg, eb];
    }
  }

  // Only bind an external image texture if the texture was loaded from a static file URL
  // (e.g. `public/textures/vesper-olive-gold-rug.jpg`); procedural surfaces use MaterialX!
  let diffuseTexture: UsdTextureRef | undefined;
  if (std.map instanceof THREE.Texture && std.map.name.startsWith('__loaded:')) {
    const rawUrl = std.map.name.slice('__loaded:'.length).replace(/^\/+/, '');
    const fileName = rawUrl.split('/').pop() ?? 'texture.jpg';
    diffuseTexture = {
      assetPath: `../textures/${fileName}`,
      wrapS: std.map.wrapS === THREE.RepeatWrapping ? 'repeat' : 'clamp',
      wrapT: std.map.wrapT === THREE.RepeatWrapping ? 'repeat' : 'clamp',
      scale: [round4(std.map.repeat.x || 1), round4(std.map.repeat.y || 1)],
      translation: [round4(std.map.offset.x || 0), round4(std.map.offset.y || 0)],
      sourceColorSpace: 'sRGB',
    };
  }

  return {
    diffuseColor: pattern.primaryColor,
    emissiveColor,
    roughness,
    metallic,
    opacity,
    ior: opacity < 0.95 ? 1.52 : typeof std.ior === 'number' ? round4(std.ior) : undefined,
    clearcoat: typeof std.clearcoat === 'number' ? round4(std.clearcoat) : undefined,
    clearcoatRoughness:
      typeof std.clearcoatRoughness === 'number'
        ? round4(std.clearcoatRoughness)
        : undefined,
    doubleSided: mat.side === THREE.DoubleSide,
    diffuseTexture,
    proceduralPattern: pattern,
  };
}
