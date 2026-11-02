import * as THREE from 'three';
import {
  addCasedArchitravePortal,
  buildAngledWallSegment,
  buildMitredWallSkirtingGeometry,
  buildPolygonalFloorSlab,
} from '../../../../engine/geometry/index.ts';
import {
  SANDBERG_MIMI_SANDSTONE_REPEAT_V,
  SANDBERG_MIMI_SANDSTONE_REPEAT_U,
  PARISIAN_MANOIR_REPEAT_SPAN_M,
  createFelliniOlivaSquareTileTextures,
  createParisianManoirCabochonTextures,
  createParisianManoirUpstandTextures,
} from '../../../../engine/textures/stone-and-tile-textures.ts';
import { transformEastWingTuple } from '../../structure/ground-floor-materials.ts';
import {
  buildArmstrongConcealedShowerSet,
  buildArmstrongPaperHolder,
  buildArmstrongRobeHook,
  buildLefroyBrooksCharterhouseWc,
  buildLefroyBrooksLissaDoonWashstand,
  getBathroomBrassMaterials,
  wallFacingToRotY,
} from '../../../../objects/sanitaryware/index.ts';
import type { SceneBuilderContext } from '../../../../engine/viewer/scene-types.ts';
import type { createFirstFloorMaterials } from '../../structure/first-floor-materials.ts';
import type { createFirstFloorShellKit } from '../../structure/first-floor-shell-kit.ts';

function ensureNamedAddedChildren(
  parent: THREE.Object3D,
  startIdx: number,
  prefix: string,
  tagSmallDetails = false
): void {
  let meshCount = 0;
  let groupCount = 0;
  for (let i = startIdx; i < parent.children.length; i++) {
    const child = parent.children[i]!;
    child.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        if (!node.name) {
          meshCount += 1;
          node.name = `${prefix}.mesh_${meshCount}`;
        }
        const geo = node.geometry as THREE.BufferGeometry | undefined;
        if (geo && !geo.boundingSphere) {
          geo.computeBoundingSphere();
        }
        if (
          tagSmallDetails &&
          !node.userData?.isArchitecturalShell &&
          !node.userData?.isCutawayWall &&
          geo?.boundingSphere &&
          geo.boundingSphere.radius < 0.08
        ) {
          node.userData.lodTier = 'high';
          node.userData.lodMaxDistance = 12;
        }
      } else if (node instanceof THREE.Group && !node.name) {
        groupCount += 1;
        node.name = groupCount === 1 && node === child ? prefix : `${prefix}.group_${groupCount}`;
      }
    });
  }
}

function tagHighLodDetail(mesh: THREE.Mesh): void {
  mesh.userData.lodTier = 'high';
  mesh.userData.lodMaxDistance = 12;
}

const SHOWER_UPSTAND_SPEC = {
  heightM: 0.1,
  thicknessM: 0.012,
  chamferM: 0.0035,
  northWallStart: [-22.19, 1.905] as const,
  northWallEnd: [-18.92, 2.34] as const,
  northWallHalfThicknessM: 0.14,
  ensuiteDoorEastArchitraveU: 1.07,
  eastInnerX: -18.995,
  westInnerX: -22.19,
  corridorDoorNorthArchitraveZ: 2.6,
  corridorDoorSouthArchitraveZ: 3.65,
  southDryWallInnerZ: 3.745,
} as const;

const SHOWER_WETROOM_SPEC = {
  minX: -20.16,
  maxX: -18.285,
  archRightX: -19.3,
  archRevealStartZ: 3.745,
  collarRidgeX: -18.92,
  eastOuterWallX: -18.21,
  northTileBaseZ: 3.887,
  northInnerZ: 3.895,
  southInnerZ: 4.605,
  wallTileThicknessM: 0.008,
  eastTileThicknessM: 0.004,
} as const;

const SHOWER_NICHE_SPEC = {
  centerX: -19.18,
  widthM: 0.38,
  heightM: 0.52,
  depthM: 0.095, // Z = 4.605m -> 4.700m (leaves 55mm solid stud backing before Bedroom 3 Z = 4.755m plaster)
  centerOffsetAboveTrayM: 1.18,
  sillThicknessM: 0.02,
  midShelfThicknessM: 0.014,
  trimFaceWidthM: 0.008,
  trimDepthM: 0.01,
} as const;

interface ShowerRoomTileMaterials {
  readonly floorMat: THREE.MeshStandardMaterial;
  readonly upstandMat: THREE.MeshStandardMaterial;
  readonly wetroomWallMat: THREE.MeshStandardMaterial;
}

function createShowerRoomTileMaterials(): ShowerRoomTileMaterials {
  const parisianFloorTex = createParisianManoirCabochonTextures();
  const floorMat = new THREE.MeshStandardMaterial({
    map: parisianFloorTex.colorMap,
    normalMap: parisianFloorTex.normalMap,
    normalScale: new THREE.Vector2(0.55, 0.55),
    roughnessMap: parisianFloorTex.roughnessMap,
    roughness: 1.0,
    metalness: 0.02,
  });

  const parisianUpstandTex = createParisianManoirUpstandTextures();
  const upstandMat = new THREE.MeshStandardMaterial({
    map: parisianUpstandTex.colorMap,
    normalMap: parisianUpstandTex.normalMap,
    normalScale: new THREE.Vector2(0.5, 0.5),
    roughnessMap: parisianUpstandTex.roughnessMap,
    roughness: 1.0,
    metalness: 0.02,
  });

  const felliniOlivaTex = createFelliniOlivaSquareTileTextures();
  const wetroomWallMat = new THREE.MeshStandardMaterial({
    map: felliniOlivaTex.colorMap,
    normalMap: felliniOlivaTex.normalMap,
    normalScale: new THREE.Vector2(0.72, 0.72),
    roughnessMap: felliniOlivaTex.roughnessMap,
    roughness: 1.0,
    metalness: 0.04,
  });

  return { floorMat, upstandMat, wetroomWallMat };
}

/**
 * Sweeps a `100mm`-high (`0.10m`), `12mm`-thick (`0.012m`) chamfered-top marble tiled upstand
 * along a clockwise room-perimeter polyline `path` (`(-dz, dx)` points into `showerRoom`),
 * with 45° mitred corners and world-calibrated `1.218m` (`3 × 406mm`) horizontal UVs.
 */
function buildChamferedMarbleUpstandGeometry(
  path: ReadonlyArray<readonly [number, number]>,
  floorY: number
): THREE.BufferGeometry {
  const { heightM, thicknessM, chamferM } = SHOWER_UPSTAND_SPEC;
  const ring: ReadonlyArray<readonly [number, number, number]> = [
    [0, 0, 0],
    [0, thicknessM, 0],
    [heightM - chamferM, thicknessM, (heightM - chamferM) / heightM],
    [heightM, thicknessM - chamferM, 1],
    [heightM, 0, 1],
  ];

  const segs: Array<{ p0: THREE.Vector2; t: THREE.Vector2; n: THREE.Vector2; len: number; cumU: number }> = [];
  let runningLen = 0;
  for (let i = 0; i + 1 < path.length; i++) {
    const [x0, z0] = path[i]!;
    const [x1, z1] = path[i + 1]!;
    const dx = x1 - x0;
    const dz = z1 - z0;
    const len = Math.hypot(dx, dz) || 1e-6;
    const tx = dx / len;
    const tz = dz / len;
    segs.push({
      p0: new THREE.Vector2(x0, z0),
      t: new THREE.Vector2(tx, tz),
      n: new THREE.Vector2(-tz, tx),
      len,
      cumU: runningLen,
    });
    runningLen += len;
  }

  const positions: number[] = [];
  const uvs: number[] = [];

  const emitVertex = (
    seg: { p0: THREE.Vector2; t: THREE.Vector2; n: THREE.Vector2; len: number; cumU: number },
    sEnd: 0 | 1,
    d: number,
    h: number,
    vCoord: number,
    startK: number,
    endK: number
  ): void => {
    const along = sEnd === 0 ? h * startK : seg.len + h * endK;
    const wx = seg.p0.x + seg.t.x * along + seg.n.x * h;
    const wz = seg.p0.y + seg.t.y * along + seg.n.y * h;
    positions.push(wx, floorY + d, wz);
    uvs.push((seg.cumU + along) / PARISIAN_MANOIR_REPEAT_SPAN_M, vCoord);
  };

  segs.forEach((seg, idx) => {
    const prev = idx > 0 ? segs[idx - 1] : undefined;
    const next = idx + 1 < segs.length ? segs[idx + 1] : undefined;
    const startK = prev ? -seg.n.dot(prev.t) / (1 + seg.t.dot(prev.t)) : 0;
    const endK = next ? -seg.n.dot(next.t) / (1 + seg.t.dot(next.t)) : 0;

    for (let e = 0; e < ring.length; e++) {
      const [d0, h0, v0] = ring[e]!;
      const [d1, h1, v1] = ring[(e + 1) % ring.length]!;
      emitVertex(seg, 0, d0, h0, v0, startK, endK);
      emitVertex(seg, 1, d0, h0, v0, startK, endK);
      emitVertex(seg, 1, d1, h1, v1, startK, endK);

      emitVertex(seg, 0, d0, h0, v0, startK, endK);
      emitVertex(seg, 1, d1, h1, v1, startK, endK);
      emitVertex(seg, 0, d1, h1, v1, startK, endK);
    }

    if (!prev) {
      for (let c = 1; c + 1 < ring.length; c++) {
        const [d0, h0, v0] = ring[0]!;
        const [d1, h1, v1] = ring[c + 1]!;
        const [d2, h2, v2] = ring[c]!;
        emitVertex(seg, 0, d0, h0, v0, startK, endK);
        emitVertex(seg, 0, d1, h1, v1, startK, endK);
        emitVertex(seg, 0, d2, h2, v2, startK, endK);
      }
    }
    if (!next) {
      for (let c = 1; c + 1 < ring.length; c++) {
        const [d0, h0, v0] = ring[0]!;
        const [d1, h1, v1] = ring[c]!;
        const [d2, h2, v2] = ring[c + 1]!;
        emitVertex(seg, 1, d0, h0, v0, startK, endK);
        emitVertex(seg, 1, d1, h1, v1, startK, endK);
        emitVertex(seg, 1, d2, h2, v2, startK, endK);
      }
    }
  });

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  geo.computeBoundingSphere();
  return geo;
}

/**
 * Builds the continuous `100mm`-high chamfered `Parisian Manoir` marble tiled upstand around all
 * dry perimeter walls of `showerRoom` and across the front step-up riser of the arched shower tray.
 */
function buildShowerRoomMarbleUpstands(
  scene: THREE.Group,
  showerFloorY: number,
  upstandMat: THREE.Material
): void {
  const [nwX0, nwZ0] = SHOWER_UPSTAND_SPEC.northWallStart;
  const [nwX1, nwZ1] = SHOWER_UPSTAND_SPEC.northWallEnd;
  const nwDx = nwX1 - nwX0;
  const nwDz = nwZ1 - nwZ0;
  const nwLen = Math.hypot(nwDx, nwDz);
  const nwTx = nwDx / nwLen;
  const nwTz = nwDz / nwLen;
  const nwNx = -nwTz;
  const nwNz = nwTx;
  const halfT = SHOWER_UPSTAND_SPEC.northWallHalfThicknessM;

  const northInnerPoint = (u: number): readonly [number, number] => [
    nwX0 + nwTx * u + nwNx * halfT,
    nwZ0 + nwTz * u + nwNz * halfT,
  ];
  const uNorthEastCorner = (SHOWER_UPSTAND_SPEC.eastInnerX - (nwX0 + nwNx * halfT)) / nwTx;
  const uNorthWestCorner = (SHOWER_UPSTAND_SPEC.westInnerX - (nwX0 + nwNx * halfT)) / nwTx;
  const [, zNorthWestCorner] = northInnerPoint(uNorthWestCorner);

  const runs: ReadonlyArray<readonly [string, ReadonlyArray<readonly [number, number]>]> = [
    [
      'showerRoom.tiledUpstand.northAndEast',
      [
        northInnerPoint(SHOWER_UPSTAND_SPEC.ensuiteDoorEastArchitraveU),
        northInnerPoint(uNorthEastCorner),
        [SHOWER_UPSTAND_SPEC.eastInnerX, SHOWER_UPSTAND_SPEC.corridorDoorNorthArchitraveZ],
      ],
    ],
    [
      'showerRoom.tiledUpstand.southTrayAndWest',
      [
        [SHOWER_UPSTAND_SPEC.eastInnerX, SHOWER_UPSTAND_SPEC.corridorDoorSouthArchitraveZ],
        [SHOWER_UPSTAND_SPEC.eastInnerX, SHOWER_UPSTAND_SPEC.southDryWallInnerZ],
        [SHOWER_UPSTAND_SPEC.westInnerX, SHOWER_UPSTAND_SPEC.southDryWallInnerZ],
        [SHOWER_UPSTAND_SPEC.westInnerX, zNorthWestCorner],
      ],
    ],
  ];

  for (const [upstandName, path] of runs) {
    const upstandGeo = buildChamferedMarbleUpstandGeometry(path, showerFloorY);
    const upstandMesh = new THREE.Mesh(upstandGeo, upstandMat);
    upstandMesh.name = upstandName;
    upstandMesh.userData.isArchitecturalShell = true;
    upstandMesh.castShadow = true;
    upstandMesh.receiveShadow = true;
    scene.add(upstandMesh);
  }
}

/**
 * Normalizes UVs of an extruded wall tile geometry to exact `1.00m × 1.00m` world-space meters
 * anchored to `yDatum` so `125 × 125mm` (`8 × 8` per meter) `Fellini Oliva` grout joints align
 * seamlessly across all corners of the wetroom enclosure.
 */
function applyWorldMeterTileUvs(
  geo: THREE.BufferGeometry,
  uAxis: 'x' | 'z',
  uOrigin: number,
  uSign: 1 | -1,
  yDatum: number
): THREE.BufferGeometry {
  const pos = geo.getAttribute('position');
  const uv = geo.getAttribute('uv');
  if (pos && uv) {
    for (let i = 0; i < pos.count; i++) {
      const horiz = uAxis === 'x' ? pos.getX(i) : pos.getZ(i);
      const u = (horiz - uOrigin) * uSign;
      const v = pos.getY(i) - yDatum;
      uv.setXY(i, u, v);
    }
    uv.needsUpdate = true;
  }
  geo.computeBoundingSphere();
  return geo;
}

/**
 * Lines the interior walls and arched spandrel of the walk-in shower enclosure with `8mm`
 * Claybrook Studio `Fellini Oliva` glossy hand-glazed square ceramic wall tiles.
 */
function buildShowerWetroomFelliniTiling(
  showerGroup: THREE.Group,
  archSpandrelShape: THREE.Shape,
  dims: {
    readonly archCenterX: number;
    readonly tileBaseY: number;
    readonly trayTopY: number;
    readonly showerCollarY: number;
    readonly corridorCeilingY: number;
  },
  wetroomWallMat: THREE.Material
): void {
  const { archCenterX, tileBaseY, trayTopY, showerCollarY, corridorCeilingY } = dims;
  const {
    minX,
    maxX,
    archRightX,
    collarRidgeX,
    eastOuterWallX,
    northTileBaseZ,
    northInnerZ,
    southInnerZ,
    wallTileThicknessM,
    eastTileThicknessM,
  } = SHOWER_WETROOM_SPEC;

  const stallEastCeilY =
    showerCollarY -
    ((maxX - collarRidgeX) / (eastOuterWallX - collarRidgeX)) * (showerCollarY - corridorCeilingY);
  const stallDepthZ = southInnerZ - northInnerZ;
  const stallMidZ = northInnerZ + stallDepthZ * 0.5;

  const nicheCenterY = trayTopY + SHOWER_NICHE_SPEC.centerOffsetAboveTrayM;
  const nicheHalfW = SHOWER_NICHE_SPEC.widthM * 0.5;
  const nicheHalfH = SHOWER_NICHE_SPEC.heightM * 0.5;
  const nicheMinX = SHOWER_NICHE_SPEC.centerX - nicheHalfW;
  const nicheMaxX = SHOWER_NICHE_SPEC.centerX + nicheHalfW;
  const nicheMinY = nicheCenterY - nicheHalfH;
  const nicheMaxY = nicheCenterY + nicheHalfH;

  const buildVaultedWallTileGeo = (
    leftX: number,
    zTranslate: number,
    cutNicheOpening = false
  ): THREE.ExtrudeGeometry => {
    const shape = new THREE.Shape();
    shape.moveTo(leftX, tileBaseY);
    shape.lineTo(maxX, tileBaseY);
    shape.lineTo(maxX, stallEastCeilY);
    shape.lineTo(collarRidgeX, showerCollarY);
    shape.lineTo(leftX, showerCollarY);
    shape.closePath();
    if (cutNicheOpening) {
      const hole = new THREE.Path();
      hole.moveTo(nicheMinX, nicheMinY);
      hole.lineTo(nicheMinX, nicheMaxY);
      hole.lineTo(nicheMaxX, nicheMaxY);
      hole.lineTo(nicheMaxX, nicheMinY);
      hole.closePath();
      shape.holes.push(hole);
    }
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: wallTileThicknessM,
      bevelEnabled: false,
    });
    geo.translate(0, 0, zTranslate);
    applyWorldMeterTileUvs(geo, 'x', minX, 1, trayTopY);
    return geo;
  };

  const addShellTileMesh = (name: string, geo: THREE.BufferGeometry): void => {
    const mesh = new THREE.Mesh(geo, wetroomWallMat);
    mesh.name = name;
    mesh.userData.isArchitecturalShell = true;
    mesh.receiveShadow = true;
    showerGroup.add(mesh);
  };

  addShellTileMesh(
    'showerRoom.wetroomTiling.southWall',
    buildVaultedWallTileGeo(minX, southInnerZ, true)
  );
  addShellTileMesh(
    'showerRoom.wetroomTiling.northWall',
    buildVaultedWallTileGeo(archRightX, northTileBaseZ, false)
  );

  const archInnerTileGeo = new THREE.ExtrudeGeometry(archSpandrelShape, {
    depth: wallTileThicknessM,
    bevelEnabled: false,
    curveSegments: 64,
  });
  archInnerTileGeo.translate(archCenterX, 0, northTileBaseZ);
  applyWorldMeterTileUvs(archInnerTileGeo, 'x', minX, 1, trayTopY);
  addShellTileMesh('showerRoom.wetroomTiling.archInnerSpandrel', archInnerTileGeo);

  const westTileH = showerCollarY - tileBaseY;
  const westTileGeo = new THREE.BoxGeometry(wallTileThicknessM, westTileH, stallDepthZ);
  westTileGeo.translate(minX - wallTileThicknessM * 0.5, tileBaseY + westTileH * 0.5, stallMidZ);
  applyWorldMeterTileUvs(westTileGeo, 'z', northInnerZ, 1, trayTopY);
  addShellTileMesh('showerRoom.wetroomTiling.westWall', westTileGeo);

  const eastTileH = stallEastCeilY - tileBaseY;
  const eastTileGeo = new THREE.BoxGeometry(eastTileThicknessM, eastTileH, stallDepthZ);
  eastTileGeo.translate(maxX - eastTileThicknessM * 0.5, tileBaseY + eastTileH * 0.5, stallMidZ);
  applyWorldMeterTileUvs(eastTileGeo, 'z', southInnerZ, -1, trayTopY);
  addShellTileMesh('showerRoom.wetroomTiling.eastWall', eastTileGeo);
}

/**
 * Lines the entire 150mm-deep inner reveal of the 860mm step-up shower archway (Z = 3.745m .. 3.895m)
 * — both vertical inner jambs (X = -20.16m & X = -19.30m) AND the curved semicircular soffit/intrados —
 * in Claybrook Fellini Oliva 125x125mm glossy celadon-sage tiles with a PF Pewter outer arris trim.
 */
function buildShowerArchwayInnerRevealTiling(
  showerGroup: THREE.Group,
  dims: {
    readonly archLeftX: number;
    readonly archRightX: number;
    readonly archCenterX: number;
    readonly archRadius: number;
    readonly archSpringY: number;
    readonly tileBaseY: number;
    readonly trayTopY: number;
  },
  wetroomWallMat: THREE.Material,
  pfTrimMat: THREE.Material
): void {
  const {
    archLeftX,
    archRightX,
    archCenterX,
    archRadius,
    archSpringY,
    tileBaseY,
    trayTopY,
  } = dims;
  const revealZ0 = SHOWER_WETROOM_SPEC.archRevealStartZ; // 3.745m
  const revealZ1 = SHOWER_WETROOM_SPEC.northInnerZ;      // 3.895m
  const revealDepthZ = revealZ1 - revealZ0;              // 0.150m
  const revealMidZ = (revealZ0 + revealZ1) * 0.5;
  const tileT = SHOWER_WETROOM_SPEC.wallTileThicknessM;  // 0.008m
  const jambH = archSpringY - tileBaseY;

  // Left vertical inner jamb (clear face at X = archLeftX = -20.160m, facing East +X; backed by wall at -20.168m)
  const leftJambGeo = new THREE.BoxGeometry(tileT, jambH, revealDepthZ);
  leftJambGeo.translate(archLeftX - tileT * 0.5, tileBaseY + jambH * 0.5, revealMidZ);
  applyWorldMeterTileUvs(leftJambGeo, 'z', revealZ0, 1, trayTopY);
  const leftJambMesh = new THREE.Mesh(leftJambGeo, wetroomWallMat);
  leftJambMesh.name = 'showerRoom.wetroomTiling.archLeftJamb';
  leftJambMesh.userData.isArchitecturalShell = true;
  leftJambMesh.receiveShadow = true;
  showerGroup.add(leftJambMesh);

  // Right vertical inner jamb (clear face at X = archRightX = -19.300m, facing West -X; backed by wall at -19.292m)
  const rightJambGeo = new THREE.BoxGeometry(tileT, jambH, revealDepthZ);
  rightJambGeo.translate(archRightX + tileT * 0.5, tileBaseY + jambH * 0.5, revealMidZ);
  applyWorldMeterTileUvs(rightJambGeo, 'z', revealZ0, 1, trayTopY);
  const rightJambMesh = new THREE.Mesh(rightJambGeo, wetroomWallMat);
  rightJambMesh.name = 'showerRoom.wetroomTiling.archRightJamb';
  rightJambMesh.userData.isArchitecturalShell = true;
  rightJambMesh.receiveShadow = true;
  showerGroup.add(rightJambMesh);

  // Curved semicircular intrados / underside soffit (r_inner = archRadius = 0.430m, r_outer = 0.438m, Z = 3.745..3.895m)
  // Arc-length UV-mapped continuously from the top of the left jamb so 125x125mm grout courses wrap around the arch!
  const segs = 64;
  const rIn = archRadius;
  const rOut = archRadius + tileT;
  const arcBaseV = archSpringY - trayTopY;
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];

  const pushTri = (
    p0: readonly [number, number, number],
    p1: readonly [number, number, number],
    p2: readonly [number, number, number],
    n0: readonly [number, number, number],
    n1: readonly [number, number, number],
    n2: readonly [number, number, number],
    uv0: readonly [number, number],
    uv1: readonly [number, number],
    uv2: readonly [number, number]
  ): void => {
    positions.push(...p0, ...p1, ...p2);
    normals.push(...n0, ...n1, ...n2);
    uvs.push(...uv0, ...uv1, ...uv2);
  };

  for (let i = 0; i < segs; i++) {
    const t0 = i / segs;
    const t1 = (i + 1) / segs;
    const th0 = Math.PI * (1 - t0); // left (PI) -> crown (PI/2) -> right (0)
    const th1 = Math.PI * (1 - t1);
    const c0 = Math.cos(th0);
    const s0 = Math.sin(th0);
    const c1 = Math.cos(th1);
    const s1 = Math.sin(th1);

    const xIn0 = archCenterX + rIn * c0;
    const yIn0 = archSpringY + rIn * s0;
    const xIn1 = archCenterX + rIn * c1;
    const yIn1 = archSpringY + rIn * s1;

    const xOut0 = archCenterX + rOut * c0;
    const yOut0 = archSpringY + rOut * s0;
    const xOut1 = archCenterX + rOut * c1;
    const yOut1 = archSpringY + rOut * s1;

    const v0 = arcBaseV + (Math.PI - th0) * rIn;
    const v1 = arcBaseV + (Math.PI - th1) * rIn;

    // Concave downward/inward intrados face (visible inside archway, smooth radial normals)
    const nIn0: readonly [number, number, number] = [-c0, -s0, 0];
    const nIn1: readonly [number, number, number] = [-c1, -s1, 0];
    pushTri(
      [xIn0, yIn0, revealZ0],
      [xIn1, yIn1, revealZ0],
      [xIn1, yIn1, revealZ1],
      nIn0,
      nIn1,
      nIn1,
      [0, v0],
      [0, v1],
      [revealDepthZ, v1]
    );
    pushTri(
      [xIn0, yIn0, revealZ0],
      [xIn1, yIn1, revealZ1],
      [xIn0, yIn0, revealZ1],
      nIn0,
      nIn1,
      nIn0,
      [0, v0],
      [revealDepthZ, v1],
      [revealDepthZ, v0]
    );

    // Front Z = revealZ0 (normal [0, 0, -1]) 8mm tile edge
    const nFront: readonly [number, number, number] = [0, 0, -1];
    pushTri(
      [xIn0, yIn0, revealZ0],
      [xOut0, yOut0, revealZ0],
      [xOut1, yOut1, revealZ0],
      nFront,
      nFront,
      nFront,
      [0, v0],
      [tileT, v0],
      [tileT, v1]
    );
    pushTri(
      [xIn0, yIn0, revealZ0],
      [xOut1, yOut1, revealZ0],
      [xIn1, yIn1, revealZ0],
      nFront,
      nFront,
      nFront,
      [0, v0],
      [tileT, v1],
      [0, v1]
    );
  }

  const soffitGeo = new THREE.BufferGeometry();
  soffitGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  soffitGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  soffitGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  soffitGeo.computeBoundingSphere();
  const soffitMesh = new THREE.Mesh(soffitGeo, wetroomWallMat);
  soffitMesh.name = 'showerRoom.wetroomTiling.archSoffit';
  soffitMesh.userData.isArchitecturalShell = true;
  soffitMesh.receiveShadow = true;
  showerGroup.add(soffitMesh);

  // Crisp 5mm PF Pewter/Brushed Nickel Schlüter edge trim along the Z = 3.745m outer arch arris
  const trimW = 0.006;
  const trimD = 0.011;
  const trimZ = revealZ0 - 0.004;
  for (const [sideTag, tx] of [
    ['left', archLeftX - trimW * 0.5],
    ['right', archRightX + trimW * 0.5],
  ] as const) {
    const jTrimGeo = new THREE.BoxGeometry(trimW, jambH, trimD);
    jTrimGeo.computeBoundingSphere();
    const jTrim = new THREE.Mesh(jTrimGeo, pfTrimMat);
    jTrim.name = `showerRoom.wetroomTiling.archOuterTrim.${sideTag}`;
    jTrim.position.set(tx, tileBaseY + jambH * 0.5, trimZ + trimD * 0.5);
    showerGroup.add(jTrim);
  }

  const archTrimShape = new THREE.Shape();
  archTrimShape.absarc(0, archSpringY, archRadius + trimW, Math.PI, 0, true);
  archTrimShape.absarc(0, archSpringY, archRadius, 0, Math.PI, false);
  archTrimShape.closePath();
  const archTrimGeo = new THREE.ExtrudeGeometry(archTrimShape, {
    depth: trimD,
    bevelEnabled: false,
    curveSegments: 64,
  });
  archTrimGeo.translate(archCenterX, 0, trimZ);
  archTrimGeo.computeBoundingSphere();
  const archTrimMesh = new THREE.Mesh(archTrimGeo, pfTrimMat);
  archTrimMesh.name = 'showerRoom.wetroomTiling.archOuterTrim.head';
  showerGroup.add(archTrimMesh);
}

/**
 * Builds the true 3D hollow recessed tiled wall niche (380mm W x 520mm H x 95mm D, Z = 4.605m -> 4.700m)
 * on the South wetroom wall, complete with Claybrook Fellini Oliva back/jamb tiles, honed Parisian Manoir
 * marble sill & mid-shelf, 4mm PF Pewter Schlüter-JOLLY mitred edge trim, amber/stoneware bottles,
 * and a concealed warm 2700K IP67 LED strip tucked under the top niche header.
 */
function buildRecessedLitShowerNiche(
  showerGroup: THREE.Group,
  trayTopY: number,
  wetroomWallMat: THREE.Material,
  marbleMat: THREE.Material,
  pfTrimMat: THREE.Material
): void {
  const {
    centerX,
    widthM,
    heightM,
    depthM,
    centerOffsetAboveTrayM,
    sillThicknessM,
    midShelfThicknessM,
    trimFaceWidthM,
    trimDepthM,
  } = SHOWER_NICHE_SPEC;
  const frontZ = SHOWER_WETROOM_SPEC.southInnerZ; // 4.605m
  const backZ = frontZ + depthM;                  // 4.700m
  const tileT = SHOWER_WETROOM_SPEC.wallTileThicknessM; // 0.008m
  const centerY = trayTopY + centerOffsetAboveTrayM;
  const minX = centerX - widthM * 0.5;
  const maxX = centerX + widthM * 0.5;
  const minY = centerY - heightM * 0.5;
  const maxY = centerY + heightM * 0.5;

  const nicheGroup = new THREE.Group();
  nicheGroup.name = 'showerRoom.kerdiBoardShowerNiche';

  // Recessed Fellini Oliva tiled back wall (Z = 4.692m .. 4.700m)
  const backGeo = new THREE.BoxGeometry(widthM, heightM, tileT);
  backGeo.translate(centerX, centerY, backZ - tileT * 0.5);
  applyWorldMeterTileUvs(backGeo, 'x', SHOWER_WETROOM_SPEC.minX, 1, trayTopY);
  const backMesh = new THREE.Mesh(backGeo, wetroomWallMat);
  backMesh.name = 'showerRoom.kerdiBoardShowerNiche.tiledBack';
  backMesh.receiveShadow = true;
  nicheGroup.add(backMesh);

  // Recessed Fellini Oliva tiled left & right inner jambs and top soffit (Z = 4.605m .. 4.692m)
  const innerDepth = depthM - tileT;
  const innerMidZ = frontZ + innerDepth * 0.5;
  const jambClearH = heightM - sillThicknessM - tileT;
  const jambCenterY = minY + sillThicknessM + jambClearH * 0.5;

  for (const [sideTag, jx] of [
    ['leftJamb', minX + tileT * 0.5],
    ['rightJamb', maxX - tileT * 0.5],
  ] as const) {
    const jGeo = new THREE.BoxGeometry(tileT, jambClearH, innerDepth);
    jGeo.translate(jx, jambCenterY, innerMidZ);
    applyWorldMeterTileUvs(jGeo, 'z', frontZ, 1, trayTopY);
    const jMesh = new THREE.Mesh(jGeo, wetroomWallMat);
    jMesh.name = `showerRoom.kerdiBoardShowerNiche.${sideTag}`;
    jMesh.receiveShadow = true;
    nicheGroup.add(jMesh);
  }

  const topSoffitGeo = new THREE.BoxGeometry(widthM, tileT, innerDepth);
  topSoffitGeo.translate(centerX, maxY - tileT * 0.5, innerMidZ);
  applyWorldMeterTileUvs(topSoffitGeo, 'x', SHOWER_WETROOM_SPEC.minX, 1, trayTopY);
  const topSoffitMesh = new THREE.Mesh(topSoffitGeo, wetroomWallMat);
  topSoffitMesh.name = 'showerRoom.kerdiBoardShowerNiche.topSoffit';
  nicheGroup.add(topSoffitMesh);

  // 20mm honed Parisian Manoir cream marble bottom sill (with 6mm proud drip lip) + 14mm mid-shelf
  const sillDepth = innerDepth + 0.006;
  const sillGeo = new THREE.BoxGeometry(widthM + 0.004, sillThicknessM, sillDepth);
  sillGeo.computeBoundingSphere();
  const sillMesh = new THREE.Mesh(sillGeo, marbleMat);
  sillMesh.name = 'showerRoom.kerdiBoardShowerNiche.marbleSill';
  sillMesh.position.set(centerX, minY + sillThicknessM * 0.5, frontZ - 0.006 + sillDepth * 0.5);
  sillMesh.castShadow = true;
  sillMesh.receiveShadow = true;
  nicheGroup.add(sillMesh);

  const midShelfY = minY + heightM * 0.52;
  const midShelfDepth = innerDepth - 0.014;
  const midShelfGeo = new THREE.BoxGeometry(widthM - tileT * 2, midShelfThicknessM, midShelfDepth);
  midShelfGeo.computeBoundingSphere();
  const midShelfMesh = new THREE.Mesh(midShelfGeo, marbleMat);
  midShelfMesh.name = 'showerRoom.kerdiBoardShowerNiche.midShelf';
  midShelfMesh.position.set(centerX, midShelfY, backZ - tileT - midShelfDepth * 0.5);
  midShelfMesh.castShadow = true;
  midShelfMesh.receiveShadow = true;
  nicheGroup.add(midShelfMesh);

  // 4-piece PF Pewter/Brushed Nickel Schlüter-JOLLY perimeter edge trim around the hollow opening
  const trimZ = frontZ + trimDepthM * 0.5 - 0.002;
  const hTrimLen = widthM + trimFaceWidthM * 2;
  for (const [edgeTag, ty] of [
    ['top', maxY + trimFaceWidthM * 0.5],
    ['bottom', minY - trimFaceWidthM * 0.5],
  ] as const) {
    const tGeo = new THREE.BoxGeometry(hTrimLen, trimFaceWidthM, trimDepthM);
    tGeo.computeBoundingSphere();
    const tMesh = new THREE.Mesh(tGeo, pfTrimMat);
    tMesh.name = `showerRoom.kerdiBoardShowerNiche.trim.${edgeTag}`;
    tMesh.position.set(centerX, ty, trimZ);
    nicheGroup.add(tMesh);
  }
  for (const [edgeTag, tx] of [
    ['left', minX - trimFaceWidthM * 0.5],
    ['right', maxX + trimFaceWidthM * 0.5],
  ] as const) {
    const tGeo = new THREE.BoxGeometry(trimFaceWidthM, heightM, trimDepthM);
    tGeo.computeBoundingSphere();
    const tMesh = new THREE.Mesh(tGeo, pfTrimMat);
    tMesh.name = `showerRoom.kerdiBoardShowerNiche.trim.${edgeTag}`;
    tMesh.position.set(tx, centerY, trimZ);
    nicheGroup.add(tMesh);
  }

  // Concealed warm 2700K IP67 LED strip tucked behind a 12mm top valence baffle under the niche header
  const baffleGeo = new THREE.BoxGeometry(widthM - tileT * 2, 0.012, 0.008);
  baffleGeo.computeBoundingSphere();
  const baffleMesh = new THREE.Mesh(baffleGeo, pfTrimMat);
  baffleMesh.name = 'showerRoom.kerdiBoardShowerNiche.ledBaffle';
  baffleMesh.position.set(centerX, maxY - tileT - 0.006, frontZ + 0.014);
  nicheGroup.add(baffleMesh);

  const ledStripMat = new THREE.MeshStandardMaterial({
    name: 'showerRoom.nicheWarm2700kLedStrip',
    color: 0xfff3dc,
    emissive: 0xffc978,
    emissiveIntensity: 3.4,
    roughness: 0.18,
    metalness: 0.0,
  });
  const ledStripGeo = new THREE.BoxGeometry(widthM - tileT * 2 - 0.016, 0.005, 0.012);
  ledStripGeo.computeBoundingSphere();
  const ledStripMesh = new THREE.Mesh(ledStripGeo, ledStripMat);
  ledStripMesh.name = 'showerRoom.kerdiBoardShowerNiche.ledStrip';
  ledStripMesh.position.set(centerX, maxY - tileT - 0.003, frontZ + 0.026);
  nicheGroup.add(ledStripMesh);

  const nicheGlowLight = new THREE.PointLight(0xffc978, 0.55, 0.95, 2.0);
  nicheGlowLight.name = 'showerRoom.kerdiBoardShowerNiche.warmGlowLight';
  nicheGlowLight.position.set(centerX, maxY - 0.045, frontZ + 0.042);
  nicheGroup.add(nicheGlowLight);

  // Apothecary amber-glass & stoneware pump bottles seated inside the recessed niche
  const amberGlassMat = new THREE.MeshStandardMaterial({
    color: 0x6e3b16,
    roughness: 0.16,
    metalness: 0.05,
  });
  const stonewareBottleMat = new THREE.MeshStandardMaterial({
    color: 0xe6e1d6,
    roughness: 0.62,
    metalness: 0.02,
  });
  const lowerShelfTopY = minY + sillThicknessM;
  const upperShelfTopY = midShelfY + midShelfThicknessM * 0.5;
  const bottleSpecs = [
    { name: 'shampooBottle', x: centerX - 0.085, baseY: lowerShelfTopY, z: frontZ + 0.052, r: 0.031, h: 0.145, mat: amberGlassMat, pump: true },
    { name: 'conditionerBottle', x: centerX - 0.005, baseY: lowerShelfTopY, z: frontZ + 0.054, r: 0.029, h: 0.132, mat: amberGlassMat, pump: true },
    { name: 'bodyScrubJar', x: centerX + 0.082, baseY: upperShelfTopY, z: frontZ + 0.056, r: 0.036, h: 0.072, mat: stonewareBottleMat, pump: false },
  ] as const;

  for (const b of bottleSpecs) {
    const bodyGeo = new THREE.CylinderGeometry(b.r * 0.94, b.r, b.h, 16);
    bodyGeo.computeBoundingSphere();
    const body = new THREE.Mesh(bodyGeo, b.mat);
    body.name = `showerRoom.kerdiBoardShowerNiche.${b.name}`;
    body.position.set(b.x, b.baseY + b.h * 0.5, b.z);
    body.castShadow = true;
    tagHighLodDetail(body);
    nicheGroup.add(body);

    const capH = b.pump ? 0.022 : 0.012;
    const capR = b.pump ? 0.011 : b.r * 0.92;
    const capGeo = new THREE.CylinderGeometry(capR, capR, capH, 12);
    capGeo.computeBoundingSphere();
    const cap = new THREE.Mesh(capGeo, pfTrimMat);
    cap.name = `showerRoom.kerdiBoardShowerNiche.${b.name}.cap`;
    cap.position.set(b.x, b.baseY + b.h + capH * 0.5, b.z);
    tagHighLodDetail(cap);
    nicheGroup.add(cap);
  }

  showerGroup.add(nicheGroup);
}

/**
 * Applies uniform world-meter UVs (1 repeat = 0.265m W x 0.266m H) to a 2D-extruded wallpaper lining
 * geometry whose local X is horizontal wall run in meters and local Y is world elevation Y in meters.
 */
function applyMimiSandstoneWorldUvs(
  geo: THREE.BufferGeometry,
  uOrigin: number,
  uSign: 1 | -1,
  yDatum: number
): THREE.BufferGeometry {
  const pos = geo.getAttribute('position');
  const uv = geo.getAttribute('uv');
  if (pos && uv) {
    for (let i = 0; i < pos.count; i++) {
      const u = ((pos.getX(i) - uOrigin) * uSign) / SANDBERG_MIMI_SANDSTONE_REPEAT_U;
      const v = (pos.getY(i) - yDatum) / SANDBERG_MIMI_SANDSTONE_REPEAT_V;
      uv.setXY(i, u, v);
    }
    uv.needsUpdate = true;
  }
  geo.computeBoundingSphere();
  return geo;
}

/**
 * Hangs Sandberg Mimi Sandstone (SKU: S10267) wallpaper cleanly across ALL 5 interior dry-zone wall
 * faces of Room 20 (showerRoom) above the 100mm Parisian Manoir marble upstand, keeping Bedroom 2,
 * Bedroom 3, the wetroom stall, and the West Wing Corridor plaster faces 100% untouched.
 */
function buildShowerRoomDryZoneWallpaper(
  scene: THREE.Object3D,
  dims: {
    readonly showerFloorY: number;
    readonly showerWestEavesY: number;
    readonly showerCollarY: number;
    readonly archLeftX: number;
    readonly archRightX: number;
    readonly archCenterX: number;
    readonly archRadius: number;
    readonly archSpringY: number;
  },
  wallpaperMat: THREE.Material
): void {
  const {
    showerFloorY,
    showerWestEavesY,
    showerCollarY,
    archLeftX,
    archRightX,
    archCenterX,
    archRadius,
    archSpringY,
  } = dims;
  const upstandTopY = showerFloorY + SHOWER_UPSTAND_SPEC.heightM; // 2.175m
  const paperT = 0.0015;
  const collarWestX = -20.85;
  const trimOuterR = archRadius + 0.006;

  const wallpaperGroup = new THREE.Group();
  wallpaperGroup.name = 'showerRoom.wallpaper';

  const addPaperMesh = (name: string, geo: THREE.BufferGeometry): THREE.Mesh => {
    const mesh = new THREE.Mesh(geo, wallpaperMat);
    mesh.name = name;
    mesh.userData.isArchitecturalShell = true;
    mesh.receiveShadow = true;
    wallpaperGroup.add(mesh);
    return mesh;
  };

  // 1. South-West dry wall + upper vaulted gable (Z = 3.745m facing North -Z, behind Lissa Doon basin & WC)
  {
    const swShape = new THREE.Shape();
    swShape.moveTo(-22.19, upstandTopY);
    swShape.lineTo(archLeftX - 0.005, upstandTopY);
    swShape.lineTo(archLeftX - 0.005, showerCollarY);
    swShape.lineTo(collarWestX, showerCollarY);
    swShape.lineTo(-22.19, showerWestEavesY);
    swShape.closePath();
    const swGeo = new THREE.ExtrudeGeometry(swShape, { depth: paperT, bevelEnabled: false });
    applyMimiSandstoneWorldUvs(swGeo, -20.16, -1, upstandTopY);
    swGeo.translate(0, 0, 3.745 - paperT);
    addPaperMesh('showerRoom.wallpaper.southWestWall', swGeo);
  }

  // 2. South-East dry pier + arch spandrel (Z = 3.745m facing North -Z, X = -20.165m .. -18.995m around Pewter arch trim)
  {
    const seShape = new THREE.Shape();
    seShape.moveTo(archLeftX - 0.005, archSpringY);
    seShape.absarc(archCenterX, archSpringY, trimOuterR, Math.PI, 0, true);
    seShape.lineTo(archRightX + 0.005, upstandTopY);
    seShape.lineTo(SHOWER_UPSTAND_SPEC.eastInnerX, upstandTopY);
    seShape.lineTo(SHOWER_UPSTAND_SPEC.eastInnerX, showerCollarY);
    seShape.lineTo(archLeftX - 0.005, showerCollarY);
    seShape.closePath();
    const seGeo = new THREE.ExtrudeGeometry(seShape, {
      depth: paperT,
      bevelEnabled: false,
      curveSegments: 64,
    });
    applyMimiSandstoneWorldUvs(seGeo, -20.16, -1, upstandTopY);
    seGeo.translate(0, 0, 3.745 - paperT);
    addPaperMesh('showerRoom.wallpaper.southEastArchWall', seGeo);
  }

  // Compute exact NW & NE dry-room corner Z coordinates along angled North wall
  const [nwX0, nwZ0] = SHOWER_UPSTAND_SPEC.northWallStart;
  const [nwX1, nwZ1] = SHOWER_UPSTAND_SPEC.northWallEnd;
  const nwDx = nwX1 - nwX0;
  const nwDz = nwZ1 - nwZ0;
  const nwLen = Math.hypot(nwDx, nwDz);
  const nwTx = nwDx / nwLen;
  const nwTz = nwDz / nwLen;
  const nwNx = -nwTz;
  const nwNz = nwTx;
  const halfT = SHOWER_UPSTAND_SPEC.northWallHalfThicknessM;
  const uNorthWest = (SHOWER_UPSTAND_SPEC.westInnerX - (nwX0 + nwNx * halfT)) / nwTx;
  const uNorthEast = (SHOWER_UPSTAND_SPEC.eastInnerX - (nwX0 + nwNx * halfT)) / nwTx;
  const zNorthWest = nwZ0 + nwTz * uNorthWest + nwNz * halfT;
  const zNorthEast = nwZ0 + nwTz * uNorthEast + nwNz * halfT;

  // 3. West exterior wall interior lining (X = -22.19m facing East +X, cut out cleanly behind casement window trim)
  {
    const z0 = zNorthWest;
    const z1 = 3.745;
    const wLen = z1 - z0;
    const westShape = new THREE.Shape();
    westShape.moveTo(0, upstandTopY);
    westShape.lineTo(wLen, upstandTopY);
    westShape.lineTo(wLen, showerWestEavesY);
    westShape.lineTo(0, showerWestEavesY);
    westShape.closePath();

    // Window Win 1764547 clear structural opening: Z = 2.88 +/- 0.48m (2.40..3.36m), Y = 2.765..3.725m
    const winHole = new THREE.Path();
    winHole.moveTo(2.4 - z0, 2.765);
    winHole.lineTo(2.4 - z0, 3.725);
    winHole.lineTo(3.36 - z0, 3.725);
    winHole.lineTo(3.36 - z0, 2.765);
    winHole.closePath();
    westShape.holes.push(winHole);

    const westGeo = new THREE.ExtrudeGeometry(westShape, { depth: paperT, bevelEnabled: false });
    applyMimiSandstoneWorldUvs(westGeo, 0, -1, upstandTopY);
    // Rotate local +X along +Z (rotateY(-PI/2): (x, y, z) -> (-z, y, x) wait: rotateY(-PI/2) maps +X -> +Z, +Z -> -X; rotateY(+PI/2) maps +X -> -Z, +Z -> +X)
    westGeo.rotateY(-Math.PI * 0.5);
    westGeo.translate(SHOWER_UPSTAND_SPEC.westInnerX + paperT, 0, z0);
    addPaperMesh('showerRoom.wallpaper.westExteriorWall', westGeo);
  }

  // 4. Angled North partition wall (Shower Room South-facing side of bed2SouthWallFrame + vaulted upper gable, around bedroom2EnsuiteDoor)
  {
    const uSpan = uNorthEast - uNorthWest;
    const uCollar = 1.352 - uNorthWest;
    // bedroom2EnsuiteDoor structural opening along bed2SouthWallFrame: u = 0.545 +/- 0.45 -> [0.095, 0.995], Y = 2.075..3.805m
    const dLeft = Math.max(0.01, 0.095 - uNorthWest);
    const dRight = 0.995 - uNorthWest;
    const dHeadY = showerFloorY + 1.73;

    const northShape = new THREE.Shape();
    northShape.moveTo(0, upstandTopY);
    northShape.lineTo(dLeft, upstandTopY);
    northShape.lineTo(dLeft, dHeadY);
    northShape.lineTo(dRight, dHeadY);
    northShape.lineTo(dRight, upstandTopY);
    northShape.lineTo(uSpan, upstandTopY);
    northShape.lineTo(uSpan, showerCollarY);
    northShape.lineTo(uCollar, showerCollarY);
    northShape.lineTo(0, showerWestEavesY);
    northShape.closePath();

    const northGeo = new THREE.ExtrudeGeometry(northShape, { depth: paperT, bevelEnabled: false });
    applyMimiSandstoneWorldUvs(northGeo, 0, 1, upstandTopY);
    const wallRotY = Math.atan2(-nwDz, nwDx);
    const nMesh = addPaperMesh('showerRoom.wallpaper.northPartitionWall', northGeo);
    nMesh.position.set(
      nwX0 + nwTx * uNorthWest + nwNx * halfT,
      0,
      nwZ0 + nwTz * uNorthWest + nwNz * halfT
    );
    nMesh.rotation.y = wallRotY;
  }

  // 5. East corridor partition wall (Shower Room West-facing side at X = -18.995m, Z = zNorthEast..3.745m, around showerRoomDoor)
  {
    const z0 = zNorthEast;
    const z1 = 3.745;
    const eLen = z1 - z0;
    // showerRoomDoor structural opening: Z = 3.125 +/- 0.45m -> [2.675, 3.575], Y = 2.075..4.105m
    const d0 = 2.675 - z0;
    const d1 = 3.575 - z0;
    const dHeadY = 2.095 + 2.01;

    const eastShape = new THREE.Shape();
    eastShape.moveTo(0, upstandTopY);
    eastShape.lineTo(d0, upstandTopY);
    eastShape.lineTo(d0, dHeadY);
    eastShape.lineTo(d1, dHeadY);
    eastShape.lineTo(d1, upstandTopY);
    eastShape.lineTo(eLen, upstandTopY);
    eastShape.lineTo(eLen, showerCollarY);
    eastShape.lineTo(0, showerCollarY);
    eastShape.closePath();

    const eastGeo = new THREE.ExtrudeGeometry(eastShape, { depth: paperT, bevelEnabled: false });
    applyMimiSandstoneWorldUvs(eastGeo, 0, 1, upstandTopY);
    // Rotate local +X along +Z so front face points -X into showerRoom: rotateY(-PI/2) maps +X -> +Z and +Z -> -X!
    eastGeo.rotateY(-Math.PI * 0.5);
    eastGeo.translate(SHOWER_UPSTAND_SPEC.eastInnerX, 0, z0);
    addPaperMesh('showerRoom.wallpaper.eastPartitionWall', eastGeo);
  }

  scene.add(wallpaperGroup);
}

/**
 * West wing upper corridor, trapezoidal upstairs shower room and walk-in cupboard.
 */
export function buildWestWingCorridor(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'antiqueOakSkirtingMat' | 'brassMat' | 'ceramicWhiteMat' | 'floorBaseY' | 'floorTopY' | 'mimiSandstoneWallpaperMat' | 'oakFloorMat' | 'timberDoorMat' | 'upperWallTopY' | 'wallCapMat' | 'wardrobeMat' | 'warmRoomPlasterMat' | 'wimborneWhiteJoineryMat'> &
    Pick<ReturnType<typeof createFirstFloorShellKit>, 'addShakerWardrobeDoor' | 'addUpperBrickWallAlongZWithWindow' | 'addUpperExteriorBrickWall' | 'addUpperInteractiveDoor' | 'addUpperInteriorWall' | 'doorH'>
): void {
  const { firstFloorMeshGroup: scene, interactions } = ctx;
  const {
    addShakerWardrobeDoor,
    addUpperBrickWallAlongZWithWindow,
    addUpperExteriorBrickWall,
    antiqueOakSkirtingMat,
    brassMat,
    ceramicWhiteMat,
    floorBaseY,
    floorTopY,
    mimiSandstoneWallpaperMat,
    oakFloorMat,
    upperWallTopY,
    wallCapMat,
    wardrobeMat,
    warmRoomPlasterMat,
    wimborneWhiteJoineryMat,
  } = kit;

  const landingFloorTopY = 2.16;
  const showerFloorY = 2.075;
  const bed2FloorY = 2.05;
  const bed3FloorY = 2.08;
  const bed3AlcoveFloorY = 1.938; // Surveyed -142mm sunken NW wardrobe alcove in Bedroom 3
  const corridorCeilingY = 4.155; // Surveyed 2.06m corridor ceiling height above 2.095m FFL
  const showerWestEavesY = 3.875; // Surveyed 1.80m West eaves height above 2.075m FFL
  const showerCollarY = 4.815;    // Surveyed 2.74m vaulted collar in Room 20 Shower Room

  // Exact world-space junction coordinates along the West face of `upperLandingCrossWallFrame` and
  // South face (`z_ew = 2.688m`) of the Upper Landing South wall via `transformEastWingTuple`:
  const [portalNorthJambX, , portalNorthJambZ] = transformEastWingTuple(-17.937, 0, 1.232);
  const [portalSouthJambX, , portalSouthJambZ] = transformEastWingTuple(-17.998, 0, 2.09);
  const [portalSouthArchX, , portalSouthArchZ] = transformEastWingTuple(-18.003, 0, 2.171);
  const [landingSouthWestX, , landingSouthWestZ] = transformEastWingTuple(-18.04, 0, 2.688);
  const [, , landingSouthEastZ] = transformEastWingTuple(-16.956, 0, 2.688);

  // =========================================================================
  // 5. WEST WING UPPER CORRIDOR, UPSTAIRS SHOWER ROOM & BEDROOM 3 RECESSED WARDROBE
  // =========================================================================
  // Upper Corridor & Cut-Out North Hallway polygonal carpeted floor (`oakFloorMat`, Y = 2.08m)
  // Extended into surrounding East brick wall (`[-16.83, landingSouthEastZ] -> [-17.09, 8.27]`) and interior walls so zero light leaks under the skirting (Issue #13)!
  const corridorFloorSlab = buildPolygonalFloorSlab(
    scene,
    [
      [-18.92, 1.125],
      [-17.65, 1.125],
      [landingSouthWestX, landingSouthWestZ],
      [-16.83, landingSouthEastZ],
      [-17.09, 8.27],
      [-18.21, 8.27],
      [-18.21, 3.82],
      [-18.92, 3.82],
    ],
    floorTopY,
    floorTopY - floorBaseY,
    oakFloorMat,
    0.5
  );
  corridorFloorSlab.name = 'westWingCorridor.floorSlab';
  corridorFloorSlab.userData.isArchitecturalShell = true;
  corridorFloorSlab.geometry.computeBoundingSphere();

  // Carpeted 8cm (`2.08m -> 2.16m`) `UP` Step Riser & Rounded Bullnose Nosing along the West face of
  // `upperLandingToWestWingPortal` stepping down into the cut-out hallway!
  {
    const stepStartX = portalNorthJambX;
    const stepStartZ = portalNorthJambZ;
    const stepEndX = portalSouthJambX;
    const stepEndZ = portalSouthJambZ;
    const sdx = stepEndX - stepStartX;
    const sdz = stepEndZ - stepStartZ;
    const stepLen = Math.hypot(sdx, sdz);
    const stepAngleY = Math.atan2(-sdz, sdx);
    const stepRise = landingFloorTopY - floorTopY; // 0.08m (8cm small step)

    const stepGroup = new THREE.Group();
    stepGroup.name = 'westWingCorridor.upStepToLanding';
    stepGroup.position.set(
      (stepStartX + stepEndX) / 2,
      floorTopY,
      (stepStartZ + stepEndZ) / 2
    );
    stepGroup.rotation.y = stepAngleY;

    const riserGeo = new THREE.BoxGeometry(stepLen, stepRise, 0.028);
    const riserUv = riserGeo.attributes.uv;
    if (riserUv) {
      for (let i = 0; i < riserUv.count; i++) {
        riserUv.setXY(
          i,
          riserUv.getX(i) * stepLen * 0.5,
          riserUv.getY(i) * stepRise * 0.5
        );
      }
      riserUv.needsUpdate = true;
    }
    riserGeo.computeBoundingSphere();
    const riserMesh = new THREE.Mesh(riserGeo, oakFloorMat);
    riserMesh.name = 'westWingCorridor.upStepToLanding.riser';
    riserMesh.position.set(0, stepRise / 2, 0);
    riserMesh.castShadow = true;
    riserMesh.receiveShadow = true;
    stepGroup.add(riserMesh);

    const nosingGeo = new THREE.CylinderGeometry(
      0.016,
      0.016,
      stepLen,
      14
    );
    nosingGeo.rotateZ(Math.PI / 2);
    const nosingUv = nosingGeo.attributes.uv;
    if (nosingUv) {
      for (let i = 0; i < nosingUv.count; i++) {
        nosingUv.setXY(
          i,
          nosingUv.getX(i) * 0.05,
          nosingUv.getY(i) * stepLen * 0.5
        );
      }
      nosingUv.needsUpdate = true;
    }
    nosingGeo.computeBoundingSphere();
    const nosingMesh = new THREE.Mesh(nosingGeo, oakFloorMat);
    nosingMesh.name = 'westWingCorridor.upStepToLanding.nosing';
    nosingMesh.position.set(0, stepRise - 0.014, 0.012);
    nosingMesh.castShadow = true;
    nosingMesh.receiveShadow = true;
    tagHighLodDetail(nosingMesh);
    stepGroup.add(nosingMesh);

    scene.add(stepGroup);
  }

  const {
    floorMat: parisianManoirFloorMat,
    upstandMat: parisianManoirUpstandMat,
    wetroomWallMat: felliniOlivaWallMat,
  } = createShowerRoomTileMaterials();

  // Trapezoidal Shower Room polygonal tiled floor (`Y = 2.075m`, Parisian Manoir Cabochon tumbled marble octagons & charcoal cabochons)
  const showerRoomFloorSlab = buildPolygonalFloorSlab(
    scene,
    [
      [-22.19, 1.905],
      [-18.92, 2.34],
      [-18.92, 3.82],
      [-18.21, 3.82],
      [-18.21, 4.68],
      [-20.235, 4.68],
      [-20.235, 3.82],
      [-22.19, 3.82],
    ],
    showerFloorY,
    showerFloorY - floorBaseY,
    parisianManoirFloorMat,
    0.5
  );
  showerRoomFloorSlab.name = 'showerRoom.floorSlab';
  showerRoomFloorSlab.userData.isArchitecturalShell = true;
  showerRoomFloorSlab.geometry.computeBoundingSphere();

  // Solid antique oak threshold steps at `bedroom2Door` (`2.050m -> 2.095m`, 45mm rise) and `showerRoomDoor` (`2.075m -> 2.095m`, 20mm rise)
  {
    const bed2StepRise = floorTopY - bed2FloorY; // 0.045m
    const bed2StepGeo = new THREE.BoxGeometry(0.072, bed2StepRise, 0.76);
    bed2StepGeo.computeBoundingSphere();
    const bed2Step = new THREE.Mesh(bed2StepGeo, wimborneWhiteJoineryMat);
    bed2Step.name = 'bedroom2.doorThresholdStep';
    bed2Step.userData.isArchitecturalShell = true;
    bed2Step.position.set(-18.959, bed2FloorY + bed2StepRise * 0.5, 1.695);
    bed2Step.receiveShadow = true;
    scene.add(bed2Step);

    const showerStepRise = floorTopY - showerFloorY; // 0.020m
    const showerThresholdGeo = new THREE.BoxGeometry(0.072, showerStepRise, 0.9);
    showerThresholdGeo.computeBoundingSphere();
    const showerThresholdStrip = new THREE.Mesh(
      showerThresholdGeo,
      parisianManoirUpstandMat
    );
    showerThresholdStrip.name = 'showerRoom.doorThresholdStrip';
    showerThresholdStrip.userData.isArchitecturalShell = true;
    showerThresholdStrip.position.set(-18.959, showerFloorY + showerStepRise * 0.5, 3.125);
    showerThresholdStrip.receiveShadow = true;
    scene.add(showerThresholdStrip);
  }

  // West Front Exterior Brick Wall of Upstairs Shower Room (X = -22.47m..-22.19m, Z = +1.905m..+3.895m)
  // Surveyed Win 1764547: 0.96m x 0.96m 2-light casement (sill +690mm = 2.765m, head 3.725m)
  {
    const idx = scene.children.length;
    addUpperBrickWallAlongZWithWindow(
      -22.47,
      -22.19,
      1.905,
      3.895,
      2.88,
      0.96,
      2.765,
      3.725,
      'east',
      2,
      { windowFamily: 'doubleCasement', skipSkirting: true }
    );
    ensureNamedAddedChildren(scene, idx, 'showerRoom.westExteriorWall');

    const alcoveBrickIdx = scene.children.length;
    addUpperExteriorBrickWall(
      -22.47,
      -22.19,
      3.895,
      4.85,
      bed3AlcoveFloorY,
      upperWallTopY,
      'east',
      { skipSkirting: true, skipCap: true }
    );
    ensureNamedAddedChildren(scene, alcoveBrickIdx, 'bedroom3.alcoveWestExteriorWall');
  }

  // Continuous Flat East Courtyard Exterior Brick Wall along the West Wing Upper Corridor (Z = +2.74m..+8.15m)
  // Surveyed Win 1745551: 1.50m x 0.96m 3-light casement (sill +690mm = 2.785m, head 3.745m)
  {
    const idx = scene.children.length;
    addUpperBrickWallAlongZWithWindow(
      -17.39,
      -17.11,
      2.74,
      8.15,
      5.92,
      1.5,
      2.785,
      3.745,
      'west',
      3,
      { windowFamily: 'tripleTopHungCentre', skipSkirting: true }
    );
    ensureNamedAddedChildren(scene, idx, 'westWingCorridor.eastExteriorWall');
  }

  // Continuous 45°-mitred antique oak skirting along the East & North-East wall of the West Wing Corridor (Y = 2.095m),
  // split cleanly on either side of the `CP-07` (`Door 1683013`) cased portal at Z = 3.82m
  {
    const eastWallSlope = (-17.25 - -16.82) / (11.77 - 2.4);
    const getEastInnerX = (wz: number): number =>
      -16.82 + eastWallSlope * (wz - 2.4) - 0.14;

    for (const [skirtName, path] of [
      [
        'westWingCorridor.eastWallNorthMitredSkirting',
        [
          [portalSouthArchX, portalSouthArchZ],
          [landingSouthWestX, landingSouthWestZ],
          [getEastInnerX(landingSouthEastZ), landingSouthEastZ],
          [getEastInnerX(3.745), 3.745],
        ] as const,
      ],
      [
        'westWingCorridor.eastWallMitredSkirting',
        [
          [getEastInnerX(3.895), 3.895],
          [getEastInnerX(8.15), 8.15],
          [-17.165, 8.15],
        ] as const,
      ],
    ] as const) {
      const eastCorridorSkirtGeo = buildMitredWallSkirtingGeometry(path, floorTopY);
      eastCorridorSkirtGeo.computeBoundingSphere();
      const eastCorridorSkirt = new THREE.Mesh(
        eastCorridorSkirtGeo,
        wimborneWhiteJoineryMat
      );
      eastCorridorSkirt.name = skirtName;
      eastCorridorSkirt.castShadow = true;
      eastCorridorSkirt.receiveShadow = true;
      eastCorridorSkirt.userData.isCutawayWall = true;
      eastCorridorSkirt.userData.cutawayWall = {
        axis: 'x',
        coord: -17.25,
        minSpan: 2.15,
        maxSpan: 8.15,
        floor: 'first',
      };
      scene.add(eastCorridorSkirt);
    }
  }

  // =========================================================================
  // CUT-OUT NORTH HALLWAY & UPSTAIRS SHOWER ROOM (`X = -22.19m..-18.92m, Z = +1.905m/+2.34m..+3.82m`
  // + Walk-In Shower Stall `X = -20.235m..-18.21m, Z = +3.82m..+4.68m`)
  // =========================================================================
  // 1a. Orthogonal 90° North End Wall of the Cut-Out Hallway (`Z = +1.05m, X = -18.995m..-17.65m`, 0.15m thick)
  {
    const idx = scene.children.length;
    buildAngledWallSegment(scene, interactions, {
      start: [-18.995, 1.05],
      end: [-17.65, 1.05],
      thickness: 0.15,
      topY: corridorCeilingY,
      frontFloorY: floorTopY,
      backFloorY: bed2FloorY,
      wallMaterial: warmRoomPlasterMat,
      capMaterial: wallCapMat,
      skipCap: true,
      skirtingMaterial: wimborneWhiteJoineryMat,
      addFrontSkirting: false, // Hallway side uses continuous 45°-mitred skirting in bedroom-3.ts
      addBackSkirting: false,  // Bedroom 2 side uses continuous 45°-mitred skirting in bedroom-2.ts
    });
    ensureNamedAddedChildren(scene, idx, 'westWingCorridor.cutoutNorthWall');
  }

  // 1b. Continuous West Wall of the Cut-Out Hallway & `UP` Lobby (`X = -18.92m, Z = +0.975m..+3.82m`, length = 2.845m)
  //     Contains BOTH `bedroom2Door` (`Door 1683309`: `0.76m x 1.865m` at `Z = 1.695m`)
  //     and `showerRoomDoor` (`Door 1683296`: `0.90m x 2.01m` at `Z = 3.125m`)!
  {
    const idx = scene.children.length;
    buildAngledWallSegment(scene, interactions, {
      start: [-18.92, 0.975],
      end: [-18.92, 3.82],
      thickness: 0.15,
      topY: corridorCeilingY,
      frontFloorY: showerFloorY,
      backFloorY: floorTopY,
      wallMaterial: warmRoomPlasterMat,
      capMaterial: wallCapMat,
      skipCap: true,
      skirtingMaterial: wimborneWhiteJoineryMat,
      addFrontSkirting: false,
      addBackSkirting: false,
      openings: [
        {
          id: 'bedroom2Door',
          kind: 'hinged-door',
          uCenter: 0.72,
          width: 0.76,
          doorHeight: 1.865,
          lowerFloorY: bed2FloorY,
          upperFloorY: floorTopY,
          architraveMaterial: wimborneWhiteJoineryMat,
          doorLeafMaterial: wimborneWhiteJoineryMat,
          hardwareMaterial: brassMat,
          hingeSide: 'right',
          openAngle: Math.PI * 0.42,
          initialOpenProgress: 0.2,
        },
        {
          id: 'showerRoomDoor',
          kind: 'hinged-door',
          uCenter: 2.15,
          width: 0.9,
          doorHeight: 2.01,
          lowerFloorY: showerFloorY,
          upperFloorY: floorTopY,
          architraveMaterial: wimborneWhiteJoineryMat,
          frontArchitraveMaterial: wimborneWhiteJoineryMat,
          doorLeafMaterial: wimborneWhiteJoineryMat,
          frontDoorLeafMaterial: wimborneWhiteJoineryMat,
          hardwareMaterial: brassMat,
          hingeSide: 'left',
          openAngle: -Math.PI * 0.42,
          initialOpenProgress: 0.2,
        },
      ],
    });
    ensureNamedAddedChildren(scene, idx, 'westWingCorridor.cutoutWestWall');

    // Upper gable strip (`Y = 4.155m..4.815m`) along `X = -18.92m` (`Z = 2.34m..3.82m`) closing Room 20's 4.815m vaulted collar against the 4.155m West Lobby ceiling
    const showerEastUpperGeo = new THREE.BoxGeometry(
      0.15,
      showerCollarY - corridorCeilingY,
      3.82 - 2.34
    );
    showerEastUpperGeo.computeBoundingSphere();
    const showerEastUpperGable = new THREE.Mesh(
      showerEastUpperGeo,
      warmRoomPlasterMat
    );
    showerEastUpperGable.name = 'showerRoom.eastWallUpperGable';
    showerEastUpperGable.userData.isArchitecturalShell = true;
    showerEastUpperGable.position.set(
      -18.92,
      (corridorCeilingY + showerCollarY) * 0.5,
      (2.34 + 3.82) * 0.5
    );
    showerEastUpperGable.castShadow = true;
    showerEastUpperGable.receiveShadow = true;
    scene.add(showerEastUpperGable);
  }

  buildShowerRoomMarbleUpstands(scene, showerFloorY, parisianManoirUpstandMat);

  // 2. Straight Z = +3.82m Partition Wall (calibrated to surveyed Room 20 clear depth 1.48-1.54m):
  //    2a. West section behind Vanity Basin & WC (`Z = +3.82m, X = -22.19m..-20.16m`)
  {
    const idx = scene.children.length;
    buildAngledWallSegment(scene, interactions, {
      start: [-22.19, 3.82],
      end: [-20.168, 3.82],
      thickness: 0.15,
      topY: showerWestEavesY,
      frontFloorY: bed3AlcoveFloorY,
      backFloorY: showerFloorY,
      wallMaterial: warmRoomPlasterMat,
      capMaterial: wallCapMat,
      skipCap: true,
      skirtingMaterial: wimborneWhiteJoineryMat,
      addFrontSkirting: false,
      addBackSkirting: false,
    });
    ensureNamedAddedChildren(scene, idx, 'showerRoom.southWestPartitionWall');
  }

  //    2b. One-piece vaulted East section forming the North wall of the Walk-In Shower & South wall of the West Lobby
  //        (`Z = +3.82m, X = -19.292m..-18.135m`, inset 8mm for Fellini Oliva arch jamb tile)
  {
    const seWallShape = new THREE.Shape();
    seWallShape.moveTo(-19.292, showerFloorY);
    seWallShape.lineTo(-18.135, showerFloorY);
    seWallShape.lineTo(-18.135, corridorCeilingY);
    seWallShape.lineTo(-18.92, showerCollarY);
    seWallShape.lineTo(-19.292, showerCollarY);
    seWallShape.closePath();
    const seWallGeo = new THREE.ExtrudeGeometry(seWallShape, {
      depth: 0.142,
      bevelEnabled: false,
    });
    seWallGeo.translate(0, 0, 3.82 - 0.075);
    seWallGeo.computeBoundingSphere();
    const seWallMesh = new THREE.Mesh(seWallGeo, warmRoomPlasterMat);
    seWallMesh.name = 'showerRoom.southEastPartitionWall';
    seWallMesh.userData.isArchitecturalShell = true;
    seWallMesh.castShadow = true;
    seWallMesh.receiveShadow = true;
    scene.add(seWallMesh);
  }

  //    2c. Surveyed Open Cased Solid Oak Portal `CP-07` (`Door 1683013`: 0.864m x 1.99m clear)
  //        dividing the North Cut-Out Lobby from the South Courtyard Corridor at `Z = +3.82m` (`X = -18.135m..-17.02m`)!
  {
    const portalMinX = -18.012;
    const portalMaxX = -17.148;
    const portalCenterX = (portalMinX + portalMaxX) * 0.5; // -17.58m
    const portalHeadY = floorTopY + 1.99; // 4.085m
    const portalWallShape = new THREE.Shape();
    portalWallShape.moveTo(-18.135, floorTopY);
    portalWallShape.lineTo(portalMinX, floorTopY);
    portalWallShape.lineTo(portalMinX, portalHeadY);
    portalWallShape.lineTo(portalMaxX, portalHeadY);
    portalWallShape.lineTo(portalMaxX, floorTopY);
    portalWallShape.lineTo(-17.01, floorTopY);
    portalWallShape.lineTo(-17.01, corridorCeilingY);
    portalWallShape.lineTo(-18.135, corridorCeilingY);
    portalWallShape.closePath();
    const portalWallGeo = new THREE.ExtrudeGeometry(portalWallShape, {
      depth: 0.15,
      bevelEnabled: false,
    });
    portalWallGeo.translate(0, 0, 3.82 - 0.075);
    portalWallGeo.computeBoundingSphere();
    const portalWallMesh = new THREE.Mesh(portalWallGeo, warmRoomPlasterMat);
    portalWallMesh.name = 'westWingCorridor.lobbyToCorridorPortal.wall';
    portalWallMesh.userData.isArchitecturalShell = true;
    portalWallMesh.castShadow = true;
    portalWallMesh.receiveShadow = true;
    scene.add(portalWallMesh);

    const cp07Idx = scene.children.length;
    addCasedArchitravePortal(scene, {
      axis: 'x',
      wallCoord: 3.82,
      wallThickness: 0.15,
      openingCenter: portalCenterX,
      openingWidth: 0.864,
      frontFloorY: floorTopY,
      backFloorY: floorTopY,
      headY: portalHeadY,
      material: wimborneWhiteJoineryMat,
      architraveWidth: 0.075,
      namePrefix: 'westWingCorridor.lobbyToCorridorPortal',
    });
    ensureNamedAddedChildren(scene, cp07Idx, 'westWingCorridor.lobbyToCorridorPortal');
  }

  // =========================================================================
  // STEP-UP WALK-IN SHOWER TRAY (`Floor 1611917`: +100mm step-up `2.075m -> 2.175m`, `1.95m x 0.86m`)
  // & PLASTERED ARCHWAY ENTRANCE (`CP-08` / `Door 1683444`) AT `Z = +3.82m`
  // =========================================================================
  {
    const showerGroup = new THREE.Group();
    showerGroup.name = 'showerRoom.stepUpArchShower';

    // Plastered archway header (`showerRoom.showerArch`) over the `X = -20.16m..-19.30m` (`0.86m`) entrance at `Z = +3.82m`
    //    Rising seamlessly up to the 4.815m vaulted collar ceiling!
    const archLeftX = -20.16;
    const archRightX = -19.3;
    const archCenterX = (archLeftX + archRightX) / 2; // -19.73m
    const archSpan = archRightX - archLeftX; // 0.86m
    const archRadius = archSpan / 2; // 0.43m
    const archSpringY = showerFloorY + 1.54; // 3.615m springing line -> 4.045m crown (1.97m clear!)
    const archWallD = 0.142; // Z = 3.745m..3.887m; 8mm Fellini Oliva inner spandrel completes 3.887m..3.895m!

    const archCoreRadius = archRadius + SHOWER_WETROOM_SPEC.wallTileThicknessM;
    const archCoreShape = new THREE.Shape();
    archCoreShape.moveTo(-archCoreRadius, archSpringY);
    archCoreShape.absarc(0, archSpringY, archCoreRadius, Math.PI, 0, true);
    archCoreShape.lineTo(archCoreRadius, showerCollarY);
    archCoreShape.lineTo(-archCoreRadius, showerCollarY);
    archCoreShape.closePath();

    const archSpandrelShape = new THREE.Shape();
    archSpandrelShape.moveTo(-archRadius, archSpringY);
    archSpandrelShape.absarc(0, archSpringY, archRadius, Math.PI, 0, true);
    archSpandrelShape.lineTo(archRadius, showerCollarY);
    archSpandrelShape.lineTo(-archRadius, showerCollarY);
    archSpandrelShape.closePath();

    const archSpandrelGeo = new THREE.ExtrudeGeometry(archCoreShape, {
      depth: archWallD,
      bevelEnabled: false,
      curveSegments: 64,
    });
    archSpandrelGeo.translate(archCenterX, 0, 3.745);
    archSpandrelGeo.computeBoundingSphere();
    const archSpandrelMesh = new THREE.Mesh(archSpandrelGeo, warmRoomPlasterMat);
    archSpandrelMesh.name = 'showerRoom.showerArch';
    archSpandrelMesh.userData.isArchitecturalShell = true;
    archSpandrelMesh.castShadow = true;
    archSpandrelMesh.receiveShadow = true;
    showerGroup.add(archSpandrelMesh);

    // Step-up shower plinth (`0.10m` surveyed rise, `Y = 2.075m..2.175m`, fronted continuously by
    //    `showerRoom.tiledUpstand.southTrayAndWest` at `Z = 3.733m..3.745m`) & Ceramic Shower Tray
    const plinthH = 0.1;
    const trayW = 1.875; // X = -20.16m..-18.285m
    const trayD = 0.706; // Z = +3.899m..+4.605m
    const trayCenterX = -19.2225;
    const trayCenterZ = 4.252;

    const showerStepPlinthGeo = new THREE.BoxGeometry(trayW, plinthH, trayD);
    showerStepPlinthGeo.computeBoundingSphere();
    const showerStepPlinth = new THREE.Mesh(
      showerStepPlinthGeo,
      parisianManoirUpstandMat
    );
    showerStepPlinth.name = 'showerRoom.showerStepPlinth';
    showerStepPlinth.position.set(trayCenterX, showerFloorY + plinthH / 2, trayCenterZ);
    showerStepPlinth.castShadow = true;
    showerStepPlinth.receiveShadow = true;
    showerGroup.add(showerStepPlinth);

    const archStepRiserGeo = new THREE.BoxGeometry(archSpan, plinthH, 0.154);
    archStepRiserGeo.computeBoundingSphere();
    const archStepRiser = new THREE.Mesh(archStepRiserGeo, parisianManoirUpstandMat);
    archStepRiser.name = 'showerRoom.showerStepArchRiser';
    archStepRiser.position.set(archCenterX, showerFloorY + plinthH / 2, 3.822);
    archStepRiser.castShadow = true;
    archStepRiser.receiveShadow = true;
    showerGroup.add(archStepRiser);

    // Raised white stone-resin shower tray & threshold sitting cleanly on the 2.175m step-up plinth
    const trayBaseY = showerFloorY + plinthH;
    const stepNosingGeo = new THREE.BoxGeometry(archSpan, 0.042, 0.156);
    stepNosingGeo.computeBoundingSphere();
    const stepNosing = new THREE.Mesh(stepNosingGeo, ceramicWhiteMat);
    stepNosing.name = 'showerRoom.showerStepThreshold';
    stepNosing.position.set(archCenterX, trayBaseY + 0.021, 3.823);
    stepNosing.castShadow = true;
    stepNosing.receiveShadow = true;
    showerGroup.add(stepNosing);

    const srShowerTrayGeo = new THREE.BoxGeometry(trayW, 0.042, trayD);
    srShowerTrayGeo.computeBoundingSphere();
    const srShowerTray = new THREE.Mesh(srShowerTrayGeo, ceramicWhiteMat);
    srShowerTray.name = 'showerRoom.showerTray';
    srShowerTray.position.set(trayCenterX, trayBaseY + 0.021, trayCenterZ);
    srShowerTray.castShadow = true;
    srShowerTray.receiveShadow = true;
    showerGroup.add(srShowerTray);

    const trayRecessedWellGeo = new THREE.BoxGeometry(
      trayW - 0.14,
      0.006,
      trayD - 0.12
    );
    trayRecessedWellGeo.computeBoundingSphere();
    const trayRecessedWell = new THREE.Mesh(
      trayRecessedWellGeo,
      new THREE.MeshStandardMaterial({ color: 0xebeae4, roughness: 0.22, metalness: 0.04 })
    );
    trayRecessedWell.name = 'showerRoom.showerTray.recessedWell';
    trayRecessedWell.position.set(trayCenterX, trayBaseY + 0.045, trayCenterZ);
    showerGroup.add(trayRecessedWell);

    const pfBrass = getBathroomBrassMaterials('PF');
    const trayTopY = trayBaseY + 0.048;
    const tileBaseY = trayBaseY + 0.04;

    buildShowerWetroomFelliniTiling(
      showerGroup,
      archSpandrelShape,
      {
        archCenterX,
        tileBaseY,
        trayTopY,
        showerCollarY,
        corridorCeilingY,
      },
      felliniOlivaWallMat
    );

    // Schlüter KERDI-LINE 60cm (KLH50G2E60 + KLA19EB60) Brushed Stainless Linear Wetroom Grate
    const showerDrainGrateGeo = new THREE.BoxGeometry(0.068, 0.004, 0.6);
    showerDrainGrateGeo.computeBoundingSphere();
    const showerDrainGrate = new THREE.Mesh(showerDrainGrateGeo, pfBrass.primary);
    showerDrainGrate.name = 'showerRoom.kerdiLineLinearGrate';
    showerDrainGrate.position.set(-18.42, trayBaseY + 0.05, trayCenterZ);
    tagHighLodDetail(showerDrainGrate);
    showerGroup.add(showerDrainGrate);

    buildShowerArchwayInnerRevealTiling(
      showerGroup,
      {
        archLeftX,
        archRightX,
        archCenterX,
        archRadius,
        archSpringY,
        tileBaseY,
        trayTopY,
      },
      felliniOlivaWallMat,
      pfBrass.primary
    );

    buildRecessedLitShowerNiche(
      showerGroup,
      trayTopY,
      felliniOlivaWallMat,
      parisianManoirUpstandMat,
      pfBrass.primary
    );

    buildShowerRoomDryZoneWallpaper(
      scene,
      {
        showerFloorY,
        showerWestEavesY,
        showerCollarY,
        archLeftX,
        archRightX,
        archCenterX,
        archRadius,
        archSpringY,
      },
      mimiSandstoneWallpaperMat
    );

    // Perrin & Rowe Langbourn `LSS3PF` Concealed 8" Thermostatic Shower Set on East wall (`X = -18.289m` on Fellini Oliva tile face)
    const thermostaticShowerSet = buildArmstrongConcealedShowerSet({
      namePrefix: 'showerRoom.thermostaticShowerSet',
      finish: 'PF',
      style: 'langbourn',
      slideRailOffsetXM: -0.24,
    });
    thermostaticShowerSet.position.set(-18.289, trayTopY, trayCenterZ);
    thermostaticShowerSet.rotation.y = wallFacingToRotY('west');
    showerGroup.add(thermostaticShowerSet);

    scene.add(showerGroup);
  }

  // =========================================================================
  // ROOM 20 DRY-ZONE SANITARYWARE & ACCESSORIES (`'PF'` PEWTER SPECIFICATION)
  // Lefroy Brooks `Lissa Doon` 3TH console washstand (`LB 7503` on open Pewter tubular stand w/ towel rails),
  // deck-mounted Perrin & Rowe Armstrong 3-hole basin mixer w/ pop-up waste (`3606PF`), exposed `6303PF`
  // bottle trap, Pewter-framed mirror, Lefroy Brooks `Lissa Doon` close-coupled WC (`LB 7507 + LB 7508`),
  // `6258PF` paper holder & `6221PF` robe hook on angled North wall
  // =========================================================================
  {
    const pfBrass = getBathroomBrassMaterials('PF');
    const sanitaryGroup = new THREE.Group();
    sanitaryGroup.name = 'showerRoom.sanitaryware';

    // 1. Lefroy Brooks `Lissa Doon` 62cm 3TH Console Washstand (`LB 7503` + `LB 4970BN` Brushed Silver Nickel Stand)
    //    Fitted with Perrin & Rowe Langbourn `3955PF` 3-hole deck mixer w/ pop-up waste & exposed `6303PF` bottle trap
    const lissaDoonWashstand = buildLefroyBrooksLissaDoonWashstand({
      namePrefix: 'showerRoom.sanitaryware.lissaDoonWashstand',
      finish: 'PF',
      widthM: 0.62,
      depthM: 0.51,
      rimHeightM: 0.85,
      tapHoles: 3,
      includeDeckMixer: true,
      mixerStyle: 'langbourn',
      mountVariant: 'consoleLegs',
    });
    lissaDoonWashstand.position.set(-21.58, showerFloorY, 3.745);
    lissaDoonWashstand.rotation.y = wallFacingToRotY('north');
    sanitaryGroup.add(lissaDoonWashstand);

    // 2. Pewter-framed wall mirror (`X = -21.58m`, slightly proud `-Z` of `Z = 3.745m` wall,
    //    height `0.66m` centered at `showerFloorY + 1.44m` -> spans `showerFloorY + 1.11m..1.77m` = `3.185m..3.845m`,
    //    cleanly above `3606PF` spout top `~3.12m` and below the `3.85m` West eaves!)
    const mirrorGlassMat = new THREE.MeshStandardMaterial({
      color: 0xdce6eb,
      roughness: 0.1,
      metalness: 0.22,
    });
    const mirrorCenterY = showerFloorY + 1.44;
    const mirrorFrameGeo = new THREE.BoxGeometry(0.64, 0.66, 0.024);
    mirrorFrameGeo.computeBoundingSphere();
    const mirrorFrame = new THREE.Mesh(mirrorFrameGeo, pfBrass.primary);
    mirrorFrame.name = 'showerRoom.sanitaryware.mirrorFrame';
    mirrorFrame.position.set(-21.58, mirrorCenterY, 3.731);
    mirrorFrame.castShadow = true;
    sanitaryGroup.add(mirrorFrame);

    const mirrorSurfaceGeo = new THREE.BoxGeometry(0.58, 0.6, 0.008);
    mirrorSurfaceGeo.computeBoundingSphere();
    const mirrorSurface = new THREE.Mesh(mirrorSurfaceGeo, mirrorGlassMat);
    mirrorSurface.name = 'showerRoom.sanitaryware.mirror';
    mirrorSurface.position.set(-21.58, mirrorCenterY, 3.717);
    sanitaryGroup.add(mirrorSurface);

    // 3. GSI Classic Swirlflush® Close-Coupled WC (`871211` pan + `878111` stepped ceramic cistern) + Perrin & Rowe `6771PF` Lever
    const swirlflushWc = buildLefroyBrooksCharterhouseWc({
      namePrefix: 'showerRoom.sanitaryware.gsiSwirlflushWc',
      finish: 'PF',
      variant: 'closeCoupled',
      collection: 'gsiClassicSwirlflush',
      seatFinish: 'glossWhite',
      leverStyle: 'langbourn',
    });
    swirlflushWc.position.set(-20.62, showerFloorY, 3.733);
    swirlflushWc.rotation.y = wallFacingToRotY('north');
    sanitaryGroup.add(swirlflushWc);

    // 5. Perrin & Rowe Langbourn `6447PF` Wall Toilet Paper Holder on South wall pier (`X = -20.24m`)
    const paperHolder = buildArmstrongPaperHolder({
      namePrefix: 'showerRoom.sanitaryware.paperHolder',
      finish: 'PF',
      style: 'langbourn',
    });
    paperHolder.position.set(-20.24, showerFloorY + 0.66, 3.745);
    paperHolder.rotation.y = wallFacingToRotY('north');
    sanitaryGroup.add(paperHolder);

    // 6. Perrin & Rowe `6221PF` Coat/Robe Hook on angled North wall (`[-22.19, 1.905] -> [-18.92, 2.34]`, thickness `0.28m`)
    //    Mounted on exact room-side plaster face (`+0.14m` along inward normal) at `u = 2.68m` (`X ≈ -19.552m, Z ≈ 2.397m`)
    const northWallDx = -18.92 - -22.19;
    const northWallDz = 2.34 - 1.905;
    const northWallLen = Math.hypot(northWallDx, northWallDz);
    const northWallTx = northWallDx / northWallLen;
    const northWallTz = northWallDz / northWallLen;
    const northWallNx = -northWallTz;
    const northWallNz = northWallTx;
    const hookAlongWallU = 2.68;
    const northWallHalfThickness = 0.14;
    const robeHook = buildArmstrongRobeHook({
      namePrefix: 'showerRoom.sanitaryware.robeHook',
      finish: 'PF',
      style: 'langbourn',
    });

    // 7. Vogue UK Regency Tall `LG013WM` Brushed Nickel Wall-Mounted Towel Warmer on clear North wall stretch (u = 1.85m)
    const regencyWarmer = new THREE.Group();
    regencyWarmer.name = 'showerRoom.heatedTowelRail';
    const warmerU = 1.85;
    regencyWarmer.position.set(
      -22.19 + northWallTx * warmerU + northWallNx * northWallHalfThickness,
      showerFloorY + 0.42,
      1.905 + northWallTz * warmerU + northWallNz * northWallHalfThickness
    );
    regencyWarmer.rotation.y = Math.atan2(northWallNx, northWallNz);

    const warmerUprightGeo = new THREE.CylinderGeometry(0.014, 0.014, 1.18, 12);
    warmerUprightGeo.computeBoundingSphere();
    const warmerBarGeo = new THREE.CylinderGeometry(0.011, 0.011, 0.5, 12);
    warmerBarGeo.computeBoundingSphere();
    const warmerStayGeo = new THREE.CylinderGeometry(0.009, 0.012, 0.068, 10);
    warmerStayGeo.computeBoundingSphere();

    for (const [sideTag, sx] of [
      ['west', -0.25],
      ['east', 0.25],
    ] as const) {
      const up = new THREE.Mesh(warmerUprightGeo, pfBrass.primary);
      up.name = `showerRoom.heatedTowelRail.upright.${sideTag}`;
      up.position.set(sx, 0.59, 0.068);
      up.castShadow = true;
      regencyWarmer.add(up);

      for (const [bIdx, by] of [0.12, 1.06].entries()) {
        const stay = new THREE.Mesh(warmerStayGeo, pfBrass.primary);
        stay.name = `showerRoom.heatedTowelRail.stay.${sideTag}_${bIdx + 1}`;
        stay.rotation.x = Math.PI * 0.5;
        stay.position.set(sx, by, 0.034);
        tagHighLodDetail(stay);
        regencyWarmer.add(stay);
      }
    }
    for (const [rIdx, ry] of [0.16, 0.36, 0.56, 0.76, 0.96, 1.12].entries()) {
      const bar = new THREE.Mesh(warmerBarGeo, pfBrass.primary);
      bar.name = `showerRoom.heatedTowelRail.bar_${rIdx + 1}`;
      bar.rotation.z = Math.PI * 0.5;
      bar.position.set(0, ry, 0.068);
      bar.castShadow = true;
      tagHighLodDetail(bar);
      regencyWarmer.add(bar);
    }
    sanitaryGroup.add(regencyWarmer);
    robeHook.position.set(
      -22.19 + northWallTx * hookAlongWallU + northWallNx * northWallHalfThickness,
      showerFloorY + 1.68,
      1.905 + northWallTz * hookAlongWallU + northWallNz * northWallHalfThickness
    );
    robeHook.rotation.y = Math.atan2(northWallNx, northWallNz);
    sanitaryGroup.add(robeHook);

    scene.add(sanitaryGroup);
  }

  // =========================================================================
  // BEDROOM 3 BUILT-IN NORTH WARDROBE (`J-B02`: `X = -22.19m..-20.31m, Z = +3.895m..+4.435m`)
  // Seated inside the surveyed `-142mm` sunken NW alcove (`Y = 1.938m`, stepping up to `2.08m` at `Z = 4.68m`)
  // =========================================================================
  {
    const bed3WardGroup = new THREE.Group();
    bed3WardGroup.name = 'bedroom3.northWardrobe';
    const wardMinX = -22.19;
    const wardMaxX = -20.31;
    const wardW = wardMaxX - wardMinX; // 1.88m
    const wardD = 0.54; // Z = +3.895m .. +4.435m (leaves 24.5cm of sunken 1.938m alcove floor in front of doors!)
    const centerZ = 4.165;
    const bed3CollarY = 5.05;
    const bed3WestEavesY = 3.85;
    const bed3EastEavesY = 4.12;
    const bed3CollarWestX = -20.85;
    const bed3CollarEastX = -18.76;

    const getBed3VaultCeilingYAtX = (wx: number): number => {
      if (wx < bed3CollarWestX) {
        return (
          bed3WestEavesY +
          ((wx - -22.19) / (bed3CollarWestX - -22.19)) * (bed3CollarY - bed3WestEavesY)
        );
      }
      if (wx > bed3CollarEastX) {
        return (
          bed3CollarY -
          ((wx - bed3CollarEastX) / (-18.285 - bed3CollarEastX)) * (bed3CollarY - bed3EastEavesY)
        );
      }
      return bed3CollarY;
    };

    // Full-height vaulted wardrobe carcass (`X = -22.19m..-20.31m, Y = 1.938m..5.05m`, seated on sunken alcove floor)
    const carcassShape = new THREE.Shape();
    carcassShape.moveTo(wardMinX, bed3AlcoveFloorY);
    carcassShape.lineTo(wardMaxX, bed3AlcoveFloorY);
    carcassShape.lineTo(wardMaxX, bed3CollarY);
    carcassShape.lineTo(bed3CollarWestX, bed3CollarY);
    carcassShape.lineTo(wardMinX, bed3WestEavesY);
    carcassShape.closePath();
    const carcassGeo = new THREE.ExtrudeGeometry(carcassShape, {
      depth: wardD,
      bevelEnabled: false,
    });
    carcassGeo.translate(0, 0, centerZ - wardD / 2);
    carcassGeo.computeBoundingSphere();
    const carcass = new THREE.Mesh(carcassGeo, wardrobeMat);
    carcass.name = 'bedroom3.northWardrobe.carcass';
    carcass.castShadow = true;
    carcass.receiveShadow = true;
    bed3WardGroup.add(carcass);

    // Single one-piece raked Shaker crown cornice moulding following the vaulted ceiling profile along the South face (`Z = 4.425m..4.465m`)
    const corniceH = 0.044;
    const corniceShape = new THREE.Shape();
    corniceShape.moveTo(wardMinX, bed3WestEavesY - corniceH);
    corniceShape.lineTo(bed3CollarWestX, bed3CollarY - corniceH);
    corniceShape.lineTo(wardMaxX, bed3CollarY - corniceH);
    corniceShape.lineTo(wardMaxX, bed3CollarY);
    corniceShape.lineTo(bed3CollarWestX, bed3CollarY);
    corniceShape.lineTo(wardMinX, bed3WestEavesY);
    corniceShape.closePath();
    const corniceGeo = new THREE.ExtrudeGeometry(corniceShape, {
      depth: 0.04,
      bevelEnabled: false,
    });
    corniceGeo.translate(0, 0, 4.425);
    corniceGeo.computeBoundingSphere();
    const corniceSeg = new THREE.Mesh(corniceGeo, wardrobeMat);
    corniceSeg.name = 'bedroom3.northWardrobe.cornice';
    corniceSeg.castShadow = true;
    corniceSeg.receiveShadow = true;
    bed3WardGroup.add(corniceSeg);

    // 4 ceiling-height Shaker wardrobe doors (2 pairs) along the South face (`Z = +4.448m`) above a 292mm Shaker plinth (`1.938m -> 2.230m`)
    const doorBaseY = bed3FloorY + 0.15;
    const corniceClearance = 0.046;
    const doorSpanW = wardW - 0.12;
    const doorStep = doorSpanW / 4;
    for (let i = 0; i < 4; i++) {
      const x0 = wardMinX + 0.06 + i * doorStep + 0.005;
      const x1 = wardMinX + 0.06 + (i + 1) * doorStep - 0.005;
      const doorW = x1 - x0;
      const doorX = (x0 + x1) / 2;
      const hLeft = getBed3VaultCeilingYAtX(x0) - corniceClearance - doorBaseY;
      const hRight = getBed3VaultCeilingYAtX(x1) - corniceClearance - doorBaseY;
      const maxDoorH = Math.max(hLeft, hRight);
      const dIdx = bed3WardGroup.children.length;
      addShakerWardrobeDoor(bed3WardGroup, {
        x: doorX,
        y: doorBaseY + maxDoorH / 2,
        z: 4.448,
        width: doorW,
        height: maxDoorH,
        heightLeft: hLeft,
        heightRight: hRight,
        alongZ: false,
        normalSign: 1,
        handleSide: i % 2 === 0 ? 'right' : 'left',
        namePrefix: `bedroom3.northWardrobe.door_${i + 1}`,
      });
      ensureNamedAddedChildren(
        bed3WardGroup,
        dIdx,
        `bedroom3.northWardrobe.door_${i + 1}`,
        true
      );
    }

    // 142mm Solid Oak Step Riser & Bullnose Nosing at `Z = +4.68m` (`Y = 1.938m -> 2.080m`) into Bedroom 3's sunken NW wardrobe alcove!
    {
      const alcoveSpanX = wardMaxX - wardMinX;
      const alcoveCenterX = (wardMinX + wardMaxX) * 0.5;
      const alcoveRise = bed3FloorY - bed3AlcoveFloorY; // 0.142m
      const alcoveRiserGeo = new THREE.BoxGeometry(alcoveSpanX, alcoveRise, 0.028);
      alcoveRiserGeo.computeBoundingSphere();
      const alcoveRiser = new THREE.Mesh(alcoveRiserGeo, oakFloorMat);
      alcoveRiser.name = 'bedroom3.alcoveStep.riser';
      alcoveRiser.userData.isArchitecturalShell = true;
      alcoveRiser.position.set(alcoveCenterX, bed3AlcoveFloorY + alcoveRise * 0.5, 4.666);
      alcoveRiser.castShadow = true;
      alcoveRiser.receiveShadow = true;
      scene.add(alcoveRiser);

      const alcoveNosingGeo = new THREE.CylinderGeometry(0.015, 0.015, alcoveSpanX, 14);
      alcoveNosingGeo.rotateZ(Math.PI / 2);
      alcoveNosingGeo.computeBoundingSphere();
      const alcoveNosing = new THREE.Mesh(alcoveNosingGeo, antiqueOakSkirtingMat);
      alcoveNosing.name = 'bedroom3.alcoveStep.nosing';
      alcoveNosing.userData.isArchitecturalShell = true;
      alcoveNosing.position.set(alcoveCenterX, bed3FloorY - 0.014, 4.652);
      alcoveNosing.castShadow = true;
      tagHighLodDetail(alcoveNosing);
      scene.add(alcoveNosing);

      // Flush painted Shaker base plinth across bedroom3.northWardrobe (below doorBaseY = 2.230m, flush with Shaker door stiles at Z = 4.456m)
      const wardFrontStileZ = 4.456;
      const wardPlinthH = doorBaseY - 0.004 - (bed3AlcoveFloorY + 0.002);
      const wardPlinthD = wardFrontStileZ - 4.435;
      const wardPlinthGeo = new THREE.BoxGeometry(wardW, wardPlinthH, wardPlinthD);
      wardPlinthGeo.computeBoundingSphere();
      const wardPlinth = new THREE.Mesh(wardPlinthGeo, wardrobeMat);
      wardPlinth.name = 'bedroom3.northWardrobe.basePlinth';
      wardPlinth.position.set(
        alcoveCenterX,
        bed3AlcoveFloorY + 0.002 + wardPlinthH * 0.5,
        4.435 + wardPlinthD * 0.5
      );
      wardPlinth.castShadow = true;
      wardPlinth.receiveShadow = true;
      bed3WardGroup.add(wardPlinth);

      // Stop Wimborne White alcove skirtings cleanly (0mm gap, square butt) at the Z = 4.456m wardrobe cheeks
      for (const [alcSkirtName, alcPath] of [
        [
          'bedroom3.alcoveMitredSkirting',
          [
            [-22.19, 4.66],
            [-22.19, wardFrontStileZ],
          ] as const,
        ],
        [
          'bedroom3.alcoveEastMitredSkirting',
          [
            [-20.31, wardFrontStileZ],
            [-20.31, 4.66],
          ] as const,
        ],
      ] as const) {
        const sunkenSkirtGeo = buildMitredWallSkirtingGeometry(alcPath, bed3AlcoveFloorY);
        sunkenSkirtGeo.computeBoundingSphere();
        const sunkenSkirt = new THREE.Mesh(sunkenSkirtGeo, wimborneWhiteJoineryMat);
        sunkenSkirt.name = alcSkirtName;
        sunkenSkirt.userData.isArchitecturalShell = true;
        sunkenSkirt.receiveShadow = true;
        scene.add(sunkenSkirt);
      }
    }

    // Vaulted dividing walls sealing `Z = 3.82m` (`4.815m` North / `5.05m` South), `X = -20.235m` (`1.938m..5.05m`), and `Z = 4.68m` (`2.075m..5.05m/4.12m`)
    const showerSouthUpperShape = new THREE.Shape();
    showerSouthUpperShape.moveTo(-22.19, showerWestEavesY);
    showerSouthUpperShape.lineTo(-20.168, showerWestEavesY);
    showerSouthUpperShape.lineTo(-20.168, showerCollarY);
    showerSouthUpperShape.lineTo(bed3CollarWestX, showerCollarY);
    showerSouthUpperShape.closePath();
    const showerSouthUpperGeo = new THREE.ExtrudeGeometry(showerSouthUpperShape, {
      depth: 0.075,
      bevelEnabled: false,
    });
    showerSouthUpperGeo.translate(0, 0, 3.82 - 0.075);
    showerSouthUpperGeo.computeBoundingSphere();
    const showerSouthUpperWall = new THREE.Mesh(showerSouthUpperGeo, warmRoomPlasterMat);
    showerSouthUpperWall.name = 'showerRoom.southWestUpperGable';
    showerSouthUpperWall.userData.isArchitecturalShell = true;
    showerSouthUpperWall.castShadow = true;
    showerSouthUpperWall.receiveShadow = true;
    scene.add(showerSouthUpperWall);

    const northAlcoveGableShape = new THREE.Shape();
    northAlcoveGableShape.moveTo(-22.19, bed3WestEavesY);
    northAlcoveGableShape.lineTo(-20.16, bed3WestEavesY);
    northAlcoveGableShape.lineTo(-20.16, bed3CollarY);
    northAlcoveGableShape.lineTo(bed3CollarWestX, bed3CollarY);
    northAlcoveGableShape.closePath();
    const northAlcoveGableGeo = new THREE.ExtrudeGeometry(northAlcoveGableShape, {
      depth: 0.075,
      bevelEnabled: false,
    });
    northAlcoveGableGeo.translate(0, 0, 3.82);
    northAlcoveGableGeo.computeBoundingSphere();
    const northAlcoveGable = new THREE.Mesh(northAlcoveGableGeo, warmRoomPlasterMat);
    northAlcoveGable.name = 'bedroom3.northAlcoveUpperGable';
    northAlcoveGable.userData.isArchitecturalShell = true;
    northAlcoveGable.castShadow = true;
    northAlcoveGable.receiveShadow = true;
    scene.add(northAlcoveGable);

    const alcoveSideUpperWallGeo = new THREE.BoxGeometry(
      0.142,
      bed3CollarY - bed3AlcoveFloorY,
      4.68 - 3.895
    );
    alcoveSideUpperWallGeo.computeBoundingSphere();
    const alcoveSideUpperWall = new THREE.Mesh(
      alcoveSideUpperWallGeo,
      warmRoomPlasterMat
    );
    alcoveSideUpperWall.name = 'bedroom3.alcoveSideUpperGable';
    alcoveSideUpperWall.userData.isArchitecturalShell = true;
    alcoveSideUpperWall.position.set(
      -20.239,
      (bed3AlcoveFloorY + bed3CollarY) / 2,
      (3.895 + 4.68) / 2
    );
    alcoveSideUpperWall.castShadow = true;
    alcoveSideUpperWall.receiveShadow = true;
    scene.add(alcoveSideUpperWall);

    const buildSouthWetroomBackingShape = (withNichePocket: boolean): THREE.Shape => {
      const sh = new THREE.Shape();
      sh.moveTo(-20.31, showerFloorY);
      sh.lineTo(-18.285, showerFloorY);
      sh.lineTo(-18.285, bed3EastEavesY);
      sh.lineTo(bed3CollarEastX, bed3CollarY);
      sh.lineTo(-20.31, bed3CollarY);
      sh.closePath();
      if (withNichePocket) {
        const trayTopDatumY = showerFloorY + 0.1 + 0.048;
        const nCenterY = trayTopDatumY + SHOWER_NICHE_SPEC.centerOffsetAboveTrayM;
        const nHalfW = SHOWER_NICHE_SPEC.widthM * 0.5;
        const nHalfH = SHOWER_NICHE_SPEC.heightM * 0.5;
        const pocket = new THREE.Path();
        pocket.moveTo(SHOWER_NICHE_SPEC.centerX - nHalfW, nCenterY - nHalfH);
        pocket.lineTo(SHOWER_NICHE_SPEC.centerX - nHalfW, nCenterY + nHalfH);
        pocket.lineTo(SHOWER_NICHE_SPEC.centerX + nHalfW, nCenterY + nHalfH);
        pocket.lineTo(SHOWER_NICHE_SPEC.centerX + nHalfW, nCenterY - nHalfH);
        pocket.closePath();
        sh.holes.push(pocket);
      }
      return sh;
    };

    const nichePocketDepth = SHOWER_NICHE_SPEC.depthM - SHOWER_WETROOM_SPEC.wallTileThicknessM; // 0.087m (4.613m -> 4.700m)
    const showerSouthPocketGeo = new THREE.ExtrudeGeometry(buildSouthWetroomBackingShape(true), {
      depth: nichePocketDepth,
      bevelEnabled: false,
    });
    showerSouthPocketGeo.translate(0, 0, 4.613);
    showerSouthPocketGeo.computeBoundingSphere();
    const showerSouthPocketMesh = new THREE.Mesh(showerSouthPocketGeo, warmRoomPlasterMat);
    showerSouthPocketMesh.name = 'bedroom3.showerSouthUpperGable.studCore';
    showerSouthPocketMesh.userData.isArchitecturalShell = true;
    scene.add(showerSouthPocketMesh);

    const showerSouthGableGeo = new THREE.ExtrudeGeometry(buildSouthWetroomBackingShape(false), {
      depth: 0.142 - nichePocketDepth, // 0.055m solid backing (4.700m -> 4.755m Bedroom 3 plaster face)
      bevelEnabled: false,
    });
    showerSouthGableGeo.translate(0, 0, 4.613 + nichePocketDepth);
    showerSouthGableGeo.computeBoundingSphere();
    const showerSouthGable = new THREE.Mesh(showerSouthGableGeo, warmRoomPlasterMat);
    showerSouthGable.name = 'bedroom3.showerSouthUpperGable';
    showerSouthGable.userData.isArchitecturalShell = true;
    showerSouthGable.castShadow = true;
    showerSouthGable.receiveShadow = true;
    scene.add(showerSouthGable);

    // Continuous 45°-mitred Wimborne White skirting on Bedroom 3's 2.08m main floor along Z = +4.755m and X = -18.285m
    const bed3NorthSkirtGeo = buildMitredWallSkirtingGeometry(
      [
        [-20.31, 4.68],
        [-20.31, 4.755],
        [-18.285, 4.755],
        [-18.285, 6.855],
      ],
      bed3FloorY
    );
    bed3NorthSkirtGeo.computeBoundingSphere();
    const bed3NorthSkirt = new THREE.Mesh(
      bed3NorthSkirtGeo,
      wimborneWhiteJoineryMat
    );
    bed3NorthSkirt.name = 'bedroom3.northWallMitredSkirting';
    bed3NorthSkirt.userData.isArchitecturalShell = true;
    bed3NorthSkirt.castShadow = true;
    bed3NorthSkirt.receiveShadow = true;
    scene.add(bed3NorthSkirt);

    scene.add(bed3WardGroup);
  }
}
