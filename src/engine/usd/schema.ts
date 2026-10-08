import type * as THREE from 'three';
import type { Vec3Tuple } from '../../core/types/scene.ts';

export type UsdSpecifier = 'def' | 'over' | 'class';

export type UsdPrimTypeName =
  | 'Xform'
  | 'Scope'
  | 'Mesh'
  | 'Cube'
  | 'Cylinder'
  | 'Sphere'
  | 'Cone'
  | 'Capsule'
  | 'BasisCurves'
  | 'GeomSubset'
  | 'Material'
  | 'Shader'
  | 'NodeGraph'
  | 'SphereLight'
  | 'DiskLight'
  | 'RectLight'
  | 'DistantLight'
  | 'DomeLight'
  | 'Camera'
  | '';

export type UsdKind = 'assembly' | 'component' | 'group' | 'subcomponent';

export type UsdPurpose = 'default' | 'render' | 'proxy' | 'guide';

export type UsdVisibility = 'inherited' | 'invisible';

export interface UsdPrimMetadata {
  readonly doc?: string;
  readonly kind?: UsdKind;
  readonly instanceable?: boolean;
  readonly references?: readonly string[];
  readonly payload?: string;
  readonly variants?: Readonly<Record<string, string>>;
  readonly variantSetNames?: readonly string[];
  readonly customData?: Readonly<Record<string, string | number | boolean>>;
}

export interface UsdXformOps {
  readonly translate?: Vec3Tuple;
  readonly rotateXYZDeg?: Vec3Tuple;
  readonly scale?: Vec3Tuple;
}

export interface UsdGeomSubsetData {
  readonly name: string;
  readonly faceIndices: readonly number[];
  readonly materialBindingPath: string;
}

export interface UsdMeshData {
  readonly points: readonly Vec3Tuple[];
  readonly faceVertexCounts: readonly number[];
  readonly faceVertexIndices: readonly number[];
  readonly normals?: readonly Vec3Tuple[];
  readonly normalsInterpolation?: 'vertex' | 'faceVarying' | 'uniform';
  readonly uvs?: readonly [number, number][];
  readonly uvsInterpolation?: 'vertex' | 'faceVarying';
  readonly doubleSided?: boolean;
  readonly extent?: readonly [Vec3Tuple, Vec3Tuple];
  readonly subsets?: readonly UsdGeomSubsetData[];
}

export interface UsdCubeData {
  readonly size: number;
  readonly doubleSided?: boolean;
  readonly extent?: readonly [Vec3Tuple, Vec3Tuple];
}

export interface UsdCylinderData {
  readonly radius: number;
  readonly height: number;
  readonly axis?: 'X' | 'Y' | 'Z';
  readonly doubleSided?: boolean;
  readonly extent?: readonly [Vec3Tuple, Vec3Tuple];
}

export interface UsdSphereData {
  readonly radius: number;
  readonly doubleSided?: boolean;
  readonly extent?: readonly [Vec3Tuple, Vec3Tuple];
}

export interface UsdConeData {
  readonly radius: number;
  readonly height: number;
  readonly axis?: 'X' | 'Y' | 'Z';
  readonly doubleSided?: boolean;
  readonly extent?: readonly [Vec3Tuple, Vec3Tuple];
}

export interface UsdBasisCurvesData {
  readonly type: 'linear' | 'cubic';
  readonly basis?: 'bezier' | 'bspline' | 'catmullRom';
  readonly wrap?: 'nonperiodic' | 'periodic';
  readonly curveVertexCounts: readonly number[];
  readonly points: readonly Vec3Tuple[];
  readonly widths: readonly number[];
  readonly widthsInterpolation?: 'constant' | 'uniform' | 'vertex';
  readonly extent?: readonly [Vec3Tuple, Vec3Tuple];
}

export type UsdProceduralPatternKind =
  | 'solid'
  | 'brick_bond'
  | 'herringbone_brick'
  | 'checker_tile'
  | 'wood_grain'
  | 'natural_stone'
  | 'slate_tile'
  | 'cobblestone'
  | 'plaster_wall'
  | 'woven_fabric'
  | 'patterned_rug'
  | 'brushed_metal'
  | 'architectural_glass'
  | 'emissive_display';

export interface UsdProceduralPatternSpec {
  readonly kind: UsdProceduralPatternKind;
  readonly primaryColor: Vec3Tuple;
  readonly secondaryColor?: Vec3Tuple;
  readonly accentColor?: Vec3Tuple;
  readonly uvScale?: readonly [number, number];
  readonly mortarWidth?: number;
  readonly bumpStrength?: number;
  readonly noiseScale?: number;
}

export interface UsdTextureRef {
  /** Relative asset path from the material layer (e.g. `../textures/vesper-olive-gold-rug.jpg`) */
  readonly assetPath: string;
  readonly wrapS: 'repeat' | 'clamp' | 'mirror';
  readonly wrapT: 'repeat' | 'clamp' | 'mirror';
  readonly scale: readonly [number, number];
  readonly translation: readonly [number, number];
  readonly sourceColorSpace: 'sRGB' | 'raw';
}

export interface UsdPreviewSurfaceData {
  readonly diffuseColor: Vec3Tuple;
  readonly emissiveColor?: Vec3Tuple;
  readonly roughness: number;
  readonly metallic: number;
  readonly opacity: number;
  readonly ior?: number;
  readonly clearcoat?: number;
  readonly clearcoatRoughness?: number;
  readonly doubleSided?: boolean;
  readonly diffuseTexture?: UsdTextureRef;
  readonly bumpTexture?: UsdTextureRef;
  readonly bumpScale?: number;
  readonly roughnessTexture?: UsdTextureRef;
  /** Declarative procedural pattern used to emit MaterialX (`UsdMtlx`) & Blender EEVEE procedural shader graphs */
  readonly proceduralPattern?: UsdProceduralPatternSpec;
}

export interface UsdLuxLightData {
  readonly color: Vec3Tuple;
  readonly intensity: number;
  readonly exposure?: number;
  readonly radius?: number;
  readonly width?: number;
  readonly height?: number;
  readonly angleDeg?: number;
  readonly shapingConeAngleDeg?: number;
  readonly shapingConeSoftness?: number;
  readonly enableColorTemperature?: boolean;
  readonly colorTemperatureK?: number;
  readonly normalize?: boolean;
  readonly diffuseMultiplier?: number;
  readonly specularMultiplier?: number;
}

export interface UsdCameraData {
  readonly projection: 'perspective' | 'orthographic';
  readonly focalLengthMm: number;
  readonly horizontalApertureMm: number;
  readonly verticalApertureMm: number;
  readonly clippingRangeM: readonly [number, number];
}

export type UsdCustomAttributeValue =
  | { readonly type: 'string'; readonly value: string }
  | { readonly type: 'token'; readonly value: string }
  | { readonly type: 'bool'; readonly value: boolean }
  | { readonly type: 'int'; readonly value: number }
  | { readonly type: 'float'; readonly value: number }
  | { readonly type: 'double'; readonly value: number }
  | { readonly type: 'float2'; readonly value: readonly [number, number] }
  | { readonly type: 'float3'; readonly value: Vec3Tuple }
  | { readonly type: 'double3'; readonly value: Vec3Tuple }
  | { readonly type: 'color3f'; readonly value: Vec3Tuple };

export interface UsdVariantOption {
  readonly customAttributes?: Readonly<Record<string, UsdCustomAttributeValue>>;
  readonly children?: readonly UsdPrim[];
}

export interface UsdPrim {
  readonly specifier: UsdSpecifier;
  readonly typeName: UsdPrimTypeName;
  readonly name: string;
  readonly metadata?: UsdPrimMetadata;
  readonly xform?: UsdXformOps;
  readonly visibility?: UsdVisibility;
  readonly purpose?: UsdPurpose;
  readonly collisionEnabled?: boolean;
  readonly materialBindingPath?: string;
  readonly mesh?: UsdMeshData;
  readonly cube?: UsdCubeData;
  readonly cylinder?: UsdCylinderData;
  readonly sphere?: UsdSphereData;
  readonly cone?: UsdConeData;
  readonly basisCurves?: UsdBasisCurvesData;
  readonly material?: UsdPreviewSurfaceData;
  readonly light?: UsdLuxLightData;
  readonly camera?: UsdCameraData;
  readonly customAttributes?: Readonly<Record<string, UsdCustomAttributeValue>>;
  readonly variantSets?: Readonly<Record<string, Readonly<Record<string, UsdVariantOption>>>>;
  readonly children?: readonly UsdPrim[];
}

export interface UsdStageDocument {
  readonly doc?: string;
  readonly defaultPrim?: string;
  readonly upAxis?: 'Y' | 'Z';
  readonly metersPerUnit?: number;
  readonly subLayers?: readonly string[];
  readonly customLayerData?: Readonly<Record<string, string | number | boolean>>;
  readonly prims: readonly UsdPrim[];
}

export interface UsdZoneLayerSpec {
  readonly zoneId: string;
  readonly label: string;
  readonly floorId: 'ground' | 'first' | 'all';
  readonly wing: 'eastWing' | 'westWing' | 'firstFloor' | 'groundsAndSystems';
  readonly description: string;
}

/**
 * Canonical OpenUSD Zone Layer definitions for Crox Farmhouse.
 * Each zone builds into its own standalone `usd/zones/<zoneId>.usda` layer
 * and is referenced into `/CroxFarmhouse/Zones/<zoneId>` in the root stage.
 */
export const CROX_USD_ZONE_LAYERS: readonly UsdZoneLayerSpec[] = [
  {
    zoneId: 'kitchen',
    label: 'Farmhouse Kitchen & Island',
    floorId: 'ground',
    wing: 'eastWing',
    description: 'East Wing Kitchen shell, Dove Grey cabinetry, AGA range & Hague Blue island',
  },
  {
    zoneId: 'sitting',
    label: 'Vaulted Kitchen Sitting Area',
    floorId: 'ground',
    wing: 'eastWing',
    description: 'East Wing vaulted sitting area, corner sofa, media unit & oak bifold doors',
  },
  {
    zoneId: 'utility',
    label: 'NE Utility & Laundry Room',
    floorId: 'ground',
    wing: 'eastWing',
    description: 'Northeast utility room, stacked washer/dryer, Belfast sink & cabinetry',
  },
  {
    zoneId: 'familyRoom',
    label: 'Dining Room & Snug Alcove',
    floorId: 'ground',
    wing: 'eastWing',
    description: 'Central East Wing oak dining table, brick fireplace, sideboard & snug bay',
  },
  {
    zoneId: 'bootLobby',
    label: 'North Boot Lobby, Store & WC',
    floorId: 'ground',
    wing: 'eastWing',
    description: 'North entrance lobby, bespoke oak boot bench, coat store & cloakroom WC',
  },
  {
    zoneId: 'hall',
    label: 'Central Hall, Staircase & Piano',
    floorId: 'ground',
    wing: 'eastWing',
    description: 'Central spine hall, Roland GP-6 grand piano, quarter-turn oak stairs & glazing',
  },
  {
    zoneId: 'livingRoom',
    label: 'Cinema / Living Room (SW)',
    floorId: 'ground',
    wing: 'westWing',
    description: 'Southwest front room, canted bay window, L-chaise sofa, Persian rug & 83" OLED cinema wall',
  },
  {
    zoneId: 'entranceHall',
    label: 'West Front Entrance Hall',
    floorId: 'ground',
    wing: 'westWing',
    description: 'West main entrance hall, Vitoria chequerboard floor, console table & floor uplights',
  },
  {
    zoneId: 'sittingRoom',
    label: 'North-West Sitting Room',
    floorId: 'ground',
    wing: 'westWing',
    description: 'Northwest sitting room, canted bay window, wood-burning stove fireplace & sofas',
  },
  {
    zoneId: 'study',
    label: 'North-East Study / Office',
    floorId: 'ground',
    wing: 'westWing',
    description: 'Ground floor study, dual-monitor standing desk, bookshelves & filing cabinetry',
  },
  {
    zoneId: 'plantRoom',
    label: 'Boiler, UFH & KNX Plant Room',
    floorId: 'ground',
    wing: 'westWing',
    description: 'MEP plant room, dual Vaillant boilers, unvented cylinder, UFH manifold & KNX racks',
  },
  {
    zoneId: 'mainBedroom',
    label: 'Bedroom 1 (Master Suite)',
    floorId: 'first',
    wing: 'firstFloor',
    description: 'First floor East Wing master bedroom, super-king bed, wardrobes & en-suite',
  },
  {
    zoneId: 'familyBathroom',
    label: 'Family Bathroom',
    floorId: 'first',
    wing: 'firstFloor',
    description: 'First floor family bathroom, freestanding bath, walk-in shower & vanity',
  },
  {
    zoneId: 'upperLanding',
    label: 'Upper Galleried Landing & Corridors',
    floorId: 'first',
    wing: 'firstFloor',
    description: 'First floor galleried landing, balustrade, linen cupboard & West Wing corridor',
  },
  {
    zoneId: 'bedroom2',
    label: 'Bedroom 2 (SW Double)',
    floorId: 'first',
    wing: 'firstFloor',
    description: 'First floor Southwest double bedroom above the Living Room',
  },
  {
    zoneId: 'bedroom3',
    label: 'Bedroom 3 (NW Double)',
    floorId: 'first',
    wing: 'firstFloor',
    description: 'First floor Northwest double bedroom above the Sitting Room',
  },
  {
    zoneId: 'bedroom4',
    label: 'Bedroom 4 (NE Guest / Nursery)',
    floorId: 'first',
    wing: 'firstFloor',
    description: 'First floor Northeast bedroom above the Study',
  },
  {
    zoneId: 'courtyard',
    label: 'South Cobbled Courtyard, Driveway & Gates',
    floorId: 'ground',
    wing: 'groundsAndSystems',
    description: 'South granite cobbled courtyard, gravel driveway, brick boundary walls & oak gates',
  },
  {
    zoneId: 'roofAndCeilings',
    label: 'Welsh Slate Roofs, Chimneys & Ceilings',
    floorId: 'all',
    wing: 'groundsAndSystems',
    description: 'Ground-floor ceiling slabs, first-floor ceilings, L-plan pitched Welsh slate roof & 5 chimneys',
  },
  {
    zoneId: 'securityAndMep',
    label: 'UniFi Protect Security & Hydronic UFH Overlay',
    floorId: 'all',
    wing: 'groundsAndSystems',
    description: 'UniFi Protect cameras, G2 Reader Pro access readers, FOV cones & underfloor heating loops',
  },
];

/**
 * Converts an arbitrary Three.js object name or label into a valid OpenUSD prim identifier
 * matching `^[A-Za-z_][A-Za-z0-9_]*$`.
 */
export function sanitizeUsdIdent(raw: string, fallback = 'Prim'): string {
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  const cleaned = trimmed
    .replace(/[^A-Za-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!cleaned) return fallback;
  if (/^[0-9]/.test(cleaned)) {
    return `_${cleaned}`;
  }
  return cleaned;
}

/**
 * Resolves the canonical OpenUSD prim path for a Three.js object.
 * If `userData.usdPrimPath` was stamped during scene build or export, returns it directly;
 * otherwise derives a deterministic path from its room zone and object name.
 */
export function resolveUsdPrimPathForObject(
  obj: THREE.Object3D,
  fallbackZoneId = 'exterior'
): string {
  const existing = obj.userData?.usdPrimPath;
  if (typeof existing === 'string' && existing.startsWith('/')) {
    return existing;
  }
  const zoneId = sanitizeUsdIdent(
    typeof obj.userData?.zoneId === 'string'
      ? obj.userData.zoneId
      : typeof obj.userData?.zone === 'string'
        ? obj.userData.zone
        : fallbackZoneId,
    'exterior'
  );
  const rawName = obj.name || `${obj.type}_${obj.id}`;
  const dotPrefix = `${zoneId}.`;
  const shortName = rawName.startsWith(dotPrefix)
    ? rawName.slice(dotPrefix.length)
    : rawName;
  const ident = sanitizeUsdIdent(shortName, sanitizeUsdIdent(obj.type));
  return `/CroxFarmhouse/Zones/${zoneId}/${ident}`;
}
