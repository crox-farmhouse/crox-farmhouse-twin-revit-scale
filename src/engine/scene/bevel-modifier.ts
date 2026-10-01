import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { PropertySceneLayers } from './scene-content.ts';

const bevelGeometryCache = new Map<string, RoundedBoxGeometry>();

function qMm(value: number): number {
  return Math.round(value * 2000) / 2000;
}

function getCachedChamferBoxGeometry(
  width: number,
  height: number,
  depth: number,
  radius: number
): RoundedBoxGeometry {
  const qw = qMm(width);
  const qh = qMm(height);
  const qd = qMm(depth);
  const qr = qMm(radius);
  const key = `${qw}:${qh}:${qd}:${qr}`;
  let geo = bevelGeometryCache.get(key);
  if (!geo) {
    // segments = 1 creates a 1-segment smoothed-normal chamfer (108 tris vs 200+ for multi-segment),
    // giving smooth specular edge highlights at a fraction of the vertex count.
    geo = new RoundedBoxGeometry(qw, qh, qd, 1, qr);
    geo.computeBoundingSphere();
    geo.computeBoundingBox();
    bevelGeometryCache.set(key, geo);
  }
  return geo;
}

const JOINERY_OR_FURNITURE_NAME_RE =
  /island|cabinet|drawer|door|table|desk|bench|sofa|chair|ottoman|bed|wardrobe|dresser|sideboard|bookcase|shelf|shelves|mantel|hearth|beam|bressummer|joist|rafter|newel|handrail|balustrade|tread|aga|fridge|oven|washer|dryer|sink|vanity|bath|radiator|tv|speaker|subwoofer|console|clock|frame|art|mirror|plinth|worktop|counter/i;

const STRUCTURAL_WALL_NAME_RE =
  /wall|pier|header|lintel|sill|spandrel|gable|chimneyBreast|parapet|partition|lining|plaster|slab|floor|terrace|step|roof|ceilingSheet/i;

/**
 * Applies a selective 1-segment smoothed chamfer (`RoundedBoxGeometry` with `segments = 1`)
 * to furniture, cabinetry, worktops, tables, timber beams, fireplace mantels, and doors,
 * while preserving seamless flat structural plaster walls, floor slabs, and sub-centimeter props.
 */
export function applySelectiveBevelModifier(layers: PropertySceneLayers): void {
  const { scene, cutawayWallGroups } = layers;
  const cutawayRoots = new Set<THREE.Object3D>([
    cutawayWallGroups.southWest,
    cutawayWallGroups.west,
    cutawayWallGroups.north,
    cutawayWallGroups.east,
  ]);

  scene.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    if (obj.geometry.type !== 'BoxGeometry') return;
    if (Array.isArray(obj.material)) return;
    if (obj.userData?.isAnnotationGroup) return;

    // Skip invisible hitboxes or transparent glow/glass volumes
    const mat = obj.material as THREE.MeshStandardMaterial | THREE.MeshBasicMaterial;
    if (!mat || !mat.visible || mat.transparent) return;

    // Only bevel meshes with near-uniform scale so bevels are never stretched
    if (
      Math.abs(obj.scale.x - 1) > 0.05 ||
      Math.abs(obj.scale.y - 1) > 0.05 ||
      Math.abs(obj.scale.z - 1) > 0.05
    ) {
      return;
    }

    const params = (obj.geometry as THREE.BoxGeometry).parameters;
    if (!params) return;
    const w = params.width ?? 1;
    const h = params.height ?? 1;
    const d = params.depth ?? 1;

    // Never overwrite BoxGeometries whose vertices were sheared, tapered, or translated in-place!
    if (obj.geometry.userData?.isSheared) {
      return;
    }
    const posAttr = obj.geometry.getAttribute('position');
    if (posAttr && posAttr.count === 24) {
      const hw = w * 0.5;
      const hh = h * 0.5;
      const hd = d * 0.5;
      for (let i = 0; i < 24; i++) {
        if (
          Math.abs(Math.abs(posAttr.getX(i)) - hw) > 1e-3 ||
          Math.abs(Math.abs(posAttr.getY(i)) - hh) > 1e-3 ||
          Math.abs(Math.abs(posAttr.getZ(i)) - hd) > 1e-3
        ) {
          return;
        }
      }
    }

    const dims = [w, h, d].sort((a, b) => a - b);
    const minDim = dims[0];
    const midDim = dims[1];
    const maxDim = dims[2];

    // 1. Skip tiny details (< 1.8cm thick or < 12cm long: muntins, tiles, book pages, switch rockers, hinges)
    //    to avoid sub-pixel sliver triangles and GPU quad overdraw.
    if (minDim < 0.018 || maxDim < 0.12 || maxDim > 6.5) {
      return;
    }

    // 2. Skip wide room floor slabs, ceiling plasterboards, and terrace slabs
    if (midDim >= 1.6 && minDim <= 0.45) {
      return;
    }

    // Inspect ancestor hierarchy for semantic context
    let inCutawayWall = false;
    let hasFurnitureOrJoineryTag = false;
    let hasExplicitWallName = false;
    let cur: THREE.Object3D | null = obj;
    while (cur && cur !== scene) {
      if (cutawayRoots.has(cur) || cur.userData?.cutawayWall || cur.userData?.isCutawayWall) {
        inCutawayWall = true;
      }
      if (
        cur.userData?.interactableId ||
        cur.userData?.isBifoldDoor ||
        cur.userData?.isCarGate ||
        (typeof cur.name === 'string' &&
          cur.name.length > 0 &&
          JOINERY_OR_FURNITURE_NAME_RE.test(cur.name))
      ) {
        hasFurnitureOrJoineryTag = true;
      }
      if (
        typeof cur.name === 'string' &&
        cur.name.length > 0 &&
        STRUCTURAL_WALL_NAME_RE.test(cur.name) &&
        !JOINERY_OR_FURNITURE_NAME_RE.test(cur.name)
      ) {
        hasExplicitWallName = true;
      }
      cur = cur.parent;
    }

    if (hasExplicitWallName) {
      return;
    }

    // 3. Skip structural plaster / brick wall segments (piers, lintels, sills, partitions)
    //    so abutting wall boxes never show V-groove seams in flat walls.
    const minHoriz = Math.min(w, d);
    const maxHoriz = Math.max(w, d);
    const isWallThickness = minHoriz >= 0.075 && minHoriz <= 0.36;
    const isMatteWallPlasterOrBrick =
      'roughness' in mat &&
      typeof mat.roughness === 'number' &&
      mat.roughness >= 0.82 &&
      (mat.metalness ?? 0) <= 0.05;

    if (!hasFurnitureOrJoineryTag) {
      // Bare box in a cutaway wall group (window header, wall pier, sill)
      if (inCutawayWall && isWallThickness) {
        return;
      }
      // Full-height or spandrel structural wall segment
      if (isWallThickness && h >= 0.38 && maxHoriz >= 0.28 && isMatteWallPlasterOrBrick) {
        return;
      }
      // Unmarked tall wall pier or partition panel
      if (isWallThickness && h >= 1.85 && maxHoriz >= 0.22) {
        return;
      }
    }

    // Compute realistic architectural bevel radius:
    // - Countertops / worktops / table tops / mantels (thin slabs 2.2cm..8cm): crisp 3.5mm arris
    // - Cabinet doors / drawer fronts / interior doors (1.8cm..4.5cm): 3mm micro-bevel
    // - Timber beams / table legs / islands / furniture carcasses (>= 4.5cm): 4.5mm–6mm softened edge
    const radius =
      minDim <= 0.045
        ? Math.min(0.0035, minDim * 0.12)
        : Math.min(0.0055, minDim * 0.075);

    obj.geometry = getCachedChamferBoxGeometry(w, h, d, radius);
  });
}
