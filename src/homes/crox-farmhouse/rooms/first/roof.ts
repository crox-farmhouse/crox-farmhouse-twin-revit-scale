import * as THREE from 'three';
import { buildPolygonalFloorSlab } from '../../../../engine/geometry/index.ts';
import { createWelshSlateRoofTexture } from '../../../../engine/textures/procedural-textures.ts';
import {
  MAIN_EAST_WING_ROTATION_Y,
  transformEastWingPoint,
  transformEastWingTuple,
} from '../../structure/ground-floor-materials.ts';
import type { SceneBuilderContext } from '../../../../types/scene.ts';
import type { createFirstFloorMaterials } from '../../structure/first-floor-materials.ts';
import type { createFirstFloorShellKit } from '../../structure/first-floor-shell-kit.ts';

/**
 * First-floor ceilings, L-plan Welsh slate roof and chimneys.
 */
export function buildFirstFloorCeilingsAndRoof(
  ctx: SceneBuilderContext,
  kit: Pick<ReturnType<typeof createFirstFloorMaterials>, 'exteriorBrickMat' | 'plasterMat' | 'stoneSillMat' | 'upperWallTopY'> &
    Pick<ReturnType<typeof createFirstFloorShellKit>, 'applyWorldSpaceBrickUVs'>,
  eastWingCtx: SceneBuilderContext = ctx
): void {
  const { ceilingMeshGroup } = ctx;
  const ewCeilingMeshGroup = eastWingCtx.ceilingMeshGroup;
  const {
    applyWorldSpaceBrickUVs,
    exteriorBrickMat,
    plasterMat,
    stoneSillMat,
    upperWallTopY,
  } = kit;
  // =========================================================================
  // 8. FIRST FLOOR CEILINGS & WATER-TIGHT L-PLAN WELSH SLATE ROOF + 5 CHIMNEYS
  //    Added to `ceilingMeshGroup` (`Y = 4.38m..7.38m`)
  // =========================================================================
  const slateTex = createWelshSlateRoofTexture();
  const slateRoofMat = new THREE.MeshStandardMaterial({
    map: slateTex,
    bumpMap: slateTex,
    bumpScale: 0.018,
    color: 0xffffff,
    roughness: 0.78, // Natural matte riven Welsh slate (Issue #13: not shiny like a solar panel)
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  const ridgeLeadMat = new THREE.MeshStandardMaterial({
    color: 0x383d45,
    roughness: 0.44,
    metalness: 0.38,
    side: THREE.DoubleSide,
  });

  const soffitFasciaMat = new THREE.MeshStandardMaterial({
    color: 0xefeae0,
    roughness: 0.38,
    metalness: 0.03,
    side: THREE.DoubleSide,
  });

  // Heritage pale sage-green painted rainwater gutters along the eaves (Issue #11)
  const gutterPaleGreenMat = new THREE.MeshStandardMaterial({
    color: 0x8fa693,
    roughness: 0.38,
    metalness: 0.22,
    side: THREE.DoubleSide,
  });

  // Traditional black/anthracite cast-iron rainwater downpipes, hoppers & pipe brackets (Issues #11 & #12)
  const gutterCastIronMat = new THREE.MeshStandardMaterial({
    color: 0x1e2228,
    roughness: 0.36,
    metalness: 0.65,
    side: THREE.DoubleSide,
  });

  const terracottaPotMat = new THREE.MeshStandardMaterial({
    color: 0xb65e3e,
    roughness: 0.68,
    metalness: 0.04,
  });

  const sootFlueMat = new THREE.MeshStandardMaterial({
    color: 0x161618,
    roughness: 0.9,
  });

  // A. First Floor Ceiling Slabs:
  // Issue #5: Vaulted East Wing Ceiling (Upper Landing, Family Bathroom, Main Bedroom: X = -17.90m..-4.52m)
  // Roof starts to pitch inward above the windows (skeilings from Y = 3.86m at Z = -2.52m / +2.42m up to the raised 4.52m collar ceiling across Z = -1.15m..+1.05m)
  const upperCeilingMat = plasterMat.clone();
  upperCeilingMat.side = THREE.DoubleSide;
  // Helper to build an exact 4-corner sloped or horizontal vaulted ceiling quad slab (`0.03m` thick)
  const buildVaultedCeilingQuad = (
    name: string,
    p0: THREE.Vector3,
    p1: THREE.Vector3,
    p2: THREE.Vector3,
    p3: THREE.Vector3,
    thickness = 0.03,
    targetGroup: THREE.Group = ceilingMeshGroup
  ): THREE.Mesh => {
    const edgeA = new THREE.Vector3().subVectors(p1, p0);
    const edgeB = new THREE.Vector3().subVectors(p3, p0);
    const normal = new THREE.Vector3().crossVectors(edgeA, edgeB).normalize();
    if (normal.y < 0) {
      normal.negate();
    }
    const t0 = p0.clone().addScaledVector(normal, thickness);
    const t1 = p1.clone().addScaledVector(normal, thickness);
    const t2 = p2.clone().addScaledVector(normal, thickness);
    const t3 = p3.clone().addScaledVector(normal, thickness);

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    const pushTri = (
      a: THREE.Vector3,
      b: THREE.Vector3,
      c: THREE.Vector3,
      n: THREE.Vector3
    ): void => {
      for (const v of [a, b, c]) {
        positions.push(v.x, v.y, v.z);
        normals.push(n.x, n.y, n.z);
        uvs.push(v.x * 0.5, v.z * 0.5);
      }
    };
    const pushFace = (
      a: THREE.Vector3,
      b: THREE.Vector3,
      c: THREE.Vector3,
      d: THREE.Vector3,
      n: THREE.Vector3
    ): void => {
      pushTri(a, b, c, n);
      pushTri(a, c, d, n);
    };

    // Underside (room-facing, -normal) & top side (+normal)
    pushFace(p0, p3, p2, p1, normal.clone().negate());
    pushFace(t0, t1, t2, t3, normal);

    for (const [e0, e1, e2, e3] of [
      [p0, p1, t1, t0],
      [p1, p2, t2, t1],
      [p2, p3, t3, t2],
      [p3, p0, t0, t3],
    ] as const) {
      const dir = new THREE.Vector3().subVectors(e1, e0);
      if (dir.lengthSq() > 1e-6) {
        const edgeN = new THREE.Vector3().crossVectors(dir, normal).normalize();
        pushFace(e0, e1, e2, e3, edgeN);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    const mesh = new THREE.Mesh(geo, upperCeilingMat);
    mesh.name = name;
    mesh.userData.isArchitecturalShell = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    targetGroup.add(mesh);
    return mesh;
  };

  // Issue #5 & #9: Vaulted East Wing Ceiling (Upper Landing, Family Bathroom, Main Bedroom: X = -17.90m..-4.52m, zero flat side strips!)
  // Pitches directly from the North exterior wall (`Z = -2.54m, Y = 4.16m`) and South exterior wall (`Z = +2.44m, Y = 4.16m`)
  // up to the raised 4.52m horizontal collar ceiling (`Z = -1.15m..+1.05m`), with its West edge following the angled Upper Landing West cross-wall!
  {
    const eastWallX = -4.52;
    const collarCeilingY = 4.52;
    const collarNorthZ = -1.15;
    const collarSouthZ = 1.05;
    const northPitchBaseZ = -2.54;
    const southPitchBaseZ = 2.44;
    const xWestAtZ = (z: number): number =>
      -17.55 + ((z - -2.5) / (2.68 - -2.5)) * (-17.92 - -17.55) - 0.04;

    // 1. Continuous North pitched skeiling (`Z = -2.54m, Y = 4.16m -> Z = -1.15m, Y = 4.52m`)
    buildVaultedCeilingQuad(
      'eastWing.vaultedCeiling.northSkeiling',
      new THREE.Vector3(xWestAtZ(northPitchBaseZ), upperWallTopY, northPitchBaseZ),
      new THREE.Vector3(eastWallX, upperWallTopY, northPitchBaseZ),
      new THREE.Vector3(eastWallX, collarCeilingY, collarNorthZ),
      new THREE.Vector3(xWestAtZ(collarNorthZ), collarCeilingY, collarNorthZ),
      0.03,
      ewCeilingMeshGroup
    );

    // 2. Central raised horizontal collar ceiling (`Y = 4.52m, Z = -1.15m..+1.05m`)
    buildVaultedCeilingQuad(
      'eastWing.vaultedCeiling.collar',
      new THREE.Vector3(xWestAtZ(collarNorthZ), collarCeilingY, collarNorthZ),
      new THREE.Vector3(eastWallX, collarCeilingY, collarNorthZ),
      new THREE.Vector3(eastWallX, collarCeilingY, collarSouthZ),
      new THREE.Vector3(xWestAtZ(collarSouthZ), collarCeilingY, collarSouthZ),
      0.03,
      ewCeilingMeshGroup
    );

    // 3. Continuous South pitched skeiling (`Z = +1.05m, Y = 4.52m -> Z = +2.44m, Y = 4.16m`)
    buildVaultedCeilingQuad(
      'eastWing.vaultedCeiling.southSkeiling',
      new THREE.Vector3(xWestAtZ(collarSouthZ), collarCeilingY, collarSouthZ),
      new THREE.Vector3(eastWallX, collarCeilingY, collarSouthZ),
      new THREE.Vector3(eastWallX, upperWallTopY, southPitchBaseZ),
      new THREE.Vector3(xWestAtZ(southPitchBaseZ), upperWallTopY, southPitchBaseZ),
      0.03,
      ewCeilingMeshGroup
    );
  }

  // Issue #2, #6, #7 & #8: Partially Vaulted Ceiling over Bedroom 2 (zero flat side strips!)
  // Pitches directly from the West exterior wall (`X = -22.19m, Y = 4.16m`) and East cross-wall (`Y = 4.16m`)
  // up to the raised central horizontal collar ceiling at `collarCeilingY = 5.02m`,
  // following the exact angled North & South walls, East cross-wall, and SE hallway cut-out of Bedroom 2!
  {
    const collarCeilingY = 5.02;
    const skeilingBaseY = upperWallTopY; // 4.16m
    const westWallX = -22.25;
    const westInnerWallX = -22.19;
    const collarWestX = -20.95;
    // West skeiling passes through Y = 4.16m at X = -22.19m (matching northWallUpperGable & southWallUpperGable — Issue #7!)
    const westWallSkeilingY =
      skeilingBaseY -
      ((westInnerWallX - westWallX) / (collarWestX - westInnerWallX)) *
        (collarCeilingY - skeilingBaseY);

    // East cross-wall runs from (-17.169, -2.568) to (-17.918, 1.05).
    // Parallel collar East edge offset West so eastSkeiling is a 100% planar slope meeting the North wall seamlessly (Issue #7!):
    const collarEastNorthX = -18.144;
    const collarEastSouthX = -18.92;

    const zNorthAtX = (wx: number): number =>
      -3.24 + ((wx - -22.19) / (-16.876 - -22.19)) * (-2.529 - -3.24);
    const zSouthAtX = (wx: number): number =>
      1.925 + ((wx - -22.19) / (-18.92 - -22.19)) * (2.36 - 1.925);

    // 1. West pitched skeiling slope (`X = -22.19m, Y = 4.16m` -> `X = -20.95m, Y = 5.02m`)
    buildVaultedCeilingQuad(
      'bedroom2.vaultedCeiling.westSkeiling',
      new THREE.Vector3(westWallX, westWallSkeilingY, zNorthAtX(westWallX)),
      new THREE.Vector3(collarWestX, collarCeilingY, zNorthAtX(collarWestX)),
      new THREE.Vector3(collarWestX, collarCeilingY, zSouthAtX(collarWestX)),
      new THREE.Vector3(westWallX, westWallSkeilingY, zSouthAtX(westWallX))
    );

    // 2. Central raised horizontal collar ceiling (`Y = 5.02m`, matching the angled East cross-wall & cut-out!)
    const collarSlab = buildPolygonalFloorSlab(
      ceilingMeshGroup,
      [
        [collarWestX, zNorthAtX(collarWestX)],
        [collarEastNorthX, zNorthAtX(collarEastNorthX)],
        [collarEastSouthX, 1.05],
        [collarEastSouthX, zSouthAtX(collarEastSouthX)],
        [collarWestX, zSouthAtX(collarWestX)],
      ],
      collarCeilingY + 0.015,
      0.03,
      upperCeilingMat,
      0.5
    );
    collarSlab.name = 'bedroom2.vaultedCeiling.collar';

    // 3. Planar East pitched skeiling slope (`Y = 5.02m` -> East cross-wall at `Y = 4.16m`, meeting North wall at `zNorthAtX(-17.169)`)
    buildVaultedCeilingQuad(
      'bedroom2.vaultedCeiling.eastSkeiling',
      new THREE.Vector3(collarEastNorthX, collarCeilingY, zNorthAtX(collarEastNorthX)),
      new THREE.Vector3(-17.169, skeilingBaseY, zNorthAtX(-17.169)),
      new THREE.Vector3(-17.918, skeilingBaseY, 1.05),
      new THREE.Vector3(collarEastSouthX, collarCeilingY, 1.05)
    );
  }

  // Flat 4.16m ceiling over the Cut-Out Hallway, central Shower Room & West Wing Corridor (`Z = 1.05m..8.27m`)
  // (Carves out Bedroom 3 so Bedroom 3 has a vaulted ceiling — Issue #15!)
  {
    const [landingSouthWestX, , landingSouthWestZ] = transformEastWingTuple(-18.04, 0, 2.688);
    const [landingSouthEastX, , landingSouthEastZ] = transformEastWingTuple(-16.956, 0, 2.688);
    buildPolygonalFloorSlab(
      ceilingMeshGroup,
      [
        [-22.32, 1.905],
        [-18.92, 2.34],
        [-18.92, 1.05],
        [-17.65, 1.05],
        [landingSouthWestX, landingSouthWestZ],
        [landingSouthEastX, landingSouthEastZ],
        [-17.09, 8.27],
        [-18.4, 8.27],
        [-18.4, 4.85],
        [-20.25, 4.85],
        [-20.25, 4.1],
        [-22.32, 4.1],
      ],
      upperWallTopY + 0.027,
      0.03,
      upperCeilingMat,
      0.5
    );
  }

  // Issue #15: Partially Vaulted Ceiling over Bedroom 3 (`X = -22.25m..-18.40m, Z = 4.10m/4.85m..8.27m`)
  // Pitches up from the West exterior wall (`X = -22.19m, Y = 4.16m`) and East corridor wall (`X = -18.475m, Y = 4.16m`)
  // to a raised horizontal collar ceiling at `collarCeilingY = 4.52m` (`X = -20.85m..-19.25m`)!
  {
    const collarCeilingY = 4.52;
    const skeilingBaseY = upperWallTopY; // 4.16m
    const westWallX = -22.25;
    const westInnerWallX = -22.19;
    const collarWestX = -20.85;
    const collarEastX = -19.25;
    const eastInnerWallX = -18.475;
    const eastWallX = -18.4;

    const westWallSkeilingY =
      skeilingBaseY -
      ((westInnerWallX - westWallX) / (collarWestX - westInnerWallX)) *
        (collarCeilingY - skeilingBaseY);
    const eastWallSkeilingY =
      skeilingBaseY -
      ((eastWallX - eastInnerWallX) / (eastInnerWallX - collarEastX)) *
        (collarCeilingY - skeilingBaseY);

    // 1. West pitched skeiling slope (`X = -22.25m..-20.85m, Z = 4.10m..8.27m`)
    buildVaultedCeilingQuad(
      'bedroom3.vaultedCeiling.westSkeiling',
      new THREE.Vector3(westWallX, westWallSkeilingY, 4.1),
      new THREE.Vector3(collarWestX, collarCeilingY, 4.1),
      new THREE.Vector3(collarWestX, collarCeilingY, 8.27),
      new THREE.Vector3(westWallX, westWallSkeilingY, 8.27)
    );

    // 2. Central L-shaped raised horizontal collar ceiling (`Y = 4.52m` over NW wardrobe alcove + main bedroom)
    const bed3CollarSlab = buildPolygonalFloorSlab(
      ceilingMeshGroup,
      [
        [collarWestX, 4.1],
        [-20.25, 4.1],
        [-20.25, 4.85],
        [collarEastX, 4.85],
        [collarEastX, 8.27],
        [collarWestX, 8.27],
      ],
      collarCeilingY + 0.015,
      0.03,
      upperCeilingMat,
      0.5
    );
    bed3CollarSlab.name = 'bedroom3.vaultedCeiling.collar';

    // 3. East pitched skeiling slope (`X = -19.25m, Y = 4.52m` -> `X = -18.475m, Y = 4.16m` across `Z = 4.85m..8.27m`)
    buildVaultedCeilingQuad(
      'bedroom3.vaultedCeiling.eastSkeiling',
      new THREE.Vector3(collarEastX, collarCeilingY, 4.85),
      new THREE.Vector3(eastWallX, eastWallSkeilingY, 4.85),
      new THREE.Vector3(eastWallX, eastWallSkeilingY, 8.27),
      new THREE.Vector3(collarEastX, collarCeilingY, 8.27)
    );
  }

  // Issue #6: Partially Vaulted Ceiling over Bedroom 4 (`Z = 8.25m..11.66m`, zero flat side strips!)
  // Pitches directly from the West exterior wall (`X = -22.25m, Y = 4.16m`) and East courtyard wall (`Y = 4.16m`)
  // up to the raised central horizontal collar ceiling at `collarCeilingY = 4.52m` (`X = -20.85m..-18.75m`)!
  {
    const collarCeilingY = 4.52;
    const skeilingBaseY = upperWallTopY; // 4.16m
    const westWallX = -22.25;
    const collarWestX = -20.85;
    const collarEastX = -18.75;
    const zNorth = 8.25;
    const zSouth = 11.66;

    // 1. West pitched skeiling slope (`X = -22.25m, Y = 4.16m` -> `X = -20.85m, Y = 4.52m`)
    buildVaultedCeilingQuad(
      'bedroom4.vaultedCeiling.westSkeiling',
      new THREE.Vector3(westWallX, skeilingBaseY, zNorth),
      new THREE.Vector3(collarWestX, collarCeilingY, zNorth),
      new THREE.Vector3(collarWestX, collarCeilingY, zSouth),
      new THREE.Vector3(westWallX, skeilingBaseY, zSouth)
    );

    // 2. Central raised horizontal collar ceiling (`X = -20.85m..-18.75m, Y = 4.52m`)
    buildVaultedCeilingQuad(
      'bedroom4.vaultedCeiling.collar',
      new THREE.Vector3(collarWestX, collarCeilingY, zNorth),
      new THREE.Vector3(collarEastX, collarCeilingY, zNorth),
      new THREE.Vector3(collarEastX, collarCeilingY, zSouth),
      new THREE.Vector3(collarWestX, collarCeilingY, zSouth)
    );

    // 3. East pitched skeiling slope (`X = -18.75m, Y = 4.52m` -> East courtyard wall at `Y = 4.16m`)
    buildVaultedCeilingQuad(
      'bedroom4.vaultedCeiling.eastSkeiling',
      new THREE.Vector3(collarEastX, collarCeilingY, zNorth),
      new THREE.Vector3(-17.09, skeilingBaseY, zNorth),
      new THREE.Vector3(-17.22, skeilingBaseY, zSouth),
      new THREE.Vector3(collarEastX, collarCeilingY, zSouth)
    );
  }

  // -------------------------------------------------------------------------
  // B. Mathematically Exact Coplanar L-Plan Roof Slope Builder
  //    Constructs a 3D prism roof facet from 4 world-space points
  //    `p0, p1` (along ridge at Y = 5.82m) and `p2, p3` (along eaves at Y = 4.18m)
  //    ordered counter-clockwise when viewed from above (+Y).
  //    Eliminates all L-corner overlap and guarantees horizontal slate courses!
  // -------------------------------------------------------------------------
  const createCoplanarRoofQuadMesh = (
    p0: THREE.Vector3,
    p1: THREE.Vector3,
    p2: THREE.Vector3,
    p3: THREE.Vector3,
    thickness: number
  ): THREE.Mesh => {
    // uVec runs horizontally along the eave edge (p3 -> p2), falling back to the ridge edge (p0 -> p1) when p2 === p3 (triangular facet)
    const eaveEdge = new THREE.Vector3().subVectors(p2, p3);
    const uVec =
      eaveEdge.lengthSq() > 1e-4
        ? eaveEdge.normalize()
        : new THREE.Vector3().subVectors(p0, p1).normalize();
    // Raw vector from eave (p3) up to ridge (p0)
    const eaveToRidge = new THREE.Vector3().subVectors(p0, p3);
    // Project out any uVec component to get the exact up-slope unit vector vVec
    const vVec = eaveToRidge
      .clone()
      .addScaledVector(uVec, -eaveToRidge.dot(uVec))
      .normalize();
    // Outward roof normal (pointing up and out from the slope)
    const normal = new THREE.Vector3().crossVectors(uVec, vVec).normalize();
    if (normal.y < 0) {
      normal.negate();
    }

    const b0 = p0.clone().addScaledVector(normal, -thickness);
    const b1 = p1.clone().addScaledVector(normal, -thickness);
    const b2 = p2.clone().addScaledVector(normal, -thickness);
    const b3 = p3.clone().addScaledVector(normal, -thickness);

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    // Compensate for slateTex.repeat (7.5 x 3.2) so each 8-slate x 16-course tile spans 1.60m x 1.20m in world space (Issue #13)
    const tileU = 1.6 * 7.5;
    const tileV = 1.2 * 3.2;

    const pushTriangle = (
      a: THREE.Vector3,
      b: THREE.Vector3,
      c: THREE.Vector3,
      faceNormal: THREE.Vector3
    ): void => {
      for (const v of [a, b, c]) {
        positions.push(v.x, v.y, v.z);
        normals.push(faceNormal.x, faceNormal.y, faceNormal.z);
        const rel = new THREE.Vector3().subVectors(v, p3);
        uvs.push(rel.dot(uVec) / tileU, rel.dot(vVec) / tileV);
      }
    };

    const pushQuad = (
      a: THREE.Vector3,
      b: THREE.Vector3,
      c: THREE.Vector3,
      d: THREE.Vector3,
      faceNormal: THREE.Vector3
    ): void => {
      pushTriangle(a, b, c, faceNormal);
      pushTriangle(a, c, d, faceNormal);
    };

    // Top weather surface (+normal) & bottom underside (-normal)
    pushQuad(p0, p3, p2, p1, normal);
    pushQuad(b0, b1, b2, b3, normal.clone().negate());

    // Perimeter edge faces (ridge, eaves, and verges/valleys)
    const sideEdges: ReadonlyArray<readonly [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3]> = [
      [p3, p2, b2, b3], // Eaves edge
      [p1, p0, b0, b1], // Ridge edge
      [p0, p3, b3, b0], // Left verge/valley edge
      [p2, p1, b1, b2], // Right verge/valley edge
    ];
    for (const [e0, e1, e2, e3] of sideEdges) {
      const edgeDir = new THREE.Vector3().subVectors(e1, e0);
      if (edgeDir.lengthSq() > 1e-5) {
        const edgeNorm = new THREE.Vector3().crossVectors(edgeDir, normal).normalize();
        pushQuad(e0, e1, e2, e3, edgeNorm);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

    const mesh = new THREE.Mesh(geo, slateRoofMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    ceilingMeshGroup.add(mesh);
    return mesh;
  };

  // Exact Roof Elevation & Plan Coordinates for the Two-Storey L-Wing:
  // Note: Eaves sit at Y = 4.18m (below the 4.59m Kitchen ridge),
  // and the Main House roof ridge rises to Y = 5.82m (~1.23m above the Kitchen roof ridge).
  const eaveY = 4.18;
  const ridgeY = 5.82;
  const slateThick = 0.055;

  const nsRidgeX = -19.79;
  const westEaveX = -22.69;
  const eastEaveX = -16.89;
  const northGableZ = -3.62;
  const northGableRidgeZ = -3.22;
  const southGableZ = 11.95;

  const ewRidgeZ = -0.05;
  const ewNorthEaveZ = -3.0;
  const ewSouthEaveZ = 2.9;
  const ewEastGableX = -4.4;
  // Local East-West X where the East-West ridge (z_ew = -0.05) meets the North-South ridge (world X = -19.79m)
  const ewRidgeJunctionLocalX = -20.162;
  // Local East-West X where the East-West South eave (z_ew = 2.90m) meets the angled East Courtyard eave (0.22m East of the brick wall)
  const ewCourtyardValleyLocalX = -16.435;

  // Key 3D Roof Junction Points (transformed from East-West Wing local frame into world space):
  const pRidgeJunction = transformEastWingPoint(ewRidgeJunctionLocalX, ridgeY, ewRidgeZ);
  const pRidgeEastGable = transformEastWingPoint(ewEastGableX, ridgeY, ewRidgeZ);
  const pRidgeNorthGable = new THREE.Vector3(nsRidgeX, ridgeY, northGableRidgeZ);
  const pRidgeSouthGable = new THREE.Vector3(nsRidgeX, ridgeY, southGableZ);

  const pCourtyardValleyEave = transformEastWingPoint(ewCourtyardValleyLocalX, eaveY, ewSouthEaveZ);
  const pNorthValleyEave = transformEastWingPoint(eastEaveX, eaveY, ewNorthEaveZ);
  const pEastGableSouthEave = transformEastWingPoint(ewEastGableX, eaveY, ewSouthEaveZ);
  const pEastGableNorthEave = transformEastWingPoint(ewEastGableX, eaveY, ewNorthEaveZ);

  // 1. East-West Wing — South (Courtyard) Slate Slope (Trapezoid from Courtyard Valley to East Gable)
  createCoplanarRoofQuadMesh(
    pRidgeJunction,
    pRidgeEastGable,
    pEastGableSouthEave,
    pCourtyardValleyEave,
    slateThick
  );

  // 2. East-West Wing — North Slate Slope (Trapezoid from East Gable to North Valley)
  createCoplanarRoofQuadMesh(
    pRidgeEastGable,
    pRidgeJunction,
    pNorthValleyEave,
    pEastGableNorthEave,
    slateThick
  );

  // 3. North-South Front Wing — West Front Slate Slope (Full Rectangle from North Gable to South Gable)
  createCoplanarRoofQuadMesh(
    pRidgeNorthGable,
    pRidgeSouthGable,
    new THREE.Vector3(westEaveX, eaveY, southGableZ),
    new THREE.Vector3(westEaveX, eaveY, northGableZ),
    slateThick
  );

  // 4. North-South Front Wing — East Courtyard Slate Slope (Trapezoid from South Gable to Courtyard Valley)
  createCoplanarRoofQuadMesh(
    pRidgeSouthGable,
    pRidgeJunction,
    pCourtyardValleyEave,
    new THREE.Vector3(eastEaveX, eaveY, southGableZ),
    slateThick
  );

  // 5. North-South Front Wing — North-East Gable Slate Slope (Triangle from Valley Junction to North Gable)
  createCoplanarRoofQuadMesh(
    pRidgeJunction,
    pRidgeNorthGable,
    pNorthValleyEave,
    pNorthValleyEave,
    slateThick
  );

  // -------------------------------------------------------------------------
  // C. Lead Ridge Caps & Lead-Lined Valley Flashing Channels (Photos 1 & 2)
  // -------------------------------------------------------------------------
  // East-West Lead Ridge Roll Cap (local X = -20.162m to -4.40m at local Z = ewRidgeZ, Y = 5.83m)
  const ewRidgeLen = ewEastGableX - ewRidgeJunctionLocalX;
  const ewRidgeCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.062, 0.062, ewRidgeLen + 0.04, 16, 1, false, 0, Math.PI),
    ridgeLeadMat
  );
  ewRidgeCap.rotation.z = Math.PI / 2;
  ewRidgeCap.position.set((ewRidgeJunctionLocalX + ewEastGableX) / 2, ridgeY + 0.01, ewRidgeZ);
  ewRidgeCap.castShadow = true;
  ewCeilingMeshGroup.add(ewRidgeCap);

  // North-South Lead Ridge Roll Cap (Z = northGableRidgeZ to +11.95m at X = -19.79m, Y = 5.83m)
  const nsRidgeLen = southGableZ - northGableRidgeZ;
  const nsRidgeCap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.062, 0.062, nsRidgeLen + 0.04, 16, 1, false, 0, Math.PI),
    ridgeLeadMat
  );
  nsRidgeCap.rotation.x = Math.PI / 2;
  nsRidgeCap.rotation.z = Math.PI;
  nsRidgeCap.position.set(nsRidgeX, ridgeY + 0.01, (northGableRidgeZ + southGableZ) / 2);
  nsRidgeCap.castShadow = true;
  ceilingMeshGroup.add(nsRidgeCap);

  // Lead-Lined V-Channel Valley Flashing Strips along both Valley Intersections (coplanar with the two adjacent roof slopes)
  for (const [valleyEavePt, wingDirA, wingDirB] of [
    [
      pCourtyardValleyEave,
      new THREE.Vector3().subVectors(pEastGableSouthEave, pCourtyardValleyEave).normalize(),
      new THREE.Vector3(eastEaveX - pCourtyardValleyEave.x, 0, southGableZ - pCourtyardValleyEave.z).normalize(),
    ],
    [
      pNorthValleyEave,
      new THREE.Vector3().subVectors(pEastGableNorthEave, pNorthValleyEave).normalize(),
      new THREE.Vector3(0, 0, -1),
    ],
  ] as const) {
    const cStart = new THREE.Vector3(pRidgeJunction.x, pRidgeJunction.y + 0.008, pRidgeJunction.z);
    const cEnd = new THREE.Vector3(valleyEavePt.x, valleyEavePt.y + 0.008, valleyEavePt.z);
    const wingW = 0.135;
    const aStart = cStart.clone().addScaledVector(wingDirA, wingW);
    const aEnd = cEnd.clone().addScaledVector(wingDirA, wingW);
    const bStart = cStart.clone().addScaledVector(wingDirB, wingW);
    const bEnd = cEnd.clone().addScaledVector(wingDirB, wingW);

    const vPositions = new Float32Array([
      cStart.x, cStart.y, cStart.z,
      cEnd.x, cEnd.y, cEnd.z,
      aEnd.x, aEnd.y, aEnd.z,
      cStart.x, cStart.y, cStart.z,
      aEnd.x, aEnd.y, aEnd.z,
      aStart.x, aStart.y, aStart.z,
      cStart.x, cStart.y, cStart.z,
      bStart.x, bStart.y, bStart.z,
      bEnd.x, bEnd.y, bEnd.z,
      cStart.x, cStart.y, cStart.z,
      bEnd.x, bEnd.y, bEnd.z,
      cEnd.x, cEnd.y, cEnd.z,
    ]);
    const valleyGeo = new THREE.BufferGeometry();
    valleyGeo.setAttribute('position', new THREE.BufferAttribute(vPositions, 3));
    valleyGeo.computeVertexNormals();
    valleyGeo.computeBoundingBox();
    valleyGeo.computeBoundingSphere();

    const valleyFlashing = new THREE.Mesh(valleyGeo, ridgeLeadMat);
    valleyFlashing.name = 'mainHouse.roof.valleyFlashing';
    ceilingMeshGroup.add(valleyFlashing);
  }

  // -------------------------------------------------------------------------
  // D. Three Brick Gable Pentagons (East, North & South) + White Painted Bargeboards,
  //    Boxed Eaves Soffits, Fascias, Pale Sage-Green Half-Round Gutters & Cast-Iron Downpipes
  // -------------------------------------------------------------------------
  // 1. East Gable Brick Pentagon at local X = -4.64m..-4.40m (above Main Bedroom East wall, Y = 4.16m..5.82m)
  const ewEastGableShape = new THREE.Shape();
  ewEastGableShape.moveTo(-2.63, 0);
  ewEastGableShape.lineTo(2.78, 0);
  ewEastGableShape.lineTo(2.78, 0.11);
  ewEastGableShape.lineTo(0.05, ridgeY - upperWallTopY);
  ewEastGableShape.lineTo(-2.63, 0.11);
  ewEastGableShape.closePath();
  const ewEastGableGeo = new THREE.ExtrudeGeometry(ewEastGableShape, {
    depth: 0.21,
    bevelEnabled: false,
  });
  ewEastGableGeo.rotateY(Math.PI / 2);
  applyWorldSpaceBrickUVs(ewEastGableGeo, -4.61, upperWallTopY, 0);
  const ewEastGable = new THREE.Mesh(ewEastGableGeo, exteriorBrickMat);
  ewEastGable.position.set(-4.61, upperWallTopY, 0);
  ewEastGable.castShadow = true;
  ewEastGable.receiveShadow = true;
  ewCeilingMeshGroup.add(ewEastGable);

  // 2. North Gable Brick Pentagon above Bedroom 2 collinear North wall ([-22.47, -3.359] -> [-17.11, -2.642])
  const nsGableShape = new THREE.Shape();
  nsGableShape.moveTo(-22.47, 0);
  nsGableShape.lineTo(-17.11, 0);
  nsGableShape.lineTo(-17.11, 0.11);
  nsGableShape.lineTo(nsRidgeX, ridgeY - upperWallTopY);
  nsGableShape.lineTo(-22.47, 0.11);
  nsGableShape.closePath();

  const nsNorthGableLocalShape = new THREE.Shape();
  nsNorthGableLocalShape.moveTo(-2.68, 0);
  nsNorthGableLocalShape.lineTo(2.68, 0);
  nsNorthGableLocalShape.lineTo(2.68, 0.11);
  nsNorthGableLocalShape.lineTo(0, ridgeY - upperWallTopY);
  nsNorthGableLocalShape.lineTo(-2.68, 0.11);
  nsNorthGableLocalShape.closePath();

  const nsNorthGableGeo = new THREE.ExtrudeGeometry(nsNorthGableLocalShape, {
    depth: 0.21,
    bevelEnabled: false,
  });
  nsNorthGableGeo.translate(0, 0, -0.15);
  applyWorldSpaceBrickUVs(
    nsNorthGableGeo,
    nsRidgeX,
    upperWallTopY,
    -3.0
  );
  const nsNorthGable = new THREE.Mesh(nsNorthGableGeo, exteriorBrickMat);
  nsNorthGable.position.set(nsRidgeX, upperWallTopY, -3.0);
  nsNorthGable.rotation.y = MAIN_EAST_WING_ROTATION_Y;
  nsNorthGable.castShadow = true;
  nsNorthGable.receiveShadow = true;
  ceilingMeshGroup.add(nsNorthGable);

  // 3. South Gable Brick Pentagon at Z = +11.53m..+11.77m (exterior leaf of Bedroom 4 South wall, Y = 4.16m..5.82m)
  // Offset 4.2cm South of bedroom4.southWallUpperGable (`Z = 11.488m`) so zero brick is visible inside Bedroom 4 (Issue #7)
  const nsSouthGableGeo = new THREE.ExtrudeGeometry(nsGableShape, {
    depth: 0.24,
    bevelEnabled: false,
  });
  applyWorldSpaceBrickUVs(nsSouthGableGeo, 0, upperWallTopY, 11.53);
  const nsSouthGable = new THREE.Mesh(nsSouthGableGeo, exteriorBrickMat);
  nsSouthGable.position.set(0, upperWallTopY, 11.53);
  nsSouthGable.castShadow = true;
  nsSouthGable.receiveShadow = true;
  ceilingMeshGroup.add(nsSouthGable);

  // White Painted Verge Bargeboards along all 3 Gables (East, North & South) using an exact right-handed orthonormal basis (Issue #3)
  const addVergeBargeboard = (
    pStart: THREE.Vector3,
    pEnd: THREE.Vector3,
    targetGroup: THREE.Group = ceilingMeshGroup
  ): void => {
    const len = pStart.distanceTo(pEnd);
    const mid = new THREE.Vector3().addVectors(pStart, pEnd).multiplyScalar(0.5);
    const xAxis = new THREE.Vector3().subVectors(pEnd, pStart).normalize();
    const horizLen = Math.hypot(xAxis.x, xAxis.z);
    const zAxis =
      horizLen > 1e-5
        ? new THREE.Vector3(-xAxis.z / horizLen, 0, xAxis.x / horizLen)
        : new THREE.Vector3(0, 0, 1);
    const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis).normalize();
    const basisMat = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);

    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(len + 0.04, 0.15, 0.038),
      soffitFasciaMat
    );
    mesh.position.set(mid.x, mid.y - 0.05, mid.z);
    mesh.quaternion.setFromRotationMatrix(basisMat);
    mesh.castShadow = true;
    targetGroup.add(mesh);
  };

  // East Gable Bargeboards (at local X = -4.41m in ewCeilingMeshGroup)
  addVergeBargeboard(
    new THREE.Vector3(-4.41, eaveY, ewNorthEaveZ),
    new THREE.Vector3(-4.41, ridgeY, ewRidgeZ),
    ewCeilingMeshGroup
  );
  addVergeBargeboard(
    new THREE.Vector3(-4.41, eaveY, ewSouthEaveZ),
    new THREE.Vector3(-4.41, ridgeY, ewRidgeZ),
    ewCeilingMeshGroup
  );

  // North & South Gable Bargeboards
  for (const [ridgePt, westPt, eastPt] of [
    [
      new THREE.Vector3(nsRidgeX, ridgeY, northGableRidgeZ + 0.01),
      new THREE.Vector3(westEaveX, eaveY, northGableZ + 0.01),
      new THREE.Vector3(pNorthValleyEave.x, eaveY, pNorthValleyEave.z + 0.01),
    ],
    [
      new THREE.Vector3(nsRidgeX, ridgeY, southGableZ - 0.01),
      new THREE.Vector3(westEaveX, eaveY, southGableZ - 0.01),
      new THREE.Vector3(eastEaveX, eaveY, southGableZ - 0.01),
    ],
  ] as const) {
    addVergeBargeboard(westPt, ridgePt, ceilingMeshGroup);
    addVergeBargeboard(eastPt, ridgePt, ceilingMeshGroup);
  }

  // White Painted Eaves Fascia Boards, Boxed Eaves Soffits & Pale Sage-Green Half-Round Gutters at Y = 4.18m (Issue #11, Issue #3 & Issue #1 L-corner join)
  for (const [fasciaZ, signZ, fasciaSpanX, fasciaMidX, soffitSpanX, soffitMidX, gutterSpanX, gutterMidX] of [
    [ewNorthEaveZ + 0.02, -1, 12.49, -10.645, 12.49, -10.645, 12.49, -10.645],       // East-West North eaves (local X = -16.89m..-4.40m)
    [ewSouthEaveZ - 0.02, 1, 12.057, -10.4285, 12.275, -10.5375, 12.087, -10.4435],  // East-West South courtyard eaves extended cleanly into L-corner
  ] as const) {
    const fascia = new THREE.Mesh(
      new THREE.BoxGeometry(fasciaSpanX, 0.15, 0.024),
      soffitFasciaMat
    );
    fascia.position.set(fasciaMidX, eaveY - 0.04, fasciaZ);
    fascia.castShadow = true;
    ewCeilingMeshGroup.add(fascia);

    const soffit = new THREE.Mesh(
      new THREE.BoxGeometry(soffitSpanX, 0.022, 0.24),
      soffitFasciaMat
    );
    soffit.position.set(soffitMidX, eaveY - 0.105, fasciaZ - signZ * 0.11);
    ewCeilingMeshGroup.add(soffit);

    const gutter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.056, 0.056, gutterSpanX, 14, 1, true, Math.PI, Math.PI),
      gutterPaleGreenMat
    );
    gutter.name = 'mainHouse.gutter.ew';
    gutter.rotation.z = Math.PI / 2;
    gutter.position.set(gutterMidX, eaveY - 0.01, fasciaZ + signZ * 0.068);
    ewCeilingMeshGroup.add(gutter);
  }

  // West Front Eaves Fascia, Soffit & Gutter (straight along X = westEaveX = -22.69m)
  const westFrontSpanZ = southGableZ - northGableZ;
  const westFrontMidZ = (northGableZ + southGableZ) * 0.5;
  {
    const westFasciaX = westEaveX + 0.02;
    const westFascia = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, 0.15, westFrontSpanZ),
      soffitFasciaMat
    );
    westFascia.position.set(westFasciaX, eaveY - 0.04, westFrontMidZ);
    westFascia.castShadow = true;
    ceilingMeshGroup.add(westFascia);

    const westSoffit = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.022, westFrontSpanZ),
      soffitFasciaMat
    );
    westSoffit.position.set(westFasciaX + 0.11, eaveY - 0.105, westFrontMidZ);
    ceilingMeshGroup.add(westSoffit);

    const westGutter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.056, 0.056, westFrontSpanZ, 14, 1, true, Math.PI, Math.PI),
      gutterPaleGreenMat
    );
    westGutter.name = 'mainHouse.gutter.ns';
    westGutter.rotation.x = Math.PI / 2;
    westGutter.position.set(westFasciaX - 0.068, eaveY - 0.01, westFrontMidZ);
    ceilingMeshGroup.add(westGutter);
  }

  // East Courtyard Eaves Fascia, Soffit & Gutter (aligned with the -2.63° angled East Courtyard wall from pCourtyardValleyEave to southGableZ — Issue #3 & Issue #1 L-corner join)
  {
    const eastEaveDx = eastEaveX - pCourtyardValleyEave.x;
    const eastEaveDz = southGableZ - pCourtyardValleyEave.z;
    const eastCourtyardSpanLen = Math.hypot(eastEaveDx, eastEaveDz);
    const eastCourtyardAngleY = Math.atan2(eastEaveDx, eastEaveDz);
    const eastCourtyardMidX = (pCourtyardValleyEave.x + eastEaveX) * 0.5;
    const eastCourtyardMidZ = (pCourtyardValleyEave.z + southGableZ) * 0.5;

    const eastEaveGroup = new THREE.Group();
    eastEaveGroup.position.set(eastCourtyardMidX, 0, eastCourtyardMidZ);
    eastEaveGroup.rotation.y = eastCourtyardAngleY;

    const eastFascia = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, 0.15, eastCourtyardSpanLen + 0.022),
      soffitFasciaMat
    );
    eastFascia.position.set(-0.02, eaveY - 0.04, -0.011);
    eastFascia.castShadow = true;
    eastEaveGroup.add(eastFascia);

    const eastSoffit = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.022, eastCourtyardSpanLen),
      soffitFasciaMat
    );
    eastSoffit.position.set(-0.13, eaveY - 0.105, 0);
    eastEaveGroup.add(eastSoffit);

    const eastGutter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.056, 0.056, eastCourtyardSpanLen + 0.052, 14, 1, true, Math.PI, Math.PI),
      gutterPaleGreenMat
    );
    eastGutter.name = 'mainHouse.gutter.ns';
    eastGutter.rotation.x = Math.PI / 2;
    eastGutter.position.set(0.048, eaveY - 0.01, -0.026);
    eastEaveGroup.add(eastGutter);

    ceilingMeshGroup.add(eastEaveGroup);

    // Mitered L-Corner Boxed Eaves Soffit, Brick Eave Backing & Gutter Angle Union at [-16.703, 3.958, 2.902] (Issue #1)
    buildPolygonalFloorSlab(
      ceilingMeshGroup,
      [
        [-16.715, 2.765],
        [-16.42, 2.805],
        [-16.485, 3.008],
        [-16.507, 3.045],
        [-16.725, 3.045],
      ],
      eaveY - 0.105 + 0.011,
      0.022,
      soffitFasciaMat,
      0.5
    ).name = 'mainHouse.roof.courtyardCornerSoffit';

    const cornerEaveBackingGeo = new THREE.BoxGeometry(0.26, 0.18, 0.3);
    applyWorldSpaceBrickUVs(cornerEaveBackingGeo, -16.82, eaveY - 0.01, 2.75);
    const cornerEaveBacking = new THREE.Mesh(cornerEaveBackingGeo, exteriorBrickMat);
    cornerEaveBacking.position.set(-16.82, eaveY - 0.01, 2.75);
    ceilingMeshGroup.add(cornerEaveBacking);

    const gutterCornerUnion = new THREE.Mesh(
      new THREE.BoxGeometry(0.118, 0.058, 0.118),
      gutterPaleGreenMat
    );
    gutterCornerUnion.name = 'mainHouse.gutter.cornerUnion';
    gutterCornerUnion.position.set(-16.437, eaveY - 0.036, 3.073);
    gutterCornerUnion.rotation.y = MAIN_EAST_WING_ROTATION_Y * 0.5;
    ceilingMeshGroup.add(gutterCornerUnion);
  }

  // Two-Storey Cast-Iron Rainwater Downpipes with Uniform-Radius Swan-Neck Offsets, Pipe Collars & Shoes (Issues #11, #12, #3 & #4)
  const dpPipeR = 0.036;
  for (const [dpName, px, pz, groundY, gutterOffsetX, gutterOffsetZ, parentGroup] of [
    ['downpipe.bootLobbyCourtyard', -9.58, 2.715, -0.1, 0, 0.233, ewCeilingMeshGroup],      // Boot Lobby / Dining Room junction
    ['downpipe.mainBedroomEastCourtyard', -4.88, 2.715, 0.0, 0, 0.233, ewCeilingMeshGroup], // Main Bedroom / Dining Room East Courtyard wall (Issue #4)
    ['downpipe.studyLobbySouthEast', -17.04, 11.42, -0.3, 0.222, 0, ceilingMeshGroup],      // Study Lobby SE courtyard corner
  ] as const) {
    const dpGroup = new THREE.Group();
    dpGroup.name = `mainHouse.${dpName}`;

    const shaftTopY = eaveY - 0.24;
    const shaftBotY = groundY + 0.12;
    const dpH = shaftTopY - shaftBotY;

    // Main vertical cast-iron rainwater downpipe shaft against the brick wall (radius = 0.036m)
    const dpShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(dpPipeR, dpPipeR, dpH, 16),
      gutterCastIronMat
    );
    dpShaft.position.set(px, shaftBotY + dpH / 2, pz);
    dpShaft.castShadow = true;
    dpShaft.receiveShadow = true;
    dpGroup.add(dpShaft);

    // Gutter drop outlet nozzle directly under the half-round eaves gutter trough
    const gutterNozzle = new THREE.Mesh(
      new THREE.CylinderGeometry(dpPipeR + 0.008, dpPipeR + 0.002, 0.055, 16),
      gutterCastIronMat
    );
    gutterNozzle.position.set(
      px + gutterOffsetX,
      eaveY - 0.055,
      pz + gutterOffsetZ
    );
    gutterNozzle.castShadow = true;
    dpGroup.add(gutterNozzle);

    // Continuous uniform-radius (0.036m) tubular swan-neck connecting the gutter underside to the vertical shaft
    const swanCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(px + gutterOffsetX, eaveY - 0.04, pz + gutterOffsetZ),
      new THREE.Vector3(px + gutterOffsetX, eaveY - 0.095, pz + gutterOffsetZ),
      new THREE.Vector3(
        px + gutterOffsetX * 0.5,
        eaveY - 0.155,
        pz + gutterOffsetZ * 0.5
      ),
      new THREE.Vector3(px, shaftTopY + 0.025, pz),
      new THREE.Vector3(px, shaftTopY - 0.015, pz),
    ]);
    const swanNeck = new THREE.Mesh(
      new THREE.TubeGeometry(swanCurve, 18, dpPipeR, 16, false),
      gutterCastIronMat
    );
    swanNeck.castShadow = true;
    dpGroup.add(swanNeck);

    // Issue #4: Connect the adjacent single-storey Kitchen South Gutter (local X = -4.65m, Y = 3.125m, Z = 2.585m)
    // into `downpipe.mainBedroomEastCourtyard` at Y ≈ 2.95m ([-5.028, 2.952, 4.367]) with the exact same 0.036m pipe radius!
    if (dpName === 'downpipe.mainBedroomEastCourtyard') {
      const kitchenGutterX = -4.66;
      const kitchenGutterY = 3.125;
      const kitchenGutterZ = 2.585;

      const branchNozzle = new THREE.Mesh(
        new THREE.CylinderGeometry(dpPipeR + 0.008, dpPipeR + 0.002, 0.05, 16),
        gutterCastIronMat
      );
      branchNozzle.position.set(kitchenGutterX, kitchenGutterY - 0.045, kitchenGutterZ);
      branchNozzle.castShadow = true;
      dpGroup.add(branchNozzle);

      const branchCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(kitchenGutterX, kitchenGutterY - 0.035, kitchenGutterZ),
        new THREE.Vector3(kitchenGutterX, 3.04, kitchenGutterZ),
        new THREE.Vector3((kitchenGutterX + px) * 0.5, 2.985, (kitchenGutterZ + pz) * 0.5),
        new THREE.Vector3(px, 2.93, pz),
        new THREE.Vector3(px, 2.89, pz),
      ]);
      const branchTube = new THREE.Mesh(
        new THREE.TubeGeometry(branchCurve, 16, dpPipeR, 16, false),
        gutterCastIronMat
      );
      branchTube.castShadow = true;
      dpGroup.add(branchTube);
    }

    // Cast-iron eared wall fixing collars every ~1.25m up the brick wall
    for (let cy = groundY + 0.45; cy < eaveY - 0.35; cy += 1.25) {
      const collar = new THREE.Mesh(
        new THREE.CylinderGeometry(dpPipeR + 0.006, dpPipeR + 0.006, 0.028, 16),
        gutterCastIronMat
      );
      collar.position.set(px, cy, pz);
      dpGroup.add(collar);

      const earBracket = new THREE.Mesh(
        new THREE.BoxGeometry(
          gutterOffsetX !== 0 ? 0.024 : 0.13,
          0.028,
          gutterOffsetZ !== 0 ? 0.024 : 0.13
        ),
        gutterCastIronMat
      );
      earBracket.position.set(px, cy, pz);
      dpGroup.add(earBracket);
    }

    // Bottom cast-iron rainwater outfall shoe at courtyard ground level (uniform 0.036m radius)
    const shoeDirX = gutterOffsetX !== 0 ? 1 : 0;
    const shoeDirZ = gutterOffsetZ !== 0 ? 1 : 0;
    const shoeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(px, shaftBotY + 0.01, pz),
      new THREE.Vector3(px + shoeDirX * 0.012, groundY + 0.065, pz + shoeDirZ * 0.012),
      new THREE.Vector3(px + shoeDirX * 0.048, groundY + 0.025, pz + shoeDirZ * 0.048),
    ]);
    const bottomShoe = new THREE.Mesh(
      new THREE.TubeGeometry(shoeCurve, 10, dpPipeR, 16, false),
      gutterCastIronMat
    );
    bottomShoe.castShadow = true;
    dpGroup.add(bottomShoe);

    parentGroup.add(dpGroup);
  }

  // -------------------------------------------------------------------------
  // E. 5 Tall Victorian Red-Brick Chimney Stacks with Oversailing Courses & Terracotta Pots
  //    Rising from inside the roof structure (`roofExitY - 0.32m`) through the Two-Storey
  //    Main House Ridge (`Y = 5.60m..6.88m` + pots, Photos 1 & 2, Issue #8: never protruding outside gable walls!)
  // -------------------------------------------------------------------------
  const addVictorianBrickChimneyStack = (
    cx: number,
    cz: number,
    stackW: number,
    stackD: number,
    roofExitY: number,
    topY: number,
    potCount: 2 | 3,
    potAxis: 'x' | 'z',
    targetGroup: THREE.Group = ceilingMeshGroup
  ): void => {
    const stackGroup = new THREE.Group();

    const leadApron = new THREE.Mesh(
      new THREE.BoxGeometry(stackW + 0.12, 0.16, stackD + 0.12),
      ridgeLeadMat
    );
    leadApron.position.set(cx, roofExitY + 0.08, cz);
    stackGroup.add(leadApron);

    // Brick chimney shaft starts inside the roof space just below roofExitY so it never pokes outside the exterior gable wall (Issue #8)
    const shaftBottomY = roofExitY - 0.32;
    const shaftH = topY - shaftBottomY;
    const shaftGeo = new THREE.BoxGeometry(stackW, shaftH, stackD);
    applyWorldSpaceBrickUVs(shaftGeo, cx, shaftBottomY + shaftH / 2, cz);
    const shaftMesh = new THREE.Mesh(shaftGeo, exteriorBrickMat);
    shaftMesh.position.set(cx, shaftBottomY + shaftH / 2, cz);
    shaftMesh.castShadow = true;
    shaftMesh.receiveShadow = true;
    stackGroup.add(shaftMesh);

    for (const [yOff, expand] of [
      [-0.18, 0.06],
      [-0.1, 0.11],
      [-0.03, 0.06],
    ] as const) {
      const corbelGeo = new THREE.BoxGeometry(stackW + expand, 0.065, stackD + expand);
      applyWorldSpaceBrickUVs(corbelGeo, cx, topY + yOff, cz);
      const corbel = new THREE.Mesh(corbelGeo, exteriorBrickMat);
      corbel.position.set(cx, topY + yOff, cz);
      corbel.castShadow = true;
      stackGroup.add(corbel);
    }

    const flaunchCap = new THREE.Mesh(
      new THREE.BoxGeometry(stackW + 0.08, 0.055, stackD + 0.08),
      stoneSillMat
    );
    flaunchCap.position.set(cx, topY + 0.028, cz);
    stackGroup.add(flaunchCap);

    const spacing = potCount === 3 ? 0.34 : 0.38;
    for (let i = 0; i < potCount; i++) {
      const offset = (i - (potCount - 1) / 2) * spacing;
      const px = potAxis === 'x' ? cx + offset : cx;
      const pz = potAxis === 'z' ? cz + offset : cz;
      const potH = 0.48;

      const potBody = new THREE.Mesh(
        new THREE.CylinderGeometry(0.095, 0.115, potH, 14),
        terracottaPotMat
      );
      potBody.position.set(px, topY + 0.055 + potH / 2, pz);
      potBody.castShadow = true;
      stackGroup.add(potBody);

      const potCollar = new THREE.Mesh(
        new THREE.TorusGeometry(0.102, 0.014, 8, 14),
        terracottaPotMat
      );
      potCollar.rotation.x = Math.PI / 2;
      potCollar.position.set(px, topY + 0.055 + potH - 0.05, pz);
      stackGroup.add(potCollar);

      const flueTop = new THREE.Mesh(
        new THREE.CylinderGeometry(0.078, 0.078, 0.02, 12),
        sootFlueMat
      );
      flueTop.position.set(px, topY + 0.055 + potH + 0.002, pz);
      stackGroup.add(flueTop);
    }

    targetGroup.add(stackGroup);
  };

  // 1. East Gable Stack (above Main Bedroom / Dining Room East chimney breast at local X = -4.84m, Z = -0.015m — 3 pots along Z)
  addVictorianBrickChimneyStack(-4.84, -0.015, 0.72, 1.42, 5.38, 6.66, 3, 'z', ewCeilingMeshGroup);
  // 2. East-West Ridge Stack (above Main Stair Landing / Boot Lobby cross-wall at local X = -13.18m, Z = -0.05m — 2 pots along Z)
  addVictorianBrickChimneyStack(-13.18, -0.05, 0.58, 1.12, 5.4, 6.62, 2, 'z', ewCeilingMeshGroup);
  // 3. North-South Ridge North Stack (above Bedroom 2 / Living Room fireplace at X = -19.95m, Z = +2.18m — 3 pots along X)
  addVictorianBrickChimneyStack(-19.95, 2.18, 1.22, 0.6, 5.4, 6.66, 3, 'x');
  // 4. North-South Ridge Middle Stack (above Bedroom 3 / Sitting Room fireplace at X = -19.85m, Z = +7.98m — 3 pots along X)
  addVictorianBrickChimneyStack(-19.85, 7.98, 1.22, 0.6, 5.4, 6.66, 3, 'x');
  // 5. South Gable Apex Stack (above Bedroom 4 / Study South gable at X = -19.79m, Z = +11.29m — flush inside the house, Issue #8!)
  addVictorianBrickChimneyStack(-19.79, 11.29, 0.96, 0.52, 5.43, 6.6, 2, 'x');
}
